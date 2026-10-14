// promo-kit smoke test (not a film): hazes, kinetic type with the colour sweep, bracketed type, hairlines
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, bracket, env, hairlines, haze, kinetic, paper } from '../../../film/promo';

export default defineShot({
  id: 'ch01-s01',
  mood: 'parchment',
  build() {
    const tl = new Timeline();
    tl.hold(0, 5.5);
    return { tl };
  },
  paint(f) {
    const c = f.c;
    const t = f.t;
    paper(c);
    haze(c, { t, preset: 'dawn', u: 1 - env(t, 2.6, Infinity, 0.5) });
    hairlines(c, { ys: [14, 342], alpha: 0.5 * (1 - env(t, 2.6, Infinity, 0.5)) });
    kinetic(c, {
      t, x: 640, y: 190, size: 30, align: 'center', color: '#ffffff', grad: Math.min(1, Math.max(0, (t - 1.2) / 1.0)), out: 2.5,
      words: ['Every', 'deploy.', 'Every', 'PR.', 'Every', 'night.'].map((w, i) => ({ text: w, at: 0.2 + i * 0.22 })),
    });
    bracket(c, { text: 'tested for you', x: 640, y: 380, size: 44, u: (t - 3.0) / 1.2, color: PROMO.ink, dots: 'wide' });
  },
});
