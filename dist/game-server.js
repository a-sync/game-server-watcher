"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = exports.saveDb = exports.initDb = void 0;
const got_1 = __importDefault(require("got"));
const gamedig_1 = require("gamedig");
const lowdb_1 = require("@commonify/lowdb");
const ipregex_1 = __importDefault(require("./lib/ipregex"));
const getip_1 = __importDefault(require("./lib/getip"));
const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || '';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(process.env.DBG || false);
const adapter = new lowdb_1.JSONFile(DATA_PATH + 'servers.json');
const db = new lowdb_1.Low(adapter);
async function initDb() {
    await db.read();
    db.data = db.data || {
        population: {}
    };
}
exports.initDb = initDb;
async function saveDb() {
    try {
        return await db.write();
    }
    catch (e) {
        console.error('gs.saveDb', e.message || e);
    }
}
exports.saveDb = saveDb;
class GameServer {
    constructor(config) {
        this.online = false;
        console.log('game-server init', config.host, config.port, config.type, config.appId);
        this.config = config;
        this.history = new ServerHistory(config.host + ':' + config.port);
        this._niceName = config.host + ':' + config.port;
    }
    async update() {
        if (DBG)
            console.log('gs.up', this.config.host, this.config.port);
        let info = await this.gamedig();
        if (DBG)
            console.log('gs.gamedig', Object.assign({}, info, { players: undefined }));
        if (!info && STEAM_WEB_API_KEY && this.config.appId) {
            info = await this.steam();
            if (DBG)
                console.log('gs.steam', info);
        }
        if (info) {
            if (info.players.length > 0 && DBG) {
                console.log('gs.players.0', info.players[0]);
            }
            this.online = true;
            this.info = info;
            this.history.add(info, this.config.graphHistoryHours);
        }
        else {
            this.online = false;
            console.error('game-server not available', this.config.host, this.config.port);
        }
    }
    async gamedig() {
        try {
            const res = await (0, gamedig_1.query)({
                host: this.config.host,
                port: this.config.port,
                type: this.config.type,
            });
            const raw = res.raw;
            const game = raw.game || raw.folder || this.config.type;
            const players = res.players.map((p) => {
                return new GsPlayer(p);
            });
            return {
                connect: res.connect,
                name: res.name,
                game: game,
                map: res.map || '',
                playersNum: res.numplayers || res.players.length,
                playersMax: res.maxplayers,
                players
            };
        }
        catch (e) {
            console.error(['gs.gamedig', this.config.host, this.config.port].join(':'), e.message || e);
        }
        return null;
    }
    async steam() {
        if (!this.ip) {
            if (ipregex_1.default.test(this.config.host)) {
                this.ip = this.config.host;
            }
            else {
                this.ip = await (0, getip_1.default)(this.config.host);
                if (!this.ip) {
                    return null;
                }
            }
        }
        const reqUrl = 'https://api.steampowered.com/IGameServersService/GetServerList/v1/?filter=\\appid\\' + this.config.appId + '\\addr\\' + this.ip + '&key=' + STEAM_WEB_API_KEY;
        try {
            const res = await (0, got_1.default)(reqUrl, {
                responseType: 'json',
                headers: { 'user-agent': 'game-server-watcher/1.0' }
            }).json();
            if (Array.isArray(res.response.servers)) {
                const matching = res.response.servers.find((s) => s.gameport === this.config.port);
                if (matching) {
                    return {
                        connect: matching.addr,
                        name: matching.name,
                        game: matching.gamedir,
                        map: matching.map,
                        playersNum: matching.players,
                        playersMax: matching.max_players,
                        players: []
                    };
                }
            }
        }
        catch (e) {
            console.error(['gs.steam', this.config.host, this.config.port].join(':'), e.message || e);
        }
        return null;
    }
    get niceName() {
        var _a;
        let nn = (_a = this.info) === null || _a === void 0 ? void 0 : _a.name;
        if (nn) {
            for (let i = 0; i < nn.length; i++) {
                if (nn[i] == '^') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 2);
                }
                else if (nn[i] == '█') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 1);
                }
                else if (nn[i] == '�') {
                    nn = nn.slice(0, i) + ' ' + nn.slice(i + 2);
                }
                ;
            }
            ;
            if (nn)
                this._niceName = nn;
        }
        return this._niceName;
    }
}
exports.GameServer = GameServer;
class GsPlayer {
    constructor(p) {
        this._player = p;
    }
    get(prop) {
        const p = this._player;
        let re;
        if (p[prop] !== undefined) {
            re = String(p[prop]);
        }
        else if (p.raw && p.raw[prop] !== undefined) {
            re = String(p.raw[prop]);
        }
        if (re === 'NaN') {
            re = undefined;
        }
        return re;
    }
}
class ServerHistory {
    constructor(id) {
        this._stats = [];
        this.id = id;
    }
    yyyymmddhh(d) {
        return parseInt(d.toISOString().slice(0, 13).replace(/\D/g, ''), 10);
    }
    add(info, graphHistoryHours = 12) {
        var _a;
        if (!((_a = db.data) === null || _a === void 0 ? void 0 : _a.population))
            return;
        const d = new Date();
        const dh = this.yyyymmddhh(d);
        if (!db.data.population[this.id]) {
            db.data.population[this.id] = [];
        }
        db.data.population[this.id].push({
            dateHour: dh,
            playersNum: info.playersNum
        });
        d.setHours(d.getHours() - graphHistoryHours);
        const minDh = this.yyyymmddhh(d);
        db.data.population[this.id] = db.data.population[this.id].filter(i => i.dateHour >= minDh);
        this._stats = [];
    }
    stats() {
        var _a;
        if (!((_a = db.data) === null || _a === void 0 ? void 0 : _a.population))
            return [];
        if (this._stats.length === 0) {
            const grouped = {};
            for (const d of db.data.population[this.id]) {
                if (!grouped[d.dateHour]) {
                    grouped[d.dateHour] = [];
                }
                grouped[d.dateHour].push(d);
            }
            const stats = [];
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
    statsChart(playersMax = -1) {
        const stats = this.stats();
        const e = encodeURIComponent;
        const avg = [];
        const max = [];
        const xlabels = [];
        let lastH;
        for (const s of stats) {
            const h = s.dateHour % 100;
            if (lastH !== undefined) {
                let nextH = lastH;
                do {
                    nextH++;
                    if (nextH > 23)
                        nextH = 0;
                    if (nextH !== h) {
                        avg.push('_');
                        max.push('_');
                        xlabels.push((nextH > 9 ? '' + nextH : '0' + nextH) + ':00');
                    }
                } while (nextH !== h);
            }
            avg.push(String(Math.round(s.avg)));
            max.push(String(s.max));
            xlabels.push(String(s.dateHour).slice(8) + ':00');
            lastH = h;
        }
        const values = avg.concat(max);
        return [
            'https://image-charts.com/chart?cht=lc',
            'chs=600x300',
            'chf=' + e('bg,s,202225'),
            'chma=' + e('0,0,10,0'),
            'chls=' + e('2|2'),
            // 'chm='+e('B,011040,0,0,0'), // line fill
            'chg=' + e('1,1,2,2,303030'),
            // 'chm='+e('d,ffffff,0,-1,3|d,ffffff,1,-1,3'), // value markers
            'chdl=' + e('AVG|MAX'),
            'chdlp=t',
            'chdls=' + e('ffffff,8'),
            'chxt=' + e('x,y'),
            'chxs=' + e('0,ffffff,12|1,ffffff,15'),
            'chds=a',
            'chd=' + e('t:' + avg.join(',') + '|' + max.join(',')),
            'chl=' + e(values.join('|')),
            'chlps=' + e('color,ffffff|anchor,end|font.size,12|align,top'),
            'chxl=' + e('0:|' + xlabels.join('|')),
            // 'chxr='+e('1,0,'+playersMax), // axis range
            'chco=' + e('1234ef,fd7501') // data colors
        ].join('&');
    }
}
