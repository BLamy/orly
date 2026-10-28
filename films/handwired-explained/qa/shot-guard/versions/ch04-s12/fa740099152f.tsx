/**
 * ch04-s12 — THE DETENT (plate, parchment; crossfade in from the cold ruler; 17.8 s). Machine 4, the boolean atom;
 * pays ch03-s05's silent plant (8,388,609 on its third row).
 * L0423 "Another way to make a bit, in one instruction: add a huge odd number to a score, then take it away."
 * L0424 "Up there floats sit one apart, so the score snaps whole. Ties go to the even side: a half snaps up, to one."
 *
 * The giant ruler of ch04-s07 is redrawn in ink on the lamp-lit plate (sets/ch04-s12-plate) as the blue light warms
 * back to paper, and it slides back DOWN (the numbers racing, the ticks blurring) from just past 16,777,216 to
 * 8,388,608 … 8,388,611, where every tick is one apart again (FP32 at 2^23: spacing 1), scaled up to 300 px a unit.
 *
 * TEACHES, word by word (every value COMPUTED in FP32 with Math.fround: f(f(score + 8,388,609) − 8,388,609)):
 *   0-2.85     the slide; the 2-apart ticks vanish below 2^24; odd ticks settle HOLLOW, even ticks FILLED
 *   'add'      a fine 0-to-1 ruler slides onto the giant one, its 0 on the 8,388,609 mark, carrying the score's pointer
 *   'odd'      '8,388,609 = 2²³ + 1' inks; the inset of ch03-s05's third row: its two 8,388,609s glow faintly copper
 *   'one apart' a copper bracket spans 8,388,609 → 8,388,610: one tick, one apart
 *   → 'snaps'  the pointer slides to 0.49999997 ('0.49999997'), and is caught by the nearest tick: it snaps back to
 *              8,388,609 (' → 0'); the fine ruler slides away
 *   'Ties'     it returns; the pointer slides to exactly 0.5 and stops halfway between the hollow odd tick and the
 *              filled even tick (' · 0.5 → 8,388,609.5'); on 'even' the filled tick warms
 *   'up'       the pointer snaps to 8,388,610 (' → 8,388,610'); on 'one' the bracket glows (' → 1')
 * Camera: still through the slide, then a slow push (z 0 → 62, about 6 %) so the ruler fills the width. Text: the two
 * equations (one per beat), the inset's row (legible, three lines) and the ruler's numerals.
 *
 * Review r1: the ruler block sits 60 px lower with the result line 40 px under it, a lamp falloff darkens the bottom
 * corners; the inset is set in three legible lines; 'add' brings the fine ruler in FROM THE LEFT on a copper arrow and
 * 'away' sends a ghost of it back out to the left on a reversed arrow (add, then subtract); the 0.49999997 pointer stops
 * visibly SHORT of a copper caret on the fine ruler's midline (the tie stops ON it); 'up' lands at 15.77 + 0.3 and the
 * '→ 1' is inked by 16.2.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cardPaperAlpha, cardProbe, defineShot, ghostOk, mixLab, textProbe, withAlpha } from '../../../film';
import type { Frame } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from '../sets/narratorHands';
import { COPPER_INK, INK, PLATE_INK, coldWash, inkSegments, inkText, plateNear, plateRoom } from '../sets/ch04-s12-plate';

const ID = 'ch04-s12';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const f32 = Math.fround;

// ---------------------------------------------------------------- the maths (FP32)
const TWO23 = 8388608;
const TWO24 = 16777216;
const ODD = TWO23 + 1; // 8,388,609
const boolean = (score: number) => f32(f32(f32(score) + ODD) - ODD);
const S_LOW = f32(0.49999997);
const MID = f32(S_LOW + ODD); // the sum the hardware keeps: 8,388,609
const R_LOW = boolean(S_LOW); // 0
const R_TIE = boolean(0.5); // 1 (8,388,609.5 is a tie; round to even: 8,388,610)
const TIE_SUM = f32(0.5 + ODD); // 8,388,610
const commas = (n: number) => {
  const [i, d] = String(n).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? `.${d}` : '');
};
const fmt = (v: number) => String(Number(v.toPrecision(8)));

// ---------------------------------------------------------------- geometry (plate rest px)
const V1 = ODD + 0.5; // the settled view centre: between the odd and the even tick
const UNIT1 = 300;
const RY1 = 382, RH1 = 124; // the inked ruler's top and height at rest (review r1: 60 px lower)
const RES_Y = RY1 + RH1 + 64; // the result line's baseline, 40 px under the ruler
/** where ch04-s07's last frame left its ruler (scale 0.8 after the pull-back) */
const V0 = TWO24 + 4.1, UNIT0 = 102.4, RY0 = 400, RH0 = 136;
const FINE = { y: RY1 - 60, h: 44 };
const xAt = (n: number, v: number, unit: number) => 640 + (n - v) * unit;

interface Beats {
  add: number;
  away: number;
  odd: number;
  apart: number;
  snap: number;
  slideTo: number;
  tie: number;
  even: number;
  up: number;
  one: number;
  end: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      add: T.beat('add'),
      away: T.word('L0423', 'away'),
      odd: T.beat('odd'),
      apart: T.word('L0424', 'one'),
      snap: T.beat('snap'),
      slideTo: T.beat('snap') - 0.8,
      tie: T.beat('tie'),
      even: T.word('L0424', 'even'),
      up: T.beat('up'),
      // review r1: the '→ 1' is inked by 16.2 (the snap lands at 'up' + 0.3)
      one: T.beat('up') + 0.12,
      end: D,
    };
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam: Camera3 = { ...CAMERA3_HOME, x: 640 + 10 * win(t, 3, 17.8), z: 26 * win(t, 2.9, 7.8) + 36 * win(t, 7.6, 17.8) };
    f.camera(cam);
    plateRoom(f, { key: ID });
    f.layer(PLATE_INK, (c, env) => {
      const sl = slide(t);
      ruler(c, env, t, tq, b, sl);
      if (sl.u >= 0.999) fineRuler(c, env, t, tq, b);
      equations(c, env, t, b);
      inset(c, env, t, b);
    });
    plateNear(f, ID);
    lampFalloff(f);
    coldWash(f, 1 - sm((t + 0.5) / 2.6));
  },
});

// ---------------------------------------------------------------- the slide back down the ruler
function slide(t: number) {
  const u = clamp01((t - 0.25) / 2.6);
  const e = (1 - Math.cos(Math.PI * u)) / 2;
  const s = sm(u);
  // log-spaced value: most of the 8 million passes in the middle of the move (the numbers race)
  const v = Math.exp(lerp(Math.log(V0), Math.log(V1), e));
  const unit = lerp(UNIT0, UNIT1, s);
  const du = 1e-3;
  const u2 = clamp01(u + du);
  const v2 = Math.exp(lerp(Math.log(V0), Math.log(V1), (1 - Math.cos(Math.PI * u2)) / 2));
  const speed = Math.abs(v2 - v) / (du * 2.6) * unit; // px/s
  return { u, v: u >= 1 ? V1 : v, unit, ry: lerp(RY0, RY1, s), rh: lerp(RH0, RH1, s), blur: clamp01(speed / 2500) };
}

function ruler(c: C, env: PaintEnv, t: number, tq: number, b: Beats, sl: ReturnType<typeof slide>) {
  const { v, unit, ry, rh, blur } = sl;
  // the paper strip, inked round its edge (hand-ruled)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(64, ry + 5, 1160, rh);
  c.fillStyle = mixLab('#f4ead5', env.mood.core, 0.15);
  c.fillRect(60, ry, 1160, rh);
  c.strokeStyle = withAlpha(INK, 0.85);
  c.lineWidth = 1.6;
  c.strokeRect(60, ry, 1160, rh);
  // the strip always carries its ticks (ink), even while its numerals race past
  cardProbe(c, `${ID}/ruler`, 60, ry, 1160, rh, 1, 1);
  c.save();
  c.beginPath();
  c.rect(60, ry - 2, 1160, rh + 4);
  c.clip();
  // the motion of the slide: soft streaks along the strip while the numbers race
  if (blur > 0.05) {
    c.fillStyle = withAlpha(INK, 0.12 * blur);
    for (let i = 0; i < 6; i++) c.fillRect(60, ry + 8 + i * 6, 1160, 1.2);
  }
  const n0 = Math.floor(v - 700 / unit), n1 = Math.ceil(v + 700 / unit);
  const caps = win(t, 2.7, 3.2);
  for (let n = n0; n <= n1; n++) {
    const exists = n <= TWO24 || n % 2 === 0;
    if (!exists) continue;
    const x = xAt(n, v, unit);
    if (x < 50 || x > 1230) continue;
    const even = n % 2 === 0;
    const len = rh * (even ? 0.44 : 0.36);
    c.fillStyle = withAlpha(INK, 1 - 0.7 * blur);
    c.fillRect(x - 1.8 - blur * 6, ry, 3.6 + blur * 12, len);
    // odd ticks end HOLLOW, even ticks FILLED (the tie goes to the filled one)
    if (caps > 0) {
      const warm = n === ODD + 1 ? win(t, b.even - 0.1, b.even + 0.4) : 0;
      c.save();
      c.globalAlpha *= caps;
      if (even) {
        c.fillStyle = warm > 0 ? mixLab(INK, COPPER_INK, warm) : INK;
        c.beginPath();
        c.arc(x, ry + len + 7, 7, 0, Math.PI * 2);
        c.fill();
        if (warm > 0) {
          const g = c.createRadialGradient(x, ry + len + 7, 2, x, ry + len + 7, 40);
          g.addColorStop(0, withAlpha(copperOf(env, 0.8), 0.45 * warm));
          g.addColorStop(1, withAlpha(copperOf(env, 0.8), 0));
          c.fillStyle = g;
          c.fillRect(x - 40, ry + len - 33, 80, 80);
        }
      } else {
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(x, ry + len + 7, 6, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
    // numerals: every tick once settled (even ones only while the ticks are crowded)
    const la = (1 - blur) * (unit > 200 || even ? 1 : 0);
    if (la > 0.02) inkText(c, commas(n), x, ry + rh - 16, { size: unit > 200 ? 27 : 20, align: 'center', alpha: la * 0.92, role: unit > 200 ? 'subject' : 'texture' });
  }
  c.restore();
  // the bracket: one tick, one apart (on 'one apart'; again on 'to one', where the result reads 1)
  const br = Math.max(win(t, b.apart - 0.2, b.apart + 0.25) * (1 - win(t, b.apart + 1.1, b.apart + 1.6)), win(t, b.one - 0.15, b.one + 0.2));
  if (br > 0 && sl.u >= 1) {
    const y = RY1 + RH1 + 16;
    const xa = xAt(ODD, V1, UNIT1), xb = xAt(ODD + 1, V1, UNIT1);
    c.save();
    c.globalAlpha *= br;
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(xa, y - 10);
    c.lineTo(xa, y);
    c.lineTo(xb, y);
    c.lineTo(xb, y - 10);
    c.stroke();
    c.strokeStyle = copperOf(env, 0.4 + 0.5 * win(t, b.one - 0.1, b.one + 0.3));
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  }
  void tq;
}

// ---------------------------------------------------------------- the fine ruler and the score's pointer
/** the fine ruler's pose: on 'add' it slides in FROM THE LEFT (the huge odd number added) and lifts away after the
 *  snap; for the tie it drops in from above and lifts away after 'one' */
function finePose(t: number, b: Beats): { a: number; dx: number; lift: number } {
  const inA = win(t, b.add - 0.45, b.add + 0.2);
  const outA = win(t, b.snap + 0.45, b.snap + 0.9);
  if (t < b.snap + 1.0) return { a: clamp01(inA * 3) * (1 - outA), dx: -(1 - inA) * 820, lift: outA * 160 };
  const inB = win(t, b.tie - 0.55, b.tie - 0.1) * (1 - win(t, b.one + 0.7, b.one + 1.2));
  return { a: inB, dx: 0, lift: (1 - inB) * 160 };
}
/** the score the pointer stands on, on twos (0..1 along the fine ruler) */
function score(tq: number, b: Beats) {
  if (tq < b.slideTo) return 0;
  if (tq < b.snap) return S_LOW * sm((tq - b.slideTo) / 0.65);
  if (tq < b.tie - 0.55) return R_LOW; // caught by the nearest tick: back to the start (result 0)
  if (tq < b.tie - 0.1) return 0;
  if (tq < b.up) return 0.5 * sm((tq - (b.tie - 0.05)) / 0.5);
  return lerp(0.5, R_TIE, sm((tq - b.up) / 0.3)); // snaps up to the even tick (result 1), landing at 'up' + 0.3
}
/** where the pointer is DRAWN: 0.49999997 stops visibly short of the midline (magnified: the true gap is 3e-8) */
function scoreVis(s: number, tq: number, b: Beats) {
  return tq < b.tie - 0.55 && s > 0 ? s * (0.47 / S_LOW) : s;
}
function fineRuler(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  arrows(c, env, t, b);
  const pose = finePose(t, b);
  const a = pose.a;
  if (a <= 0.001) return;
  const x0 = xAt(ODD, V1, UNIT1) + pose.dx, x1 = xAt(ODD + 1, V1, UNIT1) + pose.dx;
  const y = FINE.y - pose.lift;
  c.save();
  c.globalAlpha *= a;
  // the strip, its tenths, 0 and 1 at the ends (its own scale: texture)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x0 - 16 + 3, y + 4, x1 - x0 + 32, FINE.h);
  c.fillStyle = mixLab('#fbf3e2', env.mood.core, 0.2);
  c.fillRect(x0 - 16, y, x1 - x0 + 32, FINE.h);
  c.strokeStyle = INK;
  c.lineWidth = 1.2;
  c.strokeRect(x0 - 16, y, x1 - x0 + 32, FINE.h);
  c.beginPath();
  for (let k = 0; k <= 10; k++) {
    const x = lerp(x0, x1, k / 10);
    const h = k % 5 === 0 ? FINE.h * 0.55 : FINE.h * 0.3;
    c.moveTo(x, y + FINE.h);
    c.lineTo(x, y + FINE.h - h);
  }
  c.stroke();
  inkText(c, '0', x0 - 8, y + 16, { size: 15, align: 'center', role: 'texture', alpha: 0.85 });
  inkText(c, '1', x1 + 8, y + 16, { size: 15, align: 'center', role: 'texture', alpha: 0.85 });
  // the score's pointer: a black wedge from the fine ruler down onto the giant ruler, a copper bead on its head
  const s = score(tq, b);
  const snapKick = (at: number) => (tq >= at && tq < at + 2 / 12 ? 1 : 0);
  const kick = snapKick(b.snap) || snapKick(b.up + 0.3);
  const px = lerp(x0, x1, scoreVis(s, tq, b));
  // the midline caret (copper): 0.49999997 stops just short of it, the tie stops on it
  const mid = (x0 + x1) / 2;
  const caret = Math.max(win(t, b.slideTo + 0.3, b.slideTo + 0.6) * (1 - win(t, b.snap + 0.2, b.snap + 0.5)), win(t, b.tie, b.tie + 0.3) * (1 - win(t, b.up, b.up + 0.3)));
  if (caret > 0) {
    c.fillStyle = withAlpha(COPPER_INK, caret);
    c.beginPath();
    c.moveTo(mid, y + FINE.h + 1);
    c.lineTo(mid - 8, y + FINE.h + 13);
    c.lineTo(mid + 8, y + FINE.h + 13);
    c.closePath();
    c.fill();
    // 'just short': a small gap bracket between the pointer's tip line and the caret
    const gapA = caret * win(t, b.slideTo + 0.65, b.slideTo + 0.8) * (tq < b.snap ? 1 : 0);
    if (gapA > 0 && mid - px > 3) {
      c.strokeStyle = withAlpha(COPPER_INK, gapA);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(px, y + FINE.h + 6);
      c.lineTo(px, y + FINE.h + 18);
      c.moveTo(px, y + FINE.h + 12);
      c.lineTo(mid - 2, y + FINE.h + 12);
      c.stroke();
    }
  }
  const py = y - 26 - kick * 3;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(px - 12, py);
  c.lineTo(px + 12, py);
  c.lineTo(px + 2.6, RY1 - 3);
  c.lineTo(px - 2.6, RY1 - 3);
  c.closePath();
  c.fill();
  const glow = Math.max(win(t, b.snap - 0.05, b.snap + 0.2) * (1 - win(t, b.snap + 0.6, b.snap + 1)), win(t, b.up - 0.05, b.up + 0.2));
  c.fillStyle = copperOf(env, 0.4 + 0.5 * glow);
  c.beginPath();
  c.arc(px, py - 8, 9.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the two equations (one per beat, inked term by term)
function equations(c: C, env: PaintEnv, t: number, b: Beats) {
  const ink = (at: number) => win(t, at, at + 0.3);
  // 8,388,609 = 2²³ + 1  (top left, on 'odd')
  // eq1 and the inset clear in the last half second: ch04-s13 opens on the ruler and the result line alone
  const clear = 1 - win(t, b.end - 0.55, b.end - 0.1);
  const e1 = ink(b.odd - 0.1) * clear;
  if (e1 > 0) {
    // one equation in runs (the exponent is raised): a deliberate overlap inside its own probe
    ghostOk(c, () => {
      let x = 104;
      const y = 168;
      x += inkText(c, commas(ODD), x, y, { size: 42, alpha: e1 });
      x += inkText(c, ' = 2', x, y, { size: 42, alpha: e1 });
      x += inkText(c, '23', x + 1, y - 18, { size: 24, alpha: e1 });
      x += inkText(c, ' + 1', x + 3, y, { size: 42, alpha: e1 });
      textProbe(c, `${ID}/eq1`, 104, y - 34, x - 104, 42, e1);
    });
  }
  // 0.49999997 → 0   ·   0.5 → 8,388,609.5 → 8,388,610 → 1  (under the ruler, term by term)
  const segs = [
    { text: fmt(S_LOW), a: ink(b.slideTo) },
    { text: ` → ${fmt(R_LOW)}`, a: ink(b.snap) },
    { text: '   ·   0.5', a: ink(b.tie) },
    { text: ` → ${commas(ODD + 0.5)}`, a: ink(b.tie + 0.45) },
    { text: ` → ${commas(TIE_SUM)}`, a: ink(b.up) },
    { text: ` → ${fmt(R_TIE)}`, a: ink(b.one), color: mixLab(INK, COPPER_INK, win(t, b.one, b.one + 0.3)) },
  ];
  if (segs[0].a > 0) inkSegments(c, segs, 640, RES_Y, { size: 29, align: 'center', id: `${ID}/eq2` });
  void env;
  void MID;
}

// ---------------------------------------------------------------- the inset: ch03-s05's third row, paid
function inset(c: C, env: PaintEnv, t: number, b: Beats) {
  const inAt = b.odd - 0.55;
  const paper = cardPaperAlpha(t, inAt, 0.4) * (1 - win(t, b.end - 0.55, b.end - 0.1));
  if (paper <= 0.001) return;
  const ink = win(t, inAt, inAt + 0.3);
  const glow = win(t, b.odd - 0.1, b.odd + 0.5) * (1 - 0.4 * win(t, b.odd + 2.5, b.odd + 4));
  const x = 704, y = 62, w = 486, h = 168;
  c.save();
  c.globalAlpha *= paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(x + 3, y + 4, w, h);
  c.fillStyle = mixLab('#efe2c6', env.mood.set, 0.12);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha(INK, 0.6);
  c.lineWidth = 1;
  c.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
  c.globalAlpha = 1;
  cardProbe(c, `${ID}/inset`, x, y, w, h, paper, ink * paper);
  // the toothed detent wheel (the row's paper object)
  const wx = x + 44, wy = y + h / 2;
  c.fillStyle = withAlpha(INK, ink * paper);
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 27 : 22;
    if (i === 0) c.moveTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r);
    else c.lineTo(wx + Math.cos(a) * r, wy + Math.sin(a) * r);
  }
  c.closePath();
  c.arc(wx, wy, 7, 0, Math.PI * 2);
  c.fill('evenodd');
  // the engraved row, as ch03-s05 set it, in three legible lines (review r1); its two 8,388,609s glow copper
  const o = { size: 24 };
  const a = ink * paper;
  const hot = mixLab(INK, COPPER_INK, glow);
  inkText(c, 'boolean(score) =', x + 88, y + 46, { ...o, alpha: a, id: `${ID}/inset0` });
  inkSegments(c, [
    { text: 'f(f(f(score) + ', a },
    { text: commas(ODD), a, color: hot },
    { text: ')', a },
  ], x + 88, y + 92, { ...o, id: `${ID}/inset1` });
  inkSegments(c, [
    { text: '   − ', a },
    { text: commas(ODD), a, color: hot },
    { text: ')', a },
  ], x + 88, y + 136, { ...o, id: `${ID}/inset2` });
  if (glow > 0) {
    const g = c.createRadialGradient(x + w * 0.62, y + 60, 4, x + w * 0.62, y + 60, 160);
    g.addColorStop(0, withAlpha(copperOf(env, 0.8), 0.16 * glow * paper));
    g.addColorStop(1, withAlpha(copperOf(env, 0.8), 0));
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
  }
  c.restore();
}

// ---------------------------------------------------------------- add, then subtract: the copper arrows on 'add' and 'away'
function arrows(c: C, env: PaintEnv, t: number, b: Beats) {
  const xs = 72, x0 = xAt(ODD, V1, UNIT1);
  const y = RY1 - 9;
  const head = (x: number, dir: number, a: number) => {
    c.fillStyle = withAlpha(COPPER_INK, a);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - dir * 13, y - 7);
    c.lineTo(x - dir * 13, y + 7);
    c.closePath();
    c.fill();
  };
  // 'add': the arrow runs right with the fine ruler, from the plate's left edge to the 8,388,609 mark
  const ga = win(t, b.add - 0.45, b.add + 0.2);
  const fa = ga * (1 - win(t, b.add + 0.9, b.add + 1.5));
  if (fa > 0.001) {
    const xe = lerp(xs, x0, ga);
    c.strokeStyle = withAlpha(COPPER_INK, 0.85 * fa);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(xs, y);
    c.lineTo(xe - 10, y);
    c.stroke();
    head(xe, 1, 0.85 * fa);
  }
  // 'away': a ghost of the fine ruler slides back out to the left on a reversed arrow (the same number taken away)
  const u = win(t, b.away - 0.3, b.away + 0.45);
  const fb = u * (1 - win(t, b.away + 0.7, b.away + 1.2));
  if (fb > 0.001) {
    const xe = lerp(x0, xs, u);
    c.strokeStyle = withAlpha(COPPER_INK, 0.85 * fb);
    c.lineWidth = 3;
    c.setLineDash([9, 6]);
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(xe + 10, y);
    c.stroke();
    c.setLineDash([]);
    head(xe, -1, 0.85 * fb);
    const gx = xe - 16, gw = UNIT1 + 32;
    c.strokeStyle = withAlpha(INK, 0.55 * fb);
    c.setLineDash([6, 5]);
    c.lineWidth = 1.4;
    c.strokeRect(gx, FINE.y, gw, FINE.h);
    c.setLineDash([]);
  }
  void env;
}

/** the lamp's falloff: the bottom corners of the plate sink into shadow (screen-locked) */
function lampFalloff(f: Frame) {
  const c = f.c;
  c.save();
  for (const x of [0, 1280]) {
    const g = c.createRadialGradient(x, 740, 30, x, 740, 560);
    g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.5));
    g.addColorStop(0.55, withAlpha(PUPPET_NEAR_BLACK, 0.18));
    g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
    c.fillStyle = g;
    c.fillRect(x - 560, 180, 1120, 560);
  }
  c.restore();
}
