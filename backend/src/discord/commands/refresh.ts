import { Command } from "../command";
import { expectUser, rawEmote } from "./util";
import * as ipc from "../../cluster/master-ipc";

const RefreshCommand: Command = {
    name: "Refresh",
    smallDescriptionKey: "command_refresh_small_description",
    descriptionKey: "command_refresh_description",
    noTyping: true,
    keywords: ["refresh", "reload", "update", "recalculate"],
    async handler({ client, ctx, msg, content, info, t }) {
        if (content.toLowerCase().includes("everyone")) {
            return info({
                title: t.command_refresh_everyone_title,
                description: t.command_refresh_everyone_description
            });
        }

        const user = await expectUser(ctx);
        if (!user) return;

        const loadingEmoji = rawEmote(ctx, "Refreshing")!;

        msg.addReaction(loadingEmoji);

        await ipc.fetchAndUpdateUser(user);

        // Update timestamps.
        user.$query().patch({
            last_account_update_timestamp: '' + Date.now(),
            last_rank_update_timestamp: '' + Date.now(),
            last_score_update_timestamp: '' + Date.now()
        });

        msg.removeReaction(loadingEmoji);
        msg.addReaction("✅");
    }
};
export default RefreshCommand;