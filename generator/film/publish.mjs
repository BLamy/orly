#!/usr/bin/env node
// Stage 10 — publish a film to the shelf LOCALLY (ARCHITECTURE §9). Deploying stays a human decision.
//
//   npm run film:publish -- --slug <slug> [--dry-run] [--series "…"] [--author "…"] [--role "…"] [--master-url <url>]
//
// Writes public/generated/<slug>/manifest.json   format 3 + kind "film" + film block
//          { runtime, fps, width, height, timing: "locked", master, voice, score, loudness, captions }
//          chapters[] { number, title, blurb, scene: "films/<slug>", audio, cues (line starts, chapter-relative),
//                       duration, filmStart }
//        public/generated/<slug>/audio/film-audio.json + audio/lines/<lineId>.m4a + audio/cues/<cueId>.m4a
//                                                        STEMS the player places on the picture's timeline (lib/stems.mjs)
//        public/generated/<slug>/previews/chapter-<n>.jpg     a frame a moment into each chapter (the player's chapter list)
//        public/generated/<slug>/audio/chapter-<n>.m4a   the mastered mix per chapter, played by an <audio> element where the
//                                                        stems can't be decoded (Safari); skip with --no-chapter-audio
//                                                        (only written when the mix is newer than the clock)
//        public/generated/<slug>/film.vtt                (captions)
//        public/generated/<slug>/credits.json            models/tools that made the film + a strudel.cc link per cue (lib/credits.mjs)
//        public/generated/<slug>/review.json             the latest critic round (scores, per-dimension notes) shown under the player
//        public/generated/<slug>/animal.webp|png         (if films/<slug>/cover/animal.* exists)
//        public/generated/<slug>/sources/index.html      the sources page: per chapter and shot, every claim id ->
//                                                        research/claims.json (text, sources) and every quotation ->
//                                                        research/quotes.json (speaker, date, URL); + sources.json.
//                                                        Linked from the manifest (film.sources) and the library entry;
//                                                        the film's closing SOURCES card shows its URL (--site)
//        public/generated/library.json                   upsert { …BookMeta, kind: "film" } via generator/library.mjs
//        film.json stages.publish
// The master MP4 is never copied into public/ (Workers' 25 MiB static asset cap); pass --master-url if it
// is hosted elsewhere. Verifies every referenced file after writing. No git, no deploy.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, die, helpText } from './lib/args.mjs';
import { execFileSync } from 'node:child_process';
import { filmPaths, readJson, writeJson, rel, mkdirp } from './lib/paths.mjs';
import { stageDone, stageFailed, readFilm } from './lib/ledger.mjs';
import { buildSources, sourcesHtml } from './lib/sources.mjs';
import { publishStems } from './lib/stems.mjs';
import { buildCredits } from './lib/credits.mjs';

const a = parseArgs(process.argv.slice(2), { boolean: ['dry-run', 'help', 'chapter-audio'], string: ['slug', 'dir', 'series', 'author', 'role', 'master-url', 'subtitle', 'site'], default: { 'chapter-audio': true } });
// the deployed shelf (CLAUDE.md); the sources page is served from it at /generated/<slug>/sources/
const SITE = (a.site || 'https://orly.brett-lamy.workers.dev').replace(/\/$/, '');
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const MAX = 25 * 1024 * 1024;
const DRY = !!a['dry-run'];

/** the most recent qa/reviews/round-<n>/verdict.json, reduced to what the shelf shows */
function latestReview(P) {
  const dir = path.join(P.dir, 'qa', 'reviews');
  if (!fs.existsSync(dir)) return null;
  const rounds = fs.readdirSync(dir).map((d) => /^round-(\d+)$/.exec(d)).filter(Boolean).map((m) => +m[1]).sort((x, y) => y - x);
  for (const n of rounds) {
    const v = readJson(path.join(dir, `round-${n}`, 'verdict.json'), null);
    if (!v?.scores) continue;
    return { round: n, at: v.at ?? null, pass: !!v.pass, mean: v.mean ?? null, bar: (typeof v.bar === 'object' && v.bar ? v.bar.mean : v.bar) ?? 8.5, floor: (typeof v.bar === 'object' && v.bar?.minDimension) || 8, scores: v.scores, notes: v.dimensionNotes ?? {}, summary: v.summary ?? '' };
  }
  return null;
}

function plainUpsert(libPath, book) {
  const lib = readJson(libPath, { books: [] });
  const i = lib.books.findIndex((b) => b.slug === book.slug);
  if (i >= 0) lib.books[i] = { ...lib.books[i], ...book };
  else lib.books.push(book);
  lib.books.sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''));
  writeJson(libPath, lib, 2);
}

async function main() {
  const script = readJson(P.script);
  const tl = readJson(P.narration.timeline);
  if (tl.draft) throw new Error('timeline is a DRAFT; narrate first');
  const loud = readJson(P.mix.loudness, null);
  const voice = readJson(P.voice, {});
  const cuesJ = readJson(P.score.cues, []);
  const cues = Array.isArray(cuesJ) ? cuesJ : cuesJ.cues || [];
  const render = readJson(path.join(P.render.dir, 'render-report.json'), null);
  const film = readFilm(P);
  const out = P.publish.dir;
  const { colorForSlug } = await import('../library.mjs');

  // Pre-mixed chapter slices are only in sync with the clock they were mixed against: publish them only when the
  // master is newer than the timeline. The player's primary audio is the stems (lib/stems.mjs), placed on the
  // picture's own timeline, so a stale mix can no longer drift the shelf.
  // Chapter slices are the Safari path: WebKit's decodeAudioData rejects AAC in an MP4 container, so the stems
  // engine is silent there, while an <audio> element plays the same .m4a (as books play their chapter MP3s). The
  // player falls back to these slices when it can't decode a stem. Skip with --no-chapter-audio.
  const mixFresh = a['chapter-audio'] !== false && fs.existsSync(P.mix.master) && fs.statSync(P.mix.master).mtimeMs >= fs.statSync(P.narration.timeline).mtimeMs;
  const chapters = tl.chapters.map((ch) => {
    const slice = mixFresh && (loud?.chapters || []).find((c) => c.number === ch.number);
    const hasSlice = !!slice && fs.existsSync(path.join(P.mix.chapters, `${ch.number}.m4a`));
    const sc = script.chapters.find((c) => c.id === ch.id) ?? {};
    const lines = tl.shots.filter((s) => s.chapter === ch.id).flatMap((s) => s.lines.map((l) => +(s.start + l.start - ch.start).toFixed(3)));
    return {
      number: ch.number,
      title: ch.title,
      blurb: sc.blurb ?? '',
      scene: `films/${a.slug}`,
      ...(hasSlice ? { audio: `audio/chapter-${ch.number}.m4a` } : {}),
      cues: lines,
      duration: +(ch.end - ch.start).toFixed(3),
      filmStart: ch.start,
    };
  });
  const coverSrc = ['webp', 'png', 'jpg'].map((e) => path.join(P.dir, 'cover', `animal.${e}`)).find((f) => fs.existsSync(f));
  const animal = coverSrc ? `animal${path.extname(coverSrc)}` : undefined;
  const accent = film.accent ?? colorForSlug(a.slug);
  const manifest = {
    format: 3,
    kind: 'film',
    slug: a.slug,
    title: script.title,
    ...(a.subtitle || script.subtitle ? { subtitle: a.subtitle || script.subtitle } : {}),
    ...(animal ? { animal } : {}),
    accent,
    ...(a.series ? { series: a.series } : {}),
    film: {
      runtime: tl.duration,
      fps: tl.fps,
      width: render?.width ?? 1920,
      height: render?.height ?? 1080,
      timing: 'locked',
      master: a['master-url'] ?? null,
      captions: 'film.vtt',
      voice: { name: voice.name ?? null, voiceId: voice.voiceId ?? null, model: voice.model ?? null },
      score: { engine: 'strudel', cues: cues.length, musicSeconds: +cues.reduce((s, c) => s + (c.end - c.start), 0).toFixed(1) },
      loudness: loud?.master ? { I: loud.master.I, TP: loud.master.TP, LRA: loud.master.LRA } : null,
      // per-line narration + per-cue music, placed by the player on the picture's timeline (lib/stems.mjs)
      audio: { stems: 'audio/film-audio.json', clock: tl.duration },
      logline: script.logline,
      ...(script.vhs ? { vhs: script.vhs } : {}),
      sources: 'sources/',
      sourcesData: 'sources.json',
      credits: 'credits.json',
      ...(latestReview(P) ? { review: 'review.json' } : {}),
      sourcesUrl: `${SITE}/generated/${a.slug}/sources/`,
    },
    chapters,
  };
  const research = path.join(P.dir, 'research');
  const meta = readJson(path.join(P.dir, 'story', 'meta.json'), {});
  const sourcesDoc = buildSources(script, { claims: readJson(path.join(research, 'claims.json'), []), quotes: readJson(path.join(research, 'quotes.json'), []), timeline: tl, offScreen: meta.staging?.creditsSources || [] });
  const entry = {
    slug: a.slug,
    title: script.title,
    subtitle: manifest.subtitle ?? '',
    author: a.author ?? film.author ?? 'Brett Lamy',
    role: a.role ?? film.role ?? 'Software Engineer at Replay',
    color: accent,
    ...(animal ? { animal: `generated/${a.slug}/${animal}` } : {}),
    href: `?film=${a.slug}`,
    sources: `generated/${a.slug}/sources/`,
    kind: 'film',
    runtime: +tl.duration.toFixed(2),
    ...(script.vhs ? { vhs: script.vhs } : {}),
    ...(a.series ? { series: a.series } : {}),
    chapters: chapters.map((c) => ({ number: c.number, title: c.title, duration: c.duration })),
    createdAt: film.stages?.publish?.createdAt ?? new Date().toISOString(),
  };
  if (DRY) {
    console.log(JSON.stringify({ manifest, libraryEntry: entry, sources: sourcesDoc.counts }, null, 2));
    return;
  }
  mkdirp(path.join(out, 'audio'));
  for (const f of fs.readdirSync(path.join(out, 'audio'))) if (/^chapter-\d+\.m4a$/.test(f)) fs.rmSync(path.join(out, 'audio', f));
  for (const c of chapters) if (c.audio) fs.copyFileSync(path.join(P.mix.chapters, `${c.number}.m4a`), path.join(out, c.audio));
  const stems = await publishStems(P, out, { slug: a.slug, timeline: tl, cues, log: (m) => console.log(m) });
  // a preview frame per chapter for the player's chapter list (books ship previews/chapter-<n>.png): cut from the
  // rendered film a moment into each chapter
  const mp4 = path.join(P.render.dir, 'film.mp4');
  if (fs.existsSync(mp4)) {
    mkdirp(path.join(out, 'previews'));
    for (const c of chapters) {
      const at = c.filmStart + Math.min(3, c.duration * 0.3);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', at.toFixed(3), '-i', mp4, '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '4', path.join(out, 'previews', `chapter-${c.number}.jpg`)]);
    }
  }
  // credits from the recorded provenance (models, voice, music with strudel.cc links): the page's Credits section
  // and the film's own end-credits card (apps/bookshelf/src/viz/films/<slug>/credits.json) read the same file
  const credits = buildCredits(P, { slug: a.slug, cues, voice });
  writeJson(path.join(out, 'credits.json'), credits, 1);
  const appCredits = path.join(P.dir, '../../apps/bookshelf/src/viz/films', a.slug, 'credits.json');
  if (fs.existsSync(path.dirname(appCredits))) writeJson(appCredits, { card: credits.card, footer: credits.footer }, 1);
  // the latest critic round, shown under the player (scores per dimension + why)
  const review = latestReview(P);
  if (review) writeJson(path.join(out, 'review.json'), review, 1);
  else fs.rmSync(path.join(out, 'review.json'), { force: true });
  if (fs.existsSync(P.render.vtt)) fs.copyFileSync(P.render.vtt, path.join(out, 'film.vtt'));
  if (coverSrc) fs.copyFileSync(coverSrc, path.join(out, animal));
  mkdirp(path.join(out, 'sources'));
  fs.writeFileSync(path.join(out, 'sources', 'index.html'), sourcesHtml(sourcesDoc, { title: script.title, subtitle: script.subtitle, slug: a.slug, url: manifest.film.sourcesUrl }));
  writeJson(path.join(out, 'sources.json'), sourcesDoc, 1);
  writeJson(path.join(out, 'manifest.json'), manifest, 2);
  if (a.dir) plainUpsert(P.publish.library, entry);
  else (await import('../library.mjs')).upsertBook(P.publish.library, entry);

  // verify
  const m = readJson(path.join(out, 'manifest.json'));
  const bad = [];
  const fa = readJson(path.join(out, stems.file), null);
  if (!fa) bad.push(`missing ${stems.file}`);
  else for (const c of [...fa.clips, ...fa.renders]) {
    const f = path.join(out, c.url);
    if (!fs.existsSync(f)) bad.push(`missing ${c.url}`);
    else if (fs.statSync(f).size >= MAX) bad.push(`${c.url} is ≥ 25 MiB`);
  }
  for (const c of m.chapters) {
    if (!c.audio) continue;
    const f = path.join(out, c.audio);
    if (!fs.existsSync(f)) bad.push(`missing ${c.audio}`);
    else if (fs.statSync(f).size >= MAX) bad.push(`${c.audio} is ≥ 25 MiB`);
  }
  if (!fs.existsSync(path.join(out, 'film.vtt'))) bad.push('missing film.vtt');
  if (!fs.existsSync(path.join(out, 'sources', 'index.html'))) bad.push('missing sources/index.html');
  const missingClaims = sourcesDoc.chapters.flatMap((c) => c.shots.flatMap((s) => s.claims.filter((x) => x.missing).map((x) => `${s.id}:${x.id}`)));
  if (missingClaims.length) bad.push(`sources page: claim ids not in research/claims.json: ${missingClaims.join(', ')}`);
  const lib = readJson(P.publish.library);
  if (!lib.books.some((b) => b.slug === a.slug && b.kind === 'film')) bad.push('library entry missing');
  if (bad.length) throw new Error(`publish verification failed: ${bad.join('; ')}`);
  stageDone(P, 'publish', { createdAt: entry.createdAt, manifest: rel(path.join(out, 'manifest.json')), sources: { page: rel(path.join(out, 'sources', 'index.html')), url: manifest.film.sourcesUrl, ...sourcesDoc.counts }, chapters: m.chapters.length, stems: { lines: stems.lines, cues: stems.cues, mb: +(stems.bytes / 1048576).toFixed(1) }, chapterSlices: m.chapters.filter((c) => c.audio).length, deployed: false });
  console.log(`published locally → ${rel(path.join(out, 'manifest.json'))} (${m.chapters.length} chapters, ${(tl.duration / 60).toFixed(1)} min) + library entry; deploy is a human decision`);
  if (!coverSrc) console.warn(`  note (books only; films use the VHS sleeve): no cover at ${rel(path.join(P.dir, 'cover'))}/animal.webp — the shelf will use the default spine`);
}

main().catch((e) => {
  try {
    if (!DRY) stageFailed(P, 'publish', e);
  } catch {}
  console.error(`error: ${e.message}`);
  process.exit(1);
});
