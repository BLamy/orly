/**
 * ch05-s09b — the second winter: through the study window a panel warns of it; the Lisp-machine cabinet goes
 * dark, snow falls, and the knowledge candle gutters at seven rings while the thin Cyc taper keeps burning
 * (candleAmber; the era colour, winterBlue, enters only through the window; 20.96 s).
 *
 * CAMERA: SHELF (low macro along the knowledge candle, the Cyc taper and the cabinets), the study window behind
 * them carrying the panel and the snow. (This stretch of the shelf is shown with the window behind it: the shot
 * paints its own length of study wall with the window hole, in the study's own panelling and glazing.)
 *   crossfade    from the Tokyo aside onto the shelf; the lamp stays candleAmber throughout
 *   L0522a       beyond the glass, in winterBlue haze, a long panel table on a low stage resolves: five generic
 *                seated silhouettes; stamp AAAI-84 · AUSTIN · “THE DARK AGES OF AI” (PANEL)
 *   'panel'      one of them leans to a microphone; his words rise as a quote card at the window's edge:
 *                “…I don't much believe in expert systems.” — Roger Schank (read in the music-only pause)
 *   'winter'     a few paper flakes drift past the glass
 *   +3.4 s       the panel and the card fade back into the haze; only the flakes remain
 *   'machines'   on the shelf, the miniature Lisp-machine cabinet (from ch05-s08) glows
 *   'selling'    its screen goes dark; just after, paper banknotes lift off the shelf and drift into shadow
 *   'winter'     the snow thickens and falls steadily: the second winter
 *   'candle'     THE CANDLE RULE: the knowledge candle's naming card (its belief in the era face, lit c. 1980 ·
 *                guttered c. 1987 · 7 years) comes up LEFT of its flame, over the dimmed spent candles, so the
 *                gutter on 'seven' stays in view; it holds through 'years' (the kit's own card is switched off here)
 *   'about'      the candle begins to gutter; IF … THEN strips drift out of its smoke into the drawers of an
 *                ordinary office filing cabinet at the end of the shelf; its label rises
 *   'seven'      the knowledge candle GUTTERS: the flame shrinks to an ember, the seven-ring sleeve dims above the
 *                stub with a frayed rim, a thread of smoke; tag c. 1980–1987 · 7
 *   hold         the naming card leaves; the Cyc label (CYC · begun 1984 · Lenat kept at it until 2023) fades up
 *                beside the thin taper (lit 1984, three rings down, steady): the guttered stub, the lone taper and
 *                the cabinet, both labels readable (never more than two text items at once)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, MOODS, POSES, blendPose, defineShot, hash1, legibleSize, mixLab, pose, snow, softPlate, toLayer, toScreen, withAlpha, withLife } from '../../../film';
import { STUDY, STUDY_WALL } from '../sets/study';
import { NAMING, candleDates, shelfStateAt, type CandleView } from '../sets/studyState';
import { beliefCandle, candleFlame, candleShelf, shelfSlotX } from '../sets/beliefCandle';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { phosphorStamp } from '../sets/ch05-s01-kit';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import {
  GEN, banknote, clamp01, cycTaper, drawerMouth, filingCabinet, ifThenStrip, lerp, lispCabinet, lispScreen, mixCam, pulse, sm, textPlateLabel, tq12, win,
} from '../sets/ch05-s07-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch05-s09b';
const SY = STUDY.shelf.y;
const VIEWS = shelfStateAt(ID, 'start');
const SHELF = { ...STUDY.shelf, views: VIEWS };
const KX = shelfSlotX(SHELF, VIEWS.find((v) => v.id === 'knowledge')!.slot);
const CYCX = shelfSlotX(SHELF, VIEWS.find((v) => v.id === 'cyc')!.slot);
const KNOW0 = VIEWS.find((v) => v.id === 'knowledge')!; // live, 5 rings (1985)
const CYC_V: CandleView = { ...shelfStateAt(ID, 'end').find((v) => v.id === 'cyc')!, state: 'live', rings: 3, tag: '' };
const LISP = { x: 566, y: SY, s: 0.44 };
/** the miniature console's desk height (the ch05-s08 prop: tower + desk + portrait CRT + keyboard, in miniature) */
const LISP_DT = -92;
const FILE = { x: 700, y: SY, s: 0.66 };
/** the window in this stretch of study wall (wall-plane world px) */
const WIN = { x: 548, y: 372, w: 372, h: 566 };
/** the panel beyond the glass: its own deep plane */
const PANEL_L: LayerSpec = { id: 'panel', z: 2600, haze: 0.42, blur: 1.6 };
const SNOW_L: LayerSpec = { id: 'snowOut', z: 1500, haze: 0.1, blur: 0.8 };
const RING_PX = 6;

// (review r1) the low macro: one slow push (~19% on the action plane) and truck right over the whole shot, toward the
// knowledge candle, the Cyc taper and the cabinets; the shelf, the window mullions, the panel/snow beyond the glass
// and a blurred near plane (the desk's corner and the lamp's foot) slide at their own rates
const CAM0: Camera3 = { x: 470, y: 796, z: 330, lens: 1 };
const CAM_END: Camera3 = { x: 556, y: 810, z: 442, lens: 1 };
/** the move lands ~1.5 s before the end (the shot is 20.96 s on the locked clock) and holds */
const CAM_T = 19.4;
const camAt = (t: number) => mixCam(CAM0, CAM_END, sm(t / CAM_T));
const CAMS = [CAM0, camAt(CAM_T * 0.5), CAM_END];
/** the near plane between the lens and the shelf */
const NEAR_L: LayerSpec = { id: 'nearDesk', z: 820, haze: 0, blur: 0 };
/** the panel sits square in the window as seen while it is on screen (mid-way through its camera move) */
const PANEL = (() => {
  const wr = windowIn(PANEL_L, camAt(4.2));
  return { cx: wr.x + wr.w * 0.5, y: wr.y + wr.h * 0.86, w: wr.w * 0.8, k: Math.min(1, (wr.w * 0.8) / 900) };
})();

interface B {
  D: number;
  panel: number;
  schank: number;
  snow: number;
  panelFade: number;
  machines: number;
  dark: number;
  fled: number;
  returned: number;
  cyc: number;
  cabinet: number;
  gutter: number;
  burn0: number;
  /** the candle rule: the knowledge candle is named on 'candle' (this shot draws the card itself, left of the flame) */
  named0: number;
  named1: number;
  /** the Cyc label comes up on 'knowledge'; the cabinet label waits for the naming card to leave (two text items
   *  at most at once: Cyc + naming card, then Cyc + cabinet label) */
  cycAt: number;
  cabAt: number;
}

const PANELISTS = [GEN.readerC, GEN.engineerA, GEN.readerA, GEN.connectionist, GEN.readerD];
const SIT: Pose = { ...POSES.sit, angles: { ...POSES.sit.angles, shoulderF: 20, elbowF: 70, shoulderB: 14, elbowB: 72 } };
// the speaker's lean to the microphone (about twice the first cut's, so it reads at this distance)
const LEAN: Pose = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 32, neck: 22, head: 4, shoulderF: 42, elbowF: 58, wristF: 4, shoulderB: 20, elbowB: 66 });

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      panel: T.beat('panel'),
      schank: T.beat('schank'),
      snow: T.beat('snow'),
      panelFade: T.beat('panelFade'),
      machines: T.word('L0522', 'machines'),
      dark: T.beat('dark'),
      fled: T.beat('fled'),
      returned: T.beat('returned'),
      cyc: T.beat('cyc'),
      cabinet: T.beat('cabinet'),
      gutter: T.beat('gutter'),
      burn0: T.line('L0522').start,
      named0: 0,
      named1: 0,
      cycAt: 0,
      cabAt: 0,
    };
    b.named0 = T.word('L0522', 'candle') - NAMING.lead;
    // (review r1) a short naming card (~1.2 s): the viewer read this belief in ch05-s07; it is gone as the gutter lands
    b.named1 = b.named0 + NAMING.rise + 0.85;
    b.cycAt = b.cyc;
    b.cabAt = Math.max(b.cabinet, b.named1 + NAMING.fall - 0.1);
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    const cam = camAt(t);
    f.camera(cam);
    const panelA = win(t, b.panel - 0.1, b.panel + 1.5) * (1 - win(t, b.panelFade, b.panelFade + 0.9));
    const sparse = win(t, b.snow - 0.2, b.snow + 0.8);
    const thick = win(t, b.returned - 0.2, b.returned + 0.5);

    // ---- outside: the winter sky, the panel in the haze, the snow
    f.backlight({ sunX: 900, sunY: 300, sunRadius: 520, intensity: 0.5 });
    f.layer('L1', (c, env) => {
      const r = { x: -1600, y: -1200, w: 5200, h: 3600 };
      const P = MOODS.winterBlue;
      const g = c.createLinearGradient(0, -200, 0, 1100);
      g.addColorStop(0, P.sky[0]);
      g.addColorStop(0.5, P.sky[1]);
      g.addColorStop(0.8, P.sky[2]);
      g.addColorStop(1, P.sky[3]);
      c.fillStyle = g;
      c.fillRect(r.x, r.y, r.w, r.h);
      void env;
    });
    if (panelA > 0.01) {
      f.layer(PANEL_L, (c, env) => {
        c.save();
        c.globalAlpha *= panelA;
        panelTable(c, winterEnv(env, 0.42), t, tq, b);
        c.restore();
      });
    }
    f.layer(SNOW_L, (c, env) => {
      const wr = windowIn(SNOW_L, cam);
      c.save();
      c.beginPath();
      c.rect(wr.x, wr.y, wr.w, wr.h);
      c.clip();
      const we = winterEnv(env, 0.1);
      const area = { x: wr.x - 200, y: wr.y - 300, w: wr.w + 400, h: wr.h + 600 };
      if (sparse > 0.01) {
        c.globalAlpha = sparse * 0.9;
        snow(c, { area, count: 26, salt: 3, color: MOODS.winterBlue.core, size: 1.3, fall: 34, wind: 10 }, we);
      }
      // 'returned': the fall thickens ~2.5x and steadies, in two depth bands (the near band a little faster)
      if (thick > 0.01) {
        c.globalAlpha = thick;
        snow(c, { area, count: 720, salt: 9, color: MOODS.winterBlue.core, size: 1.2, fall: 52, wind: 18, depthRange: [0, 0.6] }, we);
        snow(c, { area, count: 460, salt: 13, color: MOODS.winterBlue.core, size: 1.35, fall: 70, wind: 24, depthRange: [0.6, 1] }, we);
      }
      c.restore();
    });

    // ---- the study wall with the window hole (lamp-warmed, candleAmber)
    f.layer(STUDY_WALL, (c, env) => {
      f.cached(`${ID}/wall4/${env.mood.id}`, 2600, 1700, (cc) => {
        cc.translate(600, 500);
        studyWallStretch(cc, env);
      })(c, -600, -500);
    });
    // (review r2) fog A as a band at shelf height: it sits the bookcase and the panelling back behind the candles
    const shelfSY = toScreen(LAYERS.L4, cam, 0, SY).y;
    f.fog({ yCenter: shelfSY - 70, height: 190, alpha: 0.2, drift: 6 });

    // ---- the shelf
    // (review r1) the candle clock: lit c. 1980, so 4 rings in 1984 at the shot's start, burning to 7 by 'seven'
    const rings = lerp(4, 7, clamp01(t / b.gutter));
    const gut = win(t, b.gutter - 0.05, b.gutter + 0.6);
    const flameK = 1 - gut * 0.97;
    // on 'machines' the screen ramps from ~10.3 and is full by ~10.8
    const lispOn = win(t, b.machines - 0.16, b.machines + 0.3) * (1 - win(t, b.dark - 0.05, b.dark + 0.3));
    const drawerOpen = win(t, b.cabinet - 0.3, b.cabinet + 0.2) * (1 - win(t, b.cabinet + 3.2, b.cabinet + 3.8));
    f.layer('L4', (c, env) => {
      candleShelf(c, { ...SHELF, only: ['logic', 'learns', 'sterile'], drawFlames: false, named: {} }, env);
      // the naming rule's dim on the spent neighbours while the knowledge candle is named
      const dimK = 0.5 * namedK(t, b);
      if (dimK > 0.01) {
        c.save();
        c.translate(KX - 196, SY - 150);
        const g = c.createRadialGradient(0, 0, 60, 0, 0, 250);
        g.addColorStop(0, withAlpha(env.mood.ink, dimK));
        g.addColorStop(0.7, withAlpha(env.mood.ink, 0.7 * dimK));
        g.addColorStop(1, withAlpha(env.mood.ink, 0));
        c.fillStyle = g;
        c.fillRect(-250, -250, 500, 500);
        c.restore();
      }
      // the Cyc taper (lit 1984), three rings down, steady and small; its year tag hangs a little higher, clear
      // of the knowledge candle's long guttered tag
      beliefCandle(c, { x: CYCX, y: SY, view: CYC_V, s: 1, flame: 1, drawFlame: false, letters: 0, named: 0 }, env);
      cycTaper(c, env, CYCX, SY, 1, 1, 3);
      smallTag(c, CYCX + 9, SY - 34, '1984', env);
      // the knowledge candle: wax body; guttered at 'seven' (dark frayed sleeve, ember, smoke, new tag)
      const kv: CandleView = gut > 0.5
        ? { ...KNOW0, state: 'guttered', rings: 7, tag: 'c. 1980–1987 · 7', smoke: true }
        : { ...KNOW0, rings };
      beliefCandle(c, { x: KX, y: SY, view: kv, s: 1, flame: gut > 0.5 ? 0 : flameK, drawFlame: false, letters: 0, named: 0, smoke: gut > 0.5 ? win(t, b.gutter + 0.2, b.gutter + 1.2) : 0 }, env);
      waxCandle(c, { x: KX, y: SY, view: kv, s: 1, flame: gut > 0.5 ? 0 : flameK, letters: 0.7 }, env);
      if (gut > 0.5) frayedRim(c, env, KX, SY - (270 - 7 * RING_PX), t, b);
      // (review r2) the sill props are the second half's action plane: painted at ink (about L* 15 darker than the
      // set), their cut-lines pulled down to a whisper, so they cut out hard against the lit winter glass
      const pe = sillEnv(env);
      // the miniature Lisp-machine cabinet, and the banknotes leaving
      lispCabinet(c, LISP.x, LISP.y, LISP.s, lispOn, pe, { rows: 0.8, deskTop: LISP_DT });
      // the banknotes: dark paper (their halo pulled toward ink), so they cut out against the glass as they leave
      notes(c, { ...pe, mood: { ...pe.mood, halo: mixLab(env.mood.halo, pe.fill('ink'), 0.6) } }, t, b);
      // the ordinary office filing cabinet at the end of the shelf
      filingCabinet(c, FILE.x, FILE.y, FILE.s, pe, { open: drawerOpen, drawer: 1, glow: pulse(t, b.cabinet + 0.6, 0.3, 2.4) });
      strips(c, env, t, b);
    });
    // (review r2) tops only: the sill props carry a rim on their top edges and nowhere else
    f.rim({ x: 0, y: -1 });
    const kf = candleFlame({ x: KX, y: SY, view: { ...KNOW0, rings }, s: 1 });
    if (flameK > 0.04) f.practical({ x: kf.x, y: kf.y + 2, kind: 'candle', seed: 1980, intensity: 0.92 * flameK, radius: 34 + 14 * flameK });
    const cf = candleFlame({ x: CYCX, y: SY, view: CYC_V, s: 1 });
    f.practical({ x: cf.x, y: cf.y + 2, kind: 'candle', seed: 1984, intensity: 0.62, radius: 24 });
    if (lispOn > 0.01) {
      const ls = lispScreen(LISP.x, LISP.y, LISP.s, LISP_DT);
      f.practical({ x: ls.x, y: ls.y, kind: 'screen', seed: 87, intensity: 0.55 * lispOn, radius: 40 });
    }
    // the lamp's warm spill from the lower right (the banker's lamp is off frame, lamp side)
    f.layer('L5', (c, env) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const p = toLayer(LAYERS.L5, cam, 1240, 760);
      const g = c.createRadialGradient(p.x, p.y, 20, p.x, p.y, 420);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.16));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - 420, p.y - 420, 840, 840);
      c.restore();
    });

    nearDesk(f);

    // ---- type
    // (review r1) the kit stamp lands at ~20 px cap on a 1080p crop (the audit's 10 px misreads VT323); scaled 12% about
    // its origin so it clears the 22 px floor
    f.c.save();
    f.c.translate(48, 672);
    f.c.scale(1.12, 1.12);
    f.c.translate(-48, -672);
    phosphorStamp(f.c, { place: 'AAAI-84 · AUSTIN', date: '“THE DARK AGES OF AI” (PANEL)', year: 1984, at: b.panel + 0.1, until: b.panelFade + 0.6 }, { t, mood: f.mood, seed: 84 });
    f.c.restore();
    // Schank's card: layout frozen (computed once at a fixed camera, constant width: no re-wrap), whole card in 0.4 s
    schankCard(f, t, b);
    // the Cyc label, anchored to the taper: left-aligned just right of it, below its flame, with a rim leader
    // the knowledge candle's naming card (the candle rule), left of its flame so the gutter stays in view
    namingCard(f, t, b, toScreen(LAYERS.L4, cam, kf.x, kf.y), toScreen(LAYERS.L4, cam, cf.x, cf.y));
    const cycA = win(t, b.cycAt - 0.17, b.cycAt + 0.25);
    if (cycA > 0.01) {
      const fl = toScreen(LAYERS.L4, cam, cf.x, cf.y);
      const lx = fl.x + 26, ly = fl.y + 52;
      const c = f.c;
      c.save();
      c.globalAlpha = cycA * 0.8;
      c.strokeStyle = f.mood.rim;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(fl.x + 6, fl.y + 22);
      c.lineTo(lx - 6, ly - 9);
      c.stroke();
      c.restore();
      textPlateLabel(f.c, 'CYC · begun 1984 · Lenat kept at it until 2023', lx, ly, { mood: f.mood, alpha: cycA, size: 27, align: 'left', plate: 0.66 });
    }
    // the cabinet label: on a soft plate just above the filing cabinet, clear of the glazing bars, legible by ~16.6 s
    const cabA = win(t, b.cabAt, b.cabAt + 0.4);
    if (cabA > 0.01) {
      const p = toScreen(LAYERS.L4, cam, FILE.x, FILE.y - 150 * FILE.s);
      textPlateLabel(f.c, 'rule engines lived on in business software', Math.min(930, p.x), p.y - 26, { mood: f.mood, alpha: cabA, size: 27, plate: 0.72 });
    }
  },
});

/** (review r2) the third, nearest plane: the desk's near edge along the bottom of frame, with two books lying flat at
 *  the left and a pen tray, on its own near layer. Authored in SCREEN px at the first camera (its scale here is ~2x,
 *  so layer-unit art would smear): top edge at y 642 (the bottom 11%), baked crisp with a soft 3 px blur, so the slow
 *  truck slides it ~200 px against the shelf */
const NEAR_K0 = toScreen(NEAR_L, CAM0, 0, 0).k;
const NEAR_TOP = 642;
const NEAR_AT = toLayer(NEAR_L, CAM0, -60, NEAR_TOP);
function nearDesk(f: Frame) {
  f.layer(NEAR_L, (c, env) => {
    const X0 = -20, Y0 = -60, W = 1600, H = 200;
    c.save();
    c.translate(NEAR_AT.x, NEAR_AT.y);
    c.scale(1 / NEAR_K0, 1 / NEAR_K0);
    f.cached(`${ID}/nearDesk4/${env.mood.id}`, W, H, (cc) => {
      cc.translate(-X0, -Y0);
      const ink = env.fill('fg');
      cc.fillStyle = ink;
      // the desk top (a moulded front edge), running the width of the frame
      cc.fillRect(X0, 0, W, H + Y0);
      cc.fillStyle = withAlpha(env.mood.rim, 0.55);
      cc.fillRect(X0, -0.5, W, 2);
      cc.fillStyle = withAlpha(env.mood.halo, 0.08);
      cc.fillRect(X0, 6, W, 3);
      // two books lying flat, the upper one turned a little, spines toward us
      cc.fillStyle = ink;
      cc.beginPath();
      cc.roundRect(70, -26, 210, 26, [3, 3, 0, 0]);
      cc.fill();
      cc.save();
      cc.translate(170, -26);
      cc.rotate(0.03);
      cc.beginPath();
      cc.roundRect(-74, -19, 150, 19, [2, 2, 0, 0]);
      cc.fill();
      cc.restore();
      cc.fillStyle = withAlpha(env.mood.rim, 0.26);
      cc.fillRect(72, -26, 206, 1.4);
      cc.fillRect(98, -44, 146, 1.2);
      cc.fillStyle = withAlpha(env.mood.halo, 0.1);
      for (const bx of [92, 128, 250]) cc.fillRect(bx, -22, 2, 18);
      // a pen tray with a fountain pen lying in it
      cc.fillStyle = ink;
      cc.beginPath();
      cc.roundRect(420, -9, 150, 9, [4, 4, 0, 0]);
      cc.fill();
      cc.save();
      cc.translate(495, -11);
      cc.rotate(-0.04);
      cc.beginPath();
      cc.roundRect(-58, -4, 116, 7, 3.5);
      cc.fill();
      cc.restore();
      cc.fillStyle = withAlpha(env.mood.rim, 0.28);
      cc.fillRect(422, -9, 146, 1.2);
    }, { blur: 3 })(c, X0, Y0);
    c.restore();
  });
}

const KNOW_END = shelfStateAt(ID, 'end').find((v) => v.id === 'knowledge')!;
// (review r2) set in three short lines so the card fits the left wall, LEFT of the flame, over the dimmed spent
// candles (the window, the filing cabinet and the strips going into its drawers stay clear)
const NAMED_TEXT = ['INTELLIGENCE IS', 'KNOWLEDGE,', 'TYPED IN BY HAND'];
const NAMED_DATES = (() => {
  const d = candleDates(KNOW_END);
  const i = d.lastIndexOf(' · ');
  return i > 0 ? [d.slice(0, i), d.slice(i + 3)] : [d];
})();
function namedK(t: number, b: B) {
  return win(t, b.named0, b.named0 + NAMING.rise) * (1 - win(t, b.named1, b.named1 + NAMING.fall));
}
/** the candle rule's card for the knowledge candle: horizontal, beside the flame (to its LEFT here, over the dimmed
 *  neighbours, so the gutter on 'seven' is never covered), the belief in its era's face over its date range */
function namingCard(f: Frame, t: number, b: B, fl: { x: number; y: number }, cyc: { x: number; y: number }) {
  void cyc;
  const k = namedK(t, b);
  if (k <= 0.003) return;
  const c = f.c;
  const P = f.mood;
  const tSize = Math.max(30, legibleSize(c, `400 30px ${FONT.phosphor}`, 30, 'H') * 1.15);
  const dSize = legibleSize(c, `italic 400 24px ${FONT.text}`, 24, 'H');
  c.save();
  c.font = `400 ${tSize}px ${FONT.phosphor}`;
  const tw = Math.max(...NAMED_TEXT.map((l) => c.measureText(l).width));
  c.font = `italic 400 ${dSize}px ${FONT.text}`;
  const dw = Math.max(...NAMED_DATES.map((l) => c.measureText(l).width));
  const pad = 16, lh = tSize * 1.08, dl = dSize * 1.25;
  const w = Math.max(tw, dw) + 2 * pad, h = NAMED_TEXT.length * lh + NAMED_DATES.length * dl + pad * 1.5;
  // (review r2) anchored in the LEFT wall area (screen x ~53-373 at 1280, i.e. 80-560 at 1920): its right edge
  // stops short of the knowledge flame; the top sits level with the flame
  const x0 = Math.max(40, Math.min(373 - w, fl.x - 30 - w));
  const y0 = Math.max(40, Math.min(720 * 0.86 - h, fl.y - 24));
  c.globalAlpha = Math.min(1, k * 1.15);
  // the leader to the flame
  c.strokeStyle = withAlpha(P.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 + w, y0 + 18);
  c.lineTo(fl.x - 8, fl.y + 2);
  c.stroke();
  const paper = mixLab(P.halo, '#efe4cc', 0.6);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(x0, y0, w, h);
  c.shadowColor = 'transparent';
  c.fillStyle = withAlpha(P.ink, 0.92);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `400 ${tSize}px ${FONT.phosphor}`;
  NAMED_TEXT.forEach((l, i) => c.fillText(l, x0 + pad, y0 + pad + tSize * 0.78 + i * lh));
  c.font = `italic 400 ${dSize}px ${FONT.text}`;
  c.fillStyle = withAlpha(P.ink, 0.78);
  const dy0 = y0 + pad + NAMED_TEXT.length * lh + dSize * 0.55;
  NAMED_DATES.forEach((l, i) => c.fillText(l, x0 + pad, dy0 + i * dl));
  c.restore();
}

/** (review r2) the Schank card is tied to its speaker: inside the window, ~120 px above the panel table and centred
 *  over the leaning figure (layout frozen at the 'schank' camera: no re-wrap, no drift), with a hairline leader
 *  from the card down to his microphone */
const SPEAKER_MIC = (() => {
  const k = PANEL.k;
  const top = PANEL.y - 130 * k;
  return { x: PANEL.cx + 58 * k, y: top - 44 };
})();
const SCHANK_W = 540;
function schankLayout(schankT: number) {
  const cam = camAt(schankT);
  const wl = toScreen(STUDY_WALL, cam, WIN.x, WIN.y).x;
  const wr = toScreen(STUDY_WALL, cam, WIN.x + WIN.w, WIN.y).x;
  const table = toScreen(PANEL_L, cam, PANEL.cx, PANEL.y - 130 * PANEL.k);
  const sp = toScreen(PANEL_L, cam, PANEL.cx, PANEL.y);
  const x = Math.max(wl + 28, Math.min(Math.min(wr, 1240) - SCHANK_W - 10, sp.x - SCHANK_W * 0.42));
  return { x, y: Math.round(table.y - 120 - 54), w: SCHANK_W };
}
let SCHANK: { x: number; y: number; w: number } | null = null;
function schankCard(f: Frame, t: number, b: B) {
  const at = b.schank - 0.1;
  const until = b.panelFade + 0.8;
  const A = win(t, at, at + 0.4) * (1 - win(t, until - 0.6, until));
  if (A <= 0.003) return;
  SCHANK ??= schankLayout(b.schank);
  const c = f.c;
  const P = f.mood;
  const { x, y, w } = SCHANK;
  c.save();
  c.globalAlpha = A;
  softPlate(c, x + w / 2, y + 22, w + 220, 160, P.ink, 0.55);
  // the leader: from under the attribution down to the speaker's microphone (follows the camera)
  const mic = toScreen(PANEL_L, camAt(t), SPEAKER_MIC.x, SPEAKER_MIC.y);
  c.strokeStyle = withAlpha(mixLab(P.rim, '#f3e6cc', 0.4), 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x + 30, y + 66);
  c.lineTo(mic.x, mic.y - 8);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(P.rim, '#f3e6cc', 0.4), 0.8);
  c.beginPath();
  c.arc(mic.x, mic.y - 8, 2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(P.halo, 0.45);
  c.font = `600 ${96}px ${FONT.display}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText('“', x - 22, y + 38);
  c.font = `italic 400 32px ${FONT.text}`;
  c.textAlign = 'left';
  c.fillStyle = mixLab(P.rim, '#f3e6cc', 0.5);
  c.fillText('…I don’t much believe in expert systems.”', x, y + 10);
  c.fillStyle = mixLab(P.halo, P.rim, 0.5);
  c.fillRect(x + 2, y + 47, 22, 1.2);
  c.font = `500 ${legibleSize(c, `500 20px ${FONT.sc}`, 20, 'ROGER SCHANK')}px ${FONT.sc}`;
  c.letterSpacing = '3px';
  c.fillText('ROGER SCHANK', x + 34, y + 54);
  c.restore();
}

/** a PaintEnv whose fills come from winterBlue, hazed (outside the glass) */
function winterEnv(env: PaintEnv, h: number): PaintEnv {
  const P = MOODS.winterBlue;
  return { ...env, mood: P, fill: (role) => mixLab((P as unknown as Record<string, string>)[role] ?? P.set, P.haze, h) };
}

/** the window rect expressed in another layer's world coords for this camera */
function windowIn(layer: LayerSpec, cam: Camera3) {
  const a = toScreen(STUDY_WALL, cam, WIN.x, WIN.y);
  const z = toScreen(STUDY_WALL, cam, WIN.x + WIN.w, WIN.y + WIN.h);
  const A = toLayer(layer, cam, a.x, a.y);
  const Z = toLayer(layer, cam, z.x, z.y);
  return { x: A.x, y: A.y, w: Z.x - A.x, h: Z.y - A.y };
}

/** the stretch of study wall behind this part of the shelf: panelling, the lamp's warmth, the window hole */
function studyWallStretch(c: C, env: PaintEnv) {
  const r = { x: -600, y: -500, w: 2600, h: 1700 };
  const W = WIN;
  const wall = mixLab(env.fill('set'), env.mood.fg, 0.25);
  c.fillStyle = wall;
  c.beginPath();
  c.rect(r.x, r.y, r.w, r.h);
  c.rect(W.x, W.y, W.w, W.h);
  c.fill('evenodd');
  c.save();
  c.beginPath();
  c.rect(r.x, r.y, r.w, r.h);
  c.rect(W.x, W.y, W.w, W.h);
  c.clip('evenodd');
  const pool = c.createRadialGradient(420, 760, 40, 420, 760, 900);
  pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.25), 0.8));
  pool.addColorStop(0.5, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.1), 0.4));
  pool.addColorStop(1, withAlpha(wall, 0));
  c.fillStyle = pool;
  c.fillRect(r.x, r.y, r.w, r.h);
  // (review r2) raised-and-fielded panelling under a chair rail: each panel a shadowed inset with a lit top bevel
  for (let x = -480; x < 1900; x += 240) {
    if (x + 226 > W.x - 30 && x < W.x + W.w + 30) continue;
    const px = x + 14, py = 676, pw = 212, ph = 250;
    c.fillStyle = withAlpha(env.mood.fg, 0.22);
    c.fillRect(px, py, pw, ph);
    c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.halo, 0.12), 0.5);
    c.fillRect(px + 14, py + 14, pw - 28, ph - 28);
    c.fillStyle = withAlpha(env.mood.rim, 0.22);
    c.fillRect(px, py, pw, 1.6);
    c.fillRect(px + 14, py + ph - 15, pw - 28, 1.2);
    c.fillStyle = withAlpha(env.mood.fg, 0.5);
    c.fillRect(px + 14, py + 14, pw - 28, 2);
    c.fillRect(px, py + ph - 2, pw, 2);
  }
  // the chair rail
  c.fillStyle = withAlpha(env.mood.fg, 0.7);
  c.fillRect(r.x, 650, W.x - 30 - r.x, 12);
  c.fillRect(W.x + W.w + 30, 650, r.x + r.w - (W.x + W.w + 30), 12);
  c.fillStyle = withAlpha(env.mood.rim, 0.24);
  c.fillRect(r.x, 649.5, W.x - 30 - r.x, 1.4);
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.fillRect(r.x, -18, r.w, 10);
  c.restore();
  // window frame, glazing bars, sill (ink)
  c.fillStyle = env.fill('ink');
  // a period window: heavy frame, a transom bar with two lights above, thin glazing bars below (3 × 3)
  const bar = 5;
  const tY = W.y + W.h * 0.2;
  c.fillRect(W.x - 16, W.y - 16, W.w + 32, 16);
  c.fillRect(W.x - 16, W.y, 16, W.h);
  c.fillRect(W.x + W.w, W.y, 16, W.h);
  c.fillRect(W.x - 30, W.y + W.h, W.w + 60, 14);
  c.fillRect(W.x, tY - 6, W.w, 12);
  c.fillRect(W.x + W.w / 2 - bar / 2, W.y, bar, tY - W.y);
  for (let i = 1; i < 3; i++) c.fillRect(W.x + (W.w * i) / 3 - bar / 2, tY, bar, W.y + W.h - tY);
  for (let j = 1; j < 3; j++) c.fillRect(W.x, tY + ((W.y + W.h - tY) * j) / 3 - bar / 2, W.w, bar);

  c.fillStyle = withAlpha(env.mood.rim, 0.3);
  c.fillRect(W.x - 30, W.y + W.h, W.w + 60, 1.5);
  c.fillRect(W.x - 16, W.y - 16, 1.4, W.h + 16);
  // a run of books on a high shelf to the left (the study's bookcase continuing)
  // (review r2) the study's bookcase runs along the whole wall above the chair rail, up to the window jamb
  bookshelfWall(c, { x: -560, y: 236, w: W.x - 44 + 560, h: 400, bays: 4, seed: 44, gaps: 0.22, objects: true, backTone: 0.3 }, env);
}

/** the AAAI-84 panel beyond the glass: a long draped table on a low stage, five seated figures, microphones */
function panelTable(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const P = env.mood;
  const x0 = PANEL.cx - PANEL.w / 2, x1 = PANEL.cx + PANEL.w / 2;
  const top = PANEL.y - 130 * PANEL.k;
  // the low stage
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 140, PANEL.y, PANEL.w + 280, 26);
  // figures (only their upper halves show above the drape)
  PANELISTS.forEach((p, i) => {
    const x = x0 + 90 * PANEL.k + i * ((PANEL.w - 180 * PANEL.k) / 4);
    const speaker = i === 2;
    // starts at ~2.1, peaks at ~2.4 (on 'panel'), holds while his words are read
    const lean = speaker ? win(tq, b.schank - 0.23, b.schank + 0.07) * (1 - win(tq, b.panelFade - 0.6, b.panelFade)) : 0;
    const facing = i < 2 ? 'right' : i > 2 ? 'left' : 'right';
    const ps = withLife(blendPose(SIT, LEAN, lean), tq, 300 + i, 0.6);
    p.draw(c, { x, y: PANEL.y, facing, pose: ps, scale: PANEL.k }, env);
    // a stand microphone on the table before each
    const mx = x + (facing === 'right' ? 58 : -58) * PANEL.k;
    c.fillStyle = env.fill('ink');
    c.fillRect(mx - 1.5, top - 40, 3, 40);
    c.fillRect(mx - 9, top - 3, 18, 3);
    c.beginPath();
    c.ellipse(mx, top - 44, 5, 8, 0, 0, Math.PI * 2);
    c.fill();
  });
  // the drape: a long cloth with folds, in front of their legs
  c.fillStyle = mixLab(env.fill('ink'), P.set, 0.15);
  c.fillRect(x0, top, PANEL.w, PANEL.y - top);
  c.strokeStyle = withAlpha(P.rim, 0.18);
  c.lineWidth = 2;
  for (let x = x0 + 30; x < x1; x += 46) {
    c.beginPath();
    c.moveTo(x, top + 8);
    c.lineTo(x + 3 * Math.sin(x), PANEL.y);
    c.stroke();
  }
  c.fillStyle = withAlpha(P.rim, 0.35);
  c.fillRect(x0, top - 1, PANEL.w, 2);
  void t;
}

/** the frayed rim of the guttered stub (a ragged melted top over the wax, one drip) and its ember */
function frayedRim(c: C, env: PaintEnv, x: number, yTop: number, t: number, b: B) {
  const w = 31;
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
  c.beginPath();
  c.moveTo(x - w / 2, yTop + 8);
  for (let i = 0; i <= 8; i++) {
    const xx = x - w / 2 + (w * i) / 8;
    const yy = yTop + (i % 2 ? 2 + 4 * (0.5 + 0.5 * hash1(i, 7)) : 7);
    c.lineTo(xx, yy);
  }
  c.lineTo(x + w / 2, yTop + 10);
  c.lineTo(x - w / 2, yTop + 10);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(x + w / 2 - 3, yTop + 6);
  c.quadraticCurveTo(x + w / 2 + 3, yTop + 16, x + w / 2 + 1, yTop + 26);
  c.lineTo(x + w / 2 - 2, yTop + 26);
  c.closePath();
  c.fill();
  // the ember on the dead wick
  const ek = 0.55 + 0.25 * Math.sin(t * 5.3) * (1 - win(t, b.gutter + 2, b.gutter + 4)) - 0.25 * win(t, b.gutter + 1, b.gutter + 4);
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 0.8, yTop - 5, 1.6, 7);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, yTop - 5, 0, x, yTop - 5, 7);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, MOODS.emberRed.rim, 0.4), 0.8 * ek));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 7, yTop - 12, 14, 14);
  c.restore();
}

/** the sill props' env: fills at near-black ink, the rim (their drawer lines, vents, handles) pulled most of the way
 *  to ink so only a faint cut-line survives; the paper/halo roles are left alone (cards in the drawer, the screen) */
const SILL_INK = '#0e0c0a';
function sillEnv(env: PaintEnv): PaintEnv {
  const ink = mixLab(env.fill('ink'), SILL_INK, 0.7);
  const rim = mixLab(env.mood.rim, ink, 0.62);
  return { ...env, mood: { ...env.mood, rim, setHaze: mixLab(env.mood.setHaze, ink, 0.72) }, fill: (role) => (role === 'ink' || role === 'fg' ? ink : env.fill(role)) };
}

/** paper banknotes lifting off the shelf just after the cabinet goes dark (review r1): they leave the lamp's pool for
 *  the shadow — a small lift, then right and down past the window jamb into the dark corner, fading as they go */
function notes(c: C, env: PaintEnv, t: number, b: B) {
  for (let i = 0; i < 6; i++) {
    const born = b.fled + i * 0.22;
    const age = t - born;
    const x0 = LISP.x + 44 + i * 9, y0 = SY - 2 - (i % 3) * 2.5;
    if (age < 0) {
      // lying in a small stack beside the cabinet
      banknote(c, x0 - i * 6, y0 - 1, 0.7, 0, 1, env);
      continue;
    }
    if (age > 3.2) continue;
    const u = age / 3.2;
    const x = x0 + 430 * sm(u) + 24 * Math.sin(age * 2.1 + i);
    const y = y0 - 46 * Math.sin(Math.PI * Math.min(1, u * 1.6)) + 190 * u * u + 10 * Math.sin(age * 1.4 + i * 2);
    // darker as it leaves the pool, gone by the corner
    const a = 1 - win(u, 0.35, 0.95);
    banknote(c, x, y, 0.7, 0.6 * Math.sin(age * 2.6 + i), a, env);
    if (u > 0.2) {
      c.save();
      c.globalAlpha *= 0.55 * win(u, 0.2, 0.7) * a;
      c.fillStyle = env.mood.ink;
      c.fillRect(x - 12, y - 7, 24, 14);
      c.restore();
    }
  }
}

/** IF … THEN strips (review r1): released from the smoke ~0.4 s after the gutter, high above the dead flame, they
 *  arc right OVER the Cyc taper and fall into the open drawer — the flame stays clear */
function strips(c: C, env: PaintEnv, t: number, b: B) {
  const mouth = drawerMouth(FILE.x, FILE.y, FILE.s, 1, 1);
  const src = { x: KX + 6, y: SY - (270 - 7 * RING_PX) - 78 };
  const over = { x: CYCX + 60, y: Math.min(src.y, SY - 270) - 40 };
  for (let i = 0; i < 6; i++) {
    const born = b.gutter + 0.42 + i * 0.4;
    const age = t - born;
    if (age < 0 || age > 1.7) continue;
    const u = sm(age / 1.7);
    // a quadratic path: smoke → over the taper → drawer
    const x = (1 - u) * (1 - u) * src.x + 2 * u * (1 - u) * over.x + u * u * (mouth.x + 10);
    const y = (1 - u) * (1 - u) * src.y + 2 * u * (1 - u) * over.y + u * u * (mouth.y + 6);
    const a = win(age, 0, 0.3) * (1 - win(u, 0.9, 1));
    ifThenStrip(c, x, y, lerp(1.2, 0.55, u), 0.4 * Math.sin(age * 3 + i) * (1 - u), a, env);
  }
}

/** a small paper year tag on a string (the shelf's tag, drawn where the shelf's own would collide) */
function smallTag(c: C, x: number, y: number, text: string, env: PaintEnv) {
  c.save();
  c.font = `400 9px ${FONT.typewriter}`;
  const tw = Math.max(26, c.measureText(text).width + 8);
  c.translate(x, y);
  c.rotate(0.1);
  c.strokeStyle = withAlpha(env.mood.rim, 0.4);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-6, -8);
  c.lineTo(2, 0);
  c.stroke();
  const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.55);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(2, 0);
  c.lineTo(2 + tw, 0);
  c.lineTo(2 + tw, 12);
  c.lineTo(2, 12);
  c.lineTo(-2, 6);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.15);
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(text, 5, 6.5);
  c.restore();
}
