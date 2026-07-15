// Freshness: re-crawling at the web's own pace
//
// Backing files (donnemartin/system-design-primer):
//   solutions/system_design/web_crawler/README.md — "Determining when to
//   update the crawl results": crawl results carry a `timestamp`; refresh
//   everything after about a week; mine the mean time before a page updates
//   to set per-page refresh; popular sites refresh sooner; Robots.txt gives
//   webmasters control of crawl frequency.
//
// The machine: a shelf of twelve pages, each card holding two swatches — the
// stored copy and the live page — plus a refresh timer. Week one runs the
// uniform weekly policy and the corners go wrong in both directions (stale
// news, wasted archive fetch). Then the crawl history is mined, every card
// gets its own clock, and week two lands fetches right where changes happen.
import { CAMERA_HOME, Timeline, colors, ease } from '../../core';
import { Camera, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TimerArc } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/* ---------------------------------------------------------------- */
/* The shelf: 12 pages, their change events, and their true rates.   */
/* ---------------------------------------------------------------- */

interface Card {
  url: string;
  /** change moments within one week, as fractions of the week */
  events: number[];
  /** the mined per-page refresh interval, in weeks (phase B) */
  ti: number;
  /** interval label shown once the clocks are personalized */
  tiLabel: string;
}

export const CARDS: Card[] = [
  { url: 'yahoo.com', events: [], ti: 0.55, tiLabel: '4 days', },
  { url: 'yahoo.com/news', events: [0.1, 0.22, 0.37, 0.55, 0.71, 0.88], ti: 0.15, tiLabel: '1 day' },
  { url: 'foo.com', events: [0.62], ti: 0.6, tiLabel: '4 days' },
  { url: 'bar.com', events: [], ti: 1, tiLabel: '1 week' },
  { url: 'baz.com', events: [], ti: 1, tiLabel: '1 week' },
  { url: 'yahoo.com/finance', events: [0.44], ti: 0.5, tiLabel: '3 days' },
  { url: 'dmoz.org', events: [], ti: 6, tiLabel: '6 weeks' },
  { url: 'yahoo.com/sports', events: [], ti: 1, tiLabel: '1 week' },
  { url: 'bar.com/shop', events: [0.3, 0.76], ti: 0.45, tiLabel: '3 days' },
  { url: 'foo.com/blog', events: [], ti: 1, tiLabel: '1 week' },
  { url: 'baz.com/wiki', events: [], ti: 1.5, tiLabel: '10 days' },
  { url: 'foo.com/docs', events: [], ti: 1.5, tiLabel: '10 days' },
];

const NEWS = 1; // yahoo.com/news — churns constantly
const ARCHIVE = 6; // dmoz.org — never changes
const ROBOTS = 10; // baz.com/wiki — robots file sets the pace
const TOTAL_CHANGES = CARDS.reduce((n, c) => n + c.events.length, 0); // 10
const UNCHANGED = CARDS.filter((c) => c.events.length === 0).length; // 8

const GRID = { x0: 400, y0: 202, dx: 180, dy: 152, w: 152, h: 106 };
const pos = (i: number) => ({ x: GRID.x0 + (i % 4) * GRID.dx, y: GRID.y0 + Math.floor(i / 4) * GRID.dy });

/** live-content color: each change flips the page to the next hue */
const HUES = [colors.TEAL, colors.WARM, colors.SECONDARY, colors.POSITIVE, colors.NEGATIVE, colors.ACCENT];
const hue = (changes: number) => HUES[changes % HUES.length];
const changesBy = (c: Card, t: number) => c.events.filter((e) => e <= t).length;

const CAM_NEWS: CameraState = { x: pos(NEWS).x + 76, y: pos(NEWS).y + 40, k: 2.0 };
const CAM_ARCHIVE: CameraState = { x: pos(ARCHIVE).x + 76, y: pos(ARCHIVE).y + 42, k: 1.8 };
const CAM_HIST: CameraState = { x: 650, y: 340, k: 1.28 };

const HIST = { x: 330, y: 222, w: 660, h: 226 };

/* ---------------------------------------------------------------- */
/* Timeline                                                          */
/* ---------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_NEWS, cameraInterp);
  const gridU = tl.channel('gridU', 0); // cards stagger in (0..12)
  const stampU = tl.channel('stampU', 0); // the `timestamp` chip on the hero card
  const timerU = tl.channel('timerU', 0); // refresh timers fade in
  const weekP = tl.channel('weekP', 0); // week one, uniform policy (0..1)
  const sweepU = tl.channel('sweepU', 0); // the weekly refresh sweep flash
  const missU = tl.channel('missU', 0); // missed-update ticks under the news card
  const wasteU = tl.channel('wasteU', 0); // the wasted-fetch marker on the archive
  const histU = tl.channel('histU', 0); // the mined-history panel
  const adaptT = tl.channel('adaptT', 0); // clocks become per-page
  const adaptP = tl.channel('adaptP', 0); // week two on personal clocks (0..1)
  const badgeU = tl.channel('badgeU', 0); // popular + robots chips
  const payU = tl.channel('payU', 0); // the before/after scoreboard

  // ---- beat 1: a copy starts rotting the moment you take it -------------
  tl.caption({
    at: 0.3,
    dur: 6.2,
    text: 'Crawling a page once buys you a snapshot. The moment you leave, the real page starts drifting away from your copy.',
  });
  tl.tween(gridU, 12, { at: 0.5, dur: 1.6, ease: ease.enter });
  tl.tween(stampU, 1, { at: 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(weekP, 0.15, { at: 1.8, dur: 4.6, ease: ease.linear });
  tl.caption({
    at: 7.1,
    dur: 6.0,
    text: "So every crawl result carries a timestamp, and the primer's default rule is blunt: after about a week, everything is due again.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.6, dur: 1.5, ease: ease.move });
  tl.tween(timerU, 1, { at: 9.2, dur: 0.9, ease: ease.enter });
  tl.hold(13.3, 0.4);

  // ---- beat 2: week one, in lockstep --------------------------------------
  tl.caption({
    at: 13.7,
    dur: 5.6,
    text: "Here's the whole shelf on that policy: every page gets the same one week timer, and the refresh sweep hits everything at once.",
  });
  tl.tween(weekP, 1, { at: 14.2, dur: 5.6, ease: ease.linear });
  tl.tween(sweepU, 1, { at: 19.9, dur: 0.5, ease: ease.pop });
  tl.tween(sweepU, 0, { at: 20.9, dur: 0.7, ease: ease.enter });
  tl.hold(20.6, 0.4);

  // ---- beat 3: wrong in both directions ------------------------------------
  tl.caption({
    at: 21.4,
    dur: 5.8,
    text: 'Now watch the corners. The news page changed six times this week — our copy was wrong for most of it.',
  });
  tl.tween(cam, CAM_NEWS, { at: 21.7, dur: 1.4, ease: ease.move });
  tl.tween(missU, 1, { at: 23.2, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 27.8,
    dur: 5.2,
    text: 'And the archive never changed at all. That refresh fetch bought us precisely nothing.',
  });
  tl.tween(cam, CAM_ARCHIVE, { at: 28.1, dur: 1.4, ease: ease.move });
  tl.tween(wasteU, 1, { at: 29.7, dur: 0.6, ease: ease.pop });
  tl.hold(33.0, 0.4);

  // ---- beat 4: mine the history ---------------------------------------------
  tl.caption({
    at: 33.4,
    dur: 6.4,
    text: "One schedule can't fit both. So mine the crawl history: for each page, measure the average time between the changes you've actually seen.",
  });
  tl.tween(cam, CAM_HIST, { at: 33.7, dur: 1.4, ease: ease.move });
  tl.tween(histU, 1, { at: 34.6, dur: 0.9, ease: ease.enter });
  tl.hold(39.8, 0.4);

  // ---- beat 5: a clock per page ----------------------------------------------
  tl.caption({
    at: 40.2,
    dur: 5.6,
    text: 'Then give every page its own clock. Pages that churn get short timers; pages that sleep get long ones.',
  });
  tl.tween(histU, 0, { at: 40.6, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 40.8, dur: 1.4, ease: ease.move });
  tl.tween(adaptT, 1, { at: 42.0, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 46.4,
    dur: 5.2,
    text: 'Popular sites earn faster refresh too, and a robots file lets a site set the pace itself.',
  });
  tl.tween(badgeU, 1, { at: 47.0, dur: 0.8, ease: ease.pop });
  tl.hold(51.8, 0.4);

  // ---- beat 6: week two, on personal clocks -----------------------------------
  tl.caption({
    at: 52.2,
    dur: 6.0,
    text: 'Run the next week on the new clocks. Fetches now land right where changes happen — and almost nowhere else.',
  });
  tl.tween(badgeU, 0.25, { at: 52.6, dur: 0.8, ease: ease.enter });
  tl.tween(adaptP, 1, { at: 53.0, dur: 8.5, ease: ease.linear });
  tl.caption({
    at: 59.0,
    dur: 6.2,
    text: 'Same crawl budget — four billion fetches a month — no longer spent evenly, but spent where the web is actually alive.',
  });
  tl.tween(payU, 1, { at: 61.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 65.8,
    dur: 5.4,
    text: 'Fresh copies, no wasted work. One chapter left: what breaks when we turn the volume all the way up?',
  });
  tl.hold(71.2, 1.2);

  return { tl, cam, gridU, stampU, timerU, weekP, sweepU, missU, wasteU, histU, adaptT, adaptP, badgeU, payU };
}

const scene = buildScene();

/* ---------------------------------------------------------------- */
/* Render                                                            */
/* ---------------------------------------------------------------- */

function renderFrame(s: SceneState) {
  const gridU = s.get(scene.gridU);
  const stampU = s.get(scene.stampU);
  const timerU = s.get(scene.timerU);
  const weekP = s.get(scene.weekP);
  const sweepU = s.get(scene.sweepU);
  const missU = s.get(scene.missU);
  const wasteU = s.get(scene.wasteU);
  const histU = s.get(scene.histU);
  const adaptT = s.get(scene.adaptT);
  const adaptP = s.get(scene.adaptP);
  const badgeU = s.get(scene.badgeU);
  const payU = s.get(scene.payU);

  const weekDone = weekP >= 0.999;

  return (
    <Camera {...s.get(scene.cam)}>
      <text x={92} y={96} fill={colors.TEXT} fontSize={19} opacity={clamp01(gridU / 3)}>
        the shelf — twelve crawled copies
      </text>
      <text x={92} y={120} fill={colors.MUTED} fontSize={13} opacity={clamp01(gridU / 3)}>
        left swatch: our stored copy · right swatch: the live page
      </text>

      {/* policy label */}
      <g opacity={timerU}>
        <text x={92} y={172} fill={colors.MUTED} fontSize={13.5}>
          refresh policy:
        </text>
        <text x={92} y={194} fill={adaptT > 0.5 ? colors.POSITIVE : colors.WARM} fontSize={14.5}>
          {adaptT > 0.5 ? 'per page — mean time between updates' : 'every page, once a week'}
        </text>
      </g>

      {/* ---------- the cards ---------- */}
      {CARDS.map((c, i) => {
        const p = pos(i);
        const u = clamp01(gridU - i * 0.6);
        if (u <= 0.002) return null;

        // week-one truth: live changes drift, the copy is from t=0 (until the sweep)
        const live1 = changesBy(c, weekP);
        const stored1 = weekDone || sweepU > 0.4 ? live1 : 0;
        // week-two truth: personal clocks; the copy refreshes every ti
        const lastFetch = adaptP > 0 ? Math.floor(adaptP / c.ti) * c.ti : 0;
        const total1 = c.events.length;
        const live2 = total1 + changesBy(c, adaptP);
        const stored2 = total1 + changesBy(c, Math.min(lastFetch, adaptP));

        const inB = adaptP > 0.001;
        const live = inB ? live2 : live1;
        const stored = inB ? stored2 : stored1;
        const stale = live !== stored;

        // timers: uniform week arc vs a personal arc
        const arcA = 1 - weekP;
        const phase = c.ti > 0 ? (inB ? (adaptP % c.ti) / c.ti : 0) : 0;
        const arcB = 1 - phase;
        const arc = lerp(arcA, arcB, adaptT);
        // fetch flash right when a personal clock wraps
        const fFlash = inB ? clamp01(1 - ((adaptP - lastFetch) / 0.035) * 1) * (lastFetch > 0 ? 1 : 0) : 0;
        const flash = Math.max(sweepU, fFlash);

        const border = stale ? colors.NEGATIVE : colors.POSITIVE;
        return (
          <g key={c.url} opacity={u}>
            {flash > 0.02 && (
              <rect x={p.x - 6} y={p.y - 6} width={GRID.w + 12} height={GRID.h + 12} rx={14} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} opacity={flash} />
            )}
            <rect x={p.x} y={p.y} width={GRID.w} height={GRID.h} rx={10} fill={colors.PANEL} stroke={border} strokeOpacity={0.75} strokeWidth={1.6} />
            <text x={p.x + 10} y={p.y + 20} fill={colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
              {c.url}
            </text>
            {/* stored vs live swatches */}
            <rect x={p.x + 14} y={p.y + 36} width={40} height={40} rx={7} fill={hue(stored)} opacity={0.85} />
            <rect x={p.x + 70} y={p.y + 36} width={40} height={40} rx={7} fill={hue(live)} opacity={0.85} />
            <text x={p.x + 34} y={p.y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              copy
            </text>
            <text x={p.x + 90} y={p.y + 92} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
              live
            </text>
            <g opacity={timerU}>
              <TimerArc cx={p.x + GRID.w - 22} cy={p.y + 52} r={13} u={clamp01(arc)} color={adaptT > 0.5 ? colors.POSITIVE : colors.WARM} />
              <text x={p.x + GRID.w - 22} y={p.y + 88} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} opacity={0.4 + adaptT * 0.6}>
                {adaptT > 0.5 ? c.tiLabel : '1 week'}
              </text>
            </g>
            {/* the timestamp chip on the hero card */}
            {i === NEWS && stampU > 0.002 && adaptT < 0.5 && (
              <g opacity={stampU * (1 - adaptT * 2)}>
                <rect x={p.x + 8} y={p.y - 26} width={136} height={20} rx={5} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.5} />
                <text x={p.x + 76} y={p.y - 12} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  timestamp: last crawl
                </text>
              </g>
            )}
            {/* missed updates under the news card */}
            {i === NEWS && missU > 0.002 && (
              <g opacity={missU * (1 - adaptT)}>
                {c.events.map((e, k) => (
                  <circle key={k} cx={p.x + 16 + k * 14} cy={p.y + GRID.h + 14} r={4} fill={colors.NEGATIVE} opacity={clamp01(missU * 6 - k)} />
                ))}
                <text x={p.x + 16 + 6 * 14 + 6} y={p.y + GRID.h + 18} fill={colors.NEGATIVE} fontSize={10.5}>
                  6 updates, 1 fetch
                </text>
              </g>
            )}
            {/* the wasted fetch on the archive */}
            {i === ARCHIVE && wasteU > 0.002 && (
              <g opacity={wasteU * (1 - adaptT)}>
                <text x={p.x + GRID.w / 2} y={p.y + GRID.h + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  ✗ fetched, nothing new
                </text>
              </g>
            )}
            {/* popular + robots chips (phase B) */}
            {i === NEWS && badgeU > 0.002 && (
              <g opacity={badgeU}>
                <rect x={p.x + 8} y={p.y - 26} width={136} height={20} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
                <text x={p.x + 76} y={p.y - 12} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
                  popular — refresh sooner
                </text>
              </g>
            )}
            {i === ROBOTS && badgeU > 0.002 && (
              <g opacity={badgeU}>
                <rect x={p.x + 8} y={p.y - 26} width={136} height={20} rx={5} fill={colors.PANEL} stroke={colors.TEAL} strokeOpacity={0.7} />
                <text x={p.x + 76} y={p.y - 12} textAnchor="middle" fill={colors.TEAL} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  robots.txt sets the pace
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ---------- the mined-history panel ---------- */}
      {histU > 0.002 && (
        <g opacity={histU}>
          <rect x={HIST.x} y={HIST.y} width={HIST.w} height={HIST.h} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={HIST.x + 24} y={HIST.y + 34} fill={colors.TEXT} fontSize={15}>
            crawl history — time between observed changes
          </text>
          {[CARDS[NEWS], CARDS[ARCHIVE]].map((c, r) => {
            const y = HIST.y + 84 + r * 74;
            return (
              <g key={c.url}>
                <text x={HIST.x + 24} y={y - 16} fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
                  {c.url}
                </text>
                <line x1={HIST.x + 24} y1={y} x2={HIST.x + HIST.w - 190} y2={y} stroke={colors.GRID} strokeWidth={1.5} />
                {c.events.map((e, k) => (
                  <line
                    key={k}
                    x1={HIST.x + 24 + e * (HIST.w - 214)}
                    y1={y - 9}
                    x2={HIST.x + 24 + e * (HIST.w - 214)}
                    y2={y + 9}
                    stroke={colors.WARM}
                    strokeWidth={2.5}
                    opacity={clamp01(histU * 8 - k)}
                  />
                ))}
                <text x={HIST.x + HIST.w - 174} y={y + 4} fill={c.events.length ? colors.WARM : colors.MUTED} fontSize={12}>
                  {c.events.length ? 'mean gap ≈ 1 day' : 'no changes — stretch it'}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* ---------- the before/after scoreboard ---------- */}
      {payU > 0.002 && (
        <g opacity={payU}>
          <rect x={72} y={228} width={236} height={128} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={92} y={258} fill={colors.TEXT} fontSize={13.5}>
            week one — one clock:
          </text>
          <text x={92} y={280} fill={colors.NEGATIVE} fontSize={12.5}>
            {UNCHANGED} wasted fetches · {TOTAL_CHANGES} late
          </text>
          <text x={92} y={314} fill={colors.TEXT} fontSize={13.5}>
            week two — their clocks:
          </text>
          <text x={92} y={336} fill={colors.POSITIVE} fontSize={12.5}>
            0 wasted · caught within a day
          </text>
        </g>
      )}
    </Camera>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
