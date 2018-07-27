import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import { raw } from "objection";
import StaticData from "../../riot/static-data";
import { advancedPaginate, emote, expectChampion, paginate } from "./util";
import formatName, { badge } from "../../util/format-name";

const TopCommand: Command = {
    name: "Show Leaderboards",
    smallDescription: "Show leaderboards and other neat statistics!",
    description: `
This command can show a variety of leaderboards and statistics for users and champions alike. The basic usage is very simple:
\`\`\`@Orianna Bot, who has the most points on <champion>?\`\`\`
This will show a paginated leaderboard of all players registered with Orianna and their score on \`<champion>\`. \`<champion>\` can be any champion name or abbreviation. For example, \`@Orianna Bot top mf\` will show the leaderboards for \`Miss Fortune\`. If you are currently in a server that has specified a default champion for commands, you do not have to specify a champion at all.

The above leaderboard can be limited to only players in the current server by including \`server\`. For example, \`@Orianna Bot top Orianna on this server\` will show the best Orianna players on the current server.

If you're more interested in the highest score, regardless of champion, you can include \`every\` to show a leaderboard of highest scores on a single champion (e.g. \`@Orianna Bot top every champion\`).

If you want to know the top champions for a specific user, you can do so too. Simply mention them in your message to look at their champion mastery scores. For example, \`@Orianna Bot top champions @molenzwiebel#2773\`. 
`.trim(),
    keywords: ["top", "leaderboard", "most", "highest"],
    async handler({ content, guild, ctx, msg, client, error }) {
        const normalizedContent = content.toLowerCase();
        const serverOnly = normalizedContent.includes("server");
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
        if (msg.mentions.length) {
            const user = await client.findOrCreateUser(msg.mentions[0].id);
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