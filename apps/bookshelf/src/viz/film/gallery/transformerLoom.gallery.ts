import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { transformerLoom } from '../silhouette/metaphors/transformerLoom';
import { ensureFilmFonts, ramp } from '../silhouette/metaphors/kit';

// t 0-2.5 the loom is strung · 2.5-7 light flows through · 7-9 focus on block 2
const g: GalleryModule = {
  title: 'transformerLoom',
  duration: 9,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'serverCyan', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'serverCyan', { pxScale: ge.pxScale, t, room: false });
    transformerLoom(c, { reveal: ramp(t, 0, 2.5), flow: ramp(t, 2.5, 7), phase: t, focus: t > 7 ? 1 : -1, labels: true }, env);
  },
};
export default g;
