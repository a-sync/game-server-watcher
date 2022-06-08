"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverUpdate = exports.init = void 0;
const discord_js_1 = require("discord.js");
const lowdb_1 = require("@commonify/lowdb");
const hhmmss_1 = __importDefault(require("./lib/hhmmss"));
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);
const adapter = new lowdb_1.JSONFile(DATA_PATH + 'discord.json');
const db = new lowdb_1.Low(adapter);
const serverInfoMessages = [];
let bot;
async function init(token) {
    if (!bot) {
        console.log('discord-bot starting...');
        bot = new discord_js_1.Client({
            messageEditHistoryMaxSize: 0,
            ws: { intents: ['GUILDS', 'GUILD_MESSAGES'] }
        });
        bot.on('error', e => {
            console.error('discord-bot ERROR', e.message || e);
        });
        await new Promise((resolve, reject) => {
            bot.once('ready', () => {
                console.log('discord-bot ready', bot.user);
                bot.removeListener('error', reject);
                resolve();
            });
            bot.once('error', reject);
            if (DBG) {
                bot.on('message', msg => {
                    if (msg.content === 'ping') {
                        msg.reply('pong');
                    }
                });
            }
            return bot.login(token);
        });
    }
    serverInfoMessages.length = 0;
    await db.read();
    db.data = db.data || [];
}
exports.init = init;
async function serverUpdate(gs) {
    if (DBG)
        console.log('discord.serverUpdate', gs.config.host, gs.config.port, gs.config.discord);
    if (gs.config.discord) {
        for (const ch of gs.config.discord) {
            let m = await getServerInfoMessage(ch.channelId, gs.config.host, gs.config.port);
            await m.updatePost(gs);
        }
    }
}
exports.serverUpdate = serverUpdate;
async function getServerInfoMessage(cid, host, port) {
    let m = serverInfoMessages.find(n => {
        return n.channelId === cid && n.host === host && n.port === port;
    });
    if (!m) {
        m = new ServerInfoMessage(cid, host, port);
        let msgId;
        if (db.data) {
            const md = db.data.find(d => {
                return d.channelId === cid && d.host === host && d.port === port;
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
class ServerInfoMessage {
    constructor(channelId, host, port) {
        this.messageId = '0';
        this.channelId = channelId;
        this.host = host;
        this.port = port;
    }
    async init(msgId) {
        this.channel = await bot.channels.fetch(this.channelId);
        if (msgId) {
            this.messageId = msgId;
            try {
                this.message = await this.channel.messages.fetch(msgId);
            }
            catch (e) {
                console.error(['discord.init.msg', this.channelId, this.host, this.port].join(':'), e.message || e);
            }
        }
        if (!msgId || !this.message) {
            let embed = new discord_js_1.MessageEmbed();
            embed.setTitle('Initializing server info... ' + (new Date()).toISOString());
            embed.setColor('#00ff00');
            this.message = await this.channel.send({ embed });
            this.messageId = this.message.id;
        }
        if (db.data) {
            const mi = db.data.findIndex(d => {
                return d.channelId === this.channelId && d.host === this.host && d.port === this.port;
            });
            if (mi === -1 || mi === undefined) {
                db.data.push({
                    channelId: this.channelId,
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
                console.error(['discord.init.db', this.channelId, this.host, this.port].join(':'), e.message || e);
            }
        }
    }
    async updatePost(gs) {
        var _a, _b;
        if (!this.message)
            return;
        const embed = new discord_js_1.MessageEmbed();
        embed.setTitle(gs.niceName + ' offline...');
        embed.setColor('#ff0000');
        embed.setFooter('Last updated');
        embed.setTimestamp();
        if (gs.info && gs.online) {
            embed.setTitle(gs.niceName.slice(0, 256));
            embed.setColor('#000000');
            if (gs.info.game)
                embed.addField('Game', gs.info.game, true);
            if (gs.info.map)
                embed.addField('Map', gs.info.map, true);
            embed.addField('Players', gs.info.playersNum + '/' + gs.info.playersMax, true);
            embed.addField('Connect', 'steam://connect/' + gs.info.connect);
            if (((_a = gs.info) === null || _a === void 0 ? void 0 : _a.players.length) > 0) {
                const pNames = [];
                const pTimes = [];
                const pScores = [];
                const pPings = [];
                for (const p of (_b = gs.info) === null || _b === void 0 ? void 0 : _b.players) {
                    if (pNames.join('\n').length > 1016 || pTimes.join('\n').length > 1016 || pScores.join('\n').length > 1016 || pPings.join('\n').length > 1016) {
                        if (pNames.length)
                            pNames.pop();
                        if (pTimes.length)
                            pTimes.pop();
                        if (pScores.length)
                            pScores.pop();
                        if (pPings.length)
                            pPings.pop();
                        break;
                    }
                    if (p.get('name') !== undefined)
                        pNames.push(p.get('name') || 'n/a');
                    if (p.get('time') !== undefined)
                        pTimes.push((0, hhmmss_1.default)(p.get('time') || 0));
                    if (p.get('score') !== undefined)
                        pScores.push(p.get('score') || '0');
                    if (p.get('ping') !== undefined)
                        pPings.push(String(p.get('ping') || 0) + ' ms');
                }
                if (pNames.length)
                    embed.addField('Name', '```\n' + pNames.join('\n').slice(0, 1016) + '\n```', true);
                if (pTimes.length)
                    embed.addField('Time', '```\n' + pTimes.join('\n').slice(0, 1016) + '\n```', true);
                if (pScores.length)
                    embed.addField('Score', '```\n' + pScores.join('\n').slice(0, 1016) + '\n```', true);
                if (pPings.length)
                    embed.addField('Ping', '```\n' + pPings.join('\n').slice(0, 1016) + '\n```', true);
            }
            embed.setImage(gs.history.statsChart(gs.info.playersMax));
        }
        try {
            await this.message.edit(null, { embed });
        }
        catch (e) {
            console.error(['discord.up', this.channelId, this.host, this.port].join(':'), e.message || e);
        }
    }
}
