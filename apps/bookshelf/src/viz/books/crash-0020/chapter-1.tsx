// Chapter 1 — Segfault in the Pause Child
//
// ONE persistent object: a Pause.getObjectPreview command token diving a real
// call stack until one machine instruction reads a dead Context and the
// process dies. Grounded in replayio/chromium PR #1385's crash report core:
// signal "Segmentation fault", category PauseChild, requestMethod
// Pause.getObjectPreview, instructionPointer CommandCallback+233, faultAddress
// 0x101800700064; backtrace frames GetObjectPreviewCommand::Process →
// PauseData::AddObject → SendCommand → recordreplay::CommandCallback; fact F2:
// +233 is `mov 0x93(%r15),%ecx` with %r15 = isolate->context().
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const TAPE = { x: 120, y: 100, w: 720 };
const CHILD = { x: 890, y: 72, w: 268, h: 56 };
const STACK = { x: 110, y: 200, w: 330, rowH: 52, gap: 10 };
const ENGINE = { x: 520, y: 220, w: 640, h: 300 };
const BAND = { x: 560, y: 430, w: 560, cells: 12, cellW: 46, cellH: 40 };
const REPORT = { x: 380, y: 170, w: 560, h: 300 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_TAPE: CameraState = { x: 620, y: 160, k: 1.05 };
const CAM_STACK: CameraState = { x: 420, y: 340, k: 1.1 };
const CAM_ENGINE: CameraState = { x: 810, y: 370, k: 1.15 };
const CAM_REPORT: CameraState = { x: 660, y: 330, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.96 };

const FRAMES = [
  'GetObjectPreviewCommand::Process',
  'PauseData::AddObject',
  'PauseData::AddObject',
  'SendCommand',
  'recordreplay::CommandCallback',
];

// heap band: ctx cell + the +0x93 field the fatal read lands on
const CTX_CELL = 3;
const FAULT_CELL = 8;

const REPORT_ROWS: [string, string, string][] = [
  ['signal', 'Segmentation fault', colors.NEGATIVE],
  ['category', 'PauseChild', colors.TEXT],
  ['requestMethod', 'Pause.getObjectPreview', colors.TEXT],
  ['instructionPointer', 'CommandCallback+233', colors.WARM],
  ['faultAddress', '0x101800700064', colors.NEGATIVE],
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0); // recording tape draw
  const markU = tl.channel('markU', 0); // playhead scrub along the tape
  const childU = tl.channel('childU', 0); // PauseChild badge pop
  const stackN = tl.channel('stackN', 0); // frames revealed, fractional
  const tokenN = tl.channel('tokenN', -1); // command token, frame units
  const engineU = tl.channel('engineU', 0); // engine interior panel
  const regU = tl.channel('regU', 0); // %r15 register line
  const bandU = tl.channel('bandU', 0); // heap band draw
  const ptrU = tl.channel('ptrU', 0); // ctx pointer arrow
  const insU = tl.channel('insU', 0); // fatal instruction line
  const readU = tl.channel('readU', 0); // read arrow ctx → +0x93
  const crashU = tl.channel('crashU', 0); // red flash on the fault cell
  const reportU = tl.channel('reportU', 0); // crash report card
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the setting: a recorded session, a pause child — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Replay records a browser session once, then lets you rewind it and ask questions about any moment. A helper process called the pause child answers those questions.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 6.6, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: t - 6.2, dur: 1.4, ease: ease.draw });
  tl.tween(markU, 0.72, { at: t - 4.6, dur: 1.6, ease: ease.move });
  tl.tween(childU, 1, { at: t - 2.6, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the question dives — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'This story starts with one question. An agent inspecting an element asks for an object preview, and the request dives down through the pause machinery.',
  });
  tl.tween(cam, CAM_STACK, { at: t - 6.0, dur: 1.4, ease: ease.move });
  tl.tween(stackN, 3, { at: t - 5.2, dur: 2.4, ease: ease.move });
  tl.tween(tokenN, 2, { at: t - 4.8, dur: 2.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · bottom of the stack — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Each layer adds objects to the answer, until the request reaches a command callback at the very bottom — the engine speaking to the replay driver.',
  });
  tl.tween(stackN, 5, { at: t - 5.4, dur: 1.8, ease: ease.move });
  tl.tween(tokenN, 4, { at: t - 5.0, dur: 2.0, ease: ease.linear });
  tl.tween(engineU, 1, { at: t - 2.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 4 · load the context register — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'To answer, the callback first loads the current context — the world of scripts this code believes it is running in — into a register.',
  });
  tl.tween(cam, CAM_ENGINE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(regU, 1, { at: t - 4.4, dur: 0.7, ease: ease.enter });
  tl.tween(bandU, 1, { at: t - 3.6, dur: 1.2, ease: ease.draw });
  tl.tween(ptrU, 1, { at: t - 1.8, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the fatal instruction — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Then one machine instruction reads a field a hundred and forty seven bytes into that context. Ordinary bookkeeping — if the context is alive.',
  });
  tl.tween(insU, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(readU, 1, { at: t - 3.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · segfault — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'This one is not. The pointer aims at memory that no longer holds a living context. The read lands on garbage, and the process dies with a segmentation fault.',
  });
  tl.tween(crashU, 1, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 7 · the crash report — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'The crash report names the exact instruction and the exact address that faulted. Hold on to that address — it is about to become the whole case.',
  });
  tl.tween(cam, CAM_REPORT, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.8, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(reportU, 1, { at: t - 5.2, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 8 · close: crash twenty — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Replay files this one as crash twenty. And it was not the first visit — someone had already tried to stop this exact read once before.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);

  return {
    tl, cam, tapeU, markU, childU, stackN, tokenN, engineU,
    regU, bandU, ptrU, insU, readU, crashU, reportU, dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The recorded session tape + playhead + the PauseChild it spawns. */
function RecordingTape({ u, mark, child, dim }: { u: number; mark: number; child: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = 1 - 0.85 * clamp01(dim);
  const { x, y, w } = TAPE;
  const mx = x + w * clamp01(mark);
  const c = clamp01(child);
  return (
    <g opacity={a}>
      <rect x={x} y={y - 14} width={w * uu} height={28} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {Array.from({ length: 24 }, (_, i) => {
        const tx = x + 16 + i * ((w - 32) / 23);
        const show = clamp01(uu * 26 - i);
        return <line key={i} x1={tx} y1={y - 6} x2={tx} y2={y + 6} stroke={colors.GRID} strokeWidth={1} opacity={0.8 * show} />;
      })}
      <text x={x} y={y - 24} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={uu}>
        recordingId d0f06ada — a recorded browser session
      </text>
      {mark > 0 && (
        <g opacity={Math.min(1, mark * 4)}>
          <circle cx={mx} cy={y} r={7} fill={colors.ACCENT} />
          <circle cx={mx} cy={y} r={11} fill={colors.ACCENT} opacity={0.25} />
        </g>
      )}
      {c > 0 && (
        <g opacity={c}>
          <path
            d={`M ${mx + 10} ${y} C ${mx + 70} ${y}, ${CHILD.x - 50} ${CHILD.y + CHILD.h / 2}, ${CHILD.x - 6} ${CHILD.y + CHILD.h / 2}`}
            fill="none"
            stroke={colors.MUTED}
            strokeWidth={1.5}
            strokeDasharray="4 5"
            opacity={0.7}
          />
          <g transform={`translate(${CHILD.x}, ${CHILD.y + (1 - c) * 8})`}>
            <rect width={CHILD.w} height={CHILD.h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
            <text x={16} y={23} fill={colors.TEXT} fontSize={13} fontWeight={700} fontFamily={mono}>
              PauseChild
            </text>
            <text x={16} y={42} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
              processId 362 · answers questions
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/** The real backtrace, top frames first, the command token diving through. */
function CallStack({ n, token, dim }: { n: number; token: number; dim: number }) {
  if (n <= 0) return null;
  const a = 1 - 0.85 * clamp01(dim);
  const { x, y, w, rowH, gap } = STACK;
  const rowY = (i: number) => y + i * (rowH + gap);
  return (
    <g opacity={a}>
      <text x={x} y={y - 16} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={clamp01(n)}>
        Pause.getObjectPreview — the dive
      </text>
      {FRAMES.map((f, i) => {
        const u = clamp01(n - i);
        if (u <= 0) return null;
        const last = i === FRAMES.length - 1;
        const stroke = last ? colors.WARM : colors.GRID;
        return (
          <g key={i} transform={`translate(${x}, ${rowY(i) + (1 - u) * 10})`} opacity={u}>
            <rect width={w} height={rowH} rx={9} fill={colors.PANEL} stroke={stroke} strokeWidth={last ? 2 : 1.4} />
            <text x={14} y={rowH / 2 + 4.5} fill={last ? colors.WARM : colors.TEXT} fontSize={12} fontWeight={last ? 700 : 400} fontFamily={mono}>
              {f}
            </text>
          </g>
        );
      })}
      {token >= 0 && (
        <g>
          <circle cx={x - 22} cy={rowY(Math.min(token, FRAMES.length - 1)) + rowH / 2} r={7} fill={colors.ACCENT} />
          <circle cx={x - 22} cy={rowY(Math.min(token, FRAMES.length - 1)) + rowH / 2} r={11} fill={colors.ACCENT} opacity={0.22} />
        </g>
      )}
    </g>
  );
}

/** CommandCallback interior: register load, heap band, and the fatal read. */
function EngineInterior({
  u, reg, band, ptr, ins, read, crash, dim,
}: { u: number; reg: number; band: number; ptr: number; ins: number; read: number; crash: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.85 * clamp01(dim));
  const { x, y, w, h } = ENGINE;
  const b = clamp01(band);
  const cellX = (i: number) => BAND.x + i * BAND.cellW;
  const ctxX = cellX(CTX_CELL) + BAND.cellW / 2;
  const faultX = cellX(FAULT_CELL) + BAND.cellW / 2;
  const rd = clamp01(read);
  const cr = clamp01(crash);
  return (
    <g opacity={a}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={0.75} />
      <text x={x + 18} y={y + 26} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        inside recordreplay::CommandCallback
      </text>
      <g opacity={clamp01(reg)}>
        <rect x={x + 18} y={y + 40} width={w - 36} height={30} rx={7} fill={colors.BG} opacity={0.7} />
        <text x={x + 28} y={y + 60} fill={colors.ACCENT} fontSize={13} fontWeight={700} fontFamily={mono}>
          {'%r15 ← isolate->context()'}
        </text>
      </g>
      <g opacity={clamp01(ins)}>
        <rect x={x + 18} y={y + 78} width={w - 36} height={30} rx={7} fill={colors.BG} opacity={0.7} />
        <text x={x + 28} y={y + 98} fill={cr > 0.3 ? colors.NEGATIVE : colors.WARM} fontSize={13} fontWeight={700} fontFamily={mono}>
          {'CommandCallback+233:  mov 0x93(%r15), %ecx'}
        </text>
      </g>
      {/* heap band */}
      <g opacity={b}>
        <text x={BAND.x} y={BAND.y - 10} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          heap memory
        </text>
        {Array.from({ length: BAND.cells }, (_, i) => {
          const show = clamp01(b * (BAND.cells + 2) - i);
          const isCtx = i === CTX_CELL;
          const isFault = i === FAULT_CELL;
          const flash = isFault ? cr : 0;
          return (
            <g key={i} opacity={show}>
              <rect
                x={cellX(i)}
                y={BAND.y}
                width={BAND.cellW - 4}
                height={BAND.cellH}
                rx={5}
                fill={flash > 0 ? colors.NEGATIVE : colors.BG}
                fillOpacity={flash > 0 ? 0.25 + 0.5 * flash : 0.8}
                stroke={isCtx ? colors.ACCENT : isFault && rd > 0.9 ? colors.NEGATIVE : colors.GRID}
                strokeWidth={isCtx || (isFault && rd > 0.9) ? 2 : 1}
              />
              {isCtx && (
                <text x={cellX(i) + (BAND.cellW - 4) / 2} y={BAND.y + BAND.cellH + 16} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontWeight={700} fontFamily={mono}>
                  ctx
                </text>
              )}
              {isFault && rd > 0.9 && (
                <text x={cellX(i) + (BAND.cellW - 4) / 2} y={BAND.y + BAND.cellH + 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontWeight={700} fontFamily={mono}>
                  +0x93
                </text>
              )}
            </g>
          );
        })}
        {/* ctx pointer arrow from the register line down to the ctx cell */}
        {ptr > 0 && (
          <g opacity={clamp01(ptr)}>
            <line x1={ctxX} y1={ENGINE.y + 112} x2={ctxX} y2={BAND.y - 20 + 16 * clamp01(ptr)} stroke={colors.ACCENT} strokeWidth={1.8} />
            <path d={`M ${ctxX - 5} ${BAND.y - 10} L ${ctxX} ${BAND.y - 2} L ${ctxX + 5} ${BAND.y - 10}`} fill="none" stroke={colors.ACCENT} strokeWidth={1.8} />
          </g>
        )}
        {/* the fatal read: an arc from ctx to ctx+0x93 */}
        {rd > 0 && (
          <g>
            <path
              d={`M ${ctxX} ${BAND.y - 4} Q ${(ctxX + faultX) / 2} ${BAND.y - 56} ${faultX} ${BAND.y - 4}`}
              fill="none"
              stroke={cr > 0.3 ? colors.NEGATIVE : colors.WARM}
              strokeWidth={2}
              strokeDasharray="140"
              strokeDashoffset={140 * (1 - rd)}
            />
            {cr > 0 && (
              <g opacity={cr}>
                <circle cx={faultX} cy={BAND.y + BAND.cellH / 2} r={26 + 10 * cr} fill={colors.NEGATIVE} opacity={0.18} />
                <text x={faultX} y={BAND.y - 62} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={700} fontFamily={mono}>
                  SIGSEGV
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    </g>
  );
}

/** The crash report core — the case file this book keeps reopening. */
function CrashReport({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = REPORT;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 14})`} opacity={uu}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
      <text x={22} y={34} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
        crash-0020 · crash report core
      </text>
      {REPORT_ROWS.map(([k, v, c], i) => (
        <g key={k} transform={`translate(22, ${66 + i * 44})`}>
          <text fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            {k}
          </text>
          <text y={19} fill={c} fontSize={14.5} fontWeight={700} fontFamily={mono}>
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <RecordingTape u={s.get(scene.tapeU)} mark={s.get(scene.markU)} child={s.get(scene.childU)} dim={dim} />
      <CallStack n={s.get(scene.stackN)} token={s.get(scene.tokenN)} dim={dim} />
      <EngineInterior
        u={s.get(scene.engineU)}
        reg={s.get(scene.regU)}
        band={s.get(scene.bandU)}
        ptr={s.get(scene.ptrU)}
        ins={s.get(scene.insU)}
        read={s.get(scene.readU)}
        crash={s.get(scene.crashU)}
        dim={dim}
      />
      <CrashReport u={s.get(scene.reportU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
