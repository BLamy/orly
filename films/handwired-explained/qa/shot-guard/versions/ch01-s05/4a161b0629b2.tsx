/**
 * ch01-s05 — the copper line appears in front of the desk; the narrator's hands tie on three suspect tags, then hang
 * a fourth, blank.
 *
 * The tag-keeper's workshop (sets/tagLine.ts, canonical: L2 the tall paned window wall, L3 the bench with the
 * HandwiredOS desk's dimmed silhouette and the parchment plates, L4 the copper line between its posts at 58 % of
 * frame height; no Lifespan Rule yet, no red pencil yet: it first appears in ch01-s07).
 *   'pullBack' (0.2 s): the camera pulls back out of the desk's wallpaper (z 800 → 600) and the copper line resolves
 *     across the dark in front of the desk.
 *   'tagsIn' (L0105 'weights'): three blank tags (each with its small faded 'suspect' stamp) swing in on their
 *     strings and hang slack at their canonical slots (3, 4, 5).
 *   'tag3' / 'tag4' / 'tag5' (L0106 'trained' / 'tool' / 'network'): the hands (narrator-hands: a mid-life man's
 *     forearms in rolled linen sleeves, from the LOWER LEFT only) tie each tag, the knot pulled on the word; each
 *     front inks in the film's hand while it is said, worded as staging.tagLine.tags gives it. Tags 3 and 5 keep an
 *     EMPTY knot; a tiny typeset card, the README, threads tag 4's eyelet (sized to be read at this push).
 *   'hang' (L0107 'hang'): the hands withdraw lower left; the camera pulls back to the whole line and the
 *     workshop; on 'copper line' the line's glow lifts once.
 *   'slack' ('test'): the three threads visibly hang slack (no lifespan yet).
 *   'whyIn' (L0107a 'blank'): the hands come back once with a fourth tag, its front BLANK, its knot empty, while
 *     the camera trucks right toward the far end of the row; 'whyTie' ('why'): tied at the far right slot (tie
 *     click), the hands withdraw; it swings once; 'whyTurn' ('way'): it turns a little into the light, its blank
 *     face reading.
 * Text discipline: the three tag fronts are the only reading items (each inks on its own beat while spoken); the
 * knot card is a name card; the suspect stamps are prop marks.
 */
import { Timeline, ease } from '../../../core';
import { FONT, PUPPET_NEAR_BLACK, cam3Interp, defineShot, legibleSize, mixLab, textRole, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { hands } from '../cast';
import type { HandsPose, Pt } from '../sets/narratorHands';
import { HAND_LEN } from '../sets/narratorHands';
import { SLOT_X, TAG, drawTag, lineYAt, tagLineScene, type TagId, type TagState } from '../sets/tagLine';

const C0: Camera3 = { x: 530, y: 470, z: 800, lens: 1 };
const C1: Camera3 = { x: 492, y: 466, z: 600, lens: 1 };
const C1b: Camera3 = { x: 494, y: 466, z: 625, lens: 1 };
const C2: Camera3 = { x: 640, y: 440, z: 90, lens: 1 };
const C3: Camera3 = { x: 880, y: 452, z: 330, lens: 1 };
const HS = 0.85; // hand scale (an insert on the line)
const LEN = HAND_LEN * HS;
const SUSPECTS: TagId[] = ['3', '4', '5'];
const knotOf = (id: TagId): Pt => ({ x: SLOT_X[id], y: lineYAt(SLOT_X[id]) });

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
/** a damped pendulum (radians) released at t0 from amplitude a0 */
const pend = (t: number, t0: number, a0: number, period: number, decay: number) =>
  t < t0 ? 0 : a0 * Math.exp(-(t - t0) * decay) * Math.cos(((t - t0) * Math.PI * 2) / period);

interface Sc {
  tagsIn: number;
  click: Record<'3' | '4' | '5' | 'why', number>;
  ink: Record<'3' | '4' | '5', [number, number]>;
  hang: number;
  slack: number;
  whyIn: number;
  whyTurn: number;
  copperLine: [number, number];
}

/** the tie action's working window: the knot pulls (u = .55) on the click, so u .3 → .6 spans [click - .625, click + .125] */
const TIE = 0.75;
const tieStart = (click: number) => click - (0.25 / 0.3) * TIE;

/** the narrator's hands for the whole shot (one continuous working hand, on twos) */
function narrator(tq: number, sc: Sc, entryR: Pt): HandsPose | null {
  const o = { entry: { R: entryR }, scale: HS };
  const act = (u: number, id: TagId, held: 'none' | 'tag' = 'none') => hands.act('tie', u, knotOf(id), { ...o, held });
  const tieU = (t: number, click: number) => 0.3 + (0.3 * (t - tieStart(click))) / TIE;
  const sock = (p: HandsPose) => hands.socket(p) as Pt;
  const moveBetween = (t: number, t0: number, t1: number, a: TagId, b: TagId): HandsPose => {
    const p0 = sock(act(0.6, a));
    const p1 = sock(act(0.3, b));
    const u = smooth((t - t0) / (t1 - t0));
    // a shallow lift over the line between knots (the hand rides up and over the next string)
    const at = lerpP(p0, p1, u);
    at.y -= Math.sin(u * Math.PI) * LEN * 0.12;
    return { right: hands.reach(entryR, at, u < 0.85 ? 'open' : 'pinch', LEN, { sleeve: 'linen' }), scale: HS };
  };
  const c3 = sc.click['3'], c4 = sc.click['4'], c5 = sc.click['5'], cw = sc.click.why;
  const approach0 = tieStart(c3) - 0.85;
  if (tq < approach0) return null;
  // first visit: tags 3, 4, 5
  if (tq < tieStart(c3)) return act((0.3 * (tq - approach0)) / 0.85, '3');
  if (tq < tieStart(c3) + TIE) return act(tieU(tq, c3), '3');
  if (tq < tieStart(c4)) return moveBetween(tq, tieStart(c3) + TIE, tieStart(c4), '3', '4');
  if (tq < tieStart(c4) + TIE) return act(tieU(tq, c4), '4');
  const leave4 = tieStart(c5) - 0.8;
  if (tq < leave4) {
    // resting by tag 4 while the third guess is said (a small settle, not a freeze)
    const p = sock(act(0.6, '4'));
    const at = { x: p.x - 4, y: p.y + 6 + Math.sin(tq * 2.1) * 1.2 };
    return { right: hands.reach(entryR, at, 'rest', LEN, { sleeve: 'linen', bend: -0.1 }), scale: HS };
  }
  if (tq < tieStart(c5)) return moveBetween(tq, leave4, tieStart(c5), '4', '5');
  if (tq < tieStart(c5) + TIE) return act(tieU(tq, c5), '5');
  if (tq < sc.hang) return act(0.6, '5');
  if (tq < sc.hang + 1.0) return act(0.6 + (0.4 * (tq - sc.hang)) / 1.0, '5');
  // second visit: the blank why tag
  const wIn = sc.whyIn - 0.15;
  const wStart = tieStart(cw);
  if (tq < wIn) return null;
  if (tq < wStart) return act((0.3 * (tq - wIn)) / (wStart - wIn), 'why', 'tag');
  if (tq < wStart + TIE) return act(tieU(tq, cw), 'why', 'tag');
  if (tq < wStart + TIE + 1.0) return act(0.6 + (0.4 * (tq - wStart - TIE)) / 1.0, 'why');
  return null;
}

/** the README knot card threaded through tag 4's eyelet, sitting between the line and the tag tops */
function readmeCard(c: CanvasRenderingContext2D, env: PaintEnv, u: number, subject: boolean) {
  if (u <= 0) return;
  const k = knotOf('4');
  const eye = { x: k.x, y: k.y + TAG.string + 7 };
  const label = 'the README';
  const base = 10.5;
  const fs = subject ? Math.max(base, legibleSize(c, `600 ${base}px ${FONT.sc}`, base, label)) : base;
  c.save();
  c.globalAlpha = u;
  c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
  const tw = c.measureText(label).width;
  const cw = tw + fs * 0.8, ch = fs * 1.45;
  const kx = k.x - 6 - cw, ky = k.y + 4 + (1 - u) * -8;
  // the thread from the card to the eyelet
  c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
  c.lineWidth = 1 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
  c.beginPath();
  c.moveTo(kx + cw - 1, ky + ch * 0.55);
  c.quadraticCurveTo(eye.x - 4, ky + ch * 0.9, eye.x - 1, eye.y);
  c.stroke();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(kx + 1.5, ky + 2, cw, ch);
  c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
  c.fillRect(kx, ky, cw, ch);
  // a punched hole at its right end, where the thread goes through
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.beginPath();
  c.arc(kx + cw - fs * 0.32, ky + ch * 0.5, fs * 0.09, 0, Math.PI * 2);
  c.fill();
  textRole(c, subject ? 'subject' : 'texture', () => {
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(label, kx + fs * 0.3, ky + ch * 0.55);
  });
  c.restore();
}

export default defineShot({
  id: 'ch01-s05',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', C0, cam3Interp);
    const tag3 = T.beat('tag3');
    const hang = T.beat('hang');
    const slack = T.beat('slack');
    const whyTurn = T.beat('whyTurn');
    tl.tween(cam, C1, { at: 0, dur: tag3 - 0.6, ease: ease.move });
    tl.tween(cam, C1b, { at: tag3 - 0.6, dur: hang - tag3 + 0.5, ease: ease.move });
    tl.tween(cam, C2, { at: hang + 0.05, dur: slack - hang - 0.15, ease: ease.move });
    tl.tween(cam, C3, { at: slack + 0.35, dur: whyTurn - slack, ease: ease.move });
    tl.hold(0, T.duration);
    const sc: Sc = {
      tagsIn: T.beat('tagsIn'),
      click: { '3': tag3, '4': T.beat('tag4'), '5': T.beat('tag5'), why: T.beat('whyTie') },
      ink: {
        '3': [T.word('L0106', 'Somebody'), T.wordEnd('L0106', 'it')],
        '4': [T.word('L0106', 'A'), T.wordEnd('L0106', 'code')],
        '5': [T.word('L0106', 'it#2'), T.wordEnd('L0106', 'network')],
      },
      hang,
      slack,
      whyIn: T.beat('whyIn'),
      whyTurn,
      copperLine: [T.word('L0107', 'copper'), T.wordEnd('L0107', 'line')],
    };
    return { tl, cam, sc };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = f.tq;
    const sc = scene.sc;
    const cam = s.get(scene.cam);
    f.camera(cam);
    const s4 = 1000 / Math.max(40, 1000 - cam.z);
    const subject = s4 >= 2.3;

    // ---- the tags (cut paper: on twos)
    const states: TagState[] = [];
    SUSPECTS.forEach((id, i) => {
      const tIn = sc.tagsIn - 0.1 + i * 0.14;
      const a = smooth((tq - tIn) / 0.3);
      if (a <= 0) return;
      const click = sc.click[id as '3'];
      const [i0, i1] = sc.ink[id as '3'];
      const idle = 0.022 * Math.sin(tq * 1.7 + SLOT_X[id] * 0.013);
      // swung in from the dark (released from the left), the knot's jerk on the tie, a touch when the line is
      // tested ('test'), then an idle drift
      const swing = pend(tq, tIn, -0.62, 1.15, 2.1) + pend(tq, click, 0.09, 0.7, 3.4) + pend(tq, sc.slack - 0.05, 0.05, 0.9, 2.6) + idle;
      states.push({
        id,
        alpha: a,
        swing,
        phase: Math.PI / 2 - tq * 1.7,
        ink: smooth((t - i0 + 0.05) / Math.max(0.4, i1 - i0)),
        knot: [],
        subject,
        glow: 0.12 * Math.exp(-Math.max(0, tq - click) * 2) * (tq >= click ? 1 : 0),
      });
    });
    // the why tag: hanging once its knot is pulled; swings once, then turns its blank face into the light
    const cw = sc.click.why;
    if (tq >= cw) {
      const turn = smooth((tq - sc.whyTurn + 0.1) / 0.6);
      states.push({
        id: 'why',
        swing: pend(tq, cw, 0.3, 1.2, 1.4) + 0.018 * Math.sin(tq * 1.7 + 1.3),
        phase: Math.PI / 2 - tq * 1.7,
        flip: 0.3 * (1 - turn),
        glow: 0.35 * turn,
      });
    }

    const entryR = hands.entry(cam, 'L4').R;
    const pose = narrator(tq, sc, entryR);
    const lineGlow = 0.5 + 0.32 * smooth((t - sc.copperLine[0] + 0.1) / 0.35) * (1 - smooth((t - sc.copperLine[1] - 0.2) / 1.2));
    const cardU = smooth((tq - sc.click['4']) / 0.35);

    tagLineScene(f, {
      variant: 'workshop',
      key: 'ch01-s05',
      tags: states,
      rule: false,
      pencilOnPost: false,
      line: { glow: lineGlow },
      desk: { lamp: 0.45 },
      sunX: 600,
      l4: (c, env) => {
        readmeCard(c, env, cardU, subject);
        // at 'test' the three slack threads catch the light once
        const k = Math.exp(-Math.max(0, t - sc.slack) * 2.2) * smooth((t - sc.slack + 0.1) / 0.15);
        if (k > 0.01) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5 * k);
          c.lineWidth = 1.6 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
          for (const id of SUSPECTS) {
            const bx = SLOT_X[id], by = lineYAt(bx) + TAG.string + TAG.h;
            c.beginPath();
            c.moveTo(bx, by);
            c.bezierCurveTo(bx - 6, by + 22, bx + 12, by + 26, bx + 4, by + 38);
            c.stroke();
          }
          c.restore();
        }
        if (pose) {
          hands.draw(c, pose, env, {
            heldDraw: (cc, at, held, e) => {
              if (held !== 'tag') return;
              drawTag(cc, e, { id: 'why', swing: 0.06 * Math.sin(tq * 3.1), phase: Math.PI / 2 - tq * 1.7 }, { at: { x: at.x, y: at.y - 6 }, knotAt: { x: at.x, y: at.y - 6 } });
            },
          });
        }
      },
    });
  },
});
