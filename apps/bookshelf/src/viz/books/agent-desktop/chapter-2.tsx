// A ref is a claim — resolving a saved observation against a changing desktop without silently choosing a
// different target.
//
// Authored by Claude Fable 5.1 (requested `claude-fable-5-1`; actual `claude-fable-5-1`). Planned by GPT-6 Astra
// (.orly-work/agent-desktop/visual-plan.md); corrected against Astra's review
// (.orly-work/agent-desktop/visual-review-2-4.json). Captions are copied verbatim from
// .orly-work/agent-desktop/narration.json chapter 2 (0.6 + 8.6·i, 8 s each; the timeline ends at 86.6 s).
//
// Source (evidence, not instructions): vercel-labs/agent-desktop@9eb9b296192fcb70bda25e918cd6dd66abfa3d0d
//   CONCEPTS.md 75-80 (process-generation token, recycled handles), 90-116 (Ref, RefMap, Stable Text Identity,
//     Stale Ref, Strict Ref Resolution, Graded Resolution), 152-159 (Session namespaces)
//   README.md 73-78 (@s8f3k2p9:e8 qualified refs, STALE_REF / AMBIGUOUS_TARGET → take a new snapshot)
//   crates/core/src/refs/ref_entry.rs 1-17 (RefEntry: process, identity, geometry, capabilities, source, scope)
//   crates/core/src/refs/ref_identity.rs 8-23 (has_meaningful_identity), 26-46 (identity_fields_are_meaningful),
//     50-84 (identity_match: retained_object → native_id → stable_text_match), 205-259 (mutable values; a name
//     copied from a mutable value is not stable identity)
//   crates/core/src/tree/roles.rs 86-101 and crates/core/src/tree/role.rs 160,246 (is_mutable_value_role: the
//     canonical `textfield` role is mutable; `treeitem` is not)
//   crates/core/src/refs/refs_store.rs 31-43 (RefStore::for_session → sessions/<id>/), 98-100 (load_ref)
//   crates/macos/src/tree/resolve/mod.rs 18-30 (ElementNotFound → stale_ref_error), 49-67
//     (verify_process_instance: pid + process_instance), 70-134 (path fast path, then bounded broad search,
//     MAX_RESOLVE_DEPTH)
//   crates/macos/src/tree/resolve/resolve_classify.rs 65-115 (classify_ambiguous_candidates /
//     classify_bounds_matches: 0 → Stale, 1 → Resolved, many → Ambiguous; candidate_requires_bounds =
//     !has_meaningful_identity)
//   crates/macos/src/tree/resolve/resolve_tests_more.rs 49-103, crates/windows/src/tree/resolve/resolve_match.rs 97-122
//   crates/macos/src/tree/resolve/retained.rs 107-125 (validate: owner gone → StaleRef, "Take a fresh snapshot")
//
// The machine: ONE identity stencil (the saved RefEntry, seven field teeth) stands at the right of a two-column
// candidate comparator. The live tree on the left reorders; a path probe walks the stored path and lifts whichever
// row it lands on into the comparator; the teeth tell whether the stencil locks. Refusals are visible badges.
// Layers that have finished teaching are hidden outright, never left dimmed behind later beats.
// The desktop drawn here is ILLUSTRATIVE (labelled on stage), not a capture of a run.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  ACCENT,
  ACCENT_LIGHT,
  CAPTION_AT,
  CAPTION_DUR,
  CHAPTER_END,
  Chip,
  DESK_ROWS,
  INK,
  Label,
  MONO,
  OpaqueStrip,
  PLATE,
  PLATE_LINE,
  RefusalBadge,
  WindowFrame,
  clamp01,
  lerp,
  seg,
  window01,
} from './kit';

// ---------------------------------------------------------------------------
// Captions — verbatim from narration.json chapter 2 (immutable text / at / dur)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'A ref remembers an observation, not a permanent address. The desktop may change between the moment you read it and the moment you act.',
  "Resolution starts inside the selected snapshot namespace. A ref from one session cannot quietly reach into another session's saved map.",
  'The saved entry carries more than a name: process identity, source window, role, text, identifiers, geometry, and the original tree path.',
  'The process generation matters. A recycled process number must not turn an old ref into permission to act on a different running application.',
  'The stored path is a fast way to find a candidate. It is not proof of identity, so a row sliding into that position cannot win by position alone.',
  'Identity evidence has priorities. A retained native object takes precedence; otherwise the matcher uses a native identifier or suitable stable text.',
  'Text inside an editable field can change. The matcher avoids treating that changing value, or a name copied from it, as stable identity.',
  'If the path misses, a bounded search can look more broadly. Geometry can narrow competing identity matches; only refs without meaningful identity can rely on geometry alone.',
  'A missing match is stale. If the evidence still leaves competing matches, resolution is ambiguous. The tool refuses instead of choosing a convenient candidate.',
  'The recovery is another observation with fresh refs. Reusing the old token cannot make its missing identity evidence come back.',
];

// ---------------------------------------------------------------------------
// Layout — 1280×720. The player's caption band starts near y ≈ 570 on screen, so every load-bearing element
// stays above y = 560 AFTER the camera transform (cameras below are chosen against that bound).
// ---------------------------------------------------------------------------

const TOKEN = '@s8f3k2p9:e8'; // README's qualified ref
const FIELD_TOKEN = '@s8f3k2p9:e12'; // a second ref in the same snapshot: the search text field (illustrative id)
const FRESH_TOKEN = '@t4m9x1q7:e3'; // a fresh snapshot's ref (format-illustrative)

const RAIL = { x: 30, y: 52, h: 66 } as const; // session rail across the top (beat 1 only)
const OUR_SEG = { x: 30, w: 440 } as const;
const OTHER_SEG = { x: 500, w: 450 } as const;
const DRAWER = { x: 330, y: 85 } as const; // where the token docks (snapshot drawer)

const WIN = { x: 30, y: 150, w: 440, h: 380 } as const; // illustrative Finder window
const ROW_PITCH = 52;
const ROW_Y0 = 82; // first row centre, window-local

const CARD_Y = 118;
const FIELD_Y0 = 178; // first field row centre
const FIELD_PITCH = 46;
const N_FIELDS = 7;
const CARD_H = FIELD_Y0 + FIELD_PITCH * (N_FIELDS - 1) + 31 - CARD_Y; // 367 → card bottom at 485
const COL_A = { x: 470, w: 230 } as const;
const COL_B = { x: 724, w: 230 } as const;
const STENCIL = { x: 970, w: 260 } as const;
const BAND_Y = CARD_Y + CARD_H + 16; // a band under the comparator (501..549) for gate / refusal notes
const fieldY = (i: number): number => FIELD_Y0 + FIELD_PITCH * i;
const VALUE_ROW_Y = fieldY(N_FIELDS); // the extra `value` row (beat 6 only)

// Saved RefEntry field teeth (ref_entry.rs: process · source · identity{role,name,native_id} · geometry · scope/path).
const FIELD_KEYS = ['process', 'source', 'role', 'name', 'native_id', 'geometry', 'path'] as const;

/** Two saved entries from the same snapshot: the Documents tree item (the chapter's subject) and, for beat 6 only,
 *  the search text field — the canonical mutable-value role. */
const ENTRIES = [
  { token: TOKEN, saved: ['pid 4120', 'window 2201', 'treeitem', 'Documents', 'id:documents', 'bounds_hash 9f3c', '[0, 1]'], value: null as string | null },
  { token: FIELD_TOKEN, saved: ['pid 4120', 'window 2201', 'textfield', 'Q3 report', 'id:search', 'bounds_hash 2e07', '[0, 6]'], value: 'Q3 report' },
] as const;

type Status = 'match' | 'nomatch' | 'pending' | 'position' | 'excluded';
interface Candidate {
  title: string;
  values: string[];
  status: Status[];
  /** process-generation stripe colour (process_instance); the saved entry's stripe is WARM */
  stripe: string;
  /** window row slot the card lifts from (−1: rises from below) */
  fromSlot: number;
}

const GEN_A = colors.WARM;
const GEN_B = colors.SECONDARY;
const ALL_MATCH: Status[] = ['match', 'match', 'match', 'match', 'match', 'match', 'position'];
const TRUE_VALUES = ['pid 4120', 'window 2201', 'treeitem', 'Documents', 'id:documents', 'bounds_hash 9f3c', '[0, 2]'];

/** Scenarios selected by the `scen` channel (integers set at beat boundaries). */
const SCENARIOS: { a: Candidate | null; b: Candidate | null }[] = [
  { a: null, b: null },
  {
    // 1 · recycled pid, different process_instance → refused before the tree is consulted
    a: null,
    b: {
      title: 'relaunched app',
      values: ['pid 4120', '—', '—', '—', '—', '—', '—'],
      status: ['nomatch', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'],
      stripe: GEN_B,
      fromSlot: -1,
    },
  },
  {
    // 2 · the row now sitting at the stored path (Target) — position matches, identity does not
    a: null,
    b: {
      title: 'row at path',
      values: ['pid 4120', 'window 2201', 'treeitem', 'Target', 'id:target', 'bounds_hash 51ab', '[0, 1]'],
      status: ['match', 'match', 'match', 'nomatch', 'nomatch', 'nomatch', 'position'],
      stripe: GEN_A,
      fromSlot: 1,
    },
  },
  {
    // 3 · the true Documents row (moved to [0, 2])
    a: null,
    b: { title: 'candidate', values: TRUE_VALUES, status: ALL_MATCH, stripe: GEN_A, fromSlot: 2 },
  },
  {
    // 4 · the search text field while it is being typed into: value and value-copied name are excluded; native_id decides
    a: null,
    b: {
      title: 'live textfield',
      values: ['pid 4120', 'window 2201', 'textfield', '', 'id:search', 'bounds_hash 2e07', '[0, 6]'], // name filled at render time
      status: ['match', 'match', 'match', 'excluded', 'match', 'match', 'position'],
      stripe: GEN_A,
      fromSlot: -1,
    },
  },
  {
    // 5 · broad search inside source window 2201: two identity matches; geometry narrows to one
    a: {
      title: 'candidate A',
      values: ['pid 4120', 'window 2201', 'treeitem', 'Documents', 'id:documents', 'bounds_hash 77d1', '[0, 4]'],
      status: ['match', 'match', 'match', 'match', 'match', 'nomatch', 'position'],
      stripe: GEN_A,
      fromSlot: -1,
    },
    b: { title: 'candidate B', values: TRUE_VALUES, status: ALL_MATCH, stripe: GEN_A, fromSlot: 2 },
  },
  {
    // 6 · two candidates that identity AND geometry both accept → unresolved → ambiguous
    a: {
      title: 'candidate A',
      values: ['pid 4120', 'window 2201', 'treeitem', 'Documents', 'id:documents', 'bounds_hash 9f3c', '[0, 4]'],
      status: ALL_MATCH,
      stripe: GEN_A,
      fromSlot: -1,
    },
    b: { title: 'candidate B', values: TRUE_VALUES, status: ALL_MATCH, stripe: GEN_A, fromSlot: 2 },
  },
];

// Live-tree orders: slot index per DESK_ROWS entry (Downloads, Documents, Target, Run, Status).
const ORDER_A = [0, 1, 2, 3, 4];
const ORDER_B = [0, 3, 1, 2, 4]; // beat 0 — Documents slides down two rows
const ORDER_C = [0, 2, 1, 3, 4]; // beat 4 — Target now sits at the stored path [0, 1]

// Beat 6 — the text field's value as it is typed; its accessible name is a copy of the value.
const VALUE_FRAMES = ['Q3 report', 'Q3 report d', 'Q3 report dra', 'Q3 report draft', 'Q3 draft v2'];

// Beat 5 — evidence precedence (ref_identity.rs identity_match): tiers are tried in order; one decides.
const LAYERS = [
  { label: '1 retained_object', note: 'absent → next tier', decides: false },
  { label: '2 native_id', note: 'present → decides', decides: true },
  { label: '3 stable text', note: 'not reached', decides: false },
] as const;

// Camera marks — every mark keeps the comparator bottom (485 / 531 with the value row) above screen y 560.
const CAM_LEFT: CameraState = { x: 520, y: 330, k: 1.12 };
const CAM_RAIL: CameraState = { x: 480, y: 170, k: 1.3 };
const CAM_STENCIL: CameraState = { x: 960, y: 300, k: 1.04 };
const CAM_COMP: CameraState = { x: 860, y: 310, k: 1.1 };
const CAM_FLAT: CameraState = { x: 860, y: 360, k: 1 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // token
  const tokU = tl.channel('tokU', 0);
  const tokX = tl.channel('tokX', 640);
  const tokY = tl.channel('tokY', 100);
  const obsLabelU = tl.channel('obsLabelU', 0);
  // live tree (hidden outright when a beat does not need it)
  const winU = tl.channel('winU', 0);
  const order = tl.channel<number[]>('order', ORDER_A);
  const ghostU = tl.channel('ghostU', 0);
  // session rail (beat 1 only)
  const railU = tl.channel('railU', 0);
  const otherU = tl.channel('otherU', 0);
  // stencil + comparator
  const stencilU = tl.channel('stencilU', 0);
  const entryU = tl.channel('entryU', 0); // 0 Documents entry · 1 the text-field entry (beat 6)
  const focusG = tl.channel('focusG', -1); // which trio of teeth is emphasised (−1: none, 0..2)
  const scen = tl.channel('scen', 0);
  const candA = tl.channel('candA', 0);
  const candB = tl.channel('candB', 0);
  const outA = tl.channel('outA', 0);
  const outB = tl.channel('outB', 0);
  const teethU = tl.channel('teethU', 0);
  const lockU = tl.channel('lockU', 0);
  const emptyU = tl.channel('emptyU', 0); // "0 candidates" state
  // beat-specific machinery
  const procU = tl.channel('procU', 0); // beat 3: candidate stripe appears, mismatch flagged
  const badgeStale = tl.channel('badgeStale', 0);
  const badgeAmb = tl.channel('badgeAmb', 0);
  const probeU = tl.channel('probeU', 0);
  const probeMode = tl.channel('probeMode', 0); // 0 path fast-path · 1 broad sweep
  const layerU = tl.channel('layerU', 0); // beat 5: 0..3 plates
  const editU = tl.channel('editU', 0); // beat 6: value typing
  const valueToothU = tl.channel('valueToothU', 0); // beat 6: the mutable `value` tooth (1 shown → 0 withdrawn)
  const gateU = tl.channel('gateU', 0); // beat 7: geometry band
  const ambU = tl.channel('ambU', 0); // beat 8: "still two" note
  // finale
  const dimAll = tl.channel('dimAll', 0);
  const freshU = tl.channel('freshU', 0);
  const summaryU = tl.channel('summaryU', 0);

  const T = CAPTION_AT;
  CAPTIONS.forEach((text, i) => tl.caption({ at: T(i), dur: CAPTION_DUR, text }));

  // ---- beat 0 · observation, not permanent address ------------------------------------------------
  let t = T(0);
  tl.tween(cam, CAM_LEFT, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(tokU, 1, { at: t + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(winU, 1, { at: t + 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(ghostU, 1, { at: t + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(order, ORDER_B, { at: t + 3.0, dur: 1.5, ease: ease.move });
  tl.tween(obsLabelU, 1, { at: t + 3.4, dur: 0.6, ease: ease.enter });
  tl.hold(t + 4.5, 0.8);

  // ---- beat 1 · the snapshot namespace (window retired; rail shown) ---------------------------------
  t = T(1);
  tl.tween(cam, CAM_RAIL, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(obsLabelU, 0, { at: t, dur: 0.5, ease: ease.enter });
  tl.tween(ghostU, 0, { at: t, dur: 0.5, ease: ease.enter });
  tl.tween(winU, 0, { at: t + 0.1, dur: 0.7, ease: ease.enter });
  tl.tween(railU, 1, { at: t + 0.4, dur: 1.4, ease: ease.draw });
  tl.tween(tokX, DRAWER.x, { at: t + 1.7, dur: 1.2, ease: ease.move });
  tl.tween(tokY, DRAWER.y, { at: t + 1.7, dur: 1.2, ease: ease.move });
  tl.tween(otherU, 1, { at: t + 3.7, dur: 1.6, ease: ease.move });
  tl.hold(t + 5.3, 0.8);

  // ---- beat 2 · the entry unfolds into the stencil (rail retired) ------------------------------------
  t = T(2);
  tl.tween(cam, CAM_STENCIL, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(otherU, 0, { at: t, dur: 0.4, ease: ease.enter });
  tl.tween(railU, 0, { at: t + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(tokX, STENCIL.x + STENCIL.w / 2, { at: t + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(tokY, CARD_Y + 26, { at: t + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(stencilU, 1, { at: t + 1.5, dur: 1.5, ease: ease.draw });
  tl.set(focusG, 0, t + 3.0);
  tl.tween(focusG, 1, { at: t + 4.4, dur: 0.6, ease: ease.move });
  tl.tween(focusG, 2, { at: t + 6.2, dur: 0.6, ease: ease.move });
  tl.hold(t + 7.0, 0.6);

  // ---- beat 3 · process generation ------------------------------------------------------------------
  t = T(3);
  tl.tween(cam, CAM_COMP, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(focusG, -1, { at: t, dur: 0.4, ease: ease.move });
  tl.set(scen, 1, t + 0.2);
  tl.tween(candB, 1, { at: t + 0.4, dur: 0.9, ease: ease.enter });
  tl.tween(procU, 1, { at: t + 1.4, dur: 1.4, ease: ease.move });
  tl.tween(teethU, 1, { at: t + 2.4, dur: 0.6, ease: ease.enter });
  tl.tween(badgeStale, 1, { at: t + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(badgeStale, 0, { at: t + 6.6, dur: 0.4, ease: ease.enter });
  tl.tween(outB, 1, { at: t + 6.6, dur: 0.8, ease: ease.move });
  tl.tween(teethU, 0, { at: t + 6.6, dur: 0.3, ease: ease.enter });
  tl.tween(procU, 0, { at: t + 7.0, dur: 0.4, ease: ease.enter });
  tl.set(candB, 0, t + 7.5);
  tl.set(outB, 0, t + 7.5);
  tl.hold(t + 7.6, 0.4);

  // ---- beat 4 · the path is a locator, not identity (window back for the probe) ---------------------
  t = T(4);
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(winU, 1, { at: t, dur: 0.8, ease: ease.enter });
  tl.set(scen, 2, t + 0.1);
  tl.tween(order, ORDER_C, { at: t + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(probeU, 1, { at: t + 1.8, dur: 1.4, ease: ease.linear });
  tl.tween(candB, 1, { at: t + 3.2, dur: 1.0, ease: ease.move });
  tl.tween(teethU, 1, { at: t + 4.2, dur: 1.2, ease: ease.enter });
  tl.tween(outB, 1, { at: t + 6.6, dur: 0.9, ease: ease.move });
  tl.tween(teethU, 0, { at: t + 6.6, dur: 0.3, ease: ease.enter });
  tl.tween(probeU, 0, { at: t + 6.6, dur: 0.5, ease: ease.enter });
  tl.set(candB, 0, t + 7.6);
  tl.set(outB, 0, t + 7.6);
  tl.hold(t + 7.7, 0.3);

  // ---- beat 5 · precedence, not a score (window retired; tiers stack in column A) --------------------
  t = T(5);
  tl.tween(cam, CAM_COMP, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(winU, 0, { at: t, dur: 0.7, ease: ease.enter });
  tl.set(scen, 3, t + 0.1);
  tl.tween(candB, 1, { at: t + 0.3, dur: 0.9, ease: ease.move });
  tl.tween(layerU, 1, { at: t + 1.4, dur: 1.0, ease: ease.move });
  tl.tween(layerU, 2, { at: t + 3.2, dur: 1.0, ease: ease.move });
  tl.tween(teethU, 1, { at: t + 4.2, dur: 1.0, ease: ease.enter });
  tl.tween(layerU, 3, { at: t + 5.2, dur: 1.0, ease: ease.move });
  tl.tween(lockU, 1, { at: t + 6.6, dur: 0.6, ease: ease.pop });
  tl.hold(t + 7.4, 0.6);

  // ---- beat 6 · mutable values are not identity (the stencil loads the text-field entry) ------------
  t = T(6);
  tl.tween(cam, CAM_FLAT, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(layerU, 0, { at: t, dur: 0.5, ease: ease.enter });
  tl.tween(lockU, 0, { at: t, dur: 0.4, ease: ease.enter });
  tl.tween(outB, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(teethU, 0, { at: t, dur: 0.3, ease: ease.enter });
  tl.set(candB, 0, t + 0.7);
  tl.set(outB, 0, t + 0.7);
  tl.set(scen, 4, t + 0.7);
  tl.tween(entryU, 1, { at: t + 0.5, dur: 0.7, ease: ease.move });
  tl.tween(valueToothU, 1, { at: t + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(candB, 1, { at: t + 1.5, dur: 0.9, ease: ease.move });
  tl.tween(editU, 1, { at: t + 2.2, dur: 3.0, ease: ease.linear });
  tl.tween(teethU, 1, { at: t + 3.6, dur: 1.0, ease: ease.enter });
  tl.tween(valueToothU, 0, { at: t + 5.2, dur: 1.0, ease: ease.move }); // the value tooth withdraws
  tl.tween(lockU, 1, { at: t + 6.2, dur: 0.5, ease: ease.pop }); // native_id resolves it anyway
  tl.tween(outB, 1, { at: t + 7.5, dur: 0.6, ease: ease.move });
  tl.tween(teethU, 0, { at: t + 7.5, dur: 0.3, ease: ease.enter });
  tl.tween(lockU, 0, { at: t + 7.5, dur: 0.4, ease: ease.enter });
  tl.tween(entryU, 0, { at: t + 7.8, dur: 0.6, ease: ease.move });
  tl.set(candB, 0, t + 8.2);
  tl.set(outB, 0, t + 8.2);
  tl.set(editU, 0, t + 8.2);

  // ---- beat 7 · bounded broad search inside window 2201; geometry narrows ---------------------------
  t = T(7);
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.2, ease: ease.move });
  tl.set(scen, 5, t + 0.1);
  tl.set(probeMode, 1, t + 0.1);
  tl.tween(winU, 1, { at: t + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(probeU, 1, { at: t + 0.8, dur: 1.8, ease: ease.linear });
  tl.tween(candA, 1, { at: t + 2.4, dur: 0.9, ease: ease.move });
  tl.tween(candB, 1, { at: t + 2.7, dur: 0.9, ease: ease.move });
  tl.tween(probeU, 0, { at: t + 2.8, dur: 0.4, ease: ease.enter });
  tl.tween(winU, 0, { at: t + 3.2, dur: 0.6, ease: ease.enter }); // desktop retired before the comparison
  tl.tween(teethU, 1, { at: t + 3.8, dur: 1.2, ease: ease.enter });
  tl.tween(outA, 1, { at: t + 5.4, dur: 0.9, ease: ease.move });
  tl.tween(lockU, 1, { at: t + 6.0, dur: 0.6, ease: ease.pop });
  tl.tween(gateU, 1, { at: t + 6.2, dur: 0.8, ease: ease.enter });
  tl.hold(t + 7.6, 0.4);

  // ---- beat 8 · stale vs ambiguous: both survivors stay on screen while the tool refuses ------------
  t = T(8);
  tl.tween(cam, CAM_FLAT, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(gateU, 0, { at: t, dur: 0.4, ease: ease.enter });
  tl.tween(lockU, 0, { at: t, dur: 0.4, ease: ease.enter });
  tl.tween(outB, 1, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(teethU, 0, { at: t, dur: 0.3, ease: ease.enter });
  tl.set(candA, 0, t + 0.7);
  tl.set(candB, 0, t + 0.7);
  tl.set(outA, 0, t + 0.7);
  tl.set(outB, 0, t + 0.7);
  tl.set(scen, 6, t + 0.7);
  tl.tween(emptyU, 1, { at: t + 0.7, dur: 0.5, ease: ease.enter });
  tl.tween(badgeStale, 1, { at: t + 1.3, dur: 0.5, ease: ease.pop });
  tl.tween(badgeStale, 0, { at: t + 2.8, dur: 0.3, ease: ease.enter });
  tl.tween(emptyU, 0, { at: t + 2.8, dur: 0.3, ease: ease.enter });
  tl.tween(candA, 1, { at: t + 3.1, dur: 0.8, ease: ease.move });
  tl.tween(candB, 1, { at: t + 3.3, dur: 0.8, ease: ease.move });
  tl.tween(teethU, 1, { at: t + 4.1, dur: 1.0, ease: ease.enter });
  tl.tween(ambU, 1, { at: t + 5.0, dur: 0.5, ease: ease.enter });
  tl.tween(badgeAmb, 1, { at: t + 5.5, dur: 0.5, ease: ease.pop });
  tl.hold(t + 8.0, 0.6); // readable hold: both candidates, all teeth, the refusal

  // ---- beat 9 · recovery: observe again (everything else hidden under the card) ----------------------
  t = T(9);
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.4, ease: ease.move });
  tl.tween(badgeAmb, 0, { at: t + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(ambU, 0, { at: t + 0.4, dur: 0.6, ease: ease.enter });
  tl.tween(dimAll, 1, { at: t + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(summaryU, 1, { at: t + 1.8, dur: 0.8, ease: ease.enter });
  tl.tween(freshU, 1, { at: t + 3.0, dur: 0.9, ease: ease.pop });
  tl.hold(CHAPTER_END, 0);

  return {
    tl, cam, tokU, tokX, tokY, obsLabelU, winU, order, ghostU, railU, otherU, stencilU, entryU, focusG, scen,
    candA, candB, outA, outB, teethU, lockU, emptyU, procU, badgeStale, badgeAmb, probeU, probeMode, layerU,
    editU, valueToothU, gateU, ambU, dimAll, freshU, summaryU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Drawing parts
// ---------------------------------------------------------------------------

const statusColor = (s: Status): string =>
  s === 'match' ? colors.POSITIVE : s === 'nomatch' ? colors.NEGATIVE : s === 'position' ? ACCENT_LIGHT : s === 'excluded' ? colors.WARM : colors.MUTED;
const statusDash = (s: Status): string | undefined => (s === 'pending' || s === 'excluded' ? '3 4' : undefined);
const statusFill = (s: Status): string => (s === 'position' || s === 'excluded' || s === 'pending' ? PLATE : statusColor(s));

/** Generation stripe: a short band under a process chip; colour = process_instance. */
function GenStripe({ x, y, color, opacity = 1, w = 86 }: { x: number; y: number; color: string; opacity?: number; w?: number }) {
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={6} rx={3} fill={color} />
      <rect x={x + 12} y={y} width={6} height={6} fill={PLATE} opacity={0.7} />
      <rect x={x + 34} y={y} width={6} height={6} fill={PLATE} opacity={0.7} />
      <rect x={x + 60} y={y} width={6} height={6} fill={PLATE} opacity={0.7} />
    </g>
  );
}

function Probe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M 0 -12 L 12 0 L 0 12 L -12 0 Z" fill={ACCENT_LIGHT} />
      <circle r={20} fill="none" stroke={ACCENT_LIGHT} strokeWidth={1.5} opacity={0.5} />
    </g>
  );
}

/** The live tree rows inside the window (window-local coordinates). */
function TreeRows({ order, ghostU, probe }: { order: number[]; ghostU: number; probe: { x: number; y: number } | null }) {
  return (
    <g>
      <line x1={40} y1={ROW_Y0 - 30} x2={40} y2={ROW_Y0 + ROW_PITCH * 4 + 10} stroke={PLATE_LINE} strokeWidth={2} />
      {DESK_ROWS.map((row, i) => {
        const y = ROW_Y0 + ROW_PITCH * order[i];
        const isDoc = row.name === 'Documents';
        return (
          <g key={row.name} transform={`translate(0, ${y})`}>
            <line x1={40} y1={0} x2={58} y2={0} stroke={PLATE_LINE} strokeWidth={2} />
            <rect x={62} y={-20} width={WIN.w - 90} height={40} rx={8} fill={isDoc ? 'rgba(14,116,144,0.28)' : 'rgba(148,163,184,0.08)'} stroke={isDoc ? ACCENT_LIGHT : 'none'} strokeWidth={1.5} />
            <Label x={78} y={9} text={row.name} size={24} color={isDoc ? INK : colors.MUTED} />
            <Chip x={WIN.w - 40} y={2} text={row.role} size={18} anchor="end" color={isDoc ? ACCENT_LIGHT : colors.MUTED} />
          </g>
        );
      })}
      {/* the stored stencil ghost — fixed at the observed slot [0, 1] */}
      {ghostU > 0.001 && (
        <g opacity={ghostU} transform={`translate(0, ${ROW_Y0 + ROW_PITCH})`}>
          <rect x={62} y={-22} width={WIN.w - 90} height={44} rx={8} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="8 6" />
          <Chip x={78} y={-30} text="saved: Documents [0, 1]" size={18} color={colors.WARM} />
        </g>
      )}
      {probe && <Probe x={probe.x} y={probe.y} />}
      <Label x={WIN.w / 2} y={WIN.h - 16} text="illustrative desktop · not a capture" size={24} color={colors.MUTED} anchor="middle" />
    </g>
  );
}

/** A candidate column: seven value chips, teeth marks on the edge facing the stencil, a title. */
function CandidateCard({
  col,
  cand,
  inU,
  outU,
  teethU,
  side,
  stripeU,
  liveName,
  liveValue,
  valueRowU,
}: {
  col: { x: number; w: number };
  cand: Candidate;
  inU: number;
  outU: number;
  teethU: number;
  side: 'a' | 'b';
  stripeU: number;
  liveName: string | null;
  liveValue: string | null;
  valueRowU: number;
}) {
  const u = clamp01(inU);
  if (u <= 0 || outU >= 0.999) return null;
  // lift from the tree row (or rise from below), then slide out down-right
  const from = cand.fromSlot >= 0 ? { x: WIN.x + 62 - col.x, y: WIN.y + ROW_Y0 + ROW_PITCH * cand.fromSlot - (CARD_Y + 40) } : { x: 0, y: 90 };
  const sx = lerp(from.x, 0, u) + 90 * outU;
  const sy = lerp(from.y, 0, u) + 120 * outU;
  const scale = lerp(cand.fromSlot >= 0 ? 0.55 : 0.92, 1, u);
  const alpha = u * (1 - outU);
  const extra = FIELD_PITCH * clamp01(valueRowU);
  return (
    <g transform={`translate(${col.x + sx}, ${CARD_Y + sy}) scale(${scale})`} opacity={alpha}>
      <rect width={col.w} height={CARD_H + extra} rx={14} fill={PLATE} stroke={PLATE_LINE} strokeWidth={2} />
      <Label x={col.w / 2} y={32} text={cand.title} size={24} color={colors.MUTED} anchor="middle" />
      {FIELD_KEYS.map((key, i) => {
        const cy = fieldY(i) - CARD_Y;
        const rowU = seg(teethU, (i / N_FIELDS) * 0.7, (i / N_FIELDS) * 0.7 + 0.3);
        const st = cand.status[i];
        const c = statusColor(st);
        const val = i === 3 && liveName !== null ? liveName : cand.values[i];
        const isProc = i === 0;
        return (
          <g key={key}>
            {val !== '—' ? (
              <Chip x={col.w / 2} y={cy - (isProc ? 4 : 0)} text={val} size={18} anchor="middle" color={st === 'pending' ? colors.MUTED : st === 'excluded' ? colors.WARM : INK} />
            ) : (
              <line x1={col.w / 2 - 30} y1={cy} x2={col.w / 2 + 30} y2={cy} stroke={colors.MUTED} strokeWidth={2} strokeDasharray="4 6" opacity={0.6} />
            )}
            {isProc && <GenStripe x={col.w / 2 - 43} y={cy + 16} color={cand.stripe} opacity={stripeU} />}
            {rowU > 0 && (
              <g opacity={rowU}>
                <rect x={col.w - 4} y={cy - 9} width={side === 'b' ? 8 + 14 * rowU : 12} height={18} rx={3} fill={statusFill(st)} stroke={c} strokeWidth={2} strokeDasharray={statusDash(st)} />
                {st === 'nomatch' && side === 'b' && <path d={`M ${col.w + 26} ${cy - 8} l 16 16 m 0 -16 l -16 16`} stroke={c} strokeWidth={3} strokeLinecap="round" />}
              </g>
            )}
          </g>
        );
      })}
      {/* beat 6 — the live value being typed; shown as a text box, never as a tooth */}
      {liveValue !== null && valueRowU > 0.001 && (
        <g opacity={clamp01(valueRowU)}>
          <rect x={16} y={VALUE_ROW_Y - CARD_Y - 17} width={col.w - 32} height={34} rx={6} fill="#131b2e" stroke={colors.WARM} strokeWidth={1.5} />
          <text x={26} y={VALUE_ROW_Y - CARD_Y + 7} fill={colors.WARM} fontSize={18} fontFamily={MONO} fontWeight={700}>
            {liveValue}
          </text>
        </g>
      )}
    </g>
  );
}

/** The saved RefEntry as a stencil with seven field teeth on its left edge. */
function Stencil({
  reveal,
  entryU,
  focusG,
  status,
  teethU,
  lockU,
  stripeU,
  procRefuse,
  valueToothU,
  tokenChip,
}: {
  reveal: number;
  entryU: number;
  focusG: number;
  status: Status[] | null;
  teethU: number;
  lockU: number;
  stripeU: number;
  procRefuse: number;
  valueToothU: number;
  tokenChip: boolean;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const x = STENCIL.x - 16 * lockU;
  const extra = FIELD_PITCH * clamp01(valueToothU);
  const h = (CARD_H + extra) * rv;
  const border = lockU > 0.5 ? colors.POSITIVE : procRefuse > 0.5 ? colors.NEGATIVE : ACCENT;
  const eu = clamp01(entryU);
  const entry = eu < 0.5 ? ENTRIES[0] : ENTRIES[1];
  const swap = 1 - Math.abs(eu - 0.5) * 2; // 1 mid-crossfade
  return (
    <g transform={`translate(${x}, ${CARD_Y})`}>
      <rect width={STENCIL.w} height={h} rx={14} fill={PLATE} stroke={border} strokeWidth={2.5} />
      <rect width={STENCIL.w} height={Math.min(50, h)} rx={14} fill="#131b2e" />
      {/* header row: the ref token only (the "saved entry" heading sits above the card) */}
      {tokenChip && <Chip x={STENCIL.w / 2} y={26} text={entry.token} size={18} anchor="middle" opacity={1 - 0.8 * swap} />}
      {rv > 0.3 && (
        <g opacity={seg(rv, 0.3, 1) * (1 - 0.8 * swap)}>
          {FIELD_KEYS.map((key, i) => {
            const cy = fieldY(i) - CARD_Y;
            const show = seg(rv, 0.3 + (i / N_FIELDS) * 0.6, 0.3 + (i / N_FIELDS) * 0.6 + 0.15);
            // emphasis trio → 0: process·source·role, 1: name·native_id, 2: geometry·path
            const grp = i <= 2 ? 0 : i <= 4 ? 1 : 2;
            const focus = focusG < -0.5 ? 1 : clamp01(1 - Math.abs(focusG - grp) * 1.6);
            const emph = focusG < -0.5 ? 1 : 0.22 + 0.78 * focus;
            const st = status ? status[i] : null;
            const rowU = st ? seg(teethU, (i / N_FIELDS) * 0.7, (i / N_FIELDS) * 0.7 + 0.3) : 0;
            const c = st ? statusColor(st) : ACCENT_LIGHT;
            const isProc = i === 0;
            const savedColor = st === 'excluded' && rowU > 0.5 ? colors.WARM : ACCENT_LIGHT;
            return (
              <g key={key} opacity={show * emph}>
                <Label x={16} y={cy - 8} text={key} size={24} color={focus > 0.5 && focusG >= -0.5 ? INK : colors.MUTED} font={MONO} />
                <Chip x={STENCIL.w - 12} y={cy + 12} text={entry.saved[i]} size={18} anchor="end" color={savedColor} />
                {isProc && <GenStripe x={16} y={cy + 6} color={GEN_A} opacity={stripeU} w={70} />}
                <rect
                  x={-8 - 20 * rowU - 10 * lockU}
                  y={cy - 9}
                  width={8 + 20 * rowU + 10 * lockU}
                  height={18}
                  rx={3}
                  fill={st && rowU > 0 ? statusFill(st) : PLATE}
                  stroke={st && rowU > 0 ? c : ACCENT}
                  strokeWidth={2}
                  strokeDasharray={st && rowU > 0 ? statusDash(st) : undefined}
                />
              </g>
            );
          })}
          {/* beat 6 — the saved `value` row and its tooth; the tooth withdraws back into the card */}
          {valueToothU > 0.001 && entry.value && (
            <g opacity={clamp01(valueToothU)}>
              <Label x={16} y={VALUE_ROW_Y - CARD_Y - 8} text="value" size={24} color={colors.WARM} font={MONO} />
              <Chip x={STENCIL.w - 12} y={VALUE_ROW_Y - CARD_Y + 12} text={entry.value} size={18} anchor="end" color={colors.WARM} />
              <rect x={-8 - 20 * valueToothU} y={VALUE_ROW_Y - CARD_Y - 9} width={8 + 20 * valueToothU} height={18} rx={3} fill={PLATE} stroke={colors.WARM} strokeWidth={2} strokeDasharray="3 4" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

/** Beat 5 — the precedence ladder, in its own band (column A, empty during this beat): tiers try in order. */
function EvidenceLayers({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const x = COL_A.x;
  const w = COL_A.w;
  return (
    <g>
      <rect x={x} y={CARD_Y} width={w} height={CARD_H} rx={14} fill="#0c1426" stroke={PLATE_LINE} strokeWidth={2} opacity={seg(u, 0, 0.3)} />
      <Label x={x + w / 2} y={CARD_Y + 32} text="precedence" size={24} color={colors.MUTED} anchor="middle" opacity={seg(u, 0, 0.3)} />
      {LAYERS.map((L, k) => {
        const p = seg(u, k, k + 0.75); // this plate's descent
        if (p <= 0) return null;
        const targetY = CARD_Y + 92 + k * 100;
        const y = lerp(targetY - 70, targetY, p);
        const later = u > k + 1; // a later tier has been reached
        const bright = L.decides ? 1 : later ? 0.4 : 1;
        const stroke = L.decides ? colors.POSITIVE : colors.MUTED;
        return (
          <g key={L.label} opacity={p * bright} transform={`translate(${x + 10}, ${y})`}>
            <rect x={0} y={-24} width={w - 20} height={48} rx={10} fill="rgba(14,116,144,0.18)" stroke={stroke} strokeWidth={2} />
            <Chip x={10} y={2} text={L.label} size={18} color={L.decides ? colors.POSITIVE : colors.MUTED} />
            <Label x={0} y={52} text={L.note} size={24} color={L.decides ? colors.POSITIVE : colors.MUTED} />
          </g>
        );
      })}
    </g>
  );
}

/** Beat 1 — the session rail: our namespace with its snapshot drawer; another session's rail with no wire across. */
function SessionRail({ reveal, otherU, docked }: { reveal: number; otherU: number; docked: number }) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const w1 = OUR_SEG.w * seg(rv, 0, 0.6);
  const w2 = OTHER_SEG.w * seg(rv, 0.4, 1);
  const stubEnd = lerp(OTHER_SEG.x + 120, OTHER_SEG.x + 4, seg(otherU, 0.4, 1));
  return (
    <g opacity={rv}>
      <rect x={OUR_SEG.x} y={RAIL.y} width={w1} height={RAIL.h} rx={12} fill="#0c1426" stroke={ACCENT} strokeWidth={2} />
      <Label x={OUR_SEG.x + 16} y={RAIL.y + 42} text="sessions/<id>/" size={24} color={INK} font={MONO} opacity={seg(rv, 0.3, 0.6)} />
      <g opacity={seg(rv, 0.5, 0.8)}>
        <rect x={DRAWER.x - 86} y={DRAWER.y - 22} width={172} height={44} rx={8} fill={PLATE} stroke={docked > 0.5 ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={2} />
        <Label x={DRAWER.x} y={DRAWER.y - 28} text="s8f3k2p9" size={24} color={colors.MUTED} anchor="middle" font={MONO} opacity={docked} />
      </g>
      <g opacity={seg(rv, 0.6, 1)}>
        <rect x={OTHER_SEG.x} y={RAIL.y} width={w2} height={RAIL.h} rx={12} fill="#0c1426" stroke={PLATE_LINE} strokeWidth={2} strokeDasharray="8 6" />
        <Label x={OTHER_SEG.x + 16} y={RAIL.y + 42} text="sessions/other/" size={24} color={colors.MUTED} font={MONO} />
        <rect x={OTHER_SEG.x + 270} y={DRAWER.y - 22} width={160} height={44} rx={8} fill={PLATE} stroke={PLATE_LINE} strokeWidth={2} />
        <Label x={OTHER_SEG.x + 350} y={DRAWER.y - 28} text="k2d81m3z" size={24} color={colors.MUTED} anchor="middle" font={MONO} />
      </g>
      {/* an attempted lookup of our token from the other namespace: it stays outside, below its own rail */}
      {otherU > 0.001 && (
        <g opacity={clamp01(otherU)}>
          <Chip x={OTHER_SEG.x + 200} y={RAIL.y + RAIL.h + 40} text={TOKEN} size={18} anchor="middle" color={colors.NEGATIVE} />
          <path d={`M ${OTHER_SEG.x + 120} ${RAIL.y + RAIL.h + 36} L ${stubEnd} ${RAIL.y + RAIL.h + 36}`} stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="6 6" fill="none" />
          <g opacity={seg(otherU, 0.8, 1)}>
            <path d={`M ${OTHER_SEG.x - 12} ${RAIL.y + RAIL.h + 26} l 20 20 m 0 -20 l -20 20`} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
            <Label x={OTHER_SEG.x} y={RAIL.y + RAIL.h + 92} text="no wire across namespaces" size={24} color={colors.NEGATIVE} />
          </g>
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render — a pure function of the sampled state
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>): number => s.get(ch);
  const dimAll = g(scene.dimAll);
  const world = 1 - dimAll; // the old machine is hidden entirely under the closing card

  const order = s.get(scene.order) as number[];
  const scenIdx = Math.max(0, Math.min(SCENARIOS.length - 1, Math.round(g(scene.scen))));
  const scen = SCENARIOS[scenIdx];
  const candA = g(scene.candA);
  const candB = g(scene.candB);
  const teethU = g(scene.teethU);
  const lockU = g(scene.lockU);
  const procU = g(scene.procU);
  const stencilU = g(scene.stencilU);
  const entryU = g(scene.entryU);
  const valueToothU = g(scene.valueToothU);
  const editU = g(scene.editU);
  const probeU = g(scene.probeU);
  const probeMode = Math.round(g(scene.probeMode));
  const winU = g(scene.winU);
  const emptyU = g(scene.emptyU);
  const gateU = g(scene.gateU);
  const ambU = g(scene.ambU);
  const badgeStale = g(scene.badgeStale);
  const badgeAmb = g(scene.badgeAmb);

  // probe position (window-local): path fast-path walks title → list → slot 1; broad sweep runs every row
  let probe: { x: number; y: number } | null = null;
  if (probeU > 0.001 && winU > 0.5) {
    const p = probeU;
    if (probeMode === 0) {
      const y = p < 0.35 ? lerp(46, ROW_Y0 - 30, p / 0.35) : p < 0.75 ? lerp(ROW_Y0 - 30, ROW_Y0 + ROW_PITCH, (p - 0.35) / 0.4) : ROW_Y0 + ROW_PITCH;
      const x = p < 0.75 ? 40 : lerp(40, 110, (p - 0.75) / 0.25);
      probe = { x, y };
    } else {
      probe = { x: 40 + 40 * Math.abs(Math.sin(p * 9)), y: lerp(ROW_Y0, ROW_Y0 + ROW_PITCH * 4, p) };
    }
  }

  // beat 6 — the text field's live value and the name copied from it
  const fieldEntry = scenIdx === 4 && entryU > 0.5;
  const frame = VALUE_FRAMES[Math.min(VALUE_FRAMES.length - 1, Math.floor(editU * VALUE_FRAMES.length))];
  const liveName = fieldEntry ? frame : null;
  const liveValue = fieldEntry ? frame + (Math.floor(editU * 14) % 2 === 0 ? '|' : ' ') : null;

  const tokenInStencil = stencilU > 0.05;
  const stencilStatus = scen.b ? scen.b.status : null;
  const headingU = seg(stencilU, 0.3, 0.8);

  return (
    <g>
      <Camera {...(s.get(scene.cam) as CameraState)}>
        {world > 0.001 && (
          <g opacity={world}>
            {/* ---------------- session rail (beat 1) ---------------- */}
            <SessionRail reveal={g(scene.railU)} otherU={g(scene.otherU)} docked={g(scene.tokX) < DRAWER.x + 2 ? 1 : 0} />

            {/* ---------------- live tree (beats 0, 4, 7) ---------------- */}
            {winU > 0.001 && (
              <g opacity={winU}>
                <WindowFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} title="Finder — Downloads · window 2201" reveal={winU}>
                  <TreeRows order={order} ghostU={g(scene.ghostU)} probe={probe} />
                </WindowFrame>
                {probeU > 0.3 && probeMode === 0 && <Chip x={WIN.x + WIN.w + 10} y={WIN.y + ROW_Y0 + ROW_PITCH - 44} text="find_entry_by_path" size={18} opacity={seg(probeU, 0.3, 0.6)} />}
                {probeU > 0.1 && probeMode === 1 && (
                  <g opacity={seg(probeU, 0.1, 0.4)}>
                    <Chip x={WIN.x + WIN.w + 10} y={WIN.y + 60} text="find_entry_in_roots" size={18} />
                    <Chip x={WIN.x + WIN.w + 10} y={WIN.y + 96} text="MAX_RESOLVE_DEPTH = 50" size={18} color={colors.MUTED} />
                  </g>
                )}
              </g>
            )}

            {/* beat 0 label */}
            <Label x={640} y={150} text="observation, not permanent address" size={24} color={colors.WARM} anchor="middle" opacity={g(scene.obsLabelU)} />

            {/* ---------------- comparator headings ---------------- */}
            {headingU > 0 && (
              <g opacity={headingU}>
                <Label x={COL_A.x} y={CARD_Y - 14} text="candidates" size={24} color={colors.MUTED} opacity={1 - ambU} />
                <Label x={COL_A.x} y={CARD_Y - 14} text="2 still match after geometry → unresolved" size={24} color={colors.NEGATIVE} opacity={ambU} />
                <line x1={COL_A.x} y1={CARD_Y - 4} x2={COL_B.x + COL_B.w} y2={CARD_Y - 4} stroke={PLATE_LINE} strokeWidth={2} />
                <Label x={STENCIL.x} y={CARD_Y - 14} text="saved entry" size={24} color={colors.MUTED} opacity={1 - ambU} />
                <line x1={STENCIL.x} y1={CARD_Y - 4} x2={STENCIL.x + STENCIL.w} y2={CARD_Y - 4} stroke={PLATE_LINE} strokeWidth={2} />
              </g>
            )}

            {/* ---------------- candidates ---------------- */}
            {scen.a && <CandidateCard col={COL_A} cand={scen.a} inU={candA} outU={g(scene.outA)} teethU={teethU} side="a" stripeU={0} liveName={null} liveValue={null} valueRowU={0} />}
            {scen.b && (
              <CandidateCard
                col={COL_B}
                cand={scen.b}
                inU={candB}
                outU={g(scene.outB)}
                teethU={teethU}
                side="b"
                stripeU={procU}
                liveName={liveName}
                liveValue={liveValue}
                valueRowU={fieldEntry ? 1 : 0}
              />
            )}
            {emptyU > 0.001 && (
              <g opacity={emptyU}>
                <rect x={COL_A.x} y={CARD_Y} width={COL_B.x + COL_B.w - COL_A.x} height={CARD_H} rx={14} fill="none" stroke={PLATE_LINE} strokeWidth={2} strokeDasharray="10 8" />
                <Label x={(COL_A.x + COL_B.x + COL_B.w) / 2} y={CARD_Y + 150} text="0 candidates matched" size={24} color={colors.MUTED} anchor="middle" />
              </g>
            )}

            {/* ---------------- the stencil ---------------- */}
            <Stencil
              reveal={stencilU}
              entryU={entryU}
              focusG={g(scene.focusG)}
              status={candB > 0.5 ? stencilStatus : null}
              teethU={teethU}
              lockU={lockU}
              stripeU={procU}
              procRefuse={procU * badgeStale}
              valueToothU={valueToothU}
              tokenChip={tokenInStencil}
            />
            <EvidenceLayers u={g(scene.layerU)} />

            {/* beat 3 — the generation mismatch: notes live in the empty column A */}
            {procU > 0.6 && (
              <g opacity={seg(procU, 0.6, 1)}>
                <Chip x={COL_B.x + COL_B.w / 2} y={fieldY(1) - CARD_Y + CARD_Y} text="process_instance ≠" size={18} anchor="middle" color={colors.NEGATIVE} />
                <g opacity={badgeStale}>
                  <Label x={COL_A.x + COL_A.w / 2} y={CARD_Y + 230} text="refused before" size={24} color={colors.NEGATIVE} anchor="middle" />
                  <Label x={COL_A.x + COL_A.w / 2} y={CARD_Y + 262} text="the tree is read" size={24} color={colors.NEGATIVE} anchor="middle" />
                </g>
              </g>
            )}

            {/* beat 4 — position is not identity (column A is empty) */}
            {scenIdx === 2 && candB > 0.9 && (
              <g opacity={seg(teethU, 0.8, 1) * (1 - g(scene.outB))}>
                <Label x={COL_A.x + COL_A.w / 2} y={CARD_Y + 230} text="path aligned," size={24} color={ACCENT_LIGHT} anchor="middle" />
                <Label x={COL_A.x + COL_A.w / 2} y={CARD_Y + 262} text="identity does not" size={24} color={ACCENT_LIGHT} anchor="middle" />
              </g>
            )}

            {/* beat 6 — the rule, named (column A is empty) */}
            {fieldEntry && candB > 0.5 && (
              <g opacity={window01(editU, 0.15, 1, 0.1) * (1 - g(scene.outB))}>
                <Chip x={COL_A.x - 8} y={CARD_Y + 60} text="is_mutable_value_role" size={18} color={colors.WARM} />
                <Label x={COL_A.x + 4} y={CARD_Y + 120} text="textfield: value" size={24} color={colors.WARM} />
                <Label x={COL_A.x + 4} y={CARD_Y + 152} text="changes while typed" size={24} color={colors.WARM} />
                <Label x={COL_A.x + 4} y={CARD_Y + 210} text="name copied from" size={24} color={colors.WARM} />
                <Label x={COL_A.x + 4} y={CARD_Y + 242} text="the value: excluded" size={24} color={colors.WARM} />
                <g opacity={seg(lockU, 0, 1)}>
                  <Label x={COL_A.x + 4} y={CARD_Y + 300} text="native_id still" size={24} color={colors.POSITIVE} />
                  <Label x={COL_A.x + 4} y={CARD_Y + 332} text="identifies it" size={24} color={colors.POSITIVE} />
                </g>
              </g>
            )}

            {/* beat 7 — the geometry band under the comparator */}
            {gateU > 0.001 && (
              <g opacity={gateU}>
                <rect x={COL_A.x} y={BAND_Y} width={STENCIL.x + STENCIL.w - COL_A.x} height={48} rx={12} fill="#0c1426" stroke={PLATE_LINE} strokeWidth={2} />
                <Label x={COL_A.x + 14} y={BAND_Y + 32} text="geometry narrowed 2 → 1" size={24} color={colors.POSITIVE} />
                <Chip x={COL_A.x + 300} y={BAND_Y + 26} text="has_meaningful_identity" size={18} color={colors.MUTED} />
                <Label x={COL_A.x + 590} y={BAND_Y + 32} text="→ alone: closed" size={24} color={colors.MUTED} />
              </g>
            )}

            {/* refusals — beat 3 in the empty column A; beat 8 in the comparator, then the band */}
            <RefusalBadge x={scenIdx === 1 ? COL_A.x + COL_A.w / 2 : (COL_A.x + COL_B.x + COL_B.w) / 2} y={scenIdx === 1 ? CARD_Y + 160 : CARD_Y + 215} code="STALE_REF" u={badgeStale} size={22} />
            <RefusalBadge x={(COL_A.x + COL_B.x + COL_B.w) / 2} y={BAND_Y + 24} code="AMBIGUOUS_TARGET" u={badgeAmb} size={22} />

            {/* ---------------- the token (beats 0–2; later it lives in the stencil header) ---------------- */}
            {!tokenInStencil && <Chip x={g(scene.tokX)} y={g(scene.tokY)} text={TOKEN} size={18} anchor="middle" opacity={g(scene.tokU)} />}
          </g>
        )}
      </Camera>

      {/* ---------------- finale — opaque, screen-fixed; the old machine is fully hidden beneath ---------------- */}
      <OpaqueStrip x={170} y={120} w={940} h={400} opacity={g(scene.summaryU)}>
        <Label x={640} y={172} text="A ref is a claim, not an address." size={30} color={INK} anchor="middle" />
        <Label x={640} y={218} text="Missing match → STALE_REF" size={24} color={colors.MUTED} anchor="middle" />
        <Label x={640} y={254} text="Unresolved competing matches → AMBIGUOUS_TARGET" size={24} color={colors.MUTED} anchor="middle" />
        <Label x={640} y={290} text="(geometry may still narrow initial competitors first)" size={24} color={colors.MUTED} anchor="middle" />
        <Label x={640} y={334} text="Recovery: observe again, act with fresh refs." size={24} color={colors.POSITIVE} anchor="middle" />
        <g opacity={g(scene.freshU)} transform={`translate(0, ${lerp(30, 0, g(scene.freshU))})`}>
          <rect x={470} y={366} width={340} height={84} rx={12} fill="#0c1426" stroke={colors.POSITIVE} strokeWidth={2} />
          <Chip x={640} y={400} text={FRESH_TOKEN} size={22} anchor="middle" color={colors.POSITIVE} />
          <Label x={640} y={436} text="new snapshot · new stencil" size={24} color={colors.MUTED} anchor="middle" />
        </g>
        <Chip x={640} y={486} text={TOKEN} size={18} anchor="middle" color={colors.MUTED} opacity={0.14 * g(scene.freshU)} />
      </OpaqueStrip>
    </g>
  );
}

export const vizScene = () => scene;
