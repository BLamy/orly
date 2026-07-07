// Rebuild ONE existing chapter of a book in place, after its chapter in
// storyboard.json was edited (reword narration, relabel a node, fix a step…).
// Re-narrates just that chapter, re-applies icons + layout, and replaces it in
// manifest.json. Other chapters, their audio, and the cover are untouched.
//   node generator/regen-chapter.mjs <slug> <chapterNumber> [--no-tts]
// --no-tts: keep the existing audio/cues (use only when the spoken text and step
//           count are unchanged — e.g. a node-label or layout-only tweak).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboard } from './validate.mjs';
import { synthesizeChapter } from './tts.mjs';
import { storyboardToManifest } from './transform.mjs';
import { applyIcons } from './iconize.mjs';
import { hasNoun } from './noun.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(ROOT, '.env')); } catch { /* rely on env */ }
const log = (m) => console.error(`\x1b[36m▸\x1b[0m ${m}`);
const VOICE = 'Fahco4VZzobUeiPqni1S';

const argv = process.argv.slice(2);
const noTts = argv.includes('--no-tts');
const [slug, numStr] = argv.filter((a) => !a.startsWith('--'));
const number = parseInt(numStr, 10);
if (!slug || !number) { console.error('usage: node generator/regen-chapter.mjs <slug> <chapterNumber> [--no-tts]'); process.exit(1); }

const dir = join(ROOT, 'public', 'generated', slug);
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const sb = JSON.parse(readFileSync(join(dir, 'storyboard.json'), 'utf8'));
const ch = sb.chapters.find((c) => c.number === number);
if (!ch) { console.error(`no chapter ${number} in ${slug}`); process.exit(1); }

// validate + relayout just this chapter (validator wants 1-based; restore after)
const real = ch.number;
ch.number = 1;
const v = validateStoryboard({ title: sb.title, subtitle: sb.subtitle, throughline: sb.throughline, chapters: [ch] });
v.warnings.forEach((w) => log(`fix: ${w}`));
if (!v.ok) { console.error('chapter invalid:\n' + v.errors.join('\n')); process.exit(1); }
ch.number = real;

const prev = manifest.chapters.find((c) => c.number === number);
let ca;
if (noTts && prev?.audio && prev.story.steps.length === ch.steps.length) {
  ca = { audio: prev.audio, cues: prev.story.steps.map((s, i) => s.cue ?? i), audioEnd: prev.audioEnd };
  log(`keeping existing audio for ch${number} (--no-tts)`);
} else {
  log(`tts ch${number} "${ch.title}" (${ch.steps.length} segments) …`);
  const r = await synthesizeChapter({ spokenSegments: ch.steps.map((s) => s.spoken), voiceId: VOICE });
  const fname = `chapter-${number}.${r.ext}`;
  writeFileSync(join(dir, 'audio', fname), r.audio);
  ca = { audio: `generated/${slug}/audio/${fname}`, cues: r.cues, audioEnd: r.audioEnd };
  log(`  ${(r.audio.length / 1024).toFixed(0)}KB, ${r.audioEnd.toFixed(1)}s`);
}

const m = storyboardToManifest({ title: sb.title, subtitle: sb.subtitle, throughline: sb.throughline, chapters: [ch] }, { chapterAudio: [ca], slug }).chapters[0];
if (hasNoun()) await applyIcons(m.story, new Map());

const mIdx = manifest.chapters.findIndex((c) => c.number === number);
manifest.chapters[mIdx] = m;
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(dir, 'storyboard.json'), JSON.stringify(sb, null, 2));

const libPath = join(ROOT, 'public', 'generated', 'library.json');
const lib = JSON.parse(readFileSync(libPath, 'utf8'));
const lc = lib.books.find((b) => b.slug === slug)?.chapters?.find((c) => c.number === number);
if (lc) { lc.title = ch.title; lc.duration = Math.round(ca.audioEnd); writeFileSync(libPath, JSON.stringify(lib, null, 2)); }

log(`\x1b[32m✓\x1b[0m rebuilt chapter ${number} "${ch.title}" of ${slug}`);
