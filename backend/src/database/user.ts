import { Model, Pojo } from "objection";
import LeagueAccount from "./league_account";
import * as decorators from "../util/objection";
import omit = require("lodash.omit");
import config from "../config";
import { randomBytes } from "crypto";

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
     * The preferred language for this user. Empty if the user has no preferred language
     * and just uses the language from the server (or english in DMs).
     */
    language: string;

    /**
     * Epoch timestamp of when we last updated this users scores and games played.
     * Stored as a string since knex returns bigint values as strings.
     */
    last_score_update_timestamp: string;

    /**
     * Epoch timestamp of when we last updated this users ranked tier.
     * Stored as a string since knex returns bigint values as strings.
     */
    last_rank_update_timestamp: string;

    /**
     * Epoch timestamp of when we last updated this users accounts.
     * Stored as a string since knex returns bigint values as strings.
     */
    last_account_update_timestamp: string;

    /**
     * If this user should be treated as if they are unranked in every single
     * queue.
     */
    treat_as_unranked: boolean;

    /**
     * If the accounts for this user should not be publicly shown.
     *
     * @deprecated No longer used. The individual toggles on accounts should be used instead.
     */
    hide_accounts: boolean;

    /**
     * Whether or not this user should be ignored completely. Ignored users
     * don't receive any roles, even on a manual refresh.
     */
    ignore: boolean;

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

    /**
     * Optionally eager-loaded mastery delta entries, null if not specified in the query.
     */
    deltas?: UserMasteryDelta[];

    /**
     * Returns the fully qualified URL to the avatar for this user.
     */
    get avatarURL(): string {
        if (this.avatar === "none") return "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png";

        // If this is an animated avatar...
        if (this.avatar.indexOf("a_") === 0) {
            return `https://cdn.discordapp.com/avatars/${this.snowflake}/${this.avatar}.gif`;
        } else {
            return `https://cdn.discordapp.com/avatars/${this.snowflake}/${this.avatar}.png`;
        }
    }

    /**
     * Omit user id and token from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit({
            ...super.$formatJson(json),
            treat_as_unranked: Boolean(this.treat_as_unranked),
            hide_accounts: Boolean(this.hide_accounts)
        }, ["id", "token"]);
    }

    /**
     * Adds a new league account to this user, provided they do not have it registered already.
     */
    async addAccount(region: string, lolSummoner: riot.Summoner, tftSummoner: riot.Summoner) {
        await this.$loadRelated("accounts");
        if (this.accounts!.some(x => x.region === region && x.summoner_id === lolSummoner.id)) return;

        // this is a primary account if this is the user's first account
        const isPrimary = this.accounts!.length === 0;

        await this.$relatedQuery<LeagueAccount>("accounts").insert({
            username: lolSummoner.name,
            region: region,
            summoner_id: lolSummoner.id,
            account_id: lolSummoner.accountId,
            puuid: lolSummoner.puuid,
            tft_summoner_id: tftSummoner.id,
            tft_account_id: tftSummoner.accountId,
            tft_puuid: tftSummoner.puuid,
            primary: isPrimary,
            show_in_profile: true,
            include_region: true
        });
    }

    /**
     * Generates a new login token that never expires. Used during engagement when a player first
     * meets Orianna and starts using her. Returns the full login URL.
     */
    async generateInfiniteLoginToken(): Promise<string> {
        const key = await UserAuthKey.query().insertAndFetch({
            user_id: this.id,
            created_at: "2100-01-01 10:10:10", // have this one never expire, just for a bit more user friendliness
            key: randomBytes(16).toString("hex")
        });

        return config.web.url + "/login/" + key.key;
    }
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
     * The total amount of points (the score) the user has on this champion.
     */
    score: number;

    /**
     * The eager-loaded user this stat belongs to, if it was specified in the query.
     */
    user?: User;

    /**
     * Omit user and id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "user"]);
    }
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

    /**
     * Omit id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id"]);
    }
}

@decorators.table("user_auth_keys")
export class UserAuthKey extends Model {
    /**
     * Unique incremented ID for this auth key.
     */
    readonly id: number;

    /**
     * Column for the user property below.
     */
    user_id: number;

    /**
     * The actual auth key.
     */
    key: string;

    /**
     * The timestamp at which this auth key was generated. ISO string.
     */
    created_at: string;

    /**
     * The user this auth key belongs to.
     */
    user: User;
}

@decorators.table("user_mastery_deltas")
export class UserMasteryDelta extends Model {
    /**
     * Unique incremented ID for this delta.
     */
    readonly id: number;

    /**
     * The user this delta belongs to.
     */
    user_id: number;

    /**
     * The champion for this statistic entry.
     */
    champion_id: number;

    /**
     * The difference between the last recorded value. Can be
     * negative if an account was removed.
     */
    delta: number;

    /**
     * The mastery value, after applying `delta`.
     */
    value: number;

    /**
     * Unix epoch timestamp, stored as a string (since postgres stores bigInts as strings).
     */
    timestamp: string;
}

decorators.belongsTo("user", () => User, "user_id", "id")(UserChampionStat);
decorators.belongsTo("user", () => User, "user_id", "id")(UserAuthKey);

decorators.hasMany("accounts", () => LeagueAccount, "id", "user_id")(User);
decorators.hasMany("stats", () => UserChampionStat, "id", "user_id")(User);
decorators.hasMany("ranks", () => UserRank, "id", "user_id")(User);
decorators.hasMany("deltas", () => UserMasteryDelta, "id", "user_id")(User);