#!/usr/bin/env node
// Film quotation budget (2026-11-01): quoted material from any ONE source URL stays <= 25 words in total.
// Counted, every appearance separately (repeats count again):
//   - every quoted span in narration (line text), every on-screen card of kind "quote", every credits quotation
//     (story/meta.json staging.creditsSources "<quote> — <who>"), matched to research/quotes.json for its URL;
//   - every UNMARKED run of >= 5 consecutive words in narration or on-screen labels that is verbatim in a source's
//     verified witness text (only when the ignored witness file is present: .orly-work/durable-quote-witnesses/);
//   - CONSERVATIVE: attributed near-verbatim paraphrases listed below (counted although they are not exact runs).
// Words = whitespace tokens after removing ellipses and punctuation-only tokens.
//   node films/durable-objects-unbound/research/tools/quote-budget.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT = path.resolve(FILM, '../..');
const LIMIT = 25;
const read = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d);
const quotes = read(path.join(FILM, 'research/quotes.json'), []);
const script = read(path.join(FILM, 'story/script.json'));
const meta = read(path.join(FILM, 'story/meta.json'));
const witnesses = read(path.join(ROOT, '.orly-work/durable-quote-witnesses/quotes.full-2026-11-01.json'), null);
const CONSERVATIVE = [{ where: 'narration L0408', source: 'https://blog.cloudflare.com/deno-joins-cloudflare/', text: 'one big gap in production readiness', why: 'attributed ("He called it") near-verbatim of the 2026 post' }];

const norm = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => String(s).replace(/…|\.\.\./g, ' ').split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
const stripAttr = (t) => t.replace(/\s+[—–]\s+[^—–]*$/, '').replace(/^[“"…\s]+|[”"…\s]+$/g, '');
const findQ = (text) => {
  const frags = String(text).split(/…|\.\.\./).map(norm).filter((f) => f.split(' ').length >= 3);
  return frags.length ? quotes.find((q) => frags.every((f) => norm(q.text).includes(f))) ?? null : null;
};
const spans = (s) => [...String(s).matchAll(/“([^”]+)”|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);

const by = new Map();
const add = (source, where, text, kind) => {
  if (!by.has(source)) by.set(source, { source, items: [], total: 0 });
  const e = by.get(source);
  const n = words(text);
  e.items.push({ where, kind, words: n, text });
  e.total += n;
};
const unmatched = [];
for (const ch of script.chapters)
  for (const sh of ch.shots) {
    for (const l of sh.lines || [])
      for (const sp of spans(l.text)) {
        const q = findQ(sp);
        if (q) add(q.source, `narration ${l.id}`, sp, 'narration quote');
        else unmatched.push(`${l.id}: "${sp}"`);
      }
    for (const o of sh.onScreenText || [])
      if (o.kind === 'quote') {
        const b = stripAttr(o.text);
        const q = findQ(b);
        if (q) add(q.source, `card ${sh.id}`, b, 'on-screen quote');
        else unmatched.push(`${sh.id} card: "${b}"`);
      }
  }
for (const e of meta.staging?.creditsSources || []) {
  const m = String(e.text).match(/^(.*\S)\s+—\s+[^—]+$/s);
  if (!m) continue;
  const b = stripAttr(e.text);
  const q = findQ(b);
  if (q) add(q.source, `credits (${e.from})`, b, 'credits quote');
}
// unmarked verbatim runs (>= 5 words) of any witness in narration and labels
if (witnesses) {
  const W = witnesses.map((w) => ({ ...w, t: norm(w.text).split(' ') }));
  const scan = (where, text) => {
    const t = norm(String(text).replace(/“[^”]+”|"[^"]+"/g, ' | ')).split(' ');
    for (const w of W) {
      let best = null;
      for (let i = 0; i < t.length; i++)
        for (let j = 0; j < w.t.length; j++) {
          let k = 0;
          while (i + k < t.length && j + k < w.t.length && t[i + k] === w.t[j + k]) k++;
          if (k >= 5 && (!best || k > best.k)) best = { k, run: t.slice(i, i + k).join(' ') };
        }
      if (best) add(w.source, where, best.run, `unmarked run (${w.id})`);
    }
  };
  for (const ch of script.chapters)
    for (const sh of ch.shots) {
      for (const l of sh.lines || []) scan(`narration ${l.id}`, l.text);
      for (const o of sh.onScreenText || []) if (o.kind !== 'quote') scan(`${o.kind} ${sh.id}`, o.text);
    }
}
for (const c of CONSERVATIVE) add(c.source, c.where, c.text, `conservative: ${c.why}`);

const rows = [...by.values()].sort((a, b) => b.total - a.total);
const over = rows.filter((r) => r.total > LIMIT);
if (process.argv.includes('--json')) console.log(JSON.stringify({ limit: LIMIT, witnessesChecked: !!witnesses, rows, unmatched }, null, 1));
else {
  for (const r of rows) {
    console.log(`${String(r.total).padStart(3)} / ${LIMIT}  ${r.source}`);
    for (const i of r.items) console.log(`        ${String(i.words).padStart(2)}  ${i.where} · ${i.kind}`);
  }
  if (!witnesses) console.log('(witness file absent: unmarked runs not checked)');
  if (unmatched.length) console.log(`UNMATCHED quotations: ${unmatched.join('; ')}`);
  console.log(over.length || unmatched.length ? `FAIL: ${over.map((r) => r.source).join(', ')}` : `ok: every source <= ${LIMIT} words`);
}
process.exit(over.length || unmatched.length ? 1 : 0);
