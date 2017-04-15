import Eris = require("eris");
import debug = require("debug");
import { Configuration } from "../index";
import { DiscordServerModel, UserModel } from "../database";

export default class DiscordClient {
    public readonly bot: Eris;
    public readonly log = debug("orianna:discord");

    constructor(public readonly config: Configuration) {
        this.bot = new Eris(config.discordToken);
    }

    /**
     * Connects to Discord and adds the relevant event listeners.
     */
    async connect() {
        await this.bot.connect();

        this.bot.on("userUpdate", this.onUserRename);
        this.bot.on("guildUpdate", this.onGuildRename);
    }

    /**
     * Optionally renames the user in the database if their name changed.
     */
    private onUserRename = async (user: eris.User, old: { username: string }) => {
        if (user && old && user.username !== old.username) {
            this.log("User %s renamed to %s.", old.username, user.username);

            const u = await UserModel.findBy({ snowflake: user.id });
            if (u) {
                u.username = user.username;
                await u.save();
            }
        }
    };

    /**
     * Optionally renames the guild in the database if their name changed.
     */
    private onGuildRename = async (guild: eris.Guild, old: { name: string }) => {
        if (guild.name !== old.name) {
            this.log("Server %s renamed to %s.", old.name, guild.name);

            const server = await DiscordServerModel.findBy({ snowflake: guild.id });
            if (server) {
                server.name = guild.name;
                await server.save();
            }
        }
    };
}