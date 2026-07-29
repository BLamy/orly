import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BARS,
  COL_LABELS,
  H_COND,
  HX,
  HXY,
  HXY_IND,
  HY,
  IND_TILES,
  J,
  JIND,
  MI,
  PX,
  PY,
  ROW_LABELS,
  TILES,
  buildScene,
} from './scene';

/**
 * Mutual Information — what one thing tells you about another.
 * Pure render: the real joint table as area-true tiles beside its independent
 * twin, then the honest bar accounting — H(X) and H(Y) sliding together until
 * their overlap is forced to I = 0.348 bits.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/mutual-information/overrides.json', slug: 'mutual-information' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** area-true 2x2 mosaic: column widths ∝ PY, row heights within column ∝ conditional */
function Mosaic({ x, y, size, joint, u, title }: { x: number; y: number; size: number; joint: number[][]; u: number; title: string }) {
  if (u <= 0) return null;
  // columns = umbrella yes/no; widths ∝ column marginal
  const colP = [joint[0][0] + joint[1][0], joint[0][1] + joint[1][1]];
  let cx = x;
  const cells: React.ReactNode[] = [];
  for (let c = 0; c < 2; c++) {
    const w = size * colP[c];
    let cy = y;
    for (let r = 0; r < 2; r++) {
      const h = size * (joint[r][c] / colP[c]);
      const i = r * 2 + c;
      const uu = clamp01(u * 2.4 - i * 0.3);
      cells.push(
        <g key={`${r}${c}`} opacity={uu}>
          <rect x={cx + 2} y={cy + 2} width={Math.max(0, w - 4)} height={Math.max(0, h - 4)} rx={8} fill={r === 0 ? colors.ACCENT : colors.WARM} opacity={r === c ? 0.55 : 0.35} stroke={colors.GRID} />
          {w > 60 && h > 34 && (
            <text x={cx + w / 2} y={cy + h / 2 + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
              {joint[r][c].toFixed(2)}
            </text>
          )}
          {w <= 60 || h <= 34 ? (
            <text x={cx + w / 2} y={cy - 6 + (r === 0 ? 0 : h + 16)} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              {joint[r][c].toFixed(2)}
            </text>
          ) : null}
        </g>,
      );
      cy += h;
    }
    cells.push(
      <text key={`c${c}`} x={cx + w / 2} y={y + size + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} opacity={u}>
        {COL_LABELS[c]}
      </text>,
    );
    cx += w;
  }
  return (
    <g>
      <text x={x + size / 2} y={y - 18} textAnchor="middle" fill={colors.TEXT} fontSize={16} opacity={u}>
        {title}
      </text>
      {cells}
      {/* row labels on the left of the first column */}
      <text x={x - 12} y={y + size * (J[0][0] / (J[0][0] + J[1][0])) * 0.5 + 5} textAnchor="end" fill={colors.MUTED} fontSize={13.5} opacity={u}>
        {ROW_LABELS[0]}
      </text>
      <text x={x - 12} y={y + size - size * (J[1][0] / (J[0][0] + J[1][0])) * 0.5 + 5} textAnchor="end" fill={colors.MUTED} fontSize={13.5} opacity={u}>
        {ROW_LABELS[1]}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tilesU = s.get(scene.tilesU);
  const margU = s.get(scene.margU);
  const indU = s.get(scene.indU);
  const tableDim = s.get(scene.tableDim);
  const barsU = s.get(scene.barsU);
  const slideU = s.get(scene.slideU);
  const condU = s.get(scene.condU);
  const texU = s.get(scene.texU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // bar act geometry: two bars, H(X) and H(Y); slideU moves them together
  // until they overlap by MI (total width = HXY)
  const bx0 = BARS.x;
  const y1 = BARS.y + 120;
  const y2 = y1 + BARS.rowH;
  const wX = HX * BARS.scale;
  const wY = HY * BARS.scale;
  const gap = 40; // initial horizontal gap between bar starts (side by side)
  const startY = bx0 + wX + gap;
  const endYx = bx0 + (HXY - HY) * BARS.scale; // final Y-bar start so total = HXY
  const yBarX = startY + (endYx - startY) * slideU;
  const overlapW = Math.max(0, bx0 + wX - yBarX);
  const midY = (y1 + y2) / 2 + 14;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          <g opacity={tableDim}>
            <Mosaic x={TILES.x} y={TILES.y} size={TILES.size} joint={J} u={tilesU} title="the real joint table" />
            <Mosaic x={IND_TILES.x} y={IND_TILES.y} size={IND_TILES.size} joint={JIND} u={indU} title="the independent twin" />
            {/* marginal chips */}
            {margU > 0 && (
              <g opacity={margU}>
                <text x={TILES.x + TILES.size + 26} y={TILES.y + 40} fill={colors.ACCENT} fontSize={14}>
                  {`rain ${PX[0].toFixed(2)}`}
                </text>
                <text x={TILES.x + TILES.size + 26} y={TILES.y + 64} fill={colors.WARM} fontSize={14}>
                  {`sun ${PX[1].toFixed(2)}`}
                </text>
                <text x={TILES.x + TILES.size + 26} y={TILES.y + 96} fill={colors.MUTED} fontSize={14}>
                  {`umbrella ${PY[0].toFixed(2)}`}
                </text>
              </g>
            )}
          </g>

          {/* the bar accounting */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={bx0} y={y1 - 16} fill={colors.ACCENT} fontSize={15}>
                {`H(sky) = ${HX.toFixed(2)} bits`}
              </text>
              <rect x={bx0} y={y1} width={wX} height={44} rx={9} fill={colors.ACCENT} opacity={0.55} stroke={colors.ACCENT} />
              <text x={yBarX} y={y2 + 62} fill={colors.WARM} fontSize={15}>
                {`H(umbrella) = ${HY.toFixed(2)} bits`}
              </text>
              <rect x={yBarX} y={y2} width={wY} height={44} rx={9} fill={colors.WARM} opacity={0.55} stroke={colors.WARM} />
              {/* overlap highlight */}
              {overlapW > 2 && (
                <g>
                  <rect x={yBarX} y={y1} width={overlapW} height={y2 + 44 - y1} rx={9} fill={colors.POSITIVE} opacity={0.3} stroke={colors.POSITIVE} strokeWidth={2} />
                  <text x={yBarX + overlapW / 2} y={midY - 58} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5} fontWeight={650}>
                    {slideU > 0.95 ? `I = ${MI.toFixed(2)} bits` : ''}
                  </text>
                </g>
              )}
              {/* total bracket */}
              <text x={bx0} y={y2 + 108} fill={colors.MUTED} fontSize={14.5}>
                {slideU > 0.95
                  ? `together: H(joint) = ${HXY.toFixed(2)} bits — not ${(HX + HY).toFixed(2)}`
                  : `separately: ${HX.toFixed(2)} + ${HY.toFixed(2)} = ${(HX + HY).toFixed(2)} bits`}
              </text>
              {/* conditional payoff */}
              {condU > 0 && (
                <g opacity={condU}>
                  <rect x={bx0} y={y2 + 130} width={620} height={40} rx={10} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                  <text x={bx0 + 18} y={y2 + 156} fill={colors.TEXT} fontSize={15}>
                    {`H(sky | umbrella) = ${H_COND.toFixed(2)} = ${HX.toFixed(2)} − ${MI.toFixed(2)}`}
                  </text>
                </g>
              )}
              <text x={bx0 + 700} y={y2 + 156} fill={colors.MUTED} fontSize={13.5} opacity={condU}>
                {`independent twin: joint ${HXY_IND.toFixed(2)}, overlap 0.00`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed formula */}
      <MathLabel tex={'I(X;Y) = H(X) + H(Y) - H(X,Y)'} x={640} y={64} fontSize={19} opacity={texU * dimU} />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={240} y={228} width={800} height={196} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Mutual Information
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the overlap in description cost: 0.88 + 0.89 − 1.43 = 0.35 bits
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            exactly the discount one observation buys on the other
          </text>
        </g>
      )}
    </>
  );
}

export function MutualInformation() {
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
