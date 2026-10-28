/**
 * ch07-s07 — WHO GOES WHERE (scene, dawnGold; cut in; 10.63 s on the locked clock).
 *   L0715 "Before each step, plain JavaScript pairs each photo with a rectangle. The network learns where.
 *          JavaScript decides who."
 *
 * A two-shot beside the gallery stage: the seating clerk (cast seating-clerk: small, sleeve garters, browline frames,
 * the clipboard as his seating chart, a pale paper face ruled in ink) stands in the FOREGROUND left on the near meadow,
 * in plain near-black ink, no glow at all: he is ordinary JavaScript, outside the network. The booth (the same booth as
 * ch07-s06 and ch07-s09: the counter apron on its two A-trestles, the counters dimmed) stands further back on its own
 * meadow, a bank of fog between them; the clerk's head overlaps the booth's left post. On its screen the Story sketch
 * and the seeded pile, exactly as ch07-s06 left them. The camera trucks a little right.
 *
 * TEACHES, word by word (the pairing is the gallery's own, sets/data/ch07-s06-gallery.json: the min-cost assignment
 * the page computes before step 1; the big rectangle is paired like any other):
 *   Before (0.60)   the clerk lifts his clipboard to read it
 *   pairs (3.29)    his pencil runs down the chart and a fine dotted thread springs from each of the ten rectangles to
 *                   one photo in the pile, each pairing in turn (a dry tick each); the slip pins:
 *                   "min-cost assignment · ordinary JavaScript · before every step"
 *   where (7.07)    rack focus to the stage (the clerk softens): behind the paper screen the network's copper threads
 *                   glow faintly through, converging on the pile, and every photo is tugged a hair (8 px) along its
 *                   dotted thread toward its partner
 *   who (9.27)      rack back to the clerk; his pencil taps the chart once (two frames, a 9 px drop) and the dotted
 *                   pairings darken and hold
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
  boothGeo,
  brassCounter,
  galInk,
  galleryBooth,
  meadow,
  photoArt,
  photoCard,
  pileSquare,
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
/** the booth behind and right, on a mid plane (z 1300), the same geometry as ch07-s06 / s09, its feet on a meadow at
 *  y 600 (rest-screen px), about 20 % smaller in frame than before so the clerk can stand in front of it */
const ZS = 1300;
const B7: Booth = { x: 560, y: 138, w: 370, ground: 600 };
/** the clerk on the action plane in the FOREGROUND (feet at y 700), about 45 % of the frame's height; his head
 *  overlaps the booth's left post */
const CLERK = { x: 512, y: 702, scale: 1.41 };
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
    pt.to(P.tap, { at: b.who - 0.3, dur: 0.17, force: true });
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
      f.cached(`${ID}/meadow/${env.mood.id}`, OSS.w, OSS.y + OSS.h - 560, (cc) => {
        cc.translate(-OSS.x, -560);
        cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.55);
        cc.fill(meadow(OSS.x, OSS.x + OSS.w, B7.ground - 8, OSS.y + OSS.h, 3, 10));
      })(c, OSS.x, 560);
      f.cached(`${ID}/booth/${env.mood.id}`, 560, 640, (cc) => {
        cc.translate(-(B7.x - 100), -(B7.y - 140));
        galleryBooth(cc, env, B7, 'back');
      })(c, B7.x - 100, B7.y - 140);
      network(c, env, t, b);
      photos(c, env, t, b);
      sketch(c, env);
      f.cached(`${ID}/curtains/${env.mood.id}`, 400, 320, (cc) => {
        cc.translate(-(B7.x - 20), -(B7.y - 10));
        galleryBooth(cc, env, B7, 'front');
      })(c, B7.x - 20, B7.y - 10);
      counters(c, env);
      threads(c, env, t, b);
    });
    // a bank of fog between the booth's meadow and the clerk's
    f.fog({ yCenter: 612, height: 80, alpha: 0.34, drift: 4 });
    f.fog('B');
    // the clerk: plain near-black ink, no glow, no light floor (the darkest shape in frame)
    const ps = pt.sample(t);
    const pose = withLife(ps.pose, tq, 47, 1);
    const tap = tapDrop(tq, b);
    const draw = (c: C2, env: PaintEnv) => {
      const o = { x: CLERK.x, y: CLERK.y, facing: ps.facing, pose, scale: CLERK.scale, ink: PUPPET_NEAR_BLACK, light: { x: 0.8, y: -1, floor: 0 }, edgeRim: { x: 0.8, y: -1, px: 2.4, alpha: 0.85, warm: 0.62 } };
      cast['seating-clerk'].draw(c, o, env);
      clerkDetails(c, env, o, ps.pose.angles?.shoulderF ?? 52, tap);
    };
    if (clerkBlur < 0.35) {
      f.layer('L4', (c, env) => {
        ground(f, c, env);
        draw(c, env);
      });
      f.rim({ x: 0.5, y: -1 });
    } else {
      f.layer('L4', (c, env) => ground(f, c, env));
      f.layer({ id: 'Lclerk', z: 1000, haze: 0, blur: clerkBlur }, (c, env) => draw(c, env));
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

// ------------------------------------------------------------------ the booth's own meadow and its counters
const OSS = overscan({ z: ZS }, [CAM_A, CAM_B], 40);
/** the three counters of ch07-s06, set and dimmed (they are not this shot's subject, but the booth is the same booth) */
function counters(c: C2, env: PaintEnv) {
  const A = boothGeo(B7).apron;
  const vals = [
    { value: 244, text: '244', unit: 'weights' },
    { value: 6320, text: '6,320', unit: 'operations' },
    { value: 8, text: '8', unit: 'layers' },
  ];
  vals.forEach((k, i) => brassCounter(c, env, { x: A.x + A.w * (0.2 + 0.3 * i), y: A.y + A.h * 0.3, value: k.value, text: k.text, unit: k.unit, u: 1, size: 20, alpha: 0.5, id: `${ID}-c${i}` }));
}

// ------------------------------------------------------------------ the network behind the screen
/**
 * The network's copper threads, strung BEHIND the paper screen: seen only as they glow through it on 'where', soft and
 * warm, every one converging on the pile (a representative weave, no per-thread claim: the gallery's 244 weights are
 * not drawn one by one).
 */
const THREADS = Array.from({ length: 16 }, (_, i) => {
  // anchors around the screen's border, clockwise from the top-left
  const u = (i + 0.5) / 16;
  const per = u * 4;
  const side = Math.floor(per), f = per - side;
  const p = side === 0 ? [f, 0] : side === 1 ? [1, f] : side === 2 ? [1 - f, 1] : [0, 1 - f];
  return { x: p[0], y: p[1], bow: (((i * 37) % 9) - 4) * 0.012 };
});
/** the pile's centre (stage fractions): the mean of the ten photos' centres */
const PILE_C = GAL.pile.reduce((a, r) => ({ x: a.x + (r[0] + r[2] / 2) / 10, y: a.y + (r[1] + r[3] / 2) / 10 }), { x: 0, y: 0 });
function network(c: C2, env: PaintEnv, t: number, b: Beats) {
  const g = seg(t, b.where - 0.15, b.where + 0.5) * (1 - 0.5 * seg(t, b.where + 1.4, b.where + 2.4));
  if (g <= 0.003) return;
  const S = stageRect(B7, [0, 0, 1, 1]);
  const pc = { x: S.x + PILE_C.x * S.w, y: S.y + PILE_C.y * S.h };
  c.save();
  c.beginPath();
  c.rect(S.x, S.y, S.w, S.h);
  c.clip();
  const path = new Path2D();
  for (const th of THREADS) {
    const x0 = S.x + th.x * S.w, y0 = S.y + th.y * S.h;
    const mx = (x0 + pc.x) / 2 - (pc.y - y0) * th.bow * 4, my = (y0 + pc.y) / 2 + (pc.x - x0) * th.bow * 4;
    path.moveTo(x0, y0);
    path.quadraticCurveTo(mx, my, pc.x, pc.y);
  }
  const cu = mixLab(copperOf(env, 0.5), '#8a4a20', 0.25);
  // seen through paper: a wide soft bloom, then the thread itself, both at about a third
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(cu, 0.12 * g);
  c.lineWidth = px(c, 9);
  c.stroke(path);
  c.strokeStyle = withAlpha(cu, 0.36 * g);
  c.lineWidth = px(c, 2.4);
  c.stroke(path);
  // where they meet, a faint warm glow behind the pile
  const gl = c.createRadialGradient(pc.x, pc.y, 0, pc.x, pc.y, S.w * 0.22);
  gl.addColorStop(0, withAlpha(copperOf(env, 0.9), 0.22 * g));
  gl.addColorStop(1, withAlpha(copperOf(env, 0.9), 0));
  c.fillStyle = gl;
  c.fillRect(pc.x - S.w * 0.22, pc.y - S.w * 0.22, S.w * 0.44, S.w * 0.44);
  c.restore();
}

// ------------------------------------------------------------------ the pile, tugged a hair on 'where'
/** photo k's paired rectangle (the min-cost assignment before step 1: rectangle t → photo pair0[t]) */
const RECT_OF = GAL.pile.map((_, k) => GAL.pair0.indexOf(k));
/** how far each photo has been tugged along its thread (rest px): 8 px over 'where' → +0.9 s */
const TUG_PX = 8;
function photoRect(k: number, tug: number) {
  const r = stageRect(B7, pileSquare(k));
  if (tug <= 0) return r;
  const T = stageRect(B7, GAL.targets[RECT_OF[k]]);
  const dx = T.x + T.w / 2 - (r.x + r.w / 2), dy = T.y + T.h / 2 - (r.y + r.h / 2);
  const L = Math.hypot(dx, dy) || 1;
  return { ...r, x: r.x + (dx / L) * TUG_PX * tug, y: r.y + (dy / L) * TUG_PX * tug };
}
const tugAt = (t: number, b: Beats) => seg(t, b.where - 0.05, b.where + 0.9);
function photos(c: C2, env: PaintEnv, t: number, b: Beats) {
  const tug = tugAt(t, b);
  for (const k of PHOTO_ORDER) {
    // drawn live: inside a blurred layer a cached bitmap would land beneath the card's paper
    const art = (cc: C2, x: number, y: number) => {
      cc.save();
      cc.translate(x, y);
      photoArt(cc, env, k, PHOTO_BAKE.w, PHOTO_BAKE.h);
      cc.restore();
    };
    photoCard(c, env, art, photoRect(k, tug), { shadow: 0.25 });
  }
}
function sketch(c: C2, env: PaintEnv) {
  GAL.targets.forEach((r, ti) => sketchFrame(c, env, stageRect(B7, r), { seed: 30 + ti, lift: 1.2 }));
}

// ------------------------------------------------------------------ the dotted pairings
const PAIR_DT = 0.2;
function threads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const tug = tugAt(t, b);
  // on 'who' the pairings darken (about 15 %) and stay so: they hold
  const hold = seg(t, b.who - 0.02, b.who + 0.1);
  const col = mixLab(galInk(env), '#000000', 0.18 * hold);
  GAL.targets.forEach((tr, ti) => {
    const at = b.pair + 0.05 + ti * PAIR_DT;
    const u = seg(t, at, at + 0.22);
    if (u <= 0) return;
    const R = stageRect(B7, tr);
    const pr = photoRect(GAL.pair0[ti], tug);
    // from a pin at the rectangle's top-left inner corner to the photo's centre
    const a = { x: R.x + Math.min(R.w * 0.5, 22), y: R.y + Math.min(R.h * 0.5, 19) };
    const z = { x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 };
    const e = { x: a.x + (z.x - a.x) * u, y: a.y + (z.y - a.y) * u };
    c.save();
    c.strokeStyle = withAlpha(col, 0.82 + 0.16 * hold);
    c.lineWidth = px(c, 2.5 * (1 + 0.15 * hold));
    c.lineCap = 'round';
    c.setLineDash([px(c, 0.1), px(c, 6.5)]);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(e.x, e.y);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = col;
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

// ------------------------------------------------------------------ the clerk's period detail and his chart
/** the pencil's tap on 'who': two twos-frames (1/6 s) at a 9 px drop, then back */
function tapDrop(tq: number, b: Beats) {
  const t0 = Math.floor(b.who * 12) / 12;
  return tq >= t0 && tq < t0 + 2 / 12 ? 9 : 0;
}
type ClerkOpts = Parameters<(typeof cast)['seating-clerk']['anchor']>[0];
/**
 * Drawn over the puppet (review r1, period-detail rule): the clipboard's pale paper face with the seating chart ruled
 * in ink and a clip at the top, the pencil in the far hand (it taps on 'who'), a pale sleeve-garter band on the near
 * upper arm and a glint on his lens. All in the figure's own layer, so they blur with him on the rack.
 */
function clerkDetails(c: C2, env: PaintEnv, o: ClerkOpts, shoulderF: number, tap: number) {
  const P = cast['seating-clerk'];
  const H = 230 * CLERK.scale;
  const dir = o.facing === 'left' ? -1 : 1;
  const paper = mixLab('#f2e6c8', env.mood.halo, 0.2);
  const ink = '#2a2118';
  // the clipboard: a dark board, the paper face, ruled lines, the clip
  const hf = P.anchor(o, 'handF');
  const bw = H * 0.1, bh = H * 0.13;
  c.save();
  c.translate(hf.x + dir * bw * 0.05, hf.y - bh * 0.12);
  c.rotate(-dir * 0.22);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-bw / 2 - 1.5, -bh / 2 - 1.5, bw + 3, bh + 3);
  c.fillStyle = paper;
  c.fillRect(-bw / 2 + 1.5, -bh / 2 + 4, bw - 3, bh - 6);
  c.strokeStyle = withAlpha(ink, 0.85);
  c.lineWidth = Math.max(px(c, 1.3), 1);
  for (let i = 0; i < 4; i++) {
    const y = -bh / 2 + bh * (0.3 + i * 0.16);
    c.beginPath();
    c.moveTo(-bw / 2 + 4, y);
    c.lineTo(bw / 2 - 4 - (i % 2) * 5, y);
    c.stroke();
  }
  c.fillStyle = mixLab('#6a5a46', env.mood.core, 0.25);
  c.fillRect(-bw * 0.22, -bh / 2 - 3, bw * 0.44, 7);
  c.fillStyle = withAlpha('#fff3d6', 0.55);
  c.fillRect(-bw * 0.22, -bh / 2 - 3, bw * 0.44, 1.6);
  c.restore();
  // the pencil in the far hand, its point toward the chart; on 'who' it drops 9 px onto the chart for two frames
  const hb = P.anchor(o, 'handB');
  const tip = { x: hb.x + dir * H * 0.03, y: hb.y - H * 0.02 + tap };
  c.save();
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineCap = 'round';
  c.lineWidth = Math.max(H * 0.012, 2);
  c.beginPath();
  c.moveTo(tip.x, tip.y);
  c.lineTo(tip.x - dir * H * 0.05, tip.y - H * 0.07);
  c.stroke();
  c.restore();
  // the sleeve garter: a pale band round the near upper arm, a third of the way down from the shoulder
  const head = P.anchor(o, 'head');
  const sh = { x: head.x - dir * H * 0.02, y: head.y + H * 0.2 };
  const a = (shoulderF * Math.PI) / 180;
  const ua = { x: dir * Math.sin(a), y: Math.cos(a) };
  const gp = { x: sh.x + ua.x * H * 0.07, y: sh.y + ua.y * H * 0.07 };
  c.save();
  c.translate(gp.x, gp.y);
  c.rotate(Math.atan2(ua.y, ua.x) + Math.PI / 2);
  c.fillStyle = withAlpha(mixLab('#e8d9b8', env.mood.core, 0.3), 0.9);
  c.fillRect(-H * 0.03, -H * 0.006, H * 0.06, H * 0.012);
  c.restore();
  // the lens glint (browline frames): a small warm arc on the lens facing the sun
  const eye = P.anchor(o, 'eye');
  c.save();
  c.strokeStyle = withAlpha(mixLab('#fff3d6', env.mood.core, 0.4), 0.9);
  c.lineWidth = Math.max(px(c, 1.6), 1.2);
  c.beginPath();
  c.arc(eye.x + dir * H * 0.008, eye.y + H * 0.004, H * 0.011, -Math.PI * 0.55, Math.PI * 0.15);
  c.stroke();
  c.restore();
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
