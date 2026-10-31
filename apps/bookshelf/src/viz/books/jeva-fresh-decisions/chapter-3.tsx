// Reuse the options, decide again
//
// Jeva: Fresh Decisions — chapter 3. Authored by Claude Fable 5.1 (claude-fable-5-1) from the
// Astra visual plan; captions are the fixed narration contract (verbatim).
//
// Source pin: LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb
//   src/jeva/inference.py 129–142            _encode_options: bounded batches (option_chunk_size,
//                                               option_batch_tokens) — every candidate is encoded
//   src/jeva/inference.py 207–270            per request: state is always encoded; set_key =
//                                               tuple(tuple(input_ids)); _sets.get → on miss, hybrid
//                                               _options.get per key, encode only the missing,
//                                               compile_option_memory, _options.put,
//                                               assemble_option_memory, _sets.put; then
//                                               decide_from_option_cache(c, option_cache)
//   src/jeva/_runtime/matrix_decision.py 13–42   MatrixOptionKVCache / FactorizedOptionMemory
//                                               (option_read, layer_keys, layer_values)
//   src/jeva/_runtime/matrix_decision.py 247–346 prepare_option_cache, compile_option_memory,
//                                               assemble_option_memory
//   src/jeva/_runtime/cache.py 12–30         BoundedCache: get → move_to_end; put → evict
//                                               popitem(last=False) while over max_entries/max_bytes
//   docs/runtime.md 61–85                     batching bound ≠ chunking; cache bytes ≠ total GPU
//                                               memory; changed weights/tokenizer invalidate reuse
//   paper arXiv:2610.18773v1 §3.4, Appendix B.5–B.6
//
// The A/B/C/D option identities and the request tuples ABC → ABC → BCD → DAB are an ILLUSTRATIVE
// cache trace: the hit/miss/encode counts are what the inference code deterministically does for
// that sequence, with no evictions. Nothing here is a benchmark, a timing, or a token count.
// The deployed paper configuration uses one decision block (decision_depth = 1); the per-layer
// k_l / v_l notation is the generic shape of a configurable stack.
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The illustrative trace (deterministic consequence of inference.py 217–249)
// ---------------------------------------------------------------------------

const OPTS = [
  { name: 'A', color: colors.ACCENT, text: 'Option for choice: A' },
  { name: 'B', color: colors.SECONDARY, text: 'Option for choice: B' },
  { name: 'C', color: colors.WARM, text: 'Option for choice: C' },
  { name: 'D', color: colors.POSITIVE, text: 'Option for choice: D' },
] as const;
const STATE_COLOR = '#f4f7fb';

/** request tuples as option indices */
const REQ: number[][] = [
  [0, 1, 2],
  [0, 1, 2],
  [1, 2, 3],
  [3, 0, 1],
];
/** options the hybrid path must encode for each request (missing from _options) */
const ENCODES: number[][] = [[0, 1, 2], [], [3], []];
const SET_HIT = [false, true, false, false];
const TRACE = [
  { tuple: '(A,B,C)', sets: 'MISS', hits: '0/3', enc: '3' },
  { tuple: '(A,B,C)', sets: 'HIT', hits: '— bypassed', enc: '0' },
  { tuple: '(B,C,D)', sets: 'MISS', hits: '2/3', enc: '1' },
  { tuple: '(D,A,B)', sets: 'MISS', hits: '3/3', enc: '0' },
];
/** tuple chips that exist in _sets after request r (0-based) */
const SET_CHIPS = ['(A,B,C)', '(B,C,D)', '(D,A,B)'];
const SETS_AFTER = [1, 1, 2, 3];
/** illustrative fresh readouts per request (NOT model output) — different every time */
const READOUTS = [
  [0.52, 0.31, 0.17],
  [0.21, 0.64, 0.15],
  [0.33, 0.27, 0.4],
  [0.58, 0.12, 0.3],
];

/** abstract cell shades per option / block / cell — seeded, never random at runtime */
const rand = mulberry32(2610);
const SHADES: number[][][] = OPTS.map(() => [0, 1, 2].map(() => [0, 1, 2].map(() => 0.25 + 0.7 * rand())));
/** abstract token ids for the key strip (beat 6) */
const TOKEN_IDS: number[][] = OPTS.map(() => [0, 1, 2, 3, 4, 5].map(() => 100 + Math.floor(rand() * 9000)));

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; title y38, source chip y80)
// ---------------------------------------------------------------------------

const TILE_W = 292;
const TILE_H = 44;
const CELL = 24;
const CGAP = 2;
const BLOCK_X = [40, 126, 212]; // u, k, v offsets inside a tile
const BANK = { x: 120, y: 170, w: 330, h: 262 };
const bankSlotY = (i: number) => 226 + i * 52;
const tileX = BANK.x + 19;
const ENC = { x: 500, y: 190, w: 200, h: 56 };
const SETS = { x: 500, y: 280, w: 200, h: 134 };
const setChipY = (i: number) => 320 + i * 32;
const MAT = { x: 740, y: 170, w: 420, h: 244 };
const matRowY = (i: number) => 252 + i * 52;
const matTileX = MAT.x + 64;
const LANE = { x0: 770, x1: 1110, y: 470 };
const READ = { x: 770, base: 532, w: 44, gap: 24, hmax: 40 };
const TABLE = { x: 120, y: 444 };
const TCOL = [130, 196, 290, 374, 500];
const tableRowY = (i: number) => 504 + i * 22;

const CAM_HOME3: CameraState = { x: 640, y: 385, k: 1.0 };
const CAM_TILE: CameraState = { x: 270, y: 240, k: 1.9 };
const CAM_LEFT: CameraState = { x: 520, y: 320, k: 1.12 };
const CAM_RIGHT: CameraState = { x: 640, y: 390, k: 1.04 };

const PIN = 'LiQiiiii/Jeva@f231c9ac31ba72f2ca4ca8aac662b279f3438fdb';
const SOURCES = [
  'inference.py:207-249 · fresh state, reusable options',
  'inference.py:224-241 · _runtime/matrix_decision.py:277-307',
  'inference.py:217-248 · _runtime/matrix_decision.py:13-42',
  'inference.py:217-249 · _sets hit, state still encoded',
  'inference.py:226-241 · hybrid: encode only the missing',
  'inference.py:226-241 · assemble_option_memory',
  'inference.py:217-218 · docs/runtime.md:70-72 · paper B.5',
  '_runtime/cache.py:12-30 · BoundedCache LRU',
  'inference.py:129-142 · docs/runtime.md:61-72 · paper B.6',
  'inference.py:207-249 · paper §3.4',
];

// ---------------------------------------------------------------------------
// Timeline — 80 s, ten fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const src = tl.channel('src', 0);

  const frameU = tl.channel('frameU', 0); // bank / encoder / sets / matrix frames
  const heroU = tl.channel('heroU', 0); // beat 0: two different request states
  const reqIdx = tl.channel('reqIdx', -1); // current request (step)
  const encP = tl.channel('encP', 0); // strips → encoder → bank tile, 0..n
  const gatherP = tl.channel('gatherP', 0); // bank tiles → matrix rows, 0..3 (hit: 0..1)
  const hitU = tl.channel('hitU', 0); // _sets hit glow
  const setsN = tl.channel('setsN', 0); // tuple chips stored
  const stateP = tl.channel('stateP', 0); // fresh state across the lane
  const pulseU = tl.channel('pulseU', 0); // decision pulse + readout
  const tableN = tl.channel('tableN', 0); // trace rows shown
  const zoomU = tl.channel('zoomU', 0); // beat 2 tile anatomy labels
  const zoomDim = tl.channel('zoomDim', 0); // everything but the bank steps aside before the push-in
  const twoU = tl.channel('twoU', 0); // beat 2 atomic-vs-tuple labels
  const keyU = tl.channel('keyU', 0); // beat 6 cache-identity panel
  const sweepU = tl.channel('sweepU', 0); // beat 6 invalidation sweep
  const tableDim = tl.channel('tableDim', 0);
  const rightDim = tl.channel('rightDim', 0); // matrix + lane step aside for the key panel
  const lruU = tl.channel('lruU', 0); // beat 7 panel
  const lruP = tl.channel('lruP', 0); // 0 → 1 access A → 2 insert D (evict B)
  const scaleU = tl.channel('scaleU', 0); // beat 8 panel
  const growP = tl.channel('growP', 3); // rows K
  const replayP = tl.channel('replayP', 0); // beat 9: four stations, 0..4
  const stageDim = tl.channel('stageDim', 0);
  const closeU = tl.channel('closeU', 0);

  for (let i = 0; i < SOURCES.length; i++) tl.set(src, i, 0.5 + i * 8 - 0.1);

  // — beat 0 · same options, different questions —
  tl.caption({ at: 0.5, dur: 7.2, text: "The next request may ask a different question about the same options. Jeva can reuse their computation while making a fresh decision." });
  tl.tween(frameU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_HOME3, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(heroU, 1, { at: 2.4, dur: 1.0, ease: ease.enter });

  // — beat 1 · request 1 (A,B,C): empty bank, encode all three —
  tl.caption({ at: 8.5, dur: 7.2, text: "Start with an empty bank and three options. All three pass through the encoder, then their normalized vectors and layer projections are stored." });
  tl.tween(heroU, 0, { at: 8.3, dur: 0.5, ease: ease.move });
  tl.set(reqIdx, 0, 8.4);
  tl.tween(encP, 3, { at: 8.8, dur: 3.9, ease: ease.linear });
  tl.tween(gatherP, 3, { at: 12.8, dur: 1.8, ease: ease.linear });
  tl.tween(stateP, 1, { at: 13.2, dur: 1.6, ease: ease.move });
  tl.set(setsN, 1, 14.6);
  tl.tween(pulseU, 1, { at: 14.9, dur: 0.6, ease: ease.pop });
  tl.set(tableN, 1, 15.2);

  // — beat 2 · inside a tile; atomic bank vs tuple snapshot —
  tl.caption({ at: 16.5, dur: 7.2, text: "One cache keeps the assembled option tuple. The other keeps each option’s vector, keys, and values, ready for a different combination." });
  tl.tween(zoomDim, 1, { at: 15.9, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_TILE, { at: 16.3, dur: 1.5, ease: ease.move });
  tl.tween(zoomU, 1, { at: 17.6, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_HOME3, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.tween(zoomU, 0, { at: 20.4, dur: 0.6, ease: ease.move });
  tl.tween(zoomDim, 0, { at: 21.5, dur: 0.5, ease: ease.move });
  tl.tween(twoU, 1, { at: 21.6, dur: 0.7, ease: ease.enter });

  // — beat 3 · request 2 (A,B,C): set hit —
  tl.caption({ at: 24.5, dur: 7.2, text: "A new request with the same ordered tuple hits the set cache. The request still gets encoded, and the decision still runs." });
  tl.tween(twoU, 0, { at: 24.3, dur: 0.5, ease: ease.move });
  tl.set(reqIdx, 1, 24.4);
  tl.set(encP, 0, 24.4);
  tl.set(gatherP, 0, 24.4);
  tl.set(stateP, 0, 24.4);
  tl.set(pulseU, 0, 24.4);
  tl.tween(hitU, 1, { at: 25.0, dur: 0.6, ease: ease.pop });
  tl.tween(gatherP, 1, { at: 25.8, dur: 1.2, ease: ease.move });
  tl.tween(stateP, 1, { at: 26.4, dur: 1.6, ease: ease.move });
  tl.tween(pulseU, 1, { at: 28.1, dur: 0.6, ease: ease.pop });
  tl.set(tableN, 2, 28.5);

  // — beat 4 · request 3 (B,C,D): miss; reuse B, C; encode D —
  tl.caption({ at: 32.5, dur: 7.2, text: "Now replace one option. The whole tuple misses, but hybrid caching finds the two retained options and encodes only the newcomer." });
  tl.tween(hitU, 0, { at: 32.3, dur: 0.4, ease: ease.move });
  tl.set(reqIdx, 2, 32.4);
  tl.set(encP, 0, 32.4);
  tl.set(gatherP, 0, 32.4);
  tl.set(stateP, 0, 32.4);
  tl.set(pulseU, 0, 32.4);
  tl.tween(encP, 1, { at: 33.0, dur: 1.5, ease: ease.linear });
  tl.tween(gatherP, 3, { at: 34.7, dur: 1.8, ease: ease.linear });
  tl.tween(stateP, 1, { at: 35.6, dur: 1.6, ease: ease.move });
  tl.set(setsN, 2, 36.6);
  tl.tween(pulseU, 1, { at: 37.3, dur: 0.6, ease: ease.pop });
  tl.set(tableN, 3, 37.8);

  // — beat 5 · request 4 (D,A,B): new tuple, no encoding at all —
  tl.caption({ at: 40.5, dur: 7.2, text: "A third combination uses three options already in the bank. Its tuple is new, yet all three option memories can be assembled without encoding them again." });
  tl.set(reqIdx, 3, 40.4);
  tl.set(encP, 0, 40.4);
  tl.set(gatherP, 0, 40.4);
  tl.set(stateP, 0, 40.4);
  tl.set(pulseU, 0, 40.4);
  tl.tween(gatherP, 3, { at: 40.8, dur: 1.6, ease: ease.linear });
  tl.tween(stateP, 1, { at: 42.2, dur: 1.6, ease: ease.move });
  tl.set(tableN, 4, 42.5);
  tl.set(setsN, 3, 42.6);
  tl.tween(pulseU, 1, { at: 43.9, dur: 0.6, ease: ease.pop });

  // — beat 6 · cache identity and invalidation —
  tl.caption({ at: 48.5, dur: 7.2, text: "Cache identity follows tokenized, typed option text. Changing the weights or encoding policy invalidates the equivalence, so old memory must be cleared." });
  tl.tween(tableDim, 1, { at: 47.6, dur: 0.6, ease: ease.move });
  tl.tween(rightDim, 1, { at: 47.6, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_LEFT, { at: 48.3, dur: 1.4, ease: ease.move });
  tl.tween(keyU, 1, { at: 49.0, dur: 0.8, ease: ease.enter });
  tl.tween(sweepU, 1, { at: 52.8, dur: 1.6, ease: ease.move });

  // — beat 7 · bounded LRU (isolated example) —
  tl.caption({ at: 56.5, dur: 7.2, text: "The bank is bounded by entries and tensor bytes, with least recently used eviction. A miss pays the option encoding cost again." });
  tl.tween(cam, CAM_HOME3, { at: 56.3, dur: 1.3, ease: ease.move });
  tl.tween(keyU, 0, { at: 56.3, dur: 0.5, ease: ease.move });
  tl.tween(lruU, 1, { at: 56.9, dur: 0.7, ease: ease.enter });
  tl.tween(lruP, 1, { at: 58.4, dur: 1.2, ease: ease.move });
  tl.tween(lruP, 2, { at: 60.6, dur: 1.4, ease: ease.move });

  // — beat 8 · more options: linear work, bounded batches —
  tl.caption({ at: 64.5, dur: 7.2, text: "More options still require more gathering, attention, and scoring. Bounded encoding batches keep all candidates, but do not remove individual text limits." });
  tl.tween(lruU, 0, { at: 64.3, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_RIGHT, { at: 64.3, dur: 1.3, ease: ease.move });
  tl.tween(scaleU, 1, { at: 64.9, dur: 0.7, ease: ease.enter });
  tl.tween(growP, 8, { at: 66.0, dur: 2.4, ease: ease.linear });

  // — beat 9 · retrace the four reusable pieces, then close —
  tl.caption({ at: 72.5, dur: 7.2, text: "Follow the reusable pieces: encode each option, retain its memory, assemble a set, and refine a fresh request. Shared memory never means a cached answer." });
  tl.tween(scaleU, 0, { at: 72.3, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAM_HOME3, { at: 72.3, dur: 1.2, ease: ease.move });
  tl.tween(rightDim, 0, { at: 72.3, dur: 0.6, ease: ease.move });
  tl.tween(replayP, 4, { at: 72.8, dur: 4.0, ease: ease.linear });
  tl.tween(stageDim, 1, { at: 77.1, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: 77.7, dur: 0.7, ease: ease.enter });
  tl.hold(79.8, 0.2);

  return {
    tl, cam, src, frameU, heroU, reqIdx, encP, gatherP, hitU, setsN, stateP, pulseU, tableN, zoomU, twoU, keyU, sweepU,
    tableDim, rightDim, zoomDim, lruU, lruP, scaleU, growP, replayP, stageDim, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function Tile({ x, y, opt, opacity = 1, scale = 1, outline }: { x: number; y: number; opt: number; opacity?: number; scale?: number; outline?: string }) {
  if (opacity <= 0.01) return null;
  const o = OPTS[opt];
  return (
    <g opacity={opacity} transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x={0} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={8} fill={colors.PANEL} stroke={outline ?? colors.GRID} strokeWidth={outline ? 2 : 1.2} />
      <rect x={5} y={-TILE_H / 2 + 5} width={30} height={TILE_H - 10} rx={6} fill={o.color} opacity={0.9} />
      <text x={20} y={7} textAnchor="middle" fill="#08101f" fontSize={20} fontWeight={700}>
        {o.name}
      </text>
      {BLOCK_X.map((bx, b) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${b}-${c}`}
            x={bx + c * (CELL + CGAP)}
            y={-CELL / 2}
            width={CELL}
            height={CELL}
            rx={4}
            fill={b === 0 ? o.color : colors.heat(SHADES[opt][b][c])}
            opacity={b === 0 ? 0.35 + 0.6 * SHADES[opt][b][c] : 1}
          />
        )),
      )}
    </g>
  );
}

function Frame({ x, y, w, h, u, title, color = colors.GRID, titleOp = 1 }: { x: number; y: number; w: number; h: number; u: number; title: string; color?: string; titleOp?: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={`${(w + h) * 2 * u} 9999`} />
      <text x={x + 12} y={y + 20} fill={colors.MUTED} fontSize={15} fontFamily={MONO} opacity={titleOp}>
        {title}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcIdx = Math.round(s.get(scene.src));
  const frameU = s.get(scene.frameU);
  const heroU = s.get(scene.heroU);
  const reqIdx = Math.round(s.get(scene.reqIdx));
  const encP = s.get(scene.encP);
  const gatherP = s.get(scene.gatherP);
  const hitU = s.get(scene.hitU);
  const setsN = Math.round(s.get(scene.setsN));
  const stateP = s.get(scene.stateP);
  const pulseU = s.get(scene.pulseU);
  const tableN = Math.round(s.get(scene.tableN));
  const zoomU = s.get(scene.zoomU);
  const twoU = s.get(scene.twoU);
  const keyU = s.get(scene.keyU);
  const sweepU = s.get(scene.sweepU);
  const tableDim = s.get(scene.tableDim);
  const rightDim = s.get(scene.rightDim);
  const zoomDim = s.get(scene.zoomDim);
  const rightOp = (1 - 0.9 * rightDim) * (1 - 0.9 * zoomDim);
  const lruU = s.get(scene.lruU);
  const lruP = s.get(scene.lruP);
  const scaleU = s.get(scene.scaleU);
  const growP = s.get(scene.growP);
  const replayP = s.get(scene.replayP);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  const stageOp = 1 - stageDim;
  const chip = `${PIN} · ${SOURCES[Math.max(0, Math.min(SOURCES.length - 1, srcIdx))]}`;
  const chipW = chip.length * 9 + 24;

  const req = reqIdx >= 0 ? REQ[reqIdx] : [];
  const encodes = reqIdx >= 0 ? ENCODES[reqIdx] : [];
  const hit = reqIdx >= 0 && SET_HIT[reqIdx];
  const replay = replayP > 0.01;

  // which options sit in the bank right now (landed), honoring the beat-6 sweep and the beat-9 replay
  const bankOp = (opt: number): number => {
    let landed = 0;
    if (reqIdx >= 0) {
      const firstReq = ENCODES.findIndex((e) => e.includes(opt));
      if (firstReq >= 0 && firstReq < reqIdx) landed = 1;
      else if (firstReq === reqIdx) {
        const j = ENCODES[reqIdx].indexOf(opt);
        landed = clamp01((encP - j - 0.96) / 0.04);
      }
    }
    let op = landed * (1 - sweepU);
    if (replay && opt < 3) op = Math.max(op, clamp01((replayP - 1.15 - opt * 0.2) / 0.3));
    return op;
  };
  // bank slot for an option: in first-encoded order (A,B,C,D)
  const bankSlot = (opt: number) => opt;

  // encoder strips in flight for the current request
  const strips = encodes.map((opt, j) => {
    const u = clamp01(encP - j);
    const slide = clamp01(u / 0.4); // strip slides into the encoder
    const pulse = clamp01((u - 0.4) / 0.2); // encoder lights
    const fly = clamp01((u - 0.6) / 0.4); // tile flies to its bank slot
    return { opt, u, slide, pulse, fly };
  });
  const encGlow = Math.max(0, ...strips.map((st) => (st.u > 0 && st.u < 1 ? Math.sin(Math.PI * st.pulse) : 0)), replay ? clamp01(Math.sin(Math.PI * clamp01(replayP - 0.3))) : 0);

  // matrix rows: per row, flight progress from the bank slot (miss) or snapshot drop (hit)
  const rowU = (i: number) => (hit ? clamp01(gatherP) : clamp01(gatherP - i));
  const matRowOp = replay ? clamp01((replayP - 2.15) / 0.5) : 1;

  // the fresh state along the lane
  const laneP = replay ? clamp01((replayP - 3.1) / 0.7) : stateP;
  const lanePulse = replay ? clamp01((replayP - 3.75) / 0.25) : pulseU;
  const stateX = lerp(LANE.x0, LANE.x1, ease.move(laneP));
  const readout = reqIdx >= 0 ? READOUTS[reqIdx] : READOUTS[0];
  const laneOn = reqIdx >= 0 || replay;

  // beat 9 station lighting
  const station = (k: number) => (replay ? clamp01((replayP - k) * 2) * (1 - 0.55 * clamp01((replayP - k - 1.2) / 0.3)) : 0);

  // beat 7 LRU geometry (illustrative capacity 3)
  const LRU = { x: 300, y: 180, w: 680, h: 240 };
  const lruSlotX = (i: number) => LRU.x + 70 + i * 190;
  const a1 = clamp01(lruP); // access A → A moves from slot 0 to slot 2 (most recent)
  const a2 = clamp01(lruP - 1); // insert D → B evicted, remaining shift left

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ================= frames ================= */}
          <Frame x={BANK.x} y={BANK.y} w={BANK.w} h={BANK.h} u={frameU} title="_options · atomic option bank" color={station(1) > 0 ? colors.POSITIVE : colors.GRID} titleOp={1 - zoomU} />
          <g opacity={rightOp}>
            <Frame x={ENC.x} y={ENC.y} w={ENC.w} h={ENC.h} u={frameU} title="encoder" color={station(0) > 0 ? colors.POSITIVE : colors.GRID} />
            <Frame x={SETS.x} y={SETS.y} w={SETS.w} h={SETS.h} u={frameU} title="_sets · tuple snapshots" />
            <Frame x={MAT.x} y={MAT.y} w={MAT.w} h={MAT.h} u={frameU} title="assemble_option_memory" color={station(2) > 0 ? colors.POSITIVE : colors.GRID} />
          </g>
          {frameU > 0.5 && (
            <g opacity={clamp01(frameU * 2 - 1) * rightOp}>
              <text x={ENC.x + ENC.w / 2} y={ENC.y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                backbone.encode → option_proj
              </text>
              <rect x={ENC.x + 2} y={ENC.y + 2} width={ENC.w - 4} height={ENC.h - 4} rx={11} fill={colors.WARM} opacity={0.25 * encGlow} />
              {/* empty bank slots */}
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={tileX} y={bankSlotY(i) - TILE_H / 2} width={TILE_W} height={TILE_H} rx={8} fill="none" stroke={colors.GRID} strokeDasharray="4 5" opacity={0.6 * (1 - bankOp(i))} />
              ))}
              {[0, 1, 2].map((i) => (
                <rect key={i} x={matTileX} y={matRowY(i) - TILE_H / 2} width={TILE_W} height={TILE_H} rx={8} fill="none" stroke={colors.GRID} strokeDasharray="4 5" opacity={0.5} />
              ))}
              <text x={BANK.x + 12} y={BANK.y + BANK.h - 10} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={1 - zoomDim}>
                compile_option_memory → FactorizedOptionMemory
              </text>
              <text x={MAT.x + 12} y={MAT.y + MAT.h - 10} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                MatrixOptionKVCache · rows in request order
              </text>
            </g>
          )}

          {/* ================= bank tiles ================= */}
          {[0, 1, 2, 3].map((opt) => {
            const op = bankOp(opt);
            const zoom = opt === 0 ? zoomU : 0;
            return (
              <g key={opt}>
                <Tile x={tileX} y={bankSlotY(bankSlot(opt))} opt={opt} opacity={op} />
                {zoom > 0.01 && (
                  <g opacity={zoom * op}>
                    <text x={tileX + BLOCK_X[0] + 38} y={bankSlotY(0) - 26} textAnchor="middle" fill={OPTS[0].color} fontSize={8.5} fontFamily={MONO}>
                      u (normalized)
                    </text>
                    <text x={tileX + BLOCK_X[1] + 38} y={bankSlotY(0) - 26} textAnchor="middle" fill={colors.TEXT} fontSize={8.5} fontFamily={MONO}>
                      kℓ (normalized)
                    </text>
                    <text x={tileX + BLOCK_X[2] + 38} y={bankSlotY(0) - 26} textAnchor="middle" fill={colors.TEXT} fontSize={8.5} fontFamily={MONO}>
                      vℓ
                    </text>
                    {['u = normalize(option_proj h)', 'kℓ = normalize(k_proj u)', 'vℓ = v_proj u', 'per block ℓ of the stack', 'deployed: decision_depth = 1', 'stack depth configurable', 'no request, no other', 'candidate inside this entry'].map((line, li) => (
                      <text key={li} x={BANK.x - 8} y={bankSlotY(0) - 44 + li * 13} textAnchor="end" fill={li < 6 ? colors.MUTED : colors.WARM} fontSize={9} fontFamily={li < 6 ? MONO : undefined} fontStyle={li < 6 ? undefined : 'italic'}>
                        {line}
                      </text>
                    ))}
                  </g>
                )}
              </g>
            );
          })}
          {/* invalidation sweep */}
          {sweepU > 0.01 && sweepU < 0.99 && (
            <g>
              <line x1={BANK.x} y1={BANK.y + 30 + (BANK.h - 30) * sweepU} x2={BANK.x + BANK.w} y2={BANK.y + 30 + (BANK.h - 30) * sweepU} stroke={colors.NEGATIVE} strokeWidth={2.5} />
            </g>
          )}
          {sweepU > 0.2 && keyU > 0.01 && !replay && (
            <text x={BANK.x + BANK.w / 2} y={BANK.y + BANK.h / 2 + 6} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO} opacity={clamp01((sweepU - 0.2) / 0.5) * keyU}>
              weights changed → BoundedCache.clear()
            </text>
          )}

          {/* ================= strips → encoder → bank (movers) ================= */}
          {strips.map((st) => {
            if (st.u <= 0 || st.u >= 1) return null;
            const o = OPTS[st.opt];
            const sx = ENC.x + 10;
            const sy = lerp(ENC.y - 44, ENC.y + 14, ease.move(st.slide));
            const stripOp = st.pulse > 0 ? 1 - st.pulse : 1;
            const tx = lerp(ENC.x - 160, tileX, ease.move(st.fly));
            const ty = bankSlotY(bankSlot(st.opt)); // fly along its own row so no other tile is crossed
            return (
              <g key={st.opt}>
                {stripOp > 0.01 && st.fly <= 0 && (
                  <g opacity={stripOp}>
                    <rect x={sx} y={sy} width={180} height={28} rx={7} fill={colors.PANEL} stroke={o.color} strokeWidth={1.4} />
                    <text x={sx + 10} y={sy + 19} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {o.text}
                    </text>
                  </g>
                )}
                {st.fly > 0 && <Tile x={tx} y={ty} opt={st.opt} opacity={clamp01(st.fly * 3)} scale={lerp(0.5, 1, ease.move(st.fly))} />}
              </g>
            );
          })}

          {/* ================= _sets chips ================= */}
          <g opacity={rightOp}>
          {SET_CHIPS.map((label, i) => {
            const on = i < setsN;
            if (!on) return null;
            const glow = i === 0 && hitU > 0.01 ? hitU : 0;
            return (
              <g key={i}>
                <rect x={SETS.x + 14} y={setChipY(i) - 12} width={172} height={24} rx={6} fill={colors.PANEL} stroke={glow > 0 ? colors.POSITIVE : colors.GRID} strokeWidth={glow > 0 ? 2 : 1.2} />
                <rect x={SETS.x + 14} y={setChipY(i) - 12} width={172} height={24} rx={6} fill={colors.POSITIVE} opacity={0.3 * glow} />
                <text x={SETS.x + 100} y={setChipY(i) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {label}
                </text>
              </g>
            );
          })}
          {hitU > 0.01 && (
            <g opacity={hitU}>
              <line x1={SETS.x + 186} y1={setChipY(0)} x2={MAT.x} y2={matRowY(0) - 30} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="5 5" />
              <text x={SETS.x + SETS.w / 2} y={SETS.y + SETS.h + 18} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontFamily={MONO}>
                _sets.get(set_key) → hit
              </text>
              <text x={BANK.x + BANK.w / 2} y={BANK.y + BANK.h + 14} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                atomic lookup bypassed
              </text>
            </g>
          )}

          {/* ================= matrix: header + rows (movers from the bank) ================= */}
          {(reqIdx >= 0 || replay) && (
            <g>
              <text x={MAT.x + 12} y={MAT.y + 44} fill={colors.TEXT} fontSize={16} fontFamily={MONO} opacity={replay ? matRowOp : 1}>
                set_key = {replay ? '(A,B,C)' : TRACE[reqIdx].tuple}
                <tspan fill={colors.MUTED}> · request {replay ? 'n' : reqIdx + 1}</tspan>
              </text>
              {!replay && (
                <g>
                  <rect x={MAT.x + 300} y={MAT.y + 30} width={108} height={22} rx={6} fill={hit ? colors.POSITIVE : colors.NEGATIVE} opacity={0.85} />
                  <text x={MAT.x + 354} y={MAT.y + 46} textAnchor="middle" fill="#08101f" fontSize={13.5} fontWeight={700} fontFamily={MONO}>
                    _sets {hit ? 'HIT' : 'MISS'}
                  </text>
                </g>
              )}
              {(replay ? [0, 1, 2] : req).map((opt, i) => {
                const u = replay ? matRowOp : rowU(i);
                if (u <= 0.01) return null;
                if (hit && !replay) {
                  // snapshot: the whole tuple drops in from the _sets chip
                  const ty = lerp(matRowY(i) - 24, matRowY(i), ease.move(u));
                  return <Tile key={i} x={matTileX} y={ty} opt={opt} opacity={u} outline={colors.POSITIVE} />;
                }
                const fromX = tileX;
                const fromY = bankSlotY(bankSlot(opt));
                const x = replay ? matTileX : lerp(fromX, matTileX, ease.move(u));
                const y = replay ? matRowY(i) : lerp(fromY, matRowY(i), ease.move(u));
                return <Tile key={i} x={x} y={y} opt={opt} opacity={replay ? u : 0.35 + 0.65 * u} />;
              })}
              {[0, 1, 2].map((i) => (
                <text key={i} x={MAT.x + 24} y={matRowY(i) + 6} fill={colors.MUTED} fontSize={14} fontFamily={MONO} opacity={replay ? matRowOp : rowU(i)}>
                  k={i}
                </text>
              ))}
              {!replay && !hit && gatherP >= 2.95 && (
                <text x={MAT.x + 12} y={MAT.y + MAT.h + 18} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                  _options hits {TRACE[reqIdx].hits} · encoded {TRACE[reqIdx].enc} · _sets.put(set_key)
                </text>
              )}
            </g>
          )}

          {/* ================= request lane: fresh state, decision pulse, fresh readout ================= */}
          {laneOn && (
            <g>
              <text x={LANE.x0} y={LANE.y - 14} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                state x{replay ? 'ₙ' : ['₁', '₂', '₃', '₄'][reqIdx]} · encode_state_inputs → decide_from_option_cache
              </text>
              <line x1={LANE.x0} y1={LANE.y} x2={LANE.x1} y2={LANE.y} stroke={station(3) > 0 ? colors.POSITIVE : colors.GRID} strokeWidth={2} />
              {laneP > 0.001 && (
                <g>
                  <circle cx={stateX} cy={LANE.y} r={9} fill={STATE_COLOR} />
                  <text x={stateX} y={LANE.y + 26} textAnchor="middle" fill={lanePulse > 0.01 ? colors.POSITIVE : STATE_COLOR} fontSize={13} fontStyle="italic">
                    {lanePulse > 0.01 ? 'decision' : 'fresh state'}
                  </text>
                </g>
              )}
              {lanePulse > 0.01 && (
                <g>
                  <circle cx={LANE.x1} cy={LANE.y} r={9 + 26 * lanePulse} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} opacity={1 - lanePulse * 0.8} />
                  {readout.map((v, i) => (
                    <g key={i} opacity={lanePulse}>
                      <rect x={READ.x + i * (READ.w + READ.gap)} y={READ.base - v * READ.hmax * lanePulse} width={READ.w} height={v * READ.hmax * lanePulse} rx={4} fill={OPTS[replay ? i : req[i]].color} opacity={0.8} />
                      <text x={READ.x + i * (READ.w + READ.gap) + READ.w / 2} y={READ.base + 16} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                        {OPTS[replay ? i : req[i]].name} {v.toFixed(2)}
                      </text>
                    </g>
                  ))}
                  <text x={READ.x + 3 * (READ.w + READ.gap) + 6} y={READ.base - 2} fill={colors.MUTED} fontSize={12.5} fontStyle="italic" opacity={lanePulse}>
                    illustrative q · a new decision each time
                  </text>
                </g>
              )}
            </g>
          )}

          </g>

          {/* ================= beat 0 hero: two different requests, same options ================= */}
          {heroU > 0.01 && (
            <g opacity={heroU}>
              <circle cx={790} cy={462} r={9} fill={STATE_COLOR} />
              <text x={808} y={467} fill={colors.TEXT} fontSize={15}>
                x₁ · “which team?”
              </text>
              <circle cx={790} cy={498} r={9} fill={STATE_COLOR} opacity={0.6} />
              <text x={808} y={503} fill={colors.TEXT} fontSize={15}>
                x₂ · “is it urgent?”
              </text>
              <text x={808} y={530} fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
                fresh every request
              </text>
              <text x={BANK.x + BANK.w / 2} y={BANK.y + BANK.h / 2 + 6} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
                the same option texts, reusable
              </text>
            </g>
          )}
          {twoU > 0.01 && (
            <g opacity={twoU}>
              <text x={BANK.x + BANK.w / 2} y={BANK.y + BANK.h + 14} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                per option · ready for any combination
              </text>
              <text x={SETS.x + SETS.w / 2} y={SETS.y + SETS.h + 18} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                per ordered tuple
              </text>
            </g>
          )}

          {/* ================= trace table ================= */}
          {tableN > 0 && (
            <g opacity={(1 - 0.9 * tableDim) * (1 - 0.9 * zoomDim)}>
              <text x={TABLE.x} y={TABLE.y + 16} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                illustrative cache trace · no timings, no token counts
              </text>
              {['req', 'tuple', '_sets', '_options hits', 'encoded'].map((h, c) => (
                <text key={c} x={TCOL[c]} y={TABLE.y + 38} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO} opacity={0.85}>
                  {h}
                </text>
              ))}
              {TRACE.slice(0, tableN).map((r, i) => (
                <g key={i}>
                  <text x={TCOL[0]} y={tableRowY(i)} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    {i + 1}
                  </text>
                  <text x={TCOL[1]} y={tableRowY(i)} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    {r.tuple}
                  </text>
                  <text x={TCOL[2]} y={tableRowY(i)} fill={r.sets === 'HIT' ? colors.POSITIVE : colors.NEGATIVE} fontSize={13.5} fontFamily={MONO}>
                    {r.sets}
                  </text>
                  <text x={TCOL[3]} y={tableRowY(i)} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    {r.hits}
                  </text>
                  <text x={TCOL[4]} y={tableRowY(i)} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    {r.enc}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ================= beat 6: cache identity panel (opaque) ================= */}
          {keyU > 0.01 && (
            <g opacity={keyU}>
              <rect x={480} y={170} width={520} height={250} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={500} y={198} fill={colors.TEXT} fontSize={18} fontWeight={650}>
                cache identity · key = tuple(input_ids)
              </text>
              <text x={500} y={224} fill={colors.MUTED} fontSize={13.5} fontFamily={MONO}>
                option_text(“A”, “choice”) → “Option for choice: A”
              </text>
              {TOKEN_IDS[0].map((id, i) => (
                <g key={i}>
                  <rect x={500 + i * 60} y={238} width={54} height={28} rx={5} fill={colors.PANEL} stroke={OPTS[0].color} strokeWidth={1.2} />
                  <text x={527 + i * 60} y={257} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                    {id}
                  </text>
                </g>
              ))}
              <text x={500 + 6 * 60 + 4} y={257} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                …
              </text>
              <text x={500} y={290} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                set_key = (tuple(ids_A), tuple(ids_B), tuple(ids_C)) · ordered
              </text>
              <rect x={500} y={306} width={480} height={48} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={512} y={326} fill={colors.WARM} fontSize={13.5} fontWeight={600}>
                equivalence boundary
              </text>
              <text x={512} y={344} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                fixed weights + tokenizer + templates + length/numeric policy
              </text>
              <text x={500} y={380} fill={colors.MUTED} fontSize={13}>
                a change outside that boundary makes old entries wrong, not stale:
              </text>
              <text x={500} y={400} fill={colors.MUTED} fontSize={13}>
                clearing is the caller's job; the runtime does not detect it for you
              </text>
            </g>
          )}

          {/* ================= beat 7: bounded LRU (opaque focus panel) ================= */}
          {lruU > 0.01 && (
            <g opacity={lruU}>
              <rect x={LRU.x} y={LRU.y} width={LRU.w} height={LRU.h} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={LRU.x + 20} y={LRU.y + 30} fill={colors.TEXT} fontSize={18} fontWeight={650}>
                BoundedCache · illustrative capacity 3
              </text>
              <text x={LRU.x + 20} y={LRU.y + 52} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                entries ≤ max_entries · bytes ≤ max_bytes · OrderedDict, oldest first
              </text>
              {/* three slots, least recent on the left */}
              {[0, 1, 2].map((i) => (
                <rect key={i} x={lruSlotX(i) - 60} y={LRU.y + 90} width={160} height={44} rx={8} fill="none" stroke={colors.GRID} strokeDasharray="4 5" />
              ))}
              <text x={lruSlotX(0) + 20} y={LRU.y + 80} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                least recent
              </text>
              <text x={lruSlotX(2) + 20} y={LRU.y + 80} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                most recent
              </text>
              {(() => {
                // phase 1: [A,B,C] → access A → [B,C,A]; phase 2: put D → evict B → [C,A,D]
                const posA = lerp(lerp(0, 2, a1), 1, a2);
                const posB = lerp(lerp(1, 0, a1), -0.3, a2);
                const posC = lerp(lerp(2, 1, a1), 0, a2);
                const posD = 2;
                const chipAt = (p: number, opt: number, op: number) => (
                  <g key={opt} opacity={op}>
                    <rect x={lruSlotX(p) - 52} y={LRU.y + 96} width={144} height={32} rx={7} fill={OPTS[opt].color} opacity={0.85} />
                    <text x={lruSlotX(p) + 20} y={LRU.y + 118} textAnchor="middle" fill="#08101f" fontSize={16} fontWeight={700}>
                      {OPTS[opt].name} memory
                    </text>
                  </g>
                );
                return (
                  <>
                    {chipAt(posA, 0, 1)}
                    {chipAt(posB, 1, 1 - a2)}
                    {chipAt(posC, 2, 1)}
                    {a2 > 0.01 && chipAt(posD, 3, a2)}
                  </>
                );
              })()}
              <text x={LRU.x + 20} y={LRU.y + 168} fill={a1 > 0.1 && a2 < 0.1 ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO}>
                get(key_A) → hit · move_to_end(key_A)
              </text>
              <text x={LRU.x + 20} y={LRU.y + 192} fill={a2 > 0.1 ? colors.TEXT : colors.MUTED} fontSize={14} fontFamily={MONO}>
                put(key_D) → over capacity → popitem(last=False) evicts B
              </text>
              <text x={LRU.x + 20} y={LRU.y + 222} fill={colors.NEGATIVE} fontSize={13.5} opacity={clamp01(a2 * 2)}>
                the next request naming B misses → B is encoded again (the option encoding cost returns)
              </text>
            </g>
          )}

          {/* ================= beat 8: linear scaling, bounded batches (opaque panel) ================= */}
          {scaleU > 0.01 && (
            <g opacity={scaleU}>
              <rect x={300} y={176} width={860} height={420} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={320} y={204} fill={colors.TEXT} fontSize={18} fontWeight={650}>
                K candidates → K rows · all of them reach the head
              </text>
              {(() => {
                const K = 8;
                const rowH = 30;
                const y0 = 228;
                const shown = growP;
                const out = [] as ReactNode[];
                for (let i = 0; i < K; i++) {
                  const u = clamp01(shown - i);
                  if (u <= 0.01) continue;
                  const y = y0 + i * (rowH + 6);
                  const opt = i % 4;
                  out.push(
                    <g key={i} opacity={u}>
                      <rect x={420} y={y} width={300} height={rowH} rx={6} fill={colors.PANEL} stroke={OPTS[opt].color} strokeWidth={1.2} />
                      <text x={432} y={y + 20} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        option {i + 1} · u, kℓ, vℓ
                      </text>
                    </g>,
                  );
                }
                return out;
              })()}
              {/* encoder chunk brackets */}
              {[0, 1].map((c) => {
                const rowsIn = clamp01((growP - c * 4) / 4);
                if (rowsIn <= 0.01) return null;
                const y0 = 228 + c * 4 * 36;
                const h = Math.max(4, Math.min(4, Math.ceil(rowsIn * 4)) * 36 - 6);
                return (
                  <g key={c} opacity={rowsIn}>
                    <path d={`M 410 ${y0} h -10 v ${h} h 10`} fill="none" stroke={colors.WARM} strokeWidth={2} />
                    <text x={392} y={y0 + h / 2 + 4} textAnchor="end" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
                      batch {c + 1}
                    </text>
                  </g>
                );
              })}
              <text x={320} y={540} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                _encode_options: ≤ option_chunk_size rows and ≤ option_batch_tokens padded tokens per batch
              </text>
              <text x={320} y={560} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                max_option_length still bounds each single text · cache max_bytes ≠ all device memory
              </text>
              {/* head-work rail ∝ K */}
              <text x={760} y={240} fill={colors.TEXT} fontSize={14}>
                head work per request ∝ K
              </text>
              <text x={760} y={258} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                gather + attention + scoring · O(L(d² + Kd + df))
              </text>
              <rect x={760} y={270} width={360} height={18} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={760} y={270} width={(360 * Math.max(0, growP)) / 8} height={18} rx={5} fill={colors.ACCENT} opacity={0.8} />
              <text x={760} y={308} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                K = {Math.round(growP)} · no K×K interaction matrix is stored
              </text>
              <text x={760} y={350} fill={colors.TEXT} fontSize={14}>
                no fixed label vocabulary
              </text>
              <text x={760} y={370} fill={colors.MUTED} fontSize={12.5}>
                a new option costs encoding and projection, not new output parameters
              </text>
              <text x={760} y={410} fill={colors.TEXT} fontSize={14}>
                no joint token window
              </text>
              <text x={760} y={430} fill={colors.MUTED} fontSize={12.5}>
                each text has its own encoder length budget
              </text>
            </g>
          )}

          {/* ================= beat 9: station labels ================= */}
          {replay &&
            [
              { k: 0, x: ENC.x + ENC.w / 2, y: ENC.y - 14, t: '1 · encode each option' },
              { k: 1, x: BANK.x + BANK.w / 2, y: BANK.y - 14, t: '2 · retain u / K / V' },
              { k: 2, x: MAT.x + MAT.w / 2, y: MAT.y - 14, t: '3 · assemble a set' },
              { k: 3, x: (LANE.x0 + LANE.x1) / 2, y: READ.base + 40, t: '4 · refine a fresh request' },
            ].map((st) => (
              <text key={st.k} x={st.x} y={st.y} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={650} opacity={station(st.k)}>
                {st.t}
              </text>
            ))}
        </g>

        {/* ================= closing panel ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={250} y={250} width={780} height={230} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={322} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={650}>
              Reuse memory.
            </text>
            <text x={640} y={366} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={650}>
              Recompute judgment.
            </text>
            <text x={640} y={420} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              shared option memory is never a cached answer
            </text>
          </g>
        )}
      </Camera>

      {/* ================= screen-space header: title + source chip ================= */}
      <text x={640} y={38} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650} opacity={1 - 0.6 * stageDim}>
        Reuse the options, decide again
      </text>
      <g opacity={1 - 0.6 * stageDim}>
        <rect x={640 - chipW / 2} y={66} width={chipW} height={26} rx={7} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
          {chip}
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
