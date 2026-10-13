#!/usr/bin/env node
// Stage 4b — the locked edit. Lays narration clips end to end into the film clock.
//
//   npm run film:timeline -- --slug <slug> [--fps 24] [--draft [--wpm 110]] [--allow-stale] [--stem-lufs -18]
//                            [--line-lufs -20] [--comp-ratio 2.5] [--comp-threshold -24] [--dir <filmDir>]
//
// Reads  story/script.json, narration/lines.json + clips/*.wav (from film:narrate), voice/{voice,lexicon}.json
// Writes narration/timeline.json  FilmTimelineData (contracts.ts) — THE clock
//        apps/bookshelf/src/viz/films/<slug>/timeline.json  (identical copy the shots import)
//        narration/narration.wav   48 kHz mono s24 stem: each line ridden to --line-lufs (-20, ±6 dB), then its
//                                  wordRides (script line field), a gentle speech compressor (2.5:1, 10/120 ms) and
//                                  peak stage, THEN per-line clip gain (every line's momentary peak brought to the
//                                  common level plus its levelDb offset, so the offset is what the listener hears),
//                                  then linear gain to --stem-lufs (limiter ≤ ~1 dB)
//        narration/stem.json       { integratedBefore, gainDb, integrated, truePeak, duration, levels }
//        render/film.vtt, render/chapters.txt (YouTube style), render/chapters.ffmeta (ffmpeg chapters)
//        film.json stages.timeline
// Rules (ARCHITECTURE §4): leadIn 0.6 · line · gap · … · holdAfter 0.8, gap = next line's preGap ?? pauseAfter ?? 0.45; duration =
// max(computed, minDuration) rounded up to a whole frame; beats resolved to shot-local seconds.
// --draft fills un-narrated (or stale) lines with synthetic timings at --wpm so shot authors can work
// before narration exists; the timeline then carries "draft": true and no narration.wav is written.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, writeText, rel } from './lib/paths.mjs';
import { stageStart, stageDone, stageFailed, readFilm } from './lib/ledger.mjs';
import { assembleTimeline, toVtt, chaptersText, ffmetadata } from './lib/timing.mjs';
import { speak } from './lib/text.mjs';
import { loadLexicon, lineSig } from './lib/voicecfg.mjs';
import { readWav, writeWav, dbToGain, peakOf } from './lib/wav.mjs';
import { ff, loudness, mediaDuration } from './lib/ffmpeg.mjs';
import { spanLoudness, levelOffsets, median, LEVEL_TOLERANCE_DB } from './lib/levels.mjs';

const SR = 48000;
const a = parseArgs(process.argv.slice(2), {
  boolean: ['help', 'draft', 'allow-stale', 'no-wav'],
  string: ['slug', 'dir', 'fps', 'wpm', 'stem-lufs', 'line-lufs', 'comp-ratio', 'comp-threshold'],
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });

function collectClips(script) {
  const doc = readJson(P.narration.lines, null);
  const lex = loadLexicon(P);
  const clips = {};
  const stale = new Set();
  const missing = new Set();
  for (const ch of script.chapters || [])
    for (const shot of ch.shots || [])
      for (const l of shot.lines || []) {
        const rec = doc?.lines?.[l.id];
        if (!rec) {
          missing.add(shot.id);
          continue;
        }
        const sp = speak(l, lex).spoken;
        const fresh = doc.voice ? rec.sig === lineSig(doc.voice, sp, l.tts) : rec.spoken === sp;
        if (!fresh && !a['allow-stale']) {
          stale.add(shot.id); // --draft fills it with synthetic timings
          continue;
        }
        const file = path.resolve(P.dir, rec.clip);
        if (!fs.existsSync(file)) {
          missing.add(shot.id);
          continue;
        }
        clips[l.id] = { duration: rec.duration, speechStart: rec.speechStart, speechEnd: rec.speechEnd, words: rec.words, file, wordRides: l.wordRides || null, levelDb: Number(l.levelDb) || 0 };
      }
  return { clips, stale: [...stale], missing: [...missing] };
}

async function main() {
  const script = readJson(P.script);
  const film = readFilm(P);
  const fps = num(a.fps, script.fps ?? film.fps ?? 24);
  const { clips, stale, missing } = collectClips(script);
  if (!a.draft && (stale.length || missing.length)) {
    const shots = [...new Set([...stale, ...missing])];
    throw new Error(
      `${stale.length ? `stale narration (script/lexicon/voice changed) in ${stale.join(',')}; ` : ''}${missing.length ? `no narration for ${missing.join(',')}; ` : ''}` +
        `run: npm run film:narrate -- --slug ${a.slug} --shots ${shots.join(',')}  (or --draft for synthetic timings)`,
    );
  }
  stageStart(P, 'timeline', { args: process.argv.slice(2) });
  const { timeline, placements, warnings, draftLines } = assembleTimeline(script, clips, { fps, draftWpm: a.draft ? num(a.wpm, 110) : 0, hint: `--slug ${a.slug}` });
  for (const w of warnings) console.warn(`  warn: ${w}`);

  // ---- narration stem
  let stem = null;
  if (!draftLines.length && !a['no-wav']) {
    const total = Math.round(timeline.duration * SR);
    const buf = new Float32Array(total);
    const target = num(a['stem-lufs'], -18);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `film-narr-${process.pid}-`));
    // 1. ride every line to one speech loudness before anything global: takes from different chunks (and the
    //    quiet climax lines) otherwise sit dB apart, and a global gain keeps that imbalance.
    const LINE_LUFS = num(a['line-lufs'], -20);
    const MAX_RIDE = 6;
    const rides = {};
    for (const p of placements) {
      const { channels, sampleRate } = readWav(clips[p.lineId].file);
      if (sampleRate !== SR) throw new Error(`${p.lineId}: clip is ${sampleRate} Hz, expected ${SR}`);
      const src = channels[0];
      const L = loudness(clips[p.lineId].file);
      const ride = Number.isFinite(L.I) ? Math.max(-MAX_RIDE, Math.min(MAX_RIDE, LINE_LUFS - L.I)) : 0;
      rides[p.lineId] = { lufs: L.I, rideDb: +ride.toFixed(2) };
      const g = dbToGain(ride);
      // word rides (script line field wordRides: {"right": 3}): lift a word the take under-stresses, 15 ms ramps
      const env = new Float32Array(src.length).fill(1);
      const wr = clips[p.lineId].wordRides;
      if (wr) {
        const key = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');
        for (const [word, db] of Object.entries(wr)) {
          const hits = (clips[p.lineId].words || []).filter((w) => key(w.w) === key(word));
          if (!hits.length) console.warn(`  warn: ${p.lineId}: wordRides word "${word}" not found`);
          const ramp = Math.round(0.015 * SR);
          for (const w of hits) {
            const i0 = Math.max(0, Math.round(w.start * SR) - ramp);
            const i1 = Math.min(src.length, Math.round(w.end * SR) + ramp);
            const G = dbToGain(db);
            for (let i = i0; i < i1; i++) {
              const t = Math.min(1, (i - i0) / ramp, (i1 - i) / ramp);
              env[i] = Math.max(env[i], 1 + (G - 1) * t);
            }
          }
          rides[p.lineId].words = { ...(rides[p.lineId].words || {}), [word]: db };
        }
      }
      // per-line level (script line field levelDb: -3) is NOT applied here: before the compressor it was softened
      // by the ratio (a -5 dB offset came out as about -1.5 dB). It is clip gain after the dynamics (step 3).
      const lvl = clips[p.lineId].levelDb;
      if (lvl) rides[p.lineId].levelDb = lvl;
      const off = Math.round(p.at * SR);
      for (let i = Math.max(0, -off); i < src.length && off + i < total; i++) buf[off + i] += src[i] * g * env[i];
    }
    const tmp = path.join(tmpDir, 'rode.wav');
    writeWav(tmp, [buf], SR, 'f32');
    const before = loudness(tmp);
    // 2. a gentle speech compressor (2.5:1, 10 ms attack, 120 ms release; threshold searched for about 3.5 dB of
    //    gain reduction while speaking) evens the delivery, after a 70 Hz high-pass that removes plosive thumps.
    //    Then, only if the stem's crest factor would still need more than ~0.5 dB of limiting at the target, a
    //    fast peak stage (4:1, 1 ms) trims the few transient syllables. Both reductions are measured and reported.
    const speechWin = placements.map((p) => [Math.max(0, Math.round((p.at + clips[p.lineId].speechStart) * SR)), Math.min(total, Math.round((p.at + clips[p.lineId].speechEnd) * SR))]);
    const energy = (pcm) => speechWin.reduce((e, [i0, i1]) => {
      for (let i = i0; i < i1; i++) e += pcm[i] * pcm[i];
      return e;
    }, 0);
    const eIn = energy(buf);
    const runChain = (af, name) => {
      const f = path.join(tmpDir, `${name}.wav`);
      ff(['-y', '-v', 'error', '-i', tmp, '-af', af, '-c:a', 'pcm_f32le', f]);
      const pcm = readWav(f).channels[0];
      const pk = peakOf([pcm]);
      return { file: f, pcm, L: loudness(f), peakDb: 20 * Math.log10(Math.max(pk, 1e-9)), grDb: 10 * Math.log10(eIn / Math.max(energy(pcm), 1e-20)) };
    };
    const ratio = num(a['comp-ratio'], 2.5);
    const GR_TARGET = 3.5;
    const speechComp = (th) => `highpass=f=70,acompressor=threshold=${th}dB:ratio=${ratio}:attack=10:release=120:knee=2.8:makeup=1:detection=rms:link=maximum`;
    let best = null;
    for (const th of a['comp-threshold'] != null ? [num(a['comp-threshold'], -20)] : [-15, -16, -17, -18, -19, -20, -21, -22, -23]) {
      const r = runChain(speechComp(th), `comp${-th}`);
      r.th = th;
      if (!best || Math.abs(r.grDb - GR_TARGET) < Math.abs(best.grDb - GR_TARGET)) best = r;
      if (r.grDb > GR_TARGET + 0.5) break;
    }
    const comp = { ratio, attack: 10, release: 120, knee: 2.8, highpassHz: 70, thresholdDb: best.th, grDb: +best.grDb.toFixed(2), integratedAfter: best.L.I };
    const crest = best.peakDb - best.L.I;
    const CREST_OK = 16.5; // -18 LUFS with a -2 dBFS ceiling leaves 16 dB; 16.5 means ≤ 0.5 dB of limiting
    // speech's own waveform crest (about 18 dB for this kind of voice) is spread over every voiced syllable, so
    // only a fast detector catches it: step the threshold down until the crest fits crestTarget
    const peakStageFor = (crestTarget) => {
      let stage = best;
      let chain = speechComp(best.th);
      let peakStage = null;
      if (crest <= crestTarget) return { stage, chain, peakStage };
      for (let th = Math.round(best.peakDb - 2); th >= Math.round(best.peakDb - 12); th -= 1) {
        const c = `${speechComp(best.th)},acompressor=threshold=${th}dB:ratio=4:attack=0.3:release=40:knee=2:makeup=1:detection=peak:link=maximum`;
        const r = runChain(c, `peak${-th}`);
        const cr = r.peakDb - r.L.I;
        peakStage = { ratio: 4, attack: 0.3, release: 40, thresholdDb: th, peakCutDb: +(crest - cr).toFixed(2), crestBefore: +crest.toFixed(2), crestAfter: +cr.toFixed(2), crestTarget: +crestTarget.toFixed(2), speechGrDb: +(r.grDb - best.grDb).toFixed(2) };
        stage = r;
        chain = c;
        if (cr <= crestTarget) break;
      }
      return { stage, chain, peakStage };
    };
    // 3. per-line clip gain AFTER the compressor and peak stage. Each line's own gated loudness (its momentary
    //    blocks power-averaged with BS.1770 gates: lib/levels.mjs spanLoudness) is brought to the median line level
    //    plus its levelDb, so the offsets land as written (QA
    //    mix.lineLevels checks them within 0.5 dB of the median of the other lines). Regions split at the middle of
    //    each gap, with 40 ms gain ramps there (in silence). Two passes: the second corrects what the first left.
    const spans = placements.map((p) => ({ id: p.lineId, a: p.at + clips[p.lineId].speechStart, b: p.at + clips[p.lineId].speechEnd })).sort((x, y) => x.a - y.a);
    const requested = Object.fromEntries(spans.map((sp) => [sp.id, clips[sp.id].levelDb || 0]));
    const bounds = spans.map((sp, i) => [i ? (spans[i - 1].b + sp.a) / 2 : 0, i < spans.length - 1 ? (sp.b + spans[i + 1].a) / 2 : total / SR]);
    const MAX_TRIM = 4; // dB of level-matching trim per line (on top of its levelDb); more means a bad take
    const applyClipGain = (src, clipGain) => {
      const out = new Float32Array(src.length);
      const R = Math.round(0.02 * SR);
      const gAt = spans.map((sp) => dbToGain(clipGain[sp.id]));
      for (let k = 0; k < spans.length; k++) {
        const i0 = Math.round(bounds[k][0] * SR);
        const i1 = Math.min(src.length, Math.round(bounds[k][1] * SR));
        for (let i = i0; i < i1; i++) {
          let gg = gAt[k];
          // crossfade the gain over ±20 ms around each region boundary (mid-gap, so in silence)
          if (k > 0 && i - i0 < R) gg = gAt[k - 1] + (gAt[k] - gAt[k - 1]) * (0.5 + (i - i0) / (2 * R));
          if (k < spans.length - 1 && i1 - i < R) gg = gAt[k] + (gAt[k + 1] - gAt[k]) * (0.5 - (i1 - i) / (2 * R));
          out[i] = src[i] * gg;
        }
      }
      return out;
    };
    const measurePeaks = (pcm, name) => {
      const f = path.join(tmpDir, `${name}.wav`);
      writeWav(f, [pcm], SR, 'f32');
      return { file: f, peaks: spanLoudness(f, spans) };
    };
    const levelMatch = (stage, tag) => {
      const clipGain = Object.fromEntries(spans.map((sp) => [sp.id, 0]));
      const dynPeaks = measurePeaks(stage.pcm, `dyn${tag}`).peaks;
      let pcm = stage.pcm;
      for (let pass = 0; pass < 2; pass++) {
        const cur = pass ? measurePeaks(pcm, `lvl${tag}-${pass}`).peaks : dynPeaks;
        const ref = median(spans.map((sp) => cur[sp.id] - requested[sp.id]));
        for (const sp of spans) clipGain[sp.id] += ref + requested[sp.id] - cur[sp.id];
        pcm = applyClipGain(stage.pcm, clipGain);
      }
      const clamped = [];
      for (const sp of spans) {
        const trim = clipGain[sp.id] - requested[sp.id];
        if (Math.abs(trim) > MAX_TRIM) {
          clamped.push(`${sp.id} ${trim.toFixed(1)} dB`);
          clipGain[sp.id] = requested[sp.id] + Math.sign(trim) * MAX_TRIM;
        }
      }
      if (clamped.length) pcm = applyClipGain(stage.pcm, clipGain);
      const out = measurePeaks(pcm, `lvl${tag}`);
      const L = loudness(out.file);
      const peakDb = 20 * Math.log10(Math.max(peakOf([pcm]), 1e-9));
      return { clipGain, clamped, dynPeaks, pcm, file: out.file, L, crest: peakDb - L.I };
    };
    // the quieter lines lower the integrated level while the loudest transients stay, so the crest grows by about
    // the level the offsets take out: if it no longer fits, re-run the peak stage (BEFORE the clip gain, where it
    // treats every line alike) aiming that much lower, then match the levels again
    let { stage, chain, peakStage } = peakStageFor(CREST_OK);
    let lm = levelMatch(stage, 'a');
    if (lm.crest > CREST_OK + 0.05) {
      const growth = lm.crest - (stage.peakDb - stage.L.I);
      ({ stage, chain, peakStage } = peakStageFor(CREST_OK - Math.max(0, growth) - 0.05));
      lm = levelMatch(stage, 'b');
    }
    if (lm.clamped.length) console.warn(`  warn: level-matching trims clamped to ±${MAX_TRIM} dB: ${lm.clamped.join(', ')}`);
    for (const sp of spans) {
      rides[sp.id].clipGainDb = +lm.clipGain[sp.id].toFixed(2);
      rides[sp.id].trimDb = +(lm.clipGain[sp.id] - requested[sp.id]).toFixed(2);
    }
    chain += ',[per-line clip gain]';
    const dynPeaks = lm.dynPeaks;
    const compF = lm.file;
    const compL = lm.L;
    const compPcm = lm.pcm;
    // 4. one linear gain to the stem target; a transparent look-ahead limiter catches the few transients left
    const peak = peakOf([compPcm]);
    const peakDb = 20 * Math.log10(Math.max(peak, 1e-9));
    // at most 4 dB of peak limiting: beyond that speech starts to sound squashed; the stem then lands below target
    const gainDb = Math.min(Number.isFinite(compL.I) ? target - compL.I : 0, -2 - peakDb + 4);
    const needLimit = peak * dbToGain(gainDb) > dbToGain(-2);
    ff(['-y', '-v', 'error', '-i', compF, '-af', `volume=${gainDb.toFixed(3)}dB${needLimit ? `,alimiter=limit=${dbToGain(-2).toFixed(4)}:attack=4:release=80:level=0:latency=1` : ''}`, '-ar', String(SR), '-c:a', 'pcm_s24le', P.narration.wav]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    const after = loudness(P.narration.wav);
    const outDur = mediaDuration(P.narration.wav);
    if (Math.abs(outDur - timeline.duration) > 0.002) throw new Error(`narration.wav length ${outDur} != timeline ${timeline.duration}`);
    const limitedDb = needLimit ? +(peakDb + gainDb + 2).toFixed(2) : 0;
    if (limitedDb > 1) console.warn(`  warn: the stem limiter takes ${limitedDb} dB off the peaks (> 1 dB)`);
    console.log(`  stem: lines ridden to ${LINE_LUFS} LUFS (max ride ${Math.max(...Object.values(rides).map((r) => Math.abs(r.rideDb))).toFixed(1)} dB); compressor ${ratio}:1 @ ${comp.thresholdDb} dB → ${comp.grDb} dB GR in speech${peakStage ? `; peak stage trims ${peakStage.peakCutDb} dB (crest ${peakStage.crestBefore} → ${peakStage.crestAfter})` : ''}; limiter ${limitedDb} dB`);
    stem = {
      file: rel(P.narration.wav), duration: timeline.duration, lineLufs: LINE_LUFS, rides,
      integratedBefore: before.I, compressor: comp, peakStage, chain,
      gainDb: +gainDb.toFixed(2), peakBeforeDb: +peakDb.toFixed(2), limitedDb, integrated: after.I, truePeak: after.TP, lra: after.LRA, target,
      levels: { measure: 'gated loudness per line window (LUFS)', tolerance: LEVEL_TOLERANCE_DB, beforeClipGain: levelOffsets(dynPeaks, requested), lines: levelOffsets(spanLoudness(P.narration.wav, spans), requested) },
    };
    const off = Object.entries(stem.levels.lines).filter(([, v]) => Math.abs(v.errorDb) > LEVEL_TOLERANCE_DB);
    console.log(`  line levels (gated loudness vs median of the others): ${Object.entries(stem.levels.lines).map(([k, v]) => `${k} ${v.offsetDb >= 0 ? "+" : ""}${v.offsetDb}${v.requestedDb ? ` (want ${v.requestedDb})` : ""}`).join(", ")}`);
    if (off.length) console.warn(`  warn: line levels off by more than ${LEVEL_TOLERANCE_DB} dB: ${off.map(([k, v]) => `${k} ${v.errorDb}`).join(", ")}`);
    writeJson(P.narration.stem, stem);
  } else if (draftLines.length) {
    console.warn(`  draft: ${draftLines.length} lines use synthetic timings (${[...new Set(timeline.shots.filter((s) => s.lines.some((l) => draftLines.includes(l.id))).map((s) => s.id))].join(',')}); narration.wav not written`);
  }

  // ---- outputs
  writeJson(P.narration.timeline, timeline);
  writeJson(P.app.timeline, timeline);
  writeText(P.render.vtt, toVtt(timeline));
  writeText(P.render.chaptersTxt, chaptersText(timeline));
  writeText(P.render.ffmeta, ffmetadata(timeline, script.title));
  const lines = timeline.shots.reduce((s, x) => s + x.lines.length, 0);
  console.log(
    `timeline: ${timeline.chapters.length} chapters, ${timeline.shots.length} shots, ${lines} lines, ${timeline.duration.toFixed(2)} s ` +
      `(${(timeline.duration / 60).toFixed(1)} min) @ ${fps} fps${timeline.draft ? ' [DRAFT]' : ''}` +
      (stem ? `; stem ${stem.integrated} LUFS / TP ${stem.truePeak} dBTP (gain ${stem.gainDb} dB)` : ''),
  );
  console.log(`  → ${rel(P.narration.timeline)}, ${rel(P.app.timeline)}, ${rel(P.render.vtt)}, ${rel(P.render.chaptersTxt)}`);
  stageDone(P, 'timeline', {
    draft: !!timeline.draft,
    duration: timeline.duration,
    fps,
    shots: timeline.shots.length,
    lines,
    warnings,
    stem,
    outputs: [rel(P.narration.timeline), rel(P.app.timeline), rel(P.render.vtt), rel(P.render.chaptersTxt)].concat(stem ? [rel(P.narration.wav)] : []),
  });
}

main().catch((e) => {
  try {
    stageFailed(P, 'timeline', e);
  } catch {}
  console.error(`error: ${e.message}`);
  process.exit(1);
});
