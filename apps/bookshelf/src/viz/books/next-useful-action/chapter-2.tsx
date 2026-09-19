// A small decision inside a large world
//
// Book 1 "The Next Useful Action", chapter 2 — MECHANISM + PRODUCT HYPOTHESIS.
// Sources: PROJECT_CHARTER.md — Mission; Browser-action invariants 1–3, 9.
// Every score on screen is an ILLUSTRATIVE ranking score: a fixed budget of 66
// dots redistributed by hand-written counts. Nothing is a probability, a
// benchmark, or a measurement, and the word tree is schematic, not tokenization.
//
// ONE persistent mechanism: 66 violet dots. They first ARE the open-ended text
// tree (a d3.tree of possible continuations), get squeezed into a pool, and are
// then poured over a tray of legal joint target/action tiles — each tile
// tethered to its live control on the same Profile page. Context, a missing
// target, and an explicit "unsure" route each re-pour the same dots.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 open-ended text grows; the page quietly shows how few moves it offers
//  2 the tree folds; legal tiles lift off the page, tethered; dots rank the menu
//  3 spotlight open·menu, focus·name; the disabled Save tile is ejected
//  4 context cards arrive; the explicit task re-pours the dots, page unchanged
//  5 text ribbon vs one menu id; an empty gauge: faster? to be measured
//  6 legal-but-wrong (Sign out) versus legal-and-useful (Display name)
//  7 an unsure tile; the useful target goes missing → coverage gap
//  8 short path to a decision, plus an amber escape route
import { arc, easeCubicInOut, hierarchy, linkHorizontal, scaleLinear, tree } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  MONO,
  ProfilePage,
  ProposedTag,
  ROLE,
  SuggestHalo,
  TASK_TEXT,
  captionPlan,
  controlRect,
} from './shared/profile-page';
import type { ControlId, ControlMark, PagePlacement } from './shared/profile-page';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'A language model can write almost anything. A particular browser page usually offers a much smaller set of useful moves at a particular moment.',
  'That difference creates an opportunity. We can turn the page into a menu of legal choices and ask a model to rank that menu.',
  'One choice might be opening the profile menu. Another might be focusing the name field. A disabled save button should not masquerade as a ready action.',
  'The model still needs context. The page, recent interactions, and an explicit task can change which choice makes sense, even when the buttons look identical.',
  'A smaller answer space can reduce unnecessary output and make validation easier. Whether it makes the whole experience faster is something we must measure.',
  'There is an important distinction here: an answer can be perfectly legal and completely wrong. A valid button is not automatically the right button.',
  'The system therefore needs a way to say it is unsure, and a way to notice when the useful action is missing from its menu.',
  'The product promise is a shorter path to a useful decision, with a clear escape route when that decision is beyond the fast path.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;
const END = PLAN.end + 1.0;

/* ---------------------------------------------------------------- layout */
const PLACE: PagePlacement = { x: 40, y: 74, scale: 0.86 };
const TILE = { x: 610, w: 268, h: 50, y0: 100, step: 70 };
const LANE_X = 900;
const DOT_STEP = 13;
const PER_ROW = 22;
const POOL = { x: 1204, y: 112 };
const rowY = (j: number) => TILE.y0 + j * TILE.step + TILE.h / 2;

const CAM_TREE: CameraState = { x: 820, y: 270, k: 1.12 };
const CAM_HOME: CameraState = { x: 640, y: 335, k: 1 };
const CAM_TRAY: CameraState = { x: 640, y: 282, k: 1.06 };

/* --------------------------------------------- the legal menu (joint tiles) */
interface TileSpec {
  id: string;
  action: string;
  target: string;
  role: string;
  control: ControlId;
}
const TILES: TileSpec[] = [
  { id: 'c1', action: 'open', target: 'Profile menu', role: 'button', control: 'profile-menu' },
  { id: 'c2', action: 'focus', target: 'Display name', role: 'textbox', control: 'display-name-field' },
  { id: 'c3', action: 'focus', target: 'Email', role: 'textbox', control: 'email-field' },
  { id: 'c4', action: 'click', target: 'Sign out', role: 'link', control: 'sign-out-link' },
];
const SAVE_TILE: TileSpec = { id: '—', action: 'click', target: 'Save', role: 'disabled', control: 'save-button' };
const UNSURE_ROW = 4;

const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();
const tetherFor = (control: ControlId, row: number): string => {
  const r = controlRect(control, PLACE);
  return hlink({ source: [TILE.x - 4, rowY(row)], target: [r.x + r.w + 7, r.y + r.h / 2] }) ?? '';
};
const TETHERS = TILES.map((t, j) => tetherFor(t.control, j));
const SAVE_TETHER = tetherFor('save-button', UNSURE_ROW);

/* ------------------------------ open-ended text: a d3.tree of continuations */
interface Word {
  w: string;
  children?: Word[];
}
const D1 = ['click', 'I', 'scroll'];
const D2 = ['the', 'on', 'a', 'think', 'will', 'should', 'down', 'to', 'until'];
const D3 = ['button', 'blue', 'link', 'Save', 'menu', 'field', 'we', 'you', 'it', 'open', 'try', 'wait', 'the', 'a', 'bit', 'page', 'top', 'end'];
const WORDS: Word = {
  w: '',
  children: D1.map((w1, a) => ({
    w: w1,
    children: [0, 1, 2].map((b) => ({
      w: D2[a * 3 + b],
      children: [0, 1].map((c) => ({
        w: D3[(a * 3 + b) * 2 + c],
        children: [{ w: '' }, { w: '' }],
      })),
    })),
  })),
};
const TREE_BOX = { x: 600, y: 84, w: 540, h: 376 };
const ROOT = tree<Word>().size([TREE_BOX.h, TREE_BOX.w])(hierarchy(WORDS));
const NODES = ROOT.descendants().filter((n) => n.depth > 0);
const N = NODES.length; // 66 — the fixed dot budget
const treeXY = (n: { x: number; y: number }) => ({ x: TREE_BOX.x + n.y, y: TREE_BOX.y + n.x });
const TREE_LINKS = ROOT.links().map((l) => {
  const a = treeXY(l.source);
  const b = treeXY(l.target);
  return { d: hlink({ source: [a.x, a.y], target: [b.x, b.y] }) ?? '', depth: l.target.depth, order: l.target.x / TREE_BOX.h };
});
const ROOT_XY = treeXY(ROOT);

/* ------------------------- formations: the same 66 dots, poured differently */
type XY = { x: number; y: number };
function menuFormation(counts: number[]): XY[] {
  const out: XY[] = [];
  counts.forEach((n, j) => {
    const rows = Math.ceil(n / PER_ROW);
    for (let k = 0; k < n; k++) {
      const r = Math.floor(k / PER_ROW);
      out.push({ x: LANE_X + 6 + (k % PER_ROW) * DOT_STEP, y: rowY(j) + (r - (rows - 1) / 2) * 13 });
    }
  });
  return out;
}
// illustrative ranking budgets over rows [open menu, focus name, focus email, sign out, unsure]
const COUNTS = {
  pageOnly: [18, 14, 14, 20, 0],
  withTask: [8, 44, 6, 8, 0],
  withUnsure: [7, 38, 6, 7, 8],
  missingTarget: [10, 0, 8, 10, 38],
  promise: [6, 42, 5, 6, 7],
};
const FORMS: XY[][] = [
  NODES.map(treeXY),
  Array.from({ length: N }, (_, i) => ({ x: POOL.x + (i % 3) * 12, y: POOL.y + Math.floor(i / 3) * 14.4 })),
  menuFormation(COUNTS.pageOnly),
  menuFormation(COUNTS.withTask),
  menuFormation(COUNTS.withUnsure),
  menuFormation(COUNTS.missingTarget),
  menuFormation(COUNTS.promise),
];
const F_POOL = 1;
const F_PAGE = 2;
const F_TASK = 3;
const F_UNSURE = 4;
const F_MISSING = 5;
const F_PROMISE = 6;

function dotAt(i: number, formP: number): XY & { lift: number } {
  const a = Math.min(FORMS.length - 2, Math.max(0, Math.floor(formP)));
  const frac = clamp01(formP - a);
  const u = easeCubicInOut(clamp01(frac * 1.5 - 0.5 * (i / N)));
  const p = FORMS[a][i];
  const q = FORMS[a + 1][i];
  const moved = Math.hypot(q.x - p.x, q.y - p.y);
  return { x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) - Math.sin(u * Math.PI) * Math.min(26, moved * 0.12), lift: Math.sin(u * Math.PI) };
}

/* --------------------------------------- beat 5: a text ribbon vs. one id */
const STRIP = { x: 600, y1: 484, y2: 534, cell: 26, gap: 4, n: 15 };
const stripX = scaleLinear([0, STRIP.n], [STRIP.x, STRIP.x + STRIP.n * (STRIP.cell + STRIP.gap)]);
const GAUGE = { cx: 1172, cy: 528 };
const GAUGE_ARC = arc()({ innerRadius: 34, outerRadius: 42, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }) ?? '';

/* ---------------------------------------------------------- context cards */
const CTX = [
  { x: 600, w: 180, head: 'PAGE', body: 'observation v12' },
  { x: 792, w: 190, head: 'RECENT', body: 'opened Profile menu' },
  { x: 994, w: 250, head: 'TASK', body: '' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TREE, cameraInterp);
  const phase = tl.channel('phase', 0);
  tl.tween(phase, END / 2.4, { at: 0, dur: END, ease: ease.linear });

  const pageU = tl.channel('pageU', 0);
  const growU = tl.channel('growU', 0);
  const treeU = tl.channel('treeU', 1);
  const marksU = tl.channel('marksU', 0);
  const countU = tl.channel('countU', 0);
  const formP = tl.channel('formP', 0);
  const poolLblU = tl.channel('poolLblU', 0);
  const tileU = tl.channel('tileU', 0);
  const tetherU = tl.channel('tetherU', 0);
  const laneHeadU = tl.channel('laneHeadU', 0);
  const hi0 = tl.channel('hi open menu', 0);
  const hi1 = tl.channel('hi focus name', 0);
  const rejectU = tl.channel('rejectU', 0);
  const ejectU = tl.channel('ejectU', 0);
  const ctxU = tl.channel('ctxU', 0);
  const taskFlipU = tl.channel('taskFlipU', 0);
  const sameU = tl.channel('sameU', 0);
  const stripU = tl.channel('stripU', 0);
  const strip2U = tl.channel('strip2U', 0);
  const gaugeU = tl.channel('gaugeU', 0);
  const dotsDim = tl.channel('dotsDim', 1);
  const wrongU = tl.channel('wrongU', 0);
  const wrongBadgeU = tl.channel('wrongBadgeU', 0);
  const rightU = tl.channel('rightU', 0);
  const unsureU = tl.channel('unsureU', 0);
  const missingU = tl.channel('missingU', 0);
  const gapChipU = tl.channel('gapChipU', 0);
  const routeU = tl.channel('routeU', 0);
  const haloU = tl.channel('haloU', 0);
  const escapeU = tl.channel('escapeU', 0);
  const takeU = tl.channel('takeU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · almost anything vs. a few moves — */
  let b = AT[0];
  tl.tween(pageU, 1, { at: b + 5.6, dur: 0.9, ease: ease.enter });
  tl.tween(growU, 1, { at: b + 0.5, dur: 5.0, ease: ease.draw });
  tl.tween(cam, CAM_HOME, { at: b + 4.4, dur: 1.6, ease: ease.move });
  tl.tween(marksU, 1, { at: b + 6.6, dur: 1.6, ease: ease.enter });
  tl.tween(countU, 1, { at: b + 8.2, dur: 0.6, ease: ease.pop });

  /* — beat 2 · fold the tree; build the menu from the page; rank it — */
  b = AT[1];
  tl.tween(treeU, 0, { at: b + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(formP, F_POOL, { at: b + 0.2, dur: 1.8, ease: ease.linear });
  tl.tween(poolLblU, 1, { at: b + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(countU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(tileU, 1, { at: b + 1.2, dur: 1.8, ease: ease.enter });
  tl.tween(tetherU, 1, { at: b + 2.6, dur: 1.5, ease: ease.draw });
  tl.tween(laneHeadU, 1, { at: b + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(formP, F_PAGE, { at: b + 5.4, dur: 2.6, ease: ease.linear });
  tl.tween(poolLblU, 0.35, { at: b + 7.6, dur: 0.6, ease: ease.move });

  /* — beat 3 · two legal tiles; the disabled Save is not a ready action — */
  b = AT[2];
  tl.tween(cam, CAM_TRAY, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(hi0, 1, { at: b + 0.3, dur: 0.5, ease: ease.enter });
  tl.tween(hi0, 0, { at: b + 2.9, dur: 0.4, ease: ease.enter });
  tl.tween(hi1, 1, { at: b + 3.1, dur: 0.5, ease: ease.enter });
  tl.tween(hi1, 0, { at: b + 5.9, dur: 0.4, ease: ease.enter });
  tl.tween(rejectU, 1, { at: b + 6.4, dur: 0.6, ease: ease.pop });
  tl.tween(ejectU, 1, { at: b + 9.0, dur: 1.0, ease: ease.move });

  /* — beat 4 · context re-pours the ranking; the page does not change — */
  b = AT[3];
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(ctxU, 1, { at: b + 0.5, dur: 2.4, ease: ease.enter });
  tl.tween(taskFlipU, 1, { at: b + 5.2, dur: 0.6, ease: ease.move });
  tl.tween(formP, F_TASK, { at: b + 5.8, dur: 2.4, ease: ease.linear });
  tl.tween(sameU, 1, { at: b + 8.6, dur: 0.6, ease: ease.pop });

  /* — beat 5 · less output, easier validation; faster? to be measured — */
  b = AT[4];
  tl.tween(poolLblU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(ctxU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(sameU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(stripU, 1, { at: b + 0.8, dur: 1.8, ease: ease.linear });
  tl.tween(strip2U, 1, { at: b + 3.0, dur: 1.2, ease: ease.move });
  tl.tween(gaugeU, 1, { at: b + 5.8, dur: 0.8, ease: ease.enter });

  /* — beat 6 · legal is not the same as right — */
  b = AT[5];
  tl.tween(stripU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(strip2U, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(gaugeU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_TRAY, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(dotsDim, 0.22, { at: b + 0.3, dur: 0.7, ease: ease.move });
  tl.tween(wrongU, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(wrongBadgeU, 1, { at: b + 3.2, dur: 0.5, ease: ease.pop });
  tl.tween(wrongU, 0.4, { at: b + 6.0, dur: 0.6, ease: ease.move });
  tl.tween(rightU, 1, { at: b + 6.4, dur: 0.6, ease: ease.enter });

  /* — beat 7 · an unsure route; a useful target missing from the menu — */
  b = AT[6];
  tl.tween(wrongU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(wrongBadgeU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(rightU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(dotsDim, 1, { at: b + 0.3, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(unsureU, 1, { at: b + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(formP, F_UNSURE, { at: b + 1.4, dur: 1.8, ease: ease.linear });
  tl.tween(missingU, 1, { at: b + 4.4, dur: 0.8, ease: ease.move });
  tl.tween(formP, F_MISSING, { at: b + 5.0, dur: 2.4, ease: ease.linear });
  tl.tween(gapChipU, 1, { at: b + 7.4, dur: 0.6, ease: ease.pop });

  /* — beat 8 · a shorter path, with a clear escape route — */
  b = AT[7];
  tl.tween(missingU, 0, { at: b + 0.2, dur: 0.7, ease: ease.move });
  tl.tween(gapChipU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(formP, F_PROMISE, { at: b + 0.5, dur: 2.0, ease: ease.linear });
  tl.tween(routeU, 1, { at: b + 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(haloU, 1, { at: b + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(escapeU, 1, { at: b + 5.2, dur: 1.4, ease: ease.draw });
  tl.tween(takeU, 1, { at: b + 6.8, dur: 0.8, ease: ease.enter });
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, phase, pageU, growU, treeU, marksU, countU, formP, poolLblU, tileU, tetherU, laneHeadU, hi0, hi1, rejectU,
    ejectU, ctxU, taskFlipU, sameU, stripU, strip2U, gaugeU, dotsDim, wrongU, wrongBadgeU, rightU, unsureU, missingU,
    gapChipU, routeU, haloU, escapeU, takeU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */

/** A joint target/action tile: the two halves are clasped — never chosen separately. */
function JointTile({ spec, row, u, emphasis, ghost = 0, tone = ROLE.OBSERVE }: { spec: TileSpec; row: number; u: number; emphasis: number; ghost?: number; tone?: string }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const y = TILE.y0 + row * TILE.step;
  const g = clamp01(ghost);
  return (
    <g transform={`translate(${TILE.x + (1 - o) * -26} ${y})`} opacity={o}>
      <rect width={TILE.w} height={TILE.h} rx={10} fill="#0b1324" stroke={g > 0.5 ? ROLE.PENDING : tone} strokeWidth={1.3 + emphasis * 1.6} strokeDasharray={g > 0.5 ? '6 4' : undefined} />
      <g opacity={1 - 0.75 * g}>
        <rect x={7} y={15} width={28} height={20} rx={5} fill="#082f49" />
        <text x={21} y={29} textAnchor="middle" fill={tone} fontSize={10.5} fontFamily={MONO}>
          {spec.id}
        </text>
        <rect x={42} y={9} width={66} height={32} rx={7} fill={tone} opacity={0.16} />
        <text x={75} y={30} textAnchor="middle" fill={tone} fontSize={13} fontFamily={MONO} fontWeight={700}>
          {spec.action}
        </text>
        {/* the clasp */}
        <circle cx={114} cy={25} r={6} fill="#0b1324" stroke={tone} strokeWidth={1.6} />
        <circle cx={114} cy={25} r={2} fill={tone} />
        <text x={128} y={23} fill={colors.TEXT} fontSize={13.5} fontWeight={650}>
          {spec.target}
        </text>
        <text x={128} y={39} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
          {spec.role} · obs v12
        </text>
      </g>
    </g>
  );
}

function Badge({ x, y, text, color, fill, u }: { x: number; y: number; text: string; color: string; fill: string; u: number }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const w = text.length * 6.5 + 20;
  return (
    <g transform={`translate(${x} ${y - 11}) scale(${0.9 + 0.1 * o})`} opacity={o}>
      <rect width={w} height={22} rx={6} fill={fill} stroke={color} strokeWidth={1.3} />
      <text x={w / 2} y={15} textAnchor="middle" fill={color} fontSize={10.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const phase = s.get(scene.phase);
  const growU = s.get(scene.growU);
  const treeU = s.get(scene.treeU);
  const marksU = s.get(scene.marksU);
  const formP = s.get(scene.formP);
  const tileU = s.get(scene.tileU);
  const tetherU = s.get(scene.tetherU);
  const hi0 = s.get(scene.hi0);
  const hi1 = s.get(scene.hi1);
  const rejectU = s.get(scene.rejectU);
  const ejectU = s.get(scene.ejectU);
  const ctxU = s.get(scene.ctxU);
  const flip = s.get(scene.taskFlipU);
  const sameU = s.get(scene.sameU);
  const stripU = s.get(scene.stripU);
  const strip2U = s.get(scene.strip2U);
  const gaugeU = s.get(scene.gaugeU);
  const wrongU = s.get(scene.wrongU);
  const rightU = s.get(scene.rightU);
  const unsureU = s.get(scene.unsureU);
  const missingU = s.get(scene.missingU);
  const routeU = s.get(scene.routeU);
  const escapeU = s.get(scene.escapeU);
  const takeU = s.get(scene.takeU);
  const dotsDim = s.get(scene.dotsDim);

  // spotlight discipline: one tile up, the rest a whisper
  const hi = [hi0, Math.max(hi1, rightU, routeU), 0, wrongU, escapeU];
  const focus = Math.max(...hi);
  const tileO = (j: number) => 1 - 0.62 * clamp01(focus - hi[j]);
  const markColor = (j: number) => (j === 3 && wrongU > 0.5 ? ROLE.INVALID : j === 1 && rightU > 0.5 ? ROLE.CHECKED : j === 1 && missingU > 0.5 ? ROLE.PENDING : ROLE.OBSERVE);

  const marks: ControlMark[] = [
    ...TILES.map((t, j) => ({
      id: t.control,
      u: clamp01(marksU * 5 - j) * tileO(j),
      color: markColor(j),
      dashed: (j === 3 && wrongU > 0.5) || (j === 1 && missingU > 0.5),
      tag: j === 1 && missingU > 0.5 ? 'not in inventory ?' : t.id,
    })),
    { id: 'save-button' as ControlId, u: clamp01(marksU * 5 - 4), color: rejectU > 0.5 ? ROLE.INVALID : colors.MUTED, dashed: true, tag: 'disabled' },
  ];
  const nameRect = controlRect('display-name-field', PLACE);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the live page: the anchor that never leaves */}
      <ProfilePage place={PLACE} opacity={s.get(scene.pageU)} marks={marks} obsLabel="observation v12" obsU={marksU} />
      <Badge x={PLACE.x + 70} y={PLACE.y + 440 * PLACE.scale + 22} text="this page, this moment: 5 controls · 4 ready" color={ROLE.OBSERVE} fill="#082f49" u={s.get(scene.countU)} />
      <Badge x={PLACE.x + 96} y={PLACE.y + 440 * PLACE.scale + 22} text="same page · same buttons · new ranking" color={ROLE.OBSERVE} fill="#082f49" u={sameU} />

      {/* beat 1 — open-ended text, as a tree of continuations */}
      {treeU > 0.002 && (
        <g opacity={treeU}>
          <text x={TREE_BOX.x - 10} y={50} fill={colors.TEXT} fontSize={15} fontWeight={650} opacity={clamp01(growU * 4)}>
            what a language model could write next
          </text>
          <text x={TREE_BOX.x - 10} y={68} fill={ROLE.PENDING} fontSize={10.5} fontFamily={MONO} opacity={clamp01(growU * 4)}>
            schematic words · not real tokenization
          </text>
          {TREE_LINKS.map((l, i) => {
            const u = clamp01(growU * 4.6 - (l.depth - 1) - 0.5 * l.order);
            if (u <= 0.002) return null;
            return <path key={i} d={l.d} fill="none" stroke={ROLE.MODEL} strokeWidth={1.2} opacity={0.5} pathLength={1} strokeDasharray={`${u} 1`} />;
          })}
          <circle cx={ROOT_XY.x} cy={ROOT_XY.y} r={7} fill={ROLE.MODEL} opacity={clamp01(growU * 8)} />
          {NODES.map((n, i) => {
            const u = clamp01(growU * 4.6 - (n.depth - 1) - 0.5 * (n.x / TREE_BOX.h) - 0.6);
            if (u <= 0.002) return null;
            const p = treeXY(n);
            return (
              <g key={i} opacity={u}>
                {n.data.w && (
                  <text x={p.x - 6} y={p.y - 7} textAnchor="end" fill={colors.TEXT} fontSize={n.depth === 1 ? 13 : 10.5} fontFamily={MONO} opacity={0.9}>
                    {n.data.w}
                  </text>
                )}
                {n.depth === 4 && <line x1={p.x + 6} y1={p.y} x2={p.x + 44} y2={p.y} stroke={ROLE.MODEL} strokeWidth={1} strokeDasharray="2 5" opacity={0.55} />}
              </g>
            );
          })}
          <text x={TREE_BOX.x + TREE_BOX.w + 50} y={TREE_BOX.y + TREE_BOX.h / 2 + 4} fill={ROLE.MODEL} fontSize={18} opacity={clamp01(growU * 4.6 - 3.6)}>
            …
          </text>
        </g>
      )}

      {/* the legal menu, tethered to the page */}
      <g opacity={clamp01(tileU * 3)}>
        <text x={TILE.x} y={68} fill={colors.TEXT} fontSize={14} fontWeight={650}>
          menu of legal choices
        </text>
        <text x={TILE.x} y={86} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          target + action, joined · built from the page
        </text>
      </g>
      <g opacity={s.get(scene.laneHeadU)}>
        <text x={LANE_X} y={70} fill={ROLE.MODEL} fontSize={12} fontFamily={MONO}>
          a model ranks the menu
        </text>
        <text x={LANE_X} y={86} fill={ROLE.PENDING} fontSize={10} fontFamily={MONO}>
          illustrative ranking scores · not probabilities
        </text>
        <ProposedTag x={LANE_X + 172} y={57} u={1} />
      </g>
      {TETHERS.map((d, j) => {
        const u = clamp01(tetherU * 1.6 - j * 0.15);
        if (u <= 0.002) return null;
        const miss = j === 1 ? missingU : 0;
        const strong = j === 1 ? routeU : 0;
        return (
          <path
            key={j}
            d={d}
            fill="none"
            stroke={miss > 0.5 ? ROLE.PENDING : ROLE.OBSERVE}
            strokeWidth={1.4 + 1.2 * hi[j] + 1.6 * strong}
            opacity={(0.55 + 0.45 * hi[j]) * tileO(j)}
            pathLength={1}
            strokeDasharray={miss > 0.5 ? '0.03 0.03' : `${u} 1`}
          />
        );
      })}
      {TILES.map((t, j) => (
        <g key={t.id} opacity={tileO(j)}>
          <JointTile spec={t} row={j} u={clamp01(tileU * 2.4 - j * 0.3)} emphasis={hi[j]} ghost={j === 1 ? missingU : 0} tone={j === 3 && wrongU > 0.5 ? ROLE.INVALID : ROLE.OBSERVE} />
        </g>
      ))}

      {/* the Save candidate: visible, but disabled → ejected from the menu */}
      {ejectU < 0.998 && tileU > 0.002 && (
        <g opacity={(1 - ejectU) * (1 - 0.62 * clamp01(focus - rejectU))} transform={`translate(${ejectU * 46} 0)`}>
          <path d={SAVE_TETHER} fill="none" stroke={rejectU > 0.5 ? ROLE.INVALID : colors.MUTED} strokeWidth={1.4} strokeDasharray="4 4" opacity={clamp01(tetherU * 1.6 - 0.6) * 0.8} />
          <JointTile spec={SAVE_TILE} row={UNSURE_ROW} u={clamp01(tileU * 2.4 - 1.2)} emphasis={rejectU} tone={rejectU > 0.5 ? ROLE.INVALID : colors.MUTED} />
          <g opacity={rejectU}>
            <line x1={TILE.x + 12} y1={rowY(UNSURE_ROW)} x2={TILE.x + TILE.w - 12} y2={rowY(UNSURE_ROW)} stroke={ROLE.INVALID} strokeWidth={2.2} />
            <Badge x={LANE_X} y={rowY(UNSURE_ROW)} text="✕ disabled → not a ready action" color={ROLE.INVALID} fill="#2a0c14" u={rejectU} />
          </g>
        </g>
      )}

      {/* the explicit unsure route */}
      {unsureU > 0.002 && (
        <g transform={`translate(${TILE.x + (1 - unsureU) * -26} ${TILE.y0 + UNSURE_ROW * TILE.step})`} opacity={unsureU * tileO(4)}>
          <rect width={TILE.w} height={TILE.h} rx={10} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={1.5 + escapeU * 1.4} strokeDasharray="7 4" />
          <circle cx={24} cy={25} r={12} fill="none" stroke={ROLE.PENDING} strokeWidth={1.8} />
          <text x={24} y={30} textAnchor="middle" fill={ROLE.PENDING} fontSize={15} fontWeight={800}>
            ?
          </text>
          <text x={46} y={23} fill={colors.TEXT} fontSize={13.5} fontWeight={650}>
            unsure · abstain
          </text>
          <text x={46} y={39} fill={ROLE.PENDING} fontSize={9.5} fontFamily={MONO}>
            an explicit route, never a guess
          </text>
        </g>
      )}
      <g opacity={missingU}>
        <Badge x={LANE_X} y={rowY(1)} text="? missing from the menu — cannot be chosen" color={ROLE.PENDING} fill="#1a1405" u={missingU} />
      </g>
      <Badge x={TILE.x} y={470} text="coverage gap: counted separately from ranking mistakes" color={ROLE.PENDING} fill="#1a1405" u={s.get(scene.gapChipU)} />

      {/* the 66 dots — tree, pool, and every ranking are the same objects */}
      <g opacity={dotsDim}>
        {NODES.map((_, i) => {
          const vis = formP < 0.001 ? clamp01(growU * 4.6 - (NODES[i].depth - 1) - 0.5 * (NODES[i].x / TREE_BOX.h) - 0.6) : 1;
          if (vis <= 0.002) return null;
          const p = dotAt(i, formP);
          return <circle key={i} cx={p.x} cy={p.y} r={3.6 + p.lift * 1.2} fill={ROLE.MODEL} opacity={vis * (0.82 + 0.18 * p.lift)} />;
        })}
      </g>
      <g opacity={s.get(scene.poolLblU) * (formP < 2.5 ? 1 : 0.4)}>
        <text x={POOL.x + 12} y={438} textAnchor="middle" fill={ROLE.MODEL} fontSize={10} fontFamily={MONO}>
          model
        </text>
        <text x={POOL.x + 12} y={450} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
          budget
        </text>
      </g>

      {/* beat 6 — two separate verdicts: legal? useful? */}
      <Badge x={LANE_X} y={rowY(3)} text="✓ legal · enabled" color={ROLE.OBSERVE} fill="#082f49" u={clamp01(wrongU * 2 - 0.6)} />
      <Badge x={LANE_X + 140} y={rowY(3)} text="✕ wrong for this task" color={ROLE.INVALID} fill="#2a0c14" u={s.get(scene.wrongBadgeU) * clamp01(wrongU * 2 - 0.6)} />
      <Badge x={LANE_X} y={rowY(1)} text="✓ legal · enabled" color={ROLE.OBSERVE} fill="#082f49" u={rightU} />
      <Badge x={LANE_X + 140} y={rowY(1)} text="✓ useful for this task" color={ROLE.CHECKED} fill="#062a1e" u={clamp01(rightU * 2 - 0.8)} />

      {/* beat 4 — context feeds the ranking */}
      {ctxU > 0.002 && (
        <g>
          <path d={`M${CTX[0].x} 476H${CTX[2].x + CTX[2].w}M${LANE_X + 140} 476V452`} fill="none" stroke={ROLE.MODEL} strokeWidth={1.5} opacity={clamp01(ctxU * 3 - 2) * 0.8} />
          <path d={`M${LANE_X + 140} 446l-6 9h12Z`} fill={ROLE.MODEL} opacity={clamp01(ctxU * 3 - 2)} />
          {CTX.map((c, i) => {
            const u = clamp01(ctxU * 3 - i * 0.8);
            if (u <= 0.002) return null;
            return (
              <g key={c.head} transform={`translate(${c.x} ${486 + (1 - u) * 12})`} opacity={u}>
                <rect width={c.w} height={56} rx={10} fill="#171335" stroke={ROLE.MODEL} strokeWidth={1.3 + (i === 2 ? flip * 1.4 : 0)} />
                <text x={12} y={20} fill={ROLE.MODEL} fontSize={10} fontFamily={MONO} letterSpacing={1}>
                  {c.head}
                </text>
                {i < 2 ? (
                  <text x={12} y={41} fill={colors.TEXT} fontSize={13}>
                    {c.body}
                  </text>
                ) : (
                  <>
                    <text x={12} y={41} fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={1 - flip}>
                      none stated
                    </text>
                    <text x={12} y={41} fill={colors.TEXT} fontSize={12.5} fontWeight={600} opacity={flip}>
                      “{TASK_TEXT}”
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* beat 5 — a ribbon of text to validate, versus one id */}
      {(stripU > 0.002 || strip2U > 0.002) && (
        <g>
          <text x={STRIP.x} y={STRIP.y1 - 9} fill={colors.MUTED} fontSize={11.5} opacity={clamp01(stripU * 4)}>
            generated instruction — many output pieces, then parse and validate free text
          </text>
          {Array.from({ length: STRIP.n }, (_, i) => {
            const u = clamp01(stripU * STRIP.n - i);
            if (u <= 0.002) return null;
            return <rect key={i} x={stripX(i)} y={STRIP.y1} width={STRIP.cell} height={20} rx={4} fill={ROLE.MODEL} opacity={0.75 * u} />;
          })}
          <g opacity={clamp01(stripU * STRIP.n - STRIP.n + 1)}>
            <rect x={stripX(STRIP.n) + 4} y={STRIP.y1 - 1} width={40} height={22} rx={5} fill="#1a1405" stroke={ROLE.PENDING} strokeDasharray="4 3" />
            <text x={stripX(STRIP.n) + 24} y={STRIP.y1 + 14} textAnchor="middle" fill={ROLE.PENDING} fontSize={10} fontFamily={MONO}>
              parse?
            </text>
          </g>
          {/* the ribbon folds: a ghost of every cell collapses into the single id */}
          {Array.from({ length: STRIP.n }, (_, i) => {
            if (strip2U <= 0.002 || strip2U >= 0.998) return null;
            const u = easeCubicInOut(clamp01(strip2U * 1.4 - 0.4 * (i / STRIP.n)));
            return <rect key={i} x={lerp(stripX(i), STRIP.x, u)} y={lerp(STRIP.y1, STRIP.y2, u)} width={STRIP.cell} height={20} rx={4} fill={ROLE.MODEL} opacity={0.35 * (1 - u)} />;
          })}
          <g opacity={clamp01(strip2U * 2 - 1)}>
            <text x={STRIP.x} y={STRIP.y2 - 9} fill={colors.MUTED} fontSize={11.5}>
              menu choice — one id, checked against the inventory
            </text>
            <rect x={STRIP.x} y={STRIP.y2} width={44} height={20} rx={4} fill={ROLE.MODEL} />
            <text x={STRIP.x + 22} y={STRIP.y2 + 14} textAnchor="middle" fill="#0a0e1a" fontSize={11} fontFamily={MONO} fontWeight={700}>
              c2
            </text>
            <text x={STRIP.x + 56} y={STRIP.y2 + 14} fill={ROLE.CHECKED} fontSize={10.5} fontFamily={MONO}>
              ✓ id exists in observation v12
            </text>
            <text x={STRIP.x + 300} y={STRIP.y2 + 14} fill={ROLE.PENDING} fontSize={10} fontFamily={MONO}>
              unscaled · not measured
            </text>
          </g>
          {gaugeU > 0.002 && (
            <g transform={`translate(${GAUGE.cx} ${GAUGE.cy})`} opacity={gaugeU}>
              <path d={GAUGE_ARC} fill="none" stroke={ROLE.PENDING} strokeWidth={1.4} strokeDasharray="5 4" />
              <text y={-8} textAnchor="middle" fill={ROLE.PENDING} fontSize={17} fontWeight={800}>
                ?
              </text>
              <text y={-58} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontWeight={650}>
                whole experience faster?
              </text>
              <text y={18} textAnchor="middle" fill={ROLE.PENDING} fontSize={10} fontFamily={MONO}>
                empty gauge · must be measured
              </text>
            </g>
          )}
        </g>
      )}

      {/* beat 8 — the short path lands on the page; the escape route leaves the fast path */}
      <SuggestHalo rect={nameRect} u={s.get(scene.haloU)} phase={phase} label="chosen · still to be checked" />
      {escapeU > 0.002 && (
        <g>
          <path d={`M${TILE.x + TILE.w + 8} ${rowY(UNSURE_ROW) + 34}H1236`} fill="none" stroke={ROLE.PENDING} strokeWidth={2.4} pathLength={1} strokeDasharray={`${escapeU} 1`} />
          <path d="M1246 439l-12 -7v14Z" fill={ROLE.PENDING} opacity={clamp01(escapeU * 5 - 4)} />
          <text x={1236} y={rowY(UNSURE_ROW) + 54} textAnchor="end" fill={ROLE.PENDING} fontSize={11.5} fontFamily={MONO} opacity={clamp01(escapeU * 2 - 0.8)}>
            escape route → slower path · ask · fall back
          </text>
        </g>
      )}
      {takeU > 0.002 && (
        <g opacity={takeU} transform={`translate(0 ${(1 - takeU) * 10})`}>
          <text x={640} y={502} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={750}>
            Constrain the decision space.
          </text>
          <text x={640} y={534} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            A valid answer is not yet a correct one.
          </text>
          <ProposedTag x={846} y={484} u={1} text="PRODUCT HYPOTHESIS" />
        </g>
      )}
    </Camera>
  );
}

export const vizScene = () => scene;
