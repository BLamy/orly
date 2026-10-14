/**
 * ch05-s08 — Austin, 1984: an encyclopedia unfolds into a sea of index cards, the thin CYC taper is lit, and
 * its 'practically nothing' quote is filed (candleAmber, 14.54 s).
 *
 * CAMERA: stage → FILE insert (top-down) → the Tokyo aside on the stage.
 *   0.2 (sea)      plain cut: a one-volume desk encyclopedia lies open on the stage floor; its pages lift away
 *                  and fold into index cards that spill outward into a paper sea rolling in slow waves; small
 *                  paper ships ride it toward a far horizon. A man (Lenat) at a tall humming cabinet with a big
 *                  monochrome screen types card after card. Stamp AUSTIN · 1984 (phosphor).
 *   'Lenat's'      name card: Douglas Lenat · Cyc: common sense, typed in by hand
 *   'candle'       a very thin taper lettered CYC rises out of the sea beside his cabinet and lights by itself
 *   'hand'         the stage dims to the quote card (typewriter face on a parchment slip): “…practically nothing
 *                  that current AI technology could draw from the raw text.” — Lenat, Prakash & Shepherd, 1985
 *   'practically'  the narrator's pen underlines 'practically nothing' as it is read
 *   line end +.4   FILE (top-down): the hands fold the slip and drop it into the manila file marked CASE (three
 *                  slips already in it); the flap closes under the flat hand (wordless)
 *   file closed    the aside, across the paper sea: Tokyo, rows of tall racks of logic machines, small
 *                  researchers at keyboards; a cut-paper placard FIFTH GENERATION on the racks (prop lettering);
 *                  label TOKYO 1982 · logic, not learning — held to the end. No flags, no emblems.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, defineShot, hash1, mixLab, overscan, pose, softPlate, toScreen, withAlpha, withLife } from '../../../film';
import { cast, hands } from '../cast';
import { shelfStateAt } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { lampSpill } from '../sets/ch03-s06-kit';
import { phosphorStamp } from '../sets/ch05-s01-kit';
import { GEN, caseFile, cycTaper, clamp01, lerp, lispCabinet, lispScreen, mixCam, pulse, sm, textPlateLabel, tq12, win } from '../sets/ch05-s07-kit';
import { cardSea, logicRacks, openBook, pageFlight, paperShip, seaY, type SeaBand } from '../sets/ch05-s08-sea';

type C = CanvasRenderingContext2D;
const ID = 'ch05-s08';

// ------------------------------------------------------------------------------------------------ the stage
const FY = 640;
const BOOK = { x: 250, y: 612, s: 1.2 };
const CAB = { x: 742, y: FY, s: 1.3 };
const LEN_X = 940;
const TAPER_X = 618;
/** the Cyc taper (the same taper that stands on the study shelf in ch05-s09b) */
const CYC = { ...shelfStateAt('ch05-s09b', 'end').find((v) => v.id === 'cyc')!, rings: 0, state: 'live' as const };
const LEN_TYPE: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 7, neck: 4, head: 2, shoulderF: 34, elbowF: 74, wristF: 10, shoulderB: 22, elbowB: 80, wristB: 8 }, { handF: 'typing', handB: 'typing' });
const LEN_HAND = cast.lenat.anchor({ x: LEN_X, y: FY, facing: 'left', pose: LEN_TYPE }, 'handF');
const KEYS_Y = Math.round(LEN_HAND.y + 6);
/** (review r1) the Lisp machine is a tower + a desk with the portrait console and keyboard (Symbolics-style), the desk
 *  at his standing hands' height and reaching to them */
const LISP_O = { deskTop: (KEYS_Y - FY) / CAB.s, deskX1: (LEN_HAND.x + 8 - CAB.x) / CAB.s };
/** ONE continuous sea in three overlapping depth bands: far (L3, its top the horizon at ~430 on screen), the
 *  action band (L4, sharp, its top at ~450 on screen: Lenat and the cabinet stand shin-deep in it) and a near
 *  band (L5, the layer's light 4 px blur) that runs out of the bottom of frame. Waves 6–10 px, slow. */
const SEA3 = { y: 541, rows: 6, rowGap: 9, x0: -500, x1: 2600, cardW: 20, cardH: 8, amp: 6, wl: 300, speed: 0.8, seed: 3 };
const SEA4 = { y: 598, rows: 10, rowGap: 15, x0: -300, x1: 2500, cardW: 30, cardH: 12, amp: 8, wl: 380, speed: 0.95, seed: 7 };
const SEA5 = { y: 784, rows: 6, rowGap: 22, x0: -300, x1: 2600, cardW: 40, cardH: 16, amp: 9, wl: 440, speed: 1.05, seed: 11 };
/** the paper ships riding the far sea toward the horizon glow (L3 x; v = px/s drifting right) */
const SHIPS = [
  { x0: 420, v: 9, s: 1.2, from: 1.4 },
  { x0: 566, v: 7, s: 0.95, from: 1.8 },
  { x0: 1040, v: 6, s: 1.05, from: 1.2 },
  { x0: 1180, v: 6, s: 1.0, from: 0 },
  { x0: 1700, v: 7, s: 0.9, from: 0 },
];

// ------------------------------------------------------------------------------------------------ the quote
const Q_LINES = ['…practically nothing that current AI', 'technology could draw from the raw text.'];
const Q_ATTR = '— Lenat, Prakash & Shepherd, 1985';
const Q_SIZE = 34;

// ------------------------------------------------------------------------------------------------ Tokyo
const RACKS = { x: 1280, y: 604, n: 5, pitch: 150, h: 300 };

const FOLD_A = 0.8;
// (review r1) a tighter carry, drop and close (was 1.15 s) so the Tokyo aside starts near 11.0
const B_DUR = 0.7;
const U_B0 = 0.32;

interface B {
  D: number;
  sea: number;
  lenat: number;
  taper: number;
  quote0: number;
  under0: number;
  under1: number;
  file0: number;
  foldDur: number;
  tokyo: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const file0 = T.beat('file') - 0.15;
    // FILE: hands in with the slip (0.3 s), fold it once (0.5 s), carry + drop + close (B_DUR); hold closed ≥ .6 s
    const foldDur = FOLD_A + B_DUR;
    const b: B = {
      D,
      sea: T.beat('sea'),
      lenat: T.beat('lenat'),
      taper: T.beat('taper'),
      quote0: T.beat('quotecard'),
      under0: T.word('L0515', 'practically'),
      under1: T.wordEnd('L0515', 'nothing'),
      file0,
      foldDur,
      // the aside is cued only once the file has closed (the flap is down at u = .75)
      tokyo: Math.max(T.beat('tokyo'), file0 + FOLD_A + B_DUR * ((0.75 - U_B0) / (1 - U_B0)) + 0.42),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    if (t < b.file0) stage(f, t, b);
    else if (t < b.tokyo) fileInsert(f, t, b);
    else tokyo(f, t, b);
    // type
    phosphorStamp(f.c, { place: 'AUSTIN', date: '1984', year: 1984, at: b.sea + 0.2, until: b.quote0 - 0.1 }, { t, mood: f.mood, seed: 1984 });
    // a soft plate under the name card so the role line reads over the flying pages
    const nc = win(t, b.lenat - 0.1, b.lenat + 0.4) * (1 - win(t, b.quote0 - 0.45, b.quote0 - 0.05));
    if (nc > 0.01) softPlate(f.c, 250, 132, 560, 170, f.mood.ink, 0.5 * nc);
    nameCardLg(f.c, { name: 'Douglas Lenat', role: 'Cyc: common sense, typed in by hand', x: 56, y: 118, align: 'left', at: b.lenat, dur: b.quote0 - b.lenat - 0.05 }, { t, mood: f.mood, seed: 1985 });
    if (t >= b.quote0 - 0.4 && t < b.file0) quoteSlip(f, t, b);
    // (review r1) up ~0.4 s after the racks (≥ 3 s to read), on a denser plate over the card sea
    const lab = win(t, b.tokyo + 0.3, b.tokyo + 0.6) * (1 - win(t, b.D - 0.25, b.D));
    if (lab > 0.01) textPlateLabel(f.c, 'TOKYO 1982 · logic, not learning', 640, 506, { mood: f.mood, alpha: lab, size: 30, plate: 0.82 });
  },
});

// ================================================================================================= STAGE
// a slow truck right (~95 px) and dolly in across the stage: the bands slide past each other
const CS0: Camera3 = { x: 596, y: 522, z: 160, lens: 1 };
const CS1: Camera3 = { x: 690, y: 516, z: 230, lens: 1 };
const CT0: Camera3 = { x: 1556, y: 486, z: 200, lens: 1 };
const CT1: Camera3 = { x: 1600, y: 480, z: 270, lens: 1 };
const CAMS = [CS0, CS1, CT0, CT1];

function stageCam(t: number, b: B): Camera3 {
  return mixCam(CS0, CS1, sm(t / (b.file0 + 0.5)));
}

function seaBands(t: number, b: B) {
  // the sea spreads outward from the book
  const R = 2000 * sm((t - b.sea) / 3.6);
  const reach = (x: number) => clamp01((R - Math.abs(x - BOOK.x) + 40) / 140);
  return {
    s3: { ...SEA3, t, reach: (x: number) => clamp01((R * 1.1 - Math.abs(x - BOOK.x) - 60) / 200), light: (r: number) => 0.32 + r * 0.04 } as SeaBand,
    s4: { ...SEA4, t, reach, light: (r: number) => 0.38 + 0.06 * r } as SeaBand,
    s5: { ...SEA5, t, reach: (x: number) => clamp01((R - Math.abs(x - BOOK.x) - 140) / 160), light: () => 0.32 } as SeaBand,
  };
}

/** the backdrop, far sea, horizon glow and ships (shared by the stage and the Tokyo aside) */
function seaWorld(f: Frame, t: number, b: B, opts: { racks: boolean }) {
  const sea = seaBands(t, b);
  // the horizon glow behind the cabinet: Lenat stands against the lightest part of the sky
  f.backlight({ sunX: opts.racks ? 760 : 880, sunY: 400, sunRadius: 820, intensity: 1.15 });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, CAMS, 60);
    f.cached(`${ID}/L2b/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      // the dark of the flies above (a soft ramp, no folds), opening down onto the glow
      const g = cc.createLinearGradient(0, r.y, 0, 330);
      g.addColorStop(0, withAlpha(mixLab(env.fill('set'), env.mood.fg, 0.5), 0.9));
      g.addColorStop(0.55, withAlpha(mixLab(env.fill('set'), env.mood.fg, 0.3), 0.45));
      g.addColorStop(1, withAlpha(env.fill('set'), 0));
      cc.fillStyle = g;
      cc.fillRect(r.x, r.y, r.w, 330 - r.y);
      // the far shore: a hazed ridge of card piles and shelving along the horizon
      cc.fillStyle = env.fill('set');
      cc.beginPath();
      cc.moveTo(r.x, 560);
      let x = r.x;
      let k = 0;
      while (x < r.x + r.w) {
        const h = 22 + 40 * (0.5 + 0.5 * hash1(k, 51)) + 34 * Math.max(0, Math.sin(k * 0.37 + 1.1));
        const w = 26 + 40 * (0.5 + 0.5 * hash1(k, 52));
        const top = 512 - h;
        if (hash1(k, 53) > 0.35) {
          // a shelving stack: straight sides, a flat top, shelf lines
          cc.lineTo(x, top);
          cc.lineTo(x + w, top);
        } else {
          // a heap of cards: a soft mound
          cc.quadraticCurveTo(x + w / 2, top - 10, x + w, 512 - h * 0.4);
        }
        x += w;
        k++;
      }
      cc.lineTo(r.x + r.w, 560);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.setHaze, 0.35);
      cc.lineWidth = 1;
      for (let y = 470; y < 512; y += 9) {
        cc.beginPath();
        cc.moveTo(r.x, y);
        cc.lineTo(r.x + r.w, y);
        cc.stroke();
      }
    })(c, r.x, r.y);
  });
  f.fog({ yCenter: 0.6 * 720, height: 0.3 * 720, alpha: 0.2, drift: 6 });
  f.layer('L3', (c, env) => {
    // far sea + the paper ships riding it right, toward the horizon glow
    cardSea(c, { ...sea.s3, from: 0, to: 2 }, env);
    for (const [i, sp] of SHIPS.entries()) {
      const x = sp.x0 + sp.v * t;
      const a = (sea.s3.reach ? sea.s3.reach(x) : 1) * clamp01((t - sp.from) / 0.6);
      if (a < 0.05) continue;
      const y = seaY(sea.s3, x, 1) + 2;
      const slope = (seaY(sea.s3, x + 6, 1) - seaY(sea.s3, x - 6, 1)) / 12;
      c.save();
      c.globalAlpha *= a;
      paperShip(c, x, y, sp.s, Math.atan(slope) * 0.8 + 0.02 * Math.sin(t * 1.3 + i), env);
      c.restore();
    }
    cardSea(c, { ...sea.s3, from: 2, to: sea.s3.rows }, env);
    if (opts.racks) tokyoRacks(c, env, t, b);
  });
  f.fog('B');
  return sea;
}

/** the theatre's valance across the top of frame (L5, near, blurred): straight pleats, fg value */
function valance(f: Frame) {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, [...CAMS], 80);
    f.cached(`${ID}/valance/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 420 - Math.floor(r.y), (cc) => {
      cc.translate(-r.x, -Math.floor(r.y));
      const yB = 392;
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(r.x, r.y);
      cc.lineTo(r.x + r.w, r.y);
      cc.lineTo(r.x + r.w, yB);
      for (let x = r.x + r.w; x > r.x; x -= 90) cc.quadraticCurveTo(x - 45, yB + 16, x - 90, yB);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
      cc.lineWidth = 2;
      for (let x = Math.ceil(r.x / 45) * 45; x < r.x + r.w; x += 45) {
        cc.beginPath();
        cc.moveTo(x, r.y);
        cc.lineTo(x, yB - 4);
        cc.stroke();
      }
      cc.fillStyle = withAlpha(env.mood.rim, 0.22);
      cc.fillRect(r.x, yB - 18, r.w, 2);
    })(c, r.x, Math.floor(r.y));
  });
}

function stage(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const cam = stageCam(t, b);
  f.camera(cam);
  const sea = seaWorld(f, t, b, { racks: false });
  // (review r1) the taper rises out of the sea in ~0.9 s from 'candle' and lights itself at ~3.3, well before
  // 'by hand', with a small practical bloom pulse
  const rise = taperRise(t, b);
  const taperLit = win(t, b.taper + 0.82, b.taper + 1.02);
  const screen = 0.85;
  const lenP = withLife(typeLoop(LEN_TYPE, tq), tq, 1984, 0.7);
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, CAMS, 40);
    // the stage floor (dark boards), under the sea
    c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
    c.fillRect(r.x, SEA4.y + 4, r.w, r.y + r.h - SEA4.y - 4);
    // the floor's own light: the screen's and the open book's warm spill (it carries the frame before the sea)
    c.save();
    c.translate((BOOK.x + CAB.x) / 2 + 40, FY + 20);
    c.scale(1, 0.2);
    const fp = c.createRadialGradient(0, 0, 10, 0, 0, 760);
    fp.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.setHaze, 0.35), 0.6));
    fp.addColorStop(0.5, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.2), 0.32));
    fp.addColorStop(1, withAlpha(env.mood.set, 0));
    c.fillStyle = fp;
    c.fillRect(-800, -800, 1600, 1600);
    c.restore();
    // the back rows of the sea
    cardSea(c, { ...sea.s4, from: 0, to: 3 }, env);
    // the book and its lifting pages
    openBook(c, BOOK.x, BOOK.y, BOOK.s, env, pageLift(t, b));
    for (let i = 0; i < 14; i++) {
      const born = b.sea + 0.05 + i * 0.26;
      const land = [0, 1, 2].map((k) => {
        const dir = (i + k) % 2 ? 1 : -1;
        const dist = 160 + 90 * k + 50 * ((i * 7) % 5);
        const x = BOOK.x + dir * dist;
        return { x, y: seaY(sea.s4, x, 3) - 4 };
      });
      pageFlight(c, { x: BOOK.x + ((i % 3) - 1) * 40, y: BOOK.y - 60, t, born, land, seed: i + 3 }, env);
    }
    // the cabinet, humming; its keyboard on a pedestal; Lenat typing card after card
    lispCabinet(c, CAB.x, CAB.y, CAB.s, screen, env, { ...LISP_O, rows: 0.4 + 0.6 * ((Math.floor(tq * 3) % 12) / 12) });
    // a small stack of cards beside him (he copies from them)
    cast.lenat.draw(c, { x: LEN_X, y: FY, facing: 'left', pose: lenP, cutLines: true, light: { x: -1, y: -0.3, floor: 0.2 } }, env);
    // the Cyc taper rising out of the sea beside the cabinet and lighting by itself
    if (rise > 0) {
      c.save();
      c.beginPath();
      c.rect(TAPER_X - 40, -400, 80, FY - 4 + 400);
      c.clip();
      const yb = FY + 330 * (1 - rise);
      // (its CYC lettering at the legibility floor: the taper is the subject on 'candle')
      cycTaper(c, env, TAPER_X, yb, taperLit, 1.15, 0, { widthK: 1.6, labelPx: 21, labelLight: 1 });
      c.restore();
    }
    // the front rows of the sea (around his ankles and the taper's foot)
    cardSea(c, { ...sea.s4, from: 3, to: 7 }, env);
  });
  f.rim({ x: -0.6, y: -0.8 });
  const sc = lispScreen(CAB.x, CAB.y, CAB.s, LISP_O.deskTop);
  f.practical({ x: sc.x, y: sc.y, kind: 'screen', seed: 84, intensity: 0.55 * screen, radius: 70 });
  if (taperLit > 0) {
    const fl = candleFlame({ x: TAPER_X, y: FY, view: CYC, s: 1.15 });
    f.practical({ x: fl.x, y: fl.y + 2, kind: 'candle', seed: 1984, intensity: 0.8 * taperLit + 0.6 * pulse(t, b.taper + 0.84, 0.08, 0.45), radius: 30 + 14 * taperLit + 10 * pulse(t, b.taper + 0.84, 0.08, 0.45) });
  }
  f.layer('L5', (c, env) => cardSea(c, sea.s5, env));
  valance(f);
  void toScreen;
}

function taperRise(t: number, b: B) {
  const u = clamp01((t - b.taper + 0.05) / 0.9);
  return u * u * (3 - 2 * u) * 0.6 + 0.4 * (1 - Math.pow(1 - u, 3));
}

/** the top leaf of the book standing up just before each page leaves */
function pageLift(t: number, b: B) {
  if (t < b.sea - 0.2 || t > b.sea + 0.05 + 13 * 0.26 + 0.1) return 0;
  const ph = ((t - (b.sea - 0.2)) / 0.26) % 1;
  return Math.sin(ph * Math.PI) * 0.9;
}

/** two-drawing typing loop on twos */
function typeLoop(base: Pose, tq: number): Pose {
  const d = Math.floor(Math.floor(tq * 12 + 1e-6) / 2) % 2;
  const a = base.angles;
  return { ...base, angles: { ...a, elbowF: (a.elbowF ?? 0) + (d ? 4 : -4), wristF: (a.wristF ?? 0) + (d ? -4 : 4), elbowB: (a.elbowB ?? 0) + (d ? -3 : 3), head: (a.head ?? 0) + (d ? 0.6 : 0) } };
}

// ================================================================================================= QUOTE
function quoteSlip(f: Frame, t: number, b: B) {
  const c = f.c;
  const P = f.mood;
  const a = win(t, b.quote0 - 0.25, b.quote0 + 0.3) * (1 - win(t, b.file0 - 0.22, b.file0));
  // the stage dims to the card
  c.save();
  c.fillStyle = withAlpha(P.ink, 0.66 * a);
  c.fillRect(0, 0, 1280, 720);
  c.restore();
  const W = 860, H = 236;
  const x0 = 640 - W / 2, y0 = 228;
  c.save();
  c.globalAlpha = a;
  c.translate(640, y0 + H / 2);
  c.rotate(-0.012);
  c.translate(-640, -(y0 + H / 2));
  softPlate(c, 640, y0 + H / 2, W + 120, H + 120, P.ink, 0.5);
  c.fillStyle = withAlpha(P.fg, 0.5);
  c.fillRect(x0 + 8, y0 + 10, W, H);
  const paper = mixLab('#e6d7b8', P.halo, 0.18);
  c.fillStyle = paper;
  c.fillRect(x0, y0, W, H);
  const ink = '#2a211b';
  c.font = `400 ${Q_SIZE}px ${FONT.typewriter}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = withAlpha(ink, 0.92);
  const lx = x0 + 52;
  const ly = [y0 + 82, y0 + 132];
  Q_LINES.forEach((ln, i) => c.fillText(ln, lx, ly[i]));
  c.font = `italic 400 24px ${FONT.text}`;
  c.textAlign = 'right';
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillText(Q_ATTR, x0 + W - 46, y0 + 192);
  // the pen underlines 'practically nothing' as it is read
  c.font = `400 ${Q_SIZE}px ${FONT.typewriter}`;
  const ux0 = lx + c.measureText('…').width;
  const ux1 = lx + c.measureText('…practically nothing').width;
  const u = clamp01((t - b.under0 + 0.05) / (b.under1 - b.under0 + 0.1));
  if (u > 0) {
    c.strokeStyle = withAlpha('#1d2236', 0.85);
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    const yU = ly[0] + 9;
    const xe = lerp(ux0, ux1, u);
    c.moveTo(ux0 - 2, yU + 1);
    for (let x = ux0; x <= xe; x += 8) c.lineTo(x, yU + Math.sin(x * 0.07) * 1.1 + (x - ux0) * 0.004);
    c.stroke();
  }
  c.restore();
}

// ================================================================================================= FILE
function fileInsert(f: Frame, t: number, b: B) {
  f.camera(CAMERA3_HOME);
  f.backlight({ sunX: 980, sunY: 200, sunRadius: 500, intensity: 0.3 });
  const tq = tq12(t);
  const drop = { x: 790, y: 380 };
  const entry = { R: { x: 1460, y: 820 }, L: { x: 1300, y: 960 } };
  // phase A: both hands bring the slip over the file and fold it once (bottom half up: height 1 → .5)
  const a = tq - b.file0;
  const inA = a < FOLD_A;
  const u = inA ? U_B0 * sm(a / 0.3) : U_B0 + (1 - U_B0) * clamp01((a - FOLD_A) / B_DUR);
  const fold = inA ? sm((a - 0.3) / 0.5) : 1;
  f.layer('L4', (c, env) => {
    caseFile(c, env, { x: 640, y: 400, cover: win(u, 0.56, 0.74), slips: 3, drop: win(u, 0.42, 0.52), t });
    // the fold happens in the clear, over the dark desk beside the file; then the slip is carried to the file
    const HOLD = { x: 1090, y: 268 };
    const dk = u <= U_B0 ? 0 : sm((u - U_B0) / (0.45 - U_B0));
    const dEff = { x: HOLD.x + (drop.x - HOLD.x) * dk, y: HOLD.y + (drop.y - HOLD.y) * dk };
    const pose = u > 0 && u < 1 ? hands.act('fileFold', u, dEff, { held: 'slip', scale: 1.45, entry, dropAt: dEff }) : null;
    if (!pose) return;
    let slipAt: { x: number; y: number } | null = null;
    hands.draw(c, pose, env, {
      heldDraw: (cc, at, _h, e) => {
        slipAt = at;
        drawSlip(cc, at.x - 128, at.y - 27, fold, e);
      },
    });
    // the support hand pinches the slip's lower edge and carries it up over the crease (phase A only)
    const sa = slipAt as { x: number; y: number } | null;
    if (inA && sa) {
      const H0 = 70;
      const edgeY = sa.y - 27 + H0 / 2 + (H0 / 2) * Math.cos(Math.PI * fold);
      // (it holds the left part of the lower edge, clear of the working hand)
      const inK = sm(a / 0.3) * (1 - sm((a - 0.62) / 0.18));
      const tgt = { x: sa.x - 96, y: edgeY + 4 };
      const from = { x: entry.L.x - 120, y: entry.L.y - 140 };
      const pt = { x: from.x + (tgt.x - from.x) * inK, y: from.y + (tgt.y - from.y) * inK };
      const left = hands.reach(entry.L, pt, 'pinch', 118 * 1.45, { bend: 0.1 });
      hands.draw(c, { left, scale: 1.45 }, env);
    }
  });
  lampSpill(f, 0.85, false);
  fileNear(f, t);
}

/** (review r1) the file insert as a study insert (ch05-s06): the lamp's falloff into dark corners, and an out-of-focus
 *  near plane — the green lamp shade's rim over the top-right corner and a pen across the bottom-left (L5) */
function fileNear(f: Frame, t: number) {
  void t;
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/fileNear/${env.mood.id}`, 1280, 720, (cc) => {
      const m = env.mood;
      // the shade: a dark green-black disc edge, its lit inner lip
      cc.fillStyle = mixLab(env.fill('fg'), '#1d2a1c', 0.35);
      cc.beginPath();
      cc.ellipse(1250, -40, 300, 190, -0.25, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.3), 0.8);
      cc.lineWidth = 14;
      cc.beginPath();
      cc.ellipse(1250, -40, 296, 186, -0.25, 1.75, 3.2);
      cc.stroke();
      // a fountain pen lying across the corner of the desk, nearer than the file
      cc.save();
      cc.translate(120, 640);
      cc.rotate(-0.42);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.roundRect(-240, -24, 400, 48, 24);
      cc.fill();
      cc.fillRect(160, -14, 50, 28);
      cc.fillStyle = withAlpha(m.rim, 0.4);
      cc.fillRect(-220, -21, 360, 4);
      cc.restore();
    }, { blur: 9 })(c, 0, 0);
  });
  // the falloff: the pool holds the file, the corners go to near-black
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  const g = c.createRadialGradient(700, 380, 220, 700, 380, 860);
  g.addColorStop(0, withAlpha(f.mood.ink, 0));
  g.addColorStop(0.55, withAlpha(f.mood.ink, 0.3));
  g.addColorStop(1, withAlpha(f.mood.ink, 0.78));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
}

/** the typed slip, top-down, folded once along its middle: `fold` 0 flat … 1 folded (the lower half laid up over
 *  the upper; visible height 1 → .5) with the crease line */
function drawSlip(c: C, x: number, y: number, fold: number, e: PaintEnv) {
  const W = 150, H0 = 70, mid = H0 / 2;
  const paper = mixLab('#e6d7b8', e.mood.halo, 0.25);
  const back = mixLab(paper, e.mood.set, 0.22);
  const lowH = mid * Math.cos(Math.PI * fold); // > 0: still below the crease; < 0: laid up over the top half
  c.save();
  c.translate(x, y);
  c.fillStyle = withAlpha(e.mood.fg, 0.35);
  c.fillRect(4, 5, W, mid + Math.max(0, lowH));
  // the upper half with its typed lines
  c.fillStyle = paper;
  c.fillRect(0, 0, W, mid);
  c.fillStyle = withAlpha(e.mood.ink, 0.45);
  c.fillRect(12, 10, 120, 3);
  c.fillRect(12, 22, 112, 3);
  if (lowH >= 0) {
    c.fillStyle = paper;
    c.fillRect(0, mid, W, lowH);
    c.fillStyle = withAlpha(e.mood.ink, 0.45 * (lowH / mid));
    if (lowH > 14) c.fillRect(12, mid + 6 * (lowH / mid), 116, 3 * (lowH / mid));
  } else {
    // the lower half, turned over, lying on the upper half: its plain back, a soft shadow at the edge
    c.fillStyle = withAlpha(e.mood.fg, 0.25);
    c.fillRect(0, mid + lowH - 2, W, 3);
    c.fillStyle = back;
    c.fillRect(0, mid + lowH, W, -lowH);
  }
  // the crease
  c.strokeStyle = withAlpha(e.mood.ink, 0.25 + 0.3 * Math.sin(Math.PI * Math.min(1, fold * 1.0)) + 0.15 * fold);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, mid);
  c.lineTo(W, mid);
  c.stroke();
  c.restore();
}

// ================================================================================================= TOKYO
function tokyo(f: Frame, t: number, b: B) {
  const cam = mixCam(CT0, CT1, sm((t - b.tokyo) / (b.D - b.tokyo)));
  f.camera(cam);
  const sea = seaWorld(f, t, b, { racks: true });
  f.layer('L4', (c, env) => {
    const r = overscan(LAYERS.L4, CAMS, 40);
    c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
    c.fillRect(r.x, SEA4.y + 4, r.w, r.y + r.h - SEA4.y - 4);
    cardSea(c, sea.s4, env);
  });
  f.rim({ x: -0.5, y: -0.8 });
  // the racks' working light (soft, warm): a practical at the middle of the rows
  f.practical({ x: RACKS.x + 2 * RACKS.pitch, y: RACKS.y - 120, kind: 'lamp', seed: 1982, intensity: 0.4, radius: 120, layer: 'L3' });
  f.layer('L5', (c, env) => cardSea(c, sea.s5, env));
  valance(f);
  // the cut in from the file: a short fade up from the dark (the aside)
  const fin = 1 - win(t, b.tokyo, b.tokyo + 0.4);
  if (fin > 0.01) {
    f.c.save();
    f.c.fillStyle = withAlpha(f.mood.ink, 0.8 * fin);
    f.c.fillRect(0, 0, 1280, 720);
    f.c.restore();
  }
}

/** the far shore: racks of logic machines with researchers at keyboards (generic, calm, working) */
function tokyoRacks(c: C, env: PaintEnv, t: number, b: B) {
  if (t < b.tokyo - 0.05) return;
  const tq = tq12(t);
  // a low raised floor (the far shore) the racks stand on
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.2);
  c.fillRect(RACKS.x - 140, RACKS.y - 4, RACKS.n * RACKS.pitch + 180, 30);
  logicRacks(c, { ...RACKS, placard: 'FIFTH GENERATION', t }, env);
  // researchers seated at keyboards in front of the racks, alternately facing
  const people = [
    { p: GEN.readerA, x: RACKS.x + 0.42 * RACKS.pitch, face: 'right' as const },
    { p: GEN.readerD, x: RACKS.x + 1.58 * RACKS.pitch, face: 'left' as const },
    { p: GEN.readerC, x: RACKS.x + 2.42 * RACKS.pitch, face: 'right' as const },
    { p: GEN.readerB, x: RACKS.x + 3.58 * RACKS.pitch, face: 'left' as const },
  ];
  people.forEach((q, i) => {
    const P0 = { ...TYPE_SIT };
    const pz = withLife(typeLoop(P0, tq + i * 0.11), tq, 82 + i, 0.6);
    const s = 0.62;
    const hand = q.p.anchor({ x: q.x, y: RACKS.y, facing: q.face, pose: TYPE_SIT, scale: s }, 'handF');
    // a low console desk before each
    const dx = q.face === 'right' ? 1 : -1;
    c.fillStyle = env.fill('ink');
    c.fillRect(Math.min(hand.x - dx * 6, hand.x + dx * 46), hand.y + 4, 52, 4);
    c.fillRect(hand.x + dx * 20 - 2, hand.y + 8, 4, RACKS.y - hand.y - 8);
    c.fillRect(hand.x + dx * 26 - 10, hand.y - 30, 22, 30); // a small terminal
    c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.45);
    c.fillRect(hand.x + dx * 26 - 7 + (dx < 0 ? 0 : 0), hand.y - 27, 16, 13);
    // stool
    c.fillStyle = env.fill('ink');
    c.fillRect(q.x - 16, RACKS.y - 72 * s - 2, 32, 4);
    c.fillRect(q.x - 2, RACKS.y - 72 * s, 4, 72 * s);
    q.p.draw(c, { x: q.x, y: RACKS.y, facing: q.face, pose: pz, scale: s }, env);
  });
}
const TYPE_SIT: Pose = pose({ hipF: 86, kneeF: -84, hipB: 82, kneeB: -78, torso: 7, neck: 2, head: 4, shoulderF: 14, elbowF: 78, wristF: 8, shoulderB: 10, elbowB: 80, wristB: 8 }, { handF: 'typing', handB: 'typing' });
