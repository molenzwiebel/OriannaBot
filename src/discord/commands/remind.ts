import { Command } from "../message-handler";
import { UserModel } from "../../database";

const command: Command = {
    name: "Remind Users",
    description: "Reminds any unregistered members of the current server that they still need to configure Orianna (admins only).",
    keywords: ["remind"],
    examples: [
        "<@me>, remind everyone to configure their accounts."
    ],
    async handler(message) {
        const server = await this.expectServer(message);
        if (!server) return;
        if (!await this.expectManagePermission(message)) return;

        const res = await this.info(message, {
            title: ":hourglass_flowing_sand: Reminding users that I exist..."
        });

        let successful = 0, errored = 0;
        for (const member of message.channel.guild.members.map(x => x)) {
            if (member.bot) continue;

            const user = await UserModel.findBy({ snowflake: member.id });
            if (!user || user.accounts.length > 0 || user.optedOutOfReminding) continue;

            const dmChannel = await this.client.bot.getDMChannel(member.id);
            try {
                const response = await this.info(message, {
                    title: ":wave: Hey, listen!",
                    description: `The owner of **${server.name}** has asked me to remind you that you still need to link your accounts with me. `
                    + `It will only take a brief moment, and you'll only have to do it once! If you are already using the Reddit flair system, it is even easier to link your accounts. `
                    + `As a reminder, you can go to ${this.client.config.baseUrl}/#/player/${user.configCode} to add accounts.\n\n`
                    + `Don't want any more reminders? Click the :octagonal_sign: and I'll stop reminding you.`,
                    noExpire: true
                }, dmChannel);

                // This needs to be global so that the receiver can click it (and not just the one that "triggered" this reply)
                response.globalOption("🛑", async () => {
                    user.optedOutOfReminding = true;
                    await user.save();
                    await response.removeOption("🛑");

                    response.ok({
                        title: ":neutral_face: Okay then...",
                        description: "I'll stop annoying you. If you later regret this decision, you can always mention me using `@<me> edit` to get reminded of your edit link."
                    });
                });

                successful++;
            } catch (e) {
                // Probably because they have PMs turned off.
                errored++;
            }
        }

        await res.ok({
            title: ":speech_balloon: All done!",
            description: "I successfully reminded " + successful + " users." + (errored > 0 ? " I couldn't remind " + errored + " users, probably because they have their DMs set to private." : "")
        });
    }
};
export default command;