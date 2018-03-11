import debug = require("debug");
import DiscordClient from "./discord/client";

import HelpCommand from "./discord/commands/help";
import AboutCommand from "./discord/commands/about";
import RefreshCommand from "./discord/commands/refresh";
import EvalCommand from "./discord/commands/eval";
import TopCommand from "./discord/commands/top";
import ListCommand from "./discord/commands/list";
import PointsCommand from "./discord/commands/points";
import RolesCommand from "./discord/commands/roles";
import createApplication from "./web/web";
import config from "./config";
import RiotAPI from "./riot/api";

const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
});

(async() => {
    info("Starting Orianna Bot...");

    const riotAPI = new RiotAPI(config.riot.apiKey);

    const discord = new DiscordClient(riotAPI);
    await discord.connect();

    discord.registerCommand(HelpCommand);
    discord.registerCommand(AboutCommand);
    discord.registerCommand(RefreshCommand);
    discord.registerCommand(EvalCommand);
    discord.registerCommand(TopCommand);
    discord.registerCommand(ListCommand);
    discord.registerCommand(PointsCommand);
    discord.registerCommand(RolesCommand);

    const app = createApplication(discord);
    app.listen(config.web.port);
    info("Hosting web interface on 0.0.0.0:%i...", config.web.port);

    info("Orianna is running!");
})();