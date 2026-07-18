// Explained: Inference — chapter 2: the KV cache. A real toy attention layer
// (d=8, seeded weights) computes key/value rows per token at module scope —
// the cache on screen IS those computed values. Then the honest byte
// arithmetic at 7B scale: 32 layers × 2 (K+V) × 4096 hidden × 2 bytes =
// 512 KB per token; a 4096-token context = 2 GB; 32 such streams = 64 GB,
// 4.6× the 14 GB of weights. GQA with 4-way sharing → 128 KB/token, 16 GB.
// Without a cache, step n redoes all prior projections: at n=2048 the
// average step costs (n+1)/2 ≈ 1024× the cached step. All computed below.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The toy attention layer, actually computed at module scope.
// ---------------------------------------------------------------------------

const D = 8; // toy model width
const T = 8; // tokens generated
const rand = mulberry32(42);
const mat = (r: number, c: number) =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => rand() * 2 - 1));
const Wk = mat(D, D);
const Wv = mat(D, D);
const X = mat(T, D); // token activations

const matVec = (M: number[][], v: number[]) =>
  M.map((row) => row.reduce((a, m, j) => a + m * v[j], 0));

// K[t] and V[t] — computed once; deterministic, so recomputing them at any
// later step yields byte-identical rows. That fact IS the cache's license.
const K = X.map((x) => matVec(Wk, x));
const V = X.map((x) => matVec(Wv, x));

// normalize to 0..1 for the heatmap
const norm01 = (rows: number[][]) => {
  const lo = Math.min(...rows.flat());
  const hi = Math.max(...rows.flat());
  return rows.map((r) => r.map((v) => (v - lo) / (hi - lo)));
};
const K01 = norm01(K);
const V01 = norm01(V);

// ---------------------------------------------------------------------------
// The 7B-scale byte arithmetic.
// ---------------------------------------------------------------------------

const LAYERS = 32;
const HIDDEN = 4096;
const BYTES = 2; // fp16
const KV_PER_TOKEN = LAYERS * 2 * HIDDEN * BYTES; // 524,288 B = 512 KB
const KV_KB = KV_PER_TOKEN / 1024; // 512
const CTX = 4096;
const CACHE_GB = (KV_PER_TOKEN * CTX) / 2 ** 30; // 2 GB
const BATCH = 32;
const BATCH_GB = CACHE_GB * BATCH; // 64 GB
const WEIGHTS_GB = 14;
const RATIO = BATCH_GB / WEIGHTS_GB; // ≈ 4.57
const GQA_SHARE = 4; // 32 query heads, 8 kv heads
const GQA_KB = KV_KB / GQA_SHARE; // 128
const GQA_BATCH_GB = BATCH_GB / GQA_SHARE; // 16
const RECOMPUTE_FACTOR = (2048 + 1) / 2; // 1024.5×

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const CELL = 26;
const GAP = 3;
const K_X = 170;
const V_X = 470;
const GRID_Y = 200;

const BAR_X = scaleLinear().domain([0, 70]).range([180, 1120]);

const CAM_GRIDS: CameraState = { x: 470, y: 330, k: 1.25 };
const CAM_BARS: CameraState = { x: 640, y: 470, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  gridU: ChannelRef<number>; // frame + labels for the two caches
  fillT: ChannelRef<number>; // tokens appended so far, 0..T
  reuseU: ChannelRef<number>; // highlight sweep over old rows
  quadU: ChannelRef<number>; // the no-cache cost note
  bytesU: ChannelRef<number>; // per-token arithmetic panel
  barU: ChannelRef<number>; // weights vs cache bars
  gqaU: ChannelRef<number>; // GQA beat
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const gridU = tl.channel('gridU', 0);
  const fillT = tl.channel('fillT', 0);
  const reuseU = tl.channel('reuseU', 0);
  const quadU = tl.channel('quadU', 0);
  const bytesU = tl.channel('bytesU', 0);
  const barU = tl.channel('barU', 0);
  const gqaU = tl.channel('gqaU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — attention needs the past
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Last chapter left decode paying a full fourteen gigabyte sweep per token. There is a second bill, and it grows: attention needs the past.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.8,
    text: 'To score a new token against its history, every layer needs a key and a value for every token that came before. Those are honest computations — multiply each past activation by two learned matrices.',
  });
  tl.tween(cam, CAM_GRIDS, { at: 6.9, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 7.5, dur: 1.2, ease: ease.draw });
  tl.hold(12.3, 0.6);

  // Beat 2 — the cache fills, computed for real
  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'Here is the crucial property: do that multiplication once and the answer never changes. So we keep it. Watch a real toy layer run — eight tokens, and each one appends its key row and its value row.',
  });
  tl.tween(fillT, T, { at: 14.0, dur: 5.5, ease: ease.linear });
  tl.caption({
    at: 19.3,
    dur: 5.4,
    text: 'Nothing above the new row is ever touched again. Every value on screen was computed exactly once — the grid is the memory of the conversation, growing one row per token.',
  });
  tl.tween(reuseU, 1, { at: 20.2, dur: 3.0, ease: ease.linear });
  tl.caption({
    at: 25.1,
    dur: 5.6,
    text: 'Without the cache, each step would redo every projection before it. Averaged over a two thousand token generation, that is about a thousand times the work per step. The cache converts a quadratic past into a linear one.',
  });
  tl.tween(quadU, 1, { at: 26.0, dur: 0.9, ease: ease.enter });
  tl.hold(30.9, 0.7);

  // Beat 3 — the price at 7B scale
  tl.caption({
    at: 31.6,
    dur: 6.2,
    text: 'The price is memory, and it is not small. At seven billion scale: thirty two layers, keys plus values, a hidden width of four thousand ninety six, two bytes each. Five hundred twelve kilobytes for every token you keep.',
  });
  tl.tween(cam, CAM_BARS, { at: 31.8, dur: 1.5, ease: ease.move });
  tl.tween(bytesU, 1, { at: 33.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 38.2,
    dur: 5.6,
    text: 'A four thousand token conversation carries a two gigabyte cache. That is one context, for one user. Serve thirty two of them and the caches take sixty four gigabytes — over four times the weights themselves.',
  });
  tl.tween(barU, 1, { at: 39.4, dur: 3.2, ease: ease.draw });
  tl.caption({
    at: 44.2,
    dur: 4.8,
    text: 'Read that bar again: the model is the small block. The cache, not the weights, is what fills the card and caps how many conversations fit.',
  });
  tl.hold(49.0, 0.6);

  // Beat 4 — GQA shrinks it
  tl.caption({
    at: 49.6,
    dur: 6.2,
    text: 'So modern architectures shrink the cache at the source. Grouped query attention lets four query heads share one key value head: five hundred twelve kilobytes per token drops to one hundred twenty eight, and sixty four gigabytes drops to sixteen.',
  });
  tl.tween(gqaU, 1, { at: 50.8, dur: 2.2, ease: ease.move });
  tl.hold(55.8, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 56.4,
    dur: 5.8,
    text: 'The cache is the first great trade of inference: spend memory to never recompute the past. Its size now decides how many streams share the chip — which is exactly where batching, next chapter, begins.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 56.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 57.2, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 58.2, dur: 0.9, ease: ease.enter });
  tl.hold(62.2, 1.2);

  return { tl, cam, titleU, gridU, fillT, reuseU, quadU, bytesU, barU, gqaU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/inference-kv-cache/overrides.json',
  slug: 'inference-kv-cache',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const gridU = s.get(scene.gridU);
  const fillT = s.get(scene.fillT);
  const reuseU = s.get(scene.reuseU);
  const quadU = s.get(scene.quadU);
  const bytesU = s.get(scene.bytesU);
  const barU = s.get(scene.barU);
  const gqaU = s.get(scene.gqaU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // rows appear one token at a time; within a row, cells stagger left→right
  const cellU = (i: number, j: number) => clamp01((fillT - i) * D - j);
  // the reuse sweep highlights already-written rows, oldest first
  const sweepRow = Math.floor(reuseU * T);

  const weightsW = BAR_X(WEIGHTS_GB) - BAR_X(0);
  const cacheW = (BAR_X(BATCH_GB) - BAR_X(0)) * barU;
  const gqaW = (BAR_X(GQA_BATCH_GB) - BAR_X(0)) * gqaU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the two cache grids — real computed K and V rows */}
          <g opacity={gridU}>
            <text x={K_X} y={GRID_Y - 40} fill={colors.TEXT} fontSize={17}>
              the key cache
            </text>
            <text x={K_X} y={GRID_Y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
              K[t] = W_k · x[t]
            </text>
            <text x={V_X} y={GRID_Y - 40} fill={colors.TEXT} fontSize={17}>
              the value cache
            </text>
            <text x={V_X} y={GRID_Y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
              V[t] = W_v · x[t]
            </text>
            <MatrixGrid x={K_X} y={GRID_Y} values={K01} cell={CELL} gap={GAP} cellU={cellU} />
            <MatrixGrid x={V_X} y={GRID_Y} values={V01} cell={CELL} gap={GAP} cellU={cellU} />
            {/* token pointer */}
            {fillT > 0 && fillT < T && (
              <text
                x={K_X - 16}
                y={GRID_Y + (Math.min(T - 1, Math.floor(fillT)) + 0.5) * (CELL + GAP) + 5}
                textAnchor="end"
                fill={colors.ACCENT}
                fontSize={13}
                fontFamily="monospace"
              >
                token {Math.min(T, Math.ceil(fillT))} ▸
              </text>
            )}
            {/* reuse sweep: old rows glow, proving they are read, not rebuilt */}
            {reuseU > 0 && reuseU < 1 && sweepRow < T && (
              <rect
                x={K_X - 6}
                y={GRID_Y + sweepRow * (CELL + GAP) - 3}
                width={V_X - K_X + D * (CELL + GAP) + 9}
                height={CELL + 6}
                rx={4}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={2}
                opacity={0.8}
              />
            )}
            <text
              x={K_X}
              y={GRID_Y + T * (CELL + GAP) + 26}
              fill={colors.POSITIVE}
              fontSize={13}
              opacity={reuseU > 0 ? 1 : 0}
            >
              written once · read every step after
            </text>
          </g>

          {/* the no-cache cost */}
          {quadU > 0 && (
            <g opacity={quadU}>
              <text x={800} y={250} fill={colors.TEXT} fontSize={15}>
                without the cache
              </text>
              <text x={800} y={282} fill={colors.NEGATIVE} fontSize={19} fontFamily="monospace" fontWeight={700}>
                ~{Math.round(RECOMPUTE_FACTOR)}× the work
              </text>
              <text x={800} y={308} fill={colors.MUTED} fontSize={13}>
                per step, averaged over 2048 tokens
              </text>
            </g>
          )}

          {/* the byte arithmetic */}
          {bytesU > 0 && (
            <g opacity={bytesU}>
              <text x={180} y={430} fill={colors.TEXT} fontSize={16}>
                the cache bill at 7B
              </text>
              <text x={180} y={462} fill={colors.WARM} fontSize={19} fontFamily="monospace" fontWeight={700}>
                {LAYERS} layers × 2 × {HIDDEN} × {BYTES} B = {KV_KB.toFixed(0)} KB / token
              </text>
              <text x={180} y={490} fill={colors.MUTED} fontSize={14}>
                {CTX.toLocaleString()}-token context → {CACHE_GB.toFixed(0)} GB per stream
              </text>
            </g>
          )}

          {/* weights vs batch cache bars */}
          {barU > 0 && (
            <g opacity={Math.min(1, barU * 2)}>
              <rect x={BAR_X(0)} y={530} width={weightsW} height={22} rx={4} fill={colors.SECONDARY} opacity={0.7} />
              <text x={BAR_X(0) + 8} y={546} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                weights {WEIGHTS_GB} GB
              </text>
              <rect x={BAR_X(0)} y={562} width={Math.max(2, cacheW)} height={22} rx={4} fill={colors.NEGATIVE} opacity={0.85} />
              <text x={BAR_X(0) + Math.max(2, cacheW) + 10} y={578} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                KV cache, {BATCH} streams: {(BATCH_GB * barU).toFixed(0)} GB ({RATIO.toFixed(1)}× the weights)
              </text>
              {gqaU > 0 && (
                <g opacity={gqaU}>
                  <rect x={BAR_X(0)} y={594} width={Math.max(2, gqaW)} height={22} rx={4} fill={colors.POSITIVE} opacity={0.85} />
                  <text x={BAR_X(0) + Math.max(2, gqaW) + 10} y={610} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                    with GQA (4 heads share 1 KV): {GQA_KB.toFixed(0)} KB/token → {GQA_BATCH_GB.toFixed(0)} GB
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The cache that remembers the conversation
        </text>
      </g>
      <MathLabel
        tex="\text{cache} = 2 \cdot L \cdot d \cdot \text{bytes} \cdot n_{\text{tokens}}"
        x={860}
        y={54}
        fontSize={19}
        color={colors.SECONDARY}
        opacity={bytesU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Spend memory to never redo the past.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            512 KB/token · 2 GB per 4k stream · 64 GB at batch 32 —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the cache, not the model, decides how many users fit.
          </text>
        </g>
      )}
    </>
  );
}

export function InferenceKvCache() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
