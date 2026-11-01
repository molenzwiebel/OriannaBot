import { ApplicationCommandOptionType } from "discord-api-types/v10";
import * as shockwave from "../../shockwave";
import { SlashCapableCommand } from "../command";
import { emote } from "../emotes";
import { expectUser } from "./util";

const RefreshCommand: SlashCapableCommand = {
    name: "Refresh",
    smallDescriptionKey: "command_refresh_small_description",
    descriptionKey: "command_refresh_description",
    noTyping: true,
    keywords: ["refresh", "reload", "update", "recalculate"],
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.Subcommand,
            name: "refresh",
            description: "Fetch the latest statistics and update all roles for a user.",
            options: [{
                type: ApplicationCommandOptionType.User,
                name: "user",
                description: "The user who you'd like to refresh. Defaults to yourself."
            }]
        };
    },
    convertSlashParameter(k, v) {
        if (k === "user") return `<@!${v}>`;
        throw "Unknown parameter " + k;
    },
    async handler({ ctx, content, author, info, responseContext }) {
        const user = await expectUser(ctx);
        if (!user) return;

        const msg = await info({
            title: `${emote("Refreshing")} Refreshing${user.snowflake === author.id ? " your" : ""} data...`
        });

        // Debug (hidden) option: nuke all the stats before performing the refresh.
        if (content.includes("nukestatsfirst")) {
            await user.$relatedQuery("stats").delete();
        }

        // Attempt to update user or time out after 20 seconds.
        await Promise.race([
            shockwave.fetchAndUpdateUser(user).then(x => { if (!x) throw new Error("Refreshing failed."); }),
            new Promise((_, reject) => setTimeout(reject, 20000))
        ]);

        // Update timestamps.
        user.$query().patch({
            last_account_update_timestamp: '' + Date.now(),
            last_rank_update_timestamp: '' + Date.now(),
            last_score_update_timestamp: '' + Date.now()
        });

        await Promise.all([
            msg.remove(),
            responseContext.acknowledgeProcessed("✅ Statistics Refreshed!")
        ]);
    }
};
export default RefreshCommand;