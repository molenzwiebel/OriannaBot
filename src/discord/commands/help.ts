import { Command } from "../message-handler";
import { DiscordServerModel } from "../../database";

const command: Command = {
    name: "Help",
    description: "Shows Orianna's help, as a substitute for the :question: reaction/",
    keywords: ["help"],
    hideFromHelp: true,
    examples: ["<@me> help"],
    async handler(message) {
        await this.displayHelp(message);
    }
};
export default command;