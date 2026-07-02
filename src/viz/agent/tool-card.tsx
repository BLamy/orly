import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface ToolSchemaRow {
  key: string;
  type: string;
  required?: boolean;
}

const ROW_H = 21;
const PAD = 12;
const HEAD_H = 46;

/** Height a ToolCard will occupy (for stacking a tool list). */
export function toolCardHeight(schema: ToolSchemaRow[], hasResult = false): number {
  return HEAD_H + schema.length * ROW_H + PAD + (hasResult ? 28 : 0);
}

/**
 * A tool definition card — "a name, a description, a JSON input schema, and
 * an executor". `u` staggers the card + schema rows in; `active` glows when
 * the model emits a tool_use block naming it; `progress` fills the execution
 * dial (ToolExecutionStart → Update → End); `resultU` reveals the result
 * chip (`ok` or `is_error: true`).
 */
export function ToolCard({
  x,
  y,
  w = 260,
  name,
  desc,
  schema,
  u = 1,
  active = 0,
  progress = 0,
  result,
  resultKind = 'ok',
  resultU = 0,
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w?: number;
  /** tool name (rendered mono, like the SDK's `name`) */
  name: string;
  /** one-line description */
  desc: string;
  /** input_schema properties */
  schema: ToolSchemaRow[];
  /** 0..1 entrance; rows stagger from the same channel */
  u?: number;
  /** 0..1 glow — the model chose this tool */
  active?: number;
  /** 0..1 execution dial (0 hides it) */
  progress?: number;
  /** result chip text */
  result?: string;
  resultKind?: 'ok' | 'error';
  /** 0..1 result chip reveal */
  resultU?: number;
  dim?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const hasResult = result !== undefined;
  const h = toolCardHeight(schema, hasResult);
  const alpha = Math.min(1, uu * 2) * (1 - 0.6 * clamp01(dim));
  const color = colors.TEAL;
  const n = schema.length;
  const rowU = (i: number) => clamp01(uu * (n + 1) - (i + 1));
  const prog = clamp01(progress);
  const rU = clamp01(resultU);
  const resultColor = resultKind === 'ok' ? colors.POSITIVE : colors.NEGATIVE;
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  return (
    <g transform={`translate(${x}, ${y + (1 - Math.min(1, uu * 2)) * 12})`} opacity={alpha}>
      {active > 0 && (
        <rect x={-5} y={-5} width={w + 10} height={h + 10} rx={13} fill="none" stroke={color} strokeWidth={2} opacity={0.6 * clamp01(active)} />
      )}
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
      {/* fn glyph */}
      <path d={`M ${PAD + 3} 30 L ${PAD + 9} 13 l 2.4 6.3 M ${PAD + 6.6} 23 h 7.5`} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <text x={PAD + 24} y={24} fill={colors.TEXT} fontSize={16} fontWeight={700} fontFamily={mono}>
        {name}
      </text>
      <text x={PAD} y={HEAD_H - 6} fill={colors.MUTED} fontSize={12}>
        {desc}
      </text>
      {/* execution dial */}
      {prog > 0 && (
        <g transform={`translate(${w - 20}, 20)`}>
          <circle r={9} fill="none" stroke={color} strokeWidth={2.5} opacity={0.2} />
          <circle
            r={9}
            fill="none"
            stroke={prog >= 0.999 ? colors.POSITIVE : color}
            strokeWidth={2.5}
            pathLength={1}
            strokeDasharray={`${prog} 1`}
            strokeLinecap="round"
            transform="rotate(-90)"
          />
        </g>
      )}
      {/* input_schema rows */}
      {schema.map((row, i) => {
        const ru = rowU(i);
        if (ru <= 0) return null;
        return (
          <g key={row.key} transform={`translate(${PAD}, ${HEAD_H + (i + 0.7) * ROW_H})`} opacity={ru}>
            <text fill={colors.ACCENT} fontSize={13} fontFamily={mono}>
              {row.key}
              {row.required ? '*' : ''}
            </text>
            <text x={w - PAD * 2} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
              {row.type}
            </text>
          </g>
        );
      })}
      {/* result chip */}
      {hasResult && rU > 0 && (
        <g transform={`translate(${PAD}, ${h - 24})`} opacity={rU}>
          <rect y={-13} width={w - PAD * 2} height={20} rx={6} fill={resultColor} opacity={0.14} />
          <text x={8} y={1.5} fill={resultColor} fontSize={12} fontFamily={mono}>
            {resultKind === 'ok' ? '✓ ' : '✗ is_error '}
            {result}
          </text>
        </g>
      )}
    </g>
  );
}
