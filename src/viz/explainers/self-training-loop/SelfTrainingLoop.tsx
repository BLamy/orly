import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DIST_Y0,
  FIT_MU,
  FIT_SD,
  LOOP_NODES,
  M_SAMPLES,
  SAMPLES,
  buildScene,
  dx,
  dy,
  gauss,
  loopPos,
} from './scene';

/**
 * Training on Yourself — pure render. The 50 samples and the refit curve are
 * the real seed-25 draw from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/self-training-loop/overrides.json',
  slug: 'self-training-loop',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(mu: number, sd: number): string {
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const x = -3.2 + (i / 160) * 6.4;
    d += `${i === 0 ? 'M' : 'L'}${dx(x).toFixed(1)} ${dy(gauss(x, mu, sd)).toFixed(1)}`;
  }
  return d;
}
const TRUE_PATH = curvePath(0, 1);
const REFIT_PATH = curvePath(FIT_MU, FIT_SD);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const loopU = s.get(scene.loopU);
  const spinU = s.get(scene.spinU);
  const curveU = s.get(scene.curveU);
  const dotsU = s.get(scene.dotsU);
  const refitU = s.get(scene.refitU);
  const tailU = s.get(scene.tailU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const shown = Math.floor(Math.min(M_SAMPLES, dotsU));
  // packet position along the ring
  const lap = spinU % 1;
  const seg = Math.floor(lap * 4);
  const f = lap * 4 - seg;
  const a = loopPos(seg);
  const b = loopPos((seg + 1) % 4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the loop ring */}
          <g opacity={loopU}>
            {LOOP_NODES.map((n, i) => {
              const p = loopPos(i);
              const q = loopPos((i + 1) % 4);
              return (
                <g key={n.label}>
                  <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={colors.GRID} strokeWidth={1.4} />
                  <rect x={p.x - 62} y={p.y - 26} width={124} height={52} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
                  <text x={p.x} y={p.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={640}>
                    {n.label}
                  </text>
                  <text x={p.x} y={p.y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                    {n.sub}
                  </text>
                </g>
              );
            })}
          </g>
          {spinU > 0 && spinU < 2 && (
            <circle cx={a.x + (b.x - a.x) * f} cy={a.y + (b.y - a.y) * f} r={8} fill={colors.WARM} />
          )}

          {/* the distribution stage */}
          {curveU > 0 && (
            <g>
              <line x1={dx(-3.2)} y1={DIST_Y0} x2={dx(3.2)} y2={DIST_Y0} stroke={colors.GRID} opacity={curveU} />
              {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
                <text key={t} x={dx(t)} y={DIST_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={curveU}>
                  {t}
                </text>
              ))}
              <path
                d={TRUE_PATH}
                fill="none"
                stroke={colors.ACCENT}
                strokeWidth={3}
                strokeDasharray="880"
                strokeDashoffset={(1 - curveU) * 880}
              />
              <text x={dx(0)} y={dy(gauss(0, 0, 1)) - 16} textAnchor="middle" fill={colors.ACCENT} fontSize={13} opacity={curveU}>
                the true world · mean 0 · spread 1
              </text>
            </g>
          )}
          {shown > 0 &&
            SAMPLES.slice(0, shown).map((x, i) => (
              <circle key={i} cx={dx(x)} cy={DIST_Y0 - 8 - (i % 5) * 9} r={4} fill={colors.WARM} opacity={0.85} />
            ))}
          {tailU > 0 && (
            <g opacity={tailU}>
              <rect x={dx(2)} y={dy(0.24)} width={dx(3.2) - dx(2)} height={DIST_Y0 - dy(0.24)} fill={colors.NEGATIVE} opacity={0.1} />
              <rect x={dx(-3.2)} y={dy(0.24)} width={dx(-2) - dx(-3.2)} height={DIST_Y0 - dy(0.24)} fill={colors.NEGATIVE} opacity={0.1} />
              <text x={dx(2.6)} y={dy(0.22)} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5}>
                0 of 50 out here
              </text>
            </g>
          )}
          {refitU > 0 && (
            <g>
              <path d={REFIT_PATH} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={refitU} />
              <text x={dx(FIT_MU)} y={dy(gauss(FIT_MU, FIT_MU, FIT_SD)) - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={refitU}>
                {`the refit · mean ${FIT_MU.toFixed(2)} · spread ${FIT_SD.toFixed(2)}`}
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
            Training on Yourself
          </text>
          <MathLabel
            tex={`\\sigma: 1.00 \\to ${FIT_SD.toFixed(2)} \\quad \\text{after ONE lap of the ring}`}
            x={640}
            y={340}
            fontSize={20}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the tails feed the next generation — and tails are what sampling loses first
          </text>
        </g>
      )}
    </>
  );
}

export function SelfTrainingLoop() {
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
