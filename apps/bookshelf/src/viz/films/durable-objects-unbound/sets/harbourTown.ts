/**
 * durable-objects-unbound — THE HARBOUR TOWN (staging.geography canonical; buildList.harbourTown).
 *
 * The geography lock, in rest-screen px (at CAMERA3_HOME a point drawn at (x, y) in any layer lands at (x, y)):
 *   L0  sky ramp (f.backlight({ sunX: TOWN.moon.x, sunY: TOWN.moon.y }) — the moon low-left)
 *   L1  the sea and the low far shore with sparse lamps (other people's machines); the moon disc       seaAndShore
 *   L2  the hill ridge rising to the right, dim terraced roofs                                          ridge
 *   L3  the terrace, always left to right: House A (tall, steep gable, round attic window), House B (wider, a
 *       chimney), House C (upper terrace, a dormer). Each window lamp is that machine's process.           terrace
 *   L4  the square: the Well at the left third (TOWN.well) under the Plate on its iron frame; the sender's
 *       harbour-side cottage window right of the Well (TOWN.sender)                                       square
 *   L5  cobbles and a stone railing (bottom band; set dressing only, no action)                          railing
 *   L6  the iron lamp-post crossing frame right (the occluder for in-chapter wipes)                      lampPost
 *   A is always screen-left of the Well; B and C screen-right. Each house has a pulley line to the wellhead.
 *
 *   paintTown(f, o, hooks)   the whole multiplane town in paint order, with per-layer hooks for the shot's action:
 *       o.cams      every camera the shot uses (overscan for the baked layers)
 *       o.variant   'night' | 'celld' | 'dawn'   (celld: neighbour cords + upper copyist windows; dawn: shore lamps out)
 *       o.lamps     { A, B, C, Aup?, Bup?, Cup? } 0..1 window lamps (gutter them per frame from the shot)
 *       o.lanterns  [{ house, lit, members, door, slips, tq }] Room Lanterns in main windows
 *       o.lines     { A, B, C } 0..1 pulley lines drawn (tension); o.neighbourCords 0..1 (celld: A→B, A→C sills)
 *       o.plate / o.tooth / o.well  wellAndPlate states;  o.badge  the wellhead badge
 *       o.shoreLamps 0..1;  o.moon 0..1;  o.lampPostLit 0..1;  o.mood {to, from, u} (in-shot grade change)
 *       NOTE: anything drawn in the L3back hook paints over nothing but the window interiors IF it stays inside a
 *       window rect; the cached wall is drawn after it, so clip window contents to the window yourself.
 *       hooks: { L1?, L2?, L3back? (inside windows, before the wall), L3?, L4back? (before the Well), L4?, L5?, L6?,
 *                screen? }  each (c, env) in that layer's world space
 *   l3ToL4(cam, p)           convert a terrace (L3) point into L4 coordinates for the current camera (pulley lines)
 *   pulleyAt(cam, house, u)  a point along house's pulley line (u 0 = the house, 1 = the wellhead), L4 coords
 *   TOWN                     the locked geometry (windows, doors, pulleys, the Well, the sender's window)
 */
import { LAYERS, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, MoodId, PaintEnv } from '../../../film';
import { overscan } from '../../../film';
import { badge as drawBadge, bakeRect, clamp01, cord, cordAt, glowDot, tone, type BadgeText, type C2, type Rect } from './common';
import { roomLantern, type RoomLanternOpts } from './roomLantern';
import { plate as drawPlate, tooth as drawTooth, wellBase, wellLive, WELL, type PlateState, type ToothState, type WellLiveOpts } from './wellAndPlate';

export type HouseId = 'A' | 'B' | 'C';
interface Win { x: number; y: number; w: number; h: number }
interface HouseGeo {
  cx: number;
  base: number;
  w: number;
  eave: number;
  ridge: number;
  main: Win;
  upper: Win;
  /** pulley block on the main sill */
  pulley: { x: number; y: number };
  sill: { x: number; y: number };
  door: Win;
}
export const TOWN = {
  horizon: 432,
  moon: { x: 168, y: 292, r: 24 },
  A: {
    cx: 232, base: 474, w: 128, eave: 320, ridge: 222,
    main: { x: 232, y: 394, w: 46, h: 60 }, upper: { x: 232, y: 282, w: 26, h: 26 },
    pulley: { x: 262, y: 428 }, sill: { x: 232, y: 425 }, door: { x: 205, y: 456, w: 18, h: 36 },
  } as HouseGeo,
  B: {
    cx: 760, base: 474, w: 200, eave: 344, ridge: 288,
    main: { x: 718, y: 426, w: 54, h: 50 }, upper: { x: 812, y: 384, w: 40, h: 42 },
    pulley: { x: 690, y: 452 }, sill: { x: 718, y: 452 }, door: { x: 800, y: 452, w: 22, h: 42 },
  } as HouseGeo,
  C: {
    cx: 1046, base: 418, w: 164, eave: 298, ridge: 232,
    main: { x: 1076, y: 360, w: 50, h: 54 }, upper: { x: 1006, y: 270, w: 30, h: 28 },
    pulley: { x: 1046, y: 388 }, sill: { x: 1076, y: 388 }, door: { x: 1010, y: 398, w: 20, h: 40 },
  } as HouseGeo,
  /** the Well: wellhead base centre in L4 (s = 1) */
  well: { x: 432, y: 612 },
  /** the sender's harbour-side window (L4, right of the Well): window rect and the seat point (feet) */
  sender: { win: { x: 988, y: 552, w: 78, h: 58 }, seat: { x: 1004, y: 628 }, seatScale: 0.4 },
  /** the iron lamp-post (L6) */
  post: { x: 1196, head: 148 },
};

export function l3ToL4(cam: Camera3, p: { x: number; y: number }): { x: number; y: number } {
  const sp = toScreen(LAYERS.L3, cam, p.x, p.y);
  return toLayer(LAYERS.L4, cam, sp.x, sp.y);
}
const PULLEY_TOP = { x: TOWN.well.x + WELL.pulley.x, y: TOWN.well.y + WELL.pulley.y };
const sagFor = (h: HouseId) => (h === 'A' ? 26 : h === 'B' ? 34 : 46);
export function pulleyAt(cam: Camera3, h: HouseId, u: number): { x: number; y: number } {
  const a = l3ToL4(cam, TOWN[h].pulley);
  return cordAt(a.x, a.y, PULLEY_TOP.x, PULLEY_TOP.y, sagFor(h), clamp01(u));
}

// ------------------------------------------------------------------ L1: sea + far shore + moon
const SHORE_LAMPS = Array.from({ length: 16 }, (_, i) => {
  const h = Math.sin(i * 91.7 + 3.1) * 43758.5453;
  const f = h - Math.floor(h);
  return { x: -420 + i * 150 + f * 90, y: 0, seed: i * 7 + 3, warm: f > 0.4 };
});
function shoreY(x: number): number {
  return TOWN.horizon - 10 - 8 * Math.sin(x * 0.006 + 1.2) - 5 * Math.sin(x * 0.017 + 0.4) - 3 * Math.sin(x * 0.041);
}
function shoreStatic(c: C2, env: PaintEnv, r: Rect): void {
  // the moon disc (pale, soft-edged)
  const m = TOWN.moon;
  const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3.2);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.5), 0.95));
  g.addColorStop(0.3, withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.9));
  g.addColorStop(0.34, withAlpha(env.mood.halo, 0.28));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(m.x - m.r * 3.2, m.y - m.r * 3.2, m.r * 6.4, m.r * 6.4);
  // the far shore: a low hazed hill line
  c.fillStyle = env.fill('set');
  c.beginPath();
  c.moveTo(r.x, r.y + r.h);
  for (let x = r.x; x <= r.x + r.w; x += 8) c.lineTo(x, shoreY(x));
  c.lineTo(r.x + r.w, TOWN.horizon + 4);
  c.lineTo(r.x + r.w, r.y + r.h);
  c.closePath();
  c.fill();
  // the sea: darker water from the shore down, a faint horizon sheen
  const sea = c.createLinearGradient(0, TOWN.horizon, 0, r.y + r.h);
  sea.addColorStop(0, mixLab(env.fill('set'), env.mood.haze, 0.25));
  sea.addColorStop(0.2, mixLab(env.fill('set'), env.mood.fg, 0.25));
  sea.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.6));
  c.fillStyle = sea;
  c.fillRect(r.x, TOWN.horizon + 2, r.w, r.y + r.h - TOWN.horizon);
}
export function seaAndShore(f: Frame, c: C2, env: PaintEnv, r: Rect, o: { lamps?: number; moon?: number; key?: string }): void {
  bakeRect(f, c, env, `shore/${o.key ?? ''}/${Math.round(r.x)},${Math.round(r.w)}`, r, (cc) => shoreStatic(cc, env, r));
  const t = env.t;
  // moon ribbons on the water: a column of short horizontal glints below the moon, slow shimmer
  const m = TOWN.moon;
  const mk = o.moon ?? 1;
  if (mk > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const yy = TOWN.horizon + 8 + i * i * 0.9 + i * 4;
      if (yy > r.y + r.h) break;
      const w = 10 + i * 4 + 6 * Math.sin(t * 0.7 + i * 1.9);
      const xx = m.x + 4 * Math.sin(t * 0.4 + i * 2.3);
      c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), (0.16 - i * 0.008) * mk);
      c.fillRect(xx - w / 2, yy, w, 1.6 + i * 0.12);
    }
    c.restore();
  }
  // sparse far-shore lamps (other people's machines)
  const lk = o.lamps ?? 1;
  if (lk > 0.01) {
    for (let i = 0; i < SHORE_LAMPS.length; i++) {
      const L = SHORE_LAMPS[i];
      if (L.x < r.x || L.x > r.x + r.w) continue;
      // dawn turns them out one by one (by index)
      const on = clamp01(lk * SHORE_LAMPS.length - i);
      if (on <= 0.01) continue;
      const fl = 0.85 + 0.15 * Math.sin(t * (1.3 + (i % 3) * 0.4) + L.seed);
      const col = L.warm ? tone(env, '#f6c27a', 0.15) : tone(env, '#d8e4ee', 0.2);
      glowDot(c, L.x, shoreY(L.x) + 3, 7, col, 0.7 * on * fl);
    }
  }
}

// ------------------------------------------------------------------ L2: the ridge
function ridgeY(x: number): number {
  // low at the left (the sea open behind A), rising to the right behind B and C
  const u = (x + 300) / 2000;
  return 470 - 250 * Math.max(0, Math.min(1, u * 1.15)) ** 1.25 - 14 * Math.sin(x * 0.009 + 2) - 6 * Math.sin(x * 0.03);
}
function ridgeStatic(c: C2, env: PaintEnv, r: Rect): void {
  c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.3);
  c.beginPath();
  c.moveTo(r.x, r.y + r.h);
  for (let x = r.x; x <= r.x + r.w; x += 6) c.lineTo(x, ridgeY(x));
  c.lineTo(r.x + r.w, r.y + r.h);
  c.closePath();
  c.fill();
  // dim terraced roofs climbing the ridge: small gables in rows, a few pale windows
  let seed = 17;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 3; row++) {
    for (let x = r.x + 20; x < r.x + r.w - 20; x += 46 + rnd() * 30) {
      if (x < 120) continue;
      const top = ridgeY(x) + 18 + row * 34;
      if (top > 470) continue;
      const w = 26 + rnd() * 22, h = 16 + rnd() * 10;
      c.fillStyle = mixLab(mixLab(env.fill('set'), env.fill('ink'), 0.3), env.mood.fg, 0.12 + row * 0.06);
      c.beginPath();
      c.moveTo(x - w / 2, top + h + 12);
      c.lineTo(x - w / 2, top + h * 0.45);
      c.lineTo(x, top);
      c.lineTo(x + w / 2, top + h * 0.45);
      c.lineTo(x + w / 2, top + h + 12);
      c.closePath();
      c.fill();
      // roof edge catches the moon faintly
      c.strokeStyle = withAlpha(env.fill('rim'), 0.12);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - w / 2, top + h * 0.45);
      c.lineTo(x, top);
      c.stroke();
      if (rnd() > 0.78) {
        c.fillStyle = withAlpha(tone(env, '#e8b46a', 0.3), 0.32);
        c.fillRect(x - 3, top + h * 0.6, 5, 5);
      }
    }
  }
}

// ------------------------------------------------------------------ L3: the terrace and its houses
function housePath(h: HouseGeo, kind: HouseId): Path2D {
  const p = new Path2D();
  const x0 = h.cx - h.w / 2, x1 = h.cx + h.w / 2;
  p.moveTo(x0, h.base + 60);
  p.lineTo(x0, h.eave);
  if (kind === 'A') {
    // tall steep gable with a small overhang
    p.lineTo(x0 - 8, h.eave + 4);
    p.lineTo(h.cx, h.ridge);
    p.lineTo(x1 + 8, h.eave + 4);
    p.lineTo(x1, h.eave);
  } else if (kind === 'B') {
    // a wider, shallower gable and a chimney on the right slope
    p.lineTo(x0 - 10, h.eave + 4);
    p.lineTo(h.cx, h.ridge);
    p.lineTo(h.cx + 46, h.ridge + 16);
    p.lineTo(h.cx + 46, h.ridge - 22);
    p.lineTo(h.cx + 64, h.ridge - 22);
    p.lineTo(h.cx + 64, h.ridge + 23);
    p.lineTo(x1 + 10, h.eave + 4);
    p.lineTo(x1, h.eave);
  } else {
    // C: a gable with a dormer pushing out of the left slope
    const dL = h.upper.x - h.upper.w / 2 - 8, dR = h.upper.x + h.upper.w / 2 + 8;
    p.lineTo(x0 - 8, h.eave + 4);
    const slope = (x: number) => h.eave + 4 - ((x - (x0 - 8)) / (h.cx - (x0 - 8))) * (h.eave + 4 - h.ridge);
    p.lineTo(dL, slope(dL));
    p.lineTo(dL, h.upper.y - h.upper.h / 2 - 4);
    p.lineTo((dL + dR) / 2, h.upper.y - h.upper.h / 2 - 20);
    p.lineTo(dR, h.upper.y - h.upper.h / 2 - 4);
    p.lineTo(dR, slope(dR));
    p.lineTo(h.cx, h.ridge);
    p.lineTo(x1 + 8, h.eave + 4);
    p.lineTo(x1, h.eave);
  }
  p.lineTo(x1, h.base + 60);
  p.closePath();
  // window holes (counter-wound for evenodd)
  const hole = (wn: Win, round = false) => {
    if (round) {
      p.moveTo(wn.x + wn.w / 2, wn.y);
      p.arc(wn.x, wn.y, wn.w / 2, 0, Math.PI * 2, true);
    } else p.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
  };
  hole(h.main);
  hole(h.upper, kind === 'A');
  return p;
}
function terraceStatic(c: C2, env: PaintEnv, r: Rect): void {
  // the houses are cut one step lighter than the figures (value hierarchy) but well below the sky
  const set = mixLab(env.fill('set'), env.fill('ink'), 0.62);
  // the terrace ground and its retaining wall (a step up for C's upper terrace)
  c.fillStyle = mixLab(set, env.mood.fg, 0.15);
  c.beginPath();
  c.moveTo(r.x, 486);
  c.lineTo(900, 486);
  c.lineTo(930, 432);
  c.lineTo(r.x + r.w, 432);
  c.lineTo(r.x + r.w, r.y + r.h);
  c.lineTo(r.x, r.y + r.h);
  c.closePath();
  c.fill();
  // coping stones along the terrace edge
  c.strokeStyle = withAlpha(env.fill('rim'), 0.22);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(r.x, 486);
  c.lineTo(900, 486);
  c.lineTo(930, 432);
  c.lineTo(r.x + r.w, 432);
  c.stroke();
  for (const id of ['A', 'B', 'C'] as HouseId[]) {
    const h = TOWN[id];
    c.fillStyle = set;
    c.fill(housePath(h, id), 'evenodd');
    // mullions and sills (cut-paper, in set ink)
    c.fillStyle = set;
    const m = h.main;
    c.fillRect(m.x - 1.2, m.y - m.h / 2, 2.4, m.h);
    c.fillRect(m.x - m.w / 2, m.y - 1.2, m.w, 2.4);
    c.fillRect(m.x - m.w / 2 - 5, m.y + m.h / 2, m.w + 10, 5);
    if (id !== 'A') {
      const u = h.upper;
      c.fillRect(u.x - 1, u.y - u.h / 2, 2, u.h);
      c.fillRect(u.x - u.w / 2 - 3, u.y + u.h / 2, u.w + 6, 4);
    } else {
      const u = h.upper;
      c.fillRect(u.x - 1, u.y - u.h / 2, 2, u.h);
      c.fillRect(u.x - u.w / 2, u.y - 1, u.w, 2);
    }
    // door
    const d = h.door;
    c.fillStyle = mixLab(set, env.mood.fg, 0.35);
    c.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
    // roof edges catch the moon (top-left edges only: the moon is low-left)
    c.strokeStyle = withAlpha(env.fill('rim'), 0.42);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(h.cx - h.w / 2 - 9, h.eave + 4);
    c.lineTo(h.cx, h.ridge);
    c.stroke();
    // the pulley block on the sill
    c.fillStyle = set;
    c.beginPath();
    c.arc(h.pulley.x, h.pulley.y, 4.5, 0, Math.PI * 2);
    c.fill();
    c.fillRect(h.pulley.x - 1, h.pulley.y - 10, 2, 8);
  }
}
export interface LanternInWindow extends Omit<RoomLanternOpts, 'x' | 'y'> {
  house: HouseId;
  /** override the in-window scale (default 0.5) */
  s?: number;
}
export interface TownLamps {
  A?: number;
  B?: number;
  C?: number;
  Aup?: number;
  Bup?: number;
  Cup?: number;
}
const LAMP_WARM = '#f2b45e';
function windowInterior(c: C2, env: PaintEnv, wn: Win, lit: number, tint?: string): void {
  const dark = mixLab(mixLab(env.fill('set'), env.fill('ink'), 0.62), env.mood.fg, 0.4);
  if (lit <= 0.01) {
    c.fillStyle = dark;
    c.fillRect(wn.x - wn.w / 2 - 1, wn.y - wn.h / 2 - 1, wn.w + 2, wn.h + 2);
    return;
  }
  const col = tone(env, tint ?? LAMP_WARM, 0.08);
  const g = c.createRadialGradient(wn.x, wn.y + wn.h * 0.1, 1, wn.x, wn.y, Math.max(wn.w, wn.h) * 0.8);
  g.addColorStop(0, mixLab(dark, mixLab(col, '#fff2d6', 0.3), lit));
  g.addColorStop(1, mixLab(dark, mixLab(col, env.mood.fg, 0.35), lit));
  c.fillStyle = g;
  c.fillRect(wn.x - wn.w / 2 - 1, wn.y - wn.h / 2 - 1, wn.w + 2, wn.h + 2);
}

// ------------------------------------------------------------------ L4: the square
function squareStatic(c: C2, env: PaintEnv, r: Rect, o: { sender: boolean }): void {
  const ink = env.fill('ink');
  // the square's ground: a dark plane from the terrace foot
  const g = c.createLinearGradient(0, 560, 0, r.y + r.h);
  g.addColorStop(0, mixLab(env.fill('set'), ink, 0.55));
  g.addColorStop(0.2, mixLab(env.fill('set'), ink, 0.7));
  g.addColorStop(1, ink);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(r.x, 588);
  c.quadraticCurveTo(640, 578, r.x + r.w, 590);
  c.lineTo(r.x + r.w, r.y + r.h);
  c.lineTo(r.x, r.y + r.h);
  c.closePath();
  c.fill();
  // a few cobble glints toward the moon
  c.fillStyle = withAlpha(env.fill('rim'), 0.08);
  for (let i = 0; i < 70; i++) {
    const x = r.x + ((i * 97.13) % r.w);
    const y = 600 + ((i * 37.7) % 34);
    c.fillRect(x, y, 6 + (i % 3) * 2, 1);
  }
  if (o.sender) {
    // the sender's harbour-side cottage (L4, right of the Well): a low gabled front with one window hole
    const s = TOWN.sender.win;
    const p = new Path2D();
    p.moveTo(890, 640);
    p.lineTo(890, 512);
    p.lineTo(884, 512);
    p.lineTo(990, 470);
    p.lineTo(1100, 512);
    p.lineTo(1094, 512);
    p.lineTo(1094, 640);
    p.closePath();
    p.rect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
    c.fillStyle = ink;
    c.fill(p, 'evenodd');
    c.fillRect(s.x - s.w / 2 - 6, s.y + s.h / 2, s.w + 12, 5);
    c.fillRect(s.x - 1.2, s.y - s.h / 2, 2.4, s.h * 0.45);
    c.strokeStyle = withAlpha(env.fill('rim'), 0.45);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(884, 512);
    c.lineTo(990, 470);
    c.stroke();
  }
  wellBase(c, env, { x: TOWN.well.x, y: TOWN.well.y });
}

// ------------------------------------------------------------------ L5: cobbles + stone railing
function railingStatic(c: C2, env: PaintEnv, r: Rect): void {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(r.x, 668, r.w, r.y + r.h - 668);
  // balusters and a coping rail
  c.fillRect(r.x, 652, r.w, 14);
  for (let x = r.x + 10; x < r.x + r.w; x += 34) {
    c.beginPath();
    c.moveTo(x - 6, 668);
    c.quadraticCurveTo(x - 10, 690, x - 5, 704);
    c.lineTo(x + 5, 704);
    c.quadraticCurveTo(x + 10, 690, x + 6, 668);
    c.closePath();
    c.fill();
  }
  c.fillRect(r.x, 700, r.w, r.y + r.h - 700);
  c.strokeStyle = withAlpha(env.mood.rim, 0.18);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(r.x, 652);
  c.lineTo(r.x + r.w, 652);
  c.stroke();
}

// ------------------------------------------------------------------ L6: the lamp-post
function lampPostStatic(c: C2, env: PaintEnv): void {
  const x = TOWN.post.x, hy = TOWN.post.head;
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(x - 9, hy + 30, 18, 900);
  c.fillRect(x - 14, hy + 26, 28, 8);
  // the lantern head: a tapered cage
  c.beginPath();
  c.moveTo(x - 22, hy + 26);
  c.lineTo(x - 30, hy - 26);
  c.lineTo(x + 30, hy - 26);
  c.lineTo(x + 22, hy + 26);
  c.closePath();
  c.moveTo(x - 20, hy + 20);
  c.lineTo(x + 20, hy + 20);
  c.lineTo(x + 25, hy - 20);
  c.lineTo(x - 25, hy - 20);
  c.closePath();
  c.fill('evenodd');
  c.fillRect(x - 2, hy - 26, 4, 46);
  c.beginPath();
  c.moveTo(x - 36, hy - 26);
  c.lineTo(x, hy - 50);
  c.lineTo(x + 36, hy - 26);
  c.closePath();
  c.fill();
  // a crossbar for ladders, and the pin board's hook (ch08-s01)
  c.fillRect(x - 40, hy + 64, 80, 6);
}

// ------------------------------------------------------------------ the orchestrator
export interface TownOpts {
  cams: Camera3[];
  cam: Camera3;
  variant?: 'night' | 'celld' | 'dawn';
  lamps?: TownLamps;
  lampTint?: Partial<Record<keyof TownLamps, string>>;
  lanterns?: LanternInWindow[];
  /** pulley lines 0..1 per house (default 1 for all) */
  lines?: Partial<Record<HouseId, number>>;
  /** celld neighbour cords A→B, A→C (0..1 drawn) */
  neighbourCords?: number;
  plate?: PlateState | null;
  tooth?: ToothState | null;
  well?: Omit<WellLiveOpts, 'x' | 'y'>;
  badge?: { text: BadgeText; alpha?: number; legible?: boolean; glint?: number; side?: 'left' | 'right' } | null;
  /** a mid-shot grade change (lampChange inside a shot): blend u is stepped in twelfths so baked layers re-bake at
   *  most 12 times (crossfadeMood gives every blend value its own mood id) */
  mood?: { to: MoodId; from: MoodId; u: number };
  shoreLamps?: number;
  moon?: number;
  lampPostLit?: number;
  /** draw the sender's cottage (default true) */
  sender?: boolean;
  /** backlight intensity (default 1) */
  sky?: number;
  plateLegible?: boolean;
  /** skip a layer entirely (e.g. 'L6' for shots that frame without the lamp-post) */
  skip?: Partial<Record<'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6', boolean>>;
}
type Hook = (c: C2, env: PaintEnv) => void;
export interface TownHooks {
  L1?: Hook;
  L2?: Hook;
  L3back?: Hook;
  L3?: Hook;
  L4back?: Hook;
  L4?: Hook;
  /** after f.rim(), before L5 (practicals of the action plane) */
  afterRim?: () => void;
  L5?: Hook;
  L6?: Hook;
}
const ext = (layer: keyof typeof LAYERS, cams: Camera3[], pad = 40) => overscan(LAYERS[layer], cams, pad);
const keyR = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

export function paintTown(f: Frame, o: TownOpts, hooks: TownHooks = {}): void {
  const variant = o.variant ?? 'night';
  const lamps = o.lamps ?? {};
  // near planes the dolly has passed (or nearly passed) are not drawn: they would fill the lens
  const skip = { ...(o.skip ?? {}) };
  if (o.cam.z > LAYERS.L6.z - 140) skip.L6 = true;
  if (o.cam.z > LAYERS.L5.z - 140) skip.L5 = true;
  f.camera(o.cam);
  if (o.mood) {
    const u = Math.round(clamp01(o.mood.u) * 12) / 12;
    if (u >= 1) f.setMood(o.mood.to);
    else if (u <= 0) f.setMood(o.mood.from);
    else f.setMood(o.mood.to, { from: o.mood.from, u });
  }
  f.backlight({ sunX: TOWN.moon.x, sunY: TOWN.moon.y + 30, intensity: o.sky ?? 1 });
  if (!skip.L1)
    f.layer('L1', (c, env) => {
      const r = ext('L1', o.cams, 60);
      seaAndShore(f, c, env, r, { lamps: o.shoreLamps ?? (variant === 'dawn' ? 0.3 : 1), moon: o.moon ?? 1, key: keyR(r) });
      hooks.L1?.(c, env);
    });
  if (!skip.L2)
    f.layer('L2', (c, env) => {
      const r = ext('L2', o.cams, 60);
      r.y = Math.min(r.y, 150);
      r.h = Math.max(r.h, 900 - r.y);
      bakeRect(f, c, env, `ridge/${keyR(r)}`, r, (cc) => ridgeStatic(cc, env, r));
      hooks.L2?.(c, env);
    });
  f.fog('A');
  if (!skip.L3) {
    f.layer('L3', (c, env) => {
      const r = ext('L3', o.cams, 60);
      r.y = Math.min(r.y, 150);
      r.h = Math.max(r.h, 900 - r.y);
      // window interiors first (the cached wall carries holes)
      const tint = o.lampTint ?? {};
      for (const id of ['A', 'B', 'C'] as HouseId[]) {
        windowInterior(c, env, TOWN[id].main, clamp01(lamps[id] ?? 0), tint[id]);
        const up = (id + 'up') as keyof TownLamps;
        windowInterior(c, env, TOWN[id].upper, clamp01(lamps[up] ?? 0), tint[up]);
      }
      for (const L of o.lanterns ?? []) {
        const wn = TOWN[L.house].main;
        roomLantern(c, env, { ...L, x: wn.x, y: wn.y + wn.h / 2 - 2, s: L.s ?? 0.5, hook: false });
      }
      hooks.L3back?.(c, env);
      bakeRect(f, c, env, `terrace/${keyR(r)}`, r, (cc) => terraceStatic(cc, env, r));
      hooks.L3?.(c, env);
    });
    // window practicals (behind the action plane: before L4)
    const seeds: Record<string, number> = { A: 3, B: 5, C: 7, Aup: 11, Bup: 13, Cup: 17 };
    for (const id of ['A', 'B', 'C'] as HouseId[]) {
      const k = clamp01(lamps[id] ?? 0);
      if (k > 0.02) f.practical({ x: TOWN[id].main.x, y: TOWN[id].main.y, kind: 'lamp', seed: seeds[id], intensity: 0.55 * k, radius: 54, layer: 'L3' });
      const ku = clamp01(lamps[(id + 'up') as keyof TownLamps] ?? 0);
      if (ku > 0.02) f.practical({ x: TOWN[id].upper.x, y: TOWN[id].upper.y, kind: 'lamp', seed: seeds[id + 'up'], intensity: 0.45 * ku, radius: 38, layer: 'L3' });
    }
  }
  f.fog('B');
  if (!skip.L4) {
    f.layer('L4', (c, env) => {
      const r = ext('L4', o.cams, 60);
      const sq = { x: r.x, y: Math.min(r.y, 300), w: r.w, h: Math.max(r.y + r.h, 760) - Math.min(r.y, 300) };
      // the sender's window interior (behind the cottage wall)
      if (o.sender !== false) {
        const sw = TOWN.sender.win;
        windowInterior(c, env, sw, 0.55, '#f0b868');
      }
      hooks.L4back?.(c, env);
      bakeRect(f, c, env, `square/${o.sender !== false ? 's' : 'n'}/${keyR(sq)}`, sq, (cc) => squareStatic(cc, env, sq, { sender: o.sender !== false }));
      // pulley lines from each house's sill block to the wellhead pulley (crossing layers: converted per frame)
      const lines = o.lines ?? {};
      for (const id of ['A', 'B', 'C'] as HouseId[]) {
        const u = clamp01(lines[id] ?? 1);
        if (u <= 0.01) continue;
        const a = l3ToL4(o.cam, TOWN[id].pulley);
        cord(c, a.x, a.y, PULLEY_TOP.x, PULLEY_TOP.y, sagFor(id), withAlpha(env.fill('ink'), 0.85), 1.1, u);
      }
      const nc = clamp01(o.neighbourCords ?? (variant === 'celld' ? 1 : 0));
      if (nc > 0.01) {
        const a = l3ToL4(o.cam, TOWN.A.sill);
        for (const id of ['B', 'C'] as HouseId[]) {
          const b = l3ToL4(o.cam, TOWN[id].sill);
          cord(c, a.x, a.y, b.x, b.y, 22, withAlpha(mixLab(env.fill('ink'), env.mood.halo, 0.25), 0.9), 0.9, nc);
        }
      }
      const W = { x: TOWN.well.x, y: TOWN.well.y };
      wellLive(c, env, { ...W, ...(o.well ?? {}) });
      if (o.plate) drawPlate(c, env, { ...W, plate: o.plate, legible: o.plateLegible, id: 'town-plate', face: variant === 'celld' ? 'plain' : 'brass' });
      if (o.tooth) drawTooth(c, env, { ...W, tooth: o.tooth });
      if (o.badge && (o.badge.alpha ?? 1) > 0.01) {
        const hook = o.badge.side === 'right' ? WELL.hookR : WELL.hook;
        const hk = { x: W.x + hook.x, y: W.y + hook.y };
        drawBadge(c, env, { x: hk.x + (o.badge.side === 'right' ? -7 : 7), y: hk.y - 2, text: o.badge.text, alpha: o.badge.alpha ?? 1, legible: o.badge.legible ?? false, glint: o.badge.glint, swing: 0.03 * Math.sin(env.tq * 1.3), id: 'town-badge' });
      }
      hooks.L4?.(c, env);
    });
    f.rim({ x: 0, y: -1 });
    hooks.afterRim?.();
  }
  if (!skip.L5)
    f.layer('L5', (c, env) => {
      const r = ext('L5', o.cams, 80);
      const rr = { x: r.x, y: 640, w: r.w, h: Math.max(140, r.y + r.h - 640) };
      bakeRect(f, c, env, `rail/${keyR(rr)}`, rr, (cc) => railingStatic(cc, env, rr));
      hooks.L5?.(c, env);
    });
  if (!skip.L6) {
    f.layer('L6', (c, env) => {
      const rr = { x: TOWN.post.x - 60, y: TOWN.post.head - 70, w: 120, h: 900 };
      bakeRect(f, c, env, 'post', rr, (cc) => lampPostStatic(cc, env));
      hooks.L6?.(c, env);
    });
    const pl = clamp01(o.lampPostLit ?? 0);
    if (pl > 0.01) f.practical({ x: TOWN.post.x, y: TOWN.post.head, kind: 'lamp', seed: 29, intensity: 0.4 * pl, radius: 70, layer: 'L6' });
  }
}

/** a lamp gutter curve: 1 lit → flickers twice → 0 (u 0..1 across the gutter) */
export function gutter(u: number, tq: number): number {
  if (u <= 0) return 1;
  if (u >= 1) return 0;
  const base = 1 - u;
  const fl = Math.sin(tq * 41) > 0.2 ? 1 : 0.35;
  return Math.max(0, base * (u > 0.15 && u < 0.85 ? fl : 1));
}
