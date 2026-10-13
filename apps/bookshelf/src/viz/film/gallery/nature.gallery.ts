import type { GalleryModule } from './main';
import { makeEnv, withAlpha } from '../silhouette/palette';
import { backlight, fog, layer, vignette, wl, wx, wy, type Stage } from './sets.gallery';
import { forestBand, tree, type TreeKind } from '../silhouette/nature/trees';
import { mountains, snowfield } from '../silhouette/nature/terrain';
import { cloudBank, moon, stars } from '../silhouette/nature/sky';

// Nature kit: t in [0,1) winter night, [1,2) tree catalogue, [2,3) misty valley at dawn.
type Scene = { name: string; paint(s: Stage): void };

const winter: Scene = {
  name: 'winter night (winterBlue)',
  paint(s) {
    s.m = 'winterBlue';
    backlight(s, 860, 0.8);
    layer(s, 'L1', (c, env) => {
      stars(c, { x: wx('L1', 0), y: wy('L1', 0), w: wl('L1', 1280), h: wl('L1', 330), count: 220, seed: 3 }, env);
      moon(c, { x: wx("L1", 960), y: wy("L1", 130), r: 110, phase: 0.62 }, env);
      mountains(c, { x0: wx('L1', -50), x1: wx('L1', 1330), y: wy('L1', 470), amp: wl('L1', 190), ranges: 3, seed: 11, mist: 0.7, snowCaps: 0.9 }, env);
    });
    fog(s, 720 * 0.62, 720 * 0.35, 0.28);
    layer(s, 'L2', (c, env) => forestBand(c, { x0: wx('L2', -60), x1: wx('L2', 1340), y: wy('L2', 500), h: wl('L2', 95), kind: 'pine', density: 3.2, seed: 4, snow: 0.8, ground: 400 }, env));
    layer(s, 'L3', (c, env) => snowfield(c, { x0: wx('L3', -60), x1: wx('L3', 1340), y: wy('L3', 520), depth: wl('L3', 260), seed: 2, fence: true, drifts: 6 }, env));
    fog(s, 720 * 0.72, 720 * 0.2, 0.1);
    layer(s, 'L4', (c, env) => {
      tree(c, { x: 330, y: 650, h: 430, kind: 'oak', seed: 21, snow: 0.8 }, env);
      tree(c, { x: 1040, y: 620, h: 300, kind: 'birch', seed: 5, snow: 0.6, lean: 0.06 }, env);
    });
    layer(s, 'L6', (c, env) => tree(c, { x: wx('L6', 1280), y: wy('L6', 760), h: wl('L6', 900), kind: 'oak', seed: 99, lean: -0.5, role: 'fg' }, env));
    vignette(s);
  },
};

const catalogue: Scene = {
  name: 'tree catalogue (duskRose)',
  paint(s) {
    s.m = 'duskRose';
    backlight(s, 640);
    const env = makeEnv({ mood: 'duskRose', layer: 'L4' });
    const kinds: [TreeKind, number, number][] = [['oak', 0, 0], ['elm', 0, 0], ['birch', 0, 0], ['willow', 0, 0], ['pine', 0, 0], ['sapling', 0, 0], ['elm', 0.9, 0], ['oak', 0, 0.9]];
    kinds.forEach(([k, leaves, snow], i) => {
      const x = 90 + i * 157;
      tree(s.c, { x, y: 640, h: k === 'sapling' ? 180 : 300, kind: k, seed: 7 + i, leaves, snow }, env);
      s.c.fillStyle = withAlpha(env.mood.ink, 0.8);
      s.c.font = '600 15px Georgia';
      s.c.textAlign = 'center';
      s.c.fillText(`${k}${leaves ? ' + leaves' : ''}${snow ? ' + snow' : ''}`, x, 680);
    });
    s.c.fillStyle = env.fill('ink');
    s.c.fillRect(0, 642, 1280, 4);
  },
};

const valley: Scene = {
  name: 'misty valley (dawnGold)',
  paint(s) {
    s.m = 'dawnGold';
    backlight(s, 640, 1.1);
    layer(s, 'L1', (c, env) => {
      cloudBank(c, { x0: wx('L1', -100), x1: wx('L1', 1380), y: wy('L1', 170), h: wl('L1', 60), count: 6, seed: 4, tone: 0.45, drift: 6 }, env);
      mountains(c, { x0: wx('L1', -60), x1: wx('L1', 1340), y: wy('L1', 560), amp: wl('L1', 300), ranges: 5, seed: 31, mist: 0.55, valley: 0.6 }, env);
    });
    fog(s, 720 * 0.66, 720 * 0.4, 0.3);
    layer(s, 'L3', (c, env) => forestBand(c, { x0: wx('L3', -60), x1: wx('L3', 1340), y: wy('L3', 600), h: wl('L3', 110), kind: 'leafy', density: 2.2, seed: 9, ground: 300 }, env));
    layer(s, 'L4', (c, env) => tree(c, { x: 190, y: 700, h: 470, kind: 'elm', seed: 3, leaves: 0.7 }, env));
    vignette(s);
  },
};

const SCENES = [winter, catalogue, valley];

const g: GalleryModule = {
  title: 'nature kit',
  duration: SCENES.length,
  fonts: ['600 16px Georgia'],
  paint(c, env) {
    const i = Math.min(SCENES.length - 1, Math.floor(env.t + 1e-6));
    const s: Stage = { c, m: 'duskRose', t: env.t, pxScale: env.pxScale };
    SCENES[i].paint(s);
    c.fillStyle = 'rgba(255,240,220,0.75)';
    c.font = '600 16px Georgia';
    c.textAlign = 'left';
    c.fillText(SCENES[i].name, 18, 704);
  },
};
export default g;
