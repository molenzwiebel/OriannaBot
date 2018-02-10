import debug = require("debug");
import DiscordClient from "./discord/client";

import HelpCommand from "./discord/commands/help";
import AboutCommand from "./discord/commands/about";
import RefreshCommand from "./discord/commands/refresh";
import { expectChampion } from "./discord/commands/util";

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

    discord.registerCommand({
        name: "Test",
        smallDescription: "This is a small description",
        description: "This is a big description **using markdown**\n and newlines!",
        keywords: ["a"],
        async handler({ ok, ctx }) {
            const c = await expectChampion(ctx);
            if (!c) return;
            ok({ title: c.name });
        }
    });

    info("Orianna is running!");
})();