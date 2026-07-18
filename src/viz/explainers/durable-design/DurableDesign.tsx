import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ABILITIES,
  CHECKLIST,
  FIXED_GAPS,
  REFRESH_GAPS,
  X0,
  X1,
  Y0,
  buildScene,
  gxp,
  gyp,
} from './scene';

/**
 * Designing for Durability — pure render. The frozen-vs-refreshed gap
 * curves come from the seeded 300-item benchmark computed in scene.ts;
 * the checklist and arena caveat carry the sourced public record.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/durable-design/overrides.json', slug: 'durable-design' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function gapPath(vals: number[], u: number): string {
  const n = vals.length;
  const end = u * (n - 1);
  let d = '';
  for (let i = 0; i < n; i++) {
    if (i <= end) d += `${d ? 'L' : 'M'}${gxp(i).toFixed(1)},${gyp(vals[i]).toFixed(1)} `;
    else {
      const t = end - (i - 1);
      if (t > 0) d += `L${(gxp(i - 1) + (gxp(i) - gxp(i - 1)) * t).toFixed(1)},${gyp(vals[i - 1] + (vals[i] - vals[i - 1]) * t).toFixed(1)}`;
      break;
    }
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const fixU = s.get(scene.fixU);
  const refU = s.get(scene.refU);
  const listU = s.get(scene.listU);
  const arenaU = s.get(scene.arenaU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimU * (1 - arenaU)}>
          {/* gap plot */}
          <g opacity={axU}>
            <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={colors.GRID} />
            <line x1={X0} y1={Y0} x2={X0} y2={gyp(15)} stroke={colors.GRID} />
            {[0, 5, 10, 15].map((gp) => (
              <text key={gp} x={X0 - 12} y={gyp(gp) + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                {gp}
              </text>
            ))}
            <text x={X0 - 12} y={gyp(15) - 20} textAnchor="end" fill={colors.MUTED} fontSize={13}>
              gap (pts)
            </text>
            <text x={X1} y={Y0 + 26} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
              frontier ability → (same +0.5 model pair · 300 seeded items)
            </text>
          </g>
          <path d={gapPath(FIXED_GAPS, fixU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
          {fixU > 0.95 && (
            <text x={gxp(ABILITIES.length - 1) + 8} y={gyp(FIXED_GAPS[FIXED_GAPS.length - 1]) + 5} fill={colors.NEGATIVE} fontSize={13.5}>
              {`frozen pool → ${FIXED_GAPS[FIXED_GAPS.length - 1].toFixed(1)}`}
            </text>
          )}
          <path d={gapPath(REFRESH_GAPS, refU)} fill="none" stroke={colors.POSITIVE} strokeWidth={3.5} />
          {refU > 0.95 && (
            <text x={gxp(ABILITIES.length - 1) + 8} y={gyp(REFRESH_GAPS[REFRESH_GAPS.length - 1]) + 5} fill={colors.POSITIVE} fontSize={13.5}>
              {`refreshed pool → ${REFRESH_GAPS[REFRESH_GAPS.length - 1].toFixed(1)}`}
            </text>
          )}

          {/* checklist */}
          {CHECKLIST.map((c, i) => {
            const u = clamp01(listU * 6 - i);
            if (u <= 0) return null;
            const y = 130 + i * 82;
            return (
              <g key={c.rule} opacity={u} transform={`translate(${20 * (1 - u)}, 0)`}>
                <rect x={760} y={y} width={452} height={68} rx={12} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
                <circle cx={786} cy={y + 34} r={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                <path d={`M${781},${y + 34} l4,4 l7,-8`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                <text x={808} y={y + 28} fill={colors.TEXT} fontSize={14.5} fontWeight={600}>
                  {c.rule}
                </text>
                <text x={808} y={y + 52} fill={colors.MUTED} fontSize={12.5}>
                  {c.example}
                </text>
              </g>
            );
          })}
        </g>
      </Camera>

      {/* arena caveat panel (screen-fixed) */}
      {arenaU > 0 && (
        <g opacity={arenaU * dimU}>
          <rect x={250} y={140} width={780} height={330} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
          <text x={286} y={186} fill={colors.TEXT} fontSize={19} fontWeight={650}>
            The self-refreshing benchmark — and its own Goodhart
          </text>
          <text x={286} y={228} fill={colors.POSITIVE} fontSize={15}>
            pairwise Elo arenas: every prompt is fresh — leakage is impossible
          </text>
          <text x={286} y={272} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
            "The Leaderboard Illusion" (2025):
          </text>
          <text x={286} y={302} fill={colors.MUTED} fontSize={14.5}>
            · private variant farming — 27 unpublished Llama-4 variants, best score kept
          </text>
          <text x={286} y={330} fill={colors.MUTED} fontSize={14.5}>
            · votes reward agreeable, flattering answers — sycophancy becomes the metric
          </text>
          <text x={286} y={374} fill={colors.WARM} fontSize={15}>
            an arena cannot leak, but it can be gamed
          </text>
          <text x={286} y={418} fill={colors.ACCENT} fontSize={14.5}>
            every scoring rule has a Goodhart — pick the one your task can verify
          </text>
        </g>
      )}

      {/* thesis card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={200} y={194} width={880} height={250} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Built to Survive Its Own Success
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            a benchmark is a claim about capability — saturation, leakage, Goodhart
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            are what winning looks like from the instrument's side
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.ACCENT} fontSize={18} fontWeight={600}>
            the durable eval stays harder to game than the task is to solve
          </text>
        </g>
      )}
    </>
  );
}

export function DurableDesign() {
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
