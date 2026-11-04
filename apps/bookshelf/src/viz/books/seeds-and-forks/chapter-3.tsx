// Replay Opens the Failure
//
// Backed by: plans/deterministic-simulation-testing.md ("A failing seed opens in
// the debugger"), results/spike.txt (seed 1 of the obvious shop: recorded at 0.66 MB,
// scanned to 19,452 JS steps, the same hash and violation in the replay, the two
// logpoints, the queue fix at 42 of 50, the transaction at 0 of 2,000, the store
// failing 5% of the time at 184 of 2,000), and FORKS.md (the engine is workerd,
// V8 and Chromium with Replay's record/replay).
//
// Machine: a record and replay pair with matching hashes, a long track of JS steps
// that a playhead sweeps, two logpoint streams that print in run order, and then
// the three fixes as percentages of seeds that fail. The track and the logpoint
// positions are schematic: only their order and counts are the recording's facts.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

const HASH = '1:dd1f318c:29e6ab08';
const VIOLATION = 'step 22: r4 has no receipt in orders';

// The two logpoints, in the order the run printed them (spike.txt).
const STOCK_LOG = [
  'espresso writes 2',
  'bagel writes 1',
  'espresso writes 1',
  'espresso writes 1',
  'bagel writes 1',
  'espresso writes 0',
];
const ORDER_LOG = ['espresso, orders now 1', 'bagel, orders now 1', 'espresso, orders now 2'];

const REC = { x: 90, y: 140, w: 340, h: 150 };
const REP = { x: 470, y: 140, w: 340, h: 150 };
const TRACK = { x: 90, y: 340, w: 1110 };
const FIX_X = [90, 470, 850];
const FIX_Y = 140;
const FIX_W = 340;
const FIX_H = 200;

const CAM_WIDE: CameraState = { ...CAMERA_HOME };
const CAM_REC: CameraState = { x: 470, y: 230, k: 1.18 };
const CAM_TRACK: CameraState = { x: 640, y: 380, k: 1.1 };
const CAM_FIXES: CameraState = { x: 640, y: 260, k: 1.05 };

const C1 =
  'Seed one of the obvious shop breaks at step twenty-two. Record that exact run under Replay, and the recording is about two-thirds of a megabyte.';
const C2 =
  'A replay does not reopen the network or the disk. It plays back what they returned, so the run comes back the same, and so does its hash.';
const C3 =
  'The hash printed while recording matches the hash printed in the replay. The same violation shows up at step twenty-two, with the same receipt missing.';
const C4 =
  'The run has 19,452 JavaScript steps, and any of them can be stopped at. Each stop gives the stack and the values, and they do not change between replays.';
const C5 =
  'A logpoint on the stock write prints each value as the run passes it, without rerunning anything. Espresso writes two, bagel writes one, and the writes interleave.';
const C6 =
  'A second logpoint, on the orders write, shows the lost receipt. After the bagel is written, the list holds one order, not two.';
const C7 =
  'The first fix queues requests, so each one waits for the one before. It still fails 42 of 50 seeds, and workerd cancels any request it thinks has hung.';
const C8 =
  'The fix that works puts the whole order in one transaction in the store. Two thousand seeds, and not one fails.';
const C9 =
  'Then the store fails five percent of the time. A commit can land while its reply is lost, so the order happens, but the customer never gets a receipt for it.';
const C10 =
  'In 184 of two thousand seeds, stock and sales stop adding up. A failing seed stays a reproducible bug, not a rumor.';
const C11 = 'Replay turns the failing run into evidence you can step through, and the fixes into numbers you can compare.';

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  recU: ChannelRef<number>;
  replayU: ChannelRef<number>;
  matchU: ChannelRef<number>;
  violU: ChannelRef<number>;
  trackU: ChannelRef<number>;
  playU: ChannelRef<number>;
  popU: ChannelRef<number>;
  stockN: ChannelRef<number>;
  ordN: ChannelRef<number>;
  midU: ChannelRef<number>;
  fixU: ChannelRef<number>;
  fixK: ChannelRef<number>;
  barU: ChannelRef<number>;
  sumU: ChannelRef<number>;
  endU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const recU = tl.channel('recU', 0);
  const replayU = tl.channel('replayU', 0);
  const matchU = tl.channel('matchU', 0);
  const violU = tl.channel('violU', 0);
  const trackU = tl.channel('trackU', 0);
  const playU = tl.channel('playU', 0); // the playhead, 0..1 across the run
  const popU = tl.channel('popU', 0);
  const stockN = tl.channel('stockN', 0); // stock logpoint lines shown (0..6)
  const ordN = tl.channel('ordN', 0); // orders logpoint lines shown (0..3)
  const midU = tl.channel('midU', 0); // track and logpoints step aside for the fixes
  const fixU = tl.channel('fixU', 0);
  const fixK = tl.channel('fixK', 0); // which fix card is being filled (0..2)
  const barU = tl.channel('barU', 0);
  const sumU = tl.channel('sumU', 0);
  const endU = tl.channel('endU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · record one failing seed —
  tl.tween(recU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_REC, { at: 1.0, dur: 1.6, ease: ease.move });
  let t = 0.4;
  t = tl.caption({ at: t, dur: 7.2, text: C1 });
  t = tl.hold(t, 0.4);

  // — Beat 2 · replay: the same recorded answers —
  tl.tween(replayU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.6, text: C2 });

  // — Beat 3 · the hashes match; the violation is there too —
  tl.tween(matchU, 1, { at: t + 1.0, dur: 0.6, ease: ease.pop });
  tl.tween(violU, 1, { at: t + 4.0, dur: 0.8, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C3 });
  t = tl.hold(t, 0.4);

  // — Beat 4 · the track of JavaScript steps, and a stop that reads values —
  tl.tween(recU, 0.3, { at: t - 0.2, dur: 0.8, ease: ease.move });
  tl.tween(replayU, 0.3, { at: t - 0.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TRACK, { at: t - 0.2, dur: 1.4, ease: ease.move });
  tl.tween(trackU, 1, { at: t + 0.2, dur: 0.8, ease: ease.enter });
  // The playhead stops at one JavaScript step to read it, then the run continues.
  tl.tween(playU, 0.42, { at: t + 0.6, dur: 2.4, ease: ease.move });
  tl.tween(popU, 1, { at: t + 2.8, dur: 0.6, ease: ease.pop });
  t = tl.caption({ at: t, dur: 7.0, text: C4 });
  tl.tween(popU, 0, { at: t - 0.4, dur: 0.4, ease: ease.move });
  tl.tween(playU, 1, { at: t - 0.2, dur: 7.2, ease: ease.linear });

  // — Beat 5 · the stock logpoint prints in run order —
  tl.set(stockN, 1, t + 0.4);
  tl.set(stockN, 2, t + 1.2);
  tl.set(stockN, 3, t + 2.0);
  tl.set(stockN, 4, t + 2.8);
  tl.set(stockN, 5, t + 3.6);
  tl.set(stockN, 6, t + 4.4);
  t = tl.caption({ at: t, dur: 7.0, text: C5 });

  // — Beat 6 · the orders logpoint shows one order, not two —
  tl.set(ordN, 1, t + 0.4);
  tl.set(ordN, 2, t + 1.6);
  tl.set(ordN, 3, t + 2.8);
  t = tl.caption({ at: t, dur: 6.6, text: C6 });
  tl.tween(midU, 1, { at: t - 0.6, dur: 0.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  // — Beat 7 · fix one: a queue, and a request workerd cancels —
  tl.tween(recU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(replayU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_FIXES, { at: t - 0.4, dur: 1.4, ease: ease.move });
  tl.set(fixK, 0, t);
  tl.tween(fixU, 1, { at: t + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(barU, 0.84, { at: t + 0.8, dur: 1.6, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C7 });

  // — Beat 8 · fix two: one transaction, nothing fails —
  tl.set(fixK, 1, t - 0.6);
  tl.tween(fixU, 1, { at: t - 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(barU, 0, { at: t - 0.2, dur: 0.6, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.0, text: C8 });

  // — Beat 9 · fix three: the store drops replies —
  tl.set(fixK, 2, t - 0.6);
  tl.tween(fixU, 1, { at: t - 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(barU, 0.092, { at: t + 0.0, dur: 1.4, ease: ease.move });
  t = tl.caption({ at: t, dur: 7.6, text: C9 });

  // — Beat 10 · the summary number —
  tl.tween(fixU, 0, { at: t - 0.4, dur: 0.6, ease: ease.move });
  tl.tween(sumU, 1, { at: t, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 7.0, text: C10 });

  // — Beat 11 · clean ending: everything steps back, one opaque card remains —
  tl.tween(endU, 1, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.8, dur: 1.0, ease: ease.enter });
  t = tl.caption({ at: t, dur: 6.0, text: C11 });
  t = tl.hold(t, 0.8);

  return {
    tl,
    cam,
    recU,
    replayU,
    matchU,
    violU,
    trackU,
    playU,
    popU,
    stockN,
    ordN,
    midU,
    fixU,
    fixK,
    barU,
    sumU,
    endU,
    closeU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------------- drawing */
function Hash({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={300} height={30} rx={15} fill={colors.BG} stroke={color} strokeWidth={1.4} />
      <text x={x + 150} y={y + 20} textAnchor="middle" fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
        {text}
      </text>
    </g>
  );
}

function RecordReplay({ recU, replayU, matchU, violU, dim }: { recU: number; replayU: number; matchU: number; violU: number; dim: number }) {
  if (recU <= 0 && replayU <= 0) return null;
  return (
    <g opacity={dim}>
      <g opacity={recU}>
        <rect x={REC.x} y={REC.y} width={REC.w} height={REC.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={REC.x + 20} y={REC.y + 34} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
          record · seed 1
        </text>
        <rect x={REC.x + 20} y={REC.y + 50} width={150} height={28} rx={14} fill={colors.NEGATIVE} fillOpacity={0.2} />
        <text x={REC.x + 95} y={REC.y + 69} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={SANS} fontSize={14} fontWeight={600}>
          recording · 0.66 MB
        </text>
        <Hash x={REC.x + 20} y={REC.y + 92} text={HASH} color={colors.ACCENT} />
      </g>
      <g opacity={replayU}>
        <rect x={REP.x} y={REP.y} width={REP.w} height={REP.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
        <text x={REP.x + 20} y={REP.y + 34} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
          replay · same recording
        </text>
        <Hash x={REP.x + 20} y={REP.y + 50} text={HASH} color={colors.ACCENT} />
        <text x={REP.x + 20} y={REP.y + 100} fill={colors.POSITIVE} fontFamily={SANS} fontSize={16} fontWeight={700} opacity={matchU}>
          ✓ the same hash
        </text>
        <g opacity={violU}>
          <text x={REP.x + 20} y={REP.y + 128} fill={colors.NEGATIVE} fontFamily={MONO} fontSize={13}>
            {VIOLATION}
          </text>
        </g>
      </g>
    </g>
  );
}

function Track({ opacity, play, pop }: { opacity: number; play: number; pop: number }) {
  if (opacity <= 0) return null;
  const x = TRACK.x + play * TRACK.w;
  // The popup stays inside the stage whatever the playhead is doing.
  const px = Math.min(Math.max(x - 150, TRACK.x), TRACK.x + TRACK.w - 300);
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <g opacity={opacity}>
      <text x={TRACK.x} y={TRACK.y - 18} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        one recording · 19,452 JavaScript steps
      </text>
      <rect x={TRACK.x} y={TRACK.y} width={TRACK.w} height={28} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
      {ticks.map((i) => (
        <line
          key={i}
          x1={TRACK.x + (i / 60) * TRACK.w}
          x2={TRACK.x + (i / 60) * TRACK.w}
          y1={TRACK.y + 4}
          y2={TRACK.y + 24}
          stroke={colors.GRID}
          strokeWidth={1}
        />
      ))}
      <rect x={TRACK.x} y={TRACK.y} width={x - TRACK.x} height={28} rx={6} fill={colors.ACCENT} fillOpacity={0.18} />
      <line x1={x} x2={x} y1={TRACK.y - 8} y2={TRACK.y + 36} stroke={colors.TEXT} strokeWidth={2} />
      <g opacity={pop}>
        <line x1={x} x2={x} y1={TRACK.y + 36} y2={TRACK.y + 52} stroke={colors.WARM} strokeWidth={2} />
        <rect x={px} y={TRACK.y + 52} width={300} height={72} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
        <text x={px + 18} y={TRACK.y + 76} fill={colors.WARM} fontFamily={SANS} fontSize={14} fontWeight={600}>
          stopped at the stock write
        </text>
        <text x={px + 18} y={TRACK.y + 98} fill={colors.TEXT} fontFamily={MONO} fontSize={13}>
          item = &quot;espresso&quot;, left = 2
        </text>
        <text x={px + 18} y={TRACK.y + 116} fill={colors.MUTED} fontFamily={SANS} fontSize={12}>
          values as they were at this step
        </text>
      </g>
    </g>
  );
}

function Logs({ opacity, stockN, ordN }: { opacity: number; stockN: number; ordN: number }) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <text x={90} y={446} fill={colors.ACCENT} fontFamily={SANS} fontSize={16} fontWeight={600}>
        logpoint · stock write
      </text>
      {STOCK_LOG.slice(0, stockN).map((line, i) => (
        <text key={i} x={90} y={472 + i * 22} fill={colors.TEXT} fontFamily={MONO} fontSize={14}>
          {line}
        </text>
      ))}
      <text x={640} y={446} fill={colors.SECONDARY} fontFamily={SANS} fontSize={16} fontWeight={600}>
        logpoint · orders write
      </text>
      {ORDER_LOG.slice(0, ordN).map((line, i) => {
        const bad = i === 1;
        return (
          <g key={line}>
            <text x={640} y={472 + i * 22} fill={bad ? colors.NEGATIVE : colors.TEXT} fontFamily={MONO} fontSize={14}>
              {line}
            </text>
            {bad && (
              <text x={800} y={472 + i * 22} fill={colors.NEGATIVE} fontFamily={SANS} fontSize={13} fontWeight={600}>
                espresso receipt gone
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function FixCard({
  x,
  y,
  title,
  big,
  note,
  fraction,
  color,
  opacity,
  barU,
  index,
  active,
}: {
  x: number;
  y: number;
  title: string;
  big: string;
  note: string;
  fraction: number;
  color: string;
  opacity: number;
  barU: number;
  index: number;
  active: boolean;
}) {
  if (opacity <= 0) return null;
  // The active card's bar fills to its share; finished cards keep their share.
  const fill = active ? clamp01(barU) : clamp01(fraction);
  const barW = (FIX_W - 40) * fill;
  return (
    <g opacity={opacity * (active ? 1 : 0.35)}>
      <rect x={x} y={y} width={FIX_W} height={FIX_H} rx={14} fill={colors.PANEL} stroke={active ? color : colors.GRID} strokeWidth={active ? 1.8 : 1} />
      <text x={x + 20} y={y + 34} fill={colors.MUTED} fontFamily={SANS} fontSize={16}>
        {`${index + 1} · ${title}`}
      </text>
      <text x={x + 20} y={y + 88} fill={color} fontFamily={SANS} fontSize={30} fontWeight={700}>
        {big}
      </text>
      <rect x={x + 20} y={y + 110} width={FIX_W - 40} height={14} rx={7} fill={colors.BG} stroke={colors.GRID} />
      <rect x={x + 20} y={y + 110} width={Math.max(0, barW)} height={14} rx={7} fill={color} />
      <text x={x + 20} y={y + 160} fill={colors.TEXT} fontFamily={SANS} fontSize={15}>
        {note}
      </text>
    </g>
  );
}

function Fixes({ opacity, fixK, barU }: { opacity: number; fixK: number; barU: number }) {
  if (opacity <= 0) return null;
  const cards = [
    { title: 'queue the requests', big: '42 of 50 fail', note: 'workerd cancels a request it thinks has hung', fraction: 42 / 50, color: colors.NEGATIVE },
    { title: 'one transaction in the store', big: '0 of 2,000 fail', note: 'every seed passes; the store does the order', fraction: 0, color: colors.POSITIVE },
    { title: 'the store fails 5% of the time', big: '184 of 2,000 fail', note: 'a commit can land while its reply is lost', fraction: 184 / 2000, color: colors.NEGATIVE },
  ];
  return (
    <g opacity={opacity}>
      {cards.map((c, i) => (
        <FixCard
          key={c.title}
          x={FIX_X[i]}
          y={FIX_Y}
          title={c.title}
          big={c.big}
          note={c.note}
          fraction={c.fraction}
          color={c.color}
          opacity={i <= fixK ? 1 : 0}
          barU={barU}
          index={i}
          active={i === fixK}
        />
      ))}
      <text x={90} y={380} fill={colors.MUTED} fontFamily={SANS} fontSize={15}>
        bars show the share of seeds that failed, on each fix
      </text>
    </g>
  );
}

function Summary({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={240} y={170} width={800} height={300} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={640} y={250} textAnchor="middle" fill={colors.MUTED} fontFamily={SANS} fontSize={20}>
        seeds where stock and sales stop adding up
      </text>
      <text x={640} y={336} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={SANS} fontSize={64} fontWeight={800}>
        184 of 2,000
      </text>
      <text x={640} y={392} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={20}>
        with the store failing 5% of the time
      </text>
      <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO} fontSize={15}>
        kept as a seed: runs again, and opens in the debugger
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={240} y={250} width={800} height={180} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontFamily={SANS} fontSize={26} fontWeight={600}>
        A failing seed is a bug you can run again.
      </text>
      <text x={640} y={370} textAnchor="middle" fill={colors.WARM} fontFamily={SANS} fontSize={26} fontWeight={600}>
        Then step through it, and compare the fixes.
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const end = clamp01(s.get(scene.endU));
  const mid = clamp01(s.get(scene.midU));
  const recU = clamp01(s.get(scene.recU));
  const replayU = clamp01(s.get(scene.replayU));
  // The track and logpoints step fully aside for the fixes; the end fades everything.
  const stepAside = (1 - mid) * (1 - 0.85 * end);
  const fixOp = clamp01(s.get(scene.fixU)) * (1 - 0.85 * end);
  const trackOp = clamp01(s.get(scene.trackU)) * stepAside;
  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <RecordReplay
          recU={recU * (1 - 0.85 * end)}
          replayU={replayU * (1 - 0.85 * end)}
          matchU={clamp01(s.get(scene.matchU))}
          violU={clamp01(s.get(scene.violU))}
          dim={1}
        />
        <Track opacity={trackOp} play={clamp01(s.get(scene.playU))} pop={clamp01(s.get(scene.popU))} />
        <Logs opacity={trackOp} stockN={Math.floor(s.get(scene.stockN))} ordN={Math.floor(s.get(scene.ordN))} />
        <Fixes opacity={fixOp} fixK={Math.floor(s.get(scene.fixK))} barU={clamp01(s.get(scene.barU))} />
        <Summary u={clamp01(s.get(scene.sumU)) * (1 - 0.85 * end)} />
        <ClosingCard u={clamp01(s.get(scene.closeU))} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
