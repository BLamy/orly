/**
 * ch07-s07 — patience, and the room returns (labGreen, cut in; a touch warmer at the end).
 *
 * celld's town, the canonical terrace (harbourTown variant 'celld', badge 'celld 0.6.3' on the wellhead, unnamed):
 * copyist-1 in B's upper window, copyist-2 in C's dormer (sets/ch07-s03-celldTown.ts, shared with ch07-s03..s05 for
 * continuity), House C's keeper at C's door. An occluder wipe: the camera trucks past the L6 lamp-post onto the wide
 * terrace, later pushes to House C's window and the Room Lantern.
 *
 *   restart  0.40  all three houses flicker dark together, then relight together (a shared restart)
 *   lend     3.27  notebooks pass between B's and C's windows along a cord: each lends the other its notebook
 *   minutes  6.37  a sand-glass on the wellhead turns over; later it turns again (retries with a pause; no numbers)
 *   whole   13.76  both copyists' notebooks shine whole; pages ride down to C's keeper; the gate at the wellhead opens
 *   relight 15.29  the Room Lantern relights in House C's window; a slow push in
 *   tick    17.77  slip #42 in the lantern: its ink tick is still there. Hold; the grade eases a touch warmer
 * No text items; bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { TOWN, l3ToL4, paintTown } from '../sets/harbourTown';
import { camAt, clamp01, cord, cordAt, glowDot, lerp, pulse, seg, slip, sm, tone, twos, type CamKey } from '../sets/common';
import { CELLD_TINT, copyistWindow, sillPage } from '../sets/ch07-s03-celldTown';
import { notebook } from '../sets/neighbours';
import { hourglass } from '../sets/ch05-s03-sill';
import { gate } from '../sets/ch07-s06-windows';

const ID = 'ch07-s07';
const W = TOWN.well;
const WIPE: Camera3 = { x: 776, y: 380, z: 60, lens: 1 };
const WIDE: Camera3 = { x: 640, y: 380, z: 60, lens: 1 };
const DRIFT: Camera3 = { x: 660, y: 366, z: 150, lens: 1 };
const ONC: Camera3 = { x: 1150, y: 300, z: 380, lens: 1 };
/** the Room Lantern in C's main window, centred (cam.x = 640 + 1.3 (x - 640) centres an L3 point) */
const LANT: Camera3 = { x: 640 + 1.3 * (TOWN.C.main.x - 640), y: 360 + 1.3 * (TOWN.C.main.y + 6 - 360), z: 640, lens: 1 };
/** the B ↔ C cord between the upper sills (L3) */
const BC = {
  a: { x: TOWN.B.upper.x + TOWN.B.upper.w / 2, y: TOWN.B.upper.y + TOWN.B.upper.h / 2 },
  b: { x: TOWN.C.upper.x - TOWN.C.upper.w / 2, y: TOWN.C.upper.y + TOWN.C.upper.h / 2 },
};
const KEEPER = { x: TOWN.C.door.x - 16, y: TOWN.C.door.y + TOWN.C.door.h / 2 };

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      restart: T.beat('restart'),
      lend: T.beat('lend'),
      minutes: T.beat('minutes'),
      gives: T.word('L0735', 'gives'),
      whole: T.beat('whole'),
      relight: T.beat('relight'),
      tick: T.beat('tick'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIPE },
      { t: 2.2, cam: WIDE },
      { t: b.whole - 1.0, cam: DRIFT },
      { t: b.relight - 0.2, cam: ONC },
      { t: b.tick + 0.3, cam: LANT },
      { t: b.D, cam: { ...LANT, z: LANT.z + 16 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const warm = 0.16 * seg(t, b.tick - 1, b.D);
    if (warm > 0.003) f.setMood('candleAmber', { from: 'labGreen', u: warm });
    // the shared restart: every house flickers dark together, then relights together
    const off = seg(t, b.restart, b.restart + 0.5) * (1 - seg(t, b.restart + 1.5, b.restart + 2.1));
    const flick = off > 0.05 && off < 0.95 ? (Math.sin(tq * 39) > 0.15 ? 1 : 0.35) : 1;
    const L = (1 - off) * flick;
    const lend = seg(t, b.lend - 0.1, b.lend + 2.2);
    const whole = seg(t, b.whole - 0.2, b.whole + 0.5);
    const ride = seg(t, b.whole + 0.2, b.whole + 1.6);
    const lantern = seg(t, b.relight - 0.1, b.relight + 0.8);
    const tickGlow = pulse(t, b.tick - 0.05, 0.2, 0.5, 1.0);
    // the sand-glass on the wellhead: turns on 'minutes', and again on 'gives up'
    const flip1 = sm((tq - b.minutes) / 0.45);
    const flip2 = sm((tq - b.gives) / 0.45);
    const sandU = t < b.gives ? clamp01((t - b.minutes - 0.4) / 4) : clamp01((t - b.gives - 0.4) / 4);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        variant: 'celld',
        lamps: { A: 0.12 * L, B: 0.12 * L, C: (0.12 + 0.4 * lantern) * L, Bup: L, Cup: L },
        lampTint: { A: '#efcf8a', B: CELLD_TINT, C: '#efcf8a', Bup: CELLD_TINT, Cup: CELLD_TINT },
        lanterns: [{ house: 'C', lit: lantern * (0.8 + 0.15 * tickGlow), members: 4 * lantern, tq, door: 0, s: 0.5, alpha: 0.35 + 0.65 * lantern, slips: [{ x: 0.1, y: 0.45, tick: 1, alpha: lantern }] }],
        plate: { house: 'C', epoch: '', from: '', crown: 0.35 + 0.4 * whole },
        tooth: null,
        well: { bucket: 0.35, glint: 0.3 },
        badge: { text: 'celld 0.6.3', legible: false, glint: 0.25 },
        lampPostLit: 0.4,
      },
      {
        L3back: (c, env) => {
          const band = { band: 'complete' as const, lines: 5, sealed: 1, raised: whole * 0.6 };
          copyistWindow(c, env, 'B', { tq, present: 1, lamp: 0.35 * L, notebook: { ...band, alpha: L > 0.1 ? 1 : 0.3 }, press: { turn: 1, locked: 1 } });
          copyistWindow(c, env, 'C', { tq, present: 1, lamp: 0.35 * L, notebook: { ...band, alpha: L > 0.1 ? 1 : 0.3 }, press: { turn: 1, locked: 1 } });
        },
        L3: (c, env) => {
          // the cord between B's and C's upper sills; two notebooks pass each other along it
          cord(c, BC.a.x, BC.a.y, BC.b.x, BC.b.y, 18, withAlpha(mixLab(env.fill('ink'), env.mood.halo, 0.25), 0.85), 0.8, 1);
          if (lend > 0 && lend < 1) {
            const p1 = cordAt(BC.a.x, BC.a.y, BC.b.x, BC.b.y, 18, sm(lend));
            const p2 = cordAt(BC.a.x, BC.a.y, BC.b.x, BC.b.y, 18, 1 - sm(lend));
            notebook(c, env, { x: p1.x, y: p1.y - 2, s: 0.3, band: 'complete', lines: 4 });
            notebook(c, env, { x: p2.x, y: p2.y - 2, s: 0.3, band: 'complete', lines: 4 });
          }
          // 'whole': both windows' notebooks shine; pages ride down to C's keeper at C's door
          if (whole > 0.01) {
            for (const h of ['B', 'C'] as const) {
              const wn = TOWN[h].upper;
              glowDot(c, wn.x, wn.y + wn.h * 0.15, wn.w * 0.7, tone(env, '#f2e6b0', 0.1), 0.5 * pulse(t, b.whole + 0.1, 0.2, 0.5, 1.0));
            }
          }
          for (const [h, d] of [['B', 0], ['C', 0.25]] as const) {
            const u = clamp01((ride - d) / 0.75);
            if (u <= 0 || u >= 1) continue;
            const wn = TOWN[h].upper;
            const a = { x: wn.x, y: wn.y + wn.h / 2 };
            const p = { x: lerp(a.x, KEEPER.x + 14, sm(u)), y: lerp(a.y, KEEPER.y - 24, sm(u)) - Math.sin(Math.PI * u) * 12 };
            sillPage(c, env, { x: p.x, y: p.y, h: 9, alpha: 1 - seg(u, 0.85, 1) });
          }
          // C's keeper at C's door (the successor), a lantern in hand
          const ko = { x: KEEPER.x, y: KEEPER.y, facing: 'right' as const, pose: POSES.present, scale: 0.17, ink: PUPPET_NEAR_BLACK, light: { x: -0.6, y: -0.7, floor: 0.15 }, edgeRim: { x: -0.7, y: -0.6, px: 2.25, alpha: 0.85, warm: 0.45 } };
          cast['keeper-c'].draw(c, ko, env);
          const hand = cast['keeper-c'].anchor(ko, 'handF');
          glowDot(c, hand.x, hand.y + 4, 9, tone(env, '#ffc46e', 0.05), 0.7 * L);
          // slip #42 in the relit lantern, large enough to read its tick on the push
          const sl = seg(t, b.relight + 0.6, b.relight + 1.4);
          if (sl > 0.01) {
            const wn = TOWN.C.main;
            slip(c, env, { x: wn.x - 10, y: wn.y + 19, w: 22, tick: 1, alpha: sl, rot: -0.08 });
            glowDot(c, wn.x - 3, wn.y + 17, 9, tone(env, '#ffd890', 0.05), 0.5 * tickGlow);
          }
        },
        L4: (c, env) => {
          // the sand-glass on the wellhead's ring (it turns, and turns again)
          hourglass(c, env, { x: W.x + 46, y: W.y - 50, s: 1.0, u: sandU, flip: t < b.gives ? flip1 : flip2 > 0 && flip2 < 1 ? flip2 : 0 });
          // the gate at the wellhead opens when the notebooks are whole
          gate(c, env, { x: W.x - 96, y: W.y, s: 0.55, open: seg(t, b.whole + 0.8, b.whole + 1.5), glow: pulse(t, b.whole + 1.0, 0.2, 0.4, 0.8) });
          void l3ToL4;
        },
      },
    );
  },
});
