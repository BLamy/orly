// Figure — embed a REAL asset from the source paper (a figure, chart image,
// GIF, or video clip) directly on the 1280×720 stage. This is the bridge that
// lets a paper-book show the authors' own diagrams/results next to our
// hand-animated viz, instead of only redrawing everything as vector art.
//
// Scrub-purity contract (the whole suite depends on it):
//   • Static images (`src`) are a pure function of props — `reveal`/`opacity`
//     are the only animated channels, so seeking is exact.
//   • Video/GIF (`video`) can't be pure on their own (they carry their own
//     clock), so we DRIVE them from the timeline: `play` (0..1) maps to
//     `currentTime = play * duration`. The element is muted + never autoplays;
//     each sampled frame sets currentTime deterministically. Seeking the book
//     audio therefore lands the clip on an exact frame.
//
// Assets live in `public/generated/<slug>/figures/` and are referenced by the
// absolute path `/generated/<slug>/figures/<name>` so they resolve in the app,
// the headless verify pass, and Storybook alike.
import { useLayoutEffect, useRef } from 'react';
import { colors } from '../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface FigureProps {
  /** absolute asset path, e.g. `/generated/<slug>/figures/fig2.png` */
  src: string;
  /** top-left corner on the stage */
  x: number;
  y: number;
  /** displayed box; the asset is letterboxed inside (aspect preserved) */
  w: number;
  h: number;
  /** 0..1 entrance — scales up slightly + fades in (pure) */
  reveal?: number;
  /** master opacity multiplier (fade a figure to a whisper behind a beat) */
  opacity?: number;
  /** treat `src` as a muted clip; `play` (0..1) scrubs it via currentTime */
  video?: boolean;
  /** clip length in seconds — required when `video` (maps play→currentTime) */
  duration?: number;
  /** 0..1 playhead for a `video` clip (default 0) */
  play?: number;
  /** short attribution/caption chip under the frame, e.g. "Fig. 2 — pipeline" */
  caption?: string;
  /** frame accent (border + caption chip); defaults to the shelf ACCENT */
  accent?: string;
  /** rounded-corner radius of the frame */
  radius?: number;
}

/** A muted <video> whose playhead is a pure function of the sampled `u`. */
function ScrubVideo({
  src,
  u,
  duration,
  width,
  height,
  radius,
}: {
  src: string;
  u: number;
  duration: number;
  width: number;
  height: number;
  radius: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = clamp01(u) * duration;
    // Only nudge when meaningfully off — avoids seek thrash while playing.
    if (Math.abs((el.currentTime || 0) - target) > 0.04 && isFinite(target)) {
      try {
        el.currentTime = target;
      } catch {
        /* not seekable yet — a later frame will land it */
      }
    }
  }, [u, duration]);
  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      preload="auto"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'contain',
        borderRadius: `${radius}px`,
        display: 'block',
      }}
    />
  );
}

export function Figure({
  src,
  x,
  y,
  w,
  h,
  reveal = 1,
  opacity = 1,
  video = false,
  duration = 1,
  play = 0,
  caption,
  accent = colors.ACCENT,
  radius = 10,
}: FigureProps) {
  const r = clamp01(reveal);
  const o = clamp01(opacity) * r;
  if (o <= 0) return null;

  // Entrance: a gentle scale-up from 0.96 about the box center (pure in reveal).
  const k = 0.96 + 0.04 * r;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const capH = 30;

  return (
    <g opacity={o} transform={`translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`}>
      {/* backing panel so a transparent PNG reads on the dark stage */}
      <rect
        x={x - 8}
        y={y - 8}
        width={w + 16}
        height={h + 16 + (caption ? capH : 0)}
        rx={radius + 4}
        fill="#0d1424"
        stroke={accent}
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      {video ? (
        <foreignObject x={x} y={y} width={w} height={h}>
          <ScrubVideo src={src} u={play} duration={duration} width={w} height={h} radius={radius} />
        </foreignObject>
      ) : (
        <image
          href={src}
          x={x}
          y={y}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
          style={{ borderRadius: `${radius}px` }}
        />
      )}
      {caption && (
        <text
          x={x + 4}
          y={y + h + 21}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize={15}
          fill={colors.MUTED}
        >
          {caption}
        </text>
      )}
    </g>
  );
}
