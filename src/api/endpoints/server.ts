import express = require("express");
import { DiscordServerModel, RoleModel } from "../../database";

// GET '/api/server/:code'
export async function serverGet(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (server) {
        return res.send({
            ...server.__props,
            existingRoles: server.existingRoles
        });
    }
    res.status(404).send({});
}

// POST '/api/server/:code'
export async function serverPost(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server || server.setupCompleted) throw new Error("Server cannot complete setup.");

    res.send(); // Do not make the user wait.

    server.championId = req.body.championId;
    server.announcePromotions = req.body.announcePromotions;
    server.regionRoles = req.body.regionRoles;
    server.setupCompleted = true;
    await server.save();

    for (const r of req.body.roles) {
        const role = new RoleModel();
        role.snowflake = "";
        role.name = r.name;
        role.range = r.range;
        role.owner = server.id;
        await role.save();
    }

    // TODO: Complete server setup, send messages via Discord.
}

// PUT '/api/server/:code'
export async function serverPut(req: express.Request, res: express.Response) {
    const server = await DiscordServerModel.findBy({ configCode: req.params.code });
    if (!server || server.setupCompleted) throw new Error("Server cannot complete setup.");

    // TODO: Server config changing.
}