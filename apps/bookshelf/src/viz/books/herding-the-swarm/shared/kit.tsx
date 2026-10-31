// Herding the Swarm — shared stage kit for the four chapter scenes.
//
// Lives one directory below the chapters so the books/*/*.tsx glob never registers it as a scene. Everything here is
// a pure function of its props: chapters sample their channels and hand the values in.
import { colors } from '../../../core';

const font = colors.font;

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** progress of `u` across [a, b], clamped */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));
export type V2 = [number, number];
export const lerp2 = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

// ---------------------------------------------------------------------------
// Palette — the book accent is #0f766e (deep teal); on the dark stage the agents use a brighter teal.
// ---------------------------------------------------------------------------
export const AGENT = '#2dd4bf';
export const AGENT_DIM = '#115e59';
export const WALL = '#5eead4';
export const BOARD = colors.WARM;
export const POISON = colors.SECONDARY;
export const DANGER = colors.NEGATIVE;
export const OK = colors.POSITIVE;
export const TEXT = '#e6edf6';
export const MUTED = colors.MUTED;
export const FAINT = '#39415a';
export const PANEL = '#0d1321';
export const UI = font.ui;
export const MONO = font.mono;

// ---------------------------------------------------------------------------
// Narration timing — spoken-line pace max(5.4, words × 0.4 + 1.1) s with a 0.7 s gap (the Already Clean recipe).
// ---------------------------------------------------------------------------
export function timing(captions: string[], start = 0.5, gap = 0.7) {
  const DUR = captions.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
  const T: number[] = [];
  let t = start;
  for (const d of DUR) {
    T.push(t);
    t += d + gap;
  }
  const END = T[T.length - 1] + DUR[DUR.length - 1] + 0.8;
  return { T, DUR, END };
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** The habitat: a rounded enclosure that draws on, with an optional wall weight and a small plaque label. */
export function Habitat({ x, y, w, h, draw, weight = 1.6, label, opacity = 1, color = WALL, gap }: {
  x: number; y: number; w: number; h: number; draw: number; weight?: number; label?: string; opacity?: number; color?: string;
  /** a breach in the right wall: [y0, y1] in stage px, scaled open by `gap[2]` 0..1 */
  gap?: [number, number, number];
}) {
  if (opacity <= 0.005 || draw <= 0.001) return null;
  const r = 22;
  const d = `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
  const open = gap ? clamp01(gap[2]) : 0;
  return (
    <g opacity={opacity}>
      <path d={d} fill="rgba(45,212,191,0.035)" stroke={color} strokeWidth={weight} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinejoin="round" />
      {gap && open > 0.01 && (
        <rect x={x + w - weight * 2 - 1} y={lerp((gap[0] + gap[1]) / 2, gap[0], open)} width={weight * 4 + 2} height={lerp(0, gap[1] - gap[0], open)} fill={PANEL} />
      )}
      {label && draw > 0.6 && (
        <text x={x + 18} y={y - 10} fill={color} fontFamily={MONO} fontSize={13} letterSpacing={1.2} opacity={seg(draw, 0.6, 1)}>
          {label}
        </text>
      )}
    </g>
  );
}

/** One agent: a dot, an optional fuel ring that drains clockwise, an optional halo (a coordinator) and a death fade. */
export function Agent({ x, y, r = 7, color = AGENT, opacity = 1, fuel, halo = 0, ring = MUTED }: {
  x: number; y: number; r?: number; color?: string; opacity?: number; fuel?: number; halo?: number; ring?: string;
}) {
  if (opacity <= 0.005) return null;
  const f = fuel === undefined ? undefined : clamp01(fuel);
  const rr = r + 4.5;
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      {halo > 0.01 && <circle r={r + 10 * halo} fill="none" stroke={BOARD} strokeWidth={1.6} opacity={0.85 * halo} />}
      {f !== undefined && (
        <>
          <circle r={rr} fill="none" stroke={FAINT} strokeWidth={2} />
          <circle r={rr} fill="none" stroke={f < 0.25 ? DANGER : ring} strokeWidth={2} pathLength={1} strokeDasharray={`${f} 1`} transform="rotate(-90)" />
        </>
      )}
      <circle r={r} fill={color} />
    </g>
  );
}

/** An opaque backdrop panel for closing text (the clean-ending rule). */
export function Panel({ x, y, w, h, opacity, stroke = '#1e293b' }: { x: number; y: number; w: number; h: number; opacity: number; stroke?: string }) {
  if (opacity <= 0.005) return null;
  return <rect x={x} y={y} width={w} height={h} rx={14} fill={PANEL} stroke={stroke} strokeWidth={1.2} opacity={opacity} />;
}

export function Label({ x, y, text, opacity = 1, size = 15, color = TEXT, anchor = 'middle', mono = false, weight = 500, italic = false }: {
  x: number; y: number; text: string; opacity?: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; italic?: boolean;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontFamily={mono ? MONO : UI} fontSize={size} fontWeight={weight} fontStyle={italic ? 'italic' : undefined} opacity={opacity}>
      {text}
    </text>
  );
}

/** The chapter's title chip, top-left, outside the camera. */
export function TitleChip({ kicker, title, opacity }: { kicker: string; title: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <text x={48} y={52} fill={WALL} fontFamily={MONO} fontSize={12} letterSpacing={2}>{kicker}</text>
      <text x={48} y={78} fill={TEXT} fontFamily={UI} fontSize={22} fontWeight={600}>{title}</text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The six dials — chapter 1 introduces them, chapter 2 marks what failed, chapter 4 closes the loop.
// ---------------------------------------------------------------------------
export const DIAL_NAMES = ['reproduction', 'density', 'food', 'lifespan', 'selection', 'habitat'] as const;
export const DIAL_HINTS = ['who may spawn', 'how many at once', 'what they spend', 'how long they live', 'whose work is kept', 'where they can go'] as const;
export type DialState = 'off' | 'set' | 'open' | 'wrong';

/** One dial: a ring with a needle; `set` draws a closed teal arc, `open` a red full sweep, `wrong` an amber reversed arc. */
export function Dial({ x, y, name, hint, state, u, emph = 1, note }: {
  x: number; y: number; name: string; hint: string; state: DialState; u: number; emph?: number; note?: string;
}) {
  if (u <= 0.005) return null;
  const R = 34;
  const col = state === 'set' ? AGENT : state === 'open' ? DANGER : state === 'wrong' ? BOARD : MUTED;
  const sweep = state === 'set' ? 0.32 : state === 'open' ? 0.92 : state === 'wrong' ? 0.62 : 0;
  const ang = -225 + 270 * sweep;
  const a = (ang * Math.PI) / 180;
  return (
    <g opacity={u * emph} transform={`translate(${x},${y}) scale(${0.85 + 0.15 * u})`}>
      <circle r={R} fill={PANEL} stroke={FAINT} strokeWidth={2} />
      <circle r={R - 6} fill="none" stroke={col} strokeWidth={4} pathLength={1} strokeDasharray={`${0.75 * sweep} 1`} transform="rotate(135)" strokeLinecap="round" opacity={state === 'off' ? 0 : 0.9} />
      <line x1={0} y1={0} x2={Math.cos(a) * (R - 12)} y2={Math.sin(a) * (R - 12)} stroke={TEXT} strokeWidth={2.4} strokeLinecap="round" />
      <circle r={3.5} fill={TEXT} />
      <text y={R + 22} textAnchor="middle" fill={TEXT} fontFamily={UI} fontSize={15} fontWeight={600}>{name}</text>
      <text y={R + 40} textAnchor="middle" fill={MUTED} fontFamily={UI} fontSize={12}>{note ?? hint}</text>
    </g>
  );
}

/** The six dials in a row, centred on `cx`. */
export function DialRow({ cx, y, u, states, emph, notes, gapX = 168 }: {
  cx: number; y: number; u: number; states: DialState[]; emph?: number[]; notes?: (string | undefined)[]; gapX?: number;
}) {
  if (u <= 0.005) return null;
  return (
    <g>
      {DIAL_NAMES.map((n, i) => (
        <Dial key={n} x={cx + (i - 2.5) * gapX} y={y} name={n} hint={DIAL_HINTS[i]} state={states[i]} u={clamp01(u * 6 - i * 0.9)} emph={emph?.[i] ?? 1} note={notes?.[i]} />
      ))}
    </g>
  );
}
