import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Expert Parallelism — where the training communication bill lands.
 *
 * Training-side view of mixture-of-experts (the serving side lives in its
 * own book). All numbers computed at module scope:
 *
 * Widen chapter one's transformer with 8 experts per feed-forward, top-2
 * routing: total params = 131.1M + 32·(67.1M + 8·134.2M) ≈ 36.5B, but each
 * token activates only 131.1M + 32·(67.1M + 2·134.2M) ≈ 10.7B — 3.4× the
 * capacity at roughly constant per-token compute.
 *
 * The price: experts live on different devices, so every MoE layer runs an
 * all-to-all — 4096 tokens × top-2 × 4096 dims × 2 bytes = 64 MB dispatched
 * and 64 MB combined per layer (4 GB per step over 32 layers).
 *
 * And the stall: a REAL top-2 routing simulation (4096 tokens, seeded router
 * with one hot expert) puts 2723 of 8192 assignments on expert two — 2.66×
 * the mean load, so the whole step waits 2.66× longer. With an auxiliary
 * load-balancing loss pressing the router flat, the same simulation lands at
 * 1.21×.
 */

export const E = 8;
export const T_TOK = 4096;
export const D = 4096;
export const LAYERS = 32;
const M = 1e6;
export const EMB = 131.1 * M;
export const ATTN = 67.1 * M;
export const FF = 134.2 * M;
export const TOTAL_P = EMB + LAYERS * (ATTN + E * FF); // ≈ 36.5B
export const ACTIVE_P = EMB + LAYERS * (ATTN + 2 * FF); // ≈ 10.7B

export const DISPATCH_MB = (T_TOK * 2 * D * 2) / 2 ** 20; // 64 MB
export const STEP_GB = (2 * DISPATCH_MB * LAYERS) / 1024; // 4 GB

const BIAS = [0.4, 0.1, 1.2, -0.2, 0.0, -0.5, 0.3, -0.6];
export interface Routing {
  counts: number[];
  imb: number;
}
function route(biasScale: number, seed: number): Routing {
  const rand = mulberry32(seed);
  const g = gaussian(rand);
  const counts = new Array(E).fill(0) as number[];
  for (let t = 0; t < T_TOK; t++) {
    const logits = BIAS.map((b) => b * biasScale + g());
    let a = 0;
    let b = 1;
    if (logits[b] > logits[a]) {
      a = 1;
      b = 0;
    }
    for (let e = 2; e < E; e++) {
      if (logits[e] > logits[a]) {
        b = a;
        a = e;
      } else if (logits[e] > logits[b]) b = e;
    }
    counts[a]++;
    counts[b]++;
  }
  const mean = (2 * T_TOK) / E;
  return { counts, imb: Math.max(...counts) / mean };
}
export const HOT = route(1.0, 61); // imb ≈ 2.66, expert 2 gets 2723
export const BAL = route(0.15, 61); // imb ≈ 1.21
export const MEAN_LOAD = (2 * T_TOK) / E;

// ---------------------------------------------------------------------------
// Layout — device row with experts, token flow above, load bars below.
// ---------------------------------------------------------------------------

export const DEV_X0 = 150;
export const DEV_DX = 122;
export const DEV_Y = 260;
export const devX = (e: number): number => DEV_X0 + e * DEV_DX;

export const LB_Y0 = 540;
export const LB_H = 160;
export const lbH = (count: number): number => (count / 2800) * LB_H;

export const ROUTER = { x: 640, y: 105 };

export const CAM_DEV: CameraState = { x: 640, y: 300, k: 1.12 };
export const CAM_BARS: CameraState = { x: 640, y: 430, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  devU: ChannelRef<number>; // devices + router
  flowU: ChannelRef<number>; // all-to-all token streams
  capU: ChannelRef<number>; // capacity math panel
  barU: ChannelRef<number>; // hot load bars
  stallU: ChannelRef<number>; // the stall highlight
  balU: ChannelRef<number>; // morph to balanced routing
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const devU = tl.channel('devU', 0);
  const flowU = tl.channel('flowU', 0);
  const capU = tl.channel('capU', 0);
  const barU = tl.channel('barU', 0);
  const stallU = tl.channel('stallU', 0);
  const balU = tl.channel('balU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the fourth cut ———————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The last cut is the strangest: instead of splitting one feed-forward block, replace it with eight experts and let a router send each token to just two of them. Eight experts, eight devices — expert parallelism.',
  });
  tl.tween(cam, CAM_DEV, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(devU, 1, { at: 1.4, dur: 2.0, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'The arithmetic is seductive. Give our transformer eight experts per layer and it grows to thirty six billion parameters — but each token still touches only eleven billion of them. Three point four times the capacity, near constant compute per token.',
  });
  tl.tween(capU, 1, { at: 7.5, dur: 1.2, ease: ease.enter });
  tl.hold(12.5, 0.6);

  // — Beat 2 · the all-to-all ———————————————————————————————————————————
  tl.caption({
    at: 13.1,
    dur: 5.6,
    text: 'But now the batch itself has to travel. Each token computes attention at home, then ships its activation to whichever devices hold its two experts, and ships the result back: an all-to-all, twice, in every single expert layer.',
  });
  tl.tween(flowU, 1, { at: 14.1, dur: 3.0, ease: ease.linear });
  tl.caption({
    at: 19.1,
    dur: 5.2,
    text: 'The bill, computed: four thousand tokens times two experts times the hidden size is sixty four megabytes out and sixty four back per layer — about four gigabytes of token traffic for every training step of our toy model.',
  });
  tl.hold(24.5, 0.6);

  // — Beat 3 · the stall ————————————————————————————————————————————————
  tl.tween(cam, CAM_BARS, { at: 25.1, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 25.5,
    dur: 5.6,
    text: 'And there is a subtler tax. The router is learned, and learned routers play favorites. This is a real routing simulation: four thousand tokens, top two of eight — and expert two ends up with twenty seven hundred assignments against a fair share of one thousand.',
  });
  tl.tween(barU, 1, { at: 26.5, dur: 2.0, ease: ease.enter });
  tl.caption({
    at: 31.5,
    dur: 5.0,
    text: 'Devices finish when their expert finishes, and everyone waits for the busiest one. Load two point seven times the mean means the whole cluster idles at two point seven times the ideal step time.',
  });
  tl.tween(stallU, 1, { at: 32.5, dur: 0.9, ease: ease.pop });
  tl.hold(36.7, 0.6);

  // — Beat 4 · the balancing loss ———————————————————————————————————————
  tl.caption({
    at: 37.3,
    dur: 5.6,
    text: 'The standard fix is honest bribery: an auxiliary loss that punishes the router whenever the load distribution drifts from uniform. Rerun the same simulation with that pressure applied, and the worst expert carries just one point two times the mean.',
  });
  tl.tween(balU, 1, { at: 38.7, dur: 1.8, ease: ease.move });
  tl.hold(43.1, 0.6);

  // — Beat 5 · recap + close ————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 43.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 44.3, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 45.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.5,
    dur: 6.2,
    text: 'The full map: data parallelism ships gradients, tensor parallelism ships activations at every seam, pipeline pays in bubbles, zero redundancy trades memory for bandwidth, and experts ship the batch itself. Training at scale is deciding which of these bills you can afford.',
  });
  tl.hold(51.9, 1.2);

  return { tl, cam, devU, flowU, capU, barU, stallU, balU, dimU, endU };
}
