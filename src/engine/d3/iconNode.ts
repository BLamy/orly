import * as d3 from 'd3';

type AnySel = d3.Selection<any, any, any, any>;

/** Inline SVG markup vs a URL/data-URI/path. */
export function isInlineSvg(icon: string): boolean {
  return /^\s*</.test(icon);
}

/** Append a centered icon (size×size, origin at the parent's 0,0) to `parent`.
 *  Inline `<svg>` markup is injected as a nested svg; anything else is an
 *  `<image>`. Returns the appended selection. */
export function appendIcon(parent: AnySel, icon: string, size: number, className: string): AnySel {
  if (isInlineSvg(icon)) {
    const svg = parent
      .append('svg')
      .attr('class', className)
      .attr('x', -size / 2)
      .attr('y', -size / 2)
      .attr('width', size)
      .attr('height', size)
      .attr('overflow', 'visible');
    (svg as any).html(icon);
    return svg;
  }
  return parent
    .append('image')
    .attr('class', className)
    .attr('href', icon)
    .attr('x', -size / 2)
    .attr('y', -size / 2)
    .attr('width', size)
    .attr('height', size)
    .attr('preserveAspectRatio', 'xMidYMid meet');
}
