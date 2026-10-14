import type { GalleryModule } from './main';
import type { Palette } from '../contracts';
import { makeEnv, withAlpha, mood } from '../silhouette/palette';
import type { PuppetSpec } from '../contracts';
import type { JointId } from '../contracts';
import { addPose, createPuppet, ERA_CAST, POSES, WARDROBES, HAIR_STYLES, withLife, type GestureId } from '../silhouette/puppet';

// Line-up: ten era characters, 1940s → 2020s, against a dusk backlight.
const cast = ERA_CAST.map((s) => createPuppet(s));
const LINEUP_POSE: GestureId[] = ['clasp', 'rest', 'authority', 'stand', 'think', 'rest', 'listen', 'authority', 'stand', 'listen'];
// small per-character stance variations (weight, stride, carriage) so the line never reads cloned
const VARY: Partial<Record<JointId, number>>[] = [
  { hipF: 4, hipB: -3, ankleF: -4, ankleB: 3 },
  { hipF: -2, ankleF: 2 },
  { hipF: 3, hipB: -3, ankleF: -3, ankleB: 3, torso: -1 },
  { hipF: 7, kneeF: -10, ankleF: 3, hipB: -2, ankleB: 2, neck: 2 },
  {},
  { hipF: 2, ankleF: -2, head: -2 },
  { hipB: -5, kneeB: -4, ankleB: 9, torso: 1 },
  { hipF: 2, ankleF: -2 },
  { hipF: 5, kneeF: -6, ankleF: 1, hipB: -3, ankleB: 3, neck: 4, head: 2 },
  { hipF: 3, hipB: -2, ankleF: -3, ankleB: 2 },
];
const lineupPose = (i: number) => addPose(POSES[LINEUP_POSE[i]], VARY[i] ?? {});

export function backdrop(c: CanvasRenderingContext2D, p: Palette, floorY = 640) {
  const g = c.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, p.sky[0]);
  g.addColorStop(0.35, p.sky[1]);
  g.addColorStop(p.horizon, p.sky[3]);
  g.addColorStop(1, p.sky[2]);
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // soft sun bloom behind the line
  const r = c.createRadialGradient(640, 430, 20, 640, 430, 620);
  r.addColorStop(0, withAlpha(p.halo, 0.28));
  r.addColorStop(1, withAlpha(p.halo, 0));
  c.fillStyle = r;
  c.fillRect(0, 0, 1280, 720);
  // haze band
  const h = c.createLinearGradient(0, 380, 0, 640);
  h.addColorStop(0, withAlpha(p.haze, 0));
  h.addColorStop(0.6, withAlpha(p.haze, 0.25));
  h.addColorStop(1, withAlpha(p.haze, 0));
  c.fillStyle = h;
  c.fillRect(0, 380, 1280, 260);
  c.fillStyle = p.fg;
  c.fillRect(0, floorY, 1280, 720 - floorY);
  c.fillStyle = withAlpha(p.rim, 0.12);
  c.fillRect(0, floorY, 1280, 1.2);
}

const g: GalleryModule = {
  title: 'puppets: era line-up',
  duration: 8,
  paint(c, genv) {
    const env = makeEnv({ mood: 'duskRose', t: genv.t, seed: 7 });
    const p = mood('duskRose');
    backdrop(c, p);
    const n = cast.length;
    const q = new URLSearchParams(location.search);
    if (q.get('perf') !== null) {
      // gallery-only timing (never in painters): 10 puppets × 40 frames at 1080p
      const t0 = performance.now();
      for (let f = 0; f < 40; f++)
        cast.forEach((pup, i) => {
          const base = lineupPose(i);
          const e = makeEnv({ mood: 'duskRose', t: f / 24, seed: 7 });
          pup.draw(c, { x: 70 + i * 126, y: 640, facing: 'right', pose: withLife({ ...base, prev: base }, e.tq, i) }, e);
        });
      const ms = (performance.now() - t0) / 40;
      backdrop(c, p);
      c.fillStyle = '#fff';
      c.font = '40px Georgia';
      c.fillText(`${ms.toFixed(2)} ms / frame for 10 puppets`, 100, 200);
      return;
    }
    if (q.get('all') !== null) {
      // every wardrobe (row-major) with hair styles cycling: a QA sheet
      backdrop(c, p, 720);
      const names = Object.keys(WARDROBES).filter((n) => n !== 'labcoat');
      const per = Math.ceil(names.length / 2);
      const extras: Partial<PuppetSpec>[] = [
        { facialHair: 'goatee', glasses: 'rimless' }, { hat: 'cap' }, { facialHair: 'stubble' }, { hat: 'beanie' }, { glasses: 'round' },
        { facialHair: 'moustache' }, {}, { glasses: 'browline' }, { hat: 'cap', facialHair: 'beard' },
      ];
      names.forEach((n, i) => {
        const row = Math.floor(i / per);
        const col = i % per;
        const spec: PuppetSpec = {
          id: `qa-${n}`, height: 300, build: (['average', 'slight', 'tall', 'stocky'] as const)[i % 4], era: i % 3 ? '1990s' : '1960s',
          wardrobe: n, hair: HAIR_STYLES[i % HAIR_STYLES.length], ...extras[i % extras.length],
        };
        const pup = createPuppet(spec);
        const x = 50 + col * (1180 / (per - 1));
        const y = row ? 700 : 345;
        const base = POSES.stand;
        pup.draw(c, { x, y, facing: i % 5 === 4 ? 'left' : 'right', pose: base, scale: 0.98 }, env);
        c.fillStyle = withAlpha(p.rim, 0.75);
        c.font = '10px Georgia';
        c.textAlign = 'center';
        c.fillText(`${n}`, x + 6, y + 12);
        c.fillText(`${spec.hair}`, x + 6, y - 318 * 0.98 + (row ? 0 : 0));
      });
      return;
    }
    if (q.get('scene') !== null) {
      // two-shot at the reference's scale (~50% of frame height), facing each other across a divider
      backdrop(c, p, 660);
      c.fillStyle = env.fill('ink');
      c.fillRect(632, 300, 16, 360);
      const a = cast[0];
      const b = cast[2];
      const sa = POSES.present;
      const sb = POSES.listen;
      a.draw(c, { x: 400, y: 660, facing: 'right', pose: withLife({ ...sa, prev: sa }, env.tq, 1), scale: 1.16 }, env);
      b.draw(c, { x: 880, y: 660, facing: 'left', pose: withLife({ ...sb, prev: sb }, env.tq, 2), scale: 1.1 }, env);
      return;
    }
    const zoom = q.get('zoom');
    if (zoom !== null) {
      // close-up study: three characters at 2.1x (feet below frame), facing both ways
      const z0 = Number(zoom);
      backdrop(c, p, 720);
      for (let j = 0; j < 3; j++) {
        const i = (z0 + j) % n;
        const base = lineupPose(i);
        const pose = withLife({ ...base, prev: base }, env.tq, i * 11 + 3);
        cast[i].draw(c, { x: 230 + j * 420, y: 1010, facing: j === 1 ? 'left' : 'right', pose, scale: 2.8 }, env);
      }
      return;
    }
    cast.forEach((pup, i) => {
      const x = 70 + i * ((1280 - 140) / (n - 1));
      const base = lineupPose(i);
      const pose = withLife({ ...base, prev: base }, env.tq, i * 11 + 3);
      pup.draw(c, { x, y: 640, facing: 'right', pose }, env);
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.font = '15px Georgia';
      c.textAlign = 'center';
      c.fillText(ERA_CAST[i].label, x + 6, 672);
      c.font = 'italic 11px Georgia';
      c.fillStyle = withAlpha(p.rim, 0.5);
      c.fillText(ERA_CAST[i].wardrobe, x + 6, 688);
    });
  },
};
export default g;
