/**
 * neural-net-history — ch12-s01's simulation stage (duskRose): the last accomplice is a person, choosing.
 *
 *   hopperStage(f, { key, cams, t, tq, taps })   the whole stage (L0 → L5) for shot-local time t
 *
 * A paper theatre: an arched backdrop onto a rose dusk, a checkerboard simulator floor in perspective (L3),
 * a pendant lamp over it, and THE HOPPER: a one-legged robot cut from black card (torso, thigh, shin, foot)
 * that hops and topples. In front (L4, the one sharp plane), a small desk with two little lit screens side by
 * side, each replaying one of the robot's latest tries; a generic hand (a plain knit cuff, no face) taps the
 * better of the two; the REWARD LANTERN on the desk brightens a fraction with each choice, a pulse of its
 * light runs along a thread to the robot, and with each choice the robot hops a little steadier. A tally card
 * gains one mark per choice. Proscenium valance and curtains in L5.
 *
 * Everything is a pure function of time; the robot and the hand move on twos.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, toScreen, type Rect } from '../../../film/core/multiplane';
import { hands } from '../cast';
import { HAND_LEN } from './narratorHands';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { checkerFloor } from '../../../film/silhouette/architecture';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { clamp01, lerp, sm } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ geometry
export const HOP = {
  /** stage floor (L3 world) */
  floor: { x0: -260, x1: 1540, yBack: 452, yFront: 700, horizon: 382, vpX: 600, tile: 74 },
  /** the robot's foot line on the floor (L3) and start x */
  robotY: 590,
  robotX: 380,
  /** the pendant lamp (L3) */
  lamp: { x: 470, y: 176 },
  /** the desk (L4): top surface y, x span */
  desk: { x0: 728, x1: 1240, y: 612 },
  /** the two screens' faces (L4): centres */
  screens: [
    { x: 902, y: 516 },
    { x: 1094, y: 516 },
  ] as Pt[],
  screen: { w: 172, h: 112 },
  /** the reward lantern (L4) standing at the desk's left end */
  lantern: { x: 772, y: 608 },
  /** the tally card on the desk (L4) */
  tally: { x: 1238, y: 610 },
} as const;

/** the tries: which screen holds the better try for each choice (0 = left, 1 = right) */
export const PICKS = [1, 0, 1] as const;

// ------------------------------------------------------------------------------------------------ the hopper
interface RobotPose {
  /** foot contact x, y (L3 world) */
  x: number;
  y: number;
  /** crouch 0..1 */
  c: number;
  /** lift above the floor (px) */
  h: number;
  /** body lean (radians, + = forward/right) applied at the ankle */
  lean: number;
  /** topple rotation about the toe (radians) */
  fall: number;
  /** 0..1 reset flash (the simulator restarting the episode) */
  reset: number;
  /** 0..1 landing squash */
  squash?: number;
}

interface Episode {
  start: number;
  hops: number;
  fall: boolean;
  wob: number;
  /** hop period (s) and peak height (px) */
  period: number;
  height: number;
  /** x offset of this episode's first foot contact from the robot's start (a continuing run, no reset) */
  x0?: number;
  /** the sim restarted the episode (a reset flicker) */
  reset?: boolean;
}
/** the robot's episodes on the stage: two failures, a better run after the first choice that stops upright, then
 *  (after 'better') the steady run: one small, clean hop every 0.9 s (crouch → launch → air → land → settle),
 *  matching the score's pizzicato hop */
const EPISODES: Episode[] = [
  { start: 0.6, hops: 2, fall: true, wob: 1, period: 0.62, height: 74, reset: true },
  { start: 2.95, hops: 3, fall: true, wob: 0.8, period: 0.62, height: 74, reset: true },
  { start: 5.25, hops: 2, fall: false, wob: 0.45, period: 0.72, height: 46, reset: true },
  { start: 6.9, hops: 99, fall: false, wob: 0.2, period: 0.9, height: 22, x0: 2 },
];
const PERIOD = 0.62;
/** the stage robot's scale: robot, desk and lantern read as one stage */
const ROBOT_S = 1.08;
const STEP = 15;

function episodeAt(t: number): { ep: Episode; local: number; idx: number } {
  let idx = 0;
  for (let i = 0; i < EPISODES.length; i++) if (t >= EPISODES[i].start) idx = i;
  return { ep: EPISODES[idx], local: t - EPISODES[idx].start, idx };
}

/** the robot pose at twos-time tq; `steady` 0..1 damps the wobble as choices accumulate */
export function robotPose(tq: number, steady: number, x0: number = HOP.robotX, y0: number = HOP.robotY): RobotPose {
  const { ep, local } = episodeAt(tq);
  const P = ep.period;
  const hopsDone = Math.floor(Math.max(0, local) / P);
  const fallStart = ep.fall ? ep.hops * P + 0.15 : Infinity;
  const ex = x0 + STEP * (ep.x0 ?? 0);
  const p: RobotPose = { x: ex, y: y0, c: 0, h: 0, lean: 0, fall: 0, reset: ep.reset ? clamp01(1 - local / 0.25) : 0 };
  if (local < 0) return p;
  const wob = ep.wob * (1 - 0.7 * steady);
  if (local < fallStart) {
    if (hopsDone >= ep.hops) {
      // a finished, upright run: stand, breathing a little (a slow crouch on twos)
      p.x = ex + STEP * ep.hops;
      p.c = 0.12 + 0.08 * Math.sin(local * 3.2);
      return p;
    }
    const ph = (local % P) / P;
    const n = hopsDone;
    p.x = ex + STEP * (n + sm((ph - 0.3) / 0.42));
    // crouch (load, deep) → launch → airborne (leg tucked) → landing squash → settle
    if (ph < 0.26) p.c = sm(ph / 0.26);
    else if (ph < 0.32) p.c = 1 - sm((ph - 0.26) / 0.06);
    else if (ph < 0.72) p.c = 0.35 * Math.sin(((ph - 0.32) / 0.4) * Math.PI);
    else if (ph < 0.88) p.c = 0.85 * Math.sin(((ph - 0.72) / 0.16) * (Math.PI / 2));
    else p.c = 0.85 * (1 - sm((ph - 0.88) / 0.12));
    p.h = ph > 0.3 && ph < 0.74 ? ep.height * Math.sin(((ph - 0.3) / 0.44) * Math.PI) : 0;
    p.squash = ph >= 0.72 && ph < 0.9 ? Math.sin(((ph - 0.72) / 0.18) * Math.PI) : 0;
    // the wobble grows hop by hop in a failing episode, settles in a good one
    const grow = ep.fall ? 0.35 + 0.4 * n : 0.6;
    p.lean = 0.12 * wob * grow * Math.sin((local / P) * Math.PI * 2 + 0.6) - (ep.fall ? 0.06 * n * wob : 0);
    return p;
  }
  // topple: tips forward about the toe, lands, lies there
  const u = (local - fallStart) / 0.5;
  p.x = ex + STEP * ep.hops;
  p.lean = -0.2;
  p.fall = (Math.PI / 2 - 0.12) * (u < 1 ? u * u : 1) - (u > 1 && u < 1.25 ? 0.05 * Math.sin(((u - 1) / 0.25) * Math.PI) : 0);
  return p;
}

/** draw the hopper (black card, jointed): foot, shin, a knee disc, thigh, a hip block, a boxy torso and a small
 *  sensor head; origin at the foot, upright; s = scale */
export function drawRobot(c: C, p: RobotPose, s: number, ink: string, rim: string | null) {
  c.save();
  c.translate(p.x, p.y - p.h);
  // topple backward about the heel (away from the desk)
  if (p.fall) {
    c.translate(-16 * s, 0);
    c.rotate(-p.fall);
    c.translate(16 * s, 0);
  }
  c.scale(s, s);
  // landing squash: wider and shorter for a frame or two
  const q = p.squash ?? 0;
  if (q > 0) c.scale(1 + 0.12 * q, 1 - 0.14 * q);
  const shin = 0.5 * p.c + p.lean;
  const thigh = -0.95 * p.c + p.lean;
  const torso = 0.42 * p.c + p.lean;
  const path = new Path2D();
  // foot: a flat bar with a rounded heel and a toe pad
  path.roundRect(-18, -9, 56, 9, 4);
  const ank = { x: 0, y: -7 };
  const knee = { x: ank.x + Math.sin(shin) * 58, y: ank.y - Math.cos(shin) * 58 };
  const hip = { x: knee.x + Math.sin(thigh) * 60, y: knee.y - Math.cos(thigh) * 60 };
  const cap = (a: Pt, b: Pt, w: number) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * w, ny = (dx / L) * w;
    path.moveTo(a.x + nx, a.y + ny);
    path.lineTo(b.x + nx, b.y + ny);
    path.arc(b.x, b.y, w, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
    path.lineTo(a.x - nx, a.y - ny);
    path.arc(a.x, a.y, w, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
    path.closePath();
  };
  cap(ank, knee, 6);
  cap(knee, hip, 8.5);
  // the knee: a round joint disc, wider than the leg
  path.moveTo(knee.x + 11, knee.y);
  path.arc(knee.x, knee.y, 11, 0, Math.PI * 2);
  c.fillStyle = ink;
  c.fill(path);
  // hip block + torso + head, rotated with the torso about the hip
  c.save();
  c.translate(hip.x, hip.y);
  c.rotate(torso);
  const body = new Path2D();
  body.roundRect(-20, -14, 40, 22, 5); // the hip block
  body.roundRect(-16, -78, 34, 62, 6); // the torso box
  body.roundRect(-9, -98, 22, 16, 4); // the sensor head
  body.rect(-2, -84, 6, 8); // its neck
  c.fill(body);
  // a backlight slit across the torso (a cut-line) and the head's lens hole
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillRect(-10, -52, 22, 1.6);
  c.beginPath();
  c.arc(6, -90, 2.6, 0, Math.PI * 2);
  c.arc(0, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if (rim) {
    c.strokeStyle = rim;
    c.lineWidth = 1.3 / s;
    c.beginPath();
    c.moveTo(-16, -20);
    c.lineTo(-16, -72);
    c.quadraticCurveTo(-16, -78, -10, -78);
    c.lineTo(12, -78);
    c.moveTo(-9, -88);
    c.lineTo(-9, -94);
    c.quadraticCurveTo(-9, -98, -5, -98);
    c.lineTo(10, -98);
    c.stroke();
  }
  c.restore();
  // the knee's rivet (a hole: the backlight through the card)
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(knee.x, knee.y, 3, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if (rim) {
    c.strokeStyle = rim;
    c.lineWidth = 1.2 / s;
    c.beginPath();
    c.arc(knee.x, knee.y, 11, Math.PI * 1.05, Math.PI * 1.7);
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ caching helpers
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

// ------------------------------------------------------------------------------------------------ the stage
export interface HopperStageOpts {
  key: string;
  cams: Camera3[];
  t: number;
  tq: number;
  /** tap times (shot-local s) */
  taps: number[];
}

/** 0..1 how many choices have reached the robot (a pulse arrives ~0.7 s after each tap) */
export function rewardAt(t: number, taps: number[]): number {
  let k = 0;
  for (const tp of taps) k += sm((t - tp - 0.55) / 0.35);
  return k;
}
/** the lantern's own brightness: a fraction more per choice, flaring briefly on the tap */
export function lanternAt(t: number, taps: number[]): number {
  let k = 0.16;
  for (const tp of taps) k += 0.28 * sm((t - tp - 0.1) / 0.3) + 0.3 * Math.max(0, 1 - Math.abs(t - tp - 0.2) / 0.35);
  return k;
}

export function hopperStage(f: Frame, o: HopperStageOpts) {
  const { t, tq, taps } = o;
  const L = HOP.lamp;
  f.backlight({ sunX: 640, sunY: 360, sunRadius: 460, intensity: 0.85 });
  // (round 1) L1: the cyclorama a step DARKER (a dusk wash over the backlight, ≈ −18% in value) and broken into
  // layered paper ridges: a far range of peaks here, fog, then two nearer ridges on L2 inside the arch
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/hop/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const m = env.mood;
      const wash = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      wash.addColorStop(0, withAlpha(mixLab(m.sky[0], m.ink, 0.35), 0.42));
      wash.addColorStop(0.55, withAlpha(mixLab(m.sky[1], m.ink, 0.3), 0.26));
      wash.addColorStop(1, withAlpha(mixLab(m.sky[2], m.ink, 0.3), 0.2));
      cc.fillStyle = wash;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // the far range: tall, soft-shouldered peaks (palest ridge)
      cc.fillStyle = mixLab(mixLab(m.setHaze, m.sky[1], 0.45), m.ink, 0.08);
      cc.beginPath();
      cc.moveTo(r.x, r.y + r.h);
      for (let x = r.x; x <= r.x + r.w; x += 14) {
        const y = 368 - 46 * Math.sin(x * 0.0062 + 0.4) - 22 * Math.sin(x * 0.019 + 2) - 8 * Math.sin(x * 0.05);
        cc.lineTo(x, y);
      }
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.closePath();
      cc.fill();
    });
  });
  f.fog({ yCenter: 360, height: 90, alpha: 0.2, drift: 3 });
  // L2: the back wall of the little theatre: a wide arch HOLE onto the dusk, panelled jambs, and two nearer paper
  // ridges inside the arch with a fog band between them
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/hop/L2r/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const m = env.mood;
      // the middle ridge: a rolling line one value darker than the far range
      cc.fillStyle = mixLab(mixLab(m.setHaze, m.sky[2], 0.3), m.set, 0.25);
      cc.beginPath();
      cc.moveTo(r.x, 470);
      for (let x = r.x; x <= r.x + r.w; x += 16) cc.lineTo(x, 404 - 26 * Math.sin(x * 0.008 + 1.3) - 9 * Math.sin(x * 0.031));
      cc.lineTo(r.x + r.w, 470);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(m.rim, 0.22);
      cc.lineWidth = 1.2;
      cc.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 16) {
        const y = 404 - 26 * Math.sin(x * 0.008 + 1.3) - 9 * Math.sin(x * 0.031);
        if (x === r.x) cc.moveTo(x, y);
        else cc.lineTo(x, y);
      }
      cc.stroke();
    });
  });
  f.fog({ yCenter: 418, height: 60, alpha: 0.18, drift: -4 });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/hop/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      // the near ridge (darkest of the three), cut low along the arch's foot
      cc.fillStyle = mixLab(mixLab(env.mood.setHaze, env.mood.sky[2], 0.2), env.mood.set, 0.5);
      cc.beginPath();
      cc.moveTo(r.x, 470);
      for (let x = r.x; x <= r.x + r.w; x += 20) cc.lineTo(x, 438 - 18 * Math.sin(x * 0.011 + 0.2) - 8 * Math.sin(x * 0.027 + 1));
      cc.lineTo(r.x + r.w, 470);
      cc.closePath();
      cc.fill();
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.25);
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      // the arch: a round head on two straight jambs
      const ax0 = 170, ax1 = 1110, ay = 452, top = 70;
      const rr = (ax1 - ax0) / 2;
      cc.moveTo(ax0, ay);
      cc.lineTo(ax0, top + rr * 0.55);
      cc.ellipse((ax0 + ax1) / 2, top + rr * 0.55, rr, rr * 0.55, 0, Math.PI, 0, false);
      cc.lineTo(ax1, ay);
      cc.closePath();
      cc.fill('evenodd');
      // rim hairline on the arch and a keystone
      cc.strokeStyle = withAlpha(env.mood.rim, 0.36);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(ax0, ay);
      cc.lineTo(ax0, top + rr * 0.55);
      cc.ellipse((ax0 + ax1) / 2, top + rr * 0.55, rr, rr * 0.55, 0, Math.PI, 0, false);
      cc.lineTo(ax1, ay);
      cc.stroke();
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.45);
      cc.fillRect(626, top - 6, 28, 34);
    });
  });
  f.fog({ yCenter: 200, height: 90, alpha: 0.12, drift: 4 });
  f.fog({ yCenter: 440, height: 220, alpha: 0.22, drift: 5 });
  // L3: the checkerboard simulator floor, the pendant lamp, the robot
  const steady = clamp01(rewardAt(t, taps) / 2.2);
  const rp = robotPose(tq, steady);
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    bake(f, c, `${o.key}/hop/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      checkerFloor(cc, { ...HOP.floor, contrast: 0.42, sheen: [{ x: 640, w: 420 }] }, env);
      // the lamp's cord and shade
      cc.fillStyle = env.fill('ink');
      cc.fillRect(L.x - 1, r.y - 10, 2, L.y - 30 - (r.y - 10));
      cc.beginPath();
      cc.moveTo(L.x - 9, L.y - 34);
      cc.lineTo(L.x + 9, L.y - 34);
      cc.lineTo(L.x + 46, L.y);
      cc.lineTo(L.x - 46, L.y);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(env.mood.rim, 0.45);
      cc.fillRect(L.x - 46, L.y - 1, 92, 1.5);
    });
    // the lamp's cone on the floor (additive, soft)
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(rp.x + 20, HOP.robotY, 10, rp.x + 20, HOP.robotY, 240);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.42));
    g.addColorStop(0.55, withAlpha(env.mood.halo, 0.16));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(rp.x + 20, HOP.robotY, 260, 60, 0, 0, Math.PI * 2);
    c.fill();
    const beam = c.createLinearGradient(0, L.y, 0, HOP.robotY);
    beam.addColorStop(0, withAlpha(env.mood.halo, 0.16));
    beam.addColorStop(1, withAlpha(env.mood.halo, 0.05));
    c.fillStyle = beam;
    c.beginPath();
    c.moveTo(L.x - 44, L.y);
    c.lineTo(L.x + 44, L.y);
    c.lineTo(L.x + 210, HOP.robotY);
    c.lineTo(L.x - 170, HOP.robotY);
    c.closePath();
    c.fill();
    c.restore();
    // the robot's shadow on the floor (a soft ink ellipse that shrinks as it rises)
    c.fillStyle = withAlpha(env.mood.fg, 0.5 * (1 - rp.h / 120));
    c.beginPath();
    c.ellipse(rp.x + 10 - (rp.fall ? 80 : 0), HOP.robotY + 2, (32 + (rp.fall ? 70 : 0)) * (1 - rp.h / 200), 5, 0, 0, Math.PI * 2);
    c.fill();
    // the sim's reset: the robot flickers back into being
    c.save();
    c.globalAlpha *= 1 - 0.75 * rp.reset * (Math.floor(tq * 12) % 2);
    drawRobot(c, rp, ROBOT_S, PUPPET_NEAR_BLACK, withAlpha(env.mood.rim, 0.6));
    c.restore();
  });
  f.practical({ x: L.x, y: L.y + 4, kind: 'lamp', seed: 1201, intensity: 0.75, radius: 46, layer: 'L3' });
  f.fog({ yCenter: 612, height: 120, alpha: 0.24, drift: -6 });
  // L4: the choosing desk (static, cached), the screens' clips, the lantern, the tally, the thread
  const lk = lanternAt(t, taps);
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, o.cams, 30);
    bake(f, c, `${o.key}/hop/L4desk/${env.mood.id}/${rk(r)}`, r, (cc) => deskArt(cc, env, r));
    for (let i = 0; i < 2; i++) screenClip(c, env, i, t, tq, taps);
    lanternArt(c, env, lk);
    tallyArt(c, env, t, taps);
    const fs = toScreen(LAYERS.L3, f.cam, rp.x + 10, HOP.robotY - 4);
    rewardThread(c, env, t, taps, toLayer(LAYERS.L4, f.cam, fs.x, fs.y));
  });
  // a top-only rim from the hanging lamp: desk, screens and lantern carry no side or bottom strokes
  f.rim({ x: 0, y: -1 });
  f.practical({ x: HOP.lantern.x, y: HOP.lantern.y - 54, kind: 'candle', seed: 1207, intensity: 0.3 + 0.7 * lk, radius: 26 + 34 * lk });
  // the hand: on twos, over everything on the desk (L4, sharp)
  f.layer('L4', (c, env) => {
    const hp = handAt(tq, taps);
    if (hp) {
      // the narrator's hand (the film's one pair of hands), straight up from the frame's lower edge, the index
      // finger on the chosen clip; the cuff's lit top edge faces the screens
      const E = toLayer(LAYERS.L4, f.cam, hp.entryX, 860);
      const arm = hands.reach(E, hp.tip, 'press', HAND_LEN * 0.95, { bend: -0.12 - 0.1 * hp.press });
      hands.draw(c, { right: arm, scale: 0.95 }, env);
    }
  });
  // L5: proscenium valance, a curtain LEG at frame left and the STAGE LIP along the bottom (round 1: a near plane
  // that slides against the floor and the desk during the push), blurred
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, o.cams, 40);
    bake(f, c, `${o.key}/hop/L5b/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('fg');
      // valance: a scalloped pelmet across the top
      cc.beginPath();
      cc.moveTo(r.x, r.y);
      cc.lineTo(r.x + r.w, r.y);
      cc.lineTo(r.x + r.w, 30);
      for (let x = r.x + r.w; x >= r.x; x -= 64) cc.quadraticCurveTo(x - 32, 64, x - 64, 30);
      cc.closePath();
      cc.fill();
      // the curtain leg at left: a heavy fold whose edge sits ≈ 90 px into frame at the start of the stage
      cc.beginPath();
      cc.moveTo(r.x - 10, r.y);
      for (let y = r.y; y <= r.y + r.h; y += 24) cc.lineTo(118 + 9 * Math.sin(y * 0.018) + (y > 420 ? (y - 420) * 0.08 : 0), y);
      cc.lineTo(r.x - 10, r.y + r.h);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.14);
      cc.lineWidth = 3;
      cc.beginPath();
      for (let y = r.y; y <= r.y + r.h; y += 24) {
        const x = 112 + 9 * Math.sin(y * 0.018) + (y > 420 ? (y - 420) * 0.08 : 0);
        if (y === r.y) cc.moveTo(x, y);
        else cc.lineTo(x, y);
      }
      cc.stroke();
      // the right curtain (mostly out of frame)
      cc.beginPath();
      cc.moveTo(r.x + r.w + 10, r.y);
      for (let y = r.y; y <= r.y + r.h; y += 30) cc.lineTo(1356 - (10 * Math.sin(y * 0.02) + (y > 400 ? (y - 400) * 0.1 : 0)), y);
      cc.lineTo(r.x + r.w + 10, r.y + r.h);
      cc.closePath();
      cc.fill();
      // the stage lip: the apron's front edge with footlight hoods at intervals, rim-lit along its top
      const lipY = 708;
      cc.fillRect(r.x, lipY, r.w, r.y + r.h - lipY);
      for (let x = Math.floor(r.x / 150) * 150 + 40; x < r.x + r.w; x += 150) {
        cc.beginPath();
        cc.moveTo(x - 30, lipY + 1);
        cc.lineTo(x - 22, lipY - 30);
        cc.quadraticCurveTo(x, lipY - 38, x + 22, lipY - 30);
        cc.lineTo(x + 30, lipY + 1);
        cc.closePath();
        cc.fill();
      }
      cc.fillStyle = withAlpha(env.mood.rim, 0.4);
      cc.fillRect(r.x, lipY - 1, r.w, 2);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.4);
      cc.lineWidth = 2;
      for (let x = Math.floor(r.x / 150) * 150 + 40; x < r.x + r.w; x += 150) {
        cc.beginPath();
        cc.moveTo(x - 22, lipY - 30);
        cc.quadraticCurveTo(x, lipY - 38, x + 22, lipY - 30);
        cc.stroke();
      }
    });
  });
}

// ------------------------------------------------------------------------------------------------ the desk
function deskArt(c: C, env: PaintEnv, r: Rect) {
  const D = HOP.desk;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // the desk: top slab, an apron, two legs running out of frame
  c.fillRect(D.x0, D.y, D.x1 - D.x0 + 200, 12);
  c.fillRect(D.x0 + 8, D.y + 12, D.x1 - D.x0 + 200, 20);
  c.fillRect(D.x0 + 24, D.y + 12, 14, r.y + r.h - D.y);
  c.fillStyle = withAlpha(env.mood.rim, 0.32);
  c.fillRect(D.x0, D.y - 0.5, D.x1 - D.x0 + 200, 1.3);
  // the two screens: thin bezels on slim stands (faces painted per frame)
  const S = HOP.screen;
  for (const p of HOP.screens) {
    c.fillStyle = ink;
    c.fillRect(p.x - S.w / 2 - 6, p.y - S.h / 2 - 6, S.w + 12, S.h + 12);
    c.fillRect(p.x - 5, p.y + S.h / 2 + 6, 10, D.y - (p.y + S.h / 2 + 6));
    c.fillRect(p.x - 30, D.y - 5, 60, 5);
  }
}

/** one screen's replay: a tiny checker strip and a tiny hopper doing the try (good / bad), looping */
function screenClip(c: C, env: PaintEnv, i: number, t: number, tq: number, taps: number[]) {
  const S = HOP.screen;
  const p = HOP.screens[i];
  // which pair of tries is on screen: a new pair after each choice
  let pair = 0;
  for (const tp of taps) if (t >= tp + 0.55) pair++;
  const good = PICKS[Math.min(pair, PICKS.length - 1)] === i;
  const m = env.mood;
  // the face (a warm practical), refreshing to a new try with a quick flicker after a choice
  const swap = taps.some((tp) => t >= tp + 0.45 && t < tp + 0.6);
  const face = c.createLinearGradient(0, p.y - S.h / 2, 0, p.y + S.h / 2);
  face.addColorStop(0, mixLab(m.halo, m.core, 0.35));
  face.addColorStop(1, mixLab(m.halo, m.sky[2], 0.35));
  c.fillStyle = face;
  c.globalAlpha = swap ? 0.55 : 1;
  c.fillRect(p.x - S.w / 2, p.y - S.h / 2, S.w, S.h);
  c.globalAlpha = 1;
  c.save();
  c.beginPath();
  c.rect(p.x - S.w / 2, p.y - S.h / 2, S.w, S.h);
  c.clip();
  // a tiny floor strip
  const fy = p.y + S.h / 2 - 16;
  c.fillStyle = withAlpha(m.set, 0.55);
  c.fillRect(p.x - S.w / 2, fy, S.w, 16);
  c.fillStyle = withAlpha(m.fg, 0.35);
  for (let k = 0; k < 12; k++) c.fillRect(p.x - S.w / 2 + k * 16 + ((k % 2) * 8), fy + 2, 8, 6);
  // the try: a 1.86 s loop (good: hops upright; bad: hops then topples)
  const loop = 1.86;
  const lt = ((tq + i * 0.31) % loop);
  const fake: RobotPose = { x: p.x - 40, y: fy + 2, c: 0, h: 0, lean: 0, fall: 0, reset: 0 };
  const ph = (lt % PERIOD) / PERIOD;
  if (good || lt < PERIOD * 1.2) {
    fake.c = ph < 0.25 ? sm(ph / 0.25) : ph < 0.35 ? 1 - sm((ph - 0.25) / 0.1) : 0;
    fake.h = ph > 0.3 && ph < 0.8 ? 18 * Math.sin(((ph - 0.3) / 0.5) * Math.PI) : 0;
    fake.x += good ? 14 * Math.floor(lt / PERIOD) : 0;
    fake.lean = good ? 0.04 * Math.sin(lt * 5) : -0.18;
  } else {
    const u = clamp01((lt - PERIOD * 1.2) / 0.4);
    fake.fall = (Math.PI / 2 - 0.15) * u * u;
    fake.lean = -0.2;
  }
  drawRobot(c, fake, 0.38, withAlpha(m.ink, 0.92), null);
  c.restore();
  // scanline sheen and the glass edge
  c.fillStyle = withAlpha(m.core, 0.1);
  c.fillRect(p.x - S.w / 2, p.y - S.h / 2, S.w, 2);
  // the tapped screen answers with a thin bright frame for a moment
  for (let k = 0; k < taps.length; k++) {
    if (PICKS[k] !== i) continue;
    // (round 1) the chosen clip BRIGHTENS: ≈ +25% luminance for 0.4 s from the tap, then settles over 0.3 s
    const bright = t < taps[k] ? 0 : t < taps[k] + 0.06 ? sm((t - taps[k]) / 0.06) : t < taps[k] + 0.4 ? 1 : 1 - sm((t - taps[k] - 0.4) / 0.3);
    if (bright > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(mixLab(m.core, m.halo, 0.2), 0.3 * bright);
      c.fillRect(p.x - S.w / 2, p.y - S.h / 2, S.w, S.h);
      // and a halo just past the bezel
      const g = c.createRadialGradient(p.x, p.y, S.w * 0.4, p.x, p.y, S.w * 0.85);
      g.addColorStop(0, withAlpha(m.halo, 0.18 * bright));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - S.w, p.y - S.w, 2 * S.w, 2 * S.w);
      c.restore();
    }
    const a = Math.max(0, 1 - Math.abs(t - taps[k] - 0.2) / 0.35);
    if (a <= 0) continue;
    c.strokeStyle = withAlpha(m.core, 0.9 * a);
    c.lineWidth = 2;
    c.strokeRect(p.x - S.w / 2 - 1, p.y - S.h / 2 - 1, S.w + 2, S.h + 2);
  }
}

/** the reward lantern: a small ribbed paper lantern on a foot, lit from within (k 0..1+) */
function lanternArt(c: C, env: PaintEnv, k: number) {
  const { x, y } = HOP.lantern;
  const m = env.mood;
  const ink = env.fill('ink');
  const H = 80, W = 50;
  const body = y - 14;
  // glowing paper body
  const g = c.createRadialGradient(x, body - H / 2, 2, x, body - H / 2, W);
  g.addColorStop(0, mixLab(m.halo, m.core, Math.min(1, 0.3 + 0.6 * k)));
  g.addColorStop(1, mixLab(mixLab(m.set, m.halo, 0.5), m.core, 0.25 * Math.min(1, k)));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, body - H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
  c.fill();
  // ribs (ink), cap and foot
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1.2;
  for (let i = 1; i < 6; i++) {
    const yy = body - H + (H * i) / 6;
    const hw = (W / 2) * Math.sqrt(1 - Math.pow((yy - (body - H / 2)) / (H / 2), 2));
    c.beginPath();
    c.moveTo(x - hw, yy);
    c.lineTo(x + hw, yy);
    c.stroke();
  }
  c.fillStyle = ink;
  c.fillRect(x - 11, body - H - 6, 22, 8);
  c.fillRect(x - 2, body - H - 18, 4, 14);
  c.fillRect(x - 13, body - 2, 26, 6);
  c.fillRect(x - 4, body + 4, 8, y - body - 4);
  c.fillRect(x - 18, y - 4, 36, 4);
}

/** the tally card (round 1: enlarged so it reads as a COUNT of choices): a pale index card propped against the
 *  right screen's stand; one heavy pencil stroke per choice, struck on the tap (prop marks, no numerals) */
function tallyArt(c: C, env: PaintEnv, t: number, taps: number[]) {
  const { x, y } = HOP.tally;
  const m = env.mood;
  c.save();
  c.translate(x, y);
  c.rotate(-0.08);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-44, -66, 92, 68);
  c.fillStyle = mixLab(mixLab(m.rim, m.halo, 0.45), '#f3e6cf', 0.35);
  c.fillRect(-46, -70, 92, 68);
  // two faint ruled lines, like an index card
  c.fillStyle = withAlpha(m.ink, 0.16);
  c.fillRect(-40, -56, 80, 1.2);
  c.fillRect(-40, -12, 80, 1.2);
  c.fillStyle = withAlpha(m.ink, 0.9);
  for (let k = 0; k < taps.length; k++) {
    const a = sm((t - taps[k] - 0.15) / 0.18);
    if (a <= 0) continue;
    const xk = -26 + k * 20;
    c.save();
    c.translate(xk, -52);
    c.rotate(0.06 * (k % 2 ? -1 : 1));
    c.fillRect(-2.6, 0, 5.2, 40 * a);
    c.restore();
  }
  c.restore();
}

/** after each choice a beam of the lantern's light runs from the lantern to the robot's foot (≈ 0.6 s) */
function rewardThread(c: C, env: PaintEnv, t: number, taps: number[], foot: Pt) {
  const a = { x: HOP.lantern.x, y: HOP.lantern.y - 54 };
  const b = foot;
  const ctl = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 90 };
  const m = env.mood;
  const col = mixLab(m.core, m.halo, 0.25);
  let thread = 0;
  for (const tp of taps) thread = Math.max(thread, win3(t, tp + 0.12, tp + 0.3, tp + 0.75, tp + 1.05));
  if (thread <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  // a soft wide beam and a fine bright thread inside it
  for (const [w, al] of [[9, 0.07], [3.5, 0.2], [1.4, 0.55]] as const) {
    c.strokeStyle = withAlpha(col, al * thread);
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.quadraticCurveTo(ctl.x, ctl.y, b.x, b.y);
    c.stroke();
  }
  for (const tp of taps) {
    const u = (t - tp - 0.15) / 0.6;
    if (u < 0 || u > 1.25) continue;
    const v = Math.min(1, u);
    const q = 1 - v;
    const px = q * q * a.x + 2 * q * v * ctl.x + v * v * b.x;
    const py = q * q * a.y + 2 * q * v * ctl.y + v * v * b.y;
    const r = u > 1 ? 18 + 40 * (u - 1) : 16;
    const al = u > 1 ? 0.8 * (1 - (u - 1) / 0.25) : 0.85;
    const gr = c.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, withAlpha(m.core, al));
    gr.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = gr;
    c.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
  c.restore();
}
const win3 = (t: number, a: number, b: number, c2: number, d: number) => (t <= a || t >= d ? 0 : t < b ? sm((t - a) / (b - a)) : t < c2 ? 1 : 1 - sm((t - c2) / (d - c2)));

// ------------------------------------------------------------------------------------------------ the hand
/** fingertip target and press for the generic hand at twos-time tq (null = out of frame) */
export function handAt(tq: number, taps: number[]): { tip: Pt; press: number; entryX: number } | null {
  const S = HOP.screen;
  for (let k = 0; k < taps.length; k++) {
    const tp = taps[k];
    const u = (tq - (tp - 0.6)) / 1.4;
    if (u < 0 || u > 1) continue;
    const scr = HOP.screens[PICKS[k]];
    const touch = { x: scr.x + 4, y: scr.y + S.h * 0.12 };
    const hover = { x: touch.x + 4, y: touch.y + 16 };
    const off = { x: touch.x + 40, y: 860 };
    let tip: Pt;
    let press = 0;
    // up from the lower edge (0–.38), hover (.38–.43), a 2-frame press on the tap (.43–.49), hold, withdraw
    const pressA = 0.6 / 1.4, pressB = pressA + 0.085 / 1.4;
    if (u < 0.38) tip = { x: lerp(off.x, hover.x, sm(u / 0.38)), y: lerp(off.y, hover.y, sm(u / 0.38)) };
    else if (u < pressA) tip = hover;
    else if (u < pressB) {
      tip = touch;
      press = 1;
    } else if (u < 0.58) tip = { x: lerp(touch.x, hover.x, sm((u - pressB) / (0.58 - pressB))), y: lerp(touch.y, hover.y, sm((u - pressB) / (0.58 - pressB))) };
    else tip = { x: lerp(hover.x, off.x, sm((u - 0.58) / 0.42)), y: lerp(hover.y, off.y, sm((u - 0.58) / 0.42)) };
    return { tip, press, entryX: scr.x + 90 };
  }
  return null;
}

/** a generic hand: plain knit cuff, the forearm from the lower right, index finger extended (no likeness) */
export function genericHand(c: C, env: PaintEnv, tip: Pt, press: number) {
  const ang = Math.atan2(-0.95, -0.42); // the forearm points up and left (tip ← wrist)
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const nrm = { x: -dir.y, y: dir.x };
  const finger = 58, palm = 64;
  const knuckle = { x: tip.x - dir.x * finger, y: tip.y - dir.y * finger };
  const wrist = { x: knuckle.x - dir.x * palm, y: knuckle.y - dir.y * palm };
  const elbow = { x: wrist.x - dir.x * 520, y: wrist.y - dir.y * 520 };
  const ink = PUPPET_NEAR_BLACK;
  const P = (p: Pt, a: number, b: number) => ({ x: p.x + nrm.x * a + dir.x * b, y: p.y + nrm.y * a + dir.y * b });
  c.save();
  c.fillStyle = ink;
  // forearm (sleeve) and cuff
  c.beginPath();
  const w0 = 32, w1 = 42;
  const a0 = P(wrist, -w0, -14), a1 = P(wrist, w0, -14);
  const b0 = P(elbow, -w1, 0), b1 = P(elbow, w1, 0);
  c.moveTo(a0.x, a0.y);
  c.lineTo(a1.x, a1.y);
  c.lineTo(b1.x, b1.y);
  c.lineTo(b0.x, b0.y);
  c.closePath();
  c.fill();
  // palm and curled fingers (a rounded block), thumb along the side
  c.beginPath();
  const q0 = P(wrist, -26, 0), q1 = P(wrist, 26, 0), q2 = P(knuckle, 28, 4), q3 = P(knuckle, -22, 2);
  c.moveTo(q0.x, q0.y);
  c.lineTo(q1.x, q1.y);
  c.quadraticCurveTo(P(knuckle, 30, -10).x, P(knuckle, 30, -10).y, q2.x, q2.y);
  c.quadraticCurveTo(P(knuckle, 6, 14).x, P(knuckle, 6, 14).y, q3.x, q3.y);
  c.closePath();
  c.fill();
  const th0 = P(wrist, -18, 10), th1 = P(knuckle, -24, -4 + 6 * press);
  c.lineCap = 'round';
  c.strokeStyle = ink;
  c.lineWidth = 14;
  c.beginPath();
  c.moveTo(th0.x, th0.y);
  c.lineTo(th1.x, th1.y);
  c.stroke();
  // the index finger, extended to the tip
  c.lineWidth = 13;
  c.beginPath();
  const f0 = P(knuckle, -10, 0);
  c.moveTo(f0.x, f0.y);
  c.lineTo(tip.x + nrm.x * -6, tip.y + nrm.y * -6);
  c.stroke();
  // the knit cuff's ribbing: cut-lines across the sleeve, and a rim on the lit (upper-left) edge
  c.strokeStyle = withAlpha(env.mood.rim, 0.32);
  c.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) {
    const s0 = P(wrist, -w0 + 2, -22 - k * 7), s1 = P(wrist, w0 - 2, -22 - k * 7);
    c.beginPath();
    c.moveTo(s0.x, s0.y);
    c.lineTo(s1.x, s1.y);
    c.stroke();
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(b0.x, b0.y);
  c.lineTo(a0.x, a0.y);
  c.lineTo(q0.x, q0.y);
  c.lineTo(f0.x, f0.y);
  c.lineTo(tip.x + nrm.x * -6, tip.y + nrm.y * -6);
  c.stroke();
  c.restore();
}

/** seeded jitter for small prop details */
export const jit = (i: number, s: number) => hash1(i, s);
