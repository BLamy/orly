// Chapter 5 — The Diagnostic That Crashed
//
// ONE persistent object: a v8::Local handle that needs a HandleScope tray
// beneath it. Grounded in PR #1385 (S4) + v8 PR #294: the new id= logging
// crashed CI during SaveExamples because Eternal/Persistent::Get materialized
// a v8::Local with no HandleScope; fixed by opening scopes in
// V8RecordReplayGetDefaultContextAddress (api.cc), resetContextGroup and
// discardInspectedContext (v8-inspector-impl.cc). Ends with the case recap
// and the PR's open TODO: who wrote SlotContext ctx=1018006fffd1.
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CI = { x: 120, y: 110, w: 300, h: 74 };
const GETTER = { x: 520, y: 130, w: 500, h: 54 };
const HANDLE = { x: 745, y: 240, size: 34 }; // where the Local materializes
const TRAY = { x: 660, y: 340, w: 210, h: 16 };
const SITES = { x: 120, y: 300, w: 330, rowH: 56 };
const RECAP = { y: 250, xs: [180, 480, 780, 1080], w: 250, h: 150 };
const NOTE = { x: 290, y: 450, w: 700, h: 150 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_MACHINE: CameraState = { x: 700, y: 260, k: 1.14 };
const CAM_SITES: CameraState = { x: 460, y: 300, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 380, k: 0.94 };

const SITE_ROWS = [
  'V8RecordReplayGetDefaultContextAddress',
  'V8InspectorImpl::resetContextGroup',
  'V8InspectorImpl::discardInspectedContext',
];

const RECAP_CARDS = [
  { title: 'the read', code: 'mov 0x93(%r15), %ecx', sub: 'a dead context, one field load' },
  { title: 'the checks', code: '✓ ✓ ✓ ✓ — then SIGSEGV', sub: 'plausible is not alive' },
  { title: 'the proof', code: 'ctx + 0x93 = faultAddress', sub: 'the slot context, identified' },
  { title: 'the trap', code: 'iso=.. ctx=.. id=..', sub: 'every context gets a name' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const ciU = tl.channel('ciU', 0); // CI badge enters
  const ciState = tl.channel('ciState', -1); // -1 red … 1 green
  const getterU = tl.channel('getterU', 0); // Eternal::Get chip
  const handU = tl.channel('handU', 0); // handle materializes (take 1)
  const fallU = tl.channel('fallU', 0); // …and falls: no scope beneath
  const trayU = tl.channel('trayU', 0); // the HandleScope tray slides in
  const hand2U = tl.channel('hand2U', 0); // handle take 2
  const landU = tl.channel('landU', 0); // lands safely on the tray
  const siteN = tl.channel('siteN', 0); // the three fixed call sites
  const machineOffU = tl.channel('machineOffU', 0); // fade machine for recap
  const recapN = tl.channel('recapN', 0); // recap cards, fractional
  const hlRecap = tl.channel('hlRecap', -1); // which recap card is spotlit
  const noteU = tl.channel('noteU', 0);

  /* — beat 1 · the new logging crashes CI — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'The new logging shipped — and promptly crashed. Not in the wild this time, but in continuous integration, while the pipeline was saving example recordings.',
  });
  tl.tween(cam, CAM_MACHINE, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(ciU, 1, { at: t - 5.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 2 · handles need a tray — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'The culprit was the diagnostic itself. In V8, borrowing an object as a local handle requires an open handle scope — a tray that owns every handle you create.',
  });
  tl.tween(getterU, 1, { at: t - 6.0, dur: 0.7, ease: ease.enter });
  tl.tween(handU, 1, { at: t - 3.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 3 · no tray, the handle falls — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The default context getter asked for a handle with no tray underneath. The handle had nowhere to live, and the process went down.',
  });
  tl.tween(fallU, 1, { at: t - 4.2, dur: 1.1, ease: ease.move });
  tl.tween(ciState, -1, { at: t - 3.0, dur: 0.4 });
  t = tl.hold(t, 0.5);

  /* — beat 4 · one line, three places — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The fix is one line, in three places: open a scope first, then take the handle.',
  });
  tl.tween(cam, CAM_SITES, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(trayU, 1, { at: t - 5.0, dur: 0.8, ease: ease.move });
  tl.tween(siteN, 3, { at: t - 4.0, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 5 · lands safely, CI green — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'With the trays in place, the same reads land safely, and the pipeline goes green again.',
  });
  tl.tween(hand2U, 1, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(landU, 1, { at: t - 4.2, dur: 0.9, ease: ease.move });
  tl.tween(ciState, 1, { at: t - 2.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 6 · step back — */
  t = tl.caption({
    at: t,
    dur: 4.6,
    text: 'Step back and look at the whole case.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 4.2, dur: 1.6, ease: ease.move });
  tl.tween(machineOffU, 1, { at: t - 3.8, dur: 1.0, ease: ease.move });
  tl.tween(recapN, 1, { at: t - 2.2, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 7 · recap: the read and the checks — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'A read a hundred and forty seven bytes into a dead context killed the pause child. Four checks had waved it through, because plausible is not the same as alive.',
  });
  tl.tween(hlRecap, 0, { at: t - 6.2, dur: 0.3 });
  tl.tween(recapN, 2, { at: t - 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(hlRecap, 1, { at: t - 3.4, dur: 0.3 });
  t = tl.hold(t, 0.4);

  /* — beat 8 · recap: the proof — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The operator log plus simple addition identified the victim — the slot context parked by evaluate in global.',
  });
  tl.tween(recapN, 3, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(hlRecap, 2, { at: t - 4.6, dur: 0.3 });
  t = tl.hold(t, 0.4);

  /* — beat 9 · recap: the trap — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'And the fix is a stamp: every context logged with an address, and where it is safe, a name — so the next crash arrives with its confession already written.',
  });
  tl.tween(recapN, 4, { at: t - 5.8, dur: 0.6, ease: ease.enter });
  tl.tween(hlRecap, 3, { at: t - 5.4, dur: 0.3 });
  t = tl.hold(t, 0.5);

  /* — beat 10 · the open mystery — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'One mystery stays open: who wrote that dead slot context in the first place. The trap is armed — crash twenty will not stay anonymous twice.',
  });
  tl.tween(hlRecap, -1, { at: t - 6.2, dur: 0.3 });
  tl.tween(noteU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return {
    tl, cam, ciU, ciState, getterU, handU, fallU, trayU, hand2U, landU,
    siteN, machineOffU, recapN, hlRecap, noteU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** CI status — SaveExamples, red then green. */
function CiBadge({ u, state, off }: { u: number; state: number; off: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - clamp01(off));
  if (a <= 0) return null;
  const green = clamp01(state);
  const red = clamp01(-state);
  const c = green > 0.5 ? colors.POSITIVE : red > 0.5 ? colors.NEGATIVE : colors.MUTED;
  const { x, y, w, h } = CI;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={a}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={c} strokeWidth={2} />
      <circle cx={26} cy={h / 2} r={8} fill={c} />
      <text x={46} y={30} fill={colors.TEXT} fontSize={13.5} fontWeight={700} fontFamily={mono}>
        CI — SaveExamples
      </text>
      <text x={46} y={52} fill={c} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        {green > 0.5 ? 'passing' : red > 0.5 ? 'crashed' : 'running…'}
      </text>
    </g>
  );
}

/** The getter, the handle it materializes, and the tray it needs. */
function HandleMachine({
  getter, hand, fall, tray, hand2, land, off,
}: { getter: number; hand: number; fall: number; tray: number; hand2: number; land: number; off: number }) {
  const a = 1 - clamp01(off);
  if (a <= 0) return null;
  const g = clamp01(getter);
  const h1 = clamp01(hand);
  const f = clamp01(fall);
  const tr = clamp01(tray);
  const h2 = clamp01(hand2);
  const ld = clamp01(land);
  const { size } = HANDLE;
  // take 1: materializes, then falls past the missing tray and fades
  const y1 = HANDLE.y + f * 220;
  const o1 = h1 * (1 - f * 0.9) * (h2 > 0.01 ? 0 : 1);
  // take 2: materializes, then descends and LANDS on the tray
  const y2 = HANDLE.y + ld * (TRAY.y - size - 2 - HANDLE.y);
  return (
    <g opacity={a}>
      {g > 0 && (
        <g transform={`translate(${GETTER.x}, ${GETTER.y + (1 - g) * 10})`} opacity={g}>
          <rect width={GETTER.w} height={GETTER.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={18} y={23} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
            the default-context getter
          </text>
          <text x={18} y={42} fill={colors.TEXT} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            {'v8::Local<Context> cx = gDefaultContext->Get(isolate)'}
          </text>
        </g>
      )}
      {/* the missing / present tray */}
      {tr > 0 ? (
        <g opacity={tr}>
          <rect x={TRAY.x + (1 - tr) * 60} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={8} fill={colors.POSITIVE} opacity={0.25} />
          <rect x={TRAY.x + (1 - tr) * 60} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={TRAY.x + TRAY.w / 2} y={TRAY.y + 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            v8::HandleScope scope(isolate);
          </text>
        </g>
      ) : (
        h1 > 0.3 && (
          <g opacity={h1}>
            <line x1={TRAY.x} y1={TRAY.y + 8} x2={TRAY.x + TRAY.w} y2={TRAY.y + 8} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.6} />
            <text x={TRAY.x + TRAY.w / 2} y={TRAY.y + 34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono}>
              no HandleScope here
            </text>
          </g>
        )
      )}
      {/* handle, take 1 — falls */}
      {o1 > 0 && (
        <g transform={`translate(${HANDLE.x}, ${y1})`} opacity={o1}>
          <rect width={size} height={size} rx={7} fill={f > 0.4 ? colors.NEGATIVE : colors.ACCENT} opacity={0.9} />
          <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={700} fontFamily={mono}>
            cx
          </text>
        </g>
      )}
      {f > 0.7 && h2 < 0.01 && (
        <text x={HANDLE.x + size / 2} y={HANDLE.y + 270} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={700} fontFamily={mono} opacity={(f - 0.7) / 0.3}>
          ✗ crash — nowhere to live
        </text>
      )}
      {/* handle, take 2 — lands on the tray */}
      {h2 > 0 && (
        <g transform={`translate(${HANDLE.x}, ${y2})`} opacity={h2}>
          <rect width={size} height={size} rx={7} fill={ld > 0.9 ? colors.POSITIVE : colors.ACCENT} opacity={0.95} />
          <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={700} fontFamily={mono}>
            cx
          </text>
        </g>
      )}
    </g>
  );
}

/** The three call sites that gained a scope. */
function FixedSites({ n, off }: { n: number; off: number }) {
  const a = 1 - clamp01(off);
  if (a <= 0 || n <= 0) return null;
  const { x, y, w, rowH } = SITES;
  return (
    <g opacity={a}>
      <text x={x} y={y - 12} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={clamp01(n)}>
        scopes added — 3 call sites
      </text>
      {SITE_ROWS.map((row, i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        return (
          <g key={i} transform={`translate(${x}, ${y + i * rowH + (1 - u) * 8})`} opacity={u}>
            <rect width={w} height={rowH - 12} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={14} y={19} fill={colors.POSITIVE} fontSize={11} fontWeight={700} fontFamily={mono}>
              + HandleScope
            </text>
            <text x={14} y={35} fill={colors.TEXT} fontSize={10.5} fontFamily={mono}>
              {row}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The case, re-traced — four cards. */
function RecapStrip({ n, hl }: { n: number; hl: number }) {
  if (n <= 0) return null;
  const { y, xs, w, h } = RECAP;
  return (
    <g>
      {RECAP_CARDS.map((card, i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        const lit = Math.abs(hl - i) < 0.5 ? 1 : 0;
        const x = xs[i] - w / 2;
        const tone = i === 0 || i === 1 ? colors.NEGATIVE : i === 2 ? colors.WARM : colors.POSITIVE;
        return (
          <g key={i} transform={`translate(${x}, ${y + (1 - u) * 12})`} opacity={u * (hl >= -0.5 && !lit ? 0.35 : 1)}>
            <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={lit ? tone : colors.GRID} strokeWidth={lit ? 2 : 1.5} />
            <text x={w / 2} y={34} textAnchor="middle" fill={colors.TEXT} fontSize={14.5} fontWeight={700}>
              {card.title}
            </text>
            <text x={w / 2} y={72} textAnchor="middle" fill={tone} fontSize={12.5} fontWeight={700} fontFamily={mono}>
              {card.code}
            </text>
            <text x={w / 2} y={108} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              {card.sub}
            </text>
            {i < 3 && u > 0.9 && clamp01(n - i - 1) > 0 && (
              <text x={w + 22} y={h / 2 + 5} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
                →
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Closing card — the open TODO, on an opaque backdrop. */
function ClosingNote({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = NOTE;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={w} height={h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
      <text x={w / 2} y={46} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={700}>
        Still open: who wrote SlotContext ctx=1018006fffd1?
      </text>
      <text x={w / 2} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
        The next crash will answer with an address — and a name.
      </text>
      <text x={w / 2} y={116} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontWeight={700} fontFamily={mono}>
        replayio/chromium #1385 · replayio/chromium-v8 #294
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const off = clamp01(s.get(scene.machineOffU));
  return (
    <>
      <CiBadge u={s.get(scene.ciU)} state={s.get(scene.ciState)} off={off} />
      <HandleMachine
        getter={s.get(scene.getterU)}
        hand={s.get(scene.handU)}
        fall={s.get(scene.fallU)}
        tray={s.get(scene.trayU)}
        hand2={s.get(scene.hand2U)}
        land={s.get(scene.landU)}
        off={off}
      />
      <FixedSites n={s.get(scene.siteN)} off={off} />
      <RecapStrip n={s.get(scene.recapN)} hl={s.get(scene.hlRecap)} />
      <ClosingNote u={s.get(scene.noteU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
