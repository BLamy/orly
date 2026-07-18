import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Circuits — an induction head you can read.
 *
 * A minimal two-layer attention circuit, computed honestly at module scope:
 * one-hot token states, a previous-token head (layer 1) whose value path
 * writes "the token before me" into a residual slot, and an induction head
 * (layer 2) whose query is the current token and whose key is that slot —
 * so it attends to the position right AFTER the previous occurrence of the
 * current token, and copies what it finds. All attention weights are real
 * softmaxes over the actual key–query products (sharpness 8) on a 20 token
 * sequence: ten distinct tokens, then the same ten again. Verified: on the
 * repeated half the circuit predicts the next token 9 of 9 times, with the
 * induction head placing weight 1.00 on exactly the right position; ablating
 * EITHER head drops it to 0 of 9.
 */

export const V = 10;
export const SEQ: number[] = (() => {
  const rand = mulberry32(23);
  const s = Array.from({ length: V }, (_, i) => i);
  for (let i = V - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
})();
export const TOKS: number[] = [...SEQ, ...SEQ];
export const L = TOKS.length;
const B = 8;

const softmaxRow = (scores: number[]): number[] => {
  const mx = Math.max(...scores);
  const ex = scores.map((v) => Math.exp(v - mx));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((v) => v / sum);
};

export interface CircuitRun {
  A1: number[][]; // layer-1 (previous token) attention, L x L
  A2: number[][]; // layer-2 (induction) attention, L x L
  pred: number[]; // argmax copied token per position (-1 if head 2 ablated)
  ok: number; // correct next-token predictions on the repeated half
  tot: number;
}

export function runCircuit(ablatePrev: boolean, ablateInd: boolean): CircuitRun {
  const prev: number[][] = [];
  const A1: number[][] = [];
  for (let i = 0; i < L; i++) {
    if (i === 0) {
      prev.push(new Array(V).fill(0));
      A1.push(new Array(L).fill(0));
      continue;
    }
    const scores = Array.from({ length: L }, (_, j) => (j <= i ? (j === i - 1 ? B : 0) : -1e9));
    const w = softmaxRow(scores);
    A1.push(w);
    const pv = new Array(V).fill(0);
    if (!ablatePrev) for (let j = 0; j <= i; j++) pv[TOKS[j]] += w[j];
    prev.push(pv);
  }
  const A2: number[][] = [];
  const pred: number[] = [];
  for (let i = 0; i < L; i++) {
    const scores = Array.from({ length: L }, (_, j) => (j <= i ? B * prev[j][TOKS[i]] : -1e9));
    const w = softmaxRow(scores);
    A2.push(w);
    if (ablateInd) {
      pred.push(-1);
      continue;
    }
    const logits = new Array(V).fill(0);
    for (let j = 0; j <= i; j++) logits[TOKS[j]] += w[j];
    let am = 0;
    for (let k = 1; k < V; k++) if (logits[k] > logits[am]) am = k;
    pred.push(am);
  }
  let ok = 0;
  let tot = 0;
  for (let i = V; i < L - 1; i++) {
    tot++;
    if (!ablateInd && pred[i] === TOKS[i + 1]) ok++;
  }
  return { A1, A2, pred, ok, tot };
}

export const FULL: CircuitRun = runCircuit(false, false); // 9/9
export const NO_PREV: CircuitRun = runCircuit(true, false); // 0/9
export const NO_IND: CircuitRun = runCircuit(false, true); // 0/9

export const GLYPHS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];

// layout: the token strip + arc space
export const STRIP = { x: 90, y: 330, w: 1100 };
export const STEPX = STRIP.w / L;
export const tokX = (i: number): number => STRIP.x + i * STEPX + STEPX / 2;

export const CAM_STRIP: CameraState = { x: 400, y: 330, k: 1.12 };
export const CAM_POS10: CameraState = { x: 340, y: 320, k: 1.35 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stripU: ChannelRef<number>;
  h1Prog: ChannelRef<number>; // 0..L: previous-token arcs drawn
  h1WriteU: ChannelRef<number>; // "carries token before me" chips
  qPos: ChannelRef<number>; // which query position the induction beat focuses (10..18)
  h2U: ChannelRef<number>; // induction arcs visible
  predProg: ChannelRef<number>; // 0..9 predictions lit on second half
  badgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stripU = tl.channel('stripU', 0);
  const h1Prog = tl.channel('h1Prog', 0);
  const h1WriteU = tl.channel('h1WriteU', 0);
  const qPos = tl.channel('qPos', 10);
  const h2U = tl.channel('h2U', 0);
  const predProg = tl.channel('predProg', 0);
  const badgeU = tl.channel('badgeU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the task ————————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Twenty tokens: a random run of ten, then the exact same ten again. Any competent language model learns to exploit this: the moment history repeats, copy what came next last time.',
  });
  tl.tween(stripU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_STRIP, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.3,
    dur: 4.6,
    text: 'Inside real transformers this behavior is carried by a two head circuit famous enough to have a name: the induction head. Here is that circuit, small enough to read completely.',
  });
  tl.hold(11.1, 0.5);

  // — Beat 2 · head one: the previous-token head ————————————————————————————
  tl.caption({
    at: 11.6,
    dur: 5.8,
    text: 'Head one does something almost insultingly simple. At every position it attends one step backward, these are its true attention weights, and writes what it sees into a side channel: each token now carries a note saying who stood before me.',
  });
  tl.tween(h1Prog, L, { at: 12.4, dur: 3.8, ease: ease.linear });
  tl.tween(h1WriteU, 1, { at: 16.4, dur: 0.8, ease: ease.enter });
  tl.hold(17.6, 0.5);

  // — Beat 3 · head two: the induction head —————————————————————————————————
  tl.tween(cam, CAM_POS10, { at: 18.1, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 18.3,
    dur: 6.0,
    text: 'Head two reads those notes. Standing at the start of the repeat, its query says: find a position whose note names my own token. The only match is the position right after my previous appearance, and the softmax puts weight one point zero there.',
  });
  tl.tween(h2U, 1, { at: 19.5, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 24.5,
    dur: 4.8,
    text: 'Then it copies whatever token lives at that spot into the prediction. Look one step ahead in the past, and you have predicted one step ahead in the future.',
  });
  tl.hold(29.5, 0.5);

  // — Beat 4 · run the whole repeat —————————————————————————————————————————
  tl.tween(cam, CAM_STRIP, { at: 30.0, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 30.2,
    dur: 5.6,
    text: 'Slide the query across the whole second half and let the two heads compose. Nine predictions, nine correct, every attention weight on screen a real softmax, not an illustration.',
  });
  tl.tween(qPos, 18, { at: 30.8, dur: 4.4, ease: ease.linear });
  tl.tween(predProg, 9, { at: 30.8, dur: 4.4, ease: ease.linear });
  tl.tween(badgeU, 1, { at: 35.4, dur: 0.7, ease: ease.pop });
  tl.caption({
    at: 36.2,
    dur: 5.2,
    text: 'Notice what you just did: you read an algorithm out of attention patterns. Match the current token in the past, step forward, copy. Three verbs, two heads, zero mystery.',
  });
  tl.hold(41.6, 0.5);

  // — Beat 5 · why this matters —————————————————————————————————————————————
  tl.caption({
    at: 42.1,
    dur: 5.6,
    text: 'Induction heads are the first circuit found in the wild in real language models, and they appear abruptly during training, right when models get suddenly better at using context. Small circuit, large consequences.',
  });
  tl.hold(47.9, 0.5);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 48.4, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 49.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.6,
    dur: 5.4,
    text: 'A circuit is an algorithm you can read off the weights: here, a previous token head composing with an induction head to copy the past. But reading is not proof. Proof is next.',
  });
  tl.hold(55.2, 1.2);

  return { tl, cam, stripU, h1Prog, h1WriteU, qPos, h2U, predProg, badgeU, dimU, endU };
}
