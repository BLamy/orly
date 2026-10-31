/**
 * ch05-s03 — SUSPECT TAG 5 STRUCK (scene, serverCyan; cut in from the loom; 8.88 s).
 *   L0504 "So it is a network, in the plain sense: weighted sums, with ReLU gates between."
 *   L0505 "That guess was ours too."
 *
 * The camera has dropped from the loom to the copper line strung in front of it (sets/tagLine, variant 'none': the
 * line, the rule and every tag tied so far, in continuity via tagsAt); behind it, the matmul loom of ch05-s01
 * (sets/ch05-s01-loom3d, the real circuit) stands as a cyan-lit lattice in haze, its threads of light running behind
 * the tags. Suspect tag 5 hangs on its slack thread with an EMPTY knot (nobody in the record held it): front in ink,
 * "It isn't really a network", its faded 'suspect' stamp. Pinned beside it on the line, a small README slip: the
 * README's 2 primitives: matrix multiplication · reglu.
 *
 * TEACHES, word by word:
 *   tag (0.3)          close on tag 5 and its empty knot; the slip beside it
 *   network (1.17)     a thin rim of light runs from the slip to the loom behind (to a frame, then to a ramp after
 *                      it): the frames are the matrix multiplications, the ramps the reglu gates. The narrator's hand
 *                      (lower left) flips the tag over (the paper snap on the word)
 *   weighted (3.16)    the red pencil (frame right) draws on the back, in red, a tiny pictogram with no words: one
 *                      frame, then a ramp after it, finished on 'between' (5.66) and held to read
 *   strike (6.43)      the narrator's hand turns the tag face-front again; TIGHT INSERT: the pencil tip draws one firm
 *                      red stroke through the front (the dry scratch), then withdraws right
 *   ours (7.28)        the camera tips to the empty knot and holds. The slack thread does not drop to the rule: a
 *                      suspect has no date to measure.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { drawPencil, pencilRed } from '../sets/narratorHands';
import { TAG, TAGS, lineYAt, tagAnchors, tagLineScene, tagStrike, tagsAt, type TagState } from '../sets/tagLine';
import { frameX, frameZ, loom3, project, rowAt } from '../sets/ch05-s01-loom3d';
import { loomRoom } from '../sets/ch05-s01-room';

type C2 = CanvasRenderingContext2D;
const ID = 'ch05-s03';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const T5: TagState = { id: '5' };
const AN = tagAnchors(T5);
/** hand scale: an insert-sized hand under the push */
const HS = 0.55;
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - 118 * HS * 0.25 };
/** the README slip, clipped to the line right of tag 5 and standing up above the wire (clear of the hanging tags) */
const SLIP = { x: AN.eye.x + 32, y: lineYAt(AN.eye.x + 32) - 56, w: 146, h: 46 };

function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
interface CamKey {
  t: number;
  cam: Camera3;
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
/** the loom stands well behind the line: its own camera is the shot camera pulled back and to the side */
const loomCam = (cam: Camera3): Camera3 => ({ x: cam.x * 0.3 + 620, y: cam.y * 0.3 + 300, z: -1500 + (cam.z + 300) * 0.1, lens: 1 });

interface Beats {
  D: number;
  tag: number;
  network: number;
  weighted: number;
  between: number;
  strike: number;
  ours: number;
  flip0: number;
  write0: number;
  write1: number;
  unflip0: number;
  ins0: number;
  ins1: number;
  stroke: number;
}
const FLIP_D = 1.1;
const UNFLIP_D = 0.8;

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const network = T.beat('network');
    const strike = T.beat('strike');
    const b: Beats = {
      D: T.duration,
      tag: T.beat('tag'),
      network,
      weighted: T.beat('pictogram'),
      between: T.word('L0504', 'between'),
      strike,
      ours: T.beat('ours'),
      // the snap (u .5) lands on 'network'
      flip0: network - 0.5 * FLIP_D,
      write0: T.beat('pictogram') - 0.25,
      write1: T.wordEnd('L0504', 'between') + 0.1,
      // turned face-front again on the strike beat (the snap at its middle)
      unflip0: strike - 0.5 * UNFLIP_D,
      ins0: strike + 0.32,
      ins1: T.beat('ours') - 0.05,
      stroke: strike + 0.5,
    };
    const cx = AN.eye.x + 30, cy = AN.eye.y + 34;
    const keys: CamKey[] = [
      { t: 0, cam: camK(cx + 12, cy - 6, 2.2) },
      { t: b.network + 0.6, cam: camK(cx + 4, cy - 2, 2.45) },
      { t: b.weighted, cam: camK(AN.eye.x + 10, cy - 8, 3.0) },
      { t: b.ins0, cam: camK(AN.eye.x + 12, cy - 6, 3.12) },
      // the insert: a macro on the tag's face
      { t: b.ins0 + 0.001, cam: camK(AN.eye.x + 2, AN.eye.y + 48, 6.2), cut: true },
      { t: b.ins1, cam: camK(AN.eye.x + 3, AN.eye.y + 48, 6.5) },
      // cut back, tipping to the empty knot, and hold
      { t: b.ins1 + 0.001, cam: camK(AN.eye.x + 10, AN.eye.y + 10, 3.3), cut: true },
      { t: b.D + 0.3, cam: camK(AN.eye.x + 6, AN.eye.y + 2, 3.6) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    const lc = loomCam(cam);

    // ---- tag 5's state, on twos
    const flipU = clamp01((tq - b.flip0) / FLIP_D);
    const unflipU = clamp01((tq - b.unflip0) / UNFLIP_D);
    const flipped = (u: number) => (u <= 0.38 ? 0 : u >= 0.62 ? 1 : (u - 0.38) / 0.24);
    const flip = unflipU > 0 ? 1 - flipped(unflipU) : flipped(flipU);
    const writeU = clamp01((tq - b.write0) / (b.write1 - b.write0));
    const pp = writeU > 0 && writeU < 1 ? hands.pencil('write', writeU, { x: AN.eye.x, y: AN.eye.y + TAG.h * 0.52 }, { scale: HS, entry: entries(cam).pencil, writeW: TAG.w * 0.7 }) : null;
    const picto = writeU >= 1 ? 1 : pp?.stroke ?? 0;
    const strike = clamp01((t - b.stroke) / 0.35);
    const kick = (t0: number) => (t > t0 ? 0.09 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.022 + kick(b.network) + kick(b.strike) + (t > b.stroke ? 0.05 * Math.exp(-(t - b.stroke) * 2.5) : 0);
    // knot cards are drawn by this shot centred on each tag's own string, so tag 5's eyelet plainly stays EMPTY
    const knots: { st: TagState; labels: string[] }[] = [];
    const tags = tagsAt(ID, 'start').map((st) => {
      const labels = st.knot ?? TAGS[st.id].knot;
      if (labels.length) knots.push({ st, labels });
      return st.id === '5'
        ? { ...st, knot: [], flip, back: [], backInk: 0, strike, swing, phase: 0, glow: 0.12 + 0.15 * seg(t, b.tag, b.tag + 0.5), subject: true }
        : { ...st, knot: [] };
    });
    const E = entries(cam);
    // the rim of light from the slip to the loom (frames = matrix multiplications, ramps = reglu gates)
    const link = seg(t, b.network - 0.1, b.network + 0.7) * (1 - 0.6 * seg(t, b.strike - 0.3, b.strike + 0.3));

    // ---- the loom behind, in haze (its own pulled-back camera), then the line in front
    loomRoom(f, lc, { key: ID, cams: [loomCam(sc.keys[0].cam), loomCam(sc.keys[sc.keys.length - 1].cam), loomCam(sc.keys[3].cam)], sunX: 900, tubes: 0.6 });
    loom3(f, { cam: lc, tq, minBlur: 1.2, maxBlur: 3, dof: 2, focusZ: 600, threads: 1, frameAlpha: () => 0.55, lit: { 2: link * 0.8 } }, {});

    tagLineScene(f, {
      variant: 'none',
      key: ID,
      tags,
      rule: { },
      pencilOnPost: false,
      l4: (c, env) => {
        for (const kn of knots) knotCards(c, env, kn.st, kn.labels);
        readmeSlip(c, env, t, b);
        if (link > 0.01) linkToLoom(c, env, cam, lc, link);
        if (flip > 0.5 && picto > 0) pictogram(c, env, flip, swing * Math.sin(tq * 1.7), picto);
        if (flipU > 0 && flipU < 1) hands.draw(c, hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
        if (unflipU > 0 && unflipU < 1) hands.draw(c, hands.act('flip', unflipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
        if (pp) hands.draw(c, pp, env);
        if (t > b.ins0 && t < b.ins1) insertPencil(c, env, tq, b, tagStrike(T5), cam);
        if (t > b.ours - 0.3) knotGlint(c, env, t, b);
      },
    });
  },
});

function entries(cam: Camera3) {
  const at = (sx: number, sy: number) => toLayer(LAYERS.L4, cam, sx, sy);
  return { R: at(-140, 780), pencil: at(1150, 900) };
}

/** the README slip pinned on the line beside tag 5: its two primitives (paper and ink arrive together) */
function readmeSlip(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.tag + 0.35;
  const ink = cardInkAlpha(t, inkAt);
  const paper = Math.min(cardPaperAlpha(t, inkAt), 1);
  if (paper <= 0.01) return;
  const { x, y, w, h } = SLIP;
  c.save();
  c.translate(x, y);
  c.rotate(-0.025);
  c.translate(-x, -y);
  c.globalAlpha = paper;
  // its pin through the line
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x + 14, y + h - 4);
  c.lineTo(x + 14, y + h + 14);
  c.stroke();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x + 2, y + 3, w, h);
  c.fillStyle = mixLab(mixLab('#f1e6cc', env.mood.halo, 0.2), env.mood.core, 0.08);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 0.6;
  c.strokeRect(x, y, w, h);
  c.fillStyle = mixLab('#a8844a', env.mood.halo, 0.25);
  c.beginPath();
  c.arc(x + 14, y + h - 5, 2.2, 0, Math.PI * 2);
  c.fill();
  textRole(c, 'subject', () => {
    const inkC = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.2), ink);
    const s1 = legibleSize(c, `italic 400 11px ${FONT.text}`, 11, "the README's 2 primitives:");
    c.font = `italic 400 ${s1.toFixed(2)}px ${FONT.text}`;
    c.fillStyle = inkC;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText("the README's 2 primitives:", x + 8, y + 17);
    const s2 = legibleSize(c, `600 12px ${FONT.text}`, 12, 'matrix multiplication · reglu');
    c.font = `600 ${s2.toFixed(2)}px ${FONT.text}`;
    const tw = c.measureText('matrix multiplication · reglu').width;
    c.fillText('matrix multiplication · reglu', x + 8, y + 36);
    textProbe(c, `${ID}-slip`, x + 8, y + 5, Math.max(tw, w - 16), 34, ink);
  });
  cardProbe(c, `${ID}-slip-card`, x, y, w, h, paper, ink);
  c.restore();
}

/** a thin rim of light from the slip's two words to the loom behind: 'matrix multiplication' to a frame, 'reglu' to a
 *  ramp after it (drawn on the line's plane, aimed at where the loom stands on screen) */
function linkToLoom(c: C2, env: PaintEnv, cam: Camera3, lc: Camera3, u: number) {
  const frameTop = project({ x: frameX(2), y: rowAt(2, 20), z: frameZ(2) }, lc);
  const ramp = project({ x: frameX(2) + 70, y: rowAt(2, 60), z: frameZ(2) }, lc);
  const to4 = (p: { x: number; y: number }) => {
    const m = toScreen(LAYERS.L4, cam, 0, 0);
    return { x: (p.x - m.x) / m.k, y: (p.y - m.y) / m.k };
  };
  const targets = [
    { from: { x: SLIP.x + 60, y: SLIP.y + 4 }, to: to4(frameTop) },
    { from: { x: SLIP.x + 132, y: SLIP.y + 4 }, to: to4(ramp) },
  ];
  c.save();
  c.lineCap = 'round';
  targets.forEach((tg, i) => {
    const v = clamp01(u * 1.4 - i * 0.4);
    if (v <= 0) return;
    const x1 = tg.from.x + (tg.to.x - tg.from.x) * v, y1 = tg.from.y + (tg.to.y - tg.from.y) * v;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55 * u);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(tg.from.x, tg.from.y);
    c.quadraticCurveTo((tg.from.x + x1) / 2, Math.min(tg.from.y, y1) - 16, x1, y1);
    c.stroke();
    c.fillStyle = withAlpha(env.mood.core, 0.7 * v);
    c.beginPath();
    c.arc(x1, y1, 1.6, 0, Math.PI * 2);
    c.fill();
  });
  c.restore();
}

/** tag 5's back: the pencil's pictogram, no words: one loom frame, then a ramp after it */
function pictogram(c: C2, env: PaintEnv, flip: number, swing: number, u: number) {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const w = TAG.w, h = TAG.h;
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  c.strokeStyle = pencilRed(env, 0.95);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = 1.6;
  // the frame (left), drawn first: a tall rectangle with three cross threads
  const fx = -w * 0.34, fy = h * 0.3, fw = w * 0.3, fh = h * 0.46;
  const frameU = clamp01(u / 0.6);
  const per = 2 * (fw + fh);
  const pts: [number, number][] = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh], [fx, fy]];
  let left = per * frameU;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const L = Math.hypot(bx - ax, by - ay);
    const k = Math.min(1, left / L);
    c.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k);
    left -= L;
  }
  c.stroke();
  if (frameU >= 1) {
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 1; i <= 3; i++) {
      c.moveTo(fx, fy + (fh * i) / 4);
      c.lineTo(fx + fw, fy + (fh * (4 - i)) / 4);
    }
    c.stroke();
  }
  // the ramp after it (right): flat, then rising (ReLU's shape)
  const rampU = clamp01((u - 0.62) / 0.38);
  if (rampU > 0) {
    c.lineWidth = 1.7;
    const r0 = { x: w * 0.06, y: fy + fh * 0.8 }, r1 = { x: w * 0.2, y: fy + fh * 0.8 }, r2 = { x: w * 0.38, y: fy + fh * 0.15 };
    c.beginPath();
    c.moveTo(r0.x, r0.y);
    const a = clamp01(rampU / 0.4);
    c.lineTo(r0.x + (r1.x - r0.x) * a, r1.y);
    if (rampU > 0.4) {
      const bb = clamp01((rampU - 0.4) / 0.6);
      c.lineTo(r1.x + (r2.x - r1.x) * bb, r1.y + (r2.y - r1.y) * bb);
    }
    c.stroke();
    // a small arrow: the gate sits AFTER the frame
    if (rampU > 0.2) {
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(fx + fw + 2, fy + fh * 0.5);
      c.lineTo(r0.x - 2, fy + fh * 0.5);
      c.moveTo(r0.x - 5, fy + fh * 0.5 - 2.5);
      c.lineTo(r0.x - 2, fy + fh * 0.5);
      c.lineTo(r0.x - 5, fy + fh * 0.5 + 2.5);
      c.stroke();
    }
  }
  c.restore();
}

/** the insert's pencil: point, lacquer and two fingertips from frame right; one firm stroke through the front */
function insertPencil(c: C2, env: PaintEnv, tq: number, b: Beats, sk: ReturnType<typeof tagStrike>, cam: Camera3) {
  const dir = { x: Math.cos(sk.angle), y: Math.sin(sk.angle) };
  const start = { x: sk.centre.x - (dir.x * sk.w) / 2, y: sk.centre.y - (dir.y * sk.w) / 2 };
  const end = { x: sk.centre.x + (dir.x * sk.w) / 2, y: sk.centre.y + (dir.y * sk.w) / 2 };
  const away = toLayer(LAYERS.L4, cam, 1420, 640);
  let tip: { x: number; y: number };
  if (tq < b.stroke) {
    const u = sm((tq - b.ins0) / (b.stroke - b.ins0 - 0.04));
    tip = { x: away.x + (start.x - away.x) * u, y: away.y + (start.y - away.y) * u };
  } else if (tq < b.stroke + 0.35) {
    const u = (tq - b.stroke) / 0.35;
    tip = { x: start.x + (end.x - start.x) * u, y: start.y + (end.y - start.y) * u };
  } else {
    const u = sm((tq - b.stroke - 0.38) / 0.4);
    tip = { x: end.x + (away.x - end.x) * u, y: end.y - 4 * Math.sin(Math.PI * Math.min(1, u * 2)) + (away.y - end.y) * u };
  }
  const ang = Math.PI + 0.42;
  const len = 150;
  drawPencil(c, tip, ang, len, env);
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

/** each tag's typeset knot card(s), centred on that tag's own string between the line and the eyelet */
function knotCards(c: C2, env: PaintEnv, st: TagState, labels: string[]) {
  const an = tagAnchors(st);
  const s = st.scale ?? 1;
  labels.forEach((label, i) => {
    textRole(c, 'texture', () => {
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

/** on 'ours': a soft glint in the EMPTY eyelet (nobody tied a name through it) */
function knotGlint(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.ours - 0.2, b.ours + 0.4) * (1 - 0.5 * seg(t, b.ours + 1.0, b.D));
  if (u <= 0) return;
  const p = { x: AN.eye.x, y: AN.eye.y + 7 };
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 9);
  g.addColorStop(0, withAlpha(env.mood.core, 0.6 * u));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 9, p.y - 9, 18, 18);
  c.restore();
}
