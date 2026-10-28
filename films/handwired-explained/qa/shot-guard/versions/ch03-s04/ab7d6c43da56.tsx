/**
 * ch03-s04 — CELLS AND WIRES: the template toggle's source table (plate, parchment; paperWipe in; 11.17 s).
 *   L0307 "Every number the program reads or keeps is a cell in one table. A toggle has twenty."
 *   L0308 "A wire is a position: where a number lives."
 *
 * The ch03 parchment plate (sets/ch03-s02-plate), lamp-lit from the upper left, with the same copper spool soft at the
 * lower right (L5) as ch03-s02 and ch03-s05 (one plate dressing for the family, so the crossfade into s05 holds). A small black paper toggle
 * switch (track and thumb) sits above a strip of 20 numbered ink pigeonholes (0 to 19). The cards are the toggle's 20
 * cells in the order the research lists them (CB09): the window's 1280 and 800; the pointer events (press and release,
 * each a flag with its x and y, then cancel); on and armed; the four spring-matrix cards; settleCheck and snap; the
 * thumb's displacement, velocity and destination. Values the record does not give are left as plain cards.
 *
 * TEACHES, word by word:
 *   Every (0.60)      the strip of 20 pigeonholes settles onto the plate; the toggle above it
 *   cell (3.47)       the holes fill with paper cards group by group: 1280 and 800 (window); the event flags each pop
 *                     to 1 and fall back to 0 with a tiny detent; the four-card spring rack; the state cards; each
 *                     group bracketed in ink with a small label
 *   twenty (5.51)     an ink ring traces round the strip and closes; 'source table · 20 cells' inks beneath (the same
 *                     form as ch03-s07's 234-cell label)
 *   wire (6.77)       fine copper wire tags clip onto three holes (their positions 0 · 9 · 17) and onto one operation
 *                     tag pulled in from the ribbon at the plate's edge (the first operation's result sits at position
 *                     20, right after the 20 cells: PR01, CB05); 'wire = the position of a number' inks
 *   (hold)            the press flag pops to 1 and falls back to 0 once more; the toggle's thumb twitches in sympathy
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import {
  STRIP,
  TOGGLE_CELLS,
  TOGGLE_GROUPS,
  cellX,
  clamp01,
  copperInk,
  groupBrackets,
  opTag,
  paperOf,
  paperToggle,
  pigeonStrip,
  plateBack,
  plateInk,
  plateNear,
  seg,
  sm,
  toggleCard,
  twos,
  wireClip,
} from '../sets/ch03-s02-plate';

type C2 = CanvasRenderingContext2D;
const ID = 'ch03-s04';
/** the strip is drawn 1.06x about its centre (with the push, ~88 % of the frame width), and the camera pushes 5 % from 'cell' */
const SC = 1.06;
const SCX = STRIP.x + (STRIP.cell * STRIP.n) / 2;
const SCY = STRIP.y + STRIP.h / 2;
/** the toggle sits just above the strip, over the pointer-event holes it feeds */
const TOGGLE = { x: 410, y: 238 };
/** the ribbon's end at the plate's right edge, and where the pulled operation tag comes to rest */
const OPTAG = { x: 1104, y: 196 };
/** the holes that get a copper wire tag */
const WIRED = [0, 9, 17];

interface Beats {
  D: number;
  table: number;
  cells: number;
  twenty: number;
  wire: number;
  /** when each card lands */
  land: number[];
  /** when each group's bracket inks */
  group: number[];
  /** the event flags' pops [cell, t0] */
  pops: [number, number][];
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const cells = T.beat('cells');
    // cards land group by group from 'cell': window, pointer events, state, spring, the rest
    const land: number[] = [];
    const at = (i: number, t0: number) => (land[i] = t0);
    at(0, cells - 0.1);
    at(1, cells + 0.02);
    for (let i = 2; i <= 8; i++) at(i, cells + 0.22 + (i - 2) * 0.09);
    at(9, cells + 0.95);
    at(10, cells + 1.02);
    for (let i = 11; i <= 14; i++) at(i, cells + 1.18 + (i - 11) * 0.07);
    for (let i = 15; i <= 19; i++) at(i, cells + 1.5 + (i - 15) * 0.07);
    const group = [land[1] + 0.12, land[8] + 0.12, land[10] + 0.1, land[14] + 0.1, land[19] + 0.1];
    const pops: [number, number][] = [
      [2, land[2] + 0.12],
      [5, land[5] + 0.12],
      [8, land[8] + 0.12],
      [2, T.duration - 1.55],
    ];
    const b: Beats = { D: T.duration, table: T.beat('table'), cells, twenty: T.beat('twenty'), wire: T.beat('wire'), land, group, pops };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(stripCam(t, b));
    const key = { key: ID, near: 'spool' as const };
    plateBack(f, key);
    f.layer('L4', (c, env) => {
      const settle = seg(t, b.table - 0.15, b.table + 0.5);
      const drop = (1 - settle) * -14;
      // the toggle switch above the strip; its thumb twitches when the last flag pops
      const lastPop = b.pops[b.pops.length - 1][1];
      const twitch = 0.09 * Math.sin(Math.PI * clamp01((tq - lastPop - 0.05) / 0.4));
      // the toggle cut-out lies on the plate with a soft shadow under it
      const ta = seg(t, b.table, b.table + 0.6);
      c.save();
      c.shadowColor = withAlpha('#1d140d', 0.35 * ta);
      c.shadowBlur = 9;
      c.shadowOffsetX = 3;
      c.shadowOffsetY = 6;
      paperToggle(c, env, TOGGLE.x, TOGGLE.y + drop * 0.5, twitch, ta);
      c.restore();
      c.save();
      c.translate(SCX, SCY);
      c.scale(SC, SC);
      c.translate(-SCX, -SCY);
      c.save();
      c.translate(0, drop);
      pigeonStrip(c, env, { a: settle });
      c.restore();
      // the cards, each with a 2 px paper shadow so the drop into its hole reads physically
      for (let i = 0; i < STRIP.n; i++) {
        const a = seg(tq, b.land[i] - 0.05, b.land[i] + 0.12);
        if (a <= 0) continue;
        const flag = flagAt(i, tq, b);
        cardShadow(c, i, a, TOGGLE_CELLS[i].kind === 'flag' ? 10 * flag : 0);
        toggleCard(c, env, i, { a, flag, glow: WIRED.includes(i) ? 0.5 * seg(t, b.wire, b.wire + 0.3) : 0 });
      }
      // brackets and group labels
      const n = b.group.reduce((acc, g0) => acc + seg(t, g0, g0 + 0.3), 0);
      groupBrackets(c, env, n);
      // the count: an ink ring traced round the strip, a running numeral riding its head along the holes
      countRing(c, env, t, b);
      WIRED.forEach((i, k) => wireClip(c, env, { x: cellX(i), y: STRIP.y }, String(i), seg(t, b.wire + 0.05 + k * 0.16, b.wire + 0.5 + k * 0.16)));
      c.restore();
      // the wires
      opPulled(c, env, t, b);
      wireClip(c, env, { x: OPTAG.x - 6, y: OPTAG.y - 22 }, '20', seg(t, b.wire + 0.6, b.wire + 1.05), 40);
      labels(c, env, t, b);
    });
    plateNear(f, key);
  },
});

/** an event flag: 0 → pops to 1 (lifted a little) → falls back to 0 */
function flagAt(i: number, tq: number, b: Beats): number {
  if (TOGGLE_CELLS[i].kind !== 'flag') return 0;
  let v = 0;
  for (const [cell, t0] of b.pops) {
    if (cell !== i) continue;
    if (tq >= t0 && tq < t0 + 0.42) v = 1;
  }
  return v;
}

/**
 * The count, as counting: an ink ring starts at the strip's left end, its head runs along the top edge over the holes
 * one by one while a small numeral rides it (1 … 20), landing on 20 just after 'twenty'; then the ring closes round.
 */
const RING = { pad: 14, top: 12, r: 22 };
function countRing(c: C2, env: PaintEnv, t: number, b: Beats) {
  const tA = b.twenty - 1.05, tB = b.twenty + 0.1, tC = b.twenty + 0.75;
  if (t < tA - 0.25) return;
  const x0 = STRIP.x - RING.pad, y0 = STRIP.y - RING.top, w = STRIP.cell * STRIP.n + 2 * RING.pad, h = STRIP.h + 38;
  const r = RING.r;
  // perimeter from the left middle, clockwise: left side up, the top (the counted run), then round and home
  const Lup = h / 2 - r + (Math.PI * r) / 2;
  const Ltop = w - 2 * r;
  const P = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
  let len: number;
  if (t < tA) len = Lup * sm((t - (tA - 0.25)) / 0.25);
  else if (t < tB) len = Lup + Ltop * ((t - tA) / (tB - tA));
  else len = Lup + Ltop + (P - Lup - Ltop) * sm((t - tB) / (tC - tB));
  c.save();
  c.strokeStyle = withAlpha(plateInk(env), 0.8);
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.setLineDash([Math.max(0.01, len), P]);
  c.beginPath();
  c.moveTo(x0, y0 + h / 2);
  c.arcTo(x0, y0, x0 + w, y0, r);
  c.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
  c.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
  c.arcTo(x0, y0 + h, x0, y0, r);
  c.closePath();
  c.stroke();
  c.setLineDash([]);
  c.restore();
  // the running numeral: the holes the head has passed, riding just above it; it rests on 20, then lets the label speak
  const headX = x0 + r + Math.min(Ltop, Math.max(0, len - Lup));
  const passed = Math.max(0, Math.min(STRIP.n, Math.floor((headX - STRIP.x) / STRIP.cell + 0.5)));
  const na = seg(t, tA - 0.05, tA + 0.12) * (1 - seg(t, b.twenty + 0.9, b.twenty + 1.3));
  if (passed < 1 || na <= 0.01) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.save();
    c.globalAlpha = na;
    c.font = `600 ${size}px ${FONT.mono}`;
    c.fillStyle = plateInk(env);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const nx = Math.min(headX, cellX(STRIP.n - 1));
    c.fillText(String(passed), nx, y0 - 8);
    const tw = c.measureText('20').width;
    textProbe(c, `${ID}-count`, nx - tw / 2, y0 - 8 - size, tw, size * 1.2, na);
    c.restore();
  });
}

/** a 2 px paper shadow under a card standing in hole i (cellCard's geometry), lifted with a flag */
function cardShadow(c: C2, i: number, a: number, lift: number) {
  const cw = STRIP.cell - 12, ch = STRIP.h - 22;
  const x = cellX(i) - cw / 2;
  const y = STRIP.y + 14 - lift + (1 - a) * -18;
  c.save();
  c.fillStyle = withAlpha('#1d140d', 0.12 * a);
  c.fillRect(x + 1, y + 2, cw + 3, ch + 3);
  c.fillStyle = withAlpha('#1d140d', 0.2 * a);
  c.fillRect(x + 2, y + 2.5, cw, ch);
  c.restore();
}

/** locked plate with a slow 5 % push-in toward the strip from 'cell' to 'wire' */
function stripCam(t: number, b: Beats): Camera3 {
  const u0 = sm(t / b.D);
  const u = clamp01((t - b.cells) / (b.wire - b.cells));
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  const k = (1 + 0.05 * e) * (1 + 0.006 * u0);
  return { x: 640, y: 360 + 14 * e, z: 1000 - 1000 / k, lens: 1 };
}

/** the ribbon's stub at the plate's right edge; one operation tag is pulled out of it onto the plate */
function opPulled(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.wire - 0.45, b.wire + 0.25);
  if (u <= 0) return;
  // the end of the builder ribbon from s02, run in over the plate's right edge: its paper, a column rule and two of its
  // ink tags, so the pulled tag plainly comes off the ribbon
  const ra = clamp01(u * 3);
  const ry = OPTAG.y - 40, rh = 80;
  c.save();
  c.globalAlpha = ra;
  c.fillStyle = withAlpha('#1d140d', 0.14);
  c.fillRect(1176, ry + 4, 140, rh);
  c.beginPath();
  c.moveTo(1168, ry);
  c.lineTo(1320, ry);
  c.lineTo(1320, ry + rh);
  c.lineTo(1180, ry + rh);
  c.closePath();
  c.fillStyle = mixLab(paperOf(env), '#fffaf0', 0.35);
  c.fill();
  c.strokeStyle = withAlpha(plateInk(env), 0.45);
  c.lineWidth = 1;
  c.stroke();
  c.strokeStyle = withAlpha(plateInk(env), 0.13);
  c.setLineDash([3, 5]);
  c.beginPath();
  c.moveTo(1236, ry + 8);
  c.lineTo(1236, ry + rh - 8);
  c.stroke();
  c.setLineDash([]);
  c.restore();
  opTag(c, env, { x: 1272, y: ry + 22, kind: 'ReGLU', a: ra, scale: 0.6 });
  opTag(c, env, { x: 1272, y: ry + 58, kind: 'boolean', a: ra, scale: 0.6 });
  const x = OPTAG.x + (1 - u) * 96;
  opTag(c, env, { x, y: OPTAG.y, kind: 'sum', a: clamp01(u * 2), subject: true, probe: `${ID}-op` });
}

function labels(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ink = plateInk(env);
  const set = (txt: string, y: number, a: number, id: string, copper = false) => {
    if (a <= 0.01) return;
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `italic 400 30px ${FONT.text}`, 30);
      c.save();
      c.font = `italic 400 ${size}px ${FONT.text}`;
      c.globalAlpha = a;
      c.fillStyle = copper ? mixLab(copperInk(env, 0.2), ink, 0.35) : ink;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(txt, 640, y);
      const tw = c.measureText(txt).width;
      textProbe(c, id, 640 - tw / 2, y - size, tw, size * 1.25, a);
      c.restore();
    });
  };
  set('source table · 20 cells', 548, seg(t, b.twenty + 0.45, b.twenty + 0.8), `${ID}-twenty`);
  set('wire = the position of a number', 604, seg(t, b.wire + 0.2, b.wire + 0.55), `${ID}-wire`, true);
}
void TOGGLE_GROUPS;
