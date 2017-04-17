import DiscordClient from "./client";
import debug = require("debug");
import Response, { EmbedOptions } from "./response";

import sample = require("lodash.sample");
import { expectChampion, expectServer, expectUser } from "./commands/util";

export interface Command {
    name: string;
    keywords: string[];
    description: string;
    examples: string[];
    hideFromHelp?: boolean;
    handler: (this: MessageHandler, message: eris.Message) => any;
}

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";

/**
 * Handles management of {@link Response}s and redirects commands accordingly.
 */
export default class MessageHandler {
    protected readonly log = debug("orianna:discord:message");
    private responses: Response[] = [];
    private commands: Command[] = [];

    constructor(public readonly client: DiscordClient) {
        this.client.bot.on("messageCreate", async message => {
            // Do not respond to bots.
            if (message.author.bot) return;

            const isPM = !!message.channel.recipient;

            // Only handle messages that contain a mention (messages are always handled in a PM).
            if (!isPM && !message.mentions.find(x => x.id === this.client.bot.user.id)) return;

            const contents = message.cleanContent.toLowerCase();
            const handler = this.commands.find(x => x.keywords.some(x => contents.indexOf(x) !== -1));
            if (!handler) return await message.addReaction(HELP_REACTION, "@me");

            // Remove the Orianna bot mention.
            message.mentions = message.mentions.filter(x => x.id !== this.client.bot.user.id);

            this.log("[%s: %s] <%s> %s", message.channel.id, handler.name, message.author.username, message.cleanContent);
            handler.handler.call(this, message);
        });

        this.client.bot.on("messageReactionAdd", this.onReactionAdd);
    }

    /**
     * Adds a new command is immediately triggerable.
     */
    registerCommand(cmd: Command) {
        this.commands.push(cmd);
    }

    /**
     * Responds to the specified message with a green embed message.
     */
    ok(message: eris.Message, content: EmbedOptions): Promise<Response> {
        return this.createResponse(message, 0x49bd1a, content);
    }

    /**
     * Responds to the specified message with a blue embed message.
     */
    info(message: eris.Message, content: EmbedOptions): Promise<Response> {
        return this.createResponse(message, 0x0a96de, content);
    }

    /**
     * Responds to the specified message with a red embed message.
     */
    error(message: eris.Message, content: EmbedOptions): Promise<Response> {
        return this.createResponse(message, 0xfd5c5c, content);
    }

    /**
     * Various utilities from ./commands/util.ts. See that file for more details.
     */
    readonly expectUser = expectUser.bind(this);
    readonly expectServer = expectServer.bind(this);
    readonly expectChampion = expectChampion.bind(this);

    /**
     * Handles reaction adding. If it was on a message we previously marked with a
     * question mark, display the help information.
     */
    private onReactionAdd = async (message: eris.Message, emoji: { name: string }, userID: string) => {
        if (userID === this.client.bot.user.id) return; // we added it, abort
        if (!message.author) return; // message not cached, abort
        if (userID !== message.author.id) return; // emoji not added by author, abort
        if (emoji.name !== HELP_REACTION) return; // not help emoji, abort
        if (!message.mentions.some(x => x.id === this.client.bot.user.id)) return; // we weren't mentioned, abort

        // At this point we know the original author added a question mark to a message that mentioned us.
        // That doesn't yet give conclusive info that we had a question mark already, but it is good enough.

        const commands = this.commands.filter(x => !x.hideFromHelp);
        const index: EmbedOptions = {
            title: ":bookmark: Orianna Help",
            description: "I try to determine what you mean when you mention me using specific keywords. Here is a simple list of commands that I understand. Click the corresponding number for more information and examples about the commmand. Click :bookmark: to show this index.",
            fields: commands.map((x, i) => ({ name: (i + 1) + " - " + x.name, value: sample(x.examples) }))
        };

        const resp = await this.info(message, index);
        await resp.option(HELP_INDEX_REACTION, () => resp.info(index));

        for (const cmd of commands) {
            await resp.option(decodeURIComponent((this.commands.indexOf(cmd) + 1) + "%E2%83%A3"), () => {
                resp.info({
                    title: ":bookmark: Help for " + cmd.name,
                    fields: [{
                        name: "Description",
                        value: cmd.description
                    }, {
                        name: "Keywords",
                        value: cmd.keywords.map(x => "`" + x + "`").join(", ")
                    }, {
                        name: "Sample Usage",
                        value: cmd.examples.join("\n")
                    }]
                });
            });
        }
    };

    /**
     * Internal implementation for {@link ok}, {@link info} and {@link error}.
     */
    private createResponse(message: eris.Message, color: number, content: EmbedOptions): Promise<Response> {
        const response = new Response(this.client.bot, message);
        this.responses.push(response); // store it here so we can keep track of it
        setTimeout(() => {
            response.destroy();
            this.responses.splice(this.responses.indexOf(response), 1);
        }, 1000 * 60 * 10); // Messages expire after 10 minutes. This is done to ensure that they can be garbage collected.

        return response.respond(color, content).then(x => response);
    }
}