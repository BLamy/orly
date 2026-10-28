/**
 * ch08-s05 — THE CHECKER THAT SHARED THE BUG (plate, winterBlue cold grey light; cut in from s04's plate; 19.17 s).
 *   L0808  "In July, a checker for the lab's compiler reported zero mismatches. The compiled code skipped an early
 *           return, and so did the checker."
 *   L0808a "As the docs warn, “That the two evaluators agree doesn't show that a program does what the JavaScript it
 *           replaces did.”"
 *
 * A fresh plate in the same cold room (sets/ch08-s04-plate).
 *   code (0.40)       the tiny program inks in on a code card, x = 2 on a tag at its left; two paper tickets print below
 *                     it: JavaScript 3 (left lane) and, under a small copy of the program (the compiled one), compiled 4
 *   checker (1.73)    between the tickets, a paper checker with a dial gauge: its needle settles firmly on 0 mismatches
 *                     (a soft click again on 'zero')
 *   skipped (7.02)    the early return (return x + 1) is ringed in copper on the code card, and on the compiled side a
 *                     black ink blot lands over that same return
 *   did (9.03)        a small push in: the checker's face folds down: inside it, a small copy of the compiled card carrying
 *                     an identical black blot in the identical place (the checker's interpreter made the same mistake).
 *                     The two blots are one stamp, the same shape and the same black, never red.
 *   agree (12.92)     as the docs' warning is read, a small pinned parchment plate slides in beside the checker, its edges
 *                     overlapping: “two evaluators agree” — the docs; the camera pulls out to fit both. A short hold.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { PLATE_CAM, PLATE_INK, P_BRASS, P_COPPER, P_INK, pInk, plateNear, plateRoom } from '../sets/ch08-s04-plate';

const ID = 'ch08-s05';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the program (script ch08-s05 equation)
const CODE = 'if (true) { return x + 1 } return x + 2';
const EARLY = 'return x + 1';
const PRE = 'if (true) { ';

// ---------------------------------------------------------------- layout (sheet rest px)
const MAIN = { x: 640, y: 92, s: 1 };
const COPY = { x: 992, y: 222, s: 0.5 };
const INSIDE = { x: 640, y: 420, s: 0.4 };
const TICKET_L = { x: 288, y: 330 };
const TICKET_R = { x: 992, y: 356 };
const CHECK = { x: 640, y: 420, w: 284, h: 252 };
const GAUGE = { x: 640, y: 404, r: 80 };
const DOCS = { x: 872, y: 584, w: 364, h: 118 };
const CODE_SIZE = 28;
/** the code card starts inking right after the cut (no blank parchment) */
const CODE_AT = 0.1;
/** the ring round the early return: metallic copper (never the red pencil's red), with a thin brass highlight */
const RING_COPPER = '#b0702f';
const RING_BRASS = '#d8b46a';
/** the checker's paper flip on 'so' (scaleX 1 → 0 → 1, as Device 4's tags flip) */
const FLIP_D = 0.5;

/** a camera (lens 1) whose screen centre lands on plate point (px, py) at depth z, at plate scale k = 1300/(1300 - z) */
function aimAt(px: number, py: number, z: number): Camera3 {
  const probe = (x: number, y: number) => toScreen(PLATE_INK, { x, y, z, lens: 1 }, px, py);
  const a = probe(0, 0), bx = probe(100, 0), by = probe(0, 100);
  const dx = (bx.x - a.x) / 100, dy = (by.y - a.y) / 100;
  return { x: (640 - a.x) / dx, y: (360 - a.y) / dy, z, lens: 1 };
}
/** the pushed framing on the two blots side by side: the compiled copy (top right) and the checker's back, both whole;
 *  the JavaScript ticket's text and the x = 2 tag stay wholly out of frame (plate x ~369-1251, y ~132-628) */
const PUSH = aimAt(810, 380, 403);

type Key = [number, number, number];
function hk(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, m0] = keys[i], [t1, v1, m1] = keys[i + 1];
    if (t <= t1) {
      const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
    }
  }
  return keys[keys.length - 1][1];
}

interface Beats {
  D: number;
  code: number;
  zero: number;
  zeroWord: number;
  mism: number;
  compiled: number;
  skip: number;
  bug: number;
  agree: number;
}

function camAt(t: number, b: Beats): Camera3 {
  // the push starts with the checker's flip on 'so'; the pull-out starts at 12.0 s so the docs plate lands in the wide
  const p0 = b.bug - 0.1, p1 = b.bug + 1.3, q0 = 12.0, q1 = 13.5;
  const z = hk([[0, PLATE_CAM.z, 0], [p0, PLATE_CAM.z + 10, 0], [p1, PUSH.z, 0], [q0, PUSH.z + 6, 0], [q1, -10, 0], [b.D, 0, 0]], t);
  const x = hk([[0, 640, 0], [p0, 640, 0], [p1, PUSH.x, 0], [q0, PUSH.x + 1, 0], [q1, 664, 0], [b.D, 665, 0]], t);
  const y = hk([[0, PLATE_CAM.y, 0], [p0, PLATE_CAM.y + 2, 0], [p1, PUSH.y, 0], [q0, PUSH.y + 1, 0], [q1, 372, 0], [b.D, 371, 0]], t);
  return { x, y, z, lens: 1 };
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      code: T.beat('code'),
      zero: T.beat('zero'),
      zeroWord: T.word('L0808', 'zero'),
      mism: T.word('L0808', 'mismatches'),
      compiled: T.word('L0808', 'compiled'),
      skip: T.beat('skip'),
      bug: T.beat('bug'),
      agree: T.beat('q038'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);
    const cam = camAt(t, b);
    f.camera(cam);
    plateRoom(f, { key: ID });
    f.layer(PLATE_INK, (c, env) => {
      const inkA = win(t, CODE_AT - 0.05, CODE_AT + 0.35);
      // the code card, x = 2 on its tag; the ring round the early return on 'skipped'
      codeCard(c, env, MAIN, inkA, 'subject', 0, `${ID}-code`, t, CODE_AT);
      xTag(c, env, t, b);
      ring(c, env, t, b);
      // the lanes: down-left to JavaScript's ticket, down-right through the compiled copy to its ticket
      lanes(c, env, t, b);
      const pr = win(t, b.code + 0.55, b.code + 1.25);
      codeCard(c, env, COPY, pr, 'texture', blotU(t, b.skip + 0.15), '', t, -1);
      ticket(c, env, TICKET_L, 'JavaScript', '3', t, b.code + 0.75, `${ID}-tl`);
      // on 'compiled' its ticket lifts a hair (about 6 px) off the plate
      const lift = 6 * win(t, b.compiled - 0.1, b.compiled + 0.25) * (1 - 0.5 * win(t, b.compiled + 1.2, b.compiled + 2));
      ticket(c, env, { x: TICKET_R.x, y: TICKET_R.y - lift }, 'compiled', '4', t, b.code + 0.95, `${ID}-tr`, lift);
      // the checker (its face folds down on 'did' to show the same blot inside)
      checker(c, env, t, tq, b);
      // the docs' warning, pinned beside it on 'agree'
      docsPlate(c, env, t, b);
    });
    plateNear(f, ID);
  },
});

/** the blot's landing (0..1, a quick splat) */
const blotU = (t: number, at: number) => win(t, at, at + 0.18);

// ---------------------------------------------------------------- painters (sheet rest px, on PLATE_INK)
function codeMetrics(c: C2, s: number, role: 'subject' | 'texture') {
  const size = role === 'subject' ? legibleSize(c, `500 ${CODE_SIZE}px ${FONT.mono}`, CODE_SIZE) : CODE_SIZE * s;
  c.font = `500 ${size}px ${FONT.mono}`;
  const w = c.measureText(CODE).width;
  const pre = c.measureText(PRE).width;
  const early = c.measureText(EARLY).width;
  return { size, w, pre, early, cw: w + size * 1.6, ch: size * 2.3 };
}

/** a code card (the program in a code face) at a placement; blot 0..1 = the black ink blot over the early return */
function codeCard(c: C2, env: PaintEnv, at: { x: number; y: number; s: number }, a: number, role: 'subject' | 'texture', blot: number, id: string, t: number, inkAt: number) {
  if (a <= 0.003) return;
  c.save();
  const m = codeMetrics(c, at.s, role);
  const x0 = at.x - m.cw / 2, y0 = at.y - m.ch / 2;
  const paper = role === 'subject' ? Math.min(a, cardPaperAlpha(t, inkAt + 0.03, 0.3)) : a;
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.16);
  c.fillRect(x0 + 3, y0 + 4, m.cw, m.ch);
  c.fillStyle = mixLab('#f8f4ea', env.mood.core, 0.22);
  c.fillRect(x0, y0, m.cw, m.ch);
  c.strokeStyle = withAlpha(P_INK, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(x0, y0, m.cw, m.ch);
  c.globalAlpha = 1;
  const tx = at.x - m.w / 2, ty = at.y + m.size * 0.35;
  const ink = role === 'subject' ? clamp01((t - (inkAt + 0.03)) / 0.12) * a : a;
  textRole(c, role, () => {
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(P_INK, ink);
    c.fillText(CODE, tx, ty);
  });
  if (role === 'subject') cardProbe(c, id, x0, y0, m.cw, m.ch, paper, ink);
  if (blot > 0.003) inkBlot(c, tx + m.pre + m.early / 2, ty - m.size * 0.32, m.early * 0.56, m.size * 0.82, blot);
  c.restore();
}

/** ONE stamp: the same blot shape (seeded), the same black, scaled to the span it covers */
function inkBlot(c: C2, x: number, y: number, rx: number, ry: number, u: number) {
  const k = 0.4 + 0.6 * u + 0.08 * Math.sin(u * Math.PI);
  c.save();
  c.fillStyle = withAlpha('#0d0c0b', 0.94 * clamp01(u * 3));
  c.beginPath();
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.16 * hash1(i % n, 808) + 0.08 * Math.sin(a * 3 + 1.2);
    const px = x + Math.cos(a) * rx * k * wob, py = y + Math.sin(a) * ry * k * wob;
    if (i) c.lineTo(px, py);
    else c.moveTo(px, py);
  }
  c.closePath();
  c.fill();
  // two splash droplets, the same each time
  for (const [dx, dy, r] of [[1.15, -0.55, 0.12], [-1.1, 0.6, 0.09]] as const) {
    c.beginPath();
    c.arc(x + dx * rx * k, y + dy * ry * k, r * ry * 2 * k, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** x = 2, on a small paper tag tied to the code card's left end */
function xTag(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.code + 0.2, b.code + 0.6);
  if (a <= 0.003) return;
  const m = codeMetrics(c, 1, 'subject');
  const ax = MAIN.x - m.cw / 2 + 10, ay = MAIN.y + m.ch / 2;
  const sw = 0.04 * Math.sin(q2(t) * 1.6);
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = withAlpha(P_INK, 0.7);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(ax, ay - 4);
  c.quadraticCurveTo(ax - 30, ay + 18, ax - 40, ay + 34);
  c.stroke();
  c.translate(ax - 40, ay + 34);
  c.rotate(-0.12 + sw);
  const w = 96, h = 52;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.16);
  c.fillRect(-w / 2 + 2, 3, w, h);
  c.fillStyle = mixLab('#e9d9b6', env.mood.core, 0.2);
  c.beginPath();
  c.moveTo(-w / 2 + 12, 0);
  c.lineTo(w / 2 - 12, 0);
  c.lineTo(w / 2, 12);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.lineTo(-w / 2, 12);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(P_INK, 0.8);
  c.beginPath();
  c.arc(0, 7, 2.4, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  pInk(c, 'x = 2', 0, 40, { font: 'monoBold', size: 24, alpha: a, align: 'center', id: `${ID}-x` });
  c.restore();
}

/** the copper ring round the early return on the code card (drawn on, on 'skipped') */
function ring(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = win(t, b.skip - 0.1, b.skip + 0.4);
  if (u <= 0.003) return;
  const m = codeMetrics(c, 1, 'subject');
  const tx = MAIN.x - m.w / 2;
  const cx = tx + m.pre + m.early / 2, cy = MAIN.y - m.size * 0.0;
  const rx = m.early / 2 + 10, ry = m.size * 0.9;
  c.save();
  c.strokeStyle = RING_COPPER;
  c.lineWidth = 2.8;
  c.lineCap = 'round';
  c.beginPath();
  const a0 = -Math.PI * 0.6;
  c.ellipse(cx, cy, rx, ry, -0.02, a0, a0 + Math.PI * 2.08 * u);
  c.stroke();
  // the brass highlight along its inner upper edge, where the window light catches the metal
  c.strokeStyle = withAlpha(RING_BRASS, 0.85);
  c.lineWidth = 0.9;
  c.beginPath();
  const hEnd = Math.min(a0 + Math.PI * 2.08 * u, a0 + Math.PI * 0.9);
  if (hEnd > a0 + 0.02) {
    c.ellipse(cx, cy, rx - 1.6, ry - 1.6, -0.02, a0, hEnd);
    c.stroke();
  }
  c.restore();
}

/** fine leader lines from the program down each lane */
function lanes(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.code + 0.45, b.code + 0.9);
  if (a <= 0.003) return;
  const m = codeMetrics(c, 1, 'subject');
  c.save();
  c.strokeStyle = withAlpha(P_INK, 0.42 * a);
  c.lineWidth = 1.1;
  c.setLineDash([5, 5]);
  c.beginPath();
  c.moveTo(MAIN.x - m.cw * 0.3, MAIN.y + m.ch / 2 + 4);
  c.quadraticCurveTo(TICKET_L.x, MAIN.y + 110, TICKET_L.x, TICKET_L.y - 74);
  c.moveTo(MAIN.x + m.cw * 0.3, MAIN.y + m.ch / 2 + 4);
  c.quadraticCurveTo(COPY.x, MAIN.y + 60, COPY.x, COPY.y - 26);
  c.moveTo(COPY.x, COPY.y + 26);
  c.lineTo(COPY.x, TICKET_R.y - 74);
  c.stroke();
  c.setLineDash([]);
  // the two tickets feed the checker (it compares their answers)
  c.strokeStyle = withAlpha(P_INK, 0.55 * a);
  c.beginPath();
  c.moveTo(TICKET_L.x + 102, TICKET_L.y + 10);
  c.quadraticCurveTo(470, TICKET_L.y + 60, CHECK.x - CHECK.w / 2, CHECK.y - 10);
  c.moveTo(TICKET_R.x - 102, TICKET_R.y + 10);
  c.quadraticCurveTo(820, TICKET_R.y + 50, CHECK.x + CHECK.w / 2, CHECK.y - 10);
  c.stroke();
  c.restore();
}

/** a paper ticket, printed out of a slot (it grows down from the slot line): lane name and the answer */
function ticket(c: C2, env: PaintEnv, at: { x: number; y: number }, name: string, value: string, t: number, start: number, id: string, lift = 0) {
  const u = win(t, start, start + 0.55);
  if (u <= 0.003) return;
  const w = 204, h = 132;
  const x0 = at.x - w / 2, top = at.y - h / 2;
  c.save();
  // the slot
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x0 - 10, top - 6, w + 20, 6);
  c.beginPath();
  c.rect(x0 - 6, top, w + 12, h * u + 6);
  c.clip();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.16 + 0.012 * lift);
  c.fillRect(x0 + 3 + lift * 0.5, top + 4 + lift, w, h);
  c.fillStyle = mixLab('#f4ecdb', env.mood.core, 0.24);
  c.fillRect(x0, top, w, h);
  // a torn bottom edge and a perforation under the slot
  c.strokeStyle = withAlpha(P_INK, 0.3);
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(x0 + 6, top + 8);
  c.lineTo(x0 + w - 6, top + 8);
  c.stroke();
  c.setLineDash([]);
  pInk(c, name, at.x, top + 46, { font: 'italic', size: 26, align: 'center', id: `${id}-n` });
  pInk(c, value, at.x, top + 110, { font: 'monoBold', size: 52, align: 'center', id: `${id}-v` });
  cardProbe(c, id, x0, top, w, h * u, 1, 1);
  c.restore();
}

/**
 * The checker: a paper box with a dial gauge (mismatches). On 'so' it does a paper flip (scaleX 1 → 0 → 1, on twos, the
 * same grammar as Device 4's tag flips) to show its BACK: an open panel and, inside, its own interpreter running a small
 * copy of the compiled card, with the identical black blot in the identical place.
 */
function checker(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const a = win(t, b.zero - 0.35, b.zero + 0.15);
  if (a <= 0.003) return;
  const { x, y, w, h } = CHECK;
  const x0 = x - w / 2, y0 = y - h / 2;
  const flipU = clamp01((tq - (b.bug - 0.05)) / FLIP_D);
  const sx = Math.cos(Math.PI * flipU);
  const back = sx < 0;
  c.save();
  c.globalAlpha = a;
  // the shadow on the plate keeps the box's full width (the box turns in place, its footprint does not)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(x0 + 5, y0 + 6, w, h);
  c.translate(x, y);
  c.scale(Math.max(0.03, Math.abs(sx)), 1);
  c.translate(-x, -y);
  // the box body
  c.fillStyle = mixLab('#2a2622', env.mood.ink, 0.25);
  c.fillRect(x0, y0, w, h);
  if (!back) face(c, env, t, tq, b, a);
  else {
    // the back: an open panel with four rivets; inside, the checker's own interpreter and its copy of the compiled card
    c.fillStyle = mixLab('#46403a', env.mood.set, 0.3);
    c.fillRect(x0 + 12, y0 + 12, w - 24, h - 24);
    const g = c.createRadialGradient(x, y - 10, 10, x, y, w * 0.7);
    g.addColorStop(0, withAlpha('#f3efe4', 0.3));
    g.addColorStop(1, withAlpha('#f3efe4', 0));
    c.fillStyle = g;
    c.fillRect(x0 + 12, y0 + 12, w - 24, h - 24);
    c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
    for (const [rx, ry] of [[x0 + 6, y0 + 6], [x0 + w - 6, y0 + 6], [x0 + 6, y0 + h - 6], [x0 + w - 6, y0 + h - 6]]) {
      c.beginPath();
      c.arc(rx, ry, 2.6, 0, Math.PI * 2);
      c.fill();
    }
    codeCard(c, env, INSIDE, 1, 'texture', blotU(t, b.bug + 0.5), '', t, -1);
  }
  c.restore();
}

/** the checker's face: its label, the gauge with the needle firmly on 0 mismatches */
function face(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, a: number) {
  const { x, y, w, h } = CHECK;
  const x0 = x - w / 2, y0 = y - h / 2;
  c.fillStyle = mixLab('#efe6d1', env.mood.core, 0.22);
  c.fillRect(x0 + 4, y0 + 4, w - 8, h - 8);
  c.strokeStyle = withAlpha(P_INK, 0.4);
  c.lineWidth = 0.8;
  c.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
  pInk(c, 'checker', x, y0 + 40, { font: 'sc', size: 27, alpha: a, align: 'center', id: `${ID}-ck` });
  // the gauge: a half dial, 0 at the left, ticks 1, 2, 3 round to the right
  const { r } = GAUGE;
  const gx = GAUGE.x, gy = GAUGE.y + 28;
  c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
  c.beginPath();
  c.arc(gx, gy, r + 5, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab('#f7f2e6', env.mood.core, 0.25);
  c.beginPath();
  c.arc(gx, gy, r, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  c.strokeStyle = P_INK;
  c.lineWidth = 1.6;
  c.beginPath();
  for (let i = 0; i <= 3; i++) {
    const an = Math.PI + (i / 3) * Math.PI;
    c.moveTo(gx + Math.cos(an) * (r - 12), gy + Math.sin(an) * (r - 12));
    c.lineTo(gx + Math.cos(an) * (r - 2), gy + Math.sin(an) * (r - 2));
  }
  c.stroke();
  pInk(c, '0', gx - r + 22, gy - 9, { font: 'monoBold', size: 25, alpha: a, align: 'center', id: `${ID}-g0` });
  // the needle: in from rest, it settles firmly on 0 at 'checker' (on twos); on 'zero' it lifts a hair, trembles and
  // settles back on 0 (the soft click)
  const settle = clamp01((tq - (b.zero - 0.3)) / 0.5);
  const d = tq - b.zeroWord;
  const tremble = d < -0.12 ? 0 : d < 0 ? 0.16 * ((d + 0.12) / 0.12) : 0.16 * Math.exp(-d * 4.5) * Math.abs(Math.cos(d * 24));
  const ang = Math.PI + 0.06 + (1 - settle) * 0.9 * Math.cos(settle * 7) * (1 - settle) + tremble;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(gx, gy);
  c.lineTo(gx + Math.cos(ang) * (r - 10), gy + Math.sin(ang) * (r - 10));
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(gx, gy, 5, 0, Math.PI * 2);
  c.fill();
  // the legend inks on its word
  pInk(c, 'mismatches', x, gy + 38, { font: 'italic', size: 26, alpha: a * win(t, b.mism - 0.05, b.mism + 0.35), align: 'center', id: `${ID}-mm` });
}

/** Deep Dive I's docs plate, pinned beside the checker, overlapping its edge: “two evaluators agree” — the docs */
function docsPlate(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.agree + 0.05;
  const slide = win(t, b.agree - 0.35, b.agree + 0.15);
  const paper = cardPaperAlpha(t, inkAt, 0.3);
  if (paper <= 0.003) return;
  const ink = clamp01((t - inkAt) / 0.12);
  const by = win(t, inkAt + 0.35, inkAt + 0.85);
  c.save();
  c.translate(DOCS.x + (1 - slide) * 60, DOCS.y);
  c.rotate(-0.025);
  const { w, h } = DOCS;
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
  // deckled parchment, a touch warmer and older than the plate it is pinned to
  c.fillStyle = mixLab('#e8d8b4', env.mood.core, 0.14);
  c.beginPath();
  for (let i = 0; i <= 24; i++) c.lineTo(-w / 2 + (w * i) / 24, -h / 2 + 1.6 * hash1(i, 71));
  for (let i = 0; i <= 10; i++) c.lineTo(w / 2 + 1.6 * hash1(i, 73), -h / 2 + (h * i) / 10);
  for (let i = 24; i >= 0; i--) c.lineTo(-w / 2 + (w * i) / 24, h / 2 + 1.6 * hash1(i, 75));
  for (let i = 10; i >= 0; i--) c.lineTo(-w / 2 + 1.6 * hash1(i, 77), -h / 2 + (h * i) / 10);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(P_INK, 0.3);
  c.lineWidth = 0.8;
  c.stroke();
  // the pin
  c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.25);
  c.beginPath();
  c.arc(-w / 2 + 14, -h / 2 + 12, 4, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  textRole(c, 'subject', () => {
    const s1 = legibleSize(c, `italic 400 28px ${FONT.text}`, 28);
    c.font = `italic 400 ${s1}px ${FONT.text}`;
    c.fillStyle = withAlpha(P_INK, ink);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const q = '“two evaluators agree”';
    c.fillText(q, 0, -4);
    const qw = c.measureText(q).width;
    textProbe(c, `${ID}-docsq`, -qw / 2, -4 - s1 * 0.8, qw, s1, ink);
    const s2 = legibleSize(c, `600 20px ${FONT.sc}`, 20, '— the docs');
    c.font = `600 ${s2}px ${FONT.sc}`;
    c.fillStyle = withAlpha(mixLab(P_INK, '#4a3626', 0.4), by);
    c.textAlign = 'right';
    c.fillText('— the docs', w / 2 - 22, h / 2 - 18);
    textProbe(c, `${ID}-docsby`, w / 2 - 22 - c.measureText('— the docs').width, h / 2 - 18 - s2 * 0.8, c.measureText('— the docs').width, s2, by);
  });
  cardProbe(c, `${ID}-docs`, -w / 2, -h / 2, w, h, paper, ink);
  c.restore();
}
