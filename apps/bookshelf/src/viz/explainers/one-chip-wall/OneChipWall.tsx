import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CHIP_GB,
  CNT_X,
  CNT_Y0,
  LAYERS,
  MEM_TOTAL,
  PARAMS,
  SEGMENTS,
  TWR_W,
  TWR_X,
  TWR_Y0,
  buildScene,
  twrH,
} from './scene';

/**
 * Why One Chip Can't — pure render. Every number is computed in scene.ts from
 * the toy transformer's exact parameter count.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/one-chip-wall/overrides.json', slug: 'one-chip-wall' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const SEG_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.NEGATIVE];

const TALLY = [
  { label: 'embedding table · 32000 × 4096', val: '131.1M' },
  { label: `attention per layer · 4 d² × ${LAYERS}`, val: '2.15B' },
  { label: `feed-forward per layer · 8 d² × ${LAYERS}`, val: '4.29B' },
  { label: 'total parameters', val: `${(PARAMS / 1e9).toFixed(2)}B` },
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cntU = s.get(scene.cntU);
  const segU = s.get(scene.segU);
  const chipU = s.get(scene.chipU);
  const overU = s.get(scene.overU);
  const actU = s.get(scene.actU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // cumulative tower
  let acc = 0;
  const segs = SEGMENTS.map((seg, i) => {
    const u = clamp01(segU - i);
    const h = twrH(seg.gb) * u;
    const y = TWR_Y0 - twrH(acc) - h;
    acc += seg.gb * u;
    return { ...seg, u, h, y };
  });
  const towerGB = acc;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the tally */}
          <g opacity={Math.max(0, 1 - 1.3 * clamp01(segU))}>
            {TALLY.map((t, i) => {
              const u = clamp01(cntU * 1.7 - i * 0.18);
              if (u <= 0) return null;
              const last = i === TALLY.length - 1;
              return (
                <g key={t.label} opacity={u}>
                  <rect x={CNT_X - 150} y={CNT_Y0 + i * 62 - 20} width={430} height={46} rx={9} fill={colors.PANEL} stroke={last ? colors.WARM : colors.GRID} strokeWidth={last ? 1.8 : 1} />
                  <text x={CNT_X - 132} y={CNT_Y0 + i * 62 + 8} fill={last ? colors.TEXT : colors.MUTED} fontSize={13.5} fontWeight={last ? 650 : 400}>
                    {t.label}
                  </text>
                  <text x={CNT_X + 262} y={CNT_Y0 + i * 62 + 8} textAnchor="end" fill={last ? colors.WARM : colors.TEXT} fontSize={14.5} fontWeight={640}>
                    {t.val}
                  </text>
                </g>
              );
            })}
          </g>

          {/* the memory tower */}
          {segs.map(
            (seg, i) =>
              seg.u > 0 && (
                <g key={seg.key}>
                  <rect x={TWR_X} y={seg.y} width={TWR_W} height={seg.h} rx={4} fill={SEG_COLORS[i]} opacity={0.8} stroke={colors.BG} strokeWidth={1.5} />
                  {seg.u > 0.6 && (
                    <text x={TWR_X + TWR_W + 16} y={seg.y + seg.h / 2 + 5} fill={SEG_COLORS[i]} fontSize={13} opacity={clamp01((seg.u - 0.6) * 3)}>
                      {`${seg.label} · ${seg.gb.toFixed(1)} GB`}
                    </text>
                  )}
                </g>
              ),
          )}
          {segU > 0.2 && (
            <text x={TWR_X + TWR_W / 2} y={TWR_Y0 + 26} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontWeight={640}>
              {`training state: ${towerGB.toFixed(1)} GB`}
            </text>
          )}
          {/* chip ceiling */}
          {chipU > 0 && (
            <g opacity={chipU}>
              <line x1={TWR_X - 130} y1={TWR_Y0 - twrH(CHIP_GB)} x2={TWR_X + TWR_W + 240} y2={TWR_Y0 - twrH(CHIP_GB)} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="8 6" />
              <text x={TWR_X - 130} y={TWR_Y0 - twrH(CHIP_GB) - 10} fill={colors.TEXT} fontSize={13.5} fontWeight={630}>
                one accelerator: 80 GB
              </text>
            </g>
          )}
          {overU > 0 && (
            <g opacity={overU}>
              <rect x={TWR_X - 8} y={TWR_Y0 - twrH(MEM_TOTAL) - 8} width={TWR_W + 16} height={twrH(MEM_TOTAL - CHIP_GB) + 8} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <text x={TWR_X + TWR_W + 16} y={TWR_Y0 - twrH(CHIP_GB) - 38} fill={colors.NEGATIVE} fontSize={13.5} fontWeight={640}>
                {`${(MEM_TOTAL - CHIP_GB).toFixed(0)} GB over the ceiling`}
              </text>
            </g>
          )}
          {actU > 0 && (
            <g opacity={actU}>
              <text x={TWR_X - 130} y={140} fill={colors.MUTED} fontSize={13}>
                + activations (batch × sequence × layers)
              </text>
              <text x={TWR_X - 130} y={162} fill={colors.MUTED} fontSize={13}>
                not even counted yet
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'16\\ \\text{bytes/param} \\times 6.57\\times 10^9 \\approx 98\\ \\text{GB}'}
        x={330}
        y={640}
        fontSize={18}
        color={colors.WARM}
        opacity={clamp01(overU) * dimU}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Why One Chip Can't
          </text>
          <MathLabel
            tex={'2 + 2 + 8 + 4 = 16\\ \\text{bytes per parameter}'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            98 GB of training state vs an 80 GB ceiling — the wall is arithmetic
          </text>
        </g>
      )}
    </>
  );
}

export function OneChipWall() {
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
