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
    accounts?: Partial<LeagueAccount>[];
}