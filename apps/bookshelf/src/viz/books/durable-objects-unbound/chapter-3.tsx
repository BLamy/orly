// A lease is not a fence
//
// Sources (workerd, identical at aa49479 and ad78a8f for these constants):
//   src/workerd/server/cluster/ — logic/lease.rs: LEASE_MS = 20000, INTERVAL_MS = 3000,
//     RENEW_TIMEOUT_MS = 4000, RETRY_MS = 1000, MAX_SKEW_MS = 2000, SAFETY_MS = 4000;
//     holds(now) iff now + SAFETY_MS < until; before renewal requires holds(now + 4000),
//     i.e. now + 8000 < until, else fence; |skew| > MAX_SKEW_MS fences.
//   registry.rs — node lease publishes expiry = now + TTL.
//   src/workerd/server/server/cluster.rs — Cluster::clock_skew_ms uses
//     bucket.clock_skew_ms().unwrap_or(0): an observation, not verified synchronization.
//   src/workerd/server/cluster/ownership.rs — successor increments epoch and carries
//     `from`; `open` sets from = epoch by guarded write.
//   src/workerd/server/cluster/owner.rs — Owner::push: put (upload), then re-read
//     Ownership::current_epoch; only a matching epoch reaches slot.ack(epoch, round);
//     mismatch returns Contended.
//   NOT celld: celld's default CELLD_TTL_MS = 10000 with renewal at TTL/3 is a different
//   system and is deliberately absent here.
//
// Machine: a horizontal lease ruler (owner's clock, seconds) and a vertical epoch ladder
// tied to the same room. E = 20 s is an illustrative last published expiry; the 16 s and
// 12 s cutoffs follow exactly from the constants. A pause freezes A's playhead while the
// peer clock keeps going; B wins epoch 8; A's late upload lands but its acknowledgement
// door stays shut; B dies mid-recovery and C (epoch 9) still recovers from 7.
// Hosts A/B/C, epochs 7/8/9 and room "lobby" are illustrative.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Arrow,
  B,
  Backdrop,
  Bucket,
  Host,
  Illus,
  Label,
  MONO,
  Pill,
  UI,
  clamp01,
  lerp,
  seg,
} from './shared/kit';

const { ACCENT, WARM, POSITIVE, SECONDARY, NEGATIVE, TEAL, MUTED, TEXT, PANEL } = colors;

/* ------------------------------------------------------------ layout */
const R_Y = 170;
const R_X0 = 140;
const R_X1 = 1140;
const T_MAX = 24;
const X = (sec: number) => R_X0 + (sec / T_MAX) * (R_X1 - R_X0);
const E = 20; // illustrative last published expiry (s)
const SERVE_CUT = E - 4; // holds(t): t + 4 < E
const RENEW_CUT = E - 8; // before renew: t + 8 < E

const HA = { x: 180, y: 410 };
const HB = { x: 180, y: 540 };
const HC = { x: 330, y: 540 };
const BKT = { x: 540, y: 525, w: 220, h: 96 };
const CARD = { x: 540, y: 420 };
const GATE = { x: 780, y: 420 };
const LADDER = { xl: 960, xr: 1110, rungs: { 7: 560, 8: 470, 9: 380 } as Record<number, number> };

const CAM_RULER: CameraState = { x: 640, y: 250, k: 1.15 };
const CAM_SKEW: CameraState = { x: 840, y: 300, k: 1.25 };
const CAM_GUARD: CameraState = { x: 900, y: 175, k: 1.6 };
const CAM_CUTS: CameraState = { x: 720, y: 190, k: 1.35 };
const CAM_PAUSE: CameraState = { x: 640, y: 250, k: 1.15 };
const CAM_LADDER: CameraState = { x: 690, y: 460, k: 1.12 };
const CAM_GATE: CameraState = { x: 560, y: 440, k: 1.35 };
const CAM_FROM: CameraState = { x: 760, y: 460, k: 1.25 };

const SECONDS = Array.from({ length: T_MAX + 1 }, (_, i) => i);

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rulerU = tl.channel('rulerU', 0);
  const leaseU = tl.channel('leaseU', 0); // publish lease, bar extends to E
  const failU = tl.channel('failU', 0); // failed request ≠ dead owner
  const constU = tl.channel('constU', 0); // constants + renewal metronome
  const constOut = tl.channel('constOut', 0); // constants legend retires after beat 3
  const skewU = tl.channel('skewU', 0); // skew gauge
  const guardU = tl.channel('guardU', 0); // 2 s + 2 s = 4 s
  const cutU = tl.channel('cutU', 0); // 16 s and 12 s boundaries
  const pauseU = tl.channel('pauseU', 0); // pause / resume
  const assumeU = tl.channel('assumeU', 0); // bucket-clock observation caveat
  const rulerDim = tl.channel('rulerDim', 0);
  const worldU = tl.channel('worldU', 0); // hosts + bucket + record
  const claimU = tl.channel('claimU', 0); // B claims epoch 8
  const lateU = tl.channel('lateU', 0); // A's late upload lands
  const ackU = tl.channel('ackU', 0); // fresh epoch read; door stays shut
  const ladderOut = tl.channel('ladderOut', 0); // ladder steps aside while the ack door explains
  const fromU = tl.channel('fromU', 0); // B dies; C epoch 9 recovers from 7; opens
  const jobsU = tl.channel('jobsU', 0);
  const outageU = tl.channel('outageU', 0);

  // 1 — publish a node lease with an expiry
  tl.caption({ at: 0.5, dur: 10, text: 'Machines disappear without sending a farewell. Workerd publishes a node lease with an expiry time, so other machines have a rule for when they may attempt to replace its ownership.' });
  tl.tween(rulerU, 1, { at: B(1) + 0.3, dur: 1.6, ease: ease.draw });
  tl.tween(leaseU, 1, { at: B(1) + 2.6, dur: 4.0, ease: ease.move });
  tl.tween(worldU, 1, { at: B(1) + 1.2, dur: 1.0, ease: ease.enter });

  // 2 — a failed request is not proof of death
  tl.caption({ at: 11.5, dur: 10, text: 'A failed network request does not prove the owner is dead. The lease lets the system wait through some trouble, then prefer a controlled interruption over indefinite uncertainty.' });
  tl.tween(failU, 1, { at: B(2) + 0.6, dur: 7.0, ease: ease.linear });

  // 3 — the constants
  tl.caption({ at: 22.5, dur: 10, text: 'In the inspected workerd code, a lease lasts twenty seconds. Renewal runs every three seconds, with a four-second timeout and a one-second retry interval after failure.' });
  tl.tween(failU, 0, { at: B(3), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_RULER, { at: B(3) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(constU, 1, { at: B(3) + 1.0, dur: 7.0, ease: ease.linear });
  tl.tween(worldU, 0, { at: B(3) + 0.2, dur: 0.8, ease: ease.move }); // fully out while the ruler works: nothing chopped in the caption band

  // 4 — skew against the bucket; > 2 s fences
  tl.caption({ at: 33.5, dur: 10, text: 'The expiry is judged using clocks, so the code also checks clock skew against the bucket. More than two seconds of observed skew makes the node fence itself.' });
  tl.tween(constOut, 1, { at: B(4), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SKEW, { at: B(4) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(skewU, 1, { at: B(4) + 1.0, dur: 8.0, ease: ease.linear });

  // 5 — 2 s each side → 4 s guard
  tl.caption({ at: 44.5, dur: 10, text: "Each side may differ from the bucket by two seconds. Workerd therefore reserves four seconds between an owner's serving deadline and the published expiry that peers use." });
  tl.tween(skewU, 0, { at: B(5), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_GUARD, { at: B(5) + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(guardU, 1, { at: B(5) + 1.4, dur: 6.0, ease: ease.linear });

  // 6 — E = 20 → serve < 16, renew attempt < 12
  tl.caption({ at: 55.5, dur: 10, text: 'If the last published expiry is at twenty seconds, the serving test closes at sixteen. A renewal attempt also budgets its four-second timeout, making its starting boundary twelve seconds.' });
  tl.tween(cam, CAM_CUTS, { at: B(6) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(cutU, 1, { at: B(6) + 1.0, dur: 7.0, ease: ease.linear });

  // 7 — a paused process must stop when it resumes
  tl.caption({ at: 66.5, dur: 10, text: 'Those are code boundaries, not a promise that a timer always wakes on time. A process paused beyond its safe window must stop serving when it resumes, rather than renew an old claim blindly.' });
  tl.tween(cam, CAM_PAUSE, { at: B(7) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(pauseU, 1, { at: B(7) + 1.0, dur: 8.0, ease: ease.linear });

  // 8 — assumptions around observation
  tl.caption({ at: 77.5, dur: 10, text: "Clock checks depend on the available bucket-clock observation. They are assumptions and safeguards around failure detection; they do not turn every machine's clock into a perfect global clock." });
  tl.tween(cam, CAMERA_HOME, { at: B(8) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(assumeU, 1, { at: B(8) + 1.0, dur: 5.0, ease: ease.linear });

  // 9 — expiry → conditional claim → epoch 8
  tl.caption({ at: 88.5, dur: 10, text: 'After the lease expires, another node still needs a conditional ownership write. Winning that race advances the epoch, giving the room a new, distinguishable generation of authority.' });
  tl.tween(assumeU, 0, { at: B(9), dur: 0.6, ease: ease.move });
  tl.tween(rulerDim, 1, { at: B(9) + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(worldU, 1, { at: B(9) + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_LADDER, { at: B(9) + 0.2, dur: 1.5, ease: ease.move });
  tl.tween(claimU, 1, { at: B(9) + 1.2, dur: 7.0, ease: ease.linear });

  // 10 — the old owner wakes and finishes an old upload
  tl.caption({ at: 99.5, dur: 10, text: 'Suppose the old owner wakes after the new epoch is claimed. It may still possess an old database and may even finish an old upload; physical activity alone is not proof of current ownership.' });
  tl.tween(lateU, 1, { at: B(10) + 0.8, dur: 7.0, ease: ease.linear });

  // 11 — reread the epoch after upload; no acknowledgement
  tl.caption({ at: 110.5, dur: 10, text: 'Workerd checks the authority record again after uploading a commit. If the current epoch differs, that upload cannot release a successful acknowledgement to the client.' });
  tl.tween(ladderOut, 1, { at: B(11), dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_GATE, { at: B(11) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(ackU, 1, { at: B(11) + 1.0, dur: 7.5, ease: ease.linear });

  // 12 — `from` survives a claimant that dies mid-recovery
  tl.caption({ at: 121.5, dur: 10, text: 'A takeover also remembers the last epoch that finished opening. If a replacement dies halfway through recovery, the next replacement still knows which completed predecessor it must recover.' });
  tl.tween(cam, CAM_FROM, { at: B(12) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(ladderOut, 0, { at: B(12) + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(fromU, 1, { at: B(12) + 1.0, dur: 8.5, ease: ease.linear });

  // 13 — three jobs, three windows
  tl.caption({ at: 132.5, dur: 10, text: 'This separates three jobs: leases permit replacement, conditional writes choose a winner, and epochs prevent an obsolete writer from authorizing current results. Each job closes a different failure window.' });
  tl.tween(cam, CAMERA_HOME, { at: B(13) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(jobsU, 1, { at: B(13) + 1.0, dur: 6.0, ease: ease.linear });

  // 14 — bucket outage stops every writer
  tl.caption({ at: 143.5, dur: 10, text: 'During a bucket outage, these safeguards can stop every writer. That loss of availability is part of preserving the ownership rule, not evidence that the coordination problem disappeared.' });
  tl.tween(outageU, 1, { at: B(14) + 0.6, dur: 4.0, ease: ease.linear });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, rulerU, leaseU, failU, constU, constOut, skewU, guardU, cutU, pauseU, assumeU, rulerDim, worldU, claimU,
    lateU, ackU, ladderOut, fromU, jobsU, outageU,
  };
}

const scene = buildScene();

/* ---------------------------------------------- derived (closed form) */
/** Peer/bucket-side clock and the owner's clock during the pause demo (beat 7). */
function pauseClocks(p: number): { peer: number; owner: number; resumed: boolean } {
  const peer = 8 + 9 * seg(p, 0.05, 0.7); // 8 s → 17 s
  const resumed = p >= 0.72;
  const owner = resumed ? peer : Math.min(peer, 10);
  return { peer, owner, resumed };
}

/** Ownership record shown on the card, by phase. */
function recordAt(claim: number, from: number): { node: string; epoch: number; from: number; color: string } {
  if (from > 0.78) return { node: 'C', epoch: 9, from: 9, color: POSITIVE };
  if (from > 0.36) return { node: 'C', epoch: 9, from: 7, color: WARM };
  if (claim > 0.55) return { node: 'B', epoch: 8, from: 7, color: WARM };
  return { node: 'A', epoch: 7, from: 7, color: POSITIVE };
}

/* ------------------------------------------------------ subcomponents */

function Ruler({ u, dim, labelOp }: { u: number; dim: number; labelOp: number }) {
  if (u <= 0.001) return null;
  const x1 = lerp(R_X0, R_X1, clamp01(u));
  return (
    <g opacity={1 - 0.88 * dim}>
      <Label x={X(1.4)} y={R_Y - 30} text="owner's clock" color={MUTED} size={18} anchor="start" opacity={labelOp} />
      <line x1={R_X0} y1={R_Y} x2={x1} y2={R_Y} stroke={MUTED} strokeWidth={2.4} />
      {SECONDS.map((sec) => {
        const x = X(sec);
        if (x > x1) return null;
        const major = sec % 4 === 0;
        return (
          <g key={sec}>
            <line x1={x} y1={R_Y - (major ? 10 : 5)} x2={x} y2={R_Y + (major ? 10 : 5)} stroke={MUTED} strokeWidth={major ? 2 : 1} />
            {major ? <Label x={x} y={R_Y + 36} text={`${sec} s`} color={MUTED} size={18} /> : null}
          </g>
        );
      })}
    </g>
  );
}

function LeaseBar({ u, dim, pubOut }: { u: number; dim: number; pubOut: number }) {
  if (u <= 0.001) return null;
  const xe = lerp(X(0), X(E), ease.move(clamp01(u)));
  return (
    <g opacity={1 - 0.88 * dim}>
      <rect x={X(0)} y={R_Y - 16} width={xe - X(0)} height={32} rx={6} fill={ACCENT} opacity={0.28} />
      <line x1={xe} y1={R_Y - 34} x2={xe} y2={R_Y + 18} stroke={WARM} strokeWidth={3} />
      <Pill x={xe} y={R_Y - 52} text="E: published expiry" color={WARM} size={18} opacity={seg(u, 0.6, 1)} />
      <Pill x={X(0)} y={R_Y - 52} text="publish" color={ACCENT} size={18} opacity={seg(u, 0, 0.3) * (1 - pubOut)} />
    </g>
  );
}

function FailNote({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const bolt = seg(u, 0.05, 0.25);
  return (
    <g opacity={clamp01(u * 5)}>
      <line x1={HA.x + 50} y1={HA.y + 30} x2={BKT.x - BKT.w / 2} y2={BKT.y} stroke={MUTED} strokeWidth={2} strokeDasharray="6 6" />
      <path d={`M 340 450 l 18 -22 l -6 16 l 16 -2 l -20 26 l 6 -16 Z`} fill={NEGATIVE} opacity={bolt} transform="translate(0, 10)" />
      <Pill x={330} y={385} text="request failed" color={NEGATIVE} size={18} opacity={bolt} />
      <Pill x={780} y={300} text="failed request ≠ dead owner" color={TEXT} size={20} opacity={seg(u, 0.3, 0.45)} bold />
      <Label x={780} y={344} text="expiry = when others may attempt replacement" color={WARM} size={18} opacity={seg(u, 0.5, 0.65)} />
      <Label x={780} y={372} text="a policy deadline, not a death certificate" color={MUTED} size={18} opacity={seg(u, 0.7, 0.85)} />
    </g>
  );
}

function Constants({ u, out }: { u: number; out: number }) {
  if (u <= 0.001) return null;
  const legend = 1 - out;
  const chips = [
    { t: 'LEASE_MS = 20000', c: ACCENT },
    { t: 'INTERVAL_MS = 3000', c: POSITIVE },
    { t: 'RENEW_TIMEOUT_MS = 4000', c: WARM },
    { t: 'RETRY_MS = 1000', c: SECONDARY },
  ];
  const beat = seg(u, 0.25, 0.75);
  return (
    <g>
      {chips.map((ch, i) => (
        <Pill key={ch.t} x={760} y={268 + i * 44} text={ch.t} color={ch.c} size={18} mono anchor="start" opacity={seg(u, i * 0.12, i * 0.12 + 0.12) * legend} />
      ))}
      {/* renewal metronome: attempts every 3 s */}
      {[0, 3, 6, 9].map((sec, i) => (
        <g key={sec} opacity={seg(beat, i * 0.22, i * 0.22 + 0.1) * (1 - 0.65 * out)}>
          <circle cx={X(sec)} cy={R_Y} r={8} fill={POSITIVE} />
          <line x1={X(sec)} y1={R_Y + 12} x2={X(sec + 4)} y2={R_Y + 12} stroke={WARM} strokeWidth={3} opacity={i === 2 ? 1 : 0.3} />
        </g>
      ))}
      <g opacity={seg(u, 0.7, 0.85) * legend}>
        <Label x={X(5)} y={R_Y + 66} text="renew every 3 s · 4 s timeout" color={TEXT} size={18} />
        <Label x={X(5)} y={R_Y + 92} text="retry after 1 s on failure" color={MUTED} size={18} />
      </g>
      <Illus x={760} y={448} opacity={seg(u, 0.85, 1) * legend} text="same lease constants at aa49479 and ad78a8f" />
    </g>
  );
}

function SkewGauge({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const cx = 840;
  const y = 330;
  const W = 520; // −4 s … +4 s
  const sx = (s: number) => cx + (s / 4) * (W / 2);
  // needle: 0.6 s (ok) → 2.6 s (fence) → back to 0.6 s
  const v = u < 0.45 ? lerp(0, 0.6, seg(u, 0.05, 0.25)) : u < 0.8 ? lerp(0.6, 2.6, seg(u, 0.45, 0.6)) : lerp(2.6, 0.6, seg(u, 0.85, 0.95));
  const bad = Math.abs(v) > 2;
  return (
    <g opacity={clamp01(u * 6)}>
      <rect x={cx - W / 2 - 30} y={y - 70} width={W + 60} height={200} rx={14} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
      <Label x={cx} y={y - 40} text="observed skew vs bucket clock" color={TEXT} size={18} />
      <rect x={sx(-2)} y={y - 12} width={sx(2) - sx(-2)} height={24} fill={POSITIVE} opacity={0.25} />
      <rect x={sx(-4)} y={y - 12} width={sx(-2) - sx(-4)} height={24} fill={NEGATIVE} opacity={0.25} />
      <rect x={sx(2)} y={y - 12} width={sx(4) - sx(2)} height={24} fill={NEGATIVE} opacity={0.25} />
      {[-4, -2, 0, 2, 4].map((s) => (
        <Label key={s} x={sx(s)} y={y + 38} text={`${s > 0 ? '+' : ''}${s} s`} color={Math.abs(s) === 2 ? WARM : MUTED} size={18} />
      ))}
      <line x1={sx(v)} y1={y - 22} x2={sx(v)} y2={y + 18} stroke={bad ? NEGATIVE : POSITIVE} strokeWidth={4} />
      <Pill x={cx} y={y + 82} text={bad ? '|skew| > MAX_SKEW_MS = 2000 → node fences itself' : '|skew| ≤ 2000 ms → may continue'} color={bad ? NEGATIVE : POSITIVE} size={18} mono={false} fill={colors.BG} />
    </g>
  );
}

function Guard({ u, cut }: { u: number; cut: number }) {
  if (u <= 0.001 && cut <= 0.001) return null;
  const a = seg(u, 0.1, 0.35);
  const b = seg(u, 0.35, 0.6);
  const lab = 1 - seg(cut, 0, 0.06);
  return (
    <g>
      <rect x={X(16)} y={R_Y - 16} width={(X(18) - X(16)) * a} height={32} fill={SECONDARY} opacity={0.55} />
      <rect x={X(18)} y={R_Y - 16} width={(X(20) - X(18)) * b} height={32} fill={TEAL} opacity={0.55} />
      <g opacity={a * lab}>
        <Label x={(X(16) + X(18)) / 2} y={R_Y + 66} text="owner ±2 s" color={SECONDARY} size={18} />
      </g>
      <g opacity={b * lab}>
        <Label x={(X(18) + X(20)) / 2 + 30} y={R_Y + 92} text="peer ±2 s" color={TEAL} size={18} />
      </g>
      <MathLabel tex={'S = 2 \\times 2000 = 4000\\ \\text{ms}'} x={X(18)} y={72} fontSize={24} opacity={seg(u, 0.65, 0.85) * (1 - cut)} />
    </g>
  );
}

function Cutoffs({ u, dim, quiet }: { u: number; dim: number; quiet: number }) {
  if (u <= 0.001) return null;
  const a = seg(u, 0.05, 0.35);
  const b = seg(u, 0.45, 0.75);
  return (
    <g opacity={1 - 0.88 * dim}>
      <MathLabel tex={'\\text{holds}(t):\\ t + 4000 < E'} x={X(10)} y={76} fontSize={24} opacity={a * (1 - quiet)} />
      <MathLabel tex={'\\text{before renew}:\\ t + 8000 < E'} x={X(10)} y={118} fontSize={24} opacity={b * (1 - quiet)} />
      <g opacity={a}>
        <line x1={X(SERVE_CUT)} y1={R_Y - 28} x2={X(SERVE_CUT)} y2={R_Y + 50} stroke={NEGATIVE} strokeWidth={3} />
      </g>
      <Pill x={X(SERVE_CUT)} y={R_Y + 72} text="serve only if t < 16 s" color={NEGATIVE} size={18} fill={colors.BG} opacity={seg(u, 0.1, 0.35)} />
      <g opacity={b}>
        <line x1={X(RENEW_CUT)} y1={R_Y - 28} x2={X(RENEW_CUT)} y2={R_Y + 50} stroke={WARM} strokeWidth={3} />
        <Pill x={X(RENEW_CUT)} y={R_Y + 112} text="start renewal only if t < 12 s" color={WARM} size={18} fill={colors.BG} />
      </g>
    </g>
  );
}

/** Owner A's playhead line, drawn beneath the cutoff pills so their opaque fills read cleanly. */
function PausePlayhead({ u, out }: { u: number; out: number }) {
  if (u <= 0.001 || out >= 0.999) return null;
  const { peer, owner, resumed } = pauseClocks(u);
  const paused = !resumed && peer > 10;
  return (
    <g opacity={clamp01(u * 8) * (1 - out)}>
      <line x1={X(owner)} y1={R_Y - 18} x2={X(owner)} y2={R_Y + 140} stroke={paused ? MUTED : resumed ? NEGATIVE : ACCENT} strokeWidth={4} />
    </g>
  );
}

function PauseDemo({ u, out }: { u: number; out: number }) {
  if (u <= 0.001 || out >= 0.999) return null;
  const { peer, owner, resumed } = pauseClocks(u);
  const paused = !resumed && peer > 10;
  const verdict = seg(u, 0.74, 0.84);
  return (
    <g opacity={clamp01(u * 8) * (1 - out)}>
      {/* peer / bucket-side clock keeps moving */}
      <line x1={X(peer)} y1={R_Y - 40} x2={X(peer)} y2={R_Y + 18} stroke={TEAL} strokeWidth={3} />
      <Pill x={X(peer) - 4} y={R_Y - 66} text={`peer clock ${peer.toFixed(1)} s`} color={TEAL} size={18} fill={colors.BG} anchor="end" />
      {/* owner A's playhead label (line drawn by PausePlayhead) */}
      <Pill x={X(owner)} y={R_Y + 160} text={paused ? '⏸ A paused at 10 s' : resumed ? `A resumes: t = ${owner.toFixed(0)} s` : `A at ${owner.toFixed(1)} s`} color={paused ? MUTED : resumed ? NEGATIVE : ACCENT} size={18} fill={colors.BG} />
      {/* renewal gate at 12 s: locked (left of the renewal pill) */}
      <g transform={`translate(${X(RENEW_CUT) - 190}, ${R_Y + 112})`} opacity={seg(u, 0.4, 0.55)}>
        <rect x={-18} y={-12} width={36} height={28} rx={5} fill={PANEL} stroke={WARM} strokeWidth={2.4} />
        <path d="M -10 -12 v -8 a 10 10 0 0 1 20 0 v 8" fill="none" stroke={WARM} strokeWidth={2.4} />
      </g>
      <g opacity={verdict}>
        <rect x={640} y={R_Y + 192} width={500} height={84} rx={12} fill={colors.BG} stroke={NEGATIVE} strokeWidth={2.2} />
        <text x={660} y={R_Y + 224} fill={NEGATIVE} fontSize={20} fontWeight={700} fontFamily={UI}>17 + 4 ≮ 20 → stop serving</text>
        <text x={660} y={R_Y + 256} fill={TEXT} fontSize={18} fontFamily={UI}>17 + 8 ≮ 20 → no blind renewal: fence</text>
      </g>
    </g>
  );
}

function Assumptions({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const clock = (x: number, y: number, label: string, ang: number, c: string) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={30} fill={PANEL} stroke={c} strokeWidth={2.4} />
      <line x1={0} y1={0} x2={22 * Math.cos(ang)} y2={22 * Math.sin(ang)} stroke={c} strokeWidth={3} />
      <Label x={0} y={56} text={label} color={c} size={18} />
    </g>
  );
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={560} y={270} width={640} height={250} rx={14} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
      {clock(660, 340, 'node A', -1.3, ACCENT)}
      {clock(800, 340, 'bucket', -1.15, TEAL)}
      {clock(940, 340, 'node B', -1.0, SECONDARY)}
      <Label x={730} y={346} text="≈" color={TEXT} size={26} />
      <Label x={870} y={346} text="≈" color={TEXT} size={26} />
      <Label x={1110} y={330} text="observed," color={TEXT} size={18} />
      <Label x={1110} y={356} text="not verified" color={TEXT} size={18} />
      <Pill x={880} y={460} text="clock_skew_ms().unwrap_or(0)" color={MUTED} size={18} mono opacity={seg(u, 0.3, 0.5)} />
      <Label x={880} y={500} text="safeguards, not a perfect global clock" color={WARM} size={18} opacity={seg(u, 0.55, 0.75)} />
    </g>
  );
}

function Ladder({ claim, from, late, ack, out }: { claim: number; from: number; late: number; ack: number; out: number }) {
  const vis = seg(claim, 0, 0.15) * (1 - out);
  if (vis <= 0.001) return null;
  const rung = (e: number, label: string, on: number, color: string, note?: string) => (
    <g key={e} opacity={0.35 + 0.65 * on}>
      <line x1={LADDER.xl} y1={LADDER.rungs[e]} x2={LADDER.xr} y2={LADDER.rungs[e]} stroke={color} strokeWidth={5} />
      <Pill x={(LADDER.xl + LADDER.xr) / 2} y={LADDER.rungs[e] - 26} text={label} color={color} size={18} mono fill={colors.BG} />
      {note ? <Label x={LADDER.xr + 14} y={LADDER.rungs[e] + 6} text={note} color={MUTED} size={16} anchor="start" /> : null}
    </g>
  );
  const eightDead = seg(from, 0.1, 0.25);
  const nine = seg(from, 0.3, 0.42);
  const opened9 = seg(from, 0.78, 0.9);
  return (
    <g opacity={vis}>
      <line x1={LADDER.xl} y1={600} x2={LADDER.xl} y2={340} stroke={MUTED} strokeWidth={3} />
      <line x1={LADDER.xr} y1={600} x2={LADDER.xr} y2={340} stroke={MUTED} strokeWidth={3} />
      <Label x={(LADDER.xl + LADDER.xr) / 2} y={326} text="epoch ladder" color={MUTED} size={18} bold />
      {rung(7, 'epoch 7 · A', 1, ACCENT, late > 0.2 || ack > 0 ? 'obsolete' : undefined)}
      {rung(8, 'epoch 8 · B', seg(claim, 0.5, 0.65), SECONDARY, eightDead > 0.5 ? 'never opened' : undefined)}
      {rung(9, opened9 > 0.5 ? 'epoch 9 · C · open' : 'epoch 9 · C', nine, opened9 > 0.5 ? POSITIVE : WARM)}
      {/* `from` pointer: 9 recovers 7, skipping the dead claimant 8 */}
      <g opacity={seg(from, 0.45, 0.6) * (1 - opened9 * 0.6)}>
        <path d={`M ${LADDER.xl - 10} ${LADDER.rungs[9]} C ${LADDER.xl - 90} ${LADDER.rungs[9] + 40}, ${LADDER.xl - 90} ${LADDER.rungs[7] - 40}, ${LADDER.xl - 10} ${LADDER.rungs[7]}`} fill="none" stroke={WARM} strokeWidth={3} strokeDasharray="7 5" />
        <Pill x={LADDER.xl - 90} y={(LADDER.rungs[9] + LADDER.rungs[7]) / 2} text="from = 7" color={WARM} size={18} mono fill={colors.BG} />
      </g>
      {eightDead > 0 ? (
        <g opacity={eightDead} stroke={NEGATIVE} strokeWidth={4} strokeLinecap="round">
          <line x1={LADDER.xr - 30} y1={LADDER.rungs[8] - 14} x2={LADDER.xr - 4} y2={LADDER.rungs[8] + 12} />
          <line x1={LADDER.xr - 4} y1={LADDER.rungs[8] - 14} x2={LADDER.xr - 30} y2={LADDER.rungs[8] + 12} />
        </g>
      ) : null}
    </g>
  );
}

function AuthorityWorld({ u, claim, from, late, ack, outage, ladderOut }: { u: number; claim: number; from: number; late: number; ack: number; outage: number; ladderOut: number }) {
  if (u <= 0.001) return null;
  const rec = recordAt(claim, from);
  const bDead = seg(from, 0.1, 0.25);
  const cOn = seg(from, 0.28, 0.4);
  const casFly = seg(claim, 0.25, 0.55);
  const cFly = seg(from, 0.28, 0.38);
  // A's late upload (beat 10), its epoch re-read and the shut door (beat 11)
  const upload = seg(late, 0.15, 0.55);
  const landed = seg(late, 0.55, 0.65);
  const reread = seg(ack, 0.1, 0.4);
  const verdict = seg(ack, 0.45, 0.6);
  const aEpoch7 = late > 0 || ack > 0;
  const gateBad = verdict > 0 || outage > 0;
  return (
    <g opacity={u}>
      <Bucket x={BKT.x} y={BKT.y} w={BKT.w} h={BKT.h} label="bucket" opacity={1 - 0.6 * outage} />
      {/* ownership card */}
      <g transform={`translate(${CARD.x}, ${CARD.y})`}>
        <rect x={-170} y={-30} width={340} height={60} rx={10} fill={colors.BG} stroke={rec.color} strokeWidth={2.4} />
        <text y={8} textAnchor="middle" fill={rec.color} fontSize={20} fontFamily={MONO} fontWeight={700}>
          {`node ${rec.node} · epoch ${rec.epoch} · from ${rec.from}`}
        </text>
      </g>
      <Label x={CARD.x} y={CARD.y - 44} text="own.json" color={MUTED} size={18} mono />
      <Host x={HA.x} y={HA.y} label={aEpoch7 ? 'A (epoch 7)' : 'host A'} color={ACCENT} />
      <Host x={HB.x} y={HB.y} label="host B" color={SECONDARY} opacity={seg(claim, 0, 0.2)} dead={bDead} />
      <Host x={HC.x} y={HC.y} label="host C" color={WARM} opacity={cOn} />
      {/* B's conditional claim */}
      {casFly > 0 && casFly < 1 ? (
        <Pill x={lerp(HB.x + 50, CARD.x - 170, casFly)} y={lerp(HB.y, CARD.y, casFly)} text="If-Match → epoch 8" color={SECONDARY} size={18} mono />
      ) : null}
      {cFly > 0 && cFly < 1 ? (
        <Pill x={lerp(HC.x + 50, CARD.x - 170, cFly)} y={lerp(HC.y, CARD.y, cFly)} text="If-Match → epoch 9" color={WARM} size={18} mono />
      ) : null}
      {/* A's old upload physically lands */}
      {upload > 0 && upload < 1 ? (
        <Pill x={lerp(HA.x + 50, BKT.x - 60, upload)} y={lerp(HA.y + 10, BKT.y + 6, upload)} text="old upload" color={ACCENT} size={18} />
      ) : null}
      <g opacity={landed * (1 - 0.85 * seg(from, 0, 0.1))}>
        <Pill x={BKT.x} y={BKT.y + 74} text="landed — not proof of ownership" color={NEGATIVE} size={18} fill={colors.BG} />
      </g>
      {/* fresh epoch read → compare → door */}
      {reread > 0 && reread < 1 ? (
        <Pill x={lerp(CARD.x + 20, CARD.x + 90, reread)} y={CARD.y - 84} text="current_epoch = 8" color={WARM} size={18} mono opacity={seg(reread, 0, 0.15)} />
      ) : null}
      <g transform={`translate(${GATE.x}, ${GATE.y})`} opacity={(seg(ack, 0, 0.1) + outage) * (1 - 0.85 * seg(from, 0, 0.1))}>
        <rect x={-34} y={-56} width={68} height={112} rx={6} fill={PANEL} stroke={gateBad ? NEGATIVE : MUTED} strokeWidth={3} />
        <line x1={-34} y1={0} x2={34} y2={0} stroke={NEGATIVE} strokeWidth={6} opacity={gateBad ? 1 : 0} />
        <Label x={0} y={-72} text="ack door" color={MUTED} size={18} />
      </g>
      <g opacity={verdict * (1 - 0.85 * seg(from, 0, 0.1))}>
        <rect x={GATE.x - 150} y={GATE.y + 74} width={300} height={92} rx={12} fill={colors.BG} stroke={NEGATIVE} strokeWidth={2.2} />
        <Label x={GATE.x} y={GATE.y + 102} text="7 ≠ 8 → Contended" color={NEGATIVE} size={20} bold />
        <Label x={GATE.x} y={GATE.y + 130} text="no slot.ack(epoch, round)" color={TEXT} size={18} mono />
        <Label x={GATE.x} y={GATE.y + 154} text="client gets no success" color={MUTED} size={16} />
      </g>
      <Ladder claim={claim} from={from} late={late} ack={ack} out={ladderOut} />
    </g>
  );
}

function Jobs({ u, outage }: { u: number; outage: number }) {
  if (u <= 0.001) return null;
  const rows = [
    { k: 'lease', v: 'permits replacement', c: ACCENT },
    { k: 'conditional write', v: 'chooses one winner', c: TEAL },
    { k: 'epoch', v: 'stops an obsolete writer authorizing results', c: WARM },
  ];
  const H = 330 + 100 * seg(outage, 0, 0.2);
  return (
    <g opacity={clamp01(u * 4)}>
      <rect x={140} y={100} width={1000} height={H} rx={20} fill={colors.BG} stroke={ACCENT} strokeWidth={2} />
      <Label x={640} y={150} text="Three jobs, three failure windows" color={TEXT} size={28} bold />
      {rows.map((r, i) => (
        <g key={r.k} opacity={seg(u, 0.1 + i * 0.25, 0.3 + i * 0.25)}>
          <rect x={200} y={186 + i * 72} width={260} height={50} rx={10} fill={PANEL} stroke={r.c} strokeWidth={2} />
          <Label x={330} y={218 + i * 72} text={r.k} color={r.c} size={22} bold />
          <Arrow x1={474} y1={211 + i * 72} x2={530} y2={211 + i * 72} color={MUTED} />
          <Label x={546} y={219 + i * 72} text={r.v} color={TEXT} size={22} anchor="start" />
        </g>
      ))}
      <g opacity={seg(outage, 0.15, 0.4)}>
        <line x1={200} y1={420} x2={1080} y2={420} stroke={MUTED} strokeWidth={1} />
        <Label x={640} y={462} text="bucket outage → no renewal, no claim, no acknowledgement" color={NEGATIVE} size={22} />
        <Label x={640} y={500} text="writers stop: availability traded to keep one owner" color={TEXT} size={20} opacity={seg(outage, 0.45, 0.7)} />
      </g>
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const dim = s.get(scene.rulerDim);
  const claim = s.get(scene.claimU);
  const late = s.get(scene.lateU);
  const ack = s.get(scene.ackU);
  const from = s.get(scene.fromU);
  const jobs = s.get(scene.jobsU);
  const outage = s.get(scene.outageU);
  const pause = s.get(scene.pauseU);
  const assume = s.get(scene.assumeU);
  const cut = s.get(scene.cutU);
  const lower = 1 - 0.9 * clamp01(jobs * 3);
  const skew = s.get(scene.skewU);
  const constOut = s.get(scene.constOut);
  const guard = s.get(scene.guardU);
  // the ruler is outgoing context while the skew gauge is the active machine
  const rulerQuiet = Math.max(dim, 0.88 * seg(skew, 0, 0.1));
  // the left-hand clock label only shows when the camera frames the whole ruler
  const clockLabel = 1 - constOut * (1 - seg(pause, 0, 0.08));
  const pauseOut = seg(assume, 0, 0.12);
  return (
    <>
      <Backdrop />
      <Camera {...s.get(scene.cam)}>
        <g opacity={lower}>
          <AuthorityWorld u={s.get(scene.worldU)} claim={claim} from={from} late={late} ack={ack} outage={outage} ladderOut={s.get(scene.ladderOut)} />
          <Ruler u={s.get(scene.rulerU)} dim={rulerQuiet} labelOp={clamp01(clockLabel)} />
          <LeaseBar u={s.get(scene.leaseU)} dim={rulerQuiet} pubOut={seg(s.get(scene.constU), 0, 0.1)} />
          <g opacity={(1 - dim) * (1 - 0.88 * seg(skew, 0, 0.1))}>
            <Constants u={s.get(scene.constU)} out={constOut} />
            <Guard u={guard} cut={cut} />
          </g>
          <g opacity={1 - dim}>
            <PausePlayhead u={pause} out={pauseOut} />
          </g>
          <Cutoffs u={cut} dim={Math.max(dim, assume)} quiet={seg(pause, 0, 0.05) * (1 - assume)} />
          <g opacity={1 - dim}>
            <PauseDemo u={pause} out={pauseOut} />
          </g>
          <FailNote u={s.get(scene.failU)} />
          <SkewGauge u={skew} />
          <Assumptions u={seg(assume, 0.1, 1)} />
        </g>
        <Jobs u={jobs} outage={outage} />
      </Camera>
      {/* screen-space footer: stable above the caption band */}
      <Illus x={60} y={612} opacity={lower} text="hosts A/B/C, epochs 7–9, E = 20 s: illustrative · constants real" />
    </>
  );
}

export const vizScene = () => scene;
