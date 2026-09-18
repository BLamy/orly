// Type, validate, act, observe again
//
// Book 3 "Decisions Become Actions", chapter 3 — how the PUBLIC Jev Ultrafast
// repository turns one chosen action into browser input. Sources (commit
// 1231850): agent.py act (only kind == "fill" calls field_text; pending_text is
// reused only when field_context is identical; history.append happens BEFORE
// the next observe; DONE/BLOCKED stop the loop; StalePage in tick → observe and
// choose again), model.py field_context / field_text (goal, field, page title +
// text, recent_actions[-6:]; JSON object with exactly the key "text", non-empty
// string, ≤ 2000 chars), browser.py fresh (fill → whole-observation marker;
// click / select → page key + that element's guard — the guards are NOT
// identical), act (resolve the retained node's current rect, hit-test with
// elementFromPoint, then mouse press, select-all, insertText) and observe (the
// post-input settle runs at the start of the next observe: at least two frames,
// and for a combobox fill a visible role=option, with a code-constant cap).
// The flight page and every value are ILLUSTRATIVE — not a captured run. No
// measured timing appears; the only duration shown is a constant from the code.
//
// ONE persistent mechanism: the flight page (left) and the chosen action tile
// (top right). The tile gains its text, the page is re-checked, goes stale and
// is retried, receives "London" in the real control, grows a suggestion, and
// the loop closes into a ring.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 the tile's text slot is empty; only fill forks to the text helper
//  2 context chips flow in; {"text": "London"} comes out
//  3 parse gate; London lands in the slot; click / select bypass
//  4 fresh(): marker at observation vs marker now
//  5 a scroll makes it stale → retry; pending text reused on identical context
//  6 click geometry: current rect, center, hit-test, covered → stale
//  7 London flows into To; act → history → observe (settle, snapshot); new row
//  8 next cycles; DONE stops the loop; outcome check is separate
//  9 the loop as a ring with its three contributors
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MONO, ROLE, captionPlan } from '../next-useful-action/shared/profile-page';
import { Chip, clamp01, lerp } from './shared/kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'Choosing the destination field still leaves one question: what should we type? Only a typing action calls the separate text helper.',
  'That helper receives the goal, selected field, page context, and recent actions. It returns a small object containing one text value, such as London.',
  'The response must parse correctly and contain a nonempty bounded string. Clicking and selecting skip this generation step because their actions already came from the page.',
  'Before input, the browser checks that the decision still applies. A changed document, form value, or target can invalidate the earlier observation.',
  'If the page became stale while text was generated, Jev observes and chooses again. It reuses that text only when the complete helper input is unchanged.',
  "For a click, the executor resolves the retained element's current geometry and checks that another element does not cover it. Old screen coordinates are not trusted.",
  'After typing London, it records the action and briefly waits for useful suggestions before observing again. The London suggestion can now enter the next numbered menu.',
  'The next cycle can choose that suggestion, then continue toward the goal. A done decision stops the loop, but a separate outcome check is needed to establish that the task succeeded.',
  'The speed comes from structured observations, shared choice requests, and selective text generation. The complete loop remains observe, choose, validate, act, and observe again.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const PG = { x: 40, y: 110, w: 420, h: 380 };
const CTRL = {
  from: { x: 24, y: 96, w: 372, h: 44 },
  to: { x: 24, y: 176, w: 372, h: 44 },
  ticket: { x: 24, y: 256, w: 190, h: 44 },
  search: { x: 236, y: 256, w: 160, h: 44 },
  sug: { x: 24, y: 222, w: 372, h: 38 },
};
const SCROLL = -14; // illustrative scroll shift that makes the observation stale
const TILE = { x: 520, y: 110, w: 720, h: 64 };
const SLOT = { x: 1000, y: 122, w: 226, h: 40 };
const RAIL = { x0: 540, x1: 1110, y: 260, fork: 920 };
const HELP = { x: 800, y: 380, w: 240, h: 84 };
const CTX = ['goal', 'field: To · combobox · ""', 'page: title + text', 'recent_actions[-6:]'];
const OUT = { x: 1060, y: 408 };
const PARSE = ['✓ JSON parses', '✓ only key: text', '✓ non-empty, ≤ 2000'];
const CELLS = ['origin', 'url', 'scroll', 'viewport', 'title', 'text', 'controls', 'values'];
const CELL = { x: 540, w: 82, pitch: 86, h: 36, y1: 224, y2: 292 };
const STEPS = ['1 · Browser.act → press, select-all, insertText', '2 · history.append(action) — recorded first', '3 · observe(): settle, then a fresh snapshot'];
const CYCLES = ['CLICK suggestion', 'SELECT One way', 'CLICK Search', 'DONE'];
const RING = { x: 880, y: 350, r: 150 };
const RING_NODES = ['observe', 'choose', 'validate', 'act'];
const SEARCH_NOW = { x: PG.x + CTRL.search.x, y: PG.y + CTRL.search.y + SCROLL, w: CTRL.search.w, h: CTRL.search.h };

const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_TILE: CameraState = { x: 860, y: 300, k: 1.15 };
const CAM_HELP: CameraState = { x: 860, y: 400, k: 1.3 };
const CAM_CHECK: CameraState = { x: 640, y: 345, k: 1.04 };
// beat 3 return: tile, helper, return object and every parse condition sit above the caption band (stage y570)
const CAM_SLOT: CameraState = { x: 880, y: 348, k: 1.04 };
// the whole page stays below the fixed header and above the caption band
const CAM_GEO: CameraState = { x: 538, y: 325, k: 1.22 };
const CAM_TYPE: CameraState = { x: 640, y: 345, k: 1.03 };
const CAM_RING: CameraState = { x: 860, y: 350, k: 1.12 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_TILE, cameraInterp);
  const pageU = tl.channel('pageU', 0);
  const pageDim = tl.channel('pageDim', 1);
  const tileU = tl.channel('tileU', 0);
  const tileDim = tl.channel('tileDim', 0);
  const tileNext = tl.channel('tileNext', 0);
  const askU = tl.channel('askU', 0);
  const machVis = tl.channel('machVis', 0);
  const tokU = tl.channel('tokU', 0);
  const forkU = tl.channel('forkU', 0);
  const ctxU = tl.channel('ctxU', 0);
  const outU = tl.channel('outU', 0);
  const parseU = tl.channel('parseU', 0);
  const slotU = tl.channel('slotU', 0);
  const bypassU = tl.channel('bypassU', 0);
  const markVis = tl.channel('markVis', 0);
  const markU = tl.channel('markU', 0);
  const guardNoteU = tl.channel('guardNoteU', 0);
  const shiftU = tl.channel('shiftU', 0);
  const staleU = tl.channel('staleU', 0);
  const againU = tl.channel('againU', 0);
  const reuseU = tl.channel('reuseU', 0);
  const geoVis = tl.channel('geoVis', 0);
  const geoU = tl.channel('geoU', 0);
  const coverU = tl.channel('coverU', 0);
  const typeU = tl.channel('typeU', 0);
  const orderVis = tl.channel('orderVis', 0);
  const orderU = tl.channel('orderU', 0);
  const sugU = tl.channel('sugU', 0);
  const menuU = tl.channel('menuU', 0);
  const pickU = tl.channel('pickU', 0);
  const cycleVis = tl.channel('cycleVis', 0);
  const cycleU = tl.channel('cycleU', 0);
  const doneU = tl.channel('doneU', 0);
  const outcomeU = tl.channel('outcomeU', 0);
  const ringU = tl.channel('ringU', 0);
  const pulseU = tl.channel('pulseU', 0);
  const sumU = tl.channel('sumU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · what should we type? — */
  let b = AT[0];
  tl.tween(pageU, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(tileU, 1, { at: b + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(askU, 1, { at: b + 3.0, dur: 0.5, ease: ease.pop });
  tl.tween(machVis, 1, { at: b + 5.0, dur: 0.7, ease: ease.enter });
  tl.tween(tokU, 1, { at: b + 6.0, dur: 2.0, ease: ease.linear });
  tl.tween(forkU, 1, { at: b + 8.0, dur: 1.2, ease: ease.move });

  /* — beat 2 · the helper's input and output — */
  b = AT[1];
  tl.tween(cam, CAM_HELP, { at: b + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(tileDim, 1, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(ctxU, 4, { at: b + 1.0, dur: 5.0, ease: ease.linear });
  tl.tween(outU, 1, { at: b + 8.2, dur: 0.6, ease: ease.pop });

  /* — beat 3 · parse gate; others bypass — */
  b = AT[2];
  tl.tween(parseU, 3, { at: b + 0.6, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAM_SLOT, { at: b + 3.8, dur: 1.3, ease: ease.move });
  tl.tween(tileDim, 0, { at: b + 3.8, dur: 0.6, ease: ease.enter });
  tl.tween(askU, 0, { at: b + 4.4, dur: 0.4, ease: ease.enter });
  tl.tween(slotU, 1, { at: b + 4.4, dur: 1.2, ease: ease.move });
  tl.tween(bypassU, 1, { at: b + 7.0, dur: 2.4, ease: ease.linear });

  /* — beat 4 · does the decision still apply? — */
  b = AT[3];
  tl.tween(machVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_CHECK, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(pageDim, 0, { at: b + 0.3, dur: 0.6, ease: ease.enter });
  tl.tween(markVis, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(markU, 8, { at: b + 1.8, dur: 4.0, ease: ease.linear });
  tl.tween(guardNoteU, 1, { at: b + 7.4, dur: 0.7, ease: ease.enter });

  /* — beat 5 · stale while text was generated → retry — */
  b = AT[4];
  tl.tween(guardNoteU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(shiftU, 1, { at: b + 0.6, dur: 0.9, ease: ease.move });
  tl.tween(staleU, 1, { at: b + 1.6, dur: 0.5, ease: ease.pop });
  tl.tween(againU, 1, { at: b + 3.6, dur: 2.4, ease: ease.linear });
  tl.tween(staleU, 0, { at: b + 6.2, dur: 0.6, ease: ease.enter });
  tl.tween(reuseU, 1, { at: b + 7.0, dur: 0.7, ease: ease.enter });

  /* — beat 6 · click geometry is resolved now — */
  b = AT[5];
  tl.tween(markVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(againU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(reuseU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(tileDim, 1, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_GEO, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(geoVis, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(geoU, 3, { at: b + 1.6, dur: 4.6, ease: ease.linear });
  tl.tween(coverU, 1, { at: b + 6.8, dur: 0.9, ease: ease.move });
  tl.tween(coverU, 0, { at: b + 10.4, dur: 0.7, ease: ease.move });

  /* — beat 7 · type, record, settle, observe — */
  b = AT[6];
  tl.tween(geoVis, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(tileDim, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_TYPE, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(orderVis, 1, { at: b + 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(orderU, 1, { at: b + 0.8, dur: 0.5, ease: ease.enter });
  tl.tween(typeU, 1, { at: b + 1.0, dur: 1.8, ease: ease.linear });
  tl.tween(orderU, 2, { at: b + 3.4, dur: 0.5, ease: ease.enter });
  tl.tween(orderU, 3, { at: b + 5.4, dur: 0.5, ease: ease.enter });
  tl.tween(sugU, 1, { at: b + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(menuU, 1, { at: b + 8.6, dur: 0.7, ease: ease.enter });

  /* — beat 8 · next cycles; done is not success — */
  b = AT[7];
  tl.tween(orderVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(menuU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(tileNext, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(cycleVis, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(pickU, 1, { at: b + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(sugU, 0, { at: b + 2.4, dur: 0.4, ease: ease.enter });
  tl.tween(cycleU, 1, { at: b + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(cycleU, 2, { at: b + 3.6, dur: 0.6, ease: ease.enter });
  tl.tween(cycleU, 3, { at: b + 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(cycleU, 4, { at: b + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(doneU, 1, { at: b + 7.4, dur: 0.6, ease: ease.pop });
  tl.tween(outcomeU, 1, { at: b + 9.6, dur: 0.7, ease: ease.enter });

  /* — beat 9 · the loop — */
  b = AT[8];
  tl.tween(cycleVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(doneU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(outcomeU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(tileU, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(pageDim, 1, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_RING, { at: b + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: b + 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(sumU, 3, { at: b + 1.6, dur: 4.2, ease: ease.linear });
  tl.tween(pulseU, 1, { at: b + 6.4, dur: PLAN.end - (b + 6.4), ease: ease.linear });
  tl.hold(PLAN.end, 0.8);

  return {
    tl, cam, pageU, pageDim, tileU, tileDim, tileNext, askU, machVis, tokU, forkU, ctxU, outU, parseU, slotU, bypassU, markVis, markU,
    guardNoteU, shiftU, staleU, againU, reuseU, geoVis, geoU, coverU, typeU, orderVis, orderU, sugU, menuU, pickU, cycleVis, cycleU,
    doneU, outcomeU, ringU, pulseU, sumU,
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
function FlightPage({ opacity, toText, ticket, sugU, shift, toHot, sugHot }: { opacity: number; toText: string; ticket: string; sugU: number; shift: number; toHot: number; sugHot: number }) {
  if (opacity <= 0.002) return null;
  const field = (c: { x: number; y: number; w: number; h: number }, label: string, value: string, hot = 0) => (
    <g>
      <Txt x={c.x} y={c.y - 9} text={label} size={13} color={colors.MUTED} />
      <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={8} fill="#0d1526" stroke={hot > 0.5 ? colors.WARM : '#2a3754'} strokeWidth={1.4 + 1.4 * hot} />
      <Txt x={c.x + 14} y={c.y + 28} text={value || (hot > 0.5 ? '▏' : 'City or airport')} size={17} color={value || hot > 0.5 ? colors.TEXT : '#4b5b78'} weight={value ? 650 : 400} />
    </g>
  );
  return (
    <g transform={`translate(${PG.x} ${PG.y})`} opacity={opacity}>
      <rect width={PG.w} height={PG.h} rx={14} fill="#0a1020" stroke="#22304d" strokeWidth={1.5} />
      <rect width={PG.w} height={40} rx={14} fill="#111a2e" />
      <circle cx={20} cy={20} r={5} fill="#fb7185" opacity={0.7} />
      <circle cx={38} cy={20} r={5} fill="#fbbf24" opacity={0.7} />
      <circle cx={56} cy={20} r={5} fill="#34d399" opacity={0.7} />
      <Txt x={80} y={25} text="flights.example — Search flights" size={13} color={colors.MUTED} mono />
      <g transform={`translate(0 ${shift})`}>
        {field(CTRL.from, 'From', 'Zurich')}
        {field(CTRL.to, 'To', toText, toHot)}
        {field(CTRL.ticket, 'Ticket type', ticket)}
        <Txt x={CTRL.ticket.x + CTRL.ticket.w - 22} y={CTRL.ticket.y + 28} text="▾" size={15} color={colors.MUTED} />
        <rect x={CTRL.search.x} y={CTRL.search.y} width={CTRL.search.w} height={CTRL.search.h} rx={8} fill="#1d4ed8" />
        <Txt x={CTRL.search.x + CTRL.search.w / 2} y={CTRL.search.y + 28} text="Search" size={17} weight={700} anchor="middle" />
        <Txt x={24} y={342} text="Fares shown in CHF. Prices include taxes." size={13} color={colors.MUTED} />
        {sugU > 0.002 && (
          <g opacity={sugU} transform={`translate(0 ${(1 - sugU) * -6})`}>
            <rect x={CTRL.sug.x} y={CTRL.sug.y} width={CTRL.sug.w} height={CTRL.sug.h} rx={8} fill="#16213a" stroke={sugHot > 0.5 ? colors.WARM : ROLE.CHECKED} strokeWidth={1.5 + 1.5 * sugHot} />
            <Txt x={CTRL.sug.x + 14} y={CTRL.sug.y + 25} text="London, United Kingdom" size={16} weight={650} />
            <Txt x={CTRL.sug.x + CTRL.sug.w - 12} y={CTRL.sug.y + 25} text="role=option" size={12} color={ROLE.CHECKED} mono anchor="end" />
          </g>
        )}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const pageU = s.get(scene.pageU);
  const pageDim = s.get(scene.pageDim);
  const tileU = s.get(scene.tileU);
  const tileDim = s.get(scene.tileDim);
  const tileNext = s.get(scene.tileNext);
  const askU = s.get(scene.askU);
  const machVis = s.get(scene.machVis);
  const tokU = s.get(scene.tokU);
  const forkU = s.get(scene.forkU);
  const ctxU = s.get(scene.ctxU);
  const outU = s.get(scene.outU);
  const parseU = s.get(scene.parseU);
  const slotU = s.get(scene.slotU);
  const bypassU = s.get(scene.bypassU);
  const markVis = s.get(scene.markVis);
  const markU = s.get(scene.markU);
  const shiftU = s.get(scene.shiftU);
  const staleU = s.get(scene.staleU);
  const againU = s.get(scene.againU);
  const reuseU = s.get(scene.reuseU);
  const geoVis = s.get(scene.geoVis);
  const geoU = s.get(scene.geoU);
  const coverU = s.get(scene.coverU);
  const typeU = s.get(scene.typeU);
  const orderVis = s.get(scene.orderVis);
  const orderU = s.get(scene.orderU);
  const pickU = s.get(scene.pickU);
  const cycleVis = s.get(scene.cycleVis);
  const cycleU = s.get(scene.cycleU);
  const ringU = s.get(scene.ringU);
  const pulseU = s.get(scene.pulseU);
  const sumU = s.get(scene.sumU);

  const toText = pickU > 0.5 ? 'London, United Kingdom' : 'London'.slice(0, Math.round(typeU * 6));
  const ticket = cycleU >= 2 ? 'One way' : 'Round trip';
  // the scroll cell differs while the observation is stale; a fresh observation matches again
  const differs = shiftU > 0.5 && againU < 0.6;
  const slotIn = ease.move(clamp01(slotU));
  const flyOut = typeU > 0.002 && typeU < 0.998;
  const forkX = lerp(RAIL.x0, RAIL.fork, clamp01(tokU));
  const forkY = lerp(RAIL.y, HELP.y, forkU);
  const ringPt = (a: number, r = RING.r) => ({ x: RING.x + r * Math.cos(a), y: RING.y + r * Math.sin(a) });
  const pulse = ringPt(-Math.PI / 2 + pulseU * Math.PI * 2);

  return (
    <>
    <Camera {...s.get(scene.cam)}>
      {/* THE PAGE — persistent; fully hidden during close-ups so no clipped fragment shows at the left */}
      <FlightPage opacity={pageU * (1 - pageDim)} toText={toText} ticket={ticket} sugU={s.get(scene.sugU)} shift={SCROLL * shiftU} toHot={clamp01(orderU) * (1 - clamp01(orderU - 1.5))} sugHot={tileNext * (1 - pickU)} />

      {/* THE CHOSEN ACTION — persistent tile with a typed text slot */}
      {tileU > 0.002 && (
        <g opacity={tileU * (1 - tileDim)}>
          <Txt x={TILE.x + TILE.w} y={TILE.y - 10} text="illustrative values · not a captured run" size={12.5} mono anchor="end" color={colors.MUTED} />
          <rect x={TILE.x} y={TILE.y} width={TILE.w} height={TILE.h} rx={12} fill="#15122e" stroke={ROLE.MODEL} strokeWidth={1.8} />
          <g opacity={1 - tileNext}>
            <Txt x={TILE.x + 18} y={TILE.y + 28} text="TYPE_TEXT → [2] To" size={19} mono weight={800} />
            <Txt x={TILE.x + 18} y={TILE.y + 50} text="e3 · fill · node n2" size={13} mono color={colors.MUTED} />
            <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={8} fill="#0b1324" stroke={slotU > 0.9 ? ROLE.CHECKED : colors.WARM} strokeWidth={1.6} strokeDasharray={slotU > 0.9 ? undefined : '5 4'} />
            <Txt x={SLOT.x + 12} y={SLOT.y + 26} text="text:" size={14} mono color={colors.MUTED} />
            <Txt x={SLOT.x + 64} y={SLOT.y + 27} text="?" size={20} weight={800} color={colors.WARM} u={askU} />
            <Txt x={SLOT.x + 64} y={SLOT.y + 26} text={'"London"'} size={16} mono weight={800} color={ROLE.CHECKED} u={clamp01(slotU * 4 - 3) * (flyOut || typeU >= 0.998 ? 0.35 : 1)} />
          </g>
          <g opacity={tileNext}>
            <Txt x={TILE.x + 18} y={TILE.y + 28} text="CLICK → [3] London, United Kingdom" size={19} mono weight={800} />
            <Txt x={TILE.x + 18} y={TILE.y + 50} text="next cycle · click · no text step" size={13} mono color={colors.MUTED} />
          </g>
        </g>
      )}

      {/* beats 1–3 — only fill forks to the text helper */}
      {machVis > 0.002 && (
        <g opacity={machVis}>
          <line x1={RAIL.x0} x2={RAIL.x1} y1={RAIL.y} y2={RAIL.y} stroke="#2a3754" strokeWidth={3} />
          <line x1={RAIL.fork} x2={RAIL.fork} y1={RAIL.y} y2={HELP.y} stroke={ROLE.MODEL} strokeWidth={3} strokeDasharray="6 5" />
          <rect x={RAIL.fork - 9} y={RAIL.y - 9} width={18} height={18} transform={`rotate(45 ${RAIL.fork} ${RAIL.y})`} fill="#0b1324" stroke={colors.WARM} strokeWidth={2} />
          <Txt x={RAIL.fork} y={RAIL.y - 22} text={'action["kind"] == "fill" ?'} size={13.5} mono anchor="middle" color={colors.WARM} />
          <rect x={RAIL.x1} y={RAIL.y - 22} width={120} height={44} rx={9} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={1.5} />
          <Txt x={RAIL.x1 + 60} y={RAIL.y + 5} text="Browser.act" size={14} mono anchor="middle" color={ROLE.OBSERVE} />
          <rect x={HELP.x} y={HELP.y} width={HELP.w} height={HELP.h} rx={12} fill="#1e1b4b" stroke={ROLE.MODEL} strokeWidth={1.8} />
          <Txt x={HELP.x + HELP.w / 2} y={HELP.y + 30} text="text helper" size={18} weight={800} anchor="middle" />
          <Txt x={HELP.x + HELP.w / 2} y={HELP.y + 53} text="field_text(context)" size={12.5} mono anchor="middle" color={ROLE.MODEL} />
          <Txt x={HELP.x + HELP.w / 2} y={HELP.y + 71} text="separate model" size={12.5} mono anchor="middle" color={ROLE.MODEL} />
          {/* the fill token: along the rail, then down the fork */}
          {tokU > 0.002 && slotU < 0.5 && (
            <g transform={`translate(${forkX} ${forkY})`} opacity={1 - clamp01(forkU * 4 - 3)}>
              <rect x={-24} y={-13} width={48} height={26} rx={6} fill={ROLE.MODEL} />
              <Txt x={0} y={5} text="fill" size={13} mono anchor="middle" color="#0a0e1a" weight={800} />
            </g>
          )}
          {/* helper input */}
          {CTX.map((c, i) => {
            const u = clamp01(ctxU - i);
            return <Chip key={c} x={lerp(520, 540, ease.move(u))} y={372 + i * 30} text={c} color={i === 0 ? ROLE.PENDING : i === 3 ? ROLE.CHECKED : ROLE.OBSERVE} size={12.5} u={u * 2} />;
          })}
          <Txt x={HELP.x - 16} y={HELP.y + 47} text="→" size={20} anchor="end" color={colors.MUTED} u={clamp01(ctxU)} />
          {/* helper output */}
          <Chip x={OUT.x} y={OUT.y} text={'{"text": "London"}'} color={ROLE.CHECKED} fill="#062a1e" size={13} u={s.get(scene.outU) * (1 - 0.6 * slotIn)} />
          <Txt x={OUT.x - 10} y={OUT.y + 18} text="→" size={20} anchor="middle" color={colors.MUTED} u={outU} />
          {PARSE.map((p, i) => (
            <Txt key={p} x={OUT.x} y={OUT.y + 56 + i * 24} text={p} size={13.5} mono color={ROLE.CHECKED} u={clamp01(parseU - i)} />
          ))}
          <Txt x={OUT.x} y={OUT.y + 132} text="✕ else: nothing typed" size={13.5} mono color={ROLE.INVALID} u={clamp01(parseU - 2.5)} />
          {/* London rises into the tile's slot */}
          {slotU > 0.002 && slotU < 0.998 && <Txt x={lerp(OUT.x + 90, SLOT.x + 64, slotIn)} y={lerp(OUT.y + 18, SLOT.y + 26, slotIn)} text={'"London"'} size={16} mono weight={800} color={ROLE.CHECKED} />}
          {/* click / select never take the fork */}
          {['click', 'select'].map((k, i) => {
            const u = clamp01(bypassU * 1.4 - i * 0.4);
            if (u <= 0.002 || u >= 0.998) return null;
            return (
              <g key={k} transform={`translate(${lerp(RAIL.x0, RAIL.x1 - 30, u)} ${RAIL.y})`}>
                <rect x={-30} y={-13} width={60} height={26} rx={6} fill={ROLE.OBSERVE} />
                <Txt x={0} y={5} text={k} size={13} mono anchor="middle" color="#0a0e1a" weight={800} />
              </g>
            );
          })}
          <Txt x={RAIL.x0} y={RAIL.y + 34} text="click · select: straight to act — no text step" size={14} weight={650} color={ROLE.OBSERVE} u={clamp01(bypassU * 4)} />
        </g>
      )}

      {/* beats 4–5 — fresh(): the marker now vs the marker at observation */}
      {markVis > 0.002 && (
        <g opacity={markVis}>
          <Txt x={CELL.x} y={CELL.y1 - 12} text="marker at observation" size={13.5} mono color={ROLE.OBSERVE} />
          <Txt x={CELL.x + 8 * CELL.pitch - 4} y={CELL.y1 - 12} text="browser.py · fresh(page)" size={12.5} mono anchor="end" color={colors.MUTED} />
          {CELLS.map((c, i) => {
            const u = clamp01(markU - i);
            const bad = differs && i === 2;
            return (
              <g key={c}>
                <rect x={CELL.x + i * CELL.pitch} y={CELL.y1} width={CELL.w} height={CELL.h} rx={6} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={1.2} />
                <Txt x={CELL.x + i * CELL.pitch + CELL.w / 2} y={CELL.y1 + 23} text={c} size={12.5} mono anchor="middle" />
                <Txt x={CELL.x + i * CELL.pitch + CELL.w / 2} y={CELL.y1 + 58} text={bad ? '≠' : '='} size={18} weight={800} anchor="middle" color={bad ? ROLE.INVALID : ROLE.CHECKED} u={u} />
                <rect x={CELL.x + i * CELL.pitch} y={CELL.y2} width={CELL.w} height={CELL.h} rx={6} fill={bad ? '#2a0c14' : '#0b1324'} stroke={bad ? ROLE.INVALID : colors.TEXT} strokeWidth={bad ? 2.4 : 1.2} opacity={u} />
                <Txt x={CELL.x + i * CELL.pitch + CELL.w / 2} y={CELL.y2 + 23} text={c} size={12.5} mono anchor="middle" u={u} color={bad ? ROLE.INVALID : colors.TEXT} />
              </g>
            );
          })}
          <Txt x={CELL.x} y={CELL.y2 + 58} text="marker now · re-read immediately before input" size={13.5} mono />
          <Chip x={CELL.x} y={372} text="✓ fresh → input may proceed" color={ROLE.CHECKED} fill="#062a1e" size={14} u={clamp01(markU - 7.5) * (differs ? 0 : 1) * (1 - staleU)} />
          <Chip x={CELL.x} y={372} text="✕ StalePage → observe, then choose again" color={ROLE.INVALID} fill="#2a0c14" size={14} u={staleU} />
          <g opacity={s.get(scene.guardNoteU)}>
            <Txt x={CELL.x} y={428} text="fill → the whole-observation marker" size={14} />
            <Txt x={CELL.x} y={452} text="click · select → page key + that element's own guard" size={14} />
          </g>
          <g opacity={clamp01(againU * 3)}>
            <Chip x={CELL.x} y={416} text="observe()" color={ROLE.OBSERVE} size={13} u={clamp01(againU * 3)} />
            <Txt x={CELL.x + 112} y={434} text="→" size={16} color={colors.MUTED} u={clamp01(againU * 3 - 1)} />
            <Chip x={CELL.x + 136} y={416} text="choose() again" color={ROLE.MODEL} size={13} u={clamp01(againU * 3 - 1)} />
            <Txt x={CELL.x + 286} y={434} text="→" size={16} color={colors.MUTED} u={clamp01(againU * 3 - 2)} />
            <Chip x={CELL.x + 310} y={416} text={'pending_text = (context, "London")'} color={colors.WARM} fill="#1a1405" size={13} u={clamp01(againU * 3 - 2)} />
          </g>
          <g opacity={reuseU}>
            <Txt x={CELL.x} y={486} text="✓ helper input identical → reuse the text · no second helper call" size={14.5} weight={700} color={ROLE.CHECKED} />
            <Txt x={CELL.x} y={510} text="any difference in that input → ask the helper again" size={13.5} color={colors.MUTED} />
          </g>
        </g>
      )}
      <Txt x={PG.x + PG.w} y={PG.y - 10} text="scrollY changed" size={13} mono anchor="end" color={ROLE.INVALID} u={staleU} />

      {/* beat 6 — a click is aimed at where the element is NOW */}
      {geoVis > 0.002 && (
        <g opacity={geoVis}>
          <Txt x={476} y={300} text="example: CLICK → Search" size={14} mono color={colors.MUTED} />
          <rect x={SEARCH_NOW.x - 3} y={SEARCH_NOW.y - SCROLL - 3} width={SEARCH_NOW.w + 6} height={SEARCH_NOW.h + 6} rx={9} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="5 4" opacity={clamp01(geoU)} />
          <Txt x={476} y={336} text="observed rect · old coordinates not trusted" size={14} color={colors.MUTED} u={clamp01(geoU)} />
          <g opacity={clamp01(geoU - 1)}>
            <rect x={SEARCH_NOW.x - 3} y={SEARCH_NOW.y - 3} width={SEARCH_NOW.w + 6} height={SEARCH_NOW.h + 6} rx={9} fill="none" stroke={colors.WARM} strokeWidth={2.6} />
            <line x1={SEARCH_NOW.x + SEARCH_NOW.w / 2 - 14} x2={SEARCH_NOW.x + SEARCH_NOW.w / 2 + 14} y1={SEARCH_NOW.y + 22} y2={SEARCH_NOW.y + 22} stroke={colors.WARM} strokeWidth={2} />
            <line x1={SEARCH_NOW.x + SEARCH_NOW.w / 2} x2={SEARCH_NOW.x + SEARCH_NOW.w / 2} y1={SEARCH_NOW.y + 8} y2={SEARCH_NOW.y + 36} stroke={colors.WARM} strokeWidth={2} />
            <Txt x={476} y={366} text="node n4 → getBoundingClientRect() now → center" size={14} weight={650} color={colors.WARM} />
          </g>
          <Txt x={476} y={396} text="✓ elementFromPoint(x, y) is inside the target" size={14} mono color={ROLE.CHECKED} u={clamp01(geoU - 2) * (1 - clamp01(coverU * 3))} />
          {coverU > 0.002 && (
            <g opacity={clamp01(coverU * 3)} transform={`translate(0 ${(1 - coverU) * 60})`}>
              <rect x={PG.x + 200} y={SEARCH_NOW.y - 14} width={210} height={72} rx={10} fill="#2a0c14" stroke={ROLE.INVALID} strokeWidth={2} />
              <Txt x={PG.x + 305} y={SEARCH_NOW.y + 28} text="overlay" size={15} anchor="middle" color={ROLE.INVALID} weight={700} />
            </g>
          )}
          <Txt x={476} y={396} text="✕ another element is on top → StalePage · observe again" size={14} mono color={ROLE.INVALID} u={clamp01(coverU * 3 - 1.5)} />
        </g>
      )}

      {/* beat 7 — London flows into the real control; then the exact order */}
      {flyOut && <Txt x={lerp(SLOT.x + 64, PG.x + CTRL.to.x + 100, ease.move(clamp01(typeU * 1.6)))} y={lerp(SLOT.y + 26, PG.y + CTRL.to.y + 28 + SCROLL, ease.move(clamp01(typeU * 1.6)))} text={'"London"'} size={16} mono weight={800} color={ROLE.CHECKED} u={1 - clamp01(typeU * 1.6 - 0.6) * 2.5} />}
      {orderVis > 0.002 && (
        <g opacity={orderVis}>
          {STEPS.map((st, i) => {
            const on = clamp01(orderU - i);
            const cur = on * (1 - clamp01(orderU - i - 1));
            return (
              <g key={st} opacity={0.15 + 0.85 * Math.max(cur, on * 0.45)}>
                <rect x={540} y={210 + i * 58} width={600} height={46} rx={9} fill="#0b1324" stroke={cur > 0.5 ? colors.WARM : '#2a3754'} strokeWidth={cur > 0.5 ? 2.4 : 1.2} />
                <Txt x={556} y={239 + i * 58} text={st} size={15} mono weight={cur > 0.5 ? 800 : 500} />
              </g>
            );
          })}
          <g opacity={clamp01(orderU - 2.2)}>
            <Txt x={556} y={406} text="settle: ≥ 2 frames, and for this combobox a visible role=option" size={14} />
            <Txt x={556} y={428} text="capped by a code constant (200 ms) · then the page script runs" size={13} mono color={colors.MUTED} />
          </g>
          <Chip x={540} y={458} text="next menu:  [3] London, United Kingdom · option → CLICK" color={ROLE.CHECKED} fill="#062a1e" size={14} u={s.get(scene.menuU)} />
        </g>
      )}

      {/* beat 8 — further cycles; DONE stops, success is a separate question */}
      {cycleVis > 0.002 && (
        <g opacity={cycleVis}>
          <Txt x={540} y={222} text="one action per cycle · observe between each" size={14} color={colors.MUTED} />
          {CYCLES.map((c, i) => {
            const on = clamp01(cycleU - i);
            const cur = on * (1 - clamp01(cycleU - i - 1));
            const x = 540 + i * 176;
            return (
              <g key={c} opacity={0.15 + 0.85 * Math.max(cur, on * 0.5)}>
                <rect x={x} y={240} width={160} height={46} rx={9} fill="#0b1324" stroke={i === 3 ? ROLE.CHECKED : ROLE.MODEL} strokeWidth={cur > 0.5 ? 2.6 : 1.3} />
                <Txt x={x + 80} y={268} text={c} size={13.5} mono anchor="middle" weight={700} />
                {i < 3 && <circle cx={x + 168} cy={263} r={4} fill={ROLE.OBSERVE} />}
              </g>
            );
          })}
          <Chip x={540} y={316} text='status = "done" → the loop stops' color={ROLE.CHECKED} fill="#062a1e" size={14.5} u={s.get(scene.doneU)} />
          <g opacity={s.get(scene.outcomeU)}>
            <rect x={540} y={380} width={600} height={84} rx={12} fill="none" stroke={ROLE.PENDING} strokeWidth={1.6} strokeDasharray="7 5" />
            <Txt x={560} y={414} text="? did the task actually succeed" size={17} weight={750} color={ROLE.PENDING} />
            <Txt x={560} y={442} text="a separate outcome check — not something a done decision proves" size={14} />
          </g>
        </g>
      )}

      {/* beat 9 — the loop */}
      {ringU > 0.002 && (
        <g>
          <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke="#2a3754" strokeWidth={3} strokeDasharray={`${2 * Math.PI * RING.r}`} strokeDashoffset={2 * Math.PI * RING.r * (1 - ringU)} transform={`rotate(-90 ${RING.x} ${RING.y})`} />
          {RING_NODES.map((n, i) => {
            const p = ringPt(-Math.PI / 2 + (i * Math.PI) / 2);
            const d = Math.abs(((pulseU * 4) % 4) - i);
            const hot = pulseU > 0.002 ? clamp01(1 - Math.min(d, 4 - d) * 2.5) : 0;
            return (
              <g key={n} opacity={clamp01(ringU * 4 - i * 0.8)}>
                <rect x={p.x - 62} y={p.y - 22} width={124} height={44} rx={22} fill="#0b1324" stroke={hot > 0.5 ? colors.WARM : colors.TEXT} strokeWidth={1.6 + 1.4 * hot} />
                <Txt x={p.x} y={p.y + 6} text={n} size={17} weight={800} anchor="middle" />
              </g>
            );
          })}
          <Txt x={RING.x} y={RING.y - 4} text="then observe" size={15} anchor="middle" color={colors.MUTED} u={clamp01(ringU * 3 - 2)} />
          <Txt x={RING.x} y={RING.y + 18} text="again" size={15} anchor="middle" color={colors.MUTED} u={clamp01(ringU * 3 - 2)} />
          {pulseU > 0.002 && <circle cx={pulse.x} cy={pulse.y} r={8} fill={colors.WARM} opacity={0.9} />}
          <Chip x={RING.x - 110} y={148} text="structured observations" color={ROLE.OBSERVE} size={14} u={clamp01(sumU)} />
          <Chip x={RING.x + 162} y={386} text="shared choice requests" color={ROLE.MODEL} size={13} u={clamp01(sumU - 1)} />
          <Chip x={RING.x - 380} y={386} text="selective text generation" color={ROLE.CHECKED} size={13} u={clamp01(sumU - 2)} />
        </g>
      )}
    </Camera>
      {/* goal + honesty label — fixed stage coordinates, outside the camera, so a focus move never clips them */}
      <Chip x={40} y={30} text="goal: find a one-way flight from Zurich to London" color={ROLE.PENDING} fill="#1a1405" size={15} u={pageU} />
      <Txt x={40} y={78} text="illustrative page and values · not a captured run" size={13} color={colors.MUTED} mono u={pageU} />
    </>
  );
}

export const vizScene = () => scene;
