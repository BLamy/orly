/**
 * lanternNetwork — a neural network as paper lanterns hung from a loom beam and
 * joined by strings. Every visual variable is bound to the real network:
 *   lantern glow     <- unit activation (sigmoid, 0..1) for the current input
 *   string width     <- |w| ; colour <- sign (warm +, cool -) ; sag <- 1/(1+|w|)
 *   forward knots    <- |w_ji * a_i| (the contribution travelling the string)
 *   backward knots   <- |dL/dw_ji| for the current sample (the "messenger": a dark bead in a
 *                       ring of light, tugging each string thicker by its share of the blame)
 * Default network: XOR_221 (2-2-1, trained offline with full-batch GD; see mlp.ts).
 *
 *   lanternNetwork(c, {
 *     x, y, w, h,          box (stage px); the beam runs along the top edge
 *     training?: Training  (XOR_221 | XOR_241 | your own trainMLP result)
 *     epoch: number        weights at this (fractional) epoch, 0..training.epochs
 *     sample?: number      which data row is presented (fractional = blend inputs)
 *     input?: number[]     override the input vector
 *     wave?: number        forward wave 0..L (L = weight layers); default L (all lit)
 *     back?: number        backward pulse 0..L travelling output -> input; 0 = none
 *     reveal?: number      0..1 build: lanterns lower on their cords, then strings draw
 *     labels?: boolean     input/output slips (x1, x2, y-hat, target) and layer names
 *     readout?: boolean    "epoch · loss" set in type under the beam
 *     r?: number           lantern radius (default fits the box)
 *   }, env)
 *   lanternNetworkLayout(opts) -> unit centres (for attaching labels, puppets, cameras)
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { MFONT, clamp01, glow, knot, label, paperLantern, ramp, smooth, thread, threadPoint, weightColor, weightWidth } from './kit';
import type { MLP, Training } from './mlp';
import { XOR_221, forward, grads, lossAt, netAt } from './mlp';

export interface LanternNetworkOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  training?: Training;
  epoch: number;
  sample?: number;
  input?: number[];
  wave?: number;
  back?: number;
  reveal?: number;
  labels?: boolean;
  readout?: boolean;
  r?: number;
}

export interface NetLayout {
  r: number;
  beamY: number;
  units: { x: number; y: number }[][];
}

export function lanternNetworkLayout(o: LanternNetworkOpts): NetLayout {
  const sizes = (o.training ?? XOR_221).sizes;
  const L = sizes.length;
  const maxN = Math.max(...sizes);
  const r = o.r ?? Math.min(40, (o.h * 0.78) / (maxN * 2.9));
  const padX = r * 2.4;
  const top = o.y + r * 3.2;
  const bot = o.y + o.h - r * 1.8;
  const units = sizes.map((n, l) => {
    const x = o.x + padX + (l / (L - 1)) * (o.w - padX * 2);
    const span = Math.min(bot - top, (n - 1) * r * 3.4);
    const cy = (top + bot) / 2;
    return Array.from({ length: n }, (_, i) => ({ x, y: n === 1 ? cy : cy - span / 2 + (i / (n - 1)) * span }));
  });
  return { r, beamY: o.y, units };
}

function inputAt(tr: Training, o: LanternNetworkOpts): { x: number[]; y: number[] } {
  if (o.input) return { x: o.input, y: tr.data[0].y.map(() => NaN) };
  const s = Math.max(0, Math.min(tr.data.length - 1, o.sample ?? 0));
  const i = Math.floor(s);
  const u = smooth(s - i);
  const A = tr.data[i];
  const B = tr.data[Math.min(tr.data.length - 1, i + 1)];
  return { x: A.x.map((v, k) => v + (B.x[k] - v) * u), y: u < 0.5 ? A.y : B.y };
}

function maxAbsW(n: MLP): number {
  let m = 1e-6;
  for (const l of n.W) for (const r of l) for (const w of r) m = Math.max(m, Math.abs(w));
  return Math.max(m, 4);
}

export function lanternNetwork(c: CanvasRenderingContext2D, o: LanternNetworkOpts, env: PaintEnv): void {
  const tr = o.training ?? XOR_221;
  const net = netAt(tr, o.epoch);
  const L = net.W.length;
  const { r, beamY, units } = lanternNetworkLayout(o);
  const io = inputAt(tr, o);
  const { a } = forward(net, io.x);
  const hasTarget = !Number.isNaN(io.y[0]);
  const g = hasTarget ? grads(net, io.x, io.y) : null;
  const wave = o.wave ?? L;
  const back = o.back ?? 0;
  const reveal = o.reveal ?? 1;
  const wMax = maxAbsW(net);
  const m = env.mood;
  const ink = env.fill('ink');

  // --- the loom beam ---------------------------------------------------------
  const beamA = smooth(ramp(reveal, 0, 0.15));
  if (beamA > 0) {
    const x0 = o.x;
    const x1 = o.x + (o.w) * beamA;
    c.save();
    c.fillStyle = ink;
    c.fillRect(x0, beamY - 5, x1 - x0, 10);
    c.fillRect(x0, beamY + 6, x1 - x0, 2);
    // finials at each end, and a bracket per layer column
    const fin = (x: number) => {
      c.beginPath();
      c.arc(x, beamY, 9, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(x - 4, beamY - 8);
      c.quadraticCurveTo(x, beamY - 26, x + 4, beamY - 8);
      c.fill();
    };
    fin(x0);
    if (beamA > 0.99) fin(x1);
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x0 + 10, beamY - 5);
    c.lineTo(x1 - 10, beamY - 5);
    c.stroke();
    c.restore();
  }

  // layer lit level for the forward wave: layer l lights as the wave arrives
  const litLayer = (l: number) => (l === 0 ? smooth(ramp(wave, 0, 0.25)) : smooth(ramp(wave, l - 0.2, l)));
  const lowerU = (l: number, i: number) => smooth(ramp(reveal, 0.08 + l * 0.08 + i * 0.03, 0.4 + l * 0.08 + i * 0.03));
  const pos = (l: number, i: number) => {
    const p = units[l][i];
    const d = lowerU(l, i);
    return { x: p.x, y: beamY + (p.y - beamY) * (0.25 + 0.75 * d), d };
  };

  // --- strings ---------------------------------------------------------------
  const drawU = (l: number) => smooth(ramp(reveal, 0.5 + l * 0.12, 0.8 + l * 0.1));
  for (let l = 0; l < L; l++) {
    for (let j = 0; j < net.W[l].length; j++) {
      for (let i = 0; i < net.W[l][j].length; i++) {
        const w = net.W[l][j][i];
        const p0 = pos(l, i);
        const p1 = pos(l + 1, j);
        const sag = (r * 1.4) / (1 + Math.abs(w));
        const T = { x0: p0.x + r * 0.82, y0: p0.y, x1: p1.x - r * 0.82, y1: p1.y, sag };
        // the back pulse "tugs": string thickens as the messenger passes
        const bl = L - back; // position of the pulse in layer units (L at start, 0 at end)
        const tug = back > 0 ? Math.exp(-Math.pow((bl - (l + 0.5)) * 2.2, 2)) : 0;
        const gN = g ? Math.min(1, Math.abs(g.gW[l][j][i]) / 0.25) : 0;
        const lit = Math.max(litLayer(l + 1) * 0.6, 0);
        thread(
          c,
          {
            ...T,
            w: weightWidth(w, wMax) * (1 + tug * gN * 0.9),
            color: mixLab(weightColor(m, w), m.core, 0.25 * lit),
            alpha: 0.5 + 0.35 * lit + 0.15 * tug,
            draw: drawU(l),
          },
          env,
        );
        // forward knot: contribution w * a_i travelling i -> j
        if (wave > l && wave < l + 1) {
          const u = smooth(clamp01((wave - l) / 0.85));
          const contrib = Math.min(1, Math.abs(w * a[l][i]) / 6);
          const p = threadPoint(T, u);
          knot(c, p.x, p.y, 3 + 4 * contrib, 0.25 + 0.75 * contrib, env);
        }
        // backward knot: blame dL/dw travelling j -> i
        if (g && back > L - l - 1 && back < L - l) {
          const u = 1 - smooth(clamp01((back - (L - l - 1)) / 0.85));
          const p = threadPoint(T, u);
          blameKnot(c, p.x, p.y, 4 + 5 * gN, 0.35 + 0.65 * gN, env);
        }
      }
    }
  }

  // --- cords first (a lower lantern's cord passes behind the one above) -----
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = Math.max(0.9, r * 0.045);
  c.beginPath();
  for (let l = 0; l <= L; l++)
    for (let i = 0; i < units[l].length; i++) {
      const p = pos(l, i);
      if (p.d <= 0.001) continue;
      c.moveTo(p.x, beamY + 5);
      c.lineTo(p.x, p.y - r * 1.15);
    }
  c.stroke();
  c.restore();

  // --- lanterns --------------------------------------------------------------
  for (let l = 0; l <= L; l++) {
    for (let i = 0; i < units[l].length; i++) {
      const p = pos(l, i);
      if (p.d <= 0.001) continue;
      const act = a[l][i] * litLayer(l);
      const isOut = l === L;
      // error flare on the output lantern at the start of the backward pass
      const flare = isOut && back > 0 ? Math.exp(-Math.pow(back * 4, 2)) : 0;
      paperLantern(
        c,
        {
          x: p.x,
          y: p.y,
          r: isOut ? r * 1.15 : r,
          act,
          flare,
          alpha: smooth(ramp(p.d, 0, 0.25)),
        },
        env,
      );
    }
  }

  // --- labels ----------------------------------------------------------------
  if (o.labels) {
    const la = smooth(ramp(reveal, 0.7, 1));
    const sz = Math.max(18, r * 0.55);
    for (let i = 0; i < units[0].length; i++) {
      const p = pos(0, i);
      label(c, `x${'₁₂₃₄₅₆₇₈₉'[i] ?? i + 1} = ${fmt(io.x[i])}`, p.x - r * 1.25, p.y + sz * 0.35, { size: sz, color: m.rim, align: 'right', alpha: la * (0.55 + 0.45 * litLayer(0)), font: MFONT.serif, italic: true, shadow: withAlpha(ink, 0.85) });
    }
    const po = pos(L, 0);
    const ro = r * 1.15;
    const outA = la * litLayer(L);
    label(c, `ŷ = ${a[L][0].toFixed(2)}`, po.x + ro * 1.3, po.y + sz * 0.1, { size: sz * 1.1, color: m.core, align: 'left', alpha: outA, italic: true, shadow: withAlpha(ink, 0.85) });
    if (hasTarget)
      label(c, `target ${io.y[0]}`, po.x + ro * 1.3, po.y + sz * 1.35, { size: sz * 0.9, color: m.rim, align: 'left', alpha: outA * 0.85, shadow: withAlpha(ink, 0.85) });
    const names = units.map((_, l) => (l === 0 ? 'INPUT' : l === L ? 'OUTPUT' : L > 2 ? `HIDDEN ${l}` : 'HIDDEN'));
    names.forEach((nm, l) => label(c, nm, units[l][0].x, beamY - 18, { size: 18, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: la * 0.85, tracking: 3, shadow: withAlpha(ink, 0.85) }));
  }
  if (o.readout) {
    const ep = Math.round(o.epoch);
    label(c, `epoch ${ep}   ·   loss ${lossAt(tr, o.epoch).toFixed(3)}`, o.x + o.w / 2, o.y + o.h + 4, {
      size: 20,
      font: MFONT.serif,
      italic: true,
      color: m.rim,
      align: 'center',
      alpha: smooth(ramp(reveal, 0.8, 1)),
      shadow: withAlpha(ink, 0.85),
    });
  }
}

/** The backprop messenger: a dark bead in a ring of rim light (distinct from the forward knot). */
function blameKnot(c: CanvasRenderingContext2D, x: number, y: number, r: number, k: number, env: PaintEnv): void {
  const m = env.mood;
  glow(c, x, y, r * 3.2, m.rim, 0.28 * k);
  c.save();
  c.globalAlpha *= Math.min(1, 0.4 + k);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(x, y, r * 0.75, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = m.core;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(x, y, r * 0.75, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function fmt(v: number) {
  return Math.abs(v - Math.round(v)) < 0.02 ? String(Math.round(v)) : v.toFixed(2);
}
