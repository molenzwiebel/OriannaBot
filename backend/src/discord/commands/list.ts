
import { Command } from "../command";
import { expectUser } from "./util";
import StaticData from "../../riot/static-data";
import LeagueAccount from "../../database/league_account";

const ListCommand: Command = {
    name: "List Accounts",
    smallDescription: "Show which accounts someone has configured.",
    description: `
This account shows which account you or someone else has configured with Orianna Bot. To view your own accounts, simply use \`@Orianna Bot, list accounts\`.

If you want to view someone else's accounts, you can simply include them in the mention (e.g. \`@Orianna Bot, list @molenzwiebel#2773's accounts\`).
`.trim(),
    keywords: ["list", "accounts", "name", "show"],
    async handler({ msg, ctx, error, info }) {
        const target = await expectUser(ctx);
        if (!target) return;
        await target.$loadRelated("accounts");

        const isAuthor = target.snowflake === msg.author.id;

        if (!target.accounts!.length) return error({
            title: "🔎 No Accounts Found",
            description: (isAuthor ? "You have" : target.username + " has") + " no accounts configured with me. " + (isAuthor ? "you" : "they") + " can add some using `@Orianna Bot configure`."
        });

        if (target.accounts!.length === 1) {
            const account = target.accounts![0];
            return info({
                title: "🔎 " + target.username + "'s Account",
                thumbnail: await StaticData.getUserIcon(account),
                fields: [{ name: account.region, value: "- " + account.username }]
            });
        }

        const perRegion = target.accounts!.reduce((p, c) => {
            p.set(c.region, ["- " + c.username, ...(p.get(c.region) || [])]);
            return p;
        }, new Map<string, string[]>());

        return info({
            title: "🔎 " + target.username + "'s Accounts",
            fields: [...perRegion.entries()].map(x => ({ name: x[0], value: x[1].join("\n") }))
        });
    }
};
export default ListCommand;