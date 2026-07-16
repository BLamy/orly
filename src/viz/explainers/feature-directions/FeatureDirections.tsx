import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { COORD_PROBE, COORD_RAND, CTRX, CTRY, N, PANEL, PLOT, PROBE, SCALE, Y, buildScene } from './scene';

/**
 * Features as Directions — opening the black box.
 * Pure render: 240 real activation vectors, first projected on arbitrary
 * axes (a blob), then rotated into the trained probe's basis (two clouds).
 * The probe direction recovers the planted one at cosine 0.993.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/feature-directions/overrides.json', slug: 'feature-directions' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const labelU = s.get(scene.labelU);
  const baseMix = s.get(scene.baseMix);
  const axisU = s.get(scene.axisU);
  const statsU = s.get(scene.statsU);
  const texU = s.get(scene.texU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={ptsU} />
          <text x={PLOT.x + PLOT.w / 2} y={PLOT.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} opacity={ptsU}>
            {baseMix < 0.5 ? 'two arbitrary axes of activation space' : 'horizontal axis = the probe direction'}
          </text>

          {/* the activations — same vectors, basis lerped */}
          {COORD_RAND.map((cr, i) => {
            const cp = COORD_PROBE[i];
            const x = CTRX + (cr[0] + (cp[0] - cr[0]) * baseMix) * SCALE;
            const y = CTRY - (cr[1] + (cp[1] - cr[1]) * baseMix) * SCALE;
            const u = clamp01(ptsU * 1.6 - i / 400);
            const col = labelU > 0 ? (Y[i] === 1 ? colors.WARM : colors.ACCENT) : colors.MUTED;
            return <circle key={i} cx={x} cy={y} r={3.6 * u} fill={col} opacity={labelU > 0 ? 0.85 : 0.7} />;
          })}

          {/* the probe axis */}
          {axisU > 0 && (
            <g opacity={axisU}>
              <line x1={PLOT.x + 20} y1={CTRY} x2={PLOT.x + PLOT.w - 20} y2={CTRY} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="7 6" />
              <text x={PLOT.x + PLOT.w - 24} y={CTRY - 10} textAnchor="end" fill={colors.POSITIVE} fontSize={13.5}>
                probe direction w
              </text>
            </g>
          )}

          {/* stats panel */}
          {statsU > 0 && (
            <g opacity={statsU}>
              <rect x={PANEL.x} y={PANEL.y} width={330} height={128} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={PANEL.x + 20} y={PANEL.y + 34} fill={colors.TEXT} fontSize={15.5} fontWeight={600}>
                probe vs planted direction
              </text>
              <text x={PANEL.x + 20} y={PANEL.y + 64} fill={colors.POSITIVE} fontSize={15} fontFamily="ui-monospace, monospace">
                {`cos(w, v_true) = ${PROBE.cos.toFixed(3)}`}
              </text>
              <text x={PANEL.x + 20} y={PANEL.y + 92} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
                {`accuracy ${PROBE.acc} / ${N}`}
              </text>
              <text x={PANEL.x + 20} y={PANEL.y + 116} fill={colors.MUTED} fontSize={13}>
                one dot product reads the concept
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel tex={'p = \\sigma(w \\cdot x + b)'} x={1010} y={62} fontSize={19} opacity={texU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Features as Directions
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a linear probe recovered the planted direction at cosine 0.993
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            readable is proven — used comes later, by intervention
          </text>
        </g>
      )}
    </>
  );
}

export function FeatureDirections() {
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
