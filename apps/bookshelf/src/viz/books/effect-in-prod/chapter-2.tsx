// Pulling the Plug Safely
//
// Grounding: packages/effect/src/Effect.ts — race ("Runs two effects
// concurrently and returns the result of the first successful one", loser is
// interrupted), timeout ("Runs an effect with a time limit... fails with
// Cause.TimeoutError", the source effect is interrupted when the timeout
// wins), interruptible / uninterruptible / uninterruptibleMask (armor a
// critical section; a pending interrupt waits at the boundary; `restore`
// re-opens a window inside), onInterrupt (cleanup that runs when the fiber
// is interrupted). Cause.TimeoutError from packages/effect/src/Cause.ts.
//
// Centerpiece: the fiber as a SEGMENTED EXECUTION BAR. A race shatters the
// loser mid-segment; then a timeout's interrupt signal flies into a bar whose
// "write payment" segment is armored (uninterruptible) — the signal parks at
// the armor boundary, the write finishes, cleanup runs, then the fiber stops.
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
import type { CameraState, SceneState } from '../../core';
import { TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Bars — a fiber is a row of segments; a head channel 0..1 fills them left
// to right. Segment boundaries are where interruption is allowed to land.
// ---------------------------------------------------------------------------

type Seg = { label: string; w: number; armored?: boolean };

const RACE_PRIMARY: Seg[] = [
  { label: 'connect', w: 130 },
  { label: 'query main db', w: 240 },
  { label: 'decode rows', w: 150 },
  { label: 'reply', w: 120 },
];
const RACE_REPLICA: Seg[] = [
  { label: 'connect', w: 110 },
  { label: 'query replica', w: 180 },
  { label: 'decode rows', w: 120 },
  { label: 'reply', w: 100 },
];

const TIMEOUT_SEGS: Seg[] = [
  { label: 'open connection', w: 170 },
  { label: 'write payment', w: 280, armored: true },
  { label: 'commit', w: 150 },
  { label: 'reply', w: 140 },
];

const totalW = (segs: Seg[]) => segs.reduce((a, s) => a + s.w, 0);
const segX = (segs: Seg[], i: number, x0: number) =>
  x0 + segs.slice(0, i).reduce((a, s) => a + s.w, 0);

const P_X0 = 220;
const P_Y = 250;
const R_Y = 430;
const T_X0 = 200;
const T_Y = 380;
const BAR_H = 52;

// how far (0..1 of full width) the primary got when it was interrupted:
// mid "decode rows"
const P_STOP = (130 + 240 + 80) / totalW(RACE_PRIMARY);
// armor boundaries on the timeout bar, as fractions of full width
const ARMOR_START = 170 / totalW(TIMEOUT_SEGS);
const ARMOR_END = (170 + 280) / totalW(TIMEOUT_SEGS);

const TIMER = { cx: 1080, cy: 210, r: 42 };
// interrupt signal flight path: timer → left edge of the bar → along the bar
const SIG_DROP = 0.34; // fraction of signalU spent flying timer→bar
function signalPos(sigU: number, parkX: number): { x: number; y: number } {
  const barY = T_Y - 30;
  if (sigU < SIG_DROP) {
    const f = sigU / SIG_DROP;
    return {
      x: TIMER.cx + (T_X0 - TIMER.cx) * f,
      y: TIMER.cy + (barY - TIMER.cy) * (f * f),
    };
  }
  const f = (sigU - SIG_DROP) / (1 - SIG_DROP);
  return { x: T_X0 + (parkX - T_X0) * f, y: barY };
}

const CAM_WRITE: CameraState = { x: 490, y: 360, k: 1.55 };
const CAM_BAR: CameraState = { x: 640, y: 360, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline (~69s, 11 beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const raceU = tl.channel('raceU', 0); // race stage enters
  const pProgU = tl.channel('pProgU', 0); // primary fill 0..1
  const rProgU = tl.channel('rProgU', 0); // replica fill 0..1
  const winU = tl.channel('winU', 0); // replica wins (flag)
  const loseU = tl.channel('loseU', 0); // primary interrupted: pulse+shatter
  const raceOutU = tl.channel('raceOutU', 0); // race stage exits

  const barU = tl.channel('barU', 0); // timeout bar enters
  const timerU = tl.channel('timerU', 0); // TimerArc countdown 0..1
  const tProgU = tl.channel('tProgU', 0); // timeout bar fill
  const sigU = tl.channel('sigU', 0); // interrupt signal flight 0..1
  const errU = tl.channel('errU', 0); // Cause.TimeoutError chip
  const armorU = tl.channel('armorU', 0); // armor highlight
  const parkPulseU = tl.channel('parkPulseU', 0); // parked signal pulsing
  const enterU = tl.channel('enterU', 0); // armor lifts, signal enters
  const cleanU = tl.channel('cleanU', 0); // onInterrupt cleanup block
  const maskU = tl.channel('maskU', 0); // uninterruptibleMask inset
  const recapU = tl.channel('recapU', 0);

  // — beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: "Here's our request again, and a production truth: the fastest way to be slow is to keep waiting on a loser. So Effect lets computations race.",
  });
  tl.tween(raceU, 1, { at: 0.7, dur: 0.8, ease: ease.enter });

  // — beat 2 · race —
  tl.caption({
    at: 6.8,
    dur: 5.4,
    text: 'Race runs both fibers at once. The primary reads from the main database, the replica from a copy — first one back wins.',
  });
  tl.tween(pProgU, P_STOP, { at: 7.2, dur: 7.2, ease: ease.linear });
  tl.tween(rProgU, 1, { at: 7.2, dur: 6.2, ease: ease.linear });

  // — beat 3 · loser interrupted —
  tl.caption({
    at: 12.7,
    dur: 6.0,
    text: "The replica wins. The loser isn't abandoned, it's interrupted — its remaining work dissolves, and its resources come back immediately.",
  });
  tl.tween(winU, 1, { at: 13.5, dur: 0.5, ease: ease.pop });
  tl.tween(loseU, 1, { at: 14.3, dur: 1.8, ease: ease.move });

  // — beat 4 · timeout = race against a clock —
  tl.caption({
    at: 19.2,
    dur: 5.6,
    text: 'Same machinery, different trigger: a timeout. Give the call two seconds — behind the scenes, that is a race against a sleeping clock.',
  });
  tl.tween(raceOutU, 1, { at: 19.4, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_BAR, { at: 19.5, dur: 1.2, ease: ease.move });
  tl.tween(barU, 1, { at: 20.2, dur: 0.9, ease: ease.enter });
  tl.tween(timerU, 1, { at: 21.0, dur: 8.2, ease: ease.linear });
  tl.tween(tProgU, ARMOR_START + 0.13, { at: 21.0, dur: 8.4, ease: ease.linear });

  // — beat 5 · time's up —
  tl.caption({
    at: 25.2,
    dur: 5.4,
    text: "Time's up. The clock wins, the interrupt fires, and the failure channel reports a timeout error — a typed value you can handle, not an exception from nowhere.",
  });
  tl.tween(sigU, SIG_DROP + (1 - SIG_DROP) * 0.85, { at: 29.2, dur: 1.6, ease: ease.move });
  tl.tween(errU, 1, { at: 29.8, dur: 0.6, ease: ease.pop });

  // — beat 6 · mid payment write —
  tl.caption({
    at: 31.0,
    dur: 5.8,
    text: 'But look closer at what we almost interrupted — the fiber is mid payment write. Kill it halfway, and you corrupt real money.',
  });
  tl.tween(cam, CAM_WRITE, { at: 31.4, dur: 1.5, ease: ease.move });
  tl.tween(tProgU, ARMOR_START + 0.16, { at: 31.0, dur: 5.8, ease: ease.linear });

  // — beat 7 · uninterruptible armor —
  tl.caption({
    at: 37.2,
    dur: 6.0,
    text: "So this section is marked uninterruptible. The interrupt doesn't vanish — it parks at the boundary and waits for the critical section to finish.",
  });
  tl.tween(armorU, 1, { at: 37.6, dur: 1.0, ease: ease.draw });
  tl.tween(sigU, 1, { at: 39.0, dur: 1.0, ease: ease.move });
  tl.tween(parkPulseU, 1, { at: 40.0, dur: 3.0, ease: ease.linear });

  // — beat 8 · the write completes —
  tl.caption({
    at: 43.6,
    dur: 5.2,
    text: 'The write commits. The armor ends, the parked interrupt proceeds, and the fiber begins its shutdown.',
  });
  tl.tween(tProgU, ARMOR_END, { at: 43.8, dur: 2.6, ease: ease.linear });
  tl.tween(enterU, 1, { at: 46.8, dur: 1.2, ease: ease.move });

  // — beat 9 · onInterrupt cleanup —
  tl.caption({
    at: 49.2,
    dur: 5.6,
    text: 'On interrupt, cleanup runs: release the connection, roll back what should not survive. Interruption is a negotiated stop, not a bullet.',
  });
  tl.tween(cleanU, 1, { at: 49.8, dur: 2.2, ease: ease.move });
  tl.tween(cam, CAM_BAR, { at: 52.0, dur: 1.4, ease: ease.move });

  // — beat 10 · uninterruptibleMask —
  tl.caption({
    at: 55.2,
    dur: 5.8,
    text: 'Need armor with a window? The uninterruptible mask restores interruptibility exactly where you choose — long waits stay cancellable inside a protected region.',
  });
  tl.tween(maskU, 1, { at: 55.8, dur: 1.0, ease: ease.enter });

  // — beat 11 · recap —
  tl.caption({
    at: 61.4,
    dur: 6.4,
    text: 'That is the contract: cancellation happens between steps, critical sections finish, cleanup always runs. Which means you can cancel aggressively — and retry fearlessly.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 61.5, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 62.2, dur: 0.9, ease: ease.enter });
  tl.hold(67.0, 1.0);

  return {
    tl,
    cam,
    raceU,
    pProgU,
    rProgU,
    winU,
    loseU,
    raceOutU,
    barU,
    timerU,
    tProgU,
    sigU,
    errU,
    armorU,
    parkPulseU,
    enterU,
    cleanU,
    maskU,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function SegBar({
  segs,
  x0,
  y,
  prog,
  loseU = 0,
  armorU = 0,
  label,
  color,
}: {
  segs: Seg[];
  x0: number;
  y: number;
  prog: number; // 0..1 fill of total width
  loseU?: number; // interrupted: unexecuted segments dissolve
  armorU?: number;
  label?: string;
  color: string;
}) {
  const W = totalW(segs);
  const headX = x0 + W * clamp01(prog);
  return (
    <g>
      {label && (
        <text x={x0} y={y - 14} fill={color} fontSize={14} fontFamily={MONO}>
          {label}
        </text>
      )}
      {segs.map((seg, i) => {
        const sx = segX(segs, i, x0);
        const filled = clamp01((headX - sx) / seg.w);
        const unexecuted = filled <= 0.001;
        // dissolve: unexecuted segments drift down + fade when interrupted
        const dy = unexecuted ? loseU * 26 : 0;
        const op = unexecuted ? 1 - loseU * 0.9 : 1;
        const armored = seg.armored && armorU > 0.01;
        return (
          <g key={i} opacity={op} transform={`translate(0 ${dy})`}>
            <rect x={sx + 2} y={y - BAR_H / 2} width={seg.w - 4} height={BAR_H} rx={9} fill={colors.PANEL} stroke={armored ? colors.WARM : colors.GRID} strokeWidth={armored ? 2.4 : 1.2} />
            {filled > 0 && (
              <rect x={sx + 2} y={y - BAR_H / 2} width={(seg.w - 4) * filled} height={BAR_H} rx={9} fill={color} opacity={0.3} />
            )}
            {armored && (
              <g opacity={armorU}>
                {Array.from({ length: Math.floor(seg.w / 18) }, (_, k) => (
                  <line
                    key={k}
                    x1={sx + 8 + k * 18}
                    y1={y - BAR_H / 2 + 3}
                    x2={sx + 8 + k * 18 + 9}
                    y2={y + BAR_H / 2 - 3}
                    stroke={colors.WARM}
                    strokeWidth={1.2}
                    opacity={0.4}
                  />
                ))}
              </g>
            )}
            <text x={sx + seg.w / 2} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
              {seg.label}
            </text>
          </g>
        );
      })}
      {prog > 0.001 && prog < 0.999 && loseU < 0.5 && (
        <circle cx={headX} cy={y} r={5.5} fill={color} />
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const raceU = s.get(scene.raceU);
  const pProgU = s.get(scene.pProgU);
  const rProgU = s.get(scene.rProgU);
  const winU = s.get(scene.winU);
  const loseU = s.get(scene.loseU);
  const raceOutU = s.get(scene.raceOutU);
  const barU = s.get(scene.barU);
  const timerU = s.get(scene.timerU);
  const tProgU = s.get(scene.tProgU);
  const sigU = s.get(scene.sigU);
  const errU = s.get(scene.errU);
  const armorU = s.get(scene.armorU);
  const parkPulseU = s.get(scene.parkPulseU);
  const enterU = s.get(scene.enterU);
  const cleanU = s.get(scene.cleanU);
  const maskU = s.get(scene.maskU);
  const recapU = s.get(scene.recapU);

  const raceOp = raceU * (1 - raceOutU);

  // the parked interrupt: sits at the armor boundary, pulsing; when enterU
  // rises it slides to the end of the armored segment (the stop point)
  const armorX = T_X0 + totalW(TIMEOUT_SEGS) * ARMOR_START;
  const armorEndX = T_X0 + totalW(TIMEOUT_SEGS) * ARMOR_END;
  const sig = signalPos(sigU, armorX);
  const sigX = sig.x + (armorEndX - armorX) * enterU;
  const sigY = sig.y + (T_Y - 30 - sig.y) * 0; // stays on the approach lane
  const pulse = parkPulseU > 0 && enterU < 0.05 ? 1 + 0.35 * Math.abs(Math.sin(parkPulseU * Math.PI * 6)) : 1;
  const stageDim = 1 - recapU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ---------------- the race ---------------- */}
          {raceOp > 0.01 && (
            <g opacity={raceOp}>
              <text x={640} y={120} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
                Effect.race(primary, replica)
              </text>
              <SegBar segs={RACE_PRIMARY} x0={P_X0} y={P_Y} prog={pProgU} loseU={loseU} label="primary" color={colors.ACCENT} />
              <SegBar segs={RACE_REPLICA} x0={P_X0} y={R_Y} prog={rProgU} label="replica" color={colors.POSITIVE} />
              {/* winner flag */}
              {winU > 0.01 && (
                <g opacity={winU}>
                  <circle cx={P_X0 + totalW(RACE_REPLICA) + 26} cy={R_Y} r={11} fill={colors.POSITIVE} />
                  <text x={P_X0 + totalW(RACE_REPLICA) + 46} y={R_Y + 5} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                    wins
                  </text>
                </g>
              )}
              {/* interrupt pulse into the primary */}
              {loseU > 0.01 && (
                <g>
                  <circle
                    cx={P_X0 + totalW(RACE_PRIMARY) * P_STOP * Math.min(1, loseU * 1.4)}
                    cy={P_Y}
                    r={6}
                    fill={colors.NEGATIVE}
                    opacity={loseU < 0.9 ? 0.95 : 0}
                  />
                  <text x={P_X0 + totalW(RACE_PRIMARY) * P_STOP + 12} y={P_Y - 34} fill={colors.NEGATIVE} fontSize={13} opacity={clamp01(loseU * 1.5)}>
                    interrupted
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- the timeout ---------------- */}
          {barU > 0.01 && (
            <g opacity={barU}>
              <text x={T_X0} y={150} fill={colors.TEXT} fontSize={17} fontFamily={MONO}>
                {'Effect.timeout(call, "2 seconds")'}
              </text>
              <TimerArc cx={TIMER.cx} cy={TIMER.cy} r={TIMER.r} u={timerU} color={timerU >= 1 ? colors.NEGATIVE : colors.WARM} />
              <text x={TIMER.cx} y={TIMER.cy + TIMER.r + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                the clock fiber
              </text>
              <SegBar segs={TIMEOUT_SEGS} x0={T_X0} y={T_Y} prog={tProgU} armorU={armorU} label="fiber · handle payment" color={colors.ACCENT} />

              {/* armor bracket + label */}
              {armorU > 0.01 && (
                <g opacity={armorU}>
                  <path
                    d={`M${armorX + 2} ${T_Y + BAR_H / 2 + 12} h${armorEndX - armorX - 4}`}
                    stroke={colors.WARM}
                    strokeWidth={2}
                    fill="none"
                  />
                  <text x={(armorX + armorEndX) / 2} y={T_Y + BAR_H / 2 + 34} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily={MONO}>
                    Effect.uninterruptible
                  </text>
                </g>
              )}

              {/* the interrupt signal */}
              {sigU > 0.01 && cleanU < 0.9 && (
                <g>
                  <circle cx={sigX} cy={sigY} r={7 * pulse} fill={colors.NEGATIVE} opacity={0.95} />
                  {parkPulseU > 0.05 && enterU < 0.05 && (
                    <text x={sigX} y={sigY - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} opacity={clamp01(parkPulseU * 2)}>
                      interrupt · waiting
                    </text>
                  )}
                </g>
              )}

              {/* TimeoutError chip */}
              {errU > 0.01 && (
                <g opacity={errU}>
                  <rect x={886} y={300} width={264} height={40} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} />
                  <text x={1018} y={325} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14.5} fontFamily={MONO}>
                    E = Cause.TimeoutError
                  </text>
                </g>
              )}

              {/* onInterrupt cleanup block */}
              {cleanU > 0.01 && (
                <g opacity={clamp01(cleanU * 1.6)}>
                  <rect x={armorEndX + 6} y={T_Y - BAR_H / 2} width={128 * clamp01(cleanU * 1.3)} height={BAR_H} rx={9} fill={colors.POSITIVE} opacity={0.24} />
                  <rect x={armorEndX + 6} y={T_Y - BAR_H / 2} width={128} height={BAR_H} rx={9} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} strokeDasharray="4 4" />
                  <text x={armorEndX + 70} y={T_Y - 2} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                    onInterrupt
                  </text>
                  <text x={armorEndX + 70} y={T_Y + 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>
                    release conn
                  </text>
                  {cleanU > 0.9 && (
                    <g stroke={colors.NEGATIVE} strokeWidth={2.5} strokeLinecap="round" opacity={clamp01((cleanU - 0.9) * 10)}>
                      <line x1={armorEndX + 142} y1={T_Y - 8} x2={armorEndX + 158} y2={T_Y + 8} />
                      <line x1={armorEndX + 142} y1={T_Y + 8} x2={armorEndX + 158} y2={T_Y - 8} />
                    </g>
                  )}
                </g>
              )}

              {/* uninterruptibleMask inset */}
              {maskU > 0.01 && (
                <g opacity={maskU}>
                  <rect x={280} y={508} width={720} height={92} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={300} y={536} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    Effect.uninterruptibleMask((restore) =&gt; ...)
                  </text>
                  {/* armored bar with a restored window */}
                  <rect x={300} y={552} width={300} height={26} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                  <rect x={396} y={552} width={98} height={26} rx={6} fill={colors.ACCENT} opacity={0.25} />
                  <rect x={396} y={552} width={98} height={26} rx={6} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray="4 3" />
                  <text x={445} y={569} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
                    restore(wait)
                  </text>
                  <text x={620} y={569} fill={colors.MUTED} fontSize={12}>
                    ← a cancellable window inside the armor
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---------------- recap ---------------- */}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <rect x={330} y={262} width={620} height={170} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
              the interruption contract
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
              cancellation lands between steps
            </text>
            <text x={640} y={374} textAnchor="middle" fill={colors.WARM} fontSize={15}>
              critical sections always finish
            </text>
            <text x={640} y={402} textAnchor="middle" fill={colors.POSITIVE} fontSize={15}>
              cleanup always runs
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
