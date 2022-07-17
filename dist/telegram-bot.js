"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverUpdate = exports.init = void 0;
const grammy_1 = require("grammy");
const lowdb_1 = require("@commonify/lowdb");
const hhmmss_1 = __importDefault(require("./lib/hhmmss"));
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);
const adapter = new lowdb_1.JSONFile(DATA_PATH + 'telegram.json');
const db = new lowdb_1.Low(adapter);
const serverInfoMessages = [];
let bot;
async function init(token) {
    if (!bot) {
        console.log('telegram-bot starting...');
        bot = new grammy_1.Bot(token);
        bot.catch(e => {
            console.error('telegram-bot ERROR', e.message || e);
        });
        const me = await bot.api.getMe();
        console.log('telegram-bot ready', me);
        if (DBG) {
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
exports.init = init;
async function getServerInfoMessage(cid, host, port) {
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
async function serverUpdate(gs) {
    if (DBG)
        console.log('telegram.serverUpdate', gs.config.host, gs.config.port, gs.config.telegram);
    if (gs.config.telegram) {
        for (const ch of gs.config.telegram) {
            let m = await getServerInfoMessage(ch.chatId, gs.config.host, gs.config.port);
            await m.updatePost(gs);
        }
    }
}
exports.serverUpdate = serverUpdate;
class ServerInfoMessage {
    constructor(chatId, host, port) {
        this.messageId = 0;
        this.chatId = chatId;
        this.host = host;
        this.port = port;
    }
    async init(msgId) {
        if (msgId) {
            this.messageId = msgId;
        }
        else {
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
            }
            else {
                db.data[mi].messageId = this.messageId;
            }
            try {
                await db.write();
            }
            catch (e) {
                console.error(['telegram.init.db', this.chatId, this.host, this.port].join(':'), e.message || e);
            }
        }
    }
    async updatePost(gs) {
        let infoText = gs.niceName + ' offline...';
        if (gs.info && gs.online) {
            infoText = [
                this.escapeMarkdown(gs.niceName),
                this.escapeMarkdown(gs.info.game) + ' / ' + this.escapeMarkdown(gs.info.map),
                '`' + gs.info.connect + '`',
                'Players ' + gs.info.playersNum + '/' + gs.info.playersMax
            ].join('\n');
            const chart = '[📊](' + gs.history.statsChart(gs.info.playersMax, gs.config.timezoneOffset) + ')';
            if (gs.info.players.length > 0) {
                const pnArr = [];
                for (const p of gs.info.players) {
                    let playerLine = '';
                    if (p.get('time') !== undefined) {
                        playerLine += (0, hhmmss_1.default)(p.get('time') || '0') + ' ';
                    }
                    if (p.get('name') !== undefined) {
                        playerLine += p.get('name') || 'n/a';
                    }
                    if (p.get('score') !== undefined) {
                        playerLine += ' (' + (p.get('score') || 0) + ')';
                    }
                    pnArr.push(playerLine);
                }
                if (pnArr.length > 0) {
                    infoText += '```\n' + pnArr.join('\n').slice(0, 4088 - infoText.length - chart.length) + '\n```';
                }
            }
            infoText += chart;
        }
        try {
            await bot.api.editMessageText(this.chatId, this.messageId, infoText, { parse_mode: 'Markdown' });
        }
        catch (e) {
            console.error(['telegram.up', this.chatId, this.host, this.port].join(':'), e.message || e);
        }
    }
    escapeMarkdown(str) {
        return str
            .replace(/_/g, '\\_')
            .replace('~', '\\~')
            .replace(/`/g, '\\`')
            .replace(/\</g, '\\<')
            .replace(/\>/g, '\\>');
    }
}
