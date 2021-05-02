import * as eris from "eris";
import { Server, User } from "../database";
import { Translator } from "../i18n";
import DiscordClient from "./client";
import { Response, ResponseOptions } from "./response";
import { ResponseContext } from "./response-context";
import ApplicationCommandInteractionDataOption = dissonance.ApplicationCommandInteractionDataOption;

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
    asSlashCommand: (trans: Translator) => ApplicationCommandInteractionDataOption;

    /**
     * If `asSlashCommand` is implemented, this function allows for
     * parameters with the specified name to be converted to a string
     * value that is treated as if the function was invoked using a text
     * invocation.
     */
    convertSlashParameter: (key: string, value: any) => string;
}

/**
 * Represents all necessary information needed to respond to a command invoked.
 * Contains information on the message itself, as well as its author, and several
 * helper methods.
 */
export interface CommandContext {
    /**
     * Reference to ourselves.
     */
    ctx: CommandContext;

    /**
     * The main response context, suitable for doing more advanced responses.
     */
    responseContext: ResponseContext;

    /**
     * @see ResponseContext#ok
     */
    ok: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see ResponseContext#info
     */
    info: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see ResponseContext#error
     */
    error: (opts: ResponseOptions) => Promise<Response>;

    /**
     * @see ResponseContext#respond
     */
    respond: (opts: ResponseOptions) => Promise<Response>;

    /**
     * The appropriate translation instance for the language context in which
     * this response is located.
     */
    t: Translator;

    /**
     * The ID of the channel in which this command was invoked.
     */
    channelId: string;

    /**
     * The ID of the guild in which this command was triggered, or
     * null if it was not used in a guild.
     */
    guildId?: string;

    /**
     * The cached guild information for the guild in which this command
     * was executed. Null if this was not executed in a guild or if there
     * is no cached information for this guild (should be exceedingly rare).
     */
    guild?: dissonance.Guild;

    /**
     * The author of the message/slash-command that triggered this.
     */
    author: dissonance.User;

    /**
     * The content of the message, or the converted content if this was invoked
     * by a slash command.
     */
    content: string;

    /**
     * A list of members mentioned in the command invocation. All bots and the user
     * that invoked the command are not included in this.
     */
    mentions: dissonance.User[];

    /**
     * A promise for the User instance of the sender of the command.
     */
    user: () => Promise<User>;

    /**
     * A promise for the Server instance if the message was sent in a server.
     */
    server: () => Promise<Server>;

    /**
     * Discord client. Note that most of its properties are already exposed elsewhere.
     */
    client: DiscordClient;

    /**
     * The Eris instance. Should not be used unless actually needed, since Eris
     * will be in REST-only mode.
     */
    bot: eris.Client;
}