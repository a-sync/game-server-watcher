import fs from 'fs';
import { createServer } from 'http';
import { URL } from 'url';

import 'dotenv/config';

import { main } from './src/watcher';

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE || '0', 10);
const APP_HOST = process.env.app_host || '0.0.0.0';
const APP_PORT = parseInt(process.env.app_port || '8080', 10);
const SECRET = process.env.SECRET || '';
const DBG = Boolean(process.env.DBG || false);

let loop: NodeJS.Timeout | undefined;

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
    else if (SECRET !== '' && reqPath[1] === 'flush' && ['servers', 'telegram', 'discord'].includes(reqPath[2]) && reqPath[3] === SECRET) {
        if (DBG) console.log('stopping loop');
        if (loop) {
            clearInterval(loop);
            loop = undefined;
        }

        if (DBG) console.log('deleting ' + reqPath[2] + ' data');
        try {
            fs.unlinkSync('./data/' + reqPath[2] + '.json');
        } catch (e) {}

        loop = await main();

        res.end(reqPath[2] + ' data flushed');
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
