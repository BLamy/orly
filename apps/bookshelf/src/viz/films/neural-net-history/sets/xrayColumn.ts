/**
 * neural-net-history — the X-ray chat box (staging.xrayColumn): the glowing rectangle from the prologue,
 * drawn as a translucent stratigraphic column of SEVEN bands, bottom to top:
 *   1 threshold lanterns (1943) · 2 adjustable knobs (1958) · 3 hidden layers + a backward arrow (1986)
 *   ─ a seam that never lights (the hand-cut stencils: tools that trained the detectives) ─
 *   4 furnaces + a sea of text (2012) · 5 threads (2017) · 6 type sorts (2018) · 7 shears (2022)
 * Each X-ray beat lights exactly one new band; ch12-s07 lights them all. Its glow is a serverCyan
 * PRACTICAL inside the amber study (STUDY LOCK): the only cyan in a study frame.
 *
 * LOOK (review round 1, art: "it reads as a cyan digital UI widget"): a BACKLIT VELLUM LIGHTBOX CABINET. A black
 * cut-card frame with notched corners and a plinth; behind it a sheet of vellum with paper grain and fibre,
 * teal at about 40 % saturation, lit from a lamp behind (brightest in the middle, falling off to the edges); the
 * bands are separated by cut-card strips, and each band's glyph is a black paper CUT-OUT that the light shines
 * around. An unlit band is vellum with no lamp behind it (grey-teal, the cut-out barely showing); a lit band glows
 * through. No rounded glass, no outlines in light, no sweep of light: a band lights as its lamp warms up from
 * behind, bottom to top.
 *
 *   xrayColumn(c, { x, y, s, state, light?, reveal? }, env)
 *        x, y = the box's bottom centre (layer px); s = scale (box 230 × 420 at 1)
 *        reveal: { band, u } animates one band lighting (u 0..1); translucency: how see-through (0..1)
 *   xrayGlowAt(o) → the box centre for f.practical({ kind: 'screen' })
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hcl } from 'd3';
import { hash1 } from '../../../film/core/frame';
import { cardIcon } from './caseBoard';
import type { XrayState } from './studyState';

export const XRAY = { w: 230, h: 420, band: 50, pad: 22 } as const;
const CYAN = MOODS.serverCyan;

export interface XrayDraw {
  x: number;
  y: number;
  s?: number;
  state: XrayState;
  /** overall glow 0..1 (fades up for the beat) */
  light?: number;
  /** animate one band lighting: band 1–7, u 0..1 */
  reveal?: { band: number; u: number };
  /** 0..1 how translucent the box has become (grows chapter by chapter); default from lit count */
  translucency?: number;
  /** band 7's dark shears-shaped slot glint 0..1 (ch12-s01) */
  slotGlint?: number;
}

export function xrayGlowAt(o: Pick<XrayDraw, 'x' | 'y' | 's'>) {
  const s = o.s ?? 1;
  return { x: o.x, y: o.y - (XRAY.h / 2) * s };
}

/** band i (1-based) rectangle in box-local coords (origin bottom centre, y up negative) */
function bandRect(i: number) {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
  return { x: -XRAY.w / 2 + 18, y: y1 - XRAY.band + 6, w: XRAY.w - 36, h: XRAY.band - 8 };
}

function bandGlyph(c: CanvasRenderingContext2D, i: number, r: { x: number; y: number; w: number; h: number }, env: PaintEnv, ink: string, light: string) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const icon = (k: Parameters<typeof cardIcon>[1], x: number, size: number) => cardIcon(c, k, x, cy, size, env, ink, { light, lit: 1 });
  switch (i) {
    case 1:
      // a scatter of tiny threshold lanterns (the 1943 unit), staggered in two rows
      for (let j = 0; j < 6; j++) icon('threshold-lantern', r.x + 14 + j * ((r.w - 28) / 5), 30 - (j % 2) * 4);
      break;
    case 2:
      for (let j = 0; j < 5; j++) icon('knob', r.x + 18 + j * ((r.w - 36) / 4), 32);
      break;
    case 3: {
      // a small two-layer net and a backward arrow
      const xs = [r.x + 26, cx, r.x + r.w - 26];
      const rows = [3, 4, 2];
      c.strokeStyle = withAlpha(ink, 0.6);
      c.lineWidth = 1;
      const pts = xs.map((x, li) => Array.from({ length: rows[li] }, (_, j) => ({ x, y: r.y + 8 + (j + 0.5) * ((r.h - 16) / rows[li]) })));
      for (let li = 0; li < 2; li++) for (const a of pts[li]) for (const b of pts[li + 1]) {
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
      c.fillStyle = ink;
      for (const col of pts) for (const p of col) {
        c.beginPath();
        c.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = withAlpha(light, 0.95);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(r.x + r.w - 20, r.y + r.h - 4);
      c.lineTo(r.x + 22, r.y + r.h - 4);
      c.lineTo(r.x + 30, r.y + r.h - 9);
      c.moveTo(r.x + 22, r.y + r.h - 4);
      c.lineTo(r.x + 30, r.y + r.h + 1);
      c.stroke();
      break;
    }
    case 4:
      icon('furnaces', r.x + 34, 40);
      c.fillStyle = withAlpha(ink, 0.55);
      for (let j = 0; j < 6; j++) c.fillRect(r.x + 74, r.y + 7 + j * 6, r.w - 84 - (j % 3) * 14, 2);
      break;
    case 5: {
      const n = 6;
      const xs = Array.from({ length: n }, (_, j) => r.x + 14 + (j * (r.w - 28)) / (n - 1));
      c.strokeStyle = withAlpha(light, 0.85);
      c.lineWidth = 1.3;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
        if ((a + b) % 2) continue;
        c.beginPath();
        c.moveTo(xs[a], r.y + r.h - 8);
        c.quadraticCurveTo((xs[a] + xs[b]) / 2, r.y + r.h - 8 - (xs[b] - xs[a]) * 0.35, xs[b], r.y + r.h - 8);
        c.stroke();
      }
      c.fillStyle = ink;
      for (const x of xs) c.fillRect(x - 6, r.y + r.h - 9, 12, 6);
      break;
    }
    case 6:
      for (let j = 0; j < 7; j++) icon('sort', r.x + 14 + j * ((r.w - 28) / 6), 36);
      break;
    case 7:
      icon('shears', cx, 46);
      break;
  }
}

// vellum teal at ~40 % saturation (HCL chroma ~20-26 at these lightnesses), cut-card black, and the lamp
const TEAL_H = 192;
const VELLUM_LIT = hcl(TEAL_H, 24, 84).formatHex();
const VELLUM_MID = hcl(TEAL_H, 20, 66).formatHex();
const VELLUM_DIM = hcl(TEAL_H + 6, 12, 40).formatHex();
const LAMP = hcl(TEAL_H - 8, 26, 93).formatHex();
const CARD_BLACK = '#0f1312';

// paper grain + fibre (deterministic, made once)
let grain: HTMLCanvasElement | null = null;
function grainCanvas(): HTMLCanvasElement | null {
  if (grain || typeof document === 'undefined') return grain;
  const N = 192;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = 128 + (hash1(x + y * N, 97) - 0.5) * 70 + (hash1(Math.floor(x / 3) + Math.floor(y / 2) * N, 98) - 0.5) * 40;
      const k = (x + y * N) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  // a few long fibres
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 0.6;
  for (let i = 0; i < 26; i++) {
    const x = hash1(i, 11) * N;
    const y = hash1(i, 12) * N;
    const a = hash1(i, 13) * Math.PI;
    const L = 10 + hash1(i, 14) * 30;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 4, y + Math.sin(a) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
  grain = cv;
  return grain;
}

export function xrayColumn(c: CanvasRenderingContext2D, o: XrayDraw, env: PaintEnv) {
  const s = o.s ?? 1;
  const L = o.light ?? 1;
  const litCount = o.state.lit.filter(Boolean).length;
  const tr = o.translucency ?? Math.min(1, 0.25 + litCount * 0.1);
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  const W = XRAY.w, H = XRAY.h;
  const F = 14; // frame width
  // ---- the cabinet: a black cut-card frame with notched corners, on a plinth with two feet
  const frame = new Path2D();
  const x0 = -W / 2 - F, y0 = -H - F, x1 = W / 2 + F, y1 = F;
  const n = 7; // corner notch
  frame.moveTo(x0 + n, y0);
  frame.lineTo(x1 - n, y0);
  frame.lineTo(x1, y0 + n);
  frame.lineTo(x1, y1 - n);
  frame.lineTo(x1 - n, y1);
  frame.lineTo(x0 + n, y1);
  frame.lineTo(x0, y1 - n);
  frame.lineTo(x0, y0 + n);
  frame.closePath();
  frame.rect(-W / 2, -H, W, H); // the window (evenodd)
  c.fillStyle = CARD_BLACK;
  c.fillRect(-W / 2 - F + 10, F, W + 2 * F - 20, 10); // plinth
  c.fillRect(-W / 2 - F + 18, F + 10, 14, 10); // feet
  c.fillRect(W / 2 + F - 32, F + 10, 14, 10);
  // ---- the vellum, backlit: dim paper everywhere, the lamp's pool where bands are lit
  const vell = c.createLinearGradient(0, -H, 0, 0);
  vell.addColorStop(0, VELLUM_DIM);
  vell.addColorStop(1, mixLab(VELLUM_DIM, VELLUM_MID, 0.25));
  c.fillStyle = vell;
  c.fillRect(-W / 2, -H, W, H);
  // general backlight (grows as the box turns translucent)
  const glowK = L * (0.35 + 0.65 * tr);
  const pool = c.createRadialGradient(0, -H * 0.45, 10, 0, -H * 0.45, H * 0.7);
  pool.addColorStop(0, withAlpha(VELLUM_MID, 0.55 * glowK));
  pool.addColorStop(1, withAlpha(VELLUM_MID, 0));
  c.fillStyle = pool;
  c.fillRect(-W / 2, -H, W, H);

  const cutInk = mixLab(CARD_BLACK, VELLUM_DIM, 0.12);
  for (let i = 1; i <= 7; i++) {
    const r = bandRect(i);
    const lit = o.state.lit[i - 1];
    const rev = o.reveal && o.reveal.band === i ? Math.max(0, Math.min(1, o.reveal.u)) : lit ? 1 : 0;
    // the lamp behind this band warms up (bottom first: a soft edge rising through the band)
    if (rev > 0) {
      c.save();
      c.beginPath();
      c.rect(r.x - 4, r.y - 2, r.w + 8, r.h + 4);
      c.clip();
      const top = r.y + r.h - (r.h + 30) * rev;
      const g = c.createLinearGradient(0, top - 18, 0, top + 18);
      g.addColorStop(0, withAlpha(VELLUM_LIT, 0));
      g.addColorStop(1, withAlpha(VELLUM_LIT, 0.95 * L));
      c.fillStyle = g;
      c.fillRect(r.x - 4, top - 18, r.w + 8, r.y + r.h + 4 - (top - 18));
      // a hot core in the middle of the band (the bulb behind the vellum)
      const hot = c.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 2, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.6);
      hot.addColorStop(0, withAlpha(LAMP, 0.65 * rev * L));
      hot.addColorStop(1, withAlpha(LAMP, 0));
      c.fillStyle = hot;
      c.fillRect(r.x - 4, r.y - 2, r.w + 8, r.h + 4);
      c.restore();
    }
    // the cut-out glyph: black paper on the vellum; faint when its lamp is off
    c.save();
    c.globalAlpha *= rev > 0 ? 0.35 + 0.65 * rev : 0.22 + 0.2 * tr;
    bandGlyph(c, i, r, env, cutInk, rev > 0 ? mixLab(LAMP, VELLUM_LIT, 0.4) : VELLUM_MID);
    c.restore();
    if (i === 7 && !lit && (o.slotGlint ?? (o.state.slotGlint ? 1 : 0)) > 0) {
      // band 7 as a dark, empty, shears-shaped slot: a hairline of lamp light escapes around it
      const gk = o.slotGlint ?? 1;
      cardIcon(c, 'shears', r.x + r.w / 2, r.y + r.h / 2, 46, env, withAlpha(CARD_BLACK, 0.9));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(LAMP, 0.45 * gk);
      c.lineWidth = 1;
      c.strokeRect(r.x + r.w / 2 - 26, r.y + 4, 52, r.h - 8);
      c.restore();
    }
  }
  // paper grain + fibre over the whole sheet (multiply darkens the grain into the light)
  const gc = grainCanvas();
  if (gc) {
    c.save();
    const pat = c.createPattern(gc, 'repeat');
    if (pat) {
      c.globalCompositeOperation = 'multiply';
      c.globalAlpha *= 0.22;
      c.fillStyle = pat;
      c.fillRect(-W / 2, -H, W, H);
    }
    c.restore();
  }
  // cut-card band dividers (black strips) and the heavier seam between bands 3 and 4 that never lights
  c.fillStyle = CARD_BLACK;
  for (let i = 1; i < 7; i++) {
    const a = bandRect(i), b = bandRect(i + 1);
    const yy = (a.y + b.y + b.h) / 2;
    const h = i === 3 ? 7 : 3;
    c.fillRect(-W / 2, yy - h / 2, W, h);
  }
  // the frame last, so the vellum sits behind its edge; a thin bevel catches the lamp
  c.fillStyle = CARD_BLACK;
  c.fill(frame, 'evenodd');
  c.strokeStyle = withAlpha(VELLUM_LIT, 0.25 * glowK);
  c.lineWidth = 1;
  c.strokeRect(-W / 2 + 0.5, -H + 0.5, W - 1, H - 1);
  c.restore();
}
