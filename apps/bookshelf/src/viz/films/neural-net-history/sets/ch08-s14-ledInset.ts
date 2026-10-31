/**
 * ch08-s14 — the green-LED card: a small dark window in a cream, deckled paper mount pinned on the Wall of
 * Forecasts beside W4 (the shot projects its world rect each frame), in which ONE green status
 * LED (the bedroom card's) multiplies: two, then dozens on a rack face, then a distant aisle of racks
 * receding to a vanishing point, all blinking. At the shot's end the inset is pushed to full frame while its
 * inner camera dives back onto the first LED and everything else goes dark: a single green LED in
 * serverCyan dark (the match into ch09-s01).
 *
 *   ledInset(c, { rect, n, zoom, pivotMix, fade, t, frame, glow }, env-free)   draw in screen space (after layers)
 *
 * Inner space: IW × IH units (the inset at rest maps 1:1 onto it), a one-point aisle seen from its mouth.
 * LEDs are ranked: 0 = the first LED, 1 = its neighbour, then the near racks, then rack by rack into the
 * distance; `n` (fractional) is how many are lit. Pure function of its inputs; geometry built once.
 */
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
export const IW = 420;
export const IH = 260;
const VP = { x: 210, y: 116 };
const F = 300;
const A = 92; // aisle half-width
const YTOP = -150;
const YFLOOR = 116;
const DEPTH = 118;
const GAP = 12;
const NR = 11; // racks per side
const Z0 = 30;
const ROWS = 16;

const P = (X: number, Y: number, Z: number) => {
  const s = F / (F + Z);
  return { x: VP.x + X * s, y: VP.y + Y * s, s };
};

interface Led {
  x: number;
  y: number;
  s: number;
  rate: number;
  ph: number;
  rank: number;
  rack: number;
}
interface Geo {
  racks: { face: Path2D; seams: Path2D; top: Path2D; first: number }[];
  floor: Path2D;
  leds: Led[];
  led0: { x: number; y: number; s: number };
  n0: number;
}
let GEO: Geo | null = null;

function build(): Geo {
  const racks: Geo['racks'] = [];
  const raw: (Omit<Led, 'rank'> & { key: number; d: number })[] = [];
  const led0Z = Z0 + 16;
  const led0Y = YTOP + ((YFLOOR - YTOP) * 8.5) / ROWS;
  const L0 = P(A, led0Y, led0Z);
  let rackId = 0;
  for (let i = 0; i < NR; i++) {
    for (const side of [1, -1]) {
      const za = Z0 + i * (DEPTH + GAP);
      const zb = za + DEPTH;
      const X = side * A;
      const face = new Path2D();
      const q = [P(X, YTOP, za), P(X, YTOP, zb), P(X, YFLOOR, zb), P(X, YFLOOR, za)];
      face.moveTo(q[0].x, q[0].y);
      for (const p of q.slice(1)) face.lineTo(p.x, p.y);
      face.closePath();
      const top = new Path2D();
      const t0 = P(X, YTOP, za), t1 = P(X + side * 140, YTOP, za), t2 = P(X + side * 140, YTOP, zb), t3 = P(X, YTOP, zb);
      top.moveTo(t0.x, t0.y);
      top.lineTo(t1.x, t1.y);
      top.lineTo(t2.x, t2.y);
      top.lineTo(t3.x, t3.y);
      top.closePath();
      const seams = new Path2D();
      for (let u = 1; u < ROWS; u++) {
        const Y = YTOP + ((YFLOOR - YTOP) * u) / ROWS;
        const a = P(X, Y, za + 4), b = P(X, Y, zb - 4);
        seams.moveTo(a.x, a.y);
        seams.lineTo(b.x, b.y);
      }
      for (const zz of [za + 3, zb - 3]) {
        const a = P(X, YTOP + 3, zz), b = P(X, YFLOOR - 3, zz);
        seams.moveTo(a.x, a.y);
        seams.lineTo(b.x, b.y);
      }
      racks.push({ face, seams, top, first: 0 });
      // LEDs near each unit's front edge
      for (let u = 0; u < ROWS; u++) {
        const Y = YTOP + ((YFLOOR - YTOP) * (u + 0.5)) / ROWS;
        const cnt = 1 + Math.floor(((hash1(u * 31 + rackId, 5) + 1) / 2) * 3);
        for (let k = 0; k < cnt; k++) {
          if (hash1(u * 7 + k * 13 + rackId * 101, 9) < -0.55) continue;
          const zz = za + 16 + k * 12 + ((hash1(u + k * 3 + rackId * 17, 11) + 1) / 2) * 26;
          const p = P(X, Y, zz);
          const key = rackId === 0 && u === 8 && k === 0 ? 0 : rackId === 0 && u === 6 && k === 0 ? 1 : 2;
          const pp = key === 0 ? L0 : key === 1 ? P(A, YTOP + ((YFLOOR - YTOP) * 6.5) / ROWS, led0Z) : p;
          raw.push({
            x: pp.x,
            y: pp.y,
            s: pp.s,
            rate: 0.35 + ((hash1(rackId * 53 + u * 5 + k, 21) + 1) / 2) * 2.6,
            ph: (hash1(rackId * 19 + u * 3 + k, 23) + 1) * 5,
            rack: rackId,
            key,
            d: Math.hypot(pp.x - L0.x, pp.y - L0.y) + (rackId < 2 ? 0 : 1000 + rackId * 200),
          });
        }
      }
      rackId++;
    }
  }
  // make sure the first two exist
  if (!raw.some((r) => r.key === 0)) raw.push({ x: L0.x, y: L0.y, s: L0.s, rate: 1, ph: 0, rack: 0, key: 0, d: 0 });
  if (!raw.some((r) => r.key === 1)) {
    const p = P(A, YTOP + ((YFLOOR - YTOP) * 6.5) / ROWS, led0Z);
    raw.push({ x: p.x, y: p.y, s: p.s, rate: 1.3, ph: 2, rack: 0, key: 1, d: 1 });
  }
  raw.sort((a, b) => a.key - b.key || a.d - b.d);
  const leds: Led[] = raw.map((r, i) => ({ x: r.x, y: r.y, s: r.s, rate: r.rate, ph: r.ph, rack: r.rack, rank: i }));
  for (const r of racks) r.first = Infinity;
  for (const l of leds) racks[l.rack].first = Math.min(racks[l.rack].first, l.rank);
  const n0 = leds.filter((l) => l.rack < 2).length;
  // the floor: perforated tiles receding
  const floor = new Path2D();
  const zEnd = Z0 + NR * (DEPTH + GAP);
  for (let Z = Z0; Z < zEnd; Z += 44) {
    const a = P(-A, YFLOOR, Z), b = P(A, YFLOOR, Z);
    floor.moveTo(a.x, a.y);
    floor.lineTo(b.x, b.y);
  }
  for (let X = -A; X <= A + 0.1; X += A / 3) {
    const a = P(X, YFLOOR, Z0 - 60), b = P(X, YFLOOR, zEnd);
    floor.moveTo(a.x, a.y);
    floor.lineTo(b.x, b.y);
  }
  return { racks, floor, leds, led0: L0, n0 };
}
export function insetGeo(): Geo {
  if (!GEO) GEO = build();
  return GEO;
}

export interface InsetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface LedInsetOpts {
  rect: InsetRect;
  /** lit LEDs (fractional = the newest fading in) */
  n: number;
  /** inner zoom (1 = the whole aisle fits the inset) */
  zoom: number;
  /** 0 = centred on the first LED … 1 = centred on the aisle */
  pivotMix: number;
  /** 0..1 everything but the first LED goes dark */
  fade: number;
  /** racks visible 0..1 (scaled per rack by n) */
  racks: number;
  t: number;
  /** paper frame alpha (0 when the inset fills the frame) */
  frame: number;
  /** the study's mood (for the mount's paper, shadow and rim) */
  study: { ink: string; rim: string; fg: string; paper: string };
  /** the window's full rect (the mount is cut around it; default rect — differs while the shutter opens) */
  mount?: InsetRect;
  /** first LED flare 0..1 (the blink the next shot cuts on) */
  flare?: number;
  /** 0..1 faint picture-tiles drifting down the aisle floor toward the viewer ('bigger datasets'), low chroma */
  tiles?: number;
  pxScale: number;
}

const CY = MOODS.serverCyan;
export const LED_GREEN = mixLab('#6cf2a0', CY.core, 0.28);
const LED_DIM = mixLab('#1f5a45', CY.set, 0.3);

/** the first LED's heartbeat: on, with a short dark blink every 1.6 s (steady from 10.6 s) */
function led0On(t: number): number {
  if (t > 10.6) return 1;
  const ph = ((t - 3.89) / 1.6) % 1;
  return ph > 0.86 && ph < 0.93 ? 0.15 : 1;
}

/** small picture-tiles (the DATA card's 3×3 motif) sliding along the aisle floor from the vanishing point toward
 *  the mouth: grey-blue, low chroma, inner (aisle) coordinates. Pure function of t. */
const TILE_N = 26;
const Z_END = Z0 + NR * (DEPTH + GAP);
function dataTiles(c: C, t: number, a: number) {
  const tones = [mixLab(CY.setHaze, CY.rim, 0.25), mixLab(CY.set, CY.haze, 0.5), mixLab(CY.setHaze, CY.fg, 0.35)];
  for (let i = 0; i < TILE_N; i++) {
    const ph = (((t * 0.11 + (hash1(i, 71) + 1) / 2) % 1) + 1) % 1; // 0 far … 1 at the mouth
    const Z = Z_END - (Z_END - Z0 + 20) * ph;
    const X = hash1(i, 72) * A * 0.62;
    const p = P(X, YFLOOR - 3, Z);
    const s = 13 * p.s;
    const al = a * Math.min(1, ph * 5) * Math.min(1, (1 - ph) * 4) * 0.75;
    if (al <= 0.01 || s < 0.6) continue;
    c.globalAlpha = al;
    const x0 = p.x - s / 2, y0 = p.y - s * 0.32;
    // foreshortened onto the floor: a squat tile, three by three cells
    for (let gy = 0; gy < 3; gy++)
      for (let gx = 0; gx < 3; gx++) {
        c.fillStyle = tones[(i + gx * 2 + gy) % 3];
        c.fillRect(x0 + (gx * s) / 3, y0 + (gy * s * 0.32) / 3, s / 3 - 0.15 * s / 3, (s * 0.32) / 3 - 0.05);
      }
  }
  c.globalAlpha = 1;
}

export function ledInset(c: C, o: LedInsetOpts) {
  const R = o.rect;
  if (R.w < 2 || R.h < 1) return;
  const g = insetGeo();
  const zs = o.zoom * (R.w / IW);
  const center = { x: IW / 2, y: IH / 2 };
  const pv = { x: g.led0.x + (center.x - g.led0.x) * o.pivotMix, y: g.led0.y + (center.y - g.led0.y) * o.pivotMix };
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  const toS = (x: number, y: number) => ({ x: cx + (x - pv.x) * zs, y: cy + (y - pv.y) * zs });

  if (o.frame > 0.01) paperMount(c, o.mount ?? R, o);

  // a soft cyan spill around the inset onto the study (the one accent practical)
  if (o.frame > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sp = c.createRadialGradient(cx, cy, Math.min(R.w, R.h) * 0.3, cx, cy, R.w * 0.95);
    sp.addColorStop(0, withAlpha(CY.halo, 0.13 * o.frame));
    sp.addColorStop(1, withAlpha(CY.halo, 0));
    c.fillStyle = sp;
    c.fillRect(cx - R.w, cy - R.w, R.w * 2, R.w * 2);
    c.restore();
  }

  c.save();
  c.beginPath();
  c.rect(R.x, R.y, R.w, R.h);
  c.clip();
  // the dark: serverCyan night, a faint cool haze toward the vanishing point
  c.fillStyle = CY.fg;
  c.fillRect(R.x, R.y, R.w, R.h);
  const vp = toS(VP.x, VP.y);
  const hz = c.createRadialGradient(vp.x, vp.y, 0, vp.x, vp.y, IW * 0.75 * zs);
  const hk = o.racks * (1 - o.fade);
  hz.addColorStop(0, withAlpha(CY.haze, 0.42 * hk));
  hz.addColorStop(0.5, withAlpha(CY.set, 0.22 * hk));
  hz.addColorStop(1, withAlpha(CY.fg, 0));
  c.fillStyle = hz;
  c.fillRect(R.x, R.y, R.w, R.h);

  c.translate(cx, cy);
  c.scale(zs, zs);
  c.translate(-pv.x, -pv.y);
  // racks: paper-cut slabs, far to near, each appearing as its LEDs arrive
  if (hk > 0.005) {
    const face = mixLab(CY.set, CY.fg, 0.45);
    const topC = mixLab(CY.setHaze, CY.fg, 0.35);
    for (let i = g.racks.length - 1; i >= 0; i--) {
      const r = g.racks[i];
      const a = hk * Math.min(1, Math.max(0, (o.n - r.first + 3) / 10)) * (i < 2 ? Math.min(1, Math.max(0, (o.n - 2) / 14)) : 1);
      if (a <= 0.005) continue;
      c.globalAlpha = a;
      c.fillStyle = topC;
      c.fill(r.top);
      c.fillStyle = face;
      c.fill(r.face);
      c.strokeStyle = withAlpha(CY.rim, 0.13);
      c.lineWidth = 0.7 / zs;
      c.stroke(r.seams);
    }
    c.globalAlpha = hk * Math.min(1, Math.max(0, (o.n - 20) / 60));
    c.strokeStyle = withAlpha(CY.rim, 0.1);
    c.lineWidth = 0.8 / zs;
    c.stroke(g.floor);
    c.globalAlpha = 1;
    const tk = (o.tiles ?? 0) * hk;
    if (tk > 0.01) dataTiles(c, o.t, tk);
  }
  // LEDs: dim pads for lit-but-off, green for on; the newest fading in
  const lit = new Path2D();
  const dim = new Path2D();
  const others = 1 - o.fade;
  const nMax = Math.min(g.leds.length, Math.ceil(o.n));
  for (let i = 1; i < nMax; i++) {
    const l = g.leds[i];
    const on = i === 1 || ((o.t * l.rate + l.ph) % 1) < 0.66;
    const w = 2.6 * l.s, h = 1.5 * l.s;
    (on ? lit : dim).rect(l.x - w / 2, l.y - h / 2, w, h);
  }
  const newest = o.n - Math.floor(o.n);
  c.globalAlpha = others * (nMax > 2 ? 1 : newest > 0 && nMax === 2 ? newest : 1);
  if (nMax > 1) {
    c.fillStyle = LED_DIM;
    c.fill(dim);
    c.fillStyle = LED_GREEN;
    c.fill(lit);
    // bloom
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(CY.halo, 0.35);
    c.lineWidth = 1.6 / Math.sqrt(zs);
    c.stroke(lit);
    c.restore();
  }
  c.globalAlpha = 1;
  c.restore();

  // glows in screen space: the first LED (and its neighbour) carry real halos
  c.save();
  c.beginPath();
  c.rect(R.x, R.y, R.w, R.h);
  c.clip();
  c.globalCompositeOperation = 'lighter';
  const halo = (x: number, y: number, r: number, a: number) => {
    if (a <= 0.003) return;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, withAlpha(CY.core, a));
    gr.addColorStop(0.25, withAlpha(LED_GREEN, a * 0.55));
    gr.addColorStop(0.6, withAlpha(CY.halo, a * 0.18));
    gr.addColorStop(1, withAlpha(CY.halo, 0));
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  if (o.n > 0) {
    const l0 = g.leds[0];
    const p0 = toS(l0.x, l0.y);
    const on0 = led0On(o.t) * Math.min(1, o.n);
    const fl = o.flare ?? 0;
    const w = 2.6 * l0.s * zs, h = 1.5 * l0.s * zs;
    halo(p0.x, p0.y, Math.max(22, w * 5.5) * (1 + 0.6 * fl), (0.55 + 0.35 * fl) * on0);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = on0 > 0.5 ? mixLab(LED_GREEN, '#f4fff8', 0.35 + 0.4 * fl) : LED_DIM;
    c.beginPath();
    c.roundRect(p0.x - w / 2, p0.y - h / 2, w, h, Math.min(w, h) * 0.45);
    c.fill();
    c.globalCompositeOperation = 'lighter';
    if (nMax >= 2) {
      const l1 = g.leds[1];
      const p1 = toS(l1.x, l1.y);
      const on1 = 1;
      halo(p1.x, p1.y, Math.max(16, w * 4.5), 0.45 * on1 * others * (nMax > 2 ? 1 : newest || 1));
    }
  }
  c.restore();

  // the mount's inner bevel: a thin shadowed lip on the window's top and left, a lit lip bottom and right
  if (o.frame > 0.01) {
    const M = o.mount ?? R;
    const m = M.w / 260;
    c.save();
    c.globalAlpha = o.frame;
    c.fillStyle = withAlpha(o.study.fg, 0.55);
    c.fillRect(M.x, M.y, M.w, 2.2 * m);
    c.fillRect(M.x, M.y, 2.2 * m, M.h);
    c.fillStyle = withAlpha(o.study.rim, 0.35);
    c.fillRect(M.x, M.y + M.h - 1 * m, M.w, 1 * m);
    c.fillRect(M.x + M.w - 1 * m, M.y, 1 * m, M.h);
    c.restore();
  }
}


/** the cream paper mount: a soft drop shadow, a deckled outer edge (seeded), the window cut out, a pin at top */
function paperMount(c: C, M: InsetRect, o: LedInsetOpts) {
  const m = M.w / 260;
  const b = 11 * m;
  const x0 = M.x - b, y0 = M.y - b, x1 = M.x + M.w + b, y1 = M.y + M.h + b;
  const edge = new Path2D();
  const step = 7 * m;
  const pts: [number, number][] = [];
  const side = (ax: number, ay: number, bx: number, by: number, salt: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(2, Math.round(len / step));
    const nx = -(by - ay) / len, ny = (bx - ax) / len;
    for (let i = 0; i < n; i++) {
      const v = i / n;
      const j = hash1(i, salt) * 1.3 * m;
      pts.push([ax + (bx - ax) * v + nx * j, ay + (by - ay) * v + ny * j]);
    }
  };
  side(x0, y0, x1, y0, 81);
  side(x1, y0, x1, y1, 82);
  side(x1, y1, x0, y1, 83);
  side(x0, y1, x0, y0, 84);
  edge.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) edge.lineTo(p[0], p[1]);
  edge.closePath();
  c.save();
  c.globalAlpha = o.frame;
  // the soft drop shadow (the lamp is up and to the left)
  for (const [d, a] of [[9, 0.12], [6, 0.16], [3.5, 0.22]] as const) {
    c.save();
    c.translate(d * m * 0.8, d * m);
    c.fillStyle = withAlpha(o.study.fg, a);
    c.fill(edge);
    c.restore();
  }
  // the paper, a little warmer at the top-left corner where the lamp reaches it
  c.fillStyle = o.study.paper;
  c.fill(edge);
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, withAlpha(o.study.rim, 0.14));
  g.addColorStop(1, withAlpha(o.study.fg, 0.16));
  c.fillStyle = g;
  c.fill(edge);
  // the deckle catching the lamp along the top edge
  c.strokeStyle = withAlpha(o.study.rim, 0.45);
  c.lineWidth = 1 * m;
  c.beginPath();
  const top = pts.filter((p) => p[1] < y0 + 2 * m);
  if (top.length) {
    c.moveTo(top[0][0], top[0][1]);
    for (const p of top.slice(1)) c.lineTo(p[0], p[1]);
    c.stroke();
  }
  // its pin, in the top margin
  const px = (x0 + x1) / 2, py = y0 + b * 0.5;
  c.fillStyle = withAlpha(o.study.fg, 0.4);
  c.beginPath();
  c.arc(px + 1.5 * m, py + 2 * m, 3.6 * m, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(o.study.ink, o.study.rim, 0.35);
  c.beginPath();
  c.arc(px, py, 3.6 * m, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(o.study.rim, 0.7);
  c.beginPath();
  c.arc(px - 1 * m, py - 1 * m, 1.3 * m, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
