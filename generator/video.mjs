#!/usr/bin/env node
// video.mjs — the v3 book pipeline: scene-native videos.
//
// A v3 book is N authored timeline scenes at src/viz/books/<slug>/chapter-<n>.tsx
// (single-file 3b1bd3 scenes exporting vizScene()/Render; auto-registered by the
// scenes.ts glob). The scene's captions ARE the narration script: each
// tl.caption({at, dur, text}) is one spoken line. This script:
//   1. discovers the chapters and extracts each scene's ordered captions,
//   2. narrates each chapter with ElevenLabs (one MP3 per chapter, word-exact
//      cues = the second in the MP3 where each caption's first word starts),
//   3. generates the O'RLY animal cover (seeded gpt-image + vision QA),
//   4. writes public/generated/<slug>/manifest.json (format 3) and upserts the
//      shelf registry public/generated/library.json.
//
//   node generator/video.mjs --slug <slug> --title "<Title>"
//     [--subtitle "…"] [--accent "#hex"] [--animal "<animal>"]
//     [--chapter-titles "t1|t2|…"] [--blurbs "b1|b2|…"]
//     [--voice <elevenlabs-voice-id>] [--no-tts] [--no-cover]
//
// Env (.env, gitignored): ELEVENLABS_API_KEY (narration), OPENAI_API_KEY (cover).
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { synthesizeChapter } from './tts.mjs';
import { extractScene } from './scene-captions.mjs';
import { generateAnimal, thumbnailAnimal } from './cover.mjs';
import { upsertBook, colorForSlug } from './library.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOICE_DEFAULT = 'Fahco4VZzobUeiPqni1S';
const AUTHOR_DEFAULT = 'Brett Lamy';
const ROLE_DEFAULT = 'Software Engineer at Replay';

try { process.loadEnvFile(join(ROOT, '.env')); } catch { /* rely on the environment */ }

const log = (m) => console.error(`\x1b[36m▸\x1b[0m ${m}`);

function parseArgs(argv) {
  const a = { tts: true, cover: true, author: AUTHOR_DEFAULT, role: ROLE_DEFAULT };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const val = () => argv[++i];
    if (k === '--slug') a.slug = val();
    else if (k === '--title') a.title = val();
    else if (k === '--subtitle') a.subtitle = val();
    else if (k === '--accent') a.accent = val();
    else if (k === '--animal') a.animal = val();
    else if (k === '--author') a.author = val();
    else if (k === '--role') a.role = val();
    else if (k === '--chapter-titles') a.chapterTitles = val().split('|').map((s) => s.trim());
    else if (k === '--blurbs') a.blurbs = val().split('|').map((s) => s.trim());
    else if (k === '--voice') a.voice = val();
    else if (k === '--no-tts') a.tts = false;
    else if (k === '--no-cover') a.cover = false;
    else if (k === '--help' || k === '-h') a.help = true;
  }
  return a;
}

function discoverChapters(slug) {
  const dir = join(ROOT, 'src', 'viz', 'books', slug);
  if (!existsSync(dir)) throw new Error(`no scenes at src/viz/books/${slug}/ — author chapter-<n>.tsx first`);
  const files = readdirSync(dir)
    .map((f) => { const m = /^chapter-(\d+)\.tsx$/.exec(f); return m && { n: Number(m[1]), file: join(dir, f) }; })
    .filter(Boolean)
    .sort((a, b) => a.n - b.n);
  if (!files.length) throw new Error(`src/viz/books/${slug}/ has no chapter-<n>.tsx files`);
  return files;
}

/** Chapter title fallback: leading comment, else a trimmed first caption. */
function deriveTitle(extracted, n) {
  const c = extracted.leadingComment
    .replace(/^chapter\s*\d+\s*[—:-]\s*/i, '')
    .trim();
  if (c) return c;
  const first = extracted.captions[0]?.text ?? '';
  const short = first.split(/[.!?—]/)[0].trim();
  return short || `Chapter ${n}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.slug || !args.title) {
    console.log(`Usage: node generator/video.mjs --slug <slug> --title "<Title>" [options]
  --slug <slug>             book slug; scenes at src/viz/books/<slug>/chapter-<n>.tsx
  --title "<Title>"         book title (cover + shelf)
  --subtitle "…"            book subtitle
  --accent "#hex"           accent color (default: hashed from slug)
  --animal "<animal>"       cover animal hint (default: the model picks)
  --chapter-titles "a|b|…"  per-chapter titles (default: scene leading comment / first caption)
  --blurbs "a|b|…"          per-chapter blurbs (default: first caption)
  --voice <id>              ElevenLabs voice id (default ${VOICE_DEFAULT})
  --no-tts                  skip narration (silent preview; cues fall back to authored times)
  --no-cover                skip the animal cover
Env: ELEVENLABS_API_KEY (narration), OPENAI_API_KEY (cover).`);
    process.exit(args.help ? 0 : 1);
  }
  const { slug } = args;

  // 1) discover + extract
  const files = discoverChapters(slug);
  log(`${slug}: ${files.length} chapter scene(s)`);
  const extracted = [];
  for (const { n, file } of files) {
    const ex = await extractScene(file);
    if (!ex.captions.length) throw new Error(`chapter ${n}: scene has no captions — captions are the narration script`);
    log(`  chapter ${n}: ${ex.captions.length} captions, ${ex.duration.toFixed(1)}s timeline`);
    extracted.push({ n, file, ...ex });
  }

  const outDir = join(ROOT, 'public', 'generated', slug);
  mkdirSync(join(outDir, 'audio'), { recursive: true });

  // 2) narrate — one MP3 per chapter; cues = MP3 second of each caption's first word.
  //    '\n\n' between lines gives the voice a natural ~0.6s breath per line.
  const chapters = [];
  for (const ex of extracted) {
    const { n } = ex;
    const title = args.chapterTitles?.[n - 1] || deriveTitle(ex, n);
    const blurb = args.blurbs?.[n - 1] || ex.captions[0].text;
    let cues, duration;
    if (args.tts) {
      log(`tts chapter ${n} "${title}" (${ex.captions.length} lines) …`);
      const r = await synthesizeChapter({
        spokenSegments: ex.captions.map((c) => c.text),
        voiceId: args.voice || VOICE_DEFAULT,
        sep: '\n\n',
      });
      writeFileSync(join(outDir, 'audio', `chapter-${n}.mp3`), r.mp3);
      cues = r.cues.map((c) => Number(c.toFixed(3)));
      duration = Number(r.audioEnd.toFixed(3));
      log(`  ${(r.mp3.length / 1024).toFixed(0)}KB, ${duration.toFixed(1)}s${r.alignedExact ? '' : ' (approx cues)'}`);
    } else {
      cues = ex.captions.map((c) => Number(c.at.toFixed(3))); // authored times
      duration = Number(ex.duration.toFixed(3));
      log(`  chapter ${n}: --no-tts, cues = authored caption times`);
    }
    chapters.push({
      number: n,
      title,
      blurb,
      scene: `books/${slug}/chapter-${n}`,
      audio: `audio/chapter-${n}.mp3`,
      cues,
      duration,
    });
  }

  // 3) cover
  let animalRel;
  if (args.cover) {
    if (!process.env.OPENAI_API_KEY) {
      console.error('\x1b[33m⚠ OPENAI_API_KEY missing — skipping the animal cover\x1b[0m');
    } else {
      try {
        log('generating cover art (gpt-image, seeded + QA loop) …');
        await generateAnimal({
          animal: args.animal,
          topic: args.title,
          outPath: join(outDir, 'animal.png'),
          log: (m) => log('  ' + m),
        });
        // the multi-MB PNG is a local artifact (gitignored); the shelf ships the webp
        await thumbnailAnimal(join(outDir, 'animal.png'), join(outDir, 'animal.webp'));
        animalRel = `generated/${slug}/animal.webp`;
        log(`  wrote ${animalRel} (thumbnail; full PNG kept locally, not committed)`);
      } catch (e) {
        console.error(`\x1b[33m⚠ cover art failed (continuing without it): ${e.message}\x1b[0m`);
      }
    }
  }

  // A cover from a previous run still counts (e.g. re-run with --no-cover).
  if (!animalRel && existsSync(join(outDir, 'animal.webp'))) animalRel = `generated/${slug}/animal.webp`;
  if (!animalRel && existsSync(join(outDir, 'animal.png'))) {
    await thumbnailAnimal(join(outDir, 'animal.png'), join(outDir, 'animal.webp'));
    animalRel = `generated/${slug}/animal.webp`;
  }

  // 4) manifest (format 3) + shelf registry
  const accent = args.accent || colorForSlug(slug);
  const manifest = {
    format: 3,
    slug,
    title: args.title,
    ...(args.subtitle ? { subtitle: args.subtitle } : {}),
    animal: 'animal.webp',
    accent,
    chapters,
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  log(`wrote public/generated/${slug}/manifest.json (format 3)`);

  upsertBook(join(ROOT, 'public', 'generated', 'library.json'), {
    slug,
    title: args.title,
    subtitle: args.subtitle || '',
    author: args.author,
    role: args.role,
    color: accent,
    animal: animalRel,
    href: `?bundle=${slug}`,
    chapters: chapters.map((c) => ({ number: c.number, title: c.title, duration: c.duration })),
    createdAt: new Date().toISOString(),
  });
  log('updated library.json');

  console.log(`\n\x1b[32m✓ v3 book ready:\x1b[0m http://localhost:5173/?bundle=${encodeURIComponent(slug)}`);
  console.log(`  next: npm run build && node generator/verify-book.mjs --slug ${slug}`);
}

main().catch((e) => { console.error(`\x1b[31m✗\x1b[0m ${e.message}`); process.exit(1); });
