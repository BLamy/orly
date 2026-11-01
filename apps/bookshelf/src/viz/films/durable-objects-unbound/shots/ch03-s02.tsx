/**
 * ch03-s02 — PULL THE PIN: the naive race (emberRed, lampChange in). The square, tight on the Well and the Plate
 * (sets/harbourTown.ts): the Plate's tiles BLANK; Houses A (left) and B (right) dark on the terrace; at the wellhead
 * the Tooth with its red-tagged pin (sets/wellAndPlate.ts); the demonstrator's hand from the lower RIGHT
 * (sets/demonstratorHand.ts). Badge 'Amazon S3' on the wellhead's right hook (art).
 *
 *   pull      push in on the Tooth: the hand pinches the red tag and draws the pin out; the pawl drops slack
 *   read      both keepers, arrived from either side, look up at the blank Plate together
 *   write     each slides a brass card into the unguarded slot: the first tile stamps 'A', then 'B' over it;
 *             label 'no condition: both write, both serve'
 *   both      both windows light, a Room Lantern in each: two copies of the room; slips drift into both
 *   wins      the first tile settles on 'B' (a glint)
 *   served    a ticked slip leaves A's lantern for the sender's window: A has already promised
 *   maxim     push in on the Plate reading B beside A's still-lit window
 *   gap       an ink diagram upper-left: the read, the write, and a gap where another card slips in;
 *             label 'read … then write: a gap'
 *   reseat    'Pin back': the hand reseats the pin, the pawl snaps tight, both lanterns gutter out and the grade
 *             lamp-changes back toward winterBlue
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, walkTo, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { BRASS_HI, badge, camAt, clamp01, glowDot, label, lerp, seg, slip, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, gutter, l3ToL4, paintTown } from '../sets/harbourTown';
import { WELL, swapCard } from '../sets/wellAndPlate';
import { demonstratorHand, handReach } from '../sets/demonstratorHand';
import { SPECS, cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { PUPPET_NEAR_BLACK } from '../../../film';
import { keeper, keeperHand, type KeeperOpts } from '../sets/ch03-s01-square';

const ID = 'ch03-s02';
const W = TOWN.well;
const SLOT = { x: W.x + WELL.slot.x, y: W.y + WELL.slot.y };
const PIN = { x: SLOT.x + 18, y: SLOT.y - 6 };
const KS = 0.56;
const AX = 336, BX = 534;

const WIDE: Camera3 = { x: 520, y: 404, z: 210, lens: 1 };
const TOOTH: Camera3 = { x: 486, y: 520, z: 520, lens: 1 };
const RACE: Camera3 = { x: 500, y: 420, z: 270, lens: 1 };
const MAXIM: Camera3 = { x: 372, y: 388, z: 400, lens: 1 };
const RESEAT: Camera3 = { x: 486, y: 486, z: 440, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      pull: T.beat('pull'),
      read: T.beat('read'),
      write: T.beat('write'),
      both: T.beat('both'),
      wins: T.beat('wins'),
      served: T.beat('served'),
      maxim: T.beat('maxim'),
      gap: T.beat('gap'),
      reseat: T.beat('reseat'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE },
      { t: 4.4, cam: { ...WIDE, x: WIDE.x - 6, z: WIDE.z + 20 } },
      { t: b.pull - 1.0, cam: TOOTH },
      { t: b.pull + 1.4, cam: { ...TOOTH, z: TOOTH.z + 10 } },
      { t: b.read - 1.0, cam: RACE },
      { t: b.served + 0.9, cam: { ...RACE, x: RACE.x + 40, z: RACE.z - 30 } },
      { t: b.maxim + 0.6, cam: MAXIM },
      { t: b.gap - 1.6, cam: { ...MAXIM, x: MAXIM.x + 6, z: MAXIM.z + 16 } },
      { t: b.gap + 0.8, cam: RACE },
      { t: b.reseat - 0.4, cam: RESEAT },
      { t: b.D, cam: { ...RESEAT, z: RESEAT.z - 30 } },
    ];
    const walkA = walkTo(SPECS['keeper-a'], { x0: -80, x1: AX, at: b.pull - 2.4, scale: KS });
    const walkB = walkTo(SPECS['keeper-b'], { x0: 1130, x1: BX, at: b.pull - 3.0, scale: KS });
    return { tl, b, cams, walkA, walkB };
  },
  paint(f, _s, sc) {
    const { b, cams, walkA, walkB } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // the return to winterBlue after the pin is back (quantised grade steps)
    const back = seg(t, b.reseat + 0.2, b.reseat + 2.4);
    if (back > 0.001) f.setMood('winterBlue', { from: 'emberRed', u: Math.round(back * 12) / 12 });
    // the pin: pinched and drawn out on 'pin'; reseated on 'Pin back'
    const reach1 = handReach(t, b.pull - 1.2, b.pull + 0.9, 0.8);
    const out = sm(clamp01((tq - (b.pull - 0.05)) / 0.45));
    const reach2 = handReach(t, b.reseat - 1.0, b.reseat + 0.5, 0.7);
    const seated = t < b.pull - 0.05 || t >= b.reseat;
    const pawl = t < b.pull ? 1 : t < b.reseat ? 0 : sm(clamp01((tq - b.reseat) / 0.12));
    // the cards: A's lands first, then B's over it
    const cardA = clamp01((tq - (b.write - 0.55)) / 0.5);
    const cardB = clamp01((tq - (b.write + 0.25)) / 0.5);
    const house = t < b.write - 0.05 ? '' : t < b.write + 0.75 ? 'A' : 'B';
    const flip0 = t < b.write + 0.75 ? seg(t, b.write - 0.05, b.write + 0.25) : seg(t, b.write + 0.75, b.write + 1.05);
    const settle = Math.sin(Math.PI * seg(t, b.wins - 0.15, b.wins + 0.7));
    // two rooms: both windows light, both lanterns take messages; both gutter out after the pin is back
    const g = clamp01((t - (b.reseat + 0.2)) / 1.6);
    const lit = seg(t, b.both - 0.2, b.both + 0.4) * gutter(g, tq);
    const slipsIn = (h: number) => Array.from({ length: 3 }, (_, i) => {
      const u = ((tq - b.both - i * 1.3 - h * 0.6) / 3.9) % 1;
      return { x: -0.3 + 0.3 * i, y: u < 0 ? 0 : u, alpha: t > b.both + 0.3 + i * 1.3 ? Math.sin(Math.PI * Math.max(0, u)) : 0 };
    });
    // keepers
    const wa = walkA(t), wb = walkB(t);
    const arrivedA = t >= wa.arrive + 0.35, arrivedB = t >= wb.arrive + 0.35;
    const look = seg(t, b.read - 0.3, b.read + 0.2) * (1 - seg(t, b.read + 1.4, b.read + 1.8));
    const handA = seg(t, b.write - 0.9, b.write - 0.5) * (1 - seg(t, b.write + 0.1, b.write + 0.5));
    const handB = seg(t, b.write - 0.2, b.write + 0.2) * (1 - seg(t, b.write + 0.8, b.write + 1.2));
    const KA: KeeperOpts = { id: 'keeper-a', x: AX, y: W.y, facing: 'right', scale: KS, tq, look, present: handA * 0.8 };
    const KB: KeeperOpts = { id: 'keeper-b', x: BX, y: W.y, facing: 'left', scale: KS, tq, look, present: handB * 0.8 };
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: lit, B: lit, C: 0 },
        lanterns: lit > 0.01 ? [
          { house: 'A', lit, members: 3, tq, slips: slipsIn(0), alpha: lit },
          { house: 'B', lit, members: 3, tq, slips: slipsIn(1), alpha: lit },
        ] : [],
        plate: { house, epoch: '', from: '', crown: 0, flip: [flip0, 1, 1], glint: [0.25 + 0.75 * settle, 0, 0] },
        plateLegible: cam.z > 330,
        tooth: { shutter: 0, pin: seated ? 1 : 0, pinOut: t < b.pull - 0.05 ? 0 : out, pawl, showPin: seated || (t < b.pull + 0.4 && out < 0.9), flash: Math.max(Math.sin(Math.PI * seg(t, b.write - 0.1, b.write + 0.3)), Math.sin(Math.PI * seg(t, b.write + 0.7, b.write + 1.1))), flashKind: 'click' },
        well: { bucket: 0.25, glint: 0.3 },
        badge: null,
        lampPostLit: 0.3,
      },
      {
        L4: (c, env) => {
          badge(c, env, { x: W.x + WELL.hookR.x + 6, y: W.y + WELL.hookR.y - 2, text: 'Amazon S3', legible: false, glint: 0.3, swing: 0.03 * Math.sin(tq * 1.3) });
          // the keepers: walking in from either side, then at the wellhead
          if (arrivedA) keeper(c, env, KA);
          else cast['keeper-a'].draw(c, { x: wa.x, y: W.y, facing: 'right', pose: wa.pose, scale: KS, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM }, env);
          if (arrivedB) keeper(c, env, KB);
          else cast['keeper-b'].draw(c, { x: wb.x, y: W.y, facing: 'left', pose: wb.pose, scale: KS, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM }, env);
          // the two cards into the unguarded slot
          for (const [K, u, h] of [[KA, cardA, 'A'], [KB, cardB, 'B']] as const) {
            if (u <= 0 || u >= 1) continue;
            const hand = keeperHand(K);
            const e = sm(u);
            swapCard(c, env, { x: lerp(hand.x, SLOT.x, e), y: lerp(hand.y, SLOT.y - 2, e), s: 0.62, house: h, rot: (1 - e) * (h === 'A' ? -0.3 : 0.3), alpha: 1 - seg(u, 0.85, 1) });
          }
          // a ticked slip leaves A's lantern for the sender's window: A has already served
          const sv = clamp01((tq - (b.served - 0.3)) / 2.4);
          if (sv > 0 && sv < 1) {
            const from = l3ToL4(cam, { x: TOWN.A.main.x, y: TOWN.A.main.y });
            const to = { x: TOWN.sender.win.x - 20, y: TOWN.sender.win.y - 6 };
            const e = sm(sv);
            slip(c, env, { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) - Math.sin(Math.PI * e) * 90, w: 18, tick: clamp01((tq - (b.served - 0.3)) / 0.4), rot: Math.sin(tq * 4) * 0.1, alpha: 1 - seg(sv, 0.9, 1) });
          }
        },
        afterRim: () => {
          // the demonstrator's hand (from the lower right): pulls the pin, later reseats it
          f.layer('L4', (c, env) => {
            if (reach1 > 0.001) {
              const tip = t < b.pull - 0.05 ? PIN : { x: PIN.x + out * 40, y: PIN.y + out * 22 };
              demonstratorHand(c, env, { tip, reach: reach1, shape: 'pinch', s: 0.5, holding: t >= b.pull + 0.4 || out >= 0.9 ? 'pin' : 'none' });
            }
            if (reach2 > 0.001) demonstratorHand(c, env, { tip: PIN, reach: reach2, shape: 'pinch', s: 0.5, holding: t < b.reseat ? 'pin' : 'none' });
            // the pawl's snap on reseat: a brass flash
            const snap = Math.sin(Math.PI * seg(t, b.reseat - 0.05, b.reseat + 0.35));
            if (snap > 0) glowDot(c, PIN.x - 2, PIN.y + 2, 18, tone(env, BRASS_HI, 0.1), 0.8 * snap);
          });
        },
      },
    );
    // ---------------------------------------------------------------- type + the gap diagram (upper-left)
    const c = f.c;
    const l1 = seg(t, b.write - 0.1, b.write + 0.35) * (1 - seg(t, b.maxim - 0.6, b.maxim - 0.1));
    label(c, f.mood, { id: `${ID}-nocond`, text: 'no condition: both write, both serve', x: 64, y: 92, alpha: l1 });
    const l2 = seg(t, b.gap - 0.15, b.gap + 0.35) * (1 - seg(t, b.D - 1.2, b.D - 0.4));
    label(c, f.mood, { id: `${ID}-gap`, text: 'read … then write: a gap', x: 64, y: 92, alpha: l2 });
    gapDiagram(c, f.mood.core, t, tq, b.gap, l2);
  },
});

/** an ink-line diagram under the gap label: a time line with the read and the write, and a card slipping in between */
function gapDiagram(c: C2, core: string, t: number, tq: number, at: number, a: number): void {
  if (a <= 0.01) return;
  const x0 = 70, x1 = 420, y = 132;
  const col = mixLab('#efe3cf', core, 0.2);
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = withAlpha(col, 0.9);
  c.lineWidth = 2;
  c.lineCap = 'round';
  const draw = seg(t, at, at + 0.8);
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(lerp(x0, x1, draw), y);
  c.stroke();
  // the read tick and the write tick
  for (const [x, d] of [[x0 + 40, 0.15], [x1 - 40, 0.6]] as const) {
    if (draw < d) continue;
    c.beginPath();
    c.moveTo(x, y - 12);
    c.lineTo(x, y + 12);
    c.stroke();
  }
  // the gap: bracketed, and another hand's card slips into it
  if (draw >= 1) {
    c.strokeStyle = withAlpha(col, 0.55);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x0 + 52, y + 18);
    c.quadraticCurveTo((x0 + x1) / 2, y + 30, x1 - 52, y + 18);
    c.stroke();
    const u = sm(clamp01((tq - (at + 0.8)) / 0.7));
    const cx = (x0 + x1) / 2, cy = lerp(y - 46, y - 2, u);
    c.fillStyle = mixLab('#d9b56a', core, 0.15);
    c.fillRect(cx - 14, cy - 9, 28, 18);
    c.strokeStyle = withAlpha('#2a1d10', 0.8);
    c.lineWidth = 1;
    c.strokeRect(cx - 14, cy - 9, 28, 18);
  }
  c.restore();
}
