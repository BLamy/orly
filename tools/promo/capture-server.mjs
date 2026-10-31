// Local receiver for rrweb captures made in the user's own Chrome (Claude in Chrome).
// GET  /rrweb.js            → rrweb UMD build (evaluated in the page)
// POST /events/<take>       → appends a JSON array of rrweb events to capture/raw/<take>.jsonl
// POST /blob/<name>         → writes research JSON (bug details) to capture/api/<name>.json
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? 'films/replay-qa-promo/capture');
const PORT = Number(process.argv[3] ?? 7788);
const RRWEB = fs.readFileSync('node_modules/rrweb/dist/rrweb.umd.min.cjs', 'utf8');
fs.mkdirSync(path.join(ROOT, 'raw'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'api'), { recursive: true });
const safe = (s) => s.replace(/[^a-z0-9._-]/gi, '_');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') return res.end();
  const [, kind, name] = req.url.split('/');
  if (req.method === 'GET' && kind === 'rrweb.js') { res.setHeader('content-type', 'text/javascript'); return res.end(RRWEB); }
  if (req.method === 'GET' && kind === 'ping') return res.end('ok');
  if (req.method === 'POST' && (kind === 'events' || kind === 'blob')) {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (kind === 'events') {
        const events = JSON.parse(body);
        fs.appendFileSync(path.join(ROOT, 'raw', safe(name) + '.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');
        console.log(`${name}: +${events.length} events`);
      } else {
        fs.writeFileSync(path.join(ROOT, 'api', safe(name) + '.json'), body);
        console.log(`blob ${name}: ${body.length} bytes`);
      }
      res.end('ok');
    });
    return;
  }
  res.statusCode = 404; res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`capture server on http://127.0.0.1:${PORT} → ${ROOT}`));
