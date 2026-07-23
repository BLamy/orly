// MoreWrong v2 — the branching game graph. One node graph (script/graph.json),
// not a linear book list. Nodes are decisions/beats/endings; `next` can point
// anywhere (true divergence), and leaf `ending` nodes are the endings.
import graph from './script/graph.json';

export type StatKey = 'misalignment' | 'capability' | 'runway';

export interface Effects {
  misalignment?: number;
  capability?: number;
  runway?: number;
  setFlags?: Record<string, number | boolean>;
}
export interface Choice {
  label: string;
  detail?: string;
  effects?: Effects;
  next: string;
}
export interface RouteRule { when: string; to: string }
export interface EndingInfo { title: string; rank?: string; text: string }
export interface GraphNode {
  id: string;
  kind: 'beat' | 'decision' | 'ending';
  beat?: string;
  viz?: string;
  onEnter?: Effects;
  choices?: Choice[];
  /** on a routing beat: first matching `when` picks the next node */
  route?: RouteRule[];
  ending?: EndingInfo;
}

const g = graph as {
  start: string;
  stats: Record<StatKey, number>;
  nodes: GraphNode[];
};

export const START_NODE = g.start;
export const START_STATS: Record<StatKey, number> = g.stats;
export const STAT_KEYS: StatKey[] = ['misalignment', 'capability', 'runway'];

export const NODES: Record<string, GraphNode> = {};
for (const n of g.nodes) NODES[n.id] = n;

export function getNode(id: string): GraphNode | undefined {
  return NODES[id];
}
