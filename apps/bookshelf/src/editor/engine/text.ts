/**
 * Text generator: a TextSpec painted in the 1280×720 stage space, fitted (contain, centred) into any output.
 *
 *   const spec = resolveText(media.text, event.text)       // the event's overrides over its media's spec
 *   paintText(ctx, spec, srcT, alpha)                      // ctx: device px, any size; srcT drives type-on
 *   textFont(spec)                                         // the CSS font string (preload it before an exact render)
 *   DEFAULT_TEXT                                           // a lower-third title in the film's display face
 *
 * Layout: `content` splits on newlines; (x, y) anchors the block's VERTICAL CENTRE, horizontally per `align`
 * (left edge, centre, right edge); line height 1.22 × size. Paint order: plate, shadow + outline, fill.
 * Type-on reveals `typeOn` characters per second of source time (spaces count), so slipping the event slips it.
 * Family names without quotes or commas are quoted and given a serif fallback.
 */
import { FILM_H, FILM_W } from '../../viz/film/contracts';
import type { TextSpec } from '../model/types';

export const DEFAULT_TEXT: TextSpec = {
  content: 'Title',
  font: '"Cormorant Garamond"',
  size: 56,
  color: '#f3e9d2',
  align: 'center',
  x: FILM_W / 2,
  y: FILM_H * 0.8,
  weight: 600,
  shadow: { color: 'rgba(0,0,0,0.55)', blur: 8, dx: 0, dy: 2 },
};

/** media spec + event overrides (undefined override fields keep the media's) */
export function resolveText(base: TextSpec, over?: Partial<TextSpec>): TextSpec {
  if (!over) return base;
  const out: TextSpec = { ...base };
  for (const k of Object.keys(over) as (keyof TextSpec)[]) {
    const v = over[k];
    if (v !== undefined) (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}

function family(f: string): string {
  const s = f.trim();
  if (!s) return 'Georgia, serif';
  if (s.includes(',') || s.startsWith('"') || s.startsWith("'")) return s;
  return /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(s) ? s : `"${s}", Georgia, serif`;
}

/** the CSS font string for a spec at its stage size */
export function textFont(spec: TextSpec, sizePx = spec.size): string {
  return `${spec.italic ? 'italic ' : ''}${spec.weight ?? 400} ${Math.max(1, sizePx)}px ${family(spec.font)}`;
}

/** stage → device mapping for a W×H output: uniform scale + letterbox offset */
export function stageFit(W: number, H: number): { s: number; ox: number; oy: number } {
  const s = Math.min(W / FILM_W, H / FILM_H);
  return { s, ox: (W - FILM_W * s) / 2, oy: (H - FILM_H * s) / 2 };
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

/** paint `spec` into `c` (device px; any transform is replaced) at source time `srcT`, at opacity `alpha` */
export function paintText(c: CanvasRenderingContext2D, spec: TextSpec, srcT: number, alpha = 1): void {
  if (alpha <= 0 || !spec.content) return;
  let content = spec.content;
  if (spec.typeOn && spec.typeOn > 0) {
    const n = Math.floor(Math.max(0, srcT) * spec.typeOn + 1e-6);
    if (n <= 0) return;
    content = content.slice(0, n);
  }
  const lines = content.split('\n');
  const { s, ox, oy } = stageFit(c.canvas.width, c.canvas.height);
  c.save();
  c.setTransform(s, 0, 0, s, ox, oy);
  c.globalAlpha = Math.min(1, alpha);
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.font = textFont(spec);
  c.textAlign = spec.align;
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  const lh = spec.size * 1.22;
  const y0 = spec.y - ((lines.length - 1) * lh) / 2;

  if (spec.plate) {
    // plate sized to the FULL text so it does not grow while typing on
    const full = spec.content.split('\n');
    let w = 0;
    for (const l of full) w = Math.max(w, c.measureText(l).width);
    const p = spec.plate.padding;
    const bh = full.length * lh;
    const left = spec.align === 'left' ? spec.x : spec.align === 'right' ? spec.x - w : spec.x - w / 2;
    const top = spec.y - ((full.length - 1) * lh) / 2 - lh / 2;
    c.fillStyle = spec.plate.color;
    roundRect(c, left - p, top - p, w + 2 * p, bh + 2 * p, spec.plate.radius);
    c.fill();
  }

  const sh = spec.shadow;
  const setShadow = (on: boolean) => {
    if (on && sh) {
      // shadow geometry is in device px: scale the stage-px values
      c.shadowColor = sh.color;
      c.shadowBlur = sh.blur * s;
      c.shadowOffsetX = sh.dx * s;
      c.shadowOffsetY = sh.dy * s;
    } else {
      c.shadowColor = 'rgba(0,0,0,0)';
      c.shadowBlur = 0;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
    }
  };
  lines.forEach((line, i) => {
    const y = y0 + i * lh;
    if (spec.outline && spec.outline.width > 0) {
      setShadow(true);
      c.strokeStyle = spec.outline.color;
      c.lineWidth = spec.outline.width * 2; // half the stroke sits under the fill
      c.strokeText(line, spec.x, y);
      setShadow(false);
    } else setShadow(true);
    c.fillStyle = spec.color;
    c.fillText(line, spec.x, y);
    setShadow(false);
  });
  c.restore();
}
