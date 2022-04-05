import { Type } from 'gamedig';
import { GameServer, initDb, saveDb } from './game-server';
import * as discordBot from './discord-bot';
import * as telegramBot from './telegram-bot';
import { promises as fs } from 'fs';
const { readFile } = fs;

const REFRESH_TIME_MINUTES = parseInt(process.env.REFRESH_TIME_MINUTES || '5', 10);
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GSW_CONFIG = process.env.GSW_CONFIG || './config/default.config.json';
const DBG = Boolean(process.env.DBG || false);

export interface WatcherConfig {
    host: string;
    port: number;
    type: Type;
    appId: number;
    discord: {
        channelIds: string[]
    },
    telegram: {
        chatIds: string[];
    }
}

class Watcher {
    private servers: GameServer[] = [];

    async init(config: WatcherConfig[]) {
        console.log('watcher starting...');

        if (DISCORD_BOT_TOKEN) {
            await discordBot.init(DISCORD_BOT_TOKEN);
        }

        if (TELEGRAM_BOT_TOKEN) {
            await telegramBot.init(TELEGRAM_BOT_TOKEN);
        }

        await initDb();

        for (const c of config) {
            const gs = new GameServer(c);
            this.servers.push(gs);
        }
    }

    async check() {
        if (DBG) console.log('watcher checking...');

        const promises: Promise<void>[] = [];
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

        await Promise.allSettled(promises);
        await saveDb();
    }
}

let loop = null;
export async function main() {
    console.log('reading config', GSW_CONFIG);
    const buffer = await readFile(GSW_CONFIG);
    const conf = JSON.parse(buffer.toString());

    const watcher = new Watcher();
    await watcher.init(conf);

    console.log('starting loop...', REFRESH_TIME_MINUTES);
    loop = setInterval(async () => { await watcher.check() }, 1000 * 60 * REFRESH_TIME_MINUTES);
    await watcher.check();
    // return watcher;
}
