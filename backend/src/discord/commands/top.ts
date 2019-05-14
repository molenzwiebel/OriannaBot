import { Command } from "../command";
import { User, UserChampionStat } from "../../database";
import StaticData from "../../riot/static-data";
import { emote, expectChampion, expectUserWithAccounts, paginate, paginateRaw } from "./util";
import formatName from "../../util/format-name";
import redis from "../../redis";
import randomstring = require("randomstring");
import { ResponseOptions } from "../response";
import { generateChampionTopGraphic, generateGlobalTopGraphic } from "../../graphics/top";
import { createGeneratedImagePath } from "../../web/generated-images";

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
    async handler({ msg, content, guild, ctx, error }) {
        const normalizedContent = content.toLowerCase();
        const serverOnly = normalizedContent.includes("server");
        const allChamps = normalizedContent.includes(" any") || normalizedContent.includes(" all") || normalizedContent.includes(" every");

        // A player was mentioned, show their top.
        if (msg.mentions.length || normalizedContent.includes(" me")) {
            const user = await expectUserWithAccounts(ctx);
            if (!user) return;

            await user.$loadRelated("[stats]");

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

            // Ensure that the temporary keys expire after 30 minutes.
            await redis.expire(userCollection, 30 * 60);
            await redis.expire(intersectedCollection, 30 * 60);

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
            const imagePath = createGeneratedImagePath(`leaderboard-${champ ? champ.key : "all"}-${msg.author.id}-${curPage}-${serverOnly}`, async () => genFunction({
                champion: champ,
                title: champ ? champ.name + (serverOnly ? " Server" : "") + " Leaderboard" : "Global" + (serverOnly ? " Server" : "") + " Leaderboard",
                players
            }));

            return {
                footer: userRank + " • Give us feedback! x.co/orifeedback",
                noFooterDefaults: true,
                image: {
                    url: imagePath,
                    width: 399,
                    height: 299
                }
            };
        }, 8);
    }
};
export default TopCommand;