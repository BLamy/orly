/**
 * ch01-s03 — the question, staged on the two machines the film will open (winterBlue, cut in).
 *
 *   crane     cut from C's window: the camera cranes DOWN the hill (≈ 200 px over 6 s): the terrace rises out of
 *             frame top, the pulley lines sweep past, and the square arrives: the Well at the left third, the Plate on
 *             its iron frame above it like a town clock. C's lit window stays visible top-right.
 *   well      label 'the Well · a storage bucket' inks upper-left above the wellhead
 *   plate     the camera eases in; the Plate's brass tiles catch the moon: the first tile reads C, the other two stay
 *             blank (epochs arrive in chapter 5); the crown lamp is lit; label 'the Plate · who owns the room'
 *   owner     the crown lamp pulses once ("one owner at a time")
 *   acked     the ticked slip glints tiny in C's lantern far above ("nothing acknowledged is lost")
 *   move      a slow pull back reveals all three houses, a moonlit glint running down each pulley line into the one Well
 *   portable  the Room Lantern's glow is reflected in the Well's water; hold
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, textSwap } from '../../../film';
import type { Camera3 } from '../../../film';
import { TOWN, paintTown, pulleyAt, type HouseId } from '../sets/harbourTown';
import { camAt, glowDot, label, pulse, seg, slip, tone, twos, type CamKey } from '../sets/common';
import { crownPt } from '../sets/wellAndPlate';

const ID = 'ch01-s03';
const HIGH: Camera3 = { x: 900, y: 300, z: 200, lens: 1 };
const SQUARE: Camera3 = { x: 520, y: 446, z: 200, lens: 1 };
const CLOSE: Camera3 = { x: 479, y: 417, z: 420, lens: 1 };
const MID: Camera3 = { x: 600, y: 410, z: 260, lens: 1 };
const WIDE: Camera3 = { x: 640, y: 372, z: -30, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      well: T.beat('well'),
      plate: T.beat('plate'),
      owner: T.beat('owner'),
      acked: T.beat('acked'),
      move: T.beat('move'),
      portable: T.beat('portable'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: HIGH },
      { t: 6.3, cam: SQUARE },
      { t: b.plate - 0.3, cam: { ...SQUARE, x: 516, y: 442, z: 214 } },
      { t: b.plate + 2.6, cam: CLOSE },
      { t: b.owner + 0.5, cam: { ...CLOSE, x: 482, z: 432 } },
      { t: b.acked + 1.6, cam: MID },
      { t: b.move - 0.4, cam: { ...MID, x: 606, z: 270 } },
      { t: b.portable - 0.6, cam: WIDE },
      { t: b.D, cam: { ...WIDE, z: WIDE.z + 8 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const tiles = seg(t, b.plate - 0.2, b.plate + 0.8);
    const ownerPulse = pulse(t, b.owner - 0.1, 0.3, 0.3, 1.2);
    const acked = pulse(t, b.acked - 0.1, 0.35, 1.6, 1.4);
    const reflect = seg(t, b.portable - 0.6, b.portable + 0.8);
    const lineGlint = (t - (b.move - 0.2)) / 3.2;
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0, B: 0, C: 1, Cup: 0.8 },
        lanterns: [{ house: 'C', lit: 1, members: 4, tq, door: 0, s: 0.6 }],
        plate: {
          house: tiles > 0.5 ? 'C' : '',
          epoch: '',
          from: '',
          crown: 1,
          flip: [tiles < 1 ? tiles : 1, 1, 1],
          glint: [0.35 * tiles + 0.4 * ownerPulse, 0.15 * tiles, 0.15 * tiles],
        },
        plateLegible: tiles > 0.5,
        tooth: { shutter: 0, pin: 1, showPin: false },
        well: { bucket: 0.25, glint: 0.5 * (1 - reflect), reflect },
        lampPostLit: 0.5,
      },
      {
        L3back: (c, env) => {
          const w = TOWN.C.main;
          slip(c, env, { x: w.x + 11, y: w.y - 2, w: 17, rot: -0.12, tick: 1 });
          if (acked > 0.01) glowDot(c, w.x + 11, w.y - 2, 20, tone(env, '#ffe6b0', 0.1), 0.6 * acked);
        },
        L4: (c, env) => {
          const W = { x: TOWN.well.x, y: TOWN.well.y };
          if (ownerPulse > 0.01) {
            const p = crownPt(W);
            glowDot(c, p.x, p.y, 54, tone(env, '#ffcf7a', 0.05), 0.65 * ownerPulse);
          }
          // on 'move': a moonlit glint runs down each pulley line into the one Well (staggered by house)
          if (lineGlint > 0 && lineGlint < 1.6) {
            (['A', 'B', 'C'] as HouseId[]).forEach((h, i) => {
              const u = lineGlint - i * 0.25;
              if (u <= 0 || u >= 1) return;
              const p = pulleyAt(cam, h, u);
              glowDot(c, p.x, p.y, 10, tone(env, '#e8f0ff', 0.2), 0.8 * Math.sin(Math.PI * u));
            });
          }
          if (reflect > 0.01) glowDot(c, W.x - 4, W.y - 50, 22, tone(env, '#ffc46e', 0.05), 0.4 * reflect);
        },
      },
    );
    // ---------------------------------------------------------------- labels (one per beat, upper corners)
    const out = 1 - seg(t, b.move - 0.3, b.move + 0.6);
    const sw = textSwap(t, b.plate - 0.1, 0.4);
    label(f.c, f.mood, { id: `${ID}-well`, text: 'the Well · a storage bucket', x: 64, y: 96, alpha: seg(t, b.well - 0.15, b.well + 0.4) * sw.out });
    label(f.c, f.mood, { id: `${ID}-plate`, text: 'the Plate · who owns the room', x: 1216, y: 96, align: 'right', alpha: sw.in * out });
  },
});
