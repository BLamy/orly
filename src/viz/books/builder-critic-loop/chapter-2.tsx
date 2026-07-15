// Book scene — builder-critic-loop, chapter 2: "The Builder's Claim".
// The builder picks the top task and works in a gitignored work/ scratch
// zone (beat 0); the change rides the GauntletRail through the four gates in
// ascending cost (beat 1); evidence lands in two layers — an event-log →
// digest into evidence/ (beat 2) and a Replay recording cited by URL
// (beat 3); the claim is appended to the Verification log (beat 4); and the
// status flips to implemented — with `verified` visibly out of the builder's
// reach (beat 5).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode, Zone } from '../../primitives';
import { GauntletRail } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const QUEUE = { x: 110, y: 120 };
const BUILDER = { x: 350, y: 120 };
const WORKZONE = { x: 230, y: 210, w: 250, h: 120 };

const RAIL = { x: 590, y: 130, w: 600 };
const GATES = ['fmt + lint', 'typecheck', 'test', 'build'];

const EVIDENCE = { x: 300, y: 470 };
const REPLAY = { x: 640, y: 470 };
const VLOG = { x: 900, y: 380, w: 340, h: 200 };

const DIGEST = 'sha256: 9f2b6c41…';
const CLAIM_LINES = [
  'commit  684e1f6',
  'cmd     make verify-E1-T09',
  'stream  evidence/e1-t09.jsonl',
  `digest  ${DIGEST.slice(8)}`,
  'replay  app.replay.io/…?point=',
];

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const queueU = tl.channel('queueU', 0);
  const builderU = tl.channel('builderU', 0);
  const connQB = tl.channel('connQB', 0);
  const workU = tl.channel('workU', 0);

  const railU = tl.channel('railU', 0);
  const tokenU = tl.channel('tokenU', -1);
  const gateStates = GATES.map((_, i) => tl.channel(`gate${i}S`, 0));

  const evidenceU = tl.channel('evidenceU', 0);
  const connBE = tl.channel('connBE', 0);
  const digestU = tl.channel('digestU', 0);

  const replayU = tl.channel('replayU', 0);
  const connBR = tl.channel('connBR', 0);
  const pointU = tl.channel('pointU', 0);

  const vlogU = tl.channel('vlogU', 0);
  const claimU = tl.channel('claimU', 0);

  const statusU = tl.channel('statusU', 0);
  const lockU = tl.channel('lockU', 0);

  // BEAT 0 — pick the top task; work/ is the private, gitignored workshop
  tl.caption({ at: 0.4, dur: 4.5, text: 'The builder self-validates freely in the task’s gitignored work/.' });
  tl.tween(queueU, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(builderU, 1, { at: 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(connQB, 1, { at: 1.6, dur: 1.0, ease: ease.draw });
  tl.tween(workU, 1, { at: 2.8, dur: 1.1, ease: ease.draw });
  tl.hold(4.6, 0.8);

  // BEAT 1 — the four gates, ascending cost; the token clears each in turn
  tl.caption({ at: 5.8, dur: 4.5, text: 'Gates in ascending cost: fmt+lint → typecheck → test → build.' });
  tl.tween(railU, 1, { at: 6.0, dur: 1.2, ease: ease.draw });
  tl.set(tokenU, 0, 7.2);
  tl.tween(tokenU, 3, { at: 7.3, dur: 3.4, ease: ease.linear });
  GATES.forEach((_, i) => {
    tl.tween(gateStates[i], 1, { at: 7.5 + i * (3.4 / 3.2), dur: 0.4, ease: ease.pop });
  });
  tl.hold(11.2, 0.8);

  // BEAT 2 — stream-layer evidence: event log replayed to a state digest
  tl.caption({ at: 12.4, dur: 4.5, text: 'Stream layer: the event log replays to a state digest, committed.' });
  tl.tween(evidenceU, 1, { at: 12.6, dur: 0.6, ease: ease.enter });
  tl.tween(connBE, 1, { at: 13.2, dur: 1.1, ease: ease.draw });
  tl.tween(digestU, 1, { at: 14.6, dur: 1.4, ease: ease.linear });
  tl.hold(17.2, 0.8);

  // BEAT 3 — browser-layer evidence: a Replay recording, cited by point link
  tl.caption({ at: 18.4, dur: 4.5, text: 'Browser layer: a Replay recording of the happy run, cited by URL.' });
  tl.tween(replayU, 1, { at: 18.6, dur: 0.6, ease: ease.enter });
  tl.tween(connBR, 1, { at: 19.2, dur: 1.1, ease: ease.draw });
  tl.tween(pointU, 1, { at: 20.4, dur: 0.6, ease: ease.pop });
  tl.hold(23.0, 0.8);

  // BEAT 4 — the claim: commit, commands, evidence paths — silence forbidden
  tl.caption({ at: 24.2, dur: 4.5, text: 'The Verification log gets the claim — absence must be declared.' });
  tl.tween(vlogU, 1, { at: 24.4, dur: 0.7, ease: ease.enter });
  tl.tween(claimU, 1, { at: 25.2, dur: 2.6, ease: ease.linear });
  tl.hold(28.8, 0.8);

  // BEAT 5 — status: implemented; verified is not the builder's to grant
  tl.caption({ at: 30.0, dur: 5.0, text: 'Status flips to implemented — verified belongs to a stranger.' });
  tl.tween(statusU, 1, { at: 30.2, dur: 0.5, ease: ease.pop });
  tl.tween(lockU, 1, { at: 31.4, dur: 0.7, ease: ease.enter });
  tl.hold(34.6, 1.4);

  return {
    tl,
    queueU,
    builderU,
    connQB,
    workU,
    railU,
    tokenU,
    gateStates,
    evidenceU,
    connBE,
    digestU,
    replayU,
    connBR,
    pointU,
    vlogU,
    claimU,
    statusU,
    lockU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

/** The event-log → digest strip: jsonl lines compressing into one hash. */
function DigestStrip({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const x = EVIDENCE.x - 120;
  const y = EVIDENCE.y + 64;
  const lines = 5;
  return (
    <g opacity={Math.min(1, uu * 2)}>
      {Array.from({ length: lines }, (_, i) => {
        const lu = clamp01(uu * lines - i);
        return (
          <rect key={i} x={x} y={y + i * 10} width={110 * lu} height={5} rx={2.5} fill={colors.ACCENT} opacity={0.5} />
        );
      })}
      <text x={x + 130} y={y + 28} fontSize={12.5} fontFamily={mono} fill={colors.POSITIVE} opacity={clamp01(uu * 3 - 2)}>
        {DIGEST}
      </text>
      <text x={x} y={y + 72} fontSize={11} fill={colors.MUTED} opacity={clamp01(uu * 3 - 2)}>
        same log twice → same digest (ef replay --digest)
      </text>
    </g>
  );
}

/** The Verification log card, claim lines typing in. */
function VerificationLog({ u, lines, status, dim = 0 }: { u: number; lines: number; status: number; dim?: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = VLOG;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={13}>
        readme.md — ## Verification log
      </text>
      {CLAIM_LINES.map((line, i) => {
        const lu = clamp01(lines * CLAIM_LINES.length - i);
        if (lu <= 0) return null;
        const shown = line.slice(0, Math.ceil(lu * line.length));
        return (
          <text key={i} x={18} y={56 + i * 22} fontSize={12.5} fontFamily={mono} fill={colors.TEXT}>
            {shown}
          </text>
        );
      })}
      {status > 0 && (
        <g transform={`translate(${w - 96}, ${h - 34})`} opacity={clamp01(status)}>
          <rect x={-70} y={-14} width={158} height={28} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={9} y={5} textAnchor="middle" fontSize={12} fontFamily={mono} fill={colors.WARM} fontWeight={700}>
            status: implemented
          </text>
        </g>
      )}
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const lockU = clamp01(s.get(scene.lockU));
  return (
    <>
      <ServiceNode {...QUEUE} kind="queue" label="QUEUE.md" sublabel="top eligible task" u={s.get(scene.queueU)} />
      <ServiceNode {...BUILDER} kind="server" label="builder" sublabel="fresh session" u={s.get(scene.builderU)} />
      <Connection from={{ x: QUEUE.x + 58, y: QUEUE.y }} to={{ x: BUILDER.x - 58, y: BUILDER.y }} u={s.get(scene.connQB)} label="picks" />
      <Zone x={WORKZONE.x} y={WORKZONE.y} w={WORKZONE.w} h={WORKZONE.h} label="work/ — gitignored scratch" kind="group" u={s.get(scene.workU)} />
      {clamp01(s.get(scene.workU)) > 0.5 && (
        <text x={WORKZONE.x + 16} y={WORKZONE.y + 56} fontSize={12} fill={colors.MUTED} opacity={clamp01(s.get(scene.workU) * 2 - 1)}>
          probes · ephemeral runs · no limit —
          <tspan x={WORKZONE.x + 16} dy={18}>none of it is the proof</tspan>
        </text>
      )}

      <GauntletRail
        x={RAIL.x}
        y={RAIL.y}
        w={RAIL.w}
        gates={GATES.map((label, i) => ({ label, state: s.get(scene.gateStates[i]) }))}
        u={s.get(scene.tokenU)}
        reveal={s.get(scene.railU)}
      />
      {clamp01(s.get(scene.railU)) > 0.7 && (
        <text x={RAIL.x + RAIL.w / 2} y={RAIL.y + 58} textAnchor="middle" fontSize={12} fill={colors.MUTED} opacity={clamp01(s.get(scene.railU) * 3 - 2)}>
          ascending cost — all green before any claim (make _v-gates)
        </text>
      )}

      <ServiceNode {...EVIDENCE} kind="db" label="evidence/" sublabel="committed artifacts" u={s.get(scene.evidenceU)} />
      <Connection
        from={{ x: BUILDER.x, y: BUILDER.y + 44 }}
        to={{ x: EVIDENCE.x, y: EVIDENCE.y - 44 }}
        u={s.get(scene.connBE)}
        label="log + digest"
      />
      <DigestStrip u={s.get(scene.digestU)} />

      <ServiceNode {...REPLAY} kind="external" label="Replay recording" sublabel="never committed, always cited" u={s.get(scene.replayU)} />
      <Connection
        from={{ x: BUILDER.x + 40, y: BUILDER.y + 44 }}
        to={{ x: REPLAY.x - 30, y: REPLAY.y - 44 }}
        u={s.get(scene.connBR)}
        label="record-run.sh"
      />
      {clamp01(s.get(scene.pointU)) > 0 && (
        <text x={REPLAY.x} y={REPLAY.y + 78} textAnchor="middle" fontSize={11.5} fontFamily={mono} fill={colors.SECONDARY} opacity={clamp01(s.get(scene.pointU))}>
          app.replay.io/recording/…?point=&lt;p&gt;&amp;time=&lt;ms&gt;
        </text>
      )}

      <VerificationLog u={s.get(scene.vlogU)} lines={s.get(scene.claimU)} status={s.get(scene.statusU)} />

      {/* BEAT 5 — verified is locked away from the builder */}
      {lockU > 0 && (
        <g opacity={lockU} transform={`translate(${VLOG.x + VLOG.w / 2}, ${VLOG.y - 40})`}>
          <rect x={-140} y={-18} width={280} height={30} rx={15} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} />
          <text y={3} textAnchor="middle" fontSize={12.5} fontFamily={mono} fill={colors.NEGATIVE} fontWeight={700}>
            verified 🔒 — critics only
          </text>
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/builder-critic-loop/chapter-2', beat: i }
export const vizScene = () => scene;
