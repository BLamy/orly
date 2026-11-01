/**
 * ch07-s03 — celld's town (illustrative), labGreen: the fleet's first principle (lampChange in, completed by the reel).
 *
 * Same terrace (geography lock), re-lamped: badge 'celld 0.6.3' on the wellhead, celld's plain Plate (no candle
 * scale, no workerd numbers). House A is the owner (its lantern the warm practical); copyist-1 at a desk in B's upper
 * window, copyist-2 in C's dormer window, each with a notebook and a book press (fsync).
 *
 *   badge   1.85  the camera pushes past the wellhead badge 'celld 0.6.3' (legible while it is named)
 *   hands   7.75  one committed page leaves A's sill along the two neighbour cords; each copy climbs to its copyist,
 *                 who copies it into the notebook's newest line (the camera pulls back to all three houses, then
 *                 pushes into B's upper window)
 *   press  11.11  copyist-1 turns the press a full turn; the platen locks with its brass tab
 *   term   16.68  (reel: 'fsync') the camera has crossed to C's dormer: copyist-2 presses the same way
 *   every  18.05  both tabs glow (pull back to the three houses)
 *   bell   20.89  only now A's bell swings: the lantern's latch lifts and #42's tick lands at the sender's window,
 *                 while the scroll for that page still waits on A's sill
 *   upload 23.78  the scroll rolls down A's pulley line into the Well; hold on the two pressed notebooks
 * Truck A → B under 5 % width/s on the terrace plane; L1–L6 slide against each other. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, defineShot } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { TOWN, l3ToL4, paintTown, pulleyAt } from '../sets/harbourTown';
import { camAt, clamp01, cordAt, lerp, paper, pulse, seg, slip, twos, type CamKey } from '../sets/common';
import { bellSwing, houseBell } from '../sets/heldLetter';
import { scroll } from '../sets/walRibbon';
import { A_BELL, CELLD_TINT, copyistWindow, riser, riserAt, tabGlint } from '../sets/ch07-s03-celldTown';

const ID = 'ch07-s03';
const START: Camera3 = { x: 468, y: 432, z: 230, lens: 1 };
const BADGE: Camera3 = { x: 448, y: 448, z: 330, lens: 1 };
const WIDE: Camera3 = { x: 600, y: 396, z: 120, lens: 1 };
/** into B's upper window (copyist-1 at the press) */
const ON_B: Camera3 = { x: 806, y: 382, z: 860, lens: 1 };
/** both copyists' windows, B lower-left, C's dormer upper-right */
const BOTH: Camera3 = { x: 988, y: 318, z: 890, lens: 1 };
/** A's sill, bell and lantern door with the pulley line and the wellhead in one medium (cut in on the bell) */
const A_MED: Camera3 = { x: 262, y: 412, z: 520, lens: 1 };
const END: Camera3 = { x: 318, y: 440, z: 480, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      badge: T.beat('badge'),
      hands: T.beat('hands'),
      press: T.beat('press'),
      term: T.beat('term'),
      every: T.beat('every'),
      bell: T.beat('bell'),
      upload: T.beat('upload'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: START },
      { t: b.badge + 1.4, cam: BADGE },
      { t: 4.2, cam: BADGE },
      { t: b.hands - 0.1, cam: WIDE },
      { t: b.hands + 0.85, cam: WIDE },
      { t: b.press - 0.1, cam: ON_B },
      { t: 12.8, cam: { ...ON_B, z: ON_B.z + 8 } },
      { t: b.term - 0.5, cam: BOTH },
      { t: b.every + 0.35, cam: { ...BOTH, z: BOTH.z + 6 } },
      { t: b.bell - 0.36, cam: { ...BOTH, z: BOTH.z + 12 } },
      // cut on the bell to A's medium
      { t: b.bell - 0.35, cam: A_MED },
      { t: b.upload + 0.2, cam: { ...A_MED, x: A_MED.x + 8, z: A_MED.z + 10 } },
      { t: b.D, cam: END },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ---- the page's journey: A's sill → both cords → up each riser → the copyists
    const toB = clamp01((tq - b.hands) / 1.4), toC = clamp01((tq - b.hands) / 1.7);
    const upB = clamp01((tq - (b.hands + 1.45)) / 0.5), upC = clamp01((tq - (b.hands + 1.75)) / 0.5);
    const copyB = seg(t, b.hands + 2.0, b.hands + 3.0), copyC = seg(t, b.hands + 2.3, b.hands + 3.3);
    // ---- the presses (on twos: a full turn each), then the lock tabs
    const turnB = clamp01((tq - b.press) / 1.3), turnC = clamp01((tq - b.term) / 1.2);
    const lockB = seg(t, b.press + 1.3, b.press + 1.6), lockC = seg(t, b.term + 1.2, b.every + 0.2);
    const both = seg(t, b.every, b.every + 0.5);
    // ---- the bell, the latch, the tick; the scroll waits on the sill until the upload
    const bellA = bellSwing(t, b.bell, 0.55);
    const ring = pulse(t, b.bell, 0.15, 0.4, 1.2);
    const latch = seg(t, b.bell + 0.25, b.bell + 0.75);
    const tick = clamp01((tq - (b.bell + 0.7)) / 0.5);
    const scrollOn = seg(t, b.hands + 0.4, b.hands + 1.0);
    const down = clamp01((tq - b.upload) / 1.5);
    const bucket = down < 1 ? 0.3 : lerp(0.3, 0.95, seg(t, b.upload + 1.5, b.upload + 2.2));
    const badgeClose = seg(t, b.badge - 0.3, b.badge + 0.4) * (1 - seg(t, 4.6, 5.4));

    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        variant: 'celld',
        lamps: { A: 1, B: 0.1, C: 0.1, Bup: 1, Cup: 1 },
        lampTint: { A: '#efcf8a', Bup: CELLD_TINT, Cup: CELLD_TINT, B: CELLD_TINT, C: CELLD_TINT },
        lanterns: [{ house: 'A', lit: 1 + 0.2 * ring, members: 4, tq, door: latch, colour: 'green', slips: [{ x: 0.25, y: 0.42, tick }] }],
        plate: { house: 'A', epoch: '', from: '', crown: 0.35, dim: 0.35 },
        tooth: null,
        well: { bucket, load: down > 0.98 ? 'scroll' : 'none', glint: 0.4 },
        badge: { text: 'celld 0.6.3', legible: badgeClose > 0.5, glint: pulse(t, b.badge, 0.2, 0.4, 0.8) },
        lampPostLit: 0.35,
      },
      {
        L3back: (c, env) => {
          copyistWindow(c, env, 'B', {
            tq,
            notebook: { band: 'complete', lines: 4 + lockB, newest: copyB * (1 - lockB) },
            press: { turn: turnB, locked: lockB },
            writing: copyB * (1 - seg(t, b.hands + 3.0, b.hands + 3.3)),
            pressing: seg(t, b.press - 0.25, b.press) * (1 - seg(t, b.press + 1.3, b.press + 1.7)),
          });
          copyistWindow(c, env, 'C', {
            tq,
            notebook: { band: 'complete', lines: 4 + lockC, newest: copyC * (1 - lockC) },
            press: { turn: turnC, locked: lockC },
            writing: copyC * (1 - seg(t, b.hands + 3.3, b.hands + 3.6)),
            pressing: seg(t, b.term - 0.25, b.term) * (1 - seg(t, b.term + 1.2, b.term + 1.6)),
          });
        },
        L3: (c, env) => {
          // the risers (sill → upper window) and the page's last hop
          riser(c, env, 'B', 1);
          riser(c, env, 'C', 1);
          for (const [h, u] of [['B', upB], ['C', upC]] as const) {
            if (u <= 0 || u >= 1) continue;
            const p = riserAt(h, u);
            c.fillStyle = paper(env, 0.05);
            c.fillRect(p.x - 3, p.y - 4, 6, 8);
          }
          // the press tabs glow when both are locked (they are small at this distance)
          tabGlint(c, env, 'B', lockB * (0.35 + 0.65 * both));
          tabGlint(c, env, 'C', lockC * (0.35 + 0.65 * both));
          houseBell(c, env, { ...A_BELL, s: 1.15, swing: bellA, ring });
          // #42's slip inside the lantern takes its tick as the latch lifts (large enough to read in the medium)
          slip(c, env, { x: TOWN.A.main.x + 4, y: TOWN.A.main.y - 4, w: 40, rot: -0.08, tick, alpha: seg(t, b.bell - 0.5, b.bell - 0.2) });
        },
        L4back: (c, env) => {
          cast.sender.draw(c, { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } }, env);
        },
        L4: (c, env) => {
          // one committed page, riding both neighbour cords (never the Well's line)
          const a = l3ToL4(cam, TOWN.A.sill);
          for (const [h, u] of [['B', toB], ['C', toC]] as const) {
            if (u <= 0 || u >= 1) continue;
            const e = l3ToL4(cam, TOWN[h].sill);
            const p = cordAt(a.x, a.y, e.x, e.y, 22, u);
            c.fillStyle = paper(env, 0.02);
            c.fillRect(p.x - 8, p.y - 20, 16, 19);
          }
          // the scroll for that page, waiting on A's sill, then down the pulley line into the Well
          if (scrollOn > 0.01 && down < 1) {
            const p = pulleyAt(cam, 'A', down);
            scroll(c, env, { x: p.x + 2, y: p.y + 6, s: 0.95, rot: 0.25 * down, alpha: scrollOn, tag: 1, glint: pulse(t, b.bell + 0.9, 0.2, 0.6, 0.8) });
          }
          // #42's tick lands at the sender's window
          const phone = cast.sender.anchor({ x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale }, 'handF');
          slip(c, env, { x: phone.x - 18, y: phone.y - 24, w: 26, rot: -0.12, tick, alpha: 0.95 });
        },
      },
    );
  },
});
