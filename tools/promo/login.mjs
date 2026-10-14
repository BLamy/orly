// Opens the real Google Chrome (own profile under ~/Library/Caches, never ~/Documents) on qa.replay.io's sign-in
// and KEEPS IT OPEN with a CDP port: qa.replay.io's and Google's session cookies are session-only, so the
// signed-in browser must stay alive. rr-capture.mjs attaches to it (connectOverCDP) and records in new tabs.
// The session is also saved (storageState, session cookies included) to ~/Library/Caches/orly-promo/state.json.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const DIR = process.env.HOME + '/Library/Caches/orly-promo';
const PROFILE = DIR + '/chrome-profile';
export const CDP_PORT = 9333;
fs.mkdirSync(DIR, { recursive: true });

const up = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`).then((r) => r.ok).catch(() => false);
if (!up) {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const child = spawn(chrome, [`--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDP_PORT}`, '--no-first-run', '--no-default-browser-check', '--window-size=1500,1000', 'https://qa.replay.io/projects'], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 40 && !(await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`).then((r) => r.ok).catch(() => false)); i++) await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('replay.io') || p.url().includes('auth0') || p.url().includes('google')) ?? ctx.pages()[0];
const authed = () => page.evaluate(() => fetch('/api/v1/projects').then((r) => r.status === 200).catch(() => false)).catch(() => false);
const deadline = Date.now() + 30 * 60_000;
while (Date.now() < deadline) {
  if (page.url().startsWith('https://qa.replay.io') && (await authed())) {
    await ctx.storageState({ path: DIR + '/state.json' });
    console.log('SIGNED_IN (Chrome stays open; do not close that window)');
    await browser.close(); // disconnects CDP only; Chrome keeps running
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 2000));
}
console.log('TIMEOUT');
process.exit(1);
