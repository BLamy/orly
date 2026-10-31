/**
 * ch02-s06 — the Lifespan Rule shown once, the others along the way, then the echo into the present.
 *
 * A PERIOD-ROOMS pull-out (staging.tagLine.variants ch02): the old bronze line, slung at 50 % of frame, runs
 * left to right through each era's room (the 1940s study's gothic window bay with its curtain rod, the 1951
 * office with a hat-and-coat stand holding the wire, the cool modern bench, then the canonical workshop with
 * its turned post). From tag 2 (where ch02-s05 left us) the camera pulls out to the whole line in one wide
 * frame. The Lifespan Rule lies along the bottom of frame on the bench apron, SCREEN-LOCKED (it measures how
 * long, never when): on 'wide' its seven ticks light left to right (unlabelled: ch01 named them) and a copper
 * bracket arcs over each gap, each one visibly taller than the last (its height is the log of the real jump:
 * 23 h, 6 d, ~3 wk, ~11 mo, 9 y, 70 y), and the caption names the rule. Every thread already sits where its
 * lifespan puts it (sets/tagLine registry): tag 1's frayed biology strand at ~77 y, its engineering strand's
 * glowing open tip just past the lifetime tick (~83 y), tag 2's open tip at ~7.6 y; qK hangs on its plain loop.
 * On 'writing' a small typed card (1992–2026) swings onto the line in tie order right of tag 2, no drop; the
 * second caption sets its names and dates and the card takes a short warm rim glow. The held threads (tag 1's
 * engineering strand, tag 2) run along the rule's face as copper over a halo, each on its own lane, so every tip
 * stays tied to its tag; the biology strand runs pale on the top lane and frays apart from the engineering tip.
 * On 'Eighty-three years' a copper glint runs the whole engineering strand from tag 1's knot to its open tip,
 * flaring on 'years'; tag 1 glows on 'oldest'. On 'years' the camera tracks along the line toward the newest tags
 * while the rule stays fixed; dull bronze gives way to copper at the modern room, the dusk backlight warms toward
 * lamplight, and the HandwiredOS desk rises out of the haze at the line's end with its anglepoise lamp, swelling
 * on 'desktop'. On 'hand' the narrator's hands are glimpsed at lower left, in front of the dark apron under the
 * rule, bending a single copper length, flat then up. A blurred L5 chair back and bench end pass the lens.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Palette } from '../../../film';
import {
  CAMERA3_HOME,
  FONT,
  LAYERS,
  anglepoiseLamp,
  cam3Interp,
  crossfadeMood,
  defineShot,
  legibleSize,
  mixLab,
  overscan,
  softPlate,
  textColor,
  textProbe,
  textRole,
  toLayer,
  toScreen,
  typewriter,
  windowWall,
  withAlpha,
  writingDesk,
  layerXform,
} from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { TAG, TAGS, TICKS, drawRule, drawTag, drawThread, lifeX, tagsAt, type TagId, type TagState } from '../sets/tagLine';
import { copperOf, drawPencil } from '../sets/narratorHands';
import { handwiredDesk } from '../sets/handwiredDesk';
import { hands } from '../cast';

type C = CanvasRenderingContext2D;
const ID = 'ch02-s06';

// ---------------------------------------------------------------- camera
const CAM_A: Camera3 = { ...CAMERA3_HOME, x: 150, y: 372, z: 200 }; // on tag 2, where ch02-s05 left us
const CAM_B: Camera3 = { ...CAMERA3_HOME, x: 360, y: 352, z: -360 }; // the whole line in one wide frame
const CAM_C: Camera3 = { ...CAMERA3_HOME, x: 900, y: 362, z: -260 }; // the newest tags, the desk rising
const CAMS = [CAM_A, CAM_B, CAM_C, { ...CAM_B, x: 700, z: -320 }];

// ---------------------------------------------------------------- the line (L4 world, ch02: 50 % of frame)
const LINE_Y = 360;
const SUP = [-340, 10, 1120] as const; // curtain-rod end (study) · coat-stand hook (office) · turned post (workshop)
const SAG = [6, 18];
function lineY(x: number): number {
  for (let i = 0; i < SUP.length - 1; i++) {
    const a = SUP[i], b = SUP[i + 1];
    if (x >= a && x <= b) {
      const u = (x - a) / (b - a);
      return LINE_Y + SAG[i] * 4 * u * (1 - u);
    }
  }
  return LINE_Y;
}
/** tie order, left to right (tag 1 far left; the typed card right of tag 2; ch01's tags toward the workshop) */
const X: Partial<Record<TagId, number>> = { '1': -200, qK: -80, '2': 110, lineage: 228, '3': 520, '4': 640, '5': 760, '6': 880, why: 1000 };

// ---------------------------------------------------------------- the Lifespan Rule (SCREEN px: it never moves)
const RULE_S = { x0: 96, x1: 1184, y: 560 };
const APRON_Y = 546;
/** the real jump between consecutive ticks, in hours (an hour→a day … a decade→a lifetime) */
const JUMPS_H = TICKS.slice(1).map((t, i) => (t.days - TICKS[i].days) * 24);
const BRACKET_H = JUMPS_H.map((h) => 6 + 11 * (Math.log10(h) - 1.2)); // 8 → 57 px: each visibly taller than the last

// ---------------------------------------------------------------- rooms (L2 / L3 x from the wide frame's screen)
const mapX = (layer: keyof typeof LAYERS, worldX: number) => toLayer(LAYERS[layer], CAM_B, toScreen(LAYERS.L4, CAM_B, worldX, LINE_Y).x, LINE_Y).x;
const ROOM = { studyEnd: -135, officeEnd: 50, modernEnd: 400 };

// the HandwiredOS desk: placed so it sits small at the line's right end in the closing frame
const BENCH_TOP = 510; // L3 rest y of every room's bench / table top
const DESK_W = 190 / (layerXform(LAYERS.L3, CAM_C).k || 1);
const DESK_TL = { x: toLayer(LAYERS.L3, CAM_C, 880, 300).x, y: BENCH_TOP - DESK_W * 0.625 - DESK_W * 0.05 * 0.8 };

// ---------------------------------------------------------------- helpers
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function bake(f: Frame, c: C, env: PaintEnv, key: string, r: { x: number; y: number; w: number; h: number }, paint: (cc: C) => void) {
  f.cached(`${ID}/${key}/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

/** screen-locked drawing inside a layer callback (the rule, the apron) */
function screenLocked(c: C, cam: Camera3, draw: () => void) {
  const m = layerXform(LAYERS.L4, cam);
  c.save();
  c.translate(-m.tx / m.k, -m.ty / m.k);
  c.scale(1 / m.k, 1 / m.k);
  draw();
  c.restore();
}

// ---------------------------------------------------------------- L2: the period rooms' back walls
/** the same env with the set / near fills pushed toward ink (deeper walls, the window panes stay bright) */
function inked(env: PaintEnv, k: number): PaintEnv {
  return { ...env, fill: (role) => (role === 'set' || role === 'fg' ? mixLab(env.fill(role), PUPPET_NEAR_BLACK, k) : env.fill(role)) };
}
function roomsWall(c: C, env0: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const env = inked(env0, 0.24);
  const b1 = mapX('L2', ROOM.studyEnd), b2 = mapX('L2', ROOM.officeEnd), b3 = mapX('L2', ROOM.modernEnd);
  const H = 760 - r.y;
  const seg = (x0: number, x1: number, o: Partial<Parameters<typeof windowWall>[1]>, centers: number[]) =>
    windowWall(c, { x: x0, y: r.y, w: x1 - x0, h: H, centers: centers.filter((x) => x > x0 + 40 && x < x1 - 40), winW: 160, apex: 80, sill: 540, ...o } as Parameters<typeof windowWall>[1], env);
  // 1940s study: gothic lancets with quatrefoil tracery
  const st: number[] = [];
  for (let x = b1 - 150; x > r.x - 200; x -= 250) st.push(x);
  seg(r.x, b1, { shape: 'pointed', winW: 168, apex: 60, sill: 540, lights: 2, panes: { cols: 2, rows: 8 }, transoms: [0.36], tracery: 'quatrefoil', spandrel: 'trefoil', cornice: 0, wainscot: 110, shade: 0.5, seed: 11 }, st);
  // 1951 office: one tall sash window, a lower ceiling
  seg(b1, b2, { shape: 'flat', winW: 120, apex: 150, sill: 500, lights: 2, panes: { cols: 2, rows: 3 }, transoms: [], tracery: 'none', spandrel: 'none', cornice: 40, wainscot: 140, glass: 0.4, shade: 0.5, seed: 12 }, [(b1 + b2) / 2]);
  // the cool modern room: a wide glazed wall, thin mullions
  seg(b2, b3, { shape: 'flat', winW: Math.max(140, (b3 - b2) * 0.3), apex: 90, sill: 560, lights: 3, panes: { cols: 1, rows: 2 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: false, cornice: 0, wainscot: 0, glass: 0.2, shade: 0.5, seed: 13 }, [b2 + (b3 - b2) * 0.27, b2 + (b3 - b2) * 0.73]);
  // the workshop (canonical): tall flat-headed paned windows
  const ws: number[] = [];
  for (let x = b3 + 170; x < r.x + r.w + 200; x += 380) ws.push(x);
  seg(b3, r.x + r.w, { shape: 'flat', winW: 160, apex: 50, sill: 560, lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: 0.6, shade: 0.5, seed: 23 }, ws);
  // a deep pier between rooms: the line passes from one era into the next
  c.fillStyle = env.fill('set');
  for (const bx of [b1, b2, b3]) {
    c.fillRect(bx - 22, r.y, 44, H);
    c.strokeStyle = withAlpha(env.mood.rim, 0.16);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(bx - 14, r.y);
    c.lineTo(bx - 14, 760);
    c.moveTo(bx + 14, r.y);
    c.lineTo(bx + 14, 760);
    c.stroke();
  }
}

// ---------------------------------------------------------------- L3: each room's furniture (peeks over the apron)
function filingCabinet(c: C, env: PaintEnv, x: number, floor: number) {
  const w = 86, h = 236;
  c.fillStyle = env.fill('set');
  c.fillRect(x - w / 2, floor - h, w, h);
  c.fillRect(x - w / 2 - 3, floor - h - 4, w + 6, 6);
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    const y = floor - h + (h * i) / 4;
    c.beginPath();
    c.moveTo(x - w / 2 + 4, y);
    c.lineTo(x + w / 2 - 4, y);
    c.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const y = floor - h + (h * (i + 0.3)) / 4;
    c.strokeRect(x - 14, y, 28, 7);
  }
}
function benchTop(c: C, env: PaintEnv, x0: number, x1: number, top: number, legs: number[]) {
  c.fillStyle = env.fill('set');
  c.fillRect(x0, top, x1 - x0, 14);
  c.fillRect(x0 + 6, top + 14, x1 - x0 - 12, 10);
  for (const lx of legs) c.fillRect(lx - 6, top + 24, 12, 260);
  c.strokeStyle = withAlpha(env.mood.rim, 0.25);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x0, top + 0.6);
  c.lineTo(x1, top + 0.6);
  c.stroke();
}
function furniture(c: C, env: PaintEnv) {
  const floor = 660;
  // study: a pedestal writing desk with a stack of books
  writingDesk(c, { x: mapX('L3', -300), y: floor, s: 1, variant: 'pedestal' }, env);
  // office: a filing cabinet and a typewriter on a small table
  filingCabinet(c, env, mapX('L3', -95), floor);
  benchTop(c, env, mapX('L3', -40) - 70, mapX('L3', -40) + 70, BENCH_TOP + 10, [mapX('L3', -40) - 60, mapX('L3', -40) + 60]);
  typewriter(c, { x: mapX('L3', -40), y: BENCH_TOP + 10, s: 0.8 }, env);
  // the modern bench: long and plain, an anglepoise lamp folded over it
  const m0 = mapX('L3', ROOM.officeEnd + 30), m1 = mapX('L3', ROOM.modernEnd - 30);
  benchTop(c, env, m0, m1, BENCH_TOP, [m0 + 20, m1 - 20]);
  anglepoiseLamp(c, { x: m0 + (m1 - m0) * 0.72, y: BENCH_TOP, s: 0.9, reach: 0.4, lit: false }, env);
  // the workshop bench (the desk rises onto its far end)
  const w0 = mapX('L3', ROOM.modernEnd + 30);
  benchTop(c, env, w0, DESK_TL.x + DESK_W + 260, BENCH_TOP, [w0 + 30, w0 + 420, DESK_TL.x + DESK_W + 200]);
}

// ---------------------------------------------------------------- L4: supports, line, tags
/** the study's curtain rod at the line's left end: rod, finial and rings (the drape is drawn back out of shot) */
function curtain(c: C, env: PaintEnv) {
  const ink = PUPPET_NEAR_BLACK;
  const rx = SUP[0];
  c.fillStyle = ink;
  // rod and finial
  c.fillRect(rx - 520, LINE_Y - 22, 520, 7);
  c.beginPath();
  c.ellipse(rx + 6, LINE_Y - 18.5, 9, 8, 0, 0, Math.PI * 2);
  c.fill();
  // the rod bracket and a few bare rings
  const top = LINE_Y - 15;
  c.fillRect(rx - 30, LINE_Y - 30, 6, 20);
  c.beginPath();
  for (let i = 0; i < 6; i++) c.rect(rx - 470 + i * 80, top - 4, 7, 10);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.4);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(rx - 520, LINE_Y - 21.4);
  c.lineTo(rx, LINE_Y - 21.4);
  c.stroke();
}
/** the 1951 office's bentwood hat-and-coat stand: its top hook carries the wire */
function coatStand(c: C, env: PaintEnv) {
  const x = SUP[1];
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  c.fillRect(x - 4, LINE_Y - 6, 8, 900);
  c.beginPath();
  c.ellipse(x, LINE_Y - 30, 7, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 3, LINE_Y - 24, 6, 20);
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = 5;
  for (const [dx, dy, s] of [[-1, 0, 1], [1, 0, 1], [-1, 46, 0.8], [1, 46, 0.8]] as const) {
    c.beginPath();
    c.moveTo(x, LINE_Y - 4 + dy);
    c.bezierCurveTo(x + dx * 26 * s, LINE_Y - 2 + dy, x + dx * 30 * s, LINE_Y - 24 + dy, x + dx * 20 * s, LINE_Y - 28 + dy);
    c.stroke();
  }
  // a hat left on the lower left hook (a fedora's crown and brim)
  c.beginPath();
  c.ellipse(x - 26, LINE_Y + 34, 24, 5, -0.08, 0, Math.PI * 2);
  c.moveTo(x - 42, LINE_Y + 33);
  c.bezierCurveTo(x - 42, LINE_Y + 10, x - 12, LINE_Y + 8, x - 10, LINE_Y + 33);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - 40, LINE_Y + 27);
  c.lineTo(x - 12, LINE_Y + 27);
  c.stroke();
}
/** the workshop's turned post (canonical) at the line's right end */
function turnedPost(c: C, env: PaintEnv) {
  const px = SUP[2], y = LINE_Y;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(px, y - 22, 7, 8, 0, 0, Math.PI * 2);
  c.rect(px - 3, y - 15, 6, 6);
  c.rect(px - 8, y - 10, 16, 5);
  c.rect(px - 5.5, y - 6, 11, 800);
  c.rect(px - 9, y + 26, 18, 6);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(px, y - 22, 7, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
}
/** the wire: old dull bronze through the period rooms, copper from the modern bench on */
function wire(c: C, env: PaintEnv, glow: number) {
  const x0 = SUP[0] + 4, x1 = SUP[2];
  // dull, dark bronze through the study and the office; copper from the modern room's pier on
  const bronze = mixLab('#6e5530', env.mood.set, 0.12);
  const copper = copperOf(env, glow);
  const g = c.createLinearGradient(x0, 0, x1, 0);
  const at = (x: number) => clamp01((x - x0) / (x1 - x0));
  g.addColorStop(0, bronze);
  g.addColorStop(at(ROOM.officeEnd - 10), bronze);
  g.addColorStop(at(ROOM.officeEnd + 90), copper);
  g.addColorStop(1, copper);
  const path = () => {
    c.beginPath();
    for (let k = 0; k <= 96; k++) {
      const x = x0 + ((x1 - x0) * k) / 96;
      if (k === 0) c.moveTo(x, lineY(x));
      else c.lineTo(x, lineY(x));
    }
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  const gg = c.createLinearGradient(x0, 0, x1, 0);
  gg.addColorStop(0, withAlpha(env.mood.core, 0.0));
  gg.addColorStop(at(ROOM.officeEnd - 10), withAlpha(env.mood.core, 0.01));
  gg.addColorStop(at(ROOM.officeEnd + 90), withAlpha(env.mood.core, 0.1 * (0.5 + glow)));
  gg.addColorStop(1, withAlpha(env.mood.core, 0.14 * (0.5 + glow)));
  c.strokeStyle = gg;
  c.lineWidth = 7;
  path();
  c.stroke();
  c.restore();
  c.strokeStyle = g;
  c.lineWidth = 2.4;
  path();
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.4);
  c.lineWidth = 0.9;
  c.save();
  c.translate(0, -0.9);
  path();
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- threads: copper runs and the travelling glint
type P = { x: number; y: number };
/** the same path drawThread takes (drop, quarter turn of radius 10, run along the rule's face to lx) */
function strandPts(from: P, lx: number, ry: number): P[] {
  const R = 10;
  const dir = lx >= from.x ? 1 : -1;
  const drop = Math.max(0, ry - R - from.y);
  const pts: P[] = [{ ...from }, { x: from.x, y: from.y + drop }];
  const cx = from.x + dir * R, cy = from.y + drop;
  for (let i = 1; i <= 6; i++) {
    const th = (dir > 0 ? Math.PI : 0) - dir * (Math.PI / 2) * (i / 6);
    pts.push({ x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R });
  }
  pts.push({ x: lx, y: ry });
  return pts;
}
function strokePts(c: C, pts: P[]) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
}
/** the sub-polyline between arc lengths a and b */
function subPath(pts: P[], a: number, b: number): P[] {
  const out: P[] = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    const L = Math.hypot(q.x - p.x, q.y - p.y);
    const s0 = Math.max(a, acc), s1 = Math.min(b, acc + L);
    if (s1 > s0 && L > 0) {
      const at = (s: number) => ({ x: p.x + ((q.x - p.x) * (s - acc)) / L, y: p.y + ((q.y - p.y) * (s - acc)) / L });
      if (!out.length) out.push(at(s0));
      out.push(at(s1));
    }
    acc += L;
  }
  return out;
}
const pathLen = (pts: P[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
/** a held thread reads as copper: a soft additive underglow and a 3 px copper halo under drawThread's stroke */
function copperRun(c: C, env: PaintEnv, pts: P[], k4: number, glow: number) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(env.mood.core, 0.1 * glow);
  c.lineWidth = 7 / k4;
  strokePts(c, pts);
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = withAlpha(copperOf(env, 0.45), 0.8);
  c.lineWidth = 3.2 / k4;
  strokePts(c, pts);
  c.restore();
}
/** a glint of copper light travelling along a path: head at fraction u, a fading trail behind it */
function glint(c: C, env: PaintEnv, pts: P[], u: number, a: number, k4: number) {
  if (a <= 0.001) return;
  const L = pathLen(pts);
  const s = u * L, trail = 90 / k4;
  c.save();
  c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  const n = 8;
  for (let i = 0; i < n; i++) {
    const seg = subPath(pts, s - trail * (1 - i / n), s - trail * (1 - (i + 1) / n));
    if (seg.length < 2) continue;
    c.strokeStyle = withAlpha(copperOf(env, 1), 0.85 * a * ((i + 1) / n) ** 1.6);
    c.lineWidth = (2.5 + 2 * (i / n)) / k4;
    strokePts(c, seg);
  }
  const head = subPath(pts, Math.max(0, s - 0.01), s).pop() ?? pts[0];
  const r = 16 / k4;
  const g = c.createRadialGradient(head.x, head.y, 0, head.x, head.y, r);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.15), 0.9 * a));
  g.addColorStop(0.35, withAlpha(copperOf(env, 1), 0.5 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(head.x - r, head.y - r, 2 * r, 2 * r);
  c.restore();
}
/** a warm rim glow behind a tag (additive): the tags' highlight, read at a distance */
function tagHalo(c: C, env: PaintEnv, cx: number, cy: number, rx: number, ry: number, a: number) {
  if (a <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(cx, cy);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, rx * 0.35, 0, 0, rx);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * a));
  g.addColorStop(0.6, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.5), 0.25 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
}

// ---------------------------------------------------------------- L5: the near plane (blurred, passes the lens)
/** the near bench edge along the bottom of frame: rises into view as we pull out; a vise sits on it at lower right
 *  in the wide frame and a hand plane at lower left at the close (low, so they never cross the rule or the tags) */
const PLANK_TOP = toLayer(LAYERS.L5, CAM_B, 640, 664).y;
const VISE_X = toLayer(LAYERS.L5, CAM_B, 1176, 664).x;
const PLANE_X = toLayer(LAYERS.L5, CAM_C, 92, 664).x;
function nearBench(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const ink = PUPPET_NEAR_BLACK;
  const y = PLANK_TOP;
  c.fillStyle = ink;
  c.fillRect(r.x, y, r.w, r.y + r.h - y);
  // the vise and the plane at 1.35x (the near plane is close to the lens)
  for (const ox of [VISE_X, PLANE_X]) {
    c.save();
    c.beginPath();
    c.rect(ox - 220, y - 200, 440, 200);
    c.clip();
    c.translate(ox, y);
    c.scale(1.35, 1.35);
    c.translate(-ox, -y);
    viseAndPlane(c, env, y);
    c.restore();
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.75);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(r.x, y + 1.5);
  c.lineTo(r.x + r.w, y + 1.5);
  c.stroke();
}
function viseAndPlane(c: C, env: PaintEnv, y: number) {
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  // a bench vise: body, jaws, the screw and its tommy bar
  const v = VISE_X;
  c.beginPath();
  c.rect(v - 46, y - 40, 74, 40);
  c.rect(v - 52, y - 54, 12, 54);
  c.rect(v + 22, y - 54, 12, 54);
  c.rect(v + 34, y - 34, 46, 9);
  c.rect(v + 76, y - 58, 7, 56);
  c.fill();
  c.beginPath();
  c.arc(v + 79.5, y - 60, 6, 0, Math.PI * 2);
  c.arc(v + 79.5, y - 2, 6, 0, Math.PI * 2);
  c.fill();
  // a hand plane: body, the front knob and the rear tote
  const p = PLANE_X;
  c.beginPath();
  c.moveTo(p - 70, y);
  c.lineTo(p - 64, y - 18);
  c.lineTo(p + 66, y - 18);
  c.lineTo(p + 72, y);
  c.closePath();
  c.rect(p - 50, y - 30, 14, 12);
  c.fill();
  c.beginPath();
  c.ellipse(p - 43, y - 33, 9, 8, 0, 0, Math.PI * 2);
  c.moveTo(p + 22, y - 18);
  c.bezierCurveTo(p + 24, y - 54, p + 52, y - 62, p + 58, y - 46);
  c.bezierCurveTo(p + 52, y - 40, p + 48, y - 30, p + 50, y - 18);
  c.closePath();
  c.fill();
  // the lamplight catches only the top edges
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.8);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(v - 52, y - 52.5);
  c.lineTo(v - 40, y - 52.5);
  c.moveTo(v - 40, y - 38.5);
  c.lineTo(v + 22, y - 38.5);
  c.moveTo(v + 22, y - 52.5);
  c.lineTo(v + 34, y - 52.5);
  c.moveTo(p - 64, y - 16.5);
  c.lineTo(p + 22, y - 16.5);
  c.moveTo(p + 26, y - 40);
  c.bezierCurveTo(p + 30, y - 56, p + 50, y - 62, p + 57, y - 48);
  c.stroke();
}

/** the state of every tag on the line at shot time t (ch01's and ch02's, plus the typed card when it swings on) */
const BASE_STATES: TagState[] = tagsAt(ID, 'start').filter((s) => X[s.id] !== undefined);

// ---------------------------------------------------------------- the shot
export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    // smoothstep eases (peak 1.5x the mean speed) keep both moves near 6 % of frame width per second
    tl.tween(cam, CAM_B, { at: 0, dur: 5.0, ease: sm });
    const trackAt = T.word('L0212', 0) - 0.05; // the track begins as the turn to the present does ('Eighty-three years')
    tl.tween(cam, CAM_C, { at: trackAt, dur: T.duration - trackAt - 0.3, ease: sm });
    tl.hold(0, T.duration);
    return {
      tl,
      cam,
      dur: T.duration,
      wide: T.beat('wide'),
      others: T.beat('others'),
      present: T.beat('present'),
      hand: T.beat('hand'),
      eighty: T.word('L0212', 0),
      oldest: T.word('L0212', 'oldest'),
      desktop: T.word('L0212', 'desktop'),
      trackAt,
    };
  },
  paint(f, s, sc) {
    const t = f.t;
    const cam = s.get(sc.cam);
    // dusk turning to lamplight: the backlight and the haze warm toward the parchment plate as we reach the present
    const warm = sm((t - sc.present + 0.2) / 5.6);
    const live: Palette = crossfadeMood('duskRose', 'candleAmber', 0.75 * warm);
    f.camera(cam);
    f.setMood(live);
    f.backlight({ sunX: 560 + 360 * warm, intensity: 1 + 0.08 * warm });

    // ---- L2: the period rooms (cached, in the fixed duskRose ink so the bake holds; walls pushed toward ink)
    f.setMood('duskRose');
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 60);
      const rr = { x: r.x, y: Math.min(-40, r.y), w: r.w, h: 800 - Math.min(-40, r.y) };
      bake(f, c, env, 'rooms-ink', rr, (cc) => roomsWall(cc, env, rr));
    });
    f.setMood(live);
    // fog A a quarter thinner than the kit's default so the deep walls and the bright panes separate
    f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.23, drift: 6 });

    // ---- L3: the rooms' furniture, then the HandwiredOS desk rising out of the haze at the line's end
    f.setMood('duskRose');
    const rise = sm(win(t, sc.present + 1.4, sc.present + 4.6));
    // on 'desktop' the desk's lamp and screen swell once (0.4 s up), then settle a little
    const swell = sm(win(t, sc.desktop - 0.1, sc.desktop + 0.3)) * (1 - 0.45 * sm(win(t, sc.desktop + 0.9, sc.desktop + 2.0)));
    const k3C = layerXform(LAYERS.L3, CAM_C).k || 1;
    const LAMP = { x: DESK_TL.x + DESK_W + 62 / k3C, y: BENCH_TOP, s: 0.8 / k3C, reach: 0.45, flip: true, lit: true };
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, CAMS, 60);
      const rr = { x: r.x, y: 300, w: r.w, h: 500 };
      bake(f, c, env, 'furniture', rr, (cc) => furniture(cc, env));
      if (rise > 0.001) {
        c.save();
        c.globalAlpha = rise;
        const dy = 150 * (1 - rise);
        handwiredDesk(f, c, env, { x: DESK_TL.x, y: DESK_TL.y + dy, w: DESK_W, proscenium: true, lamp: 0.55 + 0.45 * rise, wire: 0.3 + 0.5 * rise + 0.2 * swell, translucency: 0, wallpaper: 0.8, key: ID });
        // the desk's own lamp: an anglepoise on the bench, leaning over the desk
        anglepoiseLamp(c, { ...LAMP, y: LAMP.y + dy }, env);
        c.restore();
      }
    });
    // its lamp and the desk's warmth: the one warm practical, lit as the desk arrives (behind the action plane)
    if (rise > 0.01) {
      const bulb = anglepoiseLamp.anchors({ ...LAMP, y: LAMP.y + 150 * (1 - rise) }).bulb;
      f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 62, intensity: (0.8 + 0.3 * swell) * rise, radius: 40 + 12 * swell, layer: 'L3' });
      if (swell > 0.01) f.practical({ x: DESK_TL.x + DESK_W / 2, y: DESK_TL.y + DESK_W * 0.3, kind: 'screen', seed: 63, intensity: 0.42 * swell * rise, radius: DESK_W * 0.42 * k3C, layer: 'L3' });
    }
    f.setMood(live);
    f.fog('B');

    // ---- L4: the apron and the Lifespan Rule (screen-locked), then the line, threads and tags
    // the ticks light fast so every bracket is drawn before 'writing'
    const ticks = win(t, sc.wide + 0.1, sc.wide + 1.5);
    const brackets = 1 - 0.65 * win(t, sc.present - 0.6, sc.present + 0.6);
    // 'Eighty-three years': a glint runs the engineering strand from tag 1's knot to its tip, landing on 'years'
    const gStart = sc.eighty - 0.3;
    const gU = sm(win(t, gStart, sc.present));
    const gA = win(t, gStart, gStart + 0.12) * (1 - win(t, sc.present, sc.present + 0.2));
    const flare = Math.exp(-Math.pow((t - (sc.present + 0.08)) / 0.4, 2));
    // tag 1 glows on 'oldest'; the typed card glows as its caption sets
    const g1 = Math.exp(-Math.pow((t - (sc.oldest + 0.2)) / 0.45, 2));
    const gCard = Math.exp(-Math.pow((t - (sc.others + 0.4)) / 0.17, 2));
    f.layer('L4', (c, env) => {
      const k4 = layerXform(LAYERS.L4, cam).k || 1;
      // the room's supports and the wire (behind the apron: their feet stand on the bench below the rule)
      curtain(c, env);
      coatStand(c, env);
      turnedPost(c, env);
      wire(c, env, 0.35 + 0.35 * warm);
      screenLocked(c, cam, () => {
        // the bench apron the rule lies on (featureless, so it holds still under the truck)
        const g = c.createLinearGradient(0, APRON_Y, 0, 720);
        g.addColorStop(0, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.55));
        g.addColorStop(0.25, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.72));
        g.addColorStop(1, PUPPET_NEAR_BLACK);
        c.fillStyle = g;
        c.fillRect(-40, APRON_Y, 1360, 760 - APRON_Y);
        c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-40, APRON_Y + 0.6);
        c.lineTo(1320, APRON_Y + 0.6);
        c.stroke();
        drawRule(c, env, { x0: RULE_S.x0, x1: RULE_S.x1, y: RULE_S.y, labels: 0, ticks });
        // the jump brackets: one copper arc over each gap, lit as the next tick lights, each taller than the last
        const R = { x0: RULE_S.x0, x1: RULE_S.x1 };
        for (let i = 0; i < BRACKET_H.length; i++) {
          const u = clamp01(ticks * TICKS.length - (i + 1));
          if (u <= 0) continue;
          const xa = lifeX(TICKS[i].days, R), xb = lifeX(TICKS[i + 1].days, R);
          const h = BRACKET_H[i];
          const y0 = RULE_S.y - 3;
          c.strokeStyle = withAlpha(copperOf(env, 0.7), 0.9 * brackets);
          c.lineWidth = 1.6;
          c.beginPath();
          const n = 24;
          for (let k = 0; k <= n * u; k++) {
            const q = k / n;
            const x = xa + (xb - xa) * q;
            const y = y0 - h * Math.sin(Math.PI * q);
            if (k === 0) c.moveTo(x, y0);
            else c.lineTo(x, y);
          }
          c.stroke();
          // feet: short down-ticks at each end of the bracket
          c.beginPath();
          c.moveTo(xa, y0 - 5);
          c.lineTo(xa, y0);
          if (u >= 1) {
            c.moveTo(xb, y0 - 5);
            c.lineTo(xb, y0);
          }
          c.stroke();
        }
      });
      // the rule in L4 coordinates for the threads
      const pa = toLayer(LAYERS.L4, cam, RULE_S.x0, RULE_S.y);
      const pb = toLayer(LAYERS.L4, cam, RULE_S.x1, RULE_S.y);
      const rL4 = { x0: pa.x, x1: pb.x };
      const ruleY = pa.y;
      /** each strand's run on its own lane of the rule's face (screen px under the rule's top edge) */
      const laneFor = (off: number) => (off / k4 - 5) / 2.6;

      // the typed card: slides along the wire from the right and swings to rest at its tie-order place
      const cardIn = sc.others - 0.18;
      const tc = env.tq - cardIn;
      const slide = sm(tc / 0.62);
      const states: TagState[] = BASE_STATES.map((st) => ({ ...st }));
      if (tc > 0) states.push({ id: 'lineage', ink: 1, knotIn: 1, alpha: clamp01(tc / 0.3), swing: 0 });
      states.sort((a, b) => (X[a.id] ?? 0) - (X[b.id] ?? 0));

      // threads first (behind the tags): the held ones over a copper halo, the biology strand pale on the top lane
      let engPath: P[] | null = null;
      let engTip: P | null = null;
      for (const st of states) {
        const def = TAGS[st.id];
        const x = X[st.id]!;
        const eyeY = lineY(x) + TAG.string;
        const small = def.kind === 'question' || def.kind === 'card';
        const bottom = { x, y: eyeY + (small ? TAG.w * 0.62 : TAG.h) };
        if (def.slack) {
          c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, 0.02), 0.85);
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(bottom.x, bottom.y);
          c.bezierCurveTo(bottom.x - 6, bottom.y + 22, bottom.x + 12, bottom.y + 26, bottom.x + 4, bottom.y + 38);
          c.stroke();
        } else if (def.strands && st.drop !== undefined) {
          def.strands.forEach((sd, i) => {
            const from = def.strands!.length > 1 ? { x: bottom.x + (i === 0 ? -8 : 8), y: bottom.y } : bottom;
            const isEng = st.id === '1' && sd.label === 'engineering';
            const isBio = st.id === '1' && sd.label === 'biology';
            const off = isBio ? 6 : isEng ? 23 : 14.5;
            const lane = laneFor(off);
            const ry = ruleY + 5 + lane * 2.6;
            const lx = lifeX(sd.days, rL4);
            const pts = strandPts(from, lx, ry);
            if (sd.tip === 'open') copperRun(c, env, pts, k4, isEng ? 1 + flare : 1);
            drawThread(c, env, from, lx, sd.tip, 1, { ruleY, lane, glow: 1.6 + (isEng ? 1.4 * flare : 0) });
            if (isEng) {
              const knot = { x, y: lineY(x) };
              engPath = [knot, { x: from.x, y: eyeY }, ...pts];
              engTip = { x: lx, y: ry };
            }
          });
        }
      }
      // the glint along the engineering strand, and its tip's flare on 'years'
      if (engPath) glint(c, env, engPath, gU, gA, k4);
      if (engTip && flare > 0.01) {
        const e = engTip as P;
        const r = 30 / k4;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.75 * flare));
        g.addColorStop(0.4, withAlpha(copperOf(env, 1), 0.35 * flare));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(e.x - r, e.y - r, 2 * r, 2 * r);
        c.restore();
      }
      // the tags
      for (const st of states) {
        const x0 = X[st.id]!;
        if (st.id === 'lineage') {
          const x = x0 + 150 * (1 - slide);
          const knot = { x, y: lineY(x) };
          const th = 0.42 * Math.exp(-3 * Math.max(0, tc - 0.3)) * Math.sin(Math.max(0, tc - 0.25) * 8.5) + 0.12 * (1 - slide);
          c.save();
          c.translate(knot.x, knot.y);
          c.rotate(th);
          c.translate(-knot.x, -knot.y);
          const cw = TAG.w * 0.62;
          tagHalo(c, env, x, knot.y + TAG.string + cw / 2, cw * 1.05, cw * 1.05, gCard * (st.alpha ?? 1));
          drawTag(c, env, { ...st, x, glow: 0.6 * gCard }, { knotAt: knot, at: { x, y: knot.y + TAG.string }, tq: env.tq });
          c.restore();
          continue;
        }
        const knot = { x: x0, y: lineY(x0) };
        const glow = st.id === '1' ? 0.6 * g1 : 0;
        if (st.id === '1') tagHalo(c, env, x0, knot.y + TAG.string + TAG.h / 2, TAG.w * 1.15, TAG.h * 0.85, g1);
        drawTag(c, env, { ...st, x: x0, glow }, { knotAt: knot, at: { x: x0, y: knot.y + TAG.string }, tq: env.tq });
        if (st.pencilRest) {
          const bottomY = knot.y + TAG.string + TAG.h;
          drawPencil(c, { x: x0 + TAG.w * 0.62, y: bottomY - 6 }, Math.PI * 0.5 + 0.28, 62, env);
        }
      }
      // on 'hand': the narrator's hands, glimpsed at lower left in front of the dark apron, bend one copper length
      const hu = handU(env.tq - sc.hand);
      if (hu > 0 && hu < 1) bendHands(c, env, cam, hu);
    });
    f.rim({ x: 0, y: -1 });

    // ---- L5: the near plane, blurred: the near bench edge with a vise (lower right, wide) and a plane (lower left, close)
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 60);
      const rr = { x: r.x, y: PLANK_TOP - 80, w: r.w, h: 900 - PLANK_TOP };
      bake(f, c, env, 'near-bench', rr, (cc) => nearBench(cc, env, rr));
    });

    // ---- type: screen-locked captions (two text items, one per beat)
    const c = f.c;
    const m = f.mood;
    // 1 · names the rule (under it, on the apron); it leaves as the names arrive, so each caption speaks alone
    const a1 = sm(win(t, sc.wide + 0.5, sc.wide + 1.0)) * (1 - sm(win(t, sc.others + 0.4, sc.others + 0.9)));
    if (a1 > 0.001) caption(c, m, 'cap-rule', 'the Lifespan Rule: each mark a far bigger jump than the last', 640, 598, a1, false);
    // 2 · the others, names and dates as printed on the card (top of frame, inside title-safe, on a soft plate)
    const a2 = sm(win(t, sc.others + 0.15, sc.others + 0.6)) * (1 - sm(win(t, sc.hand - 0.6, sc.hand)));
    if (a2 > 0.001) caption(c, m, 'cap-others', 'Siegelmann & Sontag 1992 · Tracr 2023 · Giannou et al. 2023 · Percepta 2026', 640, 84, a2, true);
  },
});

/** the hands' u (bend action) against time from 'hand': in by 9.3 s, bend across 'hand', hold, gone by 10.9 s */
const HAND_KEYS: [number, number][] = [[-0.6, 0], [-0.16, 0.3], [-0.06, 0.35], [0.5, 0.65], [0.8, 0.78], [1.44, 1]];
function handU(dt: number): number {
  if (dt <= HAND_KEYS[0][0]) return 0;
  for (let i = 1; i < HAND_KEYS.length; i++) {
    const [t0, u0] = HAND_KEYS[i - 1], [t1, u1] = HAND_KEYS[i];
    if (dt <= t1) return u0 + ((u1 - u0) * (dt - t0)) / (t1 - t0);
  }
  return 1;
}

/** the narrator's hands (from the lower LEFT) holding a single copper length: flat, then its free end turned up */
function bendHands(c: C, env: PaintEnv, cam: Camera3, hu: number) {
  const target = toLayer(LAYERS.L4, cam, 170, 650); // in front of the dark apron, under the rule and the tags
  const k4 = layerXform(LAYERS.L4, cam).k || 1;
  const scale = 0.58 / k4; // about 68 px of hand on screen whatever the dolly
  const pose = hands.act('bend', hu, target, { scale, entry: hands.entry(cam, 'L4') });
  const len = 118 * scale;
  const hold = hands.socket(pose, 'left');
  const free = hands.socket(pose, 'right');
  if (hold && free && (pose.presence ?? 1) > 0.02) {
    // one copper length: a flat run through the holding hand to the pivot, then out to the pinching hand (flat, then up)
    const P = { x: hold.x + len * 0.32, y: hold.y };
    const dx = free.x - P.x, dy = free.y - P.y;
    const d = Math.hypot(dx, dy) || 1;
    const tail = { x: hold.x - len * 0.42, y: hold.y };
    const tip = { x: P.x + (dx / d) * (d + len * 0.18), y: P.y + (dy / d) * (d + len * 0.18) };
    const path = () => {
      c.beginPath();
      c.moveTo(tail.x, tail.y);
      c.lineTo(P.x, P.y);
      c.lineTo(tip.x, tip.y);
    };
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.42);
    c.lineWidth = 14 / k4;
    path();
    c.stroke();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = copperOf(env, 0.9);
    c.lineWidth = 6 / k4;
    path();
    c.stroke();
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.25), 0.8);
    c.lineWidth = 1.6 / k4;
    c.translate(-1 / k4, -1.6 / k4);
    path();
    c.stroke();
    c.restore();
  }
  hands.draw(c, pose, env);
}

function caption(c: C, m: Palette, id: string, text: string, cx: number, y: number, a: number, plate: boolean) {
  textRole(c, 'subject', () => {
    const base = `italic 500 21px ${FONT.text}`;
    const size = legibleSize(c, base, 21);
    c.save();
    c.font = `italic 500 ${size}px ${FONT.text}`;
    const w = c.measureText(text).width;
    if (plate) softPlate(c, cx, y + size * 0.55, w + 110, size * 2.7, m.ink, 0.6 * a);
    c.fillStyle = withAlpha(textColor(m), 0.95 * a);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.shadowColor = withAlpha(m.ink, 0.7 * a);
    c.shadowBlur = 4;
    c.fillText(text, cx, y);
    c.restore();
    textProbe(c, id, cx - w / 2, y, w, size * 1.2, a);
  });
}
