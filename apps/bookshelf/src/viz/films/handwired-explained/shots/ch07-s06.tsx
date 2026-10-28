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
 *   random (4.36)     the ten photos, each a small square (0.18 of the stage a side), drop into a pile near the stage's
 *                     centre, stacked and overlapping, centred exactly where the
 *                     seeded weights put them (smaller above larger, as the page stacks them); the slip pins: "seeded
 *                     random start: every photo a small square". Nothing moves to the rectangles yet.
 *   rectangles (6.95) the narrator's hand rises from below the stage (through a gap between the counters) with the
 *                     cut-paper rectangles
 *   sketch (7.85)     it deals the Story preset's ten rectangles onto the stage one by one, on twos: the large one
 *                     (0.6 × 0.52), the two beside it, then seven cells of the 4 × 2 grid below (the eighth left empty),
 *                     and is gone below frame by 9.6 (the frame ends clean)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, defineShot, mixLab, overscan, placeStamp } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
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
  pileSquare,
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
const CAM_B: Camera3 = { x: 640, y: 440, z: 262, lens: 1 };
/** a long sine ease: the push starts at once and lands softly */
const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
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
    tl.tween(cam, CAM_B, { at: 0, dur: T.duration, ease: sine });
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
    f.backlight({ sunX: 880, sunY: 452, sunRadius: 260 });
    hills(f);
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
      dealHand(c, env, tq, b);
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
  // four planes in clear value steps (review r1): a pale far range (L1), a mid ridge a step darker (L2), the near
  // pine ridge with its lone tree (L3), and (in near()) a dark blurred shoulder rising at the lower left (L5)
  f.layer('L1', (c, env) => {
    f.cached(`${ID}/L1/${env.mood.id}`, OS1.w, OS1.h, (cc) => {
      cc.translate(-OS1.x, -OS1.y);
      for (const [y, amp, fr, seed, hz] of [
        [418, 38, 0.5, 3, 0.66],
        [452, 30, 0.75, 5, 0.5],
      ] as const) {
        const r = ridgePath({ y, amp, f: fr, seed, x0: OS1.x, x1: OS1.x + OS1.w, bottom: OS1.y + OS1.h, pines: 34, pineH: 9 });
        cc.fillStyle = mixLab(env.mood.set, env.mood.haze, hz);
        cc.fill(r.p);
      }
    })(c, OS1.x, OS1.y);
  });
  f.fog({ yCenter: 482, height: 80, alpha: 0.3, drift: 5 });
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const r = ridgePath({ y: 506, amp: 34, f: 0.62, seed: 11, x0: OS2.x, x1: OS2.x + OS2.w, bottom: OS2.y + OS2.h, pines: 60, pineH: 15 });
      cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.3);
      cc.fill(r.p);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, OS3.w, OS3.h, (cc) => {
      cc.translate(-OS3.x, -OS3.y);
      const r = ridgePath({ y: 580, amp: 24, f: 0.45, seed: 19, x0: OS3.x, x1: OS3.x + OS3.w, bottom: OS3.y + OS3.h, pines: 22, pineH: 26 });
      cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.3);
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
    const r = stageRect(BOOTH6, pileSquare(k)); // square on screen (0.18 of the stage's width a side)
    const drop = (1 - u) * 26;
    const art = f.cached(`${ID}/photo${k}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, k, PHOTO_BAKE.w, PHOTO_BAKE.h));
    photoCard(c, env, art, { x: r.x, y: r.y - drop, w: r.w, h: r.h }, { alpha: Math.min(1, u * 1.6), shadow: 0.25 });
  });
}

// ------------------------------------------------------------------ the sketch: ten cut-paper rectangles, dealt
const DEAL_DT = 0.135; // one rectangle every ~1.6 twos-ticks: the last is down by 9.06, the hand gone by 9.6
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

/**
 * The narrator's hand, carrying each rectangle to its place, on twos. It rises from BELOW the stage (review r1: no
 * long diagonal across the frame) and threads one of the apron's two gaps between the brass counters, so the counters
 * stay clear while it deals: each rectangle is held by its bottom edge, at the gap's x where the rectangle spans it.
 */
const HAND_SCALE = 0.7;
/** the apron's two gaps between counters (stage-width fractions): left of 'operations', right of it */
const LANES = [0.307, 0.705];
function grip(i: number) {
  const tr = GAL.targets[DEAL[i]];
  const cx = tr[0] + tr[2] / 2;
  const lane = LANES.reduce((a, l) => (Math.abs(l - cx) < Math.abs(a - cx) ? l : a), LANES[0]);
  const gx = Math.max(tr[0] + 0.02, Math.min(tr[0] + tr[2] - 0.02, lane));
  const r = stageRect(BOOTH6, tr);
  return { x: BOOTH6.x + gx * BOOTH6.w, y: r.y + r.h - 3, lane: BOOTH6.x + lane * BOOTH6.w, r };
}
function dealHand(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const T = dealTimes(b);
  const tIn = b.rectsIn + 0.05;
  const tOut = T[T.length - 1] + 0.06;
  const tGone = Math.min(b.D - 0.45, tOut + 0.5);
  if (tq < tIn || tq >= tGone) return;
  const A = boothGeo(BOOTH6).apron;
  const laneY = A.y + A.h * 0.5;
  const below = 330; // far enough under the stage that the hand starts and ends out of frame
  let at: { x: number; y: number };
  let lane: number;
  let carrying = -1;
  if (tq < T[0]) {
    // up from below, already holding the large rectangle
    const g = grip(0);
    const u = seg(tq, tIn, T[0]);
    at = { x: g.x, y: g.y + (1 - u) * below };
    lane = g.lane;
    carrying = 0;
  } else if (tq <= T[T.length - 1]) {
    let i = 0;
    while (i < T.length - 1 && tq >= T[i + 1]) i++;
    const u = seg(tq, T[i] + 0.03, T[i + 1] ?? T[i] + DEAL_DT);
    const a = grip(i), z = grip(Math.min(T.length - 1, i + 1));
    at = { x: a.x + (z.x - a.x) * u, y: a.y + (z.y - a.y) * u };
    lane = a.lane + (z.lane - a.lane) * u;
    carrying = i + 1 < T.length && tq > T[i] + 0.03 ? i + 1 : -1;
  } else {
    // straight back down out of frame
    const g = grip(T.length - 1);
    const u = seg(tq, tOut, tGone);
    at = { x: g.x, y: g.y + u * below };
    lane = g.lane;
  }
  // the rectangle being carried rides on the fingers, held by its bottom edge
  if (carrying >= 0) {
    const g = grip(carrying);
    sketchFrame(c, env, { x: g.r.x + (at.x - g.x), y: g.r.y + (at.y - g.y) - 4, w: g.r.w, h: g.r.h }, { seed: 30 + DEAL[carrying], lift: 6 });
  }
  // the forearm passes through the lane at the apron's middle: aim the entry along that line, far below
  const dy = Math.max(30, laneY - at.y);
  const lean = (lane - at.x) / dy;
  const entry = { x: at.x + lean * (laneY - at.y + 600), y: laneY + 600 };
  const len = HAND_LEN * HAND_SCALE;
  const arm = hands.reach(entry, { x: at.x, y: at.y }, carrying >= 0 ? 'pinch' : 'rest', len, { sleeve: 'linen' });
  hands.draw(c, { right: arm, scale: HAND_SCALE }, env);
}

// ------------------------------------------------------------------ near plane (L5): a dark shoulder of hill at the lower
// left and a deliberate clump of tall grass and teasels in the lower-right corner, both in frame for the whole push
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, OS5.w, OS5.y + OS5.h - 520, (cc) => {
      cc.translate(-OS5.x, -520);
      cc.fillStyle = env.fill('fg');
      const g = new Path2D();
      const bot = OS5.y + OS5.h + 10;
      // the shoulder: crest ~600 at the left edge, rounding down to the floor by x 470 (the lower-left third)
      const crest = (x: number) => {
        const u = Math.max(0, Math.min(1, (x - 110) / 360));
        return 600 + (0.5 - 0.5 * Math.cos(Math.PI * u)) * 190 + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.11) * 2;
      };
      g.moveTo(OS5.x, bot);
      for (let x = OS5.x; x <= 480; x += 6) g.lineTo(x, crest(x));
      g.lineTo(480, bot);
      g.closePath();
      const blade = (x: number, y: number, h: number, lean: number, w = 3) => {
        g.moveTo(x - w, y);
        g.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
        g.quadraticCurveTo(x + lean * 0.5 + 2, y - h * 0.55, x + w, y);
        g.closePath();
      };
      // grass along the shoulder's crest
      for (let i = 0; i < 26; i++) {
        const x = OS5.x + (i / 26) * (440 - OS5.x);
        blade(x, crest(x) + 3, 26 + ((i * 37) % 30), ((i * 53) % 30) - 15, 2);
      }
      // the clump at the lower right: a dense fan of blades from one root, two teasel stalks above it
      // (rooted at x ~980 so the push carries it from x ~880 to the frame's right edge, never out of frame)
      const root = { x: 985, y: bot };
      for (let i = 0; i < 34; i++) {
        const a = (i / 33 - 0.62) * 1.1 + Math.sin(i * 7.3) * 0.08;
        const h = 170 + ((i * 41) % 90);
        blade(root.x + (i - 17) * 6, root.y, h, Math.sin(a) * h * 0.55, 4);
      }
      for (const [sx, sh, sl] of [
        [940, 300, -26],
        [1010, 262, 14],
      ] as const) {
        const tx = sx + sl, ty = root.y - sh;
        g.moveTo(sx - 2.5, root.y);
        g.quadraticCurveTo(sx + sl * 0.3, root.y - sh * 0.5, tx - 1.5, ty);
        g.lineTo(tx + 1.5, ty);
        g.quadraticCurveTo(sx + sl * 0.3 + 3, root.y - sh * 0.5, sx + 2.5, root.y);
        g.closePath();
        g.ellipse(tx, ty - 14, 8, 17, sl * 0.004, 0, Math.PI * 2);
        // the teasel's spiny bracts
        for (const s of [-1, 1]) {
          g.moveTo(tx, ty - 2);
          g.lineTo(tx + s * 22, ty - 18);
          g.lineTo(tx + s * 3, ty + 1);
          g.closePath();
        }
      }
      cc.fill(g);
    })(c, OS5.x, 520);
  });
}
