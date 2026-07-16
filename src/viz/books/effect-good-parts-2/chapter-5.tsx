// The Scope Closes
//
// Grounding: ai-docs/src/01_effect/05_resources/10_acquire-release.ts — Smtp
// layer acquires the nodemailer transporter with Effect.acquireRelease(create,
// close) inside Layer.effect; Mailer stacks on Smtp. 20_layer-side-effects.ts
// — Layer.effectDiscard + Effect.forkScoped heartbeat (sleep "5 seconds"),
// onInterrupt logs "Background task interrupted: layer scope closed".
// 30_layer-map.ts — LayerMap.Service "app/PoolMap": one DatabasePool layer per
// tenant (acme / globex in the example), idleTimeToLive: "1 minute", release
// logs "Closing tenant pool". packages/effect/src/unstable/cluster/internal/
// resourceMap.ts — Scope.addFinalizerExit((exit) => …): finalizers receive
// the exit value.
//
// Centerpiece: the scope as a living bracket around the run, with a FINALIZER
// STACK bolted to its wall. Every acquire pushes a plate; the closing scope
// pops them in reverse (last acquired, first released). A forked heartbeat
// ring spins until the bracket closes and is interrupted mid-sleep; tenant
// pools carry idle timers that pop their plates early. Ends on the whole-book
// recap: A, E, R — and the scope around all of it.
import {
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
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const FRAME = { x: 140, y: 200, w: 1000, h: 390 } as const; // the scope bracket

const MAILER = { x: 196, y: 252, w: 300, h: 86 } as const;
const SMTP = { x: 196, y: 396, w: 300, h: 104 } as const;

const STACK_X = 856;
const STACK_W = 250;
const STACK_Y0 = 508; // bottom plate
const PLATE_H = 40;

const DOOR = { cx: 660, y: FRAME.y + FRAME.h } as const;

const RING = { cx: 600, cy: 318, r: 46 } as const;

const POOLS = [
  { label: 'DatabasePool · acme', x: 220 },
  { label: 'DatabasePool · globex', x: 500 },
] as const;
const POOL_Y = 300;

const RECAP = { x: 280, y: 268, w: 720, h: 96 } as const;
const RECAP_CY = RECAP.y + 44;

const CAM_OPEN: CameraState = { x: 640, y: 330, k: 1.22 };
const CAM_SCOPE: CameraState = { x: 640, y: 392, k: 1.02 };
const CAM_STACK: CameraState = { x: 850, y: 430, k: 1.24 };
const CAM_DOOR: CameraState = { x: 660, y: 470, k: 1.2 };
const CAM_RING: CameraState = { x: 620, y: 350, k: 1.26 };
const CAM_POOLS: CameraState = { x: 480, y: 350, k: 1.22 };
const CAM_RECAP: CameraState = { x: 640, y: 330, k: 1.28 };

// ---------------------------------------------------------------------------
// Timeline (~76s, ten beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);

  const leakU = tl.channel('leakU', 0); // naive program + crash + orphan
  const crashU = tl.channel('crashU', 0);
  const scopeU = tl.channel('scopeU', 0); // the bracket draws on
  const acq1U = tl.channel('acq1U', 0); // Smtp transporter + plate 1
  const acq2U = tl.channel('acq2U', 0); // Mailer + plate 2
  const popU = tl.channel('popU', 0); // LIFO teardown wave
  const exitU = tl.channel('exitU', 0); // three endings, one door
  const ringU = tl.channel('ringU', 0); // heartbeat ring appears
  const spinU = tl.channel('spinU', 0); // dash rotation (linear)
  const cutU = tl.channel('cutU', 0); // interrupt flash + log line
  const poolU = tl.channel('poolU', 0); // tenant pools appear
  const timerU = tl.channel('timerU', 0); // globex idle timer 0..1 → release
  const recapU = tl.channel('recapU', 0); // fade the machine, chip returns
  const recapE = tl.channel('recapE', 0);
  const recapR = tl.channel('recapR', 0);
  const recapS = tl.channel('recapS', 0); // the bracket around the chip

  // — beat 1 · the leak —
  tl.caption({
    at: 0.5,
    dur: 6.8,
    text: 'Opening things is easy: connections, transporters, background work. The hard part is the promise to close them — kept even when the program dies halfway through.',
  });
  tl.tween(leakU, 1, { at: 0.8, dur: 1.6, ease: ease.linear });
  tl.tween(crashU, 1, { at: 3.6, dur: 0.8, ease: ease.pop });

  // — beat 2 · the scope + acquireRelease —
  tl.caption({
    at: 7.8,
    dur: 7.6,
    text: 'So Effect runs programs inside a scope. Acquire release pairs the two moves at birth: here is how to build the mail transporter, and here is how to close it. The close half is registered the instant the build succeeds.',
  });
  tl.tween(cam, CAM_SCOPE, { at: 8.0, dur: 1.4, ease: ease.move });
  tl.tween(scopeU, 1, { at: 8.4, dur: 1.6, ease: ease.draw });
  tl.tween(acq1U, 1, { at: 11.2, dur: 1.6, ease: ease.move });

  // — beat 3 · the stack remembers —
  tl.caption({
    at: 16.0,
    dur: 6.8,
    text: 'Layers build their services in that scope, so the mailer stacked on the transporter adds its own plate. Acquisition runs top down, and the stack remembers the order.',
  });
  tl.tween(cam, CAM_STACK, { at: 16.2, dur: 1.3, ease: ease.move });
  tl.tween(acq2U, 1, { at: 16.8, dur: 1.4, ease: ease.move });

  // — beat 4 · last in, first out —
  tl.caption({
    at: 23.4,
    dur: 7.6,
    text: 'When the scope closes, the plates pop in reverse: last acquired, first released. Dependents shut down before the things they depend on. You never write that ordering — the stack is the ordering.',
  });
  tl.tween(cam, CAM_SCOPE, { at: 23.6, dur: 1.3, ease: ease.move });
  tl.tween(popU, 1, { at: 24.6, dur: 2.6, ease: ease.move });

  // — beat 5 · every ending takes the same door —
  tl.caption({
    at: 31.6,
    dur: 6.6,
    text: 'And every ending takes the same door. Success, failure, interruption — the exit routes through the same finalizers, and cleanup can even inspect how the run ended.',
  });
  tl.tween(cam, CAM_DOOR, { at: 31.8, dur: 1.3, ease: ease.move });
  tl.tween(exitU, 1, { at: 32.4, dur: 2.4, ease: ease.linear });

  // — beat 6 · the heartbeat fiber —
  tl.caption({
    at: 38.8,
    dur: 7.8,
    text: 'Background work joins the same contract. Fork a heartbeat into the scope — it logs every five seconds, forever — and it lives exactly as long as the scope does. The bracket closes; the fiber is interrupted mid-sleep.',
  });
  tl.tween(cam, CAM_RING, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.tween(ringU, 1, { at: 39.4, dur: 0.8, ease: ease.enter });
  tl.tween(spinU, 3, { at: 39.4, dur: 4.6, ease: ease.linear });
  tl.tween(cutU, 1, { at: 44.4, dur: 0.9, ease: ease.pop });

  // — beat 7 · pools with idle timers —
  tl.caption({
    at: 47.4,
    dur: 7.2,
    text: 'Scopes also nest per key. A layer map builds one database pool per tenant, each in its own child scope, and releases any pool idle for one minute. Cleanup becomes policy, not discipline.',
  });
  tl.tween(cam, CAM_POOLS, { at: 47.6, dur: 1.3, ease: ease.move });
  tl.tween(poolU, 1, { at: 48.0, dur: 1.2, ease: ease.enter });
  tl.tween(timerU, 1, { at: 49.6, dur: 3.6, ease: ease.linear });

  // — beats 8–10 · the recap —
  tl.caption({
    at: 55.4,
    dur: 6.2,
    text: 'Step back, and the machine is whole. Failures live in the error slot, as values you can catch, unwrap, and drain to never.',
  });
  tl.tween(cam, CAM_RECAP, { at: 55.6, dur: 1.5, ease: ease.move });
  tl.tween(recapU, 1, { at: 55.8, dur: 1.4, ease: ease.move });
  tl.tween(recapE, 1, { at: 57.6, dur: 0.8, ease: ease.pop });

  tl.caption({
    at: 62.2,
    dur: 6.2,
    text: 'Needs live in the requirements slot as keys, and contexts and layers fill them — hiding or exposing exactly what you choose.',
  });
  tl.tween(recapR, 1, { at: 63.2, dur: 0.8, ease: ease.pop });

  tl.caption({
    at: 69.0,
    dur: 7.2,
    text: 'And around the whole run, a scope holds every promise to clean up — and keeps them in reverse order. Errors, dependencies, resources: not conventions. Values, with types. That is Effect.',
  });
  tl.tween(recapS, 1, { at: 70.0, dur: 1.6, ease: ease.draw });
  tl.hold(76.2, 1.4);

  return {
    tl,
    cam,
    leakU,
    crashU,
    scopeU,
    acq1U,
    acq2U,
    popU,
    exitU,
    ringU,
    spinU,
    cutU,
    poolU,
    timerU,
    recapU,
    recapE,
    recapR,
    recapS,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function Plate({ i, label, u, popped }: { i: number; label: string; u: number; popped: number }) {
  if (u <= 0.01) return null;
  const y = STACK_Y0 - i * (PLATE_H + 8);
  const fly = popped;
  return (
    <g opacity={u * (1 - 0.75 * fly)} transform={`translate(${140 * fly} ${-26 * fly})`}>
      <rect x={STACK_X} y={y} width={STACK_W} height={PLATE_H} rx={9} fill={colors.BG} stroke={fly > 0.2 ? colors.POSITIVE : colors.WARM} strokeWidth={1.6} />
      <text x={STACK_X + STACK_W / 2} y={y + 25} textAnchor="middle" fill={fly > 0.2 ? colors.POSITIVE : colors.WARM} fontSize={11.5} fontFamily={MONO}>
        {fly > 0.2 ? '✓ ' + label : label}
      </text>
    </g>
  );
}

function ResourceCard({
  box,
  title,
  sub,
  u,
  dead,
  dim,
}: {
  box: { x: number; y: number; w: number; h: number };
  title: string;
  sub: string;
  u: number;
  dead: number;
  dim: number;
}) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u * (1 - 0.85 * dim)}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={13} fill={colors.PANEL} stroke={dead > 0.5 ? colors.GRID : colors.POSITIVE} strokeWidth={1.5} />
      <text x={box.x + 18} y={box.y + 28} fill={dead > 0.5 ? colors.MUTED : colors.TEXT} fontSize={13} fontFamily={MONO} fontWeight={600}>
        {title}
      </text>
      <text x={box.x + 18} y={box.y + 52} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        {sub}
      </text>
      <circle cx={box.x + box.w - 22} cy={box.y + 24} r={6} fill={dead > 0.5 ? colors.GRID : colors.POSITIVE} opacity={0.9} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const leakU = s.get(scene.leakU);
  const crashU = s.get(scene.crashU);
  const scopeU = s.get(scene.scopeU);
  const acq1U = s.get(scene.acq1U);
  const acq2U = s.get(scene.acq2U);
  const popU = s.get(scene.popU);
  const exitU = s.get(scene.exitU);
  const ringU = s.get(scene.ringU);
  const spinU = s.get(scene.spinU);
  const cutU = s.get(scene.cutU);
  const poolU = s.get(scene.poolU);
  const timerU = s.get(scene.timerU);
  const recapU = s.get(scene.recapU);
  const recapE = s.get(scene.recapE);
  const recapR = s.get(scene.recapR);
  const recapS = s.get(scene.recapS);

  const introDim = clamp01(scopeU * 1.4); // the leak vignette yields the stage
  const cardsDim = clamp01(ringU + poolU + recapU); // Smtp/Mailer quiet down late
  const stackDim = clamp01(poolU * 0.7 + recapU); // plates stay through the ring beat
  const machineDim = clamp01(recapU); // EVERYTHING fades for the recap
  const ringDim = clamp01(poolU + recapU);
  const poolDim = machineDim;

  // LIFO pops: plate 2 (mailer, on top) first, then plate 1
  const pop2 = clamp01(popU * 2.1);
  const pop1 = clamp01(popU * 2.1 - 0.9);

  // globex pool: timer completes → the pool pops
  const poolGone = clamp01(timerU * 6 - 5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- beat 1: the leak vignette ---------------- */}
        {leakU > 0.01 && introDim < 0.99 && (
          <g opacity={1 - introDim}>
            <line x1={330} y1={300} x2={330 + 500 * clamp01(leakU * 1.3)} y2={300} stroke={colors.GRID} strokeWidth={2.5} opacity={leakU} />
            {[0, 1, 2].map((i) => {
              const u = clamp01(leakU * 3 - i * 0.7);
              const x = 420 + i * 130;
              const orphan = crashU > 0.5 && i === 2;
              return (
                <g key={i} opacity={u}>
                  <circle cx={x} cy={300} r={13} fill="none" stroke={orphan ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={2} />
                  <circle cx={x} cy={300} r={6} fill={orphan ? colors.NEGATIVE : colors.POSITIVE} opacity={orphan ? 0.6 + 0.4 * Math.sin(TAU * crashU) : 0.9} />
                  <text x={x} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    {['connection', 'transporter', 'heartbeat'][i]}
                  </text>
                </g>
              );
            })}
            {crashU > 0.02 && (
              <g opacity={crashU}>
                <path d="M756 268 l22 -20 l-12 26 l24 -8 l-20 24" fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
                <text x={790} y={252} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
                  the run dies here
                </text>
                <text x={810} y={336} fill={colors.NEGATIVE} fontSize={11} fontStyle="italic" opacity={crashU}>
                  …and who closes these?
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---------------- the scope bracket ---------------- */}
        {scopeU > 0.01 && (
          <g opacity={1 - 0.92 * machineDim}>
            <rect
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.w}
              height={FRAME.h}
              rx={22}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2.5}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - scopeU}
              opacity={0.85}
            />
            <text x={FRAME.x + 20} y={FRAME.y - 12} fill={colors.WARM} fontSize={13.5} fontFamily={MONO} opacity={scopeU}>
              Scope
            </text>
            {/* stack rail */}
            <g opacity={clamp01(acq1U * 2) * (1 - 0.8 * stackDim)}>
              <line x1={STACK_X - 18} y1={STACK_Y0 + PLATE_H + 6} x2={STACK_X + STACK_W + 18} y2={STACK_Y0 + PLATE_H + 6} stroke={colors.GRID} strokeWidth={2} />
              <text x={STACK_X + STACK_W / 2} y={STACK_Y0 + PLATE_H + 26} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                finalizers · last in, first out
              </text>
            </g>
            {/* the exit door */}
            {exitU > 0.01 && (
              <g opacity={clamp01(exitU * 2) * (1 - 0.85 * clamp01(ringDim + stackDim))}>
                <rect x={DOOR.cx - 46} y={DOOR.y - 14} width={92} height={28} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
                <text x={DOOR.cx} y={DOOR.y + 5} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                  exit
                </text>
                <text x={DOOR.cx} y={DOOR.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                  Scope.addFinalizerExit((exit) =&gt; …)
                </text>
                {(
                  [
                    { label: 'succeed', color: colors.POSITIVE, x0: 480 },
                    { label: 'fail', color: colors.NEGATIVE, x0: 640 },
                    { label: 'interrupt', color: colors.WARM, x0: 800 },
                  ] as const
                ).map((e, i) => {
                  const u = clamp01(exitU * 2 - i * 0.32);
                  if (u <= 0) return null;
                  return (
                    <g key={e.label} opacity={1 - 0.6 * clamp01(u * 3 - 2.4)}>
                      <circle cx={lerp(e.x0, DOOR.cx, u)} cy={lerp(258, DOOR.y - 20, u)} r={9} fill={e.color} opacity={0.9} />
                      <text
                        x={lerp(e.x0, DOOR.cx, u)}
                        y={lerp(258, DOOR.y - 20, u) - 15}
                        textAnchor="middle"
                        fill={e.color}
                        fontSize={10.5}
                        fontFamily={MONO}
                        opacity={1 - clamp01(u * 1.6 - 0.55)}
                      >
                        {e.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ---------------- the two acquired services ---------------- */}
        <ResourceCard
          box={SMTP}
          title="Smtp.layer"
          sub="acquireRelease(createTransport, close)"
          u={acq1U}
          dead={pop1}
          dim={cardsDim}
        />
        <ResourceCard
          box={MAILER}
          title="Mailer"
          sub="sendWelcomeEmail — depends on Smtp"
          u={acq2U}
          dead={pop2}
          dim={cardsDim}
        />
        {acq2U > 0.5 && cardsDim < 0.9 && (
          <line x1={MAILER.x + 150} y1={MAILER.y + MAILER.h} x2={SMTP.x + 150} y2={SMTP.y} stroke={colors.GRID} strokeWidth={2} strokeDasharray="3 5" opacity={(1 - cardsDim) * acq2U} />
        )}

        {/* ---------------- the finalizer plates ---------------- */}
        <g opacity={1 - 0.85 * stackDim}>
          <Plate i={0} label="close the transporter" u={clamp01(acq1U * 2 - 0.8)} popped={pop1} />
          <Plate i={1} label="release the mailer" u={clamp01(acq2U * 2 - 0.8)} popped={pop2} />
        </g>

        {/* ---------------- beat 6: the heartbeat ring ---------------- */}
        {ringU > 0.01 && (
          <g opacity={ringU * (1 - 0.88 * ringDim)}>
            <circle
              cx={RING.cx}
              cy={RING.cy}
              r={RING.r}
              fill="none"
              stroke={cutU > 0.5 ? colors.GRID : colors.TEAL}
              strokeWidth={3}
              strokeDasharray="14 10"
              strokeDashoffset={-spinU * 48}
              opacity={cutU > 0.5 ? 0.5 : 0.95}
            />
            <text x={RING.cx} y={RING.cy - 4} textAnchor="middle" fill={cutU > 0.5 ? colors.MUTED : colors.TEAL} fontSize={11} fontFamily={MONO}>
              Effect.forkScoped
            </text>
            <text x={RING.cx} y={RING.cy + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
              sleep 5s · log · repeat
            </text>
            {cutU > 0.02 && (
              <g opacity={cutU}>
                <circle cx={RING.cx} cy={RING.cy} r={RING.r + 16 * cutU} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={1 - 0.6 * cutU} />
                <path d={`M${RING.cx - 14} ${RING.cy - RING.r - 10} l28 20 m0 -20 l-28 20`} stroke={colors.NEGATIVE} strokeWidth={2.5} fill="none" />
                <text x={RING.cx} y={RING.cy + RING.r + 28} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                  Background task interrupted: layer scope closed
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---------------- beat 7: tenant pools with idle timers ---------------- */}
        {poolU > 0.01 && (
          <g opacity={poolU * (1 - 0.9 * poolDim)}>
            <text x={220} y={POOL_Y - 42} fill={colors.TEXT} fontSize={13} fontFamily={MONO} fontWeight={600}>
              LayerMap · app/PoolMap
            </text>
            <text x={220} y={POOL_Y - 22} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              idleTimeToLive: &quot;1 minute&quot;
            </text>
            {POOLS.map((p, i) => {
              const isGlobex = i === 1;
              const gone = isGlobex ? poolGone : 0;
              const timer = isGlobex ? timerU : 0.22;
              return (
                <g key={p.label} opacity={(1 - 0.8 * gone) * clamp01(poolU * 2 - i * 0.4)}>
                  <rect x={p.x} y={POOL_Y} width={230} height={72} rx={13} fill={colors.PANEL} stroke={gone > 0.3 ? colors.GRID : colors.ACCENT} strokeWidth={1.5} />
                  <text x={p.x + 16} y={POOL_Y + 28} fill={gone > 0.3 ? colors.MUTED : colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                    {p.label}
                  </text>
                  <text x={p.x + 16} y={POOL_Y + 50} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                    own child scope
                  </text>
                  {/* idle dial */}
                  <circle cx={p.x + 196} cy={POOL_Y + 36} r={14} fill="none" stroke={colors.GRID} strokeWidth={3} />
                  <circle
                    cx={p.x + 196}
                    cy={POOL_Y + 36}
                    r={14}
                    fill="none"
                    stroke={timer > 0.95 ? colors.NEGATIVE : colors.WARM}
                    strokeWidth={3}
                    strokeDasharray={`${TAU * 14 * clamp01(timer)} ${TAU * 14}`}
                    transform={`rotate(-90 ${p.x + 196} ${POOL_Y + 36})`}
                  />
                </g>
              );
            })}
            {poolGone > 0.3 && (
              <text x={500} y={POOL_Y + 100} fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={poolGone}>
                ✓ Closing tenant pool globex
              </text>
            )}
          </g>
        )}

        {/* ---------------- beats 8–10: the recap chip ---------------- */}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <rect x={RECAP.x} y={RECAP.y} width={RECAP.w} height={RECAP.h} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={RECAP.x + 30} y={RECAP_CY + 7} fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
              Effect&lt;
            </text>
            {(
              [
                { label: 'A', sub: 'the value', color: colors.POSITIVE, cx: 480, lit: 1 },
                { label: 'E', sub: 'typed errors', color: colors.NEGATIVE, cx: 640, lit: recapE },
                { label: 'R', sub: 'requirements', color: colors.ACCENT, cx: 800, lit: recapR },
              ] as const
            ).map((slot) => (
              <g key={slot.label}>
                <rect
                  x={slot.cx - 56}
                  y={RECAP_CY - 20}
                  width={112}
                  height={40}
                  rx={9}
                  fill={colors.BG}
                  stroke={slot.color}
                  strokeWidth={slot.lit > 0.5 ? 2.4 : 1.2}
                  opacity={0.35 + 0.65 * slot.lit}
                />
                <text x={slot.cx} y={RECAP_CY + 6} textAnchor="middle" fill={slot.color} fontSize={16} fontFamily={MONO} fontWeight={700} opacity={0.4 + 0.6 * slot.lit}>
                  {slot.label}
                </text>
                <text x={slot.cx} y={RECAP.y + RECAP.h + 22} textAnchor="middle" fill={slot.color} fontSize={11.5} opacity={slot.lit}>
                  {slot.sub}
                </text>
                {slot.lit > 0.5 && slot.lit < 1 && (
                  <circle cx={slot.cx} cy={RECAP_CY} r={36 + 18 * slot.lit} fill="none" stroke={slot.color} strokeWidth={1.5} opacity={1 - slot.lit} />
                )}
              </g>
            ))}
            <text x={RECAP.x + RECAP.w - 30} y={RECAP_CY + 7} textAnchor="end" fill={colors.TEXT} fontSize={20} fontFamily={MONO}>
              &gt;
            </text>
            {/* the scope bracket closes around the whole signature */}
            {recapS > 0.01 && (
              <g>
                <rect
                  x={RECAP.x - 40}
                  y={RECAP.y - 44}
                  width={RECAP.w + 80}
                  height={RECAP.h + 118}
                  rx={22}
                  fill="none"
                  stroke={colors.WARM}
                  strokeWidth={2.5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - recapS}
                />
                <text x={RECAP.x - 40 + 20} y={RECAP.y - 44 - 10} fill={colors.WARM} fontSize={13} fontFamily={MONO} opacity={clamp01(recapS * 2 - 1)}>
                  Scope — cleanup, guaranteed
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
