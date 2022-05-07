import fs from 'fs';
import crypto from 'crypto';
import { createServer } from 'http';
import { URL } from 'url';

import 'dotenv/config';

import { GameServerConfig, main, readConfig, updateConfig } from './watcher';

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || process.env.APP_HOST || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || process.env.APP_PORT || '8080', 10);
const SECRET = process.env.SECRET || '';
const DBG = Boolean(process.env.DBG || false);
const FEET_STEAM = Boolean(process.env.STEAM_WEB_API_KEY);
const FEET_DISCORD = Boolean(process.env.DISCORD_BOT_TOKEN);
const FEET_TELEGRAM = Boolean(process.env.TELEGRAM_BOT_TOKEN);

let loop: NodeJS.Timeout | undefined;

interface ApiResponse {
    message?: string;
    error?: string;
    config?: GameServerConfig[];
    features?: {
        steam: boolean;
        discord: boolean;
        telegram: boolean;
    }
}

createServer(async (req, res) => {
    if (DBG) console.log('DBG: %j %j', (new Date()), req.url);

    const reqUrl = new URL(req.url || '', 'http://localhost');
    const reqPath = reqUrl.pathname.split('/');
    if (reqUrl.pathname === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        });
        fs.createReadStream('./index.html').pipe(res);
    }
    else if (reqUrl.pathname === '/ping') {
        if (DBG) console.log('ping');
        res.end('pong');
    }
    else if (SECRET !== '' && req.headers['x-btoken']) {
        let status = 200;
        let re: ApiResponse = {};

        if (validateBearerToken(String(req.headers['x-btoken']))) {
            try {
                if (reqPath[1] === 'features') {
                    re.features = {
                        steam: FEET_STEAM,
                        discord: FEET_DISCORD,
                        telegram: FEET_TELEGRAM
                    };
                } else if (reqPath[1] === 'config') {
                    if (req.method === 'GET') {
                        re.config = await readConfig();
                    } else if (req.method === 'POST') {
                        const body = await new Promise(resolve => {
                            let body = '';
                            req.on('data', chunk => {
                                body += chunk;
                            });
                            req.on('end', () => {
                                resolve(body);
                            });
                        });
                        //TODO: validate
                        await updateConfig(JSON.parse(String(body)) || [] as GameServerConfig[]);
                        await restart();

                        re.message = 'Configuration updated. Watcher restarted.';
                    } else {
                        status = 400;
                        re.error = 'Invalid Request';
                    }
                } else if (reqPath[1] === 'flush' && ['servers', 'discord', 'telegram'].includes(reqPath[2])) {
                    await restart(reqPath[2]);
                    re.message = reqPath[2] + ' data flushed';
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
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body>404 &#x1F4A2</body></html>');
    }
}).listen(APP_PORT);

console.log('Web service started %s:%s', APP_HOST, APP_PORT);

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
        if (DBG) console.log('deleting ' + flush + ' data');
        try {
            fs.unlinkSync('./data/' + flush + '.json');
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
        && valid.length === 13
        && hash.length === 128
        && /^\d{13}$/.test(valid)
        && Date.now() <= Number(valid)) {
        return hash === crypto.createHash('sha512').update(salt + valid + SECRET).digest('hex');
    }

    return false;
}
