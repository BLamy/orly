// arXiv:2607.13491 — DeepLoop, chapter 2: why reuse changes the gradients.
// The gradient of a looped block is the SUM of per-visit contributions to the
// same shared weights. On the toy loop below those contributions are computed
// exactly (central finite differences on a d = 8 weight-tied residual net,
// 8 visits): they are ALIGNED (avg pairwise cosine ≈ 0.53), so the summed
// update grows near-linearly with visits — far above the decorrelated
// (random-sign) control. The paper compresses this into the visit-alignment
// coefficient κ_R with 0 ≤ κ_R ≤ R, and the first-order perturbation bound
// ‖ΔF‖ ≤ C·M·κ_R·(β/α)².
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
// Real math, module scope. Per-visit gradients of a tied loop, d = 8, R = 8.
// ---------------------------------------------------------------------------

const D = 8;
const R = 8;
const BETA = 0.4;
const rand = mulberry32(7);

const W: number[][] = Array.from({ length: D }, () =>
  Array.from({ length: D }, () => (rand() * 2 - 1) * 0.7),
);
const X0: number[] = Array.from({ length: D }, () => rand() * 2 - 1);

/** Forward pass with per-visit weight copies; loss = ½‖h_R‖². */
function forward(Ws: number[][][]): number {
  let h = [...X0];
  for (let r = 0; r < R; r++) {
    const f = Ws[r].map((row) => Math.tanh(row.reduce((a, w, j) => a + w * h[j], 0)));
    h = h.map((x, i) => x + BETA * f[i]);
  }
  return 0.5 * h.reduce((a, x) => a + x * x, 0);
}

/** Per-visit gradient contributions g_r = ∂L/∂W(visit r), central differences. */
const GRADS: number[][] = (() => {
  const base: number[][][] = Array.from({ length: R }, () => W);
  const eps = 1e-4;
  const out: number[][] = [];
  for (let r = 0; r < R; r++) {
    const g: number[] = [];
    for (let i = 0; i < D; i++) {
      for (let j = 0; j < D; j++) {
        const Wp = W.map((row) => [...row]);
        Wp[i][j] += eps;
        const Wm = W.map((row) => [...row]);
        Wm[i][j] -= eps;
        g.push(
          (forward(base.map((m, k) => (k === r ? Wp : m))) -
            forward(base.map((m, k) => (k === r ? Wm : m)))) /
            (2 * eps),
        );
      }
    }
    out.push(g);
  }
  return out;
})();

const vnorm = (v: number[]): number => Math.hypot(...v);

/** Decorrelated control: same magnitudes, seeded random signs per entry. */
const CONTROL: number[][] = (() => {
  const r2 = mulberry32(99);
  return GRADS.map((g) => g.map((x) => (r2() < 0.5 ? -x : x)));
})();

/** ‖Σ_{r≤k} g_r‖ for k = 1..R, real vs control. */
const cumNorms = (gs: number[][]): number[] => {
  const acc = new Array(gs[0].length).fill(0);
  const out: number[] = [];
  for (const g of gs) {
    g.forEach((x, i) => (acc[i] += x));
    out.push(vnorm(acc));
  }
  return out;
};
const SUM_REAL = cumNorms(GRADS); // near-linear growth
const SUM_CTRL = cumNorms(CONTROL); // ~√R growth

/** Average pairwise cosine between per-visit gradients (≈ 0.53 with this seed). */
const AVG_COS: number = (() => {
  let c = 0;
  let n = 0;
  for (let a = 0; a < R; a++)
    for (let b = a + 1; b < R; b++) {
      c += GRADS[a].reduce((s, x, k) => s + x * GRADS[b][k], 0) / (vnorm(GRADS[a]) * vnorm(GRADS[b]));
      n++;
    }
  return c / n;
})();

/** 2-D projections onto the consensus plane: x = component along the summed
 *  update's direction, y = an orthogonal direction. Honest picture — alignment
 *  shows up as everything marching in the same x direction. */
const PROJ_DIRS: number[][] = (() => {
  const sum = GRADS[0].map((_, i) => GRADS.reduce((a, g) => a + g[i], 0));
  const d0 = sum.map((x) => x / vnorm(sum));
  let d1 = GRADS[0].map(
    (x, i) => x - GRADS[0].reduce((a, y, j) => a + y * d0[j], 0) * d0[i],
  );
  const n1 = vnorm(d1);
  d1 = d1.map((x) => x / n1);
  return [d0, d1];
})();
const proj2 = (g: number[]): [number, number] => [
  g.reduce((a, x, i) => a + x * PROJ_DIRS[0][i], 0),
  g.reduce((a, x, i) => a + x * PROJ_DIRS[1][i], 0),
];
const ARROWS_REAL = GRADS.map(proj2);
const ARROWS_CTRL = CONTROL.map(proj2);

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

// Top-left: the unrolled chain depositing into one shared box.
const CHAIN_X = 120;
const CHAIN_Y = 205;
const CHAIN_STEP = 62;
const BOX_X = 330;
const BOX_Y = 330;

// Right: head-to-tail arrows.
const ARR_CX = 890;
const ARR_CY = 285;
const ARR_SCALE = 22;

// Bottom-left plot: ‖Σ g_r‖ vs visits.
const PLOT_X = scaleLinear().domain([0, R]).range([120, 560]);
const PLOT_Y = scaleLinear().domain([0, 22]).range([600, 430]);

const CAM_CHAIN: CameraState = { x: 380, y: 300, k: 1.25 };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  chainU: ChannelRef<number>;
  flowTok: ChannelRef<number>;
  boxU: ChannelRef<number>;
  arrU: ChannelRef<number>;
  arrTok: ChannelRef<number>;
  ctrlU: ChannelRef<number>;
  plotU: ChannelRef<number>;
  curveTok: ChannelRef<number>;
  kappaU: ChannelRef<number>;
  boundU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const chainU = tl.channel('chainU', 0);
  const flowTok = tl.channel('flowTok', 0); // backprop deposit 0..R
  const boxU = tl.channel('boxU', 0);
  const arrU = tl.channel('arrU', 0);
  const arrTok = tl.channel('arrTok', 0); // arrows laid head-to-tail 0..R
  const ctrlU = tl.channel('ctrlU', 0);
  const plotU = tl.channel('plotU', 0);
  const curveTok = tl.channel('curveTok', 0);
  const kappaU = tl.channel('kappaU', 0);
  const boundU = tl.channel('boundU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — one box, many deposits
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Train a standard network and each layer owns its gradient. Train a loop and something new happens: every visit sends a gradient back to the same shared weights.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_CHAIN, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(chainU, 1, { at: 1.0, dur: 1.2, ease: ease.draw });
  tl.tween(boxU, 1, { at: 2.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 7.1,
    dur: 5.4,
    text: 'The update to the block is the sum of all its visits. Eight visits, eight contributions, one parameter box.',
  });
  tl.tween(flowTok, R, { at: 7.4, dur: 5.0, ease: ease.linear });
  tl.hold(12.7, 0.7);

  // Beat 2 — the geometric question
  tl.caption({
    at: 13.4,
    dur: 5.2,
    text: 'So the key question is geometric. Do those eight contributions point in the same direction, or in random ones?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.6, dur: 1.3, ease: ease.move });
  tl.tween(arrU, 1, { at: 14.6, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 18.8,
    dur: 5.6,
    text: 'If visits were uncorrelated, the contributions would partly cancel, and the summed update would only grow like the square root of the visit count.',
  });
  tl.tween(ctrlU, 1, { at: 19.4, dur: 2.6, ease: ease.move });
  tl.hold(24.6, 0.6);

  // Beat 3 — computed: they align
  tl.caption({
    at: 25.2,
    dur: 6.4,
    text: 'But they are not uncorrelated. On our toy loop, computed exactly, the visits keep an average pairwise cosine around one half. They lean the same way.',
  });
  tl.tween(arrTok, R, { at: 25.6, dur: 4.6, ease: ease.linear });
  tl.caption({
    at: 31.8,
    dur: 6.2,
    text: 'Lay them head to tail and there is barely any cancellation. The shared update ends up nearly double the size of the random-direction baseline.',
  });
  tl.tween(plotU, 1, { at: 32.2, dur: 1.0, ease: ease.draw });
  tl.tween(curveTok, R, { at: 33.2, dur: 4.0, ease: ease.linear });
  tl.hold(38.2, 0.7);

  // Beat 4 — κ_R and the bound
  tl.caption({
    at: 38.9,
    dur: 6.4,
    text: 'The paper compresses this into one number, the visit-alignment coefficient. Zero means perfect cancellation. A value near the loop count means the visits compound.',
  });
  tl.tween(kappaU, 1, { at: 39.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.5,
    dur: 6.6,
    text: 'And it controls stability directly. To first order, the shift in the whole network output is bounded by depth, times alignment, times the squared update-to-residual ratio.',
  });
  tl.tween(boundU, 1, { at: 46.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 52.5,
    dur: 6.0,
    text: 'Keep that product order one and training is calm. Let it grow with the loop count and every visit amplifies the last. The fix has to live inside that ratio.',
  });
  tl.tween(dimU, 1, { at: 53.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.0, dur: 0.9, ease: ease.enter });
  tl.hold(58.7, 1.2);

  return {
    tl,
    cam,
    titleU,
    chainU,
    flowTok,
    boxU,
    arrU,
    arrTok,
    ctrlU,
    plotU,
    curveTok,
    kappaU,
    boundU,
    dimU,
    closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/visit-alignment/overrides.json',
  slug: 'visit-alignment',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function polyline(points: [number, number][], upTo: number): string {
  let x = ARR_CX - 190;
  let y = ARR_CY + 60;
  const parts = [`M ${x} ${y}`];
  for (let i = 0; i < Math.min(points.length, Math.ceil(upTo)); i++) {
    const u = clamp01(upTo - i);
    x += points[i][0] * ARR_SCALE * u;
    y -= points[i][1] * ARR_SCALE * u;
    parts.push(`L ${x} ${y}`);
  }
  return parts.join(' ');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const chainU = s.get(scene.chainU);
  const flowTok = s.get(scene.flowTok);
  const boxU = s.get(scene.boxU);
  const arrU = s.get(scene.arrU);
  const arrTok = s.get(scene.arrTok);
  const ctrlU = s.get(scene.ctrlU);
  const plotU = s.get(scene.plotU);
  const curveTok = s.get(scene.curveTok);
  const kappaU = s.get(scene.kappaU);
  const boundU = s.get(scene.boundU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const deposits = Math.min(R, flowTok);

  // real curve points visible up to curveTok
  const kShown = Math.min(R, Math.ceil(curveTok));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* unrolled chain of visits */}
          <g opacity={chainU}>
            <text x={CHAIN_X} y={CHAIN_Y - 40} fill={colors.TEXT} fontSize={18}>
              one block, unrolled: eight visits
            </text>
            {Array.from({ length: R }, (_, r) => (
              <g key={r}>
                <rect
                  x={CHAIN_X + r * CHAIN_STEP}
                  y={CHAIN_Y}
                  width={CHAIN_STEP - 12}
                  height={44}
                  rx={7}
                  fill={colors.ACCENT}
                  opacity={deposits > r ? 0.45 : 0.16}
                  stroke={colors.ACCENT}
                  strokeOpacity={0.6}
                />
                <text
                  x={CHAIN_X + r * CHAIN_STEP + (CHAIN_STEP - 12) / 2}
                  y={CHAIN_Y + 27}
                  textAnchor="middle"
                  fill={colors.TEXT}
                  fontSize={12}
                  fontFamily="monospace"
                >
                  r{r + 1}
                </text>
                {/* deposit line into the shared box */}
                {deposits > r && (
                  <line
                    x1={CHAIN_X + r * CHAIN_STEP + (CHAIN_STEP - 12) / 2}
                    y1={CHAIN_Y + 46}
                    x2={BOX_X + 60}
                    y2={BOX_Y}
                    stroke={colors.WARM}
                    strokeWidth={1.6}
                    opacity={0.35 + 0.5 * clamp01(deposits - r)}
                  />
                )}
              </g>
            ))}
          </g>
          {/* the shared parameter box */}
          <g opacity={boxU}>
            <rect x={BOX_X} y={BOX_Y} width={120} height={62} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.4} />
            <text x={BOX_X + 60} y={BOX_Y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
              shared W
            </text>
            <text x={BOX_X + 60} y={BOX_Y + 47} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              {deposits >= 1 ? `Σ of ${Math.floor(deposits)} visit${Math.floor(deposits) === 1 ? '' : 's'}` : 'one copy'}
            </text>
          </g>
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Gradients that compound
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          g = Σᵣ gᵣ · computed at d=8, R=8
        </text>
      </g>

      {/* right: head-to-tail arrows, real vs control */}
      <g opacity={arrU * mainOp}>
        <rect x={ARR_CX - 210} y={ARR_CY - 190} width={470} height={392} rx={12} fill={colors.PANEL} opacity={0.5} stroke={colors.GRID} />
        <text x={ARR_CX - 190} y={ARR_CY - 162} fill={colors.TEXT} fontSize={15}>
          per-visit gradients, head to tail (computed)
        </text>
        {/* control: scrambled signs */}
        <g opacity={ctrlU}>
          <path d={polyline(ARROWS_CTRL, ctrlU * R)} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="5 4" opacity={0.75} />
          <text x={ARR_CX - 190} y={ARR_CY + 172} fill={colors.MUTED} fontSize={12}>
            random directions: mostly cancels
          </text>
        </g>
        {/* real: aligned */}
        <path d={polyline(ARROWS_REAL, arrTok)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} />
        {arrTok >= R - 0.02 && (
          <text x={ARR_CX - 190} y={ARR_CY + 150} fill={colors.POSITIVE} fontSize={12}>
            the real visits: avg cosine {AVG_COS.toFixed(2)} — they compound
          </text>
        )}
      </g>

      {/* bottom-left plot: growth of the summed update */}
      <g opacity={plotU * mainOp}>
        <text x={120} y={412} fill={colors.TEXT} fontSize={15}>
          size of the summed update, as visits accumulate
        </text>
        <Axes x={PLOT_X} y={PLOT_Y} reveal={plotU} xTicks={4} yTicks={3} xLabel="visits summed" fontSize={11} />
        {/* control curve */}
        <path
          d={SUM_CTRL.slice(0, kShown)
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${PLOT_X(i + 1)} ${PLOT_Y(v)}`)
            .join(' ')}
          fill="none"
          stroke={colors.MUTED}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        {/* real curve */}
        <path
          d={SUM_REAL.slice(0, kShown)
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${PLOT_X(i + 1)} ${PLOT_Y(v)}`)
            .join(' ')}
          fill="none"
          stroke={colors.POSITIVE}
          strokeWidth={2.6}
        />
        {kShown >= R && (
          <>
            <text x={PLOT_X(R) + 6} y={PLOT_Y(SUM_REAL[R - 1]) + 4} fill={colors.POSITIVE} fontSize={12}>
              aligned: {SUM_REAL[R - 1].toFixed(1)}
            </text>
            <text x={PLOT_X(R) + 6} y={PLOT_Y(SUM_CTRL[R - 1]) + 4} fill={colors.MUTED} fontSize={12}>
              decorrelated: {SUM_CTRL[R - 1].toFixed(1)}
            </text>
          </>
        )}
      </g>

      {/* κ_R and the bound */}
      <MathLabel
        tex="0 \le \kappa_R \le R"
        x={760}
        y={92}
        fontSize={22}
        color={colors.WARM}
        opacity={kappaU * mainOp}
      />
      <MathLabel
        tex="\|\Delta F\| \le C\, M\, \kappa_R \left(\tfrac{\beta}{\alpha}\right)^{2}"
        x={985}
        y={92}
        fontSize={22}
        color={colors.SECONDARY}
        opacity={boundU * mainOp}
      />

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Aligned visits compound.
          </text>
          <MathLabel
            tex="M\,\kappa_R\,(\beta/\alpha)^2 = O(1)"
            x={640}
            y={340}
            fontSize={24}
            color={colors.SECONDARY}
            opacity={1}
            anchor="middle"
          />
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            Stability means keeping this product order one — the fix lives in β/α.
          </text>
        </g>
      )}
    </>
  );
}

export function VisitAlignment() {
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
