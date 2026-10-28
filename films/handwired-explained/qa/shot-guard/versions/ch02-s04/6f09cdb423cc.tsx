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
import { FONT, defineShot, labBench, labWall, legibleSize, mixLab, placeStamp, softPlate, textProbe, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { knot, thread, threadPoint } from '../../../film/silhouette/metaphors/kit';
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
  w: number;
}
/** the dendrite: a trunk from the soma (bottom) branching up; card-local coords, origin at the card's top centre */
const TREE: { segs: Seg[]; tips: { x: number; y: number }[] } = (() => {
  const segs: Seg[] = [];
  const tips: { x: number; y: number }[] = [];
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number, salt: number) => {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    segs.push({ x0: x, y0: y, x1, y1, w });
    if (depth === 0) {
      tips.push({ x: x1, y: y1 });
      return;
    }
    const spread = 0.42 + 0.12 * Math.sin(salt * 3.1);
    grow(x1, y1, ang - spread, len * 0.72, w * 0.66, depth - 1, salt * 1.7 + 1);
    grow(x1, y1, ang + spread * 0.9, len * 0.68, w * 0.66, depth - 1, salt * 2.3 + 2);
  };
  grow(0, 176, -Math.PI / 2, 46, 7, 3, 1);
  return { segs, tips };
})();
/** the two branch tips the inputs touch: the outermost left and right tips */
const TIP1 = TREE.tips.reduce((a, b) => (b.x < a.x ? b : a));
const TIP2 = TREE.tips.reduce((a, b) => (b.x > a.x ? b : a));
const world = (p: { x: number; y: number }) => ({ x: CARD.x + p.x, y: CARD.top + 14 + p.y });
const IN = [
  { x0: 380, y0: 250, ...(() => { const p = world(TIP1); return { x1: p.x, y1: p.y }; })(), w: 1.6, sag: 14 },
  { x0: 420, y0: 700, ...(() => { const p = world(TIP2); return { x1: p.x, y1: p.y }; })(), w: 1.6, sag: -40 },
];

const CAMS = (b: { split: number; glow: number; D: number }): CamKey[] => [
  { t: 0, cam: { x: 880, y: 470, z: 400, lens: 1 } },
  { t: b.split - 0.6, cam: { x: 900, y: 472, z: 440, lens: 1 } },
  { t: b.split + 1.6, cam: { x: 640, y: 404, z: 30, lens: 1 } },
  { t: b.D + 0.3, cam: { x: 700, y: 420, z: 90, lens: 1 } },
];

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = { D: T.duration, lab: T.beat('lab'), dendrites: T.beat('dendrites'), split: T.beat('split'), frayed: T.beat('frayed'), glow: T.beat('glow'), both: T.word('L0208b', 'not'), layers: T.word('L0208b', 'layers') };
    // input spans: [input, on, off]
    const spans: [number, number, number][] = [
      [0, b.dendrites + 0.1, b.dendrites + 1.1],
      [1, b.dendrites + 1.25, b.dendrites + 2.0],
      [0, b.both - 0.12, b.both + 0.95],
      [1, b.both - 0.12, b.both + 0.95],
      [0, b.both + 1.35, b.both + 2.05],
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
    const pull = seg(t, b.split - 0.6, b.split + 1.6);

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
        labBench(cc, { x: -400, y: 690, w: 2100, h: 110, seed: 2020, shelf: true, glassware: true }, env);
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
        drawRule(c, env, { y: RULE.y - PERIOD_DY, alpha: seg(t, b.split - 0.2, b.split + 1.0) });
      });
      // the input threads of green light, with a pulse running to the tip when an input switches on
      IN.forEach((o, i) => {
        const k = wake * (1 - 0.7 * pull);
        thread(c, { ...o, color: withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.35 * k) }, env);
        if (on[i]) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          thread(c, { ...o, w: 3.2, color: withAlpha(env.mood.halo, 0.55 * k) }, env);
          thread(c, { ...o, w: 1.2, color: withAlpha(env.mood.core, 0.9 * k) }, env);
          c.restore();
          if (since[i] < 0.25) {
            const p = threadPoint(o, since[i] / 0.25);
            knot(c, p.x, p.y, 6, k, env);
          }
          // the touched tip glows where the input lands
          if (arrived[i]) knot(c, o.x1, o.y1, 4, 0.8 * k, env);
        }
      });
      dendriteCard(c, env, lit * wake);
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
    });
    f.rim({ x: 0, y: -1 });

    // L5: a soft lab-stand rod at the left edge (near plane)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 360, 1200, (cc) => {
        cc.translate(140, 240);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(-60, -240, 18, 1200);
        cc.fillRect(-140, 160, 120, 14);
        cc.beginPath();
        cc.arc(-30, 167, 16, 0, Math.PI * 2);
        cc.fill();
      })(c, -140, -240);
    });

    // type: the date stamp (top-left) and the label beside the card (only while we are close on it)
    const tenv = { t, mood: f.mood, seed: 2020 };
    placeStamp(f.c, { place: '2020', date: 'Gidon et al., Science', year: 2020, x: 48, y: 64, at: b.dendrites, dur: b.split + 0.6 - b.dendrites, fade: 0.5 }, tenv);
    const la = seg(t, b.dendrites + 0.4, b.dendrites + 0.8) * (1 - seg(t, b.split - 0.7, b.split - 0.3));
    if (la > 0.01) label(f.c, f.mood, la);
  },
});

// ------------------------------------------------------------------ painters
/** the dendrite card: a dark card with the branching dendrite cut through it; lit from behind it glows */
function dendriteCard(c: C2, env: PaintEnv, lit: number) {
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
  // the card: a deckled sheet of dark paper
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.25);
  c.fillRect(-w / 2, 0, w, h);
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(w / 2, 0);
  c.stroke();
  c.fillStyle = withAlpha(env.mood.fg, 0.9);
  c.beginPath();
  c.arc(0, 8, 3, 0, Math.PI * 2);
  c.fill();
  // the dendrite: cut paper; dim paper when dark, glowing when lit
  c.translate(0, 14);
  const dim = mixLab(env.mood.set, env.mood.haze, 0.55);
  const bright = mixLab(env.mood.core, '#ffffff', 0.15);
  const col = mixLab(dim, bright, lit);
  if (lit > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    c.strokeStyle = withAlpha(env.mood.halo, 0.35 * lit);
    for (const s of TREE.segs) {
      c.lineWidth = s.w * 3.2;
      c.beginPath();
      c.moveTo(s.x0, s.y0);
      c.lineTo(s.x1, s.y1);
      c.stroke();
    }
    c.restore();
  }
  c.strokeStyle = col;
  c.lineCap = 'round';
  for (const s of TREE.segs) {
    c.lineWidth = s.w;
    c.beginPath();
    c.moveTo(s.x0, s.y0);
    c.lineTo(s.x1, s.y1);
    c.stroke();
  }
  // the soma at the trunk's foot
  c.fillStyle = col;
  c.beginPath();
  c.ellipse(0, 178, 12, 9, 0, 0, Math.PI * 2);
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
