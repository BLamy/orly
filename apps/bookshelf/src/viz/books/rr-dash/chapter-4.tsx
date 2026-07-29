// The DevTools Face
//
// Backed by: components/SourceViewer.tsx (HitChipMarker — blue gutter chips,
// log-scaled brightness; line popover with prev/next occurrence navigation),
// components/DevtoolsView.tsx (execution timeline over the linetrace;
// resolveEventTicks interpolates through sparse anchors),
// components/Timeline.tsx (anchors every ~25th firing; eventToSeq/seqToTicks;
// scrub reports the linetrace index and the parent highlights that line;
// Flamechart + DebugPanel fed by rec/<id>/stacks — bottom-up, <std>-collapsed,
// frames carry sampled locals from extractor v3), mcp/trace-mcp.mjs (every
// position-bearing result carries `reopen: rr replay -g <event>`), and the
// fixture fixtures/sample-bundle (lru.rs, hits 128/87/83, points line 41 →
// event 5120, events: execve/openat/read syscalls, exit).
//
// ONE machine: the devtools itself, built live around the fixture's lru
// source — gutter chips light up, the popover pins line 41 to event 5120 and
// mints the copyable replay command, the timeline scrubs and the highlighted
// line follows, the flame drawer stands up — then a recap re-traces the
// whole journey on a quiet stage.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const SRC = { x: 250, y: 82, w: 560, h: 330 };
const FILES = { x: 70, y: 82, w: 160, h: 330 };
const STRIP = { x: 250, y: 470, w: 930, h: 24 };
const POPOVER = { x: 840, y: 150 };
const FLAME = { x: 860, y: 300, w: 320, h: 130 };

const CAM_GUTTER: CameraState = { x: 430, y: 260, k: 1.35 };
const CAM_POP: CameraState = { x: 820, y: 230, k: 1.3 };
const CAM_STRIP: CameraState = { x: 700, y: 430, k: 1.2 };
const CAM_FLAME: CameraState = { x: 940, y: 340, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

/* ------------------------------------------------------------------ data */
/** lru.rs lines 33–42 (fixture sources.json) with real hit counts. */
const LINES: { no: number; code: string; hits: number }[] = [
  { no: 33, code: 'fn get(&mut self, key: &str) -> Option<u64> {', hits: 87 },
  { no: 34, code: '    if let Some(&v) = self.map.get(key) {', hits: 0 },
  { no: 35, code: '        self.touch(key);', hits: 0 },
  { no: 36, code: '        return Some(v);', hits: 128 },
  { no: 37, code: '    }', hits: 128 },
  { no: 38, code: '    None', hits: 0 },
  { no: 39, code: '}', hits: 0 },
  { no: 40, code: '', hits: 0 },
  { no: 41, code: 'fn evict_oldest(&mut self) {', hits: 83 },
  { no: 42, code: '    let oldest = self.order.remove(0);', hits: 83 },
];
const MAX_HITS = 128;
const chipT = (h: number) => Math.log(h + 1) / Math.log(MAX_HITS + 1); // HitChipMarker's scale
const LINE_H = 30;
const POP_LINE_IDX = 8; // line 41

/** Timeline markers from the fixture's events.json (rr global events). */
const MARKS: RecordingPoint[] = [
  { at: 0.02, kind: 'network', label: 'execve' },
  { at: 0.08, kind: 'network', label: 'openat' },
  { at: 0.13, kind: 'network', label: 'read' },
  { at: 0.34, kind: 'render' },
  { at: 0.45, kind: 'interaction', label: 'stdout' },
  { at: 0.58, kind: 'render' },
  { at: 0.66, kind: 'interaction', label: 'stdout' },
  { at: 0.74, kind: 'render' },
  { at: 0.9, kind: 'exception', label: 'exit' },
];

/** Scrub position → which source line is highlighted (the linetrace fold). */
const SCRUB_LINE = (u: number) => {
  if (u < 0.25) return 0; // get()
  if (u < 0.5) return 3; // return Some(v)
  if (u < 0.75) return 8; // evict_oldest
  return 9;
};

/** The flame drawer's stack (fixture-shaped: bottom-up, <std> collapsed). */
const FLAME_ROWS = [
  { label: 'main', w: 1.0, depth: 0 },
  { label: 'run_workload', w: 0.86, depth: 1 },
  { label: 'LruCache::get', w: 0.52, depth: 2 },
  { label: 'LruCache::evict_oldest', w: 0.3, depth: 2, x: 0.56 },
  { label: '<std>', w: 0.18, depth: 3, x: 0.1 },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const shellU = tl.channel('shellU', 0);
  const chipsU = tl.channel('chipsU', 0); // gutter chips stagger in
  const popU = tl.channel('popU', 0);
  const cmdU = tl.channel('cmdU', 0); // the rr replay -g chip
  const stripU = tl.channel('stripU', 0);
  const scrubU = tl.channel('scrubU', 0); // playhead 0..1
  const eventsU = tl.channel('eventsU', 0);
  const flameU = tl.channel('flameU', 0);
  const analystU = tl.channel('analystU', 0);
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0);

  /* — beat 1 · the payoff — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Everything so far was plumbing. This is the payoff: a source file that remembers its own execution.',
  });
  tl.tween(shellU, 1, { at: t - 4.6, dur: 0.9, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the gutter — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Down the gutter, every line wears its hit count — brighter chips for hotter lines, scaled logarithmically so one hit and a hundred and twenty eight both stay readable.',
  });
  tl.tween(cam, CAM_GUTTER, { at: t - 5.4, dur: 1.5, ease: ease.move });
  tl.tween(chipsU, 1, { at: t - 4.6, dur: 2.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the popover — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Click a line and the popover answers with its first execution — the global event number and the tick count from the points stream. The address chapter two promised.',
  });
  tl.tween(cam, CAM_POP, { at: t - 5.0, dur: 1.4, ease: ease.move });
  tl.tween(popU, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the command — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And the payoff of the payoff is one copyable command. Paste it into the replay debugger, and it parks you inside the recorded run at exactly that moment.',
  });
  tl.tween(cmdU, 1, { at: t - 4.8, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 5 · the timeline — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Along the bottom runs the execution timeline: every line firing in order, with markers for system calls, standard output, and the exit.',
  });
  tl.tween(cam, CAM_STRIP, { at: t - 5.2, dur: 1.5, ease: ease.move });
  tl.tween(popU, 0.12, { at: t - 5.4, dur: 0.8, ease: ease.move });
  tl.tween(stripU, 1, { at: t - 4.4, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 6 · scrubbing via anchors — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Sparse anchors — real event and tick readings taken every few firings — let the scrubber interpolate. Drag the playhead, and the source view highlights the exact line executing there.',
  });
  tl.tween(scrubU, 0.72, { at: t - 5.4, dur: 4.6, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the events panel — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The events panel reads the same markers as a console: what the program printed, which system calls it made, and how it exited.',
  });
  tl.tween(eventsU, 1, { at: t - 4.4, dur: 0.8, ease: ease.enter });
  tl.tween(scrubU, 0.9, { at: t - 4.6, dur: 3.0, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 8 · the flame drawer — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Pull open the flame drawer and the sampled stacks stand up as a flame chart — bottom up, standard library collapsed — and each frame carries the locals it was holding when sampled.',
  });
  tl.tween(cam, CAM_FLAME, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(eventsU, 0.12, { at: t - 5.5, dur: 0.7, ease: ease.move });
  tl.tween(flameU, 1, { at: t - 4.4, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · the analyst — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'One more reader gets the same folded trace: an AI analyst, over a tool server. Its house rule is the one you already know — every claim must cite a point link, never a vibe.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.5, ease: ease.move });
  tl.tween(analystU, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 10 · recap — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'So retrace the journey: a trace became streams, the streams became a fold, the fold became a face — and every line of that face can hand you back the debugger, parked at the moment you care about.',
  });
  tl.tween(dimU, 1, { at: t - 5.8, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: t - 5.0, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 11 · doctrine — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'A deterministic recording is evidence. This dashboard is what it takes to make evidence interrogable.',
  });
  tl.hold(t, 1.2);

  return { tl, cam, shellU, chipsU, popU, cmdU, stripU, scrubU, eventsU, flameU, analystU, dimU, recapU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** The source pane: code lines + log-bright gutter hit chips. */
function SourcePane({ shell, chips, scrub, stripOn, dim }: { shell: number; chips: number; scrub: number; stripOn: number; dim: number }) {
  const e = clamp01(shell);
  if (e <= 0) return null;
  const hl = stripOn > 0.5 && scrub > 0.01 ? SCRUB_LINE(scrub) : -1;
  return (
    <g opacity={1 - 0.85 * dim}>
      {/* file list */}
      <g transform={`translate(${FILES.x}, ${FILES.y + (1 - e) * 12})`} opacity={e}>
        <rect width={FILES.w} height={FILES.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
        <text x={14} y={24} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
          SOURCES
        </text>
        <text x={14} y={52} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
          src/main.rs
        </text>
        <rect x={6} y={64} width={FILES.w - 12} height={24} rx={5} fill={colors.ACCENT} opacity={0.16} />
        <text x={14} y={80} fill={colors.TEXT} fontSize={12} fontFamily={mono}>
          src/lru.rs
        </text>
      </g>
      {/* source pane */}
      <g transform={`translate(${SRC.x}, ${SRC.y + (1 - e) * 12})`} opacity={e}>
        <rect width={SRC.w} height={SRC.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
        <text x={16} y={22} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          src/lru.rs · cachesim — LRU eviction panic
        </text>
        {LINES.map((l, i) => {
          const cu = clamp01(chips * (LINES.length + 2) - i);
          const t0 = chipT(l.hits);
          const lit = hl === i;
          return (
            <g key={l.no} transform={`translate(0, ${40 + i * LINE_H})`}>
              {lit && <rect x={4} y={-4} width={SRC.w - 8} height={LINE_H - 4} rx={4} fill={colors.WARM} opacity={0.14} />}
              <text x={20} y={14} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={0.6}>
                {l.no}
              </text>
              {/* the hit chip — log-scaled brightness, like HitChipMarker */}
              {l.hits > 0 && cu > 0 && (
                <g opacity={cu}>
                  <rect x={44} y={-1} width={40} height={19} rx={5} fill={`rgba(59, 130, 246, ${(0.12 + 0.5 * t0).toFixed(3)})`} />
                  <text x={64} y={13} textAnchor="middle" fill={t0 > 0.6 ? '#eaf2ff' : '#8fb4f5'} fontSize={11} fontFamily={mono}>
                    {l.hits}
                  </text>
                </g>
              )}
              <text x={98} y={14} fill={lit ? colors.TEXT : colors.MUTED} fontSize={12.5} fontFamily={mono}>
                {l.code}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** The execution-point popover on line 41 — event 5120, ticks 481937. */
function Popover({ u, cmd, dim }: { u: number; cmd: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const c = clamp01(cmd);
  const y0 = SRC.y + 40 + POP_LINE_IDX * LINE_H;
  return (
    <g opacity={e * (1 - 0.85 * dim)}>
      <line x1={SRC.x + 350} y1={y0 + 8} x2={POPOVER.x - 6} y2={POPOVER.y + 40} stroke={colors.WARM} strokeWidth={1.3} strokeDasharray="3 3" />
      <g transform={`translate(${POPOVER.x}, ${POPOVER.y + (1 - e) * 10})`}>
        <rect width={330} height={c > 0.05 ? 128 : 92} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
        <text x={16} y={26} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          line 41 · first execution
        </text>
        <text x={16} y={50} fill={colors.TEXT} fontSize={13.5} fontFamily={mono} fontWeight={700}>
          event 5120 · ticks 481,937
        </text>
        <text x={16} y={74} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          ◀ prev · 83 firings · next ▶
        </text>
        {c > 0.05 && (
          <g transform={`translate(16, ${92 + (1 - c) * 6})`} opacity={c}>
            <rect x={-4} y={-14} width={230} height={26} rx={6} fill={colors.WARM} opacity={0.14} />
            <rect x={-4} y={-14} width={230} height={26} rx={6} fill="none" stroke={colors.WARM} strokeWidth={1.3} />
            <text y={4} fill={colors.WARM} fontSize={12.5} fontFamily={mono} fontWeight={700}>
              rr replay -g 5120
            </text>
            <text x={236} y={4} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
              ⧉ copy
            </text>
          </g>
        )}
      </g>
    </g>
  );
}

/** The events/console panel (fixture events.json). */
function EventsPanel({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const rows = [
    ['syscall', 'execve("target/release/cachesim", …) = 0'],
    ['syscall', 'openat(AT_FDCWD, "workload.txt", O_RDONLY) = 3'],
    ['stdout', 'evicting key "a" (oldest)'],
    ['exit', 'process exited with status 101'],
  ];
  return (
    <g transform={`translate(${SRC.x}, ${540 + (1 - e) * 10})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={930} height={78} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={14} y={18} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
        EVENTS · syscalls | stdout | signals | exit
      </text>
      {rows.map(([kind, text], i) => {
        const ru = clamp01(e * 5 - i);
        return (
          <g key={i} transform={`translate(14, ${32 + i * 12})`} opacity={ru}>
            <text fill={kind === 'exit' ? colors.NEGATIVE : kind === 'stdout' ? colors.POSITIVE : colors.MUTED} fontSize={9.5} fontFamily={mono}>
              {kind.padEnd(8, ' ')} {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The flame drawer: sampled stacks standing up. */
function FlameDrawer({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const rowH = 22;
  return (
    <g transform={`translate(${FLAME.x}, ${FLAME.y + (1 - ease.enter(e)) * 16})`} opacity={Math.min(1, e * 2) * (1 - 0.85 * dim)}>
      <rect x={-14} y={-30} width={FLAME.w + 28} height={FLAME.h + 44} rx={11} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={0} y={-10} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
        FLAME · rec/…/stacks · bottom-up · &lt;std&gt; collapsed
      </text>
      {FLAME_ROWS.map((r, i) => {
        const ru = clamp01(e * (FLAME_ROWS.length + 1) - i);
        const w = FLAME.w * r.w * ru;
        const x = FLAME.w * (r.x ?? 0);
        const y = FLAME.h - (r.depth + 1) * (rowH + 3);
        const col = r.label === '<std>' ? colors.MUTED : [colors.ACCENT, colors.TEAL, colors.SECONDARY, colors.MUTED][r.depth];
        return (
          <g key={r.label} transform={`translate(${x}, ${y})`} opacity={ru}>
            <rect width={w} height={rowH} rx={4} fill={col} opacity={0.4} />
            <rect width={w} height={rowH} rx={4} fill="none" stroke={col} strokeWidth={1.2} />
            {w > 70 && (
              <text x={8} y={15} fill={colors.TEXT} fontSize={10.5} fontFamily={mono}>
                {r.label}
              </text>
            )}
          </g>
        );
      })}
      {e > 0.85 && (
        <text x={0} y={FLAME.h + 4} fill={colors.WARM} fontSize={10} fontFamily={mono} opacity={(e - 0.85) / 0.15}>
          frames[].vars — sampled locals (v3+)
        </text>
      )}
    </g>
  );
}

/** The AI analyst chip — same trace, same house rule. */
function AnalystChip({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${FILES.x}, ${470 + (1 - e) * 10})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={160} height={148} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
      <text x={14} y={24} fill={colors.SECONDARY} fontSize={11} fontFamily={mono}>
        AI analyst
      </text>
      <text x={14} y={46} fill={colors.MUTED} fontSize={10} fontFamily={mono}>
        trace-mcp · tools
      </text>
      <text x={14} y={70} fill={colors.TEXT} fontSize={10} fontFamily={mono}>
        "the hot line is
      </text>
      <text x={14} y={84} fill={colors.TEXT} fontSize={10} fontFamily={mono}>
        thirty six —
      </text>
      <text x={14} y={98} fill={colors.TEXT} fontSize={10} fontFamily={mono}>
        reopen:
      </text>
      <text x={14} y={116} fill={colors.WARM} fontSize={10} fontFamily={mono}>
        rr replay -g 2101
      </text>
      <text x={14} y={136} fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
        claims cite points
      </text>
    </g>
  );
}

/** Recap card: the whole journey, on a quiet stage. */
function RecapCard({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const steps = ['trace.tar.zst', 'streams', 'fold', 'devtools', 'rr replay -g'];
  return (
    <g transform={`translate(640, ${300 + (1 - e) * 10})`} opacity={e}>
      <rect x={-390} y={-70} width={780} height={140} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text y={-30} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
        evidence, made interrogable
      </text>
      {steps.map((label, i) => {
        const su = clamp01(e * (steps.length + 1) - i);
        const x = -330 + i * 165;
        return (
          <g key={label} opacity={su}>
            <rect x={x} y={-2} width={130} height={32} rx={8} fill={colors.ACCENT} opacity={0.12} />
            <rect x={x} y={-2} width={130} height={32} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={x + 65} y={18} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={mono}>
              {label}
            </text>
            {i < steps.length - 1 && (
              <text x={x + 148} y={18} fill={colors.MUTED} fontSize={13}>
                →
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const stripU = s.get(scene.stripU);
  const scrub = clamp01(s.get(scene.scrubU));
  return (
    <Camera {...s.get(scene.cam)}>
      <SourcePane shell={s.get(scene.shellU)} chips={s.get(scene.chipsU)} scrub={scrub} stripOn={stripU} dim={dim} />
      <Popover u={s.get(scene.popU)} cmd={s.get(scene.cmdU)} dim={dim} />
      <g opacity={1 - 0.85 * dim}>
        <RecordingStrip
          x={STRIP.x}
          y={STRIP.y}
          w={STRIP.w}
          h={STRIP.h}
          points={MARKS}
          reveal={stripU}
          u={scrub}
          title="execution timeline — every line firing, seq-ordered, anchors every ~25th"
        />
      </g>
      <EventsPanel u={s.get(scene.eventsU)} dim={dim} />
      <FlameDrawer u={s.get(scene.flameU)} dim={dim} />
      <AnalystChip u={s.get(scene.analystU)} dim={dim} />
      <RecapCard u={s.get(scene.recapU)} />
    </Camera>
  );
}
export const vizScene = () => scene;
