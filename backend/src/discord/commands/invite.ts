import { Command } from "../command";
import config from "../../config";

const InviteCommand: Command = {
    name: "Invite To Server",
    keywords: ["invite"],
    smallDescription: "Sends you a link to invite Orianna.",
    description: "Sends a simple link that you can use to invite Orianna Bot to your own server.",
    hideFromHelp: true,
    async handler({ info }) {
        info({
            title: "🤖 So You Want An Invite?",
            description: `To add Orianna Bot to your own Discord server, simply use [this](${config.web.url}/api/v1/discord-invite) link. Thanks for liking Orianna Bot enough to consider adding her to your own server!`
        });
    }
};
export default InviteCommand;