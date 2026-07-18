import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DRAWS,
  DRAW_HITS,
  FLIP_DX,
  FLIP_X0,
  FLIP_Y,
  HG_BW,
  HG_H,
  HG_Y0,
  HIST_BINS,
  HIST_MAX,
  M,
  ORDER,
  P,
  PASS1,
  PICK_IDX,
  PICK_P,
  STRIP_Y,
  buildScene,
  hgX,
  stripX,
} from './scene';

/**
 * One Sample Is a Lottery Ticket — pure render. Strip, coin flips, and
 * histogram all come from the real toy suite in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/sample-lottery/overrides.json', slug: 'sample-lottery' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const PICK_STRIP_K = ORDER.indexOf(PICK_IDX);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stripU = s.get(scene.stripU);
  const pickU = s.get(scene.pickU);
  const flipU = s.get(scene.flipU);
  const histU = s.get(scene.histU);
  const meanU = s.get(scene.meanU);
  const hookU = s.get(scene.hookU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const shown = Math.floor(Math.min(20, flipU));
  let hits = 0;
  for (let i = 0; i < shown; i++) if (DRAWS[i]) hits++;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the strip of problems */}
          {ORDER.map((idx, k) => {
            const u = clamp01(stripU * 1.4 - k / M);
            if (u <= 0) return null;
            return (
              <circle
                key={idx}
                cx={stripX(k)}
                cy={STRIP_Y + Math.sin(k * 1.7) * 16}
                r={idx === PICK_IDX && pickU > 0 ? 8 : 3}
                fill={colors.heat(P[idx])}
                stroke={idx === PICK_IDX && pickU > 0 ? colors.TEXT : 'none'}
                strokeWidth={1.5}
                opacity={u * 0.85}
              />
            );
          })}
          {stripU > 0.5 && (
            <g opacity={stripU}>
              <text x={stripX(0)} y={STRIP_Y + 52} fill={colors.MUTED} fontSize={12.5}>
                p ≈ 0.05 (nearly hopeless)
              </text>
              <text x={stripX(M - 1)} y={STRIP_Y + 52} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                p ≈ 0.95 (nearly certain)
              </text>
              <text x={640} y={STRIP_Y - 50} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                300 problems · sorted by single-sample success probability
              </text>
            </g>
          )}
          {pickU > 0 && (
            <text x={stripX(PICK_STRIP_K)} y={STRIP_Y - 28} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={pickU}>
              {`this one: p = ${PICK_P.toFixed(2)}`}
            </text>
          )}

          {/* coin flips */}
          {shown > 0 && (
            <g>
              {DRAWS.slice(0, shown).map((hit, i) => (
                <g key={i}>
                  <circle
                    cx={FLIP_X0 + (i % 10) * FLIP_DX}
                    cy={FLIP_Y + Math.floor(i / 10) * 46}
                    r={15}
                    fill={hit ? colors.POSITIVE : colors.NEGATIVE}
                    opacity={0.9}
                  />
                  <text
                    x={FLIP_X0 + (i % 10) * FLIP_DX}
                    y={FLIP_Y + Math.floor(i / 10) * 46 + 5}
                    textAnchor="middle"
                    fill={colors.BG}
                    fontSize={13}
                    fontWeight={700}
                  >
                    {hit ? '✓' : '✗'}
                  </text>
                </g>
              ))}
              <text x={FLIP_X0 + 10 * FLIP_DX + 10} y={FLIP_Y + 28} fill={colors.TEXT} fontSize={15}>
                {`${hits} / ${shown} correct`}
              </text>
              {shown >= 20 && (
                <text x={FLIP_X0 + 10 * FLIP_DX + 10} y={FLIP_Y + 52} fill={colors.MUTED} fontSize={12.5}>
                  {`true rate ${PICK_P.toFixed(2)} · observed ${(DRAW_HITS / 20).toFixed(2)}`}
                </text>
              )}
            </g>
          )}

          {/* histogram */}
          {histU > 0 && (
            <g>
              {HIST_BINS.map((c, b) => {
                const u = clamp01(histU * 1.5 - b * 0.05);
                const h = (c / HIST_MAX) * HG_H * u;
                return (
                  <rect
                    key={b}
                    x={hgX(b)}
                    y={HG_Y0 - h}
                    width={HG_BW}
                    height={h}
                    rx={3}
                    fill={colors.heat((b + 0.5) / 10)}
                    opacity={0.85}
                  />
                );
              })}
              <line x1={hgX(0) - 6} y1={HG_Y0} x2={hgX(10) + 6} y2={HG_Y0} stroke={colors.GRID} />
              <text x={hgX(5)} y={HG_Y0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                per-problem success probability →
              </text>
              {meanU > 0 && (
                <g opacity={meanU}>
                  <line x1={hgX(PASS1 * 10)} y1={HG_Y0 - HG_H - 16} x2={hgX(PASS1 * 10)} y2={HG_Y0} stroke={colors.TEXT} strokeDasharray="5 4" strokeWidth={1.8} />
                  <text x={hgX(PASS1 * 10)} y={HG_Y0 - HG_H - 26} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                    {`mean = ${(PASS1 * 100).toFixed(1)}% — "the accuracy"`}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'P(\\text{at least one hit}) = 1-(1-p)^{16}'}
        x={1010}
        y={70}
        fontSize={18}
        color={colors.WARM}
        opacity={hookU}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            One Sample Is a Lottery Ticket
          </text>
          <MathLabel
            tex={`\\text{pass@}1 = ${(PASS1 * 100).toFixed(1)}\\% \\qquad p \\in [0.05, 0.95]`}
            x={640}
            y={340}
            fontSize={20}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            accuracy is one number hiding a whole distribution of odds
          </text>
        </g>
      )}
    </>
  );
}

export function SampleLottery() {
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
