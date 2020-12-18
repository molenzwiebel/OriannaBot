import * as eris from "eris";
import formatName from "../util/format-name";

// Typescript somehow doesn't compile the import unless we add this.
const _eris = eris;

/**
 * All extra options that can be supplied to the response edit/delete features.
 */
export interface ResponseOptions {
    title?: string;
    color?: number;
    url?: string;
    description?: string;
    fields?: { name: string, value: string, inline?: boolean }[];
    image?: string | { url: string, width: number, height: number };
    thumbnail?: string;
    author?: { icon_url?: string, name: string };
    footer?: string;
    noFooterDefaults?: boolean;
    timestamp?: number;
    noFooter?: boolean;
    file?: {
        name: string,
        file: Buffer,
        fileOnly?: boolean
    };
}

/**
 * Represents the minimal information needed for a message that can be responded to.
 */
export interface TriggerMessage {
    id?: string;
    content: string;
    channelID: string;
    mentions: eris.User[];
}

/**
 * Represents a message containing an embed sent in response to some user action.
 * This class adds the ability to listen to events that happened on the response,
 * which abstracts out logic relating things like reactions and the creator removing
 * their message.
 */
export default class Response {
    /**
     * The channel this response is sent to. This may differ from the channel
     * where the response was triggered (if we reply in DMs for example).
     */
    private channelID: string;

    /**
     * The message that triggered this response. Used to delete the response
     * when the original message was deleted.
     */
    private trigger?: TriggerMessage;

    /**
     * The user that triggered this response. Used to limit reactions to only
     * the user that caused the original command.
     */
    private user: eris.User;

    /**
     * The current message for this response. Used so we can edit the response later.
     */
    public message: eris.Message;

    /**
     * Map and array used to keep track of reactions for this specific response.
     */
    private reactions = new Map<string, Function>();
    private globalReactions: string[] = [];

    constructor(private bot: eris.Client, user: eris.User, channelID: string, trigger?: TriggerMessage) {
        this.channelID = channelID;
        this.user = user;
        this.trigger = trigger;
    }

    /**
     * Sends the initial response. This method should not be called by a command directly
     * (but rather by the constructor of the response context).
     */
    async respond(responseContent: ResponseOptions): Promise<Response> {
        // Do not include embed if this is file-only.
        if (responseContent.file && responseContent.file.fileOnly) {
            this.message = await this.bot.createMessage(this.channelID, "", responseContent.file);
        } else {
            this.message = await this.bot.createMessage(this.channelID, {
                embed: this.buildEmbed(responseContent)
            }, responseContent.file || void 0);
        }

        return this;
    }

    /**
     * Adds the specified reaction. The callback is invoked when the reaction is pressed by the author
     * of the original message. Does nothing if the reaction is already added.
     */
    async option(emoji: string, handler: () => any) {
        if (this.reactions.has(emoji)) return;

        this.reactions.set(emoji, handler);
        await this.message.addReaction(emoji, "@me");
    }

    /**
     * Does the same as {@link option}, but allows _any_ user to trigger the reaction callback.
     */
    async globalOption(emoji: string, handler: () => any) {
        await this.option(emoji, handler);
        if (this.globalReactions.indexOf(emoji) === -1) this.globalReactions.push(emoji);
    }

    /**
     * Removes a reaction added by {@link option} or {@link globalOption}.
     */
    removeOption(emoji: string) {
        this.reactions.delete(emoji);
        if (this.globalReactions.indexOf(emoji) !== -1) this.globalReactions.splice(this.globalReactions.indexOf(emoji), 1);

        this.message.removeReaction(emoji, "@me").catch(e => {}); // Ignore any errors
    }

    /**
     * Removes all options.
     */
    removeAllOptions() {
        this.reactions.clear();
        this.globalReactions = [];

        if (this.message) {
            return this.message.removeReactions().catch(() => { /* Doesn't work in DMs */ });
        }

        return Promise.resolve();
    }

    /**
     * Removes both the trigger and the response message.
     */
    async remove() {
        try { await this.message.delete(); } catch (e) {} // might not be able to delete (perms)
        try {
            if (this.trigger && this.trigger.id) {
                await this.bot.deleteMessage(this.trigger.channelID, this.trigger.id);
            }
        } catch (e) {} // might not be able to delete (in a pm)
    }

    /**
     * Only removes the response.
     */
    async removeResponse() {
        try { await this.message.delete(); } catch (e) {}
    }

    /**
     * Replaces the response with an OK message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    ok(response: ResponseOptions = {}): Promise<void> {
        return this.update({ color: 0x49bd1a, ...response });
    }

    /**
     * Replaces the response with an errornous message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    error(response: ResponseOptions = {}): Promise<void> {
        return this.update({ color: 0xfd5c5c, ...response });
    }

    /**
     * Replaces the response with an information message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    info(response: ResponseOptions = {}): Promise<void> {
        return this.update({ color: 0x0a96de, ...response });
    }

    /**
     * Implementation for {@link ok}, {@link error} and {@link info}.
     */
    async update(response: ResponseOptions) {
        // Recreate message if this is file-only.
        if (response.file && response.file.fileOnly) {
            // Do these at the same time, little bit faster.
            await Promise.all([
                this.message.delete(),
                this.respond(response)
            ]);

            // Re-add reactions.
            for (const [react] of this.reactions) {
                await this.message.addReaction(react);
            }
        } else {
            this.message = await this.message.edit({ embed: this.buildEmbed(response) });
        }
    }

    /**
     * Handler for reaction adding that fires an event if the user added an existing reaction.
     */
    public readonly onReactionAdd = async (message: eris.Message, emoji: { name: string }, userID: string) => {
        if (userID === this.bot.user.id) return;
        if (!message || !this.message) return;
        if (message.id !== this.message.id) return;
        if (!this.reactions.has(emoji.name)) return;

        // If this wasn't the one that triggered the message, and the reaction cannot be used by everyone, delete the reaction.
        // Reactions cannot be deleted in a PM, but that doesn't matter since this will always be false in a PM.
        if (userID !== this.user.id && this.globalReactions.indexOf(emoji.name) === -1) {
            message.removeReaction(emoji.name, userID).catch(() => { /* Ignored, we probably don't have permissions. */ });
            return;
        }

        // Remove the reaction if we weren't in a PM.
        if (!(this.message.channel instanceof _eris.PrivateChannel)) {
            message.removeReaction(emoji.name, userID).catch(() => { /* Ignored, we probably don't have permissions. */ });
        }

        // Call the callback
        this.reactions.get(emoji.name)!();
    };

    /**
     * Handler for message deletion that deletes the response if the trigger is deleted.
     * @returns true if this response was deleted, false otherwise
     */
    public readonly onMessageDelete = (msg: { id: string }) => {
        if (!msg || !this.trigger) return false;
        if (msg.id !== this.trigger.id) return false;

        if (this.message) {
            this.message.delete().catch(() => {
                /* Ignored, we probably don't have permissions. */
            });
        }

        return true;
    };

    private buildEmbed(options: ResponseOptions): eris.EmbedOptions {
        let obj: eris.EmbedOptions;
        if (this.trigger) {
            obj = {
                color: options.color,
                footer: options.noFooter ? void 0 : { icon_url: this.user.avatarURL, text: (options.footer ? options.footer + (options.noFooterDefaults ? "" : " • ") : "") + (options.noFooterDefaults ? "" : formatName(this.user, true)) },
                timestamp: options.noFooter || options.noFooterDefaults ? void 0 : new Date(options.timestamp || Date.now()).toISOString()
            };
        } else {
            obj = { color: options.color };
            if (options.footer) obj.footer = { text: options.footer };
            if (options.timestamp) obj.timestamp = new Date(options.timestamp).toISOString();
        }

        if (options.title) obj.title = options.title;
        if (options.url) obj.url = options.url;
        if (options.description) obj.description = options.description;
        if (options.fields) obj.fields = options.fields;
        if (options.image) obj.image = typeof options.image === "string" ? { url: options.image } : options.image;
        if (options.thumbnail) obj.thumbnail = { url: options.thumbnail };
        if (options.author) obj.author = options.author;

        if (options.file) {
            obj.image = { url: "attachment://" + options.file.name };
        }

        return obj;
    }
}