import { Model } from "objection";
import * as decorators from "../util/objection";

@decorators.table("roles")
export default class Role extends Model {
    /**
     * Unique incremented ID for this role.
     */
    readonly id: number;

    /**
     * The name for this role.
     */
    name: string;

    /**
     * The ID of the Discord role that corresponds to this role entry.
     */
    snowflake: string;

    /**
     * If users that "gain" this role should get an announcement in the server
     * announcement channel.
     */
    announce: boolean;

    /**
     * Optionally eager-loaded conditions.
     */
    conditions?: Partial<RoleCondition>[];
}

@decorators.table("role_conditions")
export class RoleCondition extends Model {
    /**
     * Unique incremented ID for this condition.
     */
    readonly id: number;

    /**
     * The type of this condition.
     */
    // TODO(molenzwiebel): Figure out these types.
    type: "mastery_level" | "mastery_score";

    /**
     * The metadata for this condition.
     */
    metadata: any;
}

decorators.hasMany("conditions", () => RoleCondition, "id", "role_id")(RoleCondition)