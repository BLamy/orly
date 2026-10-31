import type { GalleryModule } from './main';
import { makeEnv, withAlpha, mood } from '../silhouette/palette';
import { createPuppet, ERA_CAST, POSES, loopPose, poseTrack, seatHeight, withLife, type GestureId } from '../silhouette/puppet';
import { backdrop } from './puppets.gallery';

// The gesture vocabulary (style bible §4.5), two rows; ?big=<gesture> shows one pose large.
const ROW1: GestureId[] = ['stand', 'present', 'point', 'write', 'think', 'doubt', 'dissent'];
const ROW2: GestureId[] = ['triumph', 'despair', 'authority', 'lean', 'sit', 'type', 'listen'];
const who: Record<GestureId, number> = {
  stand: 0, present: 2, point: 4, write: 4, think: 6, doubt: 1, dissent: 8,
  triumph: 9, despair: 7, authority: 0, lean: 3, sit: 5, type: 8, listen: 3, walkStand: 0, rest: 1, clasp: 0, fold: 2, glasses: 6, pocket: 1, shift: 3,
};
const cast = ERA_CAST.map((s) => createPuppet(s));

// a track demo: present → point → think with holds, sampled on twos
const demo = poseTrack(null, 'demo', 'stand');
demo.to('present', { at: 0.5, dur: 0.5 });
demo.to('point', { at: 1.5, dur: 0.42 });
demo.to('think', { at: 3, dur: 0.6 });
demo.flip(4.6);

function furniture(c: CanvasRenderingContext2D, ink: string, x: number, floor: number, seatY: number, kind: 'chair' | 'table', facing = 1) {
  c.fillStyle = ink;
  if (kind === 'chair') {
    const sx = x - facing * 4;
    c.fillRect(sx - 20, seatY, 40, 5);
    c.fillRect(sx - 18, seatY, 3.4, floor - seatY);
    c.fillRect(sx + 15, seatY, 3.4, floor - seatY);
    const bx = facing > 0 ? sx - 20 : sx + 16.6;
    c.fillRect(bx, seatY - 70, 3.6, 70);
    c.fillRect(bx - 1, seatY - 72, 5.6, 4);
  } else {
    c.fillRect(x - 46, seatY, 92, 5);
    c.fillRect(x - 42, seatY + 5, 3.5, floor - seatY - 5);
    c.fillRect(x + 38, seatY + 5, 3.5, floor - seatY - 5);
  }
}

const g: GalleryModule = {
  title: 'puppets: gesture vocabulary',
  duration: 6,
  paint(c, genv) {
    const env = makeEnv({ mood: 'candleAmber', t: genv.t, seed: 3 });
    const p = mood('candleAmber');
    const ink = env.fill('ink');
    const big = new URLSearchParams(location.search).get('big');
    if (big) {
      backdrop(c, p, 690);
      const ges = big as GestureId;
      const i = who[ges] ?? 0;
      const base = ges === 'write' || ges === 'type' ? loopPose(ges, POSES[ges], env.tq) : POSES[ges];
      const pose = withLife({ ...base, prev: base }, env.tq, 5);
      const x = 560;
      const sc = 2;
      if (ges === 'sit' || ges === 'type') furniture(c, ink, x - 8 * sc, 690, 690 - seatHeight(ERA_CAST[i], POSES[ges]) * sc, 'chair');
      cast[i].draw(c, { x, y: 690, facing: ges === 'dissent' ? 'left' : 'right', pose, scale: sc }, env);
      if (ges === 'lean' || ges === 'type') furniture(c, ink, x + 150, 690, ges === 'lean' ? 690 - 170 * sc * 0.97 : 690 - 230 * sc * 0.75, 'table');
      return;
    }
    backdrop(c, p, 700);
    const rows: [GestureId[], number][] = [[ROW1, 335], [ROW2, 690]];
    const sc = 0.92;
    for (const [row, floor] of rows) {
      row.forEach((ges, j) => {
        const x = 95 + j * 178;
        const i = who[ges];
        const spec = ERA_CAST[i];
        const base = ges === 'write' || ges === 'type' ? loopPose(ges, POSES[ges], env.tq) : POSES[ges];
        const pose = withLife({ ...base, prev: base }, env.tq, j * 7 + floor);
        if (ges === 'sit' || ges === 'type') furniture(c, ink, x - 8 * sc, floor, floor - seatHeight(spec, POSES[ges]) * sc, 'chair');
        if (ges === 'lean') furniture(c, ink, x + 62, floor, floor - 136 * sc, 'table');
        if (ges === 'type') furniture(c, ink, x + 64, floor, floor - 168 * sc, 'table');
        if (ges === 'write') {
          c.fillStyle = withAlpha(p.ink, 0.85);
          c.fillRect(x + 70, floor - 300 * sc, 6, 300 * sc);
          c.fillStyle = withAlpha(p.halo, 0.12);
          c.fillRect(x + 60, floor - 290 * sc, 14, 160);
        }
        cast[i].draw(c, { x, y: floor, facing: ges === 'dissent' ? 'left' : 'right', pose, scale: sc }, env);
        c.fillStyle = withAlpha(p.rim, 0.75);
        c.font = 'italic 14px Georgia';
        c.textAlign = 'center';
        c.fillText(ges, x + 10, floor + 17);
      });
    }
    // live track (top-right corner badge): present → point → think → flip
    const s = demo.sample(genv.t);
    c.fillStyle = withAlpha(p.rim, 0.5);
    c.font = '11px Georgia';
    c.fillText(`track t=${genv.t.toFixed(2)} ${s.facing}`, 1200, 20);
  },
};
export default g;
