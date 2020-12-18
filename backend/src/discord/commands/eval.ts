import { Command } from "../command";
import config from "../../config";
import * as db from "../../database";
import * as util from "util";
import StaticData from "../../riot/static-data";

const EvalCommand: Command = {
    name: "Evaluate Expression",
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    keywords: ["eval"],
    async handler({ msg, bot, error, ok, ctx, author }) {
        if (author.id !== config.discord.owner) return error({
            title: "Only the bot owner may use this command."
        });

        // Start a new scope for the eval command.
        try {
            const rawContent = msg.content.replace(new RegExp("<@!?" + bot.user.id + ">", "g"), "").replace(/eval/g, "").trim();

            let exprBody;
            if (rawContent.startsWith("```")) {
                const lines = rawContent.replace(/```/g, "").split("\n");
                exprBody = lines.map((x, i) => i === lines.length - 1 ? "return " + x : x).join("\n");
            } else {
                exprBody = "return (" + rawContent + ");";
            }

            // Helper function for easier database querying.
            const buildDBAccess = (clazz: any, eager: string, defaultArgs: object = {}) => (args: object = defaultArgs) => {
                const chain = clazz.query().eager(eager);
                for (const [k, v] of Object.entries(args)) chain.where(k, "=", v);
                return chain.limit(1).first();
            };

            // This is a bit of a hack, but we want to inject some scope.
            // We do this by constructing a new function that takes our scope as arguments.
            // We have to use a bit of a hack to get an async function though.
            const evalContext = {
                ...ctx,
                ...db,
                user: buildDBAccess(db.User, "[accounts]", { snowflake: author.id }),
                role: buildDBAccess(db.Role, "[conditions]"),
                account: buildDBAccess(db.LeagueAccount, "[]"),
                server: buildDBAccess(db.Server, "[roles, roles.conditions]", { snowflake: ctx.guild && ctx.guild.id }),
                StaticData
            };

            const fun = new Function(...Object.keys(evalContext), "return (async() => {" + exprBody + "})()");
            let res = fun(...Object.values(evalContext));
            while (res && res.then) res = await res;

            let inspectedBody = util.inspect(res, false, 2);
            if (inspectedBody.length > 2000) inspectedBody = inspectedBody.slice(0, 1900) + "...";
            return ok({
                title: "Result",
                description: "```js\n" + inspectedBody + "```"
            });
        } catch (e) {
            error({
                title: "Error evaluating",
                description: e.message
            });
        }
    }
};
export default EvalCommand;