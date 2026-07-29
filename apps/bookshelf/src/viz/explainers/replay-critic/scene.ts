import { Timeline, ease } from '../../core';
import type { RecordingPoint } from '../../agent';

/**
 * Replays — agents that prove their work (Replay.io's adversarial
 * worker/critic loop).
 *
 * The canonical bug: promo code SAVE20. The screen shows $79.20, but
 * POST /api/checkout carries {total: 99.00} — the discount was computed in
 * the summary component; the store and the wire never learned about it. A
 * session that satisfied its own author is a CLAIM. The recording is the
 * evidence, and the critic interrogates it: predict-then-verify
 * falsification, then sufficiency over the PR diff, then promotion of what
 * deserves to outlive the pass. Every value below is data at module scope;
 * every frame is a pure function of the sampled channels.
 */

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 633). */
export const TRANSCRIPT = { x: 80, w: 440, y: 100, gap: 13 };
export const SCREEN = { x: 760, y: 100, w: 420, h: 230 };
export const STRIP = { x: 80, y: 480, w: 1100 };
export const PV = { predX: 80, predY: 100, predW: 480, stackX: 640, stackY: 100, stackW: 480 };
export const DIFF = { x: 80, y: 110, w: 580 };
export const MOCK = { x: 700, y: 120, w: 480 };
export const BANNER = { x: 640, y: 52 };
export const RAIL = { x: 150, y: 360, w: 980 };

/* ------------------------------------------------------------------ data */
export const M1 = 'tool_use → browser {"type": "SAVE20", "into": "#promo"}';
export const M2 = 'screen: total $79.20 — discount applied ✓';
export const M3 = 'Verified in-session: promo works. Shipping it.';

export const PREDICTION = 'at the checkout click, payload total = store total = rendered total';
export const OBSERVED = 'observed: render 79.20 · store 99.00 · wire 99.00';

/** The recording: every call, network request, render — deterministically. */
export const POINTS: RecordingPoint[] = [
  { at: 0.07, kind: 'interaction', label: 'load /checkout' },
  { at: 0.24, kind: 'interaction', label: 'type SAVE20' },
  { at: 0.38, kind: 'render', label: '$79.20' },
  { at: 0.56, kind: 'interaction', label: 'click Pay' },
  { at: 0.7, kind: 'network', label: 'POST /api/checkout' },
  { at: 0.86, kind: 'render', label: 'confirmation' },
];
export const LINK_AT = 0.7; // the cited point: where the wire told the truth

export const MCP_TOOLS = ['Evaluate', 'Logpoint', 'NetworkRequest', 'GetPointLink', '…'];

/** Sufficiency: the PR diff held against the recording, hunk by hunk. */
export const HUNKS = [
  { label: 'applyDiscount(cart)', kind: 'executed' as const },
  { label: 'invalid-code error path', kind: 'needs-proof' as const },
  { label: 'roundCurrency()', kind: 'dead' as const },
  { label: 'types + config', kind: 'waived' as const },
];
export const EXEC_HITS = 14;

/** The mock audit: test data that made the session pass is what ships. */
export const MOCK_TABLE = 'PROMO_TABLE = {SAVE20: 0.2, TESTFREE: 1.0}';
export const MOCK_FLAG = 'compiled into the client bundle';
export const MOCK_NOTE = 'TESTFREE: minted by the worker, for the worker';

/** Pass 2: 4/4 predictions held. */
export const HELD = ['charge truth', 'validation truth', 'render truth', 'invalid-code path'];

export const PROMOTIONS = [
  { name: 'checkout-promo.spec.ts', sub: 'deterministic · Playwright — the money path', kind: 'spec' as const },
  { name: 'invalid-code journey (BOGUS)', sub: 'agent-executed · Stagehand-style — surface churns, intent stable', kind: 'agent' as const },
];

export const BANNERS = [
  'pass 0 · needs_revision — charge truth FAILED: 79.20 vs 99.00',
  'pass 1 · needs_revision — validation truth FAILED · coverage gaps',
  'pass 2 · satisfied — 4/4 held · coverage 100% · 2 waived',
];

/** The gauntlet, in order; ANY failure returns the agent to the TOP. */
export const GATE_LABELS = ['lint', 'agent sessions', 'replay verify', 'PR', 'full suite', 'AI review', 'merge'];
export const FAIL_GATE = 2; // replay adversarial verification
export const SUITE_GATE = 4; // where the promoted spec lands

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  // beat 1 — the worker ships a claim
  const m1E = tl.channel('m1Enter', 0);
  const m1T = tl.channel('m1Text', 0);
  const m2E = tl.channel('m2Enter', 0);
  const m2T = tl.channel('m2Text', 0);
  const m3E = tl.channel('m3Enter', 0);
  const m3T = tl.channel('m3Text', 0);
  const scrE = tl.channel('screenEnter', 0);
  const promoU = tl.channel('promoApplied', 0);
  const claimU = tl.channel('claimStamp', 0);
  const gSession = tl.channel('sessionFade', 1);

  // beat 2 — the recording
  const stripR = tl.channel('stripReveal', 0);
  const stripU = tl.channel('stripSweep', 0);
  const mcpU = tl.channel('mcpChips', 0);
  const gStrip = tl.channel('stripFade', 1);

  // beat 3 — predict-then-verify
  const predE = tl.channel('predEnter', 0);
  const predStamp = tl.channel('predStamp', 0);
  const predText = tl.channel('predText', 0);
  const predObs = tl.channel('predObserved', 0);
  const stackU = tl.channel('stackRows', 0);
  const connU = tl.channel('connReveal', 0);
  const snapU = tl.channel('connSnap', 0);
  const stackV = tl.channel('stackVerdict', 0);
  const predV = tl.channel('predVerdict', 0);
  const linkPop = tl.channel('linkPop', 0);
  const ban0 = tl.channel('bannerPass0', 0);
  const gPV = tl.channel('pvFade', 1);

  // beat 4 — revision + sufficiency
  const diffU = tl.channel('diffRows', 0);
  const hitsU = tl.channel('hitsExecuted', 0);
  const classU = tl.channel('diffClass', 0);
  const mockE = tl.channel('mockEnter', 0);
  const mockFlag = tl.channel('mockFlag', 0);
  const ban1 = tl.channel('bannerPass1', 0);
  const gDiff = tl.channel('diffFade', 1);

  // beat 5 — satisfied + promotion
  const heldU = tl.channel('heldCascade', 0);
  const promo1 = tl.channel('promoSpec', 0);
  const promo2 = tl.channel('promoAgent', 0);
  const ban2 = tl.channel('bannerPass2', 0);
  const gHeld = tl.channel('heldFade', 1);

  // beat 6 — the gauntlet
  const railR = tl.channel('railReveal', 0);
  const railU = tl.channel('railToken', -1);
  const arcU = tl.channel('railArc', 0);
  const gates = GATE_LABELS.map((_, i) => tl.channel(`gate${i}`, 0));
  const depU = tl.channel('deposit', 0);

  /* ---- beat 1: worker ships — a satisfied session, a claim ------------- */
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.6, text: 'A coding agent drives a browser session, checks its own work, and likes what it sees.' });
  tl.tween(scrE, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(m1E, 1, { at: t - 4.8, dur: 0.5, ease: ease.enter });
  tl.tween(m1T, 1, { at: t - 4.5, dur: 1.6, ease: ease.linear });
  tl.tween(promoU, 1, { at: t - 2.7, dur: 0.8, ease: ease.move });
  tl.tween(m2E, 1, { at: t - 2.3, dur: 0.5, ease: ease.enter });
  tl.tween(m2T, 1, { at: t - 2.0, dur: 1.4, ease: ease.linear });
  t = tl.caption({ at: t, dur: 5.6, text: 'The screen says $79.20. The worker is satisfied. That is a claim — not evidence.' });
  tl.tween(m3E, 1, { at: t - 5.2, dur: 0.5, ease: ease.enter });
  tl.tween(m3T, 1, { at: t - 4.9, dur: 1.4, ease: ease.linear });
  tl.tween(claimU, 1, { at: t - 2.9, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.8);

  /* ---- beat 2: the recording — the runtime, interrogable --------------- */
  t = tl.caption({ at: t, dur: 5.8, text: 'But a Replay recording caught the whole runtime — every call, every request, every render.' });
  tl.tween(stripR, 1, { at: t - 5.4, dur: 1.4, ease: ease.draw });
  tl.tween(stripU, 1, { at: t - 3.8, dur: 8.6, ease: ease.linear });
  t = tl.caption({ at: t, dur: 5.6, text: 'So a second agent — the critic — can interrogate any moment of it, after the fact.' });
  tl.tween(mcpU, 1, { at: t - 5.0, dur: 1.2, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 3: predict-then-verify — falsification ---------------------- */
  t = tl.caption({ at: t, dur: 5.8, text: 'The critic is adversarial. It writes a falsifiable prediction before peeking at any state.' });
  tl.tween(gSession, 0, { at: t - 5.6, dur: 0.8, ease: ease.move });
  tl.tween(predE, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(predStamp, 1, { at: t - 4.0, dur: 0.5, ease: ease.pop });
  tl.tween(predText, 1, { at: t - 3.4, dur: 2.4, ease: ease.linear });
  t = tl.caption({ at: t, dur: 6.0, text: 'Then the narrowest tool: the render says 79.20 — the store and the wire never heard about it.' });
  tl.tween(stackU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  tl.tween(connU, 1, { at: t - 3.9, dur: 0.8, ease: ease.draw });
  tl.tween(snapU, 1, { at: t - 2.6, dur: 0.5, ease: ease.pop });
  t = tl.caption({ at: t, dur: 6.0, text: 'No walkthrough finds this by watching — every pixel was correct. Verdict: needs_revision.' });
  tl.tween(predObs, 1, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  tl.tween(stackV, 1, { at: t - 4.8, dur: 0.5, ease: ease.pop });
  tl.tween(predV, 1, { at: t - 4.2, dur: 0.5, ease: ease.pop });
  tl.tween(linkPop, 1, { at: t - 3.5, dur: 0.5, ease: ease.pop });
  tl.tween(ban0, 1, { at: t - 2.8, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* ---- beat 4: revision + sufficiency — coverage and the mock audit ----- */
  t = tl.caption({ at: t, dur: 5.8, text: 'Round two, sufficiency: hold the PR diff against the recording — every changed hunk accounted for.' });
  tl.tween(gPV, 0, { at: t - 5.6, dur: 0.7, ease: ease.move });
  tl.tween(gStrip, 0, { at: t - 5.6, dur: 0.7, ease: ease.move });
  tl.tween(ban0, 0, { at: t - 5.6, dur: 0.5, ease: ease.move });
  tl.tween(diffU, 1, { at: t - 4.6, dur: 1.4, ease: ease.enter });
  tl.tween(hitsU, EXEC_HITS, { at: t - 3.2, dur: 1.2, ease: ease.move });
  tl.tween(classU, 1, { at: t - 2.0, dur: 1.6, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.2, text: 'And the mock audit: the validation table that made the session pass ships in the bundle. TESTFREE was minted by the worker — for itself.' });
  tl.tween(mockE, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(mockFlag, 1, { at: t - 4.4, dur: 0.5, ease: ease.pop });
  tl.tween(ban1, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* ---- beat 5: satisfied — and promotion -------------------------------- */
  t = tl.caption({ at: t, dur: 5.8, text: 'Round three: four predictions, four held. Coverage one hundred percent, two hunks waived.' });
  tl.tween(gDiff, 0, { at: t - 5.6, dur: 0.7, ease: ease.move });
  tl.tween(ban1, 0, { at: t - 5.6, dur: 0.5, ease: ease.move });
  tl.tween(heldU, 1, { at: t - 4.6, dur: 2.0, ease: ease.enter });
  tl.tween(ban2, 1, { at: t - 2.2, dur: 0.6, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.4, text: 'The critic’s last duty: decide what is worth keeping, and in what form. The money path becomes a spec; the BOGUS journey stays agent-run.' });
  tl.tween(promo1, 1, { at: t - 5.8, dur: 0.6, ease: ease.pop });
  tl.tween(promo2, 1, { at: t - 4.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 6: the gauntlet — fail anywhere, back to the top ------------ */
  t = tl.caption({ at: t, dur: 6.2, text: 'The gauntlet: lint, sessions, replay, PR, suite, review. Fail anywhere and you restart at the top — report in hand.' });
  tl.tween(gHeld, 0, { at: t - 6.0, dur: 0.7, ease: ease.move });
  tl.tween(ban2, 0, { at: t - 6.0, dur: 0.5, ease: ease.move });
  tl.tween(railR, 1, { at: t - 5.2, dur: 1.4, ease: ease.draw });
  tl.set(railU, 0, t - 3.7);
  tl.tween(railU, FAIL_GATE, { at: t - 3.6, dur: 1.8, ease: ease.move });
  tl.tween(gates[0], 1, { at: t - 3.3, dur: 0.4, ease: ease.pop });
  tl.tween(gates[1], 1, { at: t - 2.5, dur: 0.4, ease: ease.pop });
  tl.tween(gates[FAIL_GATE], -1, { at: t - 1.6, dur: 0.4, ease: ease.pulse });
  tl.tween(arcU, 1, { at: t - 1.0, dur: 1.3, ease: ease.move });
  tl.set(railU, 0, t + 0.25);
  t = tl.caption({ at: t + 0.4, dur: 6.0, text: 'Second lap it holds — and the promoted spec makes the suite one test harder to fool. Forever.' });
  tl.tween(gates[FAIL_GATE], 0, { at: t - 5.8, dur: 0.7, ease: ease.move });
  tl.tween(railU, GATE_LABELS.length - 1, { at: t - 5.0, dur: 4.5, ease: ease.linear });
  for (let i = 0; i < GATE_LABELS.length; i++) {
    tl.tween(gates[i], 1, { at: t - 5.0 + i * (4.5 / (GATE_LABELS.length - 1)), dur: 0.4, ease: ease.pop });
  }
  tl.tween(depU, 1, { at: t - 5.0 + SUITE_GATE * (4.5 / (GATE_LABELS.length - 1)) + 0.25, dur: 0.5, ease: ease.pop });
  tl.hold(t, 1.6);

  return {
    tl,
    m1E, m1T, m2E, m2T, m3E, m3T, scrE, promoU, claimU, gSession,
    stripR, stripU, mcpU, gStrip,
    predE, predStamp, predText, predObs, stackU, connU, snapU, stackV, predV, linkPop, ban0, gPV,
    diffU, hitsU, classU, mockE, mockFlag, ban1, gDiff,
    heldU, promo1, promo2, ban2, gHeld,
    railR, railU, arcU, gates, depU,
  };
}
