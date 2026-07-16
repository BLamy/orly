// Consistent Hashing: slicing the keyspace
//
// Grounding: README.md "Sharding" (#sharding): rebalancing is the pain, and
// "a sharding function based on consistent hashing can reduce the amount of
// transferred data"; the mod-N strawman is hash_map.py's `key % self.size`
// applied to machines. The ring is the primer's cited fix (its consistent-
// hashing source, paperplanes.de "The magic of consistent hashing").
//
// Centerpiece: the KEYSPACE ITSELF — a spectrum line from 0 to 2^32 that
// visibly BENDS into the hash ring (every key and node rides the bend).
// Ends by giving our key user:42 a home (node B) and pointing at the nodes
// standing next in line — which chapter 3 harvests as the replica set.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const TAU = Math.PI * 2;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Geometry — a line that curls into a circle. For bend u, the segment of
// length L wraps onto a circle of radius L/(TAU*u); the midpoint stays glued.
// Increasing keyspace fraction s runs left→right on the line and CLOCKWISE
// on the ring (bottom → left → top → right), so "walk clockwise" is honest.
// ---------------------------------------------------------------------------

const LINE_Y = 168;
const LINE_X0 = 59;
const LINE_X1 = 1221;
const L = LINE_X1 - LINE_X0;
const R_FULL = L / TAU; // ≈ 185
const RC = { x: 640, y: LINE_Y + R_FULL } as const; // ring center once bent

function bendPoint(sFrac: number, u: number, radialOff = 0): { x: number; y: number } {
  if (u < 0.001) return { x: LINE_X0 + sFrac * L, y: LINE_Y + radialOff };
  const r = L / (TAU * u);
  const psi = (sFrac - 0.5) * TAU * u;
  const rr = r - radialOff; // negative offset = outside the curve
  return { x: 640 + rr * Math.sin(psi), y: LINE_Y + r - rr * Math.cos(psi) };
}

/** Polyline `d` for the keyspace at bend u (the line/ring itself). */
function keyspaceD(u: number, reveal: number): string {
  const n = 140;
  const upto = Math.max(2, Math.round(n * clamp01(reveal)));
  const parts: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const p = bendPoint(i / n, u);
    parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

/** Polyline `d` along the ring from s1 clockwise to s2 (assumes bend done). */
function walkD(s1: number, s2: number, t: number, radialOff: number): string {
  const span = ((s2 - s1) % 1 + 1) % 1;
  const n = 48;
  const upto = Math.max(1, Math.round(n * clamp01(t)));
  const parts: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const p = bendPoint((s1 + span * (i / n)) % 1, 1, radialOff);
    parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Data — the strawman (mod N) and the ring population, all seeded.
// ---------------------------------------------------------------------------

const rand = mulberry32(4242);

// strawman: 12 keys bucketed by mod 3, then mod 4
const STRAW_H: number[] = Array.from({ length: 12 }, () => Math.floor(rand() * 0xffffffff));
const STRAW_B3 = STRAW_H.map((h) => h % 3);
const STRAW_B4 = STRAW_H.map((h) => h % 4);
export const STRAW_MOVED = STRAW_B3.filter((b, i) => b !== STRAW_B4[i]).length;

const CARD3_X = [430, 640, 850];
const CARD4_X = [372, 551, 730, 909];
const CARD_Y = 356;
function strawSlot(xs: number[], bucket: number, slot: number): { x: number; y: number } {
  return { x: xs[bucket] - 51 + (slot % 4) * 34, y: CARD_Y + 34 + Math.floor(slot / 4) * 26 };
}
const slots3 = (() => {
  const fill = [0, 0, 0];
  return STRAW_B3.map((b) => fill[b]++);
})();
const slots4 = (() => {
  const fill = [0, 0, 0, 0];
  return STRAW_B4.map((b) => fill[b]++);
})();

// the ring population
type NodeId = 'A' | 'B' | 'C' | 'D';
const NODE_S: Record<NodeId, number> = { A: 0.055, B: 0.35, C: 0.615, D: 0.845 };
const NODE_COLOR: Record<NodeId, string> = {
  A: colors.ACCENT,
  B: colors.SECONDARY,
  C: colors.POSITIVE,
  D: colors.TEAL,
};
const NODES3: NodeId[] = ['A', 'B', 'C'];
const NODES4: NodeId[] = ['A', 'B', 'C', 'D'];

const KEY_S: number[] = Array.from({ length: 40 }, () => rand());
export const OUR_S = 0.302; // user:42 — walks clockwise into B at 0.35

function ownerOf(s: number, nodes: NodeId[]): NodeId {
  let best: NodeId = nodes[0];
  let bestD = Infinity;
  for (const n of nodes) {
    const d = ((NODE_S[n] - s) % 1 + 1) % 1;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

const OWNER3 = KEY_S.map((s) => ownerOf(s, NODES3));
const OWNER4 = KEY_S.map((s) => ownerOf(s, NODES4));
export const MOVED_D = OWNER3.filter((o, i) => o !== OWNER4[i]).length;

/** clockwise rank from s=0 — the ownership color wave sweeps in this order */
const KEY_RANK: number[] = (() => {
  const order = KEY_S.map((s, i) => ({ i, s })).sort((a, b) => a.s - b.s).map((o) => o.i);
  const rank = new Array<number>(KEY_S.length).fill(0);
  order.forEach((i, r) => (rank[i] = r));
  return rank;
})();

/** three demo walks for the rule beat — SHORT hops read as "walk to the next
 *  node"; long ones wrap the ring and just look like a second circle. */
const DEMO_KEYS: number[] = NODES3.map((nd) => {
  let best = 0;
  let bestD = Infinity;
  KEY_S.forEach((s, i) => {
    if (OWNER3[i] !== nd) return;
    const g = ((NODE_S[nd] - s) % 1 + 1) % 1;
    const d = Math.abs(g - 0.07); // aim for a legible ~25° walk
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
});

// camera marks
const CAM_STRAW: CameraState = { x: 640, y: 300, k: 1.18 };
const CAM_OUR: CameraState = { x: 505, y: 305, k: 1.55 };

// ---------------------------------------------------------------------------
// Timeline (~68s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STRAW, cameraInterp);

  const strawU = tl.channel('strawU', 0); // strawman panel
  const assignU = tl.channel('assignU', 0); // keys drop into mod-3 buckets
  const add4U = tl.channel('add4U', 0); // 3-card → 4-card layout
  const jumpU = tl.channel('jumpU', 0); // staggered rehash jumps
  const cntU = tl.channel('cntU', 0); // "9 of 12 moved" chip

  const lineU = tl.channel('lineU', 0); // spectrum line draw-on
  const marksU = tl.channel('marksU', 0); // node marks drop
  const keysU = tl.channel('keysU', 0); // 40 keys drop
  const bendU = tl.channel('bendU', 0); // THE bend, 0..1
  const ruleU = tl.channel('ruleU', 0); // demo walks: 0..1 draw, 1..2 fade
  const waveU = tl.channel('waveU', 0); // ownership color wave
  const dJoinU = tl.channel('dJoinU', 0); // node D pops in
  const moveU = tl.channel('moveU', 0); // OWNER3 → OWNER4 blend + pulse
  const cnt2U = tl.channel('cnt2U', 0); // moved-count chips
  const ourU = tl.channel('ourU', 0); // our key: appear + walk to B
  const nextU = tl.channel('nextU', 0); // C and D flagged "next in line"

  // — beat 1 · the mod-N strawman —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'How do you split the keyspace across machines? The obvious move is arithmetic again: hash the key, mod the number of nodes.',
  });
  tl.tween(strawU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(assignU, 1, { at: 1.6, dur: 2.6, ease: ease.linear });

  // — beat 2 · N changes, keys stampede —
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: `Then the cluster grows by one. N changes from 3 to 4 — and redoing the arithmetic moves ${STRAW_MOVED} of 12 keys. Growth becomes a stampede.`,
  });
  tl.tween(add4U, 1, { at: 7.4, dur: 0.9, ease: ease.move });
  tl.tween(jumpU, 1, { at: 8.6, dur: 2.6, ease: ease.linear });
  tl.tween(cntU, 1, { at: 11.4, dur: 0.55, ease: ease.pop });

  // — beat 3 · one fixed keyspace —
  tl.caption({
    at: 14.0,
    dur: 6.6,
    text: 'Consistent hashing throws away N. Hash keys and nodes into one fixed space that never changes size — zero to two to the thirty-second power.',
  });
  tl.tween(strawU, 0, { at: 14.2, dur: 0.8, ease: ease.enter });
  tl.tween(cntU, 0, { at: 14.2, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 14.3, dur: 1.4, ease: ease.move });
  tl.tween(lineU, 1, { at: 15.2, dur: 1.5, ease: ease.draw });
  tl.tween(marksU, 1, { at: 17.0, dur: 1.4, ease: ease.linear });
  tl.tween(keysU, 1, { at: 18.2, dur: 2.0, ease: ease.linear });

  // — beat 4 · THE BEND —
  tl.caption({
    at: 21.6,
    dur: 6.4,
    text: 'Keys and nodes now live on the same line. But a line has two ends, and hash values wrap around — so glue the ends together.',
  });
  tl.tween(bendU, 1, { at: 23.2, dur: 3.2, ease: ease.move });
  tl.hold(26.4, 1.0);

  // — beat 5 · the clockwise rule —
  tl.caption({
    at: 28.6,
    dur: 5.8,
    text: 'This is the hash ring. Every key walks clockwise and belongs to the first node it meets.',
  });
  tl.tween(ruleU, 1, { at: 29.2, dur: 1.6, ease: ease.draw });
  tl.tween(waveU, 1, { at: 31.4, dur: 2.2, ease: ease.linear });
  tl.tween(ruleU, 2, { at: 33.4, dur: 0.7, ease: ease.linear });

  // — beat 6 · a node joins: one arc moves —
  tl.caption({
    at: 35.2,
    dur: 6.0,
    text: 'Watch what growth costs now. A fourth node joins, claims one arc of the ring — and only the keys inside that arc move.',
  });
  tl.tween(dJoinU, 1, { at: 36.2, dur: 0.6, ease: ease.pop });
  tl.tween(moveU, 1, { at: 37.2, dur: 1.4, ease: ease.move });

  // — beat 7 · count it —
  tl.caption({
    at: 42.0,
    dur: 6.2,
    text: `Count it: ${MOVED_D} of 40 keys moved, and the other ${40 - MOVED_D} never noticed. Compare that with the stampede — this is the whole sales pitch.`,
  });
  tl.tween(cnt2U, 1, { at: 42.6, dur: 0.6, ease: ease.pop });
  tl.hold(48.2, 0.6);

  // — beat 8 · our key finds a home —
  tl.caption({
    at: 48.8,
    dur: 6.2,
    text: 'Now put our key back in the picture. User forty-two hashes to a point on the ring, walks clockwise — and finds its home: node B.',
  });
  tl.tween(cnt2U, 0, { at: 49.0, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_OUR, { at: 49.2, dur: 1.5, ease: ease.move });
  tl.tween(ourU, 1, { at: 50.4, dur: 1.8, ease: ease.move });

  // — beat 9 · next in line —
  tl.caption({
    at: 55.8,
    dur: 6.6,
    text: "And notice who's standing just past B: node C, then node D. Next in line. Hold that thought — it is the whole next chapter.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 56.4, dur: 1.6, ease: ease.move });
  tl.tween(nextU, 1, { at: 57.6, dur: 1.2, ease: ease.enter });
  tl.hold(62.4, 1.6);

  return {
    tl,
    cam,
    strawU,
    assignU,
    add4U,
    jumpU,
    cntU,
    lineU,
    marksU,
    keysU,
    bendU,
    ruleU,
    waveU,
    dJoinU,
    moveU,
    cnt2U,
    ourU,
    nextU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const strawU = s.get(scene.strawU);
  const assignU = s.get(scene.assignU);
  const add4U = s.get(scene.add4U);
  const jumpU = s.get(scene.jumpU);
  const cntU = s.get(scene.cntU);
  const lineU = s.get(scene.lineU);
  const marksU = s.get(scene.marksU);
  const keysU = s.get(scene.keysU);
  const bendU = s.get(scene.bendU);
  const ruleU = s.get(scene.ruleU);
  const waveU = s.get(scene.waveU);
  const dJoinU = s.get(scene.dJoinU);
  const moveU = s.get(scene.moveU);
  const cnt2U = s.get(scene.cnt2U);
  const ourU = s.get(scene.ourU);
  const nextU = s.get(scene.nextU);

  const nodesShown: NodeId[] = dJoinU > 0.01 ? NODES4 : NODES3;
  const ruleOp = ruleU <= 1 ? 1 : 1 - clamp01(ruleU - 1);
  const ourWalk = clamp01(ourU * 1.6 - 0.6); // key appears, then walks

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- strawman: hash(key) mod N ---------------- */}
        {strawU > 0.01 && (
          <g opacity={strawU}>
            <text x={640} y={140} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
              node = hash(key) % N
            </text>
            {(add4U < 0.5 ? CARD3_X : CARD4_X).map((cx, b) => {
              const x = CARD3_X[Math.min(b, 2)] + (CARD4_X[b] - CARD3_X[Math.min(b, 2)]) * add4U;
              return (
                <g key={b} opacity={b === 3 ? add4U : 1}>
                  <rect x={x - 62} y={CARD_Y} width={124} height={96} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={x} y={CARD_Y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    node {b + 1}
                  </text>
                </g>
              );
            })}
            {STRAW_H.map((h, i) => {
              const from = { x: 240 + i * 68, y: 208 };
              const at3raw = strawSlot(CARD3_X, STRAW_B3[i], slots3[i]);
              // cards slide under the dots as the 4th arrives
              const at3 = {
                x: at3raw.x + (CARD4_X[STRAW_B3[i]] - CARD3_X[STRAW_B3[i]]) * add4U,
                y: at3raw.y,
              };
              const at4 = strawSlot(CARD4_X, STRAW_B4[i], slots4[i]);
              const drop = win(assignU, 12, i, 3);
              const jump = win(jumpU, 12, i, 3);
              const base = {
                x: from.x + (at3.x - from.x) * drop,
                y: from.y + (at3.y - from.y) * drop,
              };
              const p = {
                x: base.x + (at4.x - base.x) * jump,
                y: base.y + (at4.y - base.y) * jump - Math.sin(Math.PI * jump) * 46,
              };
              const moved = STRAW_B3[i] !== STRAW_B4[i];
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  fill={moved && jump > 0.5 ? colors.NEGATIVE : colors.ACCENT}
                  opacity={0.92}
                />
              );
            })}
            <g opacity={cntU}>
              <rect x={498} y={488} width={284} height={40} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} />
              <text x={640} y={514} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={600}>
                {STRAW_MOVED} of 12 keys moved
              </text>
            </g>
          </g>
        )}

        {/* ---------------- the keyspace: line → ring ---------------- */}
        {lineU > 0.01 && (
          <g>
            <path d={keyspaceD(bendU, lineU)} fill="none" stroke={colors.GRID} strokeWidth={2.5} />
            {/* endpoint labels ride the bend, then meet at the top */}
            <MathLabel
              tex={'0'}
              x={bendPoint(0, bendU, 34).x}
              y={bendPoint(0, bendU, 34).y - 8}
              fontSize={17}
              color={colors.MUTED}
              opacity={lineU * (1 - bendU * 0.25)}
            />
            <MathLabel
              tex={'2^{32}'}
              x={bendPoint(1, bendU, -38).x - 16}
              y={bendPoint(1, bendU, -38).y - 10}
              fontSize={17}
              color={colors.MUTED}
              opacity={lineU * (1 - bendU * 0.25)}
            />

            {/* the 40 keys */}
            {KEY_S.map((ks, i) => {
              const u = win(keysU, KEY_S.length, i, 4);
              if (u <= 0) return null;
              const p = bendPoint(ks, bendU, 0);
              const owned3 = NODE_COLOR[OWNER3[i]];
              const owned4 = NODE_COLOR[OWNER4[i]];
              const waved = waveU * KEY_S.length > KEY_RANK[i];
              const changed = OWNER3[i] !== OWNER4[i];
              const color = !waved ? colors.MUTED : moveU > 0.5 && changed ? owned4 : owned3;
              const pulse = changed ? Math.abs(Math.sin(Math.PI * clamp01(moveU) * 3)) : 0;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y - 26 * (1 - u)}
                  r={4.5 + 2.5 * pulse}
                  fill={color}
                  opacity={0.5 + 0.5 * u}
                />
              );
            })}

            {/* node marks */}
            {nodesShown.map((nd, i) => {
              const u = nd === 'D' ? dJoinU : win(marksU, 3, i, 1.6);
              if (u <= 0) return null;
              const p = bendPoint(NODE_S[nd], bendU, 0);
              const lp = bendPoint(NODE_S[nd], bendU, -30);
              const isNext = nd === 'C' || nd === 'D';
              const homeGlow = nd === 'B' ? ourWalk : 0;
              return (
                <g key={nd} opacity={u}>
                  {homeGlow > 0 && <circle cx={p.x} cy={p.y} r={20 + 5 * homeGlow} fill={NODE_COLOR.B} opacity={0.22 * homeGlow} />}
                  <rect x={p.x - 13} y={p.y - 13} width={26} height={26} rx={7} fill={NODE_COLOR[nd]} stroke={colors.BG} strokeWidth={2} transform={`rotate(45 ${p.x} ${p.y})`} />
                  <text x={lp.x} y={lp.y + 5} textAnchor="middle" fill={NODE_COLOR[nd]} fontSize={17} fontWeight={700}>
                    {nd}
                  </text>
                  {isNext && nextU > 0 && (
                    <g opacity={nextU}>
                      <circle cx={p.x} cy={p.y} r={26} fill="none" stroke={NODE_COLOR[nd]} strokeWidth={1.5} strokeDasharray="3 4" />
                      <text x={lp.x} y={lp.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
                        next in line
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* rule demo walks */}
            {ruleU > 0.01 && ruleOp > 0.01 && bendU > 0.99 && (
              <g opacity={ruleOp}>
                {DEMO_KEYS.map((ki, j) => {
                  const t = clamp01(ruleU * 1.4 - j * 0.2);
                  const nd = OWNER3[ki];
                  return (
                    <path
                      key={j}
                      d={walkD(KEY_S[ki], NODE_S[nd], t, -18)}
                      fill="none"
                      stroke={NODE_COLOR[nd]}
                      strokeWidth={2}
                      strokeDasharray="1 6"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            )}

            {/* moved-count comparison */}
            <g opacity={cnt2U}>
              <rect x={984} y={430} width={250} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={1006} y={462} fill={colors.POSITIVE} fontSize={16} fontWeight={700}>
                ring: {MOVED_D} of 40 moved
              </text>
              <text x={1006} y={496} fill={colors.NEGATIVE} fontSize={15}>
                mod N: {STRAW_MOVED} of 12
              </text>
            </g>

            {/* our key — user:42 walks home to B */}
            {ourU > 0.01 && bendU > 0.99 && (
              <g opacity={clamp01(ourU * 2)}>
                {ourWalk > 0 && (
                  <path d={walkD(OUR_S, NODE_S.B, ourWalk, -18)} fill="none" stroke={colors.WARM} strokeWidth={2.5} strokeLinecap="round" />
                )}
                <circle cx={bendPoint(OUR_S, 1).x} cy={bendPoint(OUR_S, 1).y} r={7.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
                <text
                  x={bendPoint(OUR_S, 1, 46).x - 26}
                  y={bendPoint(OUR_S, 1, 46).y + 4}
                  textAnchor="end"
                  fill={colors.WARM}
                  fontSize={14}
                  fontFamily={MONO}
                >
                  user:42
                </text>
                <text
                  x={bendPoint(OUR_S, 1, 46).x - 26}
                  y={bendPoint(OUR_S, 1, 46).y + 22}
                  textAnchor="end"
                  fill={colors.MUTED}
                  fontSize={12}
                  fontStyle="italic"
                >
                  home: B
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
