import express = require("express");
import config from "../config";
import { Role, Server, User } from "../database";
import DiscordClient from "../discord/client";
import getTranslator from "../i18n";
import Joi = require("joi");

export default function register(app: express.Application, client: DiscordClient) {
    const t = getTranslator("en-US");

    const withCheckAuth = (handler: express.Handler): express.Handler => (req, res, next) => {
        if (req.header("Authorization") !== config.web.apiKey) {
            return res.status(403).json({
                ok: false,
                error: "Unauthorized."
            });
        }

        return handler(req, res, next);
    };

    app.post("/api/v1/shockwave/promote", withCheckAuth(async (req, res) => {
        const body = Joi.validate(req.body, Joi.object({
            user_id: Joi.number(),
            role_id: Joi.number()
        }));
        if (body.error) return res.status(400);

        const user = await User.query().where("id", req.body.user_id).first();
        const role = await Role.query().where("id", req.body.role_id).eager("[conditions]").first();
        if (!user || !role) return res.status(404);

        const guildId = await Server.query().select("snowflake").where("id", role.server_id).first();
        if (!guildId) return res.status(500);

        // Don't await, as it may take a bit to generate the proper promotion image.
        client.announcePromotion(user, role, guildId.snowflake).catch(e => {
            // Ignored.
        });

        return res.status(200).json({
            ok: true
        });
    }));

    app.post("/api/v1/shockwave/transfer", withCheckAuth(async (req, res) => {
        const body = Joi.validate(req.body, Joi.object({
            user_id: Joi.number(),
            region: Joi.string(),
            username: Joi.string()
        }));
        if (body.error) return res.status(400);

        const user = await User.query().where("id", req.body.user_id).first();
        if (!user) return res.status(404);

        await client.notify(user.snowflake, {
            color: 0x0a96de,
            title: t.transfer_title,
            description: t.transfer_body({ username: req.body.username, region: req.body.region })
        });
    }));
}