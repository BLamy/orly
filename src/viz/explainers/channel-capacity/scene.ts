import { CAMERA_HOME, Timeline, cameraInterp, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Channel Capacity — shouting over noise.
 *
 * All math at module scope and verified by running it. A binary symmetric
 * channel that flips each bit with probability 0.1: capacity
 * C = 1 − H(0.1) = 0.531 bits per use. Repetition codes computed exactly:
 * send-three has rate 1/3 and residual error 3p²(1−p) + p³ = 0.028; send-five
 * has rate 1/5 and error 0.00856. The animated transmission is a real seeded
 * simulation (seed 99): 40 message bits × 3 copies = 120 channel uses,
 * 13 raw flips, all 13 damaged blocks carry exactly one flip, and majority
 * vote decodes all 40 bits correctly.
 */

export const P_FLIP = 0.1;
const Hb = (x: number): number => (x <= 0 || x >= 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x));
export const CAPACITY = 1 - Hb(P_FLIP); // 0.531
export const ERR3 = 3 * P_FLIP * P_FLIP * (1 - P_FLIP) + P_FLIP ** 3; // 0.028
export const ERR5 = (() => {
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  return [3, 4, 5].reduce((s, k) => s + (fact(5) / (fact(k) * fact(5 - k))) * P_FLIP ** k * (1 - P_FLIP) ** (5 - k), 0);
})(); // 0.00856

export interface Block {
  bit: number;
  recv: [number, number, number];
  flips: number;
  decoded: number;
}
export const N_BITS = 40;
export const BLOCKS: Block[] = (() => {
  const rand = mulberry32(99);
  const msg = Array.from({ length: N_BITS }, () => (rand() < 0.5 ? 0 : 1));
  return msg.map((bit) => {
    const recv = [bit, bit, bit].map((b) => (rand() < P_FLIP ? 1 - b : b)) as [number, number, number];
    const flips = recv.filter((b) => b !== bit).length;
    const decoded = recv[0] + recv[1] + recv[2] >= 2 ? 1 : 0;
    return { bit, recv, flips, decoded };
  });
})();
export const TOTAL_FLIPS = BLOCKS.reduce((s, b) => s + b.flips, 0); // 13
export const DECODE_ERRORS = BLOCKS.filter((b) => b.decoded !== b.bit).length; // 0

// layout: channel band across the middle; detailed block view; tally; chart
export const BAND = { x: 140, y: 250, w: 1000, h: 130 };
export const TAPE = { x: 140, y: 120, w: 1000 };
export const OUT = { x: 140, y: 452, w: 1000 };
export const CHART = { x: 260, y: 120, w: 760, h: 380 };

export const CAM_BAND: CameraState = { x: 400, y: 300, k: 1.15 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bandU: ChannelRef<number>;
  nakedF: ChannelRef<number>; // 0..N_BITS: bits sent bare (phase 1)
  tripleF: ChannelRef<number>; // 0..N_BITS: blocks sent in triplicate
  tallyU: ChannelRef<number>;
  actU: ChannelRef<number>; // 1 = transmission act visible
  chartU: ChannelRef<number>;
  capU: ChannelRef<number>; // capacity line
  texU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bandU = tl.channel('bandU', 0);
  const nakedF = tl.channel('nakedF', 0);
  const tripleF = tl.channel('tripleF', 0);
  const tallyU = tl.channel('tallyU', 0);
  const actU = tl.channel('actU', 1);
  const chartU = tl.channel('chartU', 0);
  const capU = tl.channel('capU', 0);
  const texU = tl.channel('texU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the noisy channel ————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Every message travels through something imperfect: a scratchy wire, a radio band, a memory cell. Model it brutally: each bit you send gets flipped with probability one in ten.',
  });
  tl.tween(bandU, 1, { at: 0.6, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_BAND, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.1,
    dur: 4.8,
    text: 'Send forty bits naked and watch the carnage. Every flipped bit is a corrupted bit; one error in ten, forever. You cannot outrun the noise by hoping.',
  });
  tl.tween(nakedF, N_BITS, { at: 6.7, dur: 4.0, ease: ease.linear });
  tl.tween(tallyU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.hold(11.1, 0.5);

  // — Beat 2 · buy reliability with redundancy ——————————————————————————————
  tl.caption({
    at: 11.6,
    dur: 5.4,
    text: 'The oldest defense is repetition. Say everything three times, and let the receiver take a majority vote. One flip in a block of three gets outvoted by the two survivors.',
  });
  tl.caption({
    at: 17.2,
    dur: 5.6,
    text: 'This is a real seeded run, not a cartoon. One hundred twenty channel uses, thirteen flips land, and every damaged block happens to take just one hit. The vote repairs all of them: forty out of forty decoded clean.',
  });
  tl.tween(tripleF, N_BITS, { at: 17.6, dur: 5.0, ease: ease.linear });
  tl.hold(23.0, 0.5);

  // — Beat 3 · the price ————————————————————————————————————————————————————
  tl.caption({
    at: 23.5,
    dur: 5.6,
    text: 'Not magic, arithmetic. A block still fails if two or three copies flip together: probability two point eight percent. You bought a three and a half times better error rate, and paid two thirds of your throughput for it.',
  });
  tl.caption({
    at: 29.3,
    dur: 4.8,
    text: 'Repeat five times and the failure rate falls below one percent, but now you crawl at one fifth speed. It smells like a cruel law: reliability seems to cost rate, all the way to zero.',
  });
  tl.hold(34.3, 0.5);

  // — Beat 4 · Shannon's surprise ———————————————————————————————————————————
  tl.tween(actU, 0.12, { at: 34.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 34.8, dur: 1.4, ease: ease.move });
  tl.tween(chartU, 1, { at: 35.9, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 36.1,
    dur: 5.6,
    text: 'Plot the trade: rate across, residual error up. The naked channel, repeat three, repeat five: a staircase marching toward zero speed. Shannon looked at this and proved everyone wrong.',
  });
  tl.caption({
    at: 41.9,
    dur: 6.0,
    text: 'Every channel has a capacity. For this one: one minus the entropy of the flip, about point five three bits per use. Below that rate, smarter codes can push the error as low as you like, without the rate sliding to zero.',
    tex: 'C = 1 - H(p) = 1 - H(0.1) = 0.531',
  });
  tl.tween(capU, 1, { at: 42.9, dur: 1.2, ease: ease.draw });
  tl.tween(texU, 1, { at: 43.3, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 48.1,
    dur: 5.0,
    text: 'Above the line, no code can save you; below it, near perfect communication at half speed through a channel that mangles every tenth bit. That boundary is the second great law of information.',
  });
  tl.hold(53.3, 0.6);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 53.9, dur: 1.1, ease: ease.move });
  tl.tween(texU, 0, { at: 53.9, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 55.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 55.1,
    dur: 5.8,
    text: 'Entropy told us the least we must say; capacity tells us the most a channel can carry. Redundancy is not waste, it is armor, and Shannon priced it exactly.',
  });
  tl.hold(61.1, 1.2);

  return { tl, cam, bandU, nakedF, tripleF, tallyU, actU, chartU, capU, texU, dimU, endU };
}
