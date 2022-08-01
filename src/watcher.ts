import { Type } from 'node8-gamedig';
import { Low, JSONFile } from '@commonify/lowdb';
import { GameServer, initDb, saveDb } from './game-server';
import * as discordBot from './discord-bot';
import * as telegramBot from './telegram-bot';

const REFRESH_TIME_MINUTES = parseInt(process.env.REFRESH_TIME_MINUTES || '5', 10);//DEPRECETED
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);

interface DiscordConfig {
    channelId: string;
}

interface TelegramConfig {
    chatId: string;
}

export interface GameServerConfig {
    name: string;
    type: Type;
    host: string;
    port: number;
    appId?: number;//0
    updateIntervalMinutes?: number;//5
    graphHistoryHours?: number;//12
    timezoneOffset?: number;//0
    discord?: DiscordConfig[],
    telegram?: TelegramConfig[];
}

const adapter = new JSONFile<GameServerConfig[]>(DATA_PATH + 'default.config.json');
const db = new Low<GameServerConfig[]>(adapter);

export async function readConfig(): Promise<GameServerConfig[]> {
    await db.read();
    return db.data || [];
}

export async function updateConfig(data: GameServerConfig[]) {
    try {
        db.data = data;
        return await db.write();
    } catch (e: any) {
        console.error('w.saveDb', e.message || e);
    }
}

class Watcher {
    private servers: GameServer[] = [];

    async init(config: GameServerConfig[]) {
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
            promises.push(gs.update().then(async () => {
                if (DISCORD_BOT_TOKEN) await discordBot.serverUpdate(gs);
                if (TELEGRAM_BOT_TOKEN) await telegramBot.serverUpdate(gs);
            }));
        }

        await Promise.allSettled(promises);
        await saveDb();
    }
}

export async function main() {
    await db.read();
    db.data = db.data || [];

    const watcher = new Watcher();
    await watcher.init(db.data);

    console.log('starting loop...');
    const loop = setInterval(async () => { await watcher.check() }, 1000 * 60 * REFRESH_TIME_MINUTES);
    await watcher.check();

    return loop;
}
