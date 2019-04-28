// THIS NEEDS TO BE THE FIRST LINE SO IT CAN HIJACK OTHER MODULES
import elastic from "./elastic";
import debug = require("debug");

import HelpCommand from "./discord/commands/help";
import AboutCommand from "./discord/commands/about";
import RefreshCommand from "./discord/commands/refresh";
import EvalCommand from "./discord/commands/eval";
import TopCommand from "./discord/commands/top";
import ProfileCommand from "./discord/commands/profile";
import PointsCommand from "./discord/commands/points";
import RolesCommand from "./discord/commands/roles";
import EditCommand from "./discord/commands/edit";
import OtherBotsHelpfulCommand from "./discord/commands/other-bots";
import StatsCommand from "./discord/commands/stats";
import InviteCommand from "./discord/commands/invite";
import TestTopCommand from "./discord/commands/top-graphic";

import createApplication from "./web/web";

import config from "./config";
import RiotAPI from "./riot/api";
import PuppeteerController from "./puppeteer";
import DiscordClient from "./discord/client";

const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
    elastic.reportError(err, "unhandled global rejection");
});

(async() => {
    info("Starting Orianna Bot...");

    const riotAPI = new RiotAPI(config.riot.apiKey);

    const puppeteer = new PuppeteerController();
    await puppeteer.initialize();

    const discord = new DiscordClient(riotAPI, puppeteer);
    await discord.connect();

    // These should be in order of most importance.
    // They're matched from first to last, so `edit profile` will match edit before it matches profile.
    discord.registerCommand(EvalCommand);
    discord.registerCommand(HelpCommand);
    discord.registerCommand(AboutCommand);
    discord.registerCommand(EditCommand);
    discord.registerCommand(RefreshCommand);
    discord.registerCommand(TopCommand);
    discord.registerCommand(ProfileCommand);
    discord.registerCommand(PointsCommand);
    discord.registerCommand(RolesCommand);
    discord.registerCommand(StatsCommand);
    discord.registerCommand(InviteCommand);
    discord.registerCommand(TestTopCommand);
    discord.registerCommand(OtherBotsHelpfulCommand);

    const app = createApplication(discord);
    app.listen(config.web.port);
    info("Hosting web interface on 0.0.0.0:%i...", config.web.port);

    info("Orianna is running!");
})();