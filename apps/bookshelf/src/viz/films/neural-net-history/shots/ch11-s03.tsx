/**
 * ch11-s03 — the typesetter's case of next words (serverCyan plate; 13.1 s; crossfade in from the study shelf).
 *
 * CAMERA: PLATE (the case, square-on, a gentle settle) → a slow pull back to the X-RAY: the chat box from chapter 1
 * standing behind the case, band 6 lighting.
 *   'context'     the context slugs drop into the composing stick ('The animal didn't cross the street because it was
 *                 too'); the ghost slot glows. Caption (top right, on a soft plate): for example: illustrative scores,
 *                 not from a real model
 *   1.2 / 'pour'  chapter 10's jug tips at 1.2 s; a glowing ribbon fans over the case top and spills down the drawer
 *                 fronts; each of the six carded drawers slides out by its REAL softmax share (T = 1):
 *                 tired 0.56 · wide 0.17 · busy 0.12 · scared 0.08 · slow 0.04 · dark 0.03 (whole-percent labels)
 *   'allWords'    the light reaches the far case (the vocabulary: two long banks of drawer fronts with cornices and a
 *                 mid ledge, receding to the window's vanishing point BEHIND the case): a ripple of lit lips runs out from
 *                 the case to the nearest drawers over 0.8 s (the far drawers slide out a hair); on the case's base the six
 *                 lips laid end to end fill exactly one full-width rule, '= 1'
 *   'temperature' DELIBERATE OMISSION (round-1 review, confirmed by the round-1 shot critic): the script's T dial and its
 *                 onScreenText equation 'p = softmax(z / T)' are NOT drawn, because the narration never mentions
 *                 temperature and the film never explains it. The drawers hold their T = 1 shares; the '= 1' strip on
 *                 the case's base glows once, the six lips and the far drawers' tail summing to exactly one. (Recorded in
 *                 film.json stages.shots.ch11-s03.notes so final QA does not read it as a dropped equation.)
 *   'Pick'        the 'tired' sort rises at 5.25 s and arcs into the ghost slot by 5.9 s
 *   'again'       the stick advances and a new ghost slot opens at 6.7 s; the drawers shut, the case is re-carded for
 *                 the next word, and the jug pours again on 'No rulebook': new illustrative odds, so 'Only odds'
 *                 lands on lit bars
 *   'xray'        music only: the drawers slide home (done by 9.65 s), THEN the chat box is revealed behind the case
 *                 (never superimposed on the bars) as the camera pulls back; X-ray band 6 (cast type sorts and a lit
 *                 ghost slot) lights with one pulse beside the five bands already lit; held to the end
 * STAGE: a tall lit window stands behind the case (it backlights the pediment and candle) at the vanishing point of the
 * far case; fog sheets between the far drawers and the front six; in L5 a blurred bench along the bottom and the near
 * corner of a second type cabinet in the lower left (the third plane in the pull-back). The pull-back ends square on a
 * symmetric proscenium (the paper stage's edges and valance, centred). Band 6 lands with one cyan pulse, 0.6 s from
 * xray + 0.3, brighter than the five bands already lit. Round-1 revise: shares at 38 px (cap >= 22 px at 1080p); the
 * second pour is re-carded with words (after · to · and · from · today · again), not punctuation.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, NEXT_TOKEN_DEMO, defineShot, hash1, mixLab, nextToken, overscan, softmax, withAlpha } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { screenPass } from '../sets/ch06-s01-kit';
import { jug, lightStream, arcPts } from '../sets/ch10-s06-kit';
import { bandRect, vellumBox, vellumHalo, type BandRect } from '../sets/ch11-s01-vellum';
import { slugWidth } from '../../../film/silhouette/metaphors/typeSlugs';
import { xrayBandsAt } from '../sets/studyState';
import { camPath, capLine, clamp01, sm, softPlate, tq12, win } from '../sets/ch11-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s03';
const NT = { x: 0, y: 26 };
/** the case geometry, mirrored from the kit's nextToken layout (cx = x + 150, cy = y + 262, drawers 56 tall, 200 wide) */
const CASE = { x0: NT.x + 150, y0: NT.y + 262, dw: 200, dh: 56, n: 6 };
const FACE = CASE.x0 + CASE.dw;
/** the chat box stands BEHIND the case (L3), revealed once the drawers are home */
const BOX = { x: 742, y: NT.y + 612, s: 0.92 };
const JUG = { x: 470, y: 238, s: 0.95 };
/** the case's drawer geometry (as in the kit's nextToken): maximum slide = the full-width rule */
const MAX_SLIDE = 1280 - (FACE - NT.x) - 170;
/** after 'again': the next word's (illustrative) odds — the case is re-carded and poured again */
const NEXT2 = [
  { tok: ' after', logit: 4.0 },
  { tok: ' to', logit: 2.6 },
  { tok: ' and', logit: 2.2 },
  { tok: ' from', logit: 1.9 },
  { tok: ' today', logit: 1.2 },
  { tok: ' again', logit: 0.8 },
];

const C0: Camera3 = { x: 650, y: 376, z: 90, lens: 1 };
const C1: Camera3 = { x: 632, y: 372, z: 40, lens: 1 };
const C2: Camera3 = { x: 636, y: 370, z: 62, lens: 1 };
const C3: Camera3 = { x: 640, y: 362, z: -250, lens: 1 };
const CAMS = [C0, C1, C2, C3];

interface B {
  D: number;
  context: number;
  pour: number;
  all: number;
  temp0: number;
  temp1: number;
  pick: number;
  again: number;
  close: number;
  pour2: number;
  odds: number;
  xray: number;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const again = T.beat('again');
    const b: B = {
      D,
      context: T.beat('context'),
      pour: T.beat('pour'),
      all: T.beat('allWords'),
      temp0: T.beat('temperature'),
      temp1: Math.min(T.beat('set') - 0.2, T.beat('temperature') + 1.7),
      pick: T.beat('set') - 0.08,
      again,
      close: again - 0.05,
      pour2: Math.max(again + 0.55, T.word('L1107', 'No') - 0.1),
      odds: T.word('L1107', 'Only'),
      xray: T.beat('xray'),
    };
    tl.hold(0, D);
    const cam = camPath([
      [0, C0],
      [b.all + 0.4, C1],
      [b.again + 0.6, C2],
      [b.xray - 0.3, C2],
      [Math.min(D - 0.3, b.xray + 2.6), C3, (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)],
    ]);
    return { tl, b, cam };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = (scene.cam as (t: number) => Camera3)(t);
    f.camera(cam);
    const tq = tq12(t);
    const T = 1;
    // the case: open on the pour, shut after 'again', re-carded, poured again for the next word ('Only odds' on lit bars)
    const second = tq >= b.close + 0.5;
    // after 'Only odds' the drawers slide home, done by 9.65 s, BEFORE the box is revealed (never a double exposure)
    const home = 1 - sm((t - b.xray + 0.62) / 0.45);
    const slide = (second ? sm((t - b.pour2 - 0.12) / 0.9) : sm((t - b.pour - 0.05) / 1.15) * (1 - sm((t - b.close) / 0.45))) * home;
    const cands = second ? NEXT2 : NEXT_TOKEN_DEMO.candidates;
    const P = softmax(cands.map((k) => k.logit), second ? 1 : T);
    const tail = win(t, b.all - 0.1, b.all + 0.5) * (1 - win(t, b.close, b.close + 0.4)) + win(t, b.pour2 + 0.6, b.pour2 + 1.1) * home;
    // the ripple of lit lips travelling into the far case's depth (0..1 over 0.8 s from 'allWords', again on the
    // second pour)
    const ripple = t < b.close ? clamp01((t - b.all) / 0.8) : clamp01((t - b.pour2 - 0.6) / 0.8);
    // band 6 (next-word type sorts): its lamp warms with a single pulse on 'xray', then holds
    const band6 = sm((t - b.xray + 0.1) / 0.5);
    // one cyan pulse, brighter than every other band, for 0.6 s from xray + 0.3 (the others hold their level)
    const pulse6 = sm((t - b.xray - 0.3) / 0.15) * (1 - sm((t - b.xray - 0.75) / 0.15));
    const sortsU = clamp01((t - b.xray) / 0.9);
    const boxLight = 0.25 + 0.75 * win(t, b.xray - 0.4, b.xray + 0.6);
    // the jug: tips at 1.2 s; tips again for the next word
    const tilt = 1.05 * (win(t, 1.2, 1.5) * (1 - win(t, b.all + 0.6, b.all + 1.3)) + win(t, b.pour2 - 0.15, b.pour2 + 0.15) * (1 - win(t, b.pour2 + 1.0, b.pour2 + 1.6)));
    const flow = win(t, 1.4, 1.55) * (1 - win(t, b.all + 0.5, b.all + 1.0)) + win(t, b.pour2 + 0.05, b.pour2 + 0.2) * (1 - win(t, b.pour2 + 0.9, b.pour2 + 1.4));

    f.backlight({ sunX: WIN.x + WIN.w / 2, sunY: 300, sunRadius: 520, intensity: 0.95 });
    // L2: the paper stage's back wall, a tall lit window standing BEHIND the case (it backlights the case's pediment and
    // candle) and the far case: the vocabulary, two long banks of drawer fronts receding to the window's vanishing point
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 60);
      f.cached(`${ID}/L2d/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.3);
        cc.fillRect(r.x, r.y, r.w, r.h);
        // the window's light, flooding down the hall of drawers
        const halo = cc.createRadialGradient(WIN.x + WIN.w / 2, 300, 20, WIN.x + WIN.w / 2, 300, 900);
        halo.addColorStop(0, withAlpha(env.mood.sky[3], 0.8));
        halo.addColorStop(0.35, withAlpha(env.mood.sky[2], 0.35));
        halo.addColorStop(1, withAlpha(env.mood.sky[1], 0));
        cc.fillStyle = halo;
        cc.fillRect(r.x, r.y, r.w, r.h);
        const W = WIN;
        const win_ = new Path2D();
        win_.moveTo(W.x, W.y + W.h);
        win_.lineTo(W.x, W.y + W.w / 2);
        win_.arc(W.x + W.w / 2, W.y + W.w / 2, W.w / 2, Math.PI, 0);
        win_.lineTo(W.x + W.w, W.y + W.h);
        win_.closePath();
        const gl = cc.createLinearGradient(0, W.y, 0, W.y + W.h);
        gl.addColorStop(0, mixLab(env.mood.sky[3], env.mood.core, 0.45));
        gl.addColorStop(1, mixLab(env.mood.sky[3], env.mood.halo, 0.3));
        cc.fillStyle = gl;
        cc.fill(win_);
        cc.save();
        cc.clip(win_);
        cc.fillStyle = withAlpha(env.mood.fg, 0.75);
        for (const x of [W.x + W.w / 3, W.x + (2 * W.w) / 3]) cc.fillRect(x - 3, W.y, 6, W.h);
        for (let y = W.y + 100; y < W.y + W.h; y += 80) cc.fillRect(W.x, y - 3, W.w, 6);
        cc.restore();
        // the far case: the vocabulary (tens of thousands of words), row behind row of uncarded drawers
        farCase(cc, env);
      })(c, r.x, r.y);
      farLips(c, env, Math.min(1, tail), ripple);
    });
    f.fog({ yCenter: 0.56 * 720, height: 0.5 * 720, alpha: 0.16, drift: 6 });
    // L3: the chat box behind the case (X-ray), revealed once the drawers are home: it rises out of the dark as its
    // lamp warms (vellum, the round-1 restyle)
    f.layer('L3', (c, env) => {
      const boxA = win(t, b.xray - 0.2, b.xray + 0.35);
      if (boxA > 0.003) {
        c.save();
        c.globalAlpha *= boxA;
        vellumBox(c, env, { ...BOX, state: xrayBandsAt(ID, 'start'), light: boxLight, own: { band: 6, u: sortsU, glow: band6, glyph: typeSorts } });
        if (pulse6 > 0.01) {
          // band 6's cyan pulse, over its strip only
          const br = bandRect(6);
          c.save();
          c.translate(BOX.x, BOX.y);
          c.scale(BOX.s, BOX.s);
          c.globalCompositeOperation = 'lighter';
          const cx = br.x + br.w / 2, cy = br.y + br.h / 2;
          const g = c.createRadialGradient(cx, cy, 6, cx, cy, br.w * 0.62);
          g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#9ff6ff', 0.5), 0.7 * pulse6));
          g.addColorStop(0.55, withAlpha(env.mood.halo, 0.35 * pulse6));
          g.addColorStop(1, withAlpha(env.mood.halo, 0));
          c.fillStyle = g;
          c.fillRect(br.x - 30, br.y - 30, br.w + 60, br.h + 60);
          c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.85 * pulse6);
          c.lineWidth = 2.5;
          c.strokeRect(br.x - 3, br.y - 2, br.w + 6, br.h + 4);
          c.restore();
        }
        c.restore();
        vellumHalo(c, BOX, boxLight * boxA, 280);
      }
    });
    // a fog sheet between the far drawers and the front six
    f.fog({ yCenter: 0.52 * 720, height: 0.5 * 720, alpha: 0.3, drift: 9 });
    f.layer('L4', (c, env) => {
      // the stage floor the case stands on
      const r = overscan(LAYERS.L4, CAMS, 40);
      c.fillStyle = env.fill('ink');
      c.fillRect(r.x, NT.y + 640, r.w, r.y + r.h - NT.y - 640);
      c.fillStyle = withAlpha(env.mood.rim, 0.25);
      c.fillRect(r.x, NT.y + 640, r.w, 1.2);
      // the line so far: just before 'again' the set sort joins it and a new ghost slot opens
      const advanced = tq >= b.again - 0.1;
      const ctx = advanced ? [...NEXT_TOKEN_DEMO.context, NEXT_TOKEN_DEMO.candidates[0].tok] : NEXT_TOKEN_DEMO.context;
      const choose = advanced ? 0 : clamp01((tq - b.pick) / 0.65);
      const reveal = clamp01((t - 0.1) / 1.1);
      nextToken(c, { ...NT, context: ctx, candidates: cands, temperature: second ? 1 : T, reveal, slide, choose, chosen: 0, numbers: false, caption: false }, env);
      castMetal(c, env, ctx, cands, reveal);
      // the lit-lip shares, large, each on a soft plate beside its drawer
      if (slide > 0.05) {
        c.save();
        // 500: a preloaded face; sized to the legibility floor under this camera (with a margin)
        // (round-1 critic: 28 px measured 17.1 px cap on the 1080p frame; 38 px clears the 22 px floor with margin)
        const pSize = Math.max(38, legibleSize(c, `500 36px ${FONT.text}`, 36) + 1);
        c.font = `500 ${pSize}px ${FONT.text}`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        const pMax = Math.max(...P);
        P.forEach((p, i) => {
          const y = CASE.y0 + i * CASE.dh + CASE.dh / 2 + 2;
          const x = FACE + p * MAX_SLIDE * slide + 34;
          // whole percents, as the script gives them (56 · 17 · 12 · 8 · 4 · 3)
          const txt = `${Math.round(p * 100)}%`;
          const a = sm((slide - 0.3) / 0.7);
          softPlate(c, x + c.measureText(txt).width / 2, y, c.measureText(txt).width + 40, 50, env.mood.ink, 0.62 * a);
          c.globalAlpha = a;
          c.fillStyle = p / pMax > 0.6 ? mixLab(env.mood.core, '#ffffff', 0.2) : mixLab(env.mood.rim, '#ffffff', 0.15);
          c.fillText(txt, x, y);
          c.globalAlpha = 1;
        });
        c.restore();
        // the six lips laid end to end on the case's base: they fill exactly one full-width rule (= 1)
        sumStrip(c, env, P, slide, win(t, b.temp0, b.temp0 + 0.5) * (1 - win(t, b.temp1 - 0.2, b.temp1 + 0.4)));
      }
      // the jug of light: tips, a glowing ribbon fans over the case top, light spills down the drawer fronts
      const jk = 0.6 + 0.4 * win(t, 1.0, 1.4) - 0.5 * win(t, b.all + 0.8, b.all + 1.6) + 0.5 * win(t, b.pour2 - 0.3, b.pour2) * (1 - win(t, b.pour2 + 1.2, b.pour2 + 1.8));
      const lip = jug(c, JUG.x, JUG.y, tilt, JUG.s, env.mood.halo, env.mood.core, jk, win(t, 0.1, 0.7), env.fill('ink'));
      if (flow > 0.01) {
        const land = { x: CASE.x0 + CASE.dw * 0.55, y: CASE.y0 - 26 };
        lightStream(c, arcPts(lip.lipX, lip.lipY, land.x, land.y, -18, 1, 20), 8.5 * flow, env.mood.halo, env.mood.core, flow);
        c.save();
        c.globalCompositeOperation = 'lighter';
        // the fan over the case top
        const fan = c.createRadialGradient(land.x, land.y + 6, 4, land.x, land.y + 6, 150);
        fan.addColorStop(0, withAlpha(env.mood.core, 0.55 * flow));
        fan.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = fan;
        c.fillRect(land.x - 150, land.y - 60, 300, 140);
        // the spill down the drawer fronts
        const sp = c.createLinearGradient(0, CASE.y0, 0, CASE.y0 + CASE.n * CASE.dh);
        sp.addColorStop(0, withAlpha(env.mood.halo, 0.32 * flow));
        sp.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = sp;
        c.fillRect(FACE - 6, CASE.y0, 26, CASE.n * CASE.dh);
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });
    // L5: the near bench and a type-case lip along the bottom (blurred), and the proscenium's paper edges, seen as the
    // camera pulls back: the third plane sliding against the case and the far wall
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 40);
      f.cached(`${ID}/L5d/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(r.x, r.y, -40 - r.x, r.h);
        cc.fillRect(1320, r.y, r.x + r.w - 1320, r.h);
        cc.fillRect(r.x, r.y, r.w, -20 - r.y);
        cc.beginPath();
        for (let x = r.x; x < r.x + r.w; x += 60) {
          cc.moveTo(x, -22);
          cc.quadraticCurveTo(x + 30, 14, x + 60, -22);
        }
        cc.fill();
        // the bench: a dark slab across the bottom, lit along its top, an open type-case lying on it (its compartment
        // walls and a few loose sorts against the light)
        const top = 676;
        cc.fillRect(r.x, top, r.w, r.y + r.h - top);
        cc.fillStyle = withAlpha(env.mood.rim, 0.35);
        cc.fillRect(r.x, top - 1, r.w, 2.5);
        cc.fillStyle = env.fill('fg');
        const tc = { x0: 170, x1: 1060, y: top - 26 };
        cc.fillRect(tc.x0, tc.y, tc.x1 - tc.x0, 26);
        for (let x = tc.x0; x <= tc.x1; x += 34) cc.fillRect(x, tc.y - 10, 4, 12);
        for (let i = 0; i < 18; i++) {
          const x = tc.x0 + 10 + (0.5 + 0.5 * hash1(i, 61)) * (tc.x1 - tc.x0 - 20);
          cc.fillRect(x, tc.y - 8 - 6 * (0.5 + 0.5 * hash1(i, 62)), 6, 10);
        }
        cc.fillStyle = withAlpha(env.mood.rim, 0.3);
        cc.fillRect(tc.x0, tc.y - 1, tc.x1 - tc.x0, 1.5);
        // the lower-left occluder: the near corner of a second type cabinet, its top an open tray tilted toward us
        // (compartment walls and loose sorts against the window's light), soft in the foreground
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        const TL = { x0: -10, y0: 552, x1: 112, y1: 572 };
        const ty = (x: number) => TL.y0 + ((x - TL.x0) / (TL.x1 - TL.x0)) * (TL.y1 - TL.y0);
        cc.moveTo(r.x, TL.y0);
        cc.lineTo(TL.x0, TL.y0);
        cc.lineTo(TL.x1, TL.y1);
        cc.lineTo(118, 584);
        cc.lineTo(100, 588);
        cc.lineTo(100, 760);
        cc.lineTo(r.x, 760);
        cc.closePath();
        cc.fill();
        for (let x = r.x + 8; x < TL.x1; x += 24) cc.fillRect(x, Math.max(TL.y0, ty(x)) - 12, 4, 14);
        for (let i = 0; i < 7; i++) {
          const x = r.x + 10 + (0.5 + 0.5 * hash1(i, 71)) * (TL.x1 - r.x - 20);
          cc.fillRect(x, Math.max(TL.y0, ty(x)) - 9 - 5 * (0.5 + 0.5 * hash1(i, 72)), 7, 11);
        }
        cc.fillStyle = withAlpha(env.mood.rim, 0.4);
        cc.beginPath();
        cc.moveTo(TL.x0, TL.y0);
        cc.lineTo(TL.x1, TL.y1);
        cc.lineTo(TL.x1, TL.y1 + 2.5);
        cc.lineTo(TL.x0, TL.y0 + 2.5);
        cc.closePath();
        cc.fill();
        // a moulded stile down the cabinet's front edge
        cc.fillStyle = withAlpha(env.mood.rim, 0.18);
        cc.fillRect(92, 590, 3, 150);
      }, { blur: 6 })(c, r.x, r.y);
    });
    // ---- screen-locked type: the one caption (throughout), top right on a soft plate
    screenPass(f, (c) => {
      const m = f.mood;
      const out = 1 - win(t, b.xray - 0.75, b.xray - 0.2);
      const ca = win(t, b.context, b.context + 0.5) * out;
      const size = legibleSize(c, `italic 400 24px ${FONT.text}`, 24) + 1;
      if (ca > 0.003) softPlate(c, 930, 222, 780, 120, m.ink, 0.6 * ca);
      capLine(c, m, 'for example: illustrative scores, not from a real model', 1238, 232, ca, { size, align: 'right', font: `italic 400 ${size}px ${FONT.text}`, color: mixLab(m.core, '#ffffff', 0.45) });
    });
  },
});

/** the six shares as one strip on the case's base: laid end to end they fill the full-width rule exactly (= 1) */
function sumStrip(c: C, env: PaintEnv, P: number[], slide: number, glow = 0) {
  const a = sm((slide - 0.5) / 0.5);
  if (a <= 0.01) return;
  const m = env.mood;
  const y = CASE.y0 + CASE.n * CASE.dh + 10;
  const x0 = FACE + 20;
  c.save();
  c.globalAlpha *= a;
  // the rule: the full width (1.0), with end ticks
  c.fillStyle = withAlpha(m.rim, 0.55);
  c.fillRect(x0, y + 12, MAX_SLIDE, 1.2);
  c.fillRect(x0, y - 2, 1.2, 16);
  c.fillRect(x0 + MAX_SLIDE, y - 2, 1.2, 16);
  // the six lips, end to end, alternating tones
  let x = x0;
  P.forEach((p, i) => {
    const w = p * MAX_SLIDE * slide;
    c.fillStyle = withAlpha(i % 2 ? mixLab(m.halo, m.rim, 0.5) : mixLab(m.halo, m.core, 0.4), 0.85);
    c.fillRect(x, y + 2, Math.max(0.5, w - 1.5), 8);
    x += w;
  });
  // the hairline tail (the receding drawers' share)
  c.fillStyle = withAlpha(m.core, 0.7);
  c.fillRect(x, y + 4, 2, 4);
  // the sum glows once in the held breath before the pick (the six lips and the tail make exactly one)
  if (glow > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(x0, 0, x0 + MAX_SLIDE, 0);
    g.addColorStop(0, withAlpha(m.core, 0));
    g.addColorStop(0.5, withAlpha(m.core, 0.35 * glow));
    g.addColorStop(1, withAlpha(m.core, 0.6 * glow));
    c.fillStyle = g;
    c.fillRect(x0, y - 2, MAX_SLIDE + 4, 16);
    c.restore();
  }
  const sz = legibleSize(c, `500 24px ${FONT.text}`, 24) + 1;
  c.font = `500 ${sz}px ${FONT.text}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillStyle = mixLab(m.core, '#ffffff', 0.3 + 0.4 * glow);
  c.fillText('= 1', x0 + MAX_SLIDE + 12, y + 7);
  c.restore();
}

/**
 * The far case (the vocabulary: tens of thousands of words) on its OWN plane (L2, behind the fog and the bars): two long
 * banks of uncarded drawer fronts, row behind row, receding in true perspective to the vanishing point at the window
 * BEHIND the front case (the right bank fills the frame behind the bars; the left bank shows as a sliver). Each bank
 * carries a cornice and a mid ledge, its drawers diminish with depth and haze out toward the window. On 'allWords'
 * every far drawer slides out a hair: a ripple of lit lips runs out from the case to the nearest drawers over 0.8 s,
 * then they stay out a hair (the long tail).
 */
const WIN = { x: 132, y: 150, w: 236, h: 500 };
const FVP = { x: 250, y: 352 };
/** the banks in world units at depth 1: the right bank's face plane at x = XR, the left at XL; drawers from TOP to BOT */
const FAR = { XR: 1380, XL: -900, top: 132, bot: 664, z1: 8.6, rows: 15, cols: 44, ledge: 7 };
const fz = (i: number) => Math.pow(FAR.z1, i / FAR.cols);
const fXr = (z: number) => FVP.x + (FAR.XR - FVP.x) / z;
const fXl = (z: number) => FVP.x + (FAR.XL - FVP.x) / z;
const fY = (y: number, z: number) => FVP.y + (y - FVP.y) / z;
const rowY = (r: number) => FAR.top + ((FAR.bot - FAR.top) * r) / FAR.rows;
function quad(c: C, fx: (z: number) => number, za: number, zb: number, ya: number, yb: number) {
  c.beginPath();
  c.moveTo(fx(za), fY(ya, za));
  c.lineTo(fx(zb), fY(ya, zb));
  c.lineTo(fx(zb), fY(yb, zb));
  c.lineTo(fx(za), fY(yb, za));
  c.closePath();
}
function farBank(c: C, env: PaintEnv, fx: (z: number) => number) {
  const m = env.mood;
  // the haze toward the window: depth 0 (near) .. 1 (at the window)
  const hz = (z: number) => Math.pow(1 - 1 / z, 0.8);
  const body = (z: number) => mixLab(mixLab(m.ink, m.set, 0.45), mixLab(m.set, m.sky[3], 0.8), hz(z));
  const face = (z: number) => mixLab(mixLab(m.set, m.fg, 0.4), mixLab(m.sky[3], m.set, 0.35), hz(z));
  // the carcass (the gaps between drawers read dark)
  for (let i = 0; i < FAR.cols; i++) {
    const za = fz(i), zb = fz(i + 1);
    c.fillStyle = body((za + zb) / 2);
    quad(c, fx, za, zb * 1.002, FAR.top - 30, FAR.bot + 6);
    c.fill();
  }
  // the drawer fronts: an inset face per drawer, a lit top bevel and a dark pull
  for (let i = 0; i < FAR.cols; i++) {
    const za = fz(i), zb = fz(i + 1), zm = (za + zb) / 2;
    const ia = za + (zb - za) * 0.1, ib = zb - (zb - za) * 0.1;
    const fc = face(zm);
    for (let r = 0; r < FAR.rows; r++) {
      if (r === FAR.ledge) continue;
      const y0 = rowY(r) + 4, y1 = rowY(r + 1) - 3;
      c.fillStyle = fc;
      quad(c, fx, ia, ib, y0, y1);
      c.fill();
      if (i < 30) {
        c.fillStyle = withAlpha(mixLab(m.rim, m.sky[3], hz(zm)), 0.35 * (1 - hz(zm)));
        quad(c, fx, ia, ib, y0, y0 + 1.6);
        c.fill();
        c.fillStyle = withAlpha(m.ink, 0.7 * (1 - hz(zm)));
        const ym = (y0 + y1) / 2;
        quad(c, fx, zm - (zb - za) * 0.09, zm + (zb - za) * 0.09, ym - 2, ym + 2);
        c.fill();
      }
    }
  }
  // the cornice along the top (a heavy moulding with a lit lip) and the mid ledge; the plinth at the foot
  const ledge = (ya: number, yb: number, lit: number) => {
    for (let i = 0; i < FAR.cols; i++) {
      const za = fz(i), zb = fz(i + 1), zm = (za + zb) / 2;
      c.fillStyle = mixLab(mixLab(m.ink, m.set, 0.25), mixLab(m.set, m.sky[3], 0.7), hz(zm));
      quad(c, fx, za, zb * 1.002, ya, yb);
      c.fill();
      c.fillStyle = withAlpha(mixLab(m.rim, m.sky[3], hz(zm)), lit * (1 - 0.7 * hz(zm)));
      quad(c, fx, za, zb * 1.002, ya, ya + 2);
      c.fill();
    }
  };
  ledge(FAR.top - 40, FAR.top + 2, 0.55);
  ledge(rowY(FAR.ledge) + 2, rowY(FAR.ledge + 1) - 2, 0.4);
  ledge(FAR.bot - 2, FAR.bot + 14, 0.2);
  // a stile every five drawers (the cabinets' sides), stepping into depth
  for (let i = 0; i < FAR.cols; i += 5) {
    const z = fz(i);
    c.fillStyle = withAlpha(mixLab(m.ink, m.set, 0.3), 0.85 * (1 - hz(z)));
    quad(c, fx, z, z * 1.012, FAR.top - 40, FAR.bot + 14);
    c.fill();
  }
}
function farCase(c: C, env: PaintEnv) {
  const m = env.mood;
  // the hall floor between the banks, darkening toward us
  const fl = c.createLinearGradient(0, FVP.y, 0, 720);
  fl.addColorStop(0, mixLab(m.set, m.sky[3], 0.6));
  fl.addColorStop(1, mixLab(m.ink, m.set, 0.3));
  c.fillStyle = fl;
  c.beginPath();
  c.moveTo(fXl(FAR.z1), fY(FAR.bot, FAR.z1));
  c.lineTo(fXr(FAR.z1), fY(FAR.bot, FAR.z1));
  c.lineTo(fXr(1), 760);
  c.lineTo(fXl(1), 760);
  c.closePath();
  c.fill();
  farBank(c, env, fXr);
  farBank(c, env, fXl);
}
/** the far drawers' lips: a ripple travelling out from the case to the nearest drawers (ripple 0..1), then the hairline
 *  tail held (tail 0..1) */
function farLips(c: C, env: PaintEnv, tail: number, ripple: number) {
  if (tail <= 0.01 && (ripple <= 0 || ripple >= 1)) return;
  const m = env.mood;
  c.save();
  // the wave front, in columns counted from the window (far) outward to the nearest drawers
  const front = ripple * (FAR.cols + 8) - 4;
  for (let i = 0; i < FAR.cols; i++) {
    const d = FAR.cols - 1 - i;
    const wave = ripple > 0 && ripple < 1 ? Math.exp(-((d - front) ** 2) / 8) : 0;
    const held = d < front || ripple >= 1 ? 1 : 0;
    const k = Math.max(wave, held * 0.6 * tail);
    if (k <= 0.01) continue;
    const za = fz(i), zb = fz(i + 1), zm = (za + zb) / 2;
    const ia = za + (zb - za) * 0.1, ib = zb - (zb - za) * 0.1;
    const col = mixLab(mixLab(m.halo, m.core, 0.4 + 0.5 * wave), '#ffffff', 0.25 * wave);
    // nearest rows at least 0.35 (the eye must see the pour reach the whole vocabulary)
    const a = Math.min(1, (0.95 - 0.45 * (i / FAR.cols)) * k);
    c.fillStyle = withAlpha(col, a);
    for (let r = 0; r < FAR.rows; r++) {
      if (r === FAR.ledge || hash1(i * 31 + r, 77) < -0.75) continue;
      // the lip: the drawer's lit bottom edge, slid out a hair (a lit band 7 world px tall, a hairline glow above it)
      const y1 = rowY(r + 1) - 3;
      for (const fx of [fXr, fXl]) {
        quad(c, fx, ia - 0.004 * za, ib, y1 - 7, y1 + 1);
        c.fill();
      }
    }
  }
  c.restore();
}

/** band 6's glyph: a short line of cast type sorts, the next slot after them a lit ghost (u 0..1 sets them in turn) */
function typeSorts(c: C, r: BandRect, u: number) {
  const n = 5;
  const sw = 22, sh = 26, gap = 5;
  const x0 = r.x + (r.w - (n + 1) * (sw + gap)) / 2;
  const y = r.y + (r.h - sh) / 2 + 2;
  c.save();
  for (let i = 0; i < n; i++) {
    const a = clamp01(u * (n + 1) - i);
    const x = x0 + i * (sw + gap);
    const dy = (1 - a) * 6;
    c.fillStyle = '#0d0f0e';
    c.fillRect(x, y - dy, sw, sh);
    // the face's raised letter, cut so the lamp shows through
    c.fillStyle = `rgba(255,248,226,${0.55 * a})`;
    c.fillRect(x + 6, y + 5 - dy, sw - 12, 9);
    c.fillStyle = '#0d0f0e';
    c.fillRect(x + 9, y + 7 - dy, sw - 18, 5);
  }
  // the ghost slot: a lit opening waiting for the next sort
  const gx = x0 + n * (sw + gap);
  c.fillStyle = 'rgba(255,250,236,0.9)';
  c.fillRect(gx, y, sw, sh);
  c.strokeStyle = '#0d0f0e';
  c.lineWidth = 1.5;
  c.setLineDash([3, 3]);
  c.strokeRect(gx + 1, y + 1, sw - 2, sh - 2);
  c.restore();
}

/** the context slugs as cast type metal (over the kit's slugs): a cool sheen down the body, a bevelled shoulder, a
 *  hard shadow between sorts and the foot's nick grooves */
function castMetal(c: C, env: PaintEnv, ctx: string[], cands: { tok: string }[], reveal: number) {
  if (reveal < 0.55) return;
  const size = 30, h = size * 1.9;
  const chosenW = slugWidth(c, cands[0].tok, size);
  const lineW = ctx.reduce((a, tk) => a + slugWidth(c, tk, size) + 2, 0) + chosenW + 46;
  const stickX = NT.x + Math.max(40, (1280 - lineW) / 2);
  const y = NT.y + 140 - h;
  const m = env.mood;
  let x = stickX + 14;
  c.save();
  c.globalAlpha *= sm((reveal - 0.55) / 0.45);
  for (const tk of ctx) {
    const w = slugWidth(c, tk, size);
    // the body's sheen: lighter at the shoulder, darkening to the foot (multiply keeps the face legible)
    c.globalCompositeOperation = 'multiply';
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#d3d9d9');
    g.addColorStop(1, '#78807f');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.globalCompositeOperation = 'source-over';
    // bevels: a bright top and left edge, a dark right edge (the hard shadow onto the next sort)
    c.fillStyle = withAlpha(mixLab(m.rim, '#ffffff', 0.3), 0.55);
    c.fillRect(x, y, w, 1.6);
    c.fillRect(x, y, 1.4, h * 0.7);
    c.fillStyle = withAlpha('#000000', 0.55);
    c.fillRect(x + w - 2, y, 2, h);
    // the foot: two nick grooves
    c.fillStyle = withAlpha('#000000', 0.5);
    c.fillRect(x, y + h * 0.78, w, 1.6);
    c.fillRect(x, y + h * 0.88, w, 1.2);
    c.fillStyle = withAlpha(m.rim, 0.3);
    c.fillRect(x, y + h * 0.78 + 1.6, w, 0.8);
    x += w + 2;
  }
  c.restore();
}

void softmax;
