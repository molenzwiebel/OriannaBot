import express = require("express");
import { DiscordServerModel } from "../../database";

// GET '/api/server/:code'
export async function serverGet(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server) return res.status(404).send({});

    const guild: eris.Guild = this.discord.bot.guilds.get(server.snowflake);
    if (!guild) return res.status(404).send({});

    res.send({
        ...server.__props,
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
    if (!server || server.setupCompleted) throw new Error("Server cannot complete setup.");

    // TODO: Server config changing.
}