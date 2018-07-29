import express = require("express");
import cors = require("cors");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import WebAPIClient from "./api-client";
import DiscordClient from "../discord/client";
import { default as registerReddit } from "./reddit-client";
import { default as registerAuth } from "./auth-key-client";
import { default as registerDiscordAuth } from "./discord-auth-client";
import { default as registerDiscordLink } from "./discord-link-client";
import { default as registerDiscordInvite } from "./discord-invite-client";
import * as path from "path";

/**
 * Creates a new Express instance for serving the web panel. This application
 * will not attach the API routes, since they are stateful. All other routes
 * are added.
 */
export default function createApplication(client: DiscordClient) {
    const app = express();

    app.use(cors({
        origin: (host, cb) => cb(null, true),
        credentials: true
    }));
    app.use(cookieParser());
    app.use(bodyParser.json());

    // First try static data.
    app.use(express.static(path.join(__dirname, "../../../frontend/dist")));

    // Then try any API routes...
    const apiClient = new WebAPIClient(client, app);
    registerAuth(app);
    registerReddit(app, client.riotAPI, client.updater);
    registerDiscordAuth(app, client);
    registerDiscordLink(app, client);
    registerDiscordInvite(app, client);

    // Then, default to index for anything we do not recognize, that way
    // our vue-router can catch the problem and render the appropriate page.
    app.use((req, res) => {
        res.setHeader("Content-Type", "text/html");
        res.sendFile(path.join(__dirname, "../../../frontend/dist/index.html"));
    });

    return app;
}