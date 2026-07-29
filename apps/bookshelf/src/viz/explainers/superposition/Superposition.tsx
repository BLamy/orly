import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { DENSE, GRID, INTERF, LPAN, NF, RPAN, SPARSE, buildScene, colAt } from './scene';

/**
 * Superposition — more features than neurons.
 * Pure render: two REAL training runs of the toy superposition model. Dense
 * regime: two features claim the plane, three are crushed. Sparse regime:
 * all five survive as a pentagon. Interference matrix shown as measured.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/superposition/overrides.json', slug: 'superposition' };

const FCOLORS = [colors.WARM, colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.NEGATIVE];
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function ArrowPanel({
  run,
  f,
  pan,
  title,
  sub,
  u,
}: {
  run: typeof DENSE;
  f: number;
  pan: typeof LPAN;
  title: string;
  sub: string;
  u: number;
}) {
  if (u <= 0) return null;
  const SC = pan.r * 0.82;
  return (
    <g opacity={u}>
      <circle cx={pan.cx} cy={pan.cy} r={pan.r} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
      <line x1={pan.cx - pan.r} y1={pan.cy} x2={pan.cx + pan.r} y2={pan.cy} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
      <line x1={pan.cx} y1={pan.cy - pan.r} x2={pan.cx} y2={pan.cy + pan.r} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
      <text x={pan.cx} y={pan.cy - pan.r - 28} textAnchor="middle" fill={colors.TEXT} fontSize={16.5}>
        {title}
      </text>
      <text x={pan.cx} y={pan.cy - pan.r - 8} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
        {sub}
      </text>
      {Array.from({ length: NF }, (_, j) => {
        const [wx, wy] = colAt(run, f, j);
        const x2 = pan.cx + wx * SC;
        const y2 = pan.cy - wy * SC;
        const n = Math.hypot(wx, wy);
        return (
          <g key={j}>
            <line x1={pan.cx} y1={pan.cy} x2={x2} y2={y2} stroke={FCOLORS[j]} strokeWidth={3.4} opacity={0.9} strokeLinecap="round" />
            <circle cx={x2} cy={y2} r={6} fill={FCOLORS[j]} />
            {n > 0.35 && (
              <text x={pan.cx + (wx / (n || 1)) * (SC * n + 24)} y={pan.cy - (wy / (n || 1)) * (SC * n + 24) + 5} textAnchor="middle" fill={FCOLORS[j]} fontSize={13.5}>
                {`f${j + 1}`}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const lU = s.get(scene.lU);
  const rU = s.get(scene.rU);
  const denseF = s.get(scene.denseF);
  const sparseF = s.get(scene.sparseF);
  const gridU = s.get(scene.gridU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          <ArrowPanel run={DENSE} f={denseF} pan={LPAN} title="features almost always on" sub="density 0.8 — real training run" u={lU} />
          <ArrowPanel run={SPARSE} f={sparseF} pan={RPAN} title="features rarely on" sub="density 0.05 — same model, same seed" u={rU} />

          {/* interference matrix (sparse solution) */}
          {gridU > 0 && (
            <g opacity={gridU}>
              <text x={GRID.x + (NF * GRID.cell) / 2} y={GRID.y - 34} textAnchor="middle" fill={colors.TEXT} fontSize={14.5}>
                interference
              </text>
              <text x={GRID.x + (NF * GRID.cell) / 2} y={GRID.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                |wᵢ · wⱼ|
              </text>
              {INTERF.map((row, i) =>
                row.map((v, j) => {
                  const u = clamp01(gridU * 2 - (i * NF + j) / (NF * NF));
                  return (
                    <g key={`${i}${j}`} opacity={u}>
                      <rect
                        x={GRID.x + j * GRID.cell}
                        y={GRID.y + i * GRID.cell}
                        width={GRID.cell - 2}
                        height={GRID.cell - 2}
                        rx={4}
                        fill={colors.heat(clamp01(v / 1.2))}
                        opacity={0.9}
                      />
                      <text
                        x={GRID.x + j * GRID.cell + GRID.cell / 2 - 1}
                        y={GRID.y + i * GRID.cell + GRID.cell / 2 + 3.5}
                        textAnchor="middle"
                        fill={colors.BG}
                        fontSize={9}
                        fontWeight={700}
                      >
                        {v.toFixed(1).replace('0.', '.')}
                      </text>
                    </g>
                  );
                }),
              )}
              <text x={GRID.x + (NF * GRID.cell) / 2} y={GRID.y + NF * GRID.cell + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                neighbors read ≈ ⅓
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={225} width={820} height={200} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Superposition
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            dense: one dimension per feature, losers deleted
          </text>
          <text x={640} y={374} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            sparse: five features in two neurons, rent paid in interference
          </text>
        </g>
      )}
    </>
  );
}

export function Superposition() {
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
