/**
 * ch03-s02 — Washington, the next morning (8 July 1958): the hype, and who fed it (labGreen, cut).
 *
 * THE STREET (camera HELD: no whip, no pan). Paper-cut brownstones against a pale dawn (L2), low rooftops and
 * trees far off (L1), a street lamp still burning and a parked sedan (L3), the kerb and the boy (L4), a bundle of
 * papers and a hydrant out of focus in front (L5).
 *   0 (headline)      a newsboy in a flat cap runs in from the left in profile (walk cycle on twos, feet planted),
 *                     stops at centre and thrusts the open paper toward the lens: NEW NAVY DEVICE LEARNS BY DOING
 *                     (the front page faces us; the headline is the paper's own type)
 *   → 'expected'      the paper rushes the lens (an L6 occluder filling the frame) and slides away: the PARCHMENT
 * (card)              QUOTE CARD beneath it. The lede fragment sets in Special Elite word by word with the voice:
 *                     walk · talk · see · write · reproduce itself · and be · conscious of its existence
 *   'conscious'       the last clause sets and glows faintly (near silence in the score)
 *                     attribution: — UPI in The New York Times, 8 July 1958 (the full lede: creditsSources)
 * THE EVEN POOL (L0304, said plainly, a paraphrase — no quotation marks on screen):
 *   'fairness' (blame)   the card tilts and slides aside; one even pool of light opens (no villain lighting)
 *   'Navy' (navy)        a plain naval officer's peaked cap (no insignia) lifts into the pool
 *   'press' (papers)     the quote card itself, small, lifts beside it
 *   'Rosenblatt' (own)   a slip in Rosenblatt's own hand, summer 1958 (hatched, illegible: never quoted) lifts too;
 *                        all three end level, side by side, in the same light, and hold.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, defineShot, mixLab, overscan, pose, softPlate, strideLength, walkTo, withAlpha, withLife } from '../../../film';
import type { Camera3, Frame, PaintEnv, Palette, Pose } from '../../../film';
import { cast, SPECS } from '../cast';
import { bake, clamp01, easeIO, lerp, mixCam, sm, tq12, typedLine, win, h01 } from '../sets/ch03-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch03-s02';
const KERB = 640;
const BOY_X1 = 452;
/** the street camera: held (a hair of drift), close enough that the boy and his paper read */
const STREET0: Camera3 = { x: 566, y: 410, z: 258, lens: 1 };
const STREET1: Camera3 = { x: 570, y: 408, z: 270, lens: 1 };
const CAMS: Camera3[] = [STREET0, STREET1];
const SCALE0 = 1000 / (1000 - STREET0.z);

/** the boy's thrust: both arms forward, the open paper held up between his hands, facing the lens */
const THRUST: Pose = pose({ hipF: 10, kneeF: -6, hipB: -8, kneeB: -2, torso: 6, neck: 4, head: -4, shoulderF: 78, elbowF: 22, wristF: -10, shoulderB: 70, elbowB: 30, wristB: -8 }, { handF: 'pinch', handB: 'pinch' });
const CARRY: Pose = pose({ hipF: 6, kneeF: -4, hipB: -6, kneeB: -2, torso: 3, neck: 6, head: -4, shoulderF: 40, elbowF: 70, wristF: -10, shoulderB: 34, elbowB: 74 }, { handF: 'pinch', handB: 'pinch' });

// ----------------------------------------------------------------------------------- the lede, word by word
/** the card's three lines; each token carries the narration word that sets it */
const LEDE: { text: string; word: string }[][] = [
  [
    { text: '“...walk,', word: 'walk' },
    { text: 'talk,', word: 'talk' },
    { text: 'see,', word: 'see' },
    { text: 'write,', word: 'write' },
  ],
  [
    { text: 'reproduce', word: 'reproduce' },
    { text: 'itself', word: 'itself' },
    { text: 'and', word: 'and' },
    { text: 'be', word: 'be' },
  ],
  [
    { text: 'conscious', word: 'conscious' },
    { text: 'of', word: 'of' },
    { text: 'its', word: 'its' },
    { text: 'existence.”', word: 'existence' },
  ],
];
const CARD = { x: 640, y: 336, w: 1060, h: 520 };
/** the trio on ONE baseline (each object's foot sits exactly on `base`), centred under one hanging lamp: at the
 *  final camera the cap sits at ~0.36 W, the paper at 0.5 W, the slip at ~0.64 W */
const TRIO = { cap: 482, card: 642, slip: 794, base: 548, k: 0.9 };
const TRIO_MID = (TRIO.cap + TRIO.slip) / 2;
const POOL = { x: TRIO_MID, y: 552 };
const LAMP = { x: TRIO_MID, y: 186 };

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    // round 1: the run-in is cut to two quick running steps from near centre (≈0.4 s), so the headline can HOLD
    // full-frame for 1.5 s: he arrives ~0.4 s and thrusts the paper open; it rushes the lens by ~1.0 s, the
    // headline holds full-frame to ~2.5 s, and the newsprint wipes off the quote card ahead of 'walk'
    const BOY_X0 = BOY_X1 - 2 * strideLength(SPECS.newsboy);
    const walk = walkTo(SPECS.newsboy, { x0: BOY_X0, x1: BOY_X1, at: 0, cadence: 3.4, end: CARRY });
    const arrive = walk(0).arrive;
    const card = T.beat('card');
    const thrust = Math.min(arrive + 0.04, 0.5);
    const rush0 = thrust + 0.22;
    const walkW = T.word('L0303', 'walk');
    const wipe0 = Math.max(rush0 + 0.35 + 1.5, card);
    const words = LEDE.map((ln) => ln.map((w) => T.word('L0303', w.word)));
    tl.hold(0, D);
    return {
      tl,
      D,
      walk,
      arrive,
      thrust,
      rush: rush0,
      rush1: rush0 + 0.35,
      wipe0,
      wipe1: Math.min(walkW - 0.06, wipe0 + 0.36),
      card,
      words,
      conscious: T.beat('conscious'),
      blame: T.beat('blame'),
      navy: T.beat('navy'),
      papers: T.beat('papers'),
      own: T.beat('own'),
      fed: T.word('L0304', 'fed'),
      lineEnd: T.line('L0303').end,
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const wipeU = win(t, scene.wipe0, scene.wipe1); // the newsprint slides off the card
    const inStreet = t < scene.wipe1 + 0.03;
    // on 'fairness' the card tilts (~6 deg) and slides off left over ~0.65 s, seen going (round 1: the slide is
    // the bridge from the hype to the shared blame, so the eye follows it into the pool)
    const cardOut = clamp01((t - (scene.blame - 0.05)) / 0.7);

    // the street until the newsprint starts to slide; from then on the room under the card (the page covers the
    // change; a dark veil over the street's last frames matches the room's margins at the switch)
    if (t < scene.wipe0) {
      street(f, scene, t, tq);
      const veil = win(t, scene.rush1 - 0.1, scene.wipe0);
      if (veil > 0.001) {
        const c = f.c;
        c.save();
        c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
        c.globalAlpha = veil;
        c.fillStyle = mixLab(f.mood.fg, f.mood.set, 0.4);
        c.fillRect(0, 0, 1280, 720);
        c.restore();
      }
    } else quoteStage(f, scene, t, tq, cardOut);
    void inStreet;

    // the paper rushing the lens (screen-locked L6 occluder), holding full-frame, then sliding off left
    const rushU = win(t, scene.rush, scene.rush1);
    if (t >= scene.rush && wipeU < 1) {
      const c = f.c;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      // from the paper in his hands (screen; pure: the boy's pose at the rush) to the headline filling the frame
      const hp = paperOnScreen(scene, scene.rush);
      const k = lerp(hp.k, 6.0, rushU * rushU);
      const hx = lerp(hp.x, 640, sm(rushU)) - wipeU * wipeU * 1500;
      const hy = lerp(hp.y, 300, sm(rushU));
      // place the page so its headline (54 units below the page top) sits at (hx, hy)
      frontPage(c, f.mood, hx, hy + (PAGE.h / 2 - 54) * k, k, 1, wipeU);
      c.restore();
    }
  },
});

// ===================================================================================================== street
type Scene = {
  D: number;
  walk: ReturnType<typeof walkTo>;
  arrive: number;
  thrust: number;
  rush: number;
  rush1: number;
  wipe0: number;
  wipe1: number;
  card: number;
  words: number[][];
  conscious: number;
  blame: number;
  navy: number;
  papers: number;
  own: number;
  fed: number;
  lineEnd: number;
};

const streetCam = (t: number): Camera3 => {
  const u = sm(t / 2.5);
  return { x: lerp(STREET0.x, STREET1.x, u), y: lerp(STREET0.y, STREET1.y, u), z: lerp(STREET0.z, STREET1.z, u), lens: 1 };
};
/** the boy at time t (pure): walk, then the CARRY settle, then the thrust */
function boyAt(scene: Scene, t: number) {
  const tq = tq12(t);
  const w = scene.walk(t);
  const thrustU = sm((tq - scene.thrust) / 0.25);
  let p = w.walking ? w.pose : (withLife(w.pose as Pose, tq, 12, 0.6) as Pose);
  if (!w.walking) p = blendPoseSafe(p, THRUST, thrustU);
  const boy = { x: w.x, y: KERB, facing: 'right' as const, pose: p, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 0.6, y: -0.6, floor: 0 }, edgeRim: { x: 0.7, y: -0.6, px: 1.5 } };
  return { boy, walking: w.walking, thrustU };
}
/** the open page between his hands: world centre (L4) and its open scale */
function paperWorld(b: ReturnType<typeof boyAt>) {
  const hf = cast.newsboy.anchor(b.boy, 'handF');
  const hb = cast.newsboy.anchor(b.boy, 'handB');
  const mx = (hf.x + hb.x) / 2, my = Math.min(hf.y, hb.y);
  const open = lerp(0.45, 1, clamp01((b.thrustU - 0.15) / 0.85));
  return { x: mx + 6, y: my - 40 * open, open };
}
/** where the page's headline sits on screen at time t, and the page's on-screen scale */
function paperOnScreen(scene: Scene, t: number) {
  const pw = paperWorld(boyAt(scene, t));
  const cam = streetCam(t);
  const sc = 1000 / (1000 - cam.z);
  const cy = 360 + (pw.y - cam.y) * sc;
  const k = pw.open * sc;
  return { x: 640 + (pw.x - cam.x) * sc, y: cy - (PAGE.h / 2 - 54) * k, k };
}

/** the paper folded in quarters, tucked under the far arm (a pale slab along the forearm, its fold edge inked) */
function foldedPaper(c: C, P: Palette, hand: { x: number; y: number }) {
  c.save();
  c.translate(hand.x, hand.y);
  c.rotate(-1.25);
  c.fillStyle = mixLab('#d9d4c4', P.halo, 0.2);
  c.fillRect(-8, -16, 92, 30);
  c.fillStyle = withAlpha(P.ink, 0.35);
  c.fillRect(-8, -2, 92, 1.4);
  c.fillStyle = withAlpha('#1b1814', 0.45);
  for (let k = 0; k < 5; k++) c.fillRect(6 + k * 15, -11, 10, 1.4);
  c.restore();
}

function street(f: Frame, scene: Scene, t: number, tq: number) {
  const cam = streetCam(t);
  f.camera(cam);
  f.backlight({ sunX: 900, sunY: 170, sunRadius: 760, intensity: 1 });
  // L1: low rooftops and trees far off, a pale haze
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, CAMS, 80);
    bake(f, c, `${ID}/L1c/${env.mood.id}`, r, (cc) => {
      const P = env.mood;
      // the dawn's horizon band: 15-20% lighter and a touch warmer than the sky above it (within labGreen)
      const hb = cc.createLinearGradient(0, 120, 0, 330);
      hb.addColorStop(0, withAlpha(mixLab(P.halo, '#efe2b8', 0.35), 0));
      hb.addColorStop(0.55, withAlpha(mixLab(P.halo, '#efe2b8', 0.4), 0.55));
      hb.addColorStop(1, withAlpha(mixLab(P.halo, '#efe2b8', 0.4), 0.3));
      cc.fillStyle = hb;
      cc.fillRect(r.x, 120, r.w, 480);
      // the farthest plane, hazed almost into the dawn: the city's monuments over the roofs (an obelisk at
      // left, a ribbed dome on a drum at right), a long low line of government blocks between
      const far = mixLab(env.fill('set'), P.sky[2], 0.55);
      cc.fillStyle = far;
      cc.fillRect(r.x, 236, r.w, 400);
      for (let x = r.x; x < r.x + r.w; x += 70) {
        const hh = 10 + 14 * h01(Math.floor(x / 70), 41);
        cc.fillRect(x, 236 - hh, 64, hh + 2);
      }
      cc.beginPath(); // the obelisk
      cc.moveTo(246, 240);
      cc.lineTo(252, 104);
      cc.lineTo(258, 94);
      cc.lineTo(264, 104);
      cc.lineTo(270, 240);
      cc.closePath();
      cc.fill();
      cc.fillRect(840, 206, 120, 32); // the dome: a base block, a colonnaded drum, the dome, a lantern
      cc.fillRect(856, 178, 88, 30);
      cc.beginPath();
      cc.moveTo(856, 180);
      cc.quadraticCurveTo(858, 132, 900, 126);
      cc.quadraticCurveTo(942, 132, 944, 180);
      cc.closePath();
      cc.fill();
      cc.fillRect(894, 108, 12, 20);
      cc.fillRect(898, 96, 4, 14);
      cc.fillStyle = withAlpha(P.halo, 0.25);
      for (let k = 0; k < 9; k++) cc.fillRect(860 + k * 10, 182, 2, 24);
      // far rooftops: flat roofs, a water tower or two, chimneys and bare tree crowns, all well below the dawn
      // band so a strip of pale sky shows over the terrace
      cc.fillStyle = mixLab(env.fill('set'), P.sky[2], 0.22);
      cc.beginPath();
      cc.moveTo(r.x, 600);
      for (let x = r.x; x <= r.x + r.w; x += 38) {
        const i = Math.floor(x / 38);
        const top = 268 - 56 * h01(i, 11) - (h01(Math.floor(x / 114), 12) > 0.72 ? 44 : 0);
        if (h01(i, 13) > 0.7) cc.quadraticCurveTo(x + 19, top - 34, x + 38, top + 10);
        else {
          cc.lineTo(x, top);
          cc.lineTo(x + 38, top);
        }
      }
      cc.lineTo(r.x + r.w, 600);
      cc.closePath();
      cc.fill();
      for (let x = r.x + 60; x < r.x + r.w; x += 260 + 120 * h01(Math.floor(x), 14)) {
        const top = 226 - 30 * h01(Math.floor(x), 15);
        // a water tower: legs, a staved tank, a conical cap
        cc.fillRect(x, top - 4, 3, 40);
        cc.fillRect(x + 30, top - 4, 3, 40);
        cc.fillRect(x - 2, top - 44, 37, 40);
        cc.beginPath();
        cc.moveTo(x - 4, top - 44);
        cc.lineTo(x + 16.5, top - 62);
        cc.lineTo(x + 37, top - 44);
        cc.closePath();
        cc.fill();
      }
    });
  });
  f.fog({ yCenter: 0.62 * 720, height: 0.36 * 720, alpha: 0.32, drift: 5 });
  // L2: the brownstone terrace (stoops, cornices, bays), a few lit windows
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, CAMS, 80);
    bake(f, c, `${ID}/L2/${env.mood.id}`, r, (cc) => brownstones(cc, env, r));
  });
  f.fog('A');
  // L3: a street lamp still burning, a parked sedan, a pillar box
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, CAMS, 60);
    bake(f, c, `${ID}/L3/${env.mood.id}`, r, (cc) => streetFurniture(cc, env));
  });
  f.practical({ x: 1046, y: 238, kind: 'lamp', seed: 58, intensity: 0.55, radius: 54, layer: 'L3' });
  f.fog('B');
  // L4: the pavement and the boy
  void tq;
  const B = boyAt(scene, t);
  const boy = B.boy;
  f.layer('L4', (c, env) => {
    const P = env.mood;
    const fr = overscan(LAYERS.L4, CAMS, 40);
    c.fillStyle = mixLab(P.fg, P.set, 0.18);
    c.fillRect(fr.x, KERB - 2, fr.w, fr.y + fr.h - KERB + 2);
    c.fillStyle = withAlpha(P.rim, 0.24);
    c.fillRect(fr.x, KERB - 2, fr.w, 1.5);
    // the paper: FOLDED under his far arm while he runs (the body hides half of it), opened only on the thrust
    const folded = B.walking || B.thrustU <= 0.15;
    if (folded && t < scene.rush) foldedPaper(c, P, cast.newsboy.anchor(boy, 'handB'));
    cast.newsboy.draw(c, boy, env);
    if (!folded && t < scene.rush) {
      const pw = paperWorld(B);
      frontPage(c, P, pw.x, pw.y, pw.open, 1, 0);
    }
  });
  f.rim({ x: 0.7, y: -0.5 });
  // L5: a bundle of papers and a hydrant, out of focus
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, CAMS, 40);
    bake(f, c, `${ID}/L5c/${env.mood.id}`, r, (cc) => {
      // (L5 is ~1.66x the action plane at this dolly: world x 760-880, y 575+ lands at stage ≈ 960-1160, 600-720)
      const fg = env.fill('fg');
      const rim = withAlpha(env.mood.rim, 0.3);
      // a near lamp-post at the left edge of frame (the nearest plane: an iron post, a collar, a flared base);
      // the boy runs in from behind it. Its rim is on the dawn side (right).
      const LP = 196;
      cc.fillStyle = fg;
      cc.fillRect(LP, r.y, 22, r.y + r.h - r.y);
      cc.fillRect(LP - 6, 560, 34, 16);
      cc.fillRect(LP - 12, 640, 46, r.y + r.h - 640);
      cc.fillStyle = withAlpha(env.mood.rim, 0.42);
      cc.fillRect(LP + 20, r.y, 2, 560 - r.y);
      cc.fillRect(LP + 26, 560, 2, 16);
      cc.fillRect(LP + 32, 640, 2, 80);
      cc.fillStyle = fg;
      // a bundle of tied papers on the kerb
      cc.fillRect(748, 628, 74, 60);
      cc.fillStyle = rim;
      for (let k = 0; k < 6; k++) cc.fillRect(748, 632 + k * 6, 74, 1);
      cc.fillRect(748, 628, 74, 1.4);
      cc.fillStyle = fg;
      cc.fillRect(782, 624, 4, 70);
      // a hydrant: domed cap, bonnet, two side nozzles, a flanged foot
      cc.fillRect(848, 590, 34, 120);
      cc.beginPath();
      cc.arc(865, 590, 18, Math.PI, 0);
      cc.fill();
      cc.fillRect(861, 566, 8, 8);
      cc.fillRect(838, 598, 54, 7);
      cc.fillRect(834, 616, 64, 12);
      cc.fillRect(840, 690, 50, 30);
      cc.fillStyle = rim;
      cc.beginPath();
      cc.arc(865, 590, 18, Math.PI * 1.05, Math.PI * 1.7);
      cc.lineTo(865, 590);
      cc.closePath();
      cc.fill();
      cc.fillRect(848, 605, 1.4, 85);
    });
  });
}

function blendPoseSafe(a: Pose, b: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const angles: Pose['angles'] = {};
  const keys = new Set([...Object.keys(a.angles), ...Object.keys(b.angles)]) as Set<keyof Pose['angles']>;
  for (const k of keys) angles[k] = lerp(a.angles[k] ?? 0, b.angles[k] ?? 0, u);
  return { angles, handF: u < 0.5 ? a.handF : b.handF, handB: u < 0.5 ? a.handB : b.handB };
}

function brownstones(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const P = env.mood;
  const wall = env.fill('set');
  const dark = mixLab(wall, P.fg, 0.35);
  const GROUND = 600;
  let x = Math.floor(r.x / 240) * 240 - 240;
  let i = 0;
  while (x < r.x + r.w) {
    const W = 196 + Math.round(64 * h01(i, 31));
    const storeys = 3;
    const SH = 84;
    const top = GROUND - 70 - storeys * SH;
    const mansard = h01(i, 33) > 0.66;
    const bay = h01(i, 34) > 0.35;
    // the facade (window HOLES cut through; the glass painted behind), the raised basement
    c.fillStyle = wall;
    c.beginPath();
    c.rect(x, top, W - 3, GROUND - top);
    const holes: [number, number, number, number][] = [];
    for (let s = 0; s < storeys; s++) {
      const n = W > 236 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const ww = 34, wh = s === storeys - 1 ? 58 : 52;
        const wx = x + 28 + (k * (W - 56 - ww)) / Math.max(1, n - 1);
        const wy = top + 26 + s * SH;
        if (bay && k === n - 1 && s < storeys - 1) continue; // the bay covers it
        holes.push([wx, wy, ww, wh]);
        c.rect(wx, wy, ww, wh);
      }
    }
    c.fill('evenodd');
    for (const [wx, wy, ww, wh] of holes) {
      const lit = h01(Math.round(wx * 3 + wy), 23) > 0.87;
      c.fillStyle = lit ? mixLab(P.halo, P.core, 0.3) : mixLab(P.sky[1], P.sky[2], 0.2 + 0.5 * h01(Math.round(wx), 24));
      c.fillRect(wx, wy, ww, wh);
      c.fillStyle = wall;
      c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
      c.fillRect(wx, wy + wh * 0.46, ww, 3);
      c.fillStyle = dark;
      c.fillRect(wx - 5, wy - 7, ww + 10, 7); // lintel
      c.fillRect(wx - 4, wy + wh, ww + 8, 5); // sill
    }
    // a projecting bay (three-sided) up the front, its own narrow windows
    if (bay) {
      const bx = x + W - 92, bw = 70;
      c.fillStyle = mixLab(wall, P.setHaze, 0.12);
      c.fillRect(bx, top + 24, bw, (storeys - 1) * SH + 6);
      for (let s = 0; s < storeys - 1; s++) {
        const wy = top + 30 + s * SH;
        c.fillStyle = mixLab(P.sky[1], P.sky[2], 0.3 + 0.4 * h01(i * 7 + s, 25));
        for (const dx of [8, 28, 48]) c.fillRect(bx + dx, wy, 14, 48);
      }
      c.fillStyle = dark;
      c.fillRect(bx - 4, top + 18, bw + 8, 8);
    }
    // the roof line: a bracketed cornice, or a mansard with dormers; chimneys
    c.fillStyle = dark;
    if (mansard) {
      c.beginPath();
      c.moveTo(x - 4, top + 2);
      c.lineTo(x + 14, top - 50);
      c.lineTo(x + W - 17, top - 50);
      c.lineTo(x + W + 1, top + 2);
      c.closePath();
      c.fill();
      for (let k = 0; k < 2; k++) {
        const dx = x + 40 + k * (W - 110);
        c.fillRect(dx, top - 44, 30, 36);
        c.fillStyle = mixLab(P.sky[1], P.sky[2], 0.35);
        c.fillRect(dx + 7, top - 36, 16, 22);
        c.fillStyle = dark;
      }
    } else {
      c.fillRect(x - 4, top - 14, W + 4, 16);
      for (let k = 0; k * 30 < W - 10; k++) c.fillRect(x + 4 + k * 30, top + 2, 7, 11);
    }
    c.fillRect(x + 30 + 60 * h01(i, 35), top - (mansard ? 82 : 44), 18, mansard ? 40 : 32);
    // the stoop: a flight up to the door over the raised basement, an iron rail, the door
    const dx = x + 18;
    c.fillStyle = dark;
    for (let k = 0; k < 6; k++) c.fillRect(dx - 6 - k * 7, GROUND - 8 - k * 11, 62 + k * 14, 9);
    c.fillStyle = mixLab(P.fg, P.set, 0.25);
    c.fillRect(dx + 6, GROUND - 70 - SH + 30, 34, SH - 30);
    c.strokeStyle = dark;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(dx - 48, GROUND - 4);
    c.lineTo(dx, GROUND - 74);
    c.lineTo(dx, GROUND - 92);
    c.stroke();
    // basement railings
    c.lineWidth = 1.4;
    c.beginPath();
    for (let k = 0; k < 14; k++) {
      const px = x + 90 + k * 8;
      if (px > x + W - 10) break;
      c.moveTo(px, GROUND);
      c.lineTo(px, GROUND - 24);
    }
    c.moveTo(x + 88, GROUND - 22);
    c.lineTo(Math.min(x + W - 10, x + 196), GROUND - 22);
    c.stroke();
    x += W;
    i++;
  }
  c.fillStyle = mixLab(wall, P.fg, 0.2);
  c.fillRect(r.x, GROUND, r.w, r.y + r.h - GROUND);
}

function streetFurniture(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // the street lamp (post, arm, lantern)
  c.fillRect(1040, 250, 10, 360);
  c.fillRect(1028, 600, 34, 12);
  c.beginPath();
  c.moveTo(1030, 252);
  c.lineTo(1060, 252);
  c.lineTo(1066, 222);
  c.lineTo(1024, 222);
  c.closePath();
  c.fill();
  c.fillRect(1036, 210, 18, 12);
  // a parked 1950s sedan (rounded fenders, a fastback roof): inked solid, a rim line along its top, chrome
  const body = new Path2D();
  body.moveTo(640, 598);
  body.lineTo(640, 560);
  body.quadraticCurveTo(650, 532, 700, 530);
  body.quadraticCurveTo(740, 488, 800, 486);
  body.lineTo(860, 486);
  body.quadraticCurveTo(910, 490, 930, 530);
  body.quadraticCurveTo(985, 534, 990, 562);
  body.lineTo(990, 598);
  body.closePath();
  c.fillStyle = ink;
  c.fill(body);
  const rim = env.mood.rim;
  // the lit top edge (roof and hood catch the dawn behind them)
  c.save();
  c.clip(body);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(642, 560);
  c.quadraticCurveTo(650, 532, 700, 530);
  c.quadraticCurveTo(740, 488, 800, 486);
  c.lineTo(860, 486);
  c.quadraticCurveTo(910, 490, 930, 530);
  c.quadraticCurveTo(985, 534, 988, 562);
  c.stroke();
  c.restore();
  // windows (the dawn seen through the cabin), door seam, a chrome side strip
  c.fillStyle = withAlpha(mixLab(env.mood.sky[2], rim, 0.3), 0.55);
  c.beginPath();
  c.moveTo(756, 524);
  c.quadraticCurveTo(774, 498, 806, 496);
  c.lineTo(822, 496);
  c.lineTo(822, 524);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(830, 496);
  c.lineTo(860, 496);
  c.quadraticCurveTo(892, 500, 906, 524);
  c.lineTo(830, 524);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(rim, 0.4);
  c.fillRect(662, 552, 316, 2.2);
  c.fillStyle = withAlpha(rim, 0.22);
  c.fillRect(826, 530, 1.4, 52);
  c.fillRect(870, 562, 14, 2);
  // bumpers: chrome bars wrapping the ends
  c.fillStyle = mixLab(ink, rim, 0.55);
  c.beginPath();
  c.roundRect(632, 578, 22, 9, 4);
  c.roundRect(976, 578, 22, 9, 4);
  c.fill();
  c.fillStyle = withAlpha(rim, 0.6);
  c.fillRect(634, 579, 18, 1.5);
  c.fillRect(978, 579, 18, 1.5);
  // headlamp and tail lamp
  c.fillStyle = mixLab(ink, rim, 0.45);
  c.beginPath();
  c.arc(986, 560, 4.5, 0, Math.PI * 2);
  c.fill();
  // wheels with hubcaps
  for (const wx of [710, 920]) {
    c.fillStyle = mixLab(env.mood.fg, ink, 0.5);
    c.beginPath();
    c.arc(wx, 598, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(ink, rim, 0.4);
    c.beginPath();
    c.arc(wx, 598, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(rim, 0.35);
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(wx, 598, 26, Math.PI * 1.1, Math.PI * 1.75);
    c.stroke();
  }
}

/** the front page: newsprint, a two-line headline in heavy condensed caps, columns of hatched body type, a photo */
const PAGE = { w: 196, h: 236 };
function frontPage(c: C, P: Palette, cx: number, cy: number, k: number, a: number, wipe: number) {
  const W = PAGE.w * k, H = PAGE.h * k;
  c.save();
  c.globalAlpha *= a;
  c.translate(cx, cy);
  c.rotate((1 - Math.min(1, k)) * 0.0 + wipe * -0.06);
  // paper: newsprint, lit by the dawn
  c.fillStyle = mixLab('#d9d4c4', P.halo, 0.25);
  c.fillRect(-W / 2, -H / 2, W, H);
  c.fillStyle = withAlpha(P.ink, 0.12);
  c.fillRect(-W / 2, -H / 2 + H * 0.5 - 0.6 * k, W, 1.2 * k); // the fold
  // headline
  c.fillStyle = withAlpha('#1b1814', 0.92);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `700 ${21 * k}px ${FONT.display}`;
  c.fillText('NEW NAVY DEVICE', 0, -H / 2 + 38 * k);
  c.fillText('LEARNS BY DOING', 0, -H / 2 + 60 * k);
  c.fillRect(-W / 2 + 8 * k, -H / 2 + 14 * k, W - 16 * k, 1.4 * k);
  c.fillRect(-W / 2 + 8 * k, -H / 2 + 68 * k, W - 16 * k, 0.8 * k);
  // body columns (hatched, illegible) and a photo block
  c.fillStyle = withAlpha('#1b1814', 0.32);
  for (let col = 0; col < 5; col++) {
    const x0 = -W / 2 + 8 * k + col * 36.4 * k;
    for (let ln = 0; ln < 36; ln++) {
      const y = -H / 2 + 76 * k + ln * 4.2 * k;
      if (col === 1 && ln < 11) continue;
      const w = (30 - 8 * h01(col * 50 + ln, 3) * (ln % 7 === 6 ? 1 : 0.15)) * k;
      c.fillRect(x0, y, w, 1.6 * k);
    }
  }
  c.fillStyle = withAlpha('#1b1814', 0.5);
  c.fillRect(-W / 2 + 44 * k, -H / 2 + 76 * k, 30 * k, 42 * k);
  c.restore();
}

// ===================================================================================================== card + pool
// ===================================================================================================== the room
/** THE ROOM under the card (round-1 depth fix: a real multiplane space, not a screen-locked plate).
 *  One dark office at dawn: a tall sash window at back left (L2, a HOLE: the backlight shows through), a filing
 *  cabinet at right (L3), a table (L4) with the quote card standing on it and one enamel lamp over it, and the
 *  table's near lip and an inkwell (L5, blurred) that the pull-back brings into frame.
 *  Camera: pushed in on the card (z 200 → 236) while the lede sets; on 'fairness' the card slides away and the
 *  camera pulls back (z 236 → 52, easeIO) to reveal the table, the lamp and its even pool. */
const CARD_W = { x: 640, y: 348, w: 840, h: 404 };
const ROOM_CARD0: Camera3 = { x: 640, y: 346, z: 200, lens: 1 };
const ROOM_CARD1: Camera3 = { x: 640, y: 344, z: 236, lens: 1 };
/** round 1: the tableau is framed CLOSE: the three fill the middle of the frame, the table's far edge at ~60%
 *  frame height, the lamp's shade at the top edge, the table's near lip (L5) and an inkwell as near occluders */
const ROOM_POOL: Camera3 = { x: 640, y: 416, z: 280, lens: 1 };
/** after the move settles, a slow ~5% push in on the three for the rest of L0304 (life, not a move) */
const ROOM_PUSH: Camera3 = { x: 640, y: 420, z: 280 + (1000 - 280) * (1 - 1 / 1.05), lens: 1 };
const ROOM_CAMS = [ROOM_CARD0, ROOM_CARD1, ROOM_POOL, ROOM_PUSH];
const TABLE_Y = 470;
const roomCam = (scene: Scene, t: number): Camera3 => {
  const a = scene.wipe0, b = scene.blame - 0.1;
  if (t < b) return mixCam(ROOM_CARD0, ROOM_CARD1, sm((t - a) / Math.max(0.1, b - a)));
  const settle = b + 1.8;
  if (t < settle) return mixCam(ROOM_CARD1, ROOM_POOL, easeIO((t - b) / (settle - b)));
  return mixCam(ROOM_POOL, ROOM_PUSH, sm((t - settle) / Math.max(0.1, scene.D - settle)));
};

function quoteStage(f: Frame, scene: Scene, t: number, tq: number, cardOut: number) {
  f.camera(roomCam(scene, t));
  const pool = win(t, scene.blame + 0.05, scene.blame + 0.9);
  // 'fed the hype': the sentence's conclusion is one soft rise of the shared pool (all three brighten together)
  const rise = win(t, scene.fed - 0.1, scene.fed + 0.5);
  f.backlight({ sunX: 120, sunY: 330, sunRadius: 520, intensity: 0.42 });

  // L2: the back wall, a tall sash window HOLE at left (dawn through it), panelling and a radiator
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, ROOM_CAMS, 80);
    bake(f, c, `${ID}/room-L2/${env.mood.id}`, r, (cc) => {
      const wall = env.fill('set');
      const WX = 24, WW = 220, WY = -260, WH = 780;
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(WX, WY, WW, WH);
      cc.fill('evenodd');
      // sash bars: two sashes, six lights each
      cc.fillStyle = wall;
      cc.fillRect(WX, WY + WH / 2 - 7, WW, 14);
      for (let k = 1; k < 3; k++) cc.fillRect(WX + (WW * k) / 3 - 3, WY, 6, WH);
      for (let k = 1; k < 6; k++) if (k !== 3) cc.fillRect(WX, WY + (WH * k) / 6 - 2.5, WW, 5);
      // a half-drawn blind at the window head
      cc.fillRect(WX - 6, WY, WW + 12, 120);
      cc.fillStyle = withAlpha(env.mood.rim, 0.16);
      cc.fillRect(WX - 6, WY + 118, WW + 12, 2);
      // panelling: a dado rail and tall panels (faint cut-lines)
      cc.fillStyle = mixLab(wall, env.mood.fg, 0.3);
      cc.fillRect(r.x, 560, r.w, r.y + r.h - 560);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
      cc.lineWidth = 1.2;
      for (let x = -120; x < r.x + r.w; x += 300) cc.strokeRect(x, -120, 240, 640);
      cc.fillStyle = withAlpha(env.mood.rim, 0.12);
      cc.fillRect(r.x, 558, r.w, 1.5);
      // round 1 far plane for the tableau: a dim wall shelf of files and books behind the table (set value, a
      // faint lit top edge), and a second, narrower sash window at right with its mullions
      const SH = { x: 300, y: 296, w: 680 };
      cc.fillStyle = mixLab(wall, env.mood.fg, 0.4);
      cc.fillRect(SH.x, SH.y, SH.w, 9);
      cc.fillRect(SH.x + 30, SH.y + 9, 8, 26);
      cc.fillRect(SH.x + SH.w - 38, SH.y + 9, 8, 26);
      let bx = SH.x + 16;
      let bi = 0;
      while (bx < SH.x + SH.w - 20) {
        const bw = 10 + 12 * h01(bi, 61);
        const bh = 46 + 34 * h01(bi, 62);
        const lean = h01(bi, 63) > 0.86;
        if (h01(bi, 64) > 0.9) {
          bx += 34;
          bi++;
          continue;
        }
        cc.save();
        cc.translate(bx, SH.y);
        if (lean) cc.rotate(0.18);
        cc.fillRect(0, -bh, bw, bh);
        cc.restore();
        bx += bw + 1.5;
        bi++;
      }
      cc.fillStyle = withAlpha(env.mood.rim, 0.14);
      cc.fillRect(SH.x, SH.y, SH.w, 1.4);
      {
        const X2 = 1010, W2 = 150, Y2 = -60, H2 = 560;
        cc.fillStyle = wall;
        cc.save();
        cc.globalCompositeOperation = 'destination-out';
        cc.fillRect(X2, Y2, W2, H2);
        cc.restore();
        cc.fillRect(X2, Y2 + H2 / 2 - 6, W2, 12);
        cc.fillRect(X2 + W2 / 2 - 3, Y2, 6, H2);
        for (let k = 1; k < 4; k++) if (k !== 2) cc.fillRect(X2, Y2 + (H2 * k) / 4 - 2.5, W2, 5);
        cc.fillRect(X2 - 8, Y2 + H2, W2 + 16, 12);
      }
      // a radiator under the window
      cc.fillStyle = mixLab(wall, env.mood.fg, 0.45);
      for (let k = 0; k < 11; k++) cc.fillRect(WX + 6 + k * 22, 560, 15, 96);
      cc.fillRect(WX, 572, WW, 8);
    });
  });
  f.fog({ yCenter: 0.5 * 720, height: 0.5 * 720, alpha: 0.18, drift: 5 });
  // L3: a tall filing cabinet at right
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, ROOM_CAMS, 60);
    bake(f, c, `${ID}/room-L3/${env.mood.id}`, r, (cc) => {
      const ink = env.fill('set');
      cc.fillStyle = ink;
      cc.fillRect(1100, 96, 250, 560);
      cc.fillRect(1084, 86, 282, 14);
      cc.fillStyle = withAlpha(env.mood.rim, 0.14);
      for (let k = 0; k < 4; k++) {
        cc.fillRect(1116, 120 + k * 132, 218, 1.4);
        cc.fillRect(1150, 160 + k * 132, 50, 6);
      }
      cc.fillRect(1100, 96, 1.5, 560);
    });
  });
  f.fog('B');

  // L4: the table, the card standing on it, the lamp, and (from 'fairness') the pool and the trio
  f.layer('L4', (c, env) => {
    const P = env.mood;
    const fr = overscan(LAYERS.L4, ROOM_CAMS, 60);
    // the table top (seen from a little above): dark, its far edge catching a line of light
    const tg = c.createLinearGradient(0, TABLE_Y, 0, fr.y + fr.h);
    tg.addColorStop(0, mixLab(P.fg, P.set, 0.5));
    tg.addColorStop(1, mixLab(P.fg, P.set, 0.26));
    c.fillStyle = tg;
    c.fillRect(fr.x, TABLE_Y, fr.w, fr.y + fr.h - TABLE_Y);
    c.fillStyle = withAlpha(P.rim, 0.12 + 0.12 * pool);
    c.fillRect(fr.x, TABLE_Y, fr.w, 1.4);
    // the pool: one even, soft ELLIPSE on the table (~520 x 140, radial falloff), centred on the trio's
    // midpoint so all three stand equally in it (no hard key, no villain shadows)
    if (pool > 0.01) {
      const pa = pool * (1 + 0.3 * rise);
      c.save();
      c.translate(POOL.x, POOL.y);
      c.scale(1, 150 / 600);
      // an EVEN plateau (flat across all three objects), falling off only beyond them
      const g = c.createRadialGradient(0, 0, 6, 0, 0, 380);
      g.addColorStop(0, withAlpha(mixLab(P.halo, P.rim, 0.2), 0.42 * pa));
      g.addColorStop(0.62, withAlpha(mixLab(P.halo, P.rim, 0.2), 0.4 * pa));
      g.addColorStop(0.85, withAlpha(P.halo, 0.12 * pa));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(-380, -380, 760, 760);
      c.restore();
      // the haze cone under the lamp: faint (0.12) with feathered edges (blur baked in), so the pool has a source
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = Math.min(1, pa);
      f.cached(`${ID}/cone2/${P.id}`, 900, 460, (cc) => {
        const cx = 450;
        const g2 = cc.createLinearGradient(0, 30, 0, 390);
        g2.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.3), 0.12));
        g2.addColorStop(0.75, withAlpha(P.halo, 0.07));
        g2.addColorStop(1, withAlpha(P.halo, 0));
        cc.fillStyle = g2;
        cc.beginPath();
        cc.moveTo(cx - 34, 26);
        cc.lineTo(cx + 34, 26);
        cc.lineTo(cx + 280, 380);
        cc.lineTo(cx - 280, 380);
        cc.closePath();
        cc.fill();
      }, { blur: 36 })(c, LAMP.x - 450, LAMP.y - 12);
      c.restore();
    }
    // the lamp: a cord from above and an enamel shade, hung over the middle of the table (dark until 'fairness')
    c.fillStyle = P.ink;
    c.fillRect(LAMP.x - 1.2, fr.y, 2.4, LAMP.y - 16 - fr.y);
    c.beginPath();
    c.moveTo(LAMP.x - 9, LAMP.y - 30);
    c.lineTo(LAMP.x + 9, LAMP.y - 30);
    c.lineTo(LAMP.x + 12, LAMP.y - 18);
    c.quadraticCurveTo(LAMP.x + 40, LAMP.y - 10, LAMP.x + 48, LAMP.y + 12);
    c.lineTo(LAMP.x - 48, LAMP.y + 12);
    c.quadraticCurveTo(LAMP.x - 40, LAMP.y - 10, LAMP.x - 12, LAMP.y - 18);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(P.rim, 0.2 + 0.25 * pool);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(LAMP.x - 46, LAMP.y + 11);
    c.lineTo(LAMP.x + 46, LAMP.y + 11);
    c.stroke();

    // the three, each lifting a little into the pool on its noun (landing ON the word), ending level
    const lift = (at: number) => sm((tq - (at - 0.28)) / 0.45);
    const lc = lift(scene.navy), lp = lift(scene.papers), ls = lift(scene.own);
    // each object: a tight, dark contact shadow at its foot (a wider soft one under it), then the object, which
    // may LEAN a few degrees about its foot
    const at = (x: number, u: number, halfW: number, lean: number, draw: () => void) => {
      c.save();
      c.translate(x, TRIO.base + (1 - u) * 26);
      c.save();
      c.globalAlpha *= u;
      c.translate(0, -(1 - u) * 26 + 1);
      c.scale(1, 0.1);
      const sh = c.createRadialGradient(0, 0, 4, 0, 0, halfW * 1.25);
      sh.addColorStop(0, withAlpha(P.ink, 0.75));
      sh.addColorStop(0.6, withAlpha(P.ink, 0.35));
      sh.addColorStop(1, withAlpha(P.ink, 0));
      c.fillStyle = sh;
      c.fillRect(-halfW * 1.3, -halfW * 1.3, halfW * 2.6, halfW * 2.6);
      c.restore();
      c.rotate(lean);
      c.scale(TRIO.k, TRIO.k);
      draw();
      c.restore();
    };
    if (lc > 0) at(TRIO.cap, lc, 80, 0, () => navalCap(c, P, 0, 0, lc));
    if (lp > 0) at(TRIO.card, lp, 76, -0.07, () => miniPaper(c, P, 0, 0, lp));
    if (ls > 0) at(TRIO.slip, ls, 56, 0.06, () => slip(c, P, 0, 0, ls));

    // the quote card, standing on the table (on 'fairness' it tips and slides away left)
    if (cardOut < 1) {
      c.save();
      const tip = sm(cardOut / 0.35);
      const go = cardOut * cardOut * (1.6 - 0.6 * cardOut);
      c.translate(CARD_W.x - go * 1350, CARD_W.y + go * 40);
      c.rotate(-0.026 - tip * 0.08);
      parchment(f, c, P, CARD_W.w, CARD_W.h);
      const ink = withAlpha('#1d1712', 0.92);
      const size = 35;
      c.font = `400 ${size}px ${FONT.typewriter}`;
      const adv = c.measureText('M').width * 1.02;
      // round 1: the clause visibly brightens on 'conscious' (eased in over 0.4 s): the rest of the sheet dims a
      // touch and a warm halo (≈1.5x the paper's value) blooms behind the words
      const glow = win(t, scene.conscious, scene.conscious + 0.4);
      if (glow > 0.01) {
        c.save();
        const vg = c.createRadialGradient(0, 42, 60, 0, 30, CARD_W.w * 0.62);
        vg.addColorStop(0, withAlpha('#2a2016', 0));
        vg.addColorStop(1, withAlpha('#2a2016', 0.2 * glow));
        c.fillStyle = vg;
        c.fillRect(-CARD_W.w / 2, -CARD_W.h / 2, CARD_W.w, CARD_W.h);
        c.restore();
      }
      // typed copy: every line starts at ONE left margin, fixed from the first frame (the block is centred as a
      // whole on the longest line), so nothing shifts as the words strike
      const longest = Math.max(...LEDE.map((ln) => ln.map((w) => w.text).join(' ').length));
      const margin = -(adv * longest) / 2;
      LEDE.forEach((line, li) => {
        const text = line.map((w) => w.text).join(' ');
        const total = adv * text.length;
        let x = margin;
        const y = -76 + li * 59;
        // the last clause glows faintly: the paper behind it brightens, and the struck type takes a warm cast
        if (li === 2 && glow > 0.01) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.translate(margin + total / 2, y - 11);
          c.scale(1, 0.2);
          const gg = c.createRadialGradient(0, 0, 8, 0, 0, total * 0.66);
          gg.addColorStop(0, withAlpha('#ffc86a', 0.5 * glow));
          gg.addColorStop(0.55, withAlpha('#f2b45a', 0.28 * glow));
          gg.addColorStop(1, withAlpha('#f2b45a', 0));
          c.fillStyle = gg;
          c.fillRect(-total, -total * 1.2, total * 2, total * 2.4);
          c.restore();
          c.shadowColor = withAlpha('#d8952e', 0.7 * glow);
          c.shadowBlur = 14 * f.pxScale;
        }
        line.forEach((w, wi) => {
          const wt = scene.words[li][wi] - 0.06;
          const n = Math.max(0, Math.min(w.text.length, Math.floor((tq - wt) * 30 + 1e-6) + 1));
          const shown = tq >= wt ? n : 0;
          // the opening “... is already struck when the card appears (three struck periods: a typewriter has no …)
          const pre = li === 0 && wi === 0 ? 4 : 0;
          typedLine(c, w.text, x, y, { size, color: ink, shown: Math.max(pre, shown), seed: li * 40 + wi * 7 });
          x += adv * (w.text.length + 1);
        });
        c.shadowBlur = 0;
        c.shadowColor = 'rgba(0,0,0,0)';
      });
      const atA = win(t, scene.card + 0.3, scene.card + 0.9);
      c.globalAlpha = atA;
      c.font = `italic 400 22px ${FONT.text}`;
      c.textAlign = 'center';
      c.fillStyle = withAlpha('#2a211b', 0.85);
      c.fillText('— UPI in The New York Times, 8 July 1958', 0, 134);
      c.restore();
    }
  });
  f.practical({ x: LAMP.x, y: LAMP.y + 14, kind: 'lamp', seed: 1958, intensity: 0.08 + (0.62 + 0.18 * rise) * pool, radius: 64 });

  // L5: the table's near lip and an inkwell, blurred, brought into frame by the pull-back
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, ROOM_CAMS, 60);
    bake(f, c, `${ID}/room-L5/${env.mood.id}`, r, (cc) => {
      const fg = env.fill('fg');
      cc.fillStyle = fg;
      cc.fillRect(r.x, 578, r.w, r.y + r.h - 578);
      cc.fillStyle = withAlpha(env.mood.rim, 0.26);
      cc.fillRect(r.x, 578, r.w, 1.8);
      // inkwell (squat, a domed lid), at the left end of the lip
      cc.fillStyle = fg;
      cc.beginPath();
      cc.roundRect(318, 538, 64, 42, 6);
      cc.fill();
      cc.beginPath();
      cc.ellipse(350, 538, 22, 9, 0, Math.PI, 0);
      cc.fill();
      cc.fillRect(344, 520, 12, 12);
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.fillRect(380, 540, 1.5, 36);
      // a pen lying along the lip at right
      cc.fillStyle = fg;
      cc.save();
      cc.translate(900, 574);
      cc.rotate(-0.05);
      cc.fillRect(0, -5, 120, 7);
      cc.restore();
    });
  });
}

function parchment(f: Frame, c: C, P: Palette, w: number, h: number) {
  // the card sits IN the room: a soft drop shadow down-right on the table/wall, then the baked sheet (grain,
  // fibres, deckle, ruled border, and the lamp's falloff: brighter top-centre, ~12% darker at the corners)
  softPlate(c, 16, 26, w + 110, h + 80, P.ink, 0.55);
  const pad = 8;
  f.cached(`${ID}/parchment/${P.id}/${w}x${h}`, w + pad * 2, h + pad * 2, (cc) => {
    cc.translate(w / 2 + pad, h / 2 + pad);
    parchmentSheet(cc, w, h);
  })(c, -w / 2 - pad, -h / 2 - pad);
}
function parchmentSheet(c: C, w: number, h: number) {
  c.save();
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#e6d8b8');
  g.addColorStop(1, '#d6c49c');
  c.fillStyle = g;
  c.beginPath();
  // a deckled edge
  const steps = 60;
  for (let i = 0; i <= steps; i++) c.lineTo(-w / 2 + (w * i) / steps, -h / 2 + (h01(i, 5) - 0.5) * 3);
  for (let i = 0; i <= steps / 2; i++) c.lineTo(w / 2 + (h01(i, 6) - 0.5) * 3, -h / 2 + (h * i) / (steps / 2));
  for (let i = steps; i >= 0; i--) c.lineTo(-w / 2 + (w * i) / steps, h / 2 + (h01(i, 7) - 0.5) * 3);
  for (let i = steps / 2; i >= 0; i--) c.lineTo(-w / 2 + (h01(i, 8) - 0.5) * 3, -h / 2 + (h * i) / (steps / 2));
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  // grain: seeded speckle and short fibres
  for (let i = 0; i < 1400; i++) {
    const x = -w / 2 + h01(i, 81) * w, y = -h / 2 + h01(i, 82) * h;
    const d = h01(i, 83);
    c.fillStyle = d > 0.5 ? withAlpha('#7a6446', 0.05 + 0.07 * d) : withAlpha('#fff6de', 0.06 + 0.08 * d);
    if (i % 5 === 0) c.fillRect(x, y, 3 + 9 * h01(i, 84), 0.7);
    else c.fillRect(x, y, 1.1, 1.1);
  }
  // deckle shading: the edges a touch darker and warmer
  const e = c.createRadialGradient(0, -h * 0.25, Math.min(w, h) * 0.3, 0, 0, Math.hypot(w, h) * 0.56);
  e.addColorStop(0, 'rgba(255,248,226,0.10)');
  e.addColorStop(0.55, 'rgba(0,0,0,0)');
  e.addColorStop(1, 'rgba(60,40,20,0.16)');
  c.fillStyle = e;
  c.fillRect(-w / 2, -h / 2, w, h);
  const edge = 18;
  for (const [x, y, ww, hh, x2, y2] of [
    [-w / 2, -h / 2, w, edge, 0, edge],
    [-w / 2, h / 2 - edge, w, edge, 0, -edge],
  ] as const) {
    const lg = c.createLinearGradient(0, y + (y2 < 0 ? edge : 0), 0, y + (y2 < 0 ? 0 : edge));
    lg.addColorStop(0, 'rgba(90,64,34,0.14)');
    lg.addColorStop(1, 'rgba(90,64,34,0)');
    c.fillStyle = lg;
    c.fillRect(x, y, ww, hh);
    void x2;
  }
  c.restore();
  // a ruled border, faint
  c.strokeStyle = withAlpha('#5a4a36', 0.35);
  c.lineWidth = 1.2;
  c.strokeRect(-w / 2 + 26, -h / 2 + 26, w - 52, h - 52);
  c.restore();
}

/** a plain naval officer's peaked cap (no insignia) seen in THREE-QUARTER view from a little above, ~160 wide:
 *  the white-topped crown as a wide oval (its welt catching the lamp), the bulge of the crown over the band,
 *  the band as a short curved cylinder, and the patent peak projecting toward the lens-left as a crescent;
 *  a chin-cord across the band's front between two small buttons */
function navalCap(c: C, P: Palette, x: number, y: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  const ink = P.ink;
  // the peak (behind the band's lower edge, projecting forward-left and down to the table)
  c.fillStyle = mixLab(ink, '#000', 0.2);
  c.beginPath();
  c.moveTo(-56, -16);
  c.bezierCurveTo(-92, -8, -104, 4, -80, 6);
  c.bezierCurveTo(-40, 9, 20, 6, 44, -2);
  c.bezierCurveTo(30, -8, 0, -12, -56, -16);
  c.closePath();
  c.fill();
  // the patent peak's gloss: a thin bright crescent along its front edge
  c.strokeStyle = withAlpha(P.rim, 0.75);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-96, 2);
  c.bezierCurveTo(-60, 8, 10, 6, 40, -1);
  c.stroke();
  // the band: a cylinder segment, its bottom edge an ellipse arc
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-60, -40);
  c.lineTo(-60, -14);
  c.ellipse(0, -14, 60, 10, 0, Math.PI, 0, true);
  c.lineTo(60, -40);
  c.closePath();
  c.fill();
  // the crown: a bulge over the band, then the top oval (seen from above)
  c.beginPath();
  c.moveTo(-60, -38);
  c.bezierCurveTo(-74, -44, -84, -54, -80, -62);
  c.ellipse(0, -64, 80, 22, 0, Math.PI, 0, false);
  c.bezierCurveTo(84, -54, 74, -44, 60, -38);
  c.closePath();
  c.fill();
  // the top of the crown catches the lamp (a cover lighter than the band, still a silhouette value)
  c.fillStyle = mixLab(ink, P.rim, 0.16);
  c.beginPath();
  c.ellipse(0, -64, 74, 18, 0, 0, Math.PI * 2);
  c.fill();
  // cut-lines: the welt round the crown's oval (lit on the lamp side), the band's top and bottom, the peak's
  // edge, the chin-cord, two buttons
  c.strokeStyle = withAlpha(P.rim, 0.6);
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(0, -64, 80, 22, 0, Math.PI * 1.02, Math.PI * 1.98);
  c.stroke();
  c.strokeStyle = withAlpha(P.rim, 0.3);
  c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(0, -64, 80, 22, 0, 0.05, Math.PI - 0.05);
  c.stroke();
  c.strokeStyle = withAlpha(P.rim, 0.4);
  c.beginPath();
  c.ellipse(0, -40, 60, 9, 0, 0.1, Math.PI - 0.1);
  c.moveTo(-60, -14);
  c.ellipse(0, -14, 60, 10, 0, Math.PI, 0, true);
  c.stroke();
  c.strokeStyle = withAlpha(P.rim, 0.5);
  c.beginPath();
  c.moveTo(-56, -15);
  c.bezierCurveTo(-30, -11, 10, -10, 40, -4);
  c.stroke();
  c.strokeStyle = withAlpha(P.rim, 0.35);
  c.beginPath();
  c.moveTo(-46, -22);
  c.bezierCurveTo(-20, -16, 20, -16, 46, -22);
  c.stroke();
  c.fillStyle = withAlpha(P.rim, 0.5);
  for (const bx of [-46, 46]) {
    c.beginPath();
    c.arc(bx, -22, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the press: the same morning paper, folded in half and stood on the table — a masthead band, the headline in
 *  miniature (NEW NAVY DEVICE / LEARNS BY DOING, the paper's own type), hatched columns, the fold at its foot */
function miniPaper(c: C, P: Palette, x: number, y: number, a: number) {
  const W = 176, H = 132;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.scale(0.86, 0.86);
  softPlate(c, 0, -H / 2, W + 60, H + 50, P.fg, 0.35);
  c.fillStyle = mixLab('#d9d4c4', P.halo, 0.2);
  c.fillRect(-W / 2, -H, W, H);
  // the fold's thickness at the foot
  c.fillStyle = withAlpha(P.ink, 0.3);
  c.fillRect(-W / 2, -4, W, 4);
  const ink = '#1b1814';
  // masthead: a blackletter-shaped band of strokes (no legible title), rules above and below
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(-W / 2 + 8, -H + 8, W - 16, 1.2);
  for (let k = 0; k < 15; k++) {
    const hh = 10 + 4 * h01(k, 71);
    c.fillRect(-W / 2 + 24 + k * 8.6, -H + 13 + (14 - hh), 5.2, hh);
    if (h01(k, 72) > 0.5) c.fillRect(-W / 2 + 22 + k * 8.6, -H + 12, 9, 2);
  }
  c.fillRect(-W / 2 + 8, -H + 32, W - 16, 1.6);
  c.fillRect(-W / 2 + 8, -H + 35, W - 16, 0.6);
  // the headline in miniature
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `700 17px ${FONT.display}`;
  c.fillText('NEW NAVY DEVICE', 0, -H + 56);
  c.fillText('LEARNS BY DOING', 0, -H + 74);
  c.fillRect(-W / 2 + 8, -H + 80, W - 16, 0.8);
  // hatched body columns and a photo block
  c.fillStyle = withAlpha(ink, 0.32);
  for (let col = 0; col < 4; col++) {
    const x0 = -W / 2 + 10 + col * 40;
    for (let ln = 0; ln < 9; ln++) {
      if (col === 1 && ln < 6) continue;
      c.fillRect(x0, -H + 86 + ln * 4.4, 34 - (ln % 5 === 4 ? 10 : 0), 1.5);
    }
  }
  c.fillStyle = withAlpha(ink, 0.5);
  c.fillRect(-W / 2 + 50, -H + 86, 34, 24);
  c.restore();
}

/** Rosenblatt's own slip, summer 1958: a tall ruled note in his hand, hatched and illegible (never quoted) */
function slip(c: C, P: Palette, x: number, y: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y - 78);
  c.rotate(0.02);
  softPlate(c, 0, 8, 190, 220, P.fg, 0.45);
  c.fillStyle = '#d5d2c2';
  c.fillRect(-56, -78, 112, 156);
  // (round 1: no letterhead: the whole slip is hatched hand, illegible, never quoted)
  // faint rules, a margin line
  c.fillStyle = withAlpha('#5c6a70', 0.35);
  for (let k = 0; k < 8; k++) c.fillRect(-56, -46 + k * 15, 112, 0.8);
  c.fillStyle = withAlpha('#7a5a50', 0.35);
  c.fillRect(-40, -60, 0.8, 138);
  // the hand: looping hatched strokes along the rules, ending short
  c.strokeStyle = withAlpha('#2a2018', 0.72);
  c.lineWidth = 1.2;
  for (let k = 0; k < 6; k++) {
    const y0 = -49 + k * 15;
    c.beginPath();
    c.moveTo(-36, y0);
    const end = k === 5 ? 0 : 46 - 14 * h01(k, 4);
    for (let xx = -36; xx < end; xx += 3.6) {
      const s2 = Math.round((xx + 36) / 3.6);
      c.lineTo(xx, y0 - (s2 % 2 === 0 ? 4.5 * h01(k * 50 + s2, 9) : 0) + (h01(k * 60 + s2, 10) - 0.5) * 1.5);
    }
    c.stroke();
  }
  // his signature: the initials F.R. in a quick hand, with a looping underline flourish
  c.fillStyle = withAlpha('#211810', 0.85);
  c.font = `italic 600 21px ${FONT.text}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('F. R.', 2, 60);
  c.strokeStyle = withAlpha('#211810', 0.7);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(2, 65);
  c.bezierCurveTo(16, 70, 34, 62, 48, 64);
  c.bezierCurveTo(54, 65, 50, 58, 44, 60);
  c.stroke();
  c.restore();
}
