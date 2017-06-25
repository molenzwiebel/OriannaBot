import { Command } from "../message-handler";
import { ScoreDeltaModel } from "../../database";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const command: Command = {
    name: "Show Mastery Stats",
    description: "Shows a simple line graph of your mastery score progression since Orianna started tracking you. Use the online charts for a more granular visualization of the data.",
    keywords: ["stats", "graph", "chart", "progression", "progress"],
    examples: [
        "<@me>, chart my Orianna score.",
        "<@me>, show <@user>'s stats on Orianna."
    ],
    async handler(message) {
        const user = await this.expectUser(message);
        if (!user) return;

        const champ = await this.expectChampion(message);
        if (!champ) return;

        const champData = this.client.championData[champ];

        const deltas = await ScoreDeltaModel.where({ user: user.id, championId: champ });
        if (deltas.length <= 1) {
            return await this.error(message, {
                title: ":mag: I don't seem to have that data.",
                description: "I'd love to chart the mastery progression for <@!" + user.snowflake + ">'s " + champData.name + ", but unfortunately I do not have any data on them.\n\nTracking only started on June 23rd, and I only track users registered with Orianna. Try this command again in a few days when I have something to show you."
            });
        }

        deltas.sort((a, b) => a.timestamp - b.timestamp);

        const beginDate = new Date(deltas[0].timestamp);
        const endDate = new Date(deltas[deltas.length - 1].timestamp);

        const minX = deltas[0].timestamp;
        const maxX = deltas[deltas.length - 1].timestamp;
        const xValues = deltas.map(x => 100 - ((maxX - x.timestamp) / (maxX - minX) * 100));

        const minY = deltas.reduce((p, c) => c.newValue < p ? c.newValue : p, 1e9);
        const maxY = deltas.reduce((p, c) => c.newValue > p ? c.newValue : p, -1);
        const yValues = deltas.map(x => 100 - ((maxY - x.newValue) / (maxY - minY) * 100));

        const query = [
            `chs=540x280`,
            `cht=lxy`,
            `chtt=Champion Mastery Over Time - ${user.username} - ${champData.name}`,
            `chma=65,30,20,20`,
            `chxt=x,y`,
            `chm=o,000000,0,-1,4`,
            `chxs=0,,14,0,lt|1,,14,0,lt`,
            `chxl=0:|${beginDate.getDate()} ${MONTHS[beginDate.getMonth()]}|${endDate.getDate()} ${MONTHS[endDate.getMonth()]}|1:|${deltas[0].newValue.toLocaleString()}|${deltas[deltas.length - 1].newValue.toLocaleString()}`,
            `chd=t:${xValues.map(x=>x.toFixed(2)).join(",")}|${yValues.map(x=>x.toFixed(2)).join(",")}`
        ].map(encodeURI).join("&");

        const url = this.client.config.baseUrl + "/#/stats/" + user.id + "/" + champData.key;
        return await this.info(message, {
            image: `http://chart.googleapis.com/chart?${query}`,
            title: ":chart_with_upwards_trend: Champion Mastery Over Time",
            description: deltas.length + " data points. [Click here](" + url + ") for a more granular visualization online.",
            url
        });
    }
};
export default command;