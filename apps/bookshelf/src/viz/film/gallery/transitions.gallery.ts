import type { GalleryModule } from './main';
import type { TransitionKind } from '../contracts';
import { makeEnv, mood } from '../silhouette/palette';
import { godRays, makeCanvas, snow, windowBeam, dustMotes, fogBank } from '../silhouette/atmosphere';
import { TRANSITIONS, makeIris } from '../silhouette/transitions';
import { room, street, ROOM_WINDOWS } from './atmosphere.gallery';

// All transitions at u = t / 4 in a grid (or ?k=<kind> full frame). A = dusk room, B = winter street.
const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const SOLO = Q.get('k') as TransitionKind | null;
const KINDS: TransitionKind[] = ['crossfade', 'iris', 'inkBleed', 'paperWipe', 'fadeBlack', 'lampChange', 'cut'];
const irisOnCandle = makeIris({ closeAt: { x: 470, y: 440 }, openAt: { x: 1000, y: 470 } });

function frameA(c: CanvasRenderingContext2D, t: number) {
  const P = mood('duskRose');
  const env = makeEnv({ mood: 'duskRose', t, seed: 3 });
  room(c, P);
  const beams = ROOM_WINDOWS.map((r) => windowBeam(r, { x: -0.4, y: 1 }, 560, 1.25));
  godRays(c, { beams, intensity: 0.4, mullions: 2 }, env);
  dustMotes(c, { beam: beams[1] }, env);
  c.fillStyle = P.core;
  c.beginPath();
  c.ellipse(470, 440, 4, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = P.ink;
  c.fillRect(466, 452, 8, 170);
}
function frameB(c: CanvasRenderingContext2D, t: number) {
  const P = mood('winterBlue');
  const env = makeEnv({ mood: 'winterBlue', t, seed: 4 });
  street(c, P);
  fogBank(c, { y: 610, height: 120, density: 0.45 }, env);
  snow(c, { count: 380, settle: { y: 642, depth: 14, rate: 20 } }, env);
}
function render(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = makeCanvas(w, h);
  const g = cv.getContext('2d')!;
  g.setTransform(w / 1280, 0, 0, h / 720, 0, 0);
  draw(g);
  return cv;
}

const g: GalleryModule = {
  title: 'transitions',
  duration: 4,
  fonts: ['500 16px "Cormorant SC"'],
  paint(c, ge) {
    const u = Math.max(0, Math.min(1, ge.t / 4));
    const DW = c.canvas.width;
    const DH = c.canvas.height;
    const cells = SOLO ? [SOLO] : KINDS;
    const cols = SOLO ? 1 : 3;
    const cw = Math.round(DW / cols);
    const ch = Math.round(DH / cols);
    const A = render(cw, ch, (g) => frameA(g, ge.t));
    const B = render(cw, ch, (g) => frameB(g, ge.t));
    const cell = makeCanvas(cw, ch);
    const cc = cell.getContext('2d')!;
    cells.forEach((k, i) => {
      const fn = k === 'iris' ? irisOnCandle : TRANSITIONS[k];
      fn(cc, A, B, u, { W: 1280, H: 720, pxScale: cw / 1280, seed: 11, frame: ge.frame, mood: mood(u < 0.5 ? 'duskRose' : 'winterBlue') });
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(cell, (i % cols) * cw, Math.floor(i / cols) * ch);
      c.restore();
      if (!SOLO) {
        const x = ((i % cols) * 1280) / cols;
        const y = (Math.floor(i / cols) * 720) / cols;
        c.font = '500 16px "Cormorant SC"';
        c.letterSpacing = '2px';
        c.fillStyle = 'rgba(255,240,220,0.92)';
        c.fillText(`${k} · u ${u.toFixed(2)}`, x + 12, y + 22);
        c.letterSpacing = '0px';
      }
    });
  },
};
export default g;
