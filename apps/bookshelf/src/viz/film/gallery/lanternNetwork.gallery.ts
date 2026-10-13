import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import { metaphorBackdrop } from '../silhouette/metaphors/stage';
import { lanternNetwork } from '../silhouette/metaphors/lanternNetwork';
import { XOR_221, XOR_241 } from '../silhouette/metaphors/mlp';
import { ensureFilmFonts, label, MFONT, ramp, practicalGlow } from '../silhouette/metaphors/kit';

// t 0-2 reveal · 2-4 forward wave on [0,1] · 4-5.5 backward pulse · 5.5-10 training sweep (epoch 0 -> 600)
const g: GalleryModule = {
  title: 'lanternNetwork (XOR)',
  duration: 10,
  async setup() {
    await ensureFilmFonts();
  },
  paint(c, ge) {
    const t = ge.t;
    const env = makeEnv({ mood: 'duskRose', t, pxScale: ge.pxScale });
    metaphorBackdrop(c, 'duskRose', { pxScale: ge.pxScale, t });
    const epoch = t < 5.5 ? 0 : Math.min(600, (t - 5.5) * 140);
    const trained = t >= 9.9 ? 600 : epoch;
    lanternNetwork(
      c,
      {
        x: 150,
        y: 110,
        w: 620,
        h: 470,
        training: XOR_221,
        epoch: t < 5.5 ? 150 : trained,
        sample: t < 5.5 ? 1 : ((t - 5.5) * 2) % 4,
        reveal: ramp(t, 0, 2),
        wave: t < 2 ? 0 : t < 5.5 ? Math.min(2, (t - 2) * 1.2) : 2,
        back: t > 4 && t < 5.5 ? (t - 4) * 1.4 : 0,
        labels: true,
        readout: true,
      },
      env,
    );
    // a smaller, wider loom on the right
    lanternNetwork(
      c,
      { x: 860, y: 200, w: 340, h: 330, training: XOR_241, epoch: Math.min(1500, t * 60), sample: (t * 1.5) % 4, reveal: ramp(t, 0.5, 2.5), labels: false },
      env,
    );
    practicalGlow(c, 1240, 690, 0, env);
    label(c, 'The loom of lanterns', 640, 60, { size: 34, font: MFONT.display, weight: 600, color: env.mood.core, align: 'center', tracking: 2 });
  },
};
export default g;
