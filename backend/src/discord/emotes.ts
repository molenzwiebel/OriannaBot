/**
 * Emotes are Discord application emojis of the bot. The sync makes the
 * application emojis match the files in `assets/emotes` plus one icon per
 * DDragon champion, named after the English champion name without non-word
 * characters. A classic champion uses the emote of the normal champion. To
 * upload a new version of an emote, delete it on Discord and the next sync
 * uploads it again.
 */
import {
    APIApplicationEmoji,
    RESTGetAPIApplicationEmojisResult,
    RESTPostAPIApplicationEmojiJSONBody,
    RESTPostAPIApplicationEmojiResult
} from "discord-api-types/v10";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import config from "../config";
import getTranslator, { reloadStaticData } from "../i18n";
import { isClassicChampion } from "../riot/static-data";
import debug = require("debug");

const info = debug("orianna:emotes");
const error = debug("orianna:emotes:error");

const EMOTES_DIR = path.resolve(__dirname, "../../assets/emotes");
const SYNC_INTERVAL = 6 * 60 * 60 * 1000;
const MISSING_CHAMPION = "Missing_Champion";
const EMOJIS_ROUTE = `/applications/${config.discord.clientId}/emojis`;

let emoteCache = new Map<string, APIApplicationEmoji>();
let syncRunning = false;

/**
 * Finds the emote corresponding to the given mastery level.
 */
export function masteryEmote(level: number) {
    return emote("Level_" + Math.min(level, 10));
}

/**
 * Returns the message text for the emote with the specified name. Supplying a champion
 * returns the icon of that champion. If the emote doesn't exist, the Missing_Champion
 * emote is returned instead. If that doesn't exist either, returns "❓".
 */
export function emote(name: string | riot.Champion) {
    if (typeof name !== "string") {
        // Emote names use the English champion names.
        const en = getTranslator("en-US").staticData;
        name = en.lazyLoad()
            ? championEmoteName(en.baseChampion(en.championByInternalNameSync(name.id)))
            : MISSING_CHAMPION;
    }

    const found = emoteCache.get(name) ?? emoteCache.get(MISSING_CHAMPION);
    return found ? formatEmote(found) : "❓";
}

/**
 * Replaces each `:name:` in the text with the emote with that name. If no emote
 * with that name exists, the `:name:` stays in the text.
 */
export function replaceEmoteNames(text: string) {
    // The lookbehind skips names inside existing emote tags such as <a:name:id>.
    return text.replace(/(?<![<\w]):(\w{2,32}):/g, (match, name) => {
        const found = emoteCache.get(name);
        return found ? formatEmote(found) : match;
    });
}

function formatEmote(emoji: APIApplicationEmoji) {
    return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

/**
 * Loads the emotes, then starts a sync now and every few hours. Call this once.
 * Errors are logged and don't stop later syncs.
 */
export async function startEmoteSync() {
    try {
        emoteCache = await fetchEmotes();
        info("Loaded %i emotes", emoteCache.size);
    } catch (e) {
        error("Error loading emotes: %O", e);
    }

    runSync();
    setInterval(runSync, SYNC_INTERVAL);
}

async function runSync() {
    if (syncRunning) return;
    syncRunning = true;

    try {
        await reloadStaticData();
        await syncEmotes();
    } catch (e) {
        error("Error syncing emotes: %O", e);
    } finally {
        syncRunning = false;
    }
}

/**
 * Deletes the application emojis that don't have a local source, then uploads
 * the local sources that don't have an application emoji.
 */
async function syncEmotes() {
    const sources = await getEmoteSources();
    const remote = await fetchEmotes();

    for (const [name, emoji] of remote) {
        if (sources.has(name)) continue;

        info("Deleting emote %s", name);
        await discordRequest("DELETE", `${EMOJIS_ROUTE}/${emoji.id}`);
        remote.delete(name);
    }

    for (const [name, getImage] of sources) {
        if (remote.has(name)) continue;

        info("Uploading emote %s", name);
        try {
            const body: RESTPostAPIApplicationEmojiJSONBody = { name, image: await getImage() };
            const created: RESTPostAPIApplicationEmojiResult = await (await discordRequest("POST", EMOJIS_ROUTE, body)).json();
            remote.set(name, created);
        } catch (e) {
            error("Error uploading emote %s: %O", name, e);
        }
    }

    emoteCache = remote;
}

/**
 * Returns all emotes that should exist, mapped to a function that returns the image as a data URI.
 */
async function getEmoteSources() {
    const sources = new Map<string, () => Promise<string>>();

    for (const file of await fs.promises.readdir(EMOTES_DIR)) {
        const ext = path.extname(file);
        const mime = ext === ".gif" ? "image/gif" : "image/png";

        sources.set(path.basename(file, ext), async () => {
            const data = await fs.promises.readFile(path.join(EMOTES_DIR, file));
            return `data:${mime};base64,${data.toString("base64")}`;
        });
    }

    const staticData = getTranslator("en-US").staticData;
    for (const champion of await staticData.getAllChampions()) {
        if (isClassicChampion(champion)) continue;

        sources.set(championEmoteName(champion), async () => {
            const res = await fetch(await staticData.getChampionIcon(champion));
            if (!res.ok) throw new Error(`Fetching icon of ${champion.id} returned ${res.status}`);

            return `data:image/png;base64,${(await res.buffer()).toString("base64")}`;
        });
    }

    return sources;
}

async function fetchEmotes() {
    const result: RESTGetAPIApplicationEmojisResult = await (await discordRequest("GET", EMOJIS_ROUTE)).json();
    return new Map(result.items.map(x => [x.name, x]));
}

function championEmoteName(champion: riot.Champion) {
    return champion.name.replace(/\W/g, "");
}

/**
 * Sends a request to the Discord API and returns the response. If Discord returns
 * a rate limit, waits and tries again. Throws if the response has an error status.
 */
async function discordRequest(method: string, route: string, body?: object) {
    while (true) {
        const res = await fetch("https://discord.com/api/v10" + route, {
            method,
            headers: {
                "Authorization": "Bot " + config.discord.token,
                "Content-Type": "application/json"
            },
            body: body && JSON.stringify(body)
        });

        if (res.status === 429) {
            const { retry_after } = await res.json();
            await new Promise(resolve => setTimeout(resolve, retry_after * 1000));
            continue;
        }

        if (!res.ok) throw new Error(`${method} ${route} returned ${res.status}: ${await res.text()}`);
        return res;
    }
}
