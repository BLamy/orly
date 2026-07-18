import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CANDIDATES,
  DATAW,
  FAR_IDX,
  PLOT,
  POINTS,
  SOLVED,
  XF_N,
  XOR,
  XOR_FIELD,
  XPLOT,
  buildScene,
  sx,
  sy,
  xxs,
  xys,
} from './scene';

/**
 * Support Vector Machines — the widest street.
 * Pure render: the exactly-solved max-margin street (width 1.272, three
 * support vectors) on 20 seeded points, the deletion test, the failing line
 * sweep on XOR, and the real kernel-machine decision field lifting XOR.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/svm/overrides.json', slug: 'svm' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const NEG = colors.ACCENT;
const POS = colors.WARM;

/** stage endpoints of the line w·x + b = c clipped to the data window. */
function lineSeg(c: number): { x1: number; y1: number; x2: number; y2: number } | null {
  const { w, b } = SOLVED;
  return segFor(w, b, c);
}
function segFor(w: { x: number; y: number }, b: number, c: number) {
  // collect intersections with the window edges
  const pts: { x: number; y: number }[] = [];
  const tryX = (x: number) => {
    if (Math.abs(w.y) < 1e-9) return;
    const y = (c - b - w.x * x) / w.y;
    if (y >= DATAW.y0 - 1e-9 && y <= DATAW.y1 + 1e-9) pts.push({ x, y });
  };
  const tryY = (y: number) => {
    if (Math.abs(w.x) < 1e-9) return;
    const x = (c - b - w.y * y) / w.x;
    if (x >= DATAW.x0 - 1e-9 && x <= DATAW.x1 + 1e-9) pts.push({ x, y });
  };
  tryX(DATAW.x0);
  tryX(DATAW.x1);
  tryY(DATAW.y0);
  tryY(DATAW.y1);
  if (pts.length < 2) return null;
  // consistent endpoint order (along the line direction) so the street
  // polygon built from two curbs never self-intersects into a bowtie
  pts.sort((a2, b2) => a2.x - b2.x || a2.y - b2.y);
  return { x1: sx(pts[0].x), y1: sy(pts[0].y), x2: sx(pts[1].x), y2: sy(pts[1].y) };
}

const CENTER = lineSeg(0)!;
const XCELL = XPLOT.w / XF_N;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const candU = s.get(scene.candU);
  const streetU = s.get(scene.streetU);
  const lineU = s.get(scene.lineU);
  const svU = s.get(scene.svU);
  const deleteU = s.get(scene.deleteU);
  const texU = s.get(scene.texU);
  const xorU = s.get(scene.xorU);
  const xorSweep = s.get(scene.xorSweep);
  const liftU = s.get(scene.liftU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const curbA = segFor(SOLVED.w, SOLVED.b, streetU);
  const curbB = segFor(SOLVED.w, SOLVED.b, -streetU);

  // failing XOR sweep: rotate a line through the origin
  const th = -0.4 + xorSweep * 2.2;
  const sweepActive = xorSweep > 0 && xorSweep < 1 && liftU < 0.05;
  // count XOR mistakes of the sweep line (sign of rotated normal)
  const nx = Math.cos(th);
  const ny = Math.sin(th);
  const sweepErr = XOR.filter((p) => Math.sign(p.x * nx + p.y * ny || 1) !== p.c).length;
  const sweepErrShown = Math.min(sweepErr, 4 - sweepErr) === sweepErr ? sweepErr : 4 - sweepErr; // best label flip

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* frame */}
          <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} opacity={ptsU} />

          {/* candidate lines */}
          {candU > 0 &&
            CANDIDATES.map((cnd, i) => {
              const seg = segFor(cnd.w, cnd.b, 0);
              if (!seg) return null;
              return (
                <line
                  key={i}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={colors.MUTED}
                  strokeWidth={1.6}
                  strokeDasharray="7 6"
                  opacity={candU * 0.65}
                />
              );
            })}

          {/* the street: band between the curbs */}
          {streetU > 0.02 && curbA && curbB && (
            <polygon
              points={`${curbA.x1},${curbA.y1} ${curbA.x2},${curbA.y2} ${curbB.x2},${curbB.y2} ${curbB.x1},${curbB.y1}`}
              fill={colors.POSITIVE}
              opacity={0.1}
            />
          )}
          {curbA && streetU > 0.02 && (
            <line x1={curbA.x1} y1={curbA.y1} x2={curbA.x2} y2={curbA.y2} stroke={colors.POSITIVE} strokeWidth={1.8} strokeDasharray="5 5" opacity={0.8} />
          )}
          {curbB && streetU > 0.02 && (
            <line x1={curbB.x1} y1={curbB.y1} x2={curbB.x2} y2={curbB.y2} stroke={colors.POSITIVE} strokeWidth={1.8} strokeDasharray="5 5" opacity={0.8} />
          )}
          {/* center line */}
          {lineU > 0 && (
            <line
              x1={CENTER.x1}
              y1={CENTER.y1}
              x2={CENTER.x1 + (CENTER.x2 - CENTER.x1) * lineU}
              y2={CENTER.y1 + (CENTER.y2 - CENTER.y1) * lineU}
              stroke={colors.POSITIVE}
              strokeWidth={3}
            />
          )}
          {/* width chip */}
          {streetU > 0.9 && (
            <g opacity={clamp01((streetU - 0.9) * 10)}>
              <rect x={PLOT.x + 16} y={PLOT.y + 16} width={220} height={34} rx={9} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
              <text x={PLOT.x + 32} y={PLOT.y + 39} fill={colors.POSITIVE} fontSize={15}>
                {`street width = ${SOLVED.marg.toFixed(2)}`}
              </text>
            </g>
          )}

          {/* points */}
          {POINTS.map((p, i) => {
            const isSv = SOLVED.sv.includes(i);
            const gone = i === FAR_IDX ? 1 - deleteU : 1;
            return (
              <g key={i} opacity={0.95 * gone}>
                {isSv && svU > 0 && (
                  <circle cx={sx(p.x)} cy={sy(p.y)} r={12 + 3 * svU} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} opacity={svU} />
                )}
                <circle
                  cx={sx(p.x)}
                  cy={sy(p.y)}
                  r={6 * clamp01(ptsU * 1.5 - i / 40)}
                  fill={p.c === 1 ? POS : NEG}
                  stroke={colors.BG}
                  strokeWidth={1}
                />
              </g>
            );
          })}
          {deleteU > 0.2 && deleteU < 0.98 && (
            <text x={sx(POINTS[FAR_IDX].x)} y={sy(POINTS[FAR_IDX].y) - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={1 - deleteU}>
              deleted
            </text>
          )}

          {/* ————— XOR panel ————— */}
          {xorU > 0.01 && (
            <g opacity={xorU}>
              {/* kernel decision field */}
              {liftU > 0.02 && (
                <g opacity={liftU * 0.85}>
                  {XOR_FIELD.map((v, idx) => {
                    const r = Math.floor(idx / XF_N);
                    const c = idx % XF_N;
                    const col = v >= 0 ? POS : NEG;
                    const conf = clamp01(Math.abs(v));
                    return (
                      <rect
                        key={idx}
                        x={XPLOT.x + c * XCELL}
                        y={XPLOT.y + r * XCELL}
                        width={XCELL + 0.5}
                        height={XCELL + 0.5}
                        fill={col}
                        opacity={0.08 + 0.2 * conf}
                      />
                    );
                  })}
                </g>
              )}
              <rect x={XPLOT.x} y={XPLOT.y} width={XPLOT.w} height={XPLOT.h} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
              <text x={XPLOT.x + XPLOT.w / 2} y={XPLOT.y - 16} textAnchor="middle" fill={colors.TEXT} fontSize={15.5}>
                exclusive or — no line works
              </text>
              {/* sweeping failing line */}
              {sweepActive && (
                <line
                  x1={xxs(-1.5 * ny)}
                  y1={xys(1.5 * nx)}
                  x2={xxs(1.5 * ny)}
                  y2={xys(-1.5 * nx)}
                  stroke={colors.NEGATIVE}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  opacity={0.9}
                />
              )}
              {sweepActive && (
                <text x={XPLOT.x + XPLOT.w - 10} y={XPLOT.y + 26} textAnchor="end" fill={colors.NEGATIVE} fontSize={14}>
                  {`${Math.max(1, sweepErrShown)} wrong`}
                </text>
              )}
              {/* the four corners */}
              {XOR.map((p, i) => (
                <g key={i}>
                  <circle cx={xxs(p.x)} cy={xys(p.y)} r={10} fill={p.c === 1 ? POS : NEG} stroke={colors.BG} strokeWidth={1.5} />
                  {liftU > 0.6 && (
                    <text x={xxs(p.x)} y={xys(p.y) - 18} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={liftU}>
                      {p.c === 1 ? '+1' : '−1'}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={"\\max \\tfrac{2}{\\lVert w \\rVert}\\ \\text{s.t.}\\ y_i(w\\cdot x_i + b) \\ge 1"}
        x={980}
        y={62}
        fontSize={18}
        opacity={texU}
      />
      <MathLabel tex={"k(x, x') = (x \\cdot x' + 1)^2"} x={XPLOT.x + XPLOT.w / 2} y={XPLOT.y + XPLOT.h + 34} fontSize={17} opacity={s.get(scene.liftU) * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Support Vector Machines
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the widest street — carried entirely by 3 of 20 points
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            and when no street exists, a kernel borrows one from a higher dimension
          </text>
        </g>
      )}
    </>
  );
}

export function Svm() {
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
