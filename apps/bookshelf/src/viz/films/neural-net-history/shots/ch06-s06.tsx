/**
 * ch06-s06 — a long line of lanterns, night (duskRose). The messenger halves at every lantern and fades like a
 * whisper; then a protected pipe carries it at full strength past a thousand steps.
 *
 * Teaching machine (the lanternNetwork kit's paperLantern vocabulary): twelve paper lanterns on one string, a deep
 * chain (layers, or the words of a sentence read one at a time), RECEDING IN PERSPECTIVE toward a vanishing point
 * low on the far-left horizon: lantern j (counted from the near end) sits at depth scale s_j = 1 / (1 + j/11).
 *   0.25–'layers' the twelve lanterns lower on their cords, far → near
 *   'sentence'    a small warm glow is handed along the string, lantern to lantern, far → near (the net's memory of
 *                 what it has read); under each a faint word-tag hangs for a moment, then fades (texture)
 *   'messenger'   the error glows bright at the near end (strength 1.0) and the messenger bead sets off into the line
 *   'fades'       at every lantern its ring of light is multiplied by the same factor, 0.5 (a small '× 0.5' mark on
 *                 the first hop, tagged illustrative); a readout under each lantern prints the strength that reached
 *                 it, 1 → 0.5 → 0.25 → …; by the eighth lantern the bead is a faint speck, by the twelfth (≈ 0.0005)
 *                 gone. The ring's size relative to its lantern IS the strength (perspective scales both alike).
 *   'whisper' end label: vanishing gradients · Hochreiter 1991; Bengio, Simard & Frasconi 1994
 *   'Hochreiter'  the camera has eased down: Hochreiter has walked in to the near end of the lower line; name card
 *   'pipe'        a second line is drawn below, the same lanterns threaded on a straight paper pipe with a self-loop
 *                 marked × 1.0 and two hinged valves (input gate, output gate); label LSTM · …; the bead enters at
 *                 the near end and runs the whole length at full brightness (readouts 1, 1, 1 …)
 *   'thousand'    the camera pulls back: the pipe runs on to the vanishing point; the counter is the lantern index
 *                 the bead is passing, past 1,000, and the bead is still at full brightness far away
 * The bead stays bright to the cut: ch06-s07 opens on it becoming the quiet-years candle's flame (crossfade).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene, TreeKind } from '../../../film';
import {
  LAYERS, MFONT, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, glow, label, mixLab, nameCard, overscan, paperLantern,
  forestBand, ridgeline, softPlate, stars, tree, textColor, toScreen, walkTo, withAlpha, withLife,
} from '../../../film';
import { SPECS, cast } from '../cast';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch06-s06';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ perspective geometry (L4 world = rest-screen px)
const N = 12;
/** the vanishing point, low on the far-left horizon */
const VP = { x: -420, y: 520 };
/** the near end (s = 1): x of the nearest lantern; heights of the upper string, its lanterns and readouts; the pipe */
const NEAR_X = 1110;
// review round 1: the upper line hangs 40 px lower than before, so the chain sits on the upper-third line
const UP_STR = 190;
const UP_LY = 258;
const UP_RY = 332;
const PIPE_Y = 470;
const PIPE_RY = 548;
const GROUND = 700;
const LR = 30;
const PR = 12;
/** depth scale of lantern j (j = 0 at the near end); j may be fractional or beyond the twelve */
const sOf = (j: number) => 1 / (1 + j / 11);
const px = (s: number) => VP.x + (NEAR_X - VP.x) * s;
const py = (s: number, yNear: number) => VP.y + (yNear - VP.y) * s;
const groundY = (s: number) => py(s, GROUND);
/** posts: near (just past the nearest lantern) and far (just past the twelfth); more carry the pipe beyond */
const J_NEAR_POST = -0.42;
const J_FAR_POST = 11.5;
const PIPE_POSTS = [23.5, 47.5, 95.5];
const J_PIPE_END = -0.3;
const HOCH = cast.hochreiter;
const H_SPEC = SPECS.hochreiter;
/** planted clear of the near post (a gap of sky between the two verticals; review round 1) */
const H_X = 1306;
const H_ENTER = 1520;
/** the words hung under the lanterns as the memory glow reads them: the narration's own 'word by word', each tag on
 *  the lantern the glow has reached as the word is spoken (word anchors resolved in build) */
const TAG_WORDS: [string, string][] = [['word', 'word'], ['by', 'by'], ['word', 'word#2']];
/** lanterns 0..N_READ print their number; the tighter far ones print a dot (the twelfth gets one final tag) */
const N_READ = 5;
/** readout size (stage px): ≥ 22 px cap at 1080p at the camera's widest while they are read (review round 1) */
const RD = 19.5;
const READ = ['1', '0.5', '0.25', '0.125', '0.0625', '0.031', '0.016', '0.008', '0.004', '0.002', '0.001', '0.0005'];
/** mid-ground (L3) bare winter trees: [x, height, kind, seed]; thickest behind the far end of the lines */
const MID_TREES: [number, number, TreeKind, number][] = [
  [-520, 210, 'oak', 6601], [-330, 150, 'elm', 6602], [-150, 230, 'oak', 6603], [40, 130, 'birch', 6604],
  [205, 175, 'elm', 6605], [520, 96, 'sapling', 6606], [930, 120, 'birch', 6607], [1330, 190, 'oak', 6608],
  [1560, 150, 'elm', 6609],
];
const PRESENT: Pose = { ...POSES.present, angles: { ...POSES.present.angles, shoulderF: 46, elbowF: 28, wristF: -16 } };

interface B {
  D: number;
  reveal0: number;
  reveal1: number;
  mem0: number;
  mem1: number;
  err: number;
  /** the bead leaves the near lantern at hop0 and reaches the twelfth at hop0 + 11·hop (≈ 'whisper' end) */
  hop0: number;
  hop: number;
  /** the valves swing open as the bead enters the pipe */
  valve: number;
  gone: number;
  names: number;
  unroll0: number;
  pipe: number;
  launch: number;
  /** seconds per lantern for the bead's first twelve in the pipe */
  per: number;
  /** exponential rate after the twelfth (solved so the counter reaches 1,000 at t1000) */
  rate: number;
  t1000: number;
  thousand: number;
  present0: number;
  present1: number;
  /** word tags: [text, spoken at] */
  tags: [string, number][];
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  walk: ReturnType<typeof walkTo>;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const err = T.beat('chain'); // "messenger"
    const names = T.beat('names');
    const pipe = T.beat('pipe');
    const thousand = T.beat('thousand');
    // Hochreiter walks in from the right so that he has arrived and settled just before his name
    const probe = walkTo(H_SPEC, { x0: H_ENTER, x1: H_X, at: 0, cadence: 0.95 });
    const walk0 = names - 0.45 - probe(0).arrive;
    const walk = walkTo(H_SPEC, { x0: H_ENTER, x1: H_X, at: walk0, cadence: 0.95 });
    const launch = pipe + 0.42;
    const per = Math.min(0.15, (thousand - 0.05 - launch) / 12);
    const t12 = launch + 12 * per;
    // the counter crosses 1,000 on 'steps', then keeps ticking slowly
    const t1000 = T.word('L0614', 'steps') + 0.1;
    // j(t) = 12 + A (e^{r(t − t12)} − 1), A·r = 1/per (no jump in speed); solve r so that j(t1000) = 1000
    const U = t1000 - t12;
    let lo = 0.01, hi = 12;
    for (let k = 0; k < 60; k++) {
      const r = (lo + hi) / 2;
      const j = 12 + (1 / per / r) * (Math.exp(r * U) - 1);
      if (j > 1000) hi = r;
      else lo = r;
    }
    const b: B = {
      D, err, names, pipe, launch, per, rate: (lo + hi) / 2, t1000, thousand,
      reveal0: 0.25,
      reveal1: T.wordEnd('L0613', 'layers'),
      mem0: T.word('L0613', 'sentence') - 0.1,
      mem1: T.wordEnd('L0613', 'word#2') - 0.05,
      hop0: err + 0.16,
      hop: (T.beat('gone') - 0.08 - (err + 0.16)) / (N - 1),
      valve: pipe + 0.2,
      gone: T.beat('gone'),
      unroll0: pipe - 0.5,
      present0: T.word('L0614', 'protected') - 0.3,
      present1: pipe + 0.95,
      tags: TAG_WORDS.map(([txt, w]) => [txt, T.word('L0613', w)] as [string, number]),
    };
    const cam = camKeys([
      [0, 700, 318, 50],
      [err - 0.1, 728, 312, 104],
      [b.gone + 0.3, 610, 326, 112],
      [T.line('L0614').start + 0.25, 604, 330, 108],
      [names + 0.25, 716, 408, -30],
      [thousand - 0.15, 694, 404, -24],
      [D, 470, 388, -480],
    ], 0.3);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 16; i++) CAMS.push(cam((D * i) / 16));
    tl.hold(0, D);
    return { tl, b, cam, CAMS, walk };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    // the sun sits low behind the vanishing point: the lines run into the light
    const vp = toScreen(LAYERS.L4, cam, VP.x, VP.y);
    f.backlight({ sunX: Math.max(80, Math.min(560, vp.x + 40)), sunY: 470, sunRadius: 460, intensity: 0.7 });
    paintBack(f, sc);
    f.fog({ yCenter: 0.66 * 720, height: 0.3 * 720, alpha: 0.18, drift: 5 });
    f.layer('L4', (c, env) => {
      groundPlane(f, c, sc);
      posts(c, env, t, b);
      upperLine(c, env, t, b);
    });
    f.fog({ yCenter: 0.72 * 720, height: 0.16 * 720, alpha: 0.08, drift: 7 });
    f.layer('L4', (c, env) => {
      lowerLine(c, env, t, b);
      hochreiter(c, env, sc);
    });
    f.rim({ x: -0.6, y: -0.25 });
    f.layer('L5', (c, env) => nearGrass(f, c, env, sc));
    type_(f, b);
  },
});

// ------------------------------------------------------------------ background: a dusk sky with stars, far hills
function paintBack(f: Frame, sc: Scene) {
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, sc.CAMS, 60);
    f.cached(`${ID}/L1/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      // night closes in from above: the sky darkens toward the top of frame
      const dk = cc.createLinearGradient(0, r.y, 0, 430);
      dk.addColorStop(0, withAlpha(env.mood.ink, 0.62));
      dk.addColorStop(0.55, withAlpha(env.mood.ink, 0.3));
      dk.addColorStop(1, withAlpha(env.mood.ink, 0));
      cc.fillStyle = dk;
      cc.fillRect(r.x, r.y, r.w, 430 - r.y);
      stars(cc, { x: r.x, y: r.y, w: r.w, h: 260 - r.y, count: 80, seed: 606, twinkle: 0 }, env);
      ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 512, amp: 58, scale: 300, seed: 61, ground: r.y + r.h - 512 + 40 }, env);
    })(c, r.x, r.y);
  });
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, sc.CAMS, 60);
    f.cached(`${ID}/L3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      ridgeline(cc, { x0: r.x, x1: r.x + r.w, y: 530, amp: 16, scale: 140, seed: 66, ground: r.y + r.h - 530 + 40 }, env);
      // a low hedge line and bare winter trees between the ridge and the lantern lines
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 532, h: 34, kind: 'bare', density: 7, seed: 663, ground: r.y + r.h - 532 + 40 }, env);
      for (const [x, h, kind, seed] of MID_TREES) tree(cc, { x, y: 536, h, kind, seed, detail: 0.7 }, env);
    })(c, r.x, r.y);
  });
}

/** the ground: a plane running to the horizon, hazy far, dark near; faint furrows converge on the vanishing point */
function groundPlane(f: Frame, c: C, sc: Scene) {
  const r = overscan(LAYERS.L4, sc.CAMS, 40);
  const y0 = VP.y - 6;
  const m = f.mood;
  f.cached(`${ID}/ground/${m.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.y + r.h - y0), (cc) => {
    cc.translate(-r.x, -y0);
    const g = cc.createLinearGradient(0, VP.y, 0, r.y + r.h);
    g.addColorStop(0, mixLab(m.setHaze, m.haze, 0.3));
    g.addColorStop(0.04, mixLab(m.set, m.setHaze, 0.35));
    g.addColorStop(0.16, m.set);
    g.addColorStop(0.4, mixLab(m.ink, m.set, 0.35));
    g.addColorStop(1, m.ink);
    cc.fillStyle = g;
    cc.beginPath();
    cc.moveTo(r.x, VP.y + 4);
    for (let x = r.x; x <= r.x + r.w + 8; x += 10) cc.lineTo(x, VP.y + 1.5 * Math.sin(x * 0.02) + Math.sin(x * 0.071));
    cc.lineTo(r.x + r.w + 8, r.y + r.h);
    cc.lineTo(r.x, r.y + r.h);
    cc.closePath();
    cc.fill();
    // furrows converging on the vanishing point (cut-lines in the field)
    cc.strokeStyle = withAlpha(m.ink, 0.3);
    cc.lineWidth = 1.2;
    for (let k = -6; k <= 16; k++) {
      const bx = VP.x + k * 260;
      cc.beginPath();
      cc.moveTo(VP.x + (bx - VP.x) * 0.02, VP.y + 3);
      cc.lineTo(bx, r.y + r.h);
      cc.stroke();
    }
    // grass tufts at the far edge (tiny), then nearer (larger)
    cc.fillStyle = mixLab(m.ink, m.set, 0.4);
    for (let i = 0; i < r.w / 6; i++) {
      const x = r.x + i * 6 + 3 * Math.sin(i * 12.9898);
      const h = 2 + 3 * (0.5 + 0.5 * Math.sin(i * 78.233));
      cc.beginPath();
      cc.moveTo(x - 1, VP.y + 2);
      cc.lineTo(x + 0.3 * h * Math.sin(i), VP.y - h);
      cc.lineTo(x + 1, VP.y + 2);
      cc.fill();
    }
  })(c, r.x, y0);
}

function postAt(c: C, ink: string, j: number, top: number) {
  const s = sOf(j);
  const x = px(s);
  const w = 11 * s;
  const yT = py(s, top);
  c.fillStyle = ink;
  c.fillRect(x - w / 2, yT, w, groundY(s) - yT + 2);
  c.fillRect(x - w * 1.2, yT - 4 * s, w * 2.4, 6 * s);
}

function posts(c: C, env: PaintEnv, t: number, b: B) {
  const ink = env.fill('ink');
  postAt(c, ink, J_NEAR_POST, UP_STR - 30);
  postAt(c, ink, J_FAR_POST, UP_STR - 30);
  const head = unrollJ(t, b);
  for (const j of PIPE_POSTS) if (head > j) postAt(c, ink, j, PIPE_Y - 34);
}

// ------------------------------------------------------------------ the upper line: the whisper
/** a point on the upper string at fractional lantern position j (with a little sag between the posts) */
function stringY(j: number) {
  const s = sOf(j);
  const u = clamp01((j - J_NEAR_POST) / (J_FAR_POST - J_NEAR_POST));
  return py(s, UP_STR) + 10 * s * Math.sin(u * Math.PI);
}

/** time the bead reaches lantern j (j = 0 is the near end, where the error starts) */
const arriveAt = (j: number, b: B) => (j === 0 ? b.err : b.hop0 + j * b.hop);
/** the whisper bead: fractional position j and its strength 0.5^(lanterns reached) */
function whisper(t: number, b: B): { j: number; s: number; on: boolean } {
  if (t < b.err) return { j: 0, s: 1, on: false };
  const u = Math.max(0, (t - b.hop0) / b.hop);
  const j = Math.min(N - 1, u);
  // the strength halves as the bead passes through each lantern: a quick smoothed step (≈ 0.12 of a hop) centred
  // on the lantern, so the glow visibly shrinks on arrival rather than jumping
  const k = Math.floor(u + 1e-6);
  const F = Math.min(N - 1, k + sm((u - k - 0.9) / 0.14));
  // past the twelfth lantern the last speck goes out (by the end of 'whisper')
  return { j, s: Math.pow(0.5, F), on: u < N - 1 + 0.35 };
}

function upperLine(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  // the string between the posts
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.6;
  c.beginPath();
  for (let k = 0; k <= 60; k++) {
    const j = J_NEAR_POST + ((J_FAR_POST - J_NEAR_POST) * k) / 60;
    const x = px(sOf(j)), y = stringY(j);
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  // the memory glow handed along the string while the sentence is read: far (j = 11) → near (j = 0)
  const memU = (t - b.mem0) / (b.mem1 - b.mem0);
  const memJ = (N - 1) * (1 - clamp01(memU));
  const bead = whisper(t, b);
  // far lanterns first (painter's order)
  for (let j = N - 1; j >= 0; j--) {
    const i = N - 1 - j; // left → right index
    const at = b.reveal0 + (i / (N - 1)) * (b.reveal1 - b.reveal0 - 0.35);
    const a = sm((tq - at) / 0.35);
    if (a <= 0) continue;
    const s = sOf(j);
    const x = px(s);
    const ly = py(s, UP_LY) - (1 - a) * 16 * s;
    // memory: lit as the warm glow reaches it, then settles low; the whole memory glow sinks to near-off before
    // 'messenger', so the halving that follows reads in LIGHT, not only in numbers
    const mi = memU < -0.02 ? -1 : (N - 1 - memJ) - i;
    const mem = mi < 0 ? 0 : mi < 1.2 ? 0.6 * sm(mi / 0.35) - 0.4 * sm((mi - 0.35) / 0.85) : 0.2;
    const memFade = 1 - win(t, b.err - 0.75, b.err - 0.1);
    // the messenger's visit: a flare AND a lingering glow, both proportional to the strength that reached it
    // (1.0 bright, 0.5 half, 0.25 a quarter … from about the eighth lantern on, nothing: the first lanterns never feel it)
    const ta = arriveAt(j, b);
    const sAt = Math.pow(0.5, j);
    const since = t - ta;
    const visit = since >= 0 ? sAt * (0.55 * Math.exp(-since * 2.2) + 0.45 * sm(since / 0.25)) : 0;
    const err = j === 0 ? win(t, b.err - 0.15, b.err + 0.1) * (1 - 0.35 * win(t, b.err + 0.6, b.err + 1.8)) : 0;
    const act = 0.06 + mem * memFade + 0.9 * visit + err * 0.6;
    const flare = Math.max(err, since >= 0 ? sAt * Math.exp(-since * 2.5) : 0);
    paperLantern(c, { x, y: ly, r: LR * s, act: Math.min(1, act), flare, hang: ly - LR * s * 1.2 - stringY(j), tassel: true, alpha: a, halo: 0.9 }, env);
    // the afterglow of the messenger's visit: a halo whose size and brightness are the strength that reached this
    // lantern (1, 0.5, 0.25 …), lingering ~0.8 s after the bead has moved on
    if (since >= 0 && j > 0 && sAt > 0.004) {
      const ag = Math.exp(-since / 0.8);
      glow(c, x, ly, LR * s * (1.1 + 2.2 * sAt), m.halo, 0.55 * sAt * ag);
    }
    // the readout under the lantern, printed as the bead reaches it, on one baseline. Where the line is tight
    // (lanterns 7–11) the readout is a dot; the twelfth gets the one final tag, ≈ 0.0005, hung a step lower.
    if (t >= ta) {
      const ra = sm((t - ta) / 0.18);
      const col = mixLab(textColor(m), m.haze, 0.3 * (1 - Math.pow(sAt, 0.2)));
      const ry = py(s, UP_RY);
      const al = ra * (0.6 + 0.4 * Math.pow(sAt, 0.12));
      if (j <= N_READ) label(c, READ[j], x, ry, { size: RD, font: MFONT.mono, weight: 500, color: col, align: 'center', alpha: al, shadow: withAlpha(m.ink, 0.95) });
      else {
        c.fillStyle = withAlpha(col, al * 0.85);
        c.beginPath();
        c.arc(x, ry - 5, 2.1, 0, Math.PI * 2);
        c.fill();
        if (j === N - 1) {
          c.strokeStyle = withAlpha(col, al * 0.5);
          c.lineWidth = 0.9;
          c.beginPath();
          c.moveTo(x, ry - 1);
          c.lineTo(x + 8, ry + 12);
          c.stroke();
          label(c, '≈ 0.0005', x + 2, ry + 30, { size: RD, font: MFONT.mono, weight: 500, color: col, align: 'left', alpha: al, shadow: withAlpha(m.ink, 0.95) });
        }
      }
    }
  }
  // the sentence, read word by word: a faint tag hangs under each lantern for a moment as the warm glow passes it
  wordTags(c, env, t, b);
  // the moving warm glow of memory along the string
  if (memU > -0.02 && memU < 1.1) {
    const k = 1 - sm((memU - 0.95) / 0.15);
    const x = px(sOf(memJ)), y = stringY(memJ);
    glow(c, x, y, 52 * sOf(memJ), m.halo, 0.6 * k);
    glow(c, x, y, 13 * sOf(memJ), m.core, 0.9 * k);
  }
  // the messenger bead: a bead of light whose glow radius IS its strength (26 px × 0.5^k, × the lantern's
  // perspective scale), so the eye sees it shrink lantern by lantern as well as reading the numbers
  if (bead.on && bead.s > 0.003) {
    const s = sOf(bead.j);
    const x = px(s), y = stringY(bead.j);
    const G = 26 * bead.s * s;
    const a = Math.min(1, 0.35 + 0.65 * Math.pow(bead.s, 0.25));
    glow(c, x, y, G * 2.6 + 2, m.halo, 0.6 * a);
    glow(c, x, y, G + 1.2, m.core, 0.95 * a);
    glow(c, x, y, Math.max(1.2, G * 0.4), '#fff6e4', 0.8 * a);
    c.save();
    c.globalAlpha = a;
    c.strokeStyle = withAlpha(m.core, 0.85);
    c.lineWidth = Math.max(0.7, 2 * Math.sqrt(bead.s) * s);
    c.beginPath();
    c.arc(x, y, Math.max(1.4, G * 0.95), 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  // the '× 0.5' mark over the first hop (a diagram mark, tagged illustrative)
  const ma = win(t, b.err + 0.25, b.err + 0.55) * (1 - win(t, b.gone + 1.6, b.gone + 2.2));
  if (ma > 0.01) {
    const x0 = px(sOf(0)), x1 = px(sOf(1));
    const y0 = stringY(0) - 26, y1 = stringY(1) - 24;
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 12;
    c.save();
    c.globalAlpha = ma;
    c.strokeStyle = withAlpha(m.rim, 0.75);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(x0 - 8, y0);
    c.quadraticCurveTo(mx, my - 4, x1 + 8, y1);
    c.stroke();
    c.beginPath();
    c.moveTo(x1 + 8, y1);
    c.lineTo(x1 + 16, y1 - 6);
    c.moveTo(x1 + 8, y1);
    c.lineTo(x1 + 17, y1 + 2);
    c.stroke();
    c.restore();
    label(c, '× 0.5', mx, my - 10, { size: 21, font: MFONT.mono, weight: 500, color: textColor(m), align: 'center', alpha: ma, shadow: withAlpha(m.ink, 0.95) });
    label(c, 'illustrative', mx, my - 36, { size: 20, font: MFONT.serif, italic: true, color: mixLab(textColor(m), m.haze, 0.25), align: 'center', alpha: ma * 0.9, shadow: withAlpha(m.ink, 0.95) });
  }
}

/** the word tags: as the narrator says 'word by word', each word hangs under the lantern the memory glow has just
 *  reached (anchored with T.word), holds ~0.7 s and fades; alternate tags hang a step lower so neighbours never touch */
function wordTags(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  for (let i = 0; i < b.tags.length; i++) {
    const [txt, tw] = b.tags[i];
    // gone before 'messenger', so the readouts that print under the same lanterns never meet a tag
    const a = sm((t - (tw - 0.08)) / 0.14) * (1 - sm((t - Math.min(tw + 0.75, b.err - 0.45)) / 0.35));
    if (a <= 0.01) continue;
    const memU = (tw - b.mem0) / (b.mem1 - b.mem0);
    const j = Math.round((N - 1) * (1 - clamp01(memU)));
    const s = sOf(j);
    const x = px(s);
    const top = py(s, UP_LY) + LR * s * 1.15;
    const y = top + 34 + (i % 2) * 22;
    c.strokeStyle = withAlpha(m.halo, 0.45 * a);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(x, y - 18);
    c.stroke();
    label(c, txt, x, y, { size: 22, font: MFONT.mono, weight: 500, color: mixLab(textColor(m), m.core, 0.3), align: 'center', alpha: 0.9 * a, shadow: withAlpha(m.ink, 0.95) });
  }
}

// ------------------------------------------------------------------ the lower line: the protected pipe
/** how far the pipe has been drawn (lantern index from the near end): the twelve, then on to the vanishing point */
function unrollJ(t: number, b: B): number {
  if (t < b.unroll0) return -1;
  const u = t - b.unroll0;
  return u < 0.55 ? (12 * u) / 0.55 : 12 * Math.exp(3.2 * (u - 0.55));
}
/** the bead in the pipe: lantern index j (fractional) */
function pipeJ(t: number, b: B): number {
  if (t < b.launch) return J_PIPE_END + 0.1;
  const t12 = b.launch + 12 * b.per;
  if (t < t12) return (t - b.launch) / b.per;
  const A = 1 / b.per / b.rate;
  const j = 12 + A * (Math.exp(b.rate * (Math.min(t, b.t1000) - t12)) - 1);
  return t > b.t1000 ? 1000 + (t - b.t1000) * 22 : j;
}
const pipeArrive = (j: number, b: B) => b.launch + j * b.per;

function lowerLine(c: C, env: PaintEnv, t: number, b: B) {
  if (t < b.unroll0) return;
  const m = env.mood;
  const head = unrollJ(t, b);
  const jEnd = Math.min(head, 4000);
  const bj = pipeJ(t, b);
  const beadOn = t > b.launch - 0.35;
  // lanterns threaded on the pipe (far first); beyond ~70 they are a texture of tiny ribs, so stop there
  const jMax = Math.min(Math.floor(jEnd), 70);
  for (let j = jMax; j >= 0; j--) {
    const s = sOf(j);
    const appear = j < 12 ? b.unroll0 + (0.55 * j) / 12 : b.unroll0 + 0.55 + Math.log(j / 12) / 3.2;
    const a = sm((t - appear) / 0.22);
    if (a <= 0) continue;
    const ta = pipeArrive(j, b);
    const visit = j < 12 ? (t >= ta ? Math.exp(-(t - ta) * 1.5) : 0) : bj > j ? Math.exp(-(bj - j) * 0.15) * 0.6 : 0;
    const err = j === 0 ? 0.6 * win(t, b.launch - 0.3, b.launch) * (1 - win(t, b.launch + 0.6, b.launch + 1.6)) : 0;
    const act = 0.14 + 0.8 * visit + err;
    paperLantern(c, { x: px(s), y: py(s, PIPE_Y) - (1 - a) * 10 * s, r: LR * s, act: Math.min(1, act), hang: 0, tassel: false, alpha: a, halo: 0.85 }, env);
    if (j < 12 && t >= ta) {
      label(c, '1', px(s), py(s, PIPE_RY), { size: RD, font: MFONT.mono, weight: 500, color: textColor(m), align: 'center', alpha: sm((t - ta) / 0.18), shadow: withAlpha(m.ink, 0.95) });
    }
  }
  // the pipe: translucent paper between two ink edges, converging on the vanishing point
  const sN = sOf(J_PIPE_END), sF = sOf(jEnd);
  const xN = px(sN), xF = px(sF);
  const yN = py(sN, PIPE_Y), yF = py(sF, PIPE_Y);
  const rN = PR * sN, rF = PR * sF;
  c.save();
  c.beginPath();
  c.moveTo(xN, yN - rN);
  c.lineTo(xF, yF - rF);
  c.lineTo(xF, yF + rF);
  c.lineTo(xN, yN + rN);
  c.closePath();
  c.fillStyle = withAlpha(mixLab(m.halo, m.setHaze, 0.55), 0.5);
  c.fill();
  // the paper glows from within around the bead
  if (beadOn) {
    const sb = sOf(bj);
    const bx = px(sb);
    const reach = 190 * sb + 30;
    const g = c.createLinearGradient(bx - reach, 0, bx + reach, 0);
    g.addColorStop(0, withAlpha(m.core, 0));
    g.addColorStop(0.5, withAlpha(m.core, 0.6 * sm((t - (b.launch - 0.35)) / 0.35)));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.save();
    c.clip();
    c.fillStyle = g;
    c.fillRect(bx - reach, VP.y - 200, reach * 2, 400);
    c.restore();
  }
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(xN, yN - rN);
  c.lineTo(xF, yF - rF);
  c.moveTo(xN, yN + rN);
  c.lineTo(xF, yF + rF);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(xN, yN - rN + 2);
  c.lineTo(xF, yF - rF + 2 * sF);
  c.stroke();
  // seams midway between lanterns
  c.strokeStyle = withAlpha(m.ink, 0.65);
  c.lineWidth = 1.4;
  for (let j = 0; j < Math.min(jEnd, 40); j++) {
    const s = sOf(j + 0.5);
    const x = px(s), y = py(s, PIPE_Y);
    c.beginPath();
    c.moveTo(x, y - PR * s);
    c.lineTo(x, y + PR * s);
    c.stroke();
  }
  // the near end cap
  c.fillStyle = env.fill('ink');
  c.fillRect(xN - 3, yN - rN - 4, 7, rN * 2 + 8);
  c.restore();
  diagramMarks(c, env, t, b);
  // the bead at full strength (its ring scales only with distance)
  if (beadOn) {
    const k0 = sm((t - (b.launch - 0.35)) / 0.35);
    const s = sOf(bj);
    const x = px(s), y = py(s, PIPE_Y);
    const R = LR * 1.05 * s;
    // in the last second the far bead blooms (×1.5): ch06-s07 opens on this light becoming a candle flame
    const bloom = 1 + 0.5 * sm((t - (b.D - 1.1)) / 0.6);
    glow(c, x, y, Math.max(44, R * 3) * bloom, m.halo, Math.min(0.85, 0.5 * k0 * bloom));
    glow(c, x, y, Math.max(15, R * 1.2) * bloom, m.core, 0.95 * k0);
    if (bloom > 1.01) glow(c, x, y, 7 * bloom, '#fff6e4', 0.6 * (bloom - 1) * 2);
    c.save();
    c.globalAlpha = k0;
    c.strokeStyle = withAlpha(m.core, 0.92);
    c.lineWidth = Math.max(1, 2.4 * s);
    c.beginPath();
    c.arc(x, y, Math.max(2, R), 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = m.ink;
    c.beginPath();
    c.arc(x, y, Math.max(1, 4.4 * s), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

/** the × 1.0 self-loop (under the pipe, second cell) and the two hinged valves on the first cell: the input gate on
 *  top, the output gate below; paper flaps on brass hinges that swing open as the bead enters (b.valve) */
function diagramMarks(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const a = win(t, b.pipe - 0.1, b.pipe + 0.35);
  if (a <= 0.01) return;
  const ink = env.fill('ink');
  const paper = mixLab(m.halo, m.setHaze, 0.45);
  // the loop hangs between lanterns 2 and 3 (clear of the valves on the first cell); its '× 1.0' sits under the
  // readout row, centred in the gap between the two '1's (review round 1: it had sat on a lantern and its readout)
  const s = sOf(2.5);
  const cx = px(s);
  const cy = py(s, PIPE_Y) + PR * s + 16 * s;
  const R = 13 * s;
  c.save();
  c.globalAlpha = a;
  c.lineCap = 'butt';
  c.strokeStyle = ink;
  c.lineWidth = 9 * s;
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI * 0.12, Math.PI * 1.12, false);
  c.stroke();
  c.strokeStyle = paper;
  c.lineWidth = 5.4 * s;
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI * 0.1, Math.PI * 1.1, false);
  c.stroke();
  // arrowhead: the loop returns into the pipe
  const ax = cx - R * Math.cos(Math.PI * 0.1), ay = cy - R * Math.sin(Math.PI * 0.1);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(ax - 7 * s, ay + 1 * s);
  c.lineTo(ax + 6 * s, ay + 1 * s);
  c.lineTo(ax - 0.5 * s, ay - 9 * s);
  c.closePath();
  c.fill();
  // a hairline from the loop down to its label
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(cx, cy + R + 5 * s);
  c.lineTo(cx, py(s, PIPE_RY) + 6);
  c.stroke();
  c.restore();
  label(c, '× 1.0', cx, py(s, PIPE_RY) + 30, { size: 22.5, font: MFONT.mono, weight: 500, color: textColor(m), align: 'center', alpha: a, shadow: withAlpha(m.ink, 0.95) });
  // the valves: on the first cell (between the near lantern and the next), hinged at the far side, opening toward
  // the near end as the bead arrives; a slight paper flutter on the twos while open
  const sv = sOf(0.5);
  const vx = px(sv) - 24 * sv;
  const vy = py(sv, PIPE_Y);
  const tq = tq12(t);
  const open = sm((tq - b.valve) / 0.4) * (0.95 + 0.06 * Math.sin(tq * 5.3)) + 0.06;
  const L = 52 * sv, Th = 9 * sv;
  for (const dir of [-1, 1] as const) {
    const hy = vy + dir * (PR * sv + 1);
    c.save();
    c.globalAlpha = a;
    c.translate(vx, hy);
    c.rotate(dir * open);
    // the flap: paper with an ink edge and a darker underside
    c.fillStyle = withAlpha(m.ink, 0.35);
    c.fillRect(2, dir < 0 ? -Th + 3 : 3, L, Th);
    c.fillStyle = paper;
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.beginPath();
    c.rect(0, dir < 0 ? -Th : 0, L, Th);
    c.fill();
    c.stroke();
    c.fillStyle = withAlpha(m.core, 0.35 * open);
    c.fillRect(L * 0.55, dir < 0 ? -Th + 1.5 : 1.5, L * 0.4, Th - 3);
    c.restore();
    // the brass hinge
    c.save();
    c.globalAlpha = a;
    c.fillStyle = ink;
    c.beginPath();
    c.arc(vx, hy, 5.2 * sv, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(m.halo, m.set, 0.25);
    c.beginPath();
    c.arc(vx, hy, 3 * sv, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

// ------------------------------------------------------------------ Hochreiter
function hochreiter(c: C, env: PaintEnv, sc: Scene) {
  const tq = env.tq;
  const b = sc.b;
  const w = sc.walk(env.t);
  if (!w.walking && tq < w.arrive) return;
  let pose: Pose = w.pose;
  if (!w.walking) {
    // settled: a visible breathing idle; on 'protected' a small presenting gesture toward the pipe, held through
    // 'pipe', then lowered (on the twos)
    const u = sm((tq - b.present0) / 0.45) * (1 - sm((tq - b.present1) / 0.55));
    pose = withLife(blendPose(w.pose, PRESENT, u), tq, 17, 2.4);
  }
  // the darkest shape in frame (PUPPET_NEAR_BLACK), rimmed on the contour that faces the lit near lanterns
  HOCH.draw(c, { x: w.x, y: GROUND, facing: 'left', pose, light: { x: -0.8, y: -0.4, floor: 0.2 }, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -1, y: -0.45, px: 1.6, alpha: 0.75 } }, env);
}

// ------------------------------------------------------------------ near plane: grass at the bottom (blurred)
/**
 * The near (L5) plane, from frame 0: a reed clump in the left third (tall at the frame's left edge, tapering into
 * the grass by the middle of the frame) and the low grass band along the whole bottom. Review round 1: the bitmap
 * used to start at y 660, which cropped the clump and its post to stubs, so the opening had no near plane at all.
 * The clump's profile is set so that, as the camera tilts down to Hochreiter, it settles below the pipe's far end.
 */
const REED_TOP = 440;
function reedTop(x: number): number {
  // tallest (≈ 500) at the left edge of the opening frame, easing down to the grass band (≈ 690) by x ≈ 560
  const u = clamp01((x - 270) / 330);
  return 500 + 190 * sm(u);
}
function nearGrass(f: Frame, c: C, env: PaintEnv, sc: Scene) {
  const r = overscan(LAYERS.L5, sc.CAMS, 30);
  const y0 = REED_TOP;
  const y1 = Math.max(r.y + r.h, 800);
  f.cached(`${ID}/L5b/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(y1 - y0), (cc) => {
    cc.translate(-r.x, -y0);
    cc.fillStyle = env.fill('fg');
    // the low band along the whole bottom
    for (let i = 0; i < r.w / 6; i++) {
      const x = r.x + i * 6;
      const dense = Math.pow(0.5 + 0.5 * Math.sin(x * 0.0045 + 2.1), 3);
      const h = 8 + 60 * dense * (0.55 + 0.45 * Math.sin(i * 78.233));
      const lean = 0.4 * Math.sin(i * 5.1);
      cc.beginPath();
      cc.moveTo(x - 2.6, 772);
      cc.quadraticCurveTo(x + lean * h * 0.4, 762 - h * 0.5, x + lean * h, 768 - h);
      cc.lineTo(x + 2.6, 772);
      cc.fill();
    }
    cc.fillRect(r.x, 766, r.w, y1 - 766);
    // the clump: tall reeds and seed heads, leaning off the wind, thick at the left edge, thinning to the right
    for (let i = 0; i < 120; i++) {
      const x = 90 + i * 4 + 5 * Math.sin(i * 7.7);
      const top = reedTop(x) + 26 * (0.5 + 0.5 * Math.sin(i * 41.3)) * (i % 3 === 0 ? -0.6 : 1);
      const h = 772 - top;
      if (h < 30) continue;
      const lean = 0.18 * Math.sin(i * 3.3) - 0.08;
      const w = 2.2 + 1.4 * (0.5 + 0.5 * Math.sin(i * 12.1));
      cc.beginPath();
      cc.moveTo(x - w, 772);
      cc.quadraticCurveTo(x + lean * h * 0.35, 772 - h * 0.55, x + lean * h, 772 - h);
      cc.lineTo(x + w, 772);
      cc.fill();
      // a seed head on every fourth reed
      if (i % 4 === 1 && h > 120) {
        cc.save();
        cc.translate(x + lean * h, 772 - h);
        cc.rotate(lean * 0.9);
        cc.beginPath();
        cc.ellipse(0, -9, 3.4, 12, 0, 0, Math.PI * 2);
        cc.fill();
        cc.restore();
      }
    }
    // a mound of grass at the clump's foot, so the reeds grow out of something
    cc.beginPath();
    cc.moveTo(40, 772);
    cc.quadraticCurveTo(220, 690, 420, 742);
    cc.quadraticCurveTo(520, 760, 600, 772);
    cc.closePath();
    cc.fill();
  })(c, r.x, y0);
}

// ------------------------------------------------------------------ screen-locked type
function type_(f: Frame, b: B) {
  const c = f.c;
  const t = f.t;
  const m = f.mood;
  // label 1: the whisper's end
  const va = win(t, b.gone + 0.15, b.gone + 0.6) * (1 - win(t, b.pipe - 0.75, b.pipe - 0.3));
  if (va > 0.01) {
    c.save();
    c.globalAlpha = va;
    softPlate(c, 360, 100, 780, 170, m.ink, 0.62);
    c.restore();
    label(c, 'vanishing gradients', 64, 88, { size: 32, font: MFONT.serif, italic: true, color: m.core, align: 'left', alpha: va });
    label(c, 'Hochreiter 1991  ·  Bengio, Simard & Frasconi 1994', 66, 126, { size: 23.5, font: MFONT.serif, color: textColor(m), align: 'left', alpha: va * 0.95 });
  }
  // name card (both names, as they are spoken)
  nameCard(c, { name: 'Sepp Hochreiter & Jürgen Schmidhuber', role: 'LSTM, 1997', at: b.names - 0.15, dur: Math.min(4.4, b.thousand - b.names - 0.15) }, { t, mood: m, seed: 61 });
  // label 2: the pipe
  // full by 'pipe' + 0.1 (review round 1: it had reached full opacity half a second late)
  const la = win(t, b.pipe - 0.25, b.pipe + 0.1) * (1 - win(t, b.D - 0.7, b.D - 0.2));
  if (la > 0.01) {
    c.save();
    c.globalAlpha = la;
    softPlate(c, 400, 96, 880, 130, m.ink, 0.62);
    c.restore();
    label(c, 'LSTM  ·  × 1.0 loop  ·  input gate  ·  output gate', 64, 104, { size: 27, font: MFONT.serif, italic: true, color: textColor(m), align: 'left', alpha: la });
  }
  // the step counter: the lantern the bead is passing
  const ca = win(t, b.thousand - 0.35, b.thousand + 0.05) * (1 - win(t, b.D - 0.45, b.D));
  if (ca > 0.01) {
    const j = pipeJ(tq12(t), b);
    const n = Math.max(1, Math.floor(j + 1));
    c.save();
    c.globalAlpha = ca;
    softPlate(c, 170, 512, 340, 84, m.ink, 0.55);
    c.restore();
    label(c, 'step', 70, 520, { size: 24, font: MFONT.serif, italic: true, color: textColor(m), align: 'left', alpha: ca * 0.9 });
    label(c, n.toLocaleString('en-US'), 130, 520, { size: 27, font: MFONT.mono, weight: 500, color: m.core, align: 'left', alpha: ca });
  }
}
