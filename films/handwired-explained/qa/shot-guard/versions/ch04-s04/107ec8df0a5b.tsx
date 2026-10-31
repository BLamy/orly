/**
 * ch04-s04 — BOTH BRANCHES RUN (scene, parchment; cut on motion from ch04-s03; 9.08 s on the locked clock).
 * L0407 "Two belts carry both answers, every time: ten and twelve. The bit opens one shutter, shuts the other."
 *
 * The backlit workbench seen from behind the ramps (sets/ch04-s02-workbench + sets/ch04-s04-belts): the camera rises
 * past the two hinged boards (L5, blurred silhouettes against the window bay, sinking to the lower left) to reveal two
 * black belts that never stop: 10 tiles from the left, 12 tiles from the right, each through its own paper shutter
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
 * Camera: cut on motion, a 3.4 s crane up from the ramps (L5 slides down faster than the belts: depth), then a slow drift.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { cam3Interp, defineShot, textSwap } from '../../../film';
import { WB, benchNear, benchRoom, benchTop, marble, rig } from '../sets/ch04-s02-workbench';
import { SCHED, beltClock, beltRig, marbleA, SWAP_ROLL, LOWER } from '../sets/ch04-s04-belts';

const ID = 'ch04-s04';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const START: Camera3 = { x: 612, y: 446, z: 46, lens: 1 };
const RISEN: Camera3 = { x: 640, y: 362, z: 0, lens: 1 };
/** ch04-s05 starts here */
const END: Camera3 = { x: 646, y: 358, z: 16, lens: 1 };

/** the ramps in the near plane (L5): the workbench rig at 0.7 scale, its rule at the lower left */
const NEAR_RIG = { s: 0.7, x: -6, y: 700 };

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
    const sw = textSwap(t, b.shutters);
    benchNear(f, {
      key: ID,
      l5: (c, env) => nearRamps(c, env, a),
      card: {
        id: `${ID}-card`,
        paper: 1,
        texts: [
          { lines: ['above4 =', 'max(0, a − 4) − max(0, a − 5)', '= clamp(a − 4, 0, 1)'], ink: sw.out },
          { lines: ['result = above4 × 10', '+ (1 − above4) × 12'], ink: sw.in },
        ],
      },
    });
  },
});

/** the two boards and the marble, small, in the blurred near plane at the lower left (seen from behind the belts) */
function nearRamps(c: C, env: PaintEnv, a: number) {
  c.save();
  c.translate(NEAR_RIG.x, NEAR_RIG.y);
  c.scale(NEAR_RIG.s, NEAR_RIG.s);
  c.translate(-WB.X0, -WB.BY);
  rig(c, env, { two: 1 });
  marble(c, env, WB.xOf(a), WB.BY - WB.MARBLE_R, WB.MARBLE_R, (WB.xOf(a) - WB.xOf(5)) / WB.MARBLE_R);
  // the rule they stand on (a dark strip: seen from behind, its numerals face away)
  c.fillStyle = 'rgba(11,13,11,0.92)';
  c.fillRect(WB.X0 - 30, WB.BY, WB.X1 - WB.X0 + 60, 40);
  c.restore();
}
