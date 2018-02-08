import { Model } from "objection";
import LeagueAccount from "./league_account";
import * as decorators from "../util/objection";

@decorators.hasMany("accounts", () => LeagueAccount, "id", "user_id")
@decorators.table("users")
export default class User extends Model {
    /**
     * Unique incremented ID for this user.
     */
    readonly id: number;

    /**
     * The user's discord ID (their snowflake).
     */
    snowflake: string;

    /**
     * The user's discord username. This may lag behind if the user
     * changes their username while Orianna is not currently online.
     */
    username: string;

    /**
     * The hash for the user's avatar, used to construct their avatar
     * link. May lag behind if the user changes their avatar while
     * Orianna is offline.
     */
    avatar: string;

    /**
     * The unique "magic-link" token for this user, used as a way to
     * authenticate with the web interface. Should never change.
     */
    token: string;

    /**
     * Optionally eager-loaded accounts, null if not specified in the query.
     */
    accounts?: LeagueAccount[];

    /**
     * Optionally eager-loaded stats, null if not specified in the query.
     */
    stats?: UserChampionStat[];

    /**
     * Optionally eager-loaded ranks, null if not specified in the query.
     */
    ranks?: UserRank[];
}

@decorators.table("user_champion_stats")
export class UserChampionStat extends Model {
    /**
     * Unique incremented ID for this stat.
     */
    readonly id: number;

    /**
     * The champion for this statistic entry.
     */
    champion_id: number;

    /**
     * The highest level the user has on this champion
     * across all linked accounts.
     */
    level: number;

    /**
     * The total amount of points the user has on this champion.
     */
    points: number;

    /**
     * The total amount of ranked games this user has in the
     * current ranked season.
     */
    games_played: number;
}

@decorators.table("user_ranks")
export class UserRank extends Model {
    /**
     * Unique incremented ID for this rank entry.
     */
    readonly id: number;

    /**
     * The queue for this rank
     */
    queue: string;

    /**
     * The tier for this rank.
     */
    tier: string;
}


decorators.hasMany("stats", () => UserChampionStat, "id", "user_id")(User);
decorators.hasMany("ranks", () => UserRank, "id", "user_id")(User);