import { Command } from "../command";

const HelpCommand: Command = {
    name: "Help",
    keywords: ["help", "halp"],
    smallDescription: "Displays this help.",
    description: "Displays a list of commands. What else do you expect it to do?",
    hideFromHelp: true,
    async handler({ client, channel, msg }) {
        client.displayHelp(channel, msg.author, msg);
    }
};
export default HelpCommand;