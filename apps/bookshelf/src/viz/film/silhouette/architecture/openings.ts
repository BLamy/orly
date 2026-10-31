/**
 * Openings: arch geometry and glazed windows, built as HOLE contours for evenodd walls.
 *
 *   arch(cx, w, spring, shape?, rise?) -> Arch     shape: 'round'|'pointed'|'segmental'|'tudor'|'flat'
 *   archY(A, x), halfWidthAt(A, y), insideArch(A, sill, x, y), offsetArch(A, d)
 *   addArchContour(p, A, sill, ccw?)                 opening outline (sill -> arch -> sill)
 *   strokeArchLine(p, A, extend?)                    open polyline along the arch (for hood mouldings)
 *   windowGeom(spec) -> { holes, bars, mould, arch, lights, foils }   cached by spec
 *       holes: ccw contours (lights + tracery foils) to addPath into a wall path, fill 'evenodd'
 *       bars:  solid leading, glazing bars and transoms (fill with the wall colour)
 *       mould: cut-line path (hood moulding, sill) to stroke with cutColor()
 *
 * WindowSpec: { cx, w, apex, sill, shape='pointed', rise?, lights=2, mullion, transoms=[fractions of
 * spring..sill], panes={cols,rows} per light (null = clear), bar, tracery='quatrefoil'|'trefoil'|'roundel'|'none' }
 */
import { addFoil, addPoly } from '../ornament';
import { memo, keyOf, type Pt } from './common';

export type ArchShape = 'round' | 'pointed' | 'segmental' | 'tudor' | 'flat';
export interface Arch {
  cx: number;
  /** half span */
  a: number;
  /** springing line y */
  spring: number;
  rise: number;
  shape: ArchShape;
}

export function defaultRise(shape: ArchShape, a: number): number {
  switch (shape) {
    case 'round':
      return a;
    case 'pointed':
      return a * 1.6;
    case 'segmental':
      return a * 0.35;
    case 'tudor':
      return a * 0.62;
    case 'flat':
      return 0;
  }
}

export function arch(cx: number, w: number, spring: number, shape: ArchShape = 'round', rise?: number): Arch {
  const a = w / 2;
  return { cx, a, spring, shape, rise: rise ?? defaultRise(shape, a) };
}

/** height above the springing line at normalised distance u = |dx|/a from the centre */
export function archHeight(A: Arch, u: number): number {
  const { a, rise } = A;
  if (u >= 1) return 0;
  u = Math.max(0, u);
  switch (A.shape) {
    case 'flat':
      return 0;
    case 'round':
      return rise * Math.sqrt(1 - u * u);
    case 'pointed': {
      if (rise < a) return rise * Math.sqrt(1 - u * u);
      const R = (a * a + rise * rise) / (2 * a);
      const d = a * (1 - u) - R;
      return Math.sqrt(Math.max(0, R * R - d * d));
    }
    case 'segmental': {
      const R = (a * a + rise * rise) / (2 * rise);
      const dx = a * u;
      return Math.sqrt(Math.max(0, R * R - dx * dx)) - (R - rise);
    }
    case 'tudor':
      return rise * (0.55 * Math.sqrt(Math.max(0, 1 - u * u)) + 0.45 * (1 - u)) * (u > 0.999 ? 0 : 1);
  }
}

export const archY = (A: Arch, x: number) => A.spring - archHeight(A, Math.abs(x - A.cx) / A.a);

/** half-width of the opening at height y (y above the springing line uses the arch) */
export function halfWidthAt(A: Arch, y: number): number {
  if (y >= A.spring) return A.a;
  const hgt = A.spring - y;
  if (hgt >= A.rise) return 0;
  // bisection on u
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (archHeight(A, m) > hgt) lo = m;
    else hi = m;
  }
  return lo * A.a;
}

export function insideArch(A: Arch, sill: number, x: number, y: number): boolean {
  if (y > sill) return false;
  const dx = Math.abs(x - A.cx);
  if (dx > A.a) return false;
  return y >= archY(A, x);
}

export function offsetArch(A: Arch, d: number): Arch {
  return { ...A, a: A.a + d, rise: A.shape === 'flat' ? 0 : A.rise + d };
}

const SEG = 28;
function archPts(A: Arch): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= SEG; i++) {
    const u = 1 - i / SEG;
    pts.push([A.cx - u * A.a, A.spring - archHeight(A, u)]);
  }
  for (let i = 1; i <= SEG; i++) {
    const u = i / SEG;
    pts.push([A.cx + u * A.a, A.spring - archHeight(A, u)]);
  }
  return pts;
}

/** outline of an arch-headed opening from the sill (clockwise unless ccw) */
export function addArchContour(p: Path2D, A: Arch, sill: number, ccw = false) {
  const pts: Pt[] = [[A.cx - A.a, sill], ...archPts(A), [A.cx + A.a, sill]];
  addPoly(p, pts, ccw);
}

/** open polyline following the arch (hood moulding), with short horizontal label stops */
export function strokeArchLine(p: Path2D, A: Arch, stop = 0) {
  const pts = archPts(A);
  p.moveTo(pts[0][0] - stop, pts[0][1]);
  for (const q of pts) p.lineTo(q[0], q[1]);
  p.lineTo(pts[pts.length - 1][0] + stop, pts[pts.length - 1][1]);
}

export interface WindowSpec {
  cx: number;
  w: number;
  /** y of the top of the opening */
  apex: number;
  /** y of the sill */
  sill: number;
  shape?: ArchShape;
  rise?: number;
  lights?: number;
  mullion?: number;
  /** transom positions as fractions of (spring .. sill) */
  transoms?: number[];
  panes?: { cols: number; rows: number } | null;
  bar?: number;
  tracery?: 'quatrefoil' | 'trefoil' | 'roundel' | 'none';
  /** draw hood moulding cut-lines */
  hood?: boolean;
}

export interface WindowGeom {
  holes: Path2D;
  bars: Path2D;
  mould: Path2D;
  arch: Arch;
  lights: Arch[];
  foils: { x: number; y: number; r: number }[];
  /** rectangles of glass cells below the springing (for tinting) */
  cells: [number, number, number, number][];
}

const geomCache = new Map<string, WindowGeom>();

export function windowGeom(s: WindowSpec): WindowGeom {
  return memo(geomCache, keyOf(s), () => buildWindow(s), 400);
}

function buildWindow(s: WindowSpec): WindowGeom {
  const shape = s.shape ?? 'pointed';
  const a = s.w / 2;
  const rise = s.shape === 'flat' ? 0 : s.rise ?? defaultRise(shape, a);
  const spring = s.apex + rise;
  const A: Arch = { cx: s.cx, a, spring, rise, shape };
  const n = Math.max(1, s.lights ?? 2);
  const m = s.mullion ?? s.w * 0.06;
  const lw = (s.w - (n - 1) * m) / n;
  const bar = s.bar ?? Math.max(1.2, s.w * 0.012);
  const lights: Arch[] = [];
  const pointedK = shape === 'pointed' && rise >= a ? (a * a + rise * rise) / (2 * a) / a : 0;
  for (let i = 0; i < n; i++) {
    const lcx = s.cx - a + lw / 2 + i * (lw + m);
    const la = lw / 2;
    let lr: number;
    if (n === 1) lr = rise;
    else if (shape === 'pointed' && pointedK) {
      const R = pointedK * la;
      lr = Math.sqrt(R * R - (R - la) * (R - la));
    } else if (shape === 'round') lr = la;
    else lr = (rise * la) / a;
    lights.push({ cx: lcx, a: la, spring, rise: lr, shape });
  }
  const holes = new Path2D();
  for (const L of lights) addArchContour(holes, L, s.sill, true);

  // tracery foils in the head
  const foils: { x: number; y: number; r: number }[] = [];
  const tracery = s.tracery ?? 'quatrefoil';
  if (n > 1 && tracery !== 'none' && rise > 0) {
    const margin = Math.max(m * 0.8, s.w * 0.035);
    const ok = (x: number, y: number, r: number) => {
      for (let k = 0; k < 28; k++) {
        const ang = (k / 28) * Math.PI * 2;
        const px = x + Math.cos(ang) * (r + margin);
        const py = y + Math.sin(ang) * (r + margin);
        if (!insideArch(A, s.sill, px, py)) return false;
        for (const L of lights) if (insideArch(L, s.sill, px, py)) return false;
      }
      for (const f of foils) if (Math.hypot(f.x - x, f.y - y) < f.r + r + margin) return false;
      return true;
    };
    const place = (cands: number[], minR: number) => {
      for (const x of cands) {
        let best: { y: number; r: number } | null = null;
        for (let yi = 0; yi <= 40; yi++) {
          const y = s.apex + (rise * yi) / 40;
          let lo = 0;
          let hi = s.w / 2;
          if (!ok(x, y, minR)) continue;
          for (let it = 0; it < 18; it++) {
            const mid = (lo + hi) / 2;
            if (ok(x, y, mid)) lo = mid;
            else hi = mid;
          }
          if (!best || lo > best.r) best = { y, r: lo };
        }
        if (best && best.r >= minR) foils.push({ x, y: best.y, r: best.r });
      }
    };
    place([s.cx], s.w * 0.06);
    // smaller foils in the remaining spandrels
    const sideXs: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const mx = lights[i].cx + lights[i].a + m / 2;
      if (Math.abs(mx - s.cx) > 1) sideXs.push(mx);
    }
    sideXs.push(s.cx - a * 0.62, s.cx + a * 0.62);
    place(sideXs, s.w * 0.035);
    const nf = tracery === 'trefoil' ? 3 : tracery === 'roundel' ? 6 : 4;
    for (const f of foils) {
      const big = f.r > s.w * 0.1;
      addFoil(holes, f.x, f.y, f.r, big ? nf : 3, {
        ccw: true,
        rot: nf === 4 && big ? -Math.PI / 4 : -Math.PI / 2,
        lobe: tracery === 'roundel' && big ? 0.9 : 0.62,
      });
    }
  }

  // glazing bars, transoms
  const bars = new Path2D();
  const cells: [number, number, number, number][] = [];
  const tr = s.transoms ?? [];
  for (const L of lights) {
    const x0 = L.cx - L.a;
    const x1 = L.cx + L.a;
    for (const f of tr) {
      const y = spring + f * (s.sill - spring);
      const tw = Math.max(bar * 2.2, m * 0.7);
      bars.rect(x0 - 0.5, y - tw / 2, x1 - x0 + 1, tw);
    }
    if (s.panes) {
      const { cols, rows } = s.panes;
      const top = L.spring - L.rise;
      const ph = (s.sill - spring) / rows;
      for (let j = 1; j < cols; j++) {
        const x = x0 + (j * (x1 - x0)) / cols;
        const yt = archY(L, x);
        bars.rect(x - bar / 2, yt - 0.5, bar, s.sill - yt + 0.5);
      }
      let y = s.sill - ph;
      let guard = 0;
      while (y > top + ph * 0.25 && guard++ < 200) {
        const hw = halfWidthAt(L, y);
        if (hw > bar) bars.rect(L.cx - hw - 0.5, y - bar / 2, hw * 2 + 1, bar);
        y -= ph;
      }
      for (let r = 0; r < rows; r++) {
        for (let j = 0; j < cols; j++) {
          const cy0 = spring + r * ph;
          cells.push([x0 + (j * (x1 - x0)) / cols, cy0, (x1 - x0) / cols, ph]);
        }
      }
    }
  }

  const mould = new Path2D();
  if (s.hood ?? true) {
    const d = Math.max(3, s.w * 0.05);
    if (shape === 'flat') {
      mould.rect(s.cx - a - d, s.apex - d, s.w + 2 * d, s.sill - s.apex + 2 * d);
    } else {
      strokeArchLine(mould, offsetArch(A, d), d * 0.9);
      strokeArchLine(mould, offsetArch(A, d * 1.9), 0);
    }
    mould.moveTo(s.cx - a - d * 1.6, s.sill + d * 0.6);
    mould.lineTo(s.cx + a + d * 1.6, s.sill + d * 0.6);
  }
  return { holes, bars, mould, arch: A, lights, foils, cells };
}
