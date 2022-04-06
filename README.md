# game-server-watcher
The goals of this repo:
 1. create a (very simple, but capable) bot to monitor game servers
    1. get gamedig server info
    1. get steam api server info
 1. should be able to host on a free service (target atm: cloudno.de (nodejs v12.20.1))
 1. show and refresh server info via bots (eg.: discord, telegram, slack etc.)

More detailed customization options and additional features will be added as requested.  

Get support on [discord](https://discord.gg/4tsbftsGJz) or on [github](https://github.com/a-sync/game-server-watcher/issues/new).

Possible features / configuration options to add:
 * optional player list
   * with configurable fields. eg.: time,name,ping,score
   * configurable field & order to sort by
   * max length for player names & nr of players
 * custom embed fields for discord
 * configurable timezone for graph x-axis
 * refresh on reaction
 * watched players (notify when a watched player enters/leaves the server)
 * detect server restart, notify when player number crosses a threshold
 * bot commands
 * more integrations: slack, ms teams, twillio (email, sms)

# Configuration
//TODO: env vars  
//TODO: config file schema description

# Self host on cloudno.de
## Part 1: create and setup github repo
//TODO: fork this repo

## Part 2: create and setup cloudno.de repo
//TODO: create app, copy git url & append with `login:token@`; set `DATA_PATH=/mnt/` in cloud app env
// on github: goto settings --> secrets \[actions\], setup `CLOUDNODE_REPO_URL` secret

## Part 3 (optional): create and invite discord bot and get token
//TODO: create discord bot; invite to server(guild) with permissions: view channels, send messages, message history, embed stuff, create bot auth token and setup `DISCORD_BOT_TOKEN` in cloud app env  

## Part 4 (optional): create telegram bot and get token
//TODO: talk to botfather, get chat id: https://t.me/getidsbot, setup bot token as `TELEGRAM_BOT_TOKEN` in cloud app env 

## Part 5 (optional): create steam web api key
//TODO: submit form and create key, setup web key as `STEAM_WEB_API_KEY` in cloud app env 

## Part 6: create `cloud` branch, configure and deploy the service
//TODO: create a custom.config.json file, and setup `GSW_CONFIG` in cloud app env to point to it.  
//git branch cloud && git add . && git commit -m :shipit: && git push origin cloud

# Manage
A few web endpoints are available to clear out service data.  
Make sure to configure a proper `SECRET` env var to enable these!

### Servers `/flush/servers/SECRET`
Removes the stored game server data:  
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
* node8-gamedig
* [discord.js v12](https://discord.js.org/#/docs/discord.js/v12/general/welcome) (discord API v8)  
* got v11
