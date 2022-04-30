"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
//Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const http_1 = require("http");
const url_1 = require("url");
require("dotenv/config");
const watcher_1 = require("./watcher");
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || process.env.APP_HOST || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || process.env.APP_PORT || '8080', 10);
const SECRET = process.env.SECRET || '';
const DBG = Boolean(process.env.DBG || false);
let loop;
(0, http_1.createServer)(async (req, res) => {
    if (DBG)
        console.log('DBG: %j %j', (new Date()), req.url);
    const reqUrl = new url_1.URL(req.url || '', 'http://localhost');
    const reqPath = reqUrl.pathname.split('/');
    if (reqUrl.pathname === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        });
        fs_1.default.createReadStream('./index.html').pipe(res);
    }
    else if (reqUrl.pathname === '/ping') {
        if (DBG)
            console.log('ping');
        res.end('pong');
    }
    else if (SECRET !== '' && req.headers['x-btoken']) {
        let status = 200;
        let re = {};
        if (validateBearerToken(String(req.headers['x-btoken']))) {
            try {
                if (reqPath[1] === 'config') {
                    if (req.method === 'GET') {
                        re.config = await (0, watcher_1.readConfig)();
                    }
                    else if (req.method === 'POST') {
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
                        await (0, watcher_1.updateConfig)(JSON.parse(String(body)) || []);
                        await restart();
                        re.message = 'Configuration updated. Watcher restarted.';
                    }
                    else {
                        status = 400;
                        re.error = 'Invalid Request';
                    }
                }
                else if (reqPath[1] === 'flush' && ['servers', 'discord', 'telegram'].includes(reqPath[2])) {
                    await restart(reqPath[2]);
                    re.message = reqPath[2] + ' data flushed';
                }
                else {
                    status = 400;
                    re.error = 'Invalid Request';
                }
            }
            catch (err) {
                status = 500;
                re.error = err.message || String(err);
            }
        }
        else {
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
(0, watcher_1.main)().then(l => {
    loop = l;
});
async function restart(flush) {
    if (DBG)
        console.log('stopping loop');
    if (loop) {
        clearInterval(loop);
        loop = undefined;
    }
    if (flush) {
        if (DBG)
            console.log('deleting ' + flush + ' data');
        try {
            fs_1.default.unlinkSync('./data/' + flush + '.json');
        }
        catch (e) { }
    }
    loop = await (0, watcher_1.main)();
}
function validateBearerToken(btoken) {
    const salt = btoken.slice(0, btoken.length - 141);
    const valid = btoken.slice(-141, -128);
    const hash = btoken.slice(-128);
    if (DBG)
        console.log('validateBT', valid, salt);
    if (salt.length > 24
        && valid.length === 13
        && hash.length === 128
        && /^\d{13}$/.test(valid)
        && Date.now() <= Number(valid)) {
        return hash === crypto_1.default.createHash('sha512').update(salt + valid + SECRET).digest('hex');
    }
    return false;
}
