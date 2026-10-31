// ch01-s01 · the dawn haze and the half-finished thought (L0101)
// The reference's opening frame without its figure: a dawn haze breathing up, hairlines drifting, and the line
// arriving word by word on the narrator's words, the tail sweeping white → peach → orange as 'run.' lands.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { FILM_H, FILM_W } from '../../../film/contracts';
import { easeInOut, easeOut, hexA, haze, kinetic, measure, paper, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const LINE1 = ['Imagine', 'end-to-end', 'tests', 'you', 'never', 'write.'];
const LINE2 = ['Or', 'remember', 'to', 'run.'];
const SIZE = 42;
const WEIGHT = 380;
const OFF = 4000; // draw far off-stage and throw only the shadow back on

export default defineShot({
  id: 'ch01-s01',
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    // each word blurs in 0.1 s ahead of the narrator's word (L0101 word indices 0..9)
    const w1 = LINE1.map((text, i) => ({ text, at: T.word('L0101', i) - 0.1 }));
    const w2 = LINE2.map((text, i) => ({ text, at: T.word('L0101', LINE1.length + i) - 0.1 }));
    const sweepAt = T.beat('sweep'); // 'remember' − 0.1
    const sweepEnd = T.wordEnd('L0101', LINE1.length + LINE2.length - 1); // 'run' lands
    const landedAt = T.beat('landed'); // 'run' ends: the rose glow crosses 0.75 H here
    return { tl, w1, w2, sweepAt, sweepEnd, landedAt, firstAt: w1[0].at, dur: T.duration };
  },
  paint(f, _s, scene) {
    const c = f.c;
    const t = f.t;
    paper(c);
    // the haze breathes up and brightens over the first half second, then keeps a slow swell to the cut
    const breathe = 0.55 + 0.37 * easeOut(clamp(t / 0.7)) + 0.08 * smooth((t - 1.5) / 3);
    haze(c, { t: t + 2, preset: 'dawn', u: breathe, drift: 0.8 });
    // a rose glow rising from low in frame: its centre crosses 0.75 H on 'landed' and keeps climbing into the dissolve
    const span = scene.landedAt + 1.6;
    const rise = easeInOut(clamp(t / span)) / easeInOut(scene.landedAt / span);
    const gy = FILM_H * (1.02 - 0.27 * rise);
    const ga = 0.3 + 0.45 * smooth((t - 0.2) / 3.6);
    const rg = c.createRadialGradient(FILM_W * 0.5, gy, 0, FILM_W * 0.5, gy, FILM_W * 0.46);
    rg.addColorStop(0, hexA('#f7a0c4', ga));
    rg.addColorStop(0.5, hexA('#f2a6c0', ga * 0.5));
    rg.addColorStop(1, hexA('#f2a6c0', 0));
    c.fillStyle = rg;
    c.fillRect(0, 0, FILM_W, FILM_H);
    // the reference's hairline rules, drifting at different speeds
    driftLines(c, t, { n: 5, alpha: 0.55, speed: 1.2, seed: 3 });
    // a soft violet veil behind the type, arriving WITH the first word (never a smudge on the empty dawn)
    const va = 0.18 * easeOut(clamp((t - scene.firstAt) / 0.4));
    const veil = c.createRadialGradient(640, 300, 0, 640, 300, 520);
    veil.addColorStop(0, `rgba(112,64,178,${va.toFixed(3)})`);
    veil.addColorStop(0.55, `rgba(112,64,178,${(va / 2).toFixed(3)})`);
    veil.addColorStop(1, 'rgba(128,84,196,0)');
    c.save();
    c.transform(1, 0, 0, 0.42, 0, 300 * 0.58);
    c.fillStyle = veil;
    c.fillRect(0, -FILM_H, FILM_W, FILM_H * 4);
    c.restore();
    // the line, two rows centred on ≈ 40 % height, drifting up a hair as it is read
    c.save();
    c.shadowColor = 'rgba(92,40,120,0.36)';
    c.shadowBlur = 20;
    c.shadowOffsetY = 1;
    const lift = -5 * easeInOut(clamp(t / scene.dur));
    kinetic(c, { words: scene.w1, t, x: 640, y: 278 + lift, size: SIZE, weight: WEIGHT, align: 'center', color: '#ffffff' });
    // the tail sweep: white → peach → orange. It settles with the white ending in the space after 'Or', so
    // 'remember to run.' reads as one peach → orange phrase and the colour change falls between words.
    const k = t < scene.sweepAt ? -1 : easeOut(clamp((t - scene.sweepAt) / (scene.sweepEnd - scene.sweepAt + 0.15)));
    let words2 = scene.w2;
    if (k >= 0) {
      const sp = measure(c, ' ', SIZE, WEIGHT);
      const total = LINE2.reduce((a, w) => a + measure(c, w, SIZE, WEIGHT), 0) + sp * (LINE2.length - 1);
      const orEnd = (measure(c, 'Or', SIZE, WEIGHT) + sp * 0.5) / total; // the space after 'Or'
      const g = c.createLinearGradient(640 - total / 2, 0, 640 + total / 2, 0);
      const wEnd = clamp(0.8 + (orEnd - 0.8) * k);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(wEnd, '#ffffff');
      g.addColorStop(clamp(Math.max(wEnd + 0.02, 0.92 + (orEnd + 0.05 - 0.92) * k)), '#ffc49c');
      g.addColorStop(1, '#ff5a1a');
      words2 = scene.w2.map((w) => ({ ...w, color: g as unknown as string }));
    }
    const y2 = 278 + SIZE * 1.32 + lift;
    // line two: the violet shadow as a shadow-only pass, then the words with a warm-white under-glow so the orange holds its edge
    c.shadowOffsetX = OFF * c.getTransform().a; // shadow offsets are in device px, the stage may be scaled
    kinetic(c, { words: scene.w2, t, x: 640 - OFF, y: y2, size: SIZE, weight: WEIGHT, align: 'center', color: '#ffffff' });
    c.shadowOffsetX = 0;
    c.shadowColor = 'rgba(255,240,230,0.35)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 2;
    kinetic(c, { words: words2, t, x: 640, y: y2, size: SIZE, weight: WEIGHT, align: 'center', color: '#ffffff' });
    c.restore();
  },
});
