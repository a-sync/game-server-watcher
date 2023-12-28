import { Client, GatewayIntentBits, TextChannel, Message, EmbedBuilder, APIEmbedField, HexColorString } from 'discord.js';
import { Low, JSONFile } from '@commonify/lowdb';
import { GameServer } from './game-server';
import hhmmss from './lib/hhmmss';
import { DiscordConfig } from './watcher';

const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(Number(process.env.DBG));

interface DiscordData {
    channelId: string;
    host: string;
    port: number;
    messageId: string;
}

const adapter = new JSONFile<DiscordData[]>(DATA_PATH + 'discord.json');
const db = new Low<DiscordData[]>(adapter);

const serverInfoMessages: ServerInfoMessage[] = [];

let bot: Client;
export async function init(token: string) {
    if (!bot) {
        console.log('discord-bot starting...');
        bot = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
        });

        bot.on('error', e => {
            console.error('discord-bot ERROR', e.message || e);
        });

        await new Promise<void>((resolve, reject) => {
            bot.once('ready', () => {
                console.log('discord-bot ready', bot.user);

                bot.removeListener('error', reject);
                resolve();
            });

            bot.once('error', reject);

            if (DBG) {
                bot.on('messageCreate', msg => {
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

export async function serverUpdate(gs: GameServer) {
    if (DBG) console.log('discord.serverUpdate', gs.config.host, gs.config.port, gs.config.discord);

    if (gs.config.discord) {
        for (const conf of gs.config.discord) {
            try {
                let m = await getServerInfoMessage(conf.channelId, gs.config.host, gs.config.port);
                await m.updatePost(gs, conf);
            } catch (e: any) {
                console.error(['discord-bot.sup', conf.channelId, gs.config.host, gs.config.port].join(':'), e.message || e);
            }
        }
    }
}

async function getServerInfoMessage(cid: string, host: string, port: number) {
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
            if (md) msgId = md.messageId;
        }

        await m.init(msgId);

        serverInfoMessages.push(m);
    }

    return m;
}

class ServerInfoMessage {
    public channelId: string;
    public host: string;
    public port: number;
    public messageId: string = '0';
    private channel?: TextChannel;
    private message?: Message;

    constructor(channelId: string, host: string, port: number) {
        this.channelId = channelId;
        this.host = host;
        this.port = port;
    }

    async init(msgId?: string) {
        this.channel = await bot.channels.fetch(this.channelId) as TextChannel;

        if (msgId) {
            this.messageId = msgId;
            try {
                this.message = await this.channel.messages.fetch({ message: msgId });
            } catch (e: any) {
                console.error(['discord.init.msg', this.channelId, this.host, this.port].join(':'), e.message || e);
            }
        }

        if (!msgId || !this.message) {
            let embed = new EmbedBuilder();
            embed.setTitle('Initializing server info... ' + (new Date()).toISOString());
            // embed.setColor('#00ff00');

            this.message = await this.channel.send({ embeds: [embed] });
            this.messageId = this.message.id;
        }

        if (db.data && this.messageId) {
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
            } else db.data[mi].messageId = this.messageId;

            try {
                await db.write();
            } catch (e: any) {
                console.error(['discord.init.db', this.channelId, this.host, this.port].join(':'), e.message || e);
            }
        }
    }

    async updatePost(gs: GameServer, conf: DiscordConfig) {
        if (!this.message) return;

        const embed = new EmbedBuilder();
        const fields: APIEmbedField[] = [];
        embed.setFooter({ text: 'Last updated' });
        embed.setTimestamp();

        const onlineColor = conf.onlineColor || '#000000';
        const offlineColor = conf.offlineColor || '#FF0000';
        const showPlayersList = Boolean(conf.showPlayersList);
        const showGraph = Boolean(conf.showGraph);

        if (showGraph) {
            embed.setImage(gs.history.statsChart());
        }

        if (gs.info && gs.online) {
            embed.setTitle(gs.niceName.slice(0, 256));
            embed.setColor(onlineColor as HexColorString);

            if (gs.info.game) fields.push({ name: 'Game', value: String(gs.info.game), inline: true});
            if (gs.info.map) fields.push({ name: 'Map', value: String(gs.info.map), inline: true});
            fields.push({ name: 'Players', value: String(gs.info.playersNum + '/' + gs.info.playersMax), inline: true});
            fields.push({ name: 'Address', value: String(gs.info.connect)});

            if (showPlayersList && gs.info?.players.length > 0) {
                const pNames: string[] = [];
                const pTimes: string[] = [];
                const pScores: string[] = [];
                const pPings: string[] = [];

                for (const p of gs.info?.players) {
                    if (pNames.join('\n').length > 1016 
                    || pTimes.join('\n').length > 1016 
                    || pScores.join('\n').length > 1016 
                    || pPings.join('\n').length > 1016) {
                        if (pNames.length > 0) pNames.pop();
                        if (pTimes.length > 0) pTimes.pop();
                        if (pScores.length > 0) pScores.pop();
                        if (pPings.length > 0) pPings.pop();
                        break;
                    }

                    if (p.get('name') !== undefined) pNames.push(p.get('name') || 'n/a');
                    if (p.get('time') !== undefined) pTimes.push(hhmmss(p.get('time') || 0));
                    if (p.get('score') !== undefined) pScores.push(p.get('score') || '0');
                    if (p.get('ping') !== undefined) pPings.push(String(p.get('ping') || 0) + ' ms');
                }

                if (pNames.length > 0) fields.push({ name: 'Name', value: '```\n' + pNames.join('\n').slice(0, 1016) + '\n```', inline: true});
                if (pTimes.length > 0) fields.push({ name: 'Time', value: '```\n' + pTimes.join('\n').slice(0, 1016) + '\n```', inline: true});
                if (pScores.length > 0) fields.push({ name: 'Score', value: '```\n' + pScores.join('\n').slice(0, 1016) + '\n```', inline: true});
                if (pPings.length > 0) fields.push({ name: 'Ping', value: '```\n' + pPings.join('\n').slice(0, 1016) + '\n```', inline: true});
            }
        } else {
            embed.setTitle(gs.niceName.slice(0, 245) + ' offline...');
            embed.setColor(offlineColor as HexColorString);
        }

        embed.setFields(fields);

        try {
            await this.message.edit({ embeds: [embed] });
        } catch (e: any) {
            console.error(['discord.up', this.channelId, this.host, this.port].join(':'), e.message || e);
        }
    }
}
