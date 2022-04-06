"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
//Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const http_1 = require("http");
const url_1 = require("url");
require("dotenv/config");
const watcher_1 = require("./watcher");
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || '8080', 10);
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
    else if (SECRET !== '' && reqPath[1] === 'flush' && ['servers', 'telegram', 'discord'].includes(reqPath[2]) && reqPath[3] === SECRET) {
        if (DBG)
            console.log('stopping loop');
        if (loop) {
            clearInterval(loop);
            loop = undefined;
        }
        if (DBG)
            console.log('deleting ' + reqPath[2] + ' data');
        try {
            fs_1.default.unlinkSync('./data/' + reqPath[2] + '.json');
        }
        catch (e) { }
        loop = await (0, watcher_1.main)();
        res.end(reqPath[2] + ' data flushed');
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
