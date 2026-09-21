// Confidence Before Words — book-local machines shared by chapters 1–3.
//
// Source: Nandakishor M, arXiv:2510.01237v1 (four-page PDF, no code repository).
//   p.2 eq. 5 — routing intervals with thresholds 0.75 / 0.55 / 0.35; each band
//   includes its LOWER edge, so an equal score routes into the higher band.
//
// Everything here is a pure function of its props (no clocks, no randomness).
// Activation intensities are a closed-form illustrative pattern, not model data.
import type { ReactNode } from 'react';
import { colors } from '../../../core';

const { SECONDARY, WARM, NEGATIVE, TEAL, MUTED, TEXT, PANEL, font, ink } = colors;

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** progress of `u` through the sub-interval [a, b], clamped */
export const seg = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));

// ---------------------------------------------------------------------------
// Routing rule — p.2 eq. 5. Index 0…3 runs left→right along the score rail.
// ---------------------------------------------------------------------------

export const THRESHOLDS = [0.35, 0.55, 0.75] as const;

export const ROUTES = [
  { key: 'human', label: 'human review', short: 'human', lo: 0, hi: 0.35, color: NEGATIVE },
  { key: 'large', label: 'larger model', short: 'larger', lo: 0.35, hi: 0.55, color: SECONDARY },
  { key: 'rag', label: 'retrieval (RAG)', short: 'retrieval', lo: 0.55, hi: 0.75, color: WARM },
  // teal, not green: staying local is a routing choice, never a correctness mark
  { key: 'local', label: 'local model', short: 'local', lo: 0.75, hi: 1, color: TEAL },
] as const;

/** Exact inclusive-lower-bound routing: 0.55 → retrieval, 0.5499… → larger model. */
export function routeIndex(score: number): number {
  if (score >= 0.75) return 3;
  if (score >= 0.55) return 2;
  if (score >= 0.35) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Small text atoms
// ---------------------------------------------------------------------------

type Anchor = 'start' | 'middle' | 'end';

export function Label({ x, y, text, o = 1, color = MUTED, size = 12, anchor = 'start', weight }: {
  x: number; y: number; text: string; o?: number; color?: string; size?: number; anchor?: Anchor;
  weight?: number;
}) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.mono} fontSize={size} fontWeight={weight} textAnchor={anchor}>
      {text}
    </text>
  );
}

export function Note({ x, y, text, o = 1, color = TEXT, size = 14, anchor = 'start', weight }: {
  x: number; y: number; text: string; o?: number; color?: string; size?: number; anchor?: Anchor;
  weight?: number;
}) {
  if (o <= 0) return null;
  return (
    <text x={x} y={y} fill={color} opacity={o} fontFamily={font.ui} fontSize={size} fontWeight={weight} textAnchor={anchor}>
      {text}
    </text>
  );
}

/** Honesty tag: 'Illustrative geometry' / 'Illustrative score' / 'Paper-reported'. */
export function Tag({ x, y, text, o = 1, color = MUTED, size = 10, anchor = 'start' }: {
  x: number; y: number; text: string; o?: number; color?: string; size?: number; anchor?: Anchor;
}) {
  if (o <= 0) return null;
  const w = text.length * size * 0.62 + 14;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={o}>
      <rect x={left} y={y - size - 3} width={w} height={size + 9} rx={(size + 9) / 2} fill={PANEL} stroke={color} strokeOpacity={0.45} />
      <text x={left + w / 2} y={y} fill={color} fontFamily={font.mono} fontSize={size} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Activation ribbon — the query's pass through the layers.
// ---------------------------------------------------------------------------

export const LAYERS = 12;
export const ROWS = 5;
/** Illustrative activation intensities in 0.25…1 (closed form, deterministic). */
export const ACT: number[][] = Array.from({ length: LAYERS }, (_, l) =>
  Array.from({ length: ROWS }, (_, r) => 0.625 + 0.375 * Math.sin(1.7 * l + 2.3 * r + 0.6 * l * r)),
);

/**
 * `lit` runs 0…LAYERS: column l glows by clamp01(lit − l); the query dot rides the front.
 */
export function ActivationRibbon({ x, y, w, h, lit, o = 1, color = colors.ACCENT, showDot = true }: {
  x: number; y: number; w: number; h: number; lit: number; o?: number; color?: string; showDot?: boolean;
}) {
  if (o <= 0) return null;
  const dx = w / LAYERS;
  const dy = h / ROWS;
  const front = x + dx * Math.min(lit, LAYERS);
  return (
    <g opacity={o}>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={8} fill={PANEL} stroke={ink.axis} strokeOpacity={0.6} />
      {ACT.map((col, l) => {
        const u = clamp01(lit - l);
        return col.map((v, r) => (
          <rect
            key={`${l}-${r}`}
            x={x + l * dx + dx * 0.14}
            y={y + r * dy + dy * 0.14}
            width={dx * 0.72}
            height={dy * 0.72}
            rx={Math.min(dx, dy) * 0.16}
            fill={color}
            fillOpacity={0.07 + 0.83 * v * u}
          />
        ));
      })}
      {showDot && lit > 0 && lit < LAYERS ? (
        <line x1={front} y1={y - 4} x2={front} y2={y + h + 4} stroke={TEXT} strokeOpacity={0.7} strokeWidth={1.2} />
      ) : null}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Route rail — one continuous score, four inclusive-lower-bound bands, four tracks.
// ---------------------------------------------------------------------------

export interface RailGeom {
  x: number; y: number; w: number; trackH: number;
  sx: (score: number) => number;
  tracks: { cx: number; stationX: number; stationY: number; path: string; point: (u: number) => { x: number; y: number } }[];
}

export function railGeom(x: number, y: number, w: number, trackH: number): RailGeom {
  const sx = (score: number) => x + w * score;
  const tracks = ROUTES.map((r, i) => {
    const cx = sx((r.lo + r.hi) / 2);
    const stationX = x + (w * (i + 0.5)) / ROUTES.length;
    const y0 = y + 14;
    const y3 = y + trackH;
    const c1 = { x: cx, y: lerp(y0, y3, 0.55) };
    const c2 = { x: stationX, y: lerp(y0, y3, 0.45) };
    const point = (u: number) => {
      const v = 1 - u;
      return {
        x: v * v * v * cx + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * stationX,
        y: v * v * v * y0 + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * y3,
      };
    };
    return {
      cx,
      stationX,
      stationY: y3,
      path: `M${cx},${y0} C${c1.x},${c1.y} ${c2.x},${c2.y} ${stationX},${y3}`,
      point,
    };
  });
  return { x, y, w, trackH, sx, tracks };
}

export function RouteRail({
  geom, reveal = 1, trackU = 1, score, beadO = 1, whisper = 1, o = 1, size = 12, stationLabels = false,
  edgeMarks = 0, beadLabel, children,
}: {
  geom: RailGeom;
  /** rail + dividers draw-on */
  reveal?: number;
  /** four tracks draw-on */
  trackU?: number;
  score: number;
  beadO?: number;
  /** 0 = all tracks equal, 1 = only the selected track is bright (others ≤ 0.15) */
  whisper?: number;
  o?: number;
  size?: number;
  stationLabels?: boolean;
  /** closed (included) / open (excluded) interval end marks */
  edgeMarks?: number;
  beadLabel?: string;
  children?: ReactNode;
}) {
  if (o <= 0) return null;
  const { x, y, w, sx, tracks } = geom;
  const sel = routeIndex(score);
  const bx = sx(score);
  const band = 8;
  return (
    <g opacity={o}>
      {/* four colored intervals */}
      {ROUTES.map((r, i) => {
        const x0 = sx(r.lo);
        const x1 = Math.min(sx(r.hi), x + w * reveal);
        if (x1 <= x0) return null;
        const on = beadO > 0 && i === sel;
        return (
          <rect key={r.key} x={x0} y={y - band / 2} width={x1 - x0} height={band} rx={2}
            fill={r.color} fillOpacity={on ? 0.95 : lerp(0.55, 0.22, whisper * clamp01(beadO))} />
        );
      })}
      {/* threshold dividers */}
      {THRESHOLDS.map((th, i) => {
        const u = seg(reveal, th, th + 0.12);
        if (u <= 0) return null;
        return (
          <g key={th} opacity={u}>
            <line x1={sx(th)} y1={y - 14} x2={sx(th)} y2={y + 14} stroke={TEXT} strokeWidth={1.4} />
            <text x={sx(th)} y={y + 14 + size + 2} fill={TEXT} fontFamily={font.mono} fontSize={size} textAnchor="middle">
              {th.toFixed(2)}
            </text>
            {edgeMarks > 0 ? (
              <g opacity={edgeMarks}>
                {/* closed dot: the higher band owns its lower edge; open ring: the lower band stops short */}
                <circle cx={sx(th) + 5} cy={y} r={3.2} fill={ROUTES[i + 1].color} stroke={TEXT} strokeWidth={0.8} />
                <circle cx={sx(th) - 5} cy={y} r={3.2} fill={PANEL} stroke={ROUTES[i].color} strokeWidth={1.2} />
              </g>
            ) : null}
          </g>
        );
      })}
      <g opacity={seg(reveal, 0, 0.2)}>
        <text x={x} y={y + 14 + size + 2} fill={MUTED} fontFamily={font.mono} fontSize={size} textAnchor="middle">0</text>
      </g>
      <g opacity={seg(reveal, 0.9, 1)}>
        <text x={x + w} y={y + 14 + size + 2} fill={MUTED} fontFamily={font.mono} fontSize={size} textAnchor="middle">1</text>
      </g>
      {/* tracks */}
      {tracks.map((t, i) => {
        const on = beadO > 0 && i === sel;
        const base = on ? 1 : lerp(0.6, 0.13, whisper * clamp01(beadO));
        return (
          <g key={i} opacity={base}>
            <path d={t.path} fill="none" stroke={ROUTES[i].color} strokeWidth={on ? 2.6 : 1.6}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(trackU)} strokeLinecap="round" />
            {stationLabels ? (
              <text x={t.stationX} y={t.stationY + size + 6} opacity={seg(trackU, 0.7, 1)} fill={ROUTES[i].color}
                fontFamily={font.mono} fontSize={size} textAnchor="middle">
                {ROUTES[i].short}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
      {/* the bead + its mechanical selector */}
      {beadO > 0 ? (
        <g opacity={beadO}>
          <line x1={bx} y1={y} x2={tracks[sel].cx} y2={y + 14} stroke={ROUTES[sel].color} strokeWidth={2} strokeLinecap="round" />
          <circle cx={bx} cy={y} r={9} fill={PANEL} stroke={ROUTES[sel].color} strokeWidth={3} />
          <circle cx={bx} cy={y} r={3} fill={TEXT} />
          {beadLabel ? (
            <text x={bx} y={y - 18} fill={TEXT} fontFamily={font.mono} fontSize={size + 1} textAnchor="middle">
              {beadLabel}
            </text>
          ) : null}
        </g>
      ) : null}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Three-instrument glyph strip (recap beats): angle · narrowing traces · small head.
// ---------------------------------------------------------------------------

export function InstrumentGlyphs({ x, y, u, o = 1 }: { x: number; y: number; u: number; o?: number }) {
  if (o <= 0) return null;
  const cell = 64;
  const names = ['alignment', 'convergence', 'learned'];
  const tints = [colors.ACCENT, WARM, SECONDARY];
  return (
    <g opacity={o}>
      {names.map((name, i) => {
        const a = seg(u, i / 3, (i + 1) / 3);
        const gx = x;
        const gy = y + i * (cell + 22);
        return (
          <g key={name} opacity={0.15 + 0.85 * a}>
            <rect x={gx} y={gy} width={cell * 2} height={cell} rx={8} fill={PANEL} stroke={tints[i]} strokeOpacity={0.6} />
            {i === 0 ? (
              <g stroke={tints[i]} strokeWidth={2} strokeLinecap="round">
                <line x1={gx + 22} y1={gy + 50} x2={gx + 80} y2={gy + 38} />
                <line x1={gx + 22} y1={gy + 50} x2={gx + 66} y2={gy + 14} stroke={TEXT} />
              </g>
            ) : i === 1 ? (
              <g fill="none" stroke={tints[i]} strokeWidth={1.6}>
                {[-1, 0, 1].map((j) => (
                  <path key={j} d={`M${gx + 14},${gy + 32 + j * 20} C${gx + 50},${gy + 32 + j * 18} ${gx + 70},${gy + 32 + j * 5} ${gx + 114},${gy + 32 + j * 3}`} />
                ))}
              </g>
            ) : (
              <g fill={tints[i]}>
                {[0, 1, 2, 3].map((j) => <circle key={`a${j}`} cx={gx + 28} cy={gy + 12 + j * 13.5} r={3.4} />)}
                {[0, 1, 2].map((j) => <circle key={`b${j}`} cx={gx + 64} cy={gy + 18 + j * 14} r={3.4} fillOpacity={0.8} />)}
                <circle cx={gx + 100} cy={gy + 32} r={5} fill={TEXT} />
              </g>
            )}
            <text x={gx + cell} y={gy + cell + 14} fill={MUTED} fontFamily={font.mono} fontSize={10} textAnchor="middle">
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
