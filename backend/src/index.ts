import debug = require("debug");
import DiscordClient from "./discord/client";

import HelpCommand from "./discord/commands/help";
import AboutCommand from "./discord/commands/about";

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

    discord.registerCommand({
        name: "Test",
        smallDescription: "This is a small description",
        description: "This is a big description **using markdown**\n and newlines!",
        keywords: ["test"],
        async handler({ ok }) {
            ok({ title: "Hi there." });
            throw "Oh noe";
        }
    });

    info("Orianna is running!");
})();