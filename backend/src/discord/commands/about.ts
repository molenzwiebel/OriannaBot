import { Commit, getLastCommit } from "git-last-commit";
import { Member } from "../../database";
import { dissonanceRedis } from "../../redis";
import { SlashCapableCommand } from "../command";

const AboutCommand: SlashCapableCommand = {
    name: "About",
    keywords: ["about", "info", "author", "creator", "source", "github", "code"],
    smallDescriptionKey: "empty",
    descriptionKey: "empty",
    hideFromHelp: true,
    asSlashCommand(t) {
        return {
            type: dissonance.ApplicationCommandOptionType.SUB_COMMAND,
            name: "about",
            description: "Need help? Want to see who made Orianna Bot? This is the command for you.",
        };
    },
    convertSlashParameter: (k, v) => v,
    async handler({ info, t }) {
        const commit = await new Promise<Commit>((res, rej) => getLastCommit((e, r) => e ? rej(e) : res(r)));

        const numGuilds = (await dissonanceRedis.keys("guild:*")).length;
        const numMembers = await Member.query().count();

        info({
            title: t.command_about_title,
            fields: [{
                name: t.command_about_field_author,
                value: "molenzwiebel#2773 (EUW - Yahoo Answers)"
            }, {
                name: t.command_about_field_version,
                value: `[${commit.shortHash} - ${commit.subject}](https://github.com/molenzwiebel/OriannaBot/commit/${commit.hash})`
            }, {
                name: t.command_about_field_source,
                value: "[Orianna Bot on Github](https://github.com/molenzwiebel/oriannabot)"
            }, {
                name: t.command_about_field_servers,
                value: numGuilds.toLocaleString(),
                inline: true
            }, {
                name: t.command_about_field_users,
                value: numMembers.toLocaleString(),
                inline: true
            }, {
                name: t.command_about_field_memory_usage,
                value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
                inline: true
            }, {
                name: t.command_about_field_support,
                value: "[discord.gg/bfxdsRC](https://discord.gg/bfxdsRC)",
                inline: true
            }, {
                name: t.command_about_field_vote,
                value: "[discordbots.org](https://discordbots.org/bot/244234418007441408)",
                inline: true
            }]
        });
    }
};
export default AboutCommand;