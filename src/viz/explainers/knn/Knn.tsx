import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BARS,
  CHART,
  CONTRAST,
  DIMS,
  FIELD_COLS,
  FIELD_KS,
  FIELD_ROWS,
  LOO_ERR,
  LOO_KS,
  PLOT,
  POINTS,
  buildScene,
  fieldAt,
  nearest,
  sx,
  sy,
  tourAt,
} from './scene';

/**
 * k-Nearest Neighbors — memory as a model.
 * Pure render: the real kNN vote field (k = 1 → 7 → 25) as a morphing
 * two-color map, a wandering query with live neighbor links, the actual
 * leave-one-out error per k, and the measured distance-contrast collapse.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/knn/overrides.json', slug: 'knn' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const CELL_W = PLOT.w / FIELD_COLS;
const CELL_H = PLOT.h / FIELD_ROWS;
const CLASS0 = colors.ACCENT;
const CLASS1 = colors.WARM;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const queryU = s.get(scene.queryU);
  const tourU = s.get(scene.tourU);
  const kLinks = s.get(scene.kLinks);
  const fieldU = s.get(scene.fieldU);
  const kMix = s.get(scene.kMix);
  const chartU = s.get(scene.chartU);
  const chartProg = s.get(scene.chartProg);
  const curseU = s.get(scene.curseU);
  const curseProg = s.get(scene.curseProg);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const q = tourAt(tourU);
  const links = kLinks > 0 && queryU > 0 ? nearest(q.x, q.y, 1) : [];
  const qVote = links.length ? POINTS[links[0]].c : 0;

  const kShown = kMix < 0.5 ? FIELD_KS[0] : kMix < 1.5 ? FIELD_KS[1] : FIELD_KS[2];

  const maxErr = Math.max(...LOO_ERR);
  const barW = CHART.w / LOO_KS.length;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the vote field — the REAL kNN decision map */}
          {fieldU > 0 && (
            <g opacity={fieldU * 0.8}>
              {Array.from({ length: FIELD_ROWS * FIELD_COLS }, (_, idx) => {
                const r = Math.floor(idx / FIELD_COLS);
                const c = idx % FIELD_COLS;
                const v = fieldAt(kMix, idx); // fraction voting class 1
                const col = v >= 0.5 ? CLASS1 : CLASS0;
                const conf = Math.abs(v - 0.5) * 2;
                return (
                  <rect
                    key={idx}
                    x={PLOT.x + c * CELL_W}
                    y={PLOT.y + r * CELL_H}
                    width={CELL_W + 0.5}
                    height={CELL_H + 0.5}
                    fill={col}
                    opacity={0.1 + 0.16 * conf}
                  />
                );
              })}
            </g>
          )}

          {/* plot frame */}
          <rect
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.w}
            height={PLOT.h}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={1.5}
            opacity={ptsU}
          />

          {/* training points */}
          {POINTS.map((p, i) => {
            const u = clamp01(ptsU * 1.6 - (i % 40) / 60);
            return (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={5 * u}
                fill={p.c === 1 ? CLASS1 : CLASS0}
                stroke={colors.BG}
                strokeWidth={1}
                opacity={0.92}
              />
            );
          })}

          {/* neighbor links + query */}
          {queryU > 0 && (
            <g opacity={queryU}>
              {links.map((i) => (
                <line
                  key={i}
                  x1={sx(q.x)}
                  y1={sy(q.y)}
                  x2={sx(POINTS[i].x)}
                  y2={sy(POINTS[i].y)}
                  stroke={colors.TEXT}
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  opacity={kLinks * 0.85}
                />
              ))}
              <circle
                cx={sx(q.x)}
                cy={sy(q.y)}
                r={9}
                fill={kLinks > 0.5 ? (qVote === 1 ? CLASS1 : CLASS0) : colors.PANEL}
                stroke={colors.TEXT}
                strokeWidth={2.2}
              />
              <text x={sx(q.x)} y={sy(q.y) - 16} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                ?
              </text>
            </g>
          )}

          {/* k badge */}
          {fieldU > 0 && (
            <g opacity={fieldU}>
              <rect x={PLOT.x} y={PLOT.y - 40} width={96} height={30} rx={8} fill={colors.PANEL} opacity={0.9} stroke={colors.GRID} />
              <text x={PLOT.x + 48} y={PLOT.y - 19} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                {`k = ${kShown}`}
              </text>
            </g>
          )}

          {/* leave-one-out error chart */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <text x={CHART.x + CHART.w / 2} y={CHART.y - 26} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
                leave-one-out mistakes (of 80)
              </text>
              <line
                x1={CHART.x}
                y1={CHART.y + CHART.h}
                x2={CHART.x + CHART.w}
                y2={CHART.y + CHART.h}
                stroke={colors.GRID}
                strokeWidth={1.5}
              />
              {LOO_KS.map((k, i) => {
                const u = clamp01(chartProg - i);
                const h = (LOO_ERR[i] / (maxErr + 2)) * CHART.h * u;
                const best = LOO_ERR[i] === Math.min(...LOO_ERR);
                return (
                  <g key={k}>
                    <rect
                      x={CHART.x + i * barW + 10}
                      y={CHART.y + CHART.h - h}
                      width={barW - 20}
                      height={h}
                      rx={6}
                      fill={best ? colors.POSITIVE : colors.SECONDARY}
                      opacity={0.85}
                    />
                    {u > 0.9 && (
                      <text
                        x={CHART.x + i * barW + barW / 2}
                        y={CHART.y + CHART.h - h - 8}
                        textAnchor="middle"
                        fill={colors.TEXT}
                        fontSize={14}
                      >
                        {LOO_ERR[i]}
                      </text>
                    )}
                    <text
                      x={CHART.x + i * barW + barW / 2}
                      y={CHART.y + CHART.h + 20}
                      textAnchor="middle"
                      fill={colors.MUTED}
                      fontSize={13}
                    >
                      {`k=${k}`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* curse of dimensionality — contrast bars (log scale) */}
        {curseU > 0 && (
          <g opacity={curseU}>
            <text x={BARS.x + BARS.w / 2} y={BARS.y - 22} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
              distance contrast (farthest − nearest) / nearest
            </text>
            {DIMS.map((d, i) => {
              const u = clamp01(curseProg - i);
              const rowH = BARS.h / DIMS.length;
              const y = BARS.y + i * rowH;
              // log scale: 0.1 → 0, 300 → full width
              const frac = clamp01(Math.log10(CONTRAST[i] / 0.1) / Math.log10(300 / 0.1));
              const w = BARS.w * 0.72 * frac * u;
              return (
                <g key={d}>
                  <text x={BARS.x + 52} y={y + rowH / 2 + 5} textAnchor="end" fill={colors.MUTED} fontSize={14}>
                    {`d = ${d}`}
                  </text>
                  <rect
                    x={BARS.x + 64}
                    y={y + rowH / 2 - 10}
                    width={Math.max(2, w)}
                    height={20}
                    rx={6}
                    fill={CONTRAST[i] > 1 ? colors.POSITIVE : colors.NEGATIVE}
                    opacity={0.85}
                  />
                  {u > 0.9 && (
                    <text x={BARS.x + 72 + w} y={y + rowH / 2 + 5} fill={colors.TEXT} fontSize={13}>
                      {CONTRAST[i] >= 10 ? CONTRAST[i].toFixed(0) : CONTRAST[i].toFixed(2)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={260} y={230} width={760} height={190} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            k-Nearest Neighbors
          </text>
          <text x={640} y={342} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            no training, all memory — small k memorizes noise, large k blurs signal
          </text>
          <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            and in high dimensions, “near” stops meaning anything
          </text>
        </g>
      )}
    </>
  );
}

export function Knn() {
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
