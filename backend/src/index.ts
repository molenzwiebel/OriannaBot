import debug = require("debug");
import DiscordClient from "./discord/client";

const info = debug("orianna");
const error = debug("orianna:error");

process.on("unhandledRejection", (err: Error) => {
    error("Unhandled rejection: %O", err);
});

(async() => {
    info("Starting Orianna Bot...");

    const discord = new DiscordClient();
    await discord.connect();

    info("Orianna is running!");
})();