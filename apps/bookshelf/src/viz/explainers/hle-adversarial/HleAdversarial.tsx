import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ADV,
  ADV_GAPS,
  ADV_SCORES,
  ADV_THRESHOLD,
  BANK,
  GENS,
  RAND_GAPS,
  RAND_SCORES,
  SORTED_BANK,
  X1,
  Y0,
  buildScene,
  dotPos,
  gx,
  sy,
} from './scene';

/**
 * Humanity's Last Exam: Adversarial Sourcing — pure render. The sieve, both
 * score curves, and every gap bar come from the seeded 400-item bank in
 * scene.ts; the HLE fact panel is the sourced public record.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/hle-adversarial/overrides.json', slug: 'hle-adversarial' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(vals: number[], u: number): string {
  const n = vals.length;
  const end = u * (n - 1);
  let d = '';
  for (let i = 0; i < n; i++) {
    if (i <= end) d += `${d ? 'L' : 'M'}${gx(i).toFixed(1)},${sy(vals[i]).toFixed(1)} `;
    else {
      const t = end - (i - 1);
      if (t > 0) d += `L${(gx(i - 1) + (gx(i) - gx(i - 1)) * t).toFixed(1)},${sy(vals[i - 1] + (vals[i] - vals[i - 1]) * t).toFixed(1)}`;
      break;
    }
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const cullU = s.get(scene.cullU);
  const factU = s.get(scene.factU);
  const plotU = s.get(scene.plotU);
  const randU = s.get(scene.randU);
  const advU = s.get(scene.advU);
  const gapU = s.get(scene.gapU);
  const halfU = s.get(scene.halfU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const dotsOp = (1 - plotU) * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* — the item bank + sieve — */}
        {dotsOp > 0.01 && (
          <g opacity={dotsOp}>
            {SORTED_BANK.map((b, i) => {
              const appear = clamp01(dotsU * 1.35 - (i / SORTED_BANK.length) * 0.35);
              if (appear <= 0) return null;
              const easy = b < ADV_THRESHOLD; // gen-0 model probably answers it
              const cull = easy ? clamp01(cullU * 1.4 - (i / SORTED_BANK.length) * 0.4) : 0;
              const p = dotPos(i);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y + cull * 46}
                  r={6.5 * appear * (1 - 0.8 * cull)}
                  fill={easy ? colors.MUTED : colors.SECONDARY}
                  opacity={(0.9 - 0.85 * cull) * appear}
                />
              );
            })}
            {dotsU > 0.4 && (
              <g opacity={clamp01((dotsU - 0.4) * 3)}>
                <text x={220} y={126} fill={colors.MUTED} fontSize={13.5}>
                  400 candidate questions, sorted easy → hard (seeded toy bank)
                </text>
                <text x={220} y={392} fill={colors.MUTED} fontSize={13} opacity={cullU}>
                  {`sieve: keep only items the gen-0 model fails → ${ADV.length} of ${BANK.length} survive`}
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* HLE fact panel (screen-fixed) */}
      {factU > 0 && (
        <g opacity={factU * dimU * (1 - plotU)}>
          <rect x={780} y={430} width={420} height={180} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={804} y={462} fill={colors.TEXT} fontSize={15} fontWeight={650}>
            Humanity's Last Exam (Jan 2025)
          </text>
          <text x={804} y={492} fill={colors.MUTED} fontSize={13.5}>
            2,500 expert questions · $500k prizes
          </text>
          <text x={804} y={518} fill={colors.WARM} fontSize={13.5}>
            accepted only if frontier models FAILED it
          </text>
          <text x={804} y={544} fill={colors.MUTED} fontSize={13.5}>
            private held-out set guards overfitting
          </text>
          <text x={804} y={570} fill={colors.MUTED} fontSize={13.5}>
            launch: GPT-4o ~3% · o1 ~9% (reported)
          </text>
        </g>
      )}

      {/* — the two score curves — */}
      {plotU > 0 && (
        <g opacity={plotU * dimU}>
          <line x1={gx(0)} y1={Y0} x2={X1} y2={Y0} stroke={colors.GRID} />
          {Array.from({ length: GENS }, (_, i) => (
            <text key={i} x={gx(i)} y={Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              {`gen ${i}`}
            </text>
          ))}
          {[0, 50, 100].map((p) => (
            <g key={p}>
              <text x={gx(0) - 12} y={sy(p) + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                {p}
              </text>
              <line x1={gx(0)} y1={sy(p)} x2={X1} y2={sy(p)} stroke={colors.GRID} strokeDasharray="3 9" opacity={0.4} />
            </g>
          ))}
          <text x={X1} y={Y0 + 48} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
            toy simulation — same models, two question sets
          </text>

          <path d={curvePath(RAND_SCORES, randU)} fill="none" stroke={colors.MUTED} strokeWidth={3} />
          {randU > 0.95 && (
            <text x={gx(GENS - 1) + 8} y={sy(RAND_SCORES[GENS - 1]) + 4} fill={colors.MUTED} fontSize={13.5}>
              random sample
            </text>
          )}
          <path d={curvePath(ADV_SCORES, advU)} fill="none" stroke={colors.SECONDARY} strokeWidth={3.5} />
          {advU > 0.95 && (
            <text x={gx(GENS - 1) + 8} y={sy(ADV_SCORES[GENS - 1]) + 22} fill={colors.SECONDARY} fontSize={13.5}>
              {`adversarial (${ADV_SCORES[GENS - 1].toFixed(1)} by gen 6)`}
            </text>
          )}
          {advU > 0.05 && (
            <text x={gx(0) + 8} y={sy(ADV_SCORES[0]) + 24} fill={colors.SECONDARY} fontSize={13.5}>
              {`gen 0: ${ADV_SCORES[0].toFixed(1)}%`}
            </text>
          )}

          {/* per-generation discrimination bars */}
          {gapU > 0 && (
            <g opacity={gapU}>
              {ADV_GAPS.map((ag, i) => {
                const x = (gx(i) + gx(i + 1)) / 2;
                return (
                  <g key={i}>
                    <rect x={x - 14} y={sy(0) - RAND_GAPS[i] * 3.4} width={11} height={RAND_GAPS[i] * 3.4} fill={colors.MUTED} opacity={0.55} />
                    <rect x={x + 3} y={sy(0) - ag * 3.4} width={11} height={ag * 3.4} fill={colors.SECONDARY} opacity={0.8} />
                  </g>
                );
              })}
              <text x={gx(0) + 4} y={sy(0) - 78} fill={colors.TEXT} fontSize={13.5}>
                {`gap between consecutive gens: random ${RAND_GAPS[GENS - 2].toFixed(1)} vs adversarial ${ADV_GAPS[GENS - 2].toFixed(1)} pts late`}
              </text>
            </g>
          )}

          {/* public-record half-life marker */}
          {halfU > 0 && (
            <g opacity={halfU}>
              <rect x={790} y={96} width={400} height={120} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
              <text x={814} y={128} fill={colors.TEXT} fontSize={14.5} fontWeight={650}>
                reported HLE scores (replotted era)
              </text>
              <text x={814} y={158} fill={colors.MUTED} fontSize={13.5}>
                Jan 2025 launch: best ~3–9%
              </text>
              <text x={814} y={184} fill={colors.WARM} fontSize={13.5}>
                mid-2026 frontier: ~45–53% → rolling refresh
              </text>
            </g>
          )}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={210} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            A Filter Has a Half-Life
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            adversarial sourcing buys a moving floor, not immortality
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
            durability means the sieve keeps running — a design problem
          </text>
        </g>
      )}
    </>
  );
}

export function HleAdversarial() {
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
