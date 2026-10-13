/**
 * neural-net-history — ch11 group (s01, s03, s05): the X-ray box restyled as a BACKLIT VELLUM LIGHTBOX for the
 * round-1 global X-ray note ("it still reads as a saturated cyan UI cabinet"), without touching the shared
 * xrayColumn.ts. Draw it inside an L4 painter in place of xrayColumn:
 *
 *   vellumBox(c, env, { x, y, s, state, light, reveal, own?: { band, u, glow, glyph } })
 *
 *   - draws xrayColumn (the cut-card cabinet), then
 *   - own: re-draws one band as the shot's hero (its lamp at `glow` × 1.6 the lit bands, the shot's own glyph
 *     painted by glyph(c, rect, u) in box-local px), then
 *   - the vellum pass over the whole sheet: chroma pulled to ≈40 %, warmed toward paper, a paper grain and
 *     fibre, then a heavier black cut-card frame with notched corners (so the box reads as paper, not glass).
 *   vellumHalo(c, o, L) a soft, low-chroma additive spill around the box (use instead of a saturated halo).
 *   bandRect(i) the band's rectangle in box-local px (origin bottom centre, y up negative).
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { hcl } from 'd3';
import { XRAY, xrayColumn, xrayEmphasis, type XrayDraw } from './xrayColumn';

type C = CanvasRenderingContext2D;
export type BandRect = { x: number; y: number; w: number; h: number };

export function bandRect(i: number): BandRect {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
  return { x: -XRAY.w / 2 + 18, y: y1 - XRAY.band + 6, w: XRAY.w - 36, h: XRAY.band - 8 };
}

export const VELLUM = {
  lit: hcl(190, 22, 86).formatHex(),
  mid: hcl(194, 22, 52).formatHex(),
  hot: hcl(178, 20, 95).formatHex(),
  dim: hcl(196, 10, 42).formatHex(),
  black: '#0d0f0e',
} as const;

let grainCv: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement | null {
  if (grainCv || typeof document === 'undefined') return grainCv;
  const N = 128;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = 150 + (hash1(x * 31 + y * 977, 511) - 0.5) * 80 + (hash1(Math.floor(x / 4) + Math.floor(y / 2) * 61, 512) - 0.5) * 50;
      const k = (x + y * N) * 4;
      img.data[k] = v + 14;
      img.data[k + 1] = v + 6;
      img.data[k + 2] = v - 6;
      img.data[k + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(70,58,44,0.55)';
  g.lineWidth = 0.7;
  for (let i = 0; i < 30; i++) {
    const x0 = (hash1(i, 513) * 0.5 + 0.5) * N, y0 = (hash1(i, 514) * 0.5 + 0.5) * N;
    const a = hash1(i, 515) * Math.PI, L = 8 + 14 * (hash1(i, 516) * 0.5 + 0.5);
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(x0 + Math.cos(a) * L * 0.5 + 3, y0 + Math.sin(a) * L * 0.5, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L);
    g.stroke();
  }
  grainCv = cv;
  return cv;
}

export interface OwnBand {
  band: number;
  /** the glyph's progress 0..1 (passed to glyph) */
  u: number;
  /** the band's lamp 0..1 (1 = 1.6 × a lit band) */
  glow: number;
  glyph: (c: C, r: BandRect, u: number) => void;
}

export interface VellumBoxOpts extends XrayDraw {
  own?: OwnBand;
  /** the vellum pass strength 0..1 (default 1) */
  vellum?: number;
}

export function vellumBox(c: C, env: PaintEnv, o: VellumBoxOpts) {
  const s = o.s ?? 1;
  const L = o.light ?? 1;
  const W = XRAY.w, H = XRAY.h;
  // the shared cabinet; the hero band is kept dark in it (it is re-drawn below as the shot's own)
  const state = o.own ? { ...o.state, lit: o.state.lit.map((v, i) => (i + 1 === o.own!.band ? false : v)) } : o.state;
  const reveal = o.own && o.reveal?.band === o.own.band ? undefined : o.reveal;
  xrayColumn(c, { ...o, state, reveal, paper: false }, env);
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  if (o.own && o.own.glow > 0) {
    const r = bandRect(o.own.band);
    const g = o.own.glow * L;
    c.save();
    c.beginPath();
    c.rect(r.x - 4, r.y - 2, r.w + 8, r.h + 4);
    c.clip();
    // its ground: vellum lit from behind but a step darker than the lit bands, so the glyph's light reads on it
    c.fillStyle = withAlpha(VELLUM.mid, 0.95 * g);
    c.fillRect(r.x - 4, r.y - 2, r.w + 8, r.h + 4);
    o.own.glyph(c, r, o.own.u);
    c.restore();
    // the bloom: the band's lamp is ≈ 1.6 × the lit bands, spilling past its strips
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const hot = c.createRadialGradient(cx, cy, 4, cx, cy, r.w * 0.7);
    hot.addColorStop(0, withAlpha(VELLUM.hot, 0.32 * g));
    hot.addColorStop(0.5, withAlpha(VELLUM.hot, 0.14 * g));
    hot.addColorStop(1, withAlpha(VELLUM.hot, 0));
    c.fillStyle = hot;
    c.fillRect(cx - r.w * 0.7, cy - r.w * 0.7, r.w * 1.4, r.w * 1.4);
    c.restore();
  }
  // ---- the vellum pass over the sheet (inside the frame window)
  const k = o.vellum ?? 1;
  c.save();
  c.beginPath();
  c.rect(-W / 2, -H, W, H);
  c.clip();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = `rgba(128,128,128,${0.42 * k})`;
  c.fillRect(-W / 2, -H, W, H);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha(mixLab(MOODS.candleAmber.rim, '#ffffff', 0.6), 0.18 * k);
  c.fillRect(-W / 2, -H, W, H);
  const gc = grain();
  const pat = gc ? c.createPattern(gc, 'repeat') : null;
  if (pat) {
    c.globalAlpha = 0.3 * k;
    c.fillStyle = pat;
    c.fillRect(-W / 2, -H, W, H);
  }
  // review round 2 (art): a soft inner vignette, and the face dimmed to 60 % except while a band lights
  {
    const vg = c.createRadialGradient(0, -H / 2, Math.min(W, H) * 0.22, 0, -H / 2, Math.hypot(W / 2, H / 2));
    vg.addColorStop(0, 'rgba(10,12,11,0)');
    vg.addColorStop(0.6, 'rgba(10,12,11,0.14)');
    vg.addColorStop(1, 'rgba(10,12,11,0.5)');
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = vg;
    c.fillRect(-W / 2, -H, W, H);
    const lit = o.own ? Math.max(xrayEmphasis(o), 0.6 + 0.4 * Math.max(0, Math.min(1, o.own.glow)) * Math.sin(Math.PI * Math.max(0, Math.min(1, o.own.u))) ** 0.6) : xrayEmphasis(o);
    if (lit < 0.999) {
      const v = Math.round(255 * lit);
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(-W / 2, -H, W, H);
    }
  }
  c.restore();
  // ---- the heavier cut-card frame: a black mat with notched corners and an inner bevel of lamp light
  const F = 20, n = 9;
  const x0 = -W / 2 - F, y0 = -H - F, x1 = W / 2 + F, y1 = F;
  const p = new Path2D();
  p.moveTo(x0 + n, y0);
  p.lineTo(x1 - n, y0);
  p.lineTo(x1, y0 + n);
  p.lineTo(x1, y1 - n);
  p.lineTo(x1 - n, y1);
  p.lineTo(x0 + n, y1);
  p.lineTo(x0, y1 - n);
  p.lineTo(x0, y0 + n);
  p.closePath();
  p.rect(-W / 2 + 4, -H + 4, W - 8, H - 8);
  c.fillStyle = VELLUM.black;
  c.fill(p, 'evenodd');
  c.strokeStyle = withAlpha(mixLab(VELLUM.lit, MOODS.candleAmber.rim, 0.5), 0.3 * L);
  c.lineWidth = 1;
  c.strokeRect(-W / 2 + 4.5, -H + 4.5, W - 9, H - 9);
  c.restore();
}

/** a soft low-chroma spill of the box's lamp on the room around it (additive) */
export function vellumHalo(c: C, o: { x: number; y: number; s?: number }, L: number, R = 300) {
  const s = o.s ?? 1;
  const cx = o.x, cy = o.y - (XRAY.h / 2) * s;
  const col = mixLab(VELLUM.lit, MOODS.candleAmber.halo, 0.25);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, 20, cx, cy, R);
  g.addColorStop(0, withAlpha(col, 0.12 * L));
  g.addColorStop(0.5, withAlpha(col, 0.04 * L));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  c.restore();
}
