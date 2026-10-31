/**
 * ch09-s01 — Lake Tahoe, December 2012, Room 731: a new candle's pool spreads across the floor as sealed bids
 * slide along a thread and Hinton stops the auction (serverCyan; 20.33 s; in: hard cut on ch08-s14's LED).
 *
 *   0           HARD MATCH CUT: ch08-s14 ends on one green status LED at frame centre; we cut on its blink to the
 *               cool glow of a laptop screen at the same point (it flares for two frames, then settles). The
 *               manila CHAPTER INDEX TAB 'The Gold Rush' drops from the top-left edge, holds 2.5 s, slides back up.
 *               The shot opens RACKED TO THE FOREGROUND CANDLE (LEARNED FEATURES, GIVEN DATA AND ARITHMETIC, lit 2012,
 *               no sleeve yet): sharp, huge, at frame left on its paper stage; the room behind it soft.
 *   HEAD-HOLD   (3.2 s before the first word, the cue sounds in the clear) the camera is already pushing in, slowly,
 *               and the candle's warm light swells into the cold room: a moving, composed opening, not a still
 *   'candle'    its flame steadies and brightens (the creed candle, named aloud for the first time); its label turns
 *               to the viewer for ~2.6 s (the film's candle naming card: LEARNED FEATURES, GIVEN DATA AND ARITHMETIC ·
 *               lit 2012 · still burning)
 *   'everything' its pool spreads outward across the whole floor, to the walls and under the bed; the focus racks
 *               from the candle (now soft) to the standing man (the payoff of the Edge of the Light: the man we met
 *               at the rim now stands at the centre of the light)
 *   'December'  LAKE TAHOE · DECEMBER 2012 · ROOM 731 (mono stamp, lower left)
 *   'account'   'as reported by Cade Metz' sets in above the stamp and stays (one reporter's account)
 *   'Hinton'    the pool brightens around his feet: he is standing, straight-backed, at a laptop
 *   'auctioned' four sealed bid envelopes slide in from the dark at frame right along a descending thread; their seals
 *               swell with each round; a typed tally on the dresser rolls upward in the screen's glow
 *   'three-person' a small tilt down: the laptop stands on an upturned wastebasket on the dresser (shown, not said)
 *   'company'   the earliest bidder's envelope drops off the thread into the dark; a second soon after; the two left
 *               slide nearer along the thread
 *   'forty-four' his hand lifts off the keys, palm down; the tally freezes at $44,000,000; the seals stop pulsing
 *   'Google'    he draws the nearest envelope off the thread and props it face up against the wastebasket under the
 *               screen: its typed address is one large word, GOOGLE (prop lettering); the last envelope drifts back
 *               up the thread into the dark. Hold on the still figure in the candle's pool.
 *
 * TEXT RULE: the index tab, the stamp and 'as reported by Cade Metz' only (plus the film-wide candle naming card); the
 * tally and GOOGLE are prop lettering, both at the 22 px cap-height floor.
 * Accent: the candle's warm light is the one saturated accent (the room and the screen are the mood's own cyan).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, toScreen, PUPPET_NEAR_BLACK, MOODS, createPuppet, defineShot, dustMotes, forestBand, hash1, legibleSize, loopPose, mixLab, placeStamp, pose, softPlate, withAlpha, withLife } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { cast } from '../cast';
import { indexTab } from '../sets/indexTab';
import { beliefCandle, candleFlame, namedLabel } from '../sets/beliefCandle';
import { shelfStateAt } from '../sets/studyState';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
const ID = 'ch09-s01';

// ------------------------------------------------------------------------------------------------ the man
/** Hinton (2000s–2020s puppet) with empty hands: the laptop is on the wastebasket, not in his hand */
const HINTON = createPuppet({ ...cast.hinton.spec, id: 'hinton-ch09-s01', prop: 'none', details: ['lapel'] });
const ST = { hipF: 5, kneeF: -4, hipB: -4, kneeB: -1 };
/** standing straight-backed, both hands on the keys */
const TYPE: Pose = pose({ ...ST, torso: 0, neck: 10, head: 8, shoulderF: 30, elbowF: 62, wristF: -10, shoulderB: 22, elbowB: 62, wristB: -8 }, { handF: 'typing', handB: 'typing' });
/** 'forty-four': the near hand lifts off the keys, palm down; the head comes up a touch */
const LIFT: Pose = pose({ ...ST, torso: -1, neck: 8, head: 0, shoulderF: 52, elbowF: 22, wristF: 26, shoulderB: 22, elbowB: 62, wristB: -8 }, { handF: 'palmDown', handB: 'typing' });
/** reaching up the thread for the nearest envelope */
const REACH: Pose = pose({ ...ST, torso: 4, neck: 2, head: -10, shoulderF: 125, elbowF: 10, wristF: 0, shoulderB: 18, elbowB: 58, wristB: -6 }, { handF: 'pinch', handB: 'relaxed' });
/** setting it down, face up, against the wastebasket under the screen */
const LAY: Pose = pose({ ...ST, hipF: 12, hipB: 4, torso: 30, neck: -4, head: 8, shoulderF: 58, elbowF: 6, wristF: -22, shoulderB: 10, elbowB: 50, wristB: -4 }, { handF: 'pinch', handB: 'relaxed' });
/** the hand comes off it and rests on the dresser's edge; he looks down at it */
const REST: Pose = pose({ ...ST, torso: 4, neck: 6, head: 10, shoulderF: 26, elbowF: 40, wristF: -18, shoulderB: 16, elbowB: 54, wristB: -4 }, { handF: 'palmDown', handB: 'relaxed' });

const FLOOR = 640;
const FX = 560;
const at = (p: Pose) => HINTON.anchor({ x: FX, y: FLOOR, facing: 'right', pose: p }, 'handF');
const KEYS = at(TYPE);
/** the nearest slot on the thread is exactly where his reaching hand closes */
const S1 = at(REACH);
const LAYP = at(LAY);

// ------------------------------------------------------------------------------------------------ the set (L4 world)
const DRESSER = { x0: 600, x1: 1084, top: 522 };
const BASKET = { cx: KEYS.x + 6, top: KEYS.y + 4, bottom: DRESSER.top, wTop: 62, wBot: 80 };
const LAPTOP = { x0: KEYS.x - 26, x1: KEYS.x + 34, y: BASKET.top - 0.5 };
/** the screen (inner face of the lid, facing him): its glow centre */
const SCREEN = { x: LAPTOP.x1 - 8, y: LAPTOP.y - 26 };
/** the propped envelope (GOOGLE): leaning against the wastebasket's front, under the screen, a little left of it */
const ENV_W = 92, ENV_H = 56;
/** the chosen envelope, laid FLAT and face up on the dresser top in the screen's glow (foreshortened: we look down
 *  on the dresser after the tilt). Its typed word is ≥ 40 px at 1080p. */
const LAID_S = 1.8;
const LAID_FS = 0.66; // vertical foreshortening of a sheet lying on the top
/** the far edge is drawn narrower than the near edge (perspective: it lies flat, it is not propped) */
const LAID_TOP = 0.84;
/** round 1: set ~30 stage px further left (its near corner tucked against the wastebasket's foot) and a touch lower,
 *  so it never touches the tally card (a clear ≥ 30 px gap at 1080p between the two props) */
const LAID = { x: Math.max(LAYP.x + (ENV_W * LAID_S) / 2 - 10, BASKET.cx + BASKET.wBot / 2 + 8 + (ENV_W * LAID_S) / 2) - 30, y: DRESSER.top - (ENV_H * LAID_S * LAID_FS) / 2 + 6, rot: 0 };
/** the typed tally card standing at the back of the dresser top, at its right end */
const TALLY = { x: 1004, y: DRESSER.top - 10, w: 150, h: 50 };

/** the descending thread: from its knot just past the nearest slot, up and out to the dark at frame right */
const KNOT = { x: S1.x - 16, y: S1.y + 4 };
const FAR = { x: 1520, y: 130 };
const threadY = (x: number) => {
  const u = (x - KNOT.x) / (FAR.x - KNOT.x);
  return lerp(KNOT.y, FAR.y, u) + 22 * Math.sin(Math.PI * clamp01(u)); // a little sag
};
/** slot k's grip point (k = 0 nearest) */
const slotX = (k: number) => S1.x + k * 104;
const slotP = (x: number) => ({ x, y: threadY(x) });

// ------------------------------------------------------------------------------------------------ the candle (L5)
const CANDLE_VIEW = shelfStateAt(ID, 'end').find((v) => v.id === 'learned')!;
/** round 1: smaller again and raised, so its paper stage's dark front face is the type ground for the lower-left
 *  stamp and the 'as reported by Cade Metz' label, and its flame stays clear of the index tab */
const CANDLE = { x: 226, y: 664, s: 1.62 };
const CFLAME = candleFlame({ x: CANDLE.x, y: CANDLE.y, view: CANDLE_VIEW, s: CANDLE.s });
const WARM = MOODS.candleAmber;

// ------------------------------------------------------------------------------------------------ cameras
/** t = 0: the screen glow exactly where ch08-s14's LED sat (frame centre) */
const C0: Camera3 = { x: SCREEN.x, y: SCREEN.y + 2, z: -34, lens: 1 };
const C1: Camera3 = { x: SCREEN.x - 24, y: SCREEN.y - 16, z: 46, lens: 1 };
/** the small tilt down on 'three-person', and a slow push on through the hold (≈ 6% over the shot) */
const C2: Camera3 = { x: SCREEN.x - 14, y: SCREEN.y + 6, z: 72, lens: 1 };
/** the tilt on 'three-person': 9% of frame height, eased over 1.0 s (round 1: the reveal must be felt) */
const TILT = 0.09 * 720;

/** blur (1080p px) of the action plane / near plane while racked to the candle, and after */
const RACK = { L4: 6, L3: 4.5, L2: 4.5, L5: 0 };
const REST_BLUR = { L4: 0, L3: LAYERS.L3.blur, L2: LAYERS.L2.blur, L5: 3.6 };

interface B {
  D: number;
  candle: number;
  spread: number;
  rack0: number;
  rack1: number;
  december: number;
  account: number;
  tall: number;
  auction: number;
  three: number;
  drop1: number;
  drop2: number;
  stop: number;
  chose: number;
  reach0: number;
  grab: number;
  laid: number;
  release: number;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const spread = T.beat('creedSpread');
    const chose = T.beat('choseGoogle');
    const google = T.word('L0902', 'Google');
    const b: B = {
      D,
      candle: T.beat('creedCandle'),
      spread,
      rack0: spread + 0.15,
      rack1: spread + 1.0,
      december: T.beat('roomStamp'),
      account: T.beat('byAccount'),
      tall: T.beat('standReveal'),
      auction: T.beat('envelopesIn'),
      three: T.beat('wastebasket'),
      drop1: T.beat('dropOuts'),
      drop2: T.beat('dropOuts') + 0.75,
      stop: T.beat('stop'),
      chose,
      // he reaches on 'and', closes on 'chose', and has it face up on the dresser as 'Google' ends
      reach0: T.word('L0902', 'and') - 0.1,
      grab: T.word('L0902', 'chose') + 0.05,
      // face up on the dresser in the screen's glow by ~15.5 s, so GOOGLE reads with the word, not after it
      laid: google + 0.33,
      release: google + 0.75,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    const cam = camAt(b, t);
    f.camera(cam);
    // focus: racked to the candle until 'everything', then to the man over ~0.85 s
    const r = win(t, b.rack0, b.rack1);
    const blur = (k: keyof typeof RACK) => lerp(RACK[k], REST_BLUR[k], r);
    const spec = (base: LayerSpec, id: string, bl: number): LayerSpec => ({ ...base, id, blur: bl });

    const pool = poolAt(b, t);
    const screenK = screenAt(t);
    // the snow-light in the window rises with the candle's light through the head-hold (the opening's light change)
    f.backlight({ sunX: 560, sunY: 330, sunRadius: 420, intensity: 0.42 * (0.55 + 0.45 * sm(t / 3.1)) });
    // L1: black pines against a band of snow-light (seen only through the window)
    f.layer('L1', (c, env) => pines(f, c, env));
    f.layer(spec(LAYERS.L2, 'L2r', blur('L2')), (c, env) => backWall(c, env));
    f.fog({ yCenter: 0.62 * 720, height: 0.36 * 720, alpha: 0.2, drift: 5 });
    f.layer(spec(LAYERS.L3, 'L3r', blur('L3')), (c, env) => {
      bed(c, env, pool);
      wardrobe(c, env, pool);
    });
    // fog B (round 1): ~40% thinner and lifted, so the floor at his feet stays crisp in the pool
    f.fog({ yCenter: 0.66 * 720, height: 0.16 * 720, alpha: 0.06, drift: 8 });
    // the screen's light sits behind the figure (before the action plane, so its halo never washes him)
    f.practical({ x: SCREEN.x - 4, y: SCREEN.y, kind: 'screen', seed: 931, intensity: 0.62 * screenK, radius: 92 });
    const sharp = r >= 0.999;
    // the set on the action plane (floor + its candle pool, dresser, bin, laptop, tally, thread, bids): rimmed on its
    // TOP edges only; the man is painted after the rim so no set rim traces his contour (he carries his own edgeRim)
    const act = (c: C, env: PaintEnv) => actionPlane(c, env, b, t, pool, screenK);
    const man = (c: C, env: PaintEnv) => manPlane(c, env, b, t);
    if (sharp) f.layer('L4', act);
    else f.layer(spec(LAYERS.L4, 'L4r', blur('L4')), act);
    if (sharp) f.rim({ x: 0, y: -1 });
    if (sharp) f.layer('L4', man);
    else f.layer(spec(LAYERS.L4, 'L4m', blur('L4')), man);
    // the near plane: the creed candle on its paper stage, huge and (after the rack) soft
    f.layer(spec(LAYERS.L5, 'L5r', blur('L5')), (c, env) => creedCandle(c, env, b, t));
    candleLight(f, b, t);
    // ---- type (screen-locked)
    const tenv = { t, mood: f.mood };
    // the index tab, set ×1.18 about its top edge (its title at ≥ 22 px cap height on 1080p; it hangs ~16 px lower)
    // and moved in from the left edge so its corner stays clear of the creed candle's flame
    f.c.save();
    f.c.translate(TAB_X, 0);
    f.c.scale(1.18, 1.18);
    f.c.translate(-TAB_X, 0);
    indexTab(f.c, { title: 'The Gold Rush', at: 0.1, hold: 2.5, x: TAB_X }, tenv);
    f.c.restore();
    // lower left, as scripted: both lines sit on the dark front face of the candle's paper stage
    placeStamp(f.c, { place: 'Lake Tahoe', date: 'December 2012 · Room 731', year: 2012, at: b.december - 0.05, x: 40, y: 676 }, tenv);
    reportedBy(f, b, t);
  },
});

// ================================================================================================ camera + light
function camAt(b: B, t: number): Camera3 {
  // the cut lands on the glow already moving: one slow push from the first frame (eased out, so the head-hold before
  // the first word is a composed move, not a still), then the tilt down on 'three-person'
  const u1 = Math.sin((Math.PI / 2) * Math.min(1, Math.max(0, t / b.three)));
  const a = { x: lerp(C0.x, C1.x, u1), y: lerp(C0.y, C1.y, u1), z: lerp(C0.z, C1.z, u1) };
  const tilt = sm((t - (b.three - 0.1)) / 1.0);
  const u3 = sm((t - b.three) / (b.D - b.three));
  return { x: lerp(a.x, C2.x, u3), y: a.y + TILT * tilt, z: lerp(a.z, C2.z, u3), lens: 1 };
}

/** the screen: a two-frame flare on the cut (ch08-s14's LED blink), then steady */
function screenAt(t: number): number {
  const flare = t < 0.125 ? 1.6 : 1 + 0.6 * Math.exp(-(t - 0.125) * 9);
  return flare;
}

interface PoolState {
  /** pool centre (floor, world) */
  x: number;
  y: number;
  /** half-depth of the ellipse on the floor (perspective) */
  ry: number;
  /** half-width of the pool on the floor */
  rx: number;
  /** brightness of the pool (0..1) */
  k: number;
  /** extra light at his feet ('tall') */
  feet: number;
  /** 0..1 how far the spread has reached (walls, under the bed) */
  reach: number;
}
/** the head-hold's light change: the candle's warm light swells into the cold room before the first word */
const wakeAt = (t: number) => 0.3 + 0.7 * sm(t / 3.1);
function poolAt(b: B, t: number): PoolState {
  const steady = win(t, b.candle - 0.1, b.candle + 0.6) * 0.6 + 0.4 * (wakeAt(t) - 0.3) / 0.7;
  // round 1: an elliptical pool that GROWS FROM THE CANDLE'S BASE across the floor over 1.5 s from 'everything',
  // reaching under the bed (left) and the wardrobe's foot (right)
  const t0 = b.spread - 0.15;
  const spread = sm((t - t0) / 1.5);
  // the surge: brightest as it reaches the walls, then it settles (room left for 'tall')
  const surge = t < t0 ? 0 : spread * (0.15 + 0.6 * Math.exp(-Math.max(0, t - t0 - 1.5) * 1.2));
  const feet = 0.7 * win(t, b.tall - 0.1, b.tall + 0.5) * (0.85 + 0.15 * Math.exp(-Math.max(0, t - b.tall - 0.5) * 0.8));
  return {
    x: lerp(CANDLE.x + 30, FX - 40, spread),
    y: lerp(CANDLE.y + 8, 650, spread),
    rx: lerp(150, 1000, spread),
    ry: lerp(20, 78, spread),
    k: (0.45 + 0.35 * steady) * (1 + surge),
    feet,
    reach: clamp01((spread - 0.55) / 0.45),
  };
}

// ================================================================================================ L1 / L2 / L3
const WIN = { x: 360, y: 118, w: 404, h: 352 };
function pines(f: Frame, c: C, env: PaintEnv) {
  // a band of snow-light low in the window, black pines against it
  const draw = f.cached(`${ID}/pines/${env.mood.id}`, 1100, 520, (cc) => {
    cc.translate(-80, -40);
    const m = env.mood;
    const g = cc.createLinearGradient(0, 40, 0, 560);
    g.addColorStop(0, m.sky[0]);
    g.addColorStop(0.5, m.sky[1]);
    g.addColorStop(0.78, mixLab(m.sky[3], m.core, 0.25));
    g.addColorStop(0.86, m.sky[2]);
    g.addColorStop(1, m.sky[1]);
    cc.fillStyle = g;
    cc.fillRect(80, 40, 1100, 520);
    // the snow-light band: a pale field at the foot of the trees
    cc.fillStyle = withAlpha(mixLab(m.sky[3], m.core, 0.4), 0.55);
    cc.fillRect(80, 448, 1100, 30);
    // night: the upper sky sinks toward the dark (the band of snow-light stays the brightest thing in the glass)
    const night = cc.createLinearGradient(0, 40, 0, 470);
    night.addColorStop(0, withAlpha(m.fg, 0.62));
    night.addColorStop(0.7, withAlpha(m.fg, 0.3));
    night.addColorStop(1, withAlpha(m.fg, 0.05));
    cc.fillStyle = night;
    cc.fillRect(80, 40, 1100, 430);
    forestBand(cc, { x0: 60, x1: 1200, y: 452, h: 190, kind: 'pine', density: 1.5, seed: 931, snow: 0.25, ground: 0, role: 'set' }, { ...env, fill: (r) => (r === 'set' ? mixLab(m.fg, m.set, 0.25) : env.fill(r)) });
    forestBand(cc, { x0: 60, x1: 1200, y: 470, h: 250, kind: 'pine', density: 0.7, seed: 937, snow: 0.15, ground: 100, role: 'set' }, { ...env, fill: (r) => (r === 'set' ? m.fg : env.fill(r)) });
  });
  draw(c, 80, 40);
}

/** the back wall: dark hotel panelling with the window as a HOLE (the pines show through), curtains, a picture rail */
function backWall(c: C, env: PaintEnv) {
  const m = env.mood;
  const wall = mixLab(env.fill('set'), m.fg, 0.38);
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-300, -200, 1900, 1000);
  c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
  c.fill('evenodd');
  // window frame + mullions (ink), a deep sill
  c.fillStyle = env.fill('ink');
  c.fillRect(WIN.x - 10, WIN.y - 10, WIN.w + 20, 10);
  c.fillRect(WIN.x - 10, WIN.y, 10, WIN.h);
  c.fillRect(WIN.x + WIN.w, WIN.y, 10, WIN.h);
  c.fillRect(WIN.x + WIN.w / 2 - 4, WIN.y, 8, WIN.h);
  c.fillRect(WIN.x, WIN.y + WIN.h * 0.36 - 3, WIN.w, 6);
  c.fillRect(WIN.x - 24, WIN.y + WIN.h, WIN.w + 48, 14);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(WIN.x - 24, WIN.y + WIN.h, WIN.w + 48, 1.3);
  // heavy curtains drawn back to either side (flat cut-outs with a few fold lines)
  for (const [x0, dir] of [[WIN.x - 70, 1], [WIN.x + WIN.w + 6, -1]] as const) {
    c.fillStyle = env.fill('ink');
    c.beginPath();
    c.moveTo(x0, WIN.y - 30);
    c.lineTo(x0 + 64, WIN.y - 30);
    c.quadraticCurveTo(x0 + 64 - dir * 8, WIN.y + 180, x0 + 32 + dir * 24, WIN.y + 330);
    c.lineTo(x0 + 70, 600);
    c.lineTo(x0 - 6, 600);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.08);
    c.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      c.beginPath();
      c.moveTo(x0 + k * 16, WIN.y - 26);
      c.quadraticCurveTo(x0 + k * 16 - dir * 6, WIN.y + 220, x0 + k * 16 + dir * 4, 596);
      c.stroke();
    }
  }
  // a picture rail and a skirting line; a door frame far right (Room 731's door, in the dark)
  c.fillStyle = withAlpha(m.fg, 0.55);
  c.fillRect(-300, 70, 1900, 7);
  c.fillRect(-300, 586, 1900, 14);
  c.strokeStyle = withAlpha(m.rim, 0.07);
  c.lineWidth = 1.2;
  c.strokeRect(1060, 150, 150, 440);
  // the floor beyond the wall line (a dark plane)
  c.fillStyle = mixLab(wall, m.fg, 0.4);
  c.fillRect(-300, 600, 1900, 400);
}

/** the hotel bed he never sits on: one flat dark shape at frame left (it takes the spread pool underneath it) */
function bed(c: C, env: PaintEnv, pool: PoolState) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // headboard, mattress block, a pillow hump, the foot falling to the floor
  // one flat dark shape: headboard, mattress block, pillow hump, and four short legs with a SLOT of floor under it
  c.beginPath();
  c.moveTo(10, 604);
  c.lineTo(10, 404);
  c.quadraticCurveTo(40, 388, 70, 404);
  c.lineTo(70, 500);
  c.quadraticCurveTo(90, 486, 130, 492);
  c.lineTo(390, 498);
  c.quadraticCurveTo(402, 500, 402, 512);
  c.lineTo(402, 572);
  c.lineTo(392, 572);
  c.lineTo(392, 604);
  c.lineTo(378, 604);
  c.lineTo(378, 572);
  c.lineTo(84, 572);
  c.lineTo(84, 604);
  c.closePath();
  c.fill();
  // the slot under the bed: dark, until the spreading pool reaches it and it fills with warm light from the floor
  const k = pool.reach;
  c.fillStyle = mixLab(env.fill('ink'), env.mood.fg, 0.3);
  c.fillRect(84, 572, 294, 32);
  if (k > 0) {
    const g = c.createLinearGradient(0, 604, 0, 572);
    g.addColorStop(0, withAlpha(mixLab(WARM.halo, WARM.core, 0.25), 0.62 * k));
    g.addColorStop(0.6, withAlpha(WARM.halo, 0.22 * k));
    g.addColorStop(1, withAlpha(WARM.halo, 0));
    c.fillStyle = g;
    c.fillRect(84, 572, 294, 32);
  }
  // rim on its top edge only
  c.fillStyle = withAlpha(env.mood.rim, 0.1);
  c.fillRect(70, 498, 330, 1.2);
}

/** the right third: a tall dark hotel wardrobe (an L3 mass) the bid envelopes come out of, so they enter from the
 *  dark and not from flat wall */
function wardrobe(c: C, env: PaintEnv, pool: PoolState) {
  const m = env.mood;
  const x0 = 1060, x1 = 1520, top = 128, bot = 600;
  c.fillStyle = mixLab(env.fill('ink'), m.fg, 0.55);
  c.beginPath();
  c.moveTo(x0 - 10, top);
  c.lineTo(x1, top);
  c.lineTo(x1, bot);
  c.lineTo(x0, bot);
  c.lineTo(x0, top + 14);
  c.lineTo(x0 - 10, top + 14);
  c.closePath();
  c.fill();
  // a crown moulding and two tall door panels (cut-lines, faint), one door ajar: a sliver of deeper dark
  c.fillStyle = withAlpha(m.rim, 0.16);
  c.fillRect(x0 - 10, top - 0.6, x1 - x0 + 10, 1.2);
  // its screen-facing left edge catches a hair of the laptop's light
  c.fillStyle = withAlpha(m.rim, 0.14);
  c.fillRect(x0 - 0.6, top + 14, 1.2, bot - top - 14);
  c.strokeStyle = withAlpha(m.rim, 0.07);
  c.lineWidth = 1.2;
  c.strokeRect(x0 + 18, top + 34, 150, 420);
  c.strokeRect(x0 + 186, top + 34, 150, 420);
  c.fillStyle = withAlpha(m.fg, 0.9);
  c.fillRect(x0 + 168, top + 30, 18, 428);
  // its foot: the spreading pool reaches it last (a warm line along the plinth)
  if (pool.reach > 0) {
    const g = c.createLinearGradient(0, bot, 0, bot - 26);
    g.addColorStop(0, withAlpha(mixLab(WARM.halo, WARM.core, 0.2), 0.42 * pool.reach));
    g.addColorStop(1, withAlpha(WARM.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0 - 10, bot - 26, 260, 26);
  }
}

// ================================================================================================ the action plane
function actionPlane(c: C, env: PaintEnv, b: B, t: number, pool: PoolState, screenK: number) {
  const tq = tq12(t);
  const m = env.mood;
  // the floor of the room: a perspective plane (seams running to a vanishing point behind the window) that the
  // candle's pool lights
  // (its far edge feathers in over 14 px, so the top-edge set rim never draws a bright line along the skirting)
  const fl = mixLab(env.fill('set'), m.fg, 0.55);
  const fg = c.createLinearGradient(0, 592, 0, 606);
  fg.addColorStop(0, withAlpha(fl, 0));
  fg.addColorStop(1, fl);
  c.fillStyle = fg;
  c.fillRect(-300, 592, 1900, 14);
  c.fillStyle = fl;
  c.fillRect(-300, 606, 1900, 400);
  floorSeams(c, env);
  poolLight(c, pool);
  dresser(c, env);
  wastebasket(c, env);
  laptopSide(c, env, screenK);
  tally(c, env, b, t);
  thread(c, env, win(t, b.auction - 0.4, b.auction + 0.1));
  envelopes(c, env, b, t);
  void tq;
}

/** the man (the shot's one sharp plane, the darkest shape in frame), what he carries and lays down, the motes */
function manPlane(c: C, env: PaintEnv, b: B, t: number) {
  const tq = tq12(t);
  const p = withLife(manPose(b, tq), tq, 931, 0.8);
  // rim on the screen/window side only (up and to his right: the laptop and the snow-light); no back or bottom rim,
  // and his far-side cut-lines fade to nothing
  HINTON.draw(c, { x: FX, y: FLOOR, facing: 'right', pose: p, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.45, floor: 0 }, edgeRim: { x: 1, y: -0.45, px: 1.4, alpha: 0.65 } }, env);
  carried(c, env, b, t, p);
  laid(c, env, b, t);
  dustMotes(c, { area: { x: SCREEN.x - 300, y: SCREEN.y - 260, w: 640, h: 420 }, count: 22, drift: { x: -3, y: -2 }, brightness: 0.4, salt: 931 }, env);
}

/** the floor seams: a perspective plane, so the pool reads as light lying on a floor and not as a band of haze */
const VP = { x: 600, y: 360 };
function floorSeams(c: C, env: PaintEnv) {
  c.save();
  c.beginPath();
  c.rect(-300, 600, 1900, 400);
  c.clip();
  c.strokeStyle = withAlpha(env.mood.rim, 0.05);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = -16; i <= 16; i++) {
    const x600 = VP.x + i * 46;
    const k = (1000 - VP.y) / (600 - VP.y);
    c.moveTo(x600, 600);
    c.lineTo(VP.x + (x600 - VP.x) * k, 1000);
  }
  // a few cross seams, closer together toward the back (foreshortened)
  for (const y of [612, 630, 656, 692, 742]) {
    c.moveTo(-300, y);
    c.lineTo(1600, y);
  }
  c.stroke();
  c.restore();
}

/** pose by beat, on twos: type → lift (forty-four) → reach (chose) → lay (Google) → rest */
function manPose(b: B, tq: number): Pose {
  if (tq < b.stop - 0.1) return loopPose('type', TYPE, tq);
  if (tq < b.reach0) return blendTo(loopPose('type', TYPE, tq), LIFT, sm((tq - (b.stop - 0.1)) / 0.4));
  if (tq < b.grab) return blendTo(LIFT, REACH, sm((tq - b.reach0) / (b.grab - b.reach0)));
  if (tq < b.laid) return blendTo(REACH, LAY, sm((tq - b.grab) / (b.laid - b.grab)));
  if (tq < b.release) return LAY;
  return blendTo(LAY, REST, sm((tq - b.release) / 0.5));
}
function blendTo(a: Pose, c: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return c;
  const angles: Pose['angles'] = {};
  for (const k of new Set([...Object.keys(a.angles), ...Object.keys(c.angles)]) as Set<keyof Pose['angles']>) angles[k] = lerp(a.angles[k] ?? 0, c.angles[k] ?? 0, u);
  return { ...c, angles, handF: u < 0.5 ? a.handF : c.handF, handB: u < 0.5 ? a.handB : c.handB };
}

function dresser(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  const { x0, x1, top } = DRESSER;
  c.fillStyle = ink;
  c.fillRect(x0, top, x1 - x0, 7);
  c.fillRect(x0 + 6, top + 7, x1 - x0 - 12, FLOOR - top - 14);
  c.fillRect(x0 + 10, FLOOR - 8, 10, 8);
  c.fillRect(x1 - 20, FLOOR - 8, 10, 8);
  // round 1: one flat dark cut shape, no drawer seams or panel lines; only its top edge catches the screen's light
  c.fillStyle = withAlpha(env.mood.rim, 0.36);
  c.fillRect(x0, top - 0.6, x1 - x0, 1.3);
}

function wastebasket(c: C, env: PaintEnv) {
  const B0 = BASKET;
  const m = env.mood;
  // the bin is woven/slatted metal, one value LIGHTER than the dresser (so the eye reads two objects), its flared
  // rim lip at the bottom (it is upside down), its small base plate on top under the laptop
  const body = mixLab(env.fill('ink'), env.fill('set'), 0.32);
  const yTop = B0.top + 3, yLip = B0.bottom - 7;
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(B0.cx - B0.wTop / 2, yTop);
  c.lineTo(B0.cx + B0.wTop / 2, yTop);
  c.lineTo(B0.cx + B0.wBot / 2, yLip);
  c.lineTo(B0.cx - B0.wBot / 2, yLip);
  c.closePath();
  c.fill();
  // vertical slats: dark gaps between ribs (the slats taper with the bin)
  const n = 9;
  c.fillStyle = withAlpha(env.fill('ink'), 0.95);
  for (let i = 1; i < n; i++) {
    const u = i / n - 0.5;
    const xt = B0.cx + u * B0.wTop, xb = B0.cx + u * B0.wBot;
    c.beginPath();
    c.moveTo(xt - 1.1, yTop + 5);
    c.lineTo(xt + 1.1, yTop + 5);
    c.lineTo(xb + 1.4, yLip - 4);
    c.lineTo(xb - 1.4, yLip - 4);
    c.closePath();
    c.fill();
  }
  // a band near the top and the base plate (now the bin's top, under the laptop)
  c.fillStyle = env.fill('ink');
  c.fillRect(B0.cx - B0.wTop / 2 - 1, B0.top - 1, B0.wTop + 2, 5);
  c.fillRect(B0.cx - (B0.wTop + 6) / 2, yTop + 12, B0.wTop + 6, 2.2);
  // the rolled rim lip, flared, sitting on the dresser: catches the screen's light on its top
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(B0.cx - B0.wBot / 2 - 1, yLip);
  c.lineTo(B0.cx + B0.wBot / 2 + 1, yLip);
  c.lineTo(B0.cx + B0.wBot / 2 + 5, B0.bottom);
  c.lineTo(B0.cx - B0.wBot / 2 - 5, B0.bottom);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
  c.fillRect(B0.cx - B0.wBot / 2 - 2, yLip - 0.6, B0.wBot + 4, 1.3);
  // the screen-facing (right) edge of the bin catches a sliver of cool light
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.4);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(B0.cx + B0.wTop / 2 - 0.5, yTop + 2);
  c.lineTo(B0.cx + B0.wBot / 2 - 0.5, yLip - 1);
  c.stroke();
}

/** the laptop, side-on: a thin base on the basket, the lid up with its screen facing him (the light falls his way) */
function laptopSide(c: C, env: PaintEnv, k: number) {
  const L = LAPTOP;
  c.fillStyle = env.fill('ink');
  c.fillRect(L.x0, L.y - 4, L.x1 - L.x0, 4);
  c.save();
  c.translate(L.x1 - 1, L.y - 3);
  c.rotate(-Math.PI / 2 + 0.2);
  c.fillRect(0, -2.4, 54, 3.2);
  c.restore();
  // the screen face catches its own light: a pale sliver on the lid's inner (near) face
  c.save();
  c.translate(L.x1 - 1, L.y - 3);
  c.rotate(-Math.PI / 2 + 0.2);
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), Math.min(1, 0.75 * k));
  c.fillRect(4, -3.6, 46, 1.6);
  c.restore();
  // its light on the keys and on his hands' side
  glow(c, L.x1 - 14, L.y - 22, 70, env.mood.halo, 0.22 * k);
}

/** the typed tally on the dresser: rolls upward in the screen's glow from 'auctioned', freezes at $44,000,000 */
function tally(c: C, env: PaintEnv, b: B, t: number) {
  const a = win(t, b.auction - 0.2, b.auction + 0.4);
  const T0 = TALLY;
  const m = env.mood;
  // a small card on a stand (it is there from the start, blank until the bidding opens)
  const paper = mixLab(mixLab(m.setHaze, m.rim, 0.35), m.halo, 0.15);
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(T0.x - T0.w / 2 + 3, T0.y - T0.h + 2, T0.w, T0.h - 2);
  c.fillStyle = paper;
  c.fillRect(T0.x - T0.w / 2, T0.y - T0.h, T0.w, T0.h - 3);
  c.fillStyle = env.fill('ink');
  c.fillRect(T0.x - T0.w / 2 + 8, T0.y - 4, T0.w - 16, 4);
  if (a <= 0) return;
  // the value: an odometer whose wheels SPIN while the bidding runs (every digit a vertical motion smear, so no
  // intermediate figure is ever crisp or reads as a real bid); the wheels lock on 'forty-four' at $44,000,000
  const tq = tq12(t);
  const frozen = tq >= b.stop;
  const ink = mixLab(m.ink, paper, 0.12);
  c.save();
  c.globalAlpha *= a;
  // the frozen figure must read: at the 22 px cap-height floor under this camera (≥ 19 px, the card's own size)
  const fs = legibleSize(c, `500 19px ${FONT.mono}`, 19) * 1.04;
  c.font = `500 ${fs}px ${FONT.mono}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillStyle = ink;
  const full = '$44,000,000';
  const x0 = T0.x - c.measureText(full).width / 2;
  const yc = T0.y - T0.h / 2 - 1;
  if (frozen) c.fillText(full, x0, yc);
  else {
    const tick = Math.floor(tq * 12);
    let x = x0;
    for (let i = 0; i < full.length; i++) {
      const ch = full[i];
      const cw = c.measureText(ch).width;
      if (ch === '$' || ch === ',') c.fillText(ch, x, yc);
      else {
        // a spinning wheel: several faint glyphs smeared along the travel, none of them legible
        c.save();
        c.beginPath();
        c.rect(x - 1, yc - fs * 0.58, cw + 2, fs * 1.16);
        c.clip();
        const ph = hash1(tick * 7 + i, 41) * 0.5 + 0.5;
        for (let k = -3; k <= 3; k++) {
          c.globalAlpha = a * 0.16 * (1 - Math.abs(k) / 4.2);
          c.fillText(String(Math.floor(hash1(tick * 31 + i * 5 + k, 7) * 0.5 * 20 + 10) % 10), x, yc + (k + ph) * fs * 0.34);
        }
        c.restore();
      }
      x += cw;
    }
  }
  // the freeze: a typed underline strikes once
  if (frozen) {
    const k = win(t, b.stop, b.stop + 0.25);
    const uw = c.measureText(full).width + 4;
    c.fillRect(T0.x - uw / 2, yc + fs * 0.52, uw * k, 1.1);
  }
  c.restore();
}

function thread(c: C, env: PaintEnv, a: number) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.setHaze, 0.3), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let x = KNOT.x; x <= FAR.x; x += 20) {
    const y = threadY(x);
    if (x === KNOT.x) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  // the knot at its near end
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(KNOT.x, KNOT.y, 2.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the envelopes
interface EnvState {
  x: number;
  y: number;
  rot: number;
  alpha: number;
  hidden?: boolean;
}
/** where each of the four envelopes is: id 0 drops first (the earliest bidder, nearest), id 2 second; ids 1 and 3
 *  slide one slot nearer; id 1 is drawn off the thread on 'Google', id 3 drifts back up into the dark */
function envState(id: number, b: B, tq: number): EnvState {
  // arrival: from off frame right, staggered, easing into slots on the thread (on twos)
  const arrive = b.auction + 0.06 + id * 0.16;
  const slot0 = id;
  const u = sm((tq - arrive) / 0.85);
  let x = lerp(FAR.x + 120 + id * 60, slotX(slot0), u);
  if (tq < arrive) return { x: 0, y: 0, rot: 0, alpha: 0, hidden: true };
  const swing = (t0: number) => 0.08 * Math.exp(-Math.max(0, tq - t0) * 3) * Math.sin(Math.max(0, tq - t0) * 11);
  let rot = swing(arrive + 0.85) - 0.12 * (1 - u);
  // the drop-outs
  const drop = id === 0 ? b.drop1 : id === 2 ? b.drop2 : null;
  // round 1: the release SNAPS on the beat: a 0.1 s clip pop (a jerk up and a sharp kick of the corner as the clip
  // lets go), then a fall with ease-in (gravity), so the drop is plainly under way ~0.15 s after the word
  if (drop !== null && tq >= drop - 0.04) {
    const d = tq - (drop - 0.04);
    const p = slotP(slotX(slot0));
    const dir = id === 0 ? -1 : 1;
    const pop = sm(d / 0.1);
    const fall = Math.max(0, d - 0.1);
    return {
      x: p.x + dir * 10 * pop + 18 * fall,
      y: p.y - 5 * Math.sin(Math.PI * Math.min(1, d / 0.1)) + 900 * fall * fall,
      rot: rot + dir * (0.32 * pop + 2.2 * fall),
      alpha: 1 - sm(fall / 0.75),
    };
  }
  // the two left slide nearer (id 1 → slot 0, id 3 → slot 1) once the second has dropped
  if (id === 1 || id === 3) {
    const s = sm((tq - b.drop2 - 0.25) / 0.8);
    x = lerp(x, slotX(id === 1 ? 0 : 1), s);
    rot += swing(b.drop2 + 1.05);
  }
  // the last envelope drifts back up the thread into the dark
  if (id === 3 && tq > b.laid) {
    const d = sm((tq - b.laid) / 1.6);
    x = lerp(x, FAR.x + 80, d);
    return { x, y: threadY(x), rot, alpha: 1 - sm((tq - b.laid - 0.5) / 1.1) };
  }
  if (id === 1 && tq >= b.grab) return { x, y: threadY(x), rot, alpha: 0, hidden: true };
  return { x, y: threadY(x), rot, alpha: 1 };
}

/** the seals swell with each round of bidding, and stop dead on 'forty-four' */
function sealPulse(b: B, t: number, id: number): number {
  if (t < b.auction + 0.8 || t > b.stop) return 0;
  const period = 0.62;
  const ph = (t - b.auction - 0.8 + id * 0.11) / period;
  const f = ph - Math.floor(ph);
  return Math.exp(-f * 5) * (1 - win(t, b.stop - 0.3, b.stop));
}

function envelopes(c: C, env: PaintEnv, b: B, t: number) {
  const tq = tq12(t);
  for (let id = 3; id >= 0; id--) {
    const s = envState(id, b, tq);
    if (s.hidden || s.alpha <= 0.01) continue;
    // a small clip on the thread, the envelope hanging from it
    c.save();
    c.globalAlpha *= s.alpha;
    c.translate(s.x, s.y);
    c.fillStyle = env.fill('ink');
    c.fillRect(-2, -3, 4, 8);
    c.rotate(s.rot);
    // they hang in the dark, lit only by the screen's spill: paper one step down (round 1: not the brightest shapes)
    envelopeBack(c, env, 0, 4 + ENV_H / 2, sealPulse(b, t, id), id, 0.42);
    c.restore();
  }
}

/** warm off-white envelope paper: lifted toward the candle's amber (the warm accent stays motivated by the candle) */
function paperOf(env: PaintEnv, light: number) {
  const m = env.mood;
  return mixLab(mixLab(m.setHaze, '#e9dcc4', 0.42 + 0.3 * light), WARM.halo, 0.16);
}
const OXBLOOD = '#6a1c1a';

/** the back of a sealed envelope (blank: no bidder is named), its wax seal at the flap's point */
function envelopeBack(c: C, env: PaintEnv, x: number, y: number, pulse: number, salt: number, dim = 0) {
  const m = env.mood;
  const w = ENV_W, h = ENV_H;
  const paper = mixLab(paperOf(env, 0.5 + 0.2 * hash1(salt, 3)), m.fg, dim);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(x - w / 2 + 2, y - h / 2 + 3, w, h);
  c.fillStyle = paper;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  // flap folds as cut-lines
  c.strokeStyle = withAlpha(mixLab(m.ink, paper, 0.35), 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(x - w / 2, y - h / 2);
  c.lineTo(x, y + 2);
  c.lineTo(x + w / 2, y - h / 2);
  c.moveTo(x - w / 2, y + h / 2);
  c.lineTo(x - w * 0.12, y + 2);
  c.moveTo(x + w / 2, y + h / 2);
  c.lineTo(x + w * 0.12, y + 2);
  c.stroke();
  // the wax seal: a SMALL oxblood disc (the one saturated accent besides the candle) that swells ×1.12 and warms
  // with each round of bidding (a heartbeat)
  const r = 4.6 * (1 + 0.12 * pulse);
  if (pulse > 0.02) glow(c, x, y + 2, 13, WARM.halo, 0.3 * pulse);
  c.fillStyle = mixLab(OXBLOOD, '#b0342a', 0.45 * pulse);
  c.beginPath();
  c.arc(x, y + 2, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab('#c9786a', WARM.core, 0.4), 0.3 + 0.5 * pulse);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x, y + 2, r - 0.9, -2.6, -0.5);
  c.stroke();
}

/** the chosen envelope in his hand: held by its near end, it turns face up as it comes down onto the dresser */
function carried(c: C, env: PaintEnv, b: B, t: number, p: Pose) {
  const tq = tq12(t);
  if (tq < b.grab || tq >= b.laid) return;
  const h = HINTON.anchor({ x: FX, y: FLOOR, facing: 'right', pose: p }, 'handF');
  const u = sm((tq - b.grab) / (b.laid - b.grab));
  const sc = lerp(1, LAID_S, u);
  c.save();
  // held at its near (left) edge: its centre sits half a width to the right of his fingers, settling onto LAID
  c.translate(lerp(h.x + (ENV_W * sc) / 2 - 8, LAID.x, u * u), lerp(h.y + 4, LAID.y, u * u));
  const flip = Math.cos(Math.PI * Math.min(1, u * 1.25));
  c.scale(sc, sc * lerp(1, LAID_FS, u));
  c.scale(1, Math.max(0.08, Math.abs(flip)));
  if (flip > 0) envelopeBack(c, env, 0, 0, 0, 1);
  else envelopeFace(c, env, 0, 0, 0.6);
  c.restore();
}

function laid(c: C, env: PaintEnv, b: B, t: number) {
  const tq = tq12(t);
  if (tq < b.laid) return;
  const m = env.mood;
  // its shadow on the dresser top (it lies flat: a thin dark seam along its front edge)
  c.fillStyle = withAlpha(m.fg, 0.55);
  c.fillRect(LAID.x - (ENV_W * LAID_S) / 2 + 3, LAID.y + (ENV_H * LAID_S * LAID_FS) / 2 - 1, ENV_W * LAID_S, 4);
  // lying flat: foreshortened and drawn in perspective strips (far edge narrower), so it reads as a sheet lying on
  // the dresser top, not a card propped on it
  const light = 0.7 + 0.3 * win(t, b.laid, b.laid + 0.5);
  const H = ENV_H * LAID_S * LAID_FS;
  const N = 14;
  for (let i = 0; i < N; i++) {
    const y0 = -H / 2 + (i * H) / N, y1 = y0 + H / N + 0.6;
    const u = (i + 0.5) / N;
    c.save();
    c.beginPath();
    c.rect(LAID.x - 200, LAID.y + y0, 400, y1 - y0);
    c.clip();
    c.translate(LAID.x, LAID.y);
    c.scale(LAID_S * lerp(LAID_TOP, 1, u), LAID_S * LAID_FS);
    envelopeFace(c, env, 0, 0, light);
    c.restore();
  }
  // the screen's glow catches it
  glow(c, LAID.x - 20, LAID.y, 120, m.halo, 0.18 * win(t, b.laid, b.laid + 0.5));
}

/** the face of the chosen envelope: its typed address is a single large word (prop lettering) */
function envelopeFace(c: C, env: PaintEnv, x: number, y: number, light: number) {
  const m = env.mood;
  const w = ENV_W, h = ENV_H;
  const paper = paperOf(env, light);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(x - w / 2 + 2, y - h / 2 + 3, w, h);
  c.fillStyle = paper;
  c.fillRect(x - w / 2, y - h / 2, w, h);
  // a stamp corner (blank, no mark) and the typed word
  c.strokeStyle = withAlpha(mixLab(m.ink, paper, 0.4), 0.5);
  c.lineWidth = 0.8;
  c.strokeRect(x + w / 2 - 15, y - h / 2 + 4, 11, 13);
  c.fillStyle = mixLab(m.ink, paper, 0.08);
  c.font = `400 22px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('GOOGLE', x - 4, y + 5);
}

// ================================================================================================ light
/** the creed candle's pool: an ellipse of warm light LYING ON THE FLOOR (clipped to the floor plane, additive, under
 *  the dresser and the man), growing from the candle's base on 'everything' to the bed and the wardrobe's foot */
function poolLight(c: C, pool: PoolState) {
  const col = mixLab(WARM.halo, WARM.rim, 0.3);
  c.save();
  c.beginPath();
  c.rect(-400, 600, 2100, 500);
  c.clip();
  c.globalCompositeOperation = 'lighter';
  c.save();
  c.translate(pool.x, pool.y);
  c.scale(1, pool.ry / pool.rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, pool.rx);
  g.addColorStop(0, withAlpha(col, Math.min(0.8, 0.36 * pool.k)));
  g.addColorStop(0.5, withAlpha(col, Math.min(0.55, 0.2 * pool.k)));
  g.addColorStop(0.82, withAlpha(col, Math.min(0.35, 0.09 * pool.k)));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(-pool.rx, -pool.rx, pool.rx * 2, pool.rx * 2);
  c.restore();
  // a crisp, brighter pool at his feet on 'tall' (his feet stand dark in it)
  if (pool.feet > 0) {
    c.save();
    c.translate(FX + 14, FLOOR + 2);
    c.scale(1, 0.16);
    const r = 150;
    const g2 = c.createRadialGradient(0, 0, 0, 0, 0, r);
    g2.addColorStop(0, withAlpha(mixLab(col, WARM.core, 0.4), 0.55 * pool.feet));
    g2.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g2;
    c.fillRect(-r, -r, 2 * r, 2 * r);
    c.restore();
  }
  c.restore();
}

/** the creed candle on its paper stage (L5): huge, lettered, its flame on the top ring (lit in 2012, no sleeve yet) */
function creedCandle(c: C, env: PaintEnv, b: B, t: number) {
  const m = env.mood;
  // the paper stage: a toy-theatre platform running out of frame left. Its top (lit by the flame, falling off to the
  // right), then a scalloped paper LIP along its front edge, then its dark front face
  const y0 = CANDLE.y, xR = 330;
  const top = c.createLinearGradient(-200, 0, xR, 0);
  top.addColorStop(0, withAlpha(mixLab(m.set, WARM.halo, 0.35), 0.9));
  top.addColorStop(0.55, withAlpha(mixLab(m.set, WARM.halo, 0.28), 0.9));
  top.addColorStop(1, withAlpha(m.set, 0.75));
  c.fillStyle = env.fill('fg');
  c.fillRect(-200, y0 - 12, xR + 200, 300);
  c.fillStyle = top;
  c.fillRect(-200, y0 - 12, xR + 200, 12);
  // the lip: a strip of paper scallops cut along the stage front, warm paper catching the flame
  c.fillStyle = mixLab(mixLab(m.set, '#d9c7a4', 0.35), WARM.halo, 0.2);
  c.beginPath();
  c.moveTo(-200, y0);
  c.lineTo(xR, y0);
  c.lineTo(xR, y0 + 14);
  for (let x = xR; x >= -200; x -= 22) {
    c.quadraticCurveTo(x - 11, y0 + 26, x - 22, y0 + 14);
  }
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(m.rim, WARM.rim, 0.7), 0.55);
  c.fillRect(-200, y0 - 0.8, xR + 200, 1.6);
  c.fillStyle = withAlpha(mixLab(m.rim, WARM.rim, 0.7), 0.25);
  c.fillRect(-200, y0 - 12.6, xR + 200, 1.1);
  // the stage's right end: a cut edge, so it reads as a platform and not a floor
  c.fillStyle = withAlpha(mixLab(m.rim, WARM.rim, 0.5), 0.3);
  c.fillRect(xR - 1, y0 - 12, 1.4, 38);
  // the candle (warm-lit wax: its own light, not the room's), lettering catching the flame
  const warmEnv: PaintEnv = { ...env, mood: { ...m, rim: mixLab(m.rim, WARM.rim, 0.75), halo: WARM.halo, core: WARM.core }, fill: env.fill };
  const steady = win(t, b.candle - 0.1, b.candle + 0.5);
  // the naming rule: 'A new candle' names it; its label turns to the viewer, then returns before 'everything'
  const named = win(t, b.candle - 0.15, b.candle + 0.25) * (1 - win(t, b.spread - 0.75, b.spread - 0.25));
  beliefCandle(c, { x: CANDLE.x, y: CANDLE.y, view: CANDLE_VIEW, s: CANDLE.s, drawFlame: false, letters: (0.55 + 0.25 * steady) * (1 - 0.6 * named), seed: 2012, named: 0 }, warmEnv);
  if (named > 0) namedLabel(c, { x: CANDLE.x, y: CANDLE.y, view: CANDLE_VIEW, s: CANDLE.s, named }, warmEnv);
}

/** the flame and its warm light (drawn after L5 so the near candle glows; warm = the one accent) */
function candleLight(f: Frame, b: B, t: number) {
  const c = f.c;
  const steady = win(t, b.candle - 0.1, b.candle + 0.5);
  const tq = Math.floor(t * 24) / 24;
  const flick = 1 + (0.07 - 0.05 * steady) * Math.sin(tq * 17.3 + 1.1) * Math.sin(tq * 5.1);
  const k = (0.72 + 0.28 * steady) * flick * wakeAt(t);
  // the flame point on screen (L5 parallax)
  const P = toScreen(LAYERS.L5, f.cam, CFLAME.x, CFLAME.y);
  const s = P.k;
  const fx = P.x, fy = P.y;
  // its spill on the room
  glow(c, fx + 80, fy + 120, 640, WARM.halo, 0.12 * k);
  glow(c, fx, fy - 10, 190, WARM.halo, 0.36 * k);
  glow(c, fx, fy - 12, 52, WARM.core, 0.85 * k);
  // the flame itself: a cut-paper teardrop in the core colour (sharp while racked to it, softer after)
  const soft = win(t, b.rack0, b.rack1);
  const sway = Math.sin(tq * 3.1) * 1.4;
  const H = 15 * CANDLE.s * s * (0.92 + 0.08 * steady) * flick;
  c.save();
  c.translate(fx + sway * 0.3, fy + 3 * CANDLE.s * s);
  if (soft > 0) c.filter = `blur(${(2.4 * soft * f.pxScale) / 1.5}px)`;
  c.fillStyle = mixLab(WARM.core, '#fff4d6', 0.35);
  c.beginPath();
  c.moveTo(0, -H);
  c.bezierCurveTo(H * 0.32 + sway, -H * 0.55, H * 0.3, -H * 0.08, 0, 0);
  c.bezierCurveTo(-H * 0.3, -H * 0.08, -H * 0.32 + sway, -H * 0.55, 0, -H);
  c.fill();
  c.restore();
}

// ================================================================================================ type
const TAB_X = 300;
function reportedBy(f: Frame, b: B, t: number) {
  const a = win(t, b.account - 0.05, b.account + 0.45);
  if (a <= 0) return;
  const c = f.c;
  const m = f.mood;
  // lower LEFT (script), above the place stamp, on the stage's dark front face
  const x = 40, y = 634;
  c.save();
  c.globalAlpha = a;
  c.font = `italic 400 ${legibleSize(c, `italic 400 22px ${FONT.text}`, 22) * 1.03}px ${FONT.text}`;
  const w = c.measureText('as reported by Cade Metz').width;
  softPlate(c, x + w / 2, y - 7, w + 150, 74, m.ink, 0.55);
  c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('as reported by Cade Metz', x - (1 - a) * 6, y);
  c.restore();
}
