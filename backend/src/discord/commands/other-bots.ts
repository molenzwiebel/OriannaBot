import { Command } from "../command";

const COMMANDS = [".iam", ".giveme", ".rank", "+rank", "+role", "!rank", "!role"];
const OtherBotsHelpfulCommand: Command = {
    name: "Try Help Clueless User",
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    noMention: true,
    noTyping: true,
    keywords: COMMANDS,
    async handler({ info, guild, server, msg , t }) {
        // Abort if in a DM or keyword not at the start of the message.
        if (!guild) return;
        if (!COMMANDS.some(c => msg.content.indexOf(c) === 0)) return;

        // Find server and roles.
        const s = await server();
        await s.$loadRelated("roles");

        // Find raw role name.
        let raw = msg.content.replace(/['"<>\[\]]/g, "");
        for (const cmd of COMMANDS) raw = raw.replace(cmd, "");
        raw = raw.trim();

        // Check if we have a role with that name.
        const matching = s.roles!.find(x => x.name.toLowerCase() === raw.toLowerCase());
        if (!matching) return;

        info({
            title: t.command_other_bot_title,
            description: t.command_other_bot_description({ role: matching.name })
        });
    }
};
export default OtherBotsHelpfulCommand;