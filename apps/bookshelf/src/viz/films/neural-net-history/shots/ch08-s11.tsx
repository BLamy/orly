/**
 * ch08-s11 — Florence, 2012: an overfull hall, a young presenter at the lectern, Hinton absent (a small far
 * inset), and LeCun standing at the rear wall (dawnGold; 11.29 s; in on fadeBlack from the misty hills).
 * Clock of 2026-10-12 (round 2: L0821 re-narrated solo at 0.85, 'A bad back... kept Hinton from flying. Yann Le Cun
 * stood at the rear of a packed room.', 4.46 → 10.76 s): every beat is read from the clock (T.word / T.beat): the
 * hall cut at 4.26, the inset opens on 'kept' (5.77) so it is full on 'Hinton' (6.11) and closes as 'flying' ends
 * (≈ 7.4); the pan reaches the rear wall on 'Yann' (7.88) and settles by 'rear' (9.49); hold on the packed room.
 *
 *   0 → 'Florence'  establishing exterior: the city at late-afternoon gold, a ribbed dome and a slender bell tower
 *                   in silhouette against luminous haze (the hall itself stays generic); a slow push; the place
 *                   stamp FLORENCE · FRIDAY 12 OCTOBER 2012 · 17:05 types on
 *   line end        cut inside: a dark hall lit by one projected screen (a bright rectangle, nothing on it), a
 *                   dusty projector beam over rows of heads; a young presenter (Krizhevsky, from the side, at a
 *                   distance) at the lectern; Li seated near the front in profile; the label sets in
 *   'Hinton'        a small brass-rimmed lantern-slide inset opens at the upper frame edge: Hinton standing
 *                   alone at a lectern-height desk, far away (never seated, never in the hall); name card
 *                   'Geoffrey Hinton' beside it; both close as 'flying' ends
 *   after 'flying'  a slow pan carries along the packed aisles, people standing shoulder to shoulder, to the rear
 *                   wall: LeCun stands against it among other standing figures, in profile, arms folded, picked out
 *                   by a rim of the screen's light; name card (with the source tag on its second line)
 *   hold            the room in the light of the screen
 * TEXT: stamp, two name cards; labels "ImageNet challenge workshop, ECCV" and "the full room, by Fei-Fei Li's
 * account" (set as the LeCun card's second line).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import {
  LAYERS, POSES, PUPPET_NEAR_BLACK, chair, defineShot, mixLab, overscan, placeStamp, podium, pose, seatHeight, toLayer, toScreen, withAlpha, withLife,
} from '../../../film';
import { FONT, softPlate, textColor } from '../../../film/silhouette/type';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { SPECS, cast } from '../cast';
import { ATTENDEES, florenceSkyline, projectorBeam } from '../sets/ch08-s11-florence';
import { audienceHeads, hallDark } from '../sets/ch08-s12-lanterns';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { hash1 } from '../../../film/core/frame';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch08-s11';
type C = CanvasRenderingContext2D;
const FLOOR = 640;
/** the screen (L3 world) and the projector at the rear (L3 world) */
const SCREEN = { x: 150, y: 150, w: 320, h: 208 };
/** the projector sits low at the rear, so its beam crosses the standing crowd's heads on its way to the screen */
const PROJ = { x: 2050, y: 430 };
const LECTERN_X = 540;
/** Li sits clear of the lectern's base (her chair and the podium never merge, §10 rule 2) */
const LI_X = 770;
/** the standing crowd along the aisle: two ranks (L4 sharp in front, L3 smaller and behind fog B), staggered so
 *  light shows between the heads */
const CROWD_XS = [992, 1050, 1110, 1172];
const BACK_XS = [928, 1002, 1076, 1150];
/** the rear wall's edge (L3 world: a pilaster) and LeCun (L4): the RIGHTMOST standing figure, against the wall's
 *  lit patch; off frame right in the wide, he enters on 'Yann' as the camera trucks along the aisle */
const WALL_X = 1150;
const LECUN_X = 1290;
/** the lit patch of rear wall behind LeCun (L3 world, where he lands when the camera settles) */
const PATCH = { x: 1262, y: 330 };
const h01 = (i: number, s: number) => (hash1(i, s) + 1) / 2;
/** arms folded: the upper arm a touch forward, the forearm a bar across the chest (fist at the far elbow) */
const FOLD: Pose = pose({ hipF: 4, kneeF: -2, hipB: -4, kneeB: 0, torso: -2, neck: 6, head: -6, shoulderF: -18, elbowF: 112, wristF: -50, shoulderB: -20, elbowB: 110, wristB: -50 }, { handF: 'fist', handB: 'fist' });
/** the crowd's pose variants (all looking up at the screen, frame-left) */
const POCKET: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -10, shoulderF: -14, elbowF: 34, wristF: 12, shoulderB: -10, elbowB: 30 }, { handF: 'fist', handB: 'fist' });
const WEIGHT: Pose = pose({ hipF: 12, kneeF: -15, hipB: -3, kneeB: 0, torso: -4, neck: 9, head: -9, shoulderF: 2, elbowF: 12, wristF: 8, shoulderB: -6, elbowB: 10, wristB: 6 });
const LOOKUP: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 6, head: -12, shoulderF: 2, elbowF: 18, wristF: 6, shoulderB: -4, elbowB: 14 });
const VARIANTS = [LOOKUP, FOLD, POCKET, WEIGHT];
const LIGHT = { x: -1, y: -0.25, floor: 0.15 };
const EDGE = { x: -1, y: -0.2, px: 1.6, alpha: 0.7 };

interface B {
  D: number;
  florence: number;
  hall: number;
  tall: number;
  flying: number;
  aisles: number;
  yann: number;
  lecunCard: number;
  /** the Hinton inset and card are gone by here (≈ the end of 'flying'), before the truck */
  flyEnd: number;
}
interface Scene extends ShotScene {
  b: B;
  ext: (t: number) => Camera3;
  int: (t: number) => Camera3;
  ECAMS: Camera3[];
  ICAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      florence: T.beat('florence'),
      hall: T.beat('hall'),
      tall: T.word('L0821', 'Hinton'),
      flying: T.wordEnd('L0821', 'flying'),
      aisles: T.beat('aisles'),
      yann: T.beat('lecun'),
      lecunCard: T.beat('lecun') + 0.1,
      flyEnd: Math.min(7.3, T.wordEnd('L0821', 'flying')),
    };
    const ext = camKeys([
      [0, 620, 352, -30],
      [b.hall, 650, 340, 70],
    ]);
    // the interior: WIDE on the left first (the screen, the presenter, Li), a slow drift while Hinton's inset plays;
    // then one eased truck right along the aisle (≈ 175 px over 6.8 → 9.5 s, ≈ 5 % of the frame per second) past
    // the standing crowd, so the rear wall's lit patch and LeCun ENTER frame on 'Yann'; then a settle
    const P0 = { x: 650, y: 380, z: 30 }, P1 = { x: 818, y: 388, z: 56 };
    const pan0 = 6.8, pan1 = Math.min(D - 0.8, 9.5);
    const int = (t: number): Camera3 => {
      const pre = clamp01((t - b.hall) / (pan0 - b.hall));
      const u = clamp01((t - pan0) / (pan1 - pan0));
      const e = u * u * (3 - 2 * u);
      const drift = clamp01((t - pan1) / Math.max(0.1, D - pan1));
      return { x: P0.x + 6 * pre + (P1.x - P0.x - 6) * e + 6 * drift, y: P0.y + (P1.y - P0.y) * e + 2 * drift, z: P0.z + 4 * pre + (P1.z - P0.z - 4) * e + 12 * drift, lens: 1 };
    };
    const ECAMS = [ext(0), ext(b.hall / 2), ext(b.hall)];
    const ICAMS: Camera3[] = [];
    for (let i = 0; i <= 10; i++) ICAMS.push(int(b.hall + ((D - b.hall) * i) / 10));
    tl.hold(0, D);
    return { tl, b, ext, int, ECAMS, ICAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.hall) exterior(f, sc, t);
    else interior(f, sc, t);
    // ---- screen-locked type
    const env = { t, mood: f.mood, seed: 1012 };
    // the place stamp holds ≈ 3.5 s, then hands the lower-left stamp row to the event label (the top-left corner
    // stays clear for the reel's glossary tags)
    placeStamp(f.c, { place: 'Florence', date: 'Friday 12 October 2012 · 17:05', year: 2012, y: 638, at: b.florence - 0.25, dur: b.hall + 0.55 - b.florence, fade: 0.35 }, env);
    if (t >= b.hall) {
      const la = win(t, b.hall + 0.95, b.hall + 1.35) * (1 - win(t, b.yann - 0.6, b.yann - 0.2));
      if (la > 0.003) {
        const c = f.c;
        c.save();
        softPlate(c, 250, 620, 520, 64, f.mood.ink, 0.55 * la);
        c.globalAlpha = la;
        c.font = `500 22px ${FONT.mono}`;
        c.fillStyle = textColor(f.mood);
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText('ImageNet challenge workshop, ECCV', 54, 628);
        c.restore();
      }
      hintonInset(f, t, b);
      nameCardLg(f.c, { name: 'Geoffrey Hinton', role: '', x: 784, y: 112, at: b.tall - 0.3, dur: Math.max(1.0, b.flyEnd - (b.tall - 0.3)), fade: 0.3 }, env);
      nameCardLg(f.c, { name: 'Yann LeCun', role: "the full room, by Fei-Fei Li's account", align: 'right', x: 1216, y: 132, at: b.lecunCard, dur: b.D - b.lecunCard + 1, fade: 0.4 }, env);
      lecunLeader(f, sc, t);
    }
  },
});

// ===================================================================================================== EXTERIOR
function exterior(f: Frame, sc: Scene, t: number) {
  f.camera(sc.ext(t));
  f.backlight({ sunX: 760, sunY: 470, sunRadius: 760, intensity: 1 });
  // L1: the far hills (Fiesole side), hazed
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, sc.ECAMS, 40);
    // the sky held inside the chroma budget (≤ 20): a neutral dusk rose overhead warming to a soft gold haze at the
    // horizon, with the low sun as the only saturated light
    const sky = c.createLinearGradient(0, r.y, 0, 600);
    sky.addColorStop(0, '#574549');
    sky.addColorStop(0.35, '#6e5752');
    sky.addColorStop(0.72, '#8e735a');
    sky.addColorStop(1, '#a88a62');
    c.fillStyle = sky;
    c.fillRect(r.x, r.y, r.w, 640 - r.y);
    glow(c, 760, 480, 460, '#d9b46e', 0.5);
    glow(c, 760, 490, 140, '#f0d38c', 0.35);
    c.fillStyle = env.fill('set');
    c.beginPath();
    c.moveTo(r.x, 640);
    for (let x = r.x; x <= r.x + r.w; x += 20) c.lineTo(x, 470 - 40 * Math.sin(x * 0.004 + 1) - 18 * Math.sin(x * 0.011));
    c.lineTo(r.x + r.w, 900);
    c.lineTo(r.x, 900);
    c.closePath();
    c.fill();
  });
  // L2: the city with its dome and towers
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, sc.ECAMS, 60);
    f.cached(`${ID}/ext/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 800, (cc) => {
      cc.translate(-r.x, -100);
      florenceSkyline(cc, env, { x0: r.x, x1: r.x + r.w, y: 590, role: 'set', seed: 3 });
      cc.fillStyle = env.fill('set');
      cc.fillRect(r.x, 589, r.w, 400);
    }, { blur: 1.5 })(c, r.x, 100);
  });
  f.fog({ yCenter: 0.8 * 720, height: 0.22 * 720, alpha: 0.34, drift: 7 });
  // L3: a mid-distance roofline (no landmarks) standing out of the haze
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, sc.ECAMS, 60);
    f.cached(`${ID}/ext/L3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 400, (cc) => {
      cc.translate(-r.x, -400);
      florenceSkyline(cc, env, { x0: r.x, x1: r.x + r.w, y: 632, role: 'set', landmarks: false, seed: 11 });
      cc.fillStyle = env.fill('set');
      cc.fillRect(r.x, 631, r.w, 300);
    }, { blur: 0.75 })(c, r.x, 400);
  });
  f.fog({ yCenter: 0.9 * 720, height: 0.16 * 720, alpha: 0.3, drift: 11 });
  // L4: the near roof we watch from: a tiled slope and a chimney at lower left, rimmed by the low sun
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, sc.ECAMS, 40);
    // the near rooftops along the bottom of the frame (the sharp plane)
    c.fillStyle = env.fill('ink');
    florenceSkyline(c, env, { x0: r.x, x1: r.x + r.w, y: 742, role: 'ink', landmarks: false, seed: 23 });
    c.fillRect(r.x, 741, r.w, 200);
  });
  f.rim({ x: 0.2, y: -1 });
  // L5: the tiled roof slope we watch from, lower left, a soft dark occluder (no chimney)
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, sc.ECAMS, 40);
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.moveTo(r.x, 650);
    c.quadraticCurveTo(160, 676, 300, 712);
    c.lineTo(560, 790);
    c.lineTo(r.x, 900);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.18);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(r.x, 650);
    c.quadraticCurveTo(160, 676, 300, 712);
    c.lineTo(560, 790);
    c.stroke();
  });
  // drifting swifts? no: the hush. Only the haze moves.
}

// ===================================================================================================== INTERIOR
function interior(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.int(t);
  f.camera(cam);
  hallDark(f, { key: ID, cams: sc.ICAMS, glow: 0.55, dark: 0.92, fog: 0.12, windows: true });
  const flick = 1 + 0.02 * Math.sin(t * 13.1) + 0.015 * Math.sin(t * 7.3);
  // on 'Yann' the screen's light picks him out: the spill on the wall behind him and his rim rise together
  const pick = win(t, b.yann - 0.3, b.yann + 0.5);
  f.layer('L3', (c, env) => {
    // the rear wall (L3, behind him): a panelled section of the end wall, a pilaster at its edge (≈ 130 px left of him
    // on screen), and the screen's spill falling on it so he stands against light
    rearWall(c, env, pick);
    // the screen: ONE bright rectangle (no content), its hot spot a soft radial, its frame and a soft spill
    projectionScreen(c, env, flick);
    // the projector beam from the rear of the room, over the heads; it fades out before it meets the screen
    projectorBeam(c, env, { from: PROJ, to: { x: SCREEN.x + SCREEN.w + 30, y: SCREEN.y + SCREEN.h / 2 }, w0: 8, w1: SCREEN.h * 0.42, a: flick, fadeEnd: true });
    // the rows of seated heads, receding into the dark of the room
    audienceHeads(c, env, { x0: 640, x1: 1060, y: 486, lean: 0, seed: 41, tq, pitch: 66 });
    audienceHeads(c, env, { x0: 640, x1: 1000, y: 540, lean: 0, seed: 53, tq, pitch: 58 });
    // the back rank of standers up the aisle (L3, smaller, behind fog B): spaced so light shows between the heads,
    // baselines stepping up the raked floor
    BACK_XS.forEach((x, i) => {
      const P = ATTENDEES[(i * 3 + 1) % ATTENDEES.length];
      const k = 0.78 * (1 + 0.06 * hash1(i, 73));
      const base = [LOOKUP, POCKET, WEIGHT][i % 3];
      P.draw(c, { x: x + hash1(i, 71) * 6, y: 588 - (i % 2) * 6, facing: 'left', pose: withLife({ ...base }, tq + i * 0.29, 500 + i, 0.9), scale: k, light: LIGHT, edgeRim: { ...EDGE, px: 1.0, alpha: 0.3 } }, env);
    });
  });
  f.practical({ x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2, kind: 'screen', seed: 1205, intensity: 0.75, radius: 220, layer: 'L3' });
  f.fog('B');
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const r = overscan(LAYERS.L4, sc.ICAMS, 40);
    // the floor
    c.fillStyle = mixLab(env.fill('fg'), m.set, 0.2);
    c.fillRect(r.x, FLOOR - 4, r.w, r.y + r.h - FLOOR + 4);
    // the presenter on a low dais at the lectern, from the side, at a distance (no words): the darkest shape at
    // 'hall', cut against the screen's light with a thin rim on the screen side
    c.fillStyle = env.fill('ink');
    c.fillRect(r.x, 606, LECTERN_X + 70 - r.x, FLOOR - 606);
    c.fillStyle = withAlpha(m.rim, 0.22);
    c.fillRect(r.x, 606, LECTERN_X + 70 - r.x, 1.2);
    const K = cast.krizhevsky;
    const kp = withLife({ ...pose({ ...POSES.present.angles, shoulderF: 30, elbowF: 48 }, { handF: 'open' }) }, tq, 2012, 0.8);
    K.draw(c, { x: LECTERN_X - 50, y: 606, facing: 'right', pose: kp, scale: 0.86, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.3, floor: 0 }, edgeRim: { x: -1, y: -0.3, px: 1.5, alpha: 0.85 } }, env);
    podium(c, { x: LECTERN_X, y: 606, s: 0.82, mic: true }, env);
    // the front row: chairs, Li seated in profile near the front (no name card, no words)
    const li = cast.li;
    const sitP = withLife({ ...POSES.sit }, tq, 77, 0.6);
    const seatY = -chair.anchors({ x: 0, y: 0 }).seat.y;
    const cs = seatHeight(SPECS.li, POSES.sit) / Math.max(1, seatY);
    for (const cx of [LI_X + 74, LI_X + 74 + 120]) chair(c, { x: cx, y: FLOOR, s: cs, style: 'modern', view: 'side', flip: true }, env);
    li.draw(c, { x: LI_X, y: FLOOR, facing: 'left', pose: sitP, ink: PUPPET_NEAR_BLACK, light: LIGHT, edgeRim: EDGE }, env);
    // the packed aisle: people standing along it, looking up at the screen; three pose variants (none with folded
    // arms: that is LeCun's), heights ±8 %, one turned to his neighbour; light between the heads
    audienceHeads(c, env, { x0: 660, x1: 900, y: 590, lean: 0, seed: 61, tq, pitch: 64 });
    CROWD_XS.forEach((x0, i) => {
      const P = ATTENDEES[(i * 5 + 2) % ATTENDEES.length];
      const x = x0 + hash1(i, 31) * 6;
      const sc2 = 0.96 * (1 + 0.07 * hash1(i, 37));
      const turned = i === 2;
      const base = turned ? pose({ ...POSES.listen.angles, head: 6, neck: 12 }) : [LOOKUP, POCKET, WEIGHT][i % 3];
      const p = withLife({ ...base }, tq + i * 0.37, 300 + i, 0.9);
      P.draw(c, { x, y: FLOOR + (h01(i, 39) > 0.5 ? 4 : 0), facing: turned ? 'right' : 'left', pose: p, scale: sc2, ink: PUPPET_NEAR_BLACK, light: LIGHT, edgeRim: { ...EDGE, px: 1.2, alpha: 0.4 } }, env);
    });
    // LeCun: the rightmost standing figure, against the rear wall's lit patch, in profile, arms folded; the screen's
    // light cuts a strong rim (2.5 px against the crowd's 1.2) as he enters on 'Yann'
    cast.lecun.draw(c, lecunOpts(tq, pick), env);
  });
  f.rim({ x: -1, y: -0.3 });
  // near plane: the backs of seated heads at the bottom edge, soft
  f.layer('L5', (c, env) => {
    const a = toLayer(LAYERS.L5, cam, -160, 712);
    const z = toLayer(LAYERS.L5, cam, 1460, 712);
    audienceHeads(c, env, { x0: a.x, x1: z.x, y: a.y, lean: 0, seed: 97, tq, pitch: 128 });
  });
  void clamp01;
  void sm;
}

function lecunOpts(tq: number, pick: number) {
  const lp = withLife({ ...FOLD }, tq, 1960, 0.8);
  return { x: LECUN_X, y: FLOOR, facing: 'left' as const, pose: lp, ink: PUPPET_NEAR_BLACK, light: LIGHT, edgeRim: { x: -1, y: -0.15, px: 2.5, alpha: 0.35 + 0.6 * pick } };
}

/** the LeCun card's leader: a fine rule from under the card down to just above his head, so the name lands on him */
function lecunLeader(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const a = win(t, b.lecunCard + 0.15, b.lecunCard + 0.55);
  if (a <= 0.003) return;
  const cam = sc.int(t);
  const hd = cast.lecun.anchor(lecunOpts(tq12(t), 1), 'head');
  const p = toScreen(LAYERS.L4, cam, hd.x, hd.y - 34);
  const c = f.c;
  const top = 196;
  if (p.y - top < 20) return;
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = withAlpha(mixLab(f.mood.rim, f.mood.halo, 0.4), 0.85);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(p.x, top);
  c.lineTo(p.x, top + (p.y - top) * Math.min(1, a * 1.2));
  c.stroke();
  c.fillStyle = withAlpha(mixLab(f.mood.rim, f.mood.halo, 0.4), 0.9);
  c.beginPath();
  c.arc(p.x, top, 2.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the projected screen: ONE bright keystoned rectangle (nothing on it), a soft radial hot spot, a faint frame */
function projectionScreen(c: C, env: PaintEnv, flick: number) {
  const m = env.mood;
  const { x, y, w, h } = SCREEN;
  glow(c, x + w / 2, y + h / 2, 440, m.halo, 0.2 * flick);
  // the screen's dark surround and its top roller bar
  c.fillStyle = withAlpha(env.fill('ink'), 0.55);
  c.fillRect(x - 12, y - 8, w + 24, h + 22);
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 16, y - 16, w + 32, 9);
  const ks = 7;
  const quad = new Path2D();
  quad.moveTo(x, y);
  quad.lineTo(x + w, y);
  quad.lineTo(x + w - ks, y + h);
  quad.lineTo(x + ks, y + h);
  quad.closePath();
  c.save();
  c.shadowColor = withAlpha(m.halo, 0.85);
  c.shadowBlur = 26 * env.pxScale;
  c.fillStyle = mixLab(m.core, m.halo, 0.32);
  c.fill(quad);
  c.restore();
  // the hot spot, clipped to the one rectangle
  c.save();
  c.clip(quad);
  c.translate(x + w / 2, y + h / 2);
  c.scale(w / h, 1);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, h * 0.62);
  g.addColorStop(0, withAlpha(mixLab(m.core, '#ffffff', 0.1), 0.85 * flick));
  g.addColorStop(1, withAlpha(m.core, 0));
  c.fillStyle = g;
  c.fillRect(-h, -h, 2 * h, 2 * h);
  c.restore();
}

/** the rear wall (L3): a panelled stretch of the end wall, its edge a proper PILASTER (base, shaft, capital), the wall
 *  feathered into the hall's dark (no value step), and the screen's light spilling across it in a lit patch behind
 *  LeCun's shoulders (ΔL* ≥ 25 against his near-black) */
function rearWall(c: C, env: PaintEnv, pick: number) {
  const m = env.mood;
  const X0 = WALL_X, X1 = WALL_X + 1000;
  const wall = mixLab(env.fill('set'), m.fg, 0.35);
  const fe = c.createLinearGradient(X0, 0, X0 + 160, 0);
  fe.addColorStop(0, withAlpha(wall, 0));
  fe.addColorStop(1, wall);
  c.fillStyle = fe;
  c.fillRect(X0, -200, X1 - X0, FLOOR + 400);
  // the lit patch behind his shoulders
  c.save();
  c.translate(PATCH.x, PATCH.y);
  c.scale(0.75, 1);
  const sp = c.createRadialGradient(0, 0, 10, 0, 0, 260);
  sp.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.7), 0.7 + 0.3 * pick));
  sp.addColorStop(0.5, withAlpha(mixLab(m.setHaze, m.halo, 0.4), 0.4 + 0.3 * pick));
  sp.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = sp;
  c.fillRect(-300, -300, 600, 600);
  c.restore();
  // panelling: a dado rail, raised panels below it and tall panels above (cut-lines in shadow and rim)
  const ink = env.fill('ink');
  c.fillStyle = withAlpha(ink, 0.45);
  c.fillRect(X0 + 40, 452, X1 - X0, 8);
  for (let px = X0 + 70; px < X1; px += 120) {
    c.strokeStyle = withAlpha(ink, 0.36);
    c.lineWidth = 2;
    c.strokeRect(px, 476, 92, 130);
    c.strokeRect(px, 150, 92, 280);
    c.strokeStyle = withAlpha(m.rim, 0.12);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(px + 1, 477);
    c.lineTo(px + 1, 605);
    c.moveTo(px + 1, 151);
    c.lineTo(px + 1, 429);
    c.stroke();
  }
  // the pilaster: a moulded base on the floor, a fluted shaft, a capital with an abacus under the cornice
  c.fillStyle = ink;
  c.fillRect(X0 - 18, 70, 36, FLOOR - 70);
  c.fillRect(X0 - 28, FLOOR - 30, 56, 30);
  c.fillRect(X0 - 24, FLOOR - 40, 48, 12);
  c.fillRect(X0 - 26, 92, 52, 14);
  c.fillRect(X0 - 32, 78, 64, 12);
  c.fillRect(X0 - 400, 60, 1600, 20);
  c.strokeStyle = withAlpha(m.rim, 0.1);
  c.lineWidth = 1;
  c.beginPath();
  for (const dx of [-8, 0, 8]) {
    c.moveTo(X0 + dx, 112);
    c.lineTo(X0 + dx, FLOOR - 46);
  }
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.26);
  c.fillRect(X0 - 18, 106, 1.4, FLOOR - 146);
  c.fillRect(X0 - 32, 78, 64, 1.2);
}

/** the lantern-slide inset from ch08-s02: Hinton standing alone at a lectern-height desk, far away */
function hintonInset(f: Frame, t: number, b: B) {
  // opens on 'kept' (full on 'Hinton'), closes in the breath after 'flying', before 'Yann': ~1.9 s on screen
  const a = win(t, b.tall - 0.55, b.tall - 0.05) * (1 - win(t, b.flyEnd - 0.4, b.flyEnd));
  if (a <= 0.003) return;
  const c = f.c;
  const m = f.mood;
  const IN = { x: 650, y: 132, r: 110 };
  const k = 0.6 + 0.4 * sm(a);
  c.save();
  c.translate(IN.x, IN.y);
  c.scale(k, k);
  c.globalAlpha = Math.min(1, a * 1.3);
  glow(c, 0, 0, IN.r * 1.8, m.halo, 0.1);
  c.save();
  c.beginPath();
  c.arc(0, 0, IN.r, 0, Math.PI * 2);
  c.clip();
  const bg = c.createRadialGradient(-10, 0, 10, 0, 0, IN.r);
  bg.addColorStop(0, mixLab(m.sky[2], m.halo, 0.2));
  bg.addColorStop(1, m.sky[0]);
  c.fillStyle = bg;
  c.fillRect(-IN.r, -IN.r, IN.r * 2, IN.r * 2);
  c.fillStyle = m.ink;
  c.fillRect(-IN.r, 58, IN.r * 2, IN.r);
  const env: PaintEnv = { mood: m, fill: (role) => (role === 'ink' ? m.ink : role === 'fg' ? m.fg : role === 'set' ? m.set : (m as unknown as Record<string, string>)[role]), layer: LAYERS.L4, t, tq: tq12(t), frame: f.frame, fps: f.fps, pxScale: f.pxScale, seed: f.seed };
  // a lectern-height desk and the tall man standing at it, far away
  c.fillRect(14, 4, 46, 6);
  c.fillRect(30, 10, 10, 48);
  c.fillRect(20, 54, 30, 4);
  cast.hinton.draw(c, { x: -8, y: 58, facing: 'right', pose: withLife({ ...POSES.lean, angles: { ...POSES.lean.angles, torso: 6 } }, tq12(t), 1947, 0.6), scale: 0.34, ink: m.ink }, env);
  c.restore();
  c.strokeStyle = mixLab(m.halo, m.rim, 0.5);
  c.lineWidth = 4;
  c.beginPath();
  c.arc(0, 0, IN.r + 2, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(m.fg, 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, IN.r + 6, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  void (null as unknown as C);
}
