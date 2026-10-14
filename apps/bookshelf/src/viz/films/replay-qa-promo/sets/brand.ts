/**
 * replay-qa-promo shared canvas pieces (pure functions of t; stage px, 1280 x 720). Gallery: film-gallery.html?g=replay-qa-promo
 *
 *   driftLines(c, t, o)        the reference's hairline rules, drifting slowly at different speeds (haze + paper shots)
 *   replayLockup(c, o)         the Replay mark + 'Replay QA' (ch01-s03 lock-up, ch06-s02 end card); returns its box
 *   recordingChip(c, o)        the small dark '▶ recording' chip: ONE object from ch04-s03's stack through ch05's ribbon,
 *                              the agent pair, ch06's collage and the end card (same size, colours and type everywhere)
 *   braceBox(c, o)             '{ … }' brace glyphs + corner dots around any measured box (a pill row, a badge, a tile)
 *   sweep(c, x0, x1, k, base)  the white → peach → orange tail sweep as a gradient (the same stops as kit kinetic)
 *   underline(c, o)            the hand-drawn red-pink underline that lands under a number ('67ms', '−1', 'PR #3')
 *   tag(c, o)                  a small grey caption tag ('illustration', 'Insights'), Promo Sans 15 px
 */
import { FILM_W } from '../../../film/contracts';
import { PROMO, blurText, easeOut, font, hexA, measure, replayMark, smooth, squareDots } from '../../../film/promo';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** n full-width hairlines, each drifting vertically at its own slow speed and wrapping; deterministic in t */
export function driftLines(
  c: CanvasRenderingContext2D,
  t: number,
  o: { n?: number; alpha?: number; color?: string; speed?: number; seed?: number; y0?: number; y1?: number } = {},
) {
  const n = o.n ?? 5;
  const y0 = o.y0 ?? 40, y1 = o.y1 ?? 690;
  const span = y1 - y0;
  const sp = o.speed ?? 1;
  const seed = o.seed ?? 1;
  c.save();
  c.lineWidth = 0.8;
  for (let i = 0; i < n; i++) {
    const r = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453;
    const f = r - Math.floor(r);
    const v = (4 + 7 * f) * sp * (i % 2 ? 1 : -1); // px per second, alternate directions
    const base = y0 + ((i + 0.5) / n) * span + (f - 0.5) * 30;
    let y = base + v * t;
    y = y0 + ((((y - y0) % span) + span) % span);
    const a = (o.alpha ?? 0.5) * (0.55 + 0.45 * f) * smooth(Math.min(y - y0, y1 - y) / 40);
    c.strokeStyle = o.color ? hexA(o.color, a) : `rgba(255,255,255,${a.toFixed(3)})`;
    c.beginPath();
    c.moveTo(0, Math.round(y) + 0.5);
    c.lineTo(FILM_W, Math.round(y) + 0.5);
    c.stroke();
  }
  c.restore();
}

/** the Replay mark + 'Replay QA', centred on x (or left-aligned), mark height markH, word size `size` */
export function replayLockup(
  c: CanvasRenderingContext2D,
  o: { x: number; y: number; u?: number; markH?: number; size?: number; weight?: number; color?: string; markColor?: string; align?: 'center' | 'left'; text?: string; rise?: number },
) {
  const u = clamp(o.u ?? 1);
  const markH = o.markH ?? 56;
  const size = o.size ?? 44;
  const weight = o.weight ?? 400;
  const text = o.text ?? 'Replay QA';
  const gap = markH * 0.42;
  const markW = markH * 0.78;
  const tw = measure(c, text, size, weight);
  const w = markW + gap + tw;
  const x0 = o.align === 'left' ? o.x : o.x - w / 2;
  const e = easeOut(u);
  const dy = (1 - e) * (o.rise ?? 8);
  if (u > 0) {
    c.save();
    c.globalAlpha *= e;
    const blur = (1 - e) * 6;
    if (blur > 0.3) c.filter = `blur(${blur.toFixed(2)}px)`;
    replayMark(c, x0 + markW * 0.5, o.y + dy, markH, o.markColor ?? PROMO.brand);
    c.restore();
    // the word sits on the mark's optical centre line
    blurText(c, text, x0 + markW + gap, o.y + size * 0.36 + dy, { size, weight, u, color: o.color ?? PROMO.ink, rise: 0 });
  }
  return { x0, x1: x0 + w, y0: o.y - markH / 2, y1: o.y + markH / 2, w };
}

export const CHIP = { h: 26, size: 12, label: '▶ recording' } as const;

/** the dark '▶ recording' chip, centred on (x, y); tint 0..1 → Replay red-pink; check 0..1 → a green ✓ dot on its right */
export function recordingChip(
  c: CanvasRenderingContext2D,
  o: { x: number; y: number; u?: number; scale?: number; tint?: number; check?: number; label?: string; blur?: number; /** on a dark haze: a faint light ring so the chip reads */ dark?: boolean },
) {
  const u = clamp(o.u ?? 1);
  if (u <= 0) return { w: 0, h: 0 };
  const k = o.scale ?? 1;
  const label = o.label ?? CHIP.label;
  const w = (measure(c, label, CHIP.size, 600, true) + 22) * k;
  const h = CHIP.h * k;
  const e = easeOut(u);
  c.save();
  c.globalAlpha *= e;
  if ((o.blur ?? 0) > 0.3) c.filter = `blur(${o.blur!.toFixed(2)}px)`;
  c.shadowColor = 'rgba(20,10,30,.22)';
  c.shadowBlur = 10 * k;
  c.shadowOffsetY = 3 * k;
  const tint = clamp(o.tint ?? 0);
  c.fillStyle = tint > 0 ? mix(PROMO.ink, PROMO.brand, tint) : PROMO.ink;
  c.beginPath();
  c.roundRect(o.x - w / 2, o.y - h / 2, w, h, h / 2);
  c.fill();
  c.shadowColor = 'transparent';
  if (o.dark) {
    c.strokeStyle = 'rgba(255,255,255,.28)';
    c.lineWidth = 1;
    c.stroke();
  }
  c.fillStyle = '#fff';
  c.font = font(600, CHIP.size * k, true);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, o.x, o.y + 1 * k);
  const ck = clamp(o.check ?? 0);
  if (ck > 0) {
    const cx = o.x + w / 2 + 4 * k, cy = o.y - h / 2 + 2 * k, r = 8 * k * (0.6 + 0.4 * easeOut(ck));
    c.globalAlpha *= easeOut(ck);
    c.fillStyle = PROMO.green;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.8 * k;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cx - r * 0.45, cy);
    c.lineTo(cx - r * 0.1, cy + r * 0.38);
    c.lineTo(cx + r * 0.5, cy - r * 0.35);
    c.stroke();
  }
  c.restore();
  return { w, h };
}

/** '{' and '}' glyphs (kit bracket's weight-300 brace) around a box, braces parting from the centre as u goes 0 → 1 */
export function braceBox(
  c: CanvasRenderingContext2D,
  o: { x0: number; x1: number; y: number; size: number; u: number; out?: number; color?: string; dots?: boolean; pad?: number },
) {
  const u = clamp(o.u);
  const out = clamp(o.out ?? 0);
  if (u <= 0 || out >= 1) return;
  const cx = (o.x0 + o.x1) / 2;
  const pad = o.pad ?? o.size * 0.25;
  const half = ((o.x1 - o.x0) / 2 + pad) * easeOut(clamp(u * 1.4)) + o.size * 0.1;
  const base = o.y + o.size * 0.34; // glyph baseline that centres the brace on y
  c.save();
  c.globalAlpha *= 1 - out;
  if (out > 0) c.filter = `blur(${(out * o.size * 0.2).toFixed(2)}px)`;
  blurText(c, '{', cx - half, base, { size: o.size, weight: 300, u: clamp(u * 3), color: o.color, align: 'right', rise: 0 });
  blurText(c, '}', cx + half, base, { size: o.size, weight: 300, u: clamp(u * 3), color: o.color, align: 'left', rise: 0 });
  if (o.dots !== false) {
    const dx = half + o.size * 0.5, dy = o.size * 0.75;
    squareDots(
      c,
      [
        { x: cx - dx, y: o.y - dy },
        { x: cx + dx, y: o.y - dy },
        { x: cx - dx, y: o.y + dy },
        { x: cx + dx, y: o.y + dy },
      ],
      { size: Math.max(4, o.size * 0.13), color: o.color, u: clamp((u - 0.3) * 3) },
    );
  }
  c.restore();
}

/** the tail colour sweep (k 0 → 1) as a horizontal gradient from x0 to x1; same stops as kit kinetic's grad */
export function sweep(c: CanvasRenderingContext2D, x0: number, x1: number, k: number, base = '#ffffff') {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  const q = clamp(k);
  g.addColorStop(0, base);
  g.addColorStop(clamp(0.8 - 0.45 * q), base);
  g.addColorStop(clamp(0.92 - 0.4 * q), '#f9c9a4');
  g.addColorStop(1, '#f58a4b');
  return g;
}

/** a hand-drawn red-pink underline from x0 to x1 at y, drawn left → right over u (slight wobble, round caps) */
export function underline(c: CanvasRenderingContext2D, o: { x0: number; x1: number; y: number; u: number; color?: string; width?: number; out?: number }) {
  const u = easeOut(clamp(o.u));
  if (u <= 0) return;
  const a = 1 - clamp(o.out ?? 0);
  const x1 = o.x0 + (o.x1 - o.x0) * u;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = o.color ?? PROMO.brand;
  c.lineWidth = o.width ?? 3;
  c.lineCap = 'round';
  c.beginPath();
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const x = o.x0 + ((x1 - o.x0) * i) / steps;
    const y = o.y + Math.sin(i * 0.9) * 0.8 + (i / steps) * -1.2;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}

/** a small grey caption tag ('illustration', 'Insights'): Promo Sans 15 px on a pale plate */
export function tag(c: CanvasRenderingContext2D, o: { x: number; y: number; text: string; u?: number; dark?: boolean; size?: number; align?: 'left' | 'center' }) {
  const u = clamp(o.u ?? 1);
  if (u <= 0) return;
  const s = o.size ?? 15;
  const w = measure(c, o.text, s, 500) + s * 1.2;
  const h = s * 1.7;
  const x = o.align === 'center' ? o.x - w / 2 : o.x;
  c.save();
  c.globalAlpha *= easeOut(u);
  c.fillStyle = o.dark ? 'rgba(255,255,255,.10)' : 'rgba(20,18,22,.06)';
  c.beginPath();
  c.roundRect(x, o.y - h / 2, w, h, 6);
  c.fill();
  c.restore();
  blurText(c, o.text, x + s * 0.6, o.y + s * 0.36, { size: s, weight: 500, u, color: o.dark ? 'rgba(255,255,255,.72)' : PROMO.mute, rise: 0 });
}

function mix(a: string, b: string, k: number) {
  const p = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}
