/**
 * ch07-s06 — THE LEARNED GALLERY (scene, dawnGold; paper wipe in; 10.13 s on the locked clock).
 *   L0714 "Only one demo learns: the learned gallery. From random weights, it learns to place the photos on
 *          rectangles you sketch."
 *
 * The landscape changes for the first time in the film: misty hills at dawn (three ridges of pines in the haze, mist
 * between them, the low sun behind the far ridge; no traveller yet). In the middle distance, on a meadow, the paper
 * stage in its 5:4 frame stands on two trestles like a puppet booth (sets/ch07-s06-gallery, art department 22). The
 * camera makes one slow push from the hills to the booth, ending with the stage filling the middle of frame.
 *
 * TEACHES, word by word (every position from the gallery's own run, sets/data/ch07-s06-gallery.json):
 *   stage (0.40)      the wipe has opened; the place stamp types in
 *   learned (2.31)    three brass counters on the booth's apron click up: 244 weights · 6,320 operations · 8 layers
 *   random (4.36)     the ten photos drop into a pile near the stage's centre, stacked and overlapping, exactly where the
 *                     seeded weights put them (smaller above larger, as the page stacks them); the slip pins: "seeded
 *                     random start: every photo a small square". Nothing moves to the rectangles yet.
 *   rectangles (6.95) the narrator's hand enters from the lower left with the cut-paper rectangles
 *   sketch (7.85)     it deals the Story preset's ten rectangles onto the stage one by one, on twos: the large one
 *                     (0.6 × 0.52), the two beside it, then seven cells of the 4 × 2 grid below (the eighth left empty)
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, defineShot, mixLab, overscan, placeStamp } from '../../../film';
import { hands } from '../cast';
import { paperSlip } from '../sets/ch06-s01-clockroom';
import {
  GAL,
  PHOTO_BAKE,
  brassCounter,
  boothGeo,
  galleryBooth,
  meadow,
  photoArt,
  photoCard,
  ridgePath,
  seg,
  sketchFrame,
  stageRect,
  twos,
  type Booth,
} from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
const ID = 'ch07-s06';

// ------------------------------------------------------------------ staging (world px of each layer)
/** the booth's screen on the action plane: 360 × 288 (5:4), standing on the meadow at y 700 */
export const BOOTH6: Booth = { x: 460, y: 250, w: 360, ground: 700 };
const CAM_A: Camera3 = { x: 640, y: 372, z: -260, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 452, z: 312, lens: 1 };
const camAt = cam3Interp(CAM_A, CAM_B);

/** deal order: the large rectangle, the two beside it, then the grid's seven cells, row by row */
const DEAL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/** the page stacks smaller photos above larger ones */
const PHOTO_ORDER = GAL.pile.map((r, k) => ({ k, a: r[2] * r[3] })).sort((p, q) => q.a - p.a).map((p) => p.k);

interface Beats {
  stage: number;
  counters: number;
  pile: number;
  rectsIn: number;
  rects: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: 0, dur: T.duration, ease: ease.move });
    tl.hold(0, T.duration);
    const b: Beats = {
      stage: T.beat('stage'),
      counters: T.beat('counters'),
      pile: T.beat('pile'),
      rectsIn: T.word('L0714', 'rectangles'),
      rects: T.beat('rects'),
      D: T.duration,
    };
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = s.get(sc.cam);
    f.camera(cam);
    f.backlight({ sunX: 860, sunY: 404, sunRadius: 300 });
    hills(f);
    f.fog({ yCenter: 520, height: 170, alpha: 0.3, drift: 6 });
    f.layer('L4', (c, env) => {
      ground(f, c, env);
      f.cached(`${ID}/booth/${env.mood.id}`, 560, 640, (cc) => {
        cc.translate(-(BOOTH6.x - 100), -(BOOTH6.y - 140));
        galleryBooth(cc, env, BOOTH6, 'back');
      })(c, BOOTH6.x - 100, BOOTH6.y - 140);
      counters(c, env, t, b);
      photos(f, c, env, t, b);
      sketch(c, env, t, b);
      f.cached(`${ID}/curtains/${env.mood.id}`, 400, 320, (cc) => {
        cc.translate(-(BOOTH6.x - 20), -(BOOTH6.y - 10));
        galleryBooth(cc, env, BOOTH6, 'front');
      })(c, BOOTH6.x - 20, BOOTH6.y - 10);
      dealHand(c, env, t, tq, b, cam);
    });
    f.rim({ x: 0.35, y: -1 });
    near(f);
    // type (screen-locked)
    const tenv = { t, mood: f.mood, seed: 706 };
    placeStamp(f.c, { place: 'The learned gallery', date: '14 Oct 2026', style: 'mono', x: 48, y: 64, at: b.stage, dur: b.counters + 1.6 - b.stage, fade: 0.45 }, tenv);
    paperSlip(f.c, { mood: f.mood } as PaintEnv, {
      lines: ['seeded random start:', 'every photo a small square'],
      x: 1068,
      y: 70,
      t,
      inkAt: b.pile + 0.35,
      size: 25,
      id: `${ID}-pile`,
      pin: true,
      tilt: 0.015,
    });
  },
});

// ------------------------------------------------------------------ the hills (L1 far, L2 middle, L3 near)
const OS1 = overscan(LAYERS.L1, [CAM_A, CAM_B], 40);
const OS2 = overscan(LAYERS.L2, [CAM_A, CAM_B], 40);
const OS3 = overscan(LAYERS.L3, [CAM_A, CAM_B], 40);
function hills(f: Frame) {
  f.layer('L1', (c, env) => {
    f.cached(`${ID}/L1/${env.mood.id}`, OS1.w, OS1.h, (cc) => {
      cc.translate(-OS1.x, -OS1.y);
      for (const [y, amp, fr, seed, hz] of [
        [372, 26, 0.55, 3, 0.55],
        [404, 22, 0.8, 5, 0.3],
      ] as const) {
        const r = ridgePath({ y, amp, f: fr, seed, x0: OS1.x, x1: OS1.x + OS1.w, bottom: OS1.y + OS1.h, pines: 40, pineH: 9 });
        cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, hz);
        cc.fill(r.p);
      }
    })(c, OS1.x, OS1.y);
  });
  f.fog({ yCenter: 430, height: 110, alpha: 0.4, drift: 5 });
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const r = ridgePath({ y: 468, amp: 30, f: 0.7, seed: 11, x0: OS2.x, x1: OS2.x + OS2.w, bottom: OS2.y + OS2.h, pines: 70, pineH: 15 });
      cc.fillStyle = env.fill('set');
      cc.fill(r.p);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, OS3.w, OS3.h, (cc) => {
      cc.translate(-OS3.x, -OS3.y);
      const r = ridgePath({ y: 566, amp: 22, f: 0.45, seed: 19, x0: OS3.x, x1: OS3.x + OS3.w, bottom: OS3.y + OS3.h, pines: 22, pineH: 26 });
      cc.fillStyle = env.fill('set');
      cc.fill(r.p);
      // a lone bare tree on the near ridge, left of the booth
      tree(cc, 170, r.yAt(170) + 4, 120, env);
    })(c, OS3.x, OS3.y);
  });
  f.fog('B');
}
function tree(c: C2, x: number, y: number, hgt: number, env: PaintEnv) {
  const p = new Path2D();
  const br = (x0: number, y0: number, a: number, len: number, wd: number, d: number, s: number) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    const nx = -Math.sin(a) * wd * 0.5, ny = Math.cos(a) * wd * 0.5;
    p.moveTo(x0 + nx, y0 + ny);
    p.lineTo(x1 + nx * 0.6, y1 + ny * 0.6);
    p.lineTo(x1 - nx * 0.6, y1 - ny * 0.6);
    p.lineTo(x0 - nx, y0 - ny);
    p.closePath();
    if (d > 0) for (let i = 0; i < 2 + (s % 2); i++) br(x1, y1, a + (((s * 7 + i * 13) % 10) / 10 - 0.5) * 1.3, len * 0.68, wd * 0.62, d - 1, s * 3 + i);
  };
  br(x, y, -Math.PI / 2, hgt * 0.36, hgt * 0.07, 5, 5);
  c.fillStyle = env.fill('set');
  c.fill(p);
}

/** the meadow the booth stands on (action plane), its edge in grass */
const OS4 = overscan(LAYERS.L4, [CAM_A, CAM_B], 30);
function ground(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/ground/${env.mood.id}`, OS4.w, OS4.y + OS4.h - 600, (cc) => {
    cc.translate(-OS4.x, -600);
    cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.45);
    cc.fill(meadow(OS4.x, OS4.x + OS4.w, 664, OS4.y + OS4.h, 7, 10));
  })(c, OS4.x, 600);
}

// ------------------------------------------------------------------ the counters on the apron
const COUNTERS = [
  { value: 244, text: '244', unit: 'weights' },
  { value: 6320, text: '6,320', unit: 'operations' },
  { value: 8, text: '8', unit: 'layers' },
];
function counters(c: C2, env: PaintEnv, t: number, b: Beats) {
  const A = boothGeo(BOOTH6).apron;
  const xs = [A.x + A.w * 0.2, A.x + A.w * 0.5, A.x + A.w * 0.8];
  COUNTERS.forEach((k, i) => {
    const at = b.counters + i * 0.2;
    const u = Math.floor(seg(t, at, at + 0.55) * 8) / 8; // the drums click up in eight detents, on twos
    brassCounter(c, env, { x: xs[i], y: A.y + A.h * 0.3, value: k.value, text: k.text, unit: k.unit, u, size: 21, alpha: 1, id: `${ID}-c${i}` });
  });
}

// ------------------------------------------------------------------ photos: the seeded pile
function photos(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  if (t < b.pile - 0.2) return;
  PHOTO_ORDER.forEach((k, i) => {
    const at = b.pile - 0.12 + i * 0.09;
    const u = seg(t, at, at + 0.32);
    if (u <= 0) return;
    const r = stageRect(BOOTH6, GAL.pile[k]);
    const drop = (1 - u) * 26;
    const art = f.cached(`${ID}/photo${k}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, k, PHOTO_BAKE.w, PHOTO_BAKE.h));
    photoCard(c, env, art, { x: r.x, y: r.y - drop, w: r.w, h: r.h }, { alpha: Math.min(1, u * 1.6), shadow: 0.25 });
  });
}

// ------------------------------------------------------------------ the sketch: ten cut-paper rectangles, dealt
const DEAL_DT = 1 / 6; // one rectangle every two twos-ticks
function dealTimes(b: Beats) {
  return DEAL.map((_, i) => b.rects + i * DEAL_DT);
}
function sketch(c: C2, env: PaintEnv, t: number, b: Beats) {
  const T = dealTimes(b);
  DEAL.forEach((ti, i) => {
    if (t < T[i]) return;
    const r = stageRect(BOOTH6, GAL.targets[ti]);
    const lift = 3 * (1 - seg(t, T[i], T[i] + 0.12));
    sketchFrame(c, env, r, { seed: 30 + ti, lift: lift + 1.2 });
  });
}

/** the narrator's hand (lower LEFT), carrying each rectangle to its place, on twos */
function dealHand(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, cam: Camera3) {
  const T = dealTimes(b);
  const tIn = b.rectsIn + 0.05;
  const tOut = T[T.length - 1] + 0.12;
  if (tq < tIn || tq > tOut + 0.75) return;
  const E = hands.entry(cam, 'L4');
  const scale = 0.62;
  const centre = (i: number) => {
    const r = stageRect(BOOTH6, GAL.targets[DEAL[i]]);
    return { x: r.x + r.w * 0.5, y: r.y + r.h * 0.5 };
  };
  let at: { x: number; y: number };
  let carrying = -1;
  if (tq < T[0]) {
    // in from the lower left, already holding the large rectangle
    const u = seg(tq, tIn, T[0]);
    const off = { x: E.R.x + 120, y: E.R.y - 150 };
    at = { x: off.x + (centre(0).x - off.x) * u, y: off.y + (centre(0).y - off.y) * u - Math.sin(Math.PI * u) * 30 };
    carrying = 0;
  } else if (tq <= T[T.length - 1]) {
    let i = 0;
    while (i < T.length - 1 && tq >= T[i + 1]) i++;
    const u = seg(tq, T[i] + 0.04, T[i + 1] ?? T[i] + DEAL_DT);
    const a = centre(i), z = centre(Math.min(T.length - 1, i + 1));
    at = { x: a.x + (z.x - a.x) * u, y: a.y + (z.y - a.y) * u };
    carrying = i + 1 < T.length && tq > T[i] + 0.04 ? i + 1 : -1;
  } else {
    const u = seg(tq, tOut, tOut + 0.7);
    const a = centre(T.length - 1);
    const off = { x: E.R.x + 60, y: E.R.y - 40 };
    at = { x: a.x + (off.x - a.x) * u, y: a.y + (off.y - a.y) * u };
  }
  // the rectangle being carried rides under the fingers
  if (carrying >= 0) {
    const r = stageRect(BOOTH6, GAL.targets[DEAL[carrying]]);
    sketchFrame(c, env, { x: at.x - r.w / 2, y: at.y - r.h / 2 - 4, w: r.w, h: r.h }, { seed: 30 + DEAL[carrying], lift: 6 });
  }
  const arm = hands.reach(E.R, { x: at.x + 6, y: at.y + 8 }, carrying >= 0 ? 'pinch' : 'rest', 118 * scale, { sleeve: 'linen' });
  hands.draw(c, { right: arm, scale }, env);
}

// ------------------------------------------------------------------ near plane: tall grasses and a fence post (L5)
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, OS5.w, OS5.y + OS5.h - 560, (cc) => {
      cc.translate(-OS5.x, -560);
      cc.fillStyle = env.fill('fg');
      const g = new Path2D();
      const blade = (x: number, y: number, h: number, lean: number) => {
        g.moveTo(x - 3, y);
        g.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
        g.quadraticCurveTo(x + lean * 0.5 + 2, y - h * 0.55, x + 3, y);
        g.closePath();
      };
      for (let i = 0; i < 46; i++) {
        const left = i < 26;
        const x = left ? OS5.x + (i / 26) * 300 : OS5.x + OS5.w - ((i - 26) / 20) * 240;
        const y = OS5.y + OS5.h + 10;
        blade(x, y, 110 + ((i * 37) % 90), ((i * 53) % 60) - 30);
      }
      // a split-rail fence post at the right edge, a rail running out of frame
      const fx = OS5.x + OS5.w - 150;
      g.rect(fx, 610, 26, OS5.y + OS5.h - 600);
      g.moveTo(fx - 10, 604);
      g.lineTo(fx + 36, 598);
      g.lineTo(fx + 36, 612);
      g.lineTo(fx - 10, 616);
      g.closePath();
      g.rect(fx + 20, 640, 300, 16);
      cc.fill(g);
    })(c, OS5.x, 560);
  });
}
