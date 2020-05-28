import express = require("express");
import fetch from "node-fetch";
import config from "../config";
import DiscordClient from "../discord/client";
import { Server } from "../database";
import elastic from "../elastic";
import getTranslator from "../i18n";

interface DiscordAuthToken {
    access_token?: string;
    guild: {
        id: string;
        name: string;
        icon: string | null;
    };
}

export default function register(app: express.Application, client: DiscordClient) {
    const redirectUrl = config.web.url + "/api/v1/discord-invite/callback";

    app.get("/api/v1/discord-invite", (req, res) => {
        res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&permissions=8&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=identify%20bot`);
    });

    app.get("/api/v1/discord-invite/callback", async (req, res) => {
        if (!req.query.code || req.query.error) return res.redirect("/");

        try {
            // Ask for an access token.
            const tokenReq = await fetch(`https://discord.com/api/oauth2/token` ,{
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `client_id=${config.discord.clientId}&client_secret=${config.discord.clientSecret}&grant_type=authorization_code&code=${req.query.code}&redirect_uri=${encodeURIComponent(redirectUrl)}`
            });
            const tokenRes: DiscordAuthToken = await tokenReq.json();
            if (!tokenRes.access_token) throw new Error("Missing access token.");

            // Ask discord for our username (or more importantly, our ID).
            const meReq = await fetch("https://discord.com/api/users/@me", {
                headers: {
                    Authorization: "Bearer " + tokenRes.access_token
                }
            });
            const me: { id: string, username: string, avatar?: string } = await meReq.json();

            // First, ensure that we create a user and sign them in. That way we can immediately redirect
            // the user to the setup page.
            const user = await client.findOrCreateUser(me.id, me);
            res.cookie("token", user.token);

            // Next, if the discord server doesn't exist, register it.
            if (!await Server.query().where("snowflake", tokenRes.guild.id).first()) {
                await Server.query().insert({
                    snowflake: tokenRes.guild.id,
                    name: tokenRes.guild.name,
                    avatar: tokenRes.guild.icon || "none",
                    announcement_channel: null,
                    default_champion: null,
                    completed_intro: false
                });
            }

            // Finally, redirect them to the config page. Don't directly
            // redirect them to setup since this might've been from a transfer
            // and they'd already have roles setup.
            return res.redirect(`/server/${tokenRes.guild.id}`);
        } catch (err) {
            elastic.reportError(err, "discord invitation handling");

            return res.status(500).send("We're sorry, something went wrong processing your request.");
        }
    });
}