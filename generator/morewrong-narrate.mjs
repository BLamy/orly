// Narrate MoreWrong: one ElevenLabs clip per node beat (and per Book-20 ending),
// written to public/morewrong-audio/<key>.mp3 where key is the node id
// (e.g. b01_start) or `ending-<id>` (e.g. ending-morewrong). Same voice as the
// viz scenes for consistency. IDEMPOTENT — a key whose mp3 already exists is
// skipped, so re-runs cost nothing. Also writes index.json (key -> { dur }).
//
//   node generator/morewrong-narrate.mjs [--voice <id>] [--concurrency 4]
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizeChapter } from './tts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(ROOT, '.env')); } catch { /* rely on the environment */ }
const SCRIPT_DIR = join(ROOT, 'src/morewrong/script');
const OUT_DIR = join(ROOT, 'public/morewrong-audio');
const DEFAULT_VOICE = 'Fahco4VZzobUeiPqni1S'; // same voice as generator/viz-narrate.mjs

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const voiceId = arg('voice', DEFAULT_VOICE);
const concurrency = Math.max(1, Number(arg('concurrency', '4')) || 4);

mkdirSync(OUT_DIR, { recursive: true });

// ---- collect every clip: node beats + Book-20 endings --------------------
const clips = []; // { key, text }
const seen = new Set();
const bookFiles = readdirSync(SCRIPT_DIR).filter((f) => /^book-\d+\.json$/.test(f)).sort();
for (const f of bookFiles) {
  const book = JSON.parse(readFileSync(join(SCRIPT_DIR, f), 'utf8'));
  for (const node of book.nodes ?? []) {
    if (node.beat && !seen.has(node.id)) { clips.push({ key: node.id, text: node.beat }); seen.add(node.id); }
  }
  for (const e of book.endings ?? []) {
    const key = `ending-${e.id}`;
    if (e.text && !seen.has(key)) { clips.push({ key, text: e.text }); seen.add(key); }
  }
}

// v2 branching graph (script/graph.json): one clip per node beat, and per
// ending node (keyed by the node id, so the game plays it on arrival).
const graphPath = join(SCRIPT_DIR, 'graph.json');
if (existsSync(graphPath)) {
  const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
  for (const node of graph.nodes ?? []) {
    const text = node.beat || node.ending?.text;
    if (text && !seen.has(node.id)) { clips.push({ key: node.id, text }); seen.add(node.id); }
  }
}

// ---- load existing index; decide what to synthesize ----------------------
const indexPath = join(OUT_DIR, 'index.json');
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : {};
const pending = clips.filter((c) => !existsSync(join(OUT_DIR, `${c.key}.mp3`)));
const skipped = clips.length - pending.length;
console.log(`morewrong-narrate: ${clips.length} clips total · ${skipped} already present · ${pending.length} to synthesize · voice ${voiceId}`);

// ---- synthesize with a small worker pool + retry -------------------------
let done = 0;
let failed = 0;
async function synthOne(clip) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { mp3, audioEnd } = await synthesizeChapter({ spokenSegments: [clip.text], voiceId, sep: ' ' });
      writeFileSync(join(OUT_DIR, `${clip.key}.mp3`), mp3);
      index[clip.key] = { dur: Number(audioEnd.toFixed(2)) };
      writeFileSync(indexPath, JSON.stringify(index, null, 2)); // incremental → resumable
      done++;
      if (done % 10 === 0 || done === pending.length) console.log(`  … ${done}/${pending.length} synthesized`);
      return;
    } catch (err) {
      if (attempt === 3) { failed++; console.error(`  ✗ ${clip.key}: ${err.message}`); return; }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

const queue = [...pending];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
    while (queue.length) await synthOne(queue.shift());
  }),
);

// backfill dur for any pre-existing mp3 missing from the index (best-effort estimate)
for (const c of clips) {
  if (index[c.key]) continue;
  if (existsSync(join(OUT_DIR, `${c.key}.mp3`))) {
    const words = c.text.trim().split(/\s+/).length;
    index[c.key] = { dur: Number((words / 2.7).toFixed(2)) }; // ~2.7 words/s fallback
  }
}
writeFileSync(indexPath, JSON.stringify(index, null, 2));

const totalBytes = readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp3')).reduce((n, f) => n + (existsSync(join(OUT_DIR, f)) ? readFileSync(join(OUT_DIR, f)).length : 0), 0);
console.log(`✓ done — ${done} synthesized, ${skipped} skipped, ${failed} failed · ${(totalBytes / 1024 / 1024).toFixed(1)} MB · index ${indexPath}`);
if (failed) process.exit(1);
