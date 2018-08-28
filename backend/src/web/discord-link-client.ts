import express = require("express");
import fetch from "node-fetch";
import config from "../config";
import DiscordClient from "../discord/client";
import { requireAuth } from "./decorators";
import elastic from "../elastic";

interface Connection {
    id: string;
    name: string;
    type: string;
}

// Discord has inconsistent region prefixes, so we gotta look up.
const regions = new Map([
    ["euw1", "EUW"],
    ["euw", "EUW"],
    ["na", "NA"],
    ["na1", "NA"],
    ["na2", "NA"],
    ["eun1", "EUNE"],
    ["eune", "EUNE"],
    ["eun", "EUNE"],
    ["br1", "BR"],
    ["br", "BR"],
    ["jp", "JP"],
    ["jp1", "JP"],
    ["la1", "LAN"],
    ["lan", "LAN"],
    ["la2", "LAS"],
    ["las", "LAS"],
    ["oc1", "OCE"],
    ["oce", "OCE"],
    ["tr1", "TR"],
    ["tr", "TR"],
    ["ru", "RU"],
    ["kr", "KR"],
    ["kr1", "KR"]
]);

export default function register(app: express.Application, client: DiscordClient) {
    const redirectUrl = config.web.url + "/api/v1/discord-link/callback";

    app.get("/api/v1/discord-link", requireAuth((req, res) => {
        res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${config.discord.clientId}&scope=connections&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}`);
    }));

    app.get("/api/v1/discord-link/callback", requireAuth(async (req, res) => {
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

            const connectionsReq = await fetch("https://discordapp.com/api/users/@me/connections", {
                headers: {
                    Authorization: "Bearer " + tokenRes.access_token
                }
            });
            const connections: Connection[] = await connectionsReq.json();

            for (const connection of connections) {
                if (connection.type !== "leagueoflegends") continue;

                // Discord league connections are in the format REGION_SUMMONERID
                const parts = connection.id.split("_");
                if (parts.length !== 2 || !regions.has(parts[0].toLowerCase()) || !/^\d+$/.test(parts[1])) continue;

                try {
                    const region = regions.get(parts[0].toLowerCase())!;
                    const summ = await client.riotAPI.getSummonerById(region, parts[1]);
                    if (!summ) continue;

                    await req.user.addAccount(region, summ);
                } catch { /* ignored */ }
            }

            // Update data for the user after they fetched their accounts.
            client.updater.fetchAndUpdateAll(req.user);

            res.send(`<head><script>window.opener.postMessage({ type: 'discord' }, '*')</script></head>`);
        } catch (err) {
            elastic.reportError(err, "discord importing handling");

            return res.status(500).send("We're sorry, something went wrong processing your request.");
        }
    }));
}