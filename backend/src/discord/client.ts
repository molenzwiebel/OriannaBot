import * as eris from "eris";
import config from "../config";
import RiotAPI from "../riot/api";
import { Command, SlashCapableCommand } from "./command";
import Response from "./response";
import AMQPClient from "../dissonance/amqp-client";
import debug = require("debug");

const info = debug("orianna:discord");
const error = debug("orianna:discord:error");

const HELP_REACTION = "❓";
const HELP_INDEX_REACTION = "🔖";
const MUTE_REACTION = "🔇";

export default class DiscordClient {
    public readonly bot = new eris.Client(config.discord.token, {
        rest: {
            https: false,
            domain: config.discord.proxyHost,
            baseURL: "/api/v8/"
        },
        restMode: true
    });
    public readonly commands: Command[] = [];

    private commandsBySlashPath = new Map<string, SlashCapableCommand>();
    private responses: Response[] = [];
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

        const user = await this.bot.getSelf();
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

    private handleMessage = async (msg: dissonance.Message) => {

    };
}