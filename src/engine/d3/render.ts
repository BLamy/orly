import * as d3 from 'd3';
import type { Badge, DiagramEdge, DiagramNode, Step, Story } from '../../types';
import { connector, NODE_H, NODE_W, nodeCenter } from '../geometry';
import { KIND_COLOR, MSG_COLOR } from './colors';
import { ICONS } from './icons';
import { appendIcon } from './iconNode';

// The fixed coordinate system the camera moves within. Nodes live in
// world coords (0..1000 x 0..600); the camera <g> pans/zooms to frame them.
export const VB_W = 1200;
export const VB_H = 680;

type AnySel = d3.Selection<any, any, any, any>;

/** Nodes visible at a step = cumulative reveals minus cumulative hides. A pure
 *  function of the index, so stepping backward recomputes correctly. */
function visibleNodeIds(story: Story, stepIndex: number): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i <= stepIndex; i++) {
    for (const r of story.steps[i].reveal ?? []) ids.add(r);
    for (const h of story.steps[i].hide ?? []) ids.delete(h);
  }
  return ids;
}

/** One-time scaffolding: defs (arrow marker) + layer groups. */
function setup(svg: AnySel) {
  const defs = svg.append('defs');
  defs
    .append('marker')
    .attr('id', 'arrow')
    .attr('markerWidth', 9)
    .attr('markerHeight', 9)
    .attr('refX', 7)
    .attr('refY', 4.5)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M1,1 L8,4.5 L1,8 z')
    .attr('class', 'edge-arrow');

  const camera = svg.append('g').attr('class', 'camera');
  camera.append('g').attr('class', 'layer-edges');
  camera.append('g').attr('class', 'layer-nodes');
  camera.append('g').attr('class', 'layer-packets');
  // cover sits outside the camera so the headline stays screen-centered.
  svg.append('g').attr('class', 'layer-cover').style('display', 'none').style('opacity', 0);
}

function buildNode(g: AnySel, n: DiagramNode) {
  const color = KIND_COLOR[n.kind];
  g.style('color', color);
  g.append('rect')
    .attr('class', 'node-bg')
    .attr('x', -NODE_W / 2)
    .attr('y', -NODE_H / 2)
    .attr('width', NODE_W)
    .attr('height', NODE_H)
    .attr('rx', 14)
    .attr('stroke', color);

  const slotCx = -NODE_W / 2 + 14 + 13; // center of the 26-unit icon slot
  if (n.icon && (n.iconMode ?? 'replace') === 'replace') {
    const ig = g.append('g').attr('class', 'node-ico-custom').attr('transform', `translate(${slotCx}, 0)`);
    appendIcon(ig, n.icon, 30, 'node-ico-img');
  } else {
    const ig = g
      .append('g')
      .attr('class', 'ico')
      .attr('transform', `translate(${-NODE_W / 2 + 14}, -13) scale(${26 / 24})`);
    for (const sh of ICONS[n.kind]) {
      const el = ig.append(sh.tag);
      for (const [k, v] of Object.entries(sh.attrs)) el.attr(k, v as any);
    }
    if (n.icon && n.iconMode === 'augment') {
      const em = g
        .append('g')
        .attr('class', 'node-ico-emblem')
        .attr('transform', `translate(${-NODE_W / 2 + 13}, ${-NODE_H / 2 + 13})`);
      em.append('circle').attr('class', 'node-emblem-bg').attr('r', 10);
      appendIcon(em, n.icon, 16, 'node-ico-img');
    }
  }

  const tx = -NODE_W / 2 + 14 + 26 + 11;
  if (n.sublabel) {
    g.append('text').attr('class', 'node-label').attr('x', tx).attr('y', -3).text(n.label);
    g.append('text').attr('class', 'node-sub').attr('x', tx).attr('y', 13).text(n.sublabel);
  } else {
    g.append('text').attr('class', 'node-label').attr('x', tx).attr('y', 5).text(n.label);
  }

  g.append('g').attr('class', 'badge-g').style('display', 'none');
}

function updateBadge(g: AnySel, badge: Badge | undefined) {
  const bg = g.select('.badge-g');
  if (!badge) {
    bg.style('display', 'none');
    return;
  }
  bg.style('display', null).selectAll('*').remove();
  const tone = badge.tone ?? 'info';
  const text = bg
    .append('text')
    .attr('class', `badge-text ${tone}`)
    .attr('text-anchor', 'middle')
    .attr('y', 3)
    .text(badge.text.toUpperCase());
  const w = Math.ceil((text.node() as SVGTextElement).getBBox().width) + 16;
  bg.insert('rect', 'text')
    .attr('class', `badge-bg ${tone}`)
    .attr('x', -w / 2)
    .attr('y', -9)
    .attr('width', w)
    .attr('height', 18)
    .attr('rx', 9);
  bg.attr('transform', `translate(${NODE_W / 2 - 8}, ${-NODE_H / 2 + 2})`);
}

/** Pan/zoom the camera to frame all currently-visible nodes (with padding). */
function fitCamera(camera: AnySel, nodes: DiagramNode[], t: any, reduced: boolean) {
  let tr: string;
  if (nodes.length === 0) {
    tr = `translate(${VB_W / 2 - 500}, ${VB_H / 2 - 300}) scale(1)`;
  } else {
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const n of nodes) {
      const c = nodeCenter(n);
      minx = Math.min(minx, c.x - NODE_W / 2);
      maxx = Math.max(maxx, c.x + NODE_W / 2);
      miny = Math.min(miny, c.y - NODE_H / 2);
      maxy = Math.max(maxy, c.y + NODE_H / 2);
    }
    const P = 120;
    minx -= P; miny -= P; maxx += P; maxy += P;
    const bw = maxx - minx;
    const bh = maxy - miny;
    const s = Math.max(0.8, Math.min(1.4, Math.min(VB_W / bw, VB_H / bh)));
    const cx = (minx + maxx) / 2;
    const cy = (miny + maxy) / 2;
    tr = `translate(${VB_W / 2 - s * cx}, ${VB_H / 2 - s * cy}) scale(${s})`;
  }
  if (reduced) camera.attr('transform', tr);
  else camera.transition(t).attr('transform', tr);
}

function renderCover(g: AnySel, step: Step, dur: number, reduced: boolean, coverNote?: string) {
  g.style('display', null);
  if (g.attr('data-step') !== step.id) {
    g.attr('data-step', step.id).selectAll('*').remove();
    g.append('text')
      .attr('class', 'cover-title')
      .attr('x', VB_W / 2)
      .attr('y', VB_H / 2 - 8)
      .attr('text-anchor', 'middle')
      .text(step.title ?? '');
    if (step.coverSubtitle) {
      g.append('text')
        .attr('class', 'cover-sub')
        .attr('x', VB_W / 2)
        .attr('y', VB_H / 2 + 34)
        .attr('text-anchor', 'middle')
        .text(step.coverSubtitle);
    }
    if (coverNote) {
      g.append('text')
        .attr('class', 'cover-note')
        .attr('x', VB_W / 2)
        .attr('y', VB_H / 2 + (step.coverSubtitle ? 66 : 30))
        .attr('text-anchor', 'middle')
        .text(coverNote);
    }
    g.style('opacity', 0);
  }
  if (reduced) g.style('opacity', 1);
  else g.transition('cover').duration(dur).style('opacity', 1);
}

function firePackets(layer: AnySel, step: Step, byId: Map<string, DiagramNode>, visible: Set<string>) {
  layer.selectAll('*').interrupt().remove();
  for (const m of step.messages ?? []) {
    const a = byId.get(m.from);
    const b = byId.get(m.to);
    if (!a || !b || !visible.has(m.from) || !visible.has(m.to)) continue;
    const { start, end } = connector(a, b);
    const color = MSG_COLOR[m.kind ?? 'request'];
    const delay = m.delay ?? 0;
    const duration = m.duration ?? 950;

    const g = layer
      .append('g')
      .attr('class', 'packet')
      .style('color', color)
      .style('opacity', 0)
      .attr('transform', `translate(${start.x}, ${start.y})`);
    g.append('circle').attr('class', 'packet-halo').attr('r', 13).attr('fill', color);
    const pulse = g.append('g').attr('class', 'packet-pulse');
    if (m.icon) {
      appendIcon(pulse, m.icon, 22, 'packet-ico');
    } else {
      pulse.append('circle').attr('class', 'packet-core').attr('r', 5.5).attr('fill', color);
    }
    if (m.label) {
      g.append('text').attr('class', 'packet-label').attr('y', -17).attr('text-anchor', 'middle').text(m.label);
    }

    g.transition('in')
      .delay(delay)
      .duration(150)
      .style('opacity', 1)
      .on('end', () => {
        // gentle breathing pulse on the inner group (scales about its center)
        const loop = (sel: AnySel) =>
          sel
            .transition('pulse').duration(520).ease(d3.easeSinInOut).attr('transform', 'scale(1.16)')
            .transition().duration(520).ease(d3.easeSinInOut).attr('transform', 'scale(1)')
            .on('end', () => loop(sel));
        loop(pulse);
      });
    g.transition('move')
      .delay(delay)
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .attrTween('transform', () => {
        const ix = d3.interpolateNumber(start.x, end.x);
        const iy = d3.interpolateNumber(start.y, end.y);
        return (k) => `translate(${ix(k)}, ${iy(k)})`;
      });
    g.transition('out').delay(delay + duration - 180).duration(200).style('opacity', 0).remove();
  }
}

export function renderDiagram(svgEl: SVGSVGElement, story: Story, stepIndex: number, reduced: boolean, coverNote?: string) {
  const svg = d3.select(svgEl);
  if (svg.select('g.camera').empty()) setup(svg);

  const step = story.steps[stepIndex];
  const dur = reduced ? 0 : 650;
  const t = d3.transition().duration(dur).ease(d3.easeCubicInOut) as any;

  const byId = new Map(story.nodes.map((n) => [n.id, n]));
  const visible = visibleNodeIds(story, stepIndex);
  const nodes = story.nodes.filter((n) => visible.has(n.id));
  const edges = story.edges.filter((e) => visible.has(e.from) && visible.has(e.to));

  const highlight = step.highlight ?? [];
  const hasFocus = highlight.length > 0;
  const nodeDim = (id: string) => (hasFocus && !highlight.includes(id) ? 0.32 : 1);

  const msgPairs = new Set((step.messages ?? []).map((m) => `${m.from}>${m.to}`));
  const edgeActive = (e: DiagramEdge) =>
    (step.activeEdges?.includes(e.id) ?? false) ||
    msgPairs.has(`${e.from}>${e.to}`) ||
    msgPairs.has(`${e.to}>${e.from}`);
  const edgeOpacity = (e: DiagramEdge) =>
    hasFocus && !highlight.includes(e.from) && !highlight.includes(e.to) ? 0.16 : 0.95;

  const camera = svg.select('g.camera');
  fitCamera(camera, nodes, t, reduced);

  // ---- edges -------------------------------------------------------------
  const edgeJoin = camera
    .select('.layer-edges')
    .selectAll<SVGGElement, DiagramEdge>('g.edge')
    .data(edges, (d) => d.id);

  edgeJoin.exit().interrupt().transition(t).style('opacity', 0).remove();

  const edgeEnter = edgeJoin.enter().append('g').attr('class', 'edge').style('opacity', 0);
  edgeEnter.append('line').attr('marker-end', 'url(#arrow)');

  const edgeAll = edgeEnter.merge(edgeJoin as any);
  edgeAll.select('line').each(function (d) {
    const { start, end } = connector(byId.get(d.from)!, byId.get(d.to)!);
    d3.select(this)
      .attr('class', `edge-line${edgeActive(d) ? ' active' : ''}${d.dashed ? ' dashed' : ''}`)
      .attr('x1', start.x).attr('y1', start.y).attr('x2', end.x).attr('y2', end.y);
  });
  // draw entering (solid) edges in along their length
  edgeEnter.select('line').each(function (d) {
    if (d.dashed) return;
    const { start, end } = connector(byId.get(d.from)!, byId.get(d.to)!);
    const len = Math.hypot(end.x - start.x, end.y - start.y);
    d3.select(this)
      .attr('stroke-dasharray', len)
      .attr('stroke-dashoffset', len)
      .transition('draw')
      .duration(dur)
      .ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);
  });
  edgeAll.transition(t).style('opacity', (d) => edgeOpacity(d));

  // ---- nodes -------------------------------------------------------------
  const nodeJoin = camera
    .select('.layer-nodes')
    .selectAll<SVGGElement, DiagramNode>('g.node')
    .data(nodes, (d) => d.id);

  nodeJoin
    .exit()
    .interrupt()
    .transition(t)
    .style('opacity', 0)
    .attr('transform', function () {
      const tr = (this as SVGGElement).getAttribute('transform') ?? '';
      return tr.replace(/scale\([^)]*\)/, 'scale(0.7)');
    })
    .remove();

  const nodeEnter = nodeJoin
    .enter()
    .append('g')
    .attr('class', 'node')
    .style('opacity', 0)
    .attr('transform', (d) => {
      const c = nodeCenter(d);
      return `translate(${c.x}, ${c.y}) scale(0.85)`;
    });
  nodeEnter.each(function (d) {
    buildNode(d3.select(this), d);
  });

  const nodeAll = nodeEnter.merge(nodeJoin as any);
  nodeAll.classed('active', (d) => highlight.includes(d.id));
  nodeAll.each(function (d) {
    updateBadge(d3.select(this), (step.badges ?? []).find((b) => b.node === d.id));
  });
  nodeAll
    .transition(t)
    .style('opacity', (d) => nodeDim(d.id))
    .attr('transform', (d) => {
      const c = nodeCenter(d);
      return `translate(${c.x}, ${c.y}) scale(${highlight.includes(d.id) ? 1.05 : 1})`;
    });

  // ---- packets & cover ---------------------------------------------------
  if (!reduced) firePackets(camera.select('.layer-packets'), step, byId, visible);

  const cover = svg.select('g.layer-cover');
  if (step.cover) {
    renderCover(cover, step, dur, reduced, coverNote);
  } else if (cover.style('display') !== 'none') {
    cover.transition('cover').duration(dur).style('opacity', 0).on('end', function () {
      d3.select(this).style('display', 'none').attr('data-step', null);
    });
  }
}
