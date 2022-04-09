# game-server-watcher
Requirements: [node.js](https://nodejs.org/) _(version 12.20.0 or later)_

# Configuration
//TODO: env vars (`.env` file supported); check [default.env](./default.env)  
//TODO: [config files](./config/default.config.json) schema description  

### Starting the service
Install dependencies: `npm i`  
Build & start program: `npm start`

## The goals of this repo
 1. create a (simple, but capable) service/bot to monitor game servers
    1. get gamedig & steam api server info (_eg.: server name, map, players, etc._)
    1. relay real time server information to various channels via APIs (_eg.: discord, telegram, slack etc._)
 1. should be able to host on a free service (_target atm. is cloudno.de (nodejs 12.20.1)_)
 1. graciously add more features based on community feedback 

Get support on [discord](https://discord.gg/4tsbftsGJz) or on [github](https://github.com/a-sync/game-server-watcher/issues/new).  
More detailed customization options and additional features will be added as requested.  

[SCREENSHOTS](https://github.com/a-sync/game-server-watcher/issues/1#issue-1195221880)

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

# Self host on cloudno.de
You can fork (copy) this repo on github, and automatically deploy your configuration or other changes as a cloud service.

## Part 1: create and setup [cloudno.de](https://cloudno./de) repo
1. register account
1. create app: https://cloudno.de/myapps?new (make sure to set the latest node.js version and leave server.js as entry point)
1. provision app
1. copy https git URL from app 
1. go to profile and save your token (https://cloudno.de/account --> API tokens)
1. add username and token as authentication to the URL like this: `https://username:secrettoken@git.cloudno.de/git/username/xyz`; save it for later use on (github)
1. go to application --> manage --> environment
1. set `DATA_PATH=/mnt/` in cloud app env  
1. go to the forked repo on github: settings --> secrets --> actions and setup `CLOUDNODE_REPO_URL` secret with the full URL

## Part 2 (optional): create and invite discord bot and get token
1. create app (https://discord.com/developers/applications)
1. create bot
1. under the bots name you should seee a token or an option to reset token 
1. check message content intent
1. oauth2 --> url generator --> check bot as scopes; create bot invite link with permissions: view channels, send messages, message history, embed links, add reaction (85056), 
1. invite bot to servers (guilds)
1. create bot auth token, copy it 
1. setup `DISCORD_BOT_TOKEN` in cloud app env
1. //CONFIG: find and copy then setup channel ids in config  

## Part 3 (optional): create telegram bot and get token
//TODO: get token from [botfather](https://t.me/botfather) and setup as `TELEGRAM_BOT_TOKEN` in cloud app env; get chat id from [getidsbot](https://t.me/getidsbot) and setup chat ids in config  

## Part 4 (optional): create steam web api key
[Request a web api key](https://steamcommunity.com/dev/apikey) and configure it as `STEAM_WEB_API_KEY` in cloud app env; set appId fields in config  

## Part 5: create and setup github repo
1. hit fork button
1. repo settings page --> actions --> general: allow all actions (if no confirmation comes up, disable then re-enable all actions)

## Part 6: edit `cloud` branch, configure and deploy the service
_**Protip:** Use the dot (**.**) key to open your code in github.dev web-based editor when browsing github!_  
1. switch to the `cloud` branch of your fork; (`git checkout -b cloud`)
1. create a new config file (and setup `GSW_CONFIG` in cloud app env to point to it) or edit config/default.config.json and save it
1. commit and push your changes (`git add . && git commit -m :shipit: && git push origin cloud`)

You can also just use the _edit this file_ button to make changes to the default config file, just make sure to switch to the `cloud` branch to have it automatically deployed.  

Commiting your changes and pushing your commits to github will trigger github actions to push your files to cloudno.de and restart the service.  

# Manage
A few web endpoints are available to clear out service data.  
Make sure to configure a proper `SECRET` env var to enable these!  

### Servers `/flush/servers/SECRET`
Removes all stored game server data:  
 * population history configured by `PLAYERS_HISTORY_HOURS`

### Telegram `/flush/telegram/SECRET`
The bot has no cleanup functionality, left over messages must be removed manually.  
If the original message created by the bot gets deleted, you need to flush the bot data to reinitialize the message.

### Discord `/flush/discord/SECRET`
The bot has no cleanup functionality, left over messages must be removed manually.  
If the original message created by the bot gets deleted, you might need to flush the bot data to reinitialize the message.

# Development
## Running locally
```
npm i
npm run dev
```

## Nodejs v12 dependency limitations
* [discord.js v12](https://discord.js.org/#/docs/discord.js/v12/general/welcome) (discord API v8)  
* got v11
