// BitField — a 256-bit digest as a 16×16 grid of bits, the workhorse for
// hash-centric stories: NIP-01 event ids, NIP-13 proof-of-work, avalanche
// comparisons, commitment reveals.
//
// `settle` drives the signature move: below 1, cells churn through seeded
// noise frames (the compression rounds "mixing"); as settle sweeps up, cells
// lock — earliest first — onto the REAL digest bits. Everything is a pure
// function of the sampled props (mulberry32 keyed by cell + frame), so
// scrubbing is exact.
import { colors, mulberry32 } from '../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface BitFieldProps {
  /** the real bits (use hexToBits(sha256Hex(...)) from './sha256') */
  bits: number[];
  x: number;
  y: number;
  cols?: number;
  /** cell size in px (grid width = cols * (cell + gap)) */
  cell?: number;
  gap?: number;
  /** 0..1 staggers cells in */
  reveal?: number;
  /** 0..1: churn through noise frames, then lock onto the real bits */
  settle?: number;
  /** a second digest — cells that differ get a NEGATIVE ring (avalanche) */
  diff?: number[];
  /** 0..1 fades the diff rings in */
  diffU?: number;
  /** highlight the run of leading zero bits (NIP-13 difficulty), 0..1 */
  zeroRunU?: number;
  onColor?: string;
  offColor?: string;
  opacity?: number;
  /** noise seed, vary per instance so side-by-side grids churn differently */
  seed?: number;
}

const NOISE_FRAMES = 24;

export function BitField({
  bits,
  x,
  y,
  cols = 16,
  cell = 15,
  gap = 3,
  reveal = 1,
  settle = 1,
  diff,
  diffU = 1,
  zeroRunU = 0,
  onColor = colors.ACCENT,
  offColor = colors.GRID,
  opacity = 1,
  seed = 7,
}: BitFieldProps) {
  if (opacity <= 0 || reveal <= 0) return null;
  const n = bits.length;
  const pitch = cell + gap;
  const frame = Math.floor(clamp01(settle) * NOISE_FRAMES);

  let zeroRun = 0;
  if (zeroRunU > 0) {
    while (zeroRun < n && bits[zeroRun] === 0) zeroRun++;
  }

  return (
    <g opacity={opacity}>
      {bits.map((b, i) => {
        const u = clamp01(reveal * n * 1.2 - i);
        if (u <= 0) return null;
        const settled = clamp01(settle * n * 1.15 - i) >= 1;
        const shown = settled ? b : mulberry32(seed * 7919 + frame * 613 + i)() > 0.5 ? 1 : 0;
        const cx = x + (i % cols) * pitch;
        const cy = y + Math.floor(i / cols) * pitch;
        const differs = diff && diffU > 0 && settled && diff[i] !== b;
        const inZeroRun = zeroRunU > 0 && i < zeroRun && settled;
        return (
          <g key={i} opacity={u}>
            <rect
              x={cx}
              y={cy}
              width={cell}
              height={cell}
              rx={2.5}
              fill={shown ? onColor : offColor}
              opacity={shown ? (settled ? 0.92 : 0.45) : 0.35}
            />
            {differs && (
              <rect
                x={cx - 1}
                y={cy - 1}
                width={cell + 2}
                height={cell + 2}
                rx={3.5}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={1.6}
                opacity={clamp01(diffU)}
              />
            )}
            {inZeroRun && (
              <rect
                x={cx - 1}
                y={cy - 1}
                width={cell + 2}
                height={cell + 2}
                rx={3.5}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={1.6}
                opacity={clamp01(zeroRunU)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
