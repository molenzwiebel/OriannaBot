import { Command } from "../message-handler";
import { DiscordServerModel } from "../../database";

/**
 * Simple command that filters the Nadeko and ErisBot ".iam"/".giveme" commands and checks to see if the user attempts to give themselves
 * a role that Orianna is currently managing. If so, a message is printed (but no attempt is done at stopping the user).
 */
const command: Command = {
    name: "Role Assign Command Diagnostics",
    description: "Tries to be helpful when someone uses a role assignment command (.iam, .giveme) when they should be using Orianna.",
    keywords: [".iam", ".giveme"],
    hideFromHelp: true,
    noMention: true,
    examples: [
        ".iam <role that orianna is currently managing>",
        ".giveme <role that orianna is currently managing>"
    ],
    async handler(message) {
        if (!message.channel.guild) return;

        const server = await DiscordServerModel.findBy({ snowflake: message.channel.guild.id });
        if (!server) return;

        const normalizedContent = message.cleanContent;
        if (normalizedContent.indexOf(".iam") !== 0 && normalizedContent.indexOf(".giveme") !== 0) return; // if it didn't start with the keyword

        const targetRole = normalizedContent.replace(".iam", "").replace(".giveme", "").replace(/"/g, "").trim();
        const managedRoleNames = ([] as string[]).concat(...[server.regionRoles ? this.client.config.regions : [], server.tierRoles ? this.client.config.tiers : [], server.roles.map(x => x.name)]);

        if (managedRoleNames.find(x => x.toLowerCase() === targetRole.toLowerCase())) {
            await this.info(message, {
                title: ":bulb: Pro Tip!",
                description: "The `" + targetRole + "` role is managed by me. You can setup your account (using `@<me> configure`) to enable automatic role assignment. Already added an account? Wait for me to update you, or use `@<me> refresh` to update immediately."
            });
        }
    }
};
export default command;