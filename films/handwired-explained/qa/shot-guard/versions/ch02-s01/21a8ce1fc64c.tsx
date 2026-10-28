/**
 * ch02-s01 — December 1943, a lamplit study: McCulloch and Pitts tie on the oldest tag (candleAmber, crossfade in
 * from the title card's copper line, 18.21 s).
 *
 * PERIOD ROOM (staging.tagLine ch02): the line passes through the study at 50 % of frame height, an older dull bronze
 * wire (no posts: it runs from wall to wall). L2 a gothic window bay at night; L3 a pedestal desk with a green-shaded
 * banker's lamp (the practical, the key light), a reprint on the desk and a page of arrow-and-loop net diagrams on a
 * reading slope, the red pencil lying at the desk's right end; L4 the two men in profile and the line; L5 a heavy curtain at
 * frame right.
 *
 *   0.2 dissolve   the crossfade carries the title card's copper line into this bronze one (same height band)
 *   1.2 study      the room resolves under the lamp; the date stamp types itself top-left
 *   3.0 names      name cards: McCulloch (left, facing right, beard, three-piece) · Pitts (right, facing left, slight,
 *                  round spectacles, papers)
 *   4.65 tied      McCulloch has carried tag 1 up to the line and ties it; Pitts steadies it with an open palm; the
 *                  front inks "The neuron is a logic gate" (the label), the knot card "McCulloch & Pitts, 1943" threads in
 *   7.87 grommet   the camera has eased in to the tag's lower corner: its brass signature grommet catches the lamp,
 *                  visibly EMPTY ("Handwired never cites them"); the tag's front is legible here (the subject)
 *   12.77 abstract the page of net diagrams lifts off the desk into the lamplight and becomes a parchment slip; the
 *                  camera eases back so it floats above the two men; the diagrams give way to two words
 *   16.05 logic    "propositional logic" takes a warm kick; hold to the end (inkBleed out to the lantern plate)
 */
import { Timeline } from '../../../core';
import {
  PUPPET_NEAR_BLACK,
  POSES,
  bankersLamp,
  blendPose,
  books,
  defineShot,
  dustMotes,
  mixLab,
  nameCard,
  placeStamp,
  pose,
  toScreen,
  windowWall,
  withAlpha,
  withLife,
  writingDesk,
  LAYERS,
} from '../../../film';
import type { Camera3, PaintEnv, Pose, PuppetDrawOpts } from '../../../film';
import { cast } from '../cast';
import { drawPencil } from '../sets/narratorHands';
import { TAG, drawLine, drawTag, lineYAt, type TagState } from '../sets/tagLine';
import { periodNear } from '../sets/ch02-s01-near';
import { PERIOD_DY, PERIOD_Y, camAt, clamp01, knotCards, lerp, netDiagrams, onPeriodLine, quoteSlip, releaseSwing, seg, slipInk, slipPaper, sm, twos, type CamKey } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s01';

// ------------------------------------------------------------------ staging (rest-screen px)
const MC = { x: 512, y: 604 };
const PI = { x: 790, y: 604 };
const TAG_S = 1.45;
/** the desk at L3 and what stands on it */
const DESK = { x: 640, y: 566, w: 150 };
const DESK_TOP = DESK.y - 77 * (320 / 175);
const LAMP = { x: 568, y: DESK_TOP };
const PAGE = { x: 712, y: DESK_TOP - 33, w: 40, h: 52, rot: 0.2 };

/** McCulloch's tie reach: solved at module scope so his pinching hand lands on the line */
function tiePose(sh: number): Pose {
  return pose({ hipF: 7, kneeF: -4, hipB: -5, kneeB: -1, torso: 5, neck: 5, head: -2, shoulderF: sh, elbowF: 22, wristF: -14, shoulderB: -10, elbowB: 14 }, { handF: 'pinch' });
}
const TIE = (() => {
  let best = { sh: 80, pose: tiePose(80), at: { x: 0, y: 0 }, err: Infinity };
  for (let sh = 56; sh <= 104; sh += 2) {
    const p = tiePose(sh);
    const at = cast.mcculloch.anchor({ x: MC.x, y: MC.y, facing: 'right', pose: p }, 'handF');
    const err = Math.abs(at.y - (PERIOD_Y + 2));
    if (err < best.err) best = { sh, pose: p, at, err };
  }
  return best;
})();
/** the room's line (canonical coords: onPeriodLine lifts it to PERIOD_Y) and the knot where his hand meets it */
const ROOM_LINE = { x0: -420, x1: 1720, sag: 18 } as const;
const KNOT_X = TIE.at.x;
/** the knot on the line, canonical coords (drawTag's knotAt) and world */
const KNOT_C = { x: KNOT_X, y: lineYAt(KNOT_X, ROOM_LINE) };
const KNOT = { x: KNOT_X, y: KNOT_C.y + PERIOD_DY };
/** carrying the tag up (hand at the waist, the tag dangling) */
const CARRY: Pose = pose({ hipF: 6, kneeF: -4, hipB: -4, kneeB: -1, torso: 2, neck: 7, head: -5, shoulderF: 30, elbowF: 50, wristF: -10, shoulderB: -9, elbowB: 12 }, { handF: 'pinch' });
/** Pitts holds his page of net diagrams at his chest in his far hand (review r1: the page is PARENTED to his grip until
 *  it lifts on 'Neural', never floating beside him) */
const PAGE_ARM = { shoulderB: 26, elbowB: 82, wristB: -16 };
const HOLD: Pose = pose({ hipF: 6, kneeF: -3, hipB: -4, kneeB: -1, torso: 3, neck: 6, head: -5, shoulderF: 4, elbowF: 14, wristF: 6, ...PAGE_ARM }, { handF: 'open', handB: 'grip' });
/** Pitts steadies the tag with an open palm (the page still in his other hand) */
const STEADY: Pose = pose({ hipF: 8, kneeF: -4, hipB: -4, kneeB: -1, torso: 3, neck: 6, head: -6, shoulderF: 44, elbowF: 44, wristF: -22, ...PAGE_ARM }, { handF: 'open', handB: 'grip' });

/** the empty grommet (world, at rest): the tag's lower corner, w·0.34 right of the eyelet and 9·s above the bottom */
const GROM = { x: KNOT.x + TAG.w * TAG_S * 0.34, y: KNOT.y + TAG.string * TAG_S + TAG.h * TAG_S - 9 * TAG_S };
/** the action-plane zoom k (L4 at z 1000) a dolly z gives at a lens, and back */
const zFor = (k: number, lens: number) => 1000 - (1000 * lens) / k;
const K_TWO = 1.04 * 1000 / (1000 - 330);
const CAMS: CamKey[] = [
  { t: 0, cam: { x: 606, y: 372, z: -24, lens: 1.0 } },
  { t: 4.4, cam: { x: 626, y: 376, z: 36, lens: 1.02 } },
  { t: 7.4, cam: { x: KNOT.x + 22, y: 452, z: 330, lens: 1.04 } },
  // review r1: on 'cites' push in harder (1.35x) centred on the empty grommet, hold through 'them', ease back by 9.5
  { t: 8.35, cam: { x: GROM.x, y: GROM.y - 16, z: zFor(K_TWO * 1.35, 1.04), lens: 1.04 } },
  { t: 8.8, cam: { x: GROM.x, y: GROM.y - 18, z: zFor(K_TWO * 1.36, 1.04), lens: 1.04 } },
  { t: 9.5, cam: { x: KNOT.x + 22, y: 452, z: 348, lens: 1.04 } },
  { t: 12.3, cam: { x: KNOT.x + 24, y: 448, z: 372, lens: 1.045 } },
  { t: 15.2, cam: { x: 640, y: 384, z: 70, lens: 1.05 } },
  { t: 18.3, cam: { x: 640, y: 380, z: 104, lens: 1.06 } },
];

/** the slip's resting place (screen-locked): above both men, in the window light */
const SLIP = { x: 640, y: 132, w: 600, h: 176 };

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return {
      tl,
      D: T.duration,
      study: T.beat('study'),
      names: T.beat('names'),
      tied: T.beat('tied'),
      oldestTag: T.word('L0201', 'tag'),
      grommet: T.beat('grommet'),
      abstract: T.beat('abstract'),
      logic: T.beat('logic'),
      gateWord: T.word('L0202', 'logic'),
      warren: T.word('L0201', 'Warren'),
      pittsW: T.word('L0201', 'Pitts'),
    };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(CAMS, t);
    f.camera(cam);
    // review r1: the window backlight lifted ~15 % so the tracery cuts darker against it
    f.backlight({ sunX: 700, sunY: 430, intensity: 0.72 });

    // ---------------------------------------------------------------- L2: the gothic window bay at night
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1900, 980, (cc) => {
        cc.translate(310, 130);
        windowWall(cc, {
          x: -310, y: -130, w: 1900, h: 980, centers: [-150, 250, 640, 1030, 1430], winW: 210, apex: 46, sill: 470,
          shape: 'pointed', lights: 2, panes: { cols: 2, rows: 7 }, transoms: [0.36], tracery: 'quatrefoil', spandrel: 'trefoil',
          crest: true, pilasters: true, cornice: 54, wainscot: 170, glass: 0.7, shade: 0.35, seed: 1943,
        }, env);
        // a deep window seat ledge under the bay
        cc.fillStyle = env.fill('set');
        cc.fillRect(-310, 470, 1900, 16);
      })(c, -310, -130);
    });
    f.fog('A');

    // ---------------------------------------------------------------- L3: floor, desk, lamp, reprint, the page
    const lift = seg(t, sc.abstract - 0.15, sc.abstract + 1.45);
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3/${env.mood.id}`, 2000, 760, (cc) => {
        cc.translate(360, -180);
        // the study floor: dark boards, a rug's fringe under the desk
        const fl = cc.createLinearGradient(0, 548, 0, 940);
        fl.addColorStop(0, mixLab(env.fill('set'), env.mood.halo, 0.12));
        fl.addColorStop(0.25, env.fill('set'));
        fl.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.7));
        cc.fillStyle = fl;
        cc.fillRect(-360, 548, 2000, 400);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
        cc.lineWidth = 1;
        for (let i = -30; i <= 30; i++) {
          cc.beginPath();
          cc.moveTo(640 + i * 26, 548);
          cc.lineTo(640 + i * 90, 940);
          cc.stroke();
        }
        cc.fillStyle = withAlpha(env.mood.halo, 0.08);
        cc.fillRect(420, 570, 440, 10);
        writingDesk(cc, { x: DESK.x, y: DESK.y, w: DESK.w }, env);
        books(cc, { x: DESK.x - 18, y: DESK_TOP, s: 0.9, mode: 'stack', count: 3, seed: 43 }, env);
        // the reading slope the page leans on
        cc.fillStyle = env.fill('ink');
        cc.beginPath();
        cc.moveTo(PAGE.x - 30, DESK_TOP);
        cc.lineTo(PAGE.x + 26, DESK_TOP);
        cc.lineTo(PAGE.x + 18, DESK_TOP - 6);
        cc.lineTo(PAGE.x - 22, DESK_TOP - 4);
        cc.closePath();
        cc.fill();
        // the red pencil lies at the desk's right end (staging: it rests on the room's own furniture, frame right)
        drawPencil(cc, { x: DESK.x + 118, y: DESK_TOP - 2 }, Math.PI - 0.04, 38, env);
      })(c, -360, 180);
      bankersLamp(c, { x: LAMP.x, y: LAMP.y, s: 1.05, seed: 7 }, env);
    });
    f.fog('B');
    // the lamp: the key light, behind the action plane so the men and the tag cut against it
    const bulb = bankersLamp.anchors({ x: LAMP.x, y: LAMP.y, s: 1.05 }).bulb;
    f.practical({ x: bulb.x, y: bulb.y + 6, kind: 'lamp', seed: 19, intensity: 0.95, radius: 82, layer: 'L3' });

    // ---------------------------------------------------------------- L4: the men, the line, tag 1
    const carryIn = seg(t, sc.names + 0.5, sc.tied - 0.35);
    const tieDone = t >= sc.tied;
    const back = seg(t, sc.tied + 0.75, sc.tied + 1.7);
    const pitts = seg(t, sc.tied - 0.5, sc.tied + 0.1) * (1 - seg(t, sc.grommet - 0.4, sc.grommet + 0.6));
    const subject = toScreen(LAYERS.L4, cam, 0, 0).k >= 1.5;
    // both men look up as the page lifts into the lamplight (and stay watching it)
    const look = seg(t, sc.abstract + 0.1, sc.abstract + 1.3);
    const up = { neck: -7 * look, head: -9 * look };
    // Pitts: holding his page → steadying the tag with his free hand → holding → (after the page lifts) his clasp idle
    const piPose = withLife(blendPose(blendPose(HOLD, STEADY, pitts), POSES.stand, seg(t, sc.abstract + 0.9, sc.abstract + 2.0)), tq, 23, 1);
    addTo(piPose, up);
    const piO: PuppetDrawOpts = { x: PI.x, y: PI.y, facing: 'left', pose: piPose, ink: PUPPET_NEAR_BLACK, light: { x: -0.6, y: -0.8, floor: 0.15 }, edgeRim: { x: -1, y: -0.55, px: 2.5, alpha: 0.85, warm: 0.65 } };
    const grip = cast.pitts.anchor(piO, 'handB');
    f.layer('L4', (c, env) => {
      const light = { x: 0.6, y: -0.8, floor: 0.15 };
      // McCulloch: thinking (his idle) → carrying the tag up → the tie → back to his idle
      const mcPose = withLife(blendPose(blendPose(POSES.stand, CARRY, carryIn * (1 - back)), TIE.pose, seg(t, sc.tied - 0.55, sc.tied - 0.05) * (1 - back)), tq, 11, 1);
      addTo(mcPose, up);
      const mcO: PuppetDrawOpts = { x: MC.x, y: MC.y, facing: 'right', pose: mcPose, ink: PUPPET_NEAR_BLACK, light, edgeRim: { x: 1, y: -0.55, px: 2.5, alpha: 0.85, warm: 0.65 } };
      // the line first (behind the tag and the men's arms)
      onPeriodLine(c, () => drawLine(c, env, { metal: 'bronze', posts: 'none', ...ROOM_LINE, glow: 0.35 }));
      cast.pitts.draw(c, piO, env);
      // his page of net diagrams, held at his chest in his grip until it lifts on 'Neural'
      if (lift < 0.02) drawPage(c, env, grip, 1);
      // the tag: carried in McCulloch's hand, then hanging from the knot
      const hand = cast.mcculloch.anchor(mcO, 'handF');
      const st: TagState = {
        id: '1',
        x: KNOT.x,
        scale: TAG_S,
        alpha: seg(t, sc.names + 0.55, sc.names + 1.0),
        ink: seg(t, sc.tied + 0.05, sc.oldestTag + 0.25),
        knotIn: seg(t, sc.tied + 0.9, sc.tied + 1.5),
        swing: tieDone ? releaseSwing(tq, sc.tied, 0.14) : 0.05,
        phase: Math.PI / 2 - sc.tied * 1.7,
        glow: 0.25 + 0.3 * seg(t, sc.grommet - 0.3, sc.grommet + 0.3) * (1 - seg(t, sc.abstract, sc.abstract + 1.5)) + 0.3 * seg(t, sc.gateWord - 0.4, sc.gateWord + 0.1) * (1 - seg(t, sc.gateWord + 0.4, sc.gateWord + 1.4)),
        subject,
      };
      if (st.alpha! > 0) {
        if (!tieDone) {
          // dangling from his pinch: the string's top is his hand
          const knotAt = { x: hand.x, y: hand.y - PERIOD_DY };
          onPeriodLine(c, () => drawTag(c, env, { ...st, knot: [] }, { knotAt, at: { x: hand.x, y: hand.y - PERIOD_DY + TAG.string * TAG_S }, tq }));
        } else {
          onPeriodLine(c, () => {
            drawTag(c, env, { ...st, knot: [] }, { tq, knotAt: KNOT_C });
            knotCards(c, env, { x: KNOT_C.x, y: KNOT_C.y + TAG.string * TAG_S }, ['McCulloch & Pitts, 1943'], st.knotIn ?? 1, TAG_S);
          });
          // the empty brass grommet catches the lamp on 'cites'
          const gk = seg(t, sc.grommet - 0.35, sc.grommet + 0.15) * (1 - seg(t, sc.grommet + 2.6, sc.grommet + 3.6));
          if (gk > 0.01) grommetGlint(c, env, st, tq, gk);
        }
      }
      cast.mcculloch.draw(c, mcO, env);
      // lamp-lit motes drifting in the pool between them
      dustMotes(c, { area: { x: 420, y: 250, w: 460, h: 300 }, count: 46, drift: { x: 2.4, y: -1.2 }, size: 1.0, brightness: 0.55, salt: 43 }, env);
    });
    f.rim({ x: 0, y: -1 });

    // ---------------------------------------------------------------- L5: the curtain at frame right
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 900, 1100, (cc) => {
        cc.translate(380, 200);
        curtain(cc, env);
      })(c, -380, -200);
    });
    // review r1: a carved near plane at the lower-left corner (a chair back seen from behind, ~18 % of the frame wide)
    periodNear(f, { kind: 'chair', side: 'left', scale: 1.15, dx: -26, rim: 1.1 });
    // review r1: the floor's last 10 % darkens so the men stand on something
    {
      const c = f.c;
      const g = c.createLinearGradient(0, 640, 0, 720);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.6));
      c.save();
      c.fillStyle = g;
      c.fillRect(0, 640, 1280, 80);
      c.restore();
    }

    // ---------------------------------------------------------------- type (screen-locked)
    const tenv = { t, mood: f.mood, seed: 1943 };
    placeStamp(f.c, { place: 'December 1943', date: 'Bulletin of Mathematical Biophysics 5:115–133', year: 1943, x: 48, y: 64, at: sc.study, dur: sc.tied + 1.8 - sc.study, fade: 0.5, cps: 20 }, tenv);
    // review r1: each card sets just before its man is named (Warren 2.69, Pitts 3.96), 30 px higher (clear of the bottom 12 %)
    const cardsOut = sc.grommet - 1.0;
    nameCard(f.c, { name: 'Warren S. McCulloch', role: 'University of Illinois', y: 580, at: sc.warren - 0.15, dur: cardsOut - (sc.warren - 0.15), fade: 0.45 }, tenv);
    nameCard(f.c, { name: 'Walter Pitts', role: 'University of Chicago', align: 'right', y: 580, at: sc.pittsW - 0.2, dur: cardsOut - (sc.pittsW - 0.2), fade: 0.45 }, tenv);

    // the page lifts off the desk into the lamplight and becomes the slip
    if (lift >= 0.02) {
      const p0 = toScreen(LAYERS.L4, cam, grip.x - PAGE.w * 0.28, grip.y - PAGE.h * 0.32);
      const k = sm((lift - 0.0) / 1.0);
      // an arc: up out of the desk, a little toward camera, settling above the two men
      const x = lerp(p0.x, SLIP.x, k) + Math.sin(Math.PI * k) * -40;
      const y = lerp(p0.y, SLIP.y, k) - Math.sin(Math.PI * k) * 40;
      const w = lerp(PAGE.w * p0.k, SLIP.w, k);
      const h = lerp(PAGE.h * p0.k, SLIP.h, k);
      // (the page leaves his hand at its held tilt)
      const inkAt = sc.abstract + 0.85;
      quoteSlip(f.c, {
        id: `${ID}-slip`,
        x, y, w, h,
        rot: lerp(PAGE.rot, 0, sm(k * 1.3)),
        diagrams: 1 - seg(t, inkAt - 0.3, inkAt + 0.12),
        ink: seg(t, inkAt, inkAt + 0.12),
        attrib: seg(t, inkAt + 0.5, inkAt + 1.0),
        kick: seg(t, sc.logic - 0.1, sc.logic + 0.25) * (1 - 0.55 * seg(t, sc.logic + 0.6, sc.logic + 1.8)),
        words: '“propositional logic”',
        attribution: '— McCulloch & Pitts, 1943',
        subject: k > 0.97,
      }, f);
    }
  },
});

// ------------------------------------------------------------------ painters
/** add joint offsets in place (pose and its .prev), for look-ups layered over withLife */
function addTo(p: Pose & { prev?: Pose }, d: Partial<Record<'neck' | 'head', number>>) {
  for (const q of [p, p.prev]) {
    if (!q) continue;
    for (const k of Object.keys(d) as ('neck' | 'head')[]) q.angles[k] = (q.angles[k] ?? 0) + (d[k] ?? 0);
  }
}

/** the page of net diagrams in Pitts's grip (L4), lamp-lit: the hand pinches its lower-left edge */
function drawPage(c: C2, env: PaintEnv, at: { x: number; y: number }, a: number) {
  c.save();
  c.translate(at.x - PAGE.w * 0.28, at.y - PAGE.h * 0.32);
  c.rotate(PAGE.rot);
  c.globalAlpha *= a;
  c.fillStyle = mixLab(slipPaper(env), env.mood.haze, env.layer.haze * 0.6);
  c.fillRect(-PAGE.w / 2, -PAGE.h / 2, PAGE.w, PAGE.h);
  netDiagrams(c, PAGE.w * 0.86, PAGE.h * 0.78, mixLab(slipInk(env), env.mood.haze, 0.2), 0.8);
  c.restore();
}

/** the brass grommet catching the lamp: a ring of light around an empty hole */
function grommetGlint(c: C2, env: PaintEnv, st: TagState, tq: number, k: number) {
  const s = st.scale ?? 1;
  const w = TAG.w * s, h = TAG.h * s;
  const eye = { x: st.x!, y: KNOT.y + TAG.string * s };
  const sw = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  const lx = w * 0.34, ly = h - 9 * s;
  const gx = eye.x + Math.cos(sw) * lx - Math.sin(sw) * ly;
  const gy = eye.y + Math.sin(sw) * lx + Math.cos(sw) * ly;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, 16 * s);
  g.addColorStop(0, withAlpha(env.mood.core, 0.0));
  g.addColorStop(0.18, withAlpha(env.mood.core, 0.55 * k));
  g.addColorStop(0.32, withAlpha(env.mood.halo, 0.25 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(gx - 16 * s, gy - 16 * s, 32 * s, 32 * s);
  c.restore();
  // the ring itself, bright, with its centre still dark (empty: nobody signed it)
  c.save();
  c.strokeStyle = withAlpha(mixLab('#d8b46a', env.mood.core, 0.4), 0.9 * k);
  c.lineWidth = 1.5 * s;
  c.beginPath();
  c.arc(gx, gy, 3.4 * s, Math.PI * 1.05, Math.PI * 1.85);
  c.stroke();
  c.restore();
}

/** L5: a heavy curtain at frame right with a tie-back and a scalloped edge */
function curtain(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.moveTo(1500, -200);
  c.lineTo(1214, -200);
  for (let y = -200; y <= 400; y += 50) c.quadraticCurveTo(1200 + (y % 100 === 0 ? -10 : 8), y + 25, 1212, y + 50);
  // gathered at the tie-back, flaring below
  c.quadraticCurveTo(1250, 430, 1236, 470);
  c.bezierCurveTo(1200, 560, 1170, 700, 1160, 900);
  c.lineTo(1500, 900);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 2;
  for (const dx of [26, 58, 96]) {
    c.beginPath();
    c.moveTo(1216 + dx, -200);
    c.quadraticCurveTo(1210 + dx, 300, 1240 + dx * 0.4, 460);
    c.stroke();
  }
  // the tie-back cord
  c.strokeStyle = withAlpha(env.mood.halo, 0.35);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(1236, 440);
  c.quadraticCurveTo(1270, 470, 1320, 444);
  c.stroke();
}
