import { Command } from "../command";

const HelpCommand: Command = {
    name: "Help",
    keywords: ["help", "halp"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    async handler({ client, msg, author, t }) {
        client.displayHelp(t, msg.channelID, author, msg);
    }
};
export default HelpCommand;