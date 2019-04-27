import { Command } from "../command";
import { emote, expectUser } from "./util";

const RefreshCommand: Command = {
    name: "Refresh",
    smallDescription: "Update your data and recalculate your roles.",
    description: `
This command will manually trigger a full refresh of your mastery and ranked statistics across all of your linked accounts. In particular, the following things will be updated:
- All your linked accounts will be checked for name changes or region transfers.
- All your ranked tiers will be refreshed.
- All your champion mastery values and levels will be refreshed.

After updating all values, Orianna will recompute your roles in every server you share with her, potentially adding or removing roles based on the new values.

Note that you do not need to manually refresh. Orianna will periodically update your statistics automatically, so this command should only be used if you have any changes that you want to see immediately.

If you want to refresh someone else's scores, simply mention them when invoking the command (e.g. \`@Orianna Bot refresh @b1nzy#0001\`).
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