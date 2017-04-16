import Eris = require("eris");
import debug = require("debug");
import { Configuration } from "../index";
import { DiscordServer, DiscordServerModel, RoleModel, User, UserModel } from "../database";
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

        const code = await User.create(member);
        const dmChannel = await this.bot.getDMChannel(member.id);

        try {
            await dmChannel.createMessage({
                embed: {
                    title: ":wave: " + messageTitle,
                    url: `${this.config.baseUrl}/#/player/${code}`,
                    color: 0x49bd1a,
                    description:
                    messageFirstLine + " If you register your League accounts with me, I will make sure that you receive appropriate roles in any Discord server that I am in. Since this is your first time using Orianna, you will need to add one or more League accounts. This is not required, but I will be able to assign you roles unless you add some :slight_smile:."
                    + "\nYour accounts are globally stored. Should you ever join another server where I'm active, I will automagically give you the appropriate roles."
                    + `\n\n:wrench: To add or edit the League accounts associated with you, visit this link: ${this.config.baseUrl}/#/player/${code}.`
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
     * Completes the Discord side of the server setup process. Creates the neccessary roles,
     * and messages all members. After that notifies the owner of the edit link and some general
     * things.
     */
    async finalizeServerSetup(server: DiscordServer) {
        this.log("Finalizing server setup for '%s'.", server.name);

        const guild = this.bot.guilds.get(server.snowflake);
        if (!guild) return;

        const owner = guild.members.get(guild.ownerID)!;
        const ownerName = owner.nick || owner.username;
        const ownerUser = await UserModel.findBy({ snowflake: guild.ownerID });
        const ownerConfigCode = ownerUser ? ownerUser.configCode : (await User.create(owner));

        // Message members.
        let failed = 0;
        await Promise.all(guild.members.map(async member => {
            if (member.bot) return;
            if (member.id === owner.id) return;

            if (!await this.registerUser(member, "Nice to meet you!", `Hi! I'm Orianna, a bot that tracks champion mastery on Discord servers! **${ownerName}** just added me to **${guild.name}**.`)) {
                failed++;
            }
        }));

        // Message owner.
        const dmChannel = await this.bot.getDMChannel(owner.id);
        await dmChannel.createMessage({
            embed: {
                title: ":tada: Done!",
                url: `${this.config.baseUrl}/#/configure/${server.configCode}`,
                color: 0x49bd1a,
                description: `Setup is completed! I will assign roles to anyone that already has accounts linked, and I sent a message to everyone not yet familiar with me.${failed > 0 ? ` I couldn't deliver instructions to ${failed} members, because they have their DMs set to private.` : ""}`
                + ` It is recommended that you make an announcement or similar in your server, to explain how Orianna works${failed > 0 ? ` and to inform anyone that couldn't receive the DM` : ""}. Otherwise, some people might interpret the message as spam.`
                + `\n\nThe previously sent setup URL is now invalid. If you want to change some settings, you can do so via this URL: ${this.config.baseUrl}/#/configure/${server.configCode}. Should you ever lose this URL, I can remind you. Just ask me via \`@Orianna Bot, send me the server config url\`.`
                + `\n\nYou can configure your own accounts if you haven't already done so at ${this.config.baseUrl}/#/player/${ownerConfigCode}. I can also remind you of this one, just use \`@Orianna Bot, send me my edit url\`.`,
                timestamp: new Date(),
                footer: { text: owner.username, icon_url: owner.user.avatarURL }
            }
        });

        await this.setupDiscordRoles(server);
    }

    /**
     * Fired when a user joins a server where Orianna is active. Makes sure that the user
     * is added to the database and sends a PM if neccessary.
     */
    private onGuildMemberJoin = async (guild: eris.Guild, member: eris.Member) => {
        if (member.bot) return;

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

    /**
     * Adds the discord roles for the specified server. This will remove and re-add existing
     * roles that are to be overwritten. This also creates region roles if neccessary.
     */
    private async setupDiscordRoles(server: DiscordServer) {
        const managedRoleNames = (server.regionRoles ? this.config.regions : []).concat(server.roles.map(x => x.name)).reverse();
        const guild = this.bot.guilds.get(server.snowflake);
        if (!guild) return;

        for (const roleName of managedRoleNames) {
            const existing = guild.roles.find(x => x.name === roleName);

            let settings;
            if (existing) {
                // Delete old role, save settings.
                settings = { name: roleName, color: existing.color, hoist: existing.hoist, permissions: existing.permissions.allow, mentionable: existing.mentionable };
                this.log("Deleting existing role '%s'.", roleName);
                await this.bot.deleteRole(guild.id, existing.id);
            } else {
                settings = { name: roleName, mentionable: true };
            }

            const role = await this.bot.createRole(guild.id, settings);
            this.log("Added role '%s' with snowflake %s.", roleName, role.id);

            // Save to database if needed.
            const dbRole = await RoleModel.findBy({ owner: server.id, name: roleName });
            if (dbRole) {
                dbRole.snowflake = role.id;
                await dbRole.save();
            }
        }
    }
}