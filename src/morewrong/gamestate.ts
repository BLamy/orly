// MoreWrong v2 game state: three clamped stats (misalignment / capability /
// runway) + flags, a pure effects reducer, first-match routing for the resolve
// node, and localStorage persistence (v2 key so old linear saves don't collide).
import { evalCondition, type Ctx } from './condition';
import { START_NODE, START_STATS, STAT_KEYS, type Effects, type GraphNode } from './graph';

export interface Stats { misalignment: number; capability: number; runway: number }
export interface GameState {
  stats: Stats;
  flags: Record<string, number | boolean>;
  nodeId: string;
}

const KEY = 'morewrong.save.v2';
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function newGame(): GameState {
  return { stats: { ...(START_STATS as Stats) }, flags: {}, nodeId: START_NODE };
}

/** Pure: apply an effects block (per-stat deltas + flag sets), moving to nextNode. */
export function applyEffects(s: GameState, e: Effects | undefined, nextNode: string): GameState {
  const stats: Stats = { ...s.stats };
  const flags = { ...s.flags };
  if (e) {
    for (const k of STAT_KEYS) {
      const d = e[k];
      if (typeof d === 'number') stats[k] = clamp(stats[k] + d);
    }
    if (e.setFlags) for (const [k, v] of Object.entries(e.setFlags)) flags[k] = v;
  }
  return { stats, flags, nodeId: nextNode };
}

/** Applied once on node entry (its onEnter effects), same node. */
export function applyOnEnter(s: GameState, e: Effects | undefined): GameState {
  if (!e) return s;
  const touches = STAT_KEYS.some((k) => typeof e[k] === 'number') || !!e.setFlags;
  return touches ? applyEffects(s, e, s.nodeId) : s;
}

export function ctxOf(s: GameState): Ctx {
  return { ...s.stats, ...s.flags };
}

/** First matching route rule → next node id (falls back to the last rule). */
export function routeNext(node: GraphNode, s: GameState): string | null {
  if (!node.route?.length) return null;
  const ctx = ctxOf(s);
  for (const r of node.route) {
    try { if (evalCondition(r.when, ctx)) return r.to; } catch { /* skip bad rule */ }
  }
  return node.route[node.route.length - 1].to;
}

export function save(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s && s.stats && typeof s.stats.misalignment === 'number' && s.nodeId) return s;
  } catch { /* ignore */ }
  return null;
}
export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
