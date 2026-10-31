/**
 * ch04-s02 — PERCEPTRONS: the giant book on the paper stage, its "sterile" quote card, and the third belief
 * candle lit in front of it (labGreen → duskRose tint crossfade in; stage only, no study visit; 20.96 s).
 *
 *   open                 the paper stage in duskRose, in front of a back wall of tall pointed windows (holes: the low
 *                        sun behind them sits on Minsky's side). A huge book stands upright like a monolith, its cover
 *                        blank but for one word cut through it in light: PERCEPTRONS (sets/ch04-s02-book, the one
 *                        design s03 and s05 share). Papert (left, facing the book) and Minsky (right, facing it) stand
 *                        in the same warm light, each against a window: neither is a villain. A new, unlit candle
 *                        stands on the floor in front of the book, the dark board behind it.
 *   'book' (3.34)        name cards from book − 0.3: Seymour Papert · MIT (left), Marvin Minsky · MIT (right)
 *   'proved' (3.65)      Minsky, standing level, opens a hand toward the book (present), and lowers it after 'do'
 *   'quote' (8.96)       the book's head opens a lit crack and a typed card rises out of it from quote − 0.3, legible
 *                        as 'our' is spoken: “…our intuitive judgment that the extension is sterile.” — Minsky and
 *                        Papert, 1969 (verbatim). It sinks back before the candle line.
 *   'third' (16.75)      'A third candle': the new candle catches ON 'third' (on twos), its pool spreads across the
 *                        floor, its lettering glows; its name card (lighting mode: the belief over 'lit 1969' only,
 *                        nothing about when it goes out) sets in left of the flame over the book's head, clear of both
 *                        figures. Both authors turn their heads to the flame.
 *   hold                 wordless: the camera settles on the new flame and the two authors; the candle burns steadily.
 * Round-1 revision: Papert in a skirted sports jacket with a full beard, Minsky's bald dome and narrow shoulders
 * (sets/ch04-s02-cast); both breathe and shift their weight on twos; Papert talks on L0405's stressed words; Minsky
 * turns his head slowly to the candle on 'third'; Minsky stands 80 px nearer the book (no mirror symmetry). God rays
 * from the two right-hand windows rake across the book's face through a fog sheet; the book has a bevelled spine
 * and a thicker page block (S02_BOOK_BOUND, matched by s03). On 'one layer' a single straight scissor-cut glints
 * across the cover (the s01 echo). The quote card rises only until it clears the book's head (its top never
 * above 5% of the frame) while the camera tilts up and pushes in ~4%: the card is the subject. The unlit candle
 * stays in shadow until 'third'; its halo blooms over 0.6 s from third − 0.2.
 * CANDLE-CLOCK RULE: the candle is new — 45 rings, no sleeve yet, flame on the top ring, base tag 1969 (painted
 * here as texture: the card's 'lit 1969' is what the viewer reads).
 * Camera: a slow log dolly in toward the book and candle over the lines, settling for the hold. s03 opens on this
 * shot's final framing of the book (BOOK_END_SCREEN) and pulls back from it.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, applyBeats, blendPose, defineShot, godRays, overscan, pose, talkBeats, windowBeam, withAlpha, withLife, mixLab } from '../../../film';
import type { Camera3, Frame, PaintEnv, Pose, TalkBeats } from '../../../film';
import { minskyS02, papertS02, standLife } from '../sets/ch04-s02-cast';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { floorShadow, stageGeo } from '../sets/candleStage';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { shelfStateAt } from '../sets/studyState';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { clamp01, mixCam, sm, tq12, typedCard, win } from '../sets/ch04-s01-kit';
import { S02_BOOK_BOUND, S02_END_CAM, bookBody, bookTitle } from '../sets/ch04-s02-book';
import { WIN_CENTERS, flameWash, floorPool, litCard, windowBack } from '../sets/ch04-s02-stage';

const ID = 'ch04-s02';
type C = CanvasRenderingContext2D;

const STERILE = shelfStateAt(ID, 'end').find((v) => v.id === 'sterile')!;
const FLOOR_Y = 640;
/** the monolith: 480 tall on the stage, the agreed proportions */
const BOOK = S02_BOOK_BOUND;
/** the candle drawn without the kit's tiny base tag (its '1969' is painted here as texture: tagTexture) */
const STERILE_NOTAG = { ...STERILE, tag: '' };
/** the candle stands on the floor IN FRONT of the book (base 24 px nearer than the book's), the dark board behind
 *  its flame, its flame well below the cut title */
const CX = 572;
const CY = FLOOR_Y + 24;
const CS = 1.1;
const FLAME = candleFlame({ x: CX, y: CY, view: STERILE, s: CS });
const FIG_S = 1.2;
const PAP_X = 140;
const MIN_X = 825;
/** god rays from the two windows right of the book, raking down-left across its face */
const RAYS = WIN_CENTERS.filter((x) => x > 700 && x < 1400).map((cx) => windowBeam({ x: cx - 118, y: 70, w: 236, h: 480 }, { x: -1, y: 0.42 }, cx - 120, 1.2));

const CAMS: Camera3[] = [{ x: 640, y: 360, z: 0, lens: 1 }, { x: 612, y: 350, z: 50, lens: 1 }, S02_END_CAM];

// poses: both stand level in profile; Minsky opens a hand toward the book on 'proved'; both turn to the flame
const MIN_STAND: Pose = POSES.stand;
const MIN_SHOW: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 7, head: -6, shoulderF: 40, elbowF: 46, wristF: -24, shoulderB: -9, elbowB: 12, wristB: 4 }, { handF: 'open' });
const MIN_FLAME: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 9, head: 1, shoulderF: 5, elbowF: 16, wristF: 6, shoulderB: -9, elbowB: 12, wristB: 4 });
const PAP_STAND: Pose = POSES.stand;
const PAP_FLAME: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 9, head: 2, shoulderF: 5, elbowF: 16, wristF: 6, shoulderB: -9, elbowB: 12, wristB: 4 });

interface Beats {
  D: number;
  book: number;
  proved: number;
  doEnd: number;
  quote: number;
  sterile: number;
  third: number;
  one: number;
  papTalk: TalkBeats;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      D: T.duration,
      book: T.beat('book'),
      proved: T.word('L0404', 'proved'),
      doEnd: T.wordEnd('L0404', -1),
      quote: T.beat('quote'),
      sterile: T.wordEnd('L0405', 'sterile'),
      third: T.word('L0405', 'third'),
      one: T.word('L0404', 'one'),
      papTalk: talkBeats(T, { lines: ['L0405'], to: T.word('L0405', 'third') - 0.4, head: 3, hand: 1.1, minGap: 1.1 }),
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as Beats;
    if (t < 1.1) f.setMood('duskRose', { from: 'labGreen', u: sm(Math.max(0, t) / 1.1) });

    // camera: a slow log dolly toward the book over the lines; it settles on the new flame for the hold. During the
    // quote it tilts up and pushes in ~4% (the card is the subject), then eases back before 'A third candle'.
    let cam = mixCam(CAMS[0], CAMS[1], sm(t / (b.third - 0.4)));
    cam = mixCam(cam, CAMS[2], win(t, b.third - 0.4, b.D));
    const readK = win(t, b.quote - 0.6, b.quote + 1.4) * (1 - win(t, b.sterile + 0.5, b.third - 0.5));
    if (readK > 0) {
      const k0 = 1000 / (1000 - cam.z);
      cam = { x: cam.x - 90 * readK, y: cam.y - 58 * readK, z: 1000 - 1000 / (k0 * (1 + 0.04 * readK)), lens: cam.lens };
    }
    f.camera(cam);

    // the flame catches ON 'third' (on twos): a flare, a dip, then steady
    const lt = tq - (b.third - 0.08);
    const fk = clamp01(lt < 0 ? 0 : lt < 1 / 12 ? 0.55 : lt < 2 / 12 ? 1.15 : lt < 3 / 12 ? 0.8 : Math.min(1, 0.85 + lt * 0.3));
    // the halo blooms over 0.6 s from third − 0.2 (the flame itself catches on twos)
    const bloom = win(t, b.third - 0.2, b.third + 0.4);
    const glowK = fk * (0.25 + 0.75 * bloom);
    // Minsky turns his head slowly to the new flame on 'third'; Papert follows half a second later
    const minTurn = win(tq, b.third - 0.05, b.third + 1.2);
    const papTurn = win(tq, b.third + 0.5, b.third + 1.4);
    // Minsky's open hand toward the book on 'proved', lowered after 'do'
    const show = win(tq, b.proved - 0.3, b.proved + 0.2) * (1 - win(tq, b.doEnd + 0.4, b.doEnd + 1.0));
    const minP = standLife(withLife(blendPose(blendPose(MIN_STAND, MIN_SHOW, show), MIN_FLAME, minTurn), tq, 1927, 0.8), tq, 27, 1 - 0.6 * show);
    const papP = standLife(applyBeats(withLife(blendPose(PAP_STAND, PAP_FLAME, papTurn), tq, 1928, 0.8), b.papTalk, tq), tq, 28, 1);
    const bookLight = 0.95 - 0.2 * glowK;

    // the low sun behind the windows on Minsky's side
    f.backlight({ sunX: 1000, sunY: 430, sunRadius: 640, intensity: 0.9 });
    f.layer('L2', (c, env) => {
      windowBack(f, c, env, ID, CAMS);
      flameWash(c, env, FLAME.x, FLAME.y + 40, glowK);
    });
    // a fog sheet between the window wall and the book, then the low floor haze
    f.fog('A');
    f.fog('B');

    const geo = stageGeo({ candle: STERILE, candleX: CX, s: CS, flame: glowK, pool: 1.05 });
    f.layer('L4', (c, env) => {
      floorPool(c, env, { floorY: FLOOR_Y, poolX: CX, poolY: CY + 10, rx: 470 * (0.35 + 0.65 * glowK), ry: 66, fk: glowK, cams: CAMS });
      // the quote card first: it rises from inside the book (behind the front board)
      quoteCard(c, env, t, b, cam);
      bookBody(f, c, BOOK, env, ID, { spine: 1 });
      headSlit(c, env, t, b);
      bookTitle(c, BOOK, env, bookLight);
      oneCut(c, env, t, b.one);
      // the low sun's shafts from the two right-hand windows rake across the book's face (behind the figures)
      godRays(c, { beams: RAYS, intensity: 0.14, streaks: 4, mullions: 2, softness: 22, salt: 402 }, env);
      // the authors' shadows (once the flame is lit), the authors, then the candle in front of the book
      const pap = (cc: C) => papertS02.draw(cc, { x: 0, y: 0, facing: 'right', pose: papP, scale: FIG_S }, env);
      const min = (cc: C) => minskyS02.draw(cc, { x: 0, y: 0, facing: 'left', pose: minP, scale: FIG_S }, env);
      if (glowK > 0.01) {
        floorShadow(c, geo, PAP_X, pap, env, 0.8 * glowK);
        floorShadow(c, geo, MIN_X, min, env, 0.8 * glowK);
      }
      papertS02.draw(c, { x: PAP_X, y: FLOOR_Y, facing: 'right', pose: papP, scale: FIG_S, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.4, floor: 0.15 }, edgeRim: { x: -0.6, y: -1, px: 1.5 } }, env);
      minskyS02.draw(c, { x: MIN_X, y: FLOOR_Y, facing: 'left', pose: minP, scale: FIG_S, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.5, floor: 0.15 }, edgeRim: { x: 1, y: -0.8, px: 1.5 } }, env);
      // the candle: the shared ink stub (no lettering, no naming: this shot names it in lighting mode), then wax;
      // its lettering stays a texture (≤ 0.28 alpha): the lit card is what the viewer reads
      beliefCandle(c, { x: CX, y: CY, view: STERILE_NOTAG, s: CS, flame: fk, drawFlame: false, letters: 0, named: 0, smoke: 0 }, env);
      waxCandle(c, { x: CX, y: CY, view: STERILE, s: CS, flame: glowK, letters: 0.28 + 0.16 * win(t, b.third, b.third + 0.8) }, env);
      tagTexture(c, env, CX + (30 * CS) / 2 + 3 * CS, CY, CS, glowK);
      // unlit, the new candle stands in shadow (set ink) against the dark board, so the lighting is a reveal
      const veil = 0.9 * (1 - bloom);
      if (veil > 0.01) {
        const cw = 30 * CS + 6;
        c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), veil);
        c.fillRect(CX - cw / 2, CY - 270 * CS - 16, cw, 270 * CS + 16);
      }
    });
    f.rim({ x: 0.5, y: -1 });
    if (fk > 0) f.practical({ x: FLAME.x, y: FLAME.y + 4 * CS, kind: 'candle', seed: 1969, intensity: glowK, radius: 60 + 34 * glowK });
    stageLip(f);

    // ------------------------------------------------------------------ screen-locked type
    const tenv = { t, mood: f.mood, seed: 4 };
    nameCardLg(f.c, { name: 'Seymour Papert', role: 'MIT', at: b.book - 0.3, dur: 3.9, x: 60, y: 560 }, tenv);
    nameCardLg(f.c, { name: 'Marvin Minsky', role: 'MIT', at: b.book - 0.2, dur: 3.8, align: 'right', x: 1220, y: 560 }, tenv);
    // the candle's name, lighting mode: over the book's head, left of the flame, clear of both figures' heads
    const k4 = 1000 / (1000 - cam.z);
    const toS = (x: number, y: number) => ({ x: 640 + (x - cam.x) * k4, y: 360 + (y - cam.y) * k4 });
    const fl = toS(FLAME.x, FLAME.y - 14);
    // the card's bottom edge sits 14 px above the cut title's cap line, so it never covers the word
    const head = toS(BOOK.x + BOOK.w - 8, BOOK.titleY - BOOK.titleSize * 0.45 - 14);
    const nk = win(t, b.third + 0.25, b.third + 0.75);
    litCard(f.c, { text: STERILE.text, year: STERILE.litYear, sx: fl.x, sy: fl.y, right: head.x, bottom: head.y, k: nk, scale: 1.3 }, { mood: f.mood });
  },
});

// ================================================================================================= pieces
/** the typed card rising out of the book's head from quote − 0.3 (fully clear by 'our'), sinking back before the
 *  candle line; only what has cleared the head is seen */
function quoteCard(c: C, env: PaintEnv, t: number, b: Beats, cam: Camera3) {
  const up = win(t, b.quote - 0.3, b.quote + 0.25);
  const down = win(t, b.sterile + 0.8, b.third - 0.7);
  if (up <= 0.001 || down >= 0.999) return;
  const top = BOOK.top;
  const H = 142;
  // rise until the card clears the book's head by ~20 px, but never let its top go above 5% of the frame (36 px
  // on the 720 stage, 54 at 1080p) under the current camera
  const k = 1000 / (1000 - cam.z);
  const capCy = cam.y + (38 - 360) / k + H / 2;
  const restCy = top + H / 2 + 6;
  const goalCy = Math.max(top - 20 - H / 2, capCy);
  const cy = restCy + (goalCy - restCy) * up;
  c.save();
  c.beginPath();
  c.rect(BOOK.x - 260, -400, BOOK.w + 520, top + 6 + 400);
  c.clip();
  typedCard(
    c,
    {
      x: BOOK.x + BOOK.w / 2 + 4,
      y: cy + 24 * down,
      w: 560,
      h: H,
      alpha: 1 - down,
      seed: 1969,
      lines: [
        { text: '“…our intuitive judgment', size: 27 },
        { text: 'that the extension is sterile.”', size: 27 },
        { text: '— Minsky and Papert, 1969', size: 22, font: 'serif', italic: true, alpha: 0.88 },
      ],
    },
    env.mood,
  );
  c.restore();
}

/** the book's last chapter opens a crack at the head: a lit slit between the boards, just before the card */
function headSlit(c: C, env: PaintEnv, t: number, b: Beats) {
  const slit = win(t, b.quote - 0.75, b.quote - 0.3) * (1 - win(t, b.sterile + 1.0, b.third - 0.5));
  if (slit <= 0.001) return;
  const { x, w, depth, top } = BOOK;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sg = c.createRadialGradient(x + w / 2 + 6, top, 4, x + w / 2 + 6, top, 240);
  sg.addColorStop(0, withAlpha(env.mood.core, 0.4 * slit));
  sg.addColorStop(0.4, withAlpha(env.mood.halo, 0.16 * slit));
  sg.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = sg;
  c.fillRect(x - 160, top - 240, w + 340, 300);
  c.restore();
  c.save();
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#fff3d6', 0.3), 0.95 * slit);
  c.beginPath();
  c.moveTo(x + 14, top - 1);
  c.lineTo(x + w + depth - 12, top - 7);
  c.lineTo(x + w + depth - 12, top - 3 - 3 * slit);
  c.lineTo(x + 14, top + 2 + 2 * slit);
  c.closePath();
  c.fill();
  c.restore();
}

/** the stage lip (L5, blurred): the apron edge with a row of footlight hoods, silhouetted against the lit floor */
function stageLip(f: Frame) {
  const LIP_Y = 690;
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, CAMS, 60);
    f.cached(
      `${ID}/lip3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`,
      Math.ceil(r.w),
      200,
      (cc) => {
        cc.translate(-r.x, -LIP_Y + 60);
        const fg = env.fill('fg');
        cc.fillStyle = fg;
        cc.fillRect(r.x, LIP_Y, r.w, 160);
        cc.fillStyle = withAlpha(env.mood.rim, 0.32);
        cc.fillRect(r.x, LIP_Y, r.w, 2);
        for (let x = Math.ceil(r.x / 150) * 150 + 40; x < r.x + r.w; x += 150) {
          cc.fillStyle = fg;
          cc.beginPath();
          cc.moveTo(x - 34, LIP_Y + 2);
          cc.lineTo(x - 30, LIP_Y - 22);
          cc.quadraticCurveTo(x, LIP_Y - 40, x + 30, LIP_Y - 22);
          cc.lineTo(x + 34, LIP_Y + 2);
          cc.closePath();
          cc.fill();
          cc.strokeStyle = withAlpha(env.mood.rim, 0.35);
          cc.lineWidth = 2;
          cc.beginPath();
          cc.moveTo(x - 30, LIP_Y - 22);
          cc.quadraticCurveTo(x, LIP_Y - 40, x + 30, LIP_Y - 22);
          cc.stroke();
        }
      },
      { blur: 5 },
    )(c, r.x, LIP_Y - 60);
  });
}

/** 'one layer': a single straight scissor-cut glints across the book's cover (the s01 echo), fading within 1 s */
function oneCut(c: C, env: PaintEnv, t: number, at: number) {
  const a = win(t, at - 0.1, at + 0.12) * (1 - win(t, at + 0.35, at + 1.1));
  if (a <= 0.002) return;
  const { x, w, top, h } = BOOK;
  const x0 = x + 26;
  const y0 = top + h * 0.7;
  const x1 = x + w - 26;
  const y1 = top + h * 0.42;
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.45 * a);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
  // the glint runs along the cut once
  const u = Math.max(0, Math.min(1, (t - (at - 0.1)) / 0.55));
  const gx = x0 + (x1 - x0) * u;
  const gy = y0 + (y1 - y0) * u;
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, 40);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * a * (1 - u * 0.5)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(gx - 40, gy - 40, 80, 80);
  c.restore();
}

/** the candle-clock's base tag (paper on a string) with its year as texture: the lit card's 'lit 1969' is read */
function tagTexture(c: C, env: PaintEnv, x: number, y: number, s: number, lit: number) {
  c.save();
  const tw = 26 * s;
  const th = 12 * s;
  c.translate(x, y - 22 * s);
  c.rotate(0.12);
  c.strokeStyle = withAlpha(env.mood.rim, 0.4);
  c.lineWidth = Math.max(0.6, 0.8 * s);
  c.beginPath();
  c.moveTo(-3 * s, -6 * s);
  c.lineTo(2 * s, 0);
  c.stroke();
  const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.25 + 0.3 * lit);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(2 * s, 0);
  c.lineTo(2 * s + tw, 0);
  c.lineTo(2 * s + tw, th);
  c.lineTo(2 * s, th);
  c.lineTo(-2 * s, th / 2);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(env.mood.ink, paper, 0.15), 0.26);
  c.font = `400 ${9 * s}px "Special Elite", monospace`;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText('1969', 4 * s, th / 2 + 0.5 * s);
  c.restore();
}
