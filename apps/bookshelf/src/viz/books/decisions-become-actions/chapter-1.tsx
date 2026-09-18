// From the page to a numbered action space
//
// Book 3 "Decisions Become Actions", chapter 1 — how the PUBLIC Jev Ultrafast
// repository turns a page into a numbered action space. Sources (commit
// 1231850): snapshot.js (one evaluated script: visible controls, role/name/
// value, visible text ≤ 6000 chars, window.__jevFast.nodes keeps real DOM nodes,
// fill + "Open …" click for editable fields, one select action per option, a
// trailing wait action); browser.py observe (screenshot is a flag);
// model.py action_space (one index per observed node, per-operation target
// groups, select targets "index:option") and choose (state = page text,
// elements, recent_actions[-10:]; goal rides in each question's instructions).
// The flight page and every value on it are ILLUSTRATIVE — not a captured run.
//
// ONE persistent mechanism: the flight-search page on the left and the element
// table it becomes on the right. Observation chips lift off the live controls,
// morph into table rows, get numbered, absorb their action tiles, are filtered
// per operation, feed the request, and are rebuilt after the page changes.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 the goal and the page as the browser shows it
//  2 one script sweep collects role · label · value + visible text
//  3 node handles stay with the executor; descriptions travel to the table
//  4 rows are numbered [1] [2] [3] — for this observation only
//  5 seven action tiles fold into four element rows (fill + click share a row)
//  6 each operation lights only its compatible targets; select offers pairs
//  7 the request: goal, page text, elements with current values, recent actions
//  8 the page changes → observe again → the table is rebuilt and renumbered
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MONO, ROLE, captionPlan } from '../next-useful-action/shared/profile-page';
import { Chip, clamp01, lerp, tri } from './shared/kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Give Jev one goal: find a one-way flight from Zurich to London. To choose its next move, it first reads what the browser actually shows.',
  'The browser runs one page script that collects visible controls, their labels, current values, and nearby text. Screenshots are optional, not the normal decision input.',
  'The snapshot keeps references to the actual page elements. The model will receive numbered descriptions, while the executor retains the connection back to each real control.',
  'Here, the origin is element one, the empty destination is element two, and ticket type is element three. These numbers describe this observation, not permanent identifiers.',
  'The action-space builder groups actions by element. One text field can support both clicking and typing without becoming two separate elements in the table.',
  'Each operation gets only compatible targets. Typing can choose editable fields; clicking can choose clickable controls; a native dropdown offers observed element-and-option pairs.',
  'The request also includes the goal, visible page text, and recent actions. This lets the next choice depend on what already happened, including the current field values.',
  'After an action changes the page, Jev observes again and rebuilds this menu. A new suggestion can become a target only after it actually appears.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const PG = { x: 40, y: 110, w: 420, h: 380 };
interface Box { x: number; y: number; w: number; h: number }
// page-local control rectangles
const CTRL: Record<'from' | 'to' | 'ticket' | 'search' | 'sug', Box> = {
  from: { x: 24, y: 96, w: 372, h: 44 },
  to: { x: 24, y: 176, w: 372, h: 44 },
  ticket: { x: 24, y: 256, w: 190, h: 44 },
  search: { x: 236, y: 256, w: 160, h: 44 },
  sug: { x: 24, y: 222, w: 372, h: 38 },
};
const world = (b: Box): Box => ({ x: PG.x + b.x, y: PG.y + b.y, w: b.w, h: b.h });

const TB = { x: 520, y: 110, w: 720, head: 36, row: 54 };
const COL = { idx: TB.x + 14, label: TB.x + 58, value: TB.x + 218, ops: TB.x + 352 };
const OPS = ['TYPE_TEXT', 'CLICK', 'SELECT'] as const;
type Op = (typeof OPS)[number];
const OP_COLOR: Record<Op, string> = { TYPE_TEXT: ROLE.MODEL, CLICK: ROLE.OBSERVE, SELECT: ROLE.PENDING };
const ROWS: { key: 'from' | 'to' | 'ticket' | 'search'; role: string; label: string; value: string; tag: string; chipY: number; ops: Op[] }[] = [
  { key: 'from', role: 'combobox', label: 'From', value: 'Zurich', tag: '<input>', chipY: 228, ops: ['TYPE_TEXT', 'CLICK'] },
  { key: 'to', role: 'combobox', label: 'To', value: '', tag: '<input>', chipY: 308, ops: ['TYPE_TEXT', 'CLICK'] },
  { key: 'ticket', role: 'combobox', label: 'Ticket type', value: 'Round trip', tag: '<select>', chipY: 388, ops: ['SELECT'] },
  { key: 'search', role: 'button', label: 'Search', value: '', tag: '<button>', chipY: 430, ops: ['CLICK'] },
];
const CHIP = { x: 476, w: 350, h: 32 };
// observed actions, in snapshot order (ids are e1…; wait has no element)
const TILES: { id: string; kind: string; row: number; slot: number; op: Op | null }[] = [
  { id: 'e1', kind: 'fill', row: 0, slot: 0, op: 'TYPE_TEXT' },
  { id: 'e2', kind: 'click', row: 0, slot: 1, op: 'CLICK' },
  { id: 'e3', kind: 'fill', row: 1, slot: 0, op: 'TYPE_TEXT' },
  { id: 'e4', kind: 'click', row: 1, slot: 1, op: 'CLICK' },
  { id: 'e5', kind: 'select', row: 2, slot: 0, op: 'SELECT' },
  { id: 'e6', kind: 'select', row: 2, slot: 0, op: 'SELECT' },
  { id: 'e7', kind: 'click', row: 3, slot: 0, op: 'CLICK' },
  { id: 'wait', kind: '', row: -1, slot: 0, op: null },
];
const TILE = { w: 84, h: 32, pitch: 90, y: 400 };
const PAIRS = [
  { text: '3:1 One way', x: COL.ops + 92, w: 100 },
  { text: '3:2 Multi-city', x: COL.ops + 200, w: 124 },
];
const TABS = OPS.map((op, i) => ({ op, x: TB.x + i * 180, key: `${op.toLowerCase()}_target` }));
// sits directly under the page so its lowest line stays above the caption-safe y=570
const REG = { x: 40, y: 498, w: 420, h: 66 };
const REQ = { x: 520, y: 440, w: 720, h: 128 };
const REQ_SLOTS = [
  { text: 'page.text', to: { x: 548, y: 512 }, from: { x: 64, y: 452 }, color: ROLE.OBSERVE },
  { text: 'elements ×4', to: { x: 690, y: 512 }, from: { x: 800, y: 250 }, color: ROLE.OBSERVE },
  { text: 'recent_actions', to: { x: 832, y: 512 }, from: { x: 832, y: 470 }, color: ROLE.CHECKED },
  { text: 'goal', to: { x: 1004, y: 512 }, from: { x: 40, y: 30 }, color: ROLE.PENDING },
];

const CAM_PAGE: CameraState = { x: 420, y: 290, k: 1.25 };
const CAM_SCAN: CameraState = { x: 400, y: 300, k: 1.3 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_TABLE: CameraState = { x: 860, y: 300, k: 1.18 };
const CAM_END: CameraState = { x: 640, y: 330, k: 1.04 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PAGE, cameraInterp);
  const pageU = tl.channel('pageU', 0);
  const pageDim = tl.channel('pageDim', 0);
  const goalU = tl.channel('goalU', 0);
  const scanU = tl.channel('scanU', 0);
  const scanVis = tl.channel('scanVis', 0);
  const textU = tl.channel('textU', 0);
  const shotU = tl.channel('shotU', 0);
  const regU = tl.channel('regU', 0);
  const regVis = tl.channel('regVis', 0);
  const rowsU = tl.channel('rowsU', 0);
  const dimRows = tl.channel('dimRows', 0);
  const idxU = tl.channel('idxU', 0);
  const onceU = tl.channel('onceU', 0);
  const tilesU = tl.channel('tilesU', 0);
  const groupU = tl.channel('groupU', 0);
  const opVis = tl.channel('opVis', 0);
  const opU = tl.channel('opU', 1);
  const pairsU = tl.channel('pairsU', 0);
  const reqU = tl.channel('reqU', 0);
  const reqFill = tl.channel('reqFill', 0);
  const valU = tl.channel('valU', 0);
  const actU = tl.channel('actU', 0);
  const sugU = tl.channel('sugU', 0);
  const rebuildU = tl.channel('rebuildU', 0);
  const noteU = tl.channel('noteU', 0);
  const stripU = tl.channel('stripU', 1);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · one goal, one page — */
  let b = AT[0];
  tl.tween(goalU, 1, { at: b + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(pageU, 1, { at: b + 4.2, dur: 0.8, ease: ease.enter });

  /* — beat 2 · one script sweep — */
  b = AT[1];
  tl.tween(cam, CAM_SCAN, { at: b + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(scanVis, 1, { at: b + 0.6, dur: 0.4, ease: ease.enter });
  tl.tween(scanU, 1, { at: b + 1.0, dur: 4.6, ease: ease.linear });
  tl.tween(textU, 1, { at: b + 5.4, dur: 0.6, ease: ease.enter });
  tl.tween(scanVis, 0, { at: b + 5.8, dur: 0.5, ease: ease.enter });
  tl.tween(shotU, 1, { at: b + 8.4, dur: 0.6, ease: ease.enter });

  /* — beat 3 · handles stay, descriptions travel — */
  b = AT[2];
  tl.tween(cam, CAM_HOME, { at: b + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(shotU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(textU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(regVis, 1, { at: b + 1.2, dur: 0.6, ease: ease.enter });
  tl.tween(regU, 1, { at: b + 1.6, dur: 2.4, ease: ease.move });
  tl.tween(rowsU, 4, { at: b + 5.2, dur: 4.0, ease: ease.move });

  /* — beat 4 · numbers, for this observation — */
  b = AT[3];
  tl.tween(regVis, 0.15, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(dimRows, 1, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(idxU, 1, { at: b + 1.0, dur: 0.5, ease: ease.pop });
  tl.tween(idxU, 2, { at: b + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(idxU, 3, { at: b + 5.8, dur: 0.5, ease: ease.pop });
  tl.tween(idxU, 4, { at: b + 7.4, dur: 0.5, ease: ease.pop });
  tl.tween(onceU, 1, { at: b + 8.6, dur: 0.6, ease: ease.enter });

  /* — beat 5 · actions grouped by element — */
  b = AT[4];
  tl.tween(regVis, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(onceU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(pageDim, 1, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_TABLE, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(tilesU, 1, { at: b + 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(groupU, 1, { at: b + 4.0, dur: 4.4, ease: ease.linear });

  /* — beat 6 · compatible targets per operation — */
  b = AT[5];
  tl.tween(stripU, 0, { at: b + 0.1, dur: 0.4, ease: ease.enter });
  tl.tween(opVis, 1, { at: b + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(opU, 2, { at: b + 4.0, dur: 0.9, ease: ease.move });
  tl.tween(opU, 3, { at: b + 7.4, dur: 0.9, ease: ease.move });
  tl.tween(pairsU, 1, { at: b + 8.4, dur: 0.7, ease: ease.enter });

  /* — beat 7 · what the request carries — */
  b = AT[6];
  tl.tween(opVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(reqU, 1, { at: b + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(reqFill, 4, { at: b + 1.8, dur: 5.2, ease: ease.linear });
  tl.tween(valU, 1, { at: b + 8.2, dur: 0.7, ease: ease.enter });

  /* — beat 8 · the page changes; observe and rebuild — */
  b = AT[7];
  tl.tween(reqU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(valU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(pageDim, 0, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_END, { at: b + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(actU, 1, { at: b + 1.2, dur: 1.2, ease: ease.linear });
  tl.tween(sugU, 1, { at: b + 3.0, dur: 0.6, ease: ease.enter });
  tl.set(scanU, 0, b + 3.8);
  tl.tween(scanVis, 1, { at: b + 3.8, dur: 0.3, ease: ease.enter });
  tl.tween(scanU, 1, { at: b + 4.1, dur: 2.0, ease: ease.linear });
  tl.tween(scanVis, 0, { at: b + 6.1, dur: 0.4, ease: ease.enter });
  tl.tween(rebuildU, 1, { at: b + 6.4, dur: 1.4, ease: ease.move });
  tl.tween(noteU, 1, { at: b + 8.4, dur: 0.6, ease: ease.enter });
  tl.hold(PLAN.end, 0.8);

  return {
    tl, cam, pageU, pageDim, goalU, scanU, scanVis, textU, shotU, regU, regVis, rowsU, dimRows, idxU, onceU, tilesU, groupU,
    opVis, opU, pairsU, reqU, reqFill, valU, actU, sugU, rebuildU, noteU, stripU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------- local subcomponents */
function Txt({ x, y, text, size = 14, color = colors.TEXT, mono = false, weight = 500, anchor = 'start', u = 1 }: { x: number; y: number; text: string; size?: number; color?: string; mono?: boolean; weight?: number; anchor?: 'start' | 'middle' | 'end'; u?: number }) {
  if (u <= 0.002) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={mono ? MONO : undefined} fontWeight={weight} textAnchor={anchor} opacity={u}>
      {text}
    </text>
  );
}

/** The illustrative flight-search page. Pure function of its props. */
function FlightPage({ opacity, toText, sugU, found, nodeU, hot }: { opacity: number; toText: string; sugU: number; found: (cy: number) => number; nodeU: number; hot: string | null }) {
  if (opacity <= 0.002) return null;
  const field = (key: 'from' | 'to' | 'ticket', label: string, value: string, caret = false) => {
    const c = CTRL[key];
    return (
      <g key={key}>
        <Txt x={c.x} y={c.y - 9} text={label} size={13} color={colors.MUTED} u={key === 'ticket' ? 1 - sugU : 1} />
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={8} fill="#0d1526" stroke="#2a3754" strokeWidth={1.4} />
        <Txt x={c.x + 14} y={c.y + 28} text={value || (caret ? '' : 'City or airport')} size={17} color={value ? colors.TEXT : '#4b5b78'} weight={value ? 650 : 400} />
        {key === 'ticket' && <Txt x={c.x + c.w - 22} y={c.y + 28} text="▾" size={15} color={colors.MUTED} />}
      </g>
    );
  };
  return (
    <g transform={`translate(${PG.x} ${PG.y})`} opacity={opacity}>
      <rect width={PG.w} height={PG.h} rx={14} fill="#0a1020" stroke="#22304d" strokeWidth={1.5} />
      <rect width={PG.w} height={40} rx={14} fill="#111a2e" />
      <circle cx={20} cy={20} r={5} fill="#fb7185" opacity={0.7} />
      <circle cx={38} cy={20} r={5} fill="#fbbf24" opacity={0.7} />
      <circle cx={56} cy={20} r={5} fill="#34d399" opacity={0.7} />
      <Txt x={80} y={25} text="flights.example — Search flights" size={13} color={colors.MUTED} mono />
      {field('from', 'From', 'Zurich')}
      {field('to', 'To', toText, toText.length > 0)}
      {field('ticket', 'Ticket type', 'Round trip')}
      <rect x={CTRL.search.x} y={CTRL.search.y} width={CTRL.search.w} height={CTRL.search.h} rx={8} fill="#1d4ed8" />
      <Txt x={CTRL.search.x + CTRL.search.w / 2} y={CTRL.search.y + 28} text="Search" size={17} weight={700} anchor="middle" />
      <Txt x={24} y={342} text="Fares shown in CHF. Prices include taxes." size={13} color={colors.MUTED} />
      {/* observation outlines + executor-side node handles */}
      {ROWS.map((r, i) => {
        const c = CTRL[r.key];
        const f = found(PG.y + c.y + c.h / 2);
        const isHot = hot === r.key;
        const under = i >= 2 ? 1 - sugU : 1; // ticket + search sit under the suggestion overlay
        return (
          <g key={r.key} opacity={under}>
            <rect x={c.x - 4} y={c.y - 4} width={c.w + 8} height={c.h + 8} rx={10} fill="none" stroke={isHot ? colors.WARM : ROLE.OBSERVE} strokeWidth={isHot ? 3 : 1.8} opacity={isHot ? 1 : f * 0.9} />
            {nodeU > 0.002 && (
              <g opacity={nodeU} transform={`translate(${c.x + c.w - 30} ${c.y - 12})`}>
                <rect width={34} height={20} rx={10} fill="#1e1b4b" stroke={ROLE.MODEL} strokeWidth={1.2} />
                <Txt x={17} y={14.5} text={`n${i + 1}`} size={12} color={ROLE.MODEL} mono anchor="middle" weight={700} />
              </g>
            )}
          </g>
        );
      })}
      {/* the suggestion is an opaque overlay, drawn last; what it covers is hidden for the interval */}
      {sugU > 0.002 && (
        <g opacity={sugU} transform={`translate(0 ${(1 - sugU) * -6})`}>
          <rect x={CTRL.sug.x} y={CTRL.sug.y} width={CTRL.sug.w} height={CTRL.sug.h} rx={8} fill="#16213a" stroke={ROLE.CHECKED} strokeWidth={1.5} />
          <Txt x={CTRL.sug.x + 14} y={CTRL.sug.y + 25} text="London, United Kingdom" size={16} weight={650} />
          <Txt x={CTRL.sug.x + CTRL.sug.w - 12} y={CTRL.sug.y + 25} text="role=option" size={12} color={ROLE.CHECKED} mono anchor="end" />
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const pageU = s.get(scene.pageU);
  const pageDim = s.get(scene.pageDim);
  const scanU = s.get(scene.scanU);
  const scanVis = s.get(scene.scanVis);
  const regU = s.get(scene.regU);
  const regVis = s.get(scene.regVis);
  const rowsU = s.get(scene.rowsU);
  const dimRows = s.get(scene.dimRows);
  const idxU = s.get(scene.idxU);
  const tilesU = s.get(scene.tilesU);
  const groupU = s.get(scene.groupU);
  const opVis = s.get(scene.opVis);
  const opU = s.get(scene.opU);
  const pairsU = s.get(scene.pairsU);
  const reqU = s.get(scene.reqU);
  const reqFill = s.get(scene.reqFill);
  const valU = s.get(scene.valU);
  const actU = s.get(scene.actU);
  const sugU = s.get(scene.sugU);
  const rebuildU = s.get(scene.rebuildU);
  const stripU = s.get(scene.stripU);

  const scanY = lerp(PG.y + 44, PG.y + PG.h - 8, scanU);
  // a control counts as "found" once the first sweep has passed it; it stays found
  const firstPass = rowsU > 0 || regU > 0 || actU > 0 ? 1 : scanU;
  const firstY = lerp(PG.y + 44, PG.y + PG.h - 8, firstPass);
  const found = (cy: number) => clamp01((firstY - cy) / 18);

  const opWeight = (op: Op | null) => (op ? tri(opU, OPS.indexOf(op) + 1) : 0);
  const rowCompat = (ops: Op[]) => ops.reduce((a, op) => a + opWeight(op), 0);
  const slotOf = (i: number) => (i >= 2 ? i + rebuildU : i);
  const rowY = (slot: number) => TB.y + TB.head + slot * TB.row;
  const hotIdx = idxU > 0.02 && idxU < 3.98 && dimRows > 0.5 && s.get(scene.onceU) < 0.5 ? Math.max(0, Math.min(3, Math.round(idxU) - 1)) : -1;
  const typed = 'London'.slice(0, Math.round(actU * 6));

  return (
    <>
    <Camera {...s.get(scene.cam)}>
      {/* THE PAGE — persistent */}
      <FlightPage opacity={pageU * (1 - 0.85 * pageDim)} toText={typed} sugU={sugU} found={found} nodeU={regU > 0 ? clamp01(regU * 4) : 0} hot={hotIdx >= 0 ? ROWS[hotIdx].key : null} />
      {scanVis > 0.002 && (
        <g opacity={scanVis}>
          <rect x={PG.x} y={scanY - 26} width={PG.w} height={26} fill={ROLE.OBSERVE} opacity={0.1} />
          <line x1={PG.x - 6} x2={PG.x + PG.w + 6} y1={scanY} y2={scanY} stroke={ROLE.OBSERVE} strokeWidth={2.4} />
          <Txt x={PG.x + PG.w} y={PG.y - 6} text="snapshot.js · one Runtime.evaluate" size={13} color={ROLE.OBSERVE} mono anchor="end" />
        </g>
      )}
      {sugU > 0.002 && <rect x={PG.x + CTRL.sug.x - 4} y={PG.y + CTRL.sug.y - 4} width={CTRL.sug.w + 8} height={CTRL.sug.h + 8} rx={10} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.8} opacity={scanVis > 0 || rebuildU > 0 ? clamp01((scanY - (PG.y + CTRL.sug.y + 19)) / 18) : 0} />}
      <Chip x={CHIP.x} y={452} text="text: visible words · ≤ 6000 chars" color={ROLE.OBSERVE} u={s.get(scene.textU)} size={13} />
      <Chip x={CHIP.x} y={140} text="screenshot=False · optional" color={colors.MUTED} dashed u={s.get(scene.shotU)} size={13} />
      <Chip x={PG.x} y={498} text={'act: TYPE_TEXT → To = "London"'} color={ROLE.MODEL} fill="#1e1b4b" size={14} u={clamp01(actU * 4)} />

      {/* executor-side registry of real nodes */}
      {regVis > 0.002 && (
        <g opacity={regVis}>
          <rect x={REG.x} y={REG.y} width={REG.w} height={REG.h} rx={12} fill="#0d0b24" stroke={ROLE.MODEL} strokeWidth={1.3} strokeDasharray="6 4" />
          <Txt x={REG.x + 14} y={REG.y + 19} text="executor keeps · window.__jevFast.nodes" size={13} color={ROLE.MODEL} mono />
          {ROWS.map((r, i) => {
            const u = ease.move(clamp01(regU * 2.2 - i * 0.4));
            const c = world(CTRL[r.key]);
            const x = lerp(c.x + c.w - 30, REG.x + 18 + i * 100, u);
            const y = lerp(c.y - 12, REG.y + 27, u);
            return (
              <g key={r.key} opacity={clamp01(regU * 6 - i)}>
                <g transform={`translate(${x} ${y})`}>
                  <rect width={34} height={20} rx={10} fill="#1e1b4b" stroke={ROLE.MODEL} strokeWidth={1.2} />
                  <Txt x={17} y={14.5} text={`n${i + 1}`} size={12} color={ROLE.MODEL} mono anchor="middle" weight={700} />
                </g>
                <Txt x={REG.x + 18 + i * 100} y={REG.y + 59} text={`→ ${r.tag}`} size={12.5} color={colors.TEXT} mono u={clamp01(u * 3 - 2)} />
              </g>
            );
          })}
        </g>
      )}

      <Txt x={TB.x} y={TB.y - 12} text="illustrative values · not a captured run" size={12.5} mono color={colors.MUTED} u={clamp01(rowsU)} />

      {/* THE TABLE — observation chips morph into rows */}
      {rowsU > 0.002 && (
        <g opacity={clamp01(rowsU)}>
          <rect x={TB.x} y={TB.y} width={TB.w} height={TB.head - 6} rx={8} fill="#111a2e" />
          <Txt x={COL.idx} y={TB.y + 20} text="#" size={13} color={colors.MUTED} mono />
          <Txt x={COL.label} y={TB.y + 20} text="element" size={13} color={colors.MUTED} mono />
          <Txt x={COL.value} y={TB.y + 20} text="value" size={13} color={valU > 0.5 ? colors.WARM : colors.MUTED} mono />
          <Txt x={COL.ops} y={TB.y + 20} text="operations" size={13} color={colors.MUTED} mono u={clamp01(groupU * 4)} />
          <Txt x={TB.x + TB.w - 12} y={TB.y + 20} text="model.py · action_space" size={12} color={colors.MUTED} mono anchor="end" />
        </g>
      )}
      {ROWS.map((r, i) => {
        const c = world(CTRL[r.key]);
        const seen = found(c.y + c.h / 2);
        if (seen <= 0.002) return null;
        const u = ease.move(clamp01(rowsU - i));
        const x = lerp(CHIP.x, TB.x, u);
        const y = lerp(r.chipY - CHIP.h / 2, rowY(slotOf(i)), u);
        const w = lerp(CHIP.w, TB.w, u);
        const h = lerp(CHIP.h, TB.row - 8, u);
        const numbered = clamp01(idxU - i);
        const lit = 1 - 0.85 * dimRows * (1 - numbered);
        const opLit = 1 - 0.85 * opVis * (1 - clamp01(rowCompat(r.ops)));
        const index = i >= 2 && rebuildU > 0.5 ? i + 2 : i + 1;
        const value = i === 1 && actU >= 1 && rebuildU > 0.3 ? 'London' : r.value;
        const side = 1 - 0.85 * valU;
        return (
          <g key={r.key} opacity={seen * lit * opLit}>
            <rect x={x} y={y} width={w} height={h} rx={9} fill="#0b1324" stroke={hotIdx === i ? colors.WARM : ROLE.OBSERVE} strokeWidth={hotIdx === i ? 2.6 : 1.3} strokeOpacity={side} />
            <Txt x={x + 12} y={y + 21} text={`${r.role} · "${r.label}" · "${r.value}"`} size={13} mono u={1 - clamp01(u * 2.5)} />
            <g opacity={clamp01(u * 2.5 - 1.5)}>
              <Txt x={COL.idx} y={y + 29} text={numbered > 0.3 ? `[${index}]` : '·'} size={18} mono weight={800} color={numbered > 0.3 ? colors.WARM : colors.MUTED} u={side} />
              <Txt x={COL.label} y={y + 22} text={r.label} size={17} weight={700} u={side} />
              <Txt x={COL.label} y={y + 39} text={r.role} size={12} color={colors.MUTED} mono u={side} />
              <Txt x={COL.value} y={y + 29} text={`"${value}"`} size={16} mono color={valU > 0.5 ? colors.WARM : colors.TEXT} weight={valU > 0.5 ? 800 : 500} />
            </g>
            {hotIdx === i && <line x1={c.x + c.w + 6} y1={c.y + c.h / 2} x2={TB.x - 2} y2={y + h / 2} stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="5 4" />}
          </g>
        );
      })}
      {/* the row that exists only after the suggestion appears */}
      {rebuildU > 0.002 && (
        <g opacity={clamp01(rebuildU * 2 - 1)}>
          <rect x={TB.x} y={rowY(2)} width={TB.w} height={TB.row - 8} rx={9} fill="#062a1e" stroke={ROLE.CHECKED} strokeWidth={2} />
          <Txt x={COL.idx} y={rowY(2) + 29} text="[3]" size={18} mono weight={800} color={ROLE.CHECKED} />
          <Txt x={COL.label} y={rowY(2) + 22} text="London, United…" size={17} weight={700} />
          <Txt x={COL.label} y={rowY(2) + 39} text="option · new" size={12} color={ROLE.CHECKED} mono />
          <Txt x={COL.value} y={rowY(2) + 29} text={'""'} size={16} mono />
          <g transform={`translate(${COL.ops} ${rowY(2) + 7})`}>
            <rect width={TILE.w} height={TILE.h} rx={7} fill="#0b1324" stroke={OP_COLOR.CLICK} strokeWidth={1.4} />
            <Txt x={TILE.w / 2} y={21} text="CLICK" size={12.5} mono anchor="middle" color={OP_COLOR.CLICK} weight={700} />
          </g>
        </g>
      )}
      <Txt x={TB.x + TB.w} y={TB.y - 12} text="indices describe this observation only" size={14} color={colors.WARM} anchor="end" weight={650} u={s.get(scene.onceU)} />
      <Txt x={TB.x + TB.w} y={TB.y - 12} text="current values travel with each element" size={14} color={colors.WARM} anchor="end" weight={650} u={valU} />

      {/* beat 5 — observed actions fold into their element's row */}
      {tilesU > 0.002 &&
        TILES.map((t, i) => {
          const u = t.row < 0 ? 0 : ease.move(clamp01(groupU * 5 - t.row - (t.slot ? 0.5 : 0)));
          const x = lerp(TB.x + i * TILE.pitch, COL.ops + t.slot * (TILE.w + 8), u);
          const y = lerp(TILE.y, t.row < 0 ? TILE.y : rowY(slotOf(t.row)) + 7, u);
          const color = t.op ? OP_COLOR[t.op] : colors.MUTED;
          const focus = 1 - 0.85 * opVis * (1 - opWeight(t.op));
          const rowLit = t.row < 0 ? stripU : 1;
          return (
            <g key={t.id} transform={`translate(${x} ${y})`} opacity={clamp01(tilesU * 4 - i * 0.3) * focus * rowLit * (1 - 0.85 * valU)}>
              <rect width={TILE.w} height={TILE.h} rx={7} fill="#0b1324" stroke={color} strokeWidth={1.4} strokeDasharray={t.op ? undefined : '4 3'} />
              <Txt x={TILE.w / 2} y={21} text={u > 0.5 && t.op ? t.op : `${t.id} ${t.kind}`.trim()} size={12.5} mono anchor="middle" color={color} weight={700} />
            </g>
          );
        })}
      <Txt x={TB.x} y={TILE.y + 62} text="7 observed actions + wait  →  4 elements · one index per node" size={15} weight={650} u={clamp01(groupU * 5 - 4) * stripU} />

      {/* beat 6 — one target question per operation */}
      {opVis > 0.002 && (
        <g opacity={opVis}>
          {TABS.map((tab, i) => {
            const w = tri(opU, i + 1);
            return (
              <g key={tab.op} transform={`translate(${tab.x} ${TILE.y})`} opacity={0.15 + 0.85 * w}>
                <rect width={168} height={40} rx={9} fill="#0b1324" stroke={OP_COLOR[tab.op]} strokeWidth={1.4 + 1.6 * w} />
                <Txt x={84} y={26} text={tab.op} size={15} mono anchor="middle" color={OP_COLOR[tab.op]} weight={800} />
                <Txt x={84} y={62} text={tab.key} size={13} mono anchor="middle" color={colors.TEXT} />
              </g>
            );
          })}
          <Txt x={TB.x + TB.w} y={TILE.y + 18} text="WAIT · DONE · BLOCKED" size={13} mono anchor="end" color={colors.MUTED} />
          <Txt x={TB.x + TB.w} y={TILE.y + 38} text="need no target" size={13} anchor="end" color={colors.MUTED} />
        </g>
      )}
      {PAIRS.map((p) => (
        <g key={p.text} transform={`translate(${p.x} ${rowY(slotOf(2)) + 7})`} opacity={pairsU * (1 - 0.85 * valU)}>
          <rect width={p.w} height={TILE.h} rx={7} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={1.3} />
          <Txt x={p.w / 2} y={21} text={p.text} size={12} mono anchor="middle" color={ROLE.PENDING} />
        </g>
      ))}

      {/* beat 7 — the request body */}
      {reqU > 0.002 && (
        <g opacity={reqU}>
          <rect x={REQ.x} y={REQ.y} width={REQ.w} height={REQ.h} rx={12} fill="#0d1321" stroke="#2a3754" strokeWidth={1.4} />
          <Txt x={REQ.x + 16} y={REQ.y + 24} text="request body · model.py choose()" size={13} color={colors.MUTED} mono />
          <rect x={536} y={476} width={440} height={80} rx={9} fill="none" stroke={ROLE.OBSERVE} strokeWidth={1.1} opacity={0.6} />
          <Txt x={548} y={496} text="state" size={13} color={ROLE.OBSERVE} mono weight={700} />
          <rect x={988} y={476} width={236} height={80} rx={9} fill="none" stroke={ROLE.PENDING} strokeWidth={1.1} opacity={0.6} />
          <Txt x={1000} y={496} text="questions[*].instructions" size={13} color={ROLE.PENDING} mono weight={700} />
          <Txt x={1116} y={533} text="+ rules" size={13} color={colors.MUTED} mono />
          {REQ_SLOTS.map((q, i) => {
            const u = ease.move(clamp01(reqFill - i));
            return <Chip key={q.text} x={lerp(q.from.x, q.to.x, u)} y={lerp(q.from.y, q.to.y, u)} text={q.text} color={q.color} size={12.5} u={clamp01((reqFill - i) * 5)} />;
          })}
          <Txt x={548} y={550} text="[] on the first step · last 10 later" size={11.5} color={colors.MUTED} mono u={clamp01(reqFill - 2.6)} />
        </g>
      )}

      {/* beat 8 — the closing note */}
      <Chip x={TB.x} y={444} text="[3] is now the London suggestion — it became a target only once observed" color={ROLE.CHECKED} fill="#062a1e" size={14} u={s.get(scene.noteU)} />
    </Camera>
      {/* goal + honesty label — fixed stage coordinates, outside the camera, so a focus move never clips them */}
      <Chip x={40} y={30} text="goal: find a one-way flight from Zurich to London" color={ROLE.PENDING} fill="#1a1405" size={15} u={s.get(scene.goalU)} />
      <Txt x={40} y={78} text="illustrative page and values · not a captured run" size={13} color={colors.MUTED} mono u={s.get(scene.goalU)} />
    </>
  );
}

export const vizScene = () => scene;
