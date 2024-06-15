import axios from 'axios';
import { GameDig, Player, QueryOptions } from 'gamedig';
import { JSONPreset } from 'lowdb/node';
import ipRegex from './lib/ipregex.js';
import getIP from './lib/getip.js';
import { GameServerConfig } from './watcher.js';

const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || '';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(Number(process.env.DBG));

interface GameServerDb {
    population: {
        [x: string]: Population[];
    }
}

const db = await JSONPreset<GameServerDb>(DATA_PATH + 'servers.json', { population: {} });

export async function initPopulationDb() {
    await db.read();
}

export async function savePopulationDb() {
    try {
        return await db.write();
    } catch (e: any) {
        console.error('gs.savePopulationDb', e.message || e);
    }
}

export interface Info {
    connect: string;
    name: string;
    game: string;
    map: string;
    playersNum: number;
    playersMax: number;
    players: GsPlayer[];
}

export class GameServer {
    public ip: string;
    public info?: Info;
    public config: GameServerConfig;
    public history: ServerHistory;
    private _niceName: string;
    public online: boolean = false;

    constructor(config: GameServerConfig) {
        console.log('game-server init', config.host, config.port, config.type, config.appId);
        this.ip = '0.0.0.0';
        this.config = config;
        this.history = new ServerHistory(config.host + ':' + config.port, config.graphHistoryHours, config.timezoneOffset);
        this._niceName = String(config.name) || config.host + ':' + config.port;
    }

    async update() {
        await this.getIp();

        if (DBG) console.log('gs.up', this.config.host, this.config.port);
        let info = await this.gamedig();

        if (DBG) console.log('gs.gamedig %j', Object.assign({}, info, { players: info?.players.length }));
        if (!info && STEAM_WEB_API_KEY && this.config.appId) {
            info = await this.steam();
            if (DBG) console.log('gs.steam', info);
        }

        if (info) {
            if (info.players.length > 0 && DBG) {
                console.log('gs.players.0 %j', info.players[0]);
            }

            this.online = true;
            this.info = info;
            this.history.add(info.playersNum);
        } else {
            this.online = false;
            console.error('game-server not available', this.config.host, this.config.port);
            this.history.cleanStats();
        }
    }

    async gamedig(): Promise<Info | null> {
        try {
            const res = await GameDig.query({
                type: this.config.type,
                host: this.config.host,
                port: this.config.port,
                givenPortOnly: this.config.givenPortOnly,
                requestRules: this.config.requestRules,
                requestRulesRequired: this.config.requestRulesRequired,
                requestPlayersRequired: this.config.requestPlayersRequired,
                guildId: this.config.guildId,
                login: this.config.login,
                password: this.config.password,
                teamspeakQueryPort: this.config.teamspeakQueryPort,
                token: this.config.token,
                username: this.config.username
            } as QueryOptions);

            const raw = res.raw as { game?: string; folder?: string; presence_count?: number; };
            const game = raw.game || raw.folder || this.config.type;

            const players: GsPlayer[] = res.players.map((p: Player) => {
                return new GsPlayer(p);
            });

            return {
                connect: res.connect,
                name: res.name,
                game: game,
                map: res.map || '',
                playersNum: res.numplayers || raw.presence_count || res.players.length,
                playersMax: res.maxplayers,
                players
            };
        } catch (e: any) {
            console.error(['gs.gamedig', this.config.host, this.config.port].join(':'), e.message || e);
        }

        return null;
    }

    async steam(): Promise<Info | null> {
        const reqUrl = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/?filter=\\appid\\' + this.config.appId + '\\addr\\' + this.ip + '&key=' + STEAM_WEB_API_KEY;

        try {
            const { data } = await axios.get(reqUrl, {
                headers: { 'user-agent': 'game-server-watcher/1.0' }
            });

            if (Array.isArray(data.response.servers)) {
                const matching = data.response.servers.find((s: any) => s.gameport === this.config.port);
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
            console.error(['gs.steam', this.config.host, this.config.port].join(':'), e.message || e);
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

    async getIp() {
        if (this.ip === '0.0.0.0') {
            if (ipRegex.test(this.config.host)) {
                this.ip = this.config.host;
            } else {
                this.ip = await getIP(this.config.host) || '0.0.0.0';
            }
        }

        return this.ip;
    }
}

class GsPlayer {
    private _player: Player;

    constructor(p: Player) {
        this._player = p;
    }

    get(prop: string): string | undefined {
        const p = this._player as any;
        let re;

        if (p[prop] !== undefined) {
            re = String(p[prop]);
        } else if (p.raw && p.raw[prop] !== undefined) {
            re = String(p.raw[prop]);
        }

        if (re === 'NaN') {
            re = undefined;
        }

        return re;
    }
}

interface Population {
    dateHour: number;
    playersNum: number;
}

interface GroupedPopulation {
    [x: number]: Population[];
}

export interface Stat {
    dateHour: number;
    avg: number;
    max: number;
}

class ServerHistory {
    public id: string;
    public graphHistoryHours: number;
    public timezoneOffset: number;
    private _stats: Stat[] = [];

    constructor(id: string, graphHistoryHours: number = 12, timezoneOffset: number = 0) {
        this.id = id;
        this.graphHistoryHours = graphHistoryHours;
        this.timezoneOffset = timezoneOffset;
    }

    yyyymmddhh(d: Date): number {
        return parseInt(d.toISOString().slice(0, 13).replace(/\D/g, ''), 10);
    }

    formatHour(h: number): string {
        // return String(h).padStart(2, '0'); // 24 hour format
        const ampm = (h >= 12) ? 'pm' : 'am';
        const hours = (h > 12) ? h - 12 : h;
        return hours + ampm;
    }

    add(playersNum: number): void {
        if (!db.data?.population) return;
        if (!db.data.population[this.id]) db.data.population[this.id] = [];

        const dh = this.yyyymmddhh(new Date());
        db.data.population[this.id].push({
            dateHour: dh,
            playersNum
        });

        this.cleanStats();
    }

    cleanStats(): void {
        if (!db.data?.population) return;
        if (!db.data.population[this.id]) db.data.population[this.id] = [];

        const d = new Date();
        d.setHours(d.getHours() - this.graphHistoryHours - 1);
        const minDh = this.yyyymmddhh(d);

        db.data.population[this.id] = db.data.population[this.id].filter(i => i.dateHour > minDh);

        this._stats = [];
    }

    stats(): Stat[] {
        if (!db.data?.population) return [];

        if (this._stats.length === 0) {
            const grouped: GroupedPopulation = {};

            if (this.id in db.data.population) {
                for (const d of db.data.population[this.id]) {
                    if (!grouped[d.dateHour]) grouped[d.dateHour] = [];
                    grouped[d.dateHour].push(d);
                }
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

            this._stats = stats.sort((a, b) => a.dateHour - b.dateHour);
        }

        return this._stats;
    }

    statsChart(): string {
        const stats = this.stats();
        const e = encodeURIComponent;

        const avg: string[] = [];
        const max: string[] = [];
        const xlabels: string[] = [];

        const dh = this.yyyymmddhh(new Date());
        if (stats.length === 0 || stats[stats.length - 1].dateHour < dh) {
            stats.push({
                dateHour: dh,
                avg: -1,
                max: -1
            });
        }

        const firstDateHour = new Date();
        firstDateHour.setHours(firstDateHour.getHours() - this.graphHistoryHours);
        const fdh = this.yyyymmddhh(firstDateHour);

        if (stats[0].dateHour > fdh) {
            stats.unshift({
                dateHour: fdh,
                avg: -1,
                max: -1
            });
        }

        let lastH;
        for (const s of stats) {
            const sh = s.dateHour % 100;
            const d = new Date();
            d.setHours(sh);
            d.setTime(d.getTime() + (this.timezoneOffset * 60 * 60 * 1000));
            const h = d.getHours();

            if (lastH !== undefined) {
                let nextH: number = lastH;

                do {
                    nextH++;
                    if (nextH > 23) nextH = 0;

                    if (nextH !== h) {
                        avg.push('_');
                        max.push('_');

                        xlabels.push(this.formatHour(nextH));
                    }
                } while (nextH !== h);
            }

            avg.push(s.avg > -1 ? String(Math.round(s.avg)) : '_');
            max.push(s.max > -1 ? String(s.max) : '_');

            xlabels.push(this.formatHour(h));

            lastH = h;
        }

        const values: string[] = avg.concat(max);

        return [
            'https://image-charts.com/chart?cht=lc',
            'chs=600x300', // image size
            'chf=' + e('bg,s,202225'), // background
            'chma=' + e('0,0,10,0'), // margins
            'chls=' + e('2|2'), // line styles
            // 'chm='+e('B,011040,0,0,0'), // line fill
            'chg=' + e('1,1,2,2,303030'), // grid lines
            // 'chm='+e('d,ffffff,0,-1,3|d,ffffff,1,-1,3'), // value markers
            'chdl=' + e('AVG|MAX'), // labels
            'chdlp=t', // label position
            'chdls=' + e('ffffff,8'), // label style
            'chxt=' + e('x,y'), // displayed axis
            'chxs=' + e('0,ffffff,12,s|1,ffffff,15'), // axis styles
            'chds=a', // scaling
            'chd=' + e('t:' + avg.join(',') + '|' + max.join(',')), // data
            'chl=' + e(values.join('|')), // data labels
            'chlps=' + e('color,ffffff|anchor,end|font.size,12|align,top'), // data labels position & style
            'chxl=' + e('0:|' + xlabels.join('|')), // x axis labels
            // 'chxr='+e('1,0,'+playersMax), // axis range
            'chco=' + e('1234ef,fd7501') // data colors
        ].join('&');
    }
}
