#!/usr/bin/env node
// Dump Replay QA API data through the signed-in Chrome (same-origin fetch with the user's session) into
// films/<slug>/capture/api/<name>.json (gitignored). Usage: api-dump.mjs --slug s <name>=<api path> ...
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const slug = args[args.indexOf('--slug') + 1];
const pairs = args.filter((a) => a.includes('=') && a.includes('/api/'));
const OUT = path.resolve('films', slug, 'capture', 'api');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().startsWith('https://qa.replay.io')) ?? (await ctx.newPage());
if (!page.url().startsWith('https://qa.replay.io')) await page.goto('https://qa.replay.io/projects');
for (const pr of pairs) {
  const [name, api] = [pr.slice(0, pr.indexOf('=')), pr.slice(pr.indexOf('=') + 1)];
  const r = await page.evaluate(async (u) => { const x = await fetch(u); return { status: x.status, body: await x.text() }; }, api);
  fs.writeFileSync(path.join(OUT, name.replace(/[^a-z0-9._-]/gi, '_') + '.json'), r.body);
  console.log(`${name}: ${r.status} ${r.body.length} B`);
}
await browser.close();
