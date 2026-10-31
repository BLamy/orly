import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { stencilLantern } from '../silhouette/metaphors/stencilLantern';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-1.5 reveal · 1.5-6 slow steps (1/s) · 6-12 fast sweep to the full map
const g: GalleryModule = {
  title: 'stencilLantern (convolution)',
  duration: 12,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'candleAmber', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'candleAmber', { pxScale: ge.pxScale, t, room: false });
    const step = t < 1.5 ? 0 : t < 6 ? 14 + (t - 1.5) : 18.5 + (t - 6) * 21;
    stencilLantern(c, { step, kernel: 'vertical', reveal: ramp(t, 0, 1.5), showSum: true, showKernel: 1 }, env);
  },
};
export default g;
