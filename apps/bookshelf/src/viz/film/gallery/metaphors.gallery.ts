import type { GalleryModule } from './main';
import { makeEnv } from '../silhouette/palette';
import {
  IT_INDEX,
  MISTY_LR,
  XOR_221,
  alexnetCathedral,
  ensureFilmFonts,
  label,
  lanternNetwork,
  metaphorBackdrop,
  mistyHills,
  nextToken,
  perceptronRetina,
  ramp,
  stencilLantern,
  threadsOfLight,
  transformerLoom,
  xorPlate,
} from '../silhouette/metaphors';

/**
 * Overview: all nine machines, one per 2 s of gallery time (t = 0..18), each at a
 * representative moment. ?g=metaphors&t=<n*2+1> shows machine n. Also a perf readout
 * when ?perf is in the URL (times 30 paints of every machine at 1080p).
 */
type Shot = { name: string; mood: Parameters<typeof makeEnv>[0]['mood']; room: boolean; paint: (c: CanvasRenderingContext2D, env: ReturnType<typeof makeEnv>, u: number) => void };
const SHOTS: Shot[] = [
  { name: 'lanternNetwork', mood: 'duskRose', room: true, paint: (c, e, u) => lanternNetwork(c, { x: 330, y: 130, w: 620, h: 470, training: XOR_221, epoch: 600, sample: 2, wave: 0.6 + u * 1.4, labels: true, readout: true }, e) },
  { name: 'perceptronRetina', mood: 'labGreen', room: false, paint: (c, e, u) => perceptronRetina(c, { step: 3.6 + u * 0.3, tally: true }, e) },
  { name: 'xorPlate', mood: 'candleAmber', room: true, paint: (c, e, u) => xorPlate(c, { x: 340, y: 40, w: 600, h: 640, solve: 1, fold: u, captions: true }, e) },
  { name: 'mistyHills', mood: 'winterBlue', room: false, paint: (c, e, u) => mistyHills(c, { lr: MISTY_LR.bold, step: 1 + u * 0.1, fog: 0.7, tangent: 1, labels: true }, e) },
  { name: 'stencilLantern', mood: 'candleAmber', room: false, paint: (c, e, u) => stencilLantern(c, { step: 60.6 + u * 0.2, kernel: 'vertical', showSum: true, showKernel: 1 }, e) },
  { name: 'alexnetCathedral', mood: 'dawnGold', room: false, paint: (c, e, u) => alexnetCathedral(c, { flow: 0.55 + u * 0.4, labels: true }, e) },
  { name: 'threadsOfLight', mood: 'duskRose', room: true, paint: (c, e) => threadsOfLight(c, { query: IT_INDEX, heads: [0, 1, 2, 3], legend: true }, e) },
  { name: 'transformerLoom', mood: 'serverCyan', room: false, paint: (c, e, u) => transformerLoom(c, { flow: 0.4 + u * 0.4, phase: e.t, labels: true }, e) },
  { name: 'nextToken', mood: 'candleAmber', room: false, paint: (c, e) => nextToken(c, { y: 20, slide: 1 }, e) },
];

let perf: string[] | null = null;

const g: GalleryModule = {
  title: 'teaching machines (overview)',
  duration: 18,
  async setup(ge) {
    await ensureFilmFonts();
    if (!location.search.includes('perf')) return;
    // time each machine: 30 frames at 1080p on an offscreen canvas (gallery-only use of the clock)
    const cv = document.createElement('canvas');
    cv.width = 1920;
    cv.height = 1080;
    const c = cv.getContext('2d')!;
    perf = [];
    for (const s of SHOTS) {
      const env0 = makeEnv({ mood: s.mood, t: 0, pxScale: 1.5 });
      c.setTransform(1.5, 0, 0, 1.5, 0, 0);
      metaphorBackdrop(c, s.mood, { pxScale: 1.5, t: 0, room: s.room });
      s.paint(c, env0, 0); // warm caches
      const t0 = performance.now();
      for (let f = 0; f < 30; f++) {
        const env = makeEnv({ mood: s.mood, t: f / 24, pxScale: 1.5 });
        s.paint(c, env, f / 30);
      }
      c.getImageData(0, 0, 1, 1); // flush
      perf.push(`${s.name}: ${((performance.now() - t0) / 30).toFixed(2)} ms/frame`);
    }
    void ge;
  },
  paint(c, ge) {
    if (perf) {
      c.fillStyle = '#14100e';
      c.fillRect(0, 0, 1280, 720);
      perf.forEach((line, i) => label(c, line, 80, 90 + i * 52, { size: 30, color: '#f5d998' }));
      return;
    }
    const i = Math.max(0, Math.min(SHOTS.length - 1, Math.floor(ge.t / 2)));
    const s = SHOTS[i];
    const env = makeEnv({ mood: s.mood, t: ge.t, pxScale: ge.pxScale });
    metaphorBackdrop(c, s.mood, { pxScale: ge.pxScale, t: ge.t, room: s.room });
    s.paint(c, env, ramp(ge.t - i * 2, 0, 2));
  },
};
export default g;
