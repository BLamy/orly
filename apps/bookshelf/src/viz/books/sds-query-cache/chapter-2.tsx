// The Least Recently Used Machine
//
// Backed by: solutions/system_design/query_cache/README.md ("Cache
// implementation": a doubly linked list — new items added at the head, expired
// items removed from the tail — plus a hash table for fast lookups to each
// node) and query_cache_snippets.py (Node, LinkedList.move_to_front /
// append_to_front / remove_from_tail, Cache.__init__ with MAX_SIZE, size,
// lookup, linked_list; Cache.get moves a hit to the front; Cache.set evicts
// the tail when at capacity, popping it from lookup too).
//
// ONE machine: the hash table `lookup` on the left, the doubly linked list as
// a chain of cars across the stage, head on the left, tail on the right,
// MAX_SIZE of four. We run the real operations: a get that hits and rides to
// the front, a get that misses, a set at capacity that drops the tail car and
// slots a new one in at the head. Every position is a pure lerp between
// precomputed list snapshots.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The queries and the list snapshots. States are head→tail arrays of query
// ids; playback lerps node positions between consecutive states.
// ---------------------------------------------------------------------------

const QUERIES = [
  'best AND coffee AND sf', // 0 — arrives via set()
  'weather AND nyc', // 1
  'javascript AND closures', // 2
  'world AND cup AND final', // 3
  'flights AND sfo AND jfk', // 4 — the eviction victim
] as const;

const MAX_SIZE = 4;

// head → tail
const STATES: number[][] = [
  [1, 3, 2, 4], // S0 warm cache
  [3, 1, 2, 4], // S1 after get("world cup") → move_to_front
  [0, 3, 1, 2], // S2 after set("best coffee") → tail 4 evicted, 0 appended front
  [1, 0, 3, 2], // S3 after get("weather nyc") → move_to_front
];

const LIST = { x0: 330, y: 330, slotW: 225, w: 200, h: 74 } as const;
const slotX = (i: number): number => LIST.x0 + i * LIST.slotW;

// hash table rows, fixed vertical order (by fake bucket)
const TBL = { x: 60, y0: 150, w: 208, rowH: 58 } as const;
const TBL_ORDER = [2, 4, 1, 0, 3]; // query id per row
const tblRowOf = (q: number): number => TBL_ORDER.indexOf(q);

const CAM_TABLE: CameraState = { x: 330, y: 300, k: 1.35 };
const CAM_LIST: CameraState = { x: 700, y: 330, k: 1.18 };
const CAM_TAIL: CameraState = { x: 980, y: 380, k: 1.35 };
const CAM_HEAD: CameraState = { x: 460, y: 320, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tableU: ChannelRef<number>;
  listU: ChannelRef<number>;
  stateF: ChannelRef<number>;
  jump1: ChannelRef<number>;
  missU: ChannelRef<number>;
  evictU: ChannelRef<number>;
  insertU: ChannelRef<number>;
  jump2: ChannelRef<number>;
  heatU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('tableU', 0); // lookup hash table reveal
  const listU = tl.channel('listU', 0); // linked list reveal
  const stateF = tl.channel('stateF', 0); // fractional index into STATES
  const jump1 = tl.channel('jump1', 0); // lookup → node pointer flash (hit 1)
  const missU = tl.channel('missU', 0); // the miss flash
  const evictU = tl.channel('evictU', 0); // tail car falls off
  const insertU = tl.channel('insertU', 0); // new car drops in at head
  const jump2 = tl.channel('jump2', 0); // second hit pointer flash
  const heatU = tl.channel('heatU', 0); // head-hot / tail-cold gradient
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two structures —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'The cache is two data structures working as one machine. A hash table, for finding any entry instantly. And a doubly linked list, for remembering which entries were used last.',
  });
  tl.tween(tableU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(listU, 1, { at: 2.6, dur: 1.8, ease: ease.draw });
  tl.hold(7.5, 0.5);

  // — Beat 2 · the geography —
  tl.caption({
    at: 8.0,
    dur: 6.5,
    text: 'The list has a geography. New and recently used entries live at the head, on the left. The longer an entry goes unused, the further it drifts toward the tail.',
  });
  tl.tween(cam, CAM_LIST, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.tween(heatU, 1, { at: 9.0, dur: 1.6, ease: ease.move });
  tl.hold(14.5, 0.5);

  // — Beat 3 · a get that hits —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'A query about the world cup arrives. The hash table jumps straight to its node, no walking the list, and the results come back immediately.',
  });
  tl.tween(cam, CAM_TABLE, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.tween(jump1, 1, { at: 16.4, dur: 1.6, ease: ease.linear });
  tl.hold(21.5, 0.5);

  // — Beat 4 · move to front —
  tl.caption({
    at: 22.0,
    dur: 6,
    text: 'But the get does one more thing. The node it touched rides to the front of the list. Being used is what keeps an entry alive.',
  });
  tl.tween(cam, CAM_LIST, { at: 22.2, dur: 1.3, ease: ease.move });
  tl.tween(stateF, 1, { at: 23.2, dur: 1.6, ease: ease.move });
  tl.tween(jump1, 0, { at: 24.8, dur: 0.8, ease: ease.move });
  tl.hold(28.0, 0.5);

  // — Beat 5 · a miss —
  tl.caption({
    at: 28.5,
    dur: 5.5,
    text: 'Now a brand new query, best coffee in San Francisco. The hash table has no entry for it. The get returns nothing, a miss.',
  });
  tl.tween(cam, CAM_TABLE, { at: 28.7, dur: 1.3, ease: ease.move });
  tl.tween(missU, 1, { at: 30.0, dur: 0.7, ease: ease.pop });
  tl.tween(missU, 0, { at: 32.4, dur: 0.9, ease: ease.move });
  tl.hold(34.0, 0.5);

  // — Beat 6 · set at capacity: evict —
  tl.caption({
    at: 34.5,
    dur: 6.5,
    text: 'The backend computes the answer, and the cache stores it. But the cache is at its maximum size. Before anything goes in, something must go.',
  });
  tl.tween(cam, CAM_TAIL, { at: 35.0, dur: 1.4, ease: ease.move });
  tl.hold(41.0, 0.3);

  tl.caption({
    at: 41.3,
    dur: 6,
    text: 'The victim is whoever sits at the tail, the least recently used entry. It is removed from the list, and its key is popped from the hash table. Both structures, always in sync.',
  });
  tl.tween(evictU, 1, { at: 42.2, dur: 1.6, ease: ease.move });
  tl.hold(47.5, 0.3);

  // — Beat 7 · append to front —
  tl.caption({
    at: 47.8,
    dur: 6,
    text: 'Then the new entry is appended at the head, and the hash table learns its key. The freshest answer in the cache is the one that just cost us a trip to the backend.',
  });
  tl.tween(cam, CAM_HEAD, { at: 48.0, dur: 1.4, ease: ease.move });
  tl.tween(insertU, 1, { at: 48.8, dur: 1.4, ease: ease.move });
  tl.tween(stateF, 2, { at: 48.8, dur: 1.4, ease: ease.move });
  tl.hold(54.0, 0.5);

  // — Beat 8 · the rhythm —
  tl.caption({
    at: 54.5,
    dur: 6,
    text: 'One more hit, and you can feel the rhythm. Weather in New York gets asked again, and rides to the front. Hot queries circulate near the head. Cold ones drift off the end.',
  });
  tl.tween(cam, CAM_LIST, { at: 54.7, dur: 1.4, ease: ease.move });
  tl.tween(jump2, 1, { at: 55.6, dur: 1.0, ease: ease.linear });
  tl.tween(stateF, 3, { at: 56.8, dur: 1.5, ease: ease.move });
  tl.tween(jump2, 0, { at: 58.5, dur: 0.8, ease: ease.move });
  tl.hold(60.5, 0.5);

  // — Beat 9 · why both structures —
  tl.caption({
    at: 61.0,
    dur: 7,
    text: 'Notice why it takes both structures. The hash table makes every lookup constant time. The linked list makes every promotion and eviction constant time. Neither could run this cache alone.',
  });
  tl.hold(68.0, 0.5);

  // — Beat 10 · close —
  tl.caption({
    at: 68.5,
    dur: 6.5,
    text: 'That is least recently used caching: the cache never guesses what is popular. It just watches what you touch, and quietly forgets whatever you stop touching.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 68.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.1, dur: 1.4, ease: ease.move });
  tl.hold(75.0, 1.5);

  return { tl, cam, tableU, listU, stateF, jump1, missU, evictU, insertU, jump2, heatU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** position (slot index, possibly fractional) of query q at fractional state f */
function slotOf(q: number, f: number): number | null {
  const k = Math.min(STATES.length - 2, Math.max(0, Math.floor(f)));
  const u = clamp01(f - k);
  const a = STATES[k].indexOf(q);
  const b = STATES[k + 1] ? STATES[k + 1].indexOf(q) : a;
  if (a < 0 && b < 0) return null;
  if (a < 0) return b; // entering (handled via insertU visuals)
  if (b < 0) return a; // leaving (handled via evictU visuals)
  return lerp(a, b, u);
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tableU = s.get(scene.tableU);
  const listU = s.get(scene.listU);
  const stateF = s.get(scene.stateF);
  const jump1 = s.get(scene.jump1);
  const missU = s.get(scene.missU);
  const evictU = s.get(scene.evictU);
  const insertU = s.get(scene.insertU);
  const jump2 = s.get(scene.jump2);
  const heatU = s.get(scene.heatU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  // which queries currently live in the lookup table
  const inTable = (q: number): boolean => {
    if (q === 4) return evictU < 0.6;
    if (q === 0) return insertU > 0.5;
    return true;
  };

  const nodes = QUERIES.map((_, q) => {
    if (q === 0 && insertU <= 0) return null;
    if (q === 4 && stateF >= 1.999 && evictU >= 1) return null;
    let x: number;
    let y = LIST.y;
    let op = 1;
    if (q === 4 && evictU > 0) {
      // tail car falls off
      x = slotX(3);
      y = LIST.y + evictU * 150;
      op = 1 - evictU;
    } else if (q === 0) {
      // new car drops in at the head
      x = slotX(0);
      y = LIST.y - (1 - insertU) * 130;
      op = insertU;
    } else {
      const sl = slotOf(q, stateF);
      if (sl === null) return null;
      x = slotX(sl);
    }
    return { q, x, y, op };
  }).filter((n): n is { q: number; x: number; y: number; op: number } => n !== null);

  const hl1 = 3; // world cup
  const hl2 = 1; // weather
  const nodeCenter = (q: number): { x: number; y: number } | null => {
    const n = nodes.find((m) => m.q === q);
    return n ? { x: n.x + LIST.w / 2, y: n.y + LIST.h / 2 } : null;
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the lookup hash table ---- */}
        <g opacity={tableU * dimAll}>
          <text x={TBL.x} y={TBL.y0 - 34} fill={colors.TEXT} fontSize={16}>
            the hash table
          </text>
          <text x={TBL.x} y={TBL.y0 - 14} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
            lookup — key: query, value: node
          </text>
          {TBL_ORDER.map((q, r) => {
            const present = inTable(q);
            const isMissRow = q === 0 && !present;
            const flash = (q === hl1 ? jump1 : 0) + (q === hl2 ? jump2 : 0) + (isMissRow ? missU : 0);
            const y = TBL.y0 + r * TBL.rowH;
            return (
              <g key={q} opacity={present ? 1 : 0.35}>
                <rect
                  x={TBL.x}
                  y={y}
                  width={TBL.w}
                  height={TBL.rowH - 10}
                  rx={8}
                  fill={colors.PANEL}
                  stroke={flash > 0.05 ? (isMissRow ? colors.NEGATIVE : colors.ACCENT) : colors.GRID}
                  strokeWidth={flash > 0.05 ? 2 : 1.1}
                />
                <text x={TBL.x + 12} y={y + 20} fill={colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {present ? QUERIES[q] : isMissRow && missU > 0.05 ? QUERIES[q] : '—'}
                </text>
                <text x={TBL.x + 12} y={y + 37} fill={isMissRow ? colors.NEGATIVE : colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
                  {present ? '→ node' : isMissRow && missU > 0.05 ? '→ None (miss)' : ''}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- pointer flash: table row → list node ---- */}
        {([
          { q: hl1, u: jump1 },
          { q: hl2, u: jump2 },
        ] as const).map(({ q, u }) => {
          if (u <= 0.02) return null;
          const c = nodeCenter(q);
          if (!c) return null;
          const ry = TBL.y0 + tblRowOf(q) * TBL.rowH + (TBL.rowH - 10) / 2;
          return (
            <g key={q} opacity={dimAll}>
              <line x1={TBL.x + TBL.w} y1={ry} x2={lerp(TBL.x + TBL.w, c.x - LIST.w / 2, clamp01(u * 1.4))} y2={lerp(ry, c.y, clamp01(u * 1.4))} stroke={colors.ACCENT} strokeWidth={2} opacity={0.85} />
              <circle cx={lerp(TBL.x + TBL.w, c.x - LIST.w / 2, clamp01(u * 1.4))} cy={lerp(ry, c.y, clamp01(u * 1.4))} r={5} fill={colors.ACCENT} />
            </g>
          );
        })}

        {/* ---- the doubly linked list ---- */}
        <g opacity={listU * dimAll}>
          <text x={slotX(0)} y={LIST.y - 66} fill={colors.TEXT} fontSize={16}>
            the doubly linked list
          </text>
          <text x={slotX(0)} y={LIST.y - 46} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            MAX_SIZE = 4 · head ⇄ … ⇄ tail
          </text>
          {/* heat gradient labels */}
          <g opacity={heatU}>
            <text x={slotX(0)} y={LIST.y + LIST.h + 34} fill={colors.POSITIVE} fontSize={13}>
              head — recently used
            </text>
            <text x={slotX(3) + LIST.w} y={LIST.y + LIST.h + 34} textAnchor="end" fill={colors.NEGATIVE} fontSize={13}>
              tail — next to go
            </text>
          </g>
          {/* link arrows between adjacent slots */}
          {[0, 1, 2].map((i) => (
            <g key={i} opacity={0.7}>
              <line x1={slotX(i) + LIST.w} y1={LIST.y + LIST.h / 2 - 7} x2={slotX(i + 1)} y2={LIST.y + LIST.h / 2 - 7} stroke={colors.GRID} strokeWidth={1.6} />
              <line x1={slotX(i + 1)} y1={LIST.y + LIST.h / 2 + 7} x2={slotX(i) + LIST.w} y2={LIST.y + LIST.h / 2 + 7} stroke={colors.GRID} strokeWidth={1.6} />
            </g>
          ))}
        </g>

        {/* ---- the node cars ---- */}
        {nodes.map((n) => {
          const heat = heatU * clamp01(1 - (n.x - LIST.x0) / (LIST.slotW * 3.2));
          const flash = (n.q === hl1 ? jump1 : 0) + (n.q === hl2 ? jump2 : 0);
          const isEvict = n.q === 4 && evictU > 0;
          return (
            <g key={n.q} opacity={listU * n.op * dimAll}>
              <rect
                x={n.x}
                y={n.y}
                width={LIST.w}
                height={LIST.h}
                rx={12}
                fill={colors.PANEL}
                stroke={isEvict ? colors.NEGATIVE : flash > 0.05 ? colors.ACCENT : n.q === 0 ? colors.POSITIVE : colors.GRID}
                strokeWidth={flash > 0.05 || isEvict || n.q === 0 ? 2 : 1.2}
              />
              <rect x={n.x} y={n.y} width={5} height={LIST.h} rx={2.5} fill={colors.POSITIVE} opacity={0.15 + heat * 0.75} />
              <text x={n.x + 16} y={n.y + 30} fill={colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
                {QUERIES[n.q]}
              </text>
              <text x={n.x + 16} y={n.y + 52} fill={colors.MUTED} fontSize={10.5}>
                results · title + snippet
              </text>
            </g>
          );
        })}

        {/* op labels near the action */}
        {jump1 > 0.15 && jump1 < 1 && stateF < 1 && (
          <text x={TBL.x + TBL.w + 20} y={TBL.y0 - 14} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace" opacity={dimAll}>
            get(query) → move_to_front(node)
          </text>
        )}
        {missU > 0.15 && (
          <text x={TBL.x + TBL.w + 20} y={TBL.y0 - 14} fill={colors.NEGATIVE} fontSize={12} fontFamily="ui-monospace, monospace" opacity={dimAll}>
            get(query) → None
          </text>
        )}
        {evictU > 0.1 && evictU < 1 && (
          <text x={slotX(3)} y={LIST.y + LIST.h + 96} fill={colors.NEGATIVE} fontSize={12} fontFamily="ui-monospace, monospace" opacity={dimAll}>
            remove_from_tail() · lookup.pop(tail.query)
          </text>
        )}
        {insertU > 0.1 && insertU < 1 && (
          <text x={slotX(0)} y={LIST.y - 96} fill={colors.POSITIVE} fontSize={12} fontFamily="ui-monospace, monospace" opacity={dimAll}>
            append_to_front(new_node) · lookup[query] = new_node
          </text>
        )}

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={215} width={700} height={240} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={264} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            least recently used, in two structures
          </text>
          <text x={640} y={316} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
            lookup[query] → node · O(1) find
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily="ui-monospace, monospace">
            move_to_front · append_to_front · remove_from_tail · O(1) each
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            touch it and it lives — ignore it and it drifts to the tail
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
