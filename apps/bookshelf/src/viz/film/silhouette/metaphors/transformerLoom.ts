/**
 * transformerLoom — a transformer as a loom. Each token's residual stream is a ribbon
 * of light running left to right through a stack of blocks; in every block an
 * attention loom passes light BETWEEN ribbons (threads, weight = real attention) and an
 * MLP lantern works on each ribbon alone, and both write back into the ribbon (x + f(x)).
 * The numbers come from a real forward pass of a tiny transformer with seeded random
 * weights (d = 8, 1 causal head, MLP 8 -> 32 -> 8, pre-LayerNorm), computed once:
 *   ribbon width        <- ||x|| of that token's residual vector at that depth
 *   loom thread alpha   <- causal attention weight a_ij in that block
 *   MLP lantern glow    <- mean ReLU activation of that token's MLP
 *   merge strand width  <- ||f(x)|| written back into the stream
 * (Untrained weights: the bindings are real, the "meaning" is not; say so on screen if asked.)
 *
 *   transformerLoom(c, {
 *     x?, y?, w?, h?    box (default the full stage)
 *     tokens?: string[] row labels (default 6 words of the sentence); up to 8
 *     layers?: number   blocks shown (1..6, default 4)
 *     reveal?: number   0..1 frames rise, ribbons thread through
 *     flow?: number     0..1 the light front travelling through the stack
 *     phase?: number    seconds, for the shimmer moving along lit ribbons (pass shot t)
 *     focus?: number    block index to emphasise (others hazed); -1 = none
 *     labels?: boolean  words, "attention" / "MLP" / "residual stream"
 *   }, env)
 *   loomForward(tokens, layers) -> the recorded forward pass
 */
import type { PaintEnv } from '../../contracts';
import { gaussian, mulberry32 } from '../../../core';
import { mixLab, withAlpha } from '../palette';
import { MFONT, glow, label, paperLantern, ramp, smooth } from './kit';

const D = 8;
const DH = 32;

export interface LoomRecord {
  T: number;
  L: number;
  /** norms[l][t]: ||x|| entering block l (l = L: the output) */
  norms: number[][];
  att: number[][][]; // att[l][i][j]
  mlp: number[][]; // mean relu activation per block, token
  dAtt: number[][]; // ||attn out||
  dMlp: number[][]; // ||mlp out||
}

const cache = new Map<string, LoomRecord>();
export function loomForward(T: number, L: number): LoomRecord {
  const key = `${T}x${L}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const g = gaussian(mulberry32(1729));
  const M = (r: number, c: number, s: number) => Array.from({ length: r }, () => Array.from({ length: c }, () => g() * s));
  const mv = (x: number[], W: number[][]) => W[0].map((_, c) => x.reduce((a, v, r) => a + v * W[r][c], 0));
  const ln = (x: number[]) => {
    const mu = x.reduce((a, b) => a + b, 0) / x.length;
    const v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / x.length;
    return x.map((e) => (e - mu) / Math.sqrt(v + 1e-5));
  };
  const nrm = (x: number[]) => Math.sqrt(x.reduce((a, b) => a + b * b, 0));
  let X = Array.from({ length: T }, () => Array.from({ length: D }, () => g()));
  const rec: LoomRecord = { T, L, norms: [], att: [], mlp: [], dAtt: [], dMlp: [] };
  for (let l = 0; l < L; l++) {
    rec.norms.push(X.map(nrm));
    const Wq = M(D, D, 0.9 / Math.sqrt(D)), Wk = M(D, D, 0.9 / Math.sqrt(D)), Wv = M(D, D, 1 / Math.sqrt(D)), Wo = M(D, D, 0.7 / Math.sqrt(D));
    const H = X.map(ln);
    const Q = H.map((h) => mv(h, Wq)), K = H.map((h) => mv(h, Wk)), V = H.map((h) => mv(h, Wv));
    const A = Q.map((q, i) => {
      const s = K.map((k, j) => (j <= i ? k.reduce((a, v, d) => a + v * q[d], 0) / Math.sqrt(D) : -Infinity));
      const m = Math.max(...s);
      const e = s.map((v) => (v === -Infinity ? 0 : Math.exp(v - m)));
      const z = e.reduce((a, b) => a + b, 0);
      return e.map((v) => v / z);
    });
    const att = A.map((row) => mv(V.reduce((acc, v, j) => acc.map((a, d) => a + row[j] * v[d]), new Array(D).fill(0)), Wo));
    rec.att.push(A);
    rec.dAtt.push(att.map(nrm));
    X = X.map((x, t) => x.map((v, d) => v + att[t][d]));
    const W1 = M(D, DH, 1 / Math.sqrt(D)), W2 = M(DH, D, 0.6 / Math.sqrt(DH));
    const H2 = X.map(ln);
    const hid = H2.map((h) => mv(h, W1).map((v) => Math.max(0, v)));
    rec.mlp.push(hid.map((hh) => hh.reduce((a, b) => a + b, 0) / DH));
    const out = hid.map((hh) => mv(hh, W2));
    rec.dMlp.push(out.map(nrm));
    X = X.map((x, t) => x.map((v, d) => v + out[t][d]));
  }
  rec.norms.push(X.map(nrm));
  cache.set(key, rec);
  return rec;
}

export interface TransformerLoomOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  tokens?: string[];
  layers?: number;
  reveal?: number;
  flow?: number;
  phase?: number;
  focus?: number;
  labels?: boolean;
}

export function transformerLoom(c: CanvasRenderingContext2D, o: TransformerLoomOpts, env: PaintEnv): void {
  const X0 = o.x ?? 0;
  const Y0 = o.y ?? 0;
  const W = o.w ?? 1280;
  const H = o.h ?? 720;
  const m = env.mood;
  const ink = env.fill('ink');
  const toks = (o.tokens ?? ['The', 'animal', "didn't", 'cross', 'the', 'street']).slice(0, 8);
  const T = toks.length;
  const L = Math.max(1, Math.min(6, o.layers ?? 4));
  const rec = loomForward(T, L);
  const reveal = o.reveal ?? 1;
  const flow = o.flow ?? 0;
  const phase = o.phase ?? 0;
  const focus = o.focus ?? -1;
  const left = X0 + 150;
  const right = X0 + W - 60;
  const top = Y0 + H * 0.26;
  const bot = Y0 + H * 0.8;
  const rowY = (t: number) => top + ((t + 0.5) / T) * (bot - top);
  const bw = (right - left) / L;
  const attX = (l: number) => left + l * bw + bw * 0.3;
  const mlpX = (l: number) => left + l * bw + bw * 0.72;
  const nMax = Math.max(...rec.norms.flat());
  // the light front: x position across the stack
  const frontX = left - 40 + flow * (right - left + 80);
  const litAt = (x: number) => smooth(ramp(frontX - x, -10, 50));
  const dimOf = (l: number) => (focus >= 0 && focus !== l ? 0.45 : 1);

  // ---------------------------------------------------------------- loom frames (behind ribbons)
  for (let l = 0; l < L; l++) {
    const a = smooth(ramp(reveal, 0.05 + l * 0.08, 0.3 + l * 0.08)) * dimOf(l);
    if (a <= 0) continue;
    const x0 = attX(l) - bw * 0.16;
    const x1 = attX(l) + bw * 0.16;
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = ink;
    // uprights with turned finials, a top beam and a breast beam
    for (const px of [x0, x1]) {
      c.fillRect(px - 4, top - 60, 8, bot - top + 110);
      c.beginPath();
      c.arc(px, top - 66, 7, 0, Math.PI * 2);
      c.fill();
    }
    c.fillRect(x0 - 10, top - 52, x1 - x0 + 20, 9);
    c.fillRect(x0 - 10, bot + 40, x1 - x0 + 20, 7);
    // heddle cords (faint)
    c.strokeStyle = withAlpha(m.rim, 0.12);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let k = 1; k < 8; k++) {
      const px = x0 + ((x1 - x0) * k) / 8;
      c.moveTo(px, top - 43);
      c.lineTo(px, bot + 40);
    }
    c.stroke();
    // MLP beam from which the lanterns hang
    c.fillStyle = ink;
    c.fillRect(mlpX(l) - 26, top - 52, 52, 7);
    c.restore();
  }

  // ---------------------------------------------------------------- attention threads between ribbons
  for (let l = 0; l < L; l++) {
    const a = smooth(ramp(reveal, 0.4 + l * 0.06, 0.7 + l * 0.06)) * dimOf(l);
    if (a <= 0) continue;
    const xL = attX(l) - bw * 0.15;
    const xR = attX(l) + bw * 0.15;
    const lit = litAt(attX(l));
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < T; i++)
      for (let j = 0; j < i; j++) {
        const wgt = rec.att[l][i][j];
        if (wgt < 0.02) continue;
        c.strokeStyle = withAlpha(mixLab(m.halo, m.core, lit), (0.1 + 0.8 * wgt) * a * (0.35 + 0.65 * lit));
        c.lineWidth = 0.6 + wgt * 4;
        c.beginPath();
        c.moveTo(xL, rowY(j));
        c.bezierCurveTo(attX(l), rowY(j), attX(l), rowY(i), xR, rowY(i));
        c.stroke();
      }
    c.restore();
  }

  // ---------------------------------------------------------------- residual ribbons
  const ribA = smooth(ramp(reveal, 0.25, 0.75));
  if (ribA > 0) {
    for (let t = 0; t < T; t++) {
      const y = rowY(t);
      // piecewise width: changes at each write-back point
      const seg: { x0: number; x1: number; w: number }[] = [];
      let xPrev = left - 40;
      for (let l = 0; l <= L; l++) {
        const xEnd = l < L ? attX(l) + bw * 0.15 : right + 30;
        seg.push({ x0: xPrev, x1: xEnd, w: 2 + 9 * (rec.norms[l][t] / nMax) });
        if (l < L) {
          // after attention write-back, before MLP: interpolate width halfway
          const mid = (rec.norms[l][t] + rec.dAtt[l][t] * 0.5) / nMax;
          seg.push({ x0: xEnd, x1: mlpX(l) + 14, w: 2 + 9 * Math.min(1, mid) });
          xPrev = mlpX(l) + 14;
        }
      }
      const drawTo = left - 40 + smooth(ramp(reveal, 0.25 + t * 0.03, 0.8)) * (right - left + 70);
      for (const s of seg) {
        if (s.x0 >= drawTo) break;
        const x1 = Math.min(s.x1, drawTo);
        const lit0 = litAt(s.x0);
        const lit1 = litAt(x1);
        const g = c.createLinearGradient(s.x0, 0, x1, 0);
        const base = mixLab(env.fill('set'), m.haze, 0.2);
        g.addColorStop(0, lit0 > 0.01 ? mixLab(base, m.core, 0.15 + 0.7 * lit0) : base);
        g.addColorStop(1, lit1 > 0.01 ? mixLab(base, m.core, 0.15 + 0.7 * lit1) : base);
        c.save();
        c.globalAlpha *= ribA;
        c.fillStyle = g;
        c.beginPath();
        c.roundRect(s.x0, y - s.w / 2, x1 - s.x0, s.w, s.w / 2);
        c.fill();
        // the lit core of the stream (additive), only behind the light front
        const xl = Math.min(x1, frontX);
        if (xl > s.x0) {
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = withAlpha(m.core, 0.55);
          c.lineWidth = Math.max(1, s.w * 0.28);
          c.beginPath();
          c.moveTo(s.x0, y);
          c.lineTo(xl, y);
          c.stroke();
        }
        c.restore();
      }
      // shimmer: short bright dashes travelling with phase behind the front
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) {
        const sx = left - 40 + ((phase * 90 + k * 210 + t * 37) % (right - left + 80));
        if (sx > Math.min(frontX, drawTo)) continue;
        glow(c, sx, y, 14, m.core, 0.25 * ribA);
      }
      c.restore();
      if (o.labels) label(c, toks[t], left - 54, y + 7, { size: 21, color: m.rim, align: 'right', alpha: ribA });
    }
  }

  // ---------------------------------------------------------------- MLP lanterns and write-back strands
  for (let l = 0; l < L; l++) {
    const a = smooth(ramp(reveal, 0.5 + l * 0.06, 0.8 + l * 0.06)) * dimOf(l);
    if (a <= 0) continue;
    const lit = litAt(mlpX(l));
    const actMax = Math.max(...rec.mlp[l]);
    for (let t = 0; t < T; t++) {
      const y = rowY(t);
      const act = (rec.mlp[l][t] / actMax) * lit;
      const ly = y - 26;
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = ink;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(mlpX(l), t === 0 ? top - 45 : rowY(t - 1) + 10);
      c.lineTo(mlpX(l), ly - 14);
      c.stroke();
      c.restore();
      paperLantern(c, { x: mlpX(l), y: ly, r: 12, act, alpha: a, tassel: false, halo: 0.5 }, env);
      // write-back strand into the ribbon
      const sw = 0.6 + 3 * (rec.dMlp[l][t] / nMax);
      c.save();
      c.globalAlpha *= a * (0.3 + 0.7 * lit);
      c.strokeStyle = mixLab(m.halo, m.core, lit);
      c.lineWidth = sw;
      c.beginPath();
      c.moveTo(mlpX(l), ly + 12);
      c.quadraticCurveTo(mlpX(l) + 4, y, mlpX(l) + 16, y);
      c.stroke();
      c.restore();
    }
    if (o.labels && (l === 0 || l === focus)) {
      const la = smooth(ramp(reveal, 0.75, 1));
      label(c, 'attention', attX(l), bot + 76, { size: 19, italic: true, color: m.rim, align: 'center', alpha: la });
      label(c, 'MLP', mlpX(l), bot + 76, { size: 19, italic: true, color: m.rim, align: 'center', alpha: la });
    }
    if (o.labels) label(c, `BLOCK ${l + 1}`, left + l * bw + bw * 0.5, top - 82, { size: 17, font: MFONT.sc, weight: 600, color: m.rim, align: 'center', alpha: a * 0.85, tracking: 2.5 });
  }
  if (o.labels)
    label(c, 'residual stream →', right + 20, bot + 76, { size: 19, italic: true, color: m.core, align: 'right', alpha: smooth(ramp(reveal, 0.8, 1)) });
}
