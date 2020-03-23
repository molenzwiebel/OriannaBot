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
     * The ID of the user that this account belongs to.
     */
    readonly user_id: number;

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
     * The encrypted LoL summoner id for this league account.
     */
    summoner_id: string;

    /**
     * The encrypted LoL account id for this league account.
     */
    account_id: string;

    /**
     * Unique encrypted LoL PUUID for this league account.
     */
    puuid: string;

    /**
     * The encrypted TFT summoner id for this league account.
     */
    tft_summoner_id: string;

    /**
     * The encrypted TFT account id for this league account.
     */
    tft_account_id: string;

    /**
     * Unique encrypted TFT PUUID for this league account.
     */
    tft_puuid: string;

    /**
     * Whether this account is the primary account for the specified user.
     * Primary accounts are used for automatic nicknaming, if enabled.
     */
    primary: boolean;

    /**
     * Whether this account should be included in the profile overview
     * for the user.
     */
    show_in_profile: boolean;

    /**
     * Whether this account should be included in any region-based role
     * condition computation.
     */
    include_region: boolean;

    /**
     * Omit id and user_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "user_id"]);
    }
}