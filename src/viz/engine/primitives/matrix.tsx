import { heat, HEAT_MAX, MUTED, TEXT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface MatrixHighlight {
  row?: number;
  col?: number;
  cell?: [number, number];
  color?: string;
  u: number;
}

/**
 * A heatmap grid (SVG — fine up to a few hundred cells). Values are 0..1.
 * Per-cell entrance comes from `cellU(i, j)`: scenes usually derive it from
 * ONE progress channel, e.g. (i, j) => clamp01(progress * total - (i * cols + j)),
 * which staggers the whole fill without n² channels.
 */
export function MatrixGrid({
  x,
  y,
  values,
  cell = 46,
  gap = 5,
  cellU = () => 1,
  fill,
  emphasize = 0.85,
  showValues = false,
  rowLabels,
  colLabels,
  highlight,
  labelSize = 15,
  opacity = 1,
}: {
  /** top-left corner in stage coordinates */
  x: number;
  y: number;
  /** row-major, normalized 0..1 */
  values: number[][];
  cell?: number;
  gap?: number;
  cellU?: (i: number, j: number) => number;
  fill?: (v: number, i: number, j: number) => string;
  /** values above this get the emphasis color mixed in */
  emphasize?: number;
  showValues?: boolean | ((v: number) => string);
  rowLabels?: string[];
  colLabels?: string[];
  highlight?: MatrixHighlight;
  labelSize?: number;
  opacity?: number;
}) {
  if (opacity <= 0) return null;
  const pitch = cell + gap;
  const rows = values.length;
  const cols = values[0]?.length ?? 0;
  const defaultFill = (v: number) => (v >= emphasize ? HEAT_MAX : heat(clamp01(v)));
  const fmt = typeof showValues === 'function' ? showValues : (v: number) => v.toFixed(2);

  return (
    <g opacity={opacity}>
      {values.map((row, i) =>
        row.map((v, j) => {
          const u = clamp01(cellU(i, j));
          if (u <= 0) return null;
          const cx = x + j * pitch + cell / 2;
          const cy = y + i * pitch + cell / 2;
          const s = 0.6 + 0.4 * u;
          return (
            <g key={`${i}-${j}`} opacity={u} transform={`translate(${cx}, ${cy}) scale(${s})`}>
              <rect
                x={-cell / 2}
                y={-cell / 2}
                width={cell}
                height={cell}
                rx={6}
                fill={(fill ?? defaultFill)(v, i, j)}
              />
              {showValues && (
                <text
                  y={labelSize / 3}
                  textAnchor="middle"
                  fill={v > 0.55 ? '#08101f' : TEXT}
                  fontSize={labelSize - 1}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {fmt(v)}
                </text>
              )}
            </g>
          );
        }),
      )}
      {rowLabels?.map((l, i) => (
        <text
          key={`r${i}`}
          x={x - 12}
          y={y + i * pitch + cell / 2 + labelSize / 3}
          textAnchor="end"
          fill={MUTED}
          fontSize={labelSize}
          opacity={clamp01(cellU(i, 0))}
        >
          {l}
        </text>
      ))}
      {colLabels?.map((l, j) => (
        <text
          key={`c${j}`}
          x={x + j * pitch + cell / 2}
          y={y - 12}
          textAnchor="middle"
          fill={MUTED}
          fontSize={labelSize}
          opacity={clamp01(cellU(0, j))}
        >
          {l}
        </text>
      ))}
      {highlight && highlight.u > 0 && (
        <HighlightRect x={x} y={y} pitch={pitch} cell={cell} rows={rows} cols={cols} h={highlight} />
      )}
    </g>
  );
}

function HighlightRect({
  x,
  y,
  pitch,
  cell,
  rows,
  cols,
  h,
}: {
  x: number;
  y: number;
  pitch: number;
  cell: number;
  rows: number;
  cols: number;
  h: MatrixHighlight;
}) {
  const pad = 4;
  let rx = x - pad;
  let ry = y - pad;
  let rw = cols * pitch - (pitch - cell) + pad * 2;
  let rh = rows * pitch - (pitch - cell) + pad * 2;
  if (h.cell) {
    rx = x + h.cell[1] * pitch - pad;
    ry = y + h.cell[0] * pitch - pad;
    rw = cell + pad * 2;
    rh = cell + pad * 2;
  } else if (h.row !== undefined) {
    ry = y + h.row * pitch - pad;
    rh = cell + pad * 2;
  } else if (h.col !== undefined) {
    rx = x + h.col * pitch - pad;
    rw = cell + pad * 2;
  }
  return (
    <rect
      x={rx}
      y={ry}
      width={rw}
      height={rh}
      rx={8}
      fill="none"
      stroke={h.color ?? '#fbbf24'}
      strokeWidth={2.5}
      opacity={clamp01(h.u)}
    />
  );
}
