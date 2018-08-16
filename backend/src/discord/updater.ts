import RiotAPI from "../riot/api";
import * as eris from "eris";
import { Server, User, LeagueAccount, UserRank, UserChampionStat, Role, UserMasteryDelta } from "../database";
import config from "../config";
import DiscordClient from "./client";
import StaticData from "../riot/static-data";
import debug = require("debug");
import elastic from "../elastic";
import scheduleUpdateLoop from "../util/update-loop";
import formatName from "../util/format-name";

const logUpdate = debug("orianna:updater:update");
const logFetch = debug("orianna:updater:fetch");
const logMastery = debug("orianna:updater:fetch:mastery");
const logRanked = debug("orianna:updater:fetch:ranked");
const logAccounts = debug("orianna:updater:fetch:accounts");
const logGames = debug("orianna:updater:fetch:games");

/**
 * The updater is responsible for "updating" user ranks every set interval.
 * This updater actually runs 4 different updating loops, each at different intervals.
 * From ran most often to ran least often:
 * - Update Mastery Scores (level, score)
 * - Update Ranked Information (amount of games)
 * - Update Ranked Information (ranked tier)
 * - Update Summoners (check if the summoner was renamed, transferred)
 * These different intervals are mostly because of the rate limits imposed on us by
 * the Riot API. Do note that a manual refresh will do all of these at the same time.
 *
 * Terminology used:
 * - fetch: pulling (new) data from the riot API and writing it to a User instance.
 *          this will **not** recalculate roles in discord.
 * - update: calculate new roles for a user based on their current User instance.
 *           this should be ran when either the role conditions change or the user
 *           was previously fetched (and thus might have new data)
 */
export default class Updater {
    constructor(private client: DiscordClient, private riotAPI: RiotAPI) {
        this.startUpdateLoops();
    }

    /**
     * Updates everything for the specified user instance or snowflake. This
     * will fetch all the new data and then recompute all roles for the specified user.
     */
    public async fetchAndUpdateAll(user: User | string) {
        if (typeof user === "string") {
            const dbUser = await User
                .query()
                .where("snowflake", user)
                .eager("[accounts, stats, ranks]")
                .first();

            if (!dbUser) throw new Error("User " + user + " not found.");
            user = dbUser;
        }
        logFetch("Fetching and updating all for %s (%s)", user.username, user.snowflake);

        try {
            // Run the account update and games count first since it may alter the results
            // of the other fetch queries (if a user transferred).
            await this.fetchAccounts(user);
            await this.fetchGamesPlayed(user);

            await Promise.all([
                this.fetchMasteryScores(user),
                this.fetchRanked(user)
            ]);

            await this.updateUser(user);
        } catch (e) {
            logFetch("Error fetching or updating for user %s (%s): %s", user.username, user.snowflake, e.message);
            logFetch("%O", e);

            elastic.reportError(e);
        }
    }

    /**
     * Updates the roles for the specified User on all servers Orianna
     * shars with them. This will not fetch data, it will just check to
     * see if the user has all the roles it is supposed to have and
     * update appropriately. Thus, this should be called after a fetch
     * or whenever the role configuration for a specific server is updated.
     */
    public async updateUser(user: User) {
        logUpdate("Updating roles for user %s (%s)", user.username, user.snowflake);

        // Load data if not already loaded.
        if (!user.accounts) await user.$loadRelated("accounts");
        if (!user.stats) await user.$loadRelated("stats");
        if (!user.ranks) await user.$loadRelated("ranks");

        try {
          await Promise.all(this.client.bot.guilds.filter(x => x.members.has(user.snowflake)).map(server => {
              return this.updateUserOnGuild(user, server);
          }));
        } catch (e) {
            logUpdate("Failed to update roles for user %s (%s): %s", user.username, user.snowflake, e.message);
            logUpdate("%O", e);

            // Rethrow, something else will catch it.
            throw e;
        }
    }

    /**
     * Starts the 3 different update loops.
     */
    private startUpdateLoops() {
        const selectLeastRecentlyUpdated = (field: string) => (amount: number) => User
            .query()
            .whereRaw(`(select count(*) from "league_accounts" as "accounts" where "accounts"."user_id" = "users"."id") > 0`)
            .orderBy(field, "ASC")
            .eager("[accounts, stats, ranks]")
            .limit(amount);

        // Loop 1: Update stats and games played.
        scheduleUpdateLoop(async user => {
            try {
                // Update mastery values.
                const hasChanged = await this.fetchMasteryScores(user);

                // If mastery changed or we need a full reset, update games played.
                if (hasChanged || user.needsGamesPlayedReset) await this.fetchGamesPlayed(user);

                // Now recompute roles.
                await this.updateUser(user);
            } catch (e) {
                // Ignored.
            }

            // Update last update time regardless of if we succeeded or not.
            await user.$query().patch({
                last_score_update_timestamp: "" + Date.now()
            });
        }, selectLeastRecentlyUpdated("last_score_update_timestamp"), config.updater.masteryGamesInterval, config.updater.masteryGamesAmount);

        // Loop 2: Update ranked tiers.
        scheduleUpdateLoop(async user => {
            // Fetch ranked tier and recompute roles.
            // We don't care about the result, and we want to swallow errors.
            this.fetchRanked(user).catch(() => {});

            // Actually, do not recompute roles.
            // Users that haven't gotten their mastery scores yet will lose their roles.
            // This is only really an issue just after the migration from Ori v1, but it doesn't
            // really matter since the roles will still be recomputed on the next mastery loop, which
            // shouldn't take too long.

            await user.$query().patch({
                last_rank_update_timestamp: "" + Date.now()
            });
        }, selectLeastRecentlyUpdated("last_rank_update_timestamp"), config.updater.rankedTierInterval, config.updater.rankedTierAmount);

        // Loop 3: Update account state.
        scheduleUpdateLoop(async user => {
            // No need to recompute roles here. Thatll happen soon enough.
            // We don't care about the result, and we want to swallow errors.
            this.fetchAccounts(user).catch(() => {});

            await user.$query().patch({
                last_account_update_timestamp: "" + Date.now()
            });
        }, selectLeastRecentlyUpdated("last_account_update_timestamp"), config.updater.accountInterval, config.updater.accountAmount);
    }

    /**
     * Recalculates all the roles for the specified user in the specified
     * Discord guild. Does nothing if the guild is not registered in the database.
     */
    private async updateUserOnGuild(user: User, guild: eris.Guild) {
        const server = await Server
            .query()
            .where("snowflake", guild.id)
            .eager("roles.conditions")
            .first();
        if (!server) return;

        const member = guild.members.get(user.snowflake);
        if (!member) return;

        // Update their avatar just in case its incorrect (happens after transfer from v1->v2).
        if (member.avatar !== user.avatar) {
            await user.$query().patch({
                avatar: member.avatar || "none"
            });
        }

        logUpdate("Updating roles for user %s (%s) on guild %s (%s)", user.username, user.snowflake, server.name, server.snowflake);

        // Compute all roles that this server may assign, then compute all roles that the user should have.
        // Subtract those two sets to figure out which roles the user should and shouldn't have, then make
        // sure that that corresponds with the roles the user currently has on the server.
        const allRoles = new Set(server.roles!.map(x => x.snowflake));
        const shouldHave = new Set(server.roles!.filter(x => x.test(user)).map(x => x.snowflake));
        const userHas = new Set(member.roles);

        for (const role of allRoles) {
            if (!guild.roles.has(role)) continue;

            // User has the role, but should not have it.
            if (userHas.has(role) && !shouldHave.has(role)) {
                logUpdate("Removing role %s from user %s (%s) since they do not qualify.", role, user.username, user.snowflake);

                guild.removeMemberRole(user.snowflake, role, "Orianna - User does not meet requirements for this role.");
            }

            // User does not have the role, but should have it.
            if (!userHas.has(role) && shouldHave.has(role)) {
                logUpdate("Adding role %s to user %s (%s) since they qualify.", role, user.username, user.snowflake);

                // Ignore failures, they'll show in the web interface anyway.
                guild.addMemberRole(user.snowflake, role, "Orianna - User meets requirements for role.").then(() => {
                    // Only announce if giving the role was successful.
                    // Prevents us from announcing promotions if we didn't actually assign the role.
                    this.announcePromotion(user, server.roles!.find(x => x.snowflake === role)!, guild);
                }, () => {});
            }
        }
    }

    /**
     * Responsible for pulling new mastery score data from Riot and
     * updating the User instance. This will not recalculate roles.
     *
     * @returns whether or not the mastery score changed since the last refresh
     */
    private async fetchMasteryScores(user: User) {
        if (!user.accounts) user.accounts = await user.$relatedQuery<LeagueAccount>("accounts");
        if (!user.stats) user.stats = await user.$relatedQuery<UserChampionStat>("stats");
        logMastery("Updating mastery for user %s (%s)", user.username, user.snowflake);

        // Sum scores and max levels for all accounts.
        const scores = new Map<number, { score: number, level: number }>();
        for (const account of user.accounts) {
            // This may throw. If it does, we don't particularly care. We will just try again later.
            const masteries = await this.riotAPI.getChampionMastery(account.region, account.summoner_id);

            for (const mastery of masteries) {
                const old = scores.get(mastery.championId) || { score: 0, level: 0 };

                scores.set(mastery.championId, {
                    score: old.score + mastery.championPoints,
                    level: Math.max(old.level, mastery.championLevel)
                });
            }
        }

        // Nuke all old entries not in the list, so that deleted accounts update properly.
        await user.$relatedQuery("stats").whereNotIn("champion_id", [...scores.keys()]).delete();

        let changed = false;
        const toInsert = [];
        for (const [champion, score] of scores) {
            // Carry over the old games played. Don't update anything if we have no need to.
            const oldScore = user.stats.find(x => x.champion_id === champion);
            if (oldScore && score.level === oldScore.level && score.score === oldScore.score) continue;

            // If we had an older score, we can diff the two and queue a delta for insertion.
            if (oldScore) {
                toInsert.push({
                    user_id: user.id,
                    champion_id: champion,
                    delta: score.score - oldScore.score,
                    value: score.score,
                    timestamp: "" + Date.now()
                });

                await oldScore.$query().delete();
            }
            changed = true;

            const oldGamesPlayed = oldScore ? oldScore.games_played : 0;
            await user.$relatedQuery<UserChampionStat>("stats").insert({
                champion_id: champion,
                level: score.level,
                score: score.score,
                games_played: oldGamesPlayed
            });
        }

        // If we had any changed values, we insert them all at once to avoid having a lot of
        // individual queries.
        if (toInsert.length) await UserMasteryDelta.query().insert(toInsert);

        // Refetch stats now that we updated stuff.
        user.stats = await user.$relatedQuery<UserChampionStat>("stats");
        return changed;
    }

    /**
     * Responsible for pulling new ranked tiers and play counts and
     * updating the User instance. This will not recalculate roles.
     */
    private async fetchRanked(user: User) {
        if (!user.accounts) user.accounts = await user.$relatedQuery<LeagueAccount>("accounts");
        logRanked("Updating ranked stats for user %s (%s)", user.username, user.snowflake);

        // Figure out the highest rank in every queue for all the accounts combined.
        const tiers = new Map<string, number>();
        for (const account of user.accounts) {
            const results = await this.riotAPI.getLeaguePositions(account.region, account.summoner_id);
            for (const result of results) {
                const old = tiers.get(result.queueType) || 0;
                const val = config.riot.tiers.indexOf(result.tier);
                tiers.set(result.queueType, old > val ? old : val);
            }
        }

        // Nuke all old entries (since there might be a queue where we are no longer ranked),
        // then append the new values.
        await user.$relatedQuery<UserRank>("ranks").delete();
        user.ranks = [];
        for (const [queue, tier] of tiers) {
            await user.$relatedQuery<UserRank>("ranks").insert({
                queue,
                tier: config.riot.tiers[tier]
            });
        }
    }

    /**
     * Loads the amount of ranked games played across all champions and all regions
     * for the specified user. Note that this will update even if it was updated recently.
     */
    private async fetchGamesPlayed(user: User) {
        if (!user.accounts) user.accounts = await user.$relatedQuery<LeagueAccount>("accounts");
        if (!user.stats) user.stats = await user.$relatedQuery<UserChampionStat>("stats");
        logGames("Updating ranked games played for user %s (%s)", user.username, user.snowflake);

        const gamesPlayed = new Map<number, number>();
        for (const account of user.accounts) {
            // If we need a games played reset, fetch since the beginning. Else, fetch since the last time we ran this update.
            const games = await this.riotAPI.findRankedGamesAfter(account.region, account.account_id, user.needsGamesPlayedReset ? 0 : +user.last_score_update_timestamp);

            for (const game of games) {
                // Increment the amount of games played by one.
                gamesPlayed.set(game.champion, (gamesPlayed.get(game.champion) || 0) + 1);
            }
        }

        // If the user needs a reset, first set the games played to 0 for every champion.
        // Otherwise if a user with two accounts has 10 games on teemo on one, and zero on the other,
        // and then removes account 1, the 10 games on teemo would stay.
        if (user.needsGamesPlayedReset) {
            await user.$relatedQuery<UserChampionStat>("stats").patch({
                games_played: 0
            });
        }

        // Now, update the database totals.
        const incremental = !user.needsGamesPlayedReset;
        for (const [champion, games] of gamesPlayed) {
            const oldValue = user.stats.find(x => x.champion_id === champion);

            // Skip updating this if the value we have is already the most recent. Saves us a database call.
            if (incremental && oldValue && oldValue.games_played === games) continue;

            // Weird, but it can happen I guess.
            if (!oldValue) {
                await user.$relatedQuery<UserChampionStat>("stats").insert({
                    champion_id: champion,
                    level: 0,
                    score: 0,
                    games_played: games
                });
            } else {
                await oldValue.$query().update({
                    games_played: incremental ? oldValue.games_played + games : games
                });
            }
        }

        // Refetch stats now that we updated stuff
        user.stats = await user.$relatedQuery<UserChampionStat>("stats");
    }

    /**
     * Responsible for refreshing summoner instances to check if the
     * user renamed or transferred. This will not recalculate roles.
     */
    private async fetchAccounts(user: User) {
        if (!user.accounts) user.accounts = await user.$relatedQuery<LeagueAccount>("accounts");
        logAccounts("Updating accounts for user %s (%s)", user.username, user.snowflake);

        // For every account, check if the account still exists and still has the same name.
        // If the name is different, just silently update. Else, remove the account and message
        // the user that we removed their account.
        const copy = user.accounts.slice();
        for (const account of copy) {
            const summoner = await this.riotAPI.getSummonerById(account.region, account.summoner_id);

            if (!summoner) {
                logAccounts("User %s (%s) seems to have transferred account %s - %s (%i)", user.username, user.snowflake, account.region, account.username, account.summoner_id);

                // Delete the account.
                await account.$query().delete();
                user.accounts.slice(user.accounts.indexOf(account), 1);

                // Potentially notify the user.
                this.client.notify(user.snowflake, {
                    color: 0x0a96de,
                    title: "✈ Account Transferred?",
                    description: "You registered your League account **" + account.username + "** (" + account.region + ") with me a while ago. While checking up on it today, it seems that the account no longer exists. Did you transfer the account to another region?\n\nI have unlinked the League account from your Discord profile. If you have indeed transferred, you can simply add the account again in the new region."
                });
            } else if (summoner.name !== account.username) {
                logAccounts("User %s (%s) seems to have renamed account %s - %s to %s", user.username, user.snowflake, account.region, account.username, summoner.name);

                account.username = summoner.name;
                await account.$query().update({
                    username: summoner.name
                });
            }
        }
    }

    /**
     * Announces promotion for the specified user and the specified role on the
     * specified guild, if enabled.
     */
    private async announcePromotion(user: User, role: Role, guild: eris.Guild) {
        if (!role.announce) return;

        // Find announcement channel ID.
        const server = await Server.query().where("id", role.server_id).first();
        if (!server) return;
        const announceChannelId = server.announcement_channel;
        if (!announceChannelId) return;

        // Ensure that that channel exists.
        const announceChannel = guild.channels.get(announceChannelId);
        if (!announceChannel || !(announceChannel instanceof eris.TextChannel)) return;

        logUpdate("Announcing promotion for %s (%s) to %s on %s (%s)", user.username, user.snowflake, role.name, guild.name, guild.id);

        // Figure out what images to show for the promotion.
        const champion = role.findChampion();
        const championIcon = champion ? await StaticData.getChampionIcon(champion) : "https://i.imgur.com/uW9gZWO.png";
        const championBg = champion ? await StaticData.getRandomCenteredSplash(champion) : "https://i.imgur.com/XVKpmRV.png";

        // Enqueue rendering of the gif.
        const image = await this.client.puppeteer.render("./graphics/promotion.html", {
            gif: {
                width: 800,
                height: 220,
                length: 2.4,
                fpsScale: 1.4
            },
            args: {
                name: user.username,
                title: role.name,
                icon: user.avatarURL,
                champion: championIcon,
                background: championBg
            }
        });

        // Send image!
        announceChannel.createMessage({
            embed: {
                color: 0x49bd1a,
                timestamp: new Date().toISOString(),
                image: { url: "attachment://promotion.gif" },
                author: {
                    name: formatName(user, true) + " just got promoted to " + role.name + "!",
                    icon_url: user.avatarURL
                }
            }
        }, { file: image, name: "promotion.gif" });
    }
}