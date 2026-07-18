import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAL_DY,
  BAL_X,
  BAL_Y0,
  CH_X0,
  CH_Y0,
  CURVE,
  FINAL,
  NS,
  VOTE_PICK,
  buildScene,
  chX,
  chY,
} from './scene';

/**
 * Best-of-N and Self-Consistency — pure render. The ballots and both curves
 * are the real sweep from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/best-of-n-vote/overrides.json', slug: 'best-of-n-vote' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const voteLabel = (v: string): string =>
  v === 'c' ? 'correct answer' : v === 'trap' ? 'the trap answer' : 'a stray answer';
const voteColor = (v: string): string =>
  v === 'c' ? colors.POSITIVE : v === 'trap' ? colors.NEGATIVE : colors.MUTED;

function curvePath(key: 'passN' | 'vote', upTo: number): string {
  const n = Math.max(2, Math.min(CURVE.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(CURVE[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const balU = s.get(scene.balU);
  const tallyU = s.get(scene.tallyU);
  const axU = s.get(scene.axU);
  const sweepP = s.get(scene.sweepP);
  const sweepV = s.get(scene.sweepV);
  const gapU = s.get(scene.gapU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const siP = Math.max(0, Math.min(CURVE.length - 1, sweepP));
  const siV = Math.max(0, Math.min(CURVE.length - 1, sweepV));
  const nowP = CURVE[Math.min(CURVE.length - 1, Math.round(siP))];
  const nowV = CURVE[Math.min(CURVE.length - 1, Math.round(siV))];
  const trapVotes = VOTE_PICK.votes.filter((v) => v === 'trap').length;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ballots (fade to a whisper once the curves take over) */}
          <g opacity={Math.max(0.12, 1 - 0.9 * axU)}>
            {VOTE_PICK.votes.map((v, i) => {
              const u = clamp01(balU * 1.8 - i * 0.09);
              if (u <= 0) return null;
              return (
                <g key={i} opacity={u}>
                  <rect x={BAL_X - 130} y={BAL_Y0 + i * BAL_DY - 16} width={280} height={34} rx={8} fill={colors.PANEL} stroke={voteColor(v)} strokeWidth={1.3} />
                  <text x={BAL_X - 114} y={BAL_Y0 + i * BAL_DY + 6} fill={colors.MUTED} fontSize={12}>
                    {`sample ${i + 1}`}
                  </text>
                  <text x={BAL_X + 134} y={BAL_Y0 + i * BAL_DY + 6} textAnchor="end" fill={voteColor(v)} fontSize={12.5} fontWeight={620}>
                    {voteLabel(v)}
                  </text>
                </g>
              );
            })}
            {tallyU > 0 && (
              <g opacity={tallyU}>
                <rect x={BAL_X - 130} y={BAL_Y0 + 9 * BAL_DY} width={280} height={46} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.6} />
                <text x={BAL_X + 10} y={BAL_Y0 + 9 * BAL_DY + 21} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontWeight={650}>
                  {`the trap wins: ${trapVotes} of 9 votes`}
                </text>
                <text x={BAL_X + 10} y={BAL_Y0 + 9 * BAL_DY + 39} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {`true correctness rate of this problem: ${(VOTE_PICK.p * 100).toFixed(0)}%`}
                </text>
              </g>
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
                samples per problem →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
              <text x={CH_X0 - 18} y={chY(0.5) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                0.5
              </text>
            </g>
          )}
          {sweepV > 0 && (
            <g>
              <path d={curvePath('vote', siV)} fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
              <circle cx={chX(siV)} cy={chY(nowV.vote)} r={5} fill={colors.SECONDARY} />
              <text x={chX(siV) + 8} y={chY(nowV.vote) + 22} fill={colors.SECONDARY} fontSize={13}>
                {`majority vote: ${(nowV.vote * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {sweepP > 0 && (
            <g>
              <path d={curvePath('passN', siP)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(siP)} cy={chY(nowP.passN)} r={5} fill={colors.POSITIVE} />
              <text x={chX(siP) - 8} y={chY(nowP.passN) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                {`verified pass at N: ${(nowP.passN * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {gapU > 0 && (
            <g opacity={gapU}>
              <line x1={chX(7) + 24} y1={chY(FINAL.passN)} x2={chX(7) + 24} y2={chY(FINAL.vote)} stroke={colors.WARM} strokeWidth={2.5} />
              <line x1={chX(7) + 18} y1={chY(FINAL.passN)} x2={chX(7) + 30} y2={chY(FINAL.passN)} stroke={colors.WARM} strokeWidth={2.5} />
              <line x1={chX(7) + 18} y1={chY(FINAL.vote)} x2={chX(7) + 30} y2={chY(FINAL.vote)} stroke={colors.WARM} strokeWidth={2.5} />
              <text x={chX(7) + 12} y={chY((FINAL.passN + FINAL.vote) / 2) + 4} textAnchor="end" fill={colors.WARM} fontSize={13.5} fontWeight={630}>
                {`the verifier gap: ${((FINAL.passN - FINAL.vote) * 100).toFixed(0)} points`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Best-of-N vs Self-Consistency
          </text>
          <MathLabel
            tex={`\\text{vote}: 49\\% \\to ${(FINAL.vote * 100).toFixed(0)}\\%\\ \\text{(plateau)} \\qquad \\text{verified}: \\to ${(FINAL.passN * 100).toFixed(0)}\\%`}
            x={640}
            y={340}
            fontSize={19}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the ceiling is set by your checker, not your sampler
          </text>
        </g>
      )}
    </>
  );
}

export function BestOfNVote() {
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
