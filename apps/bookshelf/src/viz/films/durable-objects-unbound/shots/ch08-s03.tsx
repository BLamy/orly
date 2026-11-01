/**
 * ch08-s03 — the two lamps, and the limits of the Well (candleAmber, ink bleed in).
 *
 * The 2026 two-desk stage from ch04 (sets/ch04-s01-study.ts, read-only here): Kenton Varda's desk screen-left, lamp on
 * his right; Ryan Dahl's screen-right, lamp on his left; Bert Belder's empty chair out of focus beside it; between the
 * flats, the dark harbour hill. A paper model of the harbour terrace stands on a small stand in the gap.
 *   desks    the two lamps in one frame; a slow dolly in between them
 *   plan     the two ropes from the lamp arms tighten into one braid running down to the paper model
 *   merged   a blank paper ribbon passes from Ryan Dahl's side into the braid; the quote cartouche sets upper middle
 *   well     the camera drifts down to the model, where a tiny Well sits in its square
 *   run      a tiny keeper stands at a house, its lamp lit: the work happens in the house, never in the Well
 *   rooms    two Plates on two separate wells change at different moments, never together
 *   exactly  a house bell rings and a ghost repeat hangs beside it
 *   quiet    the wells' ropes go slack and every house closes its shutters (writers stop; nothing serves on)
 * Real people stay at their desks; their hands never touch the model. Name cards are not repeated. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, quoteCard, withAlpha } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { cast } from '../cast';
import { POSES, PUPPET_NEAR_BLACK } from '../../../film';
import { braid, desk, deskAnchors, deskFigure, emptyChair } from '../sets/historyDesk';
import { STAGE, lampHook, twoDeskBack, twoRopes } from '../sets/ch04-s01-study';
import { camAt, clamp01, glowDot, paper, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { plate, wellBase, wellLive } from '../sets/wellAndPlate';
import { bellSwing, houseBell } from '../sets/heldLetter';

const ID = 'ch08-s03';
const K = STAGE.kenton;
const R = STAGE.ryan;
const L45: LayerSpec = { id: 'L45', z: 820, haze: 0, blur: 6 };
/** the paper model on its stand, in the gap between the flats */
const MODEL = { x: 710, y: 520, w: 300 };
const WELLS = [
  { x: MODEL.x - 40, y: MODEL.y - 6 },
  { x: MODEL.x + 40, y: MODEL.y - 6 },
];
const MS = 0.3;
/** A at the left, B and C at the right (C on the upper terrace), as in the town */
const HOUSES = [MODEL.x - 116, MODEL.x + 100, MODEL.x + 134];

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      plan: T.beat('plan'),
      merged: T.beat('merged'),
      well: T.beat('well'),
      run: T.beat('run'),
      rooms: T.beat('rooms'),
      exactly: T.beat('exactly'),
      quiet: T.beat('quiet'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: { x: 660, y: 372, z: 0, lens: 1 } },
      { t: b.well - 1.2, cam: { x: 690, y: 392, z: 150, lens: 1 } },
      { t: b.run + 1.2, cam: { x: MODEL.x, y: 456, z: 520, lens: 1 } },
      { t: b.D, cam: { x: MODEL.x + 4, y: 458, z: 536, lens: 1 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(cams, t);
    f.camera(cam);
    const ka = deskAnchors(K);
    const ra = deskAnchors(R);
    f.backlight({ sunX: 710, sunY: 420, intensity: 0.5 });
    twoDeskBack(f, { lamps: 0.6, key: ID });
    f.fog({ yCenter: 470, height: 200, alpha: 0.1, drift: 5 });
    const tight = seg(t, b.plan - 0.2, b.plan + 2.2);
    const ribbonU = clamp01((t - (b.merged - 0.3)) / 3.2);
    const quiet = seg(t, b.quiet - 0.2, b.quiet + 1.4);
    f.layer('L4', (c, env) => {
      desk(c, env, { ...K, lamp: 1, screen: 0.7 });
      desk(c, env, { ...R, lamp: 1, screen: 0.75 });
      deskFigure(c, env, { ...K, tq, think: 0.6 });
      deskFigure(c, env, { ...R, tq, think: 0.2 });
      model(c, env);
      // the ropes: as ch04 left them (crossed once), then tightening into one braid that runs down to the model
      const ha = lampHook(ka.bulb, ka.ropeHook), hb = lampHook(ra.bulb, ra.ropeHook);
      const to = { x: MODEL.x, y: MODEL.y - 70 };
      if (tight < 1) twoRopes(c, env, { a: ha, b: hb, swing: 1, tq, alpha: 1 - tight });
      if (tight > 0) braid(c, env, { a: ha, b: hb, to, u: 1 + 2.5 * tight, tight, alpha: tight });
      // a blank paper ribbon passes from Ryan Dahl's side into the braid
      if (ribbonU > 0 && ribbonU < 1) {
        const u = sm(ribbonU);
        const x = hb.x + (to.x + 40 - hb.x) * u, y = hb.y + 40 + (to.y - 30 - hb.y - 40) * u - Math.sin(Math.PI * u) * 30;
        c.save();
        c.globalAlpha = Math.sin(Math.PI * Math.min(1, ribbonU * 1.1));
        c.translate(x, y);
        c.rotate(-0.3 + 0.5 * u);
        c.fillStyle = paper(env, 0.1);
        c.fillRect(-26, -4, 52, 8);
        c.strokeStyle = withAlpha(mixLab('#3a2a18', env.mood.fg, 0.3), 0.5);
        c.lineWidth = 0.6;
        for (let k = -18; k <= 18; k += 12) {
          c.beginPath();
          c.moveTo(k, -4);
          c.lineTo(k, 4);
          c.stroke();
        }
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: ka.bulb.x, y: ka.bulb.y, kind: 'lamp', seed: 21, intensity: 0.85 * (1 - 0.4 * seg(t, b.well - 1, b.well + 1.5)), radius: 60, layer: 'L4' });
    f.practical({ x: ra.bulb.x, y: ra.bulb.y, kind: 'lamp', seed: 22, intensity: 0.85 * (1 - 0.4 * seg(t, b.well - 1, b.well + 1.5)), radius: 60, layer: 'L4' });
    f.layer(L45, (c, env) => {
      emptyChair(c, env, { x: 1325, y: 606, s: 1.0, flip: true });
    });
    f.layer('L5', (c, env) => {
      const r = { x: -400, y: 640, w: 2400, h: 200 };
      f.cached(`dou/${ID}/lip/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(0, 18, r.w, r.h - 18);
        cc.fillStyle = withAlpha(env.mood.rim, 0.22);
        cc.fillRect(0, 18, r.w, 1.5);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ the quote, upper middle
    quoteCard(f.c, { quote: '…the beginning of merging celld’s functionality into workerd.', speaker: 'Ryan Dahl', source: 'commit aa494794', x: 640, y: 150, width: 640, maxChars: 34, size: 28, at: b.merged - 0.1, dur: b.well - b.merged - 0.2, fade: 0.45, stagger: 0.25 }, { t, mood: f.mood });

    /** the paper model: a stand, a paper square, three paper houses, two tiny wells with their Plates, a keeper */
    function model(c: C2, env: PaintEnv): void {
      // the stand
      c.save();
      c.fillStyle = env.fill('ink');
      c.fillRect(MODEL.x - MODEL.w / 2 - 6, MODEL.y, MODEL.w + 12, 6);
      c.fillRect(MODEL.x - 4, MODEL.y + 6, 8, 600 - MODEL.y - 10);
      c.fillRect(MODEL.x - 36, 596, 72, 6);
      // the paper square
      c.fillStyle = paper(env, 0.25);
      c.fillRect(MODEL.x - MODEL.w / 2, MODEL.y - 6, MODEL.w, 6);
      // three paper houses at the back, windows lit until the town goes quiet (shuttered one by one)
      HOUSES.forEach((hx, i) => {
        const hy = MODEL.y - 34 - (i === 2 ? 22 : 0);
        c.fillStyle = mixLab(paper(env, 0.35), env.mood.fg, 0.25);
        c.beginPath();
        c.moveTo(hx - 13, hy + 28);
        c.lineTo(hx - 13, hy + 8);
        c.lineTo(hx, hy - 4 - (i === 0 ? 6 : 0));
        c.lineTo(hx + 13, hy + 8);
        c.lineTo(hx + 13, hy + 28);
        c.closePath();
        c.fill();
        const shut = seg(t, b.quiet + i * 0.35, b.quiet + 0.4 + i * 0.35);
        c.fillStyle = mixLab(tone(env, '#ffc46e', 0.05), env.fill('ink'), shut);
        c.fillRect(hx - 4, hy + 12, 8, 8);
        if (shut > 0.05) {
          c.fillStyle = env.fill('ink');
          c.fillRect(hx - 5, hy + 12, 10 * shut, 8);
        }
      });
      c.restore();
      // the two tiny wells and their Plates: they change at different moments, never together
      const flipA = seg(t, b.rooms - 0.1, b.rooms + 0.4);
      const flipB = seg(t, b.rooms + 1.1, b.rooms + 1.6);
      WELLS.forEach((w, i) => {
        const o = { x: w.x, y: w.y, s: MS };
        wellBase(c, env, o);
        wellLive(c, env, { ...o, bucket: 0.3, slack: quiet });
        const fl = i === 0 ? flipA : flipB;
        plate(c, env, { ...o, plate: { house: i === 0 ? 'A' : 'B', epoch: fl > 0.5 ? (i === 0 ? 8 : 5) : i === 0 ? 7 : 4, from: fl > 0.5 ? (i === 0 ? 8 : 5) : i === 0 ? 7 : 4, crown: 1 - quiet * 0.8, flip: [1, fl < 1 && fl > 0 ? fl : 1, fl < 1 && fl > 0 ? fl : 1], dim: 0.15 } });
      });
      // the keeper stays at the house: the house runs the code, the Well runs nothing
      const kA = seg(t, b.run - 0.4, b.run + 0.3);
      if (kA > 0.01) {
        c.save();
        c.globalAlpha = kA * (1 - quiet);
        cast['keeper-a'].draw(c, { x: HOUSES[0] + 18, y: MODEL.y - 6, facing: 'left', pose: POSES.stand, scale: 0.1, ink: PUPPET_NEAR_BLACK }, env);
        c.restore();
        glowDot(c, HOUSES[0], MODEL.y - 18, 14, tone(env, '#ffc46e', 0.05), 0.4 * kA * (1 - quiet));
      }
      // a bell rings at the middle house; a ghost repeat hangs beside it
      const ring = pulse(t, b.exactly, 0.1, 0.4, 0.8);
      const ghostRing = pulse(t, b.exactly + 0.7, 0.1, 0.4, 1.2);
      if (t > b.exactly - 0.5) {
        const bx = HOUSES[1] - 18, by = MODEL.y - 40;
        houseBell(c, env, { x: bx, y: by, s: 0.32, swing: bellSwing(t, b.exactly, 0.45), ring, alpha: 1 - quiet });
        if (ghostRing > 0.01) houseBell(c, env, { x: bx + 14, y: by, s: 0.32, swing: bellSwing(t, b.exactly + 0.7, 0.3), ring: ghostRing, alpha: 0.3 * ghostRing });
      }
    }
  },
});
