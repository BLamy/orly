import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAND,
  BLOCKS,
  CAPACITY,
  CHART,
  ERR3,
  ERR5,
  N_BITS,
  OUT,
  P_FLIP,
  TAPE,
  TOTAL_FLIPS,
  buildScene,
} from './scene';

/**
 * Channel Capacity — shouting over noise.
 * Pure render: a real seeded run through a binary symmetric channel (13 raw
 * flips over 120 uses), majority vote repairing every damaged triple, and the
 * rate-vs-error chart with Shannon's capacity line at 0.531.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/channel-capacity/overrides.json', slug: 'channel-capacity' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const STEP = TAPE.w / N_BITS;

// naked-phase corruption: the first received copy of each block
const NAKED_WRONG = BLOCKS.map((b) => b.recv[0] !== b.bit);
const NAKED_ERRS = NAKED_WRONG.filter(Boolean).length;

// chart scales: rate 0..1 across; error on log scale 0.005..0.2 up
const cx = (rate: number): number => CHART.x + rate * CHART.w;
const cy = (err: number): number => {
  const lo = Math.log10(0.005);
  const hi = Math.log10(0.2);
  return CHART.y + ((Math.log10(Math.max(err, 0.005)) - hi) / (lo - hi)) * CHART.h;
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bandU = s.get(scene.bandU);
  const nakedF = s.get(scene.nakedF);
  const tripleF = s.get(scene.tripleF);
  const tallyU = s.get(scene.tallyU);
  const actU = s.get(scene.actU);
  const chartU = s.get(scene.chartU);
  const capU = s.get(scene.capU);
  const texU = s.get(scene.texU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const nakedN = Math.floor(clamp01(nakedF / N_BITS) * N_BITS);
  const tripleN = Math.floor(clamp01(tripleF / N_BITS) * N_BITS);
  const tripleActive = tripleF > 0;
  const flipsSoFar = BLOCKS.slice(0, tripleN).reduce((a, b) => a + b.flips, 0);
  const nakedErrSoFar = NAKED_WRONG.slice(0, nakedN).filter(Boolean).length;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ————— the transmission act ————— */}
          <g opacity={actU}>
            {/* channel band */}
            {bandU > 0 && (
              <g opacity={bandU}>
                <rect x={BAND.x} y={BAND.y} width={BAND.w} height={BAND.h} rx={14} fill={colors.PANEL} opacity={0.6} stroke={colors.GRID} />
                <text x={BAND.x + BAND.w / 2} y={BAND.y + BAND.h / 2 + 5} textAnchor="middle" fill={colors.MUTED} fontSize={15} letterSpacing={4}>
                  {`noisy channel — each bit flips with p = ${P_FLIP}`}
                </text>
              </g>
            )}

            {/* input tape */}
            {BLOCKS.map((b, i) => {
              const shown = tripleActive ? i < tripleN || tripleF >= N_BITS : i < nakedN;
              const x = TAPE.x + i * STEP + STEP / 2;
              return (
                <g key={`in${i}`} opacity={bandU}>
                  <text x={x} y={TAPE.y} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily="ui-monospace, monospace" opacity={0.85}>
                    {b.bit}
                  </text>
                  {/* triple copies inside the band */}
                  {tripleActive && shown && (
                    <g>
                      {b.recv.map((r, k) => (
                        <circle
                          key={k}
                          cx={x}
                          cy={BAND.y + 26 + k * 38}
                          r={5.5}
                          fill={r !== b.bit ? colors.NEGATIVE : colors.ACCENT}
                          opacity={r !== b.bit ? 0.95 : 0.5}
                        />
                      ))}
                    </g>
                  )}
                  {/* naked single copy */}
                  {!tripleActive && shown && (
                    <circle cx={x} cy={BAND.y + BAND.h / 2 + 34} r={5.5} fill={NAKED_WRONG[i] ? colors.NEGATIVE : colors.ACCENT} opacity={NAKED_WRONG[i] ? 0.95 : 0.5} />
                  )}
                  {/* output row */}
                  {shown && (
                    <text
                      x={x}
                      y={OUT.y}
                      textAnchor="middle"
                      fontSize={12.5}
                      fontFamily="ui-monospace, monospace"
                      fill={
                        tripleActive
                          ? b.decoded === b.bit
                            ? colors.POSITIVE
                            : colors.NEGATIVE
                          : NAKED_WRONG[i]
                            ? colors.NEGATIVE
                            : colors.POSITIVE
                      }
                    >
                      {tripleActive ? b.decoded : b.recv[0]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* tally */}
            {tallyU > 0 && (
              <g opacity={tallyU}>
                <rect x={BAND.x} y={OUT.y + 34} width={640} height={40} rx={10} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                <text x={BAND.x + 18} y={OUT.y + 60} fill={colors.TEXT} fontSize={14.5} fontFamily="ui-monospace, monospace">
                  {tripleActive
                    ? `sent ×3 · uses ${tripleN * 3}/120 · flips ${tripleF >= N_BITS ? TOTAL_FLIPS : flipsSoFar} · wrong after vote: 0`
                    : `sent naked · bits ${nakedN}/40 · corrupted: ${nakedErrSoFar}${nakedN >= N_BITS ? ` (${NAKED_ERRS} of 40)` : ''}`}
                </text>
              </g>
            )}
          </g>

          {/* ————— the rate/error chart ————— */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <line x1={CHART.x} y1={CHART.y + CHART.h} x2={CHART.x + CHART.w} y2={CHART.y + CHART.h} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={CHART.x} y1={CHART.y + CHART.h} x2={CHART.x} y2={CHART.y} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={CHART.x + CHART.w / 2} y={CHART.y + CHART.h + 34} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                rate (message bits per channel use)
              </text>
              <text x={CHART.x - 26} y={CHART.y - 14} fill={colors.MUTED} fontSize={14}>
                residual error (log scale)
              </text>
              {[
                { rate: 1, err: P_FLIP, label: 'naked · 10%' },
                { rate: 1 / 3, err: ERR3, label: 'repeat ×3 · 2.8%' },
                { rate: 1 / 5, err: ERR5, label: 'repeat ×5 · 0.86%' },
              ].map((d) => (
                <g key={d.label}>
                  <circle cx={cx(d.rate)} cy={cy(d.err)} r={8} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
                  <text x={cx(d.rate)} y={cy(d.err) - 16} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                    {d.label}
                  </text>
                </g>
              ))}
              {/* staircase hint */}
              <path
                d={`M${cx(1)},${cy(P_FLIP)} L${cx(1 / 3)},${cy(ERR3)} L${cx(1 / 5)},${cy(ERR5)}`}
                fill="none"
                stroke={colors.MUTED}
                strokeWidth={1.4}
                strokeDasharray="5 5"
                opacity={0.7}
              />
              {/* the capacity line */}
              {capU > 0 && (
                <g opacity={capU}>
                  <line x1={cx(CAPACITY)} y1={CHART.y + CHART.h} x2={cx(CAPACITY)} y2={CHART.y + CHART.h - (CHART.h - 20) * capU} stroke={colors.POSITIVE} strokeWidth={3} />
                  <text x={cx(CAPACITY)} y={CHART.y + 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={650}>
                    {`capacity C = ${CAPACITY.toFixed(3)}`}
                  </text>
                  <text x={cx(CAPACITY) - 12} y={CHART.y + 60} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                    below: error → 0 possible
                  </text>
                  <text x={cx(CAPACITY) + 12} y={CHART.y + 60} fill={colors.NEGATIVE} fontSize={13}>
                    above: hopeless
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel tex={'C = 1 - H(p) = 1 - H(0.1) = 0.531'} x={640} y={60} fontSize={18} opacity={texU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Channel Capacity
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            13 flips landed, majority vote repaired all 40 bits
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            and below 0.531 bits per use, Shannon says error can vanish
          </text>
        </g>
      )}
    </>
  );
}

export function ChannelCapacity() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
