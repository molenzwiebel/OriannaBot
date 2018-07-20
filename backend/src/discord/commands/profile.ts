import { Command } from "../command";
import { emote, expectUser } from "./util";
import { UserChampionStat, UserRank } from "../../database";
import StaticData from "../../riot/static-data";
import formatName from "../../util/format-name";

const ProfileCommand: Command = {
    name: "Show User Profile",
    smallDescription: "Show the League accounts and general statistics for a Discord user.",
    description: `
This command shows a general overview of your Orianna Bot "profile", computed from data gathered from the accounts you have linked.

To view your own profile, simply use \`@Orianna Bot, show profile\`. If you want to view someone else's profile, you can simply include them in the mention (e.g. \`@Orianna Bot, show @molenzwiebel#2773's profile\`).
`.trim(),
    keywords: ["list", "accounts", "name", "show", "profile", "account", "summoner"],
    async handler({ msg, ctx, error, info }) {
        const target = await expectUser(ctx);
        if (!target) return;
        await target.$loadRelated("accounts");

        const isAuthor = target.snowflake === msg.author.id;
        if (!target.accounts!.length) return error({
            title: "🔎 No Accounts Found",
            description: `${isAuthor ? "You have" : formatName(target) + " has"} no accounts configured with me. ${isAuthor ? "You" : "They"} can add some using \`@Orianna Bot configure\`.`
        });

        // Query some data we need later.
        const top3Mastery = await target.$relatedQuery<UserChampionStat>("stats").orderBy("score", "DESC").limit(3);
        const top3Played = await target.$relatedQuery<UserChampionStat>("stats").orderBy("games_played", "DESC").limit(3);
        const levelCounts: { level: number, count: number }[] = <any>await target.$relatedQuery("stats").groupBy("level", "user_id").count().select("level");
        const totalMastery: string[] = <any>await target.$relatedQuery("stats").sum("score").groupBy("user_id").pluck("sum");
        const avgMastery: string[] = <any>await target.$relatedQuery("stats").avg("score").groupBy("user_id").pluck("avg");
        const rankedData = await target.$relatedQuery<UserRank>("ranks");

        // Formatting helpers.
        const champ = async (entry: UserChampionStat) => emote(ctx, await StaticData.championById(entry.champion_id)) + " " + (await StaticData.championById(entry.champion_id)).name;
        const amount = (entry: UserChampionStat) => entry.score < 10000 ? entry.score.toLocaleString() : `${Math.round(entry.score / 10000) * 10}k`;
        const levelCount = (level: number) => levelCounts.find(x => x.level === level) ? levelCounts.find(x => x.level === level)!.count : 0;
        const formatRank = (rank: string) => (<any>{
            "UNRANKED": "Unranked",
            "BRONZE": `${emote(ctx, "Bronze")} Bronze`,
            "SILVER": `${emote(ctx, "Silver")} Silver`,
            "GOLD": `${emote(ctx, "Gold")} Gold`,
            "PLATINUM": `${emote(ctx, "Platinum")} Platinum`,
            "DIAMOND": `${emote(ctx, "Diamond")} Diamond`,
            "MASTER": `${emote(ctx, "Master")} Master`,
            "CHALLENGER": `${emote(ctx, "Challenger")} Challenger`
        })[rank];
        const queueRank = (queue: string) =>
            target.treat_as_unranked ? formatRank("UNRANKED") :
            rankedData.find(x => x.queue === queue) ? formatRank(rankedData.find(x => x.queue === queue)!.tier) : formatRank("UNRANKED");

        const fields: { name: string, value: string, inline: boolean }[] = [{
            name: "Top Champions",
            value: [
                `${await champ(top3Mastery[0])} - **${amount(top3Mastery[0])}**`,
                `${await champ(top3Mastery[1])} - **${amount(top3Mastery[1])}**`,
                `${await champ(top3Mastery[2])} - **${amount(top3Mastery[2])}**`,
            ].join("\n"),
            inline: true
        }, {
            name: "Mastery Statistics",
            value: [
                `${levelCount(7)}x${emote(ctx, "Level_7")} ${levelCount(6)}x${emote(ctx, "Level_6")} ${levelCount(5)}x${emote(ctx, "Level_5")}${emote(ctx, "__")}`,
                `${(+totalMastery[0]).toLocaleString()} **Total Points**${emote(ctx, "__")}`,
                `${(+avgMastery[0]).toLocaleString("en-GB", { maximumFractionDigits: 2 })} **Average/Champ**${emote(ctx, "__")}`,
                `${emote(ctx, "__")}`
            ].join("\n"),
            inline: true
        }, {
            name: "Most Played Ranked",
            value: ((await Promise.all(top3Played.map(async x =>
                `${await champ(x)} - **${x.games_played.toLocaleString()} Games**`
            ))).join("\n") || "_No Ranked Games_") + "\n" + emote(ctx, "__"),
            inline: true
        }, {
            name: "Ranked Tiers",
            value: [
                `Ranked Solo/Duo: **${queueRank("RANKED_SOLO_5x5")}**${emote(ctx, "__")}`,
                `Ranked Flex: **${queueRank("RANKED_FLEX_SR")}**${emote(ctx, "__")}`,
                `3v3 Flex: **${queueRank("RANKED_FLEX_TT")}**${emote(ctx, "__")}`
            ].join("\n"),
            inline: true
        }];

        // Only add accounts if the user has not toggled them off.
        if (!target.hide_accounts) {
            fields.push({
                name: "Account",
                value: target.accounts!.map(x => x.username).join("\n"),
                inline: true
            }, {
                name: "Region",
                value: target.accounts!.map(x => x.region).join("\n"),
                inline: true
            });
        }

        return info({
            title: "📖 " + formatName(target) + "'s Profile",
            fields,
            thumbnail: target.avatarURL
        });
    }
};
export default ProfileCommand;