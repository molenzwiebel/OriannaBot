import { Command } from "../command";
import { emote, expectChampion, expectUser } from "./util";
import { UserMasteryDelta } from "../../database";
import formatName, { badge } from "../../util/format-name";
import generateStatsGraphic from "../../graphics/stats";

const StatsCommand: Command = {
    name: "Show Stats",
    smallDescriptionKey: "command_stats_small_description",
    descriptionKey: "command_stats_description",
    keywords: ["stats", "graph", "chart", "progression", "progress"],
    async handler({ info, msg, ctx, author, error, t }) {
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
        const fmtDate = (ts: string) => new Date(+ts).toISOString().slice(0, 10);

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
                }) + emote(ctx, "__"),
                inline: true
            }, {
                name: t.command_stats_message_games,
                value: t.command_stats_message_games_value({
                    win, loss, winrate: pct
                }) + emote(ctx, "__"),
                inline: true
            }],
            file: { name: "chart.png", file: chart }
        });
    }
};
export default StatsCommand;