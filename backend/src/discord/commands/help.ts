import { Command, SlashCapableCommand } from "../command";

const HelpCommand: SlashCapableCommand = {
    name: "Help",
    keywords: ["help", "halp"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
            name: "help",
            description: "Need help figuring out all Orianna Bot commands? Try this command.",
        };
    },
    convertSlashParameter: (k, v) => v,
    async handler({ client, msg, author, t }) {
        client.displayHelp(t, msg.channelID, author, msg);
    }
};
export default HelpCommand;