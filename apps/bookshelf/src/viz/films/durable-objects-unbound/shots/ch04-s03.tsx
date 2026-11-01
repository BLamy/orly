/**
 * ch04-s03 — the announcement, told as plans: 9 October 2026 (candleAmber, cut in).
 *
 * The two-desk stage from ch04-s02 (both lamps, the crossed ropes over the hill), then a slow 6 s truck right and
 * dolly in to Ryan Dahl's desk (screen-right). Kenton Varda's lamp stays a faint glow at the left edge throughout.
 * On Ryan Dahl's desk a paper calendar strip stands on a small easel; a pencil (no hand: a puppet prop) draws DOTTED
 * bars, never solid ink: dotted is the film's mark for an announced intention. No price, no terms are ever written.
 *
 *   date     0.81  '9 October 2026' types on (upper left)
 *   join     6.58  quote card 'the entire Deno team is joining Cloudflare' (upper left, until deploy)
 *   plans    8.72  the pencil arrives at the calendar
 *   year    12.27  a twelve-segment dotted bar: the runtime's year of releases
 *   endyear 20.97  'end': the year bar closes with a small dotted cap
 *   deploy  22.35  a six-segment dotted bar beneath (Deno Deploy, six months); the quote is carried out
 *   (J, rusty)     two dotted arrows run on past the calendar's edge (JSR; rusty_v8), landing on 'continue' 26.93
 *   open    29.21  a small paper door on the calendar's corner swings open (Deno stays open source)
 *   terms   35.21  'price': the pencil lifts over an empty line and writes nothing; the camera does not linger
 *   bert    40.30  name card: Bert Belder, beside a second, empty, out-of-focus chair (no figure)
 *   merge   41.43  'lead': label 'Varda: celld's code and ideas into workerd'
 * Text in the upper half; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, nameCard, quoteCard, withAlpha } from '../../../film';
import type { Camera3, LayerSpec } from '../../../film';
import { camAt, clamp01, label, lerp, seg, sm, twos, type CamKey } from '../sets/common';
import { desk, deskAnchors, deskFigure, emptyChair } from '../sets/historyDesk';
import { STAGE, calendarStrip, dateStamp, dottedArrow, dottedBar, lampHook, pencil, twoDeskBack, twoRopes } from '../sets/ch04-s01-study';

const ID = 'ch04-s03';
const K = STAGE.kenton;
const R = STAGE.ryan;
const CAL = { x: 926, y: 352, w: 136, h: 88 };
const ROW = [CAL.y + 18, CAL.y + 34, CAL.y + 50, CAL.y + 64, CAL.y + 78];
const BX0 = CAL.x + 12, BX1 = CAL.x + CAL.w - 12;
/** an out-of-focus plane between the action plane and L5: Bert Belder's empty chair */
const L45: LayerSpec = { id: 'L4.5', z: 850, haze: 0, blur: 3 };
const WIDE: Camera3 = { x: 670, y: 374, z: 0, lens: 1 };
const CLOSE: Camera3 = { x: 905, y: 392, z: 230, lens: 1 };
const LAST: Camera3 = { x: 915, y: 394, z: 252, lens: 1 };
/** pushed in on the calendar while the pencil dots the plans (the calendar fills the middle of the frame) */
const CALC: Camera3 = { x: CAL.x + CAL.w / 2, y: 384, z: 640, lens: 1 };
const CALC2: Camera3 = { x: CAL.x + CAL.w / 2 + 4, y: 386, z: 664, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date: T.beat('date'),
      join: T.beat('join'),
      plans: T.beat('plans'),
      year: T.beat('year'),
      releases: T.wordEnd('L0412', 'releases'),
      endyear: T.beat('endyear'),
      deploy: T.beat('deploy'),
      months: T.wordEnd('L0414', 'months'),
      jsr: T.word('L0414', 'J'),
      rusty: T.word('L0414', 'rusty'),
      cont: T.beat('continue'),
      open: T.beat('open'),
      terms: T.beat('terms'),
      bert: T.beat('bert'),
      merge: T.beat('merge'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE },
      { t: 2.6, cam: WIDE },
      { t: 7.4, cam: CLOSE },
      { t: b.plans + 1.4, cam: CALC },
      { t: b.terms + 1.2, cam: CALC2 },
      { t: b.bert - 0.4, cam: LAST },
      { t: b.D, cam: { ...LAST, z: LAST.z + 12 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    const ka = deskAnchors(K);
    const ra = deskAnchors(R);
    f.backlight({ sunX: 760, sunY: 420, intensity: 0.5 });
    twoDeskBack(f, { lamps: 0.6, key: ID });
    f.fog({ yCenter: 470, height: 200, alpha: 0.1, drift: 5 });
    // ------------------------------------------------ the plans, as pencil dots
    const yearU = seg(t, b.year - 0.05, b.releases + 0.1);
    const capU = seg(t, b.endyear - 0.1, b.endyear + 0.35);
    const depU = seg(t, b.deploy - 0.05, b.months + 0.1);
    const a1 = seg(t, b.jsr - 0.05, b.jsr + 1.1);
    const a2 = seg(t, b.rusty - 0.05, b.cont + 0.15);
    const door = sm((tq - (b.open - 0.1)) / 0.7);
    // the pencil's tip: a twos-quantised path from stroke to stroke
    const tip = (() => {
      const hover = (x: number, y: number, lift: number) => ({ x, y, lift });
      if (t < b.year - 0.4) return hover(BX0, ROW[0], 10 + 3 * Math.sin(tq * 2.2));
      if (t < b.releases + 0.2) return hover(lerp(BX0, BX1, yearU), ROW[0], 10 * (1 - seg(t, b.year - 0.4, b.year)));
      if (t < b.endyear - 0.3) return hover(BX1, ROW[0], 8 + 2 * Math.sin(tq * 1.6));
      if (t < b.endyear + 0.5) return hover(BX1 + 4, lerp(ROW[0] - 6, ROW[0] + 6, capU), 0);
      if (t < b.deploy - 0.05) return hover(lerp(BX1, BX0, seg(t, b.endyear + 0.5, b.deploy - 0.1)), lerp(ROW[0], ROW[1], seg(t, b.endyear + 0.5, b.deploy - 0.1)), 8);
      if (t < b.months + 0.3) return hover(lerp(BX0, (BX0 + BX1) / 2, depU), ROW[1], 0);
      if (t < b.jsr - 0.05) return hover(lerp((BX0 + BX1) / 2, BX0, seg(t, b.months + 0.3, b.jsr - 0.1)), lerp(ROW[1], ROW[2], seg(t, b.months + 0.3, b.jsr - 0.1)), 8);
      if (t < b.rusty - 0.05) return hover(lerp(BX0, CAL.x + CAL.w + 6, a1), ROW[2], 0);
      if (t < b.cont + 0.3) return hover(lerp(BX0, CAL.x + CAL.w + 6, a2), ROW[3], 0);
      if (t < b.terms - 0.7) return hover(lerp(CAL.x + CAL.w + 6, CAL.x + CAL.w - 20, seg(t, b.cont + 0.3, b.open)), lerp(ROW[3], ROW[4] - 8, seg(t, b.cont + 0.3, b.open)), 10 + 2 * Math.sin(tq * 1.3));
      // 'price': it moves to the empty line, lifts, and writes nothing
      return hover(lerp(CAL.x + CAL.w - 20, BX0 + 10, seg(t, b.terms - 0.7, b.terms - 0.1)), ROW[4], 3 + 16 * seg(t, b.terms, b.terms + 0.5));
    })();
    const penA = seg(t, b.plans - 0.25, b.plans + 0.3);
    f.layer('L4', (c, env) => {
      desk(c, env, { ...K, lamp: 1, screen: 0.7 });
      desk(c, env, { ...R, lamp: 1, screen: 0.75 });
      deskFigure(c, env, { ...K, tq, think: 0.85 });
      // the calendar strip on Ryan Dahl's desk (an easel; the laptop behind it), then the pencil's dots
      calendarStrip(c, env, { ...CAL, door });
      const graphite = withAlpha('#3a3128', 0.9);
      dottedBar(c, graphite, BX0, BX1, ROW[0], yearU, { segs: 12, r: 1.35, gap: 4.4 });
      if (capU > 0) {
        c.save();
        c.fillStyle = graphite;
        for (let k = -2; k <= 2; k++) {
          if ((k + 2) / 4 > capU + 0.01) continue;
          c.beginPath();
          c.arc(BX1 + 4, ROW[0] + k * 3.4, 1.35, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
      dottedBar(c, graphite, BX0, (BX0 + BX1) / 2, ROW[1], depU, { segs: 6, r: 1.35, gap: 4.4 });
      dottedArrow(c, graphite, BX0, ROW[2], CAL.x + CAL.w + 6 - BX0, a1, 1.2);
      dottedArrow(c, graphite, BX0, ROW[3], CAL.x + CAL.w + 6 - BX0, a2, 1.2);
      deskFigure(c, env, { ...R, tq, think: 0 });
      pencil(c, env, { x: tip.x, y: tip.y, lift: tip.lift, alpha: penA, tilt: 0.04 * Math.sin(tq * 3) });
      // the braided ropes hang above, crossed once over the hill
      twoRopes(c, env, { a: lampHook(ka.bulb, ka.ropeHook), b: lampHook(ra.bulb, ra.ropeHook), swing: 1, tq });
    });
    f.rim({ x: 0, y: -1 });
    // Kenton Varda's lamp stays a faint glow at the left edge; Ryan Dahl's lamp is the warm practical here
    f.practical({ x: ka.bulb.x, y: ka.bulb.y, kind: 'lamp', seed: 21, intensity: lerp(0.85, 0.5, seg(t, 2.6, 8.6)), radius: 60, layer: 'L4' });
    f.practical({ x: ra.bulb.x, y: ra.bulb.y, kind: 'lamp', seed: 22, intensity: 0.95, radius: 64, layer: 'L4' });
    // ------------------------------------------------ Bert Belder's empty chair, out of focus (L4.5)
    // Bert Belder's chair and the stage lip are near planes: not drawn while the camera is pushed past them
    if (cam.z < 420)
      f.layer(L45, (c, env) => {
        emptyChair(c, env, { x: 1325, y: 606, s: 1.0, flip: true });
      });
    if (cam.z < 480)
    f.layer('L5', (c, env) => {
      const r = { x: -400, y: 640, w: 2400, h: 200 };
      f.cached(`dou/${ID}/lip/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(0, 18, r.w, r.h - 18);
        cc.fillStyle = withAlpha(env.mood.rim, 0.22);
        cc.fillRect(0, 18, r.w, 1.5);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ type (upper half)
    const te = { t, mood: f.mood };
    const dA = seg(t, b.date - 0.15, b.date + 0.2) * (1 - seg(t, b.join - 1.0, b.join - 0.4));
    dateStamp(f.c, f.mood, { id: `${ID}-date`, text: '9 October 2026', x: 64, y: 78, alpha: dA, typed: clamp01((t - (b.date - 0.1)) / 0.8) });
    quoteCard(f.c, { quote: 'the entire Deno team is joining Cloudflare', speaker: 'Ryan Dahl', source: '2026', x: 92, y: 140, width: 520, maxChars: 30, size: 28, align: 'left', at: b.join - 0.15, dur: b.deploy - b.join + 0.1, fade: 0.4, stagger: 0.25 }, te);
    nameCard(f.c, { name: 'Bert Belder', role: '', at: b.bert - 0.12, dur: Math.max(3.4, b.D - b.bert - 0.6), fade: 0.4, align: 'right', x: 1222, y: 92 }, te);
    const mA = seg(t, b.merge - 0.2, b.merge + 0.25) * (1 - seg(t, b.D - 0.9, b.D - 0.3) * 0.85);
    label(f.c, f.mood, { id: `${ID}-merge`, text: "Varda: celld's code and ideas into workerd", x: 64, y: 92, alpha: mA });
  },
});
