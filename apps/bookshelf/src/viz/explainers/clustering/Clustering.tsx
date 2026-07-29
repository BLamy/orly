import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  FAIL,
  FKM,
  FKM_BOUNDARY_X,
  GMM_STEPS,
  KM,
  KM_ITERS,
  METER,
  N_STOLEN,
  PLOT,
  PTS,
  RESP0,
  buildScene,
  gmAt,
  kmAsgAt,
  kmCentAt,
  kmInertiaAt,
  sx,
  sy,
} from './scene';

/**
 * Clustering — structure without labels.
 * Pure render: a real recorded k-means run (bad corner init, 5 iterations,
 * inertia 707 → 35), the size-mismatch failure where the halfway boundary
 * steals 9 points, and the EM-fit Gaussian mixture whose learned spreads
 * (0.64 vs 0.16) put all 100 points on the right side.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/clustering/overrides.json', slug: 'clustering' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const CL = [colors.ACCENT, colors.SECONDARY, colors.WARM];
const BROAD = colors.ACCENT;
const TIGHT = colors.WARM;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const centsU = s.get(scene.centsU);
  const iterF = s.get(scene.iterF);
  const colorU = s.get(scene.colorU);
  const meterU = s.get(scene.meterU);
  const failU = s.get(scene.failU);
  const fkmU = s.get(scene.fkmU);
  const gmmF = s.get(scene.gmmF);
  const gmmU = s.get(scene.gmmU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const inertia = kmInertiaAt(iterF);
  const iterShown = Math.min(KM_ITERS, Math.floor(iterF) + 1);
  const gm = gmAt(gmmF);
  const gmmDone = gmmF > GMM_STEPS - 0.5;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ————— Part A · k-means on three blobs ————— */}
          {ptsU > 0.01 && (
            <g opacity={ptsU}>
              <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
              {PTS.map((p, j) => {
                const k = kmAsgAt(iterF, j);
                const col = colorU > 0 ? CL[k] : colors.MUTED;
                return (
                  <circle
                    key={j}
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={4.4 * clamp01(ptsU * 1.5 - j / 240)}
                    fill={col}
                    opacity={colorU > 0 ? 0.55 + 0.4 * colorU : 0.75}
                    stroke={colors.BG}
                    strokeWidth={0.7}
                  />
                );
              })}
              {/* centroids */}
              {centsU > 0 &&
                [0, 1, 2].map((k) => {
                  const c = kmCentAt(iterF, k);
                  return (
                    <g key={k} opacity={centsU} transform={`translate(${sx(c.x)},${sy(c.y)})`}>
                      <line x1={-9} y1={-9} x2={9} y2={9} stroke={CL[k]} strokeWidth={4} />
                      <line x1={-9} y1={9} x2={9} y2={-9} stroke={CL[k]} strokeWidth={4} />
                      <circle r={13} fill="none" stroke={colors.BG} strokeWidth={1} />
                    </g>
                  );
                })}
              {/* inertia meter */}
              {meterU > 0 && (
                <g opacity={meterU}>
                  <text x={METER.x} y={METER.y - 14} fill={colors.TEXT} fontSize={15}>
                    total squared distance
                  </text>
                  <rect x={METER.x} y={METER.y} width={METER.w} height={METER.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                  <rect
                    x={METER.x + 2}
                    y={METER.y + 2}
                    width={(METER.w - 4) * clamp01(inertia / KM[0].inertia)}
                    height={METER.h - 4}
                    rx={6}
                    fill={colors.NEGATIVE}
                    opacity={0.8}
                  />
                  <text x={METER.x + METER.w + 14} y={METER.y + 19} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
                    {inertia.toFixed(0)}
                  </text>
                  <text x={METER.x} y={METER.y + 48} fill={colors.MUTED} fontSize={14}>
                    {`iteration ${iterShown} / ${KM_ITERS}`}
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ————— Part B · the failure + the mixture ————— */}
          {failU > 0.01 && (
            <g opacity={failU}>
              <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
              {/* k-means halfway boundary */}
              {fkmU > 0.01 && (
                <g opacity={fkmU}>
                  <line
                    x1={sx(FKM_BOUNDARY_X)}
                    y1={PLOT.y}
                    x2={sx(FKM_BOUNDARY_X)}
                    y2={PLOT.y + PLOT.h}
                    stroke={colors.NEGATIVE}
                    strokeWidth={2.4}
                    strokeDasharray="7 6"
                  />
                  <text x={sx(FKM_BOUNDARY_X) + 10} y={PLOT.y + 26} fill={colors.NEGATIVE} fontSize={14}>
                    k-means boundary
                  </text>
                  {/* centroids */}
                  {FKM.cents.map((c, k) => (
                    <g key={k} transform={`translate(${sx(c.x)},${sy(c.y)})`}>
                      <line x1={-8} y1={-8} x2={8} y2={8} stroke={colors.NEGATIVE} strokeWidth={3.5} />
                      <line x1={-8} y1={8} x2={8} y2={-8} stroke={colors.NEGATIVE} strokeWidth={3.5} />
                    </g>
                  ))}
                  <g>
                    <rect x={PLOT.x + 16} y={PLOT.y + PLOT.h - 52} width={230} height={34} rx={9} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                    <text x={PLOT.x + 32} y={PLOT.y + PLOT.h - 29} fill={colors.NEGATIVE} fontSize={14.5}>
                      {`${N_STOLEN} points on the wrong side`}
                    </text>
                  </g>
                </g>
              )}

              {/* mixture components */}
              {gmmU > 0.01 && (
                <g opacity={gmmU}>
                  {gm.map((c, k) => (
                    <g key={k}>
                      <circle cx={sx(c.mx)} cy={sy(c.my)} r={(c.s / 4.6) * PLOT.w} fill="none" stroke={k === 0 ? BROAD : TIGHT} strokeWidth={2.4} opacity={0.9} />
                      <circle cx={sx(c.mx)} cy={sy(c.my)} r={(2 * c.s / 4.6) * PLOT.w} fill="none" stroke={k === 0 ? BROAD : TIGHT} strokeWidth={1.2} strokeDasharray="4 5" opacity={0.5} />
                      <text x={sx(c.mx)} y={sy(c.my) - (c.s / 4.6) * PLOT.w - 10} textAnchor="middle" fill={k === 0 ? BROAD : TIGHT} fontSize={13.5}>
                        {`σ ${c.s.toFixed(2)} · π ${c.pi.toFixed(2)}`}
                      </text>
                    </g>
                  ))}
                  {gmmDone && (
                    <g>
                      <rect x={PLOT.x + 16} y={PLOT.y + 16} width={210} height={34} rx={9} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                      <text x={PLOT.x + 32} y={PLOT.y + 39} fill={colors.POSITIVE} fontSize={14.5}>
                        100 / 100 correct
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* the points — soft-colored once the mixture is up */}
              {FAIL.map((p, j) => {
                const stolen = FKM.stolen.includes(j);
                let fill: string;
                let op = 0.9;
                if (gmmU > 0.3) {
                  // soft membership: blend by responsibility (rendered as
                  // hard hue but opacity showing confidence near boundary)
                  const r0 = RESP0[j];
                  fill = r0 >= 0.5 ? BROAD : TIGHT;
                  op = 0.35 + 0.6 * Math.abs(r0 - 0.5) * 2;
                } else if (fkmU > 0.3) {
                  fill = p.x < FKM_BOUNDARY_X ? BROAD : TIGHT;
                } else {
                  fill = colors.MUTED;
                  op = 0.75;
                }
                return (
                  <g key={j}>
                    {stolen && fkmU > 0.5 && gmmU < 0.3 && (
                      <circle cx={sx(p.x)} cy={sy(p.y)} r={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={fkmU} />
                    )}
                    <circle cx={sx(p.x)} cy={sy(p.y)} r={4.4} fill={fill} opacity={op} stroke={colors.BG} strokeWidth={0.7} />
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={222} width={820} height={206} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Clustering
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            k-means: assign, average, repeat — inertia can only fall
          </text>
          <text x={640} y={370} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a gaussian mixture is the same dance, made soft — and it fixed all 9 thefts
          </text>
        </g>
      )}
    </>
  );
}

export function Clustering() {
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
