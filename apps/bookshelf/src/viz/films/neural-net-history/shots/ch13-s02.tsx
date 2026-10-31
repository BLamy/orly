/**
 * ch13-s02 — on the 2012 candle's stage Hinton walks from the centre of the light to its rim, where a faint ghost of
 * his 1976 self once sat (duskRose; 9.0 s; in: plain cut from ch13-s01, the same stage, wider).
 *
 *   0          wide on the Edge of the Light: the 2012 candle (eleven rings of sleeve), its pool on the boards, the
 *              Wall flat behind; the tall man still holds his darkened slip
 *   'fair'     as the line begins, a small parchment card rises at his shoulder: “Google has acted very responsibly.”
 *              — Hinton, May 2023 (tweet, as widely reproduced); it stays up through the walk
 *   'walk'     wordless: he lowers the slip to his side and walks out of the centre of the pool, in profile, on twos;
 *              his shadow shortens, then swings long across the boards as he crosses the bright ring
 *   'rim'      he stops at the rim, half in shadow, facing out like every dissenter before him
 *   'ghost'    very faint over the floor: a seated young man at a desk at the same rim (1976); a slow dolly-in to a
 *              two-shot of his profile and the flame behind him. Rim (1976) → centre (2012) → rim (2023).
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit; the burned wax
 * stays above the stub as a ghost sleeve whose length is the years.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose, ShotScene } from '../../../film';
import { PUPPET_NEAR_BLACK, TWOS_HZ, blendPose, chair, defineShot, mixLab, pose, quantizeTwos, strideLength, walkCycle, walkPose, withAlpha, withLife, writingDesk } from '../../../film';
import { wallStateAt } from '../sets/studyState';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { frameOn } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import {
  HELD_K, HINTON13, HINTON_YOUNG13, LEARNED23, LOOK, SHIFT13, ST13, W6_PIN, W7F, WALL13_K,
  barePin, darkW7, heldSlip, longShadow, parchmentCard, screen, stage13, tq12, win, sm, lerp,
} from '../sets/ch13-s01-kit';

const ID = 'ch13-s02';
type C = CanvasRenderingContext2D;
const W6S = WALL_SLOTS.W6;
const WALL = wallStateAt(ID, 'start');

/** the slip lowered to his side, carried */
const CARRY: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 10, head: 4, shoulderF: 10, elbowF: 22, wristF: -10, shoulderB: -8, elbowB: 12, wristB: 4 }, { handF: 'pinch' });
/** at the rim, facing out: the slip at his side, head level, looking into the dark */
const RIM: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -4, shoulderF: 6, elbowF: 18, wristF: -8, shoulderB: -8, elbowB: 12, wristB: 4 }, { handF: 'pinch' });
/** the 1976 ghost: seated at the desk, bent over a paper */
const SIT: Pose = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 10, neck: 10, head: 8, shoulderF: 46, elbowF: 70, wristF: 4, shoulderB: 40, elbowB: 74 });

const STRIDE = strideLength(HINTON13.spec);
/** the walk: two slow, short, planted steps out of the centre of the pool (about 146 px), not a stride-off.
 *  (round 1: he stops 40 px short of where he used to, so his profile and the ghost's read apart) */
const DIST = 146;
const STEPS = 2;
/** step amplitude: leg angles and travel scaled together, so the planted foot still does not slide */
const AMP = DIST / (STEPS * STRIDE);
const CAD = 0.88;
const STEP_T = 32 / 24 / CAD / 2;
const X1 = ST13.hx + DIST;
/** the pool's defined edge falls just inside where he stops: he ends half in shadow */
const POOL_RX = X1 - ST13.candleX - 4;
/** the 1976 ghost: further right and a step upstage (smaller, higher on the boards), clear of his slip and legs */
const GHOST = { seat: X1 + 92, desk: X1 + 172, s: 0.92, up: 14 };

type WalkS = { x: number; pose: Pose; walking: boolean };
function shortWalk(walk0: number): (t: number) => WalkS {
  const cyc = walkCycle(HINTON13.spec, { x0: ST13.hx, facing: 'right', start: walk0, cadence: CAD, scale: AMP });
  const arrive = walk0 + STEPS * STEP_T;
  const scaleLegs = (p: Pose): Pose => {
    const a = { ...p.angles };
    for (const j of ['hipF', 'kneeF', 'ankleF', 'hipB', 'kneeB', 'ankleB'] as const) a[j] = (a[j] ?? 0) * AMP;
    // the free (far) arm swings fully, a little wider than the legs, so the walk never reads as both arms locked
    const sw = a.shoulderB ?? 0;
    a.shoulderB = sw * 1.35;
    a.elbowB = 16 + Math.max(0, sw) * 0.9;
    return { ...p, angles: a };
  };
  const contact = scaleLegs(walkPose(0));
  return (t: number) => {
    const tq = quantizeTwos(t);
    if (tq < walk0) return { x: ST13.hx, pose: contact, walking: false };
    if (tq < arrive) {
      const w = cyc(t);
      return { x: w.x, pose: scaleLegs(w.pose), walking: true };
    }
    const u = sm((tq - arrive) / 0.42);
    return { x: X1, pose: blendPose(contact, RIM, u), walking: false };
  };
}
void TWOS_HZ;

interface B {
  D: number;
  fair: number;
  lower: number;
  walk0: number;
  rim: number;
  ghost: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  walk: (t: number) => WalkS;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const rim = T.beat('rim');
    const walk0 = rim - STEPS * STEP_T;
    const b: B = { D, fair: T.beat('fair'), lower: walk0 - 0.5, walk0, rim, ghost: T.beat('ghost') };
    const walk = shortWalk(walk0);
    // wide and still while he walks; from the 'rim' beat a gentle 5% dolly-in to a two-shot that settles with the
    // flame on the left third and his profile on the right third, so the two-shot reads before the cut
    const k2 = 1.05;
    const cx2 = (ST13.candleX + X1) / 2;
    const keys: [number, number, number, number][] = [
      [0, 652, 374, 1.0],
      [rim, 652, 374, 1.0],
      [D - 0.15, cx2, 370, k2],
      [D, cx2, 370, k2],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS = [cam(0), cam(D * 0.5), cam(D)];
    tl.hold(0, D);
    return { tl, b, cam, walk, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    f.camera(sc.cam(t));
    f.setMood('duskRose');
    // where he is and how he stands
    let x: number = ST13.hx;
    let p: Pose;
    if (tq < b.walk0) {
      p = blendPose(LOOK, CARRY, sm((tq - b.lower) / 0.5));
      p = withLife({ ...p }, tq, 2023, 0.9);
    } else {
      const w = sc.walk(t);
      x = w.x;
      // the near arm carries the slip steadily at his side through the walk (the far arm swings)
      const a = { ...w.pose.angles, shoulderF: (w.pose.angles.shoulderF ?? 0) * 0.4 + 8, elbowF: 22, wristF: -10 };
      p = { ...w.pose, angles: a, handF: 'pinch' };
      if (!w.walking) p = withLife({ ...p }, tq, 2023, 0.9);
    }
    const o = { x, y: ST13.floorY, facing: 'right' as const, pose: p };
    const hand = HINTON13.anchor(o, 'handF');
    // very faint (about 38% of the round-0 ghost): memory, not a second lit figure
    const ghostA = 0.095 * win(t, b.ghost - 0.1, b.ghost + 1.0);
    stage13(f, {
      key: ID,
      cams: sc.CAMS,
      candle: LEARNED23,
      candleX: ST13.candleX,
      s: ST13.s,
      letters: 0.85,
      poolRx: POOL_RX,
      poolEdge: 30,
      depth: { fogA: 0.24, wallRim: 1, curtain: 'right', curtainW: 70, lipY: 694, ref: sc.cam(b.D) },
      wall: {
        slips: WALL,
        hide: ['W6', 'W7'],
        shift: SHIFT13,
        dim: 0.18,
        extra: (c, env) => {
          darkW7(c, env, W7F.x, W7F.y, WALL13_K, 0.5);
          barePin(c, env, W6_PIN.x, W6_PIN.y, WALL13_K, 0);
        },
      },
      draw: (c, env, g) => {
        // the candle's last light grazing the boards past the rim, so the shadow has something to cut
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(x + 80, ST13.floorY + 8);
        c.scale(1, 0.06);
        const gz = c.createRadialGradient(0, 0, 0, 0, 0, 420);
        gz.addColorStop(0, withAlpha(env.mood.halo, 0.16));
        gz.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = gz;
        c.fillRect(-420, -420, 840, 840);
        c.restore();
        longShadow(c, env, x, ST13.candleX, (cc) => HINTON13.draw(cc, { ...o, x: 0, y: 0, ink: PUPPET_NEAR_BLACK }, env), 1.2, 1.1);
        // the darkened slip at his side
        const rot = 0.08 + 0.05 * Math.sin(tq * 3.1) * (tq >= b.walk0 && tq < b.rim ? 1 : 0);
        const k = WALL13_K * HELD_K;
        const hang = (W6S.h / 2 - 9) * k;
        heldSlip(c, env, { x: hand.x - Math.sin(rot) * hang + 2, y: hand.y + Math.cos(rot) * hang, k, rot, light: 0.33 * (0.4 + 0.6 * g.inPool(x)) + 0.12, dark: 1, curl: 1 });
        // lit only from the flame side; past the bright ring his far half goes fully dark
        HINTON13.draw(c, { ...o, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.15, floor: 0 }, edgeRim: { x: -1, y: -0.35, px: 1.6, alpha: 0.75 } }, env);
        // the 1976 ghost on the same rim line, just downstage of where he stops: a positional rhyme
        if (ghostA > 0.003) ghost(c, env, ghostA, t);
      },
    });
    // the half-shadow at the rim: the dark beyond the pool closes over his far side (screen-space falloff)
    screen(f, (c) => {
      // over plain wall (clear of the slips); it stays up through the walk and clears as the camera moves in
      // round 1: raised and nudged right, so clear dark wall separates its lower edge from his head; a deeper drop
      // shadow lifts it off the slips behind
      parchmentCard(c, { x: 912, y: 172, width: 470, text: '“Google has acted very responsibly.”', attrib: '— Hinton, May 2023 (tweet, as widely reproduced)', size: 28, at: b.fair - 0.1, until: b.ghost + 0.1, shadow: 0.75 }, { t, mood: f.mood });
    });
  },
});

/** the 1976 self: a seated young man at a plain desk at the rim, drawn as pale smoke-paper, very faint */
function ghost(c: C, env: PaintEnv, a: number, t: number) {
  // tinted toward the set colour (not toward white), so it reads as the stage remembering, not a lit figure
  const pale = mixLab(mixLab(env.mood.setHaze, env.mood.halo, 0.2), env.mood.set, 0.35);
  const genv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? pale : env.fill(r)) };
  c.save();
  c.globalAlpha *= a;
  c.filter = `blur(${(2.6 * env.pxScale).toFixed(2)}px)`;
  // a step upstage of the rim: higher on the boards and smaller
  const fy = ST13.floorY - GHOST.up;
  c.translate(GHOST.seat, fy);
  c.scale(GHOST.s, GHOST.s);
  c.translate(-GHOST.seat, -fy);
  chair(c, { x: GHOST.seat - 4, y: fy, s: 1.05, style: 'wooden', view: 'side', flip: true }, genv);
  const p = withLife({ ...SIT }, tq12(t), 1976, 0.6);
  HINTON_YOUNG13.draw(c, { x: GHOST.seat + 70, y: fy - 2, facing: 'right', pose: p, ink: pale, cutLines: false }, genv);
  writingDesk(c, { x: GHOST.desk + 60, y: fy, s: 1.02, variant: 'pedestal', w: 112 }, genv);
  c.restore();
  void lerp;
}
