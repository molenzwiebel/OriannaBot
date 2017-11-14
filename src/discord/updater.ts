import debug = require("debug");
import DiscordClient from "./client";
import { Database } from "basie";
import { DiscordServer, DiscordServerModel, Role, User, UserModel, UserPoints } from "../database";
import RiotAPI from "../riot/api";
import parseRange from "../util/ranges";
import Jimp = require("jimp");

/**
 * Handles updating user mastery scores every set interval.
 */
export default class Updater {
    private log = debug("orianna:updater");
    private roleErrorLog = debug("orianna:updater:roles");
    private isUpdating = false;
    private largeFont: any; // jimp.Font is not exported, so we use any
    private smallFont: any; // ^^

    constructor(private discord: DiscordClient, private riotAPI: RiotAPI) {
        // Schedule the update loop.
        setInterval(this.updateLoop, this.discord.config.updateInterval * 1000);

        // Load Jimp fonts and static champion data.
        Jimp.loadFont(Jimp.FONT_SANS_128_WHITE).then(f => this.largeFont = f);
        Jimp.loadFont(Jimp.FONT_SANS_64_WHITE).then(f => this.smallFont = f);
    }

    /**
     * Updates the specified user, refreshing both their mastery ranks
     * and their region ranks (if applicable) on all the servers that the
     * user and Orianna share. This method is public since it can also be
     * invoked manually by users (via commands).
     */
    async updateUser(user: User, updateRanked = false) {
        // If the user has no accounts, and had none before, we can safely skip updating them.
        if (user.accounts.length === 0 && user.latestPointsJson === "{}") {
            user.lastUpdate = new Date();
            return await user.save();
        }

        try {
            const oldTotals = user.latestPoints;
            const newTotals = await this.getChampionTotals(user);

            // Compute score diffs and optionally write difference to database.
            // We aggregate the values clauses first, then do a single insert to optimize database usage.
            const values: string[] = [];

            Object.keys(oldTotals).forEach(champId => {
                const oldValue = oldTotals[+champId] || 0;
                const newValue = newTotals[+champId] || 0;

                if (oldValue === newValue) return;

                // We don't have to worry about SQL injection since this is never user provided.
                values.push(`(${user.id}, ${champId}, ${Date.now()}, ${newValue}, ${newValue - oldValue})`);
            });

            // If we didn't have scores for the champ before, do a diff of 0.
            Object.keys(newTotals).forEach(champId => {
                if (typeof oldTotals[+champId] !== "undefined") return;

                values.push(`(${user.id}, ${champId}, ${Date.now()}, ${newTotals[+champId]}, ${newTotals[+champId]})`);
            });

            // Insert if we had any differences.
            if (values.length) {
                await Database.run(`INSERT INTO scoredelta (user, championId, timestamp, newValue, delta) VALUES ${values.join(", ")}`);
            }

            // Write latest data to database.
            user.latestPoints = newTotals;
            user.lastUpdate = new Date();
            await user.save();

            const tier = user.optedOutOfTierRoles || !updateRanked ? undefined : await this.getUserTier(user);

            // Update the user on all servers we share.
            await Promise.all(this.discord.bot.guilds.filter(x => x.members.has(user.snowflake)).map(guild => {
                return Promise.all([
                    this.updateUserOnGuild(user, guild, oldTotals, newTotals),
                    this.updateRegionRolesOnGuild(user, guild),
                    updateRanked ? this.updateTierRolesOnGuild(user, guild, tier) : Promise.resolve()
                ]);
            }));
        } catch (e) {
            // Just log this. We will try again the next interval anyway, since we delay
            // updating the timestamp until the very end of the update process.
            this.log("Error updating %s (%s): %s", user.username, user.snowflake, e.message);
        }
    }

    /**
     * Refreshes everyone in the specified server, updating their region roles
     * and rank, _without requesting new data_. Basically recomputes all roles,
     * which is useful when the config is changed (compute which roles a user
     * needs to have without suddenly causing a lot of requests).
     */
    async refreshServer(server: DiscordServer) {
        const guild = this.discord.bot.guilds.get(server.snowflake);
        if (!guild) return;

        await Promise.all(guild.members.map(async member => {
            const user = await UserModel.findBy({ snowflake: member.id });
            if (!user) return;

            await Promise.all([
                this.updateUserOnGuild(user, guild, user.latestPoints, user.latestPoints),
                this.updateRegionRolesOnGuild(user, guild)
            ]);
        }));
    }

    /**
     * The actual update loop that refreshes a set amount of users.
     * This is skipped if the previous loop is still in progress, to
     * ensure that we do not end up lagging behind and running out of
     * memory eventually. A warning is printed to announce the skip.
     */
    private updateLoop = async () => {
        if (this.isUpdating) {
            this.log("Warning: Update loop is lagging behind (took more than %d seconds to update %d users). Skipping this loop.", this.discord.config.updateInterval, this.discord.config.updateAmount);
            return;
        }

        this.isUpdating = true;

        const users = await this.getUsersToUpdate();

        // Spread out user updating over the time period.
        const step = Math.ceil(((this.discord.config.updateInterval * 0.90) * 1000) / this.discord.config.updateAmount);
        await users.map((user, i) => new Promise((resolve, reject) => {
            setTimeout(() => {
                this.updateUser(user).then(() => resolve(), e => reject(e));
            }, step * i);
        }));

        this.isUpdating = false;
    };

    /**
     * Updates the specified user on the specified guild. Since the querying of
     * data was already done, this just handles assigning/revoking roles, as well
     * as announcing a promotion if applicable.
     */
    private async updateUserOnGuild(user: User, guild: eris.Guild, oldTotals: UserPoints, newTotals: UserPoints) {
        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server || !server.setupCompleted) return;
        const member = guild.members.get(user.snowflake);
        if (!member) return;

        const oldRoles = this.computeApplicableRoles(server, oldTotals);
        const newRoles = this.computeApplicableRoles(server, newTotals);

        // Debug any missing roles.
        for (const role of server.roles.filter(x => !guild.roles.has(x.snowflake))) {
            try {
                this.roleErrorLog("Warning: Guild " + guild.name + " (config code " + server.configCode + ") is missing role " + role.name);

                const similarName = guild.roles.find(x => x.name === role.name);
                if (similarName) {
                    this.roleErrorLog("Recovered: Reassigned role " + role.name + " in " + guild.name);
                    role.snowflake = similarName.id;
                    await role.save();
                } else {
                    /*this.log("Trying to recreate role " + role.name);
                    const newRole = await this.discord.bot.createRole(guild.id, {
                        name: role.name
                    });
                    if (newRole) {
                        role.snowflake = newRole.id;
                        await role.save();
                        this.log("Role " + role.name + " recreated.");
                    }*/
                }
            } catch (e) {
                this.roleErrorLog("ERROR: Was unable to recreate role " + role.name + " in server " + guild.name);
            }
        }

        // Remove all existing roles managed by Orianna, except the ones included in newRoles.
        await Promise.all(
            server.roles
                .filter(x => member.roles.indexOf(x.snowflake) !== -1) // Now contains all roles managed by Orianna that the user has.
                .filter(x => newRoles.map(x => x.snowflake).indexOf(x.snowflake) === -1) // Now contains every role managed by Orianna not listed in newRoles.
                .filter(x => guild.roles.has(x.snowflake)) // Now only contains roles that exist on the server
                .map(r => this.discord.bot.removeGuildMemberRole(server.snowflake, user.snowflake, r.snowflake))
        );

        // If we have more points than before (no account was removed), check if we should announce promotions.
        const newValue = newTotals[server.championId] || 0;
        if (newValue > (oldTotals[server.championId] || 0)) {
            for (const role of newRoles) {
                if (oldRoles.indexOf(role) !== -1) continue;

                await this.announcePromotion(server, member, role, newValue);
            }
        }

        // Add new roles, except the ones the user already has.
        await Promise.all(
            newRoles
                .filter(x => member.roles.indexOf(x.snowflake) === -1) // contains all roles that the user should have, but doesn't
                .filter(x => guild.roles.has(x.snowflake)) // Now only contains roles that exist on the server
                .map(x => this.discord.bot.addGuildMemberRole(server.snowflake, user.snowflake, x.snowflake))
        );
    }

    /**
     * Computes which roles are applicable for the specified amount of points.
     */
    private computeApplicableRoles(server: DiscordServer, points: UserPoints): Role[] {
        const val = points[server.championId] || 0;
        const total = Object.keys(points).reduce((p, c) => p + points[+c]!, 0);
        const rolesWithRanges = server.roles.map(role => ({ role, range: parseRange(role.range) }));
        const champIdsSorted = Object.keys(points).sort((a, b) => (points[+b] || 0) - (points[+a] || 0)).map(x => +x); // champion ids sorted by points, for Top XX

        // Find all roles within the range.
        return rolesWithRanges.filter(r => {
            if (r.range.type === "lt") return r.range.total ? total < r.range.value : val < r.range.value;
            if (r.range.type === "gt") return r.range.total ? total > r.range.value : val > r.range.value;
            if (r.range.type === "top") return champIdsSorted.slice(0, r.range.value).indexOf(server.championId) !== -1;
            return r.range.total ? (total >= r.range.minimum && total < r.range.maximum) : (val >= r.range.minimum && val < r.range.maximum);
        }).map(x => x.role);
    }

    /**
     * Announces the promotion for the specified user to the specified role. Does
     * nothing if announcements are not enabled on the server.
     */
    private async announcePromotion(server: DiscordServer, member: eris.Member, toRole: Role, points: number) {
        if (!server.announcePromotions) return;
        const guild = this.discord.bot.guilds.get(server.snowflake);
        if (!guild) return;

        const announceChannel = guild.channels.get(server.announceChannelSnowflake) || guild.defaultChannel;
        const image = await Jimp.read("http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + this.discord.championData[server.championId].key + "_0.jpg");

        // Blur image, position it slightly up, darken it a bit.
        // Most of these values were found by just experimenting.
        image.crop(1215 - 850, 30, 800, 220);
        image.brightness(-0.4);
        image.blur(2);
        image.print(this.largeFont, 30, 67, points.toLocaleString());
        image.print(this.smallFont, 42, 20, member.nick || member.username);

        image.getBuffer(Jimp.MIME_PNG, async (err, buf) => {
            if (err) {
                this.log("Error creating promotion image: %s", err.message);
                return;
            }

            // Send actual image.
            await announceChannel.createMessage({
                embed: {
                    color: 0x49bd1a,
                    timestamp: new Date(),
                    image: { url: "attachment://promotion.png" },
                    author: {
                        name: (member.nick || member.username) + " just got promoted to " + toRole.name + "!",
                        icon_url: member.user.avatarURL
                    }
                }
            }, { file: buf, name: "promotion.png" });
        });
    }

    /**
     * Updates the region ranks for the specified user on the specified guild.
     */
    private async updateRegionRolesOnGuild(user: User, guild: eris.Guild) {
        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server || !server.setupCompleted || !server.regionRoles) return;
        const member = guild.members.get(user.snowflake);
        if (!member) return;

        // Unique list of regions the user has.
        const userRegions = user.accounts.map(x => x.region).filter((v, i, a) => a.indexOf(v) === i);

        const allRegionRoles = this.discord.config.regions.map(name => guild.roles.find(x => x.name === name));
        for (const role of allRegionRoles) {
            if (!role) continue;

            const shouldHaveRole = userRegions.indexOf(role.name) !== -1;
            const hasRole = member.roles.indexOf(role.id) !== -1;

            // If the user has the role, but doesn't need to have it, remove it.
            if (!shouldHaveRole && hasRole) {
                await this.discord.bot.removeGuildMemberRole(guild.id, member.id, role.id);
            }

            // If the user doesn't have the role, but needs it, add it.
            if (shouldHaveRole && !hasRole) {
                await this.discord.bot.addGuildMemberRole(guild.id, member.id, role.id);
            }
        }
    }

    /**
     * Updates tier roles for the specified user on the specified guild.
     */
    private async updateTierRolesOnGuild(user: User, guild: eris.Guild, tier: string | undefined) {
        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server || !server.setupCompleted || !server.tierRoles) return;
        const member = guild.members.get(user.snowflake);
        if (!member) return;

        const rankRoles = this.discord.config.tiers.map(name => guild.roles.find(x => x.name === name));
        for (const role of rankRoles) {
            if (!role) continue;

            const hasRole = member.roles.indexOf(role.id) !== -1;

            // Not the role they are supposed to have, but they have it. Remove.
            if (role.name !== tier && hasRole) {
                await this.discord.bot.removeGuildMemberRole(guild.id, member.id, role.id);
            }

            // Tier they are supposed to have, but they don't have it. Add
            if (tier && role.name === tier && !hasRole) {
                await this.discord.bot.addGuildMemberRole(guild.id, member.id, role.id);
            }
        }
    }

    /**
     * Finds and sums the champion mastery scores for all accounts associated
     * with the specified user.
     */
    private async getChampionTotals(user: User): Promise<UserPoints> {
        const totals = await Promise.all(user.accounts.map(async a => {
            try {
                return await this.riotAPI.getChampionMastery(a.region, a.summonerId);
            } catch (e) {
                // Throw so that this entire method fails. This way we ensure that the user doesn't get updated
                // with only partial totals, because the fetching of one or more of their accounts failed.
                throw new Error(`Error fetching mastery for ${a.username} (${a.summonerId} - ${a.region}): ${e.message}`);
            }
        }));

        // Sum totals.
        return totals.reduce((p, x) => {
            x.forEach(y => p[y.championId] = (p[y.championId] || 0) + y.championPoints);
            return p;
        }, <UserPoints>{});
    }

    /**
     * Finds the highest tier name for the specified user, or undefined if they are currently unranked.
     */
    private async getUserTier(user: User): Promise<string | undefined> {
        const leagues = ([] as riot.LeagueEntry[]).concat(...await Promise.all(user.accounts.map(a => this.riotAPI.getLeagues(a.region, a.summonerId))));
        if (!leagues.length) return;

        const tierNames = this.discord.config.tiers.map(x => x.toLowerCase());
        return leagues.reduce((p, c) => tierNames.indexOf(p.toLowerCase()) > tierNames.indexOf(c.tier.toLowerCase()) ? p : this.discord.config.tiers.find(x => x.toUpperCase() === c.tier)!, tierNames[0]);
    }

    /**
     * Finds the set of users to update. This sorts by not updated recently
     */
    private async getUsersToUpdate(): Promise<User[]> {
        // We query using the Database class manually here, since basie does not expose advanced querying.
        // We have to do some manual mumbo jumbo because basie will make N + 1 queries (where N is the amount of users updated at once).
        const users = await Database.all("SELECT * FROM user WHERE NOT (latestPointsJson = '{}' AND (SELECT COUNT(*) FROM leagueaccount WHERE user_id = user.id) = 0) ORDER BY lastUpdateTimestamp ASC LIMIT ?", [this.discord.config.updateAmount]);

        return Promise.all(users.map(UserModel.materialize));
    }
}