import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_BASE,
  BAR_HMAX,
  ENTROPY,
  EXP_LEN,
  MERGES,
  METERS,
  NODES,
  SYMS,
  buildScene,
  nodeById,
} from './scene';

/**
 * Huffman Codes — shorter words for common things.
 * Pure render: the real Huffman merge sequence assembling the tree bottom-up,
 * edge bits appearing as directions, and meters comparing fixed 3.000 /
 * Huffman 2.800 / entropy 2.771 bits per letter.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/huffman/overrides.json', slug: 'huffman' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const LEAVES = NODES.filter((n) => n.leaf);
const FIXED: Record<string, string> = {};
SYMS.forEach(({ s }, i) => (FIXED[s] = i.toString(2).padStart(3, '0')));

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const barsU = s.get(scene.barsU);
  const fixedU = s.get(scene.fixedU);
  const mergeF = s.get(scene.mergeF);
  const codesU = s.get(scene.codesU);
  const metersU = s.get(scene.metersU);
  const hLineU = s.get(scene.hLineU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* frequency bars under the leaves */}
          {LEAVES.map((n, i) => {
            const u = clamp01(barsU * 1.6 - i / 12);
            const h = (n.p / 0.3) * BAR_HMAX * 0.55 * u;
            return (
              <g key={n.id}>
                <rect x={n.x - 20} y={BAR_BASE - h} width={40} height={h} rx={6} fill={colors.ACCENT} opacity={0.35 + 0.4 * (n.p / 0.27)} />
                <text x={n.x} y={BAR_BASE + 22} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={650}>
                  {n.s}
                </text>
                <text x={n.x} y={BAR_BASE + 42} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                  {`${(n.p * 100).toFixed(0)}%`}
                </text>
                {/* fixed-width code (opening) */}
                {fixedU > 0 && (
                  <text x={n.x} y={BAR_BASE + 62} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily="ui-monospace, monospace" opacity={fixedU}>
                    {FIXED[n.s]}
                  </text>
                )}
                {/* Huffman code (after codesU) */}
                {codesU > 0 && (
                  <text x={n.x} y={BAR_BASE + 62} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontFamily="ui-monospace, monospace" opacity={codesU}>
                    {n.code}
                  </text>
                )}
              </g>
            );
          })}

          {/* the merging tree: edges + internal nodes appear per merge step */}
          {MERGES.map((mg, i) => {
            const u = clamp01(mergeF - i);
            if (u <= 0) return null;
            const M = nodeById(mg.m);
            const A = nodeById(mg.a);
            const B = nodeById(mg.b);
            const leafShift = (n: typeof M) => (n.leaf ? BAR_BASE - 74 : n.y);
            const ay = leafShift(A);
            const by = leafShift(B);
            return (
              <g key={mg.m} opacity={u}>
                <line x1={M.x} y1={M.y} x2={A.x} y2={ay} stroke={colors.GRID} strokeWidth={2} />
                <line x1={M.x} y1={M.y} x2={B.x} y2={by} stroke={colors.GRID} strokeWidth={2} />
                {/* 0/1 edge bits */}
                {codesU > 0 && (
                  <g opacity={codesU}>
                    <text x={(M.x + A.x) / 2 - 10} y={(M.y + ay) / 2} fill={colors.WARM} fontSize={14} fontFamily="ui-monospace, monospace">
                      {A.code.slice(-1)}
                    </text>
                    <text x={(M.x + B.x) / 2 + 6} y={(M.y + by) / 2} fill={colors.WARM} fontSize={14} fontFamily="ui-monospace, monospace">
                      {B.code.slice(-1)}
                    </text>
                  </g>
                )}
                <circle cx={M.x} cy={M.y} r={17} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
                <text x={M.x} y={M.y + 4.5} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
                  {mg.p.toFixed(2).replace(/^0/, '')}
                </text>
              </g>
            );
          })}

          {/* meters */}
          {metersU > 0 && (
            <g opacity={metersU}>
              {[
                { label: 'fixed-width code', v: 3.0, col: colors.NEGATIVE },
                { label: 'Huffman code', v: EXP_LEN, col: colors.POSITIVE },
                { label: 'entropy (the floor)', v: ENTROPY, col: colors.WARM },
              ].map((m, i) => {
                if (i === 2 && hLineU <= 0) return null;
                const w = (m.v / 3.2) * METERS.w;
                return (
                  <g key={m.label} opacity={i === 2 ? hLineU : 1}>
                    <text x={METERS.x} y={METERS.y + i * METERS.rowH - 12} fill={colors.MUTED} fontSize={14}>
                      {m.label}
                    </text>
                    <rect x={METERS.x} y={METERS.y + i * METERS.rowH} width={METERS.w} height={24} rx={7} fill={colors.PANEL} stroke={colors.GRID} />
                    <rect x={METERS.x + 2} y={METERS.y + i * METERS.rowH + 2} width={w - 4} height={20} rx={5} fill={m.col} opacity={0.8} />
                    <text x={METERS.x + METERS.w + 12} y={METERS.y + i * METERS.rowH + 18} fill={colors.TEXT} fontSize={14.5} fontFamily="ui-monospace, monospace">
                      {m.v.toFixed(3)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed entropy formula */}
      <MathLabel tex={'H = -\\textstyle\\sum_i p_i \\log_2 p_i = 2.771'} x={1000} y={560} fontSize={17} opacity={hLineU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Huffman Codes
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            merge the two rarest, repeat — 2.800 bits per letter
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            three hundredths above the entropy floor of 2.771
          </text>
        </g>
      )}
    </>
  );
}

export function Huffman() {
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
