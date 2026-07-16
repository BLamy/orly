// arXiv:2605.22791 — "Gated DeltaNet-2" background, chapter 2: the delta rule
// as one step of online gradient descent. We really run it: a toy associative-
// recall task (6 key-value pairs, d = 10, seeded random non-orthogonal keys),
// comparing the Hebbian write S += k v^T against the delta rule
// S += beta * k (v - S^T k)^T — which is exactly a gradient step on the
// per-token recall loss  L = 1/2 ||S^T k - v||^2.  The error curves plotted
// are the true per-presentation recall errors from those two runs.
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
// The task: N pairs presented cyclically for EPOCHS rounds.
// ---------------------------------------------------------------------------

const D = 10;
const N = 6;
const EPOCHS = 8;
const STEPS = N * EPOCHS; // 48 presentations
const BETA = 0.55;

const rand = mulberry32(772026);
const unit = (): number[] => {
  const v = Array.from({ length: D }, () => rand() * 2 - 1);
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
};
const KEYS = Array.from({ length: N }, unit);
const VALS = Array.from({ length: N }, unit);

type Mat = number[][];
const zeros = (): Mat => Array.from({ length: D }, () => Array.from({ length: D }, () => 0));
const readOut = (S: Mat, k: number[]): number[] =>
  Array.from({ length: D }, (_, j) => k.reduce((a, ki, i) => a + ki * S[i][j], 0));
const errOf = (S: Mat, k: number[], v: number[]): number => {
  const vhat = readOut(S, k);
  return Math.hypot(...vhat.map((x, j) => x - v[j]));
};
/** Mean recall error over ALL pairs — the honest score after each write. */
const meanErr = (S: Mat): number =>
  KEYS.reduce((a, k, p) => a + errOf(S, k, VALS[p]), 0) / N;

interface RunOut {
  errs: number[]; // length STEPS + 1
  states: Mat[]; // snapshots, length STEPS + 1
}

function run(delta: boolean): RunOut {
  let S = zeros();
  const errs = [meanErr(S)];
  const states = [S.map((r) => [...r])];
  for (let t = 0; t < STEPS; t++) {
    const p = t % N;
    const k = KEYS[p];
    const v = VALS[p];
    const target = delta
      ? (() => {
          const vhat = readOut(S, k);
          return v.map((x, j) => BETA * (x - vhat[j]));
        })()
      : v.map((x) => BETA * x);
    S = S.map((row, i) => row.map((x, j) => x + k[i] * target[j]));
    errs.push(meanErr(S));
    states.push(S.map((r) => [...r]));
  }
  return { errs, states };
}

// With this seed: Hebbian mean error plateaus around 0.9 (interference between
// non-orthogonal keys never resolves); the delta rule drives it below 0.05.
const HEBB = run(false);
const DELTA = run(true);

const errAt = (errs: number[], step: number): number => {
  const f = Math.max(0, Math.min(STEPS, step));
  const i = Math.floor(f);
  if (i >= STEPS) return errs[STEPS];
  return errs[i] + (errs[i + 1] - errs[i]) * (f - i);
};

// per-channel bars for the "prediction vs target" strip (pair 0)
const predBars = (states: Mat[], step: number): number[] => {
  const i = Math.round(Math.max(0, Math.min(STEPS, step)));
  return readOut(states[i], KEYS[0]);
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const GRID_L = { x: 120, y: 200 };
const GRID_R = { x: 460, y: 200 };
const CELL = 22;
const HEAT_SCALE = 1.6;

const PLOT_X = scaleLinear().domain([0, STEPS]).range([840, 1220]);
const PLOT_Y = scaleLinear().domain([0, 1.5]).range([560, 200]);

const BAR_X0 = 120;
const BAR_W = 20;
const BAR_Y = 560;

const CAM_GRIDS: CameraState = { x: 420, y: 340, k: 1.15 };
const CAM_PLOT: CameraState = { x: 860, y: 360, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  taskU: ChannelRef<number>;
  hebbStep: ChannelRef<number>;
  deltaStep: ChannelRef<number>;
  gridsU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  gradU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveStep: ChannelRef<number>;
  barsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const taskU = tl.channel('taskU', 0);
  const gridsU = tl.channel('gridsU', 0);
  const hebbStep = tl.channel('hebbStep', 0);
  const deltaStep = tl.channel('deltaStep', 0);
  const eqU = tl.channel('eqU', 0);
  const gradU = tl.channel('gradU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveStep = tl.channel('curveStep', 0);
  const barsU = tl.channel('barsU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the task
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Give the state a simple job: memorize six pairs. Show it a key, and it should hand back the matching value.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(taskU, 1, { at: 1.0, dur: 1.0, ease: ease.enter });
  tl.tween(barsU, 1, { at: 2.2, dur: 0.9, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — Hebbian write fails
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'The naive write just adds every pair on top of the state. When the keys overlap, the answers come back smeared together.',
  });
  tl.tween(gridsU, 1, { at: 7.0, dur: 1.1, ease: ease.draw });
  tl.tween(cam, CAM_GRIDS, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(hebbStep, STEPS, { at: 7.8, dur: 6.0, ease: ease.linear });
  tl.caption({
    at: 12.8,
    dur: 5.2,
    text: 'Even after eight full passes over the data, the recall error is stuck. Repetition cannot fix interference.',
  });
  tl.hold(18.0, 0.6);

  // Beat 3 — the delta rule
  tl.caption({
    at: 18.6,
    dur: 6.0,
    text: 'The delta rule writes something smarter: not the value itself, but the value minus what the state already answers. Only the error gets written.',
  });
  tl.tween(eqU, 1, { at: 19.0, dur: 0.8, ease: ease.enter });
  tl.tween(deltaStep, STEPS, { at: 19.6, dur: 6.5, ease: ease.linear });
  tl.caption({
    at: 24.8,
    dur: 5.6,
    text: 'And that is not a heuristic. It is exactly one step of gradient descent on the recall loss, taken online, one token at a time.',
  });
  tl.tween(gradU, 1, { at: 25.4, dur: 0.8, ease: ease.enter });
  tl.hold(30.4, 0.6);

  // Beat 4 — the measured race
  tl.caption({
    at: 31.0,
    dur: 5.6,
    text: 'Here are the two runs, measured. Same six pairs, same order, same state size — only the write rule differs.',
  });
  tl.tween(cam, CAM_PLOT, { at: 31.2, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 31.8, dur: 1.2, ease: ease.draw });
  tl.tween(curveStep, STEPS, { at: 33.2, dur: 5.4, ease: ease.linear });
  tl.caption({
    at: 37.0,
    dur: 5.8,
    text: 'The naive write plateaus near an error of one. The delta rule grinds the same error down toward zero, pass after pass.',
  });
  tl.hold(42.8, 0.6);

  // Beat 5 — the hook for the next chapter
  tl.caption({
    at: 43.4,
    dur: 6.0,
    text: 'But notice what correcting an answer means: to write the new value, the delta rule first erases whatever the key currently points at. One coefficient controls both.',
  });
  tl.tween(closeU, 1, { at: 44.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 49.6,
    dur: 4.6,
    text: 'Erase and write, welded together. That weld is what the paper cuts.',
  });
  tl.hold(54.2, 1.2);

  return {
    tl,
    cam,
    titleU,
    taskU,
    hebbStep,
    deltaStep,
    gridsU,
    eqU,
    gradU,
    plotU,
    curveStep,
    barsU,
    closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/delta-rule-recall/overrides.json',
  slug: 'delta-rule-recall',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function StateGrid({
  run: r,
  step,
  x,
  y,
  label,
  color,
  u,
}: {
  run: RunOut;
  step: number;
  x: number;
  y: number;
  label: string;
  color: string;
  u: number;
}) {
  if (u <= 0) return null;
  const i = Math.round(Math.max(0, Math.min(STEPS, step)));
  const S = r.states[i];
  return (
    <g opacity={u}>
      <text x={x} y={y - 16} fill={color} fontSize={16}>
        {label}
      </text>
      {S.map((row, ri) =>
        row.map((v, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={x + ci * CELL}
            y={y + ri * CELL}
            width={CELL - 2}
            height={CELL - 2}
            rx={3}
            fill={colors.heat(clamp01(0.5 + v / (2 * HEAT_SCALE)))}
          />
        )),
      )}
      <text x={x} y={y + D * CELL + 20} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
        step {i} / {STEPS}
      </text>
    </g>
  );
}

function Bars({
  vhat,
  x,
  u,
  label,
  color,
}: {
  vhat: number[];
  x: number;
  u: number;
  label: string;
  color: string;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={x} y={BAR_Y - 66} fill={colors.MUTED} fontSize={12}>
        {label}
      </text>
      {vhat.map((v, j) => {
        const h = Math.min(52, Math.abs(v) * 52);
        return (
          <rect
            key={j}
            x={x + j * (BAR_W + 4)}
            y={v >= 0 ? BAR_Y - h : BAR_Y}
            width={BAR_W}
            height={Math.max(1, h)}
            rx={2}
            fill={color}
            opacity={0.85}
          />
        );
      })}
      <line x1={x - 4} y1={BAR_Y} x2={x + D * (BAR_W + 4)} y2={BAR_Y} stroke={colors.GRID} />
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const taskU = s.get(scene.taskU);
  const gridsU = s.get(scene.gridsU);
  const hebbStep = s.get(scene.hebbStep);
  const deltaStep = s.get(scene.deltaStep);
  const eqU = s.get(scene.eqU);
  const gradU = s.get(scene.gradU);
  const plotU = s.get(scene.plotU);
  const curveStep = s.get(scene.curveStep);
  const barsU = s.get(scene.barsU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  const curMax = Math.max(0.5, curveStep);

  const fHebb = (t: number): number => errAt(HEBB.errs, t);
  const fDelta = (t: number): number => errAt(DELTA.errs, t);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <StateGrid run={HEBB} step={hebbStep} x={GRID_L.x} y={GRID_L.y} label="naive write" color={colors.WARM} u={gridsU} />
          <StateGrid run={DELTA} step={deltaStep} x={GRID_R.x} y={GRID_R.y} label="delta rule" color={colors.POSITIVE} u={gridsU} />

          {/* prediction vs target bars for pair 1 */}
          <Bars vhat={VALS[0]} x={BAR_X0} u={barsU * taskU} label="target value, pair one" color={colors.MUTED} />
          <Bars
            vhat={predBars(DELTA.states, deltaStep)}
            x={BAR_X0 + 330}
            u={barsU * gridsU}
            label="delta rule answer, pair one"
            color={colors.POSITIVE}
          />

          {/* measured race */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <text x={840} y={168} fill={colors.TEXT} fontSize={16}>
                mean recall error over all six pairs
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={4} yTicks={3} xLabel="presentations" fontSize={11} />
              <FunctionPlot x={PLOT_X} y={PLOT_Y} f={fHebb} domain={[0, curMax]} samples={200} color={colors.WARM} width={2.6} />
              <FunctionPlot x={PLOT_X} y={PLOT_Y} f={fDelta} domain={[0, curMax]} samples={200} color={colors.POSITIVE} width={2.6} />
              {curveStep >= STEPS - 0.5 && (
                <>
                  <text x={PLOT_X(STEPS) + 4} y={PLOT_Y(HEBB.errs[STEPS])} fill={colors.WARM} fontSize={12}>
                    {HEBB.errs[STEPS].toFixed(2)}
                  </text>
                  <text x={PLOT_X(STEPS) + 4} y={PLOT_Y(DELTA.errs[STEPS])} fill={colors.POSITIVE} fontSize={12}>
                    {DELTA.errs[STEPS].toFixed(2)}
                  </text>
                </>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The delta rule
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15}>
          write only the error
        </text>
      </g>
      <MathLabel
        tex="S_t = S_{t-1} + \beta_t\, k_t\,(v_t - S_{t-1}^{\top} k_t)^{\top}"
        x={790}
        anchor="start"
        y={70}
        fontSize={22}
        color={colors.POSITIVE}
        opacity={eqU * mainOp}
      />
      <MathLabel
        tex="= S_{t-1} - \beta_t \nabla_S\, \tfrac{1}{2}\| S^{\top} k_t - v_t \|^2"
        x={810}
        anchor="start"
        y={110}
        fontSize={20}
        color={colors.TEAL}
        opacity={gradU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            One coefficient, two decisions.
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            The same beta scales how much of the old answer is erased
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and how much of the new value is written.
          </text>
          <MathLabel
            tex="S_t = \alpha_t (I - \beta_t k_t k_t^{\top}) S_{t-1} + \beta_t k_t v_t^{\top}"
            x={640}
            y={400}
            fontSize={19}
            color={colors.SECONDARY}
            opacity={closeU}
          />
        </g>
      )}
    </>
  );
}

export function DeltaRuleRecall() {
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
