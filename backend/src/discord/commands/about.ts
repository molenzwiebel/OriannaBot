import { Commit, getLastCommit } from "git-last-commit";
import { GuildMember } from "../../database";
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

        const numGuilds = (await dissonanceRedis.keys("dissonance:guild:*")).length;
        const numMembers: { count: number } = await GuildMember.query().count().first() as any;

        info({
            title: t.command_about_title,
            fields: [{
                name: t.command_about_field_author,
                value: "molenzwiebel (EUW - molenzwiebel#MOLEN)"
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
                value: (+numMembers.count).toLocaleString(),
                inline: true
            }, {
                name: t.command_about_field_memory_usage,
                value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
                inline: true
            }, {
                name: t.command_about_field_support,
                value: "[Discord Invite](https://discord.gg/bfxdsRC)",
                inline: true
            }]
        });
    }
};
export default AboutCommand;