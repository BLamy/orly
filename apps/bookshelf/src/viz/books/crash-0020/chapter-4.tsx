// Chapter 4 — A Stamp for Every Context
//
// ONE persistent object: the ContextAddress stamp — v8 api.cc's
// RecordReplayContextAddressToken(isolate, ctxAddr, includeId) — shown in its
// two modes: safe (print "iso=.. ctx=..", reads nothing behind the pointer)
// and id (deref Context::debug_context_id → " id=..", which can itself fault
// on garbage). Grounded in replayio/chromium-v8 PR #294 + chromium PR #1385:
// emitted safe on debug.cc's change-gated COMMAND_CONTEXT_CHANGE, with a
// separate COMMAND_CONTEXT_ID line carrying the id; and with id at lifecycle
// sites — STATUS_CHANGE_ALIVE/UNALIVE (record_replay_interface.cc), inspector
// getContext misses, contextCreated, resetContextGroup, discardInspectedContext
// (v8-inspector-impl.cc).
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CTX = { x: 120, y: 250, w: 300, h: 170 };
const STAMP = { x: 500, y: 140, w: 480, h: 54 };
const BADGE = { x: 500, y: 250, w: 480, h: 64 };
const BOARD = { x: 500, y: 330, w: 640, rowH: 34 };
const NOTE = { x: 300, y: 340, w: 680, h: 160 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_STAMP: CameraState = { x: 560, y: 280, k: 1.12 };
const CAM_CTX: CameraState = { x: 380, y: 320, k: 1.22 };
const CAM_BOARD: CameraState = { x: 780, y: 400, k: 1.1 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.95 };

type SiteKind = 'safe' | 'id' | 'life';
const SITES: { label: string; kind: SiteKind }[] = [
  { label: 'COMMAND_CONTEXT_CHANGE — hot path, includeId=false', kind: 'safe' },
  { label: 'COMMAND_CONTEXT_ID — printed right after, includeId=true', kind: 'id' },
  { label: 'STATUS_CHANGE_ALIVE / STATUS_CHANGE_UNALIVE', kind: 'life' },
  { label: 'V8InspectorImpl::contextCreated', kind: 'life' },
  { label: 'V8InspectorImpl::resetContextGroup (each entry)', kind: 'life' },
  { label: 'V8InspectorImpl::discardInspectedContext', kind: 'life' },
  { label: 'V8InspectorImpl::getContext — on a miss', kind: 'life' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const ctxU = tl.channel('ctxU', 0); // the context heap object
  const stampU = tl.channel('stampU', 0); // the token function chip
  const badgeU = tl.channel('badgeU', 0); // "iso=.. ctx=.." output
  const safeArrowU = tl.channel('safeArrowU', 0); // pointer-only read (outside)
  const idFieldU = tl.channel('idFieldU', 0); // debug_context_id interior field
  const idArrowU = tl.channel('idArrowU', 0); // the deref reaching inside
  const hazardU = tl.channel('hazardU', 0); // red: this read can fault
  const idOnU = tl.channel('idOnU', 0); // " id=1" appended to the badge
  const boardU = tl.channel('boardU', 0); // emit-site board panel
  const siteN = tl.channel('siteN', 0); // site rows lit, fractional
  const noteU = tl.channel('noteU', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the doctrine: make the next crash confess — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Here is the twist: the fix does not try to stop the crash. With no way to prove the root cause from this recording, the team follows a different doctrine — make the next crash confess.',
  });
  tl.tween(cam, CAM_STAMP, { at: t - 6.4, dur: 1.4, ease: ease.move });
  tl.tween(ctxU, 1, { at: t - 5.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the stamp — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The tool is a stamp. One shared function prints any context as a pair — the isolate it belongs to, and its raw heap address.',
  });
  tl.tween(stampU, 1, { at: t - 5.4, dur: 0.7, ease: ease.enter });
  tl.tween(badgeU, 1, { at: t - 3.6, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 3 · printing a pointer is safe — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Printing a pointer reads nothing behind it. Even if the context is garbage, stamping its address is perfectly safe.',
  });
  tl.tween(safeArrowU, 1, { at: t - 5.0, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the inspector's number — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'But an address is anonymous. The inspector already numbers every context it watches — a debug identity stored inside the object itself.',
  });
  tl.tween(cam, CAM_CTX, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(idFieldU, 1, { at: t - 4.0, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the catch — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'And there is the catch. Reading that number means touching context memory. On a dead context, the diagnostic itself could fault.',
  });
  tl.tween(idArrowU, 1, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(hazardU, 1, { at: t - 3.2, dur: 0.6, ease: ease.pop });
  tl.tween(idOnU, 1, { at: t - 4.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the switch: hot path stays safe — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'So the stamp gets a switch. On the hot path — the change line that fires while handling commands, where the context could be anything — identity stays off.',
  });
  tl.tween(cam, CAM_BOARD, { at: t - 6.0, dur: 1.4, ease: ease.move });
  tl.tween(hazardU, 0, { at: t - 6.0, dur: 0.6, ease: ease.move });
  tl.tween(boardU, 1, { at: t - 5.2, dur: 0.9, ease: ease.draw });
  tl.tween(siteN, 1, { at: t - 3.2, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the second line, and its absence — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'A second line, printed right after, adds the identity. If that second line is ever missing from a future log, the read itself died — and that absence is a clue too.',
  });
  tl.tween(siteN, 2, { at: t - 5.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 8 · lifecycle sites get the full stamp — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Everywhere a context is born, reset, or discarded — moments where it is known to be alive — the full stamp goes in, identity included.',
  });
  tl.tween(siteN, 7, { at: t - 5.6, dur: 2.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · close — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Now every context in the diary carries an address and a name, and switches can be lined up against births and deaths. The trap is built. It just had one more surprise in it.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.0, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(noteU, 1, { at: t - 4.2, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, ctxU, stampU, badgeU, safeArrowU, idFieldU, idArrowU, hazardU, idOnU, boardU, siteN, noteU, dimU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The context heap object, with the inspector's id stored inside it. */
function ContextBox({ u, idField, hazard, dim }: { u: number; idField: number; hazard: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.85 * clamp01(dim));
  const { x, y, w, h } = CTX;
  const f = clamp01(idField);
  const hz = clamp01(hazard);
  return (
    <g opacity={a}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={colors.PANEL} stroke={hz > 0.3 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2} />
      <text x={x + 18} y={y + 28} fill={colors.TEXT} fontSize={13.5} fontWeight={700} fontFamily={mono}>
        v8 Context
      </text>
      <text x={x + 18} y={y + 50} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        ctx=1018006fffd1
      </text>
      {/* interior fields */}
      <rect x={x + 18} y={y + 64} width={w - 36} height={26} rx={6} fill={colors.BG} opacity={0.7} />
      <text x={x + 28} y={y + 82} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        map word · scope info · …
      </text>
      <g opacity={f}>
        <rect x={x + 18} y={y + 98} width={w - 36} height={30} rx={6} fill={colors.SECONDARY} opacity={0.16} />
        <rect x={x + 18} y={y + 98} width={w - 36} height={30} rx={6} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} />
        <text x={x + 28} y={y + 118} fill={colors.SECONDARY} fontSize={12.5} fontWeight={700} fontFamily={mono}>
          debug_context_id = 1
        </text>
      </g>
      {hz > 0 && (
        <text x={x + 18} y={y + h + 24} fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono} opacity={hz}>
          ⚠ deref — faults if this memory is garbage
        </text>
      )}
    </g>
  );
}

/** The token function + its printed badge, id appended when includeId. */
function Stamper({
  stamp, badge, safeArrow, idArrow, idOn, hazard, dim,
}: { stamp: number; badge: number; safeArrow: number; idArrow: number; idOn: number; hazard: number; dim: number }) {
  const a = 1 - 0.85 * clamp01(dim);
  const su = clamp01(stamp);
  const bu = clamp01(badge);
  const sa = clamp01(safeArrow);
  const ia = clamp01(idArrow);
  const io = clamp01(idOn);
  const hz = clamp01(hazard);
  return (
    <g opacity={a}>
      {su > 0 && (
        <g transform={`translate(${STAMP.x}, ${STAMP.y + (1 - su) * 10})`} opacity={su}>
          <rect width={STAMP.w} height={STAMP.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={18} y={24} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
            api.cc — one shared token
          </text>
          <text x={18} y={42} fill={colors.TEXT} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            RecordReplayContextAddressToken(iso, ctx, includeId)
          </text>
        </g>
      )}
      {bu > 0 && (
        <g transform={`translate(${BADGE.x}, ${BADGE.y + (1 - bu) * 10})`} opacity={bu}>
          <rect width={BADGE.w} height={BADGE.h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.6} />
          <text x={18} y={26} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
            printed into the log
          </text>
          <text x={18} y={47} fill={colors.ACCENT} fontSize={14} fontWeight={700} fontFamily={mono}>
            iso=100a000758e0 ctx=1018006fffd1
            {io > 0.4 && <tspan fill={hz > 0.3 ? colors.NEGATIVE : colors.SECONDARY}> id=1</tspan>}
          </text>
        </g>
      )}
      {/* safe read: from the badge toward the context box, stopping OUTSIDE it */}
      {sa > 0 && (
        <g opacity={sa}>
          <line
            x1={BADGE.x - 8}
            y1={BADGE.y + BADGE.h / 2}
            x2={BADGE.x - 8 - 46 * sa}
            y2={BADGE.y + BADGE.h / 2}
            stroke={colors.POSITIVE}
            strokeWidth={2}
          />
          <text x={BADGE.x - 30} y={BADGE.y + BADGE.h / 2 - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            pointer only — never dereferenced
          </text>
        </g>
      )}
      {/* id read: reaches INSIDE the context to debug_context_id */}
      {ia > 0 && (
        <g opacity={ia}>
          <path
            d={`M ${BADGE.x - 8} ${BADGE.y + BADGE.h - 8} C ${BADGE.x - 60} ${CTX.y + 160}, ${CTX.x + CTX.w + 60} ${CTX.y + 113}, ${CTX.x + CTX.w - 18} ${CTX.y + 113}`}
            fill="none"
            stroke={hz > 0.3 ? colors.NEGATIVE : colors.SECONDARY}
            strokeWidth={2}
            strokeDasharray="230"
            strokeDashoffset={230 * (1 - ia)}
          />
          <text x={BADGE.x - 26} y={CTX.y + 168} textAnchor="end" fill={hz > 0.3 ? colors.NEGATIVE : colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono}>
            includeId — reads inside the object
          </text>
        </g>
      )}
    </g>
  );
}

/** Where the stamp is emitted — the PR's real call sites. */
function EmitBoard({ u, n, dim }: { u: number; n: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const a = uu * (1 - 0.85 * clamp01(dim));
  const { x, y, w, rowH } = BOARD;
  const kindColor = (k: SiteKind) => (k === 'safe' ? colors.POSITIVE : k === 'id' ? colors.SECONDARY : colors.WARM);
  const h = SITES.length * rowH + 46;
  return (
    <g opacity={a}>
      <rect x={x} y={y} width={w} height={h * uu} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={x + 18} y={y + 28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        where the stamp is printed
      </text>
      {SITES.map((site, i) => {
        const lu = clamp01(n - i);
        if (lu <= 0) return null;
        const c = kindColor(site.kind);
        const ry = y + 44 + i * rowH;
        return (
          <g key={i} opacity={lu}>
            <circle cx={x + 26} cy={ry + 8} r={5} fill={c} />
            <text x={x + 42} y={ry + 13} fill={i < 2 ? colors.TEXT : colors.MUTED} fontSize={12.5} fontWeight={i < 2 ? 700 : 400} fontFamily={mono}>
              {site.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Closing panel. */
function ClosingNote({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = NOTE;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu}>
      <rect width={w} height={h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={w / 2} y={52} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        Every context: an address AND a name
      </text>
      <text x={w / 2} y={90} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        Safe on the hot path · full identity where life is certain
      </text>
      <text x={w / 2} y={128} textAnchor="middle" fill={colors.ACCENT} fontSize={14.5} fontWeight={700} fontFamily={mono}>
        iso=.. ctx=.. [ id=.. ]
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <ContextBox u={s.get(scene.ctxU)} idField={s.get(scene.idFieldU)} hazard={s.get(scene.hazardU)} dim={dim} />
      <Stamper
        stamp={s.get(scene.stampU)}
        badge={s.get(scene.badgeU)}
        safeArrow={s.get(scene.safeArrowU)}
        idArrow={s.get(scene.idArrowU)}
        idOn={s.get(scene.idOnU)}
        hazard={s.get(scene.hazardU)}
        dim={dim}
      />
      <EmitBoard u={s.get(scene.boardU)} n={s.get(scene.siteN)} dim={dim} />
      <ClosingNote u={s.get(scene.noteU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
