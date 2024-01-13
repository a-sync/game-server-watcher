import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { getInstance } from 'gamedig';
import 'dotenv/config';
import { GameServerConfig, main, readConfig, updateConfig } from './watcher';

const gamedigPjson = fs.readFileSync(path.resolve(__dirname, '../node_modules/gamedig/package.json'), 'utf-8');
const gamedigVersion = JSON.parse(gamedigPjson).version || 0;

const gswPjson = fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8');
const gswVersion = JSON.parse(gswPjson).version || 0;

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8080', 10);
const SECRET = process.env.SECRET || 'secret';
const DATA_PATH = process.env.DATA_PATH || './data/';
const DBG = Boolean(Number(process.env.DBG));

let loop: NodeJS.Timeout | undefined;

interface ApiResponse extends FeaturesResponse, ConfigResponse {
    message?: string;
    error?: string;
}

interface FeaturesResponse{
    features?: {
        version: string;
        gamedig: string;
        steam: boolean;
        discord: boolean;
        telegram: boolean;
        slack: boolean;
    };
}

interface ConfigResponse{
    config?: GameServerConfig[];
}

interface SelectOptionsResponse {
    options: {
        enum_titles: string[];
    };
    enum: string[];
}

const EXT_MIME: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png'
};

createServer(async (req, res) => {
    if (DBG) console.log('DBG: %j %j', (new Date()), req.url);

    const reqUrl = new URL(req.url || '', 'http://localhost');
    const p = reqUrl.pathname === '/' ? 'index.html' : path.normalize(reqUrl.pathname).slice(1);
    const ext = path.extname(p).slice(1);

    if (ext in EXT_MIME && !p.includes('/') && !p.includes('\\')) {
        if (SECRET !== '') {
            res.writeHead(200, {
                'Content-Type': EXT_MIME[ext] || 'plain/text'
            });
            fs.createReadStream(path.resolve('./public/', p)).pipe(res);
        } else {
            res.end('Configure the `SECRET` env var to enable the web UI!');
        }
    } else if (p === 'ping') {
        if (DBG) console.log('ping');
        res.end('pong');
    } else if (p === 'gamedig-games') {
        const gd = getInstance();
        // @ts-ignore
        const games: Map<string,{pretty: string}> = gd.queryRunner.gameResolver.gamesByKey || new Map();

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=0'
        });

        const gdProtocols = ['protocol-ase', 'protocol-battlefield', 'protocol-doom3', 'protocol-epic', 'protocol-gamespy1', 'protocol-gamespy2', 'protocol-gamespy3', 'protocol-goldsrc', 'protocol-nadeo', 'protocol-quake2', 'protocol-quake3', 'protocol-unreal2', 'protocol-valve'];
        const types = Array.from(games.keys());
        const names = Array.from(games.values()).map(g=>g.pretty);
        res.end(JSON.stringify({
            enum: [...types, ...gdProtocols],
            options: {
                enum_titles: [...names, ...gdProtocols]
            }
        } as SelectOptionsResponse, null, DBG ? 2 : 0));
    } else if (SECRET !== '' && req.headers['x-btoken']) {
        let status = 200;
        let re: ApiResponse = {};

        if (validateBearerToken(String(req.headers['x-btoken']))) {
            const reqPath = p.split('/');
            try {
                if (reqPath[0] === 'features') {
                    re.features = {
                        version: String(gswVersion),
                        gamedig: String(gamedigVersion),
                        steam: Boolean(process.env.STEAM_WEB_API_KEY),
                        discord: Boolean(process.env.DISCORD_BOT_TOKEN),
                        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
                        slack: Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN)
                    };
                } else if (reqPath[0] === 'config') {
                    if (req.method === 'GET') {
                        re.config = await readConfig();
                    } else if (req.method === 'POST') {
                        const body = await new Promise(resolve => {
                            let body = '';
                            req.on('data', (chunk: string) => {
                                body += chunk;
                            });
                            req.on('end', () => {
                                resolve(body);
                            });
                        });

                        // TODO: validate (ajv)
                        await updateConfig(JSON.parse(String(body)) || [] as GameServerConfig[]);
                        await restart();

                        re.message = 'Configuration updated. Watcher restarted.';
                    } else {
                        status = 400;
                        re.error = 'Invalid Request';
                    }
                } else if (reqPath[0] === 'flush' && ['servers', 'discord', 'telegram', 'slack'].includes(reqPath[1])) {
                    await restart(reqPath[1]);
                    re.message = '🗑️ ' + reqPath[1].slice(0, 1).toUpperCase() + reqPath[1].slice(1) + ' data flushed.';
                } else {
                    status = 400;
                    re.error = 'Invalid Request';
                }
            } catch (err: any) {
                status = 500;
                re.error = err.message || String(err);
            }
        } else {
            status = 401;
            re.error = 'Unauthorized';
        }

        res.writeHead(status, {
            'Content-Type': 'application/json',
            'Cache-Control': 'max-age=0'
        });

        res.end(JSON.stringify(re, null, DBG ? 2 : 0));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body>404 &#x1F4A2</body></html>');
    }
}).listen(PORT, HOST, () => {
    console.log('GSW Panel service started %s:%s', HOST, PORT);
});

main().then(l => {
    loop = l;
});

async function restart(flush?: string) {
    if (DBG) console.log('stopping loop');
    if (loop) {
        clearInterval(loop);
        loop = undefined;
    }

    if (flush) {
        if (DBG) console.log('Deleting ' + flush + ' data');
        try {
            fs.unlinkSync(DATA_PATH + flush + '.json');
        } catch (e) { }
    }

    loop = await main();
}

function validateBearerToken(btoken: string) {
    const salt = btoken.slice(0, btoken.length - 141);
    const valid = btoken.slice(-141, -128);
    const hash = btoken.slice(-128);

    if (DBG) console.log('validateBT', valid, salt);
    if (salt.length > 24
        && /^\d{13}$/.test(valid)
        && /^[a-f0-9]{128}$/.test(hash)
        && Date.now() < Number(valid)) {
        return hash === crypto.createHash('sha512').update(salt + valid + SECRET).digest('hex');
    }

    return false;
}
