import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, ContourField, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  GLOBAL_MIN,
  LOCAL_MIN,
  LOSS,
  MIRROR_MIN,
  N_DATA,
  PANEL,
  RUN_BAD,
  RUN_GOOD,
  SADDLE,
  XS,
  YS,
  aScale,
  bScale,
  buildScene,
  dataX,
  dataY,
  pathAt,
} from './scene';
import type { Pt } from './scene';

/**
 * The Loss Landscape — where training lives.
 * Pure render: every visual value comes from the sampled SceneState or a
 * module-scope precomputation in scene.ts. No local clocks, no randomness.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/loss-landscape/overrides.json', slug: 'loss-landscape' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// — contours: depth ramp on the core heat scale (deep = bright, high = dim)
const THRESHOLDS = 16;
const contourColor = (_level: number, i: number): string =>
  colors.heat(0.88 - (0.62 * i) / (THRESHOLDS - 1));

// stage positions of the numerically-found landmarks
const GLOBAL_PX: Pt = [bScale(GLOBAL_MIN[1]), aScale(GLOBAL_MIN[0])];
const MIRROR_PX: Pt = [bScale(MIRROR_MIN[1]), aScale(MIRROR_MIN[0])];
const LOCAL_PX: Pt = [bScale(LOCAL_MIN[1]), aScale(LOCAL_MIN[0])];
const SADDLE_PX: Pt = [bScale(SADDLE[1]), aScale(SADDLE[0])];

const DATA_STAGGER = 0.6;

/** 5-point star path centered at (cx, cy). */
function starD(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const ang = -Math.PI / 2 + (Math.PI * i) / 5;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Path `d` for a run's polyline between (fractional) step indices. */
function traceD(pts: readonly Pt[], to: number): string {
  if (to <= 0) return '';
  const b = Math.min(pts.length - 1, to);
  const bi = Math.floor(b);
  const parts: string[] = [`M${bScale(pts[0][1]).toFixed(1)} ${aScale(pts[0][0]).toFixed(1)}`];
  for (let i = 1; i <= bi; i++) {
    parts.push(`L${bScale(pts[i][1]).toFixed(1)} ${aScale(pts[i][0]).toFixed(1)}`);
  }
  if (b > bi && bi + 1 < pts.length) {
    const t = b - bi;
    const p = pts[bi];
    const q = pts[bi + 1];
    parts.push(
      `L${bScale(p[1] + (q[1] - p[1]) * t).toFixed(1)} ${aScale(p[0] + (q[0] - p[0]) * t).toFixed(1)}`,
    );
  }
  return parts.join('');
}

function Walk({
  run,
  prog,
  u,
  color,
  startLabel,
}: {
  run: readonly Pt[];
  prog: number;
  u: number;
  color: string;
  startLabel: string;
}) {
  if (u <= 0) return null;
  const idx = clamp01(prog) * (run.length - 1);
  const [a, b] = pathAt(run, prog);
  const [cx, cy] = [bScale(b), aScale(a)];
  const [sx, sy] = [bScale(run[0][1]), aScale(run[0][0])];
  return (
    <g opacity={u}>
      <circle cx={sx} cy={sy} r={9} fill="none" stroke={color} strokeWidth={1.6} strokeDasharray="3 3" />
      <text x={sx + 14} y={sy + 4} fill={color} fontSize={14} fontStyle="italic">
        {startLabel}
      </text>
      <path
        d={traceD(run, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinejoin="round"
        opacity={0.8}
      />
      <circle cx={cx} cy={cy} r={15} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={7.5} fill={color} stroke={colors.BG} strokeWidth={1.5} />
    </g>
  );
}

function Landmark({
  px,
  u,
  color,
  label,
  dx = 0,
  dy = -22,
  star = false,
}: {
  px: Pt;
  u: number;
  color: string;
  label: string;
  dx?: number;
  dy?: number;
  star?: boolean;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      {star ? (
        <path d={starD(px[0], px[1], 11)} fill={color} stroke={colors.BG} strokeWidth={1} />
      ) : (
        <circle cx={px[0]} cy={px[1]} r={7} fill="none" stroke={color} strokeWidth={2.4} />
      )}
      <text
        x={px[0] + dx}
        y={px[1] + dy}
        textAnchor="middle"
        fill={color}
        fontSize={16}
        fontStyle="italic"
      >
        {label}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const panelOp = s.get(scene.panelOp);
  const dataU = s.get(scene.dataU);
  const curveU = s.get(scene.curveU);
  const whiskerU = s.get(scene.whiskerU);
  const planeAxU = s.get(scene.planeAxU);
  const probeU = s.get(scene.probeU);
  const contourOp = s.get(scene.contourOp);
  const runOp = s.get(scene.runOp);
  const run1Prog = s.get(scene.run1Prog);
  const run2Prog = s.get(scene.run2Prog);
  const closeU = s.get(scene.closeU);

  // the ONE link that carries the chapter: a point in the plane = a curve.
  // Before the walks it's the probe; during them it's the descending ball.
  const [A, B]: Pt =
    run2Prog > 0
      ? pathAt(RUN_GOOD, run2Prog)
      : run1Prog > 0
        ? pathAt(RUN_BAD, run1Prog)
        : [s.get(scene.probeA), s.get(scene.probeB)];
  const fit = (x: number): number => A * Math.sin(B * x);

  const originX = bScale(0);
  const originY = aScale(0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <ContourField
          f={LOSS}
          x={bScale}
          y={aScale}
          thresholds={THRESHOLDS}
          gridN={110}
          reveal={s.get(scene.contourReveal)}
          color={contourColor}
          opacity={contourOp}
        />

        {/* the parameter plane's crosshair axes */}
        <g opacity={planeAxU * Math.max(contourOp, 0.5)}>
          <line
            x1={originX}
            y1={62}
            x2={originX}
            y2={638}
            stroke={colors.GRID}
            strokeWidth={1.2}
            strokeDasharray="4 5"
            opacity={0.7}
          />
          <line
            x1={452}
            y1={originY}
            x2={1268}
            y2={originY}
            stroke={colors.GRID}
            strokeWidth={1.2}
            strokeDasharray="4 5"
            opacity={0.7}
          />
          <text x={originX + 14} y={82} fill={colors.MUTED} fontSize={15} fontStyle="italic">
            a · amplitude
          </text>
          <text
            x={1264}
            y={originY - 12}
            textAnchor="end"
            fill={colors.MUTED}
            fontSize={15}
            fontStyle="italic"
          >
            b · frequency
          </text>
        </g>

        {/* the probe: one point in parameter space */}
        {probeU > 0 && (
          <g opacity={probeU}>
            <circle
              cx={bScale(B)}
              cy={aScale(A)}
              r={13}
              fill="none"
              stroke={colors.ACCENT}
              strokeWidth={1.6}
              opacity={0.7}
            />
            <circle
              cx={bScale(B)}
              cy={aScale(A)}
              r={6.5}
              fill={colors.ACCENT}
              stroke={colors.BG}
              strokeWidth={1.4}
            />
          </g>
        )}

        {/* numerically-verified landmarks */}
        <Landmark
          px={SADDLE_PX}
          u={s.get(scene.saddleU)}
          color={colors.TEAL}
          label="a saddle"
          dy={-20}
        />
        <Landmark
          px={LOCAL_PX}
          u={s.get(scene.localU)}
          color={colors.WARM}
          label="a shallow local minimum"
          dx={-40}
          dy={-24}
        />
        <Landmark
          px={GLOBAL_PX}
          u={s.get(scene.minsU)}
          color={colors.POSITIVE}
          label="the best fit"
          star
        />
        <Landmark
          px={MIRROR_PX}
          u={s.get(scene.minsU)}
          color={colors.SECONDARY}
          label="the same model, mirrored"
          dy={28}
          star
        />

        {/* two real gradient-descent walks */}
        <g opacity={runOp}>
          <Walk
            run={RUN_BAD}
            prog={run1Prog}
            u={s.get(scene.run1U)}
            color={colors.NEGATIVE}
            startLabel="bad start"
          />
          <Walk
            run={RUN_GOOD}
            prog={run2Prog}
            u={s.get(scene.run2U)}
            color={colors.POSITIVE}
            startLabel="better start"
          />
        </g>
      </Camera>

      {/* screen-fixed left panel: the data + the candidate curve */}
      {panelOp > 0 && (
        <g opacity={panelOp}>
          <rect
            x={PANEL.x}
            y={PANEL.y}
            width={PANEL.w}
            height={PANEL.h}
            rx={12}
            fill={colors.PANEL}
            opacity={0.92}
            stroke={colors.GRID}
          />
          <text x={PANEL.x + 22} y={PANEL.y + 32} fill={colors.TEXT} fontSize={16}>
            the data, and one candidate fit
          </text>
          <Axes x={dataX} y={dataY} reveal={panelOp} xTicks={4} yTicks={4} fontSize={10} />
          {/* residual whiskers — the loss, drawn */}
          {whiskerU > 0 && (
            <g opacity={whiskerU}>
              {XS.map((x, i) => (
                <line
                  key={i}
                  x1={dataX(x)}
                  y1={dataY(YS[i])}
                  x2={dataX(x)}
                  y2={dataY(fit(x))}
                  stroke={colors.WARM}
                  strokeWidth={1.4}
                  opacity={0.75}
                />
              ))}
            </g>
          )}
          {/* the data points, staggered in */}
          {XS.map((x, i) => {
            const u = clamp01(dataU * (1 + DATA_STAGGER) - (i / (N_DATA - 1)) * DATA_STAGGER);
            return u > 0 ? (
              <circle
                key={i}
                cx={dataX(x)}
                cy={dataY(YS[i])}
                r={3.4 * u}
                fill={colors.TEXT}
                opacity={0.85 * u}
              />
            ) : null;
          })}
          {/* the candidate curve — a pure function of the sampled (a, b) */}
          <FunctionPlot
            x={dataX}
            y={dataY}
            f={fit}
            domain={[-Math.PI, Math.PI]}
            reveal={curveU}
            color={colors.ACCENT}
            width={2.8}
          />
          <MathLabel
            tex="y = a\,\sin(b\,x)"
            x={PANEL.x + 96}
            y={PANEL.y + 62}
            fontSize={18}
            color={colors.ACCENT}
            opacity={curveU * panelOp}
          />
        </g>
      )}

      {/* screen-fixed loss formula (top right) */}
      <MathLabel
        tex="L(a,b) = \tfrac{1}{N}\sum_i \big(y_i - a\sin(b\,x_i)\big)^2"
        x={950}
        y={52}
        anchor="start"
        fontSize={17}
        opacity={s.get(scene.lossTexU)}
      />

      {/* closing card */}
      {closeU > 0 && (
        <text
          x={640}
          y={340}
          textAnchor="middle"
          fill={colors.TEXT}
          fontSize={29}
          opacity={closeU}
        >
          Every training run is a walk on this surface.
        </text>
      )}
    </>
  );
}

export function LossLandscape() {
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
