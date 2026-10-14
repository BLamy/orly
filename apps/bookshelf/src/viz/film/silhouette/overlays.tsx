/**
 * SVG overlay components (stage coordinates, 1280x720) for ShotModule.overlay(): ink on
 * parchment, rendered above the scene canvas and below the finish pass.
 *
 *   <ParchmentPlate x y width height seed? opacity? lift? title?>{children}</ParchmentPlate>
 *       a deckled cut-paper card: fibres, foxed edges, a double engraved border, corner lozenges
 *   <EquationPlate tex x y width? height? fontSize? caption? number? reveal? opacity? seed?/>
 *       KaTeX (core MathLabel) set in ink on a ParchmentPlate; reveal 0..1 inks it in left -> right
 *   <InkCaption x y text size? anchor? italic? opacity?/>   EB Garamond caption, ≥ 26 px @1080p
 * Pure: geometry is seeded and memoised; animate only via props derived from SceneState.
 * x,y is the plate CENTRE. Fonts: call loadFilmFonts() (type.ts) before the first frame.
 */
import { useId, useMemo, type ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import { MathLabel } from '../../core';
import { mulberry32 } from '../../core';
import { MOODS } from './palette';

const P = MOODS.parchment;
const INK = P.ink;
const PAPER = P.sky[0]; // warm parchment #e9dcc3
const PAPER_EDGE = P.setHaze;

/** closed deckled outline around a w x h rect centred at 0,0 (jitter 0.6–2.2 px) */
function deckle(w: number, h: number, seed: number): string {
  const rnd = mulberry32(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(4, Math.round(L / 6));
    let drift = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      drift = drift * 0.6 + (rnd() - 0.5) * 1.6;
      const j = drift + (rnd() - 0.5) * 1.2;
      pts.push(`${(x0 + (x1 - x0) * u + nx * j).toFixed(2)},${(y0 + (y1 - y0) * u + ny * j).toFixed(2)}`);
    }
  };
  const hw = w / 2;
  const hh = h / 2;
  edge(-hw, -hh, hw, -hh, 0, -1);
  edge(hw, -hh, hw, hh, 1, 0);
  edge(hw, hh, -hw, hh, 0, 1);
  edge(-hw, hh, -hw, -hh, -1, 0);
  return `M${pts.join('L')}Z`;
}
/** short paper fibres as one path */
function fibres(w: number, h: number, seed: number, n: number): string {
  const rnd = mulberry32(seed + 17);
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = (rnd() - 0.5) * (w - 10);
    const y = (rnd() - 0.5) * (h - 10);
    const a = rnd() * Math.PI;
    const L = 3 + rnd() * 9;
    const cx = x + Math.cos(a) * L * 0.5 + Math.sin(a) * 1.5;
    const cy = y + Math.sin(a) * L * 0.5 - Math.cos(a) * 1.5;
    d += `M${x.toFixed(1)},${y.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${(x + Math.cos(a) * L).toFixed(1)},${(y + Math.sin(a) * L).toFixed(1)}`;
  }
  return d;
}

export interface ParchmentPlateProps {
  x: number;
  y: number;
  width: number;
  height: number;
  seed?: number;
  opacity?: number;
  /** cut-paper lift in px (soft offset shadow), default 5 */
  lift?: number;
  /** small-caps heading engraved at the top */
  title?: string;
  /** slight rotation in degrees (pinned-card feel), default 0 */
  rotate?: number;
  children?: ReactNode;
}
export function ParchmentPlate({ x, y, width, height, seed = 7, opacity = 1, lift = 5, title, rotate = 0, children }: ParchmentPlateProps) {
  const uid = useId().replace(/:/g, '');
  const outline = useMemo(() => deckle(width, height, seed), [width, height, seed]);
  const fib = useMemo(() => fibres(width, height, seed, Math.round((width * height) / 900)), [width, height, seed]);
  if (opacity <= 0) return null;
  const hw = width / 2;
  const hh = height / 2;
  const i1 = 16;
  const i2 = 21;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity} style={{ pointerEvents: 'none' }}>
      <defs>
        <radialGradient id={`fox${uid}`} cx="50%" cy="48%" r="72%">
          <stop offset="0.55" stopColor={PAPER} stopOpacity={0} />
          <stop offset="0.9" stopColor={PAPER_EDGE} stopOpacity={0.55} />
          <stop offset="1" stopColor={P.set} stopOpacity={0.7} />
        </radialGradient>
        <linearGradient id={`sheen${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8ea" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#fff8ea" stopOpacity={0} />
          <stop offset="1" stopColor={P.set} stopOpacity={0.12} />
        </linearGradient>
      </defs>
      {/* lift: layered offset shadow (no blur filter: cheap per frame) */}
      {lift > 0 &&
        [1, 0.66, 0.33].map((k) => <path key={k} d={outline} transform={`translate(${lift * k * 0.4} ${lift * k})`} fill={INK} opacity={0.16 * (1.2 - k)} />)}
      <path d={outline} fill={PAPER} />
      <path d={outline} fill={`url(#fox${uid})`} />
      <path d={outline} fill={`url(#sheen${uid})`} />
      <path d={fib} stroke={P.set} strokeWidth={0.5} strokeOpacity={0.22} fill="none" />
      {/* double engraved border with corner lozenges */}
      <rect x={-hw + i1} y={-hh + i1} width={width - 2 * i1} height={height - 2 * i1} fill="none" stroke={INK} strokeOpacity={0.75} strokeWidth={1.1} />
      <rect x={-hw + i2} y={-hh + i2} width={width - 2 * i2} height={height - 2 * i2} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={0.5} />
      {[
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([sx, sy]) => {
        const cx = sx * (hw - i1);
        const cy = sy * (hh - i1);
        return <path key={`${sx}${sy}`} d={`M${cx},${cy - 5}L${cx + 5},${cy}L${cx},${cy + 5}L${cx - 5},${cy}Z`} fill={INK} opacity={0.8} />;
      })}
      {title && (
        <text
          x={0}
          y={-hh + i2 + 30}
          textAnchor="middle"
          fill={INK}
          style={{ font: `500 19px "Cormorant SC"`, letterSpacing: '0.2em' }}
        >
          {title.toLowerCase()}
        </text>
      )}
      {children}
    </g>
  );
}

export interface EquationPlateProps {
  tex: string;
  /** plate centre, stage px */
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** KaTeX size in stage px (default 34 ≈ 51 px @1080p) */
  fontSize?: number;
  caption?: string;
  /** equation number, set flush right, e.g. "(1)" */
  number?: string;
  /** small-caps heading */
  title?: string;
  /** 0..1 ink the equation in from the left (default 1) */
  reveal?: number;
  opacity?: number;
  seed?: number;
  rotate?: number;
}
export function EquationPlate({ tex, x, y, width = 720, height = 260, fontSize = 34, caption, number, title, reveal = 1, opacity = 1, seed = 11, rotate = 0 }: EquationPlateProps) {
  const uid = useId().replace(/:/g, '');
  const hw = width / 2;
  const hh = height / 2;
  const eqY = caption ? -12 : 0;
  const r = Math.max(0, Math.min(1, reveal));
  const inner = width - 60;
  return (
    <ParchmentPlate x={x} y={y} width={width} height={height} seed={seed} opacity={opacity} title={title} rotate={rotate}>
      <defs>
        <linearGradient id={`rv${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset={Math.max(0, r * 1.08 - 0.08)} stopColor="#fff" stopOpacity={1} />
          <stop offset={Math.min(1, r * 1.08)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`m${uid}`} maskUnits="userSpaceOnUse" x={-hw} y={-hh} width={width} height={height}>
          <rect x={-inner / 2} y={-hh} width={inner} height={height} fill={`url(#rv${uid})`} />
        </mask>
      </defs>
      <g mask={r < 1 ? `url(#m${uid})` : undefined}>
        <MathLabel tex={tex} x={0} y={eqY} fontSize={fontSize} color={INK} display boxWidth={inner} />
      </g>
      {number && (
        <text x={hw - 34} y={eqY + fontSize * 0.3} textAnchor="end" fill={INK} opacity={0.75 * r} style={{ font: `400 22px "EB Garamond"` }}>
          {number}
        </text>
      )}
      {caption && <InkCaption x={0} y={hh - 34} text={caption} opacity={r} />}
    </ParchmentPlate>
  );
}

export interface InkCaptionProps {
  x: number;
  y: number;
  text: string;
  /** stage px (default 20 ≈ 30 px @1080p; never below 17.4) */
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
  opacity?: number;
  color?: string;
}
export function InkCaption({ x, y, text, size = 20, anchor = 'middle', italic = true, opacity = 1, color = INK }: InkCaptionProps) {
  if (opacity <= 0) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity * 0.85} style={{ font: `${italic ? 'italic ' : ''}400 ${Math.max(17.4, size)}px "EB Garamond"` }}>
      {text}
    </text>
  );
}
