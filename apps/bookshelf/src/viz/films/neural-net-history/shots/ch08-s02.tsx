/**
 * ch08-s02 — Toronto, 2011: Sutskever talks Krizhevsky into trying; two gaming cards spin up in a desktop tower,
 * and the desk lamp clicks off onto a green status LED (candleAmber, the same lamp; 13.08 s; in: plain cut).
 *
 *   0             a paper-cut bedroom at night: a window onto a dark street, a desk, a desk lamp, the tower on the
 *                 floor. Krizhevsky seen only from behind at the desk, typing; the monitor's light rims him
 *   'Hinton's'    a pre-roll glow gathers at the upper frame edge (the supervisor's lab is named, not placed)
 *   'Sutskever'   TORONTO · 2011; his name card; he stands at Krizhevsky's shoulder and leans in toward the screen,
 *                 a few small hand beats on the stressed words ('sure', 'data', 'talked')
 *   'Krizhevsky'  his name card; a separate round lantern-slide inset opens at the upper edge: Hinton, standing
 *                 alone at a lectern-height desk (name card: Geoffrey Hinton, supervisor). It closes before the tilt;
 *                 he never enters the room
 *   line end      BEDROOM (CHM) · LAB (NVIDIA) rises (both sources, equal weight) as the camera tilts down to the
 *                 tower's side window: two consumer cards, fans spinning up; 2 × GTX 580 · 3 GB
 *   'match'       the desk lamp clicks off and the cut matches its circle of light to a single green status LED on
 *                 a card, glowing in the dark (the LED sits where ch08-s03's Mark I cell will be)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, Pose } from '../../../film';
import { createPuppet, defineShot, makeEnv, nameCard, placeStamp, pose, withLife, PUPPET_NEAR_BLACK, withAlpha, mixLab, anglepoiseLamp, gpuCard, legibleSize, FONT } from '../../../film';
import { cast } from '../cast';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { monoCard } from '../sets/ch07-s01-kit';
import { GREEN, GREEN_CORE, LED_SCREEN, clamp01, lerp, mixCam, sm, tq12, win } from '../sets/ch08-s01-kit';
import { BR, POOL, bedroomBack, chairBack, deskAndMonitor, fanPhase, lampPool, seatedFromBehind, towerWithCards } from '../sets/ch08-s02-bedroom';
import { toLayer, LAYERS } from '../../../film';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s02';

/** the desk group (desk, monitor, chair, tower) sits on the right third; the window and Sutskever on the left; a
 *  blurred doorframe (L5) at the left edge parallaxes against the room as the camera dollies in */
const C0: Camera3 = { x: 676, y: 384, z: 40, lens: 1 };
const C1: Camera3 = { x: 712, y: 394, z: 150, lens: 1 };
/** the move to the tower: a truck right that LEADS (so the seated figure slides out of frame left while he is still
 *  small, never a black mass), a tilt down ≈ 200 px onto the floor-standing tower, and the dolly in last. It ends with
 *  the lamp's circle on the match point, LED_SCREEN (shared with ch08-s03). */
const TZ = 560;
const TS = 1000 / (1000 - TZ);
const CT: Camera3 = { x: POOL.x - (LED_SCREEN.x - 640) / TS, y: POOL.y - (LED_SCREEN.y - 360) / TS, z: TZ, lens: 1 };
const CAMS = [C0, C1, CT];
const LAMP = { x: BR.lampX, y: BR.desk.top, s: 1.25, reach: 0.95, aim: 0.25, flip: false };

// the macro after the cut: a card, huge, its LED on the match point
const CARD_S = 9.5;
/** gpuCard's body in prop units (props/modern.ts GPU: L 27, H 11.4) */
const GPU_L = 27 * (320 / 175);
const GPU_H = 11.4 * (320 / 175);
const LED_W = { x: LED_SCREEN.x, y: LED_SCREEN.y };
const LED_OFF = gpuCard.anchors({ x: 0, y: 0, s: CARD_S, fans: 1 }).led;
const CARD_AT = { x: LED_W.x - LED_OFF.x, y: LED_W.y - LED_OFF.y };

/** Sutskever for this shot: the cast signature (slight, close-cropped, plain dark shirt) a little fuller in the torso
 *  so he holds his own beside the seated figure and the furniture, with three cut-lines (placket, hem, collar) */
const SUTS = createPuppet({ ...cast.sutskever.spec, id: 'sutskever-ch08-s02', build: 'average', details: ['placket', 'beltLine', 'collar'] });
const SX = 566;
const STAND: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 0, neck: 8, head: -4, shoulderF: 4, elbowF: 18, wristF: 6, shoulderB: -8, elbowB: 14 });
const STAND_TURN: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 3, neck: 10, head: 6, shoulderF: 8, elbowF: 22, wristF: 4, shoulderB: -8, elbowB: 14 });
const LEAN: Pose = pose({ hipF: 8, kneeF: -6, hipB: -8, kneeB: -2, torso: 15, neck: 2, head: 8, shoulderF: 30, elbowF: 40, wristF: -10, shoulderB: -16, elbowB: 22 }, { handF: 'relaxed' });
const LEAN_POINT: Pose = pose({ hipF: 8, kneeF: -6, hipB: -8, kneeB: -2, torso: 16, neck: 2, head: 6, shoulderF: 62, elbowF: 18, wristF: -6, shoulderB: -16, elbowB: 22 }, { handF: 'point' });
const LEAN_OPEN: Pose = pose({ hipF: 8, kneeF: -6, hipB: -8, kneeB: -2, torso: 14, neck: 3, head: 4, shoulderF: 42, elbowF: 54, wristF: -24, shoulderB: -16, elbowB: 22 }, { handF: 'open' });
const LIGHT = { x: 1, y: -0.3, floor: 0.12 };
/** the doorframe (L5 world): its inner edge sits at screen x ≈ 84 at C0 */
const DOOR = (() => {
  const p = toLayer(LAYERS.L5, C0, 84, 0);
  return { x: p.x - 30, y: p.y, w: 30 };
})();

interface B {
  D: number;
  hinton: number;
  ilya: number;
  alex: number;
  insetOff: number;
  lab: number;
  cards: number;
  tilt0: number;
  tilt1: number;
  match: number;
  beats: [number, Pose][];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ilya = T.beat('ilya');
    const cards = T.beat('cards');
    const b: B = {
      D,
      hinton: T.word('L0803', "Hinton's"),
      ilya,
      alex: T.beat('alex'),
      // the inset opens in 0.25 s on his name and holds, full, until just before the tilt's cards beat
      insetOff: cards - 0.04,
      lab: T.beat('lab'),
      cards,
      tilt0: T.beat('lab') + 0.05,
      tilt1: T.beat('lab') + 1.7,
      match: T.beat('match'),
      // he turns his head to the screen on his name, LEANS IN on 'sure' (his conviction), opens a hand on 'data',
      // points at the screen on 'talked', and settles on 'trying'
      beats: [
        [0, STAND],
        [ilya + 0.05, STAND_TURN],
        [T.word('L0803', 'sure') - 0.16, LEAN],
        [T.word('L0803', 'data') - 0.15, LEAN_OPEN],
        [T.word('L0803', 'talked') - 0.1, LEAN_POINT],
        [T.word('L0803', 'trying') + 0.2, LEAN],
      ],
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    if (t < b.match) paintRoom(f, t, b);
    else paintMacro(f, t, b);
    // ---- type (screen-locked)
    const env = { t, mood: f.mood };
    placeStamp(f.c, { place: 'TORONTO', date: '2011', year: 2011, at: 0.1 }, env);
    nameCard(f.c, { name: 'Ilya Sutskever', role: 'graduate student', at: b.ilya - 0.19, y: 556 }, env);
    nameCard(f.c, { name: 'Alex Krizhevsky', role: 'graduate student', at: b.alex, y: 556, dur: b.insetOff - b.alex + 0.1 }, env);
    hintonInset(f, t, b);
    // both labels at the legibility floor (22 px cap at 1080p); the two sources keep equal type weight
    const ls = legibleSize(f.c, `500 20px ${FONT.mono}`, 20);
    const la = win(t, b.lab, b.lab + 0.5);
    if (la > 0) monoCard(f.c, { x: 292, y: 72, lines: ['BEDROOM (CHM) · LAB (NVIDIA)'], size: ls, alpha: la, rise: la, seed: 82 }, f.mood);
    const ga = win(t, b.cards + 0.35, b.cards + 0.85);
    if (ga > 0) monoCard(f.c, { x: 1030, y: 548, lines: ['2 × GTX 580 · 3 GB'], size: ls, alpha: ga, rise: ga, seed: 83 }, f.mood);
  },
});

// ================================================================================================= THE ROOM
function camAt(t: number, b: B): Camera3 {
  const a = mixCam(C0, C1, sm(t / b.tilt0));
  const u = clamp01((t - b.tilt0) / (b.tilt1 - b.tilt0));
  // the truck leads, the tilt follows, the dolly comes last (so the chair leaves frame left while still small)
  const ux = sm(Math.min(1, u * 1.55));
  const uy = sm(clamp01((u - 0.05) / 0.8));
  const uz = sm(clamp01((u - 0.38) / 0.62));
  return { x: lerp(a.x, CT.x, ux), y: lerp(a.y, CT.y, uy), z: lerp(a.z, CT.z, uz), lens: 1 };
}

function suts(tq: number, b: B): Pose {
  let i = 0;
  while (i < b.beats.length - 1 && tq >= b.beats[i + 1][0]) i++;
  const [t0, p0] = b.beats[i];
  if (i === 0 && tq < b.beats[1][0] - 0.5) return p0;
  const prev = i === 0 ? p0 : b.beats[i - 1][1];
  const u = sm((tq - t0) / 0.42);
  return blend(prev, p0, u);
}
function blend(a: Pose, b: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const angles: Pose['angles'] = {};
  for (const k of new Set([...Object.keys(a.angles), ...Object.keys(b.angles)]) as Set<keyof Pose['angles']>) angles[k] = lerp(a.angles[k] ?? 0, b.angles[k] ?? 0, u);
  return { ...b, angles, handF: u < 0.5 ? a.handF : b.handF };
}

function paintRoom(f: Frame, t: number, b: B) {
  const cam = camAt(t, b);
  f.camera(cam);
  const tq = tq12(t);
  // a dark street at night: the sky behind the glass is low (the monitor and the desk lamp are the key lights)
  f.backlight({ sunX: 520, sunY: 420, sunRadius: 300, intensity: 0.06 });
  bedroomBack(f, ID, CAMS, cam);
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.18, drift: 5 });
  f.layer('L3', (c, env) => {
    // the corner of a bed beneath the window (generic, minimal)
    c.fillStyle = env.fill('ink');
    c.fillRect(150, 548, 330, 26);
    c.fillRect(150, 520, 24, 120);
    c.beginPath();
    c.ellipse(260, 548, 70, 12, 0, Math.PI, 0);
    c.fill();
  });
  f.fog('B');
  // the monitor's glow sits behind the figures (painted before L4 so it never washes them)
  f.practical({ x: BR.monitor.x, y: BR.monitor.y, kind: 'screen', seed: 822, intensity: 0.75, radius: 120 });
  const lampOn = 1;
  const phase = fanPhase(t, b.cards);
  const fanLit = win(t, b.cards, b.cards + 0.8);
  let bulb = { x: 0, y: 0 };
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    deskAndMonitor(c, env, 1);
    towerWithCards(c, env, phase, 0.3 + 0.7 * fanLit);
    chairBack(c, env);
    seatedFromBehind(c, env, PUPPET_NEAR_BLACK, tq, mixLab(env.mood.rim, '#d7efe9', 0.45));
    anglepoiseLamp(c, { ...LAMP, lit: lampOn > 0 }, env);
    bulb = anglepoiseLamp.anchors(LAMP).bulb;
    lampPool(c, env, bulb, lampOn);
    // Sutskever at his shoulder
    const p = withLife(suts(tq, b), tq, 82);
    SUTS.draw(c, { x: SX, y: BR.floor, facing: 'right', pose: p, ink: PUPPET_NEAR_BLACK, light: LIGHT, edgeRim: { x: 1, y: -0.25, px: 1.5, alpha: 0.65 } }, env);
    void ink;
  });
  f.rim({ x: 0.5, y: -0.85 });
  f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 823, intensity: 0.8, radius: 46 });
  // near: the doorframe at the left edge (we look in from the doorway), the end of the bed frame and a rug edge,
  // blurred; it parallaxes against the room on the dolly and slides out of frame left on the truck to the tower
  f.layer('L5', (c, env) => {
    c.fillStyle = env.fill('fg');
    c.fillRect(-300, 720, 2600, 300);
    const D = DOOR;
    // jamb + architrave with two moulding cut-lines
    c.fillRect(D.x - 400, D.y - 600, 400 + D.w, 1800);
    c.fillStyle = withAlpha(env.mood.rim, 0.16);
    c.fillRect(D.x + D.w - 1, D.y - 600, 1.6, 1800);
    c.fillRect(D.x + D.w - 9, D.y - 600, 1, 1800);
    c.fillStyle = env.fill('fg');
    // the bed's footboard just inside the door
    c.fillRect(D.x + D.w, 640, 90, 120);
    c.fillRect(D.x + D.w + 4, 620, 10, 30);
    c.fillRect(D.x + D.w + 76, 620, 10, 30);
  });
}

// ================================================================================================= THE MACRO
function paintMacro(f: Frame, t: number, b: B) {
  const u = clamp01((t - b.match) / (b.D - b.match));
  // a slow push with the LED as the fixed point
  const z = 40 * sm(u);
  const s = 1000 / (1000 - z);
  const cam: Camera3 = { x: LED_W.x - (LED_W.x - 640) / s, y: LED_W.y - (LED_W.y - 360) / s, z, lens: 1 };
  f.camera(cam);
  f.backlight({ sunX: 640, sunY: 420, sunRadius: 300, intensity: 0.12 });
  f.layer('L2', (c, env) => {
    // the case interior: the motherboard plane, faint traces
    c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
    c.fillRect(-400, -300, 2100, 1400);
    c.strokeStyle = withAlpha(env.mood.rim, 0.06);
    c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k < 18; k++) {
      const y = 80 + k * 34;
      c.moveTo(-100, y);
      c.lineTo(300 + (k % 5) * 40, y);
      c.lineTo(340 + (k % 5) * 40, y + 30);
      c.lineTo(1400, y + 30);
    }
    c.stroke();
  });
  // the second card, one slot below and a little deeper in the case (soft, hazed): the tower holds two
  f.layer('L3', (c, env) => {
    // its shroud one value step lighter than the near card's ink, with a lit top edge and a PCB edge with gold
    // fingers, so it reads as a second whole card on a second plane (not a loose fan)
    // the second card sits in the slot below: its top edge clear of the first card's PCB
    const rx = CARD_AT.x + 22, ry = CARD_AT.y + 250;
    const lighter = mixLab(env.fill('ink'), env.mood.setHaze, 0.3);
    const renv = { ...env, t: fanPhase(t, b.cards) + 0.37, fill: (r: Parameters<typeof env.fill>[0]) => (r === 'ink' ? lighter : env.fill(r)) };
    gpuCard(c, { x: rx, y: ry, s: CARD_S, fans: 1, spin: 1, lit: 0, bracket: true, seed: 8 }, renv);
    const L = GPU_L * CARD_S, H = GPU_H * CARD_S;
    c.fillStyle = withAlpha(env.mood.rim, 0.55);
    c.fillRect(rx - L / 2, ry - H - 1, L, 1.6);
    c.fillStyle = mixLab(lighter, env.mood.set, 0.4);
    c.fillRect(rx - L / 2 + 8, ry, L - 30, 9);
    c.fillStyle = withAlpha(env.mood.halo, 0.22);
    for (let k = 0; k < 26; k++) c.fillRect(rx - L / 2 + 40 + k * 6, ry + 3, 3, 6);
  });
  f.fog({ yCenter: 0.78 * 720, height: 0.3 * 720, alpha: 0.12, drift: 4 });
  f.layer('L4', (c, env) => {
    gpuCard(c, { x: CARD_AT.x, y: CARD_AT.y, s: CARD_S, fans: 1, spin: 1, lit: 0, bracket: true, seed: 7 }, { ...env, t: fanPhase(t, b.cards) });
    // its PCB edge under the shroud, gold fingers catching the LED's spill
    const L = GPU_L * CARD_S;
    c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.3);
    c.fillRect(CARD_AT.x - L / 2 + 8, CARD_AT.y, L - 30, 10);
    c.fillStyle = withAlpha(env.mood.halo, 0.2);
    for (let k = 0; k < 26; k++) c.fillRect(CARD_AT.x - L / 2 + 40 + k * 6, CARD_AT.y + 4, 3, 6);
  });
  f.rim({ x: 0, y: -1 });
  // near: the side panel's window frame at the left and a looped power cable across the upper right, blurred
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5macro2/${env.mood.id}`, 2000, 1200, (g) => {
      g.translate(400, 300);
      g.fillStyle = env.fill('fg');
      // the window frame's edge, a heavy upright with a rounded inner corner
      g.beginPath();
      g.moveTo(-400, -300);
      g.lineTo(150, -300);
      g.lineTo(150, -60);
      g.quadraticCurveTo(150, 10, 104, 10);
      g.lineTo(104, 900);
      g.lineTo(-400, 900);
      g.closePath();
      g.fill();
    }, { blur: 7 })(c, -400, -300);
  });
  // the green status LED: the shot's one saturated accent, a source of its own light
  const ledK = 0.9 + 0.1 * Math.sin(t * 2.1);
  f.layer('L4', (c) => {
    glow(c, LED_W.x, LED_W.y, 150, GREEN, 0.16 * ledK);
    glow(c, LED_W.x, LED_W.y, 44, GREEN, 0.5 * ledK);
    c.fillStyle = GREEN_CORE;
    c.beginPath();
    c.arc(LED_W.x, LED_W.y, 6.5, 0, Math.PI * 2);
    c.fill();
    glow(c, LED_W.x, LED_W.y, 14, GREEN_CORE, 0.8);
  });
}

// ================================================================================================= HINTON INSET
const INSET = { x: 1052, y: 156, r: 104 };
function hintonInset(f: Frame, t: number, b: B) {
  const c = f.c;
  // the pre-roll glow at the upper edge from his name, swelling as the inset arrives
  const pre = 0.22 * win(t, b.hinton, b.hinton + 0.9) + 0.35 * win(t, b.alex - 1.2, b.alex) ;
  const open = sm((t - b.alex) / 0.25) * (1 - sm((t - b.insetOff + 0.25) / 0.25));
  const preK = pre * (1 - win(t, b.alex, b.alex + 0.4)) * (1 - win(t, b.tilt0 - 0.4, b.tilt0));
  if (preK > 0.003) glow(c, INSET.x, -10, 260, f.mood.halo, 0.5 * preK);
  if (open <= 0.003) return;
  const r = INSET.r * (0.15 + 0.85 * open);
  c.save();
  c.globalAlpha = Math.min(1, open * 1.6);
  // shadow, brass rim
  c.fillStyle = withAlpha(f.mood.fg, 0.5);
  c.beginPath();
  c.arc(INSET.x + 4, INSET.y + 6, r + 7, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.arc(INSET.x, INSET.y, r, 0, Math.PI * 2);
  c.clip();
  // the slide: a warm backlit room of its own (a lantern slide), a standing desk, the tall man alone
  const g = c.createRadialGradient(INSET.x + 20, INSET.y + 10, 10, INSET.x, INSET.y, INSET.r * 1.2);
  g.addColorStop(0, mixLab(f.mood.sky[3], f.mood.halo, 0.3));
  g.addColorStop(0.6, f.mood.sky[2]);
  g.addColorStop(1, f.mood.sky[0]);
  c.fillStyle = g;
  c.fillRect(INSET.x - INSET.r, INSET.y - INSET.r, INSET.r * 2, INSET.r * 2);
  // window mullions behind him
  c.fillStyle = withAlpha(f.mood.set, 0.55);
  for (let k = -2; k <= 2; k++) c.fillRect(INSET.x + k * 34 - 3, INSET.y - INSET.r, 6, INSET.r * 2);
  c.fillRect(INSET.x - INSET.r, INSET.y - 30, INSET.r * 2, 6);
  const env = makeEnv({ mood: f.mood, layer: 'L4', t, pxScale: f.pxScale });
  const floorY = INSET.y + INSET.r * 0.78;
  c.fillStyle = env.fill('ink');
  c.fillRect(INSET.x - INSET.r, floorY, INSET.r * 2, 40);
  // the lectern-height desk with a laptop open on it
  const dx = INSET.x - 36;
  c.fillRect(dx - 26, floorY - 74, 52, 6);
  c.fillRect(dx - 3, floorY - 70, 6, 70);
  c.fillRect(dx - 16, floorY - 4, 32, 4);
  c.beginPath();
  c.moveTo(dx - 18, floorY - 74);
  c.lineTo(dx - 10, floorY - 100);
  c.lineTo(dx - 7, floorY - 99);
  c.lineTo(dx - 13, floorY - 74);
  c.closePath();
  c.fill();
  const tq = tq12(t);
  const p = withLife(pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 3, neck: 8, head: 6, shoulderF: 38, elbowF: 50, wristF: -8, shoulderB: -6, elbowB: 16 }, { handF: 'typing' }), tq, 83);
  cast.hinton.draw(c, { x: INSET.x + 18, y: floorY, facing: 'left', pose: p, scale: 0.5, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.4, floor: 0.2 } }, env);
  c.restore();
  // brass rim
  c.strokeStyle = mixLab(f.mood.halo, f.mood.rim, 0.5);
  c.lineWidth = 3.2;
  c.beginPath();
  c.arc(INSET.x, INSET.y, r, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(f.mood.fg, 0.8);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(INSET.x, INSET.y, r + 2.6, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  nameCard(c, { name: 'Geoffrey Hinton', role: 'supervisor', at: b.alex + 0.3, x: 1232, y: 300, align: 'right', dur: b.insetOff - b.alex - 0.3 }, { t, mood: f.mood });
}
