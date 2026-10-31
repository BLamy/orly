import type { GalleryModule } from './main';
import { makeEnv, mood, withAlpha } from '../silhouette/palette';
import { POSES, addPose, withLife, type GestureId } from '../silhouette/puppet';
import { markIPerceptron } from '../silhouette/props';
import { backdrop } from './puppets.gallery';
import { cast, CAST_INFO, SPECS } from '../../films/perceptron-short/cast';

/**
 * perceptron-short cast line-up (labGreen).
 *   default   Frank Rosenblatt in the poses his shots use, both facings, plus a 64 px thumbnail test
 *   ?zoom     close-up study (head, hair, collar, lab coat) facing both ways
 *   ?scale    staged beside the Mark I Perceptron at action-plane size (ch01-s02 blocking check)
 */
const POSE_ROW: [GestureId, 'right' | 'left'][] = [
  ['stand', 'right'],
  ['present', 'right'],
  ['point', 'right'],
  ['think', 'right'],
  ['listen', 'left'],
  ['present', 'left'],
  ['authority', 'left'],
];

const g: GalleryModule = {
  title: 'cast: perceptron-short',
  duration: 6,
  fonts: ['15px Georgia'],
  paint(c, genv) {
    const env = makeEnv({ mood: 'labGreen', t: genv.t, seed: 58 });
    const p = mood('labGreen');
    const R = cast.rosenblatt;
    const q = new URLSearchParams(location.search);
    const life = (g: GestureId, seed: number) => {
      const base = POSES[g];
      return withLife({ ...base, prev: base }, env.tq, seed);
    };

    if (q.get('zoom') !== null) {
      backdrop(c, p, 720);
      R.draw(c, { x: 330, y: 1240, facing: 'right', pose: life('listen', 3), scale: 3.2 }, env);
      R.draw(c, { x: 960, y: 1240, facing: 'left', pose: life('present', 5), scale: 3.2 }, env);
      return;
    }
    if (q.get('scale') !== null) {
      backdrop(c, p, 662);
      const mk = { x: 560, y: 662, s: 1.0, seed: 2 };
      markIPerceptron(c, mk, env);
      R.draw(c, { x: 1060, y: 662, facing: 'left', pose: life('present', 7) }, env);
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.font = '15px Georgia';
      c.fillText('Mark I at s = 1 beside Rosenblatt (322 px)', 24, 700);
      return;
    }

    backdrop(c, p, 640);
    POSE_ROW.forEach(([gid, facing], i) => {
      const x = 90 + i * 168;
      const pose = addPose(life(gid, i * 13 + 1), i === 4 ? { hipF: 3, ankleF: -3 } : {});
      R.draw(c, { x, y: 640, facing, pose }, env);
      c.fillStyle = withAlpha(p.rim, 0.7);
      c.font = '15px Georgia';
      c.textAlign = 'center';
      c.fillText(`${gid} · ${facing}`, x + 6, 668);
    });
    // thumbnail test (style bible §4.1): 64 px tall
    const s = 64 / SPECS.rosenblatt.height;
    R.draw(c, { x: 1225, y: 640, facing: 'left', pose: life('stand', 9), scale: s }, env);
    c.fillStyle = withAlpha(p.rim, 0.7);
    c.fillText('64 px', 1225, 668);
    c.textAlign = 'left';
    c.font = 'italic 13px Georgia';
    c.fillStyle = withAlpha(p.rim, 0.55);
    c.fillText(`${CAST_INFO.rosenblatt.name} — ${CAST_INFO.rosenblatt.role} · ${SPECS.rosenblatt.wardrobe}, ${SPECS.rosenblatt.hair}, ${SPECS.rosenblatt.build}`, 24, 700);
  },
};
export default g;
