import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import type { SceneState } from '../../core';
import { Axes, ContourField, FunctionPlot, Vec } from '../../primitives';
import {
  ADAM,
  FLOW,
  GD,
  LOSS,
  MOMENTUM,
  N_STEPS,
  PROBE_INDEX,
  START,
  buildScene,
  lossAtStep,
  pathAt,
  xScale,
  yScale,
} from './scene';
import type { Pt, Run } from './scene';

/**
 * Gradient Descent — The Shape of Learning.
 * Pure render: every visual value comes from the sampled SceneState (or a
 * module-scope precomputation in scene.ts). No local clocks, no randomness.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/gradient-descent/overrides.json', slug: 'gradient-descent' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** px per landscape unit (uniform in x and y) */
const UNIT = xScale(1) - xScale(0);

// — contours: a depth ramp on the core heat scale (deep = bright, high = dim)
const THRESHOLDS = 16;
const contourColor = (_level: number, i: number): string =>
  colors.heat(0.88 - (0.62 * i) / (THRESHOLDS - 1));

// — the −∇L arrow field
const FIELD_STAGGER = 0.55;
const arrowLen = (mag: number): number => 10 + 38 * Math.min(1, Math.sqrt(mag / 2.4));

// — momentum's velocity vector display
const VEL_SCALE = 1.6;
const VEL_MAX_PX = 90;

// — the comparison panel (screen space, right ~28% of the stage)
const PANEL_X = 928;
const PANEL_Y = 100;
const PANEL_W = 336;
const PANEL_H = 520;
const xPanel = scaleLinear().domain([0, N_STEPS]).range([PANEL_X + 34, PANEL_X + PANEL_W - 26]);
const yPanel = scaleLinear().domain([-1.3, 1.3]).range([PANEL_Y + 476, PANEL_Y + 140]);
const fGdLoss = (s: number): number => lossAtStep(GD.loss, s);
const fMomLoss = (s: number): number => lossAtStep(MOMENTUM.loss, s);
const fAdamLoss = (s: number): number => lossAtStep(ADAM.loss, s);

/** Path `d` for the trajectory polyline between (fractional) step indices. */
function traceD(pts: readonly Pt[], from: number, to: number): string {
  if (to <= 0) return '';
  const a = Math.max(0, Math.floor(from));
  const b = Math.min(pts.length - 1, to);
  const bi = Math.floor(b);
  if (bi < a) return '';
  const parts: string[] = [`M${xScale(pts[a][0]).toFixed(1)} ${yScale(pts[a][1]).toFixed(1)}`];
  for (let i = a + 1; i <= bi; i++) {
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

const RECENT = 60; // the bright "recent" window of the trail, in steps

function Trail({ run, prog, u, color }: { run: Run; prog: number; u: number; color: string }) {
  if (u <= 0 || prog <= 0) return null;
  const idx = clamp01(prog) * N_STEPS;
  return (
    <g>
      <path
        d={traceD(run.pts, 0, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={0.3 * u}
      />
      <path
        d={traceD(run.pts, idx - RECENT, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        opacity={0.85 * u}
      />
    </g>
  );
}

function Ball({ p, u, color }: { p: Pt; u: number; color: string }) {
  if (u <= 0) return null;
  const [cx, cy] = [xScale(p[0]), yScale(p[1])];
  return (
    <g opacity={Math.min(1, u)}>
      <circle cx={cx} cy={cy} r={17} fill={color} opacity={0.22} />
      <circle cx={cx} cy={cy} r={8.5 * u} fill={color} stroke={colors.BG} strokeWidth={1.5} />
    </g>
  );
}

function LegendRow({ y, color, label, u }: { y: number; color: string; label: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={PANEL_X + 26} y={y - 6} width={18} height={4} rx={2} fill={color} />
      <text x={PANEL_X + 52} y={y} fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const fieldGrow = s.get(scene.fieldGrow);
  const fieldOp = s.get(scene.fieldOp);
  const probeU = s.get(scene.probeU);
  const basinU = s.get(scene.basinU);
  const startU = s.get(scene.startU);

  const gdProg = s.get(scene.gdProg);
  const gdU = s.get(scene.gdU);
  const momProg = s.get(scene.momProg);
  const momU = s.get(scene.momU);
  const velU = s.get(scene.velU);
  const adamProg = s.get(scene.adamProg);
  const adamU = s.get(scene.adamU);
  const ellipseU = s.get(scene.ellipseU);

  const panelU = s.get(scene.panelU);
  const curveReveal = s.get(scene.curveReveal);
  const legendU = s.get(scene.legendU);

  const gdP = pathAt(GD.pts, gdProg);
  const momP = pathAt(MOMENTUM.pts, momProg);
  const adamP = pathAt(ADAM.pts, adamProg);

  // momentum's velocity arrow (capped so the slingshot stays readable)
  const [mvx, mvy] = pathAt(MOMENTUM.vel, momProg);
  const velPx = Math.hypot(mvx, mvy) * UNIT * VEL_SCALE;
  const velCap = velPx > VEL_MAX_PX ? VEL_MAX_PX / velPx : 1;

  // Adam's per-axis step-size ellipse
  const [emaX, emaY] = pathAt(ADAM.ema, adamProg);

  const probe = FLOW[PROBE_INDEX];
  const probeX = xScale(probe.x);
  const probeY = yScale(probe.y);
  const probeLen = arrowLen(probe.mag);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <ContourField
          f={LOSS}
          x={xScale}
          y={yScale}
          thresholds={THRESHOLDS}
          gridN={110}
          reveal={s.get(scene.contourReveal)}
          color={contourColor}
        />

        {/* landscape annotations */}
        <g opacity={basinU}>
          <text
            x={xScale(0.4)}
            y={yScale(1.15) - 36}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={17}
            fontStyle="italic"
          >
            a shallow valley
          </text>
          <text
            x={xScale(2.2)}
            y={yScale(0.08)}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={17}
            fontStyle="italic"
          >
            the deep valley
          </text>
        </g>

        {/* the −∇L field (finite differences, precomputed) */}
        {fieldOp > 0 && fieldGrow > 0 && (
          <g>
            {FLOW.map((a, i) => {
              const grow = clamp01(
                fieldGrow * (1 + FIELD_STAGGER) - (i / (FLOW.length - 1)) * FIELD_STAGGER,
              );
              const len = arrowLen(a.mag);
              return (
                <Vec
                  key={i}
                  x1={xScale(a.x)}
                  y1={yScale(a.y)}
                  x2={xScale(a.x) + a.ux * len}
                  y2={yScale(a.y) - a.uy * len}
                  grow={grow}
                  color={colors.MUTED}
                  width={2.2}
                  head={8}
                  opacity={fieldOp}
                />
              );
            })}
          </g>
        )}

        {/* the probe point: one arrow, examined */}
        {probeU > 0 && (
          <g>
            <circle
              cx={probeX}
              cy={probeY}
              r={10}
              fill="none"
              stroke={colors.TEAL}
              strokeWidth={2}
              opacity={probeU}
            />
            <Vec
              x1={probeX}
              y1={probeY}
              x2={probeX + probe.ux * probeLen}
              y2={probeY - probe.uy * probeLen}
              color={colors.TEAL}
              width={3.4}
              head={10}
              opacity={probeU}
            />
            <MathLabel
              tex="-\nabla L(\theta)"
              x={probeX + 84}
              y={probeY + 32}
              fontSize={21}
              color={colors.TEAL}
              opacity={probeU}
            />
          </g>
        )}

        {/* the shared starting point */}
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
            tex="\theta_0"
            x={xScale(START[0]) + 36}
            y={yScale(START[1]) + 8}
            fontSize={19}
            opacity={startU}
          />
        </g>

        {/* vanilla gradient descent — rattles across the walls, crawls */}
        <Trail run={GD} prog={gdProg} u={gdU} color={colors.ACCENT} />
        <Ball p={gdP} u={gdU} color={colors.ACCENT} />

        {/* momentum — heavy ball, velocity drawn on */}
        <Trail run={MOMENTUM} prog={momProg} u={momU} color={colors.POSITIVE} />
        {velU > 0 && momU > 0 && velPx > 1.5 && (
          <Vec
            x1={xScale(momP[0])}
            y1={yScale(momP[1])}
            x2={xScale(momP[0]) + mvx * UNIT * VEL_SCALE * velCap}
            y2={yScale(momP[1]) - mvy * UNIT * VEL_SCALE * velCap}
            color={colors.POSITIVE}
            width={2.6}
            head={9}
            label="v"
            opacity={velU * Math.min(1, momU)}
          />
        )}
        <Ball p={momP} u={momU} color={colors.POSITIVE} />

        {/* Adam — per-axis step-size ellipse around the ball */}
        {ellipseU > 0 && adamU > 0 && (
          <ellipse
            cx={xScale(adamP[0])}
            cy={yScale(adamP[1])}
            rx={(0.006 + emaX * 4.5) * UNIT}
            ry={(0.006 + emaY * 4.5) * UNIT}
            fill={colors.WARM}
            fillOpacity={0.08}
            stroke={colors.WARM}
            strokeWidth={1.6}
            strokeDasharray="5 4"
            opacity={ellipseU * Math.min(1, adamU)}
          />
        )}
        <Trail run={ADAM} prog={adamProg} u={adamU} color={colors.WARM} />
        <Ball p={adamP} u={adamU} color={colors.WARM} />
      </Camera>

      {/* screen-fixed labels (top-right, clear of the caption lower-third) */}
      <MathLabel tex="L(\theta)" x={1150} y={64} fontSize={30} opacity={s.get(scene.lossTexU)} />
      <MathLabel
        tex="\theta \leftarrow \theta - \eta\,\nabla L(\theta)"
        x={950}
        y={120}
        anchor="start"
        fontSize={19}
        color={colors.ACCENT}
        opacity={s.get(scene.gdTexU)}
      />
      <MathLabel
        tex="v \leftarrow \beta v - \eta\nabla L,\quad \theta \leftarrow \theta + v"
        x={950}
        y={158}
        anchor="start"
        fontSize={19}
        color={colors.POSITIVE}
        opacity={s.get(scene.momTexU)}
      />
      <MathLabel
        tex="\theta \leftarrow \theta - \eta\,\hat m / (\sqrt{\hat v} + \varepsilon)"
        x={950}
        y={196}
        anchor="start"
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.adamTexU)}
      />

      {/* the comparison panel: loss vs step for all three */}
      {panelU > 0 && (
        <g opacity={panelU}>
          <rect
            x={PANEL_X}
            y={PANEL_Y}
            width={PANEL_W}
            height={PANEL_H}
            rx={12}
            fill={colors.PANEL}
            opacity={0.86}
            stroke={colors.GRID}
          />
          <text x={PANEL_X + 26} y={PANEL_Y + 38} fill={colors.TEXT} fontSize={17}>
            loss per step
          </text>
          <LegendRow y={PANEL_Y + 66} color={colors.ACCENT} label="gradient descent" u={legendU} />
          <LegendRow y={PANEL_Y + 88} color={colors.POSITIVE} label="momentum" u={legendU} />
          <LegendRow y={PANEL_Y + 110} color={colors.WARM} label="adam" u={legendU} />
          <Axes
            x={xPanel}
            y={yPanel}
            reveal={panelU}
            xTicks={4}
            yTicks={4}
            xLabel="step"
            fontSize={11}
          />
          <FunctionPlot
            x={xPanel}
            y={yPanel}
            f={fGdLoss}
            samples={N_STEPS}
            reveal={curveReveal}
            color={colors.ACCENT}
            width={2.4}
          />
          <FunctionPlot
            x={xPanel}
            y={yPanel}
            f={fMomLoss}
            samples={N_STEPS}
            reveal={curveReveal}
            color={colors.POSITIVE}
            width={2.4}
          />
          <FunctionPlot
            x={xPanel}
            y={yPanel}
            f={fAdamLoss}
            samples={N_STEPS}
            reveal={curveReveal}
            color={colors.WARM}
            width={2.4}
          />
        </g>
      )}
    </>
  );
}

export function GradientDescent() {
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
