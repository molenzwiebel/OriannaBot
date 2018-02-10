import { Command } from "../command";
import { expectUser } from "./util";

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
    keywords: ["refresh", "reload", "update", "recalculate"],
    async handler({ client, info, ctx }) {
        // TODO(molenzwiebel): refresh everyone?
        const user = await expectUser(ctx);
        if (!user) return;

        // TODO(molenzwiebel): neat loading blurbs
        const reply = await info({
            title: `⏳ Refreshing...`
        });
        await client.updater.fetchAndUpdateAll(user);

        await reply.ok({
            title: "✅ All done!",
            description: "My knowledge on " + user.username + " has been thoroughly refreshed!"
        });
    }
};
export default RefreshCommand;

/*const LOADING_BLURBS = [
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
];*/