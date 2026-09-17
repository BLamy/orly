// A choice is not yet a selector
//
// Book 3 "Decisions Become Actions", chapter 2 — PROPOSED checked execution.
// Sources: charter — Browser-action invariants 2–4; Reference and architecture
// decisions. The candidate IDs, observation versions, test id and locator
// recipes are ILLUSTRATIVE teaching fixtures, not a production API or a
// durable selector. No timing, accuracy or provider capability is claimed.
//
// ONE persistent mechanism: the chosen candidate tile (target + action, bound
// to an observation version) opens into a locator recipe card, tethered to its
// live target on the recurring Profile page. The page rerenders under it (the
// target moves, a duplicate Save appears, the version advances), the tether is
// left pointing at the old position, the gate sends the choice back to
// observation, and only a re-bound, re-checked recipe dispatches ONE action —
// whose postcondition is then observed on the page.
//
// BEATS (captions are parent-authored and fixed verbatim)
//  1 tempting: a model-written selector fired straight at the page; then the tile
//  2 pull back: the tile tethers to its target in obs v12 and opens into a card
//  3 evidence packets ride the tether: role, name, test id → a code-built locator
//  4 the locator sweeps the page: unique, present, action available
//  5 the page rerenders: target moves, version advances, the tether goes stale
//  6 re-sweep finds two Saves; the gate returns the choice to observation; re-bind
//  7 re-checked → one click → "returned" is weak; the saved postcondition is observed
//  8 cleared stage: the five-stage loop, one checked action per turn
import { arc, interpolateRgb, linkHorizontal, range, scaleLinear } from 'd3';
import { Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Activation, CONTROLS, MONO, PAGE, ProfilePage, ProposedTag, ROLE, captionPlan, controlRect } from '../next-useful-action/shared/profile-page';
import type { Rect } from '../next-useful-action/shared/profile-page';
import { Chip, clamp01, corners, lerp } from './shared/kit';

/* ------------------------------------------------------------- narration */
const CAPTIONS = [
  'It is tempting to ask the model to write a selector and immediately execute whatever comes back. Our proposed contract separates the decision from that last step.',
  'The chosen candidate points to a target in an observation. Code then builds a locator from evidence about that target in the live page.',
  "For example, a button's role and accessible name may identify it. A stable test identifier may help. The exact recipe depends on what the page exposes.",
  'Before acting, the executor checks that the locator resolves uniquely, that the element is still present, and that the requested action is available.',
  "Pages change while a model is thinking. If a dialog opens or a control disappears, yesterday's good answer can become today's wrong target.",
  'A stale or ambiguous choice triggers a fresh observation or an abstention. It must not turn into a guessed click on something that merely looks close.',
  'After one checked action, the system observes the result. A click returning successfully is weaker evidence than the intended change actually appearing on the page.',
  'This loop gives us a meaningful unit of progress: observe, decide, validate, act, and check what happened before deciding again.',
] as const;
const PLAN = captionPlan(CAPTIONS);
const AT = PLAN.at;

/* ---------------------------------------------------------------- layout */
const S = 0.95;
const P = { x: 40, y: 72, scale: S };
const BODY_TOP = P.y + 84 * S;
const PAGE_BOTTOM = P.y + PAGE.h * S;
const SHIFT = 40 * S; // the rerender inserts a banner and pushes the form down
const BANNER_SAVE = { x: 436, y: 95, w: 80, h: 22 }; // page-local duplicate "Save"
const TOAST = { x: 32, y: 384, w: 300, h: 34 };
const local = (r: Rect, dy = 0): Rect => ({ x: P.x + r.x * S, y: P.y + r.y * S + dy, w: r.w * S, h: r.h * S });
const saveRect = (dy: number): Rect => controlRect('save-button', { ...P, y: P.y + dy });

const CARD = { x: 636, y: 96, w0: 440, w1: 600, h0: 66, h1: 444 };
const CX = CARD.x + 20;
const SRC: [number, number] = [CARD.x, 300]; // where the tether leaves the card
const TEMPT = { x: 640, y: 250, w: 480, h: 80 };
const hlink = linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();
const link = (a: [number, number], b: [number, number]) => hlink({ source: a, target: b }) ?? '';
/** Point on the same cubic that linkHorizontal draws. */
function onLink(a: [number, number], b: [number, number], t: number): [number, number] {
  const mx = (a[0] + b[0]) / 2;
  const q = 1 - t;
  const w = [q * q * q, 3 * q * q * t, 3 * q * t * t, t * t * t];
  return [w[0] * a[0] + (w[1] + w[2]) * mx + w[3] * b[0], (w[0] + w[1]) * a[1] + (w[2] + w[3]) * b[1]];
}
const scanY = scaleLinear().domain([0, 1]).range([BODY_TOP, PAGE_BOTTOM]);
const staleTint = interpolateRgb(ROLE.OBSERVE, ROLE.INVALID);

const EVIDENCE = [
  { key: 'role', value: 'button', note: 'from the live target' },
  { key: 'name', value: '“Save”', note: 'accessible name' },
  { key: 'test id', value: 'data-testid = profile-save', note: 'if exposed' },
];
const LOC1 = "getByRole('button', { name: 'Save' })";
const LOC2 = "getByTestId('profile-save')";
const CHECKS = [
  { x: CX, ok: '✓ unique · 1 match', ask: '◌ unique?', bad: '✕ unique · 2 matches' },
  { x: CX + 210, ok: '✓ present', ask: '◌ present?', bad: '' },
  { x: CX + 344, ok: '✓ action available', ask: '◌ action available?', bad: '' },
];

const LOOP = { x: 640, y: 300, r0: 112, r1: 128, rl: 162 };
const STAGES = [
  { text: '◉ observe', color: ROLE.OBSERVE },
  { text: '◆ decide', color: ROLE.MODEL },
  { text: '◇ validate', color: ROLE.PENDING },
  { text: '▸ act', color: '#f1f5f9' },
  { text: '✓ check result', color: ROLE.CHECKED },
];
const ringArc = arc();
const STEP = (Math.PI * 2) / STAGES.length;

const CAM_START: CameraState = { x: 590, y: 296, k: 1.1 };
const CAM_HOME: CameraState = { x: 640, y: 360, k: 1 };
const CAM_LOOP: CameraState = { x: 640, y: 315, k: 1.05 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);
  const ch = (name: string, v = 0) => tl.channel(name, v);
  const c = {
    tempU: ch('tempU'), tempPathU: ch('tempPathU'), tempXU: ch('tempXU'), tileU: ch('tileU'), splitU: ch('splitU'),
    tetherU: ch('tetherU'), markU: ch('markU'), cardU: ch('cardU'), ev: ch('ev'), locU: ch('locU'),
    chkShowU: ch('chkShowU'), scanU: ch('scanU'), chk: ch('chk'), shU: ch('shU'), gateU: ch('gateU'),
    scan2U: ch('scan2U'), verdictU: ch('verdictU'), ambLineU: ch('ambLineU'), backU: ch('backU'), rebindU: ch('rebindU'),
    chk2: ch('chk2'), goU: ch('goU'), clickU: ch('clickU'), retU: ch('retU'), doneU: ch('doneU'), postU: ch('postU'),
    postChipU: ch('postChipU'), allU: ch('allU', 1), ringU: ch('ringU'), loopU: ch('loopU'),
  };
  CAPTIONS.forEach((text, i) => tl.caption({ at: AT[i], dur: PLAN.dur[i], text }));

  /* — beat 1 · the tempting shortcut, then the separated decision — */
  let b = AT[0];
  tl.tween(c.tempU, 1, { at: b + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(c.tempPathU, 1, { at: b + 1.6, dur: 1.6, ease: ease.draw });
  tl.tween(c.tempXU, 1, { at: b + 3.6, dur: 0.5, ease: ease.pop });
  tl.tween(c.tempU, 0, { at: b + 6.2, dur: 0.6, ease: ease.enter });
  tl.tween(c.tileU, 1, { at: b + 7.0, dur: 0.7, ease: ease.enter });
  tl.tween(c.splitU, 1, { at: b + 8.4, dur: 0.6, ease: ease.enter });

  /* — beat 2 · the choice points into an observation; code takes over — */
  b = AT[1];
  tl.tween(c.splitU, 0, { at: b + 0.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_HOME, { at: b + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(c.tetherU, 1, { at: b + 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(c.markU, 1, { at: b + 2.7, dur: 0.5, ease: ease.pop });
  tl.tween(c.cardU, 1, { at: b + 5.0, dur: 1.2, ease: ease.move });

  /* — beat 3 · evidence → recipe — */
  b = AT[2];
  [0.6, 3.2, 6.2].forEach((dt, k) => tl.tween(c.ev, k + 1, { at: b + dt, dur: 1.4, ease: ease.linear }));
  tl.tween(c.locU, 1, { at: b + 8.6, dur: 2.4, ease: ease.linear });

  /* — beat 4 · unique, present, available — */
  b = AT[3];
  tl.tween(c.chkShowU, 1, { at: b + 0.3, dur: 0.5, ease: ease.enter });
  tl.tween(c.scanU, 1, { at: b + 0.8, dur: 2.4, ease: ease.linear });
  [3.4, 6.2, 8.8].forEach((dt, k) => tl.tween(c.chk, k + 1, { at: b + dt, dur: 0.5, ease: ease.enter }));

  /* — beat 5 · the page changes under the choice — */
  b = AT[4];
  tl.tween(c.shU, 1, { at: b + 1.2, dur: 1.2, ease: ease.move });
  tl.tween(c.gateU, 1, { at: b + 5.5, dur: 0.6, ease: ease.enter });

  /* — beat 6 · stale + ambiguous → back to observation, never a guess — */
  b = AT[5];
  tl.tween(c.scan2U, 1, { at: b + 0.6, dur: 2.2, ease: ease.linear });
  tl.tween(c.verdictU, 1, { at: b + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(c.ambLineU, 1, { at: b + 5.4, dur: 0.5, ease: ease.enter });
  tl.tween(c.backU, 1, { at: b + 6.6, dur: 1.4, ease: ease.draw });
  tl.tween(c.rebindU, 1, { at: b + 8.8, dur: 1.6, ease: ease.move });

  /* — beat 7 · one checked action, then the observed result — */
  b = AT[6];
  tl.tween(c.chk2, 3, { at: b + 0.3, dur: 1.5, ease: ease.linear });
  tl.tween(c.goU, 1, { at: b + 2.0, dur: 0.5, ease: ease.pop });
  tl.tween(c.clickU, 1, { at: b + 2.9, dur: 1.0, ease: ease.linear });
  tl.tween(c.retU, 1, { at: b + 4.2, dur: 0.5, ease: ease.enter });
  tl.tween(c.doneU, 1, { at: b + 5.8, dur: 0.8, ease: ease.move });
  tl.tween(c.postU, 1, { at: b + 6.6, dur: 0.7, ease: ease.enter });
  tl.tween(c.postChipU, 1, { at: b + 8.0, dur: 0.5, ease: ease.pop });

  /* — beat 8 · the loop — */
  b = AT[7];
  tl.tween(c.allU, 0, { at: b + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_LOOP, { at: b + 0.9, dur: 1.4, ease: ease.move });
  tl.tween(c.ringU, 1, { at: b + 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(c.loopU, 1, { at: b + 1.6, dur: 6.6, ease: ease.linear });
  tl.hold(PLAN.end, 1.0);

  return { tl, cam, ...c };
}

const scene = buildScene();

/* --------------------------------------------------------- local helpers */
function T({ x, y, text, u = 1, size = 15, color = colors.TEXT, mono, weight, anchor }: { x: number; y: number; text: string; u?: number; size?: number; color?: string; mono?: boolean; weight?: number; anchor?: 'start' | 'middle' | 'end' }) {
  if (u <= 0.002) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={mono ? MONO : undefined} fontWeight={weight} textAnchor={anchor} opacity={clamp01(u)}>
      {text}
    </text>
  );
}

/** Outline around a page rectangle (stage coords) with a short tag beside it. */
function Mark({ r, u, color, tag, dashed, pad = 6, at = 'above' }: { r: Rect; u: number; color: string; tag: string; dashed?: boolean; pad?: number; at?: 'above' | 'below' | 'left' | 'right' }) {
  if (u <= 0.002) return null;
  const tx = at === 'left' ? r.x - pad - 8 : at === 'right' ? r.x + r.w + pad + 8 : r.x - pad + 2;
  const ty = at === 'above' ? r.y - pad - 6 : at === 'below' ? r.y + r.h + pad + 15 : r.y + r.h / 2 + 5;
  return (
    <g opacity={clamp01(u)}>
      <rect x={r.x - pad} y={r.y - pad} width={r.w + pad * 2} height={r.h + pad * 2} rx={9} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed ? '6 4' : undefined} />
      <T x={tx} y={ty} text={tag} size={13} color={color} mono anchor={at === 'left' ? 'end' : 'start'} />
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const g = (k: keyof Omit<typeof scene, 'tl' | 'cam'>) => s.get(scene[k]);
  const tempU = g('tempU');
  const tileU = g('tileU');
  const tetherU = g('tetherU');
  const cardU = g('cardU');
  const ev = g('ev');
  const locU = g('locU');
  const scanU = g('scanU');
  const chk = g('chk');
  const shU = g('shU');
  const scan2U = g('scan2U');
  const rebindU = g('rebindU');
  const chk2 = g('chk2');
  const clickU = g('clickU');
  const doneU = g('doneU');
  const postU = g('postU');
  const postChipU = g('postChipU');
  const allU = g('allU');
  const loopU = g('loopU');

  const sh = shU * (1 - doneU);
  const dy = SHIFT * sh;
  const stale = shU * (1 - rebindU); // the choice still points into obs v12
  const flick = Math.abs(rebindU * 2 - 1); // text swaps while dimmed
  const rebound = rebindU >= 0.5;
  const obsNow = doneU > 0.5 ? 'v14' : shU > 0.5 ? 'v13' : 'v12';
  const save0 = saveRect(0);
  const saveNow = saveRect(dy);
  const bannerSave = local(BANNER_SAVE);
  const body = clamp01(cardU * 2 - 1);
  const cardW = lerp(CARD.w0, CARD.w1, cardU);
  const cardH = lerp(CARD.h0, CARD.h1, cardU);

  // the tether ends on the position the choice is bound to, not where the control went
  const endY = lerp(save0.y, saveNow.y, rebindU) + save0.h / 2;
  const END: [number, number] = [save0.x + save0.w + 8, endY];
  const tetherColor = staleTint(stale);
  const y1 = scanY(scanU);
  const y2 = scanY(scan2U);
  const match1 = clamp01((y1 - save0.y) / 8) * (1 - shU);
  const ambB = clamp01((y2 - bannerSave.y) / 8) * (1 - rebindU);
  const ambS = clamp01((y2 - saveNow.y) / 8) * (1 - rebindU);

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={allU}>
        <ProposedTag x={40} y={40} u={1} text="PROPOSED · checked execution" />

        {/* THE LIVING PAGE — chrome stays put, the body can be pushed down by a rerender */}
        <ProfilePage place={P} typeU={1} obsLabel={`observation ${obsNow}`} />
        <rect x={P.x + 8} y={BODY_TOP + 2} width={PAGE.w * S - 16} height={(PAGE.h - 84) * S - 10} fill="#0f172a" />
        <clipPath id="dba2-body">
          <rect x={P.x} y={BODY_TOP + dy} width={PAGE.w * S} height={(PAGE.h - 84) * S - dy - 2} />
        </clipPath>
        <g clipPath="url(#dba2-body)">
          <ProfilePage place={{ ...P, y: P.y + dy }} typeU={1} savedU={postU} />
        </g>
        {sh > 0.002 && (
          <g transform={`translate(${P.x} ${P.y}) scale(${S})`} opacity={clamp01(sh * 2 - 1)}>
            <rect x={32} y={90} width={496} height={32} rx={8} fill="#1a1405" stroke={ROLE.PENDING} strokeWidth={1.2} />
            <text x={46} y={111} fill={ROLE.PENDING} fontSize={13}>
              ! Unsaved changes
            </text>
            <rect x={BANNER_SAVE.x} y={BANNER_SAVE.y} width={BANNER_SAVE.w} height={BANNER_SAVE.h} rx={6} fill="#0369a1" stroke={ROLE.OBSERVE} />
            <text x={BANNER_SAVE.x + BANNER_SAVE.w / 2} y={BANNER_SAVE.y + 16} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontWeight={650}>
              Save
            </text>
          </g>
        )}
        <T x={P.x + PAGE.w * S} y={PAGE_BOTTOM + 24} anchor="end" text="page rerendered · the target moved" u={stale * (1 - g('backU'))} size={15} color={ROLE.INVALID} />

        {/* beat 1 — the tempting shortcut: model text fired straight at the page */}
        {tempU > 0.002 && (
          <g opacity={tempU}>
            <rect x={TEMPT.x} y={TEMPT.y} width={TEMPT.w} height={TEMPT.h} rx={10} fill="#1a1333" stroke={ROLE.MODEL} strokeWidth={1.5} />
            <T x={TEMPT.x + 18} y={TEMPT.y + 30} text="TEMPTING · the model writes a selector" size={15} color={ROLE.MODEL} weight={650} />
            <T x={TEMPT.x + 18} y={TEMPT.y + 58} text="page.click('div:nth-child(3) > button')" size={16} mono />
            <path d={link([TEMPT.x, TEMPT.y + 40], [save0.x + save0.w + 8, save0.y + save0.h / 2])} fill="none" stroke={ROLE.INVALID} strokeWidth={2.4} pathLength={1} strokeDasharray={`${g('tempPathU')} 1`} />
            <Chip x={TEMPT.x} y={TEMPT.y + 96} text="✕ executed with no check in between" color={ROLE.INVALID} fill="#2a0c14" size={15} u={g('tempXU')} />
          </g>
        )}

        {/* the tether: the choice's reference into one observation */}
        {tetherU > 0.002 && (
          <g>
            <path d={link(SRC, END)} fill="none" stroke={tetherColor} strokeWidth={2.4} pathLength={tetherU < 0.998 ? 1 : undefined} strokeDasharray={tetherU < 0.998 ? `${tetherU} 1` : stale > 0.5 ? '7 5' : undefined} />
            <circle cx={END[0]} cy={END[1]} r={4.5} fill={tetherColor} opacity={clamp01(tetherU * 4 - 3)} />
          </g>
        )}
        <Mark r={save0} u={g('markU') * (1 - shU) * (1 - match1)} color={ROLE.OBSERVE} tag="c9 @ obs v12" />
        <Mark r={save0} u={match1} color={ROLE.CHECKED} tag="✓ 1 match" at="below" pad={8} />
        <Mark r={save0} u={stale} color={ROLE.INVALID} tag="" dashed pad={3} />
        <T x={save0.x + save0.w + 16} y={saveNow.y + save0.h / 2 + 5} text="◂ v12 position is stale" u={stale * (1 - clamp01(scan2U * 4))} size={14} color={ROLE.INVALID} mono />
        <Mark r={bannerSave} u={ambB} color={ROLE.PENDING} tag="match 1 ?" dashed at="left" />
        <Mark r={saveNow} u={ambS} color={ROLE.PENDING} tag="match 2 ?" dashed at="right" pad={8} />
        {ambB > 0.002 && <path d={link(SRC, [bannerSave.x + bannerSave.w + 8, bannerSave.y + bannerSave.h / 2])} fill="none" stroke={ROLE.PENDING} strokeWidth={2} strokeDasharray="5 5" opacity={ambB} />}
        <Mark r={saveNow} u={rebindU * (1 - clamp01(clickU * 3))} color={ROLE.CHECKED} tag="c4 @ obs v13 · 1 match" at="below" pad={8} />
        <Mark r={local(TOAST)} u={postChipU} color={ROLE.CHECKED} tag="✓ observed" at="right" pad={5} />

        {/* the locator sweep over the live page */}
        {[{ u: scanU, y: y1 }, { u: scan2U, y: y2 }].map((sc, k) =>
          sc.u > 0.002 && sc.u < 0.998 ? (
            <g key={k}>
              <line x1={P.x + 4} x2={P.x + PAGE.w * S - 4} y1={sc.y} y2={sc.y} stroke={ROLE.OBSERVE} strokeWidth={2} />
              <rect x={P.x + 4} y={sc.y - 16} width={PAGE.w * S - 8} height={16} fill={ROLE.OBSERVE} opacity={0.08} />
            </g>
          ) : null,
        )}

        {/* evidence packets ride the tether from the live target to the card */}
        {range(3).map((k) => {
          const p = ev - k;
          if (p <= 0.002 || p >= 0.75) return null;
          const [px, py] = onLink(SRC, END, 1 - clamp01(p / 0.7));
          return (
            <g key={k}>
              <circle cx={px} cy={py} r={9} fill="#082f49" stroke={ROLE.OBSERVE} strokeWidth={2} />
              <circle cx={px} cy={py} r={3} fill={ROLE.OBSERVE} />
            </g>
          );
        })}
        <Activation x={saveNow.x + saveNow.w / 2} y={saveNow.y + saveNow.h / 2} u={clickU} label="click" />

        {/* THE PERSISTENT OBJECT: candidate tile → locator recipe card */}
        {tileU > 0.002 && (
          <g opacity={tileU}>
            <rect x={CARD.x} y={CARD.y} width={cardW} height={cardH} rx={12} fill="#0b1324" stroke="#31405f" strokeWidth={1.5} />
            <path d={corners(CARD.x - 5, CARD.y - 5, cardW + 10, CARD.h0 + 10)} fill="none" stroke={ROLE.MODEL} strokeWidth={2.4} opacity={1 - 0.6 * cardU} />
            <g opacity={flick}>
              <T x={CX} y={CARD.y + 29} text={`${rebound ? 'c4' : 'c9'} · click + save-button`} size={19} mono weight={700} />
              <Chip x={CARD.x + cardW - 100} y={CARD.y + 10} text={rebound ? 'obs v13' : 'obs v12'} color={ROLE.OBSERVE} fill="#082f49" size={13} u={1} />
            </g>
            <T x={CX} y={CARD.y + 52} text={rebound ? 'a NEW temporary ID · the old one is not reused' : 'temporary ID · target + action chosen jointly'} size={14} color={colors.MUTED} u={flick} />
            <T x={CX} y={CARD.y + 100} text="▾ the last step is separate: code, then checks" u={g('splitU')} size={16} color={ROLE.PENDING} />

            {body > 0.002 && (
              <g opacity={body}>
                <line x1={CX} x2={CARD.x + cardW - 20} y1={CARD.y + CARD.h0 + 4} y2={CARD.y + CARD.h0 + 4} stroke="#31405f" strokeDasharray="4 4" />
                <T x={CX} y={190} text="EVIDENCE · read by code from the live target" size={14} color={colors.MUTED} mono />
                {EVIDENCE.map((e, k) => {
                  const u = clamp01((ev - k) * 4 - 2.8);
                  if (u <= 0.002) return null;
                  const used = k === 2 ? rebindU : 1 - 0.55 * rebindU;
                  const color = k === 2 ? (rebound ? ROLE.CHECKED : ROLE.PENDING) : ROLE.OBSERVE;
                  return (
                    <g key={e.key} opacity={u * (k === 2 ? 1 : used)}>
                      <rect x={CX} y={200 + k * 32} width={560} height={26} rx={6} fill="#0f1a30" stroke={color} strokeWidth={1.2} strokeDasharray={k === 2 && !rebound ? '5 4' : undefined} />
                      <T x={CX + 12} y={218 + k * 32} text={e.key} size={14} color={color} mono />
                      <T x={CX + 110} y={218 + k * 32} text={e.value} size={15} mono />
                      <T x={CX + 548} y={218 + k * 32} anchor="end" text={k === 2 && rebound ? 'used · exposed here' : e.note} size={13} color={colors.MUTED} />
                    </g>
                  );
                })}

                <T x={CX} y={318} text="LOCATOR · built by code, not written by the model" u={clamp01(locU * 8)} size={14} color={colors.MUTED} mono />
                <T x={CX + 560} y={318} anchor="end" text="illustrative" u={clamp01(locU * 8)} size={13} color={ROLE.PENDING} mono />
                <g opacity={clamp01(locU * 8) * flick}>
                  <rect x={CX} y={328} width={560} height={36} rx={7} fill="#020617" stroke={rebound ? ROLE.CHECKED : ROLE.OBSERVE} strokeWidth={1.3} />
                  <T x={CX + 14} y={352} text={rebound ? LOC2 : LOC1.slice(0, Math.ceil(locU * LOC1.length - 1e-6))} size={17} mono />
                </g>

                <T x={CX} y={392} text="CHECK · just before acting" u={g('chkShowU')} size={14} color={colors.MUTED} mono />
                {CHECKS.map((cdef, k) => {
                  const pass = Math.max(clamp01(chk - k) * (1 - shU), clamp01(chk2 - k));
                  const bad = k === 0 ? Math.min(ambB, ambS) : 0;
                  return (
                    <g key={k}>
                      <Chip x={cdef.x} y={402} text={cdef.ask} color={ROLE.PENDING} dashed size={14} u={g('chkShowU') * (1 - pass) * (1 - bad)} />
                      <Chip x={cdef.x} y={402} text={cdef.ok} color={ROLE.CHECKED} fill="#062a1e" size={14} u={pass} />
                      {k === 0 && <Chip x={cdef.x} y={402} text={cdef.bad} color={ROLE.INVALID} fill="#2a0c14" size={14} u={bad} />}
                    </g>
                  );
                })}

                {/* the stale-version gate */}
                <T x={CX} y={456} text="GATE · does the choice still match the page?" u={g('gateU')} size={14} color={colors.MUTED} mono />
                <Chip x={CX} y={466} text="chosen @ v12 ≠ page @ v13" color={ROLE.INVALID} fill="#2a0c14" size={14} u={g('gateU') * (1 - rebindU)} />
                <Chip x={CX} y={466} text="chosen @ v13 = page @ v13" color={ROLE.CHECKED} fill="#062a1e" size={14} u={clamp01(rebindU * 2 - 1) * (1 - clamp01(doneU * 3))} />
                <Chip x={CX + 270} y={466} text="✕ STALE → observe again" color={ROLE.INVALID} fill="#2a0c14" size={14} u={g('verdictU') * (1 - rebindU)} />
                <Chip x={CX + 270} y={466} text="✓ DISPATCH one action" color={ROLE.CHECKED} fill="#062a1e" size={14} u={g('goU')} />
                <Chip x={CX} y={500} text="✕ AMBIGUOUS → or abstain · never a guessed click" color={ROLE.INVALID} fill="#2a0c14" size={14} u={g('ambLineU') * (1 - rebindU)} />
                <Chip x={CX} y={500} text="◌ click() returned · weaker evidence" color={ROLE.PENDING} dashed size={14} u={g('retU') * (1 - postChipU)} />
                <Chip x={CX} y={500} text="✓ postcondition observed on the page @ v14" color={ROLE.CHECKED} fill="#062a1e" size={14} u={postChipU} />
              </g>
            )}
          </g>
        )}

        {/* the gate sends the choice back to observation */}
        {g('backU') > 0.002 && (
          <g opacity={1 - rebindU}>
            <path d="M636 478C598 478 604 340 604 236S606 92 570 90" fill="none" stroke={ROLE.PENDING} strokeWidth={2.4} pathLength={1} strokeDasharray={`${g('backU')} 1`} />
            <path d="M564 90l13 -7v14z" fill={ROLE.PENDING} opacity={clamp01(g('backU') * 8 - 7)} />
          </g>
        )}
      </g>

      {/* beat 8 — the unit of progress, on a cleared stage */}
      {g('ringU') > 0.002 && (
        <g opacity={g('ringU')}>
          <ProposedTag x={LOOP.x - 95} y={84} u={1} text="PROPOSED · one loop turn" />
          {STAGES.map((st, k) => {
            const lit = clamp01(loopU * STAGES.length - k + 0.15);
            const a = k * STEP;
            const lx = LOOP.x + LOOP.rl * Math.sin(a);
            const ly = LOOP.y - LOOP.rl * Math.cos(a) + 6;
            return (
              <g key={st.text}>
                <path transform={`translate(${LOOP.x} ${LOOP.y})`} d={ringArc({ innerRadius: LOOP.r0, outerRadius: LOOP.r1, startAngle: a - STEP / 2, endAngle: a + STEP / 2, padAngle: 0.05 }) ?? ''} fill={st.color} opacity={0.18 + 0.82 * lit} />
                <T x={lx} y={ly} anchor={k === 0 ? 'middle' : k < 3 ? 'start' : 'end'} text={st.text} size={20} color={st.color} weight={650} u={0.35 + 0.65 * lit} />
              </g>
            );
          })}
          {/* the chosen tile rides the loop once */}
          <g transform={`translate(${LOOP.x + 120 * Math.sin(loopU * Math.PI * 2)} ${LOOP.y - 120 * Math.cos(loopU * Math.PI * 2)})`}>
            <rect x={-17} y={-11} width={34} height={22} rx={5} fill="#0b1324" stroke="#f1f5f9" strokeWidth={2} />
            <path d={corners(-22, -16, 44, 32, 7)} fill="none" stroke={ROLE.MODEL} strokeWidth={2} />
          </g>
          <T x={LOOP.x} y={LOOP.y - 2} anchor="middle" text="one checked action" size={20} weight={700} />
          <T x={LOOP.x} y={LOOP.y + 24} anchor="middle" text="per turn" size={16} color={colors.MUTED} />
          <T x={LOOP.x} y={498} anchor="middle" text="then decide again — from the new observation" u={clamp01(loopU * 5 - 4)} size={18} />
        </g>
      )}
    </Camera>
  );
}

export const vizScene = () => scene;
