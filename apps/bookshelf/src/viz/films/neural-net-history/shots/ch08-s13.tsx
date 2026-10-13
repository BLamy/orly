/**
 * ch08-s13 — FAIR CREDIT: the fallen lantern resolves into seven networks voting, one alone sits nearer
 * eighteen, and a Swiss lab's earlier wins thread into Florence; then a paper wipe into the empty workshop
 * (dawnGold; 11.0 s; plain cut from s12's last frame).
 *
 * Close on the fallen lantern from s12, still hanging low in the hall's dark beside the ruled pole
 * (sets/ch08-s12-lanterns).
 *   'seven'     the lantern resolves into SEVEN small lanterns bound in one cluster; the label sets in
 *   'voting'    two of the seven carry a small tag of stacked picture-tiles (pre-trained on the bigger Fall 2011
 *               ImageNet release); those two dim for a beat and a faint second mark on the pole reads 16.4 %
 *               (the best entry without extra data)
 *   'one alone' one lantern slips out of the cluster on its own string and rises; on 'eighteen' it hangs alone
 *               at 18.2 % (validation), a dashed level to the pole; the label's second line sets in
 *   'Swiss'     a small brass-rimmed lantern-slide inset opens at the upper rim: a triangular road-sign
 *               silhouette, a lantern tagged IDSIA ahead of a lantern with a human figure cut in its paper; a
 *               thread of light runs from it down into the Florence cluster (lineage, not rivalry)
 *   'ignore'    the inset folds back; a paper wipe (same dawnGold lamp) carries us into the craftsman's workshop,
 *               empty: the hand-cut tin stencils still on their hooks, dust in a slanting light, the snips still
 *               on the bench, the light shifting toward evening
 * TEXT: "7 networks voting (2 pre-trained on extra data) · one network alone 18.2% (validation)" (two lines,
 * the second on 'eighteen') and "IDSIA, 2011: road signs 99.46% · best human 99.22%". Pole numbers and the
 * IDSIA tag are props.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, ShotScene } from '../../../film';
import { LAYERS, MOODS, defineShot, makePaperWipe, mixLab, overscan, toScreen, withAlpha } from '../../../film';
import { FONT, legibleSize, softPlate, textColor } from '../../../film/silhouette/type';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import type { PaintEnv } from '../../../film/contracts';
import { LB, audienceBusts, batten, hallDark, hungLantern, lanternTag, rulerPole, yOf } from '../sets/ch08-s12-lanterns';
import { workshop } from '../sets/ch08-s13-workshop';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, lerp, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch08-s13';
type C = CanvasRenderingContext2D;
const Y_RUN = yOf(LB.runnerErr);
const Y_ALEX = yOf(LB.alexErr);
const Y_ONE = yOf(18.2);
const LONE_X = 1018;
/** the seven, bound in a cluster: centre + a ring of six (offsets at full spread) */
const SEVEN: { dx: number; dy: number }[] = [{ dx: 0, dy: 0 }, ...Array.from({ length: 6 }, (_, i) => ({ dx: Math.cos((i * Math.PI) / 3 - Math.PI / 2) * 32, dy: Math.sin((i * Math.PI) / 3 - Math.PI / 2) * 32 }))];
const SEVEN_R = 15;
/** which of the seven carry the extra-data tag, and which one leaves to hang alone */
const TAGGED = [2, 5];
const LONE = 3;
/** the tear's exposed core tinted to the mood's rim (low, warm), not paper white */
const WIPE = makePaperWipe({ dir: 'right', slant: 70, paper: mixLab(MOODS.dawnGold.rim, MOODS.dawnGold.fg, 0.42) });
/** the IDSIA inset: centre, its drawing radius (inner units) and its scale on screen */
const IN = { x: 1094, y: 188, r: 112 };
/** inside the inset (inner units): the human-figure lantern hangs higher (more error), IDSIA's lower (less) */
const IN_HUMAN = { x: -58, y: -30 }, IN_IDSIA = { x: 2, y: 16 };
const IN_S = 1.3;
const IN_R = IN.r * IN_S;

interface B {
  D: number;
  seven: number;
  voting: number;
  one: number;
  eighteen: number;
  swiss: number;
  fold0: number;
  wipe0: number;
  wipe1: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  wcam: (t: number) => Camera3;
  WCAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ignore = T.beat('ignore');
    const b: B = {
      D,
      seven: T.beat('seven'),
      voting: T.beat('extra'),
      one: T.word('L0834', 'one'),
      eighteen: T.beat('single'),
      swiss: T.beat('swiss'),
      fold0: ignore - 0.32,
      wipe0: ignore - 0.02,
      wipe1: Math.min(D - 0.35, ignore + 0.6),
    };
    const cam = camKeys([
      // pushed in so the pole and the cluster fill the middle third (the hall's windows behind, its audience below)
      [0, 908, 586, 520],
      [b.seven + 0.3, 910, 584, 540],
      [b.one, 912, 582, 540],
      [b.eighteen + 0.3, 914, 580, 545],
      [b.swiss + 0.6, 916, 578, 545],
      [D, 917, 577, 550],
    ]);
    const wcam = camKeys([
      [0, 664, 372, 40],
      [b.wipe0, 664, 372, 40],
      [D, 690, 382, 96],
    ]);
    const CAMS: Camera3[] = [];
    const WCAMS: Camera3[] = [];
    for (let i = 0; i <= 10; i++) {
      CAMS.push(cam((D * i) / 10));
      WCAMS.push(wcam(b.wipe0 + ((D - b.wipe0) * i) / 10));
    }
    tl.hold(0, D);
    return { tl, b, cam, CAMS, wcam, WCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.wipe0) {
      paintBoard(f, sc, t);
      return;
    }
    if (t >= b.wipe1) {
      paintWorkshop(f, sc, t);
      return;
    }
    const a = subFrame(f, `${ID}/A`, 'dawnGold', (g) => paintBoard(g, sc, t));
    const w = subFrame(f, `${ID}/B`, 'dawnGold', (g) => paintWorkshop(g, sc, t));
    const W = f.c.canvas.width, H = f.c.canvas.height;
    WIPE(f.c, a, w, sm((t - b.wipe0) / (b.wipe1 - b.wipe0)), { W: 1280, H: 720, pxScale: f.pxScale, seed: 813, frame: f.frame, mood: f.mood });
    void W;
    void H;
  },
});

// ===================================================================================================== THE BOARD
function paintBoard(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.cam(t);
  f.camera(cam);
  hallDark(f, { key: ID, cams: sc.CAMS, glow: 0.7, dark: 0.9, fog: 0.14, windows: true });
  const resolve = win(t, b.seven - 0.12, b.seven + 0.55);
  const tagU = win(t, b.voting - 0.05, b.voting + 0.35);
  const dimTagged = win(t, b.voting + 0.2, b.voting + 0.5) * (1 - win(t, b.voting + 1.6, b.voting + 2.1));
  const loneU = sm((tq - b.one) / Math.max(0.4, b.eighteen - b.one));
  const thread = clamp01((t - (b.swiss + 0.35)) / 0.9);
  const inset = win(t, b.swiss - 0.15, b.swiss + 0.3) * (1 - win(t, b.fold0, b.fold0 + 0.34));
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const r = overscan(LAYERS.L4, sc.CAMS, 40);
    batten(c, env, r.x, r.x + r.w);
    const rulerPx = legibleSize(c, `500 19px ${FONT.mono}`, 19, '16.4%');
    const level = (y: number, x0: number, a: number, faint = false) => {
      if (a <= 0.003) return;
      c.save();
      c.strokeStyle = withAlpha(mixLab(m.rim, faint ? m.haze : m.core, 0.3), (faint ? 0.42 : 0.55) * a);
      c.lineWidth = 1.2;
      c.setLineDash([5, 5]);
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(LB.rulerX, y);
      c.stroke();
      c.restore();
    };
    rulerPole(c, env, {
      fontPx: rulerPx,
      marks: [
        { err: LB.runnerErr, a: 0.7 },
        { err: LB.alexErr, a: 1 },
        { err: 16.4, a: win(t, b.voting + 0.25, b.voting + 0.7), faint: true },
        { err: 18.2, a: win(t, b.eighteen - 0.2, b.eighteen + 0.3), faint: true },
      ],
    });
    // the two extra readings, lettered on the pole's LEFT in the numbers' column (the cluster hangs to its right)
    for (const [err, a] of [[16.4, win(t, b.voting + 0.25, b.voting + 0.7)], [18.2, win(t, b.eighteen - 0.2, b.eighteen + 0.3)]] as const) {
      if (a <= 0.003) continue;
      c.save();
      c.globalAlpha *= a;
      c.font = `500 ${rulerPx}px ${FONT.mono}`;
      c.textAlign = 'right';
      c.textBaseline = 'alphabetic';
      c.fillStyle = mixLab(m.rim, '#efe3cf', 0.25);
      c.fillText(`${err}%`, LB.rulerX - 19, yOf(err) + rulerPx * 0.35);
      c.restore();
    }
    level(Y_RUN, LB.runnerX + LB.r * 0.8, 0.55);
    level(Y_ALEX, LB.alexX - 30, 1 - 0.4 * dimTagged);
    // (16.4 %: the pole's mark only; the two tagged lanterns dim at the same moment, so the five carry it)
    LB.others.forEach((o, i) => hungLantern(c, env, { x: o.x, y: yOf(o.err), act: 0.26, seed: i + 3, tq }));
    hungLantern(c, env, { x: LB.runnerX, y: Y_RUN, act: 0.5, seed: 11, tq });
    // the lone network: its own string from the batten as it slips out of the cluster and rises to 18.2
    const p0 = { x: LB.alexX + SEVEN[LONE].dx, y: Y_ALEX + SEVEN[LONE].dy };
    const lone = { x: lerp(p0.x, LONE_X, loneU), y: lerp(p0.y, Y_ONE, loneU) - 18 * Math.sin(Math.PI * loneU) };
    if (loneU > 0) {
      c.strokeStyle = env.fill('ink');
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(LONE_X, LB.battenY + 2);
      c.lineTo(lone.x, lone.y - 14);
      c.stroke();
    }
    level(Y_ONE, LONE_X - 14, win(t, b.eighteen - 0.1, b.eighteen + 0.4), true);
    // the fallen lantern → the cluster of seven
    const sw = 2.0 * Math.sin(tq * 1.2 + 4);
    const cx = LB.alexX + sw, cy = Y_ALEX;
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(LB.alexX, LB.battenY + 2);
    c.lineTo(cx, cy - LB.r * 1.32 * (1 - resolve) - 30 * resolve);
    c.stroke();
    if (resolve < 1) {
      paperLantern(c, { x: cx, y: cy, r: LB.r, act: 1, alpha: 1 - resolve }, env);
      // s12's tag still beside it (continuity), folding away as the lantern resolves
      const tagPx = 16;
      c.font = `500 ${tagPx}px ${FONT.mono}`;
      const tagW = c.measureText('SuperVision ·').width + tagPx * 1.3;
      lanternTag(c, env, { x: cx + LB.r + 14 + tagW / 2, y: cy - LB.r * 0.9, text: 'SuperVision ·\nToronto', turn: 1 - win(t, b.seven - 0.2, b.seven + 0.2), size: tagPx, len: 8, rot: 0.03 * Math.sin(tq * 1.9) });
    }
    if (resolve > 0) {
      const spread = 0.35 + 0.65 * resolve;
      // the binding cord around the seven
      c.save();
      c.globalAlpha *= resolve;
      c.strokeStyle = env.fill('ink');
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(cx, cy, 50 * spread, 51 * spread, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - 51 * spread);
      c.lineTo(cx, cy - 30);
      c.stroke();
      c.restore();
      SEVEN.forEach((o, i) => {
        if (i === LONE && loneU > 0) return;
        const dim = TAGGED.includes(i) ? 1 - 0.75 * dimTagged : 1;
        paperLantern(c, { x: cx + o.dx * spread, y: cy + o.dy * spread, r: SEVEN_R, act: (0.82 + 0.1 * Math.sin(i * 1.7 + tq * 0.8)) * dim, alpha: resolve, tassel: false, halo: 0.55 }, env);
      });
      // the two tagged with extra pictures: a tiny tag of stacked picture-tiles
      for (const i of TAGGED) {
        const o = SEVEN[i];
        tileTag(c, env, cx + o.dx * spread + (o.dx > 0 ? 19 : -19), cy + o.dy * spread + 6, tagU * resolve, o.dx > 0 ? 1 : -1, tq + i);
      }
    }
    if (loneU > 0) paperLantern(c, { x: lone.x, y: lone.y, r: SEVEN_R + 3 * loneU, act: 0.95, tassel: true, halo: 0.8 }, env);
  });
  f.rim({ x: 0, y: -1 });

  // the hall's audience below (the same busts as s12: the cut reads as the same room)
  {
    const c = f.c;
    const m = f.mood;
    const o = toScreen(LAYERS.L5, cam, 0, 0);
    const px = (o.x % 120) - 120;
    const still = () => 1;
    const target = toScreen(LAYERS.L4, cam, LB.alexX, 0).x;
    audienceBusts(c, { x0: px + 60, x1: 1400, y: 676, scale: 0.64, pitch: 104, lean: still, targetX: target, seed: 813, tq, ink: mixLab(m.ink, m.set, 0.18), deg: 6 });
    audienceBusts(c, { x0: px, x1: 1400, y: 700, scale: 0.8, pitch: 132, lean: still, targetX: target, seed: 812, tq, ink: mixLab(m.ink, '#000000', 0.2), deg: 8 });
  }
  // ---- screen-locked: the label (two lines), the inset, the thread, the inset's label
  const c = f.c;
  const m = f.mood;
  const la1 = win(t, b.seven + 0.1, b.seven + 0.6) * (1 - 0.65 * win(t, b.swiss, b.swiss + 0.5));
  const la2 = win(t, b.eighteen - 0.05, b.eighteen + 0.45) * (1 - 0.65 * win(t, b.swiss, b.swiss + 0.5));
  if (la1 > 0.003) {
    c.save();
    // upper left, above the pole's numbers (the busts own the bottom of the frame)
    const fs = legibleSize(c, `500 24px ${FONT.mono}`, 24);
    softPlate(c, 360, 92, 760, 140, m.ink, 0.6 * la1);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.font = `500 ${fs}px ${FONT.mono}`;
    c.globalAlpha = la1;
    c.fillStyle = textColor(m);
    c.fillText('7 networks voting (2 pre-trained on extra data)', 48, 76);
    c.globalAlpha = la2;
    c.fillStyle = mixLab(textColor(m), m.core, 0.3);
    c.fillText('one network alone 18.2% (validation)', 48, 76 + fs * 1.45);
    c.restore();
  }
  // the thread of light: from the IDSIA lantern in the inset down into the Florence cluster (stays lit)
  const src = { x: IN.x + IN_IDSIA.x * IN_S, y: IN.y + (IN_IDSIA.y + 10) * IN_S };
  const dst = toScreen(LAYERS.L4, f.cam, LB.alexX, Y_ALEX - 40);
  if (thread > 0.003) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    const ctl = { x: (src.x + dst.x) / 2 + 60, y: Math.max(src.y, dst.y) - 20 };
    const N = 40;
    const n = Math.max(1, Math.round(N * thread));
    for (const [lw, al] of [[8, 0.06], [3, 0.2], [1.2, 0.7]] as const) {
      c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.25), al * inset);
      c.lineWidth = lw;
      c.beginPath();
      for (let i = 0; i <= n; i++) {
        const u = i / N;
        const x = (1 - u) * (1 - u) * src.x + 2 * u * (1 - u) * ctl.x + u * u * dst.x;
        const y = (1 - u) * (1 - u) * src.y + 2 * u * (1 - u) * ctl.y + u * u * dst.y;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    if (thread < 1) {
      const u = thread;
      const x = (1 - u) * (1 - u) * src.x + 2 * u * (1 - u) * ctl.x + u * u * dst.x;
      const y = (1 - u) * (1 - u) * src.y + 2 * u * (1 - u) * ctl.y + u * u * dst.y;
      glow(c, x, y, 18, m.core, 0.6);
    }
    // the Florence end brightens as the thread arrives, and keeps its light after the inset folds (lineage)
    const arr = b.swiss + 0.35 + 0.9;
    const flash = win(t, arr - 0.12, arr + 0.08) * (1 - 0.6 * win(t, arr + 0.25, arr + 1.2));
    glow(c, dst.x, dst.y, 40, m.halo, 0.3 * thread + 0.25 * flash);
    glow(c, dst.x, dst.y, 16, m.core, 0.45 * flash);
    c.restore();
  }
  if (inset > 0.003) idsiaInset(c, f, IN, inset, tq);
  const la3 = win(t, b.swiss + 0.25, b.swiss + 0.75) * (1 - win(t, b.fold0, b.fold0 + 0.3));
  if (la3 > 0.003) {
    c.save();
    // under the inset, right-aligned to its rim (clear of the lone lantern and the cluster), three short lines
    const lx = IN.x + IN_R - 4;
    const fs = legibleSize(c, `500 24px ${FONT.mono}`, 24);
    const ly = IN.y + IN_R + 10 + fs;
    softPlate(c, lx - 150, ly + fs * 1.2, 420, fs * 5.6, m.ink, 0.7 * la3);
    c.globalAlpha = la3;
    c.textAlign = 'right';
    c.textBaseline = 'alphabetic';
    c.font = `500 ${fs}px ${FONT.mono}`;
    c.fillStyle = textColor(m);
    c.fillText('IDSIA, 2011:', lx, ly);
    c.fillText('road signs 99.46%', lx, ly + fs * 1.4);
    c.fillStyle = mixLab(textColor(m), m.haze, 0.25);
    c.fillText('best human 99.22%', lx, ly + fs * 2.8);
    c.restore();
  }
}

/** a tiny paper tag with three stacked picture-tiles on it (extra training pictures) */
function tileTag(c: C, env: PaintEnv, x: number, y: number, a: number, side: 1 | -1, tq: number) {
  if (a <= 0.01) return;
  const m = env.mood;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(side * 0.12 + 0.05 * Math.sin(tq * 1.6));
  c.scale(a, 1);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(0, -6);
  c.lineTo(0, 2);
  c.stroke();
  const paper = mixLab(mixLab(m.halo, '#b08a52', 0.3), m.rim, 0.45);
  c.fillStyle = paper;
  c.fillRect(-9, 2, 18, 16);
  c.fillStyle = withAlpha(m.ink, 0.75);
  for (let i = 0; i < 3; i++) c.fillRect(-6 + i * 2, 5 + i * 2.6, 9, 6.5);
  c.fillStyle = paper;
  for (let i = 0; i < 3; i++) c.fillRect(-5 + i * 2, 6 + i * 2.6, 7, 4.5);
  c.fillStyle = withAlpha(m.ink, 0.6);
  for (let i = 0; i < 3; i++) c.fillRect(-4 + i * 2, 8 + i * 2.6, 5, 1.6);
  c.restore();
}

/** the brass-rimmed lantern-slide inset: road sign, an IDSIA lantern ahead of a human-figure lantern */
function idsiaInset(c: C, f: Frame, IN: { x: number; y: number; r: number }, a: number, tq: number) {
  const m = f.mood;
  // it opens and folds like a slide: an iris from its centre
  const k = (0.55 + 0.45 * sm(a)) * IN_S;
  c.save();
  c.translate(IN.x, IN.y);
  c.scale(k, k);
  c.globalAlpha = Math.min(1, a * 1.2);
  // the slide's own soft light around it
  glow(c, 0, 0, IN.r * 1.7, m.halo, 0.12);
  c.save();
  c.beginPath();
  c.arc(0, 0, IN.r, 0, Math.PI * 2);
  c.clip();
  const sky = c.createLinearGradient(0, -IN.r, 0, IN.r);
  sky.addColorStop(0, m.sky[1]);
  sky.addColorStop(0.62, m.sky[3]);
  sky.addColorStop(1, m.sky[2]);
  c.fillStyle = sky;
  c.fillRect(-IN.r, -IN.r, IN.r * 2, IN.r * 2);
  const env: PaintEnv = { mood: m, fill: (role) => (role === 'ink' ? m.ink : role === 'fg' ? m.fg : role === 'set' ? m.set : (m as unknown as Record<string, string>)[role]), layer: LAYERS.L4, t: f.t, tq, frame: f.frame, fps: f.fps, pxScale: f.pxScale, seed: f.seed };
  // far road and verge
  c.fillStyle = mixLab(m.set, m.haze, 0.4);
  c.beginPath();
  c.moveTo(-IN.r, 52);
  c.quadraticCurveTo(-20, 40, IN.r, 56);
  c.lineTo(IN.r, IN.r);
  c.lineTo(-IN.r, IN.r);
  c.closePath();
  c.fill();
  c.fillStyle = m.ink;
  c.fillRect(-IN.r, 72, IN.r * 2, IN.r);
  // a small triangular warning sign on its post, off to the right (generic; the face lit by the sky)
  const sx = 80, sy = 22;
  c.fillRect(sx - 1.8, sy + 8, 3.6, 44);
  c.beginPath();
  c.moveTo(sx, sy - 20);
  c.lineTo(sx + 19, sy + 12);
  c.lineTo(sx - 19, sy + 12);
  c.closePath();
  c.moveTo(sx, sy - 10);
  c.lineTo(sx - 10.5, sy + 7);
  c.lineTo(sx + 10.5, sy + 7);
  c.closePath();
  c.fill('evenodd');
  c.fillRect(sx - 1.4, sy - 5, 2.8, 7);
  c.fillRect(sx - 1.4, sy + 3.5, 2.8, 2.4);
  // the little ruled scale at left (lower is better) and the bar the two lanterns hang from
  c.fillRect(-98, -84, 4, 132);
  c.fillRect(-98, -84, 140, 4);
  for (let k = 0; k <= 6; k++) c.fillRect(-98, -72 + k * 19, k % 3 === 0 ? 12 : 7, 1.6);
  for (const L of [IN_HUMAN, IN_IDSIA]) {
    c.strokeStyle = m.ink;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(L.x, -80);
    c.lineTo(L.x, L.y - 29);
    c.stroke();
    // a dashed reading to the scale
    c.save();
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
    c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(-90, L.y);
    c.lineTo(L.x - 24, L.y);
    c.stroke();
    c.restore();
  }
  const HL = IN_HUMAN, IL = IN_IDSIA;
  paperLantern(c, { x: HL.x, y: HL.y, r: 23, act: 0.72, tassel: true, halo: 0.55 }, env);
  // a standing human figure cut out of its paper (head, shoulders, arms at the sides, two legs)
  c.fillStyle = m.ink;
  c.beginPath();
  c.arc(HL.x, HL.y - 12.5, 4.4, 0, Math.PI * 2);
  c.moveTo(HL.x - 6.6, HL.y - 6.6);
  c.lineTo(HL.x + 6.6, HL.y - 6.6);
  c.lineTo(HL.x + 5.1, HL.y + 5.4);
  c.lineTo(HL.x - 5.1, HL.y + 5.4);
  c.closePath();
  c.fill();
  c.fillRect(HL.x - 8.8, HL.y - 6, 2.3, 11);
  c.fillRect(HL.x + 6.5, HL.y - 6, 2.3, 11);
  c.fillRect(HL.x - 4.4, HL.y + 4.8, 3.2, 12);
  c.fillRect(HL.x + 1.2, HL.y + 4.8, 3.2, 12);
  paperLantern(c, { x: IL.x, y: IL.y, r: 23, act: 0.98, flare: 0.25, tassel: true, halo: 0.6 }, env);
  // the tag is read: sized to the floor under the inset's open scale
  const tpx = Math.ceil(legibleSize(c, `500 16px ${FONT.mono}`, 16, 'IDSIA') * (k / IN_S));
  lanternTag(c, env, { x: IL.x, y: IL.y + 24, text: 'IDSIA', turn: 1, size: tpx, len: 3, rot: 0.03 * Math.sin(tq * 1.7) });
  c.restore();
  // the brass rim
  c.strokeStyle = mixLab(m.halo, MOODS.dawnGold.rim, 0.5);
  c.lineWidth = 4;
  c.beginPath();
  c.arc(0, 0, IN.r + 2, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(m.fg, 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, IN.r + 6, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

// ===================================================================================================== THE WORKSHOP
function paintWorkshop(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  f.camera(sc.wcam(t));
  workshop(f, { key: ID, cams: sc.WCAMS, evening: 0.15 + 0.6 * clamp01((t - b.wipe0) / (b.D - b.wipe0)) });
}
