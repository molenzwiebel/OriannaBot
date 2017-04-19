import { Command } from "../message-handler";
import * as DB from "../../database";
import util = require("util");
import { Database as BasieDatabase } from "basie";

export default (<Command>{
    name: "Evaluate Expression",
    keywords: ["eval"],
    description: "Evaluates the specified expression as Javascript",
    examples: ["<@me> eval 1 + 1", "<@me> eval (await UserModel.first()).name", "<@me> ```const foo = await DiscordServerModel.first();\nfoo.name```"],
    hideFromHelp: true,
    async handler(msg: eris.Message) {
        if (msg.author.id !== this.client.config.ownerSnowflake) return this.error(msg, { title: "Only the bot owner can use this command." });

        {
            // Expose useful variables to the eval() call.
            const { User, UserModel, LeagueAccount, LeagueAccountModel, Role, RoleModel, DiscordServer, DiscordServerModel } = DB;
            const Database = BasieDatabase;
            const bot = this.client.bot;
            const message = msg;

            try {
                const rawContent = msg.content.replace("<@" + bot.user.id + ">", "").replace("<@!" + bot.user.id + ">", "").replace(/eval/gi, "").trim();

                let exprBody;
                if (rawContent.startsWith("```")) {
                    const lines = rawContent.replace(/```/g, "").split("\n");
                    exprBody = lines.map((x, i) => i === lines.length - 1 ? "return " + x : x).join("\n");
                } else {
                    exprBody = "return (" + rawContent + ");";
                }

                const res = await eval(`(async () => { ${exprBody} })()`);
                let inspectedBody = util.inspect(res, false, 2);
                if (inspectedBody.length > 2000) inspectedBody = inspectedBody.slice(0, 1900) + "...";
                if (typeof res !== "undefined") this.ok(msg, { title: "Result", description: "```javascript\n" + inspectedBody + "```" });
            } catch (e) {
                return this.error(msg, { title: "Error evaluating", description: e.message });
            }
        }
    }
});