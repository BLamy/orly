/**
 * ch07-s07 — WHO GOES WHERE (scene, dawnGold; cut in; 10.63 s on the locked clock).
 *   L0715 "Before each step, plain JavaScript pairs each photo with a rectangle. The network learns where.
 *          JavaScript decides who."
 *
 * A two-shot beside the gallery stage: the seating clerk (cast seating-clerk: small, sleeve garters, browline frames,
 * the clipboard as his seating chart) stands in the foreground left, in plain black ink, no glow at all: he is ordinary
 * JavaScript, outside the network. The booth stands behind him and to the right among the misty hills, the Story sketch
 * and the seeded pile on its screen exactly as ch07-s06 left them. The camera trucks a little right.
 *
 * TEACHES, word by word (the pairing is the gallery's own, sets/data/ch07-s06-gallery.json: the min-cost assignment
 * the page computes before step 1; the big rectangle is paired like any other):
 *   Before (0.60)   the clerk lifts his clipboard to read it
 *   pairs (3.29)    his pencil runs down the chart and a fine dotted thread springs from each of the ten rectangles to
 *                   one photo in the pile, each pairing in turn (a dry tick each); the slip pins:
 *                   "min-cost assignment · ordinary JavaScript · before every step"
 *   where (7.07)    rack focus to the stage (the clerk softens): behind the paper screen the network's copper threads
 *                   glow faintly through, and every photo is tugged a hair toward its partner (the real first Adam step)
 *   who (9.27)      rack back to the clerk; he taps the chart once; the dotted pairings hold
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, cam3Interp, defineShot, mixLab, overscan, poseTrack, withAlpha, withLife } from '../../../film';
import { cast } from '../cast';
import { copperOf } from '../sets/narratorHands';
import { paperSlip } from '../sets/ch06-s01-clockroom';
import {
  GAL,
  PHOTO_BAKE,
  galInk,
  galleryBooth,
  lerpRect,
  meadow,
  photoArt,
  photoCard,
  px,
  ridgePath,
  seg,
  sketchFrame,
  stageRect,
  twos,
  type Booth,
} from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
const ID = 'ch07-s07';

// ------------------------------------------------------------------ staging
/** the booth behind and right, on a mid plane (z 1300): rest-screen px */
const ZS = 1300;
const B7: Booth = { x: 604, y: 182, w: 466, ground: 792 };
/** the clerk on the action plane, foreground left (feet) */
const CLERK = { x: 286, y: 668, scale: 1.18 };
const CAM_A: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const CAM_B: Camera3 = { x: 676, y: 362, z: 46, lens: 1 };
const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
/** photos stacked as the page stacks them: smaller above larger */
const PHOTO_ORDER = GAL.pile.map((r, k) => ({ k, a: r[2] * r[3] })).sort((p, q) => q.a - p.a).map((p) => p.k);

// clerk poses (facing right, toward the stage)
const P = {
  read: { angles: { hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 2, neck: 8, head: 10, shoulderF: 52, elbowF: 84, wristF: -14, shoulderB: -6, elbowB: 18, wristB: 4 }, handF: 'grip', handB: 'relaxed' } as Pose,
  pencil: { angles: { hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 4, neck: 9, head: 12, shoulderF: 52, elbowF: 84, wristF: -14, shoulderB: 44, elbowB: 92, wristB: -8 }, handF: 'grip', handB: 'pinch' } as Pose,
  look: { angles: { hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 0, neck: 2, head: -4, shoulderF: 40, elbowF: 88, wristF: -10, shoulderB: 30, elbowB: 96, wristB: -6 }, handF: 'grip', handB: 'pinch' } as Pose,
  tap: { angles: { hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 3, neck: 8, head: 10, shoulderF: 52, elbowF: 84, wristF: -14, shoulderB: 50, elbowB: 76, wristB: -20 }, handF: 'grip', handB: 'point' } as Pose,
};

interface Beats {
  clerk: number;
  pair: number;
  where: number;
  who: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: 0, dur: T.duration, ease: sine });
    const b: Beats = { clerk: T.beat('clerk'), pair: T.beat('pair'), where: T.beat('where'), who: T.beat('who'), D: T.duration };
    const pt = poseTrack(tl, 'clerk', 'stand', { facing: 'right' });
    pt.to(P.read, { at: b.clerk - 0.1, dur: 0.5 });
    pt.to(P.pencil, { at: b.pair - 0.45, dur: 0.4 });
    pt.loop('write', { at: b.pair, dur: 2.1 });
    pt.to(P.look, { at: b.where - 0.35, dur: 0.6 });
    pt.to(P.tap, { at: b.who - 0.25, dur: 0.17, force: true });
    pt.to(P.pencil, { at: b.who + 0.09, dur: 0.17, force: true });
    tl.hold(0, T.duration);
    return { tl, cam, b, pt };
  },
  paint(f, s, sc) {
    const { b, pt } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = s.get(sc.cam);
    f.camera(cam);
    f.backlight({ sunX: 1040, sunY: 470, sunRadius: 280 });
    hills(f);
    // the rack focus: the stage softens behind the clerk, sharpens on 'where', softens again on 'who'
    const toStage = seg(t, b.where - 0.25, b.where + 0.55) * (1 - seg(t, b.who - 0.2, b.who + 0.5));
    const stageBlur = Math.round((0.75 * (1 - toStage)) * 4) / 4;
    const clerkBlur = 2.6 * toStage;
    const stageL: LayerSpec = { id: 'Lstage', z: ZS, haze: 0.14, blur: stageBlur };
    f.layer(stageL, (c, env) => {
      f.cached(`${ID}/booth/${env.mood.id}/${stageBlur}`, 840, 860, (cc) => {
        cc.translate(-(B7.x - 150), -(B7.y - 200));
        cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.5);
        cc.fill(meadow(B7.x - 150, B7.x + 690, 700, B7.y + 660, 3, 12));
        galleryBooth(cc, env, B7, 'back');
        galleryBooth(cc, env, B7, 'front');
      })(c, B7.x - 150, B7.y - 200);
      network(c, env, t, b);
      photos(f, c, env, t, b);
      sketch(c, env);
      threads(c, env, t, b);
    });
    f.fog('B');
    // the clerk: plain ink, no glow
    const ps = pt.sample(t);
    const pose = withLife(ps.pose, tq, 47, 1);
    const draw = (c: C2, env: PaintEnv) =>
      cast['seating-clerk'].draw(
        c,
        { x: CLERK.x, y: CLERK.y, facing: ps.facing, pose, scale: CLERK.scale, ink: PUPPET_NEAR_BLACK, light: { x: 0.8, y: -1, floor: 0.15 }, edgeRim: { x: 0.8, y: -1, px: 2.4, alpha: 0.85, warm: 0.62 } },
        env,
      );
    if (clerkBlur < 0.35) {
      f.layer('L4', (c, env) => {
        ground(f, c, env);
        draw(c, env);
      });
      f.rim({ x: 0.5, y: -1 });
    } else {
      f.layer('L4', (c, env) => ground(f, c, env));
      f.layer({ id: 'Lclerk', z: 1000, haze: 0.03, blur: clerkBlur }, (c, env) => draw(c, env));
    }
    near(f);
    // the slip
    paperSlip(f.c, { mood: f.mood } as PaintEnv, {
      lines: ['min-cost assignment · ordinary JavaScript', 'before every step'],
      x: 330,
      y: 64,
      t,
      inkAt: b.pair + 0.3,
      size: 25,
      id: `${ID}-slip`,
      pin: true,
      tilt: -0.012,
    });
  },
});

// ------------------------------------------------------------------ hills (L1, L2) and the meadow
const OS1 = overscan(LAYERS.L1, [CAM_A, CAM_B], 40);
const OS2 = overscan(LAYERS.L2, [CAM_A, CAM_B], 40);
function hills(f: Frame) {
  f.layer('L1', (c, env) => {
    f.cached(`${ID}/L1/${env.mood.id}`, OS1.w, OS1.h, (cc) => {
      cc.translate(-OS1.x, -OS1.y);
      for (const [y, amp, fr, seed, hz] of [
        [446, 22, 0.55, 3, 0.5],
        [474, 18, 0.8, 5, 0.32],
      ] as const) {
        const r = ridgePath({ y, amp, f: fr, seed, x0: OS1.x, x1: OS1.x + OS1.w, bottom: OS1.y + OS1.h, pines: 40, pineH: 9 });
        cc.fillStyle = mixLab(env.mood.set, env.mood.haze, hz);
        cc.fill(r.p);
      }
    })(c, OS1.x, OS1.y);
  });
  f.fog({ yCenter: 490, height: 90, alpha: 0.3, drift: 5 });
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const r = ridgePath({ y: 520, amp: 26, f: 0.7, seed: 11, x0: OS2.x, x1: OS2.x + OS2.w, bottom: OS2.y + OS2.h, pines: 70, pineH: 15 });
      cc.fillStyle = env.fill('set');
      cc.fill(r.p);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
}
const OS4 = overscan(LAYERS.L4, [CAM_A, CAM_B], 30);
function ground(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/ground/${env.mood.id}`, OS4.w, OS4.y + OS4.h - 600, (cc) => {
    cc.translate(-OS4.x, -600);
    cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.35);
    cc.fill(meadow(OS4.x, OS4.x + OS4.w, 664, OS4.y + OS4.h, 17, 11));
  })(c, OS4.x, 600);
}

// ------------------------------------------------------------------ the network behind the screen
/**
 * The network's copper threads, strung behind the paper screen: seen only as they glow through it on 'where'
 * (a representative weave, no per-thread claim: the gallery's 244 weights are not drawn one by one).
 */
const THREADS = Array.from({ length: 26 }, (_, i) => {
  const a = (i * 0.618) % 1, b = (i * 0.382 + 0.17) % 1;
  return { x0: 0.04 + a * 0.92, y0: -0.02, x1: 0.04 + b * 0.92, y1: 1.02, sag: (((i * 37) % 11) - 5) * 0.012 };
});
function network(c: C2, env: PaintEnv, t: number, b: Beats) {
  const g = seg(t, b.where - 0.15, b.where + 0.5) * (1 - 0.55 * seg(t, b.where + 1.1, b.where + 2.2));
  if (g <= 0.003) return;
  const S = stageRect(B7, [0, 0, 1, 1]);
  c.save();
  c.beginPath();
  c.rect(S.x, S.y, S.w, S.h);
  c.clip();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = withAlpha(mixLab(copperOf(env, 0.4), '#7a3d18', 0.3), 0.4 * g);
  c.lineWidth = px(c, 2.2);
  for (const th of THREADS) {
    const x0 = S.x + th.x0 * S.w, y0 = S.y + th.y0 * S.h, x1 = S.x + th.x1 * S.w, y1 = S.y + th.y1 * S.h;
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2 + th.sag * S.w, (y0 + y1) / 2, x1, y1);
    c.stroke();
  }
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(copperOf(env, 0.9), 0.07 * g);
  c.lineWidth = px(c, 5);
  for (const th of THREADS) {
    const x0 = S.x + th.x0 * S.w, y0 = S.y + th.y0 * S.h, x1 = S.x + th.x1 * S.w, y1 = S.y + th.y1 * S.h;
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2 + th.sag * S.w, (y0 + y1) / 2, x1, y1);
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the pile, tugged a hair on 'where'
function photos(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  const tug = seg(t, b.where + 0.1, b.where + 0.9);
  for (const k of PHOTO_ORDER) {
    const r = stageRect(B7, lerpRect(GAL.pile[k], GAL.step1[k], tug));
    const art = f.cached(`ch07-s06/photo${k}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, k, PHOTO_BAKE.w, PHOTO_BAKE.h), { blur: 0 });
    photoCard(c, env, art, r, { shadow: 0.25 });
  }
}
function sketch(c: C2, env: PaintEnv) {
  GAL.targets.forEach((r, ti) => sketchFrame(c, env, stageRect(B7, r), { seed: 30 + ti, lift: 1.2 }));
}

// ------------------------------------------------------------------ the dotted pairings
const PAIR_DT = 0.2;
function threads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const tug = seg(t, b.where + 0.1, b.where + 0.9);
  const hold = 1 + 0.25 * Math.max(0, 1 - Math.abs(t - (b.who + 0.15)) / 0.25); // the tap: the threads tighten once
  GAL.targets.forEach((tr, ti) => {
    const at = b.pair + 0.05 + ti * PAIR_DT;
    const u = seg(t, at, at + 0.22);
    if (u <= 0) return;
    const R = stageRect(B7, tr);
    const o = GAL.pair0[ti];
    const pr = stageRect(B7, lerpRect(GAL.pile[o], GAL.step1[o], tug));
    // from a pin at the rectangle's top-left inner corner to the photo's centre
    const a = { x: R.x + Math.min(R.w * 0.5, 26), y: R.y + Math.min(R.h * 0.5, 22) };
    const z = { x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 };
    const e = { x: a.x + (z.x - a.x) * u, y: a.y + (z.y - a.y) * u };
    c.save();
    c.strokeStyle = withAlpha(galInk(env), 0.92);
    c.lineWidth = px(c, 2.6 * hold);
    c.lineCap = 'round';
    c.setLineDash([px(c, 0.1), px(c, 6.5)]);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(e.x, e.y);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = galInk(env);
    c.beginPath();
    c.arc(a.x, a.y, px(c, 4.2), 0, Math.PI * 2);
    c.fill();
    if (u >= 1) {
      c.beginPath();
      c.arc(z.x, z.y, px(c, 3.4), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  });
}

// ------------------------------------------------------------------ near plane: grasses at the lower corners (L5)
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, OS5.w, OS5.y + OS5.h - 520, (cc) => {
      cc.translate(-OS5.x, -520);
      cc.fillStyle = env.fill('fg');
      const g = new Path2D();
      const blade = (x: number, y: number, h: number, lean: number) => {
        g.moveTo(x - 3, y);
        g.quadraticCurveTo(x + lean * 0.4, y - h * 0.6, x + lean, y - h);
        g.quadraticCurveTo(x + lean * 0.5 + 2, y - h * 0.55, x + 3, y);
        g.closePath();
      };
      for (let i = 0; i < 40; i++) {
        const right = i >= 14;
        const x = right ? OS5.x + OS5.w - ((i - 14) / 26) * 300 : OS5.x + (i / 14) * 150;
        blade(x, OS5.y + OS5.h + 10, 120 + ((i * 37) % 110), ((i * 53) % 70) - 35);
      }
      cc.fill(g);
    })(c, OS5.x, 520);
  });
}
