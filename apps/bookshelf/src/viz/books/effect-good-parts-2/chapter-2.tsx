// Reasons Within
//
// Grounding: ai-docs/src/01_effect/04_errors/20_reason-errors.ts — AiError
// wraps reason: Schema.Union([RateLimitError, QuotaExceededError,
// SafetyBlockedError]); recovery via Effect.catchReason("AiError",
// "RateLimitError", handler, catchAll), Effect.catchReasons, and
// Effect.unwrapReason("AiError") + Effect.catchTags.
// ai-docs/src/51_http-server/fixtures/domain/UserErrors.ts — UsersError wraps
// UserNotFound (httpApiStatus 404) and SearchQueryTooShort (httpApiStatus 422).
//
// Centerpiece: a capsule-cracking machine. The AiError shell capsule rolls
// down the error rail with its reason visible through a window; catchReason
// reaches THROUGH the shell for one tagged reason; unwrapReason cracks the
// shell so the whole inner union stands on the rail as ordinary tagged
// errors, ready for catchTags.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const SIG = { x: 250, y: 78, w: 780, h: 64 } as const;
const SIG_CY = SIG.y + SIG.h / 2;

const RAIL_Y = 470;
const RAIL_X0 = 120;
const RAIL_X1 = 1160;

// crowded E-slot chips (beat 1) — squeezed and overlapping
const CROWD = [
  { label: 'RateLimitError', x: 496 },
  { label: 'QuotaExceededError', x: 610 },
  { label: 'SafetyBlockedError', x: 736 },
] as const;
const CROWD_W = 132;

const REASONS = ['RateLimitError', 'QuotaExceededError', 'SafetyBlockedError'] as const;
const REASON_HANDLERS = ['back off, retry later', 'raise the quota', 'log the category'] as const;

const ST_MODEL = { cx: 226, w: 168, h: 50 } as const; // callModel station
const ST_CATCH = { cx: 690, w: 268, h: 88 } as const; // catchReason station (below rail)
const CAPSULE_STOP = 690; // where the shell parks under the scanner
const CRACK_X = 560; // where the second capsule gets cracked

// bare reason capsules after the crack + their handler docks
const SPILL_X = [420, 660, 900] as const;

const HTTP = { x: 360, y: 236, w: 560, h: 168 } as const;

const CAM_SIG: CameraState = { x: 640, y: 150, k: 1.5 };
const CAM_WRAP: CameraState = { x: 640, y: 268, k: 1.24 };
const CAM_RAIL: CameraState = { x: 560, y: 440, k: 1.22 };
const CAM_STATION: CameraState = { x: 700, y: 452, k: 1.34 };
const CAM_CRACK: CameraState = { x: 640, y: 462, k: 1.18 };
const CAM_HTTP: CameraState = { x: 640, y: 320, k: 1.18 };

// ---------------------------------------------------------------------------
// Timeline (~71s, nine beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SIG, cameraInterp);

  const crowdU = tl.channel('crowdU', 0); // overflowing E slot
  const wrapU = tl.channel('wrapU', 0); // chips fly into the AiError shell
  const railU = tl.channel('railU', 0); // error rail + callModel station
  const rollU = tl.channel('rollU', 0); // shell capsule rolls to the station
  const armU = tl.channel('armU', 0); // catchReason: keys light, reason plucked
  const sweepU = tl.channel('sweepU', 0); // catch-all tray sweeps ghost reasons
  const resetU = tl.channel('resetU', 0); // phase-one station + capsule fade
  const roll2U = tl.channel('roll2U', 0); // second capsule rolls to the cracker
  const crackU = tl.channel('crackU', 0); // wedges close, shell splits, spill
  const tagsU = tl.channel('tagsU', 0); // catchTags handlers dock, staggered
  const httpU = tl.channel('httpU', 0); // UsersError web-service panel
  const endU = tl.channel('endU', 0); // closing: chip alone, R slot pulses

  // — beat 1 · honesty gets crowded —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'The error channel is honest, and honesty gets crowded. One model call can fail as a rate limit, a quota, a safety block — and every caller drags the whole list around in its type.',
  });
  tl.tween(crowdU, 1, { at: 0.8, dur: 1.8, ease: ease.linear });

  // — beat 2 · the wrapper —
  tl.caption({
    at: 7.6,
    dur: 7.0,
    text: 'So you wrap them. One tagged error, the AI error, carries a reason field inside — itself a tagged union of the deeper causes. The signature stays one entry long.',
  });
  tl.tween(cam, CAM_WRAP, { at: 7.8, dur: 1.3, ease: ease.move });
  tl.tween(wrapU, 1, { at: 8.4, dur: 1.7, ease: ease.move });

  // — beat 3 · out rolls one error —
  tl.caption({
    at: 15.2,
    dur: 7.2,
    text: 'Now call the model and let it fail. Out rolls a single AI error. Look through the shell: the reason inside is a rate limit, and it knows how long to wait — thirty seconds.',
  });
  tl.tween(cam, CAM_RAIL, { at: 15.4, dur: 1.3, ease: ease.move });
  tl.tween(railU, 1, { at: 15.6, dur: 1.3, ease: ease.draw });
  tl.tween(rollU, 1, { at: 17.2, dur: 2.4, ease: ease.linear });

  // — beat 4 · catchReason: reach through the shell —
  tl.caption({
    at: 23.0,
    dur: 8.0,
    text: 'Catch reason takes two tags: the parent error, then the reason within. The handler receives the inner value directly — you reach through the shell without ever unpacking it yourself.',
  });
  tl.tween(cam, CAM_STATION, { at: 23.2, dur: 1.3, ease: ease.move });
  tl.tween(armU, 1, { at: 24.0, dur: 3.0, ease: ease.move });

  // — beat 5 · the catch-all sweep —
  tl.caption({
    at: 31.6,
    dur: 6.0,
    text: 'An optional second handler sweeps every other reason, so nothing slips past unhandled.',
  });
  tl.tween(sweepU, 1, { at: 32.0, dur: 2.4, ease: ease.move });

  // — beat 6 · unwrapReason: crack the shell —
  tl.caption({
    at: 38.2,
    dur: 8.2,
    text: 'Or crack the shell entirely. Unwrap reason lifts the inner union out into the error channel itself — the shell is gone, and the three causes stand on the rail as ordinary tagged errors.',
  });
  tl.tween(resetU, 1, { at: 38.4, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_CRACK, { at: 38.6, dur: 1.4, ease: ease.move });
  tl.tween(roll2U, 1, { at: 38.9, dur: 1.8, ease: ease.linear });
  tl.tween(crackU, 1, { at: 41.0, dur: 2.8, ease: ease.move });

  // — beat 7 · ordinary tools —
  tl.caption({
    at: 47.0,
    dur: 7.4,
    text: 'And ordinary errors get ordinary tools: catch tags handles each cause on its own terms. Back off for the rate limit, raise the quota, log the safety block.',
  });
  tl.tween(tagsU, 1, { at: 47.6, dur: 2.6, ease: ease.linear });

  // — beat 8 · the same shape, at the edge —
  tl.caption({
    at: 55.0,
    dur: 8.0,
    text: 'The same shape organizes a web service. A user lookup wraps its failure modes, user not found and search query too short, in one users error — and each reason still remembers its own status code.',
  });
  tl.tween(cam, CAM_HTTP, { at: 55.2, dur: 1.4, ease: ease.move });
  tl.tween(httpU, 1, { at: 55.8, dur: 1.2, ease: ease.enter });

  // — beat 9 · payoff + teaser —
  tl.caption({
    at: 63.6,
    dur: 7.0,
    text: 'Errors as values, organized like values: flat when you want breadth, nested when you want order. Next, the quiet blue slot — what a program needs before it can run.',
  });
  tl.tween(cam, CAM_SIG, { at: 64.0, dur: 1.5, ease: ease.move });
  tl.tween(endU, 1, { at: 64.4, dur: 1.4, ease: ease.move });
  tl.hold(70.6, 1.2);

  return { tl, cam, crowdU, wrapU, railU, rollU, armU, sweepU, resetU, roll2U, crackU, tagsU, httpU, endU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function TagChip({
  cx,
  cy,
  w,
  label,
  color,
  opacity,
  h = 28,
  fs = 11,
  dashed = false,
}: {
  cx: number;
  cy: number;
  w: number;
  label: string;
  color: string;
  opacity: number;
  h?: number;
  fs?: number;
  dashed?: boolean;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={7}
        fill={colors.BG}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      <text x={cx} y={cy + fs * 0.36} textAnchor="middle" fill={color} fontSize={fs} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

/** The AiError shell capsule with its reason window. */
function Shell({
  cx,
  cy,
  u,
  reason,
  sub,
  split = 0,
}: {
  cx: number;
  cy: number;
  u: number;
  reason: string;
  sub?: string;
  split?: number;
}) {
  if (u <= 0.01) return null;
  const w = 196;
  const h = 58;
  const dx = split * 70;
  const halfOp = 1 - 0.85 * split;
  return (
    <g opacity={u}>
      {/* two shell halves (they separate when split > 0) */}
      <g transform={`translate(${-dx} 0) rotate(${-8 * split} ${cx} ${cy})`} opacity={halfOp}>
        <path d={`M${cx} ${cy - h / 2} h${-w / 2 + 16} a16 16 0 0 0 -16 16 v${h - 32} a16 16 0 0 0 16 16 h${w / 2 - 16}`} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
      </g>
      <g transform={`translate(${dx} 0) rotate(${8 * split} ${cx} ${cy})`} opacity={halfOp}>
        <path d={`M${cx} ${cy - h / 2} h${w / 2 - 16} a16 16 0 0 1 16 16 v${h - 32} a16 16 0 0 1 -16 16 h${-w / 2 + 16}`} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
      </g>
      <text x={cx - w / 2 + 10} y={cy - h / 2 - 6} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO} opacity={halfOp}>
        AiError
      </text>
      {/* the reason window */}
      <g opacity={1 - split}>
        <rect x={cx - 70} y={cy - 16} width={140} height={32} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
        <text x={cx} y={cy - 3} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
          {reason}
        </text>
        {sub && (
          <text x={cx} y={cy + 11} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
            {sub}
          </text>
        )}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const crowdU = s.get(scene.crowdU);
  const wrapU = s.get(scene.wrapU);
  const railU = s.get(scene.railU);
  const rollU = s.get(scene.rollU);
  const armU = s.get(scene.armU);
  const sweepU = s.get(scene.sweepU);
  const resetU = s.get(scene.resetU);
  const roll2U = s.get(scene.roll2U);
  const crackU = s.get(scene.crackU);
  const tagsU = s.get(scene.tagsU);
  const httpU = s.get(scene.httpU);
  const endU = s.get(scene.endU);

  // global dims
  const phase1Dim = clamp01(resetU + httpU + endU); // first capsule + catchReason gear
  const railDim = clamp01(httpU + endU); // whole rail layer at the end
  const spillDim = railDim;

  // shell #1 position (rolls out of callModel to the station)
  const sh1x = lerp(ST_MODEL.cx + 110, CAPSULE_STOP, rollU);

  // catchReason arm: pluck the inner reason and lift it to the handler output
  const pluck = clamp01((armU - 0.35) / 0.65);
  const keyGlow = clamp01(armU / 0.35);
  const outY = lerp(RAIL_Y, 356, pluck);

  // shell #2 (the one that gets cracked)
  const sh2x = lerp(RAIL_X0 + 60, CRACK_X, roll2U);
  const wedge = clamp01(crackU / 0.4);
  const split = clamp01((crackU - 0.4) / 0.6);

  // signature E-slot state
  const eCrowd = crowdU * (1 - wrapU);
  const eWrapped = wrapU * (1 - split);
  const eSpilled = split * (1 - endU);
  const eFinal = endU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- the live signature ---------------- */}
        <g>
          <rect x={SIG.x} y={SIG.y} width={SIG.w} height={SIG.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={SIG.x + 30} y={SIG_CY + 6} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>
            Effect&lt;
          </text>
          <TagChip cx={422} cy={SIG_CY} w={82} label="string" color={colors.POSITIVE} opacity={1} fs={12.5} />
          <text x={470} y={SIG_CY + 5} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
            ,
          </text>
          {/* E slot, four states */}
          {CROWD.map((c, i) => (
            <TagChip
              key={c.label}
              cx={c.x + 8 * Math.sin(i * 2.1)}
              cy={SIG_CY + (i % 2 === 0 ? -4 : 5)}
              w={CROWD_W}
              label={c.label}
              color={colors.NEGATIVE}
              opacity={eCrowd * clamp01(crowdU * 3 - i)}
              fs={9.5}
            />
          ))}
          <TagChip cx={618} cy={SIG_CY} w={216} label="AiError { reason }" color={colors.NEGATIVE} opacity={Math.max(eWrapped, eFinal)} fs={12.5} />
          {REASONS.map((r, i) => (
            <TagChip key={r} cx={530 + i * 122} cy={SIG_CY} w={116} label={r} color={colors.NEGATIVE} opacity={eSpilled} fs={8.5} />
          ))}
          <text x={866} y={SIG_CY + 5} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
            ,
          </text>
          <g>
            <TagChip cx={928} cy={SIG_CY} w={70} label="never" color={colors.ACCENT} opacity={0.38 + 0.5 * endU} fs={12} />
            {endU > 0.5 && (
              <circle cx={928} cy={SIG_CY} r={40 + 10 * Math.sin(Math.PI * clamp01(endU))} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} opacity={0.5 * endU} />
            )}
          </g>
          <text x={SIG.x + SIG.w - 26} y={SIG_CY + 6} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>
            &gt;
          </text>
          {endU > 0.3 && (
            <text x={928} y={SIG.y + SIG.h + 20} textAnchor="middle" fill={colors.ACCENT} fontSize={12} opacity={endU}>
              R · what the program needs
            </text>
          )}
        </g>

        {/* ---------------- beat 2: chips fly into the shell schema card ---------------- */}
        {wrapU > 0.01 && railU < 0.99 && (
          <g opacity={wrapU * (1 - railU)}>
            <rect x={430} y={230} width={420} height={150} rx={18} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
            <text x={452} y={258} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO} fontWeight={600}>
              AiError
            </text>
            <text x={452} y={282} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              reason: Schema.Union([
            </text>
            {REASONS.map((r, i) => {
              const u = clamp01(wrapU * 2.2 - i * 0.35 - 0.4);
              // fly from the crowded chip position down into the card
              const fx = lerp(CROWD[i].x, 640, u);
              const fy = lerp(SIG_CY, 306 + i * 24, u);
              return (
                <text key={r} x={fx} y={fy} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO} opacity={0.4 + 0.6 * u}>
                  {r}
                </text>
              );
            })}
            <text x={452} y={372} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              ])
            </text>
          </g>
        )}

        {/* ---------------- the error rail ---------------- */}
        {railU > 0.01 && (
          <g opacity={1 - 0.88 * railDim}>
            <line x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X0 + (RAIL_X1 - RAIL_X0) * railU} y2={RAIL_Y} stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.65} />
            <text x={RAIL_X0} y={RAIL_Y - 14} fill={colors.NEGATIVE} fontSize={12.5} opacity={railU}>
              error channel
            </text>
            {/* callModel station */}
            <rect x={ST_MODEL.cx - ST_MODEL.w / 2} y={RAIL_Y - ST_MODEL.h / 2} width={ST_MODEL.w} height={ST_MODEL.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={ST_MODEL.cx} y={RAIL_Y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              callModel
            </text>

            {/* ------- phase 1: shell #1 + catchReason station ------- */}
            <g opacity={1 - 0.88 * phase1Dim}>
              {rollU > 0.01 && (
                <g>
                  <Shell cx={sh1x} cy={RAIL_Y} u={clamp01(rollU * 4)} reason="RateLimitError" sub="retryAfter: 30" />
                  {/* the plucked inner reason rising to the handler */}
                  {pluck > 0.01 && (
                    <g>
                      <line x1={CAPSULE_STOP} y1={RAIL_Y - 20} x2={CAPSULE_STOP} y2={outY + 16} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="2 5" />
                      <TagChip cx={CAPSULE_STOP} cy={outY} w={190} label={pluck > 0.75 ? 'Retry after 30 seconds' : 'RateLimitError'} color={pluck > 0.75 ? colors.POSITIVE : colors.WARM} opacity={1} h={32} fs={11} />
                    </g>
                  )}
                </g>
              )}
              {armU > 0.005 && (
                <g>
                  <rect x={ST_CATCH.cx - ST_CATCH.w / 2} y={RAIL_Y + 34} width={ST_CATCH.w} height={ST_CATCH.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={ST_CATCH.cx} y={RAIL_Y + 58} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                    Effect.catchReason
                  </text>
                  <TagChip cx={ST_CATCH.cx - 60} cy={RAIL_Y + 82} w={92} label={'"AiError"'} color={keyGlow > 0.4 ? colors.WARM : colors.MUTED} opacity={1} h={22} fs={9.5} />
                  <TagChip cx={ST_CATCH.cx + 62} cy={RAIL_Y + 82} w={128} label={'"RateLimitError"'} color={keyGlow > 0.8 ? colors.WARM : colors.MUTED} opacity={1} h={22} fs={9.5} />
                  <text x={ST_CATCH.cx} y={RAIL_Y + 110} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={pluck}>
                    (reason) =&gt; Effect.succeed(…)
                  </text>
                </g>
              )}
              {/* catch-all tray sweeping the ghost reasons */}
              {sweepU > 0.01 && (
                <g opacity={clamp01(sweepU * 2)}>
                  <rect x={952} y={RAIL_Y + 34} width={196} height={54} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeDasharray="5 4" />
                  <text x={1050} y={RAIL_Y + 56} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                    catch-all handler
                  </text>
                  <text x={1050} y={RAIL_Y + 74} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontStyle="italic">
                    every other reason
                  </text>
                  {(['QuotaExceededError', 'SafetyBlockedError'] as const).map((r, i) => {
                    const u = clamp01(sweepU * 1.6 - i * 0.3);
                    return (
                      <TagChip
                        key={r}
                        cx={lerp(sh1x + 40, 1050, u)}
                        cy={lerp(RAIL_Y, RAIL_Y - 26 - i * 30, u)}
                        w={128}
                        label={r}
                        color={colors.MUTED}
                        opacity={0.7 * u * (1 - 0.5 * clamp01(u * 4 - 3))}
                        h={24}
                        fs={9}
                        dashed
                      />
                    );
                  })}
                </g>
              )}
            </g>

            {/* ------- phase 2: unwrapReason cracks shell #2 ------- */}
            {roll2U > 0.01 && (
              <g opacity={1 - 0.88 * spillDim}>
                {split < 0.98 && <Shell cx={sh2x} cy={RAIL_Y} u={clamp01(roll2U * 4)} reason="reason: …" split={split} />}
                {/* the cracker wedges */}
                {wedge > 0.02 && split < 0.9 && (
                  <g opacity={1 - split}>
                    <path d={`M${CRACK_X - 8} ${RAIL_Y - 92} l8 44 l8 -44 z`} fill={colors.ACCENT} opacity={wedge} transform={`translate(0 ${18 * wedge})`} />
                    <text x={CRACK_X} y={RAIL_Y - 100} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO} opacity={wedge}>
                      Effect.unwrapReason(&quot;AiError&quot;)
                    </text>
                  </g>
                )}
                {/* the spilled union */}
                {split > 0.05 &&
                  REASONS.map((r, i) => {
                    const u = clamp01(split * 1.5 - i * 0.18);
                    return (
                      <g key={r}>
                        <TagChip cx={lerp(CRACK_X, SPILL_X[i], u)} cy={RAIL_Y} w={150} label={r} color={colors.NEGATIVE} opacity={u} h={36} fs={10.5} />
                        {/* catchTags handler docks */}
                        {tagsU > 0.01 && (
                          <g opacity={clamp01(tagsU * 2.4 - i * 0.55)}>
                            <line x1={SPILL_X[i]} y1={RAIL_Y + 20} x2={SPILL_X[i]} y2={RAIL_Y + 44} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="2 4" />
                            <TagChip cx={SPILL_X[i]} cy={RAIL_Y + 62} w={160} label={REASON_HANDLERS[i]} color={colors.POSITIVE} opacity={1} h={30} fs={10} />
                          </g>
                        )}
                      </g>
                    );
                  })}
                {tagsU > 0.3 && (
                  <text x={640} y={RAIL_Y + 106} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={clamp01(tagsU * 2 - 0.6) * (1 - spillDim)}>
                    Effect.catchTags
                  </text>
                )}
              </g>
            )}
          </g>
        )}

        {/* ---------------- beat 8: the UsersError web-service panel ---------------- */}
        {httpU > 0.01 && (
          <g opacity={httpU * (1 - 0.9 * endU)}>
            <rect x={HTTP.x} y={HTTP.y} width={HTTP.w} height={HTTP.h} rx={18} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
            <text x={HTTP.x + 24} y={HTTP.y + 30} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO} fontWeight={600}>
              UsersError
            </text>
            <text x={HTTP.x + 24} y={HTTP.y + 52} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              reason: Schema.Union([
            </text>
            <g>
              <TagChip cx={HTTP.x + 170} cy={HTTP.y + 92} w={170} label="UserNotFound" color={colors.WARM} opacity={clamp01(httpU * 2 - 0.3)} h={34} fs={11.5} />
              <TagChip cx={HTTP.x + 170 + 118} cy={HTTP.y + 92} w={54} label="404" color={colors.NEGATIVE} opacity={clamp01(httpU * 2 - 0.5)} h={24} fs={11} />
              <TagChip cx={HTTP.x + 170} cy={HTTP.y + 134} w={198} label="SearchQueryTooShort" color={colors.WARM} opacity={clamp01(httpU * 2 - 0.7)} h={34} fs={10.5} />
              <TagChip cx={HTTP.x + 170 + 132} cy={HTTP.y + 134} w={54} label="422" color={colors.NEGATIVE} opacity={clamp01(httpU * 2 - 0.9)} h={24} fs={11} />
            </g>
            <text x={HTTP.x + HTTP.w - 24} y={HTTP.y + HTTP.h - 16} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              httpApiStatus · one wrapper per surface
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
