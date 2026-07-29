import { Timeline, colors, ease, mulberry32, stagger } from '../../core';
import type { ChannelRef } from '../../core';

/**
 * Raft — leader election & log replication, scripted as one Timeline.
 *
 * Five servers in a wide ring. One election, one replicated write, one
 * partition (the old leader stranded in the minority), one heal-and-step-down.
 * Every visual value is a channel or a pure derivation of one; nothing here
 * knows about wall clocks.
 *
 * Beat map (seeded, so these are exact):
 *   0.00  beat 1 — five nervous followers, timers drain at seeded rates
 *   6.73  beat 2 — S3 fires first: candidate, term 2, wins 3/5 at 9.58
 *  17.48  beat 3 — client write "x=5": append → fan out → acks → commit 22.28
 *  30.88  beat 4 — partition {S1,S3} | {S2,S4,S5}; stranded-leader write;
 *  38.49           S4 fires: candidate, term 3, wins 3/5 at 41.19; "x=8" commits 50.04
 *  53.79  beat 5 — heal: S3 steps down, x=7 rolls back, majority log flows in
 *  ~71.0  end
 */

export interface Pt {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Layout — 1280×720, ring centered above the caption lower-third
// ---------------------------------------------------------------------------

export const RING_C: Pt = { x: 640, y: 330 };
export const RING_R = 230;

/** Ring angles (deg) chosen so a vertical wall at x=580 splits 2 | 3. */
const ANGLES = [218, -70, 146, 2, 74];

export const SERVERS: Pt[] = ANGLES.map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: RING_C.x + RING_R * Math.cos(a), y: RING_C.y + RING_R * Math.sin(a) };
});

export const CLIENT: Pt = { x: 112, y: 372 };

export const BADGE_W = 112;
export const BADGE_H = 50;
/** Election-timer arc sits at the badge's top-right corner. */
export const ARC_DX = 68;
export const ARC_DY = -36;

/** Mini log strip below each badge: a 1×4 row of small cells. */
export const CELL = 16;
export const CELL_GAP = 4;
export const SLOTS = 4;
export const STRIP_W = SLOTS * CELL + (SLOTS - 1) * CELL_GAP;
export const STRIP_DY = BADGE_H / 2 + 9;

// The partition wall: {S1, S3} on the left, {S2, S4, S5} on the right.
export const PART_X = 580;
export const PART_Y0 = 70;
export const PART_LEN = 540;

export const MINORITY = [0, 2]; // S1, S3 — the old leader's small side
export const MAJORITY = [1, 3, 4]; // S2, S4, S5
/** Majority followers whose timers reset when they grant S4 a vote. */
export const RESET2 = [1, 4];

/** S3's audience in term 2 (everyone else), and S4's reachable peers in term 3. */
export const PEERS1 = [0, 1, 3, 4];
export const PEERS2 = [1, 4];
export const BLOCKED1 = [1, 3, 4]; // S3 → these die at the wall
export const BLOCKED2 = [0, 2]; // S4's RequestVotes → these die at the wall
export const HB2 = [0, 1, 2, 4]; // S4's heartbeat targets once it leads

/** Where the segment a→b meets the partition wall. */
const wallPoint = (a: Pt, b: Pt): Pt => {
  const u = (PART_X - a.x) / (b.x - a.x);
  return { x: PART_X, y: a.y + (b.y - a.y) * u };
};
export const WALL1: Pt[] = BLOCKED1.map((i) => wallPoint(SERVERS[2], SERVERS[i]));
export const WALL2: Pt[] = BLOCKED2.map((i) => wallPoint(SERVERS[3], SERVERS[i]));

// ---------------------------------------------------------------------------
// Seeded election timeouts — deterministic, computed once at module scope
// ---------------------------------------------------------------------------

const rand = mulberry32(11);

/** Term-2 era: everyone's first timeout (seconds of drain). */
export const T1: number[] = Array.from({ length: 5 }, () => 4.6 + rand() * 2.8);
{
  // S3 drew the short straw — someone has to wake first, and visibly so.
  const iMin = T1.indexOf(Math.min(...T1));
  [T1[2], T1[iMin]] = [T1[iMin], T1[2]];
  T1[2] -= 1.1;
}

/** Term-3 era: only the majority side loses its heartbeats and drains. */
export const T2: number[] = SERVERS.map((_, i) =>
  MAJORITY.includes(i) ? 3.4 + rand() * 2.6 : Infinity,
);
{
  // Make sure S4 is the one that fires (with seed 11 it already is).
  const iMin = MAJORITY.reduce((a, b) => (T2[a] <= T2[b] ? a : b));
  [T2[3], T2[iMin]] = [T2[iMin], T2[3]];
}

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();

  /** One packet flight: tween u 0→1, then snap back to 0 so the channel can be reused. */
  const flight = (ch: ChannelRef<number>, at: number, dur: number): number => {
    tl.tween(ch, 1, { at, dur, ease: ease.linear });
    tl.set(ch, 0, at + dur);
    return at + dur;
  };

  // ---- global channels ----
  const term = tl.channel('term', 1); // rendered as floor()
  const clock1 = tl.channel('clock1', 0); // term-2 era shared drain clock
  const refill1 = tl.channel('refill1', 0); // followers' arcs reset on granting a vote
  const refill3 = tl.channel('refill3', 0); // S3's arc returns when it steps down
  const clock2 = tl.channel('clock2', 0); // partition-era drain clock (majority side)
  const refill2 = tl.channel('refill2', 0); // S2/S5 arcs reset on granting S4 a vote
  const clientU = tl.channel('clientU', 0);
  const partU = tl.channel('partU', 0); // partition wall sweep 0..1
  const blockFlash = tl.channel('blockFlash', 0); // × marks where S3's packets die
  const blockFlash2 = tl.channel('blockFlash2', 0); // × marks where S4's RequestVotes die
  const tallyU = tl.channel('tallyU', 0); // "n/5" by S3
  const tallyN = tl.channel('tallyN', 0);
  const tally2U = tl.channel('tally2U', 0); // "n/5" by S4
  const tally2N = tl.channel('tally2N', 0);

  // ---- per-server channels ----
  const srvU = SERVERS.map((_, i) => tl.channel(`srvU${i}`, 0));
  const color = SERVERS.map((_, i) => tl.channel<string>(`color${i}`, colors.MUTED));
  const glow = SERVERS.map((_, i) => tl.channel(`glow${i}`, 0));
  const dim = SERVERS.map((_, i) => tl.channel(`dim${i}`, 0));
  const role = SERVERS.map((_, i) => tl.channel<string>(`role${i}`, 'follower'));
  const arcOp = SERVERS.map((_, i) => tl.channel(`arcOp${i}`, 1));

  // ---- per-log-cell channels (existence u, committedness c) ----
  const cellU = SERVERS.map((_, i) => [tl.channel(`cell${i}u0`, 0), tl.channel(`cell${i}u1`, 0)]);
  const cellC = SERVERS.map((_, i) => [tl.channel(`cell${i}c0`, 0), tl.channel(`cell${i}c1`, 0)]);

  // ---- packet channels (each drives exactly one Packet; reused sequentially) ----
  const rv = PEERS1.map((i) => tl.channel(`rv${i}`, 0)); // S3 → peer: RequestVote
  const vt = PEERS1.map((i) => tl.channel(`vt${i}`, 0)); // peer → S3: vote granted
  const hb = PEERS1.map((i) => tl.channel(`hb${i}`, 0)); // S3 → peer: heartbeat
  const ae = PEERS1.map((i) => tl.channel(`ae${i}`, 0)); // S3 → peer: AppendEntries
  const ack = PEERS1.map((i) => tl.channel(`ack${i}`, 0)); // peer → S3: ack
  const cw1 = tl.channel('cw1', 0); // client → S3: set x=5
  const cw2 = tl.channel('cw2', 0); // client → S3: set x=7 (doomed)
  const cw3 = tl.channel('cw3', 0); // client → S4: set x=8 (retry)
  const bp = BLOCKED1.map((i) => tl.channel(`bp${i}`, 0)); // S3 → wall
  const rv2 = PEERS2.map((i) => tl.channel(`rv2_${i}`, 0)); // S4 → peer: RequestVote
  const vt2 = PEERS2.map((i) => tl.channel(`vt2_${i}`, 0)); // peer → S4: vote granted
  const ae2 = PEERS2.map((i) => tl.channel(`ae2_${i}`, 0)); // S4 → peer: AppendEntries
  const ack2 = PEERS2.map((i) => tl.channel(`ack2_${i}`, 0)); // peer → S4: ack
  const bp2 = BLOCKED2.map((i) => tl.channel(`bp2_${i}`, 0)); // S4 → wall
  const hb2 = HB2.map((i) => tl.channel(`hb2_${i}`, 0)); // S4 → peer: heartbeat
  const aem = [tl.channel('aem0', 0), tl.channel('aem2', 0)]; // S4 → S1 / S3: catch-up append

  // =========================================================================
  // BEAT 1 — five followers, five nervous clocks (t = 0)
  // =========================================================================
  tl.caption({
    at: 0.2,
    dur: 4.2,
    text: 'Five servers boot up as followers — each with a clock, each a little nervous.',
  });
  stagger(5, { at: 0.4, each: 0.1, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween(srvU[i], 1, o),
  );

  // One shared clock; each arc derives remaining = 1 − clock/T1[i], clamped.
  const clockStart = 1.8;
  tl.tween(clock1, T1[2], { at: clockStart, dur: T1[2], ease: ease.linear });
  tl.caption({ at: 4.5, dur: 2.1, text: 'First clock to hit zero gets ambitious.' });

  // =========================================================================
  // BEAT 2 — S3's timer fires: candidate, term 2, election (t ≈ 6.73)
  // =========================================================================
  const tFire = clockStart + T1[2];

  tl.tween(color[2], colors.WARM, { at: tFire, dur: 0.45, ease: ease.enter });
  tl.tween(glow[2], 0.5, { at: tFire, dur: 0.45, ease: ease.enter });
  tl.set(role[2], 'candidate', tFire);
  tl.set(term, 2, tFire + 0.25);
  tl.caption({
    at: tFire + 0.1,
    dur: 2.7,
    text: 'S3 wakes first, votes for itself, and calls an election. Term 2.',
  });

  tl.tween(tallyU, 1, { at: tFire + 0.3, dur: 0.35, ease: ease.enter });
  tl.set(tallyN, 1, tFire + 0.3); // self-vote: 1/5

  // RequestVote fans out to everyone.
  PEERS1.forEach((_, k) => flight(rv[k], tFire + 0.7 + k * 0.12, 0.85));
  // Granting a vote resets your election timer — arcs refill.
  tl.tween(refill1, 1, { at: tFire + 1.6, dur: 0.5, ease: ease.enter });

  // Votes come home: S1 and S2 seal it; S4's lands just after; S5 dawdles.
  flight(vt[0], tFire + 1.8, 0.8);
  tl.set(tallyN, 2, tFire + 2.6);
  flight(vt[1], tFire + 2.05, 0.8);
  tl.set(tallyN, 3, tFire + 2.85);
  const tWin = tFire + 2.85; // 3rd vote lands — majority
  flight(vt[2], tFire + 2.3, 0.8); // S4's vote: appreciated, irrelevant
  flight(vt[3], tFire + 3.3, 1.2); // S5's vote: fashionably late

  tl.tween(color[2], colors.ACCENT, { at: tWin, dur: 0.5, ease: ease.move });
  tl.tween(glow[2], 1, { at: tWin, dur: 0.5, ease: ease.pop });
  tl.set(role[2], 'leader', tWin);
  tl.tween(arcOp[2], 0, { at: tWin, dur: 0.5 }); // leaders don't run election timers
  tl.tween(tallyU, 0, { at: tWin + 1.4, dur: 0.4 });
  tl.caption({
    at: tWin + 0.15,
    dur: 3.8,
    text: "Three of five — a majority. S3 leads term 2. (S5's vote arrives late; democracy has moved on.)",
  });

  // Heartbeats: two visible rounds, then we take them as read.
  PEERS1.forEach((_, k) => flight(hb[k], tWin + 1.3 + k * 0.06, 0.7));
  tl.caption({
    at: tWin + 4.2,
    dur: 3.3,
    text: 'Heartbeats now reset every clock before it runs out. No more elections — for now.',
  });
  PEERS1.forEach((_, k) => flight(hb[k], tWin + 4.6 + k * 0.06, 0.7));

  // =========================================================================
  // BEAT 3 — replication: set x=5 (t ≈ 17.48)
  // =========================================================================
  const t3 = tWin + 7.9;

  tl.tween(clientU, 1, { at: t3, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: t3 + 0.1,
    dur: 3.4,
    text: 'A client shows up: set x = 5. Writes go to the leader — nobody else.',
  });
  flight(cw1, t3 + 1.0, 1.0);
  // Appended on the leader: uncommitted, amber, dashed.
  tl.tween(cellU[2][0], 1, { at: t3 + 2.0, dur: 0.45, ease: ease.pop });

  // AppendEntries fan out; follower cells fill as each one lands; acks return.
  PEERS1.forEach((i, k) => {
    const land = flight(ae[k], t3 + 2.7 + k * 0.1, 0.9);
    tl.tween(cellU[i][0], 1, { at: land, dur: 0.4, ease: ease.pop });
    flight(ack[k], land + 0.3, 0.8);
  });
  tl.caption({
    at: t3 + 3.6,
    dur: 2.1,
    text: 'Appended is not committed. S3 fans it out and counts acks.',
  });

  // 2nd ack home ⇒ the entry exists on 3 of 5 servers ⇒ committed on the leader.
  const tCommit = t3 + 4.8;
  tl.tween(cellC[2][0], 1, { at: tCommit, dur: 0.5, ease: ease.move });
  tl.caption({
    at: tCommit + 1.0,
    dur: 4.0,
    text: "Two acks plus its own copy: three of five. Committed — it's safely on a majority.",
  });

  // The next heartbeat carries the commit index; followers mark it green.
  PEERS1.forEach((i, k) => {
    const land = flight(hb[k], tCommit + 1.8 + k * 0.06, 0.7);
    tl.tween(cellC[i][0], 1, { at: land, dur: 0.4, ease: ease.move });
  });
  tl.caption({
    at: tCommit + 5.2,
    dur: 3.2,
    text: 'The next heartbeat spreads the news; followers mark it committed too.',
  });

  // =========================================================================
  // BEAT 4 — partition: the leader is stranded in the minority (t ≈ 30.88)
  // =========================================================================
  const t4 = tCommit + 8.6;

  tl.tween(partU, 1, { at: t4 + 0.2, dur: 1.1, ease: ease.draw });
  MINORITY.forEach((i) => tl.tween(dim[i], 0.3, { at: t4 + 0.9, dur: 0.8 }));
  tl.caption({
    at: t4 + 0.2,
    dur: 3.7,
    text: 'Then the network tears. The leader lands on the small side, with only S1 for company.',
  });

  // A write to the stranded leader: it appends (to itself, and to S1)…
  flight(cw2, t4 + 2.3, 0.9);
  tl.tween(cellU[2][1], 1, { at: t4 + 3.2, dur: 0.45, ease: ease.pop });
  const landS1 = flight(ae[0], t4 + 3.7, 0.9); // S1 is still reachable
  tl.tween(cellU[0][1], 1, { at: landS1, dur: 0.4, ease: ease.pop });
  // …but its AppendEntries to the other three die at the wall.
  BLOCKED1.forEach((_, k) => flight(bp[k], t4 + 3.7 + k * 0.05, 0.75));
  tl.tween(blockFlash, 1, { at: t4 + 4.35, dur: 0.18, ease: ease.enter });
  tl.tween(blockFlash, 0, { at: t4 + 4.53, dur: 0.6 });
  tl.caption({
    at: t4 + 4.0,
    dur: 3.6,
    text: 'S3 still appends the write, but replication dies at the wall. Two copies is not a majority — nothing commits.',
  });

  // Meanwhile the majority side has heard no heartbeats; its clocks drain.
  const c2Start = t4 + 4.0;
  tl.tween(clock2, T2[3], { at: c2Start, dur: T2[3], ease: ease.linear });
  const tFire2 = c2Start + T2[3]; // S4 fires first (t ≈ 38.49)

  tl.tween(color[3], colors.WARM, { at: tFire2, dur: 0.45, ease: ease.enter });
  tl.tween(glow[3], 0.5, { at: tFire2, dur: 0.45, ease: ease.enter });
  tl.set(role[3], 'candidate', tFire2);
  tl.set(term, 3, tFire2 + 0.25);
  tl.caption({
    at: tFire2 + 0.15,
    dur: 3.5,
    text: "The big side hears no heartbeats. S4's clock expires first: candidate, term 3.",
  });

  tl.tween(tally2U, 1, { at: tFire2 + 0.3, dur: 0.35, ease: ease.enter });
  tl.set(tally2N, 1, tFire2 + 0.3); // self-vote
  // RequestVote to S2 and S5 — and, dutifully, toward S1 and S3 (splat).
  PEERS2.forEach((_, k) => flight(rv2[k], tFire2 + 0.6 + k * 0.12, 0.8));
  BLOCKED2.forEach((_, k) => flight(bp2[k], tFire2 + 0.6 + k * 0.08, 0.55));
  tl.tween(blockFlash2, 1, { at: tFire2 + 1.15, dur: 0.18, ease: ease.enter });
  tl.tween(blockFlash2, 0, { at: tFire2 + 1.33, dur: 0.6 });
  tl.tween(refill2, 1, { at: tFire2 + 1.5, dur: 0.5, ease: ease.enter }); // S2/S5 grant → reset

  flight(vt2[0], tFire2 + 1.7, 0.75);
  tl.set(tally2N, 2, tFire2 + 2.45);
  flight(vt2[1], tFire2 + 1.95, 0.75);
  tl.set(tally2N, 3, tFire2 + 2.7);
  const tWin2 = tFire2 + 2.7; // majority again (t ≈ 41.19)

  tl.tween(color[3], colors.ACCENT, { at: tWin2, dur: 0.5, ease: ease.move });
  tl.tween(glow[3], 1, { at: tWin2, dur: 0.5, ease: ease.pop });
  tl.set(role[3], 'leader', tWin2);
  tl.tween(arcOp[3], 0, { at: tWin2, dur: 0.5 });
  tl.tween(tally2U, 0, { at: tWin2 + 1.3, dur: 0.4 });
  tl.caption({
    at: tFire2 + 3.9,
    dur: 3.3,
    text: 'Three of five again. Two leaders exist right now — but only one of them can commit.',
  });

  // The client gives up on S3 and retries elsewhere.
  tl.caption({
    at: tWin2 + 4.8,
    dur: 3.7,
    text: 'The partition split the servers, not the client. It retries and finds S4: set x = 8.',
  });
  flight(cw3, tWin2 + 5.2, 1.3);
  tl.tween(cellU[3][1], 1, { at: tWin2 + 6.5, dur: 0.45, ease: ease.pop });
  PEERS2.forEach((i, k) => {
    const land = flight(ae2[k], tWin2 + 7.0 + k * 0.1, 0.8);
    tl.tween(cellU[i][1], 1, { at: land, dur: 0.4, ease: ease.pop });
    flight(ack2[k], land + 0.25, 0.7);
  });
  // 2nd ack ⇒ S4 + S2 + S5 = three copies ⇒ committed (t ≈ 50.04)…
  const tCommit2 = tWin2 + 8.85;
  tl.tween(cellC[3][1], 1, { at: tCommit2, dur: 0.5, ease: ease.move });
  // …and the next heartbeat tells S2 and S5.
  [1, 3].forEach((k, j) => {
    const land = flight(hb2[k], tCommit2 + 0.5 + j * 0.1, 0.7);
    tl.tween(cellC[HB2[k]][1], 1, { at: land, dur: 0.4, ease: ease.move });
  });
  tl.caption({
    at: tWin2 + 8.6,
    dur: 3.6,
    text: 'Three copies on this side — so it commits. The small side is stuck in the past.',
  });

  // =========================================================================
  // BEAT 5 — heal: step down, roll back, converge (t ≈ 53.79)
  // =========================================================================
  const t5 = tWin2 + 12.6;

  tl.caption({ at: t5 + 0.1, dur: 2.9, text: 'The network heals. Time for an awkward conversation.' });
  tl.tween(partU, 0, { at: t5 + 0.5, dur: 1.0, ease: ease.move });
  MINORITY.forEach((i) => tl.tween(dim[i], 0, { at: t5 + 0.9, dur: 0.8 }));

  // A term-3 heartbeat reaches the old leader — it steps down instantly.
  const landHb3 = flight(hb2[2], t5 + 1.7, 0.95); // S4 → S3
  flight(hb2[0], t5 + 1.9, 0.95); // S4 → S1
  tl.tween(color[2], colors.MUTED, { at: landHb3, dur: 0.6, ease: ease.move });
  tl.tween(glow[2], 0, { at: landHb3, dur: 0.45 });
  tl.set(role[2], 'follower', landHb3);
  tl.tween(arcOp[2], 1, { at: landHb3 + 0.2, dur: 0.5 });
  tl.tween(refill3, 1, { at: landHb3 + 0.2, dur: 0.5, ease: ease.enter }); // its arc returns, full
  tl.caption({
    at: t5 + 3.2,
    dur: 3.7,
    text: 'S3 hears term 3 and steps down on the spot. A bigger term always wins the argument.',
  });

  // The never-committed x=7 entries pop off…
  tl.tween(cellU[2][1], 0, { at: t5 + 4.4, dur: 0.4, ease: ease.move });
  tl.tween(cellU[0][1], 0, { at: t5 + 4.6, dur: 0.4, ease: ease.move });
  // …and the majority's committed entry flows in to replace them.
  const landM3 = flight(aem[1], t5 + 6.4, 0.9); // S4 → S3
  tl.set(cellC[2][1], 1, landM3 - 0.01);
  tl.tween(cellU[2][1], 1, { at: landM3, dur: 0.45, ease: ease.pop });
  const landM1 = flight(aem[0], t5 + 6.65, 0.9); // S4 → S1
  tl.set(cellC[0][1], 1, landM1 - 0.01);
  tl.tween(cellU[0][1], 1, { at: landM1, dur: 0.45, ease: ease.pop });
  tl.caption({
    at: t5 + 7.1,
    dur: 3.9,
    text: 'The uncommitted scribble rolls back; the real log flows in. No client was ever promised x = 7.',
  });

  // Steady state: term-3 heartbeats to everyone.
  HB2.forEach((_, k) => flight(hb2[k], t5 + 9.4 + k * 0.06, 0.75));
  tl.caption({
    at: t5 + 11.4,
    dur: 4.6,
    text: "One leader, one term at a time, one log everyone agrees on. That's Raft.",
  });
  tl.hold(t5 + 16, 1.2);

  return {
    tl,
    term,
    clock1,
    refill1,
    refill3,
    clock2,
    refill2,
    clientU,
    partU,
    blockFlash,
    blockFlash2,
    tallyU,
    tallyN,
    tally2U,
    tally2N,
    srvU,
    color,
    glow,
    dim,
    role,
    arcOp,
    cellU,
    cellC,
    rv,
    vt,
    hb,
    ae,
    ack,
    cw1,
    cw2,
    cw3,
    bp,
    rv2,
    vt2,
    ae2,
    ack2,
    bp2,
    hb2,
    aem,
  };
}

export type RaftScene = ReturnType<typeof buildScene>;
