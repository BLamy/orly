import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Why One Chip Can't — the memory arithmetic, computed exactly.
 *
 * A concrete toy transformer, counted at module scope:
 *   32 layers, hidden 4096, vocab 32000
 *   embedding 32000×4096 = 131.1M
 *   per layer: attention 4·d² = 67.1M, feed-forward 8·d² = 134.2M
 *   total ≈ 6.57 billion parameters.
 * Mixed-precision Adam training state per parameter: 2 (fp16 weight) +
 * 2 (fp16 grad) + 4 + 4 (fp32 Adam m, v) + 4 (fp32 master weight) = 16 bytes.
 * Total ≈ 105.2 GB of state before a single activation — against an 80 GB
 * accelerator. The wall is arithmetic, not engineering.
 */

export const LAYERS = 32;
export const D = 4096;
export const VOCAB = 32000;
export const EMB = VOCAB * D; // 131.1M
export const ATTN = 4 * D * D; // 67.1M
export const MLP = 8 * D * D; // 134.2M
export const PER_LAYER = ATTN + MLP;
export const PARAMS = EMB + LAYERS * PER_LAYER; // ≈ 6.57e9
export const GB = 1024 ** 3;

export const BYTES_W = 2; // fp16 weights
export const BYTES_G = 2; // fp16 grads
export const BYTES_ADAM = 8; // fp32 m + v
export const BYTES_MASTER = 4; // fp32 master copy
export const MEM_W = (PARAMS * BYTES_W) / GB; // ≈ 12.2 GB
export const MEM_G = (PARAMS * BYTES_G) / GB;
export const MEM_ADAM = (PARAMS * BYTES_ADAM) / GB; // ≈ 49.0 GB
export const MEM_MASTER = (PARAMS * BYTES_MASTER) / GB; // ≈ 24.5 GB
export const MEM_TOTAL = MEM_W + MEM_G + MEM_ADAM + MEM_MASTER; // ≈ 98 GB
export const CHIP_GB = 80;

export const SEGMENTS = [
  { key: 'weights', label: 'weights (16-bit)', gb: MEM_W },
  { key: 'grads', label: 'gradients (16-bit)', gb: MEM_G },
  { key: 'adam', label: 'optimizer moments (32-bit ×2)', gb: MEM_ADAM },
  { key: 'master', label: 'master weights (32-bit)', gb: MEM_MASTER },
];

// ---------------------------------------------------------------------------
// Layout — param counter left, memory tower center-right vs chip line.
// ---------------------------------------------------------------------------

export const CNT_X = 250;
export const CNT_Y0 = 150;

export const TWR_X = 760;
export const TWR_W = 190;
export const TWR_Y0 = 560; // base of the tower
export const GB_PX = 4.4; // pixels per GB
export const twrH = (gb: number): number => gb * GB_PX;

export const CAM_CNT: CameraState = { x: 350, y: 300, k: 1.25 };
export const CAM_TWR: CameraState = { x: 800, y: 320, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cntU: ChannelRef<number>; // parameter tally rows
  segU: ChannelRef<number>; // 0..4 tower segments stack
  chipU: ChannelRef<number>; // the 80GB line
  overU: ChannelRef<number>; // overflow highlight
  actU: ChannelRef<number>; // activations note
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cntU = tl.channel('cntU', 0);
  const segU = tl.channel('segU', 0);
  const chipU = tl.channel('chipU', 0);
  const overU = tl.channel('overU', 0);
  const actU = tl.channel('actU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · count the model ——————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Before any talk of clusters, do the arithmetic that forces them to exist. Take a modest transformer: thirty two layers, hidden size four thousand ninety six, a thirty two thousand word vocabulary.',
  });
  tl.tween(cam, CAM_CNT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(cntU, 1, { at: 1.6, dur: 2.2, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 5.6,
    text: 'Count it. The embedding table alone is one hundred thirty one million parameters. Each layer adds sixty seven million for attention and one hundred thirty four million for the feed-forward block. Total: six point six billion parameters.',
  });
  tl.hold(12.1, 0.6);

  // — Beat 2 · a parameter is not two bytes —————————————————————————————
  tl.tween(cam, CAM_TWR, { at: 12.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 13.1,
    dur: 5.2,
    text: 'Storing those weights in sixteen bit floats costs twelve gigabytes. If that were the whole bill, one chip would shrug. But training multiplies every parameter by eight.',
  });
  tl.tween(segU, 1, { at: 14.1, dur: 1.0, ease: ease.move });
  tl.caption({
    at: 18.7,
    dur: 5.8,
    text: 'The backward pass needs a gradient for every weight: twelve more gigabytes. Adam keeps two thirty two bit moment estimates per parameter: forty nine gigabytes. And mixed precision keeps a thirty two bit master copy of the weights: twenty five more.',
  });
  tl.tween(segU, 4, { at: 19.7, dur: 3.6, ease: ease.move });
  tl.hold(24.7, 0.6);

  // — Beat 3 · the wall —————————————————————————————————————————————————
  tl.caption({
    at: 25.3,
    dur: 5.4,
    text: 'Stack it up: sixteen bytes of training state per parameter, ninety eight gigabytes total. Now draw the ceiling of a flagship accelerator: eighty gigabytes. The tower does not fit.',
    tex: '16\\ \\text{bytes} \\times 6.57\\text{B} \\approx 98\\ \\text{GB}',
  });
  tl.tween(chipU, 1, { at: 26.3, dur: 1.0, ease: ease.draw });
  tl.tween(overU, 1, { at: 28.3, dur: 0.9, ease: ease.pop });
  tl.caption({
    at: 31.1,
    dur: 5.0,
    text: 'And we have not bought a single activation yet — the forward pass intermediates that backpropagation must remember, which grow with batch size and sequence length on top of everything here.',
  });
  tl.tween(actU, 1, { at: 32.1, dur: 0.9, ease: ease.enter });
  tl.hold(36.3, 0.6);

  // — Beat 4 · the way out ——————————————————————————————————————————————
  tl.caption({
    at: 36.9,
    dur: 5.6,
    text: 'So the wall is arithmetic, not engineering: sixteen bytes per parameter times enough parameters beats any chip you can buy. The only question left is how to split the tower — and there are exactly three axes to cut along.',
  });
  tl.caption({
    at: 42.9,
    dur: 4.8,
    text: 'Cut along the data, so every device holds the whole model but different examples. Cut inside each matrix. Or cut along the depth, layer by layer. This book takes them in that order.',
  });
  tl.hold(47.9, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 48.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 49.1, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 50.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.3,
    dur: 4.8,
    text: 'Remember the tower: weights, gradients, moments, master copy — eight bytes of optimizer for every two bytes of model. Every trick that follows is a way of not keeping all of it everywhere.',
  });
  tl.hold(55.3, 1.2);

  return { tl, cam, cntU, segU, chipU, overU, actU, dimU, endU };
}
