import * as eris from "eris";
import { ResponseOptions } from "./response";
import { User, Server } from "../database";
import Response from "./response";
import DiscordClient from "./client";

export interface Command {
    /**
     * The name of the command, as shown in the help.
     */
    name: string;

    /**
     * A small description of a few words about what this command does.
     * Used in the list of commands.
     */
    smallDescription: string;

    /**
     * A description of the command, as shown in the help. This description
     * can span multiple lines and use markdown.
     */
    description: string;

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
     * Async method that is invoked when this command is invoked by a user.
     * This receives a CommandContext that it can use to communicate.
     */
    handler(context: CommandContext): Promise<any>;
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
     * Waits for a message from the user that triggered the command. If
     * the user does not reply within `timeout`ms, undefined is returned instead.
     */
    listen: (timeout: number) => Promise<eris.Message | undefined>;
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
     * The channel in which the triggering message was sent. This
     * is either a DM or a guild text channel.
     */
    channel: eris.Textable;

    /**
     * `channel`, but automatically cast to TextChannel. This is for
     * convenience and may not always be a text channel.
     */
    guildChannel: eris.TextChannel;

    /**
     * `channel`, but automatically cast to PrivateChannel. This is for
     * convenience and may not always be a private channel.
     */
    privateChannel: eris.PrivateChannel;

    /**
     * The server in which this message was sent. Null if the message was
     * sent in DMs (but not marked as such since it makes it harder to
     * work with in 99% of all cases).
     */
    guild: eris.Guild;

    /**
     * The original message that triggered the command.
     */
    msg: eris.Message;

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