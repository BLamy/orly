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
import { LAYERS, cardPaperAlpha, defineShot, mixLab, placeStamp, toLayer, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { type HandsPose } from '../sets/narratorHands';
import { drawLine, drawRule, drawTag, drawTags, tagAnchors, tagsAt, type TagState } from '../sets/tagLine';
import { COLD_DY, coldNear, coldRoom, frostPosts, knotCard } from '../sets/ch08-s02-cold';

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
const HS = 0.6;
const TIE_D = 2.2;

// ---------------------------------------------------------------- camera: through the pane, then in to the tag
/** the mid-shot this shot ends on (= ch08-s03's opening framing) */
export const S02_END: Camera3 = { x: 796, y: 404, z: 165, lens: 2.5 };
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
  const lens = hk([[1.2, 1, 0], [3.1, 1.72, 0.24], [9.5, S02_END.lens - 0.05, 0.02], [D, S02_END.lens, 0]], t);
  const x = hk([[0.6, 700, 0], [3.1, 785, 18], [9.5, S02_END.x, 0], [D, S02_END.x, 0]], t);
  const y = hk([[0.6, 420, 0], [3.1, 408, -3], [9.5, S02_END.y, 0], [D, S02_END.y, 0]], t);
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
    const tieU = clamp01((tq - (b.tie - 0.55 * TIE_D)) / TIE_D);
    const tied = tieU >= 0.55;
    const ink = win(t, b.tie + 0.05, b.given + 0.1);
    const kick = (t0: number) => (t > t0 ? 0.08 * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.02 + kick(b.tie) + 0.5 * kick(b.knot + 0.45);
    const hang = 0.25 * win(t, b.tie + 0.2, b.tie + 1.6);
    const knotIn = win(t, b.knot - 0.05, b.knot + 0.55);
    const legible = k4 >= 2.45;

    const tags = tagsAt(ID, 'start');
    const t8: TagState = { id: '8', ink, knot: [], knotIn: 0, flip: 0, back: [], swing, phase: 0, drop: hang, subject: legible, glow: 0.12 * win(t, b.tie, b.tie + 0.6) };
    if (tied) tags.push(t8);
    tags.sort((p, q) => order(p.id) - order(q.id));
    const E = { R: lift(toLayer(LAYERS.L4, cam, -170, 760)) };

    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, COLD_DY);
      drawLine(c, env, { glow: 0.32 });
      frostPosts(c, env);
      drawRule(c, env, { alpha: 0.85 });
      drawTags(c, env, tags, { tq });
      // the knot card, threaded down onto tag 8's knot
      if (tied && knotIn > 0.003) {
        // the paper inks with its first line (never a blank card)
        const inkAt = b.knot + 0.1;
        knotCard(c, env, {
          knot: AN.knot, a: knotIn, paper: cardPaperAlpha(t, inkAt, 0.3) * knotIn, ink1: clamp01((t - inkAt) / 0.12) * knotIn,
          ink2: win(t, inkAt + 0.35, inkAt + 0.8) * knotIn, sway: 10 * swing * Math.sin(tq * 1.7), legible, id: `${ID}-knot`,
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

    // ---- the facade: a black card with one lit pane, flying past the lens on the push
    const paneA = 1 - win(t, 1.35, 1.85);
    if (paneA > 0.003) f.layer(PANE, (c, env) => facade(c, env, paneA));

    // ---- type: the date stamp
    placeStamp(f.c, { place: '8 July 2026', date: 'lab round one · 4 experiments', style: 'mono', x: 52, y: 70, at: b.pane, dur: b.tie + 2.2 - b.pane, fade: 0.5 }, { t, mood: f.mood, seed: 802 });
  },
});

const ORDER = ['1', 'qK', '2', 'lineage', '3', '4', '5', '6', '7', '8', '9', '10', 'nano', '11', 'why'];
const order = (id: string) => ORDER.indexOf(id);
/** a point in the L4 world → the same point in the translated (COLD_DY) drawing space */
const lift = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - COLD_DY });

/** the facade card with its single lit hole (the July pane), a cross of glazing bars and a warm glow at the frame */
function facade(c: C2, env: PaintEnv, a: number) {
  c.save();
  c.globalAlpha = a;
  const h = PANE_W / 2;
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  c.beginPath();
  c.rect(PANE_C.x - PANE_W * 6, PANE_C.y - PANE_W * 4.5, PANE_W * 12, PANE_W * 9);
  c.rect(PANE_C.x - h, PANE_C.y - h, PANE_W, PANE_W);
  c.fill('evenodd');
  // the neighbouring panes on the card: unlit black glass, a step lighter
  c.fillStyle = mixLab(ink, env.mood.set, 0.3);
  const P = PANE_W * 1.36;
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
    if (i === 0 && j === 0) continue;
    if (j === 0 && i < 0) continue;
    c.fillRect(PANE_C.x + i * P - h, PANE_C.y + j * P - h, PANE_W, PANE_W);
  }
  // lit neighbours to the left: the rest of July's six (the bottom storey), warm
  c.fillStyle = mixLab(mixLab(env.mood.rim, '#f2c27a', 0.75), env.mood.core, 0.3);
  for (let i = -3; i < 0; i++) c.fillRect(PANE_C.x + i * P - h, PANE_C.y - h, PANE_W, PANE_W);
  // the lit pane's warm frame glow (the glass we push through)
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(PANE_C.x, PANE_C.y, h * 0.7, PANE_C.x, PANE_C.y, h * 1.5);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#f2c27a', 0.4), 0));
  g.addColorStop(0.45, withAlpha(mixLab(env.mood.core, '#f2c27a', 0.4), 0.3));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(PANE_C.x - h * 1.6, PANE_C.y - h * 1.6, h * 3.2, h * 3.2);
  c.globalCompositeOperation = 'source-over';
  // the lit pane's own glass: warm lamplight, thinning as the lens closes on it (the room shows through)
  c.fillStyle = withAlpha(mixLab(mixLab(env.mood.rim, '#f2c27a', 0.75), env.mood.core, 0.3), 0.5 * a);
  c.fillRect(PANE_C.x - h, PANE_C.y - h, PANE_W, PANE_W);
  // glazing bars across the lit pane
  c.fillStyle = ink;
  const bar = PANE_W * 0.026;
  c.fillRect(PANE_C.x - bar / 2, PANE_C.y - h, bar, PANE_W);
  c.fillRect(PANE_C.x - h, PANE_C.y - bar / 2, PANE_W, bar);
  c.restore();
}
