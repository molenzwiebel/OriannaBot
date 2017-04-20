<table>
  <tbody>
    <tr>
      <td><img src="https://ddragon.leagueoflegends.com/cdn/7.5.1/img/champion/Orianna.png"></td>
      <td><h1>Orianna Bot</h1></td>
    </tr>
  </tbody>
</table>

This is the source code for the _bot_ portion of [Orianna Bot](http://orianna.molenzwiebel.xyz), which is currently live on various servers. This repository does not include the database and web interface. If you simply want to add the bot to your server, click the big button [here](http://orianna.molenzwiebel.xyz).

# Building and Running
Clone the repository to your local drive, then run `yarn install` to get all the dependencies settled. During development, use `yarn watch` to automatically compile the Typescript into Javascript. To run the bot, use `yarn run`.
Running the bot will require various keys and settings, which can be specified in the `config.json` file. To serve the web interface, put all neccessary files in the `web` folder. `debug` is used for logging, so no messages are displayed by default. `export DEBUG='orianna*'` is recommended.

# License
[MIT](http://opensource.org/licenses/MIT)