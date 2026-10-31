// ch01-s01 · the dawn haze and the half-finished thought (L0101)
// The reference's opening frame without its figure: a dawn haze breathing up, hairlines drifting, and the line
// arriving word by word on the narrator's words, the tail sweeping white → peach → orange as 'run.' lands.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { FILM_H, FILM_W } from '../../../film/contracts';
import { easeInOut, easeOut, hexA, haze, kinetic, paper, smooth } from '../../../film/promo';
import { driftLines } from '../sets/brand';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const LINE1 = ['Imagine', 'end-to-end', 'tests', 'you', 'never', 'write.'];
const LINE2 = ['Or', 'remember', 'to', 'run.'];
const SIZE = 40;

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
    return { tl, w1, w2, sweepAt, sweepEnd, dur: T.duration };
  },
  paint(f, _s, scene) {
    const c = f.c;
    const t = f.t;
    paper(c);
    // the haze breathes up and brightens over the first half second, then keeps a slow swell to the cut
    const breathe = 0.55 + 0.37 * easeOut(clamp(t / 0.7)) + 0.08 * smooth((t - 1.5) / 3);
    haze(c, { t: t + 2, preset: 'dawn', u: breathe, drift: 0.8 });
    // a rose glow rising from low in frame, cresting into the blur dissolve
    const rise = easeInOut(clamp(t / (scene.dur + 0.5)));
    const gy = FILM_H * (1.02 - 0.27 * rise);
    const ga = 0.22 + 0.38 * smooth((t - 0.2) / 3.6);
    const rg = c.createRadialGradient(FILM_W * 0.5, gy, 0, FILM_W * 0.5, gy, FILM_W * 0.46);
    rg.addColorStop(0, hexA('#f7a0c4', ga));
    rg.addColorStop(0.5, hexA('#f2a6c0', ga * 0.5));
    rg.addColorStop(1, hexA('#f2a6c0', 0));
    c.fillStyle = rg;
    c.fillRect(0, 0, FILM_W, FILM_H);
    // the reference's hairline rules, drifting at different speeds
    driftLines(c, t, { n: 5, alpha: 0.55, speed: 1.2, seed: 3 });
    // the line, two rows centred on ≈ 40 % height, drifting up a hair as it is read
    const lift = -5 * easeInOut(clamp(t / scene.dur));
    kinetic(c, { words: scene.w1, t, x: 640, y: 278 + lift, size: SIZE, weight: 300, align: 'center', color: '#ffffff' });
    kinetic(c, {
      words: scene.w2, t, x: 640, y: 278 + SIZE * 1.32 + lift, size: SIZE, weight: 300, align: 'center', color: '#ffffff',
      grad: t < scene.sweepAt ? undefined : clamp((t - scene.sweepAt) / (scene.sweepEnd - scene.sweepAt + 0.15)),
    });
  },
});
