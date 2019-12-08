import express = require("express");
import fetch from "node-fetch";
import config from "../config";
import DiscordClient from "../discord/client";
import elastic from "../elastic";
import getTranslator from "../i18n";

export default function register(app: express.Application, client: DiscordClient) {
    const redirectUrl = config.web.url + "/api/v1/discord/callback";

    app.get("/api/v1/discord", (req, res) => {
        res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${config.discord.clientId}&scope=identify&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}`);
    });

    app.get("/api/v1/discord/callback", async (req, res) => {
        if (!req.query.code || req.query.error) return res.status(400).send();

        try {
            // Ask for an access token.
            const tokenReq = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${req.query.code}&redirect_uri=${redirectUrl}` ,{
                method: "POST",
                headers: {
                    Authorization: "Basic " + Buffer.from(config.discord.clientId + ":" + config.discord.clientSecret).toString("base64")
                }
            });
            const tokenRes = await tokenReq.json();
            if (!tokenRes.access_token) throw new Error("Missing access token.");

            // Ask discord for our username (or more importantly, our ID).
            const meReq = await fetch("https://discordapp.com/api/users/@me", {
                headers: {
                    Authorization: "Bearer " + tokenRes.access_token
                }
            });
            const me: { id: string, username: string, avatar?: string } = await meReq.json();

            const user = await client.findOrCreateUser(me.id, getTranslator("en-US"), me);
            if (!user) throw new Error("Missing user.");

            res.cookie("token", user.token);
            return res.redirect("/me");
        } catch (err) {
            elastic.reportError(err, "discord auth handling");

            return res.status(500).send("We're sorry, something went wrong processing your request.");
        }
    });
}