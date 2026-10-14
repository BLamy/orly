#!/usr/bin/env node
// Stage 4b — the locked edit. Lays narration clips end to end into the film clock.
//
//   npm run film:timeline -- --slug <slug> [--fps 24] [--draft [--wpm 110]] [--allow-stale] [--stem-lufs -18]
//                            [--line-lufs -20] [--comp-ratio 2.5] [--comp-threshold -24] [--dir <filmDir>]
//                            (--stem-lufs defaults to -19 since review round 3)
//
// Reads  story/script.json, narration/lines.json + clips/*.wav (from film:narrate), voice/{voice,lexicon}.json
// Writes narration/timeline.json  FilmTimelineData (contracts.ts) — THE clock
//        apps/bookshelf/src/viz/films/<slug>/timeline.json  (identical copy the shots import)
//        narration/narration.wav   48 kHz mono s24 stem: each line ridden toward --line-lufs (-20, capped at
//                                  ±--max-ride 3 dB), then its wordRides (script line field), a gentle speech
//                                  compressor (2.5:1, 10/120 ms) and a soft peak stage (2:1), THEN per-line clip gain
//                                  (each line's gated loudness brought toward the common level, the ride plus this
//                                  trim never moving a line more than ±3 dB in all, plus its level hint and levelDb,
//                                  applied exactly so they are what the listener hears), then linear gain to
//                                  --stem-lufs (limiter)
// Review round 3 (the speech chain was pressed: stem limiter 3 dB): script line field trimDb FIXES a line's
// clip-gain trim (0 = no trim beyond its requested level: the capped ride alone levels it; residual +1 dB trims on
// hot takes were what the limiter ate), and fadeIn (seconds, e.g. 0.04) softens a hot onset (a ramp over the first
// fadeIn s of speech). The stem target is -19 LUFS; the master gain recovers the dB.
// Review round 2: rides of up to 6 dB plus a trim of up to 4 dB flattened the narrator (every line at one level),
// and levelDb +3 offsets stacked on top of them. Now the leveling (ride + trim) is capped at ±3 dB, so a take keeps
// some of its own dynamics, and a line's `level` hint ('soft' = -2 dB under the common level: asides, closing
// lines) is applied after the dynamics. QA (mix.lineLevels) warns when a line ends more than 1.5 dB from its
// intended level (common level + hint), and when |levelDb| > 1.5 (an offset stacking on the ride).
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
import { spanLoudness, levelOffsets, median, LEVEL_TOLERANCE_DB, LEVEL_WARN_DB, levelHintDb, MAX_LEVELING_DB } from './lib/levels.mjs';

const SR = 48000;
const a = parseArgs(process.argv.slice(2), {
  boolean: ['help', 'draft', 'allow-stale', 'no-wav'],
  string: ['slug', 'dir', 'fps', 'wpm', 'stem-lufs', 'line-lufs', 'comp-ratio', 'comp-threshold', 'comp-gr', 'max-ride', 'peak-ratio'],
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
        clips[l.id] = { duration: rec.duration, speechStart: rec.speechStart, speechEnd: rec.speechEnd, words: rec.words, file, wordRides: l.wordRides || null, gainEnvelope: Array.isArray(l.gainEnvelope) && l.gainEnvelope.length ? l.gainEnvelope : null, levelDb: Number(l.levelDb) || 0, level: l.level || null, hintDb: levelHintDb(l.level), fixedTrimDb: Number.isFinite(l.trimDb) ? l.trimDb : null, fadeIn: Number.isFinite(l.fadeIn) ? l.fadeIn : 0 };
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
    // review round 3: -19 (was -18): the stem limiter took 3 dB; the master's one constant gain (mix.mjs, to -16
    // LUFS) recovers the dB, so the voice sits where it did against the music, with 1 dB less limiting
    const target = num(a['stem-lufs'], -19);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `film-narr-${process.pid}-`));
    // scratch is ~400 MB per f32 candidate: remove it even when a step throws (a full disk left 3-6 GB behind)
    process.once('exit', () => fs.rmSync(tmpDir, { recursive: true, force: true }));
    // 1. ride every line to one speech loudness before anything global: takes from different chunks (and the
    //    quiet climax lines) otherwise sit dB apart, and a global gain keeps that imbalance.
    const LINE_LUFS = num(a['line-lufs'], -20);
    const MAX_RIDE = num(a['max-ride'], MAX_LEVELING_DB); // review round 2: was 6 (flattened the narrator)
    const rides = {};
    for (const p of placements) {
      const { channels, sampleRate } = readWav(clips[p.lineId].file);
      if (sampleRate !== SR) throw new Error(`${p.lineId}: clip is ${sampleRate} Hz, expected ${SR}`);
      const src = channels[0];
      rides[p.lineId] = { lufs: null, rideDb: 0 };
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
      // fadeIn (script line field, s): a hot onset is ramped in over the first fadeIn s of speech (review round 3: L1505)
      const fin = clips[p.lineId].fadeIn;
      if (fin > 0) {
        const i0 = Math.max(0, Math.round((clips[p.lineId].speechStart - 0.005) * SR));
        const n = Math.round(fin * SR);
        for (let i = 0; i < i0; i++) env[i] = 0;
        for (let k = 0; k < n && i0 + k < env.length; k++) env[i0 + k] *= k / n;
        rides[p.lineId].fadeIn = fin;
      }
      // gain envelope (script line field gainEnvelope: [{from, to, db, rampMs?}]): per-word clip gain from the start
      // of word `from` to the end of word `to` ("word#2" = its second occurrence), with rampMs (default 30) ramps
      // outside the span; segments multiply. Unlike wordRides it can cut as well as lift, and the line's ride is
      // measured on the enveloped clip (review round 3: L1505 'Nobody' -2 dB, 'told'..'plan' +4 dB)
      const ge = clips[p.lineId].gainEnvelope;
      if (ge) {
        const ws = clips[p.lineId].words || [];
        const idx = (word) => {
          const [w0, nth] = String(word).split('#');
          const k = String(w0).toLowerCase().replace(/[^a-z0-9']/g, '');
          return ws.map((w, j) => (String(w.w).toLowerCase().replace(/[^a-z0-9']/g, '') === k ? j : -1)).filter((j) => j >= 0)[Math.max(0, (Number(nth) || 1) - 1)] ?? -1;
        };
        const env2 = new Float32Array(src.length).fill(1);
        const applied = [];
        for (const seg of ge) {
          const a0 = idx(seg.from);
          const b0 = idx(seg.to ?? seg.from);
          if (a0 < 0 || b0 < 0 || b0 < a0) {
            console.warn(`  warn: ${p.lineId}: gainEnvelope ${JSON.stringify(seg)} words not found (or out of order)`);
            continue;
          }
          const ramp = Math.max(1, Math.round(((Number(seg.rampMs) || 30) / 1000) * SR));
          const s0 = Math.round(ws[a0].start * SR);
          const s1 = Math.round(ws[b0].end * SR);
          const G = dbToGain(Number(seg.db) || 0);
          for (let i = Math.max(0, s0 - ramp); i < Math.min(src.length, s1 + ramp); i++) {
            const t = i < s0 ? (i - (s0 - ramp)) / ramp : i > s1 ? (s1 + ramp - i) / ramp : 1;
            env2[i] *= 1 + (G - 1) * Math.max(0, Math.min(1, t));
          }
          applied.push({ from: seg.from, to: seg.to ?? seg.from, db: Number(seg.db) || 0, at: [+ws[a0].start.toFixed(3), +ws[b0].end.toFixed(3)] });
        }
        for (let i = 0; i < env.length; i++) env[i] *= env2[i];
        if (applied.length) rides[p.lineId].gainEnvelope = applied;
      }
      // the ride: toward LINE_LUFS, measured on the clip as it will be heard (with its envelope) when it has a
      // gainEnvelope, else on the raw clip (unchanged for every other line)
      let L;
      if (rides[p.lineId].gainEnvelope) {
        const f = path.join(tmpDir, `env-${p.lineId}.wav`);
        writeWav(f, [src.map((v, i) => v * env[i])], SR, 'f32');
        L = loudness(f);
        fs.rmSync(f, { force: true });
      } else L = loudness(clips[p.lineId].file);
      // a level hint widens the cap in its own direction (a 'soft' line may be ridden down 2 dB further: the ride
      // honours the hint instead of eating it); the hint itself is applied exactly as clip gain in step 3
      const hint = clips[p.lineId].hintDb || 0;
      const ride = Number.isFinite(L.I) ? Math.max(-MAX_RIDE + Math.min(0, hint), Math.min(MAX_RIDE + Math.max(0, hint), LINE_LUFS - L.I)) : 0;
      Object.assign(rides[p.lineId], { lufs: L.I, rideDb: +ride.toFixed(2) });
      const g = dbToGain(ride);
      // per-line level (script line field levelDb: -3) is NOT applied here: before the compressor it was softened
      // by the ratio (a -5 dB offset came out as about -1.5 dB). It is clip gain after the dynamics (step 3).
      const lvl = clips[p.lineId].levelDb;
      if (lvl) rides[p.lineId].levelDb = lvl;
      if (clips[p.lineId].hintDb) Object.assign(rides[p.lineId], { level: clips[p.lineId].level, hintDb: clips[p.lineId].hintDb });
      const off = Math.round(p.at * SR);
      for (let i = Math.max(0, -off); i < src.length && off + i < total; i++) buf[off + i] += src[i] * g * env[i];
    }
    const tmp = path.join(tmpDir, 'rode.wav');
    writeWav(tmp, [buf], SR, 'f32');
    const before = loudness(tmp);
    // 2. a gentle speech compressor (2.5:1, 10 ms attack, 120 ms release; threshold searched for about 1.8 dB of
    //    gain reduction while speaking) evens the delivery, after a 70 Hz high-pass that removes plosive thumps.
    //    Then, only if the stem's crest factor would still need more than ~0.5 dB of limiting at the target, a
    //    fast peak stage trims the few transient syllables: 2:1 since review round 2 (4:1 squashed the delivery), and
    //    it never cuts more than --peak-max (3) dB of crest. Both reductions are measured and reported.
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
      const L = loudness(f);
      fs.rmSync(f, { force: true }); // measured; only the PCM in memory is used from here on
      return { file: null, pcm, L, peakDb: 20 * Math.log10(Math.max(pk, 1e-9)), grDb: 10 * Math.log10(eIn / Math.max(energy(pcm), 1e-20)) };
    };
    const ratio = num(a['comp-ratio'], 2.5);
    // review round 4: the search aimed at 3.5 dB of GR and landed on 3.42 (QA stem/stemLimit warn). It now aims at
    // 1.8 dB (the threshold rises ~2 dB), so the speech compressor averages <= 2 dB GR; --comp-gr overrides
    const GR_TARGET = num(a['comp-gr'], 1.8);
    const speechComp = (th) => `highpass=f=70,acompressor=threshold=${th}dB:ratio=${ratio}:attack=10:release=120:knee=2.8:makeup=1:detection=rms:link=maximum`;
    let best = null;
    for (const th of a['comp-threshold'] != null ? [num(a['comp-threshold'], -20)] : [-12, -13, -14, -15, -16, -17, -18, -19, -20, -21, -22, -23]) {
      const r = runChain(speechComp(th), `comp${-th}`);
      r.th = th;
      if (!best || Math.abs(r.grDb - GR_TARGET) < Math.abs(best.grDb - GR_TARGET)) best = r;
      if (r.grDb > GR_TARGET + 0.5) break;
    }
    const comp = { ratio, attack: 10, release: 120, knee: 2.8, highpassHz: 70, thresholdDb: best.th, grDb: +best.grDb.toFixed(2), integratedAfter: best.L.I };
    const crest = best.peakDb - best.L.I;
    const CREST_OK = 16.5;
    const PEAK_RATIO = num(a['peak-ratio'], 2); // review round 2: was 4
    const PEAK_MAX = 3; // dB of crest the peak stage may take at most // -18 LUFS with a -2 dBFS ceiling leaves 16 dB; 16.5 means ≤ 0.5 dB of limiting
    // speech's own waveform crest (about 18 dB for this kind of voice) is spread over every voiced syllable, so
    // only a fast detector catches it: step the threshold down until the crest fits crestTarget
    const peakStageFor = (crestTarget) => {
      let stage = best;
      let chain = speechComp(best.th);
      let peakStage = null;
      if (crest <= crestTarget) return { stage, chain, peakStage };
      for (let th = Math.round(best.peakDb - 2); th >= Math.round(best.peakDb - 12); th -= 1) {
        const c = `${speechComp(best.th)},acompressor=threshold=${th}dB:ratio=${PEAK_RATIO}:attack=0.3:release=40:knee=2:makeup=1:detection=peak:link=maximum`;
        const r = runChain(c, `peak${-th}`);
        const cr = r.peakDb - r.L.I;
        if (peakStage && crest - cr > PEAK_MAX + 0.05) break; // relaxed: the rest goes to the limiter, not the speech
        peakStage = { ratio: PEAK_RATIO, attack: 0.3, release: 40, thresholdDb: th, peakCutDb: +(crest - cr).toFixed(2), crestBefore: +crest.toFixed(2), crestAfter: +cr.toFixed(2), crestTarget: +crestTarget.toFixed(2), maxCutDb: PEAK_MAX, speechGrDb: +(r.grDb - best.grDb).toFixed(2) };
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
    // intended level of each line relative to the common (median) level: its level hint ('soft' -2) plus levelDb
    const requested = Object.fromEntries(spans.map((sp) => [sp.id, (clips[sp.id].levelDb || 0) + (clips[sp.id].hintDb || 0)]));
    const hints = Object.fromEntries(spans.map((sp) => [sp.id, clips[sp.id].hintDb || 0]));
    const bounds = spans.map((sp, i) => [i ? (spans[i - 1].b + sp.a) / 2 : 0, i < spans.length - 1 ? (sp.b + spans[i + 1].a) / 2 : total / SR]);
    // the leveling (step-1 ride + this trim) moves a line at most ±MAX_RIDE dB in all; its hint and levelDb come on
    // top. Review round 3: a hint never moves a line PAST its natural (capped) level in the hint's direction: a 'soft'
    // tag on a take that is already quiet (L0217, L1522c: ride maxed at +3 and still 2-3 dB under) marks its directed
    // quiet instead of pushing it 2 dB further down, so the trim may give the hint's dB back on that side
    const trimRange = (id) => {
      const hint = clips[id].hintDb || 0;
      const ride = rides[id]?.rideDb || 0;
      return [-MAX_RIDE + Math.min(0, hint) - ride - Math.max(0, hint), MAX_RIDE + Math.max(0, hint) - ride + Math.max(0, -hint)];
    };
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
    const measurePeaksOnly = (pcm, name) => {
      const r = measurePeaks(pcm, name);
      fs.rmSync(r.file, { force: true });
      return r.peaks;
    };
    let lmPrev = null;
    const levelMatch = (stage, tag) => {
      const clipGain = Object.fromEntries(spans.map((sp) => [sp.id, 0]));
      const dynPeaks = measurePeaksOnly(stage.pcm, `dyn${tag}`);
      let pcm = stage.pcm;
      for (let pass = 0; pass < 2; pass++) {
        const cur = pass ? measurePeaksOnly(pcm, `lvl${tag}-${pass}`) : dynPeaks;
        const ref = median(spans.map((sp) => cur[sp.id] - requested[sp.id]));
        for (const sp of spans) clipGain[sp.id] += ref + requested[sp.id] - cur[sp.id];
        pcm = applyClipGain(stage.pcm, clipGain);
      }
      // fixed trims (script line field trimDb): the ride alone levels these lines
      const fixed = spans.filter((sp) => clips[sp.id].fixedTrimDb != null);
      for (const sp of fixed) clipGain[sp.id] = requested[sp.id] + clips[sp.id].fixedTrimDb;
      if (fixed.length) pcm = applyClipGain(stage.pcm, clipGain);
      const clamped = [];
      for (const sp of spans) {
        const trim = clipGain[sp.id] - requested[sp.id];
        const [lo, hi] = trimRange(sp.id);
        if (trim < lo - 1e-6 || trim > hi + 1e-6) {
          clamped.push(`${sp.id} ${trim.toFixed(1)}→${Math.min(hi, Math.max(lo, trim)).toFixed(1)} dB`);
          clipGain[sp.id] = requested[sp.id] + Math.min(hi, Math.max(lo, trim));
        }
      }
      if (clamped.length) pcm = applyClipGain(stage.pcm, clipGain);
      const out = measurePeaks(pcm, `lvl${tag}`);
      const L = loudness(out.file);
      if (lmPrev && lmPrev !== out.file) fs.rmSync(lmPrev, { force: true }); // a second levelMatch supersedes the first
      lmPrev = out.file;
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
    if (lm.clamped.length) console.log(`  leveling capped at ±${MAX_RIDE} dB (ride + trim; the take keeps the rest of its level): ${lm.clamped.length} lines: ${lm.clamped.join(', ')}`);
    for (const sp of spans) {
      rides[sp.id].clipGainDb = +lm.clipGain[sp.id].toFixed(2);
      rides[sp.id].trimDb = +(lm.clipGain[sp.id] - requested[sp.id]).toFixed(2);
      rides[sp.id].levelingDb = +(rides[sp.id].rideDb + rides[sp.id].trimDb).toFixed(2);
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
      file: rel(P.narration.wav), duration: timeline.duration, lineLufs: LINE_LUFS, maxLevelingDb: MAX_RIDE, rides,
      integratedBefore: before.I, compressor: comp, peakStage, chain,
      gainDb: +gainDb.toFixed(2), peakBeforeDb: +peakDb.toFixed(2), limitedDb, integrated: after.I, truePeak: after.TP, lra: after.LRA, target,
      levels: { measure: 'gated loudness per line window (LUFS)', tolerance: LEVEL_TOLERANCE_DB, warnDb: LEVEL_WARN_DB, beforeClipGain: levelOffsets(dynPeaks, requested, hints), lines: levelOffsets(spanLoudness(P.narration.wav, spans), requested, hints) },
    };
    const off = Object.entries(stem.levels.lines).filter(([, v]) => Math.abs(v.driftDb) > LEVEL_WARN_DB);
    console.log(`  line levels (gated loudness vs median of the others): ${Object.entries(stem.levels.lines).map(([k, v]) => `${k} ${v.offsetDb >= 0 ? "+" : ""}${v.offsetDb}${v.requestedDb ? ` (want ${v.requestedDb})` : ""}`).join(", ")}`);
    if (off.length) console.warn(`  warn: line levels more than ${LEVEL_WARN_DB} dB from their intended level (capped leveling): ${off.map(([k, v]) => `${k} ${v.driftDb}`).join(", ")}`);
    writeJson(P.narration.stem, stem);
  } else if (draftLines.length) {
    console.warn(`  draft: ${draftLines.length} lines use synthetic timings (${[...new Set(timeline.shots.filter((s) => s.lines.some((l) => draftLines.includes(l.id))).map((s) => s.id))].join(',')}); narration.wav not written`);
  }

  // ---- outputs
  // an unchanged clock is not rewritten (a re-level of the stem must not make every contact sheet look stale)
  const same = (f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8') === `${JSON.stringify(timeline, null, 1)}\n`;
  if (!same(P.narration.timeline)) writeJson(P.narration.timeline, timeline);
  else console.log('  clock unchanged: timeline.json kept as is');
  if (!same(P.app.timeline)) writeJson(P.app.timeline, timeline);
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
