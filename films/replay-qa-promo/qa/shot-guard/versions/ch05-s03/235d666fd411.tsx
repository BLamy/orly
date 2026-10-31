// ch05-s03 — "Twenty-five of twenty-seven renders changed nothing on screen. A screen recording can't see that. A
// time-travel recording can."
// Continuous with ch05-s02 (same page, same crop, our plate over the player). TWO IDEAS ONLY. (1) The grid: the red-pink
// 67 ms bar shatters into 27 squares (the renders) that fly into a 9 × 3 grid on the plate; on 'Twenty-five' 25 drain to
// hollow grey and 2 stay solid red-pink, and '25 of 27 renders changed nothing' arrives word by word under it; on
// 'nothing' the hollow ones dim further. On 'screen' a pale video-frame outline (▶ glyph, progress hairline) drops over
// the grid and only the 2 solid squares show inside it; it fades on 'that'. (2) The root cause: on the second
// sentence a MATCH CUT to the real Root Cause of the same bug page, frozen at 11300: the 'ROOT CAUSE' eyebrow over the
// clause '`SidebarProjectList` trees are not memoized' on one white card, braces snapping round 'are not memoized'
// only, and '{ root cause }' above it, its colour sweep landing on the last 'can'. No 'fixed' stamp: this bug is open.
import type { CSSProperties } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, SANS, bracket, easeInOut, easeOut, haze } from '../../../film/promo';
import { driftLines, sweep } from '../sets/brand';
import { SvgBraces, SvgUnderline, tw } from '../sets/ch04-s02-svg';
import {
  BAR_END,
  HOLLOW_AT,
  MS67,
  PAGE_BOX,
  PAGE_CROP,
  PLATE,
  PLATE_CX,
  PLATE_FILL,
  RC_A,
  RC_AT,
  RC_B,
  RC_EYEBROW,
  RIB,
  RIB_X,
  RibbonMask,
  S02_AT,
  SvgStruckCursor,
  SvgWordBracket,
  TakeInter,
  slotX,
} from '../sets/ch05-s02-bug';
import { MARKS, SLUG } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const START = 49.9167;
/** ch05-s02's last-frame clock, continued (the ribbon keeps sliding while it fades) */
const s2t = (t: number) => S02_AT.dur + Math.max(0, t);

// ---- the 27-render grid on the plate
const COLS = 9, ROWS = 3, SQ = 30, GAP = 13;
const GW = COLS * SQ + (COLS - 1) * GAP;
const GH = ROWS * SQ + (ROWS - 1) * GAP;
const GX0 = PLATE_CX - GW / 2;
const GY0 = 478 - GH / 2;
/** the two renders that changed something (grid index) */
const SOLID = new Set([5, 21]);
/** a fixed, shuffled order for the shatter flight and the drain (deterministic) */
const ORDER = Array.from({ length: COLS * ROWS }, (_, i) => i).sort((a, b) => ((a * 7919) % 27) - ((b * 7919) % 27));
const RANK = new Map(ORDER.map((j, r) => [j, r]));
const CAP_Y = GY0 + GH + 80;

// ---- the Root Cause card (after the match cut): one white card, the eyebrow over the clause, at 3.2 ×
const K = 3.2;
const CARD = { x: 110, y: 322, w: 1060, pad: 36 };
const EYE = { x: CARD.x + CARD.pad, y: CARD.y + 30, w: RC_EYEBROW.w * K };
const ROW_Y = EYE.y + RC_EYEBROW.h * K + 14;
const A = { x: CARD.x + CARD.pad, y: ROW_Y, w: RC_A.w * K };
const B = { x: A.x + A.w + 80, y: ROW_Y, w: RC_B.w * K };
const CLAUSE_H = RC_A.h * K;
const CARD_H = ROW_Y + CLAUSE_H + 50 - CARD.y;
/** the clause's optical centre (rec cap 135..145 inside a crop from y 129) */
const CLAUSE_CY = ROW_Y + (140 - RC_A.y) * K;
const LABEL_Y = 262;

/** SVG kinetic caption (it sits on our plate, above the DOM page): words blur in on their spoken word */
function SvgKinetic(p: { words: { text: string; at: number }[]; t: number; cx: number; y: number; size: number; weight?: number; color: string; dimFrom?: number }) {
  const wt = p.weight ?? 400;
  const sp = tw(' ', p.size, wt);
  const ws = p.words.map((w) => tw(w.text, p.size, wt));
  const total = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let x = p.cx - total / 2;
  return (
    <g>
      {p.words.map((w, i) => {
        const u = clamp((p.t - w.at) / 0.38);
        const x0 = x;
        x += ws[i] + sp;
        if (u <= 0) return null;
        const e = easeOut(u);
        return (
          <text
            key={i}
            x={x0}
            y={p.y + (1 - e) * p.size * 0.25}
            fill={p.color}
            opacity={e}
            style={{ font: `${wt} ${p.size}px ${SANS}`, letterSpacing: `${(-0.022 * p.size).toFixed(2)}px`, filter: e < 0.97 ? `blur(${((1 - e) * p.size * 0.18).toFixed(2)}px)` : undefined }}
          >
            {w.text}
          </text>
        );
      })}
    </g>
  );
}

type Sc = {
  tl: Timeline;
  shatter: number;
  t25: number;
  words: { text: string; at: number }[];
  nothing: number;
  screen: number;
  that: number;
  cut: number;
  tt: number;
  can: number;
  dur: number;
};

export default defineShot({
  id: 'ch05-s03',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const L = 'L0505';
    const sc: Sc = {
      tl,
      shatter: T.beat('shatter'),
      t25: T.beat('hollow25'),
      words: [
        { text: '25', at: T.word(L, 'Twenty-five') - 0.06 },
        { text: 'of', at: T.word(L, 'of') - 0.06 },
        { text: '27', at: T.word(L, 'twenty-seven') - 0.06 },
        { text: 'renders', at: T.word(L, 'renders') - 0.06 },
        { text: 'changed', at: T.word(L, 'changed') - 0.06 },
        { text: 'nothing', at: T.word(L, 'nothing') - 0.06 },
      ],
      nothing: T.beat('nothing'),
      screen: T.beat('screenrec'),
      that: T.beat('recfade'),
      cut: T.beat('matchcut'),
      tt: T.word('L0506', 'time-travel'),
      can: T.beat('rootcause'),
      dur: T.duration,
    };
    return sc;
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = '#24102b';
    c.fillRect(0, 0, 1280, 720);
    haze(c, { t: t + START, preset: 'brand', u: 1 });
    driftLines(c, t + START, { n: 5, alpha: 0.12, speed: 0.8, seed: 5, y0: 40, y1: 690 });
    if (t < sc.cut) return;
    // '{ root cause }' above the card, blurring in with the match cut; the colour sweep lands on the last 'can'
    const u = clamp((t - sc.cut) / 0.7);
    const k = easeInOut(clamp((t - sc.can) / 0.5));
    const w = 330;
    const col = k > 0 ? (sweep(c, 640 - w / 2, 640 + w / 2, k) as unknown as string) : '#ffffff';
    bracket(c, { text: 'root cause', x: 640, y: LABEL_Y, size: 44, u, color: col, dots: 'corners', weight: 300 });
  },
  overlay(s, sc) {
    const t = s.t;
    if (t >= sc.cut) {
      // braces round 'are not memoized' only
      const bu = clamp((t - sc.cut - 0.3) / 0.38);
      return (
        <g>
          <SvgBraces x0={B.x} x1={B.x + B.w} y={CLAUSE_CY} size={60} u={bu} pad={10} color={PROMO.ink} />
          <SvgUnderline x0={B.x + 2} x1={B.x + B.w - 2} y={CLAUSE_CY + 24} u={clamp((t - sc.tt) / 0.4)} width={3} />
        </g>
      );
    }
    // ---- what ch05-s02 left on screen, clearing as the bar shatters
    const clear = easeOut(clamp((t - sc.shatter) / 0.45));
    const T2 = s2t(t);
    const slots = [];
    if (clear < 1) {
      for (let kk = -20; kk < 60; kk++) {
        const x = slotX(kk, T2);
        if (x + RIB.slotW < RIB_X.x0 || x > RIB_X.x1) continue;
        const i = kk - RIB.k0;
        const hollow = i >= 0 && i < 4 && T2 > HOLLOW_AT[i];
        slots.push(
          hollow ? (
            <rect key={kk} x={x + 0.75} y={RIB.y - RIB.slotH / 2 + 0.75} width={RIB.slotW - 1.5} height={RIB.slotH - 1.5} rx={4.5} fill="none" stroke={PROMO.coral} strokeWidth={1.6} />
          ) : (
            <rect key={kk} x={x} y={RIB.y - RIB.slotH / 2} width={RIB.slotW} height={RIB.slotH} rx={5} fill="#ffffff" opacity={0.3} />
          ),
        );
      }
    }
    // ---- the 27 renders: shattered out of the bar into the grid
    const squares = [];
    for (let j = 0; j < COLS * ROWS; j++) {
      const r = Math.floor(j / COLS), q = j % COLS;
      const rank = RANK.get(j)!;
      const fu = clamp((t - sc.shatter - rank * 0.011) / 0.52);
      const fe = easeInOut(fu);
      // start: a shard of the bar (9 × 3 pieces of it)
      const pw = BAR_END.w / COLS, phh = BAR_END.h / ROWS;
      const sx = BAR_END.x + q * pw, sy = BAR_END.y + r * phh;
      const tx = GX0 + q * (SQ + GAP), ty = GY0 + r * (SQ + GAP);
      const w = lerp(pw - 1, SQ, fe), h = lerp(phh - 1, SQ, fe);
      const x = lerp(sx, tx, fe) + Math.sin(Math.PI * fe) * ((q - 4) * 9);
      const y = lerp(sy, ty, fe) - Math.sin(Math.PI * fe) * (40 + r * 14);
      const solid = SOLID.has(j);
      const drain = solid ? 0 : easeOut(clamp((t - sc.t25 - rank * 0.028) / 0.3));
      const dim = solid ? 0 : easeOut(clamp((t - sc.nothing) / 0.4));
      // inside the video frame, the hollow renders leave no trace
      const inFrame = easeOut(clamp((t - sc.screen - 0.12) / 0.25)) * (1 - easeOut(clamp((t - sc.that) / 0.35)));
      const ghost = solid ? 1 : 1 - inFrame;
      const strokeA = (0.62 - 0.38 * dim) * ghost;
      squares.push(
        <g key={j} style={fu < 0.98 ? { filter: `blur(${((1 - fe) * 1.5).toFixed(2)}px)` } : undefined}>
          <rect x={x} y={y} width={w} height={h} rx={lerp(2, 5, fe)} fill={PROMO.brand} opacity={(1 - drain) * ghost} />
          {drain > 0 && (
            <rect x={x + 0.8} y={y + 0.8} width={w - 1.6} height={h - 1.6} rx={4.2} fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={drain * strokeA} />
          )}
        </g>,
      );
    }
    // ---- the screen-recording frame
    const fu = easeOut(clamp((t - sc.screen + 0.06) / 0.3));
    const fo = easeOut(clamp((t - sc.that) / 0.35));
    const fx0 = GX0 - 30, fy0 = GY0 - 24, fx1 = GX0 + GW + 30, fy1 = GY0 + GH + 44;
    const frame =
      fu > 0 && fo < 1 ? (
        <g opacity={fu * (1 - fo)} transform={`translate(0 ${((1 - fu) * -22).toFixed(2)})`}>
          <rect x={fx0} y={fy0} width={fx1 - fx0} height={fy1 - fy0} rx={12} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.78)" strokeWidth={1.6} />
          <path d={`M${fx0 + 16} ${fy1 - 22} L${fx0 + 27} ${fy1 - 16} L${fx0 + 16} ${fy1 - 10} Z`} fill="rgba(255,255,255,.85)" />
          <rect x={fx0 + 40} y={fy1 - 16.75} width={fx1 - fx0 - 58} height={1.5} fill="rgba(255,255,255,.35)" />
          <rect x={fx0 + 40} y={fy1 - 16.75} width={(fx1 - fx0 - 58) * 0.42} height={1.5} fill="rgba(255,255,255,.85)" />
          <circle cx={fx0 + 40 + (fx1 - fx0 - 58) * 0.42} cy={fy1 - 16} r={4} fill="#ffffff" />
        </g>
      ) : null;
    return (
      <g>
        <RibbonMask id="c5s3-rib" />
        <path
          d={`M${PLATE.x} ${PLATE.y + PLATE.h} V${PLATE.y + PLATE.r} Q${PLATE.x} ${PLATE.y} ${PLATE.x + PLATE.r} ${PLATE.y} H${PLATE.x + PLATE.w - PLATE.r} Q${PLATE.x + PLATE.w} ${PLATE.y} ${PLATE.x + PLATE.w} ${PLATE.y + PLATE.r} V${PLATE.y + PLATE.h} Z`}
          fill={PLATE_FILL}
        />
        <g opacity={1 - clear}>
          <SvgWordBracket x0={MS67.x0} x1={MS67.x1} yTop={MS67.yTop} base={MS67.base} u={1} />
          <SvgUnderline x0={MS67.x0 + 1} x1={MS67.x1 - 1} y={MS67.base + 3.5} u={1} width={2.6} />
          <g mask="url(#c5s3-rib)">{slots}</g>
          <text x={PLATE_CX} y={RIB.y + RIB.slotH / 2 + 38} textAnchor="middle" fill="rgba(255,255,255,.62)" style={{ font: `500 16px ${SANS}`, letterSpacing: '-0.2px' }}>
            illustration · 16.7 ms frame budget
          </text>
          <SvgStruckCursor x={1098} y={RIB.y - 34} u={1} strike={1} scale={2.6} />
        </g>
        {squares}
        {frame}
        <SvgKinetic words={sc.words} t={t} cx={PLATE_CX} y={CAP_Y} size={30} weight={400} color="#ffffff" />
      </g>
    );
  },
  dom(s, sc) {
    const t = s.t;
    const nodes = [];
    if (t < sc.cut) {
      nodes.push(
        <div key="page" style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 720 }}>
          <RrwebScreen
            slug={SLUG}
            take="bug-react"
            at={MARKS['bug-react'].still}
            crop={PAGE_CROP}
            box={PAGE_BOX}
            chrome="none"
            radius={14}
            style={{ boxShadow: '0 40px 90px -24px rgba(10,0,20,.65), 0 12px 30px -12px rgba(10,0,20,.45), 0 0 0 1px rgba(255,255,255,.08)' }}
          />
          <div style={{ position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, background: PLATE_FILL, borderRadius: `${PLATE.r}px ${PLATE.r}px 0 0` }} />
        </div>,
      );
    }
    // the Root Cause card: mounted (invisible) a second before the match cut so its three replays are cast in time
    if (t >= sc.cut - 1.5) {
      const on = t >= sc.cut;
      const u = on ? easeOut(clamp((t - sc.cut) / 0.32)) : 0;
      const k = 1.025 - 0.025 * u;
      const card: CSSProperties = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1280,
        height: 720,
        opacity: on ? 1 : 0,
        transformOrigin: `${CARD.x + CARD.w / 2}px ${CARD.y + CARD_H / 2}px`,
        transform: `scale(${k.toFixed(4)})`,
        filter: on && u < 0.6 ? `blur(${((0.6 - u) * 5).toFixed(2)}px)` : undefined,
        pointerEvents: 'none',
      };
      const scr = (key: string, crop: { x: number; y: number; w: number; h: number }, box: { x: number; y: number; w: number }) => (
        <RrwebScreen key={key} slug={SLUG} take="bug-react" at={RC_AT} crop={crop} box={box} chrome="none" radius={0} shadow={false} />
      );
      nodes.push(
        <div key="rc" style={card}>
          <div
            style={{
              position: 'absolute',
              left: CARD.x,
              top: CARD.y,
              width: CARD.w,
              height: CARD_H,
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 40px 90px -24px rgba(10,0,20,.65), 0 12px 30px -12px rgba(10,0,20,.45)',
            }}
          />
          {t >= sc.cut - 1.5 && scr('a', RC_A, A)}
          {t >= sc.cut - 1.1 && scr('b', RC_B, B)}
          {t >= sc.cut - 0.7 && scr('eye', RC_EYEBROW, EYE)}
        </div>,
      );
    }
    return <TakeInter>{nodes}</TakeInter>;
  },
});
