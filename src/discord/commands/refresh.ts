import { Command } from "../message-handler";
import sample = require("lodash.sample");
import { UserModel } from "../../database";

// Some simple, fun messages to entertain the user while we refresh.
const LOADING_BLURBS = [
    "Contacting Rito HQ",
    "Bribing Riot employees",
    "Doing some fairly hard math",
    "Figuring out where I left my ball",
    "Searching where exactly I left the data",
    "Seeing if I can still count",
    "<beep> <boop> *<beep*>",
    "Unleashing Dissonance",
    "Missing my shockwave",
    "Finishing my League game",
    ":robot:",
    "QWRkIG1lIG9uIEVVVyAtIFlhaG9vIEFuc3dlcnMgOyk="
];

const command: Command = {
    name: "Refresh",
    description: "Manually refreshes your mastery score on all servers. Admins can add `everyone` to refresh the entire server.",
    keywords: ["refresh", "reload"],
    examples: [
        "<@me>, refresh me.",
        "<@me>, refresh my roles.",
        "Can <@me> please update me."
    ],
    async handler(message) {
        const normalizedContent = message.cleanContent.toLowerCase();

        // Is this a server refresh?
        if (normalizedContent.indexOf("everyone") !== -1 || normalizedContent.indexOf("server") !== -1) {
            if (!await this.expectServer(message)) return;
            if (!await this.expectManagePermission(message)) return;

            const count = message.channel.guild.members.map(x => x).length;
            let current = 0;

            const reply = await this.info(message, { title: `:hourglass_flowing_sand: ${sample(LOADING_BLURBS)}... (0/${count})` });
            for (const member of message.channel.guild.members.map(x => x)) {
                // Update progress every 10 users (since discord has rate limits)
                if ((++current % 10) === 0) await reply.info({ title: `:hourglass_flowing_sand: ${sample(LOADING_BLURBS)}... (${current}/${count})` });

                const user = await UserModel.findBy({ snowflake: member.id });
                if (!user) continue;

                await this.client.updater.updateUser(user);
            }

            await reply.ok({
                title: ":heavy_check_mark: All done!",
                description: "Everyone in " + message.channel.guild.name + " has been thoroughly refreshed."
            });

            return;
        }

        const user = await this.expectUser(message);
        if (!user) return;

        const reply = await this.info(message, { title: `:hourglass_flowing_sand: ${sample(LOADING_BLURBS)}...` });
        await this.client.updater.updateUser(user, true);

        await reply.ok({
            title: ":heavy_check_mark: All done!",
            description: "My knowledge on " + user.username + " has been thoroughly refreshed!"
        });
    }
};
export default command;