import * as eris from "eris";
import config from "../config";
import { Server, User } from "../database";
import { Translator } from "../i18n";
import { getCachedGuild } from "../redis";
import RiotAPI from "../riot/api";
import { Command, SlashCapableCommand } from "./command";
import randomstring = require("randomstring");
import AMQPClient from "../dissonance/amqp-client";
import { ResponseOptions } from "./response";
import { ResponseContext } from "./response-context";
import debug = require("debug");

const info = debug("orianna:discord");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

export default class DiscordClient {
    public readonly bot = new eris.Client(config.discord.token, {
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
        await this.amqpClient.connect();

        const user = this.bot.user = await this.bot.getSelf();
        info("Connected to discord as %s (%s)", user.username, user.id);

        await this.registerSlashCommands();

        this.amqpClient.on("messageCreate", this.handleMessage);
        this.amqpClient.on("messageUpdate", this.handleEdit);
        this.amqpClient.on("messageDelete", this.handleDelete);
        this.amqpClient.on("messageReactionAdd", this.handleReaction);
        this.amqpClient.on("interactionCreate", this.handleSlashCommandInvocation);

        // TODO this.bot.on("userUpdate", this.handleUserUpdate);
        // TODO this.bot.on("guildMemberAdd", this.handleGuildMemberAdd);
        // TODO? this.bot.on("presenceUpdate", this.handlePresenceUpdate);
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

    private handleMessage = async (msg: dissonance.Message) => {

    };
}