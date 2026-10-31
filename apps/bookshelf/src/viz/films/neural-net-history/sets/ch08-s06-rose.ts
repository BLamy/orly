/**
 * ch08-s06 / ch08-s09 — the cathedral of ch08-s05 (sets/ch08-s05-cathedral), seen again: its rose window's glass
 * becomes the 96 first-layer stencils, and the building is the one the audience just watched rise.
 *
 *   GL                         the rose window's glass (the photograph's disk in s05): (640, 560), r 48
 *   SLOTS                      96 glass cells (lead-came grid inside the disk; 48 left of the axis, 48 right)
 *   S06_TILE(j)                slot → tile in s06's run (grey and colour tiles interleaved across the glass)
 *   S09_TILE(j)                slot → tile in s09's sorted run (left slots hold GPU 1's 48, right GPU 2's)
 *   jewel(q)                   s05's jewelled ring: tile q's position, angle and size (the 96 tiny tiles)
 *   JEWEL_SLOT[q]              the glass slot jewel q flies into (angle-matched, so they travel inward)
 *   jewelSprite()              s05's ring tiles (tileArt, learned) as one sprite sheet
 *   glassPane(c, env, o)       the backlit glass: ink tracery, warm light behind, tiles laid over it (hard-light)
 *   fullCathedral(o?)          a CathedralState for the finished cathedral (all built, s05's resting light)
 *   AXIS / beadAt(u) / stageSpans   the messenger's road: crown → halls → five courses → plinth → glass
 *   landscape(f, id, night?)   s05's far ridge and bare-tree band (same seeds), optional stars
 *   porchColumns(f, id, cam)   two near porch columns at the frame edges in the wide view (a near plane)
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { forestBand, ridgePath } from '../../../film';
import { stars } from '../../../film/silhouette/nature';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hash1 } from '../../../film/silhouette/atmosphere'; // 0..1
import { huskyCanvas, tileArt } from './ch08-s01-kit';
import { CAT, COURSES, HALLS, CROWN, type CathedralState } from './ch08-s05-cathedral';
import type { TileAtlas } from './ch08-s06-filters';

type C = CanvasRenderingContext2D;

export const GL = { x: CAT.rose.x, y: CAT.rose.y, r: CAT.rose.r };

// ------------------------------------------------------------------------------------------------ glass cells
export interface Slot {
  j: number;
  x: number;
  y: number;
  half: 0 | 1;
  ang: number;
}
export const CELL = 7.8;
export const SLOTS: Slot[] = (() => {
  // the 48 cells of the left half nearest the centre (mirror-symmetric), then mirrored to the right
  const cand: { x: number; y: number; d: number }[] = [];
  for (let j = -7; j < 7; j++)
    for (let i = 0; i < 7; i++) {
      const x = -(i + 0.5) * CELL;
      const y = (j + 0.5) * CELL;
      cand.push({ x, y, d: Math.hypot(x, y) + 0.001 * Math.abs(y) });
    }
  cand.sort((a, b) => a.d - b.d);
  const left = cand.slice(0, 48).sort((a, b) => a.y - b.y || a.x - b.x);
  const out: Slot[] = [];
  left.forEach((p) => out.push({ j: 0, x: GL.x + p.x, y: GL.y + p.y, half: 0, ang: Math.atan2(p.y, p.x) }));
  left.forEach((p) => out.push({ j: 0, x: GL.x - p.x, y: GL.y + p.y, half: 1, ang: Math.atan2(p.y, -p.x) }));
  out.forEach((s, j) => (s.j = j));
  return out;
})();

/** s06's run: a seeded shuffle, so grey and colour tiles interleave over the whole glass */
const PERM: number[] = (() => {
  const a = Array.from({ length: 96 }, (_, k) => k);
  for (let i = 95; i > 0; i--) {
    const r = Math.floor(hash1(i, 6611) * (i + 1));
    [a[i], a[r]] = [a[r], a[i]];
  }
  return a;
})();
export const S06_TILE = (j: number) => PERM[j];
/** s09's run: slot j of the left half holds tile j (0..47, colour-agnostic), the right half 48..95 */
export const S09_TILE = (j: number) => j;

// ------------------------------------------------------------------------------------------------ s05's jewels
export function jewel(q: number): { x: number; y: number; a: number; size: number } {
  const P = CAT.rose;
  const ring = q < 48 ? 0 : 1;
  const k = q % 48;
  const r = ring === 0 ? P.r + 9 : P.r + 21;
  const a = (k / 48) * Math.PI * 2 + ring * 0.065;
  return { x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, a, size: ring === 0 ? 6.4 : 8 };
}
export const JEWEL_SLOT: number[] = (() => {
  const js = Array.from({ length: 96 }, (_, q) => ({ q, a: jewel(q).a % (Math.PI * 2) }));
  const ss = SLOTS.map((s) => ({ j: s.j, a: (s.ang + Math.PI * 2) % (Math.PI * 2) }));
  js.sort((x, y) => x.a - y.a);
  ss.sort((x, y) => x.a - y.a);
  const out = new Array<number>(96);
  js.forEach((jw, i) => (out[jw.q] = ss[i].j));
  return out;
})();

let SPRITE: HTMLCanvasElement | null = null;
export function jewelSprite(): HTMLCanvasElement {
  if (SPRITE) return SPRITE;
  const cv = document.createElement('canvas');
  cv.width = 12 * 11;
  cv.height = 8 * 11;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(cv.width, cv.height);
  for (let q = 0; q < 96; q++) {
    const px = tileArt(q, 1);
    const ox = (q % 12) * 11, oy = Math.floor(q / 12) * 11;
    px.forEach((col, k) => {
      const o = ((oy + Math.floor(k / 11)) * cv.width + ox + (k % 11)) * 4;
      img.data[o] = col[0] * 255;
      img.data[o + 1] = col[1] * 255;
      img.data[o + 2] = col[2] * 255;
      img.data[o + 3] = 255;
    });
  }
  g.putImageData(img, 0, 0);
  SPRITE = cv;
  return cv;
}

/** draw one tile of an atlas (16-column layout, 11 × 11 texels) crisp, centred at (x, y) */
export function drawTile(c: C, atlas: TileAtlas, k: number, x: number, y: number, size: number, rot = 0): void {
  const sx = (k % 16) * 11;
  const sy = Math.floor(k / 16) * 11;
  c.save();
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.imageSmoothingEnabled = false;
  c.drawImage(atlas.canvas, sx, sy, 11, 11, -size / 2, -size / 2, size, size);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the glass
export interface GlassOpts {
  atlas: TileAtlas;
  /** slot → tile index */
  tile: (j: number) => number;
  /** 0..1 how present each slot's tile is (cells without a tile show the bare warm glass) */
  cellA?: (j: number) => number;
  /** 0..1 the husky photograph laid over the glass (s05's window) */
  photo?: number;
  /** strength of the light behind the glass */
  light?: number;
  /** extra light per slot (a passing bead, a 'land' flash) */
  lift?: (j: number) => number;
  /** the light behind the glass, centre → mid → edge (default: the mood's halo and core) */
  base?: [string, string, string];
}

export function glassPane(c: C, env: PaintEnv, o: GlassOpts): void {
  const m = env.mood;
  const L = o.light ?? 1;
  c.save();
  c.beginPath();
  c.arc(GL.x, GL.y, GL.r + 0.6, 0, Math.PI * 2);
  c.clip();
  // lead and stone behind the cells
  c.fillStyle = env.fill('ink');
  c.fillRect(GL.x - GL.r - 2, GL.y - GL.r - 2, GL.r * 2 + 4, GL.r * 2 + 4);
  // the light behind the glass: brightest at the centre (a practical: the dawn sun through the window)
  const g = c.createRadialGradient(GL.x, GL.y - 6, 2, GL.x, GL.y, GL.r * 1.05);
  const bs = o.base ?? [mixLab(m.halo, m.core, 0.75 * L), mixLab(m.halo, m.core, 0.3 * L), mixLab(m.halo, m.set, 0.5)];
  g.addColorStop(0, bs[0]);
  g.addColorStop(0.6, bs[1]);
  g.addColorStop(1, bs[2]);
  const pad = 0.45;
  c.fillStyle = g;
  for (const s of SLOTS) c.fillRect(s.x - CELL / 2 + pad, s.y - CELL / 2 + pad, CELL - pad * 2, CELL - pad * 2);
  // the tiles, as stained glass the light passes through
  // hard-light: a tile's mid grey leaves the light as it is, darker texels dim it, lighter ones brighten it
  c.globalCompositeOperation = 'hard-light';
  for (const s of SLOTS) {
    const a = o.cellA ? o.cellA(s.j) : 1;
    if (a <= 0.003) continue;
    c.globalAlpha = Math.min(1, a);
    const sx = (o.tile(s.j) % 16) * 11;
    const sy = Math.floor(o.tile(s.j) / 16) * 11;
    c.imageSmoothingEnabled = false;
    c.drawImage(o.atlas.canvas, sx, sy, 11, 11, s.x - CELL / 2 + pad, s.y - CELL / 2 + pad, CELL - pad * 2, CELL - pad * 2);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  // per-slot lifts (a tug, a landing)
  if (o.lift) {
    c.globalCompositeOperation = 'lighter';
    for (const s of SLOTS) {
      const v = o.lift(s.j);
      if (v <= 0.01) continue;
      c.fillStyle = withAlpha(m.core, 0.45 * Math.min(1, v));
      c.fillRect(s.x - CELL / 2 + pad, s.y - CELL / 2 + pad, CELL - pad * 2, CELL - pad * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }
  // the photograph of s05, laid over the glass, fading as the stencils take its place
  if ((o.photo ?? 0) > 0.003) {
    c.globalAlpha = o.photo!;
    c.imageSmoothingEnabled = true;
    c.drawImage(huskyCanvas(128), GL.x - GL.r, GL.y - GL.r, GL.r * 2, GL.r * 2);
    c.globalAlpha = 1;
  }
  c.restore();
  // a soft bloom of the light through the glass
  glow(c, GL.x, GL.y - 4, GL.r * 1.1, m.core, 0.1 * L);
  // the inner tracery ring (s05's)
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(GL.x, GL.y, GL.r, 0, Math.PI * 2);
  c.stroke();
}

// ------------------------------------------------------------------------------------------------ cathedral state
export function fullCathedral(o: Partial<CathedralState> = {}): CathedralState {
  return {
    course: [1, 1, 1, 1, 1],
    hall: [1, 1],
    crown: 1,
    tiles: -10, // s05 draws no ring tiles (its hash is signed, so 0 would leave faint ghosts)
    lit: [0.35, 0.35, 0.35, 0.35, 0.35, 0.6, 0.6, 0.3],
    threads: 1,
    feed: 0,
    pool: null,
    vignette: { kind: null, k: 0 },
    t: 0,
    ...o,
  };
}

// ------------------------------------------------------------------------------------------------ the messenger's road
/** the axis, top to bottom: the crown's gable to the glass centre */
export const AXIS = { x: CAT.cx, y0: 22, y1: GL.y };
/** stage spans along the axis: [top, bottom, lit index, kind, index] */
export const stageSpans: { y0: number; y1: number; lit: number; kind: 'crown' | 'hall' | 'course'; i: number }[] = [
  { y0: CROWN.y0, y1: CROWN.y1, lit: 7, kind: 'crown', i: 0 },
  { y0: HALLS[1].y0, y1: HALLS[1].y1, lit: 6, kind: 'hall', i: 1 },
  { y0: HALLS[0].y0, y1: HALLS[0].y1, lit: 5, kind: 'hall', i: 0 },
  ...[4, 3, 2, 1, 0].map((k) => ({ y0: COURSES[k].y0, y1: COURSES[k].y1, lit: k, kind: 'course' as const, i: k })),
];
export const beadAt = (u: number) => ({ x: AXIS.x, y: AXIS.y0 + (AXIS.y1 - AXIS.y0) * u });
/** the run fraction at which the bead reaches world y */
export const beadU = (y: number) => (y - AXIS.y0) / (AXIS.y1 - AXIS.y0);

// ------------------------------------------------------------------------------------------------ surroundings
/** s05's landscape (same seeds, so the place is the same place), plus stars at night */
export function landscape(f: Frame, id: string, night = false): void {
  f.layer('L1', (c, env) => {
    if (night) stars(c, { x: -1200, y: -400, w: 3600, h: 900, count: 260, seed: 908, twinkle: 0.35 }, env);
    f.cached(`${id}/rose-L1/${env.mood.id}`, 3600, 1400, (g) => {
      g.translate(1200, 400);
      g.fillStyle = env.fill('set');
      g.fill(ridgePath({ x0: -1200, x1: 2400, y: 560, amp: 90, seed: 857, scale: 320, ground: 900 }));
      g.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.3);
      g.fillRect(-1200, 600, 3600, 800);
    })(c, -1200, -400);
  });
  f.layer('L2', (c, env) => {
    f.cached(`${id}/rose-L2/${env.mood.id}`, 3200, 1200, (g) => {
      g.translate(1000, 300);
      forestBand(g, { x0: -1000, x1: 2200, y: 640, h: 120, kind: 'bare', density: 2, seed: 858 }, env);
      g.fillStyle = env.fill('set');
      g.fillRect(-1000, 636, 3200, 600);
    })(c, -1000, -300);
  });
}

/** s05's near churchyard wall (L5, blurred) */
export function churchyardWall(f: Frame, cam: Camera3): void {
  if (cam.z > 420) return;
  f.layer('L5', (c, env) => {
    c.fillStyle = env.fill('fg');
    c.fillRect(-900, 712, 3100, 400);
    for (let x = -900; x < 2200; x += 34) c.fillRect(x, 704, 18, 12);
  });
}

const NEAR_Z = 560;
/** two porch columns close to the lens: at the frame edges in the wide view, sliding out as the camera pushes in */
export function porchColumns(f: Frame, id: string, cam: Camera3): void {
  if (cam.z > NEAR_Z - 300) return;
  const spec: LayerSpec = { id: 'N5', z: NEAR_Z, haze: 0, blur: 5 };
  f.layer(spec, (c, env) => {
    f.cached(`${id}/porch/${env.mood.id}`, 1600, 1500, (g) => {
      g.translate(160, 400);
      g.fillStyle = env.fill('fg');
      for (const cx of [44, 1240]) {
        // shaft with an attached colonnette, a moulded capital and a base
        g.fillRect(cx - 32, -400, 64, 1500);
        g.fillRect(cx - 44, 132, 88, 16);
        g.fillRect(cx - 40, 150, 80, 8);
        g.fillRect(cx - 48, 660, 96, 22);
        g.fillRect(cx + (cx < 640 ? 30 : -42), -400, 12, 1500);
      }
    })(c, -160, -400);
  });
}

/** a world point on the action plane → screen, for a camera */
export function onScreen(cam: Camera3, x: number, y: number): { x: number; y: number; k: number } {
  const k = 1000 / (1000 - cam.z);
  return { x: 640 + (x - cam.x) * k, y: 360 + (y - cam.y) * k, k };
}
/** a screen point → action-plane world, for a camera */
export function toWorld(cam: Camera3, sx: number, sy: number): { x: number; y: number; k: number } {
  const k = 1000 / (1000 - cam.z);
  return { x: cam.x + (sx - 640) / k, y: cam.y + (sy - 360) / k, k };
}

/** the jewel band once its jewels have gone into the glass: plain, darker amber glass in s05's spoked tracery */
export function ringGlass(c: C, env: PaintEnv, a: number, dark = 0): void {
  if (a <= 0.003) return;
  const m = env.mood;
  const P = CAT.rose;
  c.save();
  c.globalAlpha *= a;
  const g = c.createRadialGradient(P.x, P.y, P.r, P.x, P.y, P.r + 30);
  g.addColorStop(0, mixLab(mixLab(m.halo, m.set, 0.45), m.ink, dark));
  g.addColorStop(1, mixLab(mixLab(m.halo, m.set, 0.7), m.ink, dark));
  c.fillStyle = g;
  c.beginPath();
  c.arc(P.x, P.y, P.r + 30, 0, Math.PI * 2);
  c.arc(P.x, P.y, P.r + 1, 0, Math.PI * 2, true);
  c.fill();
  // s05's tracery over it: the outer ring and 16 spokes
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 3;
  c.beginPath();
  c.arc(P.x, P.y, P.r + 30, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 1.4;
  c.strokeStyle = mixLab(env.fill('ink'), m.fg, 0.4);
  c.beginPath();
  for (let k = 0; k < 16; k++) {
    const an = (k / 16) * Math.PI * 2;
    c.moveTo(P.x + Math.cos(an) * (P.r + 2), P.y + Math.sin(an) * (P.r + 2));
    c.lineTo(P.x + Math.cos(an) * (P.r + 29), P.y + Math.sin(an) * (P.r + 29));
  }
  c.stroke();
  c.restore();
}

/** the cathedral's forecourt: paving from the plinth's foot toward the lens (ink, lightly hazed), so the ground is
 *  a surface lights can fall on instead of the flat far field */
export function forecourt(c: C, env: PaintEnv): void {
  const m = env.mood;
  const G = CAT.ground;
  const g = c.createLinearGradient(0, G, 0, G + 160);
  g.addColorStop(0, mixLab(env.fill('set'), m.ink, 0.45));
  g.addColorStop(1, mixLab(env.fill('set'), m.ink, 0.8));
  c.fillStyle = g;
  c.fillRect(-2400, G, 6000, 1400);
  // flagstone joints, converging toward the door (a little perspective)
  c.strokeStyle = withAlpha(m.rim, 0.07);
  c.lineWidth = 1;
  c.beginPath();
  for (let r = 0; r < 6; r++) {
    const y = G + 6 + r * r * 5 + r * 8;
    c.moveTo(-2400, y);
    c.lineTo(3600, y);
  }
  for (let i = -14; i <= 14; i++) {
    c.moveTo(CAT.cx + i * 44, G);
    c.lineTo(CAT.cx + i * 150, G + 400);
  }
  c.stroke();
}
