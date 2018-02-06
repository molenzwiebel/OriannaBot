import * as eris from "eris"
import debug = require("debug");
import config from "../config";
import randomstring = require("randomstring");
import { Command, ResponseContext } from "./command";
import Response, { ResponseOptions } from "./response";
import { Server, User, BlacklistedChannel } from "../database";
import { EmbedOptions } from "eris";

const info = debug("orianna:discord");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

export default class DiscordClient {
    private bot = new eris.Client(config.discord.token);
    private commands: Command[] = [];
    private responses: Response[] = [];

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
        });

        this.bot.on("messageCreate", this.handleMessage);
        this.bot.on("messageReactionAdd", this.handleReaction);
        this.bot.on("messageDelete", this.handleDelete);
    }

    /**
     * Finds or creates a new Server instance for the specified Discord snowflake.
     */
    public async findOrCreateServer(id: string): Promise<Server> {
        const server = await Server.query().where("snowflake", "=", id).first();
        if (server) return server;

        const guild = this.bot.guilds.get(id);
        if (!guild) throw new Error("No common server shared with server " + id);

        return Server.query().insert({
            snowflake: guild.id,
            name: guild.name,
            avatar: guild.icon || "none",
            announcement_channel: null,
            default_champion: null
        });
    }

    /**
     * Finds or creates a new User instance for the specified Discord snowflake.
     */
    public async findOrCreateUser(id: string): Promise<User> {
        const user = await User.query().where("snowflake", "=", id).first();
        if (user) return user;

        const discordUser = this.bot.users.get(id);
        if (!discordUser) throw new Error("No common server shared with server " + id);

        return User.query().insert({
            snowflake: discordUser.id,
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
    public async displayHelp(channel: eris.Textable, user: eris.User, trigger: eris.Message) {
        const commands = this.commands.filter(x => !x.hideFromHelp);
        const index: ResponseOptions = {
            color: 0x0a96de,
            title: ":bookmark: Orianna Help",
            description: "I try to determine what you mean when you mention me using specific keywords. Here is a simple list of commands that I understand. Click the corresponding number for more information and examples about the commmand. Click :bookmark: to show this index.",
            fields: commands.map((x, i) => ({ name: (i + 1) + " - " + x.name, value: x.smallDescription }))
        };

        const resp = await this.createResponse(channel, user, trigger).respond(index);
        await resp.option(HELP_INDEX_REACTION, () => resp.info(index));

        for (const cmd of commands) {
            await resp.option(decodeURIComponent((commands.indexOf(cmd) + 1) + "%E2%83%A3"), () => {
                resp.info({
                    title: ":bookmark: Help for " + cmd.name,
                    fields: [{
                        name: "Description",
                        value: cmd.description
                    }, {
                        name: "Keywords",
                        value: cmd.keywords.map(x => "`" + x + "`").join(", ")
                    }]
                });
            });
        }

        await resp.option("🗑", () => {
            resp.remove();
        });
    }

    /**
     * Called by eris when a new message is received. Responsible for dispatching the message
     * to the user.
     */
    private handleMessage = async (msg: eris.Message, fromMute = false) => {
        // Eris never deletes cached messages, even though we don't need them.
        // Remove the message immediately so we don't run out of memory eventually.
        msg.channel.messages.delete(msg.id);

        const isDM = msg.channel instanceof eris.PrivateChannel;
        const hasMention = msg.mentions.map(x => x.id).includes(this.bot.user.id);

        // Don't respond to ourselves.
        if (msg.author.id === this.bot.user.id) return;

        // We don't require mentions in DMs, we do anywhere else.
        if (!isDM && !hasMention) return;

        // Clean content.
        const content = msg.content
            .replace(new RegExp(`<@!?${this.bot.user.id}>`, "g"), "")
            .replace(/\s+/g, " ").trim();
        const words = content.toLowerCase().split(" ");

        // Find a command that is matched.
        const matchedCommand = this.commands.find(command => {
            return command.keywords.some(x => words.includes(x));
        });

        // If we didn't find a command, add a question mark.
        // We need to readd to the messages collection so we get a full
        // Message object instead of an uncached one in the reaction handler.
        if (!matchedCommand) {
            await msg.addReaction(HELP_REACTION, "@me");
            msg.channel.messages.add(msg);
            return;
        }

        info("[%s] [%s] %s", msg.author.username, matchedCommand.name, content);

        // If this is in a server, we need to check if the channel is blacklisted.
        if (!isDM && !fromMute) {
            const server = await this.findOrCreateServer((<eris.TextChannel>msg.channel).guild.id);

            // Find the first instance where snowflake = channel_snowflake. If it exists, we abort.
            if (await server.$relatedQuery<BlacklistedChannel>("blacklisted_channels").where("snowflake", "=", msg.channel.id).first()) {
                await msg.addReaction(MUTE_REACTION, "@me");
                msg.channel.messages.add(msg);
                return;
            }
        }

        // If we are responding to a muted command, respond in the DMs. Else, respond in the same channel.
        const targetChannel = fromMute ? await this.bot.getDMChannel(msg.author.id) : msg.channel;
        const responseContext = this.createResponseContext(targetChannel, msg.author, msg);

        // Send typing during computing time.
        await targetChannel.sendTyping();

        // Do things a bit differently depending on if the message was sent in a server or not.
        const template = {
            ...responseContext,
            client: this,
            bot: this.bot,
            channel: msg.channel,
            msg,
            content,
            user: () => this.findOrCreateUser(msg.author.id),
            ctx: <any>null
        };
        template.ctx = template;

        const commandPromise = isDM ? matchedCommand.handler({
            ...template,
            guildChannel: <any>null,
            privateChannel: <eris.PrivateChannel>msg.channel,
            guild: <any>null,
            server: () => Promise.reject("Message was not sent in a server.")
        }) : matchedCommand.handler({
            ...template,
            guildChannel: <eris.TextChannel>msg.channel,
            privateChannel: <any>null,
            guild: (<eris.TextChannel>msg.channel).guild,
            server: () => this.findOrCreateServer((<eris.TextChannel>msg.channel).guild.id)
        });

        try {
            await commandPromise;
        } catch (e) {
            // Send a message to the user and log the error.
            error("Error during execution of '%s' by '%s' in '%s': %s'", matchedCommand.name, msg.author.id, msg.channel.id, e.message);
            error(e.stack);
            error("%O", e);

            await template.error({
                title: "💥 Ouch!",
                description: "Something went horribly wrong executing that command. Try again in a bit, or contact my creator (`@Orianna Bot about`).",
                image: "https://i.imgur.com/SBpi54R.png"
            });
        }
    };

    /**
     * Handles a new reaction added to a message by a user. Responsible
     * for dispatching to responses and for handling mute/help reacts.
     */
    private handleReaction = async (msg: eris.Message, emoji: eris.Emoji, userID: string) => {
        msg = await this.bot.getMessage(msg.channel.id, msg.id);
        this.responses.forEach(x => x.onReactionAdd(msg, emoji, userID));

        if ([HELP_REACTION, MUTE_REACTION].includes(emoji.name) && userID === msg.author.id) {
            const reacts = await msg.getReaction(emoji.name);
            if (!reacts.some(x => x.id === this.bot.user.id)) return;

            if (emoji.name === MUTE_REACTION) {
                const dms = await this.bot.getDMChannel(msg.author.id);
                await dms.createMessage("I don't have permissions to talk in <#" + msg.channel.id + ">, but I can still secretly perform your command. Here's what you requested:");

                this.handleMessage(msg, true);
            } else {
                this.displayHelp(msg.channel, msg.author, msg);
            }
        }
    };

    /**
     * Handles the deletion of a message. Simply delegates it to all responses.
     */
    private handleDelete = async (msg: eris.PossiblyUncachedMessage) => {
        this.responses.forEach(x => x.onMessageDelete(msg));
    };

    /**
     * Utility method to create a new response and add it to the list of emitted responses.
     */
    private createResponse(channel: eris.Textable, user: eris.User, msg?: eris.Message) {
        const resp = new Response(this.bot, user, channel, msg);
        this.responses.push(resp);
        return resp;
    }

    /**
     * Creates a new ResponseContext for the specified user and channel, and optionally the trigger message.
     */
    public createResponseContext(channel: eris.Textable, user: eris.User, msg?: eris.Message): ResponseContext {
        return {
            ok: embed => this.createResponse(channel, user, msg).respond({ color: 0x49bd1a, ...embed }),
            info: embed => this.createResponse(channel, user, msg).respond({ color: 0x0a96de, ...embed }),
            error: embed => this.createResponse(channel, user, msg).respond({ color: 0xfd5c5c, ...embed }),
            respond: embed => this.createResponse(channel, user, msg).respond(embed),
            listen: (timeout = 30000) => {
                return Promise.race<eris.Message, undefined>([new Promise(resolve => {
                    const fn = (msg: eris.Message) => {
                        if (msg.channel !== channel) return;
                        if (msg.author.id !== user.id) return;

                        resolve(msg);
                        this.bot.removeListener("messageCreate", fn);
                    };

                    this.bot.on("messageCreate", fn);
                }), new Promise(resolve => setTimeout(() => resolve(undefined), timeout))]);
            }
        };
    }
}