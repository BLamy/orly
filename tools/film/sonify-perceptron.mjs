#!/usr/bin/env node
// Sonify the Mark I perceptron learning, from the SAME training record the picture animates.
//
//   node tools/film/sonify-perceptron.mjs [--slug neural-net-history] [--shot ch03-s04] [--cue m03] [--dry]
//
// The shot (apps/bookshelf/src/viz/films/<slug>/shots/<shot>.tsx) scrubs PERCEPTRON_RUN (the kit's real training
// record: seed 1958, 120 presentations, horizontal vs vertical bars) with a piecewise-linear `step(t)` anchored
// on its script beats. This tool rebuilds that schedule from narration/timeline.json, inverts it to find when
// each presentation lands, is judged and has its knobs turned, and writes a Strudel block into the cue between
//   // <sonify:perceptron>  …  // </sonify:perceptron>
// using the cue's own line([t, dur, note, vel, opts]) helper (absolute film seconds). Re-run it whenever the
// shot's timing or the clock moves; the block is regenerated wholesale.
//
// What you hear (every sound is a fact of the training run; the machine CLACKS, it never chimes — user direction):
//   the eye     a relay clack per presentation (909 rimshot + armature thump); at speed, the machine's clatter
//   a mistake   the motors: only the LIT knobs turn (Δw = η·target·a): a ratchet of detent clicks, one per lit
//               knob, whose resonance sweeps UP toward "horizontal" (+1) and DOWN toward "vertical" (−1). A right
//               answer changes nothing, so it makes no sound: learning is heard as the ratchets falling silent.
//   the error   an organ pad whose voicing follows the mistakes in the last 20 presentations: a dissonant
//   rate        cluster while it guesses, resolving step by step to C major as the errors fall to zero
//   the hold    "You could hear it learn": the late mistake's lit knobs click one notch each (three detents), one
//               by one in the gaps between words, each detent's resonance set by its LEARNED weight
//   then        the response relay latches (clack, thump) over a soft C major (it learned)
// Under speech everything stays high and thin (review note: whirrs under a line high-passed above 2.5 kHz,
// no low motor tone); the low motor tone only sounds in the clear.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const SLUG = arg('slug', 'neural-net-history');
const SHOT = arg('shot', 'ch03-s04');
const CUE = arg('cue', 'm03');
const DRY = argv.includes('--dry');
const FILM = path.join(ROOT, 'films', SLUG);
const BEGIN = '// <sonify:perceptron>';
const END = '// </sonify:perceptron>';

// ---------------------------------------------------------------- the training record (bundled from the kit)
async function loadRun() {
  const src = path.join(ROOT, 'apps/bookshelf/src/viz/film/silhouette/metaphors/perceptronMath.ts');
  const out = path.join(os.tmpdir(), `perceptronMath-${process.pid}.mjs`);
  execFileSync(path.join(ROOT, 'node_modules/.bin/esbuild'), [src, '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error']);
  const m = await import(pathToFileURL(out).href);
  fs.rmSync(out, { force: true });
  return m;
}
const { PERCEPTRON_RUN: RUN, N_A } = await loadRun();

// ---------------------------------------------------------------- the clock
const timeline = JSON.parse(fs.readFileSync(path.join(FILM, 'narration/timeline.json'), 'utf8'));
const shot = timeline.shots.find((s) => s.id === SHOT);
if (!shot) throw new Error(`shot ${SHOT} not in timeline`);
const A = (t) => shot.start + t; // shot-local -> absolute film seconds
const b = shot.beats;
for (const k of ['wrong', 'turn', 'hear']) if (typeof b[k] !== 'number') throw new Error(`beat ${k} missing on ${SHOT}`);
const words = shot.lines.flatMap((l) => l.words.map((w) => ({ w: w.w ?? w.word ?? w.text, a: A(w.start), z: A(w.end) })));
const lineEnd = (id) => A(shot.lines.find((l) => l.id === id).end);
const LAST = shot.lines.at(-1).id;
/** true if [t0, t1] touches a spoken word (with a small guard). A pause between two words of one line that is
 *  shorter than a breath (0.45 s) counts as speech: critic round 1 (2026-10-13) measured the clatter placed in
 *  L0308's micro-gaps ('turned | a little | toward the answer') ringing onto the words ('little' 1.8 dB clear in
 *  1-4 kHz, 'toward' 3.0, 'answer' 4.7). The machine is heard at full level only from the breath after the line. */
const BREATH = 0.45;
const spans = shot.lines.flatMap((l) => {
  const ws = l.words.map((w) => [A(w.start), A(w.end)]);
  const out = [];
  for (const [a, z] of ws) {
    if (out.length && a - out.at(-1)[1] < BREATH) out.at(-1)[1] = z;
    else out.push([a, z]);
  }
  return out;
});
const underSpeech = (t0, t1 = t0) => spans.some(([a, z]) => t1 > a - 0.06 && t0 < z + 0.06);

// ---------------------------------------------------------------- the shot's step(t) schedule (mirrors the shot)
// KEEP IN SYNC with apps/bookshelf/src/viz/films/<slug>/shots/ch03-s04.tsx build(): `const step = linear([...])`
const HOLD = (() => {
  for (let i = 80; i < RUN.steps.length; i++) if (RUN.steps[i].error && RUN.steps[i].recentErrors <= 1) return i;
  return 16;
})();
const s0 = 1;
const PTS = [
  [b.wrong - 0.95, s0 + 0.0],
  [b.wrong + 0.1, s0 + 0.62],
  [b.turn - 0.2, s0 + 0.665],
  [b.turn + 0.45, s0 + 0.97],
  [b.turn + 0.5, s0 + 1.0],
  [b.turn + 1.45, 42],
  [b.hear - 1.05, 88],
  [b.hear - 0.2, HOLD + 0.62],
  [b.hear + 0.3, HOLD + 0.665],
  [b.hear + 2.0, HOLD + 0.94],
];
// guard: the shot's own schedule must still match this mirror (else the music drifts off the picture)
{
  const shotSrc = fs.readFileSync(path.join(ROOT, 'apps/bookshelf/src/viz/films', SLUG, 'shots', `${SHOT}.tsx`), 'utf8');
  const m = shotSrc.match(/const step = linear\(\[([\s\S]*?)\]\);/);
  const norm = (x) => x.replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
  const MIRROR = '[b.wrong-0.95,s0+0.0],[b.wrong+0.1,s0+0.62],[b.turn-0.2,s0+0.665],[b.turn+0.45,s0+0.97],[b.turn+0.5,s0+1.0],[b.turn+1.45,42],[b.hear-1.05,88],[b.hear-0.2,HOLD+0.62],[b.hear+0.3,HOLD+0.665],[b.hear+2.0,HOLD+0.94],';
  if (!m || norm(m[1]) !== MIRROR) {
    console.error(`WARNING: ${SHOT}'s step schedule changed; update PTS in this tool to match the shot before trusting the sync.`);
    if (!argv.includes('--force')) process.exit(2);
  }
}
for (let i = 1; i < PTS.length; i++) if (!(PTS[i][0] > PTS[i - 1][0] && PTS[i][1] >= PTS[i - 1][1])) throw new Error(`schedule not monotone at ${i}`);
/** first shot-local time at which step(t) reaches x */
function tAt(x) {
  if (x <= PTS[0][1]) return PTS[0][0];
  for (let i = 1; i < PTS.length; i++) {
    const [t0, v0] = PTS[i - 1];
    const [t1, v1] = PTS[i];
    if (x <= v1) return v1 === v0 ? t0 : t0 + ((x - v0) / (v1 - v0)) * (t1 - t0);
  }
  return null; // never reached in this shot
}

// ---------------------------------------------------------------- the events
const r3 = (x) => +x.toFixed(3);
const ev = { relay: [], relayUnder: [], thump: [], ratchet: [], ratchetUnder: [], hum: [], pad: [], knob: [], knobUnder: [], latch: [], coda: [] };
const lerp = (a, b, u) => a + (b - a) * u;

// presentations shown: s0 .. HOLD
const shown = [];
for (let k = s0; k <= HOLD; k++) {
  const land = tAt(k);
  const judge = tAt(k + 0.665);
  const turned = tAt(k + 0.97) ?? b.hear + 2.0;
  if (land == null || judge == null) break;
  shown.push({ k, land: A(land), judge: A(judge), turned: A(turned), step: RUN.steps[k] });
}

// THE MACHINE IS HEARD, NOT PLAYED: relays, a patch board and motor-driven potentiometers. Everything below is a
// mechanical sound (a 909 rimshot, band-passed noise bursts, square-wave thumps): it clacks, it never chimes.

// the eye: a relay clack per presentation (at 40 a second it becomes the machine's clatter)
shown.forEach((p, i) => {
  const gap = (shown[i + 1]?.land ?? p.land + 0.3) - p.land;
  const vel = gap < 0.08 ? 0.35 : gap < 0.2 ? 0.5 : 0.7;
  const pitch = p.step.img.target > 0 ? 'd3' : 'c3'; // the two card classes: a hair apart, as two relays would be
  if (underSpeech(p.land, p.land + 0.03)) ev.relayUnder.push([r3(p.land), 0.03, pitch, r3(vel * 0.6)]);
  else {
    ev.relay.push([r3(p.land), 0.03, pitch, vel]);
    ev.thump.push([r3(p.land), 0.03, 'c1', r3(vel * 0.7)]);
  }
});

// a mistake: the motors turn ONLY the lit knobs (Δw = η·target·a): a ratchet of detent clicks, one per lit knob,
// whose resonance sweeps UP when the weights move toward "horizontal" (+1) and DOWN toward "vertical" (−1).
// A right answer changes nothing, so it makes no sound: you hear it learn as the ratchets falling silent.
for (const p of shown) {
  if (!p.step.error || p.k === HOLD) continue;
  const lit = Array.from(p.step.a).filter(Boolean).length;
  const n = Math.max(4, Math.min(24, lit));
  const dir = p.step.img.target;
  const span = Math.max(p.turned - p.judge, n * 0.014);
  const under = underSpeech(p.judge, p.judge + span);
  const [f0, f1] = under ? [5200, 7600] : [1100, 3000]; // under a line: above the voice band (5 kHz and up)
  for (let c = 0; c < n; c++) {
    const u = c / Math.max(1, n - 1);
    const f = Math.round(dir > 0 ? lerp(f0, f1, u) : lerp(f1, f0, u));
    const t = p.judge + (span * c) / n;
    (under ? ev.ratchetUnder : ev.ratchet).push([r3(t), 0.012, 'c3', under ? 0.5 : 0.85, { bpf: f }]);
  }
  if (!under) ev.hum.push([r3(p.judge), r3(span + 0.04), 'c1', 0.5]);
}

// the error rate as harmony: stage from the mistake rate over the last min(20, seen) presentations
const VOICING = [
  // an octave above the narrator's fundamental (the pad plays under L0308)
  '[c4,g4,c5,e5]', // 0: C major — learned
  '[c4,g4,d5,e5]', // 1: add9, nearly there
  '[c4,f4,g4,d5]', // 2: suspended
  '[c4,d4,g4,a4]', // 3: open cluster
  '[c4,db4,f#4,b4]', // 4: guessing
];
const stageOf = (p) => {
  const rate = p.step.recentErrors / Math.min(20, p.k + 1);
  return rate >= 0.35 ? 4 : rate >= 0.2 ? 3 : rate >= 0.1 ? 2 : rate > 0 ? 1 : 0;
};
{
  const holdEnd = A(b.hear - 0.2);
  let cur = null;
  for (const p of shown) {
    if (p.land >= holdEnd) break;
    const st = stageOf(p);
    if (!cur || cur.st !== st) {
      if (cur) cur.end = p.land;
      cur = { st, start: p.land, end: holdEnd };
      ev.pad.push(cur);
    }
  }
}
ev.pad = ev.pad
  .filter((s) => s.end - s.start > 0.05)
  .reduce((out, s) => (out.length && out.at(-1).st === s.st ? ((out.at(-1).end = s.end), out) : [...out, s]), [])
  .map((s) => [r3(s.start), r3(Math.max(0.12, s.end - s.start + 0.08)), VOICING[s.st], underSpeech(s.start, s.end) ? 0.05 : 0.09, { attack: 0.04, release: 0.25 }]);

// "You could hear it learn": the held mistake's lit knobs click one notch each (three detents), one by one, in the gaps
// between words; each knob's detent resonance is set by its LEARNED weight (low = the "vertical" knobs, high = the
// "horizontal" ones), so the weights are still heard, mechanically
{
  const p = shown.find((q) => q.k === HOLD);
  const lit = [];
  for (let i = 0; i < N_A; i++) if (p.step.a[i]) lit.push(i);
  const w = p.step.wAfter;
  const wmax = Math.max(...lit.map((i) => Math.abs(w[i])), 1);
  lit.sort((x, y) => w[x] - w[y]);
  const from = A(b.hear);
  const to = lineEnd(LAST) + 0.75;
  const ws = words.filter((x) => x.z > from - 0.5 && x.a < to).sort((x, y) => x.a - y.a);
  const gaps = [];
  let cur = from;
  for (const x of ws) {
    if (x.a - 0.06 - cur >= 0.22) gaps.push([cur, x.a - 0.06]);
    cur = Math.max(cur, x.z + 0.06);
  }
  if (to - cur >= 0.22) gaps.push([cur, to]);
  const total = gaps.reduce((q, g) => q + (g[1] - g[0]), 0);
  const freqOf = (i) => Math.round(lerp(1100, 3400, (w[i] / wmax + 1) / 2));
  let j = 0;
  gaps.forEach((g, gi) => {
    const n = gi === gaps.length - 1 ? lit.length - j : Math.round((lit.length * (g[1] - g[0])) / total);
    const step = (g[1] - g[0]) / Math.max(1, n);
    for (let m = 0; m < n && j < lit.length; m++, j++) {
      const at = g[0] + step * m;
      const f = freqOf(lit[j]);
      for (let d = 0; d < 3; d++) ev.knob.push([r3(at + d * Math.min(0.05, step / 4)), 0.014, 'c3', d === 2 ? 0.95 : 0.7, { bpf: f }]);
    }
  });
  // under the words the picture's knobs keep turning: one faint high detent at each word onset
  for (const x of ws) if (x.a >= from && x.z <= to) ev.knobUnder.push([r3(x.a), 0.012, 'c3', 0.4, { bpf: 3600 }]);
  // it learned: the response relay latches (clack, then the armature settles), over a soft C major
  const c = lineEnd(LAST) + 0.8;
  ev.latch.push([r3(c), 0.05, 'a2', 0.9], [r3(c + 0.075), 0.04, 'e3', 0.55]);
  ev.thump.push([r3(c), 0.06, 'c1', 0.9]);
  ev.coda.push([r3(c + 0.05), 0.9, '[c3,g3,c4,e4]', 0.1, { attack: 0.08, release: 0.6 }]);
  globalThis.__holdInfo = { presentation: HOLD + 1, lit: lit.length, gaps: gaps.map((g) => g.map(r3)), detentHz: lit.map(freqOf) };
}

// ---------------------------------------------------------------- the Strudel block
// Strudel's transpiler turns DOUBLE-quoted strings into mini-notation patterns, so note names must be single-quoted
const J = (a) => JSON.stringify(a).replace(/"([a-z]+)":/g, '$1:').replace(/"([^"']*)"/g, "'$1'");
const layer = (list, defs, chain) => (list.length ? `$: line(${J(list)}, ${defs})\n  ${chain}` : '// (no events)');
const block = `${BEGIN}
// GENERATED by tools/film/sonify-perceptron.mjs from PERCEPTRON_RUN (seed 1958) and ${SHOT}'s step schedule on
// the current clock. Do not edit by hand: re-run the tool. Presentations ${s0 + 1}-${HOLD + 1} shown
// (${shown.filter((p) => p.step.error).length} mistakes heard as motor ratchets; right answers are silent).
// the eye: a relay clack per presentation (909 rimshot + a low armature thump in the clear)
${layer(ev.relay, '{ attack: .001, release: .02 }', ".s('rim').bank('RolandTR909').gain(.36).hpf(300).room(.18).rsize(2).orbit(5)")}
// under a line the clacks and ratchets are ~8 dB down and high-passed/band-passed at 5 kHz and up (critic round 1:
// L0308 'a little toward the answer' must stay 9 dB clear in 1-4 kHz); full level from the breath after the line
${layer(ev.relayUnder, '{ attack: .001, release: .02 }', ".s('rim').bank('RolandTR909').gain(.12).hpf(5000).orbit(5)")}
${layer(ev.thump, '{ attack: .001, release: .03 }', ".s('square').decay(.025).sustain(0).lpf(180).gain(.4).orbit(5)")}
// mistakes: the motor ratchets (detent clicks; resonance sweeps up toward "horizontal", down toward "vertical")
${layer(ev.ratchet, '{ attack: .001, release: .01, bpf: 2000 }', ".s('white').decay(.009).sustain(0).bpq(4).gain(1.6).room(.12).rsize(1.5).orbit(3)")}
${layer(ev.ratchetUnder, '{ attack: .001, release: .01, bpf: 6000 }', ".s('white').decay(.007).sustain(0).bpq(5).hpf(4500).gain(.28).orbit(3)")}
${layer(ev.hum, '{ attack: .01, release: .04 }', ".s('square').lpf(220).vib(18).vibmod(.15).gain(.12).orbit(3)")}
// the error rate as harmony (organ, soft): cluster while guessing, C major once the last 20 are right
$: line(${J(ev.pad)})
  .s('gm_drawbar_organ').gain(G * .7).hpf(240).lpf(1800).room(.4).rsize(3).orbit(2)
// "You could hear it learn": each lit knob clicks one notch, its detent tuned by its learned weight
${layer(ev.knob, '{ attack: .001, release: .012, bpf: 2000 }', ".s('white').decay(.011).sustain(0).bpq(6).gain(1.9).room(.15).rsize(1.5).orbit(3)")}
${layer(ev.knobUnder, '{ attack: .001, release: .01, bpf: 3600 }', ".s('white').decay(.006).sustain(0).bpq(6).gain(.6).orbit(3)")}
// it learned: the response relay latches (gains trimmed 2026-10-13: the latch and the first clack were the cue's
// true peak, -1.5 dBTP; now under -3)
${layer(ev.latch, '{ attack: .001, release: .04 }', ".s('rim').bank('RolandTR909').gain(.38).lpf(5000).room(.25).rsize(2).orbit(5)")}
$: line(${J(ev.coda)}, { attack: .05, release: .6 })
  .s('gm_drawbar_organ').gain(G * .8).hpf(120).lpf(1500).room(.5).rsize(4).orbit(2)
${END}`;

// ---------------------------------------------------------------- write into the cue
const cueFile = path.join(FILM, 'score/cues', `${CUE}.strudel`);
const src = fs.readFileSync(cueFile, 'utf8');
const i0 = src.indexOf(BEGIN);
const i1 = src.indexOf(END);
let out;
if (i0 >= 0 && i1 > i0) out = src.slice(0, i0) + block + src.slice(i1 + END.length);
else out = `${src.trimEnd()}\n\n${block}\n`;
const report = {
  cue: CUE,
  shot: SHOT,
  window: [r3(shown[0].land), r3(lineEnd(LAST) + 1)],
  presentations: shown.length,
  mistakes: shown.filter((p) => p.step.error).length,
  events: Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, v.length])),
  hold: globalThis.__holdInfo,
  padStages: ev.pad.map((p) => `${p[0]}:${p[2]}`),
};
if (DRY) console.log(block.slice(0, 1200) + '\n…');
else fs.writeFileSync(cueFile, out);
console.log(JSON.stringify(report, null, 1));
