/**
 * mistyHills — gradient descent as a lantern-bearing traveller crossing misty hills.
 * The front ridge IS the loss curve of a closed-form function (below); the traveller
 * stands at the current iterate and every stride is one real gradient step
 * x <- x - lr * f'(x), precomputed per learning rate.
 *   lantern light radius  <- what the traveller can know: only the local slope
 *   lit tangent + arrow   <- f'(x) and the actual step lr * f'(x)
 *   stride / leap length  <- lr * |f'(x)| ; fog <- you cannot see the global minimum
 * Landscape: f(x) = 0.04x² + 1.8 − 0.8·exp(−(x+3)²/0.5) − 1.9·exp(−(x−2.2)²/6)
 *   local minimum (the trap) x ≈ −2.91, f ≈ 1.33 ; global minimum x ≈ 1.96, f ≈ 0.07
 * Verified paths from x0 = −5.3: lr 0.2 walks into the trap and stays; lr 1.8 leaps the
 * ridge and settles in the valley by step ~15; lr 3.5 overshoots forever (0.76 <-> 2.81).
 *
 *   mistyHills(c, {
 *     x?, y?, w?, h?    box (default the full stage)
 *     lr: number        learning rate (MISTY_LR.timid | .bold | .reckless or any)
 *     x0?: number       start (default −5.3)
 *     step: number      iterate index, fractional = mid-stride
 *     fog?: number      0..1 fog over the hills (lantern clears a pool around itself)
 *     tangent?: number  0..1 show the lit tangent and the step arrow
 *     trail?: boolean   cairns at past iterates
 *     labels?: boolean  "learning rate · step · loss" under the scene
 *     reveal?: number   0..1 hills rise, traveller appears
 *   }, env)
 *   descentPath(lr, x0?, n?) -> number[] ; lossF(x), lossDf(x)
 */
import type { PaintEnv } from '../../contracts';
import { mulberry32 } from '../../../core';
import { mixLab, withAlpha } from '../palette';
import { cachedArt, glow, label, practicalGlow, ramp, smooth } from './kit';

export const lossF = (x: number) =>
  0.04 * x * x + 1.8 - 0.8 * Math.exp(-((x + 3) ** 2) / 0.5) - 1.9 * Math.exp(-((x - 2.2) ** 2) / 6);
export const lossDf = (x: number) =>
  0.08 * x + 0.8 * Math.exp(-((x + 3) ** 2) / 0.5) * ((2 * (x + 3)) / 0.5) + 1.9 * Math.exp(-((x - 2.2) ** 2) / 6) * ((2 * (x - 2.2)) / 6);
export const MISTY_LR = { timid: 0.2, bold: 1.8, reckless: 3.5 } as const;
export const MISTY_MINIMA = { trap: -2.91, valley: 1.96 } as const;

const PATHS = new Map<string, number[]>();
/** The real gradient-descent iterates x_0..x_n for a learning rate (memoized). */
export function descentPath(lr: number, x0 = -5.3, n = 60): number[] {
  const key = `${lr}|${x0}|${n}`;
  const hit = PATHS.get(key);
  if (hit) return hit;
  const xs = [x0];
  let x = x0;
  for (let k = 0; k < n; k++) {
    x = Math.max(-6.4, Math.min(6.4, x - lr * lossDf(x)));
    xs.push(x);
  }
  PATHS.set(key, xs);
  return xs;
}

export interface MistyHillsOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  lr: number;
  x0?: number;
  step: number;
  fog?: number;
  tangent?: number;
  trail?: boolean;
  labels?: boolean;
  reveal?: number;
}

const XMIN = -6.4;
const XMAX = 6.4;

function geo(o: MistyHillsOpts) {
  const X = o.x ?? 0;
  const Y = o.y ?? 0;
  const W = o.w ?? 1280;
  const H = o.h ?? 720;
  const sx = (v: number) => X + ((v - XMIN) / (XMAX - XMIN)) * W;
  const sy = (f: number) => Y + H * 0.9 - (f / 3.6) * H * 0.48;
  return { X, Y, W, H, sx, sy, s: W / 1280 };
}

/** Back ridges (static): 4 hazed ridges with seeded silhouettes of trees. */
function drawBack(g: CanvasRenderingContext2D, env: PaintEnv, W: number, H: number) {
  const m = env.mood;
  const rnd = mulberry32(4242);
  const ridges = [
    { y: 0.42, amp: 0.07, haze: 0.78, f: 1.3 },
    { y: 0.5, amp: 0.08, haze: 0.62, f: 1.9 },
    { y: 0.58, amp: 0.07, haze: 0.45, f: 2.6 },
    { y: 0.66, amp: 0.06, haze: 0.3, f: 3.3 },
  ];
  // a low winter moon behind thin cloud, and a sparse, dim field of stars
  const mx = W * 0.71;
  const my = H * 0.19;
  const mr = H * 0.034;
  const mh = g.createRadialGradient(mx, my, mr, mx, my, mr * 7);
  mh.addColorStop(0, withAlpha(m.rim, 0.28));
  mh.addColorStop(1, withAlpha(m.rim, 0));
  g.fillStyle = mh;
  g.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
  g.fillStyle = mixLab(m.rim, m.core, 0.6);
  g.beginPath();
  g.arc(mx, my, mr, 0, Math.PI * 2);
  g.fill();
  g.save(); // the dark limb (a waxing moon), clipped to the disc
  g.beginPath();
  g.arc(mx, my, mr + 0.5, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = withAlpha(m.sky[1], 0.55);
  g.beginPath();
  g.arc(mx - mr * 0.45, my - mr * 0.1, mr * 0.95, 0, Math.PI * 2);
  g.fill();
  g.restore();
  for (let k = 0; k < 70; k++) {
    const sx = rnd() * W;
    const sy = Math.pow(rnd(), 1.4) * H * 0.36;
    const a = 0.12 + rnd() * 0.35;
    g.fillStyle = withAlpha(m.core, a * (1 - sy / (H * 0.4)));
    g.fillRect(sx, sy, rnd() < 0.15 ? 1.6 : 1, rnd() < 0.15 ? 1.6 : 1);
  }
  for (const [cy, ch, ca] of [[0.2, 0.025, 0.22], [0.27, 0.018, 0.16]]) {
    const cg = g.createLinearGradient(0, H * (cy - ch), 0, H * (cy + ch));
    cg.addColorStop(0, withAlpha(m.haze, 0));
    cg.addColorStop(0.5, withAlpha(m.haze, ca));
    cg.addColorStop(1, withAlpha(m.haze, 0));
    g.fillStyle = cg;
    g.fillRect(W * 0.35, H * (cy - ch), W * 0.65, H * ch * 2);
  }
  ridges.forEach((r, ri) => {
    const ph = rnd() * 10;
    const ph2 = rnd() * 10;
    const yAt = (x: number) =>
      H * r.y - H * r.amp * (0.6 * Math.sin((x / W) * Math.PI * r.f + ph) + 0.4 * Math.sin((x / W) * Math.PI * r.f * 2.3 + ph2));
    const p = new Path2D();
    p.moveTo(-10, H + 10);
    for (let x = -10; x <= W + 10; x += 8) p.lineTo(x, yAt(x));
    p.lineTo(W + 10, H + 10);
    p.closePath();
    // trees along the ridge crest (pines), smaller further back
    const ts = 6 + ri * 3.5;
    for (let k = 0; k < 26 + ri * 6; k++) {
      const x = rnd() * W;
      const y0 = yAt(x) + 2;
      const hh = ts * (0.8 + rnd() * 0.9);
      p.moveTo(x - hh * 0.28, y0);
      p.lineTo(x, y0 - hh * 1.8);
      p.lineTo(x + hh * 0.28, y0);
      p.closePath();
    }
    g.fillStyle = mixLab(m.set, m.haze, r.haze);
    g.fill(p);
    // a fog sheet between this ridge and the next
    const fy = H * (r.y + 0.05);
    const fg = g.createLinearGradient(0, fy - H * 0.08, 0, fy + H * 0.1);
    fg.addColorStop(0, withAlpha(m.haze, 0));
    fg.addColorStop(0.55, withAlpha(m.haze, 0.38));
    fg.addColorStop(1, withAlpha(m.haze, 0.1));
    g.fillStyle = fg;
    g.fillRect(0, fy - H * 0.08, W, H * 0.18);
  });
}

/** The front ridge (= the loss curve), with grass tufts and a lodge at the global minimum. */
function drawFront(g: CanvasRenderingContext2D, env: PaintEnv, o: MistyHillsOpts) {
  const G = geo({ ...o, x: 0, y: 0 });
  const p = new Path2D();
  p.moveTo(-10, G.H + 10);
  for (let px = -10; px <= G.W + 10; px += 4) {
    const v = XMIN + ((px) / G.W) * (XMAX - XMIN);
    p.lineTo(px, G.sy(lossF(v)));
  }
  p.lineTo(G.W + 10, G.H + 10);
  p.closePath();
  const rnd = mulberry32(77);
  // grass tufts and stones along the crest
  for (let k = 0; k < 140; k++) {
    const px = rnd() * G.W;
    const v = XMIN + (px / G.W) * (XMAX - XMIN);
    const y0 = G.sy(lossF(v)) + 1.5;
    const n = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) {
      const a = (rnd() - 0.5) * 0.9;
      const L = 4 + rnd() * 7;
      p.moveTo(px + j * 1.6 - 1, y0);
      p.lineTo(px + j * 1.6 + Math.sin(a) * L, y0 - Math.cos(a) * L);
      p.lineTo(px + j * 1.6 + 1.2, y0);
      p.closePath();
    }
  }
  // two bare trees on the hump and the far slope
  const tree = (v: number, hgt: number, seed: number) => {
    const r2 = mulberry32(seed);
    const bx = G.sx(v);
    const by = G.sy(lossF(v)) + 2;
    const branch = (x: number, y: number, ang: number, len: number, wd: number, depth: number) => {
      const x2 = x + Math.cos(ang) * len;
      const y2 = y + Math.sin(ang) * len;
      const nx = -Math.sin(ang) * wd * 0.5;
      const ny = Math.cos(ang) * wd * 0.5;
      p.moveTo(x + nx, y + ny);
      p.lineTo(x2 + nx * 0.6, y2 + ny * 0.6);
      p.lineTo(x2 - nx * 0.6, y2 - ny * 0.6);
      p.lineTo(x - nx, y - ny);
      p.closePath();
      if (depth > 0) {
        const k = 2 + (r2() < 0.4 ? 1 : 0);
        for (let i = 0; i < k; i++) branch(x2, y2, ang + (r2() - 0.5) * 1.3, len * (0.62 + r2() * 0.18), wd * 0.62, depth - 1);
      }
    };
    branch(bx, by, -Math.PI / 2, hgt * 0.36, hgt * 0.07, 5);
  };
  tree(-0.6, 120, 5);
  tree(5.2, 150, 9);
  // the lodge at the global minimum (window is a hole: the backlight shows through)
  const lx = G.sx(MISTY_MINIMA.valley) + 34;
  const ly = G.sy(lossF(MISTY_MINIMA.valley + 0.5)) + 3;
  p.moveTo(lx - 26, ly);
  p.lineTo(lx - 26, ly - 26);
  p.lineTo(lx - 4, ly - 44);
  p.lineTo(lx + 22, ly - 26);
  p.lineTo(lx + 22, ly);
  p.closePath();
  p.rect(lx + 6, ly - 52, 7, 16); // chimney
  g.fillStyle = env.fill('ink');
  g.fill(p, 'nonzero');
}

export function mistyHills(c: CanvasRenderingContext2D, o: MistyHillsOpts, env: PaintEnv): void {
  const G = geo(o);
  const m = env.mood;
  const reveal = o.reveal ?? 1;
  const fog = o.fog ?? 0.6;
  const path = descentPath(o.lr, o.x0 ?? -5.3, 60);
  const sc = Math.max(0, Math.min(path.length - 1 - 1e-6, o.step));
  const k = Math.floor(sc);
  const u = sc - k;
  const a = path[k];
  const b = path[Math.min(path.length - 1, k + 1)];
  const eu = smooth(u);
  const xv = a + (b - a) * eu;
  const leap = Math.abs(G.sx(b) - G.sx(a));
  const hop = Math.sin(Math.PI * eu) * Math.min(160, leap * 0.35);
  const tx = G.sx(xv);
  const ty = G.sy(lossF(xv)) - hop;

  const hillsA = smooth(ramp(reveal, 0, 0.5));
  c.save();
  c.globalAlpha *= hillsA;
  cachedArt(c, `misty-back:${m.id}`, G.X, G.Y, G.W, G.H, env.pxScale, (g) => {
    g.scale(G.W / G.W, 1);
    drawBack(g, env, G.W, G.H);
  });
  // lodge window light (behind the front ridge so the hole frames it)
  const lx = G.sx(MISTY_MINIMA.valley) + 34;
  const ly = G.sy(lossF(MISTY_MINIMA.valley + 0.5)) + 3;
  cachedArt(c, `misty-front:${m.id}:${G.W}x${G.H}`, G.X, G.Y, G.W, G.H, env.pxScale, (g) => drawFront(g, env, o));
  c.fillStyle = m.core;
  c.fillRect(lx - 14, ly - 20, 7, 8);
  glow(c, lx - 10, ly - 16, 40 * G.s, m.halo, 0.25);
  c.restore();

  // valley fog over the front ridge, cleared in a pool around the lantern
  if (fog > 0 && hillsA > 0) {
    const q = 4; // quarter-res buffer: fog is soft anyway
    const fw = Math.ceil(G.W / q);
    const fh = Math.ceil(G.H / q);
    const buf = fogBuffer(fw, fh);
    const g = buf.getContext('2d') as CanvasRenderingContext2D;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, fw, fh);
    // fog lies low: transparent above the crest line, thick in the valleys
    const vg = g.createLinearGradient(0, fh * 0.42, 0, fh);
    vg.addColorStop(0, withAlpha(m.haze, 0));
    vg.addColorStop(0.35, withAlpha(m.haze, 0.55 * fog));
    vg.addColorStop(0.7, withAlpha(m.haze, 0.8 * fog));
    vg.addColorStop(1, withAlpha(m.haze, 0.5 * fog));
    g.fillStyle = vg;
    g.fillRect(0, 0, fw, fh);
    // the lantern's pool of clear air
    const lx = (tx - G.X) / q;
    const ly = (ty - G.Y - 40 * G.s) / q;
    const R = (170 * G.s) / q;
    g.globalCompositeOperation = 'destination-out';
    const hole = g.createRadialGradient(lx, ly, 0, lx, ly, R);
    hole.addColorStop(0, 'rgba(0,0,0,1)');
    hole.addColorStop(0.5, 'rgba(0,0,0,0.85)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hole;
    g.fillRect(lx - R, ly - R, R * 2, R * 2);
    c.save();
    c.globalAlpha *= hillsA;
    c.imageSmoothingEnabled = true;
    c.drawImage(buf as CanvasImageSource, G.X, G.Y, G.W, G.H);
    c.restore();
  }

  // trail of cairns
  const travA = smooth(ramp(reveal, 0.4, 0.8));
  if (o.trail !== false && travA > 0) {
    c.save();
    c.globalAlpha *= travA;
    c.fillStyle = env.fill('ink');
    for (let i = 0; i <= k; i++) {
      const cx = G.sx(path[i]);
      const cy = G.sy(lossF(path[i])) + 1;
      c.beginPath();
      c.ellipse(cx, cy - 3, 6, 4, 0, 0, Math.PI * 2);
      c.ellipse(cx + 0.5, cy - 9, 4.2, 3, 0, 0, Math.PI * 2);
      c.ellipse(cx, cy - 13.5, 2.6, 2, 0, 0, Math.PI * 2);
      c.fill();
      glow(c, cx, cy - 14, 6, m.halo, 0.25);
    }
    c.restore();
  }

  // tangent and step arrow (the only thing the traveller can know)
  const tg = o.tangent ?? 0;
  if (tg > 0 && travA > 0 && u < 0.15) {
    const x = a;
    const d = lossDf(x);
    const px = G.sx(x);
    const py = G.sy(lossF(x));
    const dyDx = -(G.H * 0.48) / 3.6 / (G.W / (XMAX - XMIN)); // screen slope per unit slope
    const L = 110 * G.s;
    const ang = Math.atan(d * dyDx);
    const al = tg * travA * (1 - u / 0.15);
    c.save();
    c.globalAlpha *= al;
    c.strokeStyle = m.core;
    c.lineWidth = 2;
    c.setLineDash([6, 4]);
    c.beginPath();
    c.moveTo(px - Math.cos(ang) * L, py - Math.sin(ang) * L);
    c.lineTo(px + Math.cos(ang) * L, py + Math.sin(ang) * L);
    c.stroke();
    c.setLineDash([]);
    // the step: -lr * f'(x), drawn along the ground
    const nx = x - o.lr * d;
    const ax = G.sx(Math.max(XMIN, Math.min(XMAX, nx)));
    const ay = py + 22;
    c.strokeStyle = m.rim;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(px, ay);
    c.lineTo(ax, ay);
    c.stroke();
    const dir = Math.sign(ax - px) || 1;
    c.fillStyle = m.rim;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(ax - dir * 9, ay - 5);
    c.lineTo(ax - dir * 9, ay + 5);
    c.closePath();
    c.fill();
    label(c, `slope ${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}`, px, py - 120 * G.s, { size: 18, italic: true, color: m.core, align: 'center' });
    const stepV = -o.lr * d;
    label(c, `step = −lr × slope = ${stepV >= 0 ? '+' : '−'}${Math.abs(stepV).toFixed(2)}`, (px + ax) / 2, ay + 24, { size: 18, italic: true, color: m.rim, align: 'center' });
    c.restore();
  }

  // the traveller
  if (travA > 0) {
    const facing = Math.sign(b - a) || Math.sign(-lossDf(xv)) || 1;
    const walking = u > 0 && u < 1 && Math.abs(b - a) > 1e-3;
    traveller(c, tx, ty, 80 * G.s, facing as 1 | -1, walking ? env.tq : 0, hop > 4, env, travA);
  }

  if (o.labels) {
    const loss = lossF(k < path.length - 1 && u > 0.5 ? b : a);
    label(c, `learning rate ${o.lr}   ·   step ${k}   ·   loss ${loss.toFixed(2)}`, G.X + G.W / 2, G.Y + G.H - 22, {
      size: 21,
      italic: true,
      color: m.rim,
      align: 'center',
      alpha: smooth(ramp(reveal, 0.7, 1)),
    });
  }
}

let FOG: HTMLCanvasElement | OffscreenCanvas | null = null;
function fogBuffer(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (!FOG || FOG.width !== w || FOG.height !== h) {
    FOG = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  }
  return FOG;
}

/** A hooded traveller with a staff and lantern, feet at (x, y), height hgt. Walk cycle on twos from tq. */
function traveller(c: CanvasRenderingContext2D, x: number, y: number, hgt: number, facing: 1 | -1, tq: number, leaping: boolean, env: PaintEnv, alpha: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const ph = Math.sin(tq * Math.PI * 2 * 1.5);
  const s = hgt / 100;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.scale(facing * s, s);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  // legs
  const legA = leaping ? 0.5 : ph * 0.45;
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(0, -34);
  c.lineTo(Math.sin(legA) * 30, -Math.cos(legA) * 30 - 2);
  c.moveTo(0, -34);
  c.lineTo(Math.sin(-legA) * 30, -Math.cos(legA) * 30 - 2);
  c.stroke();
  // cloak (swings back, lagging the stride)
  const sw = leaping ? -10 : -4 - ph * 3;
  c.beginPath();
  c.moveTo(4, -86);
  c.quadraticCurveTo(14, -60, 14, -30);
  c.lineTo(sw - 18, -24);
  c.quadraticCurveTo(-20, -60, -8, -84);
  c.closePath();
  c.fill();
  // ragged hem (a few cut notches) and a bedroll pack on the back
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    const hx = sw - 16 + k * ((30 - sw) / 4);
    c.moveTo(hx, -27);
    c.lineTo(hx + 4, -20 - (k % 2) * 3);
    c.lineTo(hx + 8, -27);
  }
  c.fill();
  c.beginPath();
  c.ellipse(-16, -70, 9, 14, -0.25, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(-14, -88, 11, 5, -0.2, 0, Math.PI * 2);
  c.fill();
  // hood + head (profile with a hood point)
  c.beginPath();
  c.moveTo(-10, -84);
  c.quadraticCurveTo(-14, -104, 2, -108);
  c.quadraticCurveTo(14, -106, 12, -92);
  c.lineTo(14, -88);
  c.lineTo(10, -86);
  c.quadraticCurveTo(4, -80, -10, -84);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-6, -104);
  c.quadraticCurveTo(-20, -104, -24, -94);
  c.lineTo(-10, -96);
  c.fill();
  // arm and staff held forward
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(4, -74);
  c.lineTo(20, -60);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(14, 0);
  c.lineTo(30, -122);
  c.quadraticCurveTo(36, -130, 44, -124);
  c.stroke();
  // the lantern hangs from the crook
  const lx = 44;
  const ly = -104;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(44, -124);
  c.lineTo(lx, ly - 8);
  c.stroke();
  c.fillRect(lx - 5, ly - 8, 10, 3);
  c.fillRect(lx - 5, ly + 8, 10, 3);
  c.fillStyle = m.core;
  c.fillRect(lx - 4, ly - 5, 8, 13);
  c.fillStyle = ink;
  c.fillRect(lx - 0.6, ly - 5, 1.2, 13);
  c.restore();
  // light (screen-space, additive)
  const wx = x + facing * 44 * s;
  const wy = y - 102 * s;
  practicalGlow(c, wx, wy, 0.95 * alpha, env, 0.75 * (hgt / 58));
  glow(c, wx, wy + hgt * 0.9, 90 * (hgt / 58), m.halo, 0.12 * alpha); // pool on the ground
}
