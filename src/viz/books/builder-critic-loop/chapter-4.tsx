// Book scene — builder-critic-loop, chapter 4: "The Spine That Verifies
// Itself". Five beats: per-task make verify targets stack up (0);
// self_check.sh sweeps them hunting green-washing escapes (1); the
// sensitivity harness plants a real escape and DEMANDS the checker go red
// (2); the targets funnel into make verify-all, the suite that gets stricter
// with every verified task (3); and the queue advances — 21/101, none on
// faith (4). (The chapter's recap step is diagram-only, not a beat here.)
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { ServiceNode, Connection } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

const TARGETS = { x: 60, y: 80, w: 330, h: 320 };
const TARGET_ROWS = [
  'verify-E0-T02  # verify spine',
  'verify-E0-T04  # ef replay digest',
  'verify-E0-T12  # ef bisect',
  'verify-E1-T07  # snapshots',
  'verify-E1-T08  # branch fork CoW',
  'verify-E1-T09  # fast-forward merge',
];

const SELFCHECK = { x: 560, y: 140 };
const ESCAPES = ['|| true', '; exit 0', '.skip', 'continue-on-error'];

const PLANT = { x: 440, y: 330, w: 330, h: 96 };

const SUITE = { x: 850, y: 90, w: 370, h: 200 };
const QUEUEBAR = { x: 850, y: 420, w: 370 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const targetsU = tl.channel('targetsU', 0);
  const rowsU = tl.channel('rowsU', 0);

  const checkU = tl.channel('checkU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const escapesU = tl.channel('escapesU', 0);

  const plantU = tl.channel('plantU', 0);
  const plantRedU = tl.channel('plantRedU', 0);

  const suiteU = tl.channel('suiteU', 0);
  const connTS = tl.channel('connTS', 0);
  const fillU = tl.channel('fillU', 0);
  const stricterU = tl.channel('stricterU', 0);

  const queueU = tl.channel('queueU', 0);
  const tickU = tl.channel('tickU', 0);
  const unlockU = tl.channel('unlockU', 0);

  // BEAT 0 — acceptance criteria as make targets with real exit codes
  tl.caption({ at: 0.4, dur: 4.5, text: 'Every task’s acceptance criteria: make verify-E⟨n⟩-T⟨nn⟩, real exit codes.' });
  tl.tween(targetsU, 1, { at: 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 1.4, dur: 2.4, ease: ease.linear });
  tl.hold(4.6, 0.8);

  // BEAT 1 — self_check.sh: verify the verifier, no green-washing escapes
  tl.caption({ at: 5.8, dur: 4.5, text: 'self_check.sh audits the auditors — no || true, no swallowed failures.' });
  tl.tween(checkU, 1, { at: 6.0, dur: 0.6, ease: ease.enter });
  tl.tween(sweepU, 1, { at: 6.8, dur: 1.8, ease: ease.linear });
  tl.tween(escapesU, 1, { at: 8.4, dur: 1.4, ease: ease.linear });
  tl.hold(10.8, 0.8);

  // BEAT 2 — sensitivity: plant an escape, demand the checker goes red
  tl.caption({ at: 12.0, dur: 4.5, text: 'Sensitivity probes plant a real escape — self_check MUST go red.' });
  tl.tween(plantU, 1, { at: 12.2, dur: 0.8, ease: ease.enter });
  tl.tween(plantRedU, 1, { at: 13.8, dur: 0.5, ease: ease.pop });
  tl.hold(16.4, 0.8);

  // BEAT 3 — verify-all: promoted checks compose; the wall gets taller
  tl.caption({ at: 17.6, dur: 4.5, text: 'make verify-all: every verified task deposits its checks — stricter each lap.' });
  tl.tween(suiteU, 1, { at: 17.8, dur: 0.7, ease: ease.enter });
  tl.tween(connTS, 1, { at: 18.4, dur: 1.1, ease: ease.draw });
  tl.tween(fillU, 1, { at: 19.6, dur: 1.8, ease: ease.linear });
  tl.tween(stricterU, 1, { at: 21.4, dur: 0.6, ease: ease.enter });
  tl.hold(22.4, 0.8);

  // BEAT 4 — the queue advances: 21/101, none on faith
  tl.caption({ at: 23.6, dur: 5.0, text: 'verified → build_queue.py regenerates the queue; the next task unlocks.' });
  tl.tween(queueU, 1, { at: 23.8, dur: 0.7, ease: ease.enter });
  tl.tween(tickU, 1, { at: 24.8, dur: 1.0, ease: ease.move });
  tl.tween(unlockU, 1, { at: 26.2, dur: 0.6, ease: ease.pop });
  tl.hold(28.8, 1.4);

  return {
    tl,
    targetsU,
    rowsU,
    checkU,
    sweepU,
    escapesU,
    plantU,
    plantRedU,
    suiteU,
    connTS,
    fillU,
    stricterU,
    queueU,
    tickU,
    unlockU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

function TargetsPanel({ u, rows, sweep }: { u: number; rows: number; sweep: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = TARGETS;
  const sw = clamp01(sweep);
  const sweepY = 44 + sw * (h - 64);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={13}>
        Makefile — per-task verify targets
      </text>
      {TARGET_ROWS.map((row, i) => {
        const ru = clamp01(rows * TARGET_ROWS.length - i);
        if (ru <= 0) return null;
        return (
          <text key={i} x={18} y={58 + i * 26} fontSize={12} fontFamily={mono} fill={colors.TEXT} opacity={ru}>
            <tspan fill={colors.POSITIVE}>make </tspan>
            {row}
          </text>
        );
      })}
      <text x={18} y={58 + TARGET_ROWS.length * 26 + 6} fontSize={12} fontFamily={mono} fill={colors.MUTED} opacity={clamp01(rows * 7 - 6)}>
        make verify-list  # target → task map
      </text>
      {sw > 0 && sw < 1 && (
        <g>
          <rect x={8} y={40} width={w - 16} height={sweepY - 40} rx={6} fill={colors.ACCENT} opacity={0.06} />
          <line x1={8} y1={sweepY} x2={w - 8} y2={sweepY} stroke={colors.ACCENT} strokeWidth={2} opacity={0.85} />
        </g>
      )}
    </g>
  );
}

function EscapeHunt({ u }: { u: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const x = SELFCHECK.x - 90;
  const y = SELFCHECK.y + 66;
  return (
    <g opacity={e}>
      <text x={x} y={y - 8} fontSize={11.5} fill={colors.MUTED}>
        hunted escapes (any hit fails the build):
      </text>
      {ESCAPES.map((esc, i) => {
        const eu = clamp01(e * ESCAPES.length - i);
        if (eu <= 0) return null;
        const ex = x + (i % 2) * 120;
        const ey = y + 14 + Math.floor(i / 2) * 26;
        return (
          <g key={esc} opacity={eu}>
            <text x={ex} y={ey + 12} fontSize={12} fontFamily={mono} fill={colors.NEGATIVE}>
              {esc}
            </text>
            <line x1={ex - 2} y1={ey + 8} x2={ex + esc.length * 7.3} y2={ey + 8} stroke={colors.NEGATIVE} strokeWidth={1.4} />
          </g>
        );
      })}
    </g>
  );
}

function PlantPanel({ u, red }: { u: number; red: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = PLANT;
  const r = clamp01(red);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={r > 0 ? colors.NEGATIVE : colors.GRID} strokeWidth={1.5} />
      <text x={16} y={26} fill={colors.MUTED} fontSize={12.5}>
        self_check_sensitivity.sh — fixture repo
      </text>
      <text x={16} y={52} fontSize={12} fontFamily={mono} fill={colors.TEXT}>
        plant: <tspan fill={colors.WARM}>pnpm lint || true</tspan> → run self_check
      </text>
      {r > 0 && (
        <text x={16} y={78} fontSize={12.5} fontFamily={mono} fill={colors.NEGATIVE} fontWeight={700} opacity={r}>
          sensitivity make-semicolon-terminator: EXPECTED-FAIL OK ✓
        </text>
      )}
    </g>
  );
}

function SuitePanel({ u, fill, stricter }: { u: number; fill: number; stricter: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = SUITE;
  const f = clamp01(fill);
  const bricks = 24;
  const perRow = 8;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={13}>
        make verify-all — the standing regression suite
      </text>
      {Array.from({ length: bricks }, (_, i) => {
        const bu = clamp01(f * bricks - i);
        if (bu <= 0) return null;
        const bx = 18 + (i % perRow) * 42;
        const by = h - 34 - Math.floor(i / perRow) * 30;
        return <rect key={i} x={bx} y={by} width={36} height={24} rx={5} fill={colors.POSITIVE} opacity={0.22 + 0.5 * bu} stroke={colors.POSITIVE} strokeWidth={1} />;
      })}
      {stricter > 0 && (
        <text x={w - 18} y={52} textAnchor="end" fontSize={12} fill={colors.WARM} fontWeight={700} opacity={clamp01(stricter)}>
          every verified task adds a brick
        </text>
      )}
    </g>
  );
}

function QueueProgress({ u, tick, unlock }: { u: number; tick: number; unlock: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w } = QUEUEBAR;
  const done = 21 + clamp01(tick); // 21 → 22 as E1-T09 verifies
  const frac = done / 101;
  return (
    <g opacity={e}>
      <text x={x} y={y - 12} fontSize={13} fill={colors.MUTED}>
        QUEUE.md — regenerated by build_queue.py
      </text>
      <rect x={x} y={y} width={w} height={18} rx={9} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
      <rect x={x} y={y} width={w * frac} height={18} rx={9} fill={colors.POSITIVE} opacity={0.75} />
      <text x={x + w} y={y + 40} textAnchor="end" fontSize={13.5} fontFamily={mono} fill={colors.TEXT}>
        {Math.round(done)} / 101 verified
      </text>
      {unlock > 0 && (
        <g transform={`translate(${x}, ${y + 60})`} opacity={clamp01(unlock)}>
          <rect x={-6} y={-14} width={286} height={28} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
          <text x={137} y={5} textAnchor="middle" fontSize={12} fontFamily={mono} fill={colors.ACCENT} fontWeight={700}>
            unlocked → E1-T10 three-way merge
          </text>
        </g>
      )}
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  return (
    <>
      <TargetsPanel u={s.get(scene.targetsU)} rows={s.get(scene.rowsU)} sweep={s.get(scene.sweepU)} />
      <ServiceNode {...SELFCHECK} kind="fn" label="self_check.sh" sublabel="verify the verifier" u={s.get(scene.checkU)} />
      <Connection
        from={{ x: SELFCHECK.x - 60, y: SELFCHECK.y }}
        to={{ x: TARGETS.x + TARGETS.w + 6, y: SELFCHECK.y }}
        u={s.get(scene.checkU)}
        label="audits"
      />
      <EscapeHunt u={s.get(scene.escapesU)} />
      <PlantPanel u={s.get(scene.plantU)} red={s.get(scene.plantRedU)} />
      <SuitePanel u={s.get(scene.suiteU)} fill={s.get(scene.fillU)} stricter={s.get(scene.stricterU)} />
      <Connection
        from={{ x: TARGETS.x + TARGETS.w, y: TARGETS.y + 60 }}
        to={{ x: SUITE.x - 6, y: SUITE.y + 60 }}
        u={s.get(scene.connTS)}
        label="promoted checks"
      />
      <QueueProgress u={s.get(scene.queueU)} tick={s.get(scene.tickU)} unlock={s.get(scene.unlockU)} />
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/builder-critic-loop/chapter-4', beat: i }
export const vizScene = () => scene;
