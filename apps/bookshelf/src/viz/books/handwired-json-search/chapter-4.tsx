// Who Does It Beat
//
// JSON Search — chapter 4. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/json-search/README.md:114 (one Apple M5 Max, 100,000 generated documents, headless Chrome 155)
//   lab/json-search/README.md:118 (GPU: highlighter pass 2.2 ms, a search 4.5–5.2 ms back to back; CPU: highlighter
//     8.4–9.2 s on the executor and 2.1 s as generated JavaScript, a search 14 s as generated JavaScript, 3.2 minutes
//     on the executor), :140 (the 2.1 s is extrapolated from 5,000 documents)
//   lab/json-search/README.md:120 (from the texts: 0.15 s on the GPU, 0.12–0.15 s for the JavaScript highlighter)
//   lab/json-search/README.md:121-124 (RegExp 8–43 ms; 1.5–9× back to back; after a pause 11–16 ms, seven of ten
//     faster, one about the same, two slower: `\d\d\d\d-\d\d-\d\d` and `connection reset`, RegExp 8–9 ms against
//     GPU 12–16 ms; `([a-z]+)+x` 5–12 ms against 2.1 s), :436 (the 8–43 ms covers the nine ordinary patterns)
//   lab/json-search/README.md:126 (8 workers 1.9–6.7 ms, 16 workers 1.3–4.0 ms; workers not timed after a pause)
//   lab/json-search/README.md:131 (the honesty rule, quoted on the last panel)
//   lab/json-search/README.md:160, :784 (crossovers ~2,000–13,000 back to back and 15,000–54,000 after a pause,
//     interpolated between four measured counts); :733-746 (the table the crossover plot draws: the searcher's
//     8-state program back to back and after a pause, and RegExp `error`, at 100 · 1,000 · 10,000 · 100,000)
//   lab/json-search/README.md:787-813 (the review: CPU times were the loop forms, 11 s / 5 min → the shipped forms;
//     the crossovers had two digits → about 2,000 to 13,000; every baseline ran on one of 18 cores, unstated)
//   lab/status.md:107 (the review corrected the first answer), :114 (pause slowdown not found), :120 (workers),
//     :127 (any other GPU or browser not done); the October 14 removal and tag json-regex-experiments-2026-10
//   lab/json-search/README.md:208 (the pause cause wasn't found)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Corrections from review.md applied on screen: the CPU multiplier is 950–3,100× (computed
// below from 2.1 s ÷ 2.2 ms and 14 s ÷ 4.5 ms), the RegExp bar is "nine ordinary patterns", and the CPU highlighter's
// 2.1 s is marked "extrapolated". The ten-dot strip is a tally (7 · 1 · 2), not a per-pattern plot: its dots carry no
// time. Every bar length is the README's own number on a log axis.
import { Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const WHISPER = 0.12;
const HOUND = '#b23a48'; // the book's accent (bloodhound red)
const AXIS_INK = 'rgba(148, 163, 184, 0.5)';

// ---------------------------------------------------------------------------
// The numbers (lab/json-search/README.md:118-131), milliseconds, for 100,000 documents
// ---------------------------------------------------------------------------

const MS = {
  gpuB2B: [4.5, 5.2] as const, // a search, back to back
  gpuPause: [11, 16] as const, // a search after a pause of 200 ms or more
  gpuHlPass: 2.2, // the highlighter's pass, documents already on the GPU
  cpuHl: 2100, // highlighter, generated JavaScript, extrapolated from 5,000 documents
  execHl: [8400, 9200] as const, // highlighter on the executor
  cpuS: 14000, // a search, generated JavaScript
  execS: 3.2 * 60 * 1000, // a search on the executor
  re: [8, 43] as const, // RegExp, one thread, nine ordinary patterns
  bt: 2100, // RegExp on ([a-z]+)+x
  gpuBt: [5, 12] as const,
  w8: [1.9, 6.7] as const,
  w16: [1.3, 4.0] as const,
  jsHl: [120, 150] as const, // plain JavaScript highlighter from the texts
  gpuText: 150, // GPU from the texts
};

const sig2 = (v: number): number => {
  const p = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / p) * p;
};
const MULT_LO = sig2(MS.cpuHl / MS.gpuHlPass); // 954.5 → 950
const MULT_HI = sig2(MS.cpuS / MS.gpuB2B[0]); // 3,111 → 3,100
if (MULT_LO !== 950 || MULT_HI !== 3100) throw new Error('json-search ch4: CPU multiplier disagrees with the caption');
const n = (v: number): string => v.toLocaleString('en-US');

// the crossover table, README.md:736-746 (ms at 100 · 1,000 · 10,000 · 100,000 documents)
const XO_N = [100, 1000, 10000, 100000];
const XO = {
  b2b: [1.45, 0.93, 0.94, 4.51], // the searcher's program of 8 states, back to back
  pause: [2.43, 2.68, 4.31, 12.6], // the same after a pause of 200 ms
  re: [0.01, 0.19, 1.87, 20.5], // RegExp, `error`, which the searcher runs on 8 states
};
const XO_BANDS = { b2b: [2000, 13000], pause: [15000, 54000] } as const;
// the 100,000-document column must agree with the bars on the main axis
if (XO.b2b[3] < MS.gpuB2B[0] || XO.b2b[3] > MS.gpuB2B[1]) throw new Error('json-search ch4: crossover table drifted');

// the after-a-pause tally, README.md:123
const STRIP: ('faster' | 'same' | 'slower')[] = [...Array<'faster'>(7).fill('faster'), 'same', 'slower', 'slower'];

// ---------------------------------------------------------------------------
// Layout: one log-time axis, 1 ms → 200 s
// ---------------------------------------------------------------------------

const AX = { x0: 170, x1: 1180, y: 540, maxMs: 200000 };
const PXD = (AX.x1 - AX.x0) / Math.log10(AX.maxMs); // px per decade
const X = (ms: number): number => AX.x0 + Math.log10(ms) * PXD;
const DECADES = [1, 10, 100, 1000, 10000, 100000];
const DEC_LABEL = ['1 ms', '10 ms', '100 ms', '1 s', '10 s', '100 s'];
const MINORS = DECADES.flatMap((d) => [2, 3, 4, 5, 6, 7, 8, 9].map((m) => d * m)).filter((v) => v < AX.maxMs);

const LANE = { txt: 216, w16: 262, w8: 308, bt: 354, re: 400, cpuS: 446, cpuHl: 492 };
const BAND_TOP = 192;

// crossover panel (world space, top right)
const XP = { x: 700, y: 88, w: 490, h: 252 };
const XPLOT = { x0: 770, x1: 1160, yLo: 300, yHi: 150, nLo: 100, nHi: 100000, tLo: 0.01, tHi: 30 };
const xn = (docs: number): number =>
  XPLOT.x0 + ((Math.log10(docs) - Math.log10(XPLOT.nLo)) / (Math.log10(XPLOT.nHi) - Math.log10(XPLOT.nLo))) * (XPLOT.x1 - XPLOT.x0);
const yt = (ms: number): number =>
  XPLOT.yLo - ((Math.log10(ms) - Math.log10(XPLOT.tLo)) / (Math.log10(XPLOT.tHi) - Math.log10(XPLOT.tLo))) * (XPLOT.yLo - XPLOT.yHi);
const XO_PTS = {
  b2b: XO_N.map((d, i) => [xn(d), yt(XO.b2b[i])] as const),
  pause: XO_N.map((d, i) => [xn(d), yt(XO.pause[i])] as const),
  re: XO_N.map((d, i) => [xn(d), yt(XO.re[i])] as const),
};
const poly = (pts: readonly (readonly [number, number])[]): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

// the review's three claims (README.md:793-799)
const CLAIMS = [
  { what: 'CPU times', old: 'validate: 11 s as generated JS · 5 min on the executor', fix: '2.1 s, extrapolated · 8.4–9.2 s, every position written out' },
  { what: 'crossover counts', old: 'crossovers given to two digits', fix: 'about 2,000 to about 13,000 · interpolated' },
  { what: 'baselines', old: 'every baseline on one core, unstated', fix: 'one of 18 cores, disclosed · 8 workers: 1.9–6.7 ms' },
];
const CLAIM_Y = [228, 312, 396];

const RUNGS = [
  { name: 'holds', color: colors.POSITIVE, lines: ['faster than the same programs on the CPU · faster than RegExp back to back', 'and for most patterns at a keystroke · not faster than workers'] },
  { name: 'narrowed', color: colors.WARM, lines: ['CPU times · crossover counts', 'one-core baselines disclosed'] },
  { name: 'historical', color: colors.MUTED, lines: ['October 13 “about even”, with loop-emit.ts’s shaders', 'first-stage programs removed → tag json-regex-experiments-2026-10'] },
  { name: 'open', color: colors.SECONDARY, lines: ['why a search after a pause takes longer · the lab did not find it', 'any other GPU or browser'] },
];
const RUNG_Y = [178, 256, 334, 412];

const RECAP = ['a thread per document', 'a pattern kept as data', 'states packed into words', 'the scoreboard'];
const SCORE = [
  { who: 'the same program on the CPU', verdict: 'faster', color: colors.POSITIVE },
  { who: 'RegExp on one thread', verdict: 'often faster', color: colors.WARM },
  { who: 'JavaScript in several workers', verdict: 'not faster', color: colors.NEGATIVE },
];

// ---------------------------------------------------------------------------
// The narration (book.json chapters[3].captions, verbatim)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'So is the GPU clearly faster? That depends on who it races. Each opponent gets a bar on one time axis, all for a hundred thousand documents.',
  "Against the same programs on the CPU, yes. The highlighter takes about 2.1 seconds, extrapolated, and a search 14 seconds. That is 950 to 3,100 times the GPU's time.",
  "Against the browser's RegExp on one thread, counting every match of nine ordinary patterns in 8 to 43 milliseconds, the GPU is 1.5 to 9 times faster when searches follow each other.",
  'At a keystroke, after a pause, the search takes 11 to 16 milliseconds. It beats RegExp on seven of ten patterns, ties one, and loses on a date and on connection reset.',
  'On a pattern that makes RegExp backtrack, RegExp takes 2.1 seconds. The GPU takes 5 to 12 milliseconds.',
  'The crossover is about 2,000 to 13,000 documents back to back, and 15,000 to 54,000 after a pause. Those counts are interpolated between four measured sizes.',
  "Against JavaScript in several workers, no. Eight workers count a pattern's matches in 1.9 to 6.7 milliseconds, where the GPU takes 4.5 to 5.2 back to back. Workers were not timed after a pause.",
  'For validating from raw text, it is not clearly faster either: 0.15 seconds on the GPU against 0.12 to 0.15 for a plain JavaScript highlighter.',
  'A review corrected the first write-up where it had claimed more than the measurements show. The CPU times and crossover counts were narrowed, and the one-core baselines were disclosed.',
  'Still open: why a search after a pause takes longer, which the lab says it did not find, and any other GPU or browser. The first-stage programs were removed, and survive in a tag.',
  'So: a thread per document, a pattern kept as data, states packed into words. Faster than the same program on the CPU, often faster than RegExp, not faster than workers.',
  'The lab itself says a demo is honest if it says what it shows, and not if it claims to beat RegExp on every pattern, or JavaScript in several workers.',
];
// ~150 words per minute, plus a breath
const speak = (text: string): number => +(text.split(/\s+/).length / 2.5 + 0.6).toFixed(1);

const CAM: Record<string, CameraState> = {
  b1: { x: 380, y: 360, k: 1.3 },
  b2: { x: 640, y: 352, k: 1.0 },
  b3: { x: 400, y: 360, k: 1.3 },
  b4: { x: 660, y: 340, k: 1.05 },
  b5: { x: 560, y: 360, k: 1.1 },
  b6: { x: 940, y: 240, k: 1.25 },
  b7: { x: 360, y: 360, k: 1.3 },
  b8: { x: 470, y: 360, k: 1.3 },
  b9: { x: 640, y: 330, k: 1.04 },
  b10: { x: 640, y: 322, k: 1.06 },
  home: { x: 640, y: 330, k: 1.0 },
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

type Pair = { u: ChannelRef<number>; op: ChannelRef<number> };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM.b1, cameraInterp);
  const pair = (k: string): Pair => ({ u: tl.channel(`${k}U`, 0), op: tl.channel(`${k}Op`, 1) });

  // the axis (the persistent machine)
  const axisU = tl.channel('axisU', 0);
  const axisOp = tl.channel('axisOp', 1); // everything on the axis; whispers from beat 9
  const tickOp = tl.channel('tickOp', 1);
  const tagU = tl.channel('tagU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const gpu = pair('gpu');
  const pause = pair('pause');

  // lanes and their stamps
  const cpuHl = pair('cpuHl');
  const cpuS = pair('cpuS');
  const gpuHl = tl.channel('gpuHlU', 0);
  const exec = tl.channel('execU', 0);
  const re = pair('re');
  const bt = pair('bt');
  const gpuBt = tl.channel('gpuBtU', 0);
  const w8 = pair('w8');
  const w16 = pair('w16');
  const wNote = tl.channel('wNoteU', 0);
  const txt = pair('txt');
  const gpuTxt = tl.channel('gpuTxtU', 0);
  const stCpu = pair('stCpu');
  const stRe = pair('stRe');
  const stBt = pair('stBt');
  const stW = pair('stW');
  const stTxt = pair('stTxt');

  // side panels
  const strip = pair('strip');
  const stripRed = tl.channel('stripRedU', 0);
  const xo = pair('xo');
  const xoLines = tl.channel('xoLinesU', 0);
  const xoB2b = tl.channel('xoB2bU', 0);
  const xoPause = tl.channel('xoPauseU', 0);
  const xoTag = tl.channel('xoTagU', 0);

  // beats 9–12
  const claims = pair('claims');
  const strike = tl.channel('strikeU', 0); // 0..3
  const fix = tl.channel('fixU', 0); // 0..3
  const ladder = pair('ladder'); // u 0..4
  const spotOpen = tl.channel('spotOpen', 0);
  const spotHist = tl.channel('spotHist', 0);
  const pulse = tl.channel('pulse', 0);
  const recap = pair('recap'); // u 0..4
  const score = tl.channel('scoreU', 0); // 0..3
  const honest = tl.channel('honestU', 0);
  const honest1 = tl.channel('honest1U', 0);
  const honest2 = tl.channel('honest2U', 0);

  const dim = (refs: ChannelRef<number>[], at: number, to = WHISPER, dur = 0.6) => {
    for (const r of refs) tl.tween(r, to, { at, dur, ease: ease.move });
  };

  let t = 0.4;
  const beat = (i: number): [number, number] => {
    const at = t;
    const dur = speak(CAPTIONS[i]);
    tl.caption({ at, dur, text: CAPTIONS[i] });
    t = tl.hold(at + dur, 0.8);
    return [at, dur];
  };

  // B1 · the empty axis, the GPU band, 100,000 documents
  {
    const [a] = beat(0);
    tl.tween(axisU, 1, { at: a + 0.2, dur: 1.4, ease: ease.draw });
    tl.tween(tagU, 1, { at: a + 0.6, dur: 0.6, ease: ease.enter });
    tl.tween(gpu.u, 1, { at: a + 2.2, dur: 0.7, ease: ease.enter });
    tl.tween(ghostU, 1, { at: a + 4.6, dur: 1.4, ease: ease.draw });
  }
  // B2 · the CPU bars, 950–3,100×
  {
    const [a] = beat(1);
    tl.tween(cam, CAM.b2, { at: a, dur: 1.4, ease: ease.move });
    tl.tween(cpuHl.u, 1, { at: a + 1.0, dur: 1.4, ease: ease.draw });
    tl.tween(gpuHl, 1, { at: a + 1.8, dur: 0.6, ease: ease.enter });
    tl.tween(cpuS.u, 1, { at: a + 4.0, dur: 1.4, ease: ease.draw });
    tl.tween(exec, 1, { at: a + 5.8, dur: 0.7, ease: ease.enter });
    tl.tween(stCpu.u, 1, { at: a + 8.6, dur: 0.5, ease: ease.pop });
  }
  // B3 · RegExp, nine ordinary patterns
  {
    const [a] = beat(2);
    dim([cpuHl.op, cpuS.op, stCpu.op], a);
    tl.tween(cam, CAM.b3, { at: a, dur: 1.3, ease: ease.move });
    tl.tween(re.u, 1, { at: a + 1.2, dur: 1.4, ease: ease.draw });
    tl.tween(stRe.u, 1, { at: a + 9.4, dur: 0.5, ease: ease.pop });
  }
  // B4 · after a pause: 11–16 ms, the ten-dot tally
  {
    const [a] = beat(3);
    tl.tween(cam, CAM.b4, { at: a, dur: 1.2, ease: ease.move });
    dim([gpu.op, stRe.op], a + 0.4);
    tl.tween(pause.u, 1, { at: a + 0.6, dur: 0.7, ease: ease.enter });
    tl.tween(strip.u, 1, { at: a + 4.8, dur: 1.6, ease: ease.linear });
    tl.tween(stripRed, 1, { at: a + 8.6, dur: 0.6, ease: ease.enter });
  }
  // B5 · the backtracker
  {
    const [a] = beat(4);
    dim([strip.op], a, 0);
    dim([re.op, pause.op], a);
    tl.tween(cam, CAM.b5, { at: a, dur: 1.2, ease: ease.move });
    tl.tween(bt.u, 1, { at: a + 0.6, dur: 1.6, ease: ease.draw });
    tl.tween(gpuBt, 1, { at: a + 3.9, dur: 0.6, ease: ease.enter });
    tl.tween(stBt.u, 1, { at: a + 5.4, dur: 0.5, ease: ease.pop });
  }
  // B6 · the crossover panel
  {
    const [a] = beat(5);
    dim([bt.op, stBt.op, tickOp], a);
    tl.tween(cam, CAM.b6, { at: a, dur: 1.3, ease: ease.move });
    tl.tween(xo.u, 1, { at: a + 0.6, dur: 0.7, ease: ease.enter });
    tl.tween(xoLines, 1, { at: a + 1.3, dur: 1.6, ease: ease.draw });
    tl.tween(xoB2b, 1, { at: a + 2.4, dur: 0.6, ease: ease.enter });
    tl.tween(xoPause, 1, { at: a + 4.9, dur: 0.6, ease: ease.enter });
    tl.tween(xoTag, 1, { at: a + 7.6, dur: 0.5, ease: ease.pop });
  }
  // B7 · workers
  {
    const [a] = beat(6);
    dim([xo.op], a, 0);
    tl.tween(tickOp, 1, { at: a + 1.3, dur: 0.6, ease: ease.enter });
    tl.tween(cam, CAM.b7, { at: a, dur: 1.3, ease: ease.move });
    tl.tween(gpu.op, 1, { at: a + 1.1, dur: 0.6, ease: ease.enter });
    tl.tween(w8.u, 1, { at: a + 1.4, dur: 1.2, ease: ease.draw });
    tl.tween(w16.u, 1, { at: a + 3.6, dur: 1.2, ease: ease.draw });
    tl.tween(stW.u, 1, { at: a + 6.6, dur: 0.5, ease: ease.pop });
    tl.tween(pause.op, 0.7, { at: a + 11.0, dur: 0.6, ease: ease.enter });
    tl.tween(wNote, 1, { at: a + 11.0, dur: 0.6, ease: ease.enter });
  }
  // B8 · from the texts: a tie
  {
    const [a] = beat(7);
    dim([w8.op, w16.op, stW.op, pause.op, gpu.op], a);
    tl.tween(wNote, 0, { at: a, dur: 0.5, ease: ease.move });
    tl.tween(cam, CAM.b8, { at: a, dur: 1.2, ease: ease.move });
    tl.tween(txt.u, 1, { at: a + 1.6, dur: 1.4, ease: ease.draw });
    tl.tween(gpuTxt, 1, { at: a + 3.6, dur: 0.6, ease: ease.enter });
    tl.tween(stTxt.u, 1, { at: a + 7.4, dur: 0.5, ease: ease.pop });
  }
  // B9 · the review's red pen
  {
    const [a] = beat(8);
    dim([axisOp], a, WHISPER, 0.8);
    tl.tween(cam, CAM.b9, { at: a, dur: 1.2, ease: ease.move });
    tl.tween(claims.u, 1, { at: a + 0.9, dur: 0.8, ease: ease.enter });
    tl.tween(strike, 3, { at: a + 2.6, dur: 2.6, ease: ease.linear });
    tl.tween(fix, 3, { at: a + 5.8, dur: 3.0, ease: ease.linear });
  }
  // B10 · the status ladder
  {
    const [a, dur] = beat(9);
    dim([claims.op], a, 0);
    tl.tween(cam, CAM.b10, { at: a, dur: 1.0, ease: ease.move });
    tl.tween(ladder.u, 4, { at: a + 0.4, dur: 1.6, ease: ease.linear });
    tl.tween(spotOpen, 1, { at: a + 1.6, dur: 0.6, ease: ease.enter });
    tl.tween(pulse, (dur - 1.6) / 1.4, { at: a + 1.6, dur: dur - 1.6, ease: ease.linear });
    tl.tween(spotOpen, 0, { at: a + 10.4, dur: 0.6, ease: ease.move });
    tl.tween(spotHist, 1, { at: a + 10.4, dur: 0.6, ease: ease.enter });
  }
  // B11 · the recap; pull back
  {
    const [a] = beat(10);
    dim([ladder.op], a, 0);
    tl.tween(cam, CAM.home, { at: a, dur: 1.4, ease: ease.move });
    tl.tween(recap.u, 3, { at: a + 0.6, dur: 5.0, ease: ease.linear });
    tl.tween(recap.u, 4, { at: a + 6.0, dur: 0.6, ease: ease.linear });
    tl.tween(score, 3, { at: a + 6.4, dur: 4.6, ease: ease.linear });
  }
  // B12 · the honesty line
  {
    const [a] = beat(11);
    dim([recap.op], a + 0.2, 0);
    tl.tween(honest, 1, { at: a + 0.3, dur: 0.8, ease: ease.enter });
    tl.tween(honest1, 1, { at: a + 1.4, dur: 0.6, ease: ease.enter });
    tl.tween(honest2, 1, { at: a + 5.4, dur: 0.6, ease: ease.enter });
  }
  t = tl.hold(t, 1.0);

  return {
    tl, cam, axisU, axisOp, tickOp, tagU, ghostU, gpu, pause,
    cpuHl, cpuS, gpuHl, exec, re, bt, gpuBt, w8, w16, wNote, txt, gpuTxt,
    stCpu, stRe, stBt, stW, stTxt,
    strip, stripRed, xo, xoLines, xoB2b, xoPause, xoTag,
    claims, strike, fix, ladder, spotOpen, spotHist, pulse, recap, score, honest, honest1, honest2,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

/** A race bar from 1 ms to `hi`, growing in log time: solid to `lo`, lighter from `lo` to `hi`. */
function Bar({ y, lo, hi, u, color, h = 10, dy = -4 }: { y: number; lo: number; hi: number; u: number; color: string; h?: number; dy?: number }) {
  if (u <= 0.001) return null;
  const end = AX.x0 + Math.log10(hi) * PXD * clamp01(u);
  const xLo = Math.min(end, X(lo));
  return (
    <g>
      <rect x={AX.x0} y={y + dy - h / 2} width={Math.max(0, xLo - AX.x0)} height={h} rx={h / 2.5} fill={color} opacity={0.85} />
      {end > xLo + 0.5 && (
        <rect x={xLo} y={y + dy - h / 2} width={end - xLo} height={h} rx={h / 2.5} fill={color} opacity={0.38} />
      )}
    </g>
  );
}

function Stamp({ x, y, text, sub, sub2, color, u, op }: { x: number; y: number; text: string; sub?: string; sub2?: string; color: string; u: number; op: number }) {
  if (u <= 0.001 || op <= 0.001) return null;
  const w = Math.max(text.length * 11 + 28, (sub?.length ?? 0) * 7.4 + 24, (sub2?.length ?? 0) * 7 + 24);
  const h = 32 + (sub ? 20 : 0) + (sub2 ? 17 : 0);
  const k = lerp(1.35, 1, clamp01(u));
  return (
    <g opacity={clamp01(u) * op} transform={`translate(${x}, ${y}) rotate(-2.5) scale(${k})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={colors.BG} fillOpacity={0.92} stroke={color} strokeWidth={2} />
      <text x={0} y={-h / 2 + 21} textAnchor="middle" fill={color} fontSize={17} fontWeight={700} fontFamily={UI} letterSpacing={1.5}>
        {text}
      </text>
      {sub && (
        <text x={0} y={-h / 2 + 43} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={UI}>
          {sub}
        </text>
      )}
      {sub2 && (
        <text x={0} y={-h / 2 + 60} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          {sub2}
        </text>
      )}
    </g>
  );
}

function LaneLabel({ y, text, op, focus = 1 }: { y: number; text: string; op: number; focus?: number }) {
  if (op <= 0.001) return null;
  return (
    <text x={AX.x0 + 6} y={y - 14} fill={focus > 0.5 ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={UI} opacity={op}>
      {text}
    </text>
  );
}

const appear = (u: number, from = 0.75): number => clamp01((u - from) / (1 - from));

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const g = (p: Pair) => ({ u: s.get(p.u), op: s.get(p.op) });
  const axisU = s.get(scene.axisU);
  const axisOp = s.get(scene.axisOp);
  const tickOp = s.get(scene.tickOp) * axisOp;
  const ghostU = s.get(scene.ghostU);
  const gpu = g(scene.gpu);
  const pause = g(scene.pause);
  const cpuHl = g(scene.cpuHl);
  const cpuS = g(scene.cpuS);
  const gpuHl = s.get(scene.gpuHl);
  const exec = s.get(scene.exec);
  const re = g(scene.re);
  const bt = g(scene.bt);
  const gpuBt = s.get(scene.gpuBt);
  const w8 = g(scene.w8);
  const w16 = g(scene.w16);
  const wNote = s.get(scene.wNote);
  const txt = g(scene.txt);
  const gpuTxt = s.get(scene.gpuTxt);
  const stCpu = g(scene.stCpu);
  const stRe = g(scene.stRe);
  const stBt = g(scene.stBt);
  const stW = g(scene.stW);
  const stTxt = g(scene.stTxt);
  const strip = g(scene.strip);
  const stripRed = s.get(scene.stripRed);
  const xo = g(scene.xo);
  const xoLines = s.get(scene.xoLines);
  const xoB2b = s.get(scene.xoB2b);
  const xoPause = s.get(scene.xoPause);
  const xoTag = s.get(scene.xoTag);
  const claims = g(scene.claims);
  const strike = s.get(scene.strike);
  const fix = s.get(scene.fix);
  const ladder = g(scene.ladder);
  const spotOpen = s.get(scene.spotOpen);
  const spotHist = s.get(scene.spotHist);
  const pulse = s.get(scene.pulse);
  const recap = g(scene.recap);
  const score = s.get(scene.score);
  const honest = s.get(scene.honest);
  const honest1 = s.get(scene.honest1);
  const honest2 = s.get(scene.honest2);

  // a label that a camera push carries off the stage fades out before it is cut
  const sx = (x: number): number => (x - cam.x) * cam.k + STAGE_W / 2;
  const fitX = (x0: number, x1: number): number => clamp01((sx(x0) - 6) / 14) * clamp01((STAGE_W - 6 - sx(x1)) / 14);

  const lane = (p: { u: number; op: number }) => (p.u > 0.001 ? clamp01(p.u * 4) * p.op * axisOp : 0);
  const axisEnd = lerp(AX.x0, AX.x1, axisU);
  const gpuOp = gpu.u * gpu.op * axisOp;
  const pauseOp = pause.u * pause.op * axisOp;

  const claimsOp = claims.u * claims.op;
  const ladderOp = ladder.op * (ladder.u > 0 ? 1 : 0);
  const recapOp = recap.op * (recap.u > 0 ? 1 : 0);
  const xoOp = xo.u * xo.op;
  const stripOp = strip.op * (strip.u > 0 ? 1 : 0);

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the time axis ======================== */}
        <g opacity={axisOp}>
          <line x1={AX.x0} y1={AX.y} x2={axisEnd} y2={AX.y} stroke={AXIS_INK} strokeWidth={1.5} />
          {MINORS.map((v) =>
            X(v) <= axisEnd ? <line key={v} x1={X(v)} y1={AX.y} x2={X(v)} y2={AX.y + 4} stroke={AXIS_INK} strokeWidth={1} /> : null,
          )}
          {DECADES.map((v) =>
            X(v) <= axisEnd ? <line key={v} x1={X(v)} y1={AX.y} x2={X(v)} y2={AX.y + 9} stroke={AXIS_INK} strokeWidth={1.5} /> : null,
          )}
          {/* ghost lanes: one track per opponent to come */}
          {ghostU > 0.001 &&
            Object.values(LANE).map((y) => (
              <line key={y} x1={AX.x0} y1={y - 4} x2={lerp(AX.x0, AX.x1, ghostU)} y2={y - 4} stroke={AXIS_INK} strokeOpacity={0.35} strokeDasharray="3 6" />
            ))}
        </g>
        <g opacity={tickOp * appear(axisU, 0.5)}>
          {DECADES.map((v, i) => (
            <text key={v} x={X(v)} y={AX.y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={fitX(X(v) - DEC_LABEL[i].length * 4, X(v) + DEC_LABEL[i].length * 4)}>
              {DEC_LABEL[i]}
            </text>
          ))}
          <text x={AX.x1} y={AX.y - 10} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={fitX(AX.x1 - 70, AX.x1)}>
            log time →
          </text>
        </g>

        {/* GPU bands */}
        {gpuOp > 0.001 && (
          <g opacity={gpuOp}>
            <rect x={X(MS.gpuB2B[0])} y={BAND_TOP} width={X(MS.gpuB2B[1]) - X(MS.gpuB2B[0])} height={AX.y - BAND_TOP} fill={colors.TEAL} fillOpacity={0.35} />
            <line x1={X(MS.gpuB2B[0])} y1={BAND_TOP} x2={X(MS.gpuB2B[0])} y2={AX.y} stroke={colors.TEAL} strokeWidth={1.5} />
            <text x={X(MS.gpuB2B[0]) - 6} y={BAND_TOP - 8} textAnchor="end" fill={colors.TEAL} fontSize={14} fontFamily={UI} opacity={fitX(X(MS.gpuB2B[0]) - 220, X(MS.gpuB2B[0]))}>
              GPU · back to back 4.5–5.2 ms
            </text>
          </g>
        )}
        {pauseOp > 0.001 && (
          <g opacity={pauseOp}>
            <rect x={X(MS.gpuPause[0])} y={BAND_TOP} width={X(MS.gpuPause[1]) - X(MS.gpuPause[0])} height={AX.y - BAND_TOP} fill={colors.TEAL} fillOpacity={0.16} stroke={colors.TEAL} strokeOpacity={0.6} strokeDasharray="4 4" />
            <text x={X(MS.gpuPause[0]) + 2} y={BAND_TOP - 8} fill={colors.TEAL} fontSize={14} fontFamily={UI}>
              GPU · after 200 ms pause 11–16 ms
            </text>
          </g>
        )}

        {/* ---- CPU: highlighter ---- */}
        {lane(cpuHl) > 0.001 && (
          <g opacity={lane(cpuHl)}>
            <LaneLabel y={LANE.cpuHl} text="CPU · highlighter · generated JavaScript, extrapolated from 5,000 documents" op={1} focus={cpuHl.op} />
            <Bar y={LANE.cpuHl} lo={MS.cpuHl} hi={MS.cpuHl} u={cpuHl.u} color={colors.SECONDARY} />
            <text x={X(MS.cpuHl) + 8} y={LANE.cpuHl + 1} fill={colors.SECONDARY} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(cpuHl.u)}>
              ≈ 2.1 s
            </text>
            <g opacity={gpuHl}>
              <rect x={AX.x0} y={LANE.cpuHl + 5} width={X(MS.gpuHlPass) - AX.x0} height={5} rx={2} fill={colors.TEAL} />
              <text x={X(MS.gpuHlPass) + 8} y={LANE.cpuHl + 18} fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                GPU pass 2.2 ms
              </text>
            </g>
            <g opacity={exec}>
              <rect x={X(MS.execHl[0])} y={LANE.cpuHl - 9} width={X(MS.execHl[1]) - X(MS.execHl[0])} height={10} rx={3} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={X(MS.execHl[1]) + 8} y={LANE.cpuHl + 1} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                executor 8.4–9.2 s
              </text>
            </g>
          </g>
        )}
        {/* ---- CPU: search ---- */}
        {lane(cpuS) > 0.001 && (
          <g opacity={lane(cpuS)}>
            <LaneLabel y={LANE.cpuS} text="CPU · search · generated JavaScript" op={1} focus={cpuS.op} />
            <Bar y={LANE.cpuS} lo={MS.cpuS} hi={MS.cpuS} u={cpuS.u} color={colors.SECONDARY} />
            <text x={X(MS.cpuS) + 8} y={LANE.cpuS + 1} fill={colors.SECONDARY} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(cpuS.u)}>
              14 s
            </text>
            <g opacity={exec}>
              <path d={`M${X(MS.execS)},${LANE.cpuS - 11} l5,7 l-5,7 l-5,-7 z`} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={AX.x1} y={LANE.cpuS + 20} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                executor 3.2 min
              </text>
            </g>
          </g>
        )}
        <Stamp x={1035} y={392} text="WINS" sub={`the CPU takes ${n(MULT_LO)}–${n(MULT_HI)}×`} sub2="2.1 s ÷ 2.2 ms · 14 s ÷ 4.5 ms" color={colors.POSITIVE} u={stCpu.u} op={stCpu.op * axisOp} />

        {/* ---- RegExp, nine ordinary patterns ---- */}
        {lane(re) > 0.001 && (
          <g opacity={lane(re)}>
            <LaneLabel y={LANE.re} text="RegExp · one thread · every match of nine ordinary patterns" op={1} focus={re.op} />
            <Bar y={LANE.re} lo={MS.re[0]} hi={MS.re[1]} u={re.u} color={colors.ACCENT} />
            <text x={X(MS.re[1]) + 8} y={LANE.re + 1} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(re.u)}>
              8–43 ms
            </text>
          </g>
        )}
        <Stamp x={720} y={404} text="WINS" sub="1.5–9× faster · back to back" color={colors.POSITIVE} u={stRe.u} op={stRe.op * axisOp} />

        {/* ---- RegExp backtracking ---- */}
        {lane(bt) > 0.001 && (
          <g opacity={lane(bt)}>
            <LaneLabel y={LANE.bt} text="RegExp · ([a-z]+)+x, which makes it backtrack" op={1} focus={bt.op} />
            <Bar y={LANE.bt} lo={MS.bt} hi={MS.bt} u={bt.u} color={colors.ACCENT} />
            <text x={X(MS.bt) + 8} y={LANE.bt + 1} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(bt.u)}>
              2.1 s
            </text>
            <g opacity={gpuBt}>
              <rect x={AX.x0} y={LANE.bt + 5} width={X(MS.gpuBt[0]) - AX.x0} height={5} rx={2} fill={colors.TEAL} />
              <rect x={X(MS.gpuBt[0])} y={LANE.bt + 5} width={X(MS.gpuBt[1]) - X(MS.gpuBt[0])} height={5} rx={2} fill={colors.TEAL} opacity={0.45} />
              <text x={X(MS.gpuBt[1]) + 8} y={LANE.bt + 17} fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                GPU 5–12 ms
              </text>
            </g>
          </g>
        )}
        <Stamp x={930} y={340} text="WINS" sub="2.1 s vs 5–12 ms" color={colors.POSITIVE} u={stBt.u} op={stBt.op * axisOp} />

        {/* ---- workers ---- */}
        {lane(w8) > 0.001 && (
          <g opacity={lane(w8)}>
            <LaneLabel y={LANE.w8} text="8 workers · RegExp" op={1} focus={w8.op} />
            <Bar y={LANE.w8} lo={MS.w8[0]} hi={MS.w8[1]} u={w8.u} color={colors.ACCENT} />
            <text x={X(MS.w8[1]) + 8} y={LANE.w8 + 1} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(w8.u)}>
              1.9–6.7 ms
            </text>
          </g>
        )}
        {lane(w16) > 0.001 && (
          <g opacity={lane(w16)}>
            <LaneLabel y={LANE.w16} text="16 workers · RegExp" op={1} focus={w16.op} />
            <Bar y={LANE.w16} lo={MS.w16[0]} hi={MS.w16[1]} u={w16.u} color={colors.ACCENT} />
            <text x={X(MS.w16[1]) + 8} y={LANE.w16 + 1} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(w16.u)}>
              1.3–4.0 ms
            </text>
          </g>
        )}
        {wNote * axisOp > 0.001 && (
          <text x={X(MS.gpuPause[1]) + 10} y={LANE.w8 + 30} fill={colors.MUTED} fontSize={13} fontStyle="italic" fontFamily={UI} opacity={wNote * axisOp}>
            workers: not timed after a pause
          </text>
        )}
        <Stamp x={560} y={282} text="NOT FASTER" sub="GPU 4.5–5.2 ms sits inside 8 workers" color={colors.NEGATIVE} u={stW.u} op={stW.op * axisOp} />

        {/* ---- from the texts ---- */}
        {lane(txt) > 0.001 && (
          <g opacity={lane(txt)}>
            <LaneLabel y={LANE.txt} text="validate from the texts · plain JavaScript highlighter" op={1} focus={txt.op} />
            <Bar y={LANE.txt} lo={MS.jsHl[0]} hi={MS.jsHl[1]} u={txt.u} color={colors.ACCENT} />
            <text x={X(MS.jsHl[1]) + 8} y={LANE.txt + 1} fill={colors.ACCENT} fontSize={14} fontWeight={600} fontFamily={MONO} opacity={appear(txt.u)}>
              0.12–0.15 s
            </text>
            <g opacity={gpuTxt}>
              <rect x={AX.x0} y={LANE.txt + 5} width={X(MS.gpuText) - AX.x0} height={5} rx={2} fill={colors.TEAL} />
              <text x={X(MS.gpuText) + 8} y={LANE.txt + 18} fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                GPU 0.15 s
              </text>
            </g>
          </g>
        )}
        <Stamp x={830} y={214} text="NOT CLEARLY FASTER" sub="0.15 s vs 0.12–0.15 s" color={colors.WARM} u={stTxt.u} op={stTxt.op * axisOp} />

        {/* ======================== the ten-dot tally (beat 4) ======================== */}
        {stripOp > 0.001 && (
          <g opacity={stripOp}>
            <rect x={730} y={100} width={450} height={166} rx={10} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
            <text x={750} y={128} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              after a 200 ms pause · ten patterns · GPU vs RegExp
            </text>
            {STRIP.map((kind, i) => {
              const u = clamp01(strip.u * STRIP.length - i);
              const c = kind === 'faster' ? colors.POSITIVE : kind === 'same' ? colors.WARM : colors.NEGATIVE;
              return <circle key={i} cx={770 + i * 42} cy={162} r={10 * u} fill={c} fillOpacity={0.85} />;
            })}
            <g opacity={stripRed}>
              <line x1={770 + 8 * 42} y1={176} x2={770 + 9 * 42} y2={176} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={1160} y={200} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                {'\\d\\d\\d\\d-\\d\\d-\\d\\d · connection reset'}
              </text>
              <text x={1160} y={218} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                RegExp 8–9 ms · GPU 12–16 ms
              </text>
            </g>
            <g opacity={appear(strip.u, 0.6)}>
              <circle cx={756} cy={246} r={5} fill={colors.POSITIVE} />
              <text x={766} y={251} fill={colors.TEXT} fontSize={13} fontFamily={UI}>7 faster</text>
              <circle cx={846} cy={246} r={5} fill={colors.WARM} />
              <text x={856} y={251} fill={colors.TEXT} fontSize={13} fontFamily={UI}>1 about the same</text>
              <circle cx={986} cy={246} r={5} fill={colors.NEGATIVE} />
              <text x={996} y={251} fill={colors.TEXT} fontSize={13} fontFamily={UI}>2 slower</text>
            </g>
          </g>
        )}

        {/* ======================== the crossover panel (beat 6) ======================== */}
        {xoOp > 0.001 && (
          <g opacity={xoOp}>
            <rect x={XP.x} y={XP.y} width={XP.w} height={XP.h} rx={10} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            <text x={XP.x + 16} y={XP.y + 22} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              one search vs RegExp · by document count
            </text>
            <g opacity={xoTag} transform={`translate(${XP.x + XP.w - 16}, ${XP.y + 22})`}>
              <text textAnchor="end" fill={colors.WARM} fontSize={13} fontWeight={600} fontFamily={UI}>
                interpolated
              </text>
            </g>
            {/* grid */}
            {XO_N.map((d) => (
              <g key={d}>
                <line x1={xn(d)} y1={XPLOT.yHi} x2={xn(d)} y2={XPLOT.yLo} stroke={colors.GRID} />
                <text x={xn(d)} y={XPLOT.yLo + 18} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {n(d)}
                </text>
              </g>
            ))}
            {[0.01, 0.1, 1, 10].map((v) => (
              <g key={v}>
                <line x1={XPLOT.x0} y1={yt(v)} x2={XPLOT.x1} y2={yt(v)} stroke={colors.GRID} />
                <text x={XPLOT.x0 - 6} y={yt(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {v >= 1 ? `${v} ms` : `${v}`}
                </text>
              </g>
            ))}
            {/* crossover bands */}
            <g opacity={xoB2b}>
              <rect x={xn(XO_BANDS.b2b[0])} y={XPLOT.yHi} width={xn(XO_BANDS.b2b[1]) - xn(XO_BANDS.b2b[0])} height={XPLOT.yLo - XPLOT.yHi} fill={colors.TEAL} fillOpacity={0.18} />
              <text x={(xn(XO_BANDS.b2b[0]) + xn(XO_BANDS.b2b[1])) / 2} y={XPLOT.yHi - 6} textAnchor="middle" fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                ~2,000–13,000
              </text>
            </g>
            <g opacity={xoPause}>
              <rect x={xn(XO_BANDS.pause[0])} y={XPLOT.yHi} width={xn(XO_BANDS.pause[1]) - xn(XO_BANDS.pause[0])} height={XPLOT.yLo - XPLOT.yHi} fill={colors.TEAL} fillOpacity={0.1} stroke={colors.TEAL} strokeOpacity={0.5} strokeDasharray="3 3" />
              <text x={(xn(XO_BANDS.pause[0]) + xn(XO_BANDS.pause[1])) / 2 + 8} y={XPLOT.yLo - 8} textAnchor="middle" fill={colors.TEAL} fontSize={12} fontFamily={MONO}>
                15,000–54,000
              </text>
            </g>
            {/* measured lines */}
            <path d={poly(XO_PTS.re)} fill="none" stroke={colors.ACCENT} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - xoLines} />
            <path d={poly(XO_PTS.b2b)} fill="none" stroke={colors.TEAL} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - xoLines} />
            <path d={poly(XO_PTS.pause)} fill="none" stroke={colors.TEAL} strokeWidth={2} strokeOpacity={0.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - xoLines} />
            {(['re', 'b2b', 'pause'] as const).map((k) =>
              XO_PTS[k].map(([x, y], i) => (
                <circle key={`${k}${i}`} cx={x} cy={y} r={3.5} fill={k === 're' ? colors.ACCENT : colors.TEAL} opacity={clamp01(xoLines * 4 - i)} />
              )),
            )}
            <g opacity={appear(xoLines, 0.7)}>
              <text x={XPLOT.x0 + 8} y={yt(XO.pause[0]) - 8} fill={colors.TEAL} fontSize={12} fontFamily={UI}>GPU after a pause</text>
              <text x={XPLOT.x0 + 8} y={yt(XO.b2b[0]) + 18} fill={colors.TEAL} fontSize={12} fontFamily={UI}>GPU back to back</text>
              <text x={xn(1000) + 8} y={yt(XO.re[1]) + 22} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>RegExp · error</text>
            </g>
            <text x={XP.x + 16} y={XP.y + XP.h - 8} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
              measured at four sizes · 8-state program
            </text>
          </g>
        )}

        {/* ======================== beat 9 · the review's red pen ======================== */}
        {claimsOp > 0.001 && (
          <g opacity={claimsOp}>
            <rect x={170} y={124} width={940} height={330} rx={12} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            <text x={200} y={162} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
              the review · first write-up → corrected
            </text>
            {CLAIMS.map((c, i) => {
              const y = CLAIM_Y[i];
              const st = clamp01(strike - i);
              const fx = clamp01(fix - i);
              const w = c.old.length * 6.9;
              return (
                <g key={i}>
                  <text x={200} y={y - 22} fill={colors.MUTED} fontSize={13} fontFamily={UI}>{c.what}</text>
                  <text x={200} y={y} fill={st > 0.99 ? colors.MUTED : colors.TEXT} fontSize={15} fontFamily={UI}>{c.old}</text>
                  <line x1={196} y1={y - 5} x2={196 + (w + 8) * st} y2={y - 5} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeLinecap="round" />
                  <g opacity={fx}>
                    <text x={622} y={y} fill={colors.MUTED} fontSize={15} fontFamily={UI}>→</text>
                    <text x={650} y={y} fill={colors.WARM} fontSize={15} fontFamily={UI}>{c.fix}</text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== beat 10 · the status ladder ======================== */}
        {ladderOp > 0.001 && (
          <g opacity={ladderOp}>
            <rect x={170} y={124} width={940} height={330} rx={12} fill={colors.PANEL} fillOpacity={0.97} stroke={colors.GRID} />
            <line x1={316} y1={150} x2={316} y2={432} stroke={colors.GRID} strokeWidth={2} />
            {RUNGS.map((r, i) => {
              const u = clamp01(ladder.u - i);
              const spot = i === 3 ? spotOpen : i === 2 ? spotHist : 0;
              const pulseK = i === 3 ? 0.7 + 0.3 * Math.cos(pulse * 2 * Math.PI) : 1;
              const bodyOp = lerp(WHISPER, 1, spot) * (i === 3 ? lerp(1, pulseK, spot) : 1);
              const y = RUNG_Y[i];
              return (
                <g key={r.name} opacity={u}>
                  <circle cx={316} cy={y - 5} r={6} fill={r.color} opacity={lerp(0.6, 1, spot)} />
                  <text x={296} y={y} textAnchor="end" fill={r.color} fontSize={16} fontWeight={600} fontFamily={UI}>{r.name}</text>
                  <g opacity={bodyOp}>
                    <text x={340} y={y} fill={colors.TEXT} fontSize={15} fontFamily={UI}>{r.lines[0]}</text>
                    <text x={340} y={y + 22} fill={i === 2 ? colors.WARM : colors.MUTED} fontSize={i === 2 ? 13 : 14} fontFamily={i === 2 ? MONO : UI}>{r.lines[1]}</text>
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== beat 11 · the recap ======================== */}
        {recapOp > 0.001 && (
          <g opacity={recapOp}>
            {RECAP.map((label, i) => {
              const u = clamp01(recap.u - i);
              const x = 150 + i * 255;
              return (
                <g key={label} opacity={u} transform={`translate(0, ${(1 - u) * 10})`}>
                  <rect x={x} y={176} width={225} height={52} rx={10} fill={colors.PANEL} stroke={i === 3 ? HOUND : colors.GRID} strokeWidth={i === 3 ? 2 : 1} />
                  <text x={x + 112} y={208} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={UI}>{label}</text>
                  {i < 3 && <text x={x + 240} y={208} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={UI}>→</text>}
                </g>
              );
            })}
            {SCORE.map((sc, i) => {
              const u = clamp01(score - i);
              const x = 250 + i * 290;
              return (
                <g key={sc.who} opacity={u}>
                  <rect x={x - 120} y={290} width={240} height={96} rx={12} fill={colors.PANEL} stroke={sc.color} strokeWidth={2} />
                  <text x={x} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI}>{sc.who}</text>
                  <text x={x} y={362} textAnchor="middle" fill={sc.color} fontSize={24} fontWeight={700} fontFamily={UI}>{sc.verdict}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== beat 12 · the honesty line ======================== */}
        {honest > 0.001 && (
          <g opacity={honest}>
            <rect x={150} y={140} width={980} height={330} rx={14} fill={colors.PANEL} stroke={HOUND} strokeWidth={2} />
            <text x={640} y={190} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={UI}>
              the lab’s own rule for a demo that searches a ton of JSON documents
            </text>
            <g opacity={honest1}>
              <text x={640} y={262} textAnchor="middle" fill={colors.POSITIVE} fontSize={30} fontWeight={600} fontFamily={UI}>
                honest if it says what it shows
              </text>
              <text x={640} y={296} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                the repo’s own programs · 11–16 ms per keystroke · 100,000 documents · every value equal to the CPU’s
              </text>
            </g>
            <g opacity={honest2}>
              <text x={640} y={370} textAnchor="middle" fill={colors.NEGATIVE} fontSize={24} fontWeight={600} fontFamily={UI}>
                not if it claims to beat RegExp on every pattern,
              </text>
              <text x={640} y={406} textAnchor="middle" fill={colors.NEGATIVE} fontSize={24} fontWeight={600} fontFamily={UI}>
                or JavaScript in several workers
              </text>
            </g>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space header ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        4 · Who Does It Beat
      </text>
      <g opacity={s.get(scene.tagU)}>
        <rect x={40} y={48} width={'100,000 documents'.length * CH13 + 20} height={22} rx={6} fill={colors.PANEL} stroke={HOUND} />
        <text x={50} y={64} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
          100,000 documents
        </text>
        <rect x={210} y={48} width={'one Apple M5 Max · headless Chrome 155'.length * 7.1 + 20} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={220} y={64} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
          one Apple M5 Max · headless Chrome 155
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
