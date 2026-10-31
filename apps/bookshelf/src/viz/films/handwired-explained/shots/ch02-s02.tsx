/**
 * ch02-s02 — the 1943 nets as paper lanterns: AND, then OR, and nothing in them learns (candleAmber plate, inkBleed
 * in from s01's parchment slip, 6.54 s). Locked-off plate under the study lamp, a gentle 2 % drift.
 *
 * TEACHES the McCulloch-Pitts unit in the lantern grammar (sets/ch02-s02-lanterns.ts): two input lanterns A and B
 * feed an output lantern through fixed knotted threads; every lantern is all or none; the output's threshold ring
 * says how many lit inputs it needs. The output's state is COMPUTED (gateFires) when the pulses ARRIVE.
 *   0.8  andGate  ring at notch 2 · label "threshold 2: both inputs (AND)" · A lights: its pulse arrives, the output
 *                 stays dark (1 < 2) · B lights: the output catches (2 = 2) · B goes dark: the output goes dark
 *   1.77 learned  the hard knots at every thread end catch the light; a faint grid of connection choices fades in at
 *                 left: every crossing decided (knotted or bare), none changing
 *   2.4  orGate   a paper hand's shadow lowers the ring one notch (threshold 1) · label swaps to "threshold 1: either
 *                 input (OR)" · A alone lights the output, then B alone
 *   4.79 hand     a paper hand's shadow pulls one last knot tight on the grid and withdraws; the plate rests
 */
import { Timeline } from '../../../core';
import { FONT, defineShot, legibleSize, mixLab, textProbe, textSwap, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { hands } from '../cast';
import { GATE, gateFires, gateLanterns, type GateState } from '../sets/ch02-s02-lanterns';
import { clamp01, seg, sm, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s02';
const PLATE = { x: 34, y: 26, w: 1212, h: 672 };
const LABEL = { x: 660, y: 598 };
/** the grid of connection choices: rows = from, cols = to; 1 = a knot tied there by hand, 0 = left bare.
 *  review r1: it sits beside the lanterns' threads, between the inputs and the output under the beam */
const GRID = { x: 712, y: 150, cols: 4, rows: 5, dx: 34, dy: 25 };
const CHOSEN = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [0, 0, 1, 1],
  [1, 0, 1, 0],
];
/** the last knot the hand pulls tight */
const LAST = { r: 4, c: 2 };
const FLY = 0.3;

interface Ev {
  a: [number, number][];
  b: [number, number][];
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const and = T.beat('andGate');
    const or = T.beat('orGate');
    const hand = T.beat('hand');
    // input on/off spans (shot s): AND: A, then B joins, B leaves, A leaves · OR: A alone, then B alone.
    // review r1: every state holds at least 0.6 s (AND output lit 1.25-1.85; OR output 2.9-3.55 and 3.95-4.6)
    const ev: Ev = {
      a: [[and - 0.05, and + 1.25], [or + 0.2, or + 1.15]],
      b: [[and + 0.15, and + 1.05], [or + 1.25, or + 2.2]],
    };
    // the AND output has dropped (B left): only then do the knots flare, so the eye is not split
    const andOff = and + 1.05 + 0.1;
    return { tl, D: T.duration, and, or, learned: T.beat('learned'), hand, ev, andOff };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = twos(t);
    const u = sm(t / sc.D);
    const cam: Camera3 = { x: 640 + 10 * u, y: 360 + 3 * u, z: 20 * u, lens: 1 };
    f.camera(cam);
    f.backlight({ intensity: 0.2 });
    const st = gateAt(sc.ev, tq, sc.or);
    const ringDown = seg(t, sc.or - 0.02, sc.or + 0.16);

    // L3: the study desk the plate lies on (seen only at its margins)
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3/${env.mood.id}`, 1700, 1100, (cc) => {
        cc.translate(210, 190);
        cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
        cc.fillRect(-210, -190, 1700, 1100);
        const g = cc.createRadialGradient(640, 360, 100, 640, 360, 900);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.16));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        cc.fillStyle = g;
        cc.fillRect(-210, -190, 1700, 1100);
      })(c, -210, -190);
    });

    // L4: the plate, the lanterns, the grid, the labels, the hands' shadows
    f.layer('L4', (c, env) => {
      f.cached(`${ID}/plate/${env.mood.id}`, PLATE.w + 40, PLATE.h + 40, (cc) => {
        cc.translate(-PLATE.x + 20, -PLATE.y + 20);
        plate(cc, env);
      })(c, PLATE.x - 20, PLATE.y - 20);
      // the grid of connection choices (fades in on 'learned')
      const gk = seg(t, sc.learned - 0.1, sc.learned + 0.6);
      const pull = seg(t, sc.hand - 0.15, sc.hand + 0.2);
      grid(c, env, gk, pull, seg(t, sc.andOff, sc.andOff + 0.4) * (1 - seg(t, sc.andOff + 0.9, sc.andOff + 1.6)));
      // lit lanterns throw a soft pool of their light onto the parchment below them
      pools(c, env, st);
      gateLanterns(c, env, { ...st, ring: 2 - ringDown, knots: seg(t, sc.andOff, sc.andOff + 0.3) * (1 - 0.6 * seg(t, sc.andOff + 1.0, sc.andOff + 1.8)) });
      labels(c, env, t, sc.and, sc.or);
      // the hands' shadows (the narrator's hands, never seen: only the shadow of a hand and wrist falls on the plate).
      // review r1: a short, crisp shadow (hand + wrist, ~160 px) coming in from the lower right toward the ring
      const ringAt = { x: GATE.OUT.x + GATE.OUT.r * 0.86, y: GATE.OUT.y + GATE.OUT.r * 0.86 - GATE.notch[2] * GATE.OUT.r * 1.72 };
      const lowerU = clamp01((tq - (sc.or - 0.55)) / 1.25);
      if (lowerU > 0 && lowerU < 1) shadowHand(c, env, hands.act('place', lowerU, { x: ringAt.x + 4, y: ringAt.y + 10 }, { held: 'none', scale: 0.95, entry: { R: { x: 1330, y: 640 } } }));
      const knotAt = gridPt(LAST.r, LAST.c);
      const tieU = clamp01((tq - (sc.hand - 0.85)) / 1.7);
      if (tieU > 0 && tieU < 1) shadowHand(c, env, hands.act('place', tieU, { x: knotAt.x + 2, y: knotAt.y + 6 }, { held: 'none', scale: 0.95, entry: { R: { x: 1180, y: 760 } } }));
    });
    // the lit lanterns light the room a touch (the lamp's own amber: the one accent). review r1: a DARK lantern shows
    // no flame at all; only a lit lantern carries a practical
    if (st.out) f.practical({ x: GATE.OUT.x, y: GATE.OUT.y, kind: 'candle', seed: 202, intensity: 0.25, radius: 70 });
    if (st.a) f.practical({ x: GATE.A.x, y: GATE.A.y, kind: 'candle', seed: 203, intensity: 0.12, radius: 50 });
    if (st.b) f.practical({ x: GATE.B.x, y: GATE.B.y, kind: 'candle', seed: 204, intensity: 0.12, radius: 50 });

    // L5: the inkwell and dip pen at the lower-right corner, soft
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 500, 400, (cc) => {
        cc.translate(-1060, -520);
        inkwell(cc, env);
      })(c, 1060, 520);
    });
  },
});

// ------------------------------------------------------------------ state (pure in tq)
function gateAt(ev: Ev, tq: number, or: number): GateState {
  const on = (spans: [number, number][], lag = 0) => spans.some(([a, b]) => tq >= a + lag && tq < b + lag);
  const pulse = (spans: [number, number][]) => {
    for (const [a] of spans) if (tq >= a && tq < a + FLY) return (tq - a) / FLY;
    return undefined;
  };
  const a = on(ev.a) ? 1 : 0;
  const b = on(ev.b) ? 1 : 0;
  // the output sees an input only once its pulse has arrived (a fixed flight time along the thread)
  const aIn = on(ev.a, FLY) && a ? 1 : 0;
  const bIn = on(ev.b, FLY) && b ? 1 : 0;
  const threshold = tq < or + 0.1 ? 2 : 1;
  const out = gateFires(aIn, bIn, threshold) ? 1 : 0;
  const flare = (spans: [number, number][], lag = 0) => {
    for (const [s] of spans) if (tq >= s + lag && tq < s + lag + 0.3) return 1 - (tq - s - lag) / 0.3;
    return 0;
  };
  // the output's catch moments (computed on the same rule) for its flare
  let flareOut = 0;
  for (let k = 0; k < 4; k++) {
    const tt = tq - k / 12;
    const aa = ev.a.some(([s, e]) => tt >= s + FLY && tt < e) ? 1 : 0;
    const bb = ev.b.some(([s, e]) => tt >= s + FLY && tt < e) ? 1 : 0;
    const was = ev.a.some(([s, e]) => tt - 1 / 12 >= s + FLY && tt - 1 / 12 < e) ? 1 : 0;
    const wbs = ev.b.some(([s, e]) => tt - 1 / 12 >= s + FLY && tt - 1 / 12 < e) ? 1 : 0;
    const th = tt < or + 0.1 ? 2 : 1;
    if (gateFires(aa, bb, th) && !gateFires(was, wbs, th)) flareOut = Math.max(flareOut, 1 - k / 4);
  }
  return { a, b, out, ring: 2, pulseA: pulse(ev.a), pulseB: pulse(ev.b), flareA: flare(ev.a), flareB: flare(ev.b), flareOut };
}

// ------------------------------------------------------------------ painters
const paperOf = (env: PaintEnv) => mixLab(mixLab('#e6d3a8', env.mood.halo, 0.25), env.mood.core, 0.08);
const inkOf = (env: PaintEnv) => mixLab('#2a1d14', env.mood.ink, 0.25);

/** the amber parchment plate: deckled, lamp pool at upper centre, darker corners, a double rule */
function plate(c: C2, env: PaintEnv) {
  const { x, y, w, h } = PLATE;
  c.save();
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.filter = 'blur(10px)';
  c.fillRect(x + 8, y + 12, w, h);
  c.filter = 'none';
  c.beginPath();
  const N = 60;
  for (let i = 0; i <= N; i++) c.lineTo(x + (w * i) / N, y + Math.sin(i * 2.3) * 1.6);
  for (let i = 0; i <= N; i++) c.lineTo(x + w + Math.sin(i * 3.1) * 1.6, y + (h * i) / N);
  for (let i = N; i >= 0; i--) c.lineTo(x + (w * i) / N, y + h + Math.sin(i * 1.7) * 1.6);
  for (let i = N; i >= 0; i--) c.lineTo(x + Math.sin(i * 2.9) * 1.6, y + (h * i) / N);
  c.closePath();
  c.fillStyle = paperOf(env);
  c.fill();
  c.clip();
  // review r1: the study lamp is up at top-left: its pool warms that corner and the light falls off across the plate
  // (the far corners ~25 % darker)
  const g = c.createRadialGradient(250, 70, 40, 330, 150, 1350);
  g.addColorStop(0, withAlpha(env.mood.core, 0.3));
  g.addColorStop(0.3, withAlpha(env.mood.core, 0.06));
  g.addColorStop(0.55, withAlpha(env.mood.fg, 0.1));
  g.addColorStop(0.8, withAlpha(env.mood.fg, 0.3));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.5));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // fibre
  c.fillStyle = withAlpha(env.mood.ink, 0.035);
  for (let i = 0; i < 900; i++) {
    const px = x + ((i * 7919) % 1213) * (w / 1213);
    const py = y + ((i * 104729) % 673) * (h / 673);
    c.fillRect(px, py, 5 + (i % 7), 0.8);
  }
  c.strokeStyle = withAlpha(inkOf(env), 0.4);
  c.lineWidth = 1.4;
  c.strokeRect(x + 26, y + 24, w - 52, h - 48);
  c.lineWidth = 0.7;
  c.strokeRect(x + 33, y + 31, w - 66, h - 62);
  c.restore();
}

function gridPt(r: number, col: number) {
  return { x: GRID.x + col * GRID.dx, y: GRID.y + r * GRID.dy };
}

/** the faint grid of connection choices: every crossing decided by hand, a knot or bare; none changes */
function grid(c: C2, env: PaintEnv, k: number, pull: number, glint: number) {
  if (k <= 0.01) return;
  const ink = inkOf(env);
  c.save();
  c.globalAlpha *= k * 0.8;
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let r = 0; r < GRID.rows; r++) {
    const a = gridPt(r, 0), b = gridPt(r, GRID.cols - 1);
    c.moveTo(a.x - 14, a.y);
    c.lineTo(b.x + 14, b.y);
  }
  for (let col = 0; col < GRID.cols; col++) {
    const a = gridPt(0, col), b = gridPt(GRID.rows - 1, col);
    c.moveTo(a.x, a.y - 14);
    c.lineTo(b.x, b.y + 14);
  }
  c.stroke();
  for (let r = 0; r < GRID.rows; r++) {
    for (let col = 0; col < GRID.cols; col++) {
      const p = gridPt(r, col);
      const last = r === LAST.r && col === LAST.c;
      if (CHOSEN[r][col]) {
        // a knot: the last one is loose until the hand pulls it tight
        const loose = last ? 1 - pull : 0;
        c.fillStyle = ink;
        c.beginPath();
        c.ellipse(p.x, p.y, 5.6 + 3 * loose, 4.6 + 2.4 * loose, 0.5, 0, Math.PI * 2);
        if (loose > 0.02) {
          c.lineWidth = 1.6;
          c.strokeStyle = ink;
          c.stroke();
        } else c.fill();
        if (glint > 0.01 || (last && pull > 0 && pull < 1)) {
          c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8 * Math.max(glint, last ? Math.sin(Math.PI * pull) : 0));
          c.lineWidth = 1.4;
          c.beginPath();
          c.arc(p.x, p.y, 9.5, Math.PI * 1.05, Math.PI * 1.95);
          c.stroke();
        }
      } else {
        // a bare crossing: an open ring, paper showing through
        c.fillStyle = paperOf(env);
        c.strokeStyle = withAlpha(ink, 0.75);
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }
  }
  c.restore();
}

/** the threshold labels, inked on the plate under the lanterns; OR replaces AND with no ghost */
function labels(c: C2, env: PaintEnv, t: number, and: number, or: number) {
  const size = legibleSize(c, `italic 400 31px ${FONT.text}`, 31);
  c.save();
  c.font = `italic 400 ${size}px ${FONT.text}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = inkOf(env);
  const sw = textSwap(t, or + 0.1, 0.3);
  const aIn = sm((t - and) / 0.3);
  const items: [string, number][] = [
    ['threshold 2: both inputs (AND)', aIn * sw.out],
    ['threshold 1: either input (OR)', sw.in],
  ];
  for (const [txt, a] of items) {
    if (a <= 0.003) continue;
    c.globalAlpha = a;
    c.fillText(txt, LABEL.x, LABEL.y);
    const tw = c.measureText(txt).width;
    textProbe(c, `${ID}-${txt.slice(10, 13)}`, LABEL.x - tw / 2, LABEL.y - size, tw, size * 1.2, a);
  }
  // a short ink rule above the label, tying it to the output
  c.globalAlpha = aIn * 0.5;
  c.fillRect(LABEL.x - 60, LABEL.y - size - 18, 120, 1);
  c.restore();
}

/** scratch surface for the shadow (device px, reused; the shot stays a pure function of t) */
let SCRATCH: OffscreenCanvas | null = null;
function scratch(w: number, h: number) {
  if (!SCRATCH || SCRATCH.width !== w || SCRATCH.height !== h) SCRATCH = new OffscreenCanvas(w, h);
  const s = SCRATCH.getContext('2d')!;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'source-over';
  s.globalAlpha = 1;
  s.filter = 'none';
  s.clearRect(0, 0, w, h);
  return s;
}

/** a hand seen only as its shadow on the plate, from the lamp above. review r1: crisp (blur 2.5 px), alpha 0.35, and only
 *  the hand and wrist (~160 px) fall on the paper: the forearm's shadow fades out behind the wrist */
function shadowHand(c: C2, env: PaintEnv, pose: ReturnType<typeof hands.act>) {
  const pr = pose.presence ?? 1;
  const arm = pose.right;
  if (pr <= 0.01 || !arm) return;
  const len = 118 * (pose.scale ?? 1);
  const m = c.getTransform();
  const W = c.canvas.width, H = c.canvas.height;
  const s = scratch(W, H);
  s.setTransform(m);
  s.translate(8, 10);
  const sh = { ...env, fill: () => '#000000', mood: { ...env.mood, rim: '#000000', core: '#000000', halo: '#000000', ink: '#000000' } } as PaintEnv;
  hands.draw(s as unknown as C2, pose, sh);
  // keep only the hand and wrist: a soft mask centred a little ahead of the wrist
  const dir = { x: Math.cos(arm.angle), y: Math.sin(arm.angle) };
  const cx = arm.wrist.x + dir.x * len * 0.42, cy = arm.wrist.y + dir.y * len * 0.42;
  // (the gradient is in the hand's own space; the huge rect clears everything beyond its outer radius)
  s.globalCompositeOperation = 'destination-in';
  const g = s.createRadialGradient(cx, cy, len * 0.62, cx, cy, len * 1.0);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  s.fillStyle = g;
  s.fillRect(-8000, -8000, 16000, 16000);
  // composite onto the plate: a warm-dark shadow, crisp
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  const px = W / 1280;
  c.filter = `blur(${(2.5 * px).toFixed(2)}px)`;
  c.globalAlpha = 0.35 * clamp01(pr * 1.4);
  c.drawImage(SCRATCH!, 0, 0);
  c.restore();
}

/** soft pools of lantern light on the parchment under each lit lantern (additive, the lamp's amber) */
function pools(c: C2, env: PaintEnv, st: GateState) {
  const L: [number, { x: number; y: number; r: number }][] = [[st.a, GATE.A], [st.b, GATE.B], [st.out, GATE.OUT]];
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [on, o] of L) {
    if (!on) continue;
    const py = o.y + o.r * 1.75;
    c.save();
    c.translate(o.x, py);
    c.scale(1, 0.42);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, o.r * 2.6);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.26));
    g.addColorStop(0.5, withAlpha(env.mood.halo, 0.1));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(-o.r * 2.6, -o.r * 2.6, o.r * 5.2, o.r * 5.2);
    c.restore();
  }
  c.restore();
}

/** L5: a glass inkwell and a dip pen at the lower-right corner, near and soft */
function inkwell(c: C2, env: PaintEnv) {
  const ink = env.fill('fg');
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(1150, 760);
  c.lineTo(1160, 668);
  c.quadraticCurveTo(1200, 650, 1240, 668);
  c.lineTo(1250, 760);
  c.closePath();
  c.fill();
  c.fillRect(1180, 640, 40, 22);
  // the pen leaning out of it
  c.save();
  c.translate(1196, 650);
  c.rotate(-0.62);
  c.fillRect(-4, -220, 8, 230);
  c.restore();
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(1162, 670);
  c.quadraticCurveTo(1200, 654, 1238, 670);
  c.stroke();
}
