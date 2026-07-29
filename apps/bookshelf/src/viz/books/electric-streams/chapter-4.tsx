// Exactly Once
//
// Grounding: PROTOCOL.md §5.2.1 Idempotent Producers — Producer-Id /
// Producer-Epoch / Producer-Seq headers ("order-service-1" is the spec's own
// example id); validation logic (seq <= lastSeq → 204 duplicate; seq ==
// lastSeq+1 → accept; gap → 409 with Producer-Expected-Seq /
// Producer-Received-Seq; stale epoch → 403 with current Producer-Epoch —
// zombie fencing; auto-claim); packages/client/src/idempotent-producer.ts
// (IdempotentProducer: "Fire-and-forget: append() returns immediately",
// "Exactly-once: server deduplicates using (producerId, epoch, seq)").
//
// Centerpiece: the server's validation gate as a live machine — one register
// (epoch, lastSeq) that every batch is checked against. An ack dies in the
// flaky-network band, the retry bounces off as a duplicate receipt (the tape
// provably gains no second cell), a sequence gap is refused with the expected
// number, and a zombie twin on a stale epoch hits the fence.
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
import type { CameraState, SceneState } from '../../core';
import { ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — producer left, flaky band mid, the gate + register + tape right.
// ---------------------------------------------------------------------------

const PROD = { x: 218, y: 330 } as const;
const ZOMB = { x: 200, y: 520 } as const;
const BAND = { x: 420, y: 150, w: 130, h: 420 } as const;
const GATE = { x: 660, y: 360 } as const; // where batches are checked
const REG = { x: 640, y: 170, w: 330, h: 96 } as const; // the register panel
const TAPE = { x0: 700, y: 500, cellW: 56, cellH: 42 } as const;
const cellX = (i: number): number => TAPE.x0 + i * TAPE.cellW;

const SEND_Y = 330; // batch lane
const ACK_Y = 396; // receipt lane (returns)

const CAM_STAKES: CameraState = { x: 640, y: 300, k: 1.25 };
const CAM_GATE: CameraState = { x: 690, y: 330, k: 1.16 };
const CAM_WIDE: CameraState = CAMERA_HOME;

const batchPos = (u: number) => ({ x: PROD.x + 86 + (GATE.x - 30 - (PROD.x + 86)) * u, y: SEND_Y });
const ackPos = (u: number) => ({ x: GATE.x - 30 + (PROD.x + 86 - (GATE.x - 30)) * u, y: ACK_Y });
const inBand = (x: number): boolean => x > BAND.x && x < BAND.x + BAND.w;

// ---------------------------------------------------------------------------
// Timeline (~86s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STAKES, cameraInterp);

  const nodesU = tl.channel('nodesU', 0); // producer + server + band
  const naiveU = tl.channel('naiveU', 0); // the double-charge inset
  const hdrU = tl.channel('hdrU', 0); // the three headers stack on a batch
  const regU = tl.channel('regU', 0); // the register panel draws
  const s0U = tl.channel('s0U', 0); // seq=0 travels + lands
  const s1U = tl.channel('s1U', 0); // seq=1 travels + lands
  const s2U = tl.channel('s2U', 0); // seq=2 travels + lands
  const ack2U = tl.channel('ack2U', 0); // seq=2's receipt — dies in the band
  const lostU = tl.channel('lostU', 0); // "?" on the producer
  const retryU = tl.channel('retryU', 0); // the retry of seq=2 (out and back)
  const dupU = tl.channel('dupU', 0); // 204 duplicate chip
  const pipeU = tl.channel('pipeU', 0); // pipelined seq 3,4,5
  const eqU = tl.channel('eqU', 0); // "at least once + dedupe" equation
  const gapU = tl.channel('gapU', 0); // seq=7 arrives while 6 expected
  const gap409U = tl.channel('gap409U', 0); // 409 expected/received chip
  const restartU = tl.channel('restartU', 0); // producer restarts: epoch 1
  const zombU = tl.channel('zombU', 0); // the stale twin fires epoch 0
  const fenceU = tl.channel('fenceU', 0); // 403 + current epoch chip
  const dimU = tl.channel('dimU', 0);
  const cardU = tl.channel('cardU', 0);

  // — beat 1 · the stakes: a write retried is a write doubled —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Reads are safe to repeat — ask twice, get the same bytes. Writes are not. Retry an append over a bad connection, and the same message can land twice.',
  });
  tl.tween(nodesU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(naiveU, 1, { at: 2.6, dur: 2.2, ease: ease.move });
  tl.hold(6.7, 0.4);

  // — beat 2 · three headers sign every batch —
  tl.caption({
    at: 7.1,
    dur: 6.0,
    text: 'So every producer signs its batches with three headers: a stable identity, an epoch that counts its restarts, and a sequence number that counts its batches.',
  });
  tl.tween(naiveU, 0, { at: 7.3, dur: 0.8, ease: ease.enter });
  tl.tween(hdrU, 1, { at: 8.0, dur: 1.6, ease: ease.enter });
  tl.hold(13.1, 0.4);

  // — beat 3 · the register —
  tl.caption({
    at: 13.5,
    dur: 5.8,
    text: 'The server keeps one small register per producer: the highest epoch and sequence it has accepted. Every batch is checked against that register before a single byte lands.',
  });
  tl.tween(cam, CAM_GATE, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.tween(regU, 1, { at: 14.3, dur: 1.4, ease: ease.draw });
  tl.hold(19.3, 0.4);

  // — beat 4 · the happy path —
  tl.caption({
    at: 19.7,
    dur: 5.8,
    text: 'Happy path: sequence zero, then one — each exactly one ahead of the register. The gate opens, the bytes land, the register advances.',
  });
  tl.tween(s0U, 1, { at: 20.1, dur: 2.0, ease: ease.linear });
  tl.tween(s1U, 1, { at: 22.4, dur: 2.0, ease: ease.linear });
  tl.hold(25.5, 0.4);

  // — beat 5 · the lost receipt —
  tl.caption({
    at: 25.9,
    dur: 6.2,
    text: 'Now the network bites. Batch two lands — but its acknowledgment dies on the way back. The producer cannot tell a lost write from a lost receipt.',
  });
  tl.tween(s2U, 1, { at: 26.3, dur: 2.0, ease: ease.linear });
  tl.tween(ack2U, 0.45, { at: 28.5, dur: 1.1, ease: ease.linear }); // dies mid-band
  tl.tween(lostU, 1, { at: 30.0, dur: 0.6, ease: ease.pop });
  tl.hold(32.1, 0.4);

  // — beat 6 · the retry is a no-op —
  tl.caption({
    at: 32.5,
    dur: 6.4,
    text: 'So it retries the same batch, same sequence number. The register says: already have two. Nothing is appended — the server just re-sends the receipt. Same tape, no double write.',
  });
  tl.tween(retryU, 1, { at: 33.0, dur: 3.2, ease: ease.move });
  tl.tween(dupU, 1, { at: 35.0, dur: 0.7, ease: ease.pop });
  tl.tween(lostU, 0, { at: 36.4, dur: 0.6, ease: ease.enter });
  tl.hold(38.5, 0.4);

  // — beat 7 · exactly-once from at-least-once —
  tl.caption({
    at: 38.9,
    dur: 6.0,
    text: 'That is exactly once, built from at least once. Retries become no-ops, so the producer can fire and forget — pipelining batches without waiting on a single receipt.',
  });
  tl.tween(eqU, 1, { at: 39.3, dur: 0.8, ease: ease.enter });
  tl.tween(pipeU, 1, { at: 40.4, dur: 3.6, ease: ease.linear });
  tl.hold(44.5, 0.4);

  // — beat 8 · gaps are refused —
  tl.caption({
    at: 44.9,
    dur: 6.0,
    text: 'Sequence gaps are refused too. If batch seven arrives while the register expects six, the server answers with the number it wants, and the producer backfills.',
  });
  tl.tween(eqU, 0, { at: 45.1, dur: 0.6, ease: ease.enter });
  tl.tween(gapU, 1, { at: 45.6, dur: 2.6, ease: ease.move });
  tl.tween(gap409U, 1, { at: 48.0, dur: 0.7, ease: ease.pop });
  tl.hold(50.5, 0.4);

  // — beat 9 · zombie fencing —
  tl.caption({
    at: 50.9,
    dur: 6.4,
    text: 'Epochs fence the zombies. A crashed producer restarts with a higher epoch. Its forgotten twin, still writing with the old one, is refused — and told the current epoch.',
  });
  tl.tween(cam, CAM_WIDE, { at: 51.1, dur: 1.4, ease: ease.move });
  tl.tween(gap409U, 0, { at: 51.3, dur: 0.6, ease: ease.enter });
  tl.tween(restartU, 1, { at: 51.9, dur: 0.8, ease: ease.pop });
  tl.tween(zombU, 1, { at: 53.2, dur: 2.4, ease: ease.move });
  tl.tween(fenceU, 1, { at: 55.4, dur: 0.7, ease: ease.pop });
  tl.hold(57.7, 0.4);

  // — beat 10 · the payoff —
  tl.caption({
    at: 58.1,
    dur: 6.8,
    text: 'One register, three headers, and a network you never have to trust. The tape stays true under retries, restarts, and zombies — safe enough to build a platform on. Last stop: replay.',
  });
  tl.tween(dimU, 1, { at: 58.6, dur: 1.2, ease: ease.move });
  tl.tween(cardU, 1, { at: 60.0, dur: 0.9, ease: ease.pop });
  tl.hold(65.3, 1.8);

  return {
    tl, cam, nodesU, naiveU, hdrU, regU, s0U, s1U, s2U, ack2U, lostU,
    retryU, dupU, pipeU, eqU, gapU, gap409U, restartU, zombU, fenceU,
    dimU, cardU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const naiveU = s.get(scene.naiveU);
  const hdrU = s.get(scene.hdrU);
  const regU = s.get(scene.regU);
  const s0U = s.get(scene.s0U);
  const s1U = s.get(scene.s1U);
  const s2U = s.get(scene.s2U);
  const ack2U = s.get(scene.ack2U);
  const lostU = s.get(scene.lostU);
  const retryU = s.get(scene.retryU);
  const dupU = s.get(scene.dupU);
  const pipeU = s.get(scene.pipeU);
  const eqU = s.get(scene.eqU);
  const gapU = s.get(scene.gapU);
  const gap409U = s.get(scene.gap409U);
  const restartU = s.get(scene.restartU);
  const zombU = s.get(scene.zombU);
  const fenceU = s.get(scene.fenceU);
  const dimU = s.get(scene.dimU);
  const cardU = s.get(scene.cardU);

  const machineOp = 1 - 0.88 * dimU;

  // register contents (derived, so the panel always matches the action)
  const landedSeq = -1 + Math.floor(s0U) + Math.floor(s1U) + Math.floor(s2U) + Math.floor(pipeU * 3 + 1e-6);
  const epoch = restartU >= 0.5 ? 1 : 0;

  // batches on the tape: seq 0..5 (retry adds nothing — that's the point)
  const cellU = [s0U >= 1 ? 1 : 0, s1U >= 1 ? 1 : 0, s2U >= 1 ? 1 : 0, win(pipeU, 3, 0, 1.4), win(pipeU, 3, 1, 1.4), win(pipeU, 3, 2, 1.4)];

  // traveling packets
  const travel = (u: number) => (u > 0 && u < 1 ? batchPos(u) : null);
  const p0 = travel(s0U);
  const p1 = travel(s1U);
  const p2 = travel(s2U);
  const pAck = ack2U > 0 && ack2U < 0.45 ? ackPos(ack2U) : null;
  const ackDying = pAck && inBand(pAck.x) ? clamp01((ack2U - 0.3) / 0.15) : 0;
  // retry: out 0..0.55, receipt back 0.55..1
  const rOut = clamp01(retryU / 0.55);
  const rBack = clamp01((retryU - 0.55) / 0.45);
  const pipeBatches = [0, 1, 2].map((i) => {
    const u = win(pipeU, 3, i, 1.6);
    return u > 0 && u < 1 ? { p: batchPos(u), seq: 3 + i } : null;
  });
  const gOut = clamp01(gapU / 0.55);
  const gBack = clamp01((gapU - 0.55) / 0.45);
  const zOut = clamp01(zombU / 0.55);
  const zBack = clamp01((zombU - 0.55) / 0.45);
  const zombPos = (u: number) => ({ x: ZOMB.x + 86 + (GATE.x - 30 - (ZOMB.x + 86)) * u, y: ZOMB.y - 30 - (ZOMB.y - 30 - SEND_Y - 40) * u });

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* producer, zombie twin, network band, server zone */}
        <g opacity={machineOp}>
          <ServiceNode x={PROD.x} y={PROD.y} kind="server" label="producer" sublabel="order-service-1" u={nodesU} glow={restartU * 0.6} />
          <g opacity={restartU}>
            <rect x={PROD.x - 62} y={PROD.y - 74} width={124} height={24} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
            <text x={PROD.x} y={PROD.y - 57} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
              restart → epoch 1
            </text>
          </g>
          <g opacity={zombU > 0 ? 1 : 0}>
            <ServiceNode x={ZOMB.x} y={ZOMB.y} kind="server" label="zombie twin" sublabel="still epoch 0" u={clamp01(zombU * 4)} dim={0.35} status={fenceU > 0.5 ? 'down' : 'warn'} />
          </g>
          <Zone x={BAND.x} y={BAND.y} w={BAND.w} h={BAND.h} label="the network" kind="group" u={nodesU} color={colors.NEGATIVE} dim={0.25} />
          <text x={BAND.x + BAND.w / 2} y={BAND.y + BAND.h + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontStyle="italic" opacity={nodesU}>
            drops packets, loses receipts
          </text>
          <Zone x={REG.x - 40} y={REG.y - 46} w={450} h={470} label="Electric Streams server" kind="group" u={nodesU} color={colors.TEAL} />
        </g>

        {/* the double-charge inset — the stakes */}
        <g opacity={naiveU * machineOp}>
          <rect x={430} y={210} width={420} height={92} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
          <text x={454} y={240} fill={colors.MUTED} fontSize={12.5}>
            naive retry, no headers:
          </text>
          {[0, 1].map((i) => (
            <g key={i} opacity={win(naiveU, 2, i, 1.2)}>
              <rect x={454 + i * 130} y={252} width={118} height={34} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} />
              <text x={513 + i * 130} y={274} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
                charge $9
              </text>
            </g>
          ))}
          <text x={740} y={274} fill={colors.NEGATIVE} fontSize={13} fontWeight={600} opacity={win(naiveU, 2, 1, 1.2)}>
            twice.
          </text>
        </g>

        {/* the three headers on a sample batch */}
        <g opacity={hdrU * (1 - 0.85 * clamp01(s0U * 3)) * machineOp}>
          {['Producer-Id: order-service-1', 'Producer-Epoch: 0', 'Producer-Seq: 0'].map((h, i) => (
            <g key={h} opacity={win(hdrU, 3, i, 1.4)}>
              <rect x={PROD.x - 60} y={150 + i * 34} width={250} height={28} rx={8} fill={colors.PANEL} stroke={[colors.ACCENT, colors.SECONDARY, colors.WARM][i]} />
              <text x={PROD.x - 46} y={169 + i * 34} fill={[colors.ACCENT, colors.SECONDARY, colors.WARM][i]} fontSize={12.5} fontFamily={MONO}>
                {h}
              </text>
            </g>
          ))}
        </g>

        {/* the register */}
        <g opacity={regU * machineOp}>
          <rect x={REG.x} y={REG.y} width={REG.w} height={REG.h} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={REG.x + 18} y={REG.y + 28} fill={colors.MUTED} fontSize={12.5}>
            the register — per producer id
          </text>
          <text x={REG.x + 18} y={REG.y + 56} fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
            {`epoch: ${epoch}`}
          </text>
          <text x={REG.x + 18} y={REG.y + 80} fill={colors.TEXT} fontSize={14.5} fontFamily={MONO}>
            {`lastSeq: ${landedSeq < 0 ? '—' : landedSeq}`}
          </text>
          <text x={REG.x + REG.w - 16} y={REG.y + 56} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            accept iff seq == lastSeq + 1
          </text>
          <text x={REG.x + REG.w - 16} y={REG.y + 80} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            seq ≤ lastSeq → duplicate
          </text>
        </g>

        {/* the gate + tape of landed batches */}
        <g opacity={machineOp}>
          <g opacity={regU}>
            <path d={`M ${GATE.x - 16} ${GATE.y - 34} l 0 68 M ${GATE.x + 16} ${GATE.y - 34} l 0 68`} stroke={colors.WARM} strokeWidth={2.5} fill="none" />
            <text x={GATE.x} y={GATE.y + 56} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              the gate
            </text>
          </g>
          <line x1={cellX(0) - TAPE.cellW / 2} y1={TAPE.y + TAPE.cellH / 2 + 10} x2={cellX(6) - TAPE.cellW / 2 + 16} y2={TAPE.y + TAPE.cellH / 2 + 10} stroke={colors.GRID} strokeWidth={1.5} opacity={regU} />
          {cellU.map((u, i) => {
            if (u <= 0) return null;
            const x = cellX(i) - TAPE.cellW / 2 + 3;
            const drop = (1 - u) * (1 - u) * 50;
            const dedupeGlow = i === 2 && dupU > 0.3 && eqU <= 0 ? 1 : 0;
            return (
              <g key={i} opacity={u}>
                <rect x={x} y={TAPE.y - TAPE.cellH / 2 - drop} width={TAPE.cellW - 6} height={TAPE.cellH} rx={7} fill={colors.PANEL} stroke={dedupeGlow ? colors.POSITIVE : colors.ACCENT} strokeWidth={dedupeGlow ? 2.4 : 1.2} />
                <text x={x + (TAPE.cellW - 6) / 2} y={TAPE.y + 4 - drop} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
                  {`seq ${i}`}
                </text>
              </g>
            );
          })}
          <g opacity={dupU * machineOp}>
            <text x={cellX(2)} y={TAPE.y - TAPE.cellH / 2 - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
              still just one
            </text>
          </g>
        </g>

        {/* traveling batches + receipts */}
        <g opacity={machineOp}>
          {[p0, p1, p2].map((p, i) =>
            p ? (
              <g key={i}>
                <rect x={p.x - 26} y={p.y - 13} width={52} height={26} rx={7} fill={colors.ACCENT} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                  {`seq ${i}`}
                </text>
              </g>
            ) : null
          )}
          {/* seq 2's dying receipt */}
          {pAck && (
            <g opacity={1 - ackDying}>
              <circle cx={pAck.x} cy={pAck.y + ackDying * ackDying * 60} r={7} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={pAck.x} y={pAck.y - 12} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
                200 OK
              </text>
            </g>
          )}
          {/* the "?" on the producer */}
          <g opacity={lostU}>
            <text x={PROD.x + 66} y={PROD.y - 30} fill={colors.NEGATIVE} fontSize={30} fontWeight={700}>
              ?
            </text>
            <text x={PROD.x + 40} y={PROD.y - 6} fill={colors.MUTED} fontSize={11}>
              did it land?
            </text>
          </g>
          {/* the retry (same seq) and its duplicate receipt */}
          {retryU > 0 && retryU < 1 && (
            <g>
              {rBack <= 0 ? (
                <g>
                  <rect x={batchPos(rOut).x - 34} y={batchPos(rOut).y - 13} width={68} height={26} rx={7} fill={colors.WARM} />
                  <text x={batchPos(rOut).x} y={batchPos(rOut).y + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                    seq 2 ↻
                  </text>
                </g>
              ) : (
                <circle cx={ackPos(rBack).x} cy={ackPos(rBack).y} r={7} fill={colors.POSITIVE} />
              )}
            </g>
          )}
          <g opacity={dupU * (1 - 0.5 * clamp01(pipeU * 2))}>
            <rect x={GATE.x - 8} y={GATE.y - 86} width={250} height={28} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
            <text x={GATE.x + 117} y={GATE.y - 67} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
              204 — duplicate, already have it
            </text>
          </g>
          {/* pipelined batches */}
          {pipeBatches.map((b) =>
            b ? (
              <g key={b.seq}>
                <rect x={b.p.x - 26} y={b.p.y - 13} width={52} height={26} rx={7} fill={colors.ACCENT} />
                <text x={b.p.x} y={b.p.y + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                  {`seq ${b.seq}`}
                </text>
              </g>
            ) : null
          )}
          {/* the equation chip */}
          <g opacity={eqU * machineOp}>
            <rect x={430} y={92} width={420} height={34} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={640} y={114} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
              at least once + server dedupe = exactly once
            </text>
          </g>
          {/* the gap batch bouncing */}
          {gapU > 0 && gapU < 1 && (
            <g>
              {gBack <= 0 ? (
                <g>
                  <rect x={batchPos(gOut).x - 26} y={batchPos(gOut).y - 13} width={52} height={26} rx={7} fill={colors.NEGATIVE} />
                  <text x={batchPos(gOut).x} y={batchPos(gOut).y + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily={MONO}>
                    seq 7
                  </text>
                </g>
              ) : (
                <circle cx={ackPos(gBack).x} cy={ackPos(gBack).y} r={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              )}
            </g>
          )}
          <g opacity={gap409U}>
            <rect x={GATE.x - 8} y={GATE.y - 86} width={286} height={28} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} />
            <text x={GATE.x + 135} y={GATE.y - 67} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
              409 — Producer-Expected-Seq: 6
            </text>
          </g>
          {/* the zombie's batch hits the fence */}
          {zombU > 0 && zombU < 1 && (
            <g>
              {zBack <= 0 ? (
                <g>
                  <rect x={zombPos(zOut).x - 42} y={zombPos(zOut).y - 13} width={84} height={26} rx={7} fill={colors.NEGATIVE} opacity={0.85} />
                  <text x={zombPos(zOut).x} y={zombPos(zOut).y + 4} textAnchor="middle" fill={colors.BG} fontSize={10.5} fontFamily={MONO}>
                    epoch 0 seq 9
                  </text>
                </g>
              ) : (
                <circle cx={zombPos(1 - zBack).x} cy={zombPos(1 - zBack).y} r={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
              )}
            </g>
          )}
          <g opacity={fenceU * machineOp}>
            <rect x={GATE.x - 8} y={GATE.y + 74} width={252} height={28} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} />
            <text x={GATE.x + 118} y={GATE.y + 93} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
              403 — Producer-Epoch: 1. fenced.
            </text>
          </g>
        </g>

        {/* closing card */}
        <g opacity={cardU}>
          <rect x={310} y={240} width={660} height={176} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
            Exactly once, over a network you never trust
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={14.5}>
            duplicates re-receipted · gaps refused with the expected number · zombies fenced by epoch
          </text>
          <text x={640} y={366} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily={MONO}>
            Producer-Id · Producer-Epoch · Producer-Seq
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
