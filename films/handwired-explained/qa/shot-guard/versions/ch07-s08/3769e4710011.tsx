/**
 * ch07-s08 — FAR-OFF PHOTOS VOTE (plate, dawnGold; crossfade in; 10.83 s on the locked clock).
 *   L0716 "Each photo's edges pull toward its rectangle, but every pull is capped."
 *   L0717 "Far-off photos vote. They don't shout."
 *
 * TEACHING MACHINE, the Huber clamp (art department 24), inked on the parchment plate the film's plates share
 * (sets/ch03-s02-plate). A brass bar across the top of the plate is the gallery's 'left' output bias, b; a pointer on
 * the bar reads 0.5 on its scale. Under it hang twenty small springs, two per rectangle (each rectangle's left edge and
 * right edge: this one bias moves both), each ending in a tiny photo edge. A spring's stretch is that edge's error:
 * the real errors of the Story sketch against the seeded pile, at step 0 (sets/data/ch07-s06-gallery.json; DG26).
 *
 * TEACHES, word by word:
 *   pull (1.91)     the twenty springs tension, each to its edge's error (photos far from their sketches stretch far)
 *   capped (4.54)   a brass collar slides down every spring to 0.08 and clicks: above it the coil keeps 0.08 of pull,
 *                   below it the rest of the stretch hangs as slack thread (a spring three times longer pulls no
 *                   harder); the camera eases in a little; the gradient inks in beneath
 *   vote (6.82)     each spring's capped pull rises onto the bar as a small arrow, left or right, and the arrows slide
 *                   into a tally either side of the pointer: two long rows, nearly equal, cancel to a small net tug
 *   shout (7.51)    one step: the bar moves one notch, the pointer from 0.5 to about 0.492 (Adam's first step is about
 *                   the learning rate whatever the pull's size: DG27); the step inks, labelled derived
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardInkAlpha, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { plateBack, plateInk, plateNear, plateRule } from '../sets/ch03-s02-plate';
import { GAL, PHOTO_BAKE, brassOf, photoArt, px, seg, twos } from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
const ID = 'ch07-s08';

// ------------------------------------------------------------------ the machine (L4 rest px on the plate)
const BAR = { x0: 150, x1: 1130, y: 168, h: 15 };
const SCALE = { y: 128, notch: 20 };
const CX = 640;
/** px of spring stretch per unit of edge error (a fraction of the stage) */
const S = 560;
const REST = 34;
const CAP = 0.08;
/** px of tally arrow per unit of capped pull */
const A = 260;
/** the twenty springs: per rectangle, its left edge and its right edge (the order of the Story preset) */
const SPRINGS = GAL.springs.flatMap((sp, i) => {
  const gx = 214 + i * 94;
  return [
    { x: gx - 17, e: sp.eL, edge: 'L' as const, photo: sp.o, id: `${i}L` },
    { x: gx + 17, e: sp.eR, edge: 'R' as const, photo: sp.o, id: `${i}R` },
  ];
});
const clip = (e: number) => Math.max(-CAP, Math.min(CAP, e));
const LEFT_SUM = SPRINGS.filter((s) => s.e > 0).reduce((a, s) => a + clip(s.e), 0);
const RIGHT_SUM = SPRINGS.filter((s) => s.e < 0).reduce((a, s) => a - clip(s.e), 0);

interface Beats {
  springs: number;
  cap: number;
  vote: number;
  shout: number;
  D: number;
}
const CAM_A: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const CAM_B: Camera3 = { x: 640, y: 318, z: 70, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = { springs: T.beat('springs'), cap: T.beat('cap'), vote: T.beat('vote'), shout: T.word('L0717', 'shout'), D: T.duration };
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: b.cap - 0.6, dur: 3.2, ease: (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u) });
    tl.hold(0, T.duration);
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(s.get(sc.cam));
    plateBack(f, { key: ID, near: 'dividers', lamp: { x: 260, y: 70 } });
    f.layer('L4', (c, env) => {
      scaleAndPointer(c, env, t, b);
      springs(f, c, env, t, tq, b);
      tally(c, env, t, b);
      equations(c, env, t, b);
    });
    f.practical({ x: 250, y: 40, kind: 'lamp', seed: 81, intensity: 0.55, radius: 90 });
    plateNear(f, { key: ID, near: 'dividers' });
  },
});

// ------------------------------------------------------------------ the bar, its scale and the pointer
/** the bar's offset: one notch left on 'shout' (0.5 → 0.492) */
const barShift = (t: number, b: Beats) => -SCALE.notch * seg(twos(t), b.shout - 0.04, b.shout + 0.2);
function scaleAndPointer(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ink = plateInk(env);
  // the scale: fine ticks a notch apart, the centre tick long
  c.save();
  c.strokeStyle = withAlpha(ink, 0.7);
  for (let i = -9; i <= 9; i++) {
    const x = CX + i * SCALE.notch;
    const long = i === 0;
    c.lineWidth = px(c, long ? 2 : 1.3);
    c.beginPath();
    c.moveTo(x, SCALE.y);
    c.lineTo(x, SCALE.y + (long ? 20 : i % 5 === 0 ? 14 : 9));
    c.stroke();
  }
  c.lineWidth = px(c, 1.2);
  c.beginPath();
  c.moveTo(CX - 9.5 * SCALE.notch, SCALE.y);
  c.lineTo(CX + 9.5 * SCALE.notch, SCALE.y);
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 30px ${FONT.text}`, 30);
    c.font = `500 ${size}px ${FONT.text}`;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.fillText('0.5', CX, SCALE.y - 10);
    textProbe(c, `${ID}-scale`, CX - size, SCALE.y - 10 - size, size * 2, size * 1.2, 1);
    const bs = legibleSize(c, `italic 500 38px ${FONT.text}`, 38);
    c.font = `italic 500 ${bs}px ${FONT.text}`;
    c.textAlign = 'right';
    c.fillText('b', BAR.x0 - 16, BAR.y + BAR.h * 0.9);
    textProbe(c, `${ID}-b`, BAR.x0 - 16 - bs * 0.6, BAR.y - bs * 0.6, bs * 0.6, bs, 1);
  });
  c.restore();
  // the bar (brass) slides with b; the pointer rides on it
  const dx = barShift(t, b);
  c.save();
  c.translate(dx, 0);
  const g = c.createLinearGradient(0, BAR.y, 0, BAR.y + BAR.h);
  g.addColorStop(0, brassOf(env, 0.75));
  g.addColorStop(0.5, brassOf(env, 0.15));
  g.addColorStop(1, mixLab(brassOf(env, 0), '#2a1d14', 0.5));
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(BAR.x0, BAR.y, BAR.x1 - BAR.x0, BAR.h, 4);
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = px(c, 1.2);
  c.stroke();
  // end caps
  for (const x of [BAR.x0, BAR.x1]) {
    c.fillStyle = mixLab(brassOf(env, 0.2), '#2a1d14', 0.4);
    c.beginPath();
    c.arc(x, BAR.y + BAR.h / 2, BAR.h * 0.75, 0, Math.PI * 2);
    c.fill();
  }
  // pointer: a brass needle from the bar up to the scale
  c.fillStyle = mixLab(brassOf(env, 0.3), '#2a1d14', 0.35);
  c.beginPath();
  c.moveTo(CX - 7, BAR.y + 2);
  c.lineTo(CX + 7, BAR.y + 2);
  c.lineTo(CX + 1.6, SCALE.y + 4);
  c.lineTo(CX - 1.6, SCALE.y + 4);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(CX, BAR.y + BAR.h / 2, 6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------ the springs
function coil(c: C2, x: number, y0: number, y1: number, turns: number, w: number) {
  const L = y1 - y0;
  c.beginPath();
  c.moveTo(x, y0);
  const lead = Math.min(5, L * 0.12);
  c.lineTo(x, y0 + lead);
  const n = turns * 2;
  for (let i = 0; i <= n; i++) {
    const y = y0 + lead + ((L - 2 * lead) * i) / n;
    c.lineTo(x + (i === 0 || i === n ? 0 : i % 2 ? w : -w), y);
  }
  c.lineTo(x, y1);
  c.stroke();
}
function springs(f: { cached: (k: string, w: number, h: number, d: (c: C2) => void) => (c: C2, x: number, y: number) => void }, c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = plateInk(env);
  const dx = barShift(t, b);
  SPRINGS.forEach((sp, i) => {
    const top = BAR.y + BAR.h;
    // tension in, staggered a little, on twos
    const pu = seg(tq, b.springs - 0.1 + i * 0.03, b.springs + 0.75 + i * 0.03);
    const stretch = Math.abs(sp.e) * S * pu;
    const capped = Math.abs(sp.e) > CAP;
    const capAt = b.cap - 0.12 + i * 0.022;
    const cu = capped ? seg(tq, capAt, capAt + 0.18) : 0;
    const x = sp.x + dx;
    const bottom = top + REST + stretch;
    const coilEnd = capped ? top + REST + Math.min(stretch, Math.max(CAP * S, stretch * (1 - cu) + CAP * S * cu)) : bottom;
    c.save();
    c.strokeStyle = withAlpha(ink, 0.85);
    c.lineWidth = px(c, 1.5);
    coil(c, x, top, coilEnd, 7, 5);
    if (bottom - coilEnd > 0.5) {
      // the slack: a plain thread, hanging loose past the collar
      c.strokeStyle = withAlpha(ink, 0.5);
      c.lineWidth = px(c, 1.1);
      c.setLineDash([px(c, 5), px(c, 3)]);
      c.beginPath();
      c.moveTo(x, coilEnd);
      c.quadraticCurveTo(x + 4, (coilEnd + bottom) / 2, x, bottom);
      c.stroke();
      c.setLineDash([]);
    }
    // the collar: a brass bead that slides down to 0.08 and clicks (a small flash as it seats)
    if (capped && cu > 0) {
      const cy = lerpN(top + 4, coilEnd, cu);
      const flash = Math.max(0, 1 - Math.abs(tq - (capAt + 0.18)) / 0.12);
      c.fillStyle = mixLab(brassOf(env, 0.4 + flash * 0.6), '#2a1d14', 0.25);
      c.fillRect(x - 7, cy - 3, 14, 6);
      c.strokeStyle = withAlpha(ink, 0.7);
      c.lineWidth = px(c, 1);
      c.strokeRect(x - 7, cy - 3, 14, 6);
    }
    // the hook on the bar
    c.fillStyle = ink;
    c.beginPath();
    c.arc(x, top + 1, 2.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    // the tiny photo edge at the bottom: a corner of photo k, its left or right edge inked heavy
    const art = f.cached(`ch07-s06/photo${sp.photo}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, sp.photo, PHOTO_BAKE.w, PHOTO_BAKE.h));
    const pw = 26, ph = 20;
    const px0 = sp.edge === 'L' ? x : x - pw;
    c.save();
    c.beginPath();
    c.rect(px0, bottom, pw, ph);
    c.clip();
    c.translate(px0 - (sp.edge === 'L' ? 0 : PHOTO_BAKE.w * 0.3 - pw), bottom);
    c.scale(0.3, 0.3);
    art(c, 0, 0);
    c.restore();
    c.strokeStyle = withAlpha(ink, 0.55);
    c.lineWidth = px(c, 1);
    c.strokeRect(px0, bottom, pw, ph);
    c.strokeStyle = ink;
    c.lineWidth = px(c, 2.6);
    c.beginPath();
    c.moveTo(x, bottom - 1);
    c.lineTo(x, bottom + ph + 1);
    c.stroke();
  });
  // the faint rule where every spring's 0.08 sits
  const ru = seg(t, b.cap + 0.3, b.cap + 0.9);
  if (ru > 0) {
    const y = BAR.y + BAR.h + REST + CAP * S;
    c.save();
    c.strokeStyle = plateRule(env, 0.3 * ru);
    c.lineWidth = px(c, 1);
    c.setLineDash([px(c, 2), px(c, 5)]);
    c.beginPath();
    c.moveTo(BAR.x0 + 20, y);
    c.lineTo(BAR.x1 - 20, y);
    c.stroke();
    c.restore();
  }
}
const lerpN = (a: number, z: number, u: number) => a + (z - a) * u;

// ------------------------------------------------------------------ the tally on the bar
function tally(c: C2, env: PaintEnv, t: number, b: Beats) {
  const rise = seg(t, b.vote - 0.12, b.vote + 0.12);
  if (rise <= 0) return;
  const slide = seg(t, b.vote + 0.08, b.shout - 0.25);
  const cancel = seg(t, b.shout - 0.3, b.shout - 0.05);
  const dx = barShift(t, b);
  const y = BAR.y + BAR.h / 2;
  const ink = plateInk(env);
  const red = mixLab('#8a3d14', ink, 0.25);
  // two rows grow from the pointer: arrows pointing left (edges too far right) and right
  let accL = 0, accR = 0;
  c.save();
  c.globalAlpha = rise * (1 - 0.85 * cancel);
  for (const sp of SPRINGS) {
    const len = Math.abs(clip(sp.e)) * A;
    const dir = sp.e > 0 ? -1 : 1;
    // start: just above the spring's hook; end: end-to-end in its row, from the pointer outward
    const startX = sp.x + dx - (dir * len) / 2;
    const rowX = dir < 0 ? CX + dx - accL : CX + dx + accR;
    if (dir < 0) accL += len;
    else accR += len;
    const x0 = lerpN(startX, rowX, slide);
    const yy = lerpN(BAR.y - 14, y + (dir < 0 ? -4 : 4), slide);
    arrow(c, x0, yy, dir, len, sp.e > 0 ? ink : red, px(c, 2.2));
  }
  c.restore();
  // the net: what is left when the rows cancel, a small tug to the left
  if (cancel > 0) {
    const net = (LEFT_SUM - RIGHT_SUM) * A;
    c.save();
    c.globalAlpha = cancel * (1 - seg(t, b.shout + 1.4, b.shout + 2.2) * 0.4);
    arrow(c, CX + dx, y - 22, -1, net, ink, px(c, 3.2));
    c.restore();
  }
}
function arrow(c: C2, x0: number, y: number, dir: number, len: number, col: string, w: number) {
  if (len < 0.5) return;
  const x1 = x0 + dir * len;
  const hd = Math.min(7, len * 0.45);
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x1 - dir * hd * 0.6, y);
  c.stroke();
  c.beginPath();
  c.moveTo(x1, y);
  c.lineTo(x1 - dir * hd, y - hd * 0.55);
  c.lineTo(x1 - dir * hd, y + hd * 0.55);
  c.closePath();
  c.fill();
}

// ------------------------------------------------------------------ the two inked lines
function equations(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ink = plateInk(env);
  const lines = [
    { text: '∂L/∂b = (1/40) Σ [clip(e_left) + clip(e_right)] · clip ±0.08', at: b.cap + 0.05, y: 548, size: 34 },
    { text: 'Adam: b 0.5 → ≈ 0.492 (derived)', at: b.shout + 0.05, y: 604, size: 32 },
  ];
  textRole(c, 'subject', () => {
    for (const L of lines) {
      const a = cardInkAlpha(t, L.at, 0.35);
      if (a <= 0.003) continue;
      const size = legibleSize(c, `italic 500 ${L.size}px ${FONT.text}`, L.size);
      c.font = `italic 500 ${size}px ${FONT.text}`;
      c.textAlign = 'center';
      c.fillStyle = withAlpha(ink, a);
      // the line inks left to right like a pen
      const w = c.measureText(L.text).width;
      const reveal = seg(t, L.at, L.at + 0.6);
      c.save();
      c.beginPath();
      c.rect(CX - w / 2 - 4, L.y - size, (w + 8) * reveal, size * 1.4);
      c.clip();
      c.fillText(L.text, CX, L.y);
      c.restore();
      textProbe(c, `${ID}-eq-${L.y}`, CX - w / 2, L.y - size, w, size * 1.25, a * reveal);
    }
  });
}
