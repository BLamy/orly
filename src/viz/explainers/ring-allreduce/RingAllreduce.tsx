import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  C,
  G0,
  LED_X,
  LED_Y0,
  N,
  NAIVE_GB,
  RING_GB,
  RING_MS,
  STEPS,
  TRUE_SUM,
  buildScene,
  devPos,
} from './scene';

/**
 * Data Parallelism and the Ring — pure render. Chunk values and packets come
 * from the exact step-by-step simulation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/ring-allreduce/overrides.json', slug: 'ring-allreduce' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const CHUNK_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

function valsAt(k: number): number[][] {
  if (k <= 0) return G0;
  return STEPS[Math.min(STEPS.length, k) - 1].vals;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const step = s.get(scene.step);
  const doneU = s.get(scene.doneU);
  const ledU = s.get(scene.ledU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const k = Math.floor(step); // completed steps
  const frac = step - k;
  const vals = valsAt(k);
  const inFlight = frac > 0.02 && k < STEPS.length ? STEPS[k] : null;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ring edges */}
          <g opacity={ringU * 0.7}>
            {Array.from({ length: N }, (_, i) => {
              const a = devPos(i);
              const b = devPos((i + 1) % N);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colors.GRID} strokeWidth={1.5} />;
            })}
          </g>

          {/* devices + chunk tables */}
          {Array.from({ length: N }, (_, i) => {
            const u = clamp01(ringU * 1.6 - i * 0.12);
            if (u <= 0) return null;
            const p = devPos(i);
            return (
              <g key={i} opacity={u}>
                <rect x={p.x - 72} y={p.y - 52} width={144} height={104} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={p.x} y={p.y - 32} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={640}>
                  {`device ${i}`}
                </text>
                {vals[i].map((v, c) => {
                  const isSum = Math.abs(v - TRUE_SUM[c]) < 1e-9;
                  return (
                    <g key={c}>
                      <rect
                        x={p.x - 62 + c * 31}
                        y={p.y - 18}
                        width={27}
                        height={26}
                        rx={4}
                        fill={CHUNK_COLORS[c]}
                        opacity={isSum && doneU > 0 ? 0.95 : 0.4}
                        stroke={isSum && doneU > 0 ? colors.TEXT : 'none'}
                      />
                      <text x={p.x - 48.5 + c * 31} y={p.y - 1} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontWeight={620}>
                        {v.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
                <text x={p.x} y={p.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  gradient chunks 0–3
                </text>
              </g>
            );
          })}

          {/* packets in flight */}
          {inFlight &&
            inFlight.sent.map((c, i) => {
              const a = devPos(i);
              const b = devPos((i + 1) % N);
              const x = a.x + (b.x - a.x) * frac;
              const y = a.y + (b.y - a.y) * frac;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={11} fill={CHUNK_COLORS[c]} stroke={colors.BG} strokeWidth={1.5} />
                  <text x={x} y={y + 4} textAnchor="middle" fill={colors.BG} fontSize={10} fontWeight={700}>
                    {c}
                  </text>
                </g>
              );
            })}
          {step > 0 && step < 6.5 && (
            <text x={devPos(0).x} y={devPos(0).y - 78} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              {`step ${Math.min(6, Math.ceil(step))} of 6 · ${step <= 3 ? 'reduce-scatter (add on arrival)' : 'all-gather (deliver the sums)'}`}
            </text>
          )}
          {doneU > 0 && (
            <text x={devPos(2).x} y={devPos(2).y + 84} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={640} opacity={doneU}>
              {`all devices agree: [${TRUE_SUM.map((v) => v.toFixed(1)).join(', ')}]`}
            </text>
          )}

          {/* bandwidth ledger */}
          {ledU > 0 && (
            <g opacity={ledU}>
              <rect x={LED_X - 60} y={LED_Y0 - 40} width={430} height={290} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={LED_X + 155} y={LED_Y0 - 8} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={650}>
                the bandwidth ledger · per device
              </text>
              {[
                { label: 'gradients to agree on', v: '12.24 GB', c: colors.TEXT },
                { label: 'naive all-to-all sends', v: `${NAIVE_GB.toFixed(1)} GB`, c: colors.NEGATIVE },
                { label: 'ring all-reduce sends', v: `${RING_GB.toFixed(1)} GB`, c: colors.POSITIVE },
                { label: 'at 900 GB/s interconnect', v: `≈ ${RING_MS.toFixed(0)} ms/step`, c: colors.WARM },
              ].map((r, i) => (
                <g key={r.label}>
                  <text x={LED_X - 34} y={LED_Y0 + 34 + i * 44} fill={colors.MUTED} fontSize={13.5}>
                    {r.label}
                  </text>
                  <text x={LED_X + 344} y={LED_Y0 + 34 + i * 44} textAnchor="end" fill={r.c} fontSize={14.5} fontWeight={640}>
                    {r.v}
                  </text>
                </g>
              ))}
              <MathLabel
                tex={'\\tfrac{2(N-1)}{N}\\,G \\;\\xrightarrow{N\\to\\infty}\\; 2G'}
                x={LED_X + 155}
                y={LED_Y0 + 218}
                fontSize={17}
                color={colors.POSITIVE}
                opacity={ledU}
              />
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Data Parallelism and the Ring
          </text>
          <MathLabel
            tex={'2(N-1)\\ \\text{steps} \\qquad \\tfrac{2(N-1)}{N}\\,G\\ \\text{sent per device}'}
            x={640}
            y={340}
            fontSize={19}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            it splits the work — every device still stores the whole tower
          </text>
        </g>
      )}
    </>
  );
}

export function RingAllreduce() {
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
