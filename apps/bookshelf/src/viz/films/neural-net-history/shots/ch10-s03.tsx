/**
 * ch10-s03 — lunch at Google, 2016: the ghost scribe is lifted away from the table as Uszkoreit suggests keeping
 * only the attention, a small new lamp's pool spreads, and a colleague at its rim shrugs (duskRose; 12.8 s; cut).
 *
 *   'lunch'      the cafe table at sunny dusk; Jakob Uszkoreit (tall, T-shirt) sketches in the air with a fork,
 *                Illia Polosukhin (quarter-zip) across from him; GOOGLE · 2016 and their name cards
 *   'only'       a ghost of the hall's scribe (ch10-s01), lamp and all, hangs above the table; a paper hand comes
 *                down, pinches him and lifts him out of frame: keep the attention, drop the slow reader
 *   after        THE EDGE OF THE LIGHT: a small new lamp stands on the table, its pool spreads; the room dims a
 *                little around it
 *   kelceyCard   in the breath after L1006 a colleague walks into the rim of that light and stops there, its outer
 *                falloff just catching his front edge; Mat Kelcey's quote card rises above him and stays up
 *   'doubted'    a shrug held for a beat (forearms out, palms open, head sunk). In the hold only the haze and the
 *                lamp move.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, LAYERS, defineShot, mixLab, nameCard, overscan, placeStamp, quoteCard, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { POSES, PUPPET_NEAR_BLACK, addPose, createPuppet, blendPose, pose, seatHeight, talkBeats, walkTo, withLife } from '../../../film/silhouette/puppet';
import type { TalkBeats } from '../../../film/silhouette/puppet';
import { cast } from '../cast';
import { CAFE, cafeBack, cafeChair, cafeGlassWall, cafeOutside, cafeTable, paperHand, pendant } from '../sets/ch10-s03-cafe';
import { handLamp, scribe, wickFlame } from '../sets/ch10-s01-hall';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s03';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

const PS = 1.1;
/** an unblurred sheet at the mid plane for the room's dimming (no per-frame blur pass) */
const DIM = { id: 'dim', z: 1300, haze: 0, blur: 0 };
const FLOOR = CAFE.floor;
const TABLE = { x0: 392, x1: 892, top: FLOOR - 146, floor: FLOOR };
const LAMP = { x: 646, y: TABLE.top };
const U = cast.uszkoreit;
const P = cast.polosukhin;
/** Kelcey (only in this shot): the cast spec in a fleece, so his back is one smooth line (a hoodie's hood read as a
 *  backpack at the rim of the light) */
const K = createPuppet({ ...cast.kelcey.spec, wardrobe: 'fleece' });
const UX = 322;
const PX = 966;
const KX = 1112;
const SIT = POSES.sit;
const U_SEAT = FLOOR - seatHeight(U.spec, SIT) * PS;
const P_SEAT = FLOOR - seatHeight(P.spec, SIT) * PS;
const GHOST = { x: 640, y: 404, s: 0.5 };
const THREAD = 70;
/** the ghost's lamp-hand pose (arm raised) and where that hand is when the lift begins (pure: computed once) */
const GHOST_POSE: Pose = { ...POSES.stand, angles: { ...POSES.stand.angles, shoulderF: 128, elbowF: 22, head: -10 }, handF: 'grip' };
const RELEASE_HAND = scribe.anchor({ x: GHOST.x, y: GHOST.y, facing: 'right', pose: GHOST_POSE, scale: GHOST.s }, 'handF');

/** Uszkoreit: a fork raised over the table, sketching; an open hand on 'only' */
const U_FORK: Pose = { ...addPose(SIT, { torso: 6, neck: 2, head: -6, shoulderF: 74, elbowF: 22, wristF: -30, shoulderB: 4, elbowB: 62 }), handF: 'pinch' };
const U_OPEN: Pose = { ...addPose(SIT, { torso: 8, neck: 0, head: -6, shoulderF: 58, elbowF: 14, wristF: -30, shoulderB: 4, elbowB: 62 }), handF: 'open' };
const U_REST: Pose = { ...addPose(SIT, { torso: 4, neck: 4, head: 0, shoulderF: 4, elbowF: 22, wristF: 4, shoulderB: 2, elbowB: 18 }), handF: 'relaxed' };
/** Polosukhin: leaning in on his forearms, listening */
const P_LEAN: Pose = { ...addPose(SIT, { torso: 10, neck: 6, head: -2, shoulderF: 2, elbowF: 18, wristF: 6, shoulderB: -2, elbowB: 16 }), handF: 'relaxed' };
/** Kelcey: hands in his pocket, facing out; the shrug */
/** standing at the rim with his arms down (a smooth back: no clasped hands bunching behind him) */
const K_STAND: Pose = { ...POSES.stand, handF: 'relaxed', handB: 'relaxed' };
/** the shrug: both forearms out and up, palms open, the head sunk between the shoulders */
const K_SHRUG: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -6, neck: 26, head: -20, shoulderF: 40, elbowF: 100, wristF: -62, shoulderB: 34, elbowB: 98, wristB: -60 }, { handF: 'open', handB: 'open' });

const CAM0: Camera3 = { ...CAMERA3_HOME, x: 616, z: 0 };
const CAM1: Camera3 = { ...CAMERA3_HOME, x: 676, y: 352, z: 70 };
const ext = (l: (typeof LAYERS)[keyof typeof LAYERS], pad = 40) => overscan(l, [CAM0, CAM1], pad);

interface Plan {
  lunch: number;
  jakob: number;
  only: number;
  lampAt: number;
  kIn: number;
  kTurn: number;
  card: number;
  doubted: number;
  D: number;
  beats: TalkBeats;
  walk: ReturnType<typeof walkTo>;
}

function bake(f: Frame, c: C, env: PaintEnv, key: string, r: { x: number; y: number; w: number; h: number }, paint: (cc: C) => void) {
  f.cached(`${ID}/${key}/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const card = T.beat('kelceyCard');
    // (he walks in earlier, so he has arrived and turned to face out before the shrug on 'doubted')
    const kIn = card - 1.85;
    const plan: Plan = {
      lunch: T.word('L1006', 'lunch'),
      jakob: T.word('L1006', 'Jakob'),
      only: T.word('L1006', 'only'),
      lampAt: T.word('L1006', 'attention') + 0.15,
      kIn,
      kTurn: card + 0.12,
      card,
      doubted: T.word('L1007', 'doubted'),
      D: T.duration,
      beats: talkBeats(T, { lines: ['L1006'], head: 2.2, hand: 1.2 }),
      walk: walkTo(K.spec, { x0: 1420, x1: KX, at: kIn, scale: PS, cadence: 1.15 }),
    };
    return { tl, plan };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const p = scene.plan as Plan;
    // a slow push over the whole shot (about 7% on the action plane), sine in-out
    const u = 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t / p.D));
    const cam: Camera3 = { x: lerp(CAM0.x, CAM1.x, u), y: lerp(CAM0.y, CAM1.y, u), z: lerp(CAM0.z, CAM1.z, u), lens: 1 };
    f.camera(cam);

    // the new light: the scribe's own lamp, left behind when he is lifted away, settles on the table and lights after
    // 'attention'; its pool spreads; the room dims a little around it
    const lampK = sm((tq - p.lampAt) / 0.25);
    const grab = p.only + 0.05;
    const release = grab + 0.15;
    const settle = sm((tq - release) / 0.42);
    const pool = sm((t - (p.lampAt + 0.1)) / 0.9);
    f.backlight({ sunX: 560, intensity: 1 - 0.22 * pool });

    f.layer('L1', (c, env) => {
      const r = ext(LAYERS.L1, 60);
      bake(f, c, env, 'outside', r, (cc) => cafeOutside(cc, env, r));
    });
    f.layer('L2', (c, env) => {
      const r = ext(LAYERS.L2, 60);
      bake(f, c, env, 'glass', { x: r.x, y: r.y, w: r.w, h: CAFE.slab + 30 - r.y }, (cc) => cafeGlassWall(cc, env, { x: r.x, y: r.y, w: r.w, h: CAFE.slab + 30 - r.y }));
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      const r = ext(LAYERS.L3, 60);
      bake(f, c, env, 'back', r, (cc) => {
        cafeBack(cc, env, r);
        for (const x of [180, 520, 860, 1200]) {
          pendant(cc, env, x, 132, 200, 1);
          // the pendants are dimly on (static: baked with the room)
          const op = cc.globalCompositeOperation;
          cc.globalCompositeOperation = 'lighter';
          const g = cc.createRadialGradient(x, 160, 0, x, 160, 120);
          g.addColorStop(0, withAlpha(env.mood.core, 0.32));
          g.addColorStop(0.25, withAlpha(env.mood.halo, 0.12));
          g.addColorStop(1, withAlpha(env.mood.halo, 0));
          cc.fillStyle = g;
          cc.fillRect(x - 120, 40, 240, 240);
          cc.globalCompositeOperation = op;
        }
      });
    });
    f.fog('B');

    // the room dims around the pool (behind the action plane, so the figures stay the darkest shapes)
    if (pool > 0) {
      f.layer(DIM, (c) => {
        const g = c.createRadialGradient(LAMP.x, LAMP.y - 40, 160, LAMP.x, LAMP.y - 40, 760);
        g.addColorStop(0, withAlpha(f.mood.fg, 0));
        g.addColorStop(1, withAlpha(f.mood.fg, 0.3 * pool));
        c.fillStyle = g;
        c.fillRect(-400, -300, 2100, 1300);
      });
    }

    const ink = PUPPET_NEAR_BLACK;
    const light = { x: -0.3, y: -1 };
    const fy = LAMP.y - 48 + 22 * 1.55;
    let uHand: { x: number; y: number } | null = null;
    let pHand: { x: number; y: number } | null = null;
    f.layer('L4', (c, env) => {
      const setInk = mixLab(env.fill('ink'), env.mood.set, 0.12);
      // the lamp's room glow and its floor pool go down FIRST, behind the figures (painted after them, the additive
      // light lifted the sitters to mid-grey): the figures stay the darkest shapes in frame
      if (lampK > 0) {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        const R = 120 + 420 * pool;
        const g = c.createRadialGradient(LAMP.x, fy, 10, LAMP.x, fy, R);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.26 * pool));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(LAMP.x - R, fy - R, R * 2, R * 2);
        c.save();
        c.translate(LAMP.x, FLOOR - 4);
        c.scale(1, 0.12);
        const g2 = c.createRadialGradient(0, 0, 0, 0, 0, 560 * pool + 1);
        g2.addColorStop(0, withAlpha(env.mood.halo, 0.32 * pool));
        g2.addColorStop(0.75, withAlpha(env.mood.halo, 0.12 * pool));
        g2.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g2;
        c.fillRect(-540, -540, 1080, 1080);
        c.restore();
        c.globalCompositeOperation = op;
      }
      // chairs, then the sitters, then the table in front of their knees
      cafeChair(c, setInk, UX - 6, FLOOR, U_SEAT, 'right');
      cafeChair(c, setInk, PX + 6, FLOOR, P_SEAT, 'left');

      // Uszkoreit: fork in the air while he talks (a small circling sketch on twos), open hand on 'only'
      let up: Pose = U_REST;
      const fk = sm((tq - (p.lunch + 0.4)) / 0.4) * (1 - sm((tq - (p.only - 0.3)) / 0.3));
      const sketch = fk > 0 ? { wristF: Math.sin(tq * 7.5) * 9, elbowF: Math.cos(tq * 7.5) * 6 } : {};
      up = blendPose(up, addPose(U_FORK, sketch), fk);
      up = blendPose(up, U_OPEN, sm((tq - (p.only - 0.3)) / 0.3) * (1 - sm((tq - (p.only + 1.6)) / 0.5)));
      // (light.floor 0: the cut-lines fade out entirely on the shadow side; one 1.5 px rim on the window side)
      const uo = { x: UX, y: FLOOR, facing: 'right' as const, pose: withLife({ ...up, angles: { ...up.angles, ...addPose(up, p.beats.at(tq)).angles } }, tq, 11), scale: PS, ink, light: { ...light, floor: 0 }, edgeRim: { x: -0.2, y: -1, px: 1.5 } };
      U.draw(c, uo, env);
      uHand = U.anchor(uo, 'handF');
      if (fk > 0.5) {
        // the fork, held up in the pinch
        const h = uHand;
        c.save();
        c.strokeStyle = ink;
        c.lineWidth = 2.2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(h.x, h.y);
        c.lineTo(h.x + 8, h.y - 34);
        c.stroke();
        c.lineWidth = 1.2;
        for (const dx of [-2.5, 0, 2.5]) {
          c.beginPath();
          c.moveTo(h.x + 8 + dx, h.y - 34);
          c.lineTo(h.x + 10 + dx, h.y - 44);
          c.stroke();
        }
        c.restore();
      }

      // Polosukhin: leaning in, a nod on 'attention'
      const nod = sm((tq - (p.only + 0.3)) / 0.25) * (1 - sm((tq - (p.only + 0.75)) / 0.3));
      const pp = withLife(addPose(P_LEAN, { head: 7 * nod, neck: 3 * nod }), tq, 23);
      const po = { x: PX, y: FLOOR, facing: 'left' as const, pose: pp, scale: PS, ink, light: { x: 0.3, y: -1, floor: 0 }, edgeRim: { x: 0.2, y: -1, px: 1.5 } };
      P.draw(c, po, env);
      pHand = P.anchor(po, 'handF');

      cafeTable(c, env, TABLE, setInk);
      // the lamp's warm pool spreading along the table top from the lamp (a lit band on the cloth's top edge)
      if (pool > 0) {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        const half = 40 + 300 * pool;
        const tg = c.createLinearGradient(LAMP.x - half, 0, LAMP.x + half, 0);
        tg.addColorStop(0, withAlpha(env.mood.core, 0));
        tg.addColorStop(0.5, withAlpha(env.mood.core, 0.55 * pool));
        tg.addColorStop(1, withAlpha(env.mood.core, 0));
        c.fillStyle = tg;
        c.fillRect(LAMP.x - half, TABLE.top - 1, half * 2, 2.6);
        const tg2 = c.createRadialGradient(LAMP.x, TABLE.top, 0, LAMP.x, TABLE.top, half);
        tg2.addColorStop(0, withAlpha(env.mood.halo, 0.2 * pool));
        tg2.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.save();
        c.translate(0, TABLE.top);
        c.scale(1, 0.18);
        c.fillStyle = tg2;
        c.fillRect(LAMP.x - half, -half, half * 2, half);
        c.restore();
        c.globalCompositeOperation = op;
      }

      // the ghost scribe over the table, lamp and all; a cut-paper hand comes down on 'only' and lifts him away; his
      // lamp stays behind: it slips from his hand and settles on the table, to become the new lamp
      const gIn = sm((t - (p.only - 1.1)) / 0.5);
      // the lift: 0.9 s, easing in (it gathers speed upward) and exiting clean through the top of frame
      const lu = clamp01((tq - release) / 0.9);
      const lift = lu * lu * (1.6 - 0.6 * lu);
      let ghostHand: { x: number; y: number } | null = null;
      if (gIn > 0 && lift < 1) {
        const gy = GHOST.y - lift * 520;
        const sway = Math.sin(tq * 2.2) * 0.04 * (1 - lift);
        c.save();
        c.globalAlpha = gIn * (1 - 0.35 * lift);
        // (his lamp arm drops once the lamp has gone)
        const armUp = 1 - sm((tq - release) / 0.25);
        const gp = { ...POSES.stand, angles: { ...POSES.stand.angles, shoulderF: 20 + 108 * armUp, elbowF: 22, head: -10, torso: sway * 40 } };
        const go = { x: GHOST.x, y: gy, facing: 'right' as const, pose: { ...gp, handF: 'grip' as const }, scale: GHOST.s, ink: withAlpha(env.mood.rim, 0.34) };
        scribe.draw(c, go, env);
        ghostHand = scribe.anchor(go, 'handF');
        // his thread up (a marionette string): the hand will take it at its top
        c.strokeStyle = withAlpha(env.mood.rim, 0.55);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(GHOST.x - 4, gy - 300 * GHOST.s);
        c.lineTo(GHOST.x - 4, gy - 300 * GHOST.s - THREAD);
        c.stroke();
        c.restore();
      }
      // the lamp: in the ghost's hand until the release, then it settles (on twos) onto the table at LAMP, growing
      // from the ghost's scale to the table lamp's and turning from ghost paper to solid; it lights after 'attention'
      if (gIn > 0) {
        const from = tq < release && ghostHand ? ghostHand : RELEASE_HAND;
        const sx = lerp(from.x, LAMP.x, settle);
        const sy = lerp(from.y, LAMP.y - 48, settle) - Math.sin(settle * Math.PI) * 18;
        const ss = lerp(GHOST.s * 1.1, 1.55, settle);
        const inkL = settle < 1 ? withAlpha(mixLab(env.mood.rim, PUPPET_NEAR_BLACK, settle), 0.4 + 0.6 * settle) : undefined;
        c.save();
        c.globalAlpha = gIn;
        handLamp(c, env, sx, sy, ss, Math.max(lampK, 0.45 * (1 - settle)), t, { halo: env.mood.halo, core: env.mood.core }, inkL);
        c.restore();
      }
      // the cut-paper hand: comes down from the top edge (on twos), pinches the string's top, lifts him out
      const down = sm((tq - (grab - 0.55)) / 0.5);
      if (down > 0 && lift < 1) {
        const top = GHOST.y - 300 * GHOST.s - THREAD;
        const hy = lerp(-150, top, down) - lift * 520;
        paperHand(c, env, GHOST.x - 4, hy, 1.15, sm((tq - (grab - 0.08)) / 0.12));
      }

      // Kelcey: walks into the rim of the light, turns to face OUT (camera-right, toward the window side), and shrugs
      // on 'doubted': up in 0.2 s to the peak on the word, held 0.8 s, settling
      if (tq >= p.kIn) {
        const w = p.walk(t);
        let kp: Pose = w.pose;
        let facing: 'left' | 'right' = w.facing;
        if (!w.walking && tq >= w.arrive) {
          kp = blendPose(w.pose, K_STAND, sm((tq - w.arrive) / 0.3));
          if (tq >= w.arrive + 0.34) facing = 'right';
          const sh = sm((tq - (p.doubted - 0.2)) / 0.2) * (1 - sm((tq - (p.doubted + 0.8)) / 0.35));
          kp = withLife(blendPose(kp, K_SHRUG, sh), tq, 37);
        }
        // the lamp is behind him once he faces out: its falloff rims his back edge
        K.draw(c, { x: w.x, y: FLOOR, facing, pose: kp, scale: PS, ink, light: { x: -1, y: -0.25, floor: 0 }, edgeRim: { x: -1, y: -0.15, px: 1.8, alpha: 0.85 * pool } }, env);
      }
    });
    f.rim({ x: 0, y: -1 });

    // the flame itself, and the lamp catching the near edges of the two sitters' hands (small, after the rims)
    if (lampK > 0) {
      f.layer('L4', (c, env) => {
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        for (const h of [uHand, pHand]) {
          if (!h) continue;
          const hh = h as { x: number; y: number };
          const g = c.createRadialGradient(hh.x, hh.y, 0, hh.x, hh.y, 16);
          g.addColorStop(0, withAlpha(env.mood.core, 0.32 * pool));
          g.addColorStop(1, withAlpha(env.mood.core, 0));
          c.fillStyle = g;
          c.fillRect(hh.x - 16, hh.y - 16, 32, 32);
        }
        c.globalCompositeOperation = op;
        wickFlame(c, LAMP.x, fy, 1.4, lampK, t, 2016, { halo: env.mood.halo, core: env.mood.core });
      });
    }

    // near plane: the end of another table and a chair back, out of focus at the left edge
    f.layer('L5', (c, env) => {
      bake(f, c, env, 'near2', { x: -260, y: 340, w: 560, h: 560 }, (cc) => {
        const fg = env.fill('fg');
        // the end of a near table (top and one leg) and, in front of it, a whole cafe chair in profile
        cc.fillStyle = fg;
        cc.fillRect(-260, 556, 330, 14);
        cc.fillRect(40, 570, 12, 400);
        // a tray with a cup and a plate on the near table end (reads as a table at a glance)
        cc.fillRect(-150, 548, 170, 8);
        cc.fillRect(-120, 520, 22, 28);
        cc.beginPath();
        cc.ellipse(-40, 548, 34, 12, 0, Math.PI, 0);
        cc.fill();
        cc.fillStyle = withAlpha(env.mood.rim, 0.35);
        cc.fillRect(-260, 555.5, 330, 1.4);
        cc.fillStyle = fg;
        cc.save();
        cc.translate(118, 812);
        cc.scale(2, 2);
        cafeChair(cc, fg, 0, 0, -100, 'left');
        cc.restore();
      });
    });

    // type: the place stamp (top-left), the two name cards, the quote card through the hold
    const te = { t, mood: f.mood, seed: 1016 };
    // the place stamp lands on 'lunch'; the name cards stagger (Uszkoreit on 'Jakob', Polosukhin 0.6 s later),
    // raised 30 px so their subtitles clear the bottom 12% band
    placeStamp(f.c, { place: 'Google', date: '2016', year: 2016, at: 0.8, dur: 4.4, x: 52, y: 70 }, te);
    nameCard(f.c, { name: 'Jakob Uszkoreit', role: 'Google', at: p.jakob - 0.1, dur: 3.2, y: 580 }, te);
    nameCard(f.c, { name: 'Illia Polosukhin', role: 'Google', at: p.jakob + 0.5, dur: 2.3, align: 'right', y: 580 }, te);
    // the card above Kelcey, right of centre; drawn at 1.25x so the attribution clears 26 px at 1080p
    {
      const QX = 902, QY = 178, QS = 1.25;
      // a soft dark vignette plate (about 20%) under the card, so it holds over the drifting window haze
      const qa = sm((t - 6.2) / 0.4);
      if (qa > 0) {
        const c = f.c;
        c.save();
        c.translate(QX, QY + 46);
        c.scale(1, 0.42);
        const g = c.createRadialGradient(0, 0, 20, 0, 0, 380);
        g.addColorStop(0, withAlpha(f.mood.fg, 0.22 * qa));
        g.addColorStop(0.6, withAlpha(f.mood.fg, 0.14 * qa));
        g.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = g;
        c.fillRect(-380, -380, 760, 760);
        c.restore();
      }
      f.c.save();
      f.c.translate(QX, QY);
      f.c.scale(QS, QS);
      f.c.translate(-QX, -QY);
      quoteCard(f.c, { quote: '…the biggest incorrect prediction of my life', speaker: 'Mat Kelcey', source: '2024', at: 6.3, stagger: 0.25, fade: 0.4, x: QX, y: QY, width: 440, size: 24, maxChars: 26 }, te);
      f.c.restore();
    }
  },
});
