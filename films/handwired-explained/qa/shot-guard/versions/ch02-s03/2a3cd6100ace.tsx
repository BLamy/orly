/**
 * ch02-s03 — RAND, 15 December 1951: Kleene turns the net into a finite machine; then the narrator draws his own
 * conclusion from it (winterBlue, paper wipe in, 21.92 s).
 *
 * PERIOD ROOM (staging.tagLine ch02): the old bronze line crosses a cold office at 50 %; tag 1 hangs over Kleene's
 * desk. L2 a tall office wall with venetian-blind windows (the cold key light) and hanging tubes; L3 a run of filing
 * cabinets; L4 a generic 1950s academic (Kleene: no likeness) typing at a pedestal desk, the RAND memo stacking up page
 * by page on the twos (to ninety-eight pages); at left, on a filing cabinet, the brass finite dial (sets/ch02-s03-dial)
 * and, apart from it on its own stand, a crank; L5 a hat stand at frame right.
 *
 *   0.3  office    the room resolves; the date stamp types itself top-left
 *   3.0  kleene    he reaches up from the typewriter and threads a second knot card, "Kleene, 1951", beside
 *                  McCulloch & Pitts on tag 1 (no flip, no pencil: he extended the model); his name card
 *   5.94 dial      the camera has trucked left to the dial: it lights; the pointer ticks three times, stop to stop
 *   9.92 events    a punched strip feeds through the slot: each column read moves the pointer (a hole three stops on,
 *                  none one on; dialRun computes it); the stops it lands on glow in a pattern (the term card is the
 *                  reel's, top-left)
 *   13.98 reading  "Our reading": the office dims a stop; push in; the narrator's hands enter at lower left and rest a
 *                  finger on the ring; a glint counts the studs round: eight stops, no more
 *   18.05 outside  pull back: the crank stands apart from the dial's frame; the narrator's left hand gives it one slow
 *                  turn, and the pointer ticks one stop
 *   19.48 hang     (the camera trucks right to the tags) the narrator's right hand hangs question card qK (the dial's outline, no words) on a plain loop
 *                  just right of tag 1: no knot card, no drop
 */
import { Timeline } from '../../../core';
import {
  PUPPET_NEAR_BLACK,
  POSES,
  blendPose,
  chair,
  defineShot,
  godRays,
  labWall,
  loopPose,
  mixLab,
  nameCard,
  placeStamp,
  pose,
  toScreen,
  typewriter,
  windowBeam,
  withAlpha,
  withLife,
  writingDesk,
  LAYERS,
} from '../../../film';
import type { Camera3, LayerSpec, PaintEnv, Pose, PuppetDrawOpts } from '../../../film';
import { cast, hands } from '../cast';
import { TAG, drawLine, drawTag, lineYAt, type TagState } from '../sets/tagLine';
import { PERIOD_DY, camAt, clamp01, knotCards, lerp, onPeriodLine, releaseSwing, seg, sm, twos, type CamKey } from '../sets/ch02-s01-period';
import { STOPS, crank, crankHandle, dialRun, finiteDial, stopAngle } from '../sets/ch02-s03-dial';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s03';
const HANDS_L: LayerSpec = { id: 'L4hands', z: 1000, haze: 0, blur: 0 };

// ------------------------------------------------------------------ staging (rest-screen px, L4)
const FLOOR = 612;
const DESK = { x: 744, w: 112 };
const DESK_TOP = FLOOR - 77 * (320 / 175);
const TW = { x: 724, y: DESK_TOP };
const MEMO = { x: 806, y: DESK_TOP };
const DIAL = { x: 300, y: 474, r: 84 };
const CRANK = { x: -30, y: 520 };
const ROOM_LINE = { x0: -500, x1: 1800, sag: 16 } as const;
const TAG_S = 1.1;
const TAG_X = 744;
const QK_X = TAG_X + 74;
const knotC = (x: number) => ({ x, y: lineYAt(x, ROOM_LINE) });
const eyeC = (x: number, s: number) => ({ x, y: lineYAt(x, ROOM_LINE) + TAG.string * s });

/** Kleene's seat: solved so his typing hands land on the keys */
const KEYS = typewriter.anchors({ x: TW.x, y: TW.y }).keys;
const KL = (() => {
  const a = cast.kleene.anchor({ x: 0, y: FLOOR, facing: 'right', pose: POSES.type }, 'handF');
  return { x: KEYS.x - a.x - 4, y: FLOOR };
})();
/** his reach up to tag 1's eyelet (searched at module scope) */
const REACH = (() => {
  const target = { x: TAG_X - 6, y: eyeC(TAG_X, TAG_S).y + PERIOD_DY + 6 };
  let best = { p: POSES.type, d: Infinity };
  for (let sh = 60; sh <= 175; sh += 5) {
    for (let el = 0; el <= 90; el += 10) {
      const p = pose({ ...POSES.type.angles, torso: 6, neck: -4, head: -10, shoulderF: sh, elbowF: el, wristF: -10 }, { handF: 'pinch', handB: 'typing' });
      const h = cast.kleene.anchor({ x: KL.x, y: KL.y, facing: 'right', pose: p }, 'handF');
      const d = Math.hypot(h.x - target.x, h.y - target.y);
      if (d < best.d) best = { p, d };
    }
  }
  return best.p;
})();

/** the strip's columns (a hole = 1) and the states the dial visits reading them from stop 3 */
const BITS = [1, 0, 1, 1, 0, 0, 1, 0];
const RUN = dialRun(BITS, 3);

const CAMS = (b: { dial: number; events: number; reading: number; outside: number; D: number }): CamKey[] => [
  { t: 0, cam: { x: 610, y: 372, z: 24, lens: 1 } },
  { t: b.dial - 1.9, cam: { x: 600, y: 376, z: 48, lens: 1 } },
  { t: b.dial + 1.4, cam: { x: 432, y: 410, z: 176, lens: 1 } },
  { t: b.reading - 0.6, cam: { x: 416, y: 414, z: 196, lens: 1 } },
  { t: b.reading + 1.6, cam: { x: 300, y: 470, z: 470, lens: 1 } },
  { t: b.outside - 0.6, cam: { x: 304, y: 470, z: 480, lens: 1 } },
  { t: b.outside + 1.5, cam: { x: 430, y: 414, z: 70, lens: 1 } },
  { t: b.D + 0.3, cam: { x: 660, y: 396, z: 200, lens: 1 } },
];

/** one escapement step: a snap with a little overshoot, over 0.16 s */
const snap = (u: number) => {
  const x = clamp01(u);
  return x >= 1 ? 1 : 1 - Math.pow(1 - x, 3) + Math.sin(x * Math.PI) * 0.12;
};

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      office: T.beat('office'),
      kleene: T.beat('kleene'),
      dial: T.beat('dial'),
      events: T.beat('events'),
      reading: T.beat('reading'),
      outside: T.beat('outside'),
      hang: T.beat('hang'),
    };
    // every tick of the pointer: [time, from, to] (cumulative stops, so wrapping keeps turning clockwise)
    const ticks: [number, number, number][] = [];
    let cur = 0;
    for (let i = 1; i <= 3; i++) {
      ticks.push([b.dial + 0.35 + (i - 1) * 0.5, cur, cur + 1]);
      cur += 1;
    }
    const readAt = (k: number) => b.events + 0.25 + k * 0.42;
    BITS.forEach((bit, k) => {
      ticks.push([readAt(k), cur, cur + (bit ? 3 : 1)]);
      cur += bit ? 3 : 1;
    });
    const crankU0 = b.outside - 0.3;
    const crankDur = 1.5;
    ticks.push([crankU0 + crankDur, cur, cur + 1]);
    return { tl, b, ticks, readAt, crankU0, crankDur, cams: CAMS(b) };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(sc.cams, t);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 300, intensity: 0.7 });

    // ---- the machine's state (pure in t)
    let pointer = 0;
    for (const [at, from, to] of sc.ticks) {
      if (tq < at) break;
      pointer = lerp(from, to, snap((tq - at) / 0.16));
    }
    const lit = seg(t, b.dial - 0.2, b.dial + 0.3);
    const glow = new Array(STOPS).fill(0);
    BITS.forEach((_, k) => {
      const at = sc.readAt(k) + 0.08;
      if (tq >= at) glow[RUN[k + 1]] = Math.max(glow[RUN[k + 1]], 0.85 - 0.5 * seg(t, b.reading, b.reading + 1.2));
    });
    // the current stop is always a little lit
    glow[Math.round(pointer) % STOPS] = Math.max(glow[Math.round(pointer) % STOPS], 0.55 * lit);
    const feedIn = seg(t, b.events - 0.9, b.events + 0.15);
    let feed = -3.2 + 3 * feedIn;
    BITS.forEach((_, k) => {
      feed += sm((tq - sc.readAt(k) + 0.14) / 0.14);
    });
    feed -= 1;
    const stripA = seg(t, b.events - 0.9, b.events - 0.6) * (1 - seg(t, b.reading + 2, b.reading + 3));
    const crankU = clamp01((tq - sc.crankU0) / sc.crankDur);
    const crankA = -Math.PI * 0.75 + sm(crankU) * Math.PI * 2;

    // ---------------------------------------------------------------- L2: the office wall, blinds, tubes
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 2000, 960, (cc) => {
        cc.translate(360, 120);
        labWall(cc, { x: -360, y: -120, w: 2000, h: 960, windows: [80, 700, 1320], winW: 300, winTop: 70, winH: 420, blinds: 0.55, tileTop: 560, tubes: [380, 1020], tubeY: 40 }, env);
      })(c, -360, -120);
      godRays(c, { beams: [windowBeam({ x: 550, y: 70, w: 300, h: 420 }, { x: -0.42, y: 1 }, 640, 1.4)], intensity: 0.3, mullions: 9, streaks: 3, salt: 51 }, env);
    });
    f.fog('A');
    // ---------------------------------------------------------------- L3: filing cabinets along the wall
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3/${env.mood.id}`, 2000, 700, (cc) => {
        cc.translate(360, -200);
        cabinets(cc, env);
      })(c, -360, 200);
    });
    f.fog('B');

    // ---------------------------------------------------------------- L4: the room's action plane
    f.layer('L4', (c, env) => {
      // the floor at the action plane's foot (dark linoleum)
      c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.25);
      c.fillRect(-600, FLOOR - 2, 2600, 500);
      // the filing cabinet the dial stands on, the crank on its own stand, the dial
      c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3);
      c.fillRect(DIAL.x - 108, DIAL.y + DIAL.r * 1.32, 216, 400);
      c.strokeStyle = withAlpha(env.mood.rim, 0.18);
      c.lineWidth = 1.4;
      for (let i = 0; i < 2; i++) c.strokeRect(DIAL.x - 96, DIAL.y + DIAL.r * 1.32 + 14 + i * 90, 192, 78);
      crank(c, env, { x: CRANK.x, y: CRANK.y, angle: crankA, glow: 0.3 * Math.sin(Math.PI * crankU) });
      finiteDial(c, env, { ...DIAL, lit, pointer, glow, strip: { feed, bits: BITS, alpha: stripA } });
      // the desk, typewriter, memo
      chair(c, { x: KL.x + 8, y: FLOOR, s: 1, style: 'wooden', view: 'side' }, env);
      writingDesk(c, { x: DESK.x, y: FLOOR, w: DESK.w }, env);
      const typing = t < b.kleene - 0.7 || t > b.kleene + 1.6;
      typewriter(c, { x: TW.x, y: TW.y, carriage: (t * 0.06) % 1, typing: typing ? (Math.floor(tq * 12) % 2) : 0, paper: 0.8 }, env);
      memo(c, env, Math.min(98, Math.floor(4 + tq * 6.4)));
      // Kleene: typing → reaching up to thread his card on tag 1 → typing
      const reach = seg(t, b.kleene - 0.75, b.kleene - 0.1) * (1 - seg(t, b.kleene + 0.8, b.kleene + 1.5));
      const typeP = loopPose('type', POSES.type, tq);
      const kp: Pose = withLife(blendPose(typeP, REACH, reach), tq, 51, 0.8);
      const ko: PuppetDrawOpts = { x: KL.x, y: KL.y, facing: 'right', pose: kp, ink: PUPPET_NEAR_BLACK, light: { x: 0.2, y: -1, floor: 0.2 }, edgeRim: { x: 0.3, y: -1, px: 2.5, alpha: 0.85, warm: 0.6 } };
      // the line and tag 1, then Kleene in front of it
      onPeriodLine(c, () => {
        drawLine(c, env, { metal: 'bronze', posts: 'none', ...ROOM_LINE, glow: 0.25 });
        const st: TagState = { id: '1', x: TAG_X, scale: TAG_S, knot: [], swing: 0.025 + 0.05 * Math.exp(-Math.max(0, t - b.kleene) * 1.2) * (t > b.kleene ? 1 : 0), phase: Math.PI / 2 - b.kleene * 1.7 };
        drawTag(c, env, st, { tq, knotAt: knotC(TAG_X) });
        knotCards(c, env, eyeC(TAG_X, TAG_S), ['McCulloch & Pitts, 1943', 'Kleene, 1951'], 1, TAG_S, { kin: seg(t, b.kleene - 0.05, b.kleene + 0.45) });
        // question card qK: carried in the narrator's hand, then hanging on its plain loop (no knot card, no drop)
        const tieU = clamp01((tq - (b.hang - 0.5)) / 1.85);
        if (tieU >= 0.55) {
          drawTag(c, env, { id: 'qK', x: QK_X, swing: releaseSwing(tq, b.hang + 0.52, 0.16), phase: Math.PI / 2 - (b.hang + 0.52) * 1.7 }, { tq, knotAt: knotC(QK_X) });
        }
      });
      cast.kleene.draw(c, ko, env);
    });
    f.rim({ x: 0, y: -1 });
    const dialS = toScreen(LAYERS.L4, cam, DIAL.x, DIAL.y);
    f.practical({ x: DIAL.x, y: DIAL.y, kind: 'lamp', seed: 1951, intensity: 0.45 * lit, radius: 70 });

    // ---------------------------------------------------------------- "Our reading": the office dims a stop
    const dim = seg(t, b.reading - 0.3, b.reading + 0.6) * (1 - 0.6 * seg(t, b.outside + 0.4, b.outside + 1.8));
    if (dim > 0.01) {
      const c = f.c;
      c.save();
      const g = c.createRadialGradient(dialS.x, dialS.y, DIAL.r * 1.2 * dialS.k, dialS.x, dialS.y, 900);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(0.35, withAlpha(f.mood.fg, 0.45 * dim));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.55 * dim));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // ---------------------------------------------------------------- the narrator's hands (a different layer)
    f.layer(HANDS_L, (c, env) => {
      const E = hands.entry(cam, 'L4');
      const len = 118 * 1.05;
      // R: rests a finger on the ring (stop 5, lower left), then withdraws
      const stud = { x: DIAL.x + Math.cos(stopAngle(5)) * DIAL.r * 0.78, y: DIAL.y + Math.sin(stopAngle(5)) * DIAL.r * 0.78 };
      const rIn = seg(tq, b.reading + 0.1, b.reading + 1.0) * (1 - seg(tq, b.outside - 1.2, b.outside - 0.4));
      if (rIn > 0.001) {
        const at = lerp2(lerp2(E.R, stud, 0.25), stud, rIn);
        hands.draw(c, { right: hands.reach(E.R, at, 'press', len, { sleeve: 'linen', bend: -0.1 }), scale: 1.05 }, env);
      }
      // L: one slow turn of the crank (the tick comes from outside)
      const lIn = seg(tq, sc.crankU0 - 0.7, sc.crankU0) * (1 - seg(tq, sc.crankU0 + sc.crankDur + 0.15, sc.crankU0 + sc.crankDur + 0.9));
      if (lIn > 0.001) {
        const hp = crankHandle({ x: CRANK.x, y: CRANK.y, angle: crankA });
        const at = lerp2(lerp2(E.L, hp, 0.3), hp, lIn);
        hands.draw(c, { left: hands.reach(E.L, at, 'grip', len, { sleeve: 'linen', bend: 0.15 }), scale: 1.05 }, env);
      }
      // R again: hangs qK on the line, just right of tag 1
      const tieU = clamp01((tq - (b.hang - 0.5)) / 1.85);
      if (tieU > 0 && tieU < 1) {
        const k = { x: QK_X, y: knotC(QK_X).y + PERIOD_DY };
        const p = hands.act('tie', tieU, k, { held: 'card', scale: 0.8, entry: { R: E.R } });
        hands.draw(c, p, env, {
          heldDraw: (cc, at, _h, e2) => onPeriodLine(cc, () => drawTag(cc, e2, { id: 'qK', x: at.x, swing: 0.06 }, { tq, knotAt: { x: at.x, y: at.y - PERIOD_DY }, at: { x: at.x, y: at.y - PERIOD_DY + TAG.string } })),
        });
      }
    });

    // ---------------------------------------------------------------- L5: a hat stand at frame right
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 400, 1100, (cc) => {
        cc.translate(-1120, 160);
        hatStand(cc, env);
      })(c, 1120, -160);
    });

    // ---------------------------------------------------------------- type
    const tenv = { t, mood: f.mood, seed: 1951 };
    placeStamp(f.c, { place: 'RAND', date: '15 December 1951 · memorandum RM-704', year: 1951, x: 48, y: 64, at: b.office, dur: b.dial - 0.6 - b.office, fade: 0.5, cps: 20 }, tenv);
    nameCard(f.c, { name: 'Stephen C. Kleene', role: 'RAND, 1951', at: b.kleene, dur: 3.2, fade: 0.45 }, tenv);
  },
});

const lerp2 = (a: { x: number; y: number }, b2: { x: number; y: number }, u: number) => ({ x: lerp(a.x, b2.x, u), y: lerp(a.y, b2.y, u) });

// ------------------------------------------------------------------ painters
/** the RAND memorandum stacking up on the desk's right end, one page at a time (edge-on) */
function memo(c: C2, env: PaintEnv, n: number) {
  const w = 44, ph = 0.26;
  const paper = mixLab(mixLab('#e4d9c2', env.mood.haze, 0.3), env.mood.rim, 0.15);
  c.save();
  c.fillStyle = paper;
  c.fillRect(MEMO.x - w / 2, MEMO.y - n * ph - 1, w, n * ph + 1);
  c.fillStyle = withAlpha(env.mood.ink, 0.35);
  for (let i = 10; i < n; i += 10) c.fillRect(MEMO.x - w / 2, MEMO.y - i * ph, w, 0.5);
  // the top sheet, slightly askew (the newest page)
  c.translate(MEMO.x, MEMO.y - n * ph - 1);
  c.rotate(((n * 37) % 7 - 3) * 0.008);
  c.fillStyle = mixLab(paper, '#ffffff', 0.2);
  c.fillRect(-w / 2 - 1, -1.2, w + 2, 1.4);
  c.restore();
}

/** L3: a run of 1950s filing cabinets and a wall clock-less shelf (set ink, hazed) */
function cabinets(c: C2, env: PaintEnv) {
  const ink = env.fill('set');
  c.fillStyle = ink;
  for (const x0 of [-300, -160, 900, 1040, 1180, 1320]) {
    c.fillRect(x0, 420, 128, 300);
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 1.2;
  for (const x0 of [-300, -160, 900, 1040, 1180, 1320]) {
    for (let i = 0; i < 3; i++) {
      c.strokeRect(x0 + 10, 432 + i * 52, 108, 44);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(x0 + 52, 448 + i * 52, 24, 4);
    }
  }
  // box files on top of the right-hand run
  c.fillStyle = ink;
  for (let i = 0; i < 9; i++) c.fillRect(912 + i * 26 + (i > 4 ? 40 : 0), 382 + (i % 3) * 3, 20, 38 - (i % 3) * 3);
}

/** L5: a bentwood hat stand with a fedora and an overcoat, at the right edge */
function hatStand(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.fillRect(1236, 120, 12, 800);
  // the coat hanging off the hooks
  c.beginPath();
  c.moveTo(1222, 180);
  c.bezierCurveTo(1180, 230, 1170, 420, 1186, 640);
  c.lineTo(1290, 640);
  c.bezierCurveTo(1300, 420, 1290, 230, 1262, 180);
  c.closePath();
  c.fill();
  // the fedora on the top hook
  c.beginPath();
  c.ellipse(1242, 118, 46, 9, -0.05, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(1214, 116);
  c.quadraticCurveTo(1218, 84, 1242, 82);
  c.quadraticCurveTo(1268, 84, 1270, 116);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.25);
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(1216, 112);
  c.quadraticCurveTo(1224, 86, 1244, 84);
  c.stroke();
}
