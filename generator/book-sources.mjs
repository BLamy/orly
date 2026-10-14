#!/usr/bin/env node
// book-sources.mjs — validate a book's sources page and bind it into the manifest.
//
//   node generator/book-sources.mjs --slug <slug> [--min-coverage 0.7] [--no-bind]
//   npm run book:sources -- --slug <slug>
//
// A book's claims live in public/generated/<slug>/sources.json (authored by the book's author, like blog.md):
//   { "version": 1, "slug": "<slug>", "chapters": [ { "number": 1, "title": "…", "claims": [
//       { "id": "c1-manager-fans-out", "claim": "A manager spawns a fixed trio of specialists…", "caption": 1,
//         "status": "verified",                                   // verified (default) | paraphrase | inferred
//         "sources": [
//           { "label": "designing-entities / manager-worker pattern",
//             "repo": "electric-sql/electric@<40-hex sha>", "path": "packages/agents-runtime/…/manager-worker.md",
//             "lines": "12-40", "quote": "a short verbatim excerpt" },
//           { "label": "Durable Streams protocol", "url": "https://…" } ] } ] } ] }
// Rules (docs/book-quality.md §Sources): every chapter has claims; every claim has >= 1 source; repo sources pin a commit
// SHA (not a branch) and name a path; web sources are https; ids are unique; `caption` indexes a real narration caption
// (0-based, the manifest's cue index); and >= --min-coverage of each chapter's captions are the `caption` of some claim
// (the rest are connective tissue; say so by keeping coverage honest, not by padding claims). A claim marked "inferred"
// is the author's own reading and must say so in its text. On success the manifest gets `sources: "sources.json"`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const slug = opt('slug');
if (!slug) {
  console.error('usage: node generator/book-sources.mjs --slug <slug> [--min-coverage 0.7] [--no-bind]');
  process.exit(2);
}
const minCov = Number(opt('min-coverage', 0.7));
const dir = join(ROOT, 'public', 'generated', slug);
const mPath = join(dir, 'manifest.json');
const sPath = join(dir, 'sources.json');
for (const p of [mPath, sPath]) if (!existsSync(p)) (console.error(`missing ${p}`), process.exit(2));
const manifest = JSON.parse(readFileSync(mPath, 'utf8'));
const doc = JSON.parse(readFileSync(sPath, 'utf8'));

const errors = [];
const warns = [];
const ids = new Set();
let claims = 0;
let links = 0;
if (doc.version !== 1) errors.push('version must be 1');
for (const mc of manifest.chapters) {
  const ch = (doc.chapters || []).find((c) => c.number === mc.number);
  if (!ch || !(ch.claims || []).length) {
    errors.push(`chapter ${mc.number}: no claims`);
    continue;
  }
  const nCaps = (mc.cues || []).length;
  const cited = new Set();
  for (const c of ch.claims) {
    claims++;
    const where = `chapter ${mc.number} ${c.id ?? '(no id)'}`;
    if (!c.id) errors.push(`${where}: missing id`);
    else if (ids.has(c.id)) errors.push(`${where}: duplicate id`);
    else ids.add(c.id);
    if (!c.claim || c.claim.length < 20) errors.push(`${where}: claim text missing or too short to be checkable`);
    if (c.status && !['verified', 'paraphrase', 'inferred'].includes(c.status)) errors.push(`${where}: bad status ${c.status}`);
    if (c.caption != null) {
      if (!Number.isInteger(c.caption) || c.caption < 0 || c.caption >= nCaps) errors.push(`${where}: caption ${c.caption} is not one of this chapter's ${nCaps} captions`);
      else cited.add(c.caption);
    }
    if (!(c.sources || []).length) errors.push(`${where}: no sources`);
    for (const s of c.sources || []) {
      links++;
      if (!s.label) errors.push(`${where}: a source has no label`);
      if (s.url) {
        if (!/^https:\/\/[^\s]+$/.test(s.url)) errors.push(`${where}: url must be https (${s.url})`);
      } else if (s.repo) {
        if (!/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/i.test(s.repo)) errors.push(`${where}: repo must pin a full 40-hex commit sha: owner/repo@<sha> (${s.repo})`);
        if (!s.path) errors.push(`${where}: repo source needs a path`);
        if (s.lines && !/^\d+(-\d+)?$/.test(s.lines)) errors.push(`${where}: lines must look like 12 or 12-40`);
      } else errors.push(`${where}: a source needs a url, or a repo + path`);
    }
  }
  const cov = nCaps ? cited.size / nCaps : 1;
  if (cov < minCov) errors.push(`chapter ${mc.number}: only ${cited.size}/${nCaps} captions are cited by a claim (${(cov * 100).toFixed(0)}% < ${(minCov * 100).toFixed(0)}%)`);
  else if (cov < 0.9) warns.push(`chapter ${mc.number}: ${nCaps - cited.size} uncited captions (${(cov * 100).toFixed(0)}% covered)`);
}
for (const ch of doc.chapters || []) if (!manifest.chapters.some((m) => m.number === ch.number)) errors.push(`sources.json has chapter ${ch.number}, which the manifest does not`);

warns.forEach((w) => console.log(`warn: ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`ERROR: ${e}`));
  console.error(`${slug}: ${errors.length} problem(s); not bound`);
  process.exit(1);
}
if (!argv.includes('--no-bind')) {
  manifest.sources = 'sources.json';
  writeFileSync(mPath, JSON.stringify(manifest, null, 2));
}
console.log(`${slug}: ${claims} claims, ${links} source links, all checks pass${argv.includes('--no-bind') ? '' : '; manifest.sources bound'}`);
