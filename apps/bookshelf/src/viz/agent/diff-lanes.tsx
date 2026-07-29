import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type HunkClass = 'executed' | 'needs-proof' | 'dead' | 'waived';

/** Sufficiency classification → tint. Every changed hunk lands in exactly one. */
export const HUNK_COLOR: Record<HunkClass, string> = {
  executed: colors.POSITIVE, // ran under the recording
  'needs-proof': colors.WARM, // shipped, never executed — prove it or else
  dead: colors.NEGATIVE, // unreachable; delete it
  waived: colors.MUTED, // types/config — no runtime surface to check
};

const CLASS_TAG: Record<HunkClass, string> = {
  executed: 'executed',
  'needs-proof': 'needs proof',
  dead: 'dead',
  waived: 'waived',
};

export interface DiffHunk {
  /** hunk label (file + symbol, rendered mono) */
  label: string;
  kind: HunkClass;
  /** hit count under the recording — sample it from a channel to fill */
  hits: number;
  /** 0..1 row reveal */
  u: number;
  /** 0..1 classification reveal (tint + tag land after the count fills) */
  classU: number;
}

const ROW_H = 40;
const GAP = 12;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Total height a DiffLanes block occupies. */
export function diffLanesHeight(rows: number): number {
  return rows * (ROW_H + GAP) - GAP;
}

/**
 * The sufficiency audit: the PR diff held against the recording, hunk by
 * hunk. A hit-count badge fills from a channel — how many times did this
 * changed line actually execute? — then each hunk is classified: executed
 * (green), needs-proof (amber: shipped but never ran), dead (red,
 * struck through: delete it), waived (muted: no runtime surface).
 */
export function DiffLanes({
  x,
  y,
  w,
  hunks,
  title = 'PR diff vs recording',
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  hunks: DiffHunk[];
  title?: string;
  dim?: number;
}) {
  const alpha = 1 - 0.6 * clamp01(dim);

  return (
    <g transform={`translate(${x}, ${y})`} opacity={alpha}>
      <text y={-9} fill={colors.MUTED} fontSize={12}>
        {title}
      </text>
      {hunks.map((hk, i) => {
        const ru = clamp01(hk.u);
        if (ru <= 0) return null;
        const cu = clamp01(hk.classU);
        const ry = i * (ROW_H + GAP);
        const color = HUNK_COLOR[hk.kind];
        const hits = Math.max(0, Math.round(hk.hits));
        // zero hits indicts an executed/needs-proof/dead hunk; a waived one
        // has no runtime surface, so its badge cools to muted with the tag.
        const zero = hits === 0;
        const badgeColor = !zero ? colors.POSITIVE : hk.kind === 'waived' && cu > 0.5 ? colors.MUTED : colors.NEGATIVE;
        const tag = CLASS_TAG[hk.kind];
        const tagW = tag.length * 6.8 + 16;
        const labelW = hk.label.length * 8.4;
        return (
          <g key={i} transform={`translate(0, ${ry + (1 - ru) * 10})`} opacity={ru}>
            {/* classification tint slides in under the row */}
            <rect width={w} height={ROW_H} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <rect width={w} height={ROW_H} rx={8} fill={color} opacity={0.1 * cu} />
            <rect width={w} height={ROW_H} rx={8} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.7 * cu} />
            {/* diff gutter */}
            <text x={13} y={ROW_H / 2 + 5} fill={cu > 0 ? color : colors.MUTED} fontSize={14} fontWeight={700} fontFamily={mono}>
              +
            </text>
            <text x={30} y={ROW_H / 2 + 5} fill={colors.TEXT} fontSize={14} fontFamily={mono}>
              {hk.label}
            </text>
            {/* dead code is struck through as the verdict lands */}
            {hk.kind === 'dead' && cu > 0 && (
              <line x1={28} y1={ROW_H / 2} x2={28 + (labelW + 4) * cu} y2={ROW_H / 2} stroke={colors.NEGATIVE} strokeWidth={2} />
            )}
            {/* hit-count badge */}
            <g transform={`translate(${w - tagW - 92}, ${ROW_H / 2})`}>
              <rect x={-34} y={-11} width={68} height={22} rx={11} fill={badgeColor} opacity={0.14} />
              <text y={4.5} textAnchor="middle" fill={badgeColor} fontSize={12} fontWeight={700} fontFamily={mono}>
                {hits === 1 ? '1 hit' : `${hits} hits`}
              </text>
            </g>
            {/* classification tag */}
            {cu > 0 && (
              <g transform={`translate(${w - tagW - 12}, ${ROW_H / 2}) scale(${0.85 + 0.15 * cu})`} opacity={cu}>
                <rect y={-10} width={tagW} height={20} rx={10} fill={color} opacity={0.18} />
                <text x={tagW / 2} y={4} textAnchor="middle" fill={color} fontSize={11} fontWeight={700} fontFamily={mono}>
                  {tag}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
