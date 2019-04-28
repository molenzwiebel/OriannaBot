import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import { raw } from "objection";
import { expectChampion } from "./util";

const TestTopCommand: Command = {
    name: "Show Leaderboards (Test)",
    hideFromHelp: true,
    smallDescription: "",
    description: ``.trim(),
    keywords: ["top-test"],
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

        // Map players to display on the graphic.
        const players = await Promise.all(stats.slice(0, 5).map(async (x, i) => {
            const user = await User.query().where("id", x.user_id).first();

            return {
                place: i + 1,
                username: user!.username,
                avatar: user!.avatarURL,
                score: x.score
            };
        }));

        const image = await client.puppeteer.render("./graphics/top.html", {
            screenshot: {
                width: 399,
                height: 332
            },
            timeout: 5000,
            args: {
                champion_id: +champ.key,
                champion_name: champ.name,
                footer: "Page: 1/" + Math.ceil(stats.length / 5) + (userRank ? " • " + userRank : "") + " • " + msg.author.username,
                players
            }
        });

        await channel.createMessage("", {
            file: image,
            name: "top.png"
        });
    }
};
export default TestTopCommand;