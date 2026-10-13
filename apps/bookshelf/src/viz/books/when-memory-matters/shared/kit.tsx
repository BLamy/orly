// Shared sampled-clock helpers for "When Memory Matters".
//
// Everything here is a pure function of values handed in by the scene: the
// beat cadence fixed by visual-plan.md (captions at 0.3, 8.3, … 72.3 s, eight
// seconds each so the windows are continuous, eighty seconds total), one `beat` channel that drives label
// windows, and a few small SVG renderers. No clocks, no state.
import type { ReactNode } from 'react';
import { Timeline, colors, ease } from '../../../core';
import type { ChannelRef } from '../../../core';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Sub-progress of u across [a, b]. */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));

/** Palette roles from the plan: thread/probe, distant, claim, verified, removed. */
export const INK = {
  thread: '#7dd3fc',
  distant: colors.SECONDARY,
  claim: colors.WARM,
  ok: colors.POSITIVE,
  bad: colors.NEGATIVE,
  text: colors.TEXT,
  muted: colors.MUTED,
  faint: colors.ink.faint,
  panel: colors.PANEL,
  bg: colors.BG,
} as const;

export const BEAT_EVERY = 8;
export const CAPTION_DUR = 8;
export const CHAPTER_DUR = 80;
/** Authored start of beat i (0-based). */
export const beatAt = (i: number): number => 0.3 + BEAT_EVERY * i;

/**
 * Schedule the chapter's ten narration captions on the planned cadence and
 * return the `beat` channel: it eases from i−1 to i over the first 0.6 s of
 * beat i, so `on`/`win` below give every label a sampled, reversible fade.
 */
export function narrate(tl: Timeline, lines: readonly string[]): ChannelRef<number> {
  const beat = tl.channel('beat', -1);
  lines.forEach((text, i) => {
    // the last window stops at the chapter end, so the 0.3 s lead-in never lengthens the chapter
    tl.caption({ at: beatAt(i), dur: Math.min(CAPTION_DUR, CHAPTER_DUR - beatAt(i)), text });
    tl.tween(beat, i, { at: beatAt(i), dur: 0.6, ease: ease.enter });
  });
  tl.hold(CHAPTER_DUR - 1, 1);
  return beat;
}

/** 0→1 as beat i arrives (stays 1 afterwards). */
export const on = (b: number, i: number): number => clamp01(b - (i - 1));
/** 1 during beats i…j, fading in at i and out as j+1 arrives. */
export const win = (b: number, i: number, j: number): number => on(b, i) * (1 - clamp01(b - j));
/** Like `win`, but settles to `rest` afterwards instead of vanishing. */
export const winRest = (b: number, i: number, j: number, rest: number): number =>
  on(b, i) * lerp(1, rest, clamp01(b - j));

export function Txt({
  x,
  y,
  children,
  size = 13,
  fill = INK.text,
  opacity = 1,
  anchor = 'start',
  mono = false,
  weight = 400,
  spacing,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  fill?: string;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  mono?: boolean;
  weight?: number;
  spacing?: number;
}) {
  if (opacity <= 0.003) return null;
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      opacity={opacity}
      textAnchor={anchor}
      fontWeight={weight}
      letterSpacing={spacing}
      fontFamily={mono ? colors.font.mono : colors.font.ui}
    >
      {children}
    </text>
  );
}

/** Width estimate for mono labels (used only to size chip outlines). */
export const monoW = (text: string, size: number): number => text.length * size * 0.602;

/** A mono identifier chip. `hollow` = metadata / recorded judgment. */
export function Chip({
  x,
  y,
  text,
  color = INK.thread,
  opacity = 1,
  size = 12,
  anchor = 'middle',
  hollow = true,
  dashed = false,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  opacity?: number;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  hollow?: boolean;
  dashed?: boolean;
}) {
  if (opacity <= 0.003) return null;
  const w = monoW(text, size) + 16;
  const h = size + 12;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect
        x={left}
        y={y - h / 2}
        width={w}
        height={h}
        rx={5}
        fill={hollow ? INK.panel : color}
        fillOpacity={hollow ? 0.92 : 0.22}
        stroke={color}
        strokeWidth={1.2}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      <text
        x={left + w / 2}
        y={y + size * 0.36}
        fontSize={size}
        textAnchor="middle"
        fill={color}
        fontFamily={colors.font.mono}
      >
        {text}
      </text>
    </g>
  );
}

/** Screen-fixed chapter heading at y = 54 (drawn outside the Camera). */
export function Heading({ n, title, opacity = 1 }: { n: number; title: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <Txt x={70} y={54} size={12} fill={INK.muted} spacing={1.6} weight={600}>
        {`CHAPTER ${n}`}
      </Txt>
      <Txt x={164} y={54} size={16} weight={600}>
        {title}
      </Txt>
    </g>
  );
}

/**
 * Screen-fixed one-line source note; one note per beat, crossfaded. It sits at
 * y = 578 so a caption that wraps to two lines never runs through it.
 */
export function SourceNote({ beat, notes }: { beat: number; notes: readonly string[] }) {
  return (
    <g>
      {notes.map((note, i) => (
        <Txt
          key={i}
          x={1210}
          y={578}
          size={11}
          anchor="end"
          fill={INK.muted}
          opacity={0.85 * clamp01(1 - Math.abs(beat - i) * 1.6)}
        >
          {`Source: ${note}`}
        </Txt>
      ))}
    </g>
  );
}

/** Opaque dark field that backs closing text. */
export function Field({
  x,
  y,
  w,
  h,
  opacity,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  children?: ReactNode;
}) {
  if (opacity <= 0.003) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.bg} />
      <rect x={x} y={y} width={w} height={h} rx={12} fill={INK.panel} stroke={colors.GRID} />
      {children}
    </g>
  );
}

/** A straight tether that draws on with u. */
export function Tether({
  x1,
  y1,
  x2,
  y2,
  u = 1,
  color = INK.muted,
  opacity = 1,
  dashed = false,
  width = 1.2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  u?: number;
  color?: string;
  opacity?: number;
  dashed?: boolean;
  width?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0.003) return null;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={lerp(x1, x2, uu)}
      y2={lerp(y1, y2, uu)}
      stroke={color}
      strokeWidth={width}
      opacity={opacity}
      strokeDasharray={dashed ? '4 4' : undefined}
      strokeLinecap="round"
    />
  );
}
