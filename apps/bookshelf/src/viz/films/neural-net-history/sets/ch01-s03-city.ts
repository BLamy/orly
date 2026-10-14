/**
 * neural-net-history — the 2026 MEGACITY for ch01-s03's rise (replaces the kit skyline's tiered crowns,
 * which read as a fantasy city).
 *
 * Contemporary towers only: flat roofs with parapets and plant rooms, off-centre setbacks, antenna masts of
 * varied height, slender glass slabs (a lighter mullion hairline and an occasional raked top), a few wide
 * slab blocks. Windows are a seeded scatter over each facade's grid (about 30% of cells, three brightness
 * levels, cyan only: the film's one accent), so no two facades light alike and nothing reads as clip-art.
 *
 *   city2026(c, { x0, x1, y, height, seed, lit, ground }, env)    paint one plane of towers (bake it)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/silhouette/atmosphere';

export interface City2026Opts {
  x0: number;
  x1: number;
  /** ground line y */
  y: number;
  /** tallest tower height */
  height: number;
  seed: number;
  /** fraction of window cells lit (about 0.3) */
  lit: number;
  /** extend the base down by this much */
  ground: number;
}

interface Geom {
  solid: Path2D;
  glass: Path2D;
  lights: [Path2D, Path2D, Path2D];
  warm: Path2D;
}
const cache = new Map<string, Geom>();

function build(o: City2026Opts): Geom {
  let n = 0;
  const R = () => hash1(n++, o.seed * 131 + 7);
  const solid = new Path2D();
  const glass = new Path2D();
  const lights: [Path2D, Path2D, Path2D] = [new Path2D(), new Path2D(), new Path2D()];
  const warm = new Path2D();
  const H = o.height;
  const u = H / 220;
  solid.rect(o.x0, o.y - 2, o.x1 - o.x0, o.ground + 2);
  const grid = (x: number, top: number, w: number, bottom: number, cw: number, rh: number, litK: number) => {
    cw = Math.max(2.4, cw);
    rh = Math.max(3.2, rh);
    const cols = Math.max(1, Math.floor((w - 3) / cw));
    const rows = Math.max(0, Math.floor((bottom - top - 4) / rh));
    const ox = x + (w - cols * cw) / 2;
    // some floors are dark offices, some busy: a per-row bias, then a per-cell draw
    for (let r = 0; r < rows; r++) {
      const rowBias = R();
      const p = o.lit * litK * (rowBias < 0.3 ? 0.25 : rowBias > 0.85 ? 2.1 : 1.05);
      for (let k = 0; k < cols; k++) {
        if (R() >= p) continue;
        const lv = R();
        // cyan only (the film's one accent); a horizontal slit per lit office, not a square dot
        void R();
        const target = lights[lv < 0.5 ? 0 : lv < 0.85 ? 1 : 2];
        target.rect(ox + k * cw + 0.4, top + 3 + r * rh, cw * 0.72, Math.max(1.1, rh * 0.26));
      }
    }
  };
  let x = o.x0 - 10;
  while (x < o.x1) {
    const kindR = R();
    const wide = R() < 0.14;
    const w = (18 + R() * 36) * u * (wide ? 2 : 1);
    const f = (x - o.x0) / (o.x1 - o.x0);
    const peak = Math.exp(-(((f - 0.5) / 0.3) ** 2));
    const h = H * (0.22 + 0.32 * R() + 0.46 * peak * R()) * (wide ? 0.6 : 1);
    const top = o.y - h;
    if (kindR < 0.24 && !wide) {
      // glass slab: slender, a raked or flush top, lighter mullion hairlines (no punched windows: a few lit bands)
      const rake = R() < 0.5 ? w * (0.25 + R() * 0.5) : 0;
      const left = R() < 0.5;
      const p = new Path2D();
      p.moveTo(x, o.y);
      p.lineTo(x, top + (left ? rake : 0));
      p.lineTo(x + w, top + (left ? 0 : rake));
      p.lineTo(x + w, o.y);
      p.closePath();
      solid.addPath(p);
      for (let mx = x + 3 * u; mx < x + w - 1; mx += 4.5 * u) glass.rect(mx, top + rake + 2, 0.7, h - rake - 2);
      grid(x, top + rake + 4, w, o.y, 4.5 * u, 4.2 * u, 0.7);
      if (R() < 0.35) solid.rect(x + w * 0.5 - 0.5 * u, top - 22 * u, 1 * u, 24 * u);
    } else if (kindR < 0.52) {
      // setback tower: one or two off-centre setbacks, a flat roof with a plant room
      solid.rect(x, top + h * 0.3, w, h * 0.7 + 1);
      grid(x, top + h * 0.3, w, o.y, 4.4 * u, 5.4 * u, 1);
      const w2 = w * (0.55 + R() * 0.3);
      const x2 = x + (R() < 0.5 ? 0 : w - w2);
      solid.rect(x2, top + h * 0.08, w2, h * 0.22 + 1);
      grid(x2, top + h * 0.08, w2, top + h * 0.3, 4.4 * u, 5.4 * u, 1);
      const w3 = w2 * (0.45 + R() * 0.3);
      const x3 = x2 + (w2 - w3) * R();
      solid.rect(x3, top, w3, h * 0.08 + 1);
      if (R() < 0.6) solid.rect(x3 + w3 * (0.2 + 0.5 * R()) - 0.6 * u, top - (14 + 30 * R()) * u, 1.2 * u, (14 + 30 * R()) * u + 1);
    } else {
      // flat-roofed block: parapet, rooftop units, sometimes a mast or two
      solid.rect(x, top, w, h + 1);
      solid.rect(x - 1 * u, top, w + 2 * u, 2 * u);
      grid(x, top + 2 * u, w, o.y, (wide ? 5.2 : 4.4) * u, 5.4 * u, 1);
      const units = 1 + Math.floor(R() * 3);
      for (let k = 0; k < units; k++) {
        const uw = (4 + R() * 9) * u, uh = (3 + R() * 6) * u;
        solid.rect(x + (w - uw) * R(), top - uh, uw, uh + 1);
      }
      // a water tank on stilts (a paper-cut rooftop signature): splayed legs, a barrel, a conical cap
      if (R() < 0.55 && w > 22 * u) {
        const tw = (6 + R() * 4) * u, tx = x + 3 * u + (w - tw - 6 * u) * R();
        const legH = (4 + R() * 3) * u, bh = tw * 0.9, base = top;
        const tank = new Path2D();
        tank.moveTo(tx - 0.8 * u, base);
        tank.lineTo(tx + 0.4 * u, base - legH);
        tank.lineTo(tx + 1.4 * u, base - legH);
        tank.lineTo(tx + 0.6 * u, base);
        tank.closePath();
        tank.moveTo(tx + tw + 0.8 * u, base);
        tank.lineTo(tx + tw - 0.4 * u, base - legH);
        tank.lineTo(tx + tw - 1.4 * u, base - legH);
        tank.lineTo(tx + tw - 0.6 * u, base);
        tank.closePath();
        tank.rect(tx, base - legH - bh, tw, bh + 0.5);
        tank.moveTo(tx - 0.6 * u, base - legH - bh);
        tank.lineTo(tx + tw / 2, base - legH - bh - tw * 0.38);
        tank.lineTo(tx + tw + 0.6 * u, base - legH - bh);
        tank.closePath();
        solid.addPath(tank);
      }
      if (R() < 0.45) {
        const masts = 1 + (R() < 0.35 ? 1 : 0);
        for (let k = 0; k < masts; k++) {
          const mh = (16 + R() * 46) * u;
          solid.rect(x + w * (0.25 + 0.5 * R()) - 0.55 * u, top - mh, 1.1 * u, mh + 1);
        }
      }
    }
    x += w + (R() < 0.35 ? (2 + R() * 10) * u : 0.5 * u);
  }
  return { solid, glass, lights, warm };
}

export function city2026(c: CanvasRenderingContext2D, o: City2026Opts, env: PaintEnv) {
  const key = `${o.x0},${o.x1},${o.y},${o.height},${o.seed},${o.lit},${o.ground}`;
  let g = cache.get(key);
  if (!g) {
    g = build(o);
    cache.set(key, g);
  }
  const m = env.mood;
  const haze = env.layer.haze;
  // a step toward ink, so each rank reads as a cut silhouette against the fog behind it
  c.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.32);
  c.fill(g.solid);
  c.fillStyle = withAlpha(mixLab(env.fill('set'), m.rim, 0.35), 0.5);
  c.fill(g.glass);
  const k = 1 - haze * 0.45;
  const cool = mixLab(m.halo, m.core, 0.25);
  c.fillStyle = withAlpha(cool, 0.32 * k);
  c.fill(g.lights[0]);
  c.fillStyle = withAlpha(cool, 0.58 * k);
  c.fill(g.lights[1]);
  c.fillStyle = withAlpha(mixLab(cool, m.core, 0.5), 0.9 * k);
  c.fill(g.lights[2]);

}
