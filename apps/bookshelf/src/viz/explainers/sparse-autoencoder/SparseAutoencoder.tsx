import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { CLOUD, DIRS, H, PAN, SAE, TABLE, buildScene, decAt } from './scene';

/**
 * Sparse Autoencoders — unmixing the residual stream.
 * Pure render: the superposed activation cloud, five faint ground-truth
 * directions, and the SAE's decoder columns (real training snapshots)
 * locking onto them; final |cos| table 0.96–1.00.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/sparse-autoencoder/overrides.json', slug: 'sparse-autoencoder' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const FCOLORS = [colors.WARM, colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.NEGATIVE];
const SC = PAN.r * 0.62;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cloudU = s.get(scene.cloudU);
  const dirsU = s.get(scene.dirsU);
  const saeF = s.get(scene.saeF);
  const saeU = s.get(scene.saeU);
  const tableU = s.get(scene.tableU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the activation cloud */}
          {CLOUD.map((p, i) => (
            <circle
              key={i}
              cx={PAN.cx + p[0] * SC}
              cy={PAN.cy - p[1] * SC}
              r={3 * clamp01(cloudU * 1.6 - i / 700)}
              fill={colors.MUTED}
              opacity={0.5}
            />
          ))}

          {/* ground-truth directions (faint dashed) */}
          {dirsU > 0 &&
            DIRS.map((d, j) => (
              <g key={j} opacity={dirsU * 0.65}>
                <line
                  x1={PAN.cx}
                  y1={PAN.cy}
                  x2={PAN.cx + d[0] * SC * 1.45}
                  y2={PAN.cy - d[1] * SC * 1.45}
                  stroke={FCOLORS[j]}
                  strokeWidth={1.8}
                  strokeDasharray="5 6"
                />
                <text x={PAN.cx + d[0] * SC * 1.62} y={PAN.cy - d[1] * SC * 1.62 + 5} textAnchor="middle" fill={FCOLORS[j]} fontSize={13}>
                  {`true ${j + 1}`}
                </text>
              </g>
            ))}

          {/* SAE decoder columns (solid, learning) */}
          {saeU > 0 &&
            Array.from({ length: H }, (_, i) => {
              const [dx, dy] = decAt(saeF, i);
              const n = Math.hypot(dx, dy);
              if (n < 0.04) return null;
              return (
                <g key={i} opacity={saeU}>
                  <line
                    x1={PAN.cx}
                    y1={PAN.cy}
                    x2={PAN.cx + dx * SC}
                    y2={PAN.cy - dy * SC}
                    stroke={colors.TEXT}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <circle cx={PAN.cx + dx * SC} cy={PAN.cy - dy * SC} r={5} fill={colors.TEXT} />
                </g>
              );
            })}
          {saeU > 0 && (
            <text x={PAN.cx} y={PAN.cy + PAN.r + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} opacity={saeU}>
              white: the dictionary (decoder directions) · dashed: the planted truth
            </text>
          )}

          {/* match table */}
          {tableU > 0 && (
            <g opacity={tableU}>
              <rect x={TABLE.x} y={TABLE.y} width={330} height={230} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={TABLE.x + 20} y={TABLE.y + 32} fill={colors.TEXT} fontSize={15.5} fontWeight={600}>
                dictionary vs ground truth
              </text>
              {SAE.matches.map((m, j) => (
                <g key={j}>
                  <circle cx={TABLE.x + 30} cy={TABLE.y + 62 + j * 28} r={6} fill={FCOLORS[j]} />
                  <text x={TABLE.x + 48} y={TABLE.y + 67 + j * 28} fill={colors.TEXT} fontSize={14.5} fontFamily="ui-monospace, monospace">
                    {`true ${j + 1}   best |cos| = ${m.cos.toFixed(3)}`}
                  </text>
                </g>
              ))}
              <text x={TABLE.x + 20} y={TABLE.y + 212} fill={colors.MUTED} fontSize={13}>
                {`${SAE.alive} of ${H} slots alive — the rest died`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Sparse Autoencoders
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            reconstruct with few entries, and the dictionary becomes the truth
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            all five planted directions recovered, cosine 0.96 to 1.00
          </text>
        </g>
      )}
    </>
  );
}

export function SparseAutoencoder() {
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
