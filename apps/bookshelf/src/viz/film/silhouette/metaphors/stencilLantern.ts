/**
 * stencilLantern — convolution as a pierced tin lantern sliding over a tapestry.
 * The tapestry is a hand-stitched 14x14 digit "4"; the lantern's 3x3 stencil IS
 * the kernel (pierced holes = positive weights, sized by w; dark shutters with a
 * cool rim = negative weights). At each position the light it throws on the wall
 * is the real dot product, rectified (ReLU), so the wall fills with a true
 * 12x12 feature map, cell by cell, in raster order.
 *   stencil hole size/brightness <- kernel weights
 *   beam brightness, wall cell   <- max(0, Σ kernel · window) / max over the map
 *
 *   stencilLantern(c, {
 *     x?, y?, w?, h?     box (default the full stage; tapestry left, wall right)
 *     step: number       0..144 positions (fractional: slide, then the cell lights)
 *     kernel?: KernelName | number[]   'vertical' | 'horizontal' | 'diagonal' | 'blur' | 9 numbers
 *     reveal?: number    0..1 tapestry, lantern, wall
 *     showSum?: boolean  the dot product set in type over the beam
 *     showKernel?: number  0..1 a card with the kernel's nine numbers
 *     wall?: number      0..1 brightness of the wall frame (fade it for a tight shot)
 *   }, env)
 *   convolve(img, kernel) / DIGIT4 / KERNELS for numbers in narration.
 */
import type { PaintEnv } from '../../contracts';
import { MOODS, mixLab, withAlpha } from '../palette';
import { MFONT, cachedArt, glow, label, ramp, smooth } from './kit';

export type KernelName = 'vertical' | 'horizontal' | 'diagonal' | 'blur';
export const KERNELS: Record<KernelName, number[]> = {
  // Sobel-style: responds to dark-to-light vertical edges (left side of a stroke)
  vertical: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  horizontal: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  diagonal: [0, 1, 2, -1, 0, 1, -2, -1, 0],
  blur: [1, 2, 1, 2, 4, 2, 1, 2, 1].map((v) => v / 16),
};

const ROWS = [
  '..............',
  '.........##...',
  '........###...',
  '.......####...',
  '......##.##...',
  '.....##..##...',
  '....##...##...',
  '...##....##...',
  '..###########.',
  '..###########.',
  '.........##...',
  '.........##...',
  '.........##...',
  '..............',
];
export const DIGIT_N = 14;
/** The hand-drawn digit, 0..1, softened like thread (slight bleed into neighbours). */
export const DIGIT4: number[] = (() => {
  const b: number[] = ROWS.flatMap((r) => [...r].map((ch) => (ch === '#' ? 1 : 0)));
  const out = b.slice();
  for (let y = 0; y < DIGIT_N; y++)
    for (let x = 0; x < DIGIT_N; x++) {
      if (b[y * DIGIT_N + x]) continue;
      let s = 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < DIGIT_N && yy < DIGIT_N) s += b[yy * DIGIT_N + xx];
      }
      out[y * DIGIT_N + x] = Math.min(0.35, s * 0.12);
    }
  return out;
})();

/** Valid 3x3 cross-correlation (what deep-learning "convolution" computes). */
export function convolve(img: number[], k: number[], n = DIGIT_N): number[] {
  const o = n - 2;
  const out = new Array(o * o).fill(0);
  for (let y = 0; y < o; y++)
    for (let x = 0; x < o; x++) {
      let s = 0;
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) s += k[j * 3 + i] * img[(y + j) * n + (x + i)];
      out[y * o + x] = s;
    }
  return out;
}
const MAPS = new Map<string, { map: number[]; max: number }>();
function featureMap(k: number[]) {
  const key = k.join(',');
  let v = MAPS.get(key);
  if (!v) {
    const map = convolve(DIGIT4, k);
    v = { map, max: Math.max(1e-6, ...map.map((x) => Math.max(0, x))) };
    MAPS.set(key, v);
  }
  return v;
}

export interface StencilLanternOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  step: number;
  kernel?: KernelName | number[];
  reveal?: number;
  showSum?: boolean;
  /** 0..1 a small card with the kernel's nine numbers between tapestry and wall */
  showKernel?: number;
  wall?: number;
}

export function stencilLantern(c: CanvasRenderingContext2D, o: StencilLanternOpts, env: PaintEnv): void {
  const X = o.x ?? 0;
  const Y = o.y ?? 0;
  const s = (o.w ?? 1280) / 1280;
  const m = env.mood;
  const ink = env.fill('ink');
  const reveal = o.reveal ?? 1;
  const k = typeof o.kernel === 'string' || !o.kernel ? KERNELS[(o.kernel as KernelName) ?? 'vertical'] : o.kernel;
  const kMax = Math.max(...k.map(Math.abs));
  const { map, max } = featureMap(k);
  const ON = DIGIT_N - 2;
  const NPOS = ON * ON;
  const sc = Math.max(0, Math.min(NPOS - 1e-6, o.step));
  const idx = Math.floor(sc);
  const u = o.step >= NPOS ? 1 : sc - idx;
  const lit = o.step >= NPOS ? NPOS : idx + (u > 0.5 ? 1 : 0); // cells lit on the wall

  // geometry
  const tc = 25 * s; // tapestry cell
  const tx = X + 92 * s;
  const ty = Y + 168 * s;
  const TW = tc * DIGIT_N;
  const wc = 27 * s; // wall cell
  const wx = X + 838 * s;
  const wy = Y + 196 * s;
  const WW = wc * ON;

  // ---------------------------------------------------------------- tapestry
  const tA = smooth(ramp(reveal, 0, 0.35));
  if (tA > 0) {
    c.save();
    c.globalAlpha *= tA;
    cachedArt(c, `tapestry:${m.id}:${s}`, tx - 30 * s, ty - 46 * s, TW + 60 * s, TW + 110 * s, env.pxScale, (g) => {
      g.translate(30 * s, 46 * s);
      // rod with finials and cords
      g.fillStyle = ink;
      g.fillRect(-26 * s, -30 * s, TW + 52 * s, 9 * s);
      for (const fx of [-26 * s, TW + 26 * s]) {
        g.beginPath();
        g.arc(fx, -25.5 * s, 8 * s, 0, Math.PI * 2);
        g.fill();
      }
      // cloth
      const cloth = mixLab(m.set, m.haze, 0.25);
      g.fillStyle = cloth;
      g.beginPath();
      g.moveTo(-8 * s, -22 * s);
      g.lineTo(TW + 8 * s, -22 * s);
      g.lineTo(TW + 8 * s, TW + 10 * s);
      for (let i = 0; i <= 20; i++) g.lineTo(TW + 8 * s - (i / 20) * (TW + 16 * s), TW + 10 * s + (i % 2 ? 7 * s : 0));
      g.closePath();
      g.fill();
      // fringe
      g.strokeStyle = mixLab(cloth, m.ink, 0.3);
      g.lineWidth = 1.2 * s;
      g.beginPath();
      for (let x = -6 * s; x <= TW + 6 * s; x += 4 * s) {
        g.moveTo(x, TW + 12 * s);
        g.lineTo(x + 1 * s, TW + 34 * s);
      }
      g.stroke();
      // a woven border
      g.strokeStyle = withAlpha(m.rim, 0.35);
      g.lineWidth = 1 * s;
      g.strokeRect(-3 * s, -16 * s, TW + 6 * s, TW + 22 * s);
      // stitches: each cell an X-stitch; bright thread where the digit is
      for (let j = 0; j < DIGIT_N; j++)
        for (let i = 0; i < DIGIT_N; i++) {
          const v = DIGIT4[j * DIGIT_N + i];
          const cx = i * tc + tc / 2;
          const cy = j * tc + tc / 2;
          const r = tc * 0.36;
          g.strokeStyle = v > 0.02 ? withAlpha(mixLab(m.halo, m.core, v), 0.35 + 0.65 * v) : withAlpha(mixLab(cloth, m.ink, 0.4), 0.7);
          g.lineWidth = (v > 0.5 ? 3.2 : 1.6) * s;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(cx - r, cy - r);
          g.lineTo(cx + r, cy + r);
          g.moveTo(cx + r, cy - r);
          g.lineTo(cx - r, cy + r);
          g.stroke();
        }
    });
    c.restore();
  }

  // ---------------------------------------------------------------- wall (feature map)
  const wA = smooth(ramp(reveal, 0.35, 0.7)) * (o.wall ?? 1);
  if (wA > 0) {
    c.save();
    c.globalAlpha *= wA;
    // a stone wall panel: dark recess, cells as sockets
    c.fillStyle = mixLab(m.set, m.ink, 0.45);
    c.fillRect(wx - 16 * s, wy - 16 * s, WW + 32 * s, WW + 32 * s);
    c.strokeStyle = withAlpha(m.rim, 0.3);
    c.lineWidth = 1;
    c.strokeRect(wx - 9 * s, wy - 9 * s, WW + 18 * s, WW + 18 * s);
    for (let q = 0; q < NPOS; q++) {
      const cx = wx + (q % ON) * wc;
      const cy = wy + Math.floor(q / ON) * wc;
      const v = q < lit ? Math.max(0, map[q]) / max : 0;
      const neg = q < lit && map[q] < 0 ? Math.min(1, -map[q] / max) : 0;
      c.fillStyle = v > 0 ? mixLab(mixLab(m.set, m.ink, 0.3), m.core, Math.pow(v, 0.8)) : neg > 0 ? mixLab(mixLab(m.set, m.ink, 0.5), MOODS.winterBlue.rim, neg * 0.18) : mixLab(m.set, m.ink, 0.25);
      c.fillRect(cx + 1.5 * s, cy + 1.5 * s, wc - 3 * s, wc - 3 * s);
    }
    // glow of the brightest cells (cheap: only lit ones above 0.5)
    for (let q = 0; q < lit; q++) {
      const v = Math.max(0, map[q]) / max;
      if (v < 0.45) continue;
      glow(c, wx + (q % ON) * wc + wc / 2, wy + Math.floor(q / ON) * wc + wc / 2, wc * 1.4, m.halo, 0.16 * v);
    }
    c.restore();
    label(c, 'FEATURE MAP · 12 × 12', wx + WW / 2, wy - 34 * s, { size: 18, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: wA * 0.9, tracking: 2.5 });
  }

  // ---------------------------------------------------------------- kernel card
  const kA = (o.showKernel ?? 0) * smooth(ramp(reveal, 0.6, 1));
  if (kA > 0) {
    const cw = 44 * s;
    const kx = X + 640 * s - cw * 1.5;
    const ky = Y + 410 * s;
    c.save();
    c.globalAlpha *= kA;
    c.fillStyle = withAlpha(m.ink, 0.6);
    c.fillRect(kx - 12 * s, ky - 40 * s, cw * 3 + 24 * s, cw * 3 + 52 * s);
    c.strokeStyle = withAlpha(m.rim, 0.4);
    c.lineWidth = 1;
    c.strokeRect(kx - 6 * s, ky - 34 * s, cw * 3 + 12 * s, cw * 3 + 40 * s);
    c.restore();
    label(c, 'KERNEL', kx + cw * 1.5, ky - 12 * s, { size: 17, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: kA, tracking: 2.5 });
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const w = k[j * 3 + i];
        const txt = Math.abs(w - Math.round(w)) < 1e-6 ? (w > 0 ? `+${w}` : w < 0 ? `−${-w}` : '0') : w.toFixed(2);
        label(c, txt, kx + i * cw + cw / 2, ky + j * cw + cw * 0.62, { size: 20, color: w > 0 ? m.core : w < 0 ? mixLab(m.rim, MOODS.winterBlue.rim, 0.85) : m.rim, align: 'center', alpha: kA * (w === 0 ? 0.6 : 1) });
      }
  }

  // ---------------------------------------------------------------- the lantern
  const lA = smooth(ramp(reveal, 0.55, 0.9));
  if (lA > 0) {
    // slide between positions in the first 40% of a step, then hold
    const prev = Math.max(0, idx - 1);
    const mv = idx === 0 ? 1 : smooth(ramp(u, 0, 0.4));
    const px0 = (prev % ON) * tc;
    const py0 = Math.floor(prev / ON) * tc;
    const px1 = (idx % ON) * tc;
    const py1 = Math.floor(idx / ON) * tc;
    const jump = Math.floor(prev / ON) !== Math.floor(idx / ON);
    const sx = tx + (jump ? px1 : px0 + (px1 - px0) * mv);
    const sy = ty + (jump ? py1 : py0 + (py1 - py0) * mv);
    const fire = smooth(ramp(u, 0.4, 0.55)) * (1 - smooth(ramp(u, 0.85, 1))) * (o.step >= NPOS ? 0 : 1);
    const val = map[idx];
    const vN = Math.max(0, val) / max;

    // beam to the wall cell (a soft cone, additive)
    if (wA > 0 && fire > 0) {
      const cx = wx + (idx % ON) * wc + wc / 2;
      const cy = wy + Math.floor(idx / ON) * wc + wc / 2;
      const bx = sx + tc * 3;
      const by = sy + tc * 1.5;
      const beam = c.createLinearGradient(bx, by, cx, cy);
      beam.addColorStop(0, withAlpha(m.core, 0.42 * fire * (0.2 + 0.8 * vN)));
      beam.addColorStop(1, withAlpha(m.halo, 0.22 * fire * (0.2 + 0.8 * vN)));
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(bx, by - tc * 1.2);
      c.lineTo(cx, cy - wc * 0.5);
      c.lineTo(cx, cy + wc * 0.5);
      c.lineTo(bx, by + tc * 1.2);
      c.closePath();
      c.fill();
      c.restore();
      glow(c, cx, cy, wc * 2.2, m.core, 0.4 * fire * vN);
      if (o.showSum)
        label(c, `Σ w·x = ${val >= 0 ? '+' : '−'}${Math.abs(val).toFixed(2)}${val < 0 ? '  → 0' : ''}`, (sx + tc * 3 + wx) / 2, wy - 70 * s, {
          size: 20,
          italic: true,
          color: m.core,
          align: 'center',
          alpha: fire * lA,
        });
    }

    // tin stencil frame over the 3x3 window
    c.save();
    c.globalAlpha *= lA;
    const F = tc * 3;
    const pad = 7 * s;
    // the lantern body: a pierced conical tin hood (Paul Revere style), crimped band, finial, ring
    const hx = sx + F / 2;
    const hb = sy - pad; // hood base
    const hh = 40 * s;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(sx - pad - 3 * s, hb);
    c.bezierCurveTo(sx - pad + F * 0.12, hb - hh * 0.45, hx - 12 * s, hb - hh * 0.8, hx - 5 * s, hb - hh);
    c.lineTo(hx + 5 * s, hb - hh);
    c.bezierCurveTo(hx + 12 * s, hb - hh * 0.8, sx + F + pad - F * 0.12, hb - hh * 0.45, sx + F + pad + 3 * s, hb);
    c.closePath();
    c.fill();
    // crimped band (scalloped lower edge)
    c.beginPath();
    const nS = 9;
    const bw0 = F + pad * 2 + 6 * s;
    c.rect(sx - pad - 3 * s, hb - 5 * s, bw0, 5 * s);
    for (let q = 0; q < nS; q++) {
      const qx = sx - pad - 3 * s + ((q + 0.5) / nS) * bw0;
      c.moveTo(qx + (bw0 / nS) * 0.5, hb);
      c.arc(qx, hb, (bw0 / nS) * 0.5, 0, Math.PI);
    }
    c.fill();
    // finial knob and carrying ring
    c.beginPath();
    c.arc(hx, hb - hh - 4 * s, 4 * s, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(hx, hb - hh - 15 * s, 7 * s, 0, Math.PI * 2);
    c.lineWidth = 2.4 * s;
    c.strokeStyle = ink;
    c.stroke();
    // piercings in the hood: rows of pin-pricks that leak the flame
    c.fillStyle = withAlpha(m.core, 0.75);
    for (let row = 0; row < 3; row++) {
      const fy = 0.22 + row * 0.24;
      const yy = hb - hh * fy;
      const half = (F / 2 + pad) * (1 - fy * 0.85);
      const n = 7 - row * 2;
      for (let q = 0; q < n; q++) {
        const xx = hx - half * 0.8 + ((q + 0.5) / n) * half * 1.6;
        c.beginPath();
        c.arc(xx, yy, (1.1 + (row === 0 ? 0.3 : 0)) * s, 0, Math.PI * 2);
        c.fill();
      }
    }
    glow(c, hx, hb - hh * 0.4, hh, m.halo, 0.12 + 0.12 * fire);
    // frame (evenodd: the 9 holes are cut out of the tin plate)
    const plate = new Path2D();
    plate.rect(sx - pad, sy - pad, F + pad * 2, F + pad * 2);
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const w = k[j * 3 + i];
        const rr = (tc * 0.42 * Math.abs(w)) / kMax;
        const cx = sx + i * tc + tc / 2;
        const cy = sy + j * tc + tc / 2;
        if (w > 0) {
          plate.moveTo(cx + rr, cy);
          plate.arc(cx, cy, Math.max(2 * s, rr), 0, Math.PI * 2);
        }
      }
    c.fillStyle = withAlpha(ink, 0.6);
    c.fill(plate, 'evenodd');
    // lattice bars between the cells
    c.strokeStyle = withAlpha(ink, 0.9);
    c.lineWidth = 2.2 * s;
    c.beginPath();
    for (let q = 1; q < 3; q++) {
      c.moveTo(sx + q * tc, sy - pad);
      c.lineTo(sx + q * tc, sy + F + pad);
      c.moveTo(sx - pad, sy + q * tc);
      c.lineTo(sx + F + pad, sy + q * tc);
    }
    c.stroke();
    // holes glow with the lantern's flame; negative weights: shutters with a cool rim
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const w = k[j * 3 + i];
        const cx = sx + i * tc + tc / 2;
        const cy = sy + j * tc + tc / 2;
        const rr = (tc * 0.42 * Math.abs(w)) / kMax;
        if (w > 0) {
          glow(c, cx, cy, rr * 2.4, m.core, 0.35 + 0.4 * fire);
        } else if (w < 0) {
          c.strokeStyle = withAlpha(mixLab(m.rim, MOODS.winterBlue.rim, 0.85), 0.85);
          c.lineWidth = 1.4 * s;
          c.beginPath();
          c.arc(cx, cy, Math.max(2 * s, rr), 0, Math.PI * 2);
          c.stroke();
          c.beginPath();
          c.moveTo(cx - rr * 0.7, cy);
          c.lineTo(cx + rr * 0.7, cy);
          c.stroke();
        }
      }
    c.strokeStyle = withAlpha(m.rim, 0.5);
    c.lineWidth = 1;
    c.strokeRect(sx - pad + 2, sy - pad + 2, F + pad * 2 - 4, F + pad * 2 - 4);
    c.restore();
    glow(c, sx + F / 2, sy + F / 2, F * 1.6, m.halo, 0.18 * lA * (0.6 + 0.4 * fire));
  }
}
