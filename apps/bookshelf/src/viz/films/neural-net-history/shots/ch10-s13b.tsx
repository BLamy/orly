/**
 * ch10-s13b — the read-in-order candle goes out at twenty rings; the new way spreads; an honest card
 * (candleAmber, STUDY LOCK; dawnGold only through the study window; 11.3 s; crossfade in from the wall of light).
 *
 * CAMERA: reverse FLAME PUSH out to SHELF (low macro). The wall of light's brightest knot (ch10-s12's last frame)
 * becomes the flame of LANGUAGE MUST BE READ IN ORDER; we pull back out of that flame onto the shelf (never through
 * black) while the light crossfades serverCyan → candleAmber (1.2 s, no dip); the line starts once the amber is up.
 *   'twenty'      the flame gutters and goes out with exactly 20 rings burned: the 120 px ghost sleeve stays, dark,
 *                 with a thread of smoke; its hanging tag is re-inked 1997 → 1997–2017 (set "1997–" over "2017")
 *   'Transformer' a parchment card rises (reviser r1) low and centre-right, over the shelf front between the 1999 and
 *                 2006 candles, its right edge clear of the lit 2012 candle (the shot's other live flame), and writes: not the first attention · (line end + 0.1) not only attention · (+ 0.7) built to translate
 *                 (each "not" an oxblood correction); complete by ~7.5 s, holding ~4 s.
 *   'replaced'    (critic round 1) IN THE SMOKE COLUMN of the dead candle (over its ghost sleeve, where the thread of
 *                 smoke rises), 1.5× the old size: a small lamp lit in a translation room (tag 2018) dissolves in out
 *                 of the smoke; on 'two years' a search box lit in a window (tag 2019) dissolves in above it as the
 *                 lamp settles back a step (a cross-dissolve up the column). The new way grows out of the old belief's
 *                 smoke. Both lit by the dawn (never a re-tint). (reviser r1) the room is a TRANSLATION room: its open
 *                 book's facing pages are headed EN | DE in prop lettering, with a small arrow across the gutter and two
 *                 glyph rhythms (short English words, long German compounds). Each year tag is candle-tag size and tied
 *                 by a short string to its own lamp desk / search window; the cameos' bloom is ~30% softer. The lamp
 *                 comes on just after the card's first row is complete (its "not" lands ~4.3 s), so each reveal gets its
 *                 own moment.
 * (round-2) the pull-back takes ~3.5 s and lands before 'Transformer'; then (critic round 1) a slow ~30 px drift
 * through the hold, with a blurred near case-board end sliding in at the right edge (a third plane). The re-inked
 * base tag (1997–2017) hangs at the candle's BASE, right of its foot, in the row with the other year tags. The
 * other candles' vertical belief lettering is ~30% lower in contrast, so LANGUAGE MUST BE READ IN ORDER is the one
 * the eye reads.
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down
 * one ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve, so the sleeve's
 * length is the years. A candle put out keeps its sleeve, dark, with a thread of smoke.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { FONT, cardPaperAlpha, cardProbe, legibleSize, textRole } from '../../../film/silhouette/type';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { STUDY, STUDY_WALL, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { LIT_HEIGHT, RING_PX, shelfStateAt, wallStateAt, type CandleView } from '../sets/studyState';
import { wallOfForecasts } from '../sets/wallOfForecasts';
import { candleFlame } from '../sets/beliefCandle';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, sm, tq12, win } from '../sets/ch02-s05b-util';
import { screenPass } from '../sets/ch06-s01-kit';

const ID = 'ch10-s13b';
type C = CanvasRenderingContext2D;

const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const view = (vs: CandleView[], id: string) => vs.find((v) => v.id === id)!;
const SY = STUDY.shelf.y;
const SS = STUDY.shelf.s;
const IN_X = candleX(V0, 'inorder');
const IN0 = view(V0, 'inorder');
const IN1 = view(V1, 'inorder');
const FL = candleFlame({ x: IN_X, y: SY, view: IN0, s: SS });
const SLEEVE_TOP = SY - 270 * SS;
const DAWN = MOODS.dawnGold;
const OXBLOOD = '#7a2a26';
/** the honest card's right edge and foot (screen px): left of the lit 2012 candle (x ≈ 960-1015), above the shelf's
 *  base tags (y ≈ 600) */
const CARD_RIGHT = 946;
const CARD_FOOT = 584;

interface B {
  D: number;
  out: number;
  honest1: number;
  spread: number;
  honest2: number;
  honest3: number;
  /** 'two' (years): the second cameo (the search box, 2019) */
  two: number;
  cam: (t: number) => Camera3;
  cams: Camera3[];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    // (round-2) the reverse flame push takes ~3.5 s and settles before 'Transformer' (3.84); then a slow drift-truck
    // through the hold (~120 screen px) so the in-order candle settles on the left third and the planes keep sliding
    const settle = Math.min(3.6, T.word('L1030', 'Transformer') - 0.2);
    const cam = camKeys([
      [0, FL.x, FL.y - 2, 880],
      [0.6, FL.x - 6, FL.y + 6, 800],
      [settle, IN_X + 80, 806, 470],
      [D, IN_X + 96, 802, 484],
    ]);
    const cams: Camera3[] = [];
    for (let i = 0; i <= 40; i++) cams.push(cam((D * i) / 40));
    const b: B = {
      D,
      out: T.beat('candleOut'),
      honest1: T.beat('honest1'),
      spread: T.beat('spread'),
      // (round-2) the cameos get 'replaced' to themselves; the card's last two phrases follow the line's end
      // (line end + 0.1 s, + 0.7 s): complete by ~7.5 s, holding ~4 s
      honest2: Math.min(T.beat('honest2'), T.line('L1030').end + 0.1),
      honest3: Math.min(T.beat('honest3'), T.line('L1030').end + 0.7),
      two: T.word('L1030', 'two#2'),
      cam,
      cams: cams.filter((c) => c.z < 600),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = b.cam(t);
    f.camera(cam);
    // the wall of light's cyan gives way to the study's amber as we pull out of the flame (no dip)
    if (t < 1.1) f.setMood('candleAmber', { from: 'serverCyan', u: win(t, 0, 0.9) });
    studyRoom(f, { key: ID, cams: b.cams, outside: { mood: 'dawnGold', kind: 'dawn', city: 0.15 }, fog: 0.6 });
    // the dawn through the study window (off frame right) lands on the wall behind the shelf as a window of light
    windowLight(f, t, b);

    // ---- the candle: burning on its 20th ring, then guttering out on 'twenty'
    const k = 1 - sm((t - b.out + 0.05) / 0.42);
    const isOut = t >= b.out + 0.4;
    const views = V0.map((v) => (v.id === 'inorder' ? { ...(isOut ? IN1 : v), tag: '' } : v));
    const smokeK = isOut ? 1.7 * (1 + 0.5 * (1 - win(t, b.out + 2, b.out + 2.8))) : 0;
    // (round-2 legibility hand-off) the Wall of Forecasts lies off frame to the right of this low shelf macro: its
    // slips are never seen or read here ('ten years' on Coulom's slip only matched the narrator's 'two years'), so
    // it is drawn as texture, ahead of the case (the board and the wall do not overlap)
    f.layer('L4', (c, env) => textRole(c, 'texture', () => wallOfForecasts(c, { ...STUDY.wall, slips: wallStateAt(ID, 'start'), light: 1 }, env)));
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      wall: false,
      flames: false,
      shelf: {
        views,
        drawFlames: false,
        over: {
          // (critic round 1) the other candles' belief lettering ~30% lower in contrast; the subject candle's stays
          ...Object.fromEntries(V0.filter((v) => v.id !== 'inorder').map((v) => [v.id, { letters: 0.42 }])),
          inorder: isOut ? { smoke: smokeK, letters: 0.7 } : { flame: Math.max(0.001, k), letters: 0.7 },
        },
      },
      extra: (c, env) => {
        darkenRails(c, env, t, b);
        smokePlume(c, env, t, b);
        baseTag(c, env, t, b);
        smokeCloud(c, env, t, b);
        vignettes(f, c, env, t, b);
      },
    });
    // the macro out of the flame: everything but the flame is out of focus at first (the first readable frame is
    // the flame, never the sleeve lettering); focus racks onto the shelf as we pull back
    focusPull(f, 1 - win(t, 0.45, 1.5));
    // practicals: the guttering flame, the other live candles
    if (k > 0.02) {
      const wob = t > b.out - 0.25 ? Math.sin(tq12(t) * 40) * 2.5 * (1 - k) : 0;
      f.practical({ x: FL.x + wob, y: FL.y - 4 + 6 * (1 - k), kind: 'candle', seed: 1997, intensity: 0.95 * k, radius: 30 + 16 * k });
    }
    for (const v of V0) {
      if (v.state !== 'live' || v.id === 'inorder' || v.kind === 'match') continue;
      const p = candleFlame({ x: candleX(V0, v.id), y: SY, view: v, s: SS });
      f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.5, radius: 28 });
    }
    if (cam.z < 560) studyNear(f, { key: ID, cams: b.cams, file: true });
    if (cam.z < 560) nearBoard(f, b, cam);
    // the macro's one sharp thing: the flame itself (the wall of light's knot, now a candle flame)
    macroFlame(f, cam, t);

    // ---- the bright pass as we come out of the flame
    const open = 1 - win(t, 0, 0.75);
    if (open > 0.002) {
      screenPass(f, (c) => {
        const P = f.mood;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
        g.addColorStop(0, withAlpha(P.core, 0.75 * open));
        g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.45 * open));
        g.addColorStop(1, withAlpha(P.halo, 0.2 * open));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 720);
      });
    }
    // ---- the honest card (screen-locked, upper right, over the smoke's haze)
    screenPass(f, (c) => honestCard(c, f, t, b));
  },
});

/** the dawn through the study window (off frame right) laid on the wall behind the shelf: a tall, skewed window of
 *  light with its glazing bars, gold at the sill rising to rose at the head. Faint from the start (the new day is
 *  already coming), full on 'spread'; it motivates the cameos' warm light. Painted on the study wall (behind the case). */
function windowLight(f: Frame, t: number, b: B) {
  const a = 0.4 + 0.6 * win(t, b.spread - 0.3, b.spread + 1.4);
  const e = b.cam(b.D);
  // the patch in END-frame screen px (1280 × 720), mapped once onto the study wall
  const scr = [
    { x: 1040, y: -30 },
    { x: 1268, y: -30 },
    { x: 1160, y: 600 },
    { x: 932, y: 600 },
  ];
  const w = scr.map((p) => toLayer(STUDY_WALL, e, p.x, p.y));
  const x0 = Math.min(...w.map((p) => p.x)), x1 = Math.max(...w.map((p) => p.x));
  const y0 = Math.min(...w.map((p) => p.y)), y1 = Math.max(...w.map((p) => p.y));
  const W = Math.ceil(x1 - x0), H = Math.ceil(y1 - y0);
  f.layer(STUDY_WALL, (c) => {
    const draw = f.cached(`${ID}/windowLight/v2/${W}x${H}`, W, H, (cc) => {
      const q = w.map((p) => ({ x: p.x - x0, y: p.y - y0 }));
      const lerpP = (p: { x: number; y: number }, r: { x: number; y: number }, u: number) => ({ x: p.x + (r.x - p.x) * u, y: p.y + (r.y - p.y) * u });
      // panes: 3 columns × 5 rows, the glazing bars left in shadow
      const g = cc.createLinearGradient(0, 0, 0, H);
      // (reviser r1) ~20 % brighter: the dark stubs cut against the dawn
      g.addColorStop(0, withAlpha(mixLab(DAWN.sky[2], '#e7a184', 0.4), 0.66));
      g.addColorStop(0.55, withAlpha(mixLab(DAWN.halo, DAWN.core, 0.3), 0.72));
      g.addColorStop(1, withAlpha(DAWN.core, 0.84));
      cc.fillStyle = g;
      const NC = 3, NR = 5, bar = 0.06;
      for (let i = 0; i < NC; i++)
        for (let j = 0; j < NR; j++) {
          const u0 = i / NC + bar / 2, u1 = (i + 1) / NC - bar / 2;
          const v0 = j / NR + bar / 2, v1 = (j + 1) / NR - bar / 2;
          const top0 = lerpP(q[0], q[1], u0), top1 = lerpP(q[0], q[1], u1);
          const bot0 = lerpP(q[3], q[2], u0), bot1 = lerpP(q[3], q[2], u1);
          const p00 = lerpP(top0, bot0, v0), p10 = lerpP(top1, bot1, v0), p11 = lerpP(top1, bot1, v1), p01 = lerpP(top0, bot0, v1);
          cc.beginPath();
          cc.moveTo(p00.x, p00.y);
          cc.lineTo(p10.x, p10.y);
          cc.lineTo(p11.x, p11.y);
          cc.lineTo(p01.x, p01.y);
          cc.closePath();
          cc.fill();
        }
    }, { blur: 5 });
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a;
    draw(c, x0, y0);
    c.restore();
  });
}

/** the flame in sharp focus during the macro (screen px): a teardrop with a white core over a dark wick, sized by
 *  the camera's scale; it hands over to the shelf's own flame + practical as the focus racks out */
function macroFlame(f: Frame, cam: Camera3, t: number) {
  const a = 1 - win(t, 0.9, 1.6);
  if (a <= 0.01) return;
  const p = toScreen(LAYERS.L4, cam, FL.x, FL.y - 1);
  const h = 15 * p.k;
  const w = h * 0.42;
  const fl = 1 + 0.04 * Math.sin(tq12(t) * 23) + 0.03 * Math.sin(tq12(t) * 37);
  const m = f.mood;
  screenPass(f, (c) => {
    c.globalAlpha = a;
    // wick
    c.fillStyle = withAlpha(m.fg, 0.9);
    c.fillRect(p.x - 0.09 * w, p.y - 0.05 * h, 0.18 * w, 0.32 * h);
    const tip = p.y - h * fl;
    const body = (k: number) => {
      c.beginPath();
      c.moveTo(p.x, tip + (1 - k) * h * 0.35);
      c.bezierCurveTo(p.x + w * 0.62 * k, p.y - h * 0.55, p.x + w * 0.55 * k, p.y + h * 0.02, p.x, p.y + h * 0.04);
      c.bezierCurveTo(p.x - w * 0.55 * k, p.y + h * 0.02, p.x - w * 0.62 * k, p.y - h * 0.55, p.x, tip + (1 - k) * h * 0.35);
      c.closePath();
      c.fill();
    };
    c.globalCompositeOperation = 'lighter';
    glow(c, p.x, p.y - h * 0.45, h * 1.6, m.halo, 0.35);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.55), 0.95);
    body(1);
    c.fillStyle = withAlpha(mixLab(m.core, '#fffaf0', 0.65), 1);
    body(0.55);
  });
}

/** (critic round 1, depth) the near END of the case board at the right edge of frame: a dark plank with a moulded
 *  bracket at the shelf, out of focus on its own near plane; the hold's drift slides it in from the edge */
const NEAR_L = { id: 'near13b', z: 800, haze: 0, blur: 7 };
function nearBoard(f: Frame, b: B, cam: Camera3) {
  const e = b.cam(b.D);
  // placed from the END frame: its inner edge at screen x 1206
  const tl = toLayer(NEAR_L, e, 1206, -60);
  const br = toLayer(NEAR_L, e, 1340, 790);
  const sh = toLayer(NEAR_L, e, 1206, toScreen(LAYERS.L4, e, IN_X, SY).y + 6);
  const W = Math.ceil(br.x - tl.x + 40), H = Math.ceil(br.y - tl.y);
  const a = sm((560 - cam.z) / 60);
  f.layer(NEAR_L, (c, env) => {
    const draw = f.cached(`${ID}/nearBoard/${env.mood.id}/${W}x${H}`, W, H, (cc) => {
      const m = env.mood;
      cc.fillStyle = mixLab(m.fg, m.ink, 0.3);
      const x0 = 20;
      cc.fillRect(x0, 0, W - x0, H);
      // the moulded bracket at shelf height, stepping out toward the shelf
      const yb = sh.y - tl.y;
      cc.beginPath();
      cc.moveTo(x0, yb - 18);
      cc.quadraticCurveTo(x0 - 14, yb - 10, x0 - 18, yb + 6);
      cc.lineTo(x0 - 18, yb + 26);
      cc.lineTo(x0, yb + 30);
      cc.closePath();
      cc.fill();
      // a warm rim on its inner edge (the candles' side)
      cc.fillStyle = withAlpha(m.rim, 0.22);
      cc.fillRect(x0, 0, 1.6, H);
    });
    c.save();
    c.globalAlpha *= a;
    draw(c, tl.x - 20, tl.y);
    c.restore();
  });
}

/** the shelf's plank and scalloped trim (and the dark rail above the candles) one full value step darker: only the
 *  case's own pixels are touched (source-atop in the L4 pass), the wall behind stays as it is */
function darkenRails(c: C, env: PaintEnv, t: number, b: B) {
  c.save();
  c.globalCompositeOperation = 'source-atop';
  // (reviser r1) the candle stubs one step toward full ink (~15 % darker), so the silhouettes cut against the dawn-lit
  // wall the way the reference's figures cut against its windows (the ghost sleeves above them keep their value)
  const isOut = t >= b.out + 0.4;
  for (const v of V0) {
    if (v.ghost || v.kind === 'match') continue;
    const vv = v.id === 'inorder' && isOut ? IN1 : v;
    const w = (CANDLE_W[v.kind] ?? 30) * SS;
    const x = candleX(V0, v.id);
    const stubTop = SY - (LIT_HEIGHT - Math.min(45, vv.rings) * RING_PX) * SS;
    c.fillStyle = withAlpha(env.mood.ink, v.id === 'inorder' ? 0.26 : 0.34);
    c.fillRect(x - w / 2 - 1, stubTop, w + 2, SY - stubTop - 2);
  }
  // the shelf's plank and lip toward full ink
  c.fillStyle = withAlpha(env.mood.fg, 0.72);
  c.fillRect(IN_X - 2000, SY - 1, 4000, 400);
  c.fillStyle = withAlpha(env.mood.fg, 0.45);
  c.fillRect(IN_X - 2000, SLEEVE_TOP - 42, 4000, 34);
  c.restore();
}

/** the shelf painter's candle widths (sets/beliefCandle WIDTH), for the stub darkening */
const CANDLE_W: Record<string, number> = { candle: 30, taper: 13, blank: 30, match: 4 };

/** a depth-of-field blur over everything painted so far (k 0..1): the macro's soft background */
let focusCv: HTMLCanvasElement | null = null;
function focusPull(f: Frame, k: number) {
  if (k <= 0.01) return;
  const cv = f.c.canvas;
  if (!focusCv || focusCv.width !== cv.width || focusCv.height !== cv.height) focusCv = makeCanvas(cv.width, cv.height);
  const g = focusCv.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'copy';
  g.filter = 'none';
  g.drawImage(cv, 0, 0);
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = Math.min(1, 1.6 * k);
  c.filter = `blur(${(9 * k * (cv.width / 1920)).toFixed(2)}px)`;
  c.drawImage(focusCv, 0, 0);
  c.filter = 'none';
  c.restore();
}

/** a fuller smoke plume above the snuffed wick (the vignettes dissolve inside it) */
function smokePlume(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.out + 0.3, b.out + 1.6) * (1 - 0.35 * win(t, b.D - 3, b.D));
  if (a <= 0.01) return;
  const m = env.mood;
  const base = { x: IN_X, y: FL.y };
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let s = 0; s < 3; s++) {
    c.strokeStyle = withAlpha(mixLab(m.haze, m.rim, 0.35), (0.07 - s * 0.015) * a);
    c.lineWidth = 6 + s * 9;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(base.x, base.y);
    const rise = 120 + 230 * win(t, b.out, b.out + 2.5);
    for (let i = 1; i <= 28; i++) {
      const u = i / 28;
      const yy = base.y - u * rise;
      const xx = base.x + Math.sin(u * 5.5 - t * 1.1 + s) * (3 + 26 * u) + Math.sin(u * 2.3 - t * 0.5) * 12 * u;
      c.lineTo(xx, yy);
    }
    c.stroke();
  }
  c.restore();
  // (round-2) the thread itself: a 2 px line with a slow curl, readable at 1080p ('put out')
  c.save();
  c.strokeStyle = withAlpha(mixLab(m.haze, '#f4e6cc', 0.4), 0.42 * a);
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(base.x, base.y - 2);
  const rise = 110 + 200 * win(t, b.out, b.out + 2.5);
  for (let i = 1; i <= 40; i++) {
    const u = i / 40;
    const yy = base.y - 2 - u * rise;
    const xx = base.x + Math.sin(u * 7 - t * 0.9) * (2 + 18 * u) + Math.sin(u * 2.6 - t * 0.4) * 9 * u;
    c.lineTo(xx, yy);
  }
  c.stroke();
  c.restore();
}

/** the new way spreading: two small smoke-light cameos dissolving in on 'spread', inside the plume above the
 *  read-in-order candle (soft-edged, ~0.7 opacity: seen IN the smoke, not pasted over the shelf), lit by the dawn */
function vignettes(f: Frame, c: C, env: PaintEnv, t: number, b: B) {
  // each cameo on its own word: the lamp on 'replaced', the search box on 'two years'
  const aL = win(t, b.spread - 0.05, b.spread + 0.65);
  const aR = win(t, b.two - 0.15, b.two + 0.6);
  if (aL <= 0.01) return;
  const m = env.mood;
  // both drift up slowly with the smoke
  const rise = 10 * win(t, b.spread, b.D);
  // (critic round 1) DOWN IN THE SMOKE COLUMN of the dead candle: the lamp low in the column (just above the snuffed
  // wick, over the ghost sleeve), the search box above it; world positions fixed from the end frame
  const e = b.cam(b.D);
  const sx = toScreen(LAYERS.L4, e, IN_X, 0).x;
  const yWick = toScreen(LAYERS.L4, e, IN_X, FL.y).y;
  const yTop = toScreen(LAYERS.L4, e, IN_X, SLEEVE_TOP).y;
  const pL = toLayer(LAYERS.L4, e, sx + 4, lerpN(yTop, yWick, 0.62));
  const pR = toLayer(LAYERS.L4, e, sx - 6, lerpN(yTop, yWick, 0.08));
  // the cross-dissolve up the column: as the search box forms, the lamp settles back a step into the smoke
  const lampK = aL * (1 - 0.3 * aR);
  // (reviser r1) once the card's second row starts, both cameos step back to ~0.8 so the card is the subject
  const back = 1 - 0.2 * win(t, b.honest2 - 0.1, b.honest2 + 0.5);
  // lower: a translation room — a lamp lit over a pair of facing pages (tag 2018)
  cameo(f, c, 'room2', pL.x, pL.y - rise, 60, lampK, back, m, (cc, x, y) => {
    const ink = cc.fillStyle as string;
    // desk
    cc.fillRect(x - 54, y + 24, 104, 5);
    cc.fillRect(x - 50, y + 29, 4, 22);
    cc.fillRect(x + 42, y + 29, 4, 22);
    // the lamp at the desk's left end: base, arm, shade tipped down toward the book
    cc.fillRect(x - 54, y + 20, 13, 4);
    cc.save();
    cc.lineWidth = 2.6;
    cc.strokeStyle = ink;
    cc.beginPath();
    cc.moveTo(x - 48, y + 20);
    cc.lineTo(x - 52, y - 4);
    cc.lineTo(x - 38, y - 18);
    cc.stroke();
    cc.restore();
    cc.beginPath();
    cc.moveTo(x - 42, y - 25);
    cc.lineTo(x - 24, y - 13);
    cc.lineTo(x - 31, y - 6);
    cc.lineTo(x - 48, y - 17);
    cc.closePath();
    cc.fill();
    // its cone of light onto the book
    cc.save();
    cc.globalCompositeOperation = 'lighter';
    const cg = cc.createLinearGradient(0, y - 10, 0, y + 24);
    cg.addColorStop(0, withAlpha(DAWN.core, 0.4));
    cg.addColorStop(1, withAlpha(DAWN.halo, 0.08));
    cc.fillStyle = cg;
    cc.beginPath();
    cc.moveTo(x - 40, y - 10);
    cc.lineTo(x - 28, y - 8);
    cc.lineTo(x + 40, y + 23);
    cc.lineTo(x - 30, y + 23);
    cc.closePath();
    cc.fill();
    cc.restore();
    // the open book: two facing pages, EN | DE, one language rendered into the other
    const page = mixLab(DAWN.core, '#fff8ea', 0.5);
    cc.fillStyle = page;
    cc.beginPath();
    cc.moveTo(x - 28, y - 2);
    cc.lineTo(x + 2, y - 5);
    cc.lineTo(x + 2, y + 23);
    cc.lineTo(x - 29, y + 23);
    cc.closePath();
    cc.fill();
    cc.beginPath();
    cc.moveTo(x + 5, y - 5);
    cc.lineTo(x + 35, y - 2);
    cc.lineTo(x + 36, y + 23);
    cc.lineTo(x + 5, y + 23);
    cc.closePath();
    cc.fill();
    // prop lettering: the page heads
    cc.fillStyle = withAlpha(ink, 0.95);
    cc.font = `700 11px ${FONT.mono}`;
    cc.textAlign = 'center';
    cc.textBaseline = 'alphabetic';
    cc.fillText('EN', x - 13, y + 7);
    cc.fillText('DE', x + 20, y + 7);
    // two glyph rhythms: short English words (left) → long German compounds (right)
    cc.strokeStyle = withAlpha(ink, 0.75);
    cc.lineWidth = 1.2;
    for (let r = 0; r < 4; r++) {
      const yy = y + 11 + r * 3.2;
      let px = x - 25;
      for (let k = 0; px < x - 2; k++) {
        const wl = 2 + ((r * 5 + k * 3) % 4);
        cc.beginPath();
        cc.moveTo(px, yy);
        cc.lineTo(Math.min(x - 2, px + wl), yy);
        cc.stroke();
        px += wl + 2;
      }
      let qx = x + 8;
      for (let k = 0; qx < x + 33; k++) {
        const wl = 9 + ((r * 7 + k * 5) % 8);
        cc.beginPath();
        cc.moveTo(qx, yy);
        cc.lineTo(Math.min(x + 33, qx + wl), yy);
        cc.stroke();
        qx += wl + 2;
      }
    }
    // the small arrow across the gutter: EN → DE
    cc.lineWidth = 1.6;
    cc.strokeStyle = ink;
    cc.beginPath();
    cc.moveTo(x - 6, y - 11);
    cc.lineTo(x + 10, y - 11);
    cc.moveTo(x + 6, y - 14);
    cc.lineTo(x + 10, y - 11);
    cc.lineTo(x + 6, y - 8);
    cc.stroke();
    cc.fillStyle = ink;
    return { lx: x - 34, ly: y - 10 };
  }, '2018', { x: 48, y: 27 });
  // higher: a window with a search box lit in it (tag 2019)
  cameo(f, c, 'search', pR.x, pR.y - rise, 54, aR, back, m, (cc, x, y) => {
    cc.save();
    cc.lineWidth = 3;
    cc.strokeStyle = cc.fillStyle as string;
    cc.strokeRect(x - 36, y - 34, 72, 66);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(x, y - 34);
    cc.lineTo(x, y - 6);
    cc.moveTo(x - 36, y - 6);
    cc.lineTo(x + 36, y - 6);
    cc.stroke();
    cc.fillRect(x - 44, y + 32, 88, 5);
    cc.restore();
    return { lx: x, ly: y + 12, box: true };
  }, '2019', { x: 37, y: -20 });
}

const lerpN = (a: number, b2: number, u: number) => a + (b2 - a) * u;

function cameo(
  f: Frame,
  c: C,
  name: string,
  x: number,
  y: number,
  r: number,
  a: number,
  /** a hold-down multiplier (the card's subject moment) */
  back: number,
  m: PaintEnv['mood'],
  draw: (c: C, x: number, y: number) => { lx: number; ly: number; box?: boolean },
  year: string,
  /** where its tag's string is tied (the lamp desk's end / the search window's frame), in r = 58 units */
  tie: { x: number; y: number },
) {
  if (a <= 0.01) return;
  const S = Math.ceil(r * 2.6);
  const cx = S / 2, cy = S / 2;
  const sc = r / 58; // the little scenes are drawn for r = 58
  const bmp = f.cached(`${ID}/cameo/v2/${name}/${m.id}/${S}`, S, S, (cc) => {
    // a soft oval of dawn light in the smoke: the backlight the little scene is cut against
    const g = cc.createRadialGradient(cx, cy, 0, cx, cy, r * 1.15);
    // (reviser r1) ~30% less bloom than before: the card, not the cameos, is the hottest read in the hold
    // (reviser r1, round 2) another 20 % off the bloom
    g.addColorStop(0, withAlpha(mixLab(DAWN.sky[3], DAWN.core, 0.35), 0.48));
    g.addColorStop(0.6, withAlpha(DAWN.sky[3], 0.28));
    g.addColorStop(1, withAlpha(DAWN.sky[2], 0));
    cc.fillStyle = g;
    cc.fillRect(0, 0, S, S);
    cc.save();
    cc.translate(cx, cy);
    cc.scale(sc, sc);
    cc.fillStyle = withAlpha(mixLab(m.ink, '#3a2414', 0.3), 0.9);
    const p = draw(cc, 0, 0);
    cc.restore();
    const lx = cx + p.lx * sc, ly = cy + p.ly * sc;
    if (p.box) {
      cc.fillStyle = withAlpha(mixLab(DAWN.core, '#ffffff', 0.25), 0.9);
      cc.beginPath();
      cc.roundRect(cx - 28 * sc, ly - 6 * sc, 56 * sc, 13 * sc, 6.5 * sc);
      cc.fill();
      cc.strokeStyle = withAlpha(m.ink, 0.7);
      cc.lineWidth = 1.3;
      cc.beginPath();
      cc.arc(cx + 18 * sc, ly, 3.4 * sc, 0, Math.PI * 2);
      cc.moveTo(cx + 20.5 * sc, ly + 2.5 * sc);
      cc.lineTo(cx + 23.5 * sc, ly + 5.5 * sc);
      cc.stroke();
      glow(cc, cx, ly, 46 * sc, DAWN.core, 0.19);
    } else {
      glow(cc, lx, ly, 34 * sc, DAWN.core, 0.3);
      glow(cc, lx + 10 * sc, ly + 26 * sc, 26 * sc, DAWN.halo, 0.16);
    }
    // feather the whole cameo into the smoke (about 25 px at 1080p)
    cc.globalCompositeOperation = 'destination-in';
    const fe = cc.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.1);
    fe.addColorStop(0, 'rgba(0,0,0,1)');
    fe.addColorStop(1, 'rgba(0,0,0,0)');
    cc.fillStyle = fe;
    cc.fillRect(0, 0, S, S);
  });
  // it forms out of the smoke: a soft swell of dawn-lit haze leads it in
  c.save();
  c.globalCompositeOperation = 'lighter';
  glow(c, x, y, r * 1.5, mixLab(m.haze, DAWN.halo, 0.5), (0.15 * Math.sin(Math.PI * Math.min(1, a)) + 0.04 * a) * back);
  c.restore();
  c.save();
  c.globalAlpha *= 0.78 * a * back;
  bmp(c, x - cx, y - cy);
  c.restore();
  // its small paper tag with the year (prop lettering): (reviser r1) candle-tag size (the legibility floor, no
  // larger) and tied by a short string to its own object, so it belongs to the vision, not to the shelf
  c.save();
  c.globalAlpha *= a * back;
  const ax = x + tie.x * sc, ay = y + tie.y * sc;
  const tx = ax + 7, ty = ay + 9;
  c.strokeStyle = withAlpha(mixLab(m.haze, DAWN.halo, 0.3), 0.85);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(ax, ay);
  c.quadraticCurveTo(ax + 1, ay + 6, tx, ty);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(m.haze, DAWN.halo, 0.3), 0.9);
  c.beginPath();
  c.arc(ax, ay, 1.6, 0, Math.PI * 2);
  c.fill();
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.25), m.rim, 0.5);
  const fs = legibleSize(c, `500 11px ${FONT.mono}`, 11, year);
  c.font = `500 ${fs}px ${FONT.mono}`;
  const tw = c.measureText(year).width + 8, th = fs + 5;
  c.translate(tx, ty);
  c.rotate(0.08);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(tw, 0);
  c.lineTo(tw, th);
  c.lineTo(0, th);
  c.lineTo(-3, th / 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(m.ink, paper, 0.1);
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(year, 3, th / 2 + 0.5);
  c.restore();
}

/** the candle's base tag, larger than the shelf's own: 1997 → re-inked 1997–2017. (round-2) 1.5× and sized to the
 *  legibility floor; set in two lines so it fits the gap between candles and never covers another candle's lettering.
 *  (reviser r1, round 2) the break comes AFTER the en dash ("1997–" over "2017"), so no line starts with a dash that
 *  reads as a minus; and the tag hangs ~12 stage px further left, clear of the next candle's foot. */
function baseTag(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const u = win(t, b.out + 0.55, b.out + 1.35);
  const size = legibleSize(c, `500 18px ${FONT.mono}`, 18, '2017');
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  const w = Math.max(c.measureText('1997–').width, c.measureText('2017').width) + 7;
  const lh = size * 1.08;
  const h = u <= 0.02 ? size + 8 : lh * 2 + 7;
  // (critic round 1) at the candle's BASE, in the row with the other year tags: the knot on the candle's right foot
  // (where the shelf hangs every candle's tag), the tag hanging right of it with its foot just above the plank
  const kEnd = toScreen(LAYERS.L4, b.cam(b.D), IN_X, SY).k;
  const kx = IN_X + 17 - 12 / Math.max(0.5, kEnd), ky = SY - 4 - h;
  c.translate(kx, ky);
  c.rotate(0.04);
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-3, -6);
  c.lineTo(1, 0);
  c.stroke();
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.3), m.rim, 0.42);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(1, 0);
  c.lineTo(1 + w, 0);
  c.lineTo(1 + w, h);
  c.lineTo(1, h);
  c.lineTo(-2, Math.min(h / 2, 10));
  c.closePath();
  c.fill();
  const inkC = mixLab(m.ink, paper, 0.1);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const tx = 1 + 4;
  if (u <= 0.02) c.fillText('1997', tx, (size + 8) / 2 + 0.5);
  else {
    // "1997–" over "2017": the dash inks on the first line, then the new end date writes on below it
    const y1 = 3.5 + lh / 2;
    c.fillText('1997', tx, y1);
    const w97 = c.measureText('1997').width;
    const wDash = c.measureText('–').width;
    const kd = clamp01(u * 3);
    c.save();
    c.beginPath();
    c.rect(tx + w97 - 1, y1 - lh / 2, (wDash + 2) * kd, lh);
    c.clip();
    c.fillText('–', tx + w97, y1);
    c.restore();
    const full = c.measureText('2017').width;
    c.save();
    c.beginPath();
    c.rect(tx - 1, 3.5 + lh, (full + 2) * clamp01((u - 0.25) * 1.5), lh);
    c.clip();
    c.fillText('2017', tx, 3.5 + lh * 1.5);
    c.restore();
  }
  c.restore();
}

/** the smoke spreads into a soft haze around the snuffed candle's top: the cameos form inside it */
function smokeCloud(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.out + 0.8, b.spread + 0.6);
  if (a <= 0.01) return;
  const m = env.mood;
  const col = mixLab(mixLab(m.haze, m.setHaze, 0.4), DAWN.halo, 0.12);
  const blobs: [number, number, number][] = [[-120, 40, 110], [0, -10, 120], [122, 10, 110], [-60, 90, 90], [70, 80, 90]];
  c.save();
  blobs.forEach(([dx, dy, r], i) => {
    const x = IN_X + dx + Math.sin(t * 0.3 + i) * 6;
    const y = SLEEVE_TOP + dy - 6 * win(t, b.out, b.D);
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(col, 0.42 * a));
    g.addColorStop(0.6, withAlpha(col, 0.2 * a));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  c.restore();
}

/** the honest card: rises on 'Transformer', writes three phrases on their beats, holds through the hold */
function honestCard(c: C, f: Frame, t: number, b: B) {
  // (review r3, kit card-entry rule) the paper rises WITH its first phrase: it passes 30 % two frames before 'the
  // first attention' starts inking (it showed blank at 3.83 s)
  const ink0 = b.honest1 + 0.05;
  // review round 5 (transition ghosts): the card fades out over 0.35 s and is gone 0.05 s before the 1 s crossfade
  // into ch10-s14 begins (cut - 0.5), so its rows never dissolve over ch10-s14's word slips ('not' x 'der')
  const rise = cardPaperAlpha(t, ink0 + 0.1, 0.35) * (1 - win(t, b.D - 0.9, b.D - 0.55));
  if (rise <= 0.005) return;
  const m = f.mood;
  // (reviser r1) parked low and centre-right, over the shelf front between the 1999 and 2006 candles: its right edge
  // stops short of the lit 2012 candle (screen x ≈ 1000 through the hold), its foot above the bottom 12 % of frame
  // (reviser r1) 30 px stage: the payload of the wordless hold; it grows left and up from CARD_RIGHT / CARD_FOOT
  const size = legibleSize(c, `italic 500 30px ${FONT.text}`, 30, 'the first attention');
  c.font = `italic 500 ${size}px ${FONT.text}`;
  const W = Math.ceil(c.measureText('not the first attention').width + 64), H = Math.round(size * 2 * 1.75 + 76);
  const X = CARD_RIGHT - W, Y = CARD_FOOT - H;
  const dy = (1 - rise) * 18;
  c.save();
  c.globalAlpha = rise;
  c.translate(0, dy);
  // the card: lamp-lit paper with a lift shadow
  const paper = mixLab(mixLab(m.halo, '#e8d6b0', 0.55), '#fff6e4', 0.2);
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(X + 4, Y + 6, W, H);
  c.fillStyle = paper;
  c.fillRect(X, Y, W, H);
  // the probe reports how much of the first phrase is written (its ink is the reveal of a clipped write-on)
  cardProbe(c, 'honestCard', X, Y, W, H, 1, clamp01((t - ink0) / 0.18));
  c.strokeStyle = withAlpha(m.ink, 0.35);
  c.lineWidth = 1;
  c.strokeRect(X + 8, Y + 8, W - 16, H - 16);
  // a pin
  c.fillStyle = OXBLOOD;
  c.beginPath();
  c.arc(X + W / 2, Y + 12, 3.2, 0, Math.PI * 2);
  c.fill();
  const ink = mixLab(m.ink, '#2a1c12', 0.4);
  const rows: { pre: string; rest: string; at: number }[] = [
    { pre: 'not ', rest: 'the first attention', at: ink0 },
    { pre: 'not ', rest: 'only attention', at: b.honest2 },
    { pre: '', rest: 'built to translate', at: b.honest3 },
  ];
  rows.forEach((r, i) => {
    const y = Y + 30 + size + i * size * 1.75;
    const x = X + 30;
    // the phrase is written first, then corrected with an oxblood "not"
    // the first phrase writes on quickly (0.18 s, while the paper is still rising) so the card is never read as blank
    const d = clamp01((t - r.at) / (i === 0 ? 0.18 : 0.45));
    if (d <= 0) return;
    c.font = `italic 500 ${size}px ${FONT.text}`;
    const wPre = r.pre ? c.measureText(r.pre).width : 0;
    const wRest = c.measureText(r.rest).width;
    c.save();
    c.beginPath();
    c.rect(x + wPre - 2, y - size, (wRest + 6) * d, size * 1.5);
    c.clip();
    c.fillStyle = ink;
    c.fillText(r.rest, x + wPre, y);
    c.restore();
    if (r.pre) {
      // (reviser r1) the first row's "not" lands quickly (complete ~0.45 s after the phrase starts), so the card's entry
      // is finished before the lamp comes on at 'replaced'; the later rows keep their slower correction
      const k = i === 0 ? clamp01((t - r.at - 0.24) / 0.2) : clamp01((t - r.at - 0.42) / 0.28);
      if (k > 0) {
        c.save();
        c.beginPath();
        c.rect(x - 2, y - size, (wPre + 2) * k, size * 1.5);
        c.clip();
        c.fillStyle = OXBLOOD;
        c.fillText(r.pre.trim(), x, y);
        c.restore();
        // a small caret under the inserted word
        c.strokeStyle = withAlpha(OXBLOOD, 0.8 * k);
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(x + wPre - 12, y + 11);
        c.lineTo(x + wPre - 6, y + 4);
        c.lineTo(x + wPre, y + 11);
        c.stroke();
      }
    }
  });
  c.restore();
}
