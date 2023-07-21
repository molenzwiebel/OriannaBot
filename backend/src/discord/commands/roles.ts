import config from "../../config";
import * as shockwave from "../../shockwave";
import { RangeCondition, RankedTierCondition, RoleCombinator, TypedRoleCondition } from "../../types/conditions";
import { SlashCapableCommand } from "../command";
import { emote, expectUser, paginate } from "./util";

const RolesCommand: SlashCapableCommand = {
    name: "Show Server Roles",
    smallDescriptionKey: "command_roles_small_description",
    descriptionKey: "command_roles_description",
    keywords: ["roles", "config", "ranks"],
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
            name: "roles",
            description: "Show all roles configured on the server and whether or not you qualify for them.",
            options: [{
                type: dissonance.ApplicationCommandOptionType.USER,
                name: "user",
                description: "The user whose role eligibility should be checked."
            }]
        };
    },
    convertSlashParameter(k, v) {
        if (k === "user") return `<@!${v}>`;
        throw "Unknown parameter " + k;
    },
    async handler({ guildId, server: loadServer, error, ctx, t }) {
        if (!guildId) return error({
            title: t.command_roles_no_server_title,
            description: t.command_roles_no_server_description
        });

        const server = await loadServer();
        const user = await expectUser(ctx);
        const sign = (x: boolean) => x ? "✅" : "❌";

        // Load data we need for showing eligibility.
        await server.$loadRelated("roles.conditions");
        await user.$loadRelated("[accounts, ranks, stats]");

        if (!server.roles!.length) return error({
            title: t.command_roles_no_roles_title,
            description: t.command_roles_no_roles_description
        });

        const formatRange = (range: RangeCondition<any>) => {
            if (range.compare_type === "at_least") return t.command_roles_at_least({ value: range.value });
            if (range.compare_type === "at_most") return t.command_roles_at_most({ value: range.value });
            if (range.compare_type === "exactly") return t.command_roles_exactly({ value: range.value });
            return t.command_roles_between({ min: range.min, max: range.max });
        };

        const formatChampion = async (id: number) => {
            const champ = await t.staticData.championById(id);
            return emote(champ) + " " + champ.name;
        };

        const formatRanked = (cond: RankedTierCondition) => {
            const tier = (<any>t)["ranked_tier_" + cond.options.tier.toLowerCase()] ?? (cond.options.tier[0] + cond.options.tier.slice(1).toLowerCase());
            const queue = <string>t[config.riot.rankedQueueTranslationKeys[cond.options.queue]] ?? "Unknown Queue";

            if (cond.options.compare_type === "equal") {
                return t.command_roles_ranked_tier_equal({ tier, queue });
            }

            if (cond.options.compare_type === "lower") {
                return t.command_roles_ranked_tier_lower({ tier, queue });
            }

            return t.command_roles_ranked_tier_higher({ tier, queue });
        };

        const formatCondition = async (cond: TypedRoleCondition): Promise<string> => {
            if (cond.type === "mastery_level") return t.command_roles_mastery_level({
                range: formatRange(cond.options),
                champion: await formatChampion(cond.options.champion)
            });
            if (cond.type === "total_mastery_level") return t.command_roles_total_mastery_level({ range: formatRange(cond.options) });
            if (cond.type === "mastery_score") return t.command_roles_mastery_score({
                range: formatRange(cond.options),
                champion: await formatChampion(cond.options.champion)
            });
            if (cond.type === "total_mastery_score") return t.command_roles_total_mastery_score({ range: formatRange(cond.options) });
            if (cond.type === "ranked_tier") return t.command_roles_ranked_tier({ ranked: formatRanked(cond) });
            if (cond.type === "server") return t.command_roles_region({ region: cond.options.region });

            // Error out since we don't have a valid role here. It'll be caught and reported to ELK so we end up seeing it.
            throw new Error("Unknown condition type: " + JSON.stringify(cond));
        };

        const formatCombinator = (comb: RoleCombinator) => {
            if (comb.type === "all") return t.command_roles_all_match;
            if (comb.type === "any") return t.command_roles_any_match;
            if (comb.type === "at_least") return t.command_roles_at_least_n({ amount: comb.amount });

            // Should never happen.
            throw new Error("Unknown combinator type: " + JSON.stringify(comb));
        };

        const userResults = await shockwave.evaluateRolesForUser(user, server);

        const roleFields = [].concat(...<any>await Promise.all([...userResults.entries()].map(async ([role, applicability]) => {
            if (!role.conditions || !role.conditions.length) return {
                name: role.name,
                value: t.command_roles_no_conditions
            };

            const conditions = await Promise.all([...applicability.conditions.entries()].map(async ([condition, applies]) => {
                return sign(applies) + " " + await formatCondition(<TypedRoleCondition> condition);
            }));

            // Group conditions per 5, to prevent exceeding the 1024 character limit
            // for a single embed value. This actually happened in the wild, because someone
            // went _wild_ with their conditions. My fault for giving them so much options,
            // I guess. ;)
            const fields = [];
            for (let i = 0; i < conditions.length; i += 5) {
                const conditionLines = conditions.slice(i, i + 5);

                fields.push({
                    name: role.name + (i > 0 ? " " + t.command_roles_continued : ""),
                    value: i > 0
                        ? conditionLines.join("\n")
                        : (conditionLines.length === 1 ? conditionLines[0] : (formatCombinator(role.combinator) + "\n" + conditionLines.join("\n")))
                });
            }

            return fields;
        })));

        return paginate(ctx, roleFields, {
            title: t.command_roles_message_title,
            description: t.command_roles_message_description
        }, 6);
    }
};
export default RolesCommand;