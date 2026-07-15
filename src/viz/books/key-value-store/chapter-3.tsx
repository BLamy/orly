// Replication: three copies of everything
//
// Grounding (donnemartin/system-design-primer):
//   README.md § Availability patterns > Fail-over/Replication — "There is a
//   potential for loss of data if the active system fails before any newly
//   written data can be replicated"; § Sharding — "if one shard goes down…
//   you'll want to add some form of replication to avoid data loss";
//   § Master-slave / master-master replication. The successor-list scheme
//   (copies on the next nodes around the ring) is the standard design from
//   the Dynamo paper the primer cites under Document store.
//
// Visual machine: the ring from chapter two persists. The write packet walks
// the ring past its home node, dropping a copy coin on each of the next two
// nodes; a triple coverage band paints itself around the ring (every slice
// held three deep). Then the home node dies twice — once before replication
// (the value evaporates), once after (reads reroute, a replacement back-fills).
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
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Geometry — same ring language as chapter two, shifted left to make room.
// ---------------------------------------------------------------------------

const RING = { cx: 560, cy: 330, r: 200 } as const;
const pos = (t: number, rad: number = RING.r): { x: number; y: number } => {
  const phi = (t - 0.5) * TAU;
  return { x: RING.cx + rad * Math.sin(phi), y: RING.cy + rad * Math.cos(phi) };
};
const fwd = (from: number, to: number): number => (to - from + 1) % 1;
/** arc path along the ring in the forward (increasing-t) direction */
function arcPath(t0: number, t1: number, rad: number): string {
  const a = pos(t0, rad);
  const b = pos(t1, rad);
  const d = fwd(t0, t1);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} A${rad} ${rad} 0 ${d > 0.5 ? 1 : 0} 0 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
/** point d forward around the ring from t (for packet walks) */
const alongRing = (t: number, d: number, rad: number = RING.r): { x: number; y: number } => pos((t + d) % 1, rad);

// Four machines, hand-placed with honest jitter; the hero key lands before B.
type ServerId = 'A' | 'B' | 'C' | 'D';
const SRV: { id: ServerId; t: number }[] = [
  { id: 'A', t: 0.04 },
  { id: 'B', t: 0.3 },
  { id: 'C', t: 0.55 },
  { id: 'D', t: 0.78 },
];
const SRV_COLOR: Record<ServerId, string> = {
  A: colors.ACCENT,
  B: colors.POSITIVE,
  C: colors.SECONDARY,
  D: colors.WARM,
};
const T_OF: Record<ServerId, number> = { A: 0.04, B: 0.3, C: 0.55, D: 0.78 };
const HERO_T = 0.21; // cart:42 hashes here → home is B, copies on C and D
const REPLICAS: ServerId[] = ['B', 'C', 'D'];

/** the write's walk: 0..1 client→ring entry, then 1..2 →B, 2..3 →C, 3..4 →D */
const CLIENT = { x: 150, y: 130 } as const;
function writePos(w: number): { x: number; y: number } {
  const entry = pos(HERO_T, RING.r + 26);
  if (w <= 1) {
    const t = clamp01(w);
    return {
      x: CLIENT.x + (entry.x - CLIENT.x) * t,
      y: CLIENT.y + (entry.y - CLIENT.y) * t - Math.sin(t * Math.PI) * 40,
    };
  }
  const legs: [number, number][] = [
    [HERO_T, fwd(HERO_T, T_OF.B)],
    [T_OF.B, fwd(T_OF.B, T_OF.C)],
    [T_OF.C, fwd(T_OF.C, T_OF.D)],
  ];
  const li = Math.min(2, Math.floor(w - 1));
  const lt = clamp01(w - 1 - li);
  const [t0, span] = legs[li];
  return alongRing(t0, span * lt, RING.r + 26);
}

/** coverage bands: every server's slice appears at 3 radii (3 copies) */
interface Band {
  t0: number;
  t1: number;
  owner: ServerId;
  depth: number; // 0 = primary, 1 = second copy, 2 = third copy
}
const BANDS: Band[] = (() => {
  const out: Band[] = [];
  const n = SRV.length;
  for (let i = 0; i < n; i++) {
    const prev = SRV[(i - 1 + n) % n];
    const cur = SRV[i];
    for (let d = 0; d < 3; d++) {
      // the slice (prev, cur] is held by cur, cur+1, cur+2
      const holder = SRV[(i + d) % n].id;
      out.push({ t0: prev.t, t1: cur.t, owner: holder, depth: d });
    }
  }
  return out;
})();

const CAM_HERO: CameraState = { x: 620, y: 300, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0); // ring + machines recap
  const heroU = tl.channel('heroU', 0); // cart:42 dot + its single copy coin
  const die1 = tl.channel('die1', 0); // first death of B
  const gone = tl.channel('gone', 0); // the value evaporating (floats up)
  const rewind = tl.channel('rewind', 0); // disaster reversed
  const walk = tl.channel('walk', 0); // the write's 4-leg walk (0..4)
  const n3U = tl.channel('n3U', 0); // N = 3 label
  const bandU = tl.channel('bandU', 0); // coverage bands (0..12 staggered)
  const die2 = tl.channel('die2', 0); // second death of B
  const readU = tl.channel('readU', 0); // reroute read: client→C→client (0..2)
  const eU = tl.channel('eU', 0); // replacement node at B's spot
  const stream = tl.channel('stream', 0); // back-fill packets C/D → E
  const verU = tl.channel('verU', 0); // version stamps appear
  const endU = tl.channel('endU', 0); // quiet ending

  // — Beat 1 · one home each —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Here is the catch nobody mentions in chapter two: the ring gave every key exactly one home. One copy of your cart, on one mortal machine.',
  });
  tl.tween(ringU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(heroU, 1, { at: 2.6, dur: 0.8, ease: ease.pop });
  tl.tween(cam, CAM_HERO, { at: 2.8, dur: 1.6, ease: ease.move });
  tl.hold(6.7, 0.5);

  // — Beat 2 · what a dead machine costs now —
  tl.caption({
    at: 7.2,
    dur: 5.8,
    text: 'Watch what a dead machine costs now. This node holds the cart — and when the node dies, the cart is not slow. It is gone.',
  });
  tl.tween(die1, 1, { at: 8.6, dur: 0.8, ease: ease.enter });
  tl.tween(gone, 1, { at: 9.6, dur: 2.2, ease: ease.move });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the blunt rule —
  tl.caption({
    at: 13.5,
    dur: 5.2,
    text: 'The rule is blunt: data that lives in one place is lost the moment that place fails. Durability has to be built in before the failure, not after.',
  });
  tl.hold(18.7, 0.5);

  // — Beat 4 · rewind, change one thing —
  tl.caption({
    at: 19.2,
    dur: 5.4,
    text: 'So rewind the disaster and change exactly one thing: a write no longer stops at its home node.',
  });
  tl.tween(rewind, 1, { at: 19.6, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.hold(24.6, 0.4);

  // — Beat 5 · the write keeps walking —
  tl.caption({
    at: 25.0,
    dur: 6.6,
    text: 'It lands on its home and keeps walking — dropping a copy on the next node, and the next. Three machines now hold the cart.',
  });
  tl.tween(walk, 4, { at: 25.4, dur: 4.6, ease: ease.linear });
  tl.tween(n3U, 1, { at: 30.2, dur: 0.6, ease: ease.pop });
  tl.hold(31.6, 0.6);

  // — Beat 6 · coverage, three deep —
  tl.caption({
    at: 32.2,
    dur: 6.0,
    text: 'Run that rule for every key, and each machine carries its own slice plus copies of its two neighbors. The whole ring is covered three layers deep.',
  });
  tl.tween(bandU, 12, { at: 32.6, dur: 3.6, ease: ease.linear });
  tl.hold(38.2, 0.5);

  // — Beat 7 · kill it again —
  tl.caption({
    at: 38.7,
    dur: 5.6,
    text: 'Now kill that same machine again. The home copy dies with it — but two copies are already standing on the next nodes around the ring.',
  });
  tl.tween(die2, 1, { at: 39.6, dur: 0.9, ease: ease.enter });
  tl.hold(44.3, 0.4);

  // — Beat 8 · reads reroute —
  tl.caption({
    at: 44.7,
    dur: 5.6,
    text: 'A read for the cart just walks a little further and hits a surviving copy. Durability stops being luck: lose fewer than three machines, lose nothing.',
  });
  tl.tween(readU, 2, { at: 45.1, dur: 2.6, ease: ease.linear });
  tl.hold(50.3, 0.4);

  // — Beat 9 · the ring heals —
  tl.caption({
    at: 50.7,
    dur: 5.8,
    text: 'When a replacement joins, the survivors stream the missing slice onto it, and the ring quietly heals back to three copies of everything.',
  });
  tl.tween(eU, 1, { at: 51.4, dur: 0.7, ease: ease.pop });
  tl.tween(stream, 1, { at: 52.2, dur: 2.6, ease: ease.linear });
  tl.hold(56.5, 0.4);

  // — Beat 10 · copies drift —
  tl.caption({
    at: 56.9,
    dur: 5.6,
    text: 'But copies buy durability at a price: there are three of them now, and machines drift. Here one replica is already a version behind.',
  });
  tl.tween(verU, 1, { at: 57.6, dur: 1.0, ease: ease.enter });
  tl.tween(endU, 0.6, { at: 58.0, dur: 1.2, ease: ease.move });
  tl.hold(62.5, 0.4);

  // — Beat 11 · tee up the quorum —
  tl.caption({
    at: 62.9,
    dur: 5.4,
    text: 'Keeping three copies honest — without waiting on the slowest one — is the next trick. It is called a quorum.',
  });
  tl.tween(endU, 1, { at: 63.2, dur: 1.0, ease: ease.move });
  tl.hold(68.3, 1.2);

  return {
    tl, cam, ringU, heroU, die1, gone, rewind, walk, n3U, bandU, die2,
    readU, eU, stream, verU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** a copy coin (small value token) at a node */
function Coin({ x, y, u, stale, label }: { x: number; y: number; u: number; stale?: boolean; label?: string }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={11} fill={stale ? colors.WARM : colors.ACCENT} opacity={0.25} />
      <circle cx={x} cy={y} r={7} fill={stale ? colors.WARM : colors.ACCENT} />
      {label && (
        <text x={x} y={y + 24} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace"
          fill={stale ? colors.WARM : colors.MUTED}>{label}</text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const heroU = s.get(scene.heroU);
  const die1 = s.get(scene.die1);
  const gone = s.get(scene.gone);
  const rewind = s.get(scene.rewind);
  const walk = s.get(scene.walk);
  const n3U = s.get(scene.n3U);
  const bandU = s.get(scene.bandU);
  const die2 = s.get(scene.die2);
  const readU = s.get(scene.readU);
  const eU = s.get(scene.eU);
  const stream = s.get(scene.stream);
  const verU = s.get(scene.verU);
  const endU = s.get(scene.endU);

  const bDown = clamp01(die1 * (1 - rewind)) + die2; // B is dead in either window
  const heroP = pos(HERO_T);
  const bP = pos(T_OF.B);
  const cP = pos(T_OF.C);
  const dP = pos(T_OF.D);
  const wp = writePos(walk);
  const dimAll = endU * 0.85;

  // read reroute path: client → C (the next surviving copy) → back
  const readTarget = pos(T_OF.C, RING.r + 26);
  const readP =
    readU <= 1
      ? {
          x: CLIENT.x + (readTarget.x - CLIENT.x) * clamp01(readU),
          y: CLIENT.y + (readTarget.y - CLIENT.y) * clamp01(readU) + Math.sin(clamp01(readU) * Math.PI) * 30,
        }
      : {
          x: readTarget.x + (CLIENT.x - readTarget.x) * clamp01(readU - 1),
          y: readTarget.y + (CLIENT.y - readTarget.y) * clamp01(readU - 1) - Math.sin(clamp01(readU - 1) * Math.PI) * 30,
        };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the ring */}
        <g opacity={ringU * (1 - dimAll)}>
          <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke={colors.GRID} strokeWidth={2}
            strokeDasharray={`${ringU * 1300} 1300`} />

          {/* coverage bands — every slice, three layers deep */}
          {BANDS.map((b, i) => {
            const u = clamp01(bandU - i);
            if (u <= 0) return null;
            const rad = RING.r + 14 + b.depth * 11;
            const t1 = (b.t0 + fwd(b.t0, b.t1) * u) % 1;
            return (
              <path key={i} d={arcPath(b.t0, t1, rad)} fill="none" stroke={SRV_COLOR[b.owner]}
                strokeWidth={5} opacity={(0.5 - b.depth * 0.13) * (1 - die2 * (b.owner === 'B' ? 0.8 : 0))} />
            );
          })}

          {/* machines */}
          {SRV.map(({ id, t }) => {
            const p = pos(t);
            const dead = id === 'B' ? clamp01(bDown) : 0;
            const swap = id === 'B' ? clamp01(die2) * eU : 0; // E takes B's spot
            return (
              <g key={id}>
                <g opacity={1 - swap}>
                  <circle cx={p.x} cy={p.y} r={16} fill={colors.BG}
                    stroke={dead > 0.3 ? colors.GRID : SRV_COLOR[id]} strokeWidth={2.5}
                    opacity={dead > 0.3 ? 0.5 : 1} />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13}
                    fill={dead > 0.3 ? colors.MUTED : SRV_COLOR[id]}>{id}</text>
                  {dead > 0.3 && (
                    <g stroke={colors.NEGATIVE} strokeWidth={2.4} opacity={dead}>
                      <line x1={p.x - 11} y1={p.y - 11} x2={p.x + 11} y2={p.y + 11} />
                      <line x1={p.x - 11} y1={p.y + 11} x2={p.x + 11} y2={p.y - 11} />
                    </g>
                  )}
                </g>
                {swap > 0 && (
                  <g opacity={swap}>
                    <circle cx={p.x} cy={p.y} r={16} fill={colors.BG} stroke={colors.TEAL} strokeWidth={2.5} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={13} fill={colors.TEAL}>E</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* the hero key on the ring */}
          <g opacity={heroU}>
            <circle cx={heroP.x} cy={heroP.y} r={6.5} fill={colors.WARM} />
            <text x={heroP.x - 14} y={heroP.y - 12} textAnchor="end" fill={colors.WARM} fontSize={12}
              fontFamily="ui-monospace, monospace">cart:42</text>
          </g>
        </g>

        {/* B's single copy in act one — evaporates when B dies */}
        {rewind < 1 && heroU > 0 && (
          <g opacity={(1 - rewind) * (1 - dimAll)}>
            <Coin x={bP.x + 26} y={bP.y - 30 - gone * 90} u={heroU * (1 - gone)} label={gone < 0.05 ? '3 items' : undefined} />
            {gone > 0.05 && gone < 0.95 && (
              <text x={bP.x + 26} y={bP.y - 40 - gone * 90} textAnchor="middle" fill={colors.NEGATIVE}
                fontSize={12} opacity={Math.sin(gone * Math.PI)}>lost</text>
            )}
          </g>
        )}

        {/* the write walk + the three copies it leaves (the coins stay bright
            through the quiet ending — they ARE the closing image) */}
        <g>
          {walk > 0 && walk < 4 && (
            <g>
              <circle cx={wp.x} cy={wp.y} r={8} fill={colors.WARM} />
              <text x={wp.x} y={wp.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={11}
                fontFamily="ui-monospace, monospace">PUT cart:42</text>
            </g>
          )}
          {walk > 0.1 && (
            <g opacity={clamp01(walk)}>
              <circle cx={CLIENT.x} cy={CLIENT.y} r={9} fill={colors.POSITIVE} opacity={0.9} />
              <text x={CLIENT.x} y={CLIENT.y + 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>client</text>
            </g>
          )}
          {/* copy coins land as the packet passes each replica */}
          <Coin x={bP.x + 34} y={bP.y - 34} u={clamp01((walk - 1.95) * 6) * (1 - die2)} stale={false}
            label={verU > 0 ? undefined : 'copy 1'} />
          <Coin x={cP.x + 32} y={cP.y - 26} u={clamp01((walk - 2.95) * 6)} label={verU > 0.5 ? 'v8' : 'copy 2'} />
          <Coin x={dP.x - 32} y={dP.y + 26} u={clamp01((walk - 3.9) * 10)} stale={verU > 0.5}
            label={verU > 0.5 ? 'v7 — behind' : 'copy 3'} />
          {/* E's back-filled coin */}
          <Coin x={bP.x + 34} y={bP.y - 34} u={clamp01(stream * 2 - 1)} label={verU > 0.5 ? 'v8' : undefined} />
        </g>

        <MathLabel tex={'N = 3'} x={RING.cx + RING.r + 150} y={150} fontSize={22}
          color={colors.TEXT} opacity={n3U * (1 - endU * 0.5)} anchor="middle" />
        <g opacity={n3U * (1 - endU * 0.5)}>
          <text x={RING.cx + RING.r + 150} y={182} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            copies of every key
          </text>
        </g>

        {/* the rerouted read */}
        {readU > 0 && readU < 2 && (
          <g opacity={1 - dimAll}>
            <circle cx={readP.x} cy={readP.y} r={7} fill={readU <= 1 ? colors.POSITIVE : colors.ACCENT} />
            <text x={readP.x} y={readP.y - 13} textAnchor="middle" fontSize={11}
              fill={readU <= 1 ? colors.POSITIVE : colors.ACCENT} fontFamily="ui-monospace, monospace">
              {readU <= 1 ? 'GET cart:42' : '3 items'}
            </text>
          </g>
        )}

        {/* back-fill stream C → E and D → E */}
        {stream > 0 && stream < 1 && (
          <g opacity={1 - dimAll}>
            {[
              { from: cP, u: clamp01(stream * 1.6) },
              { from: dP, u: clamp01(stream * 1.6 - 0.4) },
            ].map((leg, i) => {
              if (leg.u <= 0 || leg.u >= 1) return null;
              return (
                <circle key={i}
                  cx={leg.from.x + (bP.x - leg.from.x) * leg.u}
                  cy={leg.from.y + (bP.y - leg.from.y) * leg.u - Math.sin(leg.u * Math.PI) * 50}
                  r={5.5} fill={colors.TEAL} />
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
