import { Constants } from "eris";

/**
 * Attempts to compute whether the user with the given ID has the permission
 * indicated by the given permission number on the guild with the given ID.
 * If the guild is not cached, we pessimistically return false.
 */
export async function hasPermission(userId: string, userRoles: string[], guild: dissonance.Guild, permission: number): Promise<boolean> {
    // Owner can do anything.
    if (userId === guild.owner_id) {
        return true;
    }

    // We're not part of the @everyone role, so manually check.
    const everyoneRole = guild.roles.find(x => x.id === guild.id)!;
    if ((+everyoneRole.permissions & Constants.Permissions.administrator) || (+everyoneRole.permissions & permission)) {
        return true;
    }

    // Check whether any of the roles of the user has admin or allows the permission.
    return userRoles.some(x => {
        const matching = guild.roles.find(y => y.id === x);
        if (!matching) return false;

        return (+matching.permissions & Constants.Permissions.administrator) > 0 || (+matching.permissions & permission) > 0;
    });
}