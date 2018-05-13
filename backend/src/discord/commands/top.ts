import { Command } from "../command";
import { UserChampionStat } from "../../database";
import { raw } from "objection";
import StaticData from "../../riot/static-data";
import { emote, expectChampion, paginate } from "./util";

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
        const shouldShow = (id: string) => guild ? !serverOnly || guild.members.has(id) : true;

        // Show the leaderboard for any champion.
        if (normalizedContent.includes(" any") || normalizedContent.includes(" all") || normalizedContent.includes(" every")) {
            const stats = await UserChampionStat
                .query()
                .groupBy("user_id")
                .orderBy(raw("MAX(score)"), "DESC")
                .eager("user");

            const fields = await Promise.all(stats
                .filter(x => shouldShow(x.user!.snowflake))
                .map(async (x, i) => {
                    const champion = await StaticData.championById(x.champion_id);

                    return {
                        name: `#${i + 1} - ${x.user!.username}`,
                        value: `${emote(ctx, champion)} ${champion.name} - ${emote(ctx, "Level_" + x.level)} ${x.score.toLocaleString()}`,
                        inline: true
                    };
                }));

            return paginate(ctx, fields, {
                title: "📊 Top Players" + (serverOnly ? " On This Server" : "")
            });
        }

        // A player was mentioned, show their top.
        if (msg.mentions.length) {
            const user = await client.findOrCreateUser(msg.mentions[0].id);
            await user.$loadRelated("[accounts, stats]");

            if (!user.accounts!.length) return error({
                title: `🔍 ${user.username} has no accounts configured.`,
                description: `This command is a lot more useful if I actually have some data to show, but unfortunately ${user.username} has no accounts setup with me. ${msg.author.id === user.snowflake ? "You" : "They"} can add some using \`@Orianna Bot configure\`.`
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
                title: "📊 Top Champions For " + user.username,
            }, 12);
        }

        // No player was mentioned, show the top for the specified champion.
        const champ = await expectChampion(ctx);
        if (!champ) return;

        const stats = await UserChampionStat
            .query()
            .where("champion_id", +champ.key)
            .orderBy("score", "DESC")
            .eager("user");

        const fields = stats
            .filter(x => shouldShow(x.user!.snowflake))
            .map((x, i) => ({
                name: `${i + 1} - ${x.user!.username}`,
                value: `${emote(ctx, "Level_" + x.level)} ${x.score.toLocaleString()} Points`,
                inline: true
            }));

        return paginate(ctx, fields, {
            title: "📊 Top " + champ.name + " Players" + (serverOnly ? " On This Server" : ""),
            thumbnail: await StaticData.getChampionIcon(champ)
        });
    }
};
export default TopCommand;