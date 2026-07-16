// Why Lazy Wins
//
// Backing files: packages/effect/src/Effect.ts — Effect.promise (~869: "The
// promise thunk is evaluated when the effect runs", and the thunk receives an
// AbortSignal aborted on interruption), Effect.tryPromise (~943, catch maps
// rejections to a typed error), Effect.retry (~4040, `Effect.retry(task,
// policy)`), Effect.timeout (~4494), Effect.interrupt (~7244), and the
// runFork doc example (interrupt a running fiber). Laziness per chapter 1:
// sync/suspend thunks are "evaluated lazily when the effect runs".
//
// Centerpiece: the two-lane bench. Top lane: a JS Promise is already running
// the moment it exists, settles once, caches forever, and its failure type is
// a shrug. Bottom lane: the Effect card is inert; a flaky request fails,
// Effect.retry hands the SAME card back — attempt two, attempt three, green.
// Timeout interrupts the fiber and the abort signal cancels the real request.
// Ends with the whole-book recap.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — promise lane on top, effect lane below, one flaky server per lane.
// ---------------------------------------------------------------------------

const P_LANE = { chipX: 100, chipY: 148, trackY: 196, serverX: 970 } as const;
const E_LANE = { cardX: 100, cardY: 366, trackY: 440, serverX: 970 } as const;
const SERVER_W = 92;

// attempt dot: out (0..0.5) and, on failure, back (0.5..1)
const attemptPos = (u: number, fromX: number, toX: number, bounce: boolean): number => {
  if (!bounce) return lerp(fromX, toX, clamp01(u * 2));
  return u <= 0.5 ? lerp(fromX, toX, u / 0.5) : lerp(toX, fromX, (u - 0.5) / 0.5);
};

// recap mini-panels (the whole book in four cards)
const RECAP = [
  { x: 110, title: 'a description', code: 'op: "Sync"', note: 'creating runs nothing' },
  { x: 402, title: 'the contract', code: 'Effect<A, E, R>', note: 'yields · fails · needs' },
  { x: 694, title: 'the plumbing', code: 'map · flatMap · pipe', note: 'bigger descriptions' },
  { x: 986, title: 'the run', code: 'fiber → Exit', note: 'walk the tree' },
] as const;
const RECAP_Y = 170;
const RECAP_W = 184;
const RECAP_H = 120;

// camera marks
const CAM_P: CameraState = { x: 560, y: 210, k: 1.3 };
const CAM_P_SETTLE: CameraState = { x: 620, y: 250, k: 1.4 };
const CAM_E: CameraState = { x: 560, y: 440, k: 1.3 };
const CAM_LANES: CameraState = { x: 640, y: 340, k: 1.1 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pU: ChannelRef<number>;
  pFuse: ChannelRef<number>;
  pSettle: ChannelRef<number>;
  pType: ChannelRef<number>;
  eU: ChannelRef<number>;
  att1: ChannelRef<number>;
  retryU: ChannelRef<number>;
  att2: ChannelRef<number>;
  att3: ChannelRef<number>;
  cutRun: ChannelRef<number>;
  cutU: ChannelRef<number>;
  typesU: ChannelRef<number>;
  laneDim: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 330, k: 1.06 }, cameraInterp);
  const pU = tl.channel('pU', 0);
  const pFuse = tl.channel('pFuse', 0);
  const pSettle = tl.channel('pSettle', 0);
  const pType = tl.channel('pType', 0);
  const eU = tl.channel('eU', 0);
  const att1 = tl.channel('att1', 0);
  const retryU = tl.channel('retryU', 0);
  const att2 = tl.channel('att2', 0);
  const att3 = tl.channel('att3', 0);
  const cutRun = tl.channel('cutRun', 0);
  const cutU = tl.channel('cutU', 0);
  const typesU = tl.channel('typesU', 0);
  const laneDim = tl.channel('laneDim', 1);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Time to settle an old rivalry. The language already has a way to talk about the future: the promise. So why does Effect insist on lazy descriptions?',
  });
  tl.tween(cam, CAM_LANES, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · a promise is born running —
  tl.caption({
    at: 7.2,
    dur: 6.6,
    text: 'Watch the moment a promise is born. It is already running. Creating a promise and starting the work are the same event; there is no gap left to make a decision in.',
  });
  tl.tween(pU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_P, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(pFuse, 1, { at: 8.4, dur: 1.6, ease: ease.linear });
  tl.hold(13.4, 0.4);

  // — Beat 3 · settles once, cached forever —
  tl.caption({
    at: 14.0,
    dur: 6.6,
    text: 'And a promise settles exactly once, then caches its answer forever. This request failed, so the promise is spent. To try again, you have to rebuild it yourself, from scratch.',
  });
  tl.tween(cam, CAM_P_SETTLE, { at: 14.2, dur: 1.3, ease: ease.move });
  tl.tween(pSettle, 1, { at: 14.8, dur: 0.9, ease: ease.enter });
  tl.hold(20.2, 0.4);

  // — Beat 4 · the shrugging type —
  tl.caption({
    at: 20.8,
    dur: 5.6,
    text: 'Its type is honest about success and silent about everything else: a promise of a response. What can go wrong? The type just shrugs.',
  });
  tl.tween(pType, 1, { at: 21.4, dur: 0.8, ease: ease.enter });
  tl.hold(26.0, 0.4);

  // — Beat 5 · the effect lane: inert until picked up —
  tl.caption({
    at: 26.6,
    dur: 7.0,
    text: 'Now the same request as an Effect. The card just sits there, inert, until a fiber picks it up. Creation and execution are two different moments, and that gap is where the power lives.',
  });
  tl.tween(eU, 1, { at: 27.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_E, { at: 27.2, dur: 1.5, ease: ease.move });
  tl.hold(33.2, 0.4);

  // — Beat 6 · retry the same card —
  tl.caption({
    at: 33.8,
    dur: 7.6,
    text: 'The server is flaky, and attempt one fails. But the description survives its own failure. Retry hands the very same card back to the runtime: attempt two fails, attempt three lands.',
  });
  tl.tween(att1, 1, { at: 34.2, dur: 1.6, ease: ease.linear });
  tl.tween(retryU, 1, { at: 36.0, dur: 0.6, ease: ease.enter });
  tl.tween(att2, 1, { at: 36.8, dur: 1.5, ease: ease.linear });
  tl.tween(att3, 1, { at: 38.6, dur: 1.5, ease: ease.linear });
  tl.hold(41.8, 0.4);

  // — Beat 7 · timeout + interruption —
  tl.caption({
    at: 42.4,
    dur: 7.2,
    text: 'Timeout is the same trick: race the description against a clock. If time runs out, the runtime interrupts the fiber, and the abort signal reaches down to cancel the real request.',
  });
  tl.tween(cutRun, 0.5, { at: 43.2, dur: 1.2, ease: ease.linear });
  tl.tween(cutU, 1, { at: 44.8, dur: 0.7, ease: ease.pop });
  tl.hold(49.2, 0.4);

  // — Beat 8 · typed all the way down —
  tl.caption({
    at: 49.8,
    dur: 6.0,
    text: 'And failures stay typed the whole way down: the red channel still names its errors, so recovery is a checked branch, not a guess in a catch block.',
  });
  tl.tween(typesU, 1, { at: 50.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_LANES, { at: 50.2, dur: 1.4, ease: ease.move });
  tl.hold(55.4, 0.4);

  // — Beat 9 · recap the journey —
  tl.caption({
    at: 56.2,
    dur: 7.2,
    text: 'So retrace the journey. An Effect is a frozen description. Its type carries success, failure, and requirements. Pipes compose bigger descriptions. Fibers walk them to an exit.',
  });
  tl.tween(laneDim, 0.08, { at: 56.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 56.4, dur: 1.6, ease: ease.move });
  tl.tween(recapU, 1, { at: 57.2, dur: 2.6, ease: ease.move });
  tl.hold(63.6, 0.4);

  // — Beat 10 · close the book —
  tl.caption({
    at: 64.4,
    dur: 7.6,
    text: 'And because nothing runs until you say so, you get retry, timeout, and interruption almost for free. Those are the good parts. This is book one. The series continues from here.',
  });
  tl.tween(closeU, 1, { at: 66.0, dur: 0.9, ease: ease.enter });
  tl.hold(71.6, 1.6);

  return {
    tl,
    cam,
    pU,
    pFuse,
    pSettle,
    pType,
    eU,
    att1,
    retryU,
    att2,
    att3,
    cutRun,
    cutU,
    typesU,
    laneDim,
    recapU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Server({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={SERVER_W} height={64} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x + 14} y1={y + 16 + i * 16} x2={x + SERVER_W - 14} y2={y + 16 + i * 16} stroke={colors.MUTED} strokeWidth={2} opacity={0.5} />
      ))}
      <text x={x + SERVER_W / 2} y={y + 84} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
        {label}
      </text>
    </g>
  );
}

function AttemptDot({ u, n }: { u: number; n: number }) {
  if (u <= 0.005 || u >= 0.995) return null;
  const x = attemptPos(u, E_LANE.cardX + 262, E_LANE.serverX - 12, true);
  const returning = u > 0.5;
  return (
    <g>
      <circle cx={x} cy={E_LANE.trackY} r={9} fill={returning ? colors.NEGATIVE : colors.ACCENT} />
      <text x={x} y={E_LANE.trackY - 16} textAnchor="middle" fill={returning ? colors.NEGATIVE : colors.ACCENT} fontSize={11.5} fontFamily="monospace">
        attempt {n}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pU = s.get(scene.pU);
  const pFuse = s.get(scene.pFuse);
  const pSettle = s.get(scene.pSettle);
  const pType = s.get(scene.pType);
  const eU = s.get(scene.eU);
  const att1 = s.get(scene.att1);
  const retryU = s.get(scene.retryU);
  const att2 = s.get(scene.att2);
  const att3 = s.get(scene.att3);
  const cutRun = s.get(scene.cutRun);
  const cutU = s.get(scene.cutU);
  const typesU = s.get(scene.typesU);
  const laneDim = s.get(scene.laneDim);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const fuseX = lerp(P_LANE.chipX + 292, P_LANE.serverX - 12, pFuse);
  const att3X = attemptPos(att3, E_LANE.cardX + 262, E_LANE.serverX - 12, false);
  const cutX = attemptPos(cutRun, E_LANE.cardX + 262, E_LANE.serverX - 12, false);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= promise lane ================= */}
        {pU > 0.01 && (
          <g opacity={pU * laneDim}>
            <text x={P_LANE.chipX} y={98} fill={colors.WARM} fontSize={14} fontWeight={600}>
              the promise lane
            </text>
            <rect x={P_LANE.chipX} y={P_LANE.chipY} width={292} height={52} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={P_LANE.chipX + 18} y={P_LANE.chipY + 32} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
              const p = fetch(url)
            </text>
            <line x1={P_LANE.chipX + 292} y1={P_LANE.trackY} x2={P_LANE.serverX} y2={P_LANE.trackY} stroke={colors.GRID} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
            <Server x={P_LANE.serverX} y={P_LANE.trackY - 32} label="the server" />
            {/* the lit fuse: running the instant it exists */}
            {pFuse > 0.01 && pFuse < 0.99 && (
              <g>
                <circle cx={fuseX} cy={P_LANE.trackY} r={9} fill={colors.WARM} />
                <circle cx={fuseX} cy={P_LANE.trackY} r={15} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.5} />
              </g>
            )}
            {pFuse > 0.3 && (
              <text x={P_LANE.chipX + 320} y={P_LANE.trackY + 34} fill={colors.WARM} fontSize={12} fontStyle="italic">
                already running — no gap between creating and starting
              </text>
            )}
            {/* settled and cached */}
            {pSettle > 0.01 && (
              <g opacity={pSettle}>
                <rect x={P_LANE.chipX + 340} y={P_LANE.chipY - 4} width={330} height={40} rx={10} fill="#180a10" stroke={colors.NEGATIVE} strokeWidth={1.4} />
                <text x={P_LANE.chipX + 358} y={P_LANE.chipY + 21} fill={colors.NEGATIVE} fontSize={12.5} fontFamily="monospace">
                  settled: rejected · cached forever
                </text>
              </g>
            )}
            {pType > 0.01 && (
              <g opacity={pType}>
                <rect x={P_LANE.chipX} y={P_LANE.chipY + 66} width={310} height={48} rx={10} fill={colors.BG} stroke={colors.GRID} />
                <text x={P_LANE.chipX + 16} y={P_LANE.chipY + 86} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                  {'Promise<Response>'}
                </text>
                <text x={P_LANE.chipX + 16} y={P_LANE.chipY + 104} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                  errors: unknown — the type shrugs
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= effect lane ================= */}
        {eU > 0.01 && (
          <g opacity={eU * laneDim}>
            <text x={E_LANE.cardX} y={E_LANE.cardY - 22} fill={colors.ACCENT} fontSize={14} fontWeight={600}>
              the effect lane
            </text>
            {/* the inert card */}
            <rect x={E_LANE.cardX} y={E_LANE.cardY} width={262} height={110} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <rect x={E_LANE.cardX + 14} y={E_LANE.cardY + 12} width={118} height={20} rx={10} fill={colors.BG} stroke={colors.GRID} />
            <text x={E_LANE.cardX + 73} y={E_LANE.cardY + 26} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily="monospace">
              a description
            </text>
            <text x={E_LANE.cardX + 16} y={E_LANE.cardY + 54} fill={colors.TEXT} fontSize={11} fontFamily="monospace">
              Effect.tryPromise({'{'}
            </text>
            <text x={E_LANE.cardX + 16} y={E_LANE.cardY + 72} fill={colors.TEXT} fontSize={11} fontFamily="monospace">
              {'  try: (signal) => fetch(url),'}
            </text>
            <text x={E_LANE.cardX + 16} y={E_LANE.cardY + 90} fill={colors.TEXT} fontSize={11} fontFamily="monospace">
              {'  catch: (e) => new HttpError(e) })'}
            </text>
            <line x1={E_LANE.cardX + 262} y1={E_LANE.trackY} x2={E_LANE.serverX} y2={E_LANE.trackY} stroke={colors.GRID} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
            <Server x={E_LANE.serverX} y={E_LANE.trackY - 32} label="the same flaky server" />

            {/* attempts 1 and 2 bounce; attempt 3 lands */}
            <AttemptDot u={att1} n={1} />
            <AttemptDot u={att2} n={2} />
            {att3 > 0.005 && att3 < 0.995 && (
              <g>
                <circle cx={att3X} cy={E_LANE.trackY} r={9} fill={colors.ACCENT} />
                <text x={att3X} y={E_LANE.trackY - 16} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily="monospace">
                  attempt 3
                </text>
              </g>
            )}
            {att3 >= 0.995 && (
              <g>
                <circle cx={E_LANE.serverX + SERVER_W / 2} cy={E_LANE.trackY - 52} r={13} fill={colors.POSITIVE} />
                <text x={E_LANE.serverX + SERVER_W / 2} y={E_LANE.trackY - 47} textAnchor="middle" fill={colors.BG} fontSize={13} fontWeight={700}>
                  ✓
                </text>
              </g>
            )}
            {att1 > 0.5 && (
              <text x={E_LANE.serverX - 30} y={E_LANE.trackY - 44} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} opacity={clamp01((att1 - 0.5) * 4)}>
                ✕
              </text>
            )}
            {att2 > 0.5 && (
              <text x={E_LANE.serverX - 12} y={E_LANE.trackY - 44} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} opacity={clamp01((att2 - 0.5) * 4)}>
                ✕
              </text>
            )}

            {/* the retry chip: the SAME card loops back */}
            {retryU > 0.01 && (
              <g opacity={retryU}>
                <rect x={E_LANE.cardX + 300} y={E_LANE.cardY + 118} width={300} height={34} rx={10} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
                <text x={E_LANE.cardX + 316} y={E_LANE.cardY + 140} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                  Effect.retry(request, policy)
                </text>
                {/* loop arrow under the track: server back to the card */}
                <path
                  d={`M ${E_LANE.serverX - 20} ${E_LANE.trackY + 26} C ${E_LANE.serverX - 160} ${E_LANE.trackY + 72}, ${E_LANE.cardX + 420} ${E_LANE.trackY + 72}, ${E_LANE.cardX + 290} ${E_LANE.trackY + 30}`}
                  fill="none"
                  stroke={colors.POSITIVE}
                  strokeWidth={1.6}
                  strokeDasharray="6 6"
                  opacity={0.8}
                />
                <text x={(E_LANE.cardX + E_LANE.serverX) / 2 + 40} y={E_LANE.trackY + 88} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontStyle="italic">
                  the very same description, run again
                </text>
              </g>
            )}

            {/* timeout: the clock, the cut, the abort wire */}
            {cutU > 0.01 && (
              <g opacity={cutU}>
                {/* clock over the track */}
                <circle cx={cutX + 60} cy={E_LANE.trackY - 60} r={18} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                <line x1={cutX + 60} y1={E_LANE.trackY - 60} x2={cutX + 60} y2={E_LANE.trackY - 72} stroke={colors.WARM} strokeWidth={2} />
                <line x1={cutX + 60} y1={E_LANE.trackY - 60} x2={cutX + 70} y2={E_LANE.trackY - 56} stroke={colors.WARM} strokeWidth={2} />
                <text x={cutX + 88} y={E_LANE.trackY - 66} fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
                  Effect.timeout
                </text>
                {/* the cut */}
                <line x1={cutX - 9} y1={E_LANE.trackY - 13} x2={cutX + 9} y2={E_LANE.trackY + 13} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                <line x1={cutX + 9} y1={E_LANE.trackY - 13} x2={cutX - 9} y2={E_LANE.trackY + 13} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                <text x={cutX} y={E_LANE.trackY + 32} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
                  fiber interrupted
                </text>
                {/* abort wire racing ahead to the server */}
                <line x1={cutX + 14} y1={E_LANE.trackY - 4} x2={E_LANE.serverX - 6} y2={E_LANE.trackY - 4} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="4 5" opacity={0.9} />
                <text x={E_LANE.serverX - 16} y={E_LANE.trackY + 30} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontStyle="italic">
                  abort signal cancels the real request
                </text>
              </g>
            )}

            {/* typed all the way down */}
            {typesU > 0.01 && (
              <g opacity={typesU}>
                <rect x={E_LANE.cardX} y={E_LANE.cardY + 118} width={262} height={34} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.2} />
                <text x={E_LANE.cardX + 16} y={E_LANE.cardY + 140} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                  {'E: HttpError — named, checked'}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ================= the recap: the whole book in four cards ============ */}
        {recapU > 0.01 && (
          <g opacity={Math.min(1, recapU * 1.2)}>
            {RECAP.map((r, i) => {
              const u = clamp01(recapU * 4 - i * 0.85);
              if (u <= 0.01) return null;
              return (
                <g key={r.title} opacity={u}>
                  <rect x={r.x} y={RECAP_Y} width={RECAP_W} height={RECAP_H} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
                  <text x={r.x + RECAP_W / 2} y={RECAP_Y + 34} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                    {r.title}
                  </text>
                  <text x={r.x + RECAP_W / 2} y={RECAP_Y + 64} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
                    {r.code}
                  </text>
                  <text x={r.x + RECAP_W / 2} y={RECAP_Y + 94} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                    {r.note}
                  </text>
                  {i < RECAP.length - 1 && (
                    <path d={`M ${r.x + RECAP_W + 12} ${RECAP_Y + RECAP_H / 2} l 76 0 l -10 -6 m 10 6 l -10 6`} stroke={colors.GRID} strokeWidth={2} fill="none" opacity={clamp01(u * 2 - 1)} />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ================= closing panel ================= */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={330} y={356} width={620} height={168} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={412} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              nothing runs until you say so —
            </text>
            <text x={640} y={452} textAnchor="middle" fill={colors.ACCENT} fontSize={21} fontWeight={700}>
              retry · timeout · interruption, for free
            </text>
            <text x={640} y={496} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
              Effect: The Good Parts · book one
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
