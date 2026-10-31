import type { GalleryModule } from './main';
import type { FilmTimelineData, ShotModule, ShotScene } from '../contracts';
import { LAYERS } from '../contracts';
import { createFrame } from '../core/frame';
import { createReel, paintPlaceholder, seedOf } from '../core/reel';
import { shotTiming } from '../core/timing';
import { camMove } from '../core/multiplane';
import { withAlpha } from '../silhouette/palette';
import demoData from '../../films/_demo/timeline.json';
import s01 from '../../films/_demo/shots/demo-s01';
import s02 from '../../films/_demo/shots/demo-s02';

/**
 * Film core self-test (2x2): TL demo-s01, TR demo-s02 (both through createFrame),
 * BL practicals lineup (candle, lamp, screen, led, tube) with fog sheets + rim,
 * BR the reel's placeholder card with karaoke narration. Each quadrant is rendered
 * at 1920x1080 offscreen and scaled down. ?q=0..3 shows one quadrant full size;
 * ?q=4 renders the whole reel with NO shot modules (placeholders + crossfade at t≈6).
 */
const data = demoData as unknown as FilmTimelineData;
const W = 1920, H = 1080;
const bufs: CanvasRenderingContext2D[] = [];
const buf = (i: number) => {
  if (!bufs[i]) {
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    bufs[i] = cv.getContext('2d')!;
  }
  return bufs[i];
};

function shot(mod: ShotModule, idx: number, t: number, c: CanvasRenderingContext2D) {
  const d = data.shots[idx];
  const timing = shotTiming(d);
  const ctx = { timing, fps: 24, seed: seedOf(`_demo/${d.id}`) };
  const scene = mod.build(ctx) as ShotScene;
  const f = createFrame({ c, pxScale: 1.5, t, fps: 24, seed: ctx.seed, mood: mod.mood });
  mod.paint(f, scene.tl.sample(t), scene, ctx);
}

function practicals(t: number, c: CanvasRenderingContext2D) {
  const f = createFrame({ c, pxScale: 1.5, t, fps: 24, seed: 5, mood: 'serverCyan' });
  f.camera(camMove(40 * Math.sin(t * 0.4), 0));
  f.backlight({ sunX: 640, intensity: 0.7 });
  f.layer('L2', (cc, env) => {
    cc.fillStyle = env.fill('set');
    cc.fillRect(-200, 470, 1700, 400);
    for (let x = -160; x < 1500; x += 120) cc.fillRect(x, 300, 46, 200);
  });
  f.fog('A');
  f.fog('B');
  const kinds = ['candle', 'lamp', 'screen', 'led', 'tube'] as const;
  const xs = [190, 420, 640, 860, 1090];
  f.layer('L4', (cc, env) => {
    cc.fillStyle = env.fill('ink');
    // plinths for each light
    xs.forEach((x, i) => {
      cc.fillRect(x - 26, 470, 52, 180);
      cc.fillRect(x - 36, 462, 72, 10);
      if (kinds[i] === 'candle') cc.fillRect(x - 4, 432, 8, 32);
      if (kinds[i] === 'lamp') { cc.fillRect(x - 2, 380, 4, 84); cc.beginPath(); cc.moveTo(x - 30, 390); cc.lineTo(x + 30, 390); cc.lineTo(x + 14, 352); cc.lineTo(x - 14, 352); cc.closePath(); cc.fill(); }
      if (kinds[i] === 'screen') { cc.fillRect(x - 48, 372, 96, 70); cc.fillRect(x - 8, 440, 16, 24); }
      if (kinds[i] === 'tube') cc.fillRect(x - 70, 398, 140, 6);
    });
  });
  f.rim({ x: 0, y: -1 });
  const ys = { candle: 431, lamp: 392, screen: 407, led: 455, tube: 410 };
  xs.forEach((x, i) => f.practical({ x, y: ys[kinds[i]], kind: kinds[i], seed: 100 + i, radius: kinds[i] === 'led' ? 14 : kinds[i] === 'screen' ? 60 : 64 }));
  // screen face lit
  f.layer('L4', (cc, env) => {
    cc.fillStyle = withAlpha(env.mood.core, 0.75);
    cc.fillRect(640 - 42, 377, 84, 60);
  });
  f.layer('L6', (cc, env) => {
    cc.fillStyle = env.fill('fg');
    cc.fillRect(1250, -50, 160, 820);
  });
  c.setTransform(1.5, 0, 0, 1.5, 0, 0);
  c.font = '600 22px Georgia, serif';
  c.fillStyle = 'rgba(255,255,255,0.75)';
  c.textAlign = 'center';
  kinds.forEach((k, i) => c.fillText(k, xs[i], 700));
  c.setTransform(1, 0, 0, 1, 0, 0);
}

function placeholder(t: number, c: CanvasRenderingContext2D) {
  const d = {
    ...data.shots[0],
    id: 'ch03-s07',
    chapter: 'ch03',
    setting: 'Cornell Aeronautical Laboratory, Buffalo, 1958 — the Mark I Perceptron room',
    visual: 'Rosenblatt adjusts a potentiometer on the Mark I while photocells blink; slow push-in toward the patch board.',
    kind: 'scene',
    mood: 'labGreen' as const,
  };
  paintPlaceholder(c, 1.5, { id: d.id, data: d, timing: shotTiming(d) }, (t % 6) + 0.2);
}

const g: GalleryModule = {
  title: 'film core: frame, practicals, placeholder',
  duration: 6,
  paint(c, env) {
    const q = new URLSearchParams(location.search).get('q');
    const t = env.t;
    const jobs: ((cc: CanvasRenderingContext2D) => void)[] = [
      (cc) => shot(s01, 0, t, cc),
      (cc) => shot(s02, 1, t, cc),
      (cc) => practicals(t, cc),
      (cc) => placeholder(t, cc),
    ];
    if (q === '4') {
      const reel = createReel({ data, modules: {}, width: W, height: H });
      const b = buf(0);
      reel.render(t, b);
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    if (q != null) {
      const b = buf(0);
      jobs[Number(q)](b);
      c.drawImage(b.canvas, 0, 0, 1280, 720);
      return;
    }
    jobs.forEach((job, i) => {
      const b = buf(i);
      job(b);
      c.drawImage(b.canvas, (i % 2) * 640, Math.floor(i / 2) * 360, 640, 360);
    });
    void LAYERS;
  },
};
export default g;
