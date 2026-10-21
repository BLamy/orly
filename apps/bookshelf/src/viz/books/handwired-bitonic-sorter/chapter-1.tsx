// Two Wires and a Fold
//
// Bitonic Sorter (the Handwired labs) — chapter 1. Sources:
//   wiki = Wikipedia "Bitonic sorter" rev 1373262602 (.orly-work/hw-books/inputs/bitonic/wikipedia-bitonic-sorter.wikitext)
//     :14 (Batcher, 1968), :16 (bitonic: non-decreasing then non-increasing), :20 (length a power of two),
//     :26 (the comparator; n = 2 is simply a comparator), :33-36 (the merge recursion), :41-42 (half-cleaner pairs),
//     :45-46 (every element of one half above every element of the other)
//   report = .orly-work/hw-books/bitonic-ref/report.txt
//     §1 (n = 8: 24 comparators), §2 (stage list n = 8; the merge is stages 3-5 at distance 4, 2, 1),
//     §4 (worked half-cleaner on [1, 2, 6, 7, 8, 5, 3, 0]), §4b (2,083 inputs, 415 rotated high halves, 0 failures),
//     §6b (merge output [0, 1, 2, 3, 5, 6, 7, 8])
//   chenglou/handwired@4ea7fcb lab/ui-exploration/guide/sections/loops.md:185 (a fixed list of compare-exchange steps)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every comparator, bar and swap on screen comes from the local port of bitonic-ref/bitonic.ts
// below, run at module scope; the §4b counter is recomputed here by enumerating all 4^8 sequences.
//
// The visual machine: eight wires. They begin lying flat (the two-wire comparator, then Batcher's 24-comparator
// network as a ghost), stand up into eight columns holding the mountain, and the half-cleaner's arcs fold it:
// distance 4 splits it into a low and a high half, distance 2 and 1 finish the merge.
import type { ReactNode } from 'react';
import { curveCatmullRom, line } from 'd3';
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const bump = (u: number): number => Math.sin(Math.PI * clamp01(u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const commas = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const list = (a: number[]): string => `[${a.join(', ')}]`;

const BAR = '#cbd5e1';
const COOL = '#38bdf8';
const PAIR_HUES = [colors.SECONDARY, colors.TEAL, colors.POSITIVE, colors.NEGATIVE];

// ---------------------------------------------------------------------------
// Batcher's network: a local port of bitonic-ref/bitonic.ts (exclusive loop bound)
// ---------------------------------------------------------------------------

type Comparator = [i: number, j: number, ascending: boolean];

function bitonicNetwork(n: number): Comparator[][] {
  const stages: Comparator[][] = [];
  const place = (stage: number, c: Comparator) => {
    (stages[stage] ??= []).push(c);
  };
  const emitMerge = (low: number, count: number, up: boolean, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    for (let i = low; i < low + k; i++) place(start, [i, i + k, up]);
    emitMerge(low, k, up, start + 1);
    return 1 + emitMerge(low + k, k, up, start + 1);
  };
  const emitSort = (low: number, count: number, up: boolean, start: number): number => {
    if (count <= 1) return 0;
    const k = count / 2;
    const half = emitSort(low, k, true, start);
    emitSort(low + k, k, false, start);
    return half + emitMerge(low, count, up, start + half);
  };
  emitSort(0, n, true, 0);
  return stages;
}

function applyStage(a: number[], stage: Comparator[]): number[] {
  const out = a.slice();
  for (const [i, j, up] of stage) {
    if (up ? out[i] > out[j] : out[i] < out[j]) [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const N = 8;
const NET = bitonicNetwork(N); // report §2: six stages
const COMPARATORS = NET.reduce((s, st) => s + st.length, 0); // 24 (report §1)
const MERGE = NET.slice(3); // the final merge: distance 4, 2, 1, all ascending (report §2 stages 3-5)
const DIST = MERGE.map((st) => st[0][1] - st[0][0]);
if (COMPARATORS !== 24 || DIST.join() !== '4,2,1' || MERGE.some((st) => st.some((c) => !c[2]))) {
  throw new Error('network does not match report §1-2');
}

/** report §4: the worked mountain, and the array after each merge stage */
const MOUNTAIN = [1, 2, 6, 7, 8, 5, 3, 0];
const TRACE = MERGE.reduce<number[][]>((acc, st) => [...acc, applyStage(acc[acc.length - 1], st)], [MOUNTAIN]);
if (list(TRACE[1]) !== '[1, 2, 3, 0, 8, 5, 6, 7]' || list(TRACE[3]) !== '[0, 1, 2, 3, 5, 6, 7, 8]') {
  throw new Error('half-cleaner trace does not match report §4 / §6b');
}
/** slot of each value after k merge stages (the eight values are distinct, so a bar is its value) */
const SLOT = TRACE.map((arr) => MOUNTAIN.map((v) => arr.indexOf(v)));
const LOW = TRACE[1].slice(0, 4);
const HIGH = TRACE[1].slice(4);

const isStraight = (a: number[]): boolean => {
  let i = 0;
  while (i + 1 < a.length && a[i] <= a[i + 1]) i++;
  while (i + 1 < a.length && a[i] >= a[i + 1]) i++;
  return i === a.length - 1;
};
const isRotated = (a: number[]): boolean => a.some((_, r) => isStraight([...a.slice(r), ...a.slice(0, r)]));
const HIGH_STRAIGHT = isStraight(HIGH); // false
const HIGH_ROTATED = isRotated(HIGH); // true

/** report §4b: every article-bitonic 8-sequence over 0..3 through the half-cleaner */
const SWEEP = (() => {
  let inputs = 0, rotated = 0, failures = 0;
  for (let code = 0; code < 4 ** N; code++) {
    const a = Array.from({ length: N }, (_, i) => Math.floor(code / 4 ** i) % 4);
    if (!isStraight(a)) continue;
    inputs++;
    const out = applyStage(a, MERGE[0]);
    const lo = out.slice(0, 4), hi = out.slice(4);
    if (!isStraight(hi) && isRotated(hi)) rotated++;
    if (Math.max(...lo) > Math.min(...hi) || !isRotated(lo) || !isRotated(hi)) failures++;
  }
  return { inputs, rotated, failures };
})();

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; caption band y ≥ 630 stays empty)
// ---------------------------------------------------------------------------

// lying flat: wire i is a horizontal line, bars lie along it from HX0
const HX0 = 140;
const HY = (i: number) => 165 + 52 * i;
const H_UNIT = 26;
const H_END = 1000;
// the ghost network's rods: stage columns, overlapping rods take separate sub-columns
const NET_X0 = 440;
const SUB = 22;
const GAP = 46;
const levelsOf = (stage: Comparator[]): number[] => {
  const lv: number[] = [];
  stage.forEach(([i, j], k) => {
    let l = 0;
    while (stage.some(([a, b], m) => m < k && lv[m] === l && a <= j && i <= b)) l++;
    lv.push(l);
  });
  return lv;
};
const RODS = (() => {
  const rods: Array<{ i: number; j: number; x: number }> = [];
  let x = NET_X0;
  for (const stage of NET) {
    const lv = levelsOf(stage);
    stage.forEach(([i, j], k) => rods.push({ i, j, x: x + GAP / 2 + lv[k] * SUB }));
    x += GAP + (Math.max(...lv) + 1) * SUB;
  }
  return rods;
})();
const ROD0 = RODS[0]; // stage 0, wires 0 and 1: the chapter's first comparator

// standing up: wire i is a column at VX(i), bars rise from VB
const VC = 570;
const PITCH = 84;
const VB = 500;
const V_UNIT = 30;
const V_TH = 44;
const V_TOP = VB - 252;
const SPL1 = 24;
const SPL2 = 10;
const vx = (i: number, s1: number, s2: number) =>
  VC + (i - 3.5) * PITCH + (i < 4 ? -1 : 1) * s1 * SPL1 + ((i >> 1) & 1 ? 1 : -1) * s2 * SPL2;
const VAL_Y = 524;
const IDX_Y = 547;
const HALF_Y = 576;
const MERGE_LV = MERGE.map(levelsOf);

// the rotated-mountain inset above the high half
const IB = 226;
const I_UNIT = 11;

// right-hand panel
const PX = 990;
const MY = (i: number) => 212 + 28 * i;
const MINI_X = [1022, 1118, 1205];
const MINI_LBL = [1043, 1125, 1205];

const CAM_PAIR: CameraState = { x: 320, y: 200, k: 2.1 };
const HOME: CameraState = CAMERA_HOME;
const CAM_ARCS: CameraState = { x: 570, y: 340, k: 1.2 };
const CAM_RIGHT: CameraState = { x: 700, y: 352, k: 1.15 };
const CAM_MACH: CameraState = { x: 570, y: 360, k: 1.15 };
const CAM_END: CameraState = { x: 570, y: 372, k: 1.06 };

/** per-item progress from one group channel: item i starts `each` seconds after item i-1 */
const staggerU = (u: number, i: number, n: number, each: number, dur: number): number => {
  const total = dur + each * (n - 1);
  return clamp01((u * total - i * each) / dur);
};

/** speaking time at ~150 words per minute, plus a breath */
const speak = (text: string): number => Math.round((text.split(/\s+/).length / 2.5 + 0.6) * 10) / 10;
const HOLD = 0.8;

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAIR, cameraInterp);
  const ch = (key: string, init = 0) => tl.channel(key, init);
  const tw = (c: ChannelRef<number>, to: number, at: number, dur: number, e = ease.enter) => tl.tween(c, to, { at, dur, ease: e });

  // B0–B2 lying flat
  const ifU = ch('decisionChip');
  const strikeU = ch('decisionStrike');
  const w01U = ch('wires01');
  const rodU = ch('rod0');
  const fixedU = ch('fixedTag');
  const compLbl = ch('comparatorLabel');
  const pairA = ch('pairA');
  const outLbl = ch('minMaxLabels');
  const flashA = ch('flashA');
  const tagA = ch('inOrderTag');
  const pairB = ch('pairB');
  const flashB = ch('flashB');
  const swapU = ch('swap');
  const tagB = ch('swapTag');
  const wiresU = ch('wires2to7');
  const rodsU = ch('ghostRods');
  const rodsOp = ch('ghostRodsOp', 1);
  const plaqueU = ch('plaque');
  const sameU = ch('sameTag');
  // B3 stand up, the mountain
  const rotU = ch('standUp');
  const growU = ch('barsGrow');
  const readU = ch('readAlong', -1);
  const outlineU = ch('mountainOutline');
  const mtnLbl = ch('mountainLabel');
  const peakU = ch('peak');
  // B4–B6 the half-cleaner
  const arcsU = MERGE.map((_, k) => ch(`arcs${DIST[k]}`));
  const arcsOp = MERGE.map((_, k) => ch(`arcs${DIST[k]}Op`, 1));
  const fireU = MERGE.map((_, k) => ch(`fire${DIST[k]}`));
  const stageTag = MERGE.map((_, k) => ch(`tag${DIST[k]}`));
  const pulseT = ch('pulse');
  const split1 = ch('splitHalves');
  const split2 = ch('splitQuarters');
  const tintU = ch('tint');
  const tableU = ch('table');
  const tableOp = ch('tableOp', 1);
  const lowLbl = ch('lowLabel');
  const highLbl = ch('highLabel');
  const divU = ch('divider');
  const divOp = ch('dividerOp', 1);
  const ceilU = ch('ceiling');
  const floorU = ch('floor');
  const bandU = ch('gapBand');
  const borderOp = ch('borderOp', 1);
  const ineqU = ch('inequality');
  const crossU = ch('noCrossTag');
  // B7–B8 the rotated mountain
  const lowDim = ch('lowDim', 1);
  const valleyU = ch('valley');
  const valleyLbl = ch('valleyLabel');
  const valleyOp = ch('valleyOp', 1);
  const liftU = ch('ghostLift');
  const ringU = ch('ring');
  const climbU = ch('climb');
  const climbLbl = ch('climbLabel');
  const insetOp = ch('insetOp', 1);
  const statusU = ch('status');
  const wikiU = ch('wikiTag');
  const needU = ch('needTag');
  const countU = ch('count');
  const rotCountU = ch('rotatedCount');
  const failU = ch('failures');
  const panelOp = ch('panelOp', 1);
  // B9–B11 the merge, as wiring
  const finalLbl = ch('finalArray');
  const miniWires = ch('miniWires');
  const miniCol = MERGE.map((_, k) => ch(`mini${DIST[k]}`));
  const pairBracket = ch('twoWireBracket');
  const miniOp = ch('miniOp', 1);
  const endU = ch('endLabel');
  const quietU = ch('quiet');

  let t = 0.4;
  const beat = (text: string): number => {
    const t0 = t;
    const d = speak(text);
    tl.caption({ at: t0, dur: d, text });
    tl.hold(t0 + d, HOLD);
    t = t0 + d + HOLD;
    return t0;
  };

  // — B0 · a sorting network never decides —
  let a = beat('Most sorting looks at the data and decides what to do next. A sorting network never decides. It is a fixed list of compare-and-swap steps, wired the same way for every input.');
  tw(ifU, 1, a + 0.6, 0.7);
  tw(strikeU, 1, a + 4.4, 0.6, ease.draw);
  tw(w01U, 1, a + 5.6, 1.3, ease.draw);
  tw(rodU, 1, a + 6.8, 0.8, ease.draw);
  tw(fixedU, 1, a + 10.2, 0.7);

  // — B1 · the comparator —
  a = beat('The one part is the comparator. Two numbers go in. The smaller comes out on the top wire, the larger on the bottom. Already in order, nothing happens. Out of order, they trade places.');
  tw(fixedU, 0, a, 0.5, ease.move);
  tw(ifU, 0, a, 0.5, ease.move);
  tw(compLbl, 1, a + 0.4, 0.6);
  tw(pairA, 1, a + 2.4, 0.7);
  tw(outLbl, 1, a + 4.2, 0.6);
  tw(flashA, 1, a + 7.6, 0.8, ease.linear);
  tw(tagA, 1, a + 7.9, 0.6);
  tw(pairA, 0, a + 9.7, 0.5, ease.move);
  tw(tagA, 0, a + 9.7, 0.5, ease.move);
  tw(pairB, 1, a + 10.0, 0.6);
  tw(flashB, 1, a + 10.8, 1.2, ease.linear);
  tw(swapU, 1, a + 10.9, 1.1, ease.move);
  tw(tagB, 1, a + 11.6, 0.6);

  // — B2 · Batcher's network: 24 comparators —
  a = beat('In nineteen sixty-eight, Ken Batcher showed how to wire comparators into a bitonic sorter. For eight numbers it takes twenty-four comparators, and the same twenty-four sort any list of eight.');
  tl.tween(cam, HOME, { at: a, dur: 1.5, ease: ease.move });
  for (const c of [pairB, tagB, outLbl, compLbl]) tw(c, 0, a, 0.6, ease.move);
  tw(wiresU, 1, a + 0.5, 1.2, ease.draw);
  tw(plaqueU, 1, a + 1.4, 0.7);
  tw(rodsU, 1, a + 5.2, 2.6, ease.linear);
  tw(sameU, 1, a + 9.6, 0.7);

  // — B3 · stand the wires up: the mountain —
  a = beat('It rests on one shape: a sequence that climbs and then falls, which the name bitonic describes. Picture a mountain: one, two, six, seven, eight, five, three, zero.');
  for (const c of [rodsOp, plaqueU, sameU, rodU]) tw(c, 0, a, 0.7, ease.move);
  tw(rotU, 1, a + 0.5, 1.5, ease.move);
  tw(outlineU, 1, a + 2.4, 1.4, ease.draw);
  tw(growU, 1, a + 2.2, 1.6, ease.enter);
  tw(mtnLbl, 1, a + 4.0, 0.6);
  tw(peakU, 1, a + 5.0, 0.5, ease.pop);
  tw(readU, 8, a + 7.6, 4.0, ease.linear);

  // — B4 · the half-cleaner pairs wire i with wire i + 4 —
  a = beat('Here is the half-cleaner. Pair each wire in the first half with its partner in the second half: wire zero with wire four, one with five, two with six, three with seven.');
  tl.tween(cam, CAM_ARCS, { at: a, dur: 1.4, ease: ease.move });
  tw(mtnLbl, 0, a, 0.6, ease.move);
  tw(peakU, 0, a, 0.6, ease.move);
  tw(outlineU, 0, a + 0.3, 0.8, ease.move);
  tw(stageTag[0], 1, a + 0.8, 0.6);
  tw(arcsU[0], 1, a + 6.6, 5.0, ease.linear);
  tw(pulseT, 6, a + 6.6, 7.0, ease.linear);

  // — B5 · four comparators fire at once —
  a = beat("Four comparators fire at once. Each pair's smaller number drops into the left half, the larger into the right. The left half is now one, two, three, zero. The right is eight, five, six, seven.");
  tl.tween(cam, HOME, { at: a, dur: 1.3, ease: ease.move });
  tw(fireU[0], 1, a + 0.9, 1.2, ease.move);
  tw(tableU, 1, a + 2.4, 2.4, ease.linear);
  tw(tintU, 1, a + 3.4, 0.8);
  tw(split1, 1, a + 3.6, 1.0, ease.move);
  tw(arcsOp[0], 0.12, a + 4.4, 0.8, ease.move);
  tw(stageTag[0], 0, a + 4.4, 0.6, ease.move);
  tw(lowLbl, 1, a + 7.6, 0.6);
  tw(highLbl, 1, a + 10.2, 0.6);

  // — B6 · the border: at most three, at least five —
  a = beat('Check the border. Everything on the left is at most three, and everything on the right is at least five. Nothing needs to cross, so the two halves can be sorted separately.');
  tw(tableOp, 0, a, 0.6, ease.move);
  tw(arcsOp[0], 0, a, 0.6, ease.move);
  tw(divU, 1, a + 0.4, 1.0, ease.draw);
  tw(ceilU, 1, a + 2.4, 0.9, ease.draw);
  tw(floorU, 1, a + 4.6, 0.9, ease.draw);
  tw(bandU, 1, a + 5.8, 0.6);
  tw(ineqU, 1, a + 6.2, 0.6);
  tw(crossU, 1, a + 8.6, 0.6);

  // — B7 · a rotated mountain —
  a = beat('Each half is still a mountain, in a wider sense. The right half, eight, five, six, seven, dips like a valley, but start reading at the five and it climbs. A rotated mountain counts.');
  tl.tween(cam, CAM_RIGHT, { at: a, dur: 1.4, ease: ease.move });
  for (const c of [borderOp, ineqU, crossU]) tw(c, 0, a, 0.6, ease.move);
  tw(lowDim, 0.12, a + 0.4, 0.8, ease.move);
  tw(valleyU, 1, a + 3.4, 1.4, ease.draw);
  tw(valleyLbl, 1, a + 4.4, 0.6);
  tw(valleyLbl, 0, a + 7.0, 0.5, ease.move);
  tw(liftU, 1, a + 7.0, 1.0, ease.move);
  tw(valleyOp, 0, a + 7.0, 0.8, ease.move);
  tw(ringU, 1, a + 8.2, 1.4, ease.move);
  tw(climbU, 1, a + 9.6, 1.0, ease.draw);
  tw(climbLbl, 1, a + 9.8, 0.6);
  tw(statusU, 1, a + 11.2, 0.6);

  // — B8 · the definition gap, and the sweep that checks it —
  a = beat("Wikipedia's definition allows only straight mountains, but the argument needs rotated ones too. Across all two thousand eighty-three eight-long mountains with values zero to three, the split never failed.");
  tl.tween(cam, HOME, { at: a, dur: 1.3, ease: ease.move });
  tw(wikiU, 1, a + 0.6, 0.6);
  tw(needU, 1, a + 3.2, 0.6);
  tw(countU, 1, a + 5.6, 2.6, ease.move);
  tw(rotCountU, 1, a + 8.4, 0.6);
  tw(failU, 1, a + 11.4, 0.6, ease.pop);

  // — B9 · split again: distance 2, then 1 —
  a = beat('So split again. Half-clean each half into quarters, then each quarter into pairs. Run on this input, the pieces come out as zero, one, two, three, five, six, seven, eight.');
  tl.tween(cam, CAM_MACH, { at: a, dur: 1.4, ease: ease.move });
  for (const c of [panelOp, insetOp, valleyU, divOp]) tw(c, 0, a, 0.6, ease.move);
  tw(lowDim, 1, a + 0.2, 0.6, ease.move);
  tw(stageTag[1], 1, a + 0.6, 0.5);
  tw(arcsU[1], 1, a + 0.8, 0.9, ease.draw);
  tw(fireU[1], 1, a + 2.2, 1.0, ease.move);
  tw(split2, 1, a + 2.6, 0.9, ease.move);
  tw(arcsOp[1], 0, a + 3.5, 0.5, ease.move);
  tw(stageTag[1], 0, a + 3.5, 0.4, ease.move);
  tw(stageTag[2], 1, a + 3.9, 0.5);
  tw(arcsU[2], 1, a + 4.0, 0.8, ease.draw);
  tw(fireU[2], 1, a + 5.0, 1.0, ease.move);
  tw(arcsOp[2], 0, a + 6.3, 0.5, ease.move);
  tw(stageTag[2], 0, a + 6.3, 0.4, ease.move);
  tw(finalLbl, 1, a + 7.6, 0.7);

  // — B10 · three rounds: distance 4, 2, 1 —
  a = beat('Three rounds of this do it for eight numbers: pairs at distance four, then two, then one. Two wires is the smallest case, and a bitonic sorter of that size is simply a comparator.');
  tl.tween(cam, HOME, { at: a, dur: 1.4, ease: ease.move });
  tw(finalLbl, 0, a, 0.6, ease.move);
  tw(miniWires, 1, a + 0.5, 1.0, ease.draw);
  tw(miniCol[0], 1, a + 3.4, 0.7);
  tw(miniCol[1], 1, a + 4.6, 0.7);
  tw(miniCol[2], 1, a + 5.6, 0.7);
  tw(pairBracket, 1, a + 9.0, 0.7);

  // — B11 · the merging machine —
  a = beat('That is the merging machine. Hand it any mountain whose length is a power of two, and it hands back a sorted line. What it cannot do yet is make mountains. That comes next.');
  tl.tween(cam, CAM_END, { at: a, dur: 1.6, ease: ease.move });
  tw(miniOp, 0, a, 0.8, ease.move);
  tw(quietU, 1, a + 0.2, 1.0, ease.move);
  tw(endU, 1, a + 1.4, 0.8);
  tl.hold(t, 1.7);

  return {
    tl, cam, ifU, strikeU, w01U, rodU, fixedU, compLbl, pairA, outLbl, flashA, tagA, pairB, flashB, swapU, tagB,
    wiresU, rodsU, rodsOp, plaqueU, sameU, rotU, growU, readU, outlineU, mtnLbl, peakU,
    arcsU, arcsOp, fireU, stageTag, pulseT, split1, split2, tintU, tableU, tableOp, lowLbl, highLbl,
    divU, divOp, ceilU, floorU, bandU, borderOp, ineqU, crossU,
    lowDim, valleyU, valleyOp, valleyLbl, liftU, ringU, climbU, climbLbl, insetOp, statusU, wikiU, needU, countU, rotCountU,
    failU, panelOp, finalLbl, miniWires, miniCol, pairBracket, miniOp, endU, quietU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const smooth = line<[number, number]>().curve(curveCatmullRom.alpha(0.5));

function Txt({ x, y, children, size = 14, fill = colors.TEXT, anchor = 'middle', mono = false, weight, opacity = 1 }: {
  x: number; y: number; children: ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontFamily={mono ? MONO : undefined} fontWeight={weight} opacity={opacity}>
      {children}
    </text>
  );
}

/** a horizontal bar lying on wire w (the flat two-wire demo) */
function FlatBar({ v, y, dx = 0, opacity, labelOp = 1 }: { v: number; y: number; dx?: number; opacity: number; labelOp?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={HX0 + dx} y={y - 10} width={v * H_UNIT} height={20} rx={3} fill={BAR} fillOpacity={0.85} />
      <Txt x={HX0 + dx + v * H_UNIT + 10} y={y + 5} anchor="start" mono weight={700} opacity={labelOp}>
        {v}
      </Txt>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const v = (c: ChannelRef<number>): number => s.get(c);
  const cam = s.get(scene.cam);

  const rot = v(scene.rotU);
  const s1 = v(scene.split1);
  const s2 = v(scene.split2);
  const X = (i: number) => vx(i, s1, s2);
  const quiet = v(scene.quietU);
  const fade = (op: number) => op * lerp(1, 0.12, quiet);

  // ---- bars: which merge stage is moving, and where each value stands
  const fire = scene.fireU.map((c) => v(c));
  let k = -1;
  for (let m = 0; m < fire.length; m++) if (fire[m] > 0) k = m;
  const barX = (val: number): { x: number; u: number; moving: boolean } => {
    const vi = MOUNTAIN.indexOf(val);
    if (k < 0) return { x: X(SLOT[0][vi]), u: 0, moving: false };
    const from = SLOT[k][vi], to = SLOT[k + 1][vi];
    return { x: lerp(X(from), X(to), fire[k]), u: fire[k], moving: from !== to };
  };
  const done = fire.filter((f) => f >= 1).length;
  const arrNow = TRACE[done];
  const grow = v(scene.growU);
  const tint = v(scene.tintU);
  const lowDim = v(scene.lowDim);
  const readAt = v(scene.readU);
  const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * v(scene.pulseT));

  // ---- the flat demo
  const swap = v(scene.swapU);
  const flashA = bump(v(scene.flashA));
  const flashB = bump(v(scene.flashB));
  const rodGlow = Math.max(flashA, flashB);

  // ---- panel
  const panelOp = v(scene.panelOp);
  const count = v(scene.countU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= B0 · the decision a network never makes ================= */}
        {v(scene.ifU) > 0.005 && (
          <g opacity={v(scene.ifU)}>
            <rect x={205} y={92} width={230} height={28} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <Txt x={320} y={111} size={13} mono fill={colors.MUTED}>
              {'if (a > b) { … } else { … }'}
            </Txt>
            <line x1={214} y1={106} x2={lerp(214, 426, v(scene.strikeU))} y2={106} stroke={colors.NEGATIVE} strokeWidth={2} strokeLinecap="round" opacity={v(scene.strikeU) > 0 ? 1 : 0} />
            <Txt x={320} y={140} size={12} fill={colors.NEGATIVE} opacity={v(scene.strikeU)}>
              never decides
            </Txt>
          </g>
        )}

        {/* ================= the eight wires: flat, then standing ================= */}
        {Array.from({ length: N }, (_, i) => {
          const op = i < 2 ? v(scene.w01U) : staggerU(v(scene.wiresU), i - 2, 6, 0.08, 0.6);
          if (op <= 0.005) return null;
          const ax = lerp(HX0, X(i), rot);
          const ay = lerp(HY(i), VB, rot);
          const th = (-Math.PI / 2) * rot;
          const dx = Math.cos(th), dy = Math.sin(th);
          const s0 = lerp(-28, 0, rot);
          const len = lerp(H_END - HX0, VB - V_TOP, rot);
          const drawn = i < 2 ? clamp01(v(scene.w01U)) : 1;
          const e = s0 + (len - s0) * drawn;
          const lit = rot > 0.99 && i < 4 ? lowDim : 1;
          return (
            <g key={i}>
              <line x1={ax + dx * s0} y1={ay + dy * s0} x2={ax + dx * e} y2={ay + dy * e} stroke={colors.MUTED} strokeWidth={lerp(2, 1.5, rot)} opacity={fade(op * lerp(0.75, 0.4, rot) * lit)} />
              <Txt x={lerp(100, X(i), rot)} y={lerp(HY(i) + 4, IDX_Y, rot)} size={12} mono fill={colors.MUTED} opacity={fade(op * lit)}>
                {rot > 0.5 ? `w${i}` : i}
              </Txt>
            </g>
          );
        })}

        {/* ================= B1 · the comparator on wires 0 and 1 ================= */}
        {v(scene.rodU) > 0.005 && (
          <g opacity={v(scene.rodU) > 0 ? 1 : 0}>
            {rodGlow > 0.01 && <line x1={ROD0.x} y1={HY(0)} x2={ROD0.x} y2={HY(1)} stroke={colors.WARM} strokeWidth={10} opacity={0.3 * rodGlow} strokeLinecap="round" />}
            <line x1={ROD0.x} y1={HY(0)} x2={ROD0.x} y2={lerp(HY(0), HY(1), v(scene.rodU))} stroke={rodGlow > 0.01 ? colors.WARM : colors.TEXT} strokeWidth={2.5} />
            <circle cx={ROD0.x} cy={HY(0)} r={4.5} fill={colors.TEXT} opacity={v(scene.rodU)} />
            <circle cx={ROD0.x} cy={HY(1)} r={4.5} fill={colors.TEXT} opacity={clamp01(v(scene.rodU) * 2 - 1)} />
          </g>
        )}
        <Txt x={ROD0.x} y={HY(0) - 34} size={13} fill={colors.WARM} opacity={v(scene.compLbl)}>
          comparator
        </Txt>
        <Txt x={ROD0.x + 22} y={HY(0) - 8} size={12} anchor="start" fill={COOL} opacity={v(scene.outLbl)}>
          min
        </Txt>
        <Txt x={ROD0.x + 22} y={HY(1) - 8} size={12} anchor="start" fill={colors.WARM} opacity={v(scene.outLbl)}>
          max
        </Txt>
        <FlatBar v={3} y={HY(0)} opacity={v(scene.pairA)} />
        <FlatBar v={7} y={HY(1)} opacity={v(scene.pairA)} />
        {/* out of order: 7 above 3, the pair crosses over */}
        <FlatBar v={3} y={lerp(HY(1), HY(0), swap)} dx={-14 * bump(swap)} opacity={v(scene.pairB)} labelOp={clamp01(1 - 2.5 * bump(swap))} />
        <FlatBar v={7} y={lerp(HY(0), HY(1), swap)} dx={14 * bump(swap)} opacity={v(scene.pairB)} labelOp={clamp01(1 - 2.5 * bump(swap))} />
        <Txt x={320} y={268} size={13} fill={colors.MUTED} opacity={v(scene.fixedU)}>
          a fixed list of compare-and-swap steps
        </Txt>
        <Txt x={320} y={268} size={13} fill={colors.POSITIVE} opacity={v(scene.tagA)}>
          already in order: nothing happens
        </Txt>
        <Txt x={320} y={268} size={13} fill={colors.WARM} opacity={v(scene.tagB)}>
          out of order: they trade places
        </Txt>

        {/* ================= B2 · the ghost of Batcher's 8-wire network ================= */}
        {v(scene.rodsOp) * v(scene.rodsU) > 0.005 && (
          <g opacity={v(scene.rodsOp)}>
            {RODS.map((r, n) => {
              if (n === 0) return null;
              const u = staggerU(v(scene.rodsU), n - 1, RODS.length - 1, 0.1, 0.3);
              if (u <= 0) return null;
              return (
                <g key={n} opacity={0.5 * u}>
                  <line x1={r.x} y1={HY(r.i)} x2={r.x} y2={HY(r.j)} stroke={colors.TEXT} strokeWidth={2} />
                  <circle cx={r.x} cy={HY(r.i)} r={3.5} fill={colors.TEXT} />
                  <circle cx={r.x} cy={HY(r.j)} r={3.5} fill={colors.TEXT} />
                </g>
              );
            })}
          </g>
        )}
        {v(scene.plaqueU) > 0.005 && (
          <g opacity={v(scene.plaqueU)}>
            <rect x={1030} y={190} width={210} height={62} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <Txt x={1135} y={218} size={17} weight={600}>
              Ken Batcher, 1968
            </Txt>
            <Txt x={1135} y={240} size={13} fill={colors.MUTED}>
              the bitonic sorter
            </Txt>
            <g opacity={clamp01(v(scene.rodsU) * 8)}>
              <Txt x={1135} y={318} size={34} mono weight={700} fill={colors.WARM}>
                {Math.max(1, Math.round(1 + v(scene.rodsU) * (COMPARATORS - 1)))}
              </Txt>
              <Txt x={1135} y={344} size={14}>
                comparators
              </Txt>
              <Txt x={1135} y={366} size={12} mono fill={colors.MUTED}>
                n = 8
              </Txt>
            </g>
            <Txt x={1135} y={410} size={13} fill={colors.MUTED} opacity={v(scene.sameU)}>
              the same 24 for any list of 8
            </Txt>
          </g>
        )}

        {/* ================= B4–B9 · comparator arcs (one hue per pair) ================= */}
        {MERGE.map((stage, si) => {
          const u = v(scene.arcsU[si]);
          const op = v(scene.arcsOp[si]);
          if (u <= 0.005 || op <= 0.005) return null;
          const f = bump(fire[si]);
          const fired = fire[si] > 0;
          return (
            <g key={si} opacity={op}>
              {stage.map(([i, j], n) => {
                const du = si === 0 ? staggerU(u, n, 4, 0.31, 0.2) : u;
                if (du <= 0) return null;
                const peak = V_TOP - 34 - MERGE_LV[si][n] * 24;
                const xi = X(i), xj = X(j);
                const hue = PAIR_HUES[n];
                const glow = fired ? f : si === 0 ? 0.35 * pulse : 0;
                return (
                  <g key={n}>
                    {glow > 0.02 && <path d={`M ${xi} ${V_TOP} Q ${(xi + xj) / 2} ${2 * peak - V_TOP} ${xj} ${V_TOP}`} fill="none" stroke={hue} strokeWidth={9} opacity={0.3 * glow} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - du} />}
                    <path d={`M ${xi} ${V_TOP} Q ${(xi + xj) / 2} ${2 * peak - V_TOP} ${xj} ${V_TOP}`} fill="none" stroke={hue} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - du} />
                    <circle cx={xi} cy={V_TOP} r={4} fill={hue} />
                    <circle cx={xj} cy={V_TOP} r={4} fill={hue} opacity={du >= 1 ? 1 : 0} />
                    {si === 0 && (
                      <>
                        <circle cx={xi} cy={IDX_Y - 4} r={13} fill="none" stroke={hue} strokeWidth={1.5} opacity={du * (1 - clamp01(fire[0] * 2))} />
                        <circle cx={xj} cy={IDX_Y - 4} r={13} fill="none" stroke={hue} strokeWidth={1.5} opacity={(du >= 1 ? 1 : 0) * (1 - clamp01(fire[0] * 2))} />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {MERGE.map((_, si) => (
          <Txt key={si} x={VC} y={112} size={15} fill={colors.TEXT} opacity={v(scene.stageTag[si])}>
            {si === 0 ? 'half-cleaner: x[i] vs x[i + 4]' : `half-clean again: distance ${DIST[si]}`}
          </Txt>
        ))}

        {/* ================= B6 · the border ================= */}
        {v(scene.divU) > 0.005 && (
          <line x1={VC} y1={V_TOP - 10} x2={VC} y2={lerp(V_TOP - 10, VB + 8, v(scene.divU))} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="5 5" opacity={fade(0.7 * v(scene.divOp))} />
        )}
        {s2 > 0.005 &&
          [(X(1) + X(2)) / 2, (X(5) + X(6)) / 2].map((x, n) => (
            <line key={n} x1={x} y1={V_TOP + 40} x2={x} y2={VB + 8} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="3 5" opacity={fade(0.5 * s2)} />
          ))}
        {v(scene.borderOp) > 0.005 && (
          <g opacity={v(scene.borderOp)}>
            {v(scene.bandU) > 0.005 && (
              <rect x={X(0) - 26} y={VB - 5 * V_UNIT} width={X(7) - X(0) + 52} height={2 * V_UNIT} fill={colors.TEXT} opacity={0.07 * v(scene.bandU)} />
            )}
            <line x1={X(0) - 26} y1={VB - 3 * V_UNIT} x2={lerp(X(0) - 26, X(3) + 26, v(scene.ceilU))} y2={VB - 3 * V_UNIT} stroke={COOL} strokeWidth={2.5} opacity={v(scene.ceilU) > 0 ? 1 : 0} />
            <Txt x={X(0) - 34} y={VB - 3 * V_UNIT + 5} size={13} anchor="end" fill={COOL} opacity={v(scene.ceilU)}>
              ceiling 3
            </Txt>
            <line x1={X(4) - 26} y1={VB - 5 * V_UNIT} x2={lerp(X(4) - 26, X(7) + 26, v(scene.floorU))} y2={VB - 5 * V_UNIT} stroke={colors.WARM} strokeWidth={2.5} opacity={v(scene.floorU) > 0 ? 1 : 0} />
            <Txt x={X(7) + 34} y={VB - 5 * V_UNIT + 5} size={13} anchor="start" fill={colors.WARM} opacity={v(scene.floorU)}>
              floor 5
            </Txt>
          </g>
        )}

        {/* ================= the bars (one per value) ================= */}
        {grow > 0.005 &&
          MOUNTAIN.map((val, n) => {
            const g = staggerU(grow, n, N, 0.12, 0.6);
            if (g <= 0) return null;
            const { x, u, moving } = barX(val);
            const h = Math.max(4, val * V_UNIT) * g;
            const dim = SLOT[1][n] < 4 ? lowDim : 1;
            const labelOp = moving ? clamp01(1 - 2.5 * bump(u)) : 1;
            const reading = Math.floor(readAt) === n && readAt < 8;
            const tinted = val <= 3 ? COOL : colors.WARM;
            // a straight swap crosses its partner mid-flight: go glassy and outlined so both stay readable
            const glass = moving ? 1 - 0.65 * bump(u) : 1;
            const edge = moving && bump(u) > 0.02 ? (val <= 3 ? COOL : colors.WARM) : 'none';
            return (
              <g key={val} opacity={dim}>
                <rect x={x - V_TH / 2} y={VB - h} width={V_TH} height={h} rx={3} fill={BAR} fillOpacity={0.85 * glass} stroke={edge} strokeWidth={2} />
                {tint > 0.005 && <rect x={x - V_TH / 2} y={VB - h} width={V_TH} height={h} rx={3} fill={tinted} fillOpacity={0.85 * tint * glass} />}
                <Txt x={x} y={VAL_Y} size={reading ? 17 : 15} mono weight={700} fill={reading ? colors.WARM : colors.TEXT} opacity={g * labelOp}>
                  {val}
                </Txt>
              </g>
            );
          })}
        {/* the mountain's outline and its peak */}
        {v(scene.outlineU) > 0.005 && (
          <path
            d={smooth(MOUNTAIN.map((val, i) => [X(i), VB - val * V_UNIT - 6] as [number, number])) ?? ''}
            fill="none"
            stroke={colors.POSITIVE}
            strokeWidth={2.5}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - clamp01(v(scene.outlineU) * 1.2)}
            opacity={Math.min(1, v(scene.outlineU) * 3)}
          />
        )}
        <Txt x={VC} y={172} size={18} fill={colors.POSITIVE} opacity={v(scene.mtnLbl)}>
          bitonic: up, then down
        </Txt>
        {v(scene.peakU) > 0.005 && (
          <g opacity={v(scene.peakU)}>
            <path d={`M ${X(4) - 7} ${VB - 8 * V_UNIT - 22} L ${X(4) + 7} ${VB - 8 * V_UNIT - 22} L ${X(4)} ${VB - 8 * V_UNIT - 12} Z`} fill={colors.WARM} />
            <Txt x={X(4)} y={VB - 8 * V_UNIT - 30} size={13} fill={colors.WARM}>
              peak
            </Txt>
          </g>
        )}

        {/* half labels: the live contents of each half */}
        <Txt x={(X(1) + X(2)) / 2} y={HALF_Y} size={14} mono fill={COOL} opacity={fade(v(scene.lowLbl) * lowDim)}>
          {`low half ${list(arrNow.slice(0, 4))}`}
        </Txt>
        <Txt x={(X(5) + X(6)) / 2} y={HALF_Y} size={14} mono fill={colors.WARM} opacity={fade(v(scene.highLbl))}>
          {`high half ${list(arrNow.slice(4))}`}
        </Txt>

        {/* ================= B7 · the valley, and its rotation ================= */}
        {v(scene.valleyU) > 0.005 && (
          <path
            d={smooth([4, 5, 6, 7].map((i) => [X(i), VB - TRACE[1][i] * V_UNIT - 6] as [number, number])) ?? ''}
            fill="none"
            stroke={colors.NEGATIVE}
            strokeWidth={2.5}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - v(scene.valleyU)}
            opacity={v(scene.valleyOp)}
          />
        )}
        <Txt x={(X(5) + X(6)) / 2} y={250} size={14} fill={colors.NEGATIVE} opacity={v(scene.valleyLbl)}>
          dips like a valley
        </Txt>
        {v(scene.liftU) * v(scene.insetOp) > 0.005 && (
          <g opacity={v(scene.insetOp)}>
            {HIGH.map((val, n) => {
              const lift = v(scene.liftU);
              const ring = v(scene.ringU);
              const s = 4 + n;
              const rs = 4 + ((n + 3) % 4);
              const x = lerp(X(s), X(rs), ring);
              const wrapY = n === 0 ? -48 * bump(ring) : 0;
              const base = lerp(VB, IB, lift) + wrapY;
              const h = Math.max(4, val * lerp(V_UNIT, I_UNIT, lift));
              const w = lerp(V_TH, 30, lift);
              return (
                <g key={val} opacity={clamp01(lift * 3)}>
                  <rect x={x - w / 2} y={base - h} width={w} height={h} rx={3} fill={colors.WARM} fillOpacity={0.25} stroke={colors.WARM} strokeWidth={1.5} />
                  <Txt x={x} y={base + 16} size={12} mono weight={700} fill={colors.WARM} opacity={clamp01(lift * 2 - 1) * clamp01(1 - 2.5 * bump(ring))}>
                    {val}
                  </Txt>
                </g>
              );
            })}
            {v(scene.ringU) > 0.005 && v(scene.ringU) < 0.999 && (
              <path d={`M ${X(4)} ${IB - 100} Q ${(X(4) + X(7)) / 2} ${IB - 150} ${X(7)} ${IB - 100}`} fill="none" stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="3 5" opacity={0.6 * bump(v(scene.ringU))} />
            )}
            {v(scene.climbU) > 0.005 && (
              <path
                d={smooth([4, 5, 6, 7].map((i, n) => [X(i), IB - [5, 6, 7, 8][n] * I_UNIT - 6] as [number, number])) ?? ''}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={2.5}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - v(scene.climbU)}
              />
            )}
            <Txt x={X(4) - 34} y={IB - 50} size={14} anchor="end" fill={colors.POSITIVE} opacity={v(scene.climbLbl)}>
              start at the 5: it climbs
            </Txt>
            <Txt x={X(4) - 34} y={IB - 28} size={13} anchor="end" mono fill={colors.POSITIVE} opacity={v(scene.climbLbl)}>
              [5, 6, 7, 8]
            </Txt>
          </g>
        )}

        {/* ================= right-hand panel ================= */}
        {/* B5 · the half-cleaner table, from the real values */}
        {v(scene.tableU) * v(scene.tableOp) > 0.005 && (
          <g opacity={v(scene.tableOp)}>
            <Txt x={PX} y={185} size={14} anchor="start" fill={colors.MUTED}>
              half-cleaner, n = 8
            </Txt>
            {[['i', 1000], ['x[i]', 1040], ['x[i+4]', 1100], ['min', 1170], ['max', 1225]].map(([h, x]) => (
              <Txt key={h} x={x as number} y={218} size={14} mono fill={h === 'min' ? COOL : h === 'max' ? colors.WARM : colors.MUTED} opacity={clamp01(v(scene.tableU) * 5)}>
                {h}
              </Txt>
            ))}
            <line x1={PX} y1={228} x2={1245} y2={228} stroke={colors.GRID} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity={staggerU(v(scene.tableU), i, 4, 0.18, 0.4)}>
                {[i, MOUNTAIN[i], MOUNTAIN[i + 4], TRACE[1][i], TRACE[1][i + 4]].map((c, n) => (
                  <Txt key={n} x={[1000, 1040, 1100, 1170, 1225][n]} y={254 + i * 30} size={15} mono weight={n >= 3 ? 700 : 400} fill={n === 3 ? COOL : n === 4 ? colors.WARM : colors.TEXT}>
                    {c}
                  </Txt>
                ))}
              </g>
            ))}
          </g>
        )}
        {/* B6 · the inequality */}
        <Txt x={1120} y={240} size={15} mono fill={colors.TEXT} opacity={v(scene.ineqU)}>
          {`max(low) = ${Math.max(...LOW)} ≤ min(high) = ${Math.min(...HIGH)}`}
        </Txt>
        <Txt x={1120} y={290} size={14} fill={colors.TEXT} opacity={v(scene.crossU)}>
          nothing needs to cross
        </Txt>
        <Txt x={1120} y={314} size={14} fill={colors.MUTED} opacity={v(scene.crossU)}>
          sort each half on its own
        </Txt>
        {/* B7–B8 · status of the high half, then the sweep */}
        {panelOp > 0.005 && (
          <g opacity={panelOp}>
            <Txt x={PX} y={190} size={14} anchor="start" mono fill={colors.WARM} opacity={v(scene.statusU)}>
              {`high half ${list(HIGH)}`}
            </Txt>
            <Txt x={PX} y={216} size={13} anchor="start" fill={colors.NEGATIVE} opacity={v(scene.statusU)}>
              {`straight mountain: ${HIGH_STRAIGHT ? 'yes' : 'no'}`}
            </Txt>
            <Txt x={PX} y={240} size={13} anchor="start" fill={colors.POSITIVE} opacity={v(scene.statusU)}>
              {`rotated mountain: ${HIGH_ROTATED ? 'yes' : 'no'}`}
            </Txt>
            <Txt x={PX} y={290} size={13} anchor="start" fill={colors.MUTED} opacity={v(scene.wikiU)}>
              Wikipedia's definition: straight only
            </Txt>
            <Txt x={PX} y={312} size={13} anchor="start" fill={colors.TEXT} opacity={v(scene.needU)}>
              the split needs rotated ones too
            </Txt>
            <g opacity={clamp01(count * 6)}>
              <Txt x={1062} y={360} size={26} anchor="end" mono weight={700}>
                {commas(SWEEP.inputs * count)}
              </Txt>
              <Txt x={1074} y={360} size={14} anchor="start">
                bitonic inputs
              </Txt>
            </g>
            <Txt x={1062} y={398} size={26} anchor="end" mono weight={700} fill={colors.WARM} opacity={v(scene.rotCountU)}>
              {commas(SWEEP.rotated)}
            </Txt>
            <Txt x={1074} y={398} size={14} anchor="start" opacity={v(scene.rotCountU)}>
              rotated high halves
            </Txt>
            <Txt x={1062} y={436} size={26} anchor="end" mono weight={700} fill={colors.POSITIVE} opacity={v(scene.failU)}>
              {commas(SWEEP.failures)}
            </Txt>
            <Txt x={1074} y={436} size={14} anchor="start" fill={colors.POSITIVE} opacity={v(scene.failU)}>
              failures
            </Txt>
            <Txt x={PX} y={470} size={12} anchor="start" mono fill={colors.MUTED} opacity={clamp01(count * 6)}>
              values 0..3, n = 8, every one checked
            </Txt>
          </g>
        )}
        <Txt x={VC} y={170} size={20} mono weight={700} fill={colors.POSITIVE} opacity={v(scene.finalLbl)}>
          {list(TRACE[3])}
        </Txt>

        {/* B10 · the merge, drawn as wiring: distance 4, 2, 1 */}
        {v(scene.miniWires) * v(scene.miniOp) > 0.005 && (
          <g opacity={v(scene.miniOp)}>
            <Txt x={PX} y={160} size={14} anchor="start" fill={colors.MUTED} opacity={v(scene.miniWires)}>
              the merge, as wiring
            </Txt>
            {Array.from({ length: N }, (_, i) => (
              <line key={i} x1={PX} y1={MY(i)} x2={lerp(PX, 1250, v(scene.miniWires))} y2={MY(i)} stroke={colors.MUTED} strokeWidth={1.2} opacity={0.6} />
            ))}
            {MERGE.map((stage, si) => {
              const u = v(scene.miniCol[si]);
              if (u <= 0.005) return null;
              return (
                <g key={si} opacity={u}>
                  <Txt x={MINI_LBL[si]} y={192} size={13} fill={colors.TEXT}>
                    {`distance ${DIST[si]}`}
                  </Txt>
                  {stage.map(([i, j], n) => {
                    const x = MINI_X[si] + MERGE_LV[si][n] * 14;
                    const hot = si === 2 && n === 0 && v(scene.pairBracket) > 0.01;
                    const col = hot ? colors.WARM : colors.TEXT;
                    return (
                      <g key={n}>
                        <line x1={x} y1={MY(i)} x2={x} y2={MY(j)} stroke={col} strokeWidth={2} />
                        <circle cx={x} cy={MY(i)} r={3.2} fill={col} />
                        <circle cx={x} cy={MY(j)} r={3.2} fill={col} />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {v(scene.pairBracket) > 0.005 && (
              <g opacity={v(scene.pairBracket)}>
                <path d={`M ${MINI_X[2] + 12} ${MY(0) - 7} h 8 V ${MY(1) + 7} h -8`} fill="none" stroke={colors.WARM} strokeWidth={1.8} />
                <Txt x={1120} y={446} size={13} fill={colors.WARM}>
                  2 wires = one comparator
                </Txt>
                <Txt x={1120} y={468} size={12} mono fill={colors.MUTED}>
                  4 comparators per round, 3 rounds
                </Txt>
              </g>
            )}
          </g>
        )}

        {/* B11 · the payoff */}
        <Txt x={VC} y={168} size={24} fill={colors.TEXT} opacity={v(scene.endU)}>
          bitonic in, sorted out
        </Txt>
        <Txt x={VC} y={196} size={14} fill={colors.MUTED} opacity={v(scene.endU)}>
          any mountain whose length is a power of two
        </Txt>
      </Camera>

      {/* ================= screen-space header ================= */}
      <rect x={40} y={18} width={214} height={24} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={52} y={35} fontSize={15} fill={colors.MUTED}>
        1 · Two Wires and a Fold
      </text>
    </>
  );
}

export const vizScene = () => scene;
