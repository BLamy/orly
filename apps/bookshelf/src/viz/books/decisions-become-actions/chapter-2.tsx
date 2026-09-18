// One request, several questions, one action
//
// Book 3 "Decisions Become Actions", chapter 2 — how the PUBLIC Jev Ultrafast
// repository asks for an operation and its target in one request. Sources
// (commit 1231850): model.py choose (one POST body: state + questions
// {operation, click_target, type_text_target, select_target}; the operation
// answer picks `answers[operation.lower() + "_target"]`; "Unused target heads
// cannot cause an action"; targets[operation][target]["id"] maps the index back
// to an observed action) and validate_choice (choice offered, probabilities
// cover exactly the offered ids, finite 0…1, sum within 0.02 of 1, choice is
// the max → otherwise ValueError, no action executed); questions.py TARGET
// ("if the next operation is the one specified in this question").
// The flight page, indices and every probability are ILLUSTRATIVE — not a
// captured run. The remote service's inference internals are not in the
// repository and are drawn as opaque.
//
// ONE persistent mechanism: the observed state (left) fans into four question
// lanes (right). The lanes fill with answers, one target lane is selected by the
// operation answer, the rest are discarded, the survivor is validated and its
// index is mapped back to the observed fill action on the real To field.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 two sequential asks vs one request carrying both kinds of question
//  2 the request leaves; four question lanes open
//  3 spotlight type_text_target: a conditional question
//  4 answers return: TYPE_TEXT + [2] To; click_target answered but inert
//  5 the operation answer selects one lane; the others are discarded
//  6 validate_choice on the selected answer; invalid stops before input
//  7 index "2" → targets["TYPE_TEXT"]["2"] → action e3 → the real To field
//  8 one model round trip for operation + target; the service stays opaque
import { range } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MONO, ROLE, captionPlan } from '../next-useful-action/shared/profile-page';
import { Chip, clamp01, lerp, tri } from './shared/kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'A usual sequence would first ask what operation to perform, then ask which element to use. Jev puts both kinds of question into one request.',
  'The shared state goes to the TypeSafe service with an operation question and separate target questions for clicking, typing, and selection when available.',
  'Each target question is conditional: if we were going to type, which editable field would we choose? It can be answered before the operation result comes back.',
  'Imagine the response chooses typing, with destination as the typing target. A click target may also be returned, but its answer is not an instruction to click.',
  'The operation selects exactly one matching target answer. The other target answers are discarded for execution, so speculative questions do not become speculative browser actions.',
  'The code checks that the selected answer belongs to the offered choices and that its probability data is valid. Invalid output stops before any browser input.',
  'The selected index maps back to an action from the snapshot. The model does not invent a selector or coordinates, and its output is never executed as code.',
  "This saves a sequential model round trip for choosing the operation and target. The repository calls a remote service; it does not expose that service's inference internals.",
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const ST = { x: 40, y: 100, w: 360, h: 330 };
const STATE_ROWS = [
  { idx: '[1]', label: 'From', value: '"Zurich"' },
  { idx: '[2]', label: 'To', value: '""' },
  { idx: '[3]', label: 'Ticket type', value: '"Round trip"' },
  { idx: '[4]', label: 'Search', value: '' },
];
const SVC = { x: 470, y: 190, w: 180, h: 150 };
const LANE = { x: 720, w: 520, h: 96, y0: 100, pitch: 118 };
// illustrative probabilities — each lane sums to 1
const LANES = [
  { key: 'operation', cond: 'what to do next', color: colors.TEXT, cw: 84, cands: [['CLICK', 0.06], ['TYPE_TEXT', 0.88], ['SELECT', 0.04], ['WAIT', 0.01], ['DONE', 0.0], ['BLOCKED', 0.01]] as [string, number][], pick: 1 },
  { key: 'type_text_target', cond: 'IF TYPE_TEXT → which field?', color: ROLE.MODEL, cw: 160, cands: [['[1] From', 0.08], ['[2] To', 0.92]] as [string, number][], pick: 1 },
  { key: 'click_target', cond: 'IF CLICK → which control?', color: ROLE.OBSERVE, cw: 160, cands: [['[1] Open From', 0.1], ['[2] Open To', 0.25], ['[4] Search', 0.65]] as [string, number][], pick: 2 },
  { key: 'select_target', cond: 'IF SELECT → which pair?', color: ROLE.PENDING, cw: 160, cands: [['3:1 One way', 0.95], ['3:2 Multi-city', 0.05]] as [string, number][], pick: 0 },
];
const laneY = (i: number) => LANE.y0 + i * LANE.pitch;
// per-focus lane opacity: 0 all · 1 type only · 2 op+type · 3 click only · 4 selected pair + discards · 5 type only, rest gone · 6 mapping · 7 ending
// select_target is hidden (not dimmed) whenever the zoomed camera would crop it under the captions
const LIT = [
  [1, 1, 1, 1],
  [0.15, 1, 0.15, 0],
  [1, 1, 0.15, 0],
  [0.15, 0.15, 1, 0],
  [1, 1, 0.5, 0.5],
  [0.15, 1, 0, 0],
  [0, 1, 0, 0],
  [1, 1, 0, 0],
];
const CHECKS = ['✓ choice is an offered id', '✓ keys = offered ids', '✓ each finite, 0…1', '✓ sum ≈ 1 (±0.02)', '✓ choice holds the max'];
const VAL = { x: 430, y: 170, w: 276, h: 250 };
const CHAIN = [
  { text: 'choice "2"', x: 720 },
  { text: 'targets["TYPE_TEXT"]["2"]', x: 850 },
  { text: 'e3 · fill · node n2', x: 1100 },
];
const NEVER = ['✕ selector', '✕ coordinates', '✕ code to run'];
const SEQ = { x0: 470, x1: 1100, y: [210, 300], yOne: 430 };

const CAM_SEQ: CameraState = { x: 620, y: 320, k: 1.06 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_LANE: CameraState = { x: 980, y: 285, k: 1.35 };
const CAM_LANES: CameraState = { x: 960, y: 330, k: 1.15 };
const CAM_VALID: CameraState = { x: 900, y: 300, k: 1.3 };
const CAM_MAP: CameraState = { x: 960, y: 380, k: 1.25 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SEQ, cameraInterp);
  const stateU = tl.channel('stateU', 0);
  const stateDim = tl.channel('stateDim', 0);
  const seqVis = tl.channel('seqVis', 0);
  const seqU = tl.channel('seqU', 0);
  const oneU = tl.channel('oneU', 0);
  const svcU = tl.channel('svcU', 0);
  const svcDim = tl.channel('svcDim', 0);
  const svcOff = tl.channel('svcOff', 0);
  const reqU = tl.channel('reqU', 0);
  const lanesU = tl.channel('lanesU', 0);
  const focus = tl.channel('focus', 0);
  const ansType = tl.channel('ansType', 0);
  const respU = tl.channel('respU', 0);
  const ansAll = tl.channel('ansAll', 0);
  const inertU = tl.channel('inertU', 0);
  const armU = tl.channel('armU', 0);
  const discardU = tl.channel('discardU', 0);
  const checkVis = tl.channel('checkVis', 0);
  const checkU = tl.channel('checkU', 0);
  const stopU = tl.channel('stopU', 0);
  const chainU = tl.channel('chainU', 0);
  const chainVis = tl.channel('chainVis', 0);
  const neverU = tl.channel('neverU', 0);
  const tripsU = tl.channel('tripsU', 0);
  const opaqueU = tl.channel('opaqueU', 0);

  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · two asks, or one — */
  let b = AT[0];
  tl.tween(stateU, 1, { at: b + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(seqVis, 1, { at: b + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(seqU, 2, { at: b + 1.4, dur: 5.2, ease: ease.linear });
  tl.tween(oneU, 1, { at: b + 7.4, dur: 2.6, ease: ease.linear });

  /* — beat 2 · the request and its questions — */
  b = AT[1];
  tl.tween(seqVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(svcU, 1, { at: b + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(reqU, 1, { at: b + 1.8, dur: 1.6, ease: ease.linear });
  tl.tween(lanesU, 4, { at: b + 3.8, dur: 4.4, ease: ease.linear });

  /* — beat 3 · a conditional question — */
  b = AT[2];
  tl.tween(focus, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(stateDim, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(svcDim, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(svcOff, 1, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LANE, { at: b + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(ansType, 1, { at: b + 6.4, dur: 1.2, ease: ease.enter });

  /* — beat 4 · the response — */
  b = AT[3];
  tl.tween(cam, CAM_LANES, { at: b + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(svcOff, 0, { at: b + 0.1, dur: 0.3, ease: ease.enter });
  tl.tween(svcDim, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(respU, 1, { at: b + 0.6, dur: 1.2, ease: ease.linear });
  tl.tween(focus, 2, { at: b + 1.6, dur: 0.6, ease: ease.enter });
  tl.tween(ansAll, 1, { at: b + 1.8, dur: 1.2, ease: ease.enter });
  tl.tween(focus, 3, { at: b + 6.2, dur: 0.7, ease: ease.enter });
  tl.tween(inertU, 1, { at: b + 7.4, dur: 0.6, ease: ease.pop });

  /* — beat 5 · one lane selected, the rest discarded — */
  b = AT[4];
  tl.tween(svcDim, 1, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(inertU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(focus, 4, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(armU, 1, { at: b + 1.4, dur: 1.0, ease: ease.draw });
  tl.tween(discardU, 1, { at: b + 4.6, dur: 1.2, ease: ease.move });

  /* — beat 6 · validate the selected answer — */
  b = AT[5];
  tl.tween(focus, 5, { at: b + 0.2, dur: 0.7, ease: ease.enter });
  tl.tween(armU, 0, { at: b + 0.2, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_VALID, { at: b + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(checkVis, 1, { at: b + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(checkU, 5, { at: b + 1.8, dur: 5.0, ease: ease.linear });
  tl.tween(stopU, 1, { at: b + 8.0, dur: 0.6, ease: ease.pop });

  /* — beat 7 · the index maps back to an observed action — */
  b = AT[6];
  tl.tween(checkVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(focus, 6, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_MAP, { at: b + 0.3, dur: 1.3, ease: ease.move });
  tl.tween(chainVis, 1, { at: b + 0.8, dur: 0.5, ease: ease.enter });
  tl.tween(chainU, 4, { at: b + 1.2, dur: 4.8, ease: ease.linear });
  tl.tween(neverU, 3, { at: b + 6.6, dur: 2.4, ease: ease.linear });

  /* — beat 8 · one round trip; an opaque service — */
  b = AT[7];
  tl.tween(chainVis, 0, { at: b + 0.1, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(focus, 7, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(stateDim, 0, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(svcDim, 0, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(tripsU, 1, { at: b + 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(opaqueU, 1, { at: b + 6.0, dur: 0.8, ease: ease.enter });
  tl.hold(PLAN.end, 0.8);

  return {
    tl, cam, stateU, stateDim, seqVis, seqU, oneU, svcU, svcDim, svcOff, reqU, lanesU, focus, ansType, respU, ansAll, inertU, armU, discardU,
    checkVis, checkU, stopU, chainU, chainVis, neverU, tripsU, opaqueU,
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

/** out-and-back position of a packet along a track; u in 0..1 covers the whole round trip */
const roundTrip = (u: number): number => (u < 0.5 ? u * 2 : 2 - u * 2);

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const stateU = s.get(scene.stateU);
  const stateDim = s.get(scene.stateDim);
  const seqVis = s.get(scene.seqVis);
  const seqU = s.get(scene.seqU);
  const oneU = s.get(scene.oneU);
  const svcU = s.get(scene.svcU);
  const svcDim = s.get(scene.svcDim);
  const svcOff = s.get(scene.svcOff);
  const reqU = s.get(scene.reqU);
  const lanesU = s.get(scene.lanesU);
  const focus = s.get(scene.focus);
  const ansType = s.get(scene.ansType);
  const respU = s.get(scene.respU);
  const ansAll = s.get(scene.ansAll);
  const inertU = s.get(scene.inertU);
  const armU = s.get(scene.armU);
  const discardU = s.get(scene.discardU);
  const checkVis = s.get(scene.checkVis);
  const checkU = s.get(scene.checkU);
  const chainU = s.get(scene.chainU);
  const chainVis = s.get(scene.chainVis);
  const neverU = s.get(scene.neverU);
  const tripsU = s.get(scene.tripsU);
  const opaqueU = s.get(scene.opaqueU);

  const lit = (i: number) => LIT.reduce((a, row, f) => a + tri(focus, f) * row[i], 0);
  const rowHot = chainU > 3 && chainVis > 0.5;

  return (
    <>
    <Camera {...s.get(scene.cam)}>
      {/* THE STATE — what chapter 1 built, carried in every request */}
      {stateU > 0.002 && (
        <g opacity={stateU * (1 - 0.85 * stateDim)}>
          <rect x={ST.x} y={ST.y} width={ST.w} height={ST.h} rx={14} fill="#0a1020" stroke="#22304d" strokeWidth={1.5} />
          <Txt x={ST.x + 16} y={ST.y + 26} text="state · this observation" size={14} color={ROLE.OBSERVE} mono weight={700} />
          {STATE_ROWS.map((r, i) => {
            const y = ST.y + 42 + i * 46;
            const hot = rowHot && i === 1;
            return (
              <g key={r.idx}>
                <rect x={ST.x + 14} y={y} width={ST.w - 28} height={38} rx={8} fill="#0b1324" stroke={hot ? colors.WARM : ROLE.OBSERVE} strokeWidth={hot ? 2.6 : 1.2} />
                <Txt x={ST.x + 26} y={y + 25} text={r.idx} size={16} mono weight={800} color={colors.WARM} />
                <Txt x={ST.x + 72} y={y + 25} text={r.label} size={16} weight={700} />
                <Txt x={ST.x + ST.w - 26} y={y + 25} text={r.value} size={14} mono anchor="end" color={colors.MUTED} />
              </g>
            );
          })}
          <Chip x={ST.x + 14} y={ST.y + 236} text="page.text" color={ROLE.OBSERVE} u={1} size={13} />
          <Chip x={ST.x + 132} y={ST.y + 236} text="recent_actions: []" color={ROLE.CHECKED} u={1} size={13} />
          <Txt x={ST.x + 16} y={ST.y + 300} text="+ the goal, inside every question" size={13} color={colors.MUTED} />
        </g>
      )}

      {/* beat 1 — sequential asking vs one request */}
      {seqVis > 0.002 && (
        <g opacity={seqVis}>
          {SEQ.y.map((y, i) => {
            const u = clamp01(seqU - i);
            const px = lerp(SEQ.x0, SEQ.x1 - 70, roundTrip(u));
            return (
              <g key={y} opacity={0.15 + 0.85 * clamp01((seqU - i) * 8)}>
                <Txt x={SEQ.x0} y={y - 26} text={i === 0 ? '1 · which operation?' : '2 · then: which element?'} size={17} weight={700} />
                <line x1={SEQ.x0} x2={SEQ.x1 - 70} y1={y} y2={y} stroke="#2a3754" strokeWidth={2} strokeDasharray="4 6" />
                <rect x={SEQ.x1 - 60} y={y - 24} width={110} height={48} rx={10} fill="#15122e" stroke={ROLE.MODEL} strokeWidth={1.5} />
                <Txt x={SEQ.x1 - 5} y={y + 5} text="model" size={14} mono anchor="middle" color={ROLE.MODEL} />
                {u > 0.002 && u < 0.998 && <circle cx={px} cy={y} r={10} fill={u < 0.5 ? colors.TEXT : ROLE.MODEL} />}
                <Txt x={SEQ.x0} y={y + 30} text={i === 0 ? '→ TYPE_TEXT' : '→ [2] To'} size={14} mono color={ROLE.MODEL} u={clamp01(u * 8 - 7)} />
              </g>
            );
          })}
          <g opacity={clamp01(oneU * 6)}>
            <Txt x={SEQ.x0} y={SEQ.yOne - 28} text="Jev · one request, both kinds of question" size={17} weight={700} color={ROLE.CHECKED} />
            <line x1={SEQ.x0} x2={SEQ.x1 - 70} y1={SEQ.yOne} y2={SEQ.yOne} stroke={ROLE.CHECKED} strokeWidth={2} strokeDasharray="4 6" opacity={0.6} />
            <rect x={SEQ.x1 - 60} y={SEQ.yOne - 24} width={110} height={48} rx={10} fill="#15122e" stroke={ROLE.MODEL} strokeWidth={1.5} />
            <Txt x={SEQ.x1 - 5} y={SEQ.yOne + 5} text="service" size={14} mono anchor="middle" color={ROLE.MODEL} />
            {oneU > 0.002 && oneU < 0.998 && (
              <g transform={`translate(${lerp(SEQ.x0, SEQ.x1 - 70, roundTrip(oneU))} ${SEQ.yOne})`}>
                <rect x={-22} y={-11} width={22} height={22} rx={5} fill={colors.TEXT} />
                <rect x={0} y={-11} width={22} height={22} rx={5} fill={ROLE.MODEL} />
              </g>
            )}
            <Txt x={SEQ.x0} y={SEQ.yOne + 32} text="→ TYPE_TEXT  +  [2] To" size={14} mono color={ROLE.CHECKED} u={clamp01(oneU * 8 - 7)} />
          </g>
        </g>
      )}

      {/* the remote service — drawn opaque on purpose */}
      {svcU > 0.002 && (
        <g opacity={svcU * (1 - 0.85 * svcDim) * (1 - svcOff)}>
          <rect x={SVC.x} y={SVC.y} width={SVC.w} height={SVC.h} rx={14} fill="#15122e" stroke={ROLE.MODEL} strokeWidth={1.8} />
          <Txt x={SVC.x + SVC.w / 2} y={SVC.y + 34} text="TypeSafe" size={19} weight={800} anchor="middle" />
          <Txt x={SVC.x + SVC.w / 2} y={SVC.y + 56} text="remote service" size={13} anchor="middle" color={colors.MUTED} />
          <Txt x={SVC.x + SVC.w / 2} y={SVC.y + 84} text="POST /v1/systemone" size={12.5} mono anchor="middle" color={ROLE.MODEL} />
          {range(5).map((i) => (
            <line key={i} x1={SVC.x + 20 + i * 30} y1={SVC.y + 136} x2={SVC.x + 50 + i * 30} y2={SVC.y + 102} stroke={ROLE.MODEL} strokeWidth={5} opacity={0.12 + 0.5 * opaqueU} />
          ))}
        </g>
      )}
      <Txt x={SVC.x + SVC.w / 2} y={SVC.y + SVC.h + 26} text="inference internals:" size={14} anchor="middle" weight={650} u={opaqueU} />
      <Txt x={SVC.x + SVC.w / 2} y={SVC.y + SVC.h + 46} text="not in this repository" size={14} anchor="middle" weight={650} color={ROLE.PENDING} u={opaqueU} />
      {reqU > 0.002 && reqU < 0.998 && (
        <g transform={`translate(${lerp(ST.x + ST.w, SVC.x, reqU)} ${SVC.y + SVC.h / 2})`}>
          <rect x={-26} y={-16} width={52} height={32} rx={6} fill="#0b1324" stroke={colors.TEXT} strokeWidth={1.6} />
          {range(4).map((i) => (
            <rect key={i} x={-20 + i * 11} y={-8} width={8} height={16} rx={2} fill={LANES[i].color} />
          ))}
        </g>
      )}
      {respU > 0.002 && respU < 0.998 && <circle cx={lerp(SVC.x + SVC.w, LANE.x, respU)} cy={SVC.y + SVC.h / 2} r={10} fill={ROLE.MODEL} />}

      {/* THE QUESTION LANES — persistent through beats 2–8 */}
      {LANES.map((lane, i) => {
        const enter = clamp01(lanesU - i);
        const o = enter * lit(i);
        if (o <= 0.002) return null;
        const y = laneY(i);
        const ans = i === 1 ? Math.max(ansType, ansAll) : ansAll;
        const gone = i >= 2 ? discardU : 0;
        return (
          <g key={lane.key} opacity={o} transform={`translate(${gone * 26 + (1 - enter) * 20} 0)`}>
            <rect x={LANE.x} y={y} width={LANE.w} height={LANE.h} rx={12} fill="#0b1324" stroke={lane.color} strokeWidth={1.4} strokeDasharray={gone > 0.5 ? '6 5' : undefined} />
            <Txt x={LANE.x + 14} y={y + 24} text={lane.key} size={15} mono weight={800} color={lane.color} />
            <Txt x={LANE.x + LANE.w - 14} y={y + 24} text={gone > 0.5 ? 'discarded · never executed' : i === 2 && inertU > 0.5 ? 'an answer, not an instruction to click' : lane.cond} size={13} anchor="end" color={gone > 0.5 ? ROLE.INVALID : i === 2 && inertU > 0.5 ? ROLE.PENDING : colors.MUTED} weight={gone > 0.5 || (i === 2 && inertU > 0.5) ? 700 : 500} />
            {lane.cands.map(([label, p], j) => {
              const cx = LANE.x + 10 + j * (lane.cw + 4);
              const picked = j === lane.pick && ans > 0.6;
              return (
                <g key={label}>
                  <rect x={cx} y={y + 38} width={lane.cw} height={48} rx={7} fill={picked ? '#1a1633' : '#0d1526'} stroke={picked ? lane.color : '#2a3754'} strokeWidth={picked ? 2.2 : 1} />
                  <Txt x={cx + lane.cw / 2} y={y + 58} text={label} size={i === 0 ? 12.5 : 14} mono anchor="middle" weight={picked ? 800 : 500} />
                  <rect x={cx + 8} y={y + 68} width={(lane.cw - 16) * p * ans} height={7} rx={3} fill={lane.color} opacity={0.9} />
                  {i > 0 && <Txt x={cx + lane.cw - 8} y={y + 82} text={p.toFixed(2)} size={12} mono anchor="end" color={colors.MUTED} u={ans} />}
                </g>
              );
            })}
          </g>
        );
      })}
      <Txt x={LANE.x + 346} y={laneY(1) + 58} text="answerable without" size={13.5} color={ROLE.MODEL} weight={650} u={tri(focus, 1) * clamp01(lanesU - 3)} />
      <Txt x={LANE.x + 346} y={laneY(1) + 77} text="the operation result" size={13.5} color={ROLE.MODEL} weight={650} u={tri(focus, 1) * clamp01(lanesU - 3)} />

      <Txt x={LANE.x + LANE.w} y={88} text="illustrative probabilities · not a captured run" size={12.5} mono anchor="end" color={colors.MUTED} u={clamp01(lanesU)} />

      {/* beat 5 — the operation answer picks its lane */}
      {armU > 0.002 && (
        <g opacity={clamp01(armU * 3)}>
          <line x1={LANE.x + 140} y1={laneY(0) + 86} x2={LANE.x + 140} y2={lerp(laneY(0) + 86, laneY(1), armU)} stroke={colors.WARM} strokeWidth={3} />
          <Txt x={LANE.x + 154} y={laneY(1) - 6} text={'answers[operation.lower() + "_target"]'} size={12.5} mono color={colors.WARM} u={clamp01(armU * 2 - 1)} />
        </g>
      )}

      {/* beat 6 — validate_choice */}
      {checkVis > 0.002 && (
        <g opacity={checkVis}>
          <rect x={VAL.x} y={VAL.y} width={VAL.w} height={VAL.h} rx={12} fill="#07110d" stroke={ROLE.CHECKED} strokeWidth={1.6} />
          <Txt x={VAL.x + 16} y={VAL.y + 28} text="validate_choice(answer, ids)" size={13.5} mono weight={700} color={ROLE.CHECKED} />
          {CHECKS.map((c, i) => (
            <Txt key={c} x={VAL.x + 16} y={VAL.y + 60 + i * 28} text={c} size={14.5} mono u={clamp01(checkU - i)} />
          ))}
          <g opacity={s.get(scene.stopU)}>
            <line x1={VAL.x + 16} x2={VAL.x + VAL.w - 16} y1={VAL.y + 190} y2={VAL.y + 190} stroke={ROLE.INVALID} strokeWidth={1.2} opacity={0.6} />
            <Txt x={VAL.x + 16} y={VAL.y + 212} text="✕ otherwise: ValueError" size={14} mono color={ROLE.INVALID} weight={700} />
            <Txt x={VAL.x + 16} y={VAL.y + 234} text="  no action executed" size={14} mono color={ROLE.INVALID} />
          </g>
          <line x1={VAL.x + VAL.w} y1={laneY(1) + 48} x2={LANE.x} y2={laneY(1) + 48} stroke={ROLE.CHECKED} strokeWidth={2} strokeDasharray="4 4" />
        </g>
      )}

      {/* beat 7 — index → observed action → the real control */}
      {chainVis > 0.002 && (
        <g opacity={chainVis}>
          {CHAIN.map((c, i) => (
            <g key={c.text}>
              <Chip x={c.x} y={360} text={c.text} color={i === 2 ? ROLE.OBSERVE : colors.WARM} size={13} u={clamp01(chainU - i)} />
              {i > 0 && <Txt x={c.x - 16} y={378} text="→" size={16} anchor="middle" color={colors.MUTED} u={clamp01(chainU - i)} />}
            </g>
          ))}
          <line x1={LANE.x + 254} y1={laneY(1) + 86} x2={LANE.x + 60} y2={360} stroke={colors.WARM} strokeWidth={1.8} strokeDasharray="5 4" opacity={clamp01(chainU)} />
          <g opacity={clamp01(chainU - 3)}>
            <Txt x={720} y={436} text="To" size={13} color={colors.MUTED} />
            <rect x={720} y={444} width={330} height={46} rx={8} fill="#0d1526" stroke={colors.WARM} strokeWidth={2.6} />
            <Txt x={734} y={473} text="City or airport" size={17} color="#4b5b78" />
            <rect x={1006} y={432} width={34} height={20} rx={10} fill="#1e1b4b" stroke={ROLE.MODEL} strokeWidth={1.2} />
            <Txt x={1023} y={446.5} text="n2" size={12} mono anchor="middle" color={ROLE.MODEL} weight={700} />
            <Txt x={720} y={516} text="the observed control, kept by the executor" size={14} color={colors.TEXT} />
            <line x1={1120} y1={386} x2={1030} y2={444} stroke={ROLE.OBSERVE} strokeWidth={1.8} strokeDasharray="5 4" />
          </g>
          <Txt x={1100} y={444} text="the model never supplies" size={13} color={colors.MUTED} u={clamp01(neverU * 3)} />
          {NEVER.map((n, i) => (
            <Chip key={n} x={1100} y={454 + i * 30} text={n} color={ROLE.INVALID} fill="#2a0c14" size={13} u={clamp01(neverU - i)} />
          ))}
        </g>
      )}

      {/* beat 8 — counts, not timings */}
      <g opacity={tripsU}>
        <Txt x={LANE.x} y={372} text="asked one after the other" size={16} color={colors.MUTED} />
        <Txt x={LANE.x + 300} y={372} text="2 model round trips" size={16} mono color={colors.MUTED} />
        <line x1={LANE.x + 296} x2={LANE.x + 470} y1={367} y2={367} stroke={ROLE.INVALID} strokeWidth={2} />
        <Txt x={LANE.x} y={408} text="operation + target, together" size={16} weight={700} />
        <Txt x={LANE.x + 300} y={408} text="1 request" size={16} mono weight={800} color={ROLE.CHECKED} />
        <Txt x={LANE.x} y={444} text="a count of calls · no timing is claimed here" size={13} mono color={colors.MUTED} />
      </g>
    </Camera>
      {/* goal + honesty label — fixed stage coordinates, outside the camera, so a focus move never clips them */}
      <Chip x={40} y={30} text="goal: find a one-way flight from Zurich to London" color={ROLE.PENDING} fill="#1a1405" size={15} u={stateU} />
      <Txt x={40} y={78} text="illustrative state and probabilities · not a captured run" size={13} color={colors.MUTED} mono u={stateU} />
    </>
  );
}

export const vizScene = () => scene;
