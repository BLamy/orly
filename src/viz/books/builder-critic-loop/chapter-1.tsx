// Book scene — builder-critic-loop, chapter 1: "The Queue Is the Future".
// One coherent stage across 6 beats: a task readme's frontmatter types in on
// the left, tools/build_queue.py parses it and regenerates QUEUE.md (rows
// stagger in with status markers), project.json's four-state machine appears
// below, the builder takes exactly one task, and the chapter lands on the
// one rule: a claim is not evidence.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const README = { x: 40, y: 88, w: 330, h: 218 };
const FM_LINES = [
  { key: 'id', value: 'E1-T09' },
  { key: 'epic', value: '1' },
  { key: 'priority', value: '109' },
  { key: 'status', value: 'implemented' },
  { key: 'depends_on', value: '[E1-T04, E1-T06, E1-T08]' },
];

const TOOL = { x: 505, y: 180 };
const QUEUE = { x: 660, y: 64, w: 372, h: 300 };
const QUEUE_ROWS = [
  { marker: 'x', id: 'E1-T06', title: 'watch() long-poll + SSE' },
  { marker: 'x', id: 'E1-T07', title: 'snapshots and retention' },
  { marker: 'x', id: 'E1-T08', title: 'branch fork copy-on-write' },
  { marker: '?', id: 'E1-T09', title: 'fast-forward merge' },
  { marker: ' ', id: 'E1-T10', title: 'three-way merge' },
  { marker: ' ', id: 'E1-T11', title: 'merge conflict events' },
];
const MARKER_COLOR: Record<string, string> = {
  x: colors.POSITIVE,
  '?': colors.WARM,
  ' ': colors.MUTED,
  '!': colors.NEGATIVE,
  '~': colors.ACCENT,
};

const STATES = ['building', 'complete', 'paused', 'invalid_loop'];
const STATE_BOX = { x: 60, y: 420, w: 560, h: 120 };

const BUILDER = { x: 1150, y: 470 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const readmeU = tl.channel('readmeU', 0);
  const fmU = tl.channel('fmU', 0); // frontmatter lines, staggered off one channel

  const toolU = tl.channel('toolU', 0);
  const connRT = tl.channel('connRT', 0); // readme → build_queue.py
  const connTQ = tl.channel('connTQ', 0); // build_queue.py → QUEUE.md
  const queueU = tl.channel('queueU', 0);
  const rowsU = tl.channel('rowsU', 0);

  const legendU = tl.channel('legendU', 0);
  const implGlow = tl.channel('implGlow', 0);

  const statesU = tl.channel('statesU', 0);
  const invalidPulse = tl.channel('invalidPulse', 0);

  const builderU = tl.channel('builderU', 0);
  const connQB = tl.channel('connQB', 0);
  const pickU = tl.channel('pickU', 0); // packet: top eligible row → builder

  const dimU = tl.channel('dimU', 0);
  const ruleU = tl.channel('ruleU', 0);

  // BEAT 0 — a task is a folder; frontmatter is the record
  tl.caption({ at: 0.4, dur: 4.5, text: 'A task is a folder; its readme frontmatter is the record.' });
  tl.tween(readmeU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(fmU, 1, { at: 1.4, dur: 2.6, ease: ease.linear });
  tl.hold(4.4, 0.8);

  // BEAT 1 — build_queue.py regenerates QUEUE.md, never by hand
  tl.caption({ at: 5.6, dur: 4.5, text: 'build_queue.py parses every readme and regenerates QUEUE.md.' });
  tl.tween(toolU, 1, { at: 5.8, dur: 0.6, ease: ease.enter });
  tl.tween(connRT, 1, { at: 6.4, dur: 1.1, ease: ease.draw });
  tl.tween(queueU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(connTQ, 1, { at: 7.6, dur: 1.1, ease: ease.draw });
  tl.tween(rowsU, 1, { at: 8.6, dur: 2.0, ease: ease.linear });
  tl.hold(10.8, 0.8);

  // BEAT 2 — five markers; [?] implemented is NOT done
  tl.caption({ at: 12.0, dur: 4.5, text: '[?] implemented means awaiting adversarial verification — not done.' });
  tl.tween(legendU, 1, { at: 12.2, dur: 0.8, ease: ease.enter });
  tl.tween(implGlow, 1, { at: 13.4, dur: 0.5, ease: ease.pop });
  tl.hold(16.4, 0.8);

  // BEAT 3 — project.json: the four-state machine, invalid_loop is a loud stop
  tl.caption({ at: 17.6, dur: 4.5, text: 'project.json: building · complete · paused · invalid_loop — a loud stop.' });
  tl.tween(statesU, 1, { at: 17.8, dur: 1.2, ease: ease.enter });
  tl.tween(invalidPulse, 1, { at: 19.6, dur: 0.5, ease: ease.pop });
  tl.hold(22.0, 0.8);

  // BEAT 4 — one task in flight: the top eligible row rides to the builder
  tl.caption({ at: 23.2, dur: 4.5, text: 'One task in flight: the top eligible row, dependencies verified.' });
  tl.tween(builderU, 1, { at: 23.4, dur: 0.6, ease: ease.enter });
  tl.tween(connQB, 1, { at: 24.0, dur: 1.1, ease: ease.draw });
  tl.tween(pickU, 1, { at: 25.2, dur: 1.4, ease: ease.linear });
  tl.hold(27.6, 0.8);

  // BEAT 5 — the one rule: a claim is not evidence
  tl.caption({ at: 28.8, dur: 5.0, text: 'The one rule: no task reaches verified on claims — only on evidence.' });
  tl.tween(dimU, 1, { at: 29.0, dur: 0.9, ease: ease.move });
  tl.tween(ruleU, 1, { at: 30.0, dur: 0.8, ease: ease.enter });
  tl.hold(33.4, 1.4);

  return {
    tl,
    readmeU,
    fmU,
    toolU,
    connRT,
    connTQ,
    queueU,
    rowsU,
    legendU,
    implGlow,
    statesU,
    invalidPulse,
    builderU,
    connQB,
    pickU,
    dimU,
    ruleU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

/** The task readme card: frontmatter lines typing in off one channel. */
function ReadmeCard({ u, lines, dim }: { u: number; lines: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = README;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        .eforest/tasks/epic-1/E1-T09-…/readme.md
      </text>
      <text x={18} y={54} fill={colors.MUTED} fontSize={13} fontFamily={mono}>---</text>
      {FM_LINES.map((line, i) => {
        const lu = clamp01(lines * FM_LINES.length - i);
        if (lu <= 0) return null;
        const full = `${line.key}: ${line.value}`;
        const shown = full.slice(0, Math.ceil(lu * full.length));
        const isStatus = line.key === 'status';
        return (
          <text key={line.key} x={18} y={80 + i * 24} fontSize={13.5} fontFamily={mono} fill={isStatus ? colors.WARM : colors.TEXT}>
            {shown}
          </text>
        );
      })}
      <text x={18} y={80 + FM_LINES.length * 24} fill={colors.MUTED} fontSize={13} fontFamily={mono} opacity={clamp01(lines * 6 - 5)}>---</text>
    </g>
  );
}

/** QUEUE.md: generated rows with status markers; the top eligible row glows. */
function QueuePanel({ u, rows, implGlow, pick, dim }: { u: number; rows: number; implGlow: number; pick: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = QUEUE;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={13}>
        QUEUE.md — generated, never by hand
      </text>
      <text x={w - 18} y={28} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        21 / 101 verified
      </text>
      {QUEUE_ROWS.map((row, i) => {
        const ru = clamp01(rows * QUEUE_ROWS.length - i);
        if (ru <= 0) return null;
        const ry = 48 + i * 38;
        const isGate = row.marker === '?';
        const glow = isGate ? clamp01(implGlow) : 0;
        const picked = isGate ? clamp01(pick) : 0;
        return (
          <g key={row.id} opacity={ru}>
            {glow > 0 && <rect x={10} y={ry - 6} width={w - 20} height={32} rx={7} fill={colors.WARM} opacity={0.1 * glow * (1 - picked)} />}
            <text x={22} y={ry + 14} fontSize={13.5} fontFamily={mono} fill={MARKER_COLOR[row.marker]} fontWeight={700}>
              [{row.marker}]
            </text>
            <text x={64} y={ry + 14} fontSize={13.5} fontFamily={mono} fill={colors.TEXT}>
              {row.id}
            </text>
            <text x={140} y={ry + 14} fontSize={12.5} fill={colors.MUTED}>
              {row.title}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The five status markers, as a legend strip under the queue. */
function MarkerLegend({ u, implGlow, dim }: { u: number; implGlow: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const items: [string, string][] = [
    [' ', 'pending'],
    ['~', 'in-progress'],
    ['?', 'implemented'],
    ['!', 'refuted'],
    ['x', 'verified'],
  ];
  const y = QUEUE.y + QUEUE.h + 26;
  return (
    <g opacity={e * (1 - 0.6 * clamp01(dim))}>
      {items.map(([m, label], i) => {
        const lx = QUEUE.x + 4 + i * 76;
        const hot = m === '?' && implGlow > 0;
        return (
          <g key={m} transform={`translate(${lx}, ${y})`}>
            {hot && <rect x={-6} y={-14} width={74} height={38} rx={7} fill={colors.WARM} opacity={0.12 * clamp01(implGlow)} />}
            <text fontSize={12.5} fontFamily={mono} fill={MARKER_COLOR[m]} fontWeight={700}>
              [{m}]
            </text>
            <text y={16} fontSize={10.5} fill={hot ? colors.WARM : colors.MUTED}>
              {label}
            </text>
          </g>
        );
      })}
      {implGlow > 0 && (
        <text x={QUEUE.x + QUEUE.w - 4} y={y + 2} textAnchor="end" fontSize={12} fill={colors.WARM} fontWeight={700} opacity={clamp01(implGlow)}>
          [?] ≠ done
        </text>
      )}
    </g>
  );
}

/** project.json's four project states; invalid_loop pulses as the loud stop. */
function StateMachine({ u, pulse, dim }: { u: number; pulse: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w } = STATE_BOX;
  return (
    <g opacity={e * (1 - 0.6 * clamp01(dim))} transform={`translate(${x}, ${y + (1 - e) * 12})`}>
      <text y={-12} fill={colors.MUTED} fontSize={13}>
        .eforest/project.json — the loop runs only while “building”
      </text>
      {STATES.map((state, i) => {
        const su = clamp01(e * STATES.length - i);
        if (su <= 0) return null;
        const sx = i * (w / STATES.length);
        const isInvalid = state === 'invalid_loop';
        const isBuilding = state === 'building';
        const p = isInvalid ? clamp01(pulse) : 0;
        const stroke = isInvalid ? colors.NEGATIVE : isBuilding ? colors.POSITIVE : colors.GRID;
        return (
          <g key={state} transform={`translate(${sx}, 0)`} opacity={su}>
            <rect width={w / STATES.length - 14} height={44} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={isInvalid ? 1.5 + p : 1.5} />
            <text x={(w / STATES.length - 14) / 2} y={27} textAnchor="middle" fontSize={13} fontFamily={mono} fill={isInvalid ? colors.NEGATIVE : isBuilding ? colors.POSITIVE : colors.TEXT}>
              {state}
            </text>
            {isInvalid && p > 0 && (
              <text x={(w / STATES.length - 14) / 2} y={62} textAnchor="middle" fontSize={11} fill={colors.NEGATIVE} opacity={p}>
                loud stop — never a silent retry
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The picked task, riding from the queue's gate row to the builder. */
function PickPacket({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 1) return null;
  const from = { x: QUEUE.x + QUEUE.w - 24, y: QUEUE.y + 48 + 3 * 38 + 8 };
  const to = { x: BUILDER.x - 60, y: BUILDER.y - 16 };
  const px = from.x + (to.x - from.x) * uu;
  const py = from.y + (to.y - from.y) * uu - Math.sin(uu * Math.PI) * 40;
  return (
    <g transform={`translate(${px}, ${py})`}>
      <rect x={-34} y={-12} width={68} height={24} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fontSize={11} fontFamily={mono} fill={colors.WARM} fontWeight={700}>
        E1-T09
      </text>
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const ruleU = clamp01(s.get(scene.ruleU));
  return (
    <>
      <ReadmeCard u={s.get(scene.readmeU)} lines={s.get(scene.fmU)} dim={dim} />
      <ServiceNode {...TOOL} kind="fn" label="build_queue.py" sublabel="tools/ · stdlib only" u={s.get(scene.toolU)} dim={dim} />
      <Connection from={{ x: README.x + README.w, y: README.y + 90 }} to={{ x: TOOL.x - 58, y: TOOL.y }} u={s.get(scene.connRT)} label="frontmatter" dim={dim} />
      <Connection from={{ x: TOOL.x + 58, y: TOOL.y }} to={{ x: QUEUE.x - 6, y: TOOL.y }} u={s.get(scene.connTQ)} label="regenerates" dim={dim} />
      <QueuePanel u={s.get(scene.queueU)} rows={s.get(scene.rowsU)} implGlow={s.get(scene.implGlow)} pick={s.get(scene.pickU)} dim={dim} />
      <MarkerLegend u={s.get(scene.legendU)} implGlow={s.get(scene.implGlow)} dim={dim} />
      <StateMachine u={s.get(scene.statesU)} pulse={s.get(scene.invalidPulse)} dim={dim} />
      <ServiceNode {...BUILDER} kind="server" label="builder" sublabel="one task in flight" u={s.get(scene.builderU)} dim={dim} />
      <Connection
        from={{ x: QUEUE.x + QUEUE.w - 40, y: QUEUE.y + QUEUE.h }}
        to={{ x: BUILDER.x - 8, y: BUILDER.y - 44 }}
        u={s.get(scene.connQB)}
        label="top eligible task"
        dim={dim}
      />
      <PickPacket u={s.get(scene.pickU)} />

      {/* BEAT 5 — the one rule */}
      {ruleU > 0 && (
        <g opacity={ruleU}>
          <text x={640} y={300} textAnchor="middle" fontSize={30} fontWeight={700} fill={colors.TEXT}>
            a builder being satisfied is a <tspan fill={colors.WARM}>claim</tspan>
          </text>
          <text x={640} y={348} textAnchor="middle" fontSize={30} fontWeight={700} fill={colors.TEXT}>
            a deterministic recording is <tspan fill={colors.POSITIVE}>evidence</tspan>
          </text>
          <text x={640} y={396} textAnchor="middle" fontSize={15} fill={colors.MUTED}>
            no task reaches `verified` on claims — AGENTS.md, the one rule
          </text>
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/builder-critic-loop/chapter-1', beat: i }
export const vizScene = () => scene;
