# <img src="https://i.imgur.com/2Ok3pxv.png" width="40" align="left"> Game Server Watcher
A simple discord/telegram bot that can be hosted on a free service to monitor your game servers and players in style. 😎  

# About the Project
The main goals of this repo:
 1. create a (simple, but capable) service/bot to monitor game servers
    1. get gamedig & steam api server info (_eg.: server name, map, players, etc._)
    1. relay real time server information to various channels via APIs (_eg.: discord, telegram, slack etc._)
 1. should be able to host on a free service (_target atm. is cloudno.de (node.js 12.20.1)_)
 1. graciously add more features based on community feedback via [discord](https://discord.gg/4tsbftsGJz) and [github](https://github.com/a-sync/game-server-watcher/discussions/new?category=ideas-requests)

<details>
<summary><h1>Screenshots</h1></summary>

### Discord
![discord](https://user-images.githubusercontent.com/14183614/162092529-e1645b44-2650-4893-8123-7ba187b1f51c.png)

### Telegram
![telegram](https://user-images.githubusercontent.com/14183614/162092488-f28bd60c-88bf-4b1e-a31e-d7dca51d8c28.png)

### GSW Control Panel
![gsw control panel](https://user-images.githubusercontent.com/14183614/167517240-a4d02cb2-8037-44c0-abaa-c92901357e35.png)
</details>

# Project Status
The code itself is stable and continuously tested/deployed from the cloud branch.  

The project is in a very early stage. More detailed customization options and additional features will be added as requested.  

### Possible features and configuration options to add in the future
 * optional player list
   * with configurable fields. eg.: time,name,ping,score
   * configurable field & order to sort by
   * max length for player names & nr of players
 * custom embed fields for discord
 * _configurable timezone for graph x-axis_
 * refresh on reaction
 * watched players (notify when a watched player enters/leaves the server)
 * detect when the server goes offline, notify when player number crosses a threshold
 * bot commands (reinit message, cleanup, start/stop, configure)
 * more integrations: slack, ms teams, twillio (email, sms)
 * ~~web ui to manage & configure the servers and bots~~
 * put custom information in the channel name or bot status (online status indicator, number of players, map)
 * github action workflows to deploy to other cloud providers (heroku, azure, gcp, aws etc.)

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.  

## Requirements
[node.js](https://nodejs.org/) _(version 12.20.0 or later)_  

## Getting the source
This project is [hosted on github](https://github.com/a-sync/game-server-watcher). You can clone this project directly using this command:

```
git clone git@github.com:a-sync/game-server-watcher.git
```

The latest source and build can also be downloaded as a [zip archive](https://github.com/a-sync/game-server-watcher/archive/refs/heads/master.zip).

## Installation
Use npm or yarn to install/update all the dependencies:
```
npm i
```

If you don't want to build from source, you can skip the development dependencies:  
```
npm i --only=prod
```

## Usage
Start the built artifacts directly:
```
node ./dist/server.js
```

Build the source and start the service in one command:
```
npm start
```

Build, start and auto restart on source changes:
```
npm run dev
```

## Settings
The behaviour of the watcher service can be configured via environmental variables (env vars).  
`.env` ([dotenv](https://www.npmjs.com/package/dotenv)) file is also supported, to look at the avaialable values and defaults check the [default.env](./default.env) file.  

Refer to the wiki on how to get tokens for:
 * [steam](https://github.com/a-sync/game-server-watcher/wiki/Steam-Web-API-key)
 * [discord](https://github.com/a-sync/game-server-watcher/wiki/Discord-bot-token)
 * [telegram](https://github.com/a-sync/game-server-watcher/wiki/Telegram-bot-token)

## Managing the service
**GSW Control Panel** is a web based UI that let's you configure and control the Game Server Watcher instance.  
The web app is served at `http://localhost:8080` by default.  
_Make sure to configure a proper `SECRET` env var to enable access!_  

### Configuration
Updates the configuration file and restarts the service.

### Flush game servers data
Removes population history data. (configured by _Graph history time span_ server option)

### Flush discord data
If the original message created by the bot gets deleted, you might need to flush the bot data to reinitialize the message.  
_The bot has no cleanup functionality, left over messages must be removed manually._

### Flush telegram data
If the original message created by the bot gets deleted, you need to flush the bot data to reinitialize the message.  
_The bot has no cleanup functionality, left over messages must be removed manually._

# Deployment
Check the wiki page for detailed instructions on [how to setup a self deploying free cloud instance at cloudno.de](https://github.com/a-sync/game-server-watcher/wiki/Free-hosting-via-cloudno.de).
<p align="center">
  <a href="https://heroku.com/deploy?template=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://www.herokucdn.com/deploy/button.svg" height="32" alt="Deploy to Heroku"></a>
  <a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fa-sync%2Fgame-server-watcher%2Fmaster%2Fazuredeploy.json"><img src="https://aka.ms/deploytoazurebutton" height="32" alt="Deploy to Azure"></a>
  <a href="https://deploy.cloud.run?git_repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://deploy.cloud.run/button.svg" height="32" alt="Run on Google Cloud"></a>
  <a href="https://cloud.digitalocean.com/apps/new?repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher%2Ftree%2Fmaster"><img src="https://www.deploytodo.com/do-btn-blue.svg" height="32" alt="Deploy to DigitalOcean"></a>
</p>

## Hosting
Make sure all the [requirements](#requirements) are met!  

### Build artifacts (optional)
```
npm i
npm run build
```

### Minimum required files on host
Copy the `./package.json` and `./index.html` files and the `./dist/` folder to your deployment folder.
 
### Install production dependencies on host
Navigate to the deployment folder and execute the following command:
```
npm i --only=prod
```
_If you can not install dependencies on the host, do a local install and copy the `./node_modules/` folder to the host._

### Configuration
Create a writeable folder for the data storage. (configured by `DATA_PATH` env var, default: `./data/`)  

### Running
Run the program from the deployment folder:
```
node ./dist/server.js
```

# How to Get Help
* Check the [wiki](https://github.com/a-sync/game-server-watcher/wiki)
* Ask a [question](https://github.com/a-sync/game-server-watcher/discussions/new?category=q-a)
* Join the support / test [discord](https://discord.gg/4tsbftsGJz)

# Further Reading
* [gamedig supported games list](https://raw.githubusercontent.com/a-sync/node8-gamedig/master/games.txt)
* [steamDB](https://steamdb.info/apps/)
* [steam web API documentation](https://steamapi.xpaw.me/#IGameServersService/GetServerList)
* [discord API v8 documentation](https://discord.js.org/#/docs/discord.js/v12/class/MessageEmbed)
* [telegram API documentation](https://core.telegram.org/bots/api#editmessagetext)
* [json-editor documentation](https://github.com/json-editor/json-editor#json-schema-support)
    * [json-editor demos](https://pmk65.github.io/jedemov2/dist/demo.html)
* [bootstrap 4 reference](https://www.w3schools.com/bootstrap4/bootstrap_ref_all_classes.asp)
* [mustache documentation](https://github.com/janl/mustache.js#templates)

# Contributing
Public contributions are welcome!  
You can create a [new issue](https://github.com/a-sync/game-server-watcher/issues/new) for bugs, or feel free to open a [pull request](https://github.com/a-sync/game-server-watcher/pulls) for any and all your changes or work-in-progress features.  

# License
This project is licensed under the AGPL License - see [LICENSE](./LICENSE) file for details.

# Authors
Check the list of [contributors](https://github.com/a-sync/game-server-watcher/contributors) who participated in this project.

# Acknowledgments
This project was inpired by (the sudden disappearance of) "_Game Status#5371_" bot and its creator [Ramzi Saheb](https://github.com/Ramzi-Sah) on discord.  

IP regex stolen from the [ip-regex](https://github.com/sindresorhus/ip-regex) package source.  

GSW icon stolen from  _Marvel’s Voices: Indigenous Voices #1_ "_The Watcher_" by [Jeffrey Veregge](https://www.jeffreyveregge.com).  

Backgrounds stolen from [purple nebulas](https://opengameart.org/content/seamless-space-backgrounds) by [Screaming Brain Studios](https://screamingbrainstudios.com) and [imgur](https://imgur.com).  

All other libraries and dependencies are listed in the _package.json file (dependencies/devDependencies section)_ and the _index.html file (head section)_.  

## Similar projects
* https://github.com/soulkobk/DiscordBot_GameStatus
* https://github.com/Douile/discord-gamestatus
* https://github.com/Ramzi-Sah/game-status-discordbot
* https://github.com/Ramzi-Sah/game-status-discordbot-selfhosted  
* https://github.com/msniveau/discord-statusbotv2
* https://github.com/kevinkjt2000/bowser
* https://github.com/negrifelipe/ServerStatusBot
* https://gitlab.com/lxndr-ab/gswatcher
* https://github.com/Unity-Technologies/qstat
* https://github.com/GiyoMoon/steam-server-query
* https://github.com/Fabricio-191/valve-server-query
