import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { threadsOfLight, IT_INDEX } from '../silhouette/metaphors/threadsOfLight';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-1.5 slips hang · 1.5-3 threads from "it" · 3-4.5 the light pours · 5-7 query walks "it" -> "tired" · 7.5-10 four heads
const g: GalleryModule = {
  title: 'threadsOfLight (attention)',
  duration: 10,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'duskRose', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'duskRose', { pxScale: ge.pxScale, t });
    const multi = t >= 7.5;
    threadsOfLight(
      c,
      {
        query: t < 5 ? IT_INDEX : t < 7 ? IT_INDEX + ramp(t, 5, 7) * 3 : IT_INDEX,
        heads: multi ? [0, 1, 2, 3] : [0],
        reveal: ramp(t, 0, 1.5),
        threads: multi ? ramp(t, 7.5, 9) : ramp(t, 1.5, 3),
        pour: multi ? 0 : ramp(t, 3, 4.5),
        weights: true,
        legend: multi,
      },
      env,
    );
  },
};
export default g;
