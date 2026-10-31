/**
 * ch07-s11 — HONEST SCOPE (scene, duskRose; crossfade in from the snapping fix; 26.7 s). Device 1, by the gallery.
 *   L0720  "To be fair, that's a small generic network, not a hand-written program unfrozen."
 *   L0720a "The lab did unfreeze one app's five design numbers to follow a drag. One gradient step solved nearly two in
 *           three moving frames."
 *   L0721  "A frozen program trained end to end inside a text-writing network, like nanoGPT? Not attempted. It hangs as
 *           a question."
 *
 * Back on the copper line BY THE GALLERY at dusk (sets/ch07-s01-gallery + sets/tagLine 'none', as ch07-s01 / s05): tag
 * 10 hangs unstruck where s05 left it, its thread at thirteen days, the red pencil resting beside it.
 *   'fair'       the gallery stage, small at frame left, is shown plain: its backdrop lamp comes up a little. No card.
 *   'unfreeze'   a small brass panel of five knobs drops in on two threads beside the stage (the drag-knobs lab: five
 *                hand-written design numbers of an app shell lifted into cells); on 'five design numbers' each knob
 *                turns once and a copper cell-ring closes round it.
 *   'drag'       a paper strip of 25 small drag-frame cards slides out along a rail beneath the knobs, all grey: one card
 *                per 4 % of the frames that moved.
 *   'step'       every knob turns one notch together (one gradient step); 16 cards flip, left to right on twos, to a
 *                solved copper face; the next 6 stay grey, each with a tiny brass slope gauge whose needle lies flat at
 *                0; the last 3 stay plain grey. The label sets beneath the strip (line one on the flip, line two as the
 *                gauges show): "one step: 63.6% of moving frames solved" / "24.6% began with every slope 0".
 *   L0721        the camera drifts on to tag 10 (the strip's label has been read and fades).
 *   'network'    a small question-mark tag swings in on a slack thread hanging from tag 10 itself (Device 1: an
 *                aspiration nobody has tested), a plain label threaded on it: "the README's second use-case" /
 *                "not attempted in the repo".
 *   'attempted'  the red-pencil hand (frame right) lifts the pencil from beside tag 10, hovers over the question tag,
 *                and lowers it again without writing.
 *   'question'   the slack thread sways once and stills.
 * CAMERA: a slow drift left to right (and down) along the line, from the gallery and knobs to the question tag.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, dustMotes, FONT, legibleSize, mixLab, textProbe, textRole, toLayer, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { copperOf, drawPencil, type HandsPose } from '../sets/narratorHands';
import { SLOT_X, TAG, lineYAt, tagLineScene, tagsAt, type TagState } from '../sets/tagLine';
import { galleryBack } from '../sets/ch07-s01-gallery';

const ID = 'ch07-s11';
type C2 = CanvasRenderingContext2D;
type P = { x: number; y: number };
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: P, b: P, u: number): P => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });

/** action-plane scale k: dolly up to 1.2, the rest on the lens (so the near planes never sweep the frame) */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}

// ---------------------------------------------------------------- geometry (L4 rest px)
/** the drag-knobs panel, hanging on two threads beside the stage (right of its proscenium) */
const PANEL = { cx: 1080, top: 166, w: 206, h: 66 };
const KNOB_R = 13;
const knobX = (i: number) => PANEL.cx + (i - 2) * 38;
/** the strip: 25 drag-frame cards on a rail under the panel */
const N_CARDS = 25;
const N_SOLVED = 16;
const N_FLAT = 6;
const CARD = { x0: 908, pitch: 14, w: 11, h: 26, top: 268 };
const RAIL = { x0: 896, x1: 1262, y: 263 };
const cardX = (i: number) => CARD.x0 + i * CARD.pitch;
/** the label slip under the strip */
const LABEL = { x: 1079, top: 312 };
const LABEL_L1 = 'one step: 63.6% of moving frames solved';
const LABEL_L2 = '24.6% began with every slope 0';
/** tag 10 (canonical slot) and the question tag hung from its lower-right corner */
const T10X = SLOT_X['10'];
const T10_EYE = { x: T10X, y: lineYAt(T10X) + TAG.string };
const Q_SCALE = 1.4;
const Q_W = TAG.w * 0.62 * Q_SCALE;
const Q_THREAD = 18;
const Q_LABEL = ["the README's second use-case", 'not attempted in the repo'];
/** where the red pencil rests beside tag 10 (sets/tagLine drawTags 'beside', as ch07-s05 left it) */
const PENCIL_REST = { x: T10X + TAG.w * 0.62, y: T10_EYE.y + TAG.h - 6 };
const PENCIL_REST_ANG = Math.PI * 0.5 + 0.28;
const HS = 0.6;
const HAND_LEN_S = 118 * HS;

interface Beats {
  D: number;
  scope: number;
  knobs: number;
  five: number;
  strip: number;
  flip: number;
  l21: number;
  qtag: number;
  pencil: number;
  hang: number;
}

/** tag 10's swing (drawTags' default: 0.025 · sin(tq·1.7 + slot·0.013)) plus the kick of the question tag's weight */
function t10Swing(tq: number, b: Beats) {
  const tk = b.qtag - 0.25;
  const kick = tq > tk ? 0.05 * Math.exp(-(tq - tk) * 2.4) * Math.sin((tq - tk) * 6.5) : 0;
  return { amp: 0.025, angle: 0.025 * Math.sin(tq * 1.7 + T10X * 0.013) + kick, kick };
}
/** tag 10's lower-right corner in world (the question thread's pivot), riding tag 10's swing */
function pivotAt(angle: number): P {
  const lx = TAG.w * 0.36, ly = TAG.h - 2;
  return { x: T10_EYE.x + lx * Math.cos(angle) - ly * Math.sin(angle), y: T10_EYE.y + lx * Math.sin(angle) + ly * Math.cos(angle) };
}
/** the question tag's pendulum angle: swings in from the right on 'network', damps; one sway on 'question' */
function qAngle(tq: number, b: Beats) {
  const t0 = b.qtag - 0.3;
  let a = 0;
  if (tq >= t0) {
    const u = tq - t0;
    a = 1.25 * Math.exp(-1.55 * u) * Math.cos(4.3 * u);
  }
  const th = b.hang - 0.05;
  if (tq >= th) {
    const u = tq - th;
    a += 0.16 * Math.exp(-2.6 * u) * Math.sin(4.3 * u);
  }
  // a breath of air on the line once it has settled
  return a + 0.012 * Math.sin(tq * 1.3 + 0.7);
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      scope: T.beat('scope'),
      knobs: T.beat('knobs'),
      five: T.word('L0720a', 'five'),
      strip: T.beat('strip'),
      flip: T.beat('flip'),
      l21: T.line('L0721').start,
      qtag: T.beat('qtag'),
      pencil: T.beat('pencil'),
      hang: T.beat('hang'),
    };
    const keys: { t: number; cam: Camera3 }[] = [
      // the gallery small at frame left, the empty wall beside it where the panel will drop
      { t: 0, cam: camK(850, 332, 1.12) },
      { t: b.knobs - 0.6, cam: camK(918, 316, 1.17) },
      // drift on to the panel as it lands and the strip slides out
      { t: b.strip + 0.5, cam: camK(1048, 292, 1.32) },
      // a gentle push while the cards flip and the label sets
      { t: b.flip + 3.2, cam: camK(1068, 298, 1.42) },
      { t: b.l21 + 0.3, cam: camK(1070, 300, 1.43) },
      // down along tag 10 to where the question tag will hang
      { t: b.qtag - 0.2, cam: camK(1074, 522, 1.56) },
      { t: b.D + 0.4, cam: camK(1076, 530, 1.62) },
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
    const pencilEntry = toLayer(LAYERS.L4, cam, 1180, 900);

    // ---- the tags in continuity; tag 10 rides a small kick when the question tag's weight comes onto it
    const sw = t10Swing(tq, b);
    const lifting = tq >= b.pencil - 1.05 && tq < b.pencil + 1.45;
    const tags: TagState[] = tagsAt(ID, 'start').map((st) => (st.id === '10' ? { ...st, phase: 0, swing: 0.025, pencilRest: !lifting } : st));
    // tag 10's swing in drawTag is st.swing · sin(tq·1.7 + phase): fold the kick in by matching the phase
    const t10 = tags.find((s) => s.id === '10');
    if (t10) {
      // phase so that sin(tq·1.7 + phase) = 1: the swing amplitude IS the angle (base swing + kick, exactly)
      t10.swing = sw.angle;
      t10.phase = Math.PI / 2 - tq * 1.7;
    }
    const t10Angle = sw.angle;

    // ---- the gallery's backdrop comes up a little on 'fair' (shown plain, no card)
    const lamp = 0.5 + 0.38 * win(t, b.scope - 0.2, b.scope + 1.2) - 0.12 * win(t, b.knobs, b.knobs + 2);
    galleryBack(f, { key: ID, lamp });

    // ---- panel, knobs, strip, label
    const dropU = (tq - (b.knobs - 0.15)) / 0.6;
    const landed = tq - (b.knobs + 0.45);
    const panelDy = dropU <= 0 ? -420 : dropU < 1 ? -420 * (1 - sm(dropU)) * (1 - sm(dropU)) : 0;
    const bounce = landed > 0 ? 7 * Math.exp(-landed * 4.5) * Math.sin(landed * 13) : 0;
    const stepJolt = tq > b.flip - 0.04 ? 2.2 * Math.exp(-(tq - b.flip + 0.04) * 10) * Math.sin((tq - b.flip + 0.04) * 30) : 0;
    const pDy = panelDy - bounce + stepJolt;
    const panelOn = dropU > 0;
    const knobAng = (i: number) => {
      const ti = b.five - 0.1 + i * 0.24;
      const once = 1.15 * sm((tq - ti) / 0.42);
      const notch = 0.42 * sm((tq - (b.flip - 0.1)) / 0.14);
      return -0.6 + once + notch;
    };
    const ringOn = (i: number) => win(tq, b.five - 0.1 + i * 0.24 + 0.2, b.five - 0.1 + i * 0.24 + 0.55);
    const stripU = clamp01((tq - (b.strip - 0.08)) / 1.05);
    const flipStart = (i: number) => b.flip + 0.12 + i / 12;
    // the label slip: line one sets on the flip, line two as the flat gauges show
    const ink1At = b.flip + 0.3;
    const ink2At = flipStart(N_SOLVED) + 0.15;
    const labelFade = 1 - win(t, b.l21 + 1.3, b.l21 + 2.6);
    // once the question is the subject the panel and strip step back in the haze
    const stepBack = 1 - 0.45 * win(t, b.l21 + 1.0, b.l21 + 3.0);

    // ---- the question tag
    const qOn = tq >= b.qtag - 0.3;
    const qA = qAngle(tq, b);
    const piv = pivotAt(t10Angle);
    const qEye: P = { x: piv.x + Q_THREAD * Math.sin(qA), y: piv.y + Q_THREAD * Math.cos(qA) };
    const qAlpha = win(tq, b.qtag - 0.3, b.qtag - 0.05);
    const qLabelInk = b.qtag + 0.55;
    const qLabelRest: P = { x: T10_EYE.x + TAG.w * 0.36 + Q_W * 0.5 + 12, y: pivotAt(0).y + Q_THREAD + 4 };

    // ---- the red pencil: lifted from beside tag 10, hovers over the question tag, laid back down
    const restLift: P = { x: PENCIL_REST.x, y: PENCIL_REST.y - HAND_LEN_S * 0.08 };
    const hoverTip: P = { x: pivotAt(0).x + 16, y: pivotAt(0).y + Q_THREAD + Q_W * 0.34 };
    const P0 = b.pencil - 1.05, P1 = b.pencil - 0.4, P2 = b.pencil - 0.25, P3 = b.pencil + 0.12, P4 = b.pencil + 0.92, P5 = b.pencil + 1.3, P6 = b.pencil + 1.42, P7 = b.pencil + 2.1;
    let pencilPose: HandsPose | null = null;
    let pencilLaid = true;
    const pe = { scale: HS, entry: pencilEntry };
    const hoverAt = (tip: P, extra = 0) => hands.pencil('hover', 0.5 + extra, { x: tip.x - HAND_LEN_S * 0.12, y: tip.y + HAND_LEN_S * 0.04 }, pe);
    if (tq >= P0 && tq < P7) {
      if (tq < P1) pencilPose = hands.pencil('rest', lerp(1, 0.5, sm((tq - P0) / (P1 - P0))), PENCIL_REST, pe);
      else if (tq < P2) {
        pencilPose = hands.pencil('rest', lerp(0.5, 0.4, (tq - P1) / (P2 - P1)), PENCIL_REST, pe);
        pencilLaid = false;
      } else if (tq < P3) {
        pencilPose = hoverAt(lerpP(restLift, hoverTip, sm((tq - P2) / (P3 - P2))));
        pencilLaid = false;
      } else if (tq < P4) {
        // the held breath: still, a hair of tremor, no stroke
        pencilPose = hoverAt({ x: hoverTip.x, y: hoverTip.y - 1.2 * Math.sin((tq - P3) * 3) });
        pencilLaid = false;
      } else if (tq < P5) {
        pencilPose = hoverAt(lerpP(hoverTip, restLift, sm((tq - P4) / (P5 - P4))));
        pencilLaid = false;
      } else if (tq < P6) {
        pencilPose = hands.pencil('rest', lerp(0.4, 0.5, (tq - P5) / (P6 - P5)), PENCIL_REST, pe);
        pencilLaid = false;
      } else pencilPose = hands.pencil('rest', lerp(0.5, 1, sm((tq - P6) / (P7 - P6))), PENCIL_REST, pe);
    }

    tagLineScene(f, {
      variant: 'none',
      key: ID,
      tags,
      rule: { alpha: 0.9 },
      line: { glow: 0.5 },
      pencilOnPost: false,
      l4: (c, env) => {
        if (panelOn) {
          c.save();
          c.globalAlpha = stepBack;
          panelThreads(c, env, pDy);
          drawPanel(c, env, pDy, knobAng, ringOn);
          if (stripU > 0) drawStrip(c, env, stripU, tq, flipStart);
          c.restore();
        }
        if (labelFade > 0.003 && t > ink1At - 0.4) drawLabel(c, env, t, ink1At, ink2At, labelFade);
        if (qOn) drawQuestion(c, env, piv, qEye, qA, qAlpha, t, qLabelInk, qLabelRest);
        // the pencil: laid beside tag 10 while the hand fetches it / after it lets go (drawTags draws it otherwise)
        if (lifting && pencilLaid) drawPencil(c, PENCIL_REST, PENCIL_REST_ANG, 62, env);
        if (pencilPose) hands.draw(c, pencilPose, env);
      },
      l5: (c, env) => nearPlane(f, c, env),
    });
    f.layer({ id: `${ID}-dust`, z: 900, haze: 0, blur: 0.6 }, (c, env) => {
      dustMotes(c, { area: { x: 640, y: 120, w: 820, h: 560 }, count: 26, size: 1.5, brightness: 0.22, drift: { x: 2.6, y: -1.2 }, salt: 711 }, env);
    });
  },
});

// ---------------------------------------------------------------- the drag-knobs panel
const brass = (env: PaintEnv, lift = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.3), env.mood.core, lift);
const threadCol = (env: PaintEnv, a = 0.85) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), a);

function panelThreads(c: C2, env: PaintEnv, dy: number) {
  c.strokeStyle = threadCol(env, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  for (const dx of [-PANEL.w * 0.4, PANEL.w * 0.4]) {
    c.moveTo(PANEL.cx + dx, -260);
    c.lineTo(PANEL.cx + dx, PANEL.top + dy + 4);
  }
  c.stroke();
}

function drawPanel(c: C2, env: PaintEnv, dy: number, ang: (i: number) => number, ring: (i: number) => number) {
  const x0 = PANEL.cx - PANEL.w / 2, y0 = PANEL.top + dy;
  // the black card backing, a hair larger, then the brass face
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x0 + 3, y0 + 4, PANEL.w, PANEL.h);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x0 - 3, y0 - 3, PANEL.w + 6, PANEL.h + 6);
  const g = c.createLinearGradient(0, y0, 0, y0 + PANEL.h);
  g.addColorStop(0, brass(env, 0.12));
  g.addColorStop(1, mixLab(brass(env, 0), env.mood.set, 0.45));
  c.fillStyle = g;
  c.fillRect(x0, y0, PANEL.w, PANEL.h);
  // the backlight's rim on its top edge, and four screws
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x0 - 3, y0 - 3);
  c.lineTo(x0 + PANEL.w + 3, y0 - 3);
  c.stroke();
  c.fillStyle = mixLab(brass(env, 0), PUPPET_NEAR_BLACK, 0.55);
  for (const [sx, sy] of [[x0 + 7, y0 + 7], [x0 + PANEL.w - 7, y0 + 7], [x0 + 7, y0 + PANEL.h - 7], [x0 + PANEL.w - 7, y0 + PANEL.h - 7]]) {
    c.beginPath();
    c.arc(sx, sy, 2.2, 0, Math.PI * 2);
    c.fill();
  }
  const ky = y0 + PANEL.h * 0.52;
  for (let i = 0; i < 5; i++) {
    const kx = knobX(i);
    // the engraved dial ring: eight ticks
    c.strokeStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.3), 0.7);
    c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI * 0.5 + (k / 8) * Math.PI * 2;
      c.moveTo(kx + Math.cos(a) * (KNOB_R + 3), ky + Math.sin(a) * (KNOB_R + 3));
      c.lineTo(kx + Math.cos(a) * (KNOB_R + 6), ky + Math.sin(a) * (KNOB_R + 6));
    }
    c.stroke();
    // the copper cell-ring: closes round the knob once it has been lifted into a cell (turned once)
    const r = ring(i);
    if (r > 0) {
      c.strokeStyle = withAlpha(copperOf(env, 0.35), 0.9 * r);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(kx, ky, KNOB_R + 1.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * r);
      c.stroke();
    }
    // the knob: a black body with a knurled edge and a pale pointer
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.arc(kx, ky, KNOB_R, 0, Math.PI * 2);
    c.fill();
    const a = ang(i);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.35);
    c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k < 12; k++) {
      const aa = a + (k / 12) * Math.PI * 2;
      c.moveTo(kx + Math.cos(aa) * (KNOB_R - 2.5), ky + Math.sin(aa) * (KNOB_R - 2.5));
      c.lineTo(kx + Math.cos(aa) * KNOB_R, ky + Math.sin(aa) * KNOB_R);
    }
    c.stroke();
    c.strokeStyle = mixLab('#efe2c2', env.mood.halo, 0.25);
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(kx + Math.cos(a - Math.PI / 2) * 2, ky + Math.sin(a - Math.PI / 2) * 2);
    c.lineTo(kx + Math.cos(a - Math.PI / 2) * (KNOB_R - 3), ky + Math.sin(a - Math.PI / 2) * (KNOB_R - 3));
    c.stroke();
    c.lineCap = 'butt';
  }
  // the rail the strip runs on, hung from the panel on two short rods
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(PANEL.cx - PANEL.w * 0.42 - 1, y0 + PANEL.h + 3, 2.5, RAIL.y - (y0 + PANEL.h + 3));
  c.fillRect(PANEL.cx + PANEL.w * 0.42 - 1, y0 + PANEL.h + 3, 2.5, RAIL.y - (y0 + PANEL.h + 3));
}

/** one drag-frame card's glyph: a tiny app-shell frame (title strip, two panes) in faint ink */
function frameGlyph(c: C2, x: number, y: number, w: number, h: number, ink: string) {
  c.strokeStyle = ink;
  c.lineWidth = 0.8;
  c.strokeRect(x + w * 0.16, y + h * 0.18, w * 0.68, h * 0.42);
  c.beginPath();
  c.moveTo(x + w * 0.16, y + h * 0.27);
  c.lineTo(x + w * 0.84, y + h * 0.27);
  c.moveTo(x + w * 0.5, y + h * 0.27);
  c.lineTo(x + w * 0.5, y + h * 0.6);
  c.stroke();
}

/** the tiny brass slope gauge on a flat card: a half-dial whose needle lies flat at 0 */
function flatGauge(c: C2, env: PaintEnv, cx: number, cy: number, r: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(cx, cy, r + 1.2, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  c.fillStyle = brass(env, 0.15);
  c.beginPath();
  c.arc(cx, cy, r, Math.PI, Math.PI * 2);
  c.closePath();
  c.fill();
  // the needle along the flat (0)
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(cx - 0.8, cy - 0.6);
  c.lineTo(cx + r - 0.6, cy - 0.6);
  c.stroke();
  c.restore();
}

function drawStrip(c: C2, env: PaintEnv, u: number, tq: number, flipStart: (i: number) => number) {
  // the rail extends to the right as the paper band slides out of the spool at its left end
  const railEnd = lerp(RAIL.x0 + 10, RAIL.x1, sm(u));
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(RAIL.x0, RAIL.y - 1.5, railEnd - RAIL.x0, 3);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(RAIL.x0, RAIL.y - 1.5);
  c.lineTo(railEnd, RAIL.y - 1.5);
  c.stroke();
  // the spool
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(RAIL.x0, RAIL.y + 8, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = brass(env, 0.1);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(RAIL.x0, RAIL.y + 8, 3.5, tq * 6, tq * 6 + Math.PI * 1.4);
  c.stroke();
  const grey = mixLab(mixLab('#a19a8e', env.mood.halo, 0.18), env.mood.set, 0.22);
  const greyInk = withAlpha(mixLab('#2a2420', env.mood.ink, 0.3), 0.45);
  const copperFace = mixLab(copperOf(env, 0.45), '#d08a52', 0.25);
  const copperInk = withAlpha(mixLab('#3a1c0c', env.mood.ink, 0.2), 0.6);
  // a faint warm wash behind the solved run once it has turned (lit copper catching the stage's backdrop)
  const solvedLit = clamp01((tq - flipStart(N_SOLVED - 1) - 0.2) / 0.5);
  if (solvedLit > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const xa = cardX(0) - 6, xb = cardX(N_SOLVED - 1) + CARD.w + 6;
    const gg = c.createLinearGradient(0, CARD.top - 10, 0, CARD.top + CARD.h + 12);
    gg.addColorStop(0, withAlpha(env.mood.halo, 0));
    gg.addColorStop(0.5, withAlpha(mixLab(env.mood.core, '#e09a5a', 0.4), 0.1 * solvedLit));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(xa, CARD.top - 10, xb - xa, CARD.h + 22);
    c.restore();
  }
  for (let i = 0; i < N_CARDS; i++) {
    const x = cardX(i);
    if (x + CARD.w > railEnd) break;
    // a clip on the rail, the card hanging under it
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(x + CARD.w / 2 - 1.5, RAIL.y, 3, CARD.top - RAIL.y + 2);
    let face = 0; // 0 grey, 1 copper
    let sx = 1;
    let lift = 0;
    if (i < N_SOLVED) {
      const fu = clamp01((tq - flipStart(i)) / 0.25);
      sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * fu)));
      face = fu >= 0.5 ? 1 : 0;
      lift = Math.sin(Math.PI * fu) * 3;
    }
    const cx = x + CARD.w / 2;
    c.save();
    c.translate(cx, CARD.top - lift);
    c.scale(sx, 1);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
    c.fillRect(-CARD.w / 2 + 1, 1.5, CARD.w, CARD.h);
    c.fillStyle = face ? copperFace : grey;
    c.fillRect(-CARD.w / 2, 0, CARD.w, CARD.h);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), face ? 0.7 : 0.4);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-CARD.w / 2, 0.5);
    c.lineTo(CARD.w / 2, 0.5);
    c.stroke();
    frameGlyph(c, -CARD.w / 2, 0, CARD.w, CARD.h, face ? copperInk : greyInk);
    c.restore();
    if (i >= N_SOLVED && i < N_SOLVED + N_FLAT) {
      const ga = clamp01((tq - flipStart(i)) / 0.17);
      if (ga > 0) flatGauge(c, env, cx, CARD.top + CARD.h * 0.86, 4.4, ga);
    }
  }
}

function drawLabel(c: C2, env: PaintEnv, t: number, ink1At: number, ink2At: number, fade: number) {
  const paper = cardPaperAlpha(t, ink1At) * fade;
  if (paper <= 0.003) return;
  const i1 = cardInkAlpha(t, ink1At) * fade;
  const i2 = cardInkAlpha(t, ink2At, 0.3) * fade;
  textRole(c, 'subject', () => {
    const fs = legibleSize(c, `16px ${FONT.text}`, 16, LABEL_L1);
    c.font = `${fs}px ${FONT.text}`;
    const w1 = c.measureText(LABEL_L1).width, w2 = c.measureText(LABEL_L2).width;
    const glyph = fs * 0.95;
    const tw = Math.max(w1, w2) + glyph;
    const pw = tw + fs * 1.3, ph = fs * 2.75;
    const x0 = LABEL.x - pw / 2, y0 = LABEL.top;
    c.save();
    c.globalAlpha = paper;
    // two threads from the rail
    c.strokeStyle = threadCol(env, 0.7);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x0 + pw * 0.2, RAIL.y + 2);
    c.lineTo(x0 + pw * 0.2, y0);
    c.moveTo(x0 + pw * 0.8, RAIL.y + 2);
    c.lineTo(x0 + pw * 0.8, y0);
    c.stroke();
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
    c.fillRect(x0 + 2, y0 + 3, pw, ph);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.22), env.mood.core, 0.06);
    c.fillRect(x0, y0, pw, ph);
    c.restore();
    cardProbe(c, `${ID}-label`, x0, y0, pw, ph, paper, i1);
    const ink = mixLab('#24180f', env.mood.ink, 0.2);
    const lx = x0 + (pw - tw) / 2 + glyph;
    const y1 = y0 + fs * 1.12, y2 = y0 + fs * 2.32;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.font = `${fs}px ${FONT.text}`;
    if (i1 > 0) {
      c.save();
      c.globalAlpha = i1;
      // the key: a copper card
      c.fillStyle = mixLab(copperOf(env, 0.45), '#d08a52', 0.25);
      c.fillRect(lx - glyph + 1, y1 - fs * 0.72, glyph * 0.48, fs * 0.78);
      c.fillStyle = ink;
      c.fillText(LABEL_L1, lx, y1);
      c.restore();
      textProbe(c, `${ID}-l1`, lx, y1 - fs * 0.8, w1, fs, i1);
    }
    if (i2 > 0) {
      c.save();
      c.globalAlpha = i2;
      // the key: a grey card with its flat gauge
      c.fillStyle = mixLab(mixLab('#a19a8e', env.mood.halo, 0.18), env.mood.set, 0.22);
      c.fillRect(lx - glyph + 1, y2 - fs * 0.72, glyph * 0.48, fs * 0.78);
      flatGauge(c, env, lx - glyph + 1 + glyph * 0.24, y2 - fs * 0.12, glyph * 0.2, 1);
      c.fillStyle = ink;
      c.fillText(LABEL_L2, lx, y2);
      c.restore();
      textProbe(c, `${ID}-l2`, lx, y2 - fs * 0.8, w2, fs, i2);
    }
  });
}

// ---------------------------------------------------------------- the question tag on its slack thread
function drawQuestion(c: C2, env: PaintEnv, piv: P, eye: P, ang: number, alpha: number, t: number, labelInk: number, labelAt: P) {
  if (alpha <= 0.003) return;
  const w = Q_W, h = Q_W;
  c.save();
  c.globalAlpha = alpha;
  // the slack thread: a little longer than the gap, so it bellies
  c.strokeStyle = threadCol(env, 0.9);
  c.lineWidth = 1.1;
  const mx = (piv.x + eye.x) / 2 + 4 * Math.cos(ang), my = (piv.y + eye.y) / 2 + 2;
  c.beginPath();
  c.moveTo(piv.x, piv.y);
  c.quadraticCurveTo(mx, my, eye.x, eye.y);
  c.stroke();
  c.translate(eye.x, eye.y);
  c.rotate(-ang * 0.85);
  // the tag: a small manila question card with clipped top corners and a reinforced eyelet
  const body = new Path2D();
  const k = w * 0.22;
  body.moveTo(-w / 2 + k, 0);
  body.lineTo(w / 2 - k, 0);
  body.lineTo(w / 2, k);
  body.lineTo(w / 2, h);
  body.lineTo(-w / 2, h);
  body.lineTo(-w / 2, k);
  body.closePath();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.save();
  c.translate(2, 3);
  c.fill(body);
  c.restore();
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mixLab(mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.core, 0.12), env.mood.haze, 0.02));
  g.addColorStop(1, mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.set, 0.2));
  c.fillStyle = g;
  c.fill(body);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.7);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-w / 2 + k, 0);
  c.lineTo(w / 2 - k, 0);
  c.stroke();
  c.fillStyle = mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.set, 0.35);
  c.beginPath();
  c.arc(0, 6, 4.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
  c.beginPath();
  c.arc(0, 6, 2, 0, Math.PI * 2);
  c.fill();
  // the question mark, cut large
  textRole(c, 'subject', () => {
    const fs = 34;
    c.font = `${fs}px ${FONT.fell}`;
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('?', 0, h * 0.86);
  });
  c.restore();

  // the plain label threaded on its eyelet (fixed, so it reads while the tag swings)
  const paper = cardPaperAlpha(t, labelInk) * alpha;
  if (paper <= 0.003) return;
  const ink = cardInkAlpha(t, labelInk);
  const ink2 = cardInkAlpha(t, labelInk + 0.35, 0.3);
  textRole(c, 'subject', () => {
    const fs = legibleSize(c, `15px ${FONT.text}`, 15, Q_LABEL[0]);
    c.font = `${fs}px ${FONT.text}`;
    const tw = Math.max(...Q_LABEL.map((l) => c.measureText(l).width));
    const cw = tw + fs * 1.0, ch = fs * 2.6;
    const x0 = labelAt.x, y0 = labelAt.y;
    c.save();
    c.globalAlpha = paper;
    c.strokeStyle = threadCol(env, 0.85);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(eye.x + 2, eye.y + 5);
    c.quadraticCurveTo((eye.x + x0) / 2, Math.max(eye.y, y0) + 8, x0, y0 + ch * 0.35);
    c.stroke();
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
    c.fillRect(x0 + 2, y0 + 3, cw, ch);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.22), env.mood.core, 0.06);
    c.fillRect(x0, y0, cw, ch);
    // the eyelet hole the thread passes through
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
    c.beginPath();
    c.arc(x0 + fs * 0.32, y0 + ch * 0.35, 1.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    cardProbe(c, `${ID}-qlabel`, x0, y0, cw, ch, paper, ink);
    c.fillStyle = mixLab('#24180f', env.mood.ink, 0.2);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const lx = x0 + fs * 0.62;
    const ys = [y0 + fs * 1.08, y0 + fs * 2.2];
    [ink, ink2].forEach((a, i) => {
      if (a <= 0) return;
      c.save();
      c.globalAlpha = a * Math.min(1, alpha * 1.2);
      c.fillText(Q_LABEL[i], lx, ys[i]);
      c.restore();
      textProbe(c, `${ID}-q${i}`, lx, ys[i] - fs * 0.8, c.measureText(Q_LABEL[i]).width, fs, a);
    });
  });
}

// ---------------------------------------------------------------- the near plane (L5)
/**
 * Two soft near shapes that slide against the line as the camera drifts: a workshop lamp shade hanging at the upper
 * left (it slides out of frame as the camera moves on to the knobs) and the bench's near edge, which rises into the
 * bottom of frame as the camera comes down to the question tag. Both baked once, blurred.
 */
function nearPlane(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/shade/${env.mood.id}`, 260, 330, (cc) => {
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(128, 0, 4, 190);
    cc.beginPath();
    cc.moveTo(112, 186);
    cc.lineTo(148, 186);
    cc.lineTo(156, 204);
    cc.lineTo(238, 296);
    cc.quadraticCurveTo(130, 316, 22, 296);
    cc.lineTo(104, 204);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
    cc.lineWidth = 2.5;
    cc.beginPath();
    cc.moveTo(156, 204);
    cc.lineTo(238, 296);
    cc.stroke();
  }, { blur: 6 })(c, 380, -250);
  f.cached(`${ID}/bench/${env.mood.id}`, 1300, 300, (cc) => {
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.beginPath();
    cc.moveTo(0, 40);
    cc.lineTo(1300, 22);
    cc.lineTo(1300, 300);
    cc.lineTo(0, 300);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.42);
    cc.lineWidth = 2.5;
    cc.beginPath();
    cc.moveTo(0, 40);
    cc.lineTo(1300, 22);
    cc.stroke();
  }, { blur: 8 })(c, 640, 770);
}
