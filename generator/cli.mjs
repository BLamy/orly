#!/usr/bin/env node
// repo → narrated D3 explainer, end to end.
//   node generator/cli.mjs --repo <url|path> --prompt "<subsystem>" [--open]
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { acquireAndDigest } from './repo.mjs';
import { generateStoryboard } from './storyboard.mjs';
import { synthesizeChapter } from './tts.mjs';
import { storyboardToManifest, slugify } from './transform.mjs';
import { validateStoryboard } from './validate.mjs';
import { generateAnimal } from './cover.mjs';
import { upsertBook, colorForSlug } from './library.mjs';
import { applyIcons } from './iconize.mjs';
import { hasNoun } from './noun.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOICE_DEFAULT = 'Fahco4VZzobUeiPqni1S';

// Load keys from .env (gitignored) if present, so book creation just works.
try { process.loadEnvFile(join(ROOT, '.env')); } catch { /* no .env — rely on the environment */ }

function parseArgs(argv) {
  const a = {
    open: false, tts: true, cover: true, port: 5173, maxFiles: 30, maxChars: 95000,
    author: 'Brett Lamy', role: 'Software Engineer at Replay',
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const val = () => argv[++i];
    if (k === '--repo') a.repo = val();
    else if (k === '--prompt') a.prompt = val();
    else if (k === '--slug') a.slug = val();
    else if (k === '--title') a.title = val();
    else if (k === '--subtitle') a.subtitle = val();
    else if (k === '--animal') a.animal = val();
    else if (k === '--author') a.author = val();
    else if (k === '--role') a.role = val();
    else if (k === '--color') a.color = val();
    else if (k === '--voice') a.voice = val();
    else if (k === '--model') a.model = val();
    else if (k === '--storyboard') a.storyboard = val();
    else if (k === '--port') a.port = parseInt(val(), 10);
    else if (k === '--max-files') a.maxFiles = parseInt(val(), 10);
    else if (k === '--max-chars') a.maxChars = parseInt(val(), 10);
    else if (k === '--open') a.open = true;
    else if (k === '--no-tts') a.tts = false;
    else if (k === '--no-cover') a.cover = false;
    else if (k === '--help' || k === '-h') a.help = true;
  }
  return a;
}

const log = (m) => console.error(`\x1b[36m▸\x1b[0m ${m}`);

async function waitForPort(port, ms = 25000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok || r.status === 404) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function ensureDevServer(port) {
  if (await waitForPort(port, 1500)) return true;
  log(`starting dev server on :${port} …`);
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: ROOT, detached: true, stdio: 'ignore',
  });
  child.unref();
  return waitForPort(port, 30000);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.prompt && !args.storyboard)) {
    console.log(`Usage: node generator/cli.mjs --repo <url|path> --prompt "<subsystem>" [options]
  --repo <url|path>     a github.com URL or a local repo path
  --prompt "<text>"     which subsystem to explain
  --slug <name>         output slug (default: from prompt)
  --voice <id>          ElevenLabs voice id (default ${VOICE_DEFAULT})
  --model <id>          Anthropic model (default claude-opus-4-8)
  --storyboard <path>   use a pre-made storyboard JSON (skip the LLM step)
  --no-tts              skip narration (diagram-only preview)
  --open                open the result in Chrome (starts the dev server if needed)
Env: ANTHROPIC_API_KEY (storyboard), ELEVENLABS_API_KEY (TTS).`);
    process.exit(args.help ? 0 : 1);
  }

  // 1) storyboard (from the LLM, or a provided fixture)
  let sb;
  let slugBase = 'repo';
  if (args.storyboard) {
    log(`loading storyboard ${args.storyboard}`);
    sb = JSON.parse(readFileSync(args.storyboard, 'utf8'));
    const v = validateStoryboard(sb);
    v.warnings.forEach((w) => log(`  fix: ${w}`));
    if (!v.ok) throw new Error('provided storyboard is invalid:\n' + v.errors.join('\n'));
  } else {
    if (!args.repo) throw new Error('--repo is required (or pass --storyboard)');
    log(`acquiring + digesting ${args.repo}`);
    const dig = acquireAndDigest({ repo: args.repo, prompt: args.prompt, maxFiles: args.maxFiles, maxChars: args.maxChars });
    slugBase = dig.slugBase;
    log(`digest: ${dig.chosen.length} files, ${dig.digest.length} chars`);
    try {
      sb = await generateStoryboard({ digest: dig.digest, prompt: args.prompt, model: args.model, log });
    } finally {
      dig.cleanup();
    }
  }
  log(`storyboard: "${sb.title}" — ${sb.chapters.length} chapters`);

  const slug = args.slug || slugify(args.prompt || sb.title) || slugBase;
  const outDir = join(ROOT, 'public', 'generated', slug);
  mkdirSync(join(outDir, 'audio'), { recursive: true });

  // 2) narrate each chapter + resolve cues
  const chapterAudio = [];
  for (const ch of sb.chapters) {
    if (!args.tts) { chapterAudio.push(null); continue; }
    const segs = ch.steps.map((s) => s.spoken);
    log(`tts ch${ch.number} "${ch.title}" (${segs.length} segments) …`);
    const r = await synthesizeChapter({ spokenSegments: segs, voiceId: args.voice || VOICE_DEFAULT });
    const fname = `chapter-${ch.number}.mp3`;
    writeFileSync(join(outDir, 'audio', fname), r.mp3);
    chapterAudio.push({ audio: `generated/${slug}/audio/${fname}`, cues: r.cues, audioEnd: r.audioEnd });
    log(`  ${(r.mp3.length / 1024).toFixed(0)}KB, ${r.audioEnd.toFixed(1)}s${r.alignedExact ? '' : ' (approx cues)'}`);
  }

  // 3) emit manifest (+ Noun Project icons for nodes & packets)
  const manifest = storyboardToManifest(sb, { chapterAudio, slug });
  if (hasNoun()) {
    log('fetching icons (Noun Project) …');
    const cache = new Map();
    const credits = new Set();
    for (const ch of manifest.chapters) {
      (await applyIcons(ch.story, cache)).forEach((x) => credits.add(x));
    }
    manifest.iconCredits = [...credits];
    log(`  ${manifest.iconCredits.length} icon credits`);
  }
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(outDir, 'storyboard.json'), JSON.stringify(sb, null, 2));
  log(`wrote public/generated/${slug}/manifest.json`);

  // 3b) cover art + library registry
  let animalRel;
  if (args.cover && process.env.OPENAI_API_KEY) {
    try {
      log('generating cover art (gpt-image, seeded + QA loop) …');
      await generateAnimal({ animal: args.animal, topic: args.prompt || sb.title, outPath: join(outDir, 'animal.png'), log: (m) => log('  ' + m) });
      animalRel = `generated/${slug}/animal.png`;
      log(`  wrote ${animalRel}`);
    } catch (e) {
      console.error(`cover art failed (continuing without it): ${e.message}`);
    }
  }
  upsertBook(join(ROOT, 'public', 'generated', 'library.json'), {
    slug,
    title: args.title || sb.title,
    subtitle: args.subtitle || sb.subtitle || sb.throughline || '',
    author: args.author,
    role: args.role,
    color: args.color || colorForSlug(slug),
    animal: animalRel,
    href: `?bundle=${slug}`,
    createdAt: new Date().toISOString(),
  });
  log('updated library.json');

  const url = `http://localhost:${args.port}/?bundle=${encodeURIComponent(slug)}`;
  console.log(`\n\x1b[32m✓ explainer ready:\x1b[0m ${url}\n`);

  // 4) open
  if (args.open) {
    const up = await ensureDevServer(args.port);
    if (!up) { console.error('dev server did not come up; run `npm run dev` then open the URL above'); return; }
    spawnSync('open', ['-a', 'Google Chrome', url]);
  }
}

main().catch((e) => { console.error(`\x1b[31m✗\x1b[0m ${e.message}`); process.exit(1); });
