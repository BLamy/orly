import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { FULL, GLYPHS, L, STEPX, STRIP, TOKS, V, buildScene, tokX } from './scene';

/**
 * Circuits — an induction head you can read.
 * Pure render: the 20-token strip, head 1's real previous-token attention
 * arcs (below), head 2's real induction attention (above) sliding across the
 * repeat, and the prediction row filling 9/9.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/induction-head/overrides.json', slug: 'induction-head' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const TOKC = [
  '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185',
  '#5eead4', '#f0abfc', '#93c5fd', '#fca5a5', '#bef264',
];

function arc(x1: number, x2: number, y: number, up: boolean, h: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y} Q${mx},${y + (up ? -h : h)} ${x2},${y}`;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stripU = s.get(scene.stripU);
  const h1Prog = s.get(scene.h1Prog);
  const h1WriteU = s.get(scene.h1WriteU);
  const qPos = s.get(scene.qPos);
  const h2U = s.get(scene.h2U);
  const predProg = s.get(scene.predProg);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const qi = Math.max(10, Math.min(18, Math.round(qPos)));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* half markers */}
          <g opacity={stripU * 0.8}>
            <text x={tokX(4.5)} y={STRIP.y - 120} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
              first pass
            </text>
            <text x={tokX(14.5)} y={STRIP.y - 120} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
              the repeat
            </text>
            <line x1={tokX(9.5)} y1={STRIP.y - 110} x2={tokX(9.5)} y2={STRIP.y + 90} stroke={colors.GRID} strokeWidth={1.4} strokeDasharray="4 5" />
          </g>

          {/* token chips */}
          {TOKS.map((t, i) => {
            const u = clamp01(stripU * 1.8 - i / 30);
            return (
              <g key={i} opacity={u}>
                <rect x={tokX(i) - STEPX * 0.36} y={STRIP.y - 20} width={STEPX * 0.72} height={40} rx={9} fill={colors.PANEL} stroke={TOKC[t]} strokeWidth={2} />
                <text x={tokX(i)} y={STRIP.y + 7} textAnchor="middle" fill={TOKC[t]} fontSize={17} fontWeight={700} fontFamily="ui-monospace, monospace">
                  {GLYPHS[t]}
                </text>
              </g>
            );
          })}

          {/* head 1: previous-token arcs (below strip) — real A1 weights */}
          {Array.from({ length: L }, (_, i) => {
            if (i === 0) return null;
            const u = clamp01(h1Prog - i);
            if (u <= 0) return null;
            const w = FULL.A1[i][i - 1]; // ≈ 1.0
            return (
              <path
                key={i}
                d={arc(tokX(i), tokX(i - 1), STRIP.y + 24, false, 34)}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={1.2 + 2.4 * w}
                opacity={0.55 * u}
              />
            );
          })}
          {h1Prog > 2 && (
            <text x={STRIP.x + 6} y={STRIP.y + 86} fill={colors.SECONDARY} fontSize={13.5} opacity={clamp01(h1Prog / 4)}>
              head 1 — attends one step back (weight ≈ 1.0)
            </text>
          )}

          {/* head 1's written note */}
          {h1WriteU > 0 &&
            TOKS.map((t, i) => {
              if (i === 0) return null;
              return (
                <g key={i} opacity={h1WriteU * 0.9}>
                  <rect x={tokX(i) - STEPX * 0.3} y={STRIP.y + 32} width={STEPX * 0.6} height={22} rx={6} fill="none" stroke={TOKC[TOKS[i - 1]]} strokeWidth={1.4} strokeDasharray="3 3" />
                  <text x={tokX(i)} y={STRIP.y + 48} textAnchor="middle" fill={TOKC[TOKS[i - 1]]} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    {GLYPHS[TOKS[i - 1]]}
                  </text>
                </g>
              );
            })}

          {/* head 2: induction attention from the current query position — real A2 row */}
          {h2U > 0 && (
            <g opacity={h2U}>
              {FULL.A2[qi].map((w, j) =>
                w > 0.03 && j !== qi ? (
                  <path
                    key={j}
                    d={arc(tokX(qi), tokX(j), STRIP.y - 26, true, 60 + Math.abs(qi - j) * 3)}
                    fill="none"
                    stroke={colors.WARM}
                    strokeWidth={1 + 4.5 * w}
                    opacity={0.35 + 0.6 * w}
                  />
                ) : null,
              )}
              <circle cx={tokX(qi)} cy={STRIP.y - 30} r={6} fill={colors.WARM} />
              <text x={tokX(qi)} y={STRIP.y - 42} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
                query
              </text>
              <text x={STRIP.x + 6} y={STRIP.y - 96} fill={colors.WARM} fontSize={13.5}>
                head 2 — attends where its note matches the current token
              </text>
            </g>
          )}

          {/* prediction row on the repeat */}
          {Array.from({ length: 9 }, (_, k) => {
            const i = 10 + k;
            const u = clamp01(predProg - k);
            if (u <= 0) return null;
            const pred = FULL.pred[i];
            const okP = pred === TOKS[i + 1];
            return (
              <g key={i} opacity={u}>
                <text x={tokX(i) + STEPX / 2} y={STRIP.y + 116} textAnchor="middle" fill={okP ? colors.POSITIVE : colors.NEGATIVE} fontSize={14} fontFamily="ui-monospace, monospace">
                  {GLYPHS[pred]}
                </text>
                <text x={tokX(i) + STEPX / 2} y={STRIP.y + 134} textAnchor="middle" fill={okP ? colors.POSITIVE : colors.NEGATIVE} fontSize={11}>
                  {okP ? '✓' : '✗'}
                </text>
              </g>
            );
          })}
          {predProg > 0.5 && (
            <text x={STRIP.x + 6} y={STRIP.y + 134} fill={colors.MUTED} fontSize={13} opacity={clamp01(predProg)}>
              predicted next:
            </text>
          )}

          {/* badge */}
          {badgeU > 0 && (
            <g opacity={badgeU}>
              <rect x={tokX(13)} y={STRIP.y + 156} width={220} height={38} rx={10} fill={colors.PANEL} opacity={0.93} stroke={colors.POSITIVE} />
              <text x={tokX(13) + 110} y={STRIP.y + 181} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
                repeat half: 9 / 9 correct
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Induction Circuit
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            match the current token in the past, step forward, copy — 9 / 9
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            an algorithm read directly off two attention heads
          </text>
        </g>
      )}
    </>
  );
}
void V;

export function InductionHead() {
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
