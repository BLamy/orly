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
 *   1.46 ledger    on 'lab': at the far end of the line, beyond the left stake, on a small table in the meadow, the
 *                  lab's ledger lies closed and dark; it comes into focus. No thread reaches it; no window is lit
 *                  toward it. The date stamp AS OF 27 OCTOBER 2026 sets in.
 *   4.96 gentler   the red-pencil hand, resting at the line's near (right) end, lays its pencil down on the fence rail
 *                  and withdraws; the town's windows go out one by one, the strangers' last; the backlight dims a step
 *                  toward night. Hold.
 */
import { Timeline } from '../../../core';
import type { PaintEnv } from '../../../film';
import { FONT, LAYERS, defineShot, drawTracked, legibleSize, softPlate, textColor, textProbe, textRole, toLayer, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, pencilRed } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, drawTags, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, RAIL, anchors10, camAlong, camK, cardGeom, clamp01, copperThread, drawStrangerCard, drawStrangerThread, duskBack, duskNear, fence,
  lerpP, rivetGlint, seg, twos, type CamKey, type StrangerState,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s04';

const A4 = anchors10({ id: '4' });
const AW = anchors10({ id: 'why' });
/** where the red pencil is laid: on the fence's top rail, past the rule's end, by the near stake */
const LAY_AT = { x: 1192, y: RAIL.y - 1 };
const LAY_ANG = Math.PI - 0.04;
const HS = 0.5;

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
    const keys: CamKey[] = [
      { t: 0, cam: camK(690, 334, 1.03) },
      { t: b.D, cam: camK(694, 338, 0.93) },
    ];
    const others = tagsAt(ID, 'start').map((st, i): TagState => {
      const base = { ...st, swing: 0.02, phase: i * 1.37 };
      if (st.id === '8') return { ...base, flip: 0.6, strokes: { n: 10, u: 1 } };
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

    // the windows go out one by one after 'gentler' (a seeded order), the strangers' own last
    const out0 = b.gentler + 0.2;
    const winOn = (g: number, row: number) => 1 - seg(t, out0 + (((g * 5 + row * 3) % 17) / 17) * 2.4, out0 + (((g * 5 + row * 3) % 17) / 17) * 2.4 + 0.25);
    const strangersOn = 1 - seg(t, out0 + 2.5, out0 + 2.9);
    const dim = seg(t, b.gentler, b.gentler + 2.6);
    duskBack(f, { key: ID, winOn, strangersOn, sun: 1 - 0.45 * dim, ledger: seg(t, b.ledger - 0.25, b.ledger + 0.6) });

    const strangers: StrangerState[] = (['hn2', 'hn1', 'hn3', 'hn4'] as const).map((id) => ({ id, ride: 1, tail: 1, dockedAt: -20, glow: 0.55 * (1 - 0.6 * dim) }));
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
      drawTags(c, env, others, { tq, pencil: 'none' });
      c.restore();
      // the last of the sun on tag 6's rivet
      rivetGlint(c, env, swing6, 1 - 0.7 * dim);
      whyFront(c, env, others.find((s) => s.id === 'why')!, tq);
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
      f.c.fillStyle = withAlpha('#5d6a86', 0.32 * dim);
      f.c.fillRect(0, 0, 1280, 720);
      f.c.restore();
    }
    asOfStamp(f.c, f.mood, t, b.ledger - 0.05);
  },
});

/** the why? on the little tag's face, as ch10-s03 left it (red pencil; texture at this size) */
function whyFront(c: C2, env: PaintEnv, st: TagState, tq: number) {
  const swing = (st.swing ?? 0) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  c.save();
  c.translate(AW.eye.x, AW.eye.y);
  c.rotate(swing);
  textRole(c, 'texture', () => {
    c.font = `italic 16px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('why?', -1, TAG.h * 0.56);
  });
  c.restore();
}

/** the red-pencil hand at the line's near end: resting with its pencil, then laying it down on the rail on 'gentler' */
function pencilHand(c: C2, env: PaintEnv, tq: number, b: Beats, cam: Parameters<typeof hands.entry>[0]) {
  const entry = toLayer(LAYERS.L4, cam, 1330, 860);
  const lay0 = b.gentler - 0.25;
  // resting: the pose just above the rail, breathing a hair
  const u = tq < lay0 ? 0.4 : 0.4 + 0.6 * clamp01((tq - lay0) / 1.7);
  const pose = hands.pencil('rest', u, { x: LAY_AT.x, y: LAY_AT.y + (tq < lay0 ? Math.sin(tq * 1.6) * 0.8 : 0) }, { entry, scale: HS });
  if (pose.placed) drawPencil(c, LAY_AT, LAY_ANG, 56, env);
  if ((pose.presence ?? 1) > 0.02) hands.draw(c, pose, env);
}

/** AS OF 27 OCTOBER 2026 — the mono date stamp (the kit's placeStamp look, one phrase, no place · date dot) */
function asOfStamp(c: C2, mood: PaintEnv['mood'], t: number, at: number) {
  const k = seg(t, at, at + 0.6);
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
