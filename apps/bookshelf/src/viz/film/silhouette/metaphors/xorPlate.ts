/**
 * xorPlate — the XOR problem on a parchment plate, solved by the real XOR_221 net.
 *   four lanterns at (0,0) (0,1) (1,0) (1,1); lit <- XOR = 1
 *   sweep: ONE straight scissor cut sweeps through many positions; a ring marks
 *          every lantern on the wrong side (counted for real; never fewer than 1)
 *   solve: the two hidden units' own cut lines (w·x + b = 0 from the trained weights)
 *          and the network's real decision region (ŷ > 0.5) washed in lamplight
 *   fold:  the lanterns move from input space (x1, x2) to hidden space (h1, h2);
 *          there ONE straight cut (the output unit's line) separates them
 *
 *   xorPlate(c, {
 *     x, y, w, h        plate box (stage px); the plot is the largest square inside
 *     reveal?: number   0..1 plate, axes, lanterns
 *     sweep?: number    0..1 the single-cut sweep (0 = hidden)
 *     solve?: number    0..1 two hidden cuts + decision region
 *     fold?: number     0..1 move points into hidden space and show the output cut
 *     epoch?: number    weights of XOR_221 at this epoch (default: fully trained)
 *     captions?: boolean  one line of type under the plot saying what is shown
 *   }, env)
 *   xorSingleCut(sweep) -> {nx, ny, d, wrong}  the line used at sweep u (for narration sync)
 */
import type { PaintEnv } from '../../contracts';
import { withAlpha } from '../palette';
import { MFONT, PARCH, clamp01, glow, label, parchmentPlate, paperLantern, ramp, smooth } from './kit';
import { XOR_221, XOR_DATA, forward, netAt } from './mlp';
import { makeEnv } from '../palette';

export interface XorPlateOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  reveal?: number;
  sweep?: number;
  solve?: number;
  fold?: number;
  epoch?: number;
  captions?: boolean;
}

const LO = -0.32;
const HI = 1.32;

/** The single straight cut at sweep u: normal (nx, ny), offset d (line: nx·x + ny·y = d). */
export function xorSingleCut(u: number) {
  const phi = 0.35 + u * Math.PI * 1.65;
  const nx = Math.cos(phi);
  const ny = Math.sin(phi);
  const d = nx * 0.5 + ny * 0.5 + 0.42 * Math.sin(u * Math.PI * 5.0);
  // best labelling of the two sides, counted for real
  let a = 0;
  let b = 0;
  for (const p of XOR_DATA) {
    const side = nx * p.x[0] + ny * p.x[1] - d > 0;
    if (side === (p.y[0] === 1)) a++;
    else b++;
  }
  const flip = a < b;
  const wrong = XOR_DATA.map((p) => {
    const side = nx * p.x[0] + ny * p.x[1] - d > 0;
    return flip ? side === (p.y[0] === 1) : side !== (p.y[0] === 1);
  });
  return { nx, ny, d, wrong, nWrong: wrong.filter(Boolean).length };
}

let scissorPath: Path2D | null = null;
/** Tailor's shears, slightly open, pointing +x; pivot at the origin. Fill nonzero (bow holes wind backwards). */
function scissors(): Path2D {
  if (scissorPath) return scissorPath;
  const p = new Path2D();
  const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  for (const s of [-1, 1]) {
    const a = s * 0.11;
    // blade: a long tapered sliver with a straight cutting edge
    const pts: [number, number][] = [
      [-1, s * 2.6],
      [10, s * 3.2],
      [24, s * 2.0],
      [33, s * 0.25],
      [20, s * -0.2],
      [0, s * -0.6],
    ];
    pts.forEach(([x, y], i) => {
      const [rx, ry] = rot(x, y, a);
      if (i === 0) p.moveTo(rx, ry);
      else p.lineTo(rx, ry);
    });
    p.closePath();
    // shank to the bow
    const sh: [number, number][] = [
      [1, s * -0.6],
      [-7, s * 3.2],
      [-10, s * 6.5],
      [-8, s * 7.4],
      [-4, s * 4.6],
      [1, s * 2.6],
    ];
    sh.forEach(([x, y], i) => {
      const [rx, ry] = rot(x, y, -a * 0.6);
      if (i === 0) p.moveTo(rx, ry);
      else p.lineTo(rx, ry);
    });
    p.closePath();
    // bow: an oval ring (outer + inner; evenodd leaves the hole)
    const [bx, by] = rot(-15, s * 10, -a * 0.6);
    p.moveTo(bx + 8, by);
    p.ellipse(bx, by, 8, 5.6, s * 0.35, 0, Math.PI * 2);
    p.moveTo(bx + 5.6, by);
    p.ellipse(bx, by, 5.4, 3.2, s * 0.35, 0, Math.PI * 2, true); // reversed winding = hole under nonzero
  }
  scissorPath = p;
  return p;
}

/** Clip the line nx·x + ny·y = d to the plot square; returns endpoints in data space. */
function clipLine(nx: number, ny: number, d: number): [number, number, number, number] | null {
  const pts: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x >= LO - 1e-9 && x <= HI + 1e-9 && y >= LO - 1e-9 && y <= HI + 1e-9) pts.push([x, y]);
  };
  if (Math.abs(ny) > 1e-9) {
    add(LO, (d - nx * LO) / ny);
    add(HI, (d - nx * HI) / ny);
  }
  if (Math.abs(nx) > 1e-9) {
    add((d - ny * LO) / nx, LO);
    add((d - ny * HI) / nx, HI);
  }
  if (pts.length < 2) return null;
  let best: [number, number, number, number] = [pts[0][0], pts[0][1], pts[1][0], pts[1][1]];
  let bd = 0;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const dd = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (dd > bd) {
        bd = dd;
        best = [pts[i][0], pts[i][1], pts[j][0], pts[j][1]];
      }
    }
  return best;
}

// decision region bitmap (network output over the plot), cached by epoch
const REGION = new Map<string, HTMLCanvasElement | OffscreenCanvas>();
function region(epoch: number, space: 'input' | 'hidden'): HTMLCanvasElement | OffscreenCanvas {
  const key = `${space}:${epoch.toFixed(1)}`;
  const hit = REGION.get(key);
  if (hit) return hit;
  const N = 96;
  const cv: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(N, N) : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const g = cv.getContext('2d') as CanvasRenderingContext2D;
  const img = g.createImageData(N, N);
  const net = netAt(XOR_221, epoch);
  const hc = [0xf2, 0xc8, 0x79];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = LO + ((i + 0.5) / N) * (HI - LO);
      const y = HI - ((j + 0.5) / N) * (HI - LO);
      let yh: number;
      if (space === 'input') yh = forward(net, [x, y]).a[2][0];
      else {
        const W = net.W[1][0];
        yh = 1 / (1 + Math.exp(-(W[0] * x + W[1] * y + net.b[1][0])));
      }
      const k = (j * N + i) * 4;
      const v = smooth(clamp01((yh - 0.35) / 0.3));
      img.data[k] = hc[0];
      img.data[k + 1] = hc[1];
      img.data[k + 2] = hc[2];
      img.data[k + 3] = Math.round(v * 120);
    }
  g.putImageData(img, 0, 0);
  if (REGION.size > 64) REGION.delete(REGION.keys().next().value as string);
  REGION.set(key, cv);
  return cv;
}

const PENV = makeEnv({ mood: 'parchment' });

export function xorPlate(c: CanvasRenderingContext2D, o: XorPlateOpts, env: PaintEnv): void {
  const reveal = o.reveal ?? 1;
  const sweep = o.sweep ?? 0;
  const solve = o.solve ?? 0;
  const fold = smooth(o.fold ?? 0);
  const epoch = o.epoch ?? XOR_221.epochs;
  const net = netAt(XOR_221, epoch);
  const pA = smooth(ramp(reveal, 0, 0.3));
  parchmentPlate(c, { x: o.x, y: o.y, w: o.w, h: o.h, seed: 21, alpha: pA }, env);
  if (pA <= 0) return;
  const penv: PaintEnv = { ...PENV, t: env.t, tq: env.tq, frame: env.frame, pxScale: env.pxScale };
  const ink = PARCH.ink;
  const capH = o.captions ? 44 : 0;
  const S = Math.min(o.w - 150, o.h - 110 - capH);
  const px = o.x + (o.w - S) / 2 + 14;
  const py = o.y + (o.h - capH - S) / 2 - 4;
  const X = (v: number) => px + ((v - LO) / (HI - LO)) * S;
  const Y = (v: number) => py + S - ((v - LO) / (HI - LO)) * S;
  const axA = smooth(ramp(reveal, 0.25, 0.6));

  // axes
  c.save();
  c.globalAlpha *= axA;
  c.strokeStyle = withAlpha(ink, 0.8);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(X(LO + 0.06), Y(0));
  c.lineTo(X(HI - 0.04), Y(0));
  c.moveTo(X(0), Y(LO + 0.06));
  c.lineTo(X(0), Y(HI - 0.04));
  c.stroke();
  // arrowheads
  c.fillStyle = withAlpha(ink, 0.8);
  c.beginPath();
  c.moveTo(X(HI - 0.02), Y(0));
  c.lineTo(X(HI - 0.07), Y(0) - 4);
  c.lineTo(X(HI - 0.07), Y(0) + 4);
  c.closePath();
  c.moveTo(X(0), Y(HI - 0.02));
  c.lineTo(X(0) - 4, Y(HI - 0.07));
  c.lineTo(X(0) + 4, Y(HI - 0.07));
  c.closePath();
  c.fill();
  c.setLineDash([3, 4]);
  c.strokeStyle = withAlpha(ink, 0.25);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(X(1), Y(LO + 0.06));
  c.lineTo(X(1), Y(HI - 0.1));
  c.moveTo(X(LO + 0.06), Y(1));
  c.lineTo(X(HI - 0.1), Y(1));
  c.stroke();
  c.setLineDash([]);
  c.restore();
  const ax1 = fold > 0.5 ? 'h₁' : 'x₁';
  const ax2 = fold > 0.5 ? 'h₂' : 'x₂';
  const swapA = fold > 0.4 && fold < 0.6 ? Math.abs(fold - 0.5) * 10 : 1;
  label(c, ax1, X(HI - 0.02), Y(0) - 10, { size: 22, italic: true, color: ink, align: 'right', alpha: axA * swapA });
  label(c, ax2, X(0) - 12, Y(HI - 0.06), { size: 22, italic: true, color: ink, align: 'right', alpha: axA * swapA });
  const tickA = axA * smooth(ramp(fold, 0.55, 0.8));
  if (tickA > 0) {
    label(c, '0', X(0) - 10, Y(0) + 22, { size: 18, color: ink, align: 'center', alpha: tickA * 0.8 });
    label(c, '1', X(1), Y(0) + 22, { size: 18, color: ink, align: 'center', alpha: tickA * 0.8 });
    label(c, '1', X(0) - 12, Y(1) + 6, { size: 18, color: ink, align: 'right', alpha: tickA * 0.8 });
  }

  // decision region (input space) and then (hidden space)
  const solA = smooth(ramp(solve, 0.35, 0.8));
  if (solA > 0) {
    c.save();
    c.beginPath();
    c.rect(X(LO), Y(HI), S, S);
    c.clip();
    const sm = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = true;
    if (fold < 1) {
      c.globalAlpha *= solA * (1 - fold);
      c.drawImage(region(Math.round(epoch * 2) / 2, 'input') as CanvasImageSource, X(LO), Y(HI), S, S);
    }
    c.restore();
    c.save();
    c.beginPath();
    c.rect(X(LO), Y(HI), S, S);
    c.clip();
    if (fold > 0) {
      c.globalAlpha *= solA * fold;
      c.drawImage(region(Math.round(epoch * 2) / 2, 'hidden') as CanvasImageSource, X(LO), Y(HI), S, S);
    }
    c.imageSmoothingEnabled = sm;
    c.restore();
  }

  // cut lines
  const drawCut = (nx: number, ny: number, d: number, k: number, lw: number, withScissors: boolean) => {
    const seg = clipLine(nx, ny, d);
    if (!seg || k <= 0) return;
    const [x0, y0, x1, y1] = seg;
    const ex = x0 + (x1 - x0) * k;
    const ey = y0 + (y1 - y0) * k;
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = lw;
    // the cut itself: a kerf (ink line with a lifted, light-catching lip)
    c.beginPath();
    c.moveTo(X(x0), Y(y0));
    c.lineTo(X(ex), Y(ey));
    c.stroke();
    c.save();
    c.strokeStyle = withAlpha(PARCH.rim, 0.75);
    c.lineWidth = 0.9;
    c.translate(lw * 0.9, -lw * 0.9);
    c.stroke();
    c.restore();
    if (withScissors && k < 0.999) {
      // the guide still to cut, dashed and faint
      c.save();
      c.globalAlpha *= 0.4;
      c.lineWidth = 1.1;
      c.setLineDash([7, 6]);
      c.beginPath();
      c.moveTo(X(ex), Y(ey));
      c.lineTo(X(x1), Y(y1));
      c.stroke();
      c.restore();
    }
    if (withScissors) {
      c.translate(X(ex), Y(ey));
      c.rotate(Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0)));
      c.scale(1.7, 1.7);
      c.translate(-24, 0);
      c.fillStyle = ink;
      c.fill(scissors(), 'nonzero');
    }
    c.restore();
  };

  // 1) the single sweeping cut
  const swA = sweep > 0 ? smooth(ramp(sweep, 0, 0.06)) * (1 - smooth(ramp(solve, 0, 0.25))) : 0;
  let single: ReturnType<typeof xorSingleCut> | null = null;
  if (swA > 0) {
    single = xorSingleCut(sweep);
    c.save();
    c.globalAlpha *= swA;
    // shade the "lit" side faintly so the cut reads as a decision
    drawCut(single.nx, single.ny, single.d, 1, 2, true);
    c.restore();
  }

  // 2) the two hidden-unit cuts (from the network's first layer)
  const hA = smooth(ramp(solve, 0, 0.5)) * (1 - fold);
  if (hA > 0) {
    for (let j = 0; j < 2; j++) {
      const w = net.W[0][j];
      const b = net.b[0][j];
      const k = smooth(ramp(solve, j * 0.18, 0.35 + j * 0.18));
      c.save();
      c.globalAlpha *= 1 - fold;
      drawCut(w[0], w[1], -b, k, 1.8, k < 0.999);
      c.restore();
      if (k > 0.98) {
        const seg = clipLine(w[0], w[1], -b);
        if (seg) {
          const [ex, ey] = seg[0] > seg[2] ? [seg[0], seg[1]] : [seg[2], seg[3]];
          label(c, `h${'₁₂'[j]}`, X(ex) + 8, Y(ey) + 6, { size: 20, italic: true, color: ink, alpha: hA });
        }
      }
    }
  }
  // 3) in hidden space, the output unit's single cut
  if (fold > 0.55) {
    const w = net.W[1][0];
    const k = smooth(ramp(fold, 0.6, 1));
    drawCut(w[0], w[1], -net.b[1][0], k, 2, k < 0.999);
  }

  // lanterns (data points), moving to hidden space with fold
  const lA = smooth(ramp(reveal, 0.45, 0.9));
  XOR_DATA.forEach((p, i) => {
    const hpos = forward(net, p.x).a[1];
    const vx = p.x[0] + (hpos[0] - p.x[0]) * fold;
    const vy = p.x[1] + (hpos[1] - p.x[1]) * fold;
    const on = p.y[0] === 1;
    const cx = X(vx);
    const cy = Y(vy);
    if (single && single.wrong[i] && swA > 0) {
      c.save();
      c.globalAlpha *= swA;
      c.strokeStyle = ink;
      c.lineWidth = 1.6;
      c.setLineDash([3, 3]);
      c.beginPath();
      c.arc(cx, cy, 40, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
    paperLantern(c, { x: cx, y: cy, r: 23, act: on ? 1 : 0, alpha: lA * smooth(ramp(reveal, 0.45 + i * 0.1, 0.65 + i * 0.1)), halo: 0.45 }, penv);
    if (fold < 0.1)
      label(c, `(${p.x[0]}, ${p.x[1]})`, cx + (p.x[0] ? 34 : -34), cy + (p.x[1] ? -26 : 44), {
        size: 17,
        color: ink,
        align: p.x[0] ? 'left' : 'right',
        alpha: lA * 0.75 * (1 - fold * 10),
      });
  });
  if (single && swA > 0)
    label(c, `one cut · ${single.nWrong} on the wrong side`, o.x + o.w / 2, o.y + 54, { size: 22, italic: true, color: ink, align: 'center', alpha: swA });

  if (o.captions) {
    const cap =
      fold > 0.5
        ? 'In hidden space, one straight cut separates them.'
        : solve > 0.2
          ? 'Two hidden units, two cuts: lit where the net says 1.'
          : sweep > 0
            ? 'No single straight cut separates lit from dark.'
            : 'XOR: lit when exactly one input is 1.';
    label(c, cap, o.x + o.w / 2, o.y + o.h - 34, { size: 20, italic: true, color: ink, align: 'center', alpha: smooth(ramp(reveal, 0.6, 1)) });
  }
  // the plate is lit from above: a faint warm pool
  glow(c, o.x + o.w / 2, o.y + o.h * 0.4, Math.max(o.w, o.h) * 0.6, PARCH.halo, 0.04 * pA);
}
