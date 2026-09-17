// The pause between intention and action
//
// Book 1 "The Next Useful Action", chapter 1 — PRODUCT VISION. Everything the
// assistant does on screen is labelled proposed; nothing here is measured.
// Sources: PROJECT_CHARTER.md — Mission; Browser-action invariants 2, 4, 10.
//          docs/decisions/2026-09-16-browser-action-goal.md — Decision.
//
// ONE persistent mechanism: the fictional Profile page and, beneath it, an
// UNSCALED work ribbon. The ribbon is traced by a person doing the task, its
// pauses stretch, one pause lifts out and unfolds into two decision routes,
// and at the close the same ribbon becomes the still-unfilled evidence bar.
// Pointer, solid focus ring, dashed suggestion halo, activation ripple and
// task state are five separate objects, each on its own channel.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 the goal; attention travels from the task to the page
//  2 a person finds Profile, the field, types, finds Save — the ribbon records it; pauses stretch
//  3 same task replayed; a proposed assistant would have to beat the pauses
//  4 one pause lifts into route A: model writes an action, executor, wait
//  5 route B (proposed): select among the actions available on the page now
//  6 person: halo approaches the field, Tab accepts, ONLY focus moves
//  7 agent: rank → check → one action → fresh observation
//  8 pull back: proposed experiences, evidence gates still empty
import { cumsum, curveBasis, interpolateBasis, interpolateObject, line, linkHorizontal, scaleLinear } from 'd3';
import type { ReactNode } from 'react';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Activation,
  FocusRing,
  Keycap,
  MONO,
  PAGE,
  Pointer,
  ProfilePage,
  ProposedTag,
  ROLE,
  SuggestHalo,
  TaskChip,
  captionPlan,
  controlRect,
  rectCenter,
} from './shared/profile-page';
import type { ControlId, ControlMark, PagePlacement, Rect } from './shared/profile-page';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Think about changing your display name on a website you already know. The task is small, but your attention still has to travel.',
  'Find the profile menu. Find the right field. Make the edit. Find save. Most of the effort lives between those little actions.',
  'A browser assistant could help by understanding the task and choosing the next useful move. The interesting question is how quickly it can do that reliably.',
  'Today, one possible approach asks a language model to describe an action, sends that answer to an executor, and waits for the page to respond.',
  'Our product vision adds another route: recognize a familiar situation and select from the useful actions available on the page right now.',
  'For a person, that might look like a subtle suggestion beside the next field. Pressing Tab would move focus there when the person accepts.',
  'For an authorized agent, the same kind of decision could become a checked browser action, followed by a fresh look at the result.',
  'These are proposed experiences. The project has to earn them by showing that people finish useful tasks faster, with mistakes kept within a declared budget.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;
const END = PLAN.end + 1.0;

/* ---------------------------------------------------------------- layout */
const PLACE: PagePlacement = { x: 60, y: 56, scale: 0.92 };
const PAGE_H = PAGE.h * PLACE.scale;
const R_MENU = controlRect('profile-menu', PLACE);
const R_NAME = controlRect('display-name-field', PLACE);
const R_SAVE = controlRect('save-button', PLACE);
const C_MENU = rectCenter(R_MENU);
const C_SAVE = rectCenter(R_SAVE);
const P_NAME = { x: R_NAME.x + 130, y: R_NAME.y + R_NAME.h / 2 };

const TASK = { x: 640, y: 56, w: 580 };
const LANE = { x: 640, w: 580, h: 36 };
const LANE_A_Y = 214;
const LANE_B_Y = 344;
const RIB = { x: 60, y: 510, w: 1160, h: 28 };
const RIB_CLOSE = { x: 260, y: 318, w: 760, h: 22 };

// Screen y = 360 + k·(y − cam.y). Captions own screen y ≥ 575, so every camera
// keeps the ribbon's lowest label (world y ≈ 573) and the page bottom (461) above it.
// CAM_LANES and CAM_FIELD frame only part of the stage: whatever falls outside
// them is faded to 0 BEFORE the camera moves, and restored after it returns.
const CAM_PAGE: CameraState = { x: 318, y: 291, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1 };
const CAM_RIBBON: CameraState = { x: 640, y: 368, k: 1.04 };
const CAM_LANES: CameraState = { x: 930, y: 200, k: 1.35 };
const CAM_BOTH: CameraState = { x: 640, y: 369, k: 1.05 };
const CAM_FIELD: CameraState = { x: 392, y: 295, k: 1.28 };

/* ---------------------------------------------- the work ribbon (unscaled) */
type SegKind = 'gap' | 'act';
const SEGS: { kind: SegKind; label: string }[] = [
  { kind: 'gap', label: 'find the Profile menu' },
  { kind: 'act', label: 'open' },
  { kind: 'gap', label: 'find the right field' },
  { kind: 'act', label: 'focus' },
  { kind: 'act', label: 'type' },
  { kind: 'gap', label: 'find Save' },
  { kind: 'act', label: 'save' },
];
const W_TRACE = SEGS.map((s) => (s.kind === 'gap' ? 1.4 : 1));
const W_STRETCH = SEGS.map((s) => (s.kind === 'gap' ? 2.6 : 0.45));
const CUM_TRACE = [0, ...Array.from(cumsum(W_TRACE))];
const TOT_TRACE = CUM_TRACE[CUM_TRACE.length - 1];
const traceAt = (i: number) => CUM_TRACE[i] / TOT_TRACE;
const LIFT_SEG = 2; // the pause that lifts out and becomes the routes

/** Segment x/width for a stretch amount, mapped onto any ribbon frame by a d3 scale. */
function ribbonLayout(stretch: number, x0: number, w: number): { x: number; w: number }[] {
  const ws = W_TRACE.map((a, i) => lerp(a, W_STRETCH[i], stretch));
  const cum = [0, ...Array.from(cumsum(ws))];
  const sx = scaleLinear([0, cum[cum.length - 1]], [x0, x0 + w]);
  return ws.map((_, i) => ({ x: sx(cum[i]), w: sx(cum[i + 1]) - sx(cum[i]) }));
}
const STRETCHED = ribbonLayout(1, RIB.x, RIB.w);
const LIFT_FROM: Rect = { x: STRETCHED[LIFT_SEG].x, y: RIB.y, w: STRETCHED[LIFT_SEG].w, h: RIB.h };
const LIFT_TO: Rect = { x: LANE.x, y: LANE_A_Y, w: LANE.w, h: LANE.h };
const liftRect = interpolateObject(LIFT_FROM, LIFT_TO);

/* ------------------------------------ the pointer's wandering search path */
const P0 = { x: 330, y: 420 };
const LEGS: { x: number; y: number }[][] = [
  [P0, { x: 236, y: 300 }, { x: 430, y: 336 }, { x: 372, y: 176 }, C_MENU],
  [C_MENU, { x: 470, y: 250 }, { x: 250, y: 330 }, { x: 140, y: 214 }, P_NAME],
  [P_NAME, { x: 330, y: 300 }, { x: 420, y: 396 }, { x: 236, y: 410 }, C_SAVE],
];
const LEG_FN = LEGS.map((pts) => ({
  x: interpolateBasis(pts.map((p) => p.x)),
  y: interpolateBasis(pts.map((p) => p.y)),
}));
const TRAIL_N = 40;
const TRAIL: { p: number; x: number; y: number }[] = LEG_FN.flatMap((f, leg) =>
  Array.from({ length: TRAIL_N + 1 }, (_, j) => ({ p: leg + j / TRAIL_N, x: f.x(j / TRAIL_N), y: f.y(j / TRAIL_N) })),
);
function pointerAt(p: number): { x: number; y: number } {
  const leg = Math.min(LEGS.length - 1, Math.max(0, Math.floor(p)));
  const u = clamp01(p - leg);
  return { x: LEG_FN[leg].x(u), y: LEG_FN[leg].y(u) };
}
const pathOf = line<{ x: number; y: number; p?: number }>()
  .x((d) => d.x)
  .y((d) => d.y);
const smooth = line<{ x: number; y: number }>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveBasis);

/** Attention travels from the task to the page (beat 1). */
const GAZE = {
  x: interpolateBasis([930, 770, 520, 400, P0.x]),
  y: interpolateBasis([84, 210, 250, 372, P0.y]),
};
const GAZE_TRAIL = Array.from({ length: 41 }, (_, j) => ({ p: j / 40, x: GAZE.x(j / 40), y: GAZE.y(j / 40) }));

/* ---------------------------------------------------- focus ring stations */
const FOCUS_LEG = [interpolateObject(R_MENU, R_NAME), interpolateObject(R_NAME, R_SAVE)];
function focusRectAt(pos: number): Rect {
  const leg = Math.min(1, Math.max(0, Math.floor(pos)));
  const r = FOCUS_LEG[leg](clamp01(pos - leg));
  return { x: r.x, y: r.y, w: r.w, h: r.h };
}
const haloGlide = interpolateObject(R_MENU, R_NAME);

/* ----------------------------------------------------------- the two routes */
const ROUTE_A = [
  { label: 'observe page', w: 90, color: ROLE.OBSERVE },
  { label: 'model writes an action, piece by piece', w: 300, color: ROLE.MODEL },
  { label: 'executor', w: 90, color: ROLE.OBSERVE },
  { label: 'page responds', w: 100, color: ROLE.PENDING },
];
const ROUTE_B = [
  { label: 'observe page', w: 90, color: ROLE.OBSERVE },
  { label: 'rank the actions available now', w: 300, color: ROLE.MODEL },
  { label: 'check', w: 90, color: ROLE.CHECKED },
  { label: 'one action', w: 100, color: ROLE.OBSERVE },
];
const blockX = (blocks: { w: number }[], i: number) => LANE.x + blocks.slice(0, i).reduce((a, b) => a + b.w, 0);
const TOKENS = ['click', ' the', ' “Display', ' name”', ' text', ' box', ' in', ' the', ' profile', ' form'];
const TILE_CONTROLS: ControlId[] = ['profile-menu', 'display-name-field', 'email-field', 'sign-out-link'];
const TILE_W = 64;
const tileX = (i: number) => blockX(ROUTE_B, 1) + 10 + i * (TILE_W + 8);
const TILE_LINKS = TILE_CONTROLS.map((id, i) => {
  const r = controlRect(id, PLACE);
  const s = { x: r.x + r.w + 6, y: r.y + r.h / 2 };
  const t = { x: tileX(i) + TILE_W / 2, y: LANE_B_Y - 2 };
  return smooth([s, { x: s.x + 90, y: s.y }, { x: t.x, y: t.y - 74 }, t]) ?? '';
});
const LOOP_PATH =
  smooth([
    { x: LANE.x + LANE.w - 50, y: LANE_B_Y + LANE.h + 2 },
    { x: LANE.x + LANE.w - 50, y: LANE_B_Y + LANE.h + 84 },
    { x: LANE.x + 45, y: LANE_B_Y + LANE.h + 84 },
    { x: LANE.x + 45, y: LANE_B_Y + LANE.h + 2 },
  ]) ?? '';

/* proposed assistant node (beat 3) */
const ASST = { x: 800, y: 226, w: 260, h: 64 };
const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();
const PAGE_TO_ASST = hlink({ source: [PLACE.x + PAGE.w * PLACE.scale + 4, 258], target: [ASST.x, 258] }) ?? '';
const GAP_IDX = [0, 2, 5];
const ASST_TO_GAPS = GAP_IDX.map((gi) => {
  const gx = STRETCHED[gi].x + STRETCHED[gi].w / 2;
  return smooth([
    { x: ASST.x + ASST.w / 2, y: ASST.y + ASST.h },
    { x: ASST.x + ASST.w / 2, y: 400 },
    { x: gx, y: 430 },
    { x: gx, y: RIB.y - 6 },
  ]) ?? '';
});

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAGE, cameraInterp);
  const phase = tl.channel('phase', 0);
  tl.tween(phase, END / 2.4, { at: 0, dur: END, ease: ease.linear });

  const pageU = tl.channel('pageU', 0);
  const taskU = tl.channel('taskU', 0);
  const taskP = tl.channel('taskP', 0);
  const gazeU = tl.channel('gazeU', 0);
  const gazeOp = tl.channel('gazeOp', 0);
  const ribbonU = tl.channel('ribbonU', 0);
  const traceU = tl.channel('traceU', 0);
  const stretchU = tl.channel('stretchU', 0);
  const ptrU = tl.channel('ptrU', 0);
  const ptrOp = tl.channel('ptrOp', 0);
  const trailU = tl.channel('trailU', 0);
  const formU = tl.channel('formU', 0);
  const menuOpenU = tl.channel('menuOpenU', 0);
  const typeU = tl.channel('typeU', 0);
  const savedU = tl.channel('savedU', 0);
  const focusU = tl.channel('focusU', 0);
  const focusPos = tl.channel('focusPos', 1);
  const act1 = tl.channel('act1 open menu', 0);
  const act2 = tl.channel('act2 focus field', 0);
  const act3 = tl.channel('act3 save', 0);
  const act4 = tl.channel('act4 agent fill', 0);
  const rewindU = tl.channel('rewindU', 0);
  const asstU = tl.channel('asstU', 0);
  const asstLinkU = tl.channel('asstLinkU', 0);
  const gapHatchU = tl.channel('gapHatchU', 0);
  const askU = tl.channel('askU', 0);
  const liftU = tl.channel('liftU', 0);
  const subAU = tl.channel('subAU', 0);
  const routeA = tl.channel('routeA', 0);
  const laneADim = tl.channel('laneADim', 1);
  const laneBU = tl.channel('laneBU', 0);
  const laneBDim = tl.channel('laneBDim', 1);
  const routeB = tl.channel('routeB', 0);
  const marksU = tl.channel('marksU', 0);
  const linksU = tl.channel('linksU', 0);
  const noteU = tl.channel('noteU', 0);
  const obsU = tl.channel('obsU', 0);
  const obsV = tl.channel('obsV', 12);
  const obsPop = tl.channel('obsPop', 0);
  const personTagU = tl.channel('personTagU', 0);
  const haloU = tl.channel('haloU', 0);
  const haloMoveU = tl.channel('haloMoveU', 0);
  const hintU = tl.channel('hintU', 0);
  const tabPress = tl.channel('tabPress', 0);
  const acceptedU = tl.channel('acceptedU', 0);
  const agentTagU = tl.channel('agentTagU', 0);
  const checkU = tl.channel('checkU', 0);
  const loopU = tl.channel('loopU', 0);
  const scanU = tl.channel('scanU', 0);
  const closeU = tl.channel('closeU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const braceU = tl.channel('braceU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const ribOp = tl.channel('ribOp', 1);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · the goal; attention has to travel — */
  let b = AT[0];
  tl.tween(pageU, 1, { at: b + 0.2, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: b + 2.0, dur: 1.6, ease: ease.move });
  tl.tween(taskU, 1, { at: b + 3.3, dur: 0.7, ease: ease.enter });
  tl.tween(gazeOp, 1, { at: b + 4.4, dur: 0.5, ease: ease.enter });
  tl.tween(gazeU, 1, { at: b + 4.8, dur: 3.4, ease: ease.move });
  tl.tween(ribbonU, 1, { at: b + 6.0, dur: 1.4, ease: ease.draw });

  /* — beat 2 · a person does it; the ribbon records; pauses stretch — */
  b = AT[1];
  tl.tween(gazeOp, 0, { at: b, dur: 0.5, ease: ease.enter });
  tl.tween(ptrOp, 1, { at: b, dur: 0.3, ease: ease.enter });
  tl.tween(trailU, 1, { at: b, dur: 0.3, ease: ease.enter });
  tl.tween(ptrU, 1, { at: b + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(traceU, traceAt(1), { at: b + 0.2, dur: 1.2, ease: ease.linear });
  tl.tween(act1, 1, { at: b + 1.4, dur: 0.6, ease: ease.linear });
  tl.tween(menuOpenU, 1, { at: b + 1.45, dur: 0.25, ease: ease.enter });
  tl.tween(formU, 1, { at: b + 1.75, dur: 0.5, ease: ease.move });
  tl.tween(menuOpenU, 0, { at: b + 1.9, dur: 0.3, ease: ease.enter });
  tl.tween(traceU, traceAt(2), { at: b + 1.4, dur: 0.5, ease: ease.linear });
  tl.tween(ptrU, 2, { at: b + 1.9, dur: 1.1, ease: ease.move });
  tl.tween(traceU, traceAt(3), { at: b + 1.9, dur: 1.1, ease: ease.linear });
  tl.tween(act2, 1, { at: b + 3.0, dur: 0.6, ease: ease.linear });
  tl.tween(focusU, 1, { at: b + 3.05, dur: 0.3, ease: ease.enter });
  tl.tween(taskP, 1, { at: b + 3.1, dur: 0.3, ease: ease.enter });
  tl.tween(traceU, traceAt(4), { at: b + 3.0, dur: 0.3, ease: ease.linear });
  tl.tween(typeU, 1, { at: b + 3.3, dur: 1.1, ease: ease.linear });
  tl.tween(traceU, traceAt(5), { at: b + 3.3, dur: 1.1, ease: ease.linear });
  tl.tween(taskP, 2, { at: b + 4.4, dur: 0.3, ease: ease.enter });
  tl.tween(ptrU, 3, { at: b + 4.5, dur: 1.0, ease: ease.move });
  tl.tween(traceU, traceAt(6), { at: b + 4.5, dur: 1.0, ease: ease.linear });
  tl.tween(act3, 1, { at: b + 5.5, dur: 0.6, ease: ease.linear });
  tl.tween(focusPos, 2, { at: b + 5.5, dur: 0.35, ease: ease.move });
  tl.tween(traceU, 1, { at: b + 5.5, dur: 0.5, ease: ease.linear });
  tl.tween(savedU, 1, { at: b + 5.9, dur: 0.4, ease: ease.pop });
  tl.tween(taskP, 3, { at: b + 6.0, dur: 0.3, ease: ease.enter });
  tl.tween(stretchU, 1, { at: b + 6.6, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAM_RIBBON, { at: b + 6.4, dur: 1.4, ease: ease.move });

  /* — beat 3 · replay the task; a proposed assistant must beat the pauses — */
  b = AT[2];
  tl.tween(rewindU, 1, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(typeU, 0, { at: b + 0.3, dur: 0.5, ease: ease.linear });
  tl.tween(savedU, 0, { at: b + 0.3, dur: 0.4, ease: ease.enter });
  tl.tween(taskP, 0, { at: b + 0.3, dur: 0.5, ease: ease.enter });
  tl.tween(focusPos, 0, { at: b + 0.3, dur: 0.9, ease: ease.move });
  tl.tween(ptrOp, 0, { at: b + 0.3, dur: 0.5, ease: ease.enter });
  tl.tween(trailU, 0.22, { at: b + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(rewindU, 0, { at: b + 3.4, dur: 0.6, ease: ease.enter });
  tl.tween(asstU, 1, { at: b + 1.2, dur: 0.7, ease: ease.enter });
  tl.tween(asstLinkU, 1, { at: b + 2.2, dur: 1.5, ease: ease.draw });
  tl.tween(gapHatchU, 1, { at: b + 4.0, dur: 0.9, ease: ease.enter });
  tl.tween(askU, 1, { at: b + 6.6, dur: 0.6, ease: ease.pop });

  /* — beat 4 · one pause lifts out: route A, one possible approach today — */
  b = AT[3];
  tl.tween(asstU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(asstLinkU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(askU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(gapHatchU, 0.3, { at: b + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(trailU, 0, { at: b + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(liftU, 1, { at: b + 0.6, dur: 1.3, ease: ease.move });
  // the page and the ribbon leave completely before the push-in, so nothing is cut at the frame edge
  tl.tween(pageU, 0, { at: b + 1.1, dur: 0.7, ease: ease.enter });
  tl.tween(ribOp, 0, { at: b + 1.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LANES, { at: b + 1.9, dur: 1.3, ease: ease.move });
  tl.tween(subAU, 1, { at: b + 2.0, dur: 0.6, ease: ease.enter });
  tl.tween(routeA, 1, { at: b + 2.4, dur: 0.8, ease: ease.linear });
  tl.tween(routeA, 2, { at: b + 3.2, dur: 3.2, ease: ease.linear });
  tl.tween(routeA, 3, { at: b + 6.4, dur: 1.4, ease: ease.linear });
  tl.tween(routeA, 4, { at: b + 7.8, dur: 1.8, ease: ease.linear });

  /* — beat 5 · route B, proposed: select among the actions available now — */
  b = AT[4];
  tl.tween(cam, CAM_BOTH, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(laneBU, 1, { at: b + 0.5, dur: 1.2, ease: ease.draw });
  // page and ribbon return only once the pull-back has them fully in frame
  tl.tween(pageU, 1, { at: b + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(ribOp, 1, { at: b + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(noteU, 1, { at: b + 1.5, dur: 0.6, ease: ease.enter });
  tl.tween(obsU, 1, { at: b + 1.4, dur: 0.5, ease: ease.enter });
  tl.tween(marksU, 1, { at: b + 1.6, dur: 1.2, ease: ease.enter });
  tl.tween(linksU, 1, { at: b + 2.6, dur: 1.4, ease: ease.draw });
  tl.tween(routeB, 1, { at: b + 3.2, dur: 0.8, ease: ease.linear });
  tl.tween(routeB, 2, { at: b + 4.0, dur: 2.2, ease: ease.linear });
  tl.tween(routeB, 3, { at: b + 6.2, dur: 1.0, ease: ease.linear });
  tl.tween(routeB, 4, { at: b + 7.2, dur: 1.0, ease: ease.linear });

  /* — beat 6 · person: a suggestion approaches; Tab moves ONLY focus — */
  b = AT[5];
  // everything CAM_FIELD would cut (lanes, task, ribbon) fades to 0 first; the legend arrives after
  tl.tween(laneADim, 0, { at: b + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(laneBDim, 0, { at: b + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(taskU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(ribOp, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(marksU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(linksU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(noteU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_FIELD, { at: b + 0.7, dur: 1.3, ease: ease.move });
  tl.tween(personTagU, 1, { at: b + 1.9, dur: 0.6, ease: ease.enter });
  tl.tween(haloU, 1, { at: b + 2.1, dur: 0.6, ease: ease.enter });
  tl.tween(haloMoveU, 1, { at: b + 2.5, dur: 1.6, ease: ease.move });
  tl.tween(hintU, 1, { at: b + 4.2, dur: 0.6, ease: ease.enter });
  tl.set(routeB, 0, b + 3.0);
  tl.tween(tabPress, 1, { at: b + 5.6, dur: 0.18, ease: ease.enter });
  tl.tween(tabPress, 0, { at: b + 6.0, dur: 0.3, ease: ease.enter });
  tl.tween(focusPos, 1, { at: b + 5.85, dur: 0.9, ease: ease.move });
  tl.tween(haloU, 0, { at: b + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(taskP, 1, { at: b + 6.9, dur: 0.3, ease: ease.enter });
  tl.tween(acceptedU, 1, { at: b + 7.0, dur: 0.5, ease: ease.pop });

  /* — beat 7 · agent: rank → check → one action → fresh observation — */
  b = AT[6];
  tl.tween(acceptedU, 0, { at: b, dur: 0.5, ease: ease.enter });
  tl.tween(personTagU, 0, { at: b, dur: 0.5, ease: ease.enter });
  tl.tween(hintU, 0, { at: b, dur: 0.5, ease: ease.enter });
  // person-mode chips are gone before the pull-back; offstage layers return once it has them in frame
  tl.tween(cam, CAM_BOTH, { at: b + 0.5, dur: 1.2, ease: ease.move });
  tl.tween(laneADim, 0.1, { at: b + 1.5, dur: 0.6, ease: ease.move });
  tl.tween(laneBDim, 1, { at: b + 1.5, dur: 0.6, ease: ease.move });
  tl.tween(taskU, 1, { at: b + 1.5, dur: 0.6, ease: ease.enter });
  tl.tween(ribOp, 1, { at: b + 1.5, dur: 0.6, ease: ease.enter });
  tl.tween(agentTagU, 1, { at: b + 1.7, dur: 0.6, ease: ease.enter });
  tl.tween(marksU, 1, { at: b + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(routeB, 1, { at: b + 1.8, dur: 0.5, ease: ease.linear });
  tl.tween(routeB, 2, { at: b + 2.3, dur: 1.1, ease: ease.linear });
  tl.tween(routeB, 3, { at: b + 3.4, dur: 1.4, ease: ease.linear });
  tl.tween(checkU, 1, { at: b + 4.3, dur: 0.5, ease: ease.pop });
  tl.tween(routeB, 4, { at: b + 4.8, dur: 1.2, ease: ease.linear });
  tl.tween(act4, 1, { at: b + 5.1, dur: 0.7, ease: ease.linear });
  tl.tween(typeU, 1, { at: b + 5.4, dur: 1.0, ease: ease.linear });
  tl.tween(taskP, 2, { at: b + 6.4, dur: 0.3, ease: ease.enter });
  tl.tween(loopU, 1, { at: b + 6.4, dur: 1.3, ease: ease.draw });
  tl.tween(scanU, 1, { at: b + 7.2, dur: 1.6, ease: ease.linear });
  tl.set(obsV, 13, b + 8.8);
  tl.tween(obsPop, 1, { at: b + 8.8, dur: 0.3, ease: ease.pop });
  tl.tween(obsPop, 0, { at: b + 9.3, dur: 0.6, ease: ease.enter });

  /* — beat 8 · pull back: proposed, and still to be earned — */
  b = AT[7];
  tl.tween(cam, CAM_WIDE, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(agentTagU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(marksU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(loopU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(gapHatchU, 0, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(closeU, 1, { at: b + 0.5, dur: 1.5, ease: ease.move });
  tl.tween(rowsU, 1, { at: b + 1.6, dur: 1.6, ease: ease.enter });
  tl.tween(braceU, 1, { at: b + 3.8, dur: 1.2, ease: ease.draw });
  tl.tween(gatesU, 1, { at: b + 5.2, dur: 3.2, ease: ease.linear });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, phase, pageU, taskU, taskP, gazeU, gazeOp, ribbonU, traceU, stretchU, ptrU, ptrOp, trailU, formU,
    menuOpenU, typeU, savedU, focusU, focusPos, act1, act2, act3, act4, rewindU, asstU, asstLinkU, gapHatchU, askU,
    liftU, subAU, routeA, laneADim, laneBU, laneBDim, routeB, marksU, linksU, noteU, obsU, obsV, obsPop, personTagU,
    haloU, haloMoveU, hintU, tabPress, acceptedU, agentTagU, checkU, loopU, scanU, closeU, rowsU, braceU, gatesU, ribOp,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */

/** A small labelled pill. */
function Chip({ x, y, text, color, u, fill = '#0b1324', anchor = 'start' }: { x: number; y: number; text: string; color: string; u: number; fill?: string; anchor?: 'start' | 'middle' }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const w = text.length * 6.4 + 22;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g transform={`translate(${x0} ${y})`} opacity={o}>
      <rect width={w} height={22} rx={11} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={w / 2} y={15} textAnchor="middle" fill={color} fontSize={10.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** Task state — its own object: three checkpoints that fill as the task advances. */
function TaskState({ u, p }: { u: number; p: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const steps = ['name field reached', 'name edited', 'saved'];
  return (
    <g transform={`translate(${TASK.x} ${TASK.y + 66})`} opacity={o}>
      <text x={0} y={15} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} letterSpacing={1}>
        TASK STATE
      </text>
      {steps.map((label, i) => {
        const done = clamp01(p - i);
        const x = 92 + i * 164;
        return (
          <g key={label} transform={`translate(${x} 0)`}>
            <rect width={154} height={22} rx={11} fill="#0b1324" stroke={done > 0.5 ? ROLE.CHECKED : '#334155'} strokeWidth={1.2} />
            <circle cx={13} cy={11} r={5} fill="none" stroke={colors.MUTED} strokeWidth={1.4} opacity={1 - done} />
            <path d="M8.5 11.2 L12 14.6 L18 7.6" fill="none" stroke={ROLE.CHECKED} strokeWidth={2} opacity={done} />
            <text x={26} y={15} fill={done > 0.5 ? ROLE.CHECKED : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Legend for the three conventions — shape AND label, never colour alone. */
function FocusLegend({ u }: { u: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g transform={`translate(584 150)`} opacity={o}>
      <rect width={140} height={156} rx={10} fill={colors.BG} stroke="#2a3754" />
      <rect x={12} y={16} width={26} height={16} rx={5} fill="none" stroke="#f1f5f9" strokeWidth={2.4} />
      <text x={48} y={24} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
        solid ring
      </text>
      <text x={48} y={38} fill={colors.MUTED} fontSize={10}>
        actual focus
      </text>
      <rect x={12} y={64} width={26} height={16} rx={6} fill="none" stroke={ROLE.MODEL} strokeWidth={2} strokeDasharray="5 4" />
      <text x={48} y={72} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
        dashed halo
      </text>
      <text x={48} y={86} fill={colors.MUTED} fontSize={10}>
        suggestion only
      </text>
      <circle cx={25} cy={120} r={9} fill="none" stroke={ROLE.OBSERVE} strokeWidth={2} />
      <path d="M19 120H31M25 114V126" stroke="#f1f5f9" strokeWidth={1.6} />
      <text x={48} y={118} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
        ripple
      </text>
      <text x={48} y={132} fill={colors.MUTED} fontSize={10}>
        activation —
      </text>
      <text x={48} y={144} fill={colors.MUTED} fontSize={10}>
        never from Tab
      </text>
    </g>
  );
}

/** The unscaled work ribbon — the chapter's persistent object. */
function WorkRibbon({ s }: { s: SceneState }) {
  const ru = s.get(scene.ribbonU);
  if (ru <= 0.002) return null;
  const close = s.get(scene.closeU);
  const stretch = s.get(scene.stretchU);
  const trace = s.get(scene.traceU) * TOT_TRACE;
  const hatch = s.get(scene.gapHatchU);
  const lift = s.get(scene.liftU);
  const x0 = lerp(RIB.x, RIB_CLOSE.x, close);
  const y0 = lerp(RIB.y, RIB_CLOSE.y, close);
  const w = lerp(RIB.w, RIB_CLOSE.w, close);
  const h = lerp(RIB.h, RIB_CLOSE.h, close);
  const segs = ribbonLayout(stretch, x0, w);
  const labelsO = 1 - clamp01(close * 2.5);
  return (
    <g opacity={s.get(scene.ribOp)}>
      <defs>
        <pattern id="nua1-hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={3} height={8} fill={ROLE.PENDING} />
        </pattern>
      </defs>
      {/* heading + honesty label */}
      <g opacity={ru * labelsO}>
        <text x={x0} y={y0 - 14} fill={colors.TEXT} fontSize={13} fontWeight={650}>
          work ribbon
        </text>
        <text x={x0 + 88} y={y0 - 14} fill={ROLE.PENDING} fontSize={10.5} fontFamily={MONO}>
          unscaled · widths are not measurements
        </text>
      </g>
      {/* track */}
      <rect x={x0} y={y0} width={w * clamp01(ru)} height={h} rx={h / 2} fill="#0b1324" stroke="#2a3754" strokeWidth={1.2} />
      {segs.map((g, i) => {
        const seg = SEGS[i];
        const vis = clamp01((trace - CUM_TRACE[i]) / W_TRACE[i]);
        if (vis <= 0.002) return null;
        const isGap = seg.kind === 'gap';
        const lifted = i === LIFT_SEG ? clamp01(lift * 3) : 0;
        const fillO = lerp(isGap ? 0.55 : 0.95, 0.1, close);
        return (
          <g key={i}>
            <rect
              x={g.x + 1.5}
              y={y0 + 3}
              width={Math.max(0, g.w * vis - 3)}
              height={h - 6}
              rx={isGap ? 4 : 3}
              fill={isGap ? '#334155' : ROLE.OBSERVE}
              opacity={fillO * (1 - 0.6 * lifted)}
            />
            <rect
              x={g.x + 1.5}
              y={y0 + 3}
              width={Math.max(0, g.w * vis - 3)}
              height={h - 6}
              rx={isGap ? 4 : 3}
              fill="none"
              stroke={isGap ? colors.MUTED : ROLE.OBSERVE}
              strokeWidth={1}
              strokeDasharray={close > 0.5 ? '4 3' : undefined}
              opacity={0.8}
            />
            {isGap && hatch > 0.002 && (
              <rect x={g.x + 1.5} y={y0 + 3} width={Math.max(0, g.w - 3)} height={h - 6} rx={4} fill="url(#nua1-hatch)" opacity={0.42 * hatch * (1 - close)} />
            )}
            {/* labels: actions above, pauses below */}
            <text
              x={g.x + (g.w * vis) / 2}
              y={y0 + h + 16}
              textAnchor="middle"
              fill={isGap ? colors.MUTED : ROLE.OBSERVE}
              fontSize={isGap ? 11 : 10.5}
              fontFamily={isGap ? undefined : MONO}
              fontStyle={isGap ? 'italic' : undefined}
              opacity={labelsO * clamp01(vis * 3 - 1.6)}
            >
              {isGap ? `pause · ${seg.label}` : seg.label}
            </text>
          </g>
        );
      })}
      {/* end labels */}
      <text x={x0} y={y0 + h + 32} fill={colors.MUTED} fontSize={11} opacity={ru * labelsO}>
        ● intention
      </text>
      <text x={x0 + w} y={y0 + h + 32} textAnchor="end" fill={colors.MUTED} fontSize={11} opacity={ru * labelsO * clamp01(trace / TOT_TRACE * 8 - 7)}>
        task done ●
      </text>
    </g>
  );
}

/** A route lane: blocks that light up as a linear progress channel passes. */
function RouteLane({
  y, blocks, title, sub, titleColor, reveal, progress, dim, base, children,
}: {
  y: number;
  blocks: { label: string; w: number; color: string }[];
  title: string;
  sub: string;
  titleColor: string;
  reveal: number;
  progress: number;
  dim: number;
  base?: Rect;
  children?: ReactNode;
}) {
  const live = clamp01(progress * 4) * clamp01((blocks.length - progress) * 4);
  const r = clamp01(reveal);
  if (r <= 0.002 && !base) return null;
  const frame = base ?? { x: LANE.x, y, w: LANE.w * r, h: LANE.h };
  return (
    <g opacity={dim}>
      <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx={8} fill="#0d1526" stroke="#33415f" strokeWidth={1.3} />
      <g opacity={r}>
        <text x={LANE.x} y={y - 26} fill={titleColor} fontSize={12} fontFamily={MONO} letterSpacing={0.8}>
          {title}
        </text>
        <text x={LANE.x} y={y - 9} fill={colors.MUTED} fontSize={11.5}>
          {sub}
        </text>
        {blocks.map((bk, i) => {
          const x = blockX(blocks, i);
          if (x - LANE.x > LANE.w * r) return null;
          const active = live * clamp01(1.5 - Math.abs(progress - (i + 0.5)) * 2);
          const done = clamp01(progress - i);
          return (
            <g key={bk.label}>
              <rect x={x + 2} y={y + 2} width={bk.w - 4} height={LANE.h - 4} rx={6} fill={bk.color} opacity={0.08 + 0.1 * done + 0.2 * active} />
              <rect x={x + 2} y={y + 2} width={bk.w - 4} height={LANE.h - 4} rx={6} fill="none" stroke={bk.color} strokeWidth={1 + active} opacity={0.45 + 0.55 * active} />
              {bk.w < 200 && (
                <text x={x + bk.w / 2} y={y + LANE.h / 2 + 4} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} opacity={0.75 + 0.25 * active}>
                  {bk.label}
                </text>
              )}
            </g>
          );
        })}
        {children}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const quiet = 1 - 0.92 * close; // everything behind the closing panel → a whisper
  const phase = s.get(scene.phase);
  const marksU = s.get(scene.marksU);
  const ptrU = s.get(scene.ptrU);
  const ptr = pointerAt(ptrU);
  const trailU = s.get(scene.trailU);
  const gazeU = s.get(scene.gazeU);
  const gazeOp = s.get(scene.gazeOp);
  const focusRect = focusRectAt(s.get(scene.focusPos));
  const haloR = haloGlide(s.get(scene.haloMoveU));
  const haloRect: Rect = { x: haloR.x, y: haloR.y, w: haloR.w, h: haloR.h };
  const routeA = s.get(scene.routeA);
  const routeB = s.get(scene.routeB);
  const lift = s.get(scene.liftU);
  const lr = liftRect(lift);
  const liftBase: Rect = { x: lr.x, y: lr.y, w: lr.w, h: lr.h };
  const tokN = Math.floor(clamp01(routeA - 1) * TOKENS.length + 1e-6);
  const asstU = s.get(scene.asstU);
  const asstLinkU = s.get(scene.asstLinkU);
  const scanU = s.get(scene.scanU);
  const checkU = s.get(scene.checkU);
  const selected = clamp01((routeB - 1.35) * 3);
  const agent = s.get(scene.agentTagU);
  const rowsU = s.get(scene.rowsU);
  const gatesU = s.get(scene.gatesU);
  const braceU = s.get(scene.braceU);

  const marks: ControlMark[] = [
    ...TILE_CONTROLS.map((id, i) => ({ id, u: clamp01(marksU * 5 - i), color: ROLE.OBSERVE, tag: `c${i + 1}` })),
    { id: 'save-button' as ControlId, u: clamp01(marksU * 5 - 4), color: colors.MUTED, dashed: true, tag: 'disabled' },
  ];

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={quiet}>
        {/* the recurring page */}
        <ProfilePage
          place={PLACE}
          opacity={s.get(scene.pageU)}
          formU={s.get(scene.formU)}
          typeU={s.get(scene.typeU)}
          savedU={s.get(scene.savedU)}
          menuOpenU={s.get(scene.menuOpenU)}
          marks={marks}
          obsLabel={`observation v${Math.round(s.get(scene.obsV))}`}
          obsU={s.get(scene.obsU)}
        />
        {s.get(scene.obsPop) > 0.002 && (
          <rect
            x={PLACE.x + 400 * PLACE.scale - 4}
            y={PLACE.y + 8 * PLACE.scale - 4}
            width={148 * PLACE.scale + 8}
            height={20 * PLACE.scale + 8}
            rx={13}
            fill="none"
            stroke={ROLE.OBSERVE}
            strokeWidth={2.5}
            opacity={s.get(scene.obsPop)}
          />
        )}
        {/* fresh observation sweep */}
        {scanU > 0.002 && scanU < 0.998 && (
          <g opacity={Math.sin(scanU * Math.PI)}>
            <rect x={PLACE.x} y={PLACE.y + scanU * PAGE_H - 26} width={PAGE.w * PLACE.scale} height={26} fill={ROLE.OBSERVE} opacity={0.12} />
            <line x1={PLACE.x} x2={PLACE.x + PAGE.w * PLACE.scale} y1={PLACE.y + scanU * PAGE_H} y2={PLACE.y + scanU * PAGE_H} stroke={ROLE.OBSERVE} strokeWidth={2.2} />
          </g>
        )}
        <Chip x={PLACE.x + 268} y={PLACE.y + 90} text="↺ same page, same task — replayed" color={colors.MUTED} u={s.get(scene.rewindU)} />

        {/* attention, then the pointer and its search trail */}
        {gazeOp > 0.002 && (
          <g opacity={gazeOp}>
            <path d={pathOf(GAZE_TRAIL.filter((d) => d.p <= gazeU)) ?? ''} fill="none" stroke="#f1f5f9" strokeWidth={1.4} strokeDasharray="2 6" strokeLinecap="round" opacity={0.6} />
            <circle cx={GAZE.x(gazeU)} cy={GAZE.y(gazeU)} r={13} fill="#f1f5f9" opacity={0.1} />
            <circle cx={GAZE.x(gazeU)} cy={GAZE.y(gazeU)} r={6} fill="none" stroke="#f1f5f9" strokeWidth={1.8} />
            <text x={GAZE.x(gazeU) + 16} y={GAZE.y(gazeU) - 10} fill="#f1f5f9" fontSize={11} fontFamily={MONO} opacity={0.85}>
              attention
            </text>
          </g>
        )}
        {trailU > 0.002 && ptrU > 0.002 && (
          <path d={pathOf([...TRAIL.filter((d) => d.p <= ptrU), { p: ptrU, ...ptr }]) ?? ''} fill="none" stroke="#f1f5f9" strokeWidth={1.5} strokeDasharray="3 5" strokeLinecap="round" opacity={0.55 * trailU} />
        )}

        {/* actual keyboard focus (solid) · suggestion (dashed halo) · activation (ripple) */}
        <FocusRing rect={focusRect} u={s.get(scene.focusU) * s.get(scene.pageU)} />
        <SuggestHalo rect={haloRect} u={s.get(scene.haloU)} phase={phase} label="suggestion" />
        {/* the hint sits in the page's reserved gutter, beside the field */}
        <Keycap x={R_NAME.x + R_NAME.w + 26} y={R_NAME.y + R_NAME.h / 2 - 13} label="Tab ⇥" u={s.get(scene.hintU)} press={s.get(scene.tabPress)} />
        <text x={R_NAME.x + R_NAME.w + 26} y={R_NAME.y + R_NAME.h / 2 + 34} fill={ROLE.MODEL} fontSize={10.5} fontFamily={MONO} opacity={s.get(scene.hintU)}>
          accept → focus here
        </text>
        <Chip x={PLACE.x} y={24} text="person · assistive mode" color={colors.TEXT} u={s.get(scene.personTagU)} />
        <ProposedTag x={PLACE.x + 178} y={26} u={s.get(scene.personTagU)} />
        <Chip x={PLACE.x + 268} y={24} text="✓ focus moved · nothing activated" color={ROLE.CHECKED} fill="#062a1e" u={s.get(scene.acceptedU)} />
        <FocusLegend u={s.get(scene.personTagU)} />
        <Activation x={C_MENU.x} y={C_MENU.y} u={s.get(scene.act1)} label="click" />
        <Activation x={P_NAME.x} y={P_NAME.y} u={s.get(scene.act2)} label="click" />
        <Activation x={C_SAVE.x} y={C_SAVE.y} u={s.get(scene.act3)} label="click" />
        <Activation x={P_NAME.x} y={P_NAME.y} u={s.get(scene.act4)} label="checked action: fill" />
        <Pointer x={ptr.x} y={ptr.y} opacity={s.get(scene.ptrOp)} />

        {/* the explicit task and its state */}
        <TaskChip x={TASK.x} y={TASK.y} w={TASK.w} u={s.get(scene.taskU)} />
        <TaskState u={s.get(scene.taskU)} p={s.get(scene.taskP)} />

        {/* beat 3 — a proposed assistant, wired to the task, the page, and the pauses */}
        {asstU > 0.002 && (
          <g opacity={asstU}>
            <path d={`M${ASST.x + ASST.w / 2} ${TASK.y + 96}V${ASST.y}`} stroke={ROLE.MODEL} strokeWidth={1.6} pathLength={1} strokeDasharray={`${clamp01(asstLinkU * 3)} 1`} fill="none" />
            <path d={PAGE_TO_ASST} stroke={ROLE.OBSERVE} strokeWidth={1.6} fill="none" pathLength={1} strokeDasharray={`${clamp01(asstLinkU * 3)} 1`} />
            {ASST_TO_GAPS.map((d, i) => (
              <path key={i} d={d} stroke={ROLE.MODEL} strokeWidth={1.6} fill="none" pathLength={1} strokeDasharray={`${clamp01(asstLinkU * 1.6 - 0.3 - i * 0.12)} 1`} opacity={0.85} />
            ))}
            <rect x={ASST.x} y={ASST.y} width={ASST.w} height={ASST.h} rx={14} fill="#171335" stroke={ROLE.MODEL} strokeWidth={1.8} />
            <text x={ASST.x + ASST.w / 2} y={ASST.y + 27} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={650}>
              browser assistant
            </text>
            <text x={ASST.x + ASST.w / 2} y={ASST.y + 47} textAnchor="middle" fill={ROLE.MODEL} fontSize={11} fontFamily={MONO}>
              understand task → next useful move
            </text>
            <ProposedTag x={ASST.x + ASST.w + 10} y={ASST.y + 4} u={1} />
            {GAP_IDX.map((gi) => {
              const gx = STRETCHED[gi].x + STRETCHED[gi].w / 2;
              const du = clamp01(asstLinkU * 2 - 1);
              return <path key={gi} d={`M${gx} ${RIB.y - 16}l7 7l-7 7l-7 -7Z`} fill="#171335" stroke={ROLE.MODEL} strokeWidth={1.6} opacity={du} />;
            })}
          </g>
        )}
        <Chip x={820} y={RIB.y - 52} anchor="middle" text="? how quickly — and how reliably — could a decision replace each pause" color={ROLE.PENDING} fill="#2a1f08" u={s.get(scene.askU)} />

        {/* beats 4–5 — the lifted pause unfolds into two routes */}
        <RouteLane
          y={LANE_A_Y}
          blocks={ROUTE_A}
          title="ROUTE A · one possible approach today"
          sub="a language model describes an action → an executor runs it → wait"
          titleColor={colors.TEXT}
          reveal={s.get(scene.subAU)}
          progress={routeA}
          dim={clamp01(lift * 8) * s.get(scene.laneADim)}
          base={liftBase}
        >
          {TOKENS.map((_, i) => {
            const x = blockX(ROUTE_A, 1) + 9 + i * 28.4;
            const on = i < tokN ? 1 : 0;
            return <rect key={i} x={x} y={LANE_A_Y + 9} width={24} height={LANE.h - 18} rx={3} fill={ROLE.MODEL} opacity={0.14 + 0.76 * on} />;
          })}
          <text x={blockX(ROUTE_A, 1)} y={LANE_A_Y + LANE.h + 18} fill={ROLE.MODEL} fontSize={11.5} fontFamily={MONO}>
            {TOKENS.slice(0, tokN).join('')}
            {tokN > 0 && tokN < TOKENS.length ? '▍' : ''}
          </text>
          <text x={blockX(ROUTE_A, 1)} y={LANE_A_Y + LANE.h + 35} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={clamp01(routeA - 1)}>
            illustrative output · not real tokenization
          </text>
        </RouteLane>

        <RouteLane
          y={LANE_B_Y}
          blocks={ROUTE_B}
          title="ROUTE B · our product vision"
          sub="recognize a familiar situation → select from the actions on the page right now"
          titleColor={ROLE.MODEL}
          reveal={s.get(scene.laneBU)}
          progress={routeB}
          dim={s.get(scene.laneBDim)}
        >
          {TILE_CONTROLS.map((id, i) => {
            const sel = i === 1 ? selected : 0;
            return (
              <g key={id}>
                <rect x={tileX(i)} y={LANE_B_Y + 6} width={TILE_W} height={LANE.h - 12} rx={5} fill={sel > 0.5 ? '#2a1f57' : '#0b1324'} stroke={sel > 0.5 ? ROLE.MODEL : ROLE.OBSERVE} strokeWidth={1.1 + sel * 1.2} />
                <text x={tileX(i) + TILE_W / 2} y={LANE_B_Y + LANE.h / 2 + 4} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                  c{i + 1}
                </text>
              </g>
            );
          })}
          {/* check block turns into a checked outcome */}
          <path
            d={`M${blockX(ROUTE_B, 2) + 12} ${LANE_B_Y + 18}l5 5l9 -10`}
            fill="none"
            stroke={ROLE.CHECKED}
            strokeWidth={2.4}
            opacity={checkU}
          />
          <text x={blockX(ROUTE_B, 1)} y={LANE_B_Y + LANE.h + 18} fill={ROLE.MODEL} fontSize={11.5} fontFamily={MONO} opacity={selected}>
            {agent > 0.5 ? 'c2 → fill Display name ← “Brett” (from the task)' : 'ranked first: c2 · Display name'}
          </text>
          <text x={blockX(ROUTE_B, 1)} y={LANE_B_Y + LANE.h + 35} fill={ROLE.CHECKED} fontSize={10.5} fontFamily={MONO} opacity={checkU}>
            ✓ checked before acting: unique · present · editable
          </text>
          <ProposedTag x={LANE.x + 250} y={LANE_B_Y - 39} u={1} />
        </RouteLane>
        <Chip x={LANE.x + 330} y={LANE_B_Y - 41} text="authorized agent · explicit task" color={colors.TEXT} u={agent} />

        {/* the page stays the anchor: tiles are tethered to live controls */}
        {TILE_LINKS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.3} opacity={0.7} pathLength={1} strokeDasharray={`${clamp01(s.get(scene.linksU) * 1.5 - i * 0.12)} 1`} />
        ))}
        {/* one action, then a fresh look */}
        {s.get(scene.loopU) > 0.002 && (
          <g opacity={s.get(scene.laneBDim)}>
            <path d={LOOP_PATH} fill="none" stroke={ROLE.OBSERVE} strokeWidth={2} pathLength={1} strokeDasharray={`${s.get(scene.loopU)} 1`} />
            <path d={`M${LANE.x + 45} ${LANE_B_Y + LANE.h + 2}l-6 9h12Z`} fill={ROLE.OBSERVE} opacity={clamp01(s.get(scene.loopU) * 5 - 4)} />
            <text x={LANE.x + LANE.w / 2} y={LANE_B_Y + LANE.h + 84} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={11.5} fontFamily={MONO} opacity={clamp01(s.get(scene.loopU) * 2 - 0.6)}>
              then a fresh observation — before any next decision
            </text>
          </g>
        )}
        <text x={LANE.x} y={488} fill={ROLE.PENDING} fontSize={11} fontFamily={MONO} opacity={s.get(scene.noteU)}>
          unscaled sketch — block widths are not time · nothing here is measured
        </text>
      </g>

      {/* beat 8 — opaque closing panel; the ribbon rises into it, unfilled */}
      {close > 0.002 && (
        <g opacity={clamp01(close * 1.4)}>
          <rect x={160} y={64} width={960} height={452} rx={28} fill={colors.BG} stroke="#33415f" strokeWidth={1.6} />
          <text x={640} y={118} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={750}>
            Two proposed experiences
          </text>
          {[
            { t: 'Predictive focus', d: 'a person accepts with Tab · focus moves, nothing activates', c: ROLE.MODEL },
            { t: 'Checked agent action', d: 'authorized task · one checked action, then observe', c: ROLE.OBSERVE },
          ].map((row, i) => {
            const u = clamp01(rowsU * 2 - i * 0.8);
            return (
              <g key={row.t} transform={`translate(${250 + (1 - u) * -14} ${150 + i * 50})`} opacity={u}>
                <rect width={780} height={40} rx={10} fill="#0d1526" stroke={row.c} strokeWidth={1.2} />
                <text x={18} y={25} fill={colors.TEXT} fontSize={15} fontWeight={650}>
                  {row.t}
                </text>
                <text x={212} y={25} fill={colors.MUTED} fontSize={12.5}>
                  {row.d}
                </text>
                <ProposedTag x={690} y={11} u={1} />
              </g>
            );
          })}
          {/* brace over the rising ribbon */}
          <g opacity={clamp01(close * 2 - 1)}>
            <path
              d={`M${RIB_CLOSE.x} ${RIB_CLOSE.y - 10}v-10h${RIB_CLOSE.w / 2 - 8}l8 -8l8 8h${RIB_CLOSE.w / 2 - 8}v10`}
              fill="none"
              stroke={colors.TEXT}
              strokeWidth={1.6}
              pathLength={1}
              strokeDasharray={`${braceU} 1`}
            />
            <text x={640} y={RIB_CLOSE.y - 36} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={650} opacity={clamp01(braceU * 2 - 1)}>
              shorten this distance
            </text>
            <text x={RIB_CLOSE.x} y={RIB_CLOSE.y + RIB_CLOSE.h + 20} fill={colors.MUTED} fontSize={12}>
              intention
            </text>
            <text x={RIB_CLOSE.x + RIB_CLOSE.w} y={RIB_CLOSE.y + RIB_CLOSE.h + 20} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              a useful, verified action
            </text>
          </g>
          {[
            { t: 'people finish useful tasks faster', d: 'no measurement yet' },
            { t: 'mistakes stay within a declared budget', d: 'budget not yet declared' },
          ].map((g, i) => {
            const u = clamp01(gatesU * 2 - i * 0.95);
            return (
              <g key={g.t} transform={`translate(${250 + i * 400} 400)`} opacity={u}>
                <rect width={380} height={72} rx={12} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={1.3} strokeDasharray="6 4" />
                <rect x={16} y={16} width={18} height={18} rx={4} fill="none" stroke={ROLE.PENDING} strokeWidth={1.8} />
                <text x={46} y={30} fill={colors.TEXT} fontSize={14} fontWeight={600}>
                  {g.t}
                </text>
                <text x={46} y={54} fill={ROLE.PENDING} fontSize={11} fontFamily={MONO}>
                  evidence gate · empty · {g.d}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {/* the ribbon is drawn last so it can rise into the closing panel */}
      <WorkRibbon s={s} />
    </Camera>
  );
}

export const vizScene = () => scene;
