import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { alexnetCathedral, alexnetResultPlate } from '../silhouette/metaphors/alexnetCathedral';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-4 the cathedral rises · 4-8 light flows up · 8-11 the result plate
const g: GalleryModule = {
  title: 'alexnetCathedral',
  duration: 11,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'dawnGold', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'dawnGold', { pxScale: ge.pxScale, t, room: false });
    const shift = t > 8 ? ramp(t, 8, 9) : 0;
    alexnetCathedral(c, { x: -280 * shift, y: 0, w: 1280, h: 720, reveal: ramp(t, 0, 4), flow: ramp(t, 4, 8), labels: true }, env);
    if (t > 8) alexnetResultPlate(c, { x: 760, y: 150, w: 480, h: 420, reveal: ramp(t, 8.3, 10.5) }, env);
  },
};
export default g;
