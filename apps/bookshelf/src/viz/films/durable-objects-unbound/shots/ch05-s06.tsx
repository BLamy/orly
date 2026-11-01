/**
 * ch05-s06 — CLAIMED IS NOT OPENED, on parchment (parchment, paper-fold in). The mandatory distinction, step by step.
 *
 * The Plate's three tiles engraved large (house · epoch · from) with the crown lamp above, the demonstrator's hand
 * (from the lower RIGHT) turning them; each state is then printed as a small stamp in a row along the upper third,
 * left to right, so the history accumulates. Engraved corner badge 'workerd · 28 Oct'. Numbers are made up (the
 * narration says so). Camera: a very slow drift; L2 a dark desk edge past the sheet; L5 a brass rule's edge.
 *
 *   fixture   6.10  'Made-up': the hand sets the first tile
 *   s1        7.92  A · 7 · 7 — opened, the crown lights; the stamp prints (slot 1), crown LIT
 *   s2       13.47  'claims': B · 8 · 7 — the hand HOLDS the from tile so it visibly does not move; crown DARK;
 *                   label 'claimed ≠ opened'; the stamp prints (slot 2)
 *   steps    21.41  under stamp 2, in order: a shelf marked 7 is read; a snapshot book is sent down; then the opening
 *                   write, a dotted arrow toward a ghost stamp B · 8 · 8 (crown lit, not printed)
 *   (29.15)         'flicker': B's tiny house in stamp 2 flickers once
 *   dies     33.23  B's tiny house darkens before the arrow arrives; the ghost stamp fades
 *   s3       36.32  'nine': C · 9 · 7, crown dark (slot 3); label 'C recovers the last OPENED epoch'; an ink line
 *                   runs back from C's from tile to the A · 7 · 7 stamp: recover seven
 *   nothing  41.37  stamp 2 shown with an EMPTY shelf beneath it
 *   rewind   42.52  the row unprints back to state 2
 *   s2b      43.92  'Had': the dotted arrow completes; B · 8 · 8 prints with its crown lit (slot 3)
 *   s3b      49.11  C · 9 · 8 prints (slot 4); its ink line runs back to the B · 8 · 8 stamp: recover eight
 * All text on the parchment above y 600; bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { FONT, defineShot, mixLab, textSwap, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { badge, camAt, clamp01, label, lerp, pulse, seg, sm, twos, type C2, type CamKey } from '../sets/common';
import { handReach } from '../sets/demonstratorHand';
import { handFromRight } from '../sets/ch05-s03-sill';
import { crownCentre, inkCol, inkFold, inkText, inkTiles, paperSheet, tileCentre, type Tile } from '../sets/ch05-s02-parchment';

const ID = 'ch05-s06';
const SHEET = { x: 34, y: 26, w: 1212, h: 720 };
const BIG = { x: 600, y: 486, s: 2.0 };
const ROW_Y = 214;
const SLOT_X = [200, 470, 740, 1010];
const STAMP_S = 0.98;
const HOME: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const REST: Camera3 = { x: 650, y: 362, z: 28, lens: 1 };

interface Stamp {
  house: Tile;
  epoch: Tile;
  from: Tile;
  crown: number;
}
/** a printed stamp (press-in: scale + a brief dark ink flash), slot i */
function stamp(c: C2, env: PaintEnv, i: number, st: Stamp, u: number, o: { ghost?: boolean; houseLamp?: number | null; alpha?: number; id: string }): void {
  if (u <= 0.002) return;
  const k = 1 + 0.12 * (1 - sm(u));
  c.save();
  c.translate(SLOT_X[i], ROW_Y);
  c.scale(k, k);
  c.translate(-SLOT_X[i], -ROW_Y);
  inkTiles(c, env, { x: SLOT_X[i], y: ROW_Y, s: STAMP_S, ...st, alpha: sm(u) * (o.alpha ?? 1), ghost: o.ghost, houseLamp: o.houseLamp ?? null, id: o.id });
  c.restore();
}
/** an empty shelf pictogram (x centre, y the shelf line); n scrolls on it (0 = empty) */
function shelf(c: C2, env: PaintEnv, x: number, y: number, n: number, a: number, mark?: string): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = inkCol(env, 0.85);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(x - 42, y);
  c.lineTo(x + 42, y);
  c.moveTo(x - 36, y);
  c.lineTo(x - 30, y + 10);
  c.moveTo(x + 36, y);
  c.lineTo(x + 30, y + 10);
  c.stroke();
  c.lineWidth = 1.3;
  for (let i = 0; i < n; i++) {
    c.beginPath();
    c.ellipse(x - 24 + i * 16, y - 7, 7, 6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
  if (mark) inkText(c, env, { id: `${ID}-shelf-${mark}`, text: mark, x: x + 54, y: y + 4, size: 17, family: FONT.mono, style: '500', alpha: a, legible: false });
}
/** a small bound book with an arrow down (the snapshot sent down to the bucket) */
function bookDown(c: C2, env: PaintEnv, x: number, y: number, a: number, drop: number): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = inkCol(env, 0.85);
  c.lineWidth = 1.6;
  const by = y - 16 + 14 * drop;
  c.strokeRect(x - 13, by, 26, 18);
  c.beginPath();
  c.moveTo(x - 9, by);
  c.lineTo(x - 9, by + 18);
  c.stroke();
  c.beginPath();
  c.moveTo(x, y + 8);
  c.lineTo(x, y + 26);
  c.moveTo(x - 6, y + 20);
  c.lineTo(x, y + 26);
  c.lineTo(x + 6, y + 20);
  c.stroke();
  c.restore();
}
/** a dotted arrow from a to b (u drawn) */
function dots(c: C2, env: PaintEnv, a: { x: number; y: number }, b: { x: number; y: number }, u: number, alpha = 1, head = true): void {
  if (u <= 0 || alpha <= 0.01) return;
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  c.save();
  c.fillStyle = inkCol(env, 0.85 * alpha);
  for (let d = 0; d <= L * u; d += 7) {
    const k = d / L;
    c.beginPath();
    c.arc(lerp(a.x, b.x, k), lerp(a.y, b.y, k), 1.8, 0, Math.PI * 2);
    c.fill();
  }
  if (head && u >= 0.98) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    c.strokeStyle = inkCol(env, 0.85 * alpha);
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(b.x - Math.cos(ang - 0.5) * 10, b.y - Math.sin(ang - 0.5) * 10);
    c.lineTo(b.x, b.y);
    c.lineTo(b.x - Math.cos(ang + 0.5) * 10, b.y - Math.sin(ang + 0.5) * 10);
    c.stroke();
  }
  c.restore();
}
/** the recovery ink line: from slot i's from tile, arcing over the row, back to slot j's stamp (u drawn) */
function recoverLine(c: C2, env: PaintEnv, i: number, j: number, u: number, alpha = 1): void {
  if (u <= 0 || alpha <= 0.01) return;
  const a = tileCentre({ x: SLOT_X[i], y: ROW_Y, s: STAMP_S }, 2);
  const b = tileCentre({ x: SLOT_X[j], y: ROW_Y, s: STAMP_S }, 1);
  const a0 = { x: a.x + 12, y: a.y - 30 };
  const b0 = { x: b.x, y: b.y - 30 };
  const peak = ROW_Y - 96;
  const N = 40;
  c.save();
  c.strokeStyle = inkCol(env, 0.9 * alpha);
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  let last = a0;
  for (let k = 0; k <= Math.round(N * clamp01(u)); k++) {
    const s = k / N;
    const x = (1 - s) * (1 - s) * a0.x + 2 * (1 - s) * s * ((a0.x + b0.x) / 2) + s * s * b0.x;
    const y = (1 - s) * (1 - s) * a0.y + 2 * (1 - s) * s * peak + s * s * b0.y;
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
    last = { x, y };
  }
  c.stroke();
  if (u >= 0.98) {
    c.beginPath();
    c.moveTo(last.x - 8, last.y - 10);
    c.lineTo(last.x, last.y);
    c.lineTo(last.x + 8, last.y - 10);
    c.stroke();
  }
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const w = (l: string, x: string) => T.word(l, x);
    const b = {
      D: T.duration,
      fixture: T.beat('fixture'),
      aW: w('L0528', 'A'),
      ep7: w('L0528', 'seven'),
      from7: w('L0528', 'seven#3'),
      lit: w('L0528', 'lit'),
      s1: T.beat('s1'),
      s2: T.beat('s2'),
      bW: w('L0529', 'B#2'),
      eight: w('L0529', 'eight'),
      from2: w('L0529', 'from'),
      seven2: w('L0529', 'seven'),
      dark: w('L0529', 'dark'),
      steps: T.beat('steps'),
      upload: w('L0530', 'upload'),
      opening: w('L0530', 'opening'),
      eightW: w('L0530', 'eight'),
      flicker: w('L0531', 'flicker'),
      dies: T.beat('dies'),
      cW: w('L0531', 'C#2'),
      s3: T.beat('s3'),
      recovers: w('L0531', 'recovers'),
      nothing: T.beat('nothing'),
      rewind: T.beat('rewind'),
      s2b: T.beat('s2b'),
      eightB: w('L0532', 'eight'),
      fromB: w('L0532', 'eight#2'),
      cB: w('L0532', 'C'),
      s3b: T.beat('s3b'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: HOME },
      { t: b.D, cam: REST },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(cams, t));
    f.backlight({ sunX: 640, sunY: 360, intensity: 0.4 });
    f.layer('L2', (c, env) => {
      const r = { x: -300, y: -100, w: 1900, h: 900 };
      f.cached(`dou/${ID}/desk/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.3);
        cc.fillRect(r.x, 640, r.w, 300);
        cc.fillRect(1180, -100, 500, 900);
        cc.fillRect(r.x, -100, 120, 900);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ the big Plate's state, turned by the hand
    const rewound = t >= b.rewind;
    const counter = t >= b.s2b - 0.1;
    let house: Tile = '', epoch: Tile = '', from: Tile = '', crown = 0;
    const flip: [number, number, number] = [1, 1, 1];
    const turn = (at: number) => seg(t, at - 0.15, at + 0.25);
    if (t >= b.aW - 0.15) { house = 'A'; flip[0] = turn(b.aW); }
    if (t >= b.ep7 - 0.15) { epoch = 7; flip[1] = turn(b.ep7); }
    if (t >= b.ep7 + 0.25) { from = 7; flip[2] = seg(t, b.ep7 + 0.25, b.ep7 + 0.6); }
    crown = seg(t, b.ep7 + 0.5, b.ep7 + 0.9) * (1 - seg(t, b.s2 - 0.1, b.s2 + 0.2));
    if (t >= b.bW - 0.15) { house = 'B'; flip[0] = turn(b.bW); }
    if (t >= b.eight - 0.15) { epoch = 8; flip[1] = turn(b.eight); flip[2] = 1; }
    if (t >= b.cW - 0.15 && !rewound) { house = 'C'; flip[0] = turn(b.cW); }
    if (t >= b.s3 - 0.15 && !rewound) { epoch = 9; flip[1] = turn(b.s3); }
    if (rewound) {
      const back = seg(t, b.rewind, b.rewind + 0.5);
      house = 'B'; epoch = 8; from = 7;
      flip[0] = back; flip[1] = back;
      if (t >= b.fromB - 0.15) { from = 8; flip[2] = turn(b.fromB); crown = seg(t, b.fromB + 0.2, b.fromB + 0.6); }
      if (t >= b.cB - 0.15) { house = 'C'; epoch = 9; from = 8; crown = 0; flip[0] = turn(b.cB); flip[1] = turn(b.cB + 0.2); flip[2] = 1; }
    }
    // the hand: sets the first tile; turns A·7·7; turns B·8 and HOLDS the from tile; later turns C·9; the rewind
    const tileFor = (): number => {
      if (t < b.ep7 - 0.2) return 0;
      if (t < b.s2 - 0.2) return t < b.ep7 + 0.25 ? 1 : 2;
      if (t < b.eight - 0.2) return 0;
      if (t < b.from2 - 0.25) return 1;
      if (t < b.s3 - 0.2) return t < b.cW + 0.1 && t > b.cW - 0.6 ? 0 : 2;
      if (t < b.rewind) return t < b.s3 + 0.3 ? 1 : 2;
      if (t < b.cB - 0.3) return 2;
      return t < b.cB + 0.2 ? 0 : 1;
    };
    const reach = handReach(t, b.fixture - 0.5, b.dark + 0.4, 0.6) + handReach(t, b.cW - 0.7, b.recovers + 0.2, 0.6) + handReach(t, b.s2b - 0.5, b.cB + 0.7, 0.6);
    const tp = tileCentre(BIG, tileFor());
    // ------------------------------------------------ the stamps' print times
    const p1 = seg(t, b.from7 + 0.1, b.from7 + 0.45);
    const p2 = seg(t, b.seven2 + 0.25, b.seven2 + 0.6);
    const p3 = rewound ? 0 : seg(t, b.s3 + 0.9, b.s3 + 1.25);
    const p3b = seg(t, b.s2b + 0.7, b.s2b + 1.05);
    const p4b = seg(t, b.cB + 0.3, b.cB + 0.65);
    // B's tiny house in stamp 2: lit, a single flicker, then dark on 'died'
    const flick = t > b.flicker && t < b.flicker + 0.9 ? (Math.sin(tq * 31) > 0 ? 1 : 0.2) : 1;
    const bLamp = counter ? 1 : (1 - seg(t, b.dies - 0.1, b.dies + 0.3)) * flick;
    // the steps under stamp 2 (the first timeline), then the empty shelf
    const st1 = seg(t, b.steps - 0.1, b.steps + 0.6);
    const st2 = seg(t, b.upload - 0.1, b.upload + 0.6);
    const arrowU = counter ? lerp(0.55, 1, seg(t, b.s2b - 0.1, b.s2b + 0.6)) : seg(t, b.opening - 0.1, b.eightW + 0.2) * 0.55;
    const ghost = counter ? 0 : seg(t, b.opening + 0.2, b.eightW + 0.2) * (1 - seg(t, b.dies, b.dies + 0.8));
    const stepsA = 1 - seg(t, b.s3 - 0.4, b.s3 + 0.2);
    const emptyShelf = seg(t, b.nothing - 1.2, b.nothing - 0.2) * (1 - seg(t, b.rewind - 0.1, b.rewind + 0.4));
    const line1 = rewound ? 0 : seg(t, b.recovers - 0.1, b.recovers + 0.9);
    const line2 = seg(t, b.s3b - 0.1, b.s3b + 0.9);
    f.layer('L4', (c, env) => {
      f.cached(`dou/${ID}/sheet/${env.mood.id}`, SHEET.w + 60, SHEET.h + 60, (cc) => {
        cc.translate(-SHEET.x + 30, -SHEET.y + 30);
        paperSheet(cc, env, { ...SHEET, seed: 61 });
      })(c, SHEET.x - 30, SHEET.y - 30);
      inkFold(c, { ...SHEET, u: seg(t, 0.2, 1.4) });
      badge(c, env, { x: 196, y: 40, text: 'workerd · 28 Oct', s: 1.05, engraved: true, legible: true, id: `${ID}-badge` });
      // a faint rule under the stamp row (the history accumulates along it)
      c.save();
      c.strokeStyle = inkCol(env, 0.25);
      c.setLineDash([2, 6]);
      c.beginPath();
      c.moveTo(80, ROW_Y + 50);
      c.lineTo(1100, ROW_Y + 50);
      c.stroke();
      c.restore();
      // the row of stamps
      stamp(c, env, 0, { house: 'A', epoch: 7, from: 7, crown: 1 }, p1, { id: `${ID}-st1`, houseLamp: 1 });
      stamp(c, env, 1, { house: 'B', epoch: 8, from: 7, crown: 0 }, p2, { id: `${ID}-st2`, houseLamp: bLamp });
      stamp(c, env, 2, { house: 'B', epoch: 8, from: 8, crown: 1 }, ghost, { ghost: true, id: `${ID}-ghost`, houseLamp: null });
      stamp(c, env, 2, { house: 'C', epoch: 9, from: 7, crown: 0 }, p3 * (1 - seg(t, b.rewind, b.rewind + 0.6)), { id: `${ID}-st3`, houseLamp: 1 });
      stamp(c, env, 2, { house: 'B', epoch: 8, from: 8, crown: 1 }, p3b, { id: `${ID}-st3b`, houseLamp: 1 });
      stamp(c, env, 3, { house: 'C', epoch: 9, from: 8, crown: 0 }, p4b, { id: `${ID}-st4b`, houseLamp: 1 });
      // the steps under stamp 2: read shelf 7, send a snapshot down, then the opening write toward the ghost
      const sx = SLOT_X[1];
      c.save();
      c.translate(sx, ROW_Y + 60);
      c.scale(1.35, 1.35);
      c.translate(-sx, -(ROW_Y + 60));
      shelf(c, env, sx - 50, ROW_Y + 92, 3, st1 * stepsA, '7');
      bookDown(c, env, sx + 52, ROW_Y + 82, st2 * stepsA, seg(t, b.upload + 0.2, b.upload + 0.9));
      dots(c, env, { x: sx + 92, y: ROW_Y + 72 }, { x: SLOT_X[2] - 40, y: ROW_Y + 34 }, arrowU, counter ? 1 : stepsA * (1 - seg(t, b.dies, b.dies + 0.6)));
      // 'nothing': stamp 2 with an empty shelf beneath it
      shelf(c, env, sx, ROW_Y + 92, 0, emptyShelf, '8');
      c.restore();
      // the recovery lines
      recoverLine(c, env, 2, 0, line1, 1 - seg(t, b.rewind, b.rewind + 0.6));
      recoverLine(c, env, 3, 2, line2);
      // the big Plate, turned by the hand
      inkTiles(c, env, { ...BIG, house, epoch, from, crown: crown * (1 + 0.4 * pulse(t, b.lit, 0.2, 0.2, 0.8)), flip, captions: seg(t, 0.8, 2.0), id: `${ID}-big`, ring: { i: 2, u: seg(t, b.from2 - 0.1, b.from2 + 0.6) * (1 - seg(t, b.dark + 0.3, b.dark + 0.9)) } });
      if (reach > 0.01) handFromRight(c, env, { tip: { x: tp.x + 4, y: tp.y + 30 }, reach: Math.min(1, reach), shape: 'pinch', s: 0.62 });
      void crownCentre;
    });
    f.rim({ x: 0, y: -1 });
    f.layer('L5', (c, env) => {
      const r = { x: -120, y: -100, w: 200, h: 900 };
      f.cached(`dou/${ID}/rule/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = mixLab('#8a6a34', env.mood.fg, 0.25);
        cc.fillRect(-60, -100, 74, 900);
        cc.fillStyle = withAlpha('#f0d690', 0.4);
        cc.fillRect(12, -100, 3, 900);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ labels (one swaps for the other)
    const sw = textSwap(t, b.s3 + 0.1, 0.4);
    label(f.c, f.mood, { id: `${ID}-claimed`, text: 'claimed ≠ opened', size: 26, x: 1200, y: 64, align: 'right', alpha: seg(t, b.s2 - 0.15, b.s2 + 0.3) * sw.out });
    label(f.c, f.mood, { id: `${ID}-recover`, text: 'C recovers the last OPENED epoch', size: 26, x: 1200, y: 64, align: 'right', alpha: sw.in });
  },
});
