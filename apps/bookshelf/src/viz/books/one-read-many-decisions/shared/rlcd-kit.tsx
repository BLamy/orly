// Shared vocabulary for Book 2 "One Read, Many Decisions" — NOT a scene module
// (it lives in a subdirectory so the books/*/*.tsx scene glob skips it).
//
// Series colour roles, caption pacing and the mono font come from Book 1's
// shared file (read-only reuse). Everything here is a pure function of props.
//
// The fictional support note, its two independent fields, and the schematic
// token pieces are TEACHING FIXTURES: not customer data, not real Qwen
// tokenization, and every score drawn from them is an illustrative ranking score.
import type { ReactNode } from 'react';
import { interpolateRgb } from 'd3';
import { colors, ease } from '../../../core';
import type { ChannelRef, Timeline } from '../../../core';
import { MONO, ROLE, captionPlan } from '../../next-useful-action/shared/profile-page';

export { MONO, ROLE, captionPlan };

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** deterministic pseudo-noise in 0..1 — stands in for "some activation value". */
export const hash01 = (i: number, j: number): number => {
  const v = Math.sin(i * 12.9898 + j * 78.233 + 1.7) * 43758.5453;
  return v - Math.floor(v);
};
export const heatColor = interpolateRgb('#1d1842', ROLE.MODEL);
export const STAGE_BG = '#0a0e1a';

/* ------------------------------------------------------------ the fixture */
export const NOTE_TEXT = 'The export failed twice; I need the report for tomorrow.';
/** schematic pieces — pieces of text, not necessarily whole words */
export const NOTE_PIECES = ['The', 'export', 'failed', 'twice', ';', 'I', 'need', 'the', 'report', 'for', 'tom', 'orrow', '.'];
export interface FieldSpec {
  name: string;
  choices: string[];
  /** index selected in the illustration — a selection under a policy, NOT a verified ground truth */
  pick: number;
}
export const FIELDS: FieldSpec[] = [
  { name: 'topic', choices: ['billing', 'export', 'account'], pick: 1 },
  { name: 'urgency', choices: ['low', 'medium', 'high'], pick: 2 },
];
/** the JSON answer as schematic output pieces; DECISION marks the two that carry decisions */
export const OUT_PIECES = ['{"', 'topic', '":"', 'export', '","', 'urg', 'ency', '":"', 'high', '"}'];
export const DECISION_IDX = [3, 8];
export const DECISION = new Set(DECISION_IDX);

/** Tween a channel through integer stops: from, from+1, … — a stepping process. */
export function stepThrough(tl: Timeline, ch: ChannelRef<number>, from: number, n: number, at: number, each: number): number {
  for (let i = 0; i < n; i++) tl.tween(ch, from + i, { at: at + i * each, dur: Math.min(0.32, each * 0.4), ease: ease.move });
  return at + n * each;
}

/* ------------------------------------------------------------ components */
export function Label({
  x, y, text, u = 1, size = 16, color = colors.TEXT, anchor = 'start', mono = false, weight = 500,
}: {
  x: number; y: number; text: string; u?: number; size?: number; color?: string;
  anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number;
}) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} fontFamily={mono ? MONO : undefined} opacity={o}>
      {text}
    </text>
  );
}

/** A token piece on a tape. `dashed` marks structure-only pieces (shape, not just colour). */
export function Cell({
  x, y, w, h, text, u = 1, tone = ROLE.MODEL, fill = '#15122e', dashed = false, strong = 0, size = 12,
}: {
  x: number; y: number; w: number; h: number; text: string; u?: number; tone?: string; fill?: string;
  dashed?: boolean; strong?: number; size?: number;
}) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y + (1 - o) * 8})`} opacity={o}>
      <rect width={w} height={h} rx={6} fill={fill} stroke={tone} strokeWidth={1.2 + 1.6 * strong} strokeDasharray={dashed ? '4 3' : undefined} />
      <text x={w / 2} y={h / 2 + size * 0.36} textAnchor="middle" fill={colors.TEXT} fontSize={size} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export const chipW = (text: string, size = 13): number => text.length * size * 0.62 + 26;

/** A bordered pill; callers lead the text with a glyph (✓ ✕ ? ◆) so colour never carries meaning alone. */
export function Chip({
  x, y, text, u = 1, color = ROLE.MODEL, fill = '#10162a', size = 13, dashed = false, anchor = 'start',
}: {
  x: number; y: number; text: string; u?: number; color?: string; fill?: string; size?: number; dashed?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const w = chipW(text, size);
  const h = size + 14;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g transform={`translate(${x0} ${y - h / 2 + (1 - o) * 6})`} opacity={o}>
      <rect width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.3} strokeDasharray={dashed ? '5 4' : undefined} />
      <text x={w / 2} y={h / 2 + size * 0.35} textAnchor="middle" fill={color} fontSize={size} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** Which implementation a statement is about. Shape + word + colour, never colour alone. */
export type StatusKind = 'CURRENT' | 'REFERENCE' | 'INTENDED';
const STATUS: Record<StatusKind, { color: string; dashed: boolean }> = {
  CURRENT: { color: ROLE.OBSERVE, dashed: false },
  REFERENCE: { color: ROLE.MODEL, dashed: false },
  INTENDED: { color: ROLE.PENDING, dashed: true },
};
export function StatusTag({ x, y, kind, text, u = 1 }: { x: number; y: number; kind: StatusKind; text: string; u?: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const st = STATUS[kind];
  const full = `${kind} · ${text}`;
  const w = full.length * 8.1 + 44;
  return (
    <g transform={`translate(${x} ${y - 14})`} opacity={o}>
      <rect width={w} height={28} rx={6} fill="#0d1321" stroke={st.color} strokeWidth={1.4} strokeDasharray={st.dashed ? '6 4' : undefined} />
      {kind === 'CURRENT' && <circle cx={17} cy={14} r={5.5} fill={st.color} />}
      {kind === 'REFERENCE' && <rect x={11.5} y={8.5} width={11} height={11} fill={st.color} />}
      {kind === 'INTENDED' && <path d="M17 7l7 7l-7 7l-7 -7Z" fill="none" stroke={st.color} strokeWidth={1.8} />}
      <text x={32} y={18.5} fill={st.color} fontSize={13} fontFamily={MONO}>
        {full}
      </text>
    </g>
  );
}

/** Opaque panel for closing text — the stage beneath is cleared first. */
export function Panel({ x, y, w, h, u, stroke = '#2a3754', children }: { x: number; y: number; w: number; h: number; u: number; stroke?: string; children?: ReactNode }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g opacity={o} transform={`translate(0 ${(1 - o) * 10})`}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={STAGE_BG} stroke={stroke} strokeWidth={1.4} />
      {children}
    </g>
  );
}
