// The Critic Attacks the Tape
//
// Backed by: wasm-vm AGENTS.md ("Verifier charter" — fresh session, ORIENT,
// PREDICT THEN VERIFY, every finding cites a point, COVERAGE holds the
// recording against the diff) and its example refuted log entry: the addiw
// sign-extension prediction (expected 0xffff_ffff_ffff_ff00, observed
// 0x0000_0000_ffff_ff00 at trace line 91442 / rr event 48123, rr replay -g),
// plus the misaligned-store coverage demand on src/bus.rs:141-158.
//
// Centerpiece: predict-then-verify — a falsifiable prediction card stamped
// BEFORE the read head sweeps the tape to the cited point and the observed
// value contradicts it — then the sufficiency audit: the diff held against
// the recording hunk by hunk, hit counts as ground truth.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { DiffLanes, PredictionCard, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Worker and critic sessions with a wall between — never the same session. */
const WORKER = { x: 250, y: 120 } as const;
const CRITIC = { x: 1030, y: 120 } as const;
const WALL_X = 640;

const TAPE = { x: 200, y: 250, w: 880, h: 32 } as const;
const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.08, kind: 'interaction' },
  { at: 0.22, kind: 'render' },
  { at: 0.36, kind: 'network' },
  { at: 0.52, kind: 'render' },
  { at: 0.68, kind: 'exception', label: 'trace line 91442' },
  { at: 0.82, kind: 'network' },
  { at: 0.94, kind: 'render' },
];
/** The cited point — the addiw contradiction from the AGENTS.md example. */
const CITE_AT = 0.68;

const PRED = { x: 170, y: 330, w: 450 } as const;
const DIFF = { x: 700, y: 360, w: 440 } as const;

const CAM_SESSIONS: CameraState = { x: 640, y: 150, k: 1.25 };
const CAM_TAPE: CameraState = { x: 640, y: 270, k: 1.2 };
const CAM_PRED: CameraState = { x: 430, y: 350, k: 1.3 };
const CAM_DIFF: CameraState = { x: 880, y: 400, k: 1.25 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.02 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  sessU: ChannelRef<number>;
  wallU: ChannelRef<number>;
  handU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  predU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  obsU: ChannelRef<number>;
  verdU: ChannelRef<number>;
  linkU: ChannelRef<number>;
  diffU: ChannelRef<number>;
  hitsU: ChannelRef<number>;
  classU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  finalU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const sessU = tl.channel('sessU', 0);
  const wallU = tl.channel('wallU', 0);
  const handU = tl.channel('handU', 0); // the tape handed across the wall
  const tapeU = tl.channel('tapeU', 0);
  const stampU = tl.channel('stampU', 0);
  const predU = tl.channel('predU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const obsU = tl.channel('obsU', 0);
  const verdU = tl.channel('verdU', 0);
  const linkU = tl.channel('linkU', 0);
  const diffU = tl.channel('diffU', 0);
  const hitsU = tl.channel('hitsU', 0);
  const classU = tl.channel('classU', 0);
  const dimU = tl.channel('dimU', 0);
  const finalU = tl.channel('finalU', 0);

  // — Beat 1 · a fresh session —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Now the tape changes hands. The verifier is a fresh session — never the one that wrote the code. It does not trust the summary, and it is not here to help. Its goal is to refute.',
  });
  tl.tween(cam, CAM_SESSIONS, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(sessU, 1, { at: 0.9, dur: 1.8, ease: ease.draw });
  tl.tween(wallU, 1, { at: 2.9, dur: 1.2, ease: ease.draw });
  tl.tween(handU, 1, { at: 4.4, dur: 1.6, ease: ease.linear });
  tl.hold(7.5, 0.5);

  // — Beat 2 · what it receives —
  tl.caption({
    at: 8.0,
    dur: 6,
    text: 'It receives three things: the task file with its acceptance criteria, the diff, and the recording. The same agent may play both roles — just never on the same task.',
  });
  tl.tween(cam, CAM_TAPE, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: 8.8, dur: 2.4, ease: ease.draw });
  tl.hold(14.0, 0.5);

  // — Beat 3 · attack one: falsification —
  tl.caption({
    at: 14.5,
    dur: 6.5,
    text: 'Attack one: falsification. Find one point in the recording where the program contradicts the claim. And the method is strict — predict first, then look.',
  });
  tl.tween(cam, CAM_PRED, { at: 14.7, dur: 1.4, ease: ease.move });
  tl.tween(stampU, 1, { at: 16.2, dur: 0.6, ease: ease.pop });
  tl.hold(21.0, 0.5);

  // — Beat 4 · the prediction —
  tl.caption({
    at: 21.5,
    dur: 7,
    text: 'Here the claim says a word instruction sign extends its result. So the critic writes the exact register value it should see, at a specific moment — before inspecting anything. A prediction made after looking is a caption, not a check.',
  });
  tl.tween(predU, 1, { at: 22.0, dur: 2.2, ease: ease.linear });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the read head finds the contradiction —
  tl.caption({
    at: 29.0,
    dur: 7,
    text: 'Then it replays the tape to that moment. The upper half of the register is zero — the sign extension never happened. The prediction fails, and the failure has an address.',
  });
  tl.tween(sweepU, CITE_AT, { at: 29.6, dur: 2.6, ease: ease.move });
  tl.tween(linkU, 1, { at: 32.4, dur: 0.7, ease: ease.pop });
  tl.tween(obsU, 1, { at: 33.2, dur: 1.2, ease: ease.linear });
  tl.tween(verdU, 1, { at: 34.8, dur: 0.6, ease: ease.pop });
  tl.hold(36.5, 0.6);

  // — Beat 6 · findings cite points —
  tl.caption({
    at: 37.1,
    dur: 6.5,
    text: 'That is the house style: every finding cites a point anyone can jump to. The atomics are wrong is an opinion. This register holds this value at this exact event is evidence.',
  });
  tl.hold(43.6, 0.5);

  // — Beat 7 · attack two: sufficiency —
  tl.caption({
    at: 44.1,
    dur: 7,
    text: 'Attack two: sufficiency. Hold the recording against the diff, hunk by hunk, and count how many times each changed line actually executed. Hit counts are ground truth.',
  });
  tl.tween(cam, CAM_DIFF, { at: 44.3, dur: 1.4, ease: ease.move });
  tl.tween(predU, 0.15, { at: 44.5, dur: 0.9, ease: ease.move });
  tl.tween(diffU, 1, { at: 45.0, dur: 2.2, ease: ease.draw });
  tl.tween(hitsU, 1, { at: 47.4, dur: 2.6, ease: ease.linear });
  tl.hold(51.6, 0.5);

  // — Beat 8 · unexecuted diff —
  tl.caption({
    at: 52.1,
    dur: 7.5,
    text: 'The misaligned store path in the bus never ran during the recorded run. Changed code the tape never exercised is either unproven — record a run that exercises it — or dead, and the critic gets to decide which.',
  });
  tl.tween(classU, 1, { at: 52.9, dur: 2.4, ease: ease.linear });
  tl.hold(60.1, 0.5);

  // — Beat 9 · the verdict —
  tl.caption({
    at: 60.6,
    dur: 6.5,
    text: 'Two findings, each pinned to a point. The verdict comes back in one word: refuted. The worker failed both ways at once — the evidence contradicts the claim, and it does not even cover it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 61.6, dur: 1.2, ease: ease.move });
  tl.tween(finalU, 1, { at: 62.8, dur: 0.9, ease: ease.enter });
  tl.hold(67.1, 1.2);

  return {
    tl, cam, sessU, wallU, handU, tapeU, stampU, predU, sweepU, obsU,
    verdU, linkU, diffU, hitsU, classU, dimU, finalU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function SessionNode({ x, y, label, sub, color, u }: { x: number; y: number; label: string; sub: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={34} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
      <circle cx={x} cy={y - 6} r={9} fill="none" stroke={color} strokeWidth={1.6} />
      <path d={`M ${x - 15} ${y + 20} q 15 -18 30 0`} fill="none" stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + 56} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
        {label}
      </text>
      <text x={x} y={y + 74} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
        {sub}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const sessU = s.get(scene.sessU);
  const wallU = s.get(scene.wallU);
  const handU = s.get(scene.handU);
  const tapeU = s.get(scene.tapeU);
  const stampU = s.get(scene.stampU);
  const predU = s.get(scene.predU);
  const sweepU = s.get(scene.sweepU);
  const obsU = s.get(scene.obsU);
  const verdU = s.get(scene.verdU);
  const linkU = s.get(scene.linkU);
  const diffU = s.get(scene.diffU);
  const hitsU = s.get(scene.hitsU);
  const classU = s.get(scene.classU);
  const dimU = s.get(scene.dimU);
  const finalU = s.get(scene.finalU);

  const worldOp = 1 - 0.86 * dimU;
  // the tape parcel travels worker → critic over the wall
  const parcelX = WORKER.x + (CRITIC.x - WORKER.x) * handU;
  const parcelY = 120 - Math.sin(Math.PI * handU) * 55;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- sessions + wall ---- */}
          <SessionNode x={WORKER.x} y={WORKER.y} label="worker" sub="session A — implemented it" color={colors.ACCENT} u={sessU} />
          <SessionNode x={CRITIC.x} y={CRITIC.y} label="verifier" sub="fresh session — here to refute" color={colors.NEGATIVE} u={clamp01(sessU * 2 - 1)} />
          {wallU > 0 && (
            <g opacity={wallU}>
              <line x1={WALL_X} y1={60} x2={WALL_X} y2={60 + 130 * wallU} stroke={colors.GRID} strokeWidth={3} strokeDasharray="8 6" />
              <text x={WALL_X} y={48} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                no shared memory
              </text>
            </g>
          )}
          {handU > 0 && handU < 1 && (
            <g transform={`translate(${parcelX} ${parcelY})`}>
              <rect x={-26} y={-9} width={52} height={18} rx={5} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text y={4} textAnchor="middle" fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>
                the tape
              </text>
            </g>
          )}

          {/* ---- the recording under interrogation ---- */}
          {tapeU > 0 && (
            <g opacity={Math.min(1, tapeU * 3)}>
              <RecordingStrip
                x={TAPE.x}
                y={TAPE.y}
                w={TAPE.w}
                h={TAPE.h}
                points={TAPE_POINTS}
                reveal={tapeU}
                u={sweepU}
                links={linkU > 0 ? [{ at: CITE_AT, label: 'trace line 91442 · rr event 48123', pop: linkU }] : []}
                title="the worker's recorded final run — rr replay"
              />
            </g>
          )}

          {/* ---- attack one: predict, then verify ---- */}
          {stampU > 0 && (
            <PredictionCard
              x={PRED.x}
              y={PRED.y}
              w={PRED.w}
              text="after the addiw, x5 = 0xffff_ffff_ffff_ff00 (sign-extended from bit 31)"
              stamp="predicted — before looking"
              stampU={stampU}
              u={predU}
              observed="observed: x5 = 0x0000_0000_ffff_ff00"
              observedU={obsU}
              verdictKind="failed"
              verdictU={verdU}
              link="rr replay -g 48123"
              linkU={linkU}
              dim={diffU > 0.3 ? 0.6 : 0}
            />
          )}

          {/* ---- attack two: the sufficiency audit ---- */}
          {diffU > 0 && (
            <g opacity={Math.min(1, diffU * 2)}>
              <DiffLanes
                x={DIFF.x}
                y={DIFF.y}
                w={DIFF.w}
                title="COVERAGE — the diff held against the recording"
                hunks={[
                  {
                    label: 'src/bus.rs — aligned load/store',
                    kind: 'executed',
                    hits: Math.round(4210 * hitsU),
                    u: clamp01(diffU * 3),
                    classU: clamp01(classU * 3),
                  },
                  {
                    label: 'src/bus.rs:141-158 — misaligned SD path',
                    kind: 'needs-proof',
                    hits: 0,
                    u: clamp01(diffU * 3 - 1),
                    classU: clamp01(classU * 3 - 1),
                  },
                  {
                    label: 'trace config plumbing',
                    kind: 'waived',
                    hits: 0,
                    u: clamp01(diffU * 3 - 2),
                    classU: clamp01(classU * 3 - 2),
                  },
                ]}
              />
            </g>
          )}
        </g>

        {/* ---- the verdict ---- */}
        {finalU > 0 && (
          <g opacity={finalU}>
            <rect x={320} y={240} width={640} height={150} rx={16} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
            <text x={640} y={292} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={800} fontFamily={MONO}>
              VERDICT: refuted
            </text>
            <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              falsified at rr event 48123 · coverage gap at src/bus.rs:141-158
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              fix, re-record — back to in-progress
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
