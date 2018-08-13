import { Command } from "../command";
import { emote, expectChampion, expectUser } from "./util";
import { UserMasteryDelta } from "../../database";
import StaticData from "../../riot/static-data";
import formatName, { badge } from "../../util/format-name";

const StatsCommand: Command = {
    name: "Show Stats",
    smallDescription: "",
    description: ``.trim(),
    hideFromHelp: true,
    keywords: ["stats", "graph", "chart", "progression", "progress"],
    async handler({ info, msg, ctx, client, error }) {
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
            const isUs = target.snowflake === msg.author.id;

            return error({
                title: "🔍 There's Nothing Here!",
                description: `<@!${target.snowflake}>${badge(target)} has no tracked games on ${champ.name}. ${isUs ? "You" : "They"}'ll need to play some games before I can show statistics.`
            });
        }

        // Count projected wins and losses. Might be slightly inaccurate.
        const win = values.filter(x => x.delta > 600).length;
        const loss = values.length - win;
        const pct = (win / values.length * 100).toFixed(2);
        const fmtDate = (ts: string) => new Date(+ts).toISOString().slice(0, 10);

        // Chart resulting data.
        const chart = await client.puppeteer.render("./graphics/stats-chart.html", {
            screenshot: {
                width: 399,
                height: 250
            },
            args: {
                width: 399,
                height: 250,
                values
            }
        });

        info({
            title: "📈 Mastery Stats - " + formatName(target) + " - " + champ.name,
            thumbnail: await StaticData.getChampionIcon(champ),
            fields: [{
                name: "Data",
                value: `**${values.length}** Games Tracked\n**${fmtDate(values[0].timestamp)}** First Game\n**${fmtDate(values[values.length - 1].timestamp)}** Last Game\n${emote(ctx, "__")}`,
                inline: true
            }, {
                name: "Games",
                value: `**${win}** Wins\n**${loss}** Losses\n**${pct}%** Win Rate\n${emote(ctx, "__")}`,
                inline: true
            }],
            file: { name: "chart.png", file: chart }
        });
    }
};
export default StatsCommand;