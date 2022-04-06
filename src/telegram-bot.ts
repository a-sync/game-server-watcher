import { Bot } from 'grammy';
import { Low, JSONFile } from '@commonify/lowdb';
import { GameServer } from './game-server';
import hhmmss from './lib/hhmmss';

const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);

interface TelegramData {
    chatId: string;
    host: string;
    port: number;
    messageId: number;
}

const adapter = new JSONFile<TelegramData[]>(DATA_PATH + 'telegram.json');
const db = new Low<TelegramData[]>(adapter);

const serverInfoMessages: ServerInfoMessage[] = [];

let bot: Bot;
export async function init(token: string) {
    if (!bot) {
        console.log('telegram-bot starting...');
        bot = new Bot(token);

        bot.catch(e => {
            console.error('telegram-bot ERROR', e.message || e);
        });

        const me = await bot.api.getMe();
        console.log('telegram-bot ready', me);

        if(DBG) {
            bot.on('message:text', ctx => {
                if (ctx.message.text === 'ping')
                ctx.reply('pong');
            });
            // bot.command('ping', ctx => ctx.reply('/pong'));
            bot.start();
        }
    }

    serverInfoMessages.length = 0;
    await db.read();
    db.data = db.data || [];
}

async function getServerInfoMessage(cid: string, host: string, port: number) {
    let m = serverInfoMessages.find(n => {
        return n.chatId === cid && n.host === host && n.port === port;
    });

    if (!m) {
        m = new ServerInfoMessage(cid, host, port);

        let msgId;
        if (db.data) {
            const md = db.data.find(d => {
                return d.chatId === cid && d.host === host && d.port === port;
            });
            if (md) {
                msgId = md.messageId;
            }
        }

        await m.init(msgId);

        serverInfoMessages.push(m);
    }

    return m;
}

export async function serverUpdate(gs: GameServer) {
    if (DBG) console.log('telegram.serverUpdate', gs.config.host, gs.config.port, gs.config.telegram);

    for (const cid of gs.config.telegram.chatIds) {
        let m = await getServerInfoMessage(cid, gs.config.host, gs.config.port);
        await m.updatePost(gs);
    }
}

class ServerInfoMessage {
    public chatId: string;
    public host: string;
    public port: number;
    public messageId: number = 0;

    constructor(chatId: string, host: string, port: number) {
        this.chatId = chatId;
        this.host = host;
        this.port = port;
    }

    async init(msgId?: number) {
        if (msgId) {
            this.messageId = msgId;
        } else {
            const msg = await bot.api.sendMessage(this.chatId, 'Initializing server info...');
            this.messageId = msg.message_id;
        }

        if (db.data) {
            const mi = db.data.findIndex(d => {
                return d.chatId === this.chatId && d.host === this.host && d.port === this.port;
            });

            if (mi === -1 || mi === undefined) {
                db.data.push({
                    chatId: this.chatId,
                    host: this.host,
                    port: this.port,
                    messageId: this.messageId
                });
            } else {
                db.data[mi].messageId = this.messageId;
            }

            try {
                await db.write();
            } catch (e: any) {
                console.error(e.message || e);
            }
        }
    }

    async updatePost(gs: GameServer) {
        let infoText = gs.niceName + ' offline...';

        if (gs.info && gs.online) {
            const stats = gs.history.stats();
            let statsText = '';
            if (stats.length > 0) {
                const s = stats.slice(-1).pop();
                if (s) {
                    statsText = ' (hourly avg/max: ' + s.avg.toFixed(1) + '/' + s.max + ') ';
                }
            }

            infoText = [
                gs.niceName,
                gs.info.game + ' / ' + gs.info.map,
                '`' + gs.info.connect + '`',
                'Players ' + gs.info.playersNum + '/' + gs.info.playersMax + statsText
            ].join('\n');

            if (gs.info.players.length > 0) {
                const pnArr: string[] = [];
                for(const p of gs.info.players) {
                    let playerLine = '';
                    if (p.get('time') !== undefined) {
                        playerLine += hhmmss(p.get('time')) + ' ';
                    }
                    if (p.get('name') !== undefined) {
                        playerLine += p.get('name');
                    }
                    if (p.get('score') !== undefined) {
                        playerLine += ' (' + p.get('score') + ')';
                    }
                    pnArr.push(playerLine);
                }
                infoText += '```\n' + pnArr.join('\n').slice(0, 4088 - infoText.length) + '\n```';
            }
        }

        try {
            await bot.api.editMessageText(this.chatId, this.messageId, infoText, {parse_mode: 'Markdown'});
        } catch (e: any) {
            console.log(e.message || e);
        }
    }
}
