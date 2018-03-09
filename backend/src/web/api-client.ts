import express = require("express");
import * as eris from "eris";
import { Server } from "../database";
import { requireAuth, swallowErrors } from "./decorators";

export default class WebAPIClient {
    constructor(private bot: eris.Client, private app: express.Application) {
        app.get("/api/v1/user", swallowErrors(this.serveUserProfile));
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
                icon: guild.iconURL
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
}