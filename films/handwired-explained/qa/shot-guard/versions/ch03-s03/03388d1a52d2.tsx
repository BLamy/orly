/**
 * ch03-s03 — SUSPECT TAG 4 STRUCK (scene, parchment; crossfade in from the builder-ribbon plate; 10.42 s).
 *   L0305 "One guess falls at once, for the library itself. The docs: “No tool converts existing JavaScript source
 *          into a program.”"
 *
 * The canonical workshop (sets/tagLine, variant 'workshop'): L2 the paned window wall in parchment light, L3 the bench
 * with the HandwiredOS desk now lit a little from inside (the X-ray has begun), L4 the copper line at 58 % with every
 * tag tied so far, in continuity (tagsAt). Tag 4 hangs on its slack suspect thread, its front in ink, the faded
 * 'suspect' stamp, its knot card "the README's tagline".
 *
 * TEACHES, word by word:
 *   tagIn (0.2)       close on tags 3 · 4 · 5; tag 4's front is legible
 *   guess (0.84)      the camera eases in on tag 4 and its knot card
 *   docs (4.04)       the narrator's hand (lower left) flips the tag with a paper snap; the red-pencil hand enters
 *                     from frame right and writes the docs' fragment on the back, "No tool converts existing
 *                     JavaScript"; the same fragment is set top right, attributed to the docs
 *   (≈7.0)            the narrator's hand turns the tag face-front again
 *   program (8.58)    TIGHT INSERT (cut, ~1.45 s): macro on the tag's face, the pencil tip enters from frame right and
 *                     strikes the front through once (the dry scratch), then withdraws
 *   hand (9.70)       cut back to the line: a soft glint runs along the copper, and far behind, on the bench's own
 *                     thread, the builder card from s02 passes like a shuttle. The struck tag hangs, its thread slack.
 * Scope (script): the strike is for the library itself; the lab's trace compiler is ch08, not struck here.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, defineShot, mixLab, quoteCard, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { copperOf } from '../sets/narratorHands';
import { SLOT_X, lineYAt, tagAnchors, tagLineScene, tagStrike, tagsAt, type TagState } from '../sets/tagLine';

type C2 = CanvasRenderingContext2D;
const ID = 'ch03-s03';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** tag 4, canonical */
const T4: TagState = { id: '4' };
const AN = tagAnchors(T4);
const BACK = ['No tool converts existing JavaScript'];
const KNOT = ["the README's tagline"];
/** hand scale (an insert-sized hand under the push) */
const HS = 0.55;

function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
interface CamKey {
  t: number;
  cam: Camera3;
  /** a hard cut lands on this key (no interpolation from the previous one) */
  cut?: boolean;
}
function camAt(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return b.cut ? a.cam : cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

interface Beats {
  D: number;
  tag: number;
  flip: number;
  strike: number;
  hand: number;
  /** insert window */
  ins0: number;
  ins1: number;
  /** actions */
  flip0: number;
  write0: number;
  unflip0: number;
  strike0: number;
}
const FLIP_D = 1.6;
const WRITE_D = 2.0;
const UNFLIP_D = 1.4;
const STRIKE_D = 1.3;

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const flip = T.beat('flip');
    const strike = T.beat('strike');
    const b: Beats = {
      D: T.duration,
      tag: T.beat('tag'),
      flip,
      strike,
      hand: T.beat('hand'),
      ins0: strike - 0.55,
      ins1: strike + 0.9,
      flip0: flip - 0.35,
      write0: flip + 0.55,
      unflip0: T.word('L0305', 'existing') + 0.1,
      // the stroke itself (u .35 → .47) lands on 'program'
      strike0: strike - 0.06 - 0.35 * STRIKE_D,
    };
    const cx = AN.eye.x, cy = AN.eye.y + 40;
    const keys: CamKey[] = [
      { t: 0, cam: camK(cx - 18, cy - 12, 2.35) },
      { t: b.tag - 0.1, cam: camK(cx - 16, cy - 10, 2.4) },
      { t: b.tag + 1.8, cam: camK(cx - 20, cy - 2, 3.55) },
      { t: b.ins0, cam: camK(cx - 12, cy, 3.75) },
      // the insert: a macro on the tag's face
      { t: b.ins0 + 0.001, cam: camK(cx + 2, cy + 6, 6.6), cut: true },
      { t: b.ins1, cam: camK(cx + 3, cy + 6, 7.0) },
      // cut back to the line, wider, for the shuttle
      { t: b.ins1 + 0.001, cam: camK(600, 452, 1.55), cut: true },
      { t: b.D + 0.3, cam: camK(612, 452, 1.6) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    const k = toScreen(LAYERS.L4, cam, 0, 0).k;

    // ---- the tag's state, on twos
    const flipU = clamp01((tq - b.flip0) / FLIP_D);
    const unflipU = clamp01((tq - b.unflip0) / UNFLIP_D);
    const flipped = (u: number) => (u <= 0.38 ? 0 : u >= 0.62 ? 1 : (u - 0.38) / 0.24);
    const flip = unflipU > 0 ? 1 - flipped(unflipU) : flipped(flipU);
    const writeU = clamp01((tq - b.write0) / WRITE_D);
    const backInk = writeU <= 0.3 ? 0 : clamp01((writeU - 0.3) / 0.45);
    const strikeU = clamp01((tq - b.strike0) / STRIKE_D);
    const sk = tagStrike(T4);
    const pStrike = hands.pencil('strike', strikeU, sk.centre, { strikeW: sk.w, strikeAngle: sk.angle, scale: HS * 1.2, entry: hands.entry(cam, 'L4').pencil });
    const strike = strikeU <= 0 ? 0 : pStrike.stroke ?? 0;
    // the paper snap sets the tag swinging; it settles
    const snapT = (u0: number, d: number) => u0 + 0.5 * d;
    const kick = (t0: number) => (t > t0 ? 0.09 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.022 + kick(snapT(b.flip0, FLIP_D)) + kick(snapT(b.unflip0, UNFLIP_D)) + (t > b.strike ? 0.05 * Math.exp(-(t - b.strike) * 2.5) : 0);
    const tags = tagsAt(ID, 'start').map((st) =>
      st.id === '4'
        ? { ...st, knot: KNOT, flip, back: BACK, backInk, strike, swing, phase: 0, glow: 0.12 + 0.18 * seg(t, b.tag, b.tag + 0.5) * (1 - seg(t, b.tag + 2.5, b.tag + 3.5)) }
        : st,
    );

    tagLineScene(f, {
      variant: 'workshop',
      key: ID,
      tags,
      desk: { translucency: 0.28, lamp: 0.55 },
      lamp: 0.85,
      pencilOnPost: false,
      sunX: 600,
      l3: (c, env) => shuttle(c, env, t, b),
      l4: (c, env) => {
        lineGlint(c, env, t, b);
        const E = hands.entry(cam, 'L4');
        // the narrator's hand: flip (paper snap), and later turn it face-front again
        if (flipU > 0 && flipU < 1) hands.draw(c, hands.act('flip', flipU, AN.eye, { scale: HS, entry: { R: E.R } }), env);
        if (unflipU > 0 && unflipU < 1) hands.draw(c, hands.act('flip', unflipU, AN.eye, { scale: HS, entry: { R: E.R } }), env);
        // the red pencil writes the back, then (in the insert) strikes the front
        const target = { x: AN.eye.x, y: AN.eye.y + 50 };
        if (writeU > 0 && writeU < 0.98) hands.draw(c, hands.pencil('write', writeU, target, { scale: HS, entry: E.pencil, writeW: 48 }), env);
        if (strikeU > 0 && strikeU < 0.98) hands.draw(c, pStrike, env);
      },
    });

    // ---- the docs' fragment, set top right while the back is being written (gone before the insert)
    const qAt = b.flip + 0.25;
    quoteCard(f.c, { quote: 'No tool converts existing JavaScript', speaker: 'the docs', x: 905, y: 150, width: 560, maxChars: 40, size: 30, at: qAt, dur: b.ins0 - 0.15 - qAt, fade: 0.4, stagger: 0.25 }, { t, mood: f.mood, seed: 303 });
    void k;
  },
});

/** a soft glint running along the copper line after the strike (additive, on the wire) */
function lineGlint(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = (t - (b.hand - 0.3)) / 1.3;
  if (u <= 0 || u >= 1) return;
  const x = 80 + u * 1100;
  const y = lineYAt(x);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const a = Math.sin(Math.PI * u) * 0.55;
  const g = c.createRadialGradient(x, y, 0, x, y, 26);
  g.addColorStop(0, withAlpha(mixLab(copperOf(env, 1), env.mood.core, 0.5), a));
  g.addColorStop(1, withAlpha(copperOf(env, 0.5), 0));
  c.fillStyle = g;
  c.fillRect(x - 26, y - 26, 52, 52);
  c.restore();
}

/** far behind, on a fine thread strung over the bench (L3), the builder card passes like a shuttle */
function shuttle(c: C2, env: PaintEnv, t: number, b: Beats) {
  const t0 = b.hand - 0.35;
  const u = (t - t0) / 2.2;
  if (u <= -0.05 || u >= 1.05) return;
  const y = 470;
  c.save();
  // the thread itself shows only around the passing card (a glint of it)
  const x = -40 + u * 1380;
  const g = c.createLinearGradient(x - 260, 0, x + 260, 0);
  g.addColorStop(0, withAlpha(env.mood.rim, 0));
  g.addColorStop(0.5, withAlpha(mixLab(env.mood.rim, '#2a1d14', 0.5), 0.5));
  g.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.strokeStyle = g;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x - 260, y);
  c.lineTo(x + 260, y);
  c.stroke();
  // the card: a little index card hung from the thread, its ink lines as texture, tipping as it rides
  c.translate(x, y);
  c.rotate(-0.08 + 0.05 * Math.sin(t * 5));
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.2), env.mood.haze, env.layer.haze);
  c.fillRect(-14, 3, 28, 32);
  c.strokeStyle = withAlpha('#2a1d14', 0.45);
  c.lineWidth = 0.8;
  c.strokeRect(-14, 3, 28, 32);
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    c.moveTo(-10, 10 + i * 5);
    c.lineTo(-10 + 16 + ((i * 7) % 5), 10 + i * 5);
  }
  c.stroke();
  c.restore();
}
