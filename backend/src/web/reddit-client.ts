import express = require("express");
import fetch from "node-fetch";
import snoowrap = require("snoowrap");
import { requireAuth } from "./decorators";
import config from "../config";
import RiotAPI from "../riot/api";
import * as ipc from "../cluster/master-ipc";
import elastic from "../elastic";

export default function register(app: express.Application, riot: RiotAPI) {
    const redirectUrl = config.web.url + "/api/v1/reddit/callback";

    app.get("/api/v1/reddit", requireAuth((req, res) => {
        res.redirect(`https://www.reddit.com/api/v1/authorize?client_id=${config.reddit.clientId}&response_type=code&redirect_uri=${redirectUrl}&duration=temporary&scope=identity&state=abc`);
    }));

    app.get("/api/v1/reddit/callback", requireAuth(async (req, res) => {
        const ret = (resp: any) => res.send("<head><script>window.opener.postMessage({ type: 'reddit', result: " + JSON.stringify(resp) + " }, '*')</script>");

        if (!req.query.code || req.query.error) return ret({ ok: false, error: req.query.error });
        try {
            const reddit: any = await snoowrap.fromAuthCode({
                code: req.query.code,
                userAgent: "Orianna Bot",
                clientId: config.reddit.clientId,
                clientSecret: config.reddit.clientSecret,
                redirectUri: redirectUrl
            });

            // Shitty typings force me to use this ugly line. Sorry...
            const username: string = (await reddit.getMe()).name;

            // Ask for the accounts linked to that reddit account.
            const accountsReq = await fetch("http://flairs.championmains.com/api/user-summoners?username=" + username);
            const accounts: { region: string, name: string }[] = accountsReq.status === 200 ? (await accountsReq.json()).result || [] : [];

            for (const acc of accounts) {
                const summ = await riot.getLoLSummonerByName(acc.region, acc.name);
                if (!summ) continue;

                const tftSumm = await riot.getTFTSummonerByName(acc.region, acc.name);
                if (!tftSumm) continue;

                await req.user.addAccount(acc.region, summ, tftSumm);
            }

            // Update data for the user after they fetched their accounts.
            ipc.fetchAndUpdateUser(req.user);

            return ret({ ok: true });
        } catch (err) {
            elastic.reportError(err, "reddit import accounts handler");
            return ret({ ok: false, error: err.message });
        }
    }));
}