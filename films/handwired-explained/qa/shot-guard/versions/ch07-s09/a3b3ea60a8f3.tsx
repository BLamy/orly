/**
 * ch07-s09 — LEARNING, SEEN AS UNFOLDING (scene, dawnGold; crossfade in; 9.50 s on the locked clock; mostly music).
 *   L0718 "Six hundred steps a second, through the program's own backward pass."
 *
 * Back to the stage among the misty hills. Everything that moves is the gallery's own first fit, recorded by running
 * the page's editor at 60 Hz (films/handwired-explained/research/runs/gallery-story-run.ts against the clone pinned
 * at 257856e; Story preset, default slider, seed 0x517a9e; output research/exports/gallery-story.json):
 *   - the ten photos fan out of the pile to their rectangles, frame by recorded frame, and settle with small corrections;
 *   - the paper loss chart on the apron draws the distance from the sketch left to right, on the page chart's own log
 *     axis (0.1 at the top, 1e-11 at the bottom; no values printed), and the step counter runs up and stops where
 *     training stopped (679);
 *   - behind the stage the front ridge IS that same measured curve cut in paper (training step left to right, loss as
 *     height), and the lantern-bearing traveller walks it in step with the counter: his descent is the gallery's own
 *     descent, and his lantern clears a pool in the valley mist.
 * Screen time is slowed (linear in √step through keys at 0.5, 2.5, 5.0 and 7.2 s): the first fifty steps, where the
 * photos travel, take two seconds; the small corrections (steps 50 to 200) are seen over the next two and a half; the
 * chart and the traveller carry the flat tail. A brass tick marks 630 on the chart. The label states the real rate and
 * fades before the cut.
 * CAMERA: a slow, steady pull back (and a drift left) from the stage until the hills, the traveller and the stage share
 * the frame; hold on the settled gallery.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import { paperSlip } from '../sets/ch06-s01-clockroom';
import {
  GAL,
  PHOTO_BAKE,
  boothGeo,
  brassCounter,
  brassOf,
  chartY,
  galInk,
  galleryBooth,
  logLossAtStep,
  lossRidge,
  meadow,
  photoArt,
  photoCard,
  glowAt,
  lerpRect,
  pileSquare,
  px,
  rectsAtStep,
  ridgePath,
  screenPaper,
  seg,
  sketchFrame,
  stageRect,
  traveller,
  twos,
  type Booth,
} from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
const ID = 'ch07-s09';

// ------------------------------------------------------------------ staging
const B9: Booth = { x: 236, y: 236, w: 360, ground: 704 };
const SCREEN_C = { x: B9.x + B9.w / 2, y: B9.y + B9.w * 0.4 };
/** (review r1) a touch wider and framed higher than before, so the booth's fan crest reads on the first frame */
const CAM_A: Camera3 = { x: SCREEN_C.x + 20, y: 380, z: 280, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 384, z: -160, lens: 1 };
const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
/** the front ridge's step axis on L3 (rest px): x 650 → 1250 spans steps 0 → 700, just right of the booth */
const RIDGE = { x: 650, y: 300, w: 600, h: 320, bottom: 980, steps: 700, deckle: 2.6 };
const STEPS_END = GAL.stopStep;

interface Beats {
  train: number;
  traveller: number;
  settle: number;
  end: number;
  D: number;
}
/**
 * The training step shown at time t (review r1: the small corrections must be SEEN, not finished by 2.8 s): linear in
 * √step through four keys, so the photos travel over the first two seconds (steps 0 → 50), correct visibly by a few px
 * for the next two and a half (50 → 200: the residual falls from about 25 px to about 1 px, the real recorded frames),
 * and then the chart and the traveller carry the long flat tail to 679.
 */
const STEP_KEYS = (b: Beats) => [
  [b.train, 0],
  [b.train + 2, Math.sqrt(50)],
  [b.train + 4.5, Math.sqrt(200)],
  [b.end, Math.sqrt(STEPS_END)],
];
const stepAt = (t: number, b: Beats) => {
  const K = STEP_KEYS(b);
  if (t <= K[0][0]) return 0;
  if (t >= K[3][0]) return STEPS_END;
  let i = 0;
  while (t > K[i + 1][0]) i++;
  const u = (t - K[i][0]) / (K[i + 1][0] - K[i][0]);
  const r = K[i][1] + (K[i + 1][1] - K[i][1]) * u;
  return Math.min(STEPS_END, r * r);
};

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = { train: T.beat('train'), traveller: T.beat('traveller'), settle: T.beat('settle'), end: 7.2, D: T.duration };
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: 0.2, dur: b.settle + 0.3 - 0.2, ease: sine });
    tl.hold(0, T.duration);
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const step = stepAt(tq, b); // the counter and the photos advance on twos
    f.camera(s.get(sc.cam));
    f.backlight({ sunX: 900, sunY: 452, sunRadius: 270 });
    farHills(f);
    lossHill(f, t, tq, step);
    f.fog('B');
    f.layer('L4', (c, env) => {
      ground(f, c, env);
      f.cached(`${ID}/booth/${env.mood.id}`, 560, 640, (cc) => {
        cc.translate(-(B9.x - 100), -(B9.y - 140));
        galleryBooth(cc, env, B9, 'back');
      })(c, B9.x - 100, B9.y - 140);
      photos(f, c, env, step);
      GAL.targets.forEach((r, ti) => sketchFrame(c, env, stageRect(B9, r), { seed: 30 + ti, lift: 1.2 }));
      f.cached(`${ID}/curtains/${env.mood.id}`, 400, 320, (cc) => {
        cc.translate(-(B9.x - 20), -(B9.y - 10));
        galleryBooth(cc, env, B9, 'front');
      })(c, B9.x - 20, B9.y - 10);
      apron(c, env, t, step, b);
    });
    f.rim({ x: 0.3, y: -1 });
    near(f);
    paperSlip(f.c, { mood: f.mood } as PaintEnv, {
      lines: ['600 steps a second', 'Story: first fit in 630–750 steps'],
      x: 1030,
      y: 62,
      t,
      inkAt: b.train + 0.2,
      out: 1 - seg(t, b.D - 1.0, b.D - 0.2), // gone before the crossfade into the dusk room
      size: 25,
      id: `${ID}-slip`,
      pin: true,
      tilt: -0.01,
    });
  },
});

// ------------------------------------------------------------------ far hills (L1, L2)
const OS1 = overscan(LAYERS.L1, [CAM_A, CAM_B], 40);
const OS2 = overscan(LAYERS.L2, [CAM_A, CAM_B], 40);
function farHills(f: Frame) {
  f.layer('L1', (c, env) => {
    f.cached(`${ID}/L1/${env.mood.id}`, OS1.w, OS1.h, (cc) => {
      cc.translate(-OS1.x, -OS1.y);
      for (const [y, amp, fr, seed, hz] of [
        [444, 22, 0.55, 3, 0.5],
        [468, 18, 0.8, 5, 0.32],
      ] as const) {
        const r = ridgePath({ y, amp, f: fr, seed, x0: OS1.x, x1: OS1.x + OS1.w, bottom: OS1.y + OS1.h, pines: 40, pineH: 9 });
        cc.fillStyle = mixLab(env.mood.set, env.mood.haze, hz);
        cc.fill(r.p);
      }
    })(c, OS1.x, OS1.y);
  });
  f.fog({ yCenter: 486, height: 90, alpha: 0.3, drift: 5 });
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const r = ridgePath({ y: 508, amp: 22, f: 0.7, seed: 11, x0: OS2.x, x1: OS2.x + OS2.w, bottom: OS2.y + OS2.h, pines: 60, pineH: 14 });
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.12);
      cc.fill(r.p);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
}

// ------------------------------------------------------------------ the loss ridge, its mist, the traveller (L3)
const LR = lossRidge(RIDGE);
/** the crest itself (for the dawn rim along the cut edge) */
const CREST = (() => {
  const p = new Path2D();
  for (let st = 0; st <= RIDGE.steps; st += 2) (st === 0 ? p.moveTo : p.lineTo).call(p, LR.sx(st), LR.sy(st));
  return p;
})();
const OS3 = overscan(LAYERS.L3, [CAM_A, CAM_B], 40);
function lossHill(f: Frame, t: number, tq: number, step: number) {
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, OS3.w, OS3.y + OS3.h - 200, (cc) => {
      cc.translate(-OS3.x, -200);
      // a second, paler ridge behind: the measured curve is the front of a range
      const back = ridgePath({ y: 352, amp: 34, f: 1.1, seed: 41, x0: 560, x1: OS3.x + OS3.w, bottom: OS3.y + OS3.h, pines: 14, pineH: 12 });
      cc.fillStyle = mixLab(mixLab(env.fill('set'), env.fill('ink'), 0.2), env.mood.haze, 0.38);
      cc.fill(back.p);
      cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.55);
      cc.fill(LR.p);
      // the dawn catching the cut edge: a thin warm rim along the crest
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.55);
      cc.lineWidth = 1.6;
      cc.stroke(CREST);
    })(c, OS3.x, 200);
    // where the traveller is: on the measured curve at the current step
    const s = Math.min(RIDGE.steps, step);
    const x = LR.sx(s), y = LR.sy(s);
    const walking = step > 0.5 && step < STEPS_END - 0.5;
    // valley mist lying over the ridge, with a pool of clear air around the lantern
    const mx0 = OS3.x, mw = OS3.w;
    c.save();
    const g = c.createLinearGradient(0, RIDGE.y + RIDGE.h * 0.32, 0, RIDGE.y + RIDGE.h * 0.95);
    g.addColorStop(0, withAlpha(env.mood.haze, 0));
    g.addColorStop(0.45, withAlpha(env.mood.haze, 0.55));
    g.addColorStop(1, withAlpha(env.mood.haze, 0.3));
    c.fillStyle = g;
    c.fillRect(mx0, RIDGE.y + RIDGE.h * 0.32, mw, RIDGE.h * 0.63);
    const lamp = { x: x + 26, y: y - 56 };
    // (review r1) the lantern clears a pool half as wide again, and clears it fully at its heart
    const HR = 180;
    c.globalCompositeOperation = 'destination-out';
    const hole = c.createRadialGradient(lamp.x, lamp.y + 30, 0, lamp.x, lamp.y + 30, HR);
    hole.addColorStop(0, 'rgba(0,0,0,1)');
    hole.addColorStop(0.5, 'rgba(0,0,0,0.75)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = hole;
    c.fillRect(lamp.x - HR, lamp.y + 30 - HR, HR * 2, HR * 2);
    c.restore();
    // the traveller (appears with the ridge; walks on twos)
    const a = seg(t, 0.3, 1.2);
    const lp = traveller(c, env, x, y + 1, 62, 1, tq, walking, a, mixLab(env.fill('ink'), '#000000', 0.2));
    // the lantern's halo (1.5x) and a warm pool on the ground under it
    glowAt(c, lp.x, lp.y, 48, env.mood.core, 0.55 * a);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const PR = 105;
    const pool = c.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, PR);
    pool.addColorStop(0, withAlpha(env.mood.core, 0.42 * a));
    pool.addColorStop(0.3, withAlpha(env.mood.halo, 0.15 * a));
    pool.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = pool;
    c.fillRect(lp.x - PR, lp.y - PR, PR * 2, PR * 2);
    c.restore();
  });
}

const OS4 = overscan(LAYERS.L4, [CAM_A, CAM_B], 30);
function ground(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/ground/${env.mood.id}`, OS4.w, OS4.y + OS4.h - 600, (cc) => {
    cc.translate(-OS4.x, -600);
    cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.4);
    cc.fill(meadow(OS4.x, OS4.x + OS4.w, 668, OS4.y + OS4.h, 23, 10));
  })(c, OS4.x, 600);
}

// ------------------------------------------------------------------ the photos (the recorded first fit)
function photos(f: Frame, c: C2, env: PaintEnv, step: number) {
  // the pile as ch07-s06 and s07 showed it (small squares at the seeded centres), giving way to the recorded frames
  // over the first four steps (a fraction of a second)
  const rec = rectsAtStep(step);
  const rects = step >= 4 ? rec : rec.map((r, k) => lerpRect(pileSquare(k), r, step / 4));
  const order = rects.map((r, k) => ({ k, a: Math.max(0, r[2]) * Math.max(0, r[3]) })).sort((p, q) => q.a - p.a);
  for (const { k } of order) {
    const art = f.cached(`ch07-s06/photo${k}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, k, PHOTO_BAKE.w, PHOTO_BAKE.h));
    photoCard(c, env, art, stageRect(B9, rects[k]), { shadow: 0.22 });
  }
}

// ------------------------------------------------------------------ the apron: the loss chart and the step counter
function apron(c: C2, env: PaintEnv, t: number, step: number, b: Beats) {
  const A = boothGeo(B9).apron;
  const ch = { x: A.x + A.w * 0.06, y: A.y + A.h * 0.13, w: A.w * 0.58, h: A.h * 0.7 };
  // the chart's paper
  c.fillStyle = screenPaper(env);
  c.fillRect(ch.x, ch.y, ch.w, ch.h);
  c.strokeStyle = withAlpha(galInk(env), 0.5);
  c.lineWidth = px(c, 1);
  c.strokeRect(ch.x, ch.y, ch.w, ch.h);
  // faint decade rules on the log axis (no values)
  c.strokeStyle = withAlpha(galInk(env), 0.12);
  for (let d = -2; d >= -10; d -= 2) {
    const y = ch.y + chartY(d) * ch.h;
    c.beginPath();
    c.moveTo(ch.x + 2, y);
    c.lineTo(ch.x + ch.w - 2, y);
    c.stroke();
  }
  // the curve so far, with a wash under it
  const sMax = Math.min(step, RIDGE.steps);
  if (t >= b.train && sMax > 0) {
    const X = (s: number) => ch.x + (s / RIDGE.steps) * ch.w;
    const Y = (s: number) => ch.y + chartY(logLossAtStep(s)) * ch.h;
    c.beginPath();
    c.moveTo(X(0), ch.y + ch.h);
    for (let s = 0; s <= sMax; s += 3) c.lineTo(X(s), Y(s));
    c.lineTo(X(sMax), Y(sMax));
    c.lineTo(X(sMax), ch.y + ch.h);
    c.closePath();
    c.fillStyle = withAlpha(mixLab(env.mood.halo, '#8a5a2a', 0.3), 0.22);
    c.fill();
    c.beginPath();
    for (let s = 0; s <= sMax; s += 3) (s === 0 ? c.moveTo : c.lineTo).call(c, X(s), Y(s));
    c.lineTo(X(sMax), Y(sMax));
    c.strokeStyle = galInk(env);
    c.lineWidth = px(c, 2);
    c.stroke();
    // the pen nib at the tip
    c.fillStyle = galInk(env);
    c.beginPath();
    c.arc(X(sMax), Y(sMax), px(c, 3), 0, Math.PI * 2);
    c.fill();
  }
  // a tiny brass tick on the chart's floor when the counter passes 630, the low end of the scripted first fit (no text)
  if (step >= 630) {
    const X = ch.x + (630 / RIDGE.steps) * ch.w;
    const k = seg(t, 0, 1) * Math.min(1, (step - 630) / 12);
    c.save();
    c.strokeStyle = withAlpha(brassOf(env, 0.6), k);
    c.lineWidth = px(c, 2.4);
    c.beginPath();
    c.moveTo(X, ch.y + ch.h + 1);
    c.lineTo(X, ch.y + ch.h - 8);
    c.stroke();
    c.fillStyle = withAlpha(brassOf(env, 0.6), k);
    c.beginPath();
    c.moveTo(X - 4, ch.y + ch.h + 4);
    c.lineTo(X + 4, ch.y + ch.h + 4);
    c.lineTo(X, ch.y + ch.h - 1);
    c.closePath();
    c.fill();
    c.restore();
  }
  // the step counter
  const shown = Math.round(step);
  brassCounter(c, env, { x: A.x + A.w * 0.82, y: A.y + A.h * 0.36, value: shown, text: String(shown).padStart(3, '0'), unit: 'step', u: 1, size: 21, alpha: seg(t, 0.5, 0.75), id: `${ID}-steps` }); // in after the crossfade: no text under the outgoing plate's
}

// ------------------------------------------------------------------ near plane (L5): grasses
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, OS5.w, OS5.y + OS5.h - 540, (cc) => {
      cc.translate(-OS5.x, -540);
      cc.fillStyle = env.fill('fg');
      const g = new Path2D();
      const blade = (x: number, y: number, h: number, lean: number) => {
        g.moveTo(x - 3, y);
        g.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
        g.quadraticCurveTo(x + lean * 0.5 + 2, y - h * 0.55, x + 3, y);
        g.closePath();
      };
      for (let i = 0; i < 44; i++) {
        const left = i < 22;
        const x = left ? OS5.x + (i / 22) * 260 : OS5.x + OS5.w - ((i - 22) / 22) * 220;
        blade(x, OS5.y + OS5.h + 10, 100 + ((i * 41) % 100), ((i * 59) % 64) - 32);
      }
      cc.fill(g);
    })(c, OS5.x, 540);
  });
}
