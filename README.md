# game-server-watcher
## The goals of this repo
 1. create a (simple, but capable) service/bot to monitor game servers
    1. get gamedig & steam api server info (_eg.: server name, map, players, etc._)
    1. relay real time server information to various channels via APIs (_eg.: discord, telegram, slack etc._)
 1. should be able to host on a free service (_target atm. is cloudno.de (nodejs v12.20.1)_)
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

# Configuration
//TODO: env vars  
//TODO: config file schema description

# Self host on cloudno.de
You can fork (copy) this repo on github, and automatically deploy your configuration or other changes as a cloud service.

## Part 1: create and setup github repo
//TODO: fork this repo

## Part 2: create and setup cloudno.de repo
//TODO: create app, copy git url & append with `login:token@`; set `DATA_PATH=/mnt/` in cloud app env  
// on github: goto settings --> secrets \[actions\], setup `CLOUDNODE_REPO_URL` secret

## Part 3 (optional): create and invite discord bot and get token
//TODO: [create discord bot](https://discord.com/developers/applications); invite to server(guild) with permissions: view channels, send messages, message history, embed stuff, create bot auth token and setup `DISCORD_BOT_TOKEN` in cloud app env; find and copy then setup channel ids in config  

## Part 4 (optional): create telegram bot and get token
//TODO: get token from [botfather](https://t.me/botfather) and setup as `TELEGRAM_BOT_TOKEN` in cloud app env; get chat id from [getidsbot](https://t.me/getidsbot) and setup chat ids in config  

## Part 5 (optional): create steam web api key
//TODO: [request](https://steamcommunity.com/dev/apikey) a web api key and setup as `STEAM_WEB_API_KEY` in cloud app env; set appId fields in config  

## Part 6: create `cloud` branch, configure and deploy the service
//TODO: create a custom.config.json file, and setup `GSW_CONFIG` in cloud app env to point to it  
//create a branch named cloud, commit your changes and push your commits to github; github actions will push your files to cloudno.de and restart the app `git branch cloud && git add . && git commit -m :shipit: && git push origin cloud`

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
