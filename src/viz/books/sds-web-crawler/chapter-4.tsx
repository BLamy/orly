// Freshness: re-crawled by popularity
//
// Backed by: solutions/system_design/web_crawler/README.md — "Determining when
// to update the crawl results": crawl results carry a `timestamp`, all pages
// refresh after a default period (say one week), popular / frequently updated
// sites refresh in shorter intervals, data-mine the mean time before a page
// updates to set the re-crawl rate, "count changes the same as new pages",
// and Robots.txt gives webmasters control of crawl frequency. Constraints: 1B
// links, ~weekly refresh, 4B crawled per month. The machine: a grid of stored
// copies that dims as it ages; a week clock sweeps a blunt refresh wave; the
// popular top rows visibly rot fastest between sweeps; then per-row timers
// (rank-aware) and a change-rate vs interval plot (the mined rhythm).
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const fract = (v: number): number => v - Math.floor(v);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The stored copies — rows sorted by popularity, top row hottest.
// ---------------------------------------------------------------------------

const COLS = 8;
const ROWS = 5;
const GRID = { x0: 120, y0: 168, dx: 70, dy: 88 } as const;
/** How often each row's real pages change (per week) — top row is popular. */
const RATE = [0.92, 0.66, 0.46, 0.3, 0.16];
/** Rank-aware re-crawl interval per row, in weeks (top row soonest). */
const INTERVAL = [0.24, 0.4, 0.58, 0.78, 1.0];
const cellX = (c: number): number => GRID.x0 + c * GRID.dx;
const cellY = (r: number): number => GRID.y0 + r * GRID.dy;
const cellR = (r: number): number => 10 - r * 0.9;

// the mined-rhythm plot (right side)
const PLOT = { x0: 790, y0: 560, x1: 1180, y1: 300 } as const;
const plotX = (c: number): number => PLOT.x0 + 30 + c * (PLOT.x1 - PLOT.x0 - 50);
const plotY = (v: number): number => PLOT.y0 - v * (PLOT.y0 - PLOT.y1);
/** ideal: interval ∝ 1 / change-rate, clamped to [0.18, 1] weeks */
const ideal = (c: number): number => Math.max(0.18, Math.min(1, 0.16 / c));
const CURVE: string = Array.from({ length: 60 }, (_, i) => {
  const c = 0.1 + (i / 59) * 0.9;
  return `${i ? 'L' : 'M'}${plotX(c).toFixed(1)} ${plotY(ideal(c)).toFixed(1)}`;
}).join('');

const CAM_CELL: CameraState = { x: 260, y: 280, k: 1.55 };
const CAM_TOP: CameraState = { x: 400, y: 220, k: 1.3 };
const CAM_PLOT: CameraState = { x: 960, y: 420, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gridU: ChannelRef<number>;
  wkA: ChannelRef<number>;
  stampU: ChannelRef<number>;
  statsU: ChannelRef<number>;
  modeU: ChannelRef<number>;
  wkB: ChannelRef<number>;
  plotU: ChannelRef<number>;
  fitU: ChannelRef<number>;
  noteU: ChannelRef<number>;
  robotsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0); // stored copies reveal
  const wkA = tl.channel('wkA', 0); // weekly-policy clock, in weeks
  const stampU = tl.channel('stampU', 0); // the timestamp inspection chip
  const statsU = tl.channel('statsU', 0); // 4B/month scale chips
  const modeU = tl.channel('modeU', 0); // 0 blunt weekly · 1 rank-aware
  const wkB = tl.channel('wkB', 0); // rank-aware clock
  const plotU = tl.channel('plotU', 0); // mined-rhythm plot reveal
  const fitU = tl.channel('fitU', 0); // dots: flat week → matched curve
  const noteU = tl.channel('noteU', 0); // "changes count as new pages"
  const robotsU = tl.channel('robotsU', 0); // robots.txt cap chip
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · staleness —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'A crawled page starts going stale the moment you store it. The web keeps editing itself; your copy just sits there.',
  });
  tl.tween(gridU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(wkA, 3, { at: 1.2, dur: 39, ease: ease.linear });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the timestamp —
  tl.caption({
    at: 7.5,
    dur: 6,
    text: 'Every entry in crawled links carries a timestamp: the last time the crawler saw this page. Age is measurable, so freshness can be a policy.',
  });
  tl.tween(cam, CAM_CELL, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(stampU, 1, { at: 8.6, dur: 0.7, ease: ease.enter });
  tl.hold(13.1, 0.4);

  // — Beat 3 · the blunt policy —
  tl.caption({
    at: 13.6,
    dur: 6.5,
    text: 'The baseline policy is blunt: after a default period, say one week, every page is due again, and its link goes back onto the frontier.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.8, dur: 1.5, ease: ease.move });
  tl.tween(stampU, 0, { at: 14.0, dur: 0.8, ease: ease.move });
  tl.hold(20.1, 0.4);

  // — Beat 4 · the scale of routine —
  tl.caption({
    at: 20.6,
    dur: 6,
    text: 'At this scale even routine is enormous. A billion links refreshed about weekly means four billion fetches a month, most of them revisits.',
  });
  tl.tween(statsU, 1, { at: 21.2, dur: 0.8, ease: ease.pop });
  tl.hold(26.6, 0.4);

  // — Beat 5 · unequal aging —
  tl.caption({
    at: 27.1,
    dur: 6.5,
    text: 'But pages do not age at the same speed, and the popular ones are exactly where a stale copy hurts the most searches.',
  });
  tl.tween(cam, CAM_TOP, { at: 27.3, dur: 1.5, ease: ease.move });
  tl.tween(statsU, 0, { at: 27.5, dur: 1.0, ease: ease.move });
  tl.hold(33.6, 0.4);

  // — Beat 6 · rank-aware refresh —
  tl.caption({
    at: 34.1,
    dur: 6,
    text: 'So the refresh loop becomes rank aware: popular sites come due in shorter intervals, quiet ones can wait out the full week.',
  });
  tl.tween(modeU, 1, { at: 34.8, dur: 1.6, ease: ease.move });
  tl.tween(wkB, 1.8, { at: 34.8, dur: 38, ease: ease.linear });
  tl.hold(40.1, 0.4);

  // — Beat 7 · mine the rhythm —
  tl.caption({
    at: 40.6,
    dur: 6.5,
    text: 'You can go further with a little data mining: measure the mean time between changes for each page, and re crawl on that rhythm.',
  });
  tl.tween(cam, CAM_PLOT, { at: 40.8, dur: 1.5, ease: ease.move });
  tl.tween(plotU, 1, { at: 41.5, dur: 1.4, ease: ease.draw });
  tl.hold(47.1, 0.4);

  // — Beat 8 · match the pace —
  tl.caption({
    at: 47.6,
    dur: 5.5,
    text: "Match the interval to the page's own pace of change: frequent movers get frequent visits, sleepy archives get a weekly nod.",
  });
  tl.tween(fitU, 1, { at: 48.2, dur: 1.8, ease: ease.move });
  tl.hold(53.1, 0.4);

  // — Beat 9 · the honest simplification —
  tl.caption({
    at: 53.6,
    dur: 5,
    text: 'One simplification keeps the bookkeeping honest: a changed page is simply counted as a new page.',
  });
  tl.tween(noteU, 1, { at: 54.2, dur: 0.7, ease: ease.enter });
  tl.hold(58.6, 0.4);

  // — Beat 10 · the owner's say —
  tl.caption({
    at: 59.1,
    dur: 5.5,
    text: 'And the site owner still gets a say: the robots file can cap how often the crawler comes back, no matter what the math wants.',
  });
  tl.tween(robotsU, 1, { at: 59.7, dur: 0.7, ease: ease.enter });
  tl.hold(64.6, 0.4);

  // — Beat 11 · close —
  tl.caption({
    at: 65.1,
    dur: 6.5,
    text: 'Freshness is just the frontier again, fed by clocks instead of links. The loop never runs dry; it only changes what it is hungry for.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 65.3, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 65.7, dur: 1.4, ease: ease.move });
  tl.hold(71.6, 1.4);

  return { tl, cam, gridU, wkA, stampU, statsU, modeU, wkB, plotU, fitU, noteU, robotsU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const wkA = s.get(scene.wkA);
  const stampU = s.get(scene.stampU);
  const statsU = s.get(scene.statsU);
  const modeU = s.get(scene.modeU);
  const wkB = s.get(scene.wkB);
  const plotU = s.get(scene.plotU);
  const fitU = s.get(scene.fitU);
  const noteU = s.get(scene.noteU);
  const robotsU = s.get(scene.robotsU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const clockU = modeU < 0.5 ? 1 - fract(wkA) : 1 - fract(wkB / 1); // the week dial

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the stored copies ---- */}
          <text x={GRID.x0 - 20} y={104} fill={colors.TEXT} fontSize={15} opacity={gridU}>
            your stored copies
          </text>
          <text x={GRID.x0 - 20} y={124} fill={colors.MUTED} fontSize={12} fontStyle="italic" opacity={gridU}>
            each dot one page · rows ranked by popularity · brightness = freshness
          </text>
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const appear = clamp01(gridU * 1.7 - (r * COLS + c) / (ROWS * COLS) * 0.7);
              // weekly policy: everyone ages together, refresh wave sweeps by column
              const ageA = fract(wkA - c * 0.014);
              // rank-aware: each row on its own clock
              const ageB = fract((wkB + c * 0.03) / INTERVAL[r]);
              const fresh = 1 - 0.82 * lerp(ageA, ageB, modeU);
              // how badly the real page has drifted since our last visit (red rim)
              const rim = clamp01(lerp(ageA, ageB * INTERVAL[r], modeU) * RATE[r] * 1.7);
              return (
                <g key={`${r}-${c}`} opacity={appear}>
                  <circle
                    cx={cellX(c)}
                    cy={cellY(r)}
                    r={cellR(r) + 4}
                    fill="none"
                    stroke={colors.NEGATIVE}
                    strokeWidth={2}
                    opacity={rim * 0.75}
                  />
                  <circle
                    cx={cellX(c)}
                    cy={cellY(r)}
                    r={cellR(r)}
                    fill={colors.ACCENT}
                    opacity={0.12 + 0.83 * fresh}
                  />
                </g>
              );
            }),
          )}
          {/* row labels + rank-aware per-row timers */}
          {Array.from({ length: ROWS }, (_, r) => (
            <g key={`row${r}`}>
              <text x={GRID.x0 - 34} y={cellY(r) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} opacity={gridU * 0.9}>
                {r === 0 ? 'popular' : r === ROWS - 1 ? 'quiet' : ''}
              </text>
              <g opacity={modeU * gridU}>
                <TimerArc cx={cellX(COLS - 1) + 54} cy={cellY(r)} r={11} u={1 - fract((wkB + 0.001) / INTERVAL[r])} color={colors.POSITIVE} width={2.5} />
              </g>
            </g>
          ))}

          {/* the week clock */}
          <g opacity={gridU}>
            <TimerArc cx={776} cy={150} r={40} u={clockU} color={colors.WARM} width={5} />
            <text x={776} y={155} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
              {modeU < 0.5 ? 'one week' : 'per rank'}
            </text>
          </g>

          {/* the timestamp inspection */}
          <g opacity={stampU}>
            <rect x={cellX(1) + 20} y={cellY(1) - 64} width={210} height={46} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={cellX(1) + 34} y={cellY(1) - 45} fill={colors.WARM} fontSize={12} fontFamily="ui-monospace, monospace">
              timestamp
            </text>
            <text x={cellX(1) + 34} y={cellY(1) - 27} fill={colors.MUTED} fontSize={11.5}>
              last crawled: 6 days ago — due soon
            </text>
            <line x1={cellX(1) + 30} y1={cellY(1) - 18} x2={cellX(1) + 6} y2={cellY(1) - 8} stroke={colors.WARM} strokeWidth={1.2} />
          </g>

          {/* scale chips */}
          <g opacity={statsU}>
            <rect x={720} y={230} width={230} height={30} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={835} y={250} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5}>
              4 billion fetches / month
            </text>
            <rect x={960} y={230} width={180} height={30} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={1050} y={250} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
              refresh ≈ weekly
            </text>
          </g>

          {/* ---- the mined rhythm ---- */}
          <g opacity={plotU}>
            <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x1} y2={PLOT.y0} stroke={colors.GRID} strokeWidth={1.4} />
            <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y1 - 16} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              how often the page changes →
            </text>
            <text x={PLOT.x0 - 10} y={PLOT.y1 - 26} fill={colors.MUTED} fontSize={11.5}>
              re-crawl interval
            </text>
            <text x={PLOT.x1} y={PLOT.y1 - 26} textAnchor="end" fill={colors.SECONDARY} fontSize={11} fontStyle="italic">
              mean time before update
            </text>
            <path d={CURVE} fill="none" stroke={colors.SECONDARY} strokeWidth={2} opacity={0.35 + 0.65 * fitU} strokeDasharray={fitU > 0.98 ? undefined : '5 5'} />
            {RATE.map((c, r) => {
              const y = lerp(plotY(1), plotY(ideal(c)), fitU);
              return (
                <g key={r}>
                  <circle cx={plotX(c)} cy={y} r={7 - r * 0.6} fill={colors.ACCENT} opacity={0.9} />
                </g>
              );
            })}
            <text x={plotX(RATE[0]) - 6} y={lerp(plotY(1), plotY(ideal(RATE[0])), fitU) - 14} fill={colors.MUTED} fontSize={10.5}>
              popular
            </text>
          </g>

          {/* the honest simplification + the owner's cap */}
          <g opacity={noteU}>
            <rect x={790} y={90} width={330} height={34} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={955} y={112} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
              a changed page counts as a new page
            </text>
          </g>
          <g opacity={robotsU}>
            <rect x={790} y={132} width={330} height={34} rx={9} fill={colors.PANEL} stroke={colors.WARM} />
            <text x={955} y={154} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="ui-monospace, monospace">
              robots.txt · crawl frequency cap
            </text>
          </g>
        </g>

        {/* quiet close */}
        <g opacity={closeU}>
          <rect x={320} y={240} width={640} height={180} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            freshness = the frontier, fed by clocks
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
            weekly by default · sooner for the popular · tuned to each page&apos;s rhythm
          </text>
          <text x={640} y={386} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            four billion fetches a month, most of them just keeping copies honest
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
