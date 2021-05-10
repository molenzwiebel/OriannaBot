import * as eris from "eris";
import fetch from "node-fetch";
import config from "../config";
import { BlacklistedChannel, Role, Server, User } from "../database";
import AMQPClient from "../dissonance/amqp-client";
import generatePromotionGraphic from "../graphics/promotion";
import getTranslator, { Translator } from "../i18n";
import { getCachedGuild } from "../redis";
import * as ipc from "../cluster/master-ipc";
import RiotAPI from "../riot/api";
import formatName from "../util/format-name";
import { Command, CommandContext, SlashCapableCommand } from "./command";
import { emote } from "./commands/util";
import { ResponseOptions } from "./response";
import { ChannelResponseContext, InteractionResponseContext, ResponseContext } from "./response-context";
import {
    applicationCommandToNames,
    commandInvocationFindParams,
    commandInvocationParamsToName
} from "./slash-commands";
import debug = require("debug");
import randomstring = require("randomstring");
import ChannelType = dissonance.ChannelType;
import GuildMemberAddEvent = dissonance.GuildMemberAddEvent;

const info = debug("orianna:discord");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

interface InvocationContext {
    content: string;
    mentions: dissonance.User[];
    author: dissonance.User;
    responseContext: ResponseContext;
    channelId: string;
    guildId?: string;
}

export default class DiscordClient {
    public readonly bot = new eris.Client("Bot " + config.discord.token, {
        // rest: {
        //     https: false,
        //     domain: config.discord.proxyHost,
        //     baseURL: "/api/v8/"
        // },
        restMode: true
    });
    public readonly commands: Command[] = [];

    private commandsBySlashPath = new Map<string, SlashCapableCommand>();
    private amqpClient = new AMQPClient();
    private pendingInvocations = new Map<string, InvocationContext>();

    private responseContexts = new Set<ResponseContext>();
    private responseContextsByMessageID = new Map<string, ResponseContext>();
    private aliveHelpReactions = new Set<string>();

    constructor(public readonly riotAPI: RiotAPI) {
    }

    /**
     * Adds a new command to this DiscordClient instance.
     */
    registerCommand(cmd: Command) {
        this.commands.push(cmd);
    }

    /**
     * Initially connects to discord and attaches listeners.
     */
    async connect() {
        this.amqpClient.connect();

        const user = this.bot.user = await this.bot.getSelf();
        info("Connected to discord as %s (%s)", user.username, user.id);

        this.registerSlashCommands();

        this.amqpClient.on("messageCreate", this.handleMessage);
        this.amqpClient.on("messageUpdate", this.handleMessageEdit);
        this.amqpClient.on("messageDelete", ev => this.handleMessageDelete(ev.id));
        this.amqpClient.on("messageReactionAdd", this.handleMessageReaction);
        this.amqpClient.on("interactionCreate", this.handleInteraction);
        this.amqpClient.on("guildMemberAdd", this.handleGuildMemberAdd);

        // Fire off an emote request so we pull the information from redis.
        emote("Missing_Champion");
    }

    /**
     * Finds or creates a new Server instance for the specified Discord snowflake.
     */
    public async findOrCreateServer(id: string): Promise<Server> {
        const server = await Server.query().where("snowflake", "=", id).first();
        if (server) return server;

        const guild = await getCachedGuild(id);
        if (!guild) throw new Error("Not a member of server " + id);

        return Server.query().insertAndFetch({
            snowflake: guild.id,
            name: guild.name,
            avatar: guild.icon || "none",
            announcement_channel: null,
            default_champion: null,
            completed_intro: false,
            engagement_json: JSON.stringify({ type: "on_command" })
        });
    }

    /**
     * Finds or creates a new User instance for the specified Discord snowflake.
     */
    public async findOrCreateUser(id: string, discordUser: { username: string, avatar?: string | null }): Promise<User> {
        const user = await User.query().where("snowflake", id).first();
        if (user) return user;

        return User.query().insertAndFetch({
            snowflake: id,
            username: discordUser.username,
            avatar: discordUser.avatar || "none",
            token: randomstring.generate({
                length: 16,
                readable: true
            })
        });
    }

    /**
     * Displays an interactive list of all commands in the specified channel.
     */
    public async displayHelp(t: Translator, responseContext: ResponseContext) {
        const commands = this.commands.filter(x => !x.hideFromHelp);
        const index: ResponseOptions = {
            color: 0x0a96de,
            title: t.command_help_title,
            description: t.command_help_description,
            fields: commands.map((x, i) => ({
                name: (i + 1) + " - " + x.name,
                value: <string>t[x.smallDescriptionKey]
            }))
        };

        const resp = await responseContext.createResponse(index);
        await resp.option(HELP_INDEX_REACTION, () => resp.info(index));

        for (const cmd of commands) {
            let description = t.command_help_command_description({ description: <string>t[cmd.descriptionKey] });
            const fields = [{
                name: t.command_help_command_keywords,
                value: cmd.keywords.map(x => "`" + x + "`").join(", ")
            }];

            // If the description doesn't fit in a single field, split
            // it on paragraphs and put half in a separate field.
            if (description.length > 2000) {
                const parts = description.split("\n\n");
                const first = parts.slice(0, parts.length / 2).join("\n\n");
                const second = parts.slice(parts.length / 2).join("\n\n");

                description = first;
                fields.unshift({
                    name: "\u200b",
                    value: second
                });
            }

            await resp.option(decodeURIComponent((commands.indexOf(cmd) + 1) + "%E2%83%A3"), () => {
                resp.info({
                    title: t.command_help_command_title({ name: cmd.name }),
                    description,
                    fields
                });
            });
        }

        await resp.option("🗑", () => {
            resp.remove();
        });
    }

    /**
     * Invoked when a new message is created. Constructs the necessary contextual requirements
     * for the message, then forwards it to the command handling logic.
     */
    private handleMessage = async (msg: dissonance.Message) => {
        // In the background, update the the user information for this user.
        if (msg.author && msg.author.id) {
            User
                .query()
                .where("snowflake", msg.author.id)
                .update({
                    username: msg.author.username,
                    avatar: msg.author.avatar || "none"
                })
                .execute().catch(() => {
            });
        }

        const didHandle = await this.tryMatchAndExecuteCommand({
            content: msg.content,
            mentions: msg.mentions || [],
            author: msg.author,
            responseContext: new ChannelResponseContext(msg.channel_id, msg.author, this.bot, msg.id),
            channelId: msg.channel_id,
            guildId: msg.guild_id || undefined
        }, {
            fromMute: false,
            messageId: msg.id
        });

        // If we didn't execute the command, add a help reaction.
        if (!didHandle) {
            await this.bot.addMessageReaction(msg.channel_id, msg.id, HELP_REACTION);
            this.aliveHelpReactions.add(msg.id);

            // Expire the help after 15 minutes.
            setTimeout(() => {
                this.aliveHelpReactions.delete(msg.id);
                this.bot.removeMessageReaction(msg.channel_id, msg.id, HELP_REACTION).catch(() => {});
            }, 15 * 60 * 1000);
        }
    };

    /**
     * Invoked when a message is edited. We treat this the same as if the user
     * had deleted their old message and just created a new one.
     */
    private handleMessageEdit = async (msg: dissonance.Message) => {
        if (!msg.author || !msg.content || !msg.channel_id) return; // we can receive a partial message
        this.handleMessageDelete(msg.id);
        this.handleMessage(msg);
    };

    /**
     * Invoked when a message is deleted. Handles the cascading deletion of all
     * messages replied to in the context associated with the triggering ID.
     */
    private handleMessageDelete = async (id: string) => {
        const ctx = this.responseContextsByMessageID.get(id);
        if (ctx) ctx.deleteResponses();
    };

    /**
     * Invoked when an interaction (a slash command) is used by a user. Attempts
     * to match the invoked command to a concrete command, then converts the
     * arguments into a text string and handles the same command logic.
     */
    private handleInteraction = async (ev: dissonance.InteractionCreateEvent) => {
        const user = ev.user || ev.member!.user;

        const commandName = commandInvocationParamsToName(ev.data);
        const matchingCommand = this.commandsBySlashPath.get(commandName);
        if (!matchingCommand) { // ???, should never happen unless discord fucks up
            error("No matching command for username %s and data: %s", commandName, JSON.stringify(ev, null, 4));
            error("Commands registered: %O", [...this.commandsBySlashPath.keys()]);
            return;
        }

        // Convert params to a string command with equivalent meaning.
        const params = commandInvocationFindParams(ev.data);
        const content = matchingCommand.keywords[0] + " " + params.map(x => matchingCommand.convertSlashParameter!(x.name, x.value)).filter(x => x).join(" ");

        info("%s (%s) used slash-command %s: %s", user.username, user.id, matchingCommand.name, content);

        await this.doExecuteCommand(matchingCommand, {
            content,
            mentions: [...Object.values(ev.data?.resolved?.users ?? {})],
            author: user,
            responseContext: new InteractionResponseContext(ev.channel_id!, user, this.bot, ev.id, ev.token),
            channelId: ev.channel_id!,
            guildId: ev.guild_id || undefined
        });
    };

    /**
     * Invoked when a new reaction is added to any message. Attempts to handle question
     * and mute messages, then forwards the event to all currently active response contexts.
     */
    private handleMessageReaction = async (ev: dissonance.ReactionAddEvent) => {
        if (ev.user_id === this.bot.user.id) return;

        // Check if this was a mute.
        if (ev.emoji.name === MUTE_REACTION && this.pendingInvocations.has(ev.message_id)) {
            const invocationContext = this.pendingInvocations.get(ev.message_id)!;
            const privateChannel = await this.bot.getDMChannel(ev.user_id);
            invocationContext.responseContext = new ChannelResponseContext(privateChannel.id, invocationContext.author, this.bot, ev.message_id);

            this.pendingInvocations.delete(ev.message_id);

            this.tryMatchAndExecuteCommand(invocationContext, {
                messageId: ev.message_id,
                fromMute: true
            });
            return;
        }

        // Check if this was a help request.
        if (ev.emoji.name === HELP_REACTION && this.aliveHelpReactions.has(ev.message_id)) {
            const ctx = new ChannelResponseContext(ev.channel_id, null, this.bot, ev.message_id);
            this.trackResponseContext(ctx, ev.message_id);

            this.displayHelp(
                await this.getTranslatorForUser(ev.user_id, ev.guild_id || undefined),
                ctx
            );
            return;
        }

        // If this was in a server, we need to check for engagement.
        if (ev.guild_id && (ev.emoji as any).id) {
            const emojiName = ev.emoji.name + ":" + (ev.emoji as any).id;

            const match = await Server
                .query()
                .where("snowflake", ev.guild_id)
                .whereRaw(`engagement_json->'type' = '"on_react"'`)
                .whereRaw(`engagement_json->'channel' = ?`, JSON.stringify(ev.channel_id))
                .whereRaw(`engagement_json->'emote' = ?`, JSON.stringify(emojiName))
                .first();

            if (match) {
                await this.bot.removeMessageReaction(ev.channel_id, ev.message_id, emojiName, ev.user_id);

                if (!ev.member?.user) {
                    return; // nothing we can do, but should never happen
                }

                this.engageUser(ev.member?.user, match);
                return;
            }
        }

        for (const aliveContext of this.responseContexts) {
            aliveContext.processReactionEvent(ev);
        }
    };

    /**
     * Ensures that a user receives their appropriate roles when they join a server while
     * already having accounts set up.
     */
    private handleGuildMemberAdd = async ({ user, guild_id }: GuildMemberAddEvent) => {
        // Ignore bots. We can't assign them roles anyway.
        if (user.bot) return;

        // Don't use findOrCreateUser since it will message the user.
        const oriUser = await User.query().where("snowflake", "=", user.id).first();
        const server = await this.findOrCreateServer(guild_id);

        // If we engage on join and the user doesn't have an account yet, engage now.
        if (server.engagement.type === "on_join" && !oriUser) {
            this.engageUser(user, server);
        }

        // Else, do nothing.
        if (!oriUser) return;

        // This should assign new roles, if appropriate.
        ipc.fetchAndUpdateUser(user.id);
    };

    /**
     * Execute the command given the specified options. `mentions` should
     * still contain the Orianna mention (for mention checking). Returns
     * false if we understand that the command was meant for us, but couldn't
     * find a matching command to execute. Else, returns true.
     */
    private async tryMatchAndExecuteCommand(invocationContext: InvocationContext, muteContext?: {
        fromMute: boolean;
        messageId: string;
    }): Promise<boolean> {
        const {
            content,
            mentions = [],
            author,
            guildId
        } = invocationContext;

        const isDM = !guildId;
        const hasMention = mentions.some(x => x.id === this.bot.user.id);

        // Don't respond to ourselves or other bots.
        if (author.id === this.bot.user.id || author.bot) return true;

        // Find a command that is matched.
        const words = content.toLowerCase().split(" ");
        const matchedCommand = this.commands.find(command => {
            return command.keywords.some(x => words.includes(x));
        });

        // If we didn't find a command, add a question mark.
        // We need to readd to the messages collection so we get a full
        // Message object instead of an uncached one in the reaction handler.
        if (!matchedCommand) {
            if (isDM) return false;
            if (hasMention) return false;

            return true;
        }

        // If this matched command requires a mention, but we have none, abort.
        if (!isDM && !hasMention && matchedCommand.noMention !== true) return true;

        // Alright, we now have a command that satisfies all requirements, so we can
        // start the process of executing it.
        await this.doExecuteCommand(matchedCommand, invocationContext, muteContext);
        return true;
    }

    /**
     * Given a matched command and an invocation context, attempts to execute the
     * given command with the data in the given context. This will ensure that the
     * channel is not muted and handle any errors caused by the execution.
     */
    private async doExecuteCommand(matchedCommand: Command, invocationContext: InvocationContext, muteContext?: {
        fromMute: boolean;
        messageId: string;
    }): Promise<void> {
        const {
            content,
            mentions = [],
            author,
            responseContext,
            channelId,
            guildId
        } = invocationContext;
        const isDM = !guildId;

        info("[%s] [%s] %s", author.username, matchedCommand.name, content);

        // Check if this is the first time that this user has used an orianna command.
        // If in a server and yes, check if engagement should apply (only on commands
        // that are not no-mention, such as the nadeko/etc bot compat commands).
        if (!isDM && matchedCommand.noMention !== true) {
            const server = await this.findOrCreateServer(guildId!);
            const user = await User.query().where("snowflake", author.id).first();

            // If on command and no user, engage.
            if (server.engagement.type === "on_command" && !user) {
                this.engageUser(author, server);
            }
        }

        // If this is in a server, we need to check if the channel is blacklisted.
        if (!isDM && muteContext && !muteContext.fromMute) {
            const server = await this.findOrCreateServer(guildId!);

            // Find the first instance where snowflake = channel_snowflake. If it exists, we abort.
            if (await server.$relatedQuery<BlacklistedChannel>("blacklisted_channels").where("snowflake", "=", channelId).first()) {
                // If this server is muted and this is a command not triggered by a mention, just do not do anything.
                if (matchedCommand.noMention) return;

                if (muteContext.messageId) {
                    await this.bot.addMessageReaction(channelId, muteContext.messageId, MUTE_REACTION, "@me");
                    this.pendingInvocations.set(muteContext.messageId, invocationContext);
                }

                return;
            }
        }

        // Send typing during computing time, unless disabled for this specific command.
        await responseContext.acknowledgeReceival();
        if (!matchedCommand.noTyping) await responseContext.indicateProgress();

        const context: CommandContext = {
            ctx: null as any,
            responseContext,
            ok: responseContext.ok,
            info: responseContext.info,
            error: responseContext.error,
            respond: opts => responseContext.createResponse(opts),
            t: await this.getTranslatorForUser(author.id, guildId),
            channelId,
            guildId,
            guild: guildId ? (await getCachedGuild(guildId)) || undefined : undefined,
            author,
            content,
            mentions: mentions.filter(x => !x.bot),
            client: this,
            user: () => this.findOrCreateUser(author.id, author),
            server: () => this.findOrCreateServer(guildId!),
            bot: this.bot
        };
        context.ctx = context;

        this.trackResponseContext(context.responseContext, muteContext?.messageId);

        try {
            await matchedCommand.handler(context);
        } catch (e) {
            const t = await this.getTranslatorForUser(context.author.id, context.guild?.id);

            // Send a message to the user and log the error.
            error("Error during execution of '%s' by '%s' in '%s': %s'", matchedCommand.name, context.author.id, channelId, e.message);
            error(e.stack);
            error("%O", e);

            await context.error({
                title: t.command_error_title,
                description: t.command_error_description,
                image: "https://i.imgur.com/SBpi54R.png"
            });
        }
    }

    /**
     * Introduces Orianna to the user. Note that this function does not check if the user
     * has previously done any introductions. The server parameter is used to dynamically
     * select which message to use.
     */
    private async engageUser(discordUser: dissonance.User, server: Server) {
        const t = getTranslator(server.language); // use the language of the server

        const user = await this.findOrCreateUser(discordUser.id, {
            username: discordUser.username,
            avatar: discordUser.avatar
        });
        const link = await user.generateInfiniteLoginToken();

        const intro =
            server.engagement.type === "on_command" ? t.first_use_intro_on_command
                : server.engagement.type === "on_join" ? t.first_use_intro_on_join({ server: server.name })
                : t.first_use_intro_on_react({ server: server.name });

        await this.notify(discordUser, {
            title: t.first_use_title({ username: discordUser.username }),
            url: link,
            color: 0x49bd1a,
            description: t.first_use_message({ intro, link }),
            timestamp: new Date().getTime(),
            thumbnail: "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png",
            footer: "Orianna Bot"
        });
    }

    /**
     * Sends the specified message to the user with the specified ID, unless
     * we do not share a server with them (in which case we silently fail). This
     * should be used to notify users of things that don't necessarily need interaction.
     */
    public async notify(user: dissonance.User | string, embed: ResponseOptions) {
        try {
            const id = typeof user === "string" ? user : user.id;

            const dm = await this.bot.getDMChannel(id);
            const ctx = new ChannelResponseContext(dm.id, typeof user === "string" ? null : user, this.bot);
            await ctx.createResponse(embed);
        } catch (e) {
            // Do nothing.
        }
    }

    /**
     * Registers the given response context such that any reactions and message deletions
     * are forwarded to the context.
     */
    private trackResponseContext(ctx: ResponseContext, triggeringMessageId?: string) {
        // Store response context and expire it after 15 minutes.
        this.responseContexts.add(ctx);
        setTimeout(() => {
            ctx.freeResponses();
            if (triggeringMessageId) this.responseContextsByMessageID.delete(triggeringMessageId);
            this.responseContexts.delete(ctx);
        }, 15 * 60 * 1000);

        if (triggeringMessageId) {
            this.responseContextsByMessageID.set(triggeringMessageId, ctx);
        }
    }

    /**
     * Returns the relevant translator for the specified user, possibly in the specified guild.
     * Precedence is user language > guild language > en-US.
     */
    private async getTranslatorForUser(userID: string, guildID?: string): Promise<Translator> {
        // Figure out the language for response.
        let language = "en-US";

        // If not in a DM, default to the server language.
        if (guildID) {
            const server = await this.findOrCreateServer(guildID);
            language = server.language;
        }

        // If a user exists, override the language with their preferred language.
        const user = await User.query().where("snowflake", userID).first();
        if (user && user.language) language = user.language;

        return getTranslator(language);
    }

    /**
     * Registers all slash commands globally based on the current configuration.
     */
    private async registerSlashCommands() {
        const toplevelCommand: any = {
            name: "ori",
            description: "All things Orianna Bot!",
            options: []
        };

        // TODO: register per server so we can respect translation?
        for (const command of this.commands) {
            const cmd = <SlashCapableCommand> command;

            if (cmd.asSlashCommand) {
                const asSlash = cmd.asSlashCommand(getTranslator("en-US"));

                for (const name of applicationCommandToNames(asSlash)) {
                    this.commandsBySlashPath.set("ori." + name, cmd);
                }

                toplevelCommand.options.push(asSlash);
            }
        }

        await fetch(`https://discord.com/api/v9/applications/${this.bot.user.id}/commands`, {
            method: "POST",
            headers: {
                Authorization: this.bot.token!,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(toplevelCommand)
        });
    }

    /**
     * Announces promotion for the specified user and the specified role on the
     * specified guild, if enabled.
     */
    public async announcePromotion(user: User, role: Role, guildId: string) {
        const guild = await getCachedGuild(guildId);
        if (!guild) return;

        // Find announcement channel ID.
        const server = await Server.query().where("id", role.server_id).first();
        if (!server) return;

        const announceChannelId = server.announcement_channel;
        if (!announceChannelId) return;

        // Ensure that that channel exists.
        const announceChannel = guild.channels.find(x => x.id === announceChannelId);
        if (!announceChannel || announceChannel.type !== ChannelType.GUILD_TEXT) return;

        // Get a translator. Note that we ignore the users preferred language here.
        const t = getTranslator(server.language);

        // Figure out what images to show for the promotion.
        const champion = role.findChampionFor(user);

        // Enqueue rendering of the gif.
        const image = await generatePromotionGraphic({
            name: user.username,
            title: role.name,
            icon: user.avatarURL,
            champion: champion ? await t.staticData.getChampionIcon(champion) : undefined,
            background: champion ? await t.staticData.getRandomCenteredSplash(champion) : undefined
        });

        // Send image!
        this.bot.createMessage(announceChannel.id, {
            embed: {
                color: 0x49bd1a,
                timestamp: new Date().toISOString(),
                image: { url: "attachment://promotion.gif" },
                author: {
                    name: t.promotion_title({ username: formatName(user, true), role: role.name }),
                    icon_url: user.avatarURL
                }
            }
        }, { file: image, name: "promotion.gif" }).catch(() => { /* We don't care. */
        });
    }
}