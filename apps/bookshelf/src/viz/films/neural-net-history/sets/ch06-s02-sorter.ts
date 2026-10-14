/**
 * neural-net-history — ch06-s02's small pieces (also used by ch06-s04/s05 where the stencil returns as a token).
 *
 *   stencilHood(c, env, x, y, s, flash)   the pierced tin stencil-lantern of ch06-s01 (stencilLantern's hood), small:
 *                                         a conical tin hood with a crimped band, finial and ring; under it the 3 × 3
 *                                         pierced stencil (the kernel 'vertical': holes sized by |w|), glowing on a flash.
 *                                         (x, y) = the centre of the stencil face; s = scale (1 ≈ 60 px wide).
 */
import type { PaintEnv } from '../../../film/contracts';
import { KERNELS } from '../../../film/silhouette/metaphors/stencilLantern';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

const K = KERNELS.vertical;
const KMAX = Math.max(...K.map(Math.abs));

export function stencilHood(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, s: number, flash: number) {
  // the SAME lantern as ch06-s01's stencilLantern, small: a square tin plate pierced 3 × 3 (holes sized by the
  // kernel's positive weights, negative weights shuttered with a cool ring), lattice bars between the cells, and the
  // conical pierced hood with a crimped band, finial and carrying ring above it. It always burns a little; on a
  // flash the holes go white-hot.
  const ink = env.fill('ink');
  const m = env.mood;
  const F = 42 * s; // the 3 × 3 face
  const cell = F / 3;
  const pad = 5 * s;
  c.save();
  c.translate(x, y);
  const x0 = -F / 2, y0 = -F / 2;
  // hood
  const hb = y0 - pad;
  const hh = 30 * s;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x0 - pad - 2 * s, hb);
  c.bezierCurveTo(x0 - pad + F * 0.12, hb - hh * 0.45, -9 * s, hb - hh * 0.8, -4 * s, hb - hh);
  c.lineTo(4 * s, hb - hh);
  c.bezierCurveTo(9 * s, hb - hh * 0.8, -x0 + pad - F * 0.12, hb - hh * 0.45, -x0 + pad + 2 * s, hb);
  c.closePath();
  c.fill();
  // crimped band
  const bw = F + pad * 2 + 4 * s;
  c.beginPath();
  c.rect(x0 - pad - 2 * s, hb - 4 * s, bw, 4 * s);
  for (let q = 0; q < 7; q++) {
    const qx = x0 - pad - 2 * s + ((q + 0.5) / 7) * bw;
    c.moveTo(qx + bw / 14, hb);
    c.arc(qx, hb, bw / 14, 0, Math.PI);
  }
  c.fill();
  c.beginPath();
  c.arc(0, hb - hh - 3 * s, 3 * s, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = 1.8 * s;
  c.beginPath();
  c.arc(0, hb - hh - 11 * s, 5 * s, 0, Math.PI * 2);
  c.stroke();
  // hood piercings
  c.fillStyle = withAlpha(mixLab(m.halo, m.core, flash), 0.45 + 0.55 * flash);
  for (let row = 0; row < 3; row++) {
    const fy = 0.22 + row * 0.24;
    const yy = hb - hh * fy;
    const half = (F / 2 + pad) * (1 - fy * 0.85);
    const n = 5 - row * 2 + (row === 2 ? 0 : 0);
    for (let q = 0; q < n; q++) {
      c.beginPath();
      c.arc(-half * 0.8 + ((q + 0.5) / n) * half * 1.6, yy, 1.05 * s, 0, Math.PI * 2);
      c.fill();
    }
  }
  // the face plate: holes cut (evenodd); the lamp-light behind shows through them
  const plate = new Path2D();
  plate.rect(x0 - pad, y0 - pad, F + pad * 2, F + pad * 2);
  const holes: [number, number, number][] = [];
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const w = K[j * 3 + i];
      const r = (cell * 0.42 * Math.abs(w)) / KMAX;
      const cx = x0 + (i + 0.5) * cell, cy = y0 + (j + 0.5) * cell;
      if (w > 0) {
        plate.moveTo(cx + Math.max(1.8 * s, r), cy);
        plate.arc(cx, cy, Math.max(1.8 * s, r), 0, Math.PI * 2);
        holes.push([cx, cy, Math.max(1.8 * s, r)]);
      }
    }
  // what shows through the holes: the flame
  c.fillStyle = mixLab(mixLab(m.set, m.halo, 0.55), m.core, flash);
  for (const [cx, cy, r] of holes) {
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = ink;
  c.fill(plate, 'evenodd');
  // lattice bars and the shuttered (negative) cells' cool rings
  c.strokeStyle = withAlpha(m.rim, 0.32);
  c.lineWidth = 0.9 * s;
  c.beginPath();
  for (let q = 1; q < 3; q++) {
    c.moveTo(x0 + q * cell, y0 - pad + 1);
    c.lineTo(x0 + q * cell, y0 + F + pad - 1);
    c.moveTo(x0 - pad + 1, y0 + q * cell);
    c.lineTo(x0 + F + pad - 1, y0 + q * cell);
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.rim, '#9fb4c4', 0.6), 0.55);
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const w = K[j * 3 + i];
      if (w >= 0) continue;
      const r = Math.max(1.8 * s, (cell * 0.42 * Math.abs(w)) / KMAX);
      c.beginPath();
      c.arc(x0 + (i + 0.5) * cell, y0 + (j + 0.5) * cell, r, 0, Math.PI * 2);
      c.stroke();
    }
  c.strokeStyle = withAlpha(m.rim, 0.4);
  c.lineWidth = 1;
  c.strokeRect(x0 - pad, y0 - pad, F + pad * 2, F + pad * 2);
  c.restore();
}
