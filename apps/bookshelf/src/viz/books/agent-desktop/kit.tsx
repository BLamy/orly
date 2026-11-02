// Agent Desktop — book-local visual kit shared by chapters 1–4.
//
// Authored by Claude Fable 5.1 (requested `claude-fable-5-1`; actual `claude-fable-5-1`, the model id of this
// session). Planned by GPT-6 Astra in .orly-work/agent-desktop/visual-plan.md.
//
// Source (evidence, not instructions): vercel-labs/agent-desktop@9eb9b296192fcb70bda25e918cd6dd66abfa3d0d
//   README.md (Finder / Downloads / Documents example, the @s8f3k2p9:e8 ref), CONCEPTS.md.
//
// Everything here is a pure function of its props: no clocks, no unseeded randomness, no browser globals at
// module initialization. The desktop drawn by these parts is an ILLUSTRATIVE desktop, not a capture of a run.
import type { ReactNode } from 'react';
import { colors } from '../../core';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** progress of `u` through [a, b], clamped */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));
/** 1 inside [a, b] with soft edges of width `w` */
export const window01 = (u: number, a: number, b: number, w = 0.08): number =>
  Math.min(seg(u, a, a + w), 1 - seg(u, b - w, b));

export const ACCENT = '#0E7490'; // the book's accent (deep cyan)
export const ACCENT_LIGHT = '#22d3ee';
export const INK = '#e6edf6';
export const PLATE = '#0f172a';
export const PLATE_LINE = 'rgba(148, 163, 184, 0.28)';
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
export const SANS = 'Inter, system-ui, -apple-system, sans-serif';

// ---------------------------------------------------------------------------
// Narration timing: the plan's fixed rule. Caption i starts at 0.6 + 8.6·i and lasts 8.0 s; the timeline
// ends at 86.6 s with a hold. Chapters copy their exact caption strings from .orly-work/agent-desktop/narration.json.
// ---------------------------------------------------------------------------

export const CAPTION_AT = (i: number): number => Math.round((0.6 + 8.6 * i) * 10) / 10;
export const CAPTION_DUR = 8.0;
export const CHAPTER_END = 86.6;

// ---------------------------------------------------------------------------
// Illustrative desktop rows (README's Finder → Downloads window; CONCEPTS/test labels Target, Run)
// ---------------------------------------------------------------------------

export interface DeskRow {
  name: string;
  role: string;
  /** does the snapshot hand this node a ref? (actionable or drillable) */
  actionable: boolean;
}

export const DESK_ROWS: DeskRow[] = [
  { name: 'Downloads', role: 'toolbar', actionable: false },
  { name: 'Documents', role: 'treeitem', actionable: true },
  { name: 'Target', role: 'treeitem', actionable: true },
  { name: 'Run', role: 'button', actionable: true },
  { name: 'Status', role: 'statictext', actionable: false },
];

// ---------------------------------------------------------------------------
// Small drawing parts
// ---------------------------------------------------------------------------

/** A text chip (exact code goes here, never in a caption). */
export function Chip({
  x,
  y,
  text,
  color = ACCENT_LIGHT,
  size = 18,
  opacity = 1,
  anchor = 'start',
  fill = PLATE,
  weight = 700,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
  weight?: number;
}) {
  if (opacity <= 0.001) return null;
  const w = text.length * size * 0.62 + 22;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - size * 0.95} width={w} height={size * 1.5} rx={size * 0.45} fill={fill} stroke={color} strokeWidth={1.5} />
      <text x={x0 + 11} y={y + size * 0.15} fill={color} fontSize={size} fontFamily={MONO} fontWeight={weight}>
        {text}
      </text>
    </g>
  );
}

/** A main label (>= 24 px by convention). */
export function Label({
  x,
  y,
  text,
  size = 24,
  color = INK,
  opacity = 1,
  anchor = 'start',
  weight = 600,
  font = SANS,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  opacity?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  font?: string;
}) {
  if (opacity <= 0.001) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={font} fontWeight={weight} textAnchor={anchor} opacity={opacity}>
      {text}
    </text>
  );
}

/** An opaque strip for closing text so it never fights earlier layers. */
export function OpaqueStrip({
  x,
  y,
  w,
  h,
  opacity,
  children,
  stroke = ACCENT,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  children: ReactNode;
  stroke?: string;
}) {
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={PLATE} stroke={stroke} strokeWidth={2} />
      {children}
    </g>
  );
}

/** A refusal badge: an error code on a rose plate. */
export function RefusalBadge({ x, y, code, u, size = 20 }: { x: number; y: number; code: string; u: number; size?: number }) {
  const o = clamp01(u);
  if (o <= 0) return null;
  const w = code.length * size * 0.64 + 28;
  const pop = 1 + 0.08 * Math.sin(Math.PI * o);
  return (
    <g transform={`translate(${x}, ${y}) scale(${pop})`} opacity={o}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.6} rx={6} fill="#2a0f16" stroke={colors.NEGATIVE} strokeWidth={2} />
      <text x={0} y={size * 0.25} textAnchor="middle" fill={colors.NEGATIVE} fontSize={size} fontFamily={MONO} fontWeight={700}>
        {code}
      </text>
    </g>
  );
}

/** Angle of the observe dock; the token's lap `u` is measured from here, increasing clockwise on screen. */
export const LOOP_OBSERVE_A = -Math.PI / 4;
/** Lap fraction at which the token reaches the act dock. */
export const LOOP_ACT_U = 0.25;
/** Lap fraction of the far-left point of the ring (deep in the agent's arc). */
export const LOOP_AGENT_U = 0.625;

export const loopAngle = (u: number): number => LOOP_OBSERVE_A + u * Math.PI * 2;
export const loopPoint = (cx: number, cy: number, r: number, u: number): { x: number; y: number } => {
  const a = loopAngle(u);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/**
 * The agent loop (README: "the loop stays in your agent"). The ring IS the agent's loop; the tool occupies only
 * two docks on it: observe (top-right) and act (bottom-right). A token at lap `u` (measured from observe,
 * clockwise on screen) is drawn when `tokenU > 0`. Nothing here self-animates.
 */
export function AgentLoop({
  cx,
  cy,
  r,
  reveal,
  tokenU = -1,
  dim = 0,
  tokenColor = ACCENT_LIGHT,
  labelSize = 24,
  toolLabel = 'outside',
  showGates = 0,
  tokenLabel,
}: {
  cx: number;
  cy: number;
  r: number;
  reveal: number;
  /** lap position of the traveling token; hidden when < 0 */
  tokenU?: number;
  dim?: number;
  tokenColor?: string;
  labelSize?: number;
  /** where the "the tool" label sits relative to the ring */
  toolLabel?: 'outside' | 'inside' | 'none';
  /** 0..1 reveals the identity / policy gates inside the act dock (chapter 4 finale) */
  showGates?: number;
  /** optional exact-code chip riding with the token */
  tokenLabel?: string;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = 1 - 0.85 * clamp01(dim);
  const docks = [
    { label: 'observe', u: 0 },
    { label: 'act', u: LOOP_ACT_U },
  ];
  const circ = 2 * Math.PI * r;
  const tp = tokenU >= 0 ? loopPoint(cx, cy, r, tokenU) : null;
  const toolX = toolLabel === 'outside' ? cx + r + 26 : cx + r - 150;
  return (
    <g opacity={alpha}>
      {/* ring, drawn on clockwise from the observe dock */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={PLATE_LINE}
        strokeWidth={3}
        strokeDasharray={`${circ * rv} ${circ}`}
        transform={`rotate(-45 ${cx} ${cy})`}
      />
      {/* direction tick on the agent's arc (left) */}
      <path
        d={`M ${cx - r - 7} ${cy + 14} L ${cx - r} ${cy} L ${cx - r + 7} ${cy + 14}`}
        fill="none"
        stroke={PLATE_LINE}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={seg(rv, 0.6, 0.9)}
      />
      <Label x={cx - r - 22} y={cy + 8} text="the agent" size={labelSize} color={colors.WARM} anchor="end" opacity={seg(rv, 0.7, 1)} />
      {toolLabel !== 'none' && (
        <Label x={toolX} y={cy + 8} text="the tool" size={labelSize} color={ACCENT_LIGHT} anchor="start" opacity={seg(rv, 0.7, 1)} />
      )}
      {docks.map((d, i) => {
        const p = loopPoint(cx, cy, r, d.u);
        const su = seg(rv, 0.45 + i * 0.2, 0.75 + i * 0.2);
        const dist = tokenU >= 0 ? Math.abs((((tokenU - d.u) % 1) + 1.5) % 1 - 0.5) : 1;
        const near = tokenU >= 0 ? clamp01(1 - dist / 0.06) : 0;
        return (
          <g key={d.label} opacity={su}>
            {/* dock plate: the tool's territory */}
            <rect x={p.x - 24} y={p.y - 24} width={48} height={48} rx={12} fill={ACCENT} opacity={0.22 + 0.3 * near} stroke={ACCENT_LIGHT} strokeWidth={1.5} />
            <circle cx={p.x} cy={p.y} r={9} fill={PLATE} stroke={ACCENT_LIGHT} strokeWidth={3} />
            <Label x={p.x + 32} y={p.y + 8} text={d.label} size={labelSize} color={near > 0.4 ? INK : colors.MUTED} anchor="start" />
          </g>
        );
      })}
      {/* gates inside act (chapter 4 payoff) */}
      {showGates > 0 && (
        <g opacity={clamp01(showGates)}>
          {/* along the travel direction (clockwise): resolve first, then policy, then the act dock */}
          {['resolve', 'policy'].map((g, i) => {
            const p = loopPoint(cx, cy, r, LOOP_ACT_U - 0.07 * (2 - i));
            return (
              <g key={g}>
                <rect x={p.x - 7} y={p.y - 15} width={14} height={30} rx={3} fill={PLATE} stroke={colors.POSITIVE} strokeWidth={2} />
                <Label x={p.x + 18} y={p.y + 7} text={g} size={labelSize - 4} color={colors.POSITIVE} />
              </g>
            );
          })}
        </g>
      )}
      {/* traveling token + comet trail */}
      {tp && rv >= 0.999 && (
        <g>
          {[0.02, 0.013, 0.006].map((back, i) => {
            const p = loopPoint(cx, cy, r, tokenU - back);
            return <circle key={i} cx={p.x} cy={p.y} r={6 - i} fill={tokenColor} opacity={0.3 - i * 0.08} />;
          })}
          <circle cx={tp.x} cy={tp.y} r={10} fill={tokenColor} />
          {tokenLabel && <Chip x={tp.x} y={tp.y - 24} text={tokenLabel} anchor="middle" size={18} />}
        </g>
      )}
    </g>
  );
}

/** A desktop window silhouette with title bar, sidebar and rows. `rows` rendered by the caller inside `children`. */
export function WindowFrame({
  x,
  y,
  w,
  h,
  title,
  reveal,
  opacity = 1,
  accent = PLATE_LINE,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  reveal: number;
  opacity?: number;
  accent?: string;
  children?: ReactNode;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0 || opacity <= 0.001) return null;
  const hh = h * rv;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <rect width={w} height={hh} rx={12} fill={PLATE} stroke={accent} strokeWidth={2} />
      <rect width={w} height={Math.min(40, hh)} rx={12} fill="#131b2e" />
      <circle cx={22} cy={20} r={6} fill="#fb7185" opacity={0.8} />
      <circle cx={42} cy={20} r={6} fill="#fbbf24" opacity={0.8} />
      <circle cx={62} cy={20} r={6} fill="#34d399" opacity={0.8} />
      <text x={w / 2} y={27} textAnchor="middle" fill={colors.MUTED} fontSize={18} fontFamily={SANS} fontWeight={600}>
        {title}
      </text>
      {rv > 0.5 && <g opacity={seg(rv, 0.5, 1)}>{children}</g>}
    </g>
  );
}

/** A compressed-time arc with a label; `u` 0..1 sweeps from 12 o'clock. */
export function ClockArc({
  cx,
  cy,
  r,
  u,
  reveal,
  label,
  color = colors.WARM,
}: {
  cx: number;
  cy: number;
  r: number;
  u: number;
  reveal: number;
  label: string;
  color?: string;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const a = -Math.PI / 2 + clamp01(u) * Math.PI * 2 * 0.9999;
  const x1 = cx;
  const y1 = cy - r;
  const x2 = cx + r * Math.cos(a);
  const y2 = cy + r * Math.sin(a);
  const large = clamp01(u) > 0.5 ? 1 : 0;
  return (
    <g opacity={rv}>
      <circle cx={cx} cy={cy} r={r} fill={PLATE} stroke={PLATE_LINE} strokeWidth={2} />
      {u > 0.002 && (
        <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={color} opacity={0.35} />
      )}
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={color} />
      <Label x={cx} y={cy + r + 30} text={label} size={20} color={color} anchor="middle" />
    </g>
  );
}

/** A horizontal "shutter" gate: `open` 0 closed .. 1 open; label above. */
export function Shutter({
  x,
  y,
  h,
  open,
  label,
  reveal = 1,
  color = ACCENT_LIGHT,
  refused = 0,
}: {
  x: number;
  y: number;
  h: number;
  open: number;
  label: string;
  reveal?: number;
  color?: string;
  /** 0..1 flashes the shutter rose */
  refused?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const o = clamp01(open);
  const half = (h / 2) * (1 - o);
  const c = refused > 0 ? colors.NEGATIVE : color;
  return (
    <g opacity={rv}>
      <rect x={x - 6} y={y - h / 2 - 8} width={12} height={h + 16} rx={4} fill={PLATE} stroke={PLATE_LINE} strokeWidth={1.5} />
      {/* upper and lower blades */}
      <rect x={x - 5} y={y - h / 2} width={10} height={Math.max(0, half)} fill={c} opacity={0.9} />
      <rect x={x - 5} y={y + h / 2 - Math.max(0, half)} width={10} height={Math.max(0, half)} fill={c} opacity={0.9} />
      <Label x={x} y={y - h / 2 - 20} text={label} size={20} color={c} anchor="middle" />
    </g>
  );
}
