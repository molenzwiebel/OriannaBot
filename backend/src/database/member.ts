import { Model } from "objection";
import * as decorators from "../util/objection";

@decorators.table("guild_members")
export default class GuildMember extends Model {
    /**
     * Ensure that the roles JSON is deserialized.
     */
    static jsonAttributes = ["roles"];

    /**
     * The ID of the guild on which the properties of this member apply.
     */
    guild_id: string;

    /**
     * The ID of the user for which this data applies.
     */
    user_id: string;

    /**
     * The nickname of the user with ID `user_id` on the guild with ID
     * `guild_id`, or null if not applicable.
     */
    nickname: string | null;

    /**
     * The IDs of the roles owned by the user with ID `user_id` on the
     * guild with ID `guild_id`.
     */
    roles: string[];
}