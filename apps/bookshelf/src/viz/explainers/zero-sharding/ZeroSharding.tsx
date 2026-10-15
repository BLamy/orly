import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_DX,
  BAR_W,
  BAR_X0,
  BAR_Y0,
  CHIP_GB,
  N_DEV,
  STAGES,
  TWR_W,
  TWR_X,
  TWR_Y0,
  barH,
  buildScene,
  totalOf,
  twrH,
} from './scene';

/**
 * ZeRO — pure render. Tower segments and summary bars are computed exactly in
 * scene.ts from the 6.57B model's byte counts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/zero-sharding/overrides.json', slug: 'zero-sharding' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** interpolate segment sizes between consecutive stages */
function segsAt(stage: number): { w: number; g: number; opt: number } {
  const i = Math.max(0, Math.min(STAGES.length - 1, Math.floor(stage)));
  const j = Math.min(STAGES.length - 1, i + 1);
  const f = clamp01(stage - i);
  const a = STAGES[i];
  const b = STAGES[j];
  return {
    w: a.w + f * (b.w - a.w),
    g: a.g + f * (b.g - a.g),
    opt: a.opt + f * (b.opt - a.opt),
  };
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const twrU = s.get(scene.twrU);
  const stage = s.get(scene.stage);
  const barU = s.get(scene.barU);
  const commU = s.get(scene.commU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const seg = segsAt(stage);
  const total = seg.w + seg.g + seg.opt;
  const stageIdx = Math.min(STAGES.length - 1, Math.round(stage));
  const parts = [
    { key: 'opt', gb: seg.opt, c: colors.WARM, label: 'optimizer state' },
    { key: 'g', gb: seg.g, c: colors.SECONDARY, label: 'gradients' },
    { key: 'w', gb: seg.w, c: colors.ACCENT, label: 'weights' },
  ];

  let acc = 0;
  const drawn = parts.map((p) => {
    const h = twrH(p.gb);
    const y = TWR_Y0 - twrH(acc) - h;
    acc += p.gb;
    return { ...p, h, y };
  });

  // The tower and its ghosts give way to the bar chart once the bars start to grow.
  const towerU = clamp01(1 - barU);
  const plainH = twrH(totalOf(STAGES[0]));
  const ceilY = TWR_Y0 - twrH(CHIP_GB);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ghost towers: the other seven devices, so the ring reads as eight */}
          <g opacity={twrU * towerU * 0.3}>
            {Array.from({ length: N_DEV - 1 }, (_, i) => i + 1).map((k) => (
              <rect key={k} x={TWR_X + 24 + (k - 1) * 46} y={TWR_Y0 - twrH(total) - k * 6} width={TWR_W * 0.55} height={twrH(total)} rx={5} fill={colors.MUTED} />
            ))}
          </g>

          {/* hero tower */}
          <g opacity={twrU * towerU}>
            {/* plain data parallel's 98 GB, as a dashed outline, so the shrinking is measured against it */}
            <g opacity={clamp01(stage) * 0.8}>
              <rect x={TWR_X - TWR_W} y={TWR_Y0 - plainH} width={TWR_W} height={plainH} rx={4} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="6 5" />
              <text x={TWR_X - TWR_W / 2} y={TWR_Y0 - plainH - 12} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                was 98 GB
              </text>
            </g>
            {drawn.map(
              (p) =>
                p.gb > 0.15 && (
                  <g key={p.key}>
                    <rect x={TWR_X - TWR_W} y={p.y} width={TWR_W} height={p.h} rx={4} fill={p.c} opacity={0.82} stroke={colors.BG} strokeWidth={1.5} />
                    {p.h > 22 && (
                      <text x={TWR_X - TWR_W - 12} y={p.y + p.h / 2 + 5} textAnchor="end" fill={p.c} fontSize={14}>
                        {`${p.label} · ${p.gb.toFixed(1)} GB`}
                      </text>
                    )}
                  </g>
                ),
            )}
            <text x={TWR_X - TWR_W / 2} y={TWR_Y0 + 26} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={650}>
              {`this device: ${total.toFixed(1)} GB`}
            </text>
            <text x={TWR_X - TWR_W / 2} y={TWR_Y0 + 48} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              {STAGES[stageIdx].name}
            </text>
            {/* ceiling: starts clear of the segment labels, which end at x = TWR_X - TWR_W - 12 */}
            <line x1={TWR_X - TWR_W + 6} y1={ceilY} x2={TWR_X + 190} y2={ceilY} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="8 6" opacity={0.8} />
            <text x={TWR_X - TWR_W - 12} y={ceilY - 14} textAnchor="end" fill={colors.TEXT} fontSize={14}>
              80 GB ceiling
            </text>
          </g>

          {/* summary bars */}
          {STAGES.map((st, i) => {
            const u = clamp01(barU - i);
            if (u <= 0) return null;
            const t = totalOf(st);
            const h = barH(t) * u;
            return (
              <g key={st.name} opacity={u}>
                <rect x={BAR_X0 + i * BAR_DX} y={BAR_Y0 - h} width={BAR_W} height={h} rx={5} fill={t > CHIP_GB ? colors.NEGATIVE : colors.POSITIVE} opacity={0.8} />
                <text x={BAR_X0 + i * BAR_DX + BAR_W / 2} y={BAR_Y0 - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={650}>
                  {`${t.toFixed(0)}`}
                </text>
                <text x={BAR_X0 + i * BAR_DX + BAR_W / 2} y={BAR_Y0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  {i === 0 ? 'plain DP' : `ZeRO-${i}`}
                </text>
              </g>
            );
          })}
          {barU > 0 && (
            <g opacity={clamp01(barU)}>
              <line x1={BAR_X0 - 20} y1={BAR_Y0 - barH(CHIP_GB)} x2={BAR_X0 + 4 * BAR_DX - 36} y2={BAR_Y0 - barH(CHIP_GB)} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="8 6" opacity={0.8} />
              <text x={BAR_X0 + 4 * BAR_DX - 24} y={BAR_Y0 - barH(CHIP_GB) + 5} fill={colors.TEXT} fontSize={14}>
                80 GB ceiling
              </text>
            </g>
          )}
          {barU > 0.5 && (
            <text x={BAR_X0 + 1.5 * BAR_DX + BAR_W / 2} y={BAR_Y0 - barH(100) - 26} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(barU)}>
              GB per device · 6.57B params · 8 devices
            </text>
          )}
          {commU > 0 && (
            <g opacity={commU}>
              <rect x={BAR_X0 - 20} y={BAR_Y0 + 36} width={4 * BAR_DX} height={36} rx={9} fill={colors.BG} stroke={colors.WARM} strokeDasharray="5 4" />
              <text x={BAR_X0 - 20 + 2 * BAR_DX} y={BAR_Y0 + 59} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                stage 3 fine print: ≈ 1.5× the communication volume
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            ZeRO — Shard the Redundancy
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.POSITIVE} fontSize={22} fontWeight={600}>
            98 → 34 → 23 → 16Ψ/N = 12 GB per device
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            memory bought with bandwidth — nothing duplicated anywhere
          </text>
        </g>
      )}
    </>
  );
}

export function ZeroSharding() {
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
