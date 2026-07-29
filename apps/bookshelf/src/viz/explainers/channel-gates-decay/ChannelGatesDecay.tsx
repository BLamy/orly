// arXiv:2605.22791 — "Gated DeltaNet-2", chapter 4: gates and decay.
// The paper's gate parameterization (Eqs. 11-12):
//   b_t = sigmoid(W_b x_t)                 channel-wise erase gate, key side
//   w_t = sigmoid(W_w x_t)                 channel-wise write gate, value side
//   g_t = -exp(a) ⊙ softplus(W_f x_t + δ)  log-decay (computed in fp32)
//   α_t = exp(g_t),  D_t = Diag(α_t)       channel-wise decay matrix
// Gated DeltaNet used ONE scalar decay per head; GDN-2 (like Kimi Delta
// Attention) gives every channel its own decay rate. Everything on screen is
// computed: real sigmoid/softplus curves, and real retention curves
// α^t = exp(t·g) for eight channels with distinct learned-style rates versus
// one head-wise scalar that forgets everything at the same speed.
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
// The math, module scope.
// ---------------------------------------------------------------------------

const softplus = (x: number): number => Math.log1p(Math.exp(x));
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

const D = 8;
// per-channel pre-activations (playing the role of W_f x_t + delta) and the
// learned log-scale a — chosen to span slow to fast forgetting.
const PRE: number[] = [-4.2, -3.4, -2.6, -1.8, -1.0, -0.2, 0.6, 1.4];
const A_LOG = -2.2; // exp(a) ≈ 0.111
const G: number[] = PRE.map((z) => -Math.exp(A_LOG) * softplus(z)); // log-decay per channel
const ALPHA: number[] = G.map((g) => Math.exp(g)); // 0.9983 … 0.8375 per step

// the head-wise scalar baseline: geometric mean of the channel decays
const G_SCALAR = G.reduce((a, x) => a + x, 0) / D;
const ALPHA_SCALAR = Math.exp(G_SCALAR); // ≈ 0.955

const T_MAX = 60; // steps of retention we plot
const retention = (g: number, t: number): number => Math.exp(g * Math.max(0, t));

// half-life per channel (steps until retention 0.5), for on-screen labels
const HALF: number[] = G.map((g) => Math.log(0.5) / g);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const CELL = 30;
const GRID_A = { x: 130, y: 220 }; // scalar decay
const GRID_B = { x: 480, y: 220 }; // channel-wise decay

const PLOT_X = scaleLinear().domain([0, T_MAX]).range([840, 1230]);
const PLOT_Y = scaleLinear().domain([0, 1.02]).range([560, 210]);

const GATE_X = scaleLinear().domain([-6, 6]).range([130, 520]);
const GATE_Y = scaleLinear().domain([-0.05, 1.1]).range([560, 400]);

const CAM_GRIDS: CameraState = { x: 420, y: 340, k: 1.18 };
const CAM_PLOT: CameraState = { x: 900, y: 380, k: 1.08 };

// stored pattern: one bright column per grid (the memory we watch fade)
const PATTERN: number[][] = Array.from({ length: D }, (_, i) =>
  Array.from({ length: D }, (_, j) => (j === 2 || j === 6 ? 0.95 : 0.25 + 0.08 * ((i + j) % 3))),
);

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  gateMorph: ChannelRef<number>;
  gridsU: ChannelRef<number>;
  timeT: ChannelRef<number>;
  eqU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveT: ChannelRef<number>;
  scalarU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const gateU = tl.channel('gateU', 0);
  const gateMorph = tl.channel('gateMorph', 0);
  const gridsU = tl.channel('gridsU', 0);
  const timeT = tl.channel('timeT', 0);
  const eqU = tl.channel('eqU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveT = tl.channel('curveT', 0);
  const scalarU = tl.channel('scalarU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — gates are sigmoids of the input
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Every gate in this model is the same little machine: squash a projection of the current token through a sigmoid, and you get a number between zero and one, per channel.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(gateU, 1, { at: 1.0, dur: 1.3, ease: ease.draw });
  tl.tween(eqU, 1, { at: 3.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.4,
    text: 'Decay is built differently: a soft plus keeps it negative in log space, so each step multiplies the state by something strictly below one. Memory can only leak, never explode.',
  });
  tl.tween(gateMorph, 1, { at: 7.4, dur: 1.6, ease: ease.move });
  tl.hold(12.3, 0.6);

  // Beat 2 — scalar vs channel-wise, watched
  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'Here is the difference the second version makes. On the left, one scalar decay per head: the whole state fades at one speed. On the right, every channel gets its own rate.',
  });
  tl.tween(cam, CAM_GRIDS, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(gateU, 0.12, { at: 13.2, dur: 1.0, ease: ease.move });
  tl.tween(gridsU, 1, { at: 13.8, dur: 1.2, ease: ease.draw });
  tl.tween(timeT, T_MAX, { at: 15.4, dur: 7.0, ease: ease.linear });
  tl.caption({
    at: 19.4,
    dur: 6.0,
    text: 'Sixty steps later the scalar head has forgotten everything equally — the bright columns it needed are as faded as the noise. The channel-wise head kept its slow channels alive.',
  });
  tl.hold(25.4, 0.6);

  // Beat 3 — the retention curves
  tl.caption({
    at: 26.0,
    dur: 5.8,
    text: 'Plot the retention of each channel over time and the design becomes a family of curves instead of a single guess.',
  });
  tl.tween(cam, CAM_PLOT, { at: 26.3, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 26.9, dur: 1.2, ease: ease.draw });
  tl.tween(curveT, 1, { at: 28.3, dur: 4.8, ease: ease.linear });
  tl.caption({
    at: 32.0,
    dur: 6.2,
    text: 'The fastest channel here halves in about four steps — scratch space. The slowest holds half its content for four hundred. One head now spans both regimes at once.',
  });
  tl.tween(scalarU, 1, { at: 34.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 38.4,
    dur: 5.6,
    text: 'The dashed line is the old head-wise scalar: one compromise speed for everything. It is too forgetful for the slow channels and too sticky for the fast ones.',
  });
  tl.hold(44.0, 0.7);

  // Beat 4 — close
  tl.caption({
    at: 44.7,
    dur: 6.0,
    text: 'Erase, write, and now decay — three separate, channel-wise controls over one fixed block of memory. That is the full control panel this line of models has been assembling.',
  });
  tl.tween(closeU, 1, { at: 45.4, dur: 1.0, ease: ease.enter });
  tl.hold(50.7, 1.2);

  return { tl, cam, titleU, gateU, gateMorph, gridsU, timeT, eqU, plotU, curveT, scalarU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/channel-gates-decay/overrides.json',
  slug: 'channel-gates-decay',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function FadingGrid({
  x,
  y,
  t,
  perChannel,
  label,
  sub,
  u,
}: {
  x: number;
  y: number;
  t: number;
  perChannel: boolean;
  label: string;
  sub: string;
  u: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={x} y={y - 42} fill={colors.TEXT} fontSize={17}>
        {label}
      </text>
      <text x={x} y={y - 20} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
        {sub}
      </text>
      {PATTERN.map((row, i) =>
        row.map((v, j) => {
          const g = perChannel ? G[j] : G_SCALAR;
          const faded = v * retention(g, t);
          return (
            <rect
              key={`${i}-${j}`}
              x={x + j * CELL}
              y={y + i * CELL}
              width={CELL - 2}
              height={CELL - 2}
              rx={3}
              fill={colors.heat(clamp01(faded))}
            />
          );
        }),
      )}
      {perChannel && (
        <g>
          {ALPHA.map((a, j) => (
            <text
              key={j}
              x={x + j * CELL + CELL / 2 - 1}
              y={y + D * CELL + 18}
              textAnchor="middle"
              fill={colors.MUTED}
              fontSize={9}
              fontFamily="monospace"
            >
              {a.toFixed(2)}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const gateU = s.get(scene.gateU);
  const gateMorph = s.get(scene.gateMorph);
  const gridsU = s.get(scene.gridsU);
  const timeT = s.get(scene.timeT);
  const eqU = s.get(scene.eqU);
  const plotU = s.get(scene.plotU);
  const curveT = s.get(scene.curveT);
  const scalarU = s.get(scene.scalarU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  const tCur = Math.max(0.5, curveT * T_MAX);

  const fGate = (x: number): number => sigmoid(x);
  const fDecay = (x: number): number => Math.exp(-Math.exp(A_LOG) * softplus(x) * 12);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the gate curve, morphing sigmoid -> decay-after-12-steps */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <Axes x={GATE_X} y={GATE_Y} reveal={gateU} xTicks={4} yTicks={2} xLabel="pre-activation" fontSize={11} />
              <FunctionPlot
                x={GATE_X}
                y={GATE_Y}
                f={fDecay}
                morph={{ from: fGate, u: gateMorph }}
                samples={200}
                reveal={1}
                color={colors.TEAL}
                width={2.8}
              />
              <text x={130} y={382} fill={colors.TEAL} fontSize={13}>
                {gateMorph > 0.5 ? 'retention after twelve steps, per channel' : 'sigmoid gate, per channel'}
              </text>
            </g>
          )}

          <FadingGrid
            x={GRID_A.x}
            y={GRID_A.y}
            t={timeT}
            perChannel={false}
            label="head-wise scalar decay"
            sub={`alpha = ${ALPHA_SCALAR.toFixed(3)} for every channel`}
            u={gridsU}
          />
          <FadingGrid
            x={GRID_B.x}
            y={GRID_B.y}
            t={timeT}
            perChannel
            label="channel-wise decay"
            sub="alpha per channel, printed below"
            u={gridsU}
          />
          {gridsU > 0 && (
            <text x={GRID_A.x} y={GRID_A.y + D * CELL + 44} fill={colors.MUTED} fontSize={13} opacity={gridsU}>
              t = {Math.round(timeT)} steps
            </text>
          )}

          {/* the retention family */}
          {plotU > 0 && (
            <g opacity={plotU}>
              <text x={840} y={180} fill={colors.TEXT} fontSize={16}>
                retention per channel over time
              </text>
              <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={4} yTicks={4} xLabel="steps" fontSize={11} />
              {G.map((g, j) => (
                <FunctionPlot
                  key={j}
                  x={PLOT_X}
                  y={PLOT_Y}
                  f={(t) => retention(g, t)}
                  domain={[0, tCur]}
                  samples={200}
                  color={colors.heat(0.25 + (0.65 * j) / (D - 1))}
                  width={2}
                />
              ))}
              {curveT > 0.98 && (
                <g>
                  <text x={PLOT_X(T_MAX) + 4} y={PLOT_Y(retention(G[0], T_MAX))} fill={colors.MUTED} fontSize={11}>
                    half-life ≈ {Math.round(HALF[0])} steps
                  </text>
                  <text x={PLOT_X(T_MAX) + 4} y={PLOT_Y(retention(G[D - 1], T_MAX)) - 4} fill={colors.MUTED} fontSize={11}>
                    ≈ {Math.round(HALF[D - 1])} steps
                  </text>
                </g>
              )}
              {scalarU > 0 && (
                <g opacity={scalarU}>
                  <FunctionPlot
                    x={PLOT_X}
                    y={PLOT_Y}
                    f={(t) => retention(G_SCALAR, t)}
                    domain={[0, T_MAX]}
                    samples={200}
                    color={colors.TEXT}
                    width={2.2}
                    dash
                  />
                  <text x={PLOT_X(T_MAX * 0.55)} y={PLOT_Y(retention(G_SCALAR, T_MAX * 0.55)) - 10} fill={colors.TEXT} fontSize={12}>
                    head-wise scalar
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Gates and decay
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2605.22791 · Eqs. 11–12
        </text>
      </g>
      <MathLabel
        tex="b_t = \sigma(W_b x_t) \quad w_t = \sigma(W_w x_t)"
        x={660}
        y={64}
        anchor="start"
        fontSize={19}
        color={colors.TEAL}
        opacity={eqU * mainOp}
      />
      <MathLabel
        tex="\alpha_t = \exp(-\exp(a) \odot \mathrm{softplus}(W_f x_t + \delta))"
        x={660}
        y={104}
        anchor="start"
        fontSize={19}
        color={colors.WARM}
        opacity={eqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Three knobs per channel: erase, write, decay.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            One fixed block of memory, with fast scratch channels and
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            slow archival ones — inside a single attention head.
          </text>
        </g>
      )}
    </>
  );
}

export function ChannelGatesDecay() {
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
