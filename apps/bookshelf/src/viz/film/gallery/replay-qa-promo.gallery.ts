import type { GalleryModule } from './main';
import { PROMO, PROMO_FONTS, bracket, haze, paper, typed } from '../promo';
import { braceBox, driftLines, recordingChip, replayLockup, sweep, tag, underline } from '../../films/replay-qa-promo/sets/brand';
import { blurText } from '../promo';

/**
 * replay-qa-promo shared sets (films/replay-qa-promo/sets/brand.ts), t = 0..4:
 *   ?v=0  paper: drifting hairlines, the lock-up rising, the recording-chip stack (tint, ✓), braceBox round a pill row,
 *         the underline, tags
 *   ?v=1  the end card composed from the shared pieces on the ember haze (ch06-s02's look)
 *   ?v=2  the brand haze: drifting white hairlines, the chip on dark, a dark tag, the white → orange sweep
 */
const g: GalleryModule = {
  title: 'sets: replay-qa-promo',
  duration: 4,
  fonts: [...PROMO_FONTS],
  paint(c, env) {
    const v = Number(new URLSearchParams(location.search).get('v') ?? '0');
    const t = env.t;
    if (v === 0) {
      paper(c);
      driftLines(c, t, { n: 4, color: PROMO.ink, alpha: 0.12 });
      replayLockup(c, { x: 640, y: 120, u: t / 0.6 });
      for (let i = 0; i < 6; i++) recordingChip(c, { x: 200, y: 240 + i * 34, u: (t - 0.3 - i * 0.1) / 0.3, check: i === 0 ? (t - 1.5) / 0.3 : 0, tint: i === 5 ? (t - 2) / 0.5 : 0 });
      tag(c, { x: 270, y: 410, text: 'illustration', u: (t - 1.8) / 0.4 });
      const xs = [520, 690, 850];
      ['staging', 'preview', 'local'].forEach((s, i) => {
        c.save();
        c.strokeStyle = PROMO.mute;
        c.lineWidth = 1.4;
        c.beginPath();
        c.roundRect(xs[i] - 70, 300, 140, 50, 25);
        c.stroke();
        c.restore();
        blurText(c, s, xs[i], 335, { size: 28, u: 1, align: 'center', color: PROMO.ink });
      });
      braceBox(c, { x0: 450, x1: 920, y: 325, size: 64, u: (t - 0.5) / 0.45 });
      blurText(c, '67ms', 560, 520, { size: 72, weight: 500, u: 1 });
      underline(c, { x0: 560, x1: 720, y: 540, u: (t - 1) / 0.5 });
      tag(c, { x: 560, y: 600, text: 'Insights', u: 1 });
    } else if (v === 1) {
      paper(c);
      haze(c, { t, preset: 'ember', u: 1, y0: 0.25 });
      driftLines(c, t, { n: 4, alpha: 0.45 });
      bracket(c, { text: 'End-to-end testing · fully managed', x: 640, y: 302, size: 54, u: (t - 0.6) / 1.4, weight: 300 });
      const L = replayLockup(c, { x: 640, y: 418, u: t / 0.5, size: 40, weight: 500 });
      recordingChip(c, { x: L.x1 + 70, y: 418, u: (t - 0.3) / 0.4 });
      typed(c, { text: 'qa.replay.io', t, at: 1.8, cps: 14, x: 640, y: 500, size: 34, color: 'rgba(20,18,22,.8)', align: 'center' });
    } else {
      paper(c);
      haze(c, { t, preset: 'brand', u: 1 });
      driftLines(c, t, { n: 5, alpha: 0.08 });
      const x0 = 330, x1 = 950;
      blurText(c, 'Some bugs only exist in time', 640, 300, { size: 54, weight: 300, u: 1, align: 'center', color: sweep(c, x0, x1, t / 2) });
      recordingChip(c, { x: 640, y: 420, u: 1, tint: t / 3, dark: true });
      tag(c, { x: 640, y: 480, text: 'illustration · 16.7 ms frame budget', u: 1, dark: true, align: 'center' });
    }
  },
};
export default g;
