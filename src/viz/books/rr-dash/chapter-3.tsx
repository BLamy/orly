// Watching Extraction Live
//
// Backed by: recorder/scripts/extract.py (LiveWriter — NDJSON records
// {k:'sources'} {k:'events'} {k:'lt'} {k:'stack'} {k:'hits' snapshot}
// {k:'done'} written to --live-out while the gdb pass runs),
// recorder/scripts/collect_lines.py (COLLECT_LIVE_OUT anchor records; hits
// snapshots are FULL, last wins), lib/live-tailer.ts (host tails live.ndjson
// with a monotonic byte-offset cursor, pump-until-empty, appends each line
// onto rec/<id>/live), app/api/recordings/[id]/live/route.ts (offset-cursor
// read; response { phase, records, offset }), components/LiveTraceView.tsx
// (1.5s pump; fold: sources/events replace, lt/stack append, hits snapshot
// replaces; phase live → canonical swap with count parity check; failed →
// frozen), lib/types.ts (RecordingMeta.phase 'live' | 'failed').
//
// ONE machine: the delta pipeline — extractor writes typed NDJSON chips,
// the tailer pumps them onto rec/<id>/live, the page's 1.5-second timer
// pumps the stream through its offset cursor, and the FOLD panel grows in
// lockstep: linetrace count ticks, gutter hits tick up, until the phase
// flips and the fold is swapped for the canonical streams.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, ServiceNode, TimerArc, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CONTAINER = { x: 60, y: 110, w: 330, h: 300 };
const TAPE = { x: 90, y: 452, w: 460, h: 26 };
const TAILER = { x: 470, y: 250 };
const STREAM = { x: 640, y: 452, w: 250, h: 26 };
const PAGE = { x: 720, y: 96, w: 460, h: 300 };
const TIMER = { cx: 682, cy: 160, r: 22 };

const CAM_EXTRACT: CameraState = { x: 350, y: 300, k: 1.24 };
const CAM_PAGE: CameraState = { x: 880, y: 260, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

/* ------------------------------------------------------------------ data */
type RecKind = 'sources' | 'events' | 'lt' | 'stack' | 'hits' | 'done';
const KIND_COLOR: Record<RecKind, string> = {
  sources: colors.ACCENT,
  events: colors.POSITIVE,
  lt: colors.TEAL,
  stack: colors.SECONDARY,
  hits: colors.WARM,
  done: colors.TEXT,
};
/** The live.ndjson record sequence (extract.py LiveWriter contract:
 * sources, events, then lt/stack/hits at every anchor, finally done). */
const RECORDS: RecKind[] = (() => {
  const out: RecKind[] = ['sources', 'events'];
  for (let a = 0; a < 8; a++) out.push('lt', 'stack', 'hits');
  out.push('done');
  return out;
})();
const rand = mulberry32(9);
const JITTER = RECORDS.map(() => rand() * 4 - 2);

/** Fold stats as a function of records consumed (deterministic). */
function foldStats(consumed: number) {
  let lt = 0;
  let stacks = 0;
  let hitsMax = 0;
  for (let i = 0; i < consumed && i < RECORDS.length; i++) {
    if (RECORDS[i] === 'lt') lt += 640; // one anchor batch of firings
    if (RECORDS[i] === 'stack') stacks += 1;
    if (RECORDS[i] === 'hits') hitsMax = Math.min(128, 16 * (stacks + 1));
  }
  return { lt, stacks, hitsMax };
}

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const contU = tl.channel('contU', 0);
  const tapeP = tl.channel('tapeP', 0); // records written to live.ndjson, 0..1
  const tailerU = tl.channel('tailerU', 0);
  const pumpP = tl.channel('pumpP', 0); // records forwarded to rec/<id>/live
  const pageU = tl.channel('pageU', 0);
  const clockP = tl.channel('clockP', 0); // page pump ticks (integer = one 1.5s pump)
  const consumedP = tl.channel('consumedP', 0); // records folded by the page
  const swapU = tl.channel('swapU', 0); // live → canonical swap flash
  const failU = tl.channel('failU', 0); // the alternate ending
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the wait — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'A recording used to appear only when extraction finished — and extraction can take minutes, a debugger stepping a breakpoint through every line of the run.',
  });
  tl.tween(contU, 1, { at: t - 5.2, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_EXTRACT, { at: t - 4.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the extractor narrates itself — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'So the extractor narrates its own progress. While the debugger pass is still running, it appends newline delimited records to a live file: sources first, then batches of line firings, stacks, and full hit snapshots.',
  });
  tl.tween(tapeP, 0.4, { at: t - 4.8, dur: 4.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · the tailer — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'On the host, a tailer follows that file: a monotonic byte offset, pump until empty. Each complete line becomes one message on the recording’s live stream.',
  });
  tl.tween(tailerU, 1, { at: t - 5.2, dur: 0.8, ease: ease.enter });
  tl.tween(tapeP, 0.55, { at: t - 5.2, dur: 5.2, ease: ease.linear });
  tl.tween(pumpP, 0.5, { at: t - 4.4, dur: 4.4, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the page pumps — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The page holds an offset cursor of its own. Every second and a half it pumps the live stream from where it left off, catching all the way up in a single call.',
  });
  tl.tween(pageU, 1, { at: t - 5.4, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_PAGE, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.tween(clockP, 3, { at: t - 4.2, dur: 4.5, ease: ease.linear });
  tl.tween(consumedP, 0.4, { at: t - 4.2, dur: 4.5, ease: ease.linear });
  tl.tween(tapeP, 0.7, { at: t - 5.4, dur: 5.4, ease: ease.linear });
  tl.tween(pumpP, 0.65, { at: t - 5.4, dur: 5.4, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the fold grows — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Each record folds into the growing picture. Line firings append. Stack samples append. Hit snapshots replace wholesale — the last snapshot wins, and the gutter counts tick upward.',
  });
  tl.tween(clockP, 7, { at: t - 5.8, dur: 5.8, ease: ease.linear });
  tl.tween(consumedP, 0.85, { at: t - 5.8, dur: 5.8, ease: ease.linear });
  tl.tween(tapeP, 0.95, { at: t - 5.8, dur: 5.8, ease: ease.linear });
  tl.tween(pumpP, 0.9, { at: t - 5.8, dur: 5.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 6 · phase live — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The index entry carries a phase flag. While it says live, the page keeps pumping — the trace is watchable while it is still being made.',
  });
  tl.tween(clockP, 9, { at: t - 4.8, dur: 3.4, ease: ease.linear });
  tl.tween(tapeP, 1, { at: t - 4.8, dur: 2.4, ease: ease.linear });
  tl.tween(pumpP, 1, { at: t - 4.4, dur: 2.6, ease: ease.linear });
  tl.tween(consumedP, 1, { at: t - 4.2, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the swap — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'When the canonical ingest lands, the phase clears — and the client swaps the fold for the real streams in one motion, checking that the counts agree on the way.',
  });
  tl.tween(swapU, 1, { at: t - 4.4, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the failed ending — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And if the run dies instead, the phase flips to failed. Whatever streamed stays viewable, frozen — honest evidence of exactly how far the extraction got.',
  });
  tl.tween(failU, 1, { at: t - 4.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · close — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'One file, one tailer, one polling cursor, one fold. That is the whole live path. All that remains is to give the recording a face.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.tween(failU, 0, { at: t - 5.2, dur: 0.8, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 4.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 3.6, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, cam, contU, tapeP, tailerU, pumpP, pageU, clockP, consumedP, swapU, failU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** A strip of typed NDJSON record chips, revealed left→right by `p`. */
function RecordTape({
  x,
  y,
  w,
  p,
  title,
  dim,
}: {
  x: number;
  y: number;
  w: number;
  p: number;
  title: string;
  dim: number;
}) {
  const n = Math.floor(clamp01(p) * RECORDS.length + 1e-6);
  const cw = w / RECORDS.length;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - 0.85 * dim}>
      <text y={-9} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        {title}
      </text>
      <rect width={w} height={26} rx={6} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.2} />
      {RECORDS.slice(0, n).map((k, i) => (
        <g key={i} transform={`translate(${4 + i * cw + JITTER[i] * 0}, 4)`}>
          <rect width={cw - 5} height={18} rx={3} fill={KIND_COLOR[k]} opacity={k === 'done' ? 0.95 : 0.65} />
        </g>
      ))}
    </g>
  );
}

/** The legend of record kinds (the LiveRecord union, lib/types.ts). */
function RecordLegend({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const kinds: [RecKind, string][] = [
    ['sources', "k:'sources' replace"],
    ['events', "k:'events' replace"],
    ['lt', "k:'lt' append"],
    ['stack', "k:'stack' append"],
    ['hits', "k:'hits' snapshot"],
    ['done', "k:'done'"],
  ];
  return (
    <g transform={`translate(90, 520)`} opacity={e * (1 - 0.7 * dim)}>
      {kinds.map(([k, label], i) => {
        const ku = clamp01(e * 7 - i);
        return (
          <g key={k} transform={`translate(${(i % 3) * 200}, ${Math.floor(i / 3) * 24})`} opacity={ku}>
            <rect width={12} height={12} rx={3} fill={KIND_COLOR[k]} opacity={0.85} />
            <text x={20} y={11} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The live trace page: phase badge, fold counters, ticking gutter. */
function LivePage({
  u,
  clockP,
  consumed,
  swap,
  fail,
  dim,
}: {
  u: number;
  clockP: number;
  consumed: number;
  swap: number;
  fail: number;
  dim: number;
}) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const sw = clamp01(swap);
  const f = clamp01(fail);
  const stats = foldStats(Math.floor(clamp01(consumed) * RECORDS.length));
  const phase = f > 0.5 ? 'failed' : sw > 0.5 ? 'complete' : 'live';
  const phaseColor = f > 0.5 ? colors.NEGATIVE : sw > 0.5 ? colors.POSITIVE : colors.WARM;
  const tick = clockP % 1; // 0..1 within the current 1.5s pump window
  const gutter = [stats.hitsMax, Math.round(stats.hitsMax * 0.68), Math.round(stats.hitsMax * 0.32), 1];
  return (
    <g transform={`translate(${PAGE.x}, ${PAGE.y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={PAGE.w} height={PAGE.h} rx={12} fill={colors.PANEL} stroke={f > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        /recordings/trace-demo · LiveTraceView
      </text>
      {/* phase badge */}
      <g transform={`translate(${PAGE.w - 108}, 12)`}>
        <rect width={90} height={24} rx={12} fill={phaseColor} opacity={0.16} />
        <rect width={90} height={24} rx={12} fill="none" stroke={phaseColor} strokeWidth={1.4} />
        <circle cx={16} cy={12} r={4} fill={phaseColor}>
          {phase === 'live' ? null : null}
        </circle>
        <text x={28} y={16} fill={phaseColor} fontSize={11} fontFamily={mono}>
          {phase.toUpperCase()}
        </text>
      </g>
      {/* fold counters */}
      <g transform="translate(18, 56)" fontFamily={mono}>
        <text fill={colors.TEXT} fontSize={13}>
          linetrace <tspan fill={colors.TEAL} fontWeight={700}>{stats.lt.toLocaleString('en-US')}</tspan> entries
        </text>
        <text y={26} fill={colors.TEXT} fontSize={13}>
          stacks <tspan fill={colors.SECONDARY} fontWeight={700}>{stats.stacks}</tspan> samples
        </text>
        <text y={52} fill={colors.TEXT} fontSize={13}>
          hits snapshot <tspan fill={colors.WARM} fontWeight={700}>#{Math.max(1, stats.stacks)}</tspan> (last wins)
        </text>
      </g>
      {/* mini source gutter, counts ticking up with each snapshot */}
      <g transform="translate(240, 52)">
        {gutter.map((h, i) => (
          <g key={i} transform={`translate(0, ${i * 26})`}>
            <rect width={44} height={18} rx={4} fill={colors.ACCENT} opacity={0.12 + 0.5 * (h / 128)} />
            <text x={22} y={13} textAnchor="middle" fill={h > 60 ? '#eaf2ff' : '#8fb4f5'} fontSize={11} fontFamily={mono}>
              {h}
            </text>
            <rect x={52} y={4} width={h > 0 ? 120 : 60} height={10} rx={3} fill={colors.GRID} opacity={0.7} />
          </g>
        ))}
        <text y={126} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
          gutter chips tick up
        </text>
      </g>
      {/* offset cursor line */}
      <g transform={`translate(18, ${PAGE.h - 62})`} fontFamily={mono}>
        <text fill={colors.MUTED} fontSize={11}>
          GET /api/recordings/…/live?offset=<tspan fill={colors.ACCENT}>{Math.floor(clockP) * 4}</tspan>
        </text>
        <text y={20} fill={colors.MUTED} fontSize={11}>
          → {'{ phase, records, offset }'} · pump until empty
        </text>
      </g>
      {/* swap flash: the canonical streams take over */}
      {sw > 0 && f < 0.5 && (
        <g opacity={sw}>
          <rect width={PAGE.w} height={PAGE.h} rx={12} fill={colors.POSITIVE} opacity={0.08 * (1 - Math.abs(sw - 0.5) * 2)} />
          <g transform={`translate(${PAGE.w / 2}, ${PAGE.h - 14})`}>
            <text textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={mono}>
              fold → canonical streams · count parity ✓
            </text>
          </g>
        </g>
      )}
      {/* failed freeze */}
      {f > 0 && (
        <g opacity={f}>
          <rect width={PAGE.w} height={PAGE.h} rx={12} fill={colors.NEGATIVE} opacity={0.07} />
          <g transform={`translate(${PAGE.w / 2}, ${PAGE.h - 14})`}>
            <text textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>
              phase:'failed' — the fold freezes, still viewable
            </text>
          </g>
        </g>
      )}
      {/* the 1.5s pump clock */}
      <g transform={`translate(${TIMER.cx - PAGE.x}, ${TIMER.cy - PAGE.y})`}>
        <TimerArc cx={0} cy={0} r={TIMER.r} u={f > 0.5 ? 0 : 1 - tick} color={phaseColor} />
        <text y={TIMER.r + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={mono}>
          1.5s
        </text>
      </g>
    </g>
  );
}

/** Closing card. */
function CloseCard({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(640, ${310 + (1 - e) * 10})`} opacity={e}>
      <rect x={-340} y={-56} width={680} height={112} rx={14} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
      <text y={-12} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        watchable while it is being made
      </text>
      <text y={24} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        live.ndjson → live-tailer → rec/&lt;id&gt;/live → 1.5s pump → fold → swap
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const contU = clamp01(s.get(scene.contU));
  const tailerU = clamp01(s.get(scene.tailerU));
  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={1 - 0.85 * dim}>
        <Zone x={CONTAINER.x} y={CONTAINER.y} w={CONTAINER.w} h={CONTAINER.h} label="rr-soft container (Docker)" kind="group" u={contU} />
        <ServiceNode
          x={CONTAINER.x + 110}
          y={CONTAINER.y + 110}
          kind="fn"
          label="extract.py"
          sublabel="gdb pass running"
          u={contU}
          glow={contU > 0.9 && s.get(scene.tapeP) < 1 ? 0.4 : 0}
        />
        <ServiceNode x={CONTAINER.x + 110} y={CONTAINER.y + 230} kind="storage" label="live.ndjson" sublabel="--live-out" u={contU} />
        {contU > 0.5 && (
          <Connection
            from={{ x: CONTAINER.x + 110, y: CONTAINER.y + 148 }}
            to={{ x: CONTAINER.x + 110, y: CONTAINER.y + 196 }}
            u={contU}
            flow={s.get(scene.tapeP) * 6}
            color={colors.TEAL}
            arrow
          />
        )}
        <ServiceNode x={TAILER.x} y={TAILER.y} kind="server" label="live-tailer" sublabel="offset · pump until empty" u={tailerU} />
        {tailerU > 0.3 && (
          <>
            <Connection from={{ x: CONTAINER.x + 170, y: CONTAINER.y + 230 }} to={{ x: TAILER.x - 66, y: TAILER.y + 20 }} u={tailerU} flow={s.get(scene.pumpP) * 6} color={colors.TEAL} arrow label="tail" />
            <Connection from={{ x: TAILER.x + 66, y: TAILER.y }} to={{ x: STREAM.x - 10, y: STREAM.y + 13 }} u={tailerU} flow={s.get(scene.pumpP) * 6} color={colors.TEAL} arrow />
          </>
        )}
      </g>
      <RecordTape x={TAPE.x} y={TAPE.y} w={TAPE.w} p={s.get(scene.tapeP)} title="live.ndjson — the extractor's running commentary" dim={dim} />
      <RecordTape x={STREAM.x} y={STREAM.y} w={STREAM.w} p={s.get(scene.pumpP)} title="rec/<id>/live" dim={dim} />
      <RecordLegend u={contU} dim={dim} />
      <LivePage
        u={s.get(scene.pageU)}
        clockP={s.get(scene.clockP)}
        consumed={s.get(scene.consumedP)}
        swap={s.get(scene.swapU)}
        fail={s.get(scene.failU)}
        dim={dim}
      />
      <CloseCard u={s.get(scene.closeU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
