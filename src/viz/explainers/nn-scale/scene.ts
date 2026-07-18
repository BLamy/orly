import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * The Nearest-Neighbor Problem at Scale — exact search doesn't scale.
 *
 * Real arithmetic at module scope. Brute-force nearest neighbor over N
 * documents with d-dimensional embeddings costs N·d multiply-adds per query.
 * At d = 768: one million documents = 768 million multiply-adds per query —
 * at 10 giga-ops effective single-core throughput that is ~77 ms for ONE
 * query, and a 100-query-per-second service needs 7.7 cores doing nothing
 * else; at 100 million documents one query takes 7.7 seconds. The demo
 * field: 400 seeded points actually scanned one by one, running best-so-far
 * computed for real; the cost table is pure closed-form arithmetic shown
 * honestly as such.
 */

export const D_EMB = 768;
export const OPS_PER_SEC = 1e10; // 10 giga multiply-adds/s, effective

export interface CostRow {
  n: number;
  label: string;
  ops: number;
  ms: number;
}
export const COSTS: CostRow[] = [1e3, 1e5, 1e6, 1e8].map((n) => ({
  n,
  label: n === 1e3 ? '1 thousand' : n === 1e5 ? '100 thousand' : n === 1e6 ? '1 million' : '100 million',
  ops: n * D_EMB,
  ms: ((n * D_EMB) / OPS_PER_SEC) * 1000,
}));
// 1k → 0.077 ms · 100k → 7.7 ms · 1M → 77 ms · 100M → 7,680 ms

/** The scanned demo field: 400 seeded points + a query; scan is REAL. */
export const N_PTS = 400;
const rand = mulberry32(13);
export interface P2 {
  x: number;
  y: number;
}
export const PTS: P2[] = Array.from({ length: N_PTS }, () => ({
  x: 130 + rand() * 1020,
  y: 100 + rand() * 400,
}));
export const QUERY: P2 = { x: 870, y: 330 };

const d2 = (a: P2, b: P2): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** BEST_AT[i] = index of the best point among the first i+1 scanned. */
export const BEST_AT: number[] = (() => {
  const out: number[] = [];
  let best = 0;
  for (let i = 0; i < N_PTS; i++) {
    if (d2(PTS[i], QUERY) < d2(PTS[best], QUERY)) best = i;
    out.push(best);
  }
  return out;
})();
export const TRUE_NN = BEST_AT[N_PTS - 1];

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------

export const CAM_FIELD: CameraState = { x: 640, y: 300, k: 1.1 };
export const CAM_TABLE: CameraState = { x: 640, y: 380, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  fieldU: ChannelRef<number>; // points appear
  queryU: ChannelRef<number>;
  scanU: ChannelRef<number>; // scan progress 0..N_PTS
  mathU: ChannelRef<number>;
  tableU: ChannelRef<number>; // cost rows 0..4
  budgetU: ChannelRef<number>; // the latency budget line
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const queryU = tl.channel('queryU', 0);
  const scanU = tl.channel('scanU', 0);
  const mathU = tl.channel('mathU', 0);
  const tableU = tl.channel('tableU', 0);
  const budgetU = tl.channel('budgetU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the honest algorithm ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Last chapter gave us the goal: find the vectors at the smallest angle to a query. There is one algorithm guaranteed to get it right — compare against everything. Here are four hundred documents.',
  });
  tl.tween(fieldU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_FIELD, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(queryU, 1, { at: 4.6, dur: 0.7, ease: ease.pop });
  tl.caption({
    at: 6.1,
    dur: 5.6,
    text: 'The query arrives, and the scan begins — every single point, one comparison at a time, keeping the best so far. Watch the frontier of certainty crawl across the collection.',
  });
  tl.tween(scanU, N_PTS, { at: 6.9, dur: 8.0, ease: ease.linear });
  tl.caption({
    at: 12.1,
    dur: 4.6,
    text: 'Four hundred comparisons later, we have the true nearest neighbor, with a proof: nothing was skipped. Exactness bought by exhaustion.',
  });
  tl.hold(16.9, 0.6);

  // — Beat 2 · the bill ————————————————————————————————————————————————
  tl.caption({
    at: 17.5,
    dur: 5.6,
    text: 'Now do the arithmetic at production scale. Each comparison is a dot product over seven hundred sixty eight dimensions. The cost of one query is documents times dimensions — every time.',
    tex: '\\text{cost} = N \\times d \\text{ multiply-adds}',
  });
  tl.tween(mathU, 1, { at: 18.1, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TABLE, { at: 19.3, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 23.3,
    dur: 5.8,
    text: 'A thousand documents: a tenth of a millisecond — free. A hundred thousand: eight milliseconds — fine. A million: seventy seven milliseconds for a single query. A hundred million: nearly eight seconds.',
  });
  tl.tween(tableU, 4, { at: 23.9, dur: 4.6, ease: ease.linear });
  tl.hold(29.3, 0.6);

  // — Beat 3 · the budget line ——————————————————————————————————————————
  tl.caption({
    at: 29.9,
    dur: 5.6,
    text: 'Interactive search gives you a budget of maybe ten milliseconds. Draw that line through the table and brute force dies somewhere past a hundred thousand documents — three orders of magnitude short of a real corpus.',
  });
  tl.tween(budgetU, 1, { at: 30.7, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 35.7,
    dur: 5.2,
    text: 'And it is linear, which is the cruelest slope: double the documents, double the bill, forever. No cache, no cleverness in the loop saves you — the loop itself is the problem.',
  });
  tl.hold(41.1, 0.6);

  // — Beat 4 · the escape hatch ————————————————————————————————————————
  tl.caption({
    at: 41.7,
    dur: 5.4,
    text: 'The escape is to stop demanding proof. If you will accept the right answer almost always, you can skip almost everything — the same bargain hash tables and skip lists made for exact keys, rebuilt for geometry.',
  });
  tl.hold(47.3, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 47.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 48.5, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 48.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 49.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 49.7,
    dur: 5.4,
    text: 'So the problem statement for the rest of this book: find nearly-nearest neighbors while touching a vanishing fraction of the data. Next chapter builds the structure that does it — a skip list in space.',
  });
  tl.hold(55.3, 1.2);

  return { tl, cam, fieldU, queryU, scanU, mathU, tableU, budgetU, dimU, endU };
}
