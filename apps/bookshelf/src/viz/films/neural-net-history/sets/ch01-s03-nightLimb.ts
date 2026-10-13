/**
 * neural-net-history — THE NIGHT LIMB (ch01-s03 kit work: staging.kitWork "sets/nightLimb").
 *
 * One great arc of the earth's dark night side seen from orbit, against a thin serverCyan haze band at
 * the horizon (the atmosphere's airglow), stars above. Its dark continents are dusted with small lit
 * rectangles placed by a seeded scatter (fixed seed): windows lit at dusk, none labelled. A "home window"
 * marker sits near centre frame (the window we came from) and can pulse once.
 *
 *   nightLimb(f, { key, cams, lit, home, layer? })    paints L1 (stars) and the earth on `layer` (L2)
 *     lit   0..1  fraction of the scatter lit; lights come on in WAVES (a sweep from the left with a
 *                 seeded jitter, like dusk crossing the continents), each flickering on over ~0.25 s
 *     home  0..1  the home window's single pulse (0 = resting lit, rises to 1 and back is the pulse)
 *     homeOn      whether the home window is lit at all
 *   LIMB          geometry (world, at the layer): the earth's circle and the home window's position
 *
 * The arc is a circle far larger than the frame (centre well below it), so the horizon reads as a gentle
 * curve; land is an fbm mask foreshortened toward the limb; window rectangles shrink toward the limb.
 */
import type { Camera3, Frame, LayerId, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { stars } from '../../../film/silhouette/nature';
import { fbm2 } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/silhouette/atmosphere';

export const LIMB = {
  /** the earth's circle (world px at the layer) */
  cx: 640,
  cy: 2950,
  r: 2620,
  /** the home window (world px at the layer) */
  home: { x: 652, y: 492 },
} as const;

/** the limb's local tangent angle at x (radians): windows tilt with the curvature of the earth */
const tangentAt = (x: number) => Math.atan2(x - LIMB.cx, Math.sqrt(Math.max(1, LIMB.r * LIMB.r - (x - LIMB.cx) ** 2)));
const horizonY = (x: number) => LIMB.cy - Math.sqrt(Math.max(0, LIMB.r * LIMB.r - (x - LIMB.cx) ** 2));

/** 0..1 depth below the limb: 0 at the horizon, 1 near the frame bottom (foreshortening) */
function depthAt(x: number, y: number) {
  const h = horizonY(x);
  return Math.max(0, (y - h) / 420);
}

/** land mask in "surface" coordinates: foreshortened (compressed) toward the limb */
function landAt(x: number, y: number) {
  const d = depthAt(x, y);
  // surface coordinates: longitude ~ x (spread wider near the viewer), latitude ~ stretched depth
  const sx = (x - LIMB.cx) / (0.9 + 0.5 * d) + 420;
  const sy = Math.pow(d, 0.62) * 900;
  const n = fbm2(sx * 0.0042, sy * 0.0065, 1943, 4);
  return n;
}
const LAND_T = 0.52;

interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  thr: number;
  b: number;
  /** cos/sin of the window's tilt: the limb's local tangent plus a seeded jitter */
  ca: number;
  sa: number;
}
interface City {
  x: number;
  y: number;
  r: number;
  thr: number;
}
let WINS: Win[] | null = null;
let CITIES: City[] = [];
/** the home window: a lone lit window on land near centre frame, with a clear ring of dark around it */
let HOME: { x: number; y: number } = { x: 648, y: 470 };
const HOME_CLEAR = 62;
function findHome() {
  let best = { x: 648, y: 470 }, bd = Infinity;
  for (let gy = 420; gy <= 540; gy += 4) {
    for (let gx = 560; gx <= 740; gx += 4) {
      if (landAt(gx, gy) < LAND_T + 0.012) continue;
      const d = Math.hypot(gx - 648, (gy - 478) * 1.4);
      if (d < bd) {
        bd = d;
        best = { x: gx, y: gy };
      }
    }
  }
  return best;
}
const nearHome = (x: number, y: number, r = HOME_CLEAR) => Math.hypot(x - HOME.x, (y - HOME.y) * 1.25) < r;
function windows(): Win[] {
  if (WINS) return WINS;
  HOME = findHome();
  const out: Win[] = [];
  const cities: City[] = [];
  // 0. a few constellations: seeded regions on land the cities gather into (the dark between them stays dark)
  const regions: { x: number; y: number; r: number }[] = [];
  // many constellations spread across the whole visible arc, so the lit limb reads as "people everywhere",
  // not a few cities (the dark between them still stays dark)
  for (let k = 0; regions.length < 34 && k < 9000; k++) {
    const x = -300 + hash1(k * 3 + 1, 707) * 1880;
    const y = horizonY(x) + 20 + Math.pow(hash1(k * 3 + 2, 707), 1.1) * 520;
    if (landAt(x, y) < LAND_T + 0.01 || nearHome(x, y, HOME_CLEAR + 70)) continue;
    if (regions.some((R) => Math.hypot(R.x - x, (R.y - y) * 1.8) < 140)) continue;
    regions.push({ x, y, r: 100 + 90 * hash1(k * 3 + 3, 707) });
  }
  const inRegion = (x: number, y: number) => regions.some((R) => Math.hypot(x - R.x, (y - R.y) * 1.8) < R.r);
  // 1. city centres: seeded points on land inside a constellation, sized by a second noise (big ones are rare)
  for (let k = 0; cities.length < 240 && k < 60000; k++) {
    const x = -360 + hash1(k * 5 + 1, 2026) * 2000;
    const y = horizonY(x) + 3 + Math.pow(hash1(k * 5 + 2, 2026), 1.25) * 600;
    const nl = landAt(x, y);
    if (nl < LAND_T + 0.006) continue;
    if (!inRegion(x, y)) continue;
    // cities cluster along coasts: inland sites are kept only now and then
    if (nl > LAND_T + 0.05 && hash1(k * 5 + 9, 2026) > 0.22) continue;
    if (nearHome(x, y, HOME_CLEAR + 40)) continue;
    const size = Math.pow(hash1(k * 5 + 3, 2026), 2.2);
    // the wave: dusk sweeps from the left in ragged fronts
    const u = Math.max(0, Math.min(1, (x + 60) / 1400));
    // waves: dusk sweeps from the left, but several ragged fronts cross the arc at once, so the whole
    // limb is dusted early and the lit share climbs steadily
    const thr = Math.min(0.97, Math.max(0.01, 0.42 * u + 0.55 * hash1(k * 5 + 4, 31)));
    cities.push({ x, y, r: 6 + 24 * size, thr });
  }
  // 2. windows: a loose scatter around each centre (kept on land), foreshortened toward the limb; each a
  //    crisp small rectangle on whole pixels, so the dusting reads as windows and not as glowing nebulae
  let i = 0;
  for (const C of cities) {
    const d0 = depthAt(C.x, C.y);
    const fy = 0.25 + 0.75 * Math.min(1, d0 * 1.6); // squash near the limb
    const n = Math.round((5 + C.r * 2.2) * 0.7);
    for (let j = 0; j < n; j++, i++) {
      const a = hash1(i * 4 + 1, 77) * Math.PI * 2;
      const rr = C.r * Math.sqrt(-2 * Math.log(1 - 0.98 * hash1(i * 4 + 2, 77))) * 0.95;
      const x = Math.round(C.x + Math.cos(a) * rr * (1 + 0.5 * d0));
      const y = Math.round(C.y + Math.sin(a) * rr * fy);
      if (y < horizonY(x) + 1.5 || landAt(x, y) < LAND_T || nearHome(x, y)) continue;
      const d = depthAt(x, y);
      // thinner toward the frame's bottom edge (the near surface), so the lower third is not crowded
      if (d > 0.62 && hash1(i, 14) < 0.42) continue;
      const near = Math.min(1, d * 1.4);
      const tilt = tangentAt(x) + (hash1(i, 19) - 0.5) * 0.12;
      // small lit RECTANGLES (portrait, >= 2 x 3 px at 1080p even toward the limb; ~3.6 x 6 px in the near band)
      out.push({ x, y, w: near > 0.45 ? 2.4 : near > 0.2 ? 2 : 1.6, h: near > 0.45 ? 4 : near > 0.2 ? 3.2 : 2.4, thr: Math.min(0.995, C.thr + 0.05 * hash1(i, 12)), b: 0.6 + 0.4 * hash1(i, 11), ca: Math.cos(tilt), sa: Math.sin(tilt) });
    }
  }
  // 3. sparse rural lights between the cities (few: the dark continent between clusters stays dark)
  for (let k = 0; k < 20000 && out.length < 6000; k++) {
    const x = Math.round(-360 + hash1(k * 3 + 1, 909) * 2000);
    const y = Math.round(horizonY(x) + 3 + Math.pow(hash1(k * 3 + 2, 909), 1.3) * 600);
    if (landAt(x, y) < LAND_T + 0.01 || nearHome(x, y)) continue;
    if (!inRegion(x, y) && hash1(k * 3 + 7, 909) > 0.15) continue;
    if (hash1(k * 3 + 3, 909) > 0.11) continue;
    const d = depthAt(x, y);
    if (d > 0.62 && hash1(k, 15) < 0.42) continue;
    const u = Math.max(0, Math.min(1, (x + 60) / 1400));
    const tilt = tangentAt(x) + (hash1(k, 34) - 0.5) * 0.12;
    out.push({ x, y, w: 1.8, h: 2.8, thr: Math.min(0.995, 0.42 * u + 0.55 * hash1(k, 32)), b: 0.35 + 0.3 * hash1(k, 33), ca: Math.cos(tilt), sa: Math.sin(tilt) });
  }
  CITIES = cities;
  WINS = out;
  return out;
}
/** the home window's world position (on the layer) */
export function limbHome() {
  windows();
  return HOME;
}

export interface NightLimbOpts {
  key: string;
  cams: Camera3[];
  lit: number;
  home?: number;
  homeOn?: number;
  /** the earth's plane: a layer id, or a spec (ch01-s03 passes L2's depth with blur 0: the one sharp plane) */
  layer?: LayerId | LayerSpec;
  /** star layer brightness */
  starA?: number;
  /** 0..1 progress of the home window's pulse: a soft bloom swelling 40 → 120 px and back (no ring outline) */
  ring?: number;
  /** 0..1 a dip in all the other lights (−15%) so the eye goes to the home window */
  dip?: number;
}

export function nightLimb(f: Frame, o: NightLimbOpts) {
  const layer = o.layer ?? 'L2';
  const spec: LayerSpec = typeof layer === 'string' ? LAYERS[layer] : layer;
  f.backlight({ sunX: 640, sunY: 900, sunRadius: 900, intensity: 0.15 });
  // L1: a deep sky with stars (above the limb only: the earth covers the rest)
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 80);
    f.cached(`${o.key}/limb/L1/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const g = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, mixLab(env.mood.fg, env.mood.sky[0], 0.35));
      g.addColorStop(0.55, mixLab(env.mood.fg, env.mood.sky[0], 0.7));
      g.addColorStop(1, mixLab(env.mood.sky[0], env.mood.sky[1], 0.3));
      cc.fillStyle = g;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // the stars, a step brighter (a second additive pass of the same field)
      stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.75, count: 260, seed: 1943, twinkle: 0 }, env);
      cc.globalCompositeOperation = 'lighter';
      stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.75, count: 260, seed: 1943, twinkle: 0 }, env);
      cc.globalCompositeOperation = 'source-over';
    })(c, r.x, r.y);
  });
  f.layer(spec, (c, env) => {
    const r = overscan(spec, o.cams, 60);
    const x0 = r.x, y0 = Math.min(r.y, 120), w = r.w, h = r.y + r.h - y0;
    // the baked earth: airglow band, the dark disc, the land mask and a faint coast rim
    f.cached(`${o.key}/limb/earth3/${spec.id}/${env.mood.id}/${Math.round(x0)},${Math.round(y0)},${Math.round(w)},${Math.round(h)}`, Math.ceil(w), Math.ceil(h), (cc) => {
      cc.translate(-x0, -y0);
      const m = env.mood;
      // airglow: a soft cyan band hugging the limb (outside the disc), brightest right at the edge
      cc.save();
      for (const [lw, a] of [[90, 0.1], [44, 0.16], [18, 0.3], [6, 0.55]] as const) {
        cc.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.25), a);
        cc.lineWidth = lw;
        cc.filter = `blur(${(lw * 0.35).toFixed(1)}px)`;
        cc.beginPath();
        cc.arc(LIMB.cx, LIMB.cy, LIMB.r + lw * 0.22, Math.PI * 1.05, Math.PI * 1.95);
        cc.stroke();
      }
      cc.filter = 'none';
      cc.restore();
      // the disc: ocean ink; the near surface a touch lighter (the night side catching sky light)
      const disc = new Path2D();
      disc.arc(LIMB.cx, LIMB.cy, LIMB.r, 0, Math.PI * 2);
      const dg = cc.createLinearGradient(0, LIMB.cy - LIMB.r, 0, LIMB.cy - LIMB.r + 600);
      dg.addColorStop(0, mixLab(m.ink, m.set, 0.45));
      dg.addColorStop(0.08, mixLab(m.ink, m.set, 0.15));
      dg.addColorStop(1, mixLab(m.ink, m.fg, 0.4));
      cc.fillStyle = dg;
      cc.fill(disc);
      // land: CUT PAPER. The land mask is traced on a coarse grid (marching squares, 12 x 7 world px cells, no
      // smoothing), so every coast is a run of short straight cuts (slight polygon facets), filled crisp at the
      // set value (about L* 22) against a sea near ink; the coast's limb-facing edges carry a 1-2 px rim (the
      // whole land shape laid once in rim light, nudged toward the horizon, then the land on top)
      cc.save();
      cc.clip(disc);
      const SX = 12, SY = 7;
      const gx0 = Math.floor(x0 / SX) * SX - SX, gy0 = Math.floor(y0 / SY) * SY - SY;
      const nx = Math.ceil(w / SX) + 3, ny = Math.ceil(h / SY) + 3;
      const V = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) {
        const yy = gy0 + j * SY;
        for (let i = 0; i < nx; i++) {
          const xx = gx0 + i * SX;
          V[j * nx + i] = yy < horizonY(xx) - 24 ? -1 : landAt(xx, yy) - LAND_T;
        }
      }
      const landPath = new Path2D();
      const pts: [number, number][] = [];
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const X = gx0 + i * SX, Y = gy0 + j * SY;
          const cs: [number, number, number][] = [
            [X, Y, V[j * nx + i]],
            [X + SX, Y, V[j * nx + i + 1]],
            [X + SX, Y + SY, V[(j + 1) * nx + i + 1]],
            [X, Y + SY, V[(j + 1) * nx + i]],
          ];
          if (cs.every((q) => q[2] <= 0)) continue;
          pts.length = 0;
          for (let e = 0; e < 4; e++) {
            const p = cs[e], q = cs[(e + 1) % 4];
            if (p[2] > 0) pts.push([p[0], p[1]]);
            if ((p[2] > 0) !== (q[2] > 0)) {
              const u = p[2] / (p[2] - q[2]);
              pts.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]);
            }
          }
          if (pts.length < 3) continue;
          landPath.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k < pts.length; k++) landPath.lineTo(pts[k][0], pts[k][1]);
          landPath.closePath();
        }
      }
      const land = mixLab(m.set, m.haze, 0.06);
      cc.save();
      cc.translate(0, -1.6);
      cc.fillStyle = withAlpha(mixLab(m.rim, land, 0.35), 0.75);
      cc.fill(landPath);
      cc.restore();
      cc.fillStyle = land;
      cc.fill(landPath);
      cc.restore();
      // the limb itself: a crisp hairline of rim light on the earth's edge
      cc.restore();
      cc.strokeStyle = withAlpha(m.rim, 0.5);
      cc.lineWidth = 1.3;
      cc.beginPath();
      cc.arc(LIMB.cx, LIMB.cy, LIMB.r - 0.5, Math.PI * 1.05, Math.PI * 1.95);
      cc.stroke();
    })(c, x0, y0);

    // the windows: per frame (they come on in waves and flicker as they catch)
    const lit = Math.max(0, Math.min(1, o.lit));
    const W = windows();
    const m = env.mood;
    const warm = mixLab(m.halo, m.core, 0.8);
    c.save();
    c.globalCompositeOperation = 'lighter';
    // each lit city's haze (a soft pool under its windows)
    for (const C of CITIES) {
      const e = Math.min(1, (lit * 1.04 - C.thr) / 0.06);
      if (e <= 0 || C.r < 12) continue;
      const R = C.r * 2.2;
      const fy = 0.25 + 0.75 * Math.min(1, depthAt(C.x, C.y) * 1.6);
      c.save();
      c.translate(C.x, C.y);
      c.scale(1, fy);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, withAlpha(m.halo, 0.06 * e * (1 - 0.15 * (o.dip ?? 0))));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(-R, -R, 2 * R, 2 * R);
      c.restore();
    }
    const dipK = 1 - 0.15 * (o.dip ?? 0);
    for (let i = 0; i < W.length; i++) {
      const q = W[i];
      const e = (lit * 1.04 - q.thr) / 0.035; // 0 → 1 over a short window after the front passes
      if (e <= 0) continue;
      let a = Math.min(1, e);
      if (e < 1) a *= 0.55 + 0.45 * (hash1(i * 13 + Math.floor(env.t * 24), 5) > 0.35 ? 1 : 0.2); // flicker on
      a *= q.b * (0.6 + 0.4 * Math.min(1, depthAt(q.x, q.y) * 2.2)) * dipK;
      // the lit window itself: a crisp, small paper-cut rectangle (2 x 3 px near, smaller toward the limb),
      // tilted with the earth's curvature; no halo, so the dusting reads as windows, not glowing dots
      const hw = q.w * 0.5, hh = q.h * 0.5;
      const cx = q.x + hw, cy = q.y + hh;
      const ax = q.ca * hw, ay = q.sa * hw, bx = -q.sa * hh, by = q.ca * hh;
      c.fillStyle = withAlpha(warm, a);
      c.beginPath();
      c.moveTo(cx - ax - bx, cy - ay - by);
      c.lineTo(cx + ax - bx, cy + ay - by);
      c.lineTo(cx + ax + bx, cy + ay + by);
      c.lineTo(cx - ax + bx, cy - ay + by);
      c.closePath();
      c.fill();
    }
    // a faint aggregate glow over the lit land (the cities' haze), cheap: a few broad strokes
    if (lit > 0.02) {
      const g = c.createLinearGradient(0, LIMB.home.y - 260, 0, LIMB.home.y + 260);
      g.addColorStop(0, withAlpha(m.halo, 0));
      g.addColorStop(0.5, withAlpha(m.halo, 0.03 * lit));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(x0, LIMB.home.y - 260, w, 520);
    }
    c.restore();

    // the home window: one distinct lit rectangle (the one we came from); pulses once to core + a 40 px halo
    const hOn = o.homeOn ?? 1;
    if (hOn > 0) {
      const p = o.home ?? 0;
      const H = HOME;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 10 + 52 * p;
      const g = c.createRadialGradient(H.x, H.y, 0, H.x, H.y, R);
      g.addColorStop(0, withAlpha(m.core, (0.35 + 0.6 * p) * hOn));
      g.addColorStop(0.35, withAlpha(m.halo, (0.12 + 0.3 * p) * hOn));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(H.x - R, H.y - R, 2 * R, 2 * R);
      c.restore();
      c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.6 + 0.4 * p), hOn);
      c.fillRect(H.x - 2, H.y - 3, 4, 6);
      // the pulse: a soft bloom swelling 40 → 120 px and back (no ring outline: a lamp's breath, not a UI ping)
      const rg = o.ring ?? 0;
      if (rg > 0 && rg < 1) {
        const sw = Math.sin(Math.PI * rg);
        const R = 40 + 80 * sw;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(H.x, H.y, 0, H.x, H.y, R);
        g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.42 * sw * hOn));
        g.addColorStop(0.35, withAlpha(m.halo, 0.18 * sw * hOn));
        g.addColorStop(1, withAlpha(m.halo, 0));
        c.fillStyle = g;
        c.fillRect(H.x - R, H.y - R, 2 * R, 2 * R);
        c.restore();
      }
    }
  });
}

/** for shots that need the limb's horizon at an x */
export const limbHorizonY = horizonY;
export type { PaintEnv };
