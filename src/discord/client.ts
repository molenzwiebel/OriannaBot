import Eris = require("eris");
import debug = require("debug");
import { Configuration } from "../index";
import { DiscordServerModel, UserModel } from "../database";
import MessageHandler from "./message-handler";

import EvalCommand from "./commands/eval";

export default class DiscordClient {
    public readonly bot: Eris;
    public readonly log = debug("orianna:discord");
    private messageHandler: MessageHandler;

    constructor(public readonly config: Configuration) {
        this.bot = new Eris(config.discordToken);
        this.messageHandler = new MessageHandler(this);

        this.messageHandler.registerCommand(EvalCommand);
    }

    /**
     * Connects to Discord and adds the relevant event listeners.
     */
    async connect() {
        await this.bot.connect();
        this.bot.on("ready", () => {
            this.log("Connected as %s (%s)", this.bot.user.username, this.bot.user.id);
        });

        this.bot.on("userUpdate", this.onUserRename);
        this.bot.on("guildCreate", this.onGuildJoin);
        this.bot.on("guildDelete", this.onGuildLeave);
        this.bot.on("guildUpdate", this.onGuildRename);
        this.bot.on("guildRoleUpdate", this.onGuildRoleUpdate);
    }

    /**
     * Sends a message to the specified user informing them of how Orianna works.
     * Returns true if the user was already in the database, or if the message was sent successfully.
     * Returns false if the message could not be sent because of the user's privacy settings.
     */
    async registerUser(member: eris.Member, messageTitle: string, messageFirstLine: string): Promise<boolean> {
        let user = await UserModel.findBy({ snowflake: member.id });
        if (user) return true;

        user = new UserModel();
        user.snowflake = member.id;
        user.username = member.username;
        user.configCode = Math.random().toString(36).substring(2);
        user.lastUpdate = new Date(0);
        user.latestPoints = {};
        user.optedOutOfReminding = false;
        await user.save();

        const dmChannel = await this.bot.getDMChannel(member.id);

        try {
            await dmChannel.createMessage({
                embed: {
                    title: ":wave: " + messageTitle,
                    url: `${this.config.baseUrl}/#/player/${user.configCode}`,
                    color: 0x49bd1a,
                    description:
                    messageFirstLine + " If you register your League accounts with me, I will make sure that you receive appropriate roles in any Discord server that I am in. Since this is your first time using Orianna, you will need to add one or more League accounts. This is not required, but I will be able to assign you roles unless you add some :slight_smile:."
                    + "\nYour accounts are globally stored. Should you ever join another server where I'm active, I will automagically give you the appropriate roles."
                    + `\n\n:wrench: To add or edit the League accounts associated with you, visit this link: ${this.config.baseUrl}/#/player/${user.configCode}.`
                    + `\n:warning: **Anyone with this link can configure your accounts!** Do not share it unless you completely trust the receiver!`
                    + `\n\n:mag_right: If you ever lose this link, just mention me using \`@Orianna Bot, send me my edit link\` and I'll remind you.`
                    + `\n:book: I can also do some other things, such as showing leaderboards! Mention me and click the :question: to see all of my commands.`
                    + `\n\nIf you are unsure of how this works, or if you want to know more about me, check out the documentation! It is available online at ${this.config.baseUrl}/#/docs.`,
                    timestamp: new Date(),
                    footer: { text: member.username, icon_url: member.user.avatarURL },
                    thumbnail: { url: "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png" }
                }
            });

            return true;
        } catch (e) {
            // Failed to send the message.
            return false;
        }
    }

    /**
     * Fired when a user joins a server where Orianna is active. Makes sure that the user
     * is added to the database and sends a PM if neccessary.
     */
    private onGuildMemberJoin = async (guild: eris.Guild, member: eris.Member) => {
        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server || !server.setupCompleted) return;

        this.registerUser(member, "Welcome to " + guild.name + "!", `I'm Orianna, a bot that tracks champion mastery on Discord servers!`);
    };

    /**
     * Fired when Orianna is added to a server, messages the owner.
     */
    private onGuildJoin = async (guild: eris.Guild) => {
        // Add server to database.
        const server = new DiscordServerModel();
        server.snowflake = guild.id;
        server.configCode = Math.random().toString(36).substring(2);
        server.name = guild.name;
        server.championId = -1;
        server.announcePromotions = false;
        server.regionRoles = false;
        server.existingRoles = guild.roles.map(x => x.name);
        server.announceChannelSnowflake = "";
        server.setupCompleted = false;
        await server.save();

        this.log("Added to server '%s'. Config code is '%s'.", guild.name, server.configCode);

        const owner = guild.members.get(guild.ownerID)!;
        const dmChannel = await this.bot.getDMChannel(guild.ownerID);

        // If the owner is offline, most likely someone else added Orianna.
        // Send a message in the default channel to let them know the owner got instructions.
        if (owner.status === "offline") {
            await guild.defaultChannel.createMessage({
                embed: {
                    title: ":wave: Hi!",
                    description: "Thanks for adding me to your server! I've sent instructions to the owner of this server, but they seem to be offline at the moment. It might take a while before they are able to complete the setup.\n\n**Owner rarely online?** If the owner of your server is rarely online, you can contact my creator to take over the setup process. He's available under Discord name `molenzwiebel#2773`.",
                    color: 0x0a96de
                }
            });
        }

        // The '<bot username>' role needs to be the first one in the list.
        // If there is only a @everyone role at the moment, we can skip the initial
        // message that prompts the owner to drag roles. We do this by simply faking
        // a role edit event at which point the handler will continue the setup.
        if (guild.roles.map(x => x).length === 2) {
            return this.onGuildRoleUpdate(guild, guild.roles.find(x => x.name === this.bot.user.username)!);
        }

        await dmChannel.createMessage({
            embed: {
                title: ":wave: Hey, listen!",
                color: 0x0a96de,
                description: "Thanks for adding me to **" + server.name + "**! Before we can begin setup, I will need you to make sure that the `" + this.bot.user.username + "` role is topmost in your role list. This is needed because I can only manage roles lower than my own. To reorder roles, go to `Server Settings` -> `Roles` and drag the `" + this.bot.user.username + "` role to the top of the list (as shown in the image).",
                timestamp: new Date(),
                footer: { text: owner.username, icon_url: owner.user.avatarURL },
                image: { url: "http://i.imgur.com/LLcz73I.png" }
            }
        });
    };

    /**
     * Fired when Orianna is kicked from a server. Cleans up all database information.
     */
    private onGuildLeave = async (guild: eris.Guild) => {
        this.log("Kicked out of '%s'.", guild.name);

        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server) return;

        for (const role of server.roles) {
            await role.destroy();
        }

        await server.destroy();
    };

    /**
     * Fired when a role changes on the specified guild. This handler checks the role list
     * to see if '<bot name>' is currently the first role, and if so, starts the process.
     */
    private onGuildRoleUpdate = async (guild: eris.Guild, role: eris.Role) => {
        const server = await DiscordServerModel.findBy({ snowflake: guild.id });
        if (!server || server.setupCompleted) return;

        // Check if the modified role was ours and we are currently in first place.
        const roleLen = guild.roles.map(x => x).length;
        if (role.name !== this.bot.user.username || role.position !== roleLen - 1) return;

        this.log("Starting configuration flow on '%s'.", guild.name);

        // Inform owner of flow.
        const pm = await this.bot.getDMChannel(guild.ownerID);
        const owner = guild.members.get(guild.ownerID)!;

        await pm.createMessage({
            embed: {
                title: ":tada: Almost done!",
                url: `${this.config.baseUrl}/#/setup/${server.configCode}`,
                color: 0x49bd1a,
                description: `To complete the setup, please visit ${this.config.baseUrl}/#/setup/${server.configCode}.`
                + `\n:warning: **Anyone with this link can configure Orianna!** Do not share it unless you completely trust the receiver!`
                + `\n:question: Unsure of how this works? Check the documentation over at ${this.config.baseUrl}/#/docs.`,
                timestamp: new Date(),
                footer: { text: owner.username, icon_url: owner.user.avatarURL }
            }
        });
    };

    /**
     * Optionally renames the user in the database if their name changed.
     */
    private onUserRename = async (user: eris.User, old: { username: string }) => {
        if (user && old && user.username !== old.username) {
            this.log("User '%s' renamed to '%s'.", old.username, user.username);

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
            this.log("Server '%s' renamed to '%s'.", old.name, guild.name);

            const server = await DiscordServerModel.findBy({ snowflake: guild.id });
            if (server) {
                server.name = guild.name;
                await server.save();
            }
        }
    };
}