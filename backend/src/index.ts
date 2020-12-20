// THIS NEEDS TO BE THE FIRST LINE SO IT CAN HIJACK OTHER MODULES
import elastic from "./elastic";
import debug = require("debug");

import * as cluster from "cluster";
import * as ipc from "./cluster/master-ipc";

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

import createApplication from "./web/web";

import config from "./config";
import RiotAPI from "./riot/api";
import DiscordClient from "./discord/client";
import Updater from "./discord/updater";

const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
    elastic.reportError(err, "unhandled global rejection");
});

(async() => {
    if (cluster.isMaster) {
        process.title = "Orianna Bot - Master";

        info("Starting Orianna Bot - Master...");

        // Give the master process 10% of our rate limits.
        const riotAPI = new RiotAPI(config.riot.lolApiKey, config.riot.tftApiKey, 0.1);

        const discord = new DiscordClient(riotAPI);
        await discord.connect();

        // Fork update processes and register handlers for them.
        ipc.initializeMasterRPC(discord, 1);

        // These should be in order of most importance.
        // They're matched from first to last, so `edit profile` will match edit before it matches profile.
        // Note that this is also roughly the order in which commands are shown in the slash autocomplete,
        // so common commands should be included first.
        discord.registerCommand(TopCommand);
        discord.registerCommand(EditCommand);
        discord.registerCommand(ProfileCommand);
        discord.registerCommand(PointsCommand);
        discord.registerCommand(StatsCommand);
        discord.registerCommand(RefreshCommand);
        discord.registerCommand(RolesCommand);
        discord.registerCommand(EvalCommand);
        discord.registerCommand(HelpCommand);
        discord.registerCommand(InviteCommand);
        discord.registerCommand(AboutCommand);
        discord.registerCommand(OtherBotsHelpfulCommand);

        const app = createApplication(discord);
        app.listen(config.web.port);
        info("Hosting web interface on 0.0.0.0:%i...", config.web.port);

        info("Orianna is running!");
    } else {
        process.title = "Orianna Bot - Worker " + cluster.worker.id;

        info("Starting Orianna Bot - Updater Worker %i...", cluster.worker.id);

        // Give the updater process 90% of our rate limits.
        const riotAPI = new RiotAPI(config.riot.lolApiKey, config.riot.tftApiKey, 0.9);
        const updater = new Updater(riotAPI);

        updater.startUpdateLoops();

        info("Orianna Worker Process %i is running!", cluster.worker.id);
    }
})();