
import {Client, MessageEmbed, Intents} from 'discord.js';
import { GameServer } from './game-server';

//https://github.com/soulkobk/DiscordBot_GameStatus
const prefix = '@gsw';
let client: Client;

export function init(token: string) {
    client = new Client({
        //messageEditHistoryMaxSize: 0,
        //ws: {intents: ['GUILDS', 'GUILD_MESSAGES']}
    });

    console.log('     dc.init');//DEBUG

    client.on('ready', ()=> {
        console.log('  dc.client.READY');//DEBUG
    })

    client.on('message', msg => {
        if (msg.content === 'ping') {
            msg.reply('pong');
        }
    });

    // client.on('messageCreate', (message) => {
    //     console.log('!!!!!dc.messageCreate', message.author, message.content);//DEBUG
    
    //     if (message.author.bot) return;
    //     if (!message.content.startsWith(prefix)) return;
    
    //     const commandBody = message.content.slice(prefix.length);
    //     const args = commandBody.split(' ');
    //     const command = String(args.shift()).toLowerCase();
    
    //     if (command === 'ping') {
    //         const timeTaken = Date.now() - message.createdTimestamp;
    //         message.reply(`Pong! ${timeTaken}ms`);
    //     }
    // });
    
    return client.login(token);
}

export async function serverUpdate(gs: GameServer) {
    if (!gs.info) return;

    console.log('discord.serverUpdate', gs.config.host, gs.config.port, gs.config.discord);
/*
    for (const cid of gs.config.discord.chatIds) {
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
    */
}