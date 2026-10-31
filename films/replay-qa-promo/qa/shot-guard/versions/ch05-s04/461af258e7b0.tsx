// ch05-s04 — "Another bug: one list, fetched two hundred fifty-eight times in under three minutes. It never saved its
// place, so it kept starting over."
// Cut to a new floating screen: the TOP of the real bug-sync page (take bug-sync, 1300 → report mark 1603 at real
// speed, then held; no cursor), the chips row 'Fixed · Medium · Network Performance · Local' and the two-line title
// 'Live-sync loop re-fetches /api/repos/maple/reading-room/pulls 258 times with checkpoint never advancing past -1',
// pinned in the upper third, tilting in and settling flat by 'list'. On 'fifty-eight' the strip zooms 1.55× onto '258'
// in the title, easing back by 'never'. Below it, OUR overlay: from 'fetched' a ribbon of 258 request bars deals left
// → right as a counter races to 258 and stops dead on 'fifty-eight'; a 'checkpoint −1' tag sits pinned above the
// ribbon's start and never changes. On 'minutes' the greyed, struck pointer (ch05-s02's) and '≈ 160 s · 2 clicks · no
// keypresses' appear beside it. On 'never' a red-pink bookmark flag at −1 tries to step forward three times and snaps
// back; on 'place' a red-pink underline lands under the tag; on 'starting' every bar drops to its base and comes back
// brighter at once; hold through the tail.
import type { CSSProperties } from 'react';
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { RrwebScreen, easeInOut, easeOut, haze } from '../../../film/promo';
import { driftLines } from '../sets/brand';
import { TakeInter } from '../sets/ch05-s02-bug';
import { S04_AT, STRIP_BOX, STRIP_CROP, ZOOM_AT, paintRequests, zoomAt } from '../sets/ch05-s04-sync';
import { MARKS, SLUG } from '../sets/takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const START = 57.6667;
const STRIP_H = (STRIP_CROP.h * STRIP_BOX.w) / STRIP_CROP.w;

type Sc = { tl: Timeline; tape: ReturnType<Timeline['channel']>; list: number };

export default defineShot({
  id: 'ch05-s04',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    // 1300 → report 1603 at real speed (the top of the page is identical across it), then held
    const tape = tl.channel('tape', 1300);
    tl.tween(tape, MARKS['bug-sync'].report, { at: 0.05, dur: (MARKS['bug-sync'].report - 1300) / 1000 });
    tl.hold(0, T.duration);
    return { tl, tape, list: T.beat('settle') };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = '#24102b';
    c.fillRect(0, 0, 1280, 720);
    haze(c, { t: t + START, preset: 'brand', u: 1 });
    driftLines(c, t + START, { n: 5, alpha: 0.12, speed: 0.8, seed: 5, y0: 40, y1: 690 });
    void sc;
    void S04_AT;
    paintRequests(c, t, 1);
  },
  dom(s, sc) {
    const t = s.t;
    const st = easeInOut(clamp((t - 0.05) / (sc.list - 0.05)));
    const a = easeOut(clamp((t - 0.02) / 0.35));
    const rise = (1 - easeOut(clamp((t - 0.02) / 0.6))) * 22;
    const cx = STRIP_BOX.x + STRIP_BOX.w / 2, cy = STRIP_BOX.y + STRIP_H / 2;
    const wrap: CSSProperties = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1280,
      height: 720,
      transformOrigin: `${cx}px ${cy}px`,
      transform: `translateY(${rise.toFixed(2)}px) perspective(1800px) rotateX(${(6 * (1 - st)).toFixed(3)}deg) rotateY(${(10 * (1 - st)).toFixed(3)}deg)`,
      opacity: a,
      filter: a < 0.98 ? `blur(${((1 - a) * 8).toFixed(2)}px)` : undefined,
      pointerEvents: 'none',
    };
    return (
      <TakeInter>
        <div style={wrap}>
          <RrwebScreen
            slug={SLUG}
            take="bug-sync"
            at={s.get(sc.tape) as number}
            crop={STRIP_CROP}
            box={STRIP_BOX}
            chrome="none"
            radius={14}
            zoom={{ x: ZOOM_AT.x, y: ZOOM_AT.y, scale: zoomAt(t) }}
            style={{ boxShadow: '0 34px 80px -24px rgba(10,0,20,.65), 0 10px 26px -12px rgba(10,0,20,.45), 0 0 0 1px rgba(255,255,255,.08)' }}
          />
        </div>
      </TakeInter>
    );
  },
});
