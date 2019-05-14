import { Command } from "../command";
import { emote, expectChampion, expectUserWithAccounts } from "./util";
import { badge } from "../../util/format-name";

const PointsCommand: Command = {
    name: "Show Mastery Points",
    smallDescription: "Show how many mastery points you have on a champion.",
    description: `
This command shows a user's mastery score on the specified champion.

To choose a champion, simply include a champion name or [alias](https://github.com/molenzwiebel/OriannaBot/blob/1064ed15b326b0b918b3b3307e546977e03caf52/backend/src/riot/static-data.ts#L4-L92) in your message. If no champion name is included, Orianna will fall back to the default champion of the current Discord server, or show an error message if there is no default champion configured.

To see someone else's mastery, simply mention their name in the command.

Examples:
- \`@Orianna Bot points mf\` - shows your mastery on Miss Fortune
- \`@Orianna Bot score lee @molenzwiebel\` - shows molenzwiebel's mastery on Lee Sin
- \`@Orianna Bot mastery\` - shows your mastery on the default champion
`.trim(),
    keywords: ["points", "mastery", "score"],
    async handler({ ctx, ok }) {
        // Remove the keywords since they can combine with champion names (e.g. **mastery i**relia).
        ctx.content = ctx.content.replace(/\b(points|mastery|score)\b/g, "");

        const user = await expectUserWithAccounts(ctx);
        if (!user) return;
        await user.$loadRelated("[stats]");

        const champ = await expectChampion(ctx);
        if (!champ) return;

        const points = user.stats!.find(x => x.champion_id === +champ.key);
        const text = points && points.score ? emote(ctx, "Level_" + points.level) + " **" + points.score.toLocaleString() : "**0";

        return ok({
            title: "📖 Mastery Points",
            description: `<@!${user.snowflake}>${badge(user)} has ${text} points** on ${emote(ctx, champ)} ${champ.name}.`
        });
    }
};
export default PointsCommand;