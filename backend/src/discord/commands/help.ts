import { Command } from "../command";

const HelpCommand: Command = {
    name: "Help",
    keywords: ["help", "halp"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    async handler({ client, channel, msg }) {
        client.displayHelp(channel, msg.author, msg);
    }
};
export default HelpCommand;