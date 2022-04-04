"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
//Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const http_1 = require("http");
const url_1 = require("url");
require("dotenv/config");
const watcher_1 = require("./src/watcher");
const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || '8080', 10);
const DBG = Boolean(process.env.DBG || false);
const SECRET = process.env.SECRET || 'secret';
(0, http_1.createServer)(async (req, res) => {
    if (DBG)
        console.log('DBG: %j %j', (new Date()), req.url);
    const reqUrl = new url_1.URL(req.url || '', 'http://localhost');
    if (reqUrl.pathname === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        });
        fs_1.default.createReadStream('./index.html').pipe(res);
    }
    else if (reqUrl.pathname === '/discord/post') { //DEBUG
        console.log('REQ.HEADERS', req.headers);
        let body = '';
        req.on('data', (chunk) => {
            body += chunk; // convert Buffer to string
        });
        req.on('end', () => {
            console.log('POST.DATA:', String(body));
            res.end('');
        });
    }
    else if (reqUrl.pathname === '/ping') {
        console.log('ping');
        res.end('pong');
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><head></head><body>404 &#x1F4A2</body></html>');
    }
}).listen(APP_PORT);
console.log('Web service started %s:%s', APP_HOST, APP_PORT);
(0, watcher_1.main)();
