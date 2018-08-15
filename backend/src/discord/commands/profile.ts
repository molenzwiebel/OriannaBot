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
    async handler({ msg, ctx, error, info, client }) {
        const target = await expectUser(ctx);
        if (!target) return;
        await target.$loadRelated("accounts");

        const isAuthor = target.snowflake === msg.author.id;
        if (!target.accounts!.length) return error({
            title: "🔎 No Accounts Found",
            description: `${isAuthor ? "You have" : formatName(target) + " has"} no accounts configured with me. ${isAuthor ? "You" : "They"} can add some using \`@Orianna Bot configure\`.`
        });

        // Query some data we need later.
        const topMastery = await target.$relatedQuery<UserChampionStat>("stats").orderBy("score", "DESC").where("score", ">", 0).limit(8);
        const top3Played = await target.$relatedQuery<UserChampionStat>("stats").orderBy("games_played", "DESC").where("games_played", ">", 0).limit(3);
        const levelCounts: { level: number, count: number }[] = <any>await target.$relatedQuery("stats").groupBy("level", "user_id").count().select("level");
        const totalMastery: string[] = <any>await target.$relatedQuery("stats").sum("score").groupBy("user_id").pluck("sum");
        const avgMastery: string[] = <any>await target.$relatedQuery("stats").avg("score").groupBy("user_id").pluck("avg");
        const rankedData = await target.$relatedQuery<UserRank>("ranks");

        // Formatting helpers.
        const champ = async (entry: UserChampionStat) => emote(ctx, await StaticData.championById(entry.champion_id)) + " " + (await StaticData.championById(entry.champion_id)).name;
        const amount = (entry: UserChampionStat) =>
            entry.score < 10000 ? entry.score.toLocaleString() :
            entry.score >= 1000000 ? `${(entry.score / 1000000).toFixed(2).replace(/[.,]00$/, "")}m`
            : `${Math.round(entry.score / 10000) * 10}k`;
        const levelCount = (level: number) => levelCounts.find(x => x.level === level) ? levelCounts.find(x => x.level === level)!.count : 0;
        const formatRank = (rank: string) => (<any>{
            "UNRANKED": "Unranked" + emote(ctx, "__"),
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
                `${await champ(topMastery[0])} - **${amount(topMastery[0])}**`,
                `${await champ(topMastery[1])} - **${amount(topMastery[1])}**`,
                `${await champ(topMastery[2])} - **${amount(topMastery[2])}**`,
                `${emote(ctx, "__")}`
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
                `Ranked Solo/Duo: **${queueRank("RANKED_SOLO_5x5")}**`,
                `Ranked Flex: **${queueRank("RANKED_FLEX_SR")}**`,
                `3v3 Flex: **${queueRank("RANKED_FLEX_TT")}**`
            ].join("\n") + "\n" + emote(ctx, "__"),
            inline: true
        }];

        // Only add accounts if the user has not toggled them off.
        if (!target.hide_accounts) {
            // Sort user's accounts based on region. Slice to sort a copy, since sort also modifies the source.
            const sorted = target.accounts!.slice(0).sort((a, b) => a.region.localeCompare(b.region));

            // Split up in columns if more than two, single field else.
            if (sorted.length > 1) {
                const left = sorted.slice(0, Math.ceil(sorted.length / 2));
                const right = sorted.slice(left.length);

                fields.push({
                    name: "Accounts",
                    value: left.map(x => x.region + " - " + x.username).join("\n") + "\n" + emote(ctx, "__"),
                    inline: true
                }, {
                    name: "\u200b", // renders as an empty title in discord
                    value: right.map(x => x.region + " - " + x.username).join("\n") + "\n" + emote(ctx, "__"),
                    inline: true
                })
            } else {
                fields.push({
                    name: "Account",
                    value: sorted[0].region + " - " + sorted[0].username + "\n" + emote(ctx, "__"),
                    inline: true
                });
            }
        }

        // Render a neat bar chart with the top 8 champions.
        const colors: { [key: string]: string } = {
            Mage: "#6cace2",
            Marksman: "#cc708d",
            Support: "#1eb59b",
            Fighter: "#916063",
            Tank: "#888690",
            Assassin: "#c0964c"
        };
        const values = await Promise.all(topMastery.map(async x => ({
            champion: (await StaticData.championById(x.champion_id)).name,
            color: colors[(await StaticData.championById(x.champion_id)).tags[0]],
            score: x.score
        })));

        const image = await client.puppeteer.render("./graphics/profile-chart.html", {
            screenshot: {
                width: 399,
                height: 240
            },
            args: { values, width: 399, height: 240 }
        });

        return info({
            title: "📖 " + formatName(target) + "'s Profile",
            fields,
            thumbnail: target.avatarURL,
            file: {
                name: "chart.png",
                file: image
            }
        });
    }
};
export default ProfileCommand;