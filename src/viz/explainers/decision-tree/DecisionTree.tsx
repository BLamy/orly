import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CURVE,
  GAIN_LEFT_Y,
  GAIN_MAX,
  GAIN_ROOT_X,
  H_LEFT,
  H_RIGHT,
  H_ROOT,
  LEFT,
  LEFT_DOWN,
  LEFT_UP,
  PLOT,
  POINTS,
  RIGHT,
  ROOT,
  SPLIT_L,
  SWEEP_N,
  TREE,
  buildScene,
  sweepT,
  sx,
  sy,
} from './scene';

/**
 * Decision Trees — twenty questions with data.
 * Pure render: the real greedy split search (sweeping cut + live information
 * gain curve), the actual chosen cuts (x at 0.469, then y at 0.589 in the
 * left region), the growing tree diagram, and the staircase boundary.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/decision-tree/overrides.json', slug: 'decision-tree' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const CLASS0 = colors.ACCENT;
const CLASS1 = colors.WARM;

const gainPath = (gains: number[]): string =>
  gains
    .map((g2, i) => `${i === 0 ? 'M' : 'L'}${CURVE.x + (i / (SWEEP_N - 1)) * CURVE.w},${CURVE.y + CURVE.h - (g2 / GAIN_MAX) * CURVE.h}`)
    .join('');
const PATH1 = gainPath(GAIN_ROOT_X);
const PATH2 = gainPath(GAIN_LEFT_Y);

function TreeNode({ x, y, label, sub, color, u }: { x: number; y: number; label: string; sub: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - 78} y={y - 26} width={156} height={52} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
      <text x={x} y={y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontFamily="ui-monospace, monospace">
        {label}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
        {sub}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const hTexU = s.get(scene.hTexU);
  const sweep1 = s.get(scene.sweep1);
  const curve1U = s.get(scene.curve1U);
  const cut1U = s.get(scene.cut1U);
  const tint1U = s.get(scene.tint1U);
  const tree1U = s.get(scene.tree1U);
  const sweep2 = s.get(scene.sweep2);
  const curve2U = s.get(scene.curve2U);
  const cut2U = s.get(scene.cut2U);
  const tint2U = s.get(scene.tint2U);
  const tree2U = s.get(scene.tree2U);
  const leafU = s.get(scene.leafU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // sweeping cut positions (data coords)
  const t1 = 0.02 + 0.96 * sweep1;
  const t2 = 0.02 + 0.96 * sweep2;
  const sweeping1 = sweep1 > 0 && sweep1 < 1 && cut1U < 0.05;
  const sweeping2 = sweep2 > 0 && sweep2 < 1 && cut2U < 0.05;
  const i1 = Math.min(SWEEP_N - 1, Math.floor(sweep1 * (SWEEP_N - 1)));
  const i2 = Math.min(SWEEP_N - 1, Math.floor(sweep2 * (SWEEP_N - 1)));

  const activeCurve = curve2U > 0.5 ? 2 : 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* region tints after cuts */}
          {tint1U > 0 && (
            <g opacity={tint1U * 0.16}>
              <rect x={sx(ROOT.t)} y={PLOT.y} width={PLOT.x + PLOT.w - sx(ROOT.t)} height={PLOT.h} fill={CLASS1} />
              {tint2U > 0 ? (
                <>
                  <rect x={PLOT.x} y={PLOT.y} width={sx(ROOT.t) - PLOT.x} height={sy(SPLIT_L.t) - PLOT.y} fill={CLASS1} opacity={tint2U} />
                  <rect x={PLOT.x} y={sy(SPLIT_L.t)} width={sx(ROOT.t) - PLOT.x} height={PLOT.y + PLOT.h - sy(SPLIT_L.t)} fill={CLASS0} opacity={tint2U} />
                </>
              ) : null}
            </g>
          )}

          {/* plot frame */}
          <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={ptsU} />

          {/* points */}
          {POINTS.map((p, i) => (
            <circle
              key={i}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={4.6 * clamp01(ptsU * 1.6 - i / 150)}
              fill={p.c === 1 ? CLASS1 : CLASS0}
              stroke={colors.BG}
              strokeWidth={0.8}
              opacity={0.92}
            />
          ))}

          {/* sweeping candidate cut 1 (vertical) */}
          {sweeping1 && (
            <line x1={sx(t1)} y1={PLOT.y} x2={sx(t1)} y2={PLOT.y + PLOT.h} stroke={colors.TEXT} strokeWidth={1.6} strokeDasharray="6 5" opacity={0.8} />
          )}
          {/* chosen cut 1 */}
          {cut1U > 0 && (
            <line
              x1={sx(ROOT.t)}
              y1={PLOT.y + PLOT.h}
              x2={sx(ROOT.t)}
              y2={PLOT.y + PLOT.h - PLOT.h * cut1U}
              stroke={colors.POSITIVE}
              strokeWidth={3}
            />
          )}

          {/* sweeping candidate cut 2 (horizontal, left region only) */}
          {sweeping2 && (
            <line x1={PLOT.x} y1={sy(t2)} x2={sx(ROOT.t)} y2={sy(t2)} stroke={colors.TEXT} strokeWidth={1.6} strokeDasharray="6 5" opacity={0.8} />
          )}
          {cut2U > 0 && (
            <line x1={PLOT.x} y1={sy(SPLIT_L.t)} x2={PLOT.x + (sx(ROOT.t) - PLOT.x) * cut2U} y2={sy(SPLIT_L.t)} stroke={colors.POSITIVE} strokeWidth={3} />
          )}

          {/* the live gain curve */}
          {(curve1U > 0.02 || curve2U > 0.02) && (
            <g>
              <rect
                x={CURVE.x - 16}
                y={CURVE.y - 34}
                width={CURVE.w + 32}
                height={CURVE.h + 64}
                rx={12}
                fill={colors.PANEL}
                opacity={0.85 * Math.max(curve1U, curve2U)}
                stroke={colors.GRID}
              />
              <text x={CURVE.x} y={CURVE.y - 12} fill={colors.MUTED} fontSize={13.5} opacity={Math.max(curve1U, curve2U)}>
                {activeCurve === 1 ? 'information gain — vertical cut position' : 'information gain — horizontal cut (left region)'}
              </text>
              {/* curve 1 */}
              <g opacity={curve1U}>
                <path
                  d={PATH1}
                  fill="none"
                  stroke={colors.SECONDARY}
                  strokeWidth={2.2}
                  strokeDasharray={sweeping1 ? `${(i1 / (SWEEP_N - 1)) * 1400} 2000` : undefined}
                  pathLength={sweeping1 ? 1400 : undefined}
                />
                {cut1U > 0 && (
                  <g opacity={cut1U}>
                    <circle
                      cx={CURVE.x + ((ROOT.t - 0.02) / 0.96) * CURVE.w}
                      cy={CURVE.y + CURVE.h - (ROOT.gain / GAIN_MAX) * CURVE.h}
                      r={6}
                      fill={colors.POSITIVE}
                    />
                    <text
                      x={CURVE.x + ((ROOT.t - 0.02) / 0.96) * CURVE.w + 12}
                      y={CURVE.y + CURVE.h - (ROOT.gain / GAIN_MAX) * CURVE.h - 8}
                      fill={colors.POSITIVE}
                      fontSize={13.5}
                    >
                      {`gain ${ROOT.gain.toFixed(2)} @ x ≤ ${ROOT.t.toFixed(2)}`}
                    </text>
                  </g>
                )}
              </g>
              {/* curve 2 */}
              <g opacity={curve2U}>
                <path
                  d={PATH2}
                  fill="none"
                  stroke={colors.SECONDARY}
                  strokeWidth={2.2}
                  strokeDasharray={sweeping2 ? `${(i2 / (SWEEP_N - 1)) * 1400} 2000` : undefined}
                  pathLength={sweeping2 ? 1400 : undefined}
                />
                {cut2U > 0 && (
                  <g opacity={cut2U}>
                    <circle
                      cx={CURVE.x + ((SPLIT_L.t - 0.02) / 0.96) * CURVE.w}
                      cy={CURVE.y + CURVE.h - (SPLIT_L.gain / GAIN_MAX) * CURVE.h}
                      r={6}
                      fill={colors.POSITIVE}
                    />
                    <text
                      x={CURVE.x + ((SPLIT_L.t - 0.02) / 0.96) * CURVE.w - 190}
                      y={CURVE.y + CURVE.h - (SPLIT_L.gain / GAIN_MAX) * CURVE.h - 8}
                      fill={colors.POSITIVE}
                      fontSize={13.5}
                    >
                      {`gain ${SPLIT_L.gain.toFixed(2)} @ y ≤ ${SPLIT_L.t.toFixed(2)}`}
                    </text>
                  </g>
                )}
              </g>
            </g>
          )}

          {/* the growing tree */}
          {tree1U > 0 && (
            <g>
              {/* edges */}
              <g stroke={colors.GRID} strokeWidth={1.8} opacity={Math.min(tree1U, tree2U > 0 ? 1 : tree1U)}>
                <line x1={TREE.rootX} y1={TREE.rootY + 26} x2={TREE.rootX - TREE.dx} y2={TREE.rootY + TREE.dy - 26} opacity={tree1U} />
                <line x1={TREE.rootX} y1={TREE.rootY + 26} x2={TREE.rootX + TREE.dx} y2={TREE.rootY + TREE.dy - 26} opacity={tree1U} />
                <line
                  x1={TREE.rootX - TREE.dx}
                  y1={TREE.rootY + TREE.dy + 26}
                  x2={TREE.rootX - TREE.dx - 90}
                  y2={TREE.rootY + 2 * TREE.dy - 26}
                  opacity={tree2U}
                />
                <line
                  x1={TREE.rootX - TREE.dx}
                  y1={TREE.rootY + TREE.dy + 26}
                  x2={TREE.rootX - TREE.dx + 90}
                  y2={TREE.rootY + 2 * TREE.dy - 26}
                  opacity={tree2U}
                />
              </g>
              <TreeNode
                x={TREE.rootX}
                y={TREE.rootY}
                label={`x ≤ ${ROOT.t.toFixed(2)} ?`}
                sub={`90 pts · H ${H_ROOT.toFixed(2)}`}
                color={colors.POSITIVE}
                u={tree1U}
              />
              <TreeNode
                x={TREE.rootX + TREE.dx}
                y={TREE.rootY + TREE.dy}
                label={leafU > 0 ? 'leaf: warm' : 'right'}
                sub={`${RIGHT.length} pts · H ${H_RIGHT.toFixed(2)}`}
                color={CLASS1}
                u={tree1U}
              />
              <TreeNode
                x={TREE.rootX - TREE.dx}
                y={TREE.rootY + TREE.dy}
                label={tree2U > 0 ? `y ≤ ${SPLIT_L.t.toFixed(2)} ?` : 'left'}
                sub={`${LEFT.length} pts · H ${H_LEFT.toFixed(2)}`}
                color={tree2U > 0 ? colors.POSITIVE : colors.MUTED}
                u={tree1U}
              />
              <TreeNode
                x={TREE.rootX - TREE.dx - 90}
                y={TREE.rootY + 2 * TREE.dy}
                label="leaf: blue"
                sub={`${LEFT_DOWN.length} pts`}
                color={CLASS0}
                u={tree2U}
              />
              <TreeNode
                x={TREE.rootX - TREE.dx + 90}
                y={TREE.rootY + 2 * TREE.dy}
                label="leaf: warm"
                sub={`${LEFT_UP.length} pts`}
                color={CLASS1}
                u={tree2U}
              />
            </g>
          )}

          {/* accuracy chip */}
          {leafU > 0 && (
            <g opacity={leafU}>
              <rect x={TREE.rootX - 105} y={TREE.rootY + 2 * TREE.dy + 60} width={210} height={34} rx={9} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
              <text x={TREE.rootX} y={TREE.rootY + 2 * TREE.dy + 83} textAnchor="middle" fill={colors.TEXT} fontSize={14.5}>
                training: 86 / 90 correct
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed entropy formula */}
      <MathLabel tex={'H = -p\\log_2 p - (1{-}p)\\log_2(1{-}p)'} x={935} y={54} fontSize={18} opacity={hTexU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={230} width={780} height={190} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Decision Trees
          </text>
          <text x={640} y={342} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            measure the mess, buy the biggest entropy drop, recurse — then stop early
          </text>
          <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            two questions sorted 86 of 90 points
          </text>
        </g>
      )}
    </>
  );
}

export function DecisionTree() {
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
