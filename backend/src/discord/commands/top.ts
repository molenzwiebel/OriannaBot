import { GuildMember, User } from "../../database";
import { generateChampionTopGraphic, generateGlobalTopGraphic } from "../../graphics/top";
import formatName from "../../util/format-name";
import { createGeneratedFilePath } from "../../web/generated-images";
import { SlashCapableCommand } from "../command";
import { ResponseOptions } from "../response";
import { masteryEmote, emote, expectChampion, expectUserWithAccounts, paginate, paginateRaw } from "./util";
import { createLeaderboardQuery } from "../../database/leaderboards";
import { getAvatarURL } from "../../util/avatar";

const TopCommand: SlashCapableCommand = {
    name: "Show Leaderboards",
    smallDescriptionKey: "command_top_small_description",
    descriptionKey: "command_top_description",
    keywords: ["top", "leaderboard", "leaderboards", "most", "highest"],
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND_GROUP,
            name: "top",
            description: t.command_top_small_description,
            options: [{
                type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
                name: "champion",
                description: "Shows the players with the top mastery on the given champion.",
                options: [{
                    type: dissonance.ApplicationCommandOptionType.STRING,
                    required: true,
                    // default: true,
                    description: "The champion to show statistics for.",
                    name: "champion"
                }, {
                    type: dissonance.ApplicationCommandOptionType.BOOLEAN,
                    name: "server-only",
                    description: "Whether to only show players on this server."
                }]
            }, {
                type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
                name: "user",
                description: "Shows the top played champions for the specified user.",
                options: [{
                    type: dissonance.ApplicationCommandOptionType.USER,
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
    async handler({ mentions, content, guild, ctx, error, t, author, server }) {
        const normalizedContent = content.toLowerCase();
        const serverOnly = normalizedContent.includes("server");
        const allChamps = normalizedContent.includes(" any") || normalizedContent.includes(" all") || normalizedContent.includes(" every");

        // A player was mentioned, show their top.
        if (mentions.length || normalizedContent.includes(" me")) {
            const user = await expectUserWithAccounts(ctx);
            if (!user) return;

            await user.$loadRelated("[stats]");

            const fields = await Promise.all(user.stats!
                .sort((a, b) => b.score - a.score)
                .map(async (x, i) => {
                    const champion = await t.staticData.championById(x.champion_id);

                    return {
                        name: `**${emote(champion)}  ${i + 1}\u00a0-\u00a0${champion.name}**`,
                        value: `${masteryEmote(x.level)}\u00a0Level\u00a0${x.level}\u00a0\n${x.score.toLocaleString()}\u00a0` + t.command_top_points + emote("__"),
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

        // The leaderboard key to get data from.
        const key = champ ? "" + champ.key : "all";
        let filter = null;

        // If we are filtering on local server, do it on redis's end by creating an intermediate key.
        // Else, just return the standard collection as the redis key.
        if (serverOnly) {
            // Check if we need to limit to a specific role. Ensure that that role exists.
            const specifiedRoleFilter = (await server()).server_leaderboard_role_requirement;
            const roleLimit = specifiedRoleFilter && guild!.roles.some(x => x.id === specifiedRoleFilter) ? specifiedRoleFilter : null;

            filter = {
                id: guild!.id,
                requiredRoleId: roleLimit
            };
        }

        const query = createLeaderboardQuery(key, filter);

        // Find the user's rank, or leave it out if they have no ori account or aren't listed on that champion.
        let userRank: undefined | string = undefined;
        const user = await ctx.user();
        if (user) {
            const rank = await query.rank(user.id);
            if (rank === false) {
                // todo: translate
                userRank = t.command_top_rank({ rank: ">" + t.number(10000) });
            } else if (typeof rank === "number") {
                userRank = t.command_top_rank({ rank });
            }
        }

        const numberOfResults = await query.count();

        // Return paginated image.
        return paginateRaw(ctx, numberOfResults, async (offset, curPage): Promise<ResponseOptions> => {
            // Find entries at offset.
            const entries = await query.range(offset, offset + 8);

            // Query more information about those players.
            const players = await Promise.all(entries.map(async (entry, i) => {
                return {
                    championAvatar: await t.staticData.getChampionIcon(entry!.champion_id),
                    place: offset + i + 1,
                    username: entry!.username,
                    avatar: getAvatarURL(entry.snowflake, entry.avatar) + "?size=16",
                    score: entry!.score,
                    level: entry!.level
                };
            }));

            // This will return a full path to the generated image, also taking care of caching/reusing.
            const genFunction = allChamps ? generateGlobalTopGraphic : generateChampionTopGraphic;
            const imagePath = createGeneratedFilePath(".jpg", `leaderboard-${champ ? champ.key : "all"}-${author.id}-${curPage}-${serverOnly ? guild!.id : "false"}`, async () => genFunction(
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