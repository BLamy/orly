// Two experiences, one foundation
//
// Book 1 "The Next Useful Action", chapter 3 — PRODUCT VISION + CURRENT SCOPE.
// Sources: PROJECT_CHARTER.md — "Who and what we are building for";
//          "Milestones and success criteria" (epic table E0–E13);
//          docs/decisions/2026-09-16-browser-action-goal.md — Boundaries.
// Only the bottom tier (Qwen2.5 1.5B + constrained decision engine, E0–E6) is
// current work. Everything above it is drawn dashed and labelled proposed.
// All bars are ILLUSTRATIVE ranking scores — synthetic, not measured.
//
// ONE persistent mechanism: the Profile page. It splits into two synchronized
// lens copies (same page, same observation, same actual focus), the right
// lens's ranking re-sorts when a task is stated, the copies rejoin into one
// page that becomes the top of a tower, and the camera descends the tower to
// the decision engine that the next book opens.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 one page → two lenses over the same observation
//  2 person lens: history → a suggested target, goal unknown
//  3 agent lens: the same "most common" ranking re-sorts under a stated task
//  4 lenses rejoin; four shared layers draw in under both products
//  5 different evidence: acceptance tally vs. outcome checklist (both empty)
//  6 current work is the bottom tier; the rest is destination
//  7 a marker climbs the charter milestones, each leaving something inspectable
//  8 push into the decision engine; its front opens
import { curveBasis, line, linkVertical, scaleLinear } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  FocusRing,
  MONO,
  PAGE,
  ProfilePage,
  ProposedTag,
  ROLE,
  SuggestHalo,
  TASK_TEXT,
  captionPlan,
  controlRect,
} from './shared/profile-page';
import type { PagePlacement, Rect } from './shared/profile-page';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'We are describing two related products. One helps a person move through a page. The other helps an agent carry out a stated task.',
  "Predictive focus asks where this person is likely to go next. It can be useful even when the system does not know the person's complete goal.",
  'Task automation asks which action advances a particular instruction. The most common next click may be a poor answer to that different question.',
  'Both experiences can share page observations, candidate construction, a small ranking model, and checks that a chosen target still exists.',
  'They need different evidence of success. A helpful focus suggestion is judged by useful acceptance; an autonomous workflow is judged by what it actually accomplishes.',
  'The current project starts lower in the stack, with Qwen and a constrained decision engine. The browser action and learning systems are the destination.',
  'We will first make that foundation correct, then connect live actions, eligible recordings, training, and evaluation. Each step should produce something we can inspect.',
  'To understand why this path might work, we need to open the decision engine and watch how it produces an answer.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;
const END = PLAN.end + 1.0;

/* ---------------------------------------------------------------- layout */
const P_CENTER: PagePlacement = { x: 438, y: 122, scale: 0.72 };
const P_LEFT: PagePlacement = { x: 118, y: 122, scale: 0.72 };
const P_RIGHT: PagePlacement = { x: 758, y: 122, scale: 0.72 };
const P_TOWER: PagePlacement = { x: 500, y: 60, scale: 0.5 };
const LENS_L: Rect = { x: 40, y: 60, w: 560, h: 474 };
const LENS_R: Rect = { x: 680, y: 60, w: 560, h: 474 };
const BARS_Y = 458;
const CHIP_DY = 34;
const CARD_L: Rect = { x: 60, y: 60, w: 380, h: 220 };
const CARD_R: Rect = { x: 840, y: 60, w: 380, h: 220 };
const STRATA = { x: 340, w: 600, y0: 300, step: 42, h: 36 };
const FOUND: Rect = { x: 340, y: 486, w: 600, h: 84 };
const RISER = { x: 990, w: 230, h: 46, y0: 548, step: 58 };

const mixPlace = (a: PagePlacement, b: PagePlacement, u: number): PagePlacement => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), scale: lerp(a.scale, b.scale, u) });
const mixRect = (a: Rect, b: Rect, u: number): Rect => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });

const CAM_PAGE: CameraState = { x: 640, y: 290, k: 1.25 };
const CAM_HOME: CameraState = { x: 640, y: 345, k: 1 };
const CAM_LEFT: CameraState = { x: 628, y: 335, k: 1.035 };
const CAM_RIGHT: CameraState = { x: 652, y: 335, k: 1.035 };
const CAM_TOP: CameraState = { x: 640, y: 285, k: 1.06 };
const CAM_LOW: CameraState = { x: 640, y: 372, k: 1.04 };
const CAM_ROAD: CameraState = { x: 660, y: 384, k: 1 };
const CAM_ENGINE: CameraState = { x: 640, y: 528, k: 1.9 };

/* ------------------------------------- illustrative rankings (synthetic) */
const TARGETS = ['Email', 'Display name', 'Sign out', 'Profile menu'];
const HIST = [0.46, 0.3, 0.16, 0.08]; // from this person's history — synthetic
const TASKED = [0.14, 0.64, 0.05, 0.17]; // conditioned on the stated task — synthetic
const rankOf = (vals: number[]) => vals.map((v) => vals.filter((o) => o > v).length);
const RANK_HIST = rankOf(HIST);
const RANK_TASK = rankOf(TASKED);
const barW = scaleLinear([0, 0.7], [0, 250]);
const BAR = { dx: 112, rowH: 18 };

/* history trail in the person lens: three earlier sessions, menu → Email */
const smooth = line<[number, number]>().curve(curveBasis);
const L_MENU = controlRect('profile-menu', P_LEFT);
const L_EMAIL = controlRect('email-field', P_LEFT);
const R_NAME = controlRect('display-name-field', P_RIGHT);
const HIST_PATHS = [0, 1, 2].map((i) =>
  smooth([
    [L_MENU.x + 30, L_MENU.y + L_MENU.h],
    [L_MENU.x - 40 - i * 34, L_MENU.y + 70 + i * 10],
    [L_EMAIL.x + 250 - i * 40, L_EMAIL.y - 50 + i * 8],
    [L_EMAIL.x + 170 - i * 36, L_EMAIL.y + 4],
  ]) ?? '',
);

const vlink = linkVertical<{ source: [number, number]; target: [number, number] }, [number, number]>();
const CARD_LINKS = [
  vlink({ source: [CARD_L.x + CARD_L.w / 2, CARD_L.y + CARD_L.h], target: [STRATA.x + 90, STRATA.y0] }) ?? '',
  vlink({ source: [CARD_R.x + CARD_R.w / 2, CARD_R.y + CARD_R.h], target: [STRATA.x + STRATA.w - 90, STRATA.y0] }) ?? '',
];

const LAYERS = [
  { t: 'page observations', d: 'versioned · what is on the page now', c: ROLE.OBSERVE },
  { t: 'candidate construction', d: 'legal target + action pairs', c: ROLE.OBSERVE },
  { t: 'small ranking model', d: 'scores the candidates', c: ROLE.MODEL },
  { t: 'target still exists?', d: 'checked before anything moves', c: ROLE.CHECKED },
];
const STEPS = [
  { t: 'E0–E6 foundation', d: 'corrected reference · browser proof' },
  { t: 'E7 live actions', d: 'candidate inventory · checked execution' },
  { t: 'E8 eligible recordings', d: 'causal examples · frozen splits' },
  { t: 'E10 training', d: 'small policy, exported' },
  { t: 'E12 evaluation', d: 'held-out + closed-loop comparison' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAGE, cameraInterp);
  const phase = tl.channel('phase', 0);
  tl.tween(phase, END / 2.4, { at: 0, dur: END, ease: ease.linear });

  const pageU = tl.channel('pageU', 0);
  const splitU = tl.channel('splitU', 0);
  const frameU = tl.channel('frameU', 0);
  const syncU = tl.channel('syncU', 0);
  const overlayU = tl.channel('overlayU', 1);
  const histU = tl.channel('histU', 0);
  const lBarsU = tl.channel('lBarsU', 0);
  const haloU = tl.channel('haloU', 0);
  const goalU = tl.channel('goalU', 0);
  const rBarsU = tl.channel('rBarsU', 0);
  const taskU = tl.channel('taskU', 0);
  const condU = tl.channel('condU', 0);
  const bracketU = tl.channel('bracketU', 0);
  const flagU = tl.channel('flagU', 0);
  const towerU = tl.channel('towerU', 0);
  const linksU = tl.channel('linksU', 0);
  const strataU = tl.channel('strataU', 0);
  const evidLU = tl.channel('evidLU', 0);
  const evidRU = tl.channel('evidRU', 0);
  const neqU = tl.channel('neqU', 0);
  const foundU = tl.channel('foundU', 0);
  const hereU = tl.channel('hereU', 0);
  const destU = tl.channel('destU', 0);
  const climbU = tl.channel('climbU', 0);
  const riserU = tl.channel('riserU', 0);
  const dimU = tl.channel('dimU', 0);
  const openU = tl.channel('openU', 0);
  const insideU = tl.channel('insideU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · one page, two lenses — */
  let b = AT[0];
  tl.tween(pageU, 1, { at: b + 0.2, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 2.6, dur: 1.6, ease: ease.move });
  tl.tween(splitU, 1, { at: b + 3.2, dur: 1.7, ease: ease.move });
  tl.tween(frameU, 1, { at: b + 3.8, dur: 0.9, ease: ease.enter });
  tl.tween(syncU, 1, { at: b + 6.0, dur: 1.0, ease: ease.draw });

  /* — beat 2 · the person lens: where is this person likely to go next — */
  b = AT[1];
  tl.tween(cam, CAM_LEFT, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(histU, 1, { at: b + 1.2, dur: 2.0, ease: ease.draw });
  tl.tween(lBarsU, 1, { at: b + 3.0, dur: 1.2, ease: ease.enter });
  tl.tween(haloU, 1, { at: b + 4.8, dur: 0.7, ease: ease.enter });
  tl.tween(goalU, 1, { at: b + 7.0, dur: 0.6, ease: ease.pop });

  /* — beat 3 · the agent lens: a stated task re-sorts the same ranking — */
  b = AT[2];
  tl.tween(cam, CAM_RIGHT, { at: b + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(rBarsU, 1, { at: b + 1.0, dur: 1.0, ease: ease.enter });
  tl.tween(taskU, 1, { at: b + 3.2, dur: 0.7, ease: ease.enter });
  tl.tween(condU, 1, { at: b + 4.4, dur: 2.0, ease: ease.move });
  tl.tween(bracketU, 1, { at: b + 6.2, dur: 0.6, ease: ease.pop });
  tl.tween(flagU, 1, { at: b + 7.4, dur: 0.6, ease: ease.pop });

  /* — beat 4 · rejoin over a shared foundation — */
  b = AT[3];
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(overlayU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(syncU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(splitU, 0, { at: b + 0.7, dur: 1.8, ease: ease.move });
  tl.tween(towerU, 1, { at: b + 0.7, dur: 1.8, ease: ease.move });
  tl.tween(linksU, 1, { at: b + 2.4, dur: 1.2, ease: ease.draw });
  tl.tween(strataU, 4, { at: b + 3.0, dur: 5.4, ease: ease.linear });

  /* — beat 5 · different evidence of success — */
  b = AT[4];
  tl.tween(cam, CAM_TOP, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(evidLU, 1, { at: b + 3.0, dur: 1.0, ease: ease.enter });
  tl.tween(evidRU, 1, { at: b + 7.0, dur: 1.0, ease: ease.enter });
  tl.tween(neqU, 1, { at: b + 1.2, dur: 0.6, ease: ease.pop });

  /* — beat 6 · current work is the bottom tier — */
  b = AT[5];
  tl.tween(cam, CAM_LOW, { at: b + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(foundU, 1, { at: b + 1.0, dur: 0.9, ease: ease.enter });
  tl.tween(hereU, 1, { at: b + 2.6, dur: 0.6, ease: ease.pop });
  tl.tween(destU, 1, { at: b + 6.0, dur: 1.2, ease: ease.draw });

  /* — beat 7 · climb the milestones — */
  b = AT[6];
  tl.tween(cam, CAM_ROAD, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(riserU, 1, { at: b + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(climbU, 1, { at: b + 1.2, dur: 1.6, ease: ease.move });
  tl.tween(climbU, 2, { at: b + 3.4, dur: 1.2, ease: ease.move });
  tl.tween(climbU, 3, { at: b + 4.8, dur: 1.2, ease: ease.move });
  tl.tween(climbU, 4, { at: b + 6.2, dur: 1.0, ease: ease.move });
  tl.tween(climbU, 5, { at: b + 7.4, dur: 1.0, ease: ease.move });

  /* — beat 8 · open the decision engine — */
  b = AT[7];
  tl.tween(dimU, 1, { at: b + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(hereU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_ENGINE, { at: b + 0.4, dur: 1.8, ease: ease.move });
  tl.tween(openU, 1, { at: b + 2.4, dur: 1.6, ease: ease.move });
  tl.tween(insideU, 1, { at: b + 3.2, dur: 1.4, ease: ease.enter });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, phase, pageU, splitU, frameU, syncU, overlayU, histU, lBarsU, haloU, goalU, rBarsU, taskU, condU, bracketU,
    flagU, towerU, linksU, strataU, evidLU, evidRU, neqU, foundU, hereU, destU, climbU, riserU, dimU, openU, insideU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */

/** Illustrative ranking bars; rows re-sort as `mix` moves from history to task. */
function RankBars({ x, y, u, mix, title, color, flag }: { x: number; y: number; u: number; mix: number; title: string; color: string; flag: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <text x={0} y={-8} fill={color} fontSize={10.5} fontFamily={MONO}>
        {title}
      </text>
      <text x={BAR.dx + 262} y={-8} textAnchor="end" fill={ROLE.PENDING} fontSize={9.5} fontFamily={MONO}>
        illustrative · not measured
      </text>
      {TARGETS.map((name, i) => {
        const v = lerp(HIST[i], TASKED[i], mix);
        const ry = lerp(RANK_HIST[i], RANK_TASK[i], mix) * BAR.rowH;
        const top = lerp(RANK_HIST[i], RANK_TASK[i], mix) < 0.5;
        return (
          <g key={name} transform={`translate(0 ${ry})`}>
            <text x={BAR.dx - 8} y={11} textAnchor="end" fill={top ? colors.TEXT : colors.MUTED} fontSize={10.5}>
              {name}
            </text>
            <rect x={BAR.dx} y={2} width={barW(v) * o} height={11} rx={3} fill={color} opacity={top ? 0.95 : 0.45} />
            {i === 0 && flag > 0.002 && (
              <text x={BAR.dx + barW(v) + 8} y={11} fill={ROLE.INVALID} fontSize={9.5} fontFamily={MONO} opacity={flag}>
                ✕ most common ≠ advances the task
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Agent-side marker: corner brackets = "chosen target, still to be checked" (not a halo, not focus). */
function ChosenBrackets({ rect, u }: { rect: Rect; u: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const p = 8 + (1 - o) * 10;
  const x0 = rect.x - p;
  const y0 = rect.y - p;
  const x1 = rect.x + rect.w + p;
  const y1 = rect.y + rect.h + p;
  const c = 12;
  return (
    <g opacity={o}>
      <path d={`M${x0} ${y0 + c}V${y0}H${x0 + c}M${x1 - c} ${y0}H${x1}V${y0 + c}M${x1} ${y1 - c}V${y1}H${x1 - c}M${x0 + c} ${y1}H${x0}V${y1 - c}`} fill="none" stroke={ROLE.OBSERVE} strokeWidth={2.6} />
      <text x={x1} y={y0 - 6} textAnchor="end" fill={ROLE.OBSERVE} fontSize={10} fontFamily={MONO}>
        chosen target · still to be checked
      </text>
    </g>
  );
}

function LensFrame({ rect, u, title, sub, color }: { rect: Rect; u: number; title: string; sub: string; color: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  return (
    <g opacity={o}>
      <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={22} fill="#0b1120" stroke={color} strokeWidth={1.8} />
      <text x={rect.x + 20} y={rect.y + 26} fill={color} fontSize={13} fontFamily={MONO} letterSpacing={1.2} fontWeight={700}>
        {title}
      </text>
      <text x={rect.x + 20} y={rect.y + 43} fill={colors.MUTED} fontSize={11.5}>
        {sub}
      </text>
      <ProposedTag x={rect.x + rect.w - 96} y={rect.y + 13} u={1} />
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const phase = s.get(scene.phase);
  const splitU = s.get(scene.splitU);
  const towerU = s.get(scene.towerU);
  const frameU = s.get(scene.frameU);
  const overlayU = s.get(scene.overlayU);
  const pageU = s.get(scene.pageU);
  const dim = 1 - s.get(scene.dimU);
  const strataU = s.get(scene.strataU);
  const destU = s.get(scene.destU);
  const climbU = s.get(scene.climbU);
  const openU = s.get(scene.openU);
  const insideU = s.get(scene.insideU);
  const evidLU = s.get(scene.evidLU);
  const evidRU = s.get(scene.evidRU);
  const syncU = s.get(scene.syncU);

  const base = mixPlace(P_CENTER, P_TOWER, towerU);
  const placeL = mixPlace(base, P_LEFT, splitU);
  const placeR = mixPlace(base, P_RIGHT, splitU);
  const frameL = mixRect(LENS_L, CARD_L, towerU);
  const frameR = mixRect(LENS_R, CARD_R, towerU);
  const twoCopies = splitU > 0.002;

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        {/* lens frames morph into the two product cards */}
        <LensFrame rect={frameL} u={frameU} title="PREDICTIVE FOCUS" sub="helps a person move through a page" color={ROLE.MODEL} />
        <LensFrame rect={frameR} u={frameU} title="TASK AUTOMATION" sub="helps an agent carry out a stated task" color={ROLE.OBSERVE} />

        {/* shared layers — drawn before the page so the page sits on top of the tower */}
        {CARD_LINKS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={i === 0 ? ROLE.MODEL : ROLE.OBSERVE} strokeWidth={1.8} pathLength={1} strokeDasharray={`${s.get(scene.linksU)} 1`} opacity={0.8} />
        ))}
        {LAYERS.map((l, i) => {
          const u = clamp01(strataU - i);
          if (u <= 0.002) return null;
          const y = STRATA.y0 + i * STRATA.step;
          return (
            <g key={l.t} opacity={u} transform={`translate(${(1 - u) * -18} 0)`}>
              <rect x={STRATA.x} y={y} width={STRATA.w} height={STRATA.h} rx={9} fill="#0d1526" stroke={l.c} strokeWidth={1.4} strokeDasharray={destU > 0.5 ? '7 4' : undefined} />
              <rect x={STRATA.x} y={y} width={6} height={STRATA.h} rx={3} fill={l.c} />
              <text x={STRATA.x + 22} y={y + 23} fill={colors.TEXT} fontSize={14} fontWeight={650}>
                {l.t}
              </text>
              <text x={STRATA.x + STRATA.w - 16} y={y + 23} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                {l.d}
              </text>
            </g>
          );
        })}
        <text x={STRATA.x} y={STRATA.y0 - 8} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} letterSpacing={1} opacity={clamp01(strataU)}>
          SHARED BY BOTH EXPERIENCES
        </text>
        {destU > 0.002 && (
          <g opacity={destU}>
            <path d={`M${STRATA.x - 18} ${STRATA.y0 + 4 * STRATA.step - 8}V${P_TOWER.y}`} fill="none" stroke={ROLE.PENDING} strokeWidth={1.8} strokeDasharray="6 4" />
            <text transform={`translate(${STRATA.x - 28} ${STRATA.y0 + 150}) rotate(-90)`} fill={ROLE.PENDING} fontSize={11} fontFamily={MONO} letterSpacing={1}>
              DESTINATION · PROPOSED · E7–E13
            </text>
          </g>
        )}

        {/* the page: two synchronized copies that coincide when splitU = 0 */}
        <ProfilePage place={placeL} opacity={pageU} obsLabel="observation v12" obsU={frameU} />
        <FocusRing rect={controlRect('profile-menu', placeL)} u={pageU * (1 - towerU)} />
        {twoCopies && (
          <>
            <ProfilePage place={placeR} opacity={pageU} obsLabel="observation v12" obsU={frameU} />
            <FocusRing rect={controlRect('profile-menu', placeR)} u={pageU} />
          </>
        )}
        {syncU > 0.002 && (
          <g opacity={syncU}>
            <path d={`M${LENS_L.x + LENS_L.w} 300H${LENS_R.x}`} stroke={ROLE.OBSERVE} strokeWidth={2} strokeDasharray="3 5" pathLength={1} />
            <circle cx={640} cy={300} r={15} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={1.6} />
            <text x={640} y={304.5} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={13} fontWeight={800}>
              =
            </text>
            <text x={640} y={336} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={9.5} fontFamily={MONO}>
              same page
            </text>
            <text x={640} y={349} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={9.5} fontFamily={MONO}>
              same focus
            </text>
          </g>
        )}

        {/* lens overlays (beats 2–3) */}
        {overlayU > 0.002 && (
          <g opacity={overlayU}>
            {HIST_PATHS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#f1f5f9" strokeWidth={1.4} strokeDasharray="0.012 0.02" pathLength={1} opacity={0.5 * clamp01(s.get(scene.histU) * 3 - i)} />
            ))}
            <text x={P_LEFT.x + 24} y={P_LEFT.y + (PAGE.h - 30) * P_LEFT.scale} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={clamp01(s.get(scene.histU) * 2 - 1)}>
              ⋯ this person’s earlier sessions (synthetic)
            </text>
            <SuggestHalo rect={L_EMAIL} u={s.get(scene.haloU)} phase={phase} label="suggestion" />
            <RankBars x={LENS_L.x + 70} y={BARS_Y} u={s.get(scene.lBarsU)} mix={0} title="likely next target · from history" color={ROLE.MODEL} flag={0} />
            <g opacity={s.get(scene.goalU)}>
              <rect x={LENS_L.x + 290} y={LENS_L.y + CHIP_DY} width={250} height={22} rx={11} fill="#1a1405" stroke={ROLE.PENDING} strokeDasharray="5 3" />
              <text x={LENS_L.x + 415} y={LENS_L.y + CHIP_DY + 15} textAnchor="middle" fill={ROLE.PENDING} fontSize={10.5} fontFamily={MONO}>
                ? goal: unknown — and stays unknown
              </text>
            </g>

            <RankBars
              x={LENS_R.x + 70}
              y={BARS_Y}
              u={s.get(scene.rBarsU)}
              mix={s.get(scene.condU)}
              title={s.get(scene.condU) < 0.5 ? 'most common next click' : 'advances the stated task'}
              color={ROLE.OBSERVE}
              flag={s.get(scene.flagU)}
            />
            <g opacity={s.get(scene.taskU)} transform={`translate(0 ${(1 - s.get(scene.taskU)) * -8})`}>
              <rect x={LENS_R.x + 262} y={LENS_R.y + CHIP_DY} width={282} height={22} rx={11} fill="#171335" stroke={ROLE.MODEL} />
              <text x={LENS_R.x + 403} y={LENS_R.y + CHIP_DY + 15} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                task: “{TASK_TEXT}”
              </text>
            </g>
            <ChosenBrackets rect={R_NAME} u={s.get(scene.bracketU)} />
          </g>
        )}

        {/* beat 5 — different evidence; both instruments are empty */}
        {evidLU > 0.002 && (
          <g opacity={evidLU} transform={`translate(${CARD_L.x + 20} ${CARD_L.y + 70})`}>
            <text fill={colors.TEXT} fontSize={13} fontWeight={650}>
              judged by: useful acceptance
            </text>
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={i * 33} y={16} width={26} height={26} rx={13} fill="none" stroke={ROLE.MODEL} strokeWidth={1.3} strokeDasharray="4 3" opacity={clamp01(evidLU * 10 - i)} />
            ))}
            <text y={66} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              each slot: accepted ✓ · dismissed ✕ · ignored –
            </text>
            <text y={96} fill={ROLE.PENDING} fontSize={10.5} fontFamily={MONO}>
              acceptance tally · empty · no results yet
            </text>
          </g>
        )}
        {evidRU > 0.002 && (
          <g opacity={evidRU} transform={`translate(${CARD_R.x + 20} ${CARD_R.y + 70})`}>
            <text fill={colors.TEXT} fontSize={13} fontWeight={650}>
              judged by: what it actually accomplishes
            </text>
            {['display name reads “Brett” on the page', 'task finished · no wrong action taken'].map((t, i) => (
              <g key={t} transform={`translate(0 ${18 + i * 26})`} opacity={clamp01(evidRU * 2 - i * 0.7)}>
                <rect width={16} height={16} rx={3} fill="none" stroke={ROLE.CHECKED} strokeWidth={1.5} />
                <text x={26} y={13} fill={colors.MUTED} fontSize={12}>
                  {t}
                </text>
              </g>
            ))}
            <text y={96} fill={ROLE.PENDING} fontSize={10.5} fontFamily={MONO}>
              outcome checklist · unchecked · no results yet
            </text>
          </g>
        )}
        {s.get(scene.neqU) > 0.002 && (
          <g opacity={s.get(scene.neqU) * towerU}>
            <text x={640} y={P_TOWER.y - 12} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontWeight={650}>
              different evidence of success
            </text>
          </g>
        )}

        {/* beat 7 — the charter's milestones, climbed one at a time */}
        {s.get(scene.riserU) > 0.002 && (
          <g opacity={s.get(scene.riserU)}>
            <text x={RISER.x} y={306} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              also: E9 models · E11 integration · E13 release
            </text>
            <path d={`M${RISER.x - 16} ${RISER.y0 + RISER.h}V${RISER.y0 - 4 * RISER.step}`} stroke="#33415f" strokeWidth={2} />
            {STEPS.map((st, i) => {
              const lit = clamp01(climbU - i);
              const y = RISER.y0 - i * RISER.step;
              const c = i === 0 ? ROLE.OBSERVE : ROLE.PENDING;
              return (
                <g key={st.t} opacity={0.3 + 0.7 * lit}>
                  <rect x={RISER.x} y={y} width={RISER.w} height={RISER.h} rx={9} fill="#0d1526" stroke={c} strokeWidth={1.4} strokeDasharray={i === 0 ? undefined : '6 4'} />
                  <text x={RISER.x + 12} y={y + 19} fill={colors.TEXT} fontSize={12.5} fontWeight={650}>
                    {st.t}
                  </text>
                  <text x={RISER.x + 12} y={y + 36} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                    {st.d}
                  </text>
                  {/* inspectable artifact: a magnifier pops when the step is reached */}
                  <g transform={`translate(${RISER.x + RISER.w - 20} ${y + 18}) scale(${lit})`}>
                    <circle r={6.5} fill="none" stroke={c} strokeWidth={1.8} />
                    <path d="M4.8 4.8L10 10" stroke={c} strokeWidth={2} strokeLinecap="round" />
                  </g>
                  <text x={RISER.x + RISER.w - 34} y={y + 19} textAnchor="end" fill={c} fontSize={9} fontFamily={MONO} opacity={i === 0 ? 1 : lit}>
                    {i === 0 ? 'current' : 'proposed'}
                  </text>
                </g>
              );
            })}
            <circle cx={RISER.x - 16} cy={RISER.y0 + RISER.h / 2 - Math.max(0, climbU - 1) * RISER.step} r={7} fill={ROLE.OBSERVE} opacity={clamp01(climbU * 3)} />
          </g>
        )}
        {/* legend: line style carries the claim status, not colour alone */}
        <g opacity={destU} transform="translate(40 330)">
          <rect width={244} height={86} rx={12} fill="#0b1120" stroke="#2a3754" />
          <line x1={16} y1={28} x2={56} y2={28} stroke={ROLE.OBSERVE} strokeWidth={2.4} />
          <text x={68} y={32} fill={colors.TEXT} fontSize={11.5}>
            solid — current work
          </text>
          <line x1={16} y1={58} x2={56} y2={58} stroke={ROLE.PENDING} strokeWidth={2.4} strokeDasharray="6 4" />
          <text x={68} y={62} fill={colors.TEXT} fontSize={11.5}>
            dashed — proposed, not built
          </text>
        </g>
      </g>

      {/* the foundation tier — never dimmed; it is where the book is heading */}
      {s.get(scene.foundU) > 0.002 && (
        <g opacity={s.get(scene.foundU)}>
          <text x={FOUND.x} y={FOUND.y - 7} fill={ROLE.OBSERVE} fontSize={10.5} fontFamily={MONO} letterSpacing={1}>
            CURRENT WORK · E0–E6 FOUNDATION
          </text>
          {/* inside — revealed when the front opens */}
          <rect x={FOUND.x} y={FOUND.y} width={FOUND.w} height={FOUND.h} rx={12} fill="#070b16" stroke={ROLE.OBSERVE} strokeWidth={2} />
          <g opacity={insideU}>
            <rect x={FOUND.x + 170} y={FOUND.y + 34} width={96} height={14} rx={4} fill={ROLE.MODEL} opacity={0.8} />
            <text x={FOUND.x + 218} y={FOUND.y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={7.5} fontFamily={MONO}>
              shared context
            </text>
            {[0, 1].map((r) => (
              <g key={r}>
                <path d={`M${FOUND.x + 266} ${FOUND.y + 41}C${FOUND.x + 300} ${FOUND.y + 41} ${FOUND.x + 290} ${FOUND.y + 24 + r * 34} ${FOUND.x + 322} ${FOUND.y + 24 + r * 34}`} fill="none" stroke={ROLE.MODEL} strokeWidth={1.4} pathLength={1} strokeDasharray={`${clamp01(insideU * 2 - 0.4)} 1`} />
                {[0.9, 0.35, 0.2].map((v, k) => (
                  <rect key={k} x={FOUND.x + 328} y={FOUND.y + 15 + r * 34 + k * 6.5} width={(r === 0 ? v : [0.25, 0.85, 0.4][k]) * 84 * clamp01(insideU * 2 - 0.9)} height={4.5} rx={2} fill={ROLE.MODEL} opacity={0.9} />
                ))}
              </g>
            ))}
            <text x={FOUND.x + 300} y={FOUND.y + 76} textAnchor="middle" fill={ROLE.PENDING} fontSize={7.5} fontFamily={MONO}>
              schematic · next book: how a decision is produced
            </text>
          </g>
          {/* the two front halves slide apart */}
          {[-1, 1].map((side) => {
            // each door keeps its outer edge and narrows toward it, uncovering the middle
            const half = FOUND.w / 2;
            const shown = half - openU * 150;
            const x = side < 0 ? FOUND.x : FOUND.x + FOUND.w - shown;
            return (
              <g key={side} opacity={1 - 0.15 * openU}>
                <rect x={x} y={FOUND.y} width={shown} height={FOUND.h} rx={12} fill="#0d1a2e" stroke={ROLE.OBSERVE} strokeWidth={2} />
                <text x={x + shown / 2} y={FOUND.y + 38} textAnchor="middle" fill={colors.TEXT} fontSize={lerp(17, 11, openU)} fontWeight={700}>
                  {side < 0 ? 'Qwen2.5 1.5B' : 'decision engine'}
                </text>
                <text x={x + shown / 2} y={FOUND.y + 60} textAnchor="middle" fill={colors.MUTED} fontSize={lerp(11, 8, openU)} fontFamily={MONO}>
                  {side < 0 ? 'the model' : 'constrained choices'}
                </text>
              </g>
            );
          })}
          {s.get(scene.hereU) > 0.002 && (
            <g opacity={s.get(scene.hereU)} transform={`translate(${FOUND.x - 150} ${FOUND.y + 28})`}>
              <rect width={128} height={28} rx={14} fill="#082f49" stroke={ROLE.OBSERVE} />
              <text x={64} y={18.5} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={11.5} fontFamily={MONO}>
                we start here ▶
              </text>
            </g>
          )}
        </g>
      )}
    </Camera>
  );
}

export const vizScene = () => scene;
