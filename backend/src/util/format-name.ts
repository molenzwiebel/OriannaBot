import { APIUser } from "discord-api-types/v10";
import config from "../config";
import { replaceEmoteNames } from "../discord/emotes";
import { User } from "../database";

/**
 * Formats a discord username including optional badges.
 */
export default function formatName(user: APIUser, small?: boolean): string;
export default function formatName(user: User, small?: boolean): string;
export default function formatName(subject: APIUser | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const username = (subject as APIUser).username || (subject as User).username;
    const badge = config.badges[id];
    if (badge) return username + " " + replaceEmoteNames(small ? badge.small : badge.big);

    return username;
}

/**
 * Gets the custom badge for the specified user, or "" if they have no custom badge.
 * Prepends a space to the badge for easy formatting.
 */
export function badge(user: APIUser, small?: boolean): string;
export function badge(user: User, small?: boolean): string;
export function badge(subject: APIUser | User, small = false): string {
    let id = subject.id;
    if (subject instanceof User) id = subject.snowflake;

    const badge = config.badges[id];
    if (badge) return " " + replaceEmoteNames(small ? badge.small : badge.big);
    return "";
}

