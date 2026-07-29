import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { CBOOK, H_P, LABELS, METER, P, PBARS, buildScene, ceAt, lenOf, qAt } from './scene';

/**
 * KL Divergence — the price of the wrong model.
 * Pure render: the true distribution and its ideal code, a codebook printed
 * from the wrong beliefs, the live cross-entropy bill (2.000 → 1.801), and
 * the waste strip that IS the divergence (0.250 → 0.051 bits).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/kl-divergence/overrides.json', slug: 'kl-divergence' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pU = s.get(scene.pU);
  const idealU = s.get(scene.idealU);
  const bookU = s.get(scene.bookU);
  const mix = s.get(scene.mix);
  const meterU = s.get(scene.meterU);
  const wasteU = s.get(scene.wasteU);
  const texU = s.get(scene.texU);
  const lossU = s.get(scene.lossU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const bill = ceAt(mix); // live cross-entropy under the current model mix
  const waste = bill - H_P;
  const modelName = mix < 0.5 ? 'the true codebook' : mix < 1.5 ? 'uniform beliefs' : 'closer beliefs';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the true distribution */}
          {pU > 0 && (
            <g opacity={pU}>
              <text x={PBARS.x + 160} y={PBARS.y - 26} fill={colors.TEXT} fontSize={16.5}>
                the true weather P
              </text>
              {P.map((p, i) => {
                const u = clamp01(pU * 1.8 - i / 5);
                const h = (p / 0.5) * PBARS.hMax * u;
                const x = PBARS.x + i * PBARS.step;
                return (
                  <g key={i}>
                    <rect x={x} y={PBARS.base - h} width={72} height={h} rx={8} fill={colors.ACCENT} opacity={0.75} />
                    <text x={x + 36} y={PBARS.base - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                      {p}
                    </text>
                    <text x={x + 36} y={PBARS.base + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                      {LABELS[i]}
                    </text>
                    {idealU > 0 && (
                      <text x={x + 36} y={PBARS.base + 44} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="ui-monospace, monospace" opacity={idealU}>
                        {`${-Math.log2(p)} bits`}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the model's codebook: lengths -log2 q */}
          {bookU > 0 && (
            <g opacity={bookU}>
              <text x={CBOOK.x + 180} y={CBOOK.y - 26} fill={colors.TEXT} fontSize={16.5}>
                {`the model's codebook — ${modelName}`}
              </text>
              {LABELS.map((lab, i) => {
                const len = lenOf([qAt(mix, 0), qAt(mix, 1), qAt(mix, 2), qAt(mix, 3)], i);
                const ideal = -Math.log2(P[i]);
                const over = len - ideal;
                const x = CBOOK.x + i * CBOOK.step;
                const h = len * CBOOK.unit;
                const hIdeal = ideal * CBOOK.unit;
                return (
                  <g key={i}>
                    {/* ideal portion */}
                    <rect x={x} y={CBOOK.base - Math.min(h, hIdeal)} width={80} height={Math.min(h, hIdeal)} rx={8} fill={colors.SECONDARY} opacity={0.65} />
                    {/* overpayment (or underlength shown warm-negative) */}
                    {over > 0.02 && (
                      <rect x={x} y={CBOOK.base - h} width={80} height={h - hIdeal} rx={8} fill={colors.NEGATIVE} opacity={0.75} />
                    )}
                    {over < -0.02 && (
                      <rect x={x} y={CBOOK.base - hIdeal} width={80} height={hIdeal - h} rx={8} fill="none" stroke={colors.MUTED} strokeDasharray="4 4" opacity={0.7} />
                    )}
                    <text x={x + 40} y={CBOOK.base - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily="ui-monospace, monospace">
                      {`${len.toFixed(2)}`}
                    </text>
                    <text x={x + 40} y={CBOOK.base + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                      {LABELS[i]}
                    </text>
                  </g>
                );
              })}
              <text x={CBOOK.x} y={CBOOK.base + 46} fill={colors.MUTED} fontSize={13}>
                purple: necessary length · red: overcharge vs the truth
              </text>
            </g>
          )}

          {/* the average bill meter */}
          {meterU > 0 && (
            <g opacity={meterU}>
              <text x={METER.x} y={METER.y - 12} fill={colors.TEXT} fontSize={15}>
                average bill per day
              </text>
              <rect x={METER.x} y={METER.y} width={METER.w} height={METER.h} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              {/* necessary portion */}
              <rect x={METER.x + 2} y={METER.y + 2} width={H_P * METER.scale - 4} height={METER.h - 4} rx={7} fill={colors.SECONDARY} opacity={0.8} />
              {/* waste portion */}
              {waste > 0.005 && (
                <rect x={METER.x + H_P * METER.scale} y={METER.y + 2} width={waste * METER.scale} height={METER.h - 4} rx={5} fill={colors.NEGATIVE} opacity={0.85} />
              )}
              <text x={METER.x + METER.w + 14} y={METER.y + 22} fill={colors.TEXT} fontSize={16} fontFamily="ui-monospace, monospace">
                {`${bill.toFixed(3)} bits`}
              </text>
              {wasteU > 0 && waste > 0.005 && (
                <text x={METER.x + H_P * METER.scale + (waste * METER.scale) / 2} y={METER.y + 52} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={wasteU}>
                  {`waste = ${waste.toFixed(3)}`}
                </text>
              )}
              <text x={METER.x + (H_P * METER.scale) / 2} y={METER.y + 52} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={0.9}>
                {`entropy ${H_P.toFixed(2)}`}
              </text>
            </g>
          )}

          {/* classifier bridge chip */}
          {lossU > 0 && (
            <g opacity={lossU}>
              <rect x={840} y={545} width={330} height={54} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.POSITIVE} />
              <text x={858} y={568} fill={colors.POSITIVE} fontSize={14.5}>
                cross-entropy loss = this bill
              </text>
              <text x={858} y={589} fill={colors.MUTED} fontSize={13}>
                training a classifier = shrinking the red
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel tex={'H(P,Q) = -\\textstyle\\sum_i p_i \\log_2 q_i \\qquad D_{KL}(P\\Vert Q) = H(P,Q) - H(P)'} x={640} y={62} fontSize={17} opacity={texU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            KL Divergence
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the overcharge for the wrong codebook: 2.000 paid, 1.750 necessary
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            every cross-entropy loss is this bill, minimized
          </text>
        </g>
      )}
    </>
  );
}

export function KlDivergence() {
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
