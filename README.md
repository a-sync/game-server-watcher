# game-server-watcher
The goals of this repo:
 1. create a (very simple, but capable) bot to monitor game servers
    1. get gamedig server info
    1. get steam api server info
 1. should be able to host on a free service (target atm: cloudno.de (nodejs v12.20.1))
 1. discord bot (show and refresh server info (on command?))
 1. telegram bot (send updates (on command?))

# Self host on cloudno.de
## Part 1: create and setup github repo
//TODO: fork this repo

## Part 2: create and setup cloudno.de repo
//TODO: create app, copy git url & append with `login:token@`
// on github: goto settings --> secrets \[actions\], setup CLOUDNODE_REPO_URL

## Part 3 (optional): create and invite discord bot
//TODO: create discord bot; invite to server(guild) with permissions: view channels, send messages, message history, embed stuff, create bot auth token and setup DISCORD_BOT_TOKEN in cloud app env  

## Part 4 (optional): create telegram bot and get token
//TODO: talk to botfather, get chat id: https://t.me/getidsbot, setup bot token as TELEGRAM_BOT_TOKEN in cloud app env 

## Part 5 (optional): create steam web api key
//TODO: submit form and create key, setup web key as STEAM_WEB_API_KEY in cloud app env 

## Part 6: create `cloud` branch, configure and deploy the service
//TODO: create a custom.config.json file, and setup GSW_CONFIG in cloud app env to point to it.
//git branch cloud && git add . && git commit -m :shipit: && git push origin cloud
