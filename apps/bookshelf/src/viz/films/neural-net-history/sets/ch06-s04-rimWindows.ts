/**
 * neural-net-history — ch06-s04's two further openings at the dark rim, siblings of Hinton's Toronto window flat:
 * each named holdout stands against his own small backlit opening, so his silhouette reads (ΔL* ≥ 25) without
 * his lantern, and the place reads without a caption.
 *
 *   rimWindow(c, { x, sill, floorY, w, h, t, kind: 'holmdel' | 'montreal' }, env)
 *     holmdel   a dusk sky (the shot's own duskRose ramp, lifted toward the horizon), a low tree line and the long,
 *               low box of a mirrored-glass building catching the last light (no signage)
 *     montreal  a cooler night sky over a low wooded mountain ridge and a few roofs, snow falling slowly
 *   The frame is cut-paper ink with mullions (panes are HOLES) and two feet down to the stage floor.
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { h01 } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;

export interface RimWindowDraw {
  x: number;
  sill: number;
  floorY: number;
  w: number;
  h: number;
  t: number;
  kind: 'holmdel' | 'montreal';
}

export function rimWindow(c: C, o: RimWindowDraw, env: PaintEnv) {
  const m = env.mood;
  const W = MOODS.winterBlue;
  const x0 = o.x - o.w / 2, y0 = o.sill - o.h;
  c.save();
  // the sky beyond: bright toward the bottom of the glass (a low horizon), so a figure in front reads dark
  const sky = c.createLinearGradient(0, y0, 0, o.sill);
  if (o.kind === 'holmdel') {
    sky.addColorStop(0, mixLab(m.sky[1], m.set, 0.25));
    sky.addColorStop(0.55, m.sky[2]);
    sky.addColorStop(1, mixLab(m.sky[3], m.rim, 0.2));
  } else {
    sky.addColorStop(0, mixLab(mixLab(W.sky[1], m.sky[1], 0.5), m.set, 0.25));
    sky.addColorStop(0.6, mixLab(W.sky[2], m.sky[2], 0.55));
    sky.addColorStop(1, mixLab(W.sky[3], m.sky[3], 0.6));
  }
  c.fillStyle = sky;
  c.fillRect(x0, y0, o.w, o.h);
  c.save();
  c.beginPath();
  c.rect(x0, y0, o.w, o.h);
  c.clip();
  const far = mixLab(m.set, m.setHaze, 0.55);
  if (o.kind === 'holmdel') {
    // a low tree line, and the long glass box on it catching the dusk (a lighter band = the reflected sky)
    c.fillStyle = far;
    c.beginPath();
    c.moveTo(x0, o.sill);
    for (let k = 0; k <= 24; k++) c.lineTo(x0 + (k / 24) * o.w, o.sill - 14 - 10 * h01(k, 501));
    c.lineTo(x0 + o.w, o.sill);
    c.closePath();
    c.fill();
    const bx0 = x0 + o.w * 0.12, bx1 = x0 + o.w * 0.9, by = o.sill - 40, bh = 22;
    c.fillRect(bx0, by, bx1 - bx0, bh + 18);
    c.fillStyle = withAlpha(mixLab(m.sky[3], m.rim, 0.4), 0.55);
    c.fillRect(bx0 + 2, by + 3, bx1 - bx0 - 4, bh - 6);
    c.fillStyle = withAlpha(far, 0.7);
    for (let k = 1; k < 3; k++) c.fillRect(bx0, by + (k * bh) / 3, bx1 - bx0, 1.2);
  } else {
    // a low wooded mountain, a few roofs and one small spire in front of it
    c.fillStyle = mixLab(far, W.setHaze, 0.3);
    c.beginPath();
    c.moveTo(x0, o.sill);
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      c.lineTo(x0 + u * o.w, o.sill - 30 - 34 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - 4 * h01(k, 511));
    }
    c.lineTo(x0 + o.w, o.sill);
    c.closePath();
    c.fill();
    c.fillStyle = far;
    let xx = x0;
    let i = 0;
    c.beginPath();
    c.moveTo(x0, o.sill);
    while (xx < x0 + o.w) {
      const bw = 10 + 14 * h01(i, 512), bh = 8 + 12 * h01(i, 513);
      c.lineTo(xx, o.sill - bh);
      c.lineTo(xx + bw / 2, o.sill - bh - 6);
      c.lineTo(xx + bw, o.sill - bh);
      xx += bw;
      i++;
    }
    c.lineTo(x0 + o.w, o.sill);
    c.closePath();
    c.fill();
    const sx = x0 + o.w * 0.3;
    c.beginPath();
    c.moveTo(sx - 4, o.sill - 18);
    c.lineTo(sx, o.sill - 50);
    c.lineTo(sx + 4, o.sill - 18);
    c.closePath();
    c.fill();
    // slow snow
    c.fillStyle = withAlpha(mixLab(W.rim, W.core, 0.4), 0.6);
    for (let k = 0; k < 18; k++) {
      const sp = 12 + 9 * h01(k, 521);
      const yy = y0 + ((h01(k, 522) * o.h + o.t * sp) % o.h);
      const xs = x0 + h01(k, 523) * o.w + 3 * Math.sin(o.t * 0.6 + k);
      c.beginPath();
      c.arc(xs, yy, 0.7 + 0.8 * h01(k, 524), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
  // the frame (evenodd: the panes are holes), sill, feet
  const fr = new Path2D();
  const b = 8;
  fr.rect(x0 - b, y0 - b - 5, o.w + 2 * b, o.h + 2 * b + 5);
  const cols = 2, rows = 3, mu = 5;
  const pw = (o.w - (cols - 1) * mu) / cols, ph = (o.h - (rows - 1) * mu) / rows;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) fr.rect(x0 + q * (pw + mu), y0 + r * (ph + mu), pw, ph);
  c.fillStyle = env.fill('ink');
  c.fill(fr, 'evenodd');
  c.fillRect(x0 - b - 6, o.sill + b - 2, o.w + 2 * b + 12, 6);
  c.fillRect(x0 + 6, o.sill + b, 5, o.floorY - o.sill - b);
  c.fillRect(x0 + o.w - 11, o.sill + b, 5, o.floorY - o.sill - b);
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1;
  c.strokeRect(x0 + 0.5, y0 + 0.5, o.w - 1, o.h - 1);
  c.restore();
}
