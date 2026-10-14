#!/usr/bin/env node
// Sync check for the shelf player (?film=<slug>): plays from a few positions and checks that the soundtrack clock
// (stems placed on the picture's timeline) advances in real time and that the narration line sounding at each
// moment is the line the timeline puts there.
//   node tools/film/player-sync.mjs [--slug neural-net-history] [--base http://127.0.0.1:5199] [--at 0,1200]
import { chromium } from 'playwright';
import fs from 'node:fs';
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const slug = arg('slug', 'neural-net-history');
const base = arg('base', 'http://127.0.0.1:5199');
const ats = arg('at', '0,600,1200,2000').split(',').map(Number);
const tl = JSON.parse(fs.readFileSync(`apps/bookshelf/src/viz/films/${slug}/timeline.json`, 'utf8'));
const lineAtTl = (t) => {
  for (const s of tl.shots) for (const l of s.lines) if (t >= s.start + l.start && t < s.start + l.end) return l.id;
  return null;
};
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?film=${slug}`);
await page.waitForFunction(() => !!window.__filmPlayer, null, { timeout: 120000 });
console.log('tracks', JSON.stringify(await page.evaluate(() => window.__filmPlayer.events())));
let fail = 0;
for (const at of ats) {
  // seek via the range input, then play with a real click (user gesture)
  await page.evaluate((x) => {
    const r = document.querySelector('.fp-scrub input');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(r, String(x));
    r.dispatchEvent(new Event('input', { bubbles: true }));
  }, at);
  await page.click('.fp-play');
  await page.waitForFunction(() => window.__filmPlayer.playing(), null, { timeout: 30000 });
  // start-up (first clips decoding) holds the clock still; the picture waits with it. Measure from first motion.
  const held = Date.now();
  await page.waitForFunction((x) => window.__filmPlayer.now() > x + 0.02, at, { timeout: 30000 });
  const startup = (Date.now() - held) / 1000;
  const t0 = await page.evaluate(() => window.__filmPlayer.now());
  const w0 = Date.now();
  await page.waitForTimeout(4000);
  const t1 = await page.evaluate(() => window.__filmPlayer.now());
  const wall = (Date.now() - w0) / 1000;
  const counter = await page.textContent('.fp-counter');
  // which line does the engine sound now vs which line the timeline puts there (speech span)?
  const probeT = t1;
  const tlLine = lineAtTl(probeT);
  const ev = await page.evaluate((t) => window.__filmPlayer.lineAt(t), probeT);
  const ok = Math.abs(t1 - t0 - wall) < 0.1 && (!tlLine || (ev && ev.media.includes(tlLine)));
  if (!ok) fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} at ${at}s: start-up ${startup.toFixed(2)} s; clock ${t0.toFixed(2)} → ${t1.toFixed(2)} in ${wall.toFixed(2)} s wall (drift ${(t1 - t0 - wall).toFixed(3)}); counter ${counter}; timeline line ${tlLine ?? '(gap)'}; sounding event ${ev?.media ?? '(none)'}`);
  await page.click('.fp-play');
}
await page.screenshot({ path: '.orly-work/player-sync.png' });
console.log(errors.length ? `page errors: ${errors.join(' | ')}` : 'no page errors');
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
