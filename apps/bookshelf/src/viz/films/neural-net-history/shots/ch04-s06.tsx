/**
 * ch04-s06 — Britain, 1973: Lighthill at his lectern and the televised debate below.
 *
 * A steeply raked horseshoe theatre of benches in silhouette under a row of high windows (winter outside);
 * a broad lecture desk on a raised platform, lit from above by one pendant lamp. Lighthill stands in
 * profile at its left end with a sheaf of papers; below him, behind the pit's front rail, Michie and two
 * other opponents lean forward. A 1970s studio camera in the right foreground, its tally lamp a low ember
 * (the only warm light).
 *   "James"        Lighthill at the lectern; name card
 *   "explosion"    the debate below: Michie's name card, the place stamp; on the sheaf in Lighthill's hand a
 *                  tiny ink tree grows from one dot, each branch splitting in two, faster each time, until the
 *                  page is black (the combinatorial explosion, wordless)
 *   "rules"        the camera glances down to his top page on the desk: three inked boxes A, B, C; only B is
 *                  struck through, C (neural models among them) untouched; letters only
 *   "fell"         the backlight drops a step; the snow thickens at the high windows
 *   "decade"-0.36  Papert's whole sentence rises above the lectern and holds to the end
 *   "Historians"   four equal cards flutter down from the dark and land in a row on the lectern's sloped desk,
 *                  the last on "blows": TRANSLATION 1966 · MANSFIELD 1969 · PERCEPTRONS 1969 · LIGHTHILL 1973
 * Round-1 revision: the explosion gloss runs 1.3 s (5.7 → 7.0) through 8 visible generations, each 0.8× the
 * last, stops at ~70% ink with its line work still showing, and clears back to white paper by 7.3 s, before
 * the A·B·C page; the first push is longer (≈ 4.7 s) and ~25% smaller, the final push eases over 4.5 s; Michie's
 * name card and the place stamp wait for the pull-back, when the pit and the studio camera are in frame; the
 * four cards start just under Papert's sentence and drift in from the right of the lamp's cone (never across
 * the quote or his head); a feathered dark plate holds the italic quote over the snowy windows; two bench tiers
 * step up behind the opponents (the rake); the tally lamp throws its own tiny seeded glow.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import {
  LAYERS, MOODS, POSES, addPose, applyBeats, blendPose, createPuppet, defineShot, dustMotes, fbm, mixLab, nameCard, overscan, placeStamp,
  pose, quoteCard, snow, softPlate, talkBeats, toLayer, toScreen, withAlpha, withLife,
} from '../../../film';
import type { TalkBeats } from '../../../film';
import { SPECS, cast } from '../cast';
import { FONT } from '../../../film/silhouette/type';
import { paperTone } from '../sets/caseBoard';
import { theatreArms, theatreBack, tvCamera } from '../sets/ch04-s06-theatre';
import { camKeys, clamp01, flutter, glow, inkLine, sm, tq12, win } from '../sets/ch04-s06-kit';

const ID = 'ch04-s06';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the stage geography (L4, rest-screen px)
const FLOOR = 664;
const DAIS = { x0: 70, x1: 752, top: 532 };
/**
 * the lectern: a narrow reading desk (240 px, a third narrower than the platform's old bench) whose slope is a plain
 * board with a book ledge; under it a moulded cornice, a panelled front between two pilasters, and a plinth
 */
const DESK = { x0: 380, x1: 620, top: 356, lip: 424, base: 532 };
const LAMP = { x: 506, y: 74 };
const LH_X = 318;
const PIT = { rail: 548, x0: 772, x1: 1400 };
const SEATS = [842, 972, 1096];
/** the cards' landing row on the slope (centres), and their size (world px) */
const CARD = { w: 76, h: 44, y: DESK.lip - 22 };
/** four separate cards with small gaps, resting on the slope's book ledge in a row (they overhang the narrow desk a little, so their type holds the 22 px floor in the final push) */
const CARD_X = [DESK.x0 + 13, DESK.x0 + 91, DESK.x0 + 169, DESK.x0 + 247];
/** each card comes to rest at its own slight angle and height: four separate blows, not one strip */
const CARD_REST = [{ r: -0.03, y: 0 }, { r: 0.022, y: -1.5 }, { r: -0.016, y: 0.5 }, { r: 0.03, y: -1 }];
const CARD_TEXT: [string, string][] = [['TRANSLATION', '1966'], ['MANSFIELD', '1969'], ['PERCEPTRONS', '1969'], ['LIGHTHILL', '1973']];
/** Lighthill's top page on the slope (the A · B · C summary) */
const PAGE = { x: 390, y: 338, w: 92, h: 62 };

// the cast: Lighthill's own sheaf is drawn by the shot (so the ink tree can grow on it)
const LIGHTHILL = createPuppet({ ...SPECS.lighthill, prop: 'none' });
const MICHIE = cast.michie;
// two other opponents in the pit (generic, unnamed)
const OPP_A = createPuppet({
  id: 'ch04-s06-oppA', height: 322, build: 'average', era: '1970s', wardrobe: 'suit', hair: 'receding', facialHair: 'beard',
  glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.52 }, prop: 'none', details: [],
});
const OPP_B = createPuppet({
  id: 'ch04-s06-oppB', height: 318, build: 'average', era: '1970s', wardrobe: 'sweaterVest', hair: 'sidePart', facialHair: 'none',
  glasses: 'heavy', hat: 'none', profile: { nose: 0.48, brow: 0.5, chin: 0.5, jaw: 0.48 }, prop: 'none', details: [],
});

// poses
const STANCE = { hipF: 5, kneeF: -4, hipB: -4, kneeB: -1 };
const HOLD: Pose = pose({ ...STANCE, torso: 1, neck: 9, head: -3, shoulderF: 30, elbowF: 84, wristF: -16, shoulderB: -8, elbowB: 18 }, { handF: 'pinch' });
const SHOW: Pose = pose({ ...STANCE, torso: 4, neck: 9, head: -2, shoulderF: 50, elbowF: 26, wristF: -24, shoulderB: -8, elbowB: 18 }, { handF: 'pinch' });
const LOWER: Pose = pose({ ...STANCE, torso: 2, neck: 12, head: 4, shoulderF: 4, elbowF: 14, wristF: 4, shoulderB: -8, elbowB: 16 }, { handF: 'pinch' });
const GRAVE: Pose = pose({ ...STANCE, torso: 3, neck: 15, head: 9, shoulderF: -16, elbowF: 30, wristF: -4, shoulderB: -18, elbowB: 26 }, { handF: 'fist', handB: 'fist' });
/** the small head-lift toward Papert's sentence in the hold */
const LIFT: Pose = pose({ ...STANCE, torso: 1, neck: 4, head: -7, shoulderF: -16, elbowF: 30, wristF: -4, shoulderB: -18, elbowB: 26 }, { handF: 'fist', handB: 'fist' });
const SITLEAN: Pose = { ...addPose(POSES.sit, { torso: 13, neck: -2, head: -6, shoulderF: -12, elbowF: 36, wristF: 6, shoulderB: -14, elbowB: 40 }), handF: 'relaxed' };
const OBJECT: Pose = { ...addPose(POSES.sit, { torso: 15, neck: -4, head: -10, shoulderF: 44, elbowF: 112, wristF: -10, shoulderB: -14, elbowB: 40 }), handF: 'point' };
/** the sheaf in his near hand (world px) */
const SHEAF = { w: 72, h: 94 };

interface Beats {
  james: number;
  explosion: number;
  it: number;
  struck: number;
  rules: number;
  yet: number;
  nets: number;
  comb: number;
  pull0: number;
  fell: number;
  papert: number;
  one: number;
  hist: number;
  blows: number;
  lineEnd: number;
  land: number[];
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  talk: TalkBeats;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const blows = T.word('L0411', 'blows');
    const hist = T.beat('blows');
    // four cards, equal pitch, the first leaving the dark on "Historians", the last landing on "blows"
    const fallDur = 1.0;
    const pitch = (blows - (hist + fallDur)) / 3;
    const land = [0, 1, 2, 3].map((i) => hist + fallDur + i * pitch);
    const b: Beats = {
      james: T.beat('lectern'),
      explosion: T.beat('explosion'),
      it: T.word('L0410', 'It'),
      struck: T.word('L0410', 'struck'),
      rules: T.beat('suspect'),
      yet: T.word('L0410', 'Yet'),
      nets: T.word('L0410', 'nets'),
      comb: T.word('L0410', 'combinatorial'),
      pull0: T.word('L0410', 'nets') + 0.3,
      fell: T.beat('fell'),
      papert: T.beat('papert'),
      one: T.line('L0411').start,
      hist,
      blows,
      lineEnd: T.line('L0411').end,
      land,
    };
    // the camera: a wide of the theatre; a slow push to the sheaf in his hand with Michie in the pit beside
    // it (the explosion gloss); a 2 s glide down onto the top page for "rules", held through "nets"; a 2.5 s
    // pull-back to the wide for "fell"; then a slow ease in on the lectern desk as the four cards come down
    // A: the gloss close-up, trucked left so his profile and the sheaf are both inside the frame
    const A: [number, number, number] = [578, 352, 440];
    const B: [number, number, number] = [548, 374, 560];
    // (round 1: the first push starts at 0.9 s and runs ≈ 4.7 s to a ~25% smaller close-up; the last push eases in
    // over 4.5 s)
    const cam = camKeys([
      [0, 664, 330, -80],
      [0.9, 656, 336, -50],
      [b.explosion - 0.2, ...A],
      [b.explosion + 1.0, A[0] - 4, A[1] + 2, A[2] + 4],
      [b.explosion + 2.4, ...B],
      [b.pull0, B[0] + 4, B[1] + 1, B[2] + 6],
      [b.pull0 + 2.5, 640, 336, 0],
      [b.one - 0.35, 636, 339, 18],
      [b.one + 4.15, 490, 340, 640],
      [D, 488, 340, 690],
    ]);
    const CAMS = [0, 0.9, b.explosion, b.explosion + 1.0, b.explosion + 2.4, b.pull0, b.pull0 + 2.5, b.one, b.one + 4.15, D].map(cam);
    const talk = talkBeats(T, { lines: ['L0410'], head: 1.6, hand: 0.5, to: b.yet });
    tl.hold(0, D);
    return { tl, b, D, cam, CAMS, talk };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    const cam = sc.cam(t);
    f.camera(cam);
    // the backlight drops a step on "fell"
    const fellU = win(t, b.fell - 0.1, b.fell + 0.9);
    f.backlight({ sunX: 640, sunY: 150, sunRadius: 640, intensity: 0.98 - 0.53 * fellU });

    // L1: beyond the high windows: the winter night, a far roofline, the snow (thicker after "fell")
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, sc.CAMS, 40);
      f.cached(`${ID}/L1/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 520, (cc) => {
        cc.translate(-r.x, -40);
        cc.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.4);
        cc.beginPath();
        cc.moveTo(r.x, 560);
        for (let x = r.x; x <= r.x + r.w; x += 30) {
          const h = 300 + 28 * Math.sin(x * 0.013) + (Math.floor(x / 90) % 3 === 0 ? -34 : 0);
          cc.lineTo(x, h);
          cc.lineTo(x + 30, h);
        }
        cc.lineTo(r.x + r.w, 560);
        cc.closePath();
        cc.fill();
      })(c, r.x, 40);
      const area = { x: r.x, y: -40, w: r.w, h: 420 };
      // "fell": the night beyond the windows goes a step darker
      if (fellU > 0) {
        c.fillStyle = withAlpha(env.mood.fg, 0.42 * fellU);
        c.fillRect(r.x, -200, r.w, 800);
      }
      snow(c, { area, count: 90, salt: 61, fall: 30, wind: 10, size: 0.8, color: env.mood.core }, env);
      if (fellU > 0) {
        c.save();
        c.globalAlpha *= fellU;
        snow(c, { area, count: 460, salt: 67, fall: 48, wind: 22, gust: 1.5, size: 1.6, color: env.mood.core }, env);
        c.restore();
      }
    });

    // L2: the back wall, high windows, the horseshoe's back tiers and the hazed audience (baked);
    // the studio floods warming the tiers behind the lectern and the pit
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, sc.CAMS, 40);
      f.cached(`${ID}/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        theatreBack(cc, r, env);
      })(c, r.x, r.y);
      const k = 1 - 0.5 * fellU;
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const [x, y, R, a] of [[LAMP.x, 420, 520, 0.2], [960, 470, 420, 0.1]] as const) {
        const g = c.createRadialGradient(x, y, 10, x, y, R);
        g.addColorStop(0, withAlpha(env.mood.halo, a * k));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      c.restore();
    });
    f.fog({ yCenter: 0.6 * 720, height: 0.42 * 720, alpha: 0.24, drift: 6 });

    // L3: the horseshoe's arms (baked)
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, sc.CAMS, 40);
      f.cached(`${ID}/L3b/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        theatreArms(cc, r, env);
        benchTiers(cc, r, env);
      })(c, r.x, r.y);
    });
    f.fog('B');

    // L4: the action plane
    f.layer('L4', (c, env) => {
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      platform(f, c, env, r);
      // the pendant lamp's cone of light falling on the desk
      lampCone(c, env, 1 - 0.25 * fellU);
      // the pit: three seated opponents behind the front rail, leaning toward the platform
      pit(c, env, tq, b);
      // Lighthill
      lighthill(c, env, t, tq, b, sc.talk);
      // the desk (in front of his near hand), the top page, the cards
      desk(f, c, env);
      topPage(c, env, t, b);
      for (let i = 0; i < 4; i++) {
        const R = CARD_REST[i];
        // each card leaves the dark just under Papert's sentence (its bottom + 40 px on screen, at the card's start)
        // and drifts in from the right side of the lamp's cone: never across the quote, never over his head
        const t0 = b.land[i] - 1.0;
        const from = toLayer(LAYERS.L4, sc.cam(t0), 0, QUOTE_BOTTOM + 40);
        const fl = flutter(t, t0, b.land[i], { x: DESK.x1 + 34 + 14 * i, y: from.y }, { x: CARD_X[i], y: CARD.y + R.y }, 40 + i);
        if (!fl.on) continue;
        drawCard(c, env, fl.x, fl.y, fl.rot + R.r * sm((tq - (b.land[i] - 0.5)) / 0.5), CARD_TEXT[i], tq >= b.land[i] ? 1 : 0.85);
      }
      // the lamp itself
      pendantLamp(c, env);
      // motes turning in the lamp's cone
      dustMotes(c, { area: { x: DESK.x0 - 40, y: 120, w: DESK.x1 - DESK.x0 + 80, h: 300 }, count: 24, salt: 17, size: 1, brightness: 0.4, drift: { x: 2, y: -1.5 }, color: env.mood.halo }, env);
    });
    f.rim({ x: 0.15, y: -1 });
    f.practical({ x: LAMP.x, y: LAMP.y + 26, kind: 'lamp', seed: 73, intensity: 0.85 - 0.2 * fellU, radius: 46 });
    // the studio camera's tally lamp: a tiny seeded practical at its ember (L5)
    f.practical({ x: 1090 + 25 * 0.95, y: 360 - 8 * 0.95, kind: 'led', seed: 1973, intensity: 0.35, radius: 16, layer: 'L5' });

    // L5: the studio camera in the right foreground; its tally lamp the only warm light
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, sc.CAMS, 40);
      const tc = { x: 1090, y: 360, s: 0.95 };
      const draw = f.cached(`${ID}/L5/tv/${env.mood.id}`, 520, 520, (cc) => {
        cc.translate(130, 80);
        tvCamera(cc, { x: 0, y: 0, s: tc.s }, env);
      });
      draw(c, tc.x - 130, tc.y - 80);
      const tally = { x: tc.x + 25 * tc.s, y: tc.y - 8 * tc.s };
      // a low ember: emberRed about 60% into the winter (the dot), with a dimmer glow of the script's mix
      const e = mixLab(MOODS.emberRed.halo, env.mood.halo, 0.35);
      const eg = mixLab(MOODS.emberRed.halo, env.mood.halo, 0.6);
      const pulse = 0.92 + 0.08 * fbm(tq * 2.0, 5);
      {
        const g = c.createRadialGradient(tally.x, tally.y, 0, tally.x, tally.y, 13);
        g.addColorStop(0, withAlpha(e, 0.75 * pulse));
        g.addColorStop(1, withAlpha(e, 0));
        c.fillStyle = g;
        c.fillRect(tally.x - 13, tally.y - 13, 26, 26);
      }
      c.fillStyle = e;
      c.beginPath();
      c.arc(tally.x, tally.y, 4.2, 0, Math.PI * 2);
      c.fill();
      glow(c, tally.x, tally.y, 60, eg, 0.08 * pulse);
      // the ember's own tiny practical spill on the camera's flank (seeded flicker): the one warm accent, motivated
      glow(c, tally.x - 6, tally.y + 14, 38, e, 0.1 * pulse * (0.9 + 0.1 * fbm(tq * 3.1, 77)));
      // the floor's near edge, low (the pit floor's front boards)
      c.fillStyle = env.mood.ink;
      c.fillRect(r.x, 760, r.w, 200);
      // in the close-ups the studio camera's dark flank stays at the right edge of frame, out of focus (it is
      // the nearest thing to us, between the lens and the lectern)
      // (only in the page close-up and the final push-in: in the gloss close-up Michie sits at that edge)
      const near = clamp01((cam.z - 420) / 110) * Math.max(
        win(t, b.explosion + 1.0, b.explosion + 1.8) * (1 - win(t, b.pull0, b.pull0 + 0.8)),
        win(t, b.hist, b.hist + 1.2),
      );
      if (near > 0.01) {
        const a = toLayer(LAYERS.L5, cam, 1196, -60), bb = toLayer(LAYERS.L5, cam, 1340, 780);
        const k = (bb.x - a.x) / 144;
        c.save();
        c.globalAlpha *= 0.96 * near;
        c.fillStyle = env.fill('ink');
        c.beginPath();
        c.moveTo(a.x + 34 * k, a.y);
        c.lineTo(bb.x, a.y);
        c.lineTo(bb.x, bb.y);
        c.lineTo(a.x + 10 * k, bb.y);
        c.lineTo(a.x, a.y + 520 * k);
        c.quadraticCurveTo(a.x - 4 * k, a.y + 300 * k, a.x + 14 * k, a.y + 210 * k);
        c.closePath();
        c.fill();
        // a hairline of the lamp on its edge
        c.strokeStyle = withAlpha(env.mood.rim, 0.12);
        c.lineWidth = 1.5 * k;
        c.beginPath();
        c.moveTo(a.x + 14 * k, a.y + 210 * k);
        c.quadraticCurveTo(a.x - 4 * k, a.y + 300 * k, a.x, a.y + 520 * k);
        c.stroke();
        c.restore();
      }
    });

    // the pendant lamp's falloff: everything outside its cone sinks toward ink (screen space, before type)
    {
      const c = f.c;
      const lp = toScreen(LAYERS.L4, cam, LAMP.x + 20, 360);
      const kk = lp.k;
      c.save();
      const g = c.createRadialGradient(lp.x, lp.y, 220 * kk, lp.x, lp.y, 760 * kk);
      g.addColorStop(0, withAlpha(f.mood.ink, 0));
      g.addColorStop(0.55, withAlpha(f.mood.ink, 0.28));
      g.addColorStop(1, withAlpha(f.mood.ink, 0.62));
      c.fillStyle = g;
      c.fillRect(-40, -40, 1360, 800);
      // and the floor of the frame
      const fl = c.createLinearGradient(0, 560, 0, 720);
      fl.addColorStop(0, withAlpha(f.mood.ink, 0));
      fl.addColorStop(1, withAlpha(f.mood.ink, 0.5));
      c.fillStyle = fl;
      c.fillRect(-40, 560, 1360, 200);
      c.restore();
    }

    // ---------------------------------------------------------------- type (screen-locked)
    const env = { t, mood: f.mood, seed: 46 };
    nameCard(f.c, { name: 'Sir James Lighthill', role: 'applied mathematician, Cambridge', at: b.james, dur: Math.min(3.3, b.explosion - b.james - 0.1) }, env);
    // Michie's card and the place stamp wait for the pull-back, when the pit, the three opponents and the studio
    // camera are all in frame (the debate below)
    nameCard(f.c, { name: 'Donald Michie', role: 'Edinburgh', align: 'right', at: b.pull0 + 0.8, dur: 3.0 }, env);
    placeStamp(f.c, { place: 'Royal Institution · London', date: '1973 (televised debate)', style: 'typewriter', at: b.pull0 + 0.5, dur: 2.9 }, env);
    // Papert's sentence rises above the lectern and holds through the question and the hold
    const rise = sm((t - b.papert) / 1.1);
    if (t >= b.papert) {
      f.c.save();
      f.c.translate(0, (1 - rise) * 26);
      // a soft dark plate so the sentence never sits on the bare window mullions
      f.c.globalAlpha = sm((t - b.papert) / 0.8);
      quotePlate(f.c, f.mood.ink);
      softPlate(f.c, 728, 160, 760, 250, f.mood.ink, 0.2);
      f.c.globalAlpha = 1;
      quoteCard(f.c, {
        quote: 'We did not think of our work as killing Snow White; we saw it as a way to understand her.',
        speaker: 'Papert, 1988',
        x: 728,
        y: 150,
        width: 600,
        size: 28,
        at: b.papert,
      }, env);
      f.c.restore();
    }
  },
});

// =====================================================================================================
// pieces
// =====================================================================================================
function platform(f: Frame, c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  f.cached(`${ID}/L4/floor/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 520, (cc) => {
    cc.translate(-r.x, -DAIS.top + 20);
    const m = env.mood;
    // the pit floor
    cc.fillStyle = mixLab(m.ink, m.fg, 0.5);
    cc.fillRect(r.x, FLOOR, r.w, 600);
    cc.strokeStyle = withAlpha(m.fg, 0.5);
    cc.lineWidth = 1;
    for (let i = -16; i <= 16; i++) {
      cc.beginPath();
      cc.moveTo(640 + i * 70, FLOOR);
      cc.lineTo(640 + i * 150, FLOOR + 300);
      cc.stroke();
    }
    // the raised platform: a panelled front face, a lit nosing
    cc.fillStyle = env.fill('ink');
    cc.fillRect(DAIS.x0, DAIS.top, DAIS.x1 - DAIS.x0, FLOOR - DAIS.top + 2);
    cc.fillStyle = withAlpha(m.rim, 0.26);
    cc.fillRect(DAIS.x0, DAIS.top, DAIS.x1 - DAIS.x0, 1.6);
    cc.strokeStyle = withAlpha(m.rim, 0.08);
    cc.lineWidth = 1.2;
    for (let x = DAIS.x0 + 18; x < DAIS.x1 - 60; x += 112) cc.strokeRect(x, DAIS.top + 22, 92, FLOOR - DAIS.top - 42);
    // two steps down at the platform's right end
    cc.fillStyle = env.fill('ink');
    cc.fillRect(DAIS.x1, DAIS.top + 44, 34, FLOOR - DAIS.top - 44);
    cc.fillRect(DAIS.x1 + 34, DAIS.top + 88, 30, FLOOR - DAIS.top - 88);
    cc.fillStyle = withAlpha(m.rim, 0.16);
    cc.fillRect(DAIS.x1, DAIS.top + 44, 34, 1.2);
    cc.fillRect(DAIS.x1 + 34, DAIS.top + 88, 30, 1.2);
  })(c, r.x, DAIS.top - 20);
}

function lampCone(c: C, env: PaintEnv, k: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, LAMP.y + 20, 0, DESK.lip);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.21 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0.065 * k));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(LAMP.x - 22, LAMP.y + 24);
  c.lineTo(LAMP.x + 22, LAMP.y + 24);
  c.lineTo(DESK.x1 + 40, DESK.lip + 20);
  c.lineTo(DESK.x0 - 90, DESK.lip + 20);
  c.closePath();
  c.fill();
  // the pool it makes on the platform's top
  const pg = c.createRadialGradient(LAMP.x, DAIS.top, 10, LAMP.x, DAIS.top, 300);
  pg.addColorStop(0, withAlpha(env.mood.halo, 0.26 * k));
  pg.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = pg;
  c.fillRect(LAMP.x - 300, DAIS.top - 6, 600, 12);
  c.restore();
}

function pendantLamp(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(LAMP.x, -400);
  c.lineTo(LAMP.x, LAMP.y);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(LAMP.x - 7, LAMP.y);
  c.lineTo(LAMP.x + 7, LAMP.y);
  c.lineTo(LAMP.x + 30, LAMP.y + 24);
  c.lineTo(LAMP.x - 30, LAMP.y + 24);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.35);
  c.fillRect(LAMP.x - 30, LAMP.y + 23, 60, 1.4);
}

function desk(f: Frame, c: C, env: PaintEnv) {
  const W = DESK.x1 - DESK.x0;
  f.cached(`${ID}/L4/lectern/${env.mood.id}`, W + 60, DESK.base - DESK.top + 30, (cc) => {
    cc.translate(-DESK.x0 + 30, -DESK.top + 10);
    const m = env.mood;
    const ink = env.fill('ink');
    const cut = withAlpha(m.rim, 0.14);
    const x0 = DESK.x0, x1 = DESK.x1;
    // the sloped reading board, square-ended (a board, not a roof): lit by the lamp above, darker toward the ledge
    const g = cc.createLinearGradient(0, DESK.top, 0, DESK.lip);
    g.addColorStop(0, mixLab(m.set, m.halo, 0.36));
    g.addColorStop(1, mixLab(m.set, m.fg, 0.24));
    cc.fillStyle = g;
    cc.fillRect(x0 + 4, DESK.top, W - 8, DESK.lip - DESK.top);
    // the board's grain, running along it, and a soft bevel shadow under the top rail (it is a slope, tilted to him)
    for (let i = 0; i < 9; i++) {
      const y = DESK.top + 6 + i * 7 + 2 * Math.sin(i * 2.7);
      cc.strokeStyle = withAlpha(m.fg, 0.07 + 0.03 * (i % 3));
      cc.lineWidth = 0.8;
      cc.beginPath();
      cc.moveTo(x0 + 6, y);
      cc.bezierCurveTo(x0 + W * 0.3, y + 1.5 * Math.sin(i), x0 + W * 0.7, y - 1.5 * Math.cos(i), x1 - 6, y + 0.6);
      cc.stroke();
    }
    const bev = cc.createLinearGradient(0, DESK.top, 0, DESK.top + 12);
    bev.addColorStop(0, withAlpha(m.fg, 0.35));
    bev.addColorStop(1, withAlpha(m.fg, 0));
    cc.fillStyle = bev;
    cc.fillRect(x0 + 4, DESK.top, W - 8, 12);
    // its frame: thin stiles at the ends, a thin rail along the top
    cc.fillStyle = ink;
    cc.fillRect(x0, DESK.top - 3, 5, DESK.lip - DESK.top + 3);
    cc.fillRect(x1 - 5, DESK.top - 3, 5, DESK.lip - DESK.top + 3);
    cc.fillRect(x0, DESK.top - 3, W, 4);
    cc.fillStyle = withAlpha(m.rim, 0.3);
    cc.fillRect(x0, DESK.top - 3, W, 1.2);
    // the book ledge at the foot of the slope (barely proud of the board)
    const L = DESK.lip;
    cc.fillStyle = ink;
    cc.fillRect(x0 - 3, L - 1, W + 6, 8);
    cc.fillStyle = withAlpha(m.rim, 0.34);
    cc.fillRect(x0 - 3, L - 1, W + 6, 1.3);
    // the moulded cornice under it: an ovolo, a fillet, a cove stepping in to the case
    const steps: [number, number, number][] = [
      // y, height, inset
      [L + 7, 5, 0],
      [L + 12, 3, 4],
      [L + 15, 6, 9],
      [L + 21, 3, 13],
    ];
    for (const [y, h, inset] of steps) {
      cc.fillStyle = ink;
      cc.fillRect(x0 + inset, y, W - 2 * inset, h);
      cc.fillStyle = withAlpha(m.rim, 0.12);
      cc.fillRect(x0 + inset, y, W - 2 * inset, 0.9);
    }
    // the case: a panelled front between two pilasters, narrower than the board (no overhanging eaves)
    const cx0 = x0 + 15, cx1 = x1 - 15, cy0 = L + 24, cy1 = DESK.base - 13;
    cc.fillStyle = ink;
    cc.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
    cc.strokeStyle = cut;
    cc.lineWidth = 1.1;
    // pilasters with a capital and a base
    for (const px of [cx0 + 3, cx1 - 15]) {
      cc.strokeRect(px, cy0 + 6, 12, cy1 - cy0 - 12);
      cc.beginPath();
      cc.moveTo(px - 2, cy0 + 5);
      cc.lineTo(px + 14, cy0 + 5);
      cc.moveTo(px - 2, cy1 - 5);
      cc.lineTo(px + 14, cy1 - 5);
      cc.stroke();
    }
    // two fielded panels: an outer frame and a raised field with mitred corners
    const pw = (cx1 - cx0 - 30 - 12) / 2;
    for (let i = 0; i < 2; i++) {
      const px = cx0 + 18 + i * (pw + 12), py = cy0 + 9, ph = cy1 - cy0 - 18;
      cc.strokeRect(px, py, pw, ph);
      cc.strokeRect(px + 7, py + 7, pw - 14, ph - 14);
      cc.beginPath();
      cc.moveTo(px, py);
      cc.lineTo(px + 7, py + 7);
      cc.moveTo(px + pw, py);
      cc.lineTo(px + pw - 7, py + 7);
      cc.moveTo(px, py + ph);
      cc.lineTo(px + 7, py + ph - 7);
      cc.moveTo(px + pw, py + ph);
      cc.lineTo(px + pw - 7, py + ph - 7);
      cc.stroke();
    }
    // the plinth: a step out, with a thin moulding
    cc.fillStyle = ink;
    cc.fillRect(cx0 - 6, cy1, cx1 - cx0 + 12, DESK.base - cy1);
    cc.fillStyle = withAlpha(m.rim, 0.14);
    cc.fillRect(cx0 - 6, cy1, cx1 - cx0 + 12, 1);
  })(c, DESK.x0 - 30, DESK.top - 10);
}

/**
 * Lighthill's top page on the slope: a typed header (texture), three inked boxes A · B · C. It lies dim (in the
 * shadow of the raised sheaf) until the gloss has cleared and he lowers the sheaf (7.35 s); then it catches the lamp and one
 * firm ink stroke runs through B, landing on "rules". C stays untouched and alive: a brighter paper, a glint.
 */
function topPage(c: C, env: PaintEnv, t: number, b: Beats) {
  const m = env.mood;
  const tq = tq12(t);
  // it catches the lamp only once the gloss has cleared from the sheaf (7.35 s)
  const lit = win(tq, TREE_CLEAR[1] - 0.12, TREE_CLEAR[1] + 0.12);
  const paper = paperTone(env, 0.86);
  const ink = mixLab(m.ink, paper, 0.12);
  c.save();
  c.translate(PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h / 2);
  c.rotate(-0.025);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-PAGE.w / 2 + 2, -PAGE.h / 2 + 2.5, PAGE.w, PAGE.h);
  c.globalAlpha = 0.28 + 0.72 * lit;
  c.fillStyle = paper;
  c.fillRect(-PAGE.w / 2, -PAGE.h / 2, PAGE.w, PAGE.h);
  // a second sheet beneath, offset
  c.fillStyle = mixLab(paper, m.set, 0.25);
  c.fillRect(-PAGE.w / 2 + 3, PAGE.h / 2, PAGE.w - 2, 2.2);
  c.globalAlpha = lit;
  if (lit > 0.01) {
    // typed header: two short lines (texture, not text)
    c.fillStyle = withAlpha(ink, 0.55);
    c.fillRect(-PAGE.w / 2 + 9, -PAGE.h / 2 + 7, 46, 2.2);
    c.fillRect(-PAGE.w / 2 + 9, -PAGE.h / 2 + 12, 30, 2.2);
    // the three boxes, joined A — B — C (B is the bridge between them)
    const bw = 22, bh = 20, gap = 7, y0 = -PAGE.h / 2 + 22;
    const xs = [-bw - gap - bw / 2, -bw / 2, bw / 2 + gap];
    // C: untouched and alive (a brighter paper inside its box)
    c.fillStyle = mixLab(paperTone(env, 1), m.halo, 0.3);
    c.fillRect(xs[2] + 0.8, y0 + 0.8, bw - 1.6, bh - 1.6);
    c.strokeStyle = ink;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(xs[0] + bw, y0 + bh / 2);
    c.lineTo(xs[1], y0 + bh / 2);
    c.moveTo(xs[1] + bw, y0 + bh / 2);
    c.lineTo(xs[2], y0 + bh / 2);
    c.stroke();
    c.fillStyle = ink;
    c.font = `400 14px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    ['A', 'B', 'C'].forEach((L, i) => {
      c.strokeRect(xs[i], y0, bw, bh);
      c.fillText(L, xs[i] + bw / 2, y0 + bh / 2 + 1);
    });
    // a few ruled lines under the boxes (texture)
    c.fillStyle = withAlpha(ink, 0.32);
    for (let i = 0; i < 3; i++) c.fillRect(-PAGE.w / 2 + 9, y0 + bh + 8 + i * 5, PAGE.w - 18 - (i === 2 ? 30 : 0), 1.4);
    // "struck rules": B struck through with one firm inked stroke (0.42 s, through "rules")
    const u = clamp01((tq - (TREE_CLEAR[1] - 0.05)) / 0.42);
    inkLine(c, [{ x: xs[1] - 7, y: y0 + bh * 0.8 }, { x: xs[1] + bw * 0.5, y: y0 + bh * 0.46 }, { x: xs[1] + bw + 7, y: y0 + bh * 0.16 }], 3.4, ink, u, 9);
    // "far more than nets": a faint 0.4 s glint on the untouched C box, on "nets"
    const gl = win(t, b.nets - 0.05, b.nets + 0.12) * (1 - win(t, b.nets + 0.2, b.nets + 0.45));
    if (gl > 0) {
      glow(c, xs[2] + bw / 2, y0 + bh / 2, 16, m.halo, 0.5 * gl);
      c.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.5), 0.6 * gl);
      c.lineWidth = 1.1;
      c.strokeRect(xs[2] - 1.5, y0 - 1.5, bw + 3, bh + 3);
    }
  }
  c.restore();
}

/** the cards' name size: the size at which the longest name fills the card less a small margin */
function cardNamePx(c: C): number {
  c.font = `400 10px ${FONT.typewriter}`;
  const widest = Math.max(...CARD_TEXT.map(([a]) => c.measureText(a).width));
  return Math.min(12, (10 * (CARD.w - 5)) / widest);
}

/** one of the four equal cards (world px), centred at x, y, tilted rot; typed in two lines */
function drawCard(c: C, env: PaintEnv, x: number, y: number, rot: number, [a, b]: [string, string], light: number) {
  const m = env.mood;
  const paper = paperTone(env, light);
  const ink = mixLab(m.ink, paper, 0.1);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-CARD.w / 2 + 1.8, -CARD.h / 2 + 2.4, CARD.w, CARD.h);
  c.fillStyle = paper;
  c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
  c.fillStyle = withAlpha(m.rim, 0.3 * light);
  c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, 1);
  // the cut edge (a hair of ink), so neighbouring cards never merge into one strip
  c.strokeStyle = withAlpha(m.fg, 0.55);
  c.lineWidth = 0.7;
  c.strokeRect(-CARD.w / 2 + 0.35, -CARD.h / 2 + 0.35, CARD.w - 0.7, CARD.h - 0.7);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const namePx = cardNamePx(c);
  // equal cards, equal type: every name at the size that fits the longest (PERCEPTRONS); sized with the final
  // push-in (z 550 → 620) so the row reads at >= 22 px cap on a 1080p frame
  c.font = `400 ${namePx}px ${FONT.typewriter}`;
  c.fillText(a, 0, -7.5);
  c.font = `400 ${12}px ${FONT.typewriter}`;
  c.fillText(b, 0, 10.5);
  c.restore();
}

function pit(c: C, env: PaintEnv, tq: number, b: Beats) {
  const light = { x: -0.6, y: -0.8, floor: 0.2 };
  const who = [
    { p: MICHIE, x: SEATS[0], seed: 31, base: SITLEAN },
    { p: OPP_A, x: SEATS[1], seed: 32, base: addPose(SITLEAN, { torso: -3, head: 2 }) },
    { p: OPP_B, x: SEATS[2], seed: 33, base: addPose(SITLEAN, { torso: 2, neck: 3 }) },
  ];
  for (let i = who.length - 1; i >= 0; i--) {
    const w = who[i];
    let ps: Pose = w.base;
    if (i === 0) {
      // Michie: on "explosion" a hand comes up, ready to object; it settles again after a few words
      const up = sm((tq - (b.explosion + 0.1)) / 0.5) * (1 - sm((tq - (b.rules + 0.6)) / 0.6));
      ps = blendPose(w.base, OBJECT, up);
    }
    if (i === 1) ps = blendPose(w.base, addPose(w.base, { torso: 5, head: -4 }), sm((tq - b.yet) / 0.6));
    w.p.draw(c, { x: w.x, y: FLOOR, facing: 'left', pose: withLife(ps, tq, w.seed, 0.8), light }, env);
  }
  // the pit's front rail: a long panelled bench-desk hiding their laps (ink, lit along its top)
  c.fillStyle = env.fill('ink');
  c.fillRect(PIT.x0, PIT.rail, PIT.x1 - PIT.x0, FLOOR - PIT.rail + 2);
  c.fillRect(PIT.x0 - 8, PIT.rail - 6, PIT.x1 - PIT.x0 + 8, 8);
  c.fillStyle = withAlpha(env.mood.rim, 0.24);
  c.fillRect(PIT.x0 - 8, PIT.rail - 6, PIT.x1 - PIT.x0 + 8, 1.3);
  c.strokeStyle = withAlpha(env.mood.rim, 0.07);
  c.lineWidth = 1.2;
  for (let x = PIT.x0 + 14; x < PIT.x1 - 40; x += 120) c.strokeRect(x, PIT.rail + 16, 100, FLOOR - PIT.rail - 30);
}

function lighthill(c: C, env: PaintEnv, t: number, tq: number, b: Beats, talk: TalkBeats) {
  // pose: holding the sheaf at the chest → showing it out toward the pit on "explosion" → lowering it on "It"
  // once the page is black → a grave stillness, hands behind his back, for the question; in the hold, one small
  // lift of the head toward Papert's sentence
  let p: Pose = HOLD;
  p = blendPose(p, SHOW, sm((tq - (b.explosion - 0.45)) / 0.5));
  p = blendPose(p, LOWER, sm((tq - LOWER_AT(b)) / 0.55));
  p = blendPose(p, GRAVE, sm((tq - (b.papert - 0.6)) / 0.8));
  p = blendPose(p, LIFT, sm((tq - 18.7) / 0.9));
  const lp = applyBeats(withLife({ ...p }, tq, 1973, 1.25), talk, tq);
  const o = { x: LH_X, y: DAIS.top, facing: 'right' as const, pose: lp, light: { x: 0.2, y: -1, floor: 0.25 } };
  LIGHTHILL.draw(c, o, env);
  // the sheaf in his near hand (until it is tucked away)
  const lowered = sm((tq - LOWER_AT(b)) / 0.55);
  const gone = sm((tq - (b.papert - 0.6)) / 0.5);
  if (gone >= 1) return;
  const h = LIGHTHILL.anchor(o, 'handF');
  const flat = 1 - 0.85 * lowered; // lowered to his side it turns edge-on
  c.save();
  c.globalAlpha *= (1 - gone) * (1 - 0.6 * lowered);
  c.translate(h.x + 4, h.y - 4);
  c.rotate(-0.1 + 0.2 * lowered);
  c.scale(flat, 1);
  const W = SHEAF.w, H = SHEAF.h;
  // a step down from the lamp's cone: the paper is lit, but the cone stays the key
  const paper = paperTone(env, 0.56);
  const edge = withAlpha(env.mood.fg, 0.55);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(-W / 2 + 2, -H + 2, W, H);
  // the sheaf's stack: two sheets behind, each offset and a shade darker, their edges cut with a hairline
  for (const [dx, dy, k] of [[5.5, -4.5, 0.36], [2.8, -2.4, 0.2]] as const) {
    c.fillStyle = mixLab(paper, env.mood.set, k);
    c.fillRect(-W / 2 + dx, -H + dy, W, H);
    c.strokeStyle = edge;
    c.lineWidth = 0.6;
    c.strokeRect(-W / 2 + dx + 0.3, -H + dy + 0.3, W - 0.6, H - 0.6);
  }
  c.fillStyle = paper;
  c.fillRect(-W / 2, -H, W, H);
  c.strokeStyle = edge;
  c.lineWidth = 0.6;
  c.strokeRect(-W / 2 + 0.3, -H + 0.3, W - 0.6, H - 0.6);
  // faint typed lines (texture, about 20% ink), clearing away on "combinatorial" to make room for the tree
  const typed = 0.2 * (1 - sm((tq - (b.comb - 0.1)) / 0.5));
  if (typed > 0.005) {
    c.fillStyle = withAlpha(env.mood.ink, typed);
    for (let i = 0, y = -H + 9; y < -8; i++, y += 5.2) {
      const wl = W - 16 - (i % 4 === 3 ? 22 : 0) - 6 * ((i * 7) % 3);
      c.fillRect(-W / 2 + 8, y, wl, 1.5);
    }
  }
  // the explosion gloss: one dot, then branches splitting in two, faster each time, until the page is black
  // (it clears back to white paper from 7.0 to 7.3 s, before the A·B·C page)
  const clear = 1 - win(t, TREE_CLEAR[0], TREE_CLEAR[1]);
  if (flat > 0.3 && clear > 0.002) {
    c.globalAlpha *= clear;
    inkTree(c, env, tq - (b.explosion - 0.08), W, H, paper);
  }
  c.restore();
}

/**
 * The ink tree, a function of the seconds since the dot (s). Generation k starts at the sum of the earlier
 * generations' durations, each 0.8 × the one before (every split comes faster: the acceleration is felt);
 * eight generations over ≈ 1.2 s. It stops at about 70% ink — a rising wash under the branches — with the line
 * work still visible on top (black WITH branches, never a black card).
 */
const TREE_R = 0.8, TREE_LEVELS = 8, TREE_SPAN = 1.17;
const TREE_D0 = (TREE_SPAN * (1 - TREE_R)) / (1 - Math.pow(TREE_R, TREE_LEVELS));
const TREE_STARTS = Array.from({ length: TREE_LEVELS + 1 }, (_, k) => 0.08 + (TREE_D0 * (1 - Math.pow(TREE_R, k))) / (1 - TREE_R));
/** the gloss clears back to white paper over these shot seconds (before the A·B·C page) */
const TREE_CLEAR = [7.05, 7.35] as const;
/** he lowers the sheaf once the tree has cleared */
const LOWER_AT = (b: Beats) => Math.max(b.it, TREE_CLEAR[1] - 0.1);
/** the bottom of Papert's sentence on screen (stage px): the cards start 40 px under it */
const QUOTE_BOTTOM = 214;
type Seg = { x: number; y: number; a: number; len: number };
function inkTree(c: C, env: PaintEnv, s: number, W: number, H: number, paper: string) {
  if (s <= 0) return;
  const ink = mixLab(env.mood.ink, paper, 0.04);
  c.save();
  c.beginPath();
  c.rect(-W / 2 + 1.5, -H + 1.5, W - 3, H - 3);
  c.clip();
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineCap = 'round';
  // the crowding wash under the late generations (to ~0.62 ink, so with the strokes the page reads ~70% ink)
  const end = TREE_STARTS[TREE_LEVELS];
  const wash = 0.74 * sm((s - TREE_STARTS[3]) / (end - TREE_STARTS[3]));
  if (wash > 0.002) {
    const wg = c.createRadialGradient(0, -H * 0.55, 6, 0, -H * 0.5, H * 0.75);
    wg.addColorStop(0, withAlpha(ink, wash));
    wg.addColorStop(0.7, withAlpha(ink, wash * 0.9));
    wg.addColorStop(1, withAlpha(ink, wash * 0.55));
    c.fillStyle = wg;
    c.fillRect(-W / 2, -H, W, H);
    c.fillStyle = ink;
  }
  // the seed dot, near the foot of the page
  const root = { x: 0, y: -9 };
  c.beginPath();
  c.arc(root.x, root.y, 2.6 * sm(s / 0.08), 0, Math.PI * 2);
  c.fill();
  let tips: Seg[] = [{ x: root.x, y: root.y, a: -Math.PI / 2, len: 24 }];
  for (let k = 0; k < TREE_LEVELS; k++) {
    const g = clamp01((s - TREE_STARTS[k]) / (TREE_STARTS[k + 1] - TREE_STARTS[k]));
    if (g <= 0) break;
    const next: Seg[] = [];
    c.lineWidth = Math.max(0.9, 3.0 - k * 0.26);
    c.beginPath();
    tips.forEach((sg, i) => {
      const ex = sg.x + Math.cos(sg.a) * sg.len * g;
      const ey = sg.y + Math.sin(sg.a) * sg.len * g;
      c.moveTo(sg.x, sg.y);
      c.lineTo(ex, ey);
      if (g >= 1) {
        const spread = 0.42 + 0.16 * Math.sin(i * 1.7 + k * 2.3) + 0.03 * k;
        const shrink = 0.8 - 0.02 * k;
        next.push({ x: ex, y: ey, a: sg.a - spread, len: sg.len * shrink }, { x: ex, y: ey, a: sg.a + spread, len: sg.len * shrink });
      }
    });
    c.stroke();
    // a small ink bead at each fork of the early generations
    if (g >= 1 && k < 6) {
      for (let i = 0; i < next.length; i += 2) {
        c.beginPath();
        c.arc(next[i].x, next[i].y, Math.max(0.6, 1.6 - 0.2 * k), 0, Math.PI * 2);
        c.fill();
      }
    }
    tips = next;
    if (!tips.length) break;
  }
  c.restore();
}

/** a feathered dark radial plate behind Papert's sentence (alpha 0.35, ~40 px feather), so the italic holds its
 *  contrast over the lit, snowy windows through 'fell' */
function quotePlate(c: C, ink: string) {
  const cx = 728, cy = 134, rx = 360, ry = 104;
  c.save();
  c.translate(cx, cy);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx + 40);
  g.addColorStop(0, withAlpha(ink, 0.35));
  g.addColorStop(rx / (rx + 40), withAlpha(ink, 0.35));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  c.fillRect(-rx - 40, -rx - 40, 2 * (rx + 40), 2 * (rx + 40));
  c.restore();
}

/** L3: two silhouetted bench tiers stepping up behind the pit (set ink, lit along their tops), so the rake reads */
function benchTiers(c: C, r: { x: number; y: number; w: number; h: number }, env: PaintEnv) {
  const m = env.mood;
  const x1 = r.x + r.w + 20;
  const tiers = [
    { x0: 790, top: 498, fill: mixLab(env.fill('ink'), env.fill('set'), 0.35) },
    { x0: 900, top: 446, fill: mixLab(env.fill('ink'), env.fill('set'), 0.55) },
  ];
  // back to front: the higher tier first
  for (const tr of [...tiers].reverse()) {
    c.fillStyle = tr.fill;
    c.beginPath();
    c.moveTo(tr.x0 - 30, 760);
    c.lineTo(tr.x0 - 30, tr.top + 26);
    c.lineTo(tr.x0, tr.top);
    c.lineTo(x1, tr.top);
    c.lineTo(x1, 760);
    c.closePath();
    c.fill();
    // the bench backs: a rail with posts, then the riser's panel lines
    c.fillRect(tr.x0 + 6, tr.top - 22, x1 - tr.x0, 5);
    for (let x = tr.x0 + 14; x < x1; x += 64) c.fillRect(x, tr.top - 22, 4, 22);
    c.fillStyle = withAlpha(m.rim, 0.22);
    c.fillRect(tr.x0 + 6, tr.top - 22, x1 - tr.x0, 1.2);
    c.fillStyle = withAlpha(m.rim, 0.14);
    c.fillRect(tr.x0, tr.top, x1 - tr.x0, 1.1);
    c.strokeStyle = withAlpha(m.rim, 0.05);
    c.lineWidth = 1;
    for (let x = tr.x0 + 40; x < x1; x += 128) c.strokeRect(x, tr.top + 12, 108, 34);
  }
}
