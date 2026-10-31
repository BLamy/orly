#!/usr/bin/env node
// rrweb capture for promo films: drives a signed-in Chromium (Playwright persistent profile) through
// scripted "takes" and records each one with rrweb, injected on every document load so navigations
// never drop the recording.
//
//   node tools/promo/rr-capture.mjs --slug replay-qa-promo --take overview [--headed] [--probe <url>]
//
// A take is films/<slug>/capture/takes/<take>.mjs:
//   export const meta = { url: 'https://…', viewport: { width: 1440, height: 900 } };
//   export default async function (page, h) { await h.mark('start'); await h.click('text=Run'); … await h.mark('end'); }
// Helpers (h): move(target, {dur}) · click(target, {dur}) · hover(target) · type(text, {cps}) · scroll(dy, {dur})
//              wait(ms) · mark(name, data?) (an rrweb custom event the cleaner turns into a named moment)
// target = a Playwright selector string, a Locator, or {x, y}. Mouse paths are eased curves sampled at 60 Hz,
// so the cleaner's cursor track starts out smooth.
//
// Output: films/<slug>/capture/raw/<take>.jsonl (gitignored: raw DOM may contain secrets; run rr-clean.mjs).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};
const slug = arg('slug');
const take = arg('take');
const probe = arg('probe');
const headed = !!arg('headed', false);
const PROFILE = arg('profile', process.env.HOME + '/Library/Caches/orly-promo/chrome-profile');
if (!slug || (!take && !probe)) {
  console.error('usage: rr-capture.mjs --slug <slug> (--take <take> | --probe <url>) [--headed]');
  process.exit(2);
}
const FILM = path.resolve('films', slug);
const RAW = path.join(FILM, 'capture', 'raw');
fs.mkdirSync(RAW, { recursive: true });

const RRWEB = fs.readFileSync(path.resolve('node_modules/rrweb/dist/rrweb.umd.min.cjs'), 'utf8');
// rrweb's UMD build assigns module.exports when `module` exists; give it a sandbox so it lands on window.rrweb.
const INIT = `(() => {
  if (window.top !== window || window.__rrStarted) return;
  window.__rrStarted = true;
  const module = { exports: {} }; const exports = module.exports;
  ${RRWEB}
  window.rrweb = module.exports;
  const buf = [];
  const flush = () => { if (buf.length && window.__rrEmit) window.__rrEmit(buf.splice(0)); };
  window.__rrStop = window.rrweb.record({
    emit(e) { buf.push(e); if (buf.length > 200) flush(); },
    inlineStylesheet: true,
    inlineImages: true,
    collectFonts: true,
    recordCanvas: false,
    maskInputOptions: { password: true },
    sampling: { mousemove: 16, scroll: 33, input: 'last' },
    slimDOMOptions: { script: true, comment: true, headFavicon: true, headWhitespace: true, headMetaSocial: true, headMetaRobots: true, headMetaHttpEquiv: true, headMetaAuthorship: true, headMetaVerification: true },
  });
  setInterval(flush, 250);
  window.addEventListener('pagehide', flush);
  window.__rrMark = (name, data) => { window.rrweb.record.addCustomEvent('mark', { name, ...(data || {}) }); flush(); };
  window.__rrFlush = flush;
})();`;

async function authed(page) {
  return page.evaluate(() => fetch('/api/v1/projects').then((r) => r.status === 200).catch(() => false)).catch(() => false);
}
/** silent re-auth through Auth0 (no credentials are typed here; a dead Auth0 session means: run login.mjs) */
async function ensureAuth(page) {
  await page.goto('https://qa.replay.io/projects', { waitUntil: 'networkidle' }).catch(() => {});
  if (await authed(page)) return;
  for (let i = 0; i < 60; i++) {
    const u = page.url();
    if (u.startsWith('https://qa.replay.io') && (await authed(page))) return;
    if (u.startsWith('https://qa.replay.io')) await page.getByText('Sign In', { exact: true }).first().click({ timeout: 2000 }).catch(() => {});
    // Auth0 universal login → the Google connection (the browser profile already holds the Google session)
    else if (u.includes('auth0.com')) await page.getByText(/Continue with Google/i).first().click({ timeout: 2000 }).catch(() => {});
    // Google's account chooser: pick the signed-in account (never types anything)
    else if (u.includes('accounts.google.com')) await page.locator('[data-identifier], [data-email]').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1000);
    if (i % 5 === 4) {
      fs.mkdirSync('.orly-work/promo/probe', { recursive: true });
      await page.screenshot({ path: '.orly-work/promo/probe/auth-stuck.png' }).catch(() => {});
      console.log(`  auth: ${u.slice(0, 80)}`);
    }
  }
  throw new Error(`not signed in (stuck at ${page.url().slice(0, 60)}): run node tools/promo/login.mjs`);
}

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

async function main() {
  const takeMod = take ? await import(pathToFileURL(path.join(FILM, 'capture', 'takes', `${take}.mjs`)).href) : null;
  const meta = takeMod?.meta ?? {};
  const viewport = meta.viewport ?? { width: 1440, height: 900 };
  // attach to the signed-in Chrome that tools/promo/login.mjs keeps open (session-only cookies: it must stay alive);
  // every take records in its own new tab at the take's viewport
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9333').catch(() => {
    throw new Error('signed-in Chrome is not running: node tools/promo/login.mjs');
  });
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize(viewport);
  const finish = async () => {
    await page.close().catch(() => {});
    await browser.close(); // disconnect only
  };

  if (probe) {
    if (!arg("noauth", false)) await ensureAuth(page);
    // reconnaissance: load a page signed in, dump its text + a screenshot (no recording)
    await page.goto(probe, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1500);
    const out = path.join('.orly-work', 'promo', 'probe');
    fs.mkdirSync(out, { recursive: true });
    const name = probe.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 80);
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: !!arg('full', false) });
    fs.writeFileSync(path.join(out, `${name}.txt`), await page.innerText('body').catch(() => ''));
    console.log(path.join(out, `${name}.png`));
    await finish();
    return;
  }

  const file = path.join(RAW, `${take}.jsonl`);
  fs.writeFileSync(file, '');
  let count = 0;
  await page.exposeBinding('__rrEmit', (_src, events) => {
    fs.appendFileSync(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
    count += events.length;
  });
  await page.addInitScript(INIT);

  let mouse = { x: viewport.width / 2, y: viewport.height / 2 };
  const point = async (target) => {
    if (target && typeof target === 'object' && 'x' in target) return target;
    const loc = typeof target === 'string' ? page.locator(target).first() : target;
    await loc.waitFor({ state: 'visible', timeout: 20000 });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    if (!b) throw new Error(`no box for ${target}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const h = {
    page,
    async move(target, o = {}) {
      const to = await point(target);
      const from = { ...mouse };
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const dur = o.dur ?? Math.min(1100, 350 + dist * 0.6);
      // a gentle arc: control point offset perpendicular to the path
      const nx = -(to.y - from.y) / (dist || 1), ny = (to.x - from.x) / (dist || 1);
      const c = { x: (from.x + to.x) / 2 + nx * dist * 0.12, y: (from.y + to.y) / 2 + ny * dist * 0.12 };
      const steps = Math.max(2, Math.round(dur / 16));
      for (let i = 1; i <= steps; i++) {
        const u = ease(i / steps), v = 1 - u;
        const x = v * v * from.x + 2 * v * u * c.x + u * u * to.x;
        const y = v * v * from.y + 2 * v * u * c.y + u * u * to.y;
        await page.mouse.move(x, y);
        await page.waitForTimeout(16);
      }
      mouse = to;
      return to;
    },
    async hover(target, o) { await h.move(target, o); await page.waitForTimeout(o?.settle ?? 250); },
    async click(target, o = {}) {
      await h.move(target, o);
      await page.waitForTimeout(o.settle ?? 180);
      await page.mouse.down();
      await page.waitForTimeout(70);
      await page.mouse.up();
      await page.waitForTimeout(o.after ?? 400);
    },
    async type(text, o = {}) {
      const cps = o.cps ?? 14;
      for (const ch of text) {
        await page.keyboard.type(ch);
        await page.waitForTimeout(1000 / cps * (ch === ' ' ? 1.6 : 0.7 + ((ch.charCodeAt(0) * 7919) % 60) / 100));
      }
    },
    async scroll(dy, o = {}) {
      const dur = o.dur ?? 900;
      const steps = Math.max(2, Math.round(dur / 16));
      let done = 0;
      for (let i = 1; i <= steps; i++) {
        const want = Math.round(dy * ease(i / steps));
        await page.mouse.wheel(0, want - done);
        done = want;
        await page.waitForTimeout(16);
      }
    },
    wait: (ms) => page.waitForTimeout(ms),
    async mark(name, data) {
      await page.evaluate(([n, d]) => window.__rrMark?.(n, d), [name, data ?? null]);
      console.log(`  mark ${name}`);
    },
  };

  // qa.replay.io's own session cookie is session-only; the Auth0 session (persistent) re-issues it silently
  await ensureAuth(page);
  const url = meta.url;
  if (url) await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(meta.settle ?? 1200);
  console.log(`take ${take}: recording ${url ?? '(no url)'}`);
  await takeMod.default(page, h);
  await page.evaluate(() => window.__rrFlush?.());
  await page.waitForTimeout(400);
  await finish();
  console.log(`take ${take}: ${count} events → ${path.relative(process.cwd(), file)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
