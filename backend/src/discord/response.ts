import * as eris from "eris";
import formatName from "../util/format-name";
import fetch from "node-fetch";
import * as uuid from "uuid";
import config from "../config";
import { createGeneratedFilePath } from "../web/generated-images";

/**
 * The main class that represents a response. A response is a single message
 * sent by us, which can contain emoji reactions that respond to interactions.
 *
 * This is abstracted out to allow responses that are created through both
 * normal command invocations and slash-command invocations, without it
 * requiring extra work on our end.
 */
export abstract class Response {
    /**
     * Map and array used to keep track of reactions for this specific response.
     */
    private reactions = new Map<string, Function>();
    private globalReactions = new Set<string>();

    protected messageId!: string;

    constructor(protected channelId: string, protected bot: eris.Client, protected user?: dissonance.User) {
    }

    /**
     * Creates a new reply for the given constructor options.
     */
    public async reply(options: ResponseOptions): Promise<this> {
        if (this.messageId) throw new Error("Cannot create initial reply twice.");
        this.messageId = await this.create(this.buildContent(options), options.file);

        // if buttons aren't enabled, we need to mock them using reacts
        if (options.buttons && !config.flags?.enableButtons) {
            for (const btn of options.buttons) {
                if (btn.authorOnly) {
                    await this.option(btn.emoji, btn.callback);
                } else {
                    await this.globalOption(btn.emoji, btn.callback);
                }
            }
        }

        return this;
    }

    /**
     * Edits this response with the given new options. The options
     * may not contain a file.
     */
    public async edit(options: ResponseOptions) {
        if (options.file) throw new Error("Cannot include file in edited response");
        if (!this.messageId) throw new Error("Cannot edit response if no initial reply was done.");
        await this.update(this.buildContent(options));
    }

    /**
     * Deletes the message created by this response. Does nothing if
     * the message did not exist (was already deleted).
     */
    public async remove() {
        if (!this.messageId) return;
        try { await this.delete(); } catch { /* Ignored */ }
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
     * Handler for when a button is pressed by a user.
     */
    public readonly processButtonEvent = async (event: dissonance.ButtonInteractionCreateEvent) => {
        if (this.messageId !== event.message.id) return;
        if (!this.reactions.has(event.data.custom_id)) return;

        const callback = this.reactions.get(event.data.custom_id)!;
        const userId = event.member?.user.id ?? event.user!.id;

        // if we have a user, it doesn't match ours, and this isn't global, ignore it.
        if (this.user && this.user.id !== userId && !this.globalReactions.has(event.data.custom_id)) {
            return;
        }

        // invoke the callback!
        callback();
    };

    /**
     * Handler for reaction adding that fires an event if the user added an existing reaction.
     */
    public readonly processReactionEvent = async (event: dissonance.ReactionAddEvent) => {
        if (this.messageId !== event.message_id) return; // ignore other messages
        if (event.user_id === this.bot.user.id) return; // ignore ourselves
        if (!this.reactions.has(event.emoji.name!)) return; // ignore things we don't want to see

        // If this wasn't the one that triggered the message, and the reaction cannot be used by everyone, delete the reaction.
        // Reactions cannot be deleted in a PM, but that doesn't matter since this will always be false in a PM.
        // If this context was created without a user, we assume that everyone can use the reactions.
        if (this.user && event.user_id !== this.user.id && !this.globalReactions.has(event.emoji.name!)) {
            this.bot.removeMessageReaction(this.channelId, this.messageId, event.emoji.name!, event.user_id).catch(() => { /* Ignored, we probably don't have permissions. */ });
            return;
        }

        // Remove the reaction if we weren't in a PM.
        if (event.guild_id) {
            this.bot.removeMessageReaction(this.channelId, this.messageId, event.emoji.name!, event.user_id).catch(() => { /* Ignored, we probably don't have permissions. */ });
        }

        // Call the callback
        this.reactions.get(event.emoji.name!)!();
    };

    /**
     * Create a new embed with the given content and optionally the given
     * file. Should return the message ID of the created message.
     */
    protected abstract create(content: eris.MessageContent, file?: { name: string, file: Buffer }): Promise<string>;

    /**
     * Update the message. This should update in-place and not recreate the
     * message.
     */
    protected abstract update(content: eris.MessageContent): Promise<void>;

    /**
     * Delete the message.
     */
    protected abstract delete(): Promise<void>;

    /**
     * Shorthands for various colored EDIT operations.
     */
    public readonly ok = (response: ResponseOptions = {}) => this.edit({ color: 0x49bd1a, ...response });
    public readonly error = (response: ResponseOptions = {}) => this.edit({ color: 0xfd5c5c, ...response });
    public readonly info = (response: ResponseOptions = {}) => this.edit({ color: 0x0a96de, ...response });

    /**
     * @returns string the URL of the user that triggered this request
     */
    private get userAvatarURL(): string {
        if (!this.user!.avatar) {
            return `https://cdn.discordapp.com/embed/avatars/${+this.user!.discriminator % 5}.png`
        }

        return `https://cdn.discordapp.com/avatars/${this.user!.id}/${this.user!.avatar}.${this.user?.avatar?.startsWith("a_") ? "gif" : "png"}`;
    }

    /**
     * Helper that converts our simpler {@link ResponseOptions} format into the
     * format of embeds expected by Eris.
     */
    private buildContent(options: ResponseOptions): eris.MessageContent {
        const ret: any = {};

        let obj: any; // eris.EmbedOptions;
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

        if (options.buttons && config.flags?.enableButtons) {
            // Need to have a row for every 5 buttons.
            const components = ret.components = [] as any[];

            for (let i = 0; i < options.buttons.length; i += 5) {
                const buttonsInRow = options.buttons.slice(i, i + 5);
                const buttonComponents = [] as any[];

                for (const button of buttonsInRow) {
                    const id = uuid.v4();
                    this.reactions.set(id, button.callback);
                    if (!button.authorOnly) this.globalReactions.add(id);

                    buttonComponents.push({
                        type: 2, // button
                        style: button.style || ButtonStyle.PRIMARY,
                        label: button.label,
                        emoji: stringToPartialEmoji(button.emoji),
                        custom_id: id
                    });
                }

                components.push({
                    type: 1, // row
                    components: buttonComponents
                });
            }
        }

        if (options.file) {
            obj.image = { url: "attachment://" + options.file.name };
        }

        ret.embed = obj;

        return ret;
    }
}

/**
 * Simple response in a text channel.
 */
export class TextChannelResponse extends Response {
    protected create(content: eris.MessageContent, file?: { name: string, file: Buffer }): Promise<string> {
        return this.bot.createMessage(this.channelId, content, file).then(x => x.id);
    }

    protected delete(): Promise<void> {
        return this.bot.deleteMessage(this.channelId, this.messageId);
    }

    protected async update(content: eris.MessageContent): Promise<void> {
        await this.bot.editMessage(this.channelId, this.messageId, content);
    }
}

/**
 * A response created if this is the first message as a response to
 * some invocation through a slash command. This is different because
 * we generally do the pending-acknowledge command, which means that we
 * need to do an edit instead of a submit for our creation.
 */
export class InitialInteractionWebhookResponse extends Response {
    constructor(channelId: string, bot: eris.Client, user: dissonance.User, private interactionToken: string) {
        super(channelId, bot, user);
    }

    protected async create(content: eris.MessageContent, file?: { name: string, file: Buffer }): Promise<string> {
        // We cannot upload files through webhook, so we need to host them locally.
        if (file && (content as any).embed) {
            const embed: eris.EmbedOptions = (content as any).embed;
            const path = await createGeneratedFilePath(file.name, `image-${this.interactionToken}`, async () => file.file);

            if (embed.image?.url === `attachment://${file.name}`) {
                embed.image.url = path;
            }

            if (embed.thumbnail?.url === `attachment://${file.name}`) {
                embed.thumbnail.url = path;
            }
        }

        const response = await this.editOriginalMessage(content);
        return response.id;
    }

    protected async delete(): Promise<void> {
        await fetch(`https://discord.com/api/v9/webhooks/${this.bot.user.id}/${this.interactionToken}/messages/@original`, {
            method: "DELETE"
        });
    }

    protected async update(content: eris.MessageContent): Promise<void> {
        await this.editOriginalMessage(content);
    }

    private async editOriginalMessage(content: eris.MessageContent): Promise<any> {
        // webhooks use an embeds array instead of a single embed
        if (typeof content !== "string") {
            (content as any).embeds = [content.embed];
            delete content.embed;
        }

        return await fetch(`https://discord.com/api/v9/webhooks/${this.bot.user.id}/${this.interactionToken}/messages/@original`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content)
        }).then(x => x.json());
    }
}

/**
 * A response that is ephemeral (can only be seen by the user that triggered the
 * slash-command) in response to an event triggered by a webhook.
 */
export class EphemeralInteractionFollowupWebhookResponse extends Response {
    constructor(channelId: string, bot: eris.Client, user: dissonance.User, private interactionToken: string) {
        super(channelId, bot, user);
    }

    protected async create(content: eris.MessageContent, file?: { name: string, file: Buffer }): Promise<string> {
        // We cannot upload files through webhook, so we need to host them locally.
        if (file && (content as any).embed) {
            const embed: eris.EmbedOptions = (content as any).embed;
            const path = await createGeneratedFilePath(file.name, `image-${this.interactionToken}`, async () => file.file);

            if (embed.image?.url === `attachment://${file.name}`) {
                embed.image.url = path;
            }

            if (embed.thumbnail?.url === `attachment://${file.name}`) {
                embed.thumbnail.url = path;
            }
        }

        // webhooks use an embeds array instead of a single embed
        if (typeof content !== "string") {
            (content as any).embeds = [content.embed];
            delete content.embed;
        }

        return fetch(`https://discord.com/api/v9/webhooks/${this.bot.user.id}/${this.interactionToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...(content as any),
                flags: 64 // ephemeral
            })
        }).then(x => x.json()).then(x => x.id);
    }

    protected async delete(): Promise<void> {
        await fetch(`https://discord.com/api/v9/webhooks/${this.bot.user.id}/${this.interactionToken}/messages/${this.messageId}`, {
            method: "DELETE"
        });
    }

    protected async update(content: eris.MessageContent): Promise<void> {
        // webhooks use an embeds array instead of a single embed
        if (typeof content !== "string") {
            (content as any).embeds = [content.embed];
            delete content.embed;
        }

        await fetch(`https://discord.com/api/v9/webhooks/${this.bot.user.id}/${this.interactionToken}/messages/${this.messageId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content)
        });
    }
}

function stringToPartialEmoji(emoji: string) {
    if (!emoji.includes(":")) return { name: emoji };

    const [id, name] = emoji.split(":");
    return {
        name,
        id,
        animated: false // can't determine whether this is animated
    };
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
    buttons?: {
        emoji: string; // used for the reaction if buttons are turned off
        label?: string;
        callback: () => any;
        authorOnly?: boolean; // public by default
        style?: ButtonStyle;
    }[];
}

export const enum ButtonStyle {
    PRIMARY = 1, // blurple
    SECONDARY = 2, // gray
    SUCCESS = 3, // green
    DANGER = 4, // red
}