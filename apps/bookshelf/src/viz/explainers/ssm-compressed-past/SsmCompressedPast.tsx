// Explained: State-Space Models — chapter 1: the recurrent state as a
// compressed past. A real diagonal linear SSM (h_t = A h_{t-1} + B x_t,
// N = 6 channels) is actually run over a 48-step signal at module scope.
// The reconstruction beat is genuine least squares: a linear readout of the
// six state numbers recovers the present input to ~2% relative error, the
// input four steps ago to ~17%, and twelve steps ago to ~33% — the fading
// memory is measured, not drawn.
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
// Real math, module scope. N = 6 state channels, T = 48 steps.
// ---------------------------------------------------------------------------

const N = 6;
const T = 48;
const rand = mulberry32(20260701);

/** The input signal: two sines plus a bump — something with structure. */
const X: number[] = Array.from(
  { length: T },
  (_, t) =>
    Math.sin(t * 0.35) * 0.8 +
    Math.sin(t * 0.11 + 1.2) * 0.5 +
    (t > 28 && t < 34 ? 0.9 : 0),
);

/** Diagonal SSM: six decay rates from slow to fast. */
const LAMBDA: number[] = Array.from({ length: N }, (_, i) => 0.05 + 0.16 * i);
const A: number[] = LAMBDA.map((l) => Math.exp(-l));
const B: number[] = Array.from({ length: N }, () => rand() * 0.8 + 0.2);

/** State trajectory H[t] — the six numbers after step t. */
const H: number[][] = (() => {
  const out: number[][] = [];
  let h = new Array(N).fill(0) as number[];
  for (let t = 0; t < T; t++) {
    h = h.map((hi, i) => A[i] * hi + B[i] * X[t]);
    out.push([...h]);
  }
  return out;
})();

/** Gauss–Jordan solve for the least-squares readouts. */
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

/** Fit a linear readout of the state predicting x_{t-lag}; return weights + relative error. */
function fitLag(lag: number): { C: number[]; err: number; pred: number[] } {
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
  const pred: number[] = new Array(T).fill(0);
  for (let t = lag; t < T; t++) {
    const p = C.reduce((acc, c, i) => acc + c * H[t][i], 0);
    pred[t] = p;
    se += (p - X[t - lag]) ** 2;
    sy += X[t - lag] ** 2;
  }
  return { C, err: Math.sqrt(se / sy), pred };
}

const FIT0 = fitLag(0); // err ≈ 0.022 → "about two percent"
const FIT4 = fitLag(4); // err ≈ 0.173 → "about seventeen percent"
const FIT12 = fitLag(12); // err ≈ 0.332 → "about a third"

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
const predAt = (fit: { pred: number[] }, lag: number) => (u: number): number => {
  const f = Math.max(lag, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return fit.pred[T - 1];
  return fit.pred[i] + (fit.pred[i + 1] - fit.pred[i]) * (f - i);
};

// ---------------------------------------------------------------------------
// Stage layout. Top: signal plot. Right middle: the six state bars.
// Bottom-left of midline: the memory kernels.
// ---------------------------------------------------------------------------

const SIG_X = scaleLinear().domain([0, T - 1]).range([110, 780]);
const SIG_Y = scaleLinear().domain([-1.6, 2.1]).range([320, 90]);

const BAR_X = 900;
const BAR_TOP = 110;
const BAR_H = 30;
const BAR_SCALE = 34; // px per unit of state

const KER_X = scaleLinear().domain([0, 20]).range([140, 560]);
const KER_Y = scaleLinear().domain([0, 1]).range([600, 430]);

const REC_Y = scaleLinear().domain([-1.6, 2.1]).range([600, 400]);

const CAM_STATE: CameraState = { x: 920, y: 240, k: 1.35 };
const CAM_KER: CameraState = { x: 380, y: 490, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline — captions are the narration script.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  sigTok: ChannelRef<number>;
  barsU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  kerU: ChannelRef<number>;
  recU: ChannelRef<number>;
  recLag: ChannelRef<number>; // 0 → present fit, 1 → lag-4 fit, 2 → lag-12 fit
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const sigTok = tl.channel('sigTok', 0);
  const barsU = tl.channel('barsU', 0);
  const eqU = tl.channel('eqU', 0);
  const kerU = tl.channel('kerU', 0);
  const recU = tl.channel('recU', 0);
  const recLag = tl.channel('recLag', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the problem: history keeps arriving
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Here is a signal arriving one step at a time — forty eight steps of it. A model that wants to use this history has to keep it somewhere.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(sigTok, T - 1, { at: 0.8, dur: 8.5, ease: ease.linear });
  tl.caption({
    at: 7.0,
    dur: 5.2,
    text: 'A transformer keeps all of it, verbatim. A state-space model makes a stranger promise: it will remember the whole past in just six numbers.',
  });
  tl.tween(barsU, 1, { at: 9.4, dur: 0.9, ease: ease.enter });
  tl.hold(12.6, 0.6);

  // Beat 2 — the recurrence
  tl.caption({
    at: 13.2,
    dur: 6.2,
    text: 'The rule is one line. At every step, each of the six numbers decays a little, then absorbs a share of the new input. That is the entire memory system.',
  });
  tl.tween(cam, CAM_STATE, { at: 13.4, dur: 1.4, ease: ease.move });
  tl.tween(eqU, 1, { at: 15.0, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 19.8,
    dur: 5.6,
    text: 'Watch the six numbers move as the signal replays. They never grow in count. However long the sequence runs, the state stays exactly this size.',
  });
  tl.set(sigTok, 0, 20.0);
  tl.tween(sigTok, T - 1, { at: 20.2, dur: 6.5, ease: ease.linear });
  tl.hold(27.0, 0.6);

  // Beat 3 — what the six numbers are: exponential windows
  tl.caption({
    at: 27.6,
    dur: 6.0,
    text: 'What do the six numbers actually hold? Each one is a weighted average of the past with its own horizon — one forgets in a few steps, one holds on for dozens.',
  });
  tl.tween(cam, CAM_KER, { at: 27.8, dur: 1.5, ease: ease.move });
  tl.tween(kerU, 1, { at: 28.6, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 34.2,
    dur: 4.8,
    text: 'Together they are a bank of overlapping windows onto the history — a lossy recording, taken at six different speeds.',
  });
  tl.hold(39.2, 0.6);

  // Beat 4 — the measurement: reconstruct the past from the state
  tl.caption({
    at: 39.8,
    dur: 5.8,
    text: 'Lossy how, exactly? Let us measure it. From just the six numbers, a fixed linear readout tries to reconstruct what the input was.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.0, dur: 1.5, ease: ease.move });
  tl.tween(kerU, 0.12, { at: 40.2, dur: 1.0, ease: ease.move });
  tl.tween(recU, 1, { at: 41.4, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 46.0,
    dur: 5.6,
    text: 'The present is easy: the readout recovers the current input to about two percent error. The orange curve sits right on top of the truth.',
  });
  tl.caption({
    at: 52.0,
    dur: 6.2,
    text: 'Ask for the input four steps ago and the error grows to about seventeen percent. Twelve steps back, about a third of the signal is simply gone.',
  });
  tl.tween(recLag, 1, { at: 52.4, dur: 1.2, ease: ease.move });
  tl.tween(recLag, 2, { at: 55.6, dur: 1.2, ease: ease.move });
  tl.hold(58.4, 0.8);

  // Beat 5 — the bet
  tl.caption({
    at: 59.2,
    dur: 6.0,
    text: 'That is the state-space bet: trade a perfect, ever-growing record for a fixed-size summary that fades gracefully with distance.',
  });
  tl.tween(dimU, 1, { at: 59.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 65.6,
    dur: 5.4,
    text: 'But this model fades everything at the same fixed rates, no matter what the input says. The next chapter is about letting the input decide.',
  });
  tl.hold(71.0, 1.2);

  return { tl, cam, titleU, sigTok, barsU, eqU, kerU, recU, recLag, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/ssm-compressed-past/overrides.json',
  slug: 'ssm-compressed-past',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const CH_COLORS = [
  colors.ACCENT,
  colors.TEAL,
  colors.POSITIVE,
  colors.WARM,
  colors.SECONDARY,
  colors.NEGATIVE,
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const sigTok = s.get(scene.sigTok);
  const barsU = s.get(scene.barsU);
  const eqU = s.get(scene.eqU);
  const kerU = s.get(scene.kerU);
  const recU = s.get(scene.recU);
  const recLag = s.get(scene.recLag);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const tok = Math.max(0.6, sigTok);

  // which reconstruction is showing: blend between the three fits
  const lagLabel = recLag < 0.5 ? 'now' : recLag < 1.5 ? '4 steps ago' : '12 steps ago';
  const errLabel = recLag < 0.5
    ? `${(FIT0.err * 100).toFixed(0)}% error`
    : recLag < 1.5
      ? `${(FIT4.err * 100).toFixed(0)}% error`
      : `${(FIT12.err * 100).toFixed(0)}% error`;
  const activeFit = recLag < 0.5 ? FIT0 : recLag < 1.5 ? FIT4 : FIT12;
  const activeLag = recLag < 0.5 ? 0 : recLag < 1.5 ? 4 : 12;
  const predF = predAt(activeFit, activeLag);
  const truthF = (u: number) => xAt(u - activeLag);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the input signal */}
          <g>
            <text x={110} y={64} fill={colors.TEXT} fontSize={20}>
              the input signal
            </text>
            <Axes x={SIG_X} y={SIG_Y} reveal={clamp01(titleU)} xTicks={6} yTicks={3} xLabel="step" fontSize={11} />
            <FunctionPlot
              x={SIG_X}
              y={SIG_Y}
              f={xAt}
              domain={[0, tok]}
              samples={200}
              reveal={1}
              color={colors.ACCENT}
              width={2.4}
            />
            <circle cx={SIG_X(tok)} cy={SIG_Y(xAt(tok))} r={5} fill={colors.ACCENT} />
          </g>

          {/* the six state bars */}
          <g opacity={barsU}>
            <text x={BAR_X} y={BAR_TOP - 26} fill={colors.TEXT} fontSize={18}>
              the state: six numbers
            </text>
            {Array.from({ length: N }, (_, i) => {
              const v = hAt(tok, i);
              const w = Math.abs(v) * BAR_SCALE;
              return (
                <g key={i}>
                  <line
                    x1={BAR_X + 90}
                    y1={BAR_TOP + i * BAR_H}
                    x2={BAR_X + 90}
                    y2={BAR_TOP + i * BAR_H + BAR_H - 8}
                    stroke={colors.GRID}
                    strokeWidth={1}
                  />
                  <rect
                    x={v >= 0 ? BAR_X + 90 : BAR_X + 90 - w}
                    y={BAR_TOP + i * BAR_H}
                    width={Math.max(0.5, w)}
                    height={BAR_H - 8}
                    rx={3}
                    fill={CH_COLORS[i]}
                    opacity={0.85}
                  />
                  <text
                    x={BAR_X}
                    y={BAR_TOP + i * BAR_H + 15}
                    fill={colors.MUTED}
                    fontSize={12}
                    fontFamily="monospace"
                  >
                    h{i + 1} {hAt(tok, i).toFixed(2)}
                  </text>
                </g>
              );
            })}
            <text x={BAR_X} y={BAR_TOP + N * BAR_H + 18} fill={colors.SECONDARY} fontSize={13}>
              fixed size, whatever T is
            </text>
          </g>

          {/* the memory kernels */}
          <g opacity={kerU}>
            <text x={140} y={408} fill={colors.TEXT} fontSize={17}>
              what each number remembers
            </text>
            <Axes x={KER_X} y={KER_Y} reveal={kerU} xTicks={4} yTicks={2} xLabel="steps into the past" fontSize={11} />
            {Array.from({ length: N }, (_, i) => (
              <FunctionPlot
                key={i}
                x={KER_X}
                y={KER_Y}
                f={(j) => Math.pow(A[i], j) * B[i]}
                domain={[0, 20]}
                samples={120}
                reveal={kerU}
                color={CH_COLORS[i]}
                width={2}
              />
            ))}
          </g>

          {/* the reconstruction */}
          {recU > 0 && (
            <g opacity={recU * (1 - kerU * 0.0)}>
              <text x={640} y={408} fill={colors.TEXT} fontSize={17}>
                reconstructed from the state: input {lagLabel}
              </text>
              <Axes
                x={scaleLinear().domain([0, T - 1]).range([640, 1180])}
                y={REC_Y}
                reveal={recU}
                xTicks={6}
                yTicks={3}
                xLabel="step"
                fontSize={11}
              />
              <FunctionPlot
                x={scaleLinear().domain([0, T - 1]).range([640, 1180])}
                y={REC_Y}
                f={truthF}
                domain={[activeLag, T - 1]}
                samples={200}
                reveal={1}
                color={colors.MUTED}
                width={2}
              />
              <FunctionPlot
                x={scaleLinear().domain([0, T - 1]).range([640, 1180])}
                y={REC_Y}
                f={predF}
                domain={[activeLag, T - 1]}
                samples={200}
                reveal={1}
                color={colors.WARM}
                width={2.4}
              />
              <text x={1180} y={430} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={600}>
                {errLabel}
              </text>
              <text x={640} y={430} fill={colors.MUTED} fontSize={12}>
                grey: truth · orange: linear readout of the 6 numbers
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed: title + equation */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The compressed past
        </text>
      </g>
      <MathLabel
        tex="h_t = A\,h_{t-1} + B\,x_t"
        x={520}
        y={44}
        fontSize={24}
        color={colors.SECONDARY}
        opacity={eqU * mainOp}
      />

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            The state is a compressed past.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Six numbers, fading gracefully with distance —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            but fading at rates the input never gets to choose.
          </text>
        </g>
      )}
    </>
  );
}

export function SsmCompressedPast() {
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
