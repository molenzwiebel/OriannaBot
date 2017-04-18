import { Command } from "../message-handler";
import { User } from "../../database";

const command: Command = {
    name: "List Accounts",
    description: "Shows which accounts you or someone else has linked with Orianna.",
    keywords: ["list", "accounts", "name"],
    examples: [
        "<@me>, which accounts do I have added?",
        "<@me>, list <@user>'s accounts.",
        "<@me>, which accounts does <@user> use?"
    ],
    async handler(message) {
        const target = await this.expectUser(message);
        if (!target) return;

        // Show error message if no accounts.
        if (target.accounts.length === 0) {
            return await this.error(message, {
                title: ":mag: " + target.username + " has no accounts configured.",
                description: (message.author.id === target.snowflake ? "You" : "They") + " can add some using `@<me> configure`."
            });
        }

        // Include avatar if only one account.
        if (target.accounts.length === 1) {
            return await this.info(message, {
                title: ":mag: " + target.username + "'s Account",
                thumbnail: `https://avatar.leagueoflegends.com/${target.accounts[0].region}/${encodeURIComponent(target.accounts[0].username)}.png`,
                fields: [{ name: target.accounts[0].region, value: "- " + target.accounts[0].username }]
            });
        }

        // Group accounts per region.
        const perRegion = target.accounts.reduce((prev, acc) => {
            if (typeof prev[acc.region] === "undefined") prev[acc.region] = [];
            prev[acc.region].push("- " + acc.username);
            return prev;
        }, {} as { [key: string]: string[] });

        return await this.info(message, {
            title: ":mag: " + target.username + "'s Accounts",
            fields: Object.keys(perRegion).map(region => ({ name: region, value: perRegion[region].join("\n"), inline: true }))
        });
    }
};
export default command;