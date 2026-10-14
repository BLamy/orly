/**
 * ch02-s01 / ch02-s02 shared: the giant typed URL (SVG, drawn in shot.overlay() so it sits ABOVE the DOM footage).
 * ch02-s01 types it full-frame, right-aligned (the line slides left as it grows, like the reference's 'a clothin|');
 * ch02-s02 opens on the very same line at the very same place and shrinks it into the real input.
 *
 * Ink type (not near-white): the reference's typed prompt is dark on a pale band; near-white read at < 2:1 on the haze.
 * The URL is the illustrative placeholder the new-project take really typed (never presented as a tested app).
 */
import { SANS } from '../../../film/promo';

export const URL_TEXT = 'https://staging.your-app.dev';
/** Promo Sans regular, sized so the whole 28-character URL fits inside the safe area */
export const TYPED_SIZE = 78;
/** text-anchor 'end' x (≈ 50 px in from the right edge) and the baseline (vertically centred) */
export const TYPED_END_X = 1226;
export const TYPED_BASE_Y = 388;
/** ink, as the reference's giant 'neo goth|' (dark type on the pale band of the blurred input): legible on the haze */
export const TYPED_COLOR = '#141216';
const TRACK = -0.022 * TYPED_SIZE;

/**
 * ch02-s01's ghost: the new-project take's input row ({528..1148, 301..363} in recording px), blurred 16 px at 0.25,
 * overfilling the stage. ch02-s02 starts its camera on exactly this framing (so the cut is seamless) and pulls back.
 */
export const GHOST_CROP = { x: 500, y: 290, w: 680, h: 80 };
export const GHOST_W = 1800;
export const GHOST_K = GHOST_W / GHOST_CROP.w;
export const GHOST_H = GHOST_CROP.h * GHOST_K;
/** recording x 1000 (Start setup's left edge) lands just past the right edge: the black button never smudges the type */
export const GHOST_BOX = { x: 1300 - (1000 - GHOST_CROP.x) * GHOST_K, y: 362 - GHOST_H / 2, w: GHOST_W };
export const GHOST_BLUR = 16;
export const GHOST_OPACITY = 0.25;
/** a recording-px point as s01's ghost shows it (stage px) */
export const ghostToStage = (rx: number, ry: number) => ({
  x: GHOST_BOX.x + (rx - GHOST_CROP.x) * GHOST_K,
  y: GHOST_BOX.y + (ry - GHOST_CROP.y) * GHOST_K,
});

/** shared drop-shadow filter def: the faint shadow that lifts near-white type off the dawn haze */
export function TypedDefs() {
  return (
    <defs>
      <filter id="ch02-typed-shadow" x="-10%" y="-40%" width="120%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="10" floodColor="#ffffff" floodOpacity="0.45" />
      </filter>
    </defs>
  );
}

/**
 * The typed line: `n` characters of URL_TEXT, right-aligned on TYPED_END_X, and the caret just after it.
 * `caret` 0..1 (opacity); `blur` stage px; `transform` applies to the whole line (ch02-s02's shrink).
 */
export function TypedLine(p: { n: number; caret: number; opacity?: number; transform?: string; blur?: number; caretScale?: number; fill?: string; shadow?: number }) {
  const shown = URL_TEXT.slice(0, Math.max(0, Math.min(URL_TEXT.length, p.n)));
  const caretW = Math.max(2, TYPED_SIZE * 0.045);
  const caretH = TYPED_SIZE * 1.0 * (p.caretScale ?? 1);
  const gap = TYPED_SIZE * 0.08;
  return (
    <g transform={p.transform} opacity={p.opacity ?? 1} filter={(p.shadow ?? 1) > 0 ? 'url(#ch02-typed-shadow)' : undefined} style={(p.blur ?? 0) > 0.2 ? { filter: `blur(${p.blur}px)` } : undefined}>
      <text
        x={TYPED_END_X - gap - caretW}
        y={TYPED_BASE_Y}
        textAnchor="end"
        fill={p.fill ?? TYPED_COLOR}
        style={{ font: `400 ${TYPED_SIZE}px ${SANS}`, letterSpacing: `${TRACK.toFixed(2)}px` }}
      >
        {shown}
      </text>
      {p.caret > 0 && (
        <rect
          x={TYPED_END_X - caretW}
          y={TYPED_BASE_Y - TYPED_SIZE * 0.8 - (caretH - TYPED_SIZE) / 2}
          width={caretW}
          height={caretH}
          fill={p.fill ?? TYPED_COLOR}
          opacity={p.caret}
        />
      )}
    </g>
  );
}
