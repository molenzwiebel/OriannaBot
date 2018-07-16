import { Command } from "../command";

const COMMANDS = [".iam", ".giveme", ".rank", "+rank", "+role", "!rank", "!role"];
const OtherBotsHelpfulCommand: Command = {
    name: "Try Help Clueless User",
    smallDescription: "",
    description: ``.trim(),
    hideFromHelp: true,
    noMention: true,
    noTyping: true,
    keywords: COMMANDS,
    async handler({ info, guild, server, msg }) {
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
            title: "💡 Pro Tip!",
            description: "The `" + matching.name + "` role is managed by me. You can setup your account (using `@Orianna Bot configure`) to enable automatic role assignment. Already added an account? Wait for me to update you, or use `@Orianna Bot refresh` to update immediately."
        });
    }
};
export default OtherBotsHelpfulCommand;