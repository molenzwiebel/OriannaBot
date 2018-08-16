import { Command } from "../command";
import { emote, expectUser } from "./util";

const RefreshCommand: Command = {
    name: "Refresh",
    smallDescription: "Update your data and recalculate your roles.",
    description: `
Contacts the Riot API to refresh all of your data. This command will:
- Check if all of your accounts still exist.
- Update your ranked tiers and amount of games played.
- Update your champion mastery scores and levels.

After refreshing all of your data, Orianna will recalculate all of your roles across any server you share with her.

You are also periodically refreshed automatically by Orianna (usually once every 30-45 minutes). Use this command if you want to see new changes immediately.
`.trim(),
    noTyping: true,
    keywords: ["refresh", "reload", "update", "recalculate"],
    async handler({ client, ctx, msg, content, info }) {
        if (content.toLowerCase().includes("everyone")) {
            return info({
                title: "ℹ Refresh Everyone Was Removed",
                description: "With the introduction of Orianna Bot v2, the refresh everyone command was removed. I refresh every user approximately once an hour automatically, so the command did fairly little while at the same time causing a large amount of work in a short timespan. If you've recently made changes and want to see them in action, simply wait until I've refreshed everyone.\n\nIf your roles are misbehaving and you figured that a refresh everyone would work, consider contacting my creator for help. See `@Orianna Bot about` for more info."
            });
        }

        const user = await expectUser(ctx);
        if (!user) return;

        const loadingEmoji = emote(ctx, "Refreshing").replace("<:", "").replace(">", "");

        msg.addReaction(loadingEmoji);
        await client.updater.fetchAndUpdateAll(user);

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