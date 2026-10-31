/**
 * ch02-s04 — the first belief candle is lit, and the Edge of the Light is established (candleAmber, 15.96 s).
 *
 * CAMERA: SHELF (a low macro along the candle shelf beneath the Case Board), then the push into the flame
 * onto the paper stage.
 *   'light' (light)       the detective's hands strike a match and light the first candle at the far left
 *                         of the shelf: THE BRAIN IS A LOGIC MACHINE, tag 1943, flame on the top ring.
 *                         The label rises over the shot (a paraphrase, never in quotation marks).
 *   'candle' (intoFlame)  a quick push into the flame's brightness (never to black) — we arrive on the
 *                         paper stage, close on the same flame, huge, and pull back down its wax.
 *   'held' (holders)      the pool of light swells across the floor: McCulloch and Pitts stand in it, facing
 *                         the flame (believers stand in the light), their shadows thrown behind them.
 *   'held' + .5 (rimRule) the camera drifts to the dark edge of the pool and finds it empty, waiting.
 *                         (The candle-clock is running: one ring per year, 1943 → 1950, the flame sinking
 *                         ring by ring as the ghost sleeve grows above it.)
 *   'logic' (thisOne)     the lettering on the huge candle catches the flame; the label returns.
 *   line end + .3         a row of anonymous lab coats passes far behind, outside the pool, heads front.
 *   'Gerard'              Ralph Gerard is found at the rim, half in shadow, FACING OUT, his long shadow
 *                         thrown away from the candle; name card.
 *   'dial' (dialSwitch)   a paper-cut dial beside his raised hand sweeps smoothly through every value;
 *                         beside McCulloch a little toggle switch flicks between its two positions.
 */
import { Timeline, ease } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, blendPose, createPuppet, defineShot, mixLab, pose, walkCycle, withAlpha, withLife } from '../../../film';
import type { Camera3, PaintEnv, Pose, PuppetSpec } from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, STUDY_CAMS, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt, LIT_HEIGHT } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { STAGE, candleStage, floorShadow, stageGeo, type StageGeo } from '../sets/candleStage';
import { handsEntry } from '../sets/narratorHands';
import { shelfSlotX } from '../sets/beliefCandle';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';

type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
function mixCam(a: Camera3, b: Camera3, u: number): Camera3 {
  const sa = (1000 * a.lens) / (1000 - a.z), sb = (1000 * b.lens) / (1000 - b.z);
  const s = Math.exp(lerp(Math.log(sa), Math.log(sb), u));
  const lens = Math.exp(lerp(Math.log(a.lens), Math.log(b.lens), u));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - (1000 * lens) / s, lens };
}

// ------------------------------------------------------------------------------------------------ the shelf
const VIEWS_END = shelfStateAt('ch02-s04', 'end');
const LOGIC = VIEWS_END.find((v) => v.id === 'logic')!;
const SHELF_X = candleX(VIEWS_END, 'logic');
const SHELF_FLAME = candleFlame({ x: SHELF_X, y: STUDY.shelf.y, view: LOGIC, s: STUDY.shelf.s });
// (framed low enough that the long shelf plank runs along the bottom of frame: the first of a row). Revised: the
// candle sits right of centre, so the match hand's forearm enters from the right at ~25° and the sleeve leaves the
// frame ~300 px from the hand (no sleeve diagonal through the lower-right quarter)
const CAM_SHELF0: Camera3 = { ...STUDY_CAMS.shelf(SHELF_X - 150), y: STUDY.shelf.y - 128, z: 400 };
const CAM_SHELF1: Camera3 = { x: SHELF_X - 118, y: STUDY.shelf.y - 150, z: 500, lens: 1 };
/** the match hand's entry: far off up-right along a ~25° line from the flame */
const ARM_ANG = (25 * Math.PI) / 180;
const MATCH_ENTRY = { x: SHELF_FLAME.x + 1100 * Math.cos(ARM_ANG), y: SHELF_FLAME.y - 1100 * Math.sin(ARM_ANG) };
const CAM_FLAME: Camera3 = { x: SHELF_FLAME.x, y: SHELF_FLAME.y - 6, z: 900, lens: 1.4 };
const SHELF_CAMS = [CAM_SHELF0, CAM_SHELF1, STUDY_CAMS.board];

// ------------------------------------------------------------------------------------------------ the stage
const CX = STAGE.candleX;
const MC_X = CX - 150; // holders: left of the candle, facing it (right)
const PITTS_X = CX - 268;
const BURN_YEARS = 7; // 1943 → 1950 (Gerard's year) on the candle-clock, one ring per year
/** Gerard's mark: just inside the rim, so the pool's edge falls across his front and feet (half in shadow) */
const RIM_X = (geo: StageGeo) => geo.rimX - 50;

/** anonymous lab coats (generic, never real people) for the far row */
const COATS: PuppetSpec[] = [
  { id: 'coat-a', height: 318, build: 'average', era: '1950s', wardrobe: 'labCoat', hair: 'crewCut', glasses: 'browline' },
  { id: 'coat-b', height: 306, build: 'slight', era: '1950s', wardrobe: 'labCoat', hair: 'sidePart' },
  { id: 'coat-c', height: 326, build: 'tall', era: '1950s', wardrobe: 'labCoat', hair: 'receding', glasses: 'round' },
  { id: 'coat-d', height: 300, build: 'average', era: '1950s', wardrobe: 'labCoat:f', hair: 'bun' },
];
const COAT_P = COATS.map((s) => createPuppet(s));

const GERARD_DOUBT: Pose = POSES.doubt;
/** 'dial': the forearm raised from a bent elbow, the open palm turned up under the dial (presenting, not saluting) */
const GERARD_RAISE: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 4, head: -6, shoulderF: 40, elbowF: 52, wristF: -28, shoulderB: -16, elbowB: 40 }, { handF: 'open', handB: 'fist' });
const MC_SHOW: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 1, neck: 7, head: -4, shoulderF: 30, elbowF: 64, wristF: -16, shoulderB: -9, elbowB: 12 }, { handF: 'open' });

interface Beats {
  light: number;
  into: number;
  held: number;
  rim: number;
  logic: number;
  passers: number;
  gerard: number;
  dial: number;
  /** 'burning': the candle-clock starts (the ghost sleeve grows from here) */
  burnAt: number;
  /** end of 'machine': the far row starts to pass */
  machineEnd: number;
  D: number;
}

export default defineShot({
  id: 'ch02-s04',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      light: T.beat('light'),
      into: T.beat('intoFlame'),
      held: T.beat('holders'),
      rim: T.beat('rimRule'),
      logic: T.beat('thisOne'),
      passers: T.beat('passers'),
      gerard: T.beat('gerard'),
      dial: T.beat('dialSwitch'),
      burnAt: T.word('L0209', 'burning') - 0.05,
      machineEnd: T.wordEnd('L0209', 'machine'),
      D: T.duration,
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = twos(t);
    const b = scene.b;
    const CUT = b.into + 0.48; // the brightness peak: the shelf gives way to the stage
    // the bright pass: rises through the push into the flame, peaks at CUT, falls as the stage pulls back
    const flash = t < CUT ? sm((t - (b.into - 0.15)) / 0.63) : 1 - sm((t - CUT) / 0.75);
    const tenv = { t, mood: f.mood, seed: 4 };

    if (t < CUT) {
      // ============================================================ SHELF: the match, the first candle
      const strikeDur = 1.6;
      const s0 = b.light - 0.36 * strikeDur;
      const u = clamp01((tq - s0) / strikeDur);
      const caught = u >= 0.6 ? 1 : 0;
      const flameK = caught ? Math.min(1, 0.55 + sm((tq - (s0 + 0.6 * strikeDur)) / 0.3) * 0.45) : 0;
      let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / (b.into - 0.05)));
      if (t > b.into - 0.15) cam = mixCam(cam, CAM_FLAME, sm((t - (b.into - 0.15)) / 0.63));
      f.camera(cam);
      studyRoom(f, { key: 'ch02-s04', cams: SHELF_CAMS });
      const entry = { ...handsEntry(cam, 'L4'), R: MATCH_ENTRY };
      const len = 118 * 0.56;
      const act = u > 0 && u < 1 ? hands.act('strikeLight', u, SHELF_FLAME, { entry, scale: 0.56, strikeAt: { x: SHELF_FLAME.x + len * 0.95, y: SHELF_FLAME.y + len * 0.28 } }) : null;
      // one hand only: the match hand (the matchbox hand's crossing diagonal read as an easel)
      const pose = act ? { ...act, left: undefined } : null;
      studyCase(f, {
        shot: 'ch02-s04',
        when: 'start',
        key: 'ch02-s04',
        shelf: { hideUnlit: false, only: ['logic'], over: { logic: { flame: flameK, letters: 0 } }, drawFlames: false },
        extra: (c, env) => {
          // the empty places along the long shelf: a faint scorch ring and a paper tag-hook at every slot,
          // waiting (this is the first candle of a row)
          shelfSlots(c, env);
          waxCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: LOGIC, s: STUDY.shelf.s, flame: flameK, letters: 0.75 }, env);
          if (pose) hands.draw(c, pose, env);
        },
      });
      const fl = pose ? hands.flameAt(pose) : null;
      if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 1943, intensity: 0.85, radius: 34 });
      if (cam.z < 560) studyNear(f, { key: 'ch02-s04', cams: SHELF_CAMS, file: true });
    } else {
      // ============================================================ STAGE: the edge of the light
      // the candle-clock runs from 'burning': one ring per year, a steady clock (linear), 1943 → 1950 by Gerard
      const burn = BURN_YEARS * clamp01((t - b.burnAt) / (b.gerard - 0.2 - b.burnAt));
      const poolK = 0.62 + 0.38 * sm((t - (b.held - 0.35)) / 0.6);
      const geo = stageGeo({ candle: LOGIC, burn, pool: poolK });
      const flameY = geo.flame.y;
      const C0: Camera3 = { x: CX, y: flameY + 18, z: 820, lens: 1 };
      // the close holds on the flame (a slow drift back) while the sleeve starts to grow; the pull-back to the
      // holders begins at 4.3 and reveals them on 'held'
      const C0b: Camera3 = { x: CX + 6, y: flameY + 30, z: 730, lens: 1 };
      const CW: Camera3 = { x: 600, y: 360, z: -40, lens: 1 };
      // the rim drift: a 120 px truck right (and a touch in) from the rim beat to 8.0 s, so the frame's right
      // third holds the pool's cut edge, empty, waiting
      const TRUCK = { dx: 120, dz: 80 };
      const CR: Camera3 = { x: CW.x + TRUCK.dx, y: 360, z: CW.z + TRUCK.dz, lens: 1 };
      const CE: Camera3 = { x: 704, y: 360, z: -30, lens: 1 };
      let cam: Camera3;
      const PB0 = b.held - 1.28, PB1 = b.held + 0.95;
      if (t < b.gerard + 1.4) {
        if (t < PB0) cam = mixCam(C0, C0b, sm((t - CUT) / (PB0 - CUT)));
        else if (t < PB1) cam = mixCam(C0b, CW, sm((t - PB0) / (PB1 - PB0)));
        else cam = { ...CW };
        const tu = ease.move(clamp01((t - (b.rim + 0.02)) / (8.0 - b.rim)));
        cam = { ...cam, x: cam.x + TRUCK.dx * tu, z: cam.z + TRUCK.dz * tu };
      } else cam = mixCam(CR, CE, sm((t - (b.gerard + 1.4)) / 2.2));
      f.camera(cam);
      const gerardAt = b.gerard - 0.12;
      const rimLight = sm((t - gerardAt) / 0.55);
      const lettersK = 0.75 + 0.25 * sm((t - (b.logic - 0.15)) / 0.4);
      const catchGlow = sm((t - (b.logic - 0.15)) / 0.35) * (1 - sm((t - (b.logic + 1.1)) / 1.0));
      const gx = RIM_X(geo);
      const camS = (1000 * cam.lens) / (1000 - cam.z);
      const gerardPose = withLife(blendPose(GERARD_DOUBT, GERARD_RAISE, sm((tq - (b.dial - 0.35)) / 0.5)), tq, 1950, 0.9);
      // on 'dial' McCulloch raises his forearm, palm up, under his switch (Gerard's gesture, mirrored in kind)
      const mcPose = withLife(blendPose(POSES.listen, MC_SHOW, 0.85 * sm((tq - (b.dial - 0.1)) / 0.5)), tq, 1943, 0.9);
      const pittsPose = withLife(POSES.listen, tq, 1923, 0.8);
      candleStage(f, {
        key: 'ch02-s04',
        cams: [C0, CW, CR, CE],
        candle: LOGIC,
        burn,
        flame: 1,
        pool: poolK,
        letters: 0,
        back: (c, env) => {
          // a warm patch of backdrop behind the rim, where Gerard will be found (the doubter's own light)
          if (rimLight > 0.01) {
            const g = c.createRadialGradient(gx, 380, 20, gx, 380, 360);
            g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.25), 0.7 * rimLight));
            g.addColorStop(1, withAlpha(env.mood.setHaze, 0));
            c.fillStyle = g;
            c.fillRect(gx - 360, 20, 720, 720);
          }
          // the far row: lab coats passing far behind, BEYOND the rim (never in the pool), heads front; they
          // start after 'machine' and are gone into the haze as Gerard is found
          const p0 = b.machineEnd - 0.05;
          const pa = sm((t - p0) / 0.35) * (1 - sm((t - (b.gerard - 0.1)) / 0.45));
          if (pa > 0.01) {
            // (revised: ~25% contrast against the fog-B band, so the beat registers: a darker ink than the haze)
            c.save();
            c.globalAlpha *= pa * 0.9;
            const coatInk = mixLab(env.fill('ink'), env.mood.fg, 0.55);
            COAT_P.forEach((p, i) => {
              const w = walkCycle(p.spec, { x0: 1150 + i * 92, facing: 'right', start: p0, cadence: 1.1, scale: 0.42 })(t);
              p.draw(c, { x: w.x, y: 500, facing: 'right', pose: w.pose, scale: 0.42, ink: coatInk }, env);
            });
            c.restore();
          }
          // the paper theatre's inner arch, far back in the dark: a third readable plane (L3, hazed) that the
          // camera's drift slides against the figures
          f.cached(`ch02-s04/arch/${env.mood.id}`, ARCH.w, ARCH.h, (cc) => {
            cc.translate(-ARCH.x, -ARCH.y);
            innerArch(cc, env);
          })(c, ARCH.x, ARCH.y);
        },
        draw: (c, env, g) => {
          // the candle as wax, with the clock's year marks (lit year at the sleeve's lip, the year now at the flame)
          // in the close-up on the flame the belief is lettered ON the wax just under the lit top (it gives way to
          // the vertical lettering as the camera pulls back)
          const bandK = 1 - sm((t - (b.held - 1.0)) / 0.9);
          waxCandle(c, { x: g.candleX, y: g.floorY, view: LOGIC, s: STAGE.s, burn, flame: 1, letters: lettersK * (1 - 0.7 * bandK), band: bandK, years: { size: 30 / camS } }, env);
          // the lettering catches the flame
          if (catchGlow > 0.01) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            const top = g.floorY - LIT_HEIGHT * STAGE.s;
            const gr = c.createLinearGradient(0, g.flame.y, 0, g.floorY);
            gr.addColorStop(0, withAlpha(env.mood.core, 0.45 * catchGlow));
            gr.addColorStop(1, withAlpha(env.mood.halo, 0.08 * catchGlow));
            c.fillStyle = gr;
            c.fillRect(g.candleX - 34 * 1.1, Math.max(top, g.flame.y), 68 * 1.1, g.floorY - Math.max(top, g.flame.y));
            c.restore();
          }
          // the pool's cut-paper rim on the floor: a crisp ~40 px falloff (a PLACE to stand on), the dark beyond it
          poolRim(c, env, g);
          // shadows on the floor, away from the candle: the holders' behind them, Gerard's out past the rim
          const mcDraw = (cc: C2) => cast.mcculloch.draw(cc, { x: 0, y: 0, facing: 'right', pose: mcPose }, env);
          const pDraw = (cc: C2) => cast.pitts.draw(cc, { x: 0, y: 0, facing: 'right', pose: pittsPose }, env);
          floorShadow(c, g, MC_X, mcDraw, env, 0.9);
          floorShadow(c, g, PITTS_X, pDraw, env, 0.8);
          // Gerard's long shadow, thrown right (out, away from the flame), darker than the floor, >= 200 px
          if (t >= gerardAt) longShadow(c, g, gx, (cc) => cast.gerard.draw(cc, { x: 0, y: 0, facing: 'right', pose: gerardPose, ink: '#000' }, env), env);
          cast.pitts.draw(c, { x: PITTS_X, y: g.floorY, facing: 'right', pose: pittsPose, cutLines: true }, env);
          cast.mcculloch.draw(c, { x: MC_X, y: g.floorY, facing: 'right', pose: mcPose, cutLines: true }, env);
          // facing OUT (right, away from the candle) from his first frame; the candle rims his back
          if (t >= gerardAt) cast.gerard.draw(c, { x: gx, y: g.floorY, facing: 'right', pose: gerardPose, cutLines: true, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -1, y: -0.4, px: 1.6, alpha: 0.75 } }, env);
          // the two images, side by side: a sweeping dial by Gerard's raised hand, a flicking switch by McCulloch's
          const dk = sm((t - (b.dial - 0.05)) / 0.4);
          if (dk > 0.01) {
            const gh = cast.gerard.anchor({ x: gx, y: g.floorY, facing: 'right', pose: gerardPose }, 'handF');
            // a matched pair at hand height: the dial just above Gerard's open palm, the switch just above
            // McCulloch's, the same size and both lit (a smooth sweep vs. two positions, on twos)
            dial(c, gh.x + 18, gh.y - 58, PAIR_R, t - b.dial, dk, env);
            const mh = cast.mcculloch.anchor({ x: MC_X, y: g.floorY, facing: 'right', pose: mcPose }, 'handF');
            toggle(c, Math.min(mh.x + 12, g.candleX - 34 - PAIR_R - 6), mh.y - 58, PAIR_R, tq - b.dial, dk, env);
          }
        },
      });
    }

    // the bright pass over the cut (additive amber, never black)
    if (flash > 0.002) {
      const c = f.c;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const P = f.mood;
      const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
      g.addColorStop(0, withAlpha(P.core, 0.95 * flash));
      g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.85 * flash));
      g.addColorStop(1, withAlpha(P.halo, 0.6 * flash));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // (no screen-locked header: in the close-up the belief is lettered ON the wax; on 'brain' / 'logic' the kit's
    // candle-naming card names the candle beside its flame — the film-wide rule, one label only)
    nameCardLg(f.c, { name: 'Ralph Gerard', role: 'neurophysiologist', years: '1950', align: 'right', x: 1228, y: 560, at: b.gerard + 0.05, dur: b.D - b.gerard + 0.4 }, tenv);
  },
});

/** the dial and the switch: one size, so the pair reads in a glance */
const PAIR_R = 44;

/** the inner arch far back on L3: two dark flats and a shallow arch with a fringe of cut tassels (paper theatre) */
const ARCH = { x: -260, y: -160, w: 1900, h: 980 };
function innerArch(c: C2, env: PaintEnv) {
  const P = env.mood;
  const outer = new Path2D();
  outer.rect(ARCH.x, ARCH.y, ARCH.w, ARCH.h);
  // the opening: from x 70 to 1250, a shallow elliptical head peaking at y 30, springing at y 150
  const L = 70, R = 1250, spring = 150, crown = 30;
  outer.moveTo(L, ARCH.y + ARCH.h);
  outer.lineTo(L, spring);
  outer.ellipse((L + R) / 2, spring, (R - L) / 2, spring - crown, 0, Math.PI, 0);
  outer.lineTo(R, ARCH.y + ARCH.h);
  outer.closePath();
  c.fillStyle = env.fill('ink');
  c.fill(outer, 'evenodd');
  // the flats' inner edge catches the candle (a thin warm rim on the cut)
  c.strokeStyle = withAlpha(mixLab(P.rim, P.halo, 0.4), 0.3);
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(L + 1, ARCH.y + ARCH.h);
  c.lineTo(L + 1, spring);
  c.ellipse((L + R) / 2, spring, (R - L) / 2 - 1, spring - crown - 1, 0, Math.PI, 0);
  c.lineTo(R - 1, ARCH.y + ARCH.h);
  c.stroke();
  // a fringe of short cut tassels hanging under the arch's head
  c.fillStyle = env.fill('ink');
  for (let i = 0; i <= 48; i++) {
    const a = Math.PI + (Math.PI * i) / 48;
    const x = (L + R) / 2 + Math.cos(a) * ((R - L) / 2 - 2);
    const y = spring + Math.sin(a) * (spring - crown - 2);
    c.beginPath();
    c.moveTo(x - 6, y - 1);
    c.lineTo(x + 6, y - 1);
    c.lineTo(x + 2, y + 16);
    c.lineTo(x - 2, y + 16);
    c.closePath();
    c.fill();
  }
}

/** the pool's cut edge on the floor: outside a crisp ~40 px soft edge the boards fall dark; a thin lit cut-line
 *  on the edge's far side (the paper's cut catching the flame) */
function poolRim(c: C2, env: PaintEnv, g: StageGeo) {
  const P = env.mood;
  const fy = g.floorY;
  const R = g.poolRx * 0.97;
  const ry = STAGE.poolRy / Math.max(1, g.poolRx);
  c.save();
  c.beginPath();
  c.rect(-2000, fy - 5, 6000, 2000);
  c.clip();
  c.translate(g.poolX, fy + 14);
  c.scale(1, ry);
  const edge = 40;
  const gr = c.createRadialGradient(0, 0, 0, 0, 0, R + edge / 2);
  gr.addColorStop(0, withAlpha(P.fg, 0));
  gr.addColorStop((R - edge / 2) / (R + edge / 2), withAlpha(P.fg, 0));
  gr.addColorStop(1, withAlpha(P.fg, 0.55));
  c.fillStyle = gr;
  c.beginPath();
  c.rect(-4000, -4000 / ry, 8000, 8000 / ry);
  c.fill();
  c.restore();
  // the lit cut-line on the rim (back half of the ellipse: the far edge, where the light ends)
  c.save();
  c.beginPath();
  c.rect(-2000, fy - 5, 6000, 2000);
  c.clip();
  c.translate(g.poolX, fy + 14);
  c.scale(1, ry);
  c.strokeStyle = withAlpha(mixLab(P.halo, P.rim, 0.5), 0.35);
  c.lineWidth = 1.6;
  c.beginPath();
  c.ellipse(0, 0, R, R, 0, Math.PI * 1.02, Math.PI * 1.98);
  c.stroke();
  c.restore();
}

/** a figure's long shadow thrown out past the rim (stronger and broader than the kit's sliver), clipped to the floor */
function longShadow(c: C2, g: StageGeo, feetX: number, draw: (c: C2) => void, env: PaintEnv) {
  c.save();
  c.beginPath();
  c.rect(-2000, g.floorY - 2, 6000, 2000);
  c.clip();
  c.globalAlpha *= 0.62;
  c.translate(feetX, g.floorY + 2);
  c.filter = 'blur(1.5px)';
  // figure-up → along the floor to the right (~0.95 of its height), figure-x → a broad depth sliver
  c.transform(0, 0.3, -0.95, -0.12, 0, 0);
  draw(c);
  c.restore();
  void env;
}

/** the empty places along the shelf: a faint scorch ring and a tag-hook at each slot after the first */
function shelfSlots(c: C2, env: PaintEnv) {
  const o = { ...STUDY.shelf, views: VIEWS_END };
  const sh = STUDY.shelf.s;
  c.save();
  for (const v of VIEWS_END) {
    if (v.id === 'logic') continue;
    const x = shelfSlotX(o, v.slot);
    c.fillStyle = withAlpha(env.mood.fg, 0.55);
    c.beginPath();
    c.ellipse(x, STUDY.shelf.y + 0.5 * sh, 17 * sh, 2.6 * sh, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.22);
    c.lineWidth = 1 * sh;
    c.beginPath();
    c.moveTo(x - 10 * sh, STUDY.shelf.y + 4 * sh);
    c.lineTo(x - 10 * sh, STUDY.shelf.y + 11 * sh);
    c.stroke();
  }
  c.restore();
}

/** a paper-cut dial: ink ring with ticks, a needle sweeping smoothly through every value (on ones) */
function dial(c: C2, x: number, y: number, r: number, dt: number, a: number, env: PaintEnv) {
  const P = env.mood;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.fillStyle = P.ink;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  // the face: a lit window in the card (backlight shows through), an arc of fine ticks
  c.fillStyle = mixLab(P.halo, P.rim, 0.4);
  c.beginPath();
  c.arc(0, 0, r * 0.82, Math.PI * 1.05, Math.PI * 1.95);
  c.arc(0, 0, r * 0.28, Math.PI * 1.95, Math.PI * 1.05, true);
  c.closePath();
  c.fill();
  c.strokeStyle = P.ink;
  c.lineWidth = 1.2;
  for (let i = 0; i <= 12; i++) {
    const ang = Math.PI * (1.05 + (0.9 * i) / 12);
    const r0 = r * (i % 3 === 0 ? 0.58 : 0.68);
    c.beginPath();
    c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
    c.lineTo(Math.cos(ang) * r * 0.8, Math.sin(ang) * r * 0.8);
    c.stroke();
  }
  // the needle: sweeps smoothly back and forth through the whole range
  const u = 0.5 - 0.5 * Math.cos(Math.max(0, dt) * 1.9);
  const ang = Math.PI * (1.08 + 0.84 * u);
  c.strokeStyle = P.ink;
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(ang) * r * 0.78, Math.sin(ang) * r * 0.78);
  c.stroke();
  c.fillStyle = P.ink;
  c.beginPath();
  c.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** a paper-cut toggle switch the same size as the dial: an ink disc with a LIT face (the dial's twin), two marks
 *  only (on / off), and a lever that snaps between them on twos (0.4 s period) */
function toggle(c: C2, x: number, y: number, r: number, dtq: number, a: number, env: PaintEnv) {
  const P = env.mood;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.fillStyle = P.ink;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  // the lit face, the same window as the dial's
  c.fillStyle = mixLab(P.halo, P.rim, 0.4);
  c.beginPath();
  c.arc(0, 0, r * 0.82, Math.PI * 1.05, Math.PI * 1.95);
  c.arc(0, 0, r * 0.28, Math.PI * 1.95, Math.PI * 1.05, true);
  c.closePath();
  c.fill();
  // two marks only, at the two ends of the throw
  const on = Math.floor(Math.max(0, dtq) / 0.2 + 1e-6) % 2 === 0;
  const angOn = Math.PI * 1.28, angOff = Math.PI * 1.72;
  c.strokeStyle = P.ink;
  c.lineWidth = 3;
  for (const ang of [angOn, angOff]) {
    c.beginPath();
    c.moveTo(Math.cos(ang) * r * 0.52, Math.sin(ang) * r * 0.52);
    c.lineTo(Math.cos(ang) * r * 0.8, Math.sin(ang) * r * 0.8);
    c.stroke();
  }
  // the lever: a stout bat handle, snapped to one mark or the other
  const ang = on ? angOn : angOff;
  c.lineCap = 'round';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(ang) * r * 0.72, Math.sin(ang) * r * 0.72);
  c.stroke();
  c.beginPath();
  c.arc(Math.cos(ang) * r * 0.72, Math.sin(ang) * r * 0.72, r * 0.12, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
