import express = require("express");
import * as eris from "eris";
import randomstring = require("randomstring");
import Joi = require("joi");
import { Server, BlacklistedChannel } from "../database";
import { requireAuth, swallowErrors } from "./decorators";
import { REGIONS } from "../riot/api";
import DiscordClient from "../discord/client";

export default class WebAPIClient {
    private bot: eris.Client;
    private summoners: Map<string, riot.Summoner & { region: string }> = new Map();

    constructor(private client: DiscordClient, private app: express.Application) {
        this.bot = client.bot;

        app.get("/api/v1/user", swallowErrors(this.serveUserProfile));
        app.post("/api/v1/summoner", swallowErrors(this.lookupSummoner));
        app.post("/api/v1/user/accounts", swallowErrors(this.addUserAccount));
        app.delete("/api/v1/user/accounts", swallowErrors(this.deleteUserAccount));

        app.get("/api/v1/server/:id", swallowErrors(this.serveServer));
    }

    /**
     * Serves the user profile, with guilds they can manage and their accounts + settings.
     */
    private serveUserProfile = requireAuth(async (req: express.Request, res: express.Response) => {
        const guilds = [];
        for (const guild of this.bot.guilds.filter(x => x.members.has(req.user.snowflake))) {
            const member = guild.members.get(req.user.snowflake)!;

            // Make sure the user can manage messages.
            if (!member.permission.has("manageMessages")) continue;

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
     * Queries for a summoner and returns the summoner data plus validation code if found.
     * Returns null and 404 if the summoner cannot be found.
     */
    private lookupSummoner = async (req: express.Request, res: express.Response) => {
        if (Joi.validate(req.body, {
            username: Joi.string().required(),
            region: Joi.any().valid(REGIONS)
        }).error) return res.status(400).json(null);

        const summ = await this.client.riotAPI.getSummonerByName(req.body.region, req.body.username);
        if (!summ) return res.status(404).json(null);

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
        if (Joi.validate(req.body, {
            code: Joi.any().valid(...this.summoners.keys()) // must be a valid code
        }).error) return res.status(400).json(null);

        // Make sure that the code is valid.
        const summoner = this.summoners.get(req.body.code)!;
        if (!await this.client.riotAPI.isThirdPartyCode(summoner.region, summoner.id, req.body.code)) return res.json({ ok: false });

        // Add the user..
        await req.user.addAccount(summoner.region, summoner);

        return res.json({ ok: true });
    });

    /**
     * Deletes the specified account from the user's profile.
     */
    private deleteUserAccount = requireAuth(async (req: express.Request, res: express.Response) => {
        if (Joi.validate(req.body, Joi.object({
            summoner_id: Joi.number(),
            region: Joi.any().valid(REGIONS)
        }).unknown(true)).error) return res.status(400).json(null);

        await req.user.$loadRelated("accounts");

        const toDelete = req.user.accounts!.find(x => x.region === req.body.region && x.summoner_id === req.body.summoner_id);
        if (!toDelete) return res.status(400).json(null);

        await toDelete.$query().delete();

        return res.json({ ok: true });
    });

    /**
     * Serves the settings and roles for the specified discord server id.
     */
    private serveServer = requireAuth(async (req: express.Request, res: express.Response) => {
        const server = await Server.query().where("snowflake", req.params.id).first();
        if (!server) return res.status(400).send();

        const guild = this.bot.guilds.get(server.snowflake);
        if (!guild) return res.status(400).send();

        // Check if the current user has access.
        if (!guild.members.has(req.user.snowflake)) return res.status(403).send();
        if (!guild.members.get(req.user.snowflake)!.permission.has("manageMessages")) return res.status(403).send();

        await server.$loadRelated("roles.*");
        await server.$loadRelated("blacklisted_channels");

        const channels = guild.channels.filter(x => x.type === 0).map(x => ({ id: x.id, name: x.name }));
        const roles = guild.roles.filter(x => x.name !== "@everyone").map(x => ({ id: x.id, name: x.name }));

        return res.json({
            ...server.toJSON(),
            discord: {
                channels,
                roles
            }
        });
    });
}