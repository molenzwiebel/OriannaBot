import { Model, Pojo } from "objection";
import * as decorators from "../util/objection";
import omit = require("lodash.omit");

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
     * The encrypted summoner id for this league account.
     */
    summoner_id: string;

    /**
     * The encrypted account id for this league account.
     */
    account_id: string;

    /**
     * Unique encrypted PUUID for this league account.
     */
    puuid: string;

    /**
     * Omit id and user_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "user_id"]);
    }
}