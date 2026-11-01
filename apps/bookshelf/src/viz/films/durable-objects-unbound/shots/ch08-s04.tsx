/**
 * ch08-s04 — the payoff: dawn over the harbour (dawnGold, ink bleed in).
 *
 * The canonical town at DAWN: the moon low and fading, the sea brightening, the far-shore lamps going out one by one;
 * House C's window holds the Room Lantern, lit; the wellhead badge reads 'workerd · 28 Oct' (art, unnamed).
 *   dawn    the ink bleed lands on the wide town; a slow push from the sea toward the sender's harbour-side window
 *   slip    the camera settles on the sender's slip #42 with its ink tick crisp in the first light (ch01's image)
 *   proof   the tick's two strokes trace back, as thin gold lines, to their two sources in one continuous move:
 *   bytes     the first runs down to the Well, whose bucket comes up holding A's scroll
 *   bell      the second rises to the Plate, where a ghost of that night's tiles reads A · 7 · from 7 with the crown lit,
 *             and a ghost of A's bell swings on A's sill; then both lines fade back into the slip
 *   pull    pull back to the whole town in morning light: three houses, the Well, the Plate, the pulley lines, the sea
 *   card    the end card fades up in the sky above the ridge: the pins, then 'Illustrative harbour; real code.'; hold
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, defineShot, textSwap, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { TOWN, paintTown } from '../sets/harbourTown';
import { GOLD, camAt, clamp01, glowDot, label, seg, slip, tone, twos, type CamKey } from '../sets/common';
import { WELL, plateCrown, tilePt } from '../sets/wellAndPlate';
import { bellSwing, houseBell } from '../sets/heldLetter';

const ID = 'ch08-s04';
const W = { x: TOWN.well.x, y: TOWN.well.y };
const WIDE: Camera3 = { x: 640, y: 372, z: -40, lens: 1 };
const SENDER: Camera3 = { x: 966, y: 500, z: 520, lens: 1.05 };
const PROOF: Camera3 = { x: 700, y: 452, z: 110, lens: 1 };
/** the slip in the sender's hand at the window (L4 world) */
const SLIP = { x: TOWN.sender.win.x - 14, y: TOWN.sender.win.y - 8, w: 36 };

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      slip: T.beat('slip'),
      proof: T.beat('proof'),
      bytes: T.beat('bytes'),
      bell: T.beat('bell'),
      pull: T.beat('pull'),
      card: T.beat('card'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE },
      { t: b.slip + 0.4, cam: SENDER },
      { t: b.proof + 0.2, cam: { ...SENDER, z: SENDER.z + 10 } },
      { t: b.bytes + 1.0, cam: PROOF },
      { t: b.pull - 0.2, cam: { ...PROOF, x: 690, z: 120 } },
      { t: b.card + 0.8, cam: WIDE },
      { t: b.D, cam: { ...WIDE, z: WIDE.z + 10 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const rise = seg(t, 0, b.D);
    // the two gold lines: down to the Well (bytes), then up to the Plate (bell); both fade back into the slip
    const line1 = clamp01((t - b.proof) / Math.max(0.6, b.bytes - b.proof));
    const line2 = clamp01((t - (b.bytes + 1.2)) / Math.max(0.6, b.bell - (b.bytes + 1.2)));
    const linesOut = seg(t, b.bell + 1.2, b.pull + 0.4);
    const bucket = 1 - seg(t, b.bytes - 0.6, b.bytes + 0.6) * (1 - seg(t, b.pull + 0.5, b.card));
    // the Plate: today C · 9 · 9; on 'bell' a ghost of that night (A · 7 · from 7, crown lit) crossfades in, then out
    const ghost = textSwap(t, b.bell - 1.2, 0.5);
    const ghostOut = seg(t, b.pull - 0.2, b.pull + 0.8);
    const ghostOn = ghost.in * (1 - ghostOut);
    const night = { house: 'A' as const, epoch: 7, from: 7 };
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        variant: 'dawn',
        sky: 0.85 + 0.3 * rise,
        moon: 0.45 * (1 - rise),
        shoreLamps: clamp01(1 - t / 9),
        lamps: { A: 0, B: 0.35, C: 1, Cup: 0.6 },
        lanterns: [{ house: 'C', lit: 1, members: 4, tq, door: 0, s: 0.6 }],
        plate:
          ghostOn > 0.5
            ? { ...night, crown: plateCrown(night), glint: [0.4, 0.4, 0.4], alpha: 0.75 }
            : { house: 'C', epoch: 9, from: 9, crown: 1, dim: 0.1, alpha: Math.max(0.3, 1 - ghostOn * 2) },
        plateLegible: cam.z > 60,
        tooth: { shutter: 0, pin: 1, showPin: false },
        well: { bucket, load: bucket < 0.9 ? 'scroll' : 'none', glint: 0.6 },
        badge: { text: 'workerd · 28 Oct', legible: false },
        lampPostLit: 0.15 * (1 - rise),
        skip: { L5: cam.z > 220 },
      },
      {
        L3: (c, env) => {
          // a ghost of A's bell on A's sill, swinging on 'bell'
          const ga = seg(t, b.bell - 0.6, b.bell) * (1 - ghostOut);
          if (ga > 0.01) houseBell(c, env, { x: TOWN.A.sill.x + 22, y: TOWN.A.sill.y - 30, s: 0.6, swing: bellSwing(t, b.bell, 0.5), ring: seg(t, b.bell, b.bell + 0.2) * (1 - seg(t, b.bell + 0.8, b.bell + 1.8)), alpha: 0.7 * ga });
        },
        L4back: (c, env) => {
          cast.sender.draw(c, { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left', pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, light: { x: -0.8, y: -0.4, floor: 0.2 }, edgeRim: { x: -0.85, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.7 } }, env);
          // #42's slip held up in the window, its tick crisp in the first light
          slip(c, env, { x: SLIP.x, y: SLIP.y, w: SLIP.w, rot: -0.08, tick: 1 });
          glowDot(c, SLIP.x + SLIP.w * 0.34, SLIP.y, 12, tone(env, GOLD, 0.05), 0.5 * seg(t, b.slip - 0.3, b.slip + 0.4) * (1 - seg(t, b.pull, b.pull + 1)));
        },
        L4: (c, env) => {
          const from = { x: SLIP.x + SLIP.w * 0.3, y: SLIP.y - 2 };
          const toWell = { x: W.x + 4, y: W.y - WELL.ringH - 8 };
          const toPlate = tilePt(W, 1);
          const a = 1 - linesOut;
          if (a > 0.01) {
            goldLine(c, from, toWell, line1, a, 60);
            goldLine(c, from, { x: toPlate.x, y: toPlate.y + 30 }, line2, a, -90);
          }
          void env;
        },
      },
    );
    // ---------------------------------------------------------------- the end card, in the sky above the ridge
    const ca = seg(t, b.card - 0.1, b.card + 0.9);
    const cb = seg(t, b.card + 1.1, b.card + 2.1);
    label(f.c, f.mood, { id: `${ID}-pins`, text: 'workerd aa494794 · ad78a8fe · celld 0.6.3', x: 640, y: 120, align: 'center', alpha: ca });
    label(f.c, f.mood, { id: `${ID}-illustrative`, text: 'Illustrative harbour; real code.', x: 640, y: 172, align: 'center', italic: true, alpha: cb, size: 26 });

    function goldLine(c: CanvasRenderingContext2D, p0: { x: number; y: number }, p1: { x: number; y: number }, u: number, a: number, bow: number): void {
      if (u <= 0) return;
      const m = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 + bow };
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(GOLD, 0.85 * a);
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      const N = 30;
      let last = p0;
      for (let i = 1; i <= Math.ceil(N * u); i++) {
        const k = Math.min(u, i / N);
        last = { x: (1 - k) * (1 - k) * p0.x + 2 * (1 - k) * k * m.x + k * k * p1.x, y: (1 - k) * (1 - k) * p0.y + 2 * (1 - k) * k * m.y + k * k * p1.y };
        c.lineTo(last.x, last.y);
      }
      c.stroke();
      c.restore();
      glowDot(c, last.x, last.y, 10, GOLD, 0.8 * a * (u < 1 ? 1 : 0.5));
    }
  },
});
