// Build the menu from the living page
//
// Book 3 "Decisions Become Actions", chapter 1 — PROPOSED browser-action architecture.
// Sources: charter — Browser-action invariants 1–3; E7 milestone (live candidate
// inventory). Nothing here is a current implementation: every capability is
// labelled PROPOSED. Scores are ILLUSTRATIVE ranking scores, hand-written, not
// probabilities or measurements. Observation versions and candidate ids are
// synthetic teaching fixtures.
//
// ONE persistent mechanism: a candidate LATTICE (targets × actions, d3.scaleBand).
// The recurring Profile page is scanned; legal joint target+action tiles fly out
// of their live controls into lattice cells and stay tethered to them. The same
// lattice is then probed by two independent pickers (a bad cell), bound to an
// observation badge by a rail, invalidated and re-issued on a re-render, scored
// by task context, read by two proposed rankers, and finally loses a row.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 push in on the page; an observation sweep marks eligible / disabled controls
//  2 tiles fly into the lattice; open · focus · fill · click; disabled Save filtered
//  3 zoom: independent target + action picks meet in an impossible cell → one joint id
//  4 observation rail stamps v12; a re-render makes ids stale; re-issued at v13
//  5 task + history arrive; three tasks re-rank the same tiles
//  6 small policy vs larger model dock into the same decision contract
//  7 the useful row goes missing → coverage gap, tallied apart from ranking mistakes
//  8 menu, model, live page must agree → opaque closing panel
import { easeCubicInOut, linkHorizontal, scaleBand, scaleLinear } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MONO, ProfilePage, ProposedTag, ROLE, SuggestHalo, captionPlan, controlRect, rectCenter } from '../next-useful-action/shared/profile-page';
import type { ControlId, ControlMark, PagePlacement } from '../next-useful-action/shared/profile-page';
import { Chip, clamp01, corners, lerp, tri } from './shared/kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Now return to our profile page. Before asking a model what to do, the system observes the page and constructs the actions it can currently support.',
  'Each candidate joins a target with an action. Open this menu. Focus this field. Fill this editable control. Click this available button.',
  'Keeping those pieces together prevents a bad combination, such as selecting one element and independently selecting an action that element cannot perform.',
  'Each candidate also belongs to a particular page observation. It is a temporary reference to something seen now, rather than a permanent identity for that control.',
  'The task and recent history accompany the menu. Changing a name should guide the ranking differently from reviewing account settings or signing out.',
  'A small policy could rank these candidates directly. A larger model could choose among them through a constrained interface, using the same decision contract.',
  'But a model cannot choose a useful target that the inventory never found. We have to measure that missing coverage separately from ranking mistakes.',
  'This is where bounded decisions become a product system: the menu, the model, and the live page all have to agree about what a choice means.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;
const END = PLAN.end + 1.0;

/* ---------------------------------------------------------------- layout */
const PLACE: PagePlacement = { x: 30, y: 96, scale: 0.8 };
const PAGE_BOTTOM = PLACE.y + 440 * PLACE.scale;
const CAM_PAGE: CameraState = { x: 254, y: 290, k: 1.25 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_LATTICE: CameraState = { x: 915, y: 285, k: 1.2 };

const ROWS: { control: ControlId; name: string; role: string }[] = [
  { control: 'profile-menu', name: 'Profile menu', role: 'button' },
  { control: 'display-name-field', name: 'Display name', role: 'textbox' },
  { control: 'email-field', name: 'Email', role: 'textbox' },
  { control: 'sign-out-link', name: 'Sign out', role: 'link' },
  { control: 'save-button', name: 'Save', role: 'button · disabled' },
];
const ACTIONS = ['open', 'focus', 'fill', 'click'];
const colBand = scaleBand<string>().domain(ACTIONS).range([728, 1236]).paddingInner(0.08);
const rowBand = scaleBand<string>().domain(ROWS.map((r) => r.control)).range([132, 446]).paddingInner(0.12);
const CW = colBand.bandwidth();
const RH = rowBand.bandwidth();
const colX = (p: number) => 728 + p * colBand.step(); // continuous, so pickers can slide
const rowY = (p: number) => 132 + p * rowBand.step();
const LABEL_X = 590;
const RAIL_X = 1246;
const BADGE = { x: 968, y: 36, w: 268, h: 50 };

/** Legal joint candidates: (row, col) cells of the lattice. Save·click is filtered. */
const CANDS = [
  { n: 1, row: 0, col: 0 },
  { n: 2, row: 1, col: 1 },
  { n: 3, row: 1, col: 2 },
  { n: 4, row: 2, col: 1 },
  { n: 5, row: 2, col: 2 },
  { n: 6, row: 3, col: 3 },
];
const HI_TILE = [0, 1, 2, 5]; // beat 2 spotlight order: open, focus, fill, click
const SAVE = { row: 4, col: 3 };
const BAD = { row: 3, col: 2 }; // fill × Sign out link — no such action

// ILLUSTRATIVE ranking scores per tile for: Brett task, review settings, sign out,
// Brett again, Display-name row missing, Brett restored. Hand-written, not measured.
const SCORE_SETS = [
  [0.3, 0.75, 1.0, 0.15, 0.2, 0.1],
  [1.0, 0.25, 0.15, 0.25, 0.15, 0.2],
  [0.35, 0.1, 0.05, 0.1, 0.05, 1.0],
  [0.3, 0.75, 1.0, 0.15, 0.2, 0.1],
  [0.45, 0, 0, 0.7, 0.6, 0.2],
  [0.3, 0.75, 1.0, 0.15, 0.2, 0.1],
];
const SCORE = CANDS.map((_, k) => scaleLinear().domain([0, 1, 2, 3, 4, 5]).range(SCORE_SETS.map((set) => set[k])).clamp(true));
const TASKS = ['“Change my display name to Brett”', '“Review my account settings”', '“Sign me out”'];

const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();
const TETHERS = ROWS.map((r, j) => {
  const c = controlRect(r.control, PLACE);
  return hlink({ source: [LABEL_X - 4, rowY(j) + RH / 2], target: [c.x + c.w + 7, c.y + c.h / 2] }) ?? '';
});
const ORIGINS = CANDS.map((c) => rectCenter(controlRect(ROWS[c.row].control, PLACE)));
// observation rail: badge → down the right edge → a stub under each row's tiles
const ROW_LEFT_COL = [0, 1, 1, 3, 3];
const RAIL = `M${BADGE.x + BADGE.w} ${BADGE.y + 25}H${RAIL_X}V${rowY(4) + RH + 4}`;
const STUBS = ROWS.map((_, j) => `M${RAIL_X} ${rowY(j) + RH + 4}H${colX(ROW_LEFT_COL[j]) + 6}`);
// beat-1 eligibility chips, in the page's reserved gutter (stage coordinates)
const ELIG = [
  { x: 262, y: 134 },
  { x: 334, y: 243 },
  { x: 334, y: 304 },
  { x: 372, y: 392 },
  { x: 155, y: 362 },
];
const SLOT = { x: 987, y: 148 }; // verdict chip slot: row 0, columns fill–click are empty

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAGE, cameraInterp);
  const phase = tl.channel('phase', 0);
  tl.tween(phase, END / 2.4, { at: 0, dur: END, ease: ease.linear });
  const ch = (key: string, v = 0) => tl.channel(key, v);
  const pageU = ch('pageU'), scanU = ch('scanU'), eligU = ch('eligU'), latticeU = ch('latticeU'), badgeU = ch('badgeU');
  const tilesU = ch('tilesU'), tetherU = ch('tetherU'), hiP = ch('hiP', -1.5), rejectU = ch('rejectU'), ejectU = ch('ejectU');
  const pickU = ch('pickU'), rowP = ch('rowP', 0), colP = ch('colP', 0), badU = ch('badU'), jointU = ch('jointU'), selU = ch('selU');
  const railU = ch('railU'), stampU = ch('stampU'), scan2U = ch('scan2U'), verU = ch('verU'), staleU = ch('staleU'), reissueU = ch('reissueU'), ephemU = ch('ephemU');
  const ctxU = ch('ctxU'), barsU = ch('barsU'), rankLblU = ch('rankLblU'), scoreP = ch('scoreP');
  const contractU = ch('contractU'), smallU = ch('smallU'), largeU = ch('largeU'), dockS = ch('dockS'), dockL = ch('dockL'), glowU = ch('glowU'), chooseU = ch('chooseU');
  const missingU = ch('missingU'), warnU = ch('warnU'), tallyU = ch('tallyU'), dropU = ch('dropU');
  const agreeU = ch('agreeU'), haloU = ch('haloU'), stageDim = ch('stageDim', 1), panelU = ch('panelU');

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));
  const to = (c: typeof pageU, v: number, at: number, dur = 0.6, e = ease.enter) => tl.tween(c, v, { at, dur, ease: e });

  /* — beat 1 · observe visible and eligible controls — */
  let b = AT[0];
  to(pageU, 1, b + 0.2, 0.8);
  to(scanU, 1, b + 1.6, 3.2, ease.linear);
  to(eligU, 1, b + 1.6, 0.4);
  tl.tween(cam, CAM_HOME, { at: b + 5.6, dur: 1.5, ease: ease.move });
  to(latticeU, 1, b + 7.2, 1.4, ease.draw); // revealed only after the pullback
  to(badgeU, 1, b + 8.6, 0.5, ease.pop);

  /* — beat 2 · joint tiles leave their controls; disabled Save is filtered — */
  b = AT[1];
  to(eligU, 0, b + 0.1, 0.4);
  to(tilesU, 1, b + 0.4, 2.6, ease.linear);
  to(tetherU, 1, b + 0.6, 2.4, ease.draw);
  [3.1, 4.4, 5.7, 7.2].forEach((dt, k) => to(hiP, k, b + dt, 0.4, ease.move));
  to(rejectU, 1, b + 7.9, 0.5, ease.pop);
  to(ejectU, 1, b + 9.0, 0.8, ease.move);
  to(hiP, 4.5, b + 9.6, 0.5, ease.move);

  /* — beat 3 · independent picks collide with an impossible cell — */
  b = AT[2];
  to(pageU, 0, b + 0.1, 0.5); // page + tethers leave BEFORE the zoom would cut them
  to(tetherU, 0, b + 0.1, 0.5);
  tl.tween(cam, CAM_LATTICE, { at: b + 0.6, dur: 1.2, ease: ease.move });
  to(pickU, 1, b + 1.6, 0.5);
  to(rowP, BAD.row, b + 2.2, 1.0, ease.move);
  to(colP, BAD.col, b + 2.6, 1.0, ease.move);
  to(badU, 1, b + 3.8, 0.5, ease.pop);
  to(badU, 0, b + 6.2, 0.4);
  to(pickU, 0, b + 6.2, 0.5);
  to(selU, 1, b + 6.2, 0.5);
  to(rowP, 1, b + 6.6, 1.0, ease.move);
  to(jointU, 1, b + 7.6, 0.5, ease.pop);
  tl.tween(cam, CAM_HOME, { at: b + 8.7, dur: 1.2, ease: ease.move });

  /* — beat 4 · bound to one observation; ids are temporary — */
  b = AT[3];
  to(jointU, 0, b + 0.1, 0.4);
  to(selU, 0, b + 0.1, 0.4);
  to(pageU, 1, b + 0.2, 0.6); // back only after the pullback
  to(tetherU, 1, b + 0.3, 0.9, ease.draw);
  to(railU, 1, b + 0.9, 1.4, ease.draw);
  to(stampU, 1, b + 2.0, 0.9);
  to(scan2U, 1, b + 4.4, 1.4, ease.linear);
  to(verU, 1, b + 5.6, 0.5, ease.pop);
  to(staleU, 1, b + 5.9, 0.5);
  to(staleU, 0, b + 8.2, 0.8, ease.move);
  to(reissueU, 1, b + 8.2, 0.8, ease.move);
  to(ephemU, 1, b + 9.0, 0.6);

  /* — beat 5 · task + history guide the ranking — */
  b = AT[4];
  to(ephemU, 0, b + 0.1, 0.4);
  to(ctxU, 1, b + 0.4, 1.0);
  to(barsU, 1, b + 1.8, 1.2, ease.move);
  to(rankLblU, 1, b + 2.2, 0.6);
  to(scoreP, 1, b + 6.0, 1.0, ease.move);
  to(scoreP, 2, b + 8.0, 0.9, ease.move);
  to(scoreP, 3, b + 9.7, 0.9, ease.move);

  /* — beat 6 · two proposed rankers, one decision contract — */
  b = AT[5];
  to(rankLblU, 0, b + 0.1, 0.4);
  to(contractU, 1, b + 0.5, 0.6);
  to(smallU, 1, b + 0.7, 0.6);
  to(largeU, 0.35, b + 0.7, 0.6);
  to(dockS, 1, b + 1.4, 0.6, ease.move);
  to(glowU, 1, b + 2.0, 0.7);
  to(glowU, 0, b + 3.6, 0.5);
  to(dockS, 0, b + 3.8, 0.5, ease.move);
  to(smallU, 0.35, b + 3.8, 0.5);
  to(largeU, 1, b + 3.8, 0.5);
  to(dockL, 1, b + 4.3, 0.6, ease.move);
  to(selU, 1, b + 5.4, 0.5);
  to(chooseU, 1, b + 5.8, 0.5, ease.pop);
  to(smallU, 1, b + 8.4, 0.5); // "the same decision contract": both plugged in
  to(dockS, 1, b + 8.4, 0.6, ease.move);

  /* — beat 7 · a useful target the inventory never found — */
  b = AT[6];
  [contractU, smallU, largeU, dockS, dockL, chooseU].forEach((c) => to(c, 0, b + 0.1, 0.5));
  to(missingU, 1, b + 0.8, 0.8, ease.move);
  to(scoreP, 4, b + 1.4, 1.2, ease.move);
  to(rowP, 2, b + 2.6, 1.0, ease.move);
  to(colP, 1, b + 2.6, 1.0, ease.move);
  to(warnU, 1, b + 3.6, 0.5, ease.pop);
  to(tallyU, 1, b + 5.0, 0.7);
  to(dropU, 1, b + 6.2, 1.2, ease.move);

  /* — beat 8 · menu, model and live page must agree — */
  b = AT[7];
  to(tallyU, 0, b + 0.1, 0.5);
  to(dropU, 0, b + 0.7, 0.1); // after its tally card has fully faded
  to(warnU, 0, b + 0.1, 0.4);
  to(missingU, 0, b + 0.4, 0.8, ease.move);
  to(scoreP, 5, b + 0.6, 1.0, ease.move);
  to(rowP, 1, b + 1.4, 0.9, ease.move);
  to(colP, 2, b + 1.4, 0.9, ease.move);
  to(agreeU, 1, b + 3.4, 2.8, ease.linear);
  to(haloU, 1, b + 5.4, 0.6);
  to(stageDim, 0.1, b + 8.2, 0.8, ease.move);
  to(agreeU, 0, b + 8.2, 0.6);
  to(haloU, 0, b + 8.2, 0.6);
  to(panelU, 1, b + 8.9, 0.8);
  tl.hold(PLAN.end, 1.0);

  return {
    tl, cam, phase, pageU, scanU, eligU, latticeU, badgeU, tilesU, tetherU, hiP, rejectU, ejectU, pickU, rowP, colP, badU, jointU, selU,
    railU, stampU, scan2U, verU, staleU, reissueU, ephemU, ctxU, barsU, rankLblU, scoreP, contractU, smallU, largeU, dockS, dockL, glowU,
    chooseU, missingU, warnU, tallyU, dropU, agreeU, haloU, stageDim, panelU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */

/** A joint candidate: action and target fused in one tile — never chosen separately. */
function Tile({ x, y, scale = 1, opacity, id, action, target, stamp, stampU, tone, ghost, ghostTag, emphasis, score, barU }: {
  x: number; y: number; scale?: number; opacity: number; id: string; action: string; target: string; stamp: string; stampU: number;
  tone: string; ghost: number; ghostTag: string; emphasis: number; score: number; barU: number;
}) {
  if (opacity <= 0.002) return null;
  const g = clamp01(ghost);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect width={CW} height={RH} rx={9} fill="#0b1324" stroke={tone} strokeWidth={1.4 + emphasis * 1.8} strokeDasharray={g > 0.5 ? '6 4' : undefined} />
      <g opacity={1 - 0.72 * g}>
        <text x={9} y={15} fill={tone} fontSize={11.5} fontFamily={MONO}>{id}</text>
        <text x={9} y={33} fill={tone} fontSize={15.5} fontFamily={MONO} fontWeight={700}>{action}</text>
        <circle cx={13} cy={42} r={4} fill="none" stroke={tone} strokeWidth={1.5} />
        <circle cx={13} cy={42} r={1.4} fill={tone} />
        <text x={22} y={46} fill={colors.TEXT} fontSize={11.5}>{target}</text>
        <rect x={9} y={RH - 5.5} width={(CW - 18) * score * barU} height={3.5} rx={1.75} fill={ROLE.MODEL} />
      </g>
      <text x={CW - 8} y={15} textAnchor="end" fill={g > 0.5 ? tone : ROLE.OBSERVE} fontSize={10.5} fontFamily={MONO} opacity={Math.max(stampU, g)}>
        {g > 0.5 ? ghostTag : stamp}
      </text>
    </g>
  );
}

function Card({ x, y, w, h, head, body, sub, color, fill, u, strong = 0 }: { x: number; y: number; w: number; h: number; head: string; body: string; sub?: string; color: string; fill: string; u: number; strong?: number }) {
  if (u <= 0.002) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp01(u)}>
      <rect width={w} height={h} rx={10} fill={fill} stroke={color} strokeWidth={1.4 + strong * 1.6} />
      <text x={13} y={20} fill={color} fontSize={11.5} fontFamily={MONO} letterSpacing={0.6}>{head}</text>
      <text x={13} y={41} fill={colors.TEXT} fontSize={14.5} fontWeight={600}>{body}</text>
      {sub && <text x={13} y={58} fill={ROLE.PENDING} fontSize={11} fontFamily={MONO}>{sub}</text>}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const g = (c: typeof scene.pageU): number => s.get(c);
  const pageU = g(scene.pageU), scanU = g(scene.scanU), scan2U = g(scene.scan2U), eligU = g(scene.eligU), latticeU = g(scene.latticeU);
  const tilesU = g(scene.tilesU), tetherU = g(scene.tetherU), hiP = g(scene.hiP), rejectU = g(scene.rejectU), ejectU = g(scene.ejectU);
  const pickU = g(scene.pickU), rowP = g(scene.rowP), colP = g(scene.colP), badU = g(scene.badU), selU = g(scene.selU);
  const railU = g(scene.railU), stampU = g(scene.stampU), verU = g(scene.verU), staleU = g(scene.staleU), reissueU = g(scene.reissueU);
  const ctxU = g(scene.ctxU), scoreP = g(scene.scoreP), missingU = g(scene.missingU), warnU = g(scene.warnU), tallyU = g(scene.tallyU);
  const dropU = g(scene.dropU), agreeU = g(scene.agreeU), contractU = g(scene.contractU), dockS = g(scene.dockS), dockL = g(scene.dockL);
  const panelU = g(scene.panelU);

  const idOf = (n: number) => `${reissueU > 0.5 ? 'd' : 'c'}${n}`;
  const ver = reissueU > 0.5 ? 'v13' : 'v12';
  const scanning = scanU < 0.999 ? scanU : scan2U;
  const scanY = lerp(PLACE.y, PAGE_BOTTOM, scanning);
  const seen = (j: number) => (scanU >= 0.999 ? 1 : clamp01((scanY - controlRect(ROWS[j].control, PLACE).y) / 16));

  // spotlight discipline: one tile up, the rest a whisper
  const scores = CANDS.map((_, k) => SCORE[k](scoreP));
  const top = scores.indexOf(Math.max(...scores));
  const emph = CANDS.map((c, k) => Math.max(HI_TILE.indexOf(k) >= 0 ? tri(hiP, HI_TILE.indexOf(k)) : 0, selU * clamp01(1 - (Math.abs(rowP - c.row) + Math.abs(colP - c.col)) * 1.5)));
  const focus = Math.max(...emph, pickU);
  const tileO = (k: number) => 1 - 0.6 * clamp01(focus - emph[k]);

  const marks: ControlMark[] = ROWS.map((r, j) => ({
    id: r.control,
    u: seen(j),
    color: j === 4 ? colors.MUTED : j === 1 && missingU > 0.5 ? ROLE.PENDING : ROLE.OBSERVE,
    dashed: j === 4 || (j === 1 && missingU > 0.5),
  }));
  const nameRect = controlRect('display-name-field', PLACE);
  // the cursor's tone follows the cell it is over: only real candidates are choosable
  const overLegal = CANDS.some((c) => c.row === Math.round(rowP) && c.col === Math.round(colP));
  const overMissing = missingU > 0.5 && Math.round(rowP) === 1;
  const selTone = !overLegal ? ROLE.INVALID : warnU > 0.5 || overMissing ? ROLE.PENDING : ROLE.CHECKED;
  const taskP = Math.min(scoreP, 3);
  const taskW = [tri(taskP, 0) + tri(taskP, 3), tri(taskP, 1), tri(taskP, 2)];
  const drop = easeCubicInOut(clamp01(dropU));

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={g(scene.stageDim)}>
        {/* ---------------- the living page: observed, never assumed ---------------- */}
        <g opacity={pageU}>
          <text x={30} y={60} fill={colors.TEXT} fontSize={17} fontWeight={650}>the living page</text>
          <text x={30} y={80} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>fictional demo · observed now</text>
        </g>
        <ProfilePage place={PLACE} opacity={pageU * (1 - 0.3 * Math.sin(Math.PI * scan2U))} marks={marks} obsLabel={`observation ${verU > 0.5 ? 'v13' : 'v12'}`} obsU={clamp01(scanU * 4 - 3)} />
        {scanning > 0.001 && scanning < 0.999 && (
          <g opacity={clamp01(Math.min(scanning, 1 - scanning) * 10) * pageU}>
            <rect x={PLACE.x} y={scanY - 26} width={560 * PLACE.scale} height={26} fill={ROLE.OBSERVE} opacity={0.08} />
            <line x1={PLACE.x} x2={PLACE.x + 560 * PLACE.scale} y1={scanY} y2={scanY} stroke={ROLE.OBSERVE} strokeWidth={2} />
          </g>
        )}
        {ELIG.map((p, j) => (
          <Chip key={j} x={p.x} y={p.y} size={12} text={j === 4 ? '✕ disabled' : '✓ eligible'} color={j === 4 ? colors.MUTED : ROLE.OBSERVE} dashed={j === 4} u={eligU * seen(j) * pageU} />
        ))}
        {TETHERS.map((d, j) => {
          const u = clamp01(tetherU * 1.8 - j * 0.2) * (j === 4 ? 1 - ejectU : 1);
          if (u <= 0.002) return null;
          const miss = j === 1 && missingU > 0.5;
          const agree = j === 1 ? clamp01(agreeU * 3) : 0;
          const rowHi = Math.max(0, ...CANDS.map((c, k) => (c.row === j ? emph[k] : 0)));
          return <path key={j} d={d} fill="none" stroke={miss ? ROLE.PENDING : agree > 0.5 ? ROLE.CHECKED : j === 4 ? colors.MUTED : ROLE.OBSERVE} strokeWidth={1.5 + 1.4 * rowHi + 1.4 * agree} opacity={pageU * (0.5 + 0.5 * Math.max(rowHi, agree))} pathLength={1} strokeDasharray={miss || j === 4 ? '0.025 0.025' : `${u} 1`} />;
        })}
        <Chip x={334} y={243} size={12} text="? not listed" color={ROLE.PENDING} fill="#1a1405" dashed u={missingU * pageU} />
        <SuggestHalo rect={nameRect} u={g(scene.haloU)} phase={g(scene.phase)} />
        <Chip x={342} y={243} size={12} text="to be checked" color={ROLE.MODEL} fill="#1a1333" dashed u={g(scene.haloU)} />

        {/* ---------------- the candidate lattice: targets × actions ---------------- */}
        <g opacity={clamp01(latticeU * 3)}>
          <text x={LABEL_X} y={58} fill={colors.TEXT} fontSize={17} fontWeight={650}>candidate lattice</text>
          <text x={LABEL_X} y={80} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>target × action · legal pairs only</text>
          <ProposedTag x={762} y={44} u={1} />
        </g>
        {ACTIONS.map((a, c) => (
          <text key={a} x={colX(c) + CW / 2} y={124} textAnchor="middle" fill={ROLE.OBSERVE} fontSize={15} fontFamily={MONO} opacity={clamp01(latticeU * 3 - 0.4 * c)}>{a}</text>
        ))}
        {ROWS.map((r, j) => {
          const u = clamp01(latticeU * 3 - 0.3 * j - 0.6);
          const miss = j === 1 ? missingU : 0;
          return (
            <g key={r.control} opacity={u * (j === 4 ? 1 - 0.55 * ejectU : 1)}>
              <text x={LABEL_X} y={rowY(j) + 24} fill={colors.TEXT} fontSize={15} fontWeight={650} opacity={1 - 0.6 * miss}>{r.name}</text>
              <text x={LABEL_X} y={rowY(j) + 42} fill={miss > 0.5 ? ROLE.PENDING : colors.MUTED} fontSize={11.5} fontFamily={MONO}>{miss > 0.5 ? 'never found' : r.role}</text>
              {ACTIONS.map((a, c) => (
                <rect key={a} x={colX(c)} y={rowY(j)} width={CW} height={RH} rx={9} fill="none" stroke="#2a3754" strokeWidth={1} strokeDasharray="2 5" opacity={clamp01(latticeU * 3 - 0.25 * (j + c))} />
              ))}
            </g>
          );
        })}

        {/* observation badge + rail: every tile belongs to ONE observation */}
        <g transform={`translate(${BADGE.x} ${BADGE.y})`} opacity={g(scene.badgeU)}>
          <rect width={BADGE.w} height={BADGE.h} rx={12} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={1.6 + 1.6 * Math.sin(Math.PI * clamp01(verU))} />
          <circle cx={18} cy={19} r={5} fill={ROLE.OBSERVE} />
          <text x={32} y={24} fill={ROLE.OBSERVE} fontSize={15} fontFamily={MONO} fontWeight={700}>OBSERVATION {verU > 0.5 ? 'v13' : 'v12'}</text>
          <text x={14} y={42} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>page /profile · frame main · now</text>
        </g>
        {railU > 0.002 && (
          <g opacity={0.85 - 0.5 * staleU}>
            <path d={RAIL} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.8} pathLength={1} strokeDasharray={`${clamp01(railU * 1.6)} 1`} />
            {STUBS.map((d, j) => (j === 4 || (j === 1 && missingU > 0.5) ? null : <path key={j} d={d} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.5} pathLength={1} strokeDasharray={`${clamp01(railU * 2.4 - 0.9 - j * 0.12)} 1`} />))}
          </g>
        )}

        {/* the joint tiles: born at their live control, parked in their cell */}
        {CANDS.map((c, k) => {
          const t = easeCubicInOut(clamp01(tilesU * 2.4 - k * 0.24));
          const o = ORIGINS[k];
          const miss = c.row === 1 ? missingU : 0;
          return (
            <Tile key={c.n} x={lerp(o.x - CW * 0.2, colX(c.col), t)} y={lerp(o.y - RH * 0.2, rowY(c.row), t)} scale={lerp(0.4, 1, t)} opacity={clamp01(t * 3) * tileO(k)}
              id={idOf(c.n)} action={ACTIONS[c.col]} target={`+ ${ROWS[c.row].name}`} stamp={ver} stampU={stampU} tone={miss > 0.5 ? ROLE.PENDING : staleU > 0.5 ? ROLE.INVALID : ROLE.OBSERVE}
              ghost={Math.max(staleU, miss)} ghostTag={miss > 0.5 ? 'not found' : 'v12 stale ✕'} emphasis={Math.max(emph[k], k === top ? g(scene.barsU) * 0.6 : 0, g(scene.glowU) * 0.7)} score={scores[k]} barU={g(scene.barsU)} />
          );
        })}
        {/* Save · click — visible on the page, but disabled → filtered out of the menu */}
        {(() => {
          const t = easeCubicInOut(clamp01(tilesU * 2.4 - 1.38));
          const o = rectCenter(controlRect('save-button', PLACE));
          return (
            <g opacity={(1 - ejectU) * (1 - 0.6 * clamp01(focus - Math.max(rejectU, tri(hiP, 3))))} transform={`translate(${ejectU * 30} 0)`}>
              <Tile x={lerp(o.x - CW * 0.2, colX(SAVE.col), t)} y={lerp(o.y - RH * 0.2, rowY(SAVE.row), t)} scale={lerp(0.4, 1, t)} opacity={clamp01(t * 3)} id="—" action="click" target="+ Save"
                stamp="" stampU={0} tone={rejectU > 0.5 ? ROLE.INVALID : colors.MUTED} ghost={1} ghostTag="disabled" emphasis={rejectU} score={0} barU={0} />
              <line x1={colX(SAVE.col) + 10} x2={colX(SAVE.col) + CW - 10} y1={rowY(SAVE.row) + RH / 2} y2={rowY(SAVE.row) + RH / 2} stroke={ROLE.INVALID} strokeWidth={2.4} opacity={rejectU} />
            </g>
          );
        })()}
        <text x={colX(SAVE.col) + CW / 2} y={rowY(SAVE.row) + RH / 2 + 4} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={ejectU * 0.7}>filtered out</text>
        <Chip x={colX(1) + 18} y={rowY(4) + 14} text="✕ disabled → not a candidate" color={ROLE.INVALID} fill="#2a0c14" u={rejectU * (1 - ejectU)} />
        <Chip x={colX(3) + 4} y={rowY(2) + 14} size={12} text="✓ available" color={ROLE.CHECKED} fill="#062a1e" u={tri(hiP, 3)} />

        {/* beat 3 — two independent pickers slide along the lattice edges */}
        {pickU > 0.002 && (
          <g opacity={pickU}>
            <text x={728} y={104} fill={ROLE.PENDING} fontSize={13} fontFamily={MONO}>target and action picked separately → may not fit</text>
            <rect x={LABEL_X - 5} y={rowY(rowP) + 4} width={128} height={RH - 8} rx={8} fill="none" stroke={ROLE.PENDING} strokeWidth={2} strokeDasharray="6 4" />
            <rect x={colX(colP) + 14} y={108} width={CW - 28} height={23} rx={8} fill="none" stroke={ROLE.PENDING} strokeWidth={2} strokeDasharray="6 4" />
            <path d={`M${LABEL_X + 124} ${rowY(rowP) + RH / 2}H${colX(colP) + CW / 2}M${colX(colP) + CW / 2} 132V${rowY(rowP) + RH / 2}`} fill="none" stroke={ROLE.PENDING} strokeWidth={1.6} strokeDasharray="3 5" />
          </g>
        )}
        {badU > 0.002 && (
          <g opacity={badU}>
            <path d={`M${colX(BAD.col) + 42} ${rowY(BAD.row) + 13}l36 30m0 -30l-36 30`} stroke={ROLE.INVALID} strokeWidth={3.2} fill="none" />
            <Chip x={colX(1) + 18} y={rowY(4) + 14} text="✕ fill × link: no such action" color={ROLE.INVALID} fill="#2a0c14" u={1} />
          </g>
        )}
        {/* the persistent choice cursor: one joint id, never a row and a column */}
        <path d={corners(colX(colP) - 5, rowY(rowP) - 5, CW + 10, RH + 10)} fill="none" stroke={selTone} strokeWidth={3} opacity={Math.max(selU, badU)} />
        <Chip x={SLOT.x} y={SLOT.y} text="✓ one joint id: target+action" color={ROLE.CHECKED} fill="#062a1e" u={g(scene.jointU)} />
        <Chip x={SLOT.x} y={SLOT.y} text={`model output: one id → ${idOf(3)}`} color={ROLE.MODEL} fill="#1a1333" u={g(scene.chooseU)} />
        <Chip x={SLOT.x} y={SLOT.y} text="best listed ≠ the useful one" color={ROLE.PENDING} fill="#1a1405" dashed u={warnU} />

        {/* ---------------- lower band: one supporting idea at a time ---------------- */}
        <g opacity={g(scene.ephemU)}>
          <text x={600} y={488} fill={colors.TEXT} fontSize={15} fontWeight={650}>candidate ids are temporary references</text>
          <text x={600} y={512} fill={ROLE.OBSERVE} fontSize={12.5} fontFamily={MONO}>c3 @ v12 → d3 @ v13 · same control, new reference</text>
          <text x={600} y={534} fill={ROLE.PENDING} fontSize={11.5} fontFamily={MONO}>synthetic ids · not persistent selectors</text>
        </g>
        {ctxU > 0.002 && (
          <g opacity={ctxU * pageU} transform={`translate(0 ${(1 - ctxU) * 10})`}>
            <Card x={30} y={466} w={322} h={58} head={taskW[0] > 0.5 ? 'EXPLICIT TASK' : 'A DIFFERENT TASK · hypothetical'} body="" color={ROLE.MODEL} fill="#171335" u={1} strong={1 - Math.max(...taskW)} />
            {TASKS.map((t, i) => <text key={i} x={43} y={507} fill={colors.TEXT} fontSize={14.5} fontWeight={600} opacity={clamp01(taskW[i] * 2 - 1)}>{t}</text>)}
            <Card x={362} y={466} w={196} h={58} head="RECENT HISTORY" body="opened Profile menu" color={ROLE.MODEL} fill="#171335" u={1} />
            <path d={`M558 495C574 495 570 452 ${LABEL_X - 2} 452`} fill="none" stroke={ROLE.MODEL} strokeWidth={1.6} pathLength={1} strokeDasharray={`${clamp01(ctxU * 2 - 1)} 1`} />
          </g>
        )}
        <g opacity={g(scene.rankLblU)}>
          <text x={600} y={488} fill={ROLE.MODEL} fontSize={15} fontWeight={650}>▬ bar = ranking guided by task + history</text>
          <text x={600} y={512} fill={ROLE.PENDING} fontSize={12.5} fontFamily={MONO}>illustrative ranking scores · not probabilities</text>
          <ProposedTag x={600} y={524} u={1} />
        </g>
        {contractU > 0.002 && (
          <g opacity={contractU}>
            <Card x={778} y={466} w={284} h={68} head="DECISION CONTRACT" body="" color={ROLE.CHECKED} fill="#062a1e" u={1} strong={Math.min(dockS, dockL)} />
            <text x={791} y={506} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>menu + task + history @ {ver}</text>
            <text x={791} y={524} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>→ one candidate id, or abstain</text>
            <path d={`M768 500h10M1062 500h10`} stroke={ROLE.CHECKED} strokeWidth={4} />
          </g>
        )}
        <g transform={`translate(${dockS * 8} 0)`}>
          <Card x={592} y={466} w={168} h={68} head="small policy" body="ranks every tile" sub="PROPOSED" color={ROLE.MODEL} fill="#171335" u={g(scene.smallU)} strong={dockS} />
        </g>
        <g transform={`translate(${-dockL * 8} 0)`}>
          <Card x={1080} y={466} w={168} h={68} head="larger model" body="constrained pick" sub="PROPOSED" color={ROLE.MODEL} fill="#171335" u={g(scene.largeU)} strong={dockL} />
        </g>
        {tallyU > 0.002 && (
          <g opacity={tallyU}>
            <Card x={596} y={466} w={312} h={66} head="COVERAGE GAP · inventory error" body="useful target never listed" color={ROLE.PENDING} fill="#1a1405" u={1} strong={drop} />
            <Card x={930} y={466} w={312} h={66} head="RANKING MISTAKE · model error" body="listed, but ranked wrong" color={ROLE.MODEL} fill="#171335" u={1} />
            <circle cx={1212} cy={499} r={12} fill="none" stroke={ROLE.MODEL} strokeWidth={1.4} strokeDasharray="3 3" />
            <text x={919} y={505} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>≠</text>
            <text x={919} y={556} textAnchor="middle" fill={ROLE.PENDING} fontSize={12} fontFamily={MONO}>measured separately · PROPOSED · no numbers claimed</text>
          </g>
        )}
        {dropU > 0.002 && (
          <g opacity={tallyU} transform={`translate(${lerp(colX(1.5) + CW / 2, 878, drop)} ${lerp(rowY(1) + RH / 2, 499, drop) - Math.sin(drop * Math.PI) * 24})`}>
            <circle r={12} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={2} />
            <text y={5} textAnchor="middle" fill={ROLE.PENDING} fontSize={15} fontWeight={800}>?</text>
          </g>
        )}
        <Chip x={596} y={482} text={`✓ menu lists ${idOf(3)} @ ${ver}`} color={ROLE.OBSERVE} fill="#082f49" u={clamp01(agreeU * 3)} />
        <Chip x={816} y={482} text={`✓ model chose id ${idOf(3)}`} color={ROLE.MODEL} fill="#1a1333" u={clamp01(agreeU * 3 - 1)} />
        <Chip x={1026} y={482} text="? live page: recheck next" color={ROLE.PENDING} fill="#1a1405" dashed u={clamp01(agreeU * 3 - 2)} />
      </g>

      {/* ---------------- closing: opaque panel over a whispered stage ---------------- */}
      {panelU > 0.002 && (
        <g opacity={panelU} transform={`translate(0 ${(1 - panelU) * 10})`}>
          <rect x={250} y={186} width={780} height={250} rx={18} fill="#0b1120" stroke={ROLE.CHECKED} strokeWidth={1.6} />
          <text x={640} y={250} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={750}>Build the menu from the living page.</text>
          <text x={640} y={296} textAnchor="middle" fill={colors.MUTED} fontSize={17}>Joint target + action pairs, bound to one observation.</text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={17}>Inventory coverage is measured apart from ranking.</text>
          <ProposedTag x={640 - 171} y={366} u={1} text="PROPOSED BROWSER-ACTION ARCHITECTURE · CHARTER E7" />
        </g>
      )}
    </Camera>
  );
}

export const vizScene = () => scene;
