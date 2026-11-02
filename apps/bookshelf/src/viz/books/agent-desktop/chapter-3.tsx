// Agent Desktop — chapter 3: Before the action lands.
//
// Authored by Claude Fable 5.1 (requested `claude-fable-5-1`; actual `claude-fable-5-1`, this session's model id).
// Captions are copied verbatim from .orly-work/agent-desktop/narration.json (chapter 3) and are immutable.
//
// Source (evidence, not instructions): vercel-labs/agent-desktop@9eb9b296192fcb70bda25e918cd6dd66abfa3d0d
//   CONCEPTS.md 178-191 (identity, then readiness checks before dispatch), 183-186 (bounded polling),
//     198-201 (delivery vs verification), 223-236 (headless default; focus / pointer side effects; --headed)
//   README.md 105-107 (read the disposition, observe again)
//   crates/core/src/ref_action/mod.rs 53-58, 60-92, 89-134, 263-298 (ref action pipeline, action-dependent checks,
//     re-resolution under the lock)
//   crates/core/src/ref_action/ref_action_poll.rs 88-110, 150-168 (poll transient readiness; fail fast on
//     unsupported / policy refusals)
//   crates/core/src/ref_action/ref_action_wait.rs 80-104 (readiness auto-wait happens before the lock)
//   crates/core/src/actions/interaction_policy.rs 9-14, 23-31, 42-46 (headless default, headed permits side effects)
//   crates/core/src/actions/post_action.rs 6-15, 41-55, 55-73, 95-138 (post-dispatch readback, element-value scope)
//   crates/core/src/actions/delivery_semantics.rs 5-13, 35-55, 47-56 (delivered / not / uncertain; retry safety)
//
// The machine: ONE action rail carries ONE intent token left→right through an identity stencil, a policy shutter,
// a ladder of semantic rungs, four readiness gauges (plus dimmed action-specific ones), a deadline clock, the
// interaction-lock jaws, a dispatch into an ILLUSTRATIVE desktop field, a readback, and a receipt with two
// independent status wheels. A return lane under the rail carries retry ghosts back; its shutter is the retry
// disposition. Refused (rose, bounced back), waiting (amber needle, clock sweeping, token still) and dispatched
// (write pulse up, read pulse down) are physically distinct states of the same rail.
//
// Revision (GPT-6 Astra visual review, .orly-work/agent-desktop/visual-review-1-3.json, chapter-3 items):
//   entry controls (identity / policy / tabs / silhouettes) retire BEFORE the camera leaves them and return only when
//   the whole stage is framed; the illustrative desktop is wider and sits lower (title clear of its dots); the lock
//   title, write arrow and read arrow own three separate lanes; re-resolution is held inside the lease (a "lock held"
//   marker under the jaws) from after the auto-wait until dispatch; the receipt sits above the caption band; the retry
//   card lists safe / unsafe / unknown; the rail is fully hidden once the recap loop takes over.
//
// Every frame is a pure function of the sampled timeline. No clocks, no randomness, no transitions.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  ACCENT,
  ACCENT_LIGHT,
  AgentLoop,
  CAPTION_AT,
  CAPTION_DUR,
  CHAPTER_END,
  Chip,
  ClockArc,
  INK,
  LOOP_ACT_U,
  Label,
  MONO,
  OpaqueStrip,
  PLATE,
  PLATE_LINE,
  RefusalBadge,
  Shutter,
  WindowFrame,
  clamp01,
  lerp,
  loopPoint,
  seg,
} from './kit';

// ---------------------------------------------------------------------------
// Geometry (stage 1280×720; everything load-bearing stays above y = 612)
// ---------------------------------------------------------------------------

const RAIL_Y = 400;
const RAIL_X0 = 90;
const RAIL_X1 = 1190;

const TOKEN_R = 11;
const TOKEN_START_X = 110;
const STENCIL_X = 170; // identity stencil: the rail entry
const POLICY_X = 270; // policy shutter
const TAB_Y = 250; // headless / --headed policy tab

const RUNG_X0 = 300; // semantic rungs
const RUNG_STEP = 24;
const RUNG_N = 8;
const GAP_I = 4; // the missing rung (headless refusal)
const GAP_X = RUNG_X0 + GAP_I * RUNG_STEP; // 396
const TOKEN_GAP_STOP = GAP_X - 16;
const TOKEN_BEFORE_GAUGES = 500;

const FOCUS_C = { x: 385, y: 290 };
const POINTER_C = { x: 385, y: 480 };

const GAUGES = [
  { x: 540, name: 'visible', above: true },
  { x: 610, name: 'enabled', above: false },
  { x: 680, name: 'supported', above: true },
  { x: 750, name: 'policy', above: false },
];
const GAUGE_R = 30;
const OPTIONAL = [{ x: 548 }, { x: 742 }]; // clear of the enabled / policy labels (y 462) above them
const OPTIONAL_Y = 492;
const OPTIONAL_LABEL_Y = 522; // beat-3 camera (y 380, k 1.35) puts the caption band at stage y ≈ 550

const CLOCK = { x: 645, y: 232, r: 38 };
const BRACKET = { x0: 512, x1: 780, y: 176 };

const LOCK_X0 = 800;
const LOCK_X1 = 940;
const LOCK_CX = (LOCK_X0 + LOCK_X1) / 2;
const LOCK_TITLE_Y = 334; // lane 2: above the upper jaw (top 348)
const ARROW_LABEL_Y = 292; // lane 1: between the desktop (bottom 260) and the lock title
const LEASE_Y = 476; // lane under the lower jaw (bottom 452): the "lock held" marker
const RERESOLVE_X = 830;
const DISPATCH_X = 880;
const READ_X = 960;

const WIN = { x: 770, y: 130, w: 340, h: 130 }; // wide enough that the title clears the traffic-light dots
const FIELD = { x: WIN.x + 20, y: WIN.y + 72, w: 300, h: 44 }; // stage coords of the illustrative field
const FIELD_BOTTOM = FIELD.y + FIELD.h; // 246
const FIELD_VALUE = 'docs/plan.md';

const RECEIPT = { x: 770, y: 462, w: 440, h: 130 }; // bottom 592: above the caption band at the beat-6/7 cameras
const WHEEL_DEL = { x: 985, y: RECEIPT.y + 76 };
const WHEEL_VER = { x: 1120, y: RECEIPT.y + 76 };
const WHEEL_R = 26;

// return lane: receipt left edge → retry shutter → stencil column → up to the rail
const LANE_Y = 560;
const LANE_X_END = STENCIL_X;
const RETRY_X = 330;
const LANE_H1 = RECEIPT.x - RETRY_X; // 440: receipt → shutter
const LANE_H2 = RETRY_X - LANE_X_END; // 160: shutter → column
const LANE_V = LANE_Y - (RAIL_Y + 14); // 146: column up to the rail
const LANE_LEN = LANE_H1 + LANE_H2 + LANE_V;

/** position along the return lane by arc length `p` (0 at the receipt, LANE_LEN at the rail) */
const lanePoint = (p: number): { x: number; y: number } => {
  if (p <= LANE_H1) return { x: RECEIPT.x - p, y: LANE_Y };
  if (p <= LANE_H1 + LANE_H2) return { x: RETRY_X - (p - LANE_H1), y: LANE_Y };
  return { x: LANE_X_END, y: LANE_Y - (p - LANE_H1 - LANE_H2) };
};

const LOOP = { cx: 640, cy: 300, r: 150 };

// wheel sectors: 3 × 120° for delivery, 2 × 180° for verification (angles in degrees, 0 = up, clockwise)
const DEL_SECTORS = [
  { name: 'not_delivered', center: 0, color: colors.MUTED },
  { name: 'delivered', center: 120, color: ACCENT_LIGHT },
  { name: 'uncertain', center: 240, color: colors.WARM },
];
const VER_SECTORS = [
  { name: 'verified', center: 0, color: colors.POSITIVE },
  { name: 'unverified', center: 180, color: colors.MUTED },
];
const ANG = { notDelivered: 0, delivered: 120, uncertain: 240, verified: 0, unverified: 180 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // rail + entry
  const railU = tl.channel('railU', 0);
  const stencilU = tl.channel('stencilU', 0);
  const latchU = tl.channel('latchU', 0);
  const tokX = tl.channel('tokX', TOKEN_START_X);
  const tokChipU = tl.channel('tokChipU', 0);
  const labelsU = tl.channel('labelsU', 0);
  // the entry controls (identity stencil + label, policy shutter + label, tabs, silhouettes, lane label) are only
  // shown while the camera frames them whole — retired BEFORE each camera move that would clip them
  const entryU = tl.channel('entryU', 1);

  // policy
  const policyOpen = tl.channel('policyOpen', 0);
  const policyRefused = tl.channel('policyRefused', 0);
  const tabU = tl.channel('tabU', 0);
  const headedU = tl.channel('headedU', 0);
  const semU = tl.channel('semU', 0);
  const gapU = tl.channel('gapU', 0);
  const silU = tl.channel('silU', 0);
  const barU = tl.channel('barU', 1);
  const allowedU = tl.channel('allowedU', 0);
  const mechU = tl.channel('mechU', 0);
  const semRefuseU = tl.channel('semRefuseU', 0);

  // readiness
  const gaugeU = tl.channel('gaugeU', 0);
  const gVisible = tl.channel('gVisible', 0);
  const gEnabled = tl.channel('gEnabled', 0);
  const gSupported = tl.channel('gSupported', 0);
  const gPolicy = tl.channel('gPolicy', 0);
  const enabledWait = tl.channel('enabledWait', 0);
  const optU = tl.channel('optU', 0);
  const clockU = tl.channel('clockU', 0);
  const clockSweep = tl.channel('clockSweep', 0);
  const refTokU = tl.channel('refTokU', 0);
  const refTokX = tl.channel('refTokX', POLICY_X - 24);
  const refBadgeU = tl.channel('refBadgeU', 0);
  const bracketU = tl.channel('bracketU', 0);

  // lock + dispatch
  const lockU = tl.channel('lockU', 0);
  const leaseU = tl.channel('leaseU', 0); // "lock held" marker: re-resolve, dispatch and readback all happen inside it
  const reResolveU = tl.channel('reResolveU', 0);
  const winU = tl.channel('winU', 0);
  const valueU = tl.channel('valueU', 0);
  const writeU = tl.channel('writeU', 0);
  const readU = tl.channel('readU', 0);

  // receipt
  const receiptU = tl.channel('receiptU', 0);
  const kvU = tl.channel('kvU', 0);
  const wheelU = tl.channel('wheelU', 0);
  const delA = tl.channel('delA', ANG.notDelivered);
  const verA = tl.channel('verA', ANG.unverified);
  const chipDU = tl.channel('chipDU', 0); // delivered_unverified
  const chipUN = tl.channel('chipUN', 0); // delivery_uncertain
  const chipND = tl.channel('chipND', 0); // not_delivered

  // retry lane
  const laneU = tl.channel('laneU', 0);
  const retryOpen = tl.channel('retryOpen', 0);
  const retryState = tl.channel('retryState', 0); // 0 unknown · 1 safe · -1 unsafe (label selection)
  const ghost1P = tl.channel('ghost1P', 0);
  const ghost1U = tl.channel('ghost1U', 0);
  const ghost2P = tl.channel('ghost2P', 0);
  const ghost2U = tl.channel('ghost2U', 0);

  // finale
  const dim = tl.channel('dim', 0);
  const loopU = tl.channel('loopU', 0);
  const flowU = tl.channel('flowU', 0);
  const ringU = tl.channel('ringU', -1);
  const obsU = tl.channel('obsU', 0);
  const stripU = tl.channel('stripU', 0);

  const cap = (i: number, text: string) => tl.caption({ at: CAPTION_AT(i), dur: CAPTION_DUR, text });

  // ---- BEAT 0 (0.6) — identity is only the first test -------------------------------------------------------
  cap(0, 'Finding the right element is only the first test. The tool must also decide whether this action is allowed and whether the target is ready.');
  tl.tween(railU, 1, { at: 0.4, dur: 1.4, ease: ease.draw });
  tl.tween(stencilU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(gaugeU, 1, { at: 1.2, dur: 1.0, ease: ease.enter });
  tl.tween(labelsU, 1, { at: 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 460, y: 380, k: 1.25 }, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(tokChipU, 1, { at: 1.6, dur: 0.5, ease: ease.enter });
  tl.tween(tokX, STENCIL_X, { at: 1.6, dur: 1.0, ease: ease.move }); // the token fits the identity cutout
  tl.tween(latchU, 1, { at: 2.6, dur: 0.4, ease: ease.pop });
  tl.tween(tokX, POLICY_X - 24, { at: 3.4, dur: 1.0, ease: ease.move }); // …and pauses before the closed shutter
  tl.hold(8.6, 0);

  // ---- BEAT 1 (9.2) — headless by default ----------------------------------------------------------------------
  cap(1, 'By default, ref actions use headless accessibility operations. They do not steal focus or move the pointer, and refuse when the semantic path is unavailable.');
  tl.tween(cam, { x: 400, y: 380, k: 1.35 }, { at: 9.6, dur: 1.4, ease: ease.move });
  tl.tween(tabU, 1, { at: 9.4, dur: 0.6, ease: ease.enter });
  tl.tween(policyOpen, 1, { at: 10.0, dur: 0.8, ease: ease.move }); // the headless shutter exposes the semantic lane
  tl.tween(semU, 1, { at: 10.4, dur: 1.2, ease: ease.draw });
  tl.tween(silU, 1, { at: 10.6, dur: 0.6, ease: ease.enter }); // focus / pointer silhouettes: motionless, barred
  tl.tween(tokX, TOKEN_GAP_STOP, { at: 11.8, dur: 1.6, ease: ease.move }); // …until the missing rung
  tl.tween(tokX, TOKEN_GAP_STOP - 12, { at: 13.4, dur: 0.5, ease: ease.pop }); // bounce: refused
  tl.tween(semRefuseU, 1, { at: 13.4, dur: 0.5, ease: ease.pop });
  tl.hold(17.2, 0);

  // ---- BEAT 2 (17.8) — --headed permits, does not guarantee --------------------------------------------------
  cap(2, 'Headed mode explicitly permits focus and cursor side effects. It does not guarantee every action works; the platform still chooses its supported mechanism.');
  tl.tween(semRefuseU, 0, { at: 17.8, dur: 0.6, ease: ease.enter });
  tl.tween(cam, { x: 480, y: 370, k: 1.3 }, { at: 18.0, dur: 1.2, ease: ease.move });
  tl.tween(headedU, 1, { at: 18.2, dur: 0.6, ease: ease.move }); // the tab toggles to --headed
  tl.tween(barU, 0, { at: 18.8, dur: 0.7, ease: ease.move }); // bars retract: allowed…
  tl.tween(allowedU, 1, { at: 19.6, dur: 0.6, ease: ease.enter }); // …not taken: silhouettes never move
  tl.tween(gapU, 1, { at: 20.4, dur: 0.6, ease: ease.enter }); // this action has a supported mechanism
  tl.tween(mechU, 1, { at: 20.6, dur: 0.6, ease: ease.enter });
  tl.tween(tokX, TOKEN_BEFORE_GAUGES, { at: 21.4, dur: 1.4, ease: ease.move });
  tl.tween(tokChipU, 0, { at: 25.6, dur: 0.5, ease: ease.enter });
  tl.tween(allowedU, 0, { at: 25.8, dur: 0.5, ease: ease.enter });
  tl.tween(mechU, 0, { at: 25.8, dur: 0.5, ease: ease.enter });
  // retire the entry controls BEFORE the camera leaves them (they would be clipped at the left edge otherwise)
  tl.tween(tabU, 0, { at: 25.6, dur: 0.6, ease: ease.enter }); // tabs and silhouettes are done for good
  tl.tween(silU, 0, { at: 25.6, dur: 0.6, ease: ease.enter });
  tl.tween(entryU, 0, { at: 25.8, dur: 0.6, ease: ease.enter });
  tl.hold(26.4, 0);

  // ---- BEAT 3 (26.4) — live readiness checks -------------------------------------------------------------------
  cap(3, 'Before dispatch, live checks examine readiness, including visibility, enabled state, supported action, and policy. The checks depend on the requested operation.');
  tl.tween(cam, { x: 650, y: 380, k: 1.35 }, { at: 26.4, dur: 1.4, ease: ease.move });
  tl.tween(gVisible, 1, { at: 27.6, dur: 0.8, ease: ease.move });
  tl.tween(enabledWait, 1, { at: 28.4, dur: 0.4, ease: ease.enter }); // enabled: not yet — pending, not failing
  tl.tween(gSupported, 1, { at: 29.2, dur: 0.8, ease: ease.move });
  tl.tween(gPolicy, 1, { at: 30.0, dur: 0.8, ease: ease.move });
  tl.tween(optU, 1, { at: 30.8, dur: 0.8, ease: ease.enter }); // dimmed, action-specific extras
  tl.hold(34.4, 0);

  // ---- BEAT 4 (35.0) — bounded polling; refusals fail fast ------------------------------------------------------
  cap(4, 'Temporary readiness problems can be polled within a deadline. Unsupported actions and policy refusals fail promptly instead of waiting for permission to change.');
  tl.tween(cam, { x: 560, y: 360, k: 1.15 }, { at: 35.0, dur: 1.4, ease: ease.move }); // whole entry back in frame…
  tl.tween(entryU, 1, { at: 35.6, dur: 0.8, ease: ease.enter }); // …so the refusal has a visible entry to leave by
  tl.tween(clockU, 1, { at: 35.2, dur: 0.6, ease: ease.enter });
  tl.tween(clockSweep, 0.62, { at: 36.0, dur: 4.0, ease: ease.linear }); // the deadline sweep
  tl.tween(gEnabled, 0.5, { at: 36.4, dur: 0.5, ease: ease.move }); // the enabled gauge flickers…
  tl.tween(gEnabled, 0.1, { at: 37.0, dur: 0.5, ease: ease.move });
  tl.tween(gEnabled, 0.6, { at: 37.6, dur: 0.5, ease: ease.move });
  tl.tween(gEnabled, 0.2, { at: 38.2, dur: 0.5, ease: ease.move });
  tl.tween(gEnabled, 1, { at: 38.9, dur: 0.6, ease: ease.move }); // …then settles
  tl.tween(enabledWait, 0, { at: 39.3, dur: 0.4, ease: ease.enter });
  // a SEPARATE policy-refusal token: it never waits — straight back out
  tl.tween(refTokU, 1, { at: 37.0, dur: 0.3, ease: ease.enter });
  tl.tween(policyRefused, 1, { at: 37.3, dur: 0.2, ease: ease.enter });
  tl.tween(refTokX, TOKEN_START_X, { at: 37.5, dur: 0.9, ease: ease.move });
  tl.tween(refBadgeU, 1, { at: 37.5, dur: 0.4, ease: ease.pop });
  tl.tween(policyRefused, 0, { at: 38.6, dur: 0.4, ease: ease.enter });
  tl.tween(refTokU, 0, { at: 38.4, dur: 0.5, ease: ease.enter });
  tl.tween(refBadgeU, 0, { at: 41.6, dur: 0.6, ease: ease.enter });
  // retire the entry controls and the action-specific extras BEFORE the camera moves right
  tl.tween(entryU, 0, { at: 42.6, dur: 0.6, ease: ease.enter });
  tl.tween(optU, 0, { at: 42.8, dur: 0.6, ease: ease.enter });
  tl.hold(43.2, 0);

  // ---- BEAT 5 (43.6) — auto-wait before the lock; re-resolve under it --------------------------------------
  cap(5, 'Readiness auto-wait happens before the interaction lock is taken. Once the lock is held, the target is resolved again, because the desktop could have changed while waiting.');
  tl.tween(cam, { x: 760, y: 350, k: 1.2 }, { at: 43.6, dur: 1.4, ease: ease.move });
  tl.tween(bracketU, 1, { at: 44.0, dur: 0.8, ease: ease.draw }); // "readiness auto-wait" spans the gauges only
  tl.tween(lockU, 1, { at: 45.4, dur: 1.0, ease: ease.move }); // jaws close: the interaction lock
  tl.tween(leaseU, 1, { at: 45.8, dur: 0.8, ease: ease.draw }); // "lock held" marker under the jaws: the lease begins
  tl.tween(tokX, RERESOLVE_X, { at: 46.4, dur: 1.2, ease: ease.move }); // through the green gauges, into the lease
  tl.tween(reResolveU, 1, { at: 47.6, dur: 0.6, ease: ease.pop }); // resolve again, under the lock — held to dispatch
  tl.tween(clockU, 0, { at: 51.4, dur: 0.6, ease: ease.enter });
  tl.tween(bracketU, 0, { at: 51.6, dur: 0.6, ease: ease.enter });
  tl.hold(51.6, 0);

  // ---- BEAT 6 (52.2) — dispatch, then read back --------------------------------------------------------------
  cap(6, 'For stateful actions, the tool reads back the element after dispatch. Confirming a field value still does not prove that the application saved the whole workflow.');
  tl.tween(cam, { x: 790, y: 410, k: 1.2 }, { at: 52.2, dur: 1.4, ease: ease.move }); // desktop top and receipt bottom both in frame
  tl.tween(winU, 1, { at: 52.4, dur: 0.9, ease: ease.draw });
  tl.tween(reResolveU, 0, { at: 53.0, dur: 0.5, ease: ease.enter }); // re-resolution ends only as dispatch begins
  tl.tween(tokX, DISPATCH_X, { at: 53.4, dur: 0.8, ease: ease.move });
  tl.tween(writeU, 1, { at: 54.4, dur: 0.9, ease: ease.linear }); // ONE write pulse goes up into the field
  tl.tween(valueU, 1, { at: 55.3, dur: 0.7, ease: ease.linear });
  tl.tween(readU, 1, { at: 56.2, dur: 0.9, ease: ease.linear }); // a DISTINCT read pulse comes back (still under the lease)
  tl.tween(leaseU, 0, { at: 57.0, dur: 0.5, ease: ease.enter }); // the receipt takes the lease's lane
  tl.tween(receiptU, 1, { at: 57.2, dur: 0.8, ease: ease.enter });
  tl.tween(kvU, 1, { at: 57.8, dur: 0.9, ease: ease.enter });
  tl.hold(60.2, 0);

  // ---- BEAT 7 (60.8) — delivery and verification are separate wheels ----------------------------------------
  cap(7, 'Delivery and verification are separate. Input may be delivered without a confirmed effect, or the tool may be unable to tell whether it landed.');
  tl.tween(cam, { x: 780, y: 410, k: 1.2 }, { at: 60.8, dur: 1.4, ease: ease.move });
  tl.tween(kvU, 0, { at: 60.8, dur: 0.6, ease: ease.enter });
  tl.tween(wheelU, 1, { at: 61.2, dur: 0.8, ease: ease.pop });
  tl.tween(delA, ANG.delivered, { at: 62.2, dur: 0.8, ease: ease.move });
  tl.tween(chipDU, 1, { at: 63.4, dur: 0.5, ease: ease.enter }); // delivered_unverified
  tl.tween(chipDU, 0, { at: 65.8, dur: 0.4, ease: ease.enter });
  tl.tween(delA, ANG.uncertain, { at: 65.4, dur: 0.8, ease: ease.move });
  tl.tween(chipUN, 1, { at: 66.3, dur: 0.5, ease: ease.enter }); // delivery_uncertain — a different receipt
  tl.hold(68.8, 0);

  // ---- BEAT 8 (69.4) — the retry disposition -----------------------------------------------------------------
  cap(8, 'A refusal known to deliver nothing is safe to retry. If input may have landed, repeating it risks a duplicate, so the retry disposition is unsafe.');
  tl.tween(cam, { x: 640, y: 380, k: 1.0 }, { at: 69.4, dur: 1.4, ease: ease.move }); // the whole stage is framed…
  tl.tween(entryU, 1, { at: 69.8, dur: 0.8, ease: ease.enter }); // …so the entry returns for the retry ghosts
  tl.tween(laneU, 1, { at: 69.6, dur: 1.0, ease: ease.draw });
  tl.tween(chipUN, 0, { at: 69.6, dur: 0.4, ease: ease.enter });
  tl.tween(delA, ANG.notDelivered, { at: 69.8, dur: 0.8, ease: ease.move }); // case A: nothing was delivered
  tl.tween(chipND, 1, { at: 70.6, dur: 0.4, ease: ease.enter });
  tl.tween(retryOpen, 1, { at: 70.8, dur: 0.6, ease: ease.move }); // the safe return lane opens
  tl.set(retryState, 1, 70.8);
  tl.tween(ghost1U, 0.7, { at: 71.2, dur: 0.3, ease: ease.enter });
  tl.tween(ghost1P, LANE_LEN, { at: 71.4, dur: 1.9, ease: ease.linear }); // a retry ghost rides back to the entry
  tl.tween(ghost1U, 0, { at: 73.3, dur: 0.4, ease: ease.enter });
  tl.tween(chipND, 0, { at: 73.8, dur: 0.3, ease: ease.enter });
  tl.tween(delA, ANG.uncertain, { at: 74.0, dur: 0.8, ease: ease.move }); // case B: input may have landed
  tl.tween(chipUN, 1, { at: 74.7, dur: 0.4, ease: ease.enter });
  tl.tween(retryOpen, 0, { at: 74.6, dur: 0.6, ease: ease.move }); // the shutter closes: unsafe
  tl.set(retryState, -1, 74.6);
  tl.tween(ghost2U, 0.7, { at: 75.0, dur: 0.3, ease: ease.enter });
  tl.tween(ghost2P, LANE_H1 - 14, { at: 75.2, dur: 1.2, ease: ease.linear }); // the duplicate hits the shutter…
  tl.tween(ghost2U, 0, { at: 76.4, dur: 0.5, ease: ease.enter }); // …and disappears before dispatch
  tl.hold(77.4, 0);

  // ---- BEAT 9 (78.0) — read the disposition, observe again --------------------------------------------------
  cap(9, 'The agent should read that disposition and observe the application again. An error message alone cannot tell it whether repeating the action is safe.');
  tl.tween(cam, CAMERA_HOME, { at: 78.0, dur: 1.4, ease: ease.move });
  tl.tween(dim, 1, { at: 78.2, dur: 1.2, ease: ease.move }); // the whole rail machine leaves: only the loop remains
  tl.tween(loopU, 1, { at: 78.6, dur: 1.4, ease: ease.draw });
  tl.tween(flowU, 1, { at: 79.6, dur: 1.2, ease: ease.move }); // the receipt flows out to the agent's act dock
  tl.set(ringU, LOOP_ACT_U, 80.8);
  tl.tween(ringU, 1.0, { at: 80.8, dur: 2.2, ease: ease.linear }); // around the agent's arc to observe
  tl.tween(obsU, 1, { at: 83.0, dur: 0.9, ease: ease.enter }); // a new observation enters
  tl.tween(stripU, 1, { at: 83.8, dur: 0.7, ease: ease.enter });
  tl.hold(CHAPTER_END, 0);

  return {
    tl,
    cam,
    railU,
    stencilU,
    latchU,
    tokX,
    tokChipU,
    labelsU,
    entryU,
    policyOpen,
    policyRefused,
    tabU,
    headedU,
    semU,
    gapU,
    silU,
    barU,
    allowedU,
    mechU,
    semRefuseU,
    gaugeU,
    gVisible,
    gEnabled,
    gSupported,
    gPolicy,
    enabledWait,
    optU,
    clockU,
    clockSweep,
    refTokU,
    refTokX,
    refBadgeU,
    bracketU,
    lockU,
    leaseU,
    reResolveU,
    winU,
    valueU,
    writeU,
    readU,
    receiptU,
    kvU,
    wheelU,
    delA,
    verA,
    chipDU,
    chipUN,
    chipND,
    laneU,
    retryOpen,
    retryState,
    ghost1P,
    ghost1U,
    ghost2P,
    ghost2U,
    dim,
    loopU,
    flowU,
    ringU,
    obsU,
    stripU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local drawing parts (pure functions of props)
// ---------------------------------------------------------------------------

const polar = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

/** SVG arc from angle a0 to a1 (radians, screen orientation, a1 > a0, span < 2π). */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

/** The identity stencil: a plate with a token-shaped cutout the token must fit. `lit` lights the cutout. */
function Stencil({ x, y, reveal, lit, size = 1 }: { x: number; y: number; reveal: number; lit: number; size?: number }) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const h = 100 * size;
  const w = 28 * size;
  const r = 15 * size;
  const grow = h * rv;
  return (
    <g opacity={rv}>
      <path
        d={`M ${x - w / 2} ${y - grow / 2} h ${w} v ${grow} h ${-w} Z M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`}
        fill="#111a2c"
        fillRule="evenodd"
        stroke={PLATE_LINE}
        strokeWidth={1.5}
      />
      <circle cx={x} cy={y} r={r} fill="none" stroke={lit > 0 ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={2 + 1.5 * clamp01(lit)} opacity={0.5 + 0.5 * clamp01(lit)} />
    </g>
  );
}

/** A readiness gauge: upper half-dial with fail / unknown / ok zones; `v` ∈ [-1, 1] swings the needle. */
function Gauge({
  x,
  y,
  r,
  v,
  reveal,
  waiting = 0,
  dimmed = false,
}: {
  x: number;
  y: number;
  r: number;
  v: number;
  reveal: number;
  waiting?: number;
  dimmed?: boolean;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const vv = Math.max(-1, Math.min(1, v));
  const theta = Math.PI + ((vv + 1) / 2) * Math.PI; // π (fail) … 3π/2 (unknown) … 2π (ok)
  const tip = polar(x, y, r - 6, theta);
  const needle = vv > 0.33 ? colors.POSITIVE : vv < -0.33 ? colors.NEGATIVE : waiting > 0.5 ? colors.WARM : colors.MUTED;
  const zone = (a0: number, a1: number, c: string, o: number) => (
    <path d={arcPath(x, y, r, a0, a1)} fill="none" stroke={c} strokeWidth={6} opacity={o} />
  );
  return (
    <g opacity={rv * (dimmed ? 0.4 : 1)}>
      <path d={`${arcPath(x, y, r + 4, Math.PI, 2 * Math.PI)} L ${x + r + 4} ${y + 6} L ${x - r - 4} ${y + 6} Z`} fill={PLATE} stroke={PLATE_LINE} strokeWidth={1.5} />
      {zone(Math.PI + 0.04, Math.PI + Math.PI / 3, colors.NEGATIVE, 0.35)}
      {zone(Math.PI + Math.PI / 3, Math.PI + (2 * Math.PI) / 3, colors.MUTED, 0.3)}
      {zone(Math.PI + (2 * Math.PI) / 3, 2 * Math.PI - 0.04, colors.POSITIVE, 0.4)}
      <line x1={x} y1={y} x2={tip.x} y2={tip.y} stroke={needle} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={y} r={4} fill={needle} />
      {waiting > 0 && <circle cx={x} cy={y} r={r + 9} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 8" opacity={0.6 * clamp01(waiting)} />}
    </g>
  );
}

/** A status wheel: sectors around a ring; the needle at `angleDeg` (0 = up, clockwise) selects one. */
function Wheel({
  x,
  y,
  r,
  angleDeg,
  sectors,
  reveal,
}: {
  x: number;
  y: number;
  r: number;
  angleDeg: number;
  sectors: { name: string; center: number; color: string }[];
  reveal: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const n = sectors.length;
  const span = 360 / n;
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const a = toRad(angleDeg);
  const tip = polar(x, y, r - 5, a);
  const pop = 0.85 + 0.15 * rv;
  return (
    <g transform={`translate(${x}, ${y}) scale(${pop}) translate(${-x}, ${-y})`} opacity={rv}>
      <circle cx={x} cy={y} r={r + 6} fill={PLATE} stroke={PLATE_LINE} strokeWidth={1.5} />
      {sectors.map((s) => {
        let d = Math.abs(((angleDeg - s.center) % 360 + 540) % 360 - 180);
        d = clamp01(1 - d / (span / 2));
        return (
          <path
            key={s.name}
            d={arcPath(x, y, r, toRad(s.center - span / 2 + 3), toRad(s.center + span / 2 - 3))}
            fill="none"
            stroke={s.color}
            strokeWidth={6}
            opacity={0.25 + 0.7 * d}
          />
        );
      })}
      <line x1={x} y1={y} x2={tip.x} y2={tip.y} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={y} r={4} fill={INK} />
    </g>
  );
}

/** Which sector a wheel currently selects (pure) — for the exact-code chip under it. */
function sectorOf<T extends { center: number }>(angleDeg: number, sectors: T[]): T {
  let best = sectors[0];
  let bestD = Infinity;
  for (const s of sectors) {
    const d = Math.abs(((angleDeg - s.center) % 360 + 540) % 360 - 180);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/** A traveling pulse along a straight segment; `u` 0..1. Draws a comet trail behind it. */
function Pulse({ x0, y0, x1, y1, u, color }: { x0: number; y0: number; x1: number; y1: number; u: number; color: string }) {
  if (u <= 0 || u >= 1) return null;
  const pts = [0, 0.05, 0.1, 0.15].map((b, i) => ({ x: lerp(x0, x1, clamp01(u - b)), y: lerp(y0, y1, clamp01(u - b)), r: 8 - i * 1.6 }));
  return (
    <g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} opacity={i === 0 ? 1 : 0.35 - i * 0.08} />
      ))}
    </g>
  );
}

/** A vertical lane arrow drawn from y0 toward y1 by `u` 0..1, with its head at the drawn end. */
function LaneArrow({ x, y0, y1, u, color }: { x: number; y0: number; y1: number; u: number; color: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const yEnd = lerp(y0, y1, uu);
  const dir = y1 > y0 ? 1 : -1; // +1 points down the stage, -1 points up
  return (
    <g opacity={0.3 + 0.7 * uu}>
      <line x1={x} y1={y0} x2={x} y2={yEnd} stroke={color} strokeWidth={2} strokeDasharray="4 5" />
      <path d={`M ${x} ${yEnd} l ${-6} ${-9 * dir} h 12 Z`} fill={color} />
    </g>
  );
}

const token = (x: number, y: number, color: string, opacity = 1, r = TOKEN_R) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r + 5} fill={color} opacity={0.18} />
    <circle cx={x} cy={y} r={r} fill={color} />
  </g>
);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const n = (c: ChannelRef<number>) => s.get(c);

  const railU = n(scene.railU);
  const labelsU = n(scene.labelsU) * n(scene.entryU);
  const entryU = n(scene.entryU);
  const leaseU = n(scene.leaseU);
  const writeU = n(scene.writeU);
  const readU = n(scene.readU);
  const tokX = n(scene.tokX);
  const headedU = n(scene.headedU);
  const barU = n(scene.barU);
  const semU = n(scene.semU);
  const gapU = n(scene.gapU);
  const silU = n(scene.silU);
  const gaugeU = n(scene.gaugeU);
  const enabledWait = n(scene.enabledWait);
  const lockU = n(scene.lockU);
  const winU = n(scene.winU);
  const receiptU = n(scene.receiptU);
  const kvU = n(scene.kvU);
  const wheelU = n(scene.wheelU);
  const delA = n(scene.delA);
  const verA = n(scene.verA);
  const laneU = n(scene.laneU);
  const retryOpen = n(scene.retryOpen);
  const retryState = n(scene.retryState);
  const dim = n(scene.dim);
  const loopU = n(scene.loopU);
  const flowU = n(scene.flowU);
  const ringU = n(scene.ringU);
  const obsU = n(scene.obsU);
  const stripU = n(scene.stripU);

  const railAlpha = 1 - clamp01(dim); // the rail machine is fully gone once the recap loop takes over
  const railLen = (RAIL_X1 - RAIL_X0) * clamp01(railU);
  const arrowsAlpha = 1 - seg(receiptU, 0.5, 1); // write / read lanes retire as the receipt arrives
  const gaugeValues = [n(scene.gVisible), n(scene.gEnabled), n(scene.gSupported), n(scene.gPolicy)];

  // ghosts on the return lane
  const g1 = lanePoint(n(scene.ghost1P));
  const g2 = lanePoint(n(scene.ghost2P));
  const g1U = n(scene.ghost1U);
  const g2U = n(scene.ghost2U);

  // finale: the receipt flows to the act dock, then rides the agent's loop
  const act = loopPoint(LOOP.cx, LOOP.cy, LOOP.r, LOOP_ACT_U);
  const obs = loopPoint(LOOP.cx, LOOP.cy, LOOP.r, 0);
  const flowP = { x: lerp(WHEEL_DEL.x, act.x, flowU), y: lerp(WHEEL_DEL.y, act.y, flowU) };

  const delSector = sectorOf(delA, DEL_SECTORS);
  const laneD = `M ${RECEIPT.x} ${LANE_Y} H ${LANE_X_END} V ${RAIL_Y + 14}`;
  const retryLabel = retryState > 0.5 ? 'retry: safe' : retryState < -0.5 ? 'retry: unsafe' : '';
  const retryColor = retryState > 0.5 ? colors.POSITIVE : retryState < -0.5 ? colors.NEGATIVE : colors.MUTED;

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ============================ the action rail (one persistent machine) ============================ */}
      {railAlpha > 0.001 && (
      <g opacity={railAlpha}>
        {/* rail bed */}
        <rect x={RAIL_X0} y={RAIL_Y - 7} width={railLen} height={14} rx={7} fill="#121a2d" stroke={PLATE_LINE} strokeWidth={1.5} />
        <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X0 + railLen} y2={RAIL_Y} stroke={ACCENT} strokeWidth={2} opacity={0.7} />
        {/* dim gauge-area labels until lit */}
        <Label x={STENCIL_X} y={326} text="identity" anchor="middle" opacity={labelsU} color={colors.MUTED} />
        <Label x={POLICY_X} y={212} text="policy" anchor="middle" opacity={labelsU} color={colors.MUTED} />
        <Label x={645} y={328} text="readiness" anchor="middle" opacity={n(scene.labelsU) * (1 - n(scene.bracketU)) * (1 - clamp01(gaugeValues[0]))} color={colors.MUTED} />

        {/* ---- identity stencil: the rail entry (retired whenever the camera would clip it) ---- */}
        <Stencil x={STENCIL_X} y={RAIL_Y} reveal={n(scene.stencilU) * entryU} lit={n(scene.latchU)} />

        {/* ---- policy shutter + tab ---- */}
        <Shutter x={POLICY_X} y={RAIL_Y} h={110} open={n(scene.policyOpen)} label="" reveal={seg(railU, 0.1, 0.5) * entryU} refused={n(scene.policyRefused)} />
        <g opacity={n(scene.tabU) * entryU}>
          <Chip x={190} y={TAB_Y} text="headless" size={18} color={headedU < 0.5 ? INK : colors.MUTED} fill={headedU < 0.5 ? ACCENT : PLATE} />
          <Chip x={315} y={TAB_Y} text="--headed" size={18} color={headedU > 0.5 ? INK : colors.MUTED} fill={headedU > 0.5 ? ACCENT : PLATE} />
          {/* the selector slides between the two tabs */}
          <rect x={lerp(190, 315, headedU)} y={TAB_Y + 14} width={111} height={3} rx={1.5} fill={ACCENT_LIGHT} />
        </g>

        {/* ---- semantic rungs (the headless lane) ---- */}
        <g opacity={semU}>
          {Array.from({ length: RUNG_N }, (_, i) => {
            const x = RUNG_X0 + i * RUNG_STEP;
            const u = seg(semU, i / RUNG_N, (i + 1) / RUNG_N);
            const present = i === GAP_I ? gapU : 1;
            return (
              <g key={i}>
                <line x1={x} y1={RAIL_Y - 14 * u} x2={x} y2={RAIL_Y + 14 * u} stroke={ACCENT_LIGHT} strokeWidth={3} strokeLinecap="round" opacity={0.3 + 0.7 * present} />
                {i === GAP_I && present < 0.5 && (
                  <line x1={x - 7} y1={RAIL_Y - 7} x2={x + 7} y2={RAIL_Y + 7} stroke={colors.NEGATIVE} strokeWidth={2} opacity={(1 - present * 2) * u} />
                )}
              </g>
            );
          })}
          <Label x={385} y={448} text="semantic lane" anchor="middle" color={ACCENT_LIGHT} opacity={seg(semU, 0.6, 1) * entryU} />
          <Chip x={GAP_X + 18} y={RAIL_Y + 34} text="mechanism: platform's choice" size={18} opacity={n(scene.mechU)} color={colors.WARM} />
        </g>

        {/* ---- focus & pointer silhouettes: never move; barred when headless, allowed when headed ---- */}
        <g opacity={silU * entryU}>
          {/* focus ring */}
          <rect x={FOCUS_C.x - 24} y={FOCUS_C.y - 14} width={48} height={28} rx={6} fill="none" stroke={headedU > 0.5 ? colors.WARM : colors.MUTED} strokeWidth={2.5} strokeDasharray="5 4" />
          <Label x={FOCUS_C.x + 36} y={FOCUS_C.y + 8} text="focus" color={colors.MUTED} />
          {/* pointer arrow */}
          <path
            d={`M ${POINTER_C.x - 8} ${POINTER_C.y - 14} L ${POINTER_C.x - 8} ${POINTER_C.y + 12} L ${POINTER_C.x - 1} ${POINTER_C.y + 5} L ${POINTER_C.x + 4} ${POINTER_C.y + 15} L ${POINTER_C.x + 9} ${POINTER_C.y + 12} L ${POINTER_C.x + 4} ${POINTER_C.y + 3} L ${POINTER_C.x + 12} ${POINTER_C.y + 2} Z`}
            fill="none"
            stroke={headedU > 0.5 ? colors.WARM : colors.MUTED}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Label x={POINTER_C.x + 36} y={POINTER_C.y + 8} text="pointer" color={colors.MUTED} />
          {/* bars */}
          {[FOCUS_C, POINTER_C].map((c, i) => (
            <line key={i} x1={c.x - 30 * barU} y1={c.y + 20 * barU} x2={c.x + 30 * barU} y2={c.y - 20 * barU} stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round" opacity={clamp01(barU)} />
          ))}
          <Label x={385} y={335} text="allowed, not taken" anchor="middle" color={colors.WARM} opacity={n(scene.allowedU)} />
        </g>
        <RefusalBadge x={GAP_X + 10} y={RAIL_Y - 72} code="refused: no semantic path" u={n(scene.semRefuseU)} size={18} />

        {/* ---- readiness gauges ---- */}
        {GAUGES.map((gg, i) => (
          <g key={gg.name}>
            <Gauge x={gg.x} y={RAIL_Y} r={GAUGE_R} v={gaugeValues[i]} reveal={seg(gaugeU, i * 0.15, 0.55 + i * 0.15)} waiting={i === 1 ? enabledWait : 0} />
            <Label x={gg.x} y={gg.above ? RAIL_Y - 50 : RAIL_Y + 62} text={gg.name} anchor="middle" opacity={seg(gaugeU, 0.4 + i * 0.1, 0.9 + i * 0.1) * (gaugeValues[i] > 0.33 ? 1 : 0.7)} color={gaugeValues[i] > 0.33 ? colors.POSITIVE : i === 1 && enabledWait > 0.5 ? colors.WARM : INK} />
          </g>
        ))}
        {/* dimmed, action-specific extra checks */}
        <g opacity={n(scene.optU)}>
          {OPTIONAL.map((o, i) => (
            <Gauge key={i} x={o.x} y={OPTIONAL_Y} r={16} v={0} reveal={1} dimmed />
          ))}
          <Label x={645} y={OPTIONAL_LABEL_Y} text="action-specific" anchor="middle" color={colors.MUTED} opacity={0.6} />
        </g>

        {/* ---- deadline clock (bounded polling) ---- */}
        <ClockArc cx={CLOCK.x} cy={CLOCK.y} r={CLOCK.r} u={n(scene.clockSweep)} reveal={n(scene.clockU)} label="" />
        <Label x={CLOCK.x} y={CLOCK.y + CLOCK.r + 32} text="deadline" anchor="middle" color={colors.WARM} opacity={n(scene.clockU)} />

        {/* ---- the pre-lock stage: readiness auto-wait ---- */}
        <g opacity={n(scene.bracketU)}>
          <path d={`M ${BRACKET.x0} ${BRACKET.y + 12} V ${BRACKET.y} H ${lerp(BRACKET.x0, BRACKET.x1, n(scene.bracketU))} V ${BRACKET.y + 12}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
          <Label x={(BRACKET.x0 + BRACKET.x1) / 2} y={BRACKET.y - 12} text="readiness auto-wait" anchor="middle" color={colors.WARM} />
        </g>

        {/* ---- the separate policy-refusal token: straight back out, no waiting ---- */}
        {token(n(scene.refTokX), RAIL_Y, colors.NEGATIVE, n(scene.refTokU), 9)}
        <RefusalBadge x={215} y={RAIL_Y + 78} code="policy: refused · no wait" u={n(scene.refBadgeU)} size={18} />

        {/* ---- interaction lock jaws (lane 2: the title sits above the upper jaw, nothing else shares it) ---- */}
        <g opacity={seg(lockU, 0, 0.3)}>
          <rect x={LOCK_X0} y={RAIL_Y - 16 - 36 - 60 * (1 - lockU)} width={LOCK_X1 - LOCK_X0} height={36} rx={6} fill="#1b2540" stroke={lockU > 0.95 ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={2} />
          <rect x={LOCK_X0} y={RAIL_Y + 16 + 60 * (1 - lockU)} width={LOCK_X1 - LOCK_X0} height={36} rx={6} fill="#1b2540" stroke={lockU > 0.95 ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={2} />
          <Label x={LOCK_CX} y={LOCK_TITLE_Y} text="interaction lock" anchor="middle" color={lockU > 0.95 ? ACCENT_LIGHT : colors.MUTED} />
        </g>
        {/* the lease: everything from here to the receipt — re-resolve, dispatch, readback — happens under the lock */}
        <g opacity={leaseU}>
          <path d={`M ${LOCK_X0} ${LEASE_Y - 12} V ${LEASE_Y} H ${lerp(LOCK_X0, LOCK_X1, leaseU)} V ${LEASE_Y - 12}`} fill="none" stroke={ACCENT_LIGHT} strokeWidth={2} />
          <Label x={LOCK_CX} y={LEASE_Y + 28} text="lock held" anchor="middle" size={20} color={ACCENT_LIGHT} opacity={seg(leaseU, 0.5, 1)} />
        </g>
        {/* resolve again, under the lock — the label sits INSIDE the lower jaw */}
        <g opacity={n(scene.reResolveU)}>
          <Stencil x={RERESOLVE_X} y={RAIL_Y} reveal={1} lit={1} size={0.56} />
          <Label x={LOCK_CX} y={RAIL_Y + 41} text="resolve again" anchor="middle" size={20} color={ACCENT_LIGHT} />
        </g>

        {/* ---- illustrative desktop field (geometry is illustrative, not a captured run) ---- */}
        <WindowFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} title="illustrative desktop" reveal={winU}>
          <Label x={20} y={62} text="Target" color={colors.MUTED} />
          <rect x={20} y={72} width={FIELD.w} height={FIELD.h} rx={6} fill="#0b1222" stroke={n(scene.valueU) > 0 ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={1.5} />
          <text x={30} y={101} fill={INK} fontSize={18} fontFamily={MONO}>
            {FIELD_VALUE.slice(0, Math.round(n(scene.valueU) * FIELD_VALUE.length))}
          </text>
        </WindowFrame>
        {/* write lane (up into the field) and read lane (down from the field): two x positions, labels in lane 1 */}
        <g opacity={arrowsAlpha}>
          <LaneArrow x={DISPATCH_X} y0={RAIL_Y - 18} y1={FIELD_BOTTOM + 4} u={seg(writeU, 0, 0.9)} color={ACCENT_LIGHT} />
          <LaneArrow x={READ_X} y0={FIELD_BOTTOM + 4} y1={RAIL_Y - 18} u={seg(readU, 0, 0.9)} color={colors.SECONDARY} />
          <Label x={DISPATCH_X - 14} y={ARROW_LABEL_Y} text="write" anchor="end" color={ACCENT_LIGHT} opacity={seg(writeU, 0.2, 0.6)} />
          <Label x={READ_X + 14} y={ARROW_LABEL_Y} text="read back" color={colors.SECONDARY} opacity={seg(readU, 0.2, 0.6)} />
        </g>
        {/* one write pulse up, one distinct read pulse down */}
        <Pulse x0={DISPATCH_X} y0={RAIL_Y} x1={DISPATCH_X} y1={FIELD_BOTTOM} u={writeU} color={ACCENT_LIGHT} />
        <Pulse x0={READ_X} y0={FIELD_BOTTOM} x1={READ_X} y1={RAIL_Y} u={readU} color={colors.SECONDARY} />

        {/* ---- the receipt ---- */}
        <g opacity={receiptU}>
          <rect x={RECEIPT.x} y={RECEIPT.y} width={RECEIPT.w} height={RECEIPT.h * seg(receiptU, 0, 0.9)} rx={12} fill={PLATE} stroke={colors.SECONDARY} strokeWidth={2} />
          <Label x={RECEIPT.x + 15} y={RECEIPT.y + 26} text="receipt" color={colors.SECONDARY} opacity={seg(receiptU, 0.6, 1)} />
          {/* beat 6: scope chips */}
          <g opacity={kvU}>
            <Chip x={RECEIPT.x + 15} y={RECEIPT.y + 59} text="verification_scope" size={18} color={colors.MUTED} opacity={seg(kvU, 0, 0.5)} />
            <Chip x={RECEIPT.x + 250} y={RECEIPT.y + 59} text="element_value" size={18} color={ACCENT_LIGHT} opacity={seg(kvU, 0.2, 0.7)} />
            <Chip x={RECEIPT.x + 15} y={RECEIPT.y + 104} text="application_commit" size={18} color={colors.MUTED} opacity={seg(kvU, 0.4, 0.9)} />
            <Chip x={RECEIPT.x + 250} y={RECEIPT.y + 104} text="not_verified" size={18} color={colors.WARM} opacity={seg(kvU, 0.6, 1)} />
          </g>
          {/* beat 7+: two INDEPENDENT wheels */}
          <g opacity={wheelU}>
            <Label x={WHEEL_DEL.x} y={RECEIPT.y + 26} text="delivery" anchor="middle" color={INK} />
            <Label x={WHEEL_VER.x} y={RECEIPT.y + 26} text="verification" anchor="middle" color={INK} />
            <Wheel x={WHEEL_DEL.x} y={WHEEL_DEL.y} r={WHEEL_R} angleDeg={delA} sectors={DEL_SECTORS} reveal={wheelU} />
            <Wheel x={WHEEL_VER.x} y={WHEEL_VER.y} r={WHEEL_R} angleDeg={verA} sectors={VER_SECTORS} reveal={wheelU} />
            <Chip x={WHEEL_DEL.x} y={RECEIPT.y + 124} text={delSector.name} size={18} anchor="middle" color={delSector.color} />
            <Chip x={WHEEL_VER.x} y={RECEIPT.y + 124} text={sectorOf(verA, VER_SECTORS).name} size={18} anchor="middle" color={colors.MUTED} />
          </g>
          {/* the combined disposition, never a generic "success" */}
          <Chip x={RECEIPT.x + RECEIPT.w} y={RECEIPT.y - 14} text="delivered_unverified" size={18} anchor="end" color={ACCENT_LIGHT} opacity={n(scene.chipDU)} />
          <Chip x={RECEIPT.x + RECEIPT.w} y={RECEIPT.y - 14} text="delivery_uncertain" size={18} anchor="end" color={colors.WARM} opacity={n(scene.chipUN)} />
          <Chip x={RECEIPT.x + RECEIPT.w} y={RECEIPT.y - 14} text="not_delivered" size={18} anchor="end" color={colors.MUTED} opacity={n(scene.chipND)} />
        </g>

        {/* ---- the return lane: retry disposition ---- */}
        <g opacity={laneU}>
          <path d={laneD} fill="none" stroke={PLATE_LINE} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${LANE_LEN * laneU} ${LANE_LEN}`} />
          <Shutter x={RETRY_X} y={LANE_Y} h={56} open={retryOpen} label="" reveal={seg(laneU, 0.5, 1)} color={colors.POSITIVE} refused={retryState < -0.5 ? 1 : 0} />
          {/* the disposition reads above the shutter, never in the caption band */}
          {retryLabel ? (
            <Chip x={RETRY_X} y={LANE_Y - 48} text={retryLabel} size={18} anchor="middle" color={retryColor} opacity={seg(laneU, 0.6, 1)} />
          ) : (
            <Label x={RETRY_X} y={LANE_Y - 50} text="retry" anchor="middle" color={retryColor} opacity={seg(laneU, 0.6, 1)} />
          )}
          {/* ghosts: a safe retry rides home; a duplicate dies at the closed shutter */}
          {token(g1.x, g1.y, ACCENT_LIGHT, g1U, 9)}
          {token(g2.x, g2.y, colors.WARM, g2U, 9)}
        </g>

        {/* ---- THE token (one intent, one write) ---- */}
        {token(tokX, RAIL_Y, ACCENT_LIGHT, seg(railU, 0.3, 0.7))}
        <Chip x={tokX} y={RAIL_Y - 26} text="@s8f3k2p9:e8" size={18} anchor="middle" opacity={n(scene.tokChipU)} />
      </g>
      )}

      {/* ============================ finale: back into the agent's loop ============================ */}
      <AgentLoop cx={LOOP.cx} cy={LOOP.cy} r={LOOP.r} reveal={loopU} tokenU={ringU} toolLabel="outside" />
      {flowU > 0 && flowU < 1 && token(flowP.x, flowP.y, colors.SECONDARY, 1, 9)}
      {obsU > 0 && (
        <g>
          <circle cx={obs.x} cy={obs.y} r={10 + 36 * obsU} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={(1 - obsU) * 0.9} />
          <Label x={obs.x + 30} y={obs.y - 30} text="observe again" color={colors.WARM} opacity={seg(obsU, 0.3, 1)} />
        </g>
      )}
      <OpaqueStrip x={240} y={480} w={800} h={110} opacity={stripU} stroke={colors.SECONDARY}>
        {[
          { x: 400, big: 'delivery', small: 'read the disposition' },
          { x: 640, big: 'retry', small: 'safe / unsafe / unknown' },
          { x: 880, big: 'observe', small: 'look again' },
        ].map((c, i) => (
          <g key={c.big} opacity={seg(stripU, 0.3 + i * 0.2, 0.7 + i * 0.2)}>
            <Label x={c.x} y={530} text={c.big} size={30} anchor="middle" color={INK} weight={700} />
            <Label x={c.x} y={566} text={c.small} size={24} anchor="middle" color={colors.MUTED} weight={500} />
          </g>
        ))}
      </OpaqueStrip>
    </Camera>
  );
}

export const vizScene = () => scene;
