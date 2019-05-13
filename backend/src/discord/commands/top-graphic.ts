import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import StaticData from "../../riot/static-data";
import randomstring = require("randomstring");
import { expectChampion, paginateRaw } from "./util";
import { generateChampionTopGraphic, generateGlobalTopGraphic } from "../../graphics/top";
import { ResponseOptions } from "../response";
import redis from "../../redis";
import { createGeneratedImagePath } from "../../web/generated-images";

const TestTopCommand: Command = {
    name: "Show Leaderboards (Test)",
    hideFromHelp: true,
    smallDescription: "",
    description: ``.trim(),
    keywords: ["top-test"],
    async handler({ msg, content, guild, ctx, error }) {
        const normalizedContent = content.toLowerCase();
        const serverOnly = normalizedContent.includes("server");
        const allChamps = normalizedContent.includes(" any") || normalizedContent.includes(" all") || normalizedContent.includes(" every");

        // You'd think that nobody is dumb enough to do this, but there are people.
        if (serverOnly && !guild) {
            return error({
                title: "❓ What Are You Doing?!?!",
                description: "Limiting leaderboards to only members in the current server while you send me a DM is a bit weird, don't you think? Consider removing `server` from your command."
            });
        }

        // No player was mentioned, show the top for the specified champion, or all champs if given.
        let champ: riot.Champion | undefined = undefined;
        if (!allChamps) {
            champ = await expectChampion(ctx);
            if (!champ) return;
        }

        // The source redis key to get our data from.
        const sourceKey = champ ? "leaderboard:" + champ.key : "leaderboard:all";

        // The redis key to pull data from.
        let redisKey: string;

        // If we are filtering on local server, do it on redis's end by creating an intermediate key.
        // Else, just return the standard collection as the redis key.
        if (serverOnly) {
            const userIds = await User
                .query()
                .select("id")
                .whereIn("snowflake", guild.members.map(x => x.id)).map<{ id: number }, number>(x => x.id);

            const userCollection = "temporary:" + randomstring.generate({ length: 32 });
            const intersectedCollection = "temporary:" + randomstring.generate({ length: 32 });

            // Insert members of server.
            await redis.zadd(userCollection, ...([] as string[]).concat(...userIds.map(x => ["0", "" + x])));

            // Run intersection.
            await redis.zinterstore(intersectedCollection, 2, userCollection, sourceKey);

            redisKey = intersectedCollection;
        } else {
            redisKey = sourceKey;
        }

        // Find the user's rank, or leave it out if they have no ori account or aren't listed on that champion.
        let userRank: undefined | string = undefined;
        const user = await ctx.user();
        if (user) {
            const rank = await redis.zrevrank(redisKey, user.id + "");
            if (rank) {
                userRank = "Your Rank: " + (rank + 1); // rank is 0-indexed
            }
        }

        const numberOfResults = await redis.zcard(redisKey);

        // Return paginated image.
        return paginateRaw(ctx, numberOfResults, async (offset, curPage): Promise<ResponseOptions> => {
            // Find entries at offset.
            const userIds: string[] = await redis.zrevrange(redisKey, offset, offset + 8);

            // Query more information about those players.
            const players = await Promise.all(userIds.map(async (x, i) => {
                const entry = allChamps
                    ? await UserChampionStat.query().where("user_id", +x).orderBy("score", "DESC").first()
                    : await UserChampionStat.query().where("champion_id", +champ!.key).where("user_id", +x).first();
                const user = await User.query().where("id", +x).first();

                return {
                    championAvatar: await StaticData.getChampionIcon(entry!.champion_id),
                    place: offset + i + 1,
                    username: user!.username,
                    avatar: user!.avatarURL + "?size=16",
                    score: entry!.score,
                    level: entry!.level
                };
            }));

            // This will return a full path to the generated image, also taking care of caching/reusing.
            const genFunction = allChamps ? generateGlobalTopGraphic : generateChampionTopGraphic;
            const imagePath = await createGeneratedImagePath(`leaderboard-${champ ? champ.key : "all"}-${msg.author.id}-${curPage}-${serverOnly}`, async () => genFunction({
                headerImage: champ ? await StaticData.getChampionSplash(champ) : "https://i.imgur.com/XVKpmRV.png",
                titleImage: champ ? await StaticData.getChampionIcon(champ) : undefined,
                title: champ ? champ.name + " Leaderboard" : "Global Leaderboard",
                players
            }));

            return {
                footer: userRank,
                image: {
                    url: imagePath,
                    width: 399,
                    height: 299
                }
            };
        }, 8);
    }
};
export default TestTopCommand;