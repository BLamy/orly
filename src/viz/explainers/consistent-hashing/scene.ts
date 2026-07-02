import { Timeline, colors, ease, mulberry32 } from '../../core';

/**
 * Consistent Hashing — The Ring That Barely Moves.
 *
 * Everything is precomputed here at module scope from one seeded PRNG
 * (mulberry32(13)): the strawman mod-N hashes, the server/key angles, the
 * ownership tables for every configuration, and the moved-key counts that the
 * captions quote. Nothing self-animates; every frame is a pure function of
 * the sampled channels (the scrubbability invariant).
 */

export const TAU = Math.PI * 2;

/** The ring, in stage coordinates (1280×720; captions own y ≳ 633). */
export const RING = { cx: 560, cy: 330, r: 240 };
export const BADGE_R = RING.r + 44;

export type ServerId = 'A' | 'B' | 'C' | 'D';

export const SERVER_COLOR: Record<ServerId, string> = {
  A: colors.ACCENT,
  B: colors.POSITIVE,
  C: colors.SECONDARY,
  D: colors.WARM,
};

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const norm = (a: number) => ((a % TAU) + TAU) % TAU;

/** Clockwise distance from `from` to `to` (screen angles: clockwise = +θ). */
export const cwDelta = (from: number, to: number) => norm(to - from);

/** Signed shortest angular path (for the virtual-node scatter flights). */
export const shortestDelta = (from: number, to: number) => {
  const d = norm(to - from);
  return d > Math.PI ? d - TAU : d;
};

export const ringPoint = (angle: number, radius: number) => ({
  x: RING.cx + radius * Math.cos(angle),
  y: RING.cy + radius * Math.sin(angle),
});

/** Per-item window over a single 0..1 driver channel (the stagger trick). */
export const win = (p: number, n: number, i: number, span: number) =>
  clamp01((p * (n + span) - i) / span);

/* ------------------------------------------------------------------ */
/* Seeded data — one PRNG, fixed call order, so every number is exact. */
/* ------------------------------------------------------------------ */

const rand = mulberry32(13);

// Beat 1 strawman: 12 key hashes, bucketed by mod 3 then mod 4.
export const MOD_HASHES: number[] = Array.from({ length: 12 }, () =>
  Math.floor(rand() * 0xffffffff),
);
export const MOD_B3: number[] = MOD_HASHES.map((h) => h % 3);
export const MOD_B4: number[] = MOD_HASHES.map((h) => h % 4);
export const MOD_MOVED = MOD_B3.filter((b, i) => b !== MOD_B4[i]).length; // 9

/** Arrival-order slot inside each bucket (2 cols × 3 rows). */
function assignSlots(buckets: number[]): number[] {
  const next = new Map<number, number>();
  return buckets.map((b) => {
    const s = next.get(b) ?? 0;
    next.set(b, s + 1);
    return s;
  });
}
export const MOD_SLOT3 = assignSlots(MOD_B3);
export const MOD_SLOT4 = assignSlots(MOD_B4);

// Servers A/B/C: jittered thirds of the ring, starting from 12 o'clock.
export const SERVER_ANGLE: Record<ServerId, number> = (() => {
  const [a, b, c] = [0, 1, 2].map((i) =>
    norm(-Math.PI / 2 + (i / 3) * TAU + (rand() - 0.5) * 0.7),
  );
  // D lands in the middle of the widest A/B/C gap (jittered).
  const sorted = [a, b, c].sort((x, y) => x - y);
  let gapStart = 0;
  let gapLen = -1;
  for (let i = 0; i < 3; i++) {
    const a0 = sorted[i];
    const a1 = sorted[(i + 1) % 3] + (i === 2 ? TAU : 0);
    if (a1 - a0 > gapLen) {
      gapLen = a1 - a0;
      gapStart = a0;
    }
  }
  const d = norm(gapStart + gapLen / 2 + (rand() - 0.5) * 0.5);
  return { A: a, B: b, C: c, D: d };
})();

// 40 keys hashed onto the ring.
export const KEY_ANGLES: number[] = Array.from({ length: 40 }, () => rand() * TAU);

// Virtual nodes: 12 interleaved marks (A/C/D round-robin), jittered — the
// many-vnodes limit, with ownership still computed honestly from the marks.
export interface Mark {
  server: ServerId;
  angle: number;
}
export const VNODE_MARKS: Mark[] = Array.from({ length: 12 }, (_, m) => ({
  server: (['A', 'C', 'D'] as ServerId[])[m % 3],
  angle: norm(-Math.PI / 2 + (m / 12) * TAU + (rand() - 0.5) * 0.24),
}));

/* ------------------------------------------------- ownership tables */

const mark = (s: ServerId): Mark => ({ server: s, angle: SERVER_ANGLE[s] });

export const CFG0: Mark[] = [mark('A'), mark('B'), mark('C')];
export const CFG1: Mark[] = [...CFG0, mark('D')];
export const CFG2: Mark[] = CFG1.filter((m) => m.server !== 'B');
export const CFG3: Mark[] = VNODE_MARKS;

/** The clockwise successor rule — the whole algorithm, in five lines. */
export function ownerOf(keyAngle: number, marks: Mark[]): ServerId {
  let best: ServerId = marks[0].server;
  let bestD = Infinity;
  for (const m of marks) {
    const d = cwDelta(keyAngle, m.angle);
    if (d < bestD) {
      bestD = d;
      best = m.server;
    }
  }
  return best;
}

export const OWNER0 = KEY_ANGLES.map((a) => ownerOf(a, CFG0));
export const OWNER1 = KEY_ANGLES.map((a) => ownerOf(a, CFG1));
export const OWNER2 = KEY_ANGLES.map((a) => ownerOf(a, CFG2));
export const OWNER3 = KEY_ANGLES.map((a) => ownerOf(a, CFG3));

export const MOVED_ADD = OWNER0.filter((s, i) => s !== OWNER1[i]).length; // 13
export const MOVED_REMOVE = OWNER1.filter((s, i) => s !== OWNER2[i]).length; // 9

const countBy = (owners: ServerId[]) => (s: ServerId) =>
  owners.filter((o) => o === s).length;
export const LOAD_SERVERS: ServerId[] = ['A', 'C', 'D'];
export const LOAD_BEFORE = LOAD_SERVERS.map(countBy(OWNER2)); // lopsided: 8/10/22
export const LOAD_AFTER = LOAD_SERVERS.map(countBy(OWNER3)); // even-ish: 12/14/14

/** After B dies, its keys keep walking to this survivor (it's D). */
export const B_SUCCESSOR: ServerId = ownerOf(SERVER_ANGLE.B + 1e-6, CFG2);

/** Beat-3 rule demos: per server, the owned key with the longest walk. */
export const EXAMPLE_KEYS: number[] = (['A', 'B', 'C'] as ServerId[]).map((s) => {
  let best = 0;
  let bestGap = -1;
  KEY_ANGLES.forEach((a, i) => {
    if (OWNER0[i] !== s) return;
    const g = cwDelta(a, SERVER_ANGLE[s]);
    if (g > bestGap) {
      bestGap = g;
      best = i;
    }
  });
  return best;
});

/** Clockwise rank from 12 o'clock — the color wave sweeps in this order. */
export const KEY_RANK: number[] = (() => {
  const order = KEY_ANGLES.map((a, i) => ({ i, d: norm(a + Math.PI / 2) }))
    .sort((x, y) => x.d - y.d)
    .map((o) => o.i);
  const rank = new Array<number>(40).fill(0);
  order.forEach((i, r) => (rank[i] = r));
  return rank;
})();

/* --------------------------------------------------------------------- */
/* The timeline (~70s, six beats).                                        */
/* --------------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  // beat 1 — the mod-N strawman
  const modU = tl.channel('modU', 0); // strawman group opacity
  const modKeysIn = tl.channel('modKeysIn', 0); // staggered key drop driver
  const shiftU = tl.channel('shiftU', 0); // 3-bucket → 4-bucket layout slide
  const bucket4U = tl.channel('bucket4U', 0); // 4th bucket pop
  const mod3U = tl.channel('mod3U', 0); // "h(k) mod 3" label
  const mod4U = tl.channel('mod4U', 0); // "h(k) mod 4" label
  const modJump = tl.channel('modJump', 0); // staggered rehash driver
  const modCountU = tl.channel('modCountU', 0); // "9 of 12 moved" pop

  // beats 2–3 — the ring and the rule
  const ringU = tl.channel('ringU', 0); // ring draw-on (dashoffset)
  const srvA = tl.channel('srvA', 0);
  const srvB = tl.channel('srvB', 0);
  const srvC = tl.channel('srvC', 0);
  const keyLand = tl.channel('keyLand', 0); // staggered key landing driver
  const arc1 = tl.channel('arc1', 0); // rule demos: 0..1 draw, 1..2 fade
  const arc2 = tl.channel('arc2', 0);
  const arc3 = tl.channel('arc3', 0);
  const colorWave = tl.channel('colorWave', 0); // clockwise ownership recolor

  // beat 4 — add D
  const srvD = tl.channel('srvD', 0);
  const uAdd = tl.channel('uAdd', 0); // blend OWNER0 → OWNER1
  const pulseAdd = tl.channel('pulseAdd', 0); // 0..3 → |sin πv| = 3 pulses
  const addCountU = tl.channel('addCountU', 0);

  // beat 5 — remove B
  const bDead = tl.channel('bDead', 0);
  const handoffU = tl.channel('handoffU', 0); // B → successor arc (0..2)
  const uRemove = tl.channel('uRemove', 0); // blend OWNER1 → OWNER2
  const pulseRemove = tl.channel('pulseRemove', 0);
  const removeCountU = tl.channel('removeCountU', 0);

  // beat 6 — virtual nodes
  const uVnode = tl.channel('uVnode', 0); // scatter driver + OWNER2 → OWNER3
  const pulseVnode = tl.channel('pulseVnode', 0);
  const barsU = tl.channel('barsU', 0); // load-bar panel entrance
  const barMorph = tl.channel('barMorph', 0); // lopsided → even
  const texU = tl.channel('texU', 0); // "keys moved ≈ K/n"

  // ---- beat 1: hash(key) mod N — until N changes -------------------------
  tl.tween(modU, 1, { at: 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(mod3U, 1, { at: 0.7, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 0.5,
    dur: 5.9,
    text: 'The obvious plan: server = hash(key) mod N. Three servers, twelve keys, and everybody knows exactly where home is.',
  });
  tl.tween(modKeysIn, 1, { at: 1.2, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 6.8,
    dur: 5.6,
    text: 'Then you add one server. N becomes 4 — and nearly every key suddenly hashes somewhere else.',
  });
  tl.tween(shiftU, 1, { at: 7.2, dur: 1.0, ease: ease.move });
  tl.tween(bucket4U, 1, { at: 7.7, dur: 0.6, ease: ease.pop });
  tl.tween(mod3U, 0, { at: 7.5, dur: 0.4, ease: ease.enter });
  tl.tween(mod4U, 1, { at: 7.9, dur: 0.5, ease: ease.enter });
  tl.tween(modJump, 1, { at: 9.0, dur: 2.4, ease: ease.linear });
  tl.tween(modCountU, 1, { at: 11.6, dur: 0.55, ease: ease.pop });
  tl.caption({
    at: 12.8,
    dur: 5.0,
    text: `One new server moved ${MOD_MOVED} of 12 keys — a cache stampede, courtesy of arithmetic.`,
  });
  tl.tween(modU, 0, { at: 17.8, dur: 0.8, ease: ease.enter });

  // ---- beat 2: bend the line into a ring ---------------------------------
  tl.tween(ringU, 1, { at: 18.7, dur: 1.5, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 5.8,
    text: 'Consistent hashing bends the line into a ring: hash servers and keys onto the same circle, 0 to 2³² and around again.',
  });
  tl.tween(srvA, 1, { at: 20.5, dur: 0.55, ease: ease.pop });
  tl.tween(srvB, 1, { at: 20.9, dur: 0.55, ease: ease.pop });
  tl.tween(srvC, 1, { at: 21.3, dur: 0.55, ease: ease.pop });
  tl.hold(22.0, 2.6);

  // ---- beat 3: keys land; the clockwise rule -----------------------------
  tl.caption({
    at: 24.8,
    dur: 5.4,
    text: 'The keys land wherever they hash. Each one walks clockwise and belongs to the first server it meets.',
  });
  tl.tween(keyLand, 1, { at: 25.1, dur: 2.6, ease: ease.linear });
  tl.tween(arc1, 1, { at: 28.3, dur: 1.5, ease: ease.draw });
  tl.tween(arc2, 1, { at: 28.9, dur: 1.5, ease: ease.draw });
  tl.tween(arc3, 1, { at: 29.5, dur: 1.5, ease: ease.draw });
  tl.caption({
    at: 30.8,
    dur: 4.8,
    text: "That's the entire rule. Color each key by the server it walks into, and ownership settles into arcs.",
  });
  tl.tween(colorWave, 1, { at: 31.6, dur: 2.0, ease: ease.linear });
  tl.tween(arc1, 2, { at: 33.8, dur: 0.6, ease: ease.linear });
  tl.tween(arc2, 2, { at: 34.0, dur: 0.6, ease: ease.linear });
  tl.tween(arc3, 2, { at: 34.2, dur: 0.6, ease: ease.linear });
  tl.hold(34.8, 1.4);

  // ---- beat 4: add D — one slice moves ------------------------------------
  tl.caption({
    at: 36.4,
    dur: 5.4,
    text: 'Add server D. It claims one slice of the ring — and only the keys inside that slice change hands.',
  });
  tl.tween(srvD, 1, { at: 36.8, dur: 0.6, ease: ease.pop });
  tl.tween(uAdd, 1, { at: 37.8, dur: 1.2, ease: ease.move });
  tl.tween(pulseAdd, 3, { at: 37.8, dur: 2.6, ease: ease.linear });
  tl.tween(addCountU, 1, { at: 39.6, dur: 0.55, ease: ease.pop });
  tl.caption({
    at: 42.4,
    dur: 4.2,
    text: `${MOVED_ADD} of 40 keys moved; the other ${40 - MOVED_ADD} never noticed. Growth touches one slice, not the world.`,
  });
  tl.tween(addCountU, 0, { at: 46.0, dur: 0.5, ease: ease.enter });
  tl.hold(46.5, 0.5);

  // ---- beat 5: remove B — failure is the same story -----------------------
  tl.caption({
    at: 47.0,
    dur: 5.2,
    text: 'Now server B dies. Its keys just keep walking clockwise to the next server still standing.',
  });
  tl.tween(bDead, 1, { at: 47.5, dur: 0.9, ease: ease.enter });
  tl.tween(handoffU, 1, { at: 48.5, dur: 1.3, ease: ease.draw });
  tl.tween(uRemove, 1, { at: 49.0, dur: 1.2, ease: ease.move });
  tl.tween(pulseRemove, 3, { at: 49.0, dur: 2.6, ease: ease.linear });
  tl.tween(handoffU, 2, { at: 50.6, dur: 0.7, ease: ease.linear });
  tl.tween(removeCountU, 1, { at: 50.9, dur: 0.55, ease: ease.pop });
  tl.caption({
    at: 52.6,
    dur: 4.2,
    text: `${MOVED_REMOVE} keys moved, everyone else stayed put. Failure is the same story as growth — one slice.`,
  });
  tl.tween(removeCountU, 0, { at: 56.2, dur: 0.5, ease: ease.enter });
  tl.hold(56.7, 0.5);

  // ---- beat 6: virtual nodes — the load evens out --------------------------
  tl.caption({
    at: 57.2,
    dur: 5.8,
    text: 'One catch: single dots carve lopsided arcs — poor D owns half the ring. So give each server four virtual nodes.',
  });
  tl.tween(barsU, 1, { at: 57.6, dur: 0.8, ease: ease.pop });
  tl.tween(uVnode, 1, { at: 59.8, dur: 2.6, ease: ease.linear });
  tl.tween(pulseVnode, 3, { at: 60.6, dur: 2.6, ease: ease.linear });
  tl.tween(barMorph, 1, { at: 61.0, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 63.4,
    dur: 5.6,
    text: 'Twelve small arcs instead of three big ones: the load evens out — and any change still moves only about K/n keys.',
  });
  tl.tween(texU, 1, { at: 64.6, dur: 0.8, ease: ease.enter });
  tl.hold(69.2, 1.6);

  return {
    tl,
    modU,
    modKeysIn,
    shiftU,
    bucket4U,
    mod3U,
    mod4U,
    modJump,
    modCountU,
    ringU,
    srvA,
    srvB,
    srvC,
    keyLand,
    arc1,
    arc2,
    arc3,
    colorWave,
    srvD,
    uAdd,
    pulseAdd,
    addCountU,
    bDead,
    handoffU,
    uRemove,
    pulseRemove,
    removeCountU,
    uVnode,
    pulseVnode,
    barsU,
    barMorph,
    texU,
  };
}
