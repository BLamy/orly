import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
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

/** device box half-size (the box is 160 × 104 around the device anchor) */
const BOX_HW = 80;
const BOX_HH = 52;

function valsAt(k: number): number[][] {
  if (k <= 0) return G0;
  return STEPS[Math.min(STEPS.length, k) - 1].vals;
}

/**
 * The ring edge from device i to device i+1, trimmed to the gap between the
 * two device boxes so packets and arrows never sit on top of a box's labels.
 */
function edgeSpan(i: number) {
  const a = devPos(i);
  const b = devPos((i + 1) % N);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const exit = Math.min(BOX_HW / Math.abs(ux), BOX_HH / Math.abs(uy)) + 8;
  return {
    from: { x: a.x + ux * exit, y: a.y + uy * exit },
    to: { x: b.x - ux * exit, y: b.y - uy * exit },
    ux,
    uy,
  };
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
          {/* ring edges, with arrowheads showing the clockwise send direction */}
          <g opacity={ringU * 0.8}>
            {Array.from({ length: N }, (_, i) => {
              const sp = edgeSpan(i);
              const mx = (sp.from.x + sp.to.x) / 2;
              const my = (sp.from.y + sp.to.y) / 2;
              const deg = (Math.atan2(sp.uy, sp.ux) * 180) / Math.PI;
              return (
                <g key={i}>
                  <line x1={sp.from.x} y1={sp.from.y} x2={sp.to.x} y2={sp.to.y} stroke={colors.MUTED} strokeWidth={1.5} />
                  <polygon
                    points="-6,-5 6,0 -6,5"
                    transform={`translate(${mx},${my}) rotate(${deg})`}
                    fill={colors.MUTED}
                  />
                </g>
              );
            })}
          </g>

          {/* devices + chunk tables */}
          {Array.from({ length: N }, (_, i) => {
            const u = clamp01(ringU * 1.6 - i * 0.12);
            if (u <= 0) return null;
            const p = devPos(i);
            return (
              <g key={i} opacity={u}>
                <rect x={p.x - BOX_HW} y={p.y - BOX_HH} width={2 * BOX_HW} height={2 * BOX_HH} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={p.x} y={p.y - 30} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={640}>
                  {`device ${i}`}
                </text>
                {vals[i].map((v, c) => {
                  const isSum = Math.abs(v - TRUE_SUM[c]) < 1e-9;
                  const x0 = p.x - 66 + c * 34;
                  return (
                    <g key={c}>
                      <rect
                        x={x0}
                        y={p.y - 18}
                        width={31}
                        height={26}
                        rx={4}
                        fill={CHUNK_COLORS[c]}
                        opacity={isSum && doneU > 0 ? 0.95 : 0.7}
                        stroke={isSum && doneU > 0 ? colors.TEXT : 'none'}
                      />
                      <text x={x0 + 15.5} y={p.y + 1} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={700}>
                        {v.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
                <text x={p.x} y={p.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  gradient chunks 0–3
                </text>
              </g>
            );
          })}

          {/* packets in flight, riding the gap between two boxes */}
          {inFlight &&
            inFlight.sent.map((c, i) => {
              const sp = edgeSpan(i);
              const x = sp.from.x + (sp.to.x - sp.from.x) * frac;
              const y = sp.from.y + (sp.to.y - sp.from.y) * frac;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={12} fill={CHUNK_COLORS[c]} stroke={colors.BG} strokeWidth={1.5} />
                  <text x={x} y={y + 4.5} textAnchor="middle" fill={colors.BG} fontSize={12} fontWeight={700}>
                    {c}
                  </text>
                </g>
              );
            })}
          {step > 0 && step < 6.5 && (
            <text x={devPos(0).x} y={devPos(0).y - 76} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              {`step ${Math.min(6, Math.ceil(step))} of 6 · ${step <= 3 ? 'reduce-scatter (add on arrival)' : 'all-gather (deliver the sums)'}`}
            </text>
          )}
          {doneU > 0 && (
            <text x={devPos(2).x} y={devPos(2).y + 66} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={640} opacity={doneU}>
              {`all devices agree: [${TRUE_SUM.map((v) => v.toFixed(1)).join(', ')}]`}
            </text>
          )}

          {/* bandwidth ledger */}
          {ledU > 0 && (
            <g opacity={ledU}>
              <rect x={LED_X - 60} y={LED_Y0 - 40} width={430} height={310} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
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
                  <text x={LED_X - 34} y={LED_Y0 + 34 + i * 44} fill={colors.MUTED} fontSize={14}>
                    {r.label}
                  </text>
                  <text x={LED_X + 344} y={LED_Y0 + 34 + i * 44} textAnchor="end" fill={r.c} fontSize={15} fontWeight={640}>
                    {r.v}
                  </text>
                </g>
              ))}
              <text x={LED_X + 155} y={LED_Y0 + 214} textAnchor="middle" fill={colors.POSITIVE} fontSize={17} fontWeight={640}>
                2(N−1)/N · G → 2G as N grows
              </text>
              <text x={LED_X + 155} y={LED_Y0 + 242} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                at N = 4: 1.5 G per gradient gigabyte
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card: solid panel, so the faded scene never shows through */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Data Parallelism and the Ring
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={600}>
            {'2(N−1) steps   ·   2(N−1)/N · G sent per device'}
          </text>
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
