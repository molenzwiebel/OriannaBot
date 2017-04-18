import { Command } from "../message-handler";

const command: Command = {
    name: "Show Mastery Points",
    description: "Shows how many points a player has on the specified champion.",
    keywords: ["points", "mastery", "score"],
    examples: [
        "<@me>, how many points do I have?",
        "<@me>, how good is <@user> at Orianna?",
        "<@me>, do I have any points on Lux?"
    ],
    async handler(message) {
        const user = await this.expectUser(message);
        if (!user) return;

        const champ = await this.expectChampion(message);
        if (!champ) return;

        // Remind the user to add some accounts if they haven't already done so.
        if (user.accounts.length === 0) {
            return await this.error(message, {
                title: ":mag: " + user.username + " has no accounts configured.",
                description: "This command is a lot more useful if I actually have some data to show, but unfortunately " + user.username + " has no accounts setup with me. " + (message.author.id === user.snowflake ? "You" : "They") + " can add some using `@<me> configure`."
            });
        }

        const points = user.latestPoints[champ] || 0;
        const champData = this.client.championData[champ];

        return await this.ok(message, {
            description: user.username + " has " + points.toLocaleString() + " points on " + champData.name + ".",
            author: {
                name: champData.name,
                icon_url: `https://ddragon.leagueoflegends.com/cdn/${this.client.championDataVersion}/img/champion/${champData.key}.png`
            }
        });
    }
};
export default command;