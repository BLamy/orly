// Chapter 3 — Proof by Addition
//
// ONE persistent object: the operator log tape, whose lines are then harvested
// by a hex addition that identifies the dead Context. Grounded in PR #1385
// fact F7: the last COMMAND_CONTEXT_CHANGE before the LinkerFault was
// `slot iso=100a000758e0 ctx=1018006fffd1` during Pause.evaluateInGlobal
// (manifest index 12); the crashing Pause.getObjectPreview (index 16) emitted
// no new line (change-gated); faultAddress 0x101800700064 = 0x1018006fffd1 +
// 0x93; the default context is elsewhere (STATUS_CHANGE_ALIVE ctx=101800211755).
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const TAPE = { x: 80, y: 130, w: 590, h: 330, rowH: 46 };
const SUM = { right: 1190, y: 210, rowH: 52 };
const DEF = { x: 730, y: 420 };
const NOTE = { x: 300, y: 330, w: 680, h: 160 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_TAPE: CameraState = { x: 420, y: 300, k: 1.1 };
const CAM_SUM: CameraState = { x: 900, y: 300, k: 1.14 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.96 };

type LineKind = 'cmd' | 'ctx' | 'quiet' | 'fault';
const LINES: { text: string; kind: LineKind }[] = [
  { text: '[12] Pause.evaluateInGlobal', kind: 'cmd' },
  { text: '  COMMAND_CONTEXT_CHANGE slot', kind: 'ctx' },
  { text: '    iso=100a000758e0 ctx=1018006fffd1', kind: 'ctx' },
  { text: '[13..15] more commands — no change line', kind: 'quiet' },
  { text: '[16] Pause.getObjectPreview', kind: 'cmd' },
  { text: '  (no new COMMAND_CONTEXT_CHANGE)', kind: 'quiet' },
  { text: '  LinkerFault — Segmentation fault', kind: 'fault' },
];
// the addition, right-aligned rows: ctx + 0x93 = faultAddress
const SUM_ROWS: { text: string; label: string; tone: 'ctx' | 'off' | 'sum' }[] = [
  { text: '0x1018006fffd1', label: 'ctx — the parked slot context', tone: 'ctx' },
  { text: '+ 0x93', label: 'field offset in the fatal read', tone: 'off' },
  { text: '0x101800700064', label: 'faultAddress — from the crash report', tone: 'sum' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0); // log panel draw
  const lineN = tl.channel('lineN', 0); // log lines revealed, fractional
  const hlCtx = tl.channel('hlCtx', 0); // highlight the context-change lines
  const hlCrash = tl.channel('hlCrash', 0); // highlight the crash lines
  const addU = tl.channel('addU', 0); // addition rows 1–2 enter
  const sumN = tl.channel('sumN', 0); // sum digits reveal, 0..14
  const matchU = tl.channel('matchU', 0); // digit-for-digit green match
  const defU = tl.channel('defU', 0); // default-context elimination
  const noteU = tl.channel('noteU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the security footage — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'If the crash report is the body, the operator log is the security footage. Every pause child keeps a running diary of what it does.',
  });
  tl.tween(cam, CAM_TAPE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: t - 5.2, dur: 1.2, ease: ease.draw });
  tl.tween(lineN, 1, { at: t - 3.2, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 2 · the line that matters — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'One kind of line matters here. Whenever a command switches the engine to a different context, the diary records the isolate and the context address.',
  });
  tl.tween(lineN, 3, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(hlCtx, 1, { at: t - 3.2, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 3 · command twelve parks a context — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The last switch before the crash happened at command twelve, evaluate in global. It parked a slot context in the isolate, and wrote down where it lives.',
  });
  t = tl.hold(t, 0.4);

  /* — beat 4 · four commands later, silence — */
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Four commands later, the object preview request crashed. It logged no new switch, because this logging only fires on change. So the slot still held that same context.',
  });
  tl.tween(lineN, 7, { at: t - 6.4, dur: 2.2, ease: ease.move });
  tl.tween(hlCrash, 1, { at: t - 3.4, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the arithmetic — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Now the arithmetic. Take the parked address. Add the offset of the field the fatal instruction was reading — a hundred and forty seven bytes.',
  });
  tl.tween(cam, CAM_SUM, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(addU, 1, { at: t - 4.6, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 6 · digit for digit — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The sum equals the fault address from the crash report. Digit for digit.',
  });
  tl.tween(sumN, 14, { at: t - 5.2, dur: 2.0, ease: ease.move });
  tl.tween(matchU, 1, { at: t - 2.6, dur: 0.9, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 7 · eliminate the default context — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Could it have been the ordinary default context instead? No — that one lives at a different address entirely. Suspect eliminated.',
  });
  tl.tween(defU, 1, { at: t - 4.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the identification — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'So the dying read was reaching into the slot context parked by evaluate in global — a context that had quietly died in the meantime.',
  });
  t = tl.hold(t, 0.5);

  /* — beat 9 · an address, but no name — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Proof by addition — the victim is identified. But the log still could not say who this context was. It had an address, and no name. That is what the fix goes after.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(noteU, 1, { at: t - 4.0, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, tapeU, lineN, hlCtx, hlCrash, addU, sumN, matchU, defU, noteU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The operator log — a terminal diary whose lines appear as they're written. */
function LogTape({ u, n, hlCtx, hlCrash, dim }: { u: number; n: number; hlCtx: number; hlCrash: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.85 * clamp01(dim));
  const { x, y, w, h, rowH } = TAPE;
  const kindColor = (k: LineKind) =>
    k === 'cmd' ? colors.TEXT : k === 'ctx' ? colors.ACCENT : k === 'fault' ? colors.NEGATIVE : colors.MUTED;
  return (
    <g opacity={a}>
      <rect x={x} y={y} width={w} height={h * uu} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={x + 18} y={y - 12} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        operator.log — processId 362
      </text>
      {LINES.map((line, i) => {
        const lu = clamp01(n - i);
        if (lu <= 0) return null;
        const isCtxLine = line.kind === 'ctx';
        const isCrashLine = i >= 4;
        const hl = isCtxLine ? clamp01(hlCtx) : isCrashLine ? clamp01(hlCrash) : 0;
        const ly = y + 34 + i * rowH;
        return (
          <g key={i} opacity={lu}>
            {hl > 0 && (
              <rect
                x={x + 10}
                y={ly - 16}
                width={w - 20}
                height={rowH - 14}
                rx={6}
                fill={line.kind === 'fault' || (isCrashLine && line.kind !== 'ctx') ? colors.NEGATIVE : colors.ACCENT}
                opacity={0.12 * hl}
              />
            )}
            <text x={x + 22} y={ly + 4} fill={kindColor(line.kind)} fontSize={13.5} fontWeight={line.kind === 'quiet' ? 400 : 700} fontFamily={mono}>
              {line.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The hex addition — ctx + 0x93 = faultAddress, digit for digit. */
function HexSum({ add, sumN, match, dim }: { add: number; sumN: number; match: number; dim: number }) {
  const au = clamp01(add);
  if (au <= 0) return null;
  const a = 1 - 0.85 * clamp01(dim);
  const m = clamp01(match);
  const { right, y, rowH } = SUM;
  const charW = 21;
  const renderRow = (row: (typeof SUM_ROWS)[number], i: number, revealN: number | null) => {
    const ry = y + i * rowH + (i === 2 ? 26 : 0);
    const chars = row.text.split('');
    const baseColor = row.tone === 'ctx' ? colors.ACCENT : row.tone === 'off' ? colors.WARM : colors.NEGATIVE;
    const color = row.tone === 'sum' && m > 0.5 ? colors.POSITIVE : baseColor;
    return (
      <g key={i}>
        {chars.map((ch, j) => {
          const jFromRight = chars.length - 1 - j;
          const show = revealN === null ? au : clamp01(revealN - jFromRight);
          return (
            <text
              key={j}
              x={right - jFromRight * charW}
              y={ry}
              textAnchor="end"
              fill={color}
              fontSize={26}
              fontWeight={700}
              fontFamily={mono}
              opacity={show}
            >
              {ch}
            </text>
          );
        })}
        <text x={right - row.text.length * charW - 18} y={ry - 1} textAnchor="end" fill={colors.MUTED} fontSize={12.5} opacity={revealN === null ? au : clamp01(revealN - 2)}>
          {row.label}
        </text>
      </g>
    );
  };
  return (
    <g opacity={a}>
      {renderRow(SUM_ROWS[0], 0, null)}
      {renderRow(SUM_ROWS[1], 1, null)}
      {/* the rule */}
      <line
        x1={right - 14 * charW}
        y1={y + 1.5 * rowH + 8}
        x2={right + 6}
        y2={y + 1.5 * rowH + 8}
        stroke={colors.MUTED}
        strokeWidth={2}
        opacity={au}
      />
      {renderRow(SUM_ROWS[2], 2, clamp01(sumN))}
      {m > 0 && (
        <g opacity={m}>
          <rect x={right - 14 * charW - 10} y={y + 2 * rowH + 2} width={14 * charW + 26} height={44} rx={9} fill={colors.POSITIVE} opacity={0.1 * m} />
          <text x={right} y={y + 2 * rowH + 78} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
            ✓ exact match — the read was inside THIS context
          </text>
        </g>
      )}
    </g>
  );
}

/** The eliminated suspect: the isolate's default context lives elsewhere. */
function DefaultContextLine({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y } = DEF;
  return (
    <g transform={`translate(${x}, ${y + 90 + (1 - uu) * 8})`} opacity={uu * (1 - 0.85 * clamp01(dim))}>
      <text fill={colors.MUTED} fontSize={13.5} fontFamily={mono}>
        default context: ctx=101800211755
      </text>
      <text x={356} fill={colors.NEGATIVE} fontSize={14} fontWeight={700} fontFamily={mono}>
        ✗ not a match
      </text>
    </g>
  );
}

/** Closing panel — identified, but nameless. */
function ClosingNote({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = NOTE;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={w} height={h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={w / 2} y={52} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        Victim identified: the slot context from command 12
      </text>
      <text x={w / 2} y={90} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        An address — but no name, no owner, no lifecycle.
      </text>
      <text x={w / 2} y={128} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700} fontFamily={mono}>
        fix: give every context an identity in the log
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <LogTape u={s.get(scene.tapeU)} n={s.get(scene.lineN)} hlCtx={s.get(scene.hlCtx)} hlCrash={s.get(scene.hlCrash)} dim={dim} />
      <HexSum add={s.get(scene.addU)} sumN={s.get(scene.sumN)} match={s.get(scene.matchU)} dim={dim} />
      <DefaultContextLine u={s.get(scene.defU)} dim={dim} />
      <ClosingNote u={s.get(scene.noteU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
