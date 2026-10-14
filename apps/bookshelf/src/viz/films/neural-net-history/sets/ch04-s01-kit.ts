/**
 * ch04 (The Cold Case) — small shared helpers for ch04-s01 … ch04-s05 (one animator's group).
 *
 *   clamp01, sm (smoothstep), win(t, a, b) (0→1 smooth window), lerp, tq12 (twos), mixCam (log dolly)
 *   dateStamp(c, mood, t, at, until, text)        struck Special Elite date, bottom-left, on a soft ink plate
 *   typedCard(c, o, env)                          a cream paper card / slip with typed lines (Special Elite),
 *                                                 optional thread above it (hanging cards) — the film's paper stock
 *   snowfall(c, o, mood)                          seeded falling snow whose density RAMPS smoothly (flakes fade in)
 *   cardPaper(mood)                               the lamp-lit card stock colour for a mood
 *
 * Everything is a pure function of its inputs (no clocks, no randomness): seeded hash1 only.
 */
import type { Camera3, Palette } from '../../../film/contracts';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { softSprite } from '../../../film/silhouette/atmosphere';
import { FONT, softPlate, textColor } from '../../../film/silhouette/type';

export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
export const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
/** smooth 0→1 between a and b */
export const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

/** dolly through the action-plane scale (log), so a push feels even */
export function mixCam(a: Camera3, b: Camera3, u: number): Camera3 {
  const sa = 1000 / (1000 - a.z);
  const sb = 1000 / (1000 - b.z);
  const s = Math.exp(lerp(Math.log(sa), Math.log(sb), u));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - 1000 / s, lens: lerp(a.lens, b.lens, u) };
}

/** struck typewriter date (Special Elite), bottom-left on a feathered ink plate; types on at 14 cps on twos */
export function dateStamp(c: CanvasRenderingContext2D, m: Palette, t: number, at: number, until: number, text: string, o: { x?: number; y?: number; size?: number } = {}) {
  const A = clamp01((t - at) / 0.15) * (1 - clamp01((t - (until - 0.5)) / 0.5));
  if (A <= 0) return;
  const x = o.x ?? 48;
  const y = o.y ?? 672;
  const size = o.size ?? 26;
  const tq = tq12(t);
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * 14 + 1e-6) + 1));
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const adv = c.measureText('M').width * 1.02;
  c.globalAlpha = A;
  softPlate(c, x + (adv * text.length) / 2, y - size * 0.3, adv * text.length + 170, 92, m.ink, 0.5);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < shown; i++) {
    if (text[i] === ' ') continue;
    c.globalAlpha = A * (0.8 + 0.2 * (hash1(i, 61) * 0.5 + 0.5));
    c.fillStyle = textColor(m);
    c.fillText(text[i], x + i * adv, y + hash1(i, 62) * 0.6);
  }
  c.restore();
}

/** the lamp-lit card stock (the board's cards): mid-high value, warm, low chroma */
export const cardPaper = (m: Palette) => mixLab(mixLab(m.halo, m.rim, 0.55), '#efe4cc', 0.35);

export interface TypedCardOpts {
  /** card centre */
  x: number;
  y: number;
  w: number;
  h: number;
  lines: { text: string; size?: number; italic?: boolean; font?: 'type' | 'serif' | 'sc'; alpha?: number }[];
  /** 0..1 fade */
  alpha?: number;
  /** rotation (rad) — a hanging card sways */
  rot?: number;
  /** thread from (x, y - h/2) up to this y (hanging cards) */
  threadTo?: number;
  seed?: number;
  paper?: string;
  ink?: string;
  /** line spacing multiplier */
  leading?: number;
}

/** A paper card with typed lines, cut-paper edge, a thin ink border and a faint shadow below. */
export function typedCard(c: CanvasRenderingContext2D, o: TypedCardOpts, m: Palette) {
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const seed = o.seed ?? 7;
  const paper = o.paper ?? cardPaper(m);
  const ink = o.ink ?? mixLab(m.ink, '#2a1d14', 0.4);
  c.save();
  c.globalAlpha *= A;
  if (o.threadTo !== undefined) {
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.55);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(o.x, o.threadTo);
    c.lineTo(o.x, o.y - o.h / 2);
    c.stroke();
  }
  c.translate(o.x, o.y);
  if (o.rot) {
    c.translate(0, -o.h / 2);
    c.rotate(o.rot);
    c.translate(0, o.h / 2);
  }
  const w = o.w;
  const h = o.h;
  // soft shadow (the card hangs a little in front of whatever is behind it)
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 5, -h / 2 + 7, w, h);
  // the card: a slightly irregular cut edge
  c.beginPath();
  const n = 8;
  for (let i = 0; i <= n; i++) c.lineTo(-w / 2 + (w * i) / n, -h / 2 + hash1(i, seed) * 0.6);
  for (let i = 0; i <= n; i++) c.lineTo(w / 2 + hash1(i, seed + 1) * 0.6, -h / 2 + (h * i) / n);
  for (let i = n; i >= 0; i--) c.lineTo(-w / 2 + (w * i) / n, h / 2 + hash1(i, seed + 2) * 0.6);
  for (let i = n; i >= 0; i--) c.lineTo(-w / 2 + hash1(i, seed + 3) * 0.6, -h / 2 + (h * i) / n);
  c.closePath();
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mixLab(paper, '#fff6e6', 0.12));
  g.addColorStop(1, mixLab(paper, m.set, 0.12));
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = 1;
  c.stroke();
  // a punched hole when hanging
  if (o.threadTo !== undefined) {
    c.fillStyle = withAlpha(m.fg, 0.6);
    c.beginPath();
    c.arc(0, -h / 2 + 9, 2.6, 0, Math.PI * 2);
    c.fill();
  }
  // typed lines, centred
  const lead = o.leading ?? 1.32;
  const total = o.lines.reduce((s, l) => s + (l.size ?? 22) * lead, 0);
  let y = -total / 2 + (o.threadTo !== undefined ? 6 : 0);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  o.lines.forEach((l, li) => {
    const size = l.size ?? 22;
    const fam = l.font === 'serif' ? FONT.text : l.font === 'sc' ? FONT.sc : FONT.typewriter;
    c.font = `${l.italic ? 'italic ' : ''}400 ${size}px ${fam}`;
    y += (size * lead) / 2;
    c.fillStyle = ink;
    if (l.font === 'type' || l.font === undefined) {
      // struck type: per-character ink variation
      const text = l.text;
      const tw = c.measureText(text).width;
      let x = -tw / 2;
      c.textAlign = 'left';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        c.globalAlpha = A * (l.alpha ?? 1) * (0.78 + 0.22 * (hash1(i + li * 97, seed + 11) * 0.5 + 0.5));
        c.fillText(ch, x, y + hash1(i + li * 31, seed + 12) * 0.45);
        x += c.measureText(ch).width;
      }
      c.textAlign = 'center';
    } else {
      c.globalAlpha = A * (l.alpha ?? 1);
      c.fillText(l.text, 0, y);
    }
    y += (size * lead) / 2;
  });
  c.restore();
}

const u01 = (i: number, seed: number) => (hash1(i, seed) + 1) / 2;

export interface SnowfallOpts {
  /** area in layer px (flakes wrap inside it) */
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  /** maximum flakes */
  n: number;
  /** first flakes appear at `start`; the full count is reached at start + ramp */
  start: number;
  ramp: number;
  /** flake radius range (layer px) */
  r0: number;
  r1: number;
  /** fall speed px/s, wind px/s */
  fall: number;
  wind?: number;
  seed: number;
  /** flake colour */
  color: string;
  /** sprite hardness (default 0.35); 0 = a soft, out-of-focus flake (near-lens L5 snow) */
  hardness?: number;
  /** overall alpha */
  alpha?: number;
}

/** seeded snowfall (pure in t): flake i activates at start + ramp·(i/n) and fades in over 0.6 s, so density
 *  ramps without popping; each flake drifts with a slow seeded sway */
export function snowfall(c: CanvasRenderingContext2D, o: SnowfallOpts) {
  const A = o.alpha ?? 1;
  if (A <= 0 || o.t < o.start) return;
  const spr = softSprite(o.color, o.hardness ?? 0.35);
  const wind = o.wind ?? 8;
  c.save();
  for (let i = 0; i < o.n; i++) {
    const act = o.start + o.ramp * (i / o.n);
    if (o.t < act) break;
    const fa = Math.min(1, (o.t - act) / 0.6);
    const sp = 0.7 + 0.6 * u01(i * 7 + 1, o.seed);
    const r = o.r0 + (o.r1 - o.r0) * u01(i * 7 + 2, o.seed);
    const ph = u01(i * 7 + 3, o.seed) * 6.283;
    let x = o.x + u01(i * 7 + 4, o.seed) * o.w + wind * sp * o.t + 6 * Math.sin(o.t * (0.5 + 0.4 * sp) + ph);
    let y = o.y + u01(i * 7 + 5, o.seed) * o.h + o.fall * sp * o.t;
    x = o.x + ((((x - o.x) % o.w) + o.w) % o.w);
    y = o.y + ((((y - o.y) % o.h) + o.h) % o.h);
    c.globalAlpha = A * fa * (0.55 + 0.45 * u01(i * 7 + 6, o.seed));
    c.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}
