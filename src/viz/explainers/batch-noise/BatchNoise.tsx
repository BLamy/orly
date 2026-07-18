import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, ContourField, FunctionPlot, Vec } from '../../primitives';
import overrides from './overrides.json';
import {
  BUDGET,
  BUDGET_EXAMPLES,
  DATA_X,
  DATA_Y,
  FAN,
  FAN_MAX_PX,
  G_BAR,
  LOSS,
  N,
  PSCALE,
  RACE,
  RACE_STEPS,
  SPREADS,
  START,
  W_STAR,
  C_STAR,
  buildScene,
  cScale,
  lossAtStep,
  pathAt,
  wScale,
} from './scene';
import type { Pt, Run } from './scene';

/**
 * Batch Size and Noise — pure render. Every visual value comes from the
 * sampled SceneState or a module-scope precomputation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/batch-noise/overrides.json', slug: 'batch-noise' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// runner palette: one color per batch size, reused by rings, trails, curves
const RUN_COLORS = [colors.NEGATIVE, colors.WARM, colors.ACCENT] as const;
const RUN_LABELS = ['batch 1', 'batch 8', 'batch 64'] as const;

// — contour depth ramp (deep = bright, high = dim), as in the descent scene
const THRESHOLDS = 14;
const contourColor = (_level: number, i: number): string =>
  colors.heat(0.85 - (0.6 * i) / (THRESHOLDS - 1));

// — the probe point in stage coords
const PX = wScale(START[0]);
const PY = cScale(START[1]);

/** Screen tip of a gradient's pull (−g), at PSCALE px per gradient unit. */
function pullTip(g: Pt, cap = Infinity): Pt {
  const len = Math.hypot(g[0], g[1]) * PSCALE;
  const s = len > cap ? cap / len : 1;
  // param c increases upward on screen, so screen dy = +g_c · PSCALE
  return [PX - g[0] * PSCALE * s, PY + g[1] * PSCALE * s];
}

const FAN_TIPS: Pt[] = FAN.map((g) => pullTip(g, FAN_MAX_PX));
const AVG_TIP: Pt = pullTip(G_BAR);
const FAN_STAGGER = 0.6;

// — the data panel (screen-fixed, top-right)
const DP = { x: 872, y: 54, w: 372, h: 276 } as const;
const [DY_MIN, DY_MAX] = (() => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const y of DATA_Y) {
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  return [lo - 0.5, hi + 0.5];
})();
const dx = scaleLinear().domain([-2.3, 2.3]).range([DP.x + 22, DP.x + DP.w - 22]);
const dy = scaleLinear().domain([DY_MIN, DY_MAX]).range([DP.y + DP.h - 20, DP.y + 24]);

// — the loss-per-example panel (screen-fixed, right; camera parks field left)
const LP = { x: 928, y: 100, w: 336, h: 520 } as const;
const xEx = scaleLinear().domain([0, BUDGET_EXAMPLES]).range([LP.x + 44, LP.x + LP.w - 24]);
const yLo = scaleLinear().domain([0, 3.2]).range([LP.y + 470, LP.y + 138]);
const fBudget = BUDGET.map(
  (run) =>
    (ex: number): number =>
      lossAtStep(run.loss, ex / run.b),
);

/** Trajectory polyline between fractional step indices (stage coords). */
function traceD(pts: readonly Pt[], to: number): string {
  if (to <= 0) return '';
  const b = Math.min(pts.length - 1, to);
  const bi = Math.floor(b);
  const parts: string[] = [`M${wScale(pts[0][0]).toFixed(1)} ${cScale(pts[0][1]).toFixed(1)}`];
  for (let i = 1; i <= bi; i++) {
    parts.push(`L${wScale(pts[i][0]).toFixed(1)} ${cScale(pts[i][1]).toFixed(1)}`);
  }
  if (b > bi && bi + 1 < pts.length) {
    const t = b - bi;
    const p = pts[bi];
    const q = pts[bi + 1];
    parts.push(
      `L${wScale(p[0] + (q[0] - p[0]) * t).toFixed(1)} ${cScale(p[1] + (q[1] - p[1]) * t).toFixed(1)}`,
    );
  }
  return parts.join('');
}

function Runner({ run, prog, u, color }: { run: Run; prog: number; u: number; color: string }) {
  if (u <= 0) return null;
  const [w, c] = pathAt(run.pts, prog);
  const cx = wScale(w);
  const cy = cScale(c);
  return (
    <g opacity={u}>
      <path
        d={traceD(run.pts, clamp01(prog) * RACE_STEPS)}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
        opacity={0.6}
      />
      <circle cx={cx} cy={cy} r={15} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={7.5} fill={color} stroke={colors.BG} strokeWidth={1.5} />
    </g>
  );
}

function LegendChip({ x, y, color, label, u }: { x: number; y: number; color: string; label: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y - 6} width={18} height={4} rx={2} fill={color} />
      <text x={x + 26} y={y} fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dataU = s.get(scene.dataU);
  const dataOp = s.get(scene.dataOp);
  const lineU = s.get(scene.lineU);
  const contourU = s.get(scene.contourU);
  const fieldOp = s.get(scene.fieldOp);
  const starU = s.get(scene.starU);
  const fanU = s.get(scene.fanU);
  const fanOp = s.get(scene.fanOp);
  const avgU = s.get(scene.avgU);
  const avgOp = s.get(scene.avgOp);
  const ellU = s.get(scene.ellU);
  const sigTexU = s.get(scene.sigTexU);
  const runnersU = s.get(scene.runnersU);
  const raceProg = s.get(scene.raceProg);
  const raceOp = s.get(scene.raceOp);
  const panelU = s.get(scene.panelU);
  const curveU = s.get(scene.curveU);
  const legendU = s.get(scene.legendU);
  const endU = s.get(scene.endU);

  // the data-panel line tracks the batch-64 runner once the race starts
  const [lw, lc] = pathAt(RACE[2].pts, raceProg);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* parameter space: the loss bowl over (w, c) */}
        <g opacity={fieldOp}>
          <ContourField
            f={LOSS}
            x={wScale}
            y={cScale}
            thresholds={THRESHOLDS}
            gridN={100}
            reveal={contourU}
            color={contourColor}
          />
          <MathLabel tex="w" x={1236} y={cScale(-0.28)} fontSize={22} color={colors.MUTED} opacity={contourU} />
          <MathLabel tex="c" x={wScale(-1.66)} y={72} fontSize={22} color={colors.MUTED} opacity={contourU} />
        </g>

        {/* the best-fit minimum */}
        {starU > 0 && (
          <g opacity={starU * fieldOp}>
            <circle
              cx={wScale(W_STAR)}
              cy={cScale(C_STAR)}
              r={7}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={2.2}
            />
            <circle cx={wScale(W_STAR)} cy={cScale(C_STAR)} r={2.4} fill={colors.POSITIVE} />
            <MathLabel
              tex="(w^\star,\,c^\star)"
              x={wScale(W_STAR) + 74}
              y={cScale(C_STAR) + 30}
              fontSize={19}
              color={colors.POSITIVE}
              opacity={starU}
            />
          </g>
        )}

        {/* the probe point + fan of per-example pulls */}
        {fanU > 0 && fanOp > 0 && (
          <g>
            {FAN_TIPS.map(([tx, ty], i) => (
              <Vec
                key={i}
                x1={PX}
                y1={PY}
                x2={tx}
                y2={ty}
                grow={clamp01(fanU * (1 + FAN_STAGGER) - (i / (N - 1)) * FAN_STAGGER)}
                color={colors.SECONDARY}
                width={1.6}
                head={6}
                opacity={0.5 * fanOp}
              />
            ))}
            <circle
              cx={PX}
              cy={PY}
              r={9}
              fill="none"
              stroke={colors.TEXT}
              strokeWidth={1.8}
              strokeDasharray="3 3"
              opacity={fanOp}
            />
            <MathLabel
              tex="(w_0,\,c_0)"
              x={PX - 62}
              y={PY - 26}
              fontSize={18}
              opacity={fanU * fanOp}
            />
          </g>
        )}

        {/* the average pull: the true gradient */}
        {avgU > 0 && avgOp > 0 && (
          <g>
            <Vec
              x1={PX}
              y1={PY}
              x2={AVG_TIP[0]}
              y2={AVG_TIP[1]}
              grow={avgU}
              color={colors.TEAL}
              width={4.2}
              head={12}
              opacity={avgOp}
            />
            <MathLabel
              tex="-\nabla L"
              x={AVG_TIP[0] + 44}
              y={AVG_TIP[1] + 26}
              fontSize={20}
              color={colors.TEAL}
              opacity={avgU * avgOp}
            />
          </g>
        )}

        {/* measured spread of the batch-mean estimate, one ring per B */}
        {ellU > 0 && (
          <g>
            {SPREADS.map((sp, i) => {
              const u = clamp01(ellU * 3 - i);
              return (
                <g key={sp.b} opacity={u}>
                  <ellipse
                    cx={AVG_TIP[0]}
                    cy={AVG_TIP[1]}
                    rx={sp.sw * PSCALE * u}
                    ry={sp.sc * PSCALE * u}
                    fill={RUN_COLORS[i]}
                    fillOpacity={0.05}
                    stroke={RUN_COLORS[i]}
                    strokeWidth={1.8}
                    strokeDasharray="5 4"
                  />
                  <text
                    x={AVG_TIP[0] + sp.sw * PSCALE * 0.72 + 8}
                    y={AVG_TIP[1] - sp.sc * PSCALE * 0.72}
                    fill={RUN_COLORS[i]}
                    fontSize={14}
                  >
                    {RUN_LABELS[i]}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* the race: three SGD runs, same start, same learning rate */}
        <g opacity={raceOp}>
          {RACE.map((run, i) => (
            <Runner key={run.b} run={run} prog={raceProg} u={runnersU} color={RUN_COLORS[i]} />
          ))}
        </g>
      </Camera>

      {/* σ/√B annotation near the rings (screen-fixed so it never skews) */}
      <MathLabel
        tex="\text{spread of } \hat g \;\approx\; \frac{\sigma}{\sqrt{B}}"
        x={330}
        y={560}
        fontSize={24}
        color={colors.TEXT}
        opacity={sigTexU}
      />

      {/* race legend */}
      {runnersU > 0 && raceOp > 0.5 && (
        <g opacity={runnersU}>
          <LegendChip x={46} y={56} color={RUN_COLORS[0]} label="batch 1" u={1} />
          <LegendChip x={46} y={80} color={RUN_COLORS[1]} label="batch 8" u={1} />
          <LegendChip x={46} y={104} color={RUN_COLORS[2]} label="batch 64" u={1} />
        </g>
      )}

      {/* the data panel: 64 points and the line being fitted */}
      {dataU > 0 && dataOp > 0 && (
        <g opacity={dataOp}>
          <rect
            x={DP.x}
            y={DP.y}
            width={DP.w}
            height={DP.h}
            rx={12}
            fill={colors.PANEL}
            opacity={0.88}
            stroke={colors.GRID}
          />
          <text x={DP.x + 20} y={DP.y + DP.h - 8} fill={colors.MUTED} fontSize={12}>
            the data: 64 points
          </text>
          <MathLabel
            tex="y \approx w\,x + c"
            x={DP.x + 78}
            y={DP.y + 22}
            fontSize={16}
            color={colors.MUTED}
            opacity={lineU}
          />
          {DATA_X.map((xv, i) => (
            <circle
              key={i}
              cx={dx(xv)}
              cy={dy(DATA_Y[i])}
              r={3 * clamp01(dataU * (1 + 1.2) - (i / (N - 1)) * 1.2)}
              fill={colors.ACCENT}
              opacity={0.75}
            />
          ))}
          {lineU > 0 && (
            <line
              x1={dx(-2.3)}
              y1={dy(lw * -2.3 + lc)}
              x2={dx(-2.3 + 4.6 * lineU)}
              y2={dy(lw * (-2.3 + 4.6 * lineU) + lc)}
              stroke={colors.WARM}
              strokeWidth={2.6}
            />
          )}
        </g>
      )}

      {/* screen-fixed loss formula (top-left, clear of the data panel) */}
      <MathLabel
        tex="L(w,c)=\tfrac{1}{64}\sum_i \tfrac{1}{2}\,(w x_i + c - y_i)^2"
        x={250}
        y={64}
        fontSize={19}
        opacity={s.get(scene.lossTexU)}
      />

      {/* the honest-cost panel: loss per example seen */}
      {panelU > 0 && (
        <g opacity={panelU}>
          <rect
            x={LP.x}
            y={LP.y}
            width={LP.w}
            height={LP.h}
            rx={12}
            fill={colors.PANEL}
            opacity={0.88}
            stroke={colors.GRID}
          />
          <text x={LP.x + 26} y={LP.y + 38} fill={colors.TEXT} fontSize={17}>
            loss per example seen
          </text>
          <LegendChip x={LP.x + 26} y={LP.y + 66} color={RUN_COLORS[0]} label="batch 1" u={legendU} />
          <LegendChip x={LP.x + 26} y={LP.y + 88} color={RUN_COLORS[1]} label="batch 8" u={legendU} />
          <LegendChip x={LP.x + 26} y={LP.y + 110} color={RUN_COLORS[2]} label="batch 64" u={legendU} />
          <Axes
            x={xEx}
            y={yLo}
            reveal={panelU}
            xTicks={4}
            yTicks={4}
            xLabel="examples seen"
            fontSize={11}
          />
          {BUDGET.map((run, i) => (
            <FunctionPlot
              key={run.b}
              x={xEx}
              y={yLo}
              f={fBudget[i]}
              domain={[0, BUDGET_EXAMPLES]}
              samples={320}
              reveal={curveU}
              color={RUN_COLORS[i]}
              width={2.4}
            />
          ))}
          {/* batch 64 pays 64 examples per step — mark its 10 actual steps */}
          {BUDGET[2].loss.map((lo, k) =>
            k === 0 || (k * 64) / BUDGET_EXAMPLES > curveU ? null : (
              <circle key={k} cx={xEx(k * 64)} cy={yLo(lo)} r={3.4} fill={RUN_COLORS[2]} />
            ),
          )}
        </g>
      )}

      {/* closing card */}
      <MathLabel
        tex="\text{noise} \;\propto\; \frac{\sigma}{\sqrt{B}} \qquad\quad \text{cost} \;\propto\; B"
        x={640}
        y={330}
        fontSize={34}
        opacity={endU}
      />
    </>
  );
}

export function BatchNoise() {
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
