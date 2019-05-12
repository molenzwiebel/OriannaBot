import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import { raw } from "objection";
import StaticData from "../../riot/static-data";
import randomstring = require("randomstring");
import { expectChampion, paginateRaw } from "./util";
import * as path from "path";
import * as fs from "fs";
import config from "../../config";
import generateTopGraphic from "../../graphics/top";
import { ResponseOptions } from "../response";

const TestTopCommand: Command = {
    name: "Show Leaderboards (Test)",
    hideFromHelp: true,
    smallDescription: "",
    description: ``.trim(),
    keywords: ["top-test"],
    async handler({ content, guild, ctx, client, error }) {
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

        // Return paginated image.
        const pageImages = new Map<number, string>();
        await paginateRaw(ctx, stats, async (items, offset, curPage, maxPages): Promise<ResponseOptions> => {
            // Map players to display on the graphic.
            const players = await Promise.all(items.map(async (x, i) => {
                const user = await User.query().where("id", x.user_id).first();

                return {
                    place: offset + i + 1,
                    username: user!.username,
                    avatar: user!.avatarURL + "?size=16",
                    score: x.score,
                    level: x.level
                };
            }));

            const render = async () => generateTopGraphic({
                headerImage: await StaticData.getChampionSplash(champ),
                titleImage: await StaticData.getChampionIcon(champ),
                title: champ.name + " Leaderboard",
                players
            });

            let fileName = pageImages.get(curPage);

            if (!fileName) {
                fileName = randomstring.generate({
                    length: 32
                }) + ".png";
                pageImages.set(curPage, fileName);

                fs.writeFileSync(path.join(__dirname, "../../../../frontend/dist/img/generated", fileName), await render());
            }

            return {
                footer: "Page " + curPage + " of " + maxPages + (userRank ? " • " + userRank : ""),
                image: {
                    url: config.web.url + "/img/generated/" + fileName,
                    width: 399,
                    height: 299
                }
            };
        }, 8);
    }
};
export default TestTopCommand;