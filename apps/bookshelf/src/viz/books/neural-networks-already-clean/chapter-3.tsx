// Follow the Branch
//
// Already Clean — chapter 3. A neuron's job as a tree grown by a time cursor: a chain of six shapes (neighbours
// alike, ends unlike) collapses into a neuron and its trunk; the trunk branches iy → diy → do it yourself (conceptual);
// then two reported training lanes, InceptionV1 neuron 338 above and ConvNeXt neuron 399 below, grow under playheads.
//
// Planner: Claude Sonnet 5.5 (.orly-work/visual-plan-sonnet.md, chapter 3). Research / source checks: Claude Haiku 5.5.
// Scene author: requested Claude Opus 5.5 (claude-opus-5-5); actual claude-opus-5-5 per this session's model
// identifier (no limit hit, no fallback).
//
// Sources (ledger .orly-work/research/neurons-claim-ledger.md):
//   R1 recursive generalization, definition ........ https://already-clean.goodfire.com/essay.md
//   R2 iy → diy → do it yourself, conceptual figure .. https://already-clean.goodfire.com/essay.md (+ figure, https://already-clean.goodfire.com/)
//   R3 head start, the author's proposed mechanism ... https://already-clean.goodfire.com/essay.md
//   R4 InceptionV1 neuron 338 / ConvNeXt neuron 399 over training, epochs 0.7, 1.5, 3, 12
//      ............................................... figure details, https://already-clean.goodfire.com/
//   R7 offshoots rarer and less important (appendix) . https://already-clean.goodfire.com/essay.md
//
// Schematic vs reported: the opening shape chain, the language tree's geometry and its unlabeled buds, the inset, and
// every branch path are schematic (fixed widths; widths never encode response shares). Reported (R4): the two neuron
// ids, the four epoch snapshots on the Inception lane (equal spacing, not a time scale), which image groups appear at
// each snapshot, ConvNeXt's early ball/fruit responses being dropped, and the Inception field responses thinning to a
// remnant. The ConvNeXt lane carries no epoch ticks. The links between snapshots are illustrative local relations,
// not a measured genealogy.
import { interpolateRgb } from 'd3';
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Captions (fixed narration, verbatim) and pacing
// ---------------------------------------------------------------------------

const CAPS = [
  // [connective]
  "A neuron's final examples can look disconnected. What would we learn by watching its job develop?",
  // [R1]
  "Recursive generalization is Cammarata's name for related extensions that branch again, along more than one direction of similarity.",
  // [R2]
  "His language illustration starts with the letters eye and why, as in Miyazaki, and extends to dee eye why.",
  // [R2]
  "That branch reaches do it yourself, without the original letter pair. The figure is a conceptual illustration, not a recorded training sequence.",
  // [R3]
  "His proposed mechanism is a head start: a neuron already active for the abbreviation is well placed to learn the equivalent phrase.",
  // [R4]
  "The vision example follows training directly. A neuron in retrained Inception version one starts with rapeseed fields.",
  // [R4]
  "A neuron in Conv Next starts with similar fields. Following both over training lets us compare where their responses spread.",
  // [R4]
  "The Inception neuron extends to tennis balls, dogs, and broccoli. By the end, field responses have become a small remnant.",
  // [R4]
  "The Conv Next neuron briefly responds to balls and fruit, then mostly releases those extensions and stays with fields.",
  // [R7]
  "His broader observations suggest side branches are uncommon and matter less than a neuron's main job. That remains an empirical claim to investigate.",
  // [R1, R4]
  "For these examples, the useful explanation follows the neighboring steps. The final list of object names hides how the grouping developed.",
];

const GAP = 0.7;
const DUR = CAPS.map((c) => Math.max(5.4, c.split(/\s+/).filter(Boolean).length * 0.4 + 1.1));
const T: number[] = [];
{
  let t = 0.6;
  for (const d of DUR) {
    T.push(t);
    t += d + GAP;
  }
}

// ---------------------------------------------------------------------------
// Geometry (world coordinates, stage 1280×720; y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

type P = readonly [number, number];
type Cubic = readonly [P, P, P, P];
const lerpP = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** A branch: cubic with horizontal tangents at both ends. */
const branch = (a: P, b: P): Cubic => {
  const mx = (b[0] - a[0]) * 0.5;
  return [a, [a[0] + mx, a[1]], [b[0] - mx, b[1]], b];
};
/** The first t of a cubic (de Casteljau) — exact partial geometry, so dashes stay valid while a branch grows. */
const partial = (c: Cubic, t: number): Cubic => {
  const p01 = lerpP(c[0], c[1], t);
  const p12 = lerpP(c[1], c[2], t);
  const p23 = lerpP(c[2], c[3], t);
  const p012 = lerpP(p01, p12, t);
  const p123 = lerpP(p12, p23, t);
  return [c[0], p01, p012, lerpP(p012, p123, t)];
};
const pointAt = (c: Cubic, t: number): P => partial(c, t)[3];
const dOf = (c: Cubic): string =>
  `M${c[0][0]},${c[0][1]} C${c[1][0]},${c[1][1]} ${c[2][0]},${c[2][1]} ${c[3][0]},${c[3][1]}`;

// --- B1 · the opening chain: six shapes, each a small morph of its neighbour (circle → square) ---
const CHAIN_Y = 300;
const shapeColor = interpolateRgb('#2dd4bf', '#fbbf24');
const CHAIN_EXP = [2, 2.5, 3.3, 4.6, 7, 16]; // superellipse exponent per shape: 2 = circle … 16 ≈ square
const CHAIN = Array.from({ length: 6 }, (_, i) => {
  const m = i / 5;
  const n = CHAIN_EXP[i];
  const R = 24 + 8 * m;
  const pts: string[] = [];
  for (let j = 0; j < 72; j++) {
    const th = (j / 72) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const x = Math.sign(c) * Math.abs(c) ** (2 / n) * R;
    const y = Math.sign(s) * Math.abs(s) ** (2 / n) * R;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return { x: 160 + i * 192, d: `M${pts.join(' L')} Z`, color: shapeColor(m), R };
});
const ENDS_ARC: Cubic = [[160, 262], [420, 132], [860, 132], [1120, 262]];

// --- B2–B4 · the language tree (conceptual illustration) ---
const N0: P = [140, 330]; // the neuron
const J: P = [330, 330]; // iy
const D: P = [580, 270]; // diy
const PH: P = [900, 220]; // do it yourself
const B1: P = [560, 410];
const B2: P = [780, 460];
const B3: P = [790, 322];
const L_TRUNK: Cubic = branch(N0, J);
const L_JD = branch(J, D);
const L_JB1 = branch(J, B1);
const L_DB3 = branch(D, B3);
const L_B1B2 = branch(B1, B2);
const L_DP = branch(D, PH);

// --- B5–B9 · the vision lanes ---
const COLX = [280, 480, 680, 880]; // epochs 0.7, 1.5, 3, 12 — equal spacing, not a time scale
const EPOCHS = ['0.7', '1.5', '3', '12'];
const snapX = (s: number): number => {
  const c = Math.max(0, Math.min(3, s));
  const i = Math.min(2, Math.floor(c));
  return lerp(COLX[i], COLX[i + 1], c - i);
};
const UP = { balls: 150, dogs: 192, fields: 234, fruit: 276, broc: 318 } as const;
const LO = { balls: 428, fields: 470, fruit: 512 } as const;
const N_UP: P = [140, UP.fields];
const N_LO: P = [140, LO.fields];
const AXIS_Y = 352;
const NODE_R = 19;

type Kind = 'field' | 'ball' | 'fruit' | 'broccoli' | 'dog-grass' | 'shaggy' | 'terrier';
interface VNode {
  id: string;
  col: number;
  y: number;
  kind: Kind;
}
const UP_NODES: VNode[] = [
  { id: 'f0', col: 0, y: UP.fields, kind: 'field' },
  { id: 'b1', col: 1, y: UP.balls, kind: 'ball' },
  { id: 'd1', col: 1, y: UP.dogs, kind: 'dog-grass' },
  { id: 'f1', col: 1, y: UP.fields, kind: 'field' },
  { id: 'r1', col: 1, y: UP.fruit, kind: 'fruit' },
  { id: 'b2', col: 2, y: UP.balls, kind: 'ball' },
  { id: 'd2', col: 2, y: UP.dogs, kind: 'shaggy' },
  { id: 'f2', col: 2, y: UP.fields, kind: 'field' },
  { id: 'c2', col: 2, y: UP.broc, kind: 'broccoli' },
  { id: 'b3', col: 3, y: UP.balls, kind: 'ball' },
  { id: 'd3', col: 3, y: UP.dogs, kind: 'terrier' },
  { id: 'f3', col: 3, y: UP.fields, kind: 'field' }, // the remnant
  { id: 'c3', col: 3, y: UP.broc, kind: 'broccoli' },
];
const nodeById = new Map(UP_NODES.map((n) => [n.id, n]));
const posOf = (n: VNode): P => [COLX[n.col], n.y];
/** Illustrative local relations between snapshots (not a measured genealogy). */
const UP_EDGES = [
  ['f0', 'b1'], ['f0', 'd1'], ['f0', 'f1'], ['f0', 'r1'],
  ['b1', 'b2'], ['d1', 'd2'], ['f1', 'f2'], ['r1', 'c2'],
  ['b2', 'b3'], ['d2', 'd3'], ['f2', 'f3'], ['c2', 'c3'],
].map(([a, b]) => {
  const na = nodeById.get(a)!;
  const nb = nodeById.get(b)!;
  return { a: na, b: nb, c: branch(posOf(na), posOf(nb)), remnant: b === 'f3' };
});
/** The history traced in the last beat: every path from the origin field node to an endpoint. */
const TRACE_IDS = new Set(['f0', 'b1', 'b2', 'b3', 'd1', 'd2', 'd3', 'r1', 'c2', 'c3', 'f1', 'f2', 'f3']);
const LO_BALL = branch([COLX[0], LO.fields], [COLX[1], LO.balls]);
const LO_FRUIT = branch([COLX[0], LO.fields], [COLX[1], LO.fruit]);

// endpoint cards (the final lists of names) and the inset share the right margin, at different beats
const CARD_X = 945;
const CARD_W = 245;
const UP_CARD = [
  { y: UP.balls, text: 'tennis balls', remnant: false },
  { y: UP.dogs, text: 'terriers', remnant: false },
  { y: UP.fields, text: 'fields (remnant)', remnant: true },
  { y: UP.broc, text: 'broccoli', remnant: false },
];
// row names on the Inception lane (the caption's groups), shown as each row first sprouts; gone before the inset
const UP_ROWS = [
  { y: UP.balls, text: 'tennis balls', first: 'b1' },
  { y: UP.dogs, text: 'dogs', first: 'd1' },
  { y: UP.fields, text: 'fields', first: 'b1' },
  { y: UP.fruit, text: 'fruit', first: 'r1' },
  { y: UP.broc, text: 'broccoli', first: 'c2' },
];
const ROW_X = COLX[3] + NODE_R + 14;

// --- camera ---
// a gentle push that drifts with the chain but keeps all six shapes (x 136–1152) in frame
const CAM_C1A: CameraState = { x: 610, y: 300, k: 1.1 };
const CAM_C1B: CameraState = { x: 680, y: 300, k: 1.1 };
const CAM_C2: CameraState = { x: 470, y: 350, k: 1.12 };
const CAM_C3: CameraState = { x: 450, y: 300, k: 1.4 };
const CAM_C4: CameraState = { x: 600, y: 290, k: 1.15 };
const CAM_C6: CameraState = { x: 520, y: 262, k: 1.22 };
const CAM_C8: CameraState = { x: 525, y: 245, k: 1.3 };

// --- screen-space status chip, one per phase, replaced not stacked ---
const CHIPS = [
  'neighbours alike, ends unlike',
  'conceptual illustration — not a measured training trace',
  'reported snapshots · training epochs',
  'reported snapshots · same data, two models',
  'broader observation · schematic',
  'for these two examples',
];

// colours
const UP_COLOR = colors.SECONDARY; // InceptionV1 lane
const LO_COLOR = colors.TEAL; // ConvNeXt lane
const TREE = '#8da2be';
const HOT = colors.WARM;
const PLATE = '#0f172a';

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions; every beat keys to T[i]
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipIn = tl.channel('chipIn', 0);
  const chipK = tl.channel('chipK', 0);

  const chainU = tl.channel('chainU', 0); // 0..6, one unit per shape
  const endsU = tl.channel('endsU', 0);
  const collapseU = tl.channel('collapseU', 0);
  const nodeU = tl.channel('nodeU', 0);
  const grow = tl.channel('grow', 0); // 0..3: trunk, first fork, second fork
  const recU = tl.channel('recU', 0);
  const iyU = tl.channel('iyU', 0);
  const mzU = tl.channel('mzU', 0);
  const hiU = tl.channel('hiU', 0);
  const diyU = tl.channel('diyU', 0);
  const phraseU = tl.channel('phraseU', 0);
  const litU = tl.channel('litU', 0);
  const glowU = tl.channel('glowU', 0);
  const headU = tl.channel('headU', 0);
  const langOut = tl.channel('langOut', 0);
  const nodeMove = tl.channel('nodeMove', 0);

  const incU = tl.channel('incU', 0);
  const upTrunk = tl.channel('upTrunk', 0);
  const f0U = tl.channel('f0U', 0);
  const axisU = tl.channel('axisU', 0);
  const phU = tl.channel('phU', 0);
  const loU = tl.channel('loU', 0);
  const loTrunk = tl.channel('loTrunk', 0);
  const lf0U = tl.channel('lf0U', 0);
  const phLoU = tl.channel('phLoU', 0);
  const snapUp = tl.channel('snapUp', 0); // Inception playhead, 0..3 = epochs 0.7 / 1.5 / 3 / 12
  const snapLo = tl.channel('snapLo', 0); // ConvNeXt playhead (no epoch ticks)
  const loDim = tl.channel('loDim', 0);
  const relU = tl.channel('relU', 0);

  const treeDim = tl.channel('treeDim', 0);
  const insetU = tl.channel('insetU', 0);
  const twigU = tl.channel('twigU', 0);
  const insetTxt = tl.channel('insetTxt', 0);
  const transU = tl.channel('transU', 0);
  const traceU = tl.channel('traceU', 0);
  const cardU = tl.channel('cardU', 0);
  const closeU = tl.channel('closeU', 0);

  // each line holds until the next starts, so the caption never blinks off between lines
  CAPS.forEach((text, i) => tl.caption({ at: T[i], dur: i < CAPS.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));

  // — C1 · neighbours alike, ends unlike —
  let t = T[0];
  tl.tween(chipIn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_C1A, { at: t + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(chainU, 6, { at: t + 0.5, dur: 3.6, ease: ease.linear });
  tl.tween(cam, CAM_C1B, { at: t + 1.4, dur: 2.9, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t + 4.5, dur: 1.3, ease: ease.move });
  tl.tween(endsU, 1, { at: t + 5.6, dur: 1.1, ease: ease.draw });
  tl.hold(t + 6.7, 0.8);

  // — C2 · the chain becomes a neuron and its trunk; branches branch again —
  t = T[1];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(collapseU, 1, { at: t + 0.2, dur: 1.1, ease: ease.move });
  tl.tween(cam, CAM_C2, { at: t + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(nodeU, 1, { at: t + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(recU, 1, { at: t + 1.0, dur: 0.6, ease: ease.enter }); // the term lands as it is spoken
  tl.tween(grow, 3, { at: t + 1.6, dur: 3.9, ease: ease.linear });
  tl.hold(t + 5.5, 1.0);

  // — C3 · iy, as in Miyazaki, extends to diy —
  t = T[2];
  tl.tween(recU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_C3, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(iyU, 1, { at: t + 0.9, dur: 0.6, ease: ease.enter });
  tl.tween(mzU, 1, { at: t + 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(hiU, 1, { at: t + 2.7, dur: 0.6, ease: ease.enter });
  tl.tween(diyU, 1, { at: t + 3.8, dur: 0.7, ease: ease.enter });
  tl.hold(t + 4.5, 1.0);

  // — C4 · the branch reaches do it yourself (no iy) —
  t = T[3];
  tl.tween(cam, CAM_C4, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(phraseU, 1, { at: t + 0.8, dur: 1.6, ease: ease.draw });
  tl.hold(t + 2.4, 1.0);

  // — C5 · proposed head start: already on for diy, first in line for the phrase —
  t = T[4];
  tl.tween(mzU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(litU, 1, { at: t + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(glowU, 1, { at: t + 2.0, dur: 1.2, ease: ease.linear });
  tl.tween(headU, 1, { at: t + 3.6, dur: 0.6, ease: ease.enter });
  tl.hold(t + 4.2, 1.0);

  // — C6 · language clears; the neuron becomes InceptionV1 neuron 338 on its fields —
  t = T[5];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(langOut, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_C6, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(nodeMove, 1, { at: t + 0.7, dur: 1.0, ease: ease.move });
  tl.tween(incU, 1, { at: t + 1.5, dur: 0.6, ease: ease.enter });
  tl.tween(upTrunk, 1, { at: t + 1.9, dur: 0.8, ease: ease.draw });
  tl.tween(f0U, 1, { at: t + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(axisU, 1, { at: t + 3.3, dur: 1.2, ease: ease.draw });
  tl.tween(phU, 1, { at: t + 4.4, dur: 0.6, ease: ease.enter });
  tl.hold(t + 5.0, 1.0);

  // — C7 · a second, separate neuron: ConvNeXt neuron 399, same fields —
  t = T[6];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(loU, 1, { at: t + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(loTrunk, 1, { at: t + 1.0, dur: 0.8, ease: ease.draw });
  tl.tween(lf0U, 1, { at: t + 1.7, dur: 0.6, ease: ease.enter });
  tl.tween(phLoU, 1, { at: t + 2.6, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.2, 1.0);

  // — C8 · Inception spreads: 0.7 → 1.5 → 3 (hold) → 12; fields thin to a remnant —
  t = T[7];
  tl.tween(cam, CAM_C8, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(loDim, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(snapUp, 1, { at: t + 0.9, dur: 1.4, ease: ease.linear });
  tl.tween(relU, 1, { at: t + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(snapUp, 2, { at: t + 2.6, dur: 1.4, ease: ease.linear });
  tl.tween(snapUp, 3, { at: t + 5.6, dur: 1.6, ease: ease.linear });
  tl.hold(t + 7.2, 1.0);

  // — C9 · ConvNeXt reaches for balls and fruit early, then lets go —
  t = T[8];
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(relU, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(loDim, 0, { at: t + 0.2, dur: 0.6, ease: ease.move });
  // sprouts stand at 1.5 through "briefly responds to balls and fruit", then retract on "releases"
  tl.tween(snapLo, 1, { at: t + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(snapLo, 3, { at: t + 4.2, dur: 2.6, ease: ease.linear });
  tl.hold(t + 6.8, 1.0);

  // — C10 · playheads frozen; a schematic inset for the broader claim —
  t = T[9];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(treeDim, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(insetU, 1, { at: t + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(twigU, 1, { at: t + 1.4, dur: 1.2, ease: ease.draw });
  tl.tween(insetTxt, 1, { at: t + 2.6, dur: 0.6, ease: ease.enter });
  tl.hold(t + 3.2, 1.0);

  // — C11 · endpoints with a history; opaque closing panel —
  t = T[10];
  tl.tween(chipK, 5, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(insetU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(transU, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(traceU, 1, { at: t + 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cardU, 1, { at: t + 2.6, dur: 0.7, ease: ease.enter });
  tl.tween(closeU, 1, { at: t + 4.2, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipIn, chipK, chainU, endsU, collapseU, nodeU, grow, recU, iyU, mzU, hiU, diyU, phraseU, litU, glowU,
    headU, langOut, nodeMove, incU, upTrunk, f0U, axisU, phU, loU, loTrunk, lf0U, phLoU, snapUp, snapLo, loDim, relU,
    treeDim, insetU, twigU, insetTxt, transU, traceU, cardU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local components
// ---------------------------------------------------------------------------

function Branch({ c, u, color, width = 3, dash, opacity = 1 }: { c: Cubic; u: number; color: string; width?: number; dash?: string; opacity?: number }) {
  if (u <= 0.001 || opacity <= 0.001) return null;
  return (
    <path d={dOf(u >= 1 ? c : partial(c, u))} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} opacity={opacity} />
  );
}

// shaggy-dog fringe, precomputed
const SHAGGY_D = (() => {
  const pts: string[] = [];
  for (let j = 0; j < 28; j++) {
    const th = (j / 28) * Math.PI * 2;
    const r = j % 2 === 0 ? 12 : 9.5;
    pts.push(`${(Math.cos(th) * r).toFixed(2)},${(Math.sin(th) * r - 1).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

/** Pictograms drawn in a ±20 box. */
function Art({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'field':
      return (
        <g clipPath="url(#nn3-plate)">
          <rect x={-20} y={-20} width={40} height={17} fill="#93c5fd" opacity={0.55} />
          <path d="M-20 -4 Q0 -10 20 -4 L20 20 L-20 20 Z" fill="#facc15" />
          <path d="M-20 3 Q0 -3 20 3 L20 7 Q0 1 -20 7 Z" fill="#65a30d" />
          <path d="M-20 11 Q0 5 20 11 L20 14 Q0 8 -20 14 Z" fill="#65a30d" />
        </g>
      );
    case 'ball':
      return (
        <g>
          <circle r={12.5} fill="#d9e94a" />
          <path d="M-9 -8.5 C-3.5 -3 -3.5 3 -9 8.5 M9 -8.5 C3.5 -3 3.5 3 9 8.5" fill="none" stroke="#f8fafc" strokeWidth={1.8} />
        </g>
      );
    case 'fruit':
      return (
        <g>
          <path d="M0 -7 C6 -13 15 -7 13 3 C11 11 5 14 0 12 C-5 14 -11 11 -13 3 C-15 -7 -6 -13 0 -7 Z" fill="#84cc16" />
          <path d="M0 -7 L1.5 -14" stroke="#92400e" strokeWidth={2} strokeLinecap="round" />
          <ellipse cx={6} cy={-12} rx={4.5} ry={2.2} transform="rotate(-25 6 -12)" fill="#4d7c0f" />
        </g>
      );
    case 'broccoli':
      return (
        <g>
          <path d="M-4 1 L-3 14 L3 14 L4 1 Z" fill="#a3e635" />
          {[[-7, -2, 7], [0, -7, 8], [7, -2, 7], [-3, 2, 5], [4, 2, 5]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#16a34a" stroke="#14532d" strokeWidth={1} />
          ))}
        </g>
      );
    default: {
      const terrier = kind === 'terrier';
      const fur = terrier ? '#c9b48f' : kind === 'shaggy' ? '#e0b77a' : '#d6a46b';
      const ear = terrier ? '#7c6546' : '#9a6a3a';
      return (
        <g>
          {kind === 'dog-grass' && (
            <path d="M-17 17 L-14 7 L-11 17 M-8 17 L-5 5 L-2 17 M3 17 L6 6 L9 17 M11 17 L14 8 L17 17" fill="#22c55e" stroke="#15803d" strokeWidth={0.8} />
          )}
          <g transform={kind === 'dog-grass' ? 'translate(0,-3) scale(0.85)' : undefined}>
            {terrier ? (
              <>
                <path d="M-10 -3 L-8 -16 L-2 -8 Z" fill={ear} />
                <path d="M10 -3 L8 -16 L2 -8 Z" fill={ear} />
              </>
            ) : (
              <>
                <ellipse cx={-10} cy={1} rx={4} ry={8.5} transform="rotate(15 -10 1)" fill={ear} />
                <ellipse cx={10} cy={1} rx={4} ry={8.5} transform="rotate(-15 10 1)" fill={ear} />
              </>
            )}
            {kind === 'shaggy' ? <path d={SHAGGY_D} fill={fur} /> : <circle cy={-1} r={10} fill={fur} />}
            <ellipse cx={0} cy={5} rx={5.5} ry={4} fill="#f1dcc0" />
            <circle cx={0} cy={3.2} r={2} fill="#1f2937" />
            <circle cx={-4} cy={-3} r={1.5} fill="#1f2937" />
            <circle cx={4} cy={-3} r={1.5} fill="#1f2937" />
          </g>
        </g>
      );
    }
  }
}

function VisNode({ p, kind, u, color, r = NODE_R, remnant = false }: { p: P; kind: Kind; u: number; color: string; r?: number; remnant?: boolean }) {
  if (u <= 0.01) return null;
  const k = (remnant ? 0.6 : 1) * lerp(0.6, 1, u);
  return (
    <g transform={`translate(${p[0]},${p[1]}) scale(${k})`} opacity={u}>
      <circle r={r} fill={PLATE} stroke={color} strokeWidth={remnant ? 1.6 : 2} strokeDasharray={remnant ? '3 3' : undefined} />
      <g transform={`scale(${(r - 1) / 18})`} opacity={remnant ? 0.6 : 1}>
        <Art kind={kind} />
      </g>
    </g>
  );
}

/** A language token on the tree: a monospace pill; `hi` marks the highlighted substring. */
function Pill({ p, text, hi, u, hiU = 0, lit = 0, size = 30 }: { p: P; text: string; hi?: [number, number]; u: number; hiU?: number; lit?: number; size?: number }) {
  if (u <= 0.01) return null;
  const w = text.length * size * 0.61 + 30;
  const h = size + 18;
  const hot = interpolateRgb('#e6edf6', HOT)(hiU);
  return (
    <g opacity={u} transform={`translate(${p[0]},${p[1]}) scale(${lerp(0.7, 1, u)})`}>
      {lit > 0.01 && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={h / 2 + 6} fill={HOT} opacity={0.18 * lit} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={PLATE} stroke={lit > 0.01 ? interpolateRgb(TREE, HOT)(lit) : TREE} strokeWidth={2} />
      <text y={size * 0.35} textAnchor="middle" fontFamily={MONO} fontSize={size} fill={colors.TEXT}>
        {hi ? (
          <>
            {text.slice(0, hi[0])}
            <tspan fill={hot}>{text.slice(hi[0], hi[1])}</tspan>
            {text.slice(hi[1])}
          </>
        ) : (
          text
        )}
      </text>
    </g>
  );
}

function Label({ x, y, text, size = 20, color = colors.TEXT, anchor = 'start', u, mono = false, italic = false, weight }: { x: number; y: number; text: string; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; u: number; mono?: boolean; italic?: boolean; weight?: number }) {
  if (u <= 0.01) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} opacity={u} fontFamily={mono ? MONO : undefined} fontStyle={italic ? 'italic' : undefined} fontWeight={weight}>
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const cam = s.get(scene.cam);

  const chainU = v(scene.chainU);
  const endsU = v(scene.endsU);
  const collapseU = v(scene.collapseU);
  const nodeU = v(scene.nodeU);
  const grow = v(scene.grow);
  const recU = v(scene.recU);
  const iyU = v(scene.iyU);
  const mzU = v(scene.mzU);
  const hiU = v(scene.hiU);
  const diyU = v(scene.diyU);
  const phraseU = v(scene.phraseU);
  const litU = v(scene.litU);
  const glowU = v(scene.glowU);
  const headU = v(scene.headU);
  const langOut = v(scene.langOut);
  const nodeMove = v(scene.nodeMove);
  const incU = v(scene.incU);
  const upTrunk = v(scene.upTrunk);
  const f0U = v(scene.f0U);
  const axisU = v(scene.axisU);
  const phU = v(scene.phU);
  const loU = v(scene.loU);
  const loTrunk = v(scene.loTrunk);
  const lf0U = v(scene.lf0U);
  const phLoU = v(scene.phLoU);
  const snapUp = v(scene.snapUp);
  const snapLo = v(scene.snapLo);
  const loDim = v(scene.loDim);
  const relU = v(scene.relU);
  const treeDim = v(scene.treeDim);
  const insetU = v(scene.insetU);
  const twigU = v(scene.twigU);
  const insetTxt = v(scene.insetTxt);
  const transU = v(scene.transU);
  const traceU = v(scene.traceU);
  const cardU = v(scene.cardU);
  const closeU = v(scene.closeU);
  const chipIn = v(scene.chipIn);
  const chipK = v(scene.chipK);

  // ---- phase opacities ----
  const chainOp = 1 - collapseU;
  const langOp = 1 - langOut;
  const treeOp = 1 - 0.6 * treeDim - 0.25 * transU; // C10 → 0.4, C11 → 0.15
  const loOp = 1 - 0.95 * loDim;
  const axisOp = (1 - 0.75 * treeDim) * (1 - transU);

  // neuron node: language position → Inception lane
  const nPos = lerpP(N0, N_UP, nodeMove);

  // language tree progress
  const seg = (k: number) => clamp01(grow - k);
  const budJ = clamp01((grow - 0.9) / 0.1);
  const budD = clamp01((grow - 1.9) / 0.1);
  const budB = clamp01((grow - 2.9) / 0.1);

  // vision: Inception growth from the playhead
  const edgeU = (col: number) => clamp01(snapUp - col); // edge leaving column `col`
  const nodeShow = (n: VNode) => (n.col === 0 ? f0U : clamp01((snapUp - (n.col - 1) - 0.82) / 0.18));

  // vision: ConvNeXt offshoots sprout early and retract as the playhead moves on (pure function of snapLo)
  const loSprout = clamp01(snapLo);
  const loRetract = clamp01((snapLo - 1.15) / 0.7);
  const loLen = loSprout * (1 - loRetract);
  const loTip = clamp01((loSprout - 0.82) / 0.18) * (1 - clamp01(loRetract * 3));
  const loStemX = snapX(snapLo);
  const lf3U = clamp01((snapLo - 2.82) / 0.18);

  const chip = (i: number) => chipIn * clamp01(1 - Math.abs(chipK - i) * 2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="nn3-plate">
          <circle r={16.5} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= C1 · the chain: neighbours alike, ends unlike ================= */}
        {chainOp > 0.01 && chainU > 0 && (
          <g opacity={chainOp}>
            {CHAIN.map((c, i) => {
              const u = ease.enter(clamp01(chainU - i));
              if (u <= 0.01) return null;
              const x = lerp(c.x, N0[0], collapseU);
              const y = lerp(CHAIN_Y, N0[1], collapseU);
              const k = lerp(0.5, 1, u) * lerp(1, 0.3, collapseU);
              return (
                <g key={i} transform={`translate(${x},${y}) scale(${k})`} opacity={u}>
                  <path d={c.d} fill={c.color} fillOpacity={0.4} stroke={c.color} strokeWidth={3.5} />
                </g>
              );
            })}
            {CHAIN.slice(0, 5).map((c, i) => {
              const u = clamp01((chainU - i - 1) * 1.6);
              const a: P = [c.x + c.R + 8, CHAIN_Y + 18];
              const b: P = [CHAIN[i + 1].x - CHAIN[i + 1].R - 8, CHAIN_Y + 18];
              const arc: Cubic = [a, [a[0] + 30, CHAIN_Y + 52], [b[0] - 30, CHAIN_Y + 52], b];
              return (
                <g key={i}>
                  <Branch c={arc} u={u * (1 - collapseU)} color={colors.TEAL} width={2.5} opacity={0.85} />
                  <Label x={(a[0] + b[0]) / 2} y={CHAIN_Y + 72} text="alike" size={16} anchor="middle" color={colors.TEAL} u={clamp01(u * 1.5 - 0.5) * (1 - collapseU)} italic />
                </g>
              );
            })}
            <Label x={CHAIN[0].x} y={CHAIN_Y + 72} text="first" size={17} anchor="middle" color={colors.MUTED} u={endsU} />
            <Label x={CHAIN[5].x} y={CHAIN_Y + 72} text="final" size={17} anchor="middle" color={colors.MUTED} u={endsU} />
            <Branch c={ENDS_ARC} u={endsU} color={colors.NEGATIVE} width={2.5} dash="9 8" />
            {endsU > 0.9 && (
              <g opacity={clamp01((endsU - 0.9) / 0.1)}>
                <g transform="translate(640,165)" stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round">
                  <line x1={-10} y1={-10} x2={10} y2={10} />
                  <line x1={10} y1={-10} x2={-10} y2={10} />
                </g>
                <text x={640} y={136} textAnchor="middle" fontSize={20} fontStyle="italic" fill={colors.NEGATIVE}>
                  unlike
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= C2–C5 · the language tree (conceptual) ================= */}
        {langOp > 0.01 && nodeU > 0.01 && (
          <g opacity={langOp}>
            <Branch c={L_TRUNK} u={seg(0)} color={TREE} />
            <Branch c={L_JD} u={seg(1)} color={TREE} />
            <Branch c={L_JB1} u={seg(1)} color={TREE} />
            <Branch c={L_DB3} u={seg(2)} color={TREE} />
            <Branch c={L_B1B2} u={seg(2)} color={TREE} />
            <Branch c={L_DP} u={phraseU} color={TREE} />
            {/* lit path: already on along neuron → iy → diy */}
            {litU > 0.01 && (
              <g opacity={litU}>
                {[L_TRUNK, L_JD].map((c, i) => (
                  <g key={i}>
                    <path d={dOf(c)} fill="none" stroke={HOT} strokeWidth={10} opacity={0.18} strokeLinecap="round" />
                    <path d={dOf(c)} fill="none" stroke={HOT} strokeWidth={3} strokeLinecap="round" />
                  </g>
                ))}
              </g>
            )}
            {glowU > 0.001 && <Branch c={L_DP} u={glowU} color={HOT} width={3} />}
            {glowU > 0.001 && glowU < 0.999 && (() => {
              const q = pointAt(L_DP, glowU);
              return (
                <g>
                  <circle cx={q[0]} cy={q[1]} r={16} fill={HOT} opacity={0.22} />
                  <circle cx={q[0]} cy={q[1]} r={7} fill={HOT} />
                </g>
              );
            })()}
            {/* unlabeled buds: other directions the illustration grows in */}
            {[
              { p: J, u: budJ * (1 - iyU) },
              { p: D, u: budD * (1 - diyU) },
              { p: B1, u: budD },
              { p: B3, u: budB },
              { p: B2, u: budB },
            ].map((b, i) =>
              b.u > 0.01 ? <circle key={i} cx={b.p[0]} cy={b.p[1]} r={8} fill={PLATE} stroke={TREE} strokeWidth={2.5} opacity={b.u} /> : null,
            )}
            <Pill p={J} text="iy" hi={[0, 2]} u={iyU} hiU={1} lit={litU} />
            <Pill p={D} text="diy" hi={[1, 3]} u={diyU} hiU={1} lit={litU} />
            <Pill p={PH} text="do it yourself" u={clamp01((phraseU - 0.85) / 0.15)} lit={clamp01((glowU - 0.92) / 0.08)} size={28} />
            {/* Miyazaki, the substring highlighted */}
            {mzU > 0.01 && (
              <g opacity={mzU}>
                <text x={J[0]} y={J[1] - 52} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={colors.TEXT}>
                  M<tspan fill={interpolateRgb('#e6edf6', HOT)(hiU)}>iy</tspan>azaki
                </text>
                <line x1={J[0]} y1={J[1] - 44} x2={J[0]} y2={J[1] - 26} stroke={TREE} strokeWidth={2} strokeDasharray="3 4" />
              </g>
            )}
            <Label x={470} y={530} text="recursive generalization" size={26} anchor="middle" u={recU} weight={600} />
            <Label x={PH[0]} y={PH[1] - 50} text="proposed: a head start" size={22} anchor="middle" color={HOT} u={headU} italic />
          </g>
        )}

        {/* ================= C6–C11 · the vision lanes ================= */}
        <g opacity={treeOp}>
          {/* Inception lane */}
          <Branch c={branch(N_UP, [COLX[0], UP.fields])} u={upTrunk} color={UP_COLOR} />
          {UP_EDGES.map((e, i) => (
            <Branch key={i} c={e.c} u={edgeU(e.a.col)} color={UP_COLOR} width={e.remnant ? 1.6 : 3} dash={e.remnant ? '4 6' : undefined} />
          ))}
          {UP_NODES.map((n) => (
            <VisNode key={n.id} p={posOf(n)} kind={n.kind} u={nodeShow(n)} color={UP_COLOR} remnant={n.id === 'f3'} />
          ))}
          {UP_ROWS.map((r) => (
            <Label key={r.text} x={ROW_X} y={r.y + 6} text={r.text} size={16} color={UP_COLOR} u={nodeShow(nodeById.get(r.first)!) * (1 - treeDim)} />
          ))}

          {/* ConvNeXt lane */}
          <g opacity={loOp}>
            <Branch c={branch(N_LO, [COLX[0], LO.fields])} u={loTrunk} color={LO_COLOR} />
            {snapLo > 0.001 && <line x1={COLX[0]} y1={LO.fields} x2={loStemX} y2={LO.fields} stroke={LO_COLOR} strokeWidth={3} strokeLinecap="round" />}
            <Branch c={LO_BALL} u={loLen} color={LO_COLOR} />
            <Branch c={LO_FRUIT} u={loLen} color={LO_COLOR} />
            <VisNode p={[COLX[1], LO.balls]} kind="ball" u={loTip} color={LO_COLOR} />
            <VisNode p={[COLX[1], LO.fruit]} kind="fruit" u={loTip} color={LO_COLOR} />
            <Label x={COLX[1] + NODE_R + 10} y={LO.balls + 6} text="balls" size={16} color={LO_COLOR} u={loTip} />
            <Label x={COLX[1] + NODE_R + 10} y={LO.fruit + 6} text="fruit" size={16} color={LO_COLOR} u={loTip} />
            <VisNode p={[COLX[0], LO.fields]} kind="field" u={lf0U} color={LO_COLOR} />
            <VisNode p={[COLX[3], LO.fields]} kind="field" u={lf3U} color={LO_COLOR} />
          </g>
        </g>

        {/* axis + playheads (transient) */}
        {axisOp > 0.01 && (
          <g opacity={axisOp}>
            {axisU > 0.01 && (
              <g>
                <line x1={250} y1={AXIS_Y} x2={lerp(250, 910, axisU)} y2={AXIS_Y} stroke={TREE} strokeWidth={1.5} />
                {COLX.map((x, i) => {
                  const u = clamp01((axisU - ((x - 250) / 660) * 0.8) * 5);
                  return u > 0.01 ? (
                    <g key={i} opacity={u}>
                      <line x1={x} y1={AXIS_Y - 6} x2={x} y2={AXIS_Y + 6} stroke={TREE} strokeWidth={1.5} />
                      <text x={x} y={AXIS_Y + 28} textAnchor="middle" fontFamily={MONO} fontSize={18} fill={colors.MUTED}>
                        {EPOCHS[i]}
                      </text>
                    </g>
                  ) : null;
                })}
                <Label x={236} y={AXIS_Y + 6} text="training epoch" size={16} anchor="end" color={colors.MUTED} u={axisU} />
              </g>
            )}
            {phU > 0.01 && (
              <g opacity={phU}>
                <line x1={snapX(snapUp)} y1={128} x2={snapX(snapUp)} y2={AXIS_Y} stroke={HOT} strokeWidth={2} opacity={0.75} />
                <path d={`M${snapX(snapUp) - 8},${AXIS_Y - 14} L${snapX(snapUp) + 8},${AXIS_Y - 14} L${snapX(snapUp)},${AXIS_Y - 2} Z`} fill={HOT} />
              </g>
            )}
            {phLoU > 0.01 && (
              <g opacity={phLoU * loOp}>
                <line x1={snapX(snapLo)} y1={410} x2={snapX(snapLo)} y2={530} stroke={HOT} strokeWidth={2} opacity={0.75} />
                <path d={`M${snapX(snapLo) - 7},${540} L${snapX(snapLo) + 7},${540} L${snapX(snapLo)},${530} Z`} fill={HOT} />
              </g>
            )}
          </g>
        )}

        <Label x={70} y={290} text="illustrative" size={17} color={colors.MUTED} u={relU} italic />
        <Label x={70} y={311} text="local relations" size={17} color={colors.MUTED} u={relU} italic />

        {/* ================= C11 · the traced history and the final lists ================= */}
        {traceU > 0.01 && (
          <g>
            <Branch c={branch(N_UP, [COLX[0], UP.fields])} u={clamp01(traceU * 4)} color={HOT} width={2} />
            <Branch c={branch(N_LO, [COLX[0], LO.fields])} u={clamp01(traceU * 4)} color={HOT} width={2} />
            {UP_EDGES.filter((e) => TRACE_IDS.has(e.b.id)).map((e, i) => (
              <Branch key={i} c={e.c} u={clamp01(traceU * 4 - 1 - e.a.col)} color={HOT} width={2} dash={e.remnant ? '4 6' : undefined} />
            ))}
            {traceU * 4 > 1 && (
              <line x1={COLX[0]} y1={LO.fields} x2={lerp(COLX[0], COLX[3], clamp01((traceU * 4 - 1) / 3))} y2={LO.fields} stroke={HOT} strokeWidth={2} />
            )}
            <VisNode p={[COLX[0], UP.fields]} kind="field" u={clamp01(traceU * 6)} color={HOT} />
            <VisNode p={[COLX[0], LO.fields]} kind="field" u={clamp01(traceU * 6)} color={HOT} />
            {UP_NODES.filter((n) => n.col === 3).map((n) => (
              <VisNode key={n.id} p={posOf(n)} kind={n.kind} u={clamp01((traceU - 0.9) / 0.1)} color={UP_COLOR} remnant={n.id === 'f3'} />
            ))}
            <VisNode p={[COLX[3], LO.fields]} kind="field" u={clamp01((traceU - 0.9) / 0.1)} color={LO_COLOR} />
          </g>
        )}
        {cardU > 0.01 && (
          <g opacity={cardU}>
            <rect x={CARD_X} y={UP.balls - 26} width={CARD_W} height={UP.broc - UP.balls + 52} rx={12} fill={colors.PANEL} stroke={UP_COLOR} strokeWidth={1.5} />
            {UP_CARD.map((r) => (
              <g key={r.text}>
                <line x1={COLX[3] + NODE_R + 4} y1={r.y} x2={CARD_X} y2={r.y} stroke={HOT} strokeWidth={1.5} strokeDasharray={r.remnant ? '3 4' : undefined} opacity={0.8} />
                <text x={CARD_X + 18} y={r.y + 7} fontSize={r.remnant ? 17 : 21} fill={r.remnant ? colors.MUTED : colors.TEXT} fontStyle={r.remnant ? 'italic' : undefined}>
                  {r.text}
                </text>
              </g>
            ))}
            <rect x={CARD_X} y={LO.fields - 26} width={CARD_W} height={52} rx={12} fill={colors.PANEL} stroke={LO_COLOR} strokeWidth={1.5} />
            <line x1={COLX[3] + NODE_R + 4} y1={LO.fields} x2={CARD_X} y2={LO.fields} stroke={HOT} strokeWidth={1.5} opacity={0.8} />
            <text x={CARD_X + 18} y={LO.fields + 7} fontSize={21} fill={colors.TEXT}>
              rapeseed fields
            </text>
          </g>
        )}

        {/* ================= C10 · the schematic inset ================= */}
        {insetU > 0.01 && (
          <g opacity={insetU}>
            <rect x={945} y={112} width={250} height={218} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <line x1={975} y1={205} x2={1165} y2={205} stroke={TREE} strokeWidth={3} strokeLinecap="round" />
            <circle cx={975} cy={205} r={7} fill={PLATE} stroke={TREE} strokeWidth={2.5} />
            <circle cx={1165} cy={205} r={7} fill={PLATE} stroke={TREE} strokeWidth={2.5} />
            <Branch c={branch([1045, 205], [1092, 158])} u={twigU} color={TREE} width={3} />
            {twigU > 0.95 && <circle cx={1092} cy={158} r={5} fill={PLATE} stroke={TREE} strokeWidth={2} opacity={clamp01((twigU - 0.95) / 0.05)} />}
            <g opacity={insetTxt}>
              <text x={1070} y={262} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
                side branches: less common
              </text>
              <text x={1070} y={284} textAnchor="middle" fontSize={17} fill={colors.TEXT}>
                and less important
              </text>
              <text x={1070} y={310} textAnchor="middle" fontSize={17} fill={HOT} fontStyle="italic">
                (a claim to test)
              </text>
            </g>
          </g>
        )}

        {/* ================= the neuron nodes and model labels (persistent) ================= */}
        {nodeU > 0.01 && (
          <g opacity={nodeU}>
            {litU > 0.01 && langOp > 0.01 && <circle cx={nPos[0]} cy={nPos[1]} r={26} fill={HOT} opacity={0.2 * litU * langOp} />}
            <circle cx={nPos[0]} cy={nPos[1]} r={15} fill={PLATE} stroke={nodeMove > 0.5 ? UP_COLOR : '#e6edf6'} strokeWidth={3} />
            <circle cx={nPos[0]} cy={nPos[1]} r={5} fill={nodeMove > 0.5 ? UP_COLOR : '#e6edf6'} />
          </g>
        )}
        {loU > 0.01 && (
          <g opacity={loU * Math.max(loOp, 0)}>
            <circle cx={N_LO[0]} cy={N_LO[1]} r={15} fill={PLATE} stroke={LO_COLOR} strokeWidth={3} />
            <circle cx={N_LO[0]} cy={N_LO[1]} r={5} fill={LO_COLOR} />
          </g>
        )}
        {/* model labels stacked left of the epoch-0.7 column, so no playhead crosses them */}
        <g opacity={incU}>
          <Label x={70} y={166} text="InceptionV1" size={20} mono u={incU} color={UP_COLOR} />
          <Label x={70} y={189} text="neuron 338" size={20} mono u={incU} color={UP_COLOR} />
          <Label x={70} y={209} text="retrained · last layer" size={14} u={incU} color={colors.MUTED} />
        </g>
        <Label x={70} y={421} text="ConvNeXt" size={20} mono u={loU * loOp} color={LO_COLOR} />
        <Label x={70} y={444} text="neuron 399" size={20} mono u={loU * loOp} color={LO_COLOR} />

        {/* ================= closing panel (opaque) ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={300} y={540} width={680} height={60} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <rect x={300} y={540} width={680} height={60} rx={14} fill={colors.PANEL} opacity={0.6} />
            <text x={640} y={579} textAnchor="middle" fontSize={26} fontWeight={650} fill={colors.TEXT}>
              A distant endpoint can have a local history.
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space status chip ================= */}
      {CHIPS.map((text, i) => {
        const u = chip(i);
        if (u <= 0.01) return null;
        const w = text.length * 8.9 + 30;
        return (
          <g key={i} opacity={u}>
            <rect x={36} y={26} width={w} height={38} rx={9} fill={colors.PANEL} stroke={HOT} strokeOpacity={0.55} strokeWidth={1.4} />
            <text x={51} y={51} fontSize={17} fill={colors.TEXT}>
              {text}
            </text>
          </g>
        );
      })}
    </>
  );
}

export const vizScene = () => scene;
