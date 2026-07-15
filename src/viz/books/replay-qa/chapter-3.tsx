// Book scene — replay-qa, chapter 3: "Fix, Mark, Re-verify".
// One stage, 7 beats: full-qa.js pulls the open bugs (beat 0), the bug detail
// is read as the source of truth (beat 1), the agent patches the exact files
// (beat 2), one PATCH marks it fixed (beat 3), resolving the journey's bugs
// triggers the retry server-side (beat 4), the re-run verdict lands — a real
// fix sticks, a regression flips to reopened (beat 5) — and the closer draws
// the repair loop as a ring you ride until no open bugs remain (beat 6).
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { NodeBadge, Packet, RequestFlow, ServiceNode, TimerArc } from '../../primitives';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const AGENT = { x: 150, y: 105 };
const API = { x: 620, y: 95 };
const APP = { x: 1120, y: 95 };

const LIST = { x: 70, y: 205, w: 330 };
const BUGS = [
  { id: '#146', title: 'login form loses focus' },
  { id: '#147', title: 'checkout total wrong' },
  { id: '#148', title: 'stale cart after logout' },
];
const ROW_H = 52;
const ROW_GAP = 12;

const DETAIL = { x: 430, y: 205, w: 400, h: 240 };
const DETAIL_LINES = [
  'repro:    add item → apply SAVE10 → checkout',
  'expected: total $18.00',
  'actual:   total $20.00',
  'severity: high',
];

const PATCH = { x: 860, y: 205, w: 350, h: 210 };
const PATCH_LINES = [
  { text: 'cart/discount.ts', kind: 'file' },
  { text: '-  const total = subtotal;', kind: 'del' },
  { text: '+  const total = subtotal - discount;', kind: 'add' },
  { text: 'checkout/summary.tsx', kind: 'file' },
  { text: '+  renderTotal(total);', kind: 'add' },
] as const;

const RING = { cx: 640, cy: 340, r: 175 };
const STOPS = [
  { label: 'pull report', color: colors.ACCENT },
  { label: 'patch', color: colors.SECONDARY },
  { label: 'mark fixed', color: colors.WARM },
  { label: 'retry', color: colors.TEAL },
  { label: 'verify', color: colors.POSITIVE },
];

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const agentU = tl.channel('agentU', 0);
  const apiU = tl.channel('apiU', 0);
  const pullU = tl.channel('pullU', 0);
  const rowU = BUGS.map((_, i) => tl.channel(`row${i}U`, 0));

  const detailU = tl.channel('detailU', 0);
  const detailLineU = tl.channel('detailLineU', 0);
  const recChipU = tl.channel('recChipU', 0);

  const patchU = tl.channel('patchU', 0);
  const patchLineU = tl.channel('patchLineU', 0);
  const rootChipU = tl.channel('rootChipU', 0);

  const markPktU = tl.channel('markPktU', 0);
  const fixedPop = tl.channel('fixedPop', 0);
  const statusesU = tl.channel('statusesU', 0);

  const timerU = tl.channel('timerU', 1);
  const retryChipU = tl.channel('retryChipU', 0);

  const appU = tl.channel('appU', 0);
  const rerunU = tl.channel('rerunU', 0);
  const resolvedPop = tl.channel('resolvedPop', 0);
  const reopenU = tl.channel('reopenU', 0);

  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const ringLabelU = tl.channel('ringLabelU', 0);

  // BEAT 0 — pull the open bugs: list, then each detail
  tl.caption({ at: 0.4, dur: 4.5, text: 'full-qa.js pulls every open bug, then each detail: GET /bugs/:id.' });
  tl.tween(agentU, 1, { at: 0.6, dur: 0.6, ease: ease.enter });
  tl.tween(apiU, 1, { at: 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(pullU, 1, { at: 1.8, dur: 3.0, ease: ease.linear });
  BUGS.forEach((_, i) => tl.tween(rowU[i], 1, { at: 4.6 + i * 0.35, dur: 0.6, ease: ease.enter }));
  tl.hold(8.2, 1.0);

  // BEAT 1 — read the report first: the primary debugging source
  tl.caption({ at: 9.2, dur: 4.5, text: 'The bug report is the source of truth — repro, expected vs actual, recording.' });
  tl.tween(detailU, 1, { at: 9.6, dur: 0.7, ease: ease.enter });
  tl.tween(detailLineU, 1, { at: 10.5, dur: 3.2, ease: ease.linear });
  tl.tween(recChipU, 1, { at: 14.2, dur: 0.5, ease: ease.pop });
  tl.hold(17.2, 0.8);

  // BEAT 2 — fix it in your codebase, grouped by root cause
  tl.caption({ at: 18.2, dur: 4.5, text: 'The agent patches the exact files the report points to.' });
  tl.tween(patchU, 1, { at: 18.6, dur: 0.7, ease: ease.enter });
  tl.tween(patchLineU, 1, { at: 19.5, dur: 3.6, ease: ease.linear });
  tl.tween(rootChipU, 1, { at: 23.6, dur: 0.5, ease: ease.pop });
  tl.hold(26.2, 0.8);

  // BEAT 3 — mark it fixed: one PATCH to the bug's status
  tl.caption({ at: 27.2, dur: 4.5, text: "mark-bug.js 147 fixed — one PATCH to the bug's status." });
  tl.tween(markPktU, 1, { at: 27.8, dur: 1.6, ease: ease.linear });
  tl.tween(fixedPop, 1, { at: 29.5, dur: 0.5, ease: ease.pop });
  tl.tween(statusesU, 1, { at: 30.6, dur: 0.6, ease: ease.enter });
  tl.hold(34.2, 1.0);

  // BEAT 4 — resolving the journey's bugs triggers the retry, server-side
  tl.caption({ at: 35.2, dur: 4.5, text: 'All bugs on the journey resolved → Replay QA schedules the retry itself.' });
  tl.tween(retryChipU, 1, { at: 35.6, dur: 0.6, ease: ease.enter });
  tl.tween(timerU, 0, { at: 36.4, dur: 5.2, ease: ease.linear });
  tl.hold(42.4, 0.8);

  // BEAT 5 — the verdict: a real fix sticks; a regression flips to reopened
  tl.caption({ at: 43.4, dur: 4.5, text: 'The journey re-runs: a real fix sticks; a regression flips to reopened.' });
  tl.tween(appU, 1, { at: 43.6, dur: 0.6, ease: ease.enter });
  tl.tween(rerunU, 1, { at: 44.4, dur: 3.0, ease: ease.linear });
  tl.tween(resolvedPop, 1, { at: 47.6, dur: 0.5, ease: ease.pop });
  tl.tween(reopenU, 1, { at: 48.8, dur: 0.6, ease: ease.enter });
  tl.hold(51.4, 0.8);

  // BEAT 6 — the repair loop, ridden until no open bugs remain
  tl.caption({ at: 52.4, dur: 5.0, text: 'Pull, patch, mark fixed, re-verify — repeat until no open bugs remain.' });
  tl.tween(dimU, 1, { at: 52.8, dur: 1.0, ease: ease.move });
  tl.tween(ringU, 1, { at: 53.6, dur: 1.4, ease: ease.draw });
  tl.tween(orbitU, 2, { at: 55.2, dur: 6.2, ease: ease.linear });
  tl.tween(ringLabelU, 1, { at: 56.4, dur: 0.6, ease: ease.enter });
  tl.hold(61.4, 1.2);

  return {
    tl,
    agentU, apiU, pullU, rowU,
    detailU, detailLineU, recChipU,
    patchU, patchLineU, rootChipU,
    markPktU, fixedPop, statusesU,
    timerU, retryChipU,
    appU, rerunU, resolvedPop, reopenU,
    dimU, ringU, orbitU, ringLabelU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function Chip({ x, y, text, u, color, filled = false }: { x: number; y: number; text: string; u: number; color: string; filled?: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = text.length * 6.9 + 22;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={filled ? color : colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={filled ? colors.BG : color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** One bug row in the open-bugs list, with a status chip that changes. */
function BugRow({ i, u, status, statusColor, pop, dim }: { i: number; u: number; status: string; statusColor: string; pop: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const y = LIST.y + 34 + i * (ROW_H + ROW_GAP);
  const bug = BUGS[i];
  return (
    <g transform={`translate(${LIST.x}, ${y + (1 - uu) * 10})`} opacity={uu * (1 - 0.7 * clamp01(dim))}>
      <rect width={LIST.w} height={ROW_H} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <text x={14} y={22} fill={colors.TEXT} fontSize={13.5} fontWeight={700} fontFamily={mono}>
        {bug.id}
      </text>
      <text x={14} y={41} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        {bug.title}
      </text>
      <g transform={`translate(${LIST.w - 62}, ${ROW_H / 2}) scale(${0.8 + 0.2 * clamp01(pop)})`}>
        <rect x={-46} y={-12} width={92} height={24} rx={12} fill={colors.BG} stroke={statusColor} strokeWidth={1.4} />
        <text y={4} textAnchor="middle" fill={statusColor} fontSize={11} fontWeight={700} fontFamily={mono}>
          {status}
        </text>
      </g>
    </g>
  );
}

/** A panel of streaming mono lines (bug detail / patch diff). */
function LinePanel({
  x, y, w, h, title, lines, enter, lineU, dim,
}: {
  x: number; y: number; w: number; h: number; title: string;
  lines: { text: string; color: string }[];
  enter: number; lineU: number; dim: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.75 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
        {title}
      </text>
      {lines.map((line, i) => {
        const u = clamp01(lineU * lines.length - i);
        if (u <= 0) return null;
        const shown = Math.round(line.text.length * u);
        return (
          <text key={i} x={18} y={54 + i * 24} fill={line.color} fontSize={13} fontFamily={mono} opacity={0.4 + 0.6 * u}>
            {line.text.slice(0, shown)}
          </text>
        );
      })}
    </g>
  );
}

const PATCH_COLOR = { file: colors.TEXT, add: colors.POSITIVE, del: colors.NEGATIVE } as const;

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const fixedPop = clamp01(s.get(scene.fixedPop));
  const resolvedPop = clamp01(s.get(scene.resolvedPop));
  const ringU = clamp01(s.get(scene.ringU));
  const timer = s.get(scene.timerU);

  // bug #147's status chip, advanced by the beats
  const st147 = resolvedPop > 0 ? { text: 'resolved', color: colors.POSITIVE, pop: resolvedPop }
    : fixedPop > 0 ? { text: 'fixed', color: colors.WARM, pop: fixedPop }
    : { text: 'open', color: colors.NEGATIVE, pop: 1 };

  return (
    <>
      {/* agent · API · app — the loop's three parties */}
      <ServiceNode {...AGENT} kind="client" label="your agent" sublabel="runs the scripts" u={s.get(scene.agentU)} dim={dim} glow={clamp01(s.get(scene.patchU) - s.get(scene.markPktU)) * 0.4 * (1 - dim)} />
      <ServiceNode {...API} w={195} kind="external" label="Replay QA API" u={s.get(scene.apiU)} dim={dim} />
      <ServiceNode {...APP} kind="browser" label="your app" sublabel="patched build" u={s.get(scene.appU)} dim={dim} />

      {/* beat 0 — pull the open bugs */}
      <RequestFlow
        path={[
          { x: AGENT.x + 62, y: AGENT.y },
          { x: API.x - 78, y: API.y },
        ]}
        u={s.get(scene.pullU)}
        roundTrip
        color={colors.ACCENT}
        responseColor={colors.POSITIVE}
        label="GET /projects/:id/bugs?status=open"
        responseLabel="3 open bugs"
        opacity={1 - dim}
      />
      {BUGS.map((_, i) => (
        <BugRow
          key={i}
          i={i}
          u={s.get(scene.rowU[i])}
          status={i === 1 ? st147.text : i === 2 && s.get(scene.reopenU) > 0.3 ? 'reopened' : 'open'}
          statusColor={i === 1 ? st147.color : colors.NEGATIVE}
          pop={i === 1 ? st147.pop : 1}
          dim={dim}
        />
      ))}

      {/* beat 1 — the bug detail: the primary debugging source */}
      <LinePanel
        x={DETAIL.x}
        y={DETAIL.y}
        w={DETAIL.w}
        h={DETAIL.h}
        title="bug #147 — detail (GET /bugs/147)"
        lines={DETAIL_LINES.map((text) => ({ text, color: colors.TEXT }))}
        enter={s.get(scene.detailU)}
        lineU={s.get(scene.detailLineU)}
        dim={dim}
      />
      <Chip
        x={DETAIL.x + DETAIL.w / 2}
        y={DETAIL.y + DETAIL.h - 26}
        text="⌖ replay recording @ 41.2s"
        u={s.get(scene.recChipU) * (1 - 0.7 * dim)}
        color={colors.ACCENT}
      />

      {/* beat 2 — the patch, grouped by root cause */}
      <LinePanel
        x={PATCH.x}
        y={PATCH.y}
        w={PATCH.w}
        h={PATCH.h}
        title="the fix — in your codebase"
        lines={PATCH_LINES.map((l) => ({ text: l.text, color: PATCH_COLOR[l.kind] }))}
        enter={s.get(scene.patchU)}
        lineU={s.get(scene.patchLineU)}
        dim={dim}
      />
      <Chip x={PATCH.x + PATCH.w / 2} y={PATCH.y + PATCH.h - 22} text="grouped by root cause" u={s.get(scene.rootChipU) * (1 - 0.7 * dim)} color={colors.SECONDARY} />

      {/* beat 3 — one PATCH marks it fixed */}
      <Packet
        from={{ x: AGENT.x + 62, y: AGENT.y + 22 }}
        to={{ x: API.x - 60, y: API.y + 24 }}
        u={s.get(scene.markPktU)}
        color={colors.WARM}
        label="PATCH /bugs/147 { status: 'fixed' }"
      />
      <Chip x={API.x} y={API.y + 62} text="statuses: fixed · wontfix · invalid · reopened" u={s.get(scene.statusesU) * (1 - 0.7 * dim)} color={colors.MUTED} />

      {/* beat 4 — the retry schedules itself (journey-retry.ts) */}
      {s.get(scene.retryChipU) > 0 && (
        <g opacity={(1 - dim) * clamp01(s.get(scene.retryChipU))}>
          <TimerArc cx={API.x + 96} cy={API.y - 30} r={16} u={timer} color={colors.TEAL} />
          <Chip x={API.x + 230} y={API.y - 30} text="journey-retry.ts — auto" u={1} color={colors.TEAL} />
        </g>
      )}

      {/* beat 5 — the journey re-runs against the patched app */}
      <RequestFlow
        path={[
          { x: API.x + 78, y: API.y },
          { x: APP.x - 66, y: APP.y },
        ]}
        u={s.get(scene.rerunU)}
        roundTrip
        color={colors.TEAL}
        responseColor={colors.POSITIVE}
        label="test run — journey retry"
        responseLabel="fix verified"
        opacity={1 - dim}
      />
      <Chip
        x={LIST.x + LIST.w / 2}
        y={LIST.y + 34 + 3 * (ROW_H + ROW_GAP) + 16}
        text="a regression flips it back → reopened"
        u={s.get(scene.reopenU) * (1 - 0.7 * dim)}
        color={colors.NEGATIVE}
      />

      {/* the closer: a scrim settles, and the repair loop remains */}
      {dim > 0 && <rect width={1280} height={720} fill={colors.BG} opacity={0.82 * dim} />}
      {ringU > 0 && (
        <g>
          <LoopRing {...RING} stops={STOPS} u={s.get(scene.orbitU)} reveal={ringU} color={colors.WARM} />
          <g opacity={clamp01(s.get(scene.ringLabelU))}>
            <text x={RING.cx} y={RING.cy - 8} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700} fontFamily={mono}>
              the repair loop
            </text>
            <text x={RING.cx} y={RING.cy + 20} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              until no open bugs remain
            </text>
          </g>
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/replay-qa/chapter-3', beat: i }
export const vizScene = () => scene;
