import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { SlashCapableCommand } from "../command";

const HelpCommand: SlashCapableCommand = {
    name: "Help",
    keywords: ["help", "halp"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.Subcommand,
            name: "help",
            description: "Need help figuring out all Orianna Bot commands? Try this command.",
        };
    },
    convertSlashParameter: (k, v) => v,
    async handler({ client, responseContext, t }) {
        client.displayHelp(t, responseContext);
    }
};
export default HelpCommand;