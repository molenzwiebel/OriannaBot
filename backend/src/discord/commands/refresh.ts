import { Command } from "../command";
import { expectUser, rawEmote } from "./util";
import * as ipc from "../../cluster/master-ipc";

const RefreshCommand: Command = {
    name: "Refresh",
    smallDescriptionKey: "command_refresh_small_description",
    descriptionKey: "command_refresh_description",
    noTyping: true,
    keywords: ["refresh", "reload", "update", "recalculate"],
    async handler({ ctx, msg }) {
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