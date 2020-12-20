import { SlashCapableCommand } from "../command";
import { ApplicationCommandOptionType } from "../slash-commands";
import { expectUser, rawEmote } from "./util";
import * as eris from "eris";
import * as ipc from "../../cluster/master-ipc";

const RefreshCommand: SlashCapableCommand = {
    name: "Refresh",
    smallDescriptionKey: "command_refresh_small_description",
    descriptionKey: "command_refresh_description",
    noTyping: true,
    keywords: ["refresh", "reload", "update", "recalculate"],
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "refresh",
            description: "Fetch the latest statistics and update all roles for a user.",
            options: [{
                type: ApplicationCommandOptionType.USER,
                name: "user",
                description: "The user who you'd like to refresh. Defaults to yourself."
            }]
        };
    },
    convertSlashParameter(k, v) {
        if (k === "user") return `<@!${v}>`;
        throw "Unknown parameter " + k;
    },
    async handler({ ctx, bot, msg }) {
        const user = await expectUser(ctx);
        if (!user) return;

        // TODO: hack, but maybe no better way to do this?
        let slashMessage: eris.Message | null = null;
        if (!msg.id) {
            const msgs = await bot.getMessages(msg.channelID, 5);
            slashMessage = msgs.find(x => x.content.endsWith(" refresh")) || null;
        }

        const loadingEmoji = rawEmote(ctx, "Refreshing")!;

        if (msg.id || slashMessage) bot.addMessageReaction(msg.channelID, msg.id || slashMessage!.id, loadingEmoji);

        // Attempt to update user or time out after 20 seconds.
        await Promise.race([
            ipc.fetchAndUpdateUser(user),
            new Promise((_, reject) => setTimeout(reject, 20000))
        ]);

        // Update timestamps.
        user.$query().patch({
            last_account_update_timestamp: '' + Date.now(),
            last_rank_update_timestamp: '' + Date.now(),
            last_score_update_timestamp: '' + Date.now()
        });

        if (msg.id || slashMessage) {
            bot.removeMessageReaction(msg.channelID, msg.id || slashMessage!.id, loadingEmoji);
            bot.addMessageReaction(msg.channelID, msg.id || slashMessage!.id, "✅");
        }
    }
};
export default RefreshCommand;