// ch06-s01 — "Every run, a recording. Every bug, a root cause. Every fix, rerun to confirm."
// The reference's fanned photo collage, made of real product: four FROZEN product tiles at three depths (Insights stat
// tiles, the Test Runs table, the bug-react and bug-sync chips + titles), with the line woven between them on three
// rows: the 'every X' phrase in the left lane, its answer in the right lane on the same baseline. Each phrase blurs in
// on its spoken word with the warm colour sweep on its tail; on each 'Every' the tiles above that row lift toward
// camera. In the last half second a '▶ recording' chip drifts out of the runs tile toward the end card's lock-up
// (sets/ch06-s01-chip, continued by ch06-s02) and the collage blurs and sinks (DOM tiles via their own CSS filter).
import type { CSSProperties, ReactNode } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, SANS, easeInOut, easeOut } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { CROPS, MARKS, SLUG, type Crop, cropH } from '../sets/takes';
import { DriftChip, S01_DUR } from '../sets/ch06-s01-chip';
import { tw } from '../sets/ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- layout (stage px, before the push-in). Rows of words: baselines 230 / 400 / 570 (the script's 200 / 370 / 540
// moved 30 px down so the frame balances: the top band gets room for legible tiles, the paper under row 3 is not a void);
// tiles only in the bands between rows, never under or over a word.
const ROW = [230, 400, 570];
/** runs @ list 3668, tightened from the script's runsTableTop for legibility in a 420-px tile: the header row and four
 *  runs, Description · Environment (the purple PR #3 badges) · Status (✓ Completed); no Created / Bugs / Journeys
 *  columns, no tab strip, no chat column (harness layout, measured on stills) */
const RUNS_CROP: Crop = { x: 612, y: 104, w: 642, h: 218 };
const LANE = { left: 90, right: 700 };
const SIZE = 44;
const SIZE_BIG = 52;

interface TileDef {
  key: string;
  take: string;
  at: number;
  crop: Crop;
  x: number;
  y: number;
  w: number;
  /** settled tilt about y (deg) */
  tiltY: number;
  /** depth: scale at rest (0.96 back … 1 front) */
  depth: number;
  /** where it starts at t = 0 (offset px, extra tilt), continuing ch05-s05's fan */
  from: { dx: number; dy: number; tilt: number; fade: boolean };
  /** the drift apart across the shot (px) */
  drift: { x: number; y: number };
  label?: string;
}

const TILES: TileDef[] = [
  {
    key: 'A',
    take: 'insights',
    at: MARKS.insights.stats,
    crop: CROPS.insightsStats,
    x: 66,
    y: 108,
    w: 560,
    tiltY: 9,
    depth: 0.97,
    from: { dx: 120, dy: 40, tilt: 6, fade: true },
    drift: { x: -6, y: -3 },
    label: 'Insights',
  },
  {
    key: 'B',
    take: 'runs',
    at: MARKS.runs.list,
    crop: RUNS_CROP,
    x: 704,
    y: 46,
    w: 400,
    tiltY: -10,
    depth: 1,
    from: { dx: -110, dy: 50, tilt: -4, fade: true },
    drift: { x: 6, y: -3 },
  },
  {
    key: 'C',
    take: 'bug-react',
    at: MARKS['bug-react'].still,
    crop: CROPS.reactChipsTitle,
    x: 70,
    y: 266,
    w: 476,
    tiltY: 11,
    depth: 0.985,
    from: { dx: 60, dy: 0, tilt: 2, fade: false },
    drift: { x: -5, y: 2 },
    label: "Replay QA's own Projects page",
  },
  {
    key: 'D',
    take: 'bug-sync',
    at: MARKS['bug-sync'].report,
    crop: CROPS.syncChipsTitle,
    x: 690,
    y: 274,
    w: 490,
    tiltY: -11,
    depth: 0.99,
    from: { dx: -60, dy: 0, tilt: -2, fade: false },
    drift: { x: 5, y: 2 },
  },
];

type Phrase = { row: number; lane: 'left' | 'right'; words: { text: string; at: number }[]; size: number; hold?: boolean };

type Sc = {
  tl: Timeline;
  phrases: Phrase[];
  /** 'Every' ×3 (lifts) */
  every: number[];
  /** collage blur/sink starts (with the blur dissolve into ch06-s02, which begins half a second before the cut) */
  sinkAt: number;
  dur: number;
};

/** a lift pulse: rises over 0.28 s, eases back to a resting 30 % over 1.1 s */
function pulse(t: number, at: number) {
  if (t < at - 0.08) return 0;
  const up = easeOut(clamp((t - at + 0.08) / 0.28));
  const down = easeInOut(clamp((t - at - 0.3) / 1.1));
  return up * (1 - 0.7 * down);
}

function liftOf(key: string, t: number, sc: Sc) {
  const [e1, e2, e3] = sc.every;
  if (key === 'A') return pulse(t, e1);
  if (key === 'B') return Math.max(pulse(t, e1), pulse(t, e3));
  return pulse(t, e2);
}

/** collage sink 0..1 */
const sinkOf = (t: number, sc: Sc) => easeInOut(clamp((t - sc.sinkAt) / 0.95));
/** the slow 3 % push-in, centred on the stage */
const camOf = (t: number, sc: Sc) => 1 + 0.03 * easeInOut(clamp(t / sc.dur)) + 0.004 * clamp((t - sc.dur) / 0.5);

function Tile(p: { d: TileDef; t: number; sc: Sc }) {
  const { d, t, sc } = p;
  const settle = easeOut(clamp((t + 0.25) / 0.6)); // already most of the way at t = 0 (the fan finishes at 0.05)
  const appear = d.from.fade ? easeOut(clamp((t + 0.05) / 0.35)) : 1;
  const lift = liftOf(d.key, t, sc);
  const sink = sinkOf(t, sc);
  const span = clamp(t / sc.dur);
  const h = cropH(d.crop, d.w);
  const dx = d.from.dx * (1 - settle) + d.drift.x * span;
  const dy = d.from.dy * (1 - settle) + d.drift.y * span - 5 * lift + 46 * sink;
  const tilt = d.tiltY + d.from.tilt * (1 - settle);
  const k = d.depth * lerp(0.9, 1, settle) * (1 + 0.035 * lift) * (1 - 0.08 * sink);
  const blur = (1 - appear) * 8 + sink * 9;
  const cx = d.x + d.w / 2, cy = d.y + h / 2;
  const wrap: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1280,
    height: 720,
    transformOrigin: `${cx}px ${cy}px`,
    transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) perspective(1800px) rotateY(${tilt.toFixed(2)}deg) scale(${k.toFixed(4)})`,
    filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
    opacity: appear * (1 - 0.35 * sink),
    pointerEvents: 'none',
  };
  const lu = clamp((t - 0.05) / 0.45);
  return (
    <div style={wrap}>
      <RrwebScreen
        slug={SLUG}
        take={d.take}
        at={d.at}
        crop={d.crop}
        box={{ x: d.x, y: d.y, w: d.w }}
        chrome="none"
        radius={10}
        style={{
          boxShadow: `0 ${16 + 16 * lift}px ${44 + 34 * lift}px -16px rgba(40,10,60,${(0.3 + 0.14 * lift).toFixed(3)}), 0 6px 16px -8px rgba(40,10,60,.2), 0 0 0 1px rgba(20,18,22,.06)`,
        }}
      />
      {d.label && lu > 0 && (
        // a small tab on the card's top-left corner (above the card's edge, so the chips stay visible)
        <div
          style={{
            position: 'absolute',
            left: d.x + 10,
            top: d.y - 21,
            height: 21,
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,.92)',
            borderRadius: '7px 7px 0 0',
            font: `500 13px ${SANS}`,
            letterSpacing: '-0.15px',
            color: '#6f6976',
            opacity: easeOut(lu),
            whiteSpace: 'nowrap',
            boxShadow: '0 -3px 10px -6px rgba(40,10,60,.18)',
          }}
        >
          {d.label}
        </div>
      )}
    </div>
  );
}

/** one phrase: words blurring in; the warm sweep rides the tail as it lands, then settles to ink (unless hold) */
function PhraseText(p: { ph: Phrase; t: number; id: string; out: number }): ReactNode {
  const { ph, t } = p;
  const x0 = LANE[ph.lane];
  const y = ROW[ph.row];
  const sp = tw(' ', ph.size);
  const widths = ph.words.map((w) => tw(w.text, ph.size));
  const total = widths.reduce((s, w) => s + w, 0) + sp * (ph.words.length - 1);
  const last = ph.words[ph.words.length - 1].at;
  // warmth: up as the last word lands, back to ink over 0.9 s (held on the final phrase)
  const up = easeOut(clamp((t - last + 0.1) / 0.3));
  const down = ph.hold ? 0 : easeInOut(clamp((t - last - 0.45) / 0.9));
  const k = up * (1 - down);
  if (t < ph.words[0].at - 0.05) return null;
  let x = x0;
  const gid = `ch06s01-g-${p.id}`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={x0} y1={0} x2={x0 + total} y2={0}>
          <stop offset={0} stopColor={PROMO.ink} />
          <stop offset={clamp(0.8 - 0.42 * k)} stopColor={PROMO.ink} />
          <stop offset={clamp(0.93 - 0.36 * k)} stopColor={k > 0.01 ? mix(PROMO.ink, '#f3a87c', k) : PROMO.ink} />
          <stop offset={1} stopColor={k > 0.01 ? mix(PROMO.ink, '#f2793f', k) : PROMO.ink} />
        </linearGradient>
      </defs>
      {ph.words.map((w, i) => {
        const u = clamp((t - w.at + 0.06) / 0.36);
        const wx = x;
        x += widths[i] + sp;
        if (u <= 0) return null;
        const e = easeOut(u);
        const blur = (1 - e) * ph.size * 0.18 + p.out * 7;
        return (
          <text
            key={i}
            x={wx}
            y={y + (1 - e) * ph.size * 0.25}
            fill={`url(#${gid})`}
            opacity={e}
            style={{ font: `400 ${ph.size}px ${SANS}`, letterSpacing: `${(-0.022 * ph.size).toFixed(2)}px`, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}
          >
            {w.text}
          </text>
        );
      })}
    </g>
  );
}

function mix(a: string, b: string, k: number) {
  const p = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(k))).join(',')})`;
}

export default defineShot({
  id: 'ch06-s01',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    // held 1 s past the cut: the blur dissolve into ch06-s02 paints this shot until 0.5 s after its end, and the
    // sampled s.t (used by overlay/dom) is clamped to the timeline's duration
    tl.hold(0, T.duration + 1);
    const L = 'L0601';
    const w = (i: number) => T.word(L, i) - 0.08;
    // words: 0 Every 1 run 2 a 3 recording 4 Every 5 bug 6 a 7 root 8 cause 9 Every 10 fix 11 rerun 12 to 13 confirm
    const phrases: Phrase[] = [
      { row: 0, lane: 'left', size: SIZE, words: [{ text: 'every', at: w(0) }, { text: 'run', at: w(1) }] },
      { row: 0, lane: 'right', size: SIZE, words: [{ text: 'a', at: w(2) }, { text: 'recording', at: w(3) }] },
      { row: 1, lane: 'left', size: SIZE, words: [{ text: 'every', at: w(4) }, { text: 'bug', at: w(5) }] },
      { row: 1, lane: 'right', size: SIZE, words: [{ text: 'a', at: w(6) }, { text: 'root', at: w(7) }, { text: 'cause', at: w(8) }] },
      { row: 2, lane: 'left', size: SIZE, words: [{ text: 'every', at: w(9) }, { text: 'fix', at: w(10) }] },
      { row: 2, lane: 'right', size: SIZE_BIG, hold: true, words: [{ text: 'rerun', at: w(11) }, { text: 'to', at: w(12) }, { text: 'confirm', at: w(13) }] },
    ];
    const sc: Sc = {
      tl,
      phrases,
      every: [T.word(L, 0), T.word(L, 4), T.word(L, 9)],
      // the blur dissolve into ch06-s02 starts half a second before the cut; the collage starts sinking with it
      sinkAt: T.duration - 0.5,
      dur: T.duration,
    };
    return sc;
  },
  paint(f, _s, sc) {
    const c = f.c;
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    // the hairlines that have run under ch04/ch05, through the open bands
    driftLines(c, f.t + 31.2, { n: 3, color: '#a9a4ae', alpha: 0.3, speed: 1.2, seed: 3, y0: 60, y1: 680 });
  },
  overlay(s, sc) {
    const t = s.t;
    const cam = camOf(t, sc);
    const sink = sinkOf(t, sc);
    return (
      <g>
        <g transform={`translate(640 ${360 + 30 * sink}) scale(${(cam * (1 - 0.05 * sink)).toFixed(4)}) translate(-640 -360)`} opacity={1 - 0.4 * sink}>
          {sc.phrases.map((ph, i) => (
            <PhraseText key={i} id={String(i)} ph={ph} t={t} out={sink} />
          ))}
        </g>
        <DriftChip t2={t - S01_DUR} />
      </g>
    );
  },
  dom(s, sc) {
    const t = s.t;
    const cam = camOf(t, sc);
    // back to front: the two top tiles, then the two bug tiles
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transformOrigin: '640px 360px', transform: `scale(${cam.toFixed(4)})` }}>
        {TILES.map((d) => (
          <Tile key={d.key} d={d} t={t} sc={sc} />
        ))}
      </div>
    );
  },
});
