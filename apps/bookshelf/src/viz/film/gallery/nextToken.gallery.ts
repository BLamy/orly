import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { nextToken } from '../silhouette/metaphors/typeSlugs';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-2 the line is set · 2-4 drawers slide out by p · 4-5.5 "tired" is set · 6-9 temperature 1 -> 2.5
const g: GalleryModule = {
  title: 'nextToken (typesetter)',
  duration: 9,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'candleAmber', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'candleAmber', { pxScale: ge.pxScale, t, room: false });
    nextToken(
      c,
      {
        y: 20,
        reveal: ramp(t, 0, 2),
        slide: ramp(t, 2, 4),
        choose: t < 6 ? ramp(t, 4, 5.5) : 0,
        temperature: t < 6 ? 1 : 1 + ramp(t, 6, 8.5) * 1.5,
      },
      env,
    );
  },
};
export default g;
