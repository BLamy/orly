/**
 * ch04-s02 — THE FIRST RAMP (scene, parchment; cut from ch04-s01's lifting road; 17.04 s on the locked clock).
 * L0403 "Bend a hinge: flat, then up. A ramp is all a ReLU is."
 * L0404 "This one wakes at four. Three gives nought. Five gives one. A hundred gives ninety-six."
 *
 * The backlit workbench (sets/ch04-s02-workbench): a long black bench before a tall three-light window bay glowing
 * warm (L2), a low haze at board height, a hanging lamp and a back shelf in L3, the near bench lip and a spool of
 * wire blurred in L5, a black post at L6 framing the right edge with the formula card clipped to it.
 *
 * TEACHES, word by word (every number is COMPUTED with rampBench's FP32 maths):
 *   0.15–0.95    the narrator's hands bring in a short length of the copper line, held flat (macro, z 300)
 *   'Bend'       (beat hinge) the hands take it either side of the corner; 'flat' — a press on the flat end
 *   'then up'    the free end turns up to 45°: flat, then up, a silhouette against the window
 *   'ramp'       (beat ramp) the hands let go and the copper hinge GROWS about its corner into the hinged black board
 *                (the wire is a tiny board: thickness and all scale up, copper cooling to ink); the camera pulls back
 *                to reveal the bench; the paper number line slides in; the card on the post inks max(0, a − 4)
 *   'four'       the corner pin glints: this one wakes at four
 *   (after)      the hand sets the brass marble on the rule at 3; the ledger stands up at the left, header inked
 *   'Three'      (beat ledger) the marble at 3: a reading bar (flat: a cap only); 'nought' inks 0 in the ledger
 *                then 4 → 0, 'Five' rolls to 5, the copper bar grows one unit, 'one' inks 1; 6 → 2;
 *   'A hundred'  the marble rolls far off past the break to the 100 stub; the bar runs off the top of the frame;
 *                'ninety-six' inks 96 (the ledger shows all five stops though the narration names three)
 *   hold         (beat corner) the marble rolls back to 4 and stops exactly on the corner; the pin glints once more
 * Gauge (review r1): each reading bar stands on the number line and reaches board one's surface at the marble; the
 * value (0, 0, 1, 2, 96) inks at its tip as the ledger cell fills.
 * Camera: macro on the hands (z 380); it holds until board one has fully grown, then eases back over 2.8 s (the post
 * slides in from the right); from 9.0 s to 15.5 s a slow push in on the marble, gauge and ledger (WB_CAM.s02End,
 * where ch04-s03 starts). The clipped card is held inside the safe area (keepIn). Text: the card's formula, the
 * ledger, the gauge values, the rule's numerals; nothing else.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3 } from '../../../film';
import { CAMERA3_HOME, FONT, cam3Interp, cardInkAlpha, cardPaperAlpha, defineShot, legibleSize, mixLab, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
import type { HandsPose } from '../sets/narratorHands';
import { RB } from '../sets/rampBench';
import { WB, WB_CAM, benchNear, benchRoom, benchTop, ledger, marble, numberRule, readingBar, rig } from '../sets/ch04-s02-workbench';
import type { Pt } from '../sets/narratorHands';

const ID = 'ch04-s02';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** the end framing (ch04-s03 starts here) */
const CH04_S02_END: Camera3 = { ...WB_CAM.s02End };
const MACRO: Camera3 = { x: 600, y: 505, z: 380, lens: 1 };
const REST: Camera3 = { x: 646, y: 368, z: 0, lens: 1 };

const P = WB.pin(0);
/** the copper hinge: the board's outline at 0.3 scale about its corner (flat part, then the climb) */
const FLAT_L = 0.3 * (P.x - WB.X0);
const CLIMB_L = 0.3 * (WB.X1 - P.x) * Math.SQRT2;

interface Beats {
  inAt: number;
  inEnd: number;
  flat: number;
  bend: [number, number];
  out: [number, number];
  grow: [number, number];
  ramp: number;
  four: number;
  place: number;
  ledgerInk: number;
  stops: { a: number; arrive: number; leave: number; ink: number; bar: number }[];
  back: [number, number];
  corner: number;
  pull: [number, number];
  /** review r1: the slow push in on the marble, gauge and ledger */
  push: [number, number];
  /** a copper light runs along board one's edge, flat then up, on 'ReLU' */
  relu: [number, number];
}

const PLACE_DUR = 1.6;

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ramp = T.beat('ramp');
    const three = T.beat('ledger');
    const b: Beats = {
      inAt: 0.12,
      inEnd: 0.95,
      flat: T.word('L0403', 'flat'),
      bend: [T.word('L0403', 'then') - 0.05, T.wordEnd('L0403', 'up') + 0.05],
      out: [ramp - 0.35, ramp + 0.55],
      grow: [ramp - 0.2, ramp + 1.15],
      ramp,
      four: T.word('L0404', 'four'),
      place: T.word('L0404', 'wakes') + 0.1,
      ledgerInk: three - 0.35,
      stops: [
        { a: 3, arrive: 0, leave: T.word('L0404', 'nought') + 0.25, bar: three, ink: T.word('L0404', 'nought') },
        { a: 4, arrive: T.word('L0404', 'nought') + 0.65, leave: T.word('L0404', 'Five') - 0.15, bar: T.word('L0404', 'nought') + 0.65, ink: T.word('L0404', 'nought') + 0.75 },
        { a: 5, arrive: T.word('L0404', 'Five') + 0.45, leave: T.word('L0404', 'one#2') + 0.3, bar: T.word('L0404', 'Five') + 0.45, ink: T.word('L0404', 'one#2') },
        { a: 6, arrive: T.word('L0404', 'one#2') + 0.75, leave: T.word('L0404', 'hundred') - 0.12, bar: T.word('L0404', 'one#2') + 0.75, ink: T.word('L0404', 'one#2') + 1.0 },
        { a: 100, arrive: T.word('L0404', 'gives#3') - 0.25, leave: T.beat('corner') - 1.15, bar: T.word('L0404', 'gives#3') - 0.25, ink: T.word('L0404', 'ninety-six') },
      ],
      back: [T.beat('corner') - 1.15, T.beat('corner') - 0.02],
      corner: T.beat('corner'),
      // review r1: hold the macro until board one has fully grown (grow end + 0.8 s), then ease out over 2.8 s
      pull: [ramp + 1.95, ramp + 1.95 + 2.8],
      push: [9.0, 15.5],
      relu: [T.word('L0403', 'ReLU') - 0.35, T.wordEnd('L0403', 'is#2') + 0.2],
    };
    b.stops[0].arrive = b.place + 0.5 * PLACE_DUR;
    const cam = tl.channel<Camera3>('cam', MACRO, cam3Interp);
    tl.tween(cam, { ...MACRO, z: 350, x: MACRO.x + 10 }, { at: 0, dur: b.pull[0], ease: ease.move });
    tl.tween(cam, REST, { at: b.pull[0], dur: b.pull[1] - b.pull[0], ease: ease.move });
    tl.tween(cam, CH04_S02_END, { at: b.push[0], dur: b.push[1] - b.push[0], ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    benchRoom(f, { key: ID, lamp: 0.5 });

    const grow = win(tq, b.grow[0], b.grow[1]);
    const m = marbleAt(tq, b);
    const glint = Math.max(win(t, b.four - 0.15, b.four + 0.2) * (1 - win(t, b.four + 0.4, b.four + 1.4)), win(t, b.corner - 0.05, b.corner + 0.25) * (1 - win(t, b.corner + 0.5, b.corner + 1.0)) * 0.8);
    const ruleShow = win(tq, b.grow[0] + 0.5, b.grow[1] + 0.3);
    const hp = handsPose(t, tq, b, cam);

    f.layer('L4', (c, env) => {
      f.cached(`ch04wb/bench/${env.mood.id}`, 2400, 700, (cc) => {
        cc.translate(500, -WB.BY + 20);
        benchTop(cc, env);
      })(c, -500, WB.BY - 20);
      numberRule(c, env, { show: ruleShow, far: ruleShow, lit: m.stop >= 0 ? { a: WB.STOPS[m.stop], k: m.settle } : null });
      // board one: the copper hinge (while bending) or the board growing out of it
      if (t < b.grow[0]) wire(c, env, hingeAngle(tq, b), hingeOffset(tq, b));
      else rig(c, env, { grow, glint });
      if (t > b.relu[0] && t < b.relu[1] + 0.3) reluSweep(c, env, t, b);
      // the reading bars at each stop
      for (const st of b.stops) {
        const on = win(t, st.bar, st.bar + 0.12) * (1 - win(t, st.leave - 0.05, st.leave + 0.2));
        if (on <= 0) continue;
        readingBar(c, env, 0, st.a, win(t, st.bar, st.bar + (st.a >= 50 ? 0.5 : 0.28)), on);
        // review r1: the gauge's value inks at its tip as the ledger cell fills (the ledger visibly comes FROM the board)
        gaugeValue(c, env, st.a, on * win(t, st.ink - 0.05, st.ink + 0.2));
      }
      // the ledger at the left
      const paper = cardPaperAlpha(t, b.ledgerInk);
      ledger(c, env, {
        id: `${ID}-ledger`,
        paper,
        head: cardInkAlpha(t, b.ledgerInk),
        rows: [{ kind: 'ramp4', cells: b.stops.map((st) => win(t, st.ink + 0.1, st.ink + 0.35)) }],
        col: m.stop >= 0 ? { i: m.stop, k: m.settle } : null,
      });
      if (m.on) marble(c, env, m.x, WB.BY - WB.MARBLE_R, WB.MARBLE_R, m.roll);
      // the hands touch the wire / the rule in L4 (no parallax slip)
      if (hp) hands.draw(c, hp, env);
    });
    f.rim({ x: 0, y: -1 });
    benchNear(f, {
      key: ID,
      card: { id: `${ID}-card`, paper: cardPaperAlpha(t, b.ramp), keepIn: t >= b.pull[1], texts: [{ lines: ['max(0, a − 4)'], ink: cardInkAlpha(t, b.ramp) }] },
    });
  },
});

// ---------------------------------------------------------------- the copper hinge (before it grows)
function hingeAngle(tq: number, b: Beats) {
  return (Math.PI / 4) * win(tq, b.bend[0], b.bend[1]);
}
/** the hands carry the wire in from the lower left */
function hingeOffset(tq: number, b: Beats): Pt {
  const u = win(tq, b.inAt, b.inEnd);
  return { x: lerp(-300, 0, u), y: lerp(300, 0, u) };
}
function wire(c: C, env: Parameters<typeof rig>[1], th: number, off: Pt) {
  const x = P.x + off.x;
  const y = P.y + off.y;
  const pts: Pt[] = [
    { x: x - FLAT_L, y },
    { x, y },
    { x: x + Math.cos(-th) * CLIMB_L, y: y + Math.sin(-th) * CLIMB_L },
  ];
  const copper = hands.copperOf(env, 0.4);
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(11,13,11,0.85)';
  c.lineWidth = 5.4;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  c.strokeStyle = copper;
  c.lineWidth = 3.4;
  c.stroke();
  // the highlight along the top of the wire (the window catches it)
  c.strokeStyle = hands.copperOf(env, 1);
  c.lineWidth = 1;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y - 1.2) : c.moveTo(p.x, p.y - 1.2)));
  c.stroke();
  c.restore();
}

/** the ReLU's shape, underlined: a copper light runs along board one's top edge, flat, round the corner, then up */
function reluSweep(c: C, env: Parameters<typeof rig>[1], t: number, b: Beats) {
  const u = clamp01((t - b.relu[0]) / (b.relu[1] - b.relu[0]));
  const fade = 1 - win(t, b.relu[1] - 0.1, b.relu[1] + 0.3);
  const y0 = WB.BY - 10 * WB.S;
  const pts = [
    { x: WB.X0, y: y0 },
    { x: P.x, y: y0 },
    { x: WB.X1, y: y0 - (WB.X1 - P.x) },
  ];
  const l1 = pts[1].x - pts[0].x;
  const l2 = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
  const d = (l1 + l2) * (u * u * (3 - 2 * u));
  const at = d <= l1 ? { x: pts[0].x + d, y: y0 } : { x: P.x + ((d - l1) / l2) * (pts[2].x - P.x), y: y0 + ((d - l1) / l2) * (pts[2].y - y0) };
  const copper = hands.copperOf(env, 0.9);
  c.save();
  c.globalAlpha *= fade;
  // the lit stretch behind the light
  c.strokeStyle = copper;
  c.lineWidth = 3.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(pts[0].x, y0);
  if (d <= l1) c.lineTo(at.x, at.y);
  else {
    c.lineTo(P.x, y0);
    c.lineTo(at.x, at.y);
  }
  c.stroke();
  const g = c.createRadialGradient(at.x, at.y, 1, at.x, at.y, 40);
  g.addColorStop(0, 'rgba(255,236,196,0.85)');
  g.addColorStop(0.3, hands.copperOf(env, 1));
  g.addColorStop(1, 'rgba(176,104,58,0)');
  c.fillStyle = g;
  c.globalAlpha *= 0.85;
  c.fillRect(at.x - 42, at.y - 42, 84, 84);
  c.restore();
}

/** the value the gauge reads, inked at its tip (computed: rampBench's FP32 ramp) */
function gaugeValue(c: C, env: Parameters<typeof rig>[1], a: number, k: number) {
  if (k <= 0) return;
  const x = WB.xOf(a);
  const far = a >= 50;
  const tipY = far ? 236 : WB.boardTop(0, a);
  const label = RB.fmt(RB.ramp(a, 4));
  c.save();
  c.globalAlpha *= k;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 24px ${FONT.mono}`, 24);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    const flat = !far && a <= 4;
    const tx = far ? x - 16 : flat ? x : x - 14;
    const ty = far ? tipY : flat ? tipY - 30 : tipY - 8;
    c.textAlign = flat ? 'center' : 'right';
    const w = c.measureText(label).width;
    // a small paper chip behind the numeral so it reads against the bright bay
    const x0 = flat ? tx - w / 2 - 5 : tx - w - 5;
    c.fillStyle = withAlpha(mixLab('#efe2c4', env.mood.halo, 0.25), 0.9);
    c.fillRect(x0, ty - size * 0.82, w + 10, size * 0.98);
    c.fillStyle = mixLab('#22180f', env.mood.ink, 0.25);
    c.fillText(label, tx, ty);
    c.textAlign = 'left';
  });
  c.restore();
}

// ---------------------------------------------------------------- the hands (narrator: lower left only)
function handsPose(t: number, tq: number, b: Beats, cam: Camera3): HandsPose | null {
  const entry = hands.entry(cam, 'L4');
  // 1) bring in, bend, let go (0.12 .. out)
  if (t < b.out[1] + 0.1) {
    const th = hingeAngle(tq, b);
    const off = hingeOffset(tq, b);
    const outU = win(tq, b.out[0], b.out[1]);
    const press = Math.sin(Math.PI * win(tq, b.flat - 0.1, b.flat + 0.35)) * 3;
    const hold: Pt = { x: P.x - FLAT_L * 0.62 + off.x, y: P.y + off.y + press };
    const free: Pt = { x: P.x + Math.cos(-th) * CLIMB_L * 0.82 + off.x, y: P.y + Math.sin(-th) * CLIMB_L * 0.82 + off.y };
    const away = (p: Pt, E: Pt) => ({ x: lerp(p.x, lerp(E.x, p.x, 0.35), outU), y: lerp(p.y, lerp(E.y, p.y, 0.35), outU) });
    const len = HAND_LEN;
    // review r1: the lower (left) arm enters ~20 px higher, so the wrist does not cut in from the corner on a hard diagonal
    const eL: Pt = { x: entry.L.x, y: entry.L.y - 20 };
    const left = hands.reach(eL, away(hold, eL), outU > 0.05 ? 'rest' : 'grip', len, { sleeve: 'linen', bend: 0.1 });
    const right = hands.reach(entry.R, away(free, entry.R), outU > 0.05 ? 'open' : 'pinch', len, { sleeve: 'linen', bend: -0.25 });
    const presence = win(tq, b.inAt - 0.1, b.inAt + 0.3) * (1 - win(tq, b.out[1] - 0.2, b.out[1] + 0.1));
    if (presence <= 0.01) return null;
    return { left, right, scale: 1, presence };
  }
  // 2) the marble is set on the rule at 3
  if (t >= b.place && t < b.place + PLACE_DUR) {
    const u = (tq - b.place) / PLACE_DUR;
    return hands.act('place', u, { x: WB.xOf(3), y: WB.BY - WB.MARBLE_R }, { held: 'marble', scale: 1, entry });
  }
  return null;
}

// ---------------------------------------------------------------- the marble's story (pure, on twos)
interface MarbleState {
  on: boolean;
  x: number;
  roll: number;
  /** the stop it sits at (index into STOPS) or -1 while rolling */
  stop: number;
  /** 0..1 how settled it is at that stop */
  settle: number;
}
function rollU(t: number, a: number, z: number) {
  const u = clamp01((t - a) / (z - a));
  return 1 - Math.pow(1 - u, 2.2) * (1 - 0.2 * u);
}
function marbleAt(tq: number, b: Beats): MarbleState {
  const st = b.stops;
  if (tq < st[0].arrive) return { on: false, x: 0, roll: 0, stop: -1, settle: 0 };
  const x0 = WB.xOf(3);
  const R = WB.MARBLE_R;
  const mk = (x: number, stop: number, settle: number): MarbleState => ({ on: true, x, roll: (x - x0) / R, stop, settle });
  for (let i = 0; i < st.length; i++) {
    const s0 = st[i];
    if (tq < s0.leave) return mk(WB.xOf(s0.a), i, win(tq, s0.arrive, s0.arrive + 0.2));
    const next = st[i + 1];
    if (next && tq < next.arrive) return mk(lerp(WB.xOf(s0.a), WB.xOf(next.a), rollU(tq, s0.leave, next.arrive)), -1, 0);
  }
  // back from 100 to the corner at 4
  const xb = lerp(WB.xOf(100), WB.xOf(4), rollU(tq, b.back[0], b.back[1]));
  return mk(xb, -1, 0);
}
void RB;
void CAMERA3_HOME;
