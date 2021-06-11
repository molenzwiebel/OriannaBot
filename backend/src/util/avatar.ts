/**
 * Get the CDN URL for the given user avatar hash and user snowflake.
 */
export function getAvatarURL(snowflake: string, avatar: string) {
    if (avatar === "none") return "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png";

    // If this is an animated avatar...
    if (avatar.indexOf("a_") === 0) {
        return `https://cdn.discordapp.com/avatars/${snowflake}/${avatar}.gif`;
    } else {
        return `https://cdn.discordapp.com/avatars/${snowflake}/${avatar}.png`;
    }
}