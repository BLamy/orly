/**
 * ch07-s04 — celld's town (illustrative) in failure light: the tail outside the Well, and the pin (lampChange in to
 * emberRed; the hand reseats the pin and the grade returns to labGreen).
 *
 *   dies     4.58   A's window gutters out, its lantern with it; #42's page lives only as the newest pressed line in the
 *                   copyists' notebooks (B's and C's upper windows); the Well holds nothing of it
 *   pull     8.29   the demonstrator's hand (lower right) draws the red-tagged pin from the neighbours' wax-seal stamp
 *                   on B's facade; the stamp swings slack (no seal will be pressed)
 *   shelves 11.63   crane down into the Well's side: shelf 7 above, shelf 8 below (illustrative); label (upper right)
 *   (stale) 14.25   a ghost of A's keeper sets a late scroll on shelf 7 only
 *   fence   17.29   'never to the new owner's': the successor's lamp passes along shelf 8, untouched
 *   fetch   21.64   crane back up: C restores from the Well alone (a Book rides up C's pulley line)
 *   gone    25.63   the room relights in C's window without #42's page: the slip in the lantern loses its tick
 *   asleep  28.05   rewind: A's lamp flickers back (paused, not dead); it sends its next page; both copyists, unsealed,
 *                   press it
 *   stale   30.40   A's bell rings once more, sour, for a room it no longer owns
 *   back    31.61   the hand reseats the pin; the grade returns toward labGreen; A gutters back out
 *   record  37.79   a brass record tile is created on the wellhead's right hook, its shutter falling after it
 * One text item: 'Epoch shelves fence the Well, not the tail'. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, addPose, defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast, MOON_LIGHT } from '../cast';
import { TOWN, gutter, l3ToL4, paintTown, pulleyAt } from '../sets/harbourTown';
import { camAt, clamp01, cordAt, glowDot, label, lerp, paper, pulse, seg, slip, tone, twos, type C2, type CamKey } from '../sets/common';
import { bellSwing, houseBell } from '../sets/heldLetter';
import { book, scroll } from '../sets/walRibbon';
import { epochShelf } from '../sets/wellCutaway';
import { recordTile } from '../sets/neighbours';
import { WELL } from '../sets/wellAndPlate';
import { demonstratorHand } from '../sets/demonstratorHand';
import type { PaintEnv } from '../../../film';
import { A_BELL, CELLD_TINT, copyistWindow, nearRail, riser, sealPinAt, sealStamp } from '../sets/ch07-s03-celldTown';

const ID = 'ch07-s04';
const WIDE0: Camera3 = { x: 660, y: 400, z: 190, lens: 1 };
const MED_B: Camera3 = { x: 640, y: 410, z: 330, lens: 1 };
const DEEP: Camera3 = { x: 440, y: 716, z: 270, lens: 1 };
const WIDE: Camera3 = { x: 680, y: 398, z: 210, lens: 1 };
const AT_WELL: Camera3 = { x: 478, y: 470, z: 420, lens: 1 };
/** close on C's window: the room relights without #42 */
const ON_C2: Camera3 = { x: 1205, y: 372, z: 640, lens: 1 };
/** A's sill and sour bell with B's facade (the seal stamp) and B's copyist in one medium */
const A_B: Camera3 = { x: 450, y: 399, z: 380, lens: 1 };

/** the cutaway under the wellhead (L4) */
const SHAFT = { x0: 270, x1: 594, y0: 616, y1: 960 };
const SHELF7 = { x: 296, y: 694, w: 184 };
const SHELF8 = { x: 296, y: 838, w: 184 };
const LEDGE = { x0: 488, x1: 594, y: 768 };
const LATE_AT = { x: SHELF7.x + 22 + 120 + 18, y: SHELF7.y - 7 };

function cutaway(c: C2, env: PaintEnv, a: number): void {
  if (a <= 0.01) return;
  const ink = env.fill('ink');
  c.save();
  c.globalAlpha *= a;
  // the section's back wall, lit from below by the Well's water
  const g = c.createLinearGradient(0, SHAFT.y0, 0, SHAFT.y1);
  g.addColorStop(0, mixLab(env.fill('set'), env.mood.haze, 0.25));
  g.addColorStop(0.7, mixLab(env.fill('set'), env.mood.haze, 0.45));
  g.addColorStop(1, mixLab(env.fill('set'), env.mood.halo, 0.35));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(SHAFT.x0, SHAFT.y0);
  for (let y = SHAFT.y0; y <= SHAFT.y1; y += 14) c.lineTo(SHAFT.x0 + Math.sin(y * 0.11) * 4, y);
  for (let y = SHAFT.y1; y >= SHAFT.y0; y -= 14) c.lineTo(SHAFT.x1 + Math.sin(y * 0.13 + 1) * 4, y);
  c.closePath();
  c.fill();
  // stone courses
  c.strokeStyle = withAlpha(env.fill('rim'), 0.08);
  c.lineWidth = 1;
  for (let y = SHAFT.y0 + 30; y < SHAFT.y1; y += 30) {
    c.beginPath();
    c.moveTo(SHAFT.x0 + 4, y);
    c.lineTo(SHAFT.x1 - 4, y);
    c.stroke();
    for (let x = SHAFT.x0 + ((y / 30) % 2) * 34 + 20; x < SHAFT.x1; x += 68) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - 30);
      c.stroke();
    }
  }
  // the cut edges catch the light
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1.4;
  for (const [x0, ph] of [[SHAFT.x0, 0], [SHAFT.x1, 1]] as const) {
    c.beginPath();
    for (let y = SHAFT.y0; y <= SHAFT.y1; y += 14) {
      const x = x0 + Math.sin(y * (ph ? 0.13 : 0.11) + ph) * 4;
      if (y === SHAFT.y0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // the ledge the ghost stands on
  c.fillStyle = ink;
  c.fillRect(LEDGE.x0, LEDGE.y, LEDGE.x1 - LEDGE.x0, 9);
  // the rope down the middle of the shaft
  c.strokeStyle = withAlpha(ink, 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(432 + 2, SHAFT.y0);
  c.lineTo(432 + 2, SHAFT.y1);
  c.stroke();
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      dies: T.beat('dies'),
      pull: T.beat('pull'),
      shelves: T.beat('shelves'),
      fence: T.beat('fence'),
      fetch: T.beat('fetch'),
      gone: T.beat('gone'),
      asleep: T.beat('asleep'),
      stale: T.beat('stale'),
      back: T.beat('back'),
      record: T.beat('record'),
      staleW: T.word('L0722', 'stale'),
      oldShelf: T.word('L0722', 'old'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE0 },
      { t: 4.4, cam: { ...WIDE0, z: WIDE0.z + 20 } },
      { t: b.pull - 0.5, cam: MED_B },
      { t: b.pull + 0.9, cam: { ...MED_B, z: MED_B.z + 6 } },
      { t: b.staleW - 0.3, cam: DEEP },
      { t: 19.4, cam: { ...DEEP, z: DEEP.z + 16 } },
      { t: 22.6, cam: WIDE },
      { t: b.gone - 0.3, cam: ON_C2 },
      { t: b.asleep - 0.31, cam: { ...ON_C2, z: ON_C2.z + 12 } },
      // cut on the rewind to A and B
      { t: b.asleep - 0.3, cam: A_B },
      { t: b.back + 1.6, cam: { ...A_B, z: A_B.z + 14 } },
      { t: b.record - 0.3, cam: AT_WELL },
      { t: b.D, cam: { ...AT_WELL, z: AT_WELL.z + 18 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ---- the grade: back toward labGreen after the pin is reseated (quantised: bounded bakes)
    const toGreen = Math.round(seg(t, b.back, b.back + 2.6) * 25) / 25;
    if (toGreen > 0) f.setMood('labGreen', { from: 'emberRed', u: toGreen });
    // ---- A: dies, wakes (asleep), gutters back after the pin
    const dieU = clamp01((tq - b.dies) / 1.3);
    const wake = clamp01((tq - b.asleep) / 0.6);
    const reDie = clamp01((tq - (b.back + 1.2)) / 1.2);
    let lampA = gutter(dieU, tq);
    if (wake > 0) lampA = (wake < 1 ? wake * (Math.sin(tq * 47) > 0 ? 1 : 0.3) : 1) * 0.85 * gutter(reDie, tq);
    const lanternA = t < b.asleep ? gutter(dieU, tq) : 0.55 * lampA;
    // ---- the pin: drawn on 'pull', reseated on 'back'
    const pinOut = t < b.back ? clamp01((tq - b.pull) / 0.6) : 1 - clamp01((tq - (b.back + 0.25)) / 0.5);
    const handIn = t < b.back - 1 ? seg(tq, b.pull - 1.0, b.pull - 0.1) * (1 - seg(tq, b.pull + 0.9, b.pull + 1.7)) : seg(tq, b.back - 0.6, b.back + 0.2) * (1 - seg(tq, b.back + 0.9, b.back + 1.7));
    const carrying = (t >= b.pull && t < b.back + 0.75);
    // ---- the cutaway and the shelves
    const cutA = seg(t, b.pull + 0.8, b.shelves - 0.2) * (1 - seg(t, 22.6, 24.4));
    const ghostA = seg(t, b.staleW - 0.4, b.staleW + 0.3) * (1 - seg(t, b.fence + 0.6, b.fence + 1.6));
    const placeU = seg(t, b.oldShelf - 0.3, b.oldShelf + 0.5);
    const sweep = seg(t, b.fence - 0.1, b.fence + 1.6);
    const sweepA = pulse(t, b.fence - 0.1, 0.3, 1.1, 0.6);
    const label1 = seg(t, b.shelves - 0.1, b.shelves + 0.4) * (1 - seg(t, 23.4, 24.0));
    // ---- C's restore from the Well alone; the room relights without #42
    const rise = clamp01((tq - (b.fetch - 1.4)) / 1.6);
    const climb = clamp01((tq - (b.fetch + 0.4)) / 2.0);
    const litC = seg(t, b.fetch + 2.3, b.fetch + 2.9);
    const lostTick = seg(t, b.gone - 0.1, b.gone + 0.6);
    // ---- the stale wake: next page along both cords; unsealed copyists press it; the sour bell
    const ridePage = clamp01((tq - (b.asleep + 0.6)) / 0.8);
    const turn2 = clamp01((tq - (b.asleep + 1.45)) / 0.5);
    const lock2 = seg(t, b.asleep + 1.95, b.asleep + 2.15);
    const swing = bellSwing(t, b.stale, 0.55);
    const ring = pulse(t, b.stale, 0.15, 0.4, 1.0);
    // ---- celld's plain Plate (house letter only; no workerd epoch/from tiles): A → C claims → C opens
    const claimU = clamp01((tq - (b.fetch - 0.6)) / 0.5);
    const openU = clamp01((tq - (b.fetch + 2.6)) / 0.5);
    // ---- the record tile
    const created = seg(t, b.record - 0.25, b.record + 0.25);
    const shutter = seg(t, b.record + 0.35, b.record + 0.8);

    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        variant: 'celld',
        skip: { L5: true },
        lamps: { A: lampA, B: 0.1, C: 0.1 + 0.9 * litC, Bup: 1, Cup: 1 },
        lampTint: { A: '#efcf8a', Bup: CELLD_TINT, Cup: CELLD_TINT, B: CELLD_TINT, C: '#efcf8a' },
        lanterns: [
          { house: 'A', lit: lanternA, members: 4 * (t < b.asleep ? 1 : 0), tq, door: 0, colour: t < b.asleep ? 'green' : 'cold', alpha: t < b.asleep ? Math.max(0.25, lanternA) : 0.8 * lampA },
          { house: 'C', lit: litC, members: 4 * litC, tq, door: 0, colour: 'green', alpha: 0.3 + 0.7 * litC, slips: [{ x: 0.2, y: 0.45, tick: 1 - lostTick, alpha: litC }] },
        ],
        plate: claimU <= 0
          ? { house: 'A', epoch: '', from: '', crown: 0.35 * lanternA, dim: 0.4 }
          : { house: 'C', epoch: '', from: '', crown: 0.35 + 0.35 * openU, dim: 0.4, flip: [claimU, 1, 1] },
        tooth: null,
        well: { bucket: t < b.fetch - 1.4 ? 0.25 : rise < 1 ? lerp(0.95, 0.2, rise) : 0.25, load: 'none', glint: 0.25 },
        badge: { text: 'celld 0.6.3', legible: false },
        lampPostLit: 0.3,
      },
      {
        L3back: (c, env) => {
          copyistWindow(c, env, 'B', { tq, notebook: { band: 'complete', lines: 5 + lock2, newest: 1 }, press: { turn: t > b.asleep ? turn2 : 1, locked: t > b.asleep + 1 ? lock2 : 1 }, pressing: seg(t, b.asleep + 1.2, b.asleep + 1.45) * (1 - seg(t, b.asleep + 1.95, b.asleep + 2.3)) });
          copyistWindow(c, env, 'C', { tq, notebook: { band: 'complete', lines: 5 + lock2, newest: 1 }, press: { turn: t > b.asleep ? turn2 : 1, locked: t > b.asleep + 1 ? lock2 : 1 }, pressing: seg(t, b.asleep + 1.2, b.asleep + 1.45) * (1 - seg(t, b.asleep + 1.95, b.asleep + 2.3)) });
        },
        L3: (c, env) => {
          riser(c, env, 'B', 1);
          riser(c, env, 'C', 1);
          sealStamp(c, env, { pin: 1 - pinOut, pinOut, slack: pinOut, pinShown: !carrying });
          houseBell(c, env, { ...A_BELL, s: 1.25, swing, ring, sour: true });
          // the room in C's window: #42's slip loses its tick (large enough to read close on C)
          slip(c, env, { x: TOWN.C.main.x + 4, y: TOWN.C.main.y - 6, w: 40, rot: -0.06, tick: 1 - lostTick, alpha: litC });
          if (lostTick > 0.01 && lostTick < 1) glowDot(c, TOWN.C.main.x + 14, TOWN.C.main.y - 8, 18, tone(env, '#f0e0b0', 0.1), 0.5 * Math.sin(Math.PI * lostTick));
        },
        L4back: (c, env) => {
          cast.sender.draw(c, { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } }, env);
        },
        L4: (c, env) => {
          // ---- the Well's side, opened
          cutaway(c, env, cutA);
          if (cutA > 0.01) {
            c.save();
            c.globalAlpha *= cutA;
            epochShelf(c, env, { ...SHELF7, label: '7', items: [{ kind: 'book' }, { kind: 'scroll', tag: 1 }, { kind: 'scroll', tag: 1 }] });
            epochShelf(c, env, { ...SHELF8, label: '8', items: [{ kind: 'book' }] });
            // the late scroll: carried by the ghost, then laid at the end of shelf 7 (shelf 8 never touched)
            const ghostFeet = { x: 548, y: LEDGE.y };
            const pose = addPose(POSES.present, { shoulderF: 30 * (1 - placeU), elbowF: -20 });
            const o = { x: ghostFeet.x, y: ghostFeet.y, facing: 'left' as const, pose, scale: 0.36, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT };
            const hand = cast['keeper-a'].anchor(o, 'handF');
            if (ghostA > 0.01) {
              c.save();
              c.globalAlpha *= 0.42 * ghostA;
              cast['keeper-a'].draw(c, o, env);
              c.restore();
            }
            const sx = lerp(hand.x, LATE_AT.x, placeU), sy = lerp(hand.y, LATE_AT.y, placeU);
            const lateA = placeU > 0.99 ? 1 : ghostA;
            scroll(c, env, { x: sx, y: sy, s: 0.85, tint: 'ghost', tag: 1, alpha: lateA });
            // the successor's lamp passes along shelf 8: untouched
            if (sweepA > 0.01) glowDot(c, lerp(SHELF8.x, SHELF8.x + SHELF8.w, sweep), SHELF8.y - 22, 60, tone(env, '#ffcf7a', 0.1), 0.55 * sweepA);
            // the Book rising up the shaft for C's restore
            if (t > b.fetch - 1.6 && rise < 1) book(c, env, { x: 436, y: lerp(SHELF7.y - 4, SHAFT.y0 - 20, rise), s: 0.8 });
            c.restore();
          }
          // the Book climbing C's pulley line (from the wellhead to C)
          if (climb > 0 && climb < 1) {
            const p = pulleyAt(cam, 'C', 1 - climb);
            book(c, env, { x: p.x, y: p.y + 14, s: 0.5 });
          }
          // the stale page riding both cords to the copyists
          if (ridePage > 0 && ridePage < 1) {
            const a = l3ToL4(cam, TOWN.A.sill);
            for (const h of ['B', 'C'] as const) {
              const e = l3ToL4(cam, TOWN[h].sill);
              const p = cordAt(a.x, a.y, e.x, e.y, 22, ridePage);
              c.fillStyle = paper(env, 0.02);
              c.fillRect(p.x - 8, p.y - 20, 16, 19);
            }
          }
          // the record tile on the wellhead's right hook (created only if none exists; shutter falls after)
          if (created > 0.01) {
            const hk = { x: TOWN.well.x + WELL.hookR.x + 7, y: TOWN.well.y + WELL.hookR.y + 4 };
            recordTile(c, env, { x: hk.x, y: hk.y, s: 1.1, state: 'open', created, shutter });
            glowDot(c, hk.x, hk.y + 10, 30, tone(env, '#f0d48a', 0.1), 0.4 * pulse(t, b.record, 0.2, 0.4, 1.2));
          }
          // the demonstrator's hand (lower right) at the stamp's pin
          if (handIn > 0.001) {
            const tip = l3ToL4(cam, sealPinAt(pinOut));
            demonstratorHand(c, env, { tip, reach: handIn, shape: 'pinch', s: 0.62, angle: -1.22, holding: carrying ? 'pin' : 'none', rim: { x: -0.7, y: -0.7 } });
          }
        },
      },
    );
    nearRail(f, cams.map((k) => k.cam), ID);
    label(f.c, f.mood, { id: `${ID}-fence`, text: 'Epoch shelves fence the Well, not the tail', x: 1220, y: 92, align: 'right', alpha: label1 });
  },
});
