import config from "../../config";
import { SlashCapableCommand } from "../command";

const InviteCommand: SlashCapableCommand = {
    name: "Invite To Server",
    keywords: ["invite"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
            name: "invite",
            description: "Want to add Orianna Bot to your own server? Just use this command.",
        };
    },
    convertSlashParameter: (k, v) => v,
    async handler({ info, t }) {
        info({
            title: t.command_invite_title,
            description: t.command_invite_message_description({
                link: `${config.web.url}/api/v1/discord-invite`
            })
        });
    }
};
export default InviteCommand;