/**
 * durable-objects-unbound — shared helpers for every shot and set (film-specific, not kit).
 *
 *   clamp01, lerp, sm (smoothstep), seg(t, a, b) (0..1 ramp, smoothed), pulse(t, at, rise, fall)
 *   twos(t)                          quantise to twos (12 Hz) for cut-paper motion
 *   camAt(keys, t)                   keyframed Camera3 (smootherstep between keys)
 *   bakeRect(f, c, env, key, r, draw) cache static art covering rect r (layer coords), keyed by mood
 *   BRASS / BRASS_HI / EMBER / WAX / SEA_CYAN / PAPER / INK_RED   motivated accent colours (mixed with the mood)
 *   brass(env, a?)                   brass hazed for the current layer
 *   label(c, f, o)                   a screen-locked subject label (≥ 22 px cap @1080p) on a soft plate, probed
 *   tickMark(c, x, y, s, u, col)     the two-stroke ink tick (u 0..1 draws stroke 1 then 2)
 *   badge(c, env, o)                 a brass implementation tag on a cord (text ≥ 26 px @1080p when legible)
 *   slip(c, env, o)                  the sender's paper slip '#42 · the ferry is late' with its tick
 *
 * Accent budget (staging.accentBudget): one warm practical per shot plus brass; serverCyan only in the Well
 * cutaway, the hosted relay diagram and the commit strip; red only for pins, wax seals, commit stamps and
 * emberRed grades. Every colour here is mixed with the mood so a lamp change regrades it.
 */
import { cam3Interp, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha, FONT } from '../../../film';
import type { Camera3, Frame, PaintEnv, Palette } from '../../../film';

export type C2 = CanvasRenderingContext2D;

export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
/** smootherstep */
export const smr = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** 0 before a, 1 after b, smoothed between */
export const seg = (t: number, a: number, b: number) => (b <= a ? (t >= a ? 1 : 0) : sm((t - a) / (b - a)));
/** rises over `rise` from `at`, falls over `fall` after `at + hold` */
export const pulse = (t: number, at: number, rise = 0.25, hold = 0.2, fall = 0.8) =>
  seg(t, at, at + rise) * (1 - seg(t, at + rise + hold, at + rise + hold + fall));
export const twos = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

export interface CamKey {
  t: number;
  cam: Camera3;
}
/** keyframed camera: smootherstep between consecutive keys, held at the ends */
export function camAt(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / Math.max(1e-6, b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** bake static art covering r (layer coordinates) once per mood, then place it */
export function bakeRect(f: Frame, c: C2, env: PaintEnv, key: string, r: Rect, draw: (cc: C2) => void, blur?: number): void {
  f.cached(`dou/${key}/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    draw(cc);
  }, blur != null ? { blur } : undefined)(c, r.x, r.y);
}

// ------------------------------------------------------------------ accent colours
export const BRASS = '#b8934a';
export const BRASS_HI = '#e9cf8a';
export const EMBER = '#c2412b';
export const WAX = '#a8281e';
export const INK_RED = '#9e2a1f';
export const SEA_CYAN = '#6fd6e0';
export const PAPER = '#e9dcc0';
export const GOLD = '#f2c86a';

/** an accent mixed toward the mood (keeps it in the film's light) and the layer's haze */
export function tone(env: PaintEnv, hex: string, moodMix = 0.25): string {
  return mixLab(mixLab(hex, env.mood.core, moodMix), env.mood.haze, env.layer?.haze ?? 0);
}
export const brass = (env: PaintEnv, hi = 0) => tone(env, mixLab(BRASS, BRASS_HI, hi), 0.22);
export const paper = (env: PaintEnv, dim = 0) => mixLab(tone(env, PAPER, 0.3), env.mood.fg, dim);

// ------------------------------------------------------------------ type
export interface LabelOpts {
  id: string;
  text: string;
  /** stage px (screen-locked) anchor */
  x: number;
  y: number;
  align?: 'left' | 'right' | 'center';
  /** 0..1 */
  alpha: number;
  size?: number;
  italic?: boolean;
  /** draw the soft ink plate (default true; false on parchment) */
  plate?: boolean;
  color?: string;
}
/** a screen-locked subject label: EB Garamond, raised to the 22 px @1080p cap floor, on a feathered plate */
export function label(c: C2, mood: Palette, o: LabelOpts): void {
  if (o.alpha <= 0.002) return;
  textRole(c, 'subject', () => {
    c.save();
    const style = o.italic ? 'italic 400' : '500';
    const size = legibleSize(c, `${style} ${o.size ?? 22}px ${FONT.text}`, o.size ?? 22);
    c.font = `${style} ${size}px ${FONT.text}`;
    const w = c.measureText(o.text).width;
    const align = o.align ?? 'left';
    const x0 = align === 'left' ? o.x : align === 'right' ? o.x - w : o.x - w / 2;
    const parch = mood.id.startsWith('parchment');
    if (o.plate !== false && !parch) {
      c.globalAlpha = o.alpha;
      softPlate(c, x0 + w / 2, o.y - size * 0.32, w + 120, size * 3.0, mood.ink, 0.55);
    }
    c.globalAlpha = o.alpha;
    c.fillStyle = o.color ?? (parch ? mood.ink : mixLab('#efe3cf', mood.core, 0.2));
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(o.text, x0, o.y);
    textProbe(c, o.id, x0, o.y - size, w, size * 1.25, o.alpha);
    c.restore();
  });
}

// ------------------------------------------------------------------ the tick
/** the film's two-stroke ink tick, centred near (x, y), s = size in px; u 0..0.5 draws stroke 1, 0.5..1 stroke 2 */
export function tickMark(c: C2, x: number, y: number, s: number, u: number, col: string, lw = 0.16): void {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = s * lw;
  const a = { x: x - s * 0.42, y: y - s * 0.02 };
  const b = { x: x - s * 0.12, y: y + s * 0.3 };
  const d = { x: x + s * 0.48, y: y - s * 0.42 };
  const u1 = clamp01(u * 2), u2 = clamp01(u * 2 - 1);
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(lerp(a.x, b.x, u1), lerp(a.y, b.y, u1));
  if (u2 > 0) c.lineTo(lerp(b.x, d.x, u2), lerp(b.y, d.y, u2));
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ implementation badges
export type BadgeText = 'workerd · 28 Oct' | 'workerd · 31 Oct' | 'celld 0.6.3' | 'Cloudflare, hosted' | 'Amazon S3';
export interface BadgeOpts {
  /** the hook point (layer coords); the tag hangs below it on a short cord */
  x: number;
  y: number;
  text: BadgeText;
  /** tag scale (1 = 30 px tall at rest; text sized to stay legible when legible = true) */
  s?: number;
  /** swing angle (rad) */
  swing?: number;
  alpha?: number;
  /** catch-light 0..1 */
  glint?: number;
  /** text must pass the legibility floor (raised to it); false = too small to read (art only) */
  legible?: boolean;
  /** engraved on parchment (ink lines, no brass fill) */
  engraved?: boolean;
  id?: string;
}
/** a small brass tag naming whose mechanism a machine is (staging.badges). Never two on one mechanism. */
export function badge(c: C2, env: PaintEnv, o: BadgeOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.swing ?? 0);
  const legible = o.legible !== false;
  const run = () => {
    let size = 15 * s;
    const font = (sz: number) => `600 ${sz}px ${FONT.sc}`;
    if (legible) size = legibleSize(c, font(size), size, o.text.toLowerCase());
    c.font = font(size);
    const tw = c.measureText(o.text).width;
    const w = tw + size * 1.3, h = size * 1.75;
    const cord = 10 * s;
    // cord
    c.strokeStyle = o.engraved ? withAlpha(env.mood.ink, 0.8) : withAlpha(env.fill('ink'), 0.9);
    c.lineWidth = Math.max(0.8, 1.1 * s);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-w * 0.2, cord);
    c.moveTo(0, 0);
    c.lineTo(w * 0.2, cord);
    c.stroke();
    // tag body: a clipped-corner brass plate
    const x0 = -w / 2, y0 = cord;
    const k = h * 0.22;
    c.beginPath();
    c.moveTo(x0 + k, y0);
    c.lineTo(x0 + w - k, y0);
    c.lineTo(x0 + w, y0 + k);
    c.lineTo(x0 + w, y0 + h - k);
    c.lineTo(x0 + w - k, y0 + h);
    c.lineTo(x0 + k, y0 + h);
    c.lineTo(x0, y0 + h - k);
    c.lineTo(x0, y0 + k);
    c.closePath();
    if (o.engraved) {
      c.strokeStyle = withAlpha(env.mood.ink, 0.85);
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = env.mood.ink;
    } else {
      const g = c.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, brass(env, 0.55 + 0.45 * (o.glint ?? 0)));
      g.addColorStop(1, mixLab(brass(env, 0), env.mood.fg, 0.35));
      c.fillStyle = g;
      c.fill();
      c.strokeStyle = withAlpha(mixLab(BRASS, env.mood.fg, 0.6), 0.9);
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = mixLab('#20160a', env.mood.fg, 0.3);
    }
    // the hole
    c.beginPath();
    c.arc(0, y0 + h * 0.2, Math.max(1, 1.4 * s), 0, Math.PI * 2);
    c.fill();
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(o.text, 0, y0 + h * 0.5 + size * 0.42);
    if (o.id && legible) textProbe(c, o.id, x0, y0, w, h, a);
  };
  if (legible) textRole(c, 'subject', run);
  else textRole(c, 'texture', run);
  c.restore();
}

// ------------------------------------------------------------------ the slip
export interface SlipOpts {
  x: number;
  y: number;
  /** width of the slip in px (height = w * 0.42) */
  w: number;
  rot?: number;
  alpha?: number;
  /** tick 0..1 (two strokes) */
  tick?: number;
  /** a faint question mark where the tick would be (lost reply) */
  question?: number;
  /** ink the text '#42 · the ferry is late' (only when large enough to be read) */
  text?: boolean;
  textAlpha?: number;
  id?: string;
}
export const SLIP_TEXT = '#42 · the ferry is late';
/** the sender's paper slip: torn top edge, ink rows (or the real text when large), and the two-stroke tick */
export function slip(c: C2, env: PaintEnv, o: SlipOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const w = o.w, h = w * 0.42;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.fillStyle = paper(env);
  c.beginPath();
  c.moveTo(-w / 2, -h / 2 + 1);
  const n = 7;
  for (let i = 1; i <= n; i++) c.lineTo(-w / 2 + (w * i) / n, -h / 2 + (i % 2 ? -1.2 : 1) * (w / 120));
  c.lineTo(w / 2, h / 2);
  c.lineTo(-w / 2, h / 2);
  c.closePath();
  c.fill();
  const ink = mixLab('#1d1712', env.mood.fg, 0.2);
  if (o.text) {
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `500 ${w * 0.085}px ${FONT.text}`, w * 0.085);
      c.font = `500 ${size}px ${FONT.text}`;
      c.fillStyle = ink;
      c.globalAlpha = a * (o.textAlpha ?? 1);
      c.textAlign = 'left';
      c.fillText(SLIP_TEXT, -w / 2 + w * 0.06, h * 0.05, w * 0.66);
      if (o.id) textProbe(c, o.id, -w / 2, -h / 2, w, h, a * (o.textAlpha ?? 1));
      c.globalAlpha = a;
    });
  } else {
    c.strokeStyle = withAlpha(ink, 0.55);
    c.lineWidth = Math.max(0.6, w * 0.022);
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.moveTo(-w * 0.4, -h * 0.12 + i * h * 0.28);
      c.lineTo(w * (i ? 0.05 : 0.18), -h * 0.12 + i * h * 0.28);
      c.stroke();
    }
  }
  tickMark(c, o.text ? w * 0.4 : w * 0.34, o.text ? -h * 0.12 : h * 0.02, h * (o.text ? 0.5 : 0.62), o.tick ?? 0, mixLab('#1d1712', env.mood.fg, 0.1)); // the tick is plain ink: red is reserved (pins, wax, WAL stamps, emberRed)
  if ((o.question ?? 0) > 0.01) {
    c.globalAlpha = a * (o.question ?? 0) * 0.55;
    c.fillStyle = ink;
    c.font = `italic 500 ${h * 0.7}px ${FONT.text}`;
    c.textAlign = 'center';
    textRole(c, 'texture', () => c.fillText('?', w * 0.34, h * 0.24));
  }
  c.restore();
}

/** a hairline thread / cord between two points with a sag */
export function cord(c: C2, x0: number, y0: number, x1: number, y1: number, sag: number, col: string, lw: number, u = 1): void {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  c.moveTo(x0, y0);
  if (u >= 1) c.quadraticCurveTo(mx, my, x1, y1);
  else {
    const N = 24;
    for (let i = 1; i <= Math.ceil(N * u); i++) {
      const k = Math.min(u, i / N);
      const x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * mx + k * k * x1;
      const y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * my + k * k * y1;
      c.lineTo(x, y);
    }
  }
  c.stroke();
  c.restore();
}
/** a point along the cord at u */
export function cordAt(x0: number, y0: number, x1: number, y1: number, sag: number, u: number): { x: number; y: number } {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  return {
    x: (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1,
    y: (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1,
  };
}

/** a soft additive glow disc (for small lights inside props: crown lamp, cistern lamps) */
export function glowDot(c: C2, x: number, y: number, r: number, col: string, a: number): void {
  if (a <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, 0.9 * a));
  g.addColorStop(0.25, withAlpha(col, 0.45 * a));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}
