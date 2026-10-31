/**
 * ch04-s04 — BOTH BRANCHES RUN (scene, parchment; cut on motion from ch04-s03; 9.08 s on the locked clock).
 * L0407 "Two belts carry both answers, every time: ten and twelve. The bit opens one shutter, shuts the other."
 *
 * The backlit workbench seen from behind the ramps (sets/ch04-s02-workbench + sets/ch04-s04-belts): the camera rises
 * from bench height to reveal two black belts that never stop: 10 tiles from the left, 12 tiles from the right, each through its own paper shutter
 * into ONE tray at the centre. Above the tray, the lever (the bit) on its stand.
 * TEACHES, word by word (every label COMPUTED: v × the shutter's opening when that tile passed it, FP32):
 *   'belts'    (beat belts) the belts come up to speed; the shutters hang raised, so whole 10s and 12s fall into the
 *              tray side by side: both answers, every time ('ten', 'twelve')
 *   'bit'      (beat shutters) thin rods run from the lever to both shutters and drop them onto the belts; the marble
 *              sits at 5, the lever reads 1: the 10 shutter stands fully open, the 12 shutter is shut, so each 12 is
 *              squeezed flat and re-lettered 0 as it passes, and the 0 lands harmlessly beside the 10; the card swaps
 *              to result = above4 × 10 + (1 − above4) × 12
 *   'other'    (beat swap) the marble rolls to 3: the lever falls to 0 and the shutters swap with one clack; now the
 *              10s come through as 0 and a whole 12 drops into the tray. Hold: both belts keep running.
 * Review r1: the tray is LIDDED until the bit acts (so no whole 10 sits beside a whole 12), the belts are phased so a
 * tile passes each shutter on 'bit' and on 'other' and lands ~0.6 s later (10 | 0, then 0 | 12), and the tray is
 * tipped out on the swap. The ramps of ch04-s03 stand in near silhouette at the lower left as the camera rises.
 * Camera: cut on motion, a 3.4 s crane up from bench height (the L5 lip and the L6 post slide faster than the belts,
 * the window bay slower: depth), then a slow push in on the shutters and tray. The marble is below the bench line
 * here; the lever is the bit. The card is held inside the safe area through the move.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3 } from '../../../film';
import { LAYERS, cam3Interp, defineShot, mixLab, textSwap, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { WB, benchNear, benchRoom, benchTop } from '../sets/ch04-s02-workbench';
import { SCHED, beltClock, beltRig, marbleA, SWAP_ROLL, LOWER } from '../sets/ch04-s04-belts';

const ID = 'ch04-s04';
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const START: Camera3 = { x: 612, y: 462, z: 46, lens: 1 };
const RISEN: Camera3 = { x: 640, y: 362, z: 0, lens: 1 };
/** ch04-s05 starts here. review r1: after the crane, push in on the tray so both shutters and the tray fill the
 *  middle third (shutters at L4 x 545 / 735, tray 552..728) */
const END: Camera3 = { x: 640, y: 404, z: 80, lens: 1 };


export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const cam = tl.channel<Camera3>('cam', START, cam3Interp);
    tl.tween(cam, RISEN, { at: 0, dur: 3.4, ease: ease.move });
    tl.tween(cam, END, { at: 3.4, dur: D - 3.4, ease: ease.move });
    tl.hold(0, D);
    const b = { shutters: T.beat('shutters'), swap: T.beat('swap'), D };
    return { tl, cam, b };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    f.camera(s.get(scene.cam));
    benchRoom(f, { key: ID, lamp: 0.45 });
    const u = beltClock.s04(t);
    const a = marbleA(tq);
    // the swap's clack: a one-frame jolt of both frames as the lever crosses 4.5
    const cross = SWAP_ROLL[0] + 0.12;
    const clack = t > cross && t < cross + 0.17 ? (t - cross) / 0.17 : 0;
    f.layer('L4', (c, env) => {
      f.cached(`ch04wb/bench/${env.mood.id}`, 2400, 700, (cc) => {
        cc.translate(500, -WB.BY + 20);
        benchTop(cc, env);
      })(c, -500, WB.BY - 20);
      beltRig(c, env, {
        u,
        sched: SCHED,
        lever: { show: 1, a },
        rods: win(t, LOWER[0] - 0.35, LOWER[0] + 0.05),
        clack,
      });
    });
    f.rim({ x: 0, y: -1 });
    // review r1: the same bench seen from behind the ramps: the two boards stand in near silhouette at the lower left
    // for the first seconds of the crane (L5 parallax carries them down out of frame as the camera rises)
    const rampsU = 1 - win(t, 2.4, 3.4);
    if (rampsU > 0) f.layer('L5', (c, env) => nearRamps(c, env, rampsU));
    const sw = textSwap(t, b.shutters);
    const cardIn = win(t, 3.0, 3.45);
    benchNear(f, {
      key: ID,
      card: {
        id: `${ID}-card`,
        // review r1: the card comes in (paper and text together) once the crane has risen, inside the safe area,
        // so it never sits clipped or over the lever during the move
        paper: cardIn,
        keepIn: true,
        texts: [
          { lines: ['above4 =', 'max(0, a − 4) − max(0, a − 5)', '= clamp(a − 4, 0, 1)'], ink: Math.min(sw.out, cardIn) },
          { lines: ['result = above4 × 10', '+ (1 − above4) × 12'], ink: sw.in },
        ],
      },
    });
  },
});

/** the two ramp boards of ch04-s03, near and out of focus (L5), seen from behind: flat, then a 45° climb; board two a
 *  step back (lighter), its corner one unit later */
function nearRamps(c: CanvasRenderingContext2D, env: PaintEnv, a: number) {
  const U = 80;
  const base = 772;
  const x0 = -160;
  c.save();
  c.globalAlpha *= a;
  for (const k of [1, 0]) {
    const hinge = 150 + k * U;
    c.fillStyle = k ? mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25) : PUPPET_NEAR_BLACK;
    c.beginPath();
    c.moveTo(x0, base + 14);
    c.lineTo(x0, base);
    c.lineTo(hinge, base);
    c.lineTo(hinge + 2.2 * U, base - 2.2 * U);
    c.lineTo(hinge + 2.2 * U + 10, base - 2.2 * U + 16);
    c.lineTo(hinge + 8, base + 14);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x0, base);
  c.lineTo(150, base);
  c.lineTo(150 + 2.2 * U, base - 2.2 * U);
  c.stroke();
  c.restore();
}
void LAYERS;
