/**
 * ch04-s04 — the commit, as a document: 28 October 2026, evening, Pacific time (serverCyan, paper-fold in).
 *
 * A long parchment strip unrolls left to right across the upper two-thirds of the frame over the dark harbour
 * (L1 the sea and far shore, L2 the ridge, deep and unlit; L5 the stone railing). The strip carries a thin
 * serverCyan rim: the accent the staging reserves for the commit strip. Camera: a slow dolly in with a slight truck
 * right (the harbour planes slide beneath), then on 'open' a push into the strip's centre, which begins to fold
 * open like a door onto the next chapter's terrace.
 *
 *   fold      0.30  the rolled strip hangs over the harbour; it unrolls left to right
 *   date      1.71  the strip's header line inks: '28 October 2026 · Pacific' (the date stamp, on the paper)
 *   headline  8.32  'beginning': the commit message's first line inks as the headline, attributed
 *   bucket   11.12  a margin vignette: three tiny houses, one well, three lines
 *   owner    13.28  one house's window lights alone
 *   dies     15.36  that window gutters; on 'picks' a second house's window lights
 *   body     18.85  'experimental': label 'Commit: no ack until the bucket holds it' inks lower on the strip;
 *                   badge 'workerd · 28 Oct' swings onto a hook at the strip's right end
 *   alarms   26.36  an empty bracket in the margin lights for a moment: where a wake-up clock would hang
 *   later    29.96  a small brass wake-up clock drops into the bracket
 *   facets   32.34  a cut-paper facet hangs beside it; badge 'workerd · 31 Oct' joins the first
 *   open     34.01  push into the strip's centre, which begins to fold open
 * Text stays above y 600; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { FONT, cardProbe, defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { camAt, BRASS_HI, SEA_CYAN, badge, brass, clamp01, glowDot, lerp, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { seaAndShore } from '../sets/harbourTown';
import { inkCol, inkRules, inkText, paperBase, paperPath } from '../sets/ch05-s02-parchment';

const ID = 'ch04-s04';
const S = { x0: 150, x1: 1130, y0: 112, y1: 500 };
const MARGIN = 884;
const VIG = { y: 262, houses: [{ x: 905, y: 262 }, { x: 975, y: 252 }, { x: 1045, y: 262 }], well: { x: 975, y: 318 } };
const BRK = { x: 950, y: 430 };
const HOOKS = [{ x: 930, y: S.y1 + 4 }, { x: 1076, y: S.y1 + 4 }];
const START: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const SETTLE: Camera3 = { x: 676, y: 352, z: 110, lens: 1 };
const DRIFT: Camera3 = { x: 690, y: 348, z: 150, lens: 1 };
const INTO: Camera3 = { x: 640, y: 300, z: 470, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      fold: T.beat('fold'),
      date: T.beat('date'),
      headline: T.beat('headline'),
      bucket: T.beat('bucket'),
      owner: T.beat('owner'),
      dies: T.beat('dies'),
      picks: T.word('L0419', 'picks'),
      body: T.beat('body'),
      alarms: T.beat('alarms'),
      later: T.beat('later'),
      facets: T.beat('facets'),
      open: T.beat('open'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: START },
      { t: 7.5, cam: SETTLE },
      { t: b.open - 0.2, cam: DRIFT },
      { t: b.D, cam: INTO },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const all = cams.map((k) => k.cam);
    f.camera(cam);
    f.backlight({ sunX: 300, sunY: 420, intensity: 0.35 });
    // ------------------------------------------------ the dark harbour beneath
    f.layer('L1', (c, env) => {
      const r = { x: -500, y: 120, w: 2300, h: 700 };
      seaAndShore(f, c, env, r, { lamps: 0.35, moon: 0.4, key: ID });
    });
    f.layer('L2', (c, env) => {
      const r = { x: -500, y: 300, w: 2400, h: 600 };
      f.cached(`dou/${ID}/ridge/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        const col = mixLab(env.fill('set'), env.fill('ink'), 0.5);
        cc.fillStyle = col;
        cc.beginPath();
        cc.moveTo(r.x, r.y + r.h);
        for (let x = r.x; x <= r.x + r.w; x += 8) {
          const u = (x + 300) / 2000;
          cc.lineTo(x, 520 - 200 * Math.max(0, Math.min(1, u)) ** 1.3 - 12 * Math.sin(x * 0.01));
        }
        cc.lineTo(r.x + r.w, r.y + r.h);
        cc.closePath();
        cc.fill();
        // unlit roofs: gables cut into the ridge, no windows
        for (let x = 100; x < 1700; x += 58) {
          const u = (x + 300) / 2000;
          const top = 530 - 200 * Math.max(0, Math.min(1, u)) ** 1.3;
          cc.beginPath();
          cc.moveTo(x - 18, top + 30);
          cc.lineTo(x, top + 12);
          cc.lineTo(x + 18, top + 30);
          cc.closePath();
          cc.fillStyle = mixLab(col, env.fill('ink'), 0.4);
          cc.fill();
        }
      })(c, r.x, r.y);
    });
    f.fog('B');
    // ------------------------------------------------ the strip
    const unroll = sm((t - 1.35) / 3.0);
    const rollX = lerp(S.x0 + 14, S.x1, unroll);
    const openU = seg(t, b.open - 0.05, b.D);
    f.layer('L4', (c, env) => {
      const ink = inkCol(env, 0.92);
      const sw = 0.025 * Math.sin(tq * 1.3);
      c.save();
      // the hanging cords from above (the strip is a hung document)
      c.strokeStyle = withAlpha(env.fill('ink'), 0.9);
      c.lineWidth = 1.2;
      for (const x of [S.x0 - 6, rollX + 6]) {
        c.beginPath();
        c.moveTo(x, -80);
        c.lineTo(x, S.y0 - 6);
        c.stroke();
      }
      // paper (unrolled part) with the serverCyan rim
      const p = paperPath({ x: S.x0, y: S.y0, w: Math.max(4, rollX - S.x0), h: S.y1 - S.y0, seed: 28 });
      c.save();
      c.shadowColor = withAlpha('#000000', 0.5);
      c.shadowBlur = 20;
      c.shadowOffsetY = 8;
      c.fillStyle = paperBase(env, 'strip');
      c.fill(p);
      c.restore();
      c.save();
      c.clip(p);
      const g = c.createLinearGradient(0, S.y0, 0, S.y1);
      g.addColorStop(0, withAlpha('#ffffff', 0.05));
      g.addColorStop(1, withAlpha('#5a4630', 0.18));
      c.fillStyle = g;
      c.fill(p);
      c.restore();
      c.strokeStyle = withAlpha(SEA_CYAN, 0.75);
      c.lineWidth = 1.6;
      c.stroke(p);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(SEA_CYAN, 0.18);
      c.lineWidth = 6;
      c.stroke(p);
      c.restore();
      // the card audit: the strip's first line (the dated header) inks as the paper is revealed
      const paperA = clamp01((rollX - S.x0 - 30) / 90);
      const dateT = clamp01((t - Math.max(b.date - 0.2, 1.55)) / 0.9);
      cardProbe(c, `${ID}-strip`, S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0, paperA, dateT > 0 ? Math.min(1, 0.3 + dateT) : 0);
      // everything printed on the strip is clipped to the unrolled paper
      c.save();
      c.beginPath();
      c.rect(S.x0, S.y0 - 4, rollX - S.x0, S.y1 - S.y0 + 8);
      c.clip();
      // header: the date stamp, printed on the paper
      inkText(c, env, { id: `${ID}-date`, text: '28 OCTOBER 2026 · PACIFIC', x: 196, y: 168, size: 20, family: FONT.mono, style: '500', tracking: 0.08, u: dateT });
      ruleLineInk(c, ink, 196, MARGIN - 30, 186, seg(t, b.date, b.date + 1));
      // the headline: the commit message calling itself a beginning
      const h1 = seg(t, b.headline - 0.2, b.headline + 0.7);
      const h2 = seg(t, b.headline + 0.45, b.headline + 1.2);
      inkText(c, env, { id: `${ID}-q1`, text: '…the beginning of merging celld’s', x: 196, y: 254, size: 46, style: 'italic 400', u: h1 });
      inkText(c, env, { id: `${ID}-q2`, text: 'functionality into workerd.', x: 196, y: 310, size: 46, style: 'italic 400', u: h2 });
      inkText(c, env, { id: `${ID}-qa`, text: '— Ryan Dahl, commit aa494794', x: 218, y: 354, size: 21, family: FONT.sc, style: '600', tracking: 0.04, u: seg(t, b.headline + 1.0, b.headline + 1.6) });
      // the rest of the message: soft illegible ink rules (texture only)
      inkRules(c, env, { x: 196, y: 392, w: 640, rows: 2, gap: 24, seed: 5, alpha: 0.9 });
      // body: the label inks lower on the strip
      inkText(c, env, { id: `${ID}-body`, text: 'Commit: no ack until the bucket holds it', x: 196, y: 470, size: 30, style: '500', u: seg(t, b.body - 0.15, b.body + 0.9) });
      // the margin
      ruleLineInk(c, inkCol(env, 0.45), MARGIN, S.y0 + 40, S.y1 - 40, 1, true);
      const vig = seg(t, b.bucket - 0.15, b.bucket + 0.7);
      if (vig > 0) {
        c.save();
        c.translate(992, 292);
        c.scale(1.3, 1.3);
        c.translate(-975, -290);
        c.globalAlpha *= vig;
        c.strokeStyle = ink;
        c.fillStyle = ink;
        c.lineWidth = 1.3;
        // three lines to the one well
        for (const h of VIG.houses) {
          c.beginPath();
          c.moveTo(h.x, h.y + 4);
          c.quadraticCurveTo((h.x + VIG.well.x) / 2, (h.y + VIG.well.y) / 2 + 12, VIG.well.x, VIG.well.y - 14);
          c.stroke();
        }
        VIG.houses.forEach((h, i) => {
          c.beginPath();
          c.moveTo(h.x - 14, h.y + 4);
          c.lineTo(h.x - 14, h.y - 18);
          c.lineTo(h.x, h.y - 32 - (i === 0 ? 6 : 0));
          c.lineTo(h.x + 14, h.y - 18);
          c.lineTo(h.x + 14, h.y + 4);
          c.closePath();
          c.fill();
        });
        // the well: a ring, two posts, a little roof
        c.beginPath();
        c.ellipse(VIG.well.x, VIG.well.y, 18, 5, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillRect(VIG.well.x - 18, VIG.well.y, 36, 12);
        c.fillRect(VIG.well.x - 15, VIG.well.y - 22, 2.4, 22);
        c.fillRect(VIG.well.x + 12.6, VIG.well.y - 22, 2.4, 22);
        c.beginPath();
        c.moveTo(VIG.well.x - 22, VIG.well.y - 20);
        c.lineTo(VIG.well.x, VIG.well.y - 32);
        c.lineTo(VIG.well.x + 22, VIG.well.y - 20);
        c.stroke();
        // windows: one owner lights alone; it gutters; another picks it up
        const w0 = seg(t, b.owner - 0.1, b.owner + 0.4) * (1 - seg(t, b.dies - 0.05, b.dies + 0.5)) * (t > b.dies && t < b.dies + 0.5 && Math.sin(tq * 41) > 0.2 ? 0.4 : 1);
        const w1 = seg(t, b.picks - 0.1, b.picks + 0.4);
        const win = (h: { x: number; y: number }, k: number) => {
          c.fillStyle = mixLab('#4a3a2a', GOLDW, k);
          c.fillRect(h.x - 4, h.y - 12, 8, 9);
          if (k > 0.02) glowDot(c, h.x, h.y - 8, 16, tone(env, '#ffc86e', 0.05), 0.55 * k);
        };
        win(VIG.houses[0], w0 * vig);
        win(VIG.houses[1], w1 * vig);
        win(VIG.houses[2], 0);
        c.restore();
      }
      // the alarm bracket (empty), lit for a moment on 'Alarms'; the clock drops in on the second 'alarms'
      c.save();
      c.translate(BRK.x, BRK.y);
      c.scale(1.5, 1.5);
      c.translate(-BRK.x, -BRK.y);
      const brA = seg(t, b.alarms - 0.2, b.alarms + 0.3);
      if (brA > 0) {
        c.save();
        c.globalAlpha *= brA;
        c.strokeStyle = ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(BRK.x - 34, BRK.y - 36);
        c.lineTo(BRK.x, BRK.y - 36);
        c.lineTo(BRK.x, BRK.y - 26);
        c.moveTo(BRK.x - 18, BRK.y - 26);
        c.lineTo(BRK.x + 18, BRK.y - 26);
        c.stroke();
        c.restore();
        glowDot(c, BRK.x, BRK.y - 4, 34, tone(env, BRASS_HI, 0.1), 0.45 * pulse(t, b.alarms, 0.25, 0.4, 1.0));
      }
      const drop = sm((tq - (b.later - 0.1)) / 0.45);
      if (drop > 0) {
        const y = lerp(BRK.y - 120, BRK.y - 2, drop) + Math.sin(drop * Math.PI) * 0;
        c.save();
        c.translate(BRK.x, y);
        c.fillStyle = brass(env, 0.45);
        c.strokeStyle = withAlpha(mixLab('#3a2a12', env.mood.fg, 0.2), 0.95);
        c.lineWidth = 1.2;
        for (const sx of [-1, 1]) {
          c.beginPath();
          c.arc(sx * 10, -20, 6, Math.PI, 0);
          c.fill();
          c.stroke();
        }
        c.beginPath();
        c.arc(0, -4, 16, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = paperBase(env, 'strip');
        c.beginPath();
        c.arc(0, -4, 12, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = ink;
        c.beginPath();
        c.moveTo(0, -4);
        c.lineTo(0, -13);
        c.moveTo(0, -4);
        c.lineTo(6, -1);
        c.stroke();
        c.restore();
      }
      // the facet: a cut-paper many-sided gem, hanging beside the clock
      const fa = sm((tq - (b.facets - 0.1)) / 0.4);
      if (fa > 0) {
        const fx = BRK.x + 82, fy = lerp(BRK.y - 90, BRK.y - 10, fa);
        c.strokeStyle = ink;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(fx, BRK.y - 40);
        c.lineTo(fx, fy - 18);
        c.stroke();
        c.save();
        c.translate(fx, fy);
        c.rotate(0.12 * Math.sin(tq * 2.1) * (1 - seg(t, b.facets + 0.4, b.facets + 2)));
        c.fillStyle = mixLab(paperBase(env, 'strip'), '#8a7a62', 0.35);
        c.beginPath();
        c.moveTo(0, -18);
        c.lineTo(15, -6);
        c.lineTo(9, 16);
        c.lineTo(-9, 16);
        c.lineTo(-15, -6);
        c.closePath();
        c.fill();
        c.strokeStyle = ink;
        c.stroke();
        c.beginPath();
        c.moveTo(-15, -6);
        c.lineTo(0, 2);
        c.lineTo(15, -6);
        c.moveTo(0, 2);
        c.lineTo(0, -18);
        c.moveTo(0, 2);
        c.lineTo(-9, 16);
        c.moveTo(0, 2);
        c.lineTo(9, 16);
        c.stroke();
        c.restore();
      }
      c.restore();
      c.restore();
      // the rods: the fixed left rod and the rolling right rod
      for (const [x, k] of [[S.x0, 0], [rollX, 1]] as const) {
        c.fillStyle = env.fill('ink');
        c.fillRect(x - 7, S.y0 - 10, 14, S.y1 - S.y0 + 20);
        c.fillStyle = brass(env, 0.4);
        c.beginPath();
        c.arc(x, S.y0 - 12, 6, 0, Math.PI * 2);
        c.arc(x, S.y1 + 12, 6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = withAlpha(env.fill('rim'), 0.35);
        c.fillRect(x - 6, S.y0 - 8, 2, S.y1 - S.y0 + 16);
        if (k === 1 && unroll < 1) {
          // the remaining roll: a fatter cylinder that thins as it unrolls
          const fat = 10 * (1 - unroll) + 2;
          c.fillStyle = paperBase(env, 'strip');
          c.fillRect(x - 7 - fat, S.y0 - 4, fat, S.y1 - S.y0 + 8);
          c.fillStyle = withAlpha('#000000', 0.25);
          c.fillRect(x - 7 - fat, S.y0 - 4, 2, S.y1 - S.y0 + 8);
        }
      }
      // the hooks at the strip's right end and the two badges (art: unnamed in the narration)
      if (unroll > 0.95) {
        for (const h of HOOKS) {
          c.strokeStyle = env.fill('ink');
          c.lineWidth = 2;
          c.beginPath();
          c.arc(h.x, h.y + 4, 4, Math.PI, Math.PI * 2.2);
          c.stroke();
        }
      }
      const b1 = sm((tq - (b.body - 0.05)) / 0.5);
      const b2 = sm((tq - (b.facets + 0.25)) / 0.5);
      if (b1 > 0) badge(c, env, { x: HOOKS[0].x, y: HOOKS[0].y + 6, text: 'workerd · 28 Oct', s: 1.05, alpha: b1, swing: 0.25 * (1 - b1) + 0.04 * Math.sin(tq * 1.4) * (1 - seg(t, b.body + 0.5, b.body + 3)), glint: 0.3, legible: false });
      if (b2 > 0) badge(c, env, { x: HOOKS[1].x, y: HOOKS[1].y + 6, text: 'workerd · 31 Oct', s: 1.05, alpha: b2, swing: 0.25 * (1 - b2) + 0.04 * Math.sin(tq * 1.4 + 1) * (1 - seg(t, b.facets + 0.8, b.facets + 3)), glint: 0.3, legible: false });
      // on 'open' the strip's centre begins to fold open like a door: the terrace's night light behind
      if (openU > 0) {
        const cx = 640, gw = 150 * openU;
        const gg = c.createLinearGradient(0, S.y0, 0, S.y1);
        gg.addColorStop(0, '#2e3b47');
        gg.addColorStop(1, '#637887');
        c.fillStyle = gg;
        c.fillRect(cx - gw / 2, S.y0, gw, S.y1 - S.y0);
        glowDot(c, cx - gw * 0.15, S.y0 + 250, 30 * openU, '#f2b45e', 0.7 * openU);
        // the two door edges (paper folding back): shaded strips
        for (const sx of [-1, 1]) {
          c.fillStyle = mixLab(paperBase(env, 'strip'), '#3a2c1e', 0.35);
          c.fillRect(cx + sx * gw / 2 - (sx > 0 ? 0 : 10 * openU), S.y0, 10 * openU, S.y1 - S.y0);
        }
      }
      c.restore();
      void all;
    });
    f.rim({ x: 0, y: -1 });
    f.layer('L5', (c, env) => {
      const r = { x: -600, y: 640, w: 2600, h: 200 };
      f.cached(`dou/${ID}/rail/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(0, 12, r.w, 14);
        for (let x = 10; x < r.w; x += 34) cc.fillRect(x - 5, 26, 10, 40);
        cc.fillRect(0, 60, r.w, r.h - 60);
        cc.fillStyle = withAlpha(env.mood.rim, 0.18);
        cc.fillRect(0, 12, r.w, 1.5);
      })(c, r.x, r.y);
    });
  },
});

const GOLDW = '#ffd27a';
function ruleLineInk(c: CanvasRenderingContext2D, col: string, a: number, b: number, at: number, u: number, vertical = false): void {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 1;
  c.beginPath();
  if (vertical) {
    c.moveTo(a, b);
    c.lineTo(a, lerp(b, at, u));
  } else {
    c.moveTo(a, at);
    c.lineTo(lerp(a, b, u), at);
  }
  c.stroke();
  c.restore();
}
