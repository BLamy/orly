import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  LOSS_H,
  LOSS_W,
  LOSS_X0,
  LOSS_Y0,
  N_PLOT,
  N_SNAPS,
  RUN,
  TARGET_A,
  TARGET_B,
  XA,
  XB,
  X_MAX,
  X_MIN,
  YA,
  YB,
  buildScene,
  px,
  py,
  snapAt,
} from './scene';

/**
 * Catastrophic Forgetting — pure render. All curves are snapshots and loss
 * traces recorded from the real MLP training runs in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/catastrophic-forgetting/overrides.json',
  slug: 'catastrophic-forgetting',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function fnPath(ys: number[], half?: 'left' | 'right'): string {
  let d = '';
  for (let i = 0; i < N_PLOT; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1);
    if (half === 'left' && x > 0.02) continue;
    if (half === 'right' && x < -0.02) continue;
    const cmd = d === '' ? 'M' : 'L';
    d += `${cmd}${px(x).toFixed(1)} ${py(Math.max(-1.9, Math.min(2.4, ys[i]))).toFixed(1)}`;
  }
  return d;
}

const LOG_LO = -4; // loss strip chart is log-scaled 1e-4..1e1
const lossY = (l: number): number =>
  LOSS_Y0 - clamp01((Math.log10(Math.max(l, 1e-4)) - LOG_LO) / 5) * LOSS_H;

function lossPath(trace: number[], upTo: number): string {
  const n = Math.max(2, Math.min(trace.length, Math.ceil(upTo) + 1));
  return trace
    .slice(0, n)
    .map((l, i) => `${i === 0 ? 'M' : 'L'}${(LOSS_X0 + (i / (trace.length - 1)) * LOSS_W).toFixed(1)} ${lossY(l).toFixed(1)}`)
    .join('');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const targetAU = s.get(scene.targetAU);
  const trainA = s.get(scene.trainA);
  const targetBU = s.get(scene.targetBU);
  const trainB = s.get(scene.trainB);
  const lossU = s.get(scene.lossU);
  const replayMode = s.get(scene.replayMode);
  const trainR = s.get(scene.trainR);
  const statU = s.get(scene.statU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // which function does the net currently draw?
  let fn: number[];
  if (replayMode > 0.5) {
    fn = snapAt(RUN.snapsR, trainR);
  } else if (trainB > 0) {
    fn = snapAt(RUN.snapsB, trainB);
  } else {
    fn = snapAt(RUN.snapsA, trainA);
  }
  const lossTrace = replayMode > 0.5 ? RUN.lossA_duringR : RUN.lossA_duringB;
  const lossProg = replayMode > 0.5 ? trainR : trainB;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axes */}
          <g opacity={axU}>
            <line x1={px(X_MIN)} y1={py(0)} x2={px(X_MAX)} y2={py(0)} stroke={colors.GRID} />
            <line x1={px(0)} y1={py(-1.7)} x2={px(0)} y2={py(2.2)} stroke={colors.GRID} strokeDasharray="4 6" />
            <text x={px(-1)} y={py(-1.85)} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              task A lives here
            </text>
            <text x={px(1)} y={py(-1.85)} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={targetBU}>
              task B lives here
            </text>
          </g>

          {/* task A data */}
          {XA.map((x, i) => (
            <circle key={i} cx={px(x)} cy={py(YA[i])} r={4} fill={colors.WARM} opacity={0.85 * targetAU * clamp01(targetAU * 24 - i)} />
          ))}
          {/* task B data */}
          {targetBU > 0 &&
            XB.map((x, i) => (
              <circle key={i} cx={px(x)} cy={py(YB[i])} r={4} fill={colors.SECONDARY} opacity={0.85 * targetBU * clamp01(targetBU * 24 - i)} />
            ))}

          {/* faint targets */}
          <path d={fnPath(TARGET_A, 'left')} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.25 * targetAU} />
          {targetBU > 0 && (
            <path d={fnPath(TARGET_B, 'right')} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} opacity={0.25 * targetBU} />
          )}

          {/* THE network's function */}
          {trainA > 0.01 && (
            <path d={fnPath(fn)} fill="none" stroke={replayMode > 0.5 ? colors.POSITIVE : colors.ACCENT} strokeWidth={3.5} opacity={0.95} />
          )}

          {/* phase label */}
          <text x={px(X_MIN)} y={110} fill={colors.TEXT} fontSize={16} fontWeight={600} opacity={axU}>
            {replayMode > 0.5
              ? `fine-tune on B with replay — step ${Math.round((trainR / (N_SNAPS - 1)) * 3000)}`
              : trainB > 0
                ? `fine-tune on B only — step ${Math.round((trainB / (N_SNAPS - 1)) * 3000)}`
                : `pretraining on A — step ${Math.round((trainA / (RUN.snapsA.length - 1)) * 3000)}`}
          </text>
        </g>
      </Camera>

      {/* loss-on-A strip chart (screen-fixed, kept above y=630 content-wise) */}
      {lossU > 0 && (
        <g opacity={lossU * dimU}>
          <rect x={LOSS_X0 - 24} y={LOSS_Y0 - LOSS_H - 34} width={LOSS_W + 48} height={LOSS_H + 52} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
          <text x={LOSS_X0 - 6} y={LOSS_Y0 - LOSS_H - 12} fill={colors.TEXT} fontSize={13} fontWeight={600}>
            loss on task A (log scale)
          </text>
          <path
            d={lossPath(lossTrace, lossProg)}
            fill="none"
            stroke={replayMode > 0.5 ? colors.POSITIVE : colors.NEGATIVE}
            strokeWidth={2.5}
          />
          <line x1={LOSS_X0 - 6} y1={LOSS_Y0} x2={LOSS_X0 + LOSS_W + 6} y2={LOSS_Y0} stroke={colors.GRID} />
        </g>
      )}

      {/* stat panel */}
      {statU > 0 && (
        <g opacity={statU * dimU}>
          <rect x={72} y={470} width={330} height={replayMode > 0.5 ? 116 : 92} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={92} y={500} fill={colors.NEGATIVE} fontSize={14.5}>
            {`B only:   A ${RUN.finalA_afterA.toFixed(4)} → ${RUN.finalA_afterB.toFixed(2)}`}
          </text>
          <text x={92} y={528} fill={colors.MUTED} fontSize={14.5}>
            {`           B ${RUN.finalB_afterB.toFixed(4)}`}
          </text>
          {replayMode > 0.5 && (
            <text x={92} y={556} fill={colors.POSITIVE} fontSize={14.5}>
              {`replay:  A ${RUN.finalA_afterR.toFixed(3)} · B ${RUN.finalB_afterR.toFixed(3)}`}
            </text>
          )}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Catastrophic Forgetting
          </text>
          <MathLabel
            tex={'\\text{loss}_A:\\; 0.0002 \\to 2.55 \\;\\;\\text{(B only)} \\qquad 0.010 \\;\\;\\text{(replay)}'}
            x={640}
            y={340}
            fontSize={19}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            shared neurons are the cheapest material for the new task — unless the old one keeps voting
          </text>
        </g>
      )}
    </>
  );
}

export function CatastrophicForgetting() {
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
