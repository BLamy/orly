import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type RecordingPointKind = 'interaction' | 'network' | 'exception' | 'render';

/** Runtime-timeline point family → color (a Replay recording's vocabulary). */
export const POINT_COLOR: Record<RecordingPointKind, string> = {
  interaction: colors.ACCENT, // clicks, keystrokes
  network: colors.TEAL, // fetch / XHR
  exception: colors.NEGATIVE, // thrown errors
  render: colors.SECONDARY, // component paints
};

export interface RecordingPoint {
  /** position along the recording, 0..1 */
  at: number;
  kind: RecordingPointKind;
  label?: string;
}

export interface RecordingLink {
  /** position along the recording, 0..1 */
  at: number;
  /** chip text — a point link the critic cites ("point @ 12.4s") */
  label: string;
  /** 0..1 chip pop — sample it from a channel */
  pop: number;
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * A Replay recording as a horizontal runtime timeline: the FULL execution —
 * every call, network request, render — captured deterministically, so a
 * critic can interrogate any moment after the fact. Typed point markers sit
 * at their timestamps, a sweep cursor (`u`) is the critic's read head, and
 * point-link chips pop over cited moments — findings cite points, not vibes.
 */
export function RecordingStrip({
  x,
  y,
  w,
  h = 30,
  points,
  u = 0,
  reveal = 1,
  links = [],
  title = 'replay recording',
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  h?: number;
  points: RecordingPoint[];
  /** 0..1 sweep cursor along the recording (hidden at ≤ 0) */
  u?: number;
  /** 0..1 draws the track, then staggers the markers in */
  reveal?: number;
  /** point-link chips; each `pop` is channel-driven */
  links?: RecordingLink[];
  title?: string;
  dim?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = 1 - 0.6 * clamp01(dim);
  const uu = clamp01(u);
  const n = points.length;
  const cy = h / 2;

  const marker = (p: RecordingPoint, i: number) => {
    const mu = clamp01(rv * (n + 2) - (i + 2));
    if (mu <= 0) return null;
    const px = p.at * w;
    const color = POINT_COLOR[p.kind];
    // the sweep cursor lights markers as it passes
    const lit = uu > 0 && uu >= p.at ? 1 : 0.45;
    let glyph;
    if (p.kind === 'interaction') glyph = <circle cx={px} cy={cy} r={4.5} fill={color} />;
    else if (p.kind === 'network')
      glyph = <path d={`M ${px} ${cy - 5.5} l 5 5.5 l -5 5.5 l -5 -5.5 Z`} fill={color} />;
    else if (p.kind === 'exception')
      glyph = <path d={`M ${px} ${cy - 5.5} l 5.5 9.5 h -11 Z`} fill={color} />;
    else glyph = <rect x={px - 4} y={cy - 4} width={8} height={8} rx={1.5} fill={color} />;
    return (
      <g key={i} opacity={mu * lit}>
        {glyph}
        {p.label && (
          <text x={px} y={h + 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
            {p.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`} opacity={alpha}>
      <text y={-9} fill={colors.MUTED} fontSize={12}>
        {title}
      </text>
      {/* the track: full runtime, end to end */}
      <rect width={w * rv} height={h} rx={7} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {points.map(marker)}
      {/* sweep cursor — the critic's read head */}
      {uu > 0.001 && rv >= 0.999 && (
        <g transform={`translate(${uu * w}, 0)`}>
          <line y1={-4} y2={h + 4} stroke={colors.WARM} strokeWidth={2} strokeLinecap="round" />
          <circle cy={-4} r={3.5} fill={colors.WARM} />
          <rect x={-w * Math.min(uu, 0.12)} width={w * Math.min(uu, 0.12)} height={h} fill={colors.WARM} opacity={0.07} />
        </g>
      )}
      {/* point-link chips — citations into the recording */}
      {links.map((lk, i) => {
        const pu = clamp01(lk.pop);
        if (pu <= 0) return null;
        const px = lk.at * w;
        const cw = lk.label.length * 6.8 + 26;
        return (
          <g key={`lk${i}`} transform={`translate(${px}, ${-26 + (1 - pu) * 8})`} opacity={pu}>
            <line x1={0} y1={11} x2={0} y2={22} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="2 3" />
            <rect x={-cw / 2} y={-11} width={cw} height={22} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <rect x={-cw / 2 - 3} y={-14} width={cw + 6} height={28} rx={14} fill="none" stroke={colors.WARM} strokeWidth={1} opacity={0.4 * pu} />
            {/* crosshair glyph — GetPointLink's mark */}
            <g stroke={colors.WARM} strokeWidth={1.4}>
              <circle cx={-cw / 2 + 11} r={4} fill="none" />
              <line x1={-cw / 2 + 11} y1={-6.5} x2={-cw / 2 + 11} y2={6.5} />
              <line x1={-cw / 2 + 4.5} y1={0} x2={-cw / 2 + 17.5} y2={0} />
            </g>
            <text x={10} y={4} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={mono}>
              {lk.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
