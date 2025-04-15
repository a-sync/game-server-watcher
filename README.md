# <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/66a8ffa8-c547-4f9c-b312-4c855da80c20" width="40" align="left"> Game Server Watcher
A simple discord/telegram/slack bot that can be hosted on a free service to monitor your game servers and players in style. 😎  

# About the Project
The main goals of this repo:
 1. create a (simple, but capable) service/bot to monitor game servers
    1. get gamedig & steam api server info (_eg.: server name, map, players, etc._)
    1. relay real time server information to various channels via APIs (_eg.: discord, telegram, slack etc._)
 1. should be able to host on a free service (_target atm. is fly.io (node.js 20)_)
 1. graciously add more features based on community feedback via [discord <img src="https://cdn.discordapp.com/icons/935911764023996527/1b791c9533f24a6bc23dbf5b2c134436.png?size=20" width="20" align="absmiddle" title="ACME Corp." alt="">](https://discord.gg/4tsbftsGJz) and [github :octocat:](https://github.com/a-sync/game-server-watcher/discussions/new?category=ideas-requests)

# Screenshots
<img src="https://user-images.githubusercontent.com/14183614/162092529-e1645b44-2650-4893-8123-7ba187b1f51c.png" height="520"> <img src="https://user-images.githubusercontent.com/14183614/162092488-f28bd60c-88bf-4b1e-a31e-d7dca51d8c28.png" height="520"> <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/0461ad76-bb13-468c-a7b3-437d6a3cea63" height="520"> <img src="https://github.com/a-sync/game-server-watcher/assets/14183614/ee0ef0de-83bc-42ae-8f64-62f481f6ba8f" height="520"> 

# Project Status
The code itself is stable and continuously tested/deployed from the master branch.  

The project is in a mature stage. New customization options and features are added as requested.  

### Possible features and configuration options to add in the future
 * ~~optional player list~~
   * customizable fields (time, name, ping, score)
   * configurable field & order to sort by
   * max length for player names & nr of players
 * ~~optional graph chart~~
 * custom embed fields for discord/slack
 * ~~configurable time zone offset for graph x-axis~~
 * refresh on reaction
 * watched players (notify when a watched player enters/leaves the server)
 * detect when the server goes offline, notify when player number crosses a threshold
 * bot commands (reinit message, cleanup, start/stop, post server status, configure)
 * more integrations: ~~telegram~~, ~~slack~~, ms teams, twillio (email, sms)
 * ~~web ui to manage & configure the servers and bots~~
 * put custom information in the channel name or bot status (online status indicator, number of players, map)
 * github action workflows to deploy to other cloud providers (aws, linode, atlantic, vultr, pikapods, okteto, ibm cloud etc.)
 * SQL, JSON or object store database support (postgres, redis etc.)
 * run as stateless serverless function (aws lambda, azure function, heroku, vercel, fly.io machines etc.)
 * ~~pterodactyl/pelican egg release~~

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.  

## Requirements
[node.js](https://nodejs.org/) _(version 16.20.0 or later)_  

## Getting the source
This project is [hosted on github](https://github.com/a-sync/game-server-watcher). You can clone this project directly using this command:

```
git clone git@github.com:a-sync/game-server-watcher.git
```

The latest source can also be downloaded as a [zip archive](https://github.com/a-sync/game-server-watcher/archive/refs/heads/master.zip).  

## Installation
Use npm or yarn to install/update all the dependencies:
```
npm i
```

Build the artifacts from source:
```
npm run build
```

## Usage
Start the built artifacts:
```
npm start
```

Build, start and auto restart on source changes:
```
npm run dev
```

## Settings
The behaviour of the watcher service can be configured via environmental variables (env vars).  
`.env` ([dotenv](https://www.npmjs.com/package/dotenv)) file is also supported, to look at the available values and defaults check the [.env.example](./.env.example) file.  
To get started, you can simply rename the `.env.example` file to `.env`.  

Refer to the wiki on how to acquire tokens for:
 * [steam](https://github.com/a-sync/game-server-watcher/wiki/Steam-Web-API-key)
 * [discord](https://github.com/a-sync/game-server-watcher/wiki/Discord-bot-token)
 * [telegram](https://github.com/a-sync/game-server-watcher/wiki/Telegram-bot-token)
 * [slack](https://github.com/a-sync/game-server-watcher/wiki/Slack-bot-token)

## Managing the service
**GSW Control Panel** is a web based UI that let's you configure and control the Game Server Watcher instance.  
The web app is served at `http://localhost:8080` by default.  
_Make sure to configure the `SECRET` env var!_  

### Configuration
Updates the configuration file and restarts the service.

### Flush data
#### Flush game servers data
Removes population history data. (configured by _Graph history time span_ server option)

#### Flush discord data
If the original message created by the bot gets deleted, you might need to flush the bot data to reinitialize the message.  
_The bot has no cleanup functionality, leftover messages must be removed manually._

#### Flush telegram data
If the original message created by the bot gets deleted, you need to flush the bot data to reinitialize the message.  
_The bot has no cleanup functionality, leftover messages must be removed manually._

#### Flush slack data
If the original message created by the bot gets deleted, you need to flush the bot data to reinitialize the message.  
_The bot has no cleanup functionality, leftover messages must be removed manually._

# Deployment
Check the wiki page for detailed instructions on [how to setup a self deploying free cloud instance at fly.io](https://github.com/a-sync/game-server-watcher/wiki/Free-hosting-via-fly.io).  
The latest Pterodactyl and Pelican eggs can always be found here: [🥚](./eggs/).  
Pre-built container images can be downloaded from the github container registry: `docker pull ghcr.io/a-sync/game-server-watcher`  
<p align="center">
  <!--<a href="https://app.koyeb.com/deploy?type=git&repository=github.com/a-sync/game-server-watcher&branch=master&name=gsw"><img src="https://www.koyeb.com/static/images/deploy/button.svg" height="32" alt="Deploy to Koyeb"></a>//TODO: support ephemeral storage-->
  <!--<a href="https://heroku.com/deploy?template=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://www.herokucdn.com/deploy/button.svg" height="32" alt="Deploy to Heroku"></a>//TODO: support ephemeral storage-->
  <a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fa-sync%2Fgame-server-watcher%2Fmaster%2Fazuredeploy.json"><img src="https://aka.ms/deploytoazurebutton" height="32" alt="Deploy to Azure"></a>
  <a href="https://deploy.cloud.run?git_repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher"><img src="https://deploy.cloud.run/button.svg" height="32" alt="Run on Google Cloud"></a>
  <a href="https://cloud.digitalocean.com/apps/new?repo=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher%2Ftree%2Fmaster"><img src="https://www.deploytodo.com/do-btn-blue.svg" height="32" alt="Deploy to DigitalOcean"></a>
  <!--<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fa-sync%2Fgame-server-watcher&env=SECRET"><img src="https://vercel.com/button" height="32" alt="Deploy with Vercel"></a>//TODO: support runnig as serverless function-->
  <!--<a href="https://stackblitz.com/fork/github/a-sync/game-server-watcher"><img src="https://developer.stackblitz.com/img/open_in_stackblitz.svg" height="32" alt="Open in StackBlitz"></a>-->
</p>

## Hosting via Docker Compose
Make sure to configure the environment variables in [docker-compose.yml](./docker-compose.yml#L13).  
```
docker-compose up
```

## Hosting via NodeJS runtime
Make sure all the [requirements](#requirements) are met!  

### Build artifacts
```
npm i
npm run build
```

### Minimum required files on host
Copy the `./package.json` file and the `./public/` and `./dist/` folders and their contents to your deployment folder.
 
### Install production dependencies on host
Navigate to the deployment folder and execute the following command:
```
npm i --only=prod
```
_If you can not install dependencies on the host, do a local install and copy the `./node_modules/` folder to the host._

### Service configuration
Create environmental variables to enable the required features and to customize the service.  
1. Make sure the service can write to the data storage path. (configured by `DATA_PATH` env var, default: `./data/`)  
2. Make sure you create a unique admin secret. (configured by `SECRET` env var, default: `secret`)

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
* [gamedig supported games list](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md)
* [steamDB](https://steamdb.info/apps/)
* [steam web API documentation](https://steamapi.xpaw.me/#IGameServersService/GetServerList)
* [discord API v10 documentation](https://discord.js.org/#/docs/discord.js/14.7.1/class/EmbedBuilder)
* [telegram API documentation](https://core.telegram.org/bots/api#editmessagetext)
* [slack API documentation](https://api.slack.com/apis)
    * [block kit reference](https://api.slack.com/reference/block-kit#reference)
* [json-editor documentation](https://github.com/json-editor/json-editor#json-schema-support)
    * [json-editor demos](https://pmk65.github.io/jedemov2/dist/demo.html)
* [bootstrap 4 reference](https://www.w3schools.com/bootstrap4/bootstrap_ref_all_classes.asp)
* [mustache documentation](https://github.com/janl/mustache.js#templates)
* [pterodactyl documentation](https://pterodactyl.io/community/config/eggs/creating_a_custom_egg.html)
    * [community docu fork](https://quintenqvd0.github.io/pterodactyl-documentation/docs/eggs/egg/)

# Contributing
Public contributions are welcome!  
You can create a [new issue](https://github.com/a-sync/game-server-watcher/issues/new) for bugs, or feel free to open a [pull request](https://github.com/a-sync/game-server-watcher/pulls) for any and all your changes or work-in-progress features.

# License
This project is licensed under the [AGPL License](./LICENSE.md) by default for public use. Businesses or organizations seeking a commercial license, please contact gsw@devs.space.

# Authors
Check the list of [contributors](https://github.com/a-sync/game-server-watcher/contributors) who participated in this project.

# Acknowledgments
This project was inspired by (the sudden disappearance of) "_Game Status#5371_" bot and its creator [Ramzi Saheb](https://github.com/Ramzi-Sah) on discord.  

GSW icon stolen from _Marvel’s Voices: Indigenous Voices #1_ "_The Watcher_" by [Jeffrey Veregge](https://www.jeffreyveregge.com).  

Backgrounds stolen from [purple nebulas](https://opengameart.org/content/seamless-space-backgrounds) by [Screaming Brain Studios](https://screamingbrainstudios.com) and [imgur](https://imgur.com).  

All other libraries and dependencies are listed in the _package.json file (dependencies/devDependencies section)_ and the _index.html file (head section)_.  

## Similar projects
* https://github.com/soulkobk/DiscordBot_GameStatus
* https://github.com/Douile/discord-gamestatus
* https://github.com/Ramzi-Sah/game-status-discordbot
* https://github.com/Ramzi-Sah/game-status-discordbot-selfhosted  
* https://github.com/msniveau/discord-statusbot
* https://github.com/kevinkjt2000/bowser
* https://github.com/negrifelipe/ServerStatusBot
* https://gitlab.com/lxndr/gswatcher
* https://github.com/Unity-Technologies/qstat
* https://github.com/GiyoMoon/steam-server-query
* https://github.com/Fabricio-191/valve-server-query
* https://github.com/sbuggay/srcds-info-proxy
* https://github.com/DiscordGSM/DiscordGSM
* https://github.com/EndBug/game-tracker
* https://github.com/fasko-web/discord-gameserver-bots
* https://github.com/FlorianSW/discord-player-count-bot
* https://github.com/Destarianon/FawxGameDigBot
* https://github.com/patriksh/gameserver-bot
