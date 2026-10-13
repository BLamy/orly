/**
 * Terrain: fbm ridgelines, layered mountains with mist, valleys, snowfields with drifts and fences.
 *
 *   ridgePath({ x0, x1, y, amp, seed?, scale?, octaves?, ridged?, ground? }) -> Path2D  (cached)
 *   ridgeline(c, { ...ridge, role? }, env)            one filled range
 *   mountains(c, { x0, x1, y, amp, ranges?, seed?, mist?, snowCaps?, valley? }, env)
 *       `ranges` ridges far -> near, each mixed from haze (far) to the layer fill (near), with mist bands
 *       between them. valley: 0..1 pulls the ranges down toward the centre (a misty valley).
 *   snowfield(c, { x0, x1, y, depth?, seed?, drifts?, fence?, posts? }, env)
 *       a pale ground catching the sky, drift crests with soft shadows, optional receding fence.
 */
import type { FillRole, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addPolyWound, addRect, memoPath } from '../ornament';
import { keyOf, memo, rng, strokeCuts, type Pt } from '../architecture/common';
import { fbm1, ridged1 } from './noise';

export interface RidgeOpts {
  x0: number;
  x1: number;
  /** baseline y (mean crest height is y - amp/2) */
  y: number;
  amp: number;
  seed?: number;
  /** feature width in px (default 260) */
  scale?: number;
  octaves?: number;
  ridged?: boolean;
  /** fill below the crest by this much */
  ground?: number;
  /** optional envelope (0..1 over x) multiplying the height */
  valley?: number;
}

function crestY(o: RidgeOpts, x: number): number {
  const s = o.scale ?? 260;
  const base = fbm1(x / s, o.seed ?? 1, o.octaves ?? 5, 0.42) * 0.5 + 0.5;
  const n = o.ridged ? 0.55 * base + 0.45 * ridged1(x / (s * 1.3), (o.seed ?? 1) + 7, 4) : base;
  let env = 1;
  if (o.valley) {
    const u = (x - o.x0) / (o.x1 - o.x0);
    env = 1 - o.valley * Math.exp(-(((u - 0.5) / 0.22) ** 2));
  }
  return o.y - n * o.amp * env;
}

export function ridgePath(o: RidgeOpts): Path2D {
  return memoPath(`ridge${keyOf(o)}`, () => {
    const p = new Path2D();
    const pts: Pt[] = [[o.x0, o.y + (o.ground ?? 400)]];
    const step = Math.max(1.5, (o.scale ?? 260) / 90);
    for (let x = o.x0; x <= o.x1 + step; x += step) pts.push([x, crestY(o, x)]);
    pts.push([o.x1 + step, o.y + (o.ground ?? 400)]);
    addPolyWound(p, pts);
    return p;
  });
}

export const ridgeline: Painter<RidgeOpts & { role?: FillRole }> = (c, o, env) => {
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(ridgePath(o));
};

export interface MountainsOpts {
  x0: number;
  x1: number;
  /** y of the nearest range's baseline */
  y: number;
  amp: number;
  ranges?: number;
  seed?: number;
  /** mist strength between ranges 0..1 */
  mist?: number;
  snowCaps?: number;
  valley?: number;
  role?: FillRole;
}
export const mountains: Painter<MountainsOpts> = (c, o, env) => {
  const n = o.ranges ?? 4;
  // nearer ranges sit closer than the layer's nominal depth: pull them back toward the unhazed fill
  const near = mixLab(env.fill(o.role ?? 'set'), env.mood.set, 0.4);
  const far = mixLab(env.mood.haze, env.mood.sky[2], 0.45);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1); // 0 far .. 1 near
    const r: RidgeOpts = {
      x0: o.x0,
      x1: o.x1,
      y: o.y - (1 - t) * o.amp * 0.55,
      amp: o.amp * (1.1 - 0.5 * t),
      seed: (o.seed ?? 3) + i * 17,
      scale: 380 - 160 * t,
      ridged: i < n - 1,
      valley: o.valley,
      ground: 600,
    };
    c.fillStyle = mixLab(far, near, Math.pow(t, 1.4));
    c.fill(ridgePath(r));
    // snow caps on the far, high ranges: clip to the ridge and paint a band below the crest
    if ((o.snowCaps ?? 0) > 0 && t < 0.7) {
      c.save();
      c.clip(ridgePath(r));
      const caps = memoPath(`caps${keyOf(r)}`, () => {
        const p = new Path2D();
        const pts: Pt[] = [];
        const step = 3;
        for (let x = r.x0; x <= r.x1; x += step) pts.push([x, crestY(r, x)]);
        const snowLine = r.y - r.amp * 0.55;
        const lower: Pt[] = [];
        for (let k = pts.length - 1; k >= 0; k--) {
          const [x, y] = pts[k];
          const depth = Math.max(0, snowLine - y) * 0.6 + fbm1(x / 25, 9, 2) * 6;
          lower.push([x, y + Math.max(0, depth)]);
        }
        addPolyWound(p, [...pts.map(([x, y]) => [x, y - 2] as Pt), ...lower]);
        return p;
      });
      c.fillStyle = withAlpha(mixLab(env.mood.rim, far, 0.4), 0.8 * (o.snowCaps ?? 0) * (1 - t * 0.6));
      c.fill(caps);
      c.restore();
    }
    // mist pooled in the valley below this range
    const mist = o.mist ?? 0.5;
    if (mist > 0 && i < n - 1) {
      const my = r.y - r.amp * 0.12;
      const h = o.amp * 0.5;
      const g = c.createLinearGradient(0, my - h, 0, my + h * 0.3);
      g.addColorStop(0, withAlpha(env.mood.haze, 0));
      g.addColorStop(0.75, withAlpha(env.mood.haze, 0.55 * mist));
      g.addColorStop(1, withAlpha(env.mood.haze, 0.35 * mist));
      c.fillStyle = g;
      c.fillRect(o.x0, my - h, o.x1 - o.x0, h * 1.3);
    }
  }
};

export interface SnowfieldOpts {
  x0: number;
  x1: number;
  /** horizon / back edge of the field */
  y: number;
  depth?: number;
  seed?: number;
  drifts?: number;
  /** a fence receding from front-left toward the horizon */
  fence?: boolean;
  role?: FillRole;
}
const snowCache = new Map<string, { ground: Path2D; crests: Path2D; shadows: Path2D; fence: Path2D }>();
export const snowfield: Painter<SnowfieldOpts> = (c, o, env) => {
  const depth = o.depth ?? 300;
  const g = memo(snowCache, keyOf(o), () => {
    const R = rng(o.seed ?? 8, 4);
    const ground = new Path2D();
    const crests = new Path2D();
    const shadows = new Path2D();
    const fence = new Path2D();
    const pts: Pt[] = [[o.x0, o.y + depth]];
    for (let x = o.x0; x <= o.x1; x += 6) pts.push([x, o.y - fbm1(x / 300, o.seed ?? 8, 3) * 10]);
    pts.push([o.x1, o.y + depth]);
    addPolyWound(ground, pts);
    const nd = o.drifts ?? 7;
    for (let i = 0; i < nd; i++) {
      const t = (i + 1) / (nd + 1);
      const yy = o.y + depth * t * t;
      const x0 = o.x0 + (o.x1 - o.x0) * (R() * 0.6 - 0.1);
      const len = (o.x1 - o.x0) * (0.3 + R() * 0.5) * (0.4 + t);
      const crest: Pt[] = [];
      for (let k = 0; k <= 30; k++) {
        const u = k / 30;
        crest.push([x0 + u * len, yy - Math.sin(u * Math.PI) * (4 + 14 * t) * (0.7 + 0.3 * Math.sin(u * 7 + i))]);
      }
      crests.moveTo(crest[0][0], crest[0][1]);
      for (const q of crest) crests.lineTo(q[0], q[1]);
      // shadow on the lee side under each crest
      const sh: Pt[] = crest.map(([x, y]) => [x, y + 1] as Pt);
      for (let k = 30; k >= 0; k--) {
        const u = k / 30;
        sh.push([x0 + u * len + 10 * t, yy + Math.sin(u * Math.PI) * (6 + 22 * t) * 0.6]);
      }
      addPolyWound(shadows, sh);
    }
    if (o.fence) {
      // posts receding along a gentle curve, two sagging rails
      const n = 16;
      const tops: Pt[] = [];
      const bots: Pt[] = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const s = 1 / (1 + t * 6);
        const x = o.x0 + (o.x1 - o.x0) * (0.06 + 0.62 * (1 - s) + 0.04 * Math.sin(t * 3));
        const yb = o.y + depth * 0.95 * s;
        const ph = 70 * s;
        const pw = Math.max(1, 6 * s);
        addPolyWound(fence, [[x - pw / 2, yb], [x - pw / 2 + pw * 0.1, yb - ph], [x + pw / 2, yb - ph - pw * 0.3], [x + pw / 2, yb]]);
        tops.push([x, yb - ph * 0.85]);
        bots.push([x, yb - ph * 0.45]);
        void R;
      }
      for (const rail of [tops, bots]) {
        for (let i = 0; i < rail.length - 1; i++) {
          const [ax, ay] = rail[i];
          const [bx, by] = rail[i + 1];
          const th = Math.max(0.6, 2.4 / (1 + (i / (n - 1)) * 6));
          const midSag = 3 / (1 + i * 0.5);
          const pts2: Pt[] = [];
          for (let k = 0; k <= 8; k++) {
            const u = k / 8;
            pts2.push([ax + (bx - ax) * u, ay + (by - ay) * u + Math.sin(u * Math.PI) * midSag]);
          }
          const back = pts2.map(([x, y]) => [x, y + th] as Pt).reverse();
          addPolyWound(fence, [...pts2, ...back]);
        }
      }
    }
    return { ground, crests, shadows, fence };
  });
  // snow catches the sky: brightest at the horizon, cooler/darker toward the viewer
  const gr = c.createLinearGradient(0, o.y - 10, 0, o.y + depth);
  gr.addColorStop(0, mixLab(env.mood.sky[3], env.mood.rim, 0.25));
  gr.addColorStop(0.35, mixLab(env.mood.sky[2], env.mood.haze, 0.3));
  gr.addColorStop(1, mixLab(env.mood.haze, env.mood.set, 0.55));
  c.fillStyle = gr;
  c.fill(g.ground);
  c.fillStyle = withAlpha(env.mood.set, 0.22);
  c.fill(g.shadows);
  strokeCuts(c, g.crests, withAlpha(env.mood.rim, 0.45), 1.2);
  if (o.fence) {
    c.fillStyle = env.fill(o.role ?? 'ink');
    c.fill(g.fence);
  }
  void addRect;
};
