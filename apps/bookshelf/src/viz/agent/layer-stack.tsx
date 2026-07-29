import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface LayerRow {
  /** layer name (RENDER / STORE / WIRE) */
  label: string;
  /** the value observed at this layer, rendered as a mono chip */
  value: string;
  /** 0..1 row reveal — sample it from a channel */
  u: number;
}

export interface LayerConnector {
  /** 0..1 connector reveal */
  u: number;
  /** 0..1 — 0 reads "=" (POSITIVE); 1 snaps to "≠" with a break glyph (NEGATIVE) */
  snap: number;
}

const ROW_H = 44;
const GAP = 26;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Total height a LayerStack occupies (for placing a verdict below it). */
export function layerStackHeight(rows: number): number {
  return rows * ROW_H + (rows - 1) * GAP;
}

/**
 * The three-layer equality check at one timeline point: what the RENDER
 * said, what the STORE held, what went over the WIRE. Equality connectors
 * between the rows read "=" while the layers agree — and snap to a broken
 * "≠" the moment they don't. The whole falsification case is one screen:
 * screen-right is not runtime-right. `verdict` is the stamp slot.
 */
export function LayerStack({
  x,
  y,
  w,
  rows,
  connectors,
  verdict,
  verdictU = 0,
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  /** top to bottom (e.g. RENDER / STORE / WIRE) */
  rows: LayerRow[];
  /** rows.length − 1 of them, top to bottom */
  connectors: LayerConnector[];
  /** stamp text (e.g. 'FAILED' / 'HELD') */
  verdict?: string;
  /** 0..1 stamp pop; kind reads from the text (FAILED → NEGATIVE) */
  verdictU?: number;
  dim?: number;
}) {
  const alpha = 1 - 0.6 * clamp01(dim);
  const cx = 26; // connector column
  const vU = clamp01(verdictU);
  const bad = verdict !== undefined && /fail/i.test(verdict);
  const vColor = bad ? colors.NEGATIVE : colors.POSITIVE;

  return (
    <g transform={`translate(${x}, ${y})`} opacity={alpha}>
      {rows.map((row, i) => {
        const ru = clamp01(row.u);
        if (ru <= 0) return null;
        const ry = i * (ROW_H + GAP);
        const chipW = row.value.length * 9 + 22;
        return (
          <g key={i} transform={`translate(0, ${ry + (1 - ru) * 10})`} opacity={ru}>
            <rect width={w} height={ROW_H} rx={9} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={16} y={ROW_H / 2 + 4.5} fill={colors.MUTED} fontSize={13} fontWeight={700} letterSpacing={1.5} fontFamily={mono}>
              {row.label}
            </text>
            <rect x={w - chipW - 12} y={ROW_H / 2 - 13} width={chipW} height={26} rx={6} fill={colors.ACCENT} opacity={0.13} />
            <text x={w - 12 - chipW / 2} y={ROW_H / 2 + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily={mono}>
              {row.value}
            </text>
          </g>
        );
      })}
      {connectors.map((c, i) => {
        const cu = clamp01(c.u);
        if (cu <= 0) return null;
        const snap = clamp01(c.snap);
        const topY = i * (ROW_H + GAP) + ROW_H;
        const midY = topY + GAP / 2;
        const color = snap > 0.5 ? colors.NEGATIVE : colors.POSITIVE;
        // the connector shears sideways as it breaks
        const shear = 7 * snap;
        return (
          <g key={`c${i}`} opacity={cu}>
            <line x1={cx} y1={topY} x2={cx + shear} y2={midY - 9} stroke={color} strokeWidth={2} />
            <line x1={cx - shear} y1={midY + 9} x2={cx} y2={topY + GAP} stroke={color} strokeWidth={2} />
            <circle cx={cx} cy={midY} r={10.5} fill={colors.BG} stroke={color} strokeWidth={2} />
            {snap <= 0.5 ? (
              <text x={cx} y={midY + 4.5} textAnchor="middle" fill={color} fontSize={13} fontWeight={700} fontFamily={mono}>
                =
              </text>
            ) : (
              <text x={cx} y={midY + 4.5} textAnchor="middle" fill={color} fontSize={13} fontWeight={700} fontFamily={mono}>
                ≠
              </text>
            )}
            {/* break glyph — a lightning tear beside the badge when snapped */}
            {snap > 0.5 && (
              <path
                d={`M ${cx + 17} ${midY - 8} l -5 7 h 5 l -6 9`}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={(snap - 0.5) * 2}
              />
            )}
          </g>
        );
      })}
      {/* verdict stamp slot */}
      {verdict !== undefined && vU > 0 && (
        <g
          transform={`translate(${w / 2}, ${layerStackHeight(rows.length) / 2}) rotate(-9) scale(${0.7 + 0.3 * vU})`}
          opacity={vU}
        >
          <rect x={-verdict.length * 8.5 - 18} y={-24} width={verdict.length * 17 + 36} height={48} rx={8} fill={colors.BG} opacity={0.55} />
          <rect x={-verdict.length * 8.5 - 18} y={-24} width={verdict.length * 17 + 36} height={48} rx={8} fill="none" stroke={vColor} strokeWidth={3.5} />
          <text y={9} textAnchor="middle" fill={vColor} fontSize={26} fontWeight={800} letterSpacing={3} fontFamily={mono}>
            {verdict}
          </text>
        </g>
      )}
    </g>
  );
}
