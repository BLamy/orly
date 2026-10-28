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
 *   8.65 tagFour     the camera drifts left along the line and in to tag 4, the second suspect: it catches the light,
 *                    struck in red since ch03.
 *   14.38 compiler   a second, smaller BLANK card rides down from a window on the left hill and swings in on the
 *                    other side of tag 4, in the same light (neither side lit as the winner).
 *                    The red-pencil hand comes in with it (frame right, from below), hovering low under tag 4, partly
 *                    out of frame, as if to strike.
 *   15.91 docs       tag 4 turns on its thread to show its back: the docs' line written there in ch03 (small grey ink:
 *                    texture, not a reading item).
 *   16.96 first      a saturated copper thread runs (a bead of light travelling along it, 0.8 s) from the docs' line on
 *                    the tag's back to the first commenter's card and knots on its lower left corner; the strangers'
 *                    own threads dim to half, so it is the only bright thread. The pencil rises to the strike, at the
 *                    tag's lower left, and freezes there.
 *   ~18.0            the tag turns face-front again: the strike is already there, ending at the pencil's point.
 *   19.6 → 20.80     already: it lays its pencil down beside the tag (leaning on its LEFT edge, between tags 3 and 4),
 *                    unused, and withdraws down out of frame. Hold: the line, the two cards on their threads from the
 *                    town, the struck tag.
 * NEAR PLANE: a blurred near fence stake with tall grass at the lower left (L5) slides against the line and the hills
 * through the push-in.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, chapterCard, defineShot, mixLab, placeStamp, textProbe, textRole, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, type HandsPose } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, PENCIL4_REST, anchors10, camAlong, camK, cardGeom, clamp01, copperThread, drawStrangerCard, drawStrangerThread, drawTags10, duskBack,
  duskNear, fence, lerpP, seg, segr, twos, type CamKey, type Pt, type StrangerState,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s01';

/** tag 4's back, as the red pencil wrote it in ch03-s03 (rows so it fits inside the tag) */
const BACK_ROWS = ['No tool', 'converts', 'existing', 'Java-', 'Script'];
const T4: TagState = { id: '4' };
const A4 = anchors10(T4);
/** the pencil hand's scale (an insert-sized hand under the push) */
const HS = 0.56;
const PLEN = 118 * HS;
/** where the red pencil is laid down: beside tag 4, leaning on its LEFT edge between tags 3 and 4 (review r1: it sat
 *  over tag 5's words) */
const REST_AT = PENCIL4_REST.at;
const REST_ANG = PENCIL4_REST.angle;
/** the pencil POINT's stations (L4 world): low under tag 4, partly out of frame; the strike's start (the tag's lower
 *  left, where the stroke that is already there begins); just above the resting place */
const TIP_OFF: Pt = { x: A4.eye.x + 6, y: A4.bottom.y + 128 };
const TIP_LOW: Pt = { x: A4.eye.x - 16, y: A4.bottom.y + 66 };
// the point stops just under the tag's lower left corner, where the stroke that is already there begins: the hand and
// sleeve stay below the row of tags (wrist well under the tag's bottom edge)
const TIP_STRIKE: Pt = { x: A4.eye.x - TAG.w * 0.38, y: A4.bottom.y + 5 };
const TIP_PRELAY: Pt = { x: REST_AT.x, y: REST_AT.y - PLEN * 0.08 };
/** the pencil hand enters from just under the frame, right of centre (a short forearm: it never crosses the lower right
 *  third, and the wrist stays well under the row of tags) */
const PENCIL_ENTRY = { x: 690, y: 900 };

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
  // the last framing keeps the first card whole (upper right), tag 4 left of centre, the pencil under it
  return [
    { t: 0, cam: camK(664, 330, 1.3) },
    { t: 5.4, cam: camK(652, 318, 1.38) },
    { t: b.tagFour - 0.5, cam: camK(644, 314, 1.42) },
    { t: b.tagFour + 3.3, cam: camK(614, 354, 1.8) },
    { t: b.D, cam: camK(612, 358, 1.88) },
  ];
}
/** the near stake (L5 world): lower left through the whole push-in */
const OCCLUDER = { x: 316, y: 424 };

/** tag 4's turn: 0 → 0.72 on 'docs' (the back shows), held, face-front again under the frozen pencil (~18 s) */
function flip4(tq: number, b: Beats) {
  return 0.72 * seg(tq, b.docs - 0.1, b.docs + 0.45) * (1 - seg(tq, b.critic + 1.05, b.critic + 1.6));
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
    // on 'first' the strangers' own threads dim to half, so the copper thread is the only bright one
    const thA = 1 - 0.5 * seg(t, b.critic - 0.3, b.critic) * (1 - seg(t, b.critic + 2.2, b.critic + 2.5));
    hn1.threadA = thA;
    hn2.threadA = thA;

    duskBack(f, { key: ID, lit: { hn1: lit1, hn2: lit2 } });

    const fl = flip4(tq, b);
    const backShows = Math.cos(Math.PI * fl) < 0;
    // tag 4 catches the light as the camera arrives on it ('circuit'): the strike has been there since ch03
    const arrive = seg(t, b.tagFour + 0.6, b.tagFour + 1.6) * (1 - seg(t, b.tagFour + 3.4, b.tagFour + 5));
    const tags = others.map((st) =>
      st.id === '4'
        ? { ...st, flip: fl, back: [], glow: 0.4 * arrive, swing: 0.022 + 0.05 * seg(tq, b.docs - 0.1, b.docs + 0.3) * (1 - seg(tq, b.docs + 0.6, b.docs + 2)) }
        : st,
    );
    const st4 = tags.find((s) => s.id === '4')!;

    f.layer('L4', (c, env) => {
      fence(c, env);
      drawStrangerThread(c, env, hn1, cam);
      drawStrangerThread(c, env, hn2, cam);
      const g1 = cardGeom(hn1, cam, t);
      const from = { x: A4.eye.x + 2, y: A4.eye.y + TAG.h * 0.52 };
      const to = lerpP(g1.bl, g1.br, 0.12);
      const cu = (t - (b.critic - 0.05)) / 0.8;
      const cGlow = 0.45 + 0.55 * (1 - seg(t, b.critic + 0.8, b.critic + 2.4));
      if (!backShows) copperThread(c, env, from, to, cu, cGlow);
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'stake', glow: 0.55 });
      drawRule(c, env, { labels: 0 });
      drawTags10(c, env, tags, { tq });
      c.restore();
      backText(c, env, st4, tq, backShows);
      if (backShows) copperThread(c, env, from, to, cu, cGlow);
      drawStrangerCard(c, env, hn1, cam, t);
      drawStrangerCard(c, env, hn2, cam, t);
      pencilHand(c, env, cam, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    duskNear(f, { key: ID, occluder: OCCLUDER });

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

/** tag 4's back, as ch03 left it: the docs' line in small GREY ink (review r1: red is the strike's colour), upright in
 *  the tag's own (swung, narrowed) frame; it reads as writing, not as words (texture) */
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
    const fs = 7;
    c.font = `italic ${fs}px ${FONT.fell}`;
    c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.setHaze, 0.45), 0.55);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    BACK_ROWS.forEach((ln, i) => c.fillText(ln, 0, 24 + fs * 0.85 + i * fs * 1.15));
    textProbe(c, `${ID}-back4`, -TAG.w * 0.4, 22, TAG.w * 0.8, fs * 1.15 * BACK_ROWS.length, 0.55);
  });
  c.restore();
}

/**
 * The red pencil (frame RIGHT, from just under the frame): it comes in on 'compiler' and hovers low under tag 4, partly
 * out of frame; on 'first' it rises to the strike at the tag's lower left and freezes there for a second (the tag turns
 * face-front over it: the stroke is already there); from about 19.6 s it lays the pencil down beside the tag, unused
 * (placed on 'already'), and withdraws down out of frame.
 */
function pencilHand(c: C2, env: PaintEnv, cam: Camera3, tq: number, b: Beats) {
  const entry = toLayer(LAYERS.L4, cam, PENCIL_ENTRY.x, PENCIL_ENTRY.y);
  const o = { entry, scale: HS };
  const in0 = b.compiler - 0.2, in1 = b.compiler + 0.7;
  const r0 = b.critic - 0.4, r1 = b.critic + 0.15;
  const f1 = r1 + 1.0;
  const m0 = 19.6, m1 = b.already - 0.5, lay1 = b.already;
  const out1 = lay1 + 0.62;
  if (tq < in0 || tq > out1 + 0.05) {
    if (tq > out1) drawPencil(c, REST_AT, REST_ANG, 62, env);
    return;
  }
  // the hover pose puts the point at target + (0.12, -0.04)·len: aim it so the POINT lands on each station
  const hover = (tip: Pt, wob = 0.55) => hands.pencil('hover', wob, { x: tip.x - PLEN * 0.12, y: tip.y + PLEN * 0.04 }, o);
  let pose: HandsPose;
  if (tq < in1) pose = hover(lerpP(TIP_OFF, TIP_LOW, segr(tq, in0, in1)));
  else if (tq < r0) pose = hover({ x: TIP_LOW.x, y: TIP_LOW.y + Math.sin(tq * 2.1) * 1.2 });
  else if (tq < f1) pose = hover(lerpP(TIP_LOW, TIP_STRIKE, segr(tq, r0, r1))); // rise, then frozen (exactly still)
  else if (tq < m0) pose = hover(lerpP(TIP_STRIKE, { x: TIP_STRIKE.x - 3, y: TIP_STRIKE.y + 6 }, seg(tq, f1, f1 + 0.5)));
  else if (tq < m1) pose = hover(lerpP({ x: TIP_STRIKE.x - 3, y: TIP_STRIKE.y + 6 }, TIP_PRELAY, segr(tq, m0, m1)));
  else if (tq < lay1) pose = hands.pencil('rest', 0.4 + 0.1 * seg(tq, m1, lay1), REST_AT, o);
  else {
    // let go and withdraw the empty hand straight down out of frame
    const k = segr(tq, lay1 + 0.05, out1);
    const from = { x: REST_AT.x + PLEN * 0.3, y: REST_AT.y + PLEN * 0.15 };
    const at = lerpP(from, { x: from.x + PLEN * 0.6, y: from.y + PLEN * 2.4 }, k);
    pose = { right: hands.reach(entry, at, tq < lay1 + 0.12 ? 'open' : 'rest', PLEN, { sleeve: 'cuff', bend: 0.1 }), scale: HS, presence: 1, placed: true };
  }
  if (pose.placed || tq >= lay1) drawPencil(c, REST_AT, REST_ANG, 62, env);
  if ((pose.presence ?? 1) > 0.02) hands.draw(c, pose, env);
}
