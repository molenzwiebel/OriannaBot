import { UserMasteryDelta } from "../../database";
import generateStatsGraphic from "../../graphics/stats";
import formatName, { badge } from "../../util/format-name";
import { SlashCapableCommand } from "../command";
import { emote, expectChampion, expectUser } from "./util";

const StatsCommand: SlashCapableCommand = {
    name: "Show Stats",
    smallDescriptionKey: "command_stats_small_description",
    descriptionKey: "command_stats_description",
    keywords: ["stats", "graph", "chart", "progression", "progress"],
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
            name: "stats",
            description: "View your mastery as it grows and evolves over time.",
            options: [{
                type: dissonance.ApplicationCommandOptionType.STRING,
                name: "champion",
                description: "The champion whose mastery progression you'd like to look up.",
                // default: true,
                required: true
            }, {
                type: dissonance.ApplicationCommandOptionType.USER,
                name: "user",
                description: "The Discord user whose mastery progression you'd like to look up.",
            }]
        };
    },
    convertSlashParameter(k, v) {
        if (k === "champion") return v;
        if (k === "user") return `<@!${v}>`;
        throw "Unknown parameter: " + k;
    },
    async handler({ info, ctx, author, error, t }) {
        // Find champion and target user.
        const champ = await expectChampion(ctx);
        if (!champ) return;
        const target = await expectUser(ctx);

        // Find all mastery delta values, filter those who
        // are most likely not single game increments.
        const values = await UserMasteryDelta
            .query()
            .select("value", "delta", "timestamp")
            .where("user_id", target.id)
            .where("champion_id", +champ.key)
            .where(nested => {
                nested.where("delta", ">", 100);
                nested.andWhere("delta", "<", 2000);
            })
            .orderBy("timestamp", "ASC");

        if (!values.length) {
            const isUs = target.snowflake === author.id;

            return error({
                title: t.command_stats_no_values_title,
                description: t.command_stats_no_values_description({
                    user: `<@!${target.snowflake}>${badge(target)}`,
                    champion: champ.name
                })
            });
        }

        // Count projected wins and losses. Might be slightly inaccurate.
        const win = values.filter(x => x.delta > 600).length;
        const loss = values.length - win;
        const pct = (win / values.length * 100).toFixed(2);
        const fmtDate = (date: Date) => date.toISOString().slice(0, 10);

        // Chart resulting data.
        const chart = await generateStatsGraphic(values);

        info({
            title: t.command_stats_message_title({ name: formatName(target), champion: champ.name }),
            thumbnail: await t.staticData.getChampionIcon(champ),
            fields: [{
                name: t.command_stats_message_data,
                value: t.command_stats_message_data_value({
                    numGames: values.length,
                    firstGameDate: fmtDate(values[0].timestamp),
                    lastGameDate: fmtDate(values[values.length - 1].timestamp)
                }) + emote("__"),
                inline: true
            }, {
                name: t.command_stats_message_games,
                value: t.command_stats_message_games_value({
                    win, loss, winrate: pct
                }) + emote("__"),
                inline: true
            }],
            file: { name: "chart.png", file: chart }
        });
    }
};
export default StatsCommand;