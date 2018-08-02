import { Command } from "../command";
import { UserAuthKey } from "../../database";
import { randomBytes } from "crypto";
import config from "../../config";

const EditCommand: Command = {
    name: "Edit Profile",
    smallDescription: "Sends you a link to your personal profile settings page.",
    description: `
This command will send you a single-use link to effortlessly log in and access [your personal settings page](https://orianna.molenzwiebel.xyz/me). These links are single-use and will expire after 24 hours.
`.trim(),
    keywords: ["edit", "config", "configure", "add", "remove"],
    noTyping: true,
    async handler({ ctx, client, bot, msg, error, info }) {
        const normalizedContent = msg.content.toLowerCase();

        // Catch edit server attempts.
        if (normalizedContent.includes("server") || normalizedContent.includes("guild")) {
            return info({
                title: "ℹ Server Editing Works Differently",
                description: "With Orianna v2, there is no longer a separate configuration URL for editing server settings. Instead, you can simply login with your own link or Discord account, then select your server from the sidebar. Note that you must have `Manage Server` permissions to edit server settings."
            });
        }

        const user = await ctx.user();

        const key = await UserAuthKey.query().insertAndFetch({
            user_id: user.id,
            key: randomBytes(21).toString("base64").replace(/\//g, "-")
        });
        const link = config.web.url + "/login/" + key.key;

        try {
            const channel = await bot.getDMChannel(msg.author.id);
            await client.createResponseContext(channel, msg.author, msg).info({
                title: "🔗 Authentication Link",
                description: `To edit accounts, configure your personal servers and more, you can access your profile page on the [Orianna Web Panel](${link}). Clicking the link below will automatically log you in. You can only use this link _once_ before it expires. It will also expire if you do not use it within 24 hours.\n\n${link}\n\n**:warning: Do not share this link unless you're absolutely sure what you're doing!** Anyone with this link will have access to your profile.`
            });

            await msg.addReaction("✅");
        } catch (e) {
            // DMs are probably off.
            error({
                title: "📪 Your mailbox is private!",
                description: "You seem to have configured your account to only allow direct messages from friends. This unfortunately means that I can't send you DMs. To enable direct messages from server members, right click on this server's icon, choose `Privacy Settings` and turn `Allow direct messages from server members` on.",
                image: "https://i.imgur.com/qLgkXiv.png"
            });
        }
    }
};
export default EditCommand;