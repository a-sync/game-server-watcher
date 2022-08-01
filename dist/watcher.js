"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.main = exports.updateConfig = exports.readConfig = void 0;
const lowdb_1 = require("@commonify/lowdb");
const game_server_1 = require("./game-server");
const discordBot = __importStar(require("./discord-bot"));
const telegramBot = __importStar(require("./telegram-bot"));
const REFRESH_TIME_MINUTES = parseInt(process.env.REFRESH_TIME_MINUTES || '5', 10); //DEPRECETED
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);
const adapter = new lowdb_1.JSONFile(DATA_PATH + 'default.config.json');
const db = new lowdb_1.Low(adapter);
async function readConfig() {
    await db.read();
    return db.data || [];
}
exports.readConfig = readConfig;
async function updateConfig(data) {
    try {
        db.data = data;
        return await db.write();
    }
    catch (e) {
        console.error('w.saveDb', e.message || e);
    }
}
exports.updateConfig = updateConfig;
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
    async check() {
        if (DBG)
            console.log('watcher checking...');
        const promises = [];
        for (const gs of this.servers) {
            promises.push(gs.update().then(async () => {
                if (DISCORD_BOT_TOKEN)
                    await discordBot.serverUpdate(gs);
                if (TELEGRAM_BOT_TOKEN)
                    await telegramBot.serverUpdate(gs);
            }));
        }
        await Promise.allSettled(promises);
        await (0, game_server_1.saveDb)();
    }
}
async function main() {
    await db.read();
    db.data = db.data || [];
    const watcher = new Watcher();
    await watcher.init(db.data);
    console.log('starting loop...');
    const loop = setInterval(async () => { await watcher.check(); }, 1000 * 60 * REFRESH_TIME_MINUTES);
    await watcher.check();
    return loop;
}
exports.main = main;
