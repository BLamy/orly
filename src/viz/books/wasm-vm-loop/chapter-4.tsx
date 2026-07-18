// Refuted Means Start Over
//
// Backed by: wasm-vm AGENTS.md ("The gauntlet" — a failure at ANY stage
// returns the worker to the top, with the failure report as new context; a
// fix applied mid-pipeline never re-earned the earlier gates; every verified
// task deposits promoted tests, golden traces, and fuzz seeds into the cheap
// gates), tools/build_queue.py (regenerates tasks/QUEUE.md after every status
// flip; refuted renders as [!]), tasks/README.md (refuted → back to the
// implementer), and the real rework evidence dir evidence/e3-t14-rework
// (v1 then v3 browser runs — the loop actually ran here).
//
// Centerpiece: the whole pipeline as a ring a work-token laps — implement →
// gates → record → verify — where a refutation throws the token back to the
// start carrying the report, and each verified lap visibly deposits promoted
// tests into the early gates, making the next lap stricter.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { GauntletRail, LoopRing } from '../../agent';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const RING = { cx: 400, cy: 330, r: 170 } as const;
const RING_STOPS = [
  { label: 'implement' },
  { label: 'fmt · clippy · tests' },
  { label: 'record the run' },
  { label: 'adversarial verify', color: colors.NEGATIVE },
];

/** The queue file re-rendering — real marks from tasks/QUEUE.md. */
const QFILE = { x: 780, y: 130, w: 380, h: 190 } as const;
const Q_ROWS = [
  { mark: '[x]', id: 'E3-T13', ok: true },
  { mark: '[!]', id: 'E3-T14', ok: false },
  { mark: '[ ]', id: 'E3-T15', ok: true },
];

/** The rework evidence dir — real sibling files in evidence/e3-t14-rework. */
const EVDIR = { x: 780, y: 360, w: 380, h: 170 } as const;
const EV_FILES = ['native-alpine.evidence', 'native-alpine-v3.evidence', 'browser-v3-summary.json'];

/** The compounding rail at the bottom of the arc. */
const RAIL = { x: 180, y: 560, w: 920 } as const;
const RAIL_GATES = ['promoted tests', 'golden traces', 'fuzz corpus', 'make verify-*'];

const CAM_RING: CameraState = { x: 430, y: 320, k: 1.25 };
const CAM_QUEUE: CameraState = { x: 900, y: 230, k: 1.3 };
const CAM_EV: CameraState = { x: 900, y: 420, k: 1.3 };
const CAM_RAIL: CameraState = { x: 640, y: 520, k: 1.18 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  lapU: ChannelRef<number>;
  reportU: ChannelRef<number>;
  qU: ChannelRef<number>;
  qFlipU: ChannelRef<number>;
  evU: ChannelRef<number>;
  railU: ChannelRef<number>;
  depU: ChannelRef<number>;
  verifiedU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const lapU = tl.channel('lapU', 0); // laps around the ring
  const reportU = tl.channel('reportU', 0); // the report riding with the token
  const qU = tl.channel('qU', 0);
  const qFlipU = tl.channel('qFlipU', 0);
  const evU = tl.channel('evU', 0);
  const railU = tl.channel('railU', 0);
  const depU = tl.channel('depU', 0);
  const verifiedU = tl.channel('verifiedU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the refutation lands —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'A refutation is not a rejection letter — it is a work order. The verdict flips the task back to in progress, and the whole pipeline becomes a ring the work must lap again.',
  });
  tl.tween(cam, CAM_RING, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · back to the top, with context —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'And the worker starts over from the top — not from where it failed. A fix applied halfway through never re-earned the earlier gates, so failure at any stage means a full new lap.',
  });
  tl.tween(lapU, 0.72, { at: 8.0, dur: 2.4, ease: ease.move });
  tl.tween(lapU, 1.0, { at: 10.8, dur: 1.4, ease: ease.move });
  tl.hold(14.5, 0.5);

  // — Beat 3 · the report is the new context —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'The worker does not lap empty handed. The critic report rides along as its new context — the exact predictions that failed, the exact hunks the tape never touched.',
  });
  tl.tween(reportU, 1, { at: 15.6, dur: 1.0, ease: ease.enter });
  tl.tween(lapU, 1.5, { at: 17.0, dur: 2.6, ease: ease.move });
  tl.hold(21.5, 0.5);

  // — Beat 4 · the queue shows it —
  tl.caption({
    at: 22.0,
    dur: 6.5,
    text: 'Nothing about this is private. Every status flip regenerates the queue file, so a refuted task sits in the open, marked with an exclamation point, blocking everything that depends on it.',
  });
  tl.tween(cam, CAM_QUEUE, { at: 22.2, dur: 1.4, ease: ease.move });
  tl.tween(qU, 1, { at: 22.8, dur: 2.0, ease: ease.draw });
  tl.tween(qFlipU, 1, { at: 25.2, dur: 0.7, ease: ease.pop });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the rework evidence, for real —
  tl.caption({
    at: 29.0,
    dur: 7,
    text: 'This is not hypothetical. The networking task in this very repository went around the loop — its evidence folder holds the first recorded run and the version three rerun, side by side.',
  });
  tl.tween(cam, CAM_EV, { at: 29.2, dur: 1.4, ease: ease.move });
  tl.tween(evU, 1, { at: 29.8, dur: 2.6, ease: ease.draw });
  tl.hold(36.0, 0.5);

  // — Beat 6 · rework until the critic runs dry —
  tl.caption({
    at: 36.5,
    dur: 6.5,
    text: 'The lap repeats until the critic runs out of ways to break the claim. Verified is not the worker giving up on finding bugs — it is the attacker giving up on finding them.',
  });
  tl.tween(cam, CAM_RING, { at: 36.7, dur: 1.4, ease: ease.move });
  tl.tween(lapU, 2.0, { at: 37.4, dur: 2.2, ease: ease.move });
  tl.tween(verifiedU, 1, { at: 40.0, dur: 0.7, ease: ease.pop });
  tl.hold(43.0, 0.5);

  // — Beat 7 · the deposit —
  tl.caption({
    at: 43.5,
    dur: 7.5,
    text: 'And each verified lap leaves something behind. The critic promotes what it checked into permanent artifacts — committed tests, golden traces, fuzz seeds, standing verify targets — deposited into the cheap gates at the front.',
  });
  tl.tween(cam, CAM_RAIL, { at: 43.7, dur: 1.5, ease: ease.move });
  tl.tween(railU, 1, { at: 44.4, dur: 2.2, ease: ease.draw });
  tl.tween(depU, 1, { at: 47.2, dur: 2.4, ease: ease.linear });
  tl.hold(51.5, 0.5);

  // — Beat 8 · the pipeline gets stricter —
  tl.caption({
    at: 52.0,
    dur: 6,
    text: 'So the pipeline gets stricter every time it runs. The next worker faces every trap every previous critic ever set. That compounding is what the whole system is built for.',
  });
  tl.hold(58.0, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 58.5,
    dur: 6,
    text: 'Refuted, rework, re-record, re-attack — and a suite that only ever ratchets tighter. One question left: why not just ask a model to read the diff?',
  });
  tl.tween(cam, CAM_WIDE, { at: 58.7, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 59.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 60.7, dur: 0.9, ease: ease.enter });
  tl.hold(64.5, 1.2);

  return { tl, cam, ringU, lapU, reportU, qU, qFlipU, evU, railU, depU, verifiedU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;
function ringPos(u: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (((u % 1) + 1) % 1) * TAU;
  return { x: RING.cx + RING.r * Math.cos(a), y: RING.cy + RING.r * Math.sin(a) };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const lapU = s.get(scene.lapU);
  const reportU = s.get(scene.reportU);
  const qU = s.get(scene.qU);
  const qFlipU = s.get(scene.qFlipU);
  const evU = s.get(scene.evU);
  const railU = s.get(scene.railU);
  const depU = s.get(scene.depU);
  const verifiedU = s.get(scene.verifiedU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const worldOp = 1 - 0.86 * dimU;
  const tok = ringPos(lapU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the ring ---- */}
          {ringU > 0 && (
            <g>
              <LoopRing
                cx={RING.cx}
                cy={RING.cy}
                r={RING.r}
                stops={RING_STOPS}
                u={lapU}
                reveal={ringU}
                color={verifiedU > 0.3 ? colors.POSITIVE : colors.ACCENT}
                labelSize={12.5}
              />
              <text x={RING.cx} y={RING.cy - 14} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700} opacity={ringU}>
                the proof loop
              </text>
              <text x={RING.cx} y={RING.cy + 8} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO} opacity={ringU}>
                refuted → in-progress → re-record
              </text>
              {/* the report riding with the token */}
              {reportU > 0 && lapU < 2 && (
                <g opacity={reportU} transform={`translate(${tok.x + 16} ${tok.y - 24})`}>
                  <rect x={0} y={-12} width={92} height={24} rx={6} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
                  <text x={46} y={4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={9.5} fontFamily={MONO}>
                    critic report
                  </text>
                </g>
              )}
              {verifiedU > 0 && (
                <g opacity={verifiedU} transform={`translate(${RING.cx} ${RING.cy + 40})`}>
                  <rect x={-58} y={-15} width={116} height={30} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} />
                  <text y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                    verified
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- the queue file ---- */}
          {qU > 0 && (
            <g opacity={Math.min(1, qU * 2) * (evU > 0.4 ? 0.35 : 1)}>
              <rect x={QFILE.x} y={QFILE.y} width={QFILE.w} height={QFILE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={QFILE.x + 16} y={QFILE.y + 28} fill={colors.TEXT} fontSize={13} fontWeight={700}>
                tasks/QUEUE.md
              </text>
              <text x={QFILE.x + QFILE.w - 16} y={QFILE.y + 28} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                tools/build_queue.py
              </text>
              {Q_ROWS.map((r, i) => {
                const u = clamp01(qU * (Q_ROWS.length + 1) - (i + 1));
                if (u <= 0) return null;
                const flip = !r.ok && qFlipU > 0.3;
                return (
                  <g key={r.id} opacity={u}>
                    <text x={QFILE.x + 20} y={QFILE.y + 64 + i * 32} fill={flip ? colors.NEGATIVE : colors.MUTED} fontSize={13} fontFamily={MONO} fontWeight={flip ? 700 : 400}>
                      {flip ? '[!]' : r.mark} {r.id}
                    </text>
                    {flip && (
                      <text x={QFILE.x + 150} y={QFILE.y + 64 + i * 32} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO} opacity={qFlipU}>
                        refuted — blocks dependents
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={QFILE.x + 16} y={QFILE.y + QFILE.h - 16} fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={qFlipU}>
                one task in flight at a time
              </text>
            </g>
          )}

          {/* ---- the rework evidence dir ---- */}
          {evU > 0 && (
            <g opacity={Math.min(1, evU * 2)}>
              <rect x={EVDIR.x} y={EVDIR.y} width={EVDIR.w} height={EVDIR.h} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={EVDIR.x + 16} y={EVDIR.y + 28} fill={colors.WARM} fontSize={13} fontWeight={700} fontFamily={MONO}>
                evidence/e3-t14-rework/
              </text>
              {EV_FILES.map((f, i) => {
                const u = clamp01(evU * (EV_FILES.length + 1) - (i + 1));
                if (u <= 0) return null;
                return (
                  <text key={f} x={EVDIR.x + 30} y={EVDIR.y + 58 + i * 26} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={u}>
                    {f}
                  </text>
                );
              })}
              <text x={EVDIR.x + 16} y={EVDIR.y + EVDIR.h - 16} fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={clamp01(evU * 2 - 1)}>
                v1 and v3 runs — the loop, on disk
              </text>
            </g>
          )}

          {/* ---- the compounding rail ---- */}
          {railU > 0 && (
            <g opacity={Math.min(1, railU * 3)}>
              <text x={RAIL.x} y={RAIL.y - 56} fill={colors.TEXT} fontSize={14} fontWeight={700}>
                what a verified lap deposits
              </text>
              <GauntletRail
                x={RAIL.x}
                y={RAIL.y}
                w={RAIL.w}
                gates={RAIL_GATES.map((label, i) => ({ label, state: clamp01(depU * 4 - i) }))}
                reveal={railU}
                deposit={depU > 0 ? { gate: Math.min(3, Math.floor(depU * 4)), label: '+1 spec', u: (depU * 4) % 1 } : undefined}
              />
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={250} width={620} height={130} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              every lap makes the next lap harder to fake
            </text>
            <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              promoted tests · golden traces · fuzz seeds · make verify-*
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
