import { Bot } from 'grammy';
import { GameServer } from './game-server';
import hhmmss from './lib/hhmmss';
import { Low, JSONFile } from '@commonify/lowdb';

const DATA_PATH = process.env.DATA_PATH || './data/';

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
    console.log('telegram-bot starting...');
    bot = new Bot(token);

    const me = await bot.api.getMe();
    console.log('telegram-bot ready', me);

    // bot.on('message:text', ctx => {ctx.reply('echo: ' + ctx.message.text);});
    // bot.command('start', ctx => ctx.reply('cmd.start.response'));
    // bot.start();

    await db.read();
    db.data = db.data || [];

    return;
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
    if (!gs.info) return;

    console.log('telegram.serverUpdate', gs.config.host, gs.config.port, gs.config.telegram);

    for (const cid of gs.config.telegram.chatIds) {
        let m = await getServerInfoMessage(cid, gs.config.host, gs.config.port);

        const stats = gs.history.stats();
        let statsText = '';
        if (stats.length > 0) {
            const s = stats.pop();
            if (s) {
                statsText = ' (hourly max: ' + s.max + ', hourly avg: ' + s.avg.toFixed(1) + ')';
            }
        }

        const infoText: string[] = [
            gs.niceName,
            gs.info.game + ' / ' + gs.info.map,
            gs.info.connect,
            'Players ' + gs.info.playersNum + '/' + gs.info.playersMax + statsText
        ];

        if (gs.info?.players.length > 0) {
            infoText.push('```');
            for(const p of gs.info?.players) {
                let playerLine = '';
                if (p.raw?.time !== undefined) {
                    playerLine += '[' + hhmmss(p.raw.time) + '] ';
                }
                playerLine += p.name;
                if (p.raw?.score !== undefined) {
                    playerLine += ' [score: ' + p.raw.score + ']';
                }
                infoText.push(playerLine);
            }
            infoText.push('```');
        }

        m.setText(infoText.join('\n'));
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

            await db.write();
        }
    }

    async setText(text: string) {
        console.log('setText', this.host, this.port);
        try {
            await bot.api.editMessageText(this.chatId, this.messageId, text, {parse_mode: 'Markdown'});
        } catch (e: any) {
            console.log(e.message || e);
        }
    }
}
