import { Command } from "../message-handler";
import { UserModel } from "../../database";
import MessageHandler from "../message-handler";

async function trySendDM(handler: MessageHandler, trigger: eris.Message, embed: eris.Embed) {
    const dmChannel = await handler.client.bot.getDMChannel(trigger.author.id);

    try {
        await dmChannel.createMessage({ embed });
    } catch (e) {
        await handler.error(trigger, {
            title: ":mailbox_closed: Your mailbox is private!",
            description: "You seem to have configured your account to only allow direct messages from friends. This unfortunately means that I can't send you DMs. To enable direct messages from server members, go to `Privacy & Safety` in your preferences and toggle `Allow direct messages from server members.` on (see the image).",
            image: "http://i.imgur.com/yd5UQni.png"
        });
    }
}

const command: Command = {
    name: "Edit",
    description: "Sends you your unique edit link for when you _accidentally_ lost yours. Server admins can include `server` to receive the server edit link instead.",
    keywords: ["edit", "config", "add", "remove"],
    examples: [
        "<@me>, I want to edit my accounts.",
        "<@me>, send me my edit link.",
        "<@me>, I need to add an account."
    ],
    async handler(message) {
        const normalizedContent = message.cleanContent.toLowerCase();

        if (normalizedContent.indexOf("server") !== -1 || normalizedContent.indexOf("guild") !== -1) {
            const server = await this.expectServer(message);
            if (!server) return;
            if (!await this.expectManagePermission(message)) return;

            return await trySendDM(this, message, {
                color: 0x49bd1a, // green
                title: ":link: You wanted a link?",
                description: `To configure how Orianna manages ${message.channel.guild.name}, visit this link: ${this.client.config.baseUrl}/#/configure/${server.configCode}.`
                           + `\n\n:warning: **Anyone with this link can configure the server!** Do not share it unless you completely trust the receiver!`
            });
        }

        const user = await UserModel.findBy({ snowflake: message.author.id });

        // If the user doesn't exist, send them the introductory message instead.
        if (!user) {
            await this.client.registerUser(message.author, "Nice to meet you!", "Normally this should've been sent when you joined the server, but apparently you slipped through my surveillance :thinking:. Anyway, I'm Orianna, a bot that tracks champion mastery for Discord servers.");
            return;
        }

        return await trySendDM(this, message, {
            color: 0x49bd1a, // green
            title: ":link: You wanted a link?",
            description: `To configure the League accounts associated with your Discord account, visit this link: ${this.client.config.baseUrl}/#/player/${user.configCode}.`
            + `\n\n:warning: **Anyone with this link can configure your accounts!** Do not share it unless you completely trust the receiver!`
        });
    }
};
export default command;