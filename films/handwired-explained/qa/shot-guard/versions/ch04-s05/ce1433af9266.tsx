/**
 * ch04-s05 — THE POISON (scene, parchment; cut from ch04-s04 on the same belts; 11.83 s on the locked clock).
 * L0408 "Say the side you didn't choose overflows, past the biggest float, to infinity. Nought times infinity isn't
 *        nought. It isn't a number at all."
 *
 * Same belts as ch04-s04's end (sets/ch04-s04-belts, one belt clock across the cut): the lever reads 0, so the 12
 * shutter stands open and the 10 shutter is shut; every 10 still comes through as 0.
 * TEACHES, word by word:
 *   'overflows'  (beat inf) a 10 riding the CLOSED belt swells past its card and is cut as a black ∞ (a lemniscate of
 *                black card): the branch nobody chose has overflowed past the biggest float
 *   'Nought'     (beat times) it reaches the shut shutter exactly on the word (the belt phase is solved from the clock);
 *                the shutter tries to re-letter it as it does every tile, a thin ink ×0 line across the panel, and the
 *                ∞ slips through anyway as a grey puff; the card swaps to 0 × ∞ = NaN
 *   'nought'     the puff falls into the tray and settles as grey dust
 *   'number'     (beat nan) a clean 12 lands, and the tray fills instead with grey sand stamped NaN; the 12 sinks into
 *                it. Hold on the grey tray against the warm window; both belts still running.
 * Camera: a slow push toward the tray from ch04-s04's end framing.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3 } from '../../../film';
import { cam3Interp, defineShot, textSwap } from '../../../film';
import { WB, benchNear, benchRoom, benchTop } from '../sets/ch04-s02-workbench';
import { SCHED, beltClock, beltRig, marbleA } from '../sets/ch04-s04-belts';

const ID = 'ch04-s05';
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const START: Camera3 = { x: 646, y: 358, z: 16, lens: 1 };
const END: Camera3 = { x: 654, y: 362, z: 42, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const cam = tl.channel<Camera3>('cam', START, cam3Interp);
    tl.tween(cam, END, { at: 0, dur: D, ease: ease.move });
    tl.hold(0, D);
    const b = {
      inf: T.beat('inf'),
      times: T.beat('times'),
      nought2: T.word('L0408', 'nought'),
      nan: T.beat('nan'),
      D,
    };
    return { tl, cam, b };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    f.camera(s.get(scene.cam));
    benchRoom(f, { key: ID, lamp: 0.45 });
    const u = beltClock.s05(t);
    // the grey sand: a dusting as the puff settles (after 'nought'), the fill on 'number'
    const dust = win(t, b.nought2 - 0.25, b.nought2 + 1.0) * 0.22;
    const fill = win(t, b.nan - 0.3, b.nan + 0.35);
    f.layer('L4', (c, env) => {
      f.cached(`ch04wb/bench/${env.mood.id}`, 2400, 700, (cc) => {
        cc.translate(500, -WB.BY + 20);
        benchTop(cc, env);
      })(c, -500, WB.BY - 20);
      beltRig(c, env, {
        u,
        sched: SCHED,
        lever: { show: 1, a: marbleA(beltClock.s05(tq)) },
        rods: 1,
        inf: { overflowU: beltClock.s05(b.inf), mark: win(t, b.times - 0.18, b.times + 0.5) * (1 - win(t, b.times + 2.2, b.times + 2.8)) },
        tray: { sand: Math.max(dust, fill), stamp: win(t, b.nan - 0.05, b.nan + 0.25) },
      });
    });
    f.rim({ x: 0, y: -1 });
    const sw = textSwap(t, b.times);
    benchNear(f, {
      key: ID,
      card: {
        id: `${ID}-card`,
        paper: 1,
        texts: [
          { lines: ['result = above4 × 10', '+ (1 − above4) × 12'], ink: sw.out },
          { lines: ['0 × ∞ = NaN'], ink: sw.in },
        ],
      },
    });
  },
});
