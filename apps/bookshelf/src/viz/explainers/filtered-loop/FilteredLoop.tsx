import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  DIST_Y0,
  FILT,
  FILT_FINAL,
  FILT_MIN,
  GATE_DEMO,
  GATE_X,
  GATE_Y0,
  GENS,
  RAW,
  RAW_FINAL,
  buildScene,
  chX,
  chY,
  dx,
  dy,
  gauss,
  genAt,
} from './scene';
import type { Gen } from './scene';

/**
 * What Filtering Saves — pure render. Both 30-generation runs and the gate
 * demo come from scene.ts (same seed as the collapse chapter).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/filtered-loop/overrides.json', slug: 'filtered-loop' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(mu: number, sd: number): string {
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const x = -3.2 + (i / 160) * 6.4;
    d += `${i === 0 ? 'M' : 'L'}${dx(x).toFixed(1)} ${dy(gauss(x, mu, sd)).toFixed(1)}`;
  }
  return d;
}

function runPath(run: Gen[], upTo: number): string {
  const n = Math.max(2, Math.min(GENS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(run[i].sd).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gateU = s.get(scene.gateU);
  const axU = s.get(scene.axU);
  const rawGen = s.get(scene.rawGen);
  const filtGen = s.get(scene.filtGen);
  const curveU = s.get(scene.curveU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const rawNow = genAt(RAW, rawGen);
  const filtNow = genAt(FILT, filtGen);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the gate demo (eases back once the chart takes over, but stays legible) */}
          <g opacity={Math.max(0.7, gateU - 0.3 * axU)}>
            <rect x={GATE_X - 40} y={GATE_Y0 - 36} width={230} height={330} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
            <text x={GATE_X + 75} y={GATE_Y0 - 12} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={640}>
              the filter
            </text>
            <text x={GATE_X + 75} y={GATE_Y0 + 8} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              accept ∝ plausibility in reality
            </text>
            {GATE_DEMO.map((c, i) => {
              const u = clamp01(gateU * 1.8 - i * 0.1);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <text x={GATE_X - 18} y={GATE_Y0 + 40 + i * 28} fill={colors.TEXT} fillOpacity={0.8} fontSize={13}>
                    {`x = ${c.x >= 0 ? '+' : ''}${c.x.toFixed(2)}`}
                  </text>
                  <text x={GATE_X + 176} y={GATE_Y0 + 40 + i * 28} textAnchor="end" fill={c.acc ? colors.POSITIVE : colors.NEGATIVE} fontSize={13} fontWeight={640}>
                    {c.acc ? 'accepted' : 'rejected'}
                  </text>
                </g>
              );
            })}
          </g>

          {/* the twin chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(GENS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.1)} stroke={colors.GRID} />
              <text x={chX(GENS / 2)} y={CH_Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                generation →
              </text>
              <line x1={CH_X0 - 8} y1={chY(1)} x2={chX(GENS) + 10} y2={chY(1)} stroke={colors.ACCENT} strokeDasharray="4 5" opacity={0.5} />
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                1.0
              </text>
              <text x={CH_X0} y={chY(1.1) - 8} fill={colors.MUTED} fontSize={13}>
                spread vs generation · same seed, with and without the filter
              </text>
              {/* the collapse the caption describes, previewed as a faint ghost */}
              <path d={runPath(RAW, GENS)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="4 5" opacity={0.16} />
            </g>
          )}
          {rawGen > 0 && (
            <g opacity={0.8}>
              <path d={runPath(RAW, rawGen)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <text x={chX(Math.min(rawGen, GENS)) - 8} y={chY(rawNow.sd) + 20} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} stroke={colors.BG} strokeWidth={4} paintOrder="stroke">
                {`unfiltered: ${rawNow.sd.toFixed(2)}`}
              </text>
            </g>
          )}
          {filtGen > 0 && (
            <g>
              <path d={runPath(FILT, filtGen)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(Math.min(filtGen, GENS))} cy={chY(filtNow.sd)} r={5} fill={colors.POSITIVE} />
              <text x={chX(Math.min(filtGen, GENS)) - 8} y={chY(filtNow.sd) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontWeight={640} stroke={colors.BG} strokeWidth={4} paintOrder="stroke">
                {`filtered: ${filtNow.sd.toFixed(2)}`}
              </text>
            </g>
          )}

          {/* final curves */}
          {curveU > 0 && (
            <g opacity={curveU}>
              <line x1={dx(-3.2)} y1={DIST_Y0} x2={dx(3.2)} y2={DIST_Y0} stroke={colors.GRID} />
              <path d={curvePath(0, 1)} fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="6 5" opacity={0.5} />
              <path d={curvePath(RAW_FINAL.mu, RAW_FINAL.sd)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.8} />
              <path d={curvePath(FILT_FINAL.mu, FILT_FINAL.sd)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <text x={dx(RAW_FINAL.mu)} y={dy(gauss(RAW_FINAL.mu, RAW_FINAL.mu, RAW_FINAL.sd)) - 10} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
                unfiltered · gen 30
              </text>
              <text x={dx(-2.2)} y={dy(0.32)} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                filtered · gen 30
              </text>
            </g>
          )}
          {bridgeU > 0 && (
            <g opacity={bridgeU}>
              <rect x={CH_X0 - 8} y={CH_Y0 + 44} width={chX(GENS) - CH_X0 + 18} height={40} rx={9} fill={colors.BG} stroke={colors.SECONDARY} strokeDasharray="5 4" />
              <text x={(CH_X0 + chX(GENS)) / 2} y={CH_Y0 + 69} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
                the same verifier doctrine as RLVR — guarding the gene pool
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card: solid panel, so nothing faded shows through */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            What Filtering Saves
          </text>
          <text x={385} y={340} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontWeight={600}>
            {`unfiltered: σ → ${RAW_FINAL.sd.toFixed(2)}`}
          </text>
          <text x={870} y={340} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontWeight={600}>
            {`filtered: σ → ${FILT_FINAL.sd.toFixed(2)} (min ${FILT_MIN.toFixed(2)})`}
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            synthetic data fails when nothing separates good samples from bad
          </text>
        </g>
      )}
    </>
  );
}

export function FilteredLoop() {
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
