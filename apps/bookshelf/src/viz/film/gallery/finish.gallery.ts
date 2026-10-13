import type { GalleryModule } from './main';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { filmFinish, makeFilmFinish, paperTexture } from '../silhouette/finish';
import { dustMotes, godRays, smoke, windowBeam } from '../silhouette/atmosphere';
import { makeCanvas } from '../silhouette/atmosphere';
import { room, ROOM_WINDOWS } from './atmosphere.gallery';

// Split screen: left = raw frame, right = filmFinish (bloom, grain on twos, vignette, flicker).
// ?m=<mood> picks the mood; ?m=parchment shows the plate variant with screen-locked paper.
const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const M = (Q.get('m') ?? 'candleAmber') as Parameters<typeof mood>[0];
let lastMs = 0;

function candle(c: CanvasRenderingContext2D, x: number, y: number, P: ReturnType<typeof mood>, k: number) {
  c.fillStyle = P.ink;
  c.fillRect(x - 4, y + 10, 8, 120);
  c.fillRect(x - 22, y + 126, 44, 8);
  c.fillRect(x - 7, y - 20, 14, 32);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [r, a, col] of [
    [260, 0.16, P.halo],
    [70, 0.35, P.halo],
    [22, 0.75, P.core],
  ] as const) {
    const g = c.createRadialGradient(x, y - 30, 0, x, y - 30, r);
    g.addColorStop(0, withAlpha(col, a * k));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - 30 - r, r * 2, r * 2);
  }
  c.restore();
  c.fillStyle = P.core;
  c.beginPath();
  c.ellipse(x, y - 30, 3.5, 10, 0, 0, Math.PI * 2);
  c.fill();
}

const g: GalleryModule = {
  title: 'finish',
  duration: 4,
  fonts: ['500 18px "Cormorant SC"'],
  paint(c, ge) {
    const P = mood(M);
    const env = makeEnv({ mood: M, t: ge.t, seed: 5 });
    if (M === 'parchment') {
      c.fillStyle = P.haze;
      c.fillRect(0, 0, 1280, 720);
      paperTexture(c, { x: 0, y: 0, w: 1280, h: 720 }, { alpha: 0.5 });
      c.strokeStyle = P.ink;
      c.lineWidth = 1.5;
      c.strokeRect(80, 80, 1120, 560);
      c.font = 'italic 400 40px "EB Garamond"';
      c.fillStyle = P.ink;
      c.fillText('y = σ(w · x + b)', 480, 380);
    } else {
      room(c, P);
      const beams = ROOM_WINDOWS.map((r) => windowBeam(r, { x: -0.4, y: 1 }, 560, 1.25));
      godRays(c, { beams, intensity: 0.35, mullions: 2 }, env);
      dustMotes(c, { beam: beams[1] }, env);
      candle(c, 470, 470, P, 1);
      smoke(c, { x: 470, y: 425, kind: 'candle' }, env);
      c.fillStyle = P.fg;
      c.fillRect(1180, 0, 100, 720); // framing pillar
    }
    const cv = c.canvas;
    const keep = makeCanvas(cv.width / 2, cv.height);
    keep.getContext('2d')!.drawImage(cv, 0, 0);
    const finish = M === 'parchment' ? makeFilmFinish({ paper: 0 }) : filmFinish;
    const fenv = { W: 1280, H: 720, pxScale: ge.pxScale, frame: ge.frame, t: ge.t, seed: 5, mood: P };
    {
      // steady-state timing on a scratch copy (first call builds the grain tiles)
      const scratch = makeCanvas(cv.width, cv.height);
      const sc = scratch.getContext('2d')!;
      sc.drawImage(cv, 0, 0);
      finish(sc, fenv);
      const t0 = performance.now();
      for (let i = 0; i < 10; i++) finish(sc, { ...fenv, frame: fenv.frame + i });
      sc.getImageData(0, 0, 1, 1); // flush the GPU queue
      lastMs = (performance.now() - t0) / 10;
    }
    finish(c, fenv);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(keep, 0, 0);
    c.restore();
    c.fillStyle = 'rgba(255,240,210,0.6)';
    c.fillRect(639.5, 0, 1, 720);
    c.font = '500 18px "Cormorant SC"';
    c.letterSpacing = '2px';
    c.fillStyle = 'rgba(255,240,220,0.9)';
    c.fillText('raw', 24, 36);
    c.fillText(`film finish · ${lastMs.toFixed(1)} ms`, 664, 36);
    c.letterSpacing = '0px';
  },
};
export default g;
