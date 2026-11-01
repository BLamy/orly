/**
 * durable-objects-unbound — KENTON VARDA'S STUDY (ch02-s01..s04, author:ch02-ch03). Wraps sets/historyDesk.ts
 * (the desk, chair, laptop, anglepoise lamp and the seated figure, unchanged) in a multiplane room:
 *
 *   L1  a far city at dusk seen through the window (hazed skyline, a few lit windows)
 *   L2  the back wall: one wide three-light window cut as HOLES (the backlight + L1 show through), mullions,
 *       a transom bar, a picture rail
 *   L3  the floor, a low bookcase at the right, a side table (the globe's, ch02-s01)
 *   L4  the desk (DESK.kenton: always screen-left, he faces right, his lamp on his right) + hooks
 *   L5  a shelf edge at the left (blurred, the near occluder), optional curtain edge at the far right
 *
 *   paintStudy(f, o, hooks)   o.cam, o.cams (overscan), o.era (window light / lamp warmth), o.lamp 0..1,
 *                             o.screen 0..1, o.think 0..1, o.figure 0..1 (alpha), o.skipL5
 *   STUDY                     geometry: window rect (L2), bookcase (L3), side table (L3/L4), the desk anchors
 *
 * Real people's hands stay at their desks. Nothing here touches the harbour.
 */
import { LAYERS, mixLab, overscan, skyline, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { DESK, desk, deskAnchors, deskFigure } from './historyDesk';
import { tone, type C2, type Rect } from './common';
import { bakeRes } from './ch02-s01-kit';

export const STUDY = {
  /** the window opening in L2 */
  win: { x0: 600, x1: 1330, y0: 120, y1: 452 },
  wallBase: 548,
  bookcase: { x0: 1090, x1: 1290, top: 330 },
  desk: DESK.kenton,
  anchors: deskAnchors(DESK.kenton),
};
export type Era = 2020 | 2021 | 2022 | 2024;

// ------------------------------------------------------------------ L1: the far city
function cityStatic(c: C2, env: PaintEnv, r: Rect): void {
  // a low dusk haze band behind the city
  const g = c.createLinearGradient(0, 300, 0, 470);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(1, withAlpha(env.mood.halo, 0.35));
  c.fillStyle = g;
  c.fillRect(r.x, 300, r.w, 170);
  skyline(c, { style: 'bayArea', x0: r.x, x1: r.x + r.w, y: 470, height: 110, seed: 11, lit: 0.22, ground: 600 }, env);
}

// ------------------------------------------------------------------ L2: the back wall with its window
function wallStatic(c: C2, env: PaintEnv, r: Rect): void {
  const W = STUDY.win;
  const wall = mixLab(env.fill('set'), env.fill('ink'), 0.35);
  const p = new Path2D();
  p.rect(r.x, r.y, r.w, r.h);
  // three lights (holes), counter-wound for evenodd
  const lights = 3;
  const gap = 16;
  const lw = (W.x1 - W.x0 - gap * (lights - 1)) / lights;
  for (let i = 0; i < lights; i++) {
    const x = W.x0 + i * (lw + gap);
    p.rect(x, W.y0, lw, W.y1 - W.y0);
  }
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // glazing bars: one transom and a vertical bar in each light
  c.fillStyle = wall;
  for (let i = 0; i < lights; i++) {
    const x = W.x0 + i * (lw + gap);
    c.fillRect(x, W.y0 + (W.y1 - W.y0) * 0.3, lw, 4);
    c.fillRect(x + lw / 2 - 1.5, W.y0, 3, W.y1 - W.y0);
  }
  // sill and a picture rail
  c.fillRect(W.x0 - 14, W.y1, W.x1 - W.x0 + 28, 10);
  c.fillStyle = mixLab(wall, env.mood.fg, 0.2);
  c.fillRect(r.x, 96, r.w, 5);
  // the sill catches the dusk (tops only)
  c.strokeStyle = withAlpha(env.fill('rim'), 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(W.x0 - 14, W.y1);
  c.lineTo(W.x1 + 14, W.y1);
  c.stroke();
  // a framed print on the wall at the left, dark on dark
  c.fillStyle = mixLab(wall, env.mood.fg, 0.3);
  c.fillRect(150, 180, 120, 150);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.12);
  c.strokeRect(162, 192, 96, 126);
}

// ------------------------------------------------------------------ L3: floor, bookcase, side table
function roomStatic(c: C2, env: PaintEnv, r: Rect): void {
  const ink = env.fill('ink');
  const set = mixLab(env.fill('set'), ink, 0.55);
  // skirting + floor
  const g = c.createLinearGradient(0, STUDY.wallBase, 0, r.y + r.h);
  g.addColorStop(0, mixLab(set, env.mood.fg, 0.1));
  g.addColorStop(1, env.mood.fg);
  c.fillStyle = g;
  c.fillRect(r.x, STUDY.wallBase, r.w, r.y + r.h - STUDY.wallBase);
  c.fillStyle = set;
  c.fillRect(r.x, STUDY.wallBase - 10, r.w, 12);
  // floorboards: faint perspective lines
  c.strokeStyle = withAlpha(env.fill('rim'), 0.05);
  c.lineWidth = 1;
  for (let i = -20; i < 40; i++) {
    const x = 640 + i * 70;
    c.beginPath();
    c.moveTo(x, STUDY.wallBase);
    c.lineTo(640 + (x - 640) * 2.4, r.y + r.h);
    c.stroke();
  }
  // the low bookcase (right)
  const B = STUDY.bookcase;
  c.fillStyle = set;
  c.fillRect(B.x0, B.top, B.x1 - B.x0, STUDY.wallBase - B.top);
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 3; row++) {
    const y1 = B.top + 14 + row * 70 + 58;
    c.fillStyle = mixLab(set, env.mood.fg, 0.25);
    c.fillRect(B.x0 + 8, y1 - 58, B.x1 - B.x0 - 16, 58);
    let x = B.x0 + 12;
    while (x < B.x1 - 18) {
      const w = 6 + rnd() * 9, h = 34 + rnd() * 20;
      c.fillStyle = mixLab(set, env.mood.halo, 0.06 + rnd() * 0.08);
      c.fillRect(x, y1 - h, w, h);
      x += w + 1.5;
      if (rnd() > 0.88) x += 10;
    }
  }
  c.strokeStyle = withAlpha(env.fill('rim'), 0.3);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(B.x0, B.top);
  c.lineTo(B.x1, B.top);
  c.stroke();
  // a jar of pens and a stacked pair of books on top
  c.fillStyle = set;
  c.fillRect(B.x0 + 30, B.top - 26, 70, 12);
  c.fillRect(B.x0 + 36, B.top - 38, 58, 12);
  c.fillRect(B.x1 - 46, B.top - 30, 18, 30);
}

// ------------------------------------------------------------------ L5: the shelf edge at the left
function shelfStatic(c: C2, env: PaintEnv): void {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(-160, -200, 150, 1200);
  for (const y of [70, 300, 530]) {
    c.fillRect(-20, y, 110, 14);
    // book ends poking out
    let x = -18;
    let k = y;
    while (x < 76) {
      const w = 8 + ((k * 7) % 9), h = 40 + ((k * 13) % 34);
      c.fillRect(x, y - h, w, h);
      x += w + 2;
      k += 3;
    }
  }
}

// ------------------------------------------------------------------ orchestrator
export interface StudyOpts {
  cam: Camera3;
  cams: Camera3[];
  era: Era;
  lamp?: number;
  screen?: number;
  think?: number;
  figure?: number;
  /** draw the desk at all (ch02-s01's globe framing still sees the room) */
  deskOn?: boolean;
  skipL5?: boolean;
  /** sky intensity */
  sky?: number;
  /** called right after f.camera() (a lampChange: f.setMood(...)) */
  beforeLight?: () => void;
}
type Hook = (c: C2, env: PaintEnv) => void;
export interface StudyHooks {
  L1?: Hook;
  L2?: Hook;
  L3?: Hook;
  L4back?: Hook;
  L4?: Hook;
  afterRim?: () => void;
  L5?: Hook;
}
const ext = (layer: keyof typeof LAYERS, cams: Camera3[], pad = 60) => overscan(LAYERS[layer], cams, pad);
const kr = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function paintStudy(f: Frame, o: StudyOpts, hooks: StudyHooks = {}): void {
  f.camera(o.cam);
  o.beforeLight?.();
  // the dusk sun sits low in the middle light of the window (screen-locked L0: placed where the window is now)
  const W = STUDY.win;
  const sp = toScreen(LAYERS.L1, o.cam, (W.x0 + W.x1) / 2 + 40, 430);
  f.backlight({ sunX: sp.x, sunY: sp.y, intensity: o.sky ?? 1 });
  f.layer('L1', (c, env) => {
    const r = ext('L1', o.cams);
    bakeRes(f, c, env, `study-city/${kr(r)}`, r, (cc) => cityStatic(cc, env, r));
    hooks.L1?.(c, env);
  });
  f.layer('L2', (c, env) => {
    const r = ext('L2', o.cams);
    r.y = Math.min(r.y, -100);
    r.h = Math.max(r.h, 1000);
    bakeRes(f, c, env, `study-wall/${kr(r)}`, r, (cc) => wallStatic(cc, env, r));
    hooks.L2?.(c, env);
  });
  f.fog({ yCenter: 470, height: 200, alpha: 0.14, drift: 5 });
  f.layer('L3', (c, env) => {
    const r = ext('L3', o.cams);
    r.h = Math.max(r.h, 1000 - r.y);
    bakeRes(f, c, env, `study-room/${kr(r)}`, r, (cc) => roomStatic(cc, env, r));
    hooks.L3?.(c, env);
  });
  f.fog('B');
  f.layer('L4', (c, env) => {
    hooks.L4back?.(c, env);
    if (o.deskOn !== false) {
      const d = { ...STUDY.desk, lamp: o.lamp ?? 1, screen: o.screen ?? 0.6 };
      desk(c, env, d);
      if ((o.figure ?? 1) > 0.01) deskFigure(c, env, { ...d, tq: env.tq, think: o.think ?? 0.2, alpha: o.figure ?? 1 });
    }
    hooks.L4?.(c, env);
  });
  f.rim({ x: 0, y: -1 });
  if (o.deskOn !== false && (o.lamp ?? 1) > 0.02) {
    const b = STUDY.anchors.bulb;
    f.practical({ x: b.x, y: b.y + 6, kind: 'lamp', seed: 41, intensity: 0.55 * (o.lamp ?? 1), radius: 60, layer: 'L4' });
  }
  hooks.afterRim?.();
  if (!o.skipL5 && o.cam.z < 420) {
    f.layer('L5', (c, env) => {
      bakeRes(f, c, env, 'study-shelf', { x: -180, y: -220, w: 300, h: 1240 }, (cc) => shelfStatic(cc, env));
      hooks.L5?.(c, env);
    });
  }
}
export { tone };
