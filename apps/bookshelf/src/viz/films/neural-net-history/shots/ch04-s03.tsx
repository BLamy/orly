/**
 * ch04-s03 — the book's shadow becomes night: an open paper field at dusk turning to night, 1969; snow begins
 * (duskRose → winterBlue tint crossfade in, 1.2 s, no dip; 10.63 s; no figures).
 *
 *   MATCH CUT         the shot opens on s02's last framing of the PERCEPTRONS book (the same book, sets/ch04-s02-book,
 *                     at the same screen position and size), so the crossfade carries one object. Holding still
 *                     through the dissolve, the camera then PULLS BACK and TRUCKS RIGHT (log dolly, 0.4 → 2.8 s): the
 *                     field, the tree line and the near fence open out in three planes, and the book settles at the
 *                     field's left edge.
 *   'shadow' (0.2)    the tint settles into winterBlue. The low sun is a visible warm-to-cold disc on the horizon
 *                     just right of the book's top edge; through the line it sinks behind the book, cooling. The
 *                     book's shadow (a cast shadow, feathered at its far end) runs right across the field, and the
 *                     night follows its leading edge: the sky and the field darken from left to right as it passes.
 *                     A brighter horizon band holds the bare tree line crisp until the night takes it. Date 1969.
 *   'award' (0.7)     silent: a small card drifts down on a thread like a falling leaf and hangs in the upper third:
 *                     1969 · Turing Award: / Marvin Minsky, with a tiny laurel (a plain fact of the year).
 *   'Congress'        a second card drifts down beside it: the funding law's own words, verbatim —
 *                     “a direct and apparent relationship” — US Congress, Mansfield Amendment, 1969
 *   'snow' (5.49)     the first flakes: three seeded layers (L1 small and slow, L4 medium, L5 large), density ramping
 *                     up through the hold. Snow is mood, never data.
 * Round-1 revision: the KEY IMAGE is now on screen: a long cast shadow (set ink, 0.85) anchored at the book's
 * footprint stretches right along the ground, fanning toward us; its feathered far edge travels from just past the
 * book (0.2 s) off the right of frame by 'snow' (ease.move), and the sky and field darken in lockstep behind it, so
 * the shadow visibly BECOMES the night. The Mansfield card is ~15% wider with its attribution at the legibility
 * floor; both cards sway on their threads like hung paper (~1.5°, 3.5 s, seeded phase); the near (L5) flakes
 * ramp to ~2× density over the hold, still blurred. The book is s02's bound book (S02_BOOK_BOUND proportions).
 * Planes: L0 sky + sun · L1 far trees, far snow · L2 tree line · L3 field · L4 book, shadow, cards · L5 fence and grass
 * (right) · L6 a blurred grass edge (lower left, set in once the dolly has settled).
 */
import { Timeline, ease } from '../../../core';
import { FONT, LAYERS, defineShot, forestBand, legibleSize, mixLab, overscan, toLayer, toScreen, tree, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { clamp01, dateStamp, mixCam, sm, snowfall, tq12, typedCard, win } from '../sets/ch04-s01-kit';
import { BOOK_DEPTH, bookBody, bookGeom, bookTitle, s02BookOnScreen } from '../sets/ch04-s02-book';

const ID = 'ch04-s03';
type C = CanvasRenderingContext2D;

const HORIZON = 478;
const GROUND = 612; // the book's base line on the field
/** the same book as s02 (agreed proportions), standing at the field's left edge */
const BOOK0 = bookGeom(64, GROUND, 330);
/** s02's bound book: the page block 1.5× (S02_BOOK_BOUND), the bevelled spine */
const BOOK = { ...BOOK0, depth: BOOK0.w * BOOK_DEPTH * 1.5 };
// the match: the camera at which this book lands exactly where s02's last frame left it
const S02 = s02BookOnScreen();
const K0 = S02.h / BOOK.h;
const C0: Camera3 = { x: BOOK.x - (S02.x - 640) / K0, y: BOOK.top - (S02.top - 360) / K0, z: 1000 - 1000 / K0, lens: 1 };
const C1: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const C2: Camera3 = { x: 684, y: 354, z: 32, lens: 1 };
const CAMS = [C0, C1, C2];
const PULL = [0.4, 2.8] as const;
function camAt(t: number): Camera3 {
  if (t < PULL[1]) return mixCam(C0, C1, sm((t - PULL[0]) / (PULL[1] - PULL[0])));
  return mixCam(C1, C2, sm((t - PULL[1]) / 7.8));
}

interface Beats {
  D: number;
  award: number;
  congress: number;
  snow: number;
  winter: number;
  first: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      D: T.duration,
      award: T.beat('award'),
      congress: T.beat('congress'),
      snow: T.beat('snow'),
      winter: T.word('L0406', 'winter'),
      first: T.word('L0406', 'first'),
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as Beats;
    if (t < 1.2) f.setMood('winterBlue', { from: 'duskRose', u: sm(Math.max(0, t) / 1.2) });
    const cam = camAt(t);
    f.camera(cam);
    // the shadow's far edge (screen x): just past the book at 0.2 s, off the right of frame by 'snow' (ease.move)
    const bookRight = toScreen(LAYERS.L4, cam, BOOK.x + BOOK.w + BOOK.depth, GROUND).x;
    const shU = ease.move(clamp01((t - 0.2) / (b.snow - 0.2)));
    const tipX = bookRight + 60 + (1420 - (bookRight + 60)) * shU;
    // dusk → night IN LOCKSTEP with the shadow (it is the night), then a last deepening through the hold
    const night = 0.8 * shU + 0.2 * win(t, b.snow, b.D - 0.3);
    // the sun hangs just right of the book's top corner (screen) through the pull-back, then sinks behind the book
    // and below the field, cooling
    const sink = win(t, 2.6, b.winter + 0.4);
    const corner = toScreen(LAYERS.L4, cam, BOOK.x + BOOK.w + BOOK.depth, BOOK.top);
    const sun = { x: corner.x + 48 - 150 * sink, y: HORIZON - 36 + 96 * sink };
    f.backlight({ sunX: sun.x, sunY: sun.y, sunRadius: 600 - 220 * night, intensity: 1 - 0.7 * night });
    // the shadow's length in L4 px (the night follows its leading edge)
    const L = Math.max(20, toLayer(LAYERS.L4, cam, tipX, 0).x - (BOOK.x + BOOK.w + BOOK.depth));
    skyPlane(f, sun, sink, night, tipX);
    // the snow ramps over 2.5 s from 'snow' so density is clearly building by 'first AI winter'
    const RAMP = 2.5;
    const snowCol = (env: PaintEnv, k: number) => mixLab(env.mood.rim, env.mood.core, k);

    // L1: far, small, slow snow, and the far tree row (hazed, small)
    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, CAMS, 40);
      f.cached(`${ID}/farTrees/${env.mood.id}/${Math.round(r.x)}`, Math.ceil(r.w), 120, (cc) => {
        cc.translate(-r.x, -(HORIZON - 90));
        forestBand(cc, { x0: r.x, x1: r.x + r.w, y: HORIZON - 2, h: 34, kind: 'bare', density: 1.6, seed: 71, ground: 40 }, env);
      })(c, r.x, HORIZON - 90);
      snowfall(c, { x: r.x, y: -40, w: r.w, h: 560, t, n: 240, start: b.snow, ramp: RAMP, r0: 1.0, r1: 2.0, fall: 16, wind: 5, seed: 11, color: snowCol(env, 0.4), alpha: 0.9 });
    });
    // L2: the bare winter tree line along the horizon, the nearest rank in more ink, crisp against the band
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 40);
      const inky: PaintEnv = { ...env, fill: (role) => (role === 'set' || role === 'ink' ? mixLab(env.fill('set'), env.fill('ink'), 0.55) : env.fill(role)) };
      f.cached(`${ID}/trees3/${env.mood.id}/${Math.round(r.x)}`, Math.ceil(r.w), 260, (cc) => {
        cc.translate(-r.x, -(HORIZON - 220));
        cc.fillStyle = inky.fill('set');
        cc.beginPath();
        cc.moveTo(r.x, HORIZON + 40);
        for (let x = r.x; x <= r.x + r.w; x += 10) cc.lineTo(x, HORIZON + 6 - 5 * Math.sin(x * 0.006) - 3 * Math.sin(x * 0.019 + 1));
        cc.lineTo(r.x + r.w, HORIZON + 40);
        cc.closePath();
        cc.fill();
        for (const tr of TREES) {
          if (tr.x < r.x - 100 || tr.x > r.x + r.w + 100) continue;
          tree(cc, { x: tr.x, y: HORIZON + 8 - 5 * Math.sin(tr.x * 0.006), h: tr.h, kind: tr.kind, seed: tr.seed, detail: 0.85, lean: tr.lean, snow: 0.4 }, inky);
        }
      })(c, r.x, HORIZON - 220);
    });
    // a thin fog band where the tree line meets the field (thin, so the trees stay crisp)
    f.fog({ yCenter: HORIZON + 14, height: 90, alpha: 0.2, drift: 5 });

    // L3: the long paper field (drift ridgelines, not a grid), its low sheen falling with the night
    f.layer('L3', (c, env) => {
      field(f, c, env);
      fieldSheen(c, env, sun, night);
    });
    f.fog('B');

    // L4: the night (following the shadow), the shadow, the book, the hanging cards
    f.layer('L4', (c, env) => {
      nightFall(f, c, win(t, b.snow - 0.5, b.D - 0.3), tipX);
      bookShadow(c, env, L, cam);
      // the medium snow: the density visibly builds from 'snow' to 'first AI winter'
      snowfall(c, { x: -200, y: -60, w: 1700, h: 820, t, n: 300, start: b.snow + 0.1, ramp: RAMP, r0: 2.4, r1: 4.4, fall: 32, wind: 8, seed: 12, color: snowCol(env, 0.55), alpha: 1 });
      bookBody(f, c, BOOK, env, ID, { rim: 1.4, spine: 0.8 });
      // the cut word carries s02's light through the dissolve, then cools to an ember (texture: the cards carry the words)
      bookTitle(c, BOOK, env, (0.3 + 0.5 * (1 - win(t, 0.3, 1.4))) * (1 - 0.3 * night), { leak: 0.1 });
      cards(c, env, tq, b, cam);
    });
    // L5: near grass and a leaning fence post at the bottom right (blurred); the large, near-lens flakes
    f.layer('L5', (c, env) => {
      nearFence(f, c, env);
      const r = overscan(LAYERS.L5, [C1, C2], 60);
      snowfall(c, { x: r.x, y: -80, w: r.w, h: 900, t, n: 60, start: b.snow + 0.3, ramp: RAMP, r0: 7, r1: 14, fall: 62, wind: 14, seed: 13, color: snowCol(env, 0.6), alpha: 0.85, hardness: 0.1 });
      // the near band keeps building through the hold: a second set ramps in, ~2× density by the last frame
      snowfall(c, { x: r.x, y: -80, w: r.w, h: 900, t, n: 64, start: b.snow + RAMP, ramp: Math.max(0.5, b.D - 0.3 - (b.snow + RAMP)), r0: 7, r1: 13, fall: 58, wind: 13, seed: 113, color: snowCol(env, 0.6), alpha: 0.85, hardness: 0.1 });
    });
    // L6: a soft grass edge crossing the lower-left corner, set in once the dolly is close to rest
    const l6 = 1 - sm((cam.z - 40) / 80);
    if (l6 > 0.01) f.layer('L6', (c, env) => grassEdge(f, c, env, l6));

    dateStamp(f.c, f.mood, t, 0.2, b.congress + 2.4, '1969');
  },
});

/** the horizon tree line: bare oaks, elms and birches of varied heights (layer px, L2) */
const TREES: { x: number; h: number; kind: 'oak' | 'elm' | 'birch'; seed: number; lean: number }[] = (() => {
  const out: { x: number; h: number; kind: 'oak' | 'elm' | 'birch'; seed: number; lean: number }[] = [];
  let x = -260;
  let i = 0;
  while (x < 1640) {
    const u = (hash1(i, 31) + 1) / 2;
    const kind = u < 0.45 ? 'oak' : u < 0.75 ? 'elm' : 'birch';
    const big = (hash1(i, 32) + 1) / 2;
    out.push({ x, h: 52 + 150 * big * big, kind, seed: 690 + i, lean: 0.06 * hash1(i, 33) });
    x += 70 + 150 * ((hash1(i, 34) + 1) / 2);
    i++;
  }
  return out;
})();

// ================================================================================================= pieces
function hangCard(tq: number, at: number, x: number, y: number, seed: number, dur: number) {
  // drop from above the frame with a falling-leaf side-drift, settle with a damped sway (on twos)
  const u = clamp01((tq - at) / dur);
  const e = 1 - Math.pow(1 - u, 3);
  const settle = tq - at - dur;
  // hung paper: after the landing's damped swing, a slow pendulum (~1.5°, 3.5 s period, seeded phase)
  const pend = 0.026 * Math.sin((tq / 3.5) * Math.PI * 2 + seed * 2.7);
  const sway = settle > 0 ? 0.05 * Math.exp(-settle * 0.9) * Math.sin(settle * 3.1 + seed) + pend * (1 - Math.exp(-settle * 1.2)) : 0.12 * Math.sin(u * 7 + seed) * (1 - u);
  return { x: x + 26 * Math.sin(u * 5 + seed) * (1 - e), y: -220 + (y + 220) * e, rot: sway, a: u > 0 ? 1 : 0 };
}

/** a tiny open laurel wreath at the card's left (no face, no medal): two curved sprays of paired leaves */
function laurel(c: C, x: number, y: number, rot: number, a: number, env: PaintEnv, hw: number, hh: number) {
  c.save();
  c.globalAlpha *= a;
  // follow the card's sway (it pivots at its top edge, hh above its centre)
  c.translate(x, y - hh);
  c.rotate(rot);
  c.translate(-(hw - 30), hh + 6);
  const ink = withAlpha(mixLab(env.mood.ink, '#2a1d14', 0.4), 0.75);
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineWidth = 1.3;
  for (const s of [-1, 1]) {
    // the stem: an arc from the bottom up one side
    c.beginPath();
    for (let i = 0; i <= 12; i++) {
      const th = Math.PI / 2 + s * (0.25 + (i / 12) * 2.3);
      const px = Math.cos(th) * 17;
      const py = Math.sin(th) * 19;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
    for (let i = 1; i <= 6; i++) {
      const th = Math.PI / 2 + s * (0.25 + (i / 6.4) * 2.3);
      const px = Math.cos(th) * 17;
      const py = Math.sin(th) * 19;
      const tang = th + (s * Math.PI) / 2;
      for (const side of [-1, 1]) {
        c.save();
        c.translate(px, py);
        c.rotate(tang + side * 0.6 * s);
        c.beginPath();
        c.ellipse(0, -5 * side, 2.1, 4.6, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
  }
  c.restore();
}

/** the long paper field (cached): a step darker than the sky's horizon band, crossed by a few cut-paper drift
 *  ridgelines (overlapping sheets, each top edge catching the last light) — no grid */
function field(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L3, CAMS, 60);
  f.cached(`${ID}/field3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 900 - HORIZON, (cc) => {
    cc.translate(-r.x, -HORIZON);
    const g = cc.createLinearGradient(0, HORIZON, 0, 900);
    // a snow-covered field: it holds the sky's light (mid-high value), so the book's shadow reads dark on it
    g.addColorStop(0, mixLab(env.mood.setHaze, env.mood.haze, 0.35));
    g.addColorStop(0.3, mixLab(env.mood.setHaze, env.mood.haze, 0.2));
    g.addColorStop(1, mixLab(env.mood.setHaze, env.mood.set, 0.55));
    cc.fillStyle = g;
    cc.fillRect(r.x, HORIZON, r.w, 900 - HORIZON);
    const ridges = [
      { y: HORIZON + 30, amp: 6, f: 0.011, k: 0.12, seed: 1 },
      { y: HORIZON + 68, amp: 10, f: 0.007, k: 0.22, seed: 2 },
      { y: HORIZON + 128, amp: 16, f: 0.0045, k: 0.34, seed: 3 },
    ];
    for (const rd of ridges) {
      const crest = (x: number) => rd.y - rd.amp * (Math.sin(x * rd.f + rd.seed * 2.1) * 0.6 + Math.sin(x * rd.f * 2.3 + rd.seed) * 0.4);
      const p = new Path2D();
      p.moveTo(r.x, 900);
      for (let x = r.x; x <= r.x + r.w; x += 8) p.lineTo(x, crest(x));
      p.lineTo(r.x + r.w, 900);
      p.closePath();
      const rg = cc.createLinearGradient(0, rd.y - rd.amp, 0, 900);
      rg.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.haze, 0.25 - rd.k * 0.5), 0.8));
      rg.addColorStop(1, withAlpha(mixLab(env.mood.setHaze, env.mood.set, 0.3 + rd.k), 0.85));
      cc.fillStyle = rg;
      cc.fill(p);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.3 - rd.k * 0.4);
      cc.lineWidth = 1.4;
      cc.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 8) (x === r.x ? cc.moveTo(x, crest(x)) : cc.lineTo(x, crest(x)));
      cc.stroke();
    }
  })(c, r.x, HORIZON);
}

/** the low sun's sheen along the field (additive), falling with the night */
function fieldSheen(c: C, env: PaintEnv, sun: { x: number; y: number }, night: number) {
  const a = 0.34 * (1 - night);
  if (a <= 0.003) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(sun.x, HORIZON + 8);
  c.scale(1, 0.22);
  const g = c.createRadialGradient(0, 0, 10, 0, 0, 900);
  g.addColorStop(0, withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), a));
  g.addColorStop(0.4, withAlpha(env.mood.rim, a * 0.3));
  g.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.fillStyle = g;
  c.fillRect(-900, -900, 1800, 1800);
  c.restore();
}

/** screen-locked, before the layers: a brighter horizon band (the tree line stands crisp against it until the
 *  night takes it) and the low sun itself, a warm disc cooling as it sinks behind the book and below the field */
function skyPlane(f: Frame, sun: { x: number; y: number }, sink: number, night: number, tipX: number) {
  const c = f.c;
  const m = f.mood;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalCompositeOperation = 'lighter';
  // the horizon band: brightest on the lit side of the shadow's leading edge
  const bandA = 0.3 * (1 - 0.85 * night);
  if (bandA > 0.003) {
    const g = c.createLinearGradient(0, HORIZON - 150, 0, HORIZON + 20);
    g.addColorStop(0, withAlpha(m.sky[3], 0));
    g.addColorStop(0.7, withAlpha(mixLab(m.sky[3], m.rim, 0.5), bandA));
    g.addColorStop(1, withAlpha(m.sky[3], 0));
    c.fillStyle = g;
    c.fillRect(0, HORIZON - 150, 1280, 170);
    void tipX;
  }
  // the sun: a warm-to-cold disc and its glow
  const warm = mixLab('#f0b877', m.core, 0.15 + 0.85 * sink);
  const A = 1 - 0.75 * sink;
  const gl = c.createRadialGradient(sun.x, sun.y, 4, sun.x, sun.y, 210);
  gl.addColorStop(0, withAlpha(warm, 0.7 * A));
  gl.addColorStop(0.25, withAlpha(mixLab(warm, m.rim, 0.5), 0.2 * A));
  gl.addColorStop(1, withAlpha(m.rim, 0));
  c.fillStyle = gl;
  c.fillRect(sun.x - 170, sun.y - 170, 340, 340);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(mixLab(warm, '#fff7e8', 0.4), 0.92 * A);
  c.beginPath();
  c.arc(sun.x, sun.y, 15, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the book's long cast shadow on the field, thrown by the low sun behind it: a set-ink polygon (0.85) anchored at
 *  the book's footprint, lying along the ground to the right and fanning toward us; its far edge is feathered */
function bookShadow(c: C, env: PaintEnv, L: number, cam: Camera3) {
  const x0 = BOOK.x + 6;
  const x1 = BOOK.x + BOOK.w + BOOK.depth - 4;
  const tip = x1 + L;
  // a long band lying on the field: its back edge runs level from the book's right foot, its front edge from the
  // front foot fans gently toward us, so the far end is a little wider than the base (it stays inside the frame)
  const bottom = toLayer(LAYERS.L4, cam, 0, 706).y;
  const nearY = Math.min(bottom, GROUND + 22 + 0.085 * L);
  const nearX = x0 + 0.94 * L;
  const farY = GROUND + 2 + 0.012 * L;
  c.save();
  const g = c.createLinearGradient(x1, 0, tip, 0);
  const feather = Math.min(0.6, 150 / Math.max(1, L));
  g.addColorStop(0, withAlpha(env.fill('ink'), 0.88));
  g.addColorStop(Math.max(0, 1 - feather), withAlpha(env.fill('ink'), 0.85));
  g.addColorStop(1, withAlpha(env.fill('ink'), 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x0, GROUND + 2);
  c.lineTo(x1, GROUND - 1);
  c.quadraticCurveTo((x1 + tip) / 2, GROUND, tip, farY);
  c.quadraticCurveTo(tip + 10, (farY + nearY) / 2, nearX, nearY);
  c.quadraticCurveTo((x0 + nearX) / 2, (GROUND + 2 + nearY) / 2 + 4, x0, GROUND + 2);
  c.closePath();
  c.filter = `blur(${(2.5 * env.pxScale).toFixed(1)}px)`;
  c.fill();
  c.restore();
}

/** the night, screen-locked behind the action plane: it FOLLOWS the shadow's leading edge, darkening the sky and the
 *  field from left to right as the shadow crosses (plus a gentler top-down fall) */
function nightFall(f: Frame, c: C, night: number, tipX: number) {
  const m = f.mood;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  // left → right, trailing the leading edge by ~380 px, soft ahead of it
  const lr = c.createLinearGradient(tipX - 420, 0, tipX + 80, 0);
  lr.addColorStop(0, withAlpha(m.fg, 0.55));
  lr.addColorStop(0.7, withAlpha(m.fg, 0.2));
  lr.addColorStop(1, withAlpha(m.fg, 0));
  c.fillStyle = lr;
  c.fillRect(0, 0, 1280, 720);
  if (night > 0.001) {
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, withAlpha(m.fg, 0.42 * night));
    g.addColorStop(0.5, withAlpha(m.fg, 0.22 * night));
    g.addColorStop(1, withAlpha(m.fg, 0.2 * night));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  }
  c.restore();
}

/** the two hanging cards, screen-locked (they hang in front of the lens on threads from above the frame, so the
 *  pull-back does not drag them): ~12% smaller than first cut, in the upper third; type held at the floor */
function cards(c: C, env: PaintEnv, tq: number, b: Beats, cam: Camera3) {
  c.save();
  // screen-locked inside L4: undo the layer's camera transform (keeps the layer's own device scale intact)
  const o0 = toScreen(LAYERS.L4, cam, 0, 0);
  c.transform(1 / o0.k, 0, 0, 1 / o0.k, -o0.x / o0.k, -o0.y / o0.k);
  const ty = (size: number) => legibleSize(c, `400 ${size}px ${FONT.typewriter}`, size);
  const sr = (size: number) => legibleSize(c, `italic 400 ${size}px ${FONT.text}`, size);
  const AW = { w: 356, h: 102 };
  const award = hangCard(tq, b.award - 0.25, 384, 118, 1, 0.8);
  typedCard(
    c,
    {
      x: award.x,
      y: award.y,
      w: AW.w,
      h: AW.h,
      rot: award.rot,
      threadTo: -200,
      alpha: award.a,
      seed: 1969,
      lines: [
        { text: '1969 · Turing Award:', size: ty(21.5) },
        { text: 'Marvin Minsky', size: ty(21.5) },
      ],
    },
    env.mood,
  );
  if (award.a > 0.01) laurel(c, award.x, award.y, award.rot, award.a, env, AW.w / 2, AW.h / 2);
  const law = hangCard(tq, b.congress - 0.15, 876, 146, 2, 1.0);
  typedCard(
    c,
    {
      x: law.x,
      y: law.y,
      w: 520,
      h: 146,
      rot: law.rot,
      threadTo: -200,
      alpha: law.a,
      seed: 1970,
      lines: [
        { text: '“a direct and apparent', size: ty(22) },
        { text: 'relationship”', size: ty(22) },
        { text: '— US Congress, Mansfield Amendment, 1969', size: sr(24), font: 'serif', italic: true, alpha: 0.92 },
      ],
    },
    env.mood,
  );
  c.restore();
}

/** L5: near grass and a leaning split-rail fence post at the bottom right (blurred) */
function nearFence(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L5, [C1, C2], 60);
  f.cached(
    `${ID}/near2/${env.mood.id}/${Math.round(r.x)}`,
    Math.ceil(r.w),
    360,
    (cc) => {
      cc.translate(-r.x, -400);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(r.x, 760);
      for (let x = r.x; x <= r.x + r.w; x += 6) {
        const k = Math.max(0, Math.sin((x - r.x) * 0.004) * 0.5 + 0.5);
        const h = 8 + 34 * k * (0.6 + 0.4 * ((hash1(x, 5) + 1) / 2));
        cc.lineTo(x, 716 - h);
        cc.lineTo(x + 3, 720 - h * 0.35);
      }
      cc.lineTo(r.x + r.w, 760);
      cc.closePath();
      cc.fill();
      const px = 1188;
      cc.save();
      cc.translate(px, 740);
      cc.rotate(0.09);
      cc.fillRect(-13, -300, 26, 300);
      cc.beginPath();
      cc.moveTo(-13, -300);
      cc.lineTo(0, -312);
      cc.lineTo(13, -300);
      cc.fill();
      cc.restore();
      cc.strokeStyle = env.fill('fg');
      cc.lineWidth = 5;
      for (const wy of [540, 610]) {
        cc.beginPath();
        cc.moveTo(px - 150, wy + 22);
        cc.quadraticCurveTo(px - 70, wy + 26, px + 10, wy);
        cc.lineTo(r.x + r.w, wy - 10);
        cc.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const sx = 1050 + i * 13 + hash1(i, 9) * 8;
        const sh = 60 + 70 * ((hash1(i, 10) + 1) / 2);
        cc.lineWidth = 3;
        cc.beginPath();
        cc.moveTo(sx, 720);
        cc.quadraticCurveTo(sx + 6, 720 - sh * 0.6, sx + 14 * hash1(i, 11), 720 - sh);
        cc.stroke();
      }
    },
    { blur: 5 },
  )(c, r.x, 400);
}

/** L6: a soft grass-and-stalk edge across the lower-left corner, nearest of all (heavily blurred) */
function grassEdge(f: Frame, c: C, env: PaintEnv, a: number) {
  const R = { x: -260, y: 470, w: 760, h: 330 };
  c.save();
  c.globalAlpha *= a;
  f.cached(`${ID}/grassL6/${env.mood.id}`, R.w, R.h, (cc) => {
    cc.translate(-R.x, -R.y);
    cc.fillStyle = env.fill('fg');
    cc.beginPath();
    cc.moveTo(R.x, R.y + R.h);
    cc.lineTo(R.x, 600);
    cc.quadraticCurveTo(60, 612, 200, 668);
    cc.quadraticCurveTo(300, 704, 420, R.y + R.h);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = env.fill('fg');
    cc.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const sx = -120 + i * 17 + hash1(i, 21) * 9;
      const base = 620 + Math.max(0, sx) * 0.3;
      const sh = 70 + 90 * ((hash1(i, 22) + 1) / 2);
      cc.lineWidth = 4 + 2 * ((hash1(i, 23) + 1) / 2);
      cc.beginPath();
      cc.moveTo(sx, base + 20);
      cc.quadraticCurveTo(sx + 8, base - sh * 0.6, sx + 22 * hash1(i, 24), base - sh);
      cc.stroke();
    }
  }, { blur: 10 })(c, R.x, R.y);
  c.restore();
}
