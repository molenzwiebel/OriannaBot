import express = require("express");
import bodyparser = require("body-parser");
import cors = require("cors");
import debug = require("debug");
import { Configuration } from "../index";

import { serverGet, serverPost, serverPut } from "./endpoints/server";
import { userDelete, userGet, userPut } from "./endpoints/user";
import { runePageVerify, summonerLookup } from "./endpoints/riot";
import { redditCallback, redditPoll } from "./endpoints/reddit";
import RiotAPI from "../riot/api";
import DiscordClient from "../discord/client";

export default class APIWebServer {
    private app: express.Application;
    public readonly log = debug("orianna:api");

    constructor(public readonly config: Configuration, public readonly riot: RiotAPI, public readonly discord: DiscordClient) {
        this.app = express();
        this.app.use(cors()); // allow cors for development
        this.app.use(bodyparser.json()); // automatically JSON.parse bodies.

        // Server endpoints.
        this.app.get("/api/server/:code", this.wrapHandler(serverGet));
        this.app.put("/api/server/:code", this.wrapHandler(serverPut));
        this.app.post("/api/server/:code", this.wrapHandler(serverPost));

        // User endpoints.
        this.app.get("/api/user/:code", this.wrapHandler(userGet));
        this.app.put("/api/user/:code/account", this.wrapHandler(userPut));
        this.app.delete("/api/user/:code/account", this.wrapHandler(userDelete));

        // Riot API endpoints.
        this.app.get("/api/lookup/:region/:name", this.wrapHandler(summonerLookup));
        this.app.get("/api/verify/:region/:id/:expected", this.wrapHandler(runePageVerify));

        // Reddit import endpoints.
        this.app.get("/api/reddit_poll/:code", this.wrapHandler(redditPoll));
        this.app.get("/api/reddit_confirm", this.wrapHandler(redditCallback));
    }

    /**
     * Starts the API web server on the specified port and 0.0.0.0 host.
     */
    listen(port: number): Promise<void> {
        this.log("Listening on 0.0.0.0:%d", port);
        return new Promise<void>(resolve => this.app.listen(port, resolve));
    }

    /**
     * Wraps the specified request handler to ensure that it returns 500 on error.
     * Source: https://medium.com/@yamalight/danger-of-using-async-await-in-es7-8006e3eb7efb.
     */
    private wrapHandler(method: (req: express.Request, res: express.Response) => any) {
        return (req: express.Request, res: express.Response) => {
            const p = method.call(this, req, res);
            p && p.catch((err: Error) => {
                this.log("Error in handler for '%s': %s.", req.path, err.message);
                res.status(500).json({ message: err.message });
            });
        };
    }
}