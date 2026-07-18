import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Huffman Codes — shorter words for common things.
 *
 * All math at module scope and verified by running it: eight letters with
 * English-like frequencies, the REAL Huffman algorithm (repeatedly merge the
 * two rarest nodes). Verified merge order: R+S=0.09, N+RS=0.17, I+O=0.23,
 * A+NRS=0.31, T+IO=0.42, E+ANRS=0.58, then the root. Resulting codes:
 * E:10 T:00 A:110 O:011 I:010 N:1110 R:11110 S:11111.
 * Entropy H = 2.771 bits; Huffman expected length 2.800 bits; fixed-width
 * code 3.000 bits.
 */

export const SYMS: { s: string; p: number }[] = [
  { s: 'E', p: 0.27 },
  { s: 'T', p: 0.19 },
  { s: 'A', p: 0.14 },
  { s: 'O', p: 0.13 },
  { s: 'I', p: 0.1 },
  { s: 'N', p: 0.08 },
  { s: 'S', p: 0.05 },
  { s: 'R', p: 0.04 },
];

interface HNode {
  id: number;
  s: string;
  p: number;
  kids: [HNode, HNode] | null;
}

export interface MergeStep {
  /** ids of the two nodes merged and the new node's id */
  a: number;
  b: number;
  m: number;
  p: number;
}

export interface LaidNode {
  id: number;
  s: string;
  p: number;
  x: number;
  y: number;
  leaf: boolean;
  /** which merge step (1-based) creates this node; 0 for leaves */
  born: number;
  parent: number | null;
  code: string;
}

export const { NODES, MERGES, CODES, EXP_LEN, ENTROPY } = (() => {
  let nextId = 0;
  let pool: HNode[] = SYMS.map(({ s, p }) => ({ id: nextId++, s, p, kids: null }));
  const all: HNode[] = [...pool];
  const merges: MergeStep[] = [];
  while (pool.length > 1) {
    pool = [...pool].sort((a, b) => a.p - b.p);
    const [a, b] = pool.splice(0, 2);
    const m: HNode = { id: nextId++, s: a.s + b.s, p: a.p + b.p, kids: [a, b] };
    merges.push({ a: a.id, b: b.id, m: m.id, p: m.p });
    pool.push(m);
    all.push(m);
  }
  const root = pool[0];
  // codes + depths
  const codes: Record<number, string> = {};
  const parent: Record<number, number | null> = { [root.id]: null };
  (function walk(n: HNode, code: string) {
    codes[n.id] = code;
    if (!n.kids) return;
    parent[n.kids[0].id] = n.id;
    parent[n.kids[1].id] = n.id;
    walk(n.kids[0], code + '0');
    walk(n.kids[1], code + '1');
  })(root, '');
  // layout: leaves in DFS order along x, internal nodes centered above kids,
  // y by depth (root at top)
  const TREE = { x0: 170, x1: 830, yTop: 96, yBottom: 470 };
  let leafI = 0;
  const leavesN = SYMS.length;
  const maxDepth = Math.max(...all.filter((n) => !n.kids).map((n) => codes[n.id].length));
  const pos: Record<number, { x: number; y: number }> = {};
  (function place(n: HNode): { x: number; y: number } {
    const depth = codes[n.id].length;
    const y = TREE.yTop + (depth / maxDepth) * (TREE.yBottom - TREE.yTop);
    if (!n.kids) {
      const x = TREE.x0 + ((leafI + 0.5) / leavesN) * (TREE.x1 - TREE.x0);
      leafI++;
      pos[n.id] = { x, y: TREE.yBottom };
      return pos[n.id];
    }
    const A = place(n.kids[0]);
    const B = place(n.kids[1]);
    pos[n.id] = { x: (A.x + B.x) / 2, y };
    return pos[n.id];
  })(root);
  const bornOf: Record<number, number> = {};
  merges.forEach((mg, i) => (bornOf[mg.m] = i + 1));
  const nodes: LaidNode[] = all.map((n) => ({
    id: n.id,
    s: n.kids ? '' : n.s,
    p: n.p,
    x: pos[n.id].x,
    y: pos[n.id].y,
    leaf: !n.kids,
    born: n.kids ? bornOf[n.id] : 0,
    parent: parent[n.id] ?? null,
    code: codes[n.id],
  }));
  const H = SYMS.reduce((s2, { p }) => s2 - p * Math.log2(p), 0);
  const L = SYMS.reduce((s2, { s, p }) => {
    const leaf = nodes.find((n) => n.leaf && n.s === s)!;
    return s2 + p * leaf.code.length;
  }, 0);
  const codeBySym: Record<string, string> = {};
  nodes.filter((n) => n.leaf).forEach((n) => (codeBySym[n.s] = n.code));
  return { NODES: nodes, MERGES: merges, CODES: codeBySym, EXP_LEN: L, ENTROPY: H };
})();

export const N_MERGES = MERGES.length; // 7
export const nodeById = (id: number): LaidNode => NODES.find((n) => n.id === id)!;

// frequency bars (opening beat) — drawn at the leaves' final x positions
export const BAR_BASE = 560;
export const BAR_HMAX = 300;

// meters (right column)
export const METERS = { x: 900, y: 190, w: 280, rowH: 84 };

export const CAM_TREE: CameraState = { x: 400, y: 300, k: 1.22 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  barsU: ChannelRef<number>;
  fixedU: ChannelRef<number>; // fixed 3-bit codes shown under letters
  mergeF: ChannelRef<number>; // 0..N_MERGES fractional merge progress
  codesU: ChannelRef<number>; // 0/1 labels on edges + leaf codes
  metersU: ChannelRef<number>;
  hLineU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const barsU = tl.channel('barsU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const mergeF = tl.channel('mergeF', 0);
  const codesU = tl.channel('codesU', 0);
  const metersU = tl.channel('metersU', 0);
  const hLineU = tl.channel('hLineU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the obvious code wastes bits ————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'You need to send letters over a wire that only carries zeros and ones. Eight letters, so the obvious move is three bits each, every letter the same. Done, and wasteful.',
  });
  tl.tween(barsU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(fixedU, 1, { at: 2.8, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.1,
    dur: 5.0,
    text: 'Wasteful because the letters are not equally common. This letter arrives twenty seven percent of the time; that one, four percent. Paying three bits for both is like pricing every word in the dictionary the same.',
  });
  tl.hold(11.3, 0.5);

  // — Beat 2 · the idea ————————————————————————————————————————————————————
  tl.caption({
    at: 11.8,
    dur: 4.6,
    text: 'The fix is old and beautiful: give common things short names and rare things long ones. The only question is how to do it optimally, and Huffman answered it with a greedy little ritual.',
  });
  tl.tween(fixedU, 0, { at: 12.2, dur: 0.7, ease: ease.move });
  tl.hold(16.6, 0.4);

  // — Beat 3 · merge the two rarest, repeatedly ————————————————————————————
  tl.tween(cam, CAM_TREE, { at: 17.0, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 17.2,
    dur: 5.6,
    text: 'Take the two rarest letters and glue them into a team. The two rarest things deserve the two longest names, so commit them to sharing a name except for a final bit.',
  });
  tl.tween(mergeF, 1, { at: 19.2, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 23.0,
    dur: 5.4,
    text: 'Now treat that team as one item with their combined nine percent, and repeat: always merge the two rarest things on the table, letter or team, it makes no difference.',
  });
  tl.tween(mergeF, 3, { at: 23.6, dur: 3.6, ease: ease.move });
  tl.caption({
    at: 28.6,
    dur: 4.8,
    text: 'Merge by merge a tree assembles itself from the bottom up, rare letters sinking deep, common letters staying shallow. Seven merges and the tree is whole.',
  });
  tl.tween(mergeF, N_MERGES, { at: 29.0, dur: 4.2, ease: ease.move });
  tl.hold(33.6, 0.6);

  // — Beat 4 · read the codes off the tree —————————————————————————————————
  tl.caption({
    at: 34.2,
    dur: 5.6,
    text: 'The codes are just directions: from the top, every left turn writes a zero and every right turn writes a one. The commonest letter reads out as two bits; the rarest needs five.',
  });
  tl.tween(codesU, 1, { at: 35.0, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 40.0,
    dur: 5.0,
    text: 'And because letters live only at the ends of branches, no codeword is the start of another. A stream of these bits splits itself back into letters with no spaces needed.',
  });
  tl.hold(45.2, 0.5);

  // — Beat 5 · measure it against entropy ——————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 45.7, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 45.9,
    dur: 5.4,
    text: 'Now the accounting. Weight each code length by how often you pay it, and the average comes to two point eight zero bits per letter, against three for the fixed code.',
  });
  tl.tween(metersU, 1, { at: 46.7, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 51.5,
    dur: 5.8,
    text: 'Here is the punchline. The entropy of this alphabet, computed from the frequencies alone, is two point seven seven bits. That number is a law: no lossless code, however clever, can average below it.',
    tex: 'H = -\\textstyle\\sum_i p_i \\log_2 p_i = 2.771',
  });
  tl.tween(hLineU, 1, { at: 52.5, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 57.5,
    dur: 4.6,
    text: 'Huffman lands within three hundredths of a bit of that floor, using nothing but greed. Entropy is not just a measure of surprise; it is the exchange rate between probability and length.',
  });
  tl.hold(62.3, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 62.9, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 64.1, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 64.1,
    dur: 5.6,
    text: 'That is the first bridge of information theory: probabilities on one side, code lengths on the other, entropy as the toll. Next we ask what one signal is worth in bits about another.',
  });
  tl.hold(69.9, 1.2);

  return { tl, cam, barsU, fixedU, mergeF, codesU, metersU, hLineU, dimU, endU };
}
