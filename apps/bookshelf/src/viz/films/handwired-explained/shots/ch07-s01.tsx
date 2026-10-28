/**
 * ch07-s01 — THE OFFER (scene, labGreen → dawnGold; lamp change in from ch06's X-ray; 13.7 s). Deep Dive III opens: a
 * frozen weight is let go, and the README asks its own question.
 *   L0701 "Every weight so far was written by hand. The README's first funny use-case:"
 *   L0702 "“unfreezing the weights and train them (what does that even do? Let's find out!)”"  (spoken in full; only
 *          its last three words are set, on the card)
 *
 * The tag line BY THE GALLERY (sets/ch07-s01-gallery + sets/tagLine, variant 'none'): the copper line across the front
 * of the learned gallery's paper stage, every tag tied so far in continuity, the Lifespan Rule faint along the bench.
 * Below the line, in the empty stretch past tag 7, a small paper control panel stands on a plank: one round brass
 * weight-knob, its tiny inked 'w', its pointer at a fixed setting, rimed in paper-cut frost.
 *
 *   0–1        the backlight warms from the X-ray's green to dawn; 'frost' (0.5) the frost catches the rim light
 *   1–12.5     a slow push in (about 15 %) to the knob
 *   'hand'     the narrator's hand enters from the lower left on twos; thumb and finger close on the knob; it holds
 *   L0702      the README card unrolls down from the copper line above the panel: "Let's find out!" and, small
 *              beneath it, "— Handwired README" (the full sentence is spoken, never set)
 *   'find'     the hand turns the knob a quarter turn: the frost cracks into a dozen paper shards that fall and spin out
 *              of the haze; the pointer is free. No number changes: the invitation, not the experiment.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, toLayer, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { copperOf, type HandsPose } from '../sets/narratorHands';
import { lineYAt, tagLineScene, tagsAt } from '../sets/tagLine';
import { galleryBack } from '../sets/ch07-s01-gallery';

const ID = 'ch07-s01';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

/** the panel, the knob (L4 rest px) and the card above them */
const KNOB = { x: 858, y: 550, r: 42 };
const PANEL = { x: 768, y: 497, w: 182, h: 99 };
const PLANK = { x0: 728, x1: 990, y: 596 };
/** the card hangs over the empty stretch of line right of tag 7's chips (never over a tag), above the panel */
const CARD = { x: 924, top: 412 };
const HS = 0.74;
/** where thumb and finger close: the knob's upper-left rim */
const GRIP = { x: KNOB.x - KNOB.r * 0.95, y: KNOB.y + KNOB.r * 0.1 };

const START: Camera3 = { x: 690, y: 372, z: 0, lens: 1 };
/** about 20 % in by 'find': the knob reaches ~155 px across at 1080p */
const END: Camera3 = { x: 872, y: 498, z: 190, lens: 1 };

interface Beats {
  D: number;
  frost: number;
  hand: number;
  card: number;
  crack: number;
}

/**
 * frost: jagged cut-paper plates on the knob's black body and over its rim (knob-local polygons, unit = radius), and
 * the dozen shards they crack into on 'find'
 */
const jag = (cx: number, cy: number, rad: number, n: number, seed: number) =>
  Array.from({ length: n }, (_, j) => {
    const a = (j / n) * Math.PI * 2 + hash1(seed, j) * 0.35;
    const rr = rad * (j % 2 === 0 ? 1 : 0.45 + 0.25 * (hash1(seed, j + 40) + 1) * 0.5);
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  });
const FROST = [
  // crystals across the face (the black body shows between them)
  jag(-0.3, -0.32, 0.24, 9, 1),
  jag(0.28, -0.2, 0.2, 8, 2),
  jag(-0.12, 0.3, 0.22, 9, 3),
  jag(0.32, 0.36, 0.16, 7, 4),
  // plates crusted over the rim, all the way round
  ...Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + hash1(i, 3) * 0.3;
    const rr = 0.9 + 0.1 * hash1(i, 5);
    return jag(Math.cos(a) * rr, Math.sin(a) * rr, 0.15 + 0.06 * (hash1(i, 7) + 1), 7 + (i % 3), 10 + i);
  }),
];
const SHARDS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + hash1(i, 13) * 0.4;
  // most fly down-left across the sleeve, a few right
  const side = i % 3 === 0 ? 1 : -1;
  return {
    a,
    vx: side * (40 + 45 * (hash1(i, 17) + 1)),
    vy: -70 - 70 * (hash1(i, 19) + 1) * 0.5,
    spin: (2 + 3 * (hash1(i, 23) + 1)) * (i % 2 ? 1 : -1),
    flip: 3 + 3 * (hash1(i, 37) + 1),
    size: 6 + 3 * (hash1(i, 29) + 1),
    shape: Math.floor((hash1(i, 31) + 1) * 1.5),
    front: i % 2 === 0,
  };
});

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, frost: T.beat('frost'), hand: T.beat('hands'), card: T.beat('card'), crack: T.beat('crack') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);
    const cam = cam3Interp(START, END)(win(t, 0.8, b.D - 0.6));
    f.camera(cam);
    // the lamp change: the X-ray's green warms to dawn across the first second (quantised: few re-bakes)
    const mu = Math.round(win(t, 0, 1.0) * 8) / 8;
    if (mu < 1) f.setMood('dawnGold', { from: 'labGreen', u: mu });

    galleryBack(f, { key: ID, lamp: 0.75 });

    // ---- the hand: in on 'hand' (on twos), pinch, hold; the quarter turn on 'find'
    // the working hand enters from the frame's lower left, near the corner, so only hand and forearm come in
    const E = { R: toLayer(LAYERS.L4, cam, 330, 880) };
    // in on 'hand': thumb and finger close on the knob by hand + 0.8 s, then hold still
    const inU = clamp01((tq - (b.hand - 0.1)) / 0.9) * 0.41;
    const turn = win(tq, b.crack - 0.12, b.crack + 0.3);
    let pose: HandsPose | null = null;
    if (tq > b.hand - 0.1) {
      pose = hands.act('lift', inU, GRIP, { scale: HS, entry: { R: E.R }, dropAt: GRIP, held: 'none' });
      if (pose.right) pose.right = { ...pose.right, bend: (pose.right.bend ?? 0) + 0.55 * turn, held: 'none' };
    }
    const frost = 1 - win(t, b.crack - 0.02, b.crack + 0.08);
    const glint = win(t, b.frost - 0.3, b.frost + 0.5);

    tagLineScene(f, {
      variant: 'none',
      key: ID,
      tags: tagsAt(ID, 'start'),
      // faint along the bottom (review r1: 40 % down on paper and labels)
      rule: { alpha: 0.33, labels: 0.6 },
      line: { glow: 0.55 },
      pencilOnPost: false,
      l4: (c, env) => {
        panel(c, env);
        knob(c, env, turn, frost, glint, tq, 1 - win(t, b.crack - 0.02, b.crack + 0.4));
        card(c, env, t, b);
        if (t > b.crack - 0.05) shards(c, env, t - b.crack, false);
        if (pose) hands.draw(c, pose, env);
        // half the shards pass in front of the sleeve
        if (t > b.crack - 0.05) shards(c, env, t - b.crack, true);
      },
    });
  },
});

/** the small paper control panel on its plank */
function panel(c: C2, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  // the plank and its two brackets down to the bench
  c.fillRect(PLANK.x0, PLANK.y, PLANK.x1 - PLANK.x0, 7);
  c.fillRect(PLANK.x0 + 20, PLANK.y + 7, 6, 14);
  c.fillRect(PLANK.x1 - 26, PLANK.y + 7, 6, 14);
  // the panel: a black card face with a pale paper label strip
  c.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  c.fillRect(PANEL.x - 6, PANEL.y + PANEL.h - 4, PANEL.w + 12, 6);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(PANEL.x, PANEL.y);
  c.lineTo(PANEL.x + PANEL.w, PANEL.y);
  c.moveTo(PLANK.x0, PLANK.y);
  c.lineTo(PLANK.x1, PLANK.y);
  c.stroke();
  // two blind screw heads
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.rim, 0.25);
  for (const x of [PANEL.x + 12, PANEL.x + PANEL.w - 12]) {
    c.beginPath();
    c.arc(x, PANEL.y + 12, 2.6, 0, Math.PI * 2);
    c.fill();
  }
}

/** the weight-knob: frozen, a black body crusted in white cut-paper frost; on 'find' the frost cracks off and brass shows */
function knob(c: C2, env: PaintEnv, turn: number, frost: number, glint: number, tq: number, shell: number) {
  const { x, y, r } = KNOB;
  // dial ticks round it (the setting it was frozen at)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (0.75 + (i / 8) * 1.5);
    c.moveTo(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5));
    c.lineTo(x + Math.cos(a) * (r + (i % 4 === 0 ? 12 : 9)), y + Math.sin(a) * (r + (i % 4 === 0 ? 12 : 9)));
  }
  c.stroke();
  // the knob body: brass once freed (the frozen shell is near-black over it)
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, mixLab('#d9b56e', env.mood.core, 0.25));
  g.addColorStop(0.5, mixLab('#9a7432', env.mood.halo, 0.2));
  g.addColorStop(1, mixLab('#4a3414', PUPPET_NEAR_BLACK, 0.35));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  if (shell > 0.003) {
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.96 * shell);
    c.beginPath();
    c.arc(x, y, r + 0.5, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    c.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.stroke();
  // the pointer: frozen at a fixed setting; a quarter turn on 'find'
  const a = -Math.PI * 0.85 + turn * Math.PI * 0.5;
  const p0 = { x: x + Math.cos(a) * r * 0.15, y: y + Math.sin(a) * r * 0.15 };
  const p1 = { x: x + Math.cos(a) * r * 0.86, y: y + Math.sin(a) * r * 0.86 };
  c.lineCap = 'round';
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 4.4;
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.lineTo(p1.x, p1.y);
  c.stroke();
  // as it swings free, a brief rim-light glint runs along its window-side edge
  const gl = Math.sin(Math.PI * clamp01(turn * 1.15));
  if (gl > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const nx = -Math.sin(a) * 2, ny = Math.cos(a) * 2;
    const sx = nx < 0 || ny < 0 ? 1 : -1;
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#fff6e0', 0.5), 0.85 * gl);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(p0.x + nx * sx, p0.y + ny * sx);
    c.lineTo(p1.x + nx * sx, p1.y + ny * sx);
    c.stroke();
    c.fillStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.5), 0.6 * gl);
    c.beginPath();
    c.arc(p1.x, p1.y, 3.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.lineCap = 'butt';
  // the tiny inked 'w' on the panel beside the knob
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha(mixLab('#efe3c4', env.mood.core, 0.2), 0.9);
    c.font = `italic 600 17px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('w', x + r + 24, y + 6);
    c.textAlign = 'left';
  });
  // the frost: jagged white cut-paper plates over the face and crusted on the rim, catching the rim light from the
  // window side (upper left)
  if (frost > 0.003) {
    c.save();
    c.globalAlpha = frost;
    const paper = mixLab('#eef0ea', env.mood.core, 0.12);
    c.fillStyle = paper;
    c.strokeStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, paper, 0.5), 0.6);
    c.lineWidth = 0.8;
    for (const poly of FROST) {
      c.beginPath();
      poly.forEach((p, k) => (k ? c.lineTo(x + p.x * r, y + p.y * r) : c.moveTo(x + p.x * r, y + p.y * r)));
      c.closePath();
      c.fill();
      c.stroke();
    }
    // the frozen pointer shows through as a dark cut in the frost
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 3.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
    c.lineCap = 'butt';
    // the rim light catching the frost on its window side (a soft flicker on twos)
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.45), (0.4 + 0.5 * glint) * (0.9 + 0.1 * Math.sin(tq * 7)));
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(x, y, r + 1.5, Math.PI * 1.0, Math.PI * 1.7);
    c.stroke();
    c.lineWidth = 1.2;
    for (const poly of FROST) {
      c.beginPath();
      let on = false;
      for (let k = 0; k < poly.length; k++) {
        const p = poly[k], q = poly[(k + 1) % poly.length];
        // an edge whose outward normal faces up-left catches the light
        const nx = q.y - p.y, ny = -(q.x - p.x);
        if (nx + ny < 0) {
          if (!on) c.moveTo(x + p.x * r, y + p.y * r);
          c.lineTo(x + q.x * r, y + q.y * r);
          on = true;
        } else on = false;
      }
      c.stroke();
    }
    c.restore();
  }
  // the axle cap
  c.fillStyle = copperOf(env, 0.4);
  c.beginPath();
  c.arc(x, y, 4, 0, Math.PI * 2);
  c.fill();
}

/** the frost cracks into a dozen paper shards that spin and fall out of the haze over ~1.2 s (pure function of dt) */
function shards(c: C2, env: PaintEnv, dt: number, front: boolean) {
  if (dt < 0) return;
  const { x, y, r } = KNOB;
  const paper = mixLab('#eef0ea', env.mood.core, 0.12);
  for (const s of SHARDS) {
    if (s.front !== front) continue;
    const px = x + Math.cos(s.a) * r * 0.85 + s.vx * dt;
    const py = y + Math.sin(s.a) * r * 0.85 + s.vy * dt + 0.5 * 520 * dt * dt;
    const a = clamp01(1 - (dt - 0.75) / 0.5);
    if (a <= 0) continue;
    c.save();
    c.translate(px, py);
    c.rotate(s.spin * dt + s.a);
    // paper turning over as it falls: its width breathes through edge-on
    const fl = Math.cos(s.flip * dt);
    c.scale(0.25 + 0.75 * Math.abs(fl), 1);
    c.globalAlpha = a;
    c.fillStyle = mixLab(fl > 0 ? paper : mixLab(paper, env.mood.set, 0.35), env.mood.haze, clamp01(dt * 0.7));
    c.beginPath();
    const z = s.size;
    if (s.shape === 0) {
      c.moveTo(-z, -z * 0.4);
      c.lineTo(z * 0.9, -z * 0.7);
      c.lineTo(z * 0.3, z * 0.8);
    } else if (s.shape === 1) {
      c.moveTo(-z * 0.7, -z * 0.6);
      c.lineTo(z * 0.8, -z * 0.2);
      c.lineTo(z * 0.5, z * 0.7);
      c.lineTo(-z * 0.6, z * 0.4);
    } else {
      c.moveTo(0, -z);
      c.lineTo(z * 0.6, z * 0.6);
      c.lineTo(-z * 0.7, z * 0.3);
    }
    c.closePath();
    c.fill();
    // a rim glint on its upper edge
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.4), 0.6 * a);
    c.lineWidth = 1;
    c.stroke();
    c.restore();
  }
}

/** the README card: unrolls down from the copper line above the panel (L0702's start) */
function card(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = win(t, b.card - 0.1, b.card + 0.75);
  if (u <= 0) return;
  c.save();
  // the quote is the large line; the attribution sits small beneath it, about 60 % of its size (at the legibility floor)
  const s2 = Math.max(21, legibleSize(c, `500 21px ${FONT.text}`, 21, '— Handwired README'));
  const s1 = Math.max(legibleSize(c, `italic 500 35px ${FONT.text}`, 35, "Let's find out!"), Math.round(s2 / 0.6));
  c.font = `italic 500 ${s1}px ${FONT.text}`;
  const tw1 = c.measureText("Let's find out!").width;
  c.font = `500 ${s2}px ${FONT.text}`;
  const tw2 = c.measureText('— Handwired README').width;
  c.restore();
  const w = Math.max(tw1, tw2) + 40, H = s1 + s2 + 22;
  const x0 = CARD.x - w / 2;
  const yTop = CARD.top;
  const h = H * u;
  // its two threads from the line
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
  c.lineWidth = 1;
  c.beginPath();
  for (const dx of [-w * 0.38, w * 0.38]) {
    const lx = CARD.x + dx * 0.8;
    c.moveTo(lx, lineYAt(lx));
    c.lineTo(CARD.x + dx, yTop);
  }
  c.stroke();
  c.save();
  // paper with a soft shadow, and the roll at the bottom edge while it unrolls
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x0 + 3, yTop + 4, w, h);
  const paper = mixLab(mixLab('#f2e5c4', env.mood.core, 0.2), env.mood.halo, 0.1);
  c.fillStyle = paper;
  c.fillRect(x0, yTop, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.3);
  c.strokeRect(x0, yTop, w, h);
  // the wooden top rod
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x0 - 6, yTop - 4, w + 12, 5);
  c.beginPath();
  c.rect(x0, yTop, w, h);
  c.clip();
  textRole(c, 'subject', () => {
    c.font = `italic 500 ${s1}px ${FONT.text}`;
    c.fillStyle = '#2a1d14';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText("Let's find out!", CARD.x, yTop + 4 + s1 * 0.95);
    c.font = `500 ${s2}px ${FONT.text}`;
    c.fillStyle = withAlpha('#5a3a22', 0.95);
    c.fillText('— Handwired README', CARD.x, yTop + 10 + s1 + s2 * 0.85);
    textProbe(c, `${ID}-card`, x0 + 10, yTop + 4, w - 20, H - 8, u);
  });
  c.restore();
  if (u < 1) {
    // the roll
    c.fillStyle = mixLab(paper, '#2a1d14', 0.25);
    c.fillRect(x0 - 2, yTop + h - 4, w + 4, 8);
    c.fillStyle = withAlpha('#fff7e2', 0.5);
    c.fillRect(x0 - 2, yTop + h - 3, w + 4, 2);
  }
  cardProbe(c, `${ID}-cardp`, x0, yTop, w, H, u, u);
}
