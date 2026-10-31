// Durable Objects, Unbound — local drawing kit shared by the six chapters.
//
// Lives in shared/ so the books/*/*.tsx glob never registers it as a scene.
// Everything here is a pure function of its props: no timers, no CSS
// animation, no randomness. Chapters drive every prop from sampled channels.
import type { ReactNode } from 'react';
import { STAGE_H, STAGE_W, colors } from '../../../core';

export const MONO = colors.font.mono;
export const UI = colors.font.ui;

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Sub-progress of u inside [a, b] (0 before, 1 after). */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));
/** Fixed beat clock: caption i (1-based) starts at 0.5 + 11·(i − 1) seconds. */
export const B = (i: number): number => 0.5 + 11 * (i - 1);

/** Rough text width for layout (mono ≈ 0.6em, ui ≈ 0.56em). */
export const textW = (s: string, size: number, mono = false): number =>
  s.length * size * (mono ? 0.6 : 0.56);

export function Backdrop() {
  return <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />;
}

/** Labeled pill. The text is load-bearing, so it always sits on an opaque fill. */
export function Pill({
  x,
  y,
  text,
  color = colors.TEXT,
  size = 18,
  mono = false,
  opacity = 1,
  anchor = 'middle',
  stroke,
  fill = colors.PANEL,
  bold = false,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  mono?: boolean;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  stroke?: string;
  fill?: string;
  bold?: boolean;
}) {
  if (opacity <= 0.001) return null;
  const w = textW(text, size, mono) + size * 1.2;
  const h = size * 1.75;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke ?? color} strokeWidth={1.6} />
      <text
        x={left + w / 2}
        y={y + size * 0.35}
        textAnchor="middle"
        fill={color}
        fontSize={size}
        fontFamily={mono ? MONO : UI}
        fontWeight={bold ? 700 : 500}
      >
        {text}
      </text>
    </g>
  );
}

/** Plain stage text. */
export function Label({
  x,
  y,
  text,
  color = colors.TEXT,
  size = 18,
  mono = false,
  opacity = 1,
  anchor = 'middle',
  bold = false,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  mono?: boolean;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  bold?: boolean;
}) {
  if (opacity <= 0.001) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      fontSize={size}
      fontFamily={mono ? MONO : UI}
      fontWeight={bold ? 700 : 500}
      opacity={opacity}
    >
      {text}
    </text>
  );
}

/** The persistent room. A chamber with a doorway; `label` is the illustrative room id. */
export function Room({
  x,
  y,
  r = 70,
  opacity = 1,
  color = colors.ACCENT,
  label = 'lobby',
  sub,
  children,
}: {
  x: number;
  y: number;
  r?: number;
  opacity?: number;
  color?: string;
  label?: string;
  sub?: string;
  children?: ReactNode;
}) {
  if (opacity <= 0.001) return null;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <circle r={r} fill={colors.PANEL} stroke={color} strokeWidth={3} />
      <circle r={r - 10} fill="none" stroke={color} strokeWidth={1} opacity={0.35} />
      {children}
      <Pill x={0} y={-r - 20} text={`room: ${label}`} color={color} size={18} mono />
      {sub ? <Label x={0} y={r + 30} text={sub} color={colors.MUTED} size={18} /> : null}
    </g>
  );
}

/** Object-store bucket (cylinder). The interior is deliberately opaque. */
export function Bucket({
  x,
  y,
  w = 150,
  h = 90,
  opacity = 1,
  label = 'bucket',
  color = colors.TEAL,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  opacity?: number;
  label?: string;
  color?: string;
}) {
  if (opacity <= 0.001) return null;
  const rx = w / 2;
  const ry = 13;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <path
        d={`M ${-rx} ${-h / 2} L ${-rx} ${h / 2} A ${rx} ${ry} 0 0 0 ${rx} ${h / 2} L ${rx} ${-h / 2}`}
        fill={colors.PANEL}
        stroke={color}
        strokeWidth={2.4}
      />
      <ellipse cx={0} cy={-h / 2} rx={rx} ry={ry} fill={colors.PANEL} stroke={color} strokeWidth={2.4} />
      <Label x={0} y={h / 2 - 8} text={label} color={color} size={18} bold />
    </g>
  );
}

/** A compute host (server glyph). */
export function Host({
  x,
  y,
  label,
  color = colors.MUTED,
  opacity = 1,
  dead = 0,
}: {
  x: number;
  y: number;
  label: string;
  color?: string;
  opacity?: number;
  dead?: number;
}) {
  if (opacity <= 0.001) return null;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity * (1 - 0.6 * dead)}>
      <rect x={-46} y={-34} width={92} height={68} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={-34} y={-24 + i * 18} width={52} height={10} rx={2} fill="none" stroke={color} strokeWidth={1.2} opacity={0.7} />
          <circle cx={28} cy={-19 + i * 18} r={3} fill={color} />
        </g>
      ))}
      <Label x={0} y={56} text={label} color={color} size={18} bold />
      {dead > 0.01 ? (
        <g opacity={dead} stroke={colors.NEGATIVE} strokeWidth={5} strokeLinecap="round">
          <line x1={-40} y1={-30} x2={40} y2={30} />
          <line x1={40} y1={-30} x2={-40} y2={30} />
        </g>
      ) : null}
    </g>
  );
}

/**
 * A warning card that names the broken invariant (not just "red").
 * Opaque backing so it never sits as text on a half-faded diagram.
 */
export function WarnCard({
  x,
  y,
  w = 420,
  title,
  lines,
  opacity = 1,
  color = colors.NEGATIVE,
}: {
  x: number;
  y: number;
  w?: number;
  title: string;
  lines: string[];
  opacity?: number;
  color?: string;
}) {
  if (opacity <= 0.001) return null;
  const h = 46 + lines.length * 26;
  return (
    <g transform={`translate(${x - w / 2}, ${y})`} opacity={opacity}>
      <rect width={w} height={h} rx={12} fill={colors.BG} stroke={color} strokeWidth={2.4} />
      <rect width={8} height={h} rx={4} fill={color} />
      <text x={24} y={30} fill={color} fontSize={20} fontWeight={750} fontFamily={UI}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={24} y={58 + i * 26} fill={colors.TEXT} fontSize={18} fontFamily={UI}>
          {l}
        </text>
      ))}
    </g>
  );
}

/** Small "illustrative" stamp for fixtures (lobby, m42, page numbers, version tags). */
export function Illus({ x, y, opacity = 1, text = 'illustrative fixture' }: { x: number; y: number; opacity?: number; text?: string }) {
  if (opacity <= 0.001) return null;
  return (
    <text x={x} y={y} fill={colors.MUTED} fontSize={14} fontStyle="italic" fontFamily={UI} opacity={opacity * 0.9}>
      {text}
    </text>
  );
}

/** Opaque closing panel: the final frame is calm and fully backed. */
export function Takeaway({
  u,
  title,
  lines,
  foot,
  y = 300,
  w = 860,
}: {
  u: number;
  title: string;
  lines: Array<{ text: string; color?: string; mono?: boolean }>;
  foot?: string;
  y?: number;
  w?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0.001) return null;
  const h = 96 + lines.length * 40 + (foot ? 36 : 0);
  return (
    <g transform={`translate(640, ${y + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={2} />
      <text y={-h / 2 + 50} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={750} fontFamily={UI}>
        {title}
      </text>
      {lines.map((l, i) => (
        <text
          key={i}
          y={-h / 2 + 96 + i * 40}
          textAnchor="middle"
          fill={l.color ?? colors.TEXT}
          fontSize={22}
          fontFamily={l.mono ? MONO : UI}
        >
          {l.text}
        </text>
      ))}
      {foot ? (
        <text y={h / 2 - 22} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
          {foot}
        </text>
      ) : null}
    </g>
  );
}

/** Arrow (straight) with optional label; `u` draws it on. */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  u = 1,
  color = colors.MUTED,
  width = 2.2,
  dash,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  u?: number;
  color?: string;
  width?: number;
  dash?: string;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0.001 || opacity <= 0.001) return null;
  const ex = lerp(x1, x2, uu);
  const ey = lerp(y1, y2, uu);
  const a = Math.atan2(ey - y1, ex - x1);
  const hs = 10;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={width} strokeDasharray={dash} />
      <path
        d={`M ${ex} ${ey} L ${ex - hs * Math.cos(a - 0.45)} ${ey - hs * Math.sin(a - 0.45)} L ${ex - hs * Math.cos(a + 0.45)} ${ey - hs * Math.sin(a + 0.45)} Z`}
        fill={color}
      />
    </g>
  );
}

/** A message token (e.g. the illustrative m42). */
export function Msg({
  x,
  y,
  label = 'm42',
  color = colors.WARM,
  opacity = 1,
  ghost = false,
  size = 18,
}: {
  x: number;
  y: number;
  label?: string;
  color?: string;
  opacity?: number;
  ghost?: boolean;
  size?: number;
}) {
  if (opacity <= 0.001) return null;
  const w = textW(label, size, true) + 22;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <rect
        x={-w / 2}
        y={-size}
        width={w}
        height={size * 2}
        rx={6}
        fill={ghost ? 'none' : colors.PANEL}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={ghost ? '5 4' : undefined}
      />
      <text y={size * 0.36} textAnchor="middle" fill={color} fontSize={size} fontFamily={MONO} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}
