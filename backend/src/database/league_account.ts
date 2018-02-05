import { Model } from "objection";
import * as decorators from "../util/objection";

@decorators.table("league_accounts")
export default class LeagueAccount extends Model {
    /**
     * Unique incrementing ID for this account.
     */
    readonly id: number;

    /**
     * The username of this league account. May lag behind
     * if the user changes their name.
     */
    username: string;

    /**
     * The region for this league account. May lag behind if the
     * user transfers to another server.
     */
    region: string;

    /**
     * The summoner id for this league account.
     */
    summoner_id: number;

    /**
     * The account id for this league account.
     */
    account_id: number;
}