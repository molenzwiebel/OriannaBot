import express = require("express");
import * as eris from "eris";
import randomstring = require("randomstring");
import Joi = require("joi");
import { Server, User, BlacklistedChannel, Role, RoleCondition, LeagueAccount } from "../database";
import { requireAuth, swallowErrors } from "./decorators";
import { REGIONS } from "../riot/api";
import DiscordClient from "../discord/client";
import config from "../config";

export default class WebAPIClient {
    private bot: eris.Client;
    private summoners: Map<string, riot.Summoner & { region: string }> = new Map();

    constructor(private client: DiscordClient, private app: express.Application) {
        this.bot = client.bot;

        app.get("/api/v1/commands", swallowErrors(this.serveCommands));

        app.get("/api/v1/user", swallowErrors(this.serveUserProfile));
        app.patch("/api/v1/user", swallowErrors(this.patchUserProfile));
        app.post("/api/v1/summoner", swallowErrors(this.lookupSummoner));
        app.post("/api/v1/user/accounts", swallowErrors(this.addUserAccount));
        app.delete("/api/v1/user/accounts", swallowErrors(this.deleteUserAccount));

        app.get("/api/v1/server/:id", swallowErrors(this.serveServer));
        app.patch("/api/v1/server/:id", swallowErrors(this.patchServer));

        app.post("/api/v1/server/:id/blacklisted_channels", swallowErrors(this.addBlacklistedChannel));
        app.delete("/api/v1/server/:id/blacklisted_channels", swallowErrors(this.deleteBlacklistedChannel));

        app.post("/api/v1/server/:id/role", swallowErrors(this.addRole));
        app.post("/api/v1/server/:id/role/preset/:name", swallowErrors(this.addRolePreset));
        app.post("/api/v1/server/:id/role/:role", swallowErrors(this.updateRole));
        app.delete("/api/v1/server/:id/role/:role", swallowErrors(this.deleteRole));
        app.post("/api/v1/server/:id/role/:role/link", swallowErrors(this.linkRoleWithDiscord));
    }

    /**
     * Serves a static list of all commands registered with the discord command handler,
     * for documentation purposes on the website.
     */
    private serveCommands = async (req: express.Request, res: express.Response) => {
        res.json(this.client.commands.map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            keywords: cmd.keywords
        })));
    };

    /**
     * Serves the user profile, with guilds they can manage and their accounts + settings.
     */
    private serveUserProfile = requireAuth(async (req: express.Request, res: express.Response) => {
        const guilds = [];
        for (const guild of this.bot.guilds.filter(x => x.members.has(req.user.snowflake))) {
            const member = guild.members.get(req.user.snowflake)!;

            // Make sure the user can manage server (or is the owner).
            if (!member.permission.has("manageGuild") && member.id !== config.discord.owner) continue;

            // Make sure that the server is configured with ori (should always be the case).
            if (!(await Server.query().where("snowflake", guild.id).first())) continue;

            guilds.push({
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL || "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png"
            });
        }

        // Load user accounts.
        await req.user.$loadRelated("accounts");

        res.json({
            ...req.user.toJSON(),
            avatar: req.user.avatarURL,
            guilds
        });
    });

    /**
     * Handles updates to user settings, in particular the privacy toggles.
     */
    private patchUserProfile = requireAuth(async (req: express.Request, res: express.Response) => {
        if (!this.validate({
            hide_accounts: Joi.bool().optional(),
            treat_as_unranked: Joi.bool().optional()
        }, req, res)) return;

        if (typeof req.body.hide_accounts !== "undefined") {
            await req.user.$query().patch({
                hide_accounts: req.body.hide_accounts
            });
        }

        if (typeof req.body.treat_as_unranked !== "undefined") {
            await req.user.$query().patch({
                treat_as_unranked: req.body.treat_as_unranked
            });
        }

        return res.json({ ok: true });
    });

    /**
     * Queries for a summoner and returns the summoner data plus validation code if found.
     * Returns null and 404 if the summoner cannot be found.
     */
    private lookupSummoner = async (req: express.Request, res: express.Response) => {
        if (!this.validate( {
            username: Joi.string().required(),
            region: Joi.any().valid(REGIONS)
        }, req, res)) return;

        const summ = await this.client.riotAPI.getSummonerByName(req.body.region, req.body.username);
        if (!summ) return res.status(404).json(null);

        // Check if this account has been taken by someone else already.
        if (await LeagueAccount.query().where("summoner_id", summ.id).where("region", req.body.region).first()) {
            return res.json({
                taken: true,
                username: summ.name
            });
        }

        // Generate a key and assign it for the current session.
        // Note that this will expire if we restart, but that should rarely happen.
        const key = randomstring.generate({
            length: 8,
            readable: true
        });

        this.summoners.set(key,  {
            ...summ,
            region: req.body.region
        });

        return res.json({
            region: req.body.region,
            username: summ.name,
            account_id: summ.accountId,
            summoner_id: summ.id,
            code: key
        });
    };

    /**
     * Adds the specified summoner with the specified code to the currently logged in user.
     */
    private addUserAccount = requireAuth(async (req: express.Request, res: express.Response) => {
        if (!this.validate({
            code: Joi.any().valid(...this.summoners.keys()) // must be a valid code
        }, req, res)) return;

        // Make sure that the code is valid.
        const summoner = this.summoners.get(req.body.code)!;
        if (!await this.client.riotAPI.isThirdPartyCode(summoner.region, "" + summoner.id, req.body.code)) return res.json({ ok: false });

        // Add the user..
        await req.user.addAccount(summoner.region, summoner);
        this.client.updater.fetchAndUpdateAll(req.user);

        return res.json({ ok: true });
    });

    /**
     * Deletes the specified account from the user's profile.
     */
    private deleteUserAccount = requireAuth(async (req: express.Request, res: express.Response) => {
        if (!this.validate(Joi.object({
            summoner_id: Joi.string(),
            region: Joi.any().valid(REGIONS)
        }).unknown(true), req, res)) return;

        await req.user.$loadRelated("accounts");

        const toDelete = req.user.accounts!.find(x => x.region === req.body.region && x.summoner_id === req.body.summoner_id);
        if (!toDelete) return res.status(400).json(null);

        await toDelete.$query().delete();

        // Mark last account update timestamp as 0 to force a complete recalculation of games played, instead
        // of running an incremental check (which would include the games on the deleted account as well).
        await req.user.$query().update({
            last_account_update_timestamp: "0"
        });
        this.client.updater.fetchAndUpdateAll(req.user);

        return res.json({ ok: true });
    });

    /**
     * Serves the settings and roles for the specified discord server id.
     */
    private serveServer = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        await server.$loadRelated("roles.*");
        await server.$loadRelated("blacklisted_channels");

        // Find our highest rank, for web interface logic.
        const us = guild.members.get(this.client.bot.user.id)!;
        const highest = Math.max(...us.roles.map(x => guild.roles.get(x)!.position));

        const channels = guild.channels.filter(x => x.type === 0).map(x => ({ id: x.id, name: x.name }));
        const roles = guild.roles.filter(x => x.name !== "@everyone").map(x => ({
            id: x.id,
            name: x.name,
            color: "#" + x.color.toString(16),
            position: x.position
        }));

        return res.json({
            ...server.toJSON(),
            discord: {
                channels,
                roles,
                highestRole: highest
            }
        });
    });

    /**
     * Handles a simple diff change patch for the specified server.
     */
    private patchServer = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check payload.
        if (!this.validate({
            // Announcement channel must be null or a valid channnel. Optional.
            announcement_channel: Joi.any().valid(null, ...guild.channels.filter(x => x.type === 0).map(x => x.id)).optional(),

            // Default champion must be a number or null. Optional.
            default_champion: Joi.number().allow(null).optional(),

            // Completed intro must be a boolean. Optional
            completed_intro: Joi.boolean().optional()
        }, req, res)) return;

        await server.$query().update(req.body);
        return res.json({ ok: true });
    });

    /**
     * Adds a new blacklisted channel to the specified server.
     */
    private addBlacklistedChannel = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check payload.
        if (!this.validate({
            channel: Joi.any().valid(null, ...guild.channels.filter(x => x.type === 0).map(x => x.id))
        }, req, res)) return;

        // If the channel hasn't been marked as blacklisted already, add it.
        await server.$loadRelated("blacklisted_channels");
        if (!server.blacklisted_channels!.some(x => x.snowflake === req.body.channel) && req.body.channel) {
            await server.$relatedQuery<BlacklistedChannel>("blacklisted_channels").insert({
                snowflake: req.body.channel
            });
        }

        return res.json({ ok: true });
    });

    /**
     * Removes a blacklisted channel from the specified server.
     */
    private deleteBlacklistedChannel = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check payload.
        if (!this.validate({
            channel: Joi.any().valid(null, ...guild.channels.filter(x => x.type === 0).map(x => x.id))
        }, req, res)) return;

        // If the channel was marked as blacklisted, remove it.
        await server.$loadRelated("blacklisted_channels");
        const blacklistedChannel = server.blacklisted_channels!.find(x => x.snowflake === req.body.channel);
        if (blacklistedChannel) {
            await blacklistedChannel.$query().delete();
        }

        return res.json({ ok: true });
    });

    /**
     * Adds a new role with the specified name and no conditions.
     */
    private addRole = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check payload.
        if (!this.validate({
            name: Joi.string()
        }, req, res)) return;

        const discordRole = guild.roles.find(x => x.name === req.body.name);
        const role = await server.$relatedQuery<Role>("roles").insertAndFetch({
            name: req.body.name,
            announce: !!server.announcement_channel, // turn on announce based on whether or not we have an announcement channel set
            snowflake: discordRole ? discordRole.id : ""
        });

        res.json({
            ...role.toJSON(),
            conditions: []
        });
    });

    /**
     * Adds a new preset of roles to the specified server.
     */
    private addRolePreset = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        const roleId = (name: string) => guild.roles.find(x => x.name === name) ? guild.roles.find(x => x.name === name)!.id : "";

        if (req.params.name === "region") {
            for (const region of REGIONS) {
                await server.$relatedQuery<Role>("roles").insertGraph(<any>{
                    name: region,
                    announce: false,
                    snowflake: roleId(region),
                    conditions: [{
                        type: "server",
                        options: { region }
                    }]
                });
            }
        } else if (req.params.name === "rank") {
            for (let i = 0; i <= config.riot.tiers.length; i++) {
                const name = i === 0 ? "Unranked" : (config.riot.tiers[i - 1].charAt(0) + config.riot.tiers[i - 1].toLowerCase().slice(1));
                await server.$relatedQuery<Role>("roles").insertGraph(<any>{
                    name,
                    announce: false,
                    snowflake: roleId(name),
                    conditions: [{
                        type: "ranked_tier",
                        options: {
                            compare_type: "equal",
                            tier: i,
                            queue: req.body.queue
                        }
                    }]
                });
            }
        } else if (req.params.name === "mastery") {
            for (let i = 1; i <= 7; i++) {
                await server.$relatedQuery<Role>("roles").insertGraph(<any>{
                    name: "Level " + i,
                    announce: server.announcement_channel !== null,
                    snowflake: roleId("Level " + i),
                    conditions: [{
                        type: "mastery_level",
                        options: {
                            compare_type: "exactly",
                            value: i,
                            champion: +req.body.champion
                        }
                    }]
                });
            }
        } else if (req.params.name === "step") {
            const formatNumber = (x: number) => x >= 1000000 ? (x / 1000000).toFixed(1).replace(/[.,]0$/, "") + "m" : (x / 1000).toFixed(0) + "k";
            for (let i = req.body.start; i <= req.body.end; i += req.body.step) {
                await server.$relatedQuery<Role>("roles").insertGraph(<any>{
                    name: formatNumber(i),
                    announce: server.announcement_channel !== null,
                    snowflake: roleId(formatNumber(i)),
                    conditions: [{
                        type: "mastery_score",
                        options: {
                            compare_type: "between",
                            min: i,
                            max: i + req.body.step,
                            champion: +req.body.champion
                        }
                    }]
                });
            }
        } else {
            res.status(400).json({ ok: false, error: "Invalid preset name" });
        }

        res.json({ ok: true });
    });

    /**
     * Updates the specified role and role conditions.
     */
    private updateRole = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check that role exists and belongs to server.
        const role = await server.$relatedQuery<Role>("roles").findById(req.params.role);
        if (!role) return;

        // Check payload.
        if (!this.validate({
            name: Joi.string(),
            announce: Joi.boolean(),
            conditions: Joi.array().items({
                type: Joi.string(),
                options: Joi.object()
            })
        }, req, res)) return;

        // Update role announce.
        await role.$query().update({
            announce: req.body.announce,
            name: req.body.name
        });

        // Drop all old conditions.
        await role.$relatedQuery("conditions").delete();

        // Insert new conditions.
        for (const condition of req.body.conditions) {
            await role.$relatedQuery<RoleCondition>("conditions").insert({
                type: condition.type,
                options: condition.options
            });
        }

        res.json({ ok: true });
    });

    /**
     * Deletes the specified role.
     */
    private deleteRole = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check that role exists and belongs to server.
        const role = await server.$relatedQuery<Role>("roles").findById(req.params.role);
        if (!role) return;

        await role.$query().delete();

        res.json({ ok: true });
    });

    /**
     * Either finds or creates a discord role for the specified Orianna role, then returns the created role.
     */
    private linkRoleWithDiscord = requireAuth(async (req: express.Request, res: express.Response) => {
        const { server, guild } = await this.verifyServerRequest(req, res);
        if (!server) return;

        // Check that role exists and belongs to server.
        const role = await server.$relatedQuery<Role>("roles").findById(req.params.role);
        if (!role) return;

        // Find or create discord role.
        let discordRole = guild.roles.find(x => x.name === role.name);
        if (!discordRole) {
            discordRole = (await guild.createRole({
                name: role.name
            }, "Linked to Orianna Bot role " + role.name))!;
        }

        // Write to database, return new/found discord role.
        await role.$query().update({ snowflake: discordRole.id });
        res.json({
            id: discordRole.id,
            name: discordRole.name,
            color: discordRole.color.toString(16)
        });
    });

    /**
     * Validates the post contents of the specified request with the specified schema. Returns
     * true if the request is valid, false otherwise. This will close the request if the request
     * was invalid.
     */
    private validate(schema: any, req: express.Request, res: express.Response): boolean {
        const result = Joi.validate(req.body, schema);
        if (result.error) {
            res.status(400).json({ ok: false, error: result.error.message });
            return false;
        }

        return true;
    }

    /**
     * Checks that the requested server exists and that the current user has access. Returns a null
     * server if something went wrong, valid values otherwise.
     */
    private async verifyServerRequest(req: express.Request, res: express.Response): Promise<{ server: Server | null, guild: eris.Guild }> {
        const server = await Server.query().where("snowflake", req.params.id).first();
        if (!server) {
            res.status(400).send({ ok: false, error: "Invalid server" });
            return { server: null, guild: <any>null };
        }

        const guild = this.bot.guilds.get(server.snowflake);
        if (!guild) {
            res.status(400).send({ ok: false, error: "Server missing guild" });
            return { server: null, guild: <any>null };
        }

        if (!this.hasAccess(req.user, server)) {
            res.status(403).send({ ok: false, error: "No permissions" });
            return { server: null, guild: <any>null };
        }

        return { server, guild };
    }

    /**
     * Checks if the specified user has permissions to edit the specified server.
     */
    private hasAccess(user: User, server: Server): boolean {
        const guild = this.bot.guilds.get(server.snowflake);
        if (!guild) return false;

        // Owner always has access to server configs.
        if (user.snowflake === config.discord.owner) return true;

        // Check if the current user has access.
        return guild.members.has(user.snowflake) && guild.members.get(user.snowflake)!.permission.has("manageMessages");
    }
}