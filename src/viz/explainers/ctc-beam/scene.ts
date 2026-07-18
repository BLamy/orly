import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * CTC and Beam Search — when the best path isn't the best answer.
 *
 * A REAL connectionist temporal classification lattice, solved exactly at
 * module scope: six audio frames, three symbols (blank, A, B), per-frame
 * probabilities fixed below. All 729 alignments are enumerated and summed
 * per collapsed transcript. Measured: greedy per-frame argmax picks blank
 * every frame — transcript empty, total probability 0.0072 — while the true
 * best transcript is "A B" at 0.1276, eighteen times more probable. A real
 * prefix beam search (width 3) is run frame by frame; its beams diverge from
 * greedy at frame two and land on the right answer.
 */

export const SYMS = ['·', 'A', 'B'] as const; // · = blank
export const T_FRAMES = 6;

/** Per-frame symbol probabilities [blank, A, B] — each row sums to 1. */
export const P: readonly (readonly number[])[] = [
  [0.44, 0.36, 0.2],
  [0.42, 0.38, 0.2],
  [0.46, 0.3, 0.24],
  [0.4, 0.34, 0.26],
  [0.44, 0.32, 0.24],
  [0.48, 0.3, 0.22],
];

function collapse(path: number[]): string {
  let out = '';
  let prev = 0;
  for (const s of path) {
    if (s !== 0 && s !== prev) out += SYMS[s];
    prev = s;
  }
  return out;
}

/** Exact enumeration of all 3^6 = 729 alignments, summed per transcript. */
export const TOTALS: [string, number][] = (() => {
  const tot = new Map<string, number>();
  const rec = (t: number, path: number[], p: number): void => {
    if (t === T_FRAMES) {
      const l = collapse(path);
      tot.set(l, (tot.get(l) ?? 0) + p);
      return;
    }
    for (let s = 0; s < 3; s++) rec(t + 1, [...path, s], p * P[t][s]);
  };
  rec(0, [], 1);
  return [...tot.entries()].sort((a, b) => b[1] - a[1]);
})();

export const GREEDY_PATH: number[] = P.map((row) => row.indexOf(Math.max(...row))); // all blank
export const P_EMPTY = TOTALS.find(([l]) => l === '')![1]; // 0.0072
export const BEST = TOTALS[0]; // ['AB', 0.1276]
export const RATIO = BEST[1] / P_EMPTY; // ≈ 17.8

/** Real prefix beam search, width 3; per-frame top beams for the table. */
export interface BeamRow {
  label: string;
  p: number;
}
export const BEAM_HIST: BeamRow[][] = (() => {
  const width = 3;
  let beams = new Map<string, { pb: number; pnb: number }>([['', { pb: 1, pnb: 0 }]]);
  const hist: BeamRow[][] = [];
  for (const probs of P) {
    const next = new Map<string, { pb: number; pnb: number }>();
    const get = (k: string) => {
      let v = next.get(k);
      if (!v) {
        v = { pb: 0, pnb: 0 };
        next.set(k, v);
      }
      return v;
    };
    for (const [pre, { pb, pnb }] of beams) {
      get(pre).pb += (pb + pnb) * probs[0];
      for (let s = 1; s < 3; s++) {
        const ch = SYMS[s];
        if (pre.endsWith(ch)) {
          get(pre).pnb += pnb * probs[s];
          get(pre + ch).pnb += pb * probs[s];
        } else {
          get(pre + ch).pnb += (pb + pnb) * probs[s];
        }
      }
    }
    beams = new Map(
      [...next.entries()]
        .sort((a, b) => b[1].pb + b[1].pnb - (a[1].pb + a[1].pnb))
        .slice(0, width),
    );
    hist.push([...beams.entries()].map(([k, v]) => ({ label: k || '∅', p: v.pb + v.pnb })));
  }
  return hist;
})();

/** A handful of real alignments that all collapse to "AB", for the bundle. */
export const AB_PATHS: number[][] = (() => {
  const out: number[][] = [];
  const rec = (t: number, path: number[]): void => {
    if (out.length >= 6) return;
    if (t === T_FRAMES) {
      if (collapse(path) === 'AB') out.push([...path]);
      return;
    }
    for (const s of [1, 0, 2]) rec(t + 1, [...path, s]);
  };
  rec(0, []);
  return out;
})();

// ---------------------------------------------------------------------------
// Stage layout — the lattice: columns = frames, rows = symbols.
// ---------------------------------------------------------------------------

export const LAT_X0 = 200;
export const LAT_DX = 120;
export const LAT_Y0 = 150;
export const LAT_DY = 105;
export const latX = (t: number): number => LAT_X0 + t * LAT_DX;
export const latY = (s: number): number => LAT_Y0 + s * LAT_DY;

export const CAM_LAT: CameraState = { x: 560, y: 280, k: 1.15 };
export const CAM_BEAM: CameraState = { x: 700, y: 350, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  latU: ChannelRef<number>; // lattice draw-on
  greedyU: ChannelRef<number>; // greedy path trace 0..T
  sumU: ChannelRef<number>; // the AB path bundle 0..1
  tableU: ChannelRef<number>; // transcript totals panel
  beamU: ChannelRef<number>; // beam table sweep 0..T
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const latU = tl.channel('latU', 0);
  const greedyU = tl.channel('greedyU', 0);
  const sumU = tl.channel('sumU', 0);
  const tableU = tl.channel('tableU', 0);
  const beamU = tl.channel('beamU', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the alignment problem ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Speech models face an awkward mismatch: six frames of audio, but maybe two letters of answer. Nobody tells you which frame belongs to which letter.',
  });
  tl.tween(latU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_LAT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'Connectionist temporal classification answers with a lattice. Each column is a frame; each dot is a symbol the model might emit there, sized by its real probability. A special blank means say nothing.',
  });
  tl.hold(12.4, 0.6);

  // — Beat 2 · greedy reads silence ————————————————————————————————————
  tl.caption({
    at: 13.0,
    dur: 5.4,
    text: 'The obvious decoder is greedy: take the likeliest symbol in every column. In this lattice, blank narrowly wins all six frames. Greedy concludes that nothing was said.',
  });
  tl.tween(greedyU, T_FRAMES, { at: 13.6, dur: 3.6, ease: ease.linear });
  tl.hold(18.6, 0.6);

  // — Beat 3 · the sum tells another story ——————————————————————————————
  tl.caption({
    at: 19.2,
    dur: 5.8,
    text: 'But a transcript is not one path. Repeats collapse and blanks vanish, so many alignments spell the same words. Here are just a few of the paths that all read A then B.',
  });
  tl.tween(sumU, 1, { at: 19.8, dur: 3.2, ease: ease.draw });
  tl.caption({
    at: 25.2,
    dur: 5.8,
    text: 'Sum every alignment for every transcript — all seven hundred twenty nine of them, exactly — and the silence greedy chose has probability zero point zero zero seven. A then B has zero point one three. Eighteen times more likely.',
    tex: 'p(\\text{AB}) = 0.128 \\;\\gg\\; p(\\varnothing) = 0.007',
  });
  tl.tween(tableU, 1, { at: 26.0, dur: 1.0, ease: ease.enter });
  tl.tween(mathU, 1, { at: 26.4, dur: 0.7, ease: ease.enter });
  tl.hold(31.2, 0.6);

  // — Beat 4 · beam search ——————————————————————————————————————————————
  tl.tween(cam, CAM_BEAM, { at: 31.8, dur: 1.4, ease: ease.move });
  tl.tween(sumU, 0.15, { at: 31.8, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 32.2,
    dur: 5.6,
    text: 'Exact summation blows up on real vocabularies, so decoders use beam search: keep the three best transcripts so far, extend each into the next frame, sum the alignments that merge, and prune the rest.',
  });
  tl.tween(beamU, T_FRAMES, { at: 33.4, dur: 7.2, ease: ease.linear });
  tl.caption({
    at: 38.2,
    dur: 5.6,
    text: 'Watch the beams diverge from greedy. By frame two, the letter A has overtaken silence. By frame four, A then B takes the lead and never gives it back. The beam finds what greedy threw away.',
  });
  tl.hold(44.0, 0.6);

  // — Beat 5 · the moral ————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 44.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 45.2, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 45.2, dur: 0.8, ease: ease.move });
  tl.tween(tableU, 0, { at: 45.2, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 46.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 46.4,
    dur: 6.2,
    text: 'The lesson generalizes far beyond speech: the likeliest single path and the likeliest answer are different questions. Whenever many derivations share one meaning, you must sum before you argue — or search as if you had.',
  });
  tl.hold(52.8, 1.2);

  return { tl, cam, latU, greedyU, sumU, tableU, beamU, mathU, dimU, endU };
}
