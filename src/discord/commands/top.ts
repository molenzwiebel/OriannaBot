import MessageHandler, { Command, } from "../message-handler";
import { EmbedOptions } from "../response";
import { User, UserModel } from "../../database";
import { Database } from "basie";
import maxBy = require("lodash.maxby");
import toPairs = require("lodash.topairs");

/**
 * Helper function that replies to the specified message with a paginated list of the specified fields.
 */
const PER_PAGE = 10;
async function showPaginatedTop(handler: MessageHandler, replyTo: eris.Message, entries: { name: string, value: string }[], title: string, thumbnail?: string) {
    const maxIndex = Math.ceil(entries.length / PER_PAGE) - 1;
    let index = 0;

    function generateContents(): EmbedOptions {
        const toShow = entries.slice(index * PER_PAGE, (index + 1) * PER_PAGE);

        return {
            thumbnail,
            title: ":bar_chart: " + title,
            fields: toShow.map((x, i) => ({ name: ((index * PER_PAGE) + i + 1) + " - " + x.name, value: x.value, inline: true })),
            extraFooter: "Page " + (index + 1) + " of " + (maxIndex + 1)
        };
    }

    const response = await handler.ok(replyTo, generateContents());

    if (maxIndex !== 0) {
        await response.globalOption("⬅", () => {
            if (index === 0) return;

            index--;
            response.ok(generateContents());
        });

        await response.globalOption("➡", () => {
            if (index === maxIndex) return;

            index++;
            response.ok(generateContents());
        });

        await response.option("🗑", () => {
            response.remove();
        });
    }
}

const command: Command = {
    name: "Show Leaderboard",
    description: "Shows various leaderboards. Accepts a champion name (or the server champion by default) and if the leaderboard should be limited to this server (add `server` to do so). Use `all` instead of a champion name to display the users with the highest scores on an individual champion. Mentioning a user will show their top champions.",
    keywords: ["top", "leaderboard", "most", "highest"],
    examples: [
        "<@me>, show the leaderboard.",
        "<@me>, who has the most points on Orianna?",
        "<@me>, show the top players on this server.",
        "<@me>, show the top champions for <@user>.",
        "<@me>, who has the highest score on any champion?"
    ],
    async handler(message) {
        const normalizedContent = message.cleanContent.toLowerCase();
        // filter only people that have scores. We use a raw query to prevent account data from being loaded (since that isn't needed anyway).
        const usersWithPoints = (await Database.all("SELECT * FROM user WHERE latestPointsJson != ?", ["{}"])).map(y => new UserModel(y));

        // On any champion, instead of a specific one.
        if (normalizedContent.indexOf(" any") !== -1 || normalizedContent.indexOf(" all") !== -1 || normalizedContent.indexOf(" every") !== -1) {
            // maxScores is of type { user: User, max: [string, number] }, with max being [champId, score].
            const maxScores = usersWithPoints.map(u => ({ user: u, max: maxBy(toPairs(u.latestPoints), x => x[1]) }));
            maxScores.sort((a, b) => b.max[1] - a.max[1]);

            const fields = maxScores.map(x => ({ name: x.user.username, value: this.client.championData[+x.max[0]].name + " - " + x.max[1].toLocaleString() }));
            return await showPaginatedTop(this, message, fields, "Top Players");
        }

        // User mentioned someone, show their top.
        if (message.mentions.length) {
            const user = await this.expectUser(message);
            if (!user) return;

            if (user.accounts.length === 0) {
                return await this.error(message, {
                    title: ":mag: " + user.username + " has no accounts configured.",
                    description: "This command is a lot more useful if I actually have some data to show, but unfortunately " + user.username + " has no accounts setup with me. " + (message.author.id === user.snowflake ? "You" : "They") + " can add some using `@<me> configure`."
                });
            }

            const fields = toPairs(user.latestPoints)
                .sort((a, b) => b[1] - a[1])
                .map(x => ({ name: this.client.championData[+x[0]].name, value: x[1].toLocaleString() + " Points" }));
            return await showPaginatedTop(this, message, fields, "Top Champions for " + user.username);
        }

        // Show normal champion top.
        const champion = await this.expectChampion(message);
        if (!champion) return;

        // Server only will do nothing in pms.
        const serverOnly = normalizedContent.indexOf(" server") !== -1 || normalizedContent.indexOf(" here") !== -1;
        const isMember = (snowflake: string) => message.channel.guild ? message.channel.guild.members.has(snowflake) : false;

        const scores = usersWithPoints
            .map(user => ({ user, points: user.latestPoints[champion] || 0 }))
            .filter(x => !serverOnly || isMember(x.user.snowflake))
            .filter(x => x.points > 0)
            .sort((a, b) => b.points - a.points)
            .map(x => ({ name: x.user.username, value: x.points.toLocaleString() + " Points" }));
        return await showPaginatedTop(
            this,
            message,
            scores,
            "Top " + this.client.championData[champion].name + " Players" + (serverOnly ? " On This Server" : ""),
            "https://ddragon.leagueoflegends.com/cdn/" + this.client.championDataVersion + "/img/champion/" + this.client.championData[champion].key + ".png"
        );
    }
};
export default command;