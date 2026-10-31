// ch05-s02 — "Replay QA caught one in its own app. One update. Sixty-seven milliseconds. Four dropped frames.
// No click. A background refresh re-rendered the project list."
// Still in the brand haze. The real bug page (take bug-react, 3040 → 3200 at real speed, then held: chips row with the
// 'Open' chip, the '67ms React commit …' title, the 'Replay' card) tilts in, no chrome, no cursor, and settles flat on
// 'own'. Its dark player never shows 'Loading replay…': a matching dark plate inside the same tilting box covers it from
// the first frame; once flat, our overlay puts a dim ribbon of 16.7 ms frame slots on it. On 'update' braces snap
// around '67ms' in the title with a red-pink underline. On 'Sixty-seven' the ribbon brightens and slides, a slot per
// beat, with the caption 'illustration · 16.7 ms frame budget'. On 'Four' a red-pink '67 ms' bar drops across exactly
// four slots and the ribbon freezes; the four go hollow coral, one per beat of the silence. On 'No click.' a greyed,
// struck-through pointer appears on clear haze beside the page and the ribbon slides on; on 'background' a faint pulse
// runs along the whole ribbon (the refresh nobody asked for).
import type { CSSProperties } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { MONO, PROMO, RrwebScreen, SANS, easeInOut, easeOut, haze } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { SvgBraces, SvgUnderline } from '../sets/ch04-s02-svg';
import {
  HOLLOW_AT,
  MS67,
  PAGE_BOX,
  PAGE_CROP,
  PAGE_H,
  PLATE,
  PLATE_CX,
  PLATE_FILL,
  RIB,
  RIB_X,
  RibbonMask,
  SvgStruckCursor,
  barRect,
  slotX,
} from '../sets/ch05-s02-bug';
import { MARKS, SLUG } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const START = 38.5833;
/** where the struck pointer sits: clear haze in the right margin, level with the ribbon */
const CURSOR_AT = { x: 1098, y: RIB.y - 34 };

type Sc = {
  tl: Timeline;
  tape: ReturnType<Timeline['channel']>;
  own: number;
  update: number;
  sixty: number;
  four: number;
  no: number;
  background: number;
  dur: number;
};

/** the settle: tilt {x: 8, y: -10} → flat by 'own' */
const settleOf = (t: number, sc: Sc) => easeInOut(clamp((t - 0.05) / (sc.own - 0.05)));

export default defineShot({
  id: 'ch05-s02',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    // held at 3150, inside the safe window 3040–3200 (the frames there are identical; never 'report' 3032, never past
    // ≈ 3217 where the player turns white). ONE seek: progressive seeks through 3040 → 3200 re-wrap the title onto four
    // lines in the harness (measured), which would move every overlay off its word.
    const tape = tl.channel('tape', MARKS['bug-react'].still);
    tl.hold(0, T.duration);
    const sc: Sc = {
      tl,
      tape,
      own: T.beat('settle'),
      update: T.beat('ms67'),
      sixty: T.beat('ribbon'),
      four: T.beat('four'),
      no: T.beat('noclick'),
      background: T.beat('refresh'),
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
  },
  overlay(s, sc) {
    const t = s.t;
    const flat = clamp((t - sc.own + 0.05) / 0.2); // our plate takes over once the page is flat
    // ---- braces + underline on '67ms' in the title
    const yc = (MS67.yTop + MS67.base) / 2;
    const bu = clamp((t - sc.update + 0.06) / 0.34);
    const ul = clamp((t - sc.update - 0.08) / 0.32);
    // ---- the ribbon
    const dimU = easeOut(clamp((t - sc.own) / 0.45));
    const bright = easeOut(clamp((t - sc.sixty + 0.05) / 0.3));
    const baseA = 0.15 + 0.15 * bright;
    const pulseU = (t - sc.background) / 1.5;
    const pulseX = RIB_X.x0 - 80 + (RIB_X.x1 - RIB_X.x0 + 160) * easeInOut(clamp(pulseU));
    const pulseOn = pulseU > 0 && pulseU < 1 ? Math.sin(Math.PI * clamp(pulseU)) : 0;
    const kMin = Math.floor((RIB_X.x0 - 60 - RIB.x0 + 2000) / RIB.pitch) - 50;
    const slots = [];
    for (let k = kMin; k < kMin + 80; k++) {
      const x = slotX(k, t);
      if (x + RIB.slotW < RIB_X.x0 || x > RIB_X.x1) continue;
      const i = k - RIB.k0;
      const isBar = i >= 0 && i < 4;
      const hollow = isBar ? easeOut(clamp((t - HOLLOW_AT[i]) / 0.22)) : 0;
      const cx = x + RIB.slotW / 2;
      const boost = pulseOn * 0.5 * Math.exp(-Math.pow((cx - pulseX) / 55, 2));
      const a = (baseA + boost) * dimU;
      slots.push(
        <g key={k}>
          <rect x={x} y={RIB.y - RIB.slotH / 2} width={RIB.slotW} height={RIB.slotH} rx={5} fill="#ffffff" opacity={a * (1 - hollow)} />
          {hollow > 0 && (
            <rect
              x={x + 0.75}
              y={RIB.y - RIB.slotH / 2 + 0.75}
              width={RIB.slotW - 1.5}
              height={RIB.slotH - 1.5}
              rx={4.5}
              fill="none"
              stroke={PROMO.coral}
              strokeWidth={1.6}
              opacity={hollow * (0.95 + boost)}
            />
          )}
        </g>,
      );
    }
    // ---- the 67 ms bar: drops onto the ribbon on 'Four', covering exactly four slots, and rides the ribbon after
    const du = clamp((t - sc.four + 0.04) / 0.26);
    const bar = barRect(t);
    const be = easeOut(du);
    // ---- caption
    const capU = easeOut(clamp((t - sc.sixty - 0.1) / 0.4));
    // ---- struck pointer
    const cu = clamp((t - sc.no + 0.06) / 0.35);
    const strike = clamp((t - sc.no - 0.22) / 0.3);
    return (
      <g>
        <RibbonMask id="c5s2-rib" />
        {/* our flat plate over the player once the page has settled (the DOM plate covered it while tilting) */}
        {flat > 0 && (
          <path
            d={`M${PLATE.x} ${PLATE.y + PLATE.h} V${PLATE.y + PLATE.r} Q${PLATE.x} ${PLATE.y} ${PLATE.x + PLATE.r} ${PLATE.y} H${PLATE.x + PLATE.w - PLATE.r} Q${PLATE.x + PLATE.w} ${PLATE.y} ${PLATE.x + PLATE.w} ${PLATE.y + PLATE.r} V${PLATE.y + PLATE.h} Z`}
            fill={PLATE_FILL}
            opacity={flat}
          />
        )}
        <SvgBraces x0={MS67.x0} x1={MS67.x1} y={yc} size={34} u={bu} pad={4} dots={false} />
        <SvgUnderline x0={MS67.x0 + 1} x1={MS67.x1 - 1} y={MS67.base + 6} u={ul} width={3} />
        <g mask="url(#c5s2-rib)">{slots}</g>
        {du > 0 && (
          <g opacity={be} transform={`translate(0 ${((1 - be) * -26).toFixed(2)})`} mask="url(#c5s2-rib)">
            <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx={5} fill={PROMO.brand} />
            <text x={bar.x + bar.w / 2} y={bar.y + bar.h / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" style={{ font: `600 14px ${MONO}`, letterSpacing: '-0.2px' }}>
              67 ms
            </text>
          </g>
        )}
        {capU > 0 && (
          <text
            x={PLATE_CX}
            y={RIB.y + RIB.slotH / 2 + 38}
            textAnchor="middle"
            fill="rgba(255,255,255,.62)"
            opacity={capU}
            style={{ font: `500 16px ${SANS}`, letterSpacing: '-0.2px', filter: capU < 0.98 ? `blur(${((1 - capU) * 3).toFixed(2)}px)` : undefined }}
          >
            illustration · 16.7 ms frame budget
          </text>
        )}
        <SvgStruckCursor x={CURSOR_AT.x} y={CURSOR_AT.y} u={cu} strike={strike} scale={2.6} />
      </g>
    );
  },
  dom(s, sc) {
    const t = s.t;
    const st = settleOf(t, sc);
    const a = easeOut(clamp((t - 0.02) / 0.4));
    const rise = (1 - easeOut(clamp((t - 0.02) / 0.7))) * 26;
    const cx = PAGE_BOX.x + PAGE_BOX.w / 2, cy = PAGE_BOX.y + PAGE_H / 2;
    const wrap: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
      transformOrigin: `${cx}px ${cy}px`,
      transform: `translateY(${rise.toFixed(2)}px) perspective(1800px) rotateX(${(8 * (1 - st)).toFixed(3)}deg) rotateY(${(-10 * (1 - st)).toFixed(3)}deg)`,
      opacity: a,
      filter: a < 0.98 ? `blur(${((1 - a) * 8).toFixed(2)}px)` : undefined,
      pointerEvents: 'none',
    };
    return (
      <div style={wrap}>
        <RrwebScreen
          slug={SLUG}
          take="bug-react"
          at={s.get(sc.tape) as number}
          crop={PAGE_CROP}
          box={PAGE_BOX}
          chrome="none"
          radius={14}
          style={{ boxShadow: '0 40px 90px -24px rgba(10,0,20,.65), 0 12px 30px -12px rgba(10,0,20,.45), 0 0 0 1px rgba(255,255,255,.08)' }}
        />
        {/* the player plate, tilting with the page: 'Loading replay…' is never visible */}
        <div
          style={{
            position: 'absolute',
            left: PLATE.x,
            top: PLATE.y,
            width: PLATE.w,
            height: PLATE.h,
            background: PLATE_FILL,
            borderRadius: `${PLATE.r}px ${PLATE.r}px 0 0`,
          }}
        />
      </div>
    );
  },
});
