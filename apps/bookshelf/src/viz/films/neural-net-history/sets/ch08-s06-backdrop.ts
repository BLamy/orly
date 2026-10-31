/**
 * ch08-s06 / ch08-s09 — the cathedral's surroundings, seen from its steps: far hills and a town's trees (L1),
 * cloister wings with arcades and two far spires (L2), elms flanking the steps (L3), and a near elm's branches
 * reaching in from the upper left (L5, blurred). All baked once per mood (cached).
 *
 *   cathedralBackdrop(f, id, cams, { stars? })   L1 → fog A → L2 → L3 → fog B   (call after f.backlight)
 *   cathedralNear(f, id, cams)                   L5 (call after the L4 façade and f.rim)
 */
import type { Camera3, Frame } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { forestBand, ridgeline, stars, tree } from '../../../film/silhouette/nature';

export function cathedralBackdrop(f: Frame, id: string, cams: Camera3[], o: { stars?: boolean } = {}): void {
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, cams, 40);
    if (o.stars) stars(c, { x: r.x, y: r.y, w: r.w, h: 520 - r.y, count: 150, seed: 908, twinkle: 0.35 }, env);
    f.cached(`${id}/L1/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 560, amp: 70, seed: 81, scale: 420, ground: 400 }, env);
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 590, h: 34, kind: 'leafy', density: 3, seed: 82, ground: 300 }, env);
    })(c, r.x, r.y);
  });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 40);
    f.cached(`${id}/L2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = env.fill('set');
      for (const side of [-1, 1]) {
        const x0 = 640 + side * 520;
        const x1 = 640 + side * 1500;
        const xa = Math.min(x0, x1);
        const w = Math.abs(x1 - x0);
        const roof = new Path2D();
        roof.moveTo(xa, 472);
        roof.lineTo(xa + w / 2, 430);
        roof.lineTo(xa + w, 472);
        roof.closePath();
        cc.fill(roof);
        const wall = new Path2D();
        wall.rect(xa, 470, w, 400);
        for (let x = xa + 20; x < xa + w - 30; x += 46) {
          wall.moveTo(x, 600);
          wall.lineTo(x, 540);
          wall.quadraticCurveTo(x + 11, 522, x + 22, 540);
          wall.lineTo(x + 22, 600);
          wall.closePath();
        }
        cc.fill(wall, 'evenodd');
        const sx = 640 + side * 780;
        cc.beginPath();
        cc.moveTo(sx - 26, 474);
        cc.lineTo(sx - 26, 300);
        cc.lineTo(sx, 170);
        cc.lineTo(sx + 26, 300);
        cc.lineTo(sx + 26, 474);
        cc.closePath();
        cc.fill();
      }
    })(c, r.x, r.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 40);
    f.cached(`${id}/L3/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      tree(cc, { x: -40, y: 720, h: 440, kind: 'elm', seed: 61, leaves: 0.7, detail: 0.8 }, env);
      tree(cc, { x: 1330, y: 720, h: 470, kind: 'elm', seed: 62, leaves: 0.7, detail: 0.8 }, env);
    })(c, r.x, r.y);
  });
  f.fog('B');
}

export function cathedralNear(f: Frame, id: string, cams: Camera3[]): void {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    f.cached(`${id}/L5/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      tree(cc, { x: -560, y: 1060, h: 1250, kind: 'elm', seed: 71, leaves: 0.2, detail: 0.75, role: 'fg', lean: 0.45 }, env);
    })(c, r.x, r.y);
  });
}
