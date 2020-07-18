<h1><img width=80 height=80 src="https://ddragon.leagueoflegends.com/cdn/7.5.1/img/champion/Orianna.png"></td>
Orianna Bot</h1>

[![Discord](https://discordapp.com/api/guilds/249481856687407104/widget.png?style=shield)](https://discord.gg/bfxdsRC)

This is the source code for the Discord bot and website portions that compromise [Orianna Bot](https://orianna.molenzwiebel.xyz). Note that Orianna Bot is not intended for self-hosting (although it is theoretically possible), so if you want Orianna Bot on your Discord server the easiest solution is to simply press the large button [here](https://orianna.molenzwiebel.xyz).

# Components

This project consists of two components, creatively named frontend and backend. Frontend is a single-page app Vue.js application bundled by Webpack. Backend is both an express web server that powers the frontend, as well as an Eris Discord bot.

## Developing Frontend

To get started with developing on frontend, you'll need to install dependencies. First of all you need to have [Node.js](https://nodejs.org) installed and it should have version 10 or lower. In case if you already have Node.js installed and its version is higher than 10 [nvm](https://github.com/nvm-sh/nvm) is a good choice to reconsider. Then I recommend to get [yarn](https://yarnpkg.com) and simply run `yarn install` to install all dependencies.

`yarn watch` will start a hot-reloading webserver on `http://localhost:8081` which will automatically reflect your changes. Running `yarn bundle` will produce an optimized minified bundle that backend can find.

Note that you will have to potentially edit `frontend/src/config.ts` to point to an appropriate API endpoint. If you're only changing the frontend and not any backend related endpoints, you can just keep it as `https://orianna.molenzwiebel.xyz` (note that you might need a chrome extension or similar to work around CORS issues).

## Developing Backend

Again, install all Node-related dependencies with a simple `yarn install`. After that, copy over `config.json.template` to `config.json` and adjust all required values (surrounded by `<<>>`).

To create tables in the Postgres database, ensure that you have setup the config properly, then run `./node_modules/.bin/knex migrate:latest` to run migrations. You have to do this again every time there are new migrations.

If everything is setup correctly, running `yarn start` will compile the typescript sources and start the bot with the specified config values. Note that you may not see any output, since Orianna uses `debug` which displays nothing by default. To see all debug messages, set your `DEBUG` environment variable to `orianna*`.

If you are developing, you can use `yarn watch` to automatically compile typescript as you work. Note that if you make any changes to the translations, you will need to rebuild translations first. This can be done by simply running `build.js` in the translation folder.

# License

[MIT](http://opensource.org/licenses/MIT)
