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
import { FONT, LAYERS, cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf, drawPencil, pencilRed } from '../sets/narratorHands';
import { TAG, TAGS, lineYAt, tagAnchors, tagLineScene, tagStrike, tagsAt, type TagState } from '../sets/tagLine';

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
/** the back's red-pencil rows: five short lines (JavaScript hyphenated) so the whole fragment fits inside the tag */
const BACK_ROWS = ['No tool', 'converts', 'existing', 'Java-', 'Script'];
const KNOT = ["the README's tagline"];
/** hand scale (an insert-sized hand under the push) */
const HS = 0.55;
/** the flip's target: the pinch lands on the tag's lower corner */
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - 118 * HS * 0.25 };

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
const FLIP_D = 1.1;
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
      // the snap (u .5) lands on 'docs'; the front has turned away by ~4.2 s
      flip0: flip - 0.5 * FLIP_D,
      write0: flip + 0.55,
      unflip0: T.word('L0305', 'existing') + 0.1,
      // the stroke itself (u .35 → .47) lands on 'program'
      strike0: strike - 0.06 - 0.35 * STRIKE_D,
    };
    const cx = AN.eye.x, cy = AN.eye.y + 40;
    const keys: CamKey[] = [
      { t: 0, cam: camK(cx + 10, cy - 12, 2.35) },
      { t: b.tag - 0.1, cam: camK(cx + 12, cy - 10, 2.4) },
      { t: b.tag + 1.8, cam: camK(cx + 62, cy - 4, 3.5) },
      { t: b.ins0, cam: camK(cx + 58, cy, 3.7) },
      // the insert: a macro on the tag's face
      { t: b.ins0 + 0.001, cam: camK(cx + 2, cy + 6, 6.6), cut: true },
      { t: b.ins1, cam: camK(cx + 3, cy + 6, 7.0) },
      // cut back to the line, wider, for the shuttle
      { t: b.ins1 + 0.001, cam: camK(cx + 50, 452, 2.05), cut: true },
      { t: b.D + 0.3, cam: camK(cx + 58, 452, 2.12) },
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
    const sk = tagStrike(T4);
    const E = entries(cam);
    // the strike: one red line across the face in the first 0.4 s after 'program'
    const strike = clamp01((t - b.strike) / 0.4);
    // the paper snap sets the tag swinging; it settles
    const snapT = (u0: number, d: number) => u0 + 0.5 * d;
    const kick = (t0: number) => (t > t0 ? 0.09 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.022 + kick(snapT(b.flip0, FLIP_D)) + kick(snapT(b.unflip0, UNFLIP_D)) + (t > b.strike ? 0.05 * Math.exp(-(t - b.strike) * 2.5) : 0);
    // knot cards are drawn by this shot centred on each tag's own string (so each card plainly belongs to its tag)
    const knots: { st: TagState; labels: string[] }[] = [];
    const tags = tagsAt(ID, 'start').map((st) => {
      const labels = st.id === '4' ? KNOT : st.knot ?? TAGS[st.id].knot;
      if (labels.length) knots.push({ st, labels });
      return st.id === '4'
        ? { ...st, knot: [], flip, back: BACK, backInk: 0, strike, swing, phase: 0, glow: 0.12 + 0.18 * seg(t, b.tag, b.tag + 0.5) * (1 - seg(t, b.tag + 2.5, b.tag + 3.5)) }
        : { ...st, knot: [] };
    });

    tagLineScene(f, {
      variant: 'workshop',
      key: ID,
      tags,
      desk: { translucency: 0.28, lamp: 0.55 },
      lamp: 0.85,
      pencilOnPost: false,
      sunX: 600,
      l3: (c, env) => shuttle(c, env, t, b, cam),
      l4: (c, env) => {
        for (const kn of knots) knotCards(c, env, kn.st, kn.labels);
        lineGlint(c, env, t, b, cam);
        // the back's red-pencil words, upright (the shared painter mirrors back text), revealed with the pencil
        if (flip > 0.5 && backInk > 0) backText(c, env, flip, swing * Math.sin(tq * 1.7), backInk);
        // the narrator's hand: flip (paper snap), and later turn it face-front again
        // the fingers pinch the tag's LOWER corner (the act pinches 0.25 hand below its target)
        if (flipU > 0 && flipU < 1) hands.draw(c, hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
        if (unflipU > 0 && unflipU < 1) hands.draw(c, hands.act('flip', unflipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
        // the red pencil writes the back, then (in the insert) strikes the front
        const target = { x: AN.eye.x, y: AN.eye.y + BACK_TOP + 18 };
        if (writeU > 0 && writeU < 0.98) hands.draw(c, hands.pencil('write', writeU, target, { scale: HS, entry: E.pencil, writeW: 48 }), env);
        // in the insert, only the pencil and the fingertips come in from frame right (the hand stays off frame)
        if (t > b.ins0 && t < b.ins1) insertPencil(c, env, tq, b, sk, cam);
      },
    });

    // ---- the docs' fragment on a typed slip at the right, while the back is written (gone before the insert)
    docsSlip(f.c, f.mood, t, b.flip + 0.3, b.ins0 - 0.12);
    void k;
  },
});

/** the hands' fixed entries, just outside the FRAME's lower left (narrator) and lower right (pencil), in L4 coords:
 *  short, so only hand, cuff and a little forearm come into the close shot */
function entries(cam: Camera3) {
  const at = (sx: number, sy: number) => toLayer(LAYERS.L4, cam, sx, sy);
  return { R: at(-140, 780), pencil: at(1150, 900) };
}

/** tag 4's back: the docs' fragment in red pencil, set upright and unmirrored in the tag's own (swung, narrowed) frame */
const BACK_TOP = 17;
function backText(c: C2, env: PaintEnv, flip: number, swing: number, ink: number) {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const w = TAG.w;
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  textRole(c, 'subject', () => {
    // five rows inside the tag's inner margin (the widest row is shrunk to fit, never clipped by the tag's edge)
    let fs = 9.6;
    c.font = `italic ${fs}px ${FONT.fell}`;
    const widest = Math.max(...BACK_ROWS.map((r) => c.measureText(r).width));
    if (widest > w * 0.8) {
      fs *= (w * 0.8) / widest;
      c.font = `italic ${fs}px ${FONT.fell}`;
    }
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const rows = BACK_ROWS;
    let budget = Math.ceil(rows.reduce((n, l) => n + l.length, 0) * clamp01(ink));
    rows.forEach((ln, i) => {
      if (budget <= 0) return;
      const tw = c.measureText(ln).width;
      c.fillText(ln.slice(0, budget), -tw / 2, BACK_TOP + fs * 0.85 + i * fs * 1.1);
      budget -= ln.length;
    });
    const tw = Math.max(...rows.map((r) => c.measureText(r).width));
    textProbe(c, `${ID}-back`, -tw / 2, BACK_TOP, tw, fs * 1.1 * rows.length + 3, clamp01(ink));
  });
  c.restore();
}

/** a small typed slip at the right of frame: the docs' fragment, attributed (screen-locked, a paper card) */
function docsSlip(c: C2, mood: PaintEnv['mood'], t: number, inkAt: number, outAt: number) {
  const out = 1 - seg(t, outAt - 0.3, outAt);
  // the paper and its first line arrive together (never a blank slip)
  const ink = cardInkAlpha(t, inkAt) * out;
  const paper = Math.min(cardPaperAlpha(t, inkAt) * out, ink);
  if (paper <= 0.005) return;
  const x = 700, y = 20, w = 540, h = 100;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(0.012);
  c.translate(-(x + w / 2), -(y + h / 2));
  c.globalAlpha = paper;
  c.fillStyle = withAlpha('#2a1d14', 0.22);
  c.fillRect(x + 4, y + 6, w, h);
  c.fillStyle = mixLab('#f6edd8', mood.core, 0.2);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 1;
  c.strokeRect(x, y, w, h);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 400 30px ${FONT.text}`, 30);
    c.font = `italic 400 ${size}px ${FONT.text}`;
    c.fillStyle = mixLab('#2a1d14', mood.ink, 0.2);
    c.globalAlpha = ink;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText('“No tool converts existing JavaScript”', x + 24, y + 44);
    const as = legibleSize(c, `600 21px ${FONT.sc}`, 21, 'the docs');
    c.font = `600 ${as}px ${FONT.sc}`;
    c.textAlign = 'right';
    c.globalAlpha = ink * 0.85;
    c.fillText('— the docs', x + w - 24, y + h - 16);
    textProbe(c, `${ID}-docs`, x + 24, y + 44 - size, w - 48, h - 44, ink);
  });
  cardProbe(c, `${ID}-slip`, x, y, w, h, paper, ink);
  c.restore();
}

/** a soft glint running along the copper line after the strike (additive, on the wire) */
function lineGlint(c: C2, env: PaintEnv, t: number, b: Beats, cam: Camera3) {
  const u = shuttleU(t, b);
  if (u <= 0 || u >= 1) return;
  // just ahead of the shuttle card riding behind
  const x = toLayer(LAYERS.L4, cam, shuttleSX(u) + 80, 0).x;
  const y = lineYAt(x);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const a = Math.sin(Math.PI * u) * 0.8;
  const g = c.createRadialGradient(x, y, 0, x, y, 30);
  g.addColorStop(0, withAlpha(mixLab(copperOf(env, 1), env.mood.core, 0.5), a));
  g.addColorStop(1, withAlpha(copperOf(env, 0.5), 0));
  c.fillStyle = g;
  c.fillRect(x - 30, y - 30, 60, 60);
  c.restore();
}

/** the shuttle's run: left to right across the frame in 1.2 s from the cut back to the line */
const shuttleU = (t: number, b: Beats) => (t - b.ins1) / 1.2;
const shuttleSX = (u: number) => -70 + sm(u) * 1420;

/**
 * Far behind (L3, soft), the builder card from s02 rides ALONG the copper line like a shuttle: it travels at the
 * line's own screen height, so it slides through the gaps between the hanging tags, the glint running just ahead.
 */
function shuttle(c: C2, env: PaintEnv, t: number, b: Beats, cam: Camera3) {
  const u = shuttleU(t, b);
  if (u <= -0.02 || u >= 1.02) return;
  const sx = shuttleSX(u);
  const x4 = toLayer(LAYERS.L4, cam, sx, 0).x;
  const sy = toScreen(LAYERS.L4, cam, x4, lineYAt(x4)).y;
  const p = toLayer(LAYERS.L3, cam, sx, sy);
  const q = toLayer(LAYERS.L3, cam, sx + 300, sy);
  const ks = (q.x - p.x) / 300;
  c.save();
  // the far thread it rides, catching the light only around the card
  const g = c.createLinearGradient(p.x - 200 * ks, 0, p.x + 200 * ks, 0);
  g.addColorStop(0, withAlpha(env.mood.rim, 0));
  g.addColorStop(0.5, withAlpha(mixLab(copperOf(env, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.8));
  g.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.strokeStyle = g;
  c.lineWidth = 1.2 * ks;
  c.beginPath();
  c.moveTo(p.x - 200 * ks, p.y);
  c.lineTo(p.x + 200 * ks, p.y);
  c.stroke();
  // the card, threaded through its top on the wire, leaning back as it runs (on twos)
  c.translate(p.x, p.y);
  c.scale(ks * 1.3, ks * 1.3);
  c.rotate(-0.1 + 0.04 * Math.sin(twos(t) * 6));
  const paper = mixLab(mixLab('#f4e8cb', '#2a1d14', 0.06), env.mood.haze, env.layer.haze * 0.5);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(-20, -6, 44, 54);
  c.fillStyle = paper;
  c.fillRect(-22, -9, 44, 54);
  c.strokeStyle = withAlpha('#2a1d14', 0.55);
  c.lineWidth = 1;
  c.strokeRect(-22, -9, 44, 54);
  c.fillStyle = withAlpha('#2a1d14', 0.1);
  c.fillRect(-22, -9, 44, 7);
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    c.moveTo(-15 + (i % 3 === 0 ? 0 : 4), 6 + i * 6);
    c.lineTo(-15 + 24 + ((i * 7) % 6), 6 + i * 6);
  }
  c.stroke();
  c.restore();
}

/** each tag's typeset knot card(s), centred on that tag's own string between the line and the eyelet */
function knotCards(c: C2, env: PaintEnv, st: TagState, labels: string[]) {
  const an = tagAnchors(st);
  const s = st.scale ?? 1;
  labels.forEach((label, i) => {
    textRole(c, st.id === '4' ? 'subject' : 'texture', () => {
      const fs = 6.6 * s;
      c.save();
      c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
      const tw = c.measureText(label).width;
      const cw = tw + 8 * s, ch = fs + 6 * s;
      const kx = an.eye.x - cw / 2;
      const ky = (an.knot.y + an.eye.y) / 2 - ch / 2 - 1 * s + i * (ch + 2 * s);
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
      c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
      c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
      c.fillRect(kx, ky, cw, ch);
      c.strokeStyle = withAlpha('#2a1d14', 0.35);
      c.lineWidth = 0.6;
      c.strokeRect(kx, ky, cw, ch);
      c.fillStyle = mixLab('#2a1d14', env.mood.ink, 0.2);
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.fillText(label, kx + 4 * s, ky + ch * 0.55);
      c.restore();
    });
  });
}

/**
 * The insert's red pencil: only its point, its lacquered length and two fingertips come in from frame right (the hand
 * is off frame). It approaches the stroke's start, draws the line across the face on 'program' (0.4 s), and withdraws.
 */
function insertPencil(c: C2, env: PaintEnv, tq: number, b: Beats, sk: ReturnType<typeof tagStrike>, cam: Camera3) {
  const dir = { x: Math.cos(sk.angle), y: Math.sin(sk.angle) };
  const start = { x: sk.centre.x - (dir.x * sk.w) / 2, y: sk.centre.y - (dir.y * sk.w) / 2 };
  const end = { x: sk.centre.x + (dir.x * sk.w) / 2, y: sk.centre.y + (dir.y * sk.w) / 2 };
  const away = toLayer(LAYERS.L4, cam, 1420, 640);
  let tip: { x: number; y: number };
  if (tq < b.strike) {
    const u = sm((tq - b.ins0) / (b.strike - b.ins0 - 0.05));
    tip = { x: away.x + (start.x - away.x) * u, y: away.y + (start.y - away.y) * u };
  } else if (tq < b.strike + 0.4) {
    const u = (tq - b.strike) / 0.4;
    tip = { x: start.x + (end.x - start.x) * u, y: start.y + (end.y - start.y) * u };
  } else {
    const u = sm((tq - b.strike - 0.45) / 0.45);
    tip = { x: end.x + (away.x - end.x) * u, y: end.y - 4 * Math.sin(Math.PI * Math.min(1, u * 2)) + (away.y - end.y) * u };
  }
  const ang = Math.PI + 0.42;
  const len = 150;
  drawPencil(c, tip, ang, len, env);
  // two fingertips pinching the lacquer near frame right (the rest of the hand is off frame)
  const back = { x: -Math.cos(ang), y: -Math.sin(ang) };
  const grip = { x: tip.x + back.x * len * 0.62, y: tip.y + back.y * len * 0.62 };
  c.save();
  c.translate(grip.x, grip.y);
  c.rotate(Math.atan2(back.y, back.x));
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(4, -6.2, 11, 4.4, -0.12, 0, Math.PI * 2);
  c.ellipse(9, 6.4, 12, 4.6, 0.1, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.6);
  c.lineWidth = 0.5;
  c.beginPath();
  c.ellipse(4, -6.2, 11, 4.4, -0.12, Math.PI * 1.1, Math.PI * 1.7);
  c.stroke();
  c.restore();
}
