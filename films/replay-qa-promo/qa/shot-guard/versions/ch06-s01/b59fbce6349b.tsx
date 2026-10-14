// ch06-s01 — "Every run, a recording. Every bug, a root cause. Every fix, rerun to confirm."
// The reference's fanned photo collage, made of real product: four FROZEN product tiles at three depths (Insights stat
// tiles, the Test Runs table, the bug-react and bug-sync chips + titles), with the line woven between them on three
// rows: the 'every X' phrase in the left lane, its answer in the right lane on the same baseline. Each phrase blurs in
// on its spoken word with the warm colour sweep on its tail; on each 'Every' the tiles of that row's pair lift toward
// camera while the others rack out of focus (row 1: Insights + runs, row 2: the two bugs, row 3: runs again).
// On 'recording' the '▶ recording' chip pops onto the runs tile's first PR #3 row and rides it; on 'cause' a red-pink
// hairline runs under the recorded title's 'with checkpoint never advancing past -1'; on 'confirm' a green glow sweeps
// down the runs tile's '✓ Completed' cells. In the last half second the same chip drifts out toward the end card's
// lock-up (sets/ch06-s01-chip, continued by ch06-s02) and the collage blurs and sinks (DOM tiles via their own filter).
import type { CSSProperties, ReactNode } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, SANS, easeInOut, easeOut } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { CROPS, MARKS, SLUG, type Crop, cropH, recToStage } from '../sets/takes';
import { DriftChip, FROM, PARK_SCALE, S01_DUR, T0 } from '../sets/ch06-s01-chip';
import { tw } from '../sets/ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- layout (stage px, before the push-in). Three rows of words, evenly pitched (192 px), and the tiles only in the
// bands between them, with >= 36 px of paper between any tile edge (incl. its rotateZ corner) and a word's cap top or
// descender; the band between rows 2 and 3 stays open paper so row 3 never reads as the bug-sync tile's caption.
const ROW = [230, 422, 614];
/** runs @ list 3668, tightened from the script's runsTableTop for legibility in a 380-px tile: the header row and four
 *  runs, Description · Environment (the purple PR #3 badges) · Status (✓ Completed); no Created / Bugs / Journeys
 *  columns, no tab strip, no chat column (harness layout, measured on stills) */
const RUNS_CROP: Crop = { x: 612, y: 104, w: 642, h: 218 };
/** recording-px rows of that crop as the harness lays it out (measured on stills): the first PR #3 row and the
 *  '✓ Completed' status cells (rows 1, 2 and 4; row 3 is Cancelled) */
const RUNS_ROW1_Y = 160;
const RUNS_DESC_END_X = 712;
const STATUS = { x0: 1121, x1: 1229, h: 22, rows: [160, 206, 297] };
/** bug-sync @ 1603: the recorded title's second line 'with checkpoint never advancing past -1' (recording px) */
const SYNC_LINE2 = { x0: 535, x1: 980, y: 180 };
const LANE = { left: 90, right: 700 };
const SIZE = 44;
const SIZE_BIG = 52;

interface TileDef {
  key: 'A' | 'B' | 'C' | 'D';
  take: string;
  at: number;
  crop: Crop;
  x: number;
  y: number;
  w: number;
  /** settled tilt about y (deg) */
  tiltY: number;
  /** settled roll (deg): the collage's hand-laid look */
  rz: number;
  /** depth: scale at rest (0.93 back … 1 front); tiles below 0.97 carry a 0.6 px depth blur when not in focus */
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
    y: 92,
    w: 560,
    tiltY: 9,
    rz: -1.2,
    depth: 0.93,
    from: { dx: 120, dy: 40, tilt: 6, fade: true },
    drift: { x: -6, y: -3 },
    label: 'Insights',
  },
  {
    key: 'B',
    take: 'runs',
    at: MARKS.runs.list,
    crop: RUNS_CROP,
    x: 712,
    y: 28,
    w: 380,
    tiltY: -10,
    rz: 1,
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
    y: 280,
    w: 450,
    tiltY: 11,
    rz: 0.8,
    depth: 0.96,
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
    y: 286,
    w: 490,
    tiltY: -11,
    rz: -1,
    depth: 0.985,
    from: { dx: -60, dy: 0, tilt: -2, fade: false },
    drift: { x: 5, y: 2 },
  },
];
const TILE_B = TILES[1];

type Phrase = { row: number; lane: 'left' | 'right'; words: { text: string; at: number }[]; size: number; hold?: boolean };

type Sc = {
  tl: Timeline;
  phrases: Phrase[];
  /** 'Every' ×3 (lifts + rack focus) */
  every: number[];
  /** the chip pops onto the runs tile on 'recording' */
  parkAt: number;
  /** the hairline under the sync title on 'cause' */
  causeAt: number;
  /** the green sweep down the Completed cells on 'confirm' */
  confirmAt: number;
  /** collage blur/sink starts (with the blur dissolve into ch06-s02, which begins half a second before the cut) */
  sinkAt: number;
  dur: number;
};

/** each step's pair: the tiles that lift and stay sharp while the others rack out */
const PAIRS: TileDef['key'][][] = [['A', 'B'], ['C', 'D'], ['B']];

/** a lift pulse: rises over 0.28 s, eases back to a resting 30 % over 1.1 s */
function pulse(t: number, at: number) {
  if (t < at - 0.08) return 0;
  const up = easeOut(clamp((t - at + 0.08) / 0.28));
  const down = easeInOut(clamp((t - at - 0.3) / 1.1));
  return up * (1 - 0.7 * down);
}

/** a focus window: in over 0.15 s from just before the step, held, out by about 0.9 s after it */
function focusWin(t: number, at: number) {
  return easeOut(clamp((t - at + 0.1) / 0.15)) * (1 - easeInOut(clamp((t - at - 0.6) / 0.3)));
}

function liftOf(key: string, t: number, sc: Sc) {
  let v = 0;
  sc.every.forEach((at, i) => {
    if (PAIRS[i].includes(key as TileDef['key'])) v = Math.max(v, pulse(t, at));
  });
  return v;
}

function focusOf(key: string, t: number, sc: Sc) {
  let on = 0, off = 0;
  sc.every.forEach((at, i) => {
    const w = focusWin(t, at);
    if (PAIRS[i].includes(key as TileDef['key'])) on = Math.max(on, w);
    else off = Math.max(off, w);
  });
  return { on, off };
}

/** collage sink 0..1 */
const sinkOf = (t: number, sc: Sc) => easeInOut(clamp((t - sc.sinkAt) / 0.95));
/** the slow 3 % push-in, centred on the stage */
const camOf = (t: number, sc: Sc) => 1 + 0.03 * easeInOut(clamp(t / sc.dur)) + 0.004 * clamp((t - sc.dur) / 0.5);

/** a tile's whole state at t (shared by the DOM tile and the chip that rides tile B) */
function tileState(d: TileDef, t: number, sc: Sc) {
  const settle = easeOut(clamp((t + 0.25) / 0.6)); // already most of the way at t = 0 (the fan finishes at 0.05)
  // the first frame after the hard cut is already a legible collage: 70 % and nearly sharp, full by 0.15 s
  const appear = d.from.fade ? 0.7 + 0.3 * easeOut(clamp(t / 0.15)) : 1;
  const lift = liftOf(d.key, t, sc);
  const sink = sinkOf(t, sc);
  const foc = focusOf(d.key, t, sc);
  const span = clamp(t / sc.dur);
  const h = cropH(d.crop, d.w);
  const dx = d.from.dx * (1 - settle) + d.drift.x * span;
  const dy = d.from.dy * (1 - settle) + d.drift.y * span - 12 * lift + 46 * sink;
  const tilt = d.tiltY + d.from.tilt * (1 - settle);
  const k = d.depth * lerp(0.9, 1, settle) * (1 + 0.06 * lift) * (1 - 0.08 * sink);
  const back = d.depth < 0.97 ? 0.6 : 0;
  const blur = (1 - appear) * 5 + sink * 9 + Math.max(back * (1 - foc.on), 1.2 * foc.off);
  const opacity = appear * (1 - 0.35 * sink) * (1 - 0.2 * foc.off);
  return { dx, dy, tilt, k, blur, opacity, lift, cx: d.x + d.w / 2, cy: d.y + h / 2, h };
}

/** where a stage point laid out on tile d lands at t: the tile's CSS transform (origin at its centre:
 *  translate · perspective(1800) · rotateY · rotateZ · scale), then the camera push-in */
function onTile(d: TileDef, t: number, sc: Sc, p: { x: number; y: number }) {
  const s = tileState(d, t, sc);
  let x = (p.x - s.cx) * s.k, y = (p.y - s.cy) * s.k;
  const a = (d.rz * Math.PI) / 180;
  [x, y] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const b = (s.tilt * Math.PI) / 180;
  const z = -x * Math.sin(b);
  x *= Math.cos(b);
  const w = 1 - z / 1800;
  x = x / w + s.cx + s.dx;
  y = y / w + s.cy + s.dy;
  const cam = camOf(t, sc);
  return { x: 640 + (x - 640) * cam, y: 360 + (y - 360) * cam };
}

/** the parked chip's anchor on tile B (stage px before transforms): just right of row 1's 'PR #3: PR #3' */
function chipAnchor() {
  const box = { x: TILE_B.x, y: TILE_B.y, w: TILE_B.w };
  const left = recToStage(TILE_B.crop, box, { x: RUNS_DESC_END_X, y: RUNS_ROW1_Y });
  const w = (tw('▶ recording', 12, 600, true) + 22) * PARK_SCALE;
  return { x: left.x + 8 + w / 2, y: left.y };
}

function Tile(p: { d: TileDef; t: number; sc: Sc }) {
  const { d, t, sc } = p;
  const s = tileState(d, t, sc);
  const box = { x: d.x, y: d.y, w: d.w };
  const wrap: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1280,
    height: 720,
    transformOrigin: `${s.cx}px ${s.cy}px`,
    transform: `translate(${s.dx.toFixed(2)}px, ${s.dy.toFixed(2)}px) perspective(1800px) rotateY(${s.tilt.toFixed(2)}deg) rotateZ(${d.rz}deg) scale(${s.k.toFixed(4)})`,
    filter: s.blur > 0.15 ? `blur(${s.blur.toFixed(2)}px)` : undefined,
    opacity: s.opacity,
    pointerEvents: 'none',
  };
  const lu = clamp((t - 0.05) / 0.45);
  const lift = s.lift;
  return (
    <div style={wrap}>
      <RrwebScreen
        slug={SLUG}
        take={d.take}
        at={d.at}
        crop={d.crop}
        box={box}
        chrome="none"
        radius={10}
        style={{
          boxShadow: `0 ${16 + 22 * lift}px ${44 + 50 * lift}px -16px rgba(40,10,60,${(0.3 + 0.24 * lift).toFixed(3)}), 0 ${6 + 6 * lift}px ${16 + 10 * lift}px -8px rgba(40,10,60,${(0.2 + 0.1 * lift).toFixed(3)}), 0 0 0 1px rgba(20,18,22,.06)`,
        }}
      />
      {d.label && lu > 0 && (
        // a small tab on the card's top-RIGHT corner (above the card's edge, clear of the left lane's words)
        <div
          style={{
            position: 'absolute',
            right: 1280 - (d.x + d.w - 10),
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
      {d.key === 'D' && <CauseLine t={t} sc={sc} box={box} crop={d.crop} />}
      {d.key === 'B' && <ConfirmSweep t={t} sc={sc} box={box} crop={d.crop} />}
    </div>
  );
}

/** on 'cause': a thin red-pink hairline drawn left → right under the recorded title's second line (already on screen) */
function CauseLine(p: { t: number; sc: Sc; box: { x: number; y: number; w: number }; crop: Crop }) {
  const u = easeInOut(clamp((p.t - p.sc.causeAt) / 0.45));
  if (u <= 0) return null;
  const a = recToStage(p.crop, p.box, { x: SYNC_LINE2.x0, y: SYNC_LINE2.y });
  const b = recToStage(p.crop, p.box, { x: SYNC_LINE2.x1, y: SYNC_LINE2.y });
  return (
    <div
      style={{
        position: 'absolute',
        left: a.x,
        top: a.y - 0.8,
        width: (b.x - a.x) * u,
        height: 1.6,
        borderRadius: 1,
        background: PROMO.brand,
        boxShadow: '0 0 5px rgba(244,28,82,.35)',
      }}
    />
  );
}

/** on 'confirm': a soft green band sweeps down the Status column (0.4 s) and each '✓ Completed' cell glows as it passes */
function ConfirmSweep(p: { t: number; sc: Sc; box: { x: number; y: number; w: number }; crop: Crop }) {
  const t0 = p.sc.confirmAt - 0.06;
  if (p.t < t0) return null;
  const top = recToStage(p.crop, p.box, { x: STATUS.x0, y: p.crop.y + 30 });
  const bot = recToStage(p.crop, p.box, { x: STATUS.x1, y: p.crop.y + p.crop.h });
  const sweep = clamp((p.t - t0) / 0.4);
  const bandY = lerp(top.y - 10, bot.y, easeInOut(sweep));
  const bandA = Math.sin(Math.PI * sweep);
  const green = '31,157,99';
  return (
    <>
      {bandA > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: top.x - 4,
            top: bandY - 14,
            width: bot.x - top.x + 8,
            height: 28,
            borderRadius: 8,
            background: `linear-gradient(180deg, rgba(${green},0) 0%, rgba(${green},${(0.22 * bandA).toFixed(3)}) 50%, rgba(${green},0) 100%)`,
          }}
        />
      )}
      {STATUS.rows.map((ry) => {
        const c = recToStage(p.crop, p.box, { x: STATUS.x0, y: ry });
        const e = recToStage(p.crop, p.box, { x: STATUS.x1, y: ry });
        const at = t0 + 0.4 * clamp((ry - STATUS.rows[0]) / (p.crop.y + p.crop.h - STATUS.rows[0]));
        const up = easeOut(clamp((p.t - at) / 0.14));
        const g = up * (1 - 0.4 * easeInOut(clamp((p.t - at - 0.2) / 0.5)));
        if (g <= 0.01) return null;
        const h = (STATUS.h * p.box.w) / p.crop.w;
        return (
          <div
            key={ry}
            style={{
              position: 'absolute',
              left: c.x - 2,
              top: c.y - h / 2,
              width: e.x - c.x + 4,
              height: h,
              borderRadius: h / 2,
              background: `rgba(${green},${(0.14 * g).toFixed(3)})`,
              boxShadow: `0 0 ${(12 * g).toFixed(1)}px ${(2 * g).toFixed(1)}px rgba(${green},${(0.45 * g).toFixed(3)})`,
            }}
          />
        );
      })}
    </>
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
      parkAt: w(3),
      causeAt: w(8),
      confirmAt: T.word(L, 13),
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
    void sc;
  },
  overlay(s, sc) {
    const t = s.t;
    const cam = camOf(t, sc);
    const sink = sinkOf(t, sc);
    // the '▶ recording' chip: pops onto the runs tile on 'recording' and rides it (its transform + the push-in);
    // the small offset makes it end exactly at the shared FROM when it departs, so it is one object into ch06-s02
    const t2 = t - S01_DUR;
    let park: { x: number; y: number; u: number; k: number } | null = null;
    if (t >= sc.parkAt) {
      const anchor = chipAnchor();
      const tD = S01_DUR + T0;
      const at = onTile(TILE_B, Math.min(t, tD), sc, anchor);
      const end = onTile(TILE_B, tD, sc, anchor);
      const u = clamp((t - sc.parkAt) / 0.18);
      park = { x: at.x + FROM.x - end.x, y: at.y + FROM.y - end.y, u, k: PARK_SCALE * (0.86 + 0.14 * easeOut(u)) };
    }
    return (
      <g>
        <g transform={`translate(640 ${360 + 30 * sink}) scale(${(cam * (1 - 0.05 * sink)).toFixed(4)}) translate(-640 -360)`} opacity={1 - 0.4 * sink}>
          {sc.phrases.map((ph, i) => (
            <PhraseText key={i} id={String(i)} ph={ph} t={t} out={sink} />
          ))}
        </g>
        <DriftChip t2={t2} park={park} />
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
