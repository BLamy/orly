/**
 * Sky pieces: paper-cut clouds, the moon, star fields. Draw on L0/L1 (they are light, not ink).
 *
 *   cloud(c, { x, y, w, h?, seed?, tone?, rim? }, env)    one cut-paper cumulus: billows on a flat base;
 *       tone 0..1 = from the sky's upper colour (0) to haze (1); rim lights the upper edges.
 *   cloudBank(c, { x0, x1, y, h, count?, seed?, tone?, drift? }, env)   a row of clouds; drift px/s uses env.t
 *   moon(c, { x, y, r, phase?, halo?, craters? }, env)    phase 0 = full .. 1 = thin crescent (lit on the right)
 *   stars(c, { x, y, w, h, count?, seed?, twinkle? }, env) deterministic twinkle from env.t
 */
import type { Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addCircle, addPolyWound, memoPath } from '../ornament';
import { hash01, keyOf, memo, rng, type Pt } from '../architecture/common';

export interface CloudOpts {
  x: number;
  y: number;
  w: number;
  h?: number;
  seed?: number;
  tone?: number;
  rim?: number;
}
function cloudPath(w: number, h: number, seed: number): { body: Path2D; rimLine: Path2D } {
  return memo(cloudCache, `${w},${h},${seed}`, () => {
    const R = rng(seed, 5);
    const body = new Path2D();
    const rimLine = new Path2D();
    // billows: semicircles along the top whose union forms a scalloped paper edge
    const n = 3 + Math.floor(w / (h * 0.9));
    const bil: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5 + (R() - 0.5) * 0.5) / n;
      const env = Math.pow(Math.sin(Math.PI * u), 0.7);
      bil.push([w * u, h * (0.25 + 0.75 * env) * (0.65 + 0.45 * R())]);
    }
    const top = (x: number) => {
      let y = 0;
      for (const [bx, r] of bil) {
        const dx = x - bx;
        if (Math.abs(dx) < r) y = Math.max(y, Math.sqrt(r * r - dx * dx) * 0.8 + r * 0.25);
      }
      return y;
    };
    const pts: Pt[] = [];
    const steps = Math.max(40, Math.round(w / 3));
    for (let k = 0; k <= steps; k++) {
      const x = (w * k) / steps;
      pts.push([x, -top(x)]);
    }
    rimLine.moveTo(pts[0][0], pts[0][1]);
    for (const q of pts) rimLine.lineTo(q[0], q[1]);
    // a gently wavy flat base, tapered at the ends
    const base: Pt[] = [];
    for (let k = steps; k >= 0; k--) {
      const x = (w * k) / steps;
      const u = x / w;
      base.push([x, -h * 0.08 * (1 - Math.sin(Math.PI * u)) + Math.sin(u * 17 + seed) * h * 0.03]);
    }
    addPolyWound(body, [...pts, ...base]);
    return { body, rimLine };
  });
}
const cloudCache = new Map<string, { body: Path2D; rimLine: Path2D }>();

export const cloud: Painter<CloudOpts> = (c, o, env) => {
  const h = o.h ?? o.w * 0.22;
  const g = cloudPath(o.w, h, o.seed ?? 1);
  const tone = o.tone ?? 0.5;
  const fill = mixLab(env.mood.sky[1], env.mood.haze, tone);
  c.save();
  c.translate(o.x, o.y);
  // a paler paper layer peeking behind, then the main sheet
  c.fillStyle = mixLab(fill, env.mood.sky[3], 0.35);
  c.save();
  c.translate(o.w * 0.06, -h * 0.22);
  c.scale(0.9, 0.9);
  c.fill(g.body);
  c.restore();
  const gr = c.createLinearGradient(0, -h * 1.1, 0, 0);
  gr.addColorStop(0, mixLab(fill, env.mood.sky[3], 0.15));
  gr.addColorStop(1, mixLab(fill, env.mood.sky[0], 0.35));
  c.fillStyle = gr;
  c.fill(g.body);
  const rim = o.rim ?? 0.6;
  if (rim > 0) {
    c.clip(g.body);
    c.strokeStyle = withAlpha(env.mood.rim, 0.55 * rim);
    c.lineWidth = 3;
    c.stroke(g.rimLine);
  }
  c.restore();
};

export interface CloudBankOpts {
  x0: number;
  x1: number;
  y: number;
  h: number;
  count?: number;
  seed?: number;
  tone?: number;
  /** px per second */
  drift?: number;
}
export const cloudBank: Painter<CloudBankOpts> = (c, o, env) => {
  const n = o.count ?? 5;
  const R = rng(o.seed ?? 3, 9);
  const span = o.x1 - o.x0;
  for (let i = 0; i < n; i++) {
    const w = o.h * (3.5 + R() * 3);
    const baseX = o.x0 + ((i + R() * 0.6) / n) * span;
    const x = o.x0 + ((((baseX - o.x0 + (o.drift ?? 0) * env.t) % span) + span) % span) - w * 0.3;
    const y = o.y + (R() - 0.5) * o.h * 0.8;
    cloud(c, { x, y, w, h: o.h * (0.6 + R() * 0.5), seed: (o.seed ?? 3) * 31 + i, tone: (o.tone ?? 0.5) + (R() - 0.5) * 0.2 }, env);
  }
};

export interface MoonOpts {
  x: number;
  y: number;
  r: number;
  /** 0 full .. 1 thin crescent */
  phase?: number;
  halo?: number;
  craters?: boolean;
}
export const moon: Painter<MoonOpts> = (c, o, env) => {
  const halo = o.halo ?? 1;
  if (halo > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(o.x, o.y, o.r * 0.8, o.x, o.y, o.r * 6);
    g.addColorStop(0, withAlpha(env.mood.rim, 0.28 * halo));
    g.addColorStop(0.3, withAlpha(env.mood.rim, 0.08 * halo));
    g.addColorStop(1, withAlpha(env.mood.rim, 0));
    c.fillStyle = g;
    c.fillRect(o.x - o.r * 6, o.y - o.r * 6, o.r * 12, o.r * 12);
    c.restore();
  }
  const ph = Math.max(0, Math.min(1, o.phase ?? 0));
  const disc = memoPath(`moon${o.r},${ph}`, () => {
    const p = new Path2D();
    if (ph < 0.01) {
      addCircle(p, 0, 0, o.r);
      return p;
    }
    // lit limb on the right; terminator is an ellipse with semi-axis k
    const k = o.r * (1 - 2 * ph);
    p.moveTo(0, -o.r);
    p.arc(0, 0, o.r, -Math.PI / 2, Math.PI / 2, false);
    p.ellipse(0, 0, Math.abs(k), o.r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    p.closePath();
    return p;
  });
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = mixLab(env.mood.core, env.mood.rim, 0.25);
  c.fill(disc);
  if (o.craters ?? true) {
    c.clip(disc);
    c.fillStyle = withAlpha(env.mood.rim, 0.45);
    for (const [cx, cy, cr] of [[-0.3, -0.25, 0.22], [0.2, 0.1, 0.16], [-0.1, 0.35, 0.12], [0.35, -0.35, 0.1], [-0.45, 0.15, 0.09]]) {
      c.beginPath();
      c.arc(cx * o.r, cy * o.r, cr * o.r, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
};

export interface StarsOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  count?: number;
  seed?: number;
  /** 0..1 twinkle depth */
  twinkle?: number;
}
export const stars: Painter<StarsOpts> = (c, o, env) => {
  const n = o.count ?? 160;
  const seed = o.seed ?? 4;
  const pts = memo(starCache, keyOf(o), () => {
    const R = rng(seed, 2);
    return Array.from({ length: n }, () => {
      const y = R();
      return [o.x + R() * o.w, o.y + y * y * o.h, 0.4 + R() ** 3 * 1.4, R() * 6.28, 0.5 + R() * 2.5] as [number, number, number, number, number];
    });
  });
  const tw = o.twinkle ?? 0.5;
  c.fillStyle = mixLab(env.mood.core, env.mood.rim, 0.4);
  for (let i = 0; i < pts.length; i++) {
    const [x, y, s, ph, f] = pts[i];
    const a = (1 - tw * 0.5) + tw * 0.5 * Math.sin(env.t * f + ph);
    // fade toward the horizon where the backlight is bright
    const fade = 1 - (y - o.y) / o.h;
    c.globalAlpha = Math.max(0, a * (0.35 + 0.65 * fade) * (0.6 + 0.4 * hash01(i, seed)));
    c.fillRect(x - s / 2, y - s / 2, s, s);
  }
  c.globalAlpha = 1;
};
const starCache = new Map<string, [number, number, number, number, number][]>();
