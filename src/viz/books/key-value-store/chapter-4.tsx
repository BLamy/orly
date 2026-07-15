// Quorums: agreement without waiting
//
// Grounding: the N/R/W quorum scheme and read repair come from the Dynamo
// paper the primer cites (decandia07dynamo.pdf, under README.md § Document
// store — "DynamoDB supports both key-values and documents"); version stamps
// are the primer's wide-column note that "each value contains a timestamp for
// versioning and for conflict resolution". Requested explicitly by the issue:
// read/write quorums and what happens when a node dies.
//
// Visual machine: one key's three replicas as columns under a coordinator.
// A naive all-three write crawls behind one straggler; a W=2 write finishes
// at the second ack. The centerpiece is the pigeonhole: a fixed write-set
// shade and a sliding read-window — every position of the window overlaps.
// Then replica B dies mid-write, returns stale, and read repair heals it.
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
import { TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — coordinator on top, three replica columns below.
// ---------------------------------------------------------------------------

const COORD = { x: 640, y: 120 } as const;
const COL_X = [380, 640, 900];
const NODE_Y = 300;
const CARD_Y = 420;
const NAMES = ['A', 'B', 'C'];
const COL_COLOR = [colors.ACCENT, colors.POSITIVE, colors.SECONDARY];

// the read-window positions of the pigeonhole demo: every 2-of-3 choice
const READ_SETS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 2],
];
const WRITE_SET: [number, number] = [0, 1]; // shaded through the whole demo

const CAM_TOP: CameraState = { x: 640, y: 300, k: 1.12 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const colsU = tl.channel('colsU', 0); // columns + coordinator entrance
  // versions are stepped with tl.set — instant, scrub-exact
  const verA = tl.channel('verA', 8);
  const verB = tl.channel('verB', 8);
  const verC = tl.channel('verC', 8);
  // round 1: wait for everyone
  const w1 = tl.channel('w1', 0); // write fan-out 0..1
  const a1 = tl.channel('a1', 0); // fast acks (A, B) 0..1
  const a1s = tl.channel('a1s', 0); // the straggler ack (C), long dur
  const done1 = tl.channel('done1', 0); // checkmark — only after ALL acks
  // round 2: W = 2
  const wqU = tl.channel('wqU', 0); // "W = 2" chip
  const w2 = tl.channel('w2', 0);
  const a2 = tl.channel('a2', 0);
  const a2s = tl.channel('a2s', 0); // C still slow — but nobody waits
  const done2 = tl.channel('done2', 0); // pops at the SECOND ack
  // the read
  const rqU = tl.channel('rqU', 0); // "R = 2" chip
  const read1 = tl.channel('read1', 0); // ask A+B, answers return (0..2)
  // pigeonhole
  const overlap = tl.channel('overlap', 0); // 0..3 slides the read window
  const texU = tl.channel('texU', 0); // R + W > N
  // failure mid-write
  const die = tl.channel('die', 0); // B down
  const w3 = tl.channel('w3', 0);
  const a3 = tl.channel('a3', 0); // acks from A and C only
  const done3 = tl.channel('done3', 0);
  const revive = tl.channel('revive', 0); // B back, stale
  const read2 = tl.channel('read2', 0); // ask B+C (0..2)
  const fixU = tl.channel('fixU', 0); // read repair packet → B
  const endU = tl.channel('endU', 0);

  // — Beat 1 · three destinations —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Zoom in on one key and its three replicas. Every write now has three destinations — so every design must answer a small, vicious question: when is a write done?',
  });
  tl.tween(colsU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_TOP, { at: 0.9, dur: 1.6, ease: ease.move });
  tl.hold(7.1, 0.4);

  // — Beat 2 · waiting for everyone —
  tl.caption({
    at: 7.5,
    dur: 6.6,
    text: 'The careful answer is: when all three confirm. Safe — and slow. One straggling machine, one garbage collection pause, and every customer is waiting on it.',
  });
  tl.tween(w1, 1, { at: 8.0, dur: 0.9, ease: ease.linear });
  tl.set(verA, 9, 8.9);
  tl.set(verB, 9, 8.9);
  tl.tween(a1, 1, { at: 9.0, dur: 0.9, ease: ease.linear });
  tl.set(verC, 9, 12.4);
  tl.tween(a1s, 1, { at: 9.0, dur: 4.2, ease: ease.linear }); // the crawl
  tl.tween(done1, 1, { at: 13.3, dur: 0.5, ease: ease.pop });
  tl.hold(14.4, 0.5);

  // — Beat 3 · the write quorum —
  tl.caption({
    at: 14.9,
    dur: 6.6,
    text: 'So we stop waiting for everyone and vote instead. Pick a write quorum W: the write counts as done when W replicas confirm. Set W to two, and the straggler stops setting the pace.',
  });
  tl.tween(done1, 0, { at: 15.1, dur: 0.5, ease: ease.enter });
  tl.tween(wqU, 1, { at: 15.4, dur: 0.6, ease: ease.pop });
  tl.tween(w2, 1, { at: 17.0, dur: 0.9, ease: ease.linear });
  tl.set(verA, 10, 17.9);
  tl.set(verB, 10, 17.9);
  tl.tween(a2, 1, { at: 18.0, dur: 0.9, ease: ease.linear });
  tl.tween(done2, 1, { at: 19.0, dur: 0.5, ease: ease.pop }); // second ack = done
  tl.set(verC, 10, 21.3);
  tl.tween(a2s, 1, { at: 18.0, dur: 3.4, ease: ease.linear }); // catches up later
  tl.hold(21.5, 0.4);

  // — Beat 4 · the read quorum —
  tl.caption({
    at: 21.9,
    dur: 5.8,
    text: 'Reads vote too. Ask R replicas and take the freshest answer — R is two as well. Two questions out, first two answers back.',
  });
  tl.tween(done2, 0, { at: 22.1, dur: 0.5, ease: ease.enter });
  tl.tween(rqU, 1, { at: 22.4, dur: 0.6, ease: ease.pop });
  tl.tween(read1, 2, { at: 23.4, dur: 2.4, ease: ease.linear });
  tl.hold(27.7, 0.4);

  // — Beat 5 · version stamps —
  tl.caption({
    at: 28.1,
    dur: 5.6,
    text: 'Freshest is not a guess. Every value carries a version stamp, so when two answers disagree, the bigger stamp simply wins.',
  });
  tl.hold(33.7, 0.5);

  // — Beat 6 · the pigeonhole —
  tl.caption({
    at: 34.2,
    dur: 6.8,
    text: 'Now the arithmetic that makes it safe: two plus two is greater than three. Any two machines that took the write, and any two machines you ask, must share at least one.',
  });
  tl.tween(texU, 1, { at: 34.6, dur: 0.8, ease: ease.enter });
  tl.tween(overlap, 3, { at: 35.6, dur: 7.4, ease: ease.linear });
  tl.hold(41.0, 0.4);

  // — Beat 7 · overlap is the guarantee —
  tl.caption({
    at: 41.4,
    dur: 4.8,
    text: 'Slide the choices around all you like. Whatever pair answers, someone in it saw the newest write. That overlap is the entire guarantee.',
  });
  tl.hold(46.2, 0.5);

  // — Beat 8 · a death mid-write —
  tl.caption({
    at: 46.7,
    dur: 5.6,
    text: 'Time to break something mid-flight. A write goes out — and replica B dies before it can even answer.',
  });
  tl.tween(texU, 0, { at: 46.9, dur: 0.6, ease: ease.enter });
  tl.tween(w3, 1, { at: 48.2, dur: 0.9, ease: ease.linear });
  tl.tween(die, 1, { at: 48.8, dur: 0.7, ease: ease.enter });
  tl.set(verA, 11, 49.1);
  tl.set(verC, 11, 49.1);
  tl.hold(52.3, 0.4);

  // — Beat 9 · W still holds —
  tl.caption({
    at: 52.7,
    dur: 5.2,
    text: 'A and C confirm. That is two — that is W. The write succeeds while a third of the cluster is down.',
  });
  tl.tween(a3, 1, { at: 53.2, dur: 0.9, ease: ease.linear });
  tl.tween(done3, 1, { at: 54.2, dur: 0.5, ease: ease.pop });
  tl.hold(57.9, 0.4);

  // — Beat 10 · the stale survivor —
  tl.caption({
    at: 58.3,
    dur: 6.6,
    text: 'B comes back remembering only the old value. The very next read asks two replicas, sees stamps ten and eleven disagree, and returns eleven. Right answer, sick cluster.',
  });
  tl.tween(done3, 0, { at: 58.5, dur: 0.5, ease: ease.enter });
  tl.tween(revive, 1, { at: 58.9, dur: 0.8, ease: ease.enter });
  tl.tween(read2, 2, { at: 60.2, dur: 2.6, ease: ease.linear });
  tl.hold(64.9, 0.4);

  // — Beat 11 · read repair —
  tl.caption({
    at: 65.3,
    dur: 5.4,
    text: 'Then the reader pays it backward, pushing the newest value onto the stale replica. They call it read repair — reads that heal the cluster behind them.',
  });
  tl.tween(fixU, 1, { at: 66.2, dur: 1.2, ease: ease.linear });
  tl.set(verB, 11, 67.4);
  tl.hold(70.7, 0.4);

  // — Beat 12 · the payoff —
  tl.caption({
    at: 71.1,
    dur: 6.0,
    text: 'A machine died in the middle of everything, and no client ever noticed. That is what the quorum buys: agreement, without waiting for everyone.',
  });
  tl.tween(endU, 1, { at: 71.4, dur: 1.2, ease: ease.move });
  tl.hold(77.1, 1.2);

  return {
    tl, cam, colsU, verA, verB, verC, w1, a1, a1s, done1, wqU, w2, a2, a2s,
    done2, rqU, read1, overlap, texU, die, w3, a3, done3, revive, read2,
    fixU, endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** a fan packet from the coordinator to column i (u 0..1), arcing slightly */
function fanPos(i: number, u: number): { x: number; y: number } {
  const t = clamp01(u);
  return {
    x: COORD.x + (COL_X[i] - COORD.x) * t,
    y: COORD.y + 40 + (NODE_Y - 34 - COORD.y - 40) * t + Math.sin(t * Math.PI) * 18,
  };
}
/** an ack packet from column i back to the coordinator (u 0..1) */
function ackPos(i: number, u: number): { x: number; y: number } {
  const t = clamp01(u);
  return {
    x: COL_X[i] + (COORD.x - COL_X[i]) * t,
    y: NODE_Y - 34 + (COORD.y + 40 - (NODE_Y - 34)) * t - Math.sin(t * Math.PI) * 18,
  };
}

function Check({ x, y, u }: { x: number; y: number; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u} transform={`translate(${x}, ${y}) scale(${0.7 + 0.3 * u})`}>
      <circle r={16} fill={colors.POSITIVE} opacity={0.2} />
      <path d="M-7 0 L-2 6 L8 -6" fill="none" stroke={colors.POSITIVE} strokeWidth={3.2} strokeLinecap="round" />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const colsU = s.get(scene.colsU);
  const vers = [s.get(scene.verA), s.get(scene.verB), s.get(scene.verC)];
  const w1 = s.get(scene.w1);
  const a1 = s.get(scene.a1);
  const a1s = s.get(scene.a1s);
  const done1 = s.get(scene.done1);
  const wqU = s.get(scene.wqU);
  const w2 = s.get(scene.w2);
  const a2 = s.get(scene.a2);
  const a2s = s.get(scene.a2s);
  const done2 = s.get(scene.done2);
  const rqU = s.get(scene.rqU);
  const read1 = s.get(scene.read1);
  const overlap = s.get(scene.overlap);
  const texU = s.get(scene.texU);
  const die = s.get(scene.die);
  const w3 = s.get(scene.w3);
  const a3 = s.get(scene.a3);
  const done3 = s.get(scene.done3);
  const revive = s.get(scene.revive);
  const read2 = s.get(scene.read2);
  const fixU = s.get(scene.fixU);
  const endU = s.get(scene.endU);

  const bDown = clamp01(die - revive); // B is dark between death and revival
  const bStale = revive > 0 && fixU < 0.9; // back, but behind
  const overlapOn = texU > 0.01 && overlap > 0.01;
  const readSetIdx = Math.min(2, Math.floor(overlap));
  const readSet = READ_SETS[readSetIdx];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* coordinator */}
        <g opacity={colsU * (1 - endU * 0.5)}>
          <rect x={COORD.x - 76} y={COORD.y - 24} width={152} height={48} rx={12}
            fill={colors.PANEL} stroke={colors.GRID} />
          <text x={COORD.x} y={COORD.y - 1} textAnchor="middle" fill={colors.TEXT} fontSize={14}>coordinator</text>
          <text x={COORD.x} y={COORD.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11}
            fontFamily="ui-monospace, monospace">PUT cart:42</text>
        </g>

        {/* quorum knobs */}
        <g opacity={wqU * (1 - endU * 0.5)}>
          <rect x={140} y={96} width={120} height={40} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <MathLabel tex={'W = 2'} x={200} y={116} fontSize={17} color={colors.WARM} anchor="middle" />
        </g>
        <g opacity={rqU * (1 - endU * 0.5)}>
          <rect x={140} y={148} width={120} height={40} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.4} />
          <MathLabel tex={'R = 2'} x={200} y={168} fontSize={17} color={colors.TEAL} anchor="middle" />
        </g>

        {/* pigeonhole shading — behind the columns */}
        {overlapOn && (
          <g>
            {WRITE_SET.map((i) => (
              <rect key={`w${i}`} x={COL_X[i] - 90} y={NODE_Y - 70} width={180} height={280} rx={16}
                fill={colors.WARM} opacity={0.1} />
            ))}
            {readSet.map((i) => (
              <rect key={`r${i}`} x={COL_X[i] - 82} y={NODE_Y - 62} width={164} height={264} rx={14}
                fill="none" stroke={colors.TEAL} strokeWidth={2.4} opacity={0.85} strokeDasharray="7 5" />
            ))}
            {/* the intersection glows */}
            {readSet
              .filter((i) => (WRITE_SET as readonly number[]).includes(i))
              .map((i) => (
                <rect key={`o${i}`} x={COL_X[i] - 90} y={NODE_Y - 70} width={180} height={280} rx={16}
                  fill={colors.POSITIVE} opacity={0.16 + 0.08 * Math.sin(overlap * Math.PI * 2)} />
              ))}
            <g opacity={0.9}>
              <text x={COL_X[0] - 90} y={NODE_Y - 84} fill={colors.WARM} fontSize={13}>took the write</text>
              <text x={COL_X[readSet[1]] + 82} y={NODE_Y - 84} textAnchor="end" fill={colors.TEAL} fontSize={13}>
                answers the read
              </text>
            </g>
          </g>
        )}

        {/* the three replicas */}
        {NAMES.map((nm, i) => {
          const down = i === 1 ? bDown : 0;
          const stale = i === 1 && bStale;
          return (
            <g key={nm} opacity={colsU}>
              <circle cx={COL_X[i]} cy={NODE_Y} r={26} fill={colors.BG}
                stroke={down > 0.3 ? colors.GRID : COL_COLOR[i]} strokeWidth={2.6}
                opacity={down > 0.3 ? 0.45 : 1} />
              <text x={COL_X[i]} y={NODE_Y + 6} textAnchor="middle" fontSize={16}
                fill={down > 0.3 ? colors.MUTED : COL_COLOR[i]}>{nm}</text>
              {down > 0.3 && (
                <g stroke={colors.NEGATIVE} strokeWidth={2.6} opacity={down}>
                  <line x1={COL_X[i] - 15} y1={NODE_Y - 15} x2={COL_X[i] + 15} y2={NODE_Y + 15} />
                  <line x1={COL_X[i] - 15} y1={NODE_Y + 15} x2={COL_X[i] + 15} y2={NODE_Y - 15} />
                </g>
              )}
              <text x={COL_X[i]} y={NODE_Y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                {`replica ${i + 1}`}
              </text>

              {/* the value card with its version stamp */}
              <g opacity={down > 0.3 ? 0.25 : 1}>
                <rect x={COL_X[i] - 66} y={CARD_Y} width={132} height={54} rx={10}
                  fill={colors.PANEL}
                  stroke={stale ? colors.WARM : colors.GRID}
                  strokeWidth={stale ? 1.8 : 1} />
                <text x={COL_X[i] - 52} y={CARD_Y + 22} fill={colors.ACCENT} fontSize={12}
                  fontFamily="ui-monospace, monospace">cart:42</text>
                <text x={COL_X[i] - 52} y={CARD_Y + 42} fill={colors.MUTED} fontSize={11}
                  fontFamily="ui-monospace, monospace">3 items</text>
                <text x={COL_X[i] + 52} y={CARD_Y + 33} textAnchor="end" fontSize={17}
                  fill={stale ? colors.WARM : colors.TEXT}
                  fontFamily="ui-monospace, monospace">{`v${Math.round(vers[i])}`}</text>
              </g>
            </g>
          );
        })}

        {/* round 1 — wait for everyone */}
        {w1 > 0 && w1 < 1 && [0, 1, 2].map((i) => {
          const p = fanPos(i, w1);
          return <circle key={i} cx={p.x} cy={p.y} r={6} fill={colors.WARM} />;
        })}
        {a1 > 0 && a1 < 1 && [0, 1].map((i) => {
          const p = ackPos(i, a1);
          return <circle key={i} cx={p.x} cy={p.y} r={5} fill={COL_COLOR[i]} />;
        })}
        {a1s > 0 && a1s < 1 && (
          <g>
            {(() => {
              const p = ackPos(2, a1s);
              return <circle cx={p.x} cy={p.y} r={5} fill={COL_COLOR[2]} />;
            })()}
            <TimerArc cx={COL_X[2] + 44} cy={NODE_Y - 40} r={13} u={1 - a1s} color={colors.NEGATIVE} />
            <text x={COORD.x} y={COORD.y + 44} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}
              opacity={0.9}>waiting for all three…</text>
          </g>
        )}
        <Check x={COORD.x + 100} y={COORD.y} u={done1} />

        {/* round 2 — W = 2 */}
        {w2 > 0 && w2 < 1 && [0, 1, 2].map((i) => {
          const p = fanPos(i, w2);
          return <circle key={i} cx={p.x} cy={p.y} r={6} fill={colors.WARM} />;
        })}
        {a2 > 0 && a2 < 1 && [0, 1].map((i) => {
          const p = ackPos(i, a2);
          return <circle key={i} cx={p.x} cy={p.y} r={5} fill={COL_COLOR[i]} />;
        })}
        {a2s > 0 && a2s < 1 && (() => {
          const p = ackPos(2, a2s);
          return <circle cx={p.x} cy={p.y} r={5} fill={COL_COLOR[2]} opacity={0.5} />;
        })()}
        <Check x={COORD.x + 100} y={COORD.y} u={done2} />

        {/* the R=2 read (asks A and B) */}
        {read1 > 0 && read1 < 2 && [0, 1].map((i) => {
          const u = read1 <= 1 ? read1 : 0;
          const back = read1 > 1 ? read1 - 1 : 0;
          const p = read1 <= 1 ? fanPos(i, u) : ackPos(i, back);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5.5} fill={colors.TEAL} />
              {read1 > 1 && (
                <text x={p.x + 10} y={p.y - 8} fontSize={11} fill={colors.TEAL}
                  fontFamily="ui-monospace, monospace">{`v${Math.round(vers[i])}`}</text>
              )}
            </g>
          );
        })}

        {/* R + W > N */}
        <MathLabel tex={'R + W > N \\;\\;\\Rightarrow\\;\\; 2 + 2 > 3'} x={640} y={575} fontSize={20}
          color={colors.TEXT} opacity={texU} anchor="middle" />

        {/* round 3 — B dies mid-write */}
        {w3 > 0 && w3 < 1 && [0, 1, 2].map((i) => {
          const p = fanPos(i, w3);
          // B's packet fizzles as the node dies
          const fizzle = i === 1 ? 1 - clamp01((w3 - 0.55) * 4) : 1;
          return <circle key={i} cx={p.x} cy={p.y} r={6} fill={colors.WARM} opacity={fizzle} />;
        })}
        {a3 > 0 && a3 < 1 && [0, 2].map((i) => {
          const p = ackPos(i, a3);
          return <circle key={i} cx={p.x} cy={p.y} r={5} fill={COL_COLOR[i]} />;
        })}
        <Check x={COORD.x + 100} y={COORD.y} u={done3} />

        {/* the read that catches the stale replica (asks B and C) */}
        {read2 > 0 && read2 < 2 && [1, 2].map((i) => {
          const u = read2 <= 1 ? read2 : 0;
          const back = read2 > 1 ? read2 - 1 : 0;
          const p = read2 <= 1 ? fanPos(i, u) : ackPos(i, back);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5.5} fill={colors.TEAL} />
              {read2 > 1 && (
                <text x={p.x + 10} y={p.y - 8} fontSize={11}
                  fill={i === 1 ? colors.WARM : colors.TEAL}
                  fontFamily="ui-monospace, monospace">{`v${Math.round(vers[i])}`}</text>
              )}
            </g>
          );
        })}

        {/* read repair — the newest value pushed back to B */}
        {fixU > 0 && fixU < 1 && (() => {
          const p = fanPos(1, fixU);
          return (
            <g>
              <circle cx={p.x} cy={p.y} r={6.5} fill={colors.POSITIVE} />
              <text x={p.x + 12} y={p.y - 8} fontSize={11} fill={colors.POSITIVE}
                fontFamily="ui-monospace, monospace">v11</text>
            </g>
          );
        })()}

        {/* quiet close: the three healed cards remain */}
        <g opacity={endU}>
          <text x={640} y={580} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
            three replicas, one answer — and nobody waited
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
