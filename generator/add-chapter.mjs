// Add ONE chapter to an existing generated book, in place: validate + relayout
// just the new chapter, narrate only it (ElevenLabs), apply icons, and append to
// manifest.json + storyboard.json + library.json. The other chapters, the cover,
// and their audio are left untouched.
//   node generator/add-chapter.mjs <slug> <chapter.json>
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

const [slug, chPath] = process.argv.slice(2);
if (!slug || !chPath) { console.error('usage: node generator/add-chapter.mjs <slug> <chapter.json>'); process.exit(1); }

const dir = join(ROOT, 'public', 'generated', slug);
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const sb = JSON.parse(readFileSync(join(dir, 'storyboard.json'), 'utf8'));
const ch = JSON.parse(readFileSync(chPath, 'utf8'));
ch.number = ch.number || sb.chapters.length + 1;
const realNumber = ch.number;

// 1) validate + relayout JUST this chapter (others are not touched). The
// validator expects 1-based numbering within the storyboard it's handed, so
// validate the chapter as "#1", then restore its real number.
ch.number = 1;
const mini = { title: sb.title, subtitle: sb.subtitle, throughline: sb.throughline, chapters: [ch] };
const v = validateStoryboard(mini);
v.warnings.forEach((w) => log(`fix: ${w}`));
if (!v.ok) { console.error('chapter invalid:\n' + v.errors.join('\n')); process.exit(1); }
ch.number = realNumber;

// 2) narrate only the new chapter
log(`tts ch${ch.number} "${ch.title}" (${ch.steps.length} segments) …`);
const r = await synthesizeChapter({ spokenSegments: ch.steps.map((s) => s.spoken), voiceId: VOICE });
const fname = `chapter-${ch.number}.${r.ext}`;
writeFileSync(join(dir, 'audio', fname), r.audio);
log(`  ${(r.audio.length / 1024).toFixed(0)}KB, ${r.audioEnd.toFixed(1)}s`);
const ca = { audio: `generated/${slug}/audio/${fname}`, cues: r.cues, audioEnd: r.audioEnd };

// 3) build the manifest chapter + apply icons
const m = storyboardToManifest(mini, { chapterAudio: [ca], slug }).chapters[0];
if (hasNoun()) {
  const credits = await applyIcons(m.story, new Map());
  manifest.iconCredits = [...new Set([...(manifest.iconCredits || []), ...credits])];
  log(`  icons: +${credits.length} credits`);
}

// 4) append + write everything
manifest.chapters.push(m);
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
sb.chapters.push(ch);
writeFileSync(join(dir, 'storyboard.json'), JSON.stringify(sb, null, 2));

const libPath = join(ROOT, 'public', 'generated', 'library.json');
const lib = JSON.parse(readFileSync(libPath, 'utf8'));
const book = lib.books.find((b) => b.slug === slug);
if (book) {
  book.chapters = book.chapters || [];
  book.chapters.push({ number: ch.number, title: ch.title, duration: Math.round(ca.audioEnd) });
  writeFileSync(libPath, JSON.stringify(lib, null, 2));
}
log(`\x1b[32m✓\x1b[0m added chapter ${ch.number} "${ch.title}" to ${slug} — ${manifest.chapters.length} chapters total`);
