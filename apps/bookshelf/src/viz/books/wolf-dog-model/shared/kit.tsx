// Wolf, Dog, Model — book-local visual kit shared by chapters 1–4.
//
// Authored by Claude Opus 5.5 (requested `claude-opus-5-5`; actual `claude-opus-5-5`). Planned by Claude Opus 5.5 by
// user override of the Astra-planning default (.orly-work/visual-plan.md).
//
// Two persistent objects live here:
//   - Canid: one parametric side-view silhouette (ear droop, tail curl, snout length, spots) that morphs from wolf to
//     tame fox to dog. Closed-form paths, no image assets. A drawing, never a measured anatomy.
//   - The trait cloud: seeded points in a 2-D trait space. Chapters 1 and 3 move its centre and spread under selection.
//     The cloud is schematic: positions are an illustration of a population, not data.
// Everything is a pure function of its props: no clocks, no unseeded randomness.
import type { ReactNode } from 'react';
import { colors, gaussian, mulberry32 } from '../../../core';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** progress of `u` through [a, b], clamped */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));
export type V2 = [number, number];
const lp = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const f = (n: number) => n.toFixed(2);
const pt = (p: V2) => `${f(p[0])},${f(p[1])}`;

export const ACCENT = '#7c3aed'; // the book's accent (violet)
export const WOLF = '#94a3b8';
export const FOX = '#f59e0b';
export const DOG = '#d6a46c';
export const HUMAN = '#e2e8f0';
export const PLATE = '#0f172a';

// ---------------------------------------------------------------------------
// Narration timing: every chapter uses the same pacing rule
// ---------------------------------------------------------------------------

/** Spoken-line pace: max(5.4, words × 0.4 + 1.1) s, 0.7 s between captions. */
export function timing(captions: string[]) {
  const DUR = captions.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
  const GAP = 0.7;
  const T: number[] = [];
  let t = 0.5;
  for (const d of DUR) {
    T.push(t);
    t += d + GAP;
  }
  const END = T[T.length - 1] + DUR[DUR.length - 1] + 0.6;
  return { T, DUR, END };
}

// ---------------------------------------------------------------------------
// Canid — a side view facing right, about 200 px long at s = 1, origin at the body centre
// ---------------------------------------------------------------------------

export interface CanidPose {
  ear: number; // 0 erect … 1 floppy
  tail: number; // 0 hanging (wolf) … 1 curled over the back
  snout: number; // 0 long … 1 short and round
  spots: number; // 0 solid … 1 piebald
}
export const WOLF_POSE: CanidPose = { ear: 0, tail: 0, snout: 0, spots: 0 };
export const DOG_POSE: CanidPose = { ear: 0.85, tail: 0.9, snout: 0.7, spots: 0.8 };

const SPOT_SEEDS: { x: number; y: number; rx: number; ry: number; k: number }[] = (() => {
  const r = mulberry32(31337);
  return Array.from({ length: 6 }, (_, k) => ({
    x: -46 + r() * 80,
    y: -14 + r() * 22,
    rx: 9 + r() * 10,
    ry: 6 + r() * 6,
    k: k / 6,
  }));
})();

export function Canid({
  x,
  y,
  s = 1,
  pose,
  color,
  opacity = 1,
  flip = false,
  outline,
}: {
  x: number;
  y: number;
  s?: number;
  pose: CanidPose;
  color: string;
  opacity?: number;
  flip?: boolean;
  outline?: string;
}) {
  if (opacity <= 0.005) return null;
  const { ear, tail, snout, spots } = pose;
  // Proportions that read as a canid, not a horse: a deep chest, a short neck that carries the head about level with
  // the back, short sturdy legs with paws, and a muzzle that is long and narrow (wolf) or short and blunt (dog).
  const head: V2 = [86, -30];
  const hr = lerp(20, 23, snout);
  const muzzleLen = lerp(36, 16, snout);
  const mTop = lerp(-38, -40, snout);
  const mBot = lerp(-16, -12, snout);
  const tipX = head[0] + 12 + muzzleLen;
  const snoutTip: V2 = [tipX, lerp(-26, -27, snout)];
  const snoutD = `M${pt([head[0] + 4, mTop - 4])} L${pt([tipX - 6, lerp(-32, -36, snout)])} Q${pt([tipX + lerp(2, 6, snout), lerp(-30, -32, snout)])} ${pt([tipX, lerp(-22, -20, snout)])} Q${pt([tipX - 4, mBot])} ${pt([tipX - 12, mBot])} L${pt([head[0] + 2, mBot + 2])} Z`;
  // ears: bases on the crown; tips swing from pricked up to hanging beside the cheek
  const ear1D = (() => {
    const A: V2 = [72, -44];
    const B: V2 = [88, -50];
    const tip = lp([74, -74], [70, -10], ear);
    const ctl = lp([88, -64], [84, -18], ear);
    return `M${pt(A)} L${pt(tip)} Q${pt(ctl)} ${pt(B)} Z`;
  })();
  const ear0D = (() => {
    const A: V2 = [64, -40];
    const B: V2 = [76, -46];
    const tip = lp([62, -68], [58, -12], ear);
    return `M${pt(A)} L${pt(tip)} L${pt(B)} Z`;
  })();
  // tail: a bushy brush from the rump; hanging low (wolf) → curled up over the back (dog)
  const t0: V2 = [-64, -12];
  const c1 = lp([-90, -4], [-98, -40], tail);
  const c2 = lp([-100, 22], [-86, -72], tail);
  const t1 = lp([-98, 40], [-52, -56], tail);
  const tailD = `M${pt(t0)} C${pt(c1)} ${pt(c2)} ${pt(t1)}`;
  // short legs: hind legs bend at the hock, forelegs straight; every leg ends in a paw
  const legs: V2[][] = [
    [[-50, 14], [-58, 32], [-52, 48]],
    [[-34, 18], [-40, 34], [-34, 48]],
    [[42, 20], [42, 48]],
    [[58, 18], [60, 48]],
  ];
  const stroke = outline ?? 'none';
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} opacity={opacity}>
      <path d={ear0D} fill={color} opacity={0.72} />
      <path d={tailD} fill="none" stroke={color} strokeWidth={lerp(22, 15, tail)} strokeLinecap="round" />
      {legs.map((l, i) => {
        const end = l[l.length - 1];
        const back = i % 2 === 1;
        return (
          <g key={i} opacity={back ? 0.78 : 1}>
            <polyline points={l.map(pt).join(' ')} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={end[0] + 4} cy={end[1] + 3} rx={10} ry={5} fill={color} />
          </g>
        );
      })}
      {/* body: a long barrel with a deep chest and a slight tuck at the belly */}
      <path d="M-70,-6 Q-66,-30 -30,-30 L40,-30 Q74,-30 76,0 Q76,26 52,32 Q20,30 0,22 Q-30,28 -54,24 Q-74,16 -70,-6 Z" fill={color} stroke={stroke} strokeWidth={1.5} />
      {/* short neck: the head rides about level with the back */}
      <path d={`M48,-28 Q60,-50 ${head[0] - 4},-48 L${head[0] + 8},-14 Q70,6 56,10 Z`} fill={color} />
      <circle cx={head[0]} cy={head[1]} r={hr} fill={color} />
      <path d={snoutD} fill={color} />
      <path d={ear1D} fill={color} stroke={PLATE} strokeOpacity={0.45 * ear} strokeWidth={1.4} />
      {spots > 0.01 &&
        SPOT_SEEDS.map((sp, i) => {
          const u = clamp01((spots - sp.k) * 3);
          return u > 0.01 ? <ellipse key={i} cx={sp.x} cy={sp.y} rx={sp.rx * u} ry={sp.ry * u} fill="#f8fafc" opacity={0.85} /> : null;
        })}
      {spots > 0.3 && <path d={`M${head[0] + 4},-50 Q${head[0] + 12},-38 ${head[0] + 10},-24`} stroke="#f8fafc" strokeWidth={6 * clamp01((spots - 0.3) * 2)} fill="none" strokeLinecap="round" opacity={0.85} />}
      {/* eye, mouth line, nose */}
      <circle cx={head[0] + 8} cy={-36} r={2.8} fill={PLATE} />
      <path d={`M${head[0] + 10},${mBot - 3} L${tipX - 8},${mBot - 4}`} stroke={PLATE} strokeOpacity={0.4} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={snoutTip[0] - 1} cy={snoutTip[1] - 2} r={4} fill={PLATE} />
    </g>
  );
}

export const mixPose = (a: CanidPose, b: CanidPose, u: number): CanidPose => ({
  ear: lerp(a.ear, b.ear, u),
  tail: lerp(a.tail, b.tail, u),
  snout: lerp(a.snout, b.snout, u),
  spots: lerp(a.spots, b.spots, u),
});

// ---------------------------------------------------------------------------
// The trait cloud — seeded standard-normal offsets; the caller maps them to the stage
// ---------------------------------------------------------------------------

export interface CloudPoint {
  ox: number;
  oy: number;
  hue: number; // 0..1, a stable per-point identity (used for "voices" in chapter 3)
  rank: number; // 0..1, a stable per-point order (used for staggered culls)
}
export function makeCloud(n: number, seed: number): CloudPoint[] {
  const r = mulberry32(seed);
  const g = gaussian(r);
  return Array.from({ length: n }, (_, i) => ({
    ox: Math.max(-2.4, Math.min(2.4, g())),
    oy: Math.max(-2.4, Math.min(2.4, g())),
    hue: r(),
    rank: (i * 0.618034) % 1,
  }));
}

// ---------------------------------------------------------------------------
// Axes, labels, cards, chips
// ---------------------------------------------------------------------------

export function Arrow({ a, b, u = 1, color, width = 2.4, head = 11, opacity = 1, dash }: { a: V2; b: V2; u?: number; color: string; width?: number; head?: number; opacity?: number; dash?: string }) {
  if (u <= 0.005 || opacity <= 0.005) return null;
  const e = lp(a, b, u);
  const ang = Math.atan2(e[1] - a[1], e[0] - a[0]);
  const h1: V2 = [e[0] - head * Math.cos(ang - 0.42), e[1] - head * Math.sin(ang - 0.42)];
  const h2: V2 = [e[0] - head * Math.cos(ang + 0.42), e[1] - head * Math.sin(ang + 0.42)];
  return (
    <g opacity={opacity}>
      <line x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} />
      {u > 0.6 && <polygon points={`${pt(e)} ${pt(h1)} ${pt(h2)}`} fill={color} opacity={clamp01((u - 0.6) * 2.5)} />}
    </g>
  );
}

export function Label({ x, y, text, size = 18, color = colors.TEXT, u = 1, anchor = 'start', weight = 500, italic = false, mono = false }: { x: number; y: number; text: string; size?: number; color?: string; u?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; italic?: boolean; mono?: boolean }) {
  if (u <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={color} opacity={u} textAnchor={anchor} fontWeight={weight} fontStyle={italic ? 'italic' : undefined} fontFamily={mono ? colors.font.mono : colors.font.ui}>
      {text}
    </text>
  );
}

/** An opaque card: a backdrop that hides whatever is behind it. */
export function Card({ x, y, w, h, u, accent = ACCENT, children }: { x: number; y: number; w: number; h: number; u: number; accent?: string; children?: ReactNode }) {
  if (u <= 0.005) return null;
  const k = lerp(0.94, 1, u);
  return (
    <g opacity={u} transform={`translate(${x + w / 2},${y + h / 2}) scale(${k}) translate(${-x - w / 2},${-y - h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={colors.BG} />
      <rect x={x} y={y} width={w} height={h} rx={14} fill={colors.PANEL} stroke={accent} strokeOpacity={0.6} strokeWidth={1.6} />
      <rect x={x} y={y + 14} width={4} height={h - 28} rx={2} fill={accent} />
      {children}
    </g>
  );
}

/** One status chip at a time, top-left, screen space. `k` picks the chip; `on` fades the whole row. */
export function Chips({ items, k, on }: { items: string[]; k: number; on: number }) {
  return (
    <>
      {items.map((text, i) => {
        const u = on * clamp01(1 - Math.abs(k - i) * 2);
        if (u <= 0.01) return null;
        const w = text.length * 8.6 + 30;
        return (
          <g key={i} opacity={u}>
            <rect x={36} y={26} width={w} height={36} rx={9} fill={colors.PANEL} stroke={ACCENT} strokeOpacity={0.7} strokeWidth={1.4} />
            <text x={51} y={50} fontSize={16} fill={colors.TEXT} fontFamily={colors.font.ui}>
              {text}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** A simple standing person, about 120 px tall at s = 1, feet at (x, y). */
export function Person({ x, y, s = 1, color = HUMAN, opacity = 1 }: { x: number; y: number; s?: number; color?: string; opacity?: number }) {
  if (opacity <= 0.005) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
      <circle cx={0} cy={-104} r={15} fill={color} />
      <path d="M-20,-84 Q0,-90 20,-84 L16,-34 L-16,-34 Z" fill={color} />
      <line x1={-9} y1={-36} x2={-12} y2={0} stroke={color} strokeWidth={10} strokeLinecap="round" />
      <line x1={9} y1={-36} x2={12} y2={0} stroke={color} strokeWidth={10} strokeLinecap="round" />
      <line x1={-19} y1={-80} x2={-28} y2={-44} stroke={color} strokeWidth={8} strokeLinecap="round" />
      <line x1={19} y1={-80} x2={28} y2={-44} stroke={color} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
}

/** A horizontal meter: a track and a fill to `value` (0..1). */
export function Meter({ x, y, w, value, color, u = 1, label, valueText }: { x: number; y: number; w: number; value: number; color: string; u?: number; label?: string; valueText?: string }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      {label && <Label x={x} y={y - 10} text={label} size={15} color={colors.MUTED} />}
      <rect x={x} y={y} width={w} height={14} rx={7} fill={PLATE} stroke={colors.GRID} />
      <rect x={x} y={y} width={Math.max(0, w * clamp01(value))} height={14} rx={7} fill={color} />
      {valueText && <Label x={x + w + 12} y={y + 13} text={valueText} size={16} color={colors.TEXT} weight={650} />}
    </g>
  );
}
