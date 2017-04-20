<table>
  <tbody>
    <tr>
      <td><img width=60 height=60 src="https://ddragon.leagueoflegends.com/cdn/7.5.1/img/champion/Orianna.png"></td>
      <td><h1>Orianna Bot</h1></td>
    </tr>
  </tbody>
</table>

This is the source code for the _bot_ portion of [Orianna Bot](http://orianna.molenzwiebel.xyz), which is currently live on various servers. This repository does not include the database and web interface. If you simply want to add the bot to your server, click the big button [here](http://orianna.molenzwiebel.xyz).

## Building and Running
- Clone the repository to your local drive, then run `yarn install` to get all the dependenciessettled.  
- During development, use `yarn watch` to automatically compile the TypeScript into JavaScript (or use `yarn bundle` to do it manually).
- Running the bot can be done with `yarn run`. Recommended is to run `export DEBUG='orianna*'` first, or you will get no log messages.

Running the bot will require a Riot API key, a Discord token and Reddit application info (along with some other minor settings), which can be specified in the `config.json` file. To serve the web interface, put all neccessary files in the `web` folder.

## License
[MIT](http://opensource.org/licenses/MIT)
