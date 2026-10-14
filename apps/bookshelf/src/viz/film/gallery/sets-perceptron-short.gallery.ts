import type { GalleryModule } from './main';
import { CAMERA3_HOME } from '../contracts';
import { createFrame } from '../core/frame';
import { camMove } from '../core/multiplane';
import { POSES, withLife } from '../silhouette/puppet';
import { markIPerceptron } from '../silhouette/props';
import { cast } from '../../films/perceptron-short/cast';
import { LAB, labNear, labRoom, labTubes } from '../../films/perceptron-short/sets/lab';

/**
 * perceptron-short shared set: the Cornell Aeronautical Laboratory room (sets/lab.ts),
 * rendered through the real multiplane Frame at 1920x1080.
 *   ?v=0  empty room at rest (the ch01-s01 title framing)          t drives a slow dolly to the middle window
 *   ?v=1  dressed: Mark I on the action plane + Rosenblatt, near desk + column (ch01-s02 blocking)
 *   ?v=2  v=1 framing trucked right by 320 (parallax / overscan check)
 */
const W = 1920, H = 1080;
let buf: CanvasRenderingContext2D | null = null;

const g: GalleryModule = {
  title: 'sets: perceptron-short lab',
  duration: 6,
  paint(c, genv) {
    const v = Number(new URLSearchParams(location.search).get('v') ?? '0');
    if (!buf) {
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      buf = cv.getContext('2d')!;
    }
    const t = genv.t;
    const f = createFrame({ c: buf, pxScale: 1.5, t, fps: 24, seed: 58, mood: 'labGreen' });
    const key = `gallery-lab-v${v}`;
    if (v === 0) {
      const END = camMove(0, 140);
      const cams = [CAMERA3_HOME, END];
      const u = Math.min(1, t / 6);
      f.camera({ ...CAMERA3_HOME, z: 140 * u * u * (3 - 2 * u) });
      labRoom(f, { key, cams });
      f.rim();
      labTubes(f, { cams });
    } else {
      const A = camMove(-60, 0);
      const B = camMove(320, 60);
      const cams = [A, B];
      f.camera(v === 2 ? B : A);
      labRoom(f, { key, cams, sunX: 700 });
      f.layer('L4', (cc, env) => {
        markIPerceptron(cc, { x: 520, y: LAB.floorY, s: 0.92, seed: 2 }, env);
        const base = POSES.present;
        cast.rosenblatt.draw(cc, { x: 1010, y: LAB.floorY, facing: 'left', pose: withLife({ ...base, prev: base }, env.tq, 4) }, env);
      });
      f.rim({ x: 0.2, y: -1 });
      labTubes(f, { cams });
      labNear(f, { key, cams, desk: { x: -220, w: 520 }, column: { x: -60 } });
    }
    c.drawImage(buf.canvas, 0, 0, 1280, 720);
  },
};
export default g;
