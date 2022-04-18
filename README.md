# Game Server Watcher
A simple discord/telegram bot that can be hosted on a free service to monitor your game servers and players in style. 😎  

## Table of Contents
1. [About the Project](#about-the-project)
1. [Project Status](#project-status)
1. [Getting Started](#getting-started)
	1. [Requirements](#requirements)
	1. [Installation](#installation)
	1. [Usage](#usage)
	1. [Configuration](#configuration)
	1. [Managing the service](#managing-the-service)
1. [Deployment](#deployment)
1. [How to Get Help](#how-to-get-help)
1. [Further Reading](#further-reading)
1. [Contributing](#contributing)
1. [License](#license)
1. [Authors](#authors)
1. [Acknowledgments](#acknowledgments)

# About the Project
The main goals of this repo:
 1. create a (simple, but capable) service/bot to monitor game servers
    1. get gamedig & steam api server info (_eg.: server name, map, players, etc._)
    1. relay real time server information to various channels via APIs (_eg.: discord, telegram, slack etc._)
 1. should be able to host on a free service (_target atm. is cloudno.de (nodejs 12.20.1)_)
 1. graciously add more features based on community feedback ([discord](https://discord.gg/4tsbftsGJz) / [github](https://github.com/a-sync/game-server-watcher/discussions/new?category=ideas-requests)) 

## Screenshots
### Discord
![discord](https://user-images.githubusercontent.com/14183614/162092529-e1645b44-2650-4893-8123-7ba187b1f51c.png)

### Telegram
![telegram](https://user-images.githubusercontent.com/14183614/162092488-f28bd60c-88bf-4b1e-a31e-d7dca51d8c28.png)

**[Back to top](#table-of-contents)**

# Project Status
The code itself is stable and continuously tested/deployed from the cloud branch.  

The project is in a very early stage. More detailed customization options and additional features will be added as requested.  

### Possible features and configuration options to add in the future
 * optional player list
   * with configurable fields. eg.: time,name,ping,score
   * configurable field & order to sort by
   * max length for player names & nr of players
 * custom embed fields for discord
 * configurable timezone for graph x-axis
 * refresh on reaction
 * watched players (notify when a watched player enters/leaves the server)
 * detect server restart, notify when player number crosses a threshold
 * bot commands (reinit message, cleanup, start/stop, configure)
 * more integrations: slack, ms teams, twillio (email, sms)
 * web ui to manage & configure the servers and bots
 * put custom information in the channel name (online status indicator, number of players, map)
 * github action workflows to deploy to other cloud providers (azure, aws, etc.)

**[Back to top](#table-of-contents)**

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.  

## Requirements
[node.js](https://nodejs.org/) _(version 12.20.0 or later)_  

## Getting the Source
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

If you don't need to build the source, you can skip development dependencies:  
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

## Configuration
The watcher service can be configured via environmental variables. `.env` ([dotenv](https://www.npmjs.com/package/dotenv)) file is also supported, for avaialable values and defaults check the [default.env](./default.env) file.  

Refer to the wiki on how to get tokens for:
 * [steam](https://github.com/a-sync/game-server-watcher/wiki/Steam-Web-API-key)
 * [discord](https://github.com/a-sync/game-server-watcher/wiki/Discord-bot-token)
 * [telegram](https://github.com/a-sync/game-server-watcher/wiki/Telegram-bot-token)

### Config file schema
The game server and bot configurations are stored in JSON files.  
The path of the config file used is defined by the `GSW_CONFIG` env var. (default: `./config/default.config.json`)  

The config file must be a valid JSON file that holds a list (array) of game server configuration objects.  

<details>
<summary>example config JSON</summary>
	
```json
[
    {
        "host": "localhost",
        "port": 1234,
        "type": "gamedigID",
        "appId": 0,
        "discord": {
            "channelIds": ["9876543210","9080706050"]
        },
        "telegram": {
            "chatIds": ["-100987654"]
        }
    },
    {
        "host": "127.0.0.1",
        "port": 54321,
        "type": "gamedigID",
        "appId": 0,
        "discord": {
            "channelIds": ["9008006007"]
        },
        "telegram": {
            "chatIds": []
        }
    }
]
```
</details>  

More sample configs are available in the [config folder](./config).

Each configuration object describes a game server (host, port, gamedig id, steam app id) and all the bots options for that game server. (discord options, telegram options)  

#### host
**String.** Can be a domain name or IP.

#### port
**Number.** The port used by the game server instance.

#### type
**String.** Gamedig ID from the [supported games list](https://raw.githubusercontent.com/a-sync/node8-gamedig/master/games.txt).

#### appId
**Number.** Steam app ID from [steamdb](https://steamdb.info/apps/).  
_Only used if you have `STEAM_WEB_API_KEY` configured and only as backup.  
Set it to `0` if you don't need it._

#### discord.channelIds
String array. List of discord channel IDs.  
_Only used if you have `DISCORD_BOT_TOKEN` configured._

#### telegram.chatIds
String array. List of telegram chat IDs.  
_Only used if you have `TELEGRAM_BOT_TOKEN` configured._

## Managing the service
A few web endpoints are available to clear out service data.  
Make sure to configure a proper `SECRET` env var to enable these!  

### Servers data
GET `/flush/servers/SECRET`  
Removes population history data. (configured by `PLAYERS_HISTORY_HOURS`)

### Telegram data
GET `/flush/telegram/SECRET`  
If the original message created by the bot gets deleted, you need to flush the bot data to reinitialize the message.  
The bot has no cleanup functionality, left over messages must be removed manually.

### Discord data
GET `/flush/discord/SECRET`  
If the original message created by the bot gets deleted, you might need to flush the bot data to reinitialize the message.  
The bot has no cleanup functionality, left over messages must be removed manually.

**[Back to top](#table-of-contents)**

# Deployment
Check the wiki page for detailed instructions on [how to setup a self deploying free cloud instance at cloudno.de](https://github.com/a-sync/game-server-watcher/wiki/Free-hosting-via-cloudno.de).  

## Hosting
Make sure all the requirements are met!  
_**Protip:** check the node.js version with `node -v`._  

### Build artifacts (optional)
```
npm i
npm run build
```

### Minimum required files on host
Copy the `./package.json` and `index.html` files and the `./dist/` folder to your deployment folder.
 
### Install production dependencies on host
Navigate to the deployment folder and execute the following command:
```
npm i --only=prod
```

### Configuration
Create a writeable folder for the data storage. (configured by `DATA_PATH` env var, default: `./data/`)  
Create a configuration file. (configured by `GSW_CONFIG`, default: `./config/default.config.json`)

### Running
Run the program from the deployment folder:
```
node ./dist/server.js
```

**[Back to top](#table-of-contents)**

# How to Get Help
* Join the support / test [discord](https://discord.gg/4tsbftsGJz)
* Check the [wiki](https://github.com/a-sync/game-server-watcher/wiki)
* Ask a [question](https://github.com/a-sync/game-server-watcher/discussions/new?category=q-a)

**[Back to top](#table-of-contents)**

# Further Reading
* [gamedig supported games list](https://raw.githubusercontent.com/a-sync/node8-gamedig/master/games.txt)
* [steam web API documentation](https://steamapi.xpaw.me/#IGameServersService/GetServerList)
* [discord API v8 documentation](https://discord.js.org/#/docs/discord.js/v12/class/MessageEmbed)  
* [telegram API documentation](https://core.telegram.org/bots/api#editmessagetext)
* [JSON validator](https://jsonformatter.org/)
* [steamDB](https://steamdb.info/apps/)

**[Back to top](#table-of-contents)**

# Contributing
Public contributions are welcome!  
Create a [new issue](https://github.com/a-sync/game-server-watcher/issues/new) for bugs, or open a [pull request](https://github.com/a-sync/game-server-watcher/pulls) for any and all your changes.  

**[Back to top](#table-of-contents)**

# License
This project is licensed under the AGPL License - see [LICENSE](./LICENSE) file for details.

**[Back to top](#table-of-contents)**

# Authors
Check the list of [contributors](https://github.com/a-sync/game-server-watcher/contributors) who participated in this project.

**[Back to top](#table-of-contents)**

# Acknowledgments
This project was inpired by (the sudden disappearance of) "_Game Status#5371_" bot and its creator [Ramzi Saheb](https://github.com/Ramzi-Sah) on discord.  

The IP regex was stolen from the [ip-regex](https://github.com/sindresorhus/ip-regex) package source.

## Similar projects
https://github.com/soulkobk/DiscordBot_GameStatus  
https://github.com/discord-gamestatus/discord-gamestatus  
https://github.com/Ramzi-Sah/game-status-discordbot  
https://github.com/Ramzi-Sah/game-status-discordbot-selfhosted  

**[Back to top](#table-of-contents)**
