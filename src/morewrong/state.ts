// MoreWrong game state: the clamped controlGap meter + canonical flags, the
// pure reducer that applies a choice's effects, localStorage persistence, and
// ending selection (first matching `when` in Book 20's endings block).
import { BOOKS, METER_MAX, METER_MIN, START_METER, type Effects, type Ending } from './data';
import { evalCondition, type Ctx } from './condition';

export interface GameState {
  controlGap: number;
  flags: Record<string, number | boolean>;
  nodeId: string; // current node
}

const KEY = 'morewrong.save.v1';

export function newGame(): GameState {
  return { controlGap: START_METER, flags: {}, nodeId: 'b01_start' };
}

const clamp = (n: number) => Math.max(METER_MIN, Math.min(METER_MAX, n));

/** Pure: apply an effects block (meter delta + flag sets), returning new state. */
export function applyEffects(s: GameState, e: Effects | undefined, nextNode: string): GameState {
  const flags = { ...s.flags };
  if (e?.setFlags) for (const [k, v] of Object.entries(e.setFlags)) flags[k] = v;
  return {
    controlGap: clamp(s.controlGap + (e?.meterDelta ?? 0)),
    flags,
    nodeId: nextNode,
  };
}

/** Applied when a node is entered (its onEnter effects), keeping the same node. */
export function applyOnEnter(s: GameState, e: Effects | undefined): GameState {
  if (!e || (!e.meterDelta && !e.setFlags)) return s;
  const next = applyEffects(s, e, s.nodeId);
  return next;
}

export function ctxOf(s: GameState): Ctx {
  return { controlGap: s.controlGap, ...s.flags };
}

/** Book 20's endings, evaluated top-to-bottom; first match wins. */
export function pickEnding(s: GameState): Ending | null {
  const b20 = BOOKS[20];
  if (!b20?.endings) return null;
  const ctx = ctxOf(s);
  for (const e of b20.endings) {
    try {
      if (evalCondition(e.when, ctx)) return e;
    } catch {
      /* a malformed condition is skipped, not fatal */
    }
  }
  return b20.endings[b20.endings.length - 1] ?? null;
}

export function save(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (typeof s.controlGap === 'number' && s.nodeId) return s;
  } catch { /* ignore */ }
  return null;
}
export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
