// Explained: State-Space Models — chapter 3: the convolution duality.
// One linear SSM (N = 4, T = 32) is computed BOTH ways at module scope:
// (1) the recurrence h_t = A h_{t-1} + B x_t, y_t = C h_t, step by step; and
// (2) a single convolution with the kernel K_j = C A^j B. The two outputs
// agree to machine precision — max |difference| ≈ 6.7e-16 with this seed,
// checked below. That equivalence (and where selectivity breaks it) is the
// chapter.
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
// Real math, module scope.
// ---------------------------------------------------------------------------

const N = 4;
const T = 32;
const rand = mulberry32(20260703);

const A: number[] = Array.from({ length: N }, () => 0.7 + rand() * 0.28);
const B: number[] = Array.from({ length: N }, () => rand() * 2 - 1);
const C: number[] = Array.from({ length: N }, () => rand() * 2 - 1);
const X: number[] = Array.from(
  { length: T },
  (_, t) => Math.sin(t * 0.4) + (t === 10 ? 1.5 : 0),
);

/** Path one: the recurrence, step by step. */
const Y_REC: number[] = (() => {
  let h = new Array(N).fill(0) as number[];
  const out: number[] = [];
  for (let t = 0; t < T; t++) {
    h = h.map((hi, i) => A[i] * hi + B[i] * X[t]);
    out.push(h.reduce((acc, hi, i) => acc + C[i] * hi, 0));
  }
  return out;
})();

/** Path two: one convolution with the unrolled kernel K_j = C A^j B. */
const KERNEL: number[] = Array.from({ length: T }, (_, j) =>
  C.reduce((acc, c, i) => acc + c * Math.pow(A[i], j) * B[i], 0),
);
const Y_CONV: number[] = Array.from({ length: T }, (_, t) => {
  let sum = 0;
  for (let j = 0; j <= t; j++) sum += KERNEL[j] * X[t - j];
  return sum;
});

/** The check: max |Y_REC - Y_CONV| ≈ 6.7e-16. */
const MAX_DIFF = Math.max(...Y_REC.map((y, t) => Math.abs(y - Y_CONV[t])));

const lerpArr = (arr: number[], u: number): number => {
  const f = Math.max(0, Math.min(T - 1, u));
  const i = Math.floor(f);
  if (i >= T - 1) return arr[T - 1];
  return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
};

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const IN_X = scaleLinear().domain([0, T - 1]).range([120, 700]);
const IN_Y = scaleLinear().domain([-1.4, 2.6]).range([250, 110]);

const KER_X = scaleLinear().domain([0, 14]).range([860, 1180]);
const KER_Y = scaleLinear().domain([-0.6, 0.9]).range([250, 110]);

const OUT_X = scaleLinear().domain([0, T - 1]).range([120, 1180]);
const OUT_Y = scaleLinear().domain([-0.7, 2.0]).range([600, 380]);

const CAM_IN: CameraState = { x: 420, y: 190, k: 1.3 };
const CAM_KER: CameraState = { x: 1000, y: 190, k: 1.35 };
const CAM_OUT: CameraState = { x: 640, y: 470, k: 1.15 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  inU: ChannelRef<number>;
  recTok: ChannelRef<number>;
  recEqU: ChannelRef<number>;
  kerU: ChannelRef<number>;
  kerEqU: ChannelRef<number>;
  convTok: ChannelRef<number>;
  diffU: ChannelRef<number>;
  whyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const inU = tl.channel('inU', 0);
  const recTok = tl.channel('recTok', 0);
  const recEqU = tl.channel('recEqU', 0);
  const kerU = tl.channel('kerU', 0);
  const kerEqU = tl.channel('kerEqU', 0);
  const convTok = tl.channel('convTok', 0);
  const diffU = tl.channel('diffU', 0);
  const whyU = tl.channel('whyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — setup
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A state-space model has a secret identity, and this chapter is about catching it in the act. Here is one input: a sine wave with a spike dropped on step ten.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_IN, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(inU, 1, { at: 1.2, dur: 1.4, ease: ease.draw });
  tl.hold(6.1, 0.6);

  // Beat 2 — path one: the recurrence
  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'Path one is the machine you already know: a tiny four-number state chews through the sequence one step at a time, and we read an output off it at every step.',
  });
  tl.tween(cam, CAM_OUT, { at: 6.9, dur: 1.5, ease: ease.move });
  tl.tween(recEqU, 1, { at: 7.5, dur: 0.8, ease: ease.enter });
  tl.tween(recTok, T - 1, { at: 8.8, dur: 7.0, ease: ease.linear });
  tl.caption({
    at: 13.0,
    dur: 4.6,
    text: 'Thirty two steps, strictly in order. Each step needs the state from the step before — nothing here can run in parallel.',
  });
  tl.hold(17.8, 0.6);

  // Beat 3 — path two: unroll into a kernel
  tl.caption({
    at: 18.4,
    dur: 6.2,
    text: 'Now the trick. Because the update is linear, you can unroll it: the output is just each past input, weighted by how much survives the decay. Those weights form a fixed curve.',
  });
  tl.tween(cam, CAM_KER, { at: 18.6, dur: 1.5, ease: ease.move });
  tl.tween(kerU, 1, { at: 19.6, dur: 1.4, ease: ease.draw });
  tl.tween(kerEqU, 1, { at: 21.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 25.0,
    dur: 5.4,
    text: 'That curve is a convolution kernel, computed once from the model itself. Slide it across the whole input in one shot — no state, no order, no waiting.',
  });
  tl.tween(cam, CAM_OUT, { at: 26.2, dur: 1.5, ease: ease.move });
  tl.tween(convTok, T - 1, { at: 27.4, dur: 4.5, ease: ease.linear });
  tl.hold(30.8, 0.6);

  // Beat 4 — the verification
  tl.caption({
    at: 31.4,
    dur: 6.0,
    text: 'Same model, two completely different computations — and the outputs land exactly on top of each other. We checked every one of the thirty two values.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.6, dur: 1.5, ease: ease.move });
  tl.tween(diffU, 1, { at: 33.0, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 37.8,
    dur: 5.4,
    text: 'The largest disagreement is about seven times ten to the minus sixteen. That is floating point dust. The recurrence and the convolution are the same function.',
  });
  tl.hold(43.4, 0.7);

  // Beat 5 — why it matters + where it breaks
  tl.caption({
    at: 44.1,
    dur: 6.2,
    text: 'This duality is why these models train fast: at training time you use the parallel form across the whole sequence, and at inference you flip to the tiny recurrent state.',
  });
  tl.tween(whyU, 1, { at: 44.5, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 50.7,
    dur: 6.4,
    text: 'One honest caveat: last chapter we let the input set the gates — and that breaks the fixed kernel, because the weights now change with the data. Mamba pays for selectivity with a parallel scan instead.',
  });
  tl.hold(57.4, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 58.0,
    dur: 5.6,
    text: 'One model, two faces: a recurrence when you want cheap steps, a convolution when you want parallel training. Verified here to sixteen decimal places.',
  });
  tl.tween(dimU, 1, { at: 58.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 59.2, dur: 0.9, ease: ease.enter });
  tl.hold(63.8, 1.2);

  return { tl, cam, titleU, inU, recTok, recEqU, kerU, kerEqU, convTok, diffU, whyU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/ssm-convolution-duality/overrides.json',
  slug: 'ssm-convolution-duality',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const inU = s.get(scene.inU);
  const recTok = s.get(scene.recTok);
  const recEqU = s.get(scene.recEqU);
  const kerU = s.get(scene.kerU);
  const kerEqU = s.get(scene.kerEqU);
  const convTok = s.get(scene.convTok);
  const diffU = s.get(scene.diffU);
  const whyU = s.get(scene.whyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const rTok = Math.max(0.5, recTok);
  const cTok = Math.max(0.001, convTok);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* input */}
          <g opacity={inU}>
            <text x={120} y={84} fill={colors.TEXT} fontSize={17}>
              input x
            </text>
            <Axes x={IN_X} y={IN_Y} reveal={inU} xTicks={6} yTicks={2} xLabel="step" fontSize={10} />
            <FunctionPlot
              x={IN_X}
              y={IN_Y}
              f={(u) => lerpArr(X, u)}
              domain={[0, T - 1]}
              samples={240}
              reveal={inU}
              color={colors.MUTED}
              width={2}
            />
          </g>

          {/* kernel */}
          <g opacity={kerU}>
            <text x={860} y={84} fill={colors.TEXT} fontSize={17}>
              the unrolled kernel
            </text>
            <Axes x={KER_X} y={KER_Y} reveal={kerU} xTicks={4} yTicks={2} xLabel="lag j" fontSize={10} />
            <FunctionPlot
              x={KER_X}
              y={KER_Y}
              f={(u) => lerpArr(KERNEL, u)}
              domain={[0, 14]}
              samples={160}
              reveal={kerU}
              color={colors.WARM}
              width={2.4}
            />
          </g>

          {/* outputs */}
          <g>
            <text x={120} y={352} fill={colors.TEXT} fontSize={17} opacity={recTok > 0 ? 1 : 0}>
              output y — two ways
            </text>
            {recTok > 0 && (
              <Axes x={OUT_X} y={OUT_Y} reveal={1} xTicks={8} yTicks={3} xLabel="step" fontSize={10} />
            )}
            {recTok > 0 && (
              <>
                <FunctionPlot
                  x={OUT_X}
                  y={OUT_Y}
                  f={(u) => lerpArr(Y_REC, u)}
                  domain={[0, rTok]}
                  samples={240}
                  reveal={1}
                  color={colors.ACCENT}
                  width={3}
                />
                <circle cx={OUT_X(rTok)} cy={OUT_Y(lerpArr(Y_REC, rTok))} r={5} fill={colors.ACCENT} />
                <text x={130} y={392} fill={colors.ACCENT} fontSize={13}>
                  recurrence, step by step
                </text>
              </>
            )}
            {convTok > 0 && (
              <>
                <FunctionPlot
                  x={OUT_X}
                  y={OUT_Y}
                  f={(u) => lerpArr(Y_CONV, u)}
                  domain={[0, Math.max(0.5, cTok)]}
                  samples={240}
                  reveal={1}
                  color={colors.WARM}
                  width={1.6}
                  dash
                />
                <text x={330} y={392} fill={colors.WARM} fontSize={13}>
                  convolution, all at once
                </text>
              </>
            )}
          </g>

          {/* the measured difference */}
          {diffU > 0 && (
            <g opacity={diffU}>
              <rect x={860} y={330} width={320} height={64} rx={10} fill={colors.PANEL} stroke={colors.GRID} opacity={0.95} />
              <text x={1020} y={356} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                max difference over 32 steps
              </text>
              <text x={1020} y={382} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontFamily="monospace" fontWeight={700}>
                {MAX_DIFF.toExponential(1)}
              </text>
            </g>
          )}

          {/* why it matters */}
          {whyU > 0 && (
            <g opacity={whyU}>
              <text x={120} y={622} fill={colors.MUTED} fontSize={14}>
                train as a convolution (parallel) · serve as a recurrence (tiny state) · selectivity trades the kernel for a parallel scan
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The convolution duality
        </text>
      </g>
      <MathLabel
        tex="y_t = C\,h_t"
        x={420}
        y={44}
        fontSize={20}
        color={colors.ACCENT}
        opacity={recEqU * mainOp}
      />
      <MathLabel
        tex="K_j = C A^{j} B"
        x={620}
        y={44}
        fontSize={20}
        color={colors.WARM}
        opacity={kerEqU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            One model, two faces.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Recurrence for cheap steps, convolution for parallel training —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            identical outputs, max difference {MAX_DIFF.toExponential(1)}.
          </text>
        </g>
      )}
    </>
  );
}

export function SsmConvolutionDuality() {
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
