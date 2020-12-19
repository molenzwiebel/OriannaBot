import { Command, SlashCapableCommand } from "../command";
import { UserAuthKey } from "../../database";
import { randomBytes } from "crypto";
import config from "../../config";
import { ApplicationCommandOptionType } from "../slash-commands";

const EditCommand: SlashCapableCommand = {
    name: "Edit Profile",
    smallDescriptionKey: "command_edit_small_description",
    descriptionKey: "command_edit_description",
    keywords: ["edit", "config", "configure", "add", "remove"],
    noTyping: true,
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "edit",
            description: "Add, remove or edit the League accounts you've linked with Orianna Bot.",
        };
    },
    convertSlashParameter: (k, v) => v,
    hideInvocation: true,
    async handler({ ctx, client, bot, msg, error, info, t, author }) {
        const normalizedContent = msg.content.toLowerCase();

        // Catch edit server attempts.
        if (normalizedContent.includes("server") || normalizedContent.includes("guild") || normalizedContent.includes("role")) {
            return info({
                title: t.command_edit_server_title,
                description: t.command_edit_server_description
            });
        }

        const user = await ctx.user();

        const key = await UserAuthKey.query().insertAndFetch({
            user_id: user.id,
            key: randomBytes(16).toString("hex")
        });
        const link = config.web.url + "/login/" + key.key;

        try {
            const channel = await bot.getDMChannel(author.id);
            await client.createResponseContext(t, channel.id, author, msg).info({
                title: t.command_edit_dm_title,
                description: t.command_edit_dm_description({ link })
            });

            if (msg.id) await bot.addMessageReaction(msg.channelID, msg.id, "✅");
        } catch (e) {
            // DMs are probably off.
            error({
                title: t.command_edit_dm_failed_title,
                description: t.command_edit_dm_failed_description,
                image: "https://i.imgur.com/qLgkXiv.png"
            });
        }
    }
};
export default EditCommand;