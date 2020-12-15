import RiotAPI from "../riot/api";
import { Server, User, LeagueAccount, UserRank, UserChampionStat, UserMasteryDelta } from "../database";
import config from "../config";
import debug = require("debug");
import elastic from "../elastic";
import scheduleUpdateLoop from "../util/update-loop";
import redis from "../redis";
import createIPC from "../cluster/worker-ipc";
import getTranslator from "../i18n";

const logUpdate = debug("orianna:updater:update");
const logFetch = debug("orianna:updater:fetch");
const logMastery = debug("orianna:updater:fetch:mastery");
const logRanked = debug("orianna:updater:fetch:ranked");
const logAccounts = debug("orianna:updater:fetch:accounts");

const t = getTranslator("en-US");

/**
 * The updater is responsible for "updating" user ranks every set interval.
 * This updater actually runs 3 different updating loops, each at different intervals.
 * From ran most often to ran least often:
 * - Update Mastery Scores (level, score)
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
    private ipc = createIPC(this);

    constructor(private riotAPI: RiotAPI) {}

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

            await Promise.all([
                this.fetchMasteryScores(user),
                this.fetchRanked(user)
            ]);

            await this.updateUser(user);
        } catch (e) {
            logFetch("Error fetching or updating for user %s (%s): %s", user.username, user.snowflake, e.message);
            logFetch("%O", e);

            elastic.reportError(e, "fetchAndUpdateAll");
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
        if (user.ignore) return;
        logUpdate("Updating roles for user %s (%s)", user.username, user.snowflake);

        // Load data if not already loaded.
        if (!user.accounts) await user.$loadRelated("accounts");
        if (!user.stats) await user.$loadRelated("stats");
        if (!user.ranks) await user.$loadRelated("ranks");

        try {
            // Find all guilds this user is on.
            const userData = await this.ipc.searchUser(user.snowflake);

            // Update all of them in parallel.
            await Promise.all(userData.map(data => {
                return this.updateUserOnGuild(user, data.roles, data.nick, data.guild);
            }));
        } catch (e) {
            logUpdate("Failed to update roles for user %s (%s): %s", user.username, user.snowflake, e.message);
            logUpdate("%O", e);

            throw new Error("Failed to update roles for user: " + e.message);
        }
    }

    /**
     * Starts the 3 different update loops.
     */
    public startUpdateLoops() {
        const selectLeastRecentlyUpdated = (field: string) => (amount: number) => User
            .query()
            .whereRaw(`(select count(*) from "league_accounts" as "accounts" where "accounts"."user_id" = "users"."id") > 0`)
            .orderBy(field, "ASC")
            .eager("[accounts, stats, ranks]")
            .limit(amount);

        // Loop 1: Update stats.
        scheduleUpdateLoop(async user => {
            try {
                // Update mastery values.
                await this.fetchMasteryScores(user);

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
    private async updateUserOnGuild(user: User, userRoles: string[], userNickname: string | null, guildId: string) {
        const server = await Server
            .query()
            .where("snowflake", guildId)
            .eager("roles.conditions")
            .first();
        if (!server) return;

        logUpdate("Updating roles and nickname for user %s (%s) on guild %s (%s)", user.username, user.snowflake, server.name, server.snowflake);

        // Compute all roles that this server may assign, then compute all roles that the user should have.
        // Subtract those two sets to figure out which roles the user should and shouldn't have, then make
        // sure that that corresponds with the roles the user currently has on the server.
        const allRoles = new Set(server.roles!.map(x => x.snowflake));
        const shouldHave = new Set(server.roles!.filter(x => x.test(user)).map(x => x.snowflake));
        const userHas = new Set(userRoles);

        for (const role of allRoles) {
            // We can't fully test if this is a valid role since we don't have guild information here,
            // but we can at least ensure that if this ID is obviously incorrect that we don't do an attempt.
            if (!/^\d+$/.test(role)) continue;

            // User has the role, but should not have it.
            if (userHas.has(role) && !shouldHave.has(role)) {
                logUpdate("Removing role %s from user %s (%s) since they do not qualify.", role, user.username, user.snowflake);

                // Ignore errors if we don't have permissions.
                this.ipc.removeGuildMemberRole(guildId, user.snowflake, role, "Orianna - User does not meet requirements for this role.").catch(() => {});
            }

            // User does not have the role, but should have it.
            if (!userHas.has(role) && shouldHave.has(role)) {
                logUpdate("Adding role %s to user %s (%s) since they qualify.", role, user.username, user.snowflake);

                // Ignore failures, they'll show in the web interface anyway.
                const dbRole = server.roles!.find(x => x.snowflake === role)!;
                this.ipc.addGuildMemberRole(guildId, user.snowflake, role, "Orianna - User meets requirements for role.").then(result => {
                    if (!result || !dbRole.announce) return;

                    // Only announce if giving the role was successful.
                    // Prevents us from announcing promotions if we didn't actually assign the role.
                    this.ipc.announcePromotion(user, dbRole, guildId);
                }).catch(() => { /* Ignored */ });
            }
        }

        // Update the user nickname if the server has one and the user has a primary account.
        const primaryAccount = user.accounts!.find(x => x.primary);
        if (primaryAccount && server.nickname_pattern) {
            const targetNick = server.nickname_pattern
                .replace("{region}", primaryAccount.region)
                .replace("{username}", primaryAccount.username)
                .slice(0, 32);
            logUpdate("Setting the nickname of %s (%s) to %s", user.username, user.snowflake, targetNick);

            if (userNickname !== targetNick) {
                this.ipc.setNickname(guildId, user, targetNick);
            }
        } else if (!primaryAccount && server.nickname_pattern) {
            // Reset the nick for this user as they have no primary account but the server mandates one.
            if (userNickname) {
                this.ipc.setNickname(guildId, user, "");
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

        // Create a redis pipeline for leaderboard tracking through sorted sets.
        const pipeline = redis.pipeline();

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

        // Remove user from Redis leaderboards if they lost their points.
        for (const stats of user.stats) {
            if (scores.has(stats.champion_id)) continue;

            pipeline.zrem("leaderboard:" + stats.champion_id, "" + user.id);
        }

        // Remove user from Postgres stats if they lost their points.
        await user.$relatedQuery("stats").whereNotIn("champion_id", [...scores.keys()]).delete();

        let changed;
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

            // Insert or update into redis.
            pipeline.zadd("leaderboard:" + champion, "" + score.score, "" + user.id);

            await user.$relatedQuery<UserChampionStat>("stats").insert({
                champion_id: champion,
                level: score.level,
                score: score.score
            });
        }

        // If we had a change, also update the leaderboard for most total score.
        if (changed) {
            const maxScore = Math.max(...[...scores.values()].map(x => x.score));
            pipeline.zadd("leaderboard:all", maxScore + "", "" + user.id);
        }

        // If we had any changed values, we insert them all at once to avoid having a lot of
        // individual queries.
        if (toInsert.length) await UserMasteryDelta.query().insert(toInsert);

        // Run redis pipeline.
        await pipeline.exec().catch(() => {}); // ignore errors

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
            const results = await this.riotAPI.getLoLLeaguePositions(account.region, account.summoner_id);

            // If we have a TFT ID for this account, concat with the TFT positions.
            if (account.tft_summoner_id) {
                const tftRanked = await this.riotAPI.getTFTLeaguePositions(account.region, account.tft_summoner_id);
                results.push(...tftRanked);
            }

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
            const summoner = await this.riotAPI.getLoLSummonerById(account.region, account.summoner_id);

            if (!summoner) {
                logAccounts("User %s (%s) seems to have transferred account %s - %s (%s)", user.username, user.snowflake, account.region, account.username, account.summoner_id);

                // Delete the account.
                await account.$query().delete();
                user.accounts.slice(user.accounts.indexOf(account), 1);

                // Potentially notify the user.
                this.ipc.notify(user.snowflake, {
                    color: 0x0a96de,
                    title: t.transfer_title,
                    description: t.transfer_body({ username: account.username, region: account.region })
                });
            } else if (summoner.name !== account.username) {
                logAccounts("User %s (%s) seems to have renamed account %s - %s to %s", user.username, user.snowflake, account.region, account.username, summoner.name);

                account.username = summoner.name;
                await account.$query().update({
                    username: summoner.name
                });
            }

            // If this account doesn't have a TFT summoner yet, associate it.
            if (summoner && !account.tft_summoner_id) {
                const tftSummoner = await this.riotAPI.getTFTSummonerByName(account.region, summoner.name);
                if (!tftSummoner) return; // ???, should never happen

                logAccounts("User %s (%s) associated account %s (%s) with TFT account %s.", user.username, user.snowflake, summoner.name, summoner.id, tftSummoner.id);

                await account.$query().update({
                    tft_summoner_id: tftSummoner.id,
                    tft_account_id: tftSummoner.accountId,
                    tft_puuid: tftSummoner.puuid
                });
            }
        }
    }
}