import { CommandContext } from "../command";
import { Server, User } from "../../database";
import StaticData from "../../riot/static-data";
import * as eris from "eris";
import config from "../../config";
import { ResponseOptions } from "../response";

/**
 * Utility method that takes a command context and either gets the current server or
 * sends an error to the user (if the command was used in a DM).
 */
export async function expectServer({ guild, error, server }: CommandContext): Promise<Server | undefined> {
    if (!guild) {
        await error({
            title: "🔍 What server?",
            description: "I'll need to know what server you are talking about. Try doing this again, but in a server instead of DMs."
        });
        return;
    }

    return server();
}

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
 * Utility method that takes a command context and checks if the user invoking
 * the command has moderator permissions. If the user does, it returns true. If
 * the user does not, it will print a message and return false.
 */
export async function expectModerator({ msg, error, guild }: CommandContext): Promise<boolean> {
    // If this was sent in DMs, this is illegal and should really throw, but we will abort.
    if (!guild) return false;

    // Bot and server owner can obviously do anything.
    if (msg.author.id === config.discord.owner || msg.author.id === guild.ownerID) return true;

    // If the user can manage messages, they are considered a moderator.
    if (msg.member!.permission.has("manageMessages")) return true;

    await error({
        title: "✋ Stop Right There!",
        description: "You must be able to manage messages to use this feature. Sorry :("
    });
    return false;
}

/**
 * Attempts to find a champion in the specified command context. If no champion name is found,
 * the server default is used, if the message was sent in a server with a default champion set.
 * If none of those are matched, sends a message and returns undefined instead.
 */
export async function expectChampion({ content, guild, server, error }: CommandContext): Promise<riot.Champion | undefined> {
    const match = await StaticData.findChampion(content);
    if (match) return match;

    if (guild) {
        const serverDefault = (await server()).default_champion;
        if (serverDefault) return await StaticData.championById(serverDefault);
    }

    await error({
        title: "🔎 Which Champion?",
        description: "I tried to look for a champion name in your message, but I was unable to find one. Either you had a typo somewhere or you forgot to specify the name of a champion."
    });
    // Implicitly return undefined.
}

/**
 * Utility method to paginate a list of `field` values. The specified template will be applied for every page,
 * with only the fields swapped for every list element. The process function is used to lazily compute the contents on
 * every page.
 */
export async function advancedPaginate<T>({ info, msg }: CommandContext, elements: T[], template: ResponseOptions, process: (elements: T[], offset: number) => Promise<{ name: string, value: string, inline?: boolean }[]>, perPage = 10) {
    const pages = Math.ceil(elements.length / perPage);
    let curPage = 0;

    const res = await info({
        ...template,
        fields: await process(elements.slice(0, perPage), 0),
        footer: "Page 1 of " + pages + (template.footer ? " • " + template.footer : "")
    });

    const showPage = async (offset: number) => {
        if (curPage + offset < 0 || curPage + offset >= pages) return;
        curPage += offset;

        res.info({
            ...template,
            fields: await process(elements.slice(curPage * perPage, (curPage + 1) * perPage), curPage * perPage),
            footer: "Page " + (curPage + 1) + " of " + pages + (template.footer ? " • " + template.footer : "")
        });
    };

    if (pages !== 1) {
        await res.globalOption("⬅", () => showPage(-1));
        await res.globalOption("➡", () => showPage(+1));
    }

    await res.option("🗑", () => msg.delete("Deleted By User"));

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
 * fields are used as pagination. Instead, a raw callback can edit the page itself.
 */
export async function paginateRawMessage<T>({ info, msg }: CommandContext, elements: T[], process: (elements: T[], offset: number, page: number, maxPages: number) => Promise<ResponseOptions>, perPage = 10) {
    const pages = Math.ceil(elements.length / perPage);
    let curPage = 0;

    const res = await info(await process(elements.slice(0, perPage), 0, curPage + 1, pages));

    const showPage = async (offset: number) => {
        if (curPage + offset < 0 || curPage + offset >= pages) return;
        curPage += offset;

        res.info(await process(elements.slice(curPage * perPage, (curPage + 1) * perPage), curPage * perPage, curPage + 1, pages));
    };

    if (pages !== 1) {
        await res.globalOption("⬅", () => showPage(-1));
        await res.globalOption("➡", () => showPage(+1));
    }

    await res.option("🗑", () => msg.delete("Deleted By User"));

    return res;
}

/**
 * Finds the emote with the specified name in one of the specified emote servers. If the
 * emote cannot be found, Missing_Champion is returned instead. Supplying a number or champion
 * instance will look for the emote belonging to the icon of that champion instead.
 */
export function emote({ bot }: CommandContext, name: string | riot.Champion) {
    if (typeof name !== "string") name = name.name.replace(/\W/g, "");

    const servers = config.discord.emoteServers.map(x => bot.guilds.get(x)!).filter(x => !!x);
    const allEmotes = (<eris.Emoji[]>[]).concat(...servers.map(x => x.emojis));

    const emote = allEmotes.find(x => x.name === name) || allEmotes.find(x => x.name === "Missing_Champion")!;

    if (emote) {
        return "<:" + emote.name + ":" + (<any>emote).id + ">";
    } else {
        // Most likely the emote servers are down. Return
        // something so we don't crash.
        return "❓";
    }
}