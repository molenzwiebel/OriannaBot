import { Command } from "../message-handler";

const command: Command = {
    name: "Show Configured Roles",
    description: "Lists all roles and their corresponding mastery ranges configured on this server.",
    keywords: ["roles", "ranks"],
    examples: [
        "<@me>, which roles are configured on this server?"
    ],
    async handler(message) {
        const server = await this.expectServer(message);
        if (!server) return;

        return this.ok(message, {
            title: ":book: Roles Configured on " + server.name,
            description: server.roles.map(x => `- ${x.name} (${x.range})`).join("\n")
        });
    }
};
export default command;