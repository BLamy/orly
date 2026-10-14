#!/usr/bin/env node
// Stage 5 — score rendering. Drives strudel.cc's own "Export to WAV" (OfflineAudioContext) in headless Chromium.
//
//   npm run film:score -- render  --slug <slug> (--cue m01[,m02] | --all) [--force] [--tail 6]
//   npm run film:score -- analyze --slug <slug> [--cue ids | --all]
//   npm run film:score -- file    --code cue.strudel (--cycles N | --seconds S) --out cue.wav [--tail 6] [--no-clip] [--analyze]
//   (also: `score.mjs --code f --cycles N --out f.wav` without a subcommand)
//
// Cues come from films/<slug>/score/cues.json (MusicCue[] in contracts.ts; `file`/`render` paths are
// relative to the film dir). A cue renders (end - start) seconds of body plus --tail (or cue.tail,
// default 6 s) of pure decay: onsets are clipped with filterWhen(t < bodyCycles) and the export runs
// whole cycles; the WAV is trimmed to body + tail. Sample 0 = cycle 0. 48 kHz stereo s24.
// `render` skips a cue whose source hash (code, length, tail, sample rate) is unchanged unless --force;
// each render is followed by analysis: score/analysis/<id>.json (duration vs expected, EBU R128 I/LRA,
// true peak) and <id>.png (log-frequency spectrogram) — Read the PNG when composing. Whenever a cue's analysis
// is (re)written, score/analysis/summary.json is rebuilt from every cue's analysis file and stamped with the
// clock; analysis also finds the onset of the cue's final chord or note (lib/onsets.mjs) and writes it to cues.json
// as lastStrike (absolute seconds, lastStrikeFrom "analysis"; a composer's own marker is kept). Also
// clock it was measured against (timelineSeconds = narration/timeline.json duration); film:qa fails a summary
// whose cueSeconds or clock disagree with cues.json / the timeline (review round 4: it kept reporting a stale clock).
//
// Recipe (docs/film/research/strudel-music-backend.md): open strudel.cc, await strudelMirror.prebaked,
// send a REAL gesture (mouse click + key press; Strudel defers audio init and repl.evaluate never resolves
// without one), setCode + evaluate(code, false), clip, Export tab: start 0, end ceil((body+tail)·cps),
// 48000 Hz, polyphony 1024, "Export to WAV"; the init script tees the rendered AudioBuffer.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, list, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, sha, rel, mkdirp, resolveIn } from './lib/paths.mjs';
import { updateStage } from './lib/ledger.mjs';
import { launchChromium } from './lib/browser.mjs';
import { writeWav } from './lib/wav.mjs';
import { loudness, mediaDuration, spectrogram } from './lib/ffmpeg.mjs';
import { readWav } from './lib/wav.mjs';
import { lastStrike as findLastStrike } from './lib/onsets.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INJECT = path.join(HERE, 'score', 'strudel-inject.js');
const HELP = await helpText(import.meta.url);

const a = parseArgs(process.argv.slice(2), {
  boolean: ['force', 'all', 'clip', 'analyze', 'verbose', 'help'],
  string: ['slug', 'dir', 'cue', 'cues', 'code', 'cycles', 'seconds', 'out', 'tail', 'sr', 'maxpoly', 'timeout', 'url', 'format'],
  default: { clip: true },
});
const cmd = a._[0] ?? (a.code ? 'file' : null);
const SR = num(a.sr, 48000);
const URL0 = a.url || process.env.STRUDEL_URL || 'https://strudel.cc/';
const log = (...m) => a.verbose && console.error('[score]', ...m);

// ------------------------------------------------------------------ the strudel.cc driver
async function pullChannel(page, expr, length) {
  const out = new Float32Array(length);
  const CH = 2 ** 21;
  for (let off = 0; off < length; off += CH) {
    const n = Math.min(CH, length - off);
    const b64 = await page.evaluate(
      async ({ expr, off, n }) => {
        const arr = eval(expr); // eslint-disable-line no-eval
        const view = new Uint8Array(arr.buffer, arr.byteOffset + off * 4, n * 4);
        const url = await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(new Blob([view]));
        });
        return url.slice(url.indexOf(',') + 1);
      },
      { expr, off, n },
    );
    const bytes = Buffer.from(b64, 'base64');
    out.set(new Float32Array(bytes.buffer, bytes.byteOffset, n), off);
  }
  return out;
}

/** Render Strudel code. len: { seconds } | { cycles }. Returns { channels, sampleRate, report }. */
export async function renderStrudel(browser, code, len, { tail = 6, clip = true, sr = 48000, maxpoly = 1024, timeout = 600, url = URL0 } = {}) {
  const T0 = Date.now();
  const report = { url };
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  try {
    await context.addInitScript({ path: INJECT });
    const page = await context.newPage();
    page.setDefaultTimeout(timeout * 1000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`.slice(0, 300)));
    page.on('console', (m) => {
      const t = m.text();
      log(t.slice(0, 200));
      if (/error|fail|not found/i.test(t)) errors.push(t.slice(0, 300));
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window.strudelMirror?.repl && window.strudelMirror.prebaked));
    await page.evaluate(() => window.strudelMirror.prebaked);
    report.prebakedMs = Date.now() - T0;
    // the verified fix: a real gesture, or repl.evaluate never resolves
    await page.mouse.click(400, 400);
    await page.keyboard.press('Shift');
    await page.waitForFunction(() => window.__strudelCapture?.contexts?.length > 0, null, { timeout: 15000 }).catch(() => log('no AudioContext after gesture (continuing)'));
    const ev = await page.evaluate(async (code) => {
      const m = window.strudelMirror;
      m.setCode(code);
      await m.repl.evaluate(code, false);
      const st = m.repl.state;
      return { error: st.evalError ? String(st.evalError.message || st.evalError) : null, cps: m.repl.scheduler.cps, hasPattern: !!st.pattern };
    }, code);
    if (ev.error || !ev.hasPattern) throw new Error(`strudel evaluation failed: ${ev.error ?? 'no pattern'}`);
    const cps = ev.cps;
    const bodyCycles = len.cycles ?? len.seconds * cps;
    const bodySeconds = bodyCycles / cps;
    const totalSeconds = bodySeconds + tail;
    const renderCycles = Math.ceil(totalSeconds * cps - 1e-9);
    const expectLength = Math.round((renderCycles / cps) * sr);
    Object.assign(report, { cps, cpm: cps * 60, bodyCycles: +bodyCycles.toFixed(6), bodySeconds: +bodySeconds.toFixed(6), tailSeconds: tail, renderCycles });
    if (clip) {
      // The Export panel re-evaluates the editor code, so patching repl.state.pattern is not enough:
      // put the clip into the code itself (all() applies to every $: pattern), then re-evaluate.
      const clipped = `${code}\n\n// film pipeline: no onsets after the body, so the tail is pure decay\nall(x => x.filterWhen(t => t < ${bodyCycles}))\n`;
      const ev2 = await page.evaluate(async (c) => {
        const m = window.strudelMirror;
        m.setCode(c);
        await m.repl.evaluate(c, false);
        const st = m.repl.state;
        return { error: st.evalError ? String(st.evalError.message || st.evalError) : null, cps: m.repl.scheduler.cps };
      }, clipped);
      if (ev2.error) throw new Error(`strudel evaluation (clipped) failed: ${ev2.error}`);
      if (Math.abs(ev2.cps - cps) > 1e-9) throw new Error(`cps changed after clipping (${cps} -> ${ev2.cps})`);
    }
    const t0 = Date.now();
    await page.getByRole('button', { name: 'export', exact: true }).click();
    const nums = page.locator('input[type=number]');
    await nums.nth(0).fill('0');
    await nums.nth(1).fill(String(renderCycles));
    await nums.nth(2).fill(String(sr));
    await nums.nth(3).fill(String(maxpoly));
    await page.getByRole('button', { name: 'Export to WAV' }).click();
    const h = await page.waitForFunction(
      (len) => {
        const o = window.__strudelCapture.offline;
        const i = o.findIndex((x) => Math.abs(x.length - len) <= 2);
        if (i >= 0) return o[i].error ? { error: o[i].error } : { i };
        return false;
      },
      expectLength,
      { polling: 250 },
    );
    const found = await h.jsonValue();
    if (found.error) throw new Error(`offline render failed: ${found.error}`);
    report.renderMs = Date.now() - t0;
    const meta = await page.evaluate((i) => {
      const o = window.__strudelCapture.offline[i];
      window.__pull = [o.buffer.getChannelData(0), o.buffer.getChannelData(o.buffer.numberOfChannels > 1 ? 1 : 0)];
      return { length: o.length, sampleRate: o.sampleRate, ms: o.ms };
    }, found.i);
    const keep = Math.round(totalSeconds * meta.sampleRate);
    let channels = [await pullChannel(page, 'window.__pull[0]', meta.length), await pullChannel(page, 'window.__pull[1]', meta.length)];
    channels = channels.map((c) => c.subarray(0, Math.min(keep, c.length)));
    // 20 ms safety fade at the very end (the tail should already be silent)
    const f = Math.min(Math.round(0.02 * meta.sampleRate), channels[0].length);
    for (const c of channels) for (let i = 0; i < f; i++) c[c.length - 1 - i] *= i / f;
    report.speedX = +((renderCycles / cps) / (report.renderMs / 1000)).toFixed(2);
    report.errors = errors.slice(0, 10);
    report.totalMs = Date.now() - T0;
    return { channels, sampleRate: meta.sampleRate, report };
  } finally {
    await context.close();
  }
}

/** Console errors that mean the render lost notes (strudel logs them with %c styling). */
export function renderFailures(errors = []) {
  return [...new Set((errors || []).filter((e) => /soundfont zone|\[webaudio\] error|sample not found|could not load/i.test(e)).map((e) => e.replace(/%c/g, '').replace(/\s*(background-)?color:.*$/, '').trim()))];
}

function stats(channels, sr) {
  let peak = 0;
  let first = -1;
  for (const ch of channels)
    for (let i = 0; i < ch.length; i++) {
      const v = Math.abs(ch[i]);
      if (v > peak) peak = v;
      if (v > 1e-4 && (first < 0 || i < first)) first = i;
    }
  return { peakDb: +(20 * Math.log10(peak || 1e-12)).toFixed(2), firstSoundMs: first >= 0 ? +((first / sr) * 1000).toFixed(1) : null, frames: channels[0].length, seconds: +(channels[0].length / sr).toFixed(4) };
}

export function analyzeFile(wav, { png, expectedSeconds } = {}) {
  const L = loudness(wav);
  const duration = mediaDuration(wav);
  if (png) spectrogram(wav, png);
  const r = { file: rel(wav), duration: +duration.toFixed(4), I: L.I, LRA: L.LRA, TP: L.TP };
  if (expectedSeconds != null) {
    r.expected = +expectedSeconds.toFixed(4);
    r.lengthErrorMs = +((duration - expectedSeconds) * 1000).toFixed(1);
    r.lengthOk = Math.abs(duration - expectedSeconds) <= 0.005;
  }
  if (png) r.spectrogram = rel(png);
  return r;
}

// ------------------------------------------------------------------ film cues
function loadCues(P) {
  const j = readJson(P.score.cues);
  const cues = Array.isArray(j) ? j : j.cues;
  if (!Array.isArray(cues)) throw new Error('score/cues.json must be MusicCue[] (or { cues: [] })');
  return cues;
}
const cueTail = (c) => num(a.tail, c.tail ?? 6);
const cueSrc = (P, c) => resolveIn(P, c.file || `score/cues/${c.id}.strudel`);
const cueWav = (P, c) => resolveIn(P, c.render || `score/renders/${c.id}.wav`);

function pick(cues) {
  const ids = [...list(a.cue), ...list(a.cues)];
  if (!ids.length && !a.all) die('choose cues with --cue id[,id] or --all');
  if (!ids.length) return cues;
  const sel = cues.filter((c) => ids.includes(c.id));
  for (const id of ids) if (!sel.some((c) => c.id === id)) die(`cue ${id} is not in score/cues.json`);
  return sel;
}

function analyzeCue(P, c) {
  const wav = cueWav(P, c);
  if (!fs.existsSync(wav)) return { id: c.id, error: 'not rendered' };
  mkdirp(P.score.analysis);
  const meta = readJson(wav.replace(/\.wav$/, '.json'), {});
  const expected = meta.bodySeconds != null ? meta.bodySeconds + meta.tailSeconds : c.end - c.start + cueTail(c);
  const r = { id: c.id, start: c.start, end: c.end, ...analyzeFile(wav, { png: path.join(P.score.analysis, `${c.id}.png`), expectedSeconds: expected }), cueSeconds: +(c.end - c.start).toFixed(4), cps: meta.cps };
  // the onset of the cue's final chord or note inside its body: cues.json lastStrike (absolute film seconds), so the
  // mixer holds the fade-out clear of it (QA mix.fadeAfterStrike). A composer's own marker (lastStrikeFrom absent or
  // not 'analysis') is kept; an analysed one is refreshed with every render and every window move.
  try {
    const { channels, sampleRate } = readWav(wav);
    const body = meta.bodySeconds ?? c.end - c.start;
    const local = findLastStrike(channels, sampleRate, body);
    if (local != null) {
      r.lastStrikeLocal = local;
      r.lastStrike = +(c.start + local).toFixed(3);
      setLastStrike(P, c.id, r.lastStrike);
    }
  } catch (e) {
    r.lastStrikeError = String(e.message || e);
  }
  writeJson(path.join(P.score.analysis, `${c.id}.json`), r);
  writeSummary(P);
  return r;
}

/** write an analysed lastStrike into cues.json unless the composer set one by hand */
function setLastStrike(P, id, t) {
  const j = readJson(P.score.cues);
  const cues = Array.isArray(j) ? j : j.cues;
  const c = cues.find((x) => x.id === id);
  if (!c || (c.lastStrike != null && c.lastStrikeFrom !== 'analysis')) return;
  if (c.lastStrike === t && c.lastStrikeFrom === 'analysis') return;
  c.lastStrike = t;
  c.lastStrikeFrom = 'analysis';
  writeJson(P.score.cues, j);
}

/** rebuild score/analysis/summary.json from every cue's analysis file (never a partial or stale copy) */
function writeSummary(P) {
  const all = loadCues(P);
  const rows = all.map((c) => readJson(path.join(P.score.analysis, `${c.id}.json`), null) ?? { id: c.id, error: 'not analysed' });
  const sorted = [...all].sort((x, y) => x.start - y.start);
  const joins = sorted.slice(1).map((c, i) => ({ from: sorted[i].id, to: c.id, overlap: +(sorted[i].end - c.start).toFixed(3) }));
  const tl = readJson(P.narration.timeline, null);
  const summary = {
    at: new Date().toISOString(),
    timelineSeconds: tl?.duration ?? null,
    cues: rows,
    joins,
    musicSeconds: +all.reduce((s, c) => s + (c.end - c.start), 0).toFixed(2),
  };
  mkdirp(P.score.analysis);
  writeJson(path.join(P.score.analysis, 'summary.json'), summary);
  return summary;
}

async function cmdRender() {
  const P = filmPaths(a.slug, { dir: a.dir });
  const cues = pick(loadCues(P));
  let browser = null;
  const results = [];
  try {
    for (const c of cues) {
      const src = cueSrc(P, c);
      if (!fs.existsSync(src)) {
        results.push({ id: c.id, error: `missing ${rel(src)}` });
        console.error(`  ${c.id}: missing ${rel(src)}`);
        continue;
      }
      const code = fs.readFileSync(src, 'utf8');
      const seconds = c.end - c.start;
      if (!(seconds > 0)) throw new Error(`cue ${c.id}: end must be after start`);
      const tail = cueTail(c);
      const hash = sha({ v: 1, code, seconds: +seconds.toFixed(6), tail, sr: SR, clip: a.clip !== false, url: URL0 });
      const wav = cueWav(P, c);
      const metaFile = wav.replace(/\.wav$/, '.json');
      const prev = readJson(metaFile, null);
      if (!a.force && prev?.sourceHash === hash && fs.existsSync(wav) && !renderFailures(prev.errors).length) {
        console.log(`  ${c.id}: unchanged (${prev.seconds}s) — skipped`);
        results.push({ id: c.id, skipped: true, ...analyzeCue(P, c) });
        continue;
      }
      browser ??= await launchChromium({ audio: true });
      const t0 = Date.now();
      const { channels, sampleRate, report } = await renderStrudel(browser, code, { seconds }, { tail, clip: a.clip !== false, sr: SR, timeout: num(a.timeout, 600) });
      const { clipped } = writeWav(wav, channels, sampleRate, 's24');
      const meta = { id: c.id, sourceHash: hash, source: rel(src), renderedAt: new Date().toISOString(), sampleRate, clippedSamples: clipped, ...report, ...stats(channels, sampleRate) };
      writeJson(metaFile, meta);
      const an = analyzeCue(P, c);
      // a dropped note is a broken render, not a warning: e.g. '[webaudio] error: no soundfont zone found for
      // preset' means a GM soundfont voice was asked for a note outside its sample zones and played nothing
      const fatal = renderFailures(report.errors);
      if (fatal.length) {
        results.push({ ...an, id: c.id, error: `render errors (notes dropped): ${fatal.join(' | ')}` });
        console.error(`  ${c.id}: RENDER FAILED — ${fatal.join(' | ')} (render each $: layer alone to find the voice, move the note into its range)`);
        continue;
      }
      results.push({ ...an, renderMs: Date.now() - t0, clipped });
      console.log(`  ${c.id}: ${meta.seconds}s (body ${meta.bodySeconds.toFixed(2)} + tail ${tail}) cps ${meta.cps.toFixed(4)} · ${an.I} LUFS · TP ${an.TP} dBTP · ${meta.speedX}× realtime${clipped ? ` · ${clipped} CLIPPED samples` : ''}${an.lengthOk ? '' : ` · LENGTH OFF ${an.lengthErrorMs} ms`}`);
    }
  } finally {
    await browser?.close();
  }
  updateStage(P, 'score-render', { at: new Date().toISOString(), cues: results.map((r) => ({ id: r.id, ok: !r.error, I: r.I, TP: r.TP, duration: r.duration })) });
  if (results.some((r) => r.error)) process.exitCode = 1;
}

function cmdAnalyze() {
  const P = filmPaths(a.slug, { dir: a.dir });
  const all = loadCues(P);
  const cues = list(a.cue).length || list(a.cues).length || a.all ? pick(all) : all;
  const rows = cues.map((c) => analyzeCue(P, c));
  // analyzeCue rewrote summary.json (every cue's analysis, overlaps / gaps between consecutive cues, the clock)
  writeSummary(P);
  for (const r of rows) console.log(r.error ? `  ${r.id}: ${r.error}` : `  ${r.id}: ${r.duration}s (${r.lengthOk ? 'length ok' : `length off ${r.lengthErrorMs} ms`}) · I ${r.I} LUFS · LRA ${r.LRA} · TP ${r.TP} dBTP → ${r.spectrogram}`);
  console.log(`→ ${rel(path.join(P.score.analysis, 'summary.json'))}`);
}

async function cmdFile() {
  if (!a.code || !a.out || (!a.cycles && !a.seconds)) die('usage: score.mjs file --code f.strudel (--cycles N | --seconds S) --out f.wav [--tail 6]');
  const code = fs.readFileSync(a.code, 'utf8');
  const browser = await launchChromium({ audio: true });
  try {
    const len = a.cycles ? { cycles: Number(a.cycles) } : { seconds: Number(a.seconds) };
    const { channels, sampleRate, report } = await renderStrudel(browser, code, len, { tail: num(a.tail, 6), clip: a.clip !== false, sr: SR, timeout: num(a.timeout, 600) });
    const { clipped } = writeWav(a.out, channels, sampleRate, a.format || 's24');
    const out = { out: a.out, sampleRate, clippedSamples: clipped, ...report, ...stats(channels, sampleRate) };
    if (a.analyze) Object.assign(out, analyzeFile(a.out, { png: a.out.replace(/\.wav$/i, '') + '.png', expectedSeconds: report.bodySeconds + report.tailSeconds }));
    console.log(JSON.stringify(out, null, 2));
  } finally {
    await browser.close();
  }
}

if (a.help || !cmd) {
  console.log(HELP);
  process.exit(a.help ? 0 : 2);
}
const run = { render: cmdRender, analyze: cmdAnalyze, file: cmdFile }[cmd];
if (!run) die(`unknown subcommand ${cmd} (render | analyze | file)`);
if (cmd !== 'file' && !a.slug) die(`${cmd} needs --slug`);
Promise.resolve(run()).catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
