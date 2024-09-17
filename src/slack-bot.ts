import { App as AppType, Block, KnownBlock, MrkdwnElement, PlainTextElement } from '@slack/bolt';
import bolt from '@slack/bolt';
import { JSONPreset } from 'lowdb/node';
import { GameServer } from './game-server.js';
import hhmmss from './lib/hhmmss.js';
import { SlackConfig } from './watcher.js';
import * as ip from 'neoip';

const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(Number(process.env.DBG));

interface SlackData {
    channelId: string;
    host: string;
    port: number;
    messageId: string;
}

const db = await JSONPreset<SlackData[]>(DATA_PATH + 'slack.json', []);

const serverInfoMessages: ServerInfoMessage[] = [];

let bot: AppType;
export async function init(token: string, appToken: string) {
    if (!bot) {
        console.log('slack-bot starting...');
        try {
            bot = new bolt.App({
                token,
                appToken,
                socketMode: true,
                logLevel: bolt.LogLevel.ERROR
            });

            if (DBG) {
                bot.message('ping', async ({ message, say }) => {
                    // Handle only newly posted messages here
                    if (message.subtype === undefined
                        || message.subtype === 'bot_message'
                        || message.subtype === 'file_share'
                        || message.subtype === 'thread_broadcast') {
                        await say(`<@${message.user}> pong`);
                    }
                });
            }

            await bot.start();
        } catch (e: any) {
            console.error('slack-bot init ERROR', e.message || e);
        }
    }

    serverInfoMessages.length = 0;
    await db.read();
}

export async function serverUpdate(gs: GameServer) {
    if (DBG) console.log('slack.serverUpdate', gs.config.host, gs.config.port, gs.config.slack);

    if (gs.config.slack) {
        for (const conf of gs.config.slack) {
            try {
                let m = await getServerInfoMessage(conf.channelId, gs.config.host, gs.config.port);
                await m.updatePost(gs, conf);
            } catch (e: any) {
                console.error(['slack-bot.sup', conf.channelId, gs.config.host, gs.config.port].join(':'), e.message || e);
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

    constructor(channelId: string, host: string, port: number) {
        this.channelId = channelId;
        this.host = host;
        this.port = port;
    }

    async init(msgId?: string) {
        if (msgId) this.messageId = msgId;
        else {
            const message = await bot.client.chat.postMessage({
                channel: this.channelId,
                text: 'Initializing server info...'
            });

            if (message.ok && message.ts) {
                this.messageId = message.ts;
            } else {
                console.error(['slack.init.msg', this.channelId, this.host, this.port].join(':'));
            }
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
                console.error(['slack.init.db', this.channelId, this.host, this.port].join(':'), e.message || e);
            }
        }
    }

    async updatePost(gs: GameServer, conf: SlackConfig) {
        const showPlayersList = Boolean(conf.showPlayersList);
        const showGraph = Boolean(conf.showGraph);

        const blocks: (KnownBlock | Block)[] = [];
        const fields1: (PlainTextElement | MrkdwnElement)[] = [];
        const fields2: (PlainTextElement | MrkdwnElement)[] = [];

        let text;
        if (gs.info && gs.online) {
            text = this.escapeMarkdown(gs.niceName);

            blocks.push({
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: gs.niceName.slice(0, 256)
                }
            },
                {
                    type: 'divider',
                });

            if (gs.info.game) {
                text += '\r\nGame: ' + gs.info.game;
                fields1.push({
                    type: 'mrkdwn',
                    text: '*Game*  \r\n' + String(gs.info.game)
                });
            }

            if (gs.info.map) {
                text += '\r\nMap: ' + gs.info.map;
                fields1.push({
                    type: 'mrkdwn',
                    text: '*Map*  \r\n' + String(gs.info.map)
                });
            }

            if (fields1.length > 0) {
                blocks.push({
                    type: 'section',
                    fields: fields1
                });
            }

            text += '\r\nPlayers: ' + String(gs.info.playersNum);
            fields2.push({
                type: 'mrkdwn',
                text: '*Players*  \r\n' + String(gs.info.playersNum + '/' + gs.info.playersMax)
            });

            const connectIp = gs.info.connect.split(':')[0];
            if (!ip.isPrivate(connectIp)) {
                text += '\r\nAddress: ' + String(gs.info.connect);
                fields2.push({
                    type: 'mrkdwn',
                    text: '*Address*  \r\n' + String(gs.info.connect)
                });
            }

            if (fields2.length > 0) {
                blocks.push({
                    type: 'section',
                    fields: fields2
                });
            }

            if (gs.config.infoText) {
                text += '\r\nInfo:\r\n' + String(gs.config.infoText).slice(0, 1024);
                blocks.push({
                    type: 'section',
                    fields: [{
                        type: 'mrkdwn',
                        text: '*Info* \r\n' + String(gs.config.infoText).slice(0, 1024)
                    }]
                });
            }

            if (showPlayersList && gs.info?.players.length > 0) {
                const pNames: string[] = [];
                for (const p of gs.info?.players) {
                    if (pNames.join('\n').length > 2992) { // Note: max length 3000 - wrapper
                        if (pNames.length > 0) pNames.pop();
                        break;
                    }

                    const line = [];
                    if (p.get('time') !== undefined) line.push(hhmmss(p.get('time') || 0));
                    if (p.get('name') !== undefined) line.push(p.get('name') || 'n/a');
                    if (p.get('score') !== undefined) line.push('(' + (p.get('score') || '0') + ')');
                    else if (p.get('frags') !== undefined) line.push('(' + (p.get('frags') || '0') + ')');

                    pNames.push(line.join(' '));
                }

                if (pNames.length > 0) {
                    blocks.push({
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: '```\n' + pNames.join('\n') + '\n```'
                        }
                    });
                }
            }
        } else {
            text = this.escapeMarkdown(gs.niceName) + ' offline...';
            blocks.push({
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${gs.niceName.slice(0, 245)} offline... :red_circle:`
                }
            });
        }

        if (showGraph) {
            blocks.push({
                type: 'image',
                image_url: gs.history.statsChart(),
                alt_text: 'Player numbers chart',
                title: {
                    type: 'plain_text',
                    text: `📈`
                }
            });
        }

        const unixTimestamp = Math.floor(+new Date() / 1000);
        // text += ' Last updated at ' + new Date().toLocaleString();
        blocks.push({
            "type": "context",
            "elements": [
                {
                    type: 'mrkdwn',
                    text: `Last updated: <!date^${unixTimestamp}^{date_num} {time_secs}|${new Date().toLocaleString()}>`
                }
            ]
        });

        try {
            await bot.client.chat.update({
                as_user: true,
                channel: this.channelId,
                ts: this.messageId,
                text,
                blocks
            });
        } catch (e: any) {
            console.error(['slack.up', this.channelId, this.host, this.port].join(':'), e.message || e);
        }
    }

    escapeMarkdown(str: string): string {
        const patterns = [
            /_/g,
            /~/g,
            /`/g,
            /</g,
            />/g
        ];

        return patterns.reduce((acc: string, pattern: RegExp) => acc.replace(pattern, '\\$&'), str);
    }
}
