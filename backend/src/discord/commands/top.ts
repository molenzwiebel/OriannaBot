import { User, UserChampionStat } from "../../database";
import { generateChampionTopGraphic, generateGlobalTopGraphic } from "../../graphics/top";
import redis from "../../redis";
import formatName from "../../util/format-name";
import { createGeneratedImagePath } from "../../web/generated-images";
import { SlashCapableCommand } from "../command";
import { ResponseOptions } from "../response";
import { ApplicationCommandOptionType } from "../slash-commands";
import { emote, expectChampion, expectUserWithAccounts, paginate, paginateRaw } from "./util";
import randomstring = require("randomstring");

const TopCommand: SlashCapableCommand = {
    name: "Show Leaderboards",
    smallDescriptionKey: "command_top_small_description",
    descriptionKey: "command_top_description",
    keywords: ["top", "leaderboard", "leaderboards", "most", "highest"],
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.SUB_COMMAND_GROUP,
            name: "top",
            description: t.command_top_small_description,
            options: [{
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "champion",
                description: "Shows the players with the top mastery on the given champion.",
                options: [{
                    type: ApplicationCommandOptionType.STRING,
                    required: true,
                    // default: true,
                    description: "The champion to show statistics for.",
                    name: "champion"
                }, {
                    type: ApplicationCommandOptionType.BOOLEAN,
                    name: "server-only",
                    description: "Whether to only show players on this server."
                }]
            }, {
                type: ApplicationCommandOptionType.SUB_COMMAND,
                name: "user",
                description: "Shows the top played champions for the specified user.",
                options: [{
                    type: ApplicationCommandOptionType.USER,
                    required: true,
                    name: "user",
                    // default: true,
                    description: "The user to show played champions for."
                }]
            }]
        };
    },
    convertSlashParameter(key, value) {
        if (key === "user") return `<@!${value}>`;
        if (key === "server-only") return value ? "server" : "";
        if (key === "champion") return value;
        throw "Illegal key: " + key;
    },
    async handler({ msg, content, guild, ctx, error, t, author, server }) {
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
                    const champion = await t.staticData.championById(x.champion_id);

                    return {
                        name: `**${emote(ctx, champion)}  ${i + 1}\u00a0-\u00a0${champion.name}**`,
                        value: `${emote(ctx, "Level_" + x.level)}\u00a0${x.score.toLocaleString()}\u00a0` + t.command_top_points,
                        inline: true
                    };
                }));

            return paginate(ctx, fields, {
                title: t.command_top_personal_title({ name: formatName(user) }),
            }, 12);
        }

        // You'd think that nobody is dumb enough to do this, but there are people.
        if (serverOnly && !guild) {
            return error({
                title: t.command_top_no_server_title,
                description: t.command_top_no_server_description
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
            // Check if we need to limit to a specific role. Ensure that that role exists.
            const specifiedRoleFilter = (await server()).server_leaderboard_role_requirement;
            const roleLimit = specifiedRoleFilter && guild.roles.has(specifiedRoleFilter) ? specifiedRoleFilter : null;

            const userIds = await User
                .query()
                .select("id")
                .whereIn("snowflake", guild.members
                    .filter(x => !roleLimit || x.roles.includes(roleLimit))
                    .map(x => x.id)
                )
                .map<{ id: number }, number>(x => x.id);

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
                userRank = t.command_top_rank({ rank: rank + 1 }); // rank is 0-indexed
            }
        }

        const numberOfResults = await redis.zcard(redisKey);

        // Return paginated image.
        return paginateRaw(ctx, numberOfResults, async (offset, curPage): Promise<ResponseOptions> => {
            // Find entries at offset.
            const userIds: string[] = await redis.zrevrange(redisKey, offset, offset + 8);

            // Query more information about those players.
            const players = await Promise.all(userIds.map(async (x, i) => {
                let entry = allChamps
                    ? await UserChampionStat.query().where("user_id", +x).orderBy("score", "DESC").first()
                    : await UserChampionStat.query().where("champion_id", +champ!.key).where("user_id", +x).first();
                const user = await User.query().where("id", +x).first();

                if (!entry) {
                    return {
                        championAvatar: "",
                        place: offset + i + 1,
                        username: "Deleted Account",
                        avatar: "",
                        score: 0,
                        level: 0
                    };
                }

                return {
                    championAvatar: await t.staticData.getChampionIcon(entry!.champion_id),
                    place: offset + i + 1,
                    username: user!.username,
                    avatar: user!.avatarURL + "?size=16",
                    score: entry!.score,
                    level: entry!.level
                };
            }));

            // This will return a full path to the generated image, also taking care of caching/reusing.
            const genFunction = allChamps ? generateGlobalTopGraphic : generateChampionTopGraphic;
            const imagePath = createGeneratedImagePath(`leaderboard-${champ ? champ.key : "all"}-${author.id}-${curPage}-${serverOnly ? guild.id : "false"}`, async () => genFunction(
                t, {
                champion: champ,
                title: champ
                    ? serverOnly ? t.command_top_server_title({ champ: champ.name }) : t.command_top_title({ champ: champ.name })
                    : serverOnly ? t.command_top_global_server_title : t.command_top_global_title,
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
export default TopCommand;