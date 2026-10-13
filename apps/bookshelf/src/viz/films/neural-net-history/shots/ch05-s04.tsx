/**
 * ch05-s04 — 9 October 1986: THE MESSENGER. The deep dive's heart: on a loom of lanterns light flows up,
 * the error glows, and the messenger runs back down tugging each knob by its share of the blame; again and
 * again, until our exclusive-or puzzle solves itself; and the sterile candle goes out.
 *
 *   iris (0.9)     opens on a journal strip pinned to the loom beam; NATURE · 9 OCT 1986 (VT323)
 *   'Rumelhart'    Rumelhart at his chalkboard (left), then Hinton seated at his desk (right), catch the light
 *   'Light'        x = (1, 0), target 1: light climbs from the inputs through the hidden pair to the output
 *   'checked'      the target slip (1 0 → 1) lifts beside the output lantern
 *   'error'        the gap glows: a low-chroma ember ring on the output
 *   'messenger'    a dark bead in a ring of light leaves the output and runs DOWN the same strings; on each
 *                  string it pauses at the knob (the string swells by |dL/dw|; the knob turns toward −dL/dw);
 *                  at each hidden lantern it gathers the blame (a ring sized by |blame(j)|) and splits
 *   'blame'        the rule inks in on a small parchment card
 *   'Again'        the stamp fades; the lamp falls on the breast beam's lettering ('the 1986 method, on
 *                  exclusive-or · a demonstration'); training scrubs 0 → 1500 epochs at an ever-faster
 *                  cadence, four samples cycling, the loss readout falling
 *   'solved'       XOR check: the four cases in turn (0.8 s each), each target slip ticking as it is matched
 *   +2.8 / +3.3    wordless: two identical family trees drop in; six hidden lanterns between them tint the
 *                  people by nationality, then by generation; the abstract's fragment rises as a quote card
 *   'sterile'      the camera pulls back and down: the loom hangs at the rim of the sterile candle's pool
 *   'seventeen'    the candle goes out: a seventeen-ring sleeve gone dark, a thread of smoke, 1969–1986 · 17
 *
 * The machine is real: XOR_221 (mlp.ts), its forward pass, its true per-sample gradients, its training run.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, PoseTrack, chair, chalkboard, defineShot, mixLab, pose, quoteCard, seatHeight, toLayer, toScreen, withAlpha, withLife, writingDesk, POSES } from '../../../film';
import { XOR_221 } from '../../../film';
import { cast } from '../cast';
import { candleStage, floorShadow } from '../sets/candleStage';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { candleNamingAt, shelfStateAt, type CandleView } from '../sets/studyState';
import { stageLip } from '../sets/ch03-s06-kit';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { LOOM, SLIPS, equationCard, equationCardSize, familyTrees, loomFrame, loomNet, targetSlips } from '../sets/ch05-s04-loom';
import { camKeys, clamp01, lerp, phosphorStamp, sm, tq12, win } from '../sets/ch05-s01-kit';

const ID = 'ch05-s04';
const START = shelfStateAt(ID, 'start').find((v) => v.id === 'sterile')!;
const ENDV = shelfStateAt(ID, 'end').find((v) => v.id === 'sterile')!;
const CANDLE_X = 250;
const CANDLE_S = 2.1;
const FIG_S = 0.66;
const RUM_X = 650;
const BOARD_X = 566;
const HIN_X = 1452;
const DESK_X = 1372;
const EPOCHS = XOR_221.epochs;

// ------------------------------------------------------------------ poses
const RUM_WRITE: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 4, neck: 2, head: 0, shoulderF: 112, elbowF: 34, wristF: 10, shoulderB: -6, elbowB: 22 }, { handF: 'grip' });
const RUM_TURN: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 6, head: -6, shoulderF: 46, elbowF: 46, wristF: -24, shoulderB: -8, elbowB: 16 }, { handF: 'open' });
const RUM_WATCH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -2, neck: 6, head: -10, shoulderF: -12, elbowF: 30, wristF: 4, shoulderB: -16, elbowB: 26 }, { handF: 'fist', handB: 'fist' });
const HIN_SIT: Pose = { ...POSES.sit, angles: { ...POSES.sit.angles, torso: 6, neck: 14, head: 10, shoulderF: 30, elbowF: 70, wristF: 4, shoulderB: 22, elbowB: 72, wristB: 6 }, handF: 'grip', handB: 'relaxed' };
const HIN_UP: Pose = { ...POSES.sit, angles: { ...POSES.sit.angles, torso: -2, neck: 4, head: -12, shoulderF: 22, elbowF: 74, wristF: 6, shoulderB: 18, elbowB: 76, wristB: 6 }, handF: 'relaxed', handB: 'relaxed' };

const CHAIR_S = (() => {
  const seat = seatHeight(cast['hinton-young'].spec, POSES.sit) * FIG_S;
  const a = chair.anchors({ x: 0, y: 0, s: 1, style: 'wooden', view: 'side' }).seat;
  return Math.max(0.4, Math.min(1.8, seat / Math.max(1, -a.y)));
})();

interface Beats {
  stamp: number;
  authors: number;
  hinton: number;
  forward: number;
  check: number;
  error: number;
  messenger: number;
  blame: number;
  train: number;
  xor: number;
  family: number;
  features: number;
  quote: number;
  sterile: number;
  out: number;
  share: number;
  solved: number;
  pull: number;
  /** the tugs, made visible: upper knobs on the first 'lantern', lower knobs on the second */
  tugTop: number;
  tugLow: number;
  /** the bead gathers at the hidden lanterns (between the two tugs) */
  gather: number;
  /** the rule inks in: the gather (lines 1-2), then the tug (lines 3-4) */
  ink: number[];
  /** the push-in on the messenger: framed close from push1 to pullFrom */
  pullFrom: number;
  /** the backward pass, keyed: [t, back] (holds = the pauses) */
  backKeys: [number, number][];
  caseDur: number;
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  rum: PoseTrack;
  hin: PoseTrack;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

function piecewise(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, sm((t - t0) / Math.max(1e-6, t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const m0 = T.beat('messenger');
    const blame = T.beat('blame');
    const runs = T.word('L0508', 'runs');
    const lan1 = T.word('L0508', 'lantern');
    const lan2 = T.word('L0508', 'lantern#2');
    const gather = (lan1 + lan2) / 2;
    const b: Beats = {
      stamp: T.beat('stamp'),
      authors: T.beat('authors'),
      hinton: T.word('L0507', 'Hinton'),
      forward: T.beat('forward'),
      check: T.beat('check'),
      error: T.beat('error'),
      messenger: m0,
      blame,
      train: T.beat('train'),
      xor: T.beat('xor'),
      family: T.beat('family'),
      features: T.beat('features'),
      quote: T.beat('quote'),
      sterile: T.beat('sterile'),
      out: T.beat('out'),
      share: T.word('L0508', 'share'),
      solved: T.word('L0509', 'solved'),
      pull: T.beat('family') - 1.6,
      tugTop: lan1,
      tugLow: lan2,
      gather,
      // the gather rule inks in as the bead gathers; the tug rule under 'tugging each knob … share of the blame'
      ink: [gather - 0.1, gather + 0.75, T.word('L0508', 'tugging') - 0.05, T.word('L0508', 'share') - 0.1],
      pullFrom: T.beat('train') + 0.5,
      // the bead forms at the output on 'messenger' and waits; on 'runs' it sets off down the strings:
      // the upper knobs on 'lantern' (tug), the hidden pair (gather), the lower knobs on 'lantern' (tug), the inputs
      backKeys: [
        [m0 - 0.05, 0],
        [m0 + 0.35, 0.02],
        [runs, 0.02],
        [lan1 - 0.12, 0.5],
        [lan1 + 0.1, 0.5],
        [gather + 0.04, 1.0],
        [gather + 0.1, 1.0],
        [lan2 - 0.12, 1.5],
        [lan2 + 0.2, 1.5],
        [lan2 + 0.75, 2.0],
      ],
      caseDur: 0.8,
    };
    const rum = new PoseTrack(tl, 'rumelhart.pose', RUM_WRITE, 'left', 0.5);
    rum.loop('write', { at: 0.6, dur: Math.max(0.5, b.forward - 0.9) });
    rum.flip(b.forward - 0.2, 'right');
    rum.to(RUM_TURN, { at: b.forward - 0.15, dur: 0.45, force: true });
    rum.to(RUM_WATCH, { at: b.check + 0.4, dur: 0.6 });
    const hin = new PoseTrack(tl, 'hinton.pose', HIN_SIT, 'left', 0.5);
    hin.loop('write', { at: 0.6, dur: Math.max(0.5, b.hinton - 0.8) });
    hin.to(HIN_UP, { at: b.hinton + 0.15, dur: 0.5 });
    const cx = LOOM.cx;
    // the push-in (review round 1): from the error to the messenger the camera dollies in and trucks right,
    // so the network fills ~65-70% of the frame height at the left and the rule's card hangs beside it
    // the opening: close on the clipping with the output and hidden pair whole below it (the inputs out of frame,
    // never cut by the edge); then a settle back to the WHOLE loom, inputs and breast beam in, before 'Light'
    const cam = camKeys([
      [0, LOOM.strip.x + 40, 150, 300],
      [1.4, LOOM.strip.x + 60, 160, 290],
      [4.6, cx, 318, 120],
      [b.forward, cx, 314, 150],
      [b.error + 0.3, cx + 6, 313, 192],
      [b.messenger + 1.9, cx + 138, 297, 262],
      [b.pullFrom, cx + 146, 297, 272],
      [b.pullFrom + 2.6, cx, 316, 172],
      [b.xor + 3.0, cx, 318, 165],
      [b.pull + 1.9, cx - 4, 312, 12],
      // the trees tint (nationality, then generation) in this framing; then the pull back and down onto the
      // candle stage: the candle settles a third of the way in from the left, its pool and the stage lip below
      [b.features + 0.7, cx - 26, 311, 0],
      [b.sterile + 1.8, 612, 300, -400],
      [b.out + 0.6, 578, 298, -490],
      [D, 572, 298, -506],
    ]);
    tl.hold(0, D);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) CAMS.push(cam((D * i) / 24));
    return { tl, b, D, rum, hin, cam, CAMS };
  },
  paint(f, _s, sc, ctx) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);

    // ------------------------------------------------------------ the machine's state at t
    let epoch = 0;
    let x = [1, 0];
    let y: number | undefined = 1;
    let wave = 0;
    let back = 0;
    let error = 0;
    let readout = 0;
    let labels = win(t, 4.0, 5.5);
    const nudged: [number, number] = [0, 0];
    const lift = [0, 0, 0, 0];
    const tick = [0, 0, 0, 0];
    const hot = [0, 0, 0, 0];
    let hiddenHold = 0;
    // the tug marks hold from each tug until the training starts; the gathered blame rings likewise
    const keep = 1 - win(t, b.train - 0.1, b.train + 0.4);
    const tugs: [number, number] = [win(t, b.tugLow - 0.12, b.tugLow + 0.12) * keep, win(t, b.tugTop - 0.12, b.tugTop + 0.12) * keep];
    const gathered = win(t, b.gather, b.gather + 0.2) * keep;
    if (t < b.train) {
      // one sample, by hand: forward, check, error, messenger
      wave = 2 * clamp01((t - b.forward + 0.15) / 2.55);
      lift[2] = win(t, b.check - 0.2, b.check + 0.4) * (1 - win(t, b.train, b.train + 0.5));
      error = win(t, b.error - 0.1, b.error + 0.35);
      back = piecewise(b.backKeys, t);
      nudged[1] = win(t, b.tugTop - 0.12, b.tugTop + 0.1);
      nudged[0] = win(t, b.tugLow - 0.12, b.tugLow + 0.2);
      if (back >= 2) error *= 1 - win(t, b.blame - 0.25, b.blame + 0.4);
    } else if (t < b.xor) {
      // training: four samples cycling at an ever-faster cadence; the weights follow the real run
      const T = b.xor - b.train;
      const u = clamp01((t - b.train) / T);
      epoch = EPOCHS * Math.pow(u, 2.3);
      const phi = 1.3 * (t - b.train) + 3.2 * T * Math.pow(u, 3);
      const k = Math.floor(phi) % 4;
      const fr = phi - Math.floor(phi);
      x = SLIPS[k].x;
      y = SLIPS[k].y;
      wave = 2 * clamp01(fr / 0.5);
      back = fr > 0.5 ? 2 * clamp01((fr - 0.5) / 0.45) : 0;
      error = 0.45 * (1 - u) * (fr > 0.45 && fr < 0.6 ? 1 : 0);
      readout = win(t, b.train, b.train + 0.4);
      lift[2] = 1 - win(t, b.train, b.train + 0.5);
      hot[k] = 0.5 * (1 - u);
    } else {
      // the XOR check: the trained network answers all four cases, then holds (1, 1)
      epoch = EPOCHS;
      const k = Math.min(3, Math.floor((t - b.xor) / b.caseDur));
      const fr = (t - b.xor - k * b.caseDur) / b.caseDur;
      x = SLIPS[k].x;
      y = undefined;
      wave = 2 * clamp01(fr / 0.38);
      readout = 1 - win(t, b.family - 1.0, b.family - 0.4);
      for (let j = 0; j < 4; j++) {
        const at = b.xor + j * b.caseDur + 0.42;
        tick[j] = win(t, at, at + 0.15);
        hot[j] = j === k && t < b.xor + 4 * b.caseDur ? 1 : 0;
        lift[j] = j === k && t < b.xor + 4 * b.caseDur ? 0.18 * Math.sin(Math.PI * clamp01(fr)) : 0;
      }
      labels = 1 - win(t, b.family - 1.0, b.family - 0.4);
      hiddenHold = win(t, b.family - 0.6, b.family + 0.4) * 0.5;
    }
    // the candle: one more ring burns during the pull-back, then out on 'seventeen'
    const burn = clamp01((t - b.sterile) / (b.out - b.sterile)) * Math.max(0, (ENDV.rings ?? 17) - START.rings);
    const snuff = b.out - 0.35;
    const fOut = t < snuff ? 1 : Math.max(0, 1 - (t - snuff) / 0.4) * (0.75 + 0.25 * Math.sin((t - snuff) * 40));
    const isOut = t >= b.out + 0.05;
    // the kit's naming card (on 'candle') builds its date line from the tag ('lit 1969 · out 1986 · 17 years'):
    // the base tag turns to its full range only once that card has gone, so the card never reads it twice
    const naming = (candleNamingAt(ID, ctx.timing, t).sterile ?? 0) > 0;
    const view: CandleView = isOut ? { ...ENDV, tag: naming ? ENDV.tag : '1969–1986 · 17', smoke: true } : { ...START };
    const burnNow = isOut ? 0 : burn;

    candleStage(f, {
      key: ID,
      cams: sc.CAMS,
      candle: view,
      candleX: CANDLE_X,
      s: CANDLE_S,
      burn: burnNow,
      flame: fOut,
      pool: 1.0,
      letters: 0,
      rimDir: { x: -0.6, y: -1 },
      back: (c, env) => {
        // the loom's paper screen (L3): a tall sheet behind the machine, warmed where the lanterns glow
        const m = env.mood;
        const x0 = 318, x1 = 1560, y0 = 36, y1 = 590;
        f.cached(`${ID}/screen2/${m.id}`, x1 - x0, y1 - y0, (cc) => {
          const g = cc.createRadialGradient((x1 - x0) * 0.5, (y1 - y0) * 0.4, 30, (x1 - x0) * 0.5, (y1 - y0) * 0.45, (x1 - x0) * 0.62);
          g.addColorStop(0, mixLab(m.set, m.setHaze, 0.55));
          g.addColorStop(0.55, mixLab(m.set, m.fg, 0.22));
          g.addColorStop(1, mixLab(m.set, m.fg, 0.55));
          cc.fillStyle = g;
          cc.fillRect(0, 0, x1 - x0, y1 - y0);
          // a dim high window in the back wall, seen through the haze (depth: the room beyond the screen)
          const wx = 150, wy = 40, ww = 104, wh = 250;
          const wp = new Path2D();
          wp.moveTo(wx, wy + wh);
          wp.lineTo(wx, wy + ww / 2);
          wp.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
          wp.lineTo(wx + ww, wy + wh);
          wp.closePath();
          const wg = cc.createLinearGradient(0, wy, 0, wy + wh);
          wg.addColorStop(0, mixLab(m.setHaze, m.haze, 0.6));
          wg.addColorStop(1, mixLab(m.setHaze, m.halo, 0.35));
          cc.fillStyle = wg;
          cc.fill(wp);
          cc.save();
          cc.clip(wp);
          cc.fillStyle = mixLab(m.set, m.fg, 0.3);
          cc.fillRect(wx + ww / 2 - 2, wy, 4, wh);
          for (let k = 1; k < 4; k++) cc.fillRect(wx, wy + ww / 2 + k * 48, ww, 3);
          cc.restore();
          // its light falling as a soft shaft down the screen
          cc.save();
          cc.globalAlpha = 0.08;
          cc.fillStyle = m.halo;
          cc.beginPath();
          cc.moveTo(wx, wy + wh);
          cc.lineTo(wx + ww, wy + wh);
          cc.lineTo(wx + ww + 160, y1 - y0);
          cc.lineTo(wx + 90, y1 - y0);
          cc.closePath();
          cc.fill();
          cc.restore();
          cc.strokeStyle = withAlpha(m.fg, 0.25);
          cc.lineWidth = 1.2;
          for (let k = 1; k < 8; k++) {
            cc.beginPath();
            cc.moveTo(((x1 - x0) * k) / 8, 0);
            cc.lineTo(((x1 - x0) * k) / 8, y1 - y0);
            cc.stroke();
          }
          cc.fillStyle = env.fill('ink');
          cc.fillRect(0, 0, x1 - x0, 7);
          cc.fillRect(0, y1 - y0 - 5, x1 - x0, 5);
        })(c, x0, y0);
      },
      draw: (c, env, geo) => {
        const m = env.mood;
        // the candle's broad pool on the stage floor (the ch05-s03 stage), dying with the flame
        {
          const PX = 560, PY = 72;
          c.save();
          c.translate(geo.candleX, geo.floorY + 12);
          c.scale(1, PY / PX);
          const pg = c.createRadialGradient(0, 0, 10, 0, 0, PX);
          pg.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.3), 0.7 * fOut));
          pg.addColorStop(0.45, withAlpha(m.halo, 0.36 * fOut));
          pg.addColorStop(0.85, withAlpha(mixLab(m.setHaze, m.halo, 0.4), 0.2 * fOut));
          pg.addColorStop(1, withAlpha(m.set, 0));
          c.fillStyle = pg;
          c.beginPath();
          c.arc(0, 0, PX, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        // the wax over the shared candle; its years marked once the camera has pulled back
        const camS = 1000 / (1000 - cam.z);
        waxCandle(c, { x: geo.candleX, y: geo.floorY, view, s: CANDLE_S, burn: burnNow, flame: fOut, letters: 0.7, years: { size: 13.5 / camS, alpha: win(t, b.sterile + 1.6, b.sterile + 2.6) } }, env);
        // Rumelhart at his chalkboard (left), on twos
        const rs = sc.rum.sample(t);
        const ro = { x: RUM_X, y: geo.floorY, facing: rs.facing, pose: withLife(rs.pose, tq, 1986, 0.8), scale: FIG_S, light: { x: -0.6, y: -1, floor: 0.25 } };
        chalkboard(c, { x: BOARD_X, y: geo.floorY, s: FIG_S, w: 120, h: 84, stand: 'easel' }, env);
        const bA = chalkboard.anchors({ x: BOARD_X, y: geo.floorY, s: FIG_S, w: 120, h: 84, stand: 'easel' });
        c.save();
        c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
        c.lineWidth = 1.2;
        for (let k = 0; k < 4; k++) {
          const yy = lerp(bA.areaTL.y, bA.areaBR.y, 0.22 + k * 0.18);
          const w = (bA.areaBR.x - bA.areaTL.x) * (0.5 + 0.3 * ((k * 7) % 3) / 2) * clamp01((t - 0.6) / 4 - k * 0.15);
          c.beginPath();
          c.moveTo(bA.areaTL.x + 8, yy);
          c.lineTo(bA.areaTL.x + 8 + w, yy);
          c.stroke();
        }
        c.restore();
        floorShadow(c, geo, RUM_X, (cc) => cast.rumelhart.draw(cc, { ...ro, x: 0, y: 0 }, env), env, 0.8);
        const rimR = authorRim(t, b.authors);
        if (rimR > 0.01) drawRimmed(c, env, rimR, (e2, dx, dy) => cast.rumelhart.draw(c, { ...ro, x: ro.x + dx, y: ro.y + dy, cutLines: false }, e2));
        cast.rumelhart.draw(c, ro, env);
        // Hinton seated at his desk (right), facing the loom
        const hs = sc.hin.sample(t);
        chair(c, { x: HIN_X + 26, y: geo.floorY, s: CHAIR_S, style: 'wooden', view: 'side', flip: true }, env);
        const ho = { x: HIN_X, y: geo.floorY, facing: 'left' as const, pose: withLife(hs.pose, tq, 1987, 0.8), scale: FIG_S, light: { x: -0.6, y: -1, floor: 0.25 } };
        const rimH = authorRim(t, b.hinton);
        if (rimH > 0.01) drawRimmed(c, env, rimH, (e2, dx, dy) => cast['hinton-young'].draw(c, { ...ho, x: ho.x + dx, y: ho.y + dy, cutLines: false }, e2));
        cast['hinton-young'].draw(c, ho, env);
        writingDesk(c, { x: DESK_X, y: geo.floorY, s: FIG_S * 1.05, w: 100 }, env);
        // the loom and its network
        loomFrame(c, env, { lettering: win(t, b.train - 0.1, b.train + 0.6), strip: 1 - win(t, b.train, b.train + 0.8) * 0.4 });
        // while the family demonstration plays, the XOR network steps back to ~0.4 (two machines, never tangled);
        // after 'seventeen' its trained lanterns come back up a little, softly lit above the stub
        const loomA = 1 - 0.6 * win(t, b.family - 0.3, b.family + 0.4) + 0.2 * win(t, b.out + 0.2, b.out + 1.2);
        c.save();
        c.globalAlpha *= loomA;
        targetSlips(c, { lift, tick, hot, t }, env);
        loomNet(c, { epoch, x, y, wave, back, error, nudged, labels, readout, hiddenHold, dim: 0, tugs, gathered, knobR: 9 + 2.5 * win(t, b.messenger, b.messenger + 1.5) * keep }, env);
        c.restore();
        // the family trees (the paper's own demonstration), dropped in on threads once the check is done
        familyTrees(
          c,
          {
            drop: win(t, b.family, b.family + 0.7),
            nat: win(t, b.features, b.features + 0.45) * (1 - win(t, b.features + 1.0, b.features + 1.5)),
            gen: win(t, b.features + 1.0, b.features + 1.5),
            net: win(t, b.features - 0.3, b.features + 0.3),
            t,
            lx: 600,
            rx: 1400,
            y: 236,
            // the ending belongs to the card and the stub: after 'seventeen' the trees and their net fall back
            alpha: 1 - 0.72 * win(t, b.out + 0.1, b.out + 0.9),
          },
          env,
        );
      },
    });
    // the near drape's valance along the top edge (L5, blurred): depth before the pull-back, easing away
    const postA = 1 - win(t, b.pull, b.pull + 2.4);
    if (postA > 0.01)
      f.layer('L5', (c, env) => {
        const top = toLayer(LAYERS.L5, cam, 0, -40).y;
        const bot = toLayer(LAYERS.L5, cam, 0, 22).y;
        const L = toLayer(LAYERS.L5, cam, -60, 0).x;
        const R = toLayer(LAYERS.L5, cam, 1340, 0).x;
        const sc0 = (bot - top) * 0.32;
        c.save();
        c.globalAlpha *= postA;
        c.fillStyle = env.fill('fg');
        c.beginPath();
        c.moveTo(L, top);
        c.lineTo(R, top);
        c.lineTo(R, bot);
        const pitch = 120;
        for (let x = Math.ceil(R / pitch) * pitch; x > L - pitch; x -= pitch) c.quadraticCurveTo(x - pitch / 2, bot + sc0, x - pitch, bot);
        c.closePath();
        c.fill();
        c.restore();
      });
    // the stage's near lip, set forward so the floor (and the candle's pool on it) reads in the wide pull-back
    stageLip(f, sc.CAMS, ID, 800);
    // vignette: the lanterns are the light; the corners fall to ink
    {
      const c = f.c;
      const g = c.createRadialGradient(640, 330, 220, 640, 360, 820);
      g.addColorStop(0, withAlpha(f.mood.ink, 0));
      g.addColorStop(0.55, withAlpha(f.mood.ink, 0.22));
      g.addColorStop(1, withAlpha(f.mood.ink, 0.62));
      c.save();
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // the authors catching the light in turn as they are named (a warm wash behind each, then settling)
    for (const [who, at, wx, wy] of [
      ['r', b.authors, RUM_X, 520],
      ['h', b.hinton, HIN_X - 30, 560],
    ] as const) {
      const k = (0.35 + 0.65 * authorRim(t, at)) * win(t, at - 0.15, at + 0.2) * (1 - 0.6 * win(t, at + 1.2, at + 2.6)) * (1 - win(t, b.pull, b.pull + 2));
      if (k > 0.01) {
        const p = toScreen(LAYERS.L4, cam, wx, wy);
        const c = f.c;
        c.save();
        const R = 150 * p.k;
        const g = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, R);
        g.addColorStop(0, withAlpha(f.mood.halo, 0.42 * k));
        g.addColorStop(1, withAlpha(f.mood.halo, 0));
        c.globalCompositeOperation = 'screen';
        c.fillStyle = g;
        c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
        c.restore();
      }
      void who;
    }
    // the lanterns' light on the stage (the output's practical; hidden lanterns soft)
    const outP = LOOM.units[2][0];
    if (wave > 1.8 || hiddenHold > 0) f.practical({ x: outP.x, y: outP.y, kind: 'lamp', seed: 1986, intensity: 0.12, radius: 30 });

    // ------------------------------------------------------------ type
    const tenv = { t, mood: f.mood, seed: 1986 };
    phosphorStamp(f.c, { place: 'NATURE', date: '9 OCT 1986', year: 1986, at: Math.max(0.6, b.stamp - 0.1), until: b.train + 0.2, fade: 0.3 }, tenv);
    nameCardLg(f.c, { name: 'David Rumelhart', role: 'with Hinton & Williams', x: 64, y: 66, align: 'left', at: b.authors, dur: 3.8 }, tenv);
    // the rule, large, hung beside the loom in the push-in: the gather (as the bead gathers at the hidden
    // pair), then the tug (under 'tugging each knob by its share of the blame'); gone as the camera pulls back
    {
      // two lines, each rule whole on its line; the plate ~15% wider than the old four-line card
      const tallW = equationCardSize(f.c, 40).w;
      const w40 = equationCardSize(f.c, 40, true).w;
      const EQ = Math.min(40, (40 * (1.15 * tallW - 40)) / (w40 - 40));
      const sz = equationCardSize(f.c, EQ, true);
      const x0 = Math.min(1236 - sz.w, 860);
      const y0 = 236;
      // the paper fades in WITH the ink (no blank plate ahead of the first stroke)
      const a = win(t, b.ink[0] - 0.02, b.ink[0] + 0.3) * (1 - win(t, b.pullFrom - 0.2, b.pullFrom + 0.5));
      if (a > 0.003) {
        // the card's thread up out of frame (it hangs, like the slips)
        const c = f.c;
        c.save();
        c.globalAlpha = a;
        c.strokeStyle = f.mood.ink;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x0 + sz.w / 2, y0);
        c.lineTo(x0 + sz.w / 2 + 6, -10);
        c.stroke();
        c.restore();
      }
      equationCard(f.c, {
        x: x0,
        y: y0,
        alpha: a,
        wide: true,
        size: EQ,
        reveal: [clamp01((t - b.ink[0]) / 0.7), clamp01((t - b.ink[1]) / 0.7), clamp01((t - b.ink[2]) / 0.55), clamp01((t - b.ink[3]) / 0.6)],
        mood: f.mood,
      });
    }
    // in as the trees tint (its first line by the beat), riding the pull-back to settle just right of the stub's
    // smoke, high in the dark above the candle
    const qy = lerp(84, 92, win(t, b.sterile, b.sterile + 3.6));
    const qx = lerp(478, 462, win(t, b.sterile, b.sterile + 3.6));
    quoteCard(f.c, { quote: '…come to represent important features of the task domain', speaker: 'Nature, 1986', x: qx, y: qy, width: 520, maxChars: 34, size: 27, at: b.quote - 0.4, stagger: 0.3 }, tenv);
  },
});

/** an author catching the light as named: up fast, held ~0.8 s, then down to a trace */
function authorRim(t: number, at: number) {
  return win(t, at - 0.1, at + 0.15) * (1 - 0.8 * win(t, at + 0.9, at + 1.5));
}
/** a rim of light on the candle-facing (upper-left) edge: the figure drawn in rim colour, nudged toward the light, under the ink */
function drawRimmed(c: CanvasRenderingContext2D, env: PaintEnv, k: number, draw: (env: PaintEnv, dx: number, dy: number) => void) {
  const col = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), Math.min(1, 0.9 * k));
  const e2 = { ...env, fill: () => col };
  draw(e2, -1.6, -1.2);
}
