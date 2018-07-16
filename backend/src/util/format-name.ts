import config from "../config";
import * as eris from "eris";
import { User } from "../database";

/**
 * Formats a discord username including optional badges.
 */
export default function formatName(member: eris.Member, small?: boolean): string;
export default function formatName(user: eris.User, small?: boolean): string;
export default function formatName(user: User, small?: boolean): string;
export default function formatName(subject: eris.Member | eris.User | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const username = subject.username;
    const badge = config.badges[id];
    if (badge) return username + " " + (small ? badge.small : badge.big);

    return username;
}

/**
 * Gets the custom badge for the specified user, or "" if they have no custom badge.
 * Prepends a space to the badge for easy formatting.
 */
export function badge(member: eris.Member, small?: boolean): string;
export function badge(user: eris.User, small?: boolean): string;
export function badge(user: User, small?: boolean): string;
export function badge(subject: eris.Member | eris.User | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const badge = config.badges[id];
    if (badge) return " " + (small ? badge.small : badge.big);
    return "";
}

