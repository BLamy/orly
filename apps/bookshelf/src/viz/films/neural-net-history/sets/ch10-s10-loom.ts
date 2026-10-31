/**
 * ch10-s10 — the reading half of the 2017 Transformer as a horizontal loom (causal: false). A real forward pass of a
 * tiny encoder with SEEDED, UNTRAINED weights (d = 8, one head, feed-forward 8 → 32 → 8, pre-LayerNorm, 6 blocks),
 * computed once at module load. Every attention row is a real softmax over ALL tokens (both ways, no mask).
 *   ribbon width          <- ||x|| of the token's residual vector entering each block
 *   thread alpha / width  <- attention weight a_ij in that block (i ≠ j; both directions drawn)
 *   lantern glow          <- mean ReLU activation of that token's feed-forward step
 *   write-back strand     <- ||f(x)|| added back into the ribbon
 * (Untrained toy weights: the bindings are real, the "meaning" is not; the shot says so on screen.)
 */
import { hash1 } from '../../../film/silhouette/atmosphere';

export interface EncoderRecord {
  T: number;
  L: number;
  norms: number[][]; // [l][t], l = 0..L
  att: number[][][]; // [l][i][j]
  ff: number[][]; // [l][t]
  dFF: number[][]; // [l][t]
  dAtt: number[][]; // [l][t]
}

const D = 8;
const DH = 32;

function gauss(seed: number): () => number {
  let k = 0;
  return () => {
    const u1 = Math.max(1e-9, hash1(k++, seed));
    const u2 = hash1(k++, seed);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

export function encoderForward(T: number, L: number, seed = 2017): EncoderRecord {
  const g = gauss(seed);
  const M = (r: number, c: number, s: number) => Array.from({ length: r }, () => Array.from({ length: c }, () => g() * s));
  const mv = (x: number[], W: number[][]) => W[0].map((_, c) => x.reduce((a, v, r) => a + v * W[r][c], 0));
  const ln = (x: number[]) => {
    const mu = x.reduce((a, b) => a + b, 0) / x.length;
    const v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / x.length;
    return x.map((e) => (e - mu) / Math.sqrt(v + 1e-5));
  };
  const nrm = (x: number[]) => Math.sqrt(x.reduce((a, b) => a + b * b, 0));
  let X = Array.from({ length: T }, () => Array.from({ length: D }, () => g()));
  const rec: EncoderRecord = { T, L, norms: [], att: [], ff: [], dFF: [], dAtt: [] };
  for (let l = 0; l < L; l++) {
    rec.norms.push(X.map(nrm));
    const Wq = M(D, D, 1.1 / Math.sqrt(D)), Wk = M(D, D, 1.1 / Math.sqrt(D)), Wv = M(D, D, 1 / Math.sqrt(D)), Wo = M(D, D, 0.7 / Math.sqrt(D));
    const H = X.map(ln);
    const Q = H.map((h) => mv(h, Wq)), K = H.map((h) => mv(h, Wk)), V = H.map((h) => mv(h, Wv));
    const A = Q.map((q) => {
      const s = K.map((k) => k.reduce((a, v, d) => a + v * q[d], 0) / Math.sqrt(D));
      const m = Math.max(...s);
      const e = s.map((v) => Math.exp(v - m));
      const z = e.reduce((a, b) => a + b, 0);
      return e.map((v) => v / z);
    });
    const out = A.map((row) => mv(V.reduce((acc, v, j) => acc.map((a, d) => a + row[j] * v[d]), new Array(D).fill(0)), Wo));
    rec.att.push(A);
    rec.dAtt.push(out.map(nrm));
    X = X.map((x, t) => x.map((v, d) => v + out[t][d]));
    const W1 = M(D, DH, 1 / Math.sqrt(D)), W2 = M(DH, D, 0.6 / Math.sqrt(DH));
    const hid = X.map(ln).map((h) => mv(h, W1).map((v) => Math.max(0, v)));
    rec.ff.push(hid.map((hh) => hh.reduce((a, b) => a + b, 0) / DH));
    const f = hid.map((hh) => mv(hh, W2));
    rec.dFF.push(f.map(nrm));
    X = X.map((x, t) => x.map((v, d) => v + f[t][d]));
  }
  rec.norms.push(X.map(nrm));
  return rec;
}
