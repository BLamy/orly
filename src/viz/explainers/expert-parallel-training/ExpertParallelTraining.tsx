import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ACTIVE_P,
  BAL,
  DEV_Y,
  DISPATCH_MB,
  E,
  HOT,
  LB_H,
  LB_Y0,
  MEAN_LOAD,
  ROUTER,
  STEP_GB,
  TOTAL_P,
  buildScene,
  devX,
  lbH,
} from './scene';

/**
 * Expert Parallelism — pure render. Capacity math, all-to-all volumes, and
 * both routing distributions come from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/expert-parallel-training/overrides.json',
  slug: 'expert-parallel-training',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const devU = s.get(scene.devU);
  const flowU = s.get(scene.flowU);
  const capU = s.get(scene.capU);
  const barU = s.get(scene.barU);
  const stallU = s.get(scene.stallU);
  const balU = s.get(scene.balU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // interpolated routing counts (hot → balanced)
  const counts = HOT.counts.map((c, e) => c + balU * (BAL.counts[e] - c));
  const imb = HOT.imb + balU * (BAL.imb - HOT.imb);
  const hotIdx = HOT.counts.indexOf(Math.max(...HOT.counts));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* router */}
          <g opacity={devU}>
            <rect x={ROUTER.x - 110} y={ROUTER.y - 26} width={220} height={52} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={ROUTER.x} y={ROUTER.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontWeight={640}>
              learned router · top-2 of 8
            </text>
            <text x={ROUTER.x} y={ROUTER.y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              4096 tokens per batch
            </text>
          </g>

          {/* devices with experts */}
          {Array.from({ length: E }, (_, e) => {
            const u = clamp01(devU * 1.6 - e * 0.08);
            if (u <= 0) return null;
            return (
              <g key={e} opacity={u}>
                <rect x={devX(e) - 48} y={DEV_Y - 34} width={96} height={68} rx={10} fill={colors.PANEL} stroke={e === hotIdx && barU > 0 && balU < 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={e === hotIdx && barU > 0 && balU < 0.5 ? 2 : 1.2} />
                <text x={devX(e)} y={DEV_Y - 12} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  {`device ${e}`}
                </text>
                <text x={devX(e)} y={DEV_Y + 10} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontWeight={640}>
                  {`expert ${e}`}
                </text>
              </g>
            );
          })}

          {/* all-to-all streams */}
          {flowU > 0 &&
            Array.from({ length: E }, (_, e) => {
              const u = clamp01(flowU * 1.4 - e * 0.05);
              if (u <= 0) return null;
              const x1 = ROUTER.x;
              const y1 = ROUTER.y + 28;
              const x2 = devX(e);
              const y2 = DEV_Y - 36;
              return (
                <g key={e} opacity={u * 0.8}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.ACCENT} strokeWidth={1.4} strokeDasharray="3 6" opacity={0.5} />
                  <circle cx={x1 + (x2 - x1) * ((flowU * 2 + e * 0.13) % 1)} cy={y1 + (y2 - y1) * ((flowU * 2 + e * 0.13) % 1)} r={4.5} fill={colors.ACCENT} />
                </g>
              );
            })}
          {flowU > 0.5 && (
            <text x={ROUTER.x} y={DEV_Y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} opacity={flowU}>
              {`all-to-all: ${DISPATCH_MB.toFixed(0)} MB out + ${DISPATCH_MB.toFixed(0)} MB back per layer · ≈ ${STEP_GB.toFixed(0)} GB per step`}
            </text>
          )}

          {/* capacity panel */}
          {capU > 0 && (
            <g opacity={capU}>
              <rect x={64} y={64} width={330} height={64} rx={11} fill={colors.BG} stroke={colors.POSITIVE} strokeDasharray="5 4" />
              <text x={229} y={90} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={630}>
                {`total: ${(TOTAL_P / 1e9).toFixed(1)}B params`}
              </text>
              <text x={229} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                {`active per token: ${(ACTIVE_P / 1e9).toFixed(1)}B (${(TOTAL_P / ACTIVE_P).toFixed(1)}× capacity)`}
              </text>
            </g>
          )}

          {/* load bars */}
          {barU > 0 && (
            <g opacity={barU}>
              {counts.map((c, e) => (
                <g key={e}>
                  <rect x={devX(e) - 26} y={LB_Y0 - lbH(c)} width={52} height={lbH(c)} rx={4} fill={c > MEAN_LOAD * 1.6 ? colors.NEGATIVE : colors.ACCENT} opacity={0.8} />
                  <text x={devX(e)} y={LB_Y0 - lbH(c) - 8} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
                    {Math.round(c)}
                  </text>
                </g>
              ))}
              <line x1={devX(0) - 40} y1={LB_Y0 - lbH(MEAN_LOAD)} x2={devX(E - 1) + 40} y2={LB_Y0 - lbH(MEAN_LOAD)} stroke={colors.TEXT} strokeDasharray="6 5" opacity={0.7} />
              <text x={devX(E - 1) + 48} y={LB_Y0 - lbH(MEAN_LOAD) + 4} fill={colors.MUTED} fontSize={11.5}>
                fair share: {MEAN_LOAD}
              </text>
              <text x={devX(0) - 40} y={LB_Y0 + 24} fill={colors.MUTED} fontSize={12.5}>
                {`tokens routed per expert · ${balU > 0.5 ? 'with load-balancing loss' : 'unconstrained router'}`}
              </text>
            </g>
          )}
          {stallU > 0 && (
            <g opacity={stallU * (1 - balU)}>
              <text x={devX(hotIdx)} y={LB_Y0 - LB_H - 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontWeight={650}>
                {`everyone waits: ${HOT.imb.toFixed(2)}× step time`}
              </text>
            </g>
          )}
          {balU > 0.5 && barU > 0 && (
            <text x={devX(hotIdx)} y={LB_Y0 - LB_H - 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={650} opacity={balU}>
              {`worst load: ${BAL.imb.toFixed(2)}× the mean`}
            </text>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={210} y={200} width={860} height={248} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Communication Bills
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            data → gradients · tensor → activations · pipeline → bubbles
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            ZeRO → gathers · experts → the batch itself
          </text>
          <MathLabel
            tex={'\\text{training at scale} = \\text{choosing which bill to pay}'}
            x={640}
            y={404}
            fontSize={19}
            color={colors.WARM}
            opacity={endU}
          />
        </g>
      )}
    </>
  );
}

export function ExpertParallelTraining() {
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
