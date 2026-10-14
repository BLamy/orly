/**
 * ch06-s01 — Holmdel, 1989: the stencil learns to read ZIP codes, and the mail comes from Buffalo
 * (duskRose, fade from black, 10.54 s).
 *
 *   0.1          the chapter's manila index tab ("The Quiet Years", chapter-title size) drops at top-left, holds 2.5 s, slides up;
 *                under it the picture fades up from black on a vast, low building of mirrored glass at dusk,
 *                a whole sky reflected in it (no signage). A slow push toward the glass.
 *   'Bell'       dissolve inside: a lab bench under an anglepoise lamp, a gooseneck video camera bent over a
 *                handwritten digit, a CRT on a beige desktop PC. LeCun stands, leaning in. Place stamp
 *                HOLMDEL, NEW JERSEY · 1989 (phosphor, the era face); on 'Yann' his name card.
 *   'learns'     the camera pushes into the digit and it match-dissolves into the stitched tapestry '4': the
 *                pierced tin stencil-lantern (kernel 'vertical', showKernel/showSum off) slides along the first
 *                row, and the wall fills the first row of the real 12 × 12 feature map, cell by cell, on twos.
 *   'Buffalo's'  dissolve back to the bench, wider: the CRT now shows the digit it read; a canvas mail sack
 *                stencilled BUFFALO, N.Y. slumps onto the bench and envelopes with handwritten addresses slide
 *                out. Label: 9,298 digits · 5.0% test error.
 *   'again'      wordless: the typewriter stamp BUFFALO · 1958–60 (ch03-s04's) prints itself on the glass above the sack,
 *                and a faint ghost of the Mark I shows in the tall window behind it; both fade. Hold.
 */
import { Timeline } from '../../../core';
import { LAYERS, PUPPET_NEAR_BLACK, blendPose, tree, forestBand, crtTerminal, anglepoiseLamp, defineShot, markIPerceptron, mixLab, placeStamp, nameCard, pose, withAlpha, withLife, stencilLantern, convolve, DIGIT4, KERNELS, toScreen, FONT, legibleSize, capPx1080 } from '../../../film';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { layerXform } from '../../../film/core/multiplane';
import { cast } from '../cast';
import { indexTabLg } from '../sets/ch03-s01-indexTab';
import { softPlate } from '../../../film/silhouette/type';
import { clamp01, sm, win, tq12, mixCam, camPath, easeIO, h01, bake, typedLine, screenSpace, screenPass, monoLabel, paperTone, scribble } from '../sets/ch06-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch06-s01';

// ------------------------------------------------------------------------------------------- staging (L4 world)
const FLOOR = 668;
const BENCH = { x0: 430, x1: 1230, back: 466, top: 500, h: 168 };
const LECUN_X = 344;
/** an index card lying FLAT on the worktop in the lamp pool (x, y = its centre on the bench; w × d before foreshortening) */
const CARD = { x: 640, y: BENCH.back + 19, w: 66, h: 66 };
/** the card's foreshortening (seen from a little above the bench) */
const CARD_FS = 0.42;
const LAMP = { x: 486, y: BENCH.back + 10 };
const GOOSE = { x: 742, y: BENCH.back + 12 };
/** the camera head: ~60 px over the card, lens aimed down at it */
const CAMHEAD = { x: CARD.x + 6, y: CARD.y - 64 };
const PC = { x: 896, w: 168, h: 36 };
const CRT = { x: 838, y: BENCH.top - 2 - PC.h, s: 1.3 };
const SACK = { x: 1092, y: BENCH.top + 4 };
const LIGHT = { x: -0.25, y: -1 };
/** the Mark I ghost's L2 x (lands at screen x ≈ 880 on the wide back camera) */
const MK_X = 1000;

const LEAN: Pose = pose({ hipF: 4, kneeF: -3, hipB: -12, kneeB: 0, torso: 13, neck: 2, head: 6, shoulderF: 52, elbowF: 26, wristF: -36, shoulderB: 34, elbowB: 30, wristB: -30 }, { handF: 'palmDown', handB: 'palmDown' });
/** on 'learns': the lean deepens, toward the camera stand and the CRT */
const LEAN2: Pose = pose({ hipF: 6, kneeF: -4, hipB: -14, kneeB: 0, torso: 19, neck: 4, head: 9, shoulderF: 62, elbowF: 20, wristF: -40, shoulderB: 44, elbowB: 24, wristB: -34 }, { handF: 'palmDown', handB: 'palmDown' });
/** on 'Buffalo's': the head comes up and round toward the sack at the far end of the bench */
const TURN: Pose = pose({ hipF: 5, kneeF: -3, hipB: -13, kneeB: 0, torso: 12, neck: -7, head: -9, shoulderF: 54, elbowF: 26, wristF: -36, shoulderB: 38, elbowB: 28, wristB: -32 }, { handF: 'palmDown', handB: 'palmDown' });
const LOOK: Pose = pose({ hipF: 4, kneeF: -3, hipB: -12, kneeB: 0, torso: 11, neck: -2, head: -2, shoulderF: 50, elbowF: 28, wristF: -34, shoulderB: 32, elbowB: 30, wristB: -30 }, { handF: 'palmDown', handB: 'palmDown' });

// ------------------------------------------------------------------------------------------- cameras
const EXT0: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const EXT1: Camera3 = { x: 664, y: 352, z: 90, lens: 1 };
const IN0: Camera3 = { x: 700, y: 372, z: 40, lens: 1 };
const IN1: Camera3 = { x: 690, y: 380, z: 120, lens: 1 };
/** pushed in on the digit, which sits at the left third (where the tapestry will be) */
const PUSH: Camera3 = { x: CARD.x + 150, y: CARD.y - 20, z: 230, lens: 1 };
const BACK0: Camera3 = { x: 770, y: 386, z: 80, lens: 1 };
const BACK1: Camera3 = { x: 784, y: 390, z: 134, lens: 1 };
const IN_CAMS = [IN0, IN1, PUSH, BACK0, BACK1];

// ------------------------------------------------------------------------------------------- the stencil box (screen)
const ST_S = 0.86;
/** tapestry (≈ 300 px tall) at the left third, the feature-map wall at the right, both inside the insert plate */
const ST = { x: 76, y: 104, w: 1280 * ST_S };
const FIRST_ROW = 12;
const FMAP = convolve(DIGIT4, KERNELS.vertical);

// module-scope scratch for the in-shot dissolve (exterior → interior)
let SCRATCH: HTMLCanvasElement | null = null;
function scratchOf(src: HTMLCanvasElement | OffscreenCanvas): CanvasRenderingContext2D {
  if (!SCRATCH) SCRATCH = document.createElement('canvas');
  if (SCRATCH.width !== src.width || SCRATCH.height !== src.height) {
    SCRATCH.width = src.width;
    SCRATCH.height = src.height;
  }
  const g = SCRATCH.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, SCRATCH.width, SCRATCH.height);
  return g;
}

interface B {
  D: number;
  bell: number;
  yann: number;
  learns: number;
  buffalo: number;
  mail: number;
  again: number;
  inA: number;
  inB: number;
  stA: number;
  stB: number;
  outA: number;
  outB: number;
  stepsEnd: number;
  lineEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const bell = T.beat('bench');
    const learns = T.beat('stencil');
    const buffalo = T.beat('sack');
    const b: B = {
      D,
      bell,
      yann: T.word('L0601', 'Yann'),
      learns,
      buffalo,
      mail: T.word('L0601', 'mail'),
      again: T.beat('again'),
      inA: bell - 0.25,
      inB: bell + 0.4,
      // the insert irises open out of the digit card on 'network' and closes into the CRT just before 'Buffalo's';
      // the lantern walks the row from the open to 'zip', and the filled row holds ~0.3 s before the close
      // round 2: in on 'network' (a 0.4 s push + crossfade out of the bench card), held to 'Buffalo's', the lantern
      // walking its dozen positions over the whole ~2.2 s (≈ 0.18 s a step, on twos)
      stA: T.word('L0601', 'network') - 0.05,
      stB: T.word('L0601', 'network') + 0.35,
      outA: T.word('L0601', 'Buffalo\'s') - 0.06,
      outB: T.word('L0601', 'Buffalo\'s') + 0.3,
      stepsEnd: T.word('L0601', 'Buffalo\'s') - 0.12,
      lineEnd: T.line('L0601').end,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;

    // ------------------------------------------------ the exterior → interior dissolve (a true in-shot dissolve)
    const dis = win(t, b.inA, b.inB);
    if (dis < 1) {
      exterior(f, t, b);
      if (dis > 0) {
        const g = scratchOf(f.c.canvas);
        g.drawImage(f.c.canvas, 0, 0);
        interior(f, t, tq, b);
        const c = f.c;
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1 - dis;
        c.drawImage(SCRATCH!, 0, 0);
        c.restore();
      }
    } else interior(f, t, tq, b);
    ghostStamp(f, t, b.again, b.D);

    // ------------------------------------------------ type (screen-locked, last)
    screenPass(f, (c) => {
      const env = { t, mood: f.mood, seed: 6 };
      // the place stamp types in on 'Bell' (the dissolve is two-thirds through), the name card on 'Yann'; both
      // stay up over the insert's dark surround (the iris plate is kept clear of the lower-left corner)
      placeStamp(c, { place: 'Holmdel, New Jersey', date: '1989', year: 1989, at: b.bell - 0.02, dur: b.stB + 0.45 - b.bell, fade: 0.3, cps: 26, y: 622 }, env);
      nameCard(c, { name: 'Yann LeCun', role: 'Bell Labs', at: b.yann - 0.15, dur: b.stB + 0.6 - b.yann, fade: 0.3, y: 546 }, env);
      // the corpus, landing WITH the sack (numbers only), on a soft plate clear of the mullions
      const la = win(t, b.buffalo - 0.12, b.buffalo + 0.22) * (1 - win(t, b.D - 1.2, b.D - 0.6));
      monoLabel(c, '9,298 digits · 5.0% test error', 1222, 96, { mood: f.mood, a: la, align: 'right', size: 21, plate: 0.85 });
      // the film's chapter-title tab (the size every other opener uses; the small shared tab read under the floor)
      indexTabLg(c, { title: 'The Quiet Years', at: 0.1, hold: 2.5 }, { t, mood: f.mood });
    });
  },
});

// =========================================================================================== EXTERIOR
function exterior(f: Frame, t: number, b: B) {
  const cam = mixCam(EXT0, EXT1, easeIO(t / (b.inB + 0.3)));
  f.camera(cam);
  f.backlight({ sunX: 1180, sunY: 430, sunRadius: 760, intensity: 1 });
  // far: a low wooded ridge beyond the building
  f.layer('L1', (c, env) => {
    const r = { x: -300, y: 300, w: 2000, h: 320 };
    bake(f, c, `${ID}/ext/L1/${env.mood.id}`, r, (cc) => forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 520, h: 70, kind: 'leafy', density: 1.4, seed: 61 }, env));
  });
  // the building: a vast low box of mirrored glass, the whole dusk sky reflected in it, its far corner turning away
  f.layer('L2', (c, env) => {
    const r = { x: -360, y: 200, w: 1780, h: 400 };
    bake(f, c, `${ID}/ext/L2d/${env.mood.id}`, r, (cc) => mirrorBuilding(cc, env));
  });
  f.fog({ yCenter: 560, height: 130, alpha: 0.13, drift: 6 });
  // mid: elms on the lawn, a car-park lamp standard
  f.layer('L3', (c, env) => {
    const r = { x: -400, y: 60, w: 2100, h: 720 };
    bake(f, c, `${ID}/ext/L3c/${env.mood.id}`, r, (cc) => lawn(cc, env));
  });
  // the head-hold's light change (round 1): the car-park lamp strikes up at dusk (a sodium stutter on twos, then
  // a slow warm-up), and the entrance canopy's downlights come on under the mirrored glass a beat later
  const tq = tq12(t);
  const strike = tq < 0.75 ? 0 : tq < 1.25 ? [0.35, 0.05, 0.5, 0.12, 0.62, 0.4][Math.min(5, Math.floor((tq - 0.75) * 12))] : 0.6 + 0.4 * sm((t - 1.25) / 1.4);
  if (strike > 0.01) f.practical({ x: 196, y: 318, kind: 'lamp', seed: 61, intensity: 0.55 * strike, radius: 18 + 10 * strike, layer: 'L3' });
  const canopy = sm((t - 1.55) / 0.9);
  if (canopy > 0.01) for (const [i, x] of [530, 590, 650].entries()) f.practical({ x, y: EXT.bot - 44, kind: 'lamp', seed: 64 + i, intensity: 0.32 * canopy, radius: 16, layer: 'L2' });
  f.fog('B');
  // L6: a near branch reaching in from the top right (very blurred, the darkest value): the establishing frame's depth
  f.layer('L6', (c, env) => {
    const r = { x: 700, y: -300, w: 1100, h: 700 };
    bake(f, c, `${ID}/ext/L6br/${env.mood.id}`, r, (cc) => nearBranch(cc, env));
  });
  // near: dark hedge tops, blurred
  f.layer('L5', (c, env) => {
    const r = { x: -400, y: 600, w: 2100, h: 260 };
    bake(f, c, `${ID}/ext/L5/${env.mood.id}`, r, (cc) => {
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(r.x, r.y + r.h);
      for (let x = r.x; x <= r.x + r.w; x += 10) cc.lineTo(x, 694 - 16 * h01(Math.floor(x / 10), 77) - 12 * Math.sin(x / 60));
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.closePath();
      cc.fill();
    });
  });
}

/** the long front facade (x -340 → CORNER) and the side facade receding to the right */
const EXT = { top: 262, bot: 552, corner: 1010, far: 1196, farTop: 300, farBot: 540 };
function mirrorBuilding(c: C, env: PaintEnv) {
  const m = env.mood;
  const { top, bot, corner } = EXT;
  const x0 = -360;
  // ---- the front glass: the sky behind US reflected: darker high, the bright horizon band low, then trees
  const glass = new Path2D();
  glass.rect(x0, top, corner - x0, bot - top);
  const g = c.createLinearGradient(0, top, 0, bot);
  // round 2: a brighter dusk in the glass (the whole sky, reflected) against a darker frame and ground
  g.addColorStop(0, mixLab(m.sky[0], m.sky[1], 0.4));
  g.addColorStop(0.4, mixLab(m.sky[3], m.rim, 0.22));
  g.addColorStop(0.7, mixLab(m.sky[3], m.core, 0.5));
  g.addColorStop(0.86, mixLab(m.sky[3], m.rim, 0.35));
  g.addColorStop(1, m.sky[2]);
  c.fillStyle = g;
  c.fill(glass);
  c.save();
  c.clip(glass);
  // a reflected sun-glow on the glass (the sun is behind the camera: its reflection lies on the facade)
  const rg = c.createRadialGradient(360, bot - 70, 10, 360, bot - 70, 520);
  rg.addColorStop(0, withAlpha(mixLab(m.rim, m.core, 0.3), 0.55));
  rg.addColorStop(1, withAlpha(m.rim, 0));
  c.save();
  c.translate(0, bot - 70);
  c.scale(1, 0.45);
  c.translate(0, -(bot - 70));
  c.fillStyle = rg;
  c.fillRect(x0, top - 400, corner - x0, 900);
  c.restore();
  // reflected cloud banks: long soft streaks, slightly wavy (each floor's glass is a little out of plane)
  for (let i = 0; i < 14; i++) {
    const y = top + 14 + i * 15 + 6 * h01(i, 3);
    c.fillStyle = withAlpha(i % 4 === 0 ? m.rim : mixLab(m.sky[1], m.set, 0.3), 0.15 + 0.21 * h01(i, 4));
    const xa = x0 + h01(i, 5) * 1000;
    const len = 240 + 520 * h01(i, 6);
    c.beginPath();
    c.moveTo(xa, y);
    for (let k = 0; k <= 16; k++) c.lineTo(xa + (k / 16) * len, y - 3 * Math.sin(k * 0.8 + i));
    for (let k = 16; k >= 0; k--) c.lineTo(xa + (k / 16) * len, y + 4 + 2 * Math.sin(k * 0.6 + i));
    c.closePath();
    c.fill();
  }
  // the whole sky, mirrored: a band of the sky's own gradient laid in again (inverted: the bright horizon reflects
  // HIGH on the upper storeys, as the tilted glass catches it) and rows of cumulus turned upside-down (flat bases up,
  // puffs hanging), rim-lit on their lower lobes by the reflected sun
  {
    const mg = c.createLinearGradient(0, top, 0, top + (bot - top) * 0.55);
    mg.addColorStop(0, withAlpha(mixLab(m.sky[3], m.rim, 0.35), 0.42));
    mg.addColorStop(0.5, withAlpha(m.sky[2], 0.18));
    mg.addColorStop(1, withAlpha(m.sky[1], 0));
    c.fillStyle = mg;
    c.fillRect(x0, top, corner - x0, (bot - top) * 0.55);
    const rows: [number, number, number][] = [[top + 34, 0.51, 71], [top + 96, 0.4, 73], [top + 168, 0.3, 79]];
    for (const [by, al, sd] of rows) {
      for (let k = 0; k < 5; k++) {
        const cx0 = x0 + 60 + k * 300 + 120 * h01(k, sd);
        const cw = 170 + 120 * h01(k, sd + 1);
        // the cloud's flat base is its TOP edge (inverted), lobes hang below it
        const cl = new Path2D();
        cl.moveTo(cx0 - cw / 2, by);
        cl.lineTo(cx0 + cw / 2, by);
        const lobes = 4 + Math.floor(3 * h01(k, sd + 2));
        for (let j = lobes - 1; j >= 0; j--) {
          const lx = cx0 - cw / 2 + ((j + 0.5) / lobes) * cw;
          const lr = (cw / lobes) * (0.6 + 0.35 * h01(j + k * 7, sd + 3));
          cl.moveTo(lx + lr, by);
          cl.arc(lx, by, lr, 0, Math.PI, false);
        }
        c.fillStyle = withAlpha(mixLab(m.sky[1], m.sky[0], 0.35), Math.min(1, al * 1.3));
        c.fill(cl);
        // the lower lobes' rim (the reflected sun catches the cloud's underside, now at the bottom)
        c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.35), Math.min(1, al * 1.6));
        c.lineWidth = 1.8;
        c.stroke(cl);
        // the dark shadowed base band just above (a cloud's dark belly, mirrored to the top)
        c.fillStyle = withAlpha(mixLab(m.sky[0], m.set, 0.4), Math.min(1, al * 0.9));
        c.fillRect(cx0 - cw / 2 + 8, by - 5, cw - 16, 5);
      }
    }
    // a long specular sweep across the facade (the mirror catching the whole sky's brightest band)
    c.save();
    c.translate(520, (top + bot) / 2);
    c.rotate(-0.22);
    const sw = c.createLinearGradient(0, -40, 0, 40);
    sw.addColorStop(0, withAlpha(m.rim, 0));
    sw.addColorStop(0.5, withAlpha(mixLab(m.rim, m.core, 0.2), 0.2));
    sw.addColorStop(1, withAlpha(m.rim, 0));
    c.fillStyle = sw;
    c.fillRect(-1200, -40, 2400, 80);
    c.restore();
  }
  // the reflected tree line along the foot of the glass (dark, the lawn's elms seen in the mirror)
  c.fillStyle = withAlpha(mixLab(m.set, m.fg, 0.2), 0.8);
  c.beginPath();
  c.moveTo(x0, bot);
  for (let x = x0; x <= corner; x += 8) c.lineTo(x, bot - 26 - 26 * Math.max(0, Math.sin(x / 70 + 1)) * h01(Math.floor(x / 140), 8) - 6 * h01(Math.floor(x / 8), 9));
  c.lineTo(corner, bot);
  c.closePath();
  c.fill();
  // each storey's glass is a slightly different tilt: it reflects a different slice of the sky (bands of value)
  for (let k = 0; k < 6; k++) {
    const ya = top + ((bot - top) * k) / 6, yb = top + ((bot - top) * (k + 1)) / 6;
    const bg = c.createLinearGradient(0, ya, 0, yb);
    const lift = k % 2 ? 0.16 : -0.1;
    bg.addColorStop(0, withAlpha(lift > 0 ? m.rim : m.sky[0], Math.abs(lift)));
    bg.addColorStop(1, withAlpha(lift > 0 ? m.sky[3] : m.set, Math.abs(lift) * 0.6));
    c.fillStyle = bg;
    c.fillRect(x0, ya, corner - x0, yb - ya);
  }
  // reflected elms: the lawn's trees seen upside-down-free in the mirror, rising from the foot of the glass,
  // dark and soft (two depths: near reflections taller, far ones hazier)
  c.save();
  c.globalAlpha = 0.62;
  for (const [x, h, sd] of [[-120, 210, 13], [150, 170, 15], [420, 150, 17], [770, 200, 19], [960, 160, 23]] as [number, number, number][])
    tree(c, { x, y: bot + 4, h, kind: 'elm', leaves: 0.8, seed: sd, detail: 0.6 }, env);
  c.restore();
  // floor spandrels: thin dark bands (five storeys), mullions barely there: the glass reads as one mirror
  c.fillStyle = withAlpha(mixLab(m.set, m.fg, 0.3), 0.55);
  for (let k = 1; k < 6; k++) c.fillRect(x0, top + ((bot - top) * k) / 6 - 1.5, corner - x0, 3);
  c.fillStyle = withAlpha(m.set, 0.18);
  for (let x = x0 + 30; x < corner; x += 54) c.fillRect(x, top, 1, bot - top);
  c.restore();
  // ---- the side facade turning away at the corner: darker glass (it faces away from the sky's glow)
  const side = new Path2D();
  side.moveTo(corner, top);
  side.lineTo(EXT.far, EXT.farTop);
  side.lineTo(EXT.far, EXT.farBot);
  side.lineTo(corner, bot);
  side.closePath();
  const sg = c.createLinearGradient(corner, 0, EXT.far, 0);
  sg.addColorStop(0, mixLab(m.set, m.sky[1], 0.55));
  sg.addColorStop(1, mixLab(m.set, m.sky[2], 0.35));
  c.fillStyle = sg;
  c.fill(side);
  c.save();
  c.clip(side);
  c.fillStyle = withAlpha(mixLab(m.set, m.fg, 0.3), 0.7);
  for (let k = 1; k < 6; k++) {
    c.beginPath();
    const ya = top + ((bot - top) * k) / 6, yb = EXT.farTop + ((EXT.farBot - EXT.farTop) * k) / 6;
    c.moveTo(corner, ya - 2);
    c.lineTo(EXT.far, yb - 1.5);
    c.lineTo(EXT.far, yb + 1.5);
    c.lineTo(corner, ya + 2);
    c.fill();
  }
  c.restore();
  // ---- parapet, corner fin, base (a darker frame: the mirror is the light)
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.5);
  c.beginPath();
  c.moveTo(x0, top - 16);
  c.lineTo(corner, top - 16);
  c.lineTo(EXT.far, EXT.farTop - 12);
  c.lineTo(EXT.far, EXT.farTop);
  c.lineTo(corner, top);
  c.lineTo(x0, top);
  c.closePath();
  c.fill();
  c.fillRect(corner - 3, top - 16, 6, bot - top + 16);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(x0, top - 16, corner - x0, 1.4);
  // the base: a recessed dark plinth, a low entrance canopy with its underside lit
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.5);
  c.fillRect(x0, bot, EXT.far - x0, 14);
  c.fillRect(470, bot - 58, 240, 10);
  c.fillRect(476, bot - 48, 6, 48);
  c.fillRect(698, bot - 48, 6, 48);
  c.fillStyle = withAlpha(m.halo, 0.55);
  c.fillRect(488, bot - 46, 204, 3);
}

function nearBranch(c: C, env: PaintEnv) {
  c.strokeStyle = env.fill('fg');
  c.fillStyle = env.fill('fg');
  c.lineCap = 'round';
  const limb = (pts: number[], w: number) => {
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    c.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
    c.stroke();
  };
  limb([1700, -120, 1400, -40, 1220, 20, 980, 70], 30);
  limb([1240, 14, 1180, 80, 1120, 120, 1050, 170], 12);
  limb([1080, 58, 1010, 40, 930, 52, 860, 30], 9);
  limb([1400, -30, 1360, 60, 1320, 110, 1300, 180], 10);
  // leaf clusters along the twigs (seeded)
  for (let i = 0; i < 46; i++) {
    const x = 860 + 480 * h01(i, 41);
    const y = 20 + 170 * h01(i, 42) * (1 - (x - 860) / 900);
    c.beginPath();
    c.ellipse(x, y, 9 + 8 * h01(i, 43), 5 + 4 * h01(i, 44), h01(i, 45) * 3, 0, Math.PI * 2);
    c.fill();
  }
}

function lawn(c: C, env: PaintEnv) {
  // the lawn, rising very slightly toward us: near-black (the dusk ground is a framing dark)
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.9);
  c.beginPath();
  c.moveTo(-400, 572);
  for (let x = -400; x <= 1700; x += 20) c.lineTo(x, 568 + 5 * Math.sin(x / 300));
  c.lineTo(1700, 780);
  c.lineTo(-400, 780);
  c.closePath();
  c.fill();
  // elms on the lawn, irregularly spaced, well clear of the canopy
  const elms: [number, number, number][] = [[-170, 300, 3], [60, 250, 5], [930, 270, 7], [1290, 320, 9], [1520, 280, 11]];
  for (const [x, h, sd] of elms) tree(c, { x, y: 574, h, kind: 'elm', leaves: 0.75, seed: sd, detail: 0.8 }, env);
  // the car-park lamp standard
  c.fillStyle = env.fill('ink');
  c.fillRect(194, 318, 5, 258);
  c.fillRect(174, 312, 44, 7);
}

// =========================================================================================== INTERIOR
function interior(f: Frame, t: number, tq: number, b: B) {
  // camera: arrive (slow truck) → push into the digit → (stencil) → back out wide on the sack → slow drift
  let cam: Camera3;
  const pushA = b.learns - 1.15;
  if (t < pushA) cam = mixCam(IN0, IN1, sm((t - b.inA) / (pushA - b.inA)));
  else if (t < b.outA) cam = mixCam(IN1, PUSH, easeIO((t - pushA) / (b.stB - pushA)));
  else {
    // pull back to reveal the whole bench (and the sack landing) as the insert closes into the CRT, then drift
    const back = mixCam(BACK0, BACK1, easeIO((t - b.outA) / (b.D - b.outA)));
    cam = mixCam(PUSH, back, easeIO(clamp01((t - b.outA) / 1.1)));
  }
  f.camera(cam);
  // the dusk pours in behind the curtain wall (pushed: the windows carry the frame, as in the reference)
  f.backlight({ sunX: 1010, sunY: 330, sunRadius: 640, intensity: 1.15 });

  // the Mark I ghost: keyed in with the stamp just after the line, held together with it for ~2 s, gone at D-0.4
  const ghost = win(t, b.again + 0.05, b.again + 0.55) * (1 - win(t, b.D - 1.2, b.D - 0.6));
  // L1: the dusk outside the atrium glass (a far tree line, hazy)
  f.layer('L1', (c, env) => {
    const r = { x: -500, y: 300, w: 2400, h: 260 };
    bake(f, c, `${ID}/in/L1/${env.mood.id}`, r, (cc) => {
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      cc.moveTo(r.x, r.y + r.h);
      for (let x = r.x; x <= r.x + r.w; x += 16) cc.lineTo(x, 470 - 20 * h01(Math.floor(x / 16), 21) - 16 * Math.sin(x / 170));
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.closePath();
      cc.fill();
    });
  });
  // L2: the ghost of the Mark I in the tall window behind the sack (chapter 3's knob machine), drawn in its own L2
  // call BEFORE the wall so it shows only through the glass, faint, like a reflection
  // keyed as a DARK silhouette against the lit pane (a cut-paper shadow puppet, not a translucent overlay)
  if (ghost > 0.01) {
    f.layer('L2', (c, env) => {
      c.save();
      c.globalAlpha = 0.78 * ghost;
      // in the pane between the CRT and the sack (screen x ≈ 880), clear of the stamp above the sack
      const r = { x: MK_X - 240, y: 466 - 300, w: 480, h: 320 };
      bake(f, c, `${ID}/in/markIghost2/${env.mood.id}`, r, (cc) => {
        markIPerceptron(cc, { x: MK_X, y: 466, s: 0.5, seed: 3 }, env);
        cc.globalCompositeOperation = 'source-in';
        cc.fillStyle = mixLab(env.mood.ink, env.mood.fg, 0.35);
        cc.fillRect(r.x, r.y, r.w, r.h);
        cc.globalCompositeOperation = 'source-over';
      });
      c.restore();
    });
  }
  // L2: the atrium's curtain wall: tall panes as HOLES, a mezzanine balustrade crossing it
  f.layer('L2', (c, env) => {
    const r = { x: -560, y: -320, w: 2700, h: 1320 };
    bake(f, c, `${ID}/in/L2/${env.mood.id}`, r, (cc) => atriumWall(cc, env, r));
  });
  f.fog({ yCenter: 432, height: 288, alpha: 0.26, drift: 6 }); // fog sheet A at table height (0.6 H)
  // L3: equipment racks and a second bench, hazed
  f.layer('L3', (c, env) => {
    const r = { x: -500, y: 120, w: 2400, h: 700 };
    bake(f, c, `${ID}/in/L3/${env.mood.id}`, r, (cc) => midRoom(cc, env));
  });
  // fog sheet B at bench height: the bench becomes a lit island floating in the dusk haze
  f.fog({ yCenter: 470, height: 150, alpha: 0.25, drift: 5 });

  // L4: the bench, LeCun, the machine
  // LeCun: hands on the bench → on 'learns' the lean deepens toward the stand and the CRT → on 'Buffalo's' his head
  // comes up and round to the sack. Breathing is visible (on twos).
  const lean = blendPose(LEAN, LEAN2, win(tq, b.learns - 0.15, b.learns + 0.35));
  const turned = blendPose(lean, TURN, win(tq, b.buffalo - 0.12, b.buffalo + 0.25));
  const lp = withLife(turned, tq, 1989, 2.4);
  const sackDrop = sackAt(tq, b.buffalo);
  const read = win(tq, b.outB - 0.08, b.outB + 0.1);
  const st = win(t, b.stA, b.stB) * (1 - win(t, b.outA, b.outB));
  f.layer('L4', (c, env) => {
    bench(f, c, env);
    // the gooseneck camera over the digit, the lamp beside it
    anglepoiseLamp(c, { x: LAMP.x, y: LAMP.y, s: 1.05, lit: true, reach: 0.7, aim: 0.28, seed: 4 }, env);
    // the paper card is hidden while the tapestry is up (one '4' at a time)
    const cardA = 1 - easeIO(win(t, b.stA + 0.1, b.stB)) * (1 - win(t, b.outA, b.outB));
    if (cardA > 0.01) {
      c.save();
      c.globalAlpha = cardA;
      digitCard(c, env);
      c.restore();
    }
    gooseneck(c, env);
    // the PC and its CRT; the CRT reads the digit once the net has learned it
    beigePC(c, env);
    crtTerminal(c, { x: CRT.x, y: CRT.y, s: CRT.s, on: true, phosphor: 'mood', lines: 0, cursor: read < 0.5, keyboard: false, seed: 9 }, env);
    if (read > 0.01) crtDigit(c, env, read);
    // the mail sack from Buffalo, then its envelopes
    if (sackDrop) sack(c, env, sackDrop, tq - b.mail);
    // value hierarchy: the figure is the darkest shape in frame, lit only from the lamp side
    cast.lecun.draw(c, { x: LECUN_X, y: FLOOR, facing: 'right', pose: lp, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.55, floor: 0 }, edgeRim: { x: 1, y: -0.5, px: 1.5, alpha: 0.75 } }, env);
  });
  f.rim(LIGHT);
  const lampB = anglepoiseLamp.anchors({ x: LAMP.x, y: LAMP.y, s: 1.05, reach: 0.7, aim: 0.28 }).bulb;
  f.practical({ x: lampB.x, y: lampB.y + 6, kind: 'lamp', seed: 89, intensity: 0.8, radius: 46 });
  const scr = crtTerminal.anchors({ x: CRT.x, y: CRT.y, s: CRT.s }).screen;
  // the CRT is the bench's second practical (a strong cool-warm phosphor bloom), stronger once it has read the digit
  f.practical({ x: scr.x, y: scr.y, kind: 'screen', seed: 90, intensity: 0.5 + 0.18 * read, radius: 84 });
  // L5: the back of a near lab stool / chair at bottom-left (blurred, darker than everything)
  f.layer('L5', (c, env) => {
    const r = { x: 120, y: 560, w: 600, h: 560 };
    bake(f, c, `${ID}/in/L5chair2/${env.mood.id}`, r, (cc) => nearChair(cc, env));
  });
  // L6: an atrium column crossing the frame's left edge (blurred, the darkest value)
  f.layer('L6', (c, env) => {
    const r = { x: -360, y: -400, w: 300, h: 1500 };
    bake(f, c, `${ID}/in/L6/${env.mood.id}`, r, (cc) => {
      cc.fillStyle = env.fill('fg');
      cc.fillRect(-250, -400, 120, 1500);
    });
  });

  // the room falls off into dusk away from the bench: a soft screen-space falloff on the floor, corners and frame edges
  islandFalloff(f);

  // the stencil insert: an OPAQUE iris plate that opens out of the digit card and closes into the CRT.
  // Drawn last (a sharp L4 pass after the near layers) so nothing ghosts through it; the room around it
  // (the backlit windows above, the corners) stays at full value.
  if (st > 0.002) {
    f.layer('L4', (c, env) => {
      c.save();
      c.globalAlpha = Math.min(1, 0.15 + 0.85 * easeIO(win(t, b.stA, b.stB - 0.05)));
      screenSpace(c, LAYERS.L4, cam, (cc) => stencilInsert(cc, env, cam, t, tq, b));
      c.restore();
    });
  }
}

/** the insert's design rect (the stencil machine is laid out in these screen px) … */
const INS = { x: 74, y: 108, w: 1132, h: 548 };
/** … and where the cut-paper vignette actually sits: up and right, clear of the stamp / name card corner */
const PLATE = { x: 318, y: 88, w: 880, h: 474 };

/** a deckled (torn, hand-cut) paper edge around rect R: seeded, static per edge position, so it does not crawl */
function deckle(R: { x: number; y: number; w: number; h: number }, amp: number): Path2D {
  const p = new Path2D();
  const pts: [number, number][] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number, sd: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(6, Math.round(len / 7));
    for (let i = 0; i < n; i++) {
      const u = i / n;
      // two octaves: long soft undulation + short torn fibres
      const o = amp * (0.55 * (h01(Math.floor(u * 9), sd) - 0.5) * 2 + 0.45 * (h01(i, sd + 1) - 0.5) * 2);
      pts.push([x0 + (x1 - x0) * u + nx * o, y0 + (y1 - y0) * u + ny * o]);
    }
  };
  edge(R.x, R.y, R.x + R.w, R.y, 0, -1, 11);
  edge(R.x + R.w, R.y, R.x + R.w, R.y + R.h, 1, 0, 13);
  edge(R.x + R.w, R.y + R.h, R.x, R.y + R.h, 0, 1, 17);
  edge(R.x, R.y + R.h, R.x, R.y, -1, 0, 19);
  p.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) p.lineTo(x, y);
  p.closePath();
  return p;
}
/** run `draw` with the stencil kit's wall caption suppressed (an instance-level fillText filter, removed after) */
function noCaption(c: C, draw: () => void) {
  const own = Object.prototype.hasOwnProperty.call(c, 'fillText');
  const base = c.fillText;
  c.fillText = function (text: string, x: number, y: number, maxW?: number) {
    if (text.startsWith('FEATURE MAP')) return;
    if (maxW === undefined) base.call(this, text, x, y);
    else base.call(this, text, x, y, maxW);
  };
  try {
    draw();
  } finally {
    if (own) c.fillText = base;
    else delete (c as Partial<C>).fillText;
  }
}

/** the room's falloff away from the lit bench (screen-locked; floor, corners and frame edges sink into dusk) */
function islandFalloff(f: Frame) {
  screenPass(f, (c) => {
    const m = f.mood;
    c.save();
    c.translate(720, 420);
    c.scale(1, 0.62);
    const g = c.createRadialGradient(0, 0, 260, 0, 0, 860);
    g.addColorStop(0, withAlpha(m.fg, 0));
    g.addColorStop(0.55, withAlpha(m.fg, 0.16));
    g.addColorStop(1, withAlpha(m.fg, 0.5));
    c.fillStyle = g;
    c.fillRect(-1400, -1400, 2800, 2800);
    c.restore();
    // the floor below the bench line is the darkest band (the backlight never reaches it)
    const fl = c.createLinearGradient(0, 560, 0, 720);
    fl.addColorStop(0, withAlpha(m.fg, 0));
    fl.addColorStop(1, withAlpha(m.fg, 0.38));
    c.fillStyle = fl;
    c.fillRect(0, 560, 1280, 160);
  });
}

function stencilInsert(cc: C, env: PaintEnv, cam: Camera3, t: number, tq: number, b: B) {
  const m = env.mood;
  // open: an iris out of the card's screen rect; close: into the CRT screen's rect (the net's answer goes to the monitor)
  const card = toScreen(LAYERS.L4, cam, CARD.x, CARD.y);
  const ks = layerXform(LAYERS.L4, cam).k;
  const scrW = crtTerminal.anchors({ x: CRT.x, y: CRT.y, s: CRT.s }).screen;
  const scr = toScreen(LAYERS.L4, cam, scrW.x, scrW.y);
  const op = easeIO(win(t, b.stA, b.stB));
  const cl = easeIO(win(t, b.outA, b.outB));
  const from = cl > 0 ? { x: scr.x - 40 * ks, y: scr.y - 30 * ks, w: 80 * ks, h: 60 * ks } : { x: card.x - (CARD.w / 2) * ks, y: card.y - ((CARD.h * CARD_FS) / 2) * ks, w: CARD.w * ks, h: CARD.h * CARD_FS * ks };
  const u = cl > 0 ? 1 - cl : op;
  const R = { x: from.x + (PLATE.x - from.x) * u, y: from.y + (PLATE.y - from.y) * u, w: from.w + (PLATE.w - from.w) * u, h: from.h + (PLATE.h - from.h) * u };
  // 1. the room dims around the plate (a soft vignette, NOT a blackout: the bench and windows show faintly)
  cc.save();
  cc.globalAlpha = 0.4 * u;
  const vg = cc.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, Math.max(10, R.w * 0.3), R.x + R.w / 2, R.y + R.h / 2, Math.max(40, R.w * 0.95));
  vg.addColorStop(0, withAlpha(m.fg, 0.95));
  vg.addColorStop(1, withAlpha(m.fg, 0.55));
  cc.fillStyle = vg;
  cc.fillRect(-10, -10, 1300, 740);
  cc.restore();
  // 2. the cut-paper vignette: a dark card with a torn, deckled edge; its fibres catch the lamp (a lighter torn rim)
  const amp = 3 + 4 * u;
  const outer = deckle({ x: R.x - 3, y: R.y - 3, w: R.w + 6, h: R.h + 6 }, amp);
  const inner = deckle(R, amp * 0.8);
  cc.save();
  cc.shadowColor = withAlpha(m.fg, 0.7 * u);
  cc.shadowBlur = 26;
  cc.shadowOffsetY = 6;
  cc.fillStyle = mixLab(paperTone(env, 0.35), m.fg, 0.55); // the torn fibre rim (lighter than the card)
  cc.fill(outer);
  cc.restore();
  cc.save();
  cc.fillStyle = mixLab(m.fg, m.set, 0.32);
  cc.fill(inner);
  cc.clip(inner);
  // the lamp's warm pool on the cloth, centred behind the tapestry, a cooler fall-off to the wall
  const k = R.w / INS.w;
  const ky = R.h / INS.h;
  const g = cc.createRadialGradient(R.x + (300 - INS.x) * k, R.y + (400 - INS.y) * ky, 30 * k, R.x + (300 - INS.x) * k, R.y + (400 - INS.y) * ky, 440 * k);
  g.addColorStop(0, withAlpha(mixLab(m.set, m.halo, 0.42), 0.95));
  g.addColorStop(0.55, withAlpha(mixLab(m.set, m.halo, 0.12), 0.6));
  g.addColorStop(1, withAlpha(m.set, 0));
  cc.fillStyle = g;
  cc.fillRect(R.x, R.y, R.w, R.h);
  const g2 = cc.createRadialGradient(R.x + (930 - INS.x) * k, R.y + (410 - INS.y) * ky, 20 * k, R.x + (930 - INS.x) * k, R.y + (410 - INS.y) * ky, 260 * k);
  g2.addColorStop(0, withAlpha(mixLab(m.set, m.setHaze, 0.5), 0.55));
  g2.addColorStop(1, withAlpha(m.set, 0));
  cc.fillStyle = g2;
  cc.fillRect(R.x, R.y, R.w, R.h);
  // the machine itself appears once the plate has opened (it rides the plate's scale on the way in/out)
  const inside = clamp01((u - 0.55) / 0.4);
  if (inside > 0.01) {
    cc.globalAlpha = inside;
    cc.translate(R.x, R.y);
    cc.scale(k, ky);
    cc.translate(-INS.x, -INS.y);
    // the first row only: twelve positions from the open ('learns') to 'zip', on twos; then the full row holds
    const s0 = b.stA + 0.2;
    const sp = (b.stepsEnd - s0) / FIRST_ROW;
    const step = Math.max(0, Math.min(FIRST_ROW - 0.001, (tq - s0) / sp));
    // TEXT RULE ("numbers on screen only"): the kit's FEATURE MAP caption is left out of this brief preview (it
    // also sat under the legibility floor at this insert's scale); the full mechanics are chapter 8's
    noCaption(cc, () => stencilLantern(cc, { x: ST.x, y: ST.y, w: ST.w, h: 720 * ST_S, step, kernel: 'vertical', reveal: 1, showSum: false, showKernel: 0 }, env));
    // every VISITED socket is marked (a thin lit frame), so the row visibly fills even where the true
    // response is zero (most of row 1 sees no left edge): the wall fills cell by cell in raster order
    const idx = Math.floor(step);
    const lit = idx + (step - idx > 0.5 ? 1 : 0);
    const wc = 27 * ST_S, wx = ST.x + 838 * ST_S, wy = ST.y + 196 * ST_S;
    cc.strokeStyle = withAlpha(m.rim, 0.55);
    cc.lineWidth = 1.2;
    for (let q = 0; q < lit; q++) cc.strokeRect(wx + q * wc + 2.5, wy + 2.5, wc - 5, wc - 5);
    cc.fillStyle = withAlpha(m.rim, 0.5);
    for (let q = 0; q < lit; q++) if (FMAP[q] <= 0) cc.fillRect(wx + q * wc + wc / 2 - 1.5, wy + wc / 2 - 1.5, 3, 3);
  }
  cc.restore();
  // the inner cut edge: a hairline where the dark card meets its torn fibre rim
  cc.save();
  cc.globalAlpha = 0.45 * u;
  cc.strokeStyle = withAlpha(m.rim, 0.4);
  cc.lineWidth = 0.8;
  cc.stroke(inner);
  cc.restore();
}

function nearChair(c: C, env: PaintEnv) {
  // a bentwood lab chair seen from behind, its back crossing the lower-left corner (L5: blurred, fg)
  const ink = env.fill('fg');
  c.save();
  // round 2: lowered so only its top rail crosses the bottom edge, below the name card / place stamp
  c.translate(250, 210);
  c.scale(0.78, 0.78);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  // back posts
  c.lineWidth = 14;
  c.beginPath();
  c.moveTo(-40, 900);
  c.quadraticCurveTo(-52, 700, -20, 560);
  c.moveTo(150, 900);
  c.quadraticCurveTo(162, 700, 128, 560);
  c.stroke();
  // the curved top rail and a pierced splat (backlight through the holes)
  const back = new Path2D();
  back.moveTo(-46, 590);
  back.bezierCurveTo(-30, 520, 140, 520, 160, 590);
  back.lineTo(150, 612);
  back.bezierCurveTo(120, 566, -10, 566, -36, 612);
  back.closePath();
  back.rect(20, 600, 68, 210);
  back.moveTo(54 + 18, 660);
  back.ellipse(54, 660, 18, 26, 0, 0, Math.PI * 2);
  back.moveTo(54 + 10, 740);
  back.ellipse(54, 740, 10, 16, 0, 0, Math.PI * 2);
  c.fill(back, 'evenodd');
  // the seat edge
  c.fillRect(-120, 800, 360, 26);
  c.restore();
}

const overscanNear = () => ({ x: -420, y: 560, w: 2000, h: 520 });

function atriumWall(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  const wall = env.fill('set');
  // panes: 3 tiers of tall glass; the frames are the wall (evenodd holes)
  const p = new Path2D();
  p.rect(r.x, r.y, r.w, r.h);
  const tiers = [
    { y: -120, h: 190 },
    { y: 96, h: 150 },
    { y: 270, h: 196 },
  ];
  const pitch = 132, pw = 120;
  for (const tr of tiers) for (let x = -540; x < 2120; x += pitch) p.rect(x, tr.y, pw, tr.h);
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // thin glazing bars inside each pane (a cross transom)
  c.fillStyle = withAlpha(wall, 0.85);
  for (const tr of tiers)
    for (let x = -540; x < 2120; x += pitch) {
      c.fillRect(x + pw / 2 - 1.5, tr.y, 3, tr.h);
      c.fillRect(x, tr.y + tr.h * 0.38, pw, 3);
    }
  // the mezzanine walkway crossing the glass: slab + balustrade posts + handrail
  c.fillStyle = mixLab(wall, m.fg, 0.25);
  c.fillRect(r.x, 248, r.w, 18);
  c.fillRect(r.x, 214, r.w, 4);
  for (let x = r.x; x < r.x + r.w; x += 22) c.fillRect(x, 216, 2.5, 32);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(r.x, 248, r.w, 1.5);
  // the floor line of the lab (below the bench line everything is wall/floor)
  c.fillStyle = wall;
  c.fillRect(r.x, 466, r.w, r.y + r.h - 466);
}

function midRoom(c: C, env: PaintEnv) {
  // an instrument rack (left, beyond LeCun's back) and a long rack run (right), a filing cabinet
  const ink = env.fill('ink');
  c.fillStyle = ink;
  const rack = (x: number, w: number, h: number) => {
    c.fillRect(x, 600 - h, w, h);
    c.fillStyle = withAlpha(env.mood.halo, 0.25);
    for (let y = 600 - h + 14; y < 590; y += 22) for (let k = 0; k < 3; k++) c.fillRect(x + 8 + k * 9, y, 3, 3);
    c.fillStyle = ink;
  };
  rack(-160, 90, 330);
  rack(-60, 90, 300);
  rack(1390, 100, 360);
  rack(1500, 100, 330);
  // a filing cabinet with drawer pulls
  c.fillRect(1250, 470, 90, 130);
  c.fillStyle = withAlpha(env.mood.rim, 0.25);
  for (let k = 0; k < 4; k++) c.fillRect(1282, 488 + k * 30, 26, 3);
  // the floor of the room
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.4);
  c.fillRect(-500, 600, 2400, 300);
}

function bench(f: Frame, c: C, env: PaintEnv) {
  const r = { x: BENCH.x0 - 40, y: BENCH.back - 4, w: BENCH.x1 - BENCH.x0 + 80, h: FLOOR - BENCH.back + 12 };
  bake(f, c, `${ID}/bench3/${env.mood.id}`, r, (cc) => {
    const ink = env.fill('ink');
    const m = env.mood;
    // the top: a lamp-lit worktop in perspective (back edge → front edge), dark below
    const top = cc.createLinearGradient(0, BENCH.back, 0, BENCH.top);
    top.addColorStop(0, mixLab(m.set, m.setHaze, 0.5));
    top.addColorStop(1, mixLab(m.set, m.fg, 0.35));
    cc.fillStyle = top;
    cc.beginPath();
    cc.moveTo(BENCH.x0 + 18, BENCH.back);
    cc.lineTo(BENCH.x1 - 18, BENCH.back);
    cc.lineTo(BENCH.x1, BENCH.top);
    cc.lineTo(BENCH.x0, BENCH.top);
    cc.closePath();
    cc.fill();
    // the lamp's pool on the worktop
    const pg = cc.createRadialGradient(CARD.x, BENCH.back + 18, 10, CARD.x, BENCH.back + 18, 260);
    pg.addColorStop(0, withAlpha(m.halo, 0.55));
    pg.addColorStop(1, withAlpha(m.halo, 0));
    cc.save();
    cc.clip(new Path2D(`M${BENCH.x0 + 18} ${BENCH.back} L${BENCH.x1 - 18} ${BENCH.back} L${BENCH.x1} ${BENCH.top} L${BENCH.x0} ${BENCH.top} Z`));
    cc.fillStyle = pg;
    cc.fillRect(BENCH.x0, BENCH.back, BENCH.x1 - BENCH.x0, BENCH.top - BENCH.back);
    cc.restore();
    // the front edge and the body: drawers left and right, an open kneehole (the room shows through); one step
    // lighter than the figure's near-black so LeCun stays the darkest shape
    cc.fillStyle = mixLab(ink, m.set, 0.42);
    const body = new Path2D();
    body.rect(BENCH.x0, BENCH.top, BENCH.x1 - BENCH.x0, FLOOR - BENCH.top);
    body.rect(BENCH.x0 + 250, BENCH.top + 26, 300, FLOOR - BENCH.top - 26);
    cc.fill(body, 'evenodd');
    cc.fillStyle = withAlpha(m.rim, 0.4);
    cc.fillRect(BENCH.x0, BENCH.top, BENCH.x1 - BENCH.x0, 1.6);
    cc.fillStyle = withAlpha(m.rim, 0.18);
    for (const x0 of [BENCH.x0 + 16, BENCH.x0 + 572])
      for (let k = 0; k < 3; k++) {
        cc.fillRect(x0, BENCH.top + 34 + k * 44, 196, 1.2);
        cc.fillRect(x0 + 84, BENCH.top + 52 + k * 44, 28, 3);
      }
  });
}

function digitCard(c: C, env: PaintEnv) {
  // an index card lying FLAT on the worktop inside the lamp pool, foreshortened (seen from a little above), a
  // handwritten 4 in ink. Lamp-lit paper, but a step below the bulb: the lamp stays the brightest thing on the bench.
  const m = env.mood;
  const { x, y, w, h } = CARD;
  c.save();
  c.translate(x, y);
  // the worktop's perspective: the far edge a little narrower, the card turned ~10° on the bench
  c.transform(1, 0, -0.18, CARD_FS, 0, 0);
  c.rotate(-0.17);
  // a soft contact shadow on the bench
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 3, -h / 2 + 5, w, h);
  c.fillStyle = paperTone(env, 0.72);
  c.fillRect(-w / 2, -h / 2, w, h);
  // a ruled header line, as on an index card
  c.fillStyle = withAlpha(mixLab(m.rim, m.ink, 0.5), 0.45);
  c.fillRect(-w / 2 + 5, -h / 2 + 12, w - 10, 1.4);
  c.strokeStyle = mixLab(m.ink, m.set, 0.1);
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(9, -h / 2 + 18);
  c.lineTo(-16, h * 0.12);
  c.lineTo(19, h * 0.12);
  c.moveTo(8, -h * 0.08);
  c.lineTo(9, h / 2 - 8);
  c.stroke();
  c.restore();
}

function gooseneck(c: C, env: PaintEnv) {
  // base on the bench behind the card; a ribbed flexible neck rises and bends over; a small video camera head hangs
  // ~60 px over the card, its lens barrel pointing straight down at it
  const m = env.mood;
  const ink = env.fill('ink');
  const { x, y } = GOOSE;
  const hx = CAMHEAD.x, hy = CAMHEAD.y;
  // the neck: base → up → over → down into the back of the head
  const P = [x, y - 6, x + 8, y - 150, hx + 70, hy - 92, hx + 26, hy - 14] as const;
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(x, y - 3, 24, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 5, y - 16, 10, 12);
  c.strokeStyle = ink;
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(P[0], P[1]);
  c.bezierCurveTo(P[2], P[3], P[4], P[5], P[6], P[7]);
  c.stroke();
  // the ribbing (cut-lines catching the lamp)
  c.strokeStyle = withAlpha(m.rim, 0.32);
  c.lineWidth = 1;
  for (let k = 1; k < 18; k++) {
    const u = k / 18;
    const bx = (1 - u) ** 3 * P[0] + 3 * (1 - u) ** 2 * u * P[2] + 3 * (1 - u) * u * u * P[4] + u ** 3 * P[6];
    const by = (1 - u) ** 3 * P[1] + 3 * (1 - u) ** 2 * u * P[3] + 3 * (1 - u) * u * u * P[5] + u ** 3 * P[7];
    c.beginPath();
    c.moveTo(bx - 3, by - 1);
    c.lineTo(bx + 3, by + 1);
    c.stroke();
  }
  // the camera head: a boxy body tilted nose-down, a lens barrel aimed at the card, a cable loop off the back
  c.translate(hx, hy);
  c.rotate(0.12);
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(-8, -26, 46, 24, 3);
  c.fill();
  c.fillRect(-2, -32, 22, 7); // the top handle / viewfinder
  // the lens barrel, pointing down at the card, with a hood
  c.fillRect(-2, -4, 18, 14);
  c.beginPath();
  c.moveTo(-5, 10);
  c.lineTo(19, 10);
  c.lineTo(21, 16);
  c.lineTo(-7, 16);
  c.closePath();
  c.fill();
  // lit edges: the top of the body and the lens ring catch the lamp
  c.fillStyle = withAlpha(m.rim, 0.6);
  c.fillRect(-8, -26, 46, 1.3);
  c.fillRect(-2, -32, 22, 1.1);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(-7, 15, 28, 1.4);
  // the glass of the lens glints toward the card
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
  c.fillRect(1, 16, 12, 1.2);
  c.restore();
}

function beigePC(c: C, env: PaintEnv) {
  // the 1989 desktop: a low box under the monitor, a lamp-lit (beige) face, two floppy slots and a power lamp
  const m = env.mood;
  const x0 = PC.x - PC.w / 2, y0 = BENCH.top - 2 - PC.h;
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y0, PC.w, PC.h);
  c.fillStyle = mixLab(m.set, m.setHaze, 0.55);
  c.fillRect(x0 + 3, y0 + 3, PC.w - 6, PC.h - 6);
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 + 92, y0 + 10, 58, 3);
  c.fillRect(x0 + 92, y0 + 21, 58, 3);
  c.fillStyle = withAlpha(m.core, 0.8);
  c.fillRect(x0 + 14, y0 + 24, 4, 3);
}

function crtDigit(c: C, env: PaintEnv, a: number) {
  const a2 = crtTerminal.anchors({ x: CRT.x, y: CRT.y, s: CRT.s });
  const cx = a2.screen.x, cy = a2.screen.y;
  c.save();
  c.globalAlpha = a;
  c.font = `400 54px ${FONT.phosphor}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = env.mood.core;
  c.shadowColor = withAlpha(env.mood.core, 0.8);
  c.shadowBlur = 6;
  c.fillText('4', cx, cy + 2);
  c.restore();
}

// ------------------------------------------------------------------------------------------- the sack
/** the sack's slide-and-slump (on twos): null before it enters. On 'Buffalo's' it is swung in from the frame's right
 * edge onto the bench end (a short drop), skids along the worktop, squashes as it stops (~7.84) and slumps. */
const SACK_IN = 1440;
function sackAt(tq: number, at: number): { x: number; y: number; rot: number; slump: number; squash: number } | null {
  const t0 = at - 0.02;
  if (tq < t0) return null;
  const SLIDE = 0.42;
  const u = clamp01((tq - t0) / SLIDE);
  const e = 1 - (1 - u) * (1 - u) * (1 - u); // ease-out: fast in, friction stops it
  const x = (SACK_IN - SACK.x) * (1 - e);
  const d = clamp01(u / 0.26);
  const y = -38 * (1 - d) * (1 - d); // it is dropped onto the bench end, then skids
  const after = tq - (t0 + SLIDE);
  // a two-frame (one twos-tick) squash as it stops, then it settles into its slump
  const squash = after >= 0 && after < 1 / 12 + 1e-6 ? 1 : 0;
  const settle = after > 0 ? Math.exp(-after * 6) * Math.sin(after * 16) * 0.035 : 0;
  return { x, y, rot: -0.04 + settle + 0.05 * (1 - e), slump: clamp01(after / 0.25), squash };
}

function sack(c: C, env: PaintEnv, s: { x: number; y: number; rot: number; slump: number; squash: number }, dt: number) {
  const m = env.mood;
  // round 2: the canvas is the set's paper value (a step down), the stencilled words are the bright part
  const cloth = mixLab(mixLab(paperTone(env, 0.45), m.set, 0.3), m.set, 0.35);
  c.save();
  c.translate(SACK.x + s.x, SACK.y + s.y);
  c.rotate(s.rot);
  c.scale(0.85, 0.85);
  // lying on its side, the open mouth toward the lamp (left); lumpy with its load; it slumps after landing
  const hh = (104 - 10 * s.slump) * (s.squash ? 0.84 : 1);
  if (s.squash) c.scale(1.07, 1);
  const body = new Path2D();
  body.moveTo(-64, -4);
  body.bezierCurveTo(-72, -hh * 0.5, -66, -hh * 0.95, -40, -hh);
  body.bezierCurveTo(-14, -hh - 8, 8, -hh + 6, 30, -hh - 2);
  body.bezierCurveTo(60, -hh - 10, 96, -hh + 4, 118, -hh * 0.62);
  body.bezierCurveTo(132, -hh * 0.36, 128, -8, 110, -2);
  body.quadraticCurveTo(24, 6, -64, -4);
  body.closePath();
  c.fillStyle = cloth;
  c.fill(body);
  // the lamp side (left, toward the bench lamp) a touch lighter, the far end falling off: cut paper, not a flat fill
  c.save();
  c.clip(body);
  const sg = c.createLinearGradient(-70, 0, 130, 0);
  sg.addColorStop(0, withAlpha(m.halo, 0.14));
  sg.addColorStop(1, withAlpha(m.fg, 0.32));
  c.fillStyle = sg;
  c.fillRect(-80, -hh - 20, 220, hh + 30);
  // fold creases: three cut-paper creases, each a dark fold with a lit lip beside it
  const creases: [number, number, number, number, number, number][] = [
    [-30, -hh * 0.92, -14, -hh * 0.52, -24, -6],
    [56, -hh * 0.98, 70, -hh * 0.6, 60, -4],
    [96, -hh * 0.78, 108, -hh * 0.46, 100, -4],
  ];
  for (const [x0, y0, cx, cy, x1, y1] of creases) {
    c.strokeStyle = withAlpha(m.fg, 0.55);
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo(cx, cy, x1, y1);
    c.stroke();
    c.strokeStyle = withAlpha(m.rim, 0.28);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x0 - 3, y0 + 2);
    c.quadraticCurveTo(cx - 3, cy, x1 - 3, y1);
    c.stroke();
  }
  c.restore();
  c.lineWidth = 1.4;
  c.strokeStyle = withAlpha(m.ink, 0.6);
  c.stroke(body);
  // a lit top edge (the cut paper catching the window light)
  c.save();
  c.clip(body);
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 2;
  c.translate(0, 1.5);
  c.stroke(body);
  c.restore();
  // the open mouth: a dark gathered hem, the drawstring hanging loose
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.ellipse(-66, -hh * 0.48, 13, hh * 0.47, 0.08, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-70, -hh * 0.9);
  c.bezierCurveTo(-96, -hh * 0.8, -90, -20, -112, -2);
  c.stroke();
  // stencilled lettering
  c.save();
  c.translate(28, -hh * 0.62);
  c.rotate(-0.03);
  // the payoff word the line names: stacked so it can sit at the legibility floor inside the sack's belly
  const sz = legibleSize(c, `700 21px ${FONT.mono}`, 21, 'BUFFALO');
  c.font = `700 ${sz}px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // stencil paint: pale, the brightest thing on the sack
  c.fillStyle = paperTone(env, 0.92);
  c.fillText('BUFFALO', 0, -2);
  c.fillText('N.Y.', 0, -2 + sz * 1.02);
  // a stencilled double band under the name (texture: the old U.S. MAIL line read half-legible)
  const bw = sz * 4.6, by = -2 + sz * 1.02 + 6;
  c.fillRect(-bw / 2, by, bw, 2.2);
  c.fillRect(-bw / 2, by + 5.5, bw, 1.2);
  c.restore();
  c.restore();
  // envelopes sliding out of the mouth across the worktop, on twos, one after another
  // the spill: on 'mail' (dt = 0), one envelope every 0.1 s
  if (dt > -0.04) {
    for (let i = 0; i < 6; i++) {
      const st = -0.04 + i * 0.1;
      const u = clamp01((dt - st) / 0.22);
      if (u <= 0) continue;
      const e = 1 - (1 - u) * (1 - u);
      const x = SACK.x - 86 - e * (54 + 44 * i) - 10 * h01(i, 7);
      const y = BENCH.back + 12 + (i % 3) * 9 + 4 * h01(i, 8);
      envelope(c, env, x, y, -0.25 + 0.5 * h01(i, 9), i);
    }
  }
}

function envelope(c: C, env: PaintEnv, x: number, y: number, rot: number, i: number) {
  const w = 58, h = 30;
  c.save();
  c.translate(x, y);
  c.rotate(rot * 0.3);
  c.transform(1, 0, -0.5, 0.42, 0, 0); // lying on the worktop: foreshortened
  c.fillStyle = paperTone(env, 0.75 - 0.08 * (i % 3));
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(env.mood.ink, 0.5);
  c.lineWidth = 1;
  c.strokeRect(-w / 2, -h / 2, w, h);
  scribble(c, -12, 2, 30, 300 + i, { color: withAlpha(env.mood.ink, 0.8), lw: 1.4, h: 7 });
  scribble(c, -12, 11, 22, 400 + i, { color: withAlpha(env.mood.ink, 0.8), lw: 1.4, h: 7 });
  c.restore();
}

// the typewriter ghost stamp (ch03-s04's), struck on the window glass just above the sack (screen-locked, after the
// layers): ribbon-dark ink on a soft paper-tone plate breathed onto the glass, so it reads against the lit pane, kept
// clear of the sack's own stencilled BUFFALO / N.Y. Typed in 0.6 s, held at full strength to D-0.9, gone by D-0.4.
function ghostStamp(f: Frame, t: number, at: number, D: number) {
  const a = win(t, at - 0.05, at + 0.2) * (1 - win(t, D - 1.2, D - 0.6));
  if (a <= 0.003) return;
  const cam = f.cam;
  const p = toScreen(LAYERS.L4, cam, SACK.x + 64, SACK.y - 156);
  screenPass(f, (c) => {
    const text = 'BUFFALO · 1958–60';
    const shown = Math.floor(clamp01((tq12(t) - at) / 0.6) * text.length + 1e-6);
    // Special Elite at ~26 px cap height on a 1080p frame (headroom over the 22 px floor)
    const size = Math.round((20 * 26) / Math.max(1, capPx1080(c, `400 20px ${FONT.typewriter}`)));
    c.save();
    c.font = `400 ${size}px ${FONT.typewriter}`;
    const w = c.measureText('M').width * 1.02 * text.length;
    c.restore();
    c.save();
    c.globalAlpha = a;
    softPlate(c, p.x, p.y - size * 0.32, w + 120, size * 2.6, paperTone({ mood: f.mood }, 0.9), 0.62);
    c.restore();
    typedLine(c, text, p.x, p.y, { size, color: mixLab(f.mood.ink, '#2a1c16', 0.4), align: 'center', shown, seed: 58, alpha: 0.92 * a });
  });
}
