import RiotAPI from "../riot/api";
import { User, LeagueAccount, UserRank, UserChampionStat } from "../database";
import config from "../config";
import DiscordClient from "./client";

/**
 * The updater is responsible for "updating" user ranks every set interval.
 * This updater actually runs 3 different updating loops, each at different intervals.
 * From ran most often to ran least often:
 * - Update Mastery Scores (level, score)
 * - Update Ranked Information (amount of games, ranked tier)
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
    private riotAPI = new RiotAPI(config.riot.apiKey);

    constructor(private client: DiscordClient) {}

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

        // Run the account update first since it may alter the results
        // of the other fetch queries (if a user transferred).
        await this.fetchAccounts(user);
        await Promise.all([
            this.fetchMasteryScores(user),
            this.fetchRanked(user)
        ]);

        await this.updateUser(user);
    }

    /**
     * Updates the roles for the specified User on all servers Orianna
     * shars with them. This will not fetch data, it will just check to
     * see if the user has all the roles it is supposed to have and
     * update appropriately. Thus, this should be called after a fetch
     * or whenever the role configuration for a specific server is updated.
     */
    private async updateUser(user: User) {

    }

    /**
     * Responsible for pulling new mastery score data from Riot and
     * updating the User instance. This will not recalculate roles.
     */
    private async fetchMasteryScores(user: User) {
        if (!user.stats) user.stats = await user.$relatedQuery<UserChampionStat>("stats");

    }

    /**
     * Responsible for pulling new ranked tiers and play counts and
     * updating the User instance. This will not recalculate roles.
     */
    private async fetchRanked(user: User) {
        if (!user.ranks) user.ranks = await user.$relatedQuery<UserRank>("ranks");

        // TODO(molenzwiebel): Figure out a good way to pull amount of games played efficiently.
    }

    /**
     * Responsible for refreshing summoner instances to check if the
     * user renamed or transferred. This will not recalculate roles.
     */
    private async fetchAccounts(user: User) {
        if (!user.accounts) user.accounts = await user.$relatedQuery<LeagueAccount>("accounts");

        // For every account, check if the account still exists and still has the same name.
        // If the name is different, just silently update. Else, remove the account and message
        // the user that we removed their account.
        const copy = user.accounts.slice();
        for (const account of copy) {
            const summoner = await this.riotAPI.getSummonerById(account.region, account.summoner_id);

            if (!summoner) {
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
                account.username = summoner.name;
                await account.$query().update({
                    username: summoner.name
                });
            }
        }
    }
}