// arXiv:2607.13491 — DeepLoop, chapter 3: the scaling fix. DeepNorm scales
// Post-LN residuals with α = (2N)^{1/4}, β = (8N)^{-1/4}; DeepLoop raises the
// exponent to one half — α = (2N)^{1/2}, β = (8N)^{-1/2} — with N the UNROLLED
// depth M·R. The two perturbation curves below are genuinely computed on a
// tied Post-LN toy net (d = 8, M = 4 physical blocks, RMS-normalized residual
// updates, seeded): perturb the shared weights slightly and measure ‖ΔF‖ at
// the output as R grows. p = 1/4 keeps growing (0.076 → 0.136, near-doubling
// by R = 8); p = 1/2 stays flat (≈ 0.025). The p-sweep panel replots the
// paper's REPORTED Appendix C result (Figure 6): at R = 3, p < 0.45 diverges,
// p ≥ 0.5 trains reliably, and loss creeps up past one half
// (3.70 → 3.73 → 3.76 → 3.80 nats).
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
import { Axes } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real math, module scope: perturbation propagation through a tied Post-LN net.
// ---------------------------------------------------------------------------

const D = 8;
const M = 4;
const R_MAX = 8;
const rand = mulberry32(21);

const mkW = (): number[][] =>
  Array.from({ length: D }, () => Array.from({ length: D }, () => rand() * 2 - 1));
const WS: number[][][] = Array.from({ length: M }, mkW);
const DW: number[][][] = Array.from({ length: M }, () =>
  Array.from({ length: D }, () => Array.from({ length: D }, () => (rand() * 2 - 1) * 0.05)),
);
const X0: number[] = Array.from({ length: D }, () => rand() * 2 - 1);

const vnorm = (v: number[]): number => Math.hypot(...v);
const rmsnorm = (v: number[]): number[] => {
  const r = vnorm(v) / Math.sqrt(v.length) || 1;
  return v.map((x) => x / r);
};

/** Run the tied Post-LN loop at exponent p; return the final hidden state. */
function run(Rloops: number, p: number, perturbed: boolean): number[] {
  const N = M * Rloops; // unrolled depth
  const alpha = Math.pow(2 * N, p);
  const beta = Math.pow(8 * N, -p);
  let h = [...X0];
  for (let r = 0; r < Rloops; r++) {
    for (let m = 0; m < M; m++) {
      const Wm = perturbed
        ? WS[m].map((row, i) => row.map((w, j) => w + DW[m][i][j]))
        : WS[m];
      const f = Wm.map((row) =>
        Math.tanh(row.reduce((a, w, j) => a + beta * w * h[j], 0)),
      );
      h = rmsnorm(h.map((x, i) => alpha * x + f[i]));
    }
  }
  return h;
}

/** ‖ΔF‖ vs loop count for a given exponent p. */
const dFcurve = (p: number): number[] =>
  Array.from({ length: R_MAX }, (_, i) => {
    const a = run(i + 1, p, false);
    const b = run(i + 1, p, true);
    return vnorm(a.map((x, k) => x - b[k]));
  });

const DF_QUARTER = dFcurve(0.25); // 0.076 → 0.136 with this seed: keeps growing
const DF_HALF = dFcurve(0.5); // ≈ 0.024 → 0.026: flat

// REPORTED (arXiv:2607.13491, Appendix C, Figure 6) — p-sweep at R = 3,
// GPT-2 Small, validation loss at step 2000. NOT re-run here.
const SWEEP: { p: number; loss: number | null; diverged: boolean }[] = [
  { p: 0.3, loss: null, diverged: true },
  { p: 0.35, loss: null, diverged: true },
  { p: 0.4, loss: null, diverged: true },
  { p: 0.45, loss: 3.7, diverged: false }, // boundary: some seeds fail
  { p: 0.5, loss: 3.73, diverged: false },
  { p: 0.55, loss: 3.76, diverged: false },
  { p: 0.6, loss: 3.8, diverged: false },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = scaleLinear().domain([1, R_MAX]).range([140, 590]);
const PLOT_Y = scaleLinear().domain([0, 0.16]).range([560, 300]);

const SW_X = scaleLinear().domain([0.28, 0.62]).range([740, 1170]);
const SW_Y = scaleLinear().domain([3.6, 3.95]).range([560, 380]);

const CAM_EQ: CameraState = { x: 640, y: 240, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  eqU: ChannelRef<number>;
  dnU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  qTok: ChannelRef<number>;
  dlU: ChannelRef<number>;
  hTok: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  sweepTok: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const eqU = tl.channel('eqU', 0); // Post-LN update equation
  const dnU = tl.channel('dnU', 0); // DeepNorm exponents
  const plotU = tl.channel('plotU', 0);
  const qTok = tl.channel('qTok', 0); // p=1/4 curve draw 0..R_MAX
  const dlU = tl.channel('dlU', 0); // DeepLoop exponents
  const hTok = tl.channel('hTok', 0); // p=1/2 curve draw 0..R_MAX
  const sweepU = tl.channel('sweepU', 0);
  const sweepTok = tl.channel('sweepTok', 0); // sweep points 0..7
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — DeepNorm's fourth root
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Deep post-layer-norm transformers hit this wall once before. Deep Norm fixed them by scaling the residual up and the update down, both by the fourth root of depth.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_EQ, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(eqU, 1, { at: 1.2, dur: 0.9, ease: ease.enter });
  tl.tween(dnU, 1, { at: 2.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 7.1,
    dur: 5.6,
    text: 'That fourth root was tuned for a network where every layer is different. Each layer perturbs the output once, so depth many small shocks stay bounded.',
  });
  tl.hold(13.0, 0.6);

  // Beat 2 — the loop breaks it: computed
  tl.caption({
    at: 13.6,
    dur: 5.6,
    text: 'In a loop, the same shock enters at every visit, and as we saw, the visits align. Watch what that does on the toy network.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.8, dur: 1.4, ease: ease.move });
  tl.tween(plotU, 1, { at: 14.8, dur: 1.1, ease: ease.draw });
  tl.caption({
    at: 19.6,
    dur: 6.2,
    text: 'Perturb the shared weights slightly and measure how far the output moves as the loop count grows. With the fourth root scaling, the shift keeps growing — nearly doubling by eight visits.',
  });
  tl.tween(qTok, R_MAX, { at: 20.2, dur: 4.8, ease: ease.linear });
  tl.hold(26.2, 0.7);

  // Beat 3 — DeepLoop's square root
  tl.caption({
    at: 26.9,
    dur: 6.2,
    text: 'Deep Loop changes one thing. The exponent becomes one half, and depth is counted as unrolled depth — physical blocks times the number of loops.',
  });
  tl.tween(dlU, 1, { at: 27.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 33.5,
    dur: 5.6,
    text: 'Same perturbation, same loop, stronger anchor. Now the output shift stays flat no matter how many times the blocks are revisited.',
  });
  tl.tween(hTok, R_MAX, { at: 34.0, dur: 4.2, ease: ease.linear });
  tl.hold(39.4, 0.7);

  // Beat 4 — the reported p-sweep
  tl.caption({
    at: 40.1,
    dur: 6.6,
    text: 'And the exponent is not arbitrary. Sweeping it at loop count three, the paper reports that everything below point four five diverges, and one half is the smallest value that trains reliably across seeds.',
  });
  tl.tween(sweepU, 1, { at: 40.6, dur: 1.0, ease: ease.draw });
  tl.tween(sweepTok, 7, { at: 41.8, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 47.3,
    dur: 6.0,
    text: 'Push past one half and stability stays, but the loss slowly creeps upward. One half sits exactly on the edge — right where the theory says the aligned visits are just cancelled.',
  });
  tl.hold(53.5, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 54.2,
    dur: 5.4,
    text: 'One exponent, moved from a fourth root to a square root, with depth counted in visits. That is the whole method.',
  });
  tl.tween(dimU, 1, { at: 54.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.6, dur: 0.9, ease: ease.enter });
  tl.hold(59.8, 1.2);

  return { tl, cam, titleU, eqU, dnU, plotU, qTok, dlU, hTok, sweepU, sweepTok, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/deeploop-scaling/overrides.json',
  slug: 'deeploop-scaling',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(vals: number[], upTo: number): string {
  const n = Math.min(vals.length, Math.ceil(upTo));
  return vals
    .slice(0, n)
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${PLOT_X(i + 1)} ${PLOT_Y(v)}`)
    .join(' ');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const eqU = s.get(scene.eqU);
  const dnU = s.get(scene.dnU);
  const plotU = s.get(scene.plotU);
  const qTok = s.get(scene.qTok);
  const dlU = s.get(scene.dlU);
  const hTok = s.get(scene.hTok);
  const sweepU = s.get(scene.sweepU);
  const sweepTok = s.get(scene.sweepTok);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the Post-LN update, screen-centered up top */}
          <MathLabel
            tex="x_{i+1} = \mathrm{Norm}\!\left(\alpha\, x_i + f_j(x_i;\, \phi_j)\right)"
            x={640}
            y={150}
            fontSize={26}
            color={colors.TEXT}
            opacity={eqU}
            anchor="middle"
          />
          {/* DeepNorm exponents */}
          <g opacity={dnU}>
            <MathLabel
              tex="\text{DeepNorm:}\quad \alpha = (2N)^{1/4},\quad \beta = (8N)^{-1/4}"
              x={640}
              y={205}
              fontSize={20}
              color={colors.MUTED}
              anchor="middle"
            />
          </g>
          {/* DeepLoop exponents */}
          <g opacity={dlU}>
            <MathLabel
              tex="\text{DeepLoop:}\quad \alpha = (2N)^{1/2},\quad \beta = (8N)^{-1/2},\quad N = M\!\cdot\! R"
              x={640}
              y={250}
              fontSize={20}
              color={colors.POSITIVE}
              anchor="middle"
            />
          </g>
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          From fourth root to square root
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          Post-LN residual scaling · p: 1/4 → 1/2
        </text>
      </g>

      {/* left plot: computed perturbation growth */}
      <g opacity={plotU * mainOp}>
        <text x={140} y={272} fill={colors.TEXT} fontSize={15}>
          output shift from a small weight perturbation (computed)
        </text>
        <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={4} yTicks={3} xLabel="loop count R" fontSize={11} />
        <path d={curvePath(DF_QUARTER, qTok)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.6} />
        {qTok > 0 &&
          DF_QUARTER.slice(0, Math.min(R_MAX, Math.ceil(qTok))).map((v, i) => (
            <circle key={i} cx={PLOT_X(i + 1)} cy={PLOT_Y(v)} r={3.5} fill={colors.NEGATIVE} opacity={clamp01(qTok - i)} />
          ))}
        {qTok >= R_MAX - 0.02 && (
          <text x={PLOT_X(R_MAX) - 2} y={PLOT_Y(DF_QUARTER[R_MAX - 1]) - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={12}>
            p = 1/4: {DF_QUARTER[R_MAX - 1].toFixed(3)} and climbing
          </text>
        )}
        <path d={curvePath(DF_HALF, hTok)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} />
        {hTok > 0 &&
          DF_HALF.slice(0, Math.min(R_MAX, Math.ceil(hTok))).map((v, i) => (
            <circle key={i} cx={PLOT_X(i + 1)} cy={PLOT_Y(v)} r={3.5} fill={colors.POSITIVE} opacity={clamp01(hTok - i)} />
          ))}
        {hTok >= R_MAX - 0.02 && (
          <text x={PLOT_X(R_MAX) - 2} y={PLOT_Y(DF_HALF[R_MAX - 1]) + 22} textAnchor="end" fill={colors.POSITIVE} fontSize={12}>
            p = 1/2: flat at {DF_HALF[R_MAX - 1].toFixed(3)}
          </text>
        )}
        <text x={140} y={600} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
          tied Post-LN toy · d=8 · M=4 blocks · ‖ΔF‖ at the output
        </text>
      </g>

      {/* right panel: the reported p-sweep */}
      <g opacity={sweepU * mainOp}>
        <rect x={700} y={300} width={510} height={330} rx={12} fill={colors.PANEL} opacity={0.5} stroke={colors.GRID} />
        <text x={724} y={332} fill={colors.TEXT} fontSize={15}>
          exponent sweep at R = 3
        </text>
        <text x={1186} y={332} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily="monospace">
          reported, not re-run
        </text>
        <Axes x={SW_X} y={SW_Y} reveal={sweepU} xTicks={4} yTicks={3} xLabel="exponent p" fontSize={11} />
        {SWEEP.map((pt, i) => {
          const u = clamp01(sweepTok - i + 1);
          if (u <= 0) return null;
          if (pt.diverged) {
            return (
              <g key={i} opacity={u}>
                <text x={SW_X(pt.p)} y={SW_Y(3.9)} textAnchor="middle" fill={colors.NEGATIVE} fontSize={17} fontWeight={700}>
                  ✕
                </text>
                <text x={SW_X(pt.p)} y={SW_Y(3.9) + 18} textAnchor="middle" fill={colors.NEGATIVE} fontSize={9}>
                  diverges
                </text>
              </g>
            );
          }
          return (
            <g key={i} opacity={u}>
              <circle cx={SW_X(pt.p)} cy={SW_Y(pt.loss as number)} r={5} fill={pt.p === 0.5 ? colors.POSITIVE : colors.ACCENT} />
              <text x={SW_X(pt.p)} y={SW_Y(pt.loss as number) - 12} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                {(pt.loss as number).toFixed(2)}
              </text>
            </g>
          );
        })}
        {sweepTok >= 6.9 && (
          <>
            <line x1={SW_X(0.475)} y1={SW_Y(3.62)} x2={SW_X(0.475)} y2={SW_Y(3.93)} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="4 4" />
            <text x={SW_X(0.5)} y={SW_Y(3.62)} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>
              p = 1/2: smallest reliable
            </text>
          </>
        )}
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Count depth in visits, anchor by its square root.
          </text>
          <MathLabel
            tex="\alpha = (2N)^{1/2},\quad \beta = (8N)^{-1/2},\quad N = M\!\cdot\! R"
            x={640}
            y={340}
            fontSize={22}
            color={colors.POSITIVE}
            anchor="middle"
          />
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            DeepLoop · arXiv:2607.13491
          </text>
        </g>
      )}
    </>
  );
}

export function DeepLoopScaling() {
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
