import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { xorPlate } from '../silhouette/metaphors/xorPlate';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-1.5 reveal · 1.5-6 single cut sweeps · 6-8.5 two hidden cuts · 8.5-11 fold into hidden space
const g: GalleryModule = {
  title: 'xorPlate',
  duration: 11,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'candleAmber', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'candleAmber', { pxScale: ge.pxScale, t });
    xorPlate(
      c,
      {
        x: 340,
        y: 40,
        w: 600,
        h: 640,
        reveal: ramp(t, 0, 1.5),
        sweep: ramp(t, 1.5, 6),
        solve: ramp(t, 6, 8.5),
        fold: ramp(t, 8.5, 11),
        captions: true,
      },
      env,
    );
  },
};
export default g;
