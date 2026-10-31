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
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, PoseTrack, cardPaperAlpha, placeStamp, chair, chalkboard, defineShot, mixLab, paintContext, pose, quoteCard, seatHeight, setPaintContext, textRole, toLayer, toScreen, withAlpha, withLife, writingDesk, POSES } from '../../../film';
import { XOR_221 } from '../../../film';
import { cast } from '../cast';
import { candleStage, floorShadow } from '../sets/candleStage';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { shelfStateAt, type CandleView } from '../sets/studyState';
import { namedLabelStaged } from '../sets/ch05-s04-namedCard';
import { stageLip } from '../sets/ch03-s06-kit';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { LOOM, SLIPS, equationCard, equationCardSize, familyTrees, loomFrame, loomLettering, loomNet, targetSlips } from '../sets/ch05-s04-loom';
import { candleFlame } from '../sets/beliefCandle';
import { camKeys, clamp01, lerp, sm, tq12, win } from '../sets/ch05-s01-kit';

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
  /** 'not' (L0521): the trees stay whole in frame until here */
  not: number;
  /** the generation tint (after >= 1.6 s of nationality) */
  gen: number;
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
    const tugging = T.word('L0508', 'tugging');
    // (review r2) the tugs are slow enough to SEE the knobs turn: the bead reaches the upper knobs just before
    // 'lantern' and turns them over ~0.45 s; it reaches the hidden lanterns on the second 'lantern' and gathers;
    // it reaches the lower knobs just before 'tugging' and turns them over ~0.45 s
    const tugTop = lan1 - 0.1;
    const gather = lan2 - 0.05;
    const tugLow = Math.max(gather + 0.45, tugging - 0.3);
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
      not: T.word('L0521', 'not'),
      // (review r4) nationality from just before 'features', generation in by ~35.0 and held through the first
      // second of the pull-back (the trees stay whole in frame to ~36.6)
      gen: T.beat('features') + 0.7,
      tugTop,
      tugLow,
      gather,
      // the gather rule inks in as the bead gathers; the tug rule under 'tugging each knob … share of the blame'
      // (review r3) the card arrives with 'blame(i) = slope(i) ·' already inked by 'lantern' (20.37): its first line
      // starts 0.5 s before the word and dries in 0.45 s; the Σ line follows on the gather at the hidden pair
      ink: [lan1 - 0.5, gather + 0.75, tugging - 0.05, T.word('L0508', 'share') - 0.1],
      pullFrom: T.beat('train') + 0.5,
      // the bead forms at the output on 'messenger' and waits; on 'runs' it sets off down the strings:
      // the upper knobs on 'lantern' (tug), the hidden pair (gather), the lower knobs on 'lantern' (tug), the inputs
      backKeys: [
        [m0 - 0.05, 0],
        [m0 + 0.35, 0.02],
        [runs, 0.02],
        [tugTop - 0.02, 0.5],
        [tugTop + 0.5, 0.5],
        [gather, 1.0],
        [gather + 0.2, 1.0],
        [tugLow - 0.02, 1.5],
        [tugLow + 0.55, 1.5],
        [tugLow + 1.1, 2.0],
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
      // (review r2) from the messenger to the blame the loom fills ~70% of the frame height (k ~1.56 at z 360:
      // output crown to input tassels ~330 layer px -> ~515 screen px), set left so the rule's card hangs at right
      [b.error - 1.2, cx + 40, 316, 232],
      [b.messenger + 0.7, cx + 98, 320, 352],
      [b.pullFrom, cx + 102, 320, 372],
      // (review r4) the training framing sits a little lower so the lettering board on the top beam is in frame
      [b.pullFrom + 2.6, cx, 312, 172],
      [b.xor + 3.0, cx, 314, 165],
      // (review r1 layout) the family framing sits a little higher in the frame so the loom's top beam drops clear of
      // the quote card's attribution
      [b.pull + 1.9, cx - 4, 280, 12],
      // the trees tint (nationality, then generation) in this framing; then the pull back and down onto the
      // candle stage. (review r1 sync) the pull-back first dollies OUT, centred between the trees, so both trees stay
      // whole in frame until 'not' and the generation tint reads during it; only then does it settle left onto the
      // candle, a third of the way in, its pool and the stage lip below
      [b.features + 0.7, cx - 20, 280, 0],
      [b.sterile - 0.1, cx - 40, 284, -24],
      // (review r4 timing) the first second of the pull-back is a centred dolly OUT: both trees stay whole in frame
      // with their generation bands until ~36.6; only then does it pan left onto the candle
      [b.sterile + 1.2, cx - 66, 290, -150],
      [b.not + 0.5, 702, 302, -340],
      [b.out + 0.6, 590, 298, -462],
      [D, 576, 298, -500],
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
    const tugs: [number, number] = [win(t, b.tugLow - 0.05, b.tugLow + 0.35) * keep, win(t, b.tugTop - 0.05, b.tugTop + 0.35) * keep];
    const gathered = win(t, b.gather, b.gather + 0.2) * keep;
    if (t < b.train) {
      // one sample, by hand: forward, check, error, messenger
      wave = 2 * clamp01((t - b.forward + 0.15) / 2.55);
      lift[2] = win(t, b.check - 0.2, b.check + 0.4) * (1 - win(t, b.train, b.train + 0.5));
      error = win(t, b.error - 0.1, b.error + 0.35);
      back = piecewise(b.backKeys, t);
      // the knob turns over ~0.45 s while the bead waits on it
      nudged[1] = win(t, b.tugTop, b.tugTop + 0.45);
      nudged[0] = win(t, b.tugLow, b.tugLow + 0.45);
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
    // (review r2 legibility) the candle is NAMED from 'sterile extension' (not only on 'candle'): this shot drives the
    // naming rule itself, one continuous horizontal label from 'extension' (as the pull-back brings the candle into
    // frame) through 'seventeen years'; the kit's own naming (on 'candle') is held off so it never reads twice
    // (review r1) in once the pull-back has brought the flame into frame (mid 'extension')
    // (review r1 sync) the card lands on 'not' (the verdict): until then the family trees, whole in frame beside the
    // candle, hold the space the card would cover; the taper's own lettering names the candle meanwhile
    // (review r4 hold) after the date line has inked it stays up, dimmed to 60 %, through the hold: the last frame still
    // says '17 years' while the quote card is read
    const nameK = win(t, b.not - 0.1, b.not + 0.25) * (1 - 0.4 * win(t, b.out + 1.3, b.out + 1.8));
    const naming = nameK > 0;
    void ctx;
    const view: CandleView = isOut ? { ...ENDV, tag: naming ? ENDV.tag : '1969–1986 · 17', smoke: true } : { ...START };
    const burnNow = isOut ? 0 : burn;

    const pc = paintContext();
    setPaintContext(null);
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
        f.cached(`${ID}/screen4/${m.id}`, x1 - x0, y1 - y0, (cc) => {
          const g = cc.createRadialGradient((x1 - x0) * 0.5, (y1 - y0) * 0.4, 30, (x1 - x0) * 0.5, (y1 - y0) * 0.45, (x1 - x0) * 0.62);
          g.addColorStop(0, mixLab(m.set, m.setHaze, 0.55));
          g.addColorStop(0.55, mixLab(m.set, m.fg, 0.22));
          g.addColorStop(1, mixLab(m.set, m.fg, 0.55));
          cc.fillStyle = g;
          cc.fillRect(0, 0, x1 - x0, y1 - y0);
          // a dim high window in the back wall, seen through the haze (depth: the room beyond the screen)
          const wx = 150, wy = 40, ww = 104, wh = 140;
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
          cc.fillRect(wx, wy + ww / 2 + 40, ww, 3);
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
        // the vertical lettering is texture (a narrow taper in the wide); the named label below is what is read
        textRole(c, 'texture', () => waxCandle(c, { x: geo.candleX, y: geo.floorY, view, s: CANDLE_S, burn: burnNow, flame: fOut, letters: 0.7 * (1 - nameK), years: { size: 13.5 / camS, alpha: win(t, b.sterile + 1.6, b.sterile + 2.6) } }, env));
        // (review r1 sync) the card's date line reads only 'lit 1969' while the candle burns; '· out 1986 · 17 years'
        // inks in on 'seventeen'
        // (review r4) the card hangs LEFT of the candle, clear of the sleeve, so the dark 17-ring sleeve and its smoke
        // are unobstructed from 'seventeen' to the end
        if (nameK > 0) namedLabelStaged(c, { x: geo.candleX, y: geo.floorY, view: { ...view, tag: START.tag }, s: CANDLE_S, burn: burnNow, named: nameK, ending: win(t, b.out - 0.1, b.out + 0.4), side: 'left', clear: 48, wrap: 17 }, env);
        // (review r4) the snuffed wick's thread of smoke, readable in the hold: ~2.5 px, ~50 %, a slow drift on twos
        if (isOut) {
          const fl = candleFlame({ x: geo.candleX, y: geo.floorY, view, s: CANDLE_S, burn: 0 });
          const camK = 1000 / (1000 - cam.z);
          const rise = clamp01((t - b.out) / 1.4);
          const H = 210 * rise;
          const tq2 = tq;
          c.save();
          c.lineCap = 'round';
          const N = 26;
          for (let k = 0; k < N; k++) {
            const u0 = k / N, u1 = (k + 1) / N;
            if (u1 * 210 > H) break;
            const px = (u: number) => fl.x + Math.sin(u * 7.5 - tq2 * 1.3) * (2 + 16 * u * u) + 6 * u * Math.sin(tq2 * 0.4);
            c.strokeStyle = withAlpha(mixLab(m.haze, m.core, 0.5), 0.56 * (1 - 0.85 * u0));
            c.lineWidth = (2.6 - 0.8 * u0) / camK;
            c.beginPath();
            c.moveTo(px(u0), fl.y - 4 - u0 * 210);
            c.lineTo(px(u1), fl.y - 4 - u1 * 210);
            c.stroke();
          }
          c.restore();
        }
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
        if (rimR > 0.01) {
          // a double pass: his rim reads against the window's wash as clearly as Hinton's against the dark
          drawRimmed(c, env, rimR, (e2, dx, dy) => cast.rumelhart.draw(c, { ...ro, x: ro.x + dx * 1.5, y: ro.y + dy * 1.5, cutLines: false }, e2));
          drawRimmed(c, env, rimR, (e2, dx, dy) => cast.rumelhart.draw(c, { ...ro, x: ro.x + dx, y: ro.y + dy, cutLines: false }, e2));
        }
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
        // (review r1 ending) after 'seventeen' the breast beam's lettering falls back (the card and the stub hold the frame)
        loomFrame(c, env, { lettering: 0, strip: (1 - win(t, b.train, b.train + 0.8) * 0.4) * (1 - 0.5 * win(t, b.family - 0.3, b.family + 0.4)) });
        // (review r4) the demonstration's prop lettering rides the TOP beam: in shadow until 'Again', lit through the
        // scrub and the XOR check, then flown out on its lines as the family trees fly in
        const flyAt = b.xor + 4 * b.caseDur + 0.1;
        loomLettering(c, env, { lit: win(t, b.train - 0.1, b.train + 0.6), fly: clamp01((t - flyAt) / 1.1) });
        // while the family demonstration plays, the XOR network steps back to ~0.4 (two machines, never tangled);
        // after 'seventeen' its trained lanterns come back up a little, softly lit above the stub
        // (review r4) the XOR net steps back to ~30 % while the family demonstration plays
        const loomA = 1 - 0.7 * win(t, b.family - 0.3, b.family + 0.4) + 0.25 * win(t, b.out + 0.2, b.out + 1.2);
        c.save();
        c.globalAlpha *= loomA * (1 - 0.6 * win(t, b.out + 0.1, b.out + 0.9));
        targetSlips(c, { lift, tick, hot, t }, env);
        c.restore();
        c.save();
        c.globalAlpha *= loomA;
        loomNet(c, { epoch, x, y, wave, back, error, nudged, labels, readout, hiddenHold, dim: 0, tugs, gathered, knobR: 9 + 5 * win(t, b.messenger, b.messenger + 1.5) * keep, share: win(t, b.share - 0.15, b.share + 0.2) * (1 - win(t, b.blame + 0.55, b.blame + 0.95)) }, env);
        c.restore();
        // the family trees (the paper's own demonstration), dropped in on threads once the check is done
        // (review r4) the trees hang in the clear thirds outside the posts (below the high window, above the authors),
        // the six-lantern net on its own lower bar between them
        familyTrees(
          c,
          {
            drop: win(t, b.family - 0.3, b.family + 0.5),
            nat: win(t, b.features - 0.25, b.features + 0.2) * (1 - win(t, b.gen, b.gen + 0.45)),
            gen: win(t, b.gen, b.gen + 0.45),
            net: win(t, b.features - 0.4, b.features + 0.2),
            t,
            trees: [
              { x: 552, y: 238 },
              { x: 1440, y: 238 },
            ],
            // the ending belongs to the card and the stub: after 'seventeen' the trees and their net fall back
            alpha: 1 - 0.9 * win(t, b.out + 0.1, b.out + 0.9),
          },
          env,
        );
      },
    });
    setPaintContext(pc);
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
    // (review r1 depth) through the push-in a near drape leg (L5, blurred) stands at the lower-left edge, so the dolly
    // shows three planes sliding: the drape, the loom, the paper screen behind it
    const legA = win(t, b.messenger - 0.7, b.messenger + 0.5) * (1 - win(t, b.pullFrom - 0.1, b.pullFrom + 0.9));
    if (legA > 0.01) nearLeg(f, sc.cam(b.messenger + 0.7), legA);
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

    // (review r1) through the push-in Hinton's corner falls to ink: he sits beyond the edge of the light, so the
    // close framing never slices a lit figure at the frame edge (he returns as the camera pulls back)
    const shade = win(t, b.error - 1.0, b.messenger + 0.3) * (1 - win(t, b.pullFrom + 0.2, b.pullFrom + 1.6));
    if (shade > 0.01) {
      const c = f.c;
      c.save();
      c.translate(1290, 735);
      c.scale(1.25, 1);
      const g = c.createRadialGradient(0, 0, 40, 0, 0, 330);
      g.addColorStop(0, withAlpha(f.mood.ink, 0.96 * shade));
      g.addColorStop(0.55, withAlpha(f.mood.ink, 0.8 * shade));
      g.addColorStop(1, withAlpha(f.mood.ink, 0));
      c.fillStyle = g;
      c.fillRect(-340, -340, 680, 680);
      c.restore();
    }
    // the authors catching the light in turn as they are named (a warm wash behind each, then settling)
    // (review r1) Rumelhart's pulse matches Hinton's: he stands in the window's wash, so his pool is a step stronger
    // and a little wider to read as the same 'catching the light'
    for (const [who, at, wx, wy, gain, rad] of [
      ['r', b.authors, RUM_X - 6, 500, 0.62, 175],
      ['h', b.hinton, HIN_X - 30, 560, 0.42, 150],
    ] as const) {
      const k = (0.35 + 0.65 * authorRim(t, at)) * win(t, at - 0.15, at + 0.2) * (1 - 0.6 * win(t, at + 1.2, at + 2.6)) * (1 - win(t, b.pull, b.pull + 2));
      if (k > 0.01) {
        const p = toScreen(LAYERS.L4, cam, wx, wy);
        const c = f.c;
        c.save();
        const R = rad * p.k;
        const g = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, R);
        g.addColorStop(0, withAlpha(f.mood.halo, gain * k));
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
    // (review r1) typed in as the iris opens (from ~1.2 s), quickly, so the stamp beat shows the date
    nameCardLg(f.c, { name: 'David Rumelhart', role: 'with Hinton & Williams', x: 64, y: 66, align: 'left', at: b.authors, dur: 3.8 }, tenv);
    // the rule, large, hung beside the loom in the push-in: the gather (as the bead gathers at the hidden
    // pair), then the tug (under 'tugging each knob by its share of the blame'); gone as the camera pulls back
    {
      // (review r2) the card is the TALL four-line card, ~1.6x the old cap height, filling the gap between the
      // pushed-in loom (left two thirds) and the frame's right safe edge: at most 420 px wide
      // (review r1) three lines, the tug rule whole on one line; the card ~40 px wider (460) to carry it
      const w40 = equationCardSize(f.c, 40).w;
      const EQ = Math.min(48, (40 * (460 - 40)) / (w40 - 40));
      const sz = equationCardSize(f.c, EQ);
      // (review r4) right edge pulled in to x <= 1200 (1800 at 1080p), inside the action-safe margin
      const x0 = 1194 - sz.w;
      // (review r4) pulled in to x <= 1200 it hangs higher, between the slips and the lower knobs' +/- signs
      const y0 = Math.min(Math.max(150, 372 - sz.h / 2), 424 - sz.h);
      // (review r3, kit card-entry rule) the card is lowered into the right third on its thread and arrives WITH its
      // first stroke: the paper passes 30 % two frames before the gather rule starts inking (b.ink[0], on the
      // bead's gather after 'lantern'), so it never hangs blank (it was a blank grey card from 'messenger', 18.6-20.5 s)
      const a = cardPaperAlpha(t, b.ink[0], 0.4) * (1 - win(t, b.pullFrom - 0.2, b.pullFrom + 0.5));
      const litCard = win(t, b.ink[0] - 0.35, b.ink[0] + 0.25);
      const lower = (1 - sm((t - b.ink[0] + 0.75) / 0.85)) * -60;
      if (a > 0.003) {
        // the card's thread up out of frame (it hangs, like the slips)
        const c = f.c;
        c.save();
        c.globalAlpha = a;
        c.strokeStyle = f.mood.ink;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x0 + sz.w / 2, y0 + lower);
        c.lineTo(x0 + sz.w / 2 + 6, -10);
        c.stroke();
        c.restore();
      }
      equationCard(f.c, {
        x: x0,
        y: y0 + lower,
        alpha: a,
        tall: true,
        size: EQ,
        dim: lerp(0.86, 0.26, litCard),
        reveal: [clamp01((t - b.ink[0]) / 0.45), clamp01((t - b.ink[1]) / 0.7), clamp01((t - b.ink[2]) / 0.55), clamp01((t - b.ink[3]) / 0.6)],
        mood: f.mood,
      });
    }
    // (drawn over the equation card's thread)
    // (review r4) typed on from the stamp beat (complete by ~1.6 s), and set TOP-RIGHT: at the bottom left it cut
    // Rumelhart's chalkboard legs and feet through the whole full-loom framing
    placeStamp(f.c, { place: 'NATURE', date: '9 OCT 1986', year: 1986, x: 1226, y: 76, align: 'right', at: b.stamp, dur: b.train + 0.2 - b.stamp, fade: 0.3, cps: 30 }, tenv);
    // in as the trees tint (its first line by the beat), riding the pull-back to settle just right of the stub's
    // smoke, high in the dark above the candle
    const qy = lerp(102, 104, win(t, b.sterile, b.sterile + 3.6));
    const qx = lerp(478, 462, win(t, b.sterile, b.sterile + 3.6));
    // (review r2) the silent beat (30.8-35.2) carries the paper's own words at a legible size: in as soon as the
    // four XOR cases have been checked, so it is read before the family trees drop and tint to show it
    quoteCard(f.c, { quote: '…come to represent important features of the task domain', speaker: 'Nature, 1986', x: qx, y: qy, width: 560, maxChars: 34, size: 30, at: Math.min(b.quote - 0.4, b.xor + 4 * b.caseDur + 0.15) + 0.6, stagger: 0.3 }, tenv);
  },
});

/** the near drape leg (L5): authored in SCREEN px at the push-in camera `ref` (lower-left edge), baked with a soft
 *  blur, then carried into L5 so it slides with true parallax as the camera moves */
function nearLeg(f: Frame, ref: Camera3, a: number) {
  const k0 = toScreen(LAYERS.L5, ref, 0, 0).k;
  const at = toLayer(LAYERS.L5, ref, 0, 0);
  f.layer('L5', (c, env) => {
    c.save();
    c.globalAlpha *= a;
    c.translate(at.x, at.y);
    c.scale(1 / k0, 1 / k0);
    // local box in screen px: x -60 … 360, y -20 … 780
    f.cached(`${ID}/nearLeg2/${env.mood.id}`, 420, 800, (cc) => {
      cc.translate(60, 20);
      const edge = new Path2D();
      // the drape hangs straight down the left edge, is caught by a tie-back, and sweeps out across the corner
      edge.moveTo(40, -20);
      edge.bezierCurveTo(46, 160, 40, 330, 30, 470);
      edge.quadraticCurveTo(24, 525, 44, 565);
      edge.bezierCurveTo(70, 650, 200, 700, 340, 780);
      const body = new Path2D();
      body.moveTo(-60, -20);
      body.addPath(edge);
      body.lineTo(-60, 780);
      body.closePath();
      cc.fillStyle = env.mood.ink;
      cc.fill(body);
      // the fabric's edge catching the lanterns, and two long folds
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.55);
      cc.lineWidth = 3.5;
      cc.stroke(edge);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
      cc.lineWidth = 2;
      for (const fx of [10, 26]) {
        cc.beginPath();
        cc.moveTo(fx, -20);
        cc.bezierCurveTo(fx + 4, 180, fx - 2, 360, fx * 0.7, 480);
        cc.stroke();
      }
      // the tie-back cord
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.beginPath();
      cc.ellipse(30, 515, 24, 6, -0.25, 0, Math.PI * 2);
      cc.fill();
    }, { blur: 4 })(c, -60, -20);
    c.restore();
  });
}

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
