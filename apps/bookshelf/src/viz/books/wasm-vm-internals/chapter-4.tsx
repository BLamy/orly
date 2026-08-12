// Rewind: The Machine Is a Stream
//
// Backing source: ~/Dev/wasm-vm — `ROADMAP.md` (Layer G is cross-cutting: "a system that is
// only made deterministic at the end was never deterministic"; determinism must survive the
// JIT; the Level-8 Chromium capstone is cancelled and the Layer-G ideas return as their own
// epic), `crates/core/tests/determinism.rs` (the run fingerprint: rolling trace hash over
// every guest-visible retire effect + RAM SHA-256 + final-state hash, asserted native ==
// wasm32 against a frozen golden), `docs/trace-format.md` (a faulting instruction does not
// retire and emits nothing), `crates/core/src/resume.rs` (whole-machine keyframes; the CLOCK
// section exists so timer placement is instruction-exact on resume), `crates/storage`
// (content-addressed BlobStore, verified reads), E4-T17 (page-granular dirty bitmaps, built
// for self-modifying-code detection), and `web/loader.js` (after a restore, wall clock and
// entropy are LIVE browser sources by design — correct for resume, fatal for replay).
//
// This chapter is the honest one: it separates what the repo demonstrably has from what a
// time-traveling Linux still needs, and does the arithmetic that rules out the naive design.
//
// Second movement — the durable stream. Keyframes + log stop being a debug
// artifact and become the machine's identity: an append-only, replicated
// stream (cf. the electric-agents book: the agent IS the stream — here the
// stream also holds the whole OS). Suspend anywhere = stop appending; resume
// = keyframe + tail. Agent actions are just more recorded inputs in the same
// log. Subscribed tailnet devices hold live replicas (the user's filesystem
// travels as the same content-addressed chunks), and rr/Replay-style
// time-travel debugging falls out: run to an instruction, step backwards —
// for the kernel, the filesystem, and the agent at once.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Stage A — the arithmetic that kills the naive design.
// ---------------------------------------------------------------------------

const SNAP_MB = 10.5; // the shipped snapshot, in MB
const IPS = 10_000_000; // a deliberately modest ten million instructions/second

// ---------------------------------------------------------------------------
// Stage B — the timeline: sparse keyframes plus a thin event log.
// ---------------------------------------------------------------------------

const TL = { x: 190, y: 396, w: 900 } as const;
const KEYS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
// Recorded inputs, at their instruction counts (u along the timeline) — the only things
// that have to be written down at all.
const EVENTS: { u: number; kind: number }[] = [
  { u: 0.02, kind: 0 }, { u: 0.05, kind: 3 }, { u: 0.08, kind: 1 }, { u: 0.11, kind: 3 },
  { u: 0.17, kind: 1 }, { u: 0.19, kind: 0 }, { u: 0.23, kind: 3 }, { u: 0.29, kind: 2 },
  { u: 0.31, kind: 1 }, { u: 0.36, kind: 3 }, { u: 0.42, kind: 0 }, { u: 0.44, kind: 1 },
  { u: 0.47, kind: 3 }, { u: 0.53, kind: 4 }, { u: 0.58, kind: 1 }, { u: 0.61, kind: 3 },
  { u: 0.66, kind: 0 }, { u: 0.69, kind: 2 }, { u: 0.72, kind: 3 }, { u: 0.78, kind: 1 },
  { u: 0.81, kind: 0 }, { u: 0.84, kind: 3 }, { u: 0.88, kind: 4 }, { u: 0.93, kind: 1 },
  { u: 0.96, kind: 3 },
];
const KIND_COLOR = [colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.WARM, colors.NEGATIVE];
const KIND_NAME = ['console input', 'disk completion', 'network receive', 'timer interrupt', 'entropy'];

const tlX = (u: number): number => TL.x + u * TL.w;
const SEEK_TARGET = 0.34;
const nearestKey = (u: number): number => KEYS.filter((k) => k <= u).pop() ?? 0;

// ---------------------------------------------------------------------------
// Stage C — the readiness ledger. Every line is a claim about the real repo.
// ---------------------------------------------------------------------------

const LEDGER: { have: boolean; text: string }[] = [
  { have: true, text: 'deterministic execution, gated in continuous integration' },
  { have: true, text: 'identical fingerprints native and in the browser' },
  { have: true, text: 'whole-machine keyframes at an instruction boundary' },
  { have: true, text: 'page-granular dirty bitmaps' },
  { have: true, text: 'a content-addressed store that dedupes pages' },
  { have: true, text: 'one hart — no multi-core replay problem yet' },
  { have: false, text: 'an input log and a recorder' },
  { have: false, text: 'a replay mode that refuses live clocks' },
  { have: false, text: 'seek, reverse-step, and a scrub surface' },
];
const LED = { x: 250, y: 150 } as const;

const CAM_MATH: CameraState = { x: 620, y: 230, k: 1.12 };
const CAM_FUNC: CameraState = { x: 620, y: 250, k: 1.16 };
const CAM_TIMELINE: CameraState = { x: 640, y: 390, k: 1.08 };
const CAM_SEEK: CameraState = { x: 470, y: 396, k: 1.5 };
const CAM_LEDGER: CameraState = { x: 620, y: 330, k: 1.02 };
const CAM_WIDE: CameraState = { x: 620, y: 340, k: 0.92 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  naiveU: ChannelRef<number>;
  blowU: ChannelRef<number>;
  funcU: ChannelRef<number>;
  inputsU: ChannelRef<number>;
  fingerU: ChannelRef<number>;
  tlU: ChannelRef<number>;
  keyU: ChannelRef<number>;
  logU: ChannelRef<number>;
  costU: ChannelRef<number>;
  headU: ChannelRef<number>;
  seekU: ChannelRef<number>;
  fwdU: ChannelRef<number>;
  revU: ChannelRef<number>;
  deltaU: ChannelRef<number>;
  modeU: ChannelRef<number>;
  ledgerU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  agentU: ChannelRef<number>;
  replU: ChannelRef<number>;
  rrU: ChannelRef<number>;
  dimAll: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_MATH, cameraInterp);
  const naiveU = tl.channel('naiveU', 0);
  const blowU = tl.channel('blowU', 0);
  const funcU = tl.channel('funcU', 0);
  const inputsU = tl.channel('inputsU', 0);
  const fingerU = tl.channel('fingerU', 0);
  const tlU = tl.channel('tlU', 0);
  const keyU = tl.channel('keyU', 0);
  const logU = tl.channel('logU', 0);
  const costU = tl.channel('costU', 0);
  const headU = tl.channel('headU', 0);
  const seekU = tl.channel('seekU', 0);
  const fwdU = tl.channel('fwdU', 0);
  const revU = tl.channel('revU', 0);
  const deltaU = tl.channel('deltaU', 0);
  const modeU = tl.channel('modeU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const streamU = tl.channel('streamU', 0);
  const agentU = tl.channel('agentU', 0);
  const replU = tl.channel('replU', 0);
  const rrU = tl.channel('rrU', 0);
  const dimAll = tl.channel('dimAll', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the wrong version of the idea —
  tl.caption({
    at: 0.5,
    dur: 6.95,
    text: 'The original goal for this project was a Linux you can rewind. So start with the obvious way to build that, because the arithmetic rules it out in one line.',
  });
  tl.tween(naiveU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.hold(6.9, 0.6);

  // — Beat 2 · the arithmetic —
  tl.caption({
    at: 7.5,
    dur: 7.15,
    text: 'Freeze the machine after every instruction. Each freeze is about ten and a half megabytes, and even a slow guest retires ten million instructions a second. That is a hundred terabytes per second of history.',
  });
  tl.tween(blowU, 1, { at: 8.0, dur: 3.0, ease: ease.linear });
  tl.hold(14.1, 0.6);

  // — Beat 3 · what actually has to be stored —
  tl.caption({
    at: 14.7,
    dur: 6.95,
    text: 'It is also enormously wasteful, because almost nothing in that state was new. A machine is a function: give it the same state and the same inputs and it produces the same next state, every time.',
  });
  tl.tween(cam, CAM_FUNC, { at: 14.9, dur: 1.6, ease: ease.move });
  tl.tween(naiveU, 0, { at: 15.1, dur: 0.8, ease: ease.move });
  tl.tween(funcU, 1, { at: 15.8, dur: 1.4, ease: ease.enter });
  tl.hold(21.1, 0.6);

  // — Beat 4 · so only inputs need recording —
  tl.caption({
    at: 21.7,
    dur: 7.35,
    text: 'So you do not record the machine. You record the arrows coming in from outside it: what was typed, when a disk read completed, what arrived from the network, the random bytes, and exactly when each interrupt landed.',
  });
  tl.tween(inputsU, 1, { at: 22.2, dur: 2.4, ease: ease.pop });
  tl.hold(28.5, 0.6);

  // — Beat 5 · determinism is already proven here —
  tl.caption({
    at: 29.1,
    dur: 7.15,
    text: 'That only works if the machine really is a function, which is the part this project already did. Every run reduces to one fingerprint over its whole execution and its memory, and the build gate proves the same program produces the same fingerprint natively and in a browser.',
  });
  tl.tween(fingerU, 1, { at: 29.6, dur: 1.8, ease: ease.enter });
  tl.hold(35.7, 0.6);

  // — Beat 6 · the timebase —
  tl.caption({
    at: 36.3,
    dur: 6.75,
    text: 'One detail decides whether any of this is addressable: time is measured in retired instructions, never in seconds. Instruction four billion is a place. Half past two is not.',
  });
  tl.tween(cam, CAM_TIMELINE, { at: 36.5, dur: 1.6, ease: ease.move });
  // the function stage steps aside — the timeline lives where it was
  tl.tween(funcU, 0, { at: 36.5, dur: 1.0, ease: ease.move });
  tl.tween(tlU, 1, { at: 37.2, dur: 1.4, ease: ease.draw });
  tl.hold(42.5, 0.6);

  // — Beat 7 · keyframes plus a log —
  tl.caption({
    at: 43.1,
    dur: 7.15,
    text: 'Now the real design fits on one line. Keyframes every so often, a thin log of inputs in between — megabytes a minute instead of terabytes a second, because the expensive thing happens rarely and the cheap thing happens often.',
  });
  tl.tween(keyU, 1, { at: 43.6, dur: 1.6, ease: ease.pop });
  tl.tween(logU, 1, { at: 45.4, dur: 2.0, ease: ease.linear });
  tl.tween(costU, 1, { at: 47.6, dur: 1.0, ease: ease.enter });
  tl.hold(49.7, 0.6);

  // — Beat 8 · seek —
  tl.caption({
    at: 50.3,
    dur: 7.15,
    text: 'And every operation you want is the same operation. To reach any moment, restore the nearest keyframe before it and replay the log forward. Stepping backwards one instruction is just asking for the moment before this one.',
  });
  tl.tween(cam, CAM_SEEK, { at: 50.5, dur: 1.6, ease: ease.move });
  tl.tween(headU, 1, { at: 51.2, dur: 0.6, ease: ease.enter });
  tl.tween(seekU, 1, { at: 52.0, dur: 1.0, ease: ease.move });
  tl.tween(fwdU, 1, { at: 53.4, dur: 1.8, ease: ease.linear });
  tl.tween(revU, 1, { at: 55.6, dur: 0.8, ease: ease.move });
  tl.hold(56.9, 0.6);

  // — Beat 9 · the keyframes get cheap —
  tl.caption({
    at: 57.5,
    dur: 7.15,
    text: 'The keyframes can be far cheaper than they look, using two things already built for other reasons: the dirty page map the compiler uses to spot self-modifying code, and the content-addressed store that made the disk chunks dedupe. Store only changed pages, and share the rest.',
  });
  tl.tween(cam, CAM_TIMELINE, { at: 57.7, dur: 1.6, ease: ease.move });
  tl.tween(deltaU, 1, { at: 58.6, dur: 2.2, ease: ease.move });
  tl.hold(64.1, 0.6);

  // — Beat 10 · the one thing pointing the wrong way —
  tl.caption({
    at: 64.7,
    dur: 7.35,
    text: 'There is one deliberate decision in the way. When the machine restores today it re-reads the wall clock and fresh randomness from the browser on purpose, so a resumed session knows what time it is. That is exactly wrong for replay, which must take those from the log — so it becomes a mode, not a default.',
  });
  tl.tween(modeU, 1, { at: 65.4, dur: 1.6, ease: ease.pop });
  tl.hold(71.5, 0.6);

  // — Beat 11 · the honest ledger —
  tl.caption({
    at: 72.1,
    dur: 7.55,
    text: 'Which leaves an honest ledger. Deterministic execution, proven in the build. Keyframes at an instruction boundary. Dirty page maps, a deduping store, and a single core, which is the version of this problem that is actually tractable. Missing: the recorder, the replay mode, and a way to scrub.',
  });
  tl.tween(cam, CAM_LEDGER, { at: 72.3, dur: 1.8, ease: ease.move });
  tl.tween(tlU, 0.1, { at: 72.3, dur: 1.2, ease: ease.move });
  tl.tween(modeU, 0.1, { at: 72.3, dur: 1.2, ease: ease.move });
  tl.tween(ledgerU, 1, { at: 73.2, dur: 3.0, ease: ease.move });
  tl.hold(79.1, 0.6);

  // ================== movement 2 · the durable stream ==================

  // — Beat 12 · the recording becomes the machine —
  tl.caption({
    at: 79.7,
    dur: 7.55,
    text: 'Now give the keyframes and the log somewhere durable to live: an append-only stream that outlives the tab, where every keyframe and every input lands in order. The recording stops being a debugging artifact and becomes the machine itself. Suspend at any instruction by simply not appending; resume anywhere by restoring the last keyframe and replaying the tail.',
  });
  tl.tween(cam, CAM_TIMELINE, { at: 79.9, dur: 1.6, ease: ease.move });
  tl.tween(ledgerU, 0, { at: 79.9, dur: 1.0, ease: ease.move });
  tl.tween(modeU, 0, { at: 79.9, dur: 1.0, ease: ease.move });
  tl.tween(tlU, 1, { at: 80.1, dur: 1.0, ease: ease.move });
  tl.tween(streamU, 1, { at: 80.6, dur: 1.8, ease: ease.draw });
  tl.hold(87.7, 0.6);

  // — Beat 13 · the agent is in the stream too —
  tl.caption({
    at: 88.3,
    dur: 7.55,
    text: 'A sibling book on this shelf argues that an agent is its stream — the whole run, one append-only log. Here that idea grows up. An agent driving this machine is just another input source: every command it typed and every request it made lands beside the interrupts, so one recording holds the agent and the entire operating system it acted on.',
  });
  tl.tween(agentU, 1, { at: 88.8, dur: 1.8, ease: ease.enter });
  tl.hold(95.9, 0.6);

  // — Beat 14 · live replicas —
  tl.caption({
    at: 96.5,
    dur: 7.55,
    text: 'And because the stream is ordinary data, following it is watching the machine. Every device on your tailnet that subscribes holds a live replica — your filesystem, replicated across everyone using the machine, carried by the same content-addressed chunks the disk already speaks. The stream is the truth. Every copy is a cache.',
  });
  tl.tween(replU, 1, { at: 97.0, dur: 2.0, ease: ease.move });
  tl.hold(104.1, 0.6);

  // — Beat 15 · time-travel debugging, whole-machine —
  tl.caption({
    at: 104.7,
    dur: 7.55,
    text: 'Put those together and you get what record-and-replay debuggers promise, but for the whole computer. Run to any moment, step backwards, watch a value change — and the recording does not stop at one process. The kernel, the filesystem, the agent\'s every action: all of it addressable by instruction count, all of it replayable.',
  });
  tl.tween(rrU, 1, { at: 105.2, dur: 1.6, ease: ease.pop });
  tl.hold(112.3, 0.6);

  // — Beat 16 · close —
  tl.caption({
    at: 112.9,
    dur: 7.0,
    text: 'So the ledger stays honest — the recorder is still unwritten — but the shape is now exact. One durable stream holding a machine, its user, and its agent. Suspendable anywhere. Replayable everywhere.',
  });
  tl.tween(cam, CAM_WIDE, { at: 113.1, dur: 1.6, ease: ease.move });
  tl.tween(dimAll, 0.12, { at: 114.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 115.3, dur: 0.9, ease: ease.enter });
  tl.hold(119.9, 1.6);

  return {
    tl, cam, naiveU, blowU, funcU, inputsU, fingerU, tlU, keyU, logU, costU, headU, seekU,
    fwdU, revU, deltaU, modeU, ledgerU, streamU, agentU, replU, rrU, dimAll, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const naiveU = s.get(scene.naiveU);
  const blowU = s.get(scene.blowU);
  const funcU = s.get(scene.funcU);
  const inputsU = s.get(scene.inputsU);
  const fingerU = s.get(scene.fingerU);
  const tlU = s.get(scene.tlU);
  const keyU = s.get(scene.keyU);
  const logU = s.get(scene.logU);
  const costU = s.get(scene.costU);
  const headU = s.get(scene.headU);
  const seekU = s.get(scene.seekU);
  const fwdU = s.get(scene.fwdU);
  const revU = s.get(scene.revU);
  const deltaU = s.get(scene.deltaU);
  const modeU = s.get(scene.modeU);
  const ledgerU = s.get(scene.ledgerU);
  const streamU = s.get(scene.streamU);
  const agentU = s.get(scene.agentU);
  const replU = s.get(scene.replU);
  const rrU = s.get(scene.rrU);
  const dimAll = s.get(scene.dimAll);
  const closeU = s.get(scene.closeU);

  // the naive cost, counted up as the bar runs away
  const instrs = blowU * IPS;
  const bytesPerSec = instrs * SNAP_MB * 1_048_576;
  const tb = bytesPerSec / 1e12;

  // the playhead: starts at the right, seeks back to the target, replays forward
  const startU = 0.86;
  const key = nearestKey(SEEK_TARGET);
  const headPos = lerp(startU, key, clamp01(seekU)) + (SEEK_TARGET - key) * clamp01(fwdU);
  const finalPos = headPos - clamp01(revU) * 0.035;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ================= the naive arithmetic ================= */}
          {naiveU > 0 && (
            <g opacity={naiveU}>
              <text x={190} y={150} fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                one keyframe per instruction
              </text>
              <rect x={190} y={168} width={900} height={38} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={192} y={170} width={896 * clamp01(blowU)} height={34} rx={5} fill={colors.NEGATIVE} opacity={0.8} />
              <text x={190} y={238} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
                {(instrs / 1e6).toFixed(1)} million instructions × 10.5 MB
              </text>
              <text x={190} y={274} fill={colors.NEGATIVE} fontSize={26} fontWeight={700} fontFamily="monospace">
                {tb.toFixed(0)} TB / second
              </text>
              {blowU > 0.9 && (
                <text x={190} y={306} fill={colors.MUTED} fontSize={14}>
                  — and almost every byte of it is unchanged from the byte before
                </text>
              )}
            </g>
          )}

          {/* ================= the machine as a function ================= */}
          {funcU > 0 && (
            <g opacity={funcU}>
              <rect x={470} y={186} width={300} height={110} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={620} y={228} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={700}>
                the machine
              </text>
              <text x={620} y={258} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                state and inputs in, next state out
              </text>
              <line x1={330} y1={241} x2={462} y2={241} stroke={colors.ACCENT} strokeWidth={2} />
              <polygon points="470,241 456,234 456,248" fill={colors.ACCENT} />
              <text x={330} y={230} fill={colors.ACCENT} fontSize={13.5}>
                state at instruction n
              </text>
              <line x1={770} y1={241} x2={900} y2={241} stroke={colors.ACCENT} strokeWidth={2} />
              <polygon points="908,241 894,234 894,248" fill={colors.ACCENT} />
              <text x={790} y={230} fill={colors.ACCENT} fontSize={13.5}>
                state at n plus one
              </text>

              {/* the only arrows that are not already inside the machine */}
              {inputsU > 0 &&
                KIND_NAME.map((n, i) => {
                  const u = clamp01(inputsU * 5 - i * 0.6);
                  if (u <= 0) return null;
                  const x = 300 + i * 172;
                  return (
                    <g key={n} opacity={u}>
                      <rect x={x} y={352} width={158} height={38} rx={7} fill={colors.BG} stroke={KIND_COLOR[i]} strokeWidth={1.6} />
                      <text x={x + 79} y={376} textAnchor="middle" fill={KIND_COLOR[i]} fontSize={12.5}>
                        {n}
                      </text>
                      <line x1={x + 79} y1={352} x2={620} y2={302} stroke={KIND_COLOR[i]} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55} />
                    </g>
                  );
                })}
              {inputsU > 0.8 && (
                <text x={620} y={418} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={700} opacity={clamp01(inputsU * 4 - 3.2)}>
                  record these, and the rest is recomputable
                </text>
              )}

              {/* the fingerprint gate */}
              {fingerU > 0 && (
                <g opacity={fingerU}>
                  <rect x={430} y={452} width={380} height={74} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
                  <text x={620} y={478} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
                    one fingerprint per run
                  </text>
                  <text x={620} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                    execution hash + memory digest + final state
                  </text>
                  <text x={620} y={518} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                    native and browser must agree — enforced in the build
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ================= the timeline ================= */}
          {tlU > 0 && (
            <g opacity={tlU}>
              <line x1={TL.x} y1={TL.y} x2={TL.x + TL.w * tlU} y2={TL.y} stroke={colors.GRID} strokeWidth={3} />
              <text x={TL.x} y={TL.y + 46} fill={colors.MUTED} fontSize={13}>
                instruction 0
              </text>
              <text x={TL.x + TL.w} y={TL.y + 46} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                instruction 4,102,338,915
              </text>

              {/* the log: one tick per recorded input */}
              {logU > 0 &&
                EVENTS.map((e, i) => {
                  const u = clamp01(logU * 1.4 - e.u);
                  if (u <= 0) return null;
                  return (
                    <line
                      key={i}
                      x1={tlX(e.u)}
                      y1={TL.y - 12}
                      x2={tlX(e.u)}
                      y2={TL.y + 12}
                      stroke={KIND_COLOR[e.kind]}
                      strokeWidth={2}
                      opacity={0.9 * u}
                    />
                  );
                })}

              {/* the keyframes */}
              {keyU > 0 &&
                KEYS.map((k, i) => {
                  const u = clamp01(keyU * 3 - i * 0.25);
                  if (u <= 0) return null;
                  const x = tlX(k);
                  const r = 13;
                  return (
                    <g key={k} opacity={u}>
                      <polygon
                        points={`${x},${TL.y - r} ${x + r},${TL.y} ${x},${TL.y + r} ${x - r},${TL.y}`}
                        fill={deltaU > 0.5 && i % 4 !== 0 ? colors.BG : colors.ACCENT}
                        stroke={colors.ACCENT}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              {keyU > 0.6 && (
                <text x={TL.x} y={TL.y - 40} fill={colors.ACCENT} fontSize={13.5} opacity={clamp01(keyU * 2 - 1.2)}>
                  keyframes — the whole machine
                </text>
              )}
              {logU > 0.5 && (
                <text x={TL.x + TL.w} y={TL.y - 40} textAnchor="end" fill={colors.POSITIVE} fontSize={13.5} opacity={clamp01(logU * 2 - 1)}>
                  the log — only what came in from outside
                </text>
              )}

              {/* the cost comparison */}
              {costU > 0 && (
                <g opacity={costU}>
                  <text x={TL.x} y={TL.y + 92} fill={colors.ACCENT} fontSize={15} fontWeight={700}>
                    keyframes: megabytes per minute
                  </text>
                  <text x={TL.x + TL.w} y={TL.y + 92} textAnchor="end" fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                    log: kilobytes per second
                  </text>
                </g>
              )}

              {/* delta keyframes: hollow ones store only changed pages */}
              {deltaU > 0 && (
                <g opacity={deltaU}>
                  <text x={TL.x} y={TL.y + 122} fill={colors.MUTED} fontSize={13}>
                    hollow keyframes store only the pages that changed — the rest is shared
                  </text>
                </g>
              )}

              {/* the seek: restore the nearest keyframe, then replay forward */}
              {headU > 0 && (
                <g opacity={headU}>
                  {seekU > 0.05 && (
                    <g opacity={clamp01(seekU * 2)}>
                      <line x1={tlX(key)} y1={TL.y - 40} x2={tlX(SEEK_TARGET)} y2={TL.y - 40} stroke={colors.WARM} strokeWidth={2.4} />
                      <text x={tlX((key + SEEK_TARGET) / 2)} y={TL.y - 50} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700}>
                        replay forward
                      </text>
                    </g>
                  )}
                  <line x1={tlX(finalPos)} y1={TL.y - 30} x2={tlX(finalPos)} y2={TL.y + 30} stroke={colors.TEXT} strokeWidth={2.5} />
                  <polygon
                    points={`${tlX(finalPos)},${TL.y - 34} ${tlX(finalPos) - 7},${TL.y - 46} ${tlX(finalPos) + 7},${TL.y - 46}`}
                    fill={colors.TEXT}
                  />
                  {revU > 0.4 && (
                    <text x={tlX(finalPos)} y={TL.y + 52} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={700} opacity={revU}>
                      one instruction back
                    </text>
                  )}
                </g>
              )}
            </g>
          )}

          {/* ================= resume vs replay ================= */}
          {modeU > 0 && (
            <g opacity={modeU}>
              {[
                { title: 'resume a session', line: 'clock and randomness read live', color: colors.POSITIVE },
                { title: 'replay a recording', line: 'clock and randomness from the log', color: colors.WARM },
              ].map((m, i) => {
                const u = clamp01(modeU * 2 - i * 0.4);
                if (u <= 0) return null;
                return (
                  <g key={m.title} opacity={u}>
                    <rect x={330 + i * 320} y={520} width={290} height={72} rx={10} fill={colors.PANEL} stroke={m.color} strokeWidth={1.7} />
                    <text x={475 + i * 320} y={548} textAnchor="middle" fill={m.color} fontSize={15} fontWeight={700}>
                      {m.title}
                    </text>
                    <text x={475 + i * 320} y={572} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                      {m.line}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= the ledger ================= */}
          {ledgerU > 0 && (
            <g opacity={ledgerU}>
              <rect x={LED.x - 30} y={LED.y - 46} width={760} height={430} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={LED.x} y={LED.y - 16} fill={colors.TEXT} fontSize={16} fontWeight={700}>
                what this machine already has, and what it does not
              </text>
              {LEDGER.map((row, i) => {
                const u = clamp01(ledgerU * 9 - i * 0.8);
                if (u <= 0) return null;
                const y = LED.y + 26 + i * 42;
                const c = row.have ? colors.POSITIVE : colors.WARM;
                return (
                  <g key={row.text} opacity={u}>
                    <circle cx={LED.x + 10} cy={y - 5} r={9} fill="none" stroke={c} strokeWidth={2.2} />
                    {row.have ? (
                      <path d={`M ${LED.x + 5} ${y - 5} l 4 5 l 8 -10`} fill="none" stroke={c} strokeWidth={2.4} />
                    ) : (
                      <line x1={LED.x + 10} y1={y - 10} x2={LED.x + 10} y2={y} stroke={c} strokeWidth={2.4} />
                    )}
                    <text x={LED.x + 34} y={y} fill={row.have ? colors.TEXT : colors.WARM} fontSize={15}>
                      {row.text}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* ================= the durable stream ================= */}
        <g opacity={dimAll}>
          {streamU > 0 && (
            <g opacity={streamU}>
              <rect x={TL.x - 34} y={TL.y - 72} width={TL.w + 68} height={144} rx={16} fill="none" stroke={colors.TEAL} strokeWidth={1.8} strokeDasharray="10 7" />
              <text x={TL.x - 20} y={TL.y - 84} fill={colors.TEAL} fontSize={14.5} fontWeight={700}>
                the durable stream — append-only, replicated, the machine itself
              </text>
              <g opacity={clamp01(streamU * 2 - 1)}>
                <rect x={TL.x + TL.w - 116} y={TL.y - 60} width={132} height={30} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
                <text x={TL.x + TL.w - 50} y={TL.y - 40} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontWeight={700}>
                  ⏸ suspended = stop appending
                </text>
              </g>
            </g>
          )}
          {agentU > 0 && (
            <g opacity={agentU}>
              <rect x={TL.x + 60} y={TL.y - 152} width={150} height={40} rx={8} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.6} />
              <text x={TL.x + 135} y={TL.y - 127} textAnchor="middle" fill={colors.TEAL} fontSize={13} fontWeight={700}>
                the agent
              </text>
              {[0.09, 0.14, 0.21, 0.27].map((u, k) => (
                <g key={k} opacity={clamp01(agentU * 3 - k * 0.5)}>
                  <line x1={TL.x + 135 + k * 18} y1={TL.y - 112} x2={tlX(u)} y2={TL.y - 14} stroke={colors.TEAL} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.6} />
                  <line x1={tlX(u)} y1={TL.y - 12} x2={tlX(u)} y2={TL.y + 12} stroke={colors.TEAL} strokeWidth={2.4} />
                </g>
              ))}
              <text x={TL.x + 240} y={TL.y - 133} fill={colors.MUTED} fontSize={12.5}>
                its keystrokes and requests are just more recorded inputs
              </text>
            </g>
          )}
          {replU > 0 && (
            <g opacity={replU}>
              {['your laptop', 'teammate tab', 'home desktop'].map((n, k) => {
                const x = 320 + k * 240;
                return (
                  <g key={n} opacity={clamp01(replU * 2 - k * 0.3)}>
                    <line x1={tlX(0.25 + k * 0.25)} y1={TL.y + 74} x2={x + 70} y2={TL.y + 118} stroke={colors.TEAL} strokeWidth={1.2} strokeDasharray="4 4" opacity={0.55} />
                    <rect x={x} y={TL.y + 120} width={140} height={40} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
                    <text x={x + 70} y={TL.y + 145} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5}>
                      {n}
                    </text>
                  </g>
                );
              })}
              <text x={640} y={TL.y + 190} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                subscribed replicas on the tailnet — the filesystem rides the same content-addressed chunks
              </text>
            </g>
          )}
          {rrU > 0 && (
            <g opacity={rrU}>
              <rect x={410} y={106} width={460} height={92} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={640} y={136} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={700}>
                whole-machine time travel
              </text>
              <text x={640} y={160} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                run-to instruction · reverse-step · watch memory
              </text>
              <text x={640} y={182} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                kernel + filesystem + agent, one address space of moments
              </text>
            </g>
          )}
        </g>

        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={300} y={252} width={680} height={148} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              keyframes and a log, appended to a durable stream
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              one stream: the machine, its user, its agent
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
