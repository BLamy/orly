/**
 * ch05-s02 — the Candle, as arithmetic: a parchment Candle Ruler (parchment, paper-fold in from the terrace).
 *
 * workerd ONLY (engraved badge 'workerd · 28 Oct', top-right): an engraved tall candle beside a vertical scale in
 * milliseconds as the owner's clock runs, 0 at the top to 20,000 at the foot (an illustrative expiry at 20,000 ms).
 * L2 House A's sill seen faintly past the sheet's edges; L4 the sheet; L5 a brass rule's edge, near and soft.
 * Camera: a very slow drift that stops when the dividers are laid down.
 *
 *   lease     2.92  the candle's flame inks in (term tag 'lease', reel); on 'relit' a small curl at the wick
 *   twenty    8.59  the 0–20,000 ms scale darkens along its full length
 *   timetable 11.51 'three': a tick every 3,000 ms is stamped down the scale; 'four': a 4,000 ms bracket hangs from
 *                   the first tick (the attempt's bound); 'one': a 1,000 ms retry hook after it
 *   skew     17.32  'two': an offset clock-face slides 2,000 ms against a second, ghost scale
 *   band     21.49  'twice': the band, 16,000 to 20,000, washes red at the candle's foot
 *   (25.92)         'twenty thousand': the expiry mark is ringed
 *   serve    30.94  'sixteen': a hard line ruled at 16,000 across candle and scale; serve: t + 4,000 < 20,000
 *   renew    34.73  'twelve': a second line at 12,000; a 4,000 ms bracket hangs from it and ends exactly at the
 *                   16,000 line ('ends before the band'); renew: t + 8,000 < 20,000
 *   ruler    41.14  a pair of dividers lies across the plate; the drift stops
 * All text on the parchment above y 600; bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { FONT, defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { EMBER, badge, camAt, clamp01, lerp, pulse, seg, sm, twos, type CamKey } from '../sets/common';
import { bracket, dividers, engravedCandle, inkCol, inkFold, inkText, paperSheet, ruleLine } from '../sets/ch05-s02-parchment';

const ID = 'ch05-s02';
const Y0 = 112, Y1 = 572;
const msY = (ms: number) => Y0 + ((Y1 - Y0) * ms) / 20000;
const CX = 420, SX = 520, GX = 690;
const SHEET = { x: 34, y: 26, w: 1212, h: 720 };
const HOME: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const REST: Camera3 = { x: 652, y: 364, z: 34, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      lease: T.beat('lease'),
      relit: T.word('L0507', 'relit'),
      twenty: T.beat('twenty'),
      three: T.beat('timetable'),
      four: T.word('L0508', 'four'),
      one: T.word('L0508', 'one'),
      skew: T.beat('skew'),
      band: T.beat('band'),
      fourSec: T.word('L0509', 'four'),
      expiry: T.word('L0510', 'twenty'),
      serve: T.beat('serve'),
      renew: T.beat('renew'),
      full: T.word('L0511', 'full'),
      ends: T.word('L0511', 'ends'),
      ruler: T.beat('ruler'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: HOME },
      { t: b.ruler, cam: REST },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(cams, t));
    f.backlight({ sunX: 640, sunY: 360, intensity: 0.4 });
    // ------------------------------------------------ L2 House A's sill, faintly, past the sheet's edges
    f.layer('L2', (c, env) => {
      const r = { x: -300, y: -100, w: 1900, h: 900 };
      f.cached(`dou/${ID}/sill/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.25);
        cc.fillRect(r.x, 600, r.w, 300);
        cc.fillRect(r.x, -100, 120, 900);
        cc.fillRect(1160, -100, 500, 900);
        cc.fillStyle = mixLab(env.fill('set'), env.fill('ink'), 0.45);
        cc.fillRect(r.x, 588, r.w, 14);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ L4 the sheet and the ruler
    f.layer('L4', (c, env) => {
      f.cached(`dou/${ID}/sheet/${env.mood.id}`, SHEET.w + 60, SHEET.h + 60, (cc) => {
        cc.translate(-SHEET.x + 30, -SHEET.y + 30);
        paperSheet(cc, env, { ...SHEET, seed: 52 });
      })(c, SHEET.x - 30, SHEET.y - 30);
      inkFold(c, { ...SHEET, u: seg(t, 0.2, 1.4) });
      const ink = inkCol(env, 0.9);
      // the engraved badge, top right (workerd's numbers only)
      badge(c, env, { x: 1080, y: 46, text: 'workerd · 28 Oct', s: 1.1, engraved: true, legible: true, id: `${ID}-badge` });
      // the candle (full: a lease just renewed), its flame inking in on 'lease'
      const fl = seg(t, b.lease - 0.15, b.lease + 0.5);
      engravedCandle(c, env, { x: CX, top: Y0, base: Y1, fullTop: Y0, w: 64, flame: fl, curl: seg(t, b.relit - 0.1, b.relit + 0.7) * (1 - seg(t, b.twenty - 0.5, b.twenty + 0.3)) });
      // the scale: faint at first, darkening along its full length on 'twenty'
      const sc = seg(t, b.twenty - 0.15, b.twenty + 1.0);
      c.save();
      c.strokeStyle = inkCol(env, lerp(0.3, 0.92, sc));
      c.lineWidth = lerp(1.2, 2.2, sc);
      c.beginPath();
      c.moveTo(SX, Y0);
      c.lineTo(SX, lerp(Y0, Y1, Math.max(0.25, sc)));
      c.stroke();
      // fine 1,000 ms graduations
      c.lineWidth = 1;
      for (let ms = 0; ms <= 20000; ms += 1000) {
        const y = msY(ms);
        const k = clamp01((sc * 21) - ms / 1000);
        if (k <= 0) continue;
        c.strokeStyle = inkCol(env, 0.55 * k);
        c.beginPath();
        c.moveTo(SX, y);
        c.lineTo(SX + (ms % 5000 === 0 ? 14 : 7), y);
        c.stroke();
      }
      c.restore();
      const num = (txt: string, ms: number, a: number, id: string) =>
        inkText(c, env, { id, text: txt, x: SX + 24, y: msY(ms) + 8, size: 21, family: FONT.mono, style: '500', alpha: a });
      num('0 ms', 0, seg(t, b.twenty - 0.1, b.twenty + 0.4), `${ID}-n0`);
      num('20,000', 20000, seg(t, b.twenty + 0.3, b.twenty + 0.8), `${ID}-n20`);
      // ticks every 3,000 ms, stamped one after another on 'three'
      for (let i = 1; i <= 6; i++) {
        const k = seg(t, b.three - 0.05 + i * 0.12, b.three + 0.1 + i * 0.12);
        if (k <= 0) continue;
        const y = msY(i * 3000);
        c.save();
        c.fillStyle = inkCol(env, 0.9 * k);
        c.beginPath();
        c.moveTo(SX - 12, y);
        c.lineTo(SX - 2, y - 5);
        c.lineTo(SX - 2, y + 5);
        c.closePath();
        c.fill();
        c.restore();
      }
      // the attempt's 4,000 ms bound from the first tick, then a 1,000 ms retry hook
      const bx = SX - 28;
      bracket(c, bx, msY(3000), msY(7000), -8, ink, seg(t, b.four - 0.1, b.four + 0.6), 1.8);
      if (t > b.one - 0.1) {
        const k = seg(t, b.one - 0.1, b.one + 0.5);
        c.save();
        c.strokeStyle = ink;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(bx, msY(7000));
        c.lineTo(bx, lerp(msY(7000), msY(8000), k));
        if (k >= 1) c.arc(bx + 6, msY(8000), 6, Math.PI, Math.PI * 0.2, true);
        c.stroke();
        c.restore();
      }
      // the skew: a ghost scale beside the first, and a little offset clock-face sliding 2,000 ms against it
      const gk = seg(t, b.skew - 0.25, b.skew + 0.3) * (1 - seg(t, b.band + 2.5, b.band + 3.5) * 0.6);
      if (gk > 0.01) {
        const slide = sm((tq - b.skew) / 1.2);
        c.save();
        c.globalAlpha *= gk;
        c.strokeStyle = inkCol(env, 0.55);
        c.setLineDash([4, 5]);
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(GX, msY(0) + slide * msY(2000) - Y0);
        c.lineTo(GX, msY(20000) + slide * (msY(2000) - Y0));
        c.stroke();
        c.setLineDash([]);
        const cy = msY(0) + 40 + slide * (msY(2000) - Y0);
        c.strokeStyle = ink;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(GX + 40, cy, 26, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.moveTo(GX + 40, cy);
        c.lineTo(GX + 40, cy - 18);
        c.moveTo(GX + 40, cy);
        c.lineTo(GX + 53, cy + 6);
        c.stroke();
        // the 2,000 ms offset, bracketed between the scales
        bracket(c, GX - 12, msY(0) + 40, msY(0) + 40 + slide * (msY(2000) - Y0), 6, ink, slide > 0.05 ? 1 : 0, 1.2);
        c.restore();
      }
      // the band: 16,000 to 20,000, washed red at the candle's foot
      const bandK = seg(t, b.band - 0.1, b.fourSec + 0.4);
      if (bandK > 0) {
        c.save();
        c.globalAlpha *= 0.55 * bandK;
        c.fillStyle = mixLab(EMBER, '#ffffff', 0.15);
        // a wash, painted as a path (it is ink on the plate, not a card)
        c.beginPath();
        c.rect(CX - 48, msY(16000), SX + 20 - (CX - 48), lerp(0, msY(20000) - msY(16000), bandK));
        c.fill();
        c.restore();
      }
      // 'twenty thousand': the expiry ringed
      const ring = seg(t, b.expiry - 0.1, b.expiry + 0.6) * (1 - seg(t, b.serve - 1, b.serve));
      if (ring > 0.01) {
        c.save();
        c.strokeStyle = inkCol(env, 0.8 * ring);
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(SX + 64, msY(20000) + 1, 56, 20, 0, 0, Math.PI * 2 * ring);
        c.stroke();
        c.restore();
      }
      // 'sixteen': a hard line at 16,000 across candle and scale; 'twelve': a line at 12,000 and its bracket
      const l16 = seg(t, b.serve - 0.1, b.serve + 0.6);
      ruleLine(c, CX - 70, SX + 14, msY(16000), ink, l16, 2.4);
      ruleLine(c, SX + 104, GX + 80, msY(16000), ink, seg(t, b.serve + 0.2, b.serve + 0.7), 2.4);
      num('16,000', 16000, l16, `${ID}-n16`);
      const l12 = seg(t, b.renew - 0.1, b.renew + 0.6);
      ruleLine(c, CX - 70, SX + 14, msY(12000), ink, l12, 2.4);
      ruleLine(c, SX + 104, GX + 80, msY(12000), ink, seg(t, b.renew + 0.2, b.renew + 0.7), 2.4);
      num('12,000', 12000, l12, `${ID}-n12`);
      const br = seg(t, b.full - 0.1, b.ends + 0.1);
      bracket(c, GX + 40, msY(12000), msY(16000), 10, ink, br, 2);
      if (br >= 1) {
        // the attempt ends exactly at the 16,000 line, before the band: a small landing tick
        c.save();
        c.fillStyle = ink;
        c.beginPath();
        c.arc(GX + 40, msY(16000), 3.2 * pulse(t, b.ends + 0.1, 0.2, 0.4, 0.8) + 2, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      // the equation, one line per rule
      inkText(c, env, { id: `${ID}-eq1`, text: 'serve:  t + 4,000 < 20,000', x: 776, y: msY(16000) + 10, size: 27, family: FONT.mono, style: '500', u: seg(t, b.serve + 0.1, b.serve + 1.0) });
      inkText(c, env, { id: `${ID}-eq2`, text: 'renew:  t + 8,000 < 20,000', x: 776, y: msY(12000) + 10, size: 27, family: FONT.mono, style: '500', u: seg(t, b.renew + 0.1, b.renew + 1.0) });
      // the dividers, laid across the plate
      const dv = sm((tq - (b.ruler - 0.2)) / 0.6);
      if (dv > 0) dividers(c, env, { x: lerp(1120, 960, dv), y: lerp(120, 150, dv), s: 1.15, open: 0.6, rot: lerp(0.2, 0.95, dv), alpha: dv });
    });
    f.rim({ x: 0, y: -1 });
    // ------------------------------------------------ L5 a brass rule's edge, near and soft (bottom-left corner)
    f.layer('L5', (c, env) => {
      const r = { x: -120, y: -100, w: 200, h: 900 };
      f.cached(`dou/${ID}/rule/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = mixLab('#8a6a34', env.mood.fg, 0.25);
        cc.fillRect(-60, -100, 74, 900);
        cc.fillStyle = withAlpha('#f0d690', 0.4);
        cc.fillRect(12, -100, 3, 900);
      })(c, r.x, r.y);
    });
  },
});
