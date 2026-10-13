/**
 * perceptron-short — ch01-s02 / ch01-s03: Frank Rosenblatt as staged in the lab (the reveal and the bookend).
 *
 * A period read in silhouette (style bible §4.3, 1950s): a single-breasted suit jacket with notch lapels,
 * padded shoulders and a jacket hem that flares a little over the hip, a narrow tie whose knot shows in
 * the lapel notch, pleated trousers with cuffs, oxfords; short dark side-parted hair; clean-shaven, no
 * glasses (the cast spec). Cut-line details only (lapel, breast pocket, buttons, shirt cuff): no face
 * features, no likeness. The cast's neutral profile and slight, upright build.
 *
 *   rosenblattSuit            the puppet
 *   ROSENBLATT_SCALE          puppet scale on top of the machine's real-size scale
 *   ROSE_POSES                LOOK (profile, along the racks), LOOK_UP (chin lifted to the maker's plate),
 *                             NOD (a small look-down beat), PRESENT (the open, three-quarter present:
 *                             chest opened to the camera, near arm out toward the machine, palm up, a half
 *                             step toward it), shared by ch01-s02 and ch01-s03's bookend
 *   breath(tq, seed, k)       visible breathing on the twos (torso + shoulders, ≈3.6 s cycle)
 */
import type { PaintEnv, Pose, PuppetDrawOpts } from '../../../film/contracts';
import { withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK, WARDROBES, createPuppet } from '../../../film/silhouette/puppet';
import { POSES, addPose } from '../../../film/silhouette/puppet/poses';
import { SPECS } from '../cast';

const SUIT = 'ch01s02LabCoat1958';
/** round-1 critic: the cast's 1950s LAB COAT (not a suit) so the coat's hem and lapel read in profile: the
 * kit's lab coat, its skirt flaring a little more below the knee, over a narrow tie; few inner cut-lines
 * (lapel, pen pocket, hem line, cuff), a cut-out rather than an outline drawing */
WARDROBES[SUIT] = {
  ...WARDROBES.labCoat,
  pad: 0.35,
  waist: 0.25,
  lower: { waist: 0.36, hem: 66, flare: 2.5, coat: true },
  tie: 'narrow',
  details: ['lapel', 'penPocket', 'hemLine', 'cuff'],
};

/** puppet scale on top of the machine's real-size scale (≈ 181 cm beside 186 cm racks) */
export const ROSENBLATT_SCALE = 1.03;
export const rosenblattSuit = createPuppet({ ...SPECS.rosenblatt, wardrobe: SUIT, hair: 'sidePart', glasses: 'none', prop: 'none', details: ['lapel', 'penPocket', 'hemLine', 'cuff'] });
/** his cut-lines catch the WINDOW light only (review round 3, lab set craft): the windows are behind and above
 * him, so lines on his upper, window-facing edges keep their alpha and fade to nothing toward his feet (review
 * round 4: floor 0, was 0.12); no line reads as an all-round outline. A shot may pass its own `light` (its key
 * direction) to override. */
export const ROSE_LIGHT = { x: 0, y: -1, floor: 0 } as const;
/**
 * Value hierarchy (review round 4, lab set craft): he is the DARKEST shape in the lab, filled near-black
 * (PUPPET_NEAR_BLACK #0b0d0b) a step below the racks' ink, and his only edge light is a 1.5 px rim cut on his
 * own contour on the window side (the kit's edgeRim, along o.light's direction). Shots therefore rim the SET
 * with f.rim({ x: 0, y: -1 }) (tops only: no side or bottom strokes on the racks) and let him carry his own.
 * A shot may still pass `ink` (e.g. ink-on-ink while the board behind him sleeps) or `edgeRim` to override.
 */
export const ROSE_INK = PUPPET_NEAR_BLACK;
export const ROSE_RIM = { px: 1.5, alpha: 0.62 } as const;
/**
 * The tie (review round 3). Under the closed jacket the kit hides the tie unless it swings clear, so in
 * profile it is cut here: the knot as a small ink bump proud of the throat under the chin (it reads in the
 * silhouette's edge against the window), and the tie's front edge as one faint cut-line down the shirt front
 * between the lapels. Placed from the puppet's own head anchors, so it follows the head and the facing.
 */
function drawTie(c: CanvasRenderingContext2D, o: PuppetDrawOpts, env: PaintEnv, line = true) {
  // the head's own frame, recovered from its two anchors (head centre at (0, −0.55) and eye at (0.33, −0.5) in
  // head units): scale, rotation and the facing mirror, so the knot follows the head through every pose
  const head = rosenblattSuit.anchor(o, 'head');
  const eye = rosenblattSuit.anchor(o, 'eye');
  const sg = o.facing === 'left' ? -1 : 1;
  const vx = eye.x - head.x;
  const vy = eye.y - head.y;
  const hu = Math.hypot(vx, vy) / Math.hypot(0.33, 0.05);
  const phi = Math.atan2(vy, sg * vx) - Math.atan2(0.05, 0.33);
  const cs = Math.cos(phi);
  const sn = Math.sin(phi);
  const P = (u: number, v: number) => {
    const a = u * hu;
    const b = (v + 0.55) * hu;
    return { x: head.x + sg * (a * cs - b * sn), y: head.y + a * sn + b * cs };
  };
  c.save();
  // the knot in the collar notch, under the chin: a small ink wedge proud of the shirt front
  c.fillStyle = o.ink ?? env.fill('ink');
  c.beginPath();
  for (const [i, [u, v]] of ([[0.12, 0.3], [0.33, 0.3], [0.36, 0.38], [0.3, 0.47], [0.14, 0.47]] as const).entries()) {
    const q = P(u, v);
    if (i === 0) c.moveTo(q.x, q.y);
    else c.lineTo(q.x, q.y);
  }
  c.closePath();
  c.fill();
  if (!line) {
    c.restore();
    return;
  }
  // the tie's front edge, faint, down the shirt front between the lapels
  const lit = o.light ? Math.max(o.light.floor ?? 0.12, Math.min(1, 0.5 + 0.5 * (o.light.x * sg))) : 1;
  c.strokeStyle = withAlpha(env.fill('rim'), 0.32 * lit);
  c.lineWidth = Math.max(0.8, 0.045 * hu);
  c.lineCap = 'round';
  const t0 = P(0.3, 0.47);
  const t1 = P(0.34, 0.9);
  const t2 = P(0.3, 1.35);
  c.beginPath();
  c.moveTo(t0.x, t0.y);
  c.quadraticCurveTo(t1.x, t1.y, t2.x, t2.y);
  c.stroke();
  c.restore();
}
{
  const drawBase = rosenblattSuit.draw;
  rosenblattSuit.draw = (c, o, env) => {
    const light = o.light ?? ROSE_LIGHT;
    const oo: PuppetDrawOpts = { ...o, light, ink: o.ink ?? ROSE_INK, edgeRim: o.edgeRim ?? { x: light.x, y: light.y, ...ROSE_RIM } };
    drawBase(c, oo, env);
    // the knot is CONTOUR (it reads in the silhouette's edge), so it is cut even with cutLines off (review round
    // 4, close-ups: detail on the outline, no interior seams); the tie's front line is an interior cut-line
    drawTie(c, oo, env, o.cutLines !== false);
  };
}

/** weight on the back leg, the front knee eased (contrapposto); hands relaxed; looking along the racks */
const LOOK: Pose = addPose(POSES.rest, { hipF: 8, kneeF: -10, hipB: -4, kneeB: 2, neck: 0, head: -2, shoulderF: 3, elbowF: 14, wristF: 2, shoulderB: -2, elbowB: 10 });
/** the chin lifts toward the maker's plate as the machine's name is spoken */
const LOOK_UP: Pose = addPose(LOOK, { head: -6, neck: -2 });
/** a small look down and back up: the talk beat on "built" */
const NOD: Pose = addPose(LOOK_UP, { head: 7, neck: 3 });
/** the open present: chest turned out toward the camera (torso back, back arm opened behind), a half
 * step toward the machine, the near arm extended to it with the palm up, the head up and out */
const PRESENT: Pose = {
  ...addPose(POSES.stand, { hipF: 9, kneeF: -5, hipB: -5, torso: -5, neck: -3, head: -5, shoulderF: 52, elbowF: 22, wristF: -26, shoulderB: -16, elbowB: 18, wristB: 4 }),
  handF: 'open',
};
/** at work at the patch board (facing it, left): the near arm up into the cords at chest height, the head
 * a little down on the hand, the feet under him (no stride) */
const WORK: Pose = { ...addPose(POSES.stand, { hipF: 3, kneeF: -4, hipB: -2, kneeB: 2, torso: 2, neck: 3, head: 5, shoulderF: 44, elbowF: 64, wristF: -13, shoulderB: -2, elbowB: 12 }), handF: 'open' };
/** s02's present after the turn on "Frank": the near arm lifted a little higher toward the maker's plate,
 * the elbow eased ≈15°, an open relaxed hand; the head level, his eyeline along the racks to the meter panel */
const PRESENT_UP: Pose = { ...addPose(PRESENT, { shoulderF: 12, elbowF: 15, wristF: 8, head: 4, neck: 2 }), handF: 'open' };
/** review round 3, s02 on "Frank": turned to face the racks (RIGHT), he presents the maker's plate on the first
 * rack's header with his near arm: out at chest height just under the plate, the elbow bent ≈15°, an open
 * relaxed hand; the head LEVEL, so the eyeline runs along the racks to the meter panel; weight settled on
 * the back foot, the far arm easy */
const PRESENT_PLATE: Pose = {
  ...addPose(POSES.stand, { hipF: 7, kneeF: -5, hipB: -4, kneeB: 2, torso: -3, neck: -1, head: -1, shoulderF: 88, elbowF: 18, wristF: -28, shoulderB: -6, elbowB: 14, wristB: 4 }),
  handF: 'open',
};
/** review round 4, s02 on "Frank": still facing LEFT (camera-left, toward his machine), he opens out of the
 * work at the board into a present toward the EYE on its stand: chest turned out to the camera, the near arm
 * opened out at chest height toward the eye (elbow eased, forearm a little lower, wrist bent ≈12°, open hand
 * palm up), the head lifted off the cords and level toward the eye, weight settling on the back foot */
const PRESENT_EYE: Pose = {
  ...addPose(POSES.stand, { hipF: 6, kneeF: -5, hipB: -4, kneeB: 2, torso: -4, neck: -2, head: -3, shoulderF: 62, elbowF: 24, wristF: -12, shoulderB: -10, elbowB: 16, wristB: 4 }),
  handF: 'open',
};
/** the turn's mid-pose: arms in, upright (drawn edge-on, so the flip reads as a turn, not a pop) */
const TURN_MID: Pose = addPose(POSES.stand, { shoulderF: 14, elbowF: 30, torso: 0, head: 0 });
export const ROSE_POSES = { LOOK, LOOK_UP, NOD, PRESENT, WORK, PRESENT_UP, PRESENT_PLATE, PRESENT_EYE, TURN_MID };

/** visible breathing, on the twos: the chest rises and the shoulders lift a little (≈3.6 s per breath) */
export function breath(tq: number, seed: number, k = 1): Partial<Record<'torso' | 'neck' | 'shoulderF' | 'shoulderB' | 'elbowF', number>> {
  const s = Math.sin((tq / 3.6) * Math.PI * 2 + seed * 1.7);
  return { torso: -1.6 * s * k, neck: 0.8 * s * k, shoulderF: 1.8 * s * k, shoulderB: 1.8 * s * k, elbowF: 1.2 * s * k };
}
