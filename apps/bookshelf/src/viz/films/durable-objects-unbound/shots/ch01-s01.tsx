/**
 * ch01-s01 — the harbour town at night (illustrative): the cold open on one promised message (winterBlue, iris in).
 *
 * Canonical HARBOUR TOWN (sets/harbourTown.ts). One long multiplane push across the lead-in onto House A's lit
 * window (L1 sea + shore, L2 ridge, L3 terrace, L4 square, L5 railing, L6 lamp-post all slide against each other).
 *
 *   0.1  iris     the iris opens across the dark water on A's window; the push begins (z 0 → 230, truck left)
 *   5.6  arrive   the push settles on A's window at ~55 % height
 *   made          label 'Illustrative: harbour, houses, room' inks upper-right
 *   room          the Room Lantern resolves inside the window, four members inside
 *   (L0102)       the camera eases back and right so the sender's harbour-side window (L4, right of the Well) joins
 *                 the frame: one window sending, one window serving
 *   types         a paper slip lifts from the sender's phone; label '#42 · the ferry is late' replaces the first
 *   (flight)      the slip arcs across the square to A's window; the camera follows it back in
 *   door          the slip stops against the brass latch on the lantern's door (held)
 *   tick          a two-stroke ink tick strikes the slip; the lantern warms by a breath; hold
 * No implementation badge yet: the cold open shows the promise, not a mechanism. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, defineShot, textSwap, toScreen } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast, MOON_LIGHT } from '../cast';
import { TOWN, l3ToL4, paintTown } from '../sets/harbourTown';
import { camAt, clamp01, label, lerp, pulse, seg, slip, sm, twos, type CamKey } from '../sets/common';
import { lanternPt } from '../sets/roomLantern';

const ID = 'ch01-s01';
const LANTERN_S = 0.68;
/** the lantern in A's window (L3): its base sits on the sill */
const LANT = { x: TOWN.A.main.x, y: TOWN.A.main.y + TOWN.A.main.h / 2 - 2, s: LANTERN_S };
const DOOR_L3 = lanternPt(LANT, 'door');
const HOME: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
/** framed on A's window at ~55 % height */
const ON_A: Camera3 = { x: 196, y: 372, z: 420, lens: 1.1 };
/** both windows: A's (serving) at left, the sender's (sending) at right */
const TWO: Camera3 = { x: 600, y: 384, z: 150, lens: 1 };
/** back in on A for the tick, a touch closer than the first arrival */
const TICK: Camera3 = { x: 186, y: 376, z: 446, lens: 1.12 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      arrive: T.beat('arrive'),
      made: T.beat('made'),
      room: T.beat('room'),
      types: T.beat('types'),
      door: T.beat('door'),
      tick: T.beat('tick'),
      l102: T.line('L0102').start,
      l102end: T.line('L0102').end,
    };
    const cams: CamKey[] = [
      { t: 0, cam: HOME },
      { t: b.arrive + 1.6, cam: ON_A },
      { t: b.l102 + 0.6, cam: { ...ON_A, x: ON_A.x + 6, z: ON_A.z + 8 } },
      { t: b.types - 0.2, cam: TWO },
      { t: b.types + 1.4, cam: { ...TWO, x: TWO.x - 10 } },
      { t: b.door + 1.8, cam: TICK },
      { t: b.D, cam: { ...TICK, z: TICK.z + 14 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // the lantern resolves on 'room', warms by a breath on 'tick'
    const lantern = seg(t, b.room - 0.3, b.room + 1.2);
    const warm = pulse(t, b.tick + 0.15, 0.3, 0.8, 1.6);
    // the slip: lifts from the phone on 'types', arcs to the door, rests against the latch from 'door'
    const lift = seg(t, b.types - 0.1, b.types + 0.6);
    const fly = clamp01((t - (b.types + 0.5)) / Math.max(0.5, b.door - (b.types + 0.5)));
    const tick = clamp01((t - (b.tick - 0.05)) / 0.5);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 1, B: 0.12, C: 0 },
        lanterns: [{ house: 'A', lit: lantern * (1 + 0.25 * warm), members: 4 * lantern, tq, door: 0, s: LANTERN_S, alpha: lantern }],
        plate: { house: '', epoch: '', from: '', crown: 0.35, dim: 0.6 },
        tooth: null,
        well: { bucket: 0.3, glint: 0.4 },
        lampPostLit: 0.5,
      },
      {
        L4back: (c, env) => {
          // the sender at the harbour-side window, phone in hand (its glow on the face side)
          const o = { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left' as const, pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: { x: -0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } };
          cast.sender.draw(c, o, env);
        },
        L4: (c, env) => {
          if (lift <= 0) return;
          // flight path in L4 world: from the sender's phone to A's lantern door (converted from L3 each frame)
          const phone = cast.sender.anchor({ x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale }, 'handF');
          const from = { x: phone.x - 6, y: phone.y - 14 * lift };
          const door = l3ToL4(cam, { x: DOOR_L3.x + 9, y: DOOR_L3.y - 3 });
          const u = sm(fly);
          const x = lerp(from.x, door.x, u);
          const y = lerp(from.y, door.y, u) - Math.sin(Math.PI * u) * 120;
          // the slip shrinks a little as it enters the window plane (it travels toward the terrace)
          const scaleNow = lerp(1, toScreen(LAYERS.L3, cam, 0, 0).k / toScreen(LAYERS.L4, cam, 0, 0).k, u);
          slip(c, env, { x, y, w: 26 * scaleNow, rot: (1 - u) * -0.25 + Math.sin(tq * 3.1) * 0.05 * (1 - u), tick, alpha: lift });
        },
      },
    );
    // ---------------------------------------------------------------- type (screen-locked, upper right)
    const sw = textSwap(t, b.types + 0.1, 0.4);
    const a1 = seg(t, b.made - 0.1, b.made + 0.4) * sw.out;
    label(f.c, f.mood, { id: `${ID}-illustrative`, text: 'Illustrative: harbour, houses, room', x: 1220, y: 92, align: 'right', alpha: a1, italic: true });
    const a2 = sw.in * (1 - seg(t, b.D - 1.0, b.D - 0.2) * 0.85);
    label(f.c, f.mood, { id: `${ID}-slip`, text: '#42 · the ferry is late', x: 1220, y: 92, align: 'right', alpha: a2 });
  },
});
