import config from "./config";
import { Role, RoleCondition, Server, User } from "./database";
import fetch from "node-fetch";

/**
 * Perform a request to Shockwave to fetch and update the latest statistics
 * for the given user. If a string argument is given, it is assumed to be the
 * snowflake of the user. Will return true if there is no user with that
 * snowflake (since we technically successfully updated the user).
 */
export async function fetchAndUpdateUser(user: User | string): Promise<boolean> {
    if (typeof user === "string") {
        const dbUser = await User.query().where("snowflake", user).first();
        if (!dbUser) return true;

        user = dbUser;
    }

    return fetch(`${config.shockwave.url}/api/v1/user/${user.id}/update`, {
        method: "POST"
    }).then(x => x.json()).then(x => !!x.successful).catch(() => false);
}

/**
 * Perform a request to shockwave to evaluate the conditions for the given
 * user on all roles configured on the given server. Returns whether the user applies
 * for the role in its entirety, as well as a map that describes the specific status
 * for each of the sub-conditions of the role.
 */
export async function evaluateRolesForUser(user: User, server: Server): Promise<Map<Role, {
    applies: boolean;
    conditions: Map<RoleCondition, boolean>;
}>> {
    const response = await fetch(`${config.shockwave.url}/api/v1/evaluate/${server.id}/${user.id}`, {
        method: "POST"
    });

    if (!response.ok) throw new Error("Failed to communicate with Shockwave.");

    const result: [{
        role: number,
        applies: boolean,
        conditions: [number, boolean][]
    }] = await response.json();

    const ret = new Map();

    for (const entry of result) {
        const role = server.roles?.find(x => x.id === entry.role);
        if (!role) continue;

        const conditions = new Map();
        for (const cond of entry.conditions) {
            const condition = role.conditions?.find(x => x.id === cond[0]);
            if (!condition) continue;

            conditions.set(condition, cond[1]);
        }

        ret.set(role, {
            applies: entry.applies,
            conditions
        });
    }

    return ret;
}