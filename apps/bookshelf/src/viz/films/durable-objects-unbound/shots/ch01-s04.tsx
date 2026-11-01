/**
 * ch01-s04 — the title (winterBlue, cut in on the end of the tick motif).
 *
 * The night square, camera a little above the Well, the Plate's iron frame centred in the upper third, the Well's rim
 * below it, the L6 lamp-post soft at the right edge, a drift of harbour fog between L4 and L5. A barely perceptible
 * settle (z +14) keeps the planes breathing.
 *   title         'Durable Objects, Unbound' inks across the sky above the Plate's frame, on a soft dark plate; holds
 *   ribbon        a thin parchment ribbon unspools a hand's width over the Well's rim and stops: no text (foreshadow)
 *   ours          label 'illustrative harbour · real code' inks lower-centre, well above the caption band
 *   tags          a rack of five small brass badges swings into view along the Plate's frame, too small to read,
 *                 catching the moon one after another (the film's promise to label whose code each machine is)
 *   experimental  the Plate's crown lamp dims to a low, steady glow
 *   (hold)        the label, badges and ribbon fade to 0.15; the frame rests on the crown lamp (ch02 irises on a desk lamp)
 */
import { Timeline } from '../../../core';
import { FONT, defineShot, fogBank, mixLab, softPlate, titleCard, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { TOWN, paintTown } from '../sets/harbourTown';
import { badge, camAt, clamp01, glowDot, label, lerp, paper, seg, sm, tone, twos, type BadgeText, type CamKey } from '../sets/common';
import { WELL, crownPt } from '../sets/wellAndPlate';

const ID = 'ch01-s04';
const CAM0: Camera3 = { x: 432, y: 460, z: 150, lens: 1 };
const CAM1: Camera3 = { x: 432, y: 458, z: 164, lens: 1 };
const RACK: BadgeText[] = ['workerd · 28 Oct', 'workerd · 31 Oct', 'celld 0.6.3', 'Cloudflare, hosted', 'Amazon S3'];
void FONT;

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      title: T.beat('title'),
      ribbon: T.beat('ribbon'),
      ours: T.beat('ours'),
      tags: T.beat('tags'),
      experimental: T.beat('experimental'),
      l117end: T.line('L0117').end,
    };
    const cams: CamKey[] = [
      { t: 0, cam: CAM0 },
      { t: b.D, cam: CAM1 },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const rest = seg(t, b.l117end + 0.2, b.D - 0.6);
    const keep = 1 - 0.85 * rest; // competing layers settle to 0.15
    const crown = 1 - 0.65 * seg(t, b.experimental - 0.1, b.experimental + 1.4);
    const W = { x: TOWN.well.x, y: TOWN.well.y };
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0, B: 0, C: 0.9, Cup: 0.6 },
        lanterns: [{ house: 'C', lit: 0.9, members: 4, tq, door: 0, s: 0.6 }],
        plate: { house: '', epoch: '', from: '', crown, dim: 0.35 },
        tooth: { shutter: 0, pin: 1, showPin: false },
        well: { bucket: 0.3, glint: 0.4 },
        lampPostLit: 0.5,
      },
      {
        L4: (c, env) => {
          // the ribbon: a thin parchment tape unspooling a hand's width over the Well's rim (texture only)
          const u = sm(clamp01((t - (b.ribbon - 0.1)) / 1.6));
          if (u > 0.01) {
            const x0 = W.x - 40, y0 = W.y - WELL.ringH - 6;
            const len = 92 * u;
            c.save();
            c.globalAlpha = keep;
            c.fillStyle = paper(env, 0.15);
            c.beginPath();
            c.moveTo(x0, y0);
            for (let i = 0; i <= 12; i++) {
              const k = i / 12;
              c.lineTo(x0 + len * k, y0 + Math.sin(k * 3.1 + 0.4) * 3 + k * 6);
            }
            for (let i = 12; i >= 0; i--) {
              const k = i / 12;
              c.lineTo(x0 + len * k, y0 + Math.sin(k * 3.1 + 0.4) * 3 + k * 6 + 6);
            }
            c.closePath();
            c.fill();
            // frame divisions (no text)
            c.strokeStyle = withAlpha(mixLab('#3a2a18', env.mood.fg, 0.3), 0.5);
            c.lineWidth = 0.6;
            for (let k = 0.18; k < u; k += 0.22) {
              const x = x0 + 92 * k;
              c.beginPath();
              c.moveTo(x, y0 + Math.sin(k * 3.1 + 0.4) * 3 + k * 6);
              c.lineTo(x, y0 + Math.sin(k * 3.1 + 0.4) * 3 + k * 6 + 6);
              c.stroke();
            }
            // the spool end, a small roll
            c.fillStyle = mixLab(paper(env, 0.1), '#bfa77a', 0.3);
            c.beginPath();
            c.ellipse(x0 + len, y0 + Math.sin(u * 3.1 + 0.4) * 3 + u * 6 + 3, 3, 5, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
          // the badge rack: five small brass tags swinging in along the Plate's frame, one after another
          for (let i = 0; i < 5; i++) {
            const at = b.tags - 0.2 + i * 0.28;
            const k = seg(t, at, at + 0.7);
            if (k <= 0.01) continue;
            const hx = W.x + lerp(-58, 58, i / 4);
            const hy = W.y + WELL.plate.y + WELL.plateH / 2 + 30 - Math.abs(i - 2) * 6;
            const swing = (1 - k) * -1.2 + 0.08 * Math.exp(-(t - at - 0.7) * 1.2) * Math.sin((t - at) * 7) * (t > at + 0.7 ? 1 : 0);
            const glint = seg(t, b.tags + 0.6 + i * 0.4, b.tags + 0.9 + i * 0.4) * (1 - seg(t, b.tags + 1.1 + i * 0.4, b.tags + 1.8 + i * 0.4));
            badge(c, env, { x: hx, y: hy, text: RACK[i], s: 0.32, legible: false, alpha: k * keep, swing, glint });
          }
        },
        afterRim: () => {
          // the crown lamp, the frame's resting point
          const p = crownPt(W);
          f.practical({ x: p.x, y: p.y, kind: 'lamp', seed: 41, intensity: 0.35 * crown, radius: 46, layer: 'L4' });
        },
        L5: (c, env) => {
          // a faint drift of harbour fog between the square and the railing
          fogBank(c, { y: 648, height: 70, speed: 6, density: 0.16, layers: 2 }, env);
        },
      },
    );
    // ---------------------------------------------------------------- type
    const tenv = { t, mood: f.mood, seed: 1 };
    const ta = seg(t, b.title, b.title + 0.6);
    if (ta > 0.01) {
      f.c.save();
      f.c.globalAlpha = ta;
      softPlate(f.c, 640, 104, 980, 150, f.mood.ink, 0.5);
      f.c.restore();
    }
    titleCard(f.c, { title: 'Durable Objects, Unbound', at: b.title, x: 640, y: 100, size: 60, fade: 0.8 }, tenv);
    label(f.c, f.mood, { id: `${ID}-ours`, text: 'illustrative harbour · real code', x: 640, y: 596, align: 'center', italic: true, alpha: seg(t, b.ours - 0.15, b.ours + 0.45) * keep });
    void glowDot;
    void tone;
  },
});
