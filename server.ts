import fs from 'fs';
import { createServer } from 'http';
import { URL } from 'url';

import 'dotenv/config';

import { main, WatcherConfig } from './src/watcher';

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || '8080', 10);

const DBG = Boolean(process.env.DBG || false);
const SECRET = process.env.SECRET || 'secret';

createServer(async (req, res) => {
    if (DBG) console.log('DBG: %j %j', (new Date()), req.url);

    const reqUrl = new URL(req.url || '', 'http://localhost');
    if (reqUrl.pathname === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Cache-Control': 'max-age=' + String(CACHE_MAX_AGE)
        });
        fs.createReadStream('./index.html').pipe(res);
    }
    else if (reqUrl.pathname === '/discord/post') {//DEBUG
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

main();
