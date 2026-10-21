// The Lookup Circuit
//
// Data Adapter — chapter 1. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/data-adapter/README.md:3 (exhaustive search, nothing trains neural weights), 9 (12 storage slots, fields,
//     selected ID, origins, scale), 11 ({found, value}; inactive rows may repeat any ID with misleading geometry;
//     duplicate active IDs rejected), 13-19 (the three rows), 21 (left 40; absent ID 99 → found 0),
//     27-29 (predicates, fields, steps), 74 (ReLU(1 - abs(id - selectedID)), exact on integers), 78 (one-hot)
//   lab/data-adapter/experiment.ts:3 (CAPACITY = 12), 9-10 (PREDICATES, STEPS), 8 (FIELDS),
//     26-52 (encode: 'active IDs must be unique'), 121-162 (compileLookup: difference, two relus, tent,
//     bit × active, count, found = count − ReLU(count − 1), read = Σ bit·field, assumeOneHot(bits, true)),
//     184 (select(found, 0, value)), 192-195 (subtract origin, multiply scale)
//   src/runtime/numeric-ui-core.ts:324 (assumeOneHot(members, allowAllZero)), 435-441 (select), 1934 (emitRelu)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The visual machine is the slot rack: twelve slot cards, a d-axis on which
// two relu ramps sum to |d| and morph into the tent, a bit gauge per slot, and readouts below. Storage order
// (slots 0, 3, 7) and the decoy row's geometry (slot 10) are SCHEMATIC and labelled so; every bit, count,
// found, read and the ungated −8 are computed below with compileLookup's own formulas.
import 'katex/dist/katex.min.css';
import { scaleLinear } from 'd3';
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
import { FunctionPlot } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const CH13 = 7.8; // mono advance at 13 px
const WHISPER = 0.12;

// ---------------------------------------------------------------------------
// compileLookup (experiment.ts:121-162), exact, for predicates [active, same-id]
// ---------------------------------------------------------------------------

const relu = (x: number): number => Math.max(0, x);
const absByRelus = (d: number): number => relu(d) + relu(-d);
/** the same-id test: ReLU(1 − |d|), exact for integer IDs (README.md:74) */
const tent = (d: number): number => relu(1 - absByRelus(d));

type Slot = { active: 0 | 1; id: number; left: number; top: number; width: number; height: number };
const FIELDS = ['left', 'top', 'width', 'height'] as const;
const ROWS = ['active', 'id', ...FIELDS] as const;
const CAPACITY = 12; // experiment.ts:3
const EMPTY: Slot = { active: 0, id: 0, left: 0, top: 0, width: 0, height: 0 };
// README.md:15-19 — the three active rows
const ROW10: Slot = { active: 1, id: 10, left: 7, top: 3, width: 5, height: 9 };
const ROW20: Slot = { active: 1, id: 20, left: 40, top: 10, width: 12, height: 8 };
const ROW30: Slot = { active: 1, id: 30, left: -6, top: 24, width: 20, height: 4 };
const TABLE = [ROW10, ROW20, ROW30];
// schematic storage order ("regardless of their storage order", README.md:13)
const ACTIVE_AT: Record<number, Slot> = { 0: ROW30, 3: ROW10, 7: ROW20 };
const TABLE_SLOT = [3, 7, 0]; // where each README row lands
// schematic decoy: inactive, repeats the wanted ID, misleading geometry (README.md:11)
const DECOY_SLOT = 10;
const DECOY: Slot = { active: 0, id: 20, left: 77, top: 66, width: 5, height: 5 };
const DUP_SLOT = 5;
const SLOTS: Slot[] = Array.from({ length: CAPACITY }, (_, i) => ACTIVE_AT[i] ?? (i === DECOY_SLOT ? DECOY : EMPTY));

const ORIGIN_X = 4; // README.md:21
const SCALE = 2;

/** bit = 1 · active · ReLU(1 − |id − selectedID|) — `gate` lerps the active multiply in */
const bitOf = (s: Slot, sel: number, gate: number): number => tent(s.id - sel) * lerp(1, s.active, gate);
function lookup(sel: number) {
  const bits = SLOTS.map((s) => bitOf(s, sel, 1));
  const count = bits.reduce((a, b) => a + b, 0);
  const found = count - relu(count - 1);
  const read = bits.reduce((a, b, i) => a + b * SLOTS[i].left, 0);
  return { bits, count, found, read, value: found * read }; // select(found, 0, read)
}
const AT20 = lookup(20);
const AT99 = lookup(99);
if (AT20.count !== 1 || AT20.found !== 1 || AT20.read !== 40) throw new Error('lookup(20) mismatch');
if (AT99.count !== 0 || AT99.found !== 0 || AT99.value !== 0) throw new Error('lookup(99) mismatch');
// local left without the select gate: (read − originX) · scale on an absent row
const UNGATED_LOCAL_LEFT = (AT99.read - ORIGIN_X) * SCALE; // −8
const DEMO_D = ROW10.id - 20; // −10
const DEMO_ABS = absByRelus(DEMO_D); // 10

const fmt = (v: number): string => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : Number.isInteger(r) ? String(r) : r.toFixed(1);
};
const neg = (v: number): string => (v < 0 ? `−${-v}` : String(v));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

const RACK = { x0: 140, pitch: 92, w: 84, y: 304, cell: 24 };
const cardX = (i: number) => RACK.x0 + i * RACK.pitch;
const cardC = (i: number) => cardX(i) + RACK.w / 2;
const rowY = (r: number) => RACK.y + r * RACK.cell;
const RACK_BOT = rowY(ROWS.length);
const GAUGE_Y = 478;
const GAUGE_R = 14;
const PROD_Y = 530;
const COUNT_C = { x: 330, y: 556 };
const READ_C = { x: 930, y: 556 };

// d-axis plot (top-left)
const X = scaleLinear([-12.5, 12.5], [130, 690]);
const PLOT_TOP = 98;
const PLOT_BOT = 250;
const DOM_RAMP: [number, number] = [-0.7, 13];
const DOM_TENT: [number, number] = [-0.1, 1.2];
const yScale = (u: number) =>
  scaleLinear([lerp(DOM_RAMP[0], DOM_TENT[0], u), lerp(DOM_RAMP[1], DOM_TENT[1], u)], [PLOT_BOT, PLOT_TOP]);
const D_INTS = Array.from({ length: 25 }, (_, i) => i - 12);

// equation column and input rail
const EQ_X = 722;
const EQ_Y = [112, 177, 242];
const RAIL = { x: 1040, w: 200, y0: 92, gap: 42 };

// intro: the README's three rectangles drawn to scale (screen y down)
const RS = 7;
const rx = (x: number) => 640 + (x - 23) * RS;
const ry = (y: number) => 222 + (y - 15.5) * RS;

const HOME: CameraState = CAMERA_HOME;
const CAM_INTRO: CameraState = { x: 640, y: 300, k: 1.1 };
const CAM_TENT: CameraState = { x: 560, y: 262, k: 1.28 };
const CAM_DECOY: CameraState = { x: 860, y: 398, k: 1.25 };
const CAM_END: CameraState = { x: 640, y: 340, k: 0.94 };

/** per-item progress from one group channel */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};
/** spoken-length duration at ~150 wpm */
const speak = (text: string): number => text.split(/\s+/).length / 2.5 + 0.4;

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions, ≈160 s
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_INTRO, cameraInterp);
  let t = 0.4;
  const say = (text: string): number => {
    const at = t;
    const dur = speak(text);
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, 0.9);
    return at;
  };

  // intro
  const introOp = tl.channel('introOp', 1);
  const rectsU = tl.channel('rectsU', 0);
  const queryU = tl.channel('queryU', 0);
  const pickU = tl.channel('pickU', 0);
  const opsU = tl.channel('opsU', 0);
  const badgeU = tl.channel('badgeU', 0);
  // rack
  const rackU = tl.channel('rackU', 0);
  const rowGlow = tl.channel('rowGlow', -1);
  const tableU = tl.channel('tableU', 0);
  const dropU = tl.channel('dropU', 0);
  const anyU = tl.channel('anyOrderU', 0);
  const railU = tl.channel('railU', 0);
  const railGlow = tl.channel('railGlow', -1);
  const railOp = tl.channel('railOp', 1);
  const spot = tl.channel('spotSlot', -1);
  const spotU = tl.channel('spotU', 0);
  // plot + equations
  const plotU = tl.channel('plotU', 0);
  const plotOp = tl.channel('plotOp', 1);
  const markU = tl.channel('markU', 0);
  const rampA = tl.channel('rampA', 0);
  const rampB = tl.channel('rampB', 0);
  const absU = tl.channel('absU', 0);
  const morphU = tl.channel('morphU', 0);
  const intDots = tl.channel('intDots', 0);
  const eqD = tl.channel('eqD', 0);
  const eqAbs = tl.channel('eqAbs', 0);
  const eqTent = tl.channel('eqTent', 0);
  const eqGate = tl.channel('eqGate', 0);
  const eqOp = tl.channel('eqOp', 1);
  // bits
  const slotDots = tl.channel('slotDots', 0);
  const gaugeU = tl.channel('gaugeU', 0);
  const sel = tl.channel('selectedID', 20);
  const decoyU = tl.channel('decoyU', 0);
  const decoyTent = tl.channel('decoyTent', 0);
  const gateU = tl.channel('gateU', 0);
  // readouts
  const countPk = tl.channel('countPackets', 0);
  const countTex = tl.channel('countTex', 0);
  const foundTex = tl.channel('foundTex', 0);
  const leftGlow = tl.channel('leftRowGlow', 0);
  const prodU = tl.channel('prodU', 0);
  const readPk = tl.channel('readPackets', 0);
  const readTex = tl.channel('readTex', 0);
  const readOp = tl.channel('readOp', 1);
  const ungatedU = tl.channel('ungatedU', 0);
  const absentU = tl.channel('absentU', 0);
  // uniqueness
  const dupU = tl.channel('dupU', 0);
  const dupBounce = tl.channel('dupBounce', 0);
  const dupOp = tl.channel('dupOp', 0);
  const oneHotU = tl.channel('oneHotU', 0);
  // payoff
  const rackOp = tl.channel('rackOp', 1);
  const finalU = tl.channel('finalU', 0);
  const chipsU = tl.channel('chipsU', 0);

  // — B0 · a lookup, as a picture —
  let a = say('Programs look things up constantly: given a list of rectangles, find the one with this identifier. This lab asks whether a small search can discover that lookup as a circuit of weighted sums and relu.');
  tl.tween(rectsU, 1, { at: a + 0.3, dur: 1.6, ease: ease.draw });
  tl.tween(queryU, 1, { at: a + 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(pickU, 1, { at: a + 4.6, dur: 0.8, ease: ease.move });
  tl.tween(opsU, 1, { at: a + 9.4, dur: 0.7, ease: ease.enter });

  // — B1 · nothing trained —
  a = say('Nothing here is trained. No weights are learned. The search just tries small programs and keeps the ones whose answers match.');
  tl.tween(opsU, 0, { at: a + 0.1, dur: 0.5, ease: ease.move });
  tl.tween(badgeU, 1, { at: a + 0.4, dur: 0.5, ease: ease.pop });

  // — B2 · the rack —
  a = say('The circuit has twelve storage slots. Each slot holds an active bit, an identifier, and four numbers: left, top, width, and height.');
  tl.tween(introOp, 0, { at: a, dur: 0.7, ease: ease.move });
  tl.tween(cam, HOME, { at: a + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(rackU, 1, { at: a + 0.6, dur: 2.0, ease: ease.linear });
  tl.tween(rowGlow, 5.99, { at: a + 3.6, dur: 4.6, ease: ease.linear });
  tl.set(rowGlow, -1, a + 8.9);

  // — B3 · three rows, four inputs —
  a = say('Three rows are active, with identifiers ten, twenty, and thirty. Other inputs say which identifier we want, where the origin sits, and the scale. The rows may sit in any slots.');
  tl.tween(tableU, 1, { at: a + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(dropU, 1, { at: a + 1.8, dur: 2.4, ease: ease.move });
  tl.tween(railU, 1, { at: a + 5.2, dur: 1.4, ease: ease.linear });
  tl.tween(tableU, 0, { at: a + 8.6, dur: 0.6, ease: ease.move });
  tl.tween(anyU, 1, { at: a + 10.0, dur: 0.6, ease: ease.enter });

  // — B4 · distance from two relu ramps —
  a = say('Each slot needs a bit saying this is the row. First, measure how far its identifier is from the wanted one, using two relu ramps, one for each sign of the difference.');
  tl.tween(anyU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_TENT, { at: a + 0.2, dur: 1.4, ease: ease.move });
  tl.set(spot, 3, a);
  tl.tween(spotU, 1, { at: a + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(railOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(plotU, 1, { at: a + 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(eqD, 1, { at: a + 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(markU, 1, { at: a + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(rampA, 1, { at: a + 7.2, dur: 1.2, ease: ease.draw });
  tl.tween(rampB, 1, { at: a + 9.0, dur: 1.2, ease: ease.draw });
  tl.tween(eqAbs, 1, { at: a + 10.6, dur: 0.6, ease: ease.enter });
  tl.tween(absU, 1, { at: a + 11.2, dur: 1.2, ease: ease.draw });

  // — B5 · the tent —
  a = say('Then relu of one minus that distance makes a tent: one when the distance is zero, and zero at every other whole number. For whole-number identifiers, that is exact.');
  tl.tween(eqD, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(eqAbs, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(rampA, 0, { at: a + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(rampB, 0, { at: a + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(morphU, 1, { at: a + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(eqTent, 1, { at: a + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(intDots, 1, { at: a + 4.4, dur: 1.4, ease: ease.linear });

  // — B6 · ask for twenty —
  a = say('Ask for twenty. The slot holding twenty gets a one. The slots holding ten and thirty are ten away, so their tents are zero.');
  tl.tween(cam, HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(spotU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(markU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(intDots, WHISPER, { at: a + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(railOp, 1, { at: a + 0.2, dur: 0.6, ease: ease.move });
  tl.set(railGlow, 0, a + 0.3);
  tl.tween(slotDots, 1, { at: a + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(gaugeU, 1, { at: a + 2.2, dur: 1.6, ease: ease.linear });
  tl.set(spot, 7, a + 3.8);
  tl.tween(spotU, 1, { at: a + 3.8, dur: 0.6, ease: ease.move });
  tl.set(railGlow, -1, a + 9.4);

  // — B7 · the decoy —
  a = say("Now a trap: an inactive row can repeat the wanted identifier and carry misleading geometry. So each bit is multiplied by the slot's active bit, and the inactive row goes silent.");
  tl.tween(spotU, 0, { at: a, dur: 0.4, ease: ease.move });
  tl.set(spot, DECOY_SLOT, a + 0.4);
  tl.tween(spotU, 1, { at: a + 0.5, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_DECOY, { at: a + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(plotOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(railOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(eqD, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(eqAbs, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(decoyU, 1, { at: a + 1.4, dur: 0.8, ease: ease.enter });
  tl.tween(decoyTent, 1, { at: a + 4.0, dur: 0.6, ease: ease.move });
  tl.tween(eqTent, WHISPER, { at: a + 6.4, dur: 0.5, ease: ease.move });
  tl.tween(eqGate, 1, { at: a + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(gateU, 1, { at: a + 8.4, dur: 1.2, ease: ease.move });

  // — B8 · count and found —
  a = say('Add the bits to get a count, here one. Then found is the count minus relu of the count minus one, which caps it at one.');
  tl.tween(cam, HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(spotU, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(plotOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(eqOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(railOp, 1, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(countPk, 1, { at: a + 0.8, dur: 2.0, ease: ease.linear });
  tl.tween(countTex, 1, { at: a + 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(foundTex, 1, { at: a + 5.0, dur: 0.6, ease: ease.enter });

  // — B9 · read a field —
  a = say('To read a field, multiply every slot\'s value by its bit and add them up. Only the selected row survives, so the left edge comes out as forty.');
  tl.tween(leftGlow, 1, { at: a + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(prodU, 1, { at: a + 2.0, dur: 1.2, ease: ease.linear });
  tl.tween(readPk, 1, { at: a + 4.4, dur: 2.0, ease: ease.linear });
  tl.tween(readTex, 1, { at: a + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(leftGlow, 0, { at: a + 10.6, dur: 0.6, ease: ease.move });

  // — B10 · ask for ninety-nine —
  a = say('Ask for ninety-nine instead. Every bit is zero, found is zero, and the value is forced to zero, even though the origin is not zero.');
  tl.set(railGlow, 0, a);
  tl.tween(eqOp, 0, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(sel, 99, { at: a + 0.8, dur: 2.0, ease: ease.move });
  tl.set(railGlow, 1, a + 6.0);
  tl.tween(ungatedU, 1, { at: a + 6.2, dur: 0.6, ease: ease.enter });
  tl.tween(absentU, 1, { at: a + 7.2, dur: 0.6, ease: ease.enter });

  // — B11 · unique active IDs, one-hot —
  a = say('Two active rows may never share an identifier. The input check rejects duplicates, and that promise lets the bits be declared one-hot, with all zeros allowed.');
  tl.set(railGlow, -1, a);
  tl.tween(readOp, WHISPER, { at: a, dur: 0.6, ease: ease.move });
  tl.tween(ungatedU, 0, { at: a, dur: 0.5, ease: ease.move });
  tl.tween(dupOp, 1, { at: a + 0.4, dur: 0.4, ease: ease.enter });
  tl.tween(dupU, 1, { at: a + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(dupBounce, 1, { at: a + 2.0, dur: 1.0, ease: ease.enter });
  tl.tween(dupOp, 0, { at: a + 4.6, dur: 0.6, ease: ease.move });
  tl.tween(oneHotU, 1, { at: a + 5.6, dur: 0.8, ease: ease.enter });
  tl.tween(sel, 20, { at: a + 8.0, dur: 2.4, ease: ease.move });

  // — B12 · the machinery every candidate uses —
  a = say('That is the machinery every candidate is built from: choose some row tests, then read a field. The search decides which tests, which field, and what arithmetic follows.');
  tl.tween(cam, CAM_END, { at: a, dur: 1.4, ease: ease.move });
  tl.tween(rackOp, 0.12, { at: a, dur: 1.0, ease: ease.move });
  tl.tween(plotOp, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(eqOp, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(readOp, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(railOp, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(oneHotU, 0, { at: a, dur: 0.8, ease: ease.move });
  tl.tween(finalU, 1, { at: a + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(chipsU, 1, { at: a + 2.4, dur: 5.0, ease: ease.linear });

  return {
    tl, cam, introOp, rectsU, queryU, pickU, opsU, badgeU, rackU, rowGlow, tableU, dropU, anyU, railU, railGlow, railOp,
    spot, spotU, plotU, plotOp, markU, rampA, rampB, absU, morphU, intDots, eqD, eqAbs, eqTent, eqGate, eqOp,
    slotDots, gaugeU, sel, decoyU, decoyTent, gateU, countPk, countTex, foundTex, leftGlow, prodU, readPk,
    readTex, readOp, ungatedU, absentU, dupU, dupBounce, dupOp, oneHotU, rackOp, finalU, chipsU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

/** Bit gauge: a disc filled from the bottom by v ∈ [0, 1], with its value. */
function Gauge({ cx, cy, v, color, opacity }: { cx: number; cy: number; v: number; color: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  const r = GAUGE_R;
  const vv = clamp01(v);
  const ly = cy + r - 2 * r * vv;
  const w = Math.sqrt(Math.max(0, r * r - (ly - cy) * (ly - cy)));
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={colors.BG} />
      {vv >= 0.995 && <circle cx={cx} cy={cy} r={r} fill={color} />}
      {vv > 0.005 && vv < 0.995 && (
        <path d={`M ${cx - w} ${ly} A ${r} ${r} 0 ${vv > 0.5 ? 1 : 0} 0 ${cx + w} ${ly} Z`} fill={color} />
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2} />
      <text
        x={cx}
        y={cy + 4.5}
        textAnchor="middle"
        fontSize={13}
        fontFamily={MONO}
        fontWeight={700}
        fill={vv > 0.6 ? '#1a1206' : color}
        stroke={vv > 0.05 && vv <= 0.6 ? '#0a0e1a' : 'none'}
        strokeWidth={3}
        paintOrder="stroke"
      >
        {fmt(v)}
      </text>
    </g>
  );
}

function Pill({ x, y, text, color, opacity, size = 15, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity: number; size?: number; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * size * 0.6 + 24;
  const h = size + 14;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + size * 0.35} textAnchor="middle" fontSize={size} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

const quad = (x0: number, y0: number, x1: number, y1: number, lift: number, u: number) => {
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - lift;
  const m = 1 - u;
  return { x: m * m * x0 + 2 * m * u * cx + u * u * x1, y: m * m * y0 + 2 * m * u * cy + u * u * y1 };
};

const FINAL_CHIPS = [
  { title: 'row tests', lines: ['active', 'same-id', 'first-slot'], foot: 'zero, one or two · AND', color: colors.WARM },
  { title: 'read a field', lines: [...FIELDS], foot: 'Σ bit · field', color: colors.ACCENT },
  {
    title: 'arithmetic steps',
    lines: ['add-width', 'add-height', 'subtract-origin-x', 'subtract-origin-y', 'multiply-scale'],
    foot: 'zero, one or two, in order',
    color: colors.SECONDARY,
  },
];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const introOp = v(scene.introOp);
  const rectsU = v(scene.rectsU);
  const pickU = v(scene.pickU);
  const rackU = v(scene.rackU);
  const rackOp = v(scene.rackOp);
  const rowGlow = v(scene.rowGlow);
  const dropU = v(scene.dropU);
  const tableU = v(scene.tableU);
  const railU = v(scene.railU);
  const railOp = v(scene.railOp);
  const railGlow = Math.round(v(scene.railGlow));
  const spot = Math.round(v(scene.spot));
  const spotU = v(scene.spotU);
  const sel = v(scene.sel);
  const selShown = Math.round(sel);
  const decoyU = v(scene.decoyU);
  const gateU = v(scene.gateU);
  const gaugeU = v(scene.gaugeU);
  const decoyTent = v(scene.decoyTent);

  // slot contents as currently shown
  const landed = (i: number) => {
    const k = TABLE_SLOT.indexOf(i);
    return k < 0 ? 1 : clamp01((staggerU(dropU, k, 3, 0.25, 0.7) - 0.85) / 0.15);
  };
  const shown = (i: number): Slot => {
    if (ACTIVE_AT[i]) return landed(i) >= 0.5 ? ACTIVE_AT[i] : EMPTY;
    if (i === DECOY_SLOT) return decoyU >= 0.5 ? DECOY : EMPTY;
    return EMPTY;
  };
  // the live bit per slot (the decoy's tent is introduced by its own channel)
  const bitLive = (i: number): number => {
    const slot = shown(i);
    let b = bitOf(slot, sel, gateU);
    if (i === DECOY_SLOT) b = tent(DECOY.id - sel) * decoyTent * lerp(1, 0, gateU);
    return b;
  };
  const bits = Array.from({ length: CAPACITY }, (_, i) => bitLive(i));
  const count = bits.reduce((x, y) => x + y, 0);
  const found = count - relu(count - 1);
  const read = bits.reduce((acc, b, i) => acc + b * shown(i).left, 0);
  const value = found * read;

  const labelOp = spot === DECOY_SLOT ? lerp(1, WHISPER, spotU) : 1;
  const cardOp = (i: number) => rackOp * (i === spot ? 1 : lerp(1, WHISPER, spotU));

  // plot state
  const plotU = v(scene.plotU);
  const plotOp = v(scene.plotOp);
  const morph = v(scene.morphU);
  const Y = yScale(morph);
  const y0 = Y(0);
  const markU = v(scene.markU);
  const slotDots = v(scene.slotDots);
  const intDots = v(scene.intDots);

  // readouts
  const countPk = v(scene.countPk);
  const readPk = v(scene.readPk);
  const prodU = v(scene.prodU);
  const readOp = v(scene.readOp);
  const leftGlow = v(scene.leftGlow);
  const oneHotU = v(scene.oneHotU);

  // duplicate card
  const dupU = v(scene.dupU);
  const dupB = v(scene.dupBounce);
  const DUP_STOP = 226;
  const dupY = dupB > 0 ? DUP_STOP - 70 * Math.sin(Math.PI * 0.5 * dupB) : lerp(110, DUP_STOP, dupU);
  const dupHit = dupU >= 0.999 ? clamp01(1 - dupB * 0.4) : 0;

  const finalU = v(scene.finalU);
  const chipsU = v(scene.chipsU);

  const RAIL_ITEMS = [
    { k: 'selectedID', val: String(selShown) },
    { k: 'originX', val: String(ORIGIN_X) },
    { k: 'originY', val: '' },
    { k: 'scale', val: String(SCALE) },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="da1-plot-clip">
          <rect x={118} y={PLOT_TOP - 14} width={584} height={PLOT_BOT - PLOT_TOP + 20} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= B0–B1 · the README's rectangles and a query ================= */}
        {introOp > 0.005 && (
          <g opacity={introOp}>
            <line x1={rx(-8)} y1={ry(0)} x2={rx(56)} y2={ry(0)} stroke={colors.GRID} strokeWidth={1} opacity={rectsU} />
            <line x1={rx(0)} y1={ry(-2)} x2={rx(0)} y2={ry(31)} stroke={colors.GRID} strokeWidth={1} opacity={rectsU} />
            {TABLE.map((r, k) => {
              const u = staggerU(rectsU, k, 3, 0.25, 0.6);
              if (u <= 0.005) return null;
              const isPick = r.id === 20;
              const stroke = isPick ? (pickU > 0.5 ? colors.WARM : colors.ACCENT) : colors.ACCENT;
              const dim = isPick ? 1 : lerp(1, 0.35, pickU);
              return (
                <g key={r.id} opacity={u * dim}>
                  <rect
                    x={rx(r.left)}
                    y={ry(r.top)}
                    width={r.width * RS}
                    height={r.height * RS}
                    fill={stroke}
                    fillOpacity={isPick ? 0.12 + 0.18 * pickU : 0.1}
                    stroke={stroke}
                    strokeWidth={isPick ? 2 + pickU : 2}
                  />
                  <text x={rx(r.left) + 4} y={ry(r.top) - 7} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                    {`id ${r.id}`}
                  </text>
                </g>
              );
            })}
            <Pill x={1000} y={150} text="find id 20" color={colors.WARM} opacity={v(scene.queryU)} size={18} />
            {pickU > 0.005 && (
              <path
                d={`M ${930} ${158} Q ${880} ${190} ${rx(52) + 6} ${ry(12)}`}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={pickU}
              />
            )}
            <g opacity={v(scene.opsU)}>
              <MathLabel tex={'\\textstyle\\sum_i w_i x_i + b'} x={500} y={430} fontSize={26} />
              <text x={500} y={474} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                weighted sums
              </text>
              <MathLabel tex={'\\mathrm{ReLU}(x) = \\max(0, x)'} x={800} y={430} fontSize={26} color={colors.SECONDARY} />
              <text x={800} y={474} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
                relu
              </text>
            </g>
            {v(scene.badgeU) > 0.005 && (
              <g opacity={v(scene.badgeU)}>
                <rect x={430} y={410} width={420} height={96} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
                <text x={640} y={448} textAnchor="middle" fontSize={22} fontWeight={700} fill={colors.POSITIVE}>
                  nothing trained · no learned weights
                </text>
                <text x={640} y={482} textAnchor="middle" fontSize={15} fill={colors.TEXT}>
                  search tries small programs, keeps the ones that match
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the d-axis: two ramps → |d| → the tent ================= */}
        {plotU > 0.005 && (
          <g opacity={plotOp}>
            <line x1={X(-12.5)} y1={y0} x2={lerp(X(-12.5), X(12.5), plotU)} y2={y0} stroke={colors.MUTED} strokeWidth={2} />
            {D_INTS.map((d, k) => (
              <g key={d} opacity={staggerU(plotU, k, 25, 0.02, 0.4)}>
                <line x1={X(d)} y1={y0} x2={X(d)} y2={y0 + (d % 5 === 0 ? 7 : 4)} stroke={colors.MUTED} strokeWidth={1.2} />
                {d % 5 === 0 && (
                  <text x={X(d)} y={y0 + 21} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                    {neg(d)}
                  </text>
                )}
              </g>
            ))}
            <text x={X(12.5) + 8} y={y0 + 5} fontSize={17} fontStyle="italic" fill={colors.MUTED} opacity={plotU}>
              d
            </text>
            {/* y ticks: 10 for the ramps, 1 for the tent */}
            <g opacity={plotU * (1 - morph)}>
              <line x1={X(-12.5)} y1={Y(10)} x2={X(12.5)} y2={Y(10)} stroke={colors.GRID} />
              <text x={X(-12.5) - 6} y={Y(10) + 4} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                10
              </text>
            </g>
            <g opacity={plotU * morph}>
              <line x1={X(-12.5)} y1={Y(1)} x2={X(12.5)} y2={Y(1)} stroke={colors.GRID} />
              <text x={X(-12.5) - 6} y={Y(1) + 4} textAnchor="end" fontSize={13} fontFamily={MONO} fill={colors.MUTED}>
                1
              </text>
            </g>
            <g clipPath="url(#da1-plot-clip)">
              <FunctionPlot x={X} y={Y} f={(d) => relu(d)} reveal={v(scene.rampA)} color={colors.ACCENT} width={2.5} opacity={v(scene.rampA) > 0 ? 1 : 0} />
              <FunctionPlot x={X} y={Y} f={(d) => relu(-d)} domain={[-12.5, 12.5]} reveal={v(scene.rampB)} color={colors.SECONDARY} width={2.5} opacity={v(scene.rampB) > 0 ? 1 : 0} />
              <FunctionPlot x={X} y={Y} f={tent} morph={{ from: absByRelus, u: morph }} reveal={v(scene.absU)} color={colors.WARM} width={3.5} samples={401} />
            </g>
            {/* ramp labels */}
            <g opacity={Math.min(v(scene.rampA), 1 - morph)}>
              <text x={X(5) + 8} y={Y(5) + 22} fontSize={15} fill={colors.ACCENT}>ReLU(d)</text>
            </g>
            <g opacity={Math.min(v(scene.rampB), 1 - morph)}>
              <text x={X(-5) - 8} y={Y(5) + 22} textAnchor="end" fontSize={15} fill={colors.SECONDARY}>ReLU(−d)</text>
            </g>
            <g opacity={Math.min(v(scene.absU), 1 - morph)}>
              <text x={X(0)} y={Y(6)} textAnchor="middle" fontSize={17} fill={colors.WARM}>|d|</text>
            </g>
            {/* integer dots on the tent: zero at every other whole number */}
            {intDots > 0.005 &&
              D_INTS.map((d, k) => {
                const u = staggerU(clamp01(intDots / 1), k, 25, 0.03, 0.3);
                const isPeak = d === 0;
                return (
                  <circle key={d} cx={X(d)} cy={Y(tent(d))} r={isPeak ? 6 : 4} fill={isPeak ? colors.WARM : colors.TEXT} opacity={u * (intDots > 0.5 ? 1 : intDots * 2)} />
                );
              })}
            {/* the d = −10 marker for slot 3 */}
            {markU > 0.005 && (
              <g opacity={markU}>
                <line x1={X(DEMO_D)} y1={y0} x2={X(DEMO_D)} y2={PLOT_TOP - 6} stroke={colors.TEXT} strokeWidth={1.2} strokeDasharray="3 4" />
                <circle cx={X(DEMO_D)} cy={Y(relu(DEMO_D))} r={5} fill={colors.ACCENT} opacity={v(scene.rampA)} />
                <circle cx={X(DEMO_D)} cy={Y(relu(-DEMO_D))} r={5} fill={colors.SECONDARY} opacity={v(scene.rampB) * (1 - morph)} />
                <circle cx={X(DEMO_D)} cy={Y(lerp(DEMO_ABS, tent(DEMO_D), morph))} r={6} fill={colors.WARM} opacity={v(scene.absU)} />
                <text x={X(DEMO_D) + 8} y={PLOT_TOP + 4} fontSize={14} fontFamily={MONO} fill={colors.TEXT}>
                  {`d = ${neg(DEMO_D)}`}
                </text>
              </g>
            )}
            {/* the active rows (and later the decoy) as dots at d = id − selectedID */}
            {slotDots > 0.005 && (
              <g clipPath="url(#da1-plot-clip)" opacity={slotDots}>
                {[3, 7, 0].map((i) => {
                  const d = SLOTS[i].id - sel;
                  const isOne = tent(d) > 0.5;
                  return (
                    <g key={i} opacity={clamp01((12.6 - Math.abs(d)) / 0.6)}>
                      <circle cx={X(d)} cy={Y(tent(d))} r={7} fill={isOne ? colors.WARM : colors.ACCENT} stroke={colors.BG} strokeWidth={2} />
                      <text x={X(d)} y={Y(tent(d)) - 13} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={colors.TEXT}>
                        {`id ${SLOTS[i].id}`}
                      </text>
                    </g>
                  );
                })}
                {decoyU > 0.005 && (
                  <g opacity={decoyU * (1 - 0.9 * gateU) * clamp01((12.6 - Math.abs(DECOY.id - sel)) / 0.6)}>
                    <circle cx={X(DECOY.id - sel)} cy={Y(tent(DECOY.id - sel))} r={12} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="4 3" />
                    <text x={X(DECOY.id - sel) + 18} y={Y(tent(DECOY.id - sel)) + 5} fontSize={13} fontFamily={MONO} fill={colors.NEGATIVE}>
                      decoy
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>
        )}

        {/* ================= equation column ================= */}
        <g opacity={v(scene.eqOp)}>
          <MathLabel tex={'d = \\mathrm{id} - \\mathrm{selectedID}'} x={EQ_X} y={EQ_Y[0]} fontSize={19} anchor="start" boxWidth={310} opacity={v(scene.eqD)} />
          <MathLabel tex={`${ROW10.id} - 20 = ${DEMO_D}`} x={EQ_X + 20} y={EQ_Y[0] + 28} fontSize={16} anchor="start" boxWidth={290} color={colors.MUTED} opacity={v(scene.eqD)} />
          <MathLabel tex={'|d| = \\mathrm{ReLU}(d) + \\mathrm{ReLU}(-d)'} x={EQ_X} y={EQ_Y[1]} fontSize={19} anchor="start" boxWidth={310} opacity={v(scene.eqAbs)} />
          <MathLabel tex={`${relu(DEMO_D)} + ${relu(-DEMO_D)} = ${DEMO_ABS}`} x={EQ_X + 20} y={EQ_Y[1] + 28} fontSize={16} anchor="start" boxWidth={290} color={colors.MUTED} opacity={v(scene.eqAbs)} />
          <MathLabel tex={'\\mathrm{bit} = \\mathrm{ReLU}(1 - |d|)'} x={EQ_X} y={EQ_Y[2]} fontSize={19} anchor="start" boxWidth={310} color={colors.WARM} opacity={v(scene.eqTent) * (1 - v(scene.eqGate))} />
          <MathLabel tex={`\\mathrm{ReLU}(1 - ${DEMO_ABS}) = ${tent(DEMO_D)}`} x={EQ_X + 20} y={EQ_Y[2] + 28} fontSize={16} anchor="start" boxWidth={290} color={colors.MUTED} opacity={v(scene.eqTent) * (1 - v(scene.eqGate))} />
          <MathLabel tex={'\\mathrm{bit} = \\mathrm{active}\\cdot\\mathrm{ReLU}(1 - |d|)'} x={EQ_X} y={EQ_Y[2]} fontSize={19} anchor="start" boxWidth={310} color={colors.WARM} opacity={v(scene.eqGate)} />
          <MathLabel tex={`\\text{decoy: } ${DECOY.active} \\cdot ${tent(DECOY.id - 20)} = ${DECOY.active * tent(DECOY.id - 20)}`} x={EQ_X + 20} y={EQ_Y[2] + 28} fontSize={16} anchor="start" boxWidth={290} color={colors.NEGATIVE} opacity={v(scene.eqGate)} />
        </g>

        {/* ================= input rail ================= */}
        {railU > 0.005 &&
          RAIL_ITEMS.map((it, k) => {
            const u = staggerU(railU, k, 4, 0.2, 0.5);
            if (u <= 0.005) return null;
            const y = RAIL.y0 + k * RAIL.gap;
            const glow = railGlow === 0 ? k === 0 : railGlow === 1 ? k === 1 || k === 3 : false;
            const stroke = glow ? colors.WARM : colors.GRID;
            return (
              <g key={it.k} opacity={u * railOp}>
                <rect x={RAIL.x} y={y - 16} width={RAIL.w} height={32} rx={6} fill={colors.PANEL} stroke={stroke} strokeWidth={glow ? 2 : 1} />
                <text x={RAIL.x + 12} y={y + 5} fontSize={15} fontFamily={MONO} fill={colors.MUTED} xmlSpace="preserve">
                  {it.k}
                  {it.val !== '' && <tspan fill={glow ? colors.WARM : colors.TEXT}>{` = ${it.val}`}</tspan>}
                </text>
              </g>
            );
          })}
        {railU > 0.005 && (
          <text x={RAIL.x} y={RAIL.y0 - 26} fontSize={13} fill={colors.MUTED} opacity={railU * railOp}>
            other inputs
          </text>
        )}
        {v(scene.ungatedU) > 0.005 && (
          <g opacity={v(scene.ungatedU)}>
            <text x={EQ_X} y={166} fontSize={14} fill={colors.MUTED}>
              local left without the gate
            </text>
            <text x={EQ_X} y={192} fontSize={15} fontFamily={MONO} fill={colors.NEGATIVE}>
              {`(0 − ${ORIGIN_X}) × ${SCALE} = ${neg(UNGATED_LOCAL_LEFT)}`}
            </text>
            <text x={EQ_X} y={220} fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
              {`select(found, 0, value) = ${fmt(value)}`}
            </text>
          </g>
        )}

        {/* ================= README rows, dropping into storage ================= */}
        {tableU > 0.005 && (
          <g opacity={tableU}>
            <text x={250} y={118} fontSize={14} fontFamily={MONO} fill={colors.MUTED} xmlSpace="preserve">
              {'  id   left  top  width  height'}
            </text>
            {TABLE.map((r, k) => (
              <text key={r.id} x={250} y={146 + k * 26} fontSize={15} fontFamily={MONO} fill={colors.TEXT} xmlSpace="preserve" opacity={1 - clamp01(staggerU(dropU, k, 3, 0.25, 0.7) * 10)}>
                {`  ${String(r.id).padEnd(5)}${neg(r.left).padStart(4)}  ${String(r.top).padStart(3)}  ${String(r.width).padStart(5)}  ${String(r.height).padStart(6)}`}
              </text>
            ))}
            <text x={570} y={172} fontSize={13} fill={colors.MUTED}>
              active rows (README)
            </text>
          </g>
        )}
        {dropU > 0.005 &&
          TABLE.map((r, k) => {
            const u = staggerU(dropU, k, 3, 0.25, 0.7);
            if (u <= 0.005 || u >= 0.999) return null;
            const i = TABLE_SLOT[k];
            const p = quad(272, 141 + k * 26, cardC(i), rowY(1) + 12, 30, u);
            return <Pill key={r.id} x={p.x} y={p.y} text={`id ${r.id}`} color={colors.ACCENT} opacity={clamp01((u - 0.1) / 0.1)} size={14} />;
          })}
        {v(scene.anyU) > 0.005 && (
          <text x={cardC(0)} y={RACK.y - 30} fontSize={14} fill={colors.ACCENT} opacity={v(scene.anyU)}>
            storage order is free: slots 0, 3, 7 here (schematic)
          </text>
        )}

        {/* ================= the slot rack ================= */}
        {rackU > 0.005 && (
          <g>
            {ROWS.map((name, r) => {
              const glow = Math.floor(rowGlow) === r || (r === 2 && leftGlow > 0.5);
              return (
                <text key={name} x={RACK.x0 - 12} y={rowY(r) + 17} textAnchor="end" fontSize={14} fontFamily={MONO} fill={glow ? colors.WARM : colors.MUTED} opacity={rackOp * labelOp * clamp01(rackU * 3)}>
                  {name}
                </text>
              );
            })}
            <text x={RACK.x0 - 12} y={GAUGE_Y + 5} textAnchor="end" fontSize={14} fontFamily={MONO} fill={colors.WARM} opacity={rackOp * labelOp * gaugeU}>
              bit
            </text>
            {leftGlow > 0.005 && (
              <rect x={RACK.x0 - 4} y={rowY(2) + 1} width={cardX(11) + RACK.w - RACK.x0 + 8} height={RACK.cell - 2} rx={4} fill={colors.WARM} opacity={0.14 * leftGlow * rackOp} />
            )}
            {Array.from({ length: CAPACITY }, (_, i) => {
              const u = staggerU(rackU, i, CAPACITY, 0.1, 0.5);
              if (u <= 0.005) return null;
              const slot = shown(i);
              const isDecoy = i === DECOY_SLOT && decoyU > 0.005;
              const isActive = slot.active === 1;
              const stroke = isDecoy ? colors.NEGATIVE : isActive ? colors.ACCENT : colors.GRID;
              const op = cardOp(i) * u;
              const contentOp = isActive ? landed(i) : isDecoy ? 0.4 + 0.6 * decoyU : 0.35;
              return (
                <g key={i} opacity={op} transform={`translate(0, ${(1 - u) * 24})`}>
                  <text x={cardC(i)} y={RACK.y - 8} textAnchor="middle" fontSize={12} fontFamily={MONO} fill={colors.MUTED}>
                    {`slot ${i}`}
                  </text>
                  <rect x={cardX(i)} y={RACK.y} width={RACK.w} height={RACK_BOT - RACK.y} rx={7} fill={colors.PANEL} stroke={stroke} strokeWidth={isActive || isDecoy ? 2 : 1} strokeDasharray={isDecoy ? '6 4' : undefined} />
                  {ROWS.map((name, r) => {
                    const val = slot[name];
                    const hl = Math.floor(rowGlow) === r;
                    return (
                      <g key={name}>
                        {r > 0 && <line x1={cardX(i) + 6} y1={rowY(r)} x2={cardX(i) + RACK.w - 6} y2={rowY(r)} stroke={colors.GRID} />}
                        {hl && <rect x={cardX(i) + 3} y={rowY(r) + 2} width={RACK.w - 6} height={RACK.cell - 4} rx={3} fill={colors.WARM} opacity={0.18} />}
                        <text
                          x={cardC(i)}
                          y={rowY(r) + 17}
                          textAnchor="middle"
                          fontSize={14}
                          fontFamily={MONO}
                          fontWeight={r <= 1 ? 700 : 400}
                          fill={r === 0 ? (val ? colors.POSITIVE : colors.MUTED) : colors.TEXT}
                          opacity={contentOp}
                        >
                          {neg(val)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {decoyU > 0.005 && (
              <text x={cardX(DECOY_SLOT) - 6} y={RACK.y - 30} fontSize={13} fill={colors.NEGATIVE} opacity={decoyU * rackOp * (spot === DECOY_SLOT ? spotU : 0)}>
                inactive, misleading geometry (schematic)
              </text>
            )}
          </g>
        )}

        {/* ================= bit gauges ================= */}
        {gaugeU > 0.005 &&
          bits.map((b, i) => {
            const u = staggerU(gaugeU, i, CAPACITY, 0.08, 0.4);
            if (u <= 0.005) return null;
            const isDecoy = i === DECOY_SLOT && decoyTent > 0.005;
            const color = isDecoy && gateU < 0.999 ? colors.NEGATIVE : colors.WARM;
            return <Gauge key={i} cx={cardC(i)} cy={GAUGE_Y} v={b * u} color={color} opacity={cardOp(i)} />;
          })}
        {gateU > 0.005 && spot === DECOY_SLOT && (
          <g opacity={clamp01(gateU * 2) * spotU * rackOp}>
            <text x={cardC(DECOY_SLOT) + GAUGE_R + 8} y={GAUGE_Y + 5} fontSize={14} fontFamily={MONO} fill={colors.NEGATIVE}>
              × active 0
            </text>
          </g>
        )}

        {/* ================= count and found ================= */}
        {countPk > 0.005 && countPk < 0.999 &&
          bits.map((b, i) => {
            const u = staggerU(countPk, i, CAPACITY, 0.05, 0.5);
            if (u <= 0.005 || u >= 0.999) return null;
            const p = quad(cardC(i), GAUGE_Y + GAUGE_R, COUNT_C.x, COUNT_C.y - 10, -20, u);
            return <circle key={i} cx={p.x} cy={p.y} r={5} fill={colors.WARM} opacity={0.25 + 0.75 * b} />;
          })}
        <g opacity={readOp}>
          <MathLabel tex={`\\mathrm{count} = \\textstyle\\sum \\mathrm{bit} = ${fmt(count)}`} x={COUNT_C.x} y={COUNT_C.y + 14} fontSize={20} boxWidth={420} opacity={v(scene.countTex)} />
          <MathLabel tex={`\\mathrm{found} = \\mathrm{count} - \\mathrm{ReLU}(\\mathrm{count} - 1) = ${fmt(found)}`} x={COUNT_C.x} y={COUNT_C.y + 48} fontSize={18} boxWidth={460} color={colors.POSITIVE} opacity={v(scene.foundTex)} />
        </g>

        {/* ================= read(left) ================= */}
        {prodU > 0.005 &&
          [0, 3, 7, DECOY_SLOT].map((i, k) => {
            const u = staggerU(prodU, k, 4, 0.2, 0.4);
            const b = bits[i];
            const lit = b > 0.5;
            return (
              <text key={i} x={cardC(i)} y={PROD_Y} textAnchor="middle" fontSize={14} fontFamily={MONO} fill={lit ? colors.WARM : colors.MUTED} opacity={u * readOp * (oneHotU > 0 ? 1 - oneHotU : 1)}>
                {`${neg(shown(i).left)}×${fmt(b)}`}
              </text>
            );
          })}
        {readPk > 0.005 && readPk < 0.999 &&
          [0, 3, 7, DECOY_SLOT].map((i, k) => {
            const u = staggerU(readPk, k, 4, 0.12, 0.6);
            if (u <= 0.005 || u >= 0.999) return null;
            const p = quad(cardC(i), PROD_Y + 6, READ_C.x, READ_C.y - 10, -10, u);
            return <circle key={i} cx={p.x} cy={p.y} r={5} fill={colors.WARM} opacity={bits[i] > 0.5 ? 1 : 0.25} />;
          })}
        <g opacity={readOp}>
          <MathLabel tex={`\\mathrm{read}(\\mathrm{left}) = \\textstyle\\sum \\mathrm{bit}\\cdot\\mathrm{left} = ${fmt(read)}`} x={READ_C.x} y={READ_C.y + 14} fontSize={20} boxWidth={460} color={colors.WARM} opacity={v(scene.readTex)} />
          {v(scene.absentU) > 0.005 && (
            <text x={READ_C.x} y={READ_C.y + 54} textAnchor="middle" fontSize={17} fontFamily={MONO} fill={colors.TEXT} opacity={v(scene.absentU)}>
              {`id ${selShown}: {found: ${fmt(found)}, value: ${fmt(value)}}`}
            </text>
          )}
        </g>

        {/* ================= uniqueness: the rejected duplicate, and one-hot ================= */}
        {v(scene.dupOp) > 0.005 && (
          <g opacity={v(scene.dupOp)}>
            <line x1={cardX(DUP_SLOT) - 20} y1={DUP_STOP + 54} x2={cardX(DUP_SLOT) + RACK.w + 20} y2={DUP_STOP + 54} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
            <text x={cardX(DUP_SLOT) + RACK.w + 30} y={DUP_STOP + 59} fontSize={14} fontFamily={MONO} fill={colors.NEGATIVE}>
              {"encode: 'active IDs must be unique'"}
            </text>
            <g transform={`translate(0, ${dupY - DUP_STOP})`}>
              <rect x={cardX(DUP_SLOT)} y={DUP_STOP} width={RACK.w} height={48} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={cardC(DUP_SLOT)} y={DUP_STOP + 19} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.POSITIVE}>
                1
              </text>
              <text x={cardC(DUP_SLOT)} y={DUP_STOP + 39} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={colors.TEXT}>
                {ROW30.id}
              </text>
              <text x={cardX(DUP_SLOT) - 8} y={DUP_STOP + 29} textAnchor="end" fontSize={13} fill={colors.NEGATIVE}>
                {`second active id ${ROW30.id}`}
              </text>
            </g>
            {dupHit > 0.005 && (
              <g opacity={dupHit} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round">
                <line x1={cardC(DUP_SLOT) - 9} y1={DUP_STOP + 45} x2={cardC(DUP_SLOT) + 9} y2={DUP_STOP + 63} />
                <line x1={cardC(DUP_SLOT) + 9} y1={DUP_STOP + 45} x2={cardC(DUP_SLOT) - 9} y2={DUP_STOP + 63} />
              </g>
            )}
          </g>
        )}
        {oneHotU > 0.005 && (
          <g opacity={oneHotU * rackOp}>
            <path
              d={`M ${cardX(0)} ${GAUGE_Y + GAUGE_R + 6} V ${GAUGE_Y + GAUGE_R + 14} H ${cardX(11) + RACK.w} V ${GAUGE_Y + GAUGE_R + 6}`}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2}
            />
            <text x={(cardX(0) + cardX(11) + RACK.w) / 2} y={GAUGE_Y + 44} textAnchor="middle" fontSize={16} fontFamily={MONO} fill={colors.WARM}>
              circuit.assumeOneHot(bits, true)
            </text>
            <text x={(cardX(0) + cardX(11) + RACK.w) / 2} y={GAUGE_Y + 66} textAnchor="middle" fontSize={14} fill={colors.TEXT}>
              {`at most one bit is 1 · all zeros allowed · sum now ${fmt(count)}`}
            </text>
          </g>
        )}
      </Camera>

      {/* ================= payoff: the machinery every candidate uses ================= */}
      {finalU > 0.005 && (
        <g opacity={finalU}>
          <rect x={120} y={120} width={1040} height={400} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={170} textAnchor="middle" fontSize={24} fill={colors.TEXT}>
            every candidate program
          </text>
          {FINAL_CHIPS.map((c, k) => {
            const u = staggerU(chipsU, k, 3, 0.35, 0.3);
            if (u <= 0.005) return null;
            const cx = 300 + k * 340;
            const w = 270;
            return (
              <g key={c.title} opacity={u} transform={`translate(0, ${(1 - u) * 14})`}>
                <rect x={cx - w / 2} y={200} width={w} height={230} rx={12} fill={colors.BG} stroke={c.color} strokeWidth={2} />
                <text x={cx} y={234} textAnchor="middle" fontSize={20} fontWeight={700} fill={c.color}>
                  {c.title}
                </text>
                {c.lines.map((l, j) => (
                  <text key={l} x={cx} y={266 + j * 25} textAnchor="middle" fontSize={15} fontFamily={MONO} fill={colors.TEXT}>
                    {l}
                  </text>
                ))}
                <text x={cx} y={414} textAnchor="middle" fontSize={13} fill={colors.MUTED}>
                  {c.foot}
                </text>
                {k > 0 && (
                  <path d={`M ${cx - w / 2 - 54} 315 h 40 m -9 -7 l 9 7 l -9 7`} fill="none" stroke={colors.MUTED} strokeWidth={2} />
                )}
              </g>
            );
          })}
          <text x={640} y={482} textAnchor="middle" fontSize={16} fill={colors.MUTED} opacity={clamp01(chipsU * 3 - 2)}>
            the search chooses which tests, which field, and which steps
          </text>
        </g>
      )}

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={'1 · The Lookup Circuit'.length * CH13 + 28} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · The Lookup Circuit
      </text>
    </>
  );
}

export const vizScene = () => scene;
