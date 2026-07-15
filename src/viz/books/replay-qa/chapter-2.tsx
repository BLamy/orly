// Book scene — replay-qa, chapter 2: "Tape Everything".
// The browser gets a tape deck: the rrweb recorder installs ONCE as a
// Playwright context init script, survives a full-document navigation (the
// old per-page injector visibly dies; the init script re-arms at
// document-start), the agent's required narration drops thought chips onto
// the tape, the session uploads as a Replay recording with an id — and that
// id must pass the usableRecordingIdOrNull gate before it may attach to the
// test_runs row. An unusable id ("Recording invalidated: Stack overflow")
// bounces; the column stays null; no dead deep-links.
// Backing files (replayio/loop-qa): netlify/functions/lib/prompts.ts
// (buildEventStreamInstructions — context.addInitScript, /api/task-events,
// the narrate helper), docs/architecture.md "Replay Recordings" (product vs
// driver recording), netlify/functions/lib/replay-recordings.ts,
// tests/replay-recording-unusable.spec.ts, netlify/functions/lib/test-runs.ts
// (updateTestRunProgress).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, Packet, ServiceNode } from '../../primitives';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage is 1280×720; captions own the bottom ~12% (y ≳ 630). */
const BROWSER = { x: 80, y: 116, w: 460, h: 244 };
const RECORDER = { x: 310, y: 104 };
const TASKEV = { x: 800, y: 200 };
const STRIP = { x: 80, y: 462, w: 520, h: 26 };
const CASS = { P: { x: 700, y: 462 }, D: { x: 700, y: 528 } };
const GATE = { x: 935, y: 476 };
const DB = { x: 1130, y: 476 };
const BAD_START = { x: 700, y: 590 };

/* ------------------------------------------------------------------ data */
const POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'click' },
  { at: 0.2, kind: 'render' },
  { at: 0.34, kind: 'network' },
  { at: 0.48, kind: 'interaction', label: 'navigate' },
  { at: 0.62, kind: 'render' },
  { at: 0.76, kind: 'interaction' },
  { at: 0.9, kind: 'network' },
];

const THOUGHTS = [
  { at: 0.3, text: 'about to submit payment' },
  { at: 0.66, text: 'saw a 500 — flagging it' },
];

const GOOD_ID = 'b5f2a3c1-7d4e';
const BAD_REASON = 'Recording invalidated: Stack overflow';

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  // the browser + its tape deck
  const browserE = tl.channel('browserEnter', 0);
  const stripR = tl.channel('stripReveal', 0);
  const recChip = tl.channel('recorderChip', 0);
  const taskEvE = tl.channel('taskEventsEnter', 0);
  const connU = tl.channel('connReveal', 0);
  const flowU = tl.channel('connFlow', 0);

  // the navigation survival test
  const navU = tl.channel('navSwap', 0); // 0 = /checkout, 1 = /orders
  const flash = tl.channel('navFlash', 0);
  const ghostU = tl.channel('oldInjectorGhost', 0);
  const rearmU = tl.channel('rearmPulse', 0);

  // narration
  const thoughtU = tl.channel('thoughtChips', 0); // 0..2, staggered

  // upload + attach
  const gBrowser = tl.channel('browserFade', 1);
  const cassP = tl.channel('cassetteProduct', 0);
  const cassD = tl.channel('cassetteDriver', 0);
  const gateE = tl.channel('gateEnter', 0);
  const dbE = tl.channel('dbEnter', 0);
  const goodPkt = tl.channel('goodPacket', 0);
  const goodGlow = tl.channel('dbGlow', 0);
  const badPkt = tl.channel('badPacket', 0);
  const badBounce = tl.channel('badBounce', 0);
  const nullChip = tl.channel('nullChip', 0);
  const gAll = tl.channel('allFade', 1);
  const closeU = tl.channel('closePanel', 0);

  /* ---- beat 1: a bug is a story in time --------------------------------- */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'A screenshot is a moment. A bug is a story in time. So before the agent touches anything, the harness bolts a tape deck onto the browser.',
  });
  tl.tween(browserE, 1, { at: t - 5.4, dur: 0.7, ease: ease.enter });
  tl.tween(stripR, 0.35, { at: t - 4.2, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.6);

  /* ---- beat 2: install once, as a context init script ------------------- */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The recorder installs once, as a context init script. That means it re-arms at document start on every page this browser will ever visit — the agent never re-injects it.',
  });
  tl.tween(recChip, 1, { at: t - 5.6, dur: 0.6, ease: ease.pop });
  tl.tween(taskEvE, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(connU, 1, { at: t - 4.0, dur: 0.9, ease: ease.draw });
  tl.tween(flowU, 3, { at: t - 3.0, dur: 26, ease: ease.linear }); // streams for the rest of the act
  tl.tween(stripR, 0.5, { at: t - 3.0, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* ---- beat 3: the hard case — a full-document navigation --------------- */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Watch the hard case: a full page navigation. The document tears down completely — this is what destroyed the old per-page injector — and the recorder is already there when the next page’s first line runs.',
  });
  tl.tween(flash, 1, { at: t - 5.6, dur: 0.25, ease: ease.enter });
  tl.tween(flash, 0, { at: t - 5.3, dur: 0.5, ease: ease.move });
  tl.set(navU, 1, t - 5.4);
  tl.tween(ghostU, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(ghostU, 0, { at: t - 2.4, dur: 0.8, ease: ease.move });
  tl.tween(rearmU, 1, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(stripR, 0.68, { at: t - 5.0, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* ---- beat 4: narration is mandatory ------------------------------------ */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Recording alone isn’t enough. The agent is required to narrate: before every action and after every surprise, it posts a thought to the task’s event stream.',
  });
  tl.tween(thoughtU, 2, { at: t - 5.0, dur: 2.4, ease: ease.enter });
  tl.tween(stripR, 0.82, { at: t - 5.0, dur: 4.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* ---- beat 5: thoughts become subtitles --------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Those thoughts become subtitles, time-stamped against the tape — the future reviewer watches what happened and hears why.',
  });
  tl.tween(stripR, 1, { at: t - 4.6, dur: 3.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  /* ---- beat 6: upload — two recordings, with names ----------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'When the run ends, the session uploads to Replay and becomes a recording with an id. Two of them, actually: the product recording of the app, and a driver recording of the harness itself.',
  });
  tl.tween(gBrowser, 0.15, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cassP, 1, { at: t - 4.6, dur: 0.6, ease: ease.pop });
  tl.tween(cassD, 1, { at: t - 3.2, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* ---- beat 7: the attach — through a gate -------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Now the attach: an update-progress call carries the recording id toward the run’s row in the database.',
  });
  tl.tween(dbE, 1, { at: t - 5.0, dur: 0.6, ease: ease.enter });
  tl.tween(gateE, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* ---- beat 8: some recordings are unusable ------------------------------- */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'But there’s a gate. Some recordings come back from the backend flagged unusable — invalidated during capture, say by a stack overflow in the target site’s own code.',
  });
  tl.tween(badPkt, 1, { at: t - 4.6, dur: 1.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* ---- beat 9: the guard drops the bad id --------------------------------- */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'An unusable id would mint a dead open-in-Replay link. So the guard drops it — the column stays null even if an agent insists. Fail open on a missing status; fail hard on a bad one.',
  });
  tl.tween(badBounce, 1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(nullChip, 1, { at: t - 4.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* ---- beat 10: the good id passes — run-001 owns its evidence ------------ */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The good id passes, and test run one now owns its evidence. Point at any claim about this run, and there is a tape to check.',
  });
  tl.tween(goodPkt, 1, { at: t - 5.6, dur: 2.0, ease: ease.linear });
  tl.tween(goodGlow, 1, { at: t - 3.4, dur: 0.6, ease: ease.pop });
  tl.tween(gAll, 0.15, { at: t - 1.6, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 1.0, dur: 0.6, ease: ease.enter });
  tl.hold(t, 1.2);

  return {
    tl,
    browserE, stripR, recChip, taskEvE, connU, flowU,
    navU, flash, ghostU, rearmU, thoughtU,
    gBrowser, cassP, cassD, gateE, dbE, goodPkt, goodGlow, badPkt, badBounce, nullChip, gAll, closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The browser under test — page swaps wholesale on a full navigation. */
function TapedBrowser({ enter, nav, flash }: { enter: number; nav: number; flash: number }) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const { x, y, w, h } = BROWSER;
  const onOrders = nav > 0.5;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={14} y={12} width={w - 28} height={28} rx={14} fill={colors.BG} opacity={0.6} />
      <text x={30} y={31} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        {onOrders ? 'acme-store.example.com/orders' : 'acme-store.example.com/checkout'}
      </text>
      {!onOrders ? (
        <g>
          <text x={22} y={78} fill={colors.TEXT} fontSize={16} fontWeight={700}>
            Checkout
          </text>
          <text x={22} y={110} fill={colors.MUTED} fontSize={13.5}>
            1 × Laptop
          </text>
          <rect x={22} y={140} width={w - 44} height={38} rx={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={w / 2} y={164} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>
            Submit Payment
          </text>
        </g>
      ) : (
        <g>
          <text x={22} y={78} fill={colors.TEXT} fontSize={16} fontWeight={700}>
            Orders
          </text>
          <text x={22} y={110} fill={colors.MUTED} fontSize={13.5}>
            no orders yet
          </text>
          <line x1={22} y1={130} x2={w - 22} y2={130} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={22} y={160} fill={colors.MUTED} fontSize={13.5}>
            the order that never happened
          </text>
        </g>
      )}
      {/* full-document teardown flash */}
      <rect width={w} height={h} rx={12} fill={colors.TEXT} opacity={0.22 * clamp01(flash)} />
    </g>
  );
}

/** The recorder chip clamped onto the browser — installed once. */
function RecorderChip({ u, rearm }: { u: number; rearm: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const r = clamp01(rearm);
  const label = 'context.addInitScript(rrweb)';
  const w = label.length * 6.8 + 24;
  return (
    <g transform={`translate(${RECORDER.x}, ${RECORDER.y - (1 - uu) * 8})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
      {r > 0.01 && (
        <rect x={-w / 2 - 4} y={-17} width={w + 8} height={34} rx={17} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={r * (1 - r) * 4} />
      )}
      <circle cx={-w / 2 + 14} r={4.5} fill={colors.NEGATIVE}>
        {/* recording dot — static red, no self-animation */}
      </circle>
      <text x={8} y={4.5} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/** The dead per-page injector — what full navigations used to kill. */
function InjectorGhost({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const label = 'per-page injector';
  const w = label.length * 6.8 + 24;
  const x = BROWSER.x + 120;
  const y = BROWSER.y + BROWSER.h + 28;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={0.75 * uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="4 4" />
      <text y={4.5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>
        {label}
      </text>
      <line x1={-w / 2 + 6} y1={-11} x2={w / 2 - 6} y2={11} stroke={colors.NEGATIVE} strokeWidth={2} strokeLinecap="round" />
      <text x={w / 2 + 10} y={4.5} fill={colors.MUTED} fontSize={11}>
        died at the reload
      </text>
    </g>
  );
}

/** Narration chips — the agent's required thoughts, pinned to tape moments. */
function ThoughtChips({ u }: { u: number }) {
  const uu = clamp01(u / 2) * 2;
  if (uu <= 0) return null;
  return (
    <g>
      {THOUGHTS.map((th, i) => {
        const cu = clamp01(uu - i);
        if (cu <= 0) return null;
        const px = STRIP.x + th.at * STRIP.w;
        const w = th.text.length * 6.4 + 22;
        return (
          <g key={i} transform={`translate(${px}, ${STRIP.y - 34 + (1 - cu) * 8})`} opacity={cu}>
            <line x1={0} y1={12} x2={0} y2={28} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="2 3" />
            <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={mono}>
              {th.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** A recording cassette — the tape, uploaded and named. */
function Cassette({
  x, y, u, label, sub, bad = 0,
}: {
  x: number; y: number; u: number; label: string; sub?: string; bad?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = bad > 0.5 ? colors.NEGATIVE : colors.SECONDARY;
  const w = 200;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu}>
      <rect width={w} height={sub ? 46 : 34} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <circle cx={18} cy={17} r={6} fill="none" stroke={color} strokeWidth={1.8} />
      <circle cx={34} cy={17} r={6} fill="none" stroke={color} strokeWidth={1.8} />
      <text x={50} y={21} fill={color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
      {sub && (
        <text x={12} y={39} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
          {sub}
        </text>
      )}
    </g>
  );
}

/** The usableRecordingIdOrNull gate — a diode for recording ids. */
function UsabilityGate({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y } = GATE;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={uu}>
      <line x1={0} y1={-44} x2={0} y2={44} stroke={colors.WARM} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M -14 -44 h 28 M -14 44 h 28" stroke={colors.WARM} strokeWidth={2.5} strokeLinecap="round" />
      <text y={-56} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={mono}>
        usableRecordingIdOrNull
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const gBrowser = s.get(scene.gBrowser);
  const gAll = s.get(scene.gAll);
  const bad = s.get(scene.badPkt);
  const bounce = s.get(scene.badBounce);
  const good = s.get(scene.goodPkt);
  const closeU = s.get(scene.closeU);

  // bad packet: cassette row → gate, then the bounce arc falls away
  const badX = BAD_START.x + 210 + (GATE.x - BAD_START.x - 226) * clamp01(bad);
  const badY = BAD_START.y + 17;
  const arcX = GATE.x - 16 - 60 * bounce;
  const arcY = badY + 90 * bounce * bounce;

  return (
    <g opacity={0.15 + 0.85 * gAll}>
      {/* the browser + its tape deck */}
      {gBrowser > 0.002 && (
        <g opacity={gBrowser}>
          <TapedBrowser enter={s.get(scene.browserE)} nav={s.get(scene.navU)} flash={s.get(scene.flash)} />
          <InjectorGhost u={s.get(scene.ghostU)} />
          <ServiceNode
            x={TASKEV.x}
            y={TASKEV.y}
            kind="fn"
            label="/api/task-events"
            sublabel="rrweb batches + thoughts"
            u={s.get(scene.taskEvE)}
          />
          <Connection
            from={{ x: BROWSER.x + BROWSER.w, y: BROWSER.y + 100 }}
            to={{ x: TASKEV.x - 96, y: TASKEV.y }}
            u={s.get(scene.connU)}
            flow={s.get(scene.flowU)}
            label="event stream"
            color={colors.POSITIVE}
            labelSize={11}
          />
        </g>
      )}
      <RecorderChip u={s.get(scene.recChip) * Math.max(gBrowser, 0)} rearm={s.get(scene.rearmU)} />

      {/* the tape itself */}
      <RecordingStrip
        x={STRIP.x}
        y={STRIP.y}
        w={STRIP.w}
        h={STRIP.h}
        points={POINTS}
        reveal={s.get(scene.stripR)}
        title="the tape"
      />
      <ThoughtChips u={s.get(scene.thoughtU)} />

      {/* upload + attach */}
      <Cassette x={CASS.P.x} y={CASS.P.y} u={s.get(scene.cassP)} label={`${GOOD_ID}…`} sub="product recording · the app" />
      <Cassette x={CASS.D.x} y={CASS.D.y} u={s.get(scene.cassD)} label="driver recording" sub="the harness, recording itself" />
      <Cassette x={BAD_START.x} y={BAD_START.y} u={s.get(scene.badPkt) > 0 ? 1 : 0} label="rec-unusable" sub={BAD_REASON} bad={1} />
      <UsabilityGate u={s.get(scene.gateE)} />
      <ServiceNode
        x={DB.x}
        y={DB.y}
        kind="db"
        label="test_runs"
        sublabel="replay_recording_id"
        u={s.get(scene.dbE)}
        glow={0.7 * s.get(scene.goodGlow)}
      />

      {/* the unusable id: approaches the gate, bounces, never lands */}
      {bad > 0.01 && bounce < 0.02 && <circle cx={badX} cy={badY} r={7} fill={colors.NEGATIVE} opacity={Math.min(1, bad * 5)} />}
      {bounce > 0.02 && bounce < 0.98 && (
        <g opacity={1 - bounce * 0.7}>
          <circle cx={arcX} cy={arcY} r={7} fill={colors.NEGATIVE} />
        </g>
      )}
      {s.get(scene.nullChip) > 0.01 && (
        <g transform={`translate(${DB.x}, ${DB.y + 62})`} opacity={s.get(scene.nullChip)}>
          <rect x={-92} y={-12} width={184} height={24} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
          <text y={4.5} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
            column stays null
          </text>
        </g>
      )}

      {/* the good id: cassette → gate → test_runs */}
      <Packet
        from={{ x: CASS.P.x + 210, y: CASS.P.y + 17 }}
        to={{ x: DB.x - 60, y: DB.y }}
        u={good}
        color={colors.SECONDARY}
        label={good > 0.15 && good < 0.95 ? GOOD_ID : undefined}
        labelSize={10}
      />

      {/* close panel — run-001 owns its evidence */}
      {closeU > 0.01 && (
        <g transform={`translate(640, 320)`} opacity={closeU}>
          <rect x={-260} y={-38} width={520} height={76} rx={12} fill={colors.BG} opacity={0.92} />
          <rect x={-260} y={-38} width={520} height={76} rx={12} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} />
          <text y={-6} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={700}>
            run-001 · recording attached
          </text>
          <text y={20} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={mono}>
            replay_recording_id = {GOOD_ID}…
          </text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
