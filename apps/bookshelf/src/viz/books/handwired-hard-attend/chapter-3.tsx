// Soft Versus Exact
//
// Hard Attend — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/hard-attend/hard-attend.ts:7-27 (the three items: names, values, accents), 46-48 (scoreFor),
//     58-71 (winnerIndexFor: strict >, ties go left), 73-78 (softmax with the beta scale), 136-146 (one-hot and
//     soft reads), 180 (the page's soft formula line)
//   lab/hard-attend/hard-attend.html:60-61 (sharpness slider: min 0.5, max 14, default 5)
//   lab/hard-attend/README.md:3 (weights move toward the one-hot bits), 7 (no tests; bun run start:hard-attend)
//   lab/status.md:257 ("Revisit hardAttend": indexed half covered by circuit.indexRead; scored half open;
//     no useful gradient for exact selection, soft mixtures, hardening checked separately)
//   lab/reassessment-2026-09-03.md:121 (gather lowering recognized retrieval after a selection was represented;
//     it learned no query/key scoring)
//   review.md probes: `bun test` → "0 test files matching"; `bun lab/hard-attend/hard-attend.ts` →
//     "ReferenceError: document is not defined"
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). Every weight, blend and exact value on screen is computed below from the
// page's own scoreFor / winnerIndexFor / softmax, and checked against the fact-check probes at module load.
// Per the fact-check, the dial stops at 14 (the page's top setting); it never runs on to 1000.
import 'katex/dist/katex.min.css';
import { color as d3color } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The page's arithmetic (hard-attend.ts:7-27, 46-78), verbatim in effect
// ---------------------------------------------------------------------------

const ITEMS = [
  { name: 'Aster', value: 10, accent: '#0c7f84' },
  { name: 'Banyan', value: 20, accent: '#a15c18' },
  { name: 'Cobalt', value: 30, accent: '#7545a0' },
];
/** the lab's accents are tuned for a light page: brighten them for text on the dark stage */
const INK = ITEMS.map((it) => d3color(it.accent)!.brighter(1.3).formatHex());
const SAND = '#c58a3d'; // the book's accent: everything softmax
const SAND_INK = '#e0aa5e';

const scoreFor = (q: number, j: number): number => 2 * q * j - j * j;
const scoresAt = (q: number): number[] => ITEMS.map((_, j) => scoreFor(q, j));
function winnerIndexFor(scores: readonly number[]): number {
  let winnerIndex = 0;
  let winnerScore = scores[0];
  for (let index = 1; index < scores.length; index++) {
    if (scores[index] > winnerScore) {
      winnerIndex = index;
      winnerScore = scores[index];
    }
  }
  return winnerIndex;
}
function softmax(scores: readonly number[], beta: number): number[] {
  const maxScore = Math.max(...scores);
  const weights = scores.map((score) => Math.exp((score - maxScore) * beta));
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w) => w / total);
}
const softRead = (q: number, beta: number): number =>
  softmax(scoresAt(q), beta).reduce((sum, w, j) => sum + w * ITEMS[j].value, 0);
const exactRead = (q: number): number => ITEMS[winnerIndexFor(scoresAt(q))].value;

const f4 = (v: number): string => (Math.abs(v) < 5e-5 ? '0.0000' : v.toFixed(4));
const f2 = (v: number): string => v.toFixed(2);
const sgn4 = (v: number): string => (Math.abs(v) < 5e-5 ? '0.0000' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(4)}`);

// the fact-check probes (review.md, ch.3 #3–#6): fail loudly if the arithmetic drifts
{
  const probe = (q: number, b: number, w: string, blend: string, exact: number) => {
    const got = softmax(scoresAt(q), b).map(f4).join(',');
    if (got !== w || f4(softRead(q, b)) !== blend || exactRead(q) !== exact) {
      throw new Error(`probe q=${q} beta=${b}: ${got} ${f4(softRead(q, b))} ${exactRead(q)}`);
    }
  };
  probe(0.25, 14, '0.9991,0.0009,0.0000', '10.0091', 10);
  probe(0.75, 14, '0.0009,0.9991,0.0000', '19.9909', 20);
  probe(0.5, 14, '0.5000,0.5000,0.0000', '15.0000', 10);
  probe(1.5, 14, '0.0000,0.5000,0.5000', '25.0000', 20);
  if (f4(softRead(0.25, 5)) !== '10.7586') throw new Error('probe q=0.25 beta=5');
}

const BETA_MIN = 0.5; // hard-attend.html:61
const BETA_MAX = 14;
const BETA_PAGE = 5;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// the query track, and the same track as the plot's x axis (beat 7)
const TRACK0 = { x0: 220, x1: 520, y: 140 };
const TRACK1 = { x0: 300, x1: 980, y: 490 };
const Q_TICKS = [0, 0.5, 1, 1.5, 2];

// weight bars sit under the track's item ticks
const COLX = [220, 370, 520];
const BAR_W = 64;
const BASE = 470;
const BAR_H = 220;
const BITS_Y = 222;
const TILE_Y = 520;

// the sharpness dial
const DIAL = { cx: 690, cy: 345, r: 72, a0: 210, a1: -30 };
const betaAngle = (b: number) => ((lerp(DIAL.a0, DIAL.a1, (b - BETA_MIN) / (BETA_MAX - BETA_MIN))) * Math.PI) / 180;
const dialPt = (a: number, r: number) => ({ x: DIAL.cx + r * Math.cos(a), y: DIAL.cy - r * Math.sin(a) });

// the blend meter (values 10..30), and the same meter as the plot's y axis (beat 7)
const AXIS0 = { x: 940, yLo: 470, yHi: 250 };
const AXIS1 = { x: 250, yLo: 460, yHi: 230 };

// the zoom loupe beside the meter
const LOUPE = { x: 975, y: 160, w: 260, h: 112 };
const LOUPE_SPAN = 0.02;

// plot (final scales, used once the morph has landed)
const PX = (q: number) => TRACK1.x0 + (q / 2) * (TRACK1.x1 - TRACK1.x0);
const PY = (v: number) => AXIS1.yLo - ((v - 10) / 20) * (AXIS1.yLo - AXIS1.yHi);
const CURVE_N = 400;
const curvePts = (beta: number): Array<[number, number]> =>
  Array.from({ length: CURVE_N + 1 }, (_, i) => {
    const q = (2 * i) / CURVE_N;
    return [PX(q), PY(softRead(q, beta))];
  });
const CURVE_14 = curvePts(BETA_MAX);
const CURVE_5 = curvePts(BETA_PAGE);
// the exact read as a step: closed ends sit on the left winner (ties go left)
const STEP = [
  { q0: 0, q1: 0.5, v: exactRead(0.25) },
  { q0: 0.5, q1: 1.5, v: exactRead(1) },
  { q0: 1.5, q1: 2, v: exactRead(1.75) },
];
const TIES = [0.5, 1.5].map((q) => ({ q, soft: softRead(q, BETA_MAX), exact: exactRead(q) }));

// status ledger
const LEDGER = { x: 140, y: 92, w: 1000, h: 440 };
const ROW = { label: 165, code: 360, status: 905 };

// recap strip
const RECAP = ['score by closeness', 'pick the leftmost highest', 'read the value two agreeing ways'];
const RECAP_W = RECAP.map((t) => t.length * 9.6 + 36);
const RECAP_GAP = 54;
const RECAP_X0 = 640 - (RECAP_W.reduce((a, b) => a + b, 0) + RECAP_GAP * 2) / 2;
const RECAP_XS = RECAP_W.map((_, i) => RECAP_X0 + RECAP_W.slice(0, i).reduce((a, b) => a + b, 0) + RECAP_GAP * i);

const HOME: CameraState = CAMERA_HOME;
const CAM_BARS: CameraState = { x: 430, y: 330, k: 1.2 };
const CAM_DIAL: CameraState = { x: 690, y: 330, k: 1.12 };
const CAM_READ: CameraState = { x: 700, y: 330, k: 1.12 };
const CAM_ROW3: CameraState = { x: 640, y: 370, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, ≈134 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_BARS, cameraInterp);
  const q = tl.channel('query', 0.25);
  const beta = tl.channel('sharpness', BETA_MIN);

  // the machine
  const trackU = tl.channel('trackU', 0);
  const pinU = tl.channel('pinU', 0);
  const tilesU = tl.channel('tilesU', 0);
  const scoresU = tl.channel('scoreChips', 0);
  const barsU = tl.channel('barsU', 0);
  const texU = tl.channel('texSoftmax', 0);
  const sumU = tl.channel('sumTag', 0);
  const axisU = tl.channel('blendAxisU', 0);
  const softMk = tl.channel('softMarker', 0);
  const formulaU = tl.channel('formulaU', 0);
  const dialU = tl.channel('dialU', 0);
  const exactU = tl.channel('exactU', 0);
  const loupeU = tl.channel('loupeU', 0);
  const rulerU = tl.channel('loupeRuler', 0);
  const tieTag = tl.channel('tieTag', 0);
  const pageMax = tl.channel('pageMaxTag', 0);
  const leftTag = tl.channel('leftTag', 0);
  const machOp = tl.channel('machineOp', 1);
  // the plot
  const plotU = tl.channel('plotMorph', 0);
  const stepU = tl.channel('stepDraw', 0);
  const sweepU = tl.channel('curveSweep', 0);
  const beta5U = tl.channel('curveBeta5', 0);
  const tieMk = tl.channel('tieMarks', 0);
  const legendU = tl.channel('legendU', 0);
  const plotOp = tl.channel('plotOp', 1);
  // the ledger
  const ledgerU = tl.channel('ledgerU', 0);
  const row1U = tl.channel('row1U', 0);
  const row2U = tl.channel('row2U', 0);
  const browserU = tl.channel('browserTag', 0);
  const row3U = tl.channel('row3U', 0);
  const splitU = tl.channel('splitU', 0);
  const coveredU = tl.channel('coveredU', 0);
  const gatherU = tl.channel('gatherNote', 0);
  const crossU = tl.channel('crossU', 0);
  const pulse = tl.channel('openPulse', 0);
  const cautionU = tl.channel('cautionU', 0);
  const ledgerOp = tl.channel('ledgerOp', 1);
  // the recap
  const recapU = tl.channel('recapU', 0);
  const recapSub = tl.channel('recapSub', 0);
  const questionU = tl.channel('questionU', 0);

  // — B1 · softmax: every score becomes a weight, the weights sum to one, the value is a blend —
  tl.caption({ at: 0.4, dur: 12.4, text: 'The page adds a third read, softmax. It turns every score into a weight, the weights add up to one, and the value is the blend of all three items.' });
  tl.tween(trackU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(pinU, 1, { at: 1.3, dur: 0.6, ease: ease.enter });
  tl.tween(tilesU, 1, { at: 1.4, dur: 1.0, ease: ease.enter });
  tl.tween(scoresU, 1, { at: 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(texU, 1, { at: 3.6, dur: 0.7, ease: ease.enter });
  tl.tween(barsU, 1, { at: 4.4, dur: 1.4, ease: ease.move });
  tl.tween(scoresU, 0.35, { at: 5.6, dur: 0.6, ease: ease.move });
  tl.tween(sumU, 1, { at: 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, HOME, { at: 7.4, dur: 1.3, ease: ease.move });
  tl.tween(axisU, 1, { at: 8.2, dur: 1.2, ease: ease.draw });
  tl.tween(softMk, 1, { at: 9.2, dur: 0.6, ease: ease.enter });
  tl.tween(formulaU, 1, { at: 10.0, dur: 0.6, ease: ease.enter });
  tl.hold(12.8, 0.7);

  // — B2 · the sharpness dial, 0.5 to 14: turning it up makes the weights spiky —
  tl.caption({ at: 13.5, dur: 9.6, text: 'A sharpness slider scales the score gaps before the exponential, from one half up to fourteen. Turning it up makes the weights spikier.' });
  for (const ch of [texU, formulaU, scoresU]) tl.tween(ch, 0, { at: 13.5, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_DIAL, { at: 13.6, dur: 1.3, ease: ease.move });
  tl.tween(dialU, 1, { at: 14.0, dur: 0.8, ease: ease.enter });
  tl.tween(beta, BETA_MAX, { at: 18.2, dur: 3.4, ease: ease.move });
  tl.hold(23.1, 0.7);

  // — B3 · q = 0.25, sharpness 14: Aster ≈ 0.9991, blend 10.0091 against the exact 10 —
  tl.caption({ at: 23.8, dur: 12.4, text: 'At a query of one quarter and sharpness fourteen, Aster gets nearly all the weight. The blend is about ten point zero one: close to ten, never exactly ten.' });
  tl.tween(cam, CAM_READ, { at: 23.9, dur: 1.2, ease: ease.move });
  tl.tween(exactU, 1, { at: 26.6, dur: 0.7, ease: ease.enter });
  tl.tween(loupeU, 1, { at: 29.6, dur: 0.7, ease: ease.enter });
  tl.tween(rulerU, 1, { at: 30.0, dur: 0.8, ease: ease.draw });
  tl.hold(36.2, 0.7);

  // — B4 · q = 0.75: it flips to Banyan, 19.9909 against the exact 20 —
  tl.caption({ at: 36.9, dur: 11.0, text: 'At three quarters it flips toward Banyan. The blend is about nineteen point nine nine, near the exact answer of twenty but not equal to it.' });
  tl.tween(rulerU, 0, { at: 36.9, dur: 0.4, ease: ease.move });
  tl.tween(q, 0.75, { at: 37.2, dur: 1.4, ease: ease.move });
  tl.tween(rulerU, 1, { at: 38.8, dur: 0.6, ease: ease.enter });
  tl.hold(47.9, 0.7);

  // — B5 · away from ties more sharpness closes the gap; at a tie (q = 0.5) the split stays even —
  tl.caption({ at: 48.6, dur: 13.2, text: 'Away from ties, more sharpness pulls the blend toward the exact value. At a tie it cannot: at one half, Aster and Banyan split the weight evenly at any sharpness, giving fifteen.' });
  tl.tween(rulerU, 0, { at: 48.6, dur: 0.4, ease: ease.move });
  tl.tween(q, 0.25, { at: 48.8, dur: 1.2, ease: ease.move });
  tl.tween(beta, BETA_PAGE, { at: 48.8, dur: 1.2, ease: ease.move });
  tl.tween(beta, BETA_MAX, { at: 50.6, dur: 3.2, ease: ease.move });
  tl.tween(q, 0.5, { at: 55.0, dur: 1.2, ease: ease.move });
  tl.tween(beta, BETA_PAGE, { at: 55.0, dur: 1.2, ease: ease.move });
  tl.tween(tieTag, 1, { at: 56.4, dur: 0.6, ease: ease.enter });
  tl.tween(beta, BETA_MAX, { at: 57.2, dur: 3.0, ease: ease.move });
  tl.tween(pageMax, 1, { at: 60.0, dur: 0.5, ease: ease.enter });
  tl.hold(61.8, 0.7);

  // — B6 · q = 1.5: an even split again, 25 against the exact 20 (ties go left) —
  tl.caption({ at: 62.5, dur: 10.8, text: 'At one and a half, the same even split gives twenty-five where the exact rule gives twenty. Softmax averages ties; the exact rule picks the left.' });
  tl.tween(tieTag, 0, { at: 62.5, dur: 0.4, ease: ease.move });
  tl.tween(pageMax, 0, { at: 62.5, dur: 0.4, ease: ease.move });
  tl.tween(q, 1.5, { at: 62.8, dur: 1.4, ease: ease.move });
  tl.tween(tieTag, 1, { at: 64.6, dur: 0.6, ease: ease.enter });
  tl.tween(leftTag, 1, { at: 68.4, dur: 0.6, ease: ease.enter });
  tl.hold(73.3, 0.7);

  // — B7 · the same track and meter become a plot: the soft curve bends toward the step, never at the ties —
  tl.caption({ at: 74.0, dur: 7.8, text: 'That is the contrast. Softmax only approaches the exact read, and exact picking needs an explicit tie rule.' });
  tl.tween(cam, HOME, { at: 74.0, dur: 1.3, ease: ease.move });
  for (const ch of [tieTag, leftTag, loupeU]) tl.tween(ch, 0, { at: 74.0, dur: 0.4, ease: ease.move });
  tl.tween(machOp, 0, { at: 74.0, dur: 0.8, ease: ease.move });
  tl.tween(plotU, 1, { at: 74.3, dur: 1.4, ease: ease.move });
  tl.tween(q, 0, { at: 74.3, dur: 1.4, ease: ease.move });
  tl.tween(stepU, 1, { at: 75.8, dur: 1.2, ease: ease.draw });
  tl.tween(legendU, 1, { at: 76.2, dur: 0.6, ease: ease.enter });
  tl.tween(q, 2, { at: 77.0, dur: 2.6, ease: ease.linear });
  tl.tween(sweepU, 1, { at: 77.0, dur: 2.6, ease: ease.linear });
  tl.tween(beta5U, 1, { at: 79.4, dur: 0.8, ease: ease.enter });
  tl.tween(tieMk, 1, { at: 80.0, dur: 0.7, ease: ease.enter });
  tl.hold(81.8, 1.2);

  // — B8 · the stage clears: no tests, and it needs a browser —
  tl.caption({ at: 83.0, dur: 9.6, text: 'The folder has no tests, and the page needs a browser, so it cannot run in a terminal. It is a teaching sketch.' });
  tl.tween(plotOp, 0, { at: 83.0, dur: 0.8, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 83.4, dur: 0.7, ease: ease.enter });
  tl.tween(row1U, 1, { at: 84.0, dur: 0.6, ease: ease.enter });
  tl.tween(row2U, 1, { at: 86.4, dur: 0.6, ease: ease.enter });
  tl.tween(browserU, 1, { at: 89.0, dur: 0.6, ease: ease.enter });
  tl.hold(92.6, 0.7);

  // — B9 · the old plan's two halves: indexed half covered; gather lowering learned no scoring —
  tl.caption({ at: 93.3, dur: 12.4, text: "The old plan's indexed half, reading at a chosen position, is now covered by index reads. Gather lowering found hard attention after a selection was made, but learned no scoring." });
  tl.tween(cam, CAM_ROW3, { at: 93.3, dur: 1.3, ease: ease.move });
  tl.tween(row3U, 1, { at: 93.6, dur: 0.6, ease: ease.enter });
  tl.tween(splitU, 1, { at: 94.4, dur: 1.0, ease: ease.move });
  tl.tween(coveredU, 1, { at: 97.4, dur: 0.6, ease: ease.pop });
  tl.tween(gatherU, 1, { at: 100.0, dur: 0.7, ease: ease.enter });
  tl.tween(crossU, 1, { at: 103.4, dur: 0.6, ease: ease.draw });
  tl.hold(105.7, 0.7);

  // — B10 · the scored half stays open; the caution: no useful gradient, so soft mixtures —
  tl.caption({ at: 106.4, dur: 12.0, text: 'The scored half, learning a shared scoring rule from changing data, stays open. The notes warn exact selection has no useful gradient, so training would go through soft mixtures.' });
  [107.0, 108.2, 109.4].forEach((at) => {
    tl.tween(pulse, 1, { at, dur: 0.5, ease: ease.enter });
    tl.tween(pulse, 0.55, { at: at + 0.6, dur: 0.5, ease: ease.move });
  });
  tl.tween(cautionU, 1, { at: 111.4, dur: 0.8, ease: ease.enter });
  tl.hold(118.4, 0.7);

  // — B11 · the journey, and the open question —
  tl.caption({ at: 119.1, dur: 12.0, text: 'So the journey: score by closeness, pick the leftmost highest, and read the value two agreeing ways. Whether a circuit can learn those scores is still an open question.' });
  tl.tween(cam, HOME, { at: 119.1, dur: 1.3, ease: ease.move });
  tl.tween(ledgerOp, 0, { at: 119.1, dur: 0.8, ease: ease.move });
  tl.tween(recapU, 1, { at: 119.8, dur: 2.4, ease: ease.linear });
  tl.tween(recapSub, 1, { at: 123.6, dur: 0.6, ease: ease.enter });
  tl.tween(questionU, 1, { at: 126.8, dur: 0.8, ease: ease.enter });
  tl.hold(131.1, 2.5);

  return {
    tl, cam, q, beta, trackU, pinU, tilesU, scoresU, barsU, texU, sumU, axisU, softMk, formulaU, dialU, exactU,
    loupeU, rulerU, tieTag, pageMax, leftTag, machOp, plotU, stepU, sweepU, beta5U, tieMk, legendU, plotOp,
    ledgerU, row1U, row2U, browserU, row3U, splitU, coveredU, gatherU, crossU, pulse, cautionU, ledgerOp,
    recapU, recapSub, questionU,
  };
}

const scene = buildScene();

/** per-item progress from one group channel: item i starts `each` seconds after item i-1. */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

function Pill({ x, y, text, stroke, fill = colors.PANEL, ink, size = 13, mono = false, opacity = 1, anchor = 'start' }: {
  x: number; y: number; text: string; stroke: string; fill?: string; ink: string; size?: number; mono?: boolean;
  opacity?: number; anchor?: 'start' | 'middle';
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? size * 0.6 : size * 0.56) + 20;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size * 0.95} width={w} height={size * 1.6} rx={size * 0.8} fill={fill} stroke={stroke} strokeWidth={1.4} />
      <text x={x0 + w / 2} y={y + size * 0.1} textAnchor="middle" fontSize={size} fontFamily={mono ? MONO : undefined} fill={ink}>
        {text}
      </text>
    </g>
  );
}

function CodeLine({ x, y, text, ink = colors.TEXT, size = 14 }: { x: number; y: number; text: string; ink?: string; size?: number }) {
  return (
    <text x={x} y={y} fontSize={size} fontFamily={MONO} fill={ink} xmlSpace="preserve">
      {text}
    </text>
  );
}

/** a triangle pointing right whose tip sits at (x, y) */
const triRight = (x: number, y: number, s = 9) => `${x},${y} ${x - s * 1.4},${y - s} ${x - s * 1.4},${y + s}`;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const q = v(scene.q);
  const beta = v(scene.beta);
  const scores = scoresAt(q);
  const weights = softmax(scores, beta);
  const winner = winnerIndexFor(scores);
  const blend = softRead(q, beta);
  const exact = ITEMS[winner].value;

  const plotU = v(scene.plotU);
  const plotIn = clamp01((plotU - 0.75) / 0.25);
  const plotOp = v(scene.plotOp);
  const machOp = v(scene.machOp);

  // the track and the meter both glide into the plot's axes
  const tx0 = lerp(TRACK0.x0, TRACK1.x0, plotU);
  const tx1 = lerp(TRACK0.x1, TRACK1.x1, plotU);
  const ty = lerp(TRACK0.y, TRACK1.y, plotU);
  const TX = (qq: number) => tx0 + (qq / 2) * (tx1 - tx0);
  const ax = lerp(AXIS0.x, AXIS1.x, plotU);
  const ayLo = lerp(AXIS0.yLo, AXIS1.yLo, plotU);
  const ayHi = lerp(AXIS0.yHi, AXIS1.yHi, plotU);
  const AY = (val: number) => ayLo - ((val - 10) / 20) * (ayLo - ayHi);
  // axis labels dip out mid-flight so the moving track and meter never read through each other
  const lblOp = plotU < 0.15 || plotU > 0.85 ? 1 : 0;

  const trackU = v(scene.trackU);
  const pinU = v(scene.pinU);
  const tilesU = v(scene.tilesU);
  const barsU = v(scene.barsU);
  const axisU = v(scene.axisU);
  const softMk = v(scene.softMk);
  const exactU = v(scene.exactU) * machOp;
  const dialU = v(scene.dialU) * machOp;
  const loupeU = v(scene.loupeU) * machOp;
  const rulerU = v(scene.rulerU) * loupeU;
  const sweepU = v(scene.sweepU);

  // the loupe: ±0.02 around the exact read
  const LX0 = LOUPE.x + 26;
  const LX1 = LOUPE.x + LOUPE.w - 26;
  const LY = LOUPE.y + 62;
  const LXv = (val: number) => lerp(LX0, LX1, (val - (exact - LOUPE_SPAN)) / (2 * LOUPE_SPAN));
  const loupeSoftX = LXv(blend);
  const loupeSoftIn = loupeSoftX >= LX0 - 1 && loupeSoftX <= LX1 + 1;

  // dial
  const aB = betaAngle(beta);
  const needle = dialPt(aB, DIAL.r - 14);
  const arcPath = (a0d: number, a1: number, r: number) => {
    const p0 = dialPt((a0d * Math.PI) / 180, r);
    const p1 = dialPt(a1, r);
    const sweepDeg = a0d - (a1 * 180) / Math.PI;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
  };

  // plot curve reveal: drawn up to the sweeping query
  const nShow = Math.round(CURVE_N * clamp01(sweepU));
  const pts14 = CURVE_14.slice(0, nShow + 1);
  const ledgerOp = v(scene.ledgerU) * v(scene.ledgerOp);
  const pulse = v(scene.pulse);
  const recapU = v(scene.recapU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the plot (beat 7): soft curves against the exact step ================= */}
        {plotIn > 0.005 && plotOp > 0.005 && (
          <g opacity={plotIn * plotOp}>
            {[15, 25].map((val) => (
              <line key={val} x1={AXIS1.x} y1={PY(val)} x2={TRACK1.x1} y2={PY(val)} stroke={colors.GRID} strokeWidth={1} />
            ))}
            {/* exact step: closed dot on the left winner, open dot where the next item takes over */}
            {STEP.map((seg, i) => {
              const u = staggerU(v(scene.stepU), i, 3, 0.25, 0.6);
              if (u <= 0) return null;
              return (
                <line key={i} x1={PX(seg.q0)} y1={PY(seg.v)} x2={lerp(PX(seg.q0), PX(seg.q1), u)} y2={PY(seg.v)} stroke={colors.TEXT} strokeWidth={3} strokeLinecap="round" />
              );
            })}
            {v(scene.stepU) > 0.6 &&
              TIES.map((t) => (
                <g key={t.q} opacity={clamp01((v(scene.stepU) - 0.6) / 0.4)}>
                  <circle cx={PX(t.q)} cy={PY(t.exact)} r={6} fill={colors.TEXT} />
                  <circle cx={PX(t.q)} cy={PY(t.exact + 10)} r={5.5} fill={colors.BG} stroke={colors.TEXT} strokeWidth={2} />
                </g>
              ))}
            {/* page default sharpness, faint */}
            <polyline points={CURVE_5.map((p) => p.join(',')).join(' ')} fill="none" stroke={SAND} strokeWidth={2} strokeDasharray="5 5" opacity={0.45 * v(scene.beta5U)} />
            {/* sharpness 14, traced by the query sweep */}
            {nShow > 0 && <polyline points={pts14.map((p) => p.join(',')).join(' ')} fill="none" stroke={SAND} strokeWidth={3.5} strokeLinejoin="round" />}
            {/* the ties: the soft curve sits halfway, the step does not */}
            {v(scene.tieMk) > 0.005 &&
              TIES.map((t) => (
                <g key={t.q} opacity={v(scene.tieMk)}>
                  <line x1={PX(t.q)} y1={PY(t.soft)} x2={PX(t.q)} y2={PY(t.exact)} stroke={colors.WARM} strokeWidth={2} strokeDasharray="3 4" />
                  <circle cx={PX(t.q)} cy={PY(t.soft)} r={6.5} fill={SAND} stroke={colors.BG} strokeWidth={2} />
                  <text x={PX(t.q) + 14} y={(PY(t.soft) + PY(t.exact)) / 2 + 5} fontSize={14} fontFamily={MONO} fill={colors.WARM} stroke={colors.BG} strokeWidth={4} paintOrder="stroke">
                    {`${t.soft.toFixed(0)} vs ${t.exact}`}
                  </text>
                </g>
              ))}
            {v(scene.tieMk) > 0.005 && (
              <g opacity={v(scene.tieMk)}>
                <line x1={PX(0.5) - 10} y1={PY(10) - 10} x2={410} y2={326} stroke={colors.TEXT} strokeWidth={1.2} opacity={0.7} />
                <text x={404} y={318} textAnchor="end" fontSize={16} fill={colors.TEXT}>
                  explicit tie rule
                </text>
                <text x={404} y={298} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                  score {'>'} winnerScore
                </text>
              </g>
            )}
            {/* legend */}
            {v(scene.legendU) > 0.005 && (
              <g opacity={v(scene.legendU)} fontSize={14}>
                <line x1={1010} y1={250} x2={1040} y2={250} stroke={colors.TEXT} strokeWidth={3} />
                <text x={1050} y={255} fill={colors.TEXT}>exact (winnerIndexFor)</text>
                <line x1={1010} y1={280} x2={1040} y2={280} stroke={SAND} strokeWidth={3.5} />
                <text x={1050} y={285} fill={SAND_INK}>softmax, sharpness 14</text>
                <g opacity={v(scene.beta5U)}>
                  <line x1={1010} y1={310} x2={1040} y2={310} stroke={SAND} strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
                  <text x={1050} y={315} fill={colors.MUTED}>sharpness 5 (page default)</text>
                </g>
              </g>
            )}
            {sweepU > 0.002 && sweepU < 0.998 && <circle cx={PX(q)} cy={PY(blend)} r={6} fill={SAND} stroke={colors.BG} strokeWidth={2} />}
          </g>
        )}

        {/* ================= the query track (becomes the plot's x axis) ================= */}
        {trackU > 0.005 && plotOp > 0.005 && (
          <g opacity={plotU > 0.01 ? plotOp : 1}>
            <line x1={tx0} y1={ty} x2={lerp(tx0, tx1 + 16, clamp01(trackU))} y2={ty} stroke={colors.MUTED} strokeWidth={2} />
            {Q_TICKS.map((t, i) => {
              const op = staggerU(trackU, i, 5, 0.12, 0.5);
              const isItem = Number.isInteger(t);
              return (
                <g key={t} opacity={op}>
                  <line x1={TX(t)} y1={ty - (isItem ? 7 : 4)} x2={TX(t)} y2={ty + (isItem ? 7 : 4)} stroke={colors.MUTED} strokeWidth={1.5} />
                  <text x={TX(t)} y={ty + 24} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={lblOp}>
                    {t}
                  </text>
                  {isItem && plotU > 0.01 && (
                    <text x={TX(t)} y={ty + 44} textAnchor="middle" fontSize={14} fill={INK[t]} opacity={plotU * lblOp}>
                      {ITEMS[t].name}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={tx1 + 26} y={ty + 5} fontSize={15} fill={colors.MUTED} fontStyle="italic" opacity={trackU * lblOp}>
              query
            </text>
            {pinU > 0.005 && (plotU < 0.02 || plotU > 0.98) && sweepU < 0.998 && (
              <g opacity={pinU}>
                <line x1={TX(q)} y1={ty - 18} x2={TX(q)} y2={ty} stroke={SAND} strokeWidth={2.5} />
                <circle cx={TX(q)} cy={ty - 22} r={7} fill={SAND} />
                {plotU < 0.02 && (
                  <text x={TX(q)} y={ty - 36} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={SAND_INK}>
                    q = {f2(q)}
                  </text>
                )}
              </g>
            )}
          </g>
        )}

        {/* ================= the machine: weights, exact bits, dial, meter ================= */}
        {machOp > 0.005 && (
          <g opacity={machOp}>
            {/* score chips (chapter 2's bars, now feeding the exponential) */}
            {v(scene.scoresU) > 0.005 &&
              COLX.map((x, j) => (
                <text key={j} x={x} y={BITS_Y + 6} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.scoresU)}>
                  score {scores[j] === 0 ? '0' : scores[j].toString().replace('-', '−')}
                </text>
              ))}
            {/* exact one-hot: the winner's bit, and a dashed full-height ghost bar */}
            {exactU > 0.005 && (
              <g opacity={exactU}>
                {COLX.map((x, j) => (
                  <g key={j}>
                    <circle cx={x} cy={BITS_Y} r={11} fill={j === winner ? colors.TEXT : colors.BG} stroke={colors.TEXT} strokeWidth={1.6} />
                    <text x={x} y={BITS_Y + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={j === winner ? '#0a0e1a' : colors.TEXT}>
                      {j === winner ? 1 : 0}
                    </text>
                  </g>
                ))}
                <rect x={COLX[winner] - BAR_W / 2 - 5} y={BASE - BAR_H} width={BAR_W + 10} height={BAR_H} rx={4} fill="none" stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="5 5" opacity={0.6} />
                <text x={COLX[2] + 44} y={BITS_Y + 5} fontSize={14} fill={colors.TEXT}>
                  exact
                </text>
              </g>
            )}
            {/* the weight bars */}
            {COLX.map((x, j) => {
              const h = BAR_H * weights[j] * barsU;
              return (
                <g key={j} opacity={tilesU}>
                  <line x1={x - BAR_W / 2 - 8} y1={BASE} x2={x + BAR_W / 2 + 8} y2={BASE} stroke={colors.MUTED} strokeWidth={1.5} />
                  {h > 0.2 && <rect x={x - BAR_W / 2} y={BASE - h} width={BAR_W} height={h} rx={3} fill={ITEMS[j].accent} stroke={INK[j]} strokeWidth={1.2} />}
                  <text x={x} y={BASE + 22} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={INK[j]} opacity={barsU}>
                    {f4(weights[j] * 1)}
                  </text>
                  <rect x={x - 52} y={TILE_Y - 2} width={104} height={30} rx={6} fill={colors.PANEL} stroke={INK[j]} strokeWidth={1.4} />
                  <text x={x} y={TILE_Y + 18} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
                    <tspan fill={INK[j]}>{ITEMS[j].name}</tspan>
                    <tspan fontFamily={MONO}>{`  ${ITEMS[j].value}`}</tspan>
                  </text>
                </g>
              );
            })}
            {v(scene.sumU) > 0.005 && (
              <text x={COLX[2] + 44} y={BASE - 4} fontSize={14} fill={SAND_INK} opacity={v(scene.sumU)}>
                softmax · Σ = 1
              </text>
            )}
            <MathLabel
              tex={'w_j=\\dfrac{e^{\\beta\\,(s_j-\\max s)}}{\\sum_k e^{\\beta\\,(s_k-\\max s)}}'}
              x={750}
              y={200}
              fontSize={22}
              boxWidth={420}
              color={colors.TEXT}
              opacity={v(scene.texU)}
            />
            {v(scene.formulaU) > 0.005 && (
              <text x={COLX[0] - 40} y={584} fontSize={14} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.formulaU)}>
                {`${weights.map(f2).join(', ')} x [10, 20, 30] = `}
                <tspan fill={SAND_INK}>{f2(blend)}</tspan>
              </text>
            )}

            {/* the sharpness dial */}
            {dialU > 0.005 && (
              <g opacity={dialU}>
                <path d={arcPath(DIAL.a0, (DIAL.a1 * Math.PI) / 180, DIAL.r)} fill="none" stroke={colors.GRID} strokeWidth={10} strokeLinecap="round" />
                <path d={arcPath(DIAL.a0, aB, DIAL.r)} fill="none" stroke={SAND} strokeWidth={10} strokeLinecap="round" />
                {[BETA_MIN, BETA_PAGE, BETA_MAX].map((b) => {
                  const a = betaAngle(b);
                  const p0 = dialPt(a, DIAL.r + 8);
                  const p1 = dialPt(a, DIAL.r + 14);
                  const pl = dialPt(a, DIAL.r + 28);
                  return (
                    <g key={b}>
                      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={colors.MUTED} strokeWidth={1.5} />
                      <text x={pl.x} y={pl.y + 5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                        {b}
                      </text>
                    </g>
                  );
                })}
                <line x1={DIAL.cx} y1={DIAL.cy} x2={needle.x} y2={needle.y} stroke={colors.TEXT} strokeWidth={3} strokeLinecap="round" />
                <circle cx={DIAL.cx} cy={DIAL.cy} r={6} fill={colors.TEXT} />
                <text x={DIAL.cx} y={DIAL.cy - DIAL.r - 36} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
                  sharpness
                </text>
                <text x={DIAL.cx} y={DIAL.cy + 36} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={SAND_INK}>
                  β = {beta.toFixed(1)}
                </text>
                {v(scene.pageMax) > 0.005 && (
                  <text x={DIAL.cx} y={DIAL.cy + 58} textAnchor="middle" fontSize={13} fill={colors.MUTED} opacity={v(scene.pageMax)}>
                    14 is the page's top setting
                  </text>
                )}
              </g>
            )}

            {/* tie tag (q = 0.5 and q = 1.5): two equal weights */}
            {v(scene.tieTag) > 0.005 && (() => {
              const pair = winner === 0 ? [0, 1] : [1, 2];
              const xm = (COLX[pair[0]] + COLX[pair[1]]) / 2;
              const y = BASE - BAR_H * weights[pair[0]] - 30;
              return (
                <g opacity={v(scene.tieTag)}>
                  <line x1={COLX[pair[0]]} y1={y + 12} x2={COLX[pair[1]]} y2={y + 12} stroke={colors.WARM} strokeWidth={1.5} />
                  <text x={xm} y={y} textAnchor="middle" fontSize={15} fill={colors.WARM} stroke={colors.BG} strokeWidth={4} paintOrder="stroke">
                    {`${ITEMS[pair[0]].name} = ${ITEMS[pair[1]].name} · ${f4(weights[pair[0]])} each`}
                  </text>
                </g>
              );
            })()}
            {v(scene.leftTag) > 0.005 && (
              <g opacity={v(scene.leftTag)}>
                {/* Aster's column is empty at q = 1.5: the tie rule sits there */}
                <text x={COLX[0] + 10} y={360} textAnchor="middle" fontSize={16} fill={colors.TEXT}>ties go left:</text>
                <text x={COLX[0] + 10} y={382} textAnchor="middle" fontSize={16} fill={colors.TEXT}>Banyan keeps the lead</text>
                <path d={`M ${COLX[0] + 70} 330 Q ${COLX[1] - 40} 290 ${COLX[1] - 18} ${BITS_Y + 10}`} fill="none" stroke={colors.TEXT} strokeWidth={1.3} opacity={0.7} />
              </g>
            )}
          </g>
        )}

        {/* ================= the blend meter (becomes the plot's y axis) ================= */}
        {axisU > 0.005 && plotOp > 0.005 && (
          <g opacity={plotU > 0.01 ? plotOp : 1}>
            <line x1={ax} y1={ayLo + 10} x2={ax} y2={lerp(ayLo + 10, ayHi - 10, clamp01(axisU))} stroke={colors.MUTED} strokeWidth={2} />
            {ITEMS.map((it, j) => {
              const y = AY(it.value);
              const op = staggerU(axisU, j, 3, 0.2, 0.5);
              return (
                <g key={j} opacity={op}>
                  <line x1={ax - 6} y1={y} x2={ax + 6} y2={y} stroke={colors.MUTED} strokeWidth={1.5} />
                  <text x={ax + 14} y={y + 5} fontSize={14} fontFamily={MONO} fill={INK[j]} opacity={(1 - plotU) * lblOp}>
                    {it.value}
                  </text>
                  <text x={ax - 14} y={y + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={INK[j]} opacity={plotU * lblOp}>
                    {it.value}
                  </text>
                </g>
              );
            })}
            <text x={ax} y={ayHi - 24} textAnchor="middle" fontSize={16} fill={colors.TEXT} opacity={axisU * lblOp}>
              blend
            </text>
            {/* exact ghost marker */}
            {exactU > 0.005 && (
              <g opacity={exactU}>
                <circle cx={ax} cy={AY(exact)} r={9} fill="none" stroke={colors.TEXT} strokeWidth={2} strokeDasharray="3 3" />
                <text x={ax + 46} y={AY(exact) + 5} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                  exact {exact}
                </text>
              </g>
            )}
            {/* softmax marker */}
            {softMk > 0.005 && (
              <g opacity={softMk}>
                <polygon points={triRight(ax - 4, AY(blend))} fill={SAND} />
                <text x={ax - 22} y={AY(blend) + 5} textAnchor="end" fontSize={15} fontFamily={MONO} fill={SAND_INK} opacity={(1 - plotU) * lblOp}>
                  {plotU > 0.01 ? f2(blend) : `softmax ${f4(blend)}`}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the loupe: the gap the meter cannot show ================= */}
        {loupeU > 0.005 && (
          <g opacity={loupeU}>
            <line x1={LOUPE.x} y1={LOUPE.y + LOUPE.h} x2={AXIS0.x + 12} y2={AY(exact) - 8} stroke={colors.MUTED} strokeWidth={1} opacity={0.5} />
            <rect x={LOUPE.x} y={LOUPE.y} width={LOUPE.w} height={LOUPE.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={LOUPE.x + 14} y={LOUPE.y + 22} fontSize={13} fill={colors.MUTED}>
              zoom: exact ± {LOUPE_SPAN}
            </text>
            {rulerU > 0.005 && (
              <g opacity={rulerU}>
                <line x1={LX0} y1={LY} x2={LX1} y2={LY} stroke={colors.MUTED} strokeWidth={1.5} />
                {[-LOUPE_SPAN, 0, LOUPE_SPAN].map((d) => (
                  <g key={d}>
                    <line x1={LXv(exact + d)} y1={LY - 5} x2={LXv(exact + d)} y2={LY + 5} stroke={colors.MUTED} strokeWidth={1.2} />
                    {d !== 0 && (
                      <text x={LXv(exact + d)} y={LY + 21} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                        {(exact + d).toFixed(2)}
                      </text>
                    )}
                  </g>
                ))}
                <circle cx={LXv(exact)} cy={LY} r={8} fill="none" stroke={colors.TEXT} strokeWidth={2} strokeDasharray="3 3" />
                {loupeSoftIn && (
                  <>
                    <line x1={Math.min(loupeSoftX, LXv(exact))} y1={LY - 16} x2={Math.max(loupeSoftX, LXv(exact))} y2={LY - 16} stroke={colors.WARM} strokeWidth={2} />
                    <polygon points={`${loupeSoftX},${LY - 3} ${loupeSoftX - 7},${LY - 13} ${loupeSoftX + 7},${LY - 13}`} fill={SAND} />
                  </>
                )}
              </g>
            )}
            <text x={LOUPE.x + 14} y={LOUPE.y + LOUPE.h - 10} fontSize={14} fontFamily={MONO} fill={colors.WARM}>
              softmax − exact = {sgn4(blend - exact)}
            </text>
          </g>
        )}

        {/* ================= the status ledger ================= */}
        {ledgerOp > 0.005 && (
          <g opacity={ledgerOp}>
            <rect x={LEDGER.x} y={LEDGER.y} width={LEDGER.w} height={LEDGER.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={LEDGER.x + 24} y={LEDGER.y + 30} fontSize={15} fontFamily={MONO} fill={colors.MUTED}>
              lab/hard-attend · where it stands
            </text>
            {/* row 1: tests */}
            {v(scene.row1U) > 0.005 && (
              <g opacity={v(scene.row1U)}>
                <line x1={LEDGER.x + 16} y1={140} x2={LEDGER.x + LEDGER.w - 16} y2={140} stroke={colors.GRID} />
                <text x={ROW.label} y={176} fontSize={18} fill={colors.TEXT}>Tests</text>
                <CodeLine x={ROW.code} y={166} text="$ bun test" />
                <CodeLine x={ROW.code} y={189} text="error: 0 test files matching" ink={colors.NEGATIVE} size={13} />
                <Pill x={ROW.status} y={175} text="The folder has no tests." stroke={colors.NEGATIVE} ink={colors.TEXT} size={14} />
              </g>
            )}
            {/* row 2: terminal */}
            {v(scene.row2U) > 0.005 && (
              <g opacity={v(scene.row2U)}>
                <line x1={LEDGER.x + 16} y1={208} x2={LEDGER.x + LEDGER.w - 16} y2={208} stroke={colors.GRID} />
                <text x={ROW.label} y={244} fontSize={18} fill={colors.TEXT}>Runs in a terminal</text>
                <CodeLine x={ROW.code} y={234} text="$ bun lab/hard-attend/hard-attend.ts" />
                <CodeLine x={ROW.code} y={257} text="ReferenceError: document is not defined" ink={colors.NEGATIVE} size={13} />
                <Pill x={ROW.status} y={234} text="browser only" stroke={colors.MUTED} ink={colors.TEXT} size={14} />
                {v(scene.browserU) > 0.005 && (
                  <text x={ROW.status} y={262} fontSize={13} fontFamily={MONO} fill={colors.MUTED} opacity={v(scene.browserU)}>
                    bun run start:hard-attend
                  </text>
                )}
              </g>
            )}
            {/* row 3: the old plan, split in two halves */}
            {v(scene.row3U) > 0.005 && (() => {
              const split = v(scene.splitU);
              const gap = 20 * split;
              const mid = 640;
              const top = 312;
              const h = 112;
              const L = { x: LEDGER.x + 20, w: mid - gap / 2 - (LEDGER.x + 20) };
              const R = { x: mid + gap / 2, w: LEDGER.x + LEDGER.w - 20 - (mid + gap / 2) };
              const covered = v(scene.coveredU);
              const amber = 0.4 + 0.6 * pulse;
              return (
                <g opacity={v(scene.row3U)}>
                  <line x1={LEDGER.x + 16} y1={276} x2={LEDGER.x + LEDGER.w - 16} y2={276} stroke={colors.GRID} />
                  <text x={ROW.label} y={302} fontSize={18} fill={colors.TEXT}>"Revisit hardAttend"</text>
                  <text x={ROW.label + 186} y={302} fontSize={13} fontFamily={MONO} fill={colors.MUTED}>lab/status.md</text>
                  <rect x={L.x} y={top} width={L.w} height={h} rx={10} fill={colors.BG} stroke={covered > 0.01 ? colors.POSITIVE : colors.MUTED} strokeOpacity={0.4 + 0.6 * covered} strokeWidth={1.6} />
                  <rect x={R.x} y={top} width={R.w} height={h} rx={10} fill={colors.BG} stroke={pulse > 0.01 ? colors.WARM : colors.MUTED} strokeOpacity={pulse > 0.01 ? amber : 0.4} strokeWidth={1.6 + 1.6 * pulse} strokeDasharray={pulse > 0.01 ? undefined : '6 5'} />
                  <g opacity={split}>
                    <text x={L.x + 18} y={top + 30} fontSize={17} fill={colors.TEXT}>indexed half</text>
                    <text x={L.x + 18} y={top + 54} fontSize={14} fill={colors.MUTED}>read one candidate at an already chosen index</text>
                    <g opacity={covered}>
                      <text x={L.x + 18} y={top + 90} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>circuit.indexRead</text>
                      <Pill x={L.x + 190} y={top + 89} text="covered" stroke={colors.POSITIVE} ink={colors.POSITIVE} size={14} />
                    </g>
                    <text x={R.x + 18} y={top + 30} fontSize={17} fill={pulse > 0.01 ? colors.WARM : colors.MUTED}>scored half</text>
                    <text x={R.x + 18} y={top + 54} fontSize={14} fill={colors.MUTED}>learn a shared scoring rule from changing data</text>
                    <g opacity={clamp01(pulse * 2)}>
                      <Pill x={R.x + 18} y={top + 89} text="open" stroke={colors.WARM} ink={colors.WARM} size={14} />
                    </g>
                  </g>
                  {v(scene.gatherU) > 0.005 && (
                    <g opacity={v(scene.gatherU)}>
                      <text x={L.x + 4} y={top + h + 30} fontSize={14} fill={colors.TEXT}>
                        gather lowering: “recognized retrieval after a
                      </text>
                      <text x={L.x + 4} y={top + h + 50} fontSize={14} fill={colors.TEXT}>
                        selection was already represented”
                      </text>
                      <text x={L.x + 4} y={top + h + 80} fontSize={14} fill={colors.MUTED}>
                        learned query/key scoring
                      </text>
                      <line x1={L.x + 2} y1={top + h + 75} x2={L.x + 2 + 178 * v(scene.crossU)} y2={top + h + 75} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                    </g>
                  )}
                  {v(scene.cautionU) > 0.005 && (
                    <g opacity={v(scene.cautionU)} transform={`translate(${lerp(30, 0, v(scene.cautionU))}, 0)`}>
                      <text x={R.x + 4} y={top + h + 30} fontSize={14} fill={colors.WARM}>
                        exact selection: no useful gradient
                      </text>
                      <text x={R.x + 4} y={top + h + 50} fontSize={14} fill={colors.TEXT}>
                        → train through soft mixtures,
                      </text>
                      <text x={R.x + 4} y={top + h + 70} fontSize={14} fill={colors.TEXT}>
                        check hardening separately
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* ================= recap: the journey, and the open question ================= */}
        {recapU > 0.005 && (
          <g>
            {RECAP.map((t, i) => {
              const u = staggerU(recapU, i, 3, 0.7, 0.8);
              if (u <= 0.005) return null;
              const x = RECAP_XS[i];
              return (
                <g key={i} opacity={u}>
                  <rect x={x} y={250} width={RECAP_W[i]} height={50} rx={12} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
                  <text x={x + RECAP_W[i] / 2} y={282} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
                    {t}
                  </text>
                  {i > 0 && (
                    <path d={`M ${x - RECAP_GAP + 10} 275 L ${x - 12} 275 M ${x - 20} 268 L ${x - 12} 275 L ${x - 20} 282`} stroke={colors.MUTED} strokeWidth={2} fill="none" />
                  )}
                </g>
              );
            })}
            {v(scene.recapSub) > 0.005 && (
              <text x={640} y={346} textAnchor="middle" fontSize={16} fill={SAND_INK} opacity={v(scene.recapSub)}>
                softmax approaches the exact read, except at ties
              </text>
            )}
            {v(scene.questionU) > 0.005 && (
              <g opacity={v(scene.questionU)}>
                <rect x={430} y={392} width={420} height={96} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
                <text x={492} y={460} textAnchor="middle" fontSize={52} fontWeight={700} fill={colors.WARM}>
                  ?
                </text>
                <text x={530} y={448} fontSize={20} fill={colors.TEXT}>
                  can a circuit learn the scores?
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title chip ================= */}
      <rect x={40} y={18} width={196} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        3 · Soft Versus Exact
      </text>
    </>
  );
}

export const vizScene = () => scene;
