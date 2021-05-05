import config from "../config";
import { User } from "../database";

/**
 * Formats a discord username including optional badges.
 */
export default function formatName(user: dissonance.User, small?: boolean): string;
export default function formatName(user: User, small?: boolean): string;
export default function formatName(subject: dissonance.User | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const username = (subject as dissonance.User).username || (subject as User).username;
    const badge = config.badges[id];
    if (badge) return username + " " + (small ? badge.small : badge.big);

    return username;
}

/**
 * Gets the custom badge for the specified user, or "" if they have no custom badge.
 * Prepends a space to the badge for easy formatting.
 */
export function badge(user: dissonance.User, small?: boolean): string;
export function badge(user: User, small?: boolean): string;
export function badge(subject: dissonance.User | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const badge = config.badges[id];
    if (badge) return " " + (small ? badge.small : badge.big);
    return "";
}

