// The Pattern You Already Built
//
// Chapter 1 of the sync-insights proposal (internal, Replay team). The
// anatomy of ReactPerformanceInsights (replayio/backend#13053): a Replay
// recording carries React's internal timeline; correlations attribute renders
// to their state-management triggers; the MCP tool turns evidence into
// findings with severity, impact, receipts, and real recommendations.
// Centerpiece: a finding ASSEMBLING ITSELF from the recording — the commit
// strip persists all chapter, one heavy commit explodes into a dispatch chip
// + 269 component dots + 82 selectors, and correlation lines feed a finding
// card row by row (real numbers from the PR body).
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The recording strip — 130 commits, 5 heavy (>16ms). All data seeded.
// ---------------------------------------------------------------------------

const STRIP = { x0: 90, x1: 1190, y: 168 } as const;
const N_COMMITS = 120; // illustrative
const HEAVY = new Set([17, 44, 63, 88, 112]);
const FOCUS = 63; // the pause/paused commit we zoom into

const rand = mulberry32(13053);

interface CommitTick {
  x: number;
  h: number;
  heavy: boolean;
}

const COMMITS: CommitTick[] = Array.from({ length: N_COMMITS }, (_, i) => ({
  x: STRIP.x0 + (i * (STRIP.x1 - STRIP.x0)) / (N_COMMITS - 1),
  h: HEAVY.has(i) ? 46 + rand() * 12 : 6 + rand() * 20,
  heavy: HEAVY.has(i),
}));

const FOCUS_X = COMMITS[FOCUS].x;

// ---------------------------------------------------------------------------
// The evidence field — the dispatch chip, 269 component dots, 82 selectors.
// ---------------------------------------------------------------------------

const CHIP = { x: 340, y: 292, w: 220, h: 36 } as const;

const DOT_FIELD = { x0: 130, y0: 348, x1: 552, y1: 578 } as const;
const N_DOTS = 240; // illustrative
const DOT_COLS = 23;
const NOT_WASTED = 137; // the single render that actually changed the DOM

interface Dot {
  x: number;
  y: number;
  order: number; // 0..1 cascade order
}

const DOTS: Dot[] = Array.from({ length: N_DOTS }, (_, k) => {
  const i = k % DOT_COLS;
  const j = Math.floor(k / DOT_COLS);
  const dx = (DOT_FIELD.x1 - DOT_FIELD.x0) / (DOT_COLS - 1);
  const dy = (DOT_FIELD.y1 - DOT_FIELD.y0) / (Math.ceil(N_DOTS / DOT_COLS) - 1);
  return {
    x: DOT_FIELD.x0 + i * dx + (rand() - 0.5) * dx * 0.4,
    y: DOT_FIELD.y0 + j * dy + (rand() - 0.5) * dy * 0.4,
    order: rand(),
  };
});

/** Correlation lines: the dispatch chip fans out to a sample of dots. */
const CORR_TARGETS: number[] = Array.from({ length: 22 }, () =>
  Math.floor(rand() * N_DOTS),
);

const SELECTORS = { x0: 130, x1: 552, y: 602, n: 90 } as const; // illustrative
const SEL_CHANGED = new Set([9, 31, 52, 74]); // 4 of 82 returned new values

// ---------------------------------------------------------------------------
// The finding card — rows appear as the evidence that backs them lands.
// ---------------------------------------------------------------------------

const CARD = { x: 610, y: 268, w: 588, h: 344 } as const;

interface CardRow {
  text: string;
  color: string;
  size: number;
}

const CARD_ROWS: CardRow[] = [
  { text: '🟡 Expensive Redux dispatch: player/update', color: colors.TEXT, size: 16 },
  { text: 'category: expensive-state-updates · severity: warning', color: colors.MUTED, size: 12 },
  { text: 'impact: ~3 dropped frames — visible jank', color: colors.WARM, size: 13 },
  { text: '42ms total = 12ms dispatch + 30ms render', color: colors.TEXT, size: 13 },
  { text: '240 components · 239 wasted renders (~100% waste)', color: colors.NEGATIVE, size: 13 },
  { text: '90 selector evaluations → 4 changed, 86 unchanged', color: colors.TEXT, size: 13 },
  { text: 'navigate to: point 10384593717662262675036164455399426', color: colors.ACCENT, size: 11 },
  { text: 'fix: React.memo() — Toolbar, Timeline, CommentsOverlay', color: colors.POSITIVE, size: 12 },
  { text: 'fix: createSelector — 78 selectors ran for nothing', color: colors.POSITIVE, size: 12 },
];
const ROW_Y0 = CARD.y + 40;
const ROW_DY = 33;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_STRIP: CameraState = { x: 640, y: 200, k: 1.45 };
const CAM_EVIDENCE: CameraState = { x: 360, y: 430, k: 1.3 };
const CAM_CARD: CameraState = { x: 900, y: 430, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stripU: ChannelRef<number>;
  phaseU: ChannelRef<number>;
  heavyU: ChannelRef<number>;
  chipU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  dotsU: ChannelRef<number>;
  corrU: ChannelRef<number>;
  wasteU: ChannelRef<number>;
  selU: ChannelRef<number>;
  selChangedU: ChannelRef<number>;
  cardU: ChannelRef<number>;
  cardRows: ChannelRef<number>;
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stripU = tl.channel('stripU', 0); // commit ticks cascade in
  const phaseU = tl.channel('phaseU', 0); // render/commit/effects chips
  const heavyU = tl.channel('heavyU', 0); // the 5 heavy commits light up
  const chipU = tl.channel('chipU', 0); // the dispatch chip
  const dropU = tl.channel('dropU', 0); // strip → chip drop line
  const dotsU = tl.channel('dotsU', 0); // 269 component dots cascade
  const corrU = tl.channel('corrU', 0); // correlation lines fan out
  const wasteU = tl.channel('wasteU', 0); // dots flip to "wasted" red
  const selU = tl.channel('selU', 0); // 82 selector cells
  const selChangedU = tl.channel('selChangedU', 0); // the 4 that changed
  const cardU = tl.channel('cardU', 0); // the finding card frame
  const cardRows = tl.channel('cardRows', 0); // rows 0..9, staged
  const endDim = tl.channel('endDim', 0); // fade evidence for the close
  const endU = tl.channel('endU', 0); // the pattern payoff

  // — Beat 1 · the address —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'This is about the React performance tool we just shipped. Not to explain it — to steal its shape.',
  });
  tl.tween(stripU, 0.25, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the recording carries React's timeline —
  tl.caption({
    at: 7.0,
    dur: 7,
    text: "A Replay recording already carries React's whole internal timeline. Every commit, every render, every phase, laid down as evidence.",
  });
  tl.tween(cam, CAM_STRIP, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: 7.6, dur: 3.2, ease: ease.draw });
  tl.tween(phaseU, 1, { at: 11.2, dur: 0.8, ease: ease.enter });
  tl.hold(14.0, 0.6);

  // — Beat 3 · 130 commits, 5 heavy —
  tl.caption({
    at: 14.6,
    dur: 6.5,
    text: 'Picture a typical recording: over a hundred commits, and a handful heavy enough to blow a frame budget.',
  });
  tl.tween(heavyU, 1, { at: 15.4, dur: 1.6, ease: ease.pop });
  tl.hold(21.1, 0.6);

  // — Beat 4 · zoom into one dispatch —
  tl.caption({
    at: 21.7,
    dur: 7,
    text: 'Zoom into one. A single Redux dispatch, and the fallout: two hundred forty components re-rendered.',
  });
  tl.tween(cam, CAM_EVIDENCE, { at: 21.9, dur: 1.5, ease: ease.move });
  tl.tween(dropU, 1, { at: 22.4, dur: 0.9, ease: ease.draw });
  tl.tween(chipU, 1, { at: 23.2, dur: 0.6, ease: ease.enter });
  tl.tween(dotsU, 1, { at: 24.0, dur: 3.4, ease: ease.draw });
  tl.hold(28.7, 0.5);

  // — Beat 5 · correlation is the insight —
  tl.caption({
    at: 29.2,
    dur: 7.5,
    text: 'The correlation layer is what makes this an insight instead of a flame graph. The dispatch is attributed as the cause of every one of those renders.',
  });
  tl.tween(corrU, 1, { at: 30.0, dur: 2.2, ease: ease.draw });
  tl.hold(36.7, 0.5);

  // — Beat 6 · the waste —
  tl.caption({
    at: 37.2,
    dur: 8,
    text: 'And the numbers are brutal: forty-two milliseconds, and all but one of those renders changed nothing on screen. Nearly one hundred percent waste.',
  });
  tl.tween(wasteU, 1, { at: 38.0, dur: 2.0, ease: ease.move });
  tl.tween(cardU, 1, { at: 40.6, dur: 0.8, ease: ease.enter });
  tl.tween(cardRows, 5, { at: 41.4, dur: 2.4, ease: ease.enter });
  tl.hold(45.2, 0.5);

  // — Beat 7 · 82 selectors, 4 changed —
  tl.caption({
    at: 45.7,
    dur: 7,
    text: 'Ninety selectors ran. Four returned new values. The rest were pure overhead, and the tool can say so with receipts.',
  });
  tl.tween(selU, 1, { at: 46.4, dur: 1.8, ease: ease.draw });
  tl.tween(selChangedU, 1, { at: 48.6, dur: 0.8, ease: ease.pop });
  tl.tween(cardRows, 6, { at: 50.0, dur: 0.6, ease: ease.enter });
  tl.hold(52.7, 0.5);

  // — Beat 8 · the finding assembles —
  tl.caption({
    at: 53.2,
    dur: 7,
    text: 'So the finding assembles itself: severity, impact, the components that paid for it, and a point link straight into the recording.',
  });
  tl.tween(cam, CAM_CARD, { at: 53.4, dur: 1.5, ease: ease.move });
  tl.tween(cardRows, 7, { at: 55.4, dur: 0.7, ease: ease.enter });
  tl.hold(60.2, 0.5);

  // — Beat 9 · recommendations —
  tl.caption({
    at: 60.7,
    dur: 6.5,
    text: 'Plus the part that makes it useful: real recommendations. Memoize here, split this selector, and roughly what it saves.',
  });
  tl.tween(cardRows, 9, { at: 61.5, dur: 1.4, ease: ease.enter });
  tl.hold(67.2, 0.5);

  // — Beat 10 · the pattern —
  tl.caption({
    at: 67.7,
    dur: 8,
    text: "That's the pattern. Recorded internals, a correlation layer, and an AI that turns evidence into findings. Hold onto that shape.",
  });
  tl.tween(cam, CAM_WIDE, { at: 67.9, dur: 1.6, ease: ease.move });
  tl.tween(endDim, 1, { at: 68.4, dur: 1.2, ease: ease.move });
  tl.tween(endU, 1, { at: 70.0, dur: 1.0, ease: ease.enter });
  tl.hold(75.7, 1.5);

  return {
    tl,
    cam,
    stripU,
    phaseU,
    heavyU,
    chipU,
    dropU,
    dotsU,
    corrU,
    wasteU,
    selU,
    selChangedU,
    cardU,
    cardRows,
    endDim,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stripU = s.get(scene.stripU);
  const phaseU = s.get(scene.phaseU);
  const heavyU = s.get(scene.heavyU);
  const chipU = s.get(scene.chipU);
  const dropU = s.get(scene.dropU);
  const dotsU = s.get(scene.dotsU);
  const corrU = s.get(scene.corrU);
  const wasteU = s.get(scene.wasteU);
  const selU = s.get(scene.selU);
  const selChangedU = s.get(scene.selChangedU);
  const cardU = s.get(scene.cardU);
  const cardRows = s.get(scene.cardRows);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const dim = 1 - endDim * 0.88; // evidence fades to 0.12 for the close
  const nRows = Math.ceil(N_DOTS / DOT_COLS);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dim}>
          {/* the recording strip */}
          <g opacity={Math.min(1, stripU * 4)}>
            <line x1={STRIP.x0 - 16} y1={STRIP.y} x2={STRIP.x1 + 16} y2={STRIP.y} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={STRIP.x0} y={STRIP.y - 66} fill={colors.MUTED} fontSize={14} fontStyle="italic">
              one Replay recording
            </text>
            <g opacity={heavyU}>
              <text x={STRIP.x1} y={STRIP.y - 66} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                120 commits · 5 heavy (&gt;16ms)
              </text>
            </g>
          </g>
          {COMMITS.map((c, i) => {
            const u = clamp01(stripU * N_COMMITS * 1.15 - i);
            const hot = c.heavy ? heavyU : 0;
            return (
              <rect
                key={i}
                x={c.x - 2.4}
                y={STRIP.y - c.h * u}
                width={4.8}
                height={Math.max(0.5, c.h * u)}
                fill={c.heavy ? colors.WARM : colors.ACCENT}
                opacity={u * (c.heavy ? 0.35 + 0.65 * hot : 0.55)}
              />
            );
          })}
          {/* phase chips: React phase timings ride along with every commit */}
          <g opacity={phaseU}>
            {(['render', 'commit', 'effects'] as const).map((p, i) => (
              <g key={p}>
                <rect x={504 + i * 96} y={STRIP.y + 18} width={86} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={547 + i * 96} y={STRIP.y + 33} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  {p}
                </text>
              </g>
            ))}
          </g>

          {/* drop line: the heavy commit spills its evidence downward */}
          <g opacity={dropU}>
            <path
              d={`M${FOCUS_X} ${STRIP.y + 6} C ${FOCUS_X} ${STRIP.y + 60}, ${CHIP.x} ${CHIP.y - 70}, ${CHIP.x} ${CHIP.y - CHIP.h / 2}`}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={1.6}
              strokeDasharray="5 4"
              opacity={0.7 * dropU}
            />
          </g>

          {/* the dispatch chip */}
          <g opacity={chipU}>
            <rect x={CHIP.x - CHIP.w / 2} y={CHIP.y - CHIP.h / 2} width={CHIP.w} height={CHIP.h} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={CHIP.x} y={CHIP.y + 5} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
              redux: player/update
            </text>
            <g opacity={wasteU}>
              <text x={CHIP.x + CHIP.w / 2 + 14} y={CHIP.y + 5} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>
                42ms
              </text>
            </g>
          </g>

          {/* correlation lines: dispatch → renders (the attribution layer) */}
          {CORR_TARGETS.map((k, i) => {
            const u = clamp01(corrU * (CORR_TARGETS.length + 4) * 0.28 - i * 0.28);
            const d = DOTS[k];
            if (u <= 0) return null;
            const x = CHIP.x + (d.x - CHIP.x) * u;
            const y = CHIP.y + CHIP.h / 2 + (d.y - CHIP.y - CHIP.h / 2) * u;
            return (
              <line
                key={i}
                x1={CHIP.x}
                y1={CHIP.y + CHIP.h / 2}
                x2={x}
                y2={y}
                stroke={colors.SECONDARY}
                strokeWidth={1}
                opacity={0.35}
              />
            );
          })}

          {/* 240 component dots — flip to "wasted" red, one stays green */}
          {DOTS.map((d, k) => {
            const row = Math.floor(k / DOT_COLS);
            const appear = clamp01(dotsU * (nRows + 2) - row);
            const waste = clamp01(wasteU * 1.6 - d.order * 0.6);
            const wasted = k !== NOT_WASTED;
            const color =
              waste > 0.02 ? (wasted ? colors.NEGATIVE : colors.POSITIVE) : colors.MUTED;
            return (
              <circle
                key={k}
                cx={d.x}
                cy={d.y}
                r={3 + 1.6 * waste * (wasted ? 1 : 2)}
                fill={color}
                opacity={appear * (0.3 + 0.55 * Math.max(waste, corrU * 0.4))}
              />
            );
          })}
          <g opacity={dotsU}>
            <text x={(DOT_FIELD.x0 + DOT_FIELD.x1) / 2} y={DOT_FIELD.y0 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              240 components re-rendered
            </text>
          </g>
          <g opacity={wasteU}>
            <text x={DOT_FIELD.x1 + 10} y={DOT_FIELD.y1 - 4} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} textAnchor="start">
              239 wasted
            </text>
            <text x={DOT_FIELD.x1 + 10} y={DOT_FIELD.y1 + 14} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO} textAnchor="start">
              1 real
            </text>
          </g>

          {/* 90 selector cells, 4 changed */}
          {Array.from({ length: SELECTORS.n }, (_, i) => {
            const u = clamp01(selU * (SELECTORS.n + 8) * 0.14 - i * 0.14);
            const changed = SEL_CHANGED.has(i);
            const hot = changed ? selChangedU : 0;
            const w = (SELECTORS.x1 - SELECTORS.x0) / SELECTORS.n;
            return (
              <rect
                key={i}
                x={SELECTORS.x0 + i * w}
                y={SELECTORS.y - 4 - hot * 3}
                width={w - 1.4}
                height={8 + hot * 6}
                rx={1.5}
                fill={changed ? colors.POSITIVE : colors.MUTED}
                opacity={u * (changed ? 0.4 + 0.6 * hot : 0.4)}
              />
            );
          })}
          <g opacity={selU}>
            <text x={SELECTORS.x0} y={SELECTORS.y - 12} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              90 selector evaluations
            </text>
            <g opacity={selChangedU}>
              <text x={SELECTORS.x1} y={SELECTORS.y - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>
                4 changed
              </text>
            </g>
          </g>

          {/* the finding card — his exact markdown shape */}
          <g opacity={cardU}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={CARD.x + 22} y={CARD.y + 24} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              finding · ReactPerformanceInsights
            </text>
            {CARD_ROWS.map((r, i) => {
              const u = clamp01(cardRows - i);
              return (
                <text
                  key={i}
                  x={CARD.x + 22}
                  y={ROW_Y0 + i * ROW_DY + (1 - u) * 8}
                  fill={r.color}
                  fontSize={r.size}
                  fontFamily={MONO}
                  opacity={u}
                >
                  {r.text}
                </text>
              );
            })}
          </g>
        </g>

        {/* the close: the shape of the pattern, over dimmed evidence */}
        <g opacity={endU}>
          <rect x={190} y={250} width={900} height={190} rx={16} fill={colors.BG} opacity={0.92} />
          <rect x={190} y={250} width={900} height={190} rx={16} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
          {['recorded internals', 'correlation layer', 'AI → findings'].map((t, i) => (
            <g key={t}>
              <rect x={238 + i * 288} y={306} width={232} height={54} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
              <text x={354 + i * 288} y={339} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                {t}
              </text>
              {i < 2 && (
                <text x={490 + i * 288} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={20}>
                  →
                </text>
              )}
            </g>
          ))}
          <text x={640} y={286} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            React Performance Insights · Replay
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            hold onto this shape
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
