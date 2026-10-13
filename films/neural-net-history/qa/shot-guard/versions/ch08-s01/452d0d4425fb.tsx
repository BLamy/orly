/**
 * ch08-s01 — DEEP DIVE opens: the expert-features candle is set on the shelf; in a craftsman's workshop tin
 * stencils are cut by hand, and even with five guesses a quarter of the ring of pictures goes dark
 * (candleAmber throughout; 16.83 s; in: paperWipe from ch07-s06's study).
 *
 *   0.1           CHAPTER INDEX TAB 'DEEP DIVE · The Night in Florence' drops at top-left, holds 2.5 s, slides up
 *   'promise'     SHELF (low macro): the two steady hands bring a tall candle into the lamp's pool, already burning,
 *                 its ghost sleeve eleven rings long (1999 → 2010)
 *   'belief'      they set it into its year's place, left of the guttered 2006 candle (tag 1999); the belief rises
 *                 on a plate: TO SEE, A MACHINE NEEDS FEATURES DESIGNED BY EXPERTS
 *   'experts'     an unseen hand draws a sheet of dark paper across the frame (same lamp, never a dim to black);
 *                 behind it, the WORKSHOP: a craftsman cuts tin stencils with snips under a hanging lamp, finished
 *                 stencils hang on hooks like tools; IMAGENET CHALLENGE · 2010–2011
 *   ≈ +1.5 s      he carries his stencil to the judge's lectern (camera trucks with him)
 *   'five'        a husky thumbnail is pinned on the lectern's board, five guess slips fan beneath it; one slip
 *                 is ticked (top-5 scoring, shown, not said); the label: top-5 error · 2010: 28.2% · 2011: ≈ 25.8%
 *   'best'        the 2010 and 2011 lanterns glow on the ruled leaderboard, barely a hand's width apart
 *   'four'        seven of the ring's 25 thumbnails go dark, one after another (28 %: more than one in four)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { createPuppet, defineShot, placeStamp, pose, withLife, walkTo, PUPPET_NEAR_BLACK, withAlpha, mixLab, toScreen, toLayer, LAYERS, FONT, legibleSize, hash1, textRole, MOODS } from '../../../film';
import { createFrame } from '../../../film/core/frame';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import type { PuppetSpec } from '../../../film/contracts';
import { hands } from '../cast';
import { HAND_LEN, handsEntry, type ArmPose, type HandsPose, type Pt } from '../sets/narratorHands';
import { STUDY, STUDY_WALL, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { beliefCandle, candleFlame, candleShelf, shelfFlames } from '../sets/beliefCandle';
import { indexTab } from '../sets/indexTab';
import { beliefLabel, monoCard } from '../sets/ch07-s01-kit';
import { clamp01, lerp, mixCam, sm, tq12, win } from '../sets/ch08-s01-kit';
import { WS, benchAndLamp, benchWork, guesses, lectern, leaderboard, thumbRing, tinPlate, workshopBack } from '../sets/ch08-s01-workshop';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s01';

// ------------------------------------------------------------------------------------------------ the study shelf
const V0 = shelfStateAt(ID, 'start');
const VE = shelfStateAt(ID, 'end').find((v) => v.id === 'experts')!;
/** eleven rings already burned (1999 to 2010), live; its base tag ('lit 1999') is drawn by this shot, larger than
 *  the shelf's own tags, so it reads at 1080p (≥ 26 px) in the macro */
const EXPERTS = { ...VE, rings: 11, state: 'live' as const, tag: '' };
const TAG_TEXT = 'lit 1999';
const EX = candleX(shelfStateAt(ID, 'end'), 'experts');
const SHELF_Y = STUDY.shelf.y;
/** the macro sits the new candle on the RIGHT third (the older candles fill the left two thirds), and dollies in a
 *  touch while it trucks, so the near shelf bracket and book spines (L5) slide against the shelf */
const SH0: Camera3 = { x: EX - 64, y: SHELF_Y - 150, z: 420, lens: 1 };
const SH1: Camera3 = { x: EX - 122, y: SHELF_Y - 160, z: 474, lens: 1 };
const STUDY_CAMS = [SH0, SH1];

// ------------------------------------------------------------------------------------------------ the workshop
const W0: Camera3 = { x: 486, y: 372, z: 150, lens: 1 };
/** REVIEW r1 (artistry): a slow push in of ≈ 60 z toward the plate during 8.6 → 9.8 s, so the cut on 'by hand' reads */
const W0P: Camera3 = { x: 452, y: 392, z: 212, lens: 1 };
const W1: Camera3 = { x: 868, y: 360, z: 40, lens: 1 };
const W2: Camera3 = { x: 892, y: 352, z: 92, lens: 1 };
const WS_CAMS = [W0, W0P, W1, W2];
const CRAFT_SPEC: PuppetSpec = {
  id: 'ch08-craftsman', height: 318, build: 'average', era: '1990s', wardrobe: 'rolledSleeves', hair: 'receding',
  facialHair: 'beard', glasses: 'round', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.48, jaw: 0.52 }, prop: 'none',
  details: ['placket', 'cuff', 'belt'],
};
const CRAFT = createPuppet(CRAFT_SPEC);
/** he cuts standing at the bench's left end, so the plate and snips are held up against window 1's glass */
const CX0 = 318;
const CX1 = 676;
/** at the bench: forearms forward and down over the plate, snips in the near hand */
const CUT_A: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: 9, neck: 4, head: 14, shoulderF: 52, elbowF: 48, wristF: -10, shoulderB: 40, elbowB: 52, wristB: -6 }, { handF: 'grip', handB: 'pinch' });
const CUT_B: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: 9, neck: 4, head: 14, shoulderF: 48, elbowF: 56, wristF: 6, shoulderB: 40, elbowB: 52, wristB: -6 }, { handF: 'fist', handB: 'pinch' });
/** at the lectern: presenting the stencil toward the board */
const PRESENT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 2, neck: 6, head: -9, shoulderF: 58, elbowF: 38, wristF: -16, shoulderB: -8, elbowB: 14 }, { handF: 'pinch' });
/** 'by hand': the plate held up at chest height, clear of the torso, against the window; the snips biting its edge */
const RAISE: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: 4, neck: 8, head: 20, shoulderF: 44, elbowF: 92, wristF: -24, shoulderB: 38, elbowB: 98, wristB: -18 }, { handF: 'grip', handB: 'pinch' });
const WATCH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 7, head: -10, shoulderF: 6, elbowF: 22, wristF: 4, shoulderB: -8, elbowB: 14 }, { handF: 'pinch' });
const WALK_CAD = 1.12;

interface B {
  D: number;
  tab: number;
  promise: number;
  /** REVIEW r1 (sync): the hands enter at 1.6, so the candle is in the lamp's pool by ≈ 2.1 */
  handsIn: number;
  inPool: number;
  candle: number;
  release: number;
  handsOut: number;
  workshop: number;
  wipeA: number;
  wipeB: number;
  cut0: number;
  /** the two snip closes on 'by hand' (on twos), each dropping a curl of tin */
  snipsAt: number[];
  /** the plate is lifted against the window (raise0 → raise1) and lowered again (lower0 → walk) */
  raise0: number;
  raise1: number;
  lower0: number;
  /** 'guesses': the ticked slip lifts for one 'two' */
  guessW: number;
  walk: number;
  arrive: number;
  five: number;
  best: number;
  four: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const workshop = T.beat('workshop');
    // 'by hand' is one clear cut action: the plate comes up against the window after the wipe, the snips close
    // twice (on 'by' and on 'hand', on twos), a curl of tin drops from each bite, then he lowers it and walks
    const by = T.word('L0802', 'by#2');
    const hand = T.word('L0802', 'hand');
    const snipsAt = [tq12(by + 1 / 24), tq12(hand + 0.04 + 1 / 24)];
    const walk = hand + 0.44;
    const b: B = {
      D,
      tab: T.beat('indexTab'),
      promise: T.beat('promise'),
      handsIn: T.beat('promise') - 0.2,
      inPool: T.beat('promise') + 0.35,
      candle: T.beat('candle'),
      release: T.beat('candle') + 0.02,
      handsOut: T.beat('candle') + 0.36,
      workshop,
      wipeA: workshop - 0.6,
      wipeB: workshop + 0.6,
      cut0: workshop + 0.15,
      snipsAt,
      raise0: workshop + 0.62,
      raise1: by - 0.3,
      lower0: snipsAt[1] + 0.2,
      guessW: T.word('L0802', 'guesses'),
      walk,
      arrive: 0,
      five: T.beat('guesses'),
      best: T.beat('board'),
      four: T.beat('four'),
    };
    b.arrive = walkTo(CRAFT_SPEC, { x0: CX0, x1: CX1, at: b.walk, cadence: WALK_CAD })(b.walk).arrive;
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    // the wipe: the study stays the main plate until the sheet has fully crossed; the workshop is painted into its
    // own frame and shown only on the sheet's trailing side, so one of the two rooms is always in view
    if (t < b.wipeB) paintStudy(f, t, b);
    else paintWorkshop(f, t, b);
    if (t >= b.wipeA && t < b.wipeB) workshopBehindSheet(f, t, b);
    // screen-locked type: the belief, on a soft plate in the open wall left of the new candle
    const ba = win(t, b.candle + 0.15, b.candle + 0.65) * (1 - win(t, b.wipeA - 0.45, b.wipeA - 0.05));
    if (ba > 0.003) {
      labelPlate(f.c, 560, 196, 470, 96, ba, f.mood);
      beliefLabel(f.c, ['TO SEE, A MACHINE NEEDS', 'FEATURES DESIGNED BY EXPERTS'], 560, 186, ba, f.mood, { size: 22, align: 'center' });
    }
    if (t >= b.workshop) {
      placeStamp(f.c, { place: 'IMAGENET CHALLENGE', date: '2010–2011', year: 2010, at: b.wipeB + 0.1 }, { t, mood: f.mood });
      const la = win(t, b.five + 0.25, b.five + 0.75);
      // two lines at the legibility floor (one card, one text item): the measure, then the two years' scores
      const ls = legibleSize(f.c, `500 21px ${FONT.mono}`, 21);
      if (la > 0) monoCard(f.c, { x: 1010, y: 552, lines: ['top-5 error', '2010: 28.2% · 2011: ≈ 25.8%'], size: ls, alpha: la, rise: la, seed: 81 }, f.mood);
    }
    wipeSheet(f, t, b);
    indexTab(f.c, { title: 'DEEP DIVE · The Night in Florence', at: b.tab, hold: 2.5 }, { t, mood: f.mood });
  },
});

// ================================================================================================= THE STUDY
function shelfCam(t: number, b: B): Camera3 {
  return mixCam(SH0, SH1, sm(t / b.workshop));
}

/** the candle's base position (world): carried in from the lower right, lowered into its slot on 'belief' */
function candleBase(tq: number, b: B): Pt {
  const above = { x: EX, y: SHELF_Y - 30 };
  const from = { x: EX + 420, y: SHELF_Y + 190 };
  const t1 = b.candle - 0.5;
  if (tq <= b.handsIn) return from;
  if (tq < b.inPool) {
    const u = sm((tq - b.handsIn) / (b.inPool - b.handsIn));
    return { x: lerp(from.x, above.x, u), y: lerp(from.y, above.y, u) - 40 * Math.sin(Math.PI * u) };
  }
  // held in the pool above its slot (a breath of settle), then lowered in on 'belief'
  if (tq < t1) return { x: above.x, y: above.y - 3 * Math.sin(Math.PI * clamp01((tq - b.inPool) / (t1 - b.inPool))) };
  if (tq < b.candle) return { x: EX, y: lerp(above.y, SHELF_Y, sm((tq - t1) / (b.candle - t1))) };
  return { x: EX, y: SHELF_Y };
}

function paintStudy(f: Frame, t: number, b: B) {
  const cam = shelfCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'winterBlue', kind: 'city' } });
  studyWindow(f);
  const base = candleBase(tq, b);
  const entry = handsEntry(cam, 'L4');
  // the second hand comes in from the lower LEFT (off frame), to steady the candle's base
  const entryL = toLayer(LAYERS.L4, cam, -200, 1000);
  const placed = tq >= b.candle;
  const fl = candleFlame({ x: base.x, y: base.y, view: EXPERTS, s: STUDY.shelf.s });
  // the shelf's wax lettering (the older candles, and the new one's own sleeve lettering) is TEXTURE in this macro:
  // the belief is read from the plate (≥ 22 px cap) that rises on 'belief', and the base tag 'lit 1999' is subject.
  // The shelf is drawn here (not by studyCase) so the role is set on the L4 layer's own context.
  const shelf = { ...STUDY.shelf, views: V0, drawFlames: false };
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    wall: false,
    xray: false,
    shelf: false,
    extra: (c, env) => {
      textRole(c, 'texture', () => candleShelf(c, shelf, env));
      if (tq < b.handsIn - 0.05) return;
      textRole(c, 'texture', () => beliefCandle(c, { x: base.x, y: base.y, view: EXPERTS, s: STUDY.shelf.s, drawFlame: false }, env));
      textRole(c, 'subject', () => litTag(c, env, base.x + 22, base.y));
      drawHands(c, env, tq, b, base, entry, entryL, placed, fl);
    },
  });
  // REVIEW r1 (artistry): the flame halos are capped at ≈ 40 screen px (radius 22 at the macro's ≈ 1.8 scale) so
  // the wax lettering under each flame ('DESIGNED BY', 'BEATEN ANYWAY') is not washed out
  for (const sf of shelfFlames(shelf)) f.practical({ x: sf.x, y: sf.y + 6, kind: 'candle', seed: sf.seed, intensity: 0.85, radius: 22 });
  if (tq >= b.handsIn - 0.05) f.practical({ x: fl.x, y: fl.y - 4, kind: 'candle', seed: 1999, intensity: 0.92, radius: 24 });
  studyNear(f, { key: ID, cams: STUDY_CAMS, file: true });
  nearShelf(f);
  lampPool(f, cam);
}

/**
 * REVIEW r1 (artistry, study half): one gothic window in the wall behind the shelf (SH0 screen x ≈ 150–350,
 * y ≈ 40–560), so the macro has backlight structure: a pointed two-light lancet with a roundel in its head, the
 * winter night beyond (the study's own outside: winterBlue sky, far rooftops), held low in value (≈ 0.2 haze
 * toward the wall) so the candles stand against it as silhouettes and the lamp's pool stays the key. Authored in
 * SH0 screen px, mapped onto the study wall layer (it slides with the wall under the truck).
 */
const WIN = (() => {
  const o = toLayer(STUDY_WALL, SH0, 0, 0);
  const k = toScreen(STUDY_WALL, SH0, 0, 0).k;
  return { x: o.x, y: o.y, k };
})();
function studyWindow(f: Frame) {
  f.layer(STUDY_WALL, (c, env) => {
    c.save();
    c.translate(WIN.x + (150 - 30) / WIN.k, WIN.y);
    c.scale(1 / WIN.k, 1 / WIN.k);
    f.cached(`${ID}/studyWindow/${env.mood.id}`, 260, 600, (g) => {
      const P = MOODS.winterBlue;
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.25);
      const x0 = 30, x1 = 230, top = 40, bot = 560, cx = 130;
      const arch = (inset: number) => {
        const p = new Path2D();
        const a = x0 + inset, b = x1 - inset, spring = top + 120;
        p.moveTo(a, bot - inset);
        p.lineTo(a, spring);
        p.quadraticCurveTo(a, top + inset + 30, cx, top + inset);
        p.quadraticCurveTo(b, top + inset + 30, b, spring);
        p.lineTo(b, bot - inset);
        p.closePath();
        return p;
      };
      // the night beyond: sky, a few far rooftops, all pulled toward the wall's value (≈ 0.2 haze)
      const glass = arch(10);
      g.save();
      g.clip(glass);
      const sky = g.createLinearGradient(0, top, 0, bot);
      sky.addColorStop(0, mixLab(P.sky[0], wall, 0.45));
      sky.addColorStop(0.6, mixLab(P.sky[2], wall, 0.35));
      sky.addColorStop(1, mixLab(P.haze, wall, 0.3));
      g.fillStyle = sky;
      g.fillRect(0, 0, 260, 600);
      g.fillStyle = mixLab(mixLab(P.set, P.haze, 0.5), wall, 0.35);
      let x = x0;
      let i = 0;
      while (x < x1) {
        const w = 26 + 22 * hash1(i, 811);
        const h = 60 + 90 * hash1(i, 812);
        g.fillRect(x, bot - h, w, h);
        if (hash1(i, 813) > 0.5) g.fillRect(x + w * 0.6, bot - h - 18, 6, 18);
        x += w + 2;
        i++;
      }
      g.restore();
      // the stone: a deep reveal (darker inner edge), mullion, roundel in the head, transoms, sill
      const ink = mixLab(env.fill('ink'), wall, 0.25);
      g.fillStyle = ink;
      const frame = new Path2D();
      frame.addPath(arch(0));
      frame.addPath(glass);
      g.fill(frame, 'evenodd');
      g.fillRect(cx - 5, top + 150, 10, bot - top - 150);
      g.lineWidth = 7;
      g.strokeStyle = ink;
      g.beginPath();
      g.arc(cx, top + 92, 30, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 4;
      for (const lx of [x0 + 10, cx + 5]) {
        g.beginPath();
        g.moveTo(lx, top + 160);
        g.quadraticCurveTo(lx + 46, top + 116, lx + 90, top + 160);
        g.stroke();
      }
      for (const ty of [top + 300, top + 420]) g.fillRect(x0 + 10, ty - 2.5, x1 - x0 - 20, 5);
      g.fillRect(x0 - 16, bot - 6, x1 - x0 + 32, 20);
      // the lamp catches the reveal's lower edge and the sill (a faint warm rim)
      g.fillStyle = withAlpha(env.mood.rim, 0.22);
      g.fillRect(x0 - 16, bot - 6, x1 - x0 + 32, 1.4);
    })(c, 0, 0);
    c.restore();
  });
}

/** L5 world anchor (screen (0, 0) at SH0) and the L5 scale there: the near furniture is authored in SH0 screen px */
const NEAR = (() => {
  const o = toLayer(LAYERS.L5, SH0, 0, 0);
  const k = toScreen(LAYERS.L5, SH0, 0, 0).k;
  return { x: o.x, y: o.y, k };
})();
/**
 * The near plane of the macro (L5, blurred): two short leaning book spines at the lower-left corner on the shelf's
 * near lip, and an iron shelf bracket under the plank at lower right, close to the lens, so the SH0 → SH1 truck and
 * dolly parallax against the candles. Authored in SH0 screen px (scaled into L5 world).
 */
function nearShelf(f: Frame) {
  f.layer('L5', (c, env) => {
    const ink = env.fill('fg');
    c.save();
    c.translate(NEAR.x, NEAR.y);
    c.scale(1 / NEAR.k, 1 / NEAR.k);
    c.fillStyle = ink;
    // the near lip of a lower shelf, across the very bottom; at right the end of a near plank the bracket carries
    c.fillRect(-300, 704, 1900, 120);
    c.fillRect(1120, 556, 400, 14);
    // two spines leaning right from the lower-left corner, headbands catching the lamp
    const spines = [
      { x: 14, w: 46, h: 190, r: 0.04 },
      { x: 66, w: 38, h: 150, r: 0.2 },
    ];
    for (const sp of spines) {
      c.save();
      c.translate(sp.x, 720);
      c.rotate(sp.r);
      c.fillStyle = ink;
      c.fillRect(-sp.w / 2, -sp.h, sp.w, sp.h + 40);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(-sp.w / 2, -sp.h, sp.w, 2.5);
      c.fillRect(-sp.w / 2 + 5, -sp.h + 26, sp.w - 10, 1.6);
      c.restore();
    }
    // the bracket: a scrolled iron knee under the plank at right, close to the lens (review r1: big and high
    // enough to read as the macro's second near element against the shelf)
    c.save();
    c.translate(1150, 566);
    c.scale(1.45, 1.45);
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(84, 0);
    c.lineTo(84, 8);
    c.bezierCurveTo(44, 12, 8, 36, 6, 90);
    c.lineTo(-6, 90);
    c.closePath();
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 5;
    c.beginPath();
    c.arc(30, 30, 13, Math.PI * 0.9, Math.PI * 2.3);
    c.stroke();
    c.fillStyle = withAlpha(env.mood.rim, 0.3);
    c.fillRect(-6, -1, 90, 1.6);
    c.restore();
    c.restore();
  });
}

/** a soft dark plate behind floating type: feathered edges, no hard frame */
function labelPlate(c: C, x: number, y: number, w: number, h: number, a: number, m: Frame['mood']) {
  c.save();
  c.globalAlpha = a;
  c.shadowColor = withAlpha(m.fg, 0.75);
  c.shadowBlur = 26;
  c.fillStyle = withAlpha(mixLab(m.fg, m.set, 0.3), 0.62);
  const r = 14;
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, r);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

/**
 * The lamp's pool on the 1999 slot: a warm wash (≈ 380 px wide at 1080p) where the candle is set, and the rest of the
 * shelf falling off to ≈ 60 % value, so the eye goes to the slot before the candle arrives and stays on it after.
 */
function lampPool(f: Frame, cam: Camera3) {
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, EX, SHELF_Y - 120);
  c.save();
  // fall-off: multiply toward 60 % away from the slot
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(p.x, p.y, 120, p.x, p.y, 520);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#d6d6d6');
  g.addColorStop(1, '#999999');
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // the pool itself: a warm, soft ellipse on the shelf and the wall behind the slot
  c.globalCompositeOperation = 'screen';
  c.translate(p.x, p.y + 30);
  c.scale(1, 1.35);
  const w = c.createRadialGradient(0, 0, 0, 0, 0, 128);
  w.addColorStop(0, withAlpha(f.mood.halo, 0.35));
  w.addColorStop(0.55, withAlpha(f.mood.halo, 0.18));
  w.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = w;
  c.fillRect(-140, -140, 280, 280);
  c.restore();
}

/** the candle's base tag, 'lit 1999': the shelf's paper tag, set a size up so it reads in the macro */
function litTag(c: C, env: PaintEnv, x: number, y: number) {
  c.save();
  c.translate(x, y - 30);
  c.rotate(0.1);
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-4, -8);
  c.lineTo(2, 0);
  c.stroke();
  // the narration says the year aloud: the tag is read, so it meets the 22 px floor in the macro
  // (Plex Mono, like the candle's own lettering)
  const fs = legibleSize(c, `500 11.5px ${FONT.mono}`, 11.5, TAG_TEXT);
  c.font = `500 ${fs}px ${FONT.mono}`;
  const tw = c.measureText(TAG_TEXT).width + 10;
  const th = fs * 1.48;
  const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.6);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(2, 0);
  c.lineTo(4 + tw, 0);
  c.lineTo(4 + tw, th);
  c.lineTo(2, th);
  c.lineTo(-3, th / 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.12);
  // alphabetic baseline (a 'middle' baseline halves every cap-height measurement made on this context)
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.fillText(TAG_TEXT, 7, th / 2 + fs * 0.35);
  c.restore();
}

/**
 * The two steady hands: the right hand relaxed round the stub low (thumb along the wax, fingers curled under), the
 * left laid flat against it higher up, steadying. Both carry a 1-2 px rim on the edge that faces the candle flame
 * (an offset copy in the rim colour under the ink). After 'belief' they let go and drop straight down and out of
 * frame, gone by +0.5 s, never back over the shelf lip.
 */
function drawHands(c: C, env: PaintEnv, tq: number, b: B, base: Pt, entry: { R: Pt; L: Pt }, entryL: Pt, placed: boolean, flame: Pt) {
  // the placing hand carries the candle by its middle, well above the base tag; REVIEW r1 (teaching, 'the two
  // steady hands'): the second hand comes in from the lower left at 1.8–2.3 and steadies the candle's foot on the
  // LEFT side (clear of the 'lit 1999' tag at right, so the two never read as one ink mass); both let go on 'belief'
  // and are gone by 'belief' + 0.36 s so the tag reads clean
  const hs = 0.7;
  const len = HAND_LEN * hs;
  const grip = { x: base.x + 30, y: base.y - 118 };
  const gripL = { x: base.x - 30, y: base.y - 34 };
  let R: ArmPose;
  if (!placed) {
    R = hands.reach(entry.R, grip, 'rest', len, { bend: 0.16 });
  } else {
    const u = (tq - b.release) / (b.handsOut - b.release);
    if (u >= 1) return;
    if (u < 0) R = hands.reach(entry.R, grip, 'rest', len, { bend: 0.16 });
    else {
      // let go (fingers ease off the wax), then back the way it came, down-right and out of frame
      const k = sm(clamp01((u - 0.15) / 0.85));
      const off = { x: grip.x + 10 * clamp01(u / 0.15) + 420 * k, y: grip.y + 360 * k };
      R = hands.reach(entry.R, off, 'rest', len, { bend: 0.16 - 0.08 * k });
    }
  }
  // the steadying hand: in from the lower left over 1.8 → 2.3 (on twos), following the base; it lets go with the other
  let Lh: ArmPose | undefined;
  const inL = sm(clamp01((tq - b.promise) / 0.5));
  if (inL > 0) {
    const uL = placed ? (tq - b.release) / (b.handsOut - b.release) : -1;
    if (uL < 1) {
      const off = { x: lerp(entryL.x + 120, gripL.x, inL), y: lerp(entryL.y - 140, gripL.y, inL) };
      if (uL > 0) {
        const k = sm(clamp01((uL - 0.15) / 0.85));
        off.x += -8 * clamp01(uL / 0.15) - 380 * k;
        off.y += 340 * k;
      }
      Lh = hands.reach(entryL, off, 'flat', len, { bend: -0.12 });
    }
  }
  const pose: HandsPose = { right: R, left: Lh, scale: hs };
  // the candle-side rim: the same hand, nudged 1 px toward the flame, in the rim colour, under the ink
  const mid = R.wrist;
  const d = Math.hypot(flame.x - mid.x, flame.y - mid.y) || 1;
  const off = 1.15;
  const rimEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.35), 0.75) : env.fill(r)) };
  c.save();
  c.translate(((flame.x - mid.x) / d) * off, ((flame.y - mid.y) / d) * off);
  hands.draw(c, pose, rimEnv);
  c.restore();
  hands.draw(c, pose, env);
}

// ================================================================================================= THE WORKSHOP
function wsCam(t: number, b: B): Camera3 {
  const w0 = mixCam(W0, W0P, sm((t - 8.6) / 1.2));
  const a = mixCam(w0, W1, sm((t - b.walk - 0.2) / (b.arrive - b.walk + 0.4)));
  return mixCam(a, W2, sm((t - b.arrive - 0.2) / (b.D - b.arrive)));
}

function paintWorkshop(f: Frame, t: number, b: B) {
  const cam = wsCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  f.backlight({ sunX: 560, sunY: 430, sunRadius: 620, intensity: 0.6 });
  workshopBack(f, ID, WS_CAMS);
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.2, drift: 6 });
  const st = {
    show: 1,
    // 'best': the pair lights as one beat (2010 from best − 0.15, 2011 a quarter-second behind)
    glow: [win(t, b.best - 0.15, b.best + 0.2), win(t, b.best + 0.08, b.best + 0.43)] as [number, number],
    // REVIEW r1 (sync): the seven go dark from 'four' − 0.15 and are all dark by ≈ 15.25 (the payoff lands on the
    // word, then a clean ≈ 1.5 s hold to the end)
    dark: clamp01((tq - (b.four - 0.15)) / 0.55),
  };
  f.layer('L3', (c, env) => {
    leaderboard(c, env, st);
    thumbRing(c, env, st);
  });
  f.fog('B');
  // the hanging lamp's light sits behind the figure's plane (painted before L4 so its halo never washes him)
  f.practical({ x: WS.lamp.x, y: WS.lamp.y + 4, kind: 'lamp', seed: 811, intensity: 0.85, radius: 70 });
  const walk = walkTo(CRAFT_SPEC, { x0: CX0, x1: CX1, at: b.walk, end: PRESENT, cadence: WALK_CAD })(t);
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    benchAndLamp(c, env, ink);
    benchWork(c, env, ink, clamp01((tq - b.cut0) / (b.walk - b.cut0)));
    lectern(c, env, ink);
    // the husky is pinned on 'Even', the five slips have fanned by 'five'; on 'guesses' the right one is ticked
    // and lifts for one 'two'
    const tickLift = tq >= tq12(b.guessW) && tq < tq12(b.guessW) + 1 / 12 ? 1 : 0;
    guesses(c, env, clamp01((tq - (b.five - 0.72)) / 0.62), win(t, b.guessW - 0.08, b.guessW + 0.22), tickLift);
    // the craftsman
    let p: Pose;
    let x = CX0;
    const open = snipOpen(tq, b);
    if (tq < b.walk) {
      // the plate comes up against the window, the snips bite twice (the hand squeezes on each close), then down
      const up = sm((tq - b.raise0) / (b.raise1 - b.raise0)) * (1 - sm((tq - b.lower0) / (b.walk - b.lower0)));
      p = blendPose2(open < 0.08 && up > 0.9 ? CUT_B : CUT_A, open < 0.08 ? squeeze(RAISE) : RAISE, up);
    } else if (walk.walking) {
      x = walk.x;
      p = { ...walk.pose, angles: { ...walk.pose.angles, shoulderF: 34, elbowF: 64, wristF: -20 }, handF: 'pinch' };
    } else {
      x = walk.x;
      p = tq < b.arrive + 1.4 ? walk.pose : blendPose2(PRESENT, WATCH, sm((tq - b.arrive - 1.4) / 0.5));
    }
    const drawn = withLife(p, tq, 81, tq < b.walk || !walk.walking ? 1 : 0);
    // REVIEW r1 (artistry, bible §10.13): no light outline round the whole contour. The rim is cut ONLY on the side
    // facing the nearest window's centre (x 311 / 750, y 300), the cut-lines fade fully away from it (floor 0), and
    // the set's rim pass lights tops only
    const wx = Math.abs(x - 311) < Math.abs(x - 750) ? 311 : 750;
    const wd = { x: (wx - x) / 160, y: (300 - (WS.floor - 200)) / 160 };
    const opts = { x, y: WS.floor, facing: 'right' as const, pose: drawn, ink: PUPPET_NEAR_BLACK, light: { ...wd, floor: 0 }, edgeRim: { ...wd, px: 1.6 } };
    CRAFT.draw(c, opts, env);
    const hand = CRAFT.anchor(opts, 'handF');
    const handB = CRAFT.anchor(opts, 'handB');
    if (tq < b.walk) {
      // the plate in his far hand, the snips biting its edge; the hanging lamp catches the tin (a 1 px rim on the
      // plate's lamp-side edges and a glint that flicks on each close)
      // REVIEW r1 (artistry): plate and snips 1.5 × so the cut reads at 1080p on 'by' and 'hand'
      const pw = 66;
      const px = handB.x + 22, py = handB.y - 6;
      tinPlate(c, env, px, py, pw, 'arrows', { lit: 0.55 });
      plateRim(c, env, px, py, pw, 0.85 + 0.15 * (open < 0.05 ? 1 : 0));
      snips(c, env, hand, open);
    } else if (tq < b.arrive + 1.4) {
      tinPlate(c, env, hand.x + 18, hand.y - 4, 40, 'arrows', { lit: 0.4 });
      plateRim(c, env, hand.x + 18, hand.y - 4, 40, 0.8);
    } else {
      // the stencil, set on the lectern's desk
      tinPlate(c, env, WS.lectern.x - 30, WS.lectern.top + 14, 26, 'arrows', { lit: 0.3 });
    }
    curls(c, env, tq, b);
  });
  f.rim({ x: 0, y: -1 });
  f.layer('L5', (c, env) => {
    // the near edge, blurred: the end of a second bench at lower left with an iron vise clamped to it, a stool
    // and the floor's lip, so the empty left of the room has a foreground
    c.fillStyle = env.fill('fg');
    c.fillRect(-400, 690, 2400, 200);
    c.fillRect(-400, 560, 520, 26);
    c.fillRect(70, 586, 34, 140);
    c.fillRect(-60, 586, 30, 140);
    // the vise: jaw, screw, handle bar
    c.fillRect(60, 512, 62, 48);
    c.fillRect(48, 500, 86, 16);
    c.fillRect(122, 526, 34, 10);
    c.fillRect(150, 506, 8, 52);
    c.beginPath();
    c.arc(154, 504, 6, 0, Math.PI * 2);
    c.arc(154, 560, 6, 0, Math.PI * 2);
    c.fill();
    // a three-legged shop stool at the right edge: round seat, splayed legs, a stretcher ring
    stool(c, 1236, 618);
  });
}

/** how far the snips' blades are open (radians/2): they open slowly as the plate comes up, close hard on 'by'
 *  (one 'two'), reopen, close hard on 'hand', and stay shut */
function snipOpen(tq: number, b: B): number {
  const [c1, c2] = b.snipsAt;
  const o0 = b.raise1 - 0.2;
  if (tq < o0) return 0.06;
  if (tq < c1) return 0.06 + 0.36 * sm((tq - o0) / Math.max(0.1, c1 - 1 / 12 - o0));
  if (tq < c1 + 1 / 12) return 0.02;
  if (tq < c2) return 0.02 + 0.38 * sm((tq - c1 - 1 / 12) / Math.max(0.08, c2 - c1 - 2 / 12));
  return 0.02;
}

/** the squeeze on a close: the snips' hand drops a touch and the wrist cocks (one 'two') */
function squeeze(p: Pose): Pose {
  const a = p.angles;
  return { ...p, angles: { ...a, elbowF: (a.elbowF ?? 0) + 7, wristF: (a.wristF ?? 0) + 12 }, handF: 'fist' };
}

/** where the plate's cut edge is while it is held up against the window (the curls start there) */
const CURL_FROM = (() => {
  const o = { x: CX0, y: WS.floor, facing: 'right' as const, pose: RAISE, ink: PUPPET_NEAR_BLACK };
  const h = CRAFT.anchor(o, 'handB');
  return { x: h.x + 22 + 27, y: h.y - 6 + 30 };
})();
/**
 * A curl of tin from each bite: it springs off the plate's lower edge on the close, falls turning (on twos) and
 * comes to rest on the bench top, lamp-lit: a bright spiral while it falls, a dull one at rest.
 */
function curls(c: C, env: PaintEnv, tq: number, b: B) {
  b.snipsAt.forEach((ct, k) => {
    const u = (tq - ct) / 0.5;
    if (u < 0) return;
    const uu = Math.min(1, u);
    const x0 = CURL_FROM.x + k * 4;
    const y0 = CURL_FROM.y;
    const yEnd = WS.bench.top - 4;
    const x = x0 + (10 + 8 * k) * uu;
    const y = y0 + (yEnd - y0) * uu * uu - 10 * Math.sin(Math.PI * Math.min(1, uu * 2)) * (1 - uu);
    const rot = uu >= 1 ? 0.4 + k : 0.3 + uu * 7 + k * 1.3;
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.strokeStyle = uu < 1 ? mixLab(env.mood.rim, env.mood.core, 0.45) : withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.3), 0.7);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    // a tight spiral (radius 7 → 2), a little tail where it left the plate
    for (let a = 0; a <= Math.PI * 3.2; a += 0.25) {
      const r = 7 - (a / (Math.PI * 3.2)) * 5;
      const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.8;
      if (a === 0) c.moveTo(px + 6, py - 3);
      c.lineTo(px, py);
    }
    c.stroke();
    c.restore();
  });
}

/** the near stool (L5 rest-screen px): a round seat seen edge-on, three splayed legs and a stretcher ring */
function stool(c: C, x: number, seatY: number) {
  c.beginPath();
  c.roundRect(x - 64, seatY, 128, 16, 6);
  c.fill();
  c.fillRect(x - 54, seatY + 14, 108, 8);
  for (const [top, foot, w] of [[-42, -74, 14], [42, 74, 14], [4, 10, 12]] as const) {
    c.beginPath();
    c.moveTo(x + top - w / 2, seatY + 20);
    c.lineTo(x + top + w / 2, seatY + 20);
    c.lineTo(x + foot + w / 2, 800);
    c.lineTo(x + foot - w / 2, 800);
    c.closePath();
    c.fill();
  }
  c.fillRect(x - 58, seatY + 86, 116, 7);
}

function blendPose2(a: Pose, b: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const angles: Pose['angles'] = {};
  const keys = new Set([...Object.keys(a.angles), ...Object.keys(b.angles)]) as Set<keyof Pose['angles']>;
  for (const k of keys) angles[k] = lerp(a.angles[k] ?? 0, b.angles[k] ?? 0, u);
  return { ...b, angles, handF: u < 0.5 ? a.handF : b.handF };
}

/** the lamp (upper left) catching the tin plate: a 1 px rim along its top and left edges */
function plateRim(c: C, env: PaintEnv, x: number, y: number, w: number, a: number) {
  c.save();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), a);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - w / 2, y + w / 2 - 2);
  c.lineTo(x - w / 2, y - w / 2);
  c.lineTo(x + w / 2, y - w / 2);
  c.stroke();
  c.restore();
}

/** tin snips in the near hand: two heavy blades (pivot at the hand's front) and handles back into the fist */
function snips(c: C, env: PaintEnv, h: Pt, open: number) {
  c.save();
  c.translate(h.x + 3, h.y + 3);
  c.rotate(-0.12);
  c.scale(2.1, 2.1);
  c.fillStyle = env.fill('ink');
  for (const s of [1, -1]) {
    c.save();
    c.rotate(s * open);
    c.beginPath();
    c.moveTo(-6, -2.6);
    c.lineTo(30, -1.4);
    c.lineTo(34, 0);
    c.lineTo(-6, 2.6);
    c.closePath();
    c.fill();
    c.restore();
    // handles, back through the fist
    c.save();
    c.rotate(Math.PI - s * open * 0.7);
    c.fillRect(2, -1.8, 14, 3.6);
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  // the lamp catches the upper blade's spine
  c.rotate(-open);
  c.fillStyle = withAlpha(env.mood.rim, 0.75);
  c.fillRect(4, -2.4, 24, 1);
  c.restore();
}

// ================================================================================================= THE WIPE
/**
 * An unseen hand draws a sheet of dark paper across the frame, right → left. The sheet is narrower than the frame
 * (70 % W) and leans a little, so the study is always visible ahead of it and the workshop behind it: the eye never
 * rests on a dark frame. It is cut paper: a grain, a lamp gradient, laid lines, a 1.5 px rim-lit leading edge.
 */
const SHEET_W = 0.7 * 1280;
const SLANT = 70;
function sheetAt(t: number, b: B) {
  const u = sm((t - b.wipeA) / (b.wipeB - b.wipeA));
  const x0 = lerp(1280 + SLANT + 30, -SHEET_W - SLANT - 30, u);
  // edge x at height y: the slant plus a faint hand-cut waver
  const lead = (y: number) => x0 + SLANT * (y / 720 - 0.5) + Math.sin(y * 0.031 + 0.4) * 2.4 + (hash1(Math.floor(y / 36), 11) - 0.5) * 2;
  const trail = (y: number) => x0 + SHEET_W + SLANT * (y / 720 - 0.5) + Math.sin(y * 0.027 + 1.3) * 2.4 + (hash1(Math.floor(y / 36), 12) - 0.5) * 2;
  return { u, lead, trail };
}
const EDGE_YS = Array.from({ length: 21 }, (_, i) => -12 + i * 37.2);

let GRAIN: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement {
  if (GRAIN) return GRAIN;
  const g = makeCanvas(192, 192);
  const x = g.getContext('2d')!;
  const im = x.createImageData(192, 192);
  for (let i = 0; i < 192 * 192; i++) {
    const n = hash1(i, 808);
    const fib = hash1(Math.floor(i / 7), 809) > 0.92 ? 40 : 0;
    const v = 128 + (n - 0.5) * 90 + fib;
    im.data[i * 4] = v;
    im.data[i * 4 + 1] = v * 0.92;
    im.data[i * 4 + 2] = v * 0.8;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  GRAIN = g;
  return g;
}

function wipeSheet(f: Frame, t: number, b: B) {
  if (t < b.wipeA || t > b.wipeB) return;
  const c = f.c;
  const S = sheetAt(t, b);
  const sheet = new Path2D();
  sheet.moveTo(S.lead(EDGE_YS[0]), EDGE_YS[0]);
  for (const y of EDGE_YS) sheet.lineTo(S.lead(y), y);
  for (let i = EDGE_YS.length - 1; i >= 0; i--) sheet.lineTo(S.trail(EDGE_YS[i]), EDGE_YS[i]);
  sheet.closePath();
  c.save();
  // a soft shadow cast ahead of the lifted sheet's leading edge, and a contact shadow behind its trailing edge
  for (const [edge, dir, a] of [[S.lead, -1, 0.42], [S.trail, 1, 0.3]] as const) {
    const sh = new Path2D();
    sh.moveTo(edge(EDGE_YS[0]), EDGE_YS[0]);
    for (const y of EDGE_YS) sh.lineTo(edge(y), y);
    for (let i = EDGE_YS.length - 1; i >= 0; i--) sh.lineTo(edge(EDGE_YS[i]) + dir * 64, EDGE_YS[i]);
    sh.closePath();
    const ex = edge(360);
    const g = c.createLinearGradient(ex, 0, ex + dir * 64, 0);
    g.addColorStop(0, withAlpha(f.mood.fg, a));
    g.addColorStop(1, withAlpha(f.mood.fg, 0));
    c.fillStyle = g;
    c.fill(sh);
  }
  // the paper: a dark brown stock, lit warmer toward the lamp (upper left) and falling off below
  c.save();
  c.clip(sheet);
  const mid = S.lead(360) + SHEET_W / 2;
  const body = c.createLinearGradient(mid - SHEET_W / 2, 0, mid + SHEET_W / 2, 720);
  body.addColorStop(0, mixLab(f.mood.set, f.mood.halo, 0.12));
  body.addColorStop(0.5, mixLab(f.mood.fg, f.mood.set, 0.55));
  body.addColorStop(1, mixLab(f.mood.fg, f.mood.set, 0.3));
  c.fillStyle = body;
  c.fillRect(-200, -20, 1700, 760);
  // grain (multiplied in): fibres and tooth
  const pat = c.createPattern(grain(), 'repeat');
  if (pat) {
    c.globalCompositeOperation = 'overlay';
    c.globalAlpha = 0.35;
    c.fillStyle = pat;
    c.fillRect(-200, -20, 1700, 760);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  }
  // laid lines, leaning with the sheet
  c.strokeStyle = withAlpha(f.mood.rim, 0.05);
  c.lineWidth = 0.7;
  c.beginPath();
  for (let y = 4; y < 720; y += 8) {
    c.moveTo(-200, y);
    c.lineTo(1500, y);
  }
  c.stroke();
  // a fold crease down the sheet, catching the lamp
  c.strokeStyle = withAlpha(f.mood.rim, 0.1);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(S.lead(-10) + SHEET_W * 0.38, -10);
  c.lineTo(S.lead(730) + SHEET_W * 0.41, 730);
  c.stroke();
  c.restore();
  // the lamp catches the cut edges: a 1.5 px rim on the leading edge (it faces the lamp), a dimmer one trailing
  for (const [edge, a, w] of [[S.lead, 0.85, 1.6], [S.trail, 0.3, 1]] as const) {
    c.strokeStyle = withAlpha(mixLab(f.mood.rim, f.mood.halo, 0.3), a);
    c.lineWidth = w;
    c.beginPath();
    EDGE_YS.forEach((y, i) => (i ? c.lineTo(edge(y), y) : c.moveTo(edge(y), y)));
    c.stroke();
  }
  c.restore();
}

/** the workshop, painted into its own frame, shown only behind (to the right of) the sheet's trailing edge */
let SUB: HTMLCanvasElement | null = null;
function workshopBehindSheet(f: Frame, t: number, b: B) {
  const c = f.c;
  const cv = c.canvas;
  if (!SUB || SUB.width !== cv.width || SUB.height !== cv.height) SUB = makeCanvas(cv.width, cv.height);
  const g = SUB.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, SUB.width, SUB.height);
  const sf = createFrame({ c: g, pxScale: f.pxScale, t, fps: f.fps, frame: f.frame, seed: f.seed, mood: f.mood, weave: 0 });
  paintWorkshop(sf, t, b);
  const S = sheetAt(t, b);
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.beginPath();
  c.moveTo(1400, EDGE_YS[0]);
  for (const y of EDGE_YS) c.lineTo(S.trail(y) - 1, y);
  c.lineTo(1400, EDGE_YS[EDGE_YS.length - 1]);
  c.closePath();
  c.clip();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(SUB, 0, 0);
  c.restore();
}
