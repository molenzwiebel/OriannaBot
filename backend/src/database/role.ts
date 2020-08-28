import { Model, Pojo } from "objection";
import * as decorators from "../util/objection";
import { evaluateRangeCondition, RankedTierCondition, RoleCombinator, TypedRoleCondition } from "../types/conditions";
import User, { UserRank } from "./user";
import config from "../config";
import omit = require("lodash.omit");

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
     * Checks if this role should be assigned to the specified user.
     * The user must have its accounts, scores and tiers loaded already.
     */
    test(user: User): boolean {
        // Error if conditions are not loaded.
        if (typeof this.conditions === "undefined") throw new Error("Conditions must be loaded.");

        // Roles without conditions should never assign. This is to prevent
        // people from getting the role while the user is busy adding conditions.
        if (!this.conditions.length) return false;

        // Test how many conditions are true.
        const valid = this.conditions.filter(x => x.test(user));

        // Now, based on the combinator, return an answer.
        if (this.combinator.type === "all") {
            // Every condition needs to be valid.
            return valid.length === this.conditions.length;
        } else if (this.combinator.type === "any") {
            // At least one.
            return valid.length >= 1;
        } else if (this.combinator.type === "at_least") {
            // At least N.
            return valid.length >= this.combinator.amount;
        }

        throw new Error("Invalid combinator type: " + this.combinator);
    }

    /**
     * Finds a champion in the set of requirements for this role, to be displayed
     * in the promotion image, _if_ one exists.
     */
    findChampionFor(user: User): number | null {
        if (typeof this.conditions === "undefined") throw new Error("Conditions must be loaded.");

        const cond = this.conditions.find(x => !!x.options.champion && x.test(user));
        return cond ? cond.options.champion : null;
    }

    /**
     * Omit server_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit({...super.$formatJson(json), announce: !!this.announce}, ["server_id"]);
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
     * Checks if this specific condition applies for the
     * specified user. This assumes that the user already has
     * it's mastery scores, accounts and tiers loaded.
     */
    test(user: User): boolean {
        if (typeof user.ranks === "undefined"
            || typeof user.stats === "undefined"
            || typeof user.accounts === "undefined") throw new Error("User must have all fields loaded.");

        // Users without accounts never qualify for a role. This prevents users that have no roles
        // from being able to qualify for roles that exhibit a maximum (as we default to zero).
        if (!user.accounts.length) return false;

        const condition: TypedRoleCondition = <TypedRoleCondition>this;
        if (condition.type === "mastery_level") {
            // Default to level zero for champs that we don't have a mastery on.
            const level = user.stats.find(x => x.champion_id === condition.options.champion)?.level || 0;
            return evaluateRangeCondition(condition.options, level);
        } else if (condition.type === "total_mastery_level") {
            // Sum total level, then evaluate the range condition.
            const total = user.stats.reduce((p, c) => p + c.level, 0);
            return evaluateRangeCondition(condition.options, total);
        } else if (condition.type === "mastery_score") {
            // Default to zero points for champs that we don't have a mastery on.
            const score = user.stats.find(x => x.champion_id === condition.options.champion)?.score || 0;
            return evaluateRangeCondition(condition.options, score);
        } else if (condition.type === "total_mastery_score") {
            // Sum total score, then evaluate the range condition.
            const total = user.stats.reduce((p, c) => p + c.score, 0);
            return evaluateRangeCondition(condition.options, total);
        } else if (condition.type === "ranked_tier" && condition.options.queue.startsWith("HIGHEST")) { // user's highest ranked queue (potentially including tft)
            const includeTFT = condition.options.queue.includes("TFT");
            const highest = user.ranks
                .filter(x => x.queue === "RANKED_TFT" ? includeTFT : true)
                .sort((a, b) => config.riot.tiers.indexOf(b.tier) - config.riot.tiers.indexOf(a.tier))[0];
            if (!highest || user.treat_as_unranked) return condition.options.compare_type === "equal" && condition.options.tier === 0;

            return evaluateRankedTier(condition, highest);
        } else if (condition.type === "ranked_tier" && condition.options.queue === "ANY") { // any ranked queue
            if (user.treat_as_unranked) return condition.options.compare_type === "equal" && condition.options.tier === 0;

            // Check if for any of our ranks the specified condition is true.
            return user.ranks.some(tier => evaluateRankedTier(condition, tier));
        } else if (condition.type === "ranked_tier") { // normal ranked queues
            // If the user is unranked in the queue, only match if they had a condition set to `EQUAL UNRANKED` (e.g. don't include unranked in lt and gt).
            const tier = user.ranks.find(x => x.queue === condition.options.queue);
            if (!tier || user.treat_as_unranked) return condition.options.compare_type === "equal" && condition.options.tier === 0;

            return evaluateRankedTier(condition, tier);
        } else if (condition.type === "server") {
            // Check if we have an account in the specified region.
            return user.accounts.filter(x => x.include_region).some(x => x.region === condition.options.region);
        } else {
            ((x: never) => {})(condition); // ensure typescript infers all type coverage
            throw new Error("Invalid RoleCondition type.");
        }
    }

    /**
     * Omit id and role_id from the JSON object.
     */
    $formatJson(json: Pojo) {
        return omit(super.$formatJson(json), ["id", "role_id"]);
    }
}

/**
 * Simple helper function to evaluate if the specified ranked tier satisfies
 * the specified conditions.
 */
function evaluateRankedTier(condition: RankedTierCondition, tier: UserRank): boolean {
    const numeric = config.riot.tiers.indexOf(tier.tier) + 1;
    return condition.options.compare_type === "lower"
        ? condition.options.tier > numeric
        : condition.options.compare_type === "higher" ? condition.options.tier < numeric : condition.options.tier === numeric;
}

decorators.hasMany("conditions", () => RoleCondition, "id", "role_id")(Role);