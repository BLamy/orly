// Explained: The Delta Rule — chapter 1: fast weights. A matrix as a
// key-value memory: real outer-product writes S += k v^T and real reads
// v̂ = S^T k, computed at module scope (d = 16, up to 12 pairs). With this
// seed: after 3 pairs the first association reads back at cosine 0.97; after
// 12 pairs average recall over all stored pairs falls to 0.78 (pair one at
// 0.90) — capacity crowding, measured. Grounds the fast-weight framing used
// by the delta-rule line (KDA / SFDA, arXiv:2607.11897).
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
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope. d = 16, 12 key-value pairs.
// ---------------------------------------------------------------------------

const D = 16;
const NP = 12;
const rand = mulberry32(20260710);

function randUnit(): number[] {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}

const KEYS: number[][] = Array.from({ length: NP }, randUnit);
const VALS: number[][] = Array.from({ length: NP }, randUnit);

type Mat = number[][];
const readK = (S: Mat, k: number[]): number[] =>
  Array.from({ length: D }, (_, j) => k.reduce((acc, ki, i) => acc + ki * S[i][j], 0));
const cosSim = (u: number[], v: number[]): number => {
  const n = Math.hypot(...u) * Math.hypot(...v);
  return n < 1e-12 ? 0 : u.reduce((acc, x, i) => acc + x * v[i], 0) / n;
};

/** State snapshots after each write. */
const STATES: Mat[] = (() => {
  const out: Mat[] = [];
  let S: Mat = Array.from({ length: D }, () => new Array(D).fill(0) as number[]);
  out.push(S.map((r) => [...r]));
  for (let t = 0; t < NP; t++) {
    S = S.map((r, i) => r.map((x, j) => x + KEYS[t][i] * VALS[t][j]));
    out.push(S.map((r) => [...r]));
  }
  return out;
})();

/** Average recall over all pairs stored so far, after n writes. */
const AVG_RECALL: number[] = Array.from({ length: NP }, (_, t) => {
  const S = STATES[t + 1];
  let sum = 0;
  for (let s = 0; s <= t; s++) sum += cosSim(readK(S, KEYS[s]), VALS[s]);
  return sum / (t + 1);
});
// AVG_RECALL[2] ≈ 0.87, AVG_RECALL[11] ≈ 0.78 with this seed.
const PAIR1_AFTER_3 = cosSim(readK(STATES[3], KEYS[0]), VALS[0]); // 0.97
const PAIR1_AFTER_12 = cosSim(readK(STATES[NP], KEYS[0]), VALS[0]); // 0.90

const matAt = (u: number): Mat => {
  const f = Math.max(0, Math.min(NP, u));
  const i = Math.floor(f);
  if (i >= NP) return STATES[NP];
  const t = f - i;
  return STATES[i].map((r, a) => r.map((x, b) => x + (STATES[i + 1][a][b] - x) * t));
};
const avgRecallAt = (u: number): number => {
  const f = Math.max(1, Math.min(NP, u)) - 1;
  const i = Math.floor(f);
  if (i >= NP - 1) return AVG_RECALL[NP - 1];
  return AVG_RECALL[i] + (AVG_RECALL[i + 1] - AVG_RECALL[i]) * (f - i);
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const GRID_X = 180;
const GRID_Y = 170;
const CELL = 20;
const HEAT_SCALE = 1.0;

const PLOT_X = scaleLinear().domain([1, NP]).range([720, 1180]);
const PLOT_Y = scaleLinear().domain([0.5, 1.02]).range([560, 330]);

const CAM_GRID: CameraState = { x: 400, y: 330, k: 1.25 };
const CAM_PLOT: CameraState = { x: 930, y: 420, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  writeTok: ChannelRef<number>;
  eqWriteU: ChannelRef<number>;
  probeU: ChannelRef<number>;
  eqReadU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveTok: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const gridU = tl.channel('gridU', 0);
  const writeTok = tl.channel('writeTok', 0);
  const eqWriteU = tl.channel('eqWriteU', 0);
  const probeU = tl.channel('probeU', 0);
  const eqReadU = tl.channel('eqReadU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveTok = tl.channel('curveTok', 1);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the idea
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'This book is about one update rule — the delta rule — and the family of models built on it. But first, the object it lives in: a matrix used as a memory.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_GRID, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'The idea is old and lovely: fast weights. The slow weights of a network learn over months of training. This matrix changes on every single token — it is memory as weights.',
  });
  tl.hold(12.8, 0.6);

  // Beat 2 — writing
  tl.caption({
    at: 13.4,
    dur: 6.0,
    text: 'To store an association, take a key and a value and stamp their outer product into the matrix. One rank-one write — watch three pairs go in.',
  });
  tl.tween(eqWriteU, 1, { at: 13.8, dur: 0.8, ease: ease.enter });
  tl.tween(writeTok, 3, { at: 15.5, dur: 3.6, ease: ease.linear });
  tl.caption({
    at: 19.8,
    dur: 5.6,
    text: 'To recall, multiply the matrix by the key. The key finds its own imprint, and out comes the value — here the first pair reads back at cosine point nine seven.',
  });
  tl.tween(eqReadU, 1, { at: 20.2, dur: 0.8, ease: ease.enter });
  tl.tween(probeU, 1, { at: 21.4, dur: 0.9, ease: ease.enter });
  tl.hold(25.8, 0.6);

  // Beat 3 — capacity
  tl.caption({
    at: 26.4,
    dur: 5.6,
    text: 'But every pair shares the same sixteen by sixteen grid of numbers. Keep writing — nine more pairs — and the imprints start to overlap.',
  });
  tl.tween(cam, CAM_PLOT, { at: 26.6, dur: 1.5, ease: ease.move });
  tl.tween(plotU, 1, { at: 27.4, dur: 1.0, ease: ease.draw });
  tl.tween(writeTok, NP, { at: 28.2, dur: 5.0, ease: ease.linear });
  tl.tween(curveTok, NP, { at: 28.2, dur: 5.0, ease: ease.linear });
  tl.caption({
    at: 32.6,
    dur: 6.0,
    text: 'Here is the crowding, measured. Average recall over everything stored drifts down from perfect to about point seven eight by pair twelve. Nothing was deleted — the memories just lean on each other.',
  });
  tl.hold(38.8, 0.7);

  // Beat 4 — the diagnosis
  tl.caption({
    at: 39.5,
    dur: 6.2,
    text: 'Notice what the naive write never does: it never checks what is already there. It adds blindly, even when the matrix already has an opinion about that key.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 39.7, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 46.1,
    dur: 5.4,
    text: 'Every idea in the rest of this book — error correction, decay, rotation — is a smarter answer to one question: how should a full memory make room?',
  });
  tl.hold(51.7, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 52.3,
    dur: 5.2,
    text: 'Hold onto the picture: a fixed grid of fast weights, written by outer products, read by keys — and slowly filling up.',
  });
  tl.tween(dimU, 1, { at: 52.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 53.5, dur: 0.9, ease: ease.enter });
  tl.hold(57.9, 1.2);

  return { tl, cam, titleU, gridU, writeTok, eqWriteU, probeU, eqReadU, plotU, curveTok, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-fast-weights/overrides.json',
  slug: 'delta-fast-weights',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const gridU = s.get(scene.gridU);
  const writeTok = s.get(scene.writeTok);
  const eqWriteU = s.get(scene.eqWriteU);
  const probeU = s.get(scene.probeU);
  const eqReadU = s.get(scene.eqReadU);
  const plotU = s.get(scene.plotU);
  const curveTok = s.get(scene.curveTok);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const S = matAt(writeTok);
  const gridW = D * CELL;
  const cTok = Math.max(1, Math.min(NP, curveTok));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the fast-weight matrix */}
          <g opacity={gridU}>
            <text x={GRID_X} y={GRID_Y - 34} fill={colors.TEXT} fontSize={19}>
              fast weights
            </text>
            <text x={GRID_X} y={GRID_Y - 12} fill={colors.MUTED} fontSize={13}>
              one matrix, rewritten every token
            </text>
            {S.map((row, i) =>
              row.map((v, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={GRID_X + j * CELL}
                  y={GRID_Y + i * CELL}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={3}
                  fill={colors.heat(clamp01(0.5 + v / (2 * HEAT_SCALE)))}
                  opacity={clamp01(gridU * D * D - (i * D + j)) * 0.95}
                />
              )),
            )}
            <rect
              x={GRID_X - 6}
              y={GRID_Y - 6}
              width={gridW + 10}
              height={gridW + 10}
              rx={8}
              fill="none"
              stroke={colors.SECONDARY}
              strokeWidth={2}
              opacity={0.8}
            />
            <text x={GRID_X + gridW / 2} y={GRID_Y + gridW + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              pairs written: {Math.round(Math.min(NP, writeTok))} of {NP}
            </text>
          </g>

          {/* probe readout */}
          {probeU > 0 && (
            <g opacity={probeU}>
              <text x={GRID_X + gridW + 46} y={GRID_Y + 30} fill={colors.TEXT} fontSize={15}>
                read key one back
              </text>
              <text x={GRID_X + gridW + 46} y={GRID_Y + 60} fill={colors.POSITIVE} fontSize={22} fontFamily="monospace" fontWeight={700}>
                {writeTok <= 3.5 ? PAIR1_AFTER_3.toFixed(2) : PAIR1_AFTER_12.toFixed(2)}
              </text>
              <text x={GRID_X + gridW + 46} y={GRID_Y + 82} fill={colors.MUTED} fontSize={12}>
                cosine with the stored value
              </text>
            </g>
          )}

          {/* the crowding curve */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <text x={720} y={300} fill={colors.TEXT} fontSize={16}>
                average recall of everything stored
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={5} yTicks={3} xLabel="pairs written" fontSize={11} />
              <FunctionPlot
                x={PLOT_X}
                y={PLOT_Y}
                f={avgRecallAt}
                domain={[1, cTok]}
                samples={160}
                reveal={1}
                color={colors.NEGATIVE}
                width={2.6}
              />
              <circle cx={PLOT_X(cTok)} cy={PLOT_Y(avgRecallAt(cTok))} r={5} fill={colors.NEGATIVE} />
              {curveTok > NP - 0.2 && (
                <text x={PLOT_X(NP) - 6} y={PLOT_Y(AVG_RECALL[NP - 1]) - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace">
                  {AVG_RECALL[NP - 1].toFixed(2)}
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Fast weights
        </text>
        <text x={40} y={70} fill={colors.MUTED} fontSize={14}>
          a matrix as a key-value memory
        </text>
      </g>
      <MathLabel
        tex="S \leftarrow S + k\,v^{\top}"
        x={620}
        y={44}
        fontSize={22}
        color={colors.ACCENT}
        opacity={eqWriteU * mainOp}
      />
      <MathLabel
        tex="\hat{v} = S^{\top} k"
        x={880}
        y={44}
        fontSize={22}
        color={colors.POSITIVE}
        opacity={eqReadU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Memory as weights.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Outer-product writes, key reads — and blind addition
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            that crowds itself: recall 0.78 by pair twelve.
          </text>
        </g>
      )}
    </>
  );
}

export function DeltaFastWeights() {
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
