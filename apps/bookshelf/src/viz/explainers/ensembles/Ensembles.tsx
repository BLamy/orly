import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  APLOT,
  AVG_CURVE,
  B,
  BOOST,
  BOOST_PTS,
  BPLOT,
  DATA,
  GRID_N,
  RPANEL,
  STD_BAGGED,
  STD_SINGLE,
  TREE_CURVES,
  TRUTH,
  XS,
  ax2,
  ay2,
  buildScene,
  bx,
  by,
  weightAt,
} from './scene';

/**
 * Ensembles — the wisdom of weak learners.
 * Pure render: 30 real bootstrap regression trees as a wispy band, their
 * average emerging smooth (measured stds 0.058 vs 0.011), then a real
 * AdaBoost run — point sizes are the actual weights, stumps the actual cuts,
 * the error counter the actual ensemble error per round.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/ensembles/overrides.json', slug: 'ensembles' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const curvePath = (ys: number[]): string => ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${ax2(XS[i])},${ay2(y)}`).join('');
const TREE_PATHS = TREE_CURVES.map((c) => curvePath(c));
const AVG_PATH = curvePath(AVG_CURVE);
const TRUTH_PATH = curvePath(XS.map((x) => TRUTH(x)));
void GRID_N;

const NEG = colors.ACCENT;
const POS = colors.WARM;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const aU = s.get(scene.aU);
  const dataU = s.get(scene.dataU);
  const oneTreeU = s.get(scene.oneTreeU);
  const manyU = s.get(scene.manyU);
  const avgU = s.get(scene.avgU);
  const statsU = s.get(scene.statsU);
  const bU = s.get(scene.bU);
  const bPtsU = s.get(scene.bPtsU);
  const roundF = s.get(scene.roundF);
  const stumpsU = s.get(scene.stumpsU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const roundShown = Math.max(0, Math.min(BOOST.length, Math.ceil(roundF - 1e-4)));
  const ensErr = roundShown > 0 ? BOOST[roundShown - 1].ensErr : null;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ————— Part A · bagging ————— */}
          {aU > 0.01 && (
            <g opacity={aU}>
              <rect x={APLOT.x} y={APLOT.y} width={APLOT.w} height={APLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={dataU} />
              {/* hidden truth */}
              <path d={TRUTH_PATH} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="7 6" opacity={dataU * 0.5} />
              {/* data */}
              {DATA.map((p, i) => (
                <circle key={i} cx={ax2(p.x)} cy={ay2(p.y)} r={4 * clamp01(dataU * 1.5 - i / 120)} fill={colors.SECONDARY} opacity={0.85} />
              ))}
              {/* the wispy bootstrap trees */}
              {TREE_PATHS.map((d, i) =>
                i === 0 ? null : (
                  <path key={i} d={d} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.1} opacity={0.22 * clamp01(manyU - i)} />
                ),
              )}
              {/* one tree, bold at first */}
              <path d={TREE_PATHS[0]} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.6} opacity={oneTreeU} />
              {/* the bagged average */}
              <path d={AVG_PATH} fill="none" stroke={colors.POSITIVE} strokeWidth={3.4} opacity={avgU} />
              {avgU > 0.5 && (
                <text x={ax2(0.86)} y={ay2(AVG_CURVE[Math.floor(0.93 * (XS.length - 1))]) - 14} fill={colors.POSITIVE} fontSize={15} opacity={avgU}>
                  average of 30 trees
                </text>
              )}
              {/* measured variance panel */}
              {statsU > 0 && (
                <g opacity={statsU}>
                  <rect x={APLOT.x + 20} y={APLOT.y + 18} width={330} height={92} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                  <text x={APLOT.x + 40} y={APLOT.y + 48} fill={colors.NEGATIVE} fontSize={15}>
                    {`single tree spread   σ = ${STD_SINGLE.toFixed(3)}`}
                  </text>
                  <text x={APLOT.x + 40} y={APLOT.y + 74} fill={colors.POSITIVE} fontSize={15}>
                    {`bag of ${B} spread      σ = ${STD_BAGGED.toFixed(3)}`}
                  </text>
                  <text x={APLOT.x + 40} y={APLOT.y + 98} fill={colors.MUTED} fontSize={13.5}>
                    variance ratio 0.036 ≈ 1 / 30
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ————— Part B · boosting ————— */}
          {bU > 0.01 && (
            <g opacity={bU}>
              <rect x={BPLOT.x} y={BPLOT.y} width={BPLOT.w} height={BPLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={bPtsU} />
              {/* stump cut lines (the real chosen stumps) */}
              {BOOST.map(({ stump }, i) => {
                const u = clamp01(stumpsU - i);
                if (u <= 0) return null;
                return stump.ax === 'x' ? (
                  <line
                    key={i}
                    x1={bx(stump.t)}
                    y1={BPLOT.y}
                    x2={bx(stump.t)}
                    y2={BPLOT.y + BPLOT.h * u}
                    stroke={colors.POSITIVE}
                    strokeWidth={2.2}
                    opacity={0.4 + 0.5 * clamp01(stump.alpha)}
                  />
                ) : (
                  <line
                    key={i}
                    x1={BPLOT.x}
                    y1={by(stump.t)}
                    x2={BPLOT.x + BPLOT.w * u}
                    y2={by(stump.t)}
                    stroke={colors.POSITIVE}
                    strokeWidth={2.2}
                    opacity={0.4 + 0.5 * clamp01(stump.alpha)}
                  />
                );
              })}
              {/* points, radius = live boosting weight */}
              {BOOST_PTS.map((p, j) => {
                const w = weightAt(roundF, j);
                const r = 3 + 240 * w; // uniform 1/60 → r 7
                return (
                  <circle
                    key={j}
                    cx={bx(p.x)}
                    cy={by(p.y)}
                    r={r * bPtsU}
                    fill={p.c === 1 ? POS : NEG}
                    stroke={colors.BG}
                    strokeWidth={1}
                    opacity={0.9}
                  />
                );
              })}

              {/* round panel */}
              <g opacity={bPtsU}>
                <text x={RPANEL.x} y={RPANEL.y} fill={colors.TEXT} fontSize={17} fontWeight={600}>
                  boosting rounds (real run)
                </text>
                {BOOST.map(({ stump, ensErr: e }, i) => {
                  const u = clamp01(roundF - i);
                  if (u <= 0) return null;
                  return (
                    <g key={i} opacity={u}>
                      <text x={RPANEL.x} y={RPANEL.y + 36 + i * 30} fill={colors.MUTED} fontSize={14.5} fontFamily="ui-monospace, monospace">
                        {`r${i + 1}  ${stump.ax} > ${stump.t.toFixed(2)}   ε ${stump.err.toFixed(2)}   α ${stump.alpha.toFixed(2)}`}
                      </text>
                      <text x={RPANEL.x + 340} y={RPANEL.y + 36 + i * 30} fill={e === 0 ? colors.POSITIVE : colors.WARM} fontSize={14.5}>
                        {`${e} wrong`}
                      </text>
                    </g>
                  );
                })}
                {ensErr !== null && (
                  <g>
                    <rect x={RPANEL.x} y={RPANEL.y + 230} width={300} height={40} rx={10} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                    <text x={RPANEL.x + 18} y={RPANEL.y + 256} fill={ensErr === 0 ? colors.POSITIVE : colors.TEXT} fontSize={15.5}>
                      {`ensemble error: ${ensErr} / 60`}
                    </text>
                  </g>
                )}
              </g>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={225} width={820} height={200} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Ensembles
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            bagging: average independent errors away (σ 0.058 → 0.011)
          </text>
          <text x={640} y={374} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            boosting: stack weak learners on each other’s mistakes (4 → 0 wrong)
          </text>
        </g>
      )}
    </>
  );
}

export function Ensembles() {
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
