// Consistent Hashing: slicing the keyspace
//
// Grounding (donnemartin/system-design-primer):
//   solutions/system_design/query_cache — "machine = hash(query)" for a
//   sharded key-value cache, and the note that you'll want consistent hashing.
//   README.md § Sharding — rebalancing adds complexity; a sharding function
//   based on consistent hashing reduces the amount of transferred data; data
//   distribution can become lopsided (hot shards).
//
// Visual machine: the mod-N strawman re-homes almost every key when N
// changes; then the keyspace NUMBER LINE (0…2³²) literally curls into a
// circle, keys riding it. Servers hash onto the same ring, ownership paints
// itself as arcs, and growth/failure each move exactly one slice. Virtual
// nodes even out the load bars at the end.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Seeded data — one PRNG, fixed call order, so every spoken count is exact.
// ---------------------------------------------------------------------------

const rand = mulberry32(4242);

// Beat 1 strawman: 12 keys bucketed by mod 3, then mod 4.
const MOD_HASHES: number[] = Array.from({ length: 12 }, () => Math.floor(rand() * 0xffffffff));
const MOD_B3: number[] = MOD_HASHES.map((h) => h % 3);
const MOD_B4: number[] = MOD_HASHES.map((h) => h % 4);
export const MOD_MOVED = MOD_B3.filter((b, i) => b !== MOD_B4[i]).length;
const slotIn = (buckets: number[]): number[] => {
  const next = new Map<number, number>();
  return buckets.map((b) => {
    const s = next.get(b) ?? 0;
    next.set(b, s + 1);
    return s;
  });
};
const MOD_SLOT3 = slotIn(MOD_B3);
const MOD_SLOT4 = slotIn(MOD_B4);

// The ring: servers and keys live at t ∈ [0,1) around the keyspace.
type ServerId = 'A' | 'B' | 'C' | 'D';
const SRV_COLOR: Record<ServerId, string> = {
  A: colors.ACCENT,
  B: colors.POSITIVE,
  C: colors.SECONDARY,
  D: colors.WARM,
};
const SRV_T: Record<ServerId, number> = (() => {
  const [a, b, c] = [0, 1, 2].map((i) => (i / 3 + (rand() - 0.5) * 0.09 + 1) % 1);
  // D lands mid-way through the widest gap
  const sorted = [a, b, c].sort((x, y) => x - y);
  let gs = 0;
  let gl = -1;
  for (let i = 0; i < 3; i++) {
    const t0 = sorted[i];
    const t1 = sorted[(i + 1) % 3] + (i === 2 ? 1 : 0);
    if (t1 - t0 > gl) {
      gl = t1 - t0;
      gs = t0;
    }
  }
  return { A: a, B: b, C: c, D: (gs + gl / 2) % 1 };
})();

const KEY_T: number[] = Array.from({ length: 16 }, () => rand());

interface Mark {
  server: ServerId;
  t: number;
}
const mark = (sv: ServerId): Mark => ({ server: sv, t: SRV_T[sv] });
const CFG0: Mark[] = [mark('A'), mark('B'), mark('C')];
const CFG1: Mark[] = [...CFG0, mark('D')];
const CFG2: Mark[] = CFG1.filter((m) => m.server !== 'B');
// virtual nodes: 12 interleaved marks (A/C/D round-robin), jittered
const VNODES: Mark[] = Array.from({ length: 12 }, (_, m) => ({
  server: (['A', 'C', 'D'] as ServerId[])[m % 3],
  t: (m / 12 + (rand() - 0.5) * 0.03 + 1) % 1,
}));

/** forward distance around the keyspace from key t to mark t */
const fwd = (from: number, to: number): number => (to - from + 1) % 1;
function ownerOf(t: number, marks: Mark[]): ServerId {
  let best = marks[0].server;
  let bestD = Infinity;
  for (const m of marks) {
    const d = fwd(t, m.t);
    if (d < bestD) {
      bestD = d;
      best = m.server;
    }
  }
  return best;
}
const OWNER0 = KEY_T.map((t) => ownerOf(t, CFG0));
const OWNER1 = KEY_T.map((t) => ownerOf(t, CFG1));
const OWNER2 = KEY_T.map((t) => ownerOf(t, CFG2));
const OWNER3 = KEY_T.map((t) => ownerOf(t, VNODES));
export const MOVED_ADD = OWNER0.filter((sv, i) => sv !== OWNER1[i]).length;
export const MOVED_DIE = OWNER1.filter((sv, i) => sv !== OWNER2[i]).length;
const countBy = (owners: ServerId[]) => (sv: ServerId) => owners.filter((o) => o === sv).length;
const LOAD_SRVS: ServerId[] = ['A', 'C', 'D'];
const LOAD_BEFORE = LOAD_SRVS.map(countBy(OWNER2));
const LOAD_AFTER = LOAD_SRVS.map(countBy(OWNER3));
/** three sample keys for the walk-rule demo — the longest walk per server */
const DEMO_KEYS: number[] = (['A', 'B', 'C'] as ServerId[]).map((sv) => {
  let best = 0;
  let bestGap = -1;
  KEY_T.forEach((t, i) => {
    if (OWNER0[i] !== sv) return;
    const g = fwd(t, SRV_T[sv]);
    if (g > bestGap) {
      bestGap = g;
      best = i;
    }
  });
  return best;
});

// ---------------------------------------------------------------------------
// Geometry — the line that curls into the ring.
// ---------------------------------------------------------------------------

// r = 196 keeps the un-curled line (length 2πr ≈ 1231) inside the stage.
const RING = { cx: 640, cy: 330, r: 196 } as const;
const LINE_Y = RING.cy + RING.r; // the line is tangent to the ring's bottom

/**
 * A keyspace point t ∈ [0,1] under curl m ∈ [0,1]: m=0 a flat number line of
 * length 2πr, m=1 the full circle. The line bends with constant curvature
 * (an arc of radius r/m tangent to the line at its midpoint) — the classic
 * curl, and the chapter's centerpiece morph.
 */
function curl(t: number, m: number): { x: number; y: number } {
  const phi0 = (t - 0.5) * TAU;
  if (m < 0.002) return { x: RING.cx + phi0 * RING.r, y: LINE_Y };
  const rc = RING.r / m;
  const phi = phi0 * m;
  return { x: RING.cx + rc * Math.sin(phi), y: LINE_Y - rc + rc * Math.cos(phi) };
}

/** finished-ring position of keyspace point t (t=0 at the top, seam up) */
const posOnRing = (t: number, rad: number = RING.r): { x: number; y: number } => {
  const phi = (t - 0.5) * TAU;
  return { x: RING.cx + rad * Math.sin(phi), y: RING.cy + rad * Math.cos(phi) };
};

// strawman layout: three (then four) buckets
const BUCKET_W = 210;
const bucketX = (b: number, n: number): number => 640 + (b - (n - 1) / 2) * (BUCKET_W + 26) - BUCKET_W / 2;
const BUCKET_Y = 240;
const keyInBucket = (b: number, slot: number, n: number): { x: number; y: number } => ({
  x: bucketX(b, n) + 36 + (slot % 2) * 96,
  y: BUCKET_Y + 58 + Math.floor(slot / 2) * 40,
});

const CAM_RING: CameraState = { x: RING.cx, y: RING.cy + 10, k: 1.08 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  modU: ChannelRef<number>;
  modKeys: ChannelRef<number>;
  mod4U: ChannelRef<number>;
  modJump: ChannelRef<number>;
  modCount: ChannelRef<number>;
  lineU: ChannelRef<number>;
  curlM: ChannelRef<number>;
  srvU: ChannelRef<number>;
  walkU: ChannelRef<number>;
  waveU: ChannelRef<number>;
  dU: ChannelRef<number>;
  uAdd: ChannelRef<number>;
  addCount: ChannelRef<number>;
  bDead: ChannelRef<number>;
  uDie: ChannelRef<number>;
  dieCount: ChannelRef<number>;
  barsU: ChannelRef<number>;
  vnodeU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const modU = tl.channel('modU', 0); // strawman group
  const modKeys = tl.channel('modKeys', 0); // staggered key drop (mod 3)
  const mod4U = tl.channel('mod4U', 0); // 4th bucket + rule flip
  const modJump = tl.channel('modJump', 0); // staggered re-home wave
  const modCount = tl.channel('modCount', 0); // "9 / 12 moved"
  const lineU = tl.channel('lineU', 0); // number line + keys
  const curlM = tl.channel('curlM', 0); // THE morph: line → circle
  const srvU = tl.channel('srvU', 0); // servers pop onto the ring
  const walkU = tl.channel('walkU', 0); // rule demo arcs (0..1 draw, 1..2 fade)
  const waveU = tl.channel('waveU', 0); // ownership color wave
  const dU = tl.channel('dU', 0); // server D pops
  const uAdd = tl.channel('uAdd', 0); // OWNER0 → OWNER1 blend
  const addCount = tl.channel('addCount', 0);
  const bDead = tl.channel('bDead', 0); // B dies
  const uDie = tl.channel('uDie', 0); // OWNER1 → OWNER2 blend
  const dieCount = tl.channel('dieCount', 0);
  const barsU = tl.channel('barsU', 0); // load panel
  const vnodeU = tl.channel('vnodeU', 0); // marks scatter + OWNER2 → OWNER3
  const endU = tl.channel('endU', 0); // closing quiet-down

  // — Beat 1 · the remainder rule —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Three machines now, and the rule everyone tries first: hash the key, take the remainder, and the remainder picks your machine.',
  });
  tl.tween(modU, 1, { at: 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(modKeys, 1, { at: 1.6, dur: 3.4, ease: ease.linear });
  tl.hold(6.5, 0.5);

  // — Beat 2 · N changes —
  tl.caption({
    at: 7.0,
    dur: 5.2,
    text: 'It works beautifully — right up until you add a fourth machine, and every remainder is suddenly computed against a different number.',
  });
  tl.tween(mod4U, 1, { at: 7.6, dur: 0.8, ease: ease.pop });
  tl.tween(modJump, 1, { at: 9.0, dur: 2.8, ease: ease.linear });
  tl.hold(12.2, 0.4);

  // — Beat 3 · the stampede —
  tl.caption({
    at: 12.6,
    dur: 5.6,
    text: `${MOD_MOVED} of our 12 keys just changed homes. At scale that is a stampede — most of the dataset migrating because you added one box.`,
  });
  tl.tween(modCount, 1, { at: 13.2, dur: 0.6, ease: ease.pop });
  tl.hold(18.2, 0.4);

  // — Beat 4 · bend the keyspace —
  tl.caption({
    at: 18.6,
    dur: 6.4,
    text: 'Consistent hashing throws the remainder away. Take the whole keyspace — zero to two to the thirty-second — and bend it into a circle.',
  });
  tl.tween(modU, 0, { at: 18.8, dur: 0.8, ease: ease.enter });
  tl.tween(lineU, 1, { at: 19.7, dur: 1.4, ease: ease.draw });
  tl.tween(curlM, 1, { at: 21.6, dur: 2.8, ease: ease.move });
  tl.tween(cam, CAM_RING, { at: 22.0, dur: 2.0, ease: ease.move });
  tl.hold(25.0, 0.6);

  // — Beat 5 · machines join the same ring —
  tl.caption({
    at: 25.6,
    dur: 5.2,
    text: 'Keys hash to points on the ring. And here is the move: the machines hash onto the very same ring, right in among the keys.',
  });
  tl.tween(srvU, 1, { at: 27.2, dur: 1.4, ease: ease.linear });
  tl.hold(30.8, 0.5);

  // — Beat 6 · the walk rule —
  tl.caption({
    at: 31.3,
    dur: 5.6,
    text: 'The rule: each key walks forward around the ring and belongs to the first machine it meets. Paint every key by its owner and the ring settles into arcs.',
  });
  tl.tween(walkU, 1, { at: 31.6, dur: 1.6, ease: ease.draw });
  tl.tween(waveU, 1, { at: 34.2, dur: 1.8, ease: ease.linear });
  tl.tween(walkU, 2, { at: 36.0, dur: 0.7, ease: ease.linear });
  tl.hold(36.9, 0.5);

  // — Beat 7 · add D —
  tl.caption({
    at: 37.4,
    dur: 5.2,
    text: 'Now add the fourth machine again. It lands on the ring and claims only the stretch of keyspace behind it.',
  });
  tl.tween(dU, 1, { at: 38.2, dur: 0.6, ease: ease.pop });
  tl.tween(uAdd, 1, { at: 39.2, dur: 1.4, ease: ease.move });
  tl.hold(42.6, 0.4);

  // — Beat 8 · a local event —
  tl.caption({
    at: 43.0,
    dur: 5.4,
    text: `${MOVED_ADD} keys moved. The other ${16 - MOVED_ADD} never heard about it. Adding capacity just became a local event instead of a stampede.`,
  });
  tl.tween(addCount, 1, { at: 43.6, dur: 0.6, ease: ease.pop });
  tl.tween(addCount, 0, { at: 47.6, dur: 0.6, ease: ease.enter });
  tl.hold(48.4, 0.4);

  // — Beat 9 · failure, same script —
  tl.caption({
    at: 48.8,
    dur: 5.6,
    text: 'Failure runs the same script backwards. A machine dies, and only its keys slide forward to the next machine still standing.',
  });
  tl.tween(bDead, 1, { at: 49.6, dur: 0.8, ease: ease.enter });
  tl.tween(uDie, 1, { at: 50.6, dur: 1.4, ease: ease.move });
  tl.tween(dieCount, 1, { at: 52.2, dur: 0.6, ease: ease.pop });
  tl.tween(dieCount, 0, { at: 54.0, dur: 0.5, ease: ease.enter });
  tl.hold(54.6, 0.4);

  // — Beat 10 · lopsided arcs —
  tl.caption({
    at: 55.0,
    dur: 5.2,
    text: 'One wrinkle. Single dots carve uneven arcs, so one machine can end up owning half the ring while another naps.',
  });
  tl.tween(barsU, 1, { at: 55.8, dur: 0.8, ease: ease.pop });
  tl.hold(60.2, 0.4);

  // — Beat 11 · virtual nodes —
  tl.caption({
    at: 60.6,
    dur: 5.8,
    text: 'So each machine drops many small marks instead of one — virtual nodes. Many thin slices average out, and the load bars even up.',
  });
  tl.tween(vnodeU, 1, { at: 61.4, dur: 2.4, ease: ease.linear });
  tl.hold(66.4, 0.5);

  // — Beat 12 · payoff —
  tl.caption({
    at: 66.9,
    dur: 6.0,
    text: 'That is partitioning, solved. Every key knows its home, and any change — growth or failure — moves one slice of the ring, never the world.',
  });
  tl.tween(endU, 1, { at: 67.2, dur: 1.2, ease: ease.move });
  tl.hold(72.9, 1.2);

  return {
    tl, cam, modU, modKeys, mod4U, modJump, modCount, lineU, curlM, srvU,
    walkU, waveU, dU, uAdd, addCount, bDead, uDie, dieCount, barsU, vnodeU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** arc path (SVG) between two keyspace points at radius rad */
function arcPath(t0: number, t1: number, rad: number): string {
  const a = posOnRing(t0, rad);
  const b = posOnRing(t1, rad);
  const d = fwd(t0, t1);
  // sweep 0: as t increases our phi increases but y uses +cos ⇒ counterclockwise on screen
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} A${rad} ${rad} 0 ${d > 0.5 ? 1 : 0} 0 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function keyColor(i: number, s: SceneState): string {
  const wave = s.get(scene.waveU);
  const add = s.get(scene.uAdd);
  const die = s.get(scene.uDie);
  const vn = s.get(scene.vnodeU);
  if (wave <= 0) return colors.MUTED;
  const painted = win(wave, 16, (KEY_T[i] * 16) | 0, 4) > 0.5;
  if (!painted) return colors.MUTED;
  let owner = OWNER0[i];
  if (add > 0.5) owner = OWNER1[i];
  if (die > 0.5) owner = OWNER2[i];
  if (vn > 0.5) owner = OWNER3[i];
  return SRV_COLOR[owner];
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const modU = s.get(scene.modU);
  const modKeys = s.get(scene.modKeys);
  const mod4U = s.get(scene.mod4U);
  const modJump = s.get(scene.modJump);
  const modCount = s.get(scene.modCount);
  const lineU = s.get(scene.lineU);
  const curlM = s.get(scene.curlM);
  const srvU = s.get(scene.srvU);
  const walkU = s.get(scene.walkU);
  const dU = s.get(scene.dU);
  const uAdd = s.get(scene.uAdd);
  const addCount = s.get(scene.addCount);
  const bDead = s.get(scene.bDead);
  const uDie = s.get(scene.uDie);
  const dieCount = s.get(scene.dieCount);
  const barsU = s.get(scene.barsU);
  const vnodeU = s.get(scene.vnodeU);
  const endU = s.get(scene.endU);

  const nBuckets = mod4U > 0.5 ? 4 : 3;

  // ring sample points for the curling line
  const CURVE_N = 120;
  const curvePts = Array.from({ length: CURVE_N + 1 }, (_, i) => curl(i / CURVE_N, curlM));
  const lineD = curvePts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join('');

  const ringDone = curlM > 0.995;
  const keyPos = (t: number): { x: number; y: number } => (ringDone ? posOnRing(t) : curl(t, curlM));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- strawman: hash(key) mod N ---------------- */}
        {modU > 0.01 && (
          <g opacity={modU}>
            {Array.from({ length: nBuckets }, (_, b) => (
              <g key={b} opacity={b === 3 ? mod4U : 1}>
                <rect x={bucketX(b, nBuckets)} y={BUCKET_Y} width={BUCKET_W} height={250} rx={12}
                  fill={colors.PANEL} stroke={colors.GRID} />
                <text x={bucketX(b, nBuckets) + BUCKET_W / 2} y={BUCKET_Y + 30} textAnchor="middle"
                  fill={colors.TEXT} fontSize={14}>{`machine ${b}`}</text>
              </g>
            ))}
            <text x={640} y={170} textAnchor="middle" fill={colors.SECONDARY} fontSize={16}
              fontFamily="ui-monospace, monospace">
              {mod4U > 0.5 ? 'machine = hash(key) mod 4' : 'machine = hash(key) mod 3'}
            </text>
            {MOD_HASHES.map((_, i) => {
              const inU = win(modKeys, 12, i, 3);
              if (inU <= 0) return null;
              const from = { x: 640, y: 120 };
              const to3 = keyInBucket(MOD_B3[i], MOD_SLOT3[i], nBuckets);
              const to4 = keyInBucket(MOD_B4[i], MOD_SLOT4[i], nBuckets);
              const j = win(modJump, 12, i, 4);
              const moved = MOD_B3[i] !== MOD_B4[i];
              const p = {
                x: from.x + (to3.x - from.x) * inU + (moved ? (to4.x - to3.x) * j : 0),
                y: from.y + (to3.y - from.y) * inU + (moved ? (to4.y - to3.y) * j - Math.sin(j * Math.PI) * 46 : 0),
              };
              return (
                <g key={i}>
                  <rect x={p.x - 34} y={p.y - 12} width={80} height={24} rx={6}
                    fill={colors.BG} stroke={moved && j > 0.15 ? colors.NEGATIVE : colors.GRID} />
                  <text x={p.x + 6} y={p.y + 4} textAnchor="middle" fontSize={11}
                    fill={moved && j > 0.15 ? colors.NEGATIVE : colors.ACCENT}
                    fontFamily="ui-monospace, monospace">{`k${i + 1}`}</text>
                </g>
              );
            })}
            <g opacity={modCount}>
              <text x={640} y={560} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20}>
                {`${MOD_MOVED} / 12 keys re-homed`}
              </text>
            </g>
          </g>
        )}

        {/* ---------------- the line that curls into the ring ---------------- */}
        {lineU > 0.01 && (
          <g>
            <path d={lineD} fill="none" stroke={colors.MUTED} strokeWidth={2}
              strokeDasharray={`${lineU * 3000} 3000`} opacity={0.9} />
            {/* endpoint labels while it's still a line */}
            <g opacity={(1 - curlM) * lineU}>
              <text x={curl(0, 0).x} y={LINE_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={13}
                fontFamily="ui-monospace, monospace">0</text>
              <text x={curl(1, 0).x} y={LINE_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={13}
                fontFamily="ui-monospace, monospace">2³²</text>
            </g>
            <g opacity={clamp01((curlM - 0.9) * 10) * (1 - endU * 0.0)}>
              <text x={RING.cx} y={RING.cy - RING.r - 18} textAnchor="middle" fill={colors.MUTED}
                fontSize={13} fontStyle="italic">the keyspace, joined end to end</text>
            </g>

            {/* keys riding the curl */}
            {KEY_T.map((t, i) => {
              const p = keyPos(t);
              const kc = keyColor(i, s);
              const isDemo = DEMO_KEYS.includes(i);
              return (
                <circle key={i} cx={p.x} cy={p.y} r={isDemo && walkU > 0 && walkU < 2 ? 7 : 5.5}
                  fill={kc} opacity={lineU * (endU > 0 ? 0.9 : 0.95)} />
              );
            })}

            {/* walk-rule demo arcs */}
            {walkU > 0.01 && walkU < 1.99 &&
              DEMO_KEYS.map((ki, j) => {
                const draw = clamp01(walkU - j * 0.12);
                const fade = clamp01(walkU - 1);
                const t0 = KEY_T[ki];
                const owner = OWNER0[ki];
                const d = fwd(t0, SRV_T[owner]) * clamp01(draw);
                return (
                  <path key={j} d={arcPath(t0, (t0 + d) % 1, RING.r + 16)} fill="none"
                    stroke={SRV_COLOR[owner]} strokeWidth={2.4} opacity={(1 - fade) * 0.85}
                    strokeDasharray="5 5" />
                );
              })}

            {/* servers on the ring */}
            {(['A', 'B', 'C'] as ServerId[]).map((sv, i) => {
              const u = win(srvU, 3, i, 1.4);
              if (u <= 0) return null;
              const p = posOnRing(SRV_T[sv], RING.r);
              const dead = sv === 'B' ? bDead : 0;
              return (
                <g key={sv} opacity={u * (1 - vnodeU * (sv !== 'B' ? 0.85 : 0))}>
                  <circle cx={p.x} cy={p.y} r={15 * u} fill={colors.BG}
                    stroke={dead > 0.3 ? colors.GRID : SRV_COLOR[sv]} strokeWidth={2.5}
                    opacity={dead > 0.3 ? 0.5 : 1} />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13}
                    fill={dead > 0.3 ? colors.MUTED : SRV_COLOR[sv]}>{sv}</text>
                  {dead > 0.3 && (
                    <g stroke={colors.NEGATIVE} strokeWidth={2.4} opacity={dead}>
                      <line x1={p.x - 10} y1={p.y - 10} x2={p.x + 10} y2={p.y + 10} />
                      <line x1={p.x - 10} y1={p.y + 10} x2={p.x + 10} y2={p.y - 10} />
                    </g>
                  )}
                </g>
              );
            })}
            {dU > 0.01 && (
              <g opacity={dU * (1 - vnodeU * 0.85)}>
                {(() => {
                  const p = posOnRing(SRV_T.D, RING.r);
                  return (
                    <>
                      <circle cx={p.x} cy={p.y} r={15 * dU} fill={colors.BG} stroke={SRV_COLOR.D} strokeWidth={2.5} />
                      <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13} fill={SRV_COLOR.D}>D</text>
                    </>
                  );
                })()}
              </g>
            )}

            {/* virtual-node marks */}
            {vnodeU > 0.01 &&
              VNODES.map((m, i) => {
                const u = win(vnodeU, 12, i, 3);
                if (u <= 0) return null;
                const p = posOnRing(m.t, RING.r);
                return (
                  <g key={i} opacity={u}>
                    <circle cx={p.x} cy={p.y} r={7} fill={colors.BG} stroke={SRV_COLOR[m.server]} strokeWidth={2} />
                    <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={8.5} fill={SRV_COLOR[m.server]}>
                      {m.server}
                    </text>
                  </g>
                );
              })}

            {/* moved-count chips */}
            <g opacity={addCount}>
              <text x={RING.cx} y={RING.cy + RING.r + 46} textAnchor="middle" fill={SRV_COLOR.D} fontSize={17}>
                {`${MOVED_ADD} / 16 keys moved — all into D`}
              </text>
            </g>
            <g opacity={dieCount}>
              <text x={RING.cx} y={RING.cy + RING.r + 46} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
                {`${MOVED_DIE} keys re-homed — the rest never moved`}
              </text>
            </g>
          </g>
        )}

        {/* ---------------- load bars ---------------- */}
        {barsU > 0.01 && (
          <g opacity={barsU * (1 - endU * 0.85)}>
            <rect x={1020} y={200} width={200} height={260} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={1120} y={228} textAnchor="middle" fill={colors.TEXT} fontSize={13}>keys per machine</text>
            {LOAD_SRVS.map((sv, i) => {
              const before = LOAD_BEFORE[i];
              const after = LOAD_AFTER[i];
              const v = before + (after - before) * vnodeU;
              const h = (v / 16) * 170;
              return (
                <g key={sv}>
                  <rect x={1048 + i * 52} y={430 - h} width={30} height={h} rx={5} fill={SRV_COLOR[sv]} opacity={0.85} />
                  <text x={1063 + i * 52} y={450} textAnchor="middle" fill={SRV_COLOR[sv]} fontSize={12}>{sv}</text>
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
