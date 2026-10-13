import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { mistyHills, MISTY_LR } from '../silhouette/metaphors/mistyHills';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-1 reveal · 1-7 timid (lr 0.2) walks into the trap · 7-12 bold (lr 1.8) leaps to the valley · 12-15 reckless
const g: GalleryModule = {
  title: 'mistyHills (gradient descent)',
  duration: 15,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'winterBlue', t, pxScale: ge.pxScale });
    const sky = c.createLinearGradient(0, 0, 0, 720);
    const m = env.mood;
    sky.addColorStop(0, m.sky[0]);
    sky.addColorStop(0.3, m.sky[1]);
    sky.addColorStop(0.5, m.sky[2]);
    sky.addColorStop(0.6, m.sky[3]);
    sky.addColorStop(1, m.sky[2]);
    c.fillStyle = sky;
    c.fillRect(0, 0, 1280, 720);
    const lr = t < 7 ? MISTY_LR.timid : t < 12 ? MISTY_LR.bold : MISTY_LR.reckless;
    const step = t < 1 ? 0 : t < 7 ? (t - 1) * 3 : t < 12 ? (t - 7) * 1.6 : (t - 12) * 1.6;
    mistyHills(c, { lr, step, fog: 0.7, tangent: 1, trail: true, labels: true, reveal: ramp(t, 0, 1) }, env);
  },
};
export default g;
