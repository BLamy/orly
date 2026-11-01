#!/usr/bin/env node
// Film-specific post-publish correction for durable-objects-unbound (re-run after EVERY film:publish).
// The shared helpers (generator/film/lib/credits.mjs, lib/sources.mjs) carry wording from a different documentary:
// "Anthropic ... a lab in this story". Anthropic is not a party to Durable Objects, Unbound. This rewrites ONLY this
// film's generated outputs, keeping the true disclosure that Claude Opus 5.5 (made by Anthropic) wrote the film.
// Exit 1 if the stale phrase survives anywhere in the film's generated files.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const PUB = path.join(ROOT, 'public/generated/durable-objects-unbound');
const APP = path.join(ROOT, 'apps/bookshelf/src/viz/films/durable-objects-unbound/credits.json');
const R = [
  [' Anthropic is a lab in this story, held to the same sources and standard as every other.', ' Claude Opus 5.5 is made by Anthropic.'],
  ['Claude is made by Anthropic, a lab in this story, held to the same sources as every other.', 'Claude is made by Anthropic.'],
  ['Written with Claude Opus 5.5, made by Anthropic, a lab in this story, and held to the same sources and standard as every other.',
    'Written with Claude Opus 5.5, made by Anthropic; every claim and quotation is held to the cited sources above.'],
];
const files = [path.join(PUB, 'credits.json'), path.join(PUB, 'sources/index.html'), APP].filter((f) => fs.existsSync(f));
let bad = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  for (const [a, b] of R) s = s.split(a).join(b);
  if (s !== before) fs.writeFileSync(f, s);
  const left = /lab in this story/.test(s);
  if (left) bad++;
  console.log(`${path.relative(ROOT, f)}: ${s !== before ? 'corrected' : 'unchanged'}${left ? ' — STALE PHRASE REMAINS' : ''}; Anthropic disclosure ${/made by Anthropic/.test(s) ? 'kept' : 'absent'}`);
}

// Published-only chapter-4 blurb: the locked ch04 blurb repeats the retired quote's wording, so the PUBLISHED manifest
// (only) carries the exact, already-authored L0404 narration instead. No story, script, meta or timeline file changes.
const FILM = path.join(ROOT, 'films/durable-objects-unbound');
const BLURB = 'celld runs a Workers application on machines you own: Durable Objects, self-hosted and distributed, with long-term state in a bucket.';
const script = JSON.parse(fs.readFileSync(path.join(FILM, 'story/script.json'), 'utf8'));
const l0404 = script.chapters.flatMap((c) => c.shots).flatMap((s) => s.lines || []).find((l) => l.id === 'L0404');
if (l0404?.text !== BLURB) {
  console.error(`L0404 in story/script.json is not the expected blurb text: ${JSON.stringify(l0404?.text)}`);
  bad++;
} else {
  const mf = path.join(PUB, 'manifest.json');
  const raw = fs.readFileSync(mf, 'utf8');
  const m = JSON.parse(raw);
  const ch4 = m.chapters.find((c) => c.number === 4);
  if (ch4.blurb === BLURB) {
    console.log('manifest.json chapter 4 blurb: unchanged (already L0404)');
  } else {
    const from = JSON.stringify(ch4.blurb);
    if (raw.split(from).length !== 2) {
      console.error('manifest.json: chapter 4 blurb text is not unique in the file');
      bad++;
    } else {
      fs.writeFileSync(mf, raw.replace(from, () => JSON.stringify(BLURB)));
      console.log('manifest.json chapter 4 blurb: replaced with L0404');
    }
  }
}
process.exit(bad ? 1 : 0);
