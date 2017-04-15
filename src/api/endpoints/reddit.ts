import express = require("express");
import request = require("request-promise");
import { UserModel, LeagueAccountModel } from "../../database";

// Storing this in-memory is fine, since the data should be short-lived anyway.
const redditStates: { [key: string]: { ok: boolean, error?: string } } = {};

// GET '/api/reddit_poll/:code'
export function redditPoll(req: express.Request, res: express.Response) {
    const state = redditStates[req.params.code];
    if (state && state.ok) delete redditStates[req.params.code]; // cleanup
    res.send(state || {});
}

// GET '/api/reddit_confirm?state=:key&code=:code[&error=err]'
export async function redditCallback(req: express.Request, res: express.Response) {
    // Close OAuth window.
    res.send("<head><script>window.close()</script></head>");

    const code = req.query.state;
    const user = await UserModel.findBy({ configCode: code });
    const oauthCode = req.query.code;

    // Notify the user if an error occurred (most likely they denied).
    if (!user || req.query.error) {
        redditStates[req.query.state] = { ok: false, error: req.query.error };
        return;
    }

    try {
        // Get Reddit API token.
        const token = JSON.parse(await request.post({
            url: "https://www.reddit.com/api/v1/access_token",
            body: "grant_type=authorization_code&code=" + oauthCode + "&redirect_uri=" + this.config.redditRedirectUrl,
            auth: {
                user: this.config.redditClientId,
                pass: this.config.redditClientSecret
            }
        })).access_token;

        // Get Reddit Username.
        const identity = JSON.parse(await request.get({
            url: "https://oauth.reddit.com/api/v1/me",
            auth: { bearer: token },
            headers: { "User-Agent": "Orianna Bot" }
        }));

        // Get accounts setup. Default to none if the user is not registered.
        const accounts: { region: string, name: string }[] = JSON.parse((await request.get("http://flairs.championmains.com/api/user-summoners?username=" + identity.name)) || `{ "result": [] }`).result;
        this.log("Importing %d accounts for reddit user %s", accounts.length, identity.name);
        redditStates[code] = { ok: true };

        for (const acc of accounts) {
            // We need to fetch the account ID since championmains doesn't return it.
            const data = await this.riot.getSummonerByName(acc.region, acc.name);

            const newAccount = new LeagueAccountModel();
            newAccount.region = data.region;
            newAccount.username = data.username;
            newAccount.summonerId = data.id;
            newAccount.accountId = data.accountId;
            newAccount.owner = user.id;
            await newAccount.save();
        }
    } catch (err) {
        redditStates[code] = { ok: false, error: err.message };
    }
}