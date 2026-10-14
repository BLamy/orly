/**
 * Real scaled dot-product attention over a real toy sentence, with small hand-built
 * embeddings so every weight is computed (not drawn by hand):
 *   x_t = [noun, animate, place, verb, state, function, pronoun, cos(tω), sin(tω)]
 *   q = x Wq,  k = x Wk,  weights = softmax(q·k / sqrt(d_k))  (each row sums to 1)
 * Four heads, each a few non-zero entries in Wq / Wk (so they can be read aloud):
 *   0 "who?"    pronoun/state queries look for animate nouns   (it -> animal)
 *   1 "where?"  pronoun/verb queries look for places          (cross -> street)
 *   2 "how?"    pronoun/noun queries look for state words     (it -> tired)
 *   3 "before"  a rotation of the position code: each word looks at the previous one
 * These are toy heads built to be legible; real trained heads are messier.
 */
export const SENTENCE = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'] as const;
export const IT_INDEX = 7;
export const HEAD_NAMES = ['who?', 'where?', 'how?', 'the word before'] as const;

//           noun anim place verb state func pron
const FEAT: Record<string, number[]> = {
  The: [0, 0, 0, 0, 0, 1, 0],
  animal: [1, 1, 0, 0, 0, 0, 0],
  "didn't": [0, 0, 0, 1, 0, 0.5, 0],
  cross: [0, 0, 0.3, 1, 0, 0, 0],
  the: [0, 0, 0, 0, 0, 1, 0],
  street: [1, 0, 1, 0, 0, 0, 0],
  because: [0, 0, 0, 0, 0, 1, 0],
  it: [0.6, 0, 0, 0, 0, 0, 1],
  was: [0, 0, 0, 1, 0.3, 0.5, 0],
  too: [0, 0, 0, 0, 0.5, 1, 0],
  tired: [0, 0.3, 0, 0, 1, 0, 0],
};
const OMEGA = 0.7;
export const EMBED: number[][] = SENTENCE.map((w, i) => [...FEAT[w], Math.cos(i * OMEGA), Math.sin(i * OMEGA)]);
const D = 9;
const NOUN = 0, ANIM = 1, PLACE = 2, VERB = 3, STATE = 4, PRON = 6, PC = 7, PS = 8;

type Entry = [row: number, col: number, v: number];
function mat(dk: number, entries: Entry[]): number[][] {
  const M = Array.from({ length: D }, () => new Array(dk).fill(0));
  for (const [r, c, v] of entries) M[r][c] = v;
  return M;
}
const cw = Math.cos(OMEGA);
const sw = Math.sin(OMEGA);
export const HEADS: { Wq: number[][]; Wk: number[][] }[] = [
  { Wq: mat(2, [[PRON, 0, 2.2], [STATE, 0, 1.4], [NOUN, 1, 0.6]]), Wk: mat(2, [[ANIM, 0, 1.6], [NOUN, 0, 0.5], [NOUN, 1, 0.8]]) },
  { Wq: mat(2, [[PRON, 0, 1.3], [VERB, 0, 1.9], [NOUN, 1, 0.5]]), Wk: mat(2, [[PLACE, 0, 1.6], [NOUN, 0, 0.4], [NOUN, 1, 0.6]]) },
  { Wq: mat(2, [[PRON, 0, 1.8], [NOUN, 0, 1.2], [ANIM, 1, 0.6]]), Wk: mat(2, [[STATE, 0, 1.7], [ANIM, 1, 0.5]]) },
  // q_t = R(-ω)·p_t (rotate the position code back one step), k_t = p_t  =>  q·k = 2.4²·cos((t-1-s)ω)
  { Wq: mat(2, [[PC, 0, 2.4 * cw], [PS, 0, 2.4 * sw], [PC, 1, -2.4 * sw], [PS, 1, 2.4 * cw]]), Wk: mat(2, [[PC, 0, 2.4], [PS, 1, 2.4]]) },
];

function mm(x: number[], W: number[][]): number[] {
  const out = new Array(W[0].length).fill(0);
  for (let r = 0; r < x.length; r++) for (let c = 0; c < out.length; c++) out[c] += x[r] * W[r][c];
  return out;
}
/** weights[h][i][j]: how much word i attends to word j in head h (rows sum to 1). */
export const ATTENTION: number[][][] = HEADS.map(({ Wq, Wk }) => {
  const Q = EMBED.map((x) => mm(x, Wq));
  const K = EMBED.map((x) => mm(x, Wk));
  const dk = Wq[0].length;
  return Q.map((q) => {
    const s = K.map((k) => k.reduce((a, v, j) => a + v * q[j], 0) / Math.sqrt(dk));
    const m = Math.max(...s);
    const e = s.map((v) => Math.exp(v - m));
    const z = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / z);
  });
});
/** Raw scores q·k/sqrt(d_k) for one head and query (for on-screen equations). */
export function attentionScores(h: number, i: number): number[] {
  const { Wq, Wk } = HEADS[h];
  const q = mm(EMBED[i], Wq);
  return EMBED.map((x) => mm(x, Wk).reduce((a, v, j) => a + v * q[j], 0) / Math.sqrt(Wq[0].length));
}
