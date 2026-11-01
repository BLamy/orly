/**
 * ch04-s01 — Ryan Dahl's desk, screen-right, August 2026: the second lineage arrives (candleAmber, iris in).
 *
 * A generic 2020s study at night. L1 the harbour town small through the window (night sky, sea, three houses, the
 * Well and its Plate); L2 the study wall with a tall mullioned window HOLE; L3 a bookshelf edge at the left; L4 Ryan
 * Dahl at his desk (screen-right, facing left, lamp on his left), laptop, a brass-bound box and a notebook; L5 the
 * desk's near corner; L6 a curtain fold at the left edge. Camera: one slow truck left 80 px with a 100 px dolly in.
 *
 *   date     1.00  'August 2026' types on, upper left
 *   lamp     4.58  the desk lamp warms a step
 *   name     7.73  name card: Ryan Dahl · Deno (upper right)
 *   quote1  11.50  label 'Ryan Dahl, 2026: why he started celld' (until out1)
 *   binary  13.43  the brass-bound box on the desk: one rope runs from it out of the window, down to the far Well
 *   out1    19.04  the label is carried out as L0404 begins
 *   houses  21.46  'machines': three far window lamps brighten
 *   readme  29.32  the README quote card sets upper left
 *   well    36.07  a faint serverCyan glint deep in the far Well's shaft (the only cyan in frame)
 *   lineage 38.35  'descends': the notebook's three-strand braided spine cord catches the lamp
 * No likeness, no gesture beyond the idle. Text in the upper half; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, bookshelfWall, defineShot, nameCard, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { camAt, clamp01, label, lerp, pulse, seg, tone, twos, type CamKey } from '../sets/common';
import { desk, deskAnchors, deskFigure, lampStep, type DeskOpts } from '../sets/historyDesk';
import { FAR, braidNotebook, brassBox, dateStamp, farTownLive, farTownStatic, rope, sagPts, studyWall, wellMouth } from '../sets/ch04-s01-study';

const ID = 'ch04-s01';
const DESK_R: DeskOpts = { who: 'ryan', x: 880, y: 600, s: 1.05 };
const WIN = { x: 300, y: 228, w: 300, h: 232 };
const TOP_Y = 600 - 76 * (320 / 175) * 1.05;
const BOX = { x: 842, y: TOP_Y };
const NOTE = { x: 870, y: TOP_Y };
const FAR_R = { x: 120, y: 130, w: 720, h: 440 };
const START: Camera3 = { x: 720, y: 380, z: 70, lens: 1 };
const END: Camera3 = { x: 640, y: 372, z: 170, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      date: T.beat('date'),
      lamp: T.beat('lamp'),
      name: T.beat('name'),
      quote1: T.beat('quote1'),
      binary: T.beat('binary'),
      out1: T.beat('out1'),
      houses: T.beat('houses'),
      readme: T.beat('readme'),
      well: T.beat('well'),
      lineage: T.beat('lineage'),
      storage: T.wordEnd('L0403', 'storage'),
      l405end: T.line('L0405').end,
    };
    const cams: CamKey[] = [
      { t: 0, cam: START },
      { t: b.D, cam: END },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const all = [START, END];
    f.camera(cam);
    const anchors = deskAnchors(DESK_R);
    const lamp = lampStep(t, b.lamp - 0.1, 0.72, 1);
    f.backlight({ sunX: anchors.bulb.x, sunY: anchors.bulb.y, intensity: 0.45 * lamp });
    // ------------------------------------------------ L1 the harbour town, small, through the window
    const houses = lerp(0.22, 1, seg(t, b.houses - 0.15, b.houses + 0.9));
    const cyan = seg(t, b.well - 0.2, b.well + 0.6) * (0.65 + 0.35 * pulse(t, b.well, 0.3, 0.3, 1.2));
    f.layer('L1', (c, env) => {
      f.cached(`dou/${ID}/far/${env.mood.id}`, FAR_R.w, FAR_R.h, (cc) => {
        cc.translate(-FAR_R.x, -FAR_R.y);
        farTownStatic(cc, env, { r: FAR_R });
      })(c, FAR_R.x, FAR_R.y);
      farTownLive(c, env, { r: FAR_R, lamps: houses, cyan });
      // the rope's outside run: from the window sill down the hill to the far Well
      const ru = seg(t, b.binary + 0.5, b.binary + 2.2);
      if (ru > 0) {
        const sill = toScreen(LAYERS.L2, cam, WIN.x + WIN.w - 22, WIN.y + WIN.h - 3);
        const s1 = toLayer(LAYERS.L1, cam, sill.x, sill.y);
        const m = wellMouth();
        rope(c, sagPts(s1, { x: m.x + 2, y: m.y - 2 }, 6, 14), withAlpha(tone(env, '#b98a50', 0.25), 0.9), 0.9, ru);
      }
    });
    // ------------------------------------------------ L2 the study wall with its window hole
    f.layer('L2', (c, env) => {
      const r = { x: -260, y: -80, w: 1900, h: 900 };
      f.cached(`dou/${ID}/wall/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        studyWall(cc, env, { x0: r.x, x1: r.x + r.w, y0: r.y, y1: r.y + r.h, win: WIN, bars: 2, transom: 0.32, floorY: 602, frame: { x: 1010, y: 150, w: 84, h: 104 } });
      })(c, r.x, r.y);
      // the lamp's pool on the wall (motivated: it brightens with the lamp)
      const bs = toScreen(LAYERS.L4, cam, anchors.bulb.x, anchors.bulb.y);
      const bl = toLayer(LAYERS.L2, cam, bs.x, bs.y);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(bl.x + 40, bl.y - 30, 10, bl.x + 40, bl.y - 30, 420);
      g.addColorStop(0, withAlpha(tone(env, '#ffbf6a', 0.1), 0.2 * lamp));
      g.addColorStop(0.45, withAlpha(tone(env, '#ffbf6a', 0.1), 0.07 * lamp));
      g.addColorStop(1, withAlpha(tone(env, '#ffbf6a', 0.1), 0));
      c.fillStyle = g;
      c.fillRect(bl.x - 400, bl.y - 450, 880, 760);
      c.restore();
    });
    f.fog({ yCenter: 520, height: 260, alpha: 0.1, drift: 5 });
    // ------------------------------------------------ L3 the bookshelf edge
    f.layer('L3', (c, env) => {
      const r = { x: -200, y: 60, w: 420, h: 600 };
      f.cached(`dou/${ID}/shelf/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        bookshelfWall(cc, { x: -170, y: 92, w: 360, h: 548, bays: 2, shelves: 5, seed: 404, backTone: 0.22 }, env);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ L4 the desk, Ryan Dahl, the box, the rope, the notebook
    f.layer('L4', (c, env) => {
      desk(c, env, { ...DESK_R, lamp: 1, screen: 0.8 });
      // the rope's inside run: from the box's hasp, sagging over the desk edge, to the window sill
      const ru = seg(t, b.binary - 0.05, b.binary + 0.6);
      const boxIn = seg(t, b.binary - 0.25, b.binary + 0.15);
      brassBox(c, env, { x: BOX.x, y: BOX.y, s: 1, alpha: boxIn, glint: 0.3 * lamp + 0.4 * pulse(t, b.binary, 0.2, 0.3, 0.8) });
      if (ru > 0) {
        const sill = toScreen(LAYERS.L2, cam, WIN.x + WIN.w - 22, WIN.y + WIN.h - 3);
        const s4 = toLayer(LAYERS.L4, cam, sill.x, sill.y);
        rope(c, sagPts({ x: BOX.x - 4, y: BOX.y - 14 }, s4, 26, 18), tone(env, '#b98a50', 0.2), 2, ru);
      }
      // the notebook, propped against the box; its braided spine inks and catches the lamp on 'descends'
      const br = seg(t, b.lineage - 0.2, b.lineage + 0.9);
      braidNotebook(c, env, { x: NOTE.x, y: NOTE.y, s: 1, braid: 0.12 + 0.88 * br, glint: pulse(t, b.lineage + 0.3, 0.3, 0.6, 1.4) });
      deskFigure(c, env, { ...DESK_R, tq, think: 0 });
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: anchors.bulb.x, y: anchors.bulb.y, kind: 'lamp', seed: 44, intensity: 0.9 * lamp, radius: 60, layer: 'L4' });
    // ------------------------------------------------ L5 the desk's near corner · L6 a curtain fold
    f.layer('L5', (c, env) => {
      const r = { x: 1040, y: 560, w: 520, h: 260 };
      f.cached(`dou/${ID}/near/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(30, 70);
        cc.lineTo(r.w, 46);
        cc.lineTo(r.w, r.h);
        cc.lineTo(0, r.h);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(env.mood.rim, 0.25);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(30, 70);
        cc.lineTo(r.w, 46);
        cc.stroke();
      })(c, r.x, r.y);
    });
    f.layer('L6', (c, env) => {
      const r = { x: -140, y: -60, w: 220, h: 860 };
      f.cached(`dou/${ID}/curtain/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(-140, -60);
        cc.lineTo(40, -60);
        for (let y = -60; y <= 800; y += 20) cc.lineTo(40 + 14 * Math.sin(y * 0.02) + (y > 500 ? (y - 500) * 0.06 : 0), y);
        cc.lineTo(-140, 800);
        cc.closePath();
        cc.fill();
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ type (screen-locked, upper half)
    const te = { t, mood: f.mood };
    const dA = seg(t, b.date - 0.15, b.date + 0.2) * (1 - seg(t, b.name - 1.0, b.name - 0.4));
    dateStamp(f.c, f.mood, { id: `${ID}-date`, text: 'August 2026', x: 64, y: 78, alpha: dA, typed: clamp01((t - (b.date - 0.1)) / 0.7) });
    nameCard(f.c, { name: 'Ryan Dahl', role: 'Deno', at: b.name - 0.12, dur: Math.min(3.6, b.quote1 - b.name - 0.2), fade: 0.35, align: 'right', x: 1222, y: 92 }, te);
    const lA = seg(t, b.quote1 - 0.2, b.quote1 + 0.25) * (1 - seg(t, b.out1, b.out1 + 0.6));
    const slide = seg(t, b.out1, b.out1 + 0.6) * -40;
    label(f.c, f.mood, { id: `${ID}-why`, text: 'Ryan Dahl, 2026: why he started celld', x: 64 + slide, y: 92, alpha: lA });
    const qEnd = Math.min(b.lineage - 0.6, b.well + 1.4);
    quoteCard(f.c, { quote: 'It needs no serving control plane or consensus service.', speaker: 'celld README', source: 'v0.6.3', x: 92, y: 150, width: 520, maxChars: 32, size: 27, align: 'left', at: b.readme - 0.15, dur: qEnd - b.readme + 0.15, fade: 0.4, stagger: 0.25 }, te);
    void FAR;
  },
});
