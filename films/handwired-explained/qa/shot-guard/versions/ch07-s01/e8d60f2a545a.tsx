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
import { LAYERS, cam3Interp, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
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
const KNOB = { x: 846, y: 534, r: 23 };
const PANEL = { x: 772, y: 500, w: 150, h: 68 };
const PLANK = { x0: 730, x1: 964, y: 568 };
const CARD = { x: 846, top: 436, w: 214, h: 62 };
const HS = 0.74;
/** where thumb and finger close: the knob's upper-left rim */
const GRIP = { x: KNOB.x - KNOB.r * 0.55, y: KNOB.y - KNOB.r * 0.75 };

const START: Camera3 = { x: 690, y: 372, z: 0, lens: 1 };
const END: Camera3 = { x: 820, y: 470, z: 132, lens: 1 };

interface Beats {
  D: number;
  frost: number;
  hand: number;
  card: number;
  crack: number;
}

/** frost crystals on the knob (knob-local, unit = radius), and the dozen shards they become */
const CRYSTALS = Array.from({ length: 10 }, (_, i) => ({
  a: (i / 10) * Math.PI * 2 + hash1(i, 3) * 0.3,
  r: 0.55 + 0.35 * (hash1(i, 5) + 1) * 0.5,
  s: 0.16 + 0.08 * (hash1(i, 7) + 1) * 0.5,
  rot: hash1(i, 9) * Math.PI,
}));
const SHARDS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + hash1(i, 13) * 0.4;
  return {
    a,
    vx: Math.cos(a) * (60 + 50 * (hash1(i, 17) + 1)) + 20,
    vy: -60 - 90 * (hash1(i, 19) + 1) * 0.5,
    spin: (hash1(i, 23) * 2) * 6,
    size: 4 + 3 * (hash1(i, 29) + 1),
    shape: Math.floor((hash1(i, 31) + 1) * 1.5),
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
    const E = hands.entry(cam, 'L4');
    const inU = clamp01((tq - (b.hand - 0.45)) / 1.3) * 0.41;
    const turn = win(tq, b.crack - 0.12, b.crack + 0.3);
    let pose: HandsPose | null = null;
    if (tq > b.hand - 0.45) {
      pose = hands.act('lift', inU, GRIP, { scale: HS, entry: { R: E.R }, dropAt: GRIP, held: 'none' });
      if (pose.right) pose.right = { ...pose.right, bend: (pose.right.bend ?? 0) + 0.55 * turn, held: 'none' };
    }
    const frost = 1 - win(t, b.crack - 0.02, b.crack + 0.08);
    const glint = win(t, b.frost - 0.3, b.frost + 0.5);

    tagLineScene(f, {
      variant: 'none',
      key: ID,
      tags: tagsAt(ID, 'start'),
      rule: { alpha: 0.55 },
      line: { glow: 0.55 },
      pencilOnPost: false,
      l4: (c, env) => {
        panel(c, env);
        knob(c, env, turn, frost, glint, tq);
        card(c, env, t, b);
        if (t > b.crack - 0.05) shards(c, env, t - b.crack);
        if (pose) hands.draw(c, pose, env);
      },
      l6: (c, env) => nearPost(c, env),
    });
  },
});

/** the small paper control panel on its plank */
function panel(c: C2, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  // the plank and its two brackets down to the bench
  c.fillRect(PLANK.x0, PLANK.y, PLANK.x1 - PLANK.x0, 7);
  c.fillRect(PLANK.x0 + 20, PLANK.y + 7, 6, 40);
  c.fillRect(PLANK.x1 - 26, PLANK.y + 7, 6, 40);
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

/** the brass weight-knob: its 'w', its pointer, its frost */
function knob(c: C2, env: PaintEnv, turn: number, frost: number, glint: number, tq: number) {
  const { x, y, r } = KNOB;
  // dial ticks round it (the setting it was frozen at)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (0.75 + (i / 8) * 1.5);
    c.moveTo(x + Math.cos(a) * (r + 5), y + Math.sin(a) * (r + 5));
    c.lineTo(x + Math.cos(a) * (r + (i % 4 === 0 ? 11 : 8)), y + Math.sin(a) * (r + (i % 4 === 0 ? 11 : 8)));
  }
  c.stroke();
  // the knob body: brass, knurled edge
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, mixLab('#e8c886', env.mood.core, 0.3));
  g.addColorStop(0.5, mixLab('#a8823e', env.mood.halo, 0.25));
  g.addColorStop(1, mixLab('#4a3414', PUPPET_NEAR_BLACK, 0.3));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    c.moveTo(x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3));
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.stroke();
  // the pointer: frozen at a fixed setting; a quarter turn on 'find'
  const a = -Math.PI * 0.85 + turn * Math.PI * 0.5;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x + Math.cos(a) * r * 0.15, y + Math.sin(a) * r * 0.15);
  c.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
  c.stroke();
  c.lineCap = 'butt';
  // the tiny inked 'w' on the panel under the knob
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha(mixLab('#efe3c4', env.mood.core, 0.2), 0.9);
    c.font = `italic 600 15px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('w', x + r + 22, y + 6);
    c.textAlign = 'left';
  });
  // the frost: a pale rime over the body and cut-out crystals catching the rim light
  if (frost > 0.003) {
    c.save();
    c.globalAlpha = frost;
    c.fillStyle = withAlpha('#eef0ec', 0.28);
    c.beginPath();
    c.arc(x, y, r + 1.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha('#f6f7f2', 0.9);
    c.lineWidth = 1.3;
    for (const k of CRYSTALS) {
      const cx = x + Math.cos(k.a) * k.r * r, cy = y + Math.sin(k.a) * k.r * r;
      const s = k.s * r;
      c.beginPath();
      for (let j = 0; j < 3; j++) {
        const aa = k.rot + (j / 3) * Math.PI;
        c.moveTo(cx - Math.cos(aa) * s, cy - Math.sin(aa) * s);
        c.lineTo(cx + Math.cos(aa) * s, cy + Math.sin(aa) * s);
      }
      c.stroke();
    }
    // the rim light catching the frost on its window side (a soft flicker on twos)
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.4), (0.35 + 0.45 * glint) * (0.9 + 0.1 * Math.sin(tq * 7)));
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(x, y, r + 1, Math.PI * 1.05, Math.PI * 1.75);
    c.stroke();
    c.restore();
  }
  // the axle cap
  c.fillStyle = copperOf(env, 0.4);
  c.beginPath();
  c.arc(x, y, 3.2, 0, Math.PI * 2);
  c.fill();
}

/** the frost cracks into a dozen paper shards that fall and spin out of the haze (pure function of the time since) */
function shards(c: C2, env: PaintEnv, dt: number) {
  if (dt < 0) return;
  const { x, y, r } = KNOB;
  for (const s of SHARDS) {
    const px = x + Math.cos(s.a) * r * 0.8 + s.vx * dt;
    const py = y + Math.sin(s.a) * r * 0.8 + s.vy * dt + 0.5 * 760 * dt * dt;
    const a = clamp01(1 - (dt - 0.55) / 0.9);
    if (a <= 0) continue;
    c.save();
    c.translate(px, py);
    c.rotate(s.spin * dt + s.a);
    c.globalAlpha = a;
    c.fillStyle = mixLab('#f2f3ee', env.mood.haze, clamp01(dt * 0.6));
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
    c.restore();
  }
}

/** the README card: unrolls down from the copper line above the panel (L0702's start) */
function card(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = win(t, b.card - 0.1, b.card + 0.75);
  if (u <= 0) return;
  const w = CARD.w, H = CARD.h;
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
    const s1 = legibleSize(c, `italic 500 26px ${FONT.text}`, 26, "Let's find out!");
    c.font = `italic 500 ${s1}px ${FONT.text}`;
    c.fillStyle = '#2a1d14';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText("Let's find out!", CARD.x, yTop + 6 + s1);
    const s2 = legibleSize(c, `600 15px ${FONT.sc}`, 15, '— Handwired README');
    c.font = `600 ${s2}px ${FONT.sc}`;
    c.fillStyle = withAlpha('#5a3a22', 0.95);
    c.fillText('— Handwired README', CARD.x, yTop + 12 + s1 + s2);
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

/** L6: a soft near post at frame right (the near plane), out of focus */
function nearPost(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.ellipse(1236, 300, 24, 16, 0, 0, Math.PI * 2);
  c.rect(1210, 310, 52, 12);
  c.rect(1218, 322, 36, 700);
  c.rect(1204, 640, 64, 16);
  c.fill();
  void LAYERS;
}
