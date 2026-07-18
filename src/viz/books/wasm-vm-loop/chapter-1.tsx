// A Claim Is Not Evidence
//
// Backed by: wasm-vm AGENTS.md ("The one rule" — an implementer being
// satisfied is a claim; a deterministic recording is evidence; only the
// verifier sets `verified`), tasks/QUEUE.md (87/228 verified, the Next up
// list: E3-T11, E3-T16, E3-T17, E3-T21), tasks/README.md (the lifecycle:
// pending → in-progress → implemented → verified, refuted looping back).
//
// Centerpiece: a balance scale that weighs a worker's speech-bubble claim
// against a recording tape — the tape wins — then the task lifecycle as a
// state machine a token actually walks, with the refuted arc bending back.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — 1280×720; bottom ~12% (y ≳ 633) reserved for the CC pill.
// ---------------------------------------------------------------------------

/** The queue — real "Next up" entries from tasks/QUEUE.md. */
const QUEUE_TASKS = [
  { id: 'E3-T11', title: 'Reproducible Alpine disk-image pipeline v2' },
  { id: 'E3-T16', title: 'WebSocket TCP proxy — framing + Rust relay' },
  { id: 'E3-T17', title: 'Fetch-based HTTP gateway transport' },
  { id: 'E3-T21', title: 'Host to guest file transfer' },
];
const QUEUE = { x: 80, y: 120, w: 420, rowH: 56, gap: 12 } as const;

/** The scale: claim pan (left) vs evidence pan (right). */
const SCALE = { cx: 880, cy: 300, beamW: 380, postH: 110 } as const;

/** Recording points on the evidence tape (the run's texture). */
const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.1, kind: 'interaction' },
  { at: 0.26, kind: 'network' },
  { at: 0.44, kind: 'render' },
  { at: 0.6, kind: 'interaction' },
  { at: 0.78, kind: 'network' },
  { at: 0.92, kind: 'render' },
];

/** Lifecycle state machine — tasks/README.md verbatim states. */
const STATES = [
  { id: 'pending', x: 190, y: 470 },
  { id: 'in-progress', x: 470, y: 470 },
  { id: 'implemented', x: 760, y: 470 },
  { id: 'verified', x: 1060, y: 470 },
] as const;
const REFUTED = { x: 615, y: 578 } as const;
const NODE = { w: 168, h: 46 } as const;

// token path along the lifecycle: u in [0..3] walks the four states;
// u in [3..4] rides the refuted arc implemented → refuted → in-progress.
function tokenPos(u: number): { x: number; y: number } {
  if (u <= 3) {
    const i = Math.min(2, Math.floor(u));
    const f = u - i;
    const a = STATES[i];
    const b = STATES[Math.min(3, i + 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y };
  }
  // quadratic dip: implemented → refuted → in-progress
  const f = clamp01(u - 3);
  const a = STATES[2];
  const b = STATES[1];
  const q = 1 - f;
  return {
    x: q * q * a.x + 2 * q * f * REFUTED.x + f * f * b.x,
    y: q * q * a.y + 2 * q * f * (REFUTED.y + 26) + f * f * b.y,
  };
}

const CAM_QUEUE: CameraState = { x: 400, y: 300, k: 1.3 };
const CAM_SCALE: CameraState = { x: 860, y: 300, k: 1.25 };
const CAM_LIFE: CameraState = { x: 640, y: 480, k: 1.28 };
const CAM_WIDE: CameraState = { x: 640, y: 380, k: 1.02 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  queueU: ChannelRef<number>;
  counterU: ChannelRef<number>;
  openU: ChannelRef<number>;
  claimU: ChannelRef<number>;
  scaleU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  tiltU: ChannelRef<number>;
  lifeU: ChannelRef<number>;
  tokenU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  refutedU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const queueU = tl.channel('queueU', 0);
  const counterU = tl.channel('counterU', 0);
  const openU = tl.channel('openU', 0);
  const claimU = tl.channel('claimU', 0);
  const scaleU = tl.channel('scaleU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const tiltU = tl.channel('tiltU', 0); // −1 claim heavy … +1 evidence heavy
  const lifeU = tl.channel('lifeU', 0);
  const tokenU = tl.channel('tokenU', 0);
  const stampU = tl.channel('stampU', 0);
  const refutedU = tl.channel('refutedU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the repo that builds itself —
  tl.caption({
    at: 0.5,
    dur: 7.5,
    text: 'This repository is a full processor emulator in Rust, built almost entirely by an agent loop. Two hundred twenty eight tasks sit in one ordered queue, and agents work them one at a time.',
  });
  tl.tween(cam, CAM_QUEUE, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(queueU, 1, { at: 0.9, dur: 2.8, ease: ease.draw });
  tl.tween(counterU, 1, { at: 4.2, dur: 1.6, ease: ease.linear });
  tl.hold(8.0, 0.6);

  // — Beat 2 · the top of the queue —
  tl.caption({
    at: 8.6,
    dur: 6.5,
    text: 'A worker takes the top task whose dependencies are all verified. It reads the task file, implements it, runs it, and comes back satisfied.',
  });
  tl.tween(openU, 1, { at: 9.0, dur: 1.2, ease: ease.move });
  tl.hold(15.1, 0.5);

  // — Beat 3 · the claim —
  tl.caption({
    at: 15.6,
    dur: 6,
    text: 'And here is the one rule the whole system serves. When that worker says it works — that is a claim. Nothing more.',
  });
  tl.tween(cam, CAM_SCALE, { at: 15.8, dur: 1.4, ease: ease.move });
  tl.tween(queueU, 0.12, { at: 15.8, dur: 0.9, ease: ease.move });
  tl.tween(openU, 0, { at: 15.8, dur: 0.9, ease: ease.move });
  tl.tween(scaleU, 1, { at: 16.6, dur: 1.3, ease: ease.draw });
  tl.tween(claimU, 1, { at: 18.2, dur: 0.8, ease: ease.enter });
  tl.tween(tiltU, -1, { at: 19.2, dur: 1.0, ease: ease.move });
  tl.hold(21.6, 0.5);

  // — Beat 4 · the evidence —
  tl.caption({
    at: 22.1,
    dur: 7.5,
    text: 'A deterministic recording of the run that satisfied them — every instruction, every syscall, replayable after the fact — that is evidence. The scale only ever tips one way.',
  });
  tl.tween(tapeU, 1, { at: 22.6, dur: 2.2, ease: ease.draw });
  tl.tween(tiltU, 1, { at: 25.4, dur: 1.4, ease: ease.move });
  tl.hold(29.6, 0.6);

  // — Beat 5 · not trust me —
  tl.caption({
    at: 30.2,
    dur: 6,
    text: 'The doctrine, in one line: not trust me, I checked — here is the session where it worked, in full. Interrogate it.',
  });
  tl.hold(36.2, 0.6);

  // — Beat 6 · the lifecycle —
  tl.caption({
    at: 36.8,
    dur: 7,
    text: 'Every task walks the same little state machine. Pending, in progress, implemented — and then a hard wall. Implemented is where the worker stops.',
  });
  tl.tween(cam, CAM_LIFE, { at: 37.0, dur: 1.5, ease: ease.move });
  tl.tween(scaleU, 0.14, { at: 37.2, dur: 0.9, ease: ease.move });
  tl.tween(claimU, 0, { at: 37.2, dur: 0.9, ease: ease.move });
  tl.tween(tapeU, 0.14, { at: 37.2, dur: 0.9, ease: ease.move });
  tl.tween(lifeU, 1, { at: 37.8, dur: 2.2, ease: ease.draw });
  tl.tween(tokenU, 2, { at: 40.4, dur: 2.6, ease: ease.move });
  tl.hold(43.8, 0.5);

  // — Beat 7 · only the verifier —
  tl.caption({
    at: 44.3,
    dur: 7,
    text: 'Only a separate, adversarial verifier can grant the last step. Verified is terminal, and no worker ever stamps its own work.',
  });
  tl.tween(tokenU, 3, { at: 45.4, dur: 1.6, ease: ease.move });
  tl.tween(stampU, 1, { at: 47.4, dur: 0.7, ease: ease.pop });
  tl.hold(51.3, 0.5);

  // — Beat 8 · the refuted arc —
  tl.caption({
    at: 51.8,
    dur: 7,
    text: 'And when the verifier breaks the claim instead, the task drops to refuted and rides straight back to in progress. The loop has teeth, and we will watch them bite.',
  });
  tl.tween(refutedU, 1, { at: 52.4, dur: 1.4, ease: ease.draw });
  tl.tween(tokenU, 2, { at: 54.0, dur: 0.01, ease: ease.move });
  tl.tween(tokenU, 4, { at: 54.2, dur: 2.0, ease: ease.move });
  tl.hold(58.8, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 59.3,
    dur: 6.5,
    text: 'Eighty seven of those two hundred twenty eight tasks are verified so far — every one of them past a critic that tried to break it. Next: how a worker earns its recording.',
  });
  tl.tween(cam, CAM_WIDE, { at: 59.5, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 59.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.9, dur: 0.9, ease: ease.enter });
  tl.hold(65.8, 1.2);

  return {
    tl, cam, queueU, counterU, openU, claimU, scaleU, tapeU, tiltU,
    lifeU, tokenU, stampU, refutedU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const queueU = s.get(scene.queueU);
  const counterU = s.get(scene.counterU);
  const openU = s.get(scene.openU);
  const claimU = s.get(scene.claimU);
  const scaleU = s.get(scene.scaleU);
  const tapeU = s.get(scene.tapeU);
  const tiltU = s.get(scene.tiltU);
  const lifeU = s.get(scene.lifeU);
  const tokenU = s.get(scene.tokenU);
  const stampU = s.get(scene.stampU);
  const refutedU = s.get(scene.refutedU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const worldOp = 1 - 0.86 * dimU;
  const tilt = 9 * tiltU; // degrees
  const tok = tokenU > 0 ? tokenPos(tokenU) : null;
  const verified = Math.round(87 * clamp01(counterU));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the queue ---- */}
          {queueU > 0 && (
            <g opacity={Math.min(1, queueU * 3) * (0.12 + 0.88 * queueU)}>
              <text x={QUEUE.x} y={QUEUE.y - 34} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                the priority queue
              </text>
              <text x={QUEUE.x} y={QUEUE.y - 14} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                tasks/QUEUE.md — generated by tools/build_queue.py
              </text>
              {QUEUE_TASKS.map((t, i) => {
                const u = clamp01(queueU * (QUEUE_TASKS.length + 1.5) - i);
                if (u <= 0) return null;
                const top = i === 0;
                const y = QUEUE.y + i * (QUEUE.rowH + QUEUE.gap);
                const lift = top ? openU : 0;
                return (
                  <g key={t.id} opacity={u} transform={`translate(${lift * 60} ${(1 - u) * 14})`}>
                    <rect
                      x={QUEUE.x} y={y} width={QUEUE.w + lift * 120} height={QUEUE.rowH} rx={10}
                      fill={colors.PANEL}
                      stroke={top && openU > 0.3 ? colors.ACCENT : colors.GRID}
                      strokeWidth={top && openU > 0.3 ? 1.8 : 1}
                    />
                    <text x={QUEUE.x + 16} y={y + 24} fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO}>
                      {t.id}
                    </text>
                    <text x={QUEUE.x + 16} y={y + 43} fill={colors.TEXT} fontSize={12} opacity={0.9}>
                      {t.title}
                    </text>
                    {top && openU > 0.5 && (
                      <text x={QUEUE.x + QUEUE.w + lift * 120 - 14} y={y + 34} textAnchor="end" fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={(openU - 0.5) * 2}>
                        status: in-progress
                      </text>
                    )}
                  </g>
                );
              })}
              {counterU > 0 && (
                <text x={QUEUE.x} y={QUEUE.y + 4 * (QUEUE.rowH + QUEUE.gap) + 30} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} opacity={Math.min(1, counterU * 3)}>
                  {verified} / 228 tasks verified
                </text>
              )}
            </g>
          )}

          {/* ---- the scale ---- */}
          {scaleU > 0 && (
            <g opacity={0.14 + 0.86 * scaleU}>
              {/* post + base */}
              <line x1={SCALE.cx} y1={SCALE.cy} x2={SCALE.cx} y2={SCALE.cy + SCALE.postH} stroke={colors.GRID} strokeWidth={3} />
              <line x1={SCALE.cx - 60} y1={SCALE.cy + SCALE.postH} x2={SCALE.cx + 60} y2={SCALE.cy + SCALE.postH} stroke={colors.GRID} strokeWidth={3} />
              {/* beam, tilting */}
              <g transform={`rotate(${tilt} ${SCALE.cx} ${SCALE.cy})`}>
                <line x1={SCALE.cx - SCALE.beamW / 2} y1={SCALE.cy} x2={SCALE.cx + SCALE.beamW / 2} y2={SCALE.cy} stroke={colors.TEXT} strokeWidth={3} strokeLinecap="round" />
                {/* claim pan (left) */}
                <g transform={`rotate(${-tilt} ${SCALE.cx - SCALE.beamW / 2} ${SCALE.cy})`}>
                  <line x1={SCALE.cx - SCALE.beamW / 2} y1={SCALE.cy} x2={SCALE.cx - SCALE.beamW / 2} y2={SCALE.cy + 34} stroke={colors.GRID} strokeWidth={1.5} />
                  {claimU > 0 && (
                    <g opacity={claimU}>
                      <rect x={SCALE.cx - SCALE.beamW / 2 - 78} y={SCALE.cy + 34} width={156} height={44} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
                      <text x={SCALE.cx - SCALE.beamW / 2} y={SCALE.cy + 54} textAnchor="middle" fill={colors.WARM} fontSize={13} fontStyle="italic">
                        “it works”
                      </text>
                      <text x={SCALE.cx - SCALE.beamW / 2} y={SCALE.cy + 70} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                        a claim
                      </text>
                    </g>
                  )}
                </g>
                {/* evidence pan (right) */}
                <g transform={`rotate(${-tilt} ${SCALE.cx + SCALE.beamW / 2} ${SCALE.cy})`}>
                  <line x1={SCALE.cx + SCALE.beamW / 2} y1={SCALE.cy} x2={SCALE.cx + SCALE.beamW / 2} y2={SCALE.cy + 34} stroke={colors.GRID} strokeWidth={1.5} />
                  {tapeU > 0 && (
                    <g opacity={Math.min(1, tapeU * 2)}>
                      <RecordingStrip
                        x={SCALE.cx + SCALE.beamW / 2 - 110}
                        y={SCALE.cy + 40}
                        w={220}
                        h={26}
                        points={TAPE_POINTS}
                        reveal={tapeU}
                        title="rr trace + guest instruction trace"
                      />
                      <text x={SCALE.cx + SCALE.beamW / 2} y={SCALE.cy + 92} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                        evidence
                      </text>
                    </g>
                  )}
                </g>
              </g>
              <text x={SCALE.cx} y={SCALE.cy - 84} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700} opacity={scaleU}>
                the one rule
              </text>
              <text x={SCALE.cx} y={SCALE.cy - 64} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={scaleU}>
                AGENTS.md — no task reaches verified on claims
              </text>
            </g>
          )}

          {/* ---- the lifecycle ---- */}
          {lifeU > 0 && (
            <g>
              {/* forward edges */}
              {STATES.slice(0, -1).map((a, i) => {
                const b = STATES[i + 1];
                const u = clamp01(lifeU * 3 - i);
                return (
                  <line
                    key={a.id}
                    x1={a.x + NODE.w / 2} y1={a.y}
                    x2={a.x + NODE.w / 2 + (b.x - NODE.w / 2 - (a.x + NODE.w / 2)) * u} y2={a.y}
                    stroke={colors.GRID} strokeWidth={2} markerEnd={undefined}
                  />
                );
              })}
              {STATES.map((st, i) => {
                const u = clamp01(lifeU * (STATES.length + 1) - i);
                if (u <= 0) return null;
                const isVerified = st.id === 'verified';
                const lit = isVerified && stampU > 0.3;
                return (
                  <g key={st.id} opacity={u}>
                    <rect
                      x={st.x - NODE.w / 2} y={st.y - NODE.h / 2} width={NODE.w} height={NODE.h} rx={10}
                      fill={colors.PANEL}
                      stroke={lit ? colors.POSITIVE : colors.GRID}
                      strokeWidth={lit ? 2 : 1}
                    />
                    <text x={st.x} y={st.y + 5} textAnchor="middle" fill={lit ? colors.POSITIVE : colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                      {st.id}
                    </text>
                  </g>
                );
              })}
              {lifeU > 0.8 && (
                <text x={STATES[3].x} y={STATES[3].y - 40} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={(lifeU - 0.8) * 5}>
                  terminal — only the verifier sets this
                </text>
              )}
              {/* refuted arc */}
              {refutedU > 0 && (
                <g opacity={refutedU}>
                  <path
                    d={`M ${STATES[2].x} ${STATES[2].y + NODE.h / 2} Q ${REFUTED.x} ${REFUTED.y + 40} ${STATES[1].x} ${STATES[1].y + NODE.h / 2}`}
                    fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 5"
                  />
                  <rect x={REFUTED.x - 62} y={REFUTED.y - 18} width={124} height={34} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                  <text x={REFUTED.x} y={REFUTED.y + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
                    refuted
                  </text>
                </g>
              )}
              {/* the walking token */}
              {tok && (
                <g>
                  <circle cx={tok.x} cy={tok.y - NODE.h / 2 - 14} r={10} fill={tokenU > 3 ? colors.NEGATIVE : colors.ACCENT} opacity={0.25} />
                  <circle cx={tok.x} cy={tok.y - NODE.h / 2 - 14} r={5.5} fill={tokenU > 3 ? colors.NEGATIVE : colors.ACCENT} />
                </g>
              )}
              {stampU > 0 && (
                <g opacity={stampU} transform={`translate(${STATES[3].x + 62} ${STATES[3].y - 30}) rotate(-10)`}>
                  <rect x={-34} y={-13} width={68} height={26} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                  <text y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontWeight={700}>
                    critic
                  </text>
                </g>
              )}
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={340} y={250} width={600} height={130} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              a claim is not evidence
            </text>
            <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              87 / 228 verified — every one past an adversarial critic
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
