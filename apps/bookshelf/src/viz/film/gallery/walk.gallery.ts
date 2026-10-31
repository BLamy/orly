import type { GalleryModule } from './main';
import { makeEnv, withAlpha, mood } from '../silhouette/palette';
import { createPuppet, ERA_CAST, feet, walkCycle, walkTo, WALK_CYCLE_SEC } from '../silhouette/puppet';
import { backdrop } from './puppets.gallery';

// Walk cycle: top = the 16 drawings of one cycle (on twos) side by side, each
// placed at its true root x so planted feet line up across drawings;
// bottom = live walkers (one entering, one leaving left, one walkTo + settle).
const A = ERA_CAST[2];
const B = ERA_CAST[3];
const C = ERA_CAST[8];
const pa = createPuppet(A);
const pb = createPuppet(B);
const pc = createPuppet(C);
const strip = walkCycle(A, { x0: 0, facing: 'right', scale: 0.62 });
const w1 = walkCycle(B, { x0: -40, facing: 'right', start: 0 });
const w2 = walkCycle(C, { x0: 1320, facing: 'left', start: 0.3 });
const w3 = walkTo(A, { x0: 140, x1: 700, at: 0.5 });

const g: GalleryModule = {
  title: 'puppets: walk cycle',
  duration: 6,
  paint(c, genv) {
    const env = makeEnv({ mood: 'dawnGold', t: genv.t, seed: 4 });
    const p = mood('dawnGold');
    backdrop(c, p, 690);
    // strip: 16 drawings; spacing adds a fixed offset per drawing so they don't overlap
    c.fillStyle = withAlpha(p.ink, 0.92);
    c.fillRect(0, 300, 1280, 2);
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * WALK_CYCLE_SEC + 1e-4;
      const s = strip(t);
      const ox = 30 + i * 74;
      pa.draw(c, { x: ox + s.x * 0.25, y: 300, facing: 'right', pose: s.pose, scale: 0.62 }, env);
      c.fillStyle = withAlpha(p.rim, 0.6);
      c.font = '10px Georgia';
      c.textAlign = 'center';
      c.fillText(String(i + 1), ox + 8, 316);
    }
    const live = [
      { pup: pb, s: w1(genv.t) },
      { pup: pc, s: w2(genv.t) },
      { pup: pa, s: w3(genv.t) },
    ];
    for (const { pup, s } of live) pup.draw(c, { x: s.x, y: 690, facing: s.facing, pose: s.pose }, env);
    // QA: planted-foot slip over two cycles (a grounded foot must not move)
    let slip = 0;
    for (let i = 1; i < 32; i++) {
      const a = w1((i - 1) / 12 + 1e-4);
      const b = w1(i / 12 + 1e-4);
      const fa = feet(B, { x: a.x, y: 690, facing: 'right', pose: a.pose });
      const fb = feet(B, { x: b.x, y: 690, facing: 'right', pose: b.pose });
      for (const leg of ['F', 'B'] as const)
        for (const pt of ['heel', 'toe'] as const)
          if (fa[leg][pt].y > 689.5 && fb[leg][pt].y > 689.5) slip = Math.max(slip, Math.abs(fa[leg][pt].x - fb[leg][pt].x));
    }
    c.fillStyle = withAlpha(p.rim, 0.7);
    c.font = 'italic 13px Georgia';
    c.textAlign = 'left';
    c.fillText(`max planted-contact slip: ${slip.toFixed(2)} px`, 20, 44);
    c.textAlign = 'left';
    c.fillText(`t = ${genv.t.toFixed(2)} s   (cycle ${WALK_CYCLE_SEC.toFixed(3)} s, 16 drawings on twos)`, 20, 24);
  },
};
export default g;
