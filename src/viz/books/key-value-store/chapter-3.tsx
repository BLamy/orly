// Replication: three copies or it didn't happen
//
// Grounding: README.md "Availability patterns" (#availability-patterns) —
// fail-over's disadvantage list: "There is a potential for loss of data if
// the active system fails before any newly written data can be replicated";
// replication (#replication); "Availability in parallel":
// Total = 1 − (1 − A)^n. The clockwise replica walk is the preference list
// of the primer's cited key-value-store solution (the Dynamo paper,
// README.md "Design a key-value store like Redis").
//
// Centerpiece: the ring from chapter 2, now under a kill test. One copy dies
// with its node (rewind!), then the write fans out clockwise to C and D and
// survives the same murder. Availability math on screen, from the README.
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
import { Packet } from '../../primitives';

const TAU = Math.PI * 2;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The ring — same geometry and node placement as chapter 2 (continuity).
// ---------------------------------------------------------------------------

const RC = { x: 640, y: 353 } as const;
const R = 185;

const ringPt = (s: number, off = 0): { x: number; y: number } => {
  const psi = (s - 0.5) * TAU;
  return { x: RC.x + (R - off) * Math.sin(psi), y: RC.y - (R - off) * Math.cos(psi) };
};

/** Polyline along the ring from s1 clockwise to s2, revealed by t. */
function walkD(s1: number, s2: number, t: number, off: number): string {
  const span = ((s2 - s1) % 1 + 1) % 1;
  const n = 48;
  const upto = Math.max(1, Math.round(n * clamp01(t)));
  const parts: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const p = ringPt((s1 + span * (i / n)) % 1, off);
    parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

type NodeId = 'A' | 'B' | 'C' | 'D' | 'E';
const NODE_S: Record<NodeId, number> = { A: 0.055, B: 0.35, C: 0.615, D: 0.845, E: 0.945 };
const NODE_COLOR: Record<NodeId, string> = {
  A: colors.ACCENT,
  B: colors.SECONDARY,
  C: colors.POSITIVE,
  D: colors.TEAL,
  E: colors.MUTED,
};
const NODES: NodeId[] = ['A', 'B', 'C', 'D', 'E'];
const OUR_S = 0.302; // user:42, home B — as placed in chapter 2

const CLIENT = { x: 128, y: 120 } as const;
const P_B = ringPt(NODE_S.B);
const P_C = ringPt(NODE_S.C);

// camera marks
const CAM_B: CameraState = { x: 520, y: 270, k: 1.35 };
const CAM_MATH: CameraState = { x: 760, y: 300, k: 1.08 };

// ---------------------------------------------------------------------------
// Timeline (~72s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const ringU = tl.channel('ringU', 0); // ring + nodes fade in
  const keyU = tl.channel('keyU', 0); // our key on its arc, home glow
  const quoteU = tl.channel('quoteU', 0); // README fail-over quote chip
  const die1U = tl.channel('die1U', 0); // B dies (round 1) — key dissolves
  const rewindU = tl.channel('rewindU', 0); // the rewind flourish
  const writeU = tl.channel('writeU', 0); // client → B write packet
  const fanU = tl.channel('fanU', 0); // B → C, B → D replica arcs
  const nU = tl.channel('nU', 0); // "N = 3" chip
  const prefU = tl.channel('prefU', 0); // preference-list panel + span
  const mathU = tl.channel('mathU', 0); // availability formula
  const math2U = tl.channel('math2U', 0); // the nine-nines result
  const die2U = tl.channel('die2U', 0); // B dies (round 2)
  const readU = tl.channel('readU', 0); // client → C read, 0..1 out 1..2 back
  const backU = tl.channel('backU', 0); // B returns + catch-up arc
  const teaseU = tl.channel('teaseU', 0); // closing "who is right?" chips
  const dimU = tl.channel('dimU', 0); // stage quiets for the closing

  // — beat 1 · one copy —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Chapter two gave every key exactly one home. Our key lives on node B — one copy, guarded by one machine.',
  });
  tl.tween(ringU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.tween(keyU, 1, { at: 1.8, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_B, { at: 2.0, dur: 1.5, ease: ease.move });

  // — beat 2 · the primer's warning —
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: "The primer's availability section is blunt about it: if a machine fails before its data is copied anywhere else, that data is simply gone.",
  });
  tl.tween(quoteU, 1, { at: 7.4, dur: 0.8, ease: ease.enter });

  // — beat 3 · B dies, the key dies —
  tl.caption({
    at: 13.6,
    dur: 5.4,
    text: 'So let node B die. No drama, just a Tuesday. The key had one copy — and now it has zero.',
  });
  tl.tween(quoteU, 0, { at: 13.8, dur: 0.6, ease: ease.enter });
  tl.tween(die1U, 1, { at: 14.6, dur: 1.4, ease: ease.move });

  // — beat 4 · rewind —
  tl.caption({
    at: 19.6,
    dur: 4.6,
    text: "That's not a database, that's a bet. Rewind.",
  });
  tl.tween(rewindU, 1, { at: 20.4, dur: 0.6, ease: ease.pop });
  tl.tween(die1U, 0, { at: 21.0, dur: 1.2, ease: ease.move });
  tl.tween(rewindU, 0, { at: 22.8, dur: 0.8, ease: ease.enter });

  // — beat 5 · the write fans out —
  tl.caption({
    at: 24.8,
    dur: 6.4,
    text: "This time the write doesn't stop at B. B stores it, then hands copies to the next two nodes clockwise — C and D. Three copies. That's N.",
  });
  tl.tween(writeU, 1, { at: 25.2, dur: 1.2, ease: ease.linear });
  tl.tween(fanU, 1, { at: 26.6, dur: 1.8, ease: ease.draw });
  tl.tween(nU, 1, { at: 28.8, dur: 0.5, ease: ease.pop });

  // — beat 6 · the preference list —
  tl.caption({
    at: 31.8,
    dur: 5.8,
    text: "That clockwise order isn't decoration. The nodes just past your home node are the preference list — they are where your replicas live.",
  });
  tl.tween(prefU, 1, { at: 32.4, dur: 1.0, ease: ease.enter });

  // — beat 7 · the availability math —
  tl.caption({
    at: 38.2,
    dur: 6.6,
    text: 'Here is what three copies buy. One node with three nines of availability is down almost nine hours a year. Put three in parallel — the formula is in the primer.',
  });
  tl.tween(cam, CAM_MATH, { at: 38.6, dur: 1.4, ease: ease.move });
  tl.tween(mathU, 1, { at: 39.6, dur: 1.0, ease: ease.enter });

  // — beat 8 · nine nines —
  tl.caption({
    at: 45.4,
    dur: 5.2,
    text: 'Nine nines. Failure drops from a yearly certainty to a rounding error — as long as the copies live on different machines.',
  });
  tl.tween(math2U, 1, { at: 46.0, dur: 0.7, ease: ease.pop });

  // — beat 9 · kill B again —
  tl.caption({
    at: 51.2,
    dur: 6.2,
    text: "Now kill B again. The key doesn't blink: C and D are still holding it, and reads simply route to the survivors.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 51.4, dur: 1.4, ease: ease.move });
  tl.tween(die2U, 1, { at: 52.2, dur: 1.0, ease: ease.move });
  tl.tween(readU, 1, { at: 53.6, dur: 1.1, ease: ease.linear });
  tl.tween(readU, 2, { at: 54.9, dur: 1.1, ease: ease.linear });

  // — beat 10 · the write outlives the writer —
  tl.caption({
    at: 58.0,
    dur: 6.0,
    text: 'This is replication doing its one job: the write outlives the writer. B can even come back later and quietly catch up.',
  });
  tl.tween(backU, 1, { at: 59.2, dur: 1.6, ease: ease.move });
  tl.tween(die2U, 0, { at: 59.2, dur: 1.6, ease: ease.move });

  // — beat 11 · three copies, one truth? —
  tl.caption({
    at: 64.4,
    dur: 6.8,
    text: "But we've created a new problem. There are three copies of the truth now — and the moment they can disagree, someone has to decide who's right. That's the next chapter.",
  });
  tl.tween(dimU, 1, { at: 64.8, dur: 1.2, ease: ease.move });
  tl.tween(teaseU, 1, { at: 66.0, dur: 0.9, ease: ease.enter });
  tl.hold(71.2, 1.6);

  return {
    tl,
    cam,
    ringU,
    keyU,
    quoteU,
    die1U,
    rewindU,
    writeU,
    fanU,
    nU,
    prefU,
    mathU,
    math2U,
    die2U,
    readU,
    backU,
    teaseU,
    dimU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const keyU = s.get(scene.keyU);
  const quoteU = s.get(scene.quoteU);
  const die1U = s.get(scene.die1U);
  const rewindU = s.get(scene.rewindU);
  const writeU = s.get(scene.writeU);
  const fanU = s.get(scene.fanU);
  const nU = s.get(scene.nU);
  const prefU = s.get(scene.prefU);
  const mathU = s.get(scene.mathU);
  const math2U = s.get(scene.math2U);
  const die2U = s.get(scene.die2U);
  const readU = s.get(scene.readU);
  const backU = s.get(scene.backU);
  const teaseU = s.get(scene.teaseU);
  const dimU = s.get(scene.dimU);

  const bDead = Math.max(die1U, die2U * (1 - backU));
  const keyAlive = 1 - die1U; // round 1 kills the only copy
  const stage = 1 - 0.85 * dimU;
  const ourP = ringPt(OUR_S);
  const readP = { out: readU <= 1 ? readU : 1, back: clamp01(readU - 1) };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={ringU * stage}>
          {/* the ring */}
          <circle cx={RC.x} cy={RC.y} r={R} fill="none" stroke={colors.GRID} strokeWidth={2.5} />

          {/* nodes */}
          {NODES.map((nd) => {
            const p = ringPt(NODE_S[nd]);
            const lp = ringPt(NODE_S[nd], -30);
            const dead = nd === 'B' ? bDead : 0;
            const back = nd === 'B' ? backU : 0;
            return (
              <g key={nd} opacity={1 - 0.7 * dead}>
                <rect
                  x={p.x - 13}
                  y={p.y - 13}
                  width={26}
                  height={26}
                  rx={7}
                  fill={dead > 0.5 ? colors.BG : NODE_COLOR[nd]}
                  stroke={dead > 0.5 ? colors.NEGATIVE : colors.BG}
                  strokeWidth={2}
                  transform={`rotate(45 ${p.x} ${p.y})`}
                />
                <text x={lp.x} y={lp.y + 5} textAnchor="middle" fill={NODE_COLOR[nd]} fontSize={17} fontWeight={700}>
                  {nd}
                </text>
                {dead > 0.5 && (
                  <text x={p.x} y={p.y + 6} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                    ✕
                  </text>
                )}
                {back > 0.05 && nd === 'B' && (
                  <circle cx={p.x} cy={p.y} r={22} fill="none" stroke={NODE_COLOR.B} strokeWidth={1.5} opacity={back * 0.8} strokeDasharray="3 4" />
                )}
              </g>
            );
          })}

          {/* our key on its arc */}
          <g opacity={keyU * Math.max(keyAlive, 0.06)}>
            <circle cx={ourP.x} cy={ourP.y} r={7.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
            <text x={ourP.x - 16} y={ourP.y - 12} textAnchor="end" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
              user:42
            </text>
          </g>
          {die1U > 0.4 && keyU > 0 && (
            <text x={ourP.x - 16} y={ourP.y + 26} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontStyle="italic" opacity={die1U}>
              zero copies
            </text>
          )}

          {/* copy badges: a WARM dot rides each replica holding the key */}
          {fanU > 0.4 && (
            <g>
              {(['B', 'C', 'D'] as NodeId[]).map((nd) => {
                const p = ringPt(NODE_S[nd], 34);
                const isDead = nd === 'B' && bDead > 0.5;
                return (
                  <g key={nd} opacity={clamp01(fanU * 2 - (nd === 'B' ? 0 : 1)) * (isDead ? 0.15 : 1)}>
                    <circle cx={p.x} cy={p.y} r={6} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.2} />
                  </g>
                );
              })}
            </g>
          )}

          {/* client */}
          <g opacity={clamp01(writeU * 6 + readU * 6)}>
            <rect x={CLIENT.x - 58} y={CLIENT.y - 26} width={116} height={52} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={CLIENT.x} y={CLIENT.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
              client
            </text>
          </g>

          {/* the write: client → B, then the fan-out arcs B → C → D */}
          <Packet from={CLIENT} to={P_B} u={writeU} r={7} color={colors.WARM} label={writeU > 0 && writeU < 1 ? 'set user:42' : undefined} />
          {fanU > 0.01 && (
            <g>
              <path d={walkD(NODE_S.B, NODE_S.C, clamp01(fanU * 1.6), -24)} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" opacity={0.8} />
              <path d={walkD(NODE_S.B, NODE_S.D, clamp01(fanU * 1.2), -44)} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" opacity={0.55} />
            </g>
          )}

          {/* N = 3 */}
          <g opacity={nU}>
            <rect x={586} y={330} width={108} height={44} rx={10} fill={colors.BG} stroke={colors.WARM} />
            <MathLabel tex={'N = 3'} x={640} y={344} fontSize={19} color={colors.WARM} anchor="middle" />
          </g>

          {/* preference list */}
          <g opacity={prefU * (1 - dimU)}>
            <path d={walkD(OUR_S, NODE_S.D, 1, -60)} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="1 5" opacity={0.7} />
            <rect x={64} y={430} width={252} height={112} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={86} y={462} fill={colors.MUTED} fontSize={13} fontStyle="italic">
              preference list — user:42
            </text>
            {(['B', 'C', 'D'] as NodeId[]).map((nd, i) => (
              <g key={nd}>
                <rect x={86 + i * 72} y={478} width={56} height={40} rx={9} fill="none" stroke={NODE_COLOR[nd]} strokeWidth={1.6} />
                <text x={114 + i * 72} y={504} textAnchor="middle" fill={NODE_COLOR[nd]} fontSize={17} fontWeight={700}>
                  {nd}
                </text>
              </g>
            ))}
          </g>

          {/* the read that survives: client → C and back */}
          {readU > 0 && (
            <g>
              <Packet from={CLIENT} to={P_C} u={readP.out === 1 && readP.back === 0 ? 1 : readU <= 1 ? readU : -1} r={6} color={colors.POSITIVE} />
              <Packet from={P_C} to={CLIENT} u={readP.back > 0 ? readP.back : -1} r={7} color={colors.WARM} label={readP.back > 0.2 && readP.back < 1 ? 'user:42' : undefined} />
            </g>
          )}

          {/* B catches up */}
          {backU > 0.05 && (
            <path d={walkD(NODE_S.B, NODE_S.C, 1, -24)} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} strokeDasharray="6 5" opacity={backU * 0.7} />
          )}

          {/* rewind flourish */}
          <g opacity={rewindU}>
            <rect x={520} y={78} width={240} height={46} rx={12} fill={colors.BG} stroke={colors.MUTED} />
            <text x={640} y={108} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
              {'⟲  rewind'}
            </text>
          </g>

          {/* README quote chip — parked top-left so the CAM_B push keeps it
              fully in frame (visible x ends ≈ 994 while zoomed) */}
          <g opacity={quoteU}>
            <rect x={64} y={70} width={344} height={122} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={86} y={102} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              README · Availability patterns
            </text>
            <text x={86} y={130} fill={colors.TEXT} fontSize={14} fontStyle="italic">
              “…potential for loss of data if the active
            </text>
            <text x={86} y={152} fill={colors.TEXT} fontSize={14} fontStyle="italic">
              system fails before newly written data
            </text>
            <text x={86} y={174} fill={colors.TEXT} fontSize={14} fontStyle="italic">
              can be replicated…”
            </text>
          </g>

          {/* availability math */}
          <g opacity={mathU * (1 - dimU)}>
            <rect x={928} y={108} width={306} height={190} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={950} y={140} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              README · Availability in parallel
            </text>
            <MathLabel tex={'A_{\\text{node}} = 99.9\\%'} x={950} y={158} fontSize={18} color={colors.TEXT} />
            <MathLabel tex={'A = 1 - (1 - 0.999)^3'} x={950} y={196} fontSize={18} color={colors.ACCENT} />
            <g opacity={math2U}>
              <MathLabel tex={'= 99.9999999\\%'} x={950} y={238} fontSize={20} color={colors.POSITIVE} />
            </g>
          </g>
        </g>

        {/* closing tease: three copies, which truth? */}
        <g opacity={teaseU}>
          <rect x={400} y={240} width={480} height={180} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={600}>
            three copies of user:42
          </text>
          {(['B', 'C', 'D'] as NodeId[]).map((nd, i) => (
            <g key={nd}>
              <rect x={452 + i * 130} y={306} width={96} height={62} rx={10} fill={colors.BG} stroke={NODE_COLOR[nd]} strokeWidth={1.6} />
              <text x={500 + i * 130} y={331} textAnchor="middle" fill={NODE_COLOR[nd]} fontSize={14} fontWeight={700}>
                {nd}
              </text>
              <text x={500 + i * 130} y={355} textAnchor="middle" fill={i === 2 ? colors.NEGATIVE : colors.TEXT} fontSize={14} fontFamily={MONO}>
                {i === 2 ? 'v1 ?' : 'v2'}
              </text>
            </g>
          ))}
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
            who is right?
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
