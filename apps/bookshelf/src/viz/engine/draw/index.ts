import * as d3 from 'd3'
import { font, ink } from '../core/colors'

/**
 * Imperative D3 draw helpers for scenes that render with selections instead
 * of (or inside) React. Everything here is pure/deterministic in `t` — no
 * transitions, no wall-clock reads — so scrubbing stays exact.
 */

export type G = d3.Selection<SVGGElement, unknown, null, undefined>
export type Defs = d3.Selection<SVGDefsElement, unknown, null, undefined>

export const clamp01 = (t: number) => Math.max(0, Math.min(1, t))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const fmt = (x: number, digits = 2) => x.toFixed(digits)

/**
 * Staggered reveal: item i of n gets its own sub-window of the parent t.
 * overlap 0 = strictly sequential, →1 = nearly simultaneous.
 * (Progress-space cousin of the Timeline's `stagger()`, which staggers
 * keyframe *start times* instead.)
 */
export function stagger(t: number, i: number, n: number, overlap = 0.6): number {
  if (n <= 1) return clamp01(t)
  const w = 1 / (1 + (n - 1) * (1 - overlap))
  const start = i * w * (1 - overlap)
  return clamp01((t - start) / w)
}

/** Deterministic PRNG so every render (and every scrub) sees the same "random" data. */
export { mulberry32 } from '../core/prng'

/** One standard-normal pair (Box–Muller) from a seeded uniform source. */
export function gaussianPair(rand: () => number): [number, number] {
  const u = Math.max(rand(), 1e-9)
  const v = rand()
  const r = Math.sqrt(-2 * Math.log(u))
  return [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)]
}

/** Arrowhead marker; returns the marker-end url. One per color. */
export function arrowMarker(defs: Defs, id: string, color: string, size = 5): string {
  const m = defs
    .append('marker')
    .attr('id', id)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', size)
    .attr('markerHeight', size)
    .attr('orient', 'auto')
  m.append('path').attr('d', 'M0,-4L9,0L0,4Z').attr('fill', color)
  return `url(#${id})`
}

/** Soft glow filter for the few luminous focal elements (tips, balls). */
export function glowFilter(defs: Defs, id = 'glow', blur = 3.5): string {
  const f = defs
    .append('filter')
    .attr('id', id)
    .attr('x', '-80%')
    .attr('y', '-80%')
    .attr('width', '260%')
    .attr('height', '260%')
  f.append('feGaussianBlur').attr('stdDeviation', blur).attr('result', 'b')
  const merge = f.append('feMerge')
  merge.append('feMergeNode').attr('in', 'b')
  merge.append('feMergeNode').attr('in', 'SourceGraphic')
  return `url(#${id})`
}

/** Serif-italic math-flavored label. `halo` paints a surface-colored outline so text stays legible over strokes. */
export function mathLabel(
  g: G,
  opts: {
    x: number
    y: number
    text: string
    color?: string
    size?: number
    anchor?: 'start' | 'middle' | 'end'
    italic?: boolean
    mono?: boolean
    halo?: string
  },
) {
  const t = g
    .append('text')
    .attr('x', opts.x)
    .attr('y', opts.y)
    .attr('text-anchor', opts.anchor ?? 'middle')
    .attr('fill', opts.color ?? ink.primary)
    .attr('font-family', opts.mono ? font.mono : font.math)
    .attr('font-style', opts.italic === false || opts.mono ? 'normal' : 'italic')
    .attr('font-size', opts.size ?? 20)
    .text(opts.text)
  if (opts.halo) {
    t.attr('paint-order', 'stroke')
      .attr('stroke', opts.halo)
      .attr('stroke-width', 4)
      .attr('stroke-linejoin', 'round')
  }
  return t
}

/** Plain UI caption (sans, non-italic). */
export function caption(
  g: G,
  opts: { x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end' },
) {
  return g
    .append('text')
    .attr('x', opts.x)
    .attr('y', opts.y)
    .attr('text-anchor', opts.anchor ?? 'middle')
    .attr('fill', opts.color ?? ink.secondary)
    .attr('font-family', font.ui)
    .attr('font-size', opts.size ?? 15)
    .text(opts.text)
}

/** Recessive background grid + slightly brighter zero axes. */
export function grid(
  g: G,
  x: d3.ScaleLinear<number, number>,
  y: d3.ScaleLinear<number, number>,
  opts: { step?: number; color?: string; axisColor?: string } = {},
) {
  const step = opts.step ?? 1
  const color = opts.color ?? ink.grid
  const axisColor = opts.axisColor ?? ink.axis
  const [x0, x1] = x.domain()
  const [y0, y1] = y.domain()
  const layer = g.append('g')
  for (let k = Math.ceil(x0 / step) * step; k <= x1; k += step) {
    layer
      .append('line')
      .attr('x1', x(k))
      .attr('x2', x(k))
      .attr('y1', y(y0))
      .attr('y2', y(y1))
      .attr('stroke', Math.abs(k) < 1e-9 ? axisColor : color)
      .attr('stroke-width', Math.abs(k) < 1e-9 ? 1.5 : 1)
  }
  for (let k = Math.ceil(y0 / step) * step; k <= y1; k += step) {
    layer
      .append('line')
      .attr('y1', y(k))
      .attr('y2', y(k))
      .attr('x1', x(x0))
      .attr('x2', x(x1))
      .attr('stroke', Math.abs(k) < 1e-9 ? axisColor : color)
      .attr('stroke-width', Math.abs(k) < 1e-9 ? 1.5 : 1)
  }
  return layer
}

/**
 * Stroke-dash write-on driven by `t` in 0..1.
 *
 * CAVEAT — length cache: the path's total length is measured once (a DOM
 * read) and cached on the element as `__len`. If you later change the
 * path's `d`, the cached length is stale; call `resetWriteOn(sel)` after
 * mutating `d` so the next `writeOn` re-measures. For paths whose geometry
 * animates every frame, prefer computing the length analytically (as the
 * React `FunctionPlot` primitive does) instead of this helper.
 */
export function writeOn(
  sel: d3.Selection<SVGPathElement, unknown, null, undefined>,
  t: number,
) {
  sel.each(function () {
    const el = this as SVGPathElement & { __len?: number }
    if (el.__len == null) el.__len = el.getTotalLength()
    const L = el.__len
    el.setAttribute('stroke-dasharray', String(L))
    el.setAttribute('stroke-dashoffset', String((1 - clamp01(t)) * L))
  })
}

/** Clear `writeOn`'s cached path length (call after changing a path's `d`). */
export function resetWriteOn(sel: d3.Selection<SVGPathElement, unknown, null, undefined>) {
  sel.each(function () {
    delete (this as SVGPathElement & { __len?: number }).__len
  })
}
