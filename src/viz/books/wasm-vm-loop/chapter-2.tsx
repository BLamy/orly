// The Worker Records the Run
//
// Backed by: wasm-vm AGENTS.md ("Worker protocol" — gates in ascending cost:
// cargo fmt --check → cargo clippy -D warnings → native tests → wasm32 build;
// "Self-validate freely... nothing here is evidence"; "Record the final happy
// run"), tools/rr/record-test.sh (packed rr traces into rr-traces/), and the
// real frozen evidence in wasm-vm evidence/e3-t15/README.md +
// native-alpine.evidence (trace fnv64=9948a06638286510, retired=4158532862,
// state sha256=d45f…, outcome=Exited(0)).
//
// Centerpiece: the gauntlet rail (a clippy failure bounces the token back to
// the top), ephemeral self-validation runs that puff away uncounted, then the
// SAME run performed one last time onto a growing recording tape — and the
// evidence card that freezes its digests.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { GauntletRail, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const GATE_LABELS = ['cargo fmt --check', 'cargo clippy -D warnings', 'native tests', 'wasm32 build'];
const RAIL = { x: 200, y: 200, w: 880 } as const;

/** Ephemeral self-validation puffs — ad-hoc runs, printf, scratch binaries. */
const PUFFS = [
  { x: 330, y: 420, label: 'ad-hoc run' },
  { x: 520, y: 460, label: 'printf' },
  { x: 700, y: 415, label: 'scratch binary' },
  { x: 880, y: 455, label: 'one more run' },
];

const TAPE = { x: 240, y: 430, w: 800, h: 32 } as const;
const TAPE_POINTS: RecordingPoint[] = [
  { at: 0.06, kind: 'interaction', label: 'boot' },
  { at: 0.2, kind: 'render' },
  { at: 0.34, kind: 'network' },
  { at: 0.47, kind: 'render' },
  { at: 0.6, kind: 'interaction' },
  { at: 0.74, kind: 'network' },
  { at: 0.88, kind: 'render' },
  { at: 0.97, kind: 'interaction', label: 'exit 0' },
];

/** The frozen evidence — real lines from evidence/e3-t15/native-alpine.evidence. */
const EVIDENCE_LINES = [
  'trace fnv64=9948a06638286510',
  'trace retired=4158532862',
  'state sha256=d45f529a…e8ace1',
  'outcome=Exited(0)',
];
const EV = { x: 800, y: 300, w: 340, h: 150 } as const;

/** The claim, written into the task file's Verification log. */
const LOG = { x: 150, y: 290, w: 480, h: 170 } as const;

const CAM_RAIL: CameraState = { x: 640, y: 220, k: 1.22 };
const CAM_PUFFS: CameraState = { x: 620, y: 400, k: 1.25 };
const CAM_TAPE: CameraState = { x: 640, y: 430, k: 1.2 };
const CAM_LOG: CameraState = { x: 560, y: 370, k: 1.28 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.02 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  railU: ChannelRef<number>;
  tokU: ChannelRef<number>;
  g0: ChannelRef<number>;
  g1: ChannelRef<number>;
  g2: ChannelRef<number>;
  g3: ChannelRef<number>;
  arcU: ChannelRef<number>;
  puffsU: ChannelRef<number>;
  puffFade: ChannelRef<number>;
  recU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  evU: ChannelRef<number>;
  logU: ChannelRef<number>;
  statusU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const tokU = tl.channel('tokU', -1);
  const g0 = tl.channel('g0', 0);
  const g1 = tl.channel('g1', 0);
  const g2 = tl.channel('g2', 0);
  const g3 = tl.channel('g3', 0);
  const arcU = tl.channel('arcU', 0);
  const puffsU = tl.channel('puffsU', 0);
  const puffFade = tl.channel('puffFade', 0);
  const recU = tl.channel('recU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const evU = tl.channel('evU', 0);
  const logU = tl.channel('logU', 0);
  const statusU = tl.channel('statusU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · pick work, meet the gates —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'A worker owns exactly one task. Before any of its own cleverness, the code must clear a rail of gates, ordered by cost — formatting first, the strictest linter next, then tests, then the browser build.',
  });
  tl.tween(cam, CAM_RAIL, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 0.9, dur: 2.4, ease: ease.draw });
  tl.tween(tokU, 0, { at: 3.8, dur: 0.8, ease: ease.move });
  tl.tween(g0, 1, { at: 4.8, dur: 0.5, ease: ease.pop });
  tl.tween(tokU, 1, { at: 5.4, dur: 0.9, ease: ease.move });
  tl.hold(7.5, 0.5);

  // — Beat 2 · any failure returns to the top —
  tl.caption({
    at: 8.0,
    dur: 6.5,
    text: 'Any failure sends the work straight back to the start. A warning at the linter gate is not a note for later — it is a trip back to the top of the rail.',
  });
  tl.tween(g1, -1, { at: 8.6, dur: 0.4, ease: ease.pop });
  tl.tween(arcU, 1, { at: 9.4, dur: 1.6, ease: ease.move });
  tl.tween(g1, 0, { at: 11.2, dur: 0.8, ease: ease.move });
  tl.tween(arcU, 0, { at: 11.4, dur: 0.01, ease: ease.move });
  tl.tween(tokU, 0, { at: 11.4, dur: 0.01, ease: ease.move });
  // second, clean lap
  tl.tween(g0, 1, { at: 11.8, dur: 0.4, ease: ease.pop });
  tl.tween(tokU, 1, { at: 12.0, dur: 0.7, ease: ease.move });
  tl.tween(g1, 1, { at: 12.9, dur: 0.4, ease: ease.pop });
  tl.tween(tokU, 2, { at: 13.1, dur: 0.7, ease: ease.move });
  tl.tween(g2, 1, { at: 13.9, dur: 0.4, ease: ease.pop });
  tl.tween(tokU, 3, { at: 14.1, dur: 0.7, ease: ease.move });
  tl.tween(g3, 1, { at: 14.9, dur: 0.5, ease: ease.pop });
  tl.hold(15.6, 0.5);

  // — Beat 3 · self-validate freely —
  tl.caption({
    at: 16.1,
    dur: 7,
    text: 'Then the worker drives the code however it likes. Ad hoc runs, print statements, scratch binaries — no limit, no ceremony. This inner loop belongs entirely to the worker.',
  });
  tl.tween(cam, CAM_PUFFS, { at: 16.3, dur: 1.4, ease: ease.move });
  tl.tween(puffsU, 1, { at: 16.8, dur: 3.2, ease: ease.linear });
  tl.hold(23.1, 0.5);

  // — Beat 4 · nothing here is evidence —
  tl.caption({
    at: 23.6,
    dur: 5.5,
    text: 'But watch what happens to those runs. They evaporate. Nothing in this inner loop is evidence — the verifier will never see any of it.',
  });
  tl.tween(puffFade, 1, { at: 24.4, dur: 2.4, ease: ease.move });
  tl.hold(29.1, 0.5);

  // — Beat 5 · record the final happy run —
  tl.caption({
    at: 29.6,
    dur: 7.5,
    text: 'So when the worker is finally satisfied, it runs the same validation one last time — under recording. The whole process goes onto tape: every thread, every syscall, every retired guest instruction.',
  });
  tl.tween(cam, CAM_TAPE, { at: 29.8, dur: 1.4, ease: ease.move });
  tl.tween(recU, 1, { at: 30.6, dur: 3.4, ease: ease.draw });
  tl.tween(sweepU, 1, { at: 30.8, dur: 5.2, ease: ease.linear });
  tl.hold(37.1, 0.5);

  // — Beat 6 · make the recorded run count —
  tl.caption({
    at: 37.6,
    dur: 6.5,
    text: 'And the recorded run has to count. Every behavior the diff changes should actually execute during it, because the critic will hold this tape against the diff, line by line.',
  });
  tl.hold(44.1, 0.5);

  // — Beat 7 · the evidence freezes —
  tl.caption({
    at: 44.6,
    dur: 7,
    text: 'The run freezes into the task folder as digests. A fingerprint of the instruction trace, the count of retired instructions, a hash of the final machine state, and a clean exit.',
  });
  tl.tween(cam, CAM_LOG, { at: 44.8, dur: 1.4, ease: ease.move });
  tl.tween(evU, 1, { at: 45.4, dur: 2.6, ease: ease.draw });
  tl.hold(51.6, 0.5);

  // — Beat 8 · the claim in the log —
  tl.caption({
    at: 52.1,
    dur: 7,
    text: 'Only now does the worker write its claim — one entry in the task file: the commit, the exact commands, the evidence paths, and one paragraph saying what the recording demonstrates.',
  });
  tl.tween(logU, 1, { at: 52.7, dur: 1.6, ease: ease.draw });
  tl.hold(59.1, 0.5);

  // — Beat 9 · implemented, not done —
  tl.caption({
    at: 59.6,
    dur: 6.5,
    text: 'Status flips to implemented — not to done. The worker is satisfied, and being satisfied is still just a claim. Someone hostile gets the tape next.',
  });
  tl.tween(statusU, 1, { at: 60.4, dur: 0.7, ease: ease.pop });
  tl.tween(cam, CAM_WIDE, { at: 62.0, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 62.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 63.8, dur: 0.9, ease: ease.enter });
  tl.hold(66.1, 1.2);

  return {
    tl, cam, railU, tokU, g0, g1, g2, g3, arcU, puffsU, puffFade,
    recU, sweepU, evU, logU, statusU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const tokU = s.get(scene.tokU);
  const gates = [s.get(scene.g0), s.get(scene.g1), s.get(scene.g2), s.get(scene.g3)];
  const arcU = s.get(scene.arcU);
  const puffsU = s.get(scene.puffsU);
  const puffFade = s.get(scene.puffFade);
  const recU = s.get(scene.recU);
  const sweepU = s.get(scene.sweepU);
  const evU = s.get(scene.evU);
  const logU = s.get(scene.logU);
  const statusU = s.get(scene.statusU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const worldOp = 1 - 0.86 * dimU;
  const puffAlive = puffsU > 0 && puffFade < 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the gauntlet ---- */}
          {railU > 0 && (
            <g opacity={0.14 + 0.86 * Math.min(1, railU * 4) * (recU > 0 ? 0.35 : 1)}>
              <text x={RAIL.x} y={RAIL.y - 58} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                gates in ascending cost
              </text>
              <text x={RAIL.x} y={RAIL.y - 38} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                AGENTS.md worker protocol — any failure returns to the top
              </text>
              <GauntletRail
                x={RAIL.x}
                y={RAIL.y}
                w={RAIL.w}
                gates={GATE_LABELS.map((label, i) => ({ label, state: gates[i] }))}
                u={arcU > 0 ? -1 : tokU}
                reveal={railU}
                arcU={arcU}
                arcFrom={1}
              />
            </g>
          )}

          {/* ---- self-validation puffs ---- */}
          {puffAlive && (
            <g opacity={1 - puffFade}>
              {PUFFS.map((p, i) => {
                const u = clamp01(puffsU * (PUFFS.length + 1) - i);
                if (u <= 0) return null;
                const grow = 1 - puffFade * 0.4;
                return (
                  <g key={p.label} opacity={u} transform={`translate(${p.x} ${p.y - puffFade * 26}) scale(${grow})`}>
                    <circle r={26} fill={colors.SECONDARY} opacity={0.14} />
                    <circle r={16} fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="3 4" />
                    <text y={4} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily={MONO}>
                      run
                    </text>
                    <text y={44} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                      {p.label}
                    </text>
                  </g>
                );
              })}
              {puffsU > 0.9 && puffFade < 0.4 && (
                <text x={620} y={520} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
                  self-validate freely — nothing here is evidence
                </text>
              )}
            </g>
          )}

          {/* ---- the recording ---- */}
          {recU > 0 && (
            <g opacity={Math.min(1, recU * 3) * (evU > 0.5 ? 0.4 : 1)}>
              <text x={TAPE.x} y={TAPE.y - 40} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                the final happy run — recorded
              </text>
              <text x={TAPE.x} y={TAPE.y - 20} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                tools/rr/record-test.sh → rr-traces/ · guest trace + state digests
              </text>
              <RecordingStrip
                x={TAPE.x}
                y={TAPE.y}
                w={TAPE.w}
                h={TAPE.h}
                points={TAPE_POINTS}
                reveal={recU}
                u={sweepU}
                title="one deterministic tape of the whole process"
              />
            </g>
          )}

          {/* ---- the evidence card ---- */}
          {evU > 0 && (
            <g opacity={Math.min(1, evU * 2)}>
              <rect x={EV.x} y={EV.y} width={EV.w} height={EV.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={EV.x + 16} y={EV.y + 26} fill={colors.TEXT} fontSize={13} fontWeight={700}>
                evidence/e3-t15
              </text>
              {EVIDENCE_LINES.map((line, i) => {
                const u = clamp01(evU * (EVIDENCE_LINES.length + 1) - (i + 1));
                if (u <= 0) return null;
                return (
                  <text key={line} x={EV.x + 16} y={EV.y + 52 + i * 24} fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO} opacity={u}>
                    {line}
                  </text>
                );
              })}
            </g>
          )}

          {/* ---- the claim / verification log ---- */}
          {logU > 0 && (
            <g opacity={Math.min(1, logU * 2)}>
              <rect x={LOG.x} y={LOG.y} width={LOG.w} height={LOG.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={LOG.x + 16} y={LOG.y + 28} fill={colors.TEXT} fontSize={13} fontWeight={700}>
                Verification log — the claim
              </text>
              {['commit hash + exact commands run', 'evidence paths: trace dirs, digest files', 'one paragraph: what the recording demonstrates'].map((line, i) => {
                const u = clamp01(logU * 4 - (i + 1));
                if (u <= 0) return null;
                return (
                  <text key={line} x={LOG.x + 16} y={LOG.y + 58 + i * 26} fill={colors.MUTED} fontSize={12} opacity={u}>
                    · {line}
                  </text>
                );
              })}
              {statusU > 0 && (
                <g opacity={statusU}>
                  <rect x={LOG.x + 16} y={LOG.y + LOG.h - 40} width={210} height={26} rx={7} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                  <text x={LOG.x + 26} y={LOG.y + LOG.h - 22} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                    status: implemented
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
              the diff, the claim, and the tape
            </text>
            <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              status: implemented — awaiting adversarial verification
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
