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
import { FONT, LAYERS, cam3Interp, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, placeStamp, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { type HandsPose } from '../sets/narratorHands';
import { drawLine, drawRule, drawTag, drawTags, tagAnchors, tagsAt, type TagState } from '../sets/tagLine';
import { COLD_DY, coldNear, coldRoom, frostPosts } from '../sets/ch08-s02-cold';

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
/** the knot card: who tied it on (script nameCard), threaded onto the knot from above */
export const KNOT_LINES = ['tied on by: unnamed participants', 'not attributable to Cheng'];

// ---------------------------------------------------------------- camera: through the pane, then in to the tag
const C0: Camera3 = { x: 700, y: 420, z: -300, lens: 1 };
/** the mid-shot this shot ends on (= ch08-s03's opening framing) */
export const S02_END: Camera3 = { x: 796, y: 404, z: 160, lens: 2.5 };
function camAt(t: number, D: number): Camera3 {
  // the push through the pane (0 → 1.8 s) and the slow move in to the tag (1.4 → 9 s), overlapped so it never stops
  const a = sm(t / 1.8);
  const bU = sm((t - 1.4) / 7.6);
  const z = -300 + 340 * a + (S02_END.z - 40) * bU;
  const lens = 1 + (S02_END.lens - 1.06) * bU + 0.06 * win(t, 9, D);
  const x = C0.x + (S02_END.x - C0.x) * sm((t - 0.9) / 8.2);
  const y = C0.y + (S02_END.y - C0.y) * sm((t - 0.9) / 8.2);
  return { x, y, z, lens };
}

/** the facade of the Window Calendar right in front of the lens: one lit July pane (a hole) in the black card */
const PANE: LayerSpec = { id: 'pane', z: 110, haze: 0, blur: 1.2 };
const PANE_C = { x: 700, y: 420 };
const PANE_W = 128;

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

    coldRoom(f, { key: ID, dawn: 0, lamp: 0.9, desk: { tq, hands: true, screen: 0.9 } });

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
    const E = { R: lift(toLayer(LAYERS.L4, cam, -140, 800)) };

    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, COLD_DY);
      drawLine(c, env, { glow: 0.32 });
      frostPosts(c, env);
      drawRule(c, env, { alpha: 0.85 });
      drawTags(c, env, tags, { tq });
      // the knot card, threaded down onto tag 8's knot
      if (tied && knotIn > 0.003) knotCard(c, env, t, b, knotIn, swing * Math.sin(tq * 1.7), legible);
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
    const paneA = 1 - win(t, 1.25, 1.75);
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
  c.rect(PANE_C.x - 2400, PANE_C.y - 1600, 4800, 3200);
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
  // glazing bars across the lit pane
  c.fillStyle = ink;
  c.fillRect(PANE_C.x - 1.6, PANE_C.y - h, 3.2, PANE_W);
  c.fillRect(PANE_C.x - h, PANE_C.y - 1.6, PANE_W, 3.2);
  c.restore();
}

/** tag 8's knot card: who tied it on, threaded down onto the knot from above (drawn in L4, translated) */
function knotCard(c: C2, env: PaintEnv, t: number, b: Beats, a: number, swing: number, legible: boolean) {
  c.save();
  const role = legible ? 'subject' : 'texture';
  const f1 = legible ? legibleSize(c, `600 8.2px ${FONT.sc}`, 8.2, KNOT_LINES[0]) : 7;
  const f2 = legible ? legibleSize(c, `italic 400 7.4px ${FONT.text}`, 7.4, KNOT_LINES[1]) : 6.2;
  c.font = `600 ${f1}px ${FONT.sc}`;
  const w1 = c.measureText(KNOT_LINES[0]).width;
  c.font = `italic 400 ${f2}px ${FONT.text}`;
  const w2 = c.measureText(KNOT_LINES[1]).width;
  const cw = Math.max(w1, w2) + 14, ch = f1 * 1.25 + f2 * 1.3 + 9;
  const drop = (1 - a) * -26;
  const x0 = AN.knot.x - cw / 2 + swing * 10, y0 = AN.knot.y - 20 - ch + drop;
  // the paper inks with its first line (the card never shows blank)
  const inkAt = b.knot + 0.1;
  const paper = cardPaperAlpha(t, inkAt, 0.3) * a;
  const ink1 = clamp01((t - inkAt) / 0.12) * a;
  const ink2 = win(t, inkAt + 0.35, inkAt + 0.8) * a;
  // the thread from the card down through the eyelet's knot on the line
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9 * a);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(AN.knot.x - 4, y0 + ch);
  c.lineTo(AN.knot.x, AN.knot.y);
  c.lineTo(AN.knot.x + 4, y0 + ch);
  c.stroke();
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x0 + 1.5, y0 + 2, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.18), env.mood.core, 0.12);
  c.fillRect(x0, y0, cw, ch);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 0.6;
  c.strokeRect(x0, y0, cw, ch);
  // the eyelet hole the thread passes through
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.8);
  c.beginPath();
  c.arc(AN.knot.x, y0 + ch - 3.2, 1.3, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  textRole(c, role, () => {
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(mixLab('#2a1d14', env.mood.ink, 0.2), ink1);
    c.font = `600 ${f1}px ${FONT.sc}`;
    c.fillText(KNOT_LINES[0], x0 + cw / 2, y0 + 4 + f1);
    c.fillStyle = withAlpha(mixLab('#4a3626', env.mood.ink, 0.2), ink2);
    c.font = `italic 400 ${f2}px ${FONT.text}`;
    c.fillText(KNOT_LINES[1], x0 + cw / 2, y0 + 4 + f1 * 1.25 + f2 * 1.05);
  });
  cardProbe(c, `${ID}-knot`, x0, y0, cw, ch, paper, ink1);
  c.restore();
}

