import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  AB_PATHS,
  BEAM_HIST,
  BEST,
  GREEDY_PATH,
  P,
  P_EMPTY,
  RATIO,
  SYMS,
  TOTALS,
  T_FRAMES,
  buildScene,
  latX,
  latY,
} from './scene';

/**
 * CTC and Beam Search — pure render. The lattice sizes, path bundle, totals
 * table, and evolving beams are the exact enumeration and real prefix beam
 * search computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/ctc-beam/overrides.json', slug: 'ctc-beam' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const BUNDLE_COLORS = [colors.SECONDARY, colors.POSITIVE, colors.TEAL, colors.SECONDARY, colors.POSITIVE, colors.TEAL];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const latU = s.get(scene.latU);
  const greedyU = s.get(scene.greedyU);
  const sumU = s.get(scene.sumU);
  const tableU = s.get(scene.tableU);
  const beamU = s.get(scene.beamU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const beamFrame = Math.min(T_FRAMES, Math.max(0, beamU));
  const beamI = Math.min(T_FRAMES - 1, Math.floor(beamFrame - 0.001));
  const beamRows = beamU > 0.15 ? BEAM_HIST[Math.max(0, beamI)] : [];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the lattice */}
          {P.map((row, t) =>
            row.map((p, sym) => {
              const u = clamp01(latU * (T_FRAMES + 3) - t);
              if (u <= 0) return null;
              const onGreedy = greedyU >= t + 0.5 && GREEDY_PATH[t] === sym;
              return (
                <g key={`${t}-${sym}`} opacity={u}>
                  <circle
                    cx={latX(t)}
                    cy={latY(sym)}
                    r={9 + 34 * p}
                    fill={onGreedy ? colors.NEGATIVE : colors.PANEL}
                    opacity={onGreedy ? 0.9 : 0.9}
                    stroke={onGreedy ? colors.NEGATIVE : colors.GRID}
                    strokeWidth={1.5}
                  />
                  <text x={latX(t)} y={latY(sym) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                    {SYMS[sym]}
                  </text>
                  <text x={latX(t)} y={latY(sym) + 34 * p + 24} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                    {p.toFixed(2)}
                  </text>
                </g>
              );
            }),
          )}
          {/* frame labels */}
          {Array.from({ length: T_FRAMES }, (_, t) => (
            <text key={t} x={latX(t)} y={latY(0) - 58} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={latU}>
              {`frame ${t + 1}`}
            </text>
          ))}
          <text x={latX(0) - 88} y={latY(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} opacity={latU}>
            blank
          </text>

          {/* greedy trace */}
          {greedyU > 0 && (
            <g>
              <polyline
                points={GREEDY_PATH.slice(0, Math.max(1, Math.ceil(greedyU)))
                  .map((sym, t) => `${latX(t)},${latY(sym)}`)
                  .join(' ')}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={3}
                opacity={0.8}
              />
              {greedyU >= T_FRAMES - 0.1 && (
                <text x={latX(T_FRAMES - 1) + 56} y={latY(0) + 4} fill={colors.NEGATIVE} fontSize={14}>
                  → ∅
                </text>
              )}
            </g>
          )}

          {/* the AB bundle — real alignments that collapse to AB */}
          {sumU > 0.01 &&
            AB_PATHS.map((path, i) => {
              const u = clamp01(sumU * AB_PATHS.length - i);
              if (u <= 0) return null;
              return (
                <polyline
                  key={i}
                  points={path
                    .map((sym, t) => `${latX(t)},${latY(sym) + (i - 2.5) * 3}`)
                    .join(' ')}
                  fill="none"
                  stroke={BUNDLE_COLORS[i]}
                  strokeWidth={2}
                  opacity={0.55 * u * Math.min(1, sumU * 2)}
                />
              );
            })}
          {sumU > 0.8 && (
            <text x={latX(T_FRAMES - 1) + 56} y={latY(1) + 4} fill={colors.SECONDARY} fontSize={14} opacity={clamp01((sumU - 0.8) * 5) * (sumU > 0.5 ? 1 : 0)}>
              → A B
            </text>
          )}

          {/* transcript totals */}
          {tableU > 0 && (
            <g opacity={tableU}>
              <rect x={935} y={130} width={280} height={200} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={955} y={160} fill={colors.TEXT} fontSize={14} fontWeight={600}>
                all 729 alignments, summed
              </text>
              {TOTALS.slice(0, 4).map(([label, p], i) => (
                <g key={label}>
                  <text x={955} y={192 + i * 28} fill={i === 0 ? colors.POSITIVE : colors.TEXT} fontSize={14}>
                    {label === '' ? '∅' : label.split('').join(' ')}
                  </text>
                  <rect x={1020} y={181 + i * 28} width={p * 900} height={13} rx={3} fill={i === 0 ? colors.POSITIVE : colors.MUTED} opacity={0.8} />
                  <text x={1030 + p * 900} y={192 + i * 28} fill={colors.MUTED} fontSize={12}>
                    {p.toFixed(3)}
                  </text>
                </g>
              ))}
              <text x={955} y={192 + 4 * 28} fill={colors.NEGATIVE} fontSize={14}>
                ∅ (greedy)
              </text>
              <rect x={1055} y={181 + 4 * 28} width={P_EMPTY * 900} height={13} rx={3} fill={colors.NEGATIVE} opacity={0.8} />
              <text x={1065 + P_EMPTY * 900} y={192 + 4 * 28} fill={colors.MUTED} fontSize={12}>
                {P_EMPTY.toFixed(3)}
              </text>
            </g>
          )}

          {/* beam table */}
          {beamU > 0.15 && (
            <g>
              <rect x={935} y={370} width={300} height={188} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={955} y={400} fill={colors.TEXT} fontSize={14} fontWeight={600}>
                {`beam (width 3) after frame ${beamI + 1}`}
              </text>
              {beamRows.map((b, i) => (
                <g key={i}>
                  <text x={955} y={434 + i * 30} fill={i === 0 ? colors.ACCENT : colors.TEXT} fontSize={15}>
                    {b.label === '∅' ? '∅' : b.label.split('').join(' ')}
                  </text>
                  <rect x={1035} y={423 + i * 30} width={b.p * 380} height={14} rx={3} fill={i === 0 ? colors.ACCENT : colors.MUTED} opacity={0.8} />
                  <text x={1045 + b.p * 380} y={434 + i * 30} fill={colors.MUTED} fontSize={12}>
                    {b.p.toFixed(3)}
                  </text>
                </g>
              ))}
              {/* sweep cursor over the lattice */}
              <line
                x1={latX(Math.min(T_FRAMES - 1, beamFrame - 0.5))}
                y1={latY(0) - 48}
                x2={latX(Math.min(T_FRAMES - 1, beamFrame - 0.5))}
                y2={latY(2) + 48}
                stroke={colors.ACCENT}
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.7}
              />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={`p(\\text{AB}) = ${BEST[1].toFixed(3)} \\;\\approx\\; ${RATIO.toFixed(0)}\\,p(\\varnothing)`}
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
            Sum, Then Decide
          </text>
          <MathLabel
            tex={'\\arg\\max_{\\pi} p(\\pi) \\;\\ne\\; \\arg\\max_{y} \\sum_{\\pi \\to y} p(\\pi)'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            greedy read silence at 0.007 — the summed transcript said A B at 0.128
          </text>
        </g>
      )}
    </>
  );
}

export function CtcBeam() {
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
