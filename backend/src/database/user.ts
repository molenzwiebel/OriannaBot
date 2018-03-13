import { Model, Pojo } from "objection";
import LeagueAccount from "./league_account";
import * as decorators from "../util/objection";
import omit = require("lodash.omit");

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

    /**
     * Returns the fully qualified URL to the avatar for this user.
     */
    get avatarURL(): string {
        if (this.avatar === "none") return "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png";
        return `https://cdn.discordapp.com/avatars/${this.snowflake}/${this.avatar}.png`;
    }

    /**
     * Omit user id and token from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "token"]);
    }

    /**
     * Adds a new league account to this user, provided they do not have it registered already.
     */
    async addAccount(region: string, summ: riot.Summoner) {
        await this.$loadRelated("accounts");
        if (this.accounts!.some(x => x.region === region && x.summoner_id === summ.id)) return;

        await this.$relatedQuery<LeagueAccount>("accounts").insert({
            username: summ.name,
            region: region,
            summoner_id: summ.id,
            account_id: summ.accountId
        });
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
     * The total amount of ranked games this user has in the
     * current ranked season.
     */
    games_played: number;

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

decorators.belongsTo("user", () => User, "user_id", "id")(UserChampionStat);

decorators.hasMany("accounts", () => LeagueAccount, "id", "user_id")(User);
decorators.hasMany("stats", () => UserChampionStat, "id", "user_id")(User);
decorators.hasMany("ranks", () => UserRank, "id", "user_id")(User);