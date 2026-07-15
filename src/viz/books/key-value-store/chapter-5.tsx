// The Trade-off: pick two, then tune it
//
// Grounding (donnemartin/system-design-primer):
//   README.md § CAP theorem — "Consistency: every read receives the most
//   recent write or an error. Availability: every request receives a
//   response, without guarantee that it contains the most recent version.
//   Networks aren't reliable, so you'll need to support partition tolerance
//   and make a software tradeoff between consistency and availability";
//   CP "if your business needs require atomic reads and writes", AP "when
//   the system needs to continue working despite external errors".
//   § Consistency patterns — weak (memcached, calls/games), eventual (DNS,
//   email, async replication), strong (file systems, relational databases).
//
// Visual machine: a jagged crack severs the replica mesh mid-stage. The same
// stranded write is answered twice — door CP refuses with an error, door AP
// accepts and serves a stale cart on the far side. The crack heals and the
// stamps reconcile (eventual consistency); a spectrum bar + the R/W dial from
// chapter four show the choice as a tuner, not a menu. Ends with a five-glyph
// recap of the whole book on a quiet stage.
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
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Layout — one replica stranded left, two right; the crack between them.
// ---------------------------------------------------------------------------

interface Pt {
  x: number;
  y: number;
}
const L_CLIENT: Pt = { x: 160, y: 190 };
const R_CLIENT: Pt = { x: 1185, y: 250 };
const NODE_A: Pt = { x: 360, y: 330 };
const NODE_B: Pt = { x: 810, y: 250 };
const NODE_C: Pt = { x: 980, y: 420 };
const NODES = [
  { id: 'A', p: NODE_A, side: 'left' as const },
  { id: 'B', p: NODE_B, side: 'right' as const },
  { id: 'C', p: NODE_C, side: 'right' as const },
];
const NODE_COLOR: Record<string, string> = { A: colors.ACCENT, B: colors.POSITIVE, C: colors.SECONDARY };
// mesh edges (A–B and A–C cross the crack; B–C stays intact)
const EDGES: [Pt, Pt, boolean][] = [
  [NODE_A, NODE_B, true],
  [NODE_A, NODE_C, true],
  [NODE_B, NODE_C, false],
];

// the crack: a seeded jagged polyline down the middle of the stage
const rand = mulberry32(7);
const CRACK: { x: number; y: number }[] = Array.from({ length: 13 }, (_, i) => ({
  x: 585 + (rand() - 0.5) * 90,
  y: 40 + (i / 12) * 560,
}));
const crackD = CRACK.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');

// C · A · P letters, top right
const CAP_X = [960, 1040, 1120];
const CAP_Y = 84;

// the consistency spectrum bar
const SPEC = { x: 290, y: 280, w: 700 } as const;
const SPEC_STOPS = [
  { t: 0.08, name: 'weak', sub: 'live calls · games' },
  { t: 0.5, name: 'eventual', sub: 'DNS · email' },
  { t: 0.92, name: 'strong', sub: 'relational databases' },
];

// recap glyph row
const RECAP_X = [200, 420, 640, 860, 1080];
const RECAP_Y = 330;
const RECAP_LABELS = ['a hash table', 'the ring', 'three copies', 'the quorum', 'the dial'];

const CAM_LEFT: CameraState = { x: 420, y: 320, k: 1.18 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const meshU = tl.channel('meshU', 0); // nodes + edges entrance
  const flow = tl.channel('flow', 0); // dash traffic on the mesh (linear, long)
  const crackU = tl.channel('crackU', 0); // the crack draw-on (1) and heal (→0)
  const capU = tl.channel('capU', 0); // C·A·P letters
  const lockU = tl.channel('lockU', 0); // the lock under P
  const wIn = tl.channel('wIn', 0); // the stranded write, client → A
  const cpU = tl.channel('cpU', 0); // door one: refuse (error chip)
  const apU = tl.channel('apU', 0); // door two: accept
  const staleR = tl.channel('staleR', 0); // right client reads stale C (0..2)
  const vA = tl.channel('vA', 11); // version stamps
  const vB = tl.channel('vB', 11);
  const vC = tl.channel('vC', 11);
  const healU = tl.channel('healU', 0); // crack retracts + sync packets
  const clusterDim = tl.channel('clusterDim', 0); // quiet the cluster for the bar
  const specU = tl.channel('specU', 0); // spectrum bar
  const knob = tl.channel('knob', 0.5); // slider position 0..1
  const dialU = tl.channel('dialU', 0); // the W dial
  const dialW = tl.channel('dialW', 2); // W value 1..3
  const specDim = tl.channel('specDim', 0); // quiet the bar for the recap
  const recapU = tl.channel('recapU', 0); // five glyphs stagger in

  // — Beat 1 · the disaster where nothing crashes —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'One disaster left — the one where nothing crashes. The machines on both sides are perfectly healthy; the network between them just stops carrying their messages.',
  });
  tl.tween(meshU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(flow, 1, { at: 1.2, dur: 60, ease: ease.linear });
  tl.tween(crackU, 1, { at: 3.6, dur: 1.6, ease: ease.draw });
  tl.hold(7.1, 0.5);

  // — Beat 2 · partitions are not optional —
  tl.caption({
    at: 7.6,
    dur: 5.8,
    text: 'That is a partition, and it is not optional. Real networks drop, delay, and sever — so a store that lives on many machines has to survive the split.',
  });
  tl.tween(capU, 1, { at: 8.2, dur: 0.9, ease: ease.enter });
  tl.tween(lockU, 1, { at: 11.2, dur: 0.6, ease: ease.pop });
  tl.hold(13.4, 0.5);

  // — Beat 3 · pick two —
  tl.caption({
    at: 13.9,
    dur: 6.6,
    text: 'The classic theorem says a distributed system guarantees two of three: consistency, availability, partition tolerance. Partitions invite themselves — so the real choice is between the other two.',
  });
  tl.hold(20.5, 0.5);

  // — Beat 4 · the stranded write —
  tl.caption({
    at: 21.0,
    dur: 5.6,
    text: 'Here is the moment of truth. A write arrives on the left — where only one of the three replicas can hear it. A quorum of two is out of reach.',
  });
  tl.tween(cam, CAM_LEFT, { at: 21.2, dur: 1.6, ease: ease.move });
  tl.tween(wIn, 1, { at: 22.6, dur: 1.2, ease: ease.linear });
  tl.hold(26.6, 0.5);

  // — Beat 5 · door one: consistent —
  tl.caption({
    at: 27.1,
    dur: 6.4,
    text: 'Door one: stay consistent. The left side refuses — better no answer than a wrong one. Every read receives the most recent write, or an error.',
  });
  tl.tween(cpU, 1, { at: 28.0, dur: 0.8, ease: ease.enter });
  tl.hold(33.5, 0.5);

  // — Beat 6 · door two: available —
  tl.caption({
    at: 34.0,
    dur: 6.8,
    text: 'Door two: stay available. Take the write on the replica you can reach and answer every request with what you have — knowing the far side now serves yesterday’s cart.',
  });
  tl.tween(cpU, 0, { at: 34.2, dur: 0.6, ease: ease.enter });
  tl.tween(apU, 1, { at: 34.8, dur: 0.8, ease: ease.enter });
  tl.set(vA, 12, 35.6);
  tl.tween(cam, CAMERA_HOME, { at: 36.0, dur: 1.6, ease: ease.move });
  tl.tween(staleR, 2, { at: 37.6, dur: 2.4, ease: ease.linear });
  tl.hold(40.8, 0.5);

  // — Beat 7 · neither door is wrong —
  tl.caption({
    at: 41.3,
    dur: 5.2,
    text: 'Neither door is wrong. A bank balance wants the error. A shopping cart, a feed, a view counter — they want the answer, even a slightly old one.',
  });
  tl.hold(46.5, 0.5);

  // — Beat 8 · the heal —
  tl.caption({
    at: 47.0,
    dur: 6.2,
    text: 'Then the network heals. The stranded write flows across, the stamps reconcile, and every replica agrees again. Given quiet, convergence — eventual consistency.',
  });
  tl.tween(crackU, 0, { at: 47.6, dur: 1.4, ease: ease.move });
  tl.tween(healU, 1, { at: 49.2, dur: 2.2, ease: ease.linear });
  tl.set(vB, 12, 50.6);
  tl.set(vC, 12, 51.2);
  tl.hold(53.2, 0.5);

  // — Beat 9 · the spectrum —
  tl.caption({
    at: 53.7,
    dur: 6.8,
    text: 'Because consistency is not a switch — it is a spectrum. Weak: a dropped word in a live call is simply gone. Eventual: the email arrives a beat late. Strong: your bank statement, every time.',
  });
  tl.tween(clusterDim, 1, { at: 53.9, dur: 1.2, ease: ease.move });
  tl.tween(specU, 1, { at: 55.0, dur: 1.2, ease: ease.draw });
  tl.tween(knob, 0.08, { at: 56.4, dur: 1.0, ease: ease.move });
  tl.tween(knob, 0.92, { at: 57.8, dur: 2.0, ease: ease.move });
  tl.hold(60.5, 0.4);

  // — Beat 10 · the tuner —
  tl.caption({
    at: 60.9,
    dur: 6.2,
    text: 'And your quorum knobs from last chapter are the tuner. Write to all three, read from one: slow and strong. Write to one: fast, loose, repaired later.',
  });
  tl.tween(dialU, 1, { at: 61.4, dur: 0.8, ease: ease.enter });
  tl.tween(dialW, 3, { at: 62.2, dur: 1.0, ease: ease.move });
  tl.tween(knob, 0.92, { at: 62.2, dur: 1.0, ease: ease.move });
  tl.tween(dialW, 1, { at: 64.6, dur: 1.4, ease: ease.move });
  tl.tween(knob, 0.15, { at: 64.6, dur: 1.4, ease: ease.move });
  tl.hold(67.1, 0.4);

  // — Beat 11 · a dial, not a menu —
  tl.caption({
    at: 67.5,
    dur: 5.0,
    text: 'So the theorem is not a menu you order from once. It is a dial you set per table, per feature, per promise you have made to your users.',
  });
  tl.tween(dialW, 2, { at: 68.2, dur: 1.2, ease: ease.move });
  tl.tween(knob, 0.5, { at: 68.2, dur: 1.2, ease: ease.move });
  tl.hold(72.5, 0.5);

  // — Beat 12 · the recap —
  tl.caption({
    at: 73.0,
    dur: 7.6,
    text: 'Look how far one idea traveled. A hash table gave us the shape. The ring sharded it. Three copies made it durable. Overlapping quorums kept it honest. And a dial decides what happens when the world splits.',
  });
  tl.tween(specDim, 1, { at: 73.2, dur: 1.0, ease: ease.move });
  tl.tween(recapU, 5, { at: 74.0, dur: 4.6, ease: ease.linear });
  tl.hold(80.6, 0.4);

  // — Beat 13 · close —
  tl.caption({
    at: 81.0,
    dur: 5.2,
    text: 'That is the key-value store — solved the way interviews want it solved: one small idea, scaled until it holds.',
  });
  tl.hold(86.2, 1.4);

  return {
    tl, cam, meshU, flow, crackU, capU, lockU, wIn, cpU, apU, staleR,
    vA, vB, vC, healU, clusterDim, specU, knob, dialU, dialW, specDim, recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Node({ id, x, y, u, dim, v }: { id: string; x: number; y: number; u: number; dim: number; v: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u * (1 - dim * 0.85)}>
      <circle cx={x} cy={y} r={24} fill={colors.BG} stroke={NODE_COLOR[id]} strokeWidth={2.6} />
      <text x={x} y={y + 6} textAnchor="middle" fontSize={15} fill={NODE_COLOR[id]}>{id}</text>
      <text x={x} y={y + 44} textAnchor="middle" fontSize={12} fill={colors.MUTED}
        fontFamily="ui-monospace, monospace">{`cart:42 v${Math.round(v)}`}</text>
    </g>
  );
}

/** the little recap glyphs — one per chapter of the book */
function RecapGlyph({ i, x, y, u }: { i: number; x: number; y: number; u: number }) {
  if (u <= 0) return null;
  const c = [colors.ACCENT, colors.POSITIVE, colors.WARM, colors.TEAL, colors.SECONDARY][i];
  return (
    <g opacity={u} transform={`translate(${x}, ${y}) scale(${0.85 + 0.15 * u})`}>
      {i === 0 && ( // the hash funnel
        <g>
          <path d="M-26 -22 L26 -22 L8 6 L8 22 L-8 22 L-8 6 Z" fill="none" stroke={c} strokeWidth={2.4} />
          <circle cx={0} cy={-34} r={4} fill={c} />
        </g>
      )}
      {i === 1 && ( // the ring
        <g>
          <circle r={26} fill="none" stroke={c} strokeWidth={2.4} />
          {[0.1, 0.45, 0.75].map((t) => (
            <circle key={t} cx={26 * Math.sin(t * Math.PI * 2)} cy={-26 * Math.cos(t * Math.PI * 2)} r={4.5} fill={c} />
          ))}
        </g>
      )}
      {i === 2 && ( // three copies
        <g>
          {[-18, 0, 18].map((dx, j) => (
            <circle key={j} cx={dx} cy={j === 1 ? -8 : 4} r={9} fill={c} opacity={0.5 + j * 0.2} />
          ))}
        </g>
      )}
      {i === 3 && ( // the overlapping quorum
        <g>
          <rect x={-30} y={-18} width={38} height={36} rx={7} fill={c} opacity={0.3} />
          <rect x={-8} y={-18} width={38} height={36} rx={7} fill="none" stroke={c} strokeWidth={2.2} strokeDasharray="5 4" />
          <rect x={-8} y={-18} width={16} height={36} rx={5} fill={c} opacity={0.65} />
        </g>
      )}
      {i === 4 && ( // the dial
        <g>
          <path d="M-24 10 A26 26 0 1 1 24 10" fill="none" stroke={c} strokeWidth={2.4} />
          <line x1={0} y1={6} x2={13} y2={-14} stroke={c} strokeWidth={2.8} strokeLinecap="round" />
          <circle r={4} cy={6} fill={c} />
        </g>
      )}
      <text y={54} textAnchor="middle" fontSize={13} fill={colors.MUTED}>{RECAP_LABELS[i]}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const meshU = s.get(scene.meshU);
  const flow = s.get(scene.flow);
  const crackU = s.get(scene.crackU);
  const capU = s.get(scene.capU);
  const lockU = s.get(scene.lockU);
  const wIn = s.get(scene.wIn);
  const cpU = s.get(scene.cpU);
  const apU = s.get(scene.apU);
  const staleR = s.get(scene.staleR);
  const vs = { A: s.get(scene.vA), B: s.get(scene.vB), C: s.get(scene.vC) };
  const healU = s.get(scene.healU);
  const clusterDim = s.get(scene.clusterDim);
  const specU = s.get(scene.specU);
  const knob = s.get(scene.knob);
  const dialU = s.get(scene.dialU);
  const dialW = s.get(scene.dialW);
  const specDim = s.get(scene.specDim);
  const recapU = s.get(scene.recapU);

  const split = crackU > 0.5; // the mesh is severed while the crack is drawn
  const dash = flow * 400;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the mesh */}
        <g opacity={meshU * (1 - clusterDim * 0.88)}>
          {EDGES.map(([a, b, crosses], i) => {
            const cut = crosses && split;
            return (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={cut ? colors.NEGATIVE : colors.GRID}
                strokeWidth={cut ? 1.2 : 2}
                strokeDasharray={cut ? '3 9' : '7 7'}
                strokeDashoffset={cut ? 0 : -dash}
                opacity={cut ? 0.35 : 0.9} />
            );
          })}
          {/* clients */}
          <g>
            <circle cx={L_CLIENT.x} cy={L_CLIENT.y} r={9} fill={colors.WARM} />
            <text x={L_CLIENT.x} y={L_CLIENT.y - 16} textAnchor="middle" fill={colors.WARM} fontSize={12}>client</text>
            <g opacity={apU}>
              <circle cx={R_CLIENT.x} cy={R_CLIENT.y} r={9} fill={colors.TEAL} />
              <text x={R_CLIENT.x} y={R_CLIENT.y - 16} textAnchor="middle" fill={colors.TEAL} fontSize={12}>client</text>
            </g>
          </g>
        </g>
        {NODES.map((n) => (
          <Node key={n.id} id={n.id} x={n.p.x} y={n.p.y} u={meshU} dim={clusterDim} v={vs[n.id as 'A' | 'B' | 'C']} />
        ))}

        {/* the crack */}
        <g opacity={1 - clusterDim}>
          <path d={crackD} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.4}
            strokeLinejoin="round" strokeDasharray={`${crackU * 900} 900`} opacity={0.9} />
          <path d={crackD} fill="none" stroke={colors.NEGATIVE} strokeWidth={12}
            strokeLinejoin="round" strokeDasharray={`${crackU * 900} 900`} opacity={0.12} />
        </g>

        {/* C · A · P */}
        <g opacity={capU * (1 - clusterDim * 0.9)}>
          {['C', 'A', 'P'].map((ch, i) => {
            const isP = i === 2;
            return (
              <g key={ch}>
                <circle cx={CAP_X[i]} cy={CAP_Y} r={24} fill={colors.PANEL}
                  stroke={isP ? colors.NEGATIVE : colors.TEXT} strokeWidth={isP ? 2.4 : 1.4}
                  opacity={isP ? 1 : 0.9} />
                <text x={CAP_X[i]} y={CAP_Y + 6} textAnchor="middle" fontSize={18}
                  fill={isP ? colors.NEGATIVE : colors.TEXT}>{ch}</text>
              </g>
            );
          })}
          <text x={CAP_X[0] - 34} y={CAP_Y + 6} textAnchor="end" fill={colors.MUTED} fontSize={12}>pick two:</text>
          {/* the lock under P — partitions choose themselves */}
          <g opacity={lockU} transform={`translate(${CAP_X[2]}, ${CAP_Y + 44})`}>
            <rect x={-9} y={-4} width={18} height={13} rx={3} fill={colors.NEGATIVE} opacity={0.85} />
            <path d="M-5 -4 v-4 a5 5 0 0 1 10 0 v4" fill="none" stroke={colors.NEGATIVE} strokeWidth={2.2} />
            <text y={28} textAnchor="middle" fontSize={11} fill={colors.MUTED}>not optional</text>
          </g>
        </g>

        {/* the stranded write */}
        {wIn > 0 && wIn < 1 && (
          <g>
            <circle cx={L_CLIENT.x + (NODE_A.x - L_CLIENT.x) * wIn}
              cy={L_CLIENT.y + (NODE_A.y - L_CLIENT.y) * wIn - Math.sin(wIn * Math.PI) * 30}
              r={7} fill={colors.WARM} />
            <text x={L_CLIENT.x + (NODE_A.x - L_CLIENT.x) * wIn}
              y={L_CLIENT.y + (NODE_A.y - L_CLIENT.y) * wIn - Math.sin(wIn * Math.PI) * 30 - 13}
              textAnchor="middle" fontSize={11} fill={colors.WARM}
              fontFamily="ui-monospace, monospace">PUT cart:42</text>
          </g>
        )}

        {/* door one: refuse */}
        <g opacity={cpU * (1 - clusterDim)}>
          <rect x={L_CLIENT.x - 52} y={L_CLIENT.y + 26} width={104} height={30} rx={8}
            fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text x={L_CLIENT.x} y={L_CLIENT.y + 46} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}
            fontFamily="ui-monospace, monospace">error</text>
          <rect x={NODE_A.x - 74} y={NODE_A.y - 86} width={148} height={30} rx={8}
            fill={colors.PANEL} stroke={colors.TEXT} />
          <text x={NODE_A.x} y={NODE_A.y - 66} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            consistent · refuses
          </text>
        </g>

        {/* door two: accept + the stale read on the far side */}
        <g opacity={apU * (1 - clusterDim)}>
          <rect x={NODE_A.x - 74} y={NODE_A.y - 86} width={148} height={30} rx={8}
            fill={colors.PANEL} stroke={colors.TEXT} opacity={cpU > 0.02 ? 0 : 1} />
          <text x={NODE_A.x} y={NODE_A.y - 66} textAnchor="middle" fill={colors.TEXT} fontSize={12}
            opacity={cpU > 0.02 ? 0 : 1}>
            available · accepts
          </text>
        </g>
        {staleR > 0 && staleR < 2 && (
          <g>
            {(() => {
              const u = staleR <= 1 ? staleR : staleR - 1;
              const from = staleR <= 1 ? R_CLIENT : NODE_C;
              const to = staleR <= 1 ? NODE_C : R_CLIENT;
              const p = {
                x: from.x + (to.x - from.x) * u,
                y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 26,
              };
              return (
                <g>
                  <circle cx={p.x} cy={p.y} r={6} fill={staleR <= 1 ? colors.TEAL : colors.WARM} />
                  {staleR > 1 && (
                    <text x={p.x + 10} y={p.y - 8} fontSize={11} fill={colors.WARM}
                      fontFamily="ui-monospace, monospace">v11 — stale</text>
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* the heal: stranded write crosses to B and C */}
        {healU > 0 && healU < 1 && (
          <g>
            {[NODE_B, NODE_C].map((to, i) => {
              const u = clamp01(healU * 1.5 - i * 0.35);
              if (u <= 0 || u >= 1) return null;
              return (
                <circle key={i}
                  cx={NODE_A.x + (to.x - NODE_A.x) * u}
                  cy={NODE_A.y + (to.y - NODE_A.y) * u - Math.sin(u * Math.PI) * 44}
                  r={6} fill={colors.POSITIVE} />
              );
            })}
          </g>
        )}

        {/* the consistency spectrum */}
        <g opacity={specU * (1 - specDim * 0.92)}>
          <line x1={SPEC.x} y1={SPEC.y} x2={SPEC.x + SPEC.w * specU} y2={SPEC.y}
            stroke={colors.GRID} strokeWidth={4} strokeLinecap="round" />
          {SPEC_STOPS.map((st) => (
            <g key={st.name} opacity={clamp01(specU * 1.5 - st.t)}>
              <circle cx={SPEC.x + SPEC.w * st.t} cy={SPEC.y} r={6} fill={colors.MUTED} />
              <text x={SPEC.x + SPEC.w * st.t} y={SPEC.y - 22} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                {st.name}
              </text>
              <text x={SPEC.x + SPEC.w * st.t} y={SPEC.y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                {st.sub}
              </text>
            </g>
          ))}
          {/* the slider */}
          <g transform={`translate(${SPEC.x + SPEC.w * knob}, ${SPEC.y})`}>
            <circle r={13} fill={colors.WARM} opacity={0.25} />
            <circle r={8} fill={colors.WARM} />
          </g>

          {/* the W dial */}
          <g opacity={dialU} transform={`translate(640, 460)`}>
            <path d="M-46 20 A50 50 0 1 1 46 20" fill="none" stroke={colors.GRID} strokeWidth={4} />
            {(() => {
              // W=1 → -115°, W=3 → +115°
              const a = ((dialW - 2) / 1) * (115 * Math.PI / 180);
              return (
                <line x1={0} y1={0} x2={Math.sin(a) * 38} y2={-Math.cos(a) * 38}
                  stroke={colors.WARM} strokeWidth={3.4} strokeLinecap="round" />
              );
            })()}
            <circle r={5} fill={colors.WARM} />
            <text x={-56} y={34} textAnchor="middle" fill={colors.MUTED} fontSize={13}
              fontFamily="ui-monospace, monospace">W=1</text>
            <text x={56} y={34} textAnchor="middle" fill={colors.MUTED} fontSize={13}
              fontFamily="ui-monospace, monospace">W=3</text>
            <text y={58} textAnchor="middle" fill={colors.MUTED} fontSize={12}>the write quorum, from chapter four</text>
          </g>
        </g>

        {/* the recap row */}
        {RECAP_X.map((x, i) => (
          <RecapGlyph key={i} i={i} x={x} y={RECAP_Y} u={win(recapU / 5, 5, i, 1.6)} />
        ))}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
