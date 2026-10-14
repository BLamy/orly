/**
 * neural-net-history — the STRAIT seen through the study window (ch14-s05, ch14-s06, ch14-s07).
 *
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window: its stiles and rails sit at the frame
 * edges as a faint occluder (ink with candleAmber rim hairlines), never crossing the centre of the image. Two
 * skylines of equal height, equal mass and identical warmth face each other across dark water, left and right; a
 * long wooden jetty runs out from the near bank toward the middle, a Go board on its end landing under a lantern
 * hung on a post. Candles, a match and the narrator's hands appear only as a REFLECTION on one plane (L2, ~35 %
 * alpha, slight ripple), in the study's own candleAmber (STUDY LOCK).
 *
 *   straitBack(f, { key, fence?, lights? })      L0 sky + L1 far shores, far headlands, water, the far rule fence
 *   nearWater(c, env)                           L3 ripples (dynamic, cheap)
 *   jetty(c, env, { pages?, board?, lantern? }) L4 the jetty, its rail, the landing, the Go board, the lantern post
 *   windowFrame(f, { back? })                   the study window frame, screen-locked at the edges (back = pull into the study)
 *   boardStones, handset, handsetCords          the Go board's record and the dialogue handset (ch14-s06, ch14-s07)
 *   reflection(f, { x, y, w, h, draw, alpha })  an offscreen sub-render (candleAmber) composited on L2 with ripple
 *   paperTag(c, o, env)                          a small paper estimate/dissent tag hung on a thread
 *   floatLantern(c, o, env)                      a small open paper lantern drifting on the water
 *
 * Coordinates are rest-screen stage px (multiplane: at CAMERA3_HOME a point drawn at (x, y) lands there).
 * Right shore = the shore of the 2017 plan, DeepSeek and the open lanterns; left shore = Washington's. Both are
 * generic paper-cut cities: no landmarks, flags, emblems or logos; their lit windows share ONE warm colour.
 */
import type { Camera3, Frame, LayerSpec, MoodId, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { MOODS, makeEnv, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, softPlate, textRole } from '../../../film/silhouette/type';
import { skyline } from '../../../film/silhouette/architecture';
import { goBoard } from '../../../film/silhouette/props';
import { hash1 } from '../../../film/core/frame';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { makeCanvas, softSprite } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
export type P = { x: number; y: number };

export const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const lerpP = (a: P, b: P, u: number): P => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
export const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

/** the horizon (the far shores' waterline), L1 rest-screen y */
export const HZ = 404;
/** the one warm colour of every lit window on both shores (identical warmth, whatever the mood) */
export const WARM = mixLab(MOODS.candleAmber.halo, MOODS.candleAmber.core, 0.45);

/** the two shores (L1): equal width, equal height, mirror-placed about the frame centre */
export const SHORE = {
  L: { x0: 70, x1: 498, cx: 284 },
  R: { x0: 782, x1: 1210, cx: 996 },
  height: 118,
  /** the small far headlands at the frame's edges */
  farL: { x0: -300, x1: 40, cx: 10 },
  farR: { x0: 1240, x1: 1580, cx: 1270 },
} as const;

/** the far fence of rule pages across the open water between the shores (L1) */
export const FENCE = { x0: 548, x1: 732, h: 44 };

// ===================================================================================== L0 + L1: sky, shores, water
function cityRow(c: C, env: PaintEnv, x0: number, x1: number, seed: number, flip: boolean) {
  // a low hill line under the city, then the city (generic megacity silhouettes, same height on both shores)
  const m = env.mood;
  // far cities sit a clear step below the horizon glow (≈ L* 30), not lost in the haze
  const set = mixLab(m.set, m.haze, 0.32);
  c.save();
  if (flip) {
    // the right shore is the left shore's generator with its own seed, mirrored about its own centre so the two
    // masses balance (taller towers toward the open water on both sides)
    const cx = (x0 + x1) / 2;
    c.translate(cx, 0);
    c.scale(-1, 1);
    c.translate(-cx, 0);
  }
  c.fillStyle = set;
  c.beginPath();
  c.moveTo(x0 - 30, HZ + 6);
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const x = lerp(x0 - 30, x1 + 10, u);
    const hgt = 10 + 16 * Math.sin(u * Math.PI * 0.95) + 4 * Math.sin(u * 17 + seed);
    c.lineTo(x, HZ - hgt);
  }
  c.lineTo(x1 + 30, HZ + 6);
  c.closePath();
  c.fill();
  const henv: PaintEnv = { ...env, mood: { ...m, halo: WARM }, layer: { ...env.layer, haze: 0 }, fill: () => set };
  skyline(c, { style: 'megacity', x0, x1, y: HZ - 12, height: SHORE.height, seed, lit: 0.3, ground: 14 }, henv);
  // a low bridge span reaching out over the water from the inner end (both shores have one)
  const bx = x1 - 4;
  c.fillStyle = set;
  c.fillRect(bx, HZ - 15, 44, 2.2);
  for (let k = 0; k < 4; k++) c.fillRect(bx + 4 + k * 12, HZ - 15, 1.6, 15);
  c.restore();
}

function farHeadland(c: C, env: PaintEnv, x0: number, x1: number, seed: number) {
  c.fillStyle = mixLab(env.mood.set, env.mood.haze, 0.55);
  c.beginPath();
  c.moveTo(x0, HZ + 4);
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const hgt = 6 + 20 * Math.pow(Math.sin(u * Math.PI), 1.4) + 3 * Math.sin(u * 13 + seed);
    c.lineTo(lerp(x0, x1, u), HZ - hgt);
  }
  c.lineTo(x1, HZ + 4);
  c.closePath();
  c.fill();
  // a handful of small warm windows
  for (let i = 0; i < 7; i++) {
    const x = lerp(x0 + 20, x1 - 20, (i + 0.5) / 7 + 0.04 * hash1(i, seed));
    const y = HZ - 6 - 10 * Math.abs(hash1(i, seed + 3));
    c.fillStyle = withAlpha(WARM, 0.75);
    c.fillRect(x - 1, y - 1.2, 2, 2.4);
  }
}

function waterBody(c: C, env: PaintEnv, x0: number, x1: number) {
  const m = env.mood;
  const g = c.createLinearGradient(0, HZ, 0, HZ + 700);
  g.addColorStop(0, mixLab(m.sky[3], m.haze, 0.35));
  g.addColorStop(0.025, mixLab(m.sky[2], m.set, 0.35));
  g.addColorStop(0.12, mixLab(m.sky[1], m.set, 0.55));
  g.addColorStop(0.3, mixLab(m.set, m.fg, 0.35));
  g.addColorStop(0.6, mixLab(m.fg, m.ink, 0.4));
  g.addColorStop(1, m.fg);
  c.fillStyle = g;
  c.fillRect(x0, HZ, x1 - x0, 760);
  // the shore windows' streaks on the water (static; the live shimmer rides on top)
  for (const sh of [SHORE.L, SHORE.R]) {
    for (let i = 0; i < 26; i++) {
      const x = lerp(sh.x0 + 10, sh.x1 - 10, (i + 0.5 + 0.4 * hash1(i, 71)) / 26);
      const len = 14 + 26 * Math.abs(hash1(i, sh.cx));
      c.fillStyle = withAlpha(WARM, 0.1 + 0.08 * Math.abs(hash1(i, 5)));
      for (let k = 0; k < 6; k++) c.fillRect(x - 0.8 + 1.2 * hash1(i * 7 + k, 9), HZ + 3 + k * (len / 6), 1.6, len / 10);
    }
  }
  // long, faint horizontal swell lines, spaced wider toward the viewer
  c.fillStyle = withAlpha(m.haze, 0.1);
  for (let i = 0; i < 18; i++) c.fillRect(x0, HZ + 6 + i * i * 2.2, x1 - x0, 0.8);
}

/** the paper fence of rule pages standing across the open water, far off in the haze (from ch14-s02): backlit by
 *  the horizon, so the pages read as a row of darker sheets with light ruled lines and lit top edges */
function farFence(c: C, env: PaintEnv, a: number, hi = 0) {
  if (a <= 0.01) return;
  const m = env.mood;
  // review r1: a row of evenly ruled slabs read as server racks. Now: two stakes in the water carry a sagging tie
  // line; nine loose paper sheets hang from it on two pins each, gapped, leaning a little each their own way, short
  // typed lines (not full-width rules), a turned-up corner. hi (0..1): the cool rim caught once on 'chip'
  const paper = mixLab(mixLab(m.setHaze, m.haze, 0.45), m.ink, 0.25 * hi);
  const lines = mixLab(m.ink, m.set, 0.4);
  const ink = mixLab(m.set, m.ink, 0.4);
  const n = 9;
  const span = FENCE.x1 - FENCE.x0;
  const pitch = span / n;
  const w = pitch - 5;
  const topY = HZ - FENCE.h - 4;
  const sag = 5;
  const lineY = (x: number) => topY + sag * (1 - Math.pow((2 * (x - FENCE.x0)) / span - 1, 2));
  c.save();
  c.globalAlpha *= Math.min(1, a);
  // the stakes and the tie line
  c.fillStyle = ink;
  for (const x of [FENCE.x0 - 6, FENCE.x1 + 4]) c.fillRect(x, topY - 5, 2.2, HZ + 6 - (topY - 5));
  c.strokeStyle = withAlpha(mixLab(ink, m.rim, 0.25 + 0.5 * hi), 0.95);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(FENCE.x0 - 5, topY - 4);
  for (let k = 0; k <= 16; k++) {
    const x = FENCE.x0 + (span * k) / 16;
    c.lineTo(x, lineY(x));
  }
  c.lineTo(FENCE.x1 + 5, topY - 4);
  c.stroke();
  for (let i = 0; i < n; i++) {
    const x = FENCE.x0 + (i + 0.5) * pitch;
    const h = FENCE.h * (0.74 + 0.16 * Math.abs(hash1(i, 33)));
    const lean = (i % 2 ? 1 : -1) * 0.05 + 0.04 * hash1(i, 34);
    const y0 = lineY(x);
    c.save();
    c.translate(x, y0);
    c.rotate(lean);
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.lineTo(w / 2, 0);
    c.lineTo(w / 2, h - 4);
    c.lineTo(w / 2 - 4, h);
    c.lineTo(-w / 2, h);
    c.closePath();
    c.fill();
    // the turned-up corner
    c.fillStyle = mixLab(paper, m.rim, 0.35);
    c.beginPath();
    c.moveTo(w / 2, h - 4);
    c.lineTo(w / 2 - 4, h - 4);
    c.lineTo(w / 2 - 4, h);
    c.closePath();
    c.fill();
    // a short heading and typed lines of varying length
    c.fillStyle = withAlpha(lines, 0.7);
    c.fillRect(-w / 2 + 2.5, 5, w * 0.55, 1.3);
    for (let k = 0; k < 5; k++) {
      const len = (w - 5) * (0.55 + 0.4 * Math.abs(hash1(i * 7 + k, 35)));
      c.fillRect(-w / 2 + 2.5, 9.5 + k * ((h - 14) / 5), len, 0.7);
    }
    // two pins at the top
    c.fillStyle = mixLab(m.ink, m.rim, 0.25 + 0.4 * hi);
    for (const px of [-w / 2 + 2.6, w / 2 - 2.6]) {
      c.beginPath();
      c.arc(px, 1.2, 1.25, 0, Math.PI * 2);
      c.fill();
    }
    // top edge catches the horizon; on 'chip' a cool rim down the lit side
    c.fillStyle = withAlpha(m.rim, 0.45 + 0.5 * hi);
    c.fillRect(-w / 2, -0.4, w, 0.9 + 0.7 * hi);
    if (hi > 0.01) {
      c.fillStyle = withAlpha(m.rim, 0.7 * hi);
      c.fillRect(w / 2 - 1, 0, 1, h - 4);
    }
    c.restore();
    // its reflection, broken by the swell
    c.fillStyle = withAlpha(paper, 0.22);
    for (let k = 0; k < 4; k++) c.fillRect(x - w / 2 + 1 + hash1(i * 5 + k, 36) * 1.5, HZ + 4 + k * 3.2, w - 2, 1.6);
  }
  c.restore();
}

export interface BackOpts {
  key: string;
  /** far rule-fence visibility 0..1 (0 = hidden) */
  fence?: number;
  /** the far fence's rim highlight 0..1 (ch14-s06 'chip') */
  fenceHi?: number;
  /** sun position / intensity for the backlight */
  sunX?: number;
  sun?: number;
}

/** L0 sky and the whole far plane (shores, headlands, water), baked once per mood; then the live shimmer */
export function straitBack(f: Frame, o: BackOpts) {
  f.backlight({ sunX: o.sunX ?? 640, sunY: HZ - 30, intensity: o.sun ?? 0.8, sunRadius: 420 });
  f.layer('L1', (c, env) => {
    const X0 = -360, X1 = 1640, Y0 = 150, Y1 = 1180;
    f.cached(`ch14-strait/${o.key}/${env.mood.id}`, X1 - X0, Y1 - Y0, (cc) => {
      cc.translate(-X0, -Y0);
      farHeadland(cc, env, SHORE.farL.x0, SHORE.farL.x1, 3);
      farHeadland(cc, env, SHORE.farR.x0, SHORE.farR.x1, 3);
      waterBody(cc, env, X0, X1);
      cityRow(cc, env, SHORE.L.x0, SHORE.L.x1, 41, false);
      cityRow(cc, env, SHORE.R.x0, SHORE.R.x1, 41, true);
    })(c, X0, Y0);
    // live shimmer: a few bright ripples under each shore's windows, the SAME rhythm on both shores
    const t = env.t;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const sh of [SHORE.L, SHORE.R]) {
      for (let i = 0; i < 9; i++) {
        const x = lerp(sh.x0 + 30, sh.x1 - 30, (i + 0.5) / 9);
        const ph = Math.sin(t * 1.3 + i * 1.9);
        const y = HZ + 6 + ((i * 7) % 5) * 4;
        c.fillStyle = withAlpha(WARM, 0.08 + 0.07 * ph);
        c.fillRect(x - 5 + 3 * Math.sin(t * 0.7 + i), y, 10, 1);
      }
    }
    c.restore();
  });
  // the far fence on the far plane but a touch crisper than the shores (it is a subject on 'chip')
  if ((o.fence ?? 0) > 0.01) f.layer(FENCE_LAYER, (c, env) => farFence(c, env, o.fence ?? 0, o.fenceHi ?? 0));
}
const FENCE_LAYER: LayerSpec = { ...LAYERS.L1, blur: 1.1 };

/** near ripples on the water (L3): thin rim-lit dashes drifting slowly, denser toward the viewer */
export function nearWater(c: C, env: PaintEnv, x0 = -300, x1 = 1600, y0 = 470, y1 = 1000) {
  const m = env.mood;
  const t = env.t;
  c.save();
  c.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const v = Math.abs(hash1(i, 501));
    const y = lerp(y0, y1, v * v);
    const span = x1 - x0;
    const x = x0 + ((Math.abs(hash1(i, 502)) * span + t * (4 + 6 * v)) % span);
    const len = 10 + 40 * v;
    const a = 0.06 + 0.1 * v * (0.6 + 0.4 * Math.sin(t * 0.9 + i));
    c.strokeStyle = withAlpha(m.rim, a);
    c.lineWidth = 0.8 + 0.8 * v;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + len, y + 0.6 * Math.sin(i));
    c.stroke();
  }
  c.restore();
}

// ===================================================================================== the jetty (L4)
/** jetty geometry (L4 world): a plank walkway from the near bank (bottom-left) out to a square landing near the
 *  centre of the frame; a rail along its right edge (the side facing the camera's right) */
export const JETTY = {
  /** walkway left / right edges, near → far. Review r1 (ch14-s06): a lower eye line, so the walkway runs in at a
   *  gentler angle (≈ 27°) instead of a hard corner-to-corner diagonal */
  L0: { x: -400, y: 846 },
  L1: { x: 586, y: 486 },
  R0: { x: -130, y: 884 },
  R1: { x: 640, y: 494 },
  /** the landing: a wider platform at the end */
  land: { x0: 556, x1: 760, yb: 498, yf: 470, thick: 9 },
  /** the Go board on the landing */
  board: { x: 652, y: 490, s: 1.4 },
  /** the lantern post at the landing's right corner */
  post: { x: 752, y: 500, top: 372 },
};
/** a point on the rail's top bar at u (0 = near end, 1 = the landing) */
export function railTop(u: number): P {
  const e = lerpP(JETTY.R0, JETTY.R1, u);
  const h = lerp(84, 30, u);
  return { x: e.x, y: e.y - h };
}
/** the lantern's light point (hung from the post's arm) */
export const LANTERN = { x: JETTY.post.x + 22, y: JETTY.post.top + 26 };
/** a small lamp on its own post on the rail, in the gap between the BLETCHLEY and LIMA pages (review r1, ch14-s06:
 *  the pages are lit by a practical at a post head, so they carry a warm edge before they lift) */
export const RAIL_LAMP_U = 0.52;
export function railLampPoint(): P {
  const b = railTop(RAIL_LAMP_U);
  return { x: b.x, y: b.y - 112 };
}

export interface PageState {
  text: string;
  year: string;
  /** rail position */
  u: number;
  /** 0 = hanging flat against the rail, 1 = lifted into the light */
  lift: number;
  /** 'subject' (default: ch14-s06 reads them) or 'texture' (set dressing once read, ch14-s07) */
  role?: 'subject' | 'texture';
  /** the post lantern's warm light on the page's lantern-facing (top, right) edges 0..1 (default 1) */
  warm?: number;
  /** ink seals pressed on the page (ch14-s06 'both'): side -1 = from the left shore, 1 = from the right; u 0..1 press */
  seals?: { side: -1 | 1; u: number }[];
  /** whole-page alpha (a page leaving the frame fades to texture: pageEdgeAlpha) */
  alpha?: number;
  /** where its warm light comes from (L4); default: the landing's lantern, up to the right */
  warmFrom?: P;
}
/** a page's screen rect for a camera (stage px), for clean-edge fades */
export function pageScreenRect(u: number, cam: Camera3): { x0: number; y0: number; x1: number; y1: number } {
  const at = railTop(u);
  const s = lerp(1.04, 0.9, u);
  const a = toScreen(LAYERS.L4, cam, at.x - (PAGE.w / 2) * s, at.y);
  const b = toScreen(LAYERS.L4, cam, at.x + (PAGE.w / 2) * s, at.y + (PAGE.h + 26) * s);
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
}
/** CLEAN EDGES (review r1): a page that starts to leave the frame (or the title-safe bottom band) fades to texture,
 *  ≤ 0.3 alpha once a third of it is outside; whole in frame it is untouched */
export function pageEdgeAlpha(u: number, cam: Camera3, margin = 6): number {
  const r = pageScreenRect(u, cam);
  const w = r.x1 - r.x0, h = r.y1 - r.y0;
  const out = Math.max((margin - r.x0) / w, (r.x1 - (1280 - margin)) / w, (r.y1 - (720 - margin)) / h, 0);
  // and gone once it is mostly out (no pale slab left at the edge)
  return (1 - 0.75 * sm(out / 0.33)) * (1 - sm((out - 0.33) / 0.35));
}
export interface JettyOpts {
  pages?: PageState[];
  /** stones on the Go board: 19 strings of '.', 'b', 'w' (row 0 = far rank) */
  stones?: string[];
  /** the lantern's light 0..1 (the shot adds f.practical at LANTERN) */
  lantern?: number;
  /** extra paint on the landing after the board (handset, cords) */
  onBoard?: (c: C, env: PaintEnv) => void;
  /** the rail lamp's glass 0..1 (omitted = no rail lamp; the shot adds f.practical at railLampPoint()) */
  railLamp?: number;
}

// sized so the place name reaches the 22 px cap floor when the camera holds on a lifted page (review round 2:
// BLETCHLEY read at 20 px, WASHINGTON at 16 px on the old 72 px pages)
const PAGE = { w: 104, h: 128 };

function page(c: C, env: PaintEnv, p: PageState) {
  const m = env.mood;
  const at = railTop(p.u);
  const s = lerp(1.04, 0.9, p.u);
  const lift = sm(p.lift);
  const w = PAGE.w, h = PAGE.h;
  const pinL = -w / 2 + 9;
  const pa = p.alpha ?? 1;
  if (pa <= 0.01) return;
  c.save();
  c.globalAlpha *= pa;
  c.translate(at.x, at.y + 2);
  c.scale(s, s);
  // in shadow: the page hangs askew from its left pin (its right pin popped), turned down ~12°, away from the
  // lantern; lifted: it swings up level on both pins, rises a little and turns into the light
  const rot = lerp(0.21, 0, lift);
  c.translate(0, -lift * 8);
  c.translate(pinL, 6);
  c.rotate(rot);
  c.translate(-pinL, -6);
  const paperDark = mixLab(m.set, m.setHaze, 0.45);
  const paperLit = mixLab(MOODS.parchment.sky[2], m.rim, 0.25);
  const paper = mixLab(paperDark, paperLit, lift);
  // a soft shadow on the rail when lifted
  c.fillStyle = withAlpha(m.fg, 0.35 * (1 - lift * 0.5));
  c.fillRect(-w / 2 + 3, 4, w, h);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(w / 2, 0);
  c.lineTo(w / 2 - 1, h - 3);
  c.quadraticCurveTo(w / 4, h + 1, 0, h - 1);
  c.quadraticCurveTo(-w / 4, h - 3, -w / 2 + 1, h);
  c.closePath();
  c.fill();
  // the post lantern's warm light (review r1): even in shadow the page's lantern-facing corner is warmed and its top
  // and right edges carry a warm hairline, so the pages read as paper in lamplight, not grey slabs
  // the side facing the light (+1 right, -1 left); a nearer light warms the page more
  const lf = p.warmFrom ?? LANTERN;
  const side = lf.x >= at.x ? 1 : -1;
  const near = clamp01(1 - (Math.abs(lf.x - at.x) - 60) / 360);
  const warm = (p.warm ?? 1) * (1 - 0.45 * lift) * (0.55 + 0.45 * near);
  if (warm > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient((side * w) / 2, 0, (-side * w) / 2, h);
    g.addColorStop(0, withAlpha(WARM, 0.36 * warm));
    g.addColorStop(0.55, withAlpha(WARM, 0.05 * warm));
    g.addColorStop(1, withAlpha(WARM, 0));
    c.fillStyle = g;
    c.fillRect(-w / 2, 0, w, h);
    c.restore();
    c.strokeStyle = withAlpha(mixLab(WARM, '#fff4dc', 0.3), 0.8 * warm);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-side * (w / 2 - 6), 0.6);
    c.lineTo(side * (w / 2 - 0.6), 0.6);
    c.lineTo(side * (w / 2 - 1.2), h - 4);
    c.stroke();
  }
  // edge rim toward the lantern (upper right): faint in shadow, bright once lifted
  c.strokeStyle = withAlpha(m.rim, 0.12 + 0.6 * lift);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-w / 2, 0.5);
  c.lineTo(w / 2, 0.5);
  c.lineTo(w / 2 - 1, h - 3);
  c.stroke();
  // the two ink seals (one from each shore's side), pressed under the year
  for (const sl of p.seals ?? []) {
    if (sl.u <= 0.001) continue;
    const k = sm(sl.u / 0.6);
    const press = 1 + 0.5 * (1 - sm(sl.u));
    const sx = sl.side * w * 0.24 + sl.side * 14 * (1 - k);
    const sy = h - 20;
    c.save();
    c.translate(sx, sy);
    c.rotate(sl.side * 0.12);
    c.scale(press, press);
    c.globalAlpha *= k;
    const sealInk = mixLab(m.ink, m.fg, 0.2);
    c.fillStyle = sealInk;
    c.beginPath();
    c.arc(0, 0, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(paper, 0.6);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 0, 7, 0, Math.PI * 2);
    c.stroke();
    // a plain cut mark in the seal (no emblem): a short bar and three ticks
    c.fillStyle = withAlpha(paper, 0.55);
    c.fillRect(-3.6, -0.7, 7.2, 1.4);
    for (let j = -1; j <= 1; j++) c.fillRect(j * 2.6 - 0.5, 2, 1, 2.4);
    // the fresh impression catches the lamp
    c.strokeStyle = withAlpha(WARM, 0.5 * (1 - 0.6 * sm(sl.u)));
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, 10.5, -Math.PI * 0.6, Math.PI * 0.05);
    c.stroke();
    c.restore();
  }
  // pins (the right one only holds once lifted)
  c.fillStyle = mixLab(m.ink, m.rim, 0.4);
  c.beginPath();
  c.arc(pinL, 6, 2.2, 0, Math.PI * 2);
  c.fill();
  if (lift > 0.01) {
    c.save();
    c.globalAlpha *= lift;
    c.beginPath();
    c.arc(w / 2 - 9, 6, 2.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // lettering: place and year only (IBM Plex Mono, the era's face); ~40% contrast in shadow, full once lifted
  const ink = mixLab(m.ink, paper, 0.08);
  c.fillStyle = mixLab(paper, ink, lerp(0.4, 1, lift));
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // the place name as large as the page allows (IBM Plex Mono advance 0.6 em), the year under a rule
  const fs = Math.min(17, (w - 10) / (p.text.length * 0.6));
  textRole(c, p.role ?? 'subject', () => {
    c.font = `600 ${fs.toFixed(1)}px ${FONT.mono}`;
    c.fillText(p.text, 0, h * 0.38);
    c.fillRect(-w * 0.3, h * 0.38 + 8, w * 0.6, 0.8);
    c.font = `500 28px ${FONT.mono}`;
    c.fillText(p.year, 0, h * 0.38 + 42);
  });
  c.restore();
}

/** the jetty with its rail, landing, Go board and lantern post (draw in L4) */
export function jetty(c: C, env: PaintEnv, o: JettyOpts = {}) {
  const m = env.mood;
  const ink = env.fill('ink');
  // value: the jetty, rail and board are the darkest shapes in the frame (ink), lit only on their tops (f.rim and
  // the hairlines below); only the far shores carry the haze
  const deck = mixLab(ink, m.set, 0.32);
  const J = JETTY;
  // piles under the walkway and landing, down into the water
  c.fillStyle = ink;
  for (let i = 0; i <= 9; i++) {
    const u = i / 9;
    const r = lerpP(J.R0, J.R1, u);
    const wpx = lerp(10, 4, u);
    c.fillRect(r.x - wpx, r.y - 4, wpx, lerp(60, 22, u));
    const l = lerpP(J.L0, J.L1, u);
    c.fillRect(l.x - wpx * 0.5, l.y - 2, wpx * 0.8, lerp(40, 14, u));
  }
  for (const x of [J.land.x0 + 6, J.land.x1 - 8, (J.land.x0 + J.land.x1) / 2]) c.fillRect(x, J.land.yb - 2, 4, 26);
  // walkway deck: a quad, with the side face (thickness) on the right
  c.fillStyle = deck;
  c.beginPath();
  c.moveTo(J.L0.x, J.L0.y);
  c.lineTo(J.L1.x, J.L1.y);
  c.lineTo(J.R1.x, J.R1.y);
  c.lineTo(J.R0.x, J.R0.y);
  c.closePath();
  c.fill();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(J.R0.x, J.R0.y);
  c.lineTo(J.R1.x, J.R1.y);
  c.lineTo(J.R1.x, J.R1.y + 6);
  c.lineTo(J.R0.x, J.R0.y + 16);
  c.closePath();
  c.fill();
  // plank seams across the walkway (cut-lines, faint)
  c.strokeStyle = withAlpha(m.rim, 0.1);
  c.lineWidth = 0.9;
  c.beginPath();
  for (let i = 1; i < 40; i++) {
    const u = 1 - Math.pow(1 - i / 40, 1.6);
    const a = lerpP(J.L0, J.L1, u), b = lerpP(J.R0, J.R1, u);
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();
  // the walkway's far (left) edge catches the lantern: a thin top rim
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(J.L0.x, J.L0.y - 0.5);
  c.lineTo(J.L1.x, J.L1.y - 0.5);
  c.stroke();
  // the landing
  const L = J.land;
  c.fillStyle = deck;
  c.beginPath();
  c.moveTo(L.x0 + 14, L.yf);
  c.lineTo(L.x1 - 10, L.yf);
  c.lineTo(L.x1, L.yb);
  c.lineTo(L.x0, L.yb);
  c.closePath();
  c.fill();
  c.fillStyle = ink;
  c.fillRect(L.x0, L.yb, L.x1 - L.x0, L.thick);
  c.fillStyle = withAlpha(m.rim, 0.42);
  c.fillRect(L.x0 + 14, L.yf - 0.6, L.x1 - L.x0 - 24, 1.1);
  // the Go board on its low stand, and its stones
  // the board's top lit by the lantern (a lighter wood than the deck, so the stones read on it)
  // the board: an ink body; its top a dark lantern-warmed wood, just light enough for the stones to read
  const benv: PaintEnv = { ...env, mood: { ...m, set: mixLab(ink, WARM, 0.2), haze: mixLab(m.setHaze, WARM, 0.3) } };
  goBoard(c, { x: J.board.x, y: J.board.y, s: J.board.s, stones: o.stones ?? [], bowls: true }, benv);
  o.onBoard?.(c, env);
  // the rail along the walkway's right edge: posts and a top bar, rim on the top
  c.fillStyle = ink;
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const b = lerpP(J.R0, J.R1, u);
    const top = railTop(u);
    const w = lerp(7, 3, u);
    c.fillRect(b.x - w / 2, top.y, w, b.y - top.y + 2);
  }
  const bar = (dy: number, w0: number, w1: number) => {
    const a0 = railTop(0), a1 = railTop(1);
    c.beginPath();
    c.moveTo(a0.x, a0.y + dy * 1);
    c.lineTo(a1.x, a1.y + dy * 0.4);
    c.lineTo(a1.x, a1.y + dy * 0.4 + w1);
    c.lineTo(a0.x, a0.y + dy + w0);
    c.closePath();
    c.fill();
  };
  bar(0, 7, 3);
  bar(40, 4, 2);
  c.fillStyle = withAlpha(m.rim, 0.5);
  const a0 = railTop(0), a1 = railTop(1);
  c.beginPath();
  c.moveTo(a0.x, a0.y - 0.6);
  c.lineTo(a1.x, a1.y - 0.4);
  c.lineTo(a1.x, a1.y + 0.6);
  c.lineTo(a0.x, a0.y + 0.8);
  c.closePath();
  c.fill();
  // the rail lamp: a slim post up from the rail between the first two pages, a small lamp at its head
  if (o.railLamp !== undefined) {
    const b0 = railTop(RAIL_LAMP_U);
    const lp = railLampPoint();
    c.fillStyle = ink;
    c.fillRect(b0.x - 2, lp.y + 10, 4, b0.y - lp.y - 8);
    c.fillRect(b0.x - 4, b0.y - 3, 8, 4);
    c.beginPath();
    c.moveTo(lp.x - 6, lp.y - 9);
    c.lineTo(lp.x + 6, lp.y - 9);
    c.lineTo(lp.x, lp.y - 15);
    c.closePath();
    c.fill();
    c.fillRect(lp.x - 6, lp.y - 9, 12, 2);
    c.fillRect(lp.x - 6, lp.y + 8, 12, 2.6);
    c.fillStyle = mixLab(m.halo, WARM, 0.55);
    c.globalAlpha = 0.35 + 0.65 * o.railLamp;
    c.fillRect(lp.x - 5, lp.y - 7, 10, 15);
    c.globalAlpha = 1;
    c.fillStyle = ink;
    c.fillRect(lp.x - 0.7, lp.y - 7, 1.4, 15);
    c.fillStyle = withAlpha(m.rim, 0.45);
    c.fillRect(b0.x - 2, lp.y + 10, 0.9, b0.y - lp.y - 8);
    // its warm light (the cool practical sits on top): a soft warm pool around the head
    c.save();
    c.globalCompositeOperation = 'lighter';
    const spr = softSprite(WARM, 0.25);
    c.globalAlpha = 0.5 * o.railLamp;
    c.drawImage(spr, lp.x - 46, lp.y - 46, 92, 92);
    c.globalAlpha = 0.22 * o.railLamp;
    c.drawImage(spr, lp.x - 130, lp.y - 70, 260, 200);
    c.restore();
  }
  // pages pinned to the rail
  // far page first: each nearer page overlaps the one beyond it (never its lettering)
  const lampAt = o.railLamp !== undefined ? railLampPoint() : undefined;
  for (const p of [...(o.pages ?? [])].sort((a, b) => b.u - a.u)) page(c, env, { warmFrom: lampAt, ...p });
  // the lantern post and its arm, the lantern itself (its light is the shot's practical)
  const P = J.post;
  c.fillStyle = ink;
  c.fillRect(P.x - 3, P.top, 6, P.y - P.top + 4);
  c.fillRect(P.x - 3, P.top, 30, 3.2);
  c.fillRect(P.x + 21, P.top + 3, 1.2, 9);
  // lantern: a small tin frame with glass panes (holes lit by its own core)
  const lx = LANTERN.x, ly = LANTERN.y;
  const k = o.lantern ?? 1;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(lx - 7, ly - 10);
  c.lineTo(lx + 7, ly - 10);
  c.lineTo(lx, ly - 17);
  c.closePath();
  c.fill();
  c.fillRect(lx - 7, ly - 10, 14, 2.2);
  c.fillRect(lx - 7, ly + 9, 14, 3);
  c.fillStyle = mixLab(m.halo, m.core, 0.4 * k);
  c.globalAlpha = 0.35 + 0.65 * k;
  c.fillRect(lx - 6, ly - 8, 12, 17);
  c.globalAlpha = 1;
  c.fillStyle = ink;
  c.fillRect(lx - 0.8, ly - 8, 1.6, 17);
}

// ===================================================================================== the study window frame
/**
 * The study window's frame, SCREEN-LOCKED (the WINDOW RULE keeps it at the frame edges whatever the camera does
 * outside): stiles and rails just inside the frame edges, ink with candleAmber rim hairlines on their inner edges.
 * `back` 0..1 is the pull back INTO the study (ch14-s07's end): the opening shrinks toward the centre, the study
 * wall, a second sash and the deep sill come into view, and the lamp's candleAmber warms the wall (STUDY LOCK).
 */
export function windowFrame(f: Frame, o: { back?: number; jambs?: number; dy?: number } = {}) {
  const c = f.c;
  const back = sm(o.back ?? 0);
  const am = MOODS.candleAmber;
  const k = lerp(1, 0.74, back);
  const cx = 640, cy = lerp(360, 340, back);
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.translate(cx, cy);
  c.scale(k, k);
  c.translate(-cx, -cy);
  // the window is the nearest plane: in a tilt it slides furthest (dy, stage px)
  c.translate(0, o.dy ?? 0);
  const ink = mixLab(am.fg, am.ink, 0.4);
  // the opening: narrow stiles at the sides and head, and a deep SILL along the bottom (a study window, not a
  // letterbox): its top lit by the lamp with a candleAmber rim hairline
  const X0 = 20, X1 = 1260, Y0 = 14, Y1 = 682;
  c.filter = `blur(${(1.6 * f.pxScale * (1 - 0.5 * back)).toFixed(2)}px)`;
  // the wall around the opening (a hole cut in it: evenodd)
  c.fillStyle = ink;
  c.beginPath();
  c.rect(-1400, -1000, 4080, 2720);
  c.rect(X0, Y0, X1 - X0, Y1 - Y0);
  c.fill('evenodd');
  // a glazing bar down the middle would cross the image's centre: the sash bars sit outside the opening only
  // (a second sash each side, seen once the camera pulls back)
  for (const x of [-300, -150, X1 + 136, X1 + 286]) c.fillRect(x, Y0 - 40, 14, Y1 - Y0 + 80);
  // the sash's own JAMBS just inside the opening (review r1, the window ch14-s07 pulls back to): ~40 px of faint
  // ink at each side, a meeting-rail catch on each, candleAmber hairlines on their inner edges
  const jk = o.jambs ?? 1;
  const JW = 40, CATCH = Y0 + (Y1 - Y0) * 0.46;
  if (jk > 0.01) {
    c.fillStyle = withAlpha(ink, 0.8 * jk);
    c.fillRect(X0, Y0, JW, Y1 - Y0);
    c.fillRect(X1 - JW, Y0, JW, Y1 - Y0);
    c.fillStyle = withAlpha(ink, 0.95 * jk);
    for (const [x0, dir] of [[X0 + JW, 1], [X1 - JW, -1]] as const) {
      c.fillRect(dir > 0 ? x0 : x0 - 16, CATCH - 5, 16, 10);
      c.fillRect(dir > 0 ? x0 - JW : x0, CATCH - 7, JW, 14);
    }
  }
  c.filter = 'none';
  c.fillStyle = withAlpha(am.rim, 0.36 + 0.2 * back);
  c.fillRect(X0 - 1.4, Y0 + 4, 1.4, Y1 - Y0 - 8);
  c.fillRect(X1, Y0 + 4, 1.4, Y1 - Y0 - 8);
  if (jk > 0.01) {
    c.fillStyle = withAlpha(am.rim, 0.3 * jk);
    c.fillRect(X0 + JW, Y0 + 2, 1, Y1 - Y0 - 4);
    c.fillRect(X1 - JW - 1, Y0 + 2, 1, Y1 - Y0 - 4);
    c.fillStyle = withAlpha(am.rim, 0.42 * jk);
    c.fillRect(X0, CATCH - 7.5, JW + 16, 1);
    c.fillRect(X1 - JW - 16, CATCH - 7.5, JW + 16, 1);
  }
  c.fillStyle = withAlpha(am.rim, 0.22 + 0.2 * back);
  c.fillRect(X0 + 4, Y0 - 1.2, X1 - X0 - 8, 1.2);
  // the sill: its top face (a narrow lamp-warmed band), a candleAmber hairline on its front edge, then the shadowed
  // front face; it widens and deepens as the camera pulls back into the study
  {
    const sx0 = X0 - 26 - 140 * back, sx1 = X1 + 26 + 140 * back;
    const top = Y1, face = Y1 + 10 + 4 * back;
    const g = c.createLinearGradient(sx0, 0, sx1, 0);
    g.addColorStop(0, mixLab(ink, am.set, 0.25));
    g.addColorStop(0.7, mixLab(ink, am.set, 0.5));
    g.addColorStop(1, mixLab(ink, am.halo, 0.35));
    c.fillStyle = g;
    c.fillRect(sx0, top, sx1 - sx0, face - top);
    c.fillStyle = withAlpha(am.rim, 0.5 + 0.2 * back);
    c.fillRect(sx0, top - 0.6, sx1 - sx0, 1.3);
    c.fillStyle = withAlpha(am.core, 0.18 + 0.2 * back);
    c.fillRect(sx0, face - 1, sx1 - sx0, 1);
    c.fillStyle = mixLab(am.fg, am.ink, 0.2);
    c.fillRect(sx0, face, sx1 - sx0, 40 + 60 * back);
  }
  if (back > 0.01) {
    // the sash's glazing bars (at the thirds and a high transom, never through the centre), seen as the camera
    // pulls back; then the lamp's pool on the wall at lower right and on the sill
    c.filter = `blur(${(1.0 * f.pxScale).toFixed(2)}px)`;
    c.fillStyle = withAlpha(ink, 0.92 * back);
    for (const q of [1 / 3, 2 / 3]) c.fillRect(X0 + (X1 - X0) * q - 5, Y0, 10, Y1 - Y0);
    c.fillRect(X0, Y0 + (Y1 - Y0) * 0.2 - 4, X1 - X0, 8);
    c.filter = 'none';
    c.fillStyle = withAlpha(am.rim, 0.3 * back);
    for (const q of [1 / 3, 2 / 3]) c.fillRect(X0 + (X1 - X0) * q + 5, Y0, 1, Y1 - Y0);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(X1 + 220, Y1 + 120, 10, X1 + 220, Y1 + 120, 760);
    g.addColorStop(0, withAlpha(am.halo, 0.36 * back));
    g.addColorStop(0.5, withAlpha(am.halo, 0.12 * back));
    g.addColorStop(1, withAlpha(am.halo, 0));
    c.fillStyle = g;
    c.beginPath();
    c.rect(-1400, -1000, 4080, 2720);
    c.rect(X0, Y0, X1 - X0, Y1 - Y0);
    c.fill('evenodd');
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

// ===================================================================================== the Go board's record + the handset
/** the stones on the jetty's board: the right shore's two (ch14-s01, ch14-s04) and the left shore's answer (ch14-s02) */
export const STONES: { col: number; row: number; side: 'R' | 'L' }[] = [
  { col: 13, row: 6, side: 'R' },
  { col: 14, row: 12, side: 'R' },
  { col: 5, row: 9, side: 'L' },
];
const BOARD_AT = { x: JETTY.board.x, y: JETTY.board.y, s: JETTY.board.s };
export function stonePt(col: number, row: number): P {
  return goBoard.point(BOARD_AT, col, row);
}
/** the three stones, drawn a little larger than the prop's own so they read at this distance */
export function boardStones(c: C, env: PaintEnv) {
  const m = env.mood;
  for (const s of STONES) {
    const p = stonePt(s.col, s.row);
    c.fillStyle = s.side === 'R' ? env.fill('ink') : mixLab(MOODS.parchment.sky[1], m.rim, 0.3);
    c.beginPath();
    c.ellipse(p.x, p.y - 1.4, 5.8, 2.9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(m.rim, s.side === 'R' ? 0.62 : 0.75);
    c.fillRect(p.x - 2.6, p.y - 3.4, 3, 0.9);
  }
}

/** the handset laid across the board: an old telephone handset (earpiece left, mouthpiece right) on a small
 *  cradle with two brass name-plates; `drop` 0..1 lowers it into place */
export const HANDSET = { x: JETTY.board.x + 4, y: JETTY.board.y - 57, len: 54, rot: -0.06 };
export function handsetEnds(): { L: P; R: P; plateL: P; plateR: P } {
  const H = HANDSET;
  const cs = Math.cos(H.rot), sn = Math.sin(H.rot);
  const at = (lx: number, ly: number): P => ({ x: H.x + lx * cs - ly * sn, y: H.y + lx * sn + ly * cs });
  return { L: at(-H.len / 2 - 2, 4), R: at(H.len / 2 + 2, 4), plateL: at(-12, 13), plateR: at(12, 13) };
}
export function handset(c: C, env: PaintEnv, o: { drop: number; plates?: number }) {
  if (o.drop <= 0.001) return;
  const m = env.mood;
  const H = HANDSET;
  const u = sm(o.drop);
  const lift = (1 - u) * 120 + Math.sin(u * Math.PI) * 6 * (1 - u);
  c.save();
  c.translate(H.x, H.y - lift);
  c.rotate(H.rot + (1 - u) * 0.25);
  const ink = env.fill('ink');
  // the cradle: a low block with the two plates on its front
  if (u > 0.98) {
    c.fillStyle = ink;
    c.fillRect(-24, 6, 48, 11);
    const brass = mixLab(WARM, m.halo, 0.3);
    const pa = 0.6 + 0.4 * (o.plates ?? 0);
    c.fillStyle = withAlpha(brass, pa);
    c.fillRect(-21, 9, 17, 5.5);
    c.fillRect(4, 9, 17, 5.5);
    // their top edges catch the lantern
    c.fillStyle = withAlpha(mixLab(WARM, MOODS.parchment.rim, 0.5), 0.7 * pa);
    c.fillRect(-21, 9, 17, 1);
    c.fillRect(4, 9, 17, 1);
    c.fillStyle = withAlpha(ink, 0.6);
    for (const x0 of [-19, 6]) for (let k = 0; k < 3; k++) c.fillRect(x0 + k * 4.4, 11.2, 3.2, 0.8);
  }
  // the handset: grip bar with an earpiece cup (left) and mouthpiece cup (right)
  const L = H.len;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-L / 2 + 6, -3);
  c.quadraticCurveTo(0, -11, L / 2 - 6, -3);
  c.lineTo(L / 2 - 6, 3);
  c.quadraticCurveTo(0, -4, -L / 2 + 6, 3);
  c.closePath();
  c.fill();
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.ellipse(sx * (L / 2 - 6), 2, 10, 6.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.beginPath();
  c.moveTo(-L / 2 + 6, -3.6);
  c.quadraticCurveTo(0, -11.6, L / 2 - 6, -3.6);
  c.lineTo(L / 2 - 6, -2.6);
  c.quadraticCurveTo(0, -10.4, -L / 2 + 6, -2.6);
  c.closePath();
  c.fill();
  c.restore();
}

/** the cord, both ways from the handset into the water toward each shore; far ends are passed in L4 coords (use
 *  across() from the shore points). Review r1: no static glows at the cradle (they read as headlights).
 *    glow   0..1  a faint, even light along the whole cord (the channel open), no hot spot at either end
 *    pulse  0..1  a travelling pulse from the handset out to each shore (incidents), its bead fading in only once it
 *                 has left the cradle; omitted / ≤ 0 = none
 *    land   0..1  the soft landing glow where each cord reaches its skyline */
export function handsetCords(c: C, env: PaintEnv, o: { ends: { L: P; R: P }; farL: P; farR: P; reveal: number; glow: number; t: number; pulse?: number; land?: number }) {
  if (o.reveal <= 0.001) return;
  const m = env.mood;
  const ink = env.fill('ink');
  const runs: [P, P, number][] = [
    [o.ends.L, o.farL, -1],
    [o.ends.R, o.farR, 1],
  ];
  for (const [a, b, side] of runs) {
    // drop off the landing's edge to the water, then lie on the water converging to the far shore
    const edge = { x: a.x + side * 26, y: JETTY.land.yb + 14 };
    const pts: P[] = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const q = i / n;
      let p: P;
      if (q < 0.12) {
        const v = q / 0.12;
        p = { x: lerp(a.x, edge.x, v), y: lerp(a.y, edge.y, v * v) + Math.sin(v * Math.PI) * 4 };
      } else {
        const v = (q - 0.12) / 0.88;
        const e = 1 - Math.pow(1 - v, 2.2);
        p = { x: lerp(edge.x, b.x, e), y: lerp(edge.y, b.y, 1 - Math.pow(1 - v, 1.4)) + Math.sin(v * 9 + side) * 3 * (1 - v) };
      }
      pts.push(p);
    }
    const shown = Math.max(2, Math.floor(n * clamp01(o.reveal)));
    c.save();
    c.lineCap = 'round';
    for (let i = 1; i <= shown; i++) {
      const q = i / n;
      c.strokeStyle = withAlpha(ink, 0.95 * (1 - 0.7 * q));
      c.lineWidth = lerp(3, 0.9, q);
      c.beginPath();
      c.moveTo(pts[i - 1].x, pts[i - 1].y);
      c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
    }
    const col = mixLab(m.rim, WARM, 0.5);
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'butt';
    // the right cord's pulse leaves a beat after the left's (never a matched pair of lights at the cradle)
    const pulse = (o.pulse ?? 0) > 0 ? clamp01((o.pulse ?? 0) * 1.12 - (side > 0 ? 0.12 : 0)) : 0;
    const head = pulse > 0 ? 1 - Math.pow(1 - pulse, 1.6) : -1;
    for (let i = 1; i <= shown; i++) {
      const q = i / n;
      // the even channel light, plus the pulse's short tail behind its head
      let a2 = 0.22 * o.glow;
      if (head > 0 && q <= head && q > head - 0.16) a2 += 0.75 * (1 - (head - q) / 0.16) * sm(head / 0.12);
      if (a2 <= 0.005) continue;
      c.strokeStyle = withAlpha(col, Math.min(1, a2));
      c.lineWidth = lerp(2.2, 1, q);
      c.beginPath();
      c.moveTo(pts[i - 1].x, pts[i - 1].y);
      c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
    }
    if (head > 0 && head < 1) {
      const hp = pts[Math.min(n, Math.round(head * n))];
      const spr = softSprite(WARM, 0.3);
      // the bead fades in only once it is out on the water, and swells a little as it runs
      c.globalAlpha = 0.85 * sm((head - 0.18) / 0.2) * (1 - 0.3 * sm((head - 0.85) / 0.15));
      const r = lerp(9, 14, head);
      c.drawImage(spr, hp.x - r, hp.y - r, 2 * r, 2 * r);
    }
    const land = o.land ?? 0;
    if (land > 0.005) {
      // its landing at the skyline: a low, wide soft glow on the water under the shore
      const spr = softSprite(WARM, 0.2);
      c.globalAlpha = 0.7 * land;
      c.drawImage(spr, b.x - 34, b.y - 9, 68, 18);
      c.globalAlpha = 0.45 * land;
      c.drawImage(spr, b.x - 12, b.y - 12, 24, 20);
    }
    c.restore();
  }
}

// ===================================================================================== the reflection (L2)
let sheet: { cv: HTMLCanvasElement; w: number; h: number } | null = null;

export interface ReflectOpts {
  /** sheet top-left in L2 world coords */
  x: number;
  y: number;
  /** sheet size in sheet-local units */
  w: number;
  h: number;
  /** L2 world units per sheet unit (default 1): a push in the glass scales the reflection about its anchor */
  scale?: number;
  /** sheet supersampling (device px per sheet unit / pxScale), so a scaled-up reflection stays crisp */
  res?: number;
  /** draw the study shelf / hands into the sheet, in sheet-local coords (origin = sheet top-left), candleAmber env */
  draw: (c: C, env: PaintEnv) => void;
  /** flames drawn brighter on top (sheet-local points); r = glow radius multiplier (default 1) */
  flames?: { x: number; y: number; k: number; seed: number; r?: number }[];
  /** ONE uniform strength for the whole reflection (~0.35) */
  alpha?: number;
  /** horizontal ripple displacement in screen px (2–3) */
  ripple?: number;
  /** a per-band strength factor 0..1 by the band's L2-world y (e.g. thinner where the columns cross the skylines) */
  bandAlpha?: (yWorld: number) => number;
}

/** the glass's own plane: L2 depth, but unblurred so the reflection composites straight onto the scene */
const GLASS: LayerSpec = { ...LAYERS.L2, blur: 0 };

/** an offscreen sub-render of the study (candleAmber, STUDY LOCK) laid on the glass at ONE uniform alpha with a
 *  'screen' blend, as a night reflection is: the lit parts of the room (flames, their pool, rim-lit wax and lettering,
 *  the match-lit hand) show over the water and sky; its dark parts show nothing (no solid shapes standing in the
 *  water, and no second reflection on the water). A slow horizontal ripple (2–3 px) runs through it in thin bands. */
export function reflection(f: Frame, o: ReflectOpts) {
  const ps = f.pxScale;
  const res = o.res ?? 1;
  const sc = o.scale ?? 1;
  const W = Math.ceil(o.w * ps * res), H = Math.ceil(o.h * ps * res);
  if (!sheet || sheet.cv.width < W || sheet.cv.height < H) sheet = { cv: makeCanvas(Math.max(W, sheet?.cv.width ?? 0), Math.max(H, sheet?.cv.height ?? 0)), w: W, h: H };
  const cc = sheet.cv.getContext('2d') as CanvasRenderingContext2D;
  cc.setTransform(1, 0, 0, 1, 0, 0);
  cc.clearRect(0, 0, sheet.cv.width, sheet.cv.height);
  cc.setTransform(ps * res, 0, 0, ps * res, 0, 0);
  const env = makeEnv({ mood: 'candleAmber', layer: 'L3', t: f.t, pxScale: ps * res, seed: f.seed, frame: f.frame });
  o.draw(cc, env);
  const t = f.t;
  const amp = o.ripple ?? 2.5;
  const alpha = o.alpha ?? 0.35;
  const ripple = (y: number) => amp * (0.6 * Math.sin(y * 0.09 + t * 0.9) + 0.4 * Math.sin(y * 0.023 - t * 0.45));
  f.layer(GLASS, (c) => {
    if (alpha <= 0.004) return;
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha *= Math.min(1, alpha);
    const band = 3 / sc;
    const base = c.globalAlpha;
    for (let y = 0; y < o.h; y += band) {
      const hh = Math.min(band, o.h - y);
      if (o.bandAlpha) {
        const ka = o.bandAlpha(o.y + (y + hh / 2) * sc);
        if (ka <= 0.004) continue;
        c.globalAlpha = base * ka;
      }
      c.drawImage(sheet!.cv, 0, y * ps * res, W, hh * ps * res, o.x + ripple(y * sc), o.y + y * sc, o.w * sc, hh * sc);
    }
    c.restore();
    if (o.flames?.length) {
      // the flames: the brightest points in the glass (added light, rippling with the rest)
      c.save();
      c.globalCompositeOperation = 'lighter';
      const am = MOODS.candleAmber;
      const r0 = 40 * Math.pow(sc, 0.75);
      for (const fl of o.flames) {
        if (fl.k <= 0.01) continue;
        const fx = o.x + fl.x * sc + ripple(fl.y * sc), fy = o.y + fl.y * sc;
        const tr = 1 + 0.07 * Math.sin(t * 9.1 + fl.seed) * Math.sin(t * 3.7 + fl.seed * 2);
        const k = fl.k * Math.min(1.2, alpha / 0.35);
        const rr = r0 * (fl.r ?? 1) * tr;
        const g = c.createRadialGradient(fx, fy, 0, fx, fy, rr);
        g.addColorStop(0, withAlpha(am.core, 0.55 * k));
        g.addColorStop(0.2 / (fl.r ?? 1), withAlpha(am.halo, 0.26 * k));
        g.addColorStop(1, withAlpha(am.halo, 0));
        c.fillStyle = g;
        c.fillRect(fx - rr * 1.1, fy - rr * 1.1, rr * 2.2, rr * 2.2);
      }
      c.restore();
    }
  });
}

// ===================================================================================== small paper tags
export interface TagOpts {
  /** the thread's top (hung from the window's top rail, off the top of frame) */
  hang: P;
  /** the tag's eyelet (where the thread ties on) */
  at: P;
  lines: [string, string];
  /** 0..1 how far it has swung in (0 = out of frame / not yet hung) */
  u: number;
  /** light on it 0..1 (the candle's) */
  lit?: number;
  seed?: number;
  t: number;
  size?: number;
  /** the arrival swing's amplitude, radians (default 1.1) */
  swing?: number;
}

/** a small manila tag on a thread: one estimate (line 1) and its speaker with affiliation (line 2) */
export function paperTag(c: C, o: TagOpts, env: PaintEnv) {
  if (o.u <= 0.001) return;
  const m = env.mood;
  const am = MOODS.candleAmber;
  const size = o.size ?? 18;
  // the speaker line nearly as large as the estimate: both are read (22 px cap floor)
  const sz2 = size * 0.96;
  c.save();
  c.font = `600 ${size}px ${FONT.mono}`;
  const w1 = c.measureText(o.lines[0]).width;
  c.font = `500 ${sz2}px ${FONT.mono}`;
  const w2 = c.measureText(o.lines[1]).width;
  const w = Math.max(w1, w2) + 30;
  const h = size + sz2 + 26;
  // the swing: arrives from the side on its thread, overshoots, settles; then turns gently
  const u = clamp01(o.u);
  const swing = (1 - sm(u)) * (o.swing ?? 1.1) * Math.cos(u * 7.5) + 0.025 * Math.sin(o.t * 0.9 + (o.seed ?? 0));
  const L = Math.hypot(o.at.x - o.hang.x, o.at.y - o.hang.y);
  const a0 = Math.atan2(o.at.x - o.hang.x, o.at.y - o.hang.y);
  const ang = a0 + swing;
  const eye = { x: o.hang.x + Math.sin(ang) * L, y: o.hang.y + Math.cos(ang) * L };
  // thread
  c.strokeStyle = withAlpha(mixLab(m.rim, am.rim, 0.5), 0.55);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(o.hang.x, o.hang.y);
  c.lineTo(eye.x, eye.y);
  c.stroke();
  c.translate(eye.x, eye.y);
  c.rotate(-swing * 0.6);
  const lit = o.lit ?? 1;
  const paper = mixLab(mixLab(m.setHaze, m.haze, 0.5), mixLab(am.rim, '#efe2c4', 0.4), 0.45 + 0.5 * lit);
  // tag: a notched manila rectangle hanging from its eyelet (top-left corner clipped)
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-w / 2 + 3, 5, w, h);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2 + 10, 0);
  c.lineTo(w / 2 - 10, 0);
  c.lineTo(w / 2, 10);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.lineTo(-w / 2, 10);
  c.closePath();
  c.fill();
  // eyelet
  c.fillStyle = mixLab(paper, m.ink, 0.5);
  c.beginPath();
  c.arc(0, 7, 3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = paper;
  c.beginPath();
  c.arc(0, 7, 1.4, 0, Math.PI * 2);
  c.fill();
  // lettering
  const ink = mixLab(m.ink, paper, 0.1);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `600 ${size}px ${FONT.mono}`;
  c.fillText(o.lines[0], 0, 14 + size);
  c.globalAlpha *= 0.86;
  c.font = `500 ${sz2}px ${FONT.mono}`;
  c.fillText(o.lines[1], 0, 14 + size + 6 + sz2);
  c.restore();
}

// ===================================================================================== floating paper lanterns
/** a small open paper lantern on a little float: translucent paper (its notes visible as faint lines), a warm core */
export function floatLantern(c: C, o: { x: number; y: number; s: number; t: number; seed: number; glow?: number }, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const bob = Math.sin(o.t * 1.6 + o.seed) * 1.2 * o.s;
  const tilt = 0.05 * Math.sin(o.t * 1.1 + o.seed * 2);
  const s = o.s;
  const g = o.glow ?? 1;
  c.save();
  c.translate(o.x, o.y + bob);
  // its light on the water (under the float)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const spr = softSprite(WARM, 0.1);
  c.globalAlpha = 0.32 * g;
  c.drawImage(spr, -30 * s, -6 * s, 60 * s, 14 * s);
  c.globalAlpha = 0.12 * g;
  c.drawImage(spr, -3 * s, 2 * s, 6 * s, 26 * s);
  c.restore();
  c.rotate(tilt);
  // float
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-11 * s, -1 * s);
  c.lineTo(11 * s, -1 * s);
  c.lineTo(8 * s, 3 * s);
  c.lineTo(-8 * s, 3 * s);
  c.closePath();
  c.fill();
  // paper body
  const w = 12 * s, h = 15 * s;
  c.fillStyle = mixLab(m.halo, WARM, 0.6);
  c.globalAlpha = 0.85;
  c.fillRect(-w / 2, -1 * s - h, w, h);
  c.globalAlpha = 1;
  // the notes inside (faint lines), frame, cap
  c.fillStyle = withAlpha(ink, 0.35);
  for (let k = 0; k < 4; k++) c.fillRect(-w / 2 + 2 * s, -h + k * 3.2 * s + 1.5 * s, w - 4 * s, 0.6 * s);
  c.fillStyle = ink;
  c.fillRect(-w / 2 - 0.8 * s, -1 * s - h - 2 * s, w + 1.6 * s, 2.2 * s);
  c.fillRect(-w / 2, -1 * s - h, 1.1 * s, h);
  c.fillRect(w / 2 - 1.1 * s, -1 * s - h, 1.1 * s, h);
  c.fillRect(-0.6 * s, -1 * s - h - 7 * s, 1.2 * s, 5 * s);
  c.restore();
  // glow above (additive), small
  c.save();
  c.globalCompositeOperation = 'lighter';
  const spr2 = softSprite(WARM, 0.2);
  c.globalAlpha = 0.45 * g;
  c.drawImage(spr2, o.x - 18 * s, o.y + bob - 26 * s, 36 * s, 36 * s);
  c.restore();
}

// ===================================================================================== helpers
/** a world point on one layer re-expressed in another layer's coords (for threads that span depths) */
export function across(fromZ: Pick<LayerSpec, 'z'>, toZ: Pick<LayerSpec, 'z'>, cam: Camera3, p: P): P {
  const s = toScreen(fromZ, cam, p.x, p.y);
  return toLayer(toZ, cam, s.x, s.y);
}

/** a typed label on a soft ink plate (screen-locked): IBM Plex Mono, ≥ 26 px at 1080p */
export function monoLabel(c: C, o: { text: string; x: number; y: number; a: number; size?: number; align?: 'left' | 'center' | 'right'; sub?: string }, m: { ink: string; core: string; rim: string }) {
  if (o.a <= 0.01) return;
  const size = o.size ?? 19;
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  const w = Math.max(c.measureText(o.text).width, o.sub ? c.measureText(o.sub).width : 0);
  const align = o.align ?? 'left';
  const x0 = align === 'left' ? o.x : align === 'right' ? o.x - w : o.x - w / 2;
  const hh = o.sub ? size * 2.5 : size * 1.3;
  // soft feathered plate (the kit's)
  c.save();
  c.globalAlpha = o.a;
  softPlate(c, x0 + w / 2, o.y - size * 0.35 + (o.sub ? size * 0.6 : 0), w + 150, hh + 70, m.ink, 0.55);
  c.restore();
  const k = sm(o.a);
  c.globalAlpha = k;
  c.fillStyle = mixLab('#f1e6cf', m.core, 0.2);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.letterSpacing = '1px';
  c.fillText(o.text, x0, o.y);
  if (o.sub) c.fillText(o.sub, x0, o.y + size * 1.35);
  c.globalAlpha = 0.6 * k;
  c.fillRect(x0, o.y - size - 9, w, 0.8);
  c.restore();
}

export const moodOf = (id: MoodId) => MOODS[id];
export { LAYERS };
