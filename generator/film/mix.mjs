#!/usr/bin/env node
// Stage 7 — mix. Narration stem + score cues → mastered stereo WAV + chapter slices for the shelf.
//
//   npm run film:mix -- --slug <slug> [--lufs -16] [--tp -1.5] [--duck-threshold 0.025] [--duck-ratio 8]
//                       [--duck-attack 20] [--duck-release 500] [--fade-after-strike 1.6] [--no-chapters] [--dir <filmDir>]
//
// Reads  narration/timeline.json (duration, chapters, line windows), narration/narration.wav,
//        score/cues.json (MusicCue[]: start, end, render, gainDb, fadeIn, fadeOut, duck)
// Writes mix/master.wav       48 kHz stereo s24, one constant gain to -16 LUFS / -1.5 dBTP (limiter only for overshoot), length = film duration
//        mix/loudness.json    master I/LRA/TP, loudnorm pass-1 numbers, duck depth + calibration, per-cue placement,
//                             moments {lines: each line's max momentary LUFS, nonSpeech: loudest music-only windows}, chapter files
//        mix/chapters/<n>.m4a AAC slices per chapter (each < 25 MiB for Workers static assets)
//        film.json stages.mix
// Cue placement: render sample 0 lands at cue.start (sample exact, adelay in samples); fadeIn from 0;
// if fadeOut > 0 the cue fades over [end - fadeOut, end] and is cut at end, else its rendered tail rings out; a cue's
// fade never starts sooner than --fade-after-strike (1.6 s) after its lastStrike marker (it starts later and shortens).
// Cues with duck: true (or a duck object {ratio, attack, release, threshold, depthDb}) go through a sidechain compressor
// keyed by the narration; duck depth (dB of gain reduction on the ducked bus while the narrator speaks) is measured
// and checked against depthDb (default 6). depthDb is a CEILING: the mixer measures the configured threshold/ratio,
// then raises the threshold (or lowers the ratio) until the measured depth is within 1 dB of the target; the applied
// settings and every calibration pass are in loudness.json duck.{applied, calibration}. Check: |depth - target| <= 1.5.
// MUSIC BUS EQ (review round 1: 20-50 Hz drones spent headroom and thickened the narrator's fundamental): every cue
// goes through a 35 Hz high-pass (24 dB/oct, two 2-pole stages) and a KEYED low shelf: a 4th-order crossover at
// --shelf-hz (120) splits the bus; the low band is compressed by the narration key (ratio --shelf-ratio 2.5 at the
// duck threshold), about -2 to -3 dB below 120 Hz while the narrator speaks, flat in the gaps. Reported in
// loudness.json musicEq (the low band's measured reduction under speech).
// ROOM TONE: a continuous floor of tape hiss (pink noise, high-passed at 2.5 kHz, decorrelated L/R) at --floor-lufs
// (-58 LUFS) is added AFTER the master gain, so the master never reaches digital zero (QA mix.floor).
// With no cues.json the master is the narration alone (same loudness targets).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel, mkdirp, resolveIn } from './lib/paths.mjs';
import { stageStart, stageDone, stageFailed } from './lib/ledger.mjs';
import { ff, loudness, loudnormMeasure, mediaDuration, momentary } from './lib/ffmpeg.mjs';
import { spanLoudness, lineSpans } from './lib/levels.mjs';
import { readWav } from './lib/wav.mjs';
import { lastStrike as findLastStrike } from './lib/onsets.mjs';

const SR = 48000;
const MAX_SLICE = 25 * 1024 * 1024;
const a = parseArgs(process.argv.slice(2), {
  boolean: ['help', 'chapters', 'keep-temp'],
  string: ['slug', 'dir', 'lufs', 'tp', 'lra', 'fade-after-strike', 'duck-threshold', 'duck-ratio', 'duck-attack', 'duck-release', 'floor-lufs', 'shelf-hz', 'shelf-ratio', 'hpf-hz'],
  default: { chapters: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const TARGET = { I: num(a.lufs, -16), TP: num(a.tp, -1.5), LRA: num(a.lra, 11) };
// seconds of clear air between a cue's last strike (cues.json lastStrike) and the start of its fade-out
const FADE_AFTER_STRIKE = num(a["fade-after-strike"], 1.6);
const FLOOR_LUFS = num(a['floor-lufs'], -58);
const HPF_HZ = num(a['hpf-hz'], 35);
const SHELF_HZ = num(a['shelf-hz'], 120);
const SHELF_RATIO = num(a['shelf-ratio'], 2.5);

function loadCues() {
  if (!fs.existsSync(P.score.cues)) return [];
  const j = readJson(P.score.cues);
  return (Array.isArray(j) ? j : j.cues || []).filter((c) => c && c.id);
}

function readF32(file) {
  const b = fs.readFileSync(file);
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength - (b.byteLength % 4)));
}

/** dB of gain reduction on the ducked bus while the narrator speaks (energy-weighted). */
function duckDepth(dryFile, wetFile, timeline, sr) {
  const dry = readF32(dryFile);
  const wet = readF32(wetFile);
  let ed = 0;
  let ew = 0;
  let speechSec = 0;
  for (const s of timeline.shots)
    for (const l of s.lines) {
      const i0 = Math.round((s.start + l.start + 0.15) * sr);
      const i1 = Math.min(dry.length, wet.length, Math.round((s.start + l.end) * sr));
      if (i1 <= i0) continue;
      let d = 0;
      let w = 0;
      for (let i = i0; i < i1; i++) {
        d += dry[i] * dry[i];
        w += wet[i] * wet[i];
      }
      if (d / (i1 - i0) < 1e-6) continue; // music silent here (−60 dBFS)
      ed += d;
      ew += w;
      speechSec += (i1 - i0) / sr;
    }
  return speechSec ? { depthDb: +(10 * Math.log10(ed / Math.max(ew, 1e-20))).toFixed(2), speechSecondsUnderMusic: +speechSec.toFixed(1) } : { depthDb: null, speechSecondsUnderMusic: 0 };
}

/** The room-tone floor file (stereo, D seconds) at FLOOR_LUFS. Calibrated on 20 s, then rendered full length. */
function roomTone(tmp, D) {
  const src = (amp, dur, seed) => `anoisesrc=color=pink:sample_rate=${SR}:amplitude=${amp}:duration=${dur}:seed=${seed}`;
  const graph = (amp, dur) => `${src(amp, dur, 1943)}[l];${src(amp, dur, 2026)}[r];[l][r]join=inputs=2:channel_layout=stereo,highpass=f=2500:poles=2,highpass=f=2500:poles=2,lowpass=f=12000[out]`;
  const probe = path.join(tmp, 'floor-probe.wav');
  ff(['-y', '-v', 'error', '-filter_complex', graph(0.5, 20), '-map', '[out]', '-c:a', 'pcm_f32le', probe]);
  const L0 = loudness(probe).I;
  const amp = 0.5 * 10 ** ((FLOOR_LUFS - L0) / 20);
  const file = path.join(tmp, 'floor.wav');
  ff(['-y', '-v', 'error', '-filter_complex', graph(amp.toFixed(6), D.toFixed(4)), '-map', '[out]', '-c:a', 'pcm_f32le', file]);
  return { file, lufs: loudness(file).I };
}

let minMomentaryCache = null;
/** The quietest momentary (400 ms) loudness anywhere in the file. */
function minMomentary(file) {
  if (minMomentaryCache?.file === file && minMomentaryCache.mtime === fs.statSync(file).mtimeMs) return minMomentaryCache.v;
  const M = momentary(file).filter((q) => q.t >= 0.4);
  const v = +Math.min(...M.map((q) => q.M)).toFixed(1);
  minMomentaryCache = { file, mtime: fs.statSync(file).mtimeMs, v };
  return v;
}

async function main() {
  const timeline = readJson(P.narration.timeline);
  if (timeline.draft) throw new Error('timeline.json is a DRAFT (synthetic timings); narrate and re-run film:timeline before mixing');
  if (!fs.existsSync(P.narration.wav)) throw new Error(`missing ${rel(P.narration.wav)} — run film:timeline`);
  const D = timeline.duration;
  const narrDur = mediaDuration(P.narration.wav);
  if (Math.abs(narrDur - D) > 0.05) throw new Error(`narration.wav is ${narrDur.toFixed(3)} s but timeline says ${D} s — re-run film:timeline`);
  stageStart(P, 'mix', { args: process.argv.slice(2) });
  const cues = loadCues();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-mix-'));
  const placed = [];
  const inputs = ['-i', P.narration.wav];
  const chains = [`[0:a]aresample=${SR},aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=3[voice][key0][key1]`];
  const duck = [];
  const free = [];
  for (const c of cues) {
    const file = resolveIn(P, c.render || `score/renders/${c.id}.wav`);
    if (!fs.existsSync(file)) throw new Error(`cue ${c.id}: render missing (${rel(file)}) — run film:score render --slug ${a.slug} --cue ${c.id}`);
    if (!(c.end > c.start) || c.start < 0 || c.start >= D) throw new Error(`cue ${c.id}: window ${c.start}..${c.end} is outside the film (0..${D})`);
    const len = mediaDuration(file);
    const k = inputs.length / 2;
    inputs.push('-i', file);
    const body = c.end - c.start;
    // 35 Hz high-pass, 24 dB/oct (two 2-pole Butterworth stages) on every cue: no sub-bass under the narrator
    const f = [`aresample=${SR}`, 'aformat=sample_fmts=fltp:channel_layouts=stereo', `highpass=f=${HPF_HZ}:poles=2`, `highpass=f=${HPF_HZ}:poles=2`, `volume=${num(c.gainDb, 0)}dB`];
    if (c.fadeIn > 0) f.push(`afade=t=in:st=0:d=${c.fadeIn}:curve=qsin`);
    let used = len;
    // the last strike (cue field lastStrike, absolute film seconds: the onset of the cue's final chord or note, which
    // the score stage records) must ring in clear air: the fade starts no earlier than FADE_AFTER_STRIKE s after it.
    // A configured fade that would start sooner starts later instead (and gets shorter, never below 0.3 s); if even
    // that cannot fit inside the window, the fadeAfterStrike check fails. No marker on a cue that fades: a warning.
    let fade = null;
    if (c.fadeOut > 0) {
      // no marker in cues.json: find the final onset in the render itself (lib/onsets.mjs)
      let strike = Number.isFinite(c.lastStrike) ? c.lastStrike : null;
      if (strike == null) {
        try {
          const w = readWav(file);
          const loc = findLastStrike(w.channels, w.sampleRate, body);
          if (loc != null) strike = +(c.start + loc).toFixed(3);
        } catch {}
      }
      const minGap = Number.isFinite(c.fadeAfterStrike) ? c.fadeAfterStrike : FADE_AFTER_STRIKE;
      let st = Math.max(0, body - c.fadeOut);
      let d = c.fadeOut;
      let ok = null;
      if (strike != null) {
        const earliest = strike - c.start + minGap;
        if (st < earliest) {
          st = earliest;
          d = body - st;
        }
        ok = d >= 0.3 - 1e-6;
        if (!ok) {
          d = 0.3;
          st = body - d;
        }
      } else console.warn(`  warn: ${c.id} fades out but has no lastStrike marker: cannot hold the fade ${minGap} s clear of the last chord`);
      f.push(`afade=t=out:st=${st.toFixed(4)}:d=${d.toFixed(4)}:curve=qsin`, `atrim=end=${body.toFixed(4)}`);
      used = Math.min(len, body);
      fade = { lastStrike: strike, fadeStart: +(c.start + st).toFixed(3), fadeDur: +d.toFixed(3), configured: c.fadeOut, afterStrike: strike != null ? +(c.start + st - strike).toFixed(3) : null, minAfterStrike: minGap, ok };
      if (strike != null) console.log(`  ${c.id}: last strike ${strike.toFixed(2)} s → fade ${fade.fadeStart.toFixed(2)}–${(fade.fadeStart + d).toFixed(2)} s (${fade.afterStrike.toFixed(2)} s after the strike${d < c.fadeOut - 1e-6 ? `; shortened from ${c.fadeOut} s` : ''})`);
    }
    if (len + 0.02 < body) console.warn(`  warn: ${c.id} render (${len.toFixed(2)} s) is shorter than its window (${body.toFixed(2)} s)`);
    f.push(`adelay=delays=${Math.round(c.start * SR)}S:all=1`);
    chains.push(`[${k}:a]${f.join(',')}[c${k}]`);
    (c.duck === false ? free : duck).push(`[c${k}]`);
    placed.push({ id: c.id, start: c.start, end: c.end, plays: +(used).toFixed(3), ringsTo: +(c.start + used).toFixed(3), gainDb: num(c.gainDb, 0), duck: c.duck !== false, file: rel(file), ...(fade ? { fade } : {}) });
  }
  const premix = path.join(tmp, 'premix.wav');
  const dryF = path.join(tmp, 'dry.f32');
  const wetF = path.join(tmp, 'wet.f32');
  const loDryF = path.join(tmp, 'lodry.f32');
  const loWetF = path.join(tmp, 'lowet.f32');
  const ASR = 8000;
  const mixIns = ['[voice]'];
  const outs = [];
  // duck settings: CLI flags > the first ducked cue's duck object ({ratio, attack, release, threshold, depthDb}) > defaults
  const duckCfg = (() => {
    const o = cues.find((c) => c.duck && typeof c.duck === 'object')?.duck || {};
    return {
      threshold: num(a['duck-threshold'], o.threshold ?? 0.025),
      ratio: num(a['duck-ratio'], o.ratio ?? 8),
      attack: num(a['duck-attack'], o.attack ?? 20),
      release: num(a['duck-release'], o.release ?? 500),
      targetDb: o.depthDb ?? 6,
    };
  })();
  // the duck stage: [dbus] (all ducked cues) compressed by the narration key; dry/wet copies feed duckDepth()
  const duckGraph = (thr, ratio) => [
    `[dbus]asplit=2[dbus1][dryA]`,
    `[dbus1][key0]sidechaincompress=threshold=${thr.toFixed(5)}:ratio=${ratio}:attack=${duckCfg.attack}:release=${duckCfg.release}:knee=4:makeup=1:link=maximum:detection=rms[ducked]`,
    `[ducked]asplit=2[ducked1][wetA]`,
    `[dryA]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[dryO]`,
    `[wetA]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[wetO]`,
  ];
  // the keyed low shelf: below SHELF_HZ the (already ducked) bus dips a further ~2-3 dB while the narrator speaks
  const shelfGraph = (thr, keyLabel, inLabel, outLabel) => [
    `[${inLabel}]acrossover=split=${SHELF_HZ}:order=4th[mlo][mhi]`,
    `[mlo]asplit=2[mlo1][loDry]`,
    `[mlo1][${keyLabel}]sidechaincompress=threshold=${thr.toFixed(5)}:ratio=${SHELF_RATIO}:attack=30:release=300:knee=4:makeup=1:link=maximum:detection=rms[mloK]`,
    `[mloK]asplit=2[mlo2][loWet]`,
    `[mlo2][mhi]amix=inputs=2:normalize=0[${outLabel}]`,
    `[loDry]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[loDryO]`,
    `[loWet]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[loWetO]`,
  ];
  // A cue's depthDb is a CEILING, not a hint: measure the duck the configured threshold/ratio actually produce
  // and, while it is more than 1 dB off the target, raise the threshold (bisection in dB) and, only if the
  // threshold runs out of room, lower the ratio. Too shallow a duck is pulled down the same way.
  let calibration = [];
  if (duck.length) {
    chains.push(`${duck.join('')}amix=inputs=${duck.length}:normalize=0:duration=longest,apad=whole_dur=${D},atrim=end=${D}[dbus]`);
    const head = [...chains];
    const measure = (thr, ratio) => {
      const g = [...head, ...duckGraph(thr, ratio), '[ducked1]anullsink', '[voice]anullsink', '[key1]anullsink', ...free.map((l) => `${l}anullsink`)];
      ff(['-y', '-v', 'error', ...inputs, '-filter_complex', g.join(';'), '-map', '[dryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', dryF, '-map', '[wetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', wetF]);
      const r = duckDepth(dryF, wetF, timeline, ASR);
      calibration.push({ threshold: +thr.toFixed(5), thresholdDb: +(20 * Math.log10(thr)).toFixed(2), ratio, depthDb: r.depthDb });
      return r.depthDb;
    };
    const T = duckCfg.targetDb;
    const TOL = 0.5; // review round 1: a 2.25 dB duck passed a 3 dB target; land within half a dB
    const inBand = (d) => d == null || Math.abs(d - T) <= TOL;
    let thrDb = 20 * Math.log10(duckCfg.threshold);
    let ratio = duckCfg.ratio;
    let d = measure(duckCfg.threshold, ratio);
    if (!inBand(d) && a['duck-threshold'] == null) {
      const MAX_DB = -6; // the narration key rarely exceeds this: a threshold here barely ducks at all
      const MIN_DB = -60;
      for (let pass = 0; pass < 3 && !inBand(d); pass++) {
        // bracket the target in threshold (depth falls as the threshold rises)
        let lo = thrDb;
        let hi = thrDb;
        let dLo = d;
        let dHi = d;
        if (d > T) {
          while (dHi > T + TOL && hi < MAX_DB) {
            lo = hi;
            dLo = dHi;
            hi = Math.min(MAX_DB, hi + 6);
            dHi = measure(10 ** (hi / 20), ratio);
          }
        } else {
          while (dLo < T - TOL && lo > MIN_DB) {
            hi = lo;
            dHi = dLo;
            lo = Math.max(MIN_DB, lo - 6);
            dLo = measure(10 ** (lo / 20), ratio);
          }
        }
        if (inBand(dHi)) [thrDb, d] = [hi, dHi];
        else if (inBand(dLo)) [thrDb, d] = [lo, dLo];
        else if (dLo >= T && dHi <= T) {
          for (let k = 0; k < 6; k++) {
            const mid = (lo + hi) / 2;
            const dm = measure(10 ** (mid / 20), ratio);
            [thrDb, d] = [mid, dm];
            if (inBand(dm)) break;
            if (dm > T) lo = mid;
            else hi = mid;
          }
        } else [thrDb, d] = d > T ? [hi, dHi] : [lo, dLo];
        if (inBand(d)) break;
        if (d > T + TOL && ratio > 1.5) {
          ratio = +Math.max(1.5, 1 + (ratio - 1) / 2).toFixed(2); // the threshold ran out of room: gentler ratio
          d = measure(10 ** (thrDb / 20), ratio);
        } else break;
      }
    }
    duckCfg.applied = { threshold: +(10 ** (thrDb / 20)).toFixed(5), thresholdDb: +thrDb.toFixed(2), ratio, depthDb: d, calibrated: calibration.length > 1 };
    if (!inBand(d)) console.warn(`  warn: duck calibration could not reach ${T} ±${TOL} dB (got ${d} dB at ${thrDb.toFixed(1)} dBFS, ratio ${ratio})`);
    else if (calibration.length > 1) console.log(`  duck: calibrated ${calibration[0].depthDb} → ${d} dB (target ${T}): threshold ${calibration[0].thresholdDb} → ${thrDb.toFixed(1)} dBFS, ratio ${duckCfg.ratio} → ${ratio}`);
    chains.push(...duckGraph(10 ** (thrDb / 20), ratio), ...shelfGraph(10 ** (thrDb / 20), 'key1', 'ducked1', 'dbusEq'));
    mixIns.push('[dbusEq]');
    outs.push(['-map', '[dryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', dryF], ['-map', '[wetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', wetF], ['-map', '[loDryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', loDryF], ['-map', '[loWetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', loWetF]);
  } else chains.push('[key0]anullsink', '[key1]anullsink');
  if (free.length) {
    chains.push(`${free.join('')}amix=inputs=${free.length}:normalize=0:duration=longest,lowshelf=f=${SHELF_HZ}:g=-2.5[fbus]`); // undducked cues: a static shelf
    mixIns.push('[fbus]');
  }
  chains.push(`${mixIns.join('')}amix=inputs=${mixIns.length}:normalize=0:duration=first,apad=whole_dur=${D},atrim=end=${D}[mix]`);
  ff(['-y', '-v', 'error', ...inputs, '-filter_complex', chains.join(';'), '-map', '[mix]', '-c:a', 'pcm_f32le', '-ar', String(SR), premix, ...outs.flat()]);

  // Master loudness by ONE constant gain (linear normalisation; no dynamic loudnorm pumping). If that gain would
  // push true peak past the ceiling, a transparent look-ahead limiter takes the overshoot and the gain is
  // re-solved so the limited master still lands on the target. The limiter's reduction is reported (QA warns > 2 dB).
  mkdirp(P.mix.dir);
  const m = loudnormMeasure(premix, TARGET);
  const inI = Number(m.input_i);
  const inTP = Number(m.input_tp);
  let gain = TARGET.I - inI;
  let preLimit = null;
  let normalization = 'linear';
  const lim = TARGET.TP - 0.7; // sample-peak ceiling; true peak overshoots it by a few tenths at most
  // the room-tone floor, calibrated once: pink noise, 2.5 kHz high-pass, decorrelated channels, at FLOOR_LUFS
  const floor = roomTone(tmp, D);
  const render = (g, limit) =>
    ff(['-y', '-v', 'error', '-i', premix, '-i', floor.file, '-filter_complex', `[0:a]volume=${g.toFixed(3)}dB${limit ? `,alimiter=limit=${(10 ** (lim / 20)).toFixed(5)}:attack=3:release=80:level=0:latency=1` : ''},aresample=${SR}[m];[m][1:a]amix=inputs=2:normalize=0:duration=first[out]`, '-map', '[out]', '-ar', String(SR), '-c:a', 'pcm_s24le', P.mix.master]);
  if (inTP + gain <= TARGET.TP - 0.2) render(gain, false);
  else {
    normalization = 'linear+limit';
    for (let k = 0; k < 4; k++) {
      render(gain, true);
      const got = loudness(P.mix.master).I;
      if (!Number.isFinite(got) || Math.abs(TARGET.I - got) <= 0.1) break;
      gain += TARGET.I - got;
    }
    preLimit = { gainDb: +gain.toFixed(2), limitDbfs: lim, reductionDb: +Math.max(0, inTP + gain - lim).toFixed(2) };
    if (preLimit.reductionDb > 2) console.warn(`  warn: the master limiter takes ${preLimit.reductionDb} dB off the peaks (> 2 dB): lower the music or check the stem`);
  }
  const pass2 = { normalization_type: normalization };
  const final = loudness(P.mix.master);
  const masterDur = mediaDuration(P.mix.master);
  const duckRes = duck.length ? duckDepth(dryF, wetF, timeline, ASR) : { depthDb: null, speechSecondsUnderMusic: 0 };
  const shelfRes = duck.length ? duckDepth(loDryF, loWetF, timeline, ASR) : { depthDb: null };
  const musicEq = { highpassHz: HPF_HZ, highpassSlope: '24 dB/oct', shelfHz: SHELF_HZ, shelfRatio: SHELF_RATIO, keyed: duck.length > 0, lowBandReductionUnderSpeechDb: shelfRes.depthDb };
  if (shelfRes.depthDb != null) console.log(`  music EQ: ${HPF_HZ} Hz HPF 24 dB/oct; keyed shelf below ${SHELF_HZ} Hz takes ${shelfRes.depthDb} dB more off the low band under speech`);
  // momentary loudness map of the master: each line's loudest 400 ms window, and the loudest windows with no
  // speech in them (the music's own peaks: a score's climax should be the top one)
  const moments = (() => {
    const M = momentary(P.mix.master);
    const spans = timeline.shots.flatMap((s) => s.lines.map((l) => ({ id: l.id, a: s.start + l.start, b: s.start + l.end })));
    const lineOf = (t) => spans.find((x) => t > x.a && t - 0.4 < x.b)?.id ?? null;
    const lines = {};
    const free = [];
    for (const { t, M: m } of M) {
      const id = lineOf(t);
      if (id) {
        if (!lines[id] || m > lines[id].M) lines[id] = { M: +m.toFixed(1), at: +t.toFixed(2) };
      } else free.push({ M: +m.toFixed(1), at: +t.toFixed(2) });
    }
    free.sort((x, y) => y.M - x.M);
    const top = [];
    for (const f of free) if (top.length < 5 && top.every((q) => Math.abs(q.at - f.at) > 1)) top.push(f);
    return { lines, nonSpeech: top };
  })();

  // speech-to-music ratio per line (review round 1: music within ~5 dB of 'None came', on 'Fair credit' and under
  // the thesis line): each line's window, gated loudness of the voice alone (stem + the master gain) against the
  // master's; the music's share is the difference in power. QA mix.lineMasking warns under 10 dB, fails under 6.
  const lineMasking = (() => {
    const spans = lineSpans(timeline);
    const voice = spanLoudness(P.narration.wav, spans);
    const all = spanLoudness(P.mix.master, spans);
    const out = {};
    for (const sp of spans) {
      const v = voice[sp.id] + gain;
      const pAll = 10 ** (all[sp.id] / 10);
      const pV = 10 ** (v / 10);
      const music = pAll > pV * 1.0001 ? 10 * Math.log10(pAll - pV) : -Infinity;
      out[sp.id] = Number.isFinite(music) ? +(v - music).toFixed(1) : 99;
    }
    return out;
  })();
  const masked = Object.entries(lineMasking).filter(([, d]) => d < 10).sort((x, y) => x[1] - y[1]);
  if (masked.length) console.log(`  speech-to-music under 10 dB: ${masked.slice(0, 12).map(([k, d]) => `${k} ${d}`).join(', ')}`);

  // chapter slices
  const chapters = [];
  if (a.chapters !== false) {
    mkdirp(P.mix.chapters);
    for (const ch of timeline.chapters) {
      const dur = ch.end - ch.start;
      const kbps = Math.max(64, Math.min(192, Math.floor((MAX_SLICE * 8 * 0.9) / dur / 1000)));
      const out = path.join(P.mix.chapters, `${ch.number}.m4a`);
      ff(['-y', '-v', 'error', '-i', P.mix.master, '-ss', ch.start.toFixed(4), '-to', ch.end.toFixed(4), '-c:a', 'aac', '-b:a', `${kbps}k`, '-movflags', '+faststart', out]);
      const bytes = fs.statSync(out).size;
      chapters.push({ number: ch.number, id: ch.id, file: rel(out), start: ch.start, end: ch.end, kbps, bytes, ok: bytes < MAX_SLICE });
    }
  }
  const report = {
    at: new Date().toISOString(),
    target: TARGET,
    master: { file: rel(P.mix.master), duration: +masterDur.toFixed(4), I: final.I, LRA: final.LRA, TP: final.TP },
    checks: {
      loudness: Math.abs(final.I - TARGET.I) <= 0.5,
      truePeak: final.TP <= TARGET.TP + 0.1,
      length: Math.abs(masterDur - D) <= 0.01,
      // depthDb is a ceiling: calibration lands within 1 dB; more than 1.5 dB over (or under) the target fails
      duck: duckRes.depthDb == null || Math.abs(duckRes.depthDb - duckCfg.targetDb) <= 1.5,
      // never digital zero: the quietest 400 ms window of the master stays above -70 LUFS (the floor sits near -58)
      floor: minMomentary(P.mix.master) > -70,
      chapters: chapters.every((c) => c.ok),
      // a fading cue's last strike rings at least FADE_AFTER_STRIKE s before its fade starts (cues without a marker: null = unverified)
      fadeAfterStrike: placed.every((p) => !p.fade || p.fade.ok !== false),
    },
    loudnorm: { input: { I: +m.input_i, TP: +m.input_tp, LRA: +m.input_lra, thresh: +m.input_thresh }, gainDb: +gain.toFixed(2), normalization: pass2.normalization_type ?? null, preLimit },
    duck: { ...duckRes, ...duckCfg, calibration },
    musicEq,
    floor: { lufs: FLOOR_LUFS, kind: 'pink noise, highpass 2.5 kHz, decorrelated L/R (tape hiss / room tone), added after the master gain', measuredLufs: floor.lufs, minMomentary: minMomentary(P.mix.master) },
    narration: readJson(P.narration.stem, null),
    moments,
    lineMasking,
    cues: placed,
    chapters,
  };
  writeJson(P.mix.loudness, report);
  if (!a['keep-temp']) fs.rmSync(tmp, { recursive: true, force: true });
  const ok = Object.values(report.checks).every(Boolean);
  console.log(
    `master ${rel(P.mix.master)}: ${masterDur.toFixed(2)} s, ${final.I} LUFS, TP ${final.TP} dBTP, LRA ${final.LRA} (${report.loudnorm.normalization ?? '?'})` +
      `; ${placed.length} cues${duckRes.depthDb != null ? `, duck ${duckRes.depthDb} dB` : ''}; ${chapters.length} chapter slices${ok ? '' : ' — CHECKS FAILED: ' + Object.entries(report.checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`,
  );
  stageDone(P, 'mix', { ok, checks: report.checks, master: report.master, duckDb: duckRes.depthDb, outputs: [rel(P.mix.master), rel(P.mix.loudness), ...chapters.map((c) => c.file)] });
  if (!ok) process.exitCode = 1;
}

main().catch((e) => {
  try {
    stageFailed(P, 'mix', e);
  } catch {}
  console.error(`error: ${e.message}`);
  process.exit(1);
});
