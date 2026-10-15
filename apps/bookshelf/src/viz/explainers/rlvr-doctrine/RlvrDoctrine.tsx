import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BROKEN,
  CEIL,
  CH_X0,
  CH_Y0,
  LADDER,
  LAD_DY,
  LAD_X,
  LAD_Y0,
  SAFE,
  SWEEP,
  buildScene,
  chX,
  chY,
} from './scene';

/**
 * The Doctrine — pure render. The cliff curve is 14 real training runs from
 * scene.ts; the ladder is the qualitative ordering of verifier hardness.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/rlvr-doctrine/overrides.json', slug: 'rlvr-doctrine' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function cliffPath(upTo: number): string {
  const n = Math.max(2, Math.min(SWEEP.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(SWEEP[i].game).toFixed(1)} ${chY(SWEEP[i].truth).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const sweepU = s.get(scene.sweepU);
  const cliffU = s.get(scene.cliffU);
  const ladU = s.get(scene.ladU);
  const loopU = s.get(scene.loopU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const si = Math.max(0, Math.min(SWEEP.length - 1, sweepU));
  const now = SWEEP[Math.min(SWEEP.length - 1, Math.round(si))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the cliff chart (fades to a whisper while the ladder has the stage) */}
          <g opacity={Math.max(0, 1 - 1.6 * ladU)}>
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={chX(0) - 8} y1={CH_Y0} x2={chX(1) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={chX(0) - 8} y1={CH_Y0} x2={chX(0) - 8} y2={chY(0.95)} stroke={colors.GRID} />
              <text x={chX(0.5)} y={CH_Y0 + 30} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                gameability: how often the exploit fools the verifier →
              </text>
              <text x={chX(0) - 20} y={chY(0.85) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                0.85
              </text>
              <text x={chX(0) - 20} y={chY(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                0
              </text>
              <text x={chX(0)} y={chY(0.95) - 10} fill={colors.MUTED} fontSize={14}>
                final TRUE accuracy after training
              </text>
              <text x={chX(0)} y={chY(0.72)} fill={colors.MUTED} fontSize={14}>
                one exploit, true success fixed at 3%
              </text>
            </g>
          )}
          {sweepU > 0 && (
            <g>
              <path d={cliffPath(si)} fill="none" stroke={colors.POSITIVE} strokeWidth={3.5} />
              {SWEEP.slice(0, Math.ceil(si) + 1).map((p) => (
                <circle key={p.game} cx={chX(p.game)} cy={chY(p.truth)} r={4} fill={p.truth > 0.4 ? colors.POSITIVE : colors.NEGATIVE} />
              ))}
              <text x={chX(now.game) + 10} y={chY(now.truth) - 10} fill={now.truth > 0.4 ? colors.POSITIVE : colors.NEGATIVE} fontSize={14}>
                {`true accuracy: ${(now.truth * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
          {cliffU > 0 && (
            <g opacity={cliffU}>
              <line x1={chX(CEIL)} y1={chY(0.95)} x2={chX(CEIL)} y2={CH_Y0} stroke={colors.WARM} strokeDasharray="5 5" strokeWidth={1.8} />
              <text x={chX(CEIL)} y={chY(0.95) - 10} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                best honest pass rate: 85%
              </text>
              <text x={chX(0.4)} y={chY(0.62)} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={620}>
                solver: 84.6% true
              </text>
              <text x={chX(CEIL) + 14} y={chY(0.2)} fill={colors.NEGATIVE} fontSize={14} fontWeight={620}>
                the exploit: 3.3% true
              </text>
            </g>
          )}
          </g>

          {/* the ladder */}
          {LADDER.map((r, i) => {
            const u = clamp01(ladU * 1.8 - (LADDER.length - 1 - i) * 0.16);
            if (u <= 0) return null;
            const y = LAD_Y0 + (LADDER.length - 1 - i) * LAD_DY;
            return (
              <g key={r.label} opacity={u}>
                <rect x={LAD_X - 150} y={y - 24} width={340} height={52} rx={10} fill={colors.PANEL} stroke={r.bad ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1.4} />
                <text x={LAD_X - 132} y={y - 2} fill={colors.TEXT} fontSize={14.5} fontWeight={620}>
                  {r.label}
                </text>
                <text x={LAD_X - 132} y={y + 18} fill={r.bad ? colors.NEGATIVE : colors.MUTED} fontSize={14}>
                  {r.note}
                </text>
              </g>
            );
          })}
          {ladU > 0.6 && (
            <g opacity={clamp01((ladU - 0.6) * 2.5)}>
              <text x={LAD_X + 214} y={LAD_Y0 + 10} fill={colors.POSITIVE} fontSize={14} transform={`rotate(90 ${LAD_X + 214} ${LAD_Y0 + 10})`}>
                harder to game ↓
              </text>
            </g>
          )}
          {loopU > 0 && (
            <g opacity={loopU}>
              <rect x={LAD_X - 180} y={LAD_Y0 + LADDER.length * LAD_DY - 8} width={400} height={44} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeDasharray="5 4" />
              <text x={LAD_X + 20} y={LAD_Y0 + LADDER.length * LAD_DY + 19} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>
                same doctrine as the agent loop — at gradient scale
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={210} y={200} width={860} height={248} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Verifiable Rewards
          </text>
          <text x={640} y={324} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            {`gameable < solvable  →  true accuracy ${(SAFE.truth * 100).toFixed(1)}%`}
          </text>
          <text x={640} y={354} textAnchor="middle" fill={colors.NEGATIVE} fontSize={19}>
            {`gameable > solvable  →  true accuracy ${(BROKEN.truth * 100).toFixed(1)}%`}
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a gradient is the strongest red team your check will ever face
          </text>
          <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            build the check harder to game than the task is to solve
          </text>
        </g>
      )}
    </>
  );
}

export function RlvrDoctrine() {
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
