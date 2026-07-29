// EcCurve — the secp256k1 shape y² = x³ + 7 drawn over the reals, for
// key/signature stories (Schnorr per NIP-01). The REAL curve lives over a
// prime field where a picture is scattered dust; the standard pedagogical
// move (and ours) is the smooth ℝ picture for geometry — chords, tangents,
// point-hopping — with captions owning that honesty.
//
// `ecPlot` exposes the scales so scenes can place points, chords, and scalar-
// multiplication hops directly in curve coordinates.
import { colors } from '../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface EcView {
  x: number;
  y: number;
  w: number;
  h: number;
  /** curve-space x domain (default [-2.1, 3.1]; the curve starts at x = ∛-7 ≈ -1.913) */
  xMin?: number;
  xMax?: number;
}

export interface EcPlot {
  /** curve-space → stage-space */
  sx(x: number): number;
  sy(y: number): number;
  /** upper-branch height: y = +sqrt(x³ + 7), 0 where undefined */
  curveY(x: number): number;
  /** full curve outline (upper branch then mirrored lower), partial via reveal */
  pathD(reveal: number): string;
}

const X_START = Math.cbrt(-7); // where x³ + 7 = 0

export function ecPlot(view: EcView): EcPlot {
  const xMin = view.xMin ?? -2.1;
  const xMax = view.xMax ?? 3.1;
  const curveY = (x: number) => Math.sqrt(Math.max(0, x * x * x + 7));
  const yMax = curveY(xMax) * 1.06;
  const sx = (x: number) => view.x + ((x - xMin) / (xMax - xMin)) * view.w;
  const sy = (y: number) => view.y + view.h / 2 - (y / yMax) * (view.h / 2);

  const N = 160;
  const xs = Array.from({ length: N }, (_, i) => X_START + ((xMax - X_START) * i) / (N - 1));

  const pathD = (reveal: number) => {
    const u = clamp01(reveal);
    if (u <= 0) return '';
    const k = Math.max(2, Math.round(N * u));
    const upper = xs.slice(0, k).map((x, i) => `${i ? 'L' : 'M'}${sx(x)},${sy(curveY(x))}`);
    const lower = xs.slice(0, k).map((x, i) => `${i ? 'L' : 'M'}${sx(x)},${sy(-curveY(x))}`);
    return `${upper.join(' ')} ${lower.join(' ')}`;
  };

  return { sx, sy, curveY, pathD };
}

export interface EcCurveProps {
  view: EcView;
  /** 0..1 draws the curve on from its nose */
  reveal?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** faint horizontal axis through y = 0 */
  axis?: boolean;
}

export function EcCurve({
  view,
  reveal = 1,
  stroke = colors.SECONDARY,
  strokeWidth = 2.2,
  opacity = 1,
  axis = true,
}: EcCurveProps) {
  if (opacity <= 0 || reveal <= 0) return null;
  const p = ecPlot(view);
  return (
    <g opacity={opacity}>
      {axis && (
        <line
          x1={view.x}
          y1={p.sy(0)}
          x2={view.x + view.w}
          y2={p.sy(0)}
          stroke={colors.GRID}
          strokeWidth={1}
          opacity={0.6 * clamp01(reveal * 2)}
        />
      )}
      <path d={p.pathD(reveal)} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    </g>
  );
}
