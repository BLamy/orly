import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { BEST_AT, COSTS, N_PTS, PTS, QUERY, TRUE_NN, buildScene } from './scene';

/**
 * The Nearest-Neighbor Problem at Scale — pure render. The scan and
 * best-so-far are real; the cost table is closed-form N·d arithmetic.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/nn-scale/overrides.json', slug: 'nn-scale' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const TAB_X = 200;
const TAB_Y = 496;

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : ms >= 1 ? `${ms.toFixed(0)} ms` : `${ms.toFixed(2)} ms`;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const fieldU = s.get(scene.fieldU);
  const queryU = s.get(scene.queryU);
  const scanU = s.get(scene.scanU);
  const tableU = s.get(scene.tableU);
  const budgetU = s.get(scene.budgetU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const scanned = Math.min(N_PTS, Math.floor(scanU));
  const best = scanned > 0 ? BEST_AT[scanned - 1] : -1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the field */}
          {PTS.map((p, i) => {
            const u = clamp01(fieldU * 1.5 - i / N_PTS);
            if (u <= 0) return null;
            const isScanned = i < scanned;
            const isBest = i === best && scanU > 0;
            const isTrue = i === TRUE_NN && scanU >= N_PTS;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isBest ? 7 : 3}
                fill={isBest ? colors.POSITIVE : isScanned ? colors.MUTED : colors.ACCENT}
                opacity={u * (isScanned && !isBest ? 0.35 : 0.85)}
                stroke={isTrue ? colors.POSITIVE : 'none'}
                strokeWidth={isTrue ? 3 : 0}
              />
            );
          })}

          {/* scan frontier line to current point */}
          {scanU > 0 && scanned < N_PTS && (
            <line
              x1={QUERY.x}
              y1={QUERY.y}
              x2={PTS[Math.min(N_PTS - 1, scanned)].x}
              y2={PTS[Math.min(N_PTS - 1, scanned)].y}
              stroke={colors.WARM}
              strokeWidth={1.5}
              opacity={0.7}
            />
          )}

          {/* query */}
          {queryU > 0 && (
            <g opacity={queryU}>
              <circle cx={QUERY.x} cy={QUERY.y} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <text x={QUERY.x + 14} y={QUERY.y - 10} fill={colors.WARM} fontSize={14}>
                query
              </text>
            </g>
          )}

          {/* counter */}
          {scanU > 0 && (
            <g>
              <rect x={130} y={78} width={280} height={40} rx={9} fill={colors.PANEL} opacity={0.9} stroke={colors.GRID} />
              <text x={148} y={104} fill={colors.TEXT} fontSize={15}>
                {`comparisons: ${scanned} / ${N_PTS}`}
              </text>
            </g>
          )}

          {/* the cost table */}
          {tableU > 0 && (
            <g>
              <rect x={TAB_X - 36} y={TAB_Y - 44} width={860} height={182} rx={14} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={TAB_X} y={TAB_Y - 12} fill={colors.MUTED} fontSize={13.5} opacity={clamp01(tableU)}>
                one query, d = 768, at ten billion multiply-adds per second
              </text>
              {COSTS.map((row, i) => {
                const u = clamp01(tableU - i);
                if (u <= 0) return null;
                const over = budgetU > 0.5 && row.ms > 10;
                const w = 90 + 115 * (Math.log10(row.ops) - 5.8);
                return (
                  <g key={i} opacity={u}>
                    <text x={TAB_X} y={TAB_Y + 18 + i * 30} fill={colors.TEXT} fontSize={14.5}>
                      {row.label}
                    </text>
                    <rect x={TAB_X + 160} y={TAB_Y + 6 + i * 30} width={Math.max(8, w)} height={16} rx={4} fill={over ? colors.NEGATIVE : colors.ACCENT} opacity={0.85} />
                    <text x={TAB_X + 172 + Math.max(8, w)} y={TAB_Y + 19 + i * 30} fill={over ? colors.NEGATIVE : colors.MUTED} fontSize={14}>
                      {fmtMs(row.ms)}
                    </text>
                  </g>
                );
              })}
              {budgetU > 0 && (
                <g opacity={budgetU}>
                  <line x1={TAB_X + 160 + 90 + 115 * (Math.log10(1e5 * 768) - 5.8) + 24} y1={TAB_Y - 4} x2={TAB_X + 160 + 90 + 115 * (Math.log10(1e5 * 768) - 5.8) + 24} y2={TAB_Y + 128} stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 6" />
                  <text x={TAB_X + 160 + 90 + 115 * (Math.log10(1e5 * 768) - 5.8) + 34} y={TAB_Y - 4} fill={colors.WARM} fontSize={13}>
                    10 ms budget
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\text{cost} = N \\cdot d \\qquad 10^6 \\cdot 768 = 7.7\\times 10^8'}
        x={985}
        y={70}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Exact Search Doesn't Scale
          </text>
          <MathLabel
            tex={'O(N\\,d) \\;\\; \\text{per query} \\; \\Rightarrow \\; \\text{trade proof for probability}'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            1M docs = 77 ms per query — the loop itself is the problem
          </text>
        </g>
      )}
    </>
  );
}

export function NnScale() {
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
