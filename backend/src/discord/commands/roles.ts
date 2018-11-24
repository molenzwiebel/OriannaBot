import { Command } from "../command";
import { RangeCondition, RankedTierCondition, RoleCombinator, TypedRoleCondition } from "../../types/conditions";
import StaticData from "../../riot/static-data";
import { emote, paginate } from "./util";
import config from "../../config";

const RolesCommand: Command = {
    name: "Show Server Roles",
    smallDescription: "Shows all roles configured on the current server.",
    description: `
Shows all the roles and their requirements as configured on the current Discord server. This will list all roles, along with an indication of whether or not you are currently eligible for them.

Note that the same role might appear twice in the list with different requirements. If this is the case, you will receive the role if you are eligible for at least one of the "sets" of conditions.

For more information on role conditions and how they work, check out the [documentation](https://orianna.molenzwiebel.xyz/docs/conditions).
`.trim(),
    keywords: ["roles", "config", "ranks"],
    async handler({ guild, user: loadUser, server: loadServer, error, ctx }) {
        if (!guild) return error({
            title: "🛑 Server Missing",
            description: "This command explicitly says that it shows _server_ information, yet you try to use it in DMs? Madman."
        });

        const server = await loadServer();
        const user = await loadUser();
        const sign = (x: boolean) => x ? "✅" : "❌";
        const capitalize = (x: string) => x[0].toUpperCase() + x.slice(1);

        // Load data we need for showing eligibility.
        await server.$loadRelated("roles.conditions");
        await user.$loadRelated("[accounts, ranks, stats]");

        if (!server.roles!.length) return error({
            title: "🔍 There Seems To Be Nothing Here...",
            description: "The current server does not seem to have any roles configured."
        });

        const formatRange = (range: RangeCondition<any>) => {
            if (range.compare_type === "at_least") return "of at least " + range.value.toLocaleString();
            if (range.compare_type === "at_most") return "of at most " + range.value.toLocaleString();
            if (range.compare_type === "exactly") return "of exactly " + range.value.toLocaleString();
            return "between " + range.min.toLocaleString() + " and " + range.max.toLocaleString()
        };

        const formatChampion = async (id: number) => {
            const champ = await StaticData.championById(id);
            return emote(ctx, champ) + " " + champ.name;
        };

        const formatRanked = (cond: RankedTierCondition) => {
            const tier = cond.options.tier === 0 ? "Unranked" : capitalize(config.riot.tiers[cond.options.tier - 1].toLowerCase());
            const queue = config.riot.rankedQueues[cond.options.queue];
            return (cond.options.compare_type === "equal" ? "of " + tier : cond.options.compare_type + " than " + tier) + " in " + queue;
        };

        const formatCondition = async (cond: TypedRoleCondition): Promise<string> => {
            if (cond.type === "mastery_level") return "Have a mastery level " + formatRange(cond.options) + " on " + await formatChampion(cond.options.champion);
            if (cond.type === "mastery_score") return "Have a mastery score " + formatRange(cond.options) + " on " + await formatChampion(cond.options.champion);
            if (cond.type === "total_mastery_score") return "Have a total mastery score " + formatRange(cond.options);
            if (cond.type === "ranked_tier") return "Have a ranked tier " + formatRanked(cond);
            if (cond.type === "champion_play_count") return "Have played at least " + cond.options.count.toLocaleString() + " games on " + await formatChampion(cond.options.champion);
            if (cond.type === "server") return "Have an active account on " + cond.options.region;

            // Error out since we don't have a valid role here. It'll be caught and reported to ELK so we end up seeing it.
            throw new Error("Unknown condition type: " + JSON.stringify(cond));
        };

        const formatCombinator = (comb: RoleCombinator) => {
            if (comb.type === "all") return "**All must match:**";
            if (comb.type === "any") return "**Any must match:**";
            if (comb.type === "at_least") return "**At least " + comb.amount.toLocaleString() + " must match:**";

            // Should never happen.
            throw new Error("Unknown combinator type: " + JSON.stringify(comb));
        };

        const roleFields = [].concat(...<any>await Promise.all(server.roles!.map(async x => {
            if (!x.conditions || !x.conditions.length) return {
                name: x.name,
                value: "_No Conditions_"
            };

            const conditions = await Promise.all(x.conditions.map(async x => {
                return sign(x.test(user)) + " "+ await formatCondition(<TypedRoleCondition>x);
            }));

            // Group conditions per 5, to prevent exceeding the 1024 character limit
            // for a single embed value. This actually happened in the wild, because someone
            // went _wild_ with their conditions. My fault for giving them so much options,
            // I guess. ;)
            const fields = [];
            for (let i = 0; i < conditions.length; i += 5) {
                const conditionLines = conditions.slice(i, i + 5);

                fields.push({
                    name: x.name + (i > 0 ? " (Continued)" : ""),
                    value: i > 0
                        ? conditionLines.join("\n")
                        : (conditionLines.length === 1 ? conditionLines[0] : (formatCombinator(x.combinator) + "\n" + conditionLines.join("\n")))
                });
            }

            return fields;
        })));
        
        return paginate(ctx, roleFields, {
            title: "📖 Server Roles",
            description: "The following roles are configured on this server:"
        }, 6);
    }
};
export default RolesCommand;