// Book scene — replay-qa, chapter 2: "Every Run Is a Recording".
//
// ONE persistent object: the tape. The agent drives the Acme store's cart
// journey in a real browser (top of frame), and every observable — rrweb DOM
// events, network requests, interactions, exceptions — falls out of the
// browser as a particle and lands on a RecordingStrip that grows in lockstep
// with the run. The camera starts pushed into the browser, drops down to ride
// the tape as it grows, and pulls wide for the payoff: the browser dies, the
// tape stays.
//
// Grounded in replayio/loop-qa: AppSpec.md ("Each run produces a Replay
// recording capturing the full browser session"; test_runs carry
// replay_recording_id) and scripts/seed-db.ts (proj-acme-store, run-001
// completed in 240s with recording b5f2a3c1-7d4e-…, journey-acme-cart,
// bug-002 repro steps "Add item to cart / Go to checkout / Fill payment
// details / Click Submit Payment", rrweb events seeded per task).
import { CAMERA_HOME, Camera, Timeline, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';
import { RecordingStrip, POINT_COLOR } from '../../agent';
import type { RecordingPoint, RecordingPointKind } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage 1280×720; the bottom ~12% (y ≳ 630) stays clear for captions. */
const BROWSER = { x: 100, y: 84, w: 520, h: 306 };
const JOURNEY = { x: 680, y: 148, w: 300 };
const TAPE = { x: 100, y: 540, w: 1080, h: 24 };
const LEGEND = { x: 100, y: 478 };
const RUN_CARD = { x: 820, y: 388, w: 360, h: 104 };

const CAM_BROWSER: CameraState = { x: 430, y: 262, k: 1.26 };
const CAM_TAPE: CameraState = { x: 640, y: 432, k: 1.12 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.98 };

/* ------------------------------------------------------------------ data */
/** bug-002's real reproduction steps (scripts/seed-db.ts). */
const STEPS = ['Add item to cart', 'Go to checkout', 'Fill payment details', 'Click Submit Payment'];

/**
 * The run's event stream. Each event is emitted from the browser at `emit`
 * (0..1 of run progress), belongs to a signal family, and lands at `at`
 * (0..1 along the tape). Precomputed, seeded, module scope.
 */
interface RunEvent {
  emit: number;
  kind: RecordingPointKind;
  at: number;
  fx: number; // emission point inside the browser panel
  fy: number;
  label?: string;
}
const rand = mulberry32(7);
const EVENTS: RunEvent[] = (() => {
  const spec: [number, RecordingPointKind, string?][] = [
    // navigation burst: full DOM snapshot + assets
    [0.02, 'render', 'load'],
    [0.05, 'network'],
    [0.08, 'render'],
    [0.11, 'render'],
    // browsing + add to cart
    [0.16, 'interaction'],
    [0.2, 'render'],
    [0.24, 'network'],
    [0.27, 'render'],
    [0.31, 'interaction', 'add to cart'],
    [0.34, 'network'],
    [0.37, 'render'],
    // checkout page
    [0.43, 'interaction', 'checkout'],
    [0.47, 'network'],
    [0.5, 'render'],
    [0.53, 'render'],
    // filling the payment form: keystrokes
    [0.58, 'interaction'],
    [0.61, 'interaction'],
    [0.64, 'interaction'],
    [0.67, 'render'],
    [0.71, 'interaction'],
    // submit → POST → 500
    [0.82, 'interaction', 'submit'],
    [0.87, 'network', 'POST'],
    [0.93, 'exception', '500'],
  ];
  return spec.map(([emit, kind, label]) => ({
    emit,
    kind,
    label,
    at: 0.03 + emit * 0.93,
    fx: BROWSER.x + 60 + rand() * (BROWSER.w - 120),
    fy: BROWSER.y + 80 + rand() * (BROWSER.h - 140),
  }));
})();

/** The same events as tape markers (labels only where the story needs them). */
const POINTS: RecordingPoint[] = EVENTS.map((e) => ({ at: e.at, kind: e.kind, label: e.label }));

const LEGEND_ROWS: { kind: RecordingPointKind; label: string }[] = [
  { kind: 'render', label: 'rrweb DOM events' },
  { kind: 'network', label: 'network requests' },
  { kind: 'interaction', label: 'clicks & keystrokes' },
  { kind: 'exception', label: 'exceptions' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const journeyE = tl.channel('journeyCard', 0);
  const browserE = tl.channel('browserE', 0);
  const runP = tl.channel('runP', 0); // THE clock of the run: browser + particles + tape
  const stepsU = tl.channel('stepsU', 0); // 0..4 journey checkmarks
  const legendU = tl.channel('legendU', 0);
  const failU = tl.channel('fail500', 0);
  const runCardU = tl.channel('runCard', 0);
  const dimU = tl.channel('dimU', 0); // browser fades; the tape survives

  /* — beat 1 · the journey — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'A test run starts with a journey — a scripted intention. This one belongs to the Acme store: add an item to the cart, check out, and pay.',
  });
  tl.tween(journeyE, 1, { at: t - 5.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 2 · a real browser — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The agent opens a real browser against the project’s target URL. Not a model of the app — the app.',
  });
  tl.tween(browserE, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BROWSER, { at: t - 4.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 3 · the recorder is rolling — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'And from the very first navigation, a recorder is rolling underneath it. Watch the bottom of the screen.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 3.6, dur: 1.6, ease: ease.move });
  tl.tween(runP, 0.14, { at: t - 4.6, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · rrweb — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Every change the page makes to itself is captured as an rrweb event — enough to rebuild any frame of the screen later, pixel for pixel.',
  });
  tl.tween(legendU, 1, { at: t - 5.6, dur: 1.0, ease: ease.enter });
  tl.tween(runP, 0.3, { at: t - 5.6, dur: 5.2, ease: ease.linear });
  tl.tween(stepsU, 1, { at: t - 2.4, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 5 · network — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Every network request goes on the tape too — what was sent, what came back, and exactly when. Nothing depends on anyone remembering it.',
  });
  tl.tween(runP, 0.52, { at: t - 5.4, dur: 5.4, ease: ease.linear });
  tl.tween(stepsU, 2, { at: t - 1.6, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the journey advances — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The agent moves through checkout and types in a card number. Every action lands twice: once in the app, once on the tape.',
  });
  tl.tween(runP, 0.76, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  tl.tween(stepsU, 3, { at: t - 1.4, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 7 · submit → 500 — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Step four: submit payment. The request goes out — and comes back a five hundred. The order never happened.',
  });
  tl.tween(runP, 1, { at: t - 5.4, dur: 4.2, ease: ease.linear });
  tl.tween(stepsU, 4, { at: t - 4.4, dur: 0.6, ease: ease.move });
  tl.tween(failU, 1, { at: t - 2.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 8 · the tape caught it either way — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Here is the part that matters: the agent did not have to notice. The failure is on the tape whether anyone was watching or not.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 9 · the run files itself — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The run finishes and files itself: test run one, completed, four minutes — with a recording ID that names the whole session.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.4, dur: 1.8, ease: ease.move });
  tl.tween(runCardU, 1, { at: t - 3.8, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 10 · close: the tape survives — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The browser closes, and the container will be retired. The tape is the only witness that survives — and next, the agent sits down to read it.',
  });
  tl.tween(dimU, 1, { at: t - 5.2, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.2);

  return { tl, cam, journeyE, browserE, runP, stepsU, legendU, failU, runCardU, dimU };
}

const scene = buildScene();

/* -------------------------------------------- per-frame particle compute */
/** Each event's flight from browser to tape lasts this much run progress. */
const FLIGHT = 0.07;

const PTS: ParticlePoint[] = EVENTS.map(() => ({ x: 0, y: 0, r: 3, alpha: 0, color: colors.MUTED }));
const OUT: ParticlePoint[] = [];

function computeParticles(s: SceneState): ParticlePoint[] {
  const p = s.get(scene.runP);
  OUT.length = 0;
  if (p <= 0) return OUT;
  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const u = (p - e.emit) / FLIGHT;
    if (u <= 0 || u >= 1) continue; // in flight only; the strip marker takes over
    const uu = ease.move(clamp01(u));
    const tx = TAPE.x + e.at * TAPE.w;
    const ty = TAPE.y + TAPE.h / 2;
    // quadratic arc: browser point → bulge → tape slot
    const mx = (e.fx + tx) / 2 + 40;
    const my = Math.min(e.fy, ty) - 60;
    const a = 1 - uu;
    const pt = PTS[i];
    pt.x = a * a * e.fx + 2 * a * uu * mx + uu * uu * tx;
    pt.y = a * a * e.fy + 2 * a * uu * my + uu * uu * ty;
    pt.r = e.kind === 'exception' ? 4.5 : 3;
    pt.color = POINT_COLOR[e.kind];
    pt.alpha = Math.min(1, u * 6);
    OUT.push(pt);
  }
  return OUT;
}

/* -------------------------------------------------- local subcomponents */

/** The Acme store, driven live — content phases keyed to run progress. */
function AcmeBrowser({ enter, runP, fail, dim }: { enter: number; runP: number; fail: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { w, h } = BROWSER;
  const cartIn = clamp01((runP - 0.28) * 12);
  const checkoutIn = clamp01((runP - 0.42) * 12);
  const cardIn = clamp01((runP - 0.6) * 10);
  const f = clamp01(fail);
  return (
    <g transform={`translate(${BROWSER.x}, ${BROWSER.y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={14} y={12} width={w - 28} height={28} rx={14} fill={colors.BG} opacity={0.6} />
      <circle cx={30} cy={26} r={4} fill={colors.NEGATIVE} opacity={0.9} />
      <text x={44} y={31} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        acme-store.example.com{checkoutIn > 0.5 ? '/checkout' : '/products'}
      </text>
      <text x={22} y={74} fill={colors.TEXT} fontSize={16} fontWeight={700}>
        {checkoutIn > 0.5 ? 'Checkout' : 'Products'}
      </text>
      <g opacity={cartIn}>
        <text x={22} y={106} fill={colors.MUTED} fontSize={13.5}>
          1 × Laptop
        </text>
        <text x={w - 22} y={106} textAnchor="end" fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
          $1,299.00
        </text>
      </g>
      <g opacity={cardIn}>
        <text x={22} y={136} fill={colors.MUTED} fontSize={13.5}>
          card
        </text>
        <text x={w - 22} y={136} textAnchor="end" fill={colors.TEXT} fontSize={13.5} fontFamily={mono}>
          •••• •••• •••• 4242
        </text>
      </g>
      <line x1={22} y1={158} x2={w - 22} y2={158} stroke={colors.GRID} strokeWidth={1.5} />
      <g opacity={checkoutIn}>
        <rect x={22} y={176} width={w - 44} height={40} rx={9} fill={colors.ACCENT} opacity={0.22} />
        <rect x={22} y={176} width={w - 44} height={40} rx={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
        <text x={w / 2} y={201} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700}>
          Submit Payment
        </text>
      </g>
      {f > 0 && (
        <g transform={`translate(22, ${230 + (1 - f) * 8})`} opacity={f}>
          <rect width={w - 44} height={38} rx={8} fill={colors.NEGATIVE} opacity={0.14} />
          <rect width={w - 44} height={38} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text x={16} y={24} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
            500 Internal Server Error
          </text>
        </g>
      )}
    </g>
  );
}

/** The journey checklist — bug-002's reproduction steps, checked off live. */
function JourneyCard({ enter, steps, fail, dim }: { enter: number; steps: number; fail: number; dim: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const f = clamp01(fail);
  const { x, y, w } = JOURNEY;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.85 * dim)}>
      <rect x={-16} y={-58} width={w + 32} height={STEPS.length * 32 + 82} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-36} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        journey-acme-cart
      </text>
      <text y={-16} fill={colors.TEXT} fontSize={13} fontWeight={600}>
        Add item to cart and checkout
      </text>
      {STEPS.map((label, i) => {
        const done = clamp01(steps - i);
        const isFail = i === 3 && f > 0.3;
        const color = isFail ? colors.NEGATIVE : done > 0.5 ? colors.POSITIVE : colors.MUTED;
        return (
          <g key={label} transform={`translate(0, ${i * 32 + 8})`}>
            <circle cx={9} cy={8} r={7.5} fill="none" stroke={color} strokeWidth={1.8} />
            {done > 0.5 && !isFail && (
              <path d="M 5 8 l 3 3.5 l 5 -7" fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            )}
            {isFail && (
              <g stroke={colors.NEGATIVE} strokeWidth={2} strokeLinecap="round">
                <line x1={6} y1={5} x2={12} y2={11} />
                <line x1={12} y1={5} x2={6} y2={11} />
              </g>
            )}
            <text x={28} y={13} fill={done > 0.5 ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily={mono}>
              {i + 1}. {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** What the tape is made of — the recording's signal families. */
function Legend({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${LEGEND.x}, ${LEGEND.y})`} opacity={uu * (1 - 0.6 * dim)}>
      {LEGEND_ROWS.map((r, i) => {
        const ru = clamp01(uu * 5 - i);
        return (
          <g key={r.kind} transform={`translate(${i * 240}, 0)`} opacity={ru}>
            <circle cx={6} cy={-4} r={5} fill={POINT_COLOR[r.kind]} />
            <text x={18} y={0} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
              {r.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The test_runs row — the run files itself (seed-db: run-001, 240s). */
function RunCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w } = RUN_CARD;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={w} height={RUN_CARD.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
      <text x={20} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        test_runs
      </text>
      <text x={20} y={52} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>
        run-001 · completed · 4m00s
      </text>
      <text x={20} y={78} fill={colors.SECONDARY} fontSize={12} fontFamily={mono}>
        replay_recording_id: b5f2a3c1-7d4e…
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const runP = s.get(scene.runP);
  return (
    <>
      <AcmeBrowser enter={s.get(scene.browserE)} runP={runP} fail={s.get(scene.failU)} dim={dim} />
      <JourneyCard enter={s.get(scene.journeyE)} steps={s.get(scene.stepsU)} fail={s.get(scene.failU)} dim={dim} />
      <Legend u={s.get(scene.legendU)} dim={dim} />

      {/* events in flight: browser → tape */}
      <ParticleCloud state={s} compute={computeParticles} />

      {/* THE persistent object — the tape, growing in lockstep with the run */}
      <RecordingStrip
        x={TAPE.x}
        y={TAPE.y}
        w={TAPE.w}
        h={TAPE.h}
        points={POINTS}
        reveal={runP}
        title="the recording — the full browser session, as it happens"
      />

      <RunCard u={s.get(scene.runCardU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
