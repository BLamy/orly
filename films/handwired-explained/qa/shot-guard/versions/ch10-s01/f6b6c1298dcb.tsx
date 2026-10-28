/**
 * ch10-s01 — CHAPTER X · STRANGERS WITH PENCILS (card, duskRose; crossfade in from ch09; 21.5 s).
 *   L1001 "On Hacker News, one commenter said it's really “write your logic in a DSL that creates a
 *          neural-net-shaped circuit”. A DSL: a little language for one job."
 *   L1002 "Another saw a compiler. The docs side with the first: no tool converts your code."
 *
 * TAG-LINE STAGING, ch10 variant (OUT OF DOORS, sets/ch10-s01-dusk): the copper line taken outside, strung at 48 %
 * between two fence stakes across a valley at dusk; the Lifespan Rule lies on the fence's top rail; beyond, misty
 * ridges (L1) and the hill town (L2, bayArea style: gabled row houses with bay windows, about a third of the windows
 * lit) that stands for the world that reads the tags. Nobody from Hacker News is drawn: their words arrive as plain
 * white cards on threads paid out from the town's windows, and the threads stay strung.
 *
 * TEACHES, word by word:
 *   0.1 chapterCard  'Chapter X · Strangers with Pencils' sets in at upper left over the dusk sky; it holds, and is
 *                    carried out of frame as the camera drifts on 'circuit'.
 *   1.80 hn          the date stamp HACKER NEWS · SHOW HN · 20 OCTOBER 2026 sets in; a window high on the right hill
 *                    brightens; a plain white card rides its thread down from that window, growing as it comes out
 *                    of the haze, and docks right of frame centre above the line; its thread knots onto the line by
 *                    tag 4. The card carries only 'a Hacker News commenter · 22 Oct 2026' (the quote is spoken).
 *   8.65 tagFour     the camera drifts left along the line to tag 4, the second suspect, struck in red since ch03.
 *   14.38 compiler   a second, smaller BLANK card rides down from a window on the left hill and swings in on the
 *                    other side of tag 4, in the same light (neither side lit as the winner).
 *   15.91 docs       tag 4 turns on its thread to show its back: the docs' line written there in ch03 (red pencil,
 *                    small: texture, not a reading item).
 *   16.96 first      a thin copper thread runs from the docs' line on the tag's back to the first commenter's card.
 *   ~18.3            the tag turns face-front again: the strike. The red-pencil hand comes in from frame right, as if
 *                    to strike, and stops at the end of the stroke that is already there.
 *   20.80 already    it lays its pencil down beside the tag, unused, and withdraws. Hold: the line, the two cards on their threads from the town, the struck tag.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, chapterCard, defineShot, mixLab, placeStamp, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, pencilRed, type ArmPose, type HandsPose } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, drawTags, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, anchors10, camAlong, camK, cardGeom, clamp01, copperThread, drawStrangerCard, drawStrangerThread, duskBack, duskNear, fence, lerp,
  lerpP, seg, segr, twos, type CamKey, type StrangerState,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s01';

/** tag 4's back, as the red pencil wrote it in ch03-s03 (rows so it fits inside the tag) */
const BACK_ROWS = ['No tool', 'converts', 'existing', 'Java-', 'Script'];
const T4: TagState = { id: '4' };
const A4 = anchors10(T4);
/** the pencil hand's scale (an insert-sized hand under the push) */
const HS = 0.56;
/** where the red pencil is laid down: beside the tag, leaning on its right edge (the film's 'beside' convention) */
const REST_AT = { x: A4.eye.x + TAG.w * 0.62, y: A4.bottom.y - 6 };
const REST_ANG = Math.PI * 0.5 + 0.28;
/** the hover point: just under tag 4's lower right corner, the pencil pointing up at the strike (the hand stays
 *  below the row of tags, so it never covers a neighbour's face) */
const HOVER_AT = { x: A4.eye.x + TAG.w * 0.5 - 14, y: A4.eye.y + TAG.h + 10 };

interface Beats {
  D: number;
  hn: number;
  tagFour: number;
  compiler: number;
  docs: number;
  critic: number;
  already: number;
}

function camKeys(b: Beats): CamKey[] {
  return [
    { t: 0, cam: camK(664, 330, 1.3) },
    { t: 5.4, cam: camK(652, 318, 1.38) },
    { t: b.tagFour - 0.5, cam: camK(644, 314, 1.42) },
    { t: b.tagFour + 3.1, cam: camK(540, 302, 1.56) },
    { t: b.D, cam: camK(534, 300, 1.63) },
  ];
}

/** tag 4's turn: 0 → 0.72 on 'docs' (the back shows), held, face-front again before the pencil comes to rest */
function flip4(tq: number, b: Beats) {
  return 0.72 * seg(tq, b.docs - 0.1, b.docs + 0.45) * (1 - seg(tq, b.critic + 1.7, b.critic + 2.35));
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      hn: T.beat('hn'),
      tagFour: T.beat('tagFour'),
      compiler: T.beat('compiler'),
      docs: T.beat('docs'),
      critic: T.beat('critic'),
      already: T.beat('already'),
    };
    const others = tagsAt(ID, 'start').map((st, i) => ({ ...st, swing: 0.022, phase: i * 1.37 }));
    return { tl, b, others, keys: camKeys(b) };
  },
  paint(f, _s, sc) {
    const { b, others, keys } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAlong(keys, t);
    f.camera(cam);

    // the strangers: the first rides down on 'Hacker', the second on 'compiler'
    const ride1 = segr(tq, b.hn + 0.3, b.hn + 2.5);
    const hn1: StrangerState = { id: 'hn1', ride: ride1, tail: seg(tq, b.hn + 2.5, b.hn + 2.95), dockedAt: b.hn + 2.5 };
    const ride2 = segr(tq, b.compiler - 0.15, b.compiler + 1.25);
    const hn2: StrangerState = { id: 'hn2', ride: ride2, tail: seg(tq, b.compiler + 1.25, b.compiler + 1.6), dockedAt: b.compiler + 1.25 };
    const lit1 = seg(t, b.hn - 0.05, b.hn + 0.35) * (1 - 0.45 * seg(t, b.hn + 3, b.hn + 5));
    const lit2 = seg(t, b.compiler - 0.3, b.compiler + 0.1) * (1 - 0.45 * seg(t, b.compiler + 2, b.compiler + 4));

    duskBack(f, { key: ID, lit: { hn1: lit1, hn2: lit2 } });

    const fl = flip4(tq, b);
    const backShows = Math.cos(Math.PI * fl) < 0;
    const tags = others.map((st) => (st.id === '4' ? { ...st, flip: fl, back: [], swing: 0.022 + 0.05 * seg(tq, b.docs - 0.1, b.docs + 0.3) * (1 - seg(tq, b.docs + 0.6, b.docs + 2)) } : st));
    const st4 = tags.find((s) => s.id === '4')!;

    f.layer('L4', (c, env) => {
      fence(c, env);
      drawStrangerThread(c, env, hn1, cam);
      drawStrangerThread(c, env, hn2, cam);
      const g1 = cardGeom(hn1, cam, t);
      const from = { x: A4.eye.x + 2, y: A4.eye.y + TAG.h * 0.52 };
      const to = lerpP(g1.bl, g1.br, 0.12);
      const cu = seg(t, b.critic - 0.05, b.critic + 0.8);
      const cGlow = 0.35 + 0.65 * (1 - seg(t, b.critic + 0.8, b.critic + 2.4));
      if (!backShows) copperThread(c, env, from, to, cu, cGlow);
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'stake', glow: 0.55 });
      drawRule(c, env, { labels: 0 });
      drawTags(c, env, tags, { tq, pencil: 'none' });
      c.restore();
      backText(c, env, st4, tq, backShows);
      if (backShows) copperThread(c, env, from, to, cu, cGlow);
      drawStrangerCard(c, env, hn1, cam, t);
      drawStrangerCard(c, env, hn2, cam, t);
      pencilHand(c, env, cam, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    duskNear(f, { key: ID });

    // ---- screen-locked type
    const tenv = { t, mood: f.mood, seed: 1001 };
    // the chapter card is carried out with the far plane as the camera drifts on 'circuit'
    const d0 = toScreen(LAYERS.L2, keys[0].cam, 300, 200);
    const d1 = toScreen(LAYERS.L2, cam, 300, 200);
    const carry = seg(t, b.tagFour - 0.4, b.tagFour + 1.2);
    f.c.save();
    f.c.translate((d1.x - d0.x) * carry, (d1.y - d0.y) * carry);
    chapterCard(f.c, { number: 10, title: 'Strangers with Pencils', x: 336, y: 150, size: 50, at: 0.1, dur: b.tagFour + 0.5, fade: 0.6 }, tenv);
    f.c.restore();
    placeStamp(f.c, { place: 'Hacker News · Show HN', date: '20 October 2026', style: 'mono', x: 1228, y: 64, align: 'right', at: b.hn - 0.05, dur: b.compiler - b.hn - 0.4, fade: 0.5 }, tenv);
  },
});

/** tag 4's back: the docs' line in faded red pencil, upright in the tag's own (swung, narrowed) frame; texture */
function backText(c: C2, env: PaintEnv, st: TagState, tq: number, shows: boolean) {
  if (!shows) return;
  const fl = clamp01(st.flip ?? 0);
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * fl)));
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  c.save();
  c.translate(A4.eye.x, A4.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  textRole(c, 'texture', () => {
    const fs = 8.4;
    c.font = `italic ${fs}px ${FONT.fell}`;
    // faded: two weeks of weather on the red
    c.fillStyle = withAlpha(mixLab(pencilRed(env, 1), env.mood.setHaze, 0.32), 0.85);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    BACK_ROWS.forEach((ln, i) => c.fillText(ln, 0, 22 + fs * 0.85 + i * fs * 1.12));
    textProbe(c, `${ID}-back4`, -TAG.w * 0.4, 20, TAG.w * 0.8, fs * 1.12 * BACK_ROWS.length, 0.85);
  });
  c.restore();
}

/**
 * The red pencil (frame RIGHT only): it comes in with the first card as if to strike, waits at tag 4's edge over the
 * strike that is already there, then lays the pencil down beside the tag, unused, and withdraws.
 */
function pencilHand(c: C2, env: PaintEnv, cam: Camera3, tq: number, b: Beats) {
  const entry = hands.entry(cam, 'L4').pencil;
  const o = { entry, scale: HS };
  const inAt = b.critic + 1.3;
  const holdTo = b.already - 0.85;
  const lay0 = b.already - 0.2;
  if (tq < inAt) return;
  let pose: HandsPose;
  if (tq < holdTo) {
    // approach (0 → .35) then wait, almost still (.35 → .7)
    const u = tq < inAt + 1.0 ? 0.35 * ((tq - inAt) / 1.0) : 0.36 + 0.34 * clamp01((tq - inAt - 1.0) / (holdTo - inAt - 1.0));
    pose = hands.pencil('hover', u, HOVER_AT, o);
  } else if (tq < lay0) {
    // from the waiting pose to just above the resting place
    const A = hands.pencil('hover', 0.7, HOVER_AT, o);
    const B = hands.pencil('rest', 0.4, REST_AT, o);
    const v = seg(tq, holdTo, lay0);
    pose = { ...B, right: blendArm(A.right!, B.right!, v), presence: 1 };
  } else {
    pose = hands.pencil('rest', 0.4 + 0.6 * clamp01((tq - lay0) / 1.35), REST_AT, o);
  }
  if (pose.placed) drawPencil(c, REST_AT, REST_ANG, 62, env);
  if ((pose.presence ?? 1) > 0.02) hands.draw(c, pose, env);
}
function blendArm(a: ArmPose, z: ArmPose, v: number): ArmPose {
  return { ...z, wrist: lerpP(a.wrist, z.wrist, v), angle: lerp(a.angle, z.angle, v), bend: lerp(a.bend ?? 0, z.bend ?? 0, v) };
}
