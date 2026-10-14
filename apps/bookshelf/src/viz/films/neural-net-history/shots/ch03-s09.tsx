/**
 * ch03-s09 — the mid-sixties: the learning-machine candle gutters out at seven rings; the knob clue is pinned;
 * X-ray band 2 lights; then the shadow of a closed book slides across the board.
 *
 * Tint crossfade from the Wall's candleAmber to duskRose (a real mood change). THE STAGE: the 1958 candle,
 * lower now (six rings burned, burning to seven), its pool shrinking. Rosenblatt nearest the flame; the reporter,
 * the officer and Widrow in the light with him.
 *   "moved"     the figures leave the pool one by one, walking out on the twos: the reporter, the officer, then
 *               Widrow, who pauses at the rim and turns toward a small antenna on the horizon before going.
 *               Rosenblatt alone stays near the flame.
 *   "seven"     the candle gutters out: frayed rim, a thread of smoke, the seven-ring sleeve dark above the stub;
 *               label 1958 – c. 1965 · about 7 years
 *   line end    CUT to the board (crossfade duskRose → candleAmber, 0.6 s, STUDY LOCK): the hands pin the knob
 *               clue in C1-b under the wick card; a thread of light runs to the wick card and on to the LEARNING
 *               suspect card, whose dark lantern flickers once, faintly, and goes dark again
 *   pause       X-RAY (square-on): band 1 softly lit, band 2 (thousands of adjustable knobs) lights above it
 *   "book"      a closed book's shadow slides in from the right over the X-ray box (it fades beneath it), and the
 *               camera pulls back as the shadow crosses and darkens the board; only the oxblood question thread
 *               along the top edge stays in the lamp's light, with its card AND IF NO STRAIGHT LINE EXISTS?
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, MOODS, POSES, PUPPET_NEAR_BLACK, annotation, defineShot, dustMotes, hash1, makeCanvas, mixLab, pose, toScreen, walkTo, withAlpha, withLife, blendPose } from '../../../film';
import { cast, hands } from '../cast';
import { candleStage, floorShadow } from '../sets/candleStage';
import { STUDY, slotWorld, studyCase, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, xrayBandsAt, type CandleView } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, poolAt, slotPin } from '../sets/caseBoard';
import { XRAY, xrayColumn, xrayGlowAt } from '../sets/xrayColumn';
import { handsEntry } from '../sets/narratorHands';
import { ROSE_STAGE, camKeys, clamp01, lampSpill, lerp, pinSway, sm, stageLip, tq12, win } from '../sets/ch03-s06-kit';
import { toLayer } from '../../../film';

const ID = 'ch03-s09';
type C = CanvasRenderingContext2D;

const CANDLE_X = 470;
/** as in ch03-s06: the stage candle a little under the shared 2.1, so the push holds flame and feet in frame */
const STAGE_S = 1.8;
const LEARNS0 = shelfStateAt(ID, 'start').find((v) => v.id === 'learns')!;
/** six rings burned as the shot opens ("lower now"), burning to seven by the gutter */
const RINGS0 = 6;
/** the arched opening in the stage's back wall (L3 px): dusk beyond, a far ridge, the antenna small on the horizon */
const ARCH = { cx: 176, top: 150, bot: 548, w: 250, horizon: 452 };

// figures (stage px, feet line 640)
const ROSE_X = 700;
const REP_X = 930;
/** the officer stands a step further back, on L3 in the haze (L3 px; feet a little higher, a little smaller) */
const OFF_X = 860;
const OFF_FEET = 646;
const OFF_SCALE = 0.86;
const WID_X = 318;
const WID_RIM = 168;
/** the X-ray framing: the box right of centre (its centre ≈ 62% across), C4's cards and the board's edge left */
const XCAM = { x: 1100, y: 492, z: 80 };

const LOOK_OUT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: -2, head: -10, shoulderF: -4, elbowF: 18, wristF: 6, shoulderB: -10, elbowB: 14 });
const ROSE_STAND: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 0, neck: 10, head: 0, shoulderF: 4, elbowF: 20, wristF: 6, shoulderB: -8, elbowB: 16 });
const ROSE_BOW: Pose = pose({ hipF: 5, kneeF: -5, hipB: -3, kneeB: -2, torso: 4, neck: 16, head: 14, shoulderF: 0, elbowF: 10, wristF: 6, shoulderB: -4, elbowB: 10 });

interface Beats {
  leave: number;
  seven: number;
  candleWord: number;
  burned: number;
  gutter: number;
  cut: number;
  pin0: number;
  pinDur: number;
  thread0: number;
  flicker: number;
  xcut: number;
  band0: number;
  book: number;
  pull0: number;
  pull1: number;
  layer: number;
  single: number;
  never: number;
  doEnd: number;
  repAt: number;
  offAt: number;
  widFlip: number;
  widAt: number;
  widGo: number;
}

interface Scene extends ShotScene {
  b: Beats;
  D: number;
  stageCam: (t: number) => Camera3;
  studyCam: (t: number) => Camera3;
  STAGE_CAMS: Camera3[];
  STUDY_CAMS: Camera3[];
  rep: ReturnType<typeof walkTo>;
  off: ReturnType<typeof walkTo>;
  widA: ReturnType<typeof walkTo>;
  widB: ReturnType<typeof walkTo>;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const gutter = T.beat('gutter');
    const book = T.beat('shadow');
    const leave = T.beat('leave');
    const burned = T.word('L0319', 'burned');
    // the label lands on 'burned' and is held into the pause (≥ 1.5 s at full); the cut to the board comes a
    // little into the pause, the knob clue is pinned in a quick insert, and X-RAY lands on its beat
    // the board insert gets ≈1.2 s (the pin, the thread of light, the lantern's one flicker) before X-RAY, which
    // then holds through the pause into the turn line until 'book'
    const cut = Math.max(T.beat('clue') - 0.1, burned + 1.7);
    const pin0 = cut - 0.3, pinDur = 1.0;
    const pinLand = pin0 + 0.45 * pinDur;
    // the board insert holds ≈1.5 s (the pin, the thread, the lantern's one visible flicker); the X-RAY beat is a
    // music-only pause with slack until 'book'
    const xcut = Math.max(T.beat('xray') + 0.7, pinLand + 1.5);
    // Widrow: walks to the rim, pauses there ≈0.6 s (4.2–4.8) with his head turned to the antenna, then goes;
    // he is out of frame by ≈6.0, leaving Rosenblatt alone by the dark sleeve before the cut
    const widProbe = walkTo(cast.widrow.spec, { x0: WID_X, x1: WID_RIM, at: 0, cadence: 1.0 });
    const widWalk = widProbe(0).arrive;
    const widArrive = leave + 1.32;
    const widAt = widArrive - widWalk;
    const b: Beats = {
      leave,
      seven: T.word('L0319', 'seven'),
      candleWord: T.word('L0319', 'candle'),
      burned,
      gutter,
      cut,
      pin0,
      pinDur,
      // the knob card holds close for a beat after the pin (its '1958' read); then the thread of light runs out of
      // it as the camera pulls back with it, and LEARNING flickers once in the wider frame
      thread0: pinLand + 0.3,
      // LEARNING's one faint flicker: on and off inside ≈0.5 s, dark again ≈0.2 s before the cut to X-RAY
      flicker: pinLand + 0.78,
      xcut,
      band0: xcut + 0.2,
      book,
      // the shadow enters on 'book' (moving as the word is said), covers the box by 'layer' and sits squarely over
      // the knob band on 'never do'; after 'do' the book comes nearer the lamp and its shadow swells over the board
      pull0: T.wordEnd('L0320', 'do') + 0.1,
      pull1: T.wordEnd('L0320', 'do') + 2.0,
      layer: T.word('L0320', 'layer'),
      single: T.word('L0320', 'single'),
      never: T.word('L0320', 'never'),
      doEnd: T.wordEnd('L0320', 'do'),
      repAt: leave - 0.2,
      offAt: leave + 0.6,
      widFlip: widAt - 0.08,
      widAt,
      widGo: widArrive + 0.6,
    };
    // the leavers: whole steps on the twos, feet planted
    const rep = walkTo(cast.reporter.spec, { x0: REP_X, x1: REP_X + 820, at: b.repAt, cadence: 1.1 });
    const off = walkTo(cast['navy-officer'].spec, { x0: OFF_X, x1: OFF_X + 760, at: b.offAt, cadence: 1.1, scale: OFF_SCALE });
    const widA = walkTo(cast.widrow.spec, { x0: WID_X, x1: WID_RIM, at: b.widAt, cadence: 1.0, end: LOOK_OUT });
    const widB = walkTo(cast.widrow.spec, { x0: WID_RIM, x1: WID_RIM - 620, at: b.widGo, cadence: 1.3 });
    // stage camera: pushed in (the figures ≈ half the frame), a slow push toward the candle as the light empties
    const stageCam = camKeys([
      [0, 616, 384, 150],
      [b.leave, 608, 380, 168],
      [gutter, 572, 366, 222],
      [cut, 566, 362, 234],
    ]);
    // study camera: C1 column insert → X-RAY square-on → pull back to the board medium as the shadow crosses →
    // a slow drift up toward the question thread, the last thing in the light
    // the insert: close on the knob card (its '1958' the subject), C1 above it, LEARNING at lower left
    // the insert: CLOSE on the knob card for the pin (its '1958' ≥ 22 px cap at 1080p), then a pull-back that
    // follows the thread of light up to C1 and across to LEARNING (lower left) for its flicker
    const ins = { x: 330, y: 338, z: 436 };
    const kb = slotWorld('C1-b', 'centre');
    const insert = camKeys([
      [cut, kb.x + 6, kb.y + 8, 646],
      [pinLand + 0.4, kb.x + 2, kb.y + 2, 680],
      [pinLand + 0.95, ins.x - 6, ins.y + 8, 450],
      [b.xcut, ins.x + 6, ins.y, ins.z + 8],
    ]);
    // X-RAY: the box RIGHT of centre, the board's right edge (C4's cards) at the left as context; a push onto
    // bands 1-2 while band 2's knobs light (music only), a pull back on 'book' so the whole book shadow is seen
    // sliding in, a slow push as it settles squarely over the knob band; after 'do' the pull back to the board
    const B12 = { x: STUDY.xray.x, y: STUDY.xray.y - 74 * STUDY.xray.s };
    const after = camKeys([
      [b.xcut, XCAM.x, XCAM.y, XCAM.z],
      [b.band0 + 1.0, B12.x - 50, B12.y - 6, XCAM.z + 130],
      [b.book - 0.4, B12.x - 52, B12.y - 8, XCAM.z + 134],
      [b.book + 0.9, XCAM.x + 40, XCAM.y, XCAM.z - 30],
      [b.never, XCAM.x + 70, XCAM.y, XCAM.z + 10],
      [b.pull0, XCAM.x + 70, XCAM.y, XCAM.z + 14],
      [b.pull1, 700, 330, -30],
      [D, 520, 236, 280],
    ]);
    const studyCam = (t: number): Camera3 => (t < b.xcut ? insert(t) : after(t));
    tl.hold(0, D);
    const STAGE_CAMS = [stageCam(0), stageCam(b.leave), stageCam(cut)];
    const STUDY_CAMS = [insert(cut), insert(b.xcut), after(b.xcut), after(b.pull0), after(b.pull1), after(D)];
    return { tl, b, D, stageCam, studyCam, STAGE_CAMS, STUDY_CAMS, rep, off, widA, widB };
  },
  paint(f, _s, sc) {
    if (f.t < sc.b.cut) paintStage(f, sc, f.t);
    else paintStudy(f, sc, f.t);
  },
});

// =====================================================================================================
// THE STAGE
// =====================================================================================================
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.stageCam(t);
  f.camera(cam);
  f.setMood('duskRose', { from: 'candleAmber', u: sm(t / 1.0) });
  // the flame: steady, then guttering on the twos from "candle", out on "seven"
  const gu = clamp01((tq - b.candleWord) / (b.gutter - b.candleWord));
  const flick = 0.5 + 0.5 * Math.sin(tq * 29 + 0.7) * Math.sin(tq * 12.3);
  const out = tq >= b.gutter + 0.08;
  const fk = tq < b.candleWord ? 1 : !out ? Math.max(0.1, (1 - 0.8 * gu) * (0.5 + 0.5 * flick)) : 0;
  const burn = Math.min(1, t / b.gutter);
  // CANDLE-CLOCK: once out, the stub's tag reads its whole span
  // the shot's own label (the script's '1958 – c. 1965 · about 7 years', beside the sleeve from 'burned') does the
  // naming rule's job here, so the kit's naming card is switched off for this view (a distinct id: candleStage
  // takes no \`named\`); the vertical lettering dims while the label is up
  // the stub's small paper tag keeps the year it was lit (texture at this scale); the span it now carries
  // ('1958 – c. 1965 · about 7 years') is read on the shot's own label beside the sleeve, at ≥ 22 px cap
  const view: CandleView = { ...LEARNS0, id: `${LEARNS0.id}@${ID}`, rings: RINGS0, state: out ? 'guttered' : 'live', smoke: out, tag: LEARNS0.tag };
  // the years label: its leader starts just before, so the TEXT arrives WITH 'seven' (the annotation sets its
  // text 0.5–0.9 s after \`at\`) as the flame gutters, and holds into the pause
  const la = b.seven - 0.6;
  const labelK = win(t, b.seven - 0.15, b.seven + 0.25);
  const geo = candleStage(f, {
    key: ID,
    cams: sc.STAGE_CAMS,
    candle: view,
    candleX: CANDLE_X,
    s: STAGE_S,
    burn,
    flame: fk,
    pool: 1 - 0.5 * gu,
    letters: 0.62 - 0.3 * labelK,
    rimDir: { x: -0.6, y: -0.8 },
    back: (c, env) => {
      horizon(f, c, env);
      // the officer, a step further back in the haze (L3): listening, then walking out to the right
      const L3light = { x: -1, y: -0.4, floor: 0.2 };
      // solid at fog-B density (a set-ink cut-out a step lighter than the near figures, never translucent)
      const offInk = mixLab(env.mood.fg, env.mood.set, 0.28);
      if (tq < b.offAt) {
        const p = withLife({ ...POSES.listen }, tq, OFF_X, 0.8);
        cast['navy-officer'].draw(c, { x: OFF_X, y: OFF_FEET, facing: 'left', pose: p, light: L3light, scale: OFF_SCALE, ink: offInk }, env);
      } else {
        const w = sc.off(t);
        if (w.x < 1800) cast['navy-officer'].draw(c, { x: w.x, y: OFF_FEET, facing: w.facing, pose: w.pose, light: L3light, scale: OFF_SCALE, ink: offInk }, env);
      }
    },
    draw: (c, env, g) => {
      const light = Math.max(0.12, fk);
      const L = { x: -1, y: -0.4, floor: 0.2 };
      const figs: { x: number; draw: (cc: C, x: number, y: number) => void }[] = [];
      // the reporter, then the officer: turn on a hold and walk out to the right
      for (const [who, wf, x0, at] of [[cast.reporter, sc.rep, REP_X, b.repAt]] as const) {
        if (tq < at) {
          const p = withLife({ ...POSES.listen }, tq, x0, 0.8);
          figs.push({ x: x0, draw: (cc, x, y) => who.draw(cc, { x, y, facing: 'left', pose: p, light: L }, env) });
        } else {
          const w = wf(t);
          if (w.x < 1700) figs.push({ x: w.x, draw: (cc, x, y) => who.draw(cc, { x, y, facing: w.facing, pose: w.pose, light: L }, env) });
        }
      }
      // Widrow: faces the flame, turns, walks to the rim, looks out at the antenna, then goes
      {
        let x = WID_X, facing: 'left' | 'right' = 'right', p: Pose = withLife({ ...POSES.listen }, tq, 56, 0.8);
        if (tq >= b.widFlip && tq < b.widAt) facing = 'left';
        else if (tq >= b.widAt && tq < b.widGo) {
          const w = sc.widA(t);
          x = w.x;
          facing = 'left';
          p = w.walking ? w.pose : withLife({ ...blendPose(POSES.stand, LOOK_OUT, sm((tq - w.arrive) / 0.4)) }, tq, 56, 0.6);
        } else if (tq >= b.widGo) {
          const w = sc.widB(t);
          x = w.x;
          facing = w.facing;
          p = w.pose;
        }
        if (x > -400) figs.push({ x, draw: (cc, xx, y) => cast.widrow.draw(cc, { x: xx, y, facing, pose: p, light: L }, env) });
      }
      // Rosenblatt stays near the flame; when it goes out his head bows
      const rp = withLife({ ...blendPose(ROSE_STAND, ROSE_BOW, sm((tq - (b.gutter + 0.1)) / 0.8)) }, tq, 1958, 0.8);
      // (as in ch03-s06: his jacket and hair signature, the darkest shape on the stage, rimmed on the flame side)
      const roseShadow = { x: ROSE_X, draw: (cc: C, x: number, y: number) => ROSE_STAGE.draw(cc, { x, y, facing: 'left', pose: rp, light: L }, env) };
      for (const fg of [...figs, roseShadow]) floorShadow(c, g, fg.x, (cc) => fg.draw(cc, 0, 0), env, light);
      for (const fg of figs) fg.draw(c, fg.x, g.floorY);
      ROSE_STAGE.draw(c, { x: ROSE_X, y: g.floorY, facing: 'left', pose: rp, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.4, floor: 0 }, edgeRim: { x: -1, y: -0.5, px: 1.5, alpha: 0.4 + 0.35 * light } }, env);
    },
  });
  // the apron's near lip, low: it slides out of frame as the camera pushes toward the guttering candle
  stageLip(f, sc.STAGE_CAMS, ID, 676);
  // the stage's near velvet leg at the RIGHT edge (L6, soft): the walk-outs pass behind it
  rightLeg(f, sc);
  // the label: the sleeve's seven rings
  const sleeveTop = { x: CANDLE_X + 34, y: geo.floorY - 270 * STAGE_S + 3.5 * 6 * STAGE_S };
  const p = toScreen(LAYERS.L4, cam, sleeveTop.x, sleeveTop.y);
  annotation(f.c, { text: '1958 – c. 1965 · about 7 years', x: p.x, y: p.y, tx: p.x + 120, ty: p.y + 46, at: la, dur: b.cut - la + 0.4, size: 24 }, { t, mood: f.mood, seed: 65 });
}

/** L6: the proscenium's near velvet leg at the right frame edge (its inner edge ≈1130 px on screen at the opening
 *  camera, sliding out a little with the push), folds catching a thread of dusk */
function rightLeg(f: Frame, sc: Scene) {
  f.layer('L6', (c, env) => {
    const { x, y } = toLayer(LAYERS.L6, sc.stageCam(0), 1150, 0);
    const H = 1500;
    c.save();
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.moveTo(x + 900, y - 500);
    c.lineTo(x, y - 500);
    for (let i = 1; i <= 8; i++) c.quadraticCurveTo(x - 10 * Math.sin(i * 1.7), y - 500 + (i - 0.5) * (H / 8), x - 6 * Math.cos(i * 1.1), y - 500 + i * (H / 8));
    c.lineTo(x + 900, y - 500 + H);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.12);
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x + 4, y - 500);
    c.lineTo(x + 2, y - 500 + H);
    c.stroke();
    c.restore();
  });
}

/** DUSK ROSE: the warm cast of a dusk sky (the palette's rose, pushed): carried by the opening's light */
const ROSE_SKY = '#d39a8e';
const ROSE_DEEP = '#7a4a4c';
/**
 * The backlight of the stage: a tall arched opening in the back wall, high at the left. Through it the dusk:
 * a rose sky brightest on the horizon band, a far ridge (L1-hazed) and on it, small, the antenna mast Widrow
 * turns toward before he goes. It throws a rose glow onto the backdrop around it.
 */
function horizon(f: Frame, c: C, env: PaintEnv) {
  const m = env.mood;
  const { cx, top, bot, w, horizon: hz } = ARCH;
  const x0 = cx - w / 2, x1 = cx + w / 2, ar = w / 2;
  const r = { x: x0 - 220, y: top - 200, w: w + 440, h: bot - top + 300 };
  f.cached(`${ID}/stage/L3/arch/${m.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    // the glow around the opening on the backdrop (rose, soft)
    const gl = cc.createRadialGradient(cx, hz - 40, 60, cx, hz - 40, 330);
    gl.addColorStop(0, withAlpha(mixLab(ROSE_SKY, m.haze, 0.35), 0.34));
    gl.addColorStop(1, withAlpha(ROSE_DEEP, 0));
    cc.fillStyle = gl;
    cc.fillRect(r.x, r.y, r.w, r.h);
    const hole = new Path2D();
    hole.moveTo(x0, bot);
    hole.lineTo(x0, top + ar);
    hole.arc(cx, top + ar, ar, Math.PI, 0);
    hole.lineTo(x1, bot);
    hole.closePath();
    cc.save();
    cc.clip(hole);
    // the sky: dusk ramp, brightest on the horizon band
    const g = cc.createLinearGradient(0, top, 0, bot);
    const u = (y: number) => (y - top) / (bot - top);
    g.addColorStop(0, mixLab(ROSE_DEEP, m.sky[1], 0.5));
    g.addColorStop(u(hz - 120), mixLab(ROSE_SKY, m.sky[2], 0.45));
    g.addColorStop(u(hz - 4), mixLab(mixLab(ROSE_SKY, m.core, 0.4), '#ffffff', 0.08));
    g.addColorStop(1, mixLab(ROSE_SKY, m.sky[2], 0.5));
    cc.fillStyle = g;
    cc.fillRect(x0, top, w, bot - top);
    // a far ridge on the horizon (hazed nearly into the sky), a nearer, darker one below it
    cc.fillStyle = mixLab(ROSE_DEEP, ROSE_SKY, 0.45);
    cc.beginPath();
    cc.moveTo(x0, hz + 6);
    cc.quadraticCurveTo(cx - 50, hz - 14, cx + 10, hz + 2);
    cc.quadraticCurveTo(x1 - 40, hz + 14, x1, hz - 4);
    cc.lineTo(x1, bot);
    cc.lineTo(x0, bot);
    cc.closePath();
    cc.fill();
    cc.fillStyle = mixLab(m.set, ROSE_DEEP, 0.4);
    cc.beginPath();
    cc.moveTo(x0, hz + 46);
    cc.quadraticCurveTo(cx + 20, hz + 26, x1, hz + 52);
    cc.lineTo(x1, bot);
    cc.lineTo(x0, bot);
    cc.closePath();
    cc.fill();
    // the antenna: a slim lattice mast standing small on the far ridge
    const ink = mixLab(ROSE_DEEP, m.ink, 0.45);
    const mx = cx - 46, base = hz - 6, mtop = hz - 92;
    cc.strokeStyle = ink;
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(mx - 6, base);
    cc.lineTo(mx - 1, mtop);
    cc.moveTo(mx + 6, base);
    cc.lineTo(mx + 1, mtop);
    for (let i = 0; i < 6; i++) {
      const yy = base - ((base - mtop) * i) / 6, yn = base - ((base - mtop) * (i + 1)) / 6;
      const w0 = 6 - 5 * (i / 6), w1 = 6 - 5 * ((i + 1) / 6);
      cc.moveTo(mx - w0, yy);
      cc.lineTo(mx + w1, yn);
      cc.moveTo(mx + w0, yy);
      cc.lineTo(mx - w1, yn);
    }
    cc.moveTo(mx - 13, mtop + 10);
    cc.lineTo(mx + 13, mtop + 10);
    cc.moveTo(mx - 9, mtop + 21);
    cc.lineTo(mx + 9, mtop + 21);
    cc.moveTo(mx, mtop);
    cc.lineTo(mx, mtop - 9);
    cc.stroke();
    cc.fillStyle = ink;
    cc.beginPath();
    cc.ellipse(mx + 8, mtop + 30, 2.6, 5.6, -0.4, 0, Math.PI * 2);
    cc.fill();
    cc.restore();
    // the opening's paper-cut frame: jambs, arch, a mullion and a transom, a sill
    const fr = mixLab(m.fg, m.set, 0.3);
    cc.strokeStyle = fr;
    cc.lineWidth = 16;
    cc.stroke(hole);
    cc.lineWidth = 4;
    cc.beginPath();
    cc.moveTo(cx, top);
    cc.lineTo(cx, bot);
    cc.moveTo(x0, top + ar);
    cc.lineTo(x1, top + ar);
    cc.stroke();
    cc.fillStyle = fr;
    cc.fillRect(x0 - 24, bot - 4, w + 48, 13);
    // the frame's inner edge, rimmed by the sky
    cc.strokeStyle = withAlpha(mixLab(ROSE_SKY, m.rim, 0.5), 0.35);
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(x1 - 8, bot - 4);
    cc.lineTo(x1 - 8, top + ar);
    cc.arc(cx, top + ar, ar - 8, 0, -Math.PI * 0.6, true);
    cc.stroke();
  })(c, r.x, r.y);
}

// =====================================================================================================
// THE STUDY: the knob clue, the X-ray, the book's shadow
// =====================================================================================================
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.studyCam(t);
  f.camera(cam);
  f.setMood('candleAmber', { from: 'duskRose', u: win(t, b.cut, b.cut + 0.6) });
  studyRoom(f, { key: ID, cams: sc.STUDY_CAMS, outside: { mood: 'duskRose', kind: 'dusk' } });
  const k = STUDY.board.k;
  const st = boardStateAt(ID, 'start');
  const q1 = st.questions.find((q) => q.slot === 'Q1');
  const board = { ...st, questions: st.questions.filter((q) => q.slot !== 'Q1') };
  const def = SLOTS['C1-b'];
  const pinPt = slotWorld('C1-b', 'pin');
  const ctr = slotWorld('C1-b', 'centre');
  const u = (tq - b.pin0) / b.pinDur;
  const hp = u > 0 && u < 1 ? hands.act('pin', u, pinPt, { held: 'card', scale: 0.72, entry: handsEntry(cam, 'L4') }) : null;
  // the X-ray: present from the cut to X-RAY, glowing up; band 2 lights; fades beneath the book's shadow
  const xs = xrayBandsAt(ID, 'start');
  const xUp = win(t, b.xcut - 0.05, b.xcut + 0.35);
  // band 2 lights over a second (7.6 → 8.6 s), then breathes softly until 'book'
  const bandU = clamp01((t - b.band0) / 1.0);
  const breath = 0.88 + 0.12 * Math.sin((t - b.band0) * 2.6);
  const sh = shadowAt(t, b);
  // the box goes dark beneath the shadow, finished by 'layer'
  const xLight = (0.55 + 0.45 * xUp) * (1 - 0.92 * sm((t - (b.book + 0.25)) / (b.layer - b.book - 0.25)));
  // the S3 lantern flicker (once, faint) and the threads of light
  // one visible flicker: up in a frame, held ≈4 frames, gone (on the twos)
  // one faint flicker (≈0.45 at peak): up in 0.12 s, held, gone ≈0.5 s after it began
  const fl = win(tq, b.flicker - 0.08, b.flicker + 0.04) * (1 - win(tq, b.flicker + 0.24, b.flicker + 0.42));
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: board, hide: ['S3', 'O'] },
    wall: false,
    shelf: false,
    xray: false,
    extra: (c, env) => {
      // S3 LEARNING, its dark lantern flickering once
      const s3 = SLOTS.S3;
      const s3w = slotWorld('S3', 'centre');
      drawCard(c, s3, { x: s3w.x, y: s3w.y, k, light: poolAt(POOL, s3.x, s3.y), lanternLit: 0.45 * fl }, env);
      if (fl > 0.01) {
        // the lantern's halo (≈0.4 at peak) so the flicker reads at the insert's scale
        const hy = s3w.y - (s3.h / 2) * k + 30 * k;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const hg = c.createRadialGradient(s3w.x, hy, 4, s3w.x, hy, 70 * k);
        hg.addColorStop(0, withAlpha(env.mood.core, 0.24 * fl));
        hg.addColorStop(0.4, withAlpha(env.mood.halo, 0.1 * fl));
        hg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = hg;
        c.fillRect(s3w.x - 70 * k, hy - 70 * k, 140 * k, 140 * k);
        c.restore();
      }
      // the chat box's card (O): as the X-ray rises it dissolves into the column (the column IS the chat box)
      {
        const oa = 1 - win(t, b.xcut - 0.05, b.xcut + 0.3);
        if (oa > 0.01) {
          const ow = slotWorld('O', 'centre');
          c.save();
          c.globalAlpha *= oa;
          drawCard(c, SLOTS.O, { x: ow.x, y: ow.y, k, light: poolAt(POOL, SLOTS.O.x, SLOTS.O.y) }, env);
          c.restore();
        }
      }
      // the question card on the thread (swaying a little; the last thing in the light at the end)
      if (q1) questionCard(c, env, q1.x, q1.text, t);
      // threads of light: C1-b → C1 (it stays), and on to S3 (it fades with the flicker)
      if (u >= 0.45) {
        const pB = slotPin(STUDY.board, 'C1-b'), pC = slotPin(STUDY.board, 'C1'), pS = slotPin(STUDY.board, 'S3');
        lightThread(c, env, pB, pC, win(t, b.thread0, b.thread0 + 0.2), 1);
        // routed out to the RIGHT of the KNOWLEDGE card (never reading as a tie to the wrong suspect)
        lightThread(c, env, pC, pS, win(t, b.thread0 + 0.1, b.flicker - 0.1), 1 - win(t, b.flicker + 0.3, b.flicker + 0.6), 70);
      }
      // C1-b: the knob clue, pinned
      if (u >= 0.45) {
        const dt = tq - (b.pin0 + 0.45 * b.pinDur);
        c.save();
        c.translate(pinPt.x, pinPt.y);
        c.rotate(pinSway(dt));
        c.translate(-pinPt.x, -pinPt.y);
        drawCard(c, def, { x: ctr.x, y: ctr.y, k, light: poolAt(POOL, def.x, def.y) }, env);
        c.restore();
      }
      if (hp) hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => drawCard(cc, def, { x: at.x, y: at.y + (def.h / 2 - 7) * k, k, light: 0.85, pin: false }, e) });
      // the X-ray column (band 1 lit; band 2 lighting)
      if (t >= b.xcut - 0.05) {
        xrayColumn(c, { ...STUDY.xray, state: { ...xs, lit: xs.lit.map((v, i) => v && i === 0) }, light: xLight, reveal: { band: 2, u: 0 }, translucency: 0.4 + 0.1 * bandU }, env);
        xrayLantern(c, env, t, xLight, bandU, bandU >= 1 ? breath : 1);
      }
      // the closed book's shadow sliding in from the right
      bookShadow(f, c, env, sh);
    },
  });
  // the X-ray's serverCyan glow (a practical), dimmed by the shadow
  if (t >= b.xcut - 0.05 && xLight > 0.02) {
    const g = xrayGlowAt(STUDY.xray);
    f.layer('L4', (c) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const C = MOODS.serverCyan;
      const R = 460;
      const tint = mixLab(C.halo, MOODS.candleAmber.halo, 0.65);
      const gr = c.createRadialGradient(g.x, g.y, 40, g.x, g.y, R);
      gr.addColorStop(0, withAlpha(tint, 0.09 * xLight));
      gr.addColorStop(0.35, withAlpha(tint, 0.04 * xLight));
      gr.addColorStop(0.7, withAlpha(tint, 0.012 * xLight));
      gr.addColorStop(1, withAlpha(tint, 0));
      c.fillStyle = gr;
      c.fillRect(g.x - R, g.y - R, 2 * R, 2 * R);
      c.restore();
    });
  }
  // the lamp's warm spill from the lower right, until the book stands in its way
  lampSpill(f, 0.8 * (1 - win(t, b.book, b.book + 1.2)), false);
  // the last light along the top edge: dust turning in it
  f.layer('L4', (c, env) => {
    const lit = win(t, b.pull0, b.pull1);
    if (lit <= 0) return;
    dustMotes(c, { area: { x: 160, y: 20, w: 760, h: 150 }, count: 22, salt: 9, size: 1, brightness: 0.5 * lit, drift: { x: 3, y: -1 }, color: env.mood.halo }, env);
  });
}

/** the book shadow's centre and scale (L4 world) over time: in from the right on 'book' (its leading edge in frame
 *  as the word is said), over the box by 'layer', settled squarely on the knob band (bands 1-2) on 'never do';
 *  after 'do' the book is brought nearer the lamp and its shadow swells across the board's right two-thirds,
 *  the C1 column and the question thread left in the light */
const SHADOW = { w: 270, h: 370 };
function shadowAt(t: number, b: Beats): { x: number; y: number; s: number } {
  // the closed book's shadow over the WHOLE box (the knob band squarely inside it)
  const home = { x: STUDY.xray.x + 4, y: STUDY.xray.y - (XRAY.h / 2) * STUDY.xray.s + 4, s: 1 };
  const t0 = b.book - 0.2;
  if (t <= t0) return { x: home.x + 560, y: home.y - 6, s: 1 };
  if (t < b.never) {
    // a long ease: brisk entry, slowing over the box, settled on 'never'
    const u = clamp01((t - t0) / (b.never - t0));
    const e = 1 - (1 - u) ** 3;
    return { x: lerp(home.x + 560, home.x, e), y: lerp(home.y - 6, home.y, e), s: 1 };
  }
  const g = sm(clamp01((t - b.pull0) / (b.pull1 + 0.5 - b.pull0)));
  // it swells from its right edge (which stays past the box, so the box never comes back into the light) toward the
  // lamp side, its head stopping below the question thread
  const S1 = 2.6;
  const right = home.x + SHADOW.w / 2, top0 = home.y - SHADOW.h / 2;
  const sc = lerp(1, S1, g);
  const topY = lerp(top0, 112, g);
  return { x: right - (SHADOW.w / 2) * sc, y: topY + (SHADOW.h / 2) * sc, s: sc };
}

/** a closed book's shadow: a crisp rectangle (8-12 px penumbra), a darker spine band on its leading (left) edge,
 *  and one thin lighter line where the page block shows past the boards */
function bookShadow(f: Frame, c: C, env: PaintEnv, o: { x: number; y: number; s: number }) {
  const { w: W, h: H } = SHADOW;
  if (o.x - (W / 2) * o.s > 1700) return;
  const draw = f.cached(`${ID}/bookShadow7/${env.mood.id}`, W + 40, H + 40, (cc) => {
    cc.translate(20, 20);
    const fg = env.mood.fg;
    cc.fillStyle = withAlpha(fg, 0.9);
    cc.fillRect(0, 0, W, H);
    // the spine band (≈6% of the width), a step darker
    cc.fillStyle = withAlpha(fg, 0.5);
    cc.fillRect(0, 0, W * 0.06, H);
    // the page block: one thin lighter line just inside the fore-edge and head (the boards overhang)
    cc.globalCompositeOperation = 'destination-out';
    cc.fillStyle = 'rgba(0,0,0,0.4)';
    cc.fillRect(W - 7, 6, 1.6, H - 12);
    cc.globalCompositeOperation = 'source-over';
  }, { blur: 1.6 });
  c.save();
  c.translate(o.x, o.y);
  c.rotate(-0.03);
  c.scale(o.s, o.s);
  draw(c, -W / 2 - 20, -H / 2 - 20);
  c.restore();
}

/** the X-ray box re-lit as a paper lantern: the glass's cyan pulled down to ≈45% saturation with a paper
 *  grain, and band 2 drawn as THOUSANDS of tiny knobs (three rows of small knobs, lighting left to right) */
const XR_GRAIN = (() => {
  let cv: HTMLCanvasElement | null = null;
  return () => {
    if (cv) return cv;
    cv = makeCanvas(96, 96);
    const g = cv.getContext('2d')!;
    for (let y = 0; y < 96; y += 2)
      for (let x = 0; x < 96; x += 2) {
        const v = 0.5 + 0.5 * hash1(x * 131 + y * 7, 404);
        g.fillStyle = `rgba(${Math.round(90 + 90 * v)},${Math.round(80 + 80 * v)},${Math.round(64 + 64 * v)},1)`;
        g.fillRect(x, y, 2, 2);
      }
    // fibres
    g.strokeStyle = 'rgba(60,50,40,0.5)';
    g.lineWidth = 0.6;
    for (let i = 0; i < 26; i++) {
      const x0 = (hash1(i, 405) * 0.5 + 0.5) * 96, y0 = (hash1(i, 406) * 0.5 + 0.5) * 96;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x0 + 10 * hash1(i, 407), y0 + 10 * hash1(i, 408));
      g.stroke();
    }
    return cv;
  };
})();
function xrayLantern(c: C, env: PaintEnv, t: number, L: number, bandU: number, breath: number) {
  const s = STUDY.xray.s;
  const W = XRAY.w, H = XRAY.h;
  c.save();
  c.translate(STUDY.xray.x, STUDY.xray.y);
  c.scale(s, s);
  c.beginPath();
  c.roundRect(-W / 2, -H, W, H, 6);
  c.clip();
  // desaturate the glass to ≈45% of its chroma, warm it a touch toward the study's amber
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = 'rgba(128,128,128,0.55)';
  c.fillRect(-W / 2, -H, W, H);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha(mixLab(MOODS.candleAmber.rim, '#ffffff', 0.55), 0.35);
  c.fillRect(-W / 2, -H, W, H);
  // paper grain
  const pat = c.createPattern(XR_GRAIN(), 'repeat');
  if (pat) {
    c.globalAlpha = 0.22;
    c.fillStyle = pat;
    c.fillRect(-W / 2, -H, W, H);
    c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';
  // band 2 (bandRect(2) in xrayColumn): a dim strip, then three rows of small knobs lighting left to right
  const r = { x: -W / 2 + 18, y: -22 - 50 - 50 + 6, w: W - 36, h: 42 };
  const C = MOODS.serverCyan;
  const cyan = mixLab(C.core, MOODS.candleAmber.core, 0.35);
  const ink = mixLab(C.ink, C.set, 0.3);
  c.fillStyle = withAlpha(mixLab(C.set, MOODS.candleAmber.set, 0.4), 0.55);
  c.fillRect(r.x, r.y, r.w, r.h);
  if (bandU > 0) {
    // the strip warms up behind the knobs, sweeping left to right with them
    const sw = r.w * Math.min(1, bandU * 1.1);
    const sg = c.createLinearGradient(r.x, 0, r.x + sw + 30, 0);
    sg.addColorStop(0, withAlpha(cyan, 0.34 * L * breath));
    sg.addColorStop(Math.max(0, sw / (sw + 30)), withAlpha(cyan, 0.3 * L * breath));
    sg.addColorStop(1, withAlpha(cyan, 0));
    c.fillStyle = sg;
    c.fillRect(r.x, r.y, Math.min(r.w, sw + 30), r.h);
  }
  // each element is the knob CLUE in miniature (the potentiometer pinned on C1-b two seconds earlier): a fluted
  // knob, its arc of ticks and a pointer, set at its own angle (the adjustable weights); 2 rows of 11, lighting
  // left to right
  const cols = 11, rows = 2;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const kx = r.x + 6 + (i + 0.5) * ((r.w - 12) / cols) + (j % 2 ? 3 : 0), ky = r.y + 11 + j * 20;
      const on = clamp01((bandU * (cols + 4) - i - j * 0.6) / 3);
      const ang = -0.9 + hash1(i * 7 + j * 31, 77) * 2.0;
      // the tick arc
      c.strokeStyle = on > 0 ? withAlpha(mixLab(cyan, ink, 0.3), 0.5 + 0.5 * on * L) : withAlpha(ink, 0.8);
      c.lineWidth = 0.8;
      c.beginPath();
      for (let q = 0; q < 7; q++) {
        const a = Math.PI * (0.75 + (1.5 * q) / 6);
        c.moveTo(kx + Math.cos(a) * 5.8, ky + Math.sin(a) * 5.8);
        c.lineTo(kx + Math.cos(a) * 7, ky + Math.sin(a) * 7);
      }
      c.stroke();
      // the fluted knob
      c.fillStyle = ink;
      c.beginPath();
      c.arc(kx, ky, 4.3, 0, Math.PI * 2);
      for (let q = 0; q < 8; q++) {
        const a = (q / 8) * Math.PI * 2;
        c.moveTo(kx + Math.cos(a) * 4.3 + 1, ky + Math.sin(a) * 4.3);
        c.arc(kx + Math.cos(a) * 4.3, ky + Math.sin(a) * 4.3, 1, 0, Math.PI * 2);
      }
      c.fill();
      if (on > 0) {
        const hg = c.createRadialGradient(kx, ky, 0, kx, ky, 9);
        hg.addColorStop(0, withAlpha(mixLab(cyan, '#ffffff', 0.35), 0.55 * on * L * breath));
        hg.addColorStop(1, withAlpha(cyan, 0));
        c.fillStyle = hg;
        c.fillRect(kx - 9, ky - 9, 18, 18);
      }
      // the pointer: always there (pale), catching the light as the knob lights
      c.strokeStyle = on > 0 ? withAlpha(mixLab(cyan, '#ffffff', 0.3), (0.55 + 0.45 * breath) * Math.max(0.35, on * L)) : withAlpha(mixLab(C.set, '#ffffff', 0.2), 0.45);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(kx, ky);
      c.lineTo(kx + Math.cos(ang) * 3.6, ky + Math.sin(ang) * 3.6);
      c.stroke();
    }
  c.restore();
}

/** a thread of light pin to pin, drawn on progressively (u) and fading (a) */
function lightThread(c: C, env: PaintEnv, p: { x: number; y: number }, q: { x: number; y: number }, u: number, a: number, bendX = 0) {
  if (u <= 0 || a <= 0) return;
  const mx = (p.x + q.x) / 2 + bendX, my = (p.y + q.y) / 2 + Math.hypot(q.x - p.x, q.y - p.y) * 0.08;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const n = 24;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n * u; i++) {
    const s = i / n;
    pts.push({ x: (1 - s) * (1 - s) * p.x + 2 * (1 - s) * s * mx + s * s * q.x, y: (1 - s) * (1 - s) * p.y + 2 * (1 - s) * s * my + s * s * q.y });
  }
  for (const [lw, al] of [[6, 0.08], [2.4, 0.24], [1, 0.7]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, al * a);
    c.lineWidth = lw;
    c.beginPath();
    pts.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
    c.stroke();
  }
  // the travelling bead of light at the drawing end
  if (u < 1 && pts.length) {
    const h = pts[pts.length - 1];
    const g = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, 14);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * a));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(h.x - 14, h.y - 14, 28, 28);
  }
  c.restore();
}

/** Q1 on the oxblood thread, with a slow sway */
function questionCard(c: C, env: PaintEnv, bx: number, text: string, t: number) {
  const k = STUDY.board.k;
  const qx = STUDY.board.x + bx * k;
  const qy = STUDY.board.y + BOARD.threadY * k + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * k;
  const sway = 0.03 * Math.sin(t * 1.5 + 0.4) + 0.01 * Math.sin(t * 3.3);
  c.save();
  c.translate(qx, qy);
  c.rotate(sway);
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * k;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 10 * k);
  c.stroke();
  drawCard(c, { id: 'Q-Q1', w: 168, h: 44, icon: 'question', text }, { x: 0, y: 32 * k, k, light: Math.max(0.55, poolAt(POOL, bx, BOARD.threadY + 40)), pin: false }, env);
  c.restore();
}
