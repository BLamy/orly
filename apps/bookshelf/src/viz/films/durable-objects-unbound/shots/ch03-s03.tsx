/**
 * ch03-s03 — the two refusals that make the Well a referee (winterBlue, cut on the pin's click). A tight two-shot
 * of the wellhead (the canonical square, camera low, the Plate looming above): the Tooth's brass slot with its
 * hinged shutter and, on its upper lip, the store's own jaw cut to the Plate's current version. Keepers A and B are
 * seen only as forearms with brass cards, A from the left, B from the right. Badge 'Amazon S3' on its hook (art).
 *
 * LESSON ONE (date1 '20 August 2024'): only if absent. The tiles are blank and the slot OPEN, its shutter up.
 *   race      both cards push toward the slot at once
 *   (lands)   A's card goes in first; the first tile stamps 'A'
 *   shutter   the shutter drops over the slot with a dry click
 *   refuse1   B's card strikes the shutter and is spat back, punched
 * LESSON TWO (date2 '25 November 2024'): only if unchanged. The Plate (now showing 'B', illustrative) carries a
 * notched brass edge: its version, an opaque pattern (not a checksum). The jaw on the slot is cut to it.
 *   notch     both cards are held up beneath the Plate: their edges carry the SAME sawtooth as the Plate's
 *   click     A's card meets the jaw: the teeth mesh, click; the tile turns to 'A'; the Plate's notch (and the jaw)
 *             is re-cut to a new pattern; label 'only if absent · only if unchanged'
 *   thunk     B's card, still carrying the old pattern, butts the new jaw: thunk, spat back punched
 *   term      (the reel's tag 'compare and swap' top-left; nothing of ours there)
 *   store     the camera tilts down past the slot to the Well's mouth: the jaw's rod runs down into the store
 *   no        pull back to the square, the Plate gleaming above the Well
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { BRASS_HI, EMBER, badge, brass, camAt, clamp01, glowDot, label, lerp, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, paintTown } from '../sets/harbourTown';
import { WELL, notchPath, swapCard, tooth } from '../sets/wellAndPlate';
import { dateStamp } from '../sets/ch02-s01-kit';
import { keeperArm } from '../sets/ch03-s01-square';

const ID = 'ch03-s03';
const W = TOWN.well;
const SLOT = { x: W.x + WELL.slot.x, y: W.y + WELL.slot.y };
/** the Tooth redrawn at close-up scale on the same lip */
const TS = 1.7;
const JAW = { x: SLOT.x, y: SLOT.y - 8 * TS - 1, w: 30 * TS };
const CARD_S = 1.45;
/** where a presented card sits: its notched top edge just under the jaw */
const PRESENT = { x: SLOT.x, y: JAW.y + 2 + 11 * CARD_S };
const PLATE_EDGE = { x: W.x, y: W.y + WELL.plate.y + WELL.plateH / 2 + 8 };
const N1 = 3, N2 = 8;

const LOW0: Camera3 = { x: 452, y: 474, z: 540, lens: 1 };
const LOW: Camera3 = { x: 456, y: 486, z: 620, lens: 1 };
const LOW2: Camera3 = { x: 456, y: 486, z: 630, lens: 1 };
const L2: Camera3 = { x: 456, y: 494, z: 664, lens: 1 };
const STORE: Camera3 = { x: 446, y: 562, z: 680, lens: 1 };
const SQUARE: Camera3 = { x: 520, y: 398, z: 150, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date1: T.beat('date1'),
      race: T.beat('race'),
      shutter: T.beat('shutter'),
      refuse1: T.beat('refuse1'),
      date2: T.beat('date2'),
      notch: T.beat('notch'),
      click: T.beat('click'),
      thunk: T.beat('thunk'),
      term: T.beat('term'),
      store: T.beat('store'),
      no: T.beat('no'),
      anew: T.word('L0316', 'anew'),
      lands: T.word('L0314', 'lands'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: LOW0 },
      { t: b.race - 1.0, cam: LOW },
      { t: b.date2 - 0.6, cam: LOW2 },
      { t: b.notch - 0.4, cam: { ...LOW2, y: LOW2.y - 10 } },
      { t: b.click - 0.3, cam: L2 },
      { t: b.store - 0.5, cam: { ...L2, x: L2.x + 4 } },
      { t: b.store + 1.6, cam: STORE },
      { t: b.no - 0.7, cam: { ...STORE, y: STORE.y + 4 } },
      { t: Math.min(b.D, b.no + 1.9), cam: SQUARE },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const lesson2 = t >= b.date2 - 0.4;
    // ---- lesson one
    const shutter = lesson2 ? 0 : seg(t, b.shutter - 0.1, b.shutter + 0.08);
    const landA1 = b.lands - 0.2;
    const house1 = t < landA1 + 0.3 ? '' : 'A';
    // ---- lesson two
    const recut = seg(t, b.anew - 1.3, b.anew - 0.1);
    const notchNow = t < b.click + 0.4 ? N1 : N2;
    const house2 = t < b.click + 0.1 ? 'B' : 'A';
    const flip0 = lesson2 ? seg(t, b.click + 0.1, b.click + 0.4) : seg(t, landA1 + 0.3, landA1 + 0.6);
    const notchShow = lesson2 ? seg(t, b.date2 - 0.2, b.date2 + 0.6) : 0;
    const flashClick = Math.max(Math.sin(Math.PI * seg(t, b.shutter - 0.12, b.shutter + 0.3)), Math.sin(Math.PI * seg(t, b.click - 0.05, b.click + 0.4)));
    const flashThunk = Math.max(Math.sin(Math.PI * seg(t, b.refuse1 - 0.75, b.refuse1 - 0.3)), Math.sin(Math.PI * seg(t, b.thunk - 0.05, b.thunk + 0.45)));
    const gleam = Math.sin(Math.PI * seg(t, b.no - 0.2, b.no + 1.4));
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0.35, B: 0.15, C: 0 },
        plate: {
          house: lesson2 ? house2 : house1,
          epoch: '',
          from: '',
          crown: 0,
          flip: [flip0, 1, 1],
          notch: notchShow > 0.01 ? (t < b.anew - 1.3 ? N1 : N2) : null,
          notchPrev: N1,
          recut,
          glint: [0.2 + 0.6 * gleam + 0.4 * Math.sin(Math.PI * seg(t, b.notch - 0.2, b.notch + 1.2)), 0.2 * gleam, 0.2 * gleam],
          alpha: 1,
        },
        plateLegible: cam.z > 400,
        tooth: null,
        well: { bucket: 0.25, glint: 0.3 + 0.5 * seg(t, b.store - 0.3, b.store + 1.2) },
        badge: null,
        lampPostLit: 0.3,
      },
      {
        L4: (c, env) => {
          badge(c, env, { x: W.x + WELL.hookR.x + 6, y: W.y + WELL.hookR.y - 2, text: 'Amazon S3', s: 0.7, legible: false, glint: 0.3, swing: 0.03 * Math.sin(tq * 1.3) });
          // the close-up Tooth gives way to the canonical one as the camera pulls back to the square
          const big = 1 - seg(t, b.no - 0.3, b.no + 0.7);
          const toothState = { shutter, pin: 1, pawl: 1, showPin: false, flash: Math.max(flashClick, flashThunk), flashKind: (flashThunk > flashClick ? 'thunk' : 'click') as 'thunk' | 'click' };
          if (big < 1) {
            c.save();
            c.globalAlpha = 1 - big;
            tooth(c, env, { x: W.x, y: W.y, s: 1, tooth: toothState });
            c.restore();
          }
          c.save();
          c.globalAlpha = big;
          tooth(c, env, { x: SLOT.x - WELL.slot.x * TS, y: SLOT.y - WELL.slot.y * TS, s: TS, tooth: toothState });
          if (lesson2) jaw(c, env, notchNow, recut, t, b);
          c.restore();
          if (!lesson2) lessonOne(c, env, t, tq, b);
          else lessonTwo(c, env, t, tq, b);
        },
      },
    );
    // ---------------------------------------------------------------- type
    const c = f.c;
    dateStamp(c, f.mood, { id: `${ID}-date1`, text: '20 August 2024', x: 1222, y: 66, alpha: seg(t, b.date1 - 0.1, b.date1 + 0.4) * (1 - seg(t, b.date2 - 0.5, b.date2 - 0.15)) });
    dateStamp(c, f.mood, { id: `${ID}-date2`, text: '25 November 2024', x: 1222, y: 66, alpha: seg(t, b.date2 - 0.05, b.date2 + 0.4) });
    label(c, f.mood, { id: `${ID}-only`, text: 'only if absent · only if unchanged', x: 64, y: 92, alpha: seg(t, b.click - 0.1, b.click + 0.4) * (1 - seg(t, b.term - 0.7, b.term - 0.2)) });
  },
});

interface B {
  race: number;
  shutter: number;
  refuse1: number;
  date2: number;
  notch: number;
  click: number;
  thunk: number;
  store: number;
  lands: number;
  anew: number;
  no: number;
}
/** a hand-held card: the keeper's forearm from its side, the card in the grip */
function held(c: C2, env: PaintEnv, side: 'left' | 'right', x: number, y: number, a: number, card: Parameters<typeof swapCard>[2]): void {
  if (a <= 0.01) return;
  const arm = { tip: { x: x + (side === 'left' ? -17 : 17), y: y + 9 }, side, sleeve: side === 'left' ? 'gilet' : 'coat', angle: 0.22, s: 0.62, alpha: a } as const;
  swapCard(c, env, { ...card, x, y, alpha: a });
  keeperArm(c, env, arm);
}
/** lesson one: the race to create; the shutter; the refusal */
function lessonOne(c: C2, env: PaintEnv, t: number, tq: number, b: B): void {
  const enter = sm(clamp01((tq - (b.race - 3.2)) / 1.6));
  const out = 1 - seg(t, b.date2 - 1.4, b.date2 - 0.6);
  // A: from the left, pushes on 'race', lands first (into the slot, gone)
  const pushA = sm(clamp01((tq - (b.race - 0.1)) / (b.lands - 0.2 - (b.race - 0.1))));
  const inA = sm(clamp01((tq - (b.lands - 0.2)) / 0.35));
  const restA = { x: SLOT.x - 120, y: SLOT.y + 6 };
  const ax = lerp(lerp(restA.x - 160, restA.x, enter), PRESENT.x - 4, pushA), ay = lerp(restA.y, PRESENT.y, pushA) + inA * 6;
  if (inA < 1) swapCard(c, env, { x: ax, y: ay, s: CARD_S * (1 - 0.3 * inA), house: 'A', notch: null, alpha: (1 - inA) * enter });
  // A's empty hand withdraws after the card goes in
  const handA = { x: lerp(ax - 6, restA.x - 40, seg(t, b.lands + 0.3, b.lands + 1.2)), y: ay };
  keeperArm(c, env, { tip: { x: handA.x - 17, y: handA.y + 9 }, side: 'left', sleeve: 'gilet', angle: 0.22, s: 0.62, alpha: enter * out });
  // B: from the right, reaches the slot a beat later; strikes the closed shutter; spat back, punched
  const restB = { x: SLOT.x + 124, y: SLOT.y + 8 };
  const pushB = sm(clamp01((tq - (b.race + 0.1)) / (b.shutter + 0.9 - (b.race + 0.1))));
  const spit = sm(clamp01((tq - (b.refuse1 - 0.3)) / 0.5));
  const bx = lerp(lerp(restB.x + 160, restB.x, enter), PRESENT.x + 8, pushB) + spit * 80, by = lerp(restB.y, PRESENT.y + 2, pushB) + Math.sin(Math.PI * spit) * -20;
  held(c, env, 'right', bx, by, enter * out, { x: 0, y: 0, s: CARD_S, house: 'B', notch: null, punched: seg(t, b.refuse1 - 0.25, b.refuse1 + 0.05), rot: spit * 0.35 });
}
/** the store's jaw on the slot's upper lip, cut to the current version; it re-cuts with the Plate */
function jaw(c: C2, env: PaintEnv, seed: number, recut: number, t: number, b: B): void {
  const a = seg(t, b.date2 - 0.2, b.date2 + 0.6);
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = a;
  c.translate(JAW.x - JAW.w / 2, JAW.y);
  c.fillStyle = brass(env, 0.35);
  c.fillRect(-2, -7 * TS, JAW.w + 4, 7 * TS);
  // the inverted teeth (they point down, to mesh with a card's upward teeth)
  c.save();
  c.scale(1, -1);
  c.fillStyle = brass(env, 0.55 + 0.3 * Math.sin(Math.PI * recut));
  c.fill(notchPath(seed === N2 && recut < 1 ? N1 : seed, JAW.w, 3.2 * TS));
  c.restore();
  // its rod runs down behind the housing into the Well (the store's own record of the version)
  c.fillStyle = mixLab(env.fill('ink'), BRASS_HI, 0.2);
  c.fillRect(JAW.w + 1, -4 * TS, 2.2 * TS, 30 * TS);
  c.restore();
}
/** lesson two: both cards carry the old version; one click, one thunk */
function lessonTwo(c: C2, env: PaintEnv, t: number, tq: number, b: B): void {
  const enter = sm(clamp01((tq - (b.notch - 2.2)) / 1.4));
  const out = 1 - seg(t, b.store - 0.8, b.store);
  // both held up beneath the Plate's notched edge (the same sawtooth)
  const up = sm(clamp01((tq - (b.notch - 0.5)) / 0.8)) * (1 - sm(clamp01((tq - (b.notch + 1.4)) / 0.8)));
  const showA = { x: PLATE_EDGE.x - 40, y: PLATE_EDGE.y + 32 }, showB = { x: PLATE_EDGE.x + 40, y: PLATE_EDGE.y + 32 };
  const restA = { x: SLOT.x - 120, y: SLOT.y + 4 }, restB = { x: SLOT.x + 124, y: SLOT.y + 8 };
  // A: to the jaw on 'click', meshes, goes in
  const goA = sm(clamp01((tq - (b.click - 0.9)) / 0.8));
  const meshA = sm(clamp01((tq - (b.click - 0.08)) / 0.12));
  const inA = sm(clamp01((tq - (b.click + 0.35)) / 0.35));
  let ax = lerp(lerp(restA.x - 160, restA.x, enter), showA.x, up), ay = lerp(restA.y, showA.y, up);
  ax = lerp(ax, PRESENT.x - 2, goA);
  ay = lerp(ay, PRESENT.y, goA) - meshA * 5 + inA * 10;
  if (inA < 1) swapCard(c, env, { x: ax, y: ay, s: CARD_S * (1 - 0.3 * inA), house: 'A', notch: N1, alpha: (1 - inA) * enter, glint: Math.sin(Math.PI * meshA) });
  const handOff = seg(t, b.click + 0.4, b.click + 1.3);
  keeperArm(c, env, { tip: { x: lerp(ax, restA.x - 40, handOff) - 17, y: ay + 9 }, side: 'left', sleeve: 'gilet', angle: 0.22, s: 0.62, alpha: enter * out });
  // B: to the jaw on 'thunk' (the jaw is new now): the teeth butt, it is spat back punched
  const goB = sm(clamp01((tq - (b.thunk - 0.8)) / 0.75));
  const butt = Math.sin(Math.PI * clamp01((tq - (b.thunk - 0.05)) / 0.3)) * 2.5;
  const spit = sm(clamp01((tq - (b.thunk + 0.3)) / 0.5));
  let bx = lerp(lerp(restB.x + 160, restB.x, enter), showB.x, up), by = lerp(restB.y, showB.y, up);
  bx = lerp(bx, PRESENT.x + 2, goB) + spit * 90 + butt * 0.5;
  by = lerp(by, PRESENT.y + 3, goB) + Math.sin(Math.PI * spit) * -22;
  held(c, env, 'right', bx, by, enter * out, { x: 0, y: 0, s: CARD_S, house: 'B', notch: N1, punched: seg(t, b.thunk + 0.15, b.thunk + 0.45), rot: spit * 0.35 });
  // the collision: two sawtooth profiles that do not fit (a red-brown spark at the jaw)
  const coll = Math.sin(Math.PI * clamp01((tq - (b.thunk - 0.05)) / 0.4));
  if (coll > 0.01) glowDot(c, JAW.x, JAW.y + 2, 18, tone(env, EMBER, 0.25), 0.6 * coll);
  // the store's check, down in the Well: the rod's glint travels into the mouth on 'store'
  const st = seg(t, b.store - 0.2, b.store + 1.6);
  if (st > 0.01 && st < 1) {
    const y = lerp(JAW.y + 20, W.y - WELL.ringH + 4, st);
    glowDot(c, JAW.x + JAW.w / 2 + 2, y, 14, tone(env, BRASS_HI, 0.1), 0.8 * Math.sin(Math.PI * st));
  }
  void withAlpha;
}
