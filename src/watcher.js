"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const game_server_1 = require("./game-server");
const discordBot = __importStar(require("./discord-bot"));
const telegramBot = __importStar(require("./telegram-bot"));
const fs_1 = require("fs");
const { readFile } = fs_1.promises;
const REFRESH_TIME_MINUTES = parseInt(process.env.REFRESH_TIME_MINUTES || '1', 10);
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GSW_CONFIG = process.env.GSW_CONFIG || './config/default.config.json';
class Watcher {
    constructor() {
        this.servers = [];
    }
    async init(config) {
        console.log('watcher starting...');
        if (DISCORD_BOT_TOKEN) {
            await discordBot.init(DISCORD_BOT_TOKEN);
        }
        if (TELEGRAM_BOT_TOKEN) {
            await telegramBot.init(TELEGRAM_BOT_TOKEN);
        }
        await (0, game_server_1.initDb)();
        for (const c of config) {
            const gs = new game_server_1.GameServer(c);
            this.servers.push(gs);
        }
    }
    check() {
        console.log('watcher checking...');
        const promises = [];
        for (const gs of this.servers) {
            promises.push(gs.update().then(() => {
                if (DISCORD_BOT_TOKEN) {
                    discordBot.serverUpdate(gs);
                }
                if (TELEGRAM_BOT_TOKEN) {
                    telegramBot.serverUpdate(gs);
                }
            }));
        }
        return Promise.allSettled(promises).then(() => (0, game_server_1.saveDb)());
    }
}
let loop = null;
async function main() {
    console.log('reading config...', GSW_CONFIG);
    const buffer = await readFile(GSW_CONFIG);
    console.log('buffer', buffer.toString());
    try {
    const conf = JSON.parse(buffer.toString());
    const watcher = new Watcher();
    await watcher.init(conf);
    console.log('starting loop...', REFRESH_TIME_MINUTES);
    loop = setInterval(async () => { await watcher.check(); }, 1000 * 60 * REFRESH_TIME_MINUTES);
    await watcher.check();
    } catch (e) {
        console.error(e.message || e);
    }
    // return watcher;
}
exports.main = main;
