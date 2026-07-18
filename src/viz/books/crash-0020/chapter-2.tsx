// Chapter 2 — Four Checks, No Catch
//
// ONE persistent object: the dead-context token running crash-0017's real
// CHECK gauntlet in EnsureIsolateContext (v8 debug.cc) — CHECK(!ctx.is_null()),
// CHECK(ctx.IsHeapObject()), CHECK(IsValidHeapObject(...)), CHECK(ctx.IsContext())
// — passing all four and still segfaulting at the +0x93 field load. Grounded
// in PR #1385 facts F3/F4: IsValidHeapObject is page-membership only, so a
// dangling pointer into a still-mapped heap page passes; IsContext derefs the
// map word, which still reads stale bytes that say "context".
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { GauntletRail } from '../../agent';
import type { GauntletGate } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RAIL = { x: 170, y: 200, w: 800 };
const BOOM = { x: 1050, y: 200 };
const PAGE = { x: 330, y: 330, w: 460, h: 200, cols: 10, rows: 4 };
const NOTE = { x: 290, y: 340, w: 700, h: 170 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_RAIL: CameraState = { x: 620, y: 230, k: 1.06 };
const CAM_PAGE: CameraState = { x: 560, y: 400, k: 1.18 };
const CAM_BOOM: CameraState = { x: 900, y: 240, k: 1.12 };
const CAM_WIDE: CameraState = { x: 640, y: 360, k: 0.96 };

const GATES: { label: string }[] = [
  { label: '!ctx.is_null()' },
  { label: 'ctx.IsHeapObject()' },
  { label: 'IsValidHeapObject(..)' },
  { label: 'ctx.IsContext()' },
];

// deterministic "stale bytes" texture for the decayed page cells
const STALE = Array.from({ length: PAGE.cols * PAGE.rows }, (_, i) => ((i * 2654435761) >>> 16) % 100 / 100);
const PTR_CELL = 13; // where the dangling ctx pointer lands inside the page

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const g0 = tl.channel('g0', 0);
  const g1 = tl.channel('g1', 0);
  const g2 = tl.channel('g2', 0);
  const g3 = tl.channel('g3', 0);
  const tokenU = tl.channel('tokenU', -1); // token position in gate units
  const pageU = tl.channel('pageU', 0); // heap page draws
  const decayU = tl.channel('decayU', 0); // its contents rot to stale bytes
  const ptrU = tl.channel('ptrU', 0); // dangling pointer arrow into the page
  const tagU = tl.channel('tagU', 0); // the stale map-word chip
  const boomU = tl.channel('boomU', 0); // the field read that kills anyway
  const noteU = tl.channel('noteU', 0); // closing panel
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the prequel: crash-0017's gauntlet — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'This crash had a prequel. After crash seventeen, engineers planted four checks directly in front of that fatal read — a checkpoint the context must clear before anyone touches it.',
  });
  tl.tween(cam, CAM_RAIL, { at: t - 6.4, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: t - 5.8, dur: 1.4, ease: ease.draw });
  tl.tween(tokenU, 0, { at: t - 1.8, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · gate 1: not null — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Check one: the pointer is not null. Our dead context sails through — it is not null, it points somewhere.',
  });
  tl.tween(g0, 1, { at: t - 3.8, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 3 · gate 2: looks like a heap object — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'Check two: the bits are shaped like a heap object. Stale bits look exactly like they did when they were alive. Pass.',
  });
  tl.tween(tokenU, 1, { at: t - 4.8, dur: 0.8, ease: ease.linear });
  tl.tween(g1, 1, { at: t - 3.8, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 4 · gate 3 sounds strong — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Check three sounds like the strong one: is this a valid heap object? But all it really asks is whether the address falls inside a mapped heap page.',
  });
  tl.tween(tokenU, 2, { at: t - 5.6, dur: 0.8, ease: ease.linear });
  tl.tween(g2, 1, { at: t - 4.6, dur: 0.5, ease: ease.pop });
  tl.tween(cam, CAM_PAGE, { at: t - 3.6, dur: 1.4, ease: ease.move });
  tl.tween(pageU, 1, { at: t - 3.2, dur: 1.2, ease: ease.draw });
  tl.tween(ptrU, 1, { at: t - 1.6, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the repossessed house — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Picture the page. Still mapped, still readable — but the object that lived at our address is gone, its bytes left behind like furniture in a repossessed house.',
  });
  tl.tween(decayU, 1, { at: t - 4.8, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · dangling pointer passes — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'So a dangling pointer into a still mapped page passes the strongest check they had.',
  });
  t = tl.hold(t, 0.5);

  /* — beat 7 · gate 4: the stale type tag — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Check four even reads the object type tag — and the stale memory still says context. Four for four.',
  });
  tl.tween(tagU, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_RAIL, { at: t - 3.4, dur: 1.2, ease: ease.move });
  tl.tween(tokenU, 3, { at: t - 2.2, dur: 0.8, ease: ease.linear });
  tl.tween(g3, 1, { at: t - 1.2, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the read kills anyway — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Then the very next field read kills the process anyway. Every check asked, is this plausible memory. None of them could ask, is this context alive.',
  });
  tl.tween(cam, CAM_BOOM, { at: t - 5.8, dur: 1.2, ease: ease.move });
  tl.tween(boomU, 1, { at: t - 3.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 9 · close: identity is the missing weapon — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'You cannot guard your way out of an identity problem. The next move was to find out which context this was — and the crash report had left a number behind.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.0, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(noteU, 1, { at: t - 4.2, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, railU, g0, g1, g2, g3, tokenU, pageU, decayU, ptrU, tagU, boomU, noteU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** A mapped heap page whose contents have rotted — page membership ≠ alive. */
function HeapPage({ u, decay, ptr, tag, dim }: { u: number; decay: number; ptr: number; tag: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.85 * clamp01(dim));
  const { x, y, w, h, cols, rows } = PAGE;
  const d = clamp01(decay);
  const p = clamp01(ptr);
  const tg = clamp01(tag);
  const cw = w / cols;
  const ch = h / rows;
  const px = x + (PTR_CELL % cols) * cw + cw / 2;
  const py = y + Math.floor(PTR_CELL / cols) * ch + ch / 2;
  return (
    <g opacity={a}>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
      <text x={x - 10} y={y - 22} fill={colors.POSITIVE} fontSize={12} fontWeight={700} fontFamily={mono}>
        heap page — still mapped ✓
      </text>
      {Array.from({ length: cols * rows }, (_, i) => {
        const cx = x + (i % cols) * cw;
        const cy = y + Math.floor(i / cols) * ch;
        const show = clamp01(uu * (cols * rows * 0.4) - i * 0.3);
        const rot = d * STALE[i];
        const isPtr = i === PTR_CELL;
        return (
          <rect
            key={i}
            x={cx + 2}
            y={cy + 2}
            width={cw - 4}
            height={ch - 4}
            rx={3}
            fill={rot > 0.35 ? colors.MUTED : colors.ACCENT}
            opacity={show * (rot > 0.35 ? 0.12 + 0.18 * rot : 0.3 - 0.2 * d)}
            stroke={isPtr && p > 0.5 ? colors.NEGATIVE : 'none'}
            strokeWidth={2}
          />
        );
      })}
      {/* the dangling pointer, arriving from above */}
      {p > 0 && (
        <g opacity={p}>
          <line x1={px} y1={y - 74} x2={px} y2={py - 12} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="5 4" />
          <path d={`M ${px - 5} ${py - 20} L ${px} ${py - 10} L ${px + 5} ${py - 20}`} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
          <text x={px + 10} y={y - 56} fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono}>
            ctx = 0x1018006fffd1 (dangling)
          </text>
        </g>
      )}
      {/* the stale map word — IsContext() reads this and believes it */}
      {tg > 0 && (
        <g transform={`translate(${px + 24}, ${py - 6 - 6 * tg})`} opacity={tg}>
          <rect x={0} y={-16} width={218} height={26} rx={13} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={12} y={2} fill={colors.WARM} fontSize={12} fontWeight={700} fontFamily={mono}>
            map word: “Context” (stale)
          </text>
        </g>
      )}
    </g>
  );
}

/** The read that no CHECK guards: mov 0x93(%r15), %ecx — and the blast. */
function FieldRead({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y } = BOOM;
  return (
    <g opacity={uu}>
      <circle cx={x} cy={y} r={20 + 16 * uu} fill={colors.NEGATIVE} opacity={0.16} />
      <circle cx={x} cy={y} r={9} fill={colors.NEGATIVE} />
      <g stroke={colors.NEGATIVE} strokeWidth={2.4} strokeLinecap="round">
        <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
        <line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} />
      </g>
      <text x={x} y={y - 36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        mov 0x93(%r15), %ecx
      </text>
      <text x={x} y={y + 42} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono}>
        SIGSEGV — after four green checks
      </text>
    </g>
  );
}

/** Closing panel — the moral, on an opaque backdrop. */
function ClosingNote({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = NOTE;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={w} height={h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={w / 2} y={56} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        Checks ask “is this plausible memory?”
      </text>
      <text x={w / 2} y={94} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        None can ask “is this context alive?”
      </text>
      <text x={w / 2} y={134} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700} fontFamily={mono}>
        missing weapon: identity
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const gates: GauntletGate[] = GATES.map((g, i) => ({
    label: g.label,
    state: s.get([scene.g0, scene.g1, scene.g2, scene.g3][i]),
  }));
  return (
    <>
      <GauntletRail
        x={RAIL.x}
        y={RAIL.y}
        w={RAIL.w}
        gates={gates}
        u={s.get(scene.tokenU)}
        reveal={s.get(scene.railU)}
        tokenColor={colors.NEGATIVE}
        dim={dim}
      />
      <HeapPage u={s.get(scene.pageU)} decay={s.get(scene.decayU)} ptr={s.get(scene.ptrU)} tag={s.get(scene.tagU)} dim={dim} />
      <FieldRead u={s.get(scene.boomU) * (1 - 0.85 * dim)} />
      <ClosingNote u={s.get(scene.noteU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
