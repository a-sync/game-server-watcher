import got from 'got';
import { Player, query, QueryResult } from 'gamedig';
import { Low, JSONFile } from '@commonify/lowdb';
import ipRegex from './lib/ipregex';
import getIP from './lib/getip';
import { WatcherConfig } from './watcher';

const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || '';
const PLAYERS_HISTORY_HOURS = parseInt(process.env.PLAYERS_HISTORY_HOURS || '10', 10);
const DATA_PATH = process.env.DATA_PATH || './data/';

interface GameServerDb {
    population: {
        [x: string]: Population[];
    }
}

const adapter = new JSONFile<GameServerDb>(DATA_PATH + 'servers.json');
const db = new Low<GameServerDb>(adapter);

export async function initDb() {
    await db.read();
    db.data = db.data || {
        population: {}
    };
}

export function saveDb() {
    return db.write();
}

interface gsPlayer extends Player {
    raw?: {
        [key: string]: any;
    };
}

export interface Info {
    connect: string;
    name: string;
    game: string;
    map: string;
    playersNum: number;
    playersMax: number;
    players: gsPlayer[];
}

interface qRes extends QueryResult {
    game: string;
    numplayers: number;
}

export class GameServer {
    public ip?: string;
    public info?: Info;
    public config: WatcherConfig;
    public history: ServerHistory;
    private _niceName: string;
    public online: boolean = false;

    constructor(config: WatcherConfig) {
        console.log('game-server init', config.host, config.port, config.type, config.appId);
        this.config = config;
        this.history = new ServerHistory(config.host + ':' + config.port);
        this._niceName = config.host + ':' + config.port;
    }

    async update() {
        let info = await this.gamedig();

        if (!info && STEAM_WEB_API_KEY) {
            info = await this.steam();
        }

        if (info) {
            this.online = true;
            this.info = info;
            this.history.add(info);
        } else {
            this.online = false;
            console.error('game-server not available', this.config.host, this.config.port);
        }
    }

    async gamedig(): Promise<Info | null> {
        try {
            const res = await query({
                host: this.config.host,
                port: this.config.port,
                type: this.config.type,
            }) as qRes;

            const raw = res.raw as { game: string; folder: string; };
            const game = raw.game || raw.folder || this.config.type;

            const players: Player[] = res.players;//todo: map / filter
            return {
                connect: res.connect,
                name: res.name,
                game: game,
                map: res.map,
                playersNum: res.numplayers || res.players.length,
                playersMax: res.maxplayers,
                players
            };
        } catch (e: any) {
            console.error(e.message || e);
        }

        return null;
    }

    async steam(): Promise<Info | null> {
        if (!this.ip) {
            if (ipRegex.test(this.config.host)) {
                this.ip = this.config.host;
            } else {
                this.ip = await getIP(this.config.host);

                if (!this.ip) {
                    return null;
                }
            }
        }

        const reqUrl = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/?filter=\\appid\\' + this.config.appId + '\\addr\\' + this.ip + '&key=' + STEAM_WEB_API_KEY;

        try {
            const res: any = await got(reqUrl, {
                responseType: 'json',
                headers: { 'user-agent': 'game-server-watcher/1.0' }
            }).json();

            if (Array.isArray(res.response.servers)) {
                const matching = res.response.servers.find((s: any) => s.gameport === this.config.port);
                if (matching) {
                    return {
                        connect: matching.addr,
                        name: matching.name,
                        game: matching.gamedir,
                        map: matching.map,
                        playersNum: matching.players,
                        playersMax: matching.max_players,
                        players: []
                    }
                }
            }
        } catch (e: any) {
            console.error(e.message || e);
        }

        return null;
    }

    get niceName() {
        let nn = this.info?.name;

        if (nn) {
            for (let i = 0; i < nn.length; i++) {
                if (nn[i] == '^') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 2);
                } else if (nn[i] == '█') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 1);
                } else if (nn[i] == '�') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 2);
                };
            };

            if (nn) this._niceName = nn;
        }

        return this._niceName;
    }
}

interface Population {
    dateHour: number;
    playersNum: number;
}

interface GroupedPopulation {
    [x: number]: Population[];
}

interface Stat {
    dateHour: number;
    avg: number;
    max: number;
}

class ServerHistory {
    public id: string;
    constructor(id: string) {
        this.id = id;
    }

    yyyymmddhh(d: Date): number {
        return parseInt(d.toISOString().slice(0, 13).replace(/\D/g, ''), 10);
    }

    add(info: Info) {
        if (!db.data?.population) return;

        const d = new Date();
        const dh = this.yyyymmddhh(d);

        if (!db.data.population[this.id]) {
            db.data.population[this.id] = [];
        }

        db.data.population[this.id].push({
            dateHour: dh,
            playersNum: info.playersNum
        });

        d.setHours(d.getHours() - PLAYERS_HISTORY_HOURS);
        const minDh = this.yyyymmddhh(d);

        db.data.population[this.id] = db.data.population[this.id].filter(i => i.dateHour > minDh);
    }

    stats() {
        if (!db.data?.population) return [];

        const grouped: GroupedPopulation = {};

        for (const d of db.data.population[this.id]) {
            if (!grouped[d.dateHour]) {
                grouped[d.dateHour] = [];
            }
            grouped[d.dateHour].push(d);
        }

        const stats: Stat[] = [];
        for (const dh in grouped) {
            const avg = grouped[dh].reduce((total, next) => total + next.playersNum, 0) / grouped[dh].length;
            const max = grouped[dh].reduce((max, next) => next.playersNum > max ? next.playersNum : max, 0);
            stats.push({
                dateHour: parseInt(dh, 10),
                avg,
                max
            });
        }

        return stats.sort((a, b) => a.dateHour - b.dateHour);
    }
}
