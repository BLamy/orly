// Death Mid-Write: hinted handoff
//
// Grounding: the failure story of the primer's cited key-value-store design
// (README.md "Design a key-value store like Redis" → the Dynamo paper,
// amazon-dynamo-sosp2007.pdf §4.6: sloppy quorum + hinted handoff — writes
// route to the next healthy node with a hint naming the intended owner, and
// are handed back when it recovers), told with the README's own vocabulary:
// CAP (#cap-theorem), eventual consistency (#eventual-consistency), and the
// replication warning in #availability-patterns.
//
// Centerpiece: a write frozen mid-flight when its target dies. The packet
// bounces off the corpse, walks one node further around the ring wearing a
// hint tag, lives in E's side pocket, and goes home when C reboots. Ends
// with the whole book retraced in five chips.
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
// The ring — same geometry and cast as chapters 2 and 3.
// ---------------------------------------------------------------------------

const RC = { x: 640, y: 353 } as const;
const R = 185;

const ringPt = (s: number, off = 0): { x: number; y: number } => {
  const psi = (s - 0.5) * TAU;
  return { x: RC.x + (R - off) * Math.sin(psi), y: RC.y - (R - off) * Math.cos(psi) };
};

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

/** Point at fraction t of the clockwise walk s1 → s2. */
const walkPt = (s1: number, s2: number, t: number, off: number): { x: number; y: number } =>
  ringPt((s1 + (((s2 - s1) % 1 + 1) % 1) * clamp01(t)) % 1, off);

type NodeId = 'A' | 'B' | 'C' | 'D' | 'E';
const NODE_S: Record<NodeId, number> = { A: 0.055, B: 0.35, C: 0.615, D: 0.845, E: 0.945 };
const NODE_COLOR: Record<NodeId, string> = {
  A: colors.ACCENT,
  B: colors.SECONDARY,
  C: colors.POSITIVE,
  D: colors.TEAL,
  E: colors.WARM,
};
const NODES: NodeId[] = ['A', 'B', 'C', 'D', 'E'];

const COORD = { x: 150, y: 112 } as const;
const P_B = ringPt(NODE_S.B);
const P_C = ringPt(NODE_S.C);
const P_D = ringPt(NODE_S.D);
const P_E = ringPt(NODE_S.E);
const POCKET = { x: 800, y: 470, w: 150, h: 60 } as const;

// the recap rail
const CHIP_W = 196;
const CHIP_GAP = 22;
const CHIP_Y = 320;
const chipX = (i: number): number => 640 + (i - 2) * (CHIP_W + CHIP_GAP) - CHIP_W / 2;
const RECAP = [
  { title: 'a hash table', sub: 'set · get · O(1)' },
  { title: 'the ring', sub: 'growth moves one arc' },
  { title: 'N = 3 copies', sub: 'the next two clockwise' },
  { title: 'W + R > N', sub: 'the overlap guarantee' },
  { title: 'hinted handoff', sub: 'route around the corpse' },
] as const;

// camera marks
const CAM_C: CameraState = { x: 740, y: 250, k: 1.35 };
const CAM_E: CameraState = { x: 740, y: 460, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline (~82s, twelve beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const ringU = tl.channel('ringU', 0); // ring + cast + W=2 chip
  const writeU = tl.channel('writeU', 0); // fan-out packets
  const ack1U = tl.channel('ack1U', 0); // B's ack (1 of 2)
  const cDieU = tl.channel('cDieU', 0); // C goes dark
  const bounceU = tl.channel('bounceU', 0); // the packet thuds off C
  const choiceU = tl.channel('choiceU', 0); // both option cards
  const chooseU = tl.channel('chooseU', 0); // sloppy quorum wins
  const rerouteU = tl.channel('rerouteU', 0); // walk C → E, 0..1
  const hintU = tl.channel('hintU', 0); // the hint tag
  const pocketU = tl.channel('pocketU', 0); // E's side pocket receives
  const ack2U = tl.channel('ack2U', 0); // E's ack (2 of 2)
  const okU = tl.channel('okU', 0); // write OK stamp
  const reviveU = tl.channel('reviveU', 0); // C reboots
  const handU = tl.channel('handU', 0); // E → C handoff
  const agreeU = tl.channel('agreeU', 0); // replicas agree (pulses)
  const dimU = tl.channel('dimU', 0); // ring quiets for the recap
  const recapU = tl.channel('recapU', 0); // chips 1..5, staggered
  const keyRunU = tl.channel('keyRunU', 0); // the key rides the recap rail

  // — beat 1 · the question —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One more scenario, because the interviewer will ask it: what happens when a node dies while your write is still in the air?',
  });
  tl.tween(ringU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });

  // — beat 2 · the write fans out —
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Here it comes. The write fans out to the preference list — B, C, and D — and the coordinator needs two acknowledgments.',
  });
  tl.tween(writeU, 1, { at: 7.4, dur: 1.8, ease: ease.linear });
  tl.tween(ack1U, 1, { at: 9.6, dur: 1.0, ease: ease.linear });

  // — beat 3 · C dies mid-flight —
  tl.caption({
    at: 13.2,
    dur: 5.6,
    text: 'And right now, mid-flight, node C dies. The copy aimed at it thuds into a dead machine.',
  });
  tl.tween(cam, CAM_C, { at: 13.4, dur: 1.2, ease: ease.move });
  tl.tween(cDieU, 1, { at: 14.2, dur: 0.8, ease: ease.move });
  tl.tween(bounceU, 1, { at: 15.2, dur: 1.0, ease: ease.move });

  // — beat 4 · the strict answer —
  tl.caption({
    at: 19.4,
    dur: 6.2,
    text: 'The strict move is to give up and return an error. Consistency protected, availability sacrificed — one corner of the C-A-P trade.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.6, dur: 1.3, ease: ease.move });
  tl.tween(choiceU, 1, { at: 20.4, dur: 0.8, ease: ease.enter });

  // — beat 5 · Dynamo picks the other corner —
  tl.caption({
    at: 26.2,
    dur: 6.2,
    text: 'Dynamo — the paper the primer points to for this exact design — takes the other corner. Stay available. Bend the quorum. They call it a sloppy quorum.',
  });
  tl.tween(chooseU, 1, { at: 27.2, dur: 0.9, ease: ease.pop });

  // — beat 6 · walk past the corpse —
  tl.caption({
    at: 33.0,
    dur: 6.4,
    text: "The dying copy doesn't vanish. It keeps walking clockwise, past the dead machine, to the next healthy node on the ring: node E.",
  });
  tl.tween(choiceU, 0, { at: 33.2, dur: 0.7, ease: ease.enter });
  tl.tween(rerouteU, 1, { at: 34.0, dur: 2.4, ease: ease.linear });

  // — beat 7 · the hint —
  tl.caption({
    at: 40.0,
    dur: 6.2,
    text: "But E isn't pretending to be C. The write carries a hint — a sticky note that says: this really belongs to C. E keeps it in a side pocket.",
  });
  tl.tween(cam, CAM_E, { at: 40.2, dur: 1.3, ease: ease.move });
  tl.tween(hintU, 1, { at: 40.8, dur: 0.6, ease: ease.pop });
  tl.tween(pocketU, 1, { at: 42.4, dur: 1.2, ease: ease.move });

  // — beat 8 · the write succeeds during the failure —
  tl.caption({
    at: 46.8,
    dur: 5.4,
    text: 'E acknowledges, the count reaches two, and the write succeeds — during the failure. Availability held.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.8, dur: 1.2, ease: ease.move }); // pull back BEFORE the ack lands — the coordinator must be on screen for 2/2 → OK
  tl.tween(ack2U, 1, { at: 47.8, dur: 1.1, ease: ease.linear });
  tl.tween(okU, 1, { at: 49.2, dur: 0.5, ease: ease.pop });

  // — beat 9 · C comes home —
  tl.caption({
    at: 52.8,
    dur: 5.8,
    text: 'When C comes back, its heartbeat resumes — and E quietly hands the hinted write home. The side pocket empties.',
  });
  tl.tween(reviveU, 1, { at: 53.6, dur: 1.0, ease: ease.move });
  tl.tween(handU, 1, { at: 55.0, dur: 1.6, ease: ease.linear });
  tl.tween(pocketU, 0, { at: 56.6, dur: 0.8, ease: ease.enter });

  // — beat 10 · agreement again —
  tl.caption({
    at: 59.2,
    dur: 5.6,
    text: "Every replica of our key agrees again. That's eventual consistency doing what the name promises — with hinted handoff as the courier.",
  });
  tl.tween(agreeU, 3, { at: 59.8, dur: 2.6, ease: ease.linear });

  // — beat 11 · the recap begins —
  tl.caption({
    at: 65.4,
    dur: 7.0,
    text: 'And that is the interview answer, end to end. A key becomes a point on a ring; the ring gives it a home and two understudies; two dials decide how much certainty each read and write buys.',
  });
  tl.tween(dimU, 1, { at: 65.8, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 0.8, { at: 66.6, dur: 4.0, ease: ease.linear });
  tl.tween(keyRunU, 0.78, { at: 67.0, dur: 5.0, ease: ease.linear });

  // — beat 12 · survive, then go design one —
  tl.caption({
    at: 73.2,
    dur: 6.8,
    text: 'And when a machine dies holding your write, a hint walks the data around the corpse and back. Partition, replicate, tune, survive — now go design a key-value store.',
  });
  tl.tween(recapU, 1, { at: 73.8, dur: 1.2, ease: ease.linear });
  tl.tween(keyRunU, 1, { at: 74.4, dur: 2.2, ease: ease.linear });
  tl.hold(80.0, 1.8);

  return {
    tl,
    cam,
    ringU,
    writeU,
    ack1U,
    cDieU,
    bounceU,
    choiceU,
    chooseU,
    rerouteU,
    hintU,
    pocketU,
    ack2U,
    okU,
    reviveU,
    handU,
    agreeU,
    dimU,
    recapU,
    keyRunU,
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
  const writeU = s.get(scene.writeU);
  const ack1U = s.get(scene.ack1U);
  const cDieU = s.get(scene.cDieU);
  const bounceU = s.get(scene.bounceU);
  const choiceU = s.get(scene.choiceU);
  const chooseU = s.get(scene.chooseU);
  const rerouteU = s.get(scene.rerouteU);
  const hintU = s.get(scene.hintU);
  const pocketU = s.get(scene.pocketU);
  const ack2U = s.get(scene.ack2U);
  const okU = s.get(scene.okU);
  const reviveU = s.get(scene.reviveU);
  const handU = s.get(scene.handU);
  const agreeU = s.get(scene.agreeU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);
  const keyRunU = s.get(scene.keyRunU);

  const cDead = cDieU * (1 - reviveU);
  const stage = 1 - 0.88 * dimU;
  const acks = okU > 0.5 ? 2 : ack1U >= 1 ? 1 : 0;
  const agreePulse = Math.abs(Math.sin(Math.PI * agreeU));

  // the doomed packet: coordinator → C, then the bounce, then the reroute walk
  const doomedU = clamp01(writeU * 1.05);
  const doomed = (() => {
    if (rerouteU > 0) return walkPt(NODE_S.C, NODE_S.E, rerouteU, -30);
    const base = {
      x: COORD.x + (P_C.x - COORD.x) * Math.min(doomedU, 0.88),
      y: COORD.y + (P_C.y - COORD.y) * Math.min(doomedU, 0.88),
    };
    if (bounceU > 0) {
      return { x: base.x - 26 * bounceU, y: base.y + 44 * bounceU * bounceU };
    }
    return base;
  })();
  const doomedVisible = writeU > 0.05 && !(rerouteU >= 1 && pocketU > 0.5);

  // the key dot riding the recap rail
  const railP = { x: chipX(0) + 10 + (chipX(4) + CHIP_W - 20 - chipX(0) - 10) * keyRunU, y: CHIP_Y - 26 };

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
            const dead = nd === 'C' ? cDead : 0;
            const isReplica = nd === 'B' || nd === 'C' || nd === 'D';
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
                {nd === 'C' && reviveU > 0.05 && (
                  <circle cx={p.x} cy={p.y} r={22} fill="none" stroke={NODE_COLOR.C} strokeWidth={1.5} opacity={reviveU * 0.8} strokeDasharray="3 4" />
                )}
                {/* the copies agreeing at the end */}
                {isReplica && agreeU > 0 && (
                  <circle cx={ringPt(NODE_S[nd], 34).x} cy={ringPt(NODE_S[nd], 34).y} r={6 + 3 * agreePulse} fill={colors.WARM} opacity={0.9} />
                )}
              </g>
            );
          })}

          {/* coordinator + the ack counter */}
          <rect x={COORD.x - 70} y={COORD.y - 30} width={140} height={60} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={COORD.x} y={COORD.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
            coordinator
          </text>
          <text x={COORD.x} y={COORD.y + 18} textAnchor="middle" fill={okU > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={13} fontFamily={MONO}>
            {writeU > 0.05 ? `acks ${acks}/2${okU > 0.5 ? ' → OK' : ''}` : 'W = 2'}
          </text>

          {/* the two healthy write packets */}
          {writeU > 0 && writeU < 1 && (
            <g>
              <Packet from={COORD} to={P_B} u={clamp01(writeU * 1.3)} r={6.5} color={colors.WARM} label={writeU < 0.5 ? 'set user:42' : undefined} />
              <Packet from={COORD} to={P_D} u={clamp01(writeU * 0.85)} r={6.5} color={colors.WARM} opacity={0.8} />
            </g>
          )}
          {/* B's ack */}
          {ack1U > 0 && ack1U < 1 && <Packet from={P_B} to={COORD} u={ack1U} r={5} color={colors.SECONDARY} label="ack 1" />}

          {/* the doomed copy: flight, thud, reroute — one continuous life */}
          {doomedVisible && (
            <g>
              {rerouteU > 0 && rerouteU < 1 && (
                <path d={walkD(NODE_S.C, NODE_S.E, rerouteU, -30)} fill="none" stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="2 5" opacity={0.7} />
              )}
              <circle cx={doomed.x} cy={doomed.y} r={6.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.2} opacity={bounceU > 0 && rerouteU === 0 ? 1 - 0.4 * bounceU : 1} />
              {hintU > 0 && rerouteU > 0 && (
                <g opacity={hintU}>
                  <rect x={doomed.x + 10} y={doomed.y - 26} width={104} height={24} rx={6} fill={colors.BG} stroke={colors.WARM} />
                  <text x={doomed.x + 62} y={doomed.y - 9} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                    hint: for C
                  </text>
                </g>
              )}
            </g>
          )}

          {/* E's side pocket */}
          {pocketU > 0.01 && (
            <g opacity={pocketU}>
              <line x1={P_E.x + 12} y1={P_E.y + 8} x2={POCKET.x} y2={POCKET.y + 18} stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="3 4" />
              <rect x={POCKET.x} y={POCKET.y} width={POCKET.w} height={POCKET.h} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="6 4" />
              <text x={POCKET.x + POCKET.w / 2} y={POCKET.y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
                side pocket
              </text>
              <g opacity={clamp01(pocketU * 2 - 1)}>
                <circle cx={POCKET.x + 36} cy={POCKET.y + 42} r={6} fill={colors.WARM} />
                <text x={POCKET.x + 52} y={POCKET.y + 47} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                  for C
                </text>
              </g>
            </g>
          )}

          {/* E's ack */}
          {ack2U > 0 && ack2U < 1 && <Packet from={P_E} to={COORD} u={ack2U} r={5} color={colors.WARM} label="ack 2" />}

          {/* the handoff home: E → C (counter-clockwise chord, dashed) */}
          {handU > 0 && handU < 1 && (
            <g>
              <line x1={P_E.x} y1={P_E.y} x2={P_C.x} y2={P_C.y} stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="5 5" opacity={0.5} />
              <Packet from={P_E} to={P_C} u={handU} r={6.5} color={colors.WARM} label="going home" />
            </g>
          )}

          {/* the choice cards */}
          {choiceU > 0.01 && (
            <g opacity={choiceU}>
              <g opacity={1 - 0.6 * chooseU}>
                <rect x={40} y={230} width={252} height={104} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
                <text x={62} y={262} fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
                  fail the write
                </text>
                <text x={62} y={288} fill={colors.TEXT} fontSize={13}>
                  consistency kept,
                </text>
                <text x={62} y={308} fill={colors.TEXT} fontSize={13}>
                  availability lost
                </text>
              </g>
              <g>
                <rect x={40} y={356} width={252} height={104} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4 + 1.6 * chooseU} />
                <text x={62} y={388} fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                  sloppy quorum
                </text>
                <text x={62} y={414} fill={colors.TEXT} fontSize={13}>
                  stay available, repair
                </text>
                <text x={62} y={434} fill={colors.TEXT} fontSize={13}>
                  the copies later
                </text>
                {chooseU > 0.5 && (
                  <text x={272} y={390} textAnchor="end" fill={colors.POSITIVE} fontSize={16} fontWeight={700}>
                    ✓
                  </text>
                )}
              </g>
            </g>
          )}
        </g>

        {/* ------------------------- the recap rail ------------------------- */}
        {recapU > 0.01 && (
          <g>
            {RECAP.map((c, i) => {
              const u = clamp01(recapU * (5 + 1.5) - i * 1.15);
              if (u <= 0) return null;
              const x = chipX(i);
              return (
                <g key={i} opacity={u}>
                  <rect x={x} y={CHIP_Y} width={CHIP_W} height={104} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                  <text x={x + CHIP_W / 2} y={CHIP_Y + 40} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={700}>
                    {c.title}
                  </text>
                  <text x={x + CHIP_W / 2} y={CHIP_Y + 70} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                    {c.sub}
                  </text>
                  <text x={x + CHIP_W / 2} y={CHIP_Y + 128} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {i + 1}
                  </text>
                </g>
              );
            })}
            {/* our key rides across its whole story */}
            {keyRunU > 0 && (
              <g>
                <circle cx={railP.x} cy={railP.y} r={7.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
                <text x={railP.x} y={railP.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                  user:42
                </text>
              </g>
            )}
            <g opacity={clamp01(recapU * 3 - 2)}>
              <MathLabel tex={'\\text{partition} \\;\\to\\; \\text{replicate} \\;\\to\\; W + R > N \\;\\to\\; \\text{survive}'} x={640} y={196} fontSize={19} color={colors.TEXT} anchor="middle" />
            </g>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
