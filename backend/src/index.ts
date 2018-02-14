import debug = require("debug");
import DiscordClient from "./discord/client";

import HelpCommand from "./discord/commands/help";
import AboutCommand from "./discord/commands/about";
import RefreshCommand from "./discord/commands/refresh";
import EvalCommand from "./discord/commands/eval";
import TopCommand from "./discord/commands/top";
import ListCommand from "./discord/commands/list";

const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
});

(async() => {
    info("Starting Orianna Bot...");

    const discord = new DiscordClient();
    await discord.connect();

    discord.registerCommand(HelpCommand);
    discord.registerCommand(AboutCommand);
    discord.registerCommand(RefreshCommand);
    discord.registerCommand(EvalCommand);
    discord.registerCommand(TopCommand);
    discord.registerCommand(ListCommand);

    info("Orianna is running!");
})();