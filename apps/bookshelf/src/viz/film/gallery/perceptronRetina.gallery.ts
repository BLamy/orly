import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { perceptronRetina } from '../silhouette/metaphors/perceptronRetina';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-2 build · then one presentation per second (step = t - 2), later fast-forward
const g: GalleryModule = {
  title: 'perceptronRetina (Mark I)',
  duration: 12,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'labGreen', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'labGreen', { pxScale: ge.pxScale, t, room: false });
    const step = t < 2 ? 0 : t < 8 ? t - 2 : 6 + (t - 8) * 25;
    perceptronRetina(c, { step, reveal: ramp(t, 0, 2), tally: true }, env);
  },
};
export default g;
