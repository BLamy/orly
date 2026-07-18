import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_X1,
  CH_Y0,
  FINAL,
  LAND_PROXY,
  LAND_TRUE,
  N_LAND,
  N_STEPS,
  PATH,
  PEAK_STEP,
  TH_MAX,
  TH_MIN,
  buildScene,
  cx,
  cy,
  lx,
  ly,
  pathAt,
} from './scene';

/**
 * Goodhart's Law on Benchmarks — pure render. Landscapes, the climber, and
 * both score curves come from the real gradient-ascent run in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/goodhart-benchmark/overrides.json',
  slug: 'goodhart-benchmark',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function landPath(ys: number[], reveal: number): string {
  const n = Math.max(2, Math.ceil(reveal * N_LAND));
  let d = '';
  for (let i = 0; i < n; i++) {
    const th = TH_MIN + ((TH_MAX - TH_MIN) * i) / (N_LAND - 1);
    d += `${i === 0 ? 'M' : 'L'}${lx(th).toFixed(1)} ${ly(ys[i]).toFixed(1)}`;
  }
  return d;
}

function scorePath(key: 't' | 'p', upTo: number): string {
  const n = Math.max(2, Math.min(N_STEPS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)} ${cy(PATH[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const trueU = s.get(scene.trueU);
  const proxyU = s.get(scene.proxyU);
  const flawU = s.get(scene.flawU);
  const runP = s.get(scene.runP);
  const chartU = s.get(scene.chartU);
  const peakU = s.get(scene.peakU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const now = pathAt(runP);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* landscapes */}
          <line x1={lx(TH_MIN)} y1={ly(0)} x2={lx(TH_MAX)} y2={ly(0)} stroke={colors.GRID} opacity={trueU} />
          {trueU > 0 && <path d={landPath(LAND_TRUE, trueU)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={0.9} />}
          {trueU > 0.9 && (
            <text x={lx(0.85)} y={ly(1.08)} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={clamp01((trueU - 0.9) * 10)}>
              true quality
            </text>
          )}
          {proxyU > 0 && <path d={landPath(LAND_PROXY, proxyU)} fill="none" stroke={colors.ACCENT} strokeWidth={3} opacity={0.9} />}
          {proxyU > 0.9 && (
            <text x={lx(3.3)} y={ly(2.9)} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={clamp01((proxyU - 0.9) * 10)}>
              the benchmark
            </text>
          )}
          {/* the flaw region */}
          {flawU > 0 && (
            <g opacity={flawU}>
              <rect x={lx(2.0)} y={ly(3.1)} width={lx(TH_MAX) - lx(2.0)} height={ly(0) - ly(3.1)} fill={colors.WARM} opacity={0.07} />
              <text x={lx(3.0)} y={ly(-0.16)} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                the exploitable flaw
              </text>
            </g>
          )}

          {/* the climber */}
          {runP > 0 && (
            <g>
              <circle cx={lx(now.th)} cy={ly(now.p)} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <circle cx={lx(now.th)} cy={ly(now.t)} r={6} fill={colors.POSITIVE} opacity={0.9} />
              <line x1={lx(now.th)} y1={ly(now.p)} x2={lx(now.th)} y2={ly(now.t)} stroke={colors.MUTED} strokeDasharray="3 4" opacity={0.6} />
            </g>
          )}

          {/* the score chart */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X1 + 8} y2={CH_Y0} stroke={colors.GRID} />
              <text x={CH_X0} y={CH_Y0 + 22} fill={colors.MUTED} fontSize={13}>
                gradient steps on the proxy →
              </text>
              {runP > 0 && (
                <g>
                  <path d={scorePath('p', runP)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
                  <path d={scorePath('t', runP)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
                  <circle cx={cx(Math.min(N_STEPS, runP))} cy={cy(now.p)} r={5} fill={colors.ACCENT} />
                  <circle cx={cx(Math.min(N_STEPS, runP))} cy={cy(now.t)} r={5} fill={colors.POSITIVE} />
                </g>
              )}
              {peakU > 0 && (
                <g opacity={peakU}>
                  <circle cx={cx(PEAK_STEP)} cy={cy(PATH[PEAK_STEP].t)} r={8} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
                  <text x={cx(PEAK_STEP)} y={cy(PATH[PEAK_STEP].t) - 16} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                    quality peaks: 1.000
                  </text>
                </g>
              )}
              {runP >= N_STEPS - 1 && (
                <g>
                  <text x={CH_X1 + 4} y={cy(FINAL.p)} fill={colors.ACCENT} fontSize={13}>
                    {FINAL.p.toFixed(2)}
                  </text>
                  <text x={CH_X1 + 4} y={cy(FINAL.t) + 12} fill={colors.POSITIVE} fontSize={13}>
                    {FINAL.t.toFixed(3)}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\text{when a measure becomes a target...}'}
        x={985}
        y={70}
        fontSize={18}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Goodhart's Law
          </text>
          <MathLabel
            tex={'\\text{proxy} \\uparrow 2.69 \\qquad \\text{quality} \\downarrow 0.003'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            optimization pressure flows to wherever the measure and the goal disagree
          </text>
        </g>
      )}
    </>
  );
}

export function GoodhartBenchmark() {
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
