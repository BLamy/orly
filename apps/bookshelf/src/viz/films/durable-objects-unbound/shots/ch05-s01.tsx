/**
 * ch05-s01 — the Plate opened (winterBlue, paper-fold in from the commit strip).
 *
 * Canonical HARBOUR TOWN (sets/harbourTown.ts): Houses A (screen-left) and B (screen-right) on the L3 terrace, the
 * Plate on its iron frame between and below them over the Well, badge 'workerd · 28 Oct' on the frame. A slow 6 s
 * push from the two-shot down to the Plate; later a pull back to a medium two-shot for the claim demonstration.
 * Plate tiles house · epoch · from read A · 7 · 7 (illustrative), crown lit.
 *
 *   open      0.80  the Plate's face swings forward like a watch case; the push begins
 *   (words)         'house' / 'epoch' / 'from' engrave above their tiles as they are named (the label)
 *   count    10.38  the epoch tile turns a notch and back (an odometer gesture); term tag 'epoch' (reel)
 *   opened   16.25  the crown lamp pulses once beside the from tile
 *   log      19.06  'authority': a faint scroll-shelf in the Well below lights, tied to the Plate by a brass line
 *   claim    22.02  pull back: B's keeper at the Tooth holds a swap card notched with the version it read;
 *                   on 'run out' A's sill candle burns to a stub and A's window gutters; on 'writes' the card
 *                   clicks into the Tooth and the tiles turn to B · 8 · 7 (from held, crown dark)
 *   one      31.03  'most': a second, ghost card from House C is spat back, punched
 *   route    34.34  'alive': rewind: A's candle tall, B's card stays out; a dotted line runs from B's door along
 *                   the pulley lines to A's door (the request goes to the owner)
 *   fresh    37.67  'brand-new': a fresh small plate forms beside the first with its crown ALREADY lit, in one
 *                   click; the loser's card is handed a small direction card pointing to the winner
 * Labels sit on the Plate (engraved); bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, defineShot, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { TOWN, gutter, l3ToL4, paintTown, pulleyAt } from '../sets/harbourTown';
import { BRASS_HI, camAt, clamp01, glowDot, lerp, paper, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { leaseCandle } from '../sets/leaseCandle';
import { engraved } from '../sets/neighbours';
import { plate as drawPlate, swapCard, tilePt, wellPt, WELL } from '../sets/wellAndPlate';

const ID = 'ch05-s01';
const W = TOWN.well;
const TWO: Camera3 = { x: 500, y: 400, z: 120, lens: 1 };
const PLATE: Camera3 = { x: 432, y: 448, z: 470, lens: 1 };
const MED: Camera3 = { x: 470, y: 452, z: 230, lens: 1 };
/** drifted toward A's sill while its candle runs out */
const MEDA: Camera3 = { x: 412, y: 440, z: 290, lens: 1 };
/** close on the Tooth for 'at most one claimant wins' (the slot centred, well above the caption band) */
const TOOTHC: Camera3 = { x: 472, y: 528, z: 560, lens: 1 };
const KB = { x: 552, y: W.y, scale: 0.6 };
const SLOT = wellPt({ x: W.x, y: W.y }, 'slot');
/** the fresh small plate's wellhead-equivalent anchor (plate() hangs the Plate above it) */
const FRESH = { x: 588, y: 392 + 212 * 0.5, s: 0.5 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      open: T.beat('open'),
      house: T.word('L0501', 'house'),
      epochW: T.word('L0501', 'epoch'),
      fromW: T.word('L0501', 'from'),
      count: T.beat('count'),
      opened: T.beat('opened'),
      log: T.beat('log'),
      claim: T.beat('claim'),
      offers: T.word('L0504', 'offers'),
      runout: T.word('L0504', 'run'),
      writes: T.word('L0504', 'writes'),
      one: T.beat('one'),
      route: T.beat('route'),
      fresh: T.beat('fresh'),
      born: T.word('L0505', 'born'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: TWO },
      { t: 0.7, cam: TWO },
      { t: 6.9, cam: PLATE },
      { t: b.claim - 0.6, cam: { ...PLATE, z: PLATE.z + 16 } },
      { t: b.claim + 1.8, cam: MED },
      { t: b.runout - 1.2, cam: MEDA },
      { t: b.runout + 0.9, cam: MEDA },
      { t: b.writes - 0.1, cam: MED },
      { t: b.one - 0.9, cam: TOOTHC },
      { t: b.one + 1.7, cam: { ...TOOTHC, z: TOOTHC.z + 20 } },
      { t: b.route - 0.1, cam: MED },
      { t: b.D, cam: { ...MED, x: MED.x + 8, z: MED.z + 26 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ------------------------------------------------ state
    const rewind = t >= b.route - 0.15;
    const burn = rewind ? 0 : seg(t, b.runout - 1.9, b.runout + 0.5);
    const aNow = rewind ? 2000 : lerp(5000, 19400, burn);
    const aFlame = rewind ? 1 : 1 - seg(t, b.runout + 0.3, b.runout + 0.7);
    const aLamp = rewind ? seg(t, b.route - 0.15, b.route + 0.4) : gutter(seg(t, b.runout - 0.1, b.runout + 0.8), tq);
    const click = !rewind && t >= b.writes + 0.25;
    const flipU = seg(t, b.writes + 0.25, b.writes + 0.75);
    const back = rewind ? sm((t - (b.route - 0.15)) / 0.4) : 1;
    const odo = pulse(t, b.count - 0.05, 0.25, 0.15, 0.35);
    const pl = click
      ? { house: 'B' as const, epoch: 8, from: 7, crown: 0, flip: [flipU, flipU, 1] as [number, number, number], notch: 31, notchPrev: 12, recut: flipU }
      : { house: 'A' as const, epoch: 7, from: 7, crown: rewind ? back : 1, flip: [1, odo > 0.01 ? 1 - odo * 0.5 : 1, 1] as [number, number, number], notch: 12 };
    const crownPulse = pulse(t, b.opened - 0.05, 0.25, 0.25, 0.9);
    const openFace = seg(t, b.open - 0.05, b.open + 1.0);
    // B's keeper: holds the card up on 'offers', inserts on 'writes'; in the rewind the card stays lowered
    const raise = rewind ? 0.25 : seg(t, b.offers - 0.3, b.offers + 0.4);
    const insert = rewind ? 0 : seg(t, b.writes - 0.15, b.writes + 0.3);
    const kbIn = seg(t, b.claim - 0.4, b.claim + 0.6);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: aLamp, B: 0.55, C: 0.12 },
        lanterns: [{ house: 'A', lit: aLamp * 0.9, members: 3, tq, door: 0, s: 0.5 }],
        plate: { ...pl, crown: clamp01(pl.crown * (1 + 0.6 * crownPulse)), open: openFace, captions: 0, glint: [0.2, 0.2 + 0.6 * odo, 0.25 + 0.6 * crownPulse] },
        plateLegible: true,
        tooth: { shutter: 1, pin: 1, showPin: false, flash: pulse(t, b.writes + 0.2, 0.08, 0.1, 0.5) + pulse(t, b.one + 0.2, 0.08, 0.1, 0.5), flashKind: 'click' },
        well: { bucket: 0.35, glint: 0.35 },
        badge: { text: 'workerd · 28 Oct', legible: false, glint: 0.3 },
        lampPostLit: 0.35,
      },
      {
        L3: (c, env) => {
          // sill candles: A's (tall, then a stub on 'run out', tall again in the rewind), B's (steady)
          leaseCandle(c, env, { x: TOWN.A.sill.x + 36, y: TOWN.A.sill.y + 1, s: 0.42, nowMs: aNow, flame: aFlame, relight: rewind ? pulse(t, b.route, 0.15, 0.1, 0.6) : 0, seed: 3 });
          leaseCandle(c, env, { x: TOWN.B.sill.x + 50, y: TOWN.B.sill.y + 1, s: 0.42, nowMs: 3000, seed: 5 });
        },
        L4: (c, env) => {
          // the log: a faint scroll-shelf deep in the Well, tied to the Plate by a brass line ('authority')
          const lg = seg(t, b.log - 0.2, b.log + 0.6) * (1 - seg(t, b.claim - 0.6, b.claim + 0.2));
          if (lg > 0.01) {
            const top = { x: W.x, y: W.y + WELL.plate.y + WELL.plateH / 2 + 12 };
            const shelfY = W.y - 22;
            c.save();
            c.globalAlpha *= lg;
            c.strokeStyle = withAlpha(tone(env, BRASS_HI, 0.15), 0.95);
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(top.x, top.y);
            c.lineTo(top.x, shelfY - 10);
            c.stroke();
            c.strokeStyle = withAlpha(tone(env, '#d8e4ee', 0.2), 0.95);
            c.lineWidth = 1.6;
            c.strokeRect(W.x - 46, shelfY - 8, 92, 18);
            for (let i = 0; i < 4; i++) {
              c.beginPath();
              c.ellipse(W.x - 32 + i * 21, shelfY + 1, 8, 4, 0, 0, Math.PI * 2);
              c.stroke();
            }
            c.restore();
            glowDot(c, W.x, shelfY, 50, tone(env, '#cfe3f2', 0.2), 0.25 * lg);
          }
          // B's keeper at the Tooth with a notched swap card (the version it read)
          if (kbIn > 0.01) {
            const pose = raise > 0.5 ? POSES.present : POSES.stand;
            const o = { x: KB.x, y: KB.y, facing: 'left' as const, pose, scale: KB.scale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM };
            c.save();
            c.globalAlpha *= kbIn;
            cast['keeper-b'].draw(c, o, env);
            const hand = cast['keeper-b'].anchor(o, 'handF');
            const held = { x: hand.x - 4, y: hand.y - 6 };
            if (!click || rewind) {
              const p = { x: lerp(held.x, SLOT.x + 8, insert), y: lerp(held.y, SLOT.y, insert) };
              swapCard(c, env, { x: p.x, y: p.y, s: 0.75, house: 'B', notch: 12, rot: lerp(-0.3, 0, insert), glint: 0.3 * raise });
            }
            c.restore();
          }
          // a second claimant's card (a ghost, from House C) is spat back, punched ('at most one wins')
          const g1 = seg(t, b.one - 0.7, b.one - 0.05);
          const g2 = seg(t, b.one + 0.35, b.one + 1.3);
          if (!rewind && g1 > 0) {
            // C's card arrives at the slot after B's has won: the pawl refuses it, punches it, and spits it back out
            const x = lerp(SLOT.x + 96, SLOT.x + 12, g1) + g2 * 54;
            const y = lerp(SLOT.y - 58, SLOT.y - 2, g1) - g2 * 30;
            swapCard(c, env, { x, y, s: 1.05, house: 'C', notch: 12, rot: -0.25 * g2, punched: seg(t, b.one + 0.05, b.one + 0.25), alpha: 0.95 * (1 - seg(t, b.route - 1.2, b.route - 0.3)) });
            glowDot(c, SLOT.x + 10, SLOT.y, 24, tone(env, '#f0b090', 0.15), 0.6 * pulse(t, b.one + 0.1, 0.06, 0.12, 0.5));
          }
          // the request goes to the owner: a dotted line from B's door along the pulley lines to A's door
          const rt = rewind ? seg(t, b.route + 0.05, b.route + 1.8) * (1 - seg(t, b.fresh - 0.3, b.fresh + 0.4) * 0.7) : 0;
          if (rt > 0) {
            const pts: { x: number; y: number }[] = [];
            const bd = l3ToL4(cam, { x: TOWN.B.door.x, y: TOWN.B.door.y + 10 });
            const ad = l3ToL4(cam, { x: TOWN.A.door.x, y: TOWN.A.door.y + 10 });
            pts.push(bd);
            for (let i = 0; i <= 20; i++) pts.push(pulleyAt(cam, 'B', i / 20));
            for (let i = 20; i >= 0; i--) pts.push(pulleyAt(cam, 'A', i / 20));
            pts.push(ad);
            dottedPath(c, pts, rt, withAlpha(tone(env, '#f2dca0', 0.15), 0.95), 2.2, 9);
          }
          // a brand-new room: a fresh small plate forms beside the first, its crown already lit, in one click
          const fr = seg(t, b.fresh - 0.1, b.fresh + 0.25);
          if (fr > 0) {
            const top = wellPt(FRESH, 'plate');
            c.strokeStyle = env.fill('ink');
            c.lineWidth = 2.5;
            c.beginPath();
            c.moveTo(W.x + WELL.plateW / 2 + 10, W.y + WELL.plate.y + 4);
            c.lineTo(top.x - 30, top.y - 8);
            c.stroke();
            drawPlate(c, env, { ...FRESH, plate: { house: 'C', epoch: 1, from: 1, crown: fr, alpha: fr }, legible: false });
            glowDot(c, top.x, top.y, 50, tone(env, BRASS_HI, 0.1), 0.6 * pulse(t, b.fresh + 0.05, 0.08, 0.1, 0.6));
            // the loser's card, handed a small direction card pointing to the winner
            const lc = seg(t, b.fresh + 0.3, b.fresh + 0.9);
            if (lc > 0) {
              const lx = top.x + 74, ly = top.y + 76;
              swapCard(c, env, { x: lx, y: ly, s: 0.6, house: 'B', notch: null, punched: 1, rot: 0.15, alpha: 0.6 * lc });
              const dk = seg(t, b.born - 0.3, b.born + 0.3);
              c.save();
              c.globalAlpha *= dk;
              c.translate(lx - 4, ly - 22);
              c.rotate(-2.2);
              c.fillStyle = paper(env, 0.05);
              c.beginPath();
              c.moveTo(-12, -5);
              c.lineTo(6, -5);
              c.lineTo(6, -9);
              c.lineTo(16, 0);
              c.lineTo(6, 9);
              c.lineTo(6, 5);
              c.lineTo(-12, 5);
              c.closePath();
              c.fill();
              c.restore();
            }
          }
          // engraved captions over the tiles, each as it is named (the shot's label 'house · epoch · from')
          const capOut = 1 - seg(t, b.claim - 0.3, b.claim + 0.3);
          const names = [['house', b.house], ['epoch', b.epochW], ['from', b.fromW]] as const;
          names.forEach(([name, at], i) => {
            const a = seg(t, at - 0.2, at + 0.3) * capOut;
            if (a <= 0.01) return;
            const p = tilePt({ x: W.x, y: W.y }, i);
            const y = p.y - WELL.plateH / 2 - 10;
            c.fillStyle = withAlpha(env.fill('ink'), 0.92 * a);
            c.fillRect(p.x - 23, y - 12, 46, 15);
            // (unprobed: the recorder reads the engraved row as one line of text)
            engraved(c, env, name, p.x, y, 9.5, { legible: true, alpha: a, color: tone(env, BRASS_HI, 0.25) });
          });
        },
      },
    );
    void toLayer;
    void toScreen;
    void LAYERS;
  },
});

/** a dotted line along a polyline, drawn to fraction u */
function dottedPath(c: CanvasRenderingContext2D, pts: { x: number; y: number }[], u: number, col: string, r: number, gap: number): void {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = L[L.length - 1] * clamp01(u);
  c.save();
  c.fillStyle = col;
  let seg = 0;
  for (let d = 0; d <= total; d += gap) {
    while (seg < L.length - 2 && L[seg + 1] < d) seg++;
    const k = (d - L[seg]) / Math.max(1e-6, L[seg + 1] - L[seg]);
    const x = lerp(pts[seg].x, pts[seg + 1].x, k), y = lerp(pts[seg].y, pts[seg + 1].y, k);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
