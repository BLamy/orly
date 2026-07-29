import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, Vec } from '../../primitives';
import overrides from './overrides.json';
import {
  CHECK_RANK,
  EVENTS,
  FINAL,
  INIT_WRONG_SET,
  MISTAKES,
  N_POINTS,
  POINTS,
  buildScene,
  lineGeom,
  stateAt,
  xScale,
  yScale,
} from './scene';
import type { LineGeom, Pt } from './scene';

/**
 * The Perceptron — a line that learns.
 * Pure render: the decision line, the weight-vector arrow, the nudge, the
 * half-plane tint and the verification ticks are all closed-form functions
 * of the sampled channels plus the module-scope training run in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/perceptron/overrides.json', slug: 'perceptron' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** How much of w (and of the nudge y·x) is drawn, in data units per unit w. */
const W_VIS = 0.45;
const DOT_R = 7;

const sx = (x: number): number => xScale(x);
const sy = (y: number): number => yScale(y);

const posColor = colors.ACCENT; // +1 · blue
const negColor = colors.NEGATIVE; // −1 · rose

/** Half-plane tint polygon on the `side` (+1 / −1) of the line, in px. */
function halfPlaneD(geom: LineGeom, side: 1 | -1): string {
  const L = 14; // data units — always covers the visible stage
  const [ax, ay] = geom.anchor;
  const [dx, dy] = geom.d;
  const nx = geom.n[0] * side;
  const ny = geom.n[1] * side;
  const p = (x: number, y: number): string => `${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
  return (
    `M${p(ax - dx * L, ay - dy * L)}` +
    `L${p(ax + dx * L, ay + dy * L)}` +
    `L${p(ax + dx * L + nx * L, ay + dy * L + ny * L)}` +
    `L${p(ax - dx * L + nx * L, ay - dy * L + ny * L)}Z`
  );
}

function Dot({ i, u, dim }: { i: number; u: number; dim: number }) {
  const p = POINTS[i];
  if (u <= 0) return null;
  return (
    <circle
      cx={sx(p.x)}
      cy={sy(p.y)}
      r={DOT_R * Math.min(1, u)}
      fill={p.label === 1 ? posColor : negColor}
      stroke={colors.BG}
      strokeWidth={1.4}
      opacity={0.95 * dim}
    />
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const dotsU = s.get(scene.dotsU);
  const labelsU = s.get(scene.labelsU);
  const lineU = s.get(scene.lineU);
  const wU = s.get(scene.wU);
  const misU = s.get(scene.misU);
  const evtProg = s.get(scene.evtProg);
  const hlIdx = Math.round(s.get(scene.hlIdx));
  const hlU = s.get(scene.hlU);
  const nudgeU = s.get(scene.nudgeU);
  const checkU = s.get(scene.checkU);
  const tintU = s.get(scene.tintU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const st = stateAt(evtProg);
  const geom = lineGeom(st);
  const updates = Math.min(MISTAKES, Math.floor(evtProg + 1e-4));

  // the highlighted mistake (during the three examined updates)
  const ev = EVENTS[Math.max(0, Math.min(EVENTS.length - 1, hlIdx))];
  const evPt = POINTS[ev.point];

  // the drawn weight vector: anchor → anchor + w · W_VIS (data units)
  let wTail: Pt = [0, 0];
  let wTip: Pt = [0, 0];
  if (geom) {
    wTail = geom.anchor;
    wTip = [geom.anchor[0] + st[0] * W_VIS, geom.anchor[1] + st[1] * W_VIS];
  }
  // the nudge y·x, drawn from the tip of w at the same visual scale
  const nudge: Pt = [evPt.label * evPt.x * W_VIS, evPt.label * evPt.y * W_VIS];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          <Axes x={xScale} y={yScale} reveal={axesU} grid xTicks={8} yTicks={5} opacity={0.5} />

          {/* half-plane tints — the converged payoff */}
          {geom && tintU > 0 && (
            <g opacity={tintU * 0.1}>
              <path d={halfPlaneD(geom, 1)} fill={posColor} />
              <path d={halfPlaneD(geom, -1)} fill={negColor} />
            </g>
          )}

          {/* the data — one persistent cloud, staggered on */}
          {POINTS.map((_, i) => (
            <Dot key={i} i={i} u={clamp01(dotsU * (1 + 0.8) - (i / (N_POINTS - 1)) * 0.8)} dim={1} />
          ))}

          {/* cluster labels */}
          <MathLabel tex="+1" x={sx(2.35)} y={sy(1.65)} fontSize={24} color={posColor} opacity={labelsU} />
          <MathLabel tex="-1" x={sx(-2.35)} y={sy(-0.55)} fontSize={24} color={negColor} opacity={labelsU} />

          {/* rings on everything the initial guess gets wrong */}
          {misU > 0 &&
            POINTS.map((p, i) =>
              INIT_WRONG_SET.has(i) ? (
                <circle
                  key={i}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={DOT_R + 5.5}
                  fill="none"
                  stroke={colors.WARM}
                  strokeWidth={1.8}
                  opacity={0.85 * misU}
                />
              ) : null,
            )}

          {/* THE decision line — the centerpiece, replaying the recorded run */}
          {geom && lineU > 0 && (
            <line
              x1={sx(geom.a[0]) + (sx(geom.b[0]) - sx(geom.a[0])) * (1 - lineU) * 0.5}
              y1={sy(geom.a[1]) + (sy(geom.b[1]) - sy(geom.a[1])) * (1 - lineU) * 0.5}
              x2={sx(geom.b[0]) + (sx(geom.a[0]) - sx(geom.b[0])) * (1 - lineU) * 0.5}
              y2={sy(geom.b[1]) + (sy(geom.a[1]) - sy(geom.b[1])) * (1 - lineU) * 0.5}
              stroke={colors.WARM}
              strokeWidth={3}
              opacity={0.95}
            />
          )}

          {/* the weight vector w, normal to the line */}
          {geom && wU > 0 && (
            <Vec
              x1={sx(wTail[0])}
              y1={sy(wTail[1])}
              x2={sx(wTip[0])}
              y2={sy(wTip[1])}
              grow={wU}
              color={colors.TEAL}
              width={3}
              head={10}
              label="w"
              opacity={0.95}
            />
          )}

          {/* the update, shown as a vector nudge y·x hung off the tip of w */}
          {geom && nudgeU > 0 && (
            <g>
              <Vec
                x1={sx(wTip[0])}
                y1={sy(wTip[1])}
                x2={sx(wTip[0] + nudge[0])}
                y2={sy(wTip[1] + nudge[1])}
                grow={nudgeU}
                color={evPt.label === 1 ? posColor : negColor}
                width={2.6}
                head={9}
                opacity={0.95 * nudgeU}
              />
              <MathLabel
                tex="y\,\mathbf{x}"
                x={sx(wTip[0] + nudge[0] * 0.5) + 26}
                y={sy(wTip[1] + nudge[1] * 0.5) - 14}
                fontSize={19}
                color={evPt.label === 1 ? posColor : negColor}
                opacity={nudgeU}
              />
            </g>
          )}

          {/* the misclassified point under examination */}
          {hlU > 0 && (
            <g opacity={hlU}>
              <circle
                cx={sx(evPt.x)}
                cy={sy(evPt.y)}
                r={DOT_R + 5 + 3 * hlU}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2.4}
              />
              <circle
                cx={sx(evPt.x)}
                cy={sy(evPt.y)}
                r={DOT_R + 13}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={1}
                opacity={0.5}
              />
            </g>
          )}

          {/* verification lap: a left-to-right sweep of confirmation rings */}
          {checkU > 0 &&
            POINTS.map((p, i) => {
              const u = clamp01(checkU * (N_POINTS + 4) - CHECK_RANK[i]);
              if (u <= 0) return null;
              return (
                <circle
                  key={i}
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={DOT_R + 4.5}
                  fill="none"
                  stroke={colors.POSITIVE}
                  strokeWidth={2}
                  opacity={u * (0.35 + 0.65 * (1 - checkU) + 0.65 * checkU * 0.6)}
                />
              );
            })}
        </g>
      </Camera>

      {/* screen-fixed math (top-right, clear of the caption lower-third) */}
      <MathLabel
        tex="\hat y = \mathrm{sign}(\mathbf{w}\cdot\mathbf{x} + b)"
        x={1046}
        y={64}
        fontSize={22}
        opacity={s.get(scene.ruleTexU)}
      />
      <MathLabel
        tex="\mathbf{w} \leftarrow \mathbf{w} + y\,\mathbf{x},\quad b \leftarrow b + y"
        x={1046}
        y={110}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.updTexU)}
      />

      {/* the honest mistake counter (top-left) */}
      {s.get(scene.counterU) > 0 && (
        <g opacity={s.get(scene.counterU)}>
          <rect x={36} y={34} width={236} height={44} rx={10} fill={colors.PANEL} opacity={0.85} stroke={colors.GRID} />
          <text x={54} y={62} fill={colors.TEXT} fontSize={17}>
            {`mistakes used: ${updates} / ${MISTAKES}`}
          </text>
        </g>
      )}

      {/* clean ending: closing card over the dimmed field */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={280} y={230} width={720} height={200} rx={16} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Perceptron
          </text>
          <MathLabel
            tex={`\\mathbf{w} = (${FINAL[0].toFixed(2)},\\; ${FINAL[1].toFixed(2)}),\\quad b = ${FINAL[2].toFixed(2)}`}
            x={640}
            y={352}
            fontSize={21}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`converged after ${MISTAKES} mistake-driven updates`}
          </text>
        </g>
      )}
    </>
  );
}

export function Perceptron() {
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
