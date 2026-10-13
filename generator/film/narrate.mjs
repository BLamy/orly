#!/usr/bin/env node
// Stage 4a — narration. Synthesizes every script line with ElevenLabs and cuts one clip per line.
//
//   npm run film:narrate -- --slug <slug> [--shots a,b | --chapter ch01] [--dry-run] [--budget 40000]
//                           [--max-chars 1200] [--force] [--allow-unmatched] [--no-stt] [--dir <filmDir>]
//
// Reads  films/<slug>/story/script.json, voice/voice.json (voice, model, settings, seed), voice/lexicon.json
// Writes narration/cache/<key>.{mp3,json}   one per request chunk (content-addressed; re-runs are free)
//        narration/clips/<lineId>.wav       48 kHz mono s24, cut from the alignment with small margins
//        narration/lines.json               per line: clip, speechStart/End, display-word timings (clip-relative)
//        narration/ledger.json              spend ledger (every paid request; shared with voice auditions)
//        narration/stt.json                 STT round trip (scribe_v1) of every line where a lexicon entry fires or
//                                           qa.stt is required, once per clip version (film:stt; skip with --no-stt)
//        film.json stages.narration
// Line edits (story chapter fields, free to change: clips re-cut from the cache): insertGaps {"word": sec}
//   opens a breath after a rushed word ("word#2" picks its second occurrence; a negative value tightens an over-long pause, keeping >= 0.12 s of it);
//   a chunk-first line gets 120 ms of digital pre-roll (no hard head).
//   In film:timeline, wordRides {"word": dB} lifts a word the take under-stresses.
// Then run film:timeline to lay the clips end to end.
//
// Strategy (docs/film/research/elevenlabs-narration.md): eleven_multilingual_v2 /with-timestamps; a shot's
// lines are packed into ≤ 1,200-char chunks joined by blank lines (never crossing a shot); stitching uses
// previous_request_ids (≤ 3, < 2 h old) else previous_text, plus next_text, within the shot; line and word
// times come from the character alignment (exact, no STT). The cache key covers voice, model, settings,
// seed, format, the chunk text and its in-shot neighbours.
// LINE-LEVEL REUSE: a line whose signature (voice, settings incl. its tts.speed, spoken text) still matches its
// lines.json record keeps its take: it is re-cut from the chunk it was recorded in, and only the changed or new
// lines of a shot are synthesized (consecutive ones together, with the neighbouring lines as previous/next text).
// Editing one line re-pays for that line, not the shot. --force re-synthesizes everything selected.
// SOLO: script line tts {solo, speed} asks for a line on its own request (speed = that line's voice speed). A line
// whose clip has no clean edge (see below) is listed in narration/solo.json and re-generated on its own in the
// same run (--no-solo-retake to skip), once per take.
// CUTTING (lib/split.mjs; review round 1: midpoint cuts left ghost syllables of the neighbouring lines): each line
// is cut inside the real silence between it and its neighbours (the longest stretch whose 10 ms peak stays under
// -52 dBFS between the aligned edges), with 20 ms fades; each edge's raw peak must stay under -50 dBFS
// (QA narration.clipEdges fails above -45).
// --budget caps cumulative spend in ledger.json (default film.json budgets.narrationCredits, else 40000).
// Provider limits stop cleanly (stage 'blocked' + resume note); cached work is kept.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, list, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, sha, rel, mkdirp, fileSha } from './lib/paths.mjs';
import { stageStart, stageDone, stageBlocked, stageFailed, budget as filmBudget } from './lib/ledger.mjs';
import { speak, planChunks, alignChunk, displayWords } from './lib/text.mjs';
import { loadVoice, loadLexicon, lineSig, scriptShots } from './lib/voicecfg.mjs';
import { MODELS, DEFAULT_MODEL, DEFAULT_SETTINGS, DEFAULT_FORMAT, estimateCredits, ttsWithTimestamps, ProviderLimitError } from './lib/eleven.mjs';
import { decodeMono } from './lib/ffmpeg.mjs';
import { writeWav } from './lib/wav.mjs';
import { redact } from './lib/env.mjs';
import { refreshStt, sttPath } from './lib/stt.mjs';
import { envelope, cutLine, edgePeaks, fadeEdges, ghosts, isCutEdge, EDGE_DB, FADE_SEC } from './lib/split.mjs';

const SR = 48000;
const STITCH_MAX_AGE_MS = 110 * 60 * 1000;

const a = parseArgs(process.argv.slice(2), {
  boolean: ['help', 'dry-run', 'force', 'allow-unmatched', 'quiet', 'stt', 'solo-retake'],
  string: ['slug', 'dir', 'shots', 'chapter', 'budget', 'max-chars', 'margin-pre', 'margin-post'],
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const DRY = !!a['dry-run'];
const PRE = num(a['margin-pre'], 0.12);
const POST = num(a['margin-post'], 0.25);

/** Spend ledger: [{ at, kind, key, shot, chars, cost, requestId }] */
const readSpend = () => readJson(P.narration.spend, []);
const spent = (rows) => rows.reduce((s, r) => s + (Number.isFinite(r.cost) ? r.cost : r.estimate || 0), 0);
const cacheHas = (key) => key && fs.existsSync(path.join(P.narration.cache, `${key}.json`)) && fs.existsSync(path.join(P.narration.cache, `${key}.mp3`));

/** narration/solo.json { lines: { <lineId>: { at, reason, fromChunk } } }: lines re-generated on their own because
 *  their clip had no clean edge inside a multi-line take */
const readSolo = () => readJson(P.narration.solo, { version: 1, lines: {} });

/**
 * Plan: per shot, which lines keep their recorded take (re-cut from its chunk) and which are synthesized, in
 * which chunks. prevDoc = lines.json as it was before this run.
 */
function buildPlan(script, voice, lex, maxChars, prevDoc, solo) {
  const plan = [];
  for (const { chapter, shot } of scriptShots(script, { shots: list(a.shots), chapter: list(a.chapter) })) {
    const lines = (shot.lines || []).map((l) => {
      const sp = speak(l, lex);
      if (!displayWords(sp.spoken).length) throw new Error(`line ${l.id} has no speakable words`);
      const tts = l.tts || {};
      const sig = lineSig(voice, sp.spoken, tts);
      const rec = prevDoc.lines?.[l.id];
      const soloWanted = !!tts.solo || Number.isFinite(tts.speed) || !!solo.lines[l.id];
      // keep the recorded take when nothing that shapes it changed (and a solo request is already met)
      const recSolo = rec ? (prevDoc.chunks?.[rec.chunk]?.lines?.length ?? 2) === 1 : false;
      const keep = !a.force && rec && rec.sig === sig && cacheHas(rec.chunk) && (!soloWanted || recSolo);
      return { id: l.id, text: l.text, spoken: sp.spoken, words: sp.words, explicit: sp.explicit, insertGaps: l.insertGaps || null, tts, sig, solo: soloWanted, keep, rec };
    });
    // consecutive lines to synthesize form groups; each group is chunked (solo lines alone) with the neighbouring
    // lines' spoken text as context
    const chunks = [];
    for (let i = 0; i < lines.length; ) {
      if (lines[i].keep) {
        i++;
        continue;
      }
      let j = i;
      while (j < lines.length && !lines[j].keep) j++;
      const group = lines.slice(i, j);
      const gc = planChunks(group, maxChars);
      gc.forEach((c, k) => {
        const firstIdx = lines.indexOf(c.lines[0]);
        const lastIdx = lines.indexOf(c.lines[c.lines.length - 1]);
        c.prevText = k > 0 ? gc[k - 1].text : lines.slice(0, firstIdx).map((l) => l.spoken).join('\n\n');
        c.nextText = k < gc.length - 1 ? gc[k + 1].text : lines.slice(lastIdx + 1).map((l) => l.spoken).join('\n\n');
        c.groupIndex = k;
        const speed = c.lines.find((l) => Number.isFinite(l.tts.speed))?.tts.speed;
        c.settings = Number.isFinite(speed) ? { ...voice.settings, speed } : voice.settings;
        c.key = sha({ v: voice.voiceId, m: voice.model, s: c.settings, seed: voice.seed, f: voice.format, t: c.text, p: c.prevText.slice(-1000), n: c.nextText.slice(0, 500) });
        c.cached = !a.force && cacheHas(c.key);
      });
      chunks.push(...gc);
      i = j;
    }
    plan.push({ chapter, shot, lines, chunks });
  }
  return plan;
}

const pcmCache = new Map();
function takeAudio(key) {
  if (!pcmCache.has(key)) {
    if (pcmCache.size > 6) pcmCache.delete(pcmCache.keys().next().value);
    const pcm = decodeMono(path.join(P.narration.cache, `${key}.mp3`), SR);
    pcmCache.set(key, { pcm, env: envelope(pcm, SR), dur: pcm.length / SR });
  }
  return pcmCache.get(key);
}

/** Cut one line out of an aligned take and write its clip; returns the lines.json record (or null + problem). */
function cutAndWrite({ s, line, key, al, k, take, problems, contextLines }) {
  const q = al[k];
  if (!q.matched) {
    problems.push(`${line.id}: not found in the alignment of chunk ${key}`);
    return null;
  }
  const { pcm, env, dur } = take;
  const cut = cutLine(env, dur, al, k, { pre: PRE, post: POST });
  const { cs, ce, pad } = cut;
  const end = Math.min(q.end, dur);
  // the raw edges, before any fade: both must sit under EDGE_DB (else the line is re-generated on its own)
  const raw = pcm.slice(Math.round(cs * SR), Math.max(Math.round(cs * SR) + 1, Math.round(ce * SR)));
  const edges = edgePeaks(raw, SR);
  const body = fadeEdges(raw.slice(), SR, isCutEdge(cut.headHow) ? FADE_SEC : 0.005, isCutEdge(cut.tailHow) ? FADE_SEC : 0.005);
  const n = Math.max(0, Math.round(pad * SR));
  let clip = body;
  if (n) {
    clip = new Float32Array(n + body.length);
    clip.set(body, n);
  }
  // editorial gaps (script line field insertGaps: {"shape": 0.25}): open a breath after a word the take
  // rushed, cut at the word boundary with 5 ms fades; later word times shift by the inserted silence
  const shifts = [];
  if (line.insertGaps) {
    const ws = q.words.map((w) => ({ ...w, s: w.start - cs + pad, e: Math.min(w.end, dur) - cs + pad }));
    const wkey = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');
    const cuts = [];
    for (const [word, gap] of Object.entries(line.insertGaps)) {
      // "word" = its first occurrence; "word#2" = the second (and so on)
      const [wd, nth] = String(word).split('#');
      const wi = ws.map((w, j) => (wkey(w.w) === wkey(wd) ? j : -1)).filter((j) => j >= 0)[Math.max(0, (Number(nth) || 1) - 1)] ?? -1;
      if (wi < 0 || wi === ws.length - 1) {
        problems.push(`${line.id}: insertGaps word "${word}" not found (or last)`);
        continue;
      }
      let g = Number(gap);
      if (g < 0) {
        // a negative gap TIGHTENS an over-long breath: remove |g| s of the silence between the two words,
        // always leaving at least 0.12 s of the original pause (never touches either word)
        const room = Math.max(0, ws[wi + 1].s - ws[wi].e - 0.12);
        if (-g > room) {
          problems.push(`${line.id}: insertGaps "${word}" ${g}s clamped to -${room.toFixed(2)}s (the pause is only ${(ws[wi + 1].s - ws[wi].e).toFixed(2)}s)`);
          g = -room;
        }
        if (g > -0.005) continue;
      }
      cuts.push({ at: (ws[wi].e + ws[wi + 1].s) / 2, gap: g });
    }
    cuts.sort((x, y) => x.at - y.at);
    const parts = [];
    let from = 0;
    const F = Math.round(0.005 * SR);
    for (const c of cuts) {
      // an opening (gap > 0) splits at c.at and inserts silence; a tightening (gap < 0) drops the |gap| s
      // centred on c.at. Either way both joins get 5 ms fades.
      const i = Math.round((c.gap < 0 ? c.at + c.gap / 2 : c.at) * SR);
      const seg = clip.slice(from, i);
      for (let j = 0; j < Math.min(F, seg.length); j++) seg[seg.length - 1 - j] *= j / F;
      if (from > 0) for (let j = 0; j < Math.min(F, seg.length); j++) seg[j] *= j / F;
      parts.push(seg);
      if (c.gap > 0) parts.push(new Float32Array(Math.round(c.gap * SR)));
      from = c.gap < 0 ? Math.round((c.at - c.gap / 2) * SR) : i;
      shifts.push(c);
    }
    const last = clip.slice(from);
    if (from > 0) for (let j = 0; j < Math.min(F, last.length); j++) last[j] *= j / F;
    parts.push(last);
    const out = new Float32Array(parts.reduce((m, p) => m + p.length, 0));
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    clip = out;
  }
  const shift = (t) => t + shifts.filter((c) => t > c.at).reduce((acc, c) => acc + c.gap, 0); // gap < 0 pulls later words in
  const file = path.join(P.narration.clips, `${line.id}.wav`);
  writeWav(file, [clip], SR, 's24');
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const speechStart = r4(shift(q.start - cs + pad));
  const speechEnd = r4(shift(end - cs + pad));
  const gh = ghosts(envelope(clip, SR), speechStart, speechEnd);
  // a cut edge must be quiet (raw peak < EDGE_DB); a take's own start/end only must not hide a stray fragment
  const headOk = isCutEdge(cut.headHow) ? edges.head < EDGE_DB && !cut.headDirty : !cut.headDirty;
  const tailOk = isCutEdge(cut.tailHow) ? edges.tail < EDGE_DB && !cut.tailDirty : !cut.tailDirty;
  // (ghosts: loud material in a margin cut off from the speech by silence, usually a breath; reported in cut.ghost)
  const clean = headOk && tailOk;
  return {
    shot: s.shot.id,
    chapter: s.chapter.id,
    text: line.text,
    spoken: line.spoken,
    sig: line.sig,
    ...(Number.isFinite(line.tts?.speed) ? { speed: line.tts.speed } : {}),
    chunk: key,
    clip: path.relative(P.dir, file),
    clipSha: fileSha(file, 12),
    duration: r4(clip.length / SR),
    speechStart,
    speechEnd,
    words: q.words.map((w) => ({ w: w.w, start: r4(shift(w.start - cs + pad)), end: r4(shift(Math.min(w.end, dur) - cs + pad)) })),
    ...(shifts.length ? { insertedGaps: shifts.map((c) => ({ at: r4(c.at), gap: c.gap })) } : {}),
    wordsFrom: line.words ? 'display' : 'spoken',
    cut: { from: r4(cs), to: r4(ce), pad: r4(pad), head: cut.headHow, tail: cut.tailHow, edgeDb: edges, clean, ...(gh.head != null || gh.tail != null ? { ghost: gh } : {}) },
    ...(contextLines ? { chunkLines: contextLines } : {}),
  };
}

async function main() {
  const script = readJson(P.script);
  let voice;
  try {
    voice = loadVoice(P);
  } catch (e) {
    if (!DRY || fs.existsSync(P.voice)) throw e;
    // estimate before casting: default model/settings with a placeholder voice (cache keys are then meaningless)
    voice = { voiceId: 'unlockedvoice', name: null, model: DEFAULT_MODEL, settings: DEFAULT_SETTINGS, seed: 0, format: DEFAULT_FORMAT, wpm: null };
    console.log(`(no voice locked yet: estimating with ${DEFAULT_MODEL} defaults)`);
  }
  const lex = loadLexicon(P);
  const maxChars = Math.min(num(a['max-chars'], 1200), MODELS[voice.model].limit);
  const linesDoc = readJson(P.narration.lines, { version: 1, lines: {}, shots: {} });
  linesDoc.chunks ??= {};
  // chunks recorded before line-level reuse: rebuild their line lists from the line records
  for (const [id, r] of Object.entries(linesDoc.lines)) {
    if (!r.chunk || linesDoc.chunks[r.chunk]) continue;
    const meta = cacheHas(r.chunk) ? readJson(path.join(P.narration.cache, `${r.chunk}.json`)) : null;
    if (!meta) continue;
    const mates = Object.entries(linesDoc.lines).filter(([, x]) => x.chunk === r.chunk).map(([lid, x]) => ({ id: lid, spoken: x.spoken, at: meta.text.indexOf(x.spoken) }));
    mates.sort((x, y) => x.at - y.at);
    linesDoc.chunks[r.chunk] = { lines: mates.map((m) => ({ id: m.id, spoken: m.spoken })) };
  }
  const prevDoc = JSON.parse(JSON.stringify(linesDoc));
  const solo = readSolo();
  let plan = buildPlan(script, voice, lex, maxChars, prevDoc, solo);
  const est0 = (pl) => pl.flatMap((s) => s.chunks).filter((c) => !c.cached);
  const all = plan.flatMap((s) => s.chunks);
  const todo = est0(plan);
  const keptLines = plan.reduce((q, s) => q + s.lines.filter((l) => l.keep).length, 0);
  const newChars = todo.reduce((q, c) => q + c.text.length, 0);
  const words = plan.reduce((q, x) => q + x.lines.reduce((m, l) => m + displayWords(l.spoken).length, 0), 0);
  const BUDGET = num(a.budget, filmBudget(P, 'narrationCredits', 40000));
  const already = spent(readSpend());
  const est = estimateCredits(newChars, voice.model);

  console.log(
    `${plan.length} shots, ${plan.reduce((q, x) => q + x.lines.length, 0)} lines (${keptLines} keep their take), ${words} words; ` +
      `to synthesize: ${todo.length} chunks / ${newChars} chars ≈ ${est} credits on ${voice.model} (ledger ${Math.round(already)} / budget ${BUDGET})`,
  );
  if (DRY) {
    for (const s of plan) {
      const nc = s.chunks.filter((c) => !c.cached).reduce((q, c) => q + c.text.length, 0);
      const fresh = s.lines.filter((l) => !l.keep).map((l) => `${l.id}${l.solo ? '(solo)' : ''}`);
      if (fresh.length || !a.quiet) console.log(`  ${s.shot.id.padEnd(14)} lines=${String(s.lines.length).padStart(2)} new: ${fresh.join(',') || '-'} chunks=${s.chunks.length} newChars=${nc} est=${estimateCredits(nc, voice.model)}`);
    }
    const wpm = voice.wpm || 110;
    console.log(`  est. speech @${wpm} wpm: ${(words / wpm).toFixed(1)} min`);
    return;
  }
  if (already + est > BUDGET) {
    throw new Error(`estimated ${est} credits + ${Math.round(already)} already spent exceeds --budget ${BUDGET}; raise it or narrate fewer shots (--shots)`);
  }

  stageStart(P, 'narration', { args: process.argv.slice(2), voice: { voiceId: voice.voiceId, model: voice.model, seed: voice.seed } });
  mkdirp(P.narration.cache);
  mkdirp(P.narration.clips);
  linesDoc.voice = { voiceId: voice.voiceId, name: voice.name, model: voice.model, settings: voice.settings, seed: voice.seed, format: voice.format };
  const problems = [];
  let runCost = 0;

  const synth = async (s, c, metas) => {
    const base = path.join(P.narration.cache, c.key);
    if (c.cached) return readJson(`${base}.json`);
    const rows = readSpend();
    if (spent(rows) + estimateCredits(c.text.length, voice.model) > BUDGET) throw new ProviderLimitError(`budget ${BUDGET} reached (${Math.round(spent(rows))} spent)`, 0);
    const body = { text: c.text, model_id: voice.model, voice_settings: c.settings, seed: voice.seed };
    if (MODELS[voice.model].stitch) {
      const fresh = metas.filter((m) => m.requestId && Date.now() - Date.parse(m.at) < STITCH_MAX_AGE_MS).map((m) => m.requestId);
      if (c.groupIndex > 0 && fresh.length && fresh.length === metas.length) body.previous_request_ids = fresh.slice(-3);
      else if (c.prevText) body.previous_text = c.prevText.slice(-1000);
      if (c.nextText) body.next_text = c.nextText.slice(0, 500);
    }
    const r = await ttsWithTimestamps({ voiceId: voice.voiceId, body, format: voice.format });
    fs.writeFileSync(`${base}.mp3`, r.audio);
    const meta = { key: c.key, at: new Date().toISOString(), requestId: r.requestId, cost: r.cost, chars: c.text.length, settings: c.settings, context: Object.keys(body).filter((k) => /previous|next/.test(k)), text: c.text, alignment: r.alignment };
    writeJson(`${base}.json`, meta, 0);
    const row = { at: meta.at, kind: 'narration', key: c.key, shot: s.shot.id, chars: c.text.length, cost: Number.isFinite(r.cost) ? r.cost : null, estimate: estimateCredits(c.text.length, voice.model), requestId: r.requestId, model: voice.model };
    writeJson(P.narration.spend, [...readSpend(), row]);
    runCost += Number.isFinite(r.cost) ? r.cost : row.estimate;
    return meta;
  };

  const runShot = async (s) => {
    // 1. synthesize the shot's new chunks, cut their lines
    const metas = [];
    let gi = -1;
    for (const c of s.chunks) {
      if (c.groupIndex === 0) metas.length = 0; // stitching only within one contiguous group
      gi++;
      const meta = await synth(s, c, metas);
      metas.push(meta);
      linesDoc.chunks[c.key] = { lines: c.lines.map((l) => ({ id: l.id, spoken: l.spoken })), settings: c.settings };
      const take = takeAudio(c.key);
      const al = alignChunk(c.lines, meta.alignment);
      c.lines.forEach((line, k) => {
        const rec = cutAndWrite({ s, line, key: c.key, al, k, take, problems });
        if (rec) linesDoc.lines[line.id] = rec;
      });
      if (!a.quiet) console.log(`  ${s.shot.id} chunk ${gi + 1}/${s.chunks.length}: ${c.lines.map((l) => l.id).join(',')}, ${c.text.length} chars, ${take.dur.toFixed(2)}s, ${c.cached ? 'cached' : `cost ${meta.cost}`}${meta.context?.length ? ` ctx=${meta.context.join('+')}` : ''}`);
    }
    // 2. re-cut every kept line from the take it was recorded in (free; picks up the current cutting rules)
    const byChunk = new Map();
    for (const l of s.lines.filter((x) => x.keep)) {
      if (!byChunk.has(l.rec.chunk)) byChunk.set(l.rec.chunk, []);
      byChunk.get(l.rec.chunk).push(l);
    }
    for (const [key, kept] of byChunk) {
      const meta = readJson(path.join(P.narration.cache, `${key}.json`));
      const mates = prevDoc.chunks[key]?.lines || kept.map((l) => ({ id: l.id, spoken: l.rec.spoken }));
      const al = alignChunk(mates.map((m) => ({ id: m.id, spoken: m.spoken, words: kept.find((l) => l.id === m.id)?.words ?? null })), meta.alignment);
      const take = takeAudio(key);
      linesDoc.chunks[key] = prevDoc.chunks[key] || { lines: mates };
      for (const line of kept) {
        const k = mates.findIndex((m) => m.id === line.id);
        const rec = cutAndWrite({ s, line, key, al, k, take, problems });
        if (rec) linesDoc.lines[line.id] = rec;
      }
    }
    linesDoc.shots[s.shot.id] = { chunks: [...new Set(s.lines.map((l) => linesDoc.lines[l.id]?.chunk).filter(Boolean))], lines: s.lines.map((l) => l.id) };
  };

  for (const s of plan) await runShot(s);

  // 3. a line whose clip still has a loud edge inside a multi-line take is re-generated on its own (once per take)
  if (a['solo-retake'] !== false) {
    const dirty = plan.flatMap((s) => s.lines).filter((l) => {
      const r = linesDoc.lines[l.id];
      return r && r.cut && !r.cut.clean && (linesDoc.chunks[r.chunk]?.lines?.length ?? 1) > 1 && !(solo.lines[l.id]?.fromChunk === r.chunk);
    });
    if (dirty.length) {
      for (const l of dirty) {
        const r = linesDoc.lines[l.id];
        solo.lines[l.id] = { at: new Date().toISOString(), reason: `no clean edge in a multi-line take (head ${r.cut.head} ${r.cut.edgeDb.head} / tail ${r.cut.tail} ${r.cut.edgeDb.tail} dBFS${r.cut.ghost ? `; ghost ${JSON.stringify(r.cut.ghost)}` : ''})`, fromChunk: r.chunk };
      }
      writeJson(P.narration.solo, solo);
      console.log(`  re-generating ${dirty.length} line(s) on their own (no clean edge): ${dirty.map((l) => l.id).join(', ')}`);
      const ids = new Set(dirty.map((l) => l.id));
      const shotIds = new Set(plan.filter((s) => s.lines.some((l) => ids.has(l.id))).map((s) => s.shot.id));
      const replan = buildPlan(script, voice, lex, maxChars, JSON.parse(JSON.stringify(linesDoc)), solo).filter((s) => shotIds.has(s.shot.id));
      const add = estimateCredits(est0(replan).reduce((q, c) => q + c.text.length, 0), voice.model);
      if (spent(readSpend()) + add > BUDGET) problems.push(`solo re-takes skipped: ${add} credits would pass the budget`);
      else {
        // replan against the CURRENT records (the kept lines keep the takes just cut)
        Object.assign(prevDoc, JSON.parse(JSON.stringify(linesDoc)));
        for (const s of replan) await runShot(s);
      }
    }
  }

  linesDoc.updatedAt = new Date().toISOString();
  writeJson(P.narration.lines, linesDoc);
  const stillDirty = plan.flatMap((s) => s.lines).map((l) => linesDoc.lines[l.id]).filter((r) => r?.cut && !r.cut.clean);
  for (const r of stillDirty) problems.push(`${Object.keys(linesDoc.lines).find((k) => linesDoc.lines[k] === r)}: unclean clip edge (head ${r.cut.head} ${r.cut.edgeDb.head} dBFS, tail ${r.cut.tail} ${r.cut.edgeDb.tail} dBFS${r.cut.ghost ? `, ghost ${JSON.stringify(r.cut.ghost)}` : ''})`);
  for (const l of plan.flatMap((s) => s.lines)) if (!l.words && linesDoc.lines[l.id]) problems.push(`${l.id}: explicit spoken text has a different word count; word anchors use spoken words`);
  const unmatched = problems.filter((p) => /not found in the alignment/.test(p));
  for (const p of problems) console.warn(`  warn: ${p}`);
  const total = spent(readSpend());
  console.log(`narrated ${plan.length} shots → ${rel(P.narration.lines)}; this run ${Math.round(runCost)} credits, ledger total ${Math.round(total)}`);
  if (unmatched.length && !a['allow-unmatched']) {
    stageFailed(P, 'narration', new Error(`${unmatched.length} lines unmatched in alignment`), { problems });
    process.exitCode = 1;
    return;
  }
  // STT as data: round-trip the lines with names the voice must get right (only clips that changed)
  let stt = null;
  if (a.stt !== false) {
    const r = await refreshStt(P, { script, lex, linesDoc, only: plan.flatMap((s) => s.lines.map((l) => l.id)) });
    for (const e of r.errors) problems.push(`stt ${e}`);
    const failing = r.targets.filter((id) => r.records[id] && !r.records[id].pass);
    for (const id of failing) problems.push(`stt ${id}: expected terms missing from "${r.records[id].transcript}"`);
    stt = { file: rel(sttPath(P)), targets: r.targets, transcribed: r.checked, current: r.skipped, failing };
    if (r.targets.length) console.log(`  stt: ${r.targets.length} target lines; transcribed ${r.checked.length}, current ${r.skipped.length}${failing.length ? `; FAILING ${failing.join(",")}` : ""}`);
  }
  stageDone(P, 'narration', { shots: plan.map((s) => s.shot.id), credits: { run: Math.round(runCost), total: Math.round(total), budget: BUDGET }, problems, stt, outputs: [rel(P.narration.lines)].concat(stt?.targets.length ? [stt.file] : []) });
}

main().catch((e) => {
  const msg = redact(e.message);
  if (e instanceof ProviderLimitError) {
    const resume = `npm run film:narrate -- --slug ${a.slug}${a.shots ? ` --shots ${a.shots}` : ''} (cached chunks are kept)`;
    try {
      stageBlocked(P, 'narration', resume, { error: msg });
    } catch {}
    console.error(`stopped: ${msg}\nresume with: ${resume}`);
    process.exit(3);
  }
  try {
    if (!DRY) stageFailed(P, 'narration', e);
  } catch {}
  console.error(`error: ${msg}`);
  process.exit(1);
});
