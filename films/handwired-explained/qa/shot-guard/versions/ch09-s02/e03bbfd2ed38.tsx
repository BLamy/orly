/**
 * ch09-s02 — THE QUESTION ON THE DESK (card, candleAmber, crossfade in from the blazing tower; 8.71 s).
 *   L0903 "Cheng asked whether search on the GPU was “clearly more performant”, and if so, worth a demo."
 *
 * The crane through one lit pane of the 13 October column lands in the room behind it: we look DOWN on a plain paper
 * desk at night (the camera over the author's shoulder, top-down). Planes: L2 the dark floorboards past the desk's far
 * corner, fog, L4 the desk top (warm paper in the lamp's pool, falling off to dark at its edges), a generic logo-less
 * laptop pushed aside at the left (closed, its lid a dark slab), the index card and the author's hands, all sharp;
 * L5 the lamp's shade at upper right (soft, nearest the lens) whose light makes the pool.
 *
 * TEACHES (the question that started the demo; the one quotation set on screen in this shot, because the voice reads
 * only three of its words):
 *   0.2 -> 0.94 asked   the author's hands (author-hands: bare, from the bottom edge only, never a face) slide one typed
 *                       index card into the lamp's pool and let go on 'asked'. Typed on it, verbatim from Q099 (its
 *                       question only, lowercase as in the source): “…is clearly more performant from the gpu
 *                       parallelism?” and, under a rule, — Cheng Lou. The hand withdraws to the desk's near edge.
 *   1 -> D              the camera rests on the card: a slow 3 % push (multiplane: floor, desk, shade).
 *   7.49 motto          after the line, one soft detent click: both hands come to rest flat on the desk either side of
 *                       the card, still; the silence holds.
 * Composition: the card in the upper two thirds, clear of the lower-left caption band; no other text in frame.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, cardProbe, defineShot, legibleSize, mixLab, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, type ArmPose, type HandsPose, type Pt } from '../sets/narratorHands';
import { lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s02';

// ---------------------------------------------------------------- geometry (L4 rest px)
/** the card's resting centre, size and tilt (upper two thirds of frame) */
const CARD = { x: 650, y: 300, w: 560, h: 236, rot: -0.025 };
/** where it enters from (carried in from the lower right) */
const CARD_FROM = { x: 870, y: 610, rot: 0.16 };
/** the lamp: its pool centre on the desk (L4) and its shade (L5, upper right) */
const POOL = { x: 690, y: 300, r: 450 };
const SHADE = { x: 1170, y: 70, r: 132 };
/** the laptop, pushed aside at the left (closed) */
const LAPTOP = { x: 150, y: 330, w: 300, h: 210, rot: 0.22 };
/** the desk's far corner: beyond it the floor (L2) */
const DESK_EDGE: Pt[] = [
  { x: -200, y: -30 },
  { x: 260, y: -30 },
  { x: 120, y: 120 },
  { x: -200, y: 180 },
];
const HAND_SCALE = 1.75;
const LEN = HAND_LEN * HAND_SCALE;
/** the hands' entries: bottom edge only (the author sits at the desk's near side) */
const ENTRY_R: Pt = { x: 1040, y: 1040 };
const ENTRY_L: Pt = { x: 250, y: 1040 };

const QUOTE = ['“…is clearly more performant', 'from the gpu parallelism?”'];
const ATTRIB = '— Cheng Lou';

interface Beats {
  D: number;
  asked: number;
  motto: number;
}

/** the card's pose at t: carried in (from 0.1, once the pane has opened past ~60 %, -> asked), then still */
const CARD_IN = 0.1;
function cardPose(t: number, b: Beats) {
  const u = smr((t - CARD_IN) / (b.asked + 0.02 - CARD_IN));
  return { x: lerp(CARD_FROM.x, CARD.x, u), y: lerp(CARD_FROM.y, CARD.y, u), rot: lerp(CARD_FROM.rot, CARD.rot, u), u };
}
/** a point on the card (local, from its centre) in world space */
function onCard(p: { x: number; y: number; rot: number }, lx: number, ly: number): Pt {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  return { x: p.x + lx * c - ly * s, y: p.y + lx * s + ly * c };
}

/**
 * The author's hands at t (on twos). The right hand pinches the card's lower-right corner while it slides in, lets go
 * on 'asked', and withdraws to rest on the desk's near edge; on 'motto' both hands slide in flat, either side of the
 * card, and stay.
 */
function handsAt(tq: number, b: Beats): HandsPose {
  const p = cardPose(tq, b);
  const corner = onCard(p, CARD.w * 0.36, CARD.h * 0.5 - 6);
  const restR: Pt = { x: 980, y: 760 };
  // fingertips just outside and below the card's lower corners (~60 px in from the old, wider rest)
  const flatR: Pt = { x: 968, y: 404 };
  const flatL: Pt = { x: 338, y: 418 };
  const out: HandsPose = { scale: HAND_SCALE, presence: 1 };
  const arm = (entry: Pt, at: Pt, shape: ArmPose['shape'], bend = 0): ArmPose => hands.reach(entry, at, shape, LEN, { sleeve: 'bare', bend, noArmRim: true });
  if (tq < b.asked + 0.05) {
    // carrying: the pinch rides the corner; it first appears from the bottom edge
    const enter = sm((tq - CARD_IN) / 0.3);
    const at = { x: corner.x, y: lerp(1000, corner.y, enter) };
    out.right = arm(ENTRY_R, at, 'pinch', -0.1);
  } else if (tq < b.motto - 0.3) {
    // let go, lift off, withdraw to the near edge and rest there (barely in frame)
    const u = seg(tq, b.asked + 0.05, b.asked + 0.85);
    const at = { x: lerp(corner.x + 6, restR.x, u), y: lerp(corner.y + 4, restR.y, u) - 18 * Math.sin(Math.PI * Math.min(1, u * 1.4)) };
    out.right = arm(ENTRY_R, at, u < 0.3 ? 'open' : 'rest', -0.1);
  } else {
    // motto: both hands slide in and come to rest flat either side of the card's lower corners, fingers together,
    // each turned ~15 deg inward (the forearms come from outside the corners), landed by 7.75 s and then dead still
    const u = seg(tq, b.motto - 0.3, MOTTO_LAND);
    out.right = arm(MOTTO_ENTRY_R, { x: lerp(restR.x, flatR.x, u), y: lerp(restR.y, flatR.y, u) }, u > 0.4 ? 'flat' : 'rest', -0.06);
    out.left = arm(MOTTO_ENTRY_L, { x: lerp(260, flatL.x, u), y: lerp(900, flatL.y, u) }, u > 0.4 ? 'flat' : 'rest', 0.06);
  }
  return out;
}

/** the hands land by 7.75 s (on twos) and hold dead still through the silence */
const MOTTO_LAND = 7.75;
/** forearm entries for the resting hands: ~15 deg outside each fingertip, so the hands turn inward */
const MOTTO_ENTRY_R: Pt = { x: 968 + Math.tan((15 * Math.PI) / 180) * 640, y: 1044 };
const MOTTO_ENTRY_L: Pt = { x: 338 - Math.tan((15 * Math.PI) / 180) * 640, y: 1044 };

/** the push onto the card: one continuous ease across the line (0.6 -> 7.5 s), about 5 % on the desk plane */
const PUSH0: Camera3 = { x: 650, y: 332, z: 0, lens: 1 };
const PUSH1: Camera3 = { x: 652, y: 306, z: 48, lens: 1 };
const PUSH_T: [number, number] = [0.6, 7.5];
/** the crossfade in (1 s, straddling the cut): the desk is first seen through one lit pane of the 13 October column,
 *  a 120 x 90 window at the card's final place that opens to the full frame by +0.45 s (outside it the frame is
 *  transparent, so the blazing tower shows round it) */
const PANE_T: [number, number] = [-0.5, 0.45];

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, asked: T.beat('cardOne'), motto: T.beat('motto') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    // the slow push, one continuous ease across the line (camera on ones)
    const u = sm((t - PUSH_T[0]) / (PUSH_T[1] - PUSH_T[0]));
    const cam: Camera3 = { x: lerp(PUSH0.x, PUSH1.x, u), y: lerp(PUSH0.y, PUSH1.y, u), z: lerp(PUSH0.z, PUSH1.z, u), lens: 1 };
    f.camera(cam);
    f.backlight({ sunX: 160, sunY: 40, intensity: 0.35 });

    // ---------------- L2: the floor far below the desk's far corner
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 900, 600, (cc) => {
        cc.translate(300, 200);
        floorboards(cc, env);
      })(c, -300, -200);
    });
    f.fog({ yCenter: 60, height: 260, alpha: 0.22, drift: 3 });

    // ---------------- L4: the desk top, the laptop, the card, the hands
    f.layer('L4', (c, env) => {
      f.cached(`${ID}/desk/${env.mood.id}`, 1700, 1100, (cc) => {
        cc.translate(220, 200);
        desk(cc, env);
        laptop(cc, env);
      })(c, -220, -200);
      const p = cardPose(tq, b);
      // the card's soft contact shadow, then the card
      card(c, env, p);
      hands.draw(c, handsAt(tq, b), env);
    });
    f.rim({ x: 0.5, y: -0.8 });
    // the lamp's light on the desk: a warm practical over the pool's heart (no flicker to speak of: an electric lamp)
    f.practical({ x: POOL.x + 120, y: POOL.y - 120, kind: 'lamp', seed: 92, intensity: 0.35, radius: 260 });
    // a faint sheet of lamp haze drifting over the lower desk (between the desk and the lens)
    f.fog({ yCenter: 540, height: 380, alpha: 0.12, drift: 7 });

    // ---------------- L5: the lamp's shade, nearest the lens (soft)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 520, 520, (cc) => {
        cc.translate(-SHADE.x + 260, -SHADE.y + 260);
        shade(cc, env);
      })(c, SHADE.x - 260, SHADE.y - 260);
      // the near corner of a closed notebook at the lower left, nearest the lens (soft)
      f.cached(`${ID}/L5n/${env.mood.id}`, 420, 360, (cc) => {
        cc.translate(-NEAR.x + 60, -NEAR.y + 60);
        nearCorner(cc, env);
      })(c, NEAR.x - 60, NEAR.y - 60);
    });
    paneOpen(f.c, t);
  },
});

/** the near notebook corner (L5 world px) */
const NEAR = { x: -150, y: 560 };
function nearCorner(c: C2, env: PaintEnv) {
  c.save();
  c.translate(NEAR.x, NEAR.y);
  c.rotate(-0.32);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.15);
  c.beginPath();
  c.roundRect(0, 0, 300, 260, 16);
  c.fill();
  // its board edge catching the lamp (upper right)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(16, 1.5);
  c.lineTo(284, 1.5);
  c.quadraticCurveTo(298.5, 1.5, 298.5, 16);
  c.lineTo(298.5, 200);
  c.stroke();
  c.restore();
}

/** the opening pane (screen-locked, during the crossfade in): punch the frame outside a growing rounded rect, and
 *  ring it with the warm glazing-bar light of a lit window */
function paneOpen(c: C2, t: number) {
  if (t >= PANE_T[1]) return;
  const g = smr(Math.max(0, Math.min(1, (t - PANE_T[0]) / (PANE_T[1] - PANE_T[0]))));
  const k = Math.pow(1700 / 120, g);
  const w = 120 * k, h = 90 * k;
  const cx = lerp(CARD.x, 640, g), cy = lerp(CARD.y, 360, g);
  const r = 6 + 20 * g;
  c.save();
  c.setTransform(c.getTransform());
  const hole = new Path2D();
  hole.rect(-400, -400, 2080, 1520);
  hole.roundRect(cx - w / 2, cy - h / 2, w, h, r);
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  c.fill(hole, 'evenodd');
  c.globalCompositeOperation = 'source-over';
  // the window's frame: a thin warm line with a soft glow, fading as the pane fills the frame
  const a = 1 - g;
  c.strokeStyle = `rgba(255, 214, 160, ${0.5 * a})`;
  c.lineWidth = 6;
  c.beginPath();
  c.roundRect(cx - w / 2, cy - h / 2, w, h, r);
  c.stroke();
  c.strokeStyle = `rgba(255, 236, 205, ${0.9 * a})`;
  c.lineWidth = 1.6;
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- painters
/** L2: dark floorboards (world px of L2), seen past the desk's far-left corner */
function floorboards(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('set'), env.mood.ink, 0.45);
  c.fillRect(-300, -200, 900, 600);
  c.strokeStyle = withAlpha(env.mood.ink, 0.6);
  c.lineWidth = 2;
  c.beginPath();
  for (let x = -300; x < 600; x += 46) {
    c.moveTo(x, -200);
    c.lineTo(x + 120, 400);
  }
  c.stroke();
}

/** L4: the desk top: warm paper in the lamp's pool, falling to dark at its edges; the far corner cut away */
function desk(c: C2, env: PaintEnv) {
  const paper = mixLab('#d8c29a', env.mood.halo, 0.45);
  c.save();
  const top = new Path2D();
  top.rect(-220, -200, 1700, 1100);
  top.moveTo(DESK_EDGE[0].x, DESK_EDGE[0].y);
  for (const p of DESK_EDGE.slice(1)) top.lineTo(p.x, p.y);
  top.closePath();
  // the far corner is a hole (the floor shows through); fill evenodd with the outer rect
  const deskShape = new Path2D();
  deskShape.moveTo(-220, 180);
  deskShape.lineTo(DESK_EDGE[3].x, DESK_EDGE[3].y);
  deskShape.lineTo(DESK_EDGE[2].x, DESK_EDGE[2].y);
  deskShape.lineTo(DESK_EDGE[1].x, DESK_EDGE[1].y);
  deskShape.lineTo(1480, -200);
  deskShape.lineTo(1480, 900);
  deskShape.lineTo(-220, 900);
  deskShape.closePath();
  c.clip(deskShape);
  // base: the desk's paper in shadow
  c.fillStyle = mixLab(env.mood.set, paper, 0.25);
  c.fillRect(-220, -200, 1700, 1100);
  // the pool: a warm ellipse of lamplight, soft-edged
  c.save();
  c.translate(POOL.x, POOL.y);
  c.scale(1.35, 1);
  const g = c.createRadialGradient(40, -30, 0, 0, 0, POOL.r);
  g.addColorStop(0, withAlpha(mixLab(paper, env.mood.core, 0.3), 1));
  g.addColorStop(0.35, withAlpha(paper, 0.95));
  g.addColorStop(0.7, withAlpha(mixLab(paper, env.mood.set, 0.55), 0.7));
  g.addColorStop(1, withAlpha(mixLab(paper, env.mood.set, 0.9), 0));
  c.fillStyle = g;
  c.fillRect(-POOL.r, -POOL.r, POOL.r * 2, POOL.r * 2);
  c.restore();
  // the grain of the paper top: a few long fibres, very faint
  c.strokeStyle = withAlpha(env.mood.ink, 0.05);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < 26; i++) {
    const y = -150 + i * 40 + ((i * 37) % 17);
    c.moveTo(-220, y);
    c.bezierCurveTo(300, y + 6, 800, y - 5, 1480, y + 3);
  }
  c.stroke();
  // vignette toward the desk's edges
  const v = c.createRadialGradient(POOL.x, POOL.y + 40, 260, POOL.x, POOL.y + 40, 820);
  v.addColorStop(0, withAlpha(env.mood.ink, 0));
  v.addColorStop(1, withAlpha(env.mood.ink, 0.8));
  c.fillStyle = v;
  c.fillRect(-220, -200, 1700, 1100);
  c.restore();
  // the desk's far edge: a thin bright lip where the lamplight catches it
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(DESK_EDGE[3].x, DESK_EDGE[3].y);
  c.lineTo(DESK_EDGE[2].x, DESK_EDGE[2].y);
  c.lineTo(DESK_EDGE[1].x, DESK_EDGE[1].y);
  c.stroke();
}

/** L4: a generic laptop, closed, pushed aside at the left (no logo, no lettering): a dark slab with a hinge line */
function laptop(c: C2, env: PaintEnv) {
  c.save();
  c.translate(LAPTOP.x, LAPTOP.y);
  c.rotate(LAPTOP.rot);
  // contact shadow
  c.fillStyle = withAlpha(env.mood.ink, 0.35);
  c.beginPath();
  c.roundRect(-LAPTOP.w / 2 + 8, -LAPTOP.h / 2 + 10, LAPTOP.w, LAPTOP.h, 14);
  c.fill();
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.25);
  c.beginPath();
  c.roundRect(-LAPTOP.w / 2, -LAPTOP.h / 2, LAPTOP.w, LAPTOP.h, 14);
  c.fill();
  // the hinge line near the top edge, and the lid's lamp-side edge catching light
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-LAPTOP.w / 2 + 10, -LAPTOP.h / 2 + 14);
  c.lineTo(LAPTOP.w / 2 - 10, -LAPTOP.h / 2 + 14);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(LAPTOP.w / 2, -LAPTOP.h / 2 + 14);
  c.lineTo(LAPTOP.w / 2, LAPTOP.h / 2 - 14);
  c.stroke();
  c.restore();
}

/** the index card: lamp-lit white card stock, a faint ruled head line, the typed question and attribution */
function card(c: C2, env: PaintEnv, p: { x: number; y: number; rot: number }) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.rot);
  const { w, h } = CARD;
  // contact shadow (soft, toward the lower left: the lamp is upper right)
  c.fillStyle = withAlpha(env.mood.ink, 0.28);
  c.beginPath();
  c.roundRect(-w / 2 - 6, -h / 2 + 8, w, h, 3);
  c.fill();
  const stock = mixLab('#f3ead6', env.mood.core, 0.25);
  c.fillStyle = stock;
  c.beginPath();
  c.roundRect(-w / 2, -h / 2, w, h, 3);
  c.fill();
  // the index card's head rule (one red-brown line, low chroma) and faint blue-grey ruling
  c.strokeStyle = withAlpha('#9a5b48', 0.45);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-w / 2, -h / 2 + 44);
  c.lineTo(w / 2, -h / 2 + 44);
  c.stroke();
  c.strokeStyle = withAlpha('#7d8a90', 0.18);
  c.lineWidth = 1;
  c.beginPath();
  for (let y = -h / 2 + 44 + 38; y < h / 2 - 8; y += 38) {
    c.moveTo(-w / 2 + 6, y);
    c.lineTo(w / 2 - 6, y);
  }
  c.stroke();
  // the typed text: Special Elite, struck unevenly (seeded per character, static)
  const ink = mixLab('#241a12', env.mood.ink, 0.2);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `400 29px ${FONT.typewriter}`, 29);
    c.font = `400 ${size}px ${FONT.typewriter}`;
    c.textBaseline = 'alphabetic';
    c.fillStyle = ink;
    const x0 = -w / 2 + 36;
    QUOTE.forEach((ln, i) => typed(c, ln, x0 + (i === 1 ? 14 : 0), -h / 2 + 44 + 38 * (i + 1) - 9, 17 + i * 31));
    const s2 = legibleSize(c, `400 24px ${FONT.typewriter}`, 24);
    c.font = `400 ${s2}px ${FONT.typewriter}`;
    typed(c, ATTRIB, w / 2 - 36 - c.measureText(ATTRIB).width, -h / 2 + 44 + 38 * 3 + 16, 77);
  });
  cardProbe(c, `${ID}-card`, -w / 2, -h / 2, w, h, 1, 1);
  c.restore();
}
/** typewriter strikes: each character a touch lighter or darker and off its line (seeded, static) */
function typed(c: C2, text: string, x: number, y: number, seed: number) {
  let cx = x;
  const base = c.globalAlpha;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const w = c.measureText(ch).width;
    const h1 = Math.sin((i + seed) * 12.9898) * 43758.5453;
    const r = h1 - Math.floor(h1);
    c.globalAlpha = base * (0.78 + 0.22 * r);
    c.fillText(ch, cx, y + (r - 0.5) * 1.2);
    cx += w;
  }
  c.globalAlpha = base;
}

/** L5: the lamp seen from above: its arm from the top-right corner, a conical shade, the bulb's lit inner lip toward
 *  the pool (world px of L5; soft, nearest the lens) */
function shade(c: C2, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  // the arm: two struts and a spring knuckle, leaving frame at the top right
  c.save();
  c.translate(SHADE.x, SHADE.y);
  c.rotate(-0.7);
  c.fillRect(SHADE.r * 0.7, -9, 260, 18);
  c.beginPath();
  c.arc(SHADE.r * 0.78, 0, 16, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the shade: an oval cone, its open mouth toward the pool (lower left)
  c.save();
  c.translate(SHADE.x, SHADE.y);
  c.rotate(0.6);
  c.beginPath();
  c.ellipse(0, 0, SHADE.r, SHADE.r * 0.78, 0, 0, Math.PI * 2);
  c.fill();
  // the mouth: the bulb's warm interior seen at a slant, and the lip catching it
  const g = c.createRadialGradient(-SHADE.r * 0.35, SHADE.r * 0.18, 0, -SHADE.r * 0.35, SHADE.r * 0.18, SHADE.r * 0.55);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#fff3d6', 0.4), 0.95));
  g.addColorStop(0.5, withAlpha(env.mood.halo, 0.55));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(-SHADE.r * 0.38, SHADE.r * 0.2, SHADE.r * 0.5, SHADE.r * 0.36, 0.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(-SHADE.r * 0.38, SHADE.r * 0.2, SHADE.r * 0.5, SHADE.r * 0.36, 0.2, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
