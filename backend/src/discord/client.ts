import DBL from "topgg-autoposter";
import * as eris from "eris"
import { Commit, getLastCommit } from "git-last-commit";
import * as ipc from "../cluster/master-ipc";
import config from "../config";
import { BlacklistedChannel, Role, Server, User } from "../database";
import elastic from "../elastic";
import generatePromotionGraphic from "../graphics/promotion";
import getTranslator, { Translator } from "../i18n";
import RiotAPI from "../riot/api";
import fetch from "node-fetch";
import formatName from "../util/format-name";
import { Command, CommandContext, ResponseContext, SlashCapableCommand } from "./command";
import Response, { ResponseOptions, TriggerMessage } from "./response";
import {
    applicationCommandToNames, commandInvocationFindParams,
    commandInvocationParamsToName,
    SlashCommandDescription,
    SlashCommandInvocationData
} from "./slash-commands";
import debug = require("debug");
import randomstring = require("randomstring");

const info = debug("orianna:discord");
const presenceInfo = debug("orianna:discord:presence");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

const LOL_APPLICATION_ID = "401518684763586560";

const STATUSES: [eris.BotActivityType, string][] = [
    [0, "on-hit Orianna"],
    [0, "with the Ball"],
    [2, "time ticking away"],
    [3, "my enemies shiver"],
    [3, "you"],
    [3, "Piltovan theater"],
    [2, "Running in the 90s"],
    [0, "with Stopwatch"],
    [3, "imaqtpie"],
    [2, "them scream"],
    [3, "what makes them tick"],
    [0, "Command: Attack"],
    [0, "Command: Dissonance"],
    [0, "Command: Protect"],
    [0, "Command: Shockwave"]
];

export default class DiscordClient {
    public readonly bot = new eris.Client(config.discord.token, {
        maxShards: "auto",
        intents: [
            "guilds",
            "guildMembers",
            "guildPresences",
            "guildMessages",
            "guildMessageReactions",
            "directMessages",
            "directMessageReactions"
        ]
    });
    public readonly commands: Command[] = [];
    private commandsBySlashPath = new Map<string, SlashCapableCommand>();
    private responses: Response[] = [];
    private statusIndex = 0;
    private presenceTimeouts = new Map<string, number>();

    constructor(public readonly riotAPI: RiotAPI) {
        if (config.dblToken) {
            const dbl = DBL(config.dblToken, this.bot);

            dbl.on("posted", () => {
                info("DBL statistics successfully posted.");
            });
        }
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
        await this.bot.connect();

        this.bot.on("ready", () => {
            info("Connected to discord as %s (%s)", this.bot.user.username, this.bot.user.id);
            this.registerSlashCommands();
        });

        this.bot.on("messageCreate", this.handleMessage);
        this.bot.on("messageUpdate", this.handleEdit);
        this.bot.on("messageReactionAdd", this.handleReaction);
        this.bot.on("messageDelete", this.handleDelete);
        this.bot.on("guildUpdate", this.handleGuildUpdate);
        this.bot.on("userUpdate", this.handleUserUpdate);
        this.bot.on("guildMemberAdd", this.handleGuildMemberAdd);
        this.bot.on("presenceUpdate", this.handlePresenceUpdate);

        this.bot.on("unknown", async (packet, id) => {
            if (packet.t === "INTERACTION_CREATE") {
                const d = <any> packet.d;
                await this.handleSlashCommandInvocation(d);
            }
        });

        this.bot.on("error", e => {
            info("Eris encountered error, attempting to reconnect: %O", e);
        });

        const commit = await new Promise<Commit>((res, rej) => getLastCommit((e, r) => e ? rej(e) : res(r)));
        const formatStatus = (stat: string) => {
            const suffix = `Version ${commit.shortHash} - ${commit.subject}`;
            return stat + " \n" + Array(126 - stat.length - suffix.length).join("\u3000") + suffix;
        };

        // Cycle game playing statuses.
        setInterval(() => {
            this.statusIndex = (this.statusIndex + 1) % STATUSES.length;

            this.bot.editStatus("online", {
                type: STATUSES[this.statusIndex][0],
                name: formatStatus(STATUSES[this.statusIndex][1])
            });
        }, 10 * 60 * 1000); // cycle every 10 mins

        this.bot.editStatus("online", {
            name: formatStatus(STATUSES[0][1]),
            type: STATUSES[0][0]
        });
    }

    /**
     * Finds or creates a new Server instance for the specified Discord snowflake.
     */
    public async findOrCreateServer(id: string): Promise<Server> {
        const server = await Server.query().where("snowflake", "=", id).first();
        if (server) return server;

        const guild = this.bot.guilds.get(id);
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
    public async findOrCreateUser(id: string, discordUser?: { username: string, avatar?: string | null }): Promise<User> {
        let user = await User.query().where("snowflake", "=", id).first();
        if (user) return user;

        discordUser = discordUser || this.bot.users.get(id);
        if (!discordUser) throw new Error("No common server shared with server " + id);

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
     * Sends the specified message to the user with the specified ID, unless
     * we do not share a server with them (in which case we silently fail). This
     * should be used to notify users of things that don't neccessarily need interaction.
     */
    public async notify(id: string, embed: ResponseOptions) {
        try {
            if (!this.bot.users.has(id)) return;

            const user = this.bot.users.get(id)!;
            const dm = await this.bot.getDMChannel(id);
            await this.createResponse(dm.id, user).respond(embed);
        } catch (e) {
            // Do nothing.
        }
    }

    /**
     * Displays an interactive list of all commands in the specified channel.
     */
    public async displayHelp(t: Translator, channelID: string, user: eris.User, trigger: TriggerMessage) {
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

        const resp = await this.createResponse(channelID, user, trigger).respond(index);
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
     * Creates a new ResponseContext for the specified user and channel, and optionally the trigger message.
     */
    public createResponseContext(t: Translator, channelID: string, user: eris.User, msg?: TriggerMessage): ResponseContext {
        return {
            ok: embed => this.createResponse(channelID, user, msg).respond({ color: 0x49bd1a, ...embed }),
            info: embed => this.createResponse(channelID, user, msg).respond({ color: 0x0a96de, ...embed }),
            error: embed => this.createResponse(channelID, user, msg).respond({ color: 0xfd5c5c, ...embed }),
            respond: embed => this.createResponse(channelID, user, msg).respond(embed),
            listen: (timeout = 30000) => {
                return Promise.race([new Promise<eris.Message>(resolve => {
                    const fn = (msg: eris.Message) => {
                        if (msg.channel.id !== channelID) return;
                        if (msg.author.id !== user.id) return;

                        resolve(msg);
                        this.bot.removeListener("messageCreate", fn);
                    };

                    this.bot.on("messageCreate", fn);
                }), new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), timeout))]);
            },
            sendTyping: () => this.bot.sendChannelTyping(channelID),
            t
        };
    }

    /**
     * Announces promotion for the specified user and the specified role on the
     * specified guild, if enabled.
     */
    public async announcePromotion(user: User, role: Role, guildId: string) {
        const guild = this.bot.guilds.get(guildId);
        if (!guild) return;

        // Find announcement channel ID.
        const server = await Server.query().where("id", role.server_id).first();
        if (!server) return;

        const announceChannelId = server.announcement_channel;
        if (!announceChannelId) return;

        // Ensure that that channel exists.
        const announceChannel = guild.channels.get(announceChannelId);
        if (!announceChannel || !(announceChannel instanceof eris.TextChannel)) return;

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
        announceChannel.createMessage({
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

    /**
     * Called by eris when a new message is received. Responsible for dispatching the message
     * to the user.
     */
    private handleMessage = async (msg: eris.Message, fromMute = false) => {
        const isDM = msg.channel instanceof eris.PrivateChannel;
        const hasMention = msg.mentions.map(x => x.id).includes(this.bot.user.id);

        // Don't respond to ourselves or other bots.
        if (msg.author.id === this.bot.user.id || msg.author.bot) return;

        // Find a command that is matched.
        const words = msg.content.toLowerCase().split(" ");
        const matchedCommand = this.commands.find(command => {
            return command.keywords.some(x => words.includes(x));
        });

        // If we didn't find a command, add a question mark.
        // We need to readd to the messages collection so we get a full
        // Message object instead of an uncached one in the reaction handler.
        if (!matchedCommand) {
            if (isDM || hasMention) {
                await msg.addReaction(HELP_REACTION, "@me");
                msg.channel.messages.add(msg);
                return;
            }

            // Eris never deletes cached messages, even though we don't need them.
            // Remove the message immediately so we don't run out of memory eventually.
            msg.channel.messages.delete(msg.id);

            return;
        }

        // If this matched command requires a mention, but we have none, abort.
        if (!isDM && !hasMention && matchedCommand.noMention !== true) return;

        info("[%s] [%s] %s", msg.author.username, matchedCommand.name, msg.content);
        await elastic.logCommand(matchedCommand.name, msg);

        const targetChannel = fromMute ? await this.bot.getDMChannel(msg.author.id) : msg.channel;

        const responseCtx = await this.createCommandContext({
            userID: msg.author.id,
            message: {
                content: msg.content,
                channelID: msg.channel.id,
                id: msg.id,
                mentions: this.parseMentions(msg.content)
            },
            guildID: msg.guildID,
            respondInChannelID: targetChannel.id
        });

        // Execute the command.
        await this.executeCommandWithContext(matchedCommand, responseCtx, fromMute);
    };

    /**
     * Handles a new reaction added to a message by a user. Responsible
     * for dispatching to responses and for handling mute/help reacts.
     */
    private handleReaction = async (msg: eris.Message, emoji: eris.Emoji, { id: userID }: { id: string }) => {
        try {
            msg = await this.bot.getMessage(msg.channel.id, msg.id);
        } catch {
            return; // message was deleted or otherwise errored
        }

        this.responses.forEach(x => x.onReactionAdd(msg, emoji, userID));

        // Find the translation context for this message.
        const inServer = !!(<eris.TextChannel>msg.channel).guild;
        const t = await this.getTranslatorForUser(msg.author.id, inServer ? (<eris.TextChannel>msg.channel).guild.id : void 0);

        if ([HELP_REACTION, MUTE_REACTION].includes(emoji.name) && userID === msg.author.id) {
            const reacts = await msg.getReaction(emoji.name);
            if (!reacts.some(x => x.id === this.bot.user.id)) return;

            if (emoji.name === MUTE_REACTION) {
                try {
                    const dms = await this.bot.getDMChannel(msg.author.id);
                    await dms.createMessage(t.command_muted_preamble({ channel: `<#${msg.channel.id}>` }));

                    this.handleMessage(msg, true);
                } catch (e) {
                    // We don't have permissions to message the user. They're most likely set to private.
                }
            } else {
                this.displayHelp(t, msg.channel.id, msg.author, {
                    content: msg.content,
                    channelID: msg.channel.id,
                    id: msg.id,
                    mentions: []
                });
            }
        }

        // If this react was in a server, check if we should engage.
        if (inServer) {
            const server = await this.findOrCreateServer((<eris.TextChannel>msg.channel).guild.id);
            const engagement = server.engagement;
            if (engagement.type !== "on_react") return;
            if (msg.channel.id !== engagement.channel) return;
            if (!engagement.emote.includes(":")) return;

            const [name, id] = engagement.emote.split(":");
            if (emoji.name !== name || emoji.id !== id) return;

            // Everything checks out. Delete the react and engage.
            await msg.removeReaction(emoji.name + ":" + emoji.id, userID);

            // Always engage if from an invite, regardless of whether or not the user is already registered.
            const user = this.bot.users.get(userID);
            if (!user) return;

            this.engageUser(user, server);
        }
    };

    /**
     * Handles message editing. Simulates the old message getting removed, following
     * by a new message getting sent.
     */
    private handleEdit = async (msg: eris.Message, oldMsg?: any) => {
        if (!oldMsg || !msg.author) return; // message can potentially be uncached, so check for author property
        if (msg.author.id === this.bot.user.id) return;

        await this.handleDelete(msg);
        await this.handleMessage(msg);
    };

    /**
     * Handles the deletion of a message. Simply delegates it to all responses.
     */
    private handleDelete = async (msg: eris.PossiblyUncachedMessage) => {
        this.responses = this.responses.filter(x => !x.onMessageDelete(msg));
    };

    /**
     * Updates the database representation of the guild when it changes settings.
     */
    private handleGuildUpdate = async (guild: eris.Guild, old: eris.GuildOptions) => {
        await Server
            .query()
            .where("snowflake", guild.id)
            .update({
                name: guild.name,
                avatar: guild.icon || "none"
            })
            .execute();
    };

    /**
     * Updates the database representation of the user when it changes settings.
     */
    private handleUserUpdate = async (user: eris.User) => {
        await User
            .query()
            .where("snowflake", user.id)
            .update({
                username: user.username,
                avatar: user.avatar || "none"
            })
            .execute();
    };

    /**
     * Potentially queues an update for the specified user if their discord presence
     * has just gone from Rich Presence Ingame to out of game.
     */
    private handlePresenceUpdate = async (other: eris.Member | eris.Relationship, oldPresence?: eris.Presence) => {
        // If there was no old game, or if the old game was not League, abort.
        if (
            !oldPresence                                                        // no old presence cached
            || !oldPresence.game                                                // not playing a game
            || (<any>oldPresence.game).application_id !== LOL_APPLICATION_ID    // the old game wasn't league
            || !(<any>oldPresence.game).assets                                  // the league game didn't have assets
            || !(<any>oldPresence.game).assets.large_text                       // the league presence didn't have the name of a champion
            || !(<any>oldPresence.game).timestamps                              // the league presence didn't have timestamps
            || !(<any>oldPresence.game).timestamps.start                        // the league presence didn't have a start timestamp.
        ) return;

        // The user got out of game if:
        // - They used to have league as a presence, and don't have league now.
        // - Or: They used to have ingame with a specific champion, and are just in a lobby now.
        const newPresenceIsLeague = other.game && (<any>other.game).application_id === LOL_APPLICATION_ID;
        const noLongerIngame = newPresenceIsLeague && (<any>other.game).assets && !(<any>other.game).assets.large_text;

        // If the new presence isn't league, or if we're no longer in game, check if we should update this user.
        if (!newPresenceIsLeague || noLongerIngame) {
            // If they were in game for less than 15 minutes, it is probably a false alarm and we should ignore it.
            const timeIngame = Date.now() - (<any>oldPresence.game).timestamps.start;
            const timeInSec = timeIngame / 1000;
            if (timeInSec < 900) return;

            // If this user has no accounts, abort as well.
            const user = await User.query().where("snowflake", other.id).eager("accounts").first();
            if (!user || !user.accounts!.length) return;

            // If we've recently processed something from this user, abort.
            if (this.presenceTimeouts.has(user.snowflake) && Date.now() < this.presenceTimeouts.get(user.snowflake)!) return;

            presenceInfo(
                "User %s (%s) got out of a League game according to their presence, queueing an update. They were ingame for %im%is",
                user.username,
                user.snowflake,
                Math.floor(timeInSec / 60),
                timeInSec % 60
            );

            // Ensure that we rate limit this user. Process another update in 10 minutes.
            this.presenceTimeouts.set(user.snowflake, Date.now() + 1000 * 60 * 10);

            // Artifically modify the last update timestamps of this user to ensure that they
            // get included in the next cycle.
            await user.$query().patch({
                // Set the last update timestamp to a day ago. Should be enough to guarantee inclusion.
                last_score_update_timestamp: "" + (Date.now() - 1000 * 60 * 60 * 24),
                last_rank_update_timestamp: "" + (Date.now() - 1000 * 60 * 60 * 24)
            });
        }
    };

    /**
     * Ensures that a user receives their appropriate roles when they join a server while
     * already having accounts set up.
     */
    private handleGuildMemberAdd = async (guild: eris.Guild, member: eris.Member) => {
        // Ignore bots. We can't assign them roles anyway.
        if (member.bot) return;

        // Don't use findOrCreateUser since it will message the user.
        const user = await User.query().where("snowflake", "=", member.id).first();
        const server = await this.findOrCreateServer(guild.id);

        // If we engage on join and the user doesn't have an account yet, engage now.
        if (server.engagement.type === "on_join" && !user) {
            this.engageUser(member.user, server);
        }

        // Else, do nothing.
        if (!user) return;

        // This should assign new roles, if appropriate.
        ipc.fetchAndUpdateUser(user);
    };

    /**
     * Dispatches the given command with the specified context. Ensures that engagements
     * are triggered appropriately and that the command is ignored if commands are muted
     * in that channel.
     */
    private async executeCommandWithContext(command: Command, context: CommandContext, fromMute = false) {
        const isDM = context.guild == null;

        // Check if this is the first time that this user has used an orianna command.
        // If in a server and yes, check if engagement should apply (only on commands
        // that are not no-mention, such as the nadeko/etc bot compat commands).
        if (!isDM && command.noMention !== true) {
            const server = await this.findOrCreateServer(context.guild.id);
            const user = await User.query().where("snowflake", context.author.id).first();

            // If on command and no user, engage.
            if (server.engagement.type === "on_command" && !user) {
                this.engageUser(context.author, server);
            }
        }

        // If this is in a server, we need to check if the channel is blacklisted.
        if (!isDM && !fromMute) {
            const server = await this.findOrCreateServer(context.guild.id);

            // Find the first instance where snowflake = channel_snowflake. If it exists, we abort.
            if (await server.$relatedQuery<BlacklistedChannel>("blacklisted_channels").where("snowflake", "=", context.msg.channelID).first()) {
                // If this server is muted and this is a command not triggered by a mention, just do not do anything.
                if (command.noMention) return;

                if (context.msg.id) {
                    await this.bot.addMessageReaction(context.msg.channelID, context.msg.id, MUTE_REACTION, "@me");
                }

                return;
            }
        }

        // Send typing during computing time, unless disabled for this specific command.
        if (!command.noTyping) await context.sendTyping();

        const transaction = elastic.startCommandTransaction(command.name);
        try {
            await command.handler(context);
            if (transaction) transaction.result = 200;
        } catch (e) {
            const t = await this.getTranslatorForUser(context.author.id, context.guild?.id);

            // Send a message to the user and log the error.
            error("Error during execution of '%s' by '%s' in '%s': %s'", command.name, context.author.id, context.msg.channelID, e.message);
            error(e.stack);
            error("%O", e);

            // Report to elastic, if enabled.
            await elastic.reportError(e, "command handler");
            if (transaction) transaction.result = 404;

            await context.error({
                title: t.command_error_title,
                description: t.command_error_description,
                image: "https://i.imgur.com/SBpi54R.png"
            });
        } finally {
            if (transaction) transaction.end();
        }
    }

    /**
     * Creates a new command context from the specified parameters.
     */
    private async createCommandContext(options: {
        userID: string,
        message: TriggerMessage,
        respondInChannelID: string,
        guildID?: string,
    }): Promise<CommandContext> {
        // Create a translation instance for this message.
        const t = await this.getTranslatorForUser(options.userID, options.guildID);

        // Fetch data from cache.
        // TODO: review this, stuff may not be in cache?
        const user = this.bot.users.get(options.userID)!;
        const guild = options.guildID ? this.bot.guilds.get(options.guildID) : undefined;

        // If we are responding to a muted command, respond in the DMs. Else, respond in the same channel.
        const responseContext = this.createResponseContext(t, options.respondInChannelID, user, options.message);

        // Do things a bit differently depending on if the message was sent in a server or not.
        const template = {
            ...responseContext,
            client: this,
            bot: this.bot,
            msg: options.message,
            content: options.message.content,
            author: user,
            user: () => this.findOrCreateUser(options.userID),
            ctx: <any>null
        };

        const obj = !guild ? {
            ...template,
            guild: <any>null,
            server: () => Promise.reject("Message was not sent in a server.")
        } : {
            ...template,
            guild,
            server: () => this.findOrCreateServer(options.guildID!)
        };
        obj.ctx = obj

        return obj;
    }

    /**
     * Utility method to create a new response and add it to the list of emitted responses.
     */
    private createResponse(channelID: string, user: eris.User, msg?: TriggerMessage) {
        const resp = new Response(this.bot, user, channelID, msg);

        this.responses.push(resp);

        // Have responses expire after a set time to prevent them from
        // indefinitely taking up resources.
        setTimeout(() => {
            const idx = this.responses.indexOf(resp);

            if (idx !== -1) {
                resp.removeAllOptions();
                this.responses.splice(idx, 1);
            }
        }, 30 * 60 * 1000); // expire after 30 mins

        return resp;
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
     * Introduces Orianna to the user. Note that this function does not check if the user
     * has previously done any introductions. The server parameter is used to dynamically
     * select which message to use.
     */
    private async engageUser(discordUser: eris.User, server: Server) {
        const t = getTranslator(server.language); // use the language of the server

        const user = await this.findOrCreateUser(discordUser.id, discordUser);
        const link = await user.generateInfiniteLoginToken();

        const intro =
            server.engagement.type === "on_command" ? t.first_use_intro_on_command
                : server.engagement.type === "on_join" ? t.first_use_intro_on_join({ server: server.name })
                : t.first_use_intro_on_react({ server: server.name });

        await this.notify(discordUser.id, {
            title: t.first_use_title({ username: discordUser.username }),
            url: link,
            color: 0x49bd1a,
            description: t.first_use_message({ intro, link }),
            timestamp: new Date().getTime(),
            thumbnail: "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png",
            footer: "Orianna Bot v2"
        });
    }

    /**
     * Handles a slash command invocation received from the gateway.
     */
    private async handleSlashCommandInvocation(data: SlashCommandInvocationData) {
        const commandName = commandInvocationParamsToName(data.data)
        const matchingCommand = this.commandsBySlashPath.get(commandName);
        if (!matchingCommand) { // ???, should never happen unless discord fucks up
            error("No matching command for name %s and data: %s", commandName, JSON.stringify(data, null, 4));
            error("Commands registered: %O", [...this.commandsBySlashPath.keys()]);
            return;
        }

        // Acknowledge with either an empty message or nothing, depending on command settings.
        await fetch(`https://discord.com/api/v8/interactions/${data.id}/${data.token}/callback`, {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
                type: matchingCommand.hideInvocation ? 2 : 5
            })
        });

        // Convert params to a string command with equivalent meaning.
        const params = commandInvocationFindParams(data.data);
        const content = matchingCommand.keywords[0] + " " + params.map(x => matchingCommand.convertSlashParameter!(x.name, x.value)).filter(x => x).join(" ");

        info("%s (%s) used slash-command %s: %s", data.member.user.username, data.member.user.id, matchingCommand.name, content);

        const responseCtx = await this.createCommandContext({
            userID: data.member.user.id,
            message: {
                content: content,
                channelID: data.channel_id,
                mentions: this.parseMentions(content)
            },
            guildID: data.guild_id,
            respondInChannelID: data.channel_id
        });

        // Execute the command.
        await this.executeCommandWithContext(matchingCommand, responseCtx);
    }

    /**
     * Attempts to parse all user mentions from the specified content and
     * returns a list of users. Will also parse raw IDs and names that do
     * not contain mentions.
     */
    private parseMentions(content: string): eris.User[] {
        let mentions = (content.match(/<@!?[0-9]+>/g) || []).map(mention => {
            const [, id] = /\d+/.exec(mention)!;
            return this.bot.users.get(id);
        }).filter((x): x is eris.User => !!x);

        // Don't include ourselves.
        mentions = mentions.filter(x => x.id !== this.bot.user.id);

        // Treat any ID inside the content as mentions as well.
        content.replace(/\d{16,}/g, (match) => {
            const user = this.bot.users.get(match);
            if (user && !mentions.find(x => x.id === user.id)) mentions.push(user);
            return "";
        });

        // AAA#0000 mentions are a bit more effort since a command like `@Ori top Some User#1234` is ambiguous between
        // "Some User#1234", "User#1234" and even "top Some User#1234". We use a hacky solution by instead relying on finding
        // all users with the discriminator, then find the user whose name is contained inside the message, preferring longer
        // matches over shorter ones (User#1234 > er#1234)
        content.replace(/\b(.*)#(\d{4})\b/g, (_, username, discrim) => {
            const usersWithDiscrim = this.bot.users.filter(x => x.discriminator === discrim);

            const bestUser = usersWithDiscrim.reduce<eris.User | null>((prev, cur) => {
                // If the username of this user is not in the query, continue.
                if (!username.includes(cur.username)) return prev;

                // If this is the first match, just return it.
                if (!prev) return cur;

                return prev.username.length >= cur.username.length ? prev : cur;
            }, null);

            if (bestUser && !mentions.find(x => x.id === bestUser.id)) mentions.push(bestUser);
            return "";
        });

        return mentions.filter(x => x.id !== this.bot.user.id && !x.bot);
    }

    /**
     * Registers all slash commands globally based on the current configuration.
     */
    private async registerSlashCommands() {
        const toplevelCommand: SlashCommandDescription = {
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

        await fetch(`https://discord.com/api/v8/applications/${this.bot.user.id}/commands`, {
            method: "POST",
            headers: {
                Authorization: this.bot.token!,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(toplevelCommand)
        });
    }
}