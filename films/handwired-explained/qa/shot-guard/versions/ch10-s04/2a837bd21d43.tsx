/**
 * ch10-s04 — THE WHOLE LINE AT LAST LIGHT; THE LAB'S LEDGER, CLOSED (scene, duskRose; crossfade in; 8.63 s).
 *   L1007 "About the lab, we found no public word: the strangers' pencils were gentler than its own."
 *
 * The valley (sets/ch10-s01-dusk), seen whole for the first time in the chapter: a slow pull back (about 10 %) to the
 * whole copper line between its fence stakes, every tag so far hanging over the Lifespan Rule (labels: an hour · a day
 * · a year · a lifetime), the struck ones with their single red strokes, tag 8 turned a little so the ten short red
 * strokes on its back just show, tag 6's new rivet catching the last of the sun, its thread's open copper tip on the
 * rule between the week and month ticks, the little why? tag apart at the right. Beyond, the hill town; the four
 * strangers' threads still run from their windows down to the line, faintly lit.
 *
 * TEACHES, word by word:
 *   1.46 ledger    on 'lab': at the far end of the line, beyond the left stake and outside the line's span, on a small
 *                  table in the meadow, the lab's ledger lies closed and dark (a closed book: cover, darker spine band,
 *                  page block, ribbon tail; a faint cool rim only); it racks from soft to sharp (lab-0.2 → lab+0.8).
 *                  No thread reaches it; no window is lit toward it. The date stamp AS OF 27 OCTOBER 2026 sets in.
 *   4.96 gentler   the red-pencil hand, resting at the line's near (right) end, lowers its pencil onto the fence's top
 *                  rail in front of the stake (a clear 0.6 s gesture) and withdraws; the town's windows go out in
 *                  sequence over 4.96 → 6.5 s, the four strangers' windows last, 0.25 s apart; the backlight dims ONE
 *                  step toward night (not to black) and the date stamp sinks with the scene. Hold: the line, the
 *                  struck tags and the why tag still read.
 * CROSSFADE: the strangers' card text (and the why? on the little tag) holds at 0 until the dissolve from ch10-s03 is
 * about 70 % in, and ch10-s03 swaps its card text out over the same frames: no ghost text.
 */
import { Timeline } from '../../../core';
import type { PaintEnv } from '../../../film';
import { FONT, LAYERS, defineShot, drawTracked, legibleSize, softPlate, textColor, textProbe, textRole, textSwapIn, toLayer, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, pencilRed } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, RAIL, anchors10, camAlong, camK, cardGeom, clamp01, copperThread, drawStrangerCard, drawStrangerThread, drawTags10, duskBack, duskNear,
  fence, lerpP, rivetGlint, seg, segr, twos, type CamKey, type Pt, type StrangerState, type StrangerId,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s04';

const A4 = anchors10({ id: '4' });
const AW = anchors10({ id: 'why' });
/** where the red pencil is laid: on the fence's top rail, past the rule's end, lying across the near stake's foot */
const LAY_AT = { x: 1150, y: RAIL.y - 1 };
const LAY_ANG = Math.PI - 0.04;
/** the pencil hand at the near end, a little larger (its pencil 1.5× the old one, so the lay-down reads in the wide) */
const HS = 0.75;
const PLEN = 118 * HS;
/** the strangers' windows go out last, one by one, 0.25 s apart */
const STRANGER_OUT: Record<StrangerId, number> = { hn2: 0.84, hn1: 1.09, hn3: 1.34, hn4: 1.59 };

interface Beats {
  D: number;
  ledger: number;
  gentler: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, ledger: T.beat('ledger'), gentler: T.beat('gentler') };
    // the slow pull back (about 10 %), framed a little left so the ledger beyond the left stake stays in frame
    // it opens on ch10-s03's last framing (the dissolve never doubles the line), drifts left onto the whole line
    // in time for the ledger (≤ 5 % of frame width per second), then pulls back slowly
    const keys: CamKey[] = [
      { t: 0, cam: camK(700, 322, 1.08) },
      { t: b.ledger - 0.05, cam: camK(606, 334, 0.98) },
      { t: b.D, cam: camK(592, 338, 0.89) },
    ];
    const others = tagsAt(ID, 'start').map((st, i): TagState => {
      const base = { ...st, swing: 0.02, phase: i * 1.37 };
      // tag 8 turned a little more, so its ten short red strokes just show
      if (st.id === '8') return { ...base, flip: 0.75, strokes: { n: 10, u: 1 } };
      if (st.id === 'why') return { ...base, back: [] };
      return base;
    });
    return { tl, b, keys, others };
  },
  paint(f, _s, sc) {
    const { b, keys, others } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAlong(keys, t);
    f.camera(cam);

    // the windows go out in sequence after 'gentler', a group at a time (0.11 s apart), the strangers' own last
    const g0 = b.gentler;
    const winOn = (g: number) => 1 - seg(t, g0 + 0.11 * g, g0 + 0.11 * g + 0.12);
    const strangersOn: Partial<Record<StrangerId, number>> = {};
    for (const id of Object.keys(STRANGER_OUT) as StrangerId[]) strangersOn[id] = 1 - seg(t, g0 + STRANGER_OUT[id], g0 + STRANGER_OUT[id] + 0.12);
    // ONE step toward night (review r1: it went almost to black)
    const dim = seg(t, b.gentler, b.gentler + 2.6);
    duskBack(f, { key: ID, winOn, strangersOn, sun: 1 - 0.25 * dim, ledger: seg(t, b.ledger - 0.2, b.ledger + 0.8) });

    // text in only once the dissolve from ch10-s03 is ~70 % in (no ghost text)
    const textA = textSwapIn(t, 0.2, 0.3);
    const strangers: StrangerState[] = (['hn2', 'hn1', 'hn3', 'hn4'] as const).map((id) => ({
      id, ride: 1, tail: 1, dockedAt: -20, glow: 0.55 * (1 - 0.6 * dim) * (0.4 + 0.6 * (strangersOn[id] ?? 1)), role: 'texture' as const, textA,
    }));
    const st6 = others.find((s) => s.id === '6')!;
    const swing6 = (st6.swing ?? 0) * Math.sin(tq * 1.7 + (st6.phase ?? 0));

    f.layer('L4', (c, env) => {
      fence(c, env);
      for (const s of strangers) drawStrangerThread(c, env, s, cam);
      const g1 = cardGeom(strangers[1], cam, t);
      copperThread(c, env, { x: A4.eye.x + 2, y: A4.eye.y + TAG.h * 0.52 }, lerpP(g1.bl, g1.br, 0.12), 1, 0.3);
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'stake', glow: 0.55 * (1 - 0.4 * dim) });
      drawRule(c, env, { labels: 1 });
      drawTags10(c, env, others, { tq });
      c.restore();
      // the last of the sun on tag 6's rivet
      rivetGlint(c, env, swing6, 1 - 0.7 * dim);
      whyFront(c, env, others.find((s) => s.id === 'why')!, tq, textA);
      // s01's pencil beside tag 4 has gone back to the hand; the hand rests at the near end, then lays it on the rail
      for (const s of strangers) drawStrangerCard(c, env, s, cam, t);
      pencilHand(c, env, tq, b, cam);
    });
    f.rim({ x: 0, y: -1 });
    duskNear(f, { key: ID });

    // a step toward night: a cool multiply over the whole frame (no palette re-bake)
    if (dim > 0) {
      f.c.save();
      f.c.globalCompositeOperation = 'multiply';
      f.c.fillStyle = withAlpha('#5d6a86', 0.18 * dim);
      f.c.fillRect(0, 0, 1280, 720);
      f.c.restore();
    }
    // the stamp sinks with the scene (to about 0.3 by the last frame)
    asOfStamp(f.c, f.mood, t, b.ledger - 0.05, 1 - 0.7 * seg(t, b.gentler + 0.4, b.D));
  },
});

/** the why? on the little tag's face, as ch10-s03 left it (red pencil; texture at this size) */
function whyFront(c: C2, env: PaintEnv, st: TagState, tq: number, alpha: number) {
  if (alpha <= 0.001) return;
  const swing = (st.swing ?? 0) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  c.save();
  c.translate(AW.eye.x, AW.eye.y);
  c.rotate(swing);
  textRole(c, 'texture', () => {
    c.font = `italic 16px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.95 * alpha);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('why?', -1, TAG.h * 0.56);
  });
  c.restore();
}

/**
 * The red-pencil hand at the line's near end: resting, its pencil held a little above the rail; on 'gentler' it lowers
 * the pencil onto the rail in front of the stake (a clear 0.6 s gesture: down 0.4 s, set 0.2 s) and withdraws to the
 * lower right.
 */
function pencilHand(c: C2, env: PaintEnv, tq: number, b: Beats, cam: Parameters<typeof hands.entry>[0]) {
  const entry = toLayer(LAYERS.L4, cam, 1330, 860);
  const o = { entry, scale: HS };
  const hover = (tip: Pt) => hands.pencil('hover', 0.55, { x: tip.x - PLEN * 0.12, y: tip.y + PLEN * 0.04 }, o);
  const high: Pt = { x: LAY_AT.x + 4, y: LAY_AT.y - PLEN * 0.36 };
  const low: Pt = { x: LAY_AT.x, y: LAY_AT.y - PLEN * 0.08 };
  const d0 = b.gentler - 0.1, d1 = d0 + 0.4, set1 = d0 + 0.6;
  let pose;
  if (tq < d0) pose = hover({ x: high.x, y: high.y + Math.sin(tq * 1.6) * 0.8 });
  else if (tq < d1) pose = hover(lerpP(high, low, segr(tq, d0, d1)));
  else if (tq < set1) pose = hands.pencil('rest', 0.4 + 0.1 * seg(tq, d1, set1), LAY_AT, o);
  else pose = hands.pencil('rest', 0.5 + 0.5 * clamp01((tq - set1) / 1.0), LAY_AT, o);
  if (tq >= set1) drawPencil(c, LAY_AT, LAY_ANG, PLEN, env);
  if ((pose.presence ?? 1) > 0.02) hands.draw(c, pose, env);
}

/** AS OF 27 OCTOBER 2026 — the mono date stamp (the kit's placeStamp look, one phrase, no place · date dot) */
function asOfStamp(c: C2, mood: PaintEnv['mood'], t: number, at: number, sink = 1) {
  const k = seg(t, at, at + 0.6) * sink;
  if (k <= 0) return;
  const text = 'AS OF 27 OCTOBER 2026';
  const x = 52, y = 64;
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    c.globalAlpha = k;
    softPlate(c, x + text.length * size * 0.34, y - size * 0.35, text.length * size * 0.68 + 160, size + 70, mood.ink, 0.5);
    c.fillStyle = textColor(mood);
    const w = drawTracked(c, text, x + (1 - k) * -10, y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: 'left' });
    c.globalAlpha = k * 0.6;
    c.fillRect(x, y - size - 10, w * seg(t, at + 0.2, at + 0.9), 0.8);
    c.fillRect(x, y - size - 14, 0.8, 8);
    textProbe(c, `${ID}-asof`, x, y - size, w, size * 1.2, k);
  });
  c.restore();
}
