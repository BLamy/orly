import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  DIST_Y0,
  FINAL,
  GENS,
  HIST,
  PEAK_CAP,
  buildScene,
  chX,
  chY,
  dx,
  dy,
  gauss,
  genAt,
} from './scene';

/**
 * Model Collapse — pure render. The morphing curve and the sd chart sample
 * the real 30-generation run from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/model-collapse/overrides.json', slug: 'model-collapse' };

// Drift annotation rides on its own band above the stage, clear of the curve.
const DRIFT_Y = 0.52;

function curvePath(mu: number, sd: number, vs: number): string {
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const x = -3.2 + (i / 160) * 6.4;
    d += `${i === 0 ? 'M' : 'L'}${dx(x).toFixed(1)} ${dy(gauss(x, mu, sd) * vs).toFixed(1)}`;
  }
  return d;
}

function sdPath(upTo: number): string {
  const n = Math.max(2, Math.min(GENS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(HIST[i].sd).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const curveU = s.get(scene.curveU);
  const gen = s.get(scene.gen);
  const ghostU = s.get(scene.ghostU);
  const axU = s.get(scene.axU);
  const tailU = s.get(scene.tailU);
  const driftU = s.get(scene.driftU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const now = genAt(gen);
  const genIdx = Math.round(Math.min(GENS, gen));
  // One vertical scale for the true curve and the model: capped at PEAK_CAP so a
  // narrowing model stays on the stage, and shared so the two stay comparable.
  const vs = Math.min(1, PEAK_CAP / gauss(now.mu, now.mu, now.sd));
  const peak = gauss(now.mu, now.mu, now.sd) * vs;
  // The fifty draws the current fit is producing right now.
  const draws = HIST[Math.min(GENS, genIdx + 1)].samples;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* distribution stage */}
          {curveU > 0 && (
            <g>
              <line x1={dx(-3.2)} y1={DIST_Y0} x2={dx(3.2)} y2={DIST_Y0} stroke={colors.GRID} opacity={curveU} />
              {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
                <text key={t} x={dx(t)} y={DIST_Y0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={curveU}>
                  {t}
                </text>
              ))}
              {/* sample rug: each dot is one of this generation's fifty draws */}
              {draws.map((x, i) => (
                <circle key={i} cx={dx(x)} cy={DIST_Y0 + 6} r={2.2} fill={colors.NEGATIVE} opacity={curveU * 0.6} />
              ))}
              {/* ghost of the truth */}
              <path d={curvePath(0, 1, vs)} fill="none" stroke={colors.ACCENT} strokeWidth={2} opacity={ghostU * 0.5} strokeDasharray="6 5" />
              {ghostU > 0.4 && (
                <text x={dx(-2.6)} y={dy(0.47)} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={ghostU}>
                  the truth (never seen again)
                </text>
              )}
              {/* the collapsing model */}
              <path d={curvePath(now.mu, now.sd, vs)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.2} opacity={curveU} />
              <text x={dx(now.mu)} y={dy(peak) - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={630}>
                {`generation ${genIdx} · spread ${now.sd.toFixed(2)}`}
              </text>
            </g>
          )}
          {tailU > 0 && (
            <g opacity={tailU}>
              <rect x={dx(2)} y={dy(0.4)} width={dx(3.2) - dx(2)} height={DIST_Y0 - dy(0.4)} fill={colors.NEGATIVE} opacity={0.08} />
              <rect x={dx(-3.2)} y={dy(0.4)} width={dx(-2) - dx(-3.2)} height={DIST_Y0 - dy(0.4)} fill={colors.NEGATIVE} opacity={0.08} />
              <text x={dx(2.6)} y={dy(0.37)} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
                tails: extinct
              </text>
            </g>
          )}
          {driftU > 0 && (
            <g opacity={driftU}>
              <line x1={dx(0)} y1={dy(DRIFT_Y)} x2={dx(now.mu)} y2={dy(DRIFT_Y)} stroke={colors.WARM} strokeWidth={2.5} />
              <text x={dx(now.mu / 2)} y={dy(DRIFT_Y) - 8} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                {`drift: +${now.mu.toFixed(2)}`}
              </text>
            </g>
          )}

          {/* sd chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(GENS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.05)} stroke={colors.GRID} />
              <text x={chX(GENS / 2)} y={CH_Y0 + 28} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                generation →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                1.0
              </text>
              <line x1={CH_X0 - 8} y1={chY(1)} x2={chX(GENS) + 10} y2={chY(1)} stroke={colors.ACCENT} strokeDasharray="4 5" opacity={0.5} />
              <text x={CH_X0} y={chY(1.05) - 8} fill={colors.MUTED} fontSize={14}>
                spread of the model
              </text>
            </g>
          )}
          {axU > 0 && gen > 0 && (
            <g>
              <path d={sdPath(gen)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={axU} />
              <circle cx={chX(Math.min(gen, GENS))} cy={chY(now.sd)} r={5} fill={colors.NEGATIVE} opacity={axU} />
              <text x={chX(Math.min(gen, GENS)) - 8} y={chY(now.sd) - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={14} opacity={axU}>
                {now.sd.toFixed(2)}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card: solid panel, every figure on its own line */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Model Collapse
          </text>
          {[
            [370, `σ: 1.00 → ${FINAL.sd.toFixed(2)}`],
            [640, `μ: 0 → +${FINAL.mu.toFixed(2)}`],
            [910, 'tails → 0'],
          ].map(([x, label]) => (
            <text key={label} x={x as number} y={350} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={600}>
              {label}
            </text>
          ))}
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            no bug, no bad objective — a copy of a copy of a copy
          </text>
        </g>
      )}
    </>
  );
}

export function ModelCollapse() {
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
