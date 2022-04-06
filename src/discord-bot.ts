
import { Client, MessageEmbed, TextChannel, Message } from 'discord.js';
import { Low, JSONFile } from '@commonify/lowdb';
import { GameServer } from './game-server';
import hhmmss from './lib/hhmmss';

const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);

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
            messageEditHistoryMaxSize: 0,
            ws: { intents: ['GUILDS', 'GUILD_MESSAGES'] }
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

export async function serverUpdate(gs: GameServer) {
    if (DBG) console.log('discord.serverUpdate', gs.config.host, gs.config.port, gs.config.discord);

    for (const cid of gs.config.discord.channelIds) {
        let m = await getServerInfoMessage(cid, gs.config.host, gs.config.port);
        await m.updatePost(gs);
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
                this.message = await this.channel.messages.fetch(msgId);
            } catch (e: any) {
                console.error(['discord.init.msg',this.channelId,this.host,this.port].join(':'), e.message || e);
            }
        }

        if (!msgId || !this.message) {
            let embed = new MessageEmbed();
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
            } else {
                db.data[mi].messageId = this.messageId;
            }

            try {
                await db.write();
            } catch (e: any) {
                console.error(['discord.init.db',this.channelId,this.host,this.port].join(':'), e.message || e);
            }
        }
    }

    async updatePost(gs: GameServer) {
        if (!this.message) return;

        const embed = new MessageEmbed();
        embed.setTitle(gs.niceName + ' offline...');
        embed.setColor('#ff0000');
        embed.setFooter('Last updated');
        embed.setTimestamp();

        if (gs.info && gs.online) {
            embed.setTitle(gs.niceName.slice(0, 256));
            embed.setColor('#000000');

            embed.addField('Game', gs.info.game, true);
            embed.addField('Map', gs.info.map, true);
            embed.addField('Players', gs.info.playersNum + '/' + gs.info.playersMax, true);
            embed.addField('Connect', 'steam://connect/' + gs.info.connect);

            if (gs.info?.players.length > 0) {
                const pNames: string[] = [];
                const pTimes: string[] = [];
                const pScores: string[] = [];
                let c = 0;
                for (const p of gs.info?.players) {
                    c++;
                    pNames.push(p.get('name') || 'n/a');
                    pTimes.push(hhmmss(p.get('time') || 0));
                    pScores.push(p.get('score') || '0');
                }

                embed.addField('Name', '```\n' + pNames.join('\n').slice(0, 1016) + '\n```', true);
                embed.addField('Score', '```\n' + pScores.join('\n').slice(0, 1016) + '\n```', true);
                embed.addField('Time', '```\n' + pTimes.join('\n').slice(0, 1016) + '\n```', true);
            }

            embed.setImage(gs.history.statsChart(gs.info.playersMax));
        }

        try {
            await this.message.edit(null, { embed });
        } catch (e: any) {
            console.error(['discord.up',this.channelId,this.host,this.port].join(':'), e.message || e);
        }
    }
}
