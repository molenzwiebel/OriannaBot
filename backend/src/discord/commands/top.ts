import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import { raw } from "objection";
import StaticData from "../../riot/static-data";
import { advancedPaginate, emote, expectChampion, paginate } from "./util";
import formatName, { badge } from "../../util/format-name";
import TestTopCommand from "./top-graphic";

const TopCommand: Command = {
    name: "Show Leaderboards",
    smallDescription: "Show leaderboards and other neat statistics!",
    description: `
This command is capable of showing a variety of leaderboards and rankings, based on either your individual score or all people linked with Orianna.

**Champion Leaderboards**  
The most common usage is to show a leaderboard of all user's top scores on a specified champion. To do so, simply use \`@Orianna Bot top <champion name>\`, where champion name is any champion or [abbreviation](https://bit.ly/2wwGVMi).

If you do not specify a champion name, Orianna will fall back to the default champion in your current server, or show an error if the server has no champion setup.

To limit results to just people in the current Discord server, include \`server\` in your message.

Examples:
- \`@Orianna Bot top mf\` - shows top scores on Miss Fortune across all linked Orianna accounts
- \`@Orianna Bot top thresh server\` - shows the top scores on Thresh of all current server members

**Overall Leaderboards**  
To get a leaderboard of true champion fanatics, you can also get a leaderboard of all highest champion mastery scores regardless of champion. To do so, simply use \`@Orianna Bot top all\`. This command will show you all true champion fanatics, with millions of points invested into a single champion.

To limit results to just people in the current Discord server, include \`server\` in your message.

Examples:
- \`@Orianna Bot top all champions\` - shows top scores of all users on any champion
- \`@Orianna Bot top all champions in this server\` - shows top scores of all users in the current server

**Personal Top Champions**  
You can also see a leaderboard of your own personal mastery scores by adding \`me\` to the command. Doing so will show you a list of all your champion mastery values.

To see the leaderboard of someone else, simply mention them in your message.

Examples:
- \`@Orianna Bot top me\` - shows your top champions
- \`@Orianna Bot top @molenzwiebel\` - shows molenzwiebel's top champions
`.trim(),
    keywords: ["top", "leaderboard", "leaderboards", "most", "highest"],
    async handler({ content, guild, ctx, msg, client, error, channel }) {
        const normalizedContent = content.toLowerCase();
        const serverOnly = normalizedContent.includes("server");

        // You'd think that nobody is dumb enough to do this, but there are people.
        if (serverOnly && !guild) {
            return error({
                title: "❓ What Are You Doing?!?!",
                description: "Limiting leaderboards to only members in the current server while you send me a DM is a bit weird, don't you think? Consider removing `server` from your command."
            });
        }

        // If we filter on server only, collect the user ids of everyone in the server.
        // This is fairly expensive, but less expensive than filtering post-query.
        const serverIds = serverOnly ? (await User
            .query()
            .select("id")
            .whereIn("snowflake", guild.members.map(x => x.id))).map(x => x.id) : [];

        // Show the leaderboard for any champion.
        if (normalizedContent.includes(" any") || normalizedContent.includes(" all") || normalizedContent.includes(" every")) {
            const stats: { user_id: number, level: number, score: number, champion_id: number }[] = <any>await UserChampionStat
                .query()
                .select("user_id", "level", "score", "champion_id")              // limit how much data is transfered over socket
                .where(x => serverOnly ? x.whereIn("user_id", serverIds) : true) // filter on server only if needed
                .groupBy("user_id", "level", "score", "champion_id")             // group by user_id, the others are just there for completeness
                .orderBy("score", "DESC")                                        // obviously sort by score
                .limit(500);                                                // limit to the first 500 entries, otherwise this query is too expensive

            // Interesting pagination tricks here for the 3-columns table-esque layout.
            return advancedPaginate(ctx, Array.from(Array(150)), {
                title: "📊 Top Players" + (serverOnly ? " On This Server" : "")
            }, async (_, pageOffset) => {
                // Lazily load the users, and only the username.
                const offset = pageOffset / 3 * 10;
                const entries = stats.slice(offset, offset + 10);
                const users = await User.query().select("id", "username", "snowflake").whereIn("id", entries.map(x => x.user_id));

                return [{
                    name: "User",
                    value: entries.map((x, i) => (offset + i + 1) + " - " + formatName(users.find(y => y.id === x.user_id)!) + emote(ctx, "__")).join("\n"),
                    inline: true
                }, {
                    name: "Champion",
                    value: (await Promise.all(entries.map(async x => `${emote(ctx, await StaticData.championById(x.champion_id))} ${(await StaticData.championById(x.champion_id)).name}`))).join("\n"),
                    inline: true
                }, {
                    name: "Score",
                    value: entries.map(x => `${emote(ctx, "Level_" + x.level)} ${x.score.toLocaleString()}`).join("\n"),
                    inline: true
                }];
            }, 3);
        }

        // A player was mentioned, show their top.
        if (msg.mentions.length || normalizedContent.includes(" me")) {
            const user = await client.findOrCreateUser(msg.mentions.length ? msg.mentions[0].id : msg.author.id);
            await user.$loadRelated("[accounts, stats]");

            if (!user.accounts!.length) return error({
                title: `🔍 ${formatName(user)} has no accounts configured.`,
                description: `This command is a lot more useful if I actually have some data to show, but unfortunately ${formatName(user)} has no accounts setup with me. ${msg.author.id === user.snowflake ? "You" : "They"} can add some using \`@Orianna Bot configure\`.`
            });

            const fields = await Promise.all(user.stats!
                .sort((a, b) => b.score - a.score)
                .map(async (x, i) => {
                    const champion = await StaticData.championById(x.champion_id);

                    return {
                        name: `${emote(ctx, champion)}  ${i + 1} - ${champion.name}`,
                        value: `${emote(ctx, "Level_" + x.level)} ${x.score.toLocaleString()} Points`,
                        inline: true
                    };
                }));

            return paginate(ctx, fields, {
                title: "📊 Top Champions For " + formatName(user),
            }, 12);
        }

        // Potentially use the test version instead.
        // We use the test version if new is included, or if the last digit of the user's id is <= 5.
        // Disabled for more work. Overall results were positive, but a few common requests need to be accounted for.
        /*if (!msg.content.includes("old") && (msg.content.includes("new") || +msg.author.id.slice(-1) <= 5)) {
            await channel.createMessage("We are testing a redesigned version of Orianna's leaderboards. Please let us know what you think! <https://forms.gle/ZWmfuqtBDV8jtWQ7A>");
            await channel.sendTyping();
            return TestTopCommand.handler(ctx);
        }*/

        // No player was mentioned, show the top for the specified champion.
        const champ = await expectChampion(ctx);
        if (!champ) return;

        // This is a manual select to get fast database queries (ab)using postgres' index-only scan.
        // This command is used in over 50% of average command usages so it better be fast, not 12-20s as
        // in Orianna v1. We only query for the user_id and then lazily load those once the actual page
        // is requested, so our initial response (which is the most interesting) comes faster.
        const stats: { level: number, score: number, user_id: number }[] = <any>await UserChampionStat
            .query()
            .select(raw(`
                "user_champion_stats"."user_id" as user_id,
                "user_champion_stats"."level" as level,
                "user_champion_stats"."score" as score
            `.replace(/\n\s+/g, "").trim()))            // only select what is needed
            .where("champion_id", +champ.key)                                 // filter on selected champion
            .where(x => serverOnly ? x.whereIn("user_id", serverIds) : true)  // filter on server members if needed
            .orderBy("score", "DESC");                                        // order by score

        // Find the user's rank, or leave it out if they have no ori account.
        let userRank: undefined | string = undefined;
        const user = await ctx.user();
        if (user && stats.find(x => x.user_id === user.id)) {
            userRank = "Your Rank: " + (stats.findIndex(x => x.user_id === user.id) + 1);
        }

        return advancedPaginate(ctx, stats, {
            title: "📊 Top " + champ.name + " Players" + (serverOnly ? " On This Server" : ""),
            thumbnail: await StaticData.getChampionIcon(champ),
            footer: userRank
        }, async (entries, offset) => {
            // Lazily load the users, and only the username and id, all in the name of speed.
            const users = await User.query().select("id", "username", "snowflake").whereIn("id", entries.map(x => x.user_id));

            // If someone in this list has a badge, show an empty emote after others to ensure consistent line height.
            const showNewline = users.some(x => !!badge(x));

            return entries.map((entry, i) => ({
                name: `${offset + i + 1} - ${formatName(users.find(x => x.id === entry.user_id)!)}${showNewline ? emote(ctx, "__") : ""}`,
                value: `${emote(ctx, "Level_" + entry.level)} ${entry.score.toLocaleString()} Points`,
                inline: true
            }));
        });
    }
};
export default TopCommand;