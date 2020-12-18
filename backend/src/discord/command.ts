import * as eris from "eris";
import { Server, User } from "../database";
import { Translator } from "../i18n";
import DiscordClient from "./client";
import Response, { ResponseOptions, TriggerMessage } from "./response";
import { ApplicationCommandOption } from "./slash-commands";

export interface Command {
    /**
     * The name of the command, as shown in the help.
     */
    name: string;

    /**
     * A small description of a few words about what this command does.
     * Used in the list of commands.
     */
    smallDescriptionKey: keyof Translator;

    /**
     * A description of the command, as shown in the help. This description
     * can span multiple lines and use markdown.
     */
    descriptionKey: keyof Translator;

    /**
     * Keywords that trigger this command if they appear in the message.
     * These should appear standalone (e.g. `\b<word>\b`).
     */
    keywords: string[];

    /**
     * If this command should be hidden from the help index. True to hide,
     * false or undefined to show it normally.
     */
    hideFromHelp?: boolean;

    /**
     * If this command should not show the bot as typing.
     */
    noTyping?: boolean;

    /**
     * If this command doesn't require a mention to trigger.
     */
    noMention?: boolean;

    /**
     * Async method that is invoked when this command is invoked by a user.
     * This receives a CommandContext that it can use to communicate.
     */
    handler(context: CommandContext): Promise<any>;
}

/**
 * Represents a command instance that additionally has the ability to register
 * and respond to discord slash commands.
 */
export interface SlashCapableCommand extends Command {
    /**
     * The "slash command" representation of this command, or null if
     * it cannot reasonably be represented as a command. All commands
     * are registered as a subcommand of orianna's top-level command.
     */
    asSlashCommand: (trans: Translator) => ApplicationCommandOption;

    /**
     * If `asSlashCommand` is implemented, this function allows for
     * parameters with the specified name to be converted to a string
     * value that is treated as if the function was invoked using a text
     * invocation.
     */
    convertSlashParameter: (key: string, value: any) => string;

    /**
     * Whether or not the invocation of the command should be shown
     * in the channel or not. If not set, defaults to showing the
     * invocation.
     */
    hideInvocation?: boolean;
}

export interface ResponseContext {
    /**
     * @see Response#ok
     */
    ok: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see Response#info
     */
    info: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see Response#error
     */
    error: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see Response#respond
     */
    respond: (opts: ResponseOptions) => Promise<Response>;

    /**
     * Sends a typing message to the gateway for the channel
     * where this context is set to respond to.
     */
    sendTyping: () => Promise<void>;

    /**
     * Waits for a message from the user that triggered the command. If
     * the user does not reply within `timeout`ms, undefined is returned instead.
     */
    listen: (timeout: number) => Promise<eris.Message | undefined>;

    /**
     * The appropriate translation instance for the language context in which
     * this response is located.
     */
    t: Translator;
}

export interface CommandContext extends ResponseContext {
    /**
     * A reference to the current context, used to make destructuring easier.
     */
    ctx: CommandContext;

    /**
     * The global discordclient instance.
     */
    client: DiscordClient;

    /**
     * The global Eris instance.
     */
    bot: eris.Client;

    /**
     * The server in which this message was sent. Null if the message was
     * sent in DMs (but not marked as such since it makes it harder to
     * work with in 99% of all cases).
     */
    guild: eris.Guild;

    /**
     * The user that created this message.
     */
    author: eris.User;

    /**
     * The original message that triggered the command.
     */
    msg: TriggerMessage;

    /**
     * The content of the message with all Orianna Bot mentions filtered out.
     */
    content: string;

    /**
     * A promise for the User instance of the sender of the command.
     */
    user: () => Promise<User>;

    /**
     * A promise for the Server instance if the message was sent in a server.
     */
    server: () => Promise<Server>;
}