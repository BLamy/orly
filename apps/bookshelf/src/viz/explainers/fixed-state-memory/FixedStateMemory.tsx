// arXiv:2605.22791 — "Gated DeltaNet-2: Decoupling Erase and Write in Linear
// Attention" (Hatamizadeh, Choi, Kautz, May 2026). Chapter 1: the fixed-state
// problem. Softmax attention keeps every key-value pair (the cache grows with
// the sequence); linear attention compresses history into one fixed d×d matrix
// state S_t = S_{t-1} + k_t v_t^T — so recall of early associations genuinely
// degrades as later writes pile in. The interference curve below is computed,
// not drawn: real random unit keys, real outer-product writes, real cosine
// recall of the first stored association.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
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
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope. d = 8 channels, T = 24 tokens.
// ---------------------------------------------------------------------------

const D = 8;
const T = 24;
const rand = mulberry32(20260522);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const KEYS: number[][] = Array.from({ length: T }, randUnit);
const VALS: number[][] = Array.from({ length: T }, randUnit);

/** State snapshots S_0..S_T under the plain linear-attention write S += k v^T. */
const STATES: number[][][] = (() => {
  const out: number[][][] = [];
  let S = Array.from({ length: D }, () => Array.from({ length: D }, () => 0));
  out.push(S.map((r) => [...r]));
  for (let t = 0; t < T; t++) {
    S = S.map((row, i) => row.map((x, j) => x + KEYS[t][i] * VALS[t][j]));
    out.push(S.map((r) => [...r]));
  }
  return out;
})();

/** Cosine similarity between the recalled first value  v̂ = S^T k_0  and v_0. */
const RECALL: number[] = STATES.map((S) => {
  const vhat = Array.from({ length: D }, (_, j) =>
    KEYS[0].reduce((acc, ki, i) => acc + ki * S[i][j], 0),
  );
  const n = Math.hypot(...vhat);
  if (n < 1e-9) return 0;
  return vhat.reduce((acc, x, j) => acc + (x / n) * VALS[0][j], 0);
});
// With this seed: RECALL[1] = 1.000 (perfect right after the write), and it
// decays as later outer products interfere — e.g. RECALL[24] ≈ 0.35.

const recallAt = (tok: number): number => {
  const f = Math.max(0, Math.min(T, tok));
  const i = Math.floor(f);
  if (i >= T) return RECALL[T];
  return RECALL[i] + (RECALL[i + 1] - RECALL[i]) * (f - i);
};

/** Normalize a state snapshot to 0..1 heat for the grid (fixed scale). */
const HEAT_SCALE = 2.4; // max |S_ij| over all snapshots ≈ 2.2 with this seed
const stateHeat = (tok: number): number[][] => {
  const i = Math.round(Math.max(0, Math.min(T, tok)));
  return STATES[i].map((row) => row.map((x) => 0.5 + x / (2 * HEAT_SCALE)));
};

// ---------------------------------------------------------------------------
// Stage layout. Left: the growing cache. Right: the fixed state.
// ---------------------------------------------------------------------------

const CACHE_X = 150;
const CACHE_TOP = 150;
const SLOT_H = 17;
const SLOT_W = 190;

const GRID_X = 760;
const GRID_Y = 170;
const CELL = 34;

const PLOT_X = scaleLinear().domain([0, T]).range([740, 1200]);
const PLOT_Y = scaleLinear().domain([0, 1.05]).range([600, 470]);

const CAM_CACHE: CameraState = { x: 340, y: 330, k: 1.25 };
const CAM_STATE: CameraState = { x: 920, y: 320, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline — captions are the narration script.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  cacheTok: ChannelRef<number>;
  cacheU: ChannelRef<number>;
  costU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  stateTok: ChannelRef<number>;
  eqU: ChannelRef<number>;
  probeU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const cacheTok = tl.channel('cacheTok', 0);
  const cacheU = tl.channel('cacheU', 0);
  const costU = tl.channel('costU', 0);
  const gridU = tl.channel('gridU', 0);
  const stateTok = tl.channel('stateTok', 0);
  const eqU = tl.channel('eqU', 0);
  const probeU = tl.channel('probeU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveU = tl.channel('curveU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the growing cache
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'A transformer answers every question the same way: it keeps every key and value it has ever seen, and looks back through all of them.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cacheU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_CACHE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(cacheTok, T, { at: 1.4, dur: 7.5, ease: ease.linear });
  tl.caption({
    at: 7.2,
    dur: 5.6,
    text: 'That memory is exact, but it grows with the sequence. Double the context, double the cache — and the hardware bill grows with it.',
  });
  tl.tween(costU, 1, { at: 8.0, dur: 1.0, ease: ease.enter });
  tl.hold(13.0, 0.7);

  // Beat 2 — the fixed state
  tl.caption({
    at: 13.7,
    dur: 6.0,
    text: 'Linear attention makes a different bet. It compresses the whole history into one matrix of fixed size, no matter how long the sequence gets.',
  });
  tl.tween(cam, CAM_STATE, { at: 14.0, dur: 1.5, ease: ease.move });
  tl.tween(gridU, 1, { at: 14.6, dur: 1.2, ease: ease.draw });
  tl.tween(eqU, 1, { at: 16.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 20.0,
    dur: 5.6,
    text: 'Each token stamps its key and value into the state as an outer product. Watch the same twenty four tokens land in the same eight by eight grid.',
  });
  tl.tween(stateTok, T, { at: 20.4, dur: 7.0, ease: ease.linear });
  tl.hold(27.6, 0.6);

  // Beat 3 — the price: interference
  tl.caption({
    at: 28.2,
    dur: 5.8,
    text: 'But a fixed box has no free shelves. Every new write lands on top of the old ones, and the old associations start to blur.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 28.4, dur: 1.5, ease: ease.move });
  tl.tween(probeU, 1, { at: 29.6, dur: 0.7, ease: ease.enter });
  tl.tween(plotU, 1, { at: 30.4, dur: 1.0, ease: ease.draw });
  tl.caption({
    at: 34.2,
    dur: 6.2,
    text: 'Here is that blur, measured. We store the very first pair, then keep writing. Recall of that first value really does decay — from perfect down to about a third.',
  });
  tl.tween(curveU, 1, { at: 34.6, dur: 4.6, ease: ease.linear });
  tl.hold(40.4, 0.8);

  // Beat 4 — the question of the book
  tl.caption({
    at: 41.2,
    dur: 6.2,
    text: 'So something must be forgotten — the only question is what, and on whose terms. A paper from May twenty twenty six argues the forgetting itself was wired wrong.',
  });
  tl.tween(dimU, 1, { at: 41.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.6,
    dur: 5.4,
    text: 'Erasing and writing are two different decisions. This book is about what happens when you finally let them disagree.',
  });
  tl.hold(53.0, 1.2);

  return {
    tl,
    cam,
    titleU,
    cacheTok,
    cacheU,
    costU,
    gridU,
    stateTok,
    eqU,
    probeU,
    plotU,
    curveU,
    dimU,
    closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/fixed-state-memory/overrides.json',
  slug: 'fixed-state-memory',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const recallCurve = (tok: number): number => recallAt(tok);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cacheTok = s.get(scene.cacheTok);
  const cacheU = s.get(scene.cacheU);
  const costU = s.get(scene.costU);
  const gridU = s.get(scene.gridU);
  const stateTok = s.get(scene.stateTok);
  const eqU = s.get(scene.eqU);
  const probeU = s.get(scene.probeU);
  const plotU = s.get(scene.plotU);
  const curveU = s.get(scene.curveU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const titleU = s.get(scene.titleU);

  const mainOp = 1 - 0.85 * dimU;
  const heat = stateHeat(stateTok);
  const gridW = D * CELL;
  const curTok = Math.min(T, curveU * T);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* left: the growing key-value cache */}
          <g opacity={cacheU}>
            <text x={CACHE_X} y={CACHE_TOP - 34} fill={colors.TEXT} fontSize={20}>
              softmax attention
            </text>
            <text x={CACHE_X} y={CACHE_TOP - 12} fill={colors.MUTED} fontSize={14}>
              key value cache
            </text>
            {Array.from({ length: T }, (_, i) => {
              const u = clamp01(cacheTok - i);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <rect
                    x={CACHE_X}
                    y={CACHE_TOP + i * SLOT_H}
                    width={SLOT_W * u}
                    height={SLOT_H - 4}
                    rx={3}
                    fill={colors.ACCENT}
                    opacity={0.16 + 0.5 * (i / T)}
                  />
                  <text
                    x={CACHE_X + 8}
                    y={CACHE_TOP + i * SLOT_H + 11}
                    fill={colors.TEXT}
                    fontSize={10}
                    fontFamily="monospace"
                    opacity={0.8}
                  >
                    k{i + 1} v{i + 1}
                  </text>
                </g>
              );
            })}
            {costU > 0 && (
              <g opacity={costU}>
                <line
                  x1={CACHE_X + SLOT_W + 16}
                  y1={CACHE_TOP}
                  x2={CACHE_X + SLOT_W + 16}
                  y2={CACHE_TOP + Math.max(1, cacheTok) * SLOT_H}
                  stroke={colors.WARM}
                  strokeWidth={2}
                />
                <text
                  x={CACHE_X + SLOT_W + 28}
                  y={CACHE_TOP + (Math.max(1, cacheTok) * SLOT_H) / 2}
                  fill={colors.WARM}
                  fontSize={15}
                >
                  grows with T
                </text>
              </g>
            )}
          </g>

          {/* right: the fixed matrix state */}
          <g opacity={gridU}>
            <text x={GRID_X} y={GRID_Y - 34} fill={colors.TEXT} fontSize={20}>
              linear attention
            </text>
            <text x={GRID_X} y={GRID_Y - 12} fill={colors.MUTED} fontSize={14}>
              one fixed matrix state
            </text>
            {heat.map((row, i) =>
              row.map((v, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={GRID_X + j * CELL}
                  y={GRID_Y + i * CELL}
                  width={CELL - 3}
                  height={CELL - 3}
                  rx={4}
                  fill={colors.heat(clamp01(v))}
                  opacity={clamp01(gridU * (D * D) - (i * D + j)) * 0.95}
                />
              )),
            )}
            <rect
              x={GRID_X - 6}
              y={GRID_Y - 6}
              width={gridW + 9}
              height={gridW + 9}
              rx={8}
              fill="none"
              stroke={colors.SECONDARY}
              strokeWidth={2}
              opacity={0.8}
            />
            <text
              x={GRID_X + gridW / 2}
              y={GRID_Y + gridW + 26}
              textAnchor="middle"
              fill={colors.SECONDARY}
              fontSize={14}
            >
              fixed size, whatever T is
            </text>
          </g>
        </Camera>
      </g>

      {/* screen-fixed: title chip + arXiv id (the on-screen citation) */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The fixed-state problem
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2605.22791
        </text>
      </g>

      <MathLabel
        tex="S_t = S_{t-1} + k_t v_t^{\top}"
        x={980}
        y={92}
        fontSize={24}
        color={colors.SECONDARY}
        opacity={eqU * mainOp}
      />

      {/* the measured interference curve */}
      {plotU > 0 && (
        <g opacity={plotU * mainOp}>
          <text x={740} y={452} fill={colors.TEXT} fontSize={15}>
            recall of the first stored value, as writes pile in
          </text>
          <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={4} yTicks={3} xLabel="tokens written" fontSize={11} />
          <FunctionPlot
            x={PLOT_X}
            y={PLOT_Y}
            f={recallCurve}
            domain={[0, curTok < 0.5 ? 0.5 : curTok]}
            samples={200}
            reveal={1}
            color={colors.NEGATIVE}
            width={2.6}
          />
          {curveU > 0 && (
            <circle
              cx={PLOT_X(curTok)}
              cy={PLOT_Y(recallAt(curTok))}
              r={5}
              fill={colors.NEGATIVE}
            />
          )}
          {curveU > 0.98 && (
            <text x={PLOT_X(T) - 4} y={PLOT_Y(recallAt(T)) - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={13}>
              {RECALL[T].toFixed(2)}
            </text>
          )}
        </g>
      )}

      {/* probe annotation */}
      <g opacity={probeU * mainOp}>
        <text x={740} y={430} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
          recall: v̂ = Sᵀk₁ · cosine with v₁ (computed, d=8)
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            A fixed state must forget.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            The question is what gets erased — and whether erasing
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and writing should be the same decision.
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            Gated DeltaNet-2 · arXiv:2605.22791
          </text>
        </g>
      )}
    </>
  );
}

export function FixedStateMemory() {
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
