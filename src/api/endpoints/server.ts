import express = require("express");
import { DiscordServerModel } from "../../database";

// GET '/api/server/:code'
export async function serverGet(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server) return res.status(404).send({});

    const guild: eris.Guild = this.discord.bot.guilds.get(server.snowflake);
    if (!guild) return res.status(404).send({});

    let announceChannelSnowflake = server.announceChannelSnowflake;
    if (!announceChannelSnowflake && guild.defaultChannel) announceChannelSnowflake = guild.defaultChannel.id;
    if (!announceChannelSnowflake) announceChannelSnowflake = guild.channels.find(x => x.type === 0)!.id;

    res.send({
        ...server.__props,
        announceChannelSnowflake,
        existingRoles: guild.roles.map(x => x.name),
        channels: guild.channels.filter(x => x.type === 0).map(x => ({ name: x.name, snowflake: x.id }))
    });
}

// POST '/api/server/:code'
export async function serverPost(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server || server.setupCompleted) throw new Error("Server cannot complete setup.");

    res.send(); // Do not make the user wait.

    server.championId = req.body.championId;
    server.announcePromotions = req.body.announcePromotion;
    server.regionRoles = req.body.regionRanks;
    server.tierRoles = req.body.tierRoles;
    server.announceChannelSnowflake = req.body.announceChannelSnowflake;
    server.setupCompleted = true;
    await server.save();

    for (const r of req.body.roles) {
        await server.addRole(r.name, r.range);
    }

    await this.discord.finalizeServerSetup((await DiscordServerModel.find(server.id))!);
}

// PUT '/api/server/:code'
export async function serverPut(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server) throw new Error("Server not found.");

    const changes: ServerConfigPayload = req.body;

    server.championId = changes.championId || server.championId;
    server.announcePromotions = changes.announcePromotions !== null ? changes.announcePromotions : server.announcePromotions;
    server.announceChannelSnowflake = changes.announceChannelSnowflake || server.announceChannelSnowflake;

    if (changes.rolesChanged) {
        // Remove old roles from database.
        for (const role of server.roles) await role.destroy();

        // Add new roles to database.
        for (const role of changes.roles) await server.addRole(role.name, role.range);

        // Add new roles in discord. Note that we do not await since this will block the request.
        this.discord.setupDiscordRoles((await DiscordServerModel.find(server.id))!).then(() => {
            this.discord.updater.refreshServer(server);
        });
    }

    if (changes.regionRoles !== null) {
        server.regionRoles = changes.regionRoles;

        // (Re-)Add region roles if they were enabled.
        if (changes.regionRoles) {
            this.discord.setupDiscordRoles(server, this.config.regions).then(() => {
                this.discord.updater.refreshServer(server);
            });
        }
    }

    if (changes.tierRoles !== null) {
        server.tierRoles = changes.tierRoles;

        if (changes.tierRoles) {
            this.discord.setupDiscordRoles(server, this.config.tiers).then(() => {
                this.discord.updater.refreshServer(server);
            });
        }
    }

    await server.save();
    res.send();
}

/**
 * Body sent by the client in the server update call.
 */
interface ServerConfigPayload {
    championId: number; // 0 if unchanged
    announcePromotions: boolean | null; // null if unchanged
    regionRoles: boolean | null; // null if unchanged
    tierRoles: boolean | null; // null if unchanged
    announceChannelSnowflake: string | null; // null if unchanged
    rolesChanged: boolean; // if roles were changed
    roles: { name: string, range: string }[]; // roles. these are populated even if they didn't change
}