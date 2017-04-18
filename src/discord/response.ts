import Eris = require("eris");

/**
 * All extra options that can be supplied to the response edit/delete features.
 */
export interface EmbedOptions {
    title?: string;
    url?: string;
    description?: string;
    fields?: { name: string, value: string, inline?: boolean }[];
    image?: string;
    thumbnail?: string;
    author?: { icon_url?: string, name: string };
}

/**
 * Represents a message containing an embed sent in response to some user action.
 * This class adds the ability to listen to events that happened on the response,
 * which abstracts out logic relating things like reactions and the creator removing
 * their message.
 */
export default class Response {
    // The message that triggered this response.
    private trigger: eris.Message;
    // The current message.
    private message: eris.Message;

    // Keeps track of reactions added to the response and any callbacks.
    private reactions: Map<string, Function> = new Map();
    private globalReactions: string[] = [];

    constructor(private bot: Eris, trigger: eris.Message) {
        this.trigger = trigger;
    }

    /**
     * Sends the initial response. This method should only be called by MessageHandler.
     */
    async respond(responseColor: number, responseContent: EmbedOptions, responseChannel = this.trigger.channel): Promise<void> {
        this.message = await responseChannel.createMessage({
            embed: this.buildEmbed(responseColor, responseContent)
        });
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
     * Replaces the response with an OK message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    ok(response: EmbedOptions = {}): Promise<void> {
        return this.update(0x49bd1a, response);
    }

    /**
     * Replaces the response with an errornous message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    error(response: EmbedOptions = {}): Promise<void> {
        return this.update(0xfd5c5c, response);
    }

    /**
     * Replaces the response with an information message. This will edit the message if it was in a public channel,
     * or delete and recreate the response if it was in a direct message.
     */
    info(response: EmbedOptions = {}): Promise<void> {
        return this.update(0x0a96de, response);
    }

    /**
     * Implementation for {@link ok}, {@link error} and {@link info}.
     */
    private async update(color: number, response: EmbedOptions) {
        // If we weren't in a PM.
        if (!(<any>this.message.channel).recipient) {
            this.message = await this.message.edit({ embed: this.buildEmbed(color, response) });
            return;
        }

        // Send the message, delete the old one.
        await this.message.delete();
        this.message = await this.message.channel.createMessage({ embed: this.buildEmbed(color, response) });

        // Add reactions again.
        for (const [key] of this.reactions) {
            await this.message.addReaction(key, "@me");
        }
    }

    /**
     * Handler for reaction adding that fires an event if the user added an existing reaction.
     */
    public readonly onReactionAdd = async (message: eris.Message, emoji: { name: string }, userID: string) => {
        if (userID === this.bot.user.id) return;
        if (message.id !== this.message.id) return;
        if (!this.reactions.has(emoji.name)) return;

        // If this wasn't the one that triggered the message, and the reaction cannot be used by everyone, delete the reaction.
        // Reactions cannot be deleted in a PM, but that doesn't matter since this will always be false in a PM.
        if (userID !== this.trigger.author.id && this.globalReactions.indexOf(emoji.name) === -1) {
            await message.removeReaction(emoji.name, userID);
            return;
        }

        // Remove the reaction if we weren't in a PM.
        if (!message.channel.recipient) {
            await message.removeReaction(emoji.name, userID);
        }

        // Call the callback
        this.reactions.get(emoji.name)!();
    };

    /**
     * Handler for message deletion that deletes the response if the trigger is deleted.
     */
    public readonly onMessageDelete = async (msg: eris.Message) => {
        if (msg.id !== this.trigger.id) return;

        await this.message.delete();
    };

    /**
     * @returns the name of the user that triggered this response. This is their nickname if they are on a Guild, and their username otherwise.
     */
    private get triggerName() {
        return this.trigger.member ? this.trigger.member.nick || this.trigger.author.username : this.trigger.author.username;
    }

    /**
     * Helper function that replaces certain placeholders with their equivalents.
     */
    private replace(content: string): string {
        return content
            .replace(/<user>/g, this.triggerName)
            .replace(/<@user>/g, "<@" + this.trigger.author.id + ">")
            .replace(/<me>/g, this.bot.user.username)
            .replace(/<@me>/g, "<@" + this.bot.user.id + ">");
    }

    private buildEmbed(color: number, options: EmbedOptions): eris.Embed {
        const obj: eris.Embed = {
            color,
            footer: { icon_url: this.trigger.author.avatarURL, text: this.triggerName },
            timestamp: new Date()
        };

        if (options.title) obj.title = this.replace(options.title);
        if (options.url) obj.url = options.url;
        if (options.description) obj.description = this.replace(options.description);
        if (options.fields) obj.fields = options.fields.map(x => ({ name: this.replace(x.name), value: this.replace(x.value), inline: x.inline }));
        if (options.image) obj.image = { url: options.image };
        if (options.thumbnail) obj.thumbnail = { url: options.thumbnail };
        if (options.author) obj.author = options.author;

        return obj;
    }
}