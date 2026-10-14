/**
 * film/promo — the PROMO look: a product-marketing register for orly-2 films whose script.json has
 * `"look": "promo"` (films/<slug>/look.md is the film's style sheet; the skill is .claude/skills/film-promo).
 *
 * Canvas painters, pure functions of time, drawn in stage px (1280×720) on the scene canvas (f.c, already scaled):
 *
 *   paper(c, { tone })                                flat light-grey studio paper (#e9e8ea) or 'warm'
 *   haze(c, { t, preset, u, y0, drift })              drifting colour fields: 'dawn' (lilac → peach, rose glow), 'ember'
 *                                                      (grey paper over a coral/orange/pink fire), 'violet', 'rose', 'brand'
 *   hairlines(c, { ys, alpha, color })                 the reference's thin full-width rules
 *   squareDots(c, pts, { size, color, u })            small square registration dots
 *   bracket(c, { text, x, y, size, u, out, dots })     "{ text }": braces part as the words blur in (u 0..1), corner dots
 *   kinetic(c, { words, t, x, y, size, grad, out })    words arriving one by one ({text, at}), blur → sharp; grad sweeps the
 *                                                      line white → peach → orange (the reference's "all your tool")
 *   typed(c, { text, t, at, cps, x, y, size, caret })  text typed full-frame with a caret (blink is a function of t)
 *   steps(c, { title, items, t, x, y, working })      a resolving step list with icons, grey detail, a growing rule, ✓ marks
 *                                                      and a shimmering "Working"
 *   pill(c, { x, y, text, color, u })                  a status pill (PASS / 3:00 AM / PR #9)
 *   blurText(c, text, x, y, { size, u, … })            one string blurred in
 *   counter(n, t, at, dur) · env(t, at, dur, fade) · smooth · easeOut · easeInOut · measure · font · hexA
 *
 * Type: 'Promo Sans' (Inter, variable) and 'Promo Mono' (JetBrains Mono), in public/fonts/film/fonts.css.
 * Product footage is DOM: film/promo RrwebScreen, returned from shot.dom().
 */
import { FILM_H, FILM_W } from '../contracts';

export const PROMO = {
  paper: '#e9e8ea',
  paperWarm: '#efe9e6',
  ink: '#141216',
  mute: '#9e99a4',
  faint: '#c9c5cd',
  brand: '#f41c52', // Replay red-pink
  brandDeep: '#c4103f',
  peach: '#f6c39b',
  orange: '#f59133',
  coral: '#f0455a',
  rose: '#ee79c8',
  violet: '#a78be8',
  lilac: '#c7a6ec',
  sky: '#8fd3f4',
  green: '#1f9d63',
  amber: '#e7a10f',
} as const;

export const SANS = '"Promo Sans", "Inter", system-ui, sans-serif';
export const MONO = '"Promo Mono", "JetBrains Mono", ui-monospace, monospace';
export const PROMO_FONTS = [`300 64px ${SANS}`, `400 64px ${SANS}`, `500 64px ${SANS}`, `600 64px ${SANS}`, `700 64px ${SANS}`, `400 24px ${MONO}`, `600 24px ${MONO}`];

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (u: number) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};
export const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const easeInOut = (u: number) => {
  const x = clamp(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** 0..1: rises over `fade` s from `at`, holds, falls over `fade` s ending at at+dur (dur Infinity = never falls) */
export function env(t: number, at: number, dur = Infinity, fade = 0.4): number {
  const a = smooth((t - at) / fade);
  const b = dur === Infinity ? 1 : smooth((at + dur - t) / fade);
  return Math.min(a, b);
}

export function counter(n: number, t: number, at: number, dur = 1.2): number {
  return Math.round(n * easeOut((t - at) / dur));
}

export function font(weight: number, size: number, mono = false) {
  return `${weight} ${size}px ${mono ? MONO : SANS}`;
}

export function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
}

// ---------------------------------------------------------------- backgrounds
export function paper(c: CanvasRenderingContext2D, o: { tone?: 'cool' | 'warm' | string } = {}) {
  c.fillStyle = o.tone === 'warm' ? PROMO.paperWarm : o.tone && o.tone !== 'cool' ? o.tone : PROMO.paper;
  c.fillRect(0, 0, FILM_W, FILM_H);
}

export type HazePreset = 'dawn' | 'ember' | 'violet' | 'rose' | 'brand';
type Blob = { c: string; x: number; y: number; r: number; a: number; dx: number; dy: number; p: number };
const HAZES: Record<HazePreset, { base: [string, string]; blobs: Blob[] }> = {
  dawn: {
    base: ['#a98ae0', '#f1c3a2'],
    blobs: [
      { c: PROMO.rose, x: 0.48, y: 0.42, r: 0.36, a: 0.75, dx: 0.04, dy: 0.03, p: 9 },
      { c: '#c879e6', x: 0.42, y: 0.2, r: 0.22, a: 0.6, dx: 0.03, dy: 0.02, p: 7 },
      { c: PROMO.peach, x: 0.7, y: 0.85, r: 0.45, a: 0.55, dx: 0.05, dy: 0.02, p: 11 },
      { c: '#f7a3b5', x: 0.3, y: 0.75, r: 0.3, a: 0.45, dx: 0.04, dy: 0.03, p: 8 },
    ],
  },
  ember: {
    base: [PROMO.paper, '#f08a4a'],
    blobs: [
      { c: '#ee3b49', x: 0.22, y: 0.95, r: 0.42, a: 0.95, dx: 0.05, dy: 0.02, p: 10 },
      { c: '#e66ad6', x: 0.6, y: 0.7, r: 0.4, a: 0.85, dx: 0.06, dy: 0.03, p: 12 },
      { c: '#f39a3a', x: 0.9, y: 1.05, r: 0.4, a: 0.9, dx: 0.04, dy: 0.02, p: 9 },
      { c: '#f6d0e6', x: 0.62, y: 0.86, r: 0.16, a: 0.8, dx: 0.05, dy: 0.02, p: 7 },
      { c: '#ee3b49', x: 0.85, y: 0.8, r: 0.22, a: 0.6, dx: 0.04, dy: 0.03, p: 8 },
    ],
  },
  violet: {
    base: ['#9c86e4', '#e3b6d6'],
    blobs: [
      { c: '#7b68dd', x: 0.2, y: 0.25, r: 0.4, a: 0.6, dx: 0.04, dy: 0.03, p: 10 },
      { c: PROMO.rose, x: 0.75, y: 0.6, r: 0.38, a: 0.55, dx: 0.05, dy: 0.03, p: 9 },
      { c: PROMO.sky, x: 0.55, y: 0.05, r: 0.3, a: 0.35, dx: 0.04, dy: 0.02, p: 12 },
    ],
  },
  rose: {
    base: ['#f3d6dc', '#f2b9c4'],
    blobs: [
      { c: '#f7899b', x: 0.3, y: 0.7, r: 0.4, a: 0.6, dx: 0.05, dy: 0.03, p: 10 },
      { c: PROMO.lilac, x: 0.8, y: 0.3, r: 0.38, a: 0.55, dx: 0.04, dy: 0.03, p: 9 },
    ],
  },
  brand: {
    base: ['#24102b', '#4f1236'],
    blobs: [
      { c: PROMO.brand, x: 0.3, y: 0.78, r: 0.45, a: 0.65, dx: 0.05, dy: 0.03, p: 10 },
      { c: '#7d4ae0', x: 0.8, y: 0.25, r: 0.42, a: 0.5, dx: 0.04, dy: 0.03, p: 12 },
      { c: '#ff8a5c', x: 0.65, y: 0.98, r: 0.3, a: 0.4, dx: 0.04, dy: 0.02, p: 9 },
    ],
  },
};

/** soft drifting colour fields; deterministic drift from t; u fades the field in over what is below (0..1) */
export function haze(c: CanvasRenderingContext2D, o: { t: number; preset: HazePreset; u?: number; y0?: number; drift?: number }) {
  const H = HAZES[o.preset];
  const u = o.u ?? 1;
  if (u <= 0) return;
  const y0 = o.y0 ?? 0;
  const dr = o.drift ?? 1;
  c.save();
  c.globalAlpha *= u;
  const g = c.createLinearGradient(0, y0 * FILM_H, 0, FILM_H);
  g.addColorStop(0, H.base[0]);
  g.addColorStop(1, H.base[1]);
  c.fillStyle = g;
  c.fillRect(0, y0 * FILM_H, FILM_W, FILM_H * (1 - y0));
  for (const b of H.blobs) {
    const x = (b.x + Math.sin((o.t * dr * 2 * Math.PI) / b.p) * b.dx) * FILM_W;
    const y = (b.y + y0 * (1 - b.y) + Math.cos((o.t * dr * 2 * Math.PI) / (b.p * 1.3)) * b.dy) * FILM_H;
    const r = b.r * FILM_W;
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, hexA(b.c, b.a));
    rg.addColorStop(0.45, hexA(b.c, b.a * 0.55));
    rg.addColorStop(1, hexA(b.c, 0));
    c.fillStyle = rg;
    c.fillRect(0, 0, FILM_W, FILM_H);
  }
  if (o.preset === 'ember') {
    // grey paper feathering down into the fire (the reference end card)
    const f = c.createLinearGradient(0, 0, 0, FILM_H);
    f.addColorStop(0, PROMO.paper);
    f.addColorStop(0.4, PROMO.paper);
    f.addColorStop(0.72, 'rgba(233,232,234,0)');
    c.fillStyle = f;
    c.fillRect(0, 0, FILM_W, FILM_H);
  }
  c.restore();
}

export function hairlines(c: CanvasRenderingContext2D, o: { ys: number[]; alpha?: number; color?: string }) {
  c.save();
  c.strokeStyle = o.color ?? `rgba(255,255,255,${o.alpha ?? 0.55})`;
  c.lineWidth = 0.8;
  for (const y of o.ys) {
    c.beginPath();
    c.moveTo(0, y + 0.5);
    c.lineTo(FILM_W, y + 0.5);
    c.stroke();
  }
  c.restore();
}

export function squareDots(c: CanvasRenderingContext2D, pts: { x: number; y: number }[], o: { size?: number; color?: string; u?: number } = {}) {
  const s = o.size ?? 6;
  c.save();
  c.globalAlpha *= clamp(o.u ?? 1);
  c.fillStyle = o.color ?? PROMO.ink;
  for (const p of pts) c.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
  c.restore();
}

// ---------------------------------------------------------------- type
function tracked(c: CanvasRenderingContext2D, size: number) {
  (c as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(-0.022 * size).toFixed(2)}px`;
}

export function measure(c: CanvasRenderingContext2D, text: string, size: number, weight = 400, mono = false) {
  c.save();
  c.font = font(weight, size, mono);
  tracked(c, size);
  const w = c.measureText(text).width;
  c.restore();
  return w;
}

/** one string blurred in: u 0 → invisible, blurred, lowered; 1 → sharp in place */
export function blurText(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: { size: number; weight?: number; u: number; color?: string | CanvasGradient; align?: CanvasTextAlign; rise?: number; mono?: boolean },
) {
  const u = clamp(o.u);
  if (u <= 0) return;
  const e = easeOut(u);
  c.save();
  c.font = font(o.weight ?? 400, o.size, o.mono);
  tracked(c, o.size);
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = o.color ?? PROMO.ink;
  c.globalAlpha *= e;
  const blur = (1 - e) * o.size * 0.18;
  if (blur > 0.3) c.filter = `blur(${blur.toFixed(2)}px)`;
  c.fillText(text, x, y + (1 - e) * (o.rise ?? o.size * 0.25));
  c.restore();
}

/** "{ text }": the braces start together and part as the words blur in; square dots mark the corners */
export function bracket(
  c: CanvasRenderingContext2D,
  o: { text: string; x: number; y: number; size: number; u: number; out?: number; color?: string; dots?: 'corners' | 'wide' | 'none'; weight?: number },
) {
  const u = clamp(o.u);
  const out = clamp(o.out ?? 0);
  if (u <= 0 || out >= 1) return;
  const weight = o.weight ?? 400;
  const words = o.text.split(' ');
  const w = measure(c, o.text, o.size, weight);
  const gap = o.size * 0.42;
  const open = easeInOut(clamp(u * 1.6));
  const half = (w / 2 + gap) * open + o.size * 0.18;
  c.save();
  c.globalAlpha *= 1 - out;
  if (out > 0) c.filter = `blur(${(out * o.size * 0.2).toFixed(2)}px)`;
  blurText(c, '{', o.x - half, o.y, { size: o.size, weight: 300, u: clamp(u * 4), color: o.color, align: 'right', rise: 0 });
  blurText(c, '}', o.x + half, o.y, { size: o.size, weight: 300, u: clamp(u * 4), color: o.color, align: 'left', rise: 0 });
  let x = o.x - w / 2;
  const sp = measure(c, ' ', o.size, weight);
  words.forEach((wd, i) => {
    const wu = clamp((u - 0.25 - (i * 0.45) / Math.max(1, words.length)) / 0.35);
    blurText(c, wd, x, o.y, { size: o.size, weight, u: wu, color: o.color });
    x += measure(c, wd, o.size, weight) + sp;
  });
  if ((o.dots ?? 'corners') !== 'none') {
    const dx = o.dots === 'wide' ? half * 1.9 : half + o.size * 0.5;
    const dy = o.size * (o.dots === 'wide' ? 1.5 : 0.75);
    const cy = o.y - o.size * 0.35;
    squareDots(
      c,
      [
        { x: o.x - dx, y: cy - dy },
        { x: o.x + dx, y: cy - dy },
        { x: o.x - dx, y: cy + dy },
        { x: o.x + dx, y: cy + dy },
      ],
      { size: Math.max(4, o.size * 0.13), color: o.color, u: clamp((u - 0.3) * 3) },
    );
  }
  c.restore();
}

/** words arriving one at a time; grad (0..1) sweeps the line white → peach → orange from the right */
export function kinetic(
  c: CanvasRenderingContext2D,
  o: { words: { text: string; at: number; color?: string }[]; t: number; x: number; y: number; size: number; align?: 'left' | 'center'; weight?: number; color?: string; grad?: number; dur?: number; out?: number },
) {
  const weight = o.weight ?? 400;
  const sp = measure(c, ' ', o.size, weight);
  const widths = o.words.map((w) => measure(c, w.text, o.size, weight));
  const total = widths.reduce((s, w) => s + w, 0) + sp * Math.max(0, o.words.length - 1);
  let x = o.align === 'center' ? o.x - total / 2 : o.x;
  const fadeOut = clamp((o.t - (o.out ?? Infinity)) / 0.35);
  if (fadeOut >= 1) return;
  const gx0 = x, gx1 = x + total;
  let grad: CanvasGradient | null = null;
  if (o.grad != null) {
    const k = clamp(o.grad);
    grad = c.createLinearGradient(gx0, 0, gx1, 0);
    const base = o.color ?? '#ffffff';
    grad.addColorStop(0, base);
    grad.addColorStop(clamp(0.8 - 0.45 * k), base);
    grad.addColorStop(clamp(0.92 - 0.4 * k), '#f9c9a4');
    grad.addColorStop(1, '#f58a4b');
  }
  o.words.forEach((w, i) => {
    const u = clamp((o.t - w.at) / (o.dur ?? 0.38));
    c.save();
    c.globalAlpha *= 1 - fadeOut;
    blurText(c, w.text, x, o.y, { size: o.size, weight, u, color: w.color ?? grad ?? o.color ?? PROMO.ink });
    c.restore();
    x += widths[i] + sp;
  });
}

/** text typed at cps from `at`, caret blinking (0.53 s) when idle; align 'right' slides the line left as it grows */
export function typed(
  c: CanvasRenderingContext2D,
  o: { text: string; t: number; at: number; cps?: number; x: number; y: number; size: number; color?: string; caret?: boolean; weight?: number; align?: 'left' | 'right' | 'center' },
) {
  const cps = o.cps ?? 14;
  const n = Math.max(0, Math.min(o.text.length, Math.floor((o.t - o.at) * cps)));
  const shown = o.text.slice(0, n);
  c.save();
  c.font = font(o.weight ?? 400, o.size);
  tracked(c, o.size);
  c.fillStyle = o.color ?? PROMO.ink;
  c.textBaseline = 'alphabetic';
  const w = c.measureText(shown).width;
  const x0 = o.align === 'right' ? o.x - w : o.align === 'center' ? o.x - c.measureText(o.text).width / 2 : o.x;
  c.fillText(shown, x0, o.y);
  if (o.caret !== false && o.t >= o.at - 0.6) {
    const typing = n > 0 && n < o.text.length;
    const blink = typing || Math.floor((o.t - o.at + 10) / 0.53) % 2 === 0;
    if (blink) c.fillRect(x0 + w + o.size * 0.06, o.y - o.size * 0.82, Math.max(2, o.size * 0.045), o.size * 1.0);
  }
  c.restore();
  return { n, width: w };
}

export type StepIcon = 'sparkle' | 'map' | 'play' | 'bug' | 'clock' | 'branch' | 'check' | 'film' | 'server' | 'rewind';
export interface StepItem {
  icon: StepIcon;
  label: string;
  detail?: string;
  at: number;
  color?: string;
  /** time a ✓ appears after it */
  done?: number;
}

export function icon(c: CanvasRenderingContext2D, kind: StepIcon, x: number, y: number, s: number, color: string, bg = true) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = Math.max(1.4, s * 0.075);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const r = s / 2;
  if (bg) {
    c.beginPath();
    c.roundRect(-r, -r, s, s, s * 0.24);
    c.globalAlpha = 0.14;
    c.fill();
    c.globalAlpha = 1;
  }
  c.beginPath();
  const k = s * 0.28;
  switch (kind) {
    case 'sparkle':
      c.moveTo(0, -k * 1.2);
      c.quadraticCurveTo(0, 0, k * 1.2, 0);
      c.quadraticCurveTo(0, 0, 0, k * 1.2);
      c.quadraticCurveTo(0, 0, -k * 1.2, 0);
      c.quadraticCurveTo(0, 0, 0, -k * 1.2);
      c.fill();
      break;
    case 'map':
      c.moveTo(-k, -k * 0.7); c.lineTo(-k * 0.3, -k); c.lineTo(k * 0.3, -k * 0.7); c.lineTo(k, -k);
      c.lineTo(k, k * 0.7); c.lineTo(k * 0.3, k); c.lineTo(-k * 0.3, k * 0.7); c.lineTo(-k, k); c.closePath();
      c.moveTo(-k * 0.3, -k); c.lineTo(-k * 0.3, k * 0.7); c.moveTo(k * 0.3, -k * 0.7); c.lineTo(k * 0.3, k);
      c.stroke();
      break;
    case 'play':
      c.moveTo(-k * 0.6, -k); c.lineTo(k, 0); c.lineTo(-k * 0.6, k); c.closePath();
      c.fill();
      break;
    case 'rewind':
      c.moveTo(0, -k * 0.8); c.lineTo(-k * 1.1, 0); c.lineTo(0, k * 0.8); c.closePath();
      c.moveTo(k * 1.1, -k * 0.8); c.lineTo(0, 0); c.lineTo(k * 1.1, k * 0.8); c.closePath();
      c.fill();
      break;
    case 'bug':
      c.ellipse(0, k * 0.15, k * 0.6, k * 0.85, 0, 0, Math.PI * 2);
      c.moveTo(-k, -k * 0.2); c.lineTo(-k * 0.6, 0); c.moveTo(k, -k * 0.2); c.lineTo(k * 0.6, 0);
      c.moveTo(-k, k * 0.7); c.lineTo(-k * 0.6, k * 0.5); c.moveTo(k, k * 0.7); c.lineTo(k * 0.6, k * 0.5);
      c.moveTo(-k * 0.3, -k * 0.75); c.lineTo(-k * 0.55, -k * 1.1); c.moveTo(k * 0.3, -k * 0.75); c.lineTo(k * 0.55, -k * 1.1);
      c.stroke();
      break;
    case 'clock':
      c.arc(0, 0, k * 1.05, 0, Math.PI * 2);
      c.moveTo(0, 0); c.lineTo(0, -k * 0.65); c.moveTo(0, 0); c.lineTo(k * 0.5, k * 0.25);
      c.stroke();
      break;
    case 'branch':
      c.moveTo(-k * 0.5 + k * 0.28, -k * 0.75); c.arc(-k * 0.5, -k * 0.75, k * 0.28, 0, Math.PI * 2);
      c.moveTo(-k * 0.5 + k * 0.28, k * 0.75); c.arc(-k * 0.5, k * 0.75, k * 0.28, 0, Math.PI * 2);
      c.moveTo(k * 0.6 + k * 0.28, -k * 0.3); c.arc(k * 0.6, -k * 0.3, k * 0.28, 0, Math.PI * 2);
      c.moveTo(-k * 0.5, -k * 0.47); c.lineTo(-k * 0.5, k * 0.47);
      c.moveTo(k * 0.6, -k * 0.02); c.quadraticCurveTo(k * 0.6, k * 0.4, -k * 0.3, k * 0.55);
      c.stroke();
      break;
    case 'check':
      c.moveTo(-k * 0.8, 0); c.lineTo(-k * 0.2, k * 0.6); c.lineTo(k * 0.9, -k * 0.6);
      c.stroke();
      break;
    case 'film':
      c.rect(-k, -k * 0.75, k * 2, k * 1.5);
      c.moveTo(-k * 0.35, -k * 0.75); c.lineTo(-k * 0.35, k * 0.75); c.moveTo(k * 0.35, -k * 0.75); c.lineTo(k * 0.35, k * 0.75);
      c.stroke();
      break;
    case 'server':
      c.rect(-k, -k * 0.9, k * 2, k * 0.8); c.rect(-k, k * 0.1, k * 2, k * 0.8);
      c.stroke();
      break;
  }
  c.restore();
}

/** the resolving step list: title, a rule growing down, items at their `at`, grey detail, ✓ at `done`, shimmering "Working" */
export function steps(
  c: CanvasRenderingContext2D,
  o: { title: string; items: StepItem[]; t: number; x: number; y: number; size?: number; working?: string; titleAt?: number; out?: number },
) {
  const s = o.size ?? 22;
  const lh = s * 2.6;
  const ta = o.titleAt ?? (o.items[0]?.at ?? 0) - 0.4;
  const fade = 1 - clamp((o.t - (o.out ?? Infinity)) / 0.4);
  if (fade <= 0) return;
  c.save();
  c.globalAlpha *= fade;
  blurText(c, o.title, o.x, o.y, { size: s * 1.45, weight: 400, u: clamp((o.t - ta) / 0.4) });
  const shown = o.items.filter((it) => o.t >= it.at).length;
  const ruleH = shown ? easeOut(clamp((o.t - o.items[0].at) / 0.6)) * (shown * lh + s * 0.4) : 0;
  c.fillStyle = PROMO.faint;
  c.fillRect(o.x + s * 0.9, o.y + s * 0.9, 1.2, ruleH);
  o.items.forEach((it, i) => {
    const u = clamp((o.t - it.at) / 0.35);
    if (u <= 0) return;
    const y = o.y + s * 1.6 + (i + 0.6) * lh;
    const ix = o.x + s * 2.4;
    c.save();
    c.globalAlpha *= easeOut(u);
    icon(c, it.icon, ix, y - s * 0.34, s * 1.15, it.color ?? PROMO.brand);
    c.restore();
    blurText(c, it.label, ix + s * 1.05, y, { size: s, weight: 500, u });
    const lw = measure(c, it.label + '  ', s, 500);
    if (it.detail) blurText(c, `– ${it.detail}`, ix + s * 1.05 + lw, y, { size: s, weight: 400, u: clamp(u * 1.4 - 0.2), color: PROMO.mute });
    if (it.done != null && o.t >= it.done) {
      const du = clamp((o.t - it.done) / 0.3);
      const dw = lw + (it.detail ? measure(c, `– ${it.detail}`, s) : 0);
      c.save();
      c.globalAlpha *= easeOut(du);
      icon(c, 'check', ix + s * 1.05 + dw + s * 0.9, y - s * 0.34, s * 0.95, PROMO.green, false);
      c.restore();
    }
  });
  if (o.working) {
    const y = o.y + s * 1.6 + (o.items.length + 0.9) * lh;
    c.save();
    c.font = font(400, s);
    tracked(c, s);
    const w = c.measureText(o.working).width;
    const p = ((o.t * 0.8) % 1.4) - 0.2;
    const g = c.createLinearGradient(o.x, 0, o.x + w, 0);
    g.addColorStop(0, PROMO.mute);
    g.addColorStop(clamp(p - 0.15), PROMO.mute);
    g.addColorStop(clamp(p), PROMO.ink);
    g.addColorStop(clamp(p + 0.15), PROMO.mute);
    g.addColorStop(1, PROMO.mute);
    c.fillStyle = g;
    c.globalAlpha *= clamp((o.t - ta) / 0.5);
    c.fillText(o.working, o.x, y);
    c.restore();
  }
  c.restore();
}

export function pill(c: CanvasRenderingContext2D, o: { x: number; y: number; text: string; color?: string; bg?: string; u?: number; size?: number; align?: 'left' | 'center' }) {
  const u = clamp(o.u ?? 1);
  if (u <= 0) return;
  const s = o.size ?? 13;
  const w = measure(c, o.text, s, 600, true) + s * 1.6;
  const h = s * 2;
  const x = o.align === 'center' ? o.x - w / 2 : o.x;
  const e = easeOut(u);
  c.save();
  c.globalAlpha *= e;
  c.translate(x + w / 2, o.y);
  c.scale(0.9 + 0.1 * e, 0.9 + 0.1 * e);
  c.fillStyle = o.bg ?? hexA(o.color ?? PROMO.brand, 0.12);
  c.beginPath();
  c.roundRect(-w / 2, -h / 2, w, h, h / 2);
  c.fill();
  c.fillStyle = o.color ?? PROMO.brand;
  c.font = font(600, s, true);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(o.text, 0, 1);
  c.restore();
}

/** the Replay mark (three play-triangles, as in the product's logo) drawn at (x, y), height h */
export function replayMark(c: CanvasRenderingContext2D, x: number, y: number, h: number, color: string = PROMO.brand) {
  const s = h / 2;
  const tri = (cx: number, cy: number) => {
    c.beginPath();
    c.moveTo(cx - s * 0.42, cy - s * 0.5);
    c.lineTo(cx + s * 0.48, cy);
    c.lineTo(cx - s * 0.42, cy + s * 0.5);
    c.closePath();
    c.fill();
  };
  c.save();
  c.fillStyle = color;
  tri(x - s * 0.25, y - s * 0.5);
  tri(x - s * 0.25, y + s * 0.5);
  tri(x + s * 0.62, y);
  c.restore();
}
