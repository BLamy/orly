/**
 * neural-net-history — THE HALL OF WORD-SLIPS (ch10-s01, ch10-s04, ch10-s05): the inside of a reader that
 * must take a sentence one word at a time. A long, high hall at dusk; down its length a beam carries a line
 * of hanging paper word-slips (dozens), each with a small wick-cup at its foot; tall arched windows along
 * the left wall back the line; a great arched window closes the far end.
 *
 * The hall is a TRUE PERSPECTIVE set (its own pinhole camera with a yaw, so the hall axis recedes to a
 * vanishing point right of centre). Shots keep the Frame camera at CAMERA3_HOME (every layer is then
 * rest-screen = screen) and move the HALL camera instead, which gives real parallax down the length:
 *
 *   const cam: HallCam = { x, y, z }                    world point of the eye (y down; floor y = HALL.floor)
 *   hallProject(cam, x, y, z)  → { x, y, s, vz }        screen point, scale (px per world unit), view depth
 *   hallArch(c, cam, env, { light })                    walls with window HOLES (backlight shows through),
 *                                                       floor (planks converging on the VP, hazed by depth), ceiling trusses,
 *                                                       the end wall, the slip beam and its hangers
 *   slipAt(i) → { x, y, z }                             slip i's top-centre (world)
 *   hallSlip(c, cam, env, i, { lit, own, wick, text })  one slip, billboarded at its depth, hazed by depth
 *   slipScreen(cam, i)                                  { x, y (top), w, h, s, wick: {x, y} } on screen
 *   scribe / scribeDraw(c, cam, env, { x, z, pose, facing, lamp })   the cut-paper scribe (no real person)
 *   hallHaze(vz)                                        atmospheric mix 0..0.9 by view depth
 *
 * Words: HALL_WORDS (an illustrative sentence; no claim). Slips 1–4 read crossed · the · river · bank,
 * the four words ch10-s06 works through.
 */
import type { PaintEnv, Pose, Facing, Palette } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { FONT, capPx1080 } from '../../../film/silhouette/type';
import { createPuppet, PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

type C = CanvasRenderingContext2D;

export const HALL = {
  /** focal length (px at view depth F = 1 world unit per px) */
  F: 1000,
  /** screen y of the horizon (eye level) */
  HY: 418,
  /** yaw of the hall axis to the right of the view direction (radians) */
  yaw: (24 * Math.PI) / 180,
  floor: 330,
  ceil: -1320,
  wallL: -980,
  wallR: 1150,
  end: 12400,
  /** the slip beam */
  beamX: -330,
  beamY: -196,
  /** slips: top (hung 14 below the beam), size, pitch along the hall */
  slipTop: -182,
  slipW: 66,
  slipH: 132,
  z0: 1000,
  pitch: 180,
  N: 62,
  /** the wick cup under each slip (flame point) */
  wickDy: 26,
} as const;

export const HALL_WORDS = (
  'we crossed the river bank at dusk and walked on along the water until the lamps of the town came on one by one ' +
  'and the slow boats turned for home and every window held a little of the light that was left of the day'
).split(' ');

export interface HallCam {
  x: number;
  y: number;
  z: number;
}

const CY = Math.cos(HALL.yaw);
const SY = Math.sin(HALL.yaw);
const CLIP = 120;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** view coordinates (vx right, vz depth) of a world point */
function view(cam: HallCam, x: number, z: number): [number, number] {
  const dx = x - cam.x;
  const dz = z - cam.z;
  return [dx * CY + dz * SY, -dx * SY + dz * CY];
}

export function hallProject(cam: HallCam, x: number, y: number, z: number): { x: number; y: number; s: number; vz: number } {
  const [vx, vz] = view(cam, x, z);
  const d = Math.max(CLIP * 0.5, vz);
  const s = HALL.F / d;
  return { x: 640 + vx * s, y: HALL.HY + (y - cam.y) * s, s, vz };
}

/** the vanishing point of the hall axis */
export const HALL_VP = { x: 640 + HALL.F * Math.tan(HALL.yaw), y: HALL.HY };

/** atmospheric mix by view depth */
export function hallHaze(vz: number): number {
  return Math.min(0.9, Math.max(0, 1 - Math.exp(-(vz - 500) / 5200)));
}

type P3 = [number, number, number];
/** clip a world polygon to the near plane (vz ≥ CLIP), project, and append to a path */
function polyPath(p: Path2D, cam: HallCam, pts: P3[]): boolean {
  const vs = pts.map(([x, y, z]) => {
    const [vx, vz] = view(cam, x, z);
    return [vx, y - cam.y, vz] as P3;
  });
  const out: P3[] = [];
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i];
    const b = vs[(i + 1) % vs.length];
    const ain = a[2] >= CLIP;
    const bin = b[2] >= CLIP;
    if (ain) out.push(a);
    if (ain !== bin) {
      const u = (CLIP - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, CLIP]);
    }
  }
  if (out.length < 3) return false;
  out.forEach(([vx, vy, vz], i) => {
    const s = HALL.F / vz;
    const X = Math.max(-2e4, Math.min(2e4, 640 + vx * s));
    const Y = Math.max(-2e4, Math.min(2e4, HALL.HY + vy * s));
    if (i === 0) p.moveTo(X, Y);
    else p.lineTo(X, Y);
  });
  p.closePath();
  return true;
}

/** a depth-graded fill for a surface: stops at view depths along a screen line from `a` (near) to the VP */
function depthGradient(c: C, cam: HallCam, a: { x: number; y: number }, b: { x: number; y: number }, near: string, far: string, depthOf: (u: number) => number) {
  const g = c.createLinearGradient(a.x, a.y, b.x, b.y);
  for (let k = 0; k <= 6; k++) {
    const u = k / 6;
    g.addColorStop(u, mixLab(near, far, hallHaze(depthOf(u))));
  }
  return g;
}

export const WIN = {
  /** left-wall windows: centres along z, half-width (z), sill and spring heights, arch rise */
  first: 1500,
  every: 1150,
  half: 230,
  sill: 230,
  spring: -760,
  rise: 240,
};

function archPts(zc: number, half: number, sill: number, spring: number, rise: number, X: number): P3[] {
  const pts: P3[] = [[X, sill, zc - half], [X, spring, zc - half]];
  const n = 8;
  for (let i = 1; i < n; i++) {
    const a = Math.PI - (Math.PI * i) / n;
    pts.push([X, spring - Math.sin(a) * rise, zc + Math.cos(a) * half]);
  }
  pts.push([X, spring, zc + half], [X, sill, zc + half]);
  return pts;
}

/** a window's tracery on wall plane X: two mullions (three lights) and two transoms, and in the arch head an oculus
 *  ring with a cross, carried on two short struts from the outer mullions (cut-paper gothic, like the reference) */
function tracery(mull: Path2D, ring: Path2D, cam: HallCam, X: number, zc: number) {
  const { half, sill, spring, rise } = WIN;
  const bar = (y0: number, y1: number, za: number, zb: number) => polyPath(mull, cam, [[X, y0, za], [X, y0, zb], [X, y1, zb], [X, y1, za]]);
  const third = half / 3;
  for (const dz of [-third, third]) bar(sill, spring - 20, zc + dz - 10, zc + dz + 10);
  for (const ty of [-110, -470]) bar(ty, ty + 14, zc - half, zc + half);
  bar(spring - 8, spring + 8, zc - half, zc + half);
  // the oculus in the head
  const ry = spring - rise * 0.5, R = Math.min(rise * 0.4, half * 0.48);
  const circ = (r: number): P3[] => Array.from({ length: 18 }, (_, i) => [X, ry + Math.sin((i / 18) * Math.PI * 2) * r, zc + Math.cos((i / 18) * Math.PI * 2) * r] as P3);
  polyPath(ring, cam, circ(R));
  polyPath(ring, cam, circ(R - 13));
  bar(ry - R, ry + R, zc - 6, zc + 6);
  bar(ry - 6, ry + 6, zc - R, zc + R);
  // struts from the outer mullions up to the ring
  for (const dz of [-third, third]) polyPath(mull, cam, [[X, spring - 20, zc + dz - 8], [X, spring - 20, zc + dz + 8], [X, ry + R * 0.55, zc + dz * 0.55 + 8], [X, ry + R * 0.55, zc + dz * 0.55 - 8]]);
}

/** the cast window beams: from each left window a pale shaft slants down into the hall and lands on its floor pool,
 *  split into three by the mullions (additive, faint, hazed by depth) */
function windowShafts(c: C, cam: HallCam, m: Palette, k: number) {
  const { wallL, floor, end } = HALL;
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  for (let zc = WIN.first; zc < end - 400; zc += WIN.every) {
    const top = hallProject(cam, wallL, WIN.spring, zc);
    if (top.vz < CLIP * 2) continue;
    const land = hallProject(cam, wallL + 700, floor, zc + 380);
    if (Math.max(top.x, land.x) < -200 || Math.min(top.x, land.x) > 1480) continue;
    const hz = 1 - 0.8 * hallHaze(top.vz);
    const g = c.createLinearGradient(top.x, top.y, land.x, land.y);
    g.addColorStop(0, withAlpha(m.rim, 0.13 * k * hz));
    g.addColorStop(0.7, withAlpha(m.rim, 0.07 * k * hz));
    g.addColorStop(1, withAlpha(m.rim, 0));
    c.fillStyle = g;
    const third = (WIN.half * 2) / 3;
    for (let l = 0; l < 3; l++) {
      const za = zc - WIN.half + l * third + 12, zb = za + third - 24;
      const sh = new Path2D();
      polyPath(sh, cam, [[wallL, WIN.spring, za], [wallL, WIN.spring, zb], [wallL + 700, floor, zb + 380], [wallL + 700, floor, za + 380]]);
      c.fill(sh);
    }
  }
  c.globalCompositeOperation = op;
}

export interface HallArchOpts {
  /** 0..1 how much dusk light the windows let through (the backlight is the shot's; this dims the set's rim) */
  light?: number;
  /** extra darkening of the whole set (s04's dark beat) */
  dark?: number;
  /** 0..1 backlight bloom through the window holes (an additive soft glow centred on each window) */
  bloom?: number;
}

/** the hall: floor, ceiling, walls with window holes, the end wall, trusses, the slip beam */
export function hallArch(c: C, cam: HallCam, env: PaintEnv, o: HallArchOpts = {}) {
  const m = env.mood;
  const dark = clamp01(o.dark ?? 0);
  const set = mixLab(m.set, m.fg, 0.25 + 0.5 * dark);
  const far = mixLab(m.haze, m.set, 0.15 + 0.6 * dark);
  const floorNear = mixLab(m.set, m.fg, 0.55 + 0.35 * dark);
  // the roof and its undersides sit one step darker than the walls, so the far window is the brightest value
  const ceilC = mixLab(m.set, m.fg, 0.7 + 0.25 * dark);
  const vp = HALL_VP;
  const { wallL, wallR, floor, ceil, end } = HALL;
  const z0 = cam.z - 3000;

  // FLOOR: base fill graded by screen y (depth), then the checker in hazed bands
  {
    const p = new Path2D();
    if (polyPath(p, cam, [[wallL, floor, z0], [wallR, floor, z0], [wallR, floor, end], [wallL, floor, end]])) {
      const g = c.createLinearGradient(0, HALL.HY, 0, 720);
      const yAt = (vz: number) => HALL.HY + (floor - cam.y) * (HALL.F / vz);
      for (const vz of [12000, 6000, 3500, 2200, 1400, 900, 600]) {
        const y = yAt(vz);
        if (y >= HALL.HY && y <= 720) g.addColorStop((y - HALL.HY) / (720 - HALL.HY), mixLab(floorNear, far, hallHaze(vz) * 0.95));
      }
      g.addColorStop(0, mixLab(floorNear, far, 0.88));
      g.addColorStop(1, floorNear);
      c.fillStyle = g;
      c.fill(p);
      // PLANKS (not a checker: big near tiles clipped by the near plane read as broken wedges). Boards run down the
      // hall, so every seam converges on the hall's own vanishing point; their contrast falls off with depth through
      // a screen-y gradient (screen y IS depth on a floor), so the far floor dissolves into the haze.
      const yb = (vz: number) => (HALL.HY + (floor - cam.y) * (HALL.F / vz) - HALL.HY) / (720 - HALL.HY);
      const fade = (col: string, aNear: number) => {
        const fg = c.createLinearGradient(0, HALL.HY, 0, 720);
        fg.addColorStop(0, withAlpha(col, 0));
        fg.addColorStop(Math.min(0.95, Math.max(0.02, yb(5200))), withAlpha(col, aNear * 0.18));
        fg.addColorStop(Math.min(0.97, Math.max(0.04, yb(1800))), withAlpha(col, aNear * 0.6));
        fg.addColorStop(1, withAlpha(col, aNear));
        return fg;
      };
      const PW = 120;
      const alt = new Path2D();
      const seams = new Path2D();
      const joints = new Path2D();
      for (let xi = 0, xa = wallL; xa < wallR; xi++, xa += PW) {
        const xb = Math.min(wallR, xa + PW);
        if (xi % 2) polyPath(alt, cam, [[xa, floor, z0], [xb, floor, z0], [xb, floor, end], [xa, floor, end]]);
        polyPath(seams, cam, [[xa - 1.6, floor, z0], [xa + 1.6, floor, z0], [xa + 1.6, floor, end], [xa - 1.6, floor, end]]);
        // board ends, staggered per plank, only in the near floor (short marks; they never read as long diagonals)
        const off = (xi * 397) % 900;
        for (let zj = Math.floor((cam.z - 200 - off) / 900) * 900 + off; zj < cam.z + 4200; zj += 900) {
          if (zj < cam.z + 150) continue;
          polyPath(joints, cam, [[xa + 3, floor, zj - 1.6], [xb - 3, floor, zj - 1.6], [xb - 3, floor, zj + 1.6], [xa + 3, floor, zj + 1.6]]);
        }
      }
      c.save();
      c.clip(p);
      c.fillStyle = fade(m.fg, 0.16);
      c.fill(alt);
      c.fillStyle = fade(m.fg, 0.55);
      c.fill(seams);
      c.fillStyle = fade(m.fg, 0.32);
      c.fill(joints);
      // window light lying on the boards: a soft pale lozenge under each left window, falling off across the hall
      const pools = new Path2D();
      for (let zc = WIN.first; zc < end - 400; zc += WIN.every) {
        polyPath(pools, cam, [[wallL, floor, zc - WIN.half + 120], [wallL, floor, zc + WIN.half + 120], [wallL + 760, floor, zc + WIN.half + 520], [wallL + 760, floor, zc - WIN.half + 520]]);
      }
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = fade(m.rim, 0.07 * (1 - dark));
      c.fill(pools);
      c.globalCompositeOperation = op;
      c.restore();
    }
  }

  // CEILING
  {
    const p = new Path2D();
    if (polyPath(p, cam, [[wallL, ceil, z0], [wallR, ceil, z0], [wallR, ceil, end], [wallL, ceil, end]])) {
      const g = c.createLinearGradient(0, 0, 0, HALL.HY);
      g.addColorStop(0, ceilC);
      g.addColorStop(1, mixLab(ceilC, far, 0.68));
      c.fillStyle = g;
      c.fill(p);
    }
  }

  // END WALL with its great window (a hole) and tracery
  {
    const p = new Path2D();
    polyPath(p, cam, [[wallL, ceil, end], [wallR, ceil, end], [wallR, floor, end], [wallL, floor, end]]);
    const mid = (wallL + wallR) / 2;
    const hole: P3[] = [];
    const hw = 460, sill = 150, spring = -760, rise = 460;
    hole.push([mid - hw, sill, end], [mid - hw, spring, end]);
    for (let i = 1; i < 10; i++) {
      const a = Math.PI - (Math.PI * i) / 10;
      hole.push([mid + Math.cos(a) * hw, spring - Math.sin(a) * rise, end]);
    }
    hole.push([mid + hw, spring, end], [mid + hw, sill, end]);
    polyPath(p, cam, hole);
    c.fillStyle = mixLab(set, far, 0.86);
    c.fill(p, 'evenodd');
    // mullions and a transom
    const tr = new Path2D();
    for (const dx of [-230, 0, 230]) polyPath(tr, cam, [[mid + dx - 16, sill, end], [mid + dx + 16, sill, end], [mid + dx + 16, spring - (dx === 0 ? rise : 300), end], [mid + dx - 16, spring - (dx === 0 ? rise : 300), end]]);
    polyPath(tr, cam, [[mid - hw, -330, end], [mid + hw, -330, end], [mid + hw, -300, end], [mid - hw, -300, end]]);
    c.fill(tr);
    // the rose in the great window's head: a ring with eight spokes
    const rose = new Path2D();
    const ry = spring - rise * 0.52, R = 150;
    const circ = (r: number): P3[] => Array.from({ length: 24 }, (_, i) => [mid + Math.cos((i / 24) * Math.PI * 2) * r, ry + Math.sin((i / 24) * Math.PI * 2) * r, end] as P3);
    polyPath(rose, cam, circ(R));
    polyPath(rose, cam, circ(R - 22));
    c.fill(rose, 'evenodd');
    const sp = new Path2D();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI, ca = Math.cos(an), sa = Math.sin(an);
      polyPath(sp, cam, [[mid - ca * R - sa * 7, ry - sa * R + ca * 7, end], [mid + ca * R - sa * 7, ry + sa * R + ca * 7, end], [mid + ca * R + sa * 7, ry + sa * R - ca * 7, end], [mid - ca * R + sa * 7, ry - sa * R - ca * 7, end]]);
    }
    c.fill(sp);
  }

  // RIGHT WALL (mostly a sliver at frame right) with windows
  {
    const p = new Path2D();
    polyPath(p, cam, [[wallR, ceil, z0], [wallR, ceil, end], [wallR, floor, end], [wallR, floor, z0]]);
    const mull = new Path2D();
    const ring = new Path2D();
    for (let zc = WIN.first + WIN.every / 2; zc < end - 400; zc += WIN.every) {
      polyPath(p, cam, archPts(zc, WIN.half, WIN.sill, WIN.spring, WIN.rise, wallR));
      tracery(mull, ring, cam, wallR, zc);
    }
    const a = hallProject(cam, wallR, -300, Math.max(cam.z + 600, 1200));
    c.fillStyle = depthGradient(c, cam, a, vp, set, far, (u) => 800 + u * u * 11000);
    c.fill(p, 'evenodd');
    c.fill(mull);
    c.fill(ring, 'evenodd');
  }

  // LEFT WALL: the window wall that backs the line of slips
  {
    const p = new Path2D();
    polyPath(p, cam, [[wallL, ceil, z0], [wallL, ceil, end], [wallL, floor, end], [wallL, floor, z0]]);
    const mull = new Path2D();
    const ring = new Path2D();
    for (let zc = WIN.first; zc < end - 400; zc += WIN.every) {
      polyPath(p, cam, archPts(zc, WIN.half, WIN.sill, WIN.spring, WIN.rise, wallL));
      tracery(mull, ring, cam, wallL, zc);
    }
    const a = hallProject(cam, wallL, -300, Math.max(cam.z + 300, 900));
    const g = depthGradient(c, cam, a, vp, set, far, (u) => 900 + u * u * 11000);
    c.fillStyle = g;
    c.fill(p, 'evenodd');
    c.fill(mull);
    c.fill(ring, 'evenodd');
    // a dado rail and skirting (rhythm), as thin bands
    const rail = new Path2D();
    polyPath(rail, cam, [[wallL, 236, z0], [wallL, 236, end], [wallL, 250, end], [wallL, 250, z0]]);
    c.fillStyle = withAlpha(mixLab(m.fg, far, 0.2), 0.7);
    c.fill(rail);
  }

  // WINDOW BLOOM: the backlight spilling past the window holes (soft, additive, falling off with depth)
  const bloom = clamp01(o.bloom ?? 0) * (1 - dark);
  if (bloom > 0.01) {
    const op = c.globalCompositeOperation;
    c.globalCompositeOperation = 'lighter';
    const glowAt = (x: number, y: number, z: number, R: number, a: number) => {
      const q = hallProject(cam, x, y, z);
      if (q.vz < CLIP * 2) return;
      const r = R * q.s;
      if (q.x + r < -50 || q.x - r > 1330 || r < 2) return;
      const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      const k = a * bloom * (1 - 0.75 * hallHaze(q.vz));
      g.addColorStop(0, withAlpha(m.rim, 0.3 * k));
      g.addColorStop(0.45, withAlpha(m.rim, 0.12 * k));
      g.addColorStop(1, withAlpha(m.rim, 0));
      c.fillStyle = g;
      c.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
    };
    for (let zc = WIN.first; zc < end - 400; zc += WIN.every) glowAt(wallL + 40, (WIN.sill + WIN.spring) / 2, zc, 640, 1);
    for (let zc = WIN.first + WIN.every / 2; zc < end - 400; zc += WIN.every) glowAt(wallR - 40, (WIN.sill + WIN.spring) / 2, zc, 560, 0.8);
    glowAt((wallL + wallR) / 2, -300, end - 60, 1300, 1.3);
    c.globalCompositeOperation = op;
    windowShafts(c, cam, m, bloom);
  }

  // CEILING TRUSSES (cross-sections) and the slip beam with its hangers
  {
    const tp = new Path2D();
    const hp = new Path2D();
    for (let zt = 1300; zt < end - 300; zt += 1150) {
      polyPath(tp, cam, [[wallL, ceil, zt], [wallR, ceil, zt], [wallR, ceil + 150, zt], [wallL, ceil + 150, zt]]);
      // knee braces
      polyPath(tp, cam, [[wallL, ceil + 150, zt], [wallL + 260, ceil + 150, zt], [wallL, ceil + 420, zt]]);
      polyPath(tp, cam, [[wallR, ceil + 150, zt], [wallR - 260, ceil + 150, zt], [wallR, ceil + 420, zt]]);
      // the beam's hanger rod up to the truss
      polyPath(hp, cam, [[HALL.beamX - 5, ceil + 150, zt], [HALL.beamX + 5, ceil + 150, zt], [HALL.beamX + 5, HALL.beamY, zt], [HALL.beamX - 5, HALL.beamY, zt]]);
    }
    c.fillStyle = mixLab(m.fg, far, 0.05);
    c.fill(tp);
    c.fill(hp);
    // the beam: its near face and underside
    const bp = new Path2D();
    const zb0 = HALL.z0 - 420, zb1 = end - 500;
    polyPath(bp, cam, [[HALL.beamX + 14, HALL.beamY - 26, zb0], [HALL.beamX + 14, HALL.beamY - 26, zb1], [HALL.beamX + 14, HALL.beamY, zb1], [HALL.beamX + 14, HALL.beamY, zb0]]);
    polyPath(bp, cam, [[HALL.beamX - 14, HALL.beamY, zb0], [HALL.beamX + 14, HALL.beamY, zb0], [HALL.beamX + 14, HALL.beamY, zb1], [HALL.beamX - 14, HALL.beamY, zb1]]);
    const a = hallProject(cam, HALL.beamX, HALL.beamY, Math.max(cam.z + 400, zb0));
    c.fillStyle = depthGradient(c, cam, a, vp, mixLab(m.fg, m.set, 0.08), far, (u) => 600 + u * u * 11000);
    c.fill(bp);
  }
}

// ------------------------------------------------------------------------------------------------ slips
export function slipAt(i: number) {
  return { x: HALL.beamX, y: HALL.slipTop, z: HALL.z0 + i * HALL.pitch };
}

export interface SlipScreen {
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  vz: number;
  wick: { x: number; y: number };
  beam: { x: number; y: number };
}
export function slipScreen(cam: HallCam, i: number): SlipScreen {
  const p = slipAt(i);
  const q = hallProject(cam, p.x, p.y, p.z);
  const s = q.s;
  return {
    x: q.x,
    y: q.y,
    w: HALL.slipW * s,
    h: HALL.slipH * s,
    s,
    vz: q.vz,
    wick: { x: q.x, y: q.y + (HALL.slipH + HALL.wickDy) * s },
    beam: { x: q.x, y: q.y - (HALL.slipTop - HALL.beamY) * s },
  };
}

/** paper tone of a slip: shadowed paper, warmed by lamp light `lit`, glowing from within by `own` */
export function slipPaper(m: Palette, lit: number, own: number) {
  const shade = mixLab(m.setHaze, m.haze, 0.35);
  const warm = mixLab(mixLab(m.rim, m.halo, 0.4), m.core, 0.35);
  const p = mixLab(shade, warm, clamp01(lit));
  return mixLab(p, m.core, clamp01(own) * 0.75);
}

export interface SlipOpts {
  /** 0..1 lamp light on the paper (warm, from the scribe's lamp or the slip's own wick) */
  lit?: number;
  /** 0..1 the paper glows from within (s04: every slip lit at once) */
  own?: number;
  /** 0..1 the wick-cup's flame (0 = cold wick) */
  wick?: number;
  /** lettering alpha (default 1) */
  text?: number;
  /** override the word */
  word?: string;
  /** a slight swing (radians) */
  swing?: number;
  /** draw the wick cup (default true) */
  cup?: boolean;
  /** extra dimming (0..1) of the paper toward the set (s04 dark beat) */
  dim?: number;
  /** lettering scale (default 1; s04 sets the lit words larger so the near ones clear the legibility floor) */
  textScale?: number;
}

export function hallSlip(c: C, cam: HallCam, env: PaintEnv, i: number, o: SlipOpts = {}) {
  const S = slipScreen(cam, i);
  if (S.vz < CLIP || S.x + S.w < -40 || S.x - S.w > 1320) return S;
  drawSlipAt(c, env, S, i, o);
  return S;
}

/** draw a slip given its screen geometry (also used by close-ups that place slips themselves) */
export function drawSlipAt(c: C, env: PaintEnv, S: SlipScreen, i: number, o: SlipOpts = {}) {
  const m = env.mood;
  const h = hallHaze(S.vz);
  const s = S.s;
  const lit = clamp01(o.lit ?? 0);
  const own = clamp01(o.own ?? 0);
  const dim = clamp01(o.dim ?? 0);
  let paper = slipPaper(m, lit, own);
  // a slip lit from within is lifted a clear step in value (about 30%), not only tinted
  if (own > 0) paper = mixLab(paper, '#ffffff', 0.3 * own);
  paper = mixLab(paper, mixLab(m.set, m.fg, 0.3), dim * (1 - Math.max(lit, own)));
  // (dimmed slips sink into the dark hall even far down the line: the haze they fade into darkens too)
  const hazeTo = mixLab(mixLab(m.haze, m.set, 0.2 + 0.5 * dim), m.fg, 0.55 * dim);
  paper = mixLab(paper, hazeTo, h * (1 - 0.6 * Math.max(lit, own)));
  const inkC = mixLab(PUPPET_NEAR_BLACK, hazeTo, h * 0.95);
  const w = S.w, H = S.h;
  c.save();
  c.translate(S.x, S.y);
  if (o.swing) c.rotate(o.swing);
  // the two hanging threads up to the beam
  const up = (HALL.slipTop - HALL.beamY) * s;
  c.strokeStyle = inkC;
  c.lineWidth = Math.max(0.5, 1.1 * s);
  c.beginPath();
  c.moveTo(-w * 0.32, 0);
  c.lineTo(-w * 0.28, -up);
  c.moveTo(w * 0.32, 0);
  c.lineTo(w * 0.28, -up);
  c.stroke();
  // the slip: a deckled paper card with a folded top hem
  const P = new Path2D();
  const jag = (k: number) => hash1(i * 13 + k, 71) * 1.4 * s;
  P.moveTo(-w / 2, 0);
  P.lineTo(w / 2, 0);
  P.lineTo(w / 2 + jag(1), H * 0.5);
  P.lineTo(w / 2, H);
  for (let k = 1; k < 6; k++) P.lineTo(w / 2 - (w * k) / 6, H + jag(k + 3));
  P.lineTo(-w / 2, H);
  P.lineTo(-w / 2 + jag(9), H * 0.5);
  P.closePath();
  c.fillStyle = paper;
  c.fill(P);
  // the inner glow: a soft core of light behind the lettering (on the paper, under the ink)
  if (own > 0.01 && s > 0.08) {
    c.save();
    c.clip(P);
    const gy = H * 0.54;
    const g = c.createRadialGradient(0, gy, 0, 0, gy, H * 0.55);
    g.addColorStop(0, withAlpha(m.core, 0.55 * own));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(-w, 0, 2 * w, H);
    c.restore();
  }
  c.fillStyle = withAlpha(inkC, 0.35);
  c.fillRect(-w / 2, 0, w, Math.max(0.6, 5 * s));
  if (s > 0.12) {
    c.strokeStyle = withAlpha(inkC, 0.5);
    c.lineWidth = Math.max(0.4, 0.8 * s);
    c.stroke(P);
  }
  // lettering (rotated to read down the slip: a word set on its side, like a spine)
  const ta = (o.text ?? 1) * (1 - h * 0.9);
  const word = o.word ?? HALL_WORDS[i % HALL_WORDS.length];
  if (ta > 0.03 && s > 0.16) {
    c.save();
    c.translate(0, H * 0.54);
    c.rotate(-Math.PI / 2);
    let size = 30 * s * (o.textScale ?? 1);
    c.font = `500 ${size}px ${FONT.text}`;
    const maxW = H * 0.84;
    const mw = c.measureText(word).width;
    if (mw > maxW) {
      size *= maxW / mw;
      c.font = `500 ${size}px ${FONT.text}`;
    }
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    // legibility floor (22 px cap height at 1080p): a word big enough to read is inked full; one under the floor
    // is TEXTURE, a faint mark on the paper fading into the haze (never half-legible). Continuous across 22-23.5 px,
    // so a slip shrinking under a pull-back dims smoothly instead of popping.
    const cap = capPx1080(c, c.font, word);
    const ink = cap >= 23.5 ? 0.88 : cap >= 22 ? 0.29 + (0.88 - 0.29) * ((cap - 22) / 1.5) : 0.29 * Math.min(1, cap / 22);
    c.globalAlpha *= ta;
    c.fillStyle = withAlpha(inkC, ink);
    c.fillText(word, 0, size * 0.34);
    c.restore();
  }
  // the wick cup: a small ink bowl on a hook, a wick
  if (o.cup !== false) {
    const cy = H + HALL.wickDy * s;
    c.strokeStyle = inkC;
    c.lineWidth = Math.max(0.5, 1.2 * s);
    c.beginPath();
    c.moveTo(0, H);
    c.lineTo(0, cy - 5 * s);
    c.stroke();
    c.fillStyle = inkC;
    c.beginPath();
    c.moveTo(-8 * s, cy - 5 * s);
    c.lineTo(8 * s, cy - 5 * s);
    c.quadraticCurveTo(7 * s, cy + 4 * s, 0, cy + 4 * s);
    c.quadraticCurveTo(-7 * s, cy + 4 * s, -8 * s, cy - 5 * s);
    c.fill();
    c.fillRect(-0.6 * s, cy - 10 * s, 1.2 * s, 5 * s);
  }
  c.restore();
  return S;
}

/** a small flame + glow at a wick (screen point, scale s), strength k; light colours from `light` (default the mood) */
export function wickFlame(c: C, x: number, y: number, s: number, k: number, t: number, seed: number, light: { halo: string; core: string }, vis = 0) {
  if (k <= 0.01 && vis <= 0) return;
  const tq = Math.floor(t * 24) / 24;
  const fl = 1 + 0.06 * Math.sin(tq * 9.1 + seed * 3.7) + 0.035 * Math.sin(tq * 23.3 + seed);
  const kk = k * fl;
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  const R = (r: number, col: string, a: number) => {
    if (r < 0.5 || a < 0.003) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(col, a));
    g.addColorStop(0.35, withAlpha(col, a * 0.45));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // a floor on the screen radii so a far flame still reads as a point of light (the glow-worm)
  R(Math.max(34 * (1 + vis), 170 * s * Math.sqrt(k)), light.halo, Math.max(0.17 * kk, 0.12 * vis));
  R(Math.max(11 * (1 + 0.8 * vis), 50 * s), light.halo, Math.max(0.4 * kk, 0.5 * vis));
  R(Math.max(3.2 * (1 + 0.9 * vis), 14 * s), light.core, Math.max(0.9 * kk, vis));
  if (vis > 0) R(Math.max(2.2, 5 * s), '#ffffff', 0.55 * vis);
  c.globalCompositeOperation = op;
  // the flame body
  const h = Math.max(3.5, 17 * s) * (0.55 + 0.45 * k);
  const sway = Math.sin(tq * 3.1 + seed) * 1.2 * s;
  c.save();
  c.globalAlpha *= Math.min(1, Math.max(k * 1.6, vis));
  c.fillStyle = light.core;
  c.beginPath();
  c.moveTo(x + sway, y - h);
  c.quadraticCurveTo(x + 4.2 * s, y - h * 0.35, x, y + 1.5 * s);
  c.quadraticCurveTo(x - 4.2 * s, y - h * 0.35, x + sway, y - h);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the scribe
/** the scribe: a small cut-paper figure (no real person) in a long coat */
export const scribe = createPuppet({
  id: 'ch10-scribe',
  height: 300,
  build: 'slight',
  era: '1940s',
  wardrobe: 'overcoat',
  hair: 'crewCut',
  facialHair: 'none',
  glasses: 'none',
  hat: 'none',
  profile: { nose: 0.45, brow: 0.5, chin: 0.45, jaw: 0.45 },
  prop: 'none',
  details: ['beltLine', 'cuff'],
});

export interface ScribeDraw {
  x: number;
  z: number;
  pose: Pose;
  facing: Facing;
  /** extra scale */
  scale?: number;
  /** a ghost (rim outline only, translucent) */
  ghost?: number;
  light?: { x: number; y: number };
}
/** feet point on screen and scale for a figure standing at (x, z) on the floor */
export function floorPoint(cam: HallCam, x: number, z: number) {
  return hallProject(cam, x, HALL.floor, z);
}
export function scribeDraw(c: C, cam: HallCam, env: PaintEnv, o: ScribeDraw) {
  const q = floorPoint(cam, o.x, o.z);
  if (q.vz < CLIP) return null;
  const h = hallHaze(q.vz);
  const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.haze, h * 0.85);
  const opts = {
    x: q.x,
    y: q.y,
    facing: o.facing,
    pose: o.pose,
    scale: q.s * (o.scale ?? 1),
    ink,
    light: o.light ? { ...o.light, floor: 0.15 } : undefined,
    edgeRim: o.light ? { ...o.light, px: 1.4, alpha: 0.55 * (1 - h) } : undefined,
  };
  scribe.draw(c, opts, env);
  return { q, hand: scribe.anchor(opts, 'handF'), head: scribe.anchor(opts, 'head') };
}

/** the scribe's hand lamp: a small tin lantern hanging from the hand (screen point), lit k */
export function handLamp(c: C, env: PaintEnv, x: number, y: number, s: number, k: number, t: number, light: { halo: string; core: string }, ink?: string) {
  const inkC = ink ?? PUPPET_NEAR_BLACK;
  c.save();
  c.translate(x, y);
  c.fillStyle = inkC;
  c.strokeStyle = inkC;
  c.lineWidth = Math.max(0.6, 1.4 * s);
  // bail and cap
  c.beginPath();
  c.arc(0, 4 * s, 5 * s, Math.PI, 0);
  c.stroke();
  c.beginPath();
  c.moveTo(-9 * s, 10 * s);
  c.lineTo(9 * s, 10 * s);
  c.lineTo(5 * s, 4 * s);
  c.lineTo(-5 * s, 4 * s);
  c.closePath();
  c.fill();
  // glass body: lit paper-glass, frame bars
  const gl = mixLab(env.mood.set, light.core, clamp01(k));
  c.fillStyle = gl;
  c.fillRect(-7 * s, 10 * s, 14 * s, 18 * s);
  c.fillStyle = inkC;
  c.fillRect(-8 * s, 10 * s, 2 * s, 18 * s);
  c.fillRect(6 * s, 10 * s, 2 * s, 18 * s);
  c.fillRect(-1 * s, 10 * s, 2 * s, 18 * s);
  c.fillRect(-10 * s, 27 * s, 20 * s, 4 * s);
  c.restore();
  wickFlame(c, x, y + 22 * s, s * 0.9, k, t, 77, light);
}
