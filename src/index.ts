import { Database } from "basie";
import { UserModel, LeagueAccountModel, DiscordServerModel, RoleModel } from "./database";
import * as fs from "fs";

import debug = require("debug");
import RiotAPI from "./riot/api";
import APIWebServer from "./api/server";
import DiscordClient from "./discord/client";
const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
});

export interface Configuration {
    regions: string[];
    riotApiKey: string;

    ownerSnowflake: string;
    discordToken: string;

    redditClientId: string;
    redditClientSecret: string;
    redditRedirectUrl: string;

    baseUrl: string;
}

(async () => {
    info("Starting Orianna. Reading config...");
    if (!fs.existsSync("./config.json")) {
        error("No config.json found.");
        return;
    }
    const config: Configuration = JSON.parse(fs.readFileSync("./config.json", "utf8"));

    info("Connecting to database.");
    await Database.connect("./orianna.db");

    info("Preparing database.");
    await UserModel.createTable();
    await LeagueAccountModel.createTable();
    await DiscordServerModel.createTable();
    await RoleModel.createTable();

    const riotApi = new RiotAPI(config.riotApiKey);

    info("Connecting to Discord.");
    const discord = new DiscordClient(config);
    await discord.connect();

    info("Starting web server.");
    const webServer = new APIWebServer(config, riotApi, discord);
    await webServer.listen(8001);
})();