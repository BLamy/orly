/**
 * neural-net-history — FLORENCE, 12 October 2012 (ch08-s11): the skyline at late-afternoon gold and the
 * generic, overfull hall (the hall itself stays unnamed; only the city's dome and bell towers are drawn).
 *
 *   florenceSkyline(c, env, { x0, x1, y, role? })     rooftops, the ribbed dome on its drum with a lantern, a
 *                                                     slender campanile, a crenellated civic tower, cypresses
 *   ATTENDEES                                         generic 2010s conference-goers (no likeness)
 *   projectorBeam(c, env, { from, to, w0, w1, a })    the dusty cone from the rear of the room to the screen
 */
import type { PaintEnv, PuppetSpec } from '../../../film/contracts';
import { createPuppet } from '../../../film/silhouette/puppet';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;

export interface SkylineOpts {
  x0: number;
  x1: number;
  /** ground line */
  y: number;
  role?: 'set' | 'ink' | 'fg';
  /** draw the landmarks (false = only rooftops, for a nearer rank) */
  landmarks?: boolean;
  seed?: number;
}

const PATHS = new Map<string, Path2D>();
function skylinePath(o: SkylineOpts): Path2D {
  const key = `${o.x0},${o.x1},${o.y},${o.landmarks !== false},${o.seed ?? 3}`;
  const hit = PATHS.get(key);
  if (hit) return hit;
  const p = new Path2D();
  const s = o.seed ?? 3;
  // rooftops: low terracotta houses, shallow gables, chimneys, the odd loggia
  let x = o.x0;
  let i = 0;
  while (x < o.x1) {
    const w = 40 + 60 * hash1(i, s);
    const h = 40 + 46 * hash1(i, s + 1);
    p.rect(x, o.y - h, w + 1, h + 400);
    p.moveTo(x - 2, o.y - h);
    p.lineTo(x + w / 2, o.y - h - 12 - 6 * hash1(i, s + 2));
    p.lineTo(x + w + 2, o.y - h);
    p.closePath();
    if (hash1(i, s + 3) > 0.6) p.rect(x + w * 0.7, o.y - h - 18, 6, 12);
    x += w;
    i++;
  }
  if (o.landmarks !== false) {
    // the dome on its octagonal drum, ribbed, with the lantern on top (x 560)
    const dx = 560, dw = 250, base = o.y - 96;
    p.rect(dx - dw * 0.62, base - 20, dw * 1.24, 140); // the nave roofs below
    p.rect(dx - dw / 2 - 6, base - 62, dw + 12, 62); // the drum
    p.moveTo(dx - dw / 2, base - 62);
    p.bezierCurveTo(dx - dw / 2, base - 62 - dw * 0.62, dx - dw * 0.1, base - 62 - dw * 0.86, dx - 16, base - 62 - dw * 0.88);
    p.lineTo(dx + 16, base - 62 - dw * 0.88);
    p.bezierCurveTo(dx + dw * 0.1, base - 62 - dw * 0.86, dx + dw / 2, base - 62 - dw * 0.62, dx + dw / 2, base - 62);
    p.closePath();
    const top = base - 62 - dw * 0.88;
    p.rect(dx - 14, top - 30, 28, 30); // the lantern
    p.moveTo(dx - 16, top - 30);
    p.lineTo(dx, top - 58);
    p.lineTo(dx + 16, top - 30);
    p.closePath();
    p.rect(dx - 1.5, top - 72, 3, 16);
    p.moveTo(dx + 5, top - 76);
    p.arc(dx, top - 76, 5, 0, Math.PI * 2);
    // the campanile (slender square bell tower, left of the dome)
    const cx = 392;
    p.rect(cx - 24, o.y - 330, 48, 330);
    p.rect(cx - 28, o.y - 342, 56, 12);
    // the civic tower (crenellated, with a projecting gallery and an open belfry) at right
    const tx = 940;
    p.rect(tx - 40, o.y - 130, 150, 130); // the palace block
    for (let k = 0; k < 9; k++) p.rect(tx - 40 + k * 17, o.y - 140, 10, 10);
    p.rect(tx - 21, o.y - 270, 42, 140);
    p.rect(tx - 29, o.y - 290, 58, 22); // the projecting gallery
    for (let k = 0; k < 5; k++) p.rect(tx - 29 + k * 12.5, o.y - 300, 8, 10);
    p.rect(tx - 16, o.y - 340, 6, 50); // the belfry posts
    p.rect(tx + 10, o.y - 340, 6, 50);
    p.rect(tx - 19, o.y - 346, 38, 8);
    for (let k = 0; k < 4; k++) p.rect(tx - 19 + k * 10.5, o.y - 354, 6, 8);
    p.moveTo(tx - 9, o.y - 354);
    p.lineTo(tx, o.y - 384);
    p.lineTo(tx + 9, o.y - 354);
    p.closePath();
    // a few cypresses on the far side of the river
    for (const [cxp, ch] of [[1110, 120], [1138, 96], [210, 110], [1240, 130]] as const) {
      p.moveTo(cxp, o.y - ch);
      p.quadraticCurveTo(cxp + 14, o.y - ch * 0.5, cxp + 8, o.y);
      p.lineTo(cxp - 8, o.y);
      p.quadraticCurveTo(cxp - 14, o.y - ch * 0.5, cxp, o.y - ch);
      p.closePath();
    }
  }
  PATHS.set(key, p);
  return p;
}

export function florenceSkyline(c: C, env: PaintEnv, o: SkylineOpts) {
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(skylinePath(o), 'nonzero');
  if (o.landmarks !== false) {
    // the campanile's belfry openings and the dome's ribs as faint cut-lines (rim, lit side)
    c.strokeStyle = withAlpha(env.mood.rim, 0.14);
    c.lineWidth = 1.2;
    c.beginPath();
    const dx = 560, dw = 250, base = o.y - 96;
    for (const f of [-0.5, 0, 0.5]) {
      c.moveTo(dx + f * dw * 0.5, base - 62);
      c.quadraticCurveTo(dx + f * dw * 0.42, base - 62 - dw * 0.6, dx + f * 24, base - 62 - dw * 0.86);
    }
    c.stroke();
  }
}

// ------------------------------------------------------------------------------------------------ attendees
const A = (o: Partial<PuppetSpec> & { id: string }): PuppetSpec => ({
  height: 318, build: 'average', era: '2010s', wardrobe: 'blazer', hair: 'sidePart', facialHair: 'none', glasses: 'none', hat: 'none',
  profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 }, prop: 'none', details: [], ...o,
});
export const ATTENDEE_SPECS: PuppetSpec[] = [
  A({ id: 'fl-a1', height: 320, wardrobe: 'blazer', hair: 'sidePart', glasses: 'rectangular', profile: { nose: 0.55, brow: 0.5, chin: 0.45, jaw: 0.5 } }),
  A({ id: 'fl-a2', height: 300, build: 'slight', wardrobe: 'cardiganF', hair: 'bob', profile: { nose: 0.42, brow: 0.4, chin: 0.45, jaw: 0.4 } }),
  A({ id: 'fl-a3', height: 328, wardrobe: 'hoodie', hair: 'messy' }),
  A({ id: 'fl-a4', height: 322, build: 'stocky', wardrobe: 'polo', hair: 'receding', facialHair: 'beard', profile: { nose: 0.52, brow: 0.58, chin: 0.5, jaw: 0.6 } }),
  A({ id: 'fl-a5', height: 304, wardrobe: 'blouseTrousers', hair: 'ponytail', profile: { nose: 0.4, brow: 0.42, chin: 0.44, jaw: 0.38 } }),
  A({ id: 'fl-a6', height: 334, build: 'tall', wardrobe: 'quarterZip', hair: 'crewCut', glasses: 'heavy' }),
  A({ id: 'fl-a7', height: 316, wardrobe: 'shortSleeve', hair: 'curly', profile: { nose: 0.48, brow: 0.5, chin: 0.52, jaw: 0.5 } }),
  A({ id: 'fl-a8', height: 312, wardrobe: 'tshirt', hair: 'shaggy', facialHair: 'stubble' }),
];
export const ATTENDEES = ATTENDEE_SPECS.map((s) => createPuppet(s));

// ------------------------------------------------------------------------------------------------ the beam
export interface BeamOpts {
  /** fade the beam out over its last ~18 % (default false) */
  fadeEnd?: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** half-widths at the lens and at the screen */
  w0: number;
  w1: number;
  a: number;
}
/** the projector's dusty cone of light (additive), from the rear of the room to the screen */
export function projectorBeam(c: C, env: PaintEnv, o: BeamOpts) {
  if (o.a <= 0.003) return;
  const m = env.mood;
  const dx = o.to.x - o.from.x, dy = o.to.y - o.from.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(o.from.x, o.from.y, o.to.x, o.to.y);
  const col = mixLab(m.halo, m.core, 0.35);
  g.addColorStop(0, withAlpha(col, 0.2 * o.a));
  g.addColorStop(0.5, withAlpha(col, 0.08 * o.a));
  if (o.fadeEnd) {
    // the beam thins to nothing before its end (no seam where it would meet a lit surface)
    g.addColorStop(0.82, withAlpha(col, 0.1 * o.a));
    g.addColorStop(1, withAlpha(col, 0));
  } else g.addColorStop(1, withAlpha(col, 0.13 * o.a));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(o.from.x + nx * o.w0, o.from.y + ny * o.w0);
  c.lineTo(o.to.x + nx * o.w1, o.to.y + ny * o.w1);
  c.lineTo(o.to.x - nx * o.w1, o.to.y - ny * o.w1);
  c.lineTo(o.from.x - nx * o.w0, o.from.y - ny * o.w0);
  c.closePath();
  c.fill();
  c.restore();
}
