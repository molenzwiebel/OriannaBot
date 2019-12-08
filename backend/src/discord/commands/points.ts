import { Command } from "../command";
import { emote, expectChampion, expectUserWithAccounts } from "./util";
import { badge } from "../../util/format-name";

const PointsCommand: Command = {
    name: "Show Mastery Points",
    smallDescriptionKey: "command_points_small_description",
    descriptionKey: "command_points_description",
    keywords: ["points", "mastery", "score"],
    async handler({ ctx, ok, t }) {
        // Remove the keywords since they can combine with champion names (e.g. **mastery i**relia).
        ctx.content = ctx.content.replace(/\b(points|mastery|score)\b/g, "");

        const user = await expectUserWithAccounts(ctx);
        if (!user) return;
        await user.$loadRelated("[stats]");

        const champ = await expectChampion(ctx);
        if (!champ) return;

        const points = user.stats!.find(x => x.champion_id === +champ.key);
        const text = points && points.score ? emote(ctx, "Level_" + points.level) + " " + points.score.toLocaleString() : "0";

        return ok({
            title: t.command_points_message_title,
            description: t.command_points_message_description({
                user: `<@!${user.snowflake}>${badge(user)}`,
                points: text,
                champion: `${emote(ctx, champ)} ${champ.name}`
            })
        });
    }
};
export default PointsCommand;