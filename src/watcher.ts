import { Type } from 'gamedig';
import { Low, JSONFile } from '@commonify/lowdb';
import { GameServer, initDb, saveDb } from './game-server';
import * as discordBot from './discord-bot';
import * as telegramBot from './telegram-bot';
import * as slackBot from './slack-bot';

const REFRESH_TIME_MINUTES = parseInt(process.env.REFRESH_TIME_MINUTES || '2', 10);
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN || '';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(Number(process.env.DBG));

export interface DiscordConfig {
    channelId: string;
    showPlayersList?: boolean;
    onlineColor?: string;
    offlineColor?: string;
    showGraph?: boolean;
}

export interface TelegramConfig {
    chatId: string;
    showPlayersList?: boolean;
    showGraph?: boolean;
}

export interface SlackConfig {
    channelId: string;
    showPlayersList?: boolean;
    showGraph?: boolean;
}

export interface GameServerConfig {
    name: string;
    appId?: number;//0
    updateIntervalMinutes?: number;//5
    graphHistoryHours?: number;//12
    timezoneOffset?: number;//0
    discord?: DiscordConfig[];
    telegram?: TelegramConfig[];
    slack?: SlackConfig[];

    // node-gamedig stuff
    type: Type;
    host: string;
    port: number;
    givenPortOnly?: boolean;
    // Valve
    requestRules?: boolean;
    requestRulesRequired?: boolean;
    requestPlayersRequired?: boolean;
    // Discord
    guildId?: string;
    // Nadeo
    login?: string;
    password?: string;
    // Teamspeak 3
    teamspeakQueryPort?: number;
    // Terraria
    token?: string;
    // Generic    
    serverPassword?: string;
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
        console.error('w.updateConfig', e.message || e);
    }
}

class Watcher {
    private servers: GameServer[] = [];

    async init(config: GameServerConfig[]) {
        console.log('watcher starting...');

        if (DISCORD_BOT_TOKEN) await discordBot.init(DISCORD_BOT_TOKEN);
        if (TELEGRAM_BOT_TOKEN) await telegramBot.init(TELEGRAM_BOT_TOKEN);
        if (SLACK_BOT_TOKEN && SLACK_APP_TOKEN) await slackBot.init(SLACK_BOT_TOKEN, SLACK_APP_TOKEN);

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
                if (SLACK_BOT_TOKEN && SLACK_APP_TOKEN) await slackBot.serverUpdate(gs);
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

    console.log('starting loop...'); // Note: pterodactyl depends on this
    const loop = setInterval(async () => {
        await watcher.check();
    }, 1000 * 60 * REFRESH_TIME_MINUTES);
    await watcher.check();

    return loop;
}
