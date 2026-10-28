/**
 * ch08-s02 — TAG 8 IS TIED ON (scene, winterBlue night; crossfade in from the dark August column; 14.54 s). Device 1.
 *   L0803 "July's lab briefs listed established conclusions, to take as given. One: compiling ordinary code was a
 *          dead end."
 *   L0804 "Who tied it on? A conversation whose people go unnamed."
 *
 * THE COLD WINDOW (sets/ch08-s02-cold): the workshop in winterBlue, the window wall frosted, the Window Calendar's dark
 * August column far off through the glass, the copper line at the chapter's 52 %, frost on the posts. In the desk bay
 * under the windows, soft and small, a lamp, a logo-less laptop and two pairs of paper hands typing (author-hands and the
 * paler agent-hand): no faces.
 *
 * TEACHES, word by word:
 *   pane (0.40)        out of one of July's six lit panes: the facade's black card with its single lit hole flies past
 *                      the lens (a push through the glass) into the cold room; the date stamp types on
 *   conclusions (3.11) the narrator's hand (lower left) ties tag 8 onto the line (the detent 'tie'); its front inks with
 *                      the label in the film's own words as the voice reads it: Established conclusions: take these as given
 *   dead end           the camera settles in toward the tag; the thread hangs down toward the rule (its start, 8 July)
 *   Who (8.47)         a small typeset card threads itself down onto the tag's knot: tied on by: unnamed participants,
 *                      with the smaller caption not attributable to Cheng (the record names no participants)
 *   end                a mid-shot on the tag and its knot card; the laptop glows soft at left.
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { FONT, LAYERS, cardPaperAlpha, defineShot, drawTracked, legibleSize, mixLab, placeStamp, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { type HandsPose } from '../sets/narratorHands';
import { drawLine, drawRule, drawTag, drawTags, tagAnchors, tagsAt, type TagState } from '../sets/tagLine';
import { COLD_DY, KNOT_K_REF, coldNear, coldRoom, frostPosts, knotCard, lowerKnotCard, tag8Foot, tag8Touch } from '../sets/ch08-s02-cold';

const ID = 'ch08-s02';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- tag 8 (canonical slot; L4 is drawn translated by COLD_DY)
const T8: TagState = { id: '8' };
const AN = tagAnchors(T8);
/** the tying hand: smaller than the flip/pencil hands, and it comes up from just below the eyelet */
const HS = 0.45;
const TIE_D = 2.2;
/** the tie lands a breath after 'conclusions' starts: the loop forms on the word and pulls tight with the click */
const TIE_LAG = 0.2;

// ---------------------------------------------------------------- camera: through the pane, then in to the tag
/** the mid-shot on the tag and its knot card, held through the knot card's line */
const S02_MID: Camera3 = { x: 796, y: 404, z: 165, lens: 2.5 };
/** the end: after the line, a tilt down (and a breath wider) so the Lifespan Rule and the thread's foot come into the
 *  bottom of frame, the knot card still whole at the top (= ch08-s03's opening framing) */
export const S02_END: Camera3 = { x: 796, y: 452, z: 165, lens: 2.09 };
type Key = [number, number, number];
/** cubic Hermite through (t, value, slope) keys: one continuous move, no stop between segments */
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
function camAt(t: number, D: number): Camera3 {
  // the push through the pane (z), then the lens takes over toward the tag: ~k 2 by the tie, ~k 2.9 at the end
  const z = hk([[0, -300, 0], [1.9, 20, 230], [3.1, 120, 45], [D, S02_END.z, 0]], t);
  const lens = hk([[1.2, 1, 0], [3.1, 1.72, 0.24], [9.5, S02_MID.lens - 0.05, 0.02], [10.6, S02_MID.lens, 0], [12.6, S02_END.lens, 0], [D, S02_END.lens, 0]], t);
  const x = hk([[0.6, 700, 0], [3.1, 785, 18], [9.5, S02_MID.x, 0], [12.6, S02_END.x, 0], [D, S02_END.x, 0]], t);
  const y = hk([[0.6, 420, 0], [3.1, 408, -3], [9.5, S02_MID.y, 0], [10.6, S02_MID.y, 0], [12.6, S02_END.y, 0], [D, S02_END.y, 0]], t);
  return { x, y, z, lens };
}

/** the facade of the Window Calendar right in front of the lens: one lit July pane (a hole) in the black card */
const PANE: LayerSpec = { id: 'pane', z: 150, haze: 0, blur: 1.2 };
/** the lit pane sits dead centre of the opening frame, ~300 px across */
const CAM0: Camera3 = { x: 700, y: 420, z: -300, lens: 1 };
const PANE_C = toLayer(PANE, CAM0, 640, 360);
const PANE_W = 300 / toScreen(PANE, CAM0, 0, 0).k;

interface Beats {
  D: number;
  pane: number;
  tie: number;
  given: number;
  knot: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      pane: T.beat('pane'),
      tie: T.beat('tie'),
      given: T.wordEnd('L0803', 'given'),
      knot: T.beat('knot'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);
    const cam = camAt(t, b.D);
    f.camera(cam);
    const k4 = toScreen(LAYERS.L4, cam, 0, 0).k;

    coldRoom(f, { key: ID, dawn: 0, lamp: 0.85, desk: { tq, hands: true, screen: 0.55 } });

    // ---- tag 8's life on this line, on twos
    const tieU = clamp01((tq - (b.tie + TIE_LAG - 0.55 * TIE_D)) / TIE_D);
    const tied = tieU >= 0.55;
    const ink = win(t, b.tie + TIE_LAG + 0.05, b.given + 0.1);
    const kick = (t0: number) => (t > t0 ? 0.08 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.02 + kick(b.tie + TIE_LAG) + 0.5 * kick(b.knot + 0.45);
    const knotIn = win(t, b.knot - 0.05, b.knot + 0.55);
    const legible = k4 >= KNOT_K_REF * 0.98;

    // tag 7's long knot card hangs one row lower (it covered tag 6's 'the README' card); drawn after the tags
    const tags = tagsAt(ID, 'start').map((st) => (st.id === '7' ? { ...st, knot: [] } : st));
    const t7 = tagsAt(ID, 'start').find((st) => st.id === '7');
    // the thread hangs straight down to the rule: its foot, its start (8 July), at the rule
    const hang = tag8Touch([...tags, { id: '8', drop: 0 } as TagState].sort((p, q) => order(p.id) - order(q.id))) * win(t, b.tie + TIE_LAG + 0.3, b.tie + TIE_LAG + 2.4);
    const t8: TagState = { id: '8', ink, knot: [], knotIn: 0, flip: 0, back: [], swing, phase: 0, drop: hang, subject: legible, glow: 0.12 * win(t, b.tie, b.tie + 0.6) };
    if (tied) tags.push(t8);
    tags.sort((p, q) => order(p.id) - order(q.id));
    // the tying arm comes up from just under the eyelet (off the bottom edge), short and steep: a tie, not a reach
    const ks = toScreen(LAYERS.L4, cam, AN.knot.x, AN.knot.y + COLD_DY);
    const E = { R: lift(toLayer(LAYERS.L4, cam, ks.x - 150, 790)) };

    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, COLD_DY);
      drawLine(c, env, { glow: 0.32 });
      frostPosts(c, env);
      // the rule (its tick labels stay off: they would sit in the bottom 12 % once the camera tilts down)
      drawRule(c, env, { alpha: 0.85, labels: 0 });
      drawTags(c, env, tags, { tq });
      if (t7) lowerKnotCard(c, env, t7);
      // the lark's-head loop forming over the wire as the hand circles, pulled tight with the detent click
      tieLoop(c, env, tieU);
      // the thread's start: 8 July, inked beside its foot as the tilt brings the rule in
      footDate(c, env, win(t, 11.2, 11.8));
      // the knot card, threaded down onto tag 8's knot
      if (tied && knotIn > 0.003) {
        // the paper inks with its first line (never a blank card)
        const inkAt = b.knot + 0.1;
        knotCard(c, env, {
          knot: AN.knot, a: knotIn, paper: cardPaperAlpha(t, inkAt, 0.3) * knotIn, ink1: clamp01((t - inkAt) / 0.12) * knotIn,
          ink2: win(t, inkAt + 0.35, inkAt + 0.8) * knotIn, sway: 10 * swing * Math.sin(tq * 1.7), legible, id: `${ID}-knot`, k: k4,
        });
      }
      // the narrator's hand ties the tag on (carrying it in)
      if (tieU > 0 && tieU < 1) {
        const pose: HandsPose = hands.act('tie', tieU, AN.knot, { held: 'tag', scale: HS, entry: { R: E.R } });
        hands.draw(c, pose, env, {
          heldDraw: (cc, at, held, e) => {
            if (held !== 'tag') return;
            drawTag(cc, e, { id: '8', ink: 0, knot: [], swing: 0.05 * Math.sin(tq * 3.1), phase: 0 }, { at: { x: at.x, y: at.y - 6 }, knotAt: { x: at.x, y: at.y - 6 } });
          },
        });
      }
      c.restore();
    });
    f.rim({ x: 0, y: -1 });
    coldNear(f, ID);

    // ---- the facade: the Window Calendar's face with one lit July pane (a hole), flying past the lens on the push.
    // No fade: it is drawn until its hole covers the whole frame (then nothing of it is in view), so there is no pop.
    if (cam.z < PANE.z - 20) {
      const a0 = toScreen(PANE, cam, PANE_C.x - PANE_W / 2, PANE_C.y - PANE_W / 2);
      const a1 = toScreen(PANE, cam, PANE_C.x + PANE_W / 2, PANE_C.y + PANE_W / 2);
      const covers = a0.x <= -4 && a0.y <= -4 && a1.x >= 1284 && a1.y >= 724;
      if (!covers) f.layer(PANE, (c, env) => facade(c, env, t));
    }

    // ---- type: the date stamp
    placeStamp(f.c, { place: '8 July 2026', date: 'lab round one · 4 experiments', style: 'mono', x: 52, y: 70, at: b.pane, dur: b.tie + 2.2 - b.pane, fade: 0.5 }, { t, mood: f.mood, seed: 802 });
  },
});

const ORDER = ['1', 'qK', '2', 'lineage', '3', '4', '5', '6', '7', '8', '9', '10', 'nano', '11', 'why'];
const order = (id: string) => ORDER.indexOf(id);
/** a point in the L4 world → the same point in the translated (COLD_DY) drawing space */
const lift = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - COLD_DY });

/**
 * The Window Calendar's face at the lens (canonical grid: square panes, a mullion between panes, a pier between month
 * columns): July's bottom storey of six lit panes with ONE of them a hole we push through, the unlit black glass of the
 * storeys above, a pier and August's dark column to the right, the base course under the row. The lit neighbours sit
 * at under half value with a soft glow; the hole shows the cold room (no warm grade on it).
 */
function facade(c: C2, env: PaintEnv, t: number) {
  c.save();
  const W = PANE_W, h = W / 2;
  const pitch = W * (CAL_PITCH / CAL_PANE);
  const pier = W * (CAL_PIER / CAL_PANE);
  const ink = PUPPET_NEAR_BLACK;
  const cx = PANE_C.x, cy = PANE_C.y;
  // pane i of July's row (hole = i 0): x of its left edge; August's column starts after July's sixth pane + a pier
  const px = (i: number) => (i <= 2 ? cx - h + i * pitch : cx - h + 2 * pitch + W + pier + (i - 3) * pitch);
  const glass = mixLab(ink, env.mood.set, 0.3);
  // the card, with the hole cut (evenodd)
  c.fillStyle = ink;
  c.beginPath();
  c.rect(cx - W * 8, cy - W * 6, W * 16, W * 12);
  c.rect(cx - h, cy - h, W, W);
  c.fill('evenodd');
  // black glass: July's upper storeys and August's column (with a faint cold sheen of the moon on it)
  for (let j = -4; j <= 0; j++) {
    for (let i = -6; i <= 6; i++) {
      if (j === 0 && i <= 2) continue;
      const x = px(i), y = cy - h + j * pitch;
      c.fillStyle = glass;
      c.fillRect(x, y, W, W);
      const g = c.createLinearGradient(x, y, x + W, y + W);
      g.addColorStop(0, withAlpha(env.mood.rim, 0));
      g.addColorStop(0.5, withAlpha(env.mood.rim, 0.07));
      g.addColorStop(1, withAlpha(env.mood.rim, 0));
      c.fillStyle = g;
      c.fillRect(x, y, W, W);
    }
  }
  // July's other five lit panes: lamplight at under half value, a soft glow round each (not flat cards)
  const lamp = mixLab(mixLab(env.mood.rim, '#f2c27a', 0.7), env.mood.core, 0.3);
  for (let i = -3; i <= 2; i++) {
    if (i === 0) continue;
    const x = px(i), y = cy - h;
    const g = c.createRadialGradient(x + h, y + h * 1.1, W * 0.05, x + h, y + h, W * 0.72);
    g.addColorStop(0, mixLab(lamp, ink, 0.42));
    g.addColorStop(1, mixLab(lamp, ink, 0.68));
    c.fillStyle = g;
    c.fillRect(x, y, W, W);
  }
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = -3; i <= 2; i++) {
    if (i === 0) continue;
    const x = px(i) + h, y = cy;
    const g = c.createRadialGradient(x, y, h * 0.6, x, y, h * 1.25);
    g.addColorStop(0, withAlpha(mixLab(lamp, env.mood.halo, 0.3), 0.12));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - h * 1.3, y - h * 1.3, h * 2.6, h * 2.6);
  }
  c.restore();
  // the moon rim down each mullion's left edge, and the sill ledges under every storey (rim on their tops)
  const rim = mixLab(env.mood.rim, env.mood.core, 0.4);
  c.fillStyle = withAlpha(rim, 0.32);
  for (let i = -6; i <= 6; i++) c.fillRect(px(i) + W, cy - h - 4 * pitch, W * 0.012, 5 * pitch);
  for (let j = -4; j <= 0; j++) {
    const y = cy + h + j * pitch;
    c.fillStyle = ink;
    c.fillRect(cx - W * 8, y + W * 0.005, W * 16, W * 0.05);
    c.fillStyle = withAlpha(rim, 0.38);
    c.fillRect(cx - W * 8, y + W * 0.005, W * 16, W * 0.008);
  }
  // the base course under July's row: a string course and the plinth's cut
  c.fillStyle = withAlpha(rim, 0.3);
  c.fillRect(cx - W * 8, cy + h + pitch * 0.42, W * 16, W * 0.01);
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.45), 0.35);
  c.fillRect(cx - W * 8, cy + h + pitch * 0.62, W * 16, W * 0.008);
  // the pier between July and August: pilaster cuts
  const pierX = px(2) + W;
  c.fillRect(pierX + pier * 0.25, cy - h - 4 * pitch, W * 0.01, 5 * pitch);
  c.fillRect(pierX + pier * 0.72, cy - h - 4 * pitch, W * 0.01, 5 * pitch);
  // the hole's frame: a thin warm spill of the room's lamplight on its reveal, the glass itself cold and clear
  c.strokeStyle = withAlpha(mixLab(lamp, env.mood.core, 0.4), 0.28);
  c.lineWidth = W * 0.01;
  c.strokeRect(cx - h + W * 0.005, cy - h + W * 0.005, W * 0.99, W * 0.99);
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.sky[2], 0.5), 0.1 * (1 - win(t, 0.6, 1.6)));
  c.fillRect(cx - h, cy - h, W, W);
  c.restore();
}

/** canonical grid proportions (sets/windowCalendar CAL: pane 7.2, gap 2.6, pier 12) */
const CAL_PANE = 7.2;
const CAL_PITCH = 7.2 + 2.6;
const CAL_PIER = 12;

/** the lark's-head loop over the wire: it forms as the hand circles (tie U 0.3-0.5) and pulls tight (0.5-0.56), and the
 *  detent click is a two-frame glint of four short ticks round the knot */
function tieLoop(c: C2, env: PaintEnv, U: number) {
  if (U < 0.3 || U > 0.75) return;
  const form = clamp01((U - 0.3) / 0.2);
  const tight = clamp01((U - 0.5) / 0.06);
  const k = AN.knot;
  const rx = 7.5 - 4.5 * tight, ry = 6 - 3.8 * tight;
  c.save();
  c.strokeStyle = withAlpha(mixLab('#e3d3ae', env.mood.rim, 0.35), 0.95 * (1 - clamp01((U - 0.62) / 0.1)));
  c.lineWidth = 1.3;
  c.lineCap = 'round';
  c.beginPath();
  c.ellipse(k.x, k.y + 1, rx, ry, 0, Math.PI / 2, Math.PI / 2 + form * Math.PI * 2);
  c.stroke();
  // the two legs of the loop running down to the eyelet
  if (form > 0.6) {
    c.beginPath();
    c.moveTo(k.x - rx * 0.6, k.y + ry * 0.7);
    c.lineTo(k.x - 1, k.y + 18 - 8 * tight);
    c.moveTo(k.x + rx * 0.6, k.y + ry * 0.7);
    c.lineTo(k.x + 1, k.y + 18 - 8 * tight);
    c.stroke();
  }
  // the click: a glint on the two frames after it pulls tight
  const ck = U >= 0.56 ? Math.exp(-(U - 0.56) * TIE_D * 9) : 0;
  if (ck > 0.05) {
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#fff4d6', 0.5), 0.9 * ck);
    c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      c.moveTo(k.x + Math.cos(a) * 6, k.y + Math.sin(a) * 6);
      c.lineTo(k.x + Math.cos(a) * 11, k.y + Math.sin(a) * 11);
    }
    c.stroke();
  }
  c.restore();
}

/** '8 July' beside the thread's foot, just above the rule (the thread's start) */
function footDate(c: C2, env: PaintEnv, a: number) {
  if (a <= 0.003) return;
  const foot = tag8Foot();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 9px ${FONT.mono}`, 9, '8 July');
    c.save();
    c.globalAlpha = a;
    c.fillStyle = mixLab(env.mood.core, env.mood.rim, 0.2);
    const x = foot.x - 7, y = foot.y - 9;
    const w = drawTracked(c, '8 July', x, y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.04, align: 'right' });
    textProbe(c, `${ID}-foot`, x - w, y - size, w, size * 1.1, a);
    c.restore();
  });
}
