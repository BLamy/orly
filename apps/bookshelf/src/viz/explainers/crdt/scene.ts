import { Timeline, ease } from '../../core';
import type { ChannelRef } from '../../core';

/**
 * CRDTs — Merging Without Asking.
 *
 * Two replicas of one "likes" counter — a G-Counter, one grow-only slot per
 * device — go offline, diverge, and reconcile with nothing but elementwise
 * max. Then the other classic flavor, the LWW register, picks a winner by
 * clock instead. Every visual value is a Timeline channel or a pure
 * derivation of one; nothing self-animates and nothing is random.
 *
 * Beat map:
 *   0.0  beat 1 — two devices, one counter, a dashed sync link
 *  11.4  beat 2 — the link breaks (the plane takes off)
 *  16.2  beat 3 — concurrent taps: A counts +2, B counts +3
 *  25.0  beat 4 — heal + state exchange; per-slot max; both totals tick to 5
 *  39.4  beat 5 — replay strip: order swapped, merged twice — same result
 *  50.4  beat 6 — LWW register: "Draft"@t=10 loses to "Final"@t=12
 *  ~70.7 end
 */

export interface Pt {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Layout — 1280×720 stage; captions own the bottom ~12% (y ≳ 633)
// ---------------------------------------------------------------------------

export const A: Pt = { x: 320, y: 300 };
export const B: Pt = { x: 960, y: 300 };
export const BADGE_W = 180;
export const BADGE_H = 70;

/** The sync link runs badge edge to badge edge. */
export const LINK_A: Pt = { x: A.x + BADGE_W / 2 + 10, y: 300 };
export const LINK_B: Pt = { x: B.x - BADGE_W / 2 - 10, y: 300 };
export const LINK_MID = (LINK_A.x + LINK_B.x) / 2;
/** How far each broken half retracts from center at full break. */
export const BREAK_GAP = 150;

/** The big shared total under each badge, and the vector cells beneath it. */
export const COUNTER_DY = 80;
export const GRID_DY = 112;
export const CELL = 46;
export const GAP = 6;
export const GRID_W = CELL * 2 + GAP;
/** Incoming ghost row sits this far below the local grid's top. */
export const GHOST_DY = 64;

/** The vector each replica receives during the counter merge. */
export const INCOMING_AT_A: [number, number] = [0, 3]; // B's state
export const INCOMING_AT_B: [number, number] = [2, 0]; // A's state

/** Client-tap packets drop in from above each device. */
export const TAP_A = { from: { x: 150, y: 148 }, to: { x: A.x - 8, y: A.y - 16 } };
export const TAP_B = { from: { x: 1130, y: 148 }, to: { x: B.x + 8, y: B.y - 16 } };

/** State packets cross the link on slightly offset lanes so both read. */
export const MERGE_AB = { from: { x: LINK_A.x, y: 290 }, to: { x: LINK_B.x, y: 290 } };
export const MERGE_BA = { from: { x: LINK_B.x, y: 310 }, to: { x: LINK_A.x, y: 310 } };

// ---------------------------------------------------------------------------
// Beat 5 — the replay strip (same states, twice, and order-swapped)
// ---------------------------------------------------------------------------

export interface ReplayRow {
  y: number;
  a: [number, number];
  b: [number, number];
  note: string;
}

export const REPLAY_ROWS: ReplayRow[] = [
  { y: 200, a: [2, 0], b: [0, 3], note: '' },
  { y: 290, a: [0, 3], b: [2, 0], note: 'swapped' },
  { y: 380, a: [2, 3], b: [0, 3], note: 'again' },
];
export const REPLAY_RESULT: [number, number] = [2, 3];
/** Column x-positions of the strip: a ⊔ b = result ✓ note. */
export const RX = { chipA: 470, op: 543, chipB: 612, eq: 678, res: 745, check: 794, note: 812 };

// ---------------------------------------------------------------------------
// Beat 6 — the LWW register
// ---------------------------------------------------------------------------

export const REG = { labelDy: 74, boxDy: 108, w: 200, h: 46, ghostDy: 172 };
export const WRITE_A = { from: { x: 128, y: 470 }, to: { x: A.x, y: A.y + REG.boxDy } };
export const WRITE_B = { from: { x: 1152, y: 470 }, to: { x: B.x, y: B.y + REG.boxDy } };

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();

  // -- entrances, the link, flavor titles -----------------------------------
  const uA = tl.channel('uA', 0);
  const uB = tl.channel('uB', 0);
  const cellsIn = tl.channel('cellsIn', 0); // counter + vector cells entrance
  const linkIn = tl.channel('linkIn', 0); // link draw-on 0..1
  const linkBreak = tl.channel('linkBreak', 0); // 0 connected → 1 broken
  const pulseAB = tl.channel('pulseAB', 0); // idle "sync" pulse A→B
  const pulseBA = tl.channel('pulseBA', 0);
  const flavorG = tl.channel('flavorG', 0); // "G-COUNTER" heading
  const flavorL = tl.channel('flavorL', 0); // "LWW REGISTER" heading

  // -- G-Counter state: raw per-slot counts; totals derive at render --------
  const aA = tl.channel('aA', 0); // replica A, slot A
  const aB = tl.channel('aB', 0); // replica A, slot B
  const bA = tl.channel('bA', 0); // replica B, slot A
  const bB = tl.channel('bB', 0); // replica B, slot B

  // -- taps and emphasis -----------------------------------------------------
  const tapA1 = tl.channel('tapA1', 0);
  const tapA2 = tl.channel('tapA2', 0);
  const tapB1 = tl.channel('tapB1', 0);
  const tapB2 = tl.channel('tapB2', 0);
  const tapB3 = tl.channel('tapB3', 0);
  const glowA = tl.channel('glowA', 0);
  const glowB = tl.channel('glowB', 0);
  const popA = tl.channel('popA', 0); // total-text scale pop
  const popB = tl.channel('popB', 0);

  // -- the merge --------------------------------------------------------------
  const pktAB = tl.channel('pktAB', 0); // state packet A→B ("[2 0]")
  const pktBA = tl.channel('pktBA', 0); // state packet B→A ("[0 3]")
  const ghostA = tl.channel('ghostA', 0); // incoming vector shown under A
  const ghostB = tl.channel('ghostB', 0);
  const flash0 = tl.channel('flash0', 0); // slot-A compare ring, both replicas
  const flash1 = tl.channel('flash1', 0); // slot-B compare ring
  const texU = tl.channel('texU', 0); // merge(a,b)_i = max(a_i, b_i)

  // -- beat 5 replay strip -----------------------------------------------------
  const replayU = tl.channel('replayU', 0); // strip opacity + main-scene dim
  const lines = REPLAY_ROWS.map((_, i) => tl.channel(`line${i + 1}`, 0));

  // -- beat 6 LWW register -------------------------------------------------------
  const regU = tl.channel('regU', 0); // registers in, counter out
  const wPktA = tl.channel('wPktA', 0); // write packet "Draft"
  const wPktB = tl.channel('wPktB', 0); // write packet "Final"
  const draftA = tl.channel('draftA', 0); // "Draft" lands at A
  const draftAOut = tl.channel('draftAOut', 0); // …and later slides away, dashed
  const finalA = tl.channel('finalA', 0); // "Final" lands at A on merge
  const finalB = tl.channel('finalB', 0); // "Final" lands at B on write
  const bGhostIn = tl.channel('bGhostIn', 0); // incoming "Draft" appears at B…
  const bGhostOut = tl.channel('bGhostOut', 0); // …loses on clocks, slides away
  const lwwAB = tl.channel('lwwAB', 0); // register state packet A→B
  const lwwBA = tl.channel('lwwBA', 0);

  /** Quick emphasis pulse (badge glow, total pop): up fast, drift down. */
  const pulseCh = (ch: ChannelRef<number>, at: number, peak = 1) => {
    tl.tween(ch, peak, { at, dur: 0.16, ease: ease.pop });
    tl.tween(ch, 0, { at: at + 0.36, dur: 0.55, ease: ease.enter });
  };
  /** Compare-flash ring: hold a beat so the side-by-side comparison reads. */
  const flashCh = (ch: ChannelRef<number>, at: number) => {
    tl.tween(ch, 1, { at, dur: 0.22, ease: ease.enter });
    tl.tween(ch, 0, { at: at + 0.8, dur: 0.45, ease: ease.enter });
  };

  // ---- beat 1: two devices, one counter, no server (0 – 11.4) ---------------
  tl.tween(uA, 1, { at: 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(uB, 1, { at: 0.35, dur: 0.6, ease: ease.enter });
  tl.tween(cellsIn, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(linkIn, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 0.6,
    dur: 5.4,
    text: 'Two devices, one likes counter — and no server in the middle to referee.',
  });
  tl.tween(pulseAB, 1, { at: 2.6, dur: 1.4, ease: ease.linear });
  tl.tween(pulseBA, 1, { at: 4.4, dur: 1.4, ease: ease.linear });
  tl.caption({
    at: 6.3,
    dur: 5.0,
    text: 'Each keeps a tiny per-device tally — my taps, your taps. The score is just the sum.',
  });
  tl.tween(flavorG, 1, { at: 6.4, dur: 0.6, ease: ease.enter });
  tl.set(pulseAB, 0, 7.5);
  tl.tween(pulseAB, 1, { at: 7.6, dur: 1.4, ease: ease.linear });
  tl.hold(9.0, 2.4);

  // ---- beat 2: offline (11.4 – 16.2) -----------------------------------------
  tl.caption({
    at: 11.6,
    dur: 4.4,
    text: 'Then the plane takes off. No signal, no sync — each counter is on its own.',
  });
  tl.tween(linkBreak, 1, { at: 12.0, dur: 0.9, ease: ease.move });
  tl.hold(12.9, 3.3);

  // ---- beat 3: concurrent edits (16.2 – 25.0) ---------------------------------
  tl.caption({ at: 16.4, dur: 4.4, text: 'You tap twice; your friend taps three times.' });
  tl.tween(tapA1, 1, { at: 16.8, dur: 0.6, ease: ease.linear });
  tl.tween(aA, 1, { at: 17.4, dur: 0.25, ease: ease.enter });
  pulseCh(glowA, 17.4, 0.9);
  pulseCh(popA, 17.4);
  tl.tween(tapB1, 1, { at: 17.2, dur: 0.6, ease: ease.linear });
  tl.tween(bB, 1, { at: 17.8, dur: 0.25, ease: ease.enter });
  pulseCh(glowB, 17.8, 0.9);
  pulseCh(popB, 17.8);
  tl.tween(tapA2, 1, { at: 18.0, dur: 0.6, ease: ease.linear });
  tl.tween(aA, 2, { at: 18.6, dur: 0.25, ease: ease.enter });
  pulseCh(glowA, 18.6, 0.9);
  pulseCh(popA, 18.6);
  tl.tween(tapB2, 1, { at: 18.4, dur: 0.6, ease: ease.linear });
  tl.tween(bB, 2, { at: 19.0, dur: 0.25, ease: ease.enter });
  pulseCh(glowB, 19.0, 0.9);
  pulseCh(popB, 19.0);
  tl.tween(tapB3, 1, { at: 19.6, dur: 0.6, ease: ease.linear });
  tl.tween(bB, 3, { at: 20.2, dur: 0.25, ease: ease.enter });
  pulseCh(glowB, 20.2, 0.9);
  pulseCh(popB, 20.2);
  tl.caption({
    at: 21.2,
    dur: 3.6,
    text: 'A says 2. B says 3. Both are right — just right about different taps.',
  });
  tl.hold(24.8, 0.2);

  // ---- beat 4: the merge (25.0 – 39.4) ------------------------------------------
  tl.caption({
    at: 25.2,
    dur: 4.6,
    text: 'Back online. No apologies, no locks — each side simply mails its whole tally sheet.',
  });
  tl.tween(linkBreak, 0, { at: 25.6, dur: 0.8, ease: ease.move });
  tl.tween(pktAB, 1, { at: 26.8, dur: 1.4, ease: ease.linear });
  tl.tween(pktBA, 1, { at: 26.8, dur: 1.4, ease: ease.linear });
  tl.tween(ghostA, 1, { at: 28.2, dur: 0.45, ease: ease.enter });
  tl.tween(ghostB, 1, { at: 28.2, dur: 0.45, ease: ease.enter });
  tl.tween(texU, 1, { at: 28.9, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 29.9,
    dur: 4.8,
    text: 'The merge rule, in full: for every slot, keep the bigger number. That’s the whole algorithm.',
  });
  flashCh(flash0, 30.6); // slot A compares on both replicas: max(2,0)
  tl.tween(bA, 2, { at: 31.0, dur: 0.35, ease: ease.enter });
  pulseCh(popB, 31.05);
  pulseCh(glowB, 31.05, 0.8);
  flashCh(flash1, 32.2); // slot B: max(0,3)
  tl.tween(aB, 3, { at: 32.6, dur: 0.35, ease: ease.enter });
  pulseCh(popA, 32.65);
  pulseCh(glowA, 32.65, 0.8);
  tl.tween(ghostA, 0, { at: 33.8, dur: 0.5, ease: ease.enter });
  tl.tween(ghostB, 0, { at: 33.8, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 35.0,
    dur: 4.2,
    text: 'Likes: 5 on both screens — and nobody held a conflict-resolution meeting.',
  });
  tl.hold(39.2, 0.2);

  // ---- beat 5: why max works (39.4 – 50.4) ---------------------------------------
  tl.caption({
    at: 39.6,
    dur: 4.8,
    text: 'Suspicious? Replay it. Swap who merges into whom. Merge the same thing twice, even.',
  });
  tl.tween(replayU, 1, { at: 40.0, dur: 0.8, ease: ease.move });
  tl.tween(lines[0], 1, { at: 40.6, dur: 1.1, ease: ease.enter });
  tl.tween(lines[1], 1, { at: 42.0, dur: 1.1, ease: ease.enter });
  tl.tween(lines[2], 1, { at: 43.4, dur: 1.1, ease: ease.enter });
  tl.caption({
    at: 45.0,
    dur: 4.6,
    text: 'Identical, every time. The three magic words: commutative, associative, idempotent.',
  });
  tl.tween(replayU, 0, { at: 49.2, dur: 0.8, ease: ease.move });
  tl.hold(50.0, 0.4);

  // ---- beat 6: the LWW register (50.4 – ~70.7) -------------------------------------
  tl.caption({
    at: 50.6,
    dur: 4.4,
    text: 'Counters aren’t the only flavor. Meet the register: one “title” field, last write wins.',
  });
  tl.tween(regU, 1, { at: 51.0, dur: 0.8, ease: ease.move });
  tl.tween(texU, 0, { at: 51.0, dur: 0.5, ease: ease.enter });
  tl.tween(flavorG, 0, { at: 51.0, dur: 0.5, ease: ease.enter });
  tl.tween(flavorL, 1, { at: 51.2, dur: 0.6, ease: ease.enter });
  tl.tween(linkBreak, 1, { at: 52.4, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 55.2,
    dur: 4.6,
    text: 'Offline again: A titles it “Draft” at t=10. B overrules with “Final” at t=12.',
  });
  tl.tween(wPktA, 1, { at: 55.6, dur: 0.6, ease: ease.linear });
  tl.tween(draftA, 1, { at: 56.2, dur: 0.4, ease: ease.pop });
  pulseCh(glowA, 56.2, 0.8);
  tl.tween(wPktB, 1, { at: 56.8, dur: 0.6, ease: ease.linear });
  tl.tween(finalB, 1, { at: 57.4, dur: 0.4, ease: ease.pop });
  pulseCh(glowB, 57.4, 0.8);
  tl.tween(linkBreak, 0, { at: 58.4, dur: 0.8, ease: ease.move });
  tl.tween(lwwAB, 1, { at: 59.2, dur: 1.3, ease: ease.linear });
  tl.tween(lwwBA, 1, { at: 59.2, dur: 1.3, ease: ease.linear });
  tl.caption({
    at: 60.1,
    dur: 4.8,
    text: 'Merge compares clocks: t=12 beats t=10. “Draft” bows out, dashed — a choice, not a conflict.',
  });
  tl.tween(bGhostIn, 1, { at: 60.5, dur: 0.35, ease: ease.enter });
  tl.tween(bGhostOut, 1, { at: 61.2, dur: 0.8, ease: ease.move });
  tl.tween(draftAOut, 1, { at: 60.9, dur: 0.9, ease: ease.move });
  tl.tween(finalA, 1, { at: 61.3, dur: 0.5, ease: ease.pop });
  pulseCh(glowA, 61.4, 0.8);
  tl.caption({
    at: 65.3,
    dur: 4.4,
    text: 'That’s the local-first bargain: edit anywhere, sync whenever, and merging never has to ask.',
  });
  tl.set(pulseAB, 0, 65.4);
  tl.tween(pulseAB, 1, { at: 65.7, dur: 1.4, ease: ease.linear });
  tl.set(pulseBA, 0, 66.3);
  tl.tween(pulseBA, 1, { at: 66.6, dur: 1.4, ease: ease.linear });
  tl.hold(69.7, 1.0);

  return {
    tl,
    uA,
    uB,
    cellsIn,
    linkIn,
    linkBreak,
    pulseAB,
    pulseBA,
    flavorG,
    flavorL,
    aA,
    aB,
    bA,
    bB,
    tapA1,
    tapA2,
    tapB1,
    tapB2,
    tapB3,
    glowA,
    glowB,
    popA,
    popB,
    pktAB,
    pktBA,
    ghostA,
    ghostB,
    flash0,
    flash1,
    texU,
    replayU,
    lines,
    regU,
    wPktA,
    wPktB,
    draftA,
    draftAOut,
    finalA,
    finalB,
    bGhostIn,
    bGhostOut,
    lwwAB,
    lwwBA,
  };
}
