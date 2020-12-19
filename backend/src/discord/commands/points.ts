import { badge } from "../../util/format-name";
import { SlashCapableCommand } from "../command";
import { ApplicationCommandOptionType } from "../slash-commands";
import { emote, expectChampion, expectUserWithAccounts } from "./util";

const PointsCommand: SlashCapableCommand = {
    name: "Show Mastery Points",
    smallDescriptionKey: "command_points_small_description",
    descriptionKey: "command_points_description",
    keywords: ["points", "mastery", "score"],
    asSlashCommand(t) {
        return {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "points",
            description: "Check how many mastery points someone has on a champion.",
            options: [{
                type: ApplicationCommandOptionType.STRING,
                name: "champion",
                description: "The champion whose mastery points you'd like to look up.",
                // default: true,
                required: true
            }, {
                type: ApplicationCommandOptionType.USER,
                name: "user",
                description: "The Discord user whose mastery you'd like to look up.",
            }]
        };
    },
    convertSlashParameter(k, v) {
        if (k === "champion") return v;
        if (k === "user") return `<@!${v}>`;
        throw "Unknown parameter: " + k;
    },
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