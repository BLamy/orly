import type { GalleryModule } from './main';
import { makeEnv, mood } from '../silhouette/palette';
import { FILM_FONTS, annotation, chapterCard, nameCard, placeStamp, quoteCard, titleCard, loadFilmFonts } from '../silhouette/type';
import { paperTexture, filmFinish } from '../silhouette/finish';
import { fogBank, dustMotes, godRays, windowBeam } from '../silhouette/atmosphere';
import { backlight, room, street, ROOM_WINDOWS } from './atmosphere.gallery';
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { EquationPlate } from '../silhouette/overlays';

// ?v=title | backlit | chapter | stamps | name | quote | labels | plate   (default: title)
// plate mounts the React SVG overlay (EquationPlate) over the canvas, as the film harness does.
const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const V = Q.get('v') ?? 'title';

const g: GalleryModule = {
  title: `type: ${V}`,
  duration: 6,
  fonts: FILM_FONTS,
  async setup(ge) {
    await loadFilmFonts();
    if (V !== 'plate') return;
    const cv = document.querySelector('canvas')!;
    const host = document.createElement('div');
    host.style.cssText = `position:absolute;left:0;top:0;width:${cv.style.width};height:${cv.style.height}`;
    document.body.appendChild(host);
    const reveal = Math.max(0, Math.min(1, (ge.t - 0.3) / 1.6));
    createRoot(host).render(
      h(
        'svg',
        { viewBox: '0 0 1280 720', width: '100%', height: '100%', style: { position: 'absolute', inset: 0 } },
        h(EquationPlate, {
          tex: '\\mathbf{w} \\leftarrow \\mathbf{w} + \\eta\\,(y - \\hat{y})\\,\\mathbf{x}',
          x: 640,
          y: 330,
          width: 760,
          height: 280,
          title: 'The perceptron learning rule',
          caption: 'nudge each weight toward the answer it should have given',
          number: '(1)',
          reveal,
          rotate: -0.6,
        }),
      ),
    );
    await new Promise((r) => setTimeout(r, 300));
    await document.fonts.ready;
  },
  paint(c, ge) {
    const t = ge.t;
    // ?z=3&zx=640&zy=372 zooms on a stage point (to inspect ornaments)
    const z = Number(Q.get('z') ?? '1');
    if (z !== 1) {
      c.translate(640, 360);
      c.scale(z, z);
      c.translate(-Number(Q.get('zx') ?? '640'), -Number(Q.get('zy') ?? '360'));
    }
    let M: Parameters<typeof mood>[0] = 'duskRose';
    if (V === 'title' || V === 'backlit') {
      M = 'duskRose';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      if (V === 'backlit') {
        room(c, P);
        const beams = ROOM_WINDOWS.map((r) => windowBeam(r, { x: -0.4, y: 1 }, 560, 1.25));
        godRays(c, { beams, intensity: 0.5, mullions: 2 }, env);
        titleCard(c, { title: 'The Thinking Machine', subtitle: 'a history of neural networks', backlit: true, at: 0, size: 92, y: 330 }, env);
      } else {
        backlight(c, P);
        fogBank(c, { y: 600, height: 140, density: 0.45 }, env);
        dustMotes(c, { count: 90 }, env);
        titleCard(c, { kicker: 'an O’RLY? film', title: 'The Thinking Machine', subtitle: 'Seventy years of teaching computers to see', at: 0.2 }, env);
      }
    } else if (V === 'chapter') {
      M = 'candleAmber';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      backlight(c, P, 640);
      c.fillStyle = 'rgba(10,6,3,0.45)';
      c.fillRect(0, 0, 1280, 720);
      chapterCard(c, { number: 3, title: 'The Long Winter', dates: '1969 – 1986', at: 0.2 }, env);
    } else if (V === 'stamps') {
      M = 'winterBlue';
      const P = mood(M);
      street(c, P);
      const e = (sd: number) => ({ ...makeEnv({ mood: M, t, seed: sd }) });
      placeStamp(c, { place: 'Buffalo, New York', date: 'July 1958', year: 1958, at: 0.2, y: 520 }, e(1));
      placeStamp(c, { place: 'La Jolla, California', date: '1986', year: 1986, at: 0.6, y: 590 }, e(2));
      placeStamp(c, { place: 'Toronto, Ontario', date: 'September 2012', year: 2012, at: 1.0, y: 672 }, e(3));
    } else if (V === 'name') {
      M = 'labGreen';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      room(c, P);
      nameCard(c, { name: 'Frank Rosenblatt', role: 'Psychologist, Cornell Aeronautical Laboratory', years: '1928–1971', at: 0.2, dur: 5 }, env);
      nameCard(c, { name: 'Marvin Minsky', role: 'Mathematician, MIT', years: '1927–2016', at: 0.6, dur: 5, align: 'right', y: 140 }, env);
    } else if (V === 'quote') {
      M = 'winterBlue';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      backlight(c, P, 900);
      fogBank(c, { y: 640, height: 120, density: 0.4 }, env);
      quoteCard(
        c,
        {
          quote: 'The Analytical Engine has no pretensions whatever to originate anything.',
          speaker: 'Ada Lovelace',
          source: 'Notes on the Analytical Engine, Note G, 1843',
          at: 0.1,
        },
        env,
      );
    } else if (V === 'plate') {
      M = 'candleAmber';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      room(c, P);
      const beams = ROOM_WINDOWS.map((r) => windowBeam(r, { x: -0.4, y: 1 }, 560, 1.25));
      godRays(c, { beams, intensity: 0.35, mullions: 2 }, env);
    } else if (V === 'labels') {
      M = 'parchment';
      const P = mood(M);
      const env = makeEnv({ mood: M, t, seed: 2 });
      c.fillStyle = P.haze;
      c.fillRect(0, 0, 1280, 720);
      paperTexture(c, { x: 0, y: 0, w: 1280, h: 720 }, { alpha: 0.55 });
      // a small perceptron diagram in ink
      c.strokeStyle = P.ink;
      c.fillStyle = P.ink;
      c.lineWidth = 1.4;
      const ins = [220, 320, 420, 520];
      for (const y of ins) {
        c.beginPath();
        c.moveTo(380, y);
        c.lineTo(700, 370);
        c.stroke();
        c.beginPath();
        c.arc(360, y, 20, 0, Math.PI * 2);
        c.stroke();
      }
      c.beginPath();
      c.arc(740, 370, 42, 0, Math.PI * 2);
      c.stroke();
      c.font = 'italic 400 34px "EB Garamond"';
      c.textAlign = 'center';
      c.fillText('Σ', 740, 382);
      c.beginPath();
      c.moveTo(782, 370);
      c.lineTo(960, 370);
      c.stroke();
      c.textAlign = 'left';
      annotation(c, { text: 'inputs xᵢ', sub: 'photocell intensities', x: 340, y: 220, tx: 150, ty: 150, at: 0.1 }, env);
      annotation(c, { text: 'weights wᵢ', sub: 'adjusted after every mistake', x: 560, y: 330, tx: 620, ty: 200, at: 0.6 }, env);
      annotation(c, { text: 'threshold unit', x: 760, y: 400, tx: 880, ty: 520, at: 1.1 }, env);
    }
    filmFinish(c, { W: 1280, H: 720, pxScale: ge.pxScale, frame: ge.frame, t, seed: 4, mood: mood(M) });
  },
};
export default g;
