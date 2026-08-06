// The Critic Holds the Tape
//
// Backed by: slack-clone/AGENTS.md and .eforest/loop.md (a builder submits
// one exact-diff claim plus deterministic stream evidence and, for browser
// work, a same-session Replay recording; only a fresh critic may verify);
// electric-forest/AGENTS.md (predict-then-verify, Replay MCP interrogation,
// event-log offsets and digests, sensitivity through sabotage, append-only
// verification logs); loop-qa/netlify/functions/lib/replay-mcp.ts
// (initialize, tools/call, RecordingOverview and recording-scoped evidence).
//
// Machine: a proof token circles builder -> final run -> fresh critic ->
// verdict. The same run grows two witnesses beside the ring: a Replay tape
// and an append-only Durable Streams ledger. Refutation sends the token
// around again without erasing the first evidence; verification seals the
// last event only after sensitivity and both witnesses survive.
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
import { LoopRing, RecordingStrip } from '../../agent';
import type { RecordingLink, RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const RING = { cx: 410, cy: 332, r: 172 };
const TAPE = { x: 700, y: 150, w: 430, h: 28 };
const LEDGER = { x: 720, y: 292, w: 390 };

const STOPS = [
  { label: 'builder', color: colors.ACCENT },
  { label: 'final run', color: colors.TEAL },
  { label: 'fresh critic', color: colors.NEGATIVE },
  { label: 'verdict', color: colors.WARM },
];

const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction', label: 'setup' },
  { at: 0.25, kind: 'network' },
  { at: 0.43, kind: 'render' },
  { at: 0.62, kind: 'interaction', label: 'claim' },
  { at: 0.79, kind: 'network' },
  { at: 0.94, kind: 'render', label: 'result' },
];

const EVENTS = [
  { label: 'task.claimed', color: colors.ACCENT },
  { label: 'evidence.linked · recording + offset + digest', color: colors.TEAL },
  { label: 'verdict.refuted · missing sensitivity', color: colors.NEGATIVE },
  { label: 'task.reopened', color: colors.WARM },
  { label: 'evidence.linked · fresh recording + fresh digest', color: colors.TEAL },
  { label: 'verdict.verified', color: colors.POSITIVE },
];

const CAM_RING: CameraState = { x: 420, y: 330, k: 1.18 };
const CAM_TAPE: CameraState = { x: 700, y: 300, k: 1.04 };
const CAM_BOTH: CameraState = { x: 640, y: 335, k: 0.98 };
const CAM_LEDGER: CameraState = { x: 735, y: 360, k: 1.0 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const lapU = tl.channel('lapU', 0);
  const claimU = tl.channel('claimU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const pointU = tl.channel('pointU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const ledgerPulse = tl.channel('ledgerPulse', 0);
  const sensitivityU = tl.channel('sensitivityU', 0);
  const refuteU = tl.channel('refuteU', 0);
  const oldDim = tl.channel('oldDim', 0);
  const closeDim = tl.channel('closeDim', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.4;

  // Beat 1 — a claim enters the loop.
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'A builder reaches the end of one ticket with a claim: this exact change works. The claim enters a loop, but it is not allowed to travel alone.',
  });
  tl.tween(cam, CAM_RING, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: t - 5.5, dur: 1.5, ease: ease.draw });
  tl.tween(claimU, 1, { at: t - 3.7, dur: 0.7, ease: ease.enter });
  tl.tween(lapU, 0.24, { at: t - 2.7, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // Beat 2 — one final run grows two witnesses.
  t = tl.caption({
    at: t,
    dur: 6.5,
    text: 'The builder makes one final run from the code it is submitting. Browser behavior becomes a Replay QA recording, while backend behavior becomes an event log with offsets and a state digest.',
  });
  tl.tween(cam, CAM_BOTH, { at: t - 6.1, dur: 1.4, ease: ease.move });
  tl.tween(lapU, 0.5, { at: t - 5.8, dur: 2.0, ease: ease.linear });
  tl.tween(tapeU, 1, { at: t - 5.1, dur: 1.3, ease: ease.draw });
  tl.tween(ledgerU, 2, { at: t - 3.8, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // Beat 3 — Ralph gets a witness.
  t = tl.caption({
    at: t,
    dur: 6.3,
    text: 'People often call repeat until green agent workflows Ralph loops. This version adds a witness and a judge, so another lap cannot quietly replace the facts from the first one.',
  });
  tl.tween(lapU, 0.72, { at: t - 5.7, dur: 3.6, ease: ease.linear });
  tl.tween(ledgerPulse, 1, { at: t - 3.2, dur: 0.45, ease: ease.pop });
  tl.tween(ledgerPulse, 0, { at: t - 2.1, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  // Beat 4 — the critic takes the exact tape, not a rerun.
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'A fresh critic takes the exact recording the builder cited. It does not redrive the app and hope for the same world; it cross examines the world that actually produced the claim.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(lapU, 1.0, { at: t - 5.5, dur: 2.3, ease: ease.linear });
  tl.tween(sweepU, 1, { at: t - 4.9, dur: 4.2, ease: ease.linear });
  tl.tween(pointU, 1, { at: t - 1.5, dur: 0.55, ease: ease.pop });
  t = tl.hold(t, 0.5);

  // Beat 5 — runtime interrogation through Replay MCP.
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Through Replay’s Model Context Protocol tools, the critic predicts a moment, then checks the real console, network, interactions, and rendered state around that point in time.',
  });
  tl.tween(sweepU, 0.28, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(sweepU, 0.82, { at: t - 3.8, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // Beat 6 — the second witness is replayed independently.
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'For the event sourced backend, the critic replays the Durable Streams log from the beginning and recomputes the cited digest. The tape explains the browser; the log proves the state machine.',
  });
  tl.tween(cam, CAM_LEDGER, { at: t - 5.9, dur: 1.4, ease: ease.move });
  tl.tween(ledgerPulse, 1, { at: t - 4.7, dur: 0.5, ease: ease.pop });
  tl.tween(ledgerPulse, 0, { at: t - 2.7, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  // Beat 7 — prove the detector can fail.
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Then comes sensitivity. The critic changes an input or sabotages a disposable copy of the code. If the supposed detector stays green, the evidence cannot protect the claim.',
  });
  tl.tween(cam, CAM_BOTH, { at: t - 5.7, dur: 1.4, ease: ease.move });
  tl.tween(sensitivityU, 1, { at: t - 4.8, dur: 1.2, ease: ease.enter });
  tl.tween(refuteU, 1, { at: t - 2.8, dur: 0.65, ease: ease.pop });
  tl.tween(ledgerU, 3, { at: t - 2.2, dur: 1.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // Beat 8 — refutation is an append, not an eraser.
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A refutation is appended, not edited away. The builder receives the failed prediction as new context, reworks the ticket, and records a fresh final run while the old evidence remains visible.',
  });
  tl.tween(oldDim, 1, { at: t - 5.9, dur: 1.0, ease: ease.move });
  tl.tween(lapU, 1.72, { at: t - 5.5, dur: 4.2, ease: ease.linear });
  tl.tween(ledgerU, 5, { at: t - 4.8, dur: 3.7, ease: ease.linear });
  tl.tween(refuteU, 0, { at: t - 3.8, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  // Beat 9 — only the critic closes the ticket.
  t = tl.caption({
    at: t,
    dur: 6.3,
    text: 'Only when a fresh lap survives both witnesses and the detector proves it can go red does the critic append verified. The loop closes with a history, not a green light.',
  });
  tl.tween(lapU, 2.0, { at: t - 5.8, dur: 2.4, ease: ease.linear });
  tl.tween(ledgerU, 6, { at: t - 4.8, dur: 1.4, ease: ease.linear });
  tl.tween(closeDim, 1, { at: t - 2.9, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 2.0, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return {
    tl,
    cam,
    ringU,
    lapU,
    claimU,
    tapeU,
    sweepU,
    pointU,
    ledgerU,
    ledgerPulse,
    sensitivityU,
    refuteU,
    oldDim,
    closeDim,
    closeU,
  };
}

const scene = buildScene();

function ClaimCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(242 ${300 + (1 - uu) * 12})`} opacity={uu * (1 - 0.82 * dim)}>
      <rect width={336} height={70} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={16} y={25} fill={colors.ACCENT} fontSize={12} fontFamily={MONO} fontWeight={700}>
        builder claim · exact HEAD
      </text>
      <text x={16} y={48} fill={colors.TEXT} fontSize={12}>
        “this change works under the task contract”
      </text>
    </g>
  );
}

function Ledger({ u, pulse, dim }: { u: number; pulse: number; dim: number }) {
  const visible = Math.min(EVENTS.length, Math.ceil(Math.max(0, u)));
  const frac = u - Math.floor(u);
  return (
    <g opacity={1 - 0.85 * dim}>
      <text x={LEDGER.x} y={LEDGER.y - 30} fill={colors.TEXT} fontSize={14} fontWeight={700}>
        Durable Streams task history
      </text>
      <text x={LEDGER.x} y={LEDGER.y - 10} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        append only · offset addressed · replay to digest
      </text>
      <line
        x1={LEDGER.x + 14}
        y1={LEDGER.y + 2}
        x2={LEDGER.x + 14}
        y2={LEDGER.y + Math.max(0, u) * 49}
        stroke={colors.GRID}
        strokeWidth={2}
      />
      {EVENTS.slice(0, visible).map((event, i) => {
        const isLast = i === visible - 1 && u < EVENTS.length;
        const enter = isLast ? clamp01(frac * 2.2 || 1) : 1;
        const y = LEDGER.y + i * 49;
        return (
          <g key={event.label} opacity={enter} transform={`translate(0 ${(1 - enter) * 8})`}>
            <circle cx={LEDGER.x + 14} cy={y + 16} r={5} fill={event.color} />
            <rect
              x={LEDGER.x + 34}
              y={y}
              width={LEDGER.w - 34}
              height={32}
              rx={8}
              fill={colors.PANEL}
              stroke={event.color}
              strokeWidth={i === visible - 1 ? 1.5 + 1.3 * pulse : 1}
            />
            <text x={LEDGER.x + 48} y={y + 21} fill={event.color} fontSize={10.5} fontFamily={MONO}>
              {event.label}
            </text>
            <text x={LEDGER.x - 6} y={y + 20} textAnchor="end" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
              {String(i).padStart(4, '0')}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SensitivityCard({ u, refuted, dim }: { u: number; refuted: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const bad = clamp01(refuted);
  return (
    <g transform={`translate(215 ${510 + (1 - uu) * 10})`} opacity={uu * (1 - 0.82 * dim)}>
      <rect width={390} height={74} rx={12} fill={colors.PANEL} stroke={bad > 0 ? colors.NEGATIVE : colors.WARM} strokeWidth={1.6} />
      <text x={16} y={25} fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
        sensitivity probe · disposable worktree
      </text>
      <text x={16} y={50} fill={bad > 0 ? colors.NEGATIVE : colors.TEXT} fontSize={12} fontFamily={MONO}>
        {bad > 0 ? 'tests stayed green → VERDICT: refuted' : 'invert one guard → tests must go red'}
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu} transform={`translate(0 ${(1 - uu) * 12})`}>
      <rect x={270} y={258} width={740} height={150} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.8} />
      <text x={640} y={308} textAnchor="middle" fill={colors.POSITIVE} fontSize={17} fontFamily={MONO} fontWeight={800}>
        VERDICT: verified
      </text>
      <text x={640} y={343} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        the loop closes with a history
      </text>
      <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
        recording point · stream offset · digest · sensitivity proof
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const closeDim = clamp01(s.get(scene.closeDim));
  const oldDim = clamp01(s.get(scene.oldDim));
  const links: RecordingLink[] = [
    { at: 0.82, label: 'critic prediction checked here', pop: s.get(scene.pointU) },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={1 - 0.9 * closeDim}>
          <LoopRing
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            stops={STOPS}
            reveal={s.get(scene.ringU)}
            u={s.get(scene.lapU)}
            color={s.get(scene.refuteU) > 0.2 ? colors.NEGATIVE : colors.ACCENT}
            labelSize={12.5}
          />
          <ClaimCard u={s.get(scene.claimU)} dim={oldDim} />
          <RecordingStrip
            x={TAPE.x}
            y={TAPE.y}
            w={TAPE.w}
            h={TAPE.h}
            points={TAPE_POINTS}
            reveal={s.get(scene.tapeU)}
            u={s.get(scene.sweepU)}
            links={links}
            title="Replay QA recording — the browser witness"
            dim={oldDim}
          />
          <Ledger u={s.get(scene.ledgerU)} pulse={s.get(scene.ledgerPulse)} dim={0} />
          <SensitivityCard u={s.get(scene.sensitivityU)} refuted={s.get(scene.refuteU)} dim={oldDim} />
        </g>
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
