/**
 * ch07-s05 — TAG 10: FULLY DIFFERENTIABLE? (scene, dawnGold; cut in from the reversed loom; 20.2 s). Device 1.
 *   L0711 "The README calls it fully differentiable: a slope everywhere. The project itself has doubts."
 *   L0712 "Ask the ramps which way to nudge the input. At almost every whole number: nowhere."
 *   L0713 "Differentiable as real arithmetic. But a decision has no slope to follow."
 *
 * The tag line BY THE GALLERY (sets/ch07-s01-gallery, as in s01), mid-shot on tag 10's slot, the Lifespan Rule below.
 *   'differentiable' the narrator's hand (lower left) ties tag 10 on (the detent 'tie'): its front, verbatim from the
 *              README, "fully differentiable!"; its knot card: tied on by: the README's tagline · 14 Oct 2026
 *   'doubts'   the hand flips it (paper snap); the red pencil comes in from frame right and writes on the back:
 *              the lab's own guide · slope 0
 *   'ramps'    the camera tilts down past the tag and the rule: Deep Dive I's two hinged boards (flat, then a 45°
 *              climb, corners at 4 and 5) rise under the line, a brass slope gauge riding the marble. The marble visits
 *              3, 6 and 100 (the needle lies flat: 0 each time); on 'almost' it rolls to 4.5, mid-climb, and the needle
 *              tips to 1; on 'nowhere' it is back at 6, reading 0. Never a whole number at a corner.
 *   L0713      the hand turns the tag face-front again; the camera tilts back up. The tag is NOT struck: its thread drops
 *              to the rule at its age as of 27 Oct 2026, thirteen days (between the unlabelled week and month ticks),
 *              and ends in the glowing open copper tip with its short arrow pointing right: still held, contested.
 *   'follow'   the red pencil is laid down against the stage's proscenium post beside the tag, and the hand withdraws.
 * Every gauge reading is COMPUTED from the ramps (sets/rampBench RB): slope of above4(a) = ramp(a, 4) − ramp(a, 5).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { drawPencil, pencilRed, type HandsPose } from '../sets/narratorHands';
import { TAG, drawTag, lineYAt, tagAnchors, tagLineScene, tagsAt, type TagState } from '../sets/tagLine';
import { RB, rampBench } from '../sets/rampBench';
import { GALLERY, galleryBack } from '../sets/ch07-s01-gallery';

const ID = 'ch07-s05';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}

/** tag 10, canonical slot */
const T10: TagState = { id: '10' };
const AN = tagAnchors(T10);
const KNOT_AT = { x: AN.knot.x, y: lineYAt(AN.knot.x) };
const HS = 0.6;
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - 118 * HS * 0.25 };
/** the red pencil's back: three short rows so the whole label fits inside the tag */
const BACK_ROWS = ["the lab's", 'own guide', '· slope 0'];
const BACK_TOP = 16;
const KNOT_CARD = ["tied on by: the README's tagline", '14 Oct 2026'];

/** the ramps under the rule (L4): a = 4.5 at the tag's x */
const BENCH = { x: AN.eye.x, y: 822, s: 0.6, domain: [2.6, 6.4] as [number, number], far: 100 };
const U = 110 * BENCH.s;
const xOfA = (a: number) => BENCH.x + (a - 4.5) * U;
const X_HI = xOfA(BENCH.domain[1]);
const X_FAR = X_HI + 30 * BENCH.s + 34 * BENCH.s;

const TIE_D = 2.2;
const FLIP_D = 1.1;
const WRITE_D = 1.5;
const UNFLIP_D = 1.3;
const REST_D = 1.6;

interface Beats {
  D: number;
  tie: number;
  flip: number;
  ramps: number;
  almost: number;
  gauge: number;
  l13: number;
  real: number;
  rest: number;
}

/** the marble's display x over time (3, 6, 100, then 4.5, then 6 again on 'nowhere') */
function marbleX(t: number, b: Beats): { x: number; a: number | null; on: number } {
  const keys: [number, number][] = [
    [b.ramps + 0.5, xOfA(3)],
    [b.ramps + 1.0, xOfA(3)],
    [b.ramps + 1.6, xOfA(6)],
    [b.ramps + 1.75, xOfA(6)],
    [b.ramps + 2.25, X_FAR],
    [b.almost - 0.25, X_FAR],
    [b.almost + 0.25, xOfA(4.5)],
    [b.gauge - 0.75, xOfA(4.5)],
    [b.gauge - 0.06, xOfA(6)],
  ];
  const on = win(t, b.ramps + 0.35, b.ramps + 0.6) * (1 - win(t, b.l13 + 0.2, b.l13 + 0.6));
  let x = keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i][0] && t < keys[i + 1][0]) {
      x = lerp(keys[i][1], keys[i + 1][1], sm((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
      break;
    }
    if (t >= keys[keys.length - 1][0]) x = keys[keys.length - 1][1];
  }
  // a is only defined on the drawn number line (the far mark is 100; the hop between is the break)
  const a = x <= X_HI + 0.5 ? 4.5 + (x - BENCH.x) / U : Math.abs(x - X_FAR) < 0.5 ? 100 : null;
  return { x, a, on };
}
/** the slope of the decision at a (above4 = ramp(a, 4) − ramp(a, 5)): computed, 0 or 1 */
const slopeAt = (a: number) => {
  const h = 1e-3;
  return Math.round((RB.above4(a + h) - RB.above4(a - h)) / (2 * h));
};

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      tie: T.beat('tie'),
      flip: T.beat('flip'),
      ramps: T.beat('ramps'),
      almost: T.word('L0712', 'almost'),
      gauge: T.beat('gauge'),
      l13: T.line('L0713').start,
      real: T.word('L0713', 'real'),
      rest: T.beat('rest'),
    };
    const cx = AN.eye.x;
    const keys: { t: number; cam: Camera3 }[] = [
      { t: 0, cam: camK(cx - 30, 474, 2.2) },
      { t: b.flip - 0.6, cam: camK(cx - 18, 478, 2.36) },
      { t: b.ramps - 0.15, cam: camK(cx - 14, 480, 2.4) },
      { t: b.ramps + 1.1, cam: camK(cx + 24, 742, 2.05) },
      { t: b.gauge + 0.4, cam: camK(cx + 30, 748, 2.1) },
      { t: b.l13 + 1.4, cam: camK(cx - 150, 506, 1.5) },
      { t: b.D + 0.3, cam: camK(cx - 140, 504, 1.56) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const keys = sc.keys as { t: number; cam: Camera3 }[];
    const t = f.t;
    const tq = q2(t);
    let cam = keys[keys.length - 1].cam;
    for (let i = 0; i < keys.length - 1; i++) {
      if (t < keys[i + 1].t) {
        cam = cam3Interp(keys[i].cam, keys[i + 1].cam)(sm((t - keys[i].t) / (keys[i + 1].t - keys[i].t)));
        break;
      }
    }
    f.camera(cam);
    const E = {
      R: toLayer(LAYERS.L4, cam, -140, 780),
      pencil: toLayer(LAYERS.L4, cam, 1160, 900),
    };

    // ---- tag 10's life on this line, on twos
    const tieU = clamp01((tq - (b.tie - 0.55 * TIE_D)) / TIE_D);
    const tied = tieU >= 0.55;
    const flipped = (u: number) => (u <= 0.38 ? 0 : u >= 0.62 ? 1 : (u - 0.38) / 0.24);
    const flip0 = b.flip - 0.5 * FLIP_D;
    const flipU = clamp01((tq - flip0) / FLIP_D);
    const write0 = b.flip + 0.3;
    const writeU = clamp01((tq - write0) / WRITE_D);
    const backInk = writeU <= 0.3 ? 0 : clamp01((writeU - 0.3) / 0.45);
    const unflip0 = b.gauge + 0.55;
    const unflipU = clamp01((tq - unflip0) / UNFLIP_D);
    const flip = unflipU > 0 ? 1 - flipped(unflipU) : flipped(flipU);
    const kick = (t0: number) => (t > t0 ? 0.08 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.022 + kick(b.tie) + kick(flip0 + 0.5 * FLIP_D) + kick(unflip0 + 0.5 * UNFLIP_D);
    const drop = win(t, b.real - 0.2, b.real + 1.6);
    const knotIn = win(t, b.tie + 0.1, b.tie + 0.5);
    const restU = clamp01((tq - (b.rest - 0.5 * REST_D)) / REST_D);

    // ---- the ramps rise on 'ramps' and sink as the camera returns to the line
    const rise = win(t, b.ramps - 0.05, b.ramps + 0.8) * (1 - win(t, b.l13 + 0.4, b.l13 + 1.5));
    const M = marbleX(t, b);

    const tags = tagsAt(ID, 'start');
    const t10: TagState = { id: '10', ink: 1, knot: [], knotIn: 0, flip, back: [], backInk: 0, swing, phase: 0, drop, subject: true, glow: 0.1 * knotIn };
    if (tied) tags.push(t10);

    galleryBack(f, { key: ID, lamp: 0.7 });

    // the pencil rests against the stage's right proscenium post (L3): find that point in L4 for this camera
    const postS = toScreen(LAYERS.L3, cam, GALLERY.post.x, GALLERY.post.y + 40);
    const postAt = toLayer(LAYERS.L4, cam, postS.x - 14, postS.y);

    tagLineScene(f, {
      variant: 'none',
      key: ID,
      tags,
      rule: { alpha: 0.9 },
      line: { glow: 0.55 },
      pencilOnPost: false,
      l4: (c, env) => {
        // the ramps and the gauge (under the rule)
        if (rise > 0.003) {
          c.save();
          c.globalAlpha = clamp01(rise * 1.5);
          rampBench(c, env, { x: BENCH.x, y: BENCH.y, s: BENCH.s, domain: BENCH.domain, rise, boards: 2, lever: false, tray: false, numerals: true, far: BENCH.far, tq });
          c.restore();
          if (M.on > 0.003) marbleGauge(c, env, M, t, tq);
        }
        // the knot card, threaded on tag 10's string
        if (tied && knotIn > 0.003) knotCard(c, env, knotIn, swing * Math.sin(tq * 1.7));
        // the back's red-pencil words, upright, revealed with the pencil
        if (flip > 0.5 && backInk > 0) backText(c, env, flip, swing * Math.sin(tq * 1.7), backInk);
        // the narrator's hand: tie (carrying the tag), flip, and turn it face-front again
        let pose: HandsPose | null = null;
        if (tieU > 0 && tieU < 1) pose = hands.act('tie', tieU, KNOT_AT, { held: 'tag', scale: HS, entry: { R: E.R } });
        else if (flipU > 0 && flipU < 1) pose = hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } });
        else if (unflipU > 0 && unflipU < 1) pose = hands.act('flip', unflipU, FLIP_AT, { scale: HS, entry: { R: E.R } });
        if (pose) {
          hands.draw(c, pose, env, {
            heldDraw: (cc, at, held, e) => {
              if (held !== 'tag') return;
              drawTag(cc, e, { id: '10', knot: [], swing: 0.05 * Math.sin(tq * 3.1), phase: 0 }, { at: { x: at.x, y: at.y - 6 }, knotAt: { x: at.x, y: at.y - 6 } });
            },
          });
        }
        // the red pencil: write the back; later, rest against the proscenium post
        const target = { x: AN.eye.x, y: AN.eye.y + BACK_TOP + 18 };
        if (writeU > 0 && writeU < 0.98) hands.draw(c, hands.pencil('write', writeU, target, { scale: HS, entry: E.pencil, writeW: 46 }), env);
        if (restU > 0 && restU < 1) hands.draw(c, hands.pencil('rest', restU, postAt, { scale: HS, entry: E.pencil }), env);
        if (restU >= 0.5) drawPencil(c, postAt, Math.PI * 0.5 + 0.22, 62, env);
      },
    });
  },
});

/** the marble on the floor rule and the brass slope gauge riding it: its needle lies at the slope's own angle */
function marbleGauge(c: C2, env: PaintEnv, M: { x: number; a: number | null; on: number }, t: number, tq: number) {
  const y = BENCH.y, r = 8 * BENCH.s * 1.4;
  const drop = (1 - M.on) * 60;
  const mx = M.x, my = y - r - drop;
  c.save();
  c.globalAlpha = M.on;
  // the marble
  const g = c.createRadialGradient(mx - r * 0.35, my - r * 0.4, r * 0.1, mx, my, r);
  g.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.25));
  g.addColorStop(0.45, mixLab('#b8893e', env.mood.halo, 0.3));
  g.addColorStop(1, mixLab('#5b3f18', PUPPET_NEAR_BLACK, 0.4));
  c.fillStyle = g;
  c.beginPath();
  c.arc(mx, my, r, 0, Math.PI * 2);
  c.fill();
  // the gauge: a brass half-dial on a short stalk, a needle at the slope's angle (0 flat, 1 = 45° up)
  const slope = M.a === null ? 0 : slopeAt(M.a);
  const gx = mx, gy = my - r - 30;
  const R = 22;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(gx - 1.5, gy, 3, my - r - gy);
  c.beginPath();
  c.arc(gx, gy, R + 3, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(mixLab('#a8823e', env.mood.halo, 0.35), env.mood.core, 0.1);
  c.beginPath();
  c.arc(gx, gy, R, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  // ticks at 0 and 1, with their numerals
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 1.4;
  c.beginPath();
  for (const ang of [0, -Math.PI / 4]) {
    c.moveTo(gx + Math.cos(ang) * (R - 7), gy + Math.sin(ang) * (R - 7));
    c.lineTo(gx + Math.cos(ang) * R, gy + Math.sin(ang) * R);
  }
  c.stroke();
  textRole(c, 'subject', () => {
    const fs = legibleSize(c, `600 10px ${FONT.mono}`, 10, '0');
    c.font = `600 ${fs}px ${FONT.mono}`;
    c.fillStyle = '#1d140d';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('0', gx - R * 0.55, gy - 5);
    c.fillText('1', gx + R * 0.05, gy - R * 0.6);
    c.textAlign = 'left';
    textProbe(c, `${ID}-gauge`, gx - R, gy - R, 2 * R, R, M.on);
  });
  // the needle swings to the reading on twos, with a small settle
  const needle = slope * (Math.PI / 4) + 0.03 * Math.sin(tq * 9) * Math.exp(-((t * 3) % 1));
  c.strokeStyle = slope > 0 ? mixLab('#8a4421', env.mood.core, 0.1) : PUPPET_NEAR_BLACK;
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(gx - Math.cos(-needle) * 4, gy + Math.sin(needle) * 4);
  c.lineTo(gx + Math.cos(needle) * (R - 3), gy - Math.sin(needle) * (R - 3));
  c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(gx, gy, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** tag 10's knot card, threaded on its string, hanging to the tag's left: who tied it on, and when */
function knotCard(c: C2, env: PaintEnv, a: number, swing: number) {
  c.save();
  c.globalAlpha = a;
  const fs = legibleSize(c, `600 8px ${FONT.sc}`, 8, KNOT_CARD[0]);
  c.font = `600 ${fs}px ${FONT.sc}`;
  const tw = Math.max(...KNOT_CARD.map((l) => c.measureText(l).width));
  const cw = tw + 10, ch = fs * 2.3 + 6;
  const x1 = AN.eye.x - TAG.w / 2 - 6 + swing * 20, x0 = x1 - cw;
  const y0 = AN.knot.y + 6;
  // its thread to the eyelet
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x1, y0 + ch * 0.4);
  c.lineTo(AN.eye.x, AN.eye.y);
  c.stroke();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(x0 + 1.5, y0 + 2, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.core, 0.1);
  c.fillRect(x0, y0, cw, ch);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 0.6;
  c.strokeRect(x0, y0, cw, ch);
  textRole(c, 'subject', () => {
    c.fillStyle = mixLab('#2a1d14', env.mood.ink, 0.2);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    KNOT_CARD.forEach((l, i) => c.fillText(l, x0 + 5, y0 + 3 + fs * (1 + i * 1.15)));
    textProbe(c, `${ID}-knot`, x0, y0, cw, ch, a);
  });
  c.restore();
}

/** tag 10's back: the red pencil's words, upright in the tag's own (swung, narrowed) frame */
function backText(c: C2, env: PaintEnv, flip: number, swing: number, ink: number) {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const w = TAG.w;
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  textRole(c, 'subject', () => {
    let fs = 10;
    c.font = `italic ${fs}px ${FONT.fell}`;
    const widest = Math.max(...BACK_ROWS.map((r) => c.measureText(r).width));
    if (widest > w * 0.84) {
      fs *= (w * 0.84) / widest;
      c.font = `italic ${fs}px ${FONT.fell}`;
    }
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    let budget = Math.ceil(BACK_ROWS.reduce((n, l) => n + l.length, 0) * clamp01(ink));
    BACK_ROWS.forEach((ln, i) => {
      if (budget <= 0) return;
      const tw = c.measureText(ln).width;
      c.fillText(ln.slice(0, budget), -tw / 2, BACK_TOP + fs * 0.9 + i * fs * 1.25);
      budget -= ln.length;
    });
    const tw = Math.max(...BACK_ROWS.map((r) => c.measureText(r).width));
    textProbe(c, `${ID}-back`, -tw / 2, BACK_TOP, tw, fs * 1.25 * BACK_ROWS.length + 3, clamp01(ink));
  });
  c.restore();
}
