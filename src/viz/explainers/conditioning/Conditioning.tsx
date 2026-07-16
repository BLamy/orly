import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { ContourField, FunctionPlot, Vec } from '../../primitives';
import overrides from './overrides.json';
import {
  ADAM,
  DIV,
  GOOD,
  LAM_MAX,
  LAM_MIN,
  MOMENTUM,
  SMALL,
  START,
  STEPS_MOM,
  STEPS_SHALLOW_SAFE,
  STEPS_STEEP_SAFE,
  bowlAt,
  buildScene,
  pathAt,
  xScale,
  yScale,
} from './scene';
import type { Pt } from './scene';

/**
 * Ill-Conditioning — why stretched valleys break gradient descent.
 * Pure render: every visual value comes from the sampled SceneState or a
 * module-scope closed-form computation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/conditioning/overrides.json', slug: 'conditioning' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// — contours: depth ramp on the core heat scale (deep = bright, rim = dim)
const THRESHOLDS = 14;
const contourColor = (_level: number, i: number): string =>
  colors.heat(0.88 - (0.6 * i) / (THRESHOLDS - 1));

/** Path `d` for a trajectory polyline up to (fractional) step index `to`. */
function traceD(pts: readonly Pt[], to: number): string {
  if (to <= 0) return '';
  const b = Math.min(pts.length - 1, to);
  const bi = Math.floor(b);
  const parts: string[] = [`M${xScale(pts[0][0]).toFixed(1)} ${yScale(pts[0][1]).toFixed(1)}`];
  for (let i = 1; i <= bi; i++) {
    parts.push(`L${xScale(pts[i][0]).toFixed(1)} ${yScale(pts[i][1]).toFixed(1)}`);
  }
  if (b > bi && bi + 1 < pts.length) {
    const t = b - bi;
    const p = pts[bi];
    const q = pts[bi + 1];
    parts.push(
      `L${xScale(p[0] + (q[0] - p[0]) * t).toFixed(1)} ${yScale(p[1] + (q[1] - p[1]) * t).toFixed(1)}`,
    );
  }
  return parts.join('');
}

function Trail({
  pts,
  prog,
  u,
  color,
}: {
  pts: readonly Pt[];
  prog: number;
  u: number;
  color: string;
}) {
  if (u <= 0 || prog <= 0) return null;
  const idx = clamp01(prog) * (pts.length - 1);
  const [hx, hy] = pathAt(pts, prog);
  return (
    <g opacity={u}>
      <path
        d={traceD(pts, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinejoin="round"
        opacity={0.75}
      />
      <circle cx={xScale(hx)} cy={yScale(hy)} r={15} fill={color} opacity={0.2} />
      <circle
        cx={xScale(hx)}
        cy={yScale(hy)}
        r={7.5}
        fill={color}
        stroke={colors.BG}
        strokeWidth={1.5}
      />
    </g>
  );
}

// — the per-axis panels (screen space) ————————————————————————————————————
const PANEL = { y: 104, w: 470, h: 380 } as const;
const PANEL_L_X = 128;
const PANEL_R_X = 682;
const CURVE_MAX = 13; // shared y-domain so the steep parabola reads as steep

const fShallow = (v: number): number => 0.5 * LAM_MIN * v * v;
const fSteep = (v: number): number => 0.5 * LAM_MAX * v * v;

// shared η track under each panel: η ∈ [0, 0.12] (2/λmax = 0.08 sits inside)
const ETA_LO = 0;
const ETA_HI = 0.12;
const ETA_SHARED = 1 / LAM_MAX; // 0.04 — the single knob both axes must share
const TRACK_Y = 548;

function AxisPanel({
  px,
  u,
  winU,
  countU,
  lam,
  f,
  safeEnd,
  windowNote,
  steps,
  color,
}: {
  px: number;
  u: number;
  winU: number;
  countU: number;
  lam: number;
  f: (v: number) => number;
  safeEnd: number; // 2/λ, clamped into the track
  windowNote: string;
  steps: number;
  color: string;
}) {
  if (u <= 0) return null;
  const xP = scaleLinear().domain([-1, 1]).range([px + 44, px + PANEL.w - 44]);
  const yP = scaleLinear()
    .domain([0, CURVE_MAX])
    .range([PANEL.y + PANEL.h - 48, PANEL.y + 34]);
  const xEta = scaleLinear().domain([ETA_LO, ETA_HI]).range([px + 44, px + PANEL.w - 44]);
  const winEnd = Math.min(safeEnd, ETA_HI);
  return (
    <g opacity={u}>
      <rect
        x={px}
        y={PANEL.y}
        width={PANEL.w}
        height={PANEL.h}
        rx={12}
        fill={colors.PANEL}
        opacity={0.88}
        stroke={colors.GRID}
      />
      <FunctionPlot x={xP} y={yP} f={f} samples={200} reveal={u} color={color} width={2.6} />
      <MathLabel
        tex={`\\lambda = ${lam}`}
        x={px + PANEL.w / 2}
        y={PANEL.y + 306}
        fontSize={21}
        color={color}
        opacity={u}
      />
      {/* iteration count (real, computed in scene.ts) */}
      <text
        x={px + PANEL.w / 2}
        y={PANEL.y + 348}
        textAnchor="middle"
        fill={colors.TEXT}
        fontSize={16}
        opacity={countU}
      >
        {steps === 1 ? 'arrives in 1 step' : `arrives in ${steps} steps`}
      </text>

      {/* the safe learning-rate window for this axis */}
      <g opacity={winU}>
        <line
          x1={xEta(ETA_LO)}
          y1={TRACK_Y}
          x2={xEta(ETA_HI)}
          y2={TRACK_Y}
          stroke={colors.GRID}
          strokeWidth={3}
        />
        <rect
          x={xEta(ETA_LO)}
          y={TRACK_Y - 7}
          width={Math.max(0, (xEta(winEnd) - xEta(ETA_LO)) * winU)}
          height={14}
          rx={4}
          fill={colors.POSITIVE}
          opacity={0.32}
        />
        <MathLabel
          tex={`\\eta < 2/\\lambda`}
          x={px + 108}
          y={TRACK_Y - 24}
          fontSize={15}
          color={colors.POSITIVE}
          opacity={winU}
        />
        <text
          x={px + PANEL.w - 44}
          y={TRACK_Y - 18}
          textAnchor="end"
          fill={colors.MUTED}
          fontSize={13}
          opacity={winU}
        >
          {windowNote}
        </text>
        {/* the single shared η, forced to live in the steep axis's window */}
        <line
          x1={xEta(ETA_SHARED)}
          y1={TRACK_Y - 13}
          x2={xEta(ETA_SHARED)}
          y2={TRACK_Y + 13}
          stroke={colors.WARM}
          strokeWidth={3}
        />
        <MathLabel
          tex={'\\eta'}
          x={xEta(ETA_SHARED)}
          y={TRACK_Y + 32}
          fontSize={16}
          color={colors.WARM}
          opacity={winU}
        />
      </g>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bowlU = s.get(scene.bowlU);
  const bowlDim = s.get(scene.bowlDim);
  const eigU = s.get(scene.eigU);
  const startU = s.get(scene.startU);
  const morphU = s.get(scene.morphU);
  const panelU = s.get(scene.panelU);
  const winU = s.get(scene.winU);
  const countU = s.get(scene.countU);
  const recapU = s.get(scene.recapU);

  const smallU = s.get(scene.smallU);
  const smallProg = s.get(scene.smallProg);
  const divU = s.get(scene.divU);
  const divProg = s.get(scene.divProg);
  const goodU = s.get(scene.goodU);
  const goodProg = s.get(scene.goodProg);
  const momU = s.get(scene.momU);
  const momProg = s.get(scene.momProg);
  const adamU = s.get(scene.adamU);
  const adamProg = s.get(scene.adamProg);

  // preconditioning morph: the steep eigenvalue is rescaled 25 → 1
  const bEff = LAM_MAX + (LAM_MIN - LAM_MAX) * clamp01(morphU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={bowlDim}>
          <ContourField
            f={bowlAt(bEff)}
            x={xScale}
            y={yScale}
            thresholds={THRESHOLDS}
            gridN={100}
            reveal={bowlU}
            color={contourColor}
          />

          {/* the two principal curvatures (eigen-directions of the Hessian) */}
          {eigU > 0 && (
            <g>
              <Vec
                x1={xScale(0)}
                y1={yScale(0)}
                x2={xScale(1.5)}
                y2={yScale(0)}
                grow={eigU}
                color={colors.ACCENT}
                width={2.8}
                head={9}
                opacity={eigU}
              />
              <MathLabel
                tex={'\\lambda_{\\min} = 1'}
                x={xScale(1.55)}
                y={yScale(0) + 30}
                anchor="start"
                fontSize={19}
                color={colors.ACCENT}
                opacity={eigU}
              />
              <Vec
                x1={xScale(0)}
                y1={yScale(0)}
                x2={xScale(0)}
                y2={yScale(0.62)}
                grow={eigU}
                color={colors.NEGATIVE}
                width={2.8}
                head={9}
                opacity={eigU}
              />
              <MathLabel
                tex={'\\lambda_{\\max} = 25'}
                x={xScale(0.12)}
                y={yScale(0.62) - 18}
                anchor="start"
                fontSize={19}
                color={colors.NEGATIVE}
                opacity={eigU}
              />
            </g>
          )}

          {/* shared start */}
          <g opacity={startU}>
            <circle
              cx={xScale(START[0])}
              cy={yScale(START[1])}
              r={11}
              fill="none"
              stroke={colors.TEXT}
              strokeWidth={1.8}
              strokeDasharray="3 3"
            />
            <MathLabel
              tex={'\\theta_0'}
              x={xScale(START[0]) + 34}
              y={yScale(START[1]) - 14}
              fontSize={19}
              opacity={startU}
            />
          </g>

          {/* three exact gradient-descent runs — the η sweep */}
          <Trail pts={SMALL} prog={smallProg} u={smallU} color={colors.ACCENT} />
          {smallU > 0 && smallProg > 0.12 && (
            <MathLabel
              tex={'\\eta = 0.01'}
              x={xScale(-1.7)}
              y={yScale(0) + 42}
              fontSize={17}
              color={colors.ACCENT}
              opacity={smallU}
            />
          )}
          <Trail pts={DIV} prog={divProg} u={divU} color={colors.NEGATIVE} />
          {divU > 0 && divProg > 0.12 && (
            <MathLabel
              tex={'\\eta = 0.084 > 2/\\lambda_{\\max}'}
              x={xScale(-2.4)}
              y={yScale(-1.25)}
              anchor="start"
              fontSize={17}
              color={colors.NEGATIVE}
              opacity={divU}
            />
          )}
          <Trail pts={GOOD} prog={goodProg} u={goodU} color={colors.POSITIVE} />
          {goodU > 0 && goodProg > 0.12 && (
            <MathLabel
              tex={'\\eta^\\ast \\approx 0.077'}
              x={xScale(-1.1)}
              y={yScale(0.75)}
              anchor="start"
              fontSize={17}
              color={colors.POSITIVE}
              opacity={goodU}
            />
          )}

          {/* momentum + Adam on the same bowl */}
          <Trail pts={MOMENTUM} prog={momProg} u={momU} color={colors.SECONDARY} />
          <Trail pts={ADAM} prog={adamProg} u={adamU} color={colors.WARM} />
        </g>
      </Camera>

      {/* screen-fixed math labels (top strip, clear of the caption band) */}
      <MathLabel
        tex={'L(x,y)=\\tfrac{1}{2}\\left(x^2+25\\,y^2\\right)'}
        x={946}
        y={58}
        anchor="start"
        fontSize={21}
        opacity={s.get(scene.lossTexU)}
      />
      <MathLabel
        tex={'\\kappa = \\lambda_{\\max}/\\lambda_{\\min} = 25'}
        x={946}
        y={102}
        anchor="start"
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.kappaTexU)}
      />
      <MathLabel
        tex={'\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta)'}
        x={946}
        y={146}
        anchor="start"
        fontSize={19}
        color={colors.MUTED}
        opacity={s.get(scene.ruleTexU)}
      />
      <MathLabel
        tex={'v \\leftarrow \\beta v - \\eta\\nabla L,\\quad \\theta \\leftarrow \\theta + v'}
        x={946}
        y={102}
        anchor="start"
        fontSize={19}
        color={colors.SECONDARY}
        opacity={s.get(scene.momTexU)}
      />
      <MathLabel
        tex={`\\kappa \\to \\sqrt{\\kappa}: \\;\\; ${STEPS_MOM}\\ \\text{steps}`}
        x={946}
        y={146}
        anchor="start"
        fontSize={19}
        color={colors.SECONDARY}
        opacity={s.get(scene.sqrtTexU)}
      />
      <MathLabel
        tex={'\\theta \\leftarrow \\theta - \\eta\\,\\hat m/(\\sqrt{\\hat v}+\\varepsilon)'}
        x={946}
        y={190}
        anchor="start"
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.adamTexU)}
      />

      {/* per-axis panels */}
      <AxisPanel
        px={PANEL_L_X}
        u={panelU}
        winU={winU}
        countU={countU}
        lam={LAM_MIN}
        f={fShallow}
        safeEnd={2 / LAM_MIN}
        windowNote="safe all the way to 2"
        steps={STEPS_SHALLOW_SAFE}
        color={colors.ACCENT}
      />
      <AxisPanel
        px={PANEL_R_X}
        u={panelU}
        winU={winU}
        countU={countU}
        lam={LAM_MAX}
        f={fSteep}
        safeEnd={2 / LAM_MAX}
        windowNote="safe only below 0.08"
        steps={STEPS_STEEP_SAFE}
        color={colors.NEGATIVE}
      />
      {panelU > 0 && (
        <>
          <text
            x={PANEL_L_X + PANEL.w / 2}
            y={PANEL.y + 26 - 44}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={15}
            opacity={panelU}
          >
            the shallow axis
          </text>
          <text
            x={PANEL_R_X + PANEL.w / 2}
            y={PANEL.y + 26 - 44}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={15}
            opacity={panelU}
          >
            the steep axis
          </text>
        </>
      )}

      {/* recap card */}
      {recapU > 0 && (
        <g opacity={recapU}>
          <MathLabel
            tex={'\\kappa = \\lambda_{\\max}/\\lambda_{\\min}'}
            x={STAGE_W / 2}
            y={300}
            fontSize={34}
            color={colors.WARM}
          />
          <text
            x={STAGE_W / 2}
            y={366}
            textAnchor="middle"
            fill={colors.TEXT}
            fontSize={20}
          >
            the condition number is the slowdown factor
          </text>
        </g>
      )}
    </>
  );
}

export function Conditioning() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
