/**
 * ch05-s02 / ch05-s04 shared: a bracket that snaps round ONE word inside a product title (stage px, SVG overlay).
 *
 * The words it frames ('67ms' in bug-react's title, '258' in bug-sync's) sit in running text with only a space on
 * either side, so tall '{ }' glyphs or full-height corner brackets would touch the neighbouring letters. This bracket
 * keeps `air` px of paper on each side of the word's glyph box and draws its four corners as short ticks that live
 * ABOVE the cap line and BELOW the baseline only (the horizontal arms run inward over the word, the vertical stubs are
 * shorter than the gap to the text), so nothing ever overlaps a letter of the next word. A small square registration
 * dot sits just outside each corner (the reference's bracketed-phrase dots), `dotOut` px further out sideways (never
 * upward, where the chips row sits).
 */
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export function SvgWordTicks(p: {
  x0: number;
  x1: number;
  /** cap top of the word */
  yTop: number;
  /** baseline of the word */
  base: number;
  u: number;
  out?: number;
  color?: string;
  /** horizontal air between the glyph box and the bracket corner (default 8) */
  air?: number;
  /** right-side air when the next word is closer than `air` (default = air): keep the corner inside the gap */
  airR?: number;
  /** gap above the cap line / below the baseline (defaults 6 / 7) */
  padT?: number;
  padB?: number;
  /** registration dots: offset outward from each corner (default 4); null = no dots */
  dotOut?: number | null;
  /** stroke width (default 1.7) */
  width?: number;
}) {
  const u = clamp(p.u);
  const out = clamp(p.out ?? 0);
  if (u <= 0 || out >= 1) return null;
  const e = 1 - Math.pow(1 - u, 3);
  const col = p.color ?? '#141216';
  const air = p.air ?? 8;
  const bx0 = p.x0 - air, bx1 = p.x1 + (p.airR ?? air);
  const by0 = p.yTop - (p.padT ?? 6), by1 = p.base + (p.padB ?? 7);
  const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
  // snaps in from 1.5x onto the word's box
  const k = 1 + 0.5 * (1 - e);
  const X = (x: number) => cx + (x - cx) * k;
  const Y = (y: number) => cy + (y - cy) * k;
  const armH = Math.min(10, (bx1 - bx0) / 3);
  const stub = 4; // vertical stubs: shorter than the pad, so they never reach the cap line or the baseline
  const d = [
    `M${X(bx0)} ${Y(by0) + stub} V${Y(by0)} H${X(bx0) + armH}`,
    `M${X(bx1) - armH} ${Y(by0)} H${X(bx1)} V${Y(by0) + stub}`,
    `M${X(bx1)} ${Y(by1) - stub} V${Y(by1)} H${X(bx1) - armH}`,
    `M${X(bx0) + armH} ${Y(by1)} H${X(bx0)} V${Y(by1) - stub}`,
  ].join(' ');
  const dot = p.dotOut === null ? null : p.dotOut ?? 4;
  const ds = 3;
  const dots =
    dot === null
      ? []
      : [
          [X(bx0) - dot, Y(by0)],
          [X(bx1) + dot, Y(by0)],
          [X(bx1) + dot, Y(by1)],
          [X(bx0) - dot, Y(by1)],
        ];
  return (
    <g opacity={e * (1 - out)}>
      <path d={d} fill="none" stroke={col} strokeWidth={p.width ?? 1.7} strokeLinecap="square" />
      {dots.map(([x, y], i) => (
        <rect key={i} x={x - ds / 2} y={y - ds / 2} width={ds} height={ds} fill={col} />
      ))}
    </g>
  );
}
