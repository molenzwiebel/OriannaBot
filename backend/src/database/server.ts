import { Model } from "objection";
import * as decorators from "../util/objection";
import Role from "./role";

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
     * Optionally eager-loaded blacklisted channels.
     */
    blacklisted_channels?: BlacklistedChannel[];

    /**
     * Optionally eager-loaded roles for this server.
     */
    roles?: Role[];
}

@decorators.table("blacklisted_channels")
export class BlacklistedChannel extends Model {
    /**
     * The Discord ID of the blacklisted channel.
     */
    snowflake: string;
}

decorators.hasMany("roles", () => Role, "id", "server_id")(Server);
decorators.hasMany("blacklisted_channels", () => BlacklistedChannel, "id", "server_id")(Server);