import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * ZeRO — shard the redundancy, computed exactly.
 *
 * Chapter one's tower, on a ring of 8 data-parallel devices. Plain data
 * parallelism stores all 16 bytes/param on EVERY device: 97.96 GB each.
 * ZeRO's observation: the optimizer state is pure redundancy — each device
 * only ever updates the shard of weights it is responsible for.
 *
 * Per-device memory for the 6.57B model, N = 8 (computed at module scope):
 *   stage 0 (plain DP):  2w + 2g + 12opt            = 97.96 GB
 *   stage 1 (opt/N):     2w + 2g + 12/N             = 33.66 GB
 *   stage 2 (+grad/N):   2w + (2+12)/N shards         = 22.95 GB
 *   stage 3 (+param/N):  16/N                       = 12.24 GB
 * Stage 3's price: parameters must be all-gathered on demand each forward/
 * backward — roughly 1.5× the communication volume of plain data parallelism.
 */

export const PARAMS = 6.5735e9;
export const GB = 1024 ** 3;
export const N_DEV = 8;
const gbOf = (bytesPerParam: number): number => (PARAMS * bytesPerParam) / GB;

export const W_GB = gbOf(2); // 12.24
export const G_GB = gbOf(2);
export const OPT_GB = gbOf(12); // m + v + master = 73.47

export interface Stage {
  name: string;
  desc: string;
  w: number;
  g: number;
  opt: number;
}
export const STAGES: Stage[] = [
  { name: 'plain data parallel', desc: 'everything everywhere', w: W_GB, g: G_GB, opt: OPT_GB },
  { name: 'stage 1 · shard optimizer', desc: 'moments + master ÷ 8', w: W_GB, g: G_GB, opt: OPT_GB / N_DEV },
  { name: 'stage 2 · shard gradients', desc: 'gradients ÷ 8 too', w: W_GB, g: G_GB / N_DEV, opt: OPT_GB / N_DEV },
  { name: 'stage 3 · shard parameters', desc: 'nothing is duplicated', w: W_GB / N_DEV, g: G_GB / N_DEV, opt: OPT_GB / N_DEV },
];
export const totalOf = (st: Stage): number => st.w + st.g + st.opt;
// 97.96 · 33.66 · 22.95 · 12.24

export const CHIP_GB = 80;

// ---------------------------------------------------------------------------
// Layout — one hero tower left (this device), 7 ghost towers behind, chart right.
// ---------------------------------------------------------------------------

export const TWR_X = 240;
export const TWR_W = 150;
export const TWR_Y0 = 560;
export const GB_PX = 4.6;
export const twrH = (gb: number): number => gb * GB_PX;

export const BAR_X0 = 660;
export const BAR_Y0 = 520;
export const BAR_W = 96;
export const BAR_DX = 132;
export const barH = (gb: number): number => gb * 3.6;

export const CAM_TWR: CameraState = { x: 400, y: 320, k: 1.2 };
export const CAM_BARS: CameraState = { x: 880, y: 330, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  twrU: ChannelRef<number>; // hero tower + ghosts
  stage: ChannelRef<number>; // 0..3 — the hero tower's segments shrink
  barU: ChannelRef<number>; // 0..4 summary bars
  commU: ChannelRef<number>; // the comms fine print
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const twrU = tl.channel('twrU', 0);
  const stage = tl.channel('stage', 0);
  const barU = tl.channel('barU', 0);
  const commU = tl.channel('commU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the redundancy ———————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Look at the data-parallel ring again, honestly: eight devices, eight identical copies of the ninety eight gigabyte tower. Seven of those copies are pure redundancy — and the biggest slab, the optimizer state, is the most redundant of all.',
  });
  tl.tween(cam, CAM_TWR, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(twrU, 1, { at: 1.4, dur: 1.8, ease: ease.draw });
  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'The zero redundancy optimizer starts from one observation: after the gradients are summed, each device could update just one eighth of the weights and let the others do the rest. So why does every device store all the moments?',
  });
  tl.hold(12.3, 0.6);

  // — Beat 2 · stage 1 ——————————————————————————————————————————————————
  tl.caption({
    at: 12.9,
    dur: 5.4,
    text: 'Stage one: shard the optimizer state. The seventy three gigabytes of moments and master weights divide by eight, down to nine. This device drops from ninety eight gigabytes to thirty four — watch the tower fall under the eighty gigabyte ceiling.',
  });
  tl.tween(stage, 1, { at: 14.3, dur: 1.4, ease: ease.move });
  tl.hold(18.5, 0.6);

  // — Beat 3 · stages 2 and 3 ———————————————————————————————————————————
  tl.caption({
    at: 19.1,
    dur: 5.2,
    text: 'Stage two shards the gradients as well — each device keeps only the slice it will use for its own update: twenty three gigabytes. The weights themselves are now the biggest thing left standing.',
  });
  tl.tween(stage, 2, { at: 20.3, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 24.5,
    dur: 5.4,
    text: 'Stage three shards those too. Nothing is duplicated anywhere: sixteen bytes per parameter divided by eight devices — twelve gigabytes each, an eight fold reduction, exactly the arithmetic.',
    tex: '\\tfrac{16\\,\\Psi}{N}',
  });
  tl.tween(stage, 3, { at: 25.7, dur: 1.2, ease: ease.move });
  tl.hold(30.1, 0.6);

  // — Beat 4 · the summary + the price ——————————————————————————————————
  tl.tween(cam, CAM_BARS, { at: 30.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 31.1,
    dur: 5.2,
    text: 'The whole story in four bars: ninety eight, thirty four, twenty three, twelve gigabytes per device. Our six point six billion parameter model now fits on one chip eight times over — or a fifty billion parameter model starts to fit at all.',
  });
  tl.tween(barU, 4, { at: 31.9, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 36.7,
    dur: 5.6,
    text: 'The price is printed in small type: with parameters sharded, every layer must be gathered on demand during the forward and backward pass — about one and a half times the communication of plain data parallelism. Memory is bought with bandwidth.',
  });
  tl.tween(commU, 1, { at: 38.1, dur: 1.0, ease: ease.enter });
  tl.hold(42.7, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 43.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.9, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 45.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.1,
    dur: 5.2,
    text: 'Data splits the batch, tensor splits the matrix, pipeline splits the depth, and zero redundancy splits the bookkeeping. One family member left: models that split the experts — where the communication bill changes shape entirely.',
  });
  tl.hold(50.5, 1.2);

  return { tl, cam, twrU, stage, barU, commU, dimU, endU };
}
