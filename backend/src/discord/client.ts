import * as eris from "eris"
import debug = require("debug");
import config from "../config";
import randomstring = require("randomstring");
import { Command, ResponseContext } from "./command";
import Response, { ResponseOptions } from "./response";
import { Server, User, BlacklistedChannel, UserAuthKey } from "../database";
import Updater from "./updater";
import RiotAPI from "../riot/api";
import PuppeteerController from "../puppeteer";
import { randomBytes } from "crypto";
import elastic from "../elastic";

const info = debug("orianna:discord");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

export default class DiscordClient {
    public readonly bot = new eris.Client(config.discord.token);
    public readonly updater = new Updater(this, this.riotAPI);
    private commands: Command[] = [];
    private responses: Response[] = [];

    constructor(public readonly riotAPI: RiotAPI, public readonly puppeteer: PuppeteerController) {}

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
        this.bot.on("messageUpdate", this.handleEdit);
        this.bot.on("messageReactionAdd", this.handleReaction);
        this.bot.on("messageDelete", this.handleDelete);
        this.bot.on("guildUpdate", this.handleGuildUpdate);
        this.bot.on("userUpdate", this.handleUserUpdate);
        this.bot.on("guildMemberAdd", this.handleGuildMemberAdd);
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
            completed_intro: false
        });
    }

    /**
     * Finds or creates a new User instance for the specified Discord snowflake.
     */
    public async findOrCreateUser(id: string, discordUser?: { username: string, avatar?: string }): Promise<User> {
        let user = await User.query().where("snowflake", "=", id).first();
        if (user) return user;

        discordUser = discordUser || this.bot.users.get(id);
        if (!discordUser) throw new Error("No common server shared with server " + id);

        user = await User.query().insertAndFetch({
            snowflake: id,
            username: discordUser.username,
            avatar: discordUser.avatar || "none",
            token: randomstring.generate({
                length: 16,
                readable: true
            })
        });

        const key = await UserAuthKey.query().insertAndFetch({
            user_id: user.id,
            created_at: "2100-01-01 10:10:10", // have this one never expire, just for a bit more user friendliness
            key: randomBytes(21).toString("base64").replace(/\//g, "-")
        });
        const link = config.web.url + "/login/" + key.key;

        // Try send them a message since this is the first time we met them.
        await this.notify(id, {
            title: "👋 Hey " + discordUser.username + "!",
            url: link,
            color: 0x49bd1a,
            description: `Since you just used a command of mine for the first time, I figured I'd introduce myself. I'm **Orianna Bot**, and I'm a pretty cool bot that keeps track of League accounts, mostly for the purpose of showing cool stats and assigning Discord roles.`
            + `\n\nIf you'd like me to track you and give you all the roles you deserve, you can add your League account using the [online configuration panel](${link}). You can also import your League accounts from Discord and the Reddit [ChampionMains Flairs](https://flairs.championmains.com) system.`
            + `\n\nTo get started, click the link below!\n${link}`
            + `\n\nConfused, intrigued, angry, happy? Check out all my available commands using \`@Orianna Bot help\` and contact my creator using \`@Orianna Bot about\`.`,
            timestamp: new Date().getTime(),
            thumbnail: "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png",
            footer: "Orianna Bot v2"
        });

        return user;
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
            await this.createResponse(dm, user).respond(embed);
        } catch (e) {
            // Do nothing.
        }
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
                    description: "**Description**\n" + cmd.description,
                    fields: [{
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
        const isDM = msg.channel instanceof eris.PrivateChannel;
        const hasMention = msg.mentions.map(x => x.id).includes(this.bot.user.id);

        // Don't respond to ourselves.
        if (msg.author.id === this.bot.user.id) return;

        // Clean content.
        const content = msg.content
            .replace(new RegExp(`<@!?${this.bot.user.id}>`, "g"), "")
            .replace(/\s+/g, " ").trim();
        msg.mentions = msg.mentions.filter(x => x.id !== this.bot.user.id);
        const words = content.toLowerCase().split(" ");

        // Find a command that is matched.
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
            }

            // Eris never deletes cached messages, even though we don't need them.
            // Remove the message immediately so we don't run out of memory eventually.
            msg.channel.messages.delete(msg.id);

            return;
        }

        // If this matched command requires a mention, but we have none, abort.
        if (!isDM && !hasMention && matchedCommand.noMention !== true) return;

        info("[%s] [%s] %s", msg.author.username, matchedCommand.name, content);
        await elastic.logCommand(matchedCommand.name, msg);

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

        // Send typing during computing time, unless disabled for this specific command.
        if (!matchedCommand.noTyping) await targetChannel.sendTyping();

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

        const transaction = elastic.startCommandTransaction(matchedCommand.name);
        try {
            const obj = isDM ? {
                ...template,
                guildChannel: <any>null,
                privateChannel: <eris.PrivateChannel>msg.channel,
                guild: <any>null,
                server: () => Promise.reject("Message was not sent in a server.")
            } : {
                ...template,
                guildChannel: <eris.TextChannel>msg.channel,
                privateChannel: <any>null,
                guild: (<eris.TextChannel>msg.channel).guild,
                server: () => this.findOrCreateServer((<eris.TextChannel>msg.channel).guild.id)
            };
            obj.ctx = obj;

            await matchedCommand.handler(obj);
            if (transaction) transaction.result = 200;
        } catch (e) {
            // Send a message to the user and log the error.
            error("Error during execution of '%s' by '%s' in '%s': %s'", matchedCommand.name, msg.author.id, msg.channel.id, e.message);
            error(e.stack);
            error("%O", e);

            // Report to elastic, if enabled.
            const incident = await elastic.reportError(e);
            if (transaction) transaction.result = 404;

            await template.error({
                title: "💥 Ouch!",
                description:
                    "Something went horribly wrong executing that command. Try again in a bit, or contact my creator (`@Orianna Bot about`)"
                    + (incident ? " and give him the following code: `" + incident + "`." : "."),
                image: "https://i.imgur.com/SBpi54R.png"
            });
        } finally {
            if (transaction) transaction.end();
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
     * Handles message editing. Simulates the old message getting removed, following
     * by a new message getting sent.
     */
    private handleEdit = async (msg: eris.Message, oldMsg?: any) => {
        if (!oldMsg) return;
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
     * Ensures that a user receives their appropriate roles when they join a server while
     * already having accounts set up.
     */
    private handleGuildMemberAdd = async (guild: eris.Guild, member: eris.Member) => {
        // Don't use findOrCreateUser since it will message the user.
        const user = await User.query().where("snowflake", "=", member.id).first();
        if (!user) return;

        // Only update, do not fetch new data for the user.
        // This should assign new roles, if appropriate.
        this.updater.updateUser(user);
    };

    /**
     * Utility method to create a new response and add it to the list of emitted responses.
     */
    private createResponse(channel: eris.Textable, user: eris.User, msg?: eris.Message) {
        const resp = new Response(this.bot, user, channel, msg);

        this.responses.push(resp);

        // Have responses expire after a set time to prevent them from
        // indefinitely taking up resources.
        setTimeout(() => {
            const idx = this.responses.indexOf(resp);

            if (idx !== -1) {
                resp.removeAllOptions();
                this.responses.splice(idx, 1);
            }

            if (msg) {
                // Remove the message from our local cache too.
                msg.channel.messages.delete(msg.id);
            }
        }, 30 * 60 * 1000); // expire after 30 mins

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