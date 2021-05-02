import * as eris from "eris";
import formatName from "../util/format-name";

export abstract class Response {
    /**
     * Map and array used to keep track of reactions for this specific response.
     */
    private reactions = new Map<string, Function>();
    private globalReactions = new Set<string>();

    private messageId!: string;

    constructor(private channelId: string, private bot: eris.Client, private user?: dissonance.User) {
    }

    public async reply(options: ResponseOptions) {
        if (this.messageId) throw new Error("Cannot create initial reply twice.");
        this.messageId = await this.create(this.buildEmbed(options), options.file?.file);
    }

    public async edit(options: ResponseOptions) {
        if (options.file) throw new Error("Cannot include file in edited response");
        if (!this.messageId) throw new Error("Cannot edit response if no initial reply was done.");
        await this.update(this.buildEmbed(options));
    }

    public async remove() {
        await this.delete();
        this.messageId = null as any;
    }

    /**
     * Adds the specified reaction. The callback is invoked when the reaction is pressed by the author
     * of the original message. Does nothing if the reaction is already added.
     */
    async option(emoji: string, handler: () => any) {
        if (this.reactions.has(emoji)) return;

        this.reactions.set(emoji, handler);
        await this.bot.addMessageReaction(this.channelId, this.messageId, emoji);
    }

    /**
     * Does the same as {@link option}, but allows _any_ user to trigger the reaction callback.
     */
    async globalOption(emoji: string, handler: () => any) {
        await this.option(emoji, handler);
        this.globalReactions.add(emoji);
    }

    /**
     * Removes a reaction added by {@link option} or {@link globalOption}.
     */
    removeOption(emoji: string) {
        this.reactions.delete(emoji);
        this.globalReactions.delete(emoji);

        this.bot.removeMessageReaction(this.channelId, this.messageId, emoji, "@me").catch(e => {}); // Ignore any errors
    }

    /**
     * Removes all options.
     */
    removeAllOptions() {
        this.reactions.clear();
        this.globalReactions.clear();

        if (this.messageId) {
            return this.bot.removeMessageReactions(this.channelId, this.messageId).catch(() => { /* Doesn't work in DMs */ });
        }

        return Promise.resolve();
    }

    /**
     * Create a new embed with the given content and optionally the given
     * file. Should return the message ID of the created message.
     */
    protected abstract create(embed: eris.EmbedOptions, file?: Buffer): Promise<string>;

    /**
     * Update the message. This should update in-place and not recreate the
     * message.
     */
    protected abstract update(newEmbed: eris.EmbedOptions): Promise<void>;

    /**
     * Delete the message.
     */
    protected abstract delete(): Promise<void>;

    private get userAvatarURL(): string {
        if (!this.user!.avatar) {
            return `https://cdn.discordapp.com/embed/avatars/${+this.user!.discriminator % 5}.png`
        }

        return `https://cdn.discordapp.com/avatars/${this.user!.id}/${this.user!.avatar}.${this.user?.avatar?.startsWith("a") ? "gif" : "png"}`;
    }

    private buildEmbed(options: ResponseOptions): eris.EmbedOptions {
        let obj: eris.EmbedOptions;
        if (this.user) {
            obj = {
                color: options.color,
                footer: { icon_url: this.userAvatarURL, text: (options.footer ? options.footer + (options.noFooterDefaults ? "" : " • ") : "") + (options.noFooterDefaults ? "" : formatName(this.user, true)) },
                timestamp: options.noFooterDefaults ? void 0 : new Date(options.timestamp || Date.now()).toISOString()
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
    file?: {
        name: string,
        file: Buffer,
    };
}
