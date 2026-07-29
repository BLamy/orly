// The Crash That Didn't Matter
//
// Backing files: blog/2025/12/09/announcing-durable-streams.md (opaque
// monotonic offsets, clients persist their own offset and resume with
// "everything after offset X", no per-client server state),
// blog/2026/04/29/introducing-electric-agents.md ("durable execution is what
// you get when you replay the projection to recover"; "nothing in the
// harness needs to survive a crash"), docs/agents/usage/waking-entities.md
// (a wake that was written will eventually be delivered),
// blog/2026/06/16/electric-agents-0-6-from-runtime-to-app.md (runners do the
// compute; coordination and compute are separate — resume on another device).
//
// Centerpiece: the tape survives the tape player. A runner rides the tape,
// streaming text and executing a web search — and shatters mid tool call.
// The tape is untouched. A new runner boots elsewhere, asks for everything
// after its offset, replays the projections back to life, completes the
// half-finished tool call, and the run continues. A phone docks at the same
// offset — the session follows you, not the machine.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The tape — a session already in progress when the chapter opens.
// ---------------------------------------------------------------------------

const TAPE = { y: 390, x0: 140, x1: 1140 } as const;
const SLOT = (i: number): number => 190 + i * 56;

type Fam = 'run' | 'step' | 'text_delta' | 'tool_call' | 'inbox' | 'wake';
const FAM_COLOR: Record<Fam, string> = {
  run: colors.SECONDARY,
  step: colors.SECONDARY,
  text_delta: colors.ACCENT,
  tool_call: colors.WARM,
  inbox: colors.POSITIVE,
  wake: colors.TEAL,
};

// events 0..11 exist at open; 12..13 append while the runner works;
// 14..16 append after the resume.
const EVENTS: Fam[] = [
  'inbox', 'wake', 'run', 'step', 'text_delta', 'text_delta', 'tool_call',
  'text_delta', 'step', 'text_delta', 'tool_call', 'text_delta',
  'text_delta', 'text_delta',
  'tool_call', 'text_delta', 'text_delta',
];
const PRE = 12; // on tape at open
const LIVE = 14; // tip when the crash hits (12..13 stream in beat 1)
const TIP_X = SLOT(LIVE - 1);

// the crash shards — precomputed with a seeded PRNG, driven purely by crashU
const rand = mulberry32(20260716);
const SHARDS = Array.from({ length: 12 }, () => ({
  ang: rand() * Math.PI * 2,
  dist: 60 + rand() * 130,
  spin: (rand() - 0.5) * 240,
  w: 14 + rand() * 30,
  h: 8 + rand() * 16,
}));

const RUNNER = { x: TIP_X - 110, y: 218, w: 240, h: 96 } as const;
const RUNNER2 = { x: 720, y: 150, w: 250, h: 96 } as const;

// the rebuilt-collections panel
const PANEL = { x: 150, y: 470, w: 350, h: 128 } as const;

// camera marks
const CAM_RUNNER: CameraState = { x: 660, y: 320, k: 1.3 };
const CAM_TAPE: CameraState = { x: 640, y: 400, k: 1.34 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tapeU: ChannelRef<number>;
  runnerU: ChannelRef<number>;
  growU: ChannelRef<number>;
  offU: ChannelRef<number>;
  crashU: ChannelRef<number>;
  calmU: ChannelRef<number>;
  bootU: ChannelRef<number>;
  askU: ChannelRef<number>;
  replayU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  resumeU: ChannelRef<number>;
  phoneU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RUNNER, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const runnerU = tl.channel('runnerU', 0);
  const growU = tl.channel('growU', 0);
  const offU = tl.channel('offU', 0);
  const crashU = tl.channel('crashU', 0);
  const calmU = tl.channel('calmU', 0);
  const bootU = tl.channel('bootU', 0);
  const askU = tl.channel('askU', 0);
  const replayU = tl.channel('replayU', 0);
  const panelU = tl.channel('panelU', 0);
  const resumeU = tl.channel('resumeU', 0);
  const phoneU = tl.channel('phoneU', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a run in flight —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'An agent is ten minutes into a job. The model is streaming, a web search is mid-flight — and the process running all of it is about to die.',
  });
  tl.tween(tapeU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(runnerU, 1, { at: 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(growU, 1, { at: 2.8, dur: 3.6, ease: ease.linear });

  // — Beat 2 · the classic funeral —
  tl.caption({
    at: 7.5,
    dur: 6.2,
    text: "In a classic harness, that's a funeral. The context lived in process memory; the transcript lived in a temp file. Kill the process, and the session dies with it.",
  });
  tl.hold(13.7, 0.5);

  // — Beat 3 · the runner is a tape player —
  tl.caption({
    at: 14.2,
    dur: 6,
    text: 'Here, the process was never the agent. The runner is a tape player: it reads the stream, does the thinking, and appends what happens.',
  });

  // — Beat 4 · offsets —
  tl.caption({
    at: 20.6,
    dur: 7,
    text: 'Every event it appends sits at an offset — opaque, monotonic, forever. And each reader tracks its own position. The server keeps no per-client session state at all.',
  });
  tl.tween(cam, CAM_TAPE, { at: 20.8, dur: 1.5, ease: ease.move });
  tl.tween(offU, 1, { at: 21.4, dur: 1.6, ease: ease.draw });
  tl.hold(27.6, 0.6);

  // — Beat 5 · the crash —
  tl.caption({
    at: 28.2,
    dur: 5,
    text: 'Now the crash. The runner dies mid tool call. No goodbye, no cleanup, no flush.',
  });
  tl.tween(cam, CAM_RUNNER, { at: 28.3, dur: 1.2, ease: ease.move });
  tl.tween(crashU, 1, { at: 29.6, dur: 1.6, ease: ease.move });
  tl.hold(33.2, 0.6);

  // — Beat 6 · everything survived —
  tl.caption({
    at: 33.8,
    dur: 6,
    text: "Look at what survived: everything. The stream was never in the process — and the tape doesn't care what happened to the tape player.",
  });
  tl.tween(cam, CAM_TAPE, { at: 34.0, dur: 1.5, ease: ease.move });
  tl.tween(calmU, 1, { at: 34.6, dur: 2.2, ease: ease.draw });
  tl.hold(39.8, 0.5);

  // — Beat 7 · a new runner boots —
  tl.caption({
    at: 40.3,
    dur: 7,
    text: 'A new runner boots. Different machine, different region — it makes no difference. It asks the stream one question: give me everything after the offset I last processed.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.5, dur: 1.5, ease: ease.move });
  tl.tween(bootU, 1, { at: 41.2, dur: 0.9, ease: ease.enter });
  tl.tween(askU, 1, { at: 43.4, dur: 0.8, ease: ease.enter });
  tl.hold(47.3, 0.5);

  // — Beat 8 · replay rebuilds the projections —
  tl.caption({
    at: 47.8,
    dur: 6.8,
    text: 'The events replay, and the projections rebuild: the runs, the messages, the half-finished tool call — status executing — exactly where things stood.',
  });
  tl.tween(askU, 0, { at: 48.0, dur: 0.6, ease: ease.move });
  tl.tween(panelU, 1, { at: 48.2, dur: 0.8, ease: ease.enter });
  tl.tween(replayU, 1, { at: 48.6, dur: 3.8, ease: ease.linear });

  // — Beat 9 · durable execution = replay —
  tl.caption({
    at: 55.2,
    dur: 6,
    text: 'Replaying the projection is the whole recovery protocol. That is what durable execution means here: no checkpoints bolted on the side — just a log, re-read.',
  });
  tl.hold(61.2, 0.5);

  // — Beat 10 · the run continues —
  tl.caption({
    at: 61.7,
    dur: 6.6,
    text: 'The read head reaches the tip, the tool call completes, and new text streams on — as if nothing happened. The wake that was pending is delivered, not lost.',
  });
  tl.tween(resumeU, 1, { at: 62.4, dur: 3.4, ease: ease.linear });
  tl.hold(68.3, 0.5);

  // — Beat 11 · the phone —
  tl.caption({
    at: 68.8,
    dur: 5.8,
    text: 'And because resuming is just reading from an offset, your phone can do it too. The session follows you — not the machine.',
  });
  tl.tween(phoneU, 1, { at: 69.6, dur: 1.2, ease: ease.enter });
  tl.hold(74.6, 0.5);

  // — Beat 12 · the bet —
  tl.caption({
    at: 75.1,
    dur: 6.4,
    text: 'That is the bet the whole platform makes: keep the log outside the harness, and nothing in the harness needs to survive a crash.',
  });
  tl.tween(dimU, 0.13, { at: 75.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 76.6, dur: 0.9, ease: ease.enter });
  tl.hold(81.5, 1.5);

  return {
    tl, cam, tapeU, runnerU, growU, offU, crashU, calmU, bootU, askU,
    replayU, panelU, resumeU, phoneU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const runnerU = s.get(scene.runnerU);
  const growU = s.get(scene.growU);
  const offU = s.get(scene.offU);
  const crashU = s.get(scene.crashU);
  const calmU = s.get(scene.calmU);
  const bootU = s.get(scene.bootU);
  const askU = s.get(scene.askU);
  const replayU = s.get(scene.replayU);
  const panelU = s.get(scene.panelU);
  const resumeU = s.get(scene.resumeU);
  const phoneU = s.get(scene.phoneU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // how many events are visible: PRE at open, +2 during growU, +3 during resume
  const liveCount = PRE + Math.floor(growU * (LIVE - PRE) + 1e-6);
  const resumeCount = Math.floor(resumeU * 3 + 1e-6);
  const shown = Math.min(EVENTS.length, liveCount + (resumeU > 0 ? resumeCount : 0));

  // the replay head sweeps the whole tape back to the tip
  const replayX = TAPE.x0 + (TIP_X + 20 - TAPE.x0) * replayU;

  // tool-call status: executing until the resume completes it
  const toolDone = resumeU > 0.25;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the tape ---- */}
        <g opacity={dimU}>
          <line x1={TAPE.x0} y1={TAPE.y} x2={TAPE.x0 + (TAPE.x1 - TAPE.x0) * tapeU} y2={TAPE.y} stroke={colors.GRID} strokeWidth={2} />
          <text x={TAPE.x0} y={TAPE.y - 42} fill={colors.MUTED} fontSize={11.5} opacity={tapeU}>
            the entity&apos;s durable stream
          </text>

          {EVENTS.slice(0, shown).map((fam, i) => {
            const isNew = i >= LIVE && resumeU > 0;
            return (
              <rect
                key={i}
                x={SLOT(i) - 8}
                y={TAPE.y - 12}
                width={16}
                height={24}
                rx={3}
                fill={FAM_COLOR[fam]}
                opacity={isNew ? 0.95 : 0.55 + 0.45 * Math.min(1, calmU + 0.6)}
              />
            );
          })}

          {/* offset labels — opaque + monotonic */}
          {offU > 0 && (
            <g opacity={offU}>
              {[0, 3, 6, 9, 12].map((i) => (
                <text key={i} x={SLOT(i)} y={TAPE.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
                  {String(i + 18).padStart(4, '0')}
                </text>
              ))}
              <text x={SLOT(13) + 40} y={TAPE.y + 34} fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
                → offsets only grow
              </text>
              {/* this runner's persisted read position */}
              <path d={`M ${SLOT(11) - 7} ${TAPE.y + 48} L ${SLOT(11) + 7} ${TAPE.y + 48} L ${SLOT(11)} ${TAPE.y + 38} Z`} fill={colors.TEAL} />
              <text x={SLOT(11)} y={TAPE.y + 62} textAnchor="middle" fill={colors.TEAL} fontSize={9.5} fontFamily={mono}>
                reader offset — kept by the reader
              </text>
            </g>
          )}

          {/* the survival glow sweep */}
          {calmU > 0 && calmU < 1 && (
            <rect x={TAPE.x0} y={TAPE.y - 18} width={(TIP_X - TAPE.x0 + 30) * calmU} height={36} rx={6} fill={colors.POSITIVE} opacity={0.14} />
          )}
          {calmU > 0.9 && (
            <text x={(TAPE.x0 + TIP_X) / 2} y={TAPE.y - 52} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={(calmU - 0.9) * 10}>
              intact — every event still here
            </text>
          )}
        </g>

        {/* ---- runner 1 (the doomed tape player) ---- */}
        {runnerU > 0 && crashU < 1 && (
          <g opacity={runnerU * (1 - crashU) * dimU}>
            <rect x={RUNNER.x} y={RUNNER.y} width={RUNNER.w} height={RUNNER.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={RUNNER.x + 14} y={RUNNER.y + 24} fill={colors.TEXT} fontSize={12.5}>
              runner — your laptop
            </text>
            <rect x={RUNNER.x + 14} y={RUNNER.y + 38} width={168} height={22} rx={11} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.1} />
            <text x={RUNNER.x + 98} y={RUNNER.y + 53} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={mono}>
              web_search · executing
            </text>
            <text x={RUNNER.x + 14} y={RUNNER.y + 82} fill={colors.MUTED} fontSize={10.5}>
              reads · thinks · appends
            </text>
            {/* read head riding the tip */}
            <line x1={TIP_X - 20 + 40 * growU} y1={RUNNER.y + RUNNER.h} x2={TIP_X - 20 + 40 * growU} y2={TAPE.y - 16} stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray="3 4" />
            <path d={`M ${TIP_X - 27 + 40 * growU} ${TAPE.y - 22} L ${TIP_X - 13 + 40 * growU} ${TAPE.y - 22} L ${TIP_X - 20 + 40 * growU} ${TAPE.y - 10} Z`} fill={colors.ACCENT} />
          </g>
        )}

        {/* ---- the shatter ---- */}
        {crashU > 0 && crashU < 1 && (
          <g opacity={dimU}>
            {SHARDS.map((sh, i) => {
              const cx = RUNNER.x + RUNNER.w / 2 + Math.cos(sh.ang) * sh.dist * crashU;
              const cy = RUNNER.y + RUNNER.h / 2 + Math.sin(sh.ang) * sh.dist * crashU + 40 * crashU * crashU;
              return (
                <rect
                  key={i}
                  x={cx - sh.w / 2}
                  y={cy - sh.h / 2}
                  width={sh.w}
                  height={sh.h}
                  rx={2}
                  fill={colors.PANEL}
                  stroke={colors.NEGATIVE}
                  strokeWidth={0.8}
                  opacity={(1 - crashU) * 0.9}
                  transform={`rotate(${sh.spin * crashU} ${cx} ${cy})`}
                />
              );
            })}
            {crashU > 0.25 && crashU < 0.9 && (
              <text x={RUNNER.x + RUNNER.w / 2} y={RUNNER.y + 40} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700} opacity={(0.9 - crashU) * 2}>
                SIGKILL
              </text>
            )}
          </g>
        )}

        {/* ---- runner 2 (boots elsewhere) ---- */}
        {bootU > 0 && (
          <g opacity={bootU * dimU}>
            <rect x={RUNNER2.x} y={RUNNER2.y} width={RUNNER2.w} height={RUNNER2.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            {/* little cloud glyph */}
            <path d={`M ${RUNNER2.x + 30} ${RUNNER2.y + 26} a 8 8 0 0 1 14 -6 a 9 9 0 0 1 16 4 a 7 7 0 0 1 -3 13 l -22 0 a 7 7 0 0 1 -5 -11`} fill="none" stroke={colors.MUTED} strokeWidth={1.4} />
            <text x={RUNNER2.x + 70} y={RUNNER2.y + 32} fill={colors.TEXT} fontSize={12.5}>
              new runner — elsewhere
            </text>
            <rect x={RUNNER2.x + 14} y={RUNNER2.y + 46} width={168} height={22} rx={11} fill={colors.BG} stroke={toolDone ? colors.POSITIVE : colors.WARM} strokeWidth={1.1} opacity={panelU} />
            <text x={RUNNER2.x + 98} y={RUNNER2.y + 61} textAnchor="middle" fill={toolDone ? colors.POSITIVE : colors.WARM} fontSize={10.5} fontFamily={mono} opacity={panelU}>
              {toolDone ? 'web_search · completed' : 'web_search · executing'}
            </text>
            {/* its read head: sweeps during replay, rides the tip during resume */}
            {(replayU > 0 || resumeU > 0) && (() => {
              const hx = resumeU > 0 ? TIP_X + 20 + resumeU * (SLOT(16) - TIP_X - 20) + 16 : replayX;
              return (
                <g>
                  <line x1={hx} y1={RUNNER2.y + RUNNER2.h} x2={hx} y2={TAPE.y - 16} stroke={colors.POSITIVE} strokeWidth={1.5} strokeDasharray="3 4" />
                  <path d={`M ${hx - 7} ${TAPE.y - 22} L ${hx + 7} ${TAPE.y - 22} L ${hx} ${TAPE.y - 10} Z`} fill={colors.POSITIVE} />
                  {replayU > 0.05 && replayU < 0.98 && (
                    <text x={hx} y={TAPE.y - 32} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5}>
                      replaying
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* the one question */}
        {askU > 0 && (
          <g opacity={askU * dimU}>
            <rect x={RUNNER2.x - 260} y={RUNNER2.y + 20} width={244} height={30} rx={15} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={RUNNER2.x - 138} y={RUNNER2.y + 40} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={mono}>
              everything after offset 0017
            </text>
          </g>
        )}

        {/* ---- rebuilt projections panel ---- */}
        {panelU > 0 && (
          <g opacity={panelU * dimU}>
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={PANEL.x + 14} y={PANEL.y + 22} fill={colors.MUTED} fontSize={11}>
              projections — rebuilt from replay
            </text>
            {[
              { name: 'runs', v: 'run 2 · started', th: 0.35 },
              { name: 'texts', v: '5 messages', th: 0.6 },
              { name: 'toolCalls', v: toolDone ? 'web_search · completed' : 'web_search · executing', th: 0.85 },
            ].map((r, i) => {
              const u = clamp01((replayU - r.th) / 0.15);
              if (u <= 0) return null;
              return (
                <g key={r.name} opacity={u}>
                  <rect x={PANEL.x + 12} y={PANEL.y + 34 + i * 28} width={PANEL.w - 24} height={22} rx={5} fill={colors.BG} stroke={colors.GRID} />
                  <text x={PANEL.x + 22} y={PANEL.y + 49 + i * 28} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
                    {r.name}
                  </text>
                  <text x={PANEL.x + PANEL.w - 22} y={PANEL.y + 49 + i * 28} textAnchor="end" fill={i === 2 ? (toolDone ? colors.POSITIVE : colors.WARM) : colors.TEXT} fontSize={10.5} fontFamily={mono}>
                    {r.v}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the phone docks ---- */}
        {phoneU > 0 && (
          <g opacity={phoneU * dimU}>
            <rect x={1010} y={468} width={40} height={70} rx={7} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
            <circle cx={1030} cy={526} r={3} fill="none" stroke={colors.GRID} />
            <text x={1030} y={556} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              your phone
            </text>
            <line x1={1030} y1={468} x2={SLOT(16) + 20} y2={TAPE.y + 16} stroke={colors.GRID} strokeWidth={1.2} strokeDasharray="3 4" />
            <path d={`M ${SLOT(16) + 13} ${TAPE.y + 20} L ${SLOT(16) + 27} ${TAPE.y + 20} L ${SLOT(16) + 20} ${TAPE.y + 8} Z`} fill={colors.TEAL} />
            <text x={SLOT(16) + 20} y={TAPE.y + 38} textAnchor="middle" fill={colors.TEAL} fontSize={9.5} fontFamily={mono}>
              same offset
            </text>
          </g>
        )}
      </Camera>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={300} y={252} width={680} height={150} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={640} y={312} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={700}>
            the log sits outside the harness
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={15.5}>
            so nothing in the harness needs to survive a crash
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
