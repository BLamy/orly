/**
 * ch04-s02 / ch04-s03 shared SVG pieces: the parts of the promo look that must sit ABOVE product footage (the dom()
 * layer sits over the scene canvas, the SVG overlay over both). Each mirrors its canvas twin in sets/brand.ts or the kit
 * (same sizes, colours, tracking), so a piece can move from paper onto a screen without changing look.
 *
 *   tw(text, size, weight, mono)   canvas-measured width (the kit's tracking), for SVG layout
 *   SvgChip                        brand.ts recordingChip: the dark '▶ recording' chip (tint → red-pink, ✓ dot; checkScale)
 *   chipCheckAt(x, y, scale)       centre of SvgChip's ✓ dot (for a pulse ring drawn by the shot)
 *   SvgBraces                      brand.ts braceBox: '{ }' glyph halves + corner dots around a measured box
 *   SvgUnderline                   brand.ts underline: the hand-drawn red-pink underline, drawn left → right
 *   SvgPill                        an outlined word pill that can fill red-pink (ch04-s02's environments)
 */
import { MONO, PROMO, SANS, easeOut, measure } from '../../../film/promo';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

let mctx: CanvasRenderingContext2D | null = null;
/** width of `text` as the kit draws it (Promo Sans/Mono, tracking −0.022 em) */
export function tw(text: string, size: number, weight = 400, mono = false): number {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  if (!mctx) return text.length * size * 0.55;
  return measure(mctx, text, size, weight, mono);
}

const track = (size: number) => `${(-0.022 * size).toFixed(2)}px`;

export function mixHex(a: string, b: string, k: number) {
  const p = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(k))).join(',')})`;
}

/** the dark '▶ recording' chip centred on (x, y): u fades/blurs it in, tint → red-pink, check → green ✓ dot */
export function SvgChip(p: { x: number; y: number; u?: number; scale?: number; tint?: number; check?: number; checkScale?: number; blur?: number; label?: string; opacity?: number }) {
  const u = clamp(p.u ?? 1);
  if (u <= 0) return null;
  const k = p.scale ?? 1;
  const label = p.label ?? '▶ recording';
  const w = (tw(label, 12, 600, true) + 22) * k;
  const h = 26 * k;
  const e = easeOut(u);
  const blur = Math.max(p.blur ?? 0, (1 - e) * 4);
  const ck = clamp(p.check ?? 0);
  const ce = easeOut(ck);
  const r = 8 * k * (0.6 + 0.4 * ce) * (p.checkScale ?? 1);
  const cx = p.x + w / 2 + 4 * k, cy = p.y - h / 2 + 2 * k;
  return (
    <g opacity={e * (p.opacity ?? 1)} style={{ filter: `${blur > 0.3 ? `blur(${blur.toFixed(2)}px) ` : ''}drop-shadow(0 ${3 * k}px ${5 * k}px rgba(20,10,30,.22))` }}>
      <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} rx={h / 2} fill={mixHex(PROMO.ink, PROMO.brand, p.tint ?? 0)} />
      <text x={p.x} y={p.y + 1 * k} fill="#fff" textAnchor="middle" dominantBaseline="middle" style={{ font: `600 ${12 * k}px ${MONO}`, letterSpacing: track(12 * k) }}>
        {label}
      </text>
      {ck > 0 && (
        <g opacity={ce}>
          <circle cx={cx} cy={cy} r={r} fill={PROMO.green} />
          <path
            d={`M${cx - r * 0.45} ${cy} L${cx - r * 0.1} ${cy + r * 0.38} L${cx + r * 0.5} ${cy - r * 0.35}`}
            fill="none"
            stroke="#fff"
            strokeWidth={1.8 * k * Math.sqrt(p.checkScale ?? 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
}

/** centre of SvgChip's ✓ dot for a chip centred on (x, y) at `scale` (default label) */
export function chipCheckAt(x: number, y: number, scale = 1) {
  const w = (tw('▶ recording', 12, 600, true) + 22) * scale;
  const h = 26 * scale;
  return { x: x + w / 2 + 4 * scale, y: y - h / 2 + 2 * scale };
}

/** '{' '}' (weight 300) around [x0, x1] centred on y, parting from the centre as u goes 0 → 1; corner dots */
export function SvgBraces(p: { x0: number; x1: number; y: number; size: number; u: number; out?: number; color?: string; pad?: number; dots?: boolean }) {
  const u = clamp(p.u);
  const out = clamp(p.out ?? 0);
  if (u <= 0 || out >= 1) return null;
  const color = p.color ?? PROMO.ink;
  const cx = (p.x0 + p.x1) / 2;
  const pad = p.pad ?? p.size * 0.25;
  const half = ((p.x1 - p.x0) / 2 + pad) * easeOut(clamp(u * 1.4)) + p.size * 0.1;
  const base = p.y + p.size * 0.34;
  const gu = easeOut(clamp(u * 3));
  const gb = (1 - gu) * p.size * 0.18;
  const du = clamp((u - 0.3) * 3);
  const ds = Math.max(4, p.size * 0.13);
  const dx = half + p.size * 0.5, dy = p.size * 0.75;
  const blur = out * p.size * 0.2 + gb;
  const glyph = { font: `300 ${p.size}px ${SANS}`, letterSpacing: track(p.size) };
  return (
    <g opacity={1 - out} style={blur > 0.3 ? { filter: `blur(${blur.toFixed(2)}px)` } : undefined}>
      <g opacity={gu}>
        <text x={cx - half} y={base} textAnchor="end" fill={color} style={glyph}>
          {'{'}
        </text>
        <text x={cx + half} y={base} textAnchor="start" fill={color} style={glyph}>
          {'}'}
        </text>
      </g>
      {p.dots !== false && du > 0 && (
        <g opacity={du} fill={color}>
          {[
            [cx - dx, p.y - dy],
            [cx + dx, p.y - dy],
            [cx - dx, p.y + dy],
            [cx + dx, p.y + dy],
          ].map(([x, y], i) => (
            <rect key={i} x={Math.round(x - ds / 2)} y={Math.round(y - ds / 2)} width={ds} height={ds} />
          ))}
        </g>
      )}
    </g>
  );
}

/** the hand-drawn red-pink underline from x0 to x1 at y, drawn over u (same wobble as brand.ts underline) */
export function SvgUnderline(p: { x0: number; x1: number; y: number; u: number; out?: number; color?: string; width?: number }) {
  const u = easeOut(clamp(p.u));
  if (u <= 0) return null;
  const x1 = p.x0 + (p.x1 - p.x0) * u;
  const steps = 16;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = p.x0 + ((x1 - p.x0) * i) / steps;
    const y = p.y + Math.sin(i * 0.9) * 0.8 + (i / steps) * -1.2;
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return <path d={d} fill="none" stroke={p.color ?? PROMO.brand} strokeWidth={p.width ?? 3} strokeLinecap="round" opacity={1 - clamp(p.out ?? 0)} />;
}

/** a word pill centred on (x, y): outlined grey ink on a pale plate, `fill` 0..1 → solid red-pink with white type */
export function SvgPill(p: { x: number; y: number; text: string; size: number; u?: number; fill?: number; scale?: number; blur?: number; opacity?: number }) {
  const u = clamp(p.u ?? 1);
  if (u <= 0) return null;
  const f = clamp(p.fill ?? 0);
  const w = tw(p.text, p.size, 400) + p.size * 1.3;
  const h = p.size * 1.85;
  const k = p.scale ?? 1;
  const ink = mixHex('#5d5864', '#ffffff', f);
  const blur = p.blur ?? 0;
  return (
    <g
      opacity={u * (p.opacity ?? 1)}
      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${k.toFixed(4)})`}
      style={blur > 0.3 ? { filter: `blur(${blur.toFixed(2)}px)` } : undefined}
    >
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={f > 0 ? mixHex('#f7f6f8', PROMO.brand, f) : 'rgba(255,255,255,.62)'} />
      <rect
        x={-w / 2 + 0.75}
        y={-h / 2 + 0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={h / 2 - 0.75}
        fill="none"
        stroke={mixHex('#8f8996', PROMO.brand, f)}
        strokeWidth={1.5}
        strokeOpacity={0.9}
      />
      <text x={0} y={p.size * 0.35} textAnchor="middle" fill={ink} style={{ font: `400 ${p.size}px ${SANS}`, letterSpacing: track(p.size) }}>
        {p.text}
      </text>
    </g>
  );
}

/** width of an SvgPill (for row layout) */
export const pillW = (text: string, size: number) => tw(text, size, 400) + size * 1.3;
