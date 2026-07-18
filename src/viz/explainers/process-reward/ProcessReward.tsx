import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CELL_H,
  CELL_W,
  CH_X0,
  CH_Y0,
  CURVE,
  FINAL,
  L,
  NS,
  SHOW,
  buildScene,
  cellX,
  chX,
  chY,
  poolY,
} from './scene';

/**
 * Process vs Outcome — pure render. The chain pool and both selection curves
 * come from the real simulation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/process-reward/overrides.json', slug: 'process-reward' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(key: 'orm' | 'prm', upTo: number): string {
  const n = Math.max(2, Math.min(CURVE.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(CURVE[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const poolU = s.get(scene.poolU);
  const ansU = s.get(scene.ansU);
  const ormU = s.get(scene.ormU);
  const stepU = s.get(scene.stepU);
  const prmU = s.get(scene.prmU);
  const axU = s.get(scene.axU);
  const sweepO = s.get(scene.sweepO);
  const sweepP = s.get(scene.sweepP);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const siO = Math.max(0, Math.min(CURVE.length - 1, sweepO));
  const siP = Math.max(0, Math.min(CURVE.length - 1, sweepP));
  const nowO = CURVE[Math.min(CURVE.length - 1, Math.round(siO))];
  const nowP = CURVE[Math.min(CURVE.length - 1, Math.round(siP))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the chain pool (whisper once curves take over) */}
          <g opacity={Math.max(0.12, 1 - 0.9 * axU)}>
            {SHOW.chains.map((c, row) => {
              const u = clamp01(poolU * 1.6 - row * 0.1);
              if (u <= 0) return null;
              const isOrm = row === SHOW.ormPickIdx && ormU > 0;
              const isPrm = row === SHOW.prmPickIdx && prmU > 0;
              return (
                <g key={row} opacity={u}>
                  {c.ok.map((st, i) => {
                    const graded = stepU * (L + 2) > i + row * 0.3;
                    return (
                      <rect
                        key={i}
                        x={cellX(i)}
                        y={poolY(row) - CELL_H / 2}
                        width={CELL_W}
                        height={CELL_H}
                        rx={5}
                        fill={
                          graded && stepU > 0
                            ? st
                              ? colors.POSITIVE
                              : colors.NEGATIVE
                            : colors.PANEL
                        }
                        opacity={graded && stepU > 0 ? 0.8 : 1}
                        stroke={colors.GRID}
                      />
                    );
                  })}
                  {/* answer stamp */}
                  {ansU > 0 && (
                    <g opacity={ansU}>
                      <circle
                        cx={cellX(L) + 34}
                        cy={poolY(row)}
                        r={14}
                        fill={c.ansOK ? colors.POSITIVE : colors.MUTED}
                        opacity={c.ansOK ? 0.9 : 0.35}
                      />
                      <text x={cellX(L) + 34} y={poolY(row) + 5} textAnchor="middle" fill={colors.BG} fontSize={12.5} fontWeight={700}>
                        {c.ansOK ? '✓' : '✗'}
                      </text>
                    </g>
                  )}
                  {/* judge picks */}
                  {isOrm && (
                    <g opacity={ormU}>
                      <rect x={cellX(0) - 10} y={poolY(row) - CELL_H / 2 - 6} width={cellX(L) + 58 - cellX(0)} height={CELL_H + 12} rx={9} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
                      <text x={cellX(L) + 66} y={poolY(row) + 5} fill={colors.WARM} fontSize={12.5} fontWeight={640}>
                        outcome pick — lucky, broken
                      </text>
                    </g>
                  )}
                  {isPrm && (
                    <g opacity={prmU}>
                      <rect x={cellX(0) - 10} y={poolY(row) - CELL_H / 2 - 6} width={cellX(L) + 58 - cellX(0)} height={CELL_H + 12} rx={9} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} />
                      <text x={cellX(L) + 66} y={poolY(row) + 5} fill={colors.ACCENT} fontSize={12.5} fontWeight={640}>
                        process pick — solid
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {poolU > 0.5 && (
              <text x={cellX(0)} y={poolY(0) - 44} fill={colors.MUTED} fontSize={13} opacity={poolU}>
                six sampled chains · five steps each · stamp = final answer
              </text>
            )}
          </g>

          {/* curves */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(NS.length - 1) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.02)} stroke={colors.GRID} />
              {NS.map((n, i) => (
                <text key={n} x={chX(i)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {n}
                </text>
              ))}
              <text x={chX(3.5)} y={CH_Y0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                chains sampled per problem →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
              <text x={CH_X0 - 18} y={chY(0.33) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                0.33
              </text>
              <line x1={CH_X0 - 8} y1={chY(0.33)} x2={chX(NS.length - 1) + 10} y2={chY(0.33)} stroke={colors.GRID} strokeDasharray="4 5" />
            </g>
          )}
          {sweepO > 0 && (
            <g>
              <path d={curvePath('orm', siO)} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <circle cx={chX(siO)} cy={chY(nowO.orm)} r={5} fill={colors.WARM} />
              <text x={chX(siO) + 8} y={chY(nowO.orm) + 22} fill={colors.WARM} fontSize={13}>
                {`outcome judge: ${(nowO.orm * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {sweepP > 0 && (
            <g>
              <path d={curvePath('prm', siP)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              <circle cx={chX(siP)} cy={chY(nowP.prm)} r={5} fill={colors.ACCENT} />
              <text x={chX(siP) - 8} y={chY(nowP.prm) - 12} textAnchor="end" fill={colors.ACCENT} fontSize={13}>
                {`process judge: ${(nowP.prm * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\text{score}(c) = \\min_i \\mathrm{PRM}(s_i)'}
        x={1040}
        y={70}
        fontSize={18}
        color={colors.ACCENT}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Process vs Outcome
          </text>
          <MathLabel
            tex={`\\text{outcome}: \\to ${(FINAL.orm * 100).toFixed(0)}\\%\\ \\text{(ceiling)} \\qquad \\text{process}: \\to ${(FINAL.prm * 100).toFixed(1)}\\%`}
            x={640}
            y={340}
            fontSize={19}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            luck and logic look identical from the outside — read the steps
          </text>
        </g>
      )}
    </>
  );
}

export function ProcessReward() {
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
