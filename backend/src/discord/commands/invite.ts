import { Command } from "../command";
import config from "../../config";

const InviteCommand: Command = {
    name: "Invite To Server",
    keywords: ["invite"],
    smallDescriptionKey: "command_invite_small_description",
    descriptionKey: "command_invite_description",
    hideFromHelp: true,
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