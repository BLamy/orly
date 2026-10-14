#!/usr/bin/env node
// Contact sheet of a cleaned rrweb take, replayed frame-exact with rrweb's Replayer.pause(ms) exactly as the film
// does (insertStyleRules = take.css, rrweb mouse hidden, our cursor overlaid), so cleaning can be judged by eye.
//   node tools/promo/rr-sheet.mjs --slug replay-qa-promo --take new-project [--n 8] [--at 0,1200,…] [--out file.png]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const slug = arg('slug'), take = arg('take');
const n = Number(arg('n', 8));
const out = arg('out', path.join('.orly-work', 'promo', 'sheets', `${take}.png`));
const PUBLIC = path.resolve('public');
const RRWEB = fs.readFileSync('node_modules/rrweb/dist/rrweb.umd.min.cjs', 'utf8');
const doc = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'generated', slug, 'rr', `${take}.json`), 'utf8'));
const times = arg('at') ? arg('at').split(',').map(Number) : Array.from({ length: n }, (_, i) => Math.round((doc.duration * i) / (n - 1)));
const marks = Object.entries(doc.marks);

const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') { res.setHeader('content-type', 'text/html'); return res.end(`<!doctype html><body style="margin:0;background:#fff"><div id=root></div><script>const module={exports:{}};const exports=module.exports;${RRWEB.replace(/<\/script/g, '<\\/script')};window.rrweb=module.exports;</script>`); }
  const f = path.join(PUBLIC, u);
  if (!f.startsWith(PUBLIC) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
  res.end(fs.readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: doc.viewport });
await p.goto(base + '/');
await p.evaluate(async (src) => {
  const d = await fetch(src).then((r) => r.json());
  window.__take = d;
  window.__r = new window.rrweb.Replayer(d.events, { root: document.getElementById('root'), mouseTail: false, skipInactive: false, triggerFocus: false, showWarning: false, pauseAnimation: true, useVirtualDom: false, insertStyleRules: d.css });
}, `/generated/${slug}/rr/${take}.json`);
const dir = path.join('.orly-work', 'promo', 'sheets', take);
fs.mkdirSync(dir, { recursive: true });
const files = [];
for (const t of times) {
  await p.evaluate(async ([t, label]) => {
    window.__r.pause(Math.max(1, t));
    const ifr = document.querySelector('iframe');
    const d = ifr.contentDocument;
    await d.fonts.ready;
    await Promise.all([...d.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
    // draw our cursor (as RrwebScreen does)
    const s = window.__take.cursor.samples; const f = Math.min(s.length - 1, Math.round((t / 1000) * 60));
    let c = document.getElementById('cur'); if (!c) { c = document.createElement('div'); c.id = 'cur'; c.style.cssText = 'position:fixed;width:14px;height:14px;border-radius:7px;background:#f41c52;border:2px solid #fff;z-index:9;transform:translate(-50%,-50%);box-shadow:0 0 0 1px #000'; document.body.appendChild(c); }
    if (s.length) { c.style.left = s[f][1] + 'px'; c.style.top = s[f][2] + 'px'; }
    let lb = document.getElementById('lbl'); if (!lb) { lb = document.createElement('div'); lb.id = 'lbl'; lb.style.cssText = 'position:fixed;left:8px;top:8px;z-index:10;font:600 26px system-ui;color:#fff;background:rgba(0,0,0,.65);padding:4px 10px;border-radius:6px'; document.body.appendChild(lb); }
    lb.textContent = label;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, [t, `${(t / 1000).toFixed(2)}s ${marks.filter(([, m]) => Math.abs(m - t) < 300).map(([k]) => k).join(' ')}`]);
  const f = path.join(dir, `${String(t).padStart(6, '0')}.png`);
  await p.screenshot({ path: f });
  const near = marks.filter(([, m]) => Math.abs(m - t) < 300).map(([k]) => k).join(' ');
  files.push({ f, label: `${(t / 1000).toFixed(2)}s ${near}` });
}
await b.close(); srv.close();
// tile with labels
const cols = 4, w = 480, h = Math.round((w * doc.viewport.height) / doc.viewport.width);
const inputs = files.flatMap((x) => ['-i', x.f]);
const filt = files.map((x, i) => `[${i}]scale=${w}:${h}[v${i}]`).join(';');
const rows = Math.ceil(files.length / cols);
const pads = Array.from({ length: rows * cols - files.length }, (_, i) => `color=c=gray:s=${w}x${h}:d=1[p${i}]`);
const all = [...files.map((_, i) => `[v${i}]`), ...pads.map((_, i) => `[p${i}]`)];
const layout = all.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|');
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${filt}${pads.length ? ';' + pads.join(';') : ''};${all.join('')}xstack=inputs=${all.length}:layout=${layout}`, '-frames:v', '1', out]);
console.log(out);
