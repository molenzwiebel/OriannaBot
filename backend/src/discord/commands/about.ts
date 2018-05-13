import { Command } from "../command";
import { getLastCommit, Commit } from "git-last-commit";

const AboutCommand: Command = {
    name: "About",
    keywords: ["about", "info", "author", "creator", "source", "github", "code"],
    smallDescription: "",
    description: "",
    hideFromHelp: true,
    async handler({ info, bot }) {
        const commit = await new Promise<Commit>((res, rej) => getLastCommit((e, r) => e ? rej(e) : res(r), { splitChar: '|' }));

        info({
            title: "🤖 About",
            fields: [{
                name: "Author",
                value: "molenzwiebel#2773 (EUW - Yahoo Answers)"
            }, {
                name: "Version",
                value: `[${commit.shortHash} - ${commit.subject}](https://github.com/molenzwiebel/OriannaBot/commit/${commit.hash})`
            }, {
                name: "Source Code",
                value: "[Orianna Bot on Github](https://github.com/molenzwiebel/oriannabot)"
            }, {
                name: "Servers",
                value: bot.guilds.size.toLocaleString(),
                inline: true
            }, {
                name: "Channels",
                value: Object.keys(bot.channelGuildMap).length.toLocaleString(),
                inline: true
            }, {
                name: "Users",
                value: bot.users.size.toLocaleString(),
                inline: true
            }, {
                name: "Memory Usage",
                value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
                inline: true
            }, {
                name: "Node Version",
                value: process.version,
                inline: true
            }, {
                name: "Best Waifu",
                value: "Orianna",
                inline: true
            }]
        });
    }
};
export default AboutCommand;