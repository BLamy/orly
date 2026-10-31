/**
 * Ornament: Path2D builders for period detail (style bible §5 "pierced detail + repeating ornament").
 * Everything is built at a local origin, cached by parameters, and placed with `at()`/`repeatX()`.
 * Solid shapes are wound clockwise; `ccw` contours inside them become holes (nonzero or evenodd).
 *
 * Utilities
 *   memoPath(key, build)                 cache any Path2D (bounded LRU-ish map)
 *   at(dst, motif, x, y, sx?, sy?, rot?) add motif into dst with a transform
 *   repeatX(motif, x0, x1, pitch, y)     a row of motifs (one fill() for the lot)
 *   addCircle/addEllipse/addRect/addPoly(p, ..., ccw?)   contour appenders (for building holes)
 *   addFoil(p, cx, cy, r, n, {rot, lobe, ccw})          cusped n-foil contour (trefoil n=3, quatrefoil 4)
 *   ribbon(pts, widths)                  closed polygon around a centre line (variable width)
 * Shapes (origin noted)
 *   foil(r, n, rot?)                     solid n-foil, centred
 *   roundel(r, n)                        ring with a foiled hole (gothic tracery eye), centred
 *   rosette(r, petals)                   pierced rosette, centred
 *   volute(r, {turns, width, dir})       spiral ribbon ending in an eye, centre of spiral at 0,0
 *   scroll({w, h, kind:'C'|'S', thick})  C- or S-scroll spanning (0,0)->(w,0), curls bulging up (-y) by h
 *   acanthus({len, w, curl, lobes})      leaf from base (0,0) growing up, pierced midrib + eyes
 *   palmette({r, leaves})                anthemion fan above (0,0), non-overlapping (safe as holes)
 *   pinnacle({h, w, crockets})           gothic crocketed spire, base centre (0,0)
 *   finial(kind, h)                      'ball'|'acorn'|'urn'|'flameUrn'|'spire', base centre
 *   scallopEdge({w, h, pitch, depth, eyelets})  lace band, top-left (0,0)
 *   tasselFringe({w, pitch, len, band})  braid + tassels, top-left (0,0)
 *   balustrade({w, h, pitch, rail, plinth, slim}) rail+balusters+plinth, bottom-left (0,0), up is -y
 *   eggAndDart({w, h})                   pierced moulding band, top-left (0,0)
 *   dentils({w, h, pitch})               toothed band, top-left (0,0)
 *   crenellation({w, h, merlon, gap, slits})  parapet top, bottom-left (0,0), up is -y
 *   ornateFrame({w, h, crest, apron})    pierced frame with crest; opening is a hole; top-left (0,0)
 * Painter
 *   drawOrnament(c, {path, x, y, scale?, rot?, role?, rule?, alpha?}, env)
 */
import type { FillRole, Painter } from '../contracts';
import { turning, placeTurning, type TurningKind } from './lathe';

type Pt = [number, number];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// utilities
// ---------------------------------------------------------------------------
const store = new Map<string, Path2D>();
/** Cache any Path2D under a string key. */
export function memoPath(key: string, build: () => Path2D): Path2D {
  const hit = store.get(key);
  if (hit) return hit;
  const p = build();
  if (store.size > 1500) store.clear();
  store.set(key, p);
  return p;
}

/** Add `motif` into `dst` translated to (x, y), scaled and rotated (radians). */
export function at(dst: Path2D, motif: Path2D, x: number, y: number, sx = 1, sy = sx, rot = 0) {
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  dst.addPath(motif, new DOMMatrix([cs * sx, sn * sx, -sn * sy, cs * sy, x, y]));
}

/** A row of motifs from x0 to x1 (centred within the span). */
export function repeatX(motif: Path2D, x0: number, x1: number, pitch: number, y: number, dst = new Path2D()): Path2D {
  const n = Math.max(1, Math.floor((x1 - x0) / pitch));
  const start = x0 + (x1 - x0 - (n - 1) * pitch) / 2;
  for (let i = 0; i < n; i++) at(dst, motif, start + i * pitch, y);
  return dst;
}

export function addCircle(p: Path2D, cx: number, cy: number, r: number, ccw = false) {
  p.moveTo(cx + r, cy);
  p.arc(cx, cy, r, 0, TAU, ccw);
  p.closePath();
}
export function addEllipse(p: Path2D, cx: number, cy: number, rx: number, ry: number, rot = 0, ccw = false) {
  p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
  p.ellipse(cx, cy, rx, ry, rot, 0, TAU, ccw);
  p.closePath();
}
export function addRect(p: Path2D, x: number, y: number, w: number, h: number, ccw = false) {
  if (!ccw) {
    p.moveTo(x, y);
    p.lineTo(x + w, y);
    p.lineTo(x + w, y + h);
    p.lineTo(x, y + h);
  } else {
    p.moveTo(x, y);
    p.lineTo(x, y + h);
    p.lineTo(x + w, y + h);
    p.lineTo(x + w, y);
  }
  p.closePath();
}
export function addPoly(p: Path2D, pts: Pt[], ccw = false) {
  if (pts.length < 3) return;
  const q = ccw ? [...pts].reverse() : pts;
  p.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]);
  p.closePath();
}
/** signed area (>0 = clockwise on screen, y down) */
export function polyArea(pts: Pt[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}
/** add a polygon forced to the requested winding */
export function addPolyWound(p: Path2D, pts: Pt[], ccw = false) {
  const cw = polyArea(pts) > 0;
  addPoly(p, cw === !ccw ? pts : [...pts].reverse());
}

/**
 * Cusped n-foil contour (the union of n lobes), lobe in 0.3..0.9 sets lobe size.
 * r is the outer radius. rot rotates the lobes (default: one lobe straight up).
 */
export function addFoil(p: Path2D, cx: number, cy: number, r: number, n: number, o: { rot?: number; lobe?: number; ccw?: boolean } = {}) {
  const lobe = o.lobe ?? 0.62;
  const rot = o.rot ?? -Math.PI / 2;
  const s = Math.sin(Math.PI / n);
  // lobe radius rl, centre radius rc (rc + rl = r); lobes must overlap: rl > r*s/(1+s)
  const rl = ((r * s) / (1 + s)) * (1 + 0.25 * lobe);
  const rc = r - rl;
  const h = Math.sqrt(Math.max(0, rl * rl - rc * rc * s * s));
  const d = rc * Math.cos(Math.PI / n) + h; // cusp distance
  const pts: { c: Pt; a0: number; a1: number }[] = [];
  for (let i = 0; i < n; i++) {
    const th = rot + (i * TAU) / n;
    const C: Pt = [cx + rc * Math.cos(th), cy + rc * Math.sin(th)];
    const pPrev: Pt = [cx + d * Math.cos(th - Math.PI / n), cy + d * Math.sin(th - Math.PI / n)];
    const pNext: Pt = [cx + d * Math.cos(th + Math.PI / n), cy + d * Math.sin(th + Math.PI / n)];
    pts.push({ c: C, a0: Math.atan2(pPrev[1] - C[1], pPrev[0] - C[0]), a1: Math.atan2(pNext[1] - C[1], pNext[0] - C[0]) });
  }
  if (!o.ccw) {
    const f = pts[0];
    p.moveTo(f.c[0] + rl * Math.cos(f.a0), f.c[1] + rl * Math.sin(f.a0));
    for (const q of pts) p.arc(q.c[0], q.c[1], rl, q.a0, q.a1, false);
  } else {
    const f = pts[n - 1];
    p.moveTo(f.c[0] + rl * Math.cos(f.a1), f.c[1] + rl * Math.sin(f.a1));
    for (let i = n - 1; i >= 0; i--) {
      const q = pts[i];
      p.arc(q.c[0], q.c[1], rl, q.a1, q.a0, true);
    }
  }
  p.closePath();
}

/** Closed polygon around centre line `pts` with per-point full widths. */
export function ribbonPts(pts: Pt[], widths: number[]): Pt[] {
  const L: Pt[] = [];
  const R: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const hw = widths[i] / 2;
    // left normal (screen): (dy, -dx)
    L.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    R.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
  }
  return [...L, ...R.reverse()];
}
export function ribbon(pts: Pt[], widths: number[], dst = new Path2D(), ccw = false): Path2D {
  addPolyWound(dst, ribbonPts(pts, widths), ccw);
  return dst;
}

// ---------------------------------------------------------------------------
// tracery & rosettes
// ---------------------------------------------------------------------------
export function foil(r: number, n: number, rot = -Math.PI / 2, lobe = 0.62): Path2D {
  return memoPath(`foil${r},${n},${rot},${lobe}`, () => {
    const p = new Path2D();
    addFoil(p, 0, 0, r, n, { rot, lobe });
    return p;
  });
}

/** A ring (width `band`) whose opening is an n-foil, plus a tiny centre boss. evenodd. */
export function roundel(r: number, n = 4, band = 0.14): Path2D {
  return memoPath(`roundel${r},${n},${band}`, () => {
    const p = new Path2D();
    addCircle(p, 0, 0, r);
    addFoil(p, 0, 0, r * (1 - band), n, { ccw: true, rot: n === 4 ? -Math.PI / 4 : -Math.PI / 2 });
    return p;
  });
}

export function rosette(r: number, petals = 8): Path2D {
  return memoPath(`rosette${r},${petals}`, () => {
    const p = new Path2D();
    // scalloped rim
    const rimPts: Pt[] = [];
    const M = petals * 12;
    for (let i = 0; i < M; i++) {
      const a = (i / M) * TAU;
      const rr = r * (0.9 + 0.1 * Math.abs(Math.cos((a * petals) / 2)));
      rimPts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    addPolyWound(p, rimPts);
    // petal holes (teardrops)
    for (let k = 0; k < petals; k++) {
      const a = (k / petals) * TAU - Math.PI / 2;
      const pts: Pt[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const rad = r * (0.3 + 0.52 * t);
        const hw = r * 0.16 * Math.sin(Math.PI * Math.pow(t, 0.8)) * (petals <= 6 ? 1.3 : 1);
        pts.push([rad, hw]);
      }
      for (let i = 16; i >= 0; i--) pts.push([pts[i][0], -pts[i][1]]);
      const rot = pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as Pt);
      addPolyWound(p, rot, true);
    }
    // centre boss: ring hole with a solid pip
    addCircle(p, 0, 0, r * 0.2, true);
    addCircle(p, 0, 0, r * 0.11);
    return p;
  });
}

// ---------------------------------------------------------------------------
// scrolls & leaves
// ---------------------------------------------------------------------------
function spiralPts(cx: number, cy: number, a0: number, r0: number, sense: number, turns: number, b: number): Pt[] {
  const pts: Pt[] = [];
  const steps = Math.ceil(turns * 40);
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * turns * TAU;
    const r = r0 * Math.exp(-b * th);
    pts.push([cx + r * Math.cos(a0 + sense * th), cy + r * Math.sin(a0 + sense * th)]);
  }
  return pts;
}

/** Spiral ribbon (Ionic volute). Spiral centre at 0,0, starts at angle 0 (pointing +x). */
export function volute(r: number, o: { turns?: number; width?: number; dir?: 1 | -1 } = {}): Path2D {
  const turns = o.turns ?? 2.2;
  const dir = o.dir ?? 1;
  const b = 0.16;
  return memoPath(`volute${r},${turns},${o.width},${dir}`, () => {
    const pts = spiralPts(0, 0, 0, r, dir, turns, b);
    const gap = 1 - Math.exp(-b * TAU);
    const widths = pts.map((_, i) => {
      const th = (i / (pts.length - 1)) * turns * TAU;
      return (o.width ?? 0.55) * r * gap * Math.exp(-b * th);
    });
    const p = ribbon(pts, widths);
    const end = pts[pts.length - 1];
    addCircle(p, end[0], end[1], widths[widths.length - 1] * 1.25);
    return p;
  });
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** a spiral continuing from end point E with tangent T, curling toward side (±1 = left/right of T) */
function curlFrom(E: Pt, T: Pt, side: number, R: number, turns: number): Pt[] {
  const len = Math.hypot(T[0], T[1]) || 1;
  const tx = T[0] / len;
  const ty = T[1] / len;
  // left normal (dy,-dx)
  const nx = side * ty;
  const ny = side * -tx;
  const C: Pt = [E[0] + nx * R, E[1] + ny * R];
  const a0 = Math.atan2(E[1] - C[1], E[0] - C[0]);
  const sense = tx * -Math.sin(a0) + ty * Math.cos(a0) > 0 ? 1 : -1;
  return spiralPts(C[0], C[1], a0, R, sense, turns, 0.22).slice(1);
}

/**
 * C- or S-scroll spanning (0,0) -> (w,0); the body bows toward -y by h.
 * thick = max ribbon width. Ends curl into volutes (C: both curl inward; S: opposite).
 */
export function scroll(o: { w: number; h: number; kind?: 'C' | 'S'; thick?: number; curl?: number }): Path2D {
  const kind = o.kind ?? 'C';
  const thick = o.thick ?? Math.max(2, o.w * 0.07);
  const curl = o.curl ?? Math.min(o.w, o.h * 2) * 0.22;
  return memoPath(`scroll${o.w},${o.h},${kind},${thick},${curl}`, () => {
    const { w, h } = o;
    const P0: Pt = [curl, 0];
    const P3: Pt = [w - curl, kind === 'C' ? 0 : -h * 0.2];
    const body = kind === 'C' ? cubic(P0, [w * 0.05, -h * 1.25], [w * 0.95, -h * 1.25], P3, 40) : cubic(P0, [w * 0.15, -h * 1.5], [w * 0.85, h * 1.1], P3, 40);
    const tStart: Pt = [body[0][0] - body[1][0], body[0][1] - body[1][1]];
    const n = body.length;
    const tEnd: Pt = [body[n - 1][0] - body[n - 2][0], body[n - 1][1] - body[n - 2][1]];
    // C: curls turn inward (under the bow); S: start curls down, end curls up
    const startCurl = curlFrom(body[0], tStart, kind === 'C' ? 1 : 1, curl * 0.9, 1.4).reverse();
    const endCurl = curlFrom(body[n - 1], tEnd, kind === 'C' ? -1 : 1, curl * 0.9, 1.4);
    const pts = [...startCurl, ...body, ...endCurl];
    const total = pts.length;
    const sStart = startCurl.length;
    const widths = pts.map((_, i) => {
      if (i < sStart) return thick * (0.25 + 0.6 * (i / sStart));
      if (i >= sStart + n) return thick * (0.85 - 0.6 * ((i - sStart - n) / (total - sStart - n)));
      const u = (i - sStart) / (n - 1);
      return thick * (0.85 + 0.15 * Math.sin(Math.PI * u));
    });
    const p = ribbon(pts, widths);
    addCircle(p, pts[0][0], pts[0][1], thick * 0.32);
    addCircle(p, pts[total - 1][0], pts[total - 1][1], thick * 0.32);
    return p;
  });
}

/** Acanthus leaf from base (0,0) growing toward -y; curl bends the tip over (+ = right). evenodd. */
export function acanthus(o: { len: number; w?: number; curl?: number; lobes?: number }): Path2D {
  const w = o.w ?? o.len * 0.45;
  const curl = o.curl ?? 1.2;
  const lobes = o.lobes ?? 4;
  return memoPath(`acanthus${o.len},${w},${curl},${lobes}`, () => {
    const N = 60;
    const centre: Pt[] = [];
    let x = 0;
    let y = 0;
    let ang = -Math.PI / 2;
    const ds = o.len / N;
    for (let i = 0; i <= N; i++) {
      centre.push([x, y]);
      const t = i / N;
      ang += (curl * 3 * t * t) / N;
      x += Math.cos(ang) * ds;
      y += Math.sin(ang) * ds;
    }
    const half = (t: number) => {
      const env = Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - 0.35 * t);
      const lobe = 0.7 + 0.3 * Math.pow(Math.abs(Math.sin(lobes * Math.PI * t)), 0.6);
      const serr = 0.08 * Math.pow(Math.abs(Math.sin(lobes * 3 * Math.PI * t)), 2);
      return (w / 2) * env * (lobe + serr);
    };
    const widths = centre.map((_, i) => 2 * half(i / N) + 0.6);
    const p = ribbon(centre, widths);
    // midrib slit
    const rib = centre.slice(3, Math.floor(N * 0.78));
    ribbon(rib, rib.map((_, i) => Math.max(0.6, w * 0.06 * (1 - i / rib.length))), p, true);
    // "eyes" between lobes
    for (let k = 1; k < lobes; k++) {
      const t = k / lobes;
      const i = Math.round(t * N);
      if (i >= N - 2) continue;
      const [cx, cy] = centre[i];
      const a = Math.atan2(centre[i + 1][1] - cy, centre[i + 1][0] - cx);
      const off = half(t) * 0.62;
      for (const s of [-1, 1]) {
        const ex = cx + Math.cos(a + (s * Math.PI) / 2) * off;
        const ey = cy + Math.sin(a + (s * Math.PI) / 2) * off;
        addEllipse(p, ex, ey, Math.max(0.8, w * 0.07), Math.max(0.5, w * 0.035), a + s * 0.5, true);
      }
    }
    return p;
  });
}

/** Anthemion / palmette fan above (0,0). Contours never overlap (usable as holes in a wall). */
export function palmette(o: { r: number; leaves?: number; spread?: number }): Path2D {
  const leaves = o.leaves ?? 9;
  const spread = o.spread ?? Math.PI * 0.86;
  return memoPath(`palmette${o.r},${leaves},${spread}`, () => {
    const p = new Path2D();
    const r = o.r;
    const base = r * 0.2;
    // base: a half-disc boss
    p.moveTo(-base, 0);
    p.arc(0, 0, base, Math.PI, TAU, false);
    p.closePath();
    for (let i = 0; i < leaves; i++) {
      const u = leaves === 1 ? 0.5 : i / (leaves - 1);
      const a = -Math.PI / 2 + (u - 0.5) * spread;
      const centreLeaf = Math.abs(u - 0.5) < 1e-6;
      const len = r * (centreLeaf ? 1 : 0.62 + 0.3 * Math.cos((u - 0.5) * Math.PI) ** 2) * (i % 2 ? 0.9 : 1);
      const curlSide = u < 0.5 ? -1 : 1;
      const pts: Pt[] = [];
      const widths: number[] = [];
      const M = 18;
      const angW = (spread / (leaves - 1 || 1)) * 0.6;
      for (let k = 0; k <= M; k++) {
        const t = k / M;
        const rr = base * 1.35 + (len - base * 1.35) * t;
        const aa = a + curlSide * 0.28 * t * t * (centreLeaf ? 0 : 1);
        pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]);
        widths.push(Math.max(0.5, Math.min(angW * rr * 1.25, r * 0.24) * Math.sin(Math.PI * Math.pow(t, 0.45)) * (1 - 0.2 * t)));
      }
      ribbon(pts, widths, p);
    }
    return p;
  });
}

// ---------------------------------------------------------------------------
// finials & pinnacles
// ---------------------------------------------------------------------------
/** Crocketed gothic spire, base centre (0,0), apex at -h. */
export function pinnacle(o: { h: number; w?: number; crockets?: number }): Path2D {
  const w = o.w ?? o.h * 0.22;
  const cr = o.crockets ?? 5;
  return memoPath(`pinnacle${o.h},${w},${cr}`, () => {
    const p = new Path2D();
    const spireH = o.h * 0.78;
    const N = cr * 10;
    const left: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const hw = (w / 2) * (1 - t);
      const bump = w * 0.16 * Math.pow(Math.max(0, Math.sin(Math.PI * ((t * cr) % 1))), 3) * (1 - t * 0.6);
      left.push([-(hw + bump), -t * spireH]);
    }
    const right = left.map(([x, y]) => [-x, y] as Pt).reverse();
    addPolyWound(p, [[-w / 2, 0], ...left, ...right, [w / 2, 0]]);
    // fleuron at the apex
    addFoil(p, 0, -spireH - o.h * 0.08, o.h * 0.09, 3, { lobe: 0.7 });
    addRect(p, -w * 0.06, -spireH - o.h * 0.03, w * 0.12, o.h * 0.04);
    return p;
  });
}

export type FinialKind = 'ball' | 'acorn' | 'urn' | 'flameUrn' | 'spire';
/** Finial, base centre (0,0), height h. */
export function finial(kind: FinialKind, h: number): Path2D {
  return memoPath(`finial${kind},${h}`, () => {
    if (kind === 'spire') return pinnacle({ h });
    const map: Record<string, TurningKind> = { ball: 'finial', acorn: 'finialAcorn', urn: 'urn', flameUrn: 'urn' };
    const p = new Path2D();
    const bodyH = kind === 'flameUrn' ? h * 0.66 : h;
    placeTurning(p, turning(map[kind], bodyH), 0, 0);
    if (kind === 'flameUrn') {
      // a carved flame: S-curving teardrop
      const pts: Pt[] = [];
      const fh = h * 0.36;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const hw = h * 0.07 * Math.sin(Math.PI * Math.pow(t, 0.6));
        pts.push([hw + Math.sin(t * 5) * h * 0.02 * t, -bodyH + h * 0.02 - t * fh]);
      }
      for (let i = 20; i >= 0; i--) {
        const t = i / 20;
        const hw = h * 0.07 * Math.sin(Math.PI * Math.pow(t, 0.6));
        pts.push([-hw + Math.sin(t * 5) * h * 0.02 * t, -bodyH + h * 0.02 - t * fh]);
      }
      addPolyWound(p, pts);
    }
    return p;
  });
}

// ---------------------------------------------------------------------------
// bands & edges
// ---------------------------------------------------------------------------
/** Scalloped lace band, top-left (0,0): solid header h, scallops below with eyelets. evenodd. */
export function scallopEdge(o: { w: number; h?: number; pitch?: number; depth?: number; eyelets?: boolean }): Path2D {
  const h = o.h ?? 4;
  const pitch = o.pitch ?? 14;
  const depth = o.depth ?? pitch * 0.45;
  const eyelets = o.eyelets ?? true;
  return memoPath(`scallop${o.w},${h},${pitch},${depth},${eyelets}`, () => {
    const p = new Path2D();
    const n = Math.max(1, Math.round(o.w / pitch));
    const pw = o.w / n;
    const pts: Pt[] = [[0, 0], [o.w, 0]];
    for (let i = n - 1; i >= 0; i--) {
      for (let k = 0; k <= 10; k++) {
        const t = 1 - k / 10;
        pts.push([(i + t) * pw, h + depth * Math.sin(Math.PI * t)]);
      }
    }
    addPolyWound(p, pts);
    if (eyelets) {
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * pw;
        addCircle(p, cx, h + depth * 0.45, Math.min(pw, depth) * 0.18, true);
        addEllipse(p, cx - pw * 0.24, h + depth * 0.18, pw * 0.07, depth * 0.1, 0.5, true);
        addEllipse(p, cx + pw * 0.24, h + depth * 0.18, pw * 0.07, depth * 0.1, -0.5, true);
      }
    }
    return p;
  });
}

/** Braid band plus hanging tassels, top-left (0,0). Pitch is tassel spacing. nonzero. */
export function tasselFringe(o: { w: number; pitch?: number; len?: number; band?: number }): Path2D {
  const pitch = o.pitch ?? 13;
  const len = o.len ?? 26;
  const band = o.band ?? 4;
  return memoPath(`tassel${o.w},${pitch},${len},${band}`, () => {
    const p = new Path2D();
    addRect(p, 0, 0, o.w, band);
    // braid zig-zag cut by small scallops on the lower edge
    const n = Math.max(1, Math.floor(o.w / pitch));
    const start = (o.w - (n - 1) * pitch) / 2;
    const r = pitch * 0.22;
    for (let i = 0; i < n; i++) {
      const x = start + i * pitch;
      const y0 = band;
      // cord
      addRect(p, x - 0.45, y0 - 0.5, 0.9, len * 0.22 + 0.5);
      // head (ball + collar)
      addCircle(p, x, y0 + len * 0.22 + r, r);
      addRect(p, x - r * 0.75, y0 + len * 0.22 + r * 1.7, r * 1.5, len * 0.06);
      // skirt as strands
      const top = y0 + len * 0.22 + r * 1.7 + len * 0.05;
      const bot = y0 + len;
      const strands = 5;
      for (let s = 0; s < strands; s++) {
        const u = s / (strands - 1) - 0.5;
        const xt = x + u * r * 1.3;
        const xb = x + u * r * 2.6;
        const sw = Math.max(0.6, r * 0.32);
        addPolyWound(p, [
          [xt - sw / 2, top],
          [xt + sw / 2, top],
          [xb + sw * 0.45, bot],
          [xb - sw * 0.45, bot],
        ]);
      }
    }
    return p;
  });
}

/** Balustrade: bottom-left (0,0), total height h (up = -y). Rail and plinth heights as fractions. */
export function balustrade(o: { w: number; h: number; pitch?: number; rail?: number; plinth?: number; slim?: boolean; posts?: boolean }): Path2D {
  const pitch = o.pitch ?? o.h * 0.32;
  const rail = o.rail ?? 0.12;
  const plinth = o.plinth ?? 0.12;
  return memoPath(`balustrade${o.w},${o.h},${pitch},${rail},${plinth},${o.slim},${o.posts}`, () => {
    const p = new Path2D();
    const { w, h } = o;
    const rh = h * rail;
    const ph = h * plinth;
    addRect(p, -pitch * 0.15, -h, w + pitch * 0.3, rh * 0.45); // cap moulding overhang
    addRect(p, 0, -h + rh * 0.4, w, rh * 0.6);
    addRect(p, 0, -ph, w, ph);
    const bh = h - rh - ph;
    const t = turning(o.slim ? 'balusterSlim' : 'baluster', bh + 1, o.slim ? pitch * 0.42 : pitch * 0.72);
    const posts = o.posts ?? true;
    const x0 = posts ? pitch * 1.1 : pitch * 0.5;
    const x1 = posts ? w - pitch * 1.1 : w - pitch * 0.5;
    const n = Math.max(1, Math.round((x1 - x0) / pitch));
    for (let i = 0; i <= n; i++) placeTurning(p, t, x0 + ((x1 - x0) * i) / n, -ph + 0.5);
    if (posts) {
      addRect(p, 0, -h, pitch * 0.62, h);
      addRect(p, w - pitch * 0.62, -h, pitch * 0.62, h);
    }
    return p;
  });
}

/** Egg-and-dart moulding band, top-left (0,0). evenodd (shells are holes, eggs solid). */
export function eggAndDart(o: { w: number; h: number }): Path2D {
  return memoPath(`egg${o.w},${o.h}`, () => {
    const { w, h } = o;
    const p = new Path2D();
    addRect(p, 0, 0, w, h);
    const pitch = h * 1.05;
    const n = Math.max(1, Math.floor(w / pitch));
    const st = (w - n * pitch) / 2;
    for (let i = 0; i < n; i++) {
      const cx = st + (i + 0.5) * pitch;
      // shell hole (U shape) and egg inside
      const pts: Pt[] = [];
      for (let k = 0; k <= 16; k++) {
        const a = Math.PI * (k / 16);
        pts.push([cx + Math.cos(a) * pitch * 0.4, h * 0.14 + Math.sin(a) * h * 0.72]);
      }
      addPolyWound(p, pts, true);
      addEllipse(p, cx, h * 0.4, pitch * 0.27, h * 0.34);
      // dart between shells
      if (i < n - 1) {
        const dx = cx + pitch / 2;
        addPolyWound(p, [[dx - 0.6, h * 0.12], [dx + 0.6, h * 0.12], [dx + 0.6, h * 0.55], [dx + pitch * 0.07, h * 0.6], [dx, h * 0.9], [dx - pitch * 0.07, h * 0.6], [dx - 0.6, h * 0.55]], true);
      }
    }
    return p;
  });
}

/** Dentil band: solid strip of height h*0.4 with teeth below, top-left (0,0). */
export function dentils(o: { w: number; h: number; pitch?: number }): Path2D {
  const pitch = o.pitch ?? o.h * 0.9;
  return memoPath(`dentil${o.w},${o.h},${pitch}`, () => {
    const p = new Path2D();
    addRect(p, 0, 0, o.w, o.h * 0.4);
    const n = Math.floor(o.w / pitch);
    for (let i = 0; i < n; i++) addRect(p, i * pitch + pitch * 0.18, o.h * 0.4 - 0.3, pitch * 0.62, o.h * 0.6 + 0.3);
    return p;
  });
}

/** Crenellated parapet: bottom-left (0,0), height h (up = -y), merlons with optional arrow slits. evenodd. */
export function crenellation(o: { w: number; h: number; merlon?: number; gap?: number; slits?: boolean }): Path2D {
  const merlon = o.merlon ?? o.h * 0.9;
  const gap = o.gap ?? merlon * 0.6;
  return memoPath(`cren${o.w},${o.h},${merlon},${gap},${o.slits}`, () => {
    const p = new Path2D();
    const base = o.h * 0.45;
    const pts: Pt[] = [[0, 0], [0, -o.h]];
    let x = 0;
    const slitAt: number[] = [];
    while (x < o.w) {
      const x1 = Math.min(o.w, x + merlon);
      pts.push([x1, -o.h]);
      slitAt.push((x + x1) / 2);
      if (x1 >= o.w) break;
      const x2 = Math.min(o.w, x1 + gap);
      pts.push([x1, -base], [x2, -base], [x2, -o.h]);
      x = x2;
    }
    pts.push([o.w, 0]);
    addPolyWound(p, pts);
    if (o.slits) for (const sx of slitAt) addRect(p, sx - 0.9, -o.h * 0.88, 1.8, o.h * 0.5, true);
    return p;
  });
}

/** Ornate frame (mirror / portrait): opening is a hole; crest of scrolls + palmette; top-left (0,0). nonzero. */
export function ornateFrame(o: { w: number; h: number; band?: number; crest?: boolean; apron?: boolean }): Path2D {
  const band = o.band ?? Math.max(6, o.w * 0.07);
  const crest = o.crest ?? true;
  const apron = o.apron ?? true;
  return memoPath(`oframe${o.w},${o.h},${band},${crest},${apron}`, () => {
    const { w, h } = o;
    const p = new Path2D();
    addRect(p, 0, 0, w, h);
    addRect(p, band, band, w - 2 * band, h - 2 * band, true);
    // corner rosettes stuck out a little
    for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]] as Pt[]) addCircle(p, cx, cy, band * 0.7);
    if (crest) {
      const sw = w * 0.32;
      at(p, scroll({ w: sw, h: band * 1.6, kind: 'S', thick: band * 0.45 }), w / 2 - sw - band * 0.2, -band * 0.1);
      at(p, scroll({ w: sw, h: band * 1.6, kind: 'S', thick: band * 0.45 }), w / 2 + sw + band * 0.2, -band * 0.1, -1, 1);
      at(p, palmette({ r: band * 2.6, leaves: 7 }), w / 2, -band * 0.2);
      addRect(p, w / 2 - band * 0.25, -band * 0.4, band * 0.5, band * 0.5);
    }
    if (apron) {
      const sw = w * 0.2;
      at(p, scroll({ w: sw, h: band, kind: 'C', thick: band * 0.4 }), w / 2 - sw, h + band * 0.15, 1, -1);
      at(p, scroll({ w: sw, h: band, kind: 'C', thick: band * 0.4 }), w / 2 + sw, h + band * 0.15, -1, -1);
      addFoil(p, w / 2, h + band * 0.9, band * 0.9, 3, { rot: Math.PI / 2 });
    }
    return p;
  });
}

// ---------------------------------------------------------------------------
// painter
// ---------------------------------------------------------------------------
export interface OrnamentDraw {
  path: Path2D;
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  role?: FillRole;
  /** explicit colour (overrides role) */
  color?: string;
  rule?: CanvasFillRule;
  alpha?: number;
}

/** Fill a cached ornament path at (x, y). */
export const drawOrnament: Painter<OrnamentDraw> = (c, o, env) => {
  c.save();
  c.translate(o.x, o.y);
  if (o.rot) c.rotate(o.rot);
  if (o.scale && o.scale !== 1) c.scale(o.scale, o.scale);
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  c.fillStyle = o.color ?? env.fill(o.role ?? 'set');
  c.fill(o.path, o.rule ?? 'evenodd');
  c.restore();
};
