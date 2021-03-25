import { Model, Pojo } from "objection";
import omit = require("lodash.omit");
import * as decorators from "../util/objection";
import Role from "./role";

export type EngagementMode = {
    type: "on_join"
} | {
    type: "on_command"
} | {
    type: "on_react",
    channel: string,
    emote: string // customName:id
};

@decorators.table("servers")
export default class Server extends Model {
    /**
     * Unique incremented ID for this server.
     */
    readonly id: number;

    /**
     * The server's discord ID (its snowflake).
     */
    snowflake: string;

    /**
     * The name of the discord server. This may lag behind if the
     * server changes its name while Orianna is not currently online.
     */
    name: string;

    /**
     * The hash for the servers's avatar, used to construct the avatar
     * link. May lag behind if the server changes its avatar while
     * Orianna is offline.
     */
    avatar: string;

    /**
     * The snowflake for the announcement channel for any role announcements.
     * Null if the feature is disabled.
     */
    announcement_channel: string | null;

    /**
     * The default champion to be used for commands executed in this server.
     * Null if there is no default champion set.
     */
    default_champion: number | null;

    /**
     * If the server admins have already completed the intro setup for this server.
     */
    completed_intro: boolean;

    /**
     * The preferred language for this server. All messages in this server will have this
     * language, unless the user invoking them has a different language (which will take
     * priority).
     */
    language: string;

    /**
     * The engagement mode that Orianna is configured to use for members of this server.
     * @see Server#engagement
     */
    engagement_json: string;

    /**
     * The pattern for nicknames that have to be assigned for this server. Empty
     * if nicknames should not be assigned for this server.
     */
    nickname_pattern: string;

    /**
     * The snowflake of the role that is being filtered on for server mastery leaderboards.
     * If not null, server leaderboards will only include users that have the specific role.
     * Will attempt to ignore this setting if the server does not have a role with that ID.
     */
    server_leaderboard_role_requirement: string | null;

    /**
     * Optionally eager-loaded blacklisted channels.
     */
    blacklisted_channels?: BlacklistedChannel[];

    /**
     * Optionally eager-loaded roles for this server.
     */
    roles?: Role[];

    /**
     * Omit id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return {
            ...omit(super.$formatJson(json), ["id", "engagement_json"]),
            engagement: this.engagement
        };
    }

    /**
     * @returns the engagement mode for this server
     */
    get engagement(): EngagementMode {
        return JSON.parse(this.engagement_json);
    }
}

@decorators.table("blacklisted_channels")
export class BlacklistedChannel extends Model {
    /**
     * The Discord ID of the blacklisted channel.
     */
    snowflake: string;

    /**
     * Only return the string snowflake as the json representation.
     */
    $formatJson(json: Pojo) {
        return <any>this.snowflake;
    }
}

decorators.hasMany("roles", () => Role, "id", "server_id")(Server);
decorators.hasMany("blacklisted_channels", () => BlacklistedChannel, "id", "server_id")(Server);