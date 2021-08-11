import { Model, Pojo } from "objection";
import { RoleCombinator, TypedRoleCondition } from "../types/conditions";
import * as decorators from "../util/objection";
import omit = require("lodash/omit");

@decorators.table("roles")
export default class Role extends Model {
    /**
     * Ensure that the combinator is JSON (de)serialized.
     */
    static jsonAttributes = ["combinator"];

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
     * ID of the server this role belongs to.
     */
    server_id: number;

    /**
     * What combinator should be used for testing eligibility for this role.
     */
    combinator: RoleCombinator;

    /**
     * Optionally eager-loaded conditions.
     */
    conditions?: RoleCondition[];

    /**
     * Finds a champion in the set of requirements for this role, to be displayed
     * in the promotion image, _if_ one exists.
     */
    findChampion(): number | null {
        if (typeof this.conditions === "undefined") throw new Error("Conditions must be loaded.");

        const cond = this.conditions.find(x => !!x.options.champion);
        return cond ? cond.options.champion : null;
    }

    /**
     * Omit server_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit({ ...super.$formatJson(json), announce: !!this.announce }, ["server_id"]);
    }
}

@decorators.table("role_conditions")
export class RoleCondition extends Model {
    /**
     * Make sure that Objection parses these as JSON objects.
     */
    static jsonAttributes = ["options"];

    /**
     * Unique incremented ID for this condition.
     */
    readonly id: number;

    /**
     * The type of this condition.
     */
    type: TypedRoleCondition["type"];

    /**
     * The metadata/options for this condition.
     */
    options: any;

    /**
     * Omit id and role_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "role_id"]);
    }
}

decorators.hasMany("conditions", () => RoleCondition, "id", "role_id")(Role);