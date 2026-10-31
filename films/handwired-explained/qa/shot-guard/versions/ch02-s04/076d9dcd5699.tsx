/**
 * ch02-s04 — 2020: one human neuron's branches answer either input but not both; then tag 1's thread splits in two
 * (labGreen, crossfade in, 15.33 s).
 *
 * A cool modern bench in haze, nothing period about it (L2 a lab wall with open blinds and tubes; L3 a lab bench).
 * At L4 one paper DENDRITE CARD hangs from the old line: a single branching dendrite cut in fine paper, lit from
 * behind, with two input threads of green light touching two of its branch tips. No figure, no likeness (the 2020
 * authors are a date stamp only). Its response is COMPUTED: it lights when exactly one input is on (XOR-like).
 *
 *   0.4  lab        the bench resolves in labGreen haze; the dendrite card hangs dark (close on the card)
 *   3.13 dendrites  the card wakes: input 1 alone → lit; input 2 alone → lit; both → dark (on "but not both"), then
 *                   once more; the date stamp sets top-left and the label sets beside the card
 *   9.95 split      pull back to the whole line: tag 1 at far left (qK beside it), the empty Lifespan Rule fading up
 *                   along the bottom; tag 1's thread drops from its knot and SPLITS into two strands
 *   11.54 frayed    the biology strand runs along the rule to about seventy-seven years, just short of the lifetime
 *                   tick, and frays out there, the dendrite card hanging beside it
 *   12.7 glow       the engineering strand runs on just past the lifetime tick (about eighty-three years) and ends in
 *                   a glowing open tip with a short copper arrow pointing right: the only thread past a lifetime
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, defineShot, labBench, labWall, legibleSize, mixLab, placeStamp, softPlate, textProbe, toLayer, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { knot } from '../../../film/silhouette/metaphors/kit';
import { copperOf } from '../sets/narratorHands';
import { RULE, SLOT_X, drawLine, drawRule, drawTags, lifeX, type TagState } from '../sets/tagLine';
import { PERIOD_DY, camAt, clamp01, onPeriodLine, seg, sm, twos, type CamKey } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch02-s04';
const Y = 365.25;

/** the dendrite card hangs from the line near the rule's lifetime end (world px, L4) */
const CARD = { x: 1010, top: 378, w: 156, h: 196 };
/** input threads: where each enters from the left and the branch tip it touches (card-local tips below) */
interface Seg {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** width at the base and at the tip (review r1: cut in fine, TAPERING paper) */
  w: number;
  w1: number;
}
/** the dendrite: a trunk from the soma (bottom) branching up; card-local coords, origin at the card's top centre */
const TREE: { segs: Seg[]; tips: { x: number; y: number }[] } = (() => {
  const segs: Seg[] = [];
  const tips: { x: number; y: number }[] = [];
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number, salt: number) => {
    // a slight bend in each branch (paper cut by hand, not a ruler)
    const bend = 0.12 * Math.sin(salt * 5.3);
    const x1 = x + Math.cos(ang + bend) * len, y1 = y + Math.sin(ang + bend) * len;
    const w1 = depth === 0 ? Math.max(0.5, w * 0.35) : w * 0.68;
    segs.push({ x0: x, y0: y, x1, y1, w, w1 });
    if (depth === 0) {
      tips.push({ x: x1, y: y1 });
      return;
    }
    const spread = 0.4 + 0.14 * Math.sin(salt * 3.1);
    grow(x1, y1, ang - spread, len * 0.74, w1, depth - 1, salt * 1.7 + 1);
    grow(x1, y1, ang + spread * 0.9, len * 0.7, w1, depth - 1, salt * 2.3 + 2);
  };
  grow(0, 176, -Math.PI / 2, 40, 4.6, 4, 1);
  return { segs, tips };
})();
/** the two branch tips the inputs touch: on the card's left side (so the threads arrive from the left without crossing
 *  the dendrite) — the outermost left tip and the lowest left tip */
const LEFT_TIPS = [...TREE.tips].sort((a, b) => a.x - b.x).slice(0, 6);
const TIP1 = LEFT_TIPS.reduce((a, b) => (b.y < a.y ? b : a));
const TIP2 = LEFT_TIPS.reduce((a, b) => (b.y > a.y ? b : a));
const world = (p: { x: number; y: number }) => ({ x: CARD.x + p.x, y: CARD.top + 14 + p.y });
/** review r1: the input threads enter ~300 px left of the card on near-horizontal paths (no frame-crossing diagonals) */
interface InThread { x0: number; y0: number; x1: number; y1: number; sag: number }
const IN: InThread[] = [
  { x0: CARD.x - CARD.w / 2 - 300, y0: world(TIP1).y - 18, x1: world(TIP1).x, y1: world(TIP1).y, sag: 6 },
  { x0: CARD.x - CARD.w / 2 - 300, y0: world(TIP2).y + 34, x1: world(TIP2).x, y1: world(TIP2).y, sag: 8 },
];
const inPoint = (o: InThread, u: number) => {
  const mx = (o.x0 + o.x1) / 2, my = (o.y0 + o.y1) / 2 + o.sag;
  const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
  return { x: a * o.x0 + b * mx + d * o.x1, y: a * o.y0 + b * my + d * o.y1 };
};
/** the lifetime tick (rule x) and the push-in on it */
const LIFE_X = lifeX(80 * Y);
/** review r1: the wide framing puts tag 1's knot and split point at about a third of the width (k 0.8: the whole rule
 *  still in frame, the dendrite card at right) */
const WIDE_K = 0.8;
const WIDE = { x: SLOT_X['1'] + (640 - 1280 / 3) / WIDE_K, y: 436, z: 1000 - 1000 / WIDE_K, lens: 1 };

const CAMS = (b: { split: number; frayed: number; glow: number; down: number; D: number }): CamKey[] => [
  { t: 0, cam: { x: 880, y: 470, z: 400, lens: 1 } },
  // review r1: the pull-back starts well before 'biology' so the line and tag 1 are resolved when it is said
  { t: b.split - 1.35, cam: { x: 900, y: 472, z: 440, lens: 1 } },
  { t: b.split + 0.05, cam: WIDE },
  // review r1: push in on the lifetime tick (~3x) as the strands land: the frayed end just short of it, the open tip
  // and its arrow just past; hold through 'came down'
  { t: b.frayed - 0.4, cam: { ...WIDE, x: WIDE.x + 12, z: WIDE.z + 8 } },
  { t: b.glow - 0.15, cam: { x: LIFE_X - 8, y: 590, z: 667, lens: 1 } },
  { t: b.down + 0.3, cam: { x: LIFE_X - 4, y: 591, z: 672, lens: 1 } },
  // then back out to the whole line, tag 1's knot and split at about a third of the width
  { t: b.D + 0.45, cam: WIDE },
];

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = { D: T.duration, lab: T.beat('lab'), dendrites: T.beat('dendrites'), split: T.beat('split'), frayed: T.beat('frayed'), glow: T.beat('glow'), both: T.word('L0208b', 'not'), layers: T.word('L0208b', 'layers'), down: T.wordEnd('L0209', 'down') };
    // input spans: [input, on, off]. review r1: each solo state lit for ~0.8-1 s (input 1 alone, then input 2 alone),
    // then both from 'not' (dark); the stray last solo span is gone
    const spans: [number, number, number][] = [
      [0, b.dendrites + 0.0, b.dendrites + 1.2],
      [1, b.dendrites + 1.25, b.dendrites + 2.3],
      [0, b.both - 0.12, b.both + 1.2],
      [1, b.both - 0.12, b.both + 1.2],
      [0, b.layers - 0.25, b.layers + 0.65],
      [1, b.layers - 0.25, b.layers + 0.65],
    ];
    return { tl, b, spans, cams: CAMS(b) };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(sc.cams, t);
    f.camera(cam);
    f.backlight({ sunX: 900, intensity: 0.75 });
    // inputs and the card's computed response (XOR-like: exactly one input on), on twos
    const on = [0, 0];
    const since = [Infinity, Infinity];
    for (const [i, a, z] of sc.spans) if (tq >= a && tq < z) {
      on[i] = 1;
      since[i] = Math.min(since[i], tq - a);
    }
    const arrived = [on[0] && since[0] >= 0.25 ? 1 : 0, on[1] && since[1] >= 0.25 ? 1 : 0];
    const lit = arrived[0] + arrived[1] === 1 ? 1 : 0;
    const wake = seg(t, b.dendrites - 0.3, b.dendrites + 0.2);
    const pull = seg(t, b.split - 1.35, b.split + 0.05);
    // how close we are on the lifetime tick (for its highlight)
    const close = seg(t, b.frayed - 0.1, b.glow - 0.15) * (1 - seg(t, b.down + 0.3, b.down + 0.9));

    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 2200, 1000, (cc) => {
        cc.translate(460, 140);
        labWall(cc, { x: -460, y: -140, w: 2200, h: 1000, windows: [120, 640, 1160, 1600], winW: 300, winTop: 60, winH: 440, blinds: 0.92, tileTop: 600, tubes: [380, 900, 1420], tubeY: 30, frameCuts: false }, env);
      })(c, -460, -140);
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3/${env.mood.id}`, 2200, 560, (cc) => {
        cc.translate(460, -300);
        labBench(cc, { x: -400, y: 690, w: 2100, h: 110, seed: 2020, shelf: false, glassware: true }, env);
      })(c, -460, 300);
    });
    f.fog('B');
    // the card's own light (behind the action plane so the line and tags cut against it)
    const cardC = { x: CARD.x, y: CARD.top + CARD.h * 0.55 };
    if (lit && wake > 0) f.practical({ x: cardC.x, y: cardC.y, kind: 'screen', seed: 2020, intensity: 0.55 * wake, radius: 110, layer: 'L3' });

    f.layer('L4', (c, env) => {
      // the old line (no posts in this room: it runs from wall to wall)
      onPeriodLine(c, () => {
        drawLine(c, env, { metal: 'bronze', posts: 'none', glow: 0.3 });
        drawLine(c, env, { metal: 'bronze', posts: 'none', x0: -500, x1: 70, sag: 0, glow: 0.3 });
        drawLine(c, env, { metal: 'bronze', posts: 'none', x0: 1210, x1: 1800, sag: 0, glow: 0.3 });
        // the Lifespan Rule, empty, fading up as we pull back (it measures durations, never dates)
        drawRule(c, env, { y: RULE.y - PERIOD_DY, alpha: seg(t, b.split - 0.9, b.split - 0.1) });
      });
      // the input threads of green light, with a pulse running to the tip when an input switches on
      // review r1: an OFF thread is a faint 15 % line; an ON thread is bright with pulses running along it to the tip
      IN.forEach((o, i) => {
        const k = wake * (1 - pull);
        if (k <= 0.005) return;
        inThread(c, o, withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.15 * k), 1.2);
        if (on[i]) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          inThread(c, o, withAlpha(env.mood.halo, 0.5 * k), 3.6);
          inThread(c, o, withAlpha(env.mood.core, 0.95 * k), 1.4);
          c.restore();
          // the first pulse carries the switch-on to the tip; then pulses keep running while the input stays on
          if (since[i] < 0.25) {
            const p = inPoint(o, since[i] / 0.25);
            knot(c, p.x, p.y, 6, k, env);
          } else {
            for (let j = 0; j < 2; j++) {
              const u = ((since[i] - 0.25) / 0.55 + j * 0.5) % 1;
              const p = inPoint(o, u);
              knot(c, p.x, p.y, 4.2, 0.7 * k * Math.sin(Math.PI * u), env);
            }
          }
          // the touched tip glows where the input lands
          if (arrived[i]) knot(c, o.x1, o.y1, 4.5, 0.85 * k, env);
        }
      });
      dendriteCard(c, env, lit * wake, wake);
      // tag 1 and qK at their tie-order places at the line's far left; tag 1's thread drops and splits
      const d1 = clamp01((t - (b.split + 0.15)) / (b.frayed - b.split - 0.15));
      const d2 = clamp01((t - (b.split + 0.55)) / (b.glow - b.split - 0.55));
      const states: TagState[] = [
        { id: '1', knot: ['McCulloch & Pitts, 1943', 'Kleene, 1951'], drop: [sm(d1), sm(d2)] },
        { id: 'qK' },
      ];
      onPeriodLine(c, () => drawTags(c, env, states, { tq, ruleY: RULE.y - PERIOD_DY, pencil: 'none' }));
      // the split: a small fork of light at the knot as the strands part
      const fork = seg(t, b.split - 0.1, b.split + 0.3) * (1 - seg(t, b.split + 0.6, b.split + 1.6));
      if (fork > 0.01) knot(c, SLOT_X['1'], 360 + 24 + 86 + 6, 5, fork, env);
      // the frayed end flares briefly as it lands; the open tip's glow is drawn by the thread itself
      const fx = lifeX(77 * Y);
      const fl = seg(t, b.frayed - 0.05, b.frayed + 0.15) * (1 - seg(t, b.frayed + 0.3, b.frayed + 1.2));
      if (fl > 0.01) knot(c, fx, RULE.y + 5, 4, 0.6 * fl, env);
      // close on the rule: the lifetime tick catches the light, and the two ends are re-inked at insert scale so 'just
      // short' (the frayed fibres) and 'just past' (the open tip's copper arrow) read either side of it
      if (close > 0.01) {
        c.save();
        c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.75 * close);
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(LIFE_X, RULE.y - 16);
        c.lineTo(LIFE_X, RULE.y + 26);
        c.stroke();
        // the biology strand's frayed end (lane 0), in the rule's dark thread ink
        const bx = lifeX(77 * Y), by = RULE.y + 5;
        c.strokeStyle = withAlpha(mixLab('#4a2f1a', env.mood.ink, 0.3), 0.95 * close * sm(d1 * 1.02));
        c.lineWidth = 0.5;
        c.lineCap = 'round';
        c.beginPath();
        // loose, uneven fibres (not an arrowhead): each its own length and droop
        const FIB: [number, number, number][] = [[0.6, -2.1, -0.6], [2.2, -0.9, 0.5], [1.4, 0.3, 0.9], [2.8, 1.2, 0.2], [0.9, 2.3, 1.1]];
        for (const [len, dy, droop] of FIB) {
          c.moveTo(bx - 1.6, by + dy * 0.25);
          c.quadraticCurveTo(bx - 0.2 + len * 0.4, by + dy * 0.8, bx + len * 0.8 - 0.4, by + dy + droop);
        }
        c.stroke();
        // the engineering strand's open tip (lane 1): its copper arrow pointing on, right, past the lifetime
        const ex = lifeX(83 * Y), ey = RULE.y + 5 + 2.6;
        if (d2 >= 1) {
          c.strokeStyle = copperOf(env, 0.15);
          c.globalAlpha = close;
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(ex + 1.5, ey + 4);
          c.lineTo(ex + 17, ey + 4);
          c.moveTo(ex + 12, ey + 0.8);
          c.lineTo(ex + 17, ey + 4);
          c.lineTo(ex + 12, ey + 7.2);
          c.stroke();
        }
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });

    // L5: a soft lab-stand rod at the left edge (near plane)
    // (review r1: anchored to the frame's left edge with a little clamped parallax, so the wide framing never pulls it
    // into the picture beside tag 1)
    f.layer('L5', (c, env) => {
      const p0 = toLayer(LAYERS.L5, cam, 0, 0);
      const k = toLayer(LAYERS.L5, cam, 1, 0).x - p0.x;
      const dx = Math.max(-30, Math.min(30, -(cam.x - 640) * 0.06));
      c.save();
      c.translate(p0.x, p0.y);
      c.scale(k, k);
      c.translate(dx, 0);
      c.fillStyle = env.fill('fg');
      c.fillRect(20, -40, 16, 800);
      c.fillRect(-60, 380, 120, 12);
      c.beginPath();
      c.arc(28, 386, 14, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });

    // type: the date stamp (top-left) and the label beside the card (only while we are close on it)
    const tenv = { t, mood: f.mood, seed: 2020 };
    placeStamp(f.c, { place: '2020', date: 'Gidon et al., Science', year: 2020, x: 48, y: 64, at: b.dendrites, dur: b.split + 0.6 - b.dendrites, fade: 0.5 }, tenv);
    const la = seg(t, b.dendrites + 0.4, b.dendrites + 0.8) * (1 - seg(t, b.split - 1.6, b.split - 1.15));
    if (la > 0.01) label(f.c, f.mood, la);
  },
});

// ------------------------------------------------------------------ painters
/** an input thread of light (quadratic, entering from the left): its first 90 px fade in from nothing */
function inThread(c: C2, o: InThread, color: string, w: number) {
  const g = c.createLinearGradient(o.x0, 0, o.x0 + 90, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, color);
  c.save();
  c.strokeStyle = g;
  c.lineWidth = w;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(o.x0, o.y0);
  c.quadraticCurveTo((o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2 + o.sag * 2, o.x1, o.y1);
  c.stroke();
  c.restore();
}

/** one tapered branch of cut paper (a quad from width w to w1, round-capped) */
function branch(c: C2, s: Seg, grow = 1) {
  const dx = s.x1 - s.x0, dy = s.y1 - s.y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const a = s.w * grow / 2, b = s.w1 * grow / 2;
  c.beginPath();
  c.moveTo(s.x0 + nx * a, s.y0 + ny * a);
  c.lineTo(s.x1 + nx * b, s.y1 + ny * b);
  c.arc(s.x1, s.y1, b, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
  c.lineTo(s.x0 - nx * a, s.y0 - ny * a);
  c.arc(s.x0, s.y0, a, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
  c.closePath();
  c.fill();
}

/** the dendrite card: a dark card with the branching dendrite cut through it in fine tapering paper, lit from behind.
 *  review r1: even at rest a dim glow comes through it (~0.15) and its edges carry a clear rim; lit it blazes */
function dendriteCard(c: C2, env: PaintEnv, lit: number, rest: number) {
  const { x, top, w, h } = CARD;
  c.save();
  // its string from the line
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x, 362);
  c.lineTo(x, top);
  c.stroke();
  c.translate(x, top);
  // the card: a sheet of dark paper
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.25);
  c.fillRect(-w / 2, 0, w, h);
  // the light behind it, coming through the paper faintly even at rest
  const inner = 0.15 * rest + 0.25 * lit;
  if (inner > 0.005) {
    const g = c.createRadialGradient(0, h * 0.5, 4, 0, h * 0.5, h * 0.62);
    g.addColorStop(0, withAlpha(env.mood.halo, inner));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = g;
    c.fillRect(-w / 2, 0, w, h);
    c.restore();
  }
  // a clear rim: the backlight on the top edge, a thinner catch down both sides
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-w / 2, 0.5);
  c.lineTo(w / 2, 0.5);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.42);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(-w / 2 + 0.5, 0);
  c.lineTo(-w / 2 + 0.5, h);
  c.moveTo(w / 2 - 0.5, 0);
  c.lineTo(w / 2 - 0.5, h);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.14);
  c.lineWidth = 1;
  c.strokeRect(-w / 2 + 6, 6, w - 12, h - 12);
  c.fillStyle = withAlpha(env.mood.fg, 0.9);
  c.beginPath();
  c.arc(0, 8, 3, 0, Math.PI * 2);
  c.fill();
  // the dendrite: cut paper; dim paper when dark (a little light through it), glowing when lit
  c.translate(0, 14);
  const dim = mixLab(mixLab(env.mood.set, env.mood.haze, 0.55), env.mood.halo, 0.2 * rest);
  const bright = mixLab(env.mood.core, '#ffffff', 0.15);
  const col = mixLab(dim, bright, lit);
  if (lit > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(env.mood.halo, 0.3 * lit);
    for (const sg of TREE.segs) branch(c, sg, 3);
    c.restore();
  }
  c.fillStyle = col;
  for (const sg of TREE.segs) branch(c, sg);
  // the soma at the trunk's foot
  c.beginPath();
  c.ellipse(0, 178, 10, 7.5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the label beside the card (screen-locked, on a soft plate): the script's words */
function label(c: C2, mood: PaintEnv['mood'], a: number) {
  const txt = 'XOR-like: either input, not both';
  const size = legibleSize(c, `italic 400 30px ${FONT.text}`, 30);
  c.save();
  c.globalAlpha = a;
  softPlate(c, 330, 556, 560, 120, mood.ink, 0.5);
  c.font = `italic 400 ${size}px ${FONT.text}`;
  c.fillStyle = mixLab('#efe6d0', mood.core, 0.25);
  c.textAlign = 'center';
  c.fillText(txt, 330, 566);
  const tw = c.measureText(txt).width;
  textProbe(c, `${ID}-xor`, 330 - tw / 2, 566 - size, tw, size * 1.2, a);
  c.restore();
}
