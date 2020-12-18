import { CommandContext } from "../command";
import { Server, User } from "../../database";
import * as eris from "eris";
import config from "../../config";
import { ResponseOptions } from "../response";
import formatName from "../../util/format-name";
import getTranslator from "../../i18n";

/**
 * Utility method that takes a command context and finds the user the message is
 * targeting. This looks for the first non-bot mention, or otherwise the sender
 * of the message.
 */
export async function expectUser({ msg, client, user }: CommandContext): Promise<User> {
    const mentionTarget = msg.mentions.find(x => !x.bot);
    return mentionTarget ? client.findOrCreateUser(mentionTarget.id) : user();
}

/**
 * The same as expectUser, but also ensures that they have at least a single account linked.
 * If they don't, prints an error message and returns undefined instead.
 */
export async function expectUserWithAccounts(ctx: CommandContext): Promise<User | undefined> {
    const user = await expectUser(ctx);
    await user.$loadRelated("[accounts]");

    if (!user.accounts!.length)  {
        const authorWasTarget = ctx.author.id === user.snowflake;
        await ctx.error({
            title: ctx.t.command_error_no_accounts({ user: formatName(user) }),
            description: ctx.t.command_error_no_accounts_description
        });
        return;
    }

    return user;
}

/**
 * Utility method that takes a command context and checks if the user invoking
 * the command has moderator permissions. If the user does, it returns true. If
 * the user does not, it will print a message and return false.
 */
export async function expectModerator({ ctx, msg, error, guild, t }: CommandContext): Promise<boolean> {
    // If this was sent in DMs, this is illegal and should really throw, but we will abort.
    if (!guild) return false;

    // Bot and server owner can obviously do anything.
    if (ctx.author.id === config.discord.owner || ctx.author.id === guild.ownerID) return true;

    // If the user can manage messages, they are considered a moderator.
    const member = guild.members.get(ctx.author.id);
    if (member && member.permissions.has("manageMessages")) return true;

    await error({
        title: t.command_error_no_permissions,
        description: t.command_error_no_permissions_description
    });
    return false;
}

/**
 * Attempts to find a champion in the specified command context. If no champion name is found,
 * the server default is used, if the message was sent in a server with a default champion set.
 * If none of those are matched, sends a message and returns undefined instead.
 */
export async function expectChampion({ content, guild, server, error, t }: CommandContext): Promise<riot.Champion | undefined> {
    // Prioritize english champion matches over native language.
    const englishMatch = await getTranslator("en-US").staticData.findChampion(content);
    if (englishMatch) return await t.staticData.championById(englishMatch.key);

    // Then, check the native language.
    const match = await t.staticData.findChampion(content);
    if (match) return match;

    if (guild) {
        const serverDefault = (await server()).default_champion;
        if (serverDefault) return await t.staticData.championById(serverDefault);
    }

    await error({
        title: t.command_error_no_champion,
        description: t.command_error_no_champion_description
    });
    // Implicitly return undefined.
}

/**
 * Utility method to paginate a list of `field` values. The specified template will be applied for every page,
 * with only the fields swapped for every list element. The process function is used to lazily compute the contents on
 * every page.
 */
export async function advancedPaginate<T>({ info, msg, t, bot }: CommandContext, elements: T[], template: ResponseOptions, process: (elements: T[], offset: number) => Promise<{ name: string, value: string, inline?: boolean }[]>, perPage = 10) {
    const pages = Math.ceil(elements.length / perPage);
    let curPage = 0;

    const res = await info({
        ...template,
        fields: await process(elements.slice(0, perPage), 0),
        footer: t.command_page_n_of_n({ n: 1, total: pages }) + (template.footer ? " • " + template.footer : "")
    });

    const showPage = async (offset: number) => {
        if (curPage + offset < 0 || curPage + offset >= pages) return;
        curPage += offset;

        res.info({
            ...template,
            fields: await process(elements.slice(curPage * perPage, (curPage + 1) * perPage), curPage * perPage),
            footer: t.command_page_n_of_n({ n: curPage + 1, total: pages }) + (template.footer ? " • " + template.footer : "")
        });
    };

    if (pages !== 1) {
        await res.globalOption("⬅", () => showPage(-1));
        await res.globalOption("➡", () => showPage(+1));
    }

    if (msg.id) {
        await res.option("🗑", () => {
            bot.deleteMessage(msg.channelID, msg.id!, "Deleted By User");
        });
    }

    return res;
}

/**
 * Shortcut function for advancedPaginate that simply uses the supplied fields without lazily computing values.
 */
export async function paginate(ctx: CommandContext, elements: { name: string, value: string, inline?: boolean }[], template: ResponseOptions, perPage = 10) {
    return advancedPaginate(ctx, elements, template, args => Promise.resolve(args), perPage);
}

/**
 * Utility method to paginate a raw message. Unlike advancedPaginate, this does not take the assumption that
 * fields are used as pagination. Instead, a raw callback can edit the page itself. It also takes a maximum amount of
 * entries instead of a fully materialized list of entries.
 */
export async function paginateRaw<T>({ info, msg, ctx, t, bot }: CommandContext, elementCount: number, process: (offset: number, page: number, maxPages: number) => Promise<ResponseOptions>, perPage = 10) {
    const pages = Math.ceil(elementCount / perPage);
    let curPage = 0;
    let loading = false;

    const initialOptions = await process(0, curPage + 1, pages);
    const res = await info({
        ...initialOptions,
        footer: t.command_page_n_of_n({
            n: 1,
            total: pages
        }) + (initialOptions.footer ? " • " + initialOptions.footer : "")
    });

    const showPage = async (offset: number) => {
        if (loading) return;
        if (curPage + offset < 0 || curPage + offset >= pages) return;
        curPage += offset;

        loading = true;

        const template = await process(curPage * perPage, curPage + 1, pages);
        res.info({
            ...template,
            footer: t.command_page_n_of_n({
                n: curPage + 1,
                total: pages
            }) + (template.footer ? " • " + template.footer : "")
        });

        loading = false;
    };

    if (pages !== 1) {
        await res.globalOption("⬅", () => showPage(-1));
        await res.globalOption("➡", () => showPage(+1));
    }

    if (msg.id) {
        await res.option("🗑", () => {
            bot.deleteMessage(msg.channelID, msg.id!, "Deleted By User");
        });
    }

    return res;
}

/**
 * Finds the emote with the specified name in one of the specified emote servers. If the
 * emote cannot be found, Missing_Champion is returned instead. Supplying a number or champion
 * instance will look for the emote belonging to the icon of that champion instead.
 */
export function emote(ctx: CommandContext, name: string | riot.Champion) {
    const raw = rawEmote(ctx, name);

    if (raw) {
        return "<:" + raw + ">";
    } else {
        // Most likely the emote servers are down. Return
        // something so we don't crash.
        return "❓";
    }
}

/**
 * Returns the "raw" emote name for the specified name, which can be used to react to a message.
 */
export function rawEmote({ bot }: CommandContext, name: string | riot.Champion) {
    if (typeof name !== "string") {
        // We have to translate to english as the emotes are in english.
        const en = getTranslator("en-US");
        if (!en.staticData.lazyLoad()) {
            name = "Missing_Champion";
        } else {
            name = en.staticData.championByInternalNameSync(name.id).name.replace(/\W/g, "");
        }
    }

    const servers = config.discord.emoteServers.map(x => bot.guilds.get(x)!).filter(x => !!x);
    const allEmotes = (<eris.Emoji[]>[]).concat(...servers.map(x => x.emojis));

    const emote = allEmotes.find(x => x.name === name) || allEmotes.find(x => x.name === "Missing_Champion")!;

    if (emote) {
        return emote.name + ":" + (<any>emote).id;
    } else {
        return null;
    }
}