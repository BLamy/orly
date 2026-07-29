// Explained: Hybrid Attention — chapter 1: the two memories, recapped in one
// beat each. A real 48-step stream feeds both memories at module scope: the
// KV cache is literally the list of tokens (exact recall at any lag, zero
// error, but it grows one slot per token); the recurrent state is a real
// N = 6 diagonal recurrence whose recall error is MEASURED by least-squares
// readout — about 2% for the present, about 21% eight steps back, about 37%
// twenty steps back. Bridges to Explained: State-Space Models and Explained:
// The Delta Rule without re-teaching them.
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
// Real math, module scope. One input stream, two memories.
// ---------------------------------------------------------------------------

const N = 6;
const T = 48;
const rand = mulberry32(20260717);

const X: number[] = Array.from(
  { length: T },
  (_, t) =>
    Math.sin(t * 0.31) * 0.7 +
    Math.sin(t * 0.13 + 0.7) * 0.5 +
    (t > 30 && t < 36 ? 0.8 : 0),
);

const A: number[] = Array.from({ length: N }, (_, i) => Math.exp(-(0.05 + 0.16 * i)));
const B: number[] = Array.from({ length: N }, () => rand() * 0.8 + 0.2);

const H: number[][] = (() => {
  const out: number[][] = [];
  let h = new Array(N).fill(0) as number[];
  for (let t = 0; t < T; t++) {
    h = h.map((hi, i) => A[i] * hi + B[i] * X[t]);
    out.push([...h]);
  }
  return out;
})();

function solveSym(G: number[][], b: number[]): number[] {
  const n = b.length;
  const M = G.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (p !== c) {
      const tmp = M[c];
      M[c] = M[p];
      M[p] = tmp;
    }
    const piv = M[c][c];
    for (let k = c; k <= n; k++) M[c][k] /= piv;
    for (let r = 0; r < n; r++)
      if (r !== c && M[r][c] !== 0) {
        const f = M[r][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
  }
  return M.map((r) => r[n]);
}

/** Relative error of the best linear readout of the state predicting x_{t-lag}. */
function fitLagErr(lag: number): number {
  const G = Array.from({ length: N }, () => new Array(N).fill(0) as number[]);
  const b = new Array(N).fill(0) as number[];
  for (let t = lag; t < T; t++) {
    const r = H[t];
    const y = X[t - lag];
    for (let i = 0; i < N; i++) {
      b[i] += r[i] * y;
      for (let j = 0; j < N; j++) G[i][j] += r[i] * r[j];
    }
  }
  for (let i = 0; i < N; i++) G[i][i] += 1e-8;
  const C = solveSym(G, b);
  let se = 0;
  let sy = 0;
  for (let t = lag; t < T; t++) {
    const p = C.reduce((acc, c, i) => acc + c * H[t][i], 0);
    se += (p - X[t - lag]) ** 2;
    sy += X[t - lag] ** 2;
  }
  return Math.sqrt(se / sy);
}

/** Measured recall-error curve for the recurrent state, lags 0..20. */
const LAGS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const STATE_ERR: number[] = LAGS.map(fitLagErr); // ≈ [0.019, 0.134, 0.161, …, 0.371]
const ERR_AT = (lag: number): number => {
  const u = Math.max(0, Math.min(20, lag)) / 2;
  const i = Math.floor(u);
  if (i >= LAGS.length - 1) return STATE_ERR[LAGS.length - 1];
  return STATE_ERR[i] + (STATE_ERR[i + 1] - STATE_ERR[i]) * (u - i);
};
// caption checks: ERR_AT(0)≈0.019 "two percent", ERR_AT(8)≈0.208 "about a
// fifth", ERR_AT(20)≈0.371 "over a third".

const xAt = (u: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return X[T - 1];
  return X[i] + (X[i + 1] - X[i]) * (f - i);
};
const hAt = (u: number, ch: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return H[T - 1][ch];
  return H[i][ch] + (H[i + 1][ch] - H[i][ch]) * (f - i);
};

// ---------------------------------------------------------------------------
// Stage layout. Top: the shared input stream. Left column: the KV cache shelf
// growing one cell per token. Right column: the fixed six-number state.
// Bottom: the measured recall-error comparison.
// ---------------------------------------------------------------------------

const SIG_X = scaleLinear().domain([0, T - 1]).range([160, 1120]);
const SIG_Y = scaleLinear().domain([-1.6, 2.0]).range([220, 90]);

// KV shelf: 48 cells, 12 per row, growing downward
const KV_X0 = 150;
const KV_Y0 = 290;
const KV_W = 26;
const KV_H = 22;
const KV_COLS = 12;

// state bars
const BAR_X = 830;
const BAR_TOP = 278;
const BAR_H = 26;
const BAR_SCALE = 30;

// error plot (bottom band, above caption strip)
const ERR_X = scaleLinear().domain([0, 20]).range([680, 1150]);
const ERR_Y = scaleLinear().domain([0, 0.45]).range([600, 460]);

const CAM_KV: CameraState = { x: 330, y: 380, k: 1.35 };
const CAM_STATE: CameraState = { x: 950, y: 360, k: 1.35 };

const CH_COLORS = [
  colors.ACCENT,
  colors.TEAL,
  colors.POSITIVE,
  colors.WARM,
  colors.SECONDARY,
  colors.NEGATIVE,
];

// ---------------------------------------------------------------------------
// Timeline — captions are the narration script.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  tok: ChannelRef<number>;
  kvU: ChannelRef<number>;
  stU: ChannelRef<number>;
  probeU: ChannelRef<number>;
  errU: ChannelRef<number>;
  errSweep: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const tok = tl.channel('tok', 0);
  const kvU = tl.channel('kvU', 0);
  const stU = tl.channel('stU', 0);
  const probeU = tl.channel('probeU', 0);
  const errU = tl.channel('errU', 0);
  const errSweep = tl.channel('errSweep', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — one stream, two memories
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'A transformer that mixes layer types keeps two very different memories of the same stream. Here are forty eight tokens arriving, and both memories watching them.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(kvU, 1, { at: 2.2, dur: 0.8, ease: ease.enter });
  tl.tween(stU, 1, { at: 3.0, dur: 0.8, ease: ease.enter });
  tl.tween(tok, T - 1, { at: 1.0, dur: 9.0, ease: ease.linear });

  // Beat 2 — the KV cache, one beat
  tl.caption({
    at: 7.0,
    dur: 5.8,
    text: 'The first memory is the attention layer’s key value cache. It writes down every token, verbatim, one new slot per step. Recall is exact at any distance — and the shelf never stops growing.',
  });
  tl.tween(cam, CAM_KV, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.hold(13.0, 0.6);

  // Beat 3 — the recurrent state, one beat
  tl.caption({
    at: 13.6,
    dur: 6.0,
    text: 'The second memory is a recurrent state — the kind a state space layer or a delta rule layer keeps. Six numbers, updated in place. It never grows, and it never remembers anything exactly.',
  });
  tl.tween(cam, CAM_STATE, { at: 13.8, dur: 1.4, ease: ease.move });
  tl.set(tok, 0, 14.2);
  tl.tween(tok, T - 1, { at: 14.4, dur: 5.0, ease: ease.linear });
  tl.hold(19.8, 0.6);

  // Beat 4 — the probe: measure recall from each
  tl.caption({
    at: 20.4,
    dur: 5.6,
    text: 'Let us probe both. Ask each memory what the input was, some number of steps ago, and measure the error of the best possible readout.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 20.6, dur: 1.4, ease: ease.move });
  tl.tween(probeU, 1, { at: 21.6, dur: 0.9, ease: ease.enter });
  tl.tween(errU, 1, { at: 22.4, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 26.4,
    dur: 5.8,
    text: 'The cache is a flat line at zero — the token is sitting right there in its slot. The state starts near two percent error and decays: about a fifth of the signal gone at eight steps, over a third at twenty.',
  });
  tl.tween(errSweep, 1, { at: 26.8, dur: 4.6, ease: ease.move });
  tl.hold(32.6, 0.7);

  // Beat 5 — the price tags
  tl.caption({
    at: 33.3,
    dur: 6.0,
    text: 'Each memory has a price tag. The exact one costs memory and compute that grow with every token you keep. The lossy one costs a fixed handful of numbers, forever.',
  });
  tl.hold(39.5, 0.6);

  // Beat 6 — the question of the book
  tl.caption({
    at: 40.1,
    dur: 5.8,
    text: 'For years the field treated this as a choice: transformers on one side, recurrent models on the other. Frontier models quietly stopped choosing.',
  });
  tl.tween(dimU, 1, { at: 40.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 46.3,
    dur: 5.6,
    text: 'They interleave the two: a few exact attention layers stacked among many cheap recurrent ones. This book is about that mixture — what each layer type is actually for, and how much of each to buy.',
  });
  tl.hold(52.2, 1.2);

  return { tl, cam, titleU, tok, kvU, stU, probeU, errU, errSweep, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/hybrid-two-memories/overrides.json',
  slug: 'hybrid-two-memories',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const tok = Math.max(0.6, s.get(scene.tok));
  const kvU = s.get(scene.kvU);
  const stU = s.get(scene.stU);
  const probeU = s.get(scene.probeU);
  const errU = s.get(scene.errU);
  const errSweep = s.get(scene.errSweep);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const nTok = Math.floor(tok) + 1;
  const sweepLag = errSweep * 20;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the shared input stream */}
          <g opacity={titleU}>
            <text x={160} y={64} fill={colors.TEXT} fontSize={19}>
              one stream of tokens
            </text>
            <Axes x={SIG_X} y={SIG_Y} reveal={clamp01(titleU)} xTicks={6} yTicks={2} xLabel="step" fontSize={11} />
            <FunctionPlot
              x={SIG_X}
              y={SIG_Y}
              f={xAt}
              domain={[0, tok]}
              samples={200}
              reveal={1}
              color={colors.ACCENT}
              width={2.2}
            />
            <circle cx={SIG_X(tok)} cy={SIG_Y(xAt(tok))} r={5} fill={colors.ACCENT} />
          </g>

          {/* memory 1: the KV cache shelf */}
          <g opacity={kvU}>
            <text x={KV_X0} y={KV_Y0 - 22} fill={colors.TEXT} fontSize={18}>
              memory one: the KV cache
            </text>
            {Array.from({ length: T }, (_, i) => {
              const on = i < nTok;
              const row = Math.floor(i / KV_COLS);
              const col = i % KV_COLS;
              return (
                <rect
                  key={i}
                  x={KV_X0 + col * (KV_W + 4)}
                  y={KV_Y0 + row * (KV_H + 5)}
                  width={KV_W}
                  height={KV_H}
                  rx={3}
                  fill={on ? colors.ACCENT : colors.PANEL}
                  opacity={on ? 0.4 + 0.5 * Math.min(1, Math.abs(X[i])) : 0.35}
                  stroke={colors.GRID}
                  strokeWidth={0.6}
                />
              );
            })}
            <text x={KV_X0} y={KV_Y0 + 4 * (KV_H + 5) + 22} fill={colors.MUTED} fontSize={13}>
              {nTok} slots and counting — one per token
            </text>
          </g>

          {/* memory 2: the fixed state */}
          <g opacity={stU}>
            <text x={BAR_X - 20} y={KV_Y0 - 22} fill={colors.TEXT} fontSize={18}>
              memory two: a fixed state
            </text>
            {Array.from({ length: N }, (_, i) => {
              const v = hAt(tok, i);
              const w = Math.abs(v) * BAR_SCALE;
              return (
                <g key={i}>
                  <line
                    x1={BAR_X + 80}
                    y1={BAR_TOP + i * BAR_H}
                    x2={BAR_X + 80}
                    y2={BAR_TOP + i * BAR_H + BAR_H - 7}
                    stroke={colors.GRID}
                    strokeWidth={1}
                  />
                  <rect
                    x={v >= 0 ? BAR_X + 80 : BAR_X + 80 - w}
                    y={BAR_TOP + i * BAR_H}
                    width={Math.max(0.5, w)}
                    height={BAR_H - 7}
                    rx={3}
                    fill={CH_COLORS[i]}
                    opacity={0.85}
                  />
                  <text
                    x={BAR_X}
                    y={BAR_TOP + i * BAR_H + 14}
                    fill={colors.MUTED}
                    fontSize={11}
                    fontFamily="monospace"
                  >
                    h{i + 1} {hAt(tok, i).toFixed(2)}
                  </text>
                </g>
              );
            })}
            <text x={1150} y={BAR_TOP + N * BAR_H + 25} textAnchor="end" fill={colors.SECONDARY} fontSize={13}>
              six numbers, whatever T is
            </text>
          </g>

          {/* the probe: recall error vs lag */}
          {probeU > 0 && (
            <g opacity={probeU}>
              <text x={680} y={438} fill={colors.TEXT} fontSize={16}>
                recall error, probing each memory
              </text>
              <Axes
                x={ERR_X}
                y={ERR_Y}
                reveal={errU}
                xTicks={4}
                yTicks={3}
                xLabel="steps into the past"
                fontSize={11}
              />
              {/* KV cache: exactly zero at every lag */}
              <FunctionPlot
                x={ERR_X}
                y={ERR_Y}
                f={() => 0}
                domain={[0, sweepLag < 0.5 ? 20 : 20]}
                samples={40}
                reveal={errU}
                color={colors.ACCENT}
                width={2.6}
              />
              {/* recurrent state: the measured error curve */}
              <FunctionPlot
                x={ERR_X}
                y={ERR_Y}
                f={ERR_AT}
                domain={[0, Math.max(0.6, sweepLag)]}
                samples={120}
                reveal={errU}
                color={colors.WARM}
                width={2.6}
              />
              {errSweep > 0.02 && (
                <>
                  <circle cx={ERR_X(sweepLag)} cy={ERR_Y(ERR_AT(sweepLag))} r={5} fill={colors.WARM} />
                  <text
                    x={ERR_X(sweepLag) + 10}
                    y={ERR_Y(ERR_AT(sweepLag)) - 10}
                    fill={colors.WARM}
                    fontSize={13}
                    fontWeight={600}
                  >
                    {(ERR_AT(sweepLag) * 100).toFixed(0)}%
                  </text>
                </>
              )}
              <text x={ERR_X(20) + 8} y={ERR_Y(0) + 4} fill={colors.ACCENT} fontSize={12}>
                cache: 0%
              </text>
            </g>
          )}

          {/* price tags under each memory once the probe exists */}
          {probeU > 0 && (
            <g opacity={probeU}>
              <text x={KV_X0} y={470} fill={colors.ACCENT} fontSize={14}>
                exact — but memory grows with T
              </text>
              <MathLabel tex="O(T)" x={KV_X0 + 8} y={505} fontSize={19} color={colors.ACCENT} opacity={probeU} />
              <text x={KV_X0} y={560} fill={colors.WARM} fontSize={14}>
                lossy — but the state is constant
              </text>
              <MathLabel tex="O(1)" x={KV_X0 + 8} y={595} fontSize={19} color={colors.WARM} opacity={probeU} />
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The two memories
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={220} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Frontier models stopped choosing.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            A few exact, growing attention layers —
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            interleaved among many cheap, fixed-state recurrent ones.
          </text>
        </g>
      )}
    </>
  );
}

export function HybridTwoMemories() {
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
