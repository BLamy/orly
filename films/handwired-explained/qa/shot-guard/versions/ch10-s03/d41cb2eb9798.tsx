/**
 * ch10-s03 — "WHY?" IS HUNG ON THE LINE (card, duskRose; cut in; 8.46 s).
 *   L1005 "Another asked what the website never said: “why?”"
 *   L1006 "That's our blank tag. We'll keep it for the end."  (soft)
 *
 * The same valley (sets/ch10-s01-dusk). The blank tag has hung at the far right of the row since ch01-s05, on its slack
 * thread, its knot empty.
 *
 * TEACHES, word by word:
 *   0.60 askCard   a fourth window, high at the right end of the town, brightens; a plain white card rides its thread
 *                  down and docks above the right end of the line, its thread knotting on by the blank tag:
 *                  'a Hacker News commenter · 22 Oct 2026' (the quoted word is spoken).
 *   3.04 why       the camera finds the BLANK tag; the narrator's hand (lower left) takes its corner and turns its face
 *                  into the light; the red-pencil hand, carrying the stranger's mark as it carries every reader's,
 *                  enters from frame right and writes one word on it, why?, and a small question mark at the foot of
 *                  its slack thread (the Device 1 sign for something nobody has tested yet), then withdraws. Still no
 *                  knot card: a question has no holder.
 *   7.15 keep      on 'end' the narrator's hand smooths the little tag once and withdraws; the camera eases back so it
 *                  hangs small among the others, apart, in the frame's lower right third, catching the rim light.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, actionScale, defineShot, textProbe, textRole } from '../../../film';
import { hands } from '../cast';
import { pencilRed, type HandsPose } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, drawTags, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, anchors10, camAlong, camK, cardGeom, clamp01, copperThread, drawStrangerCard, drawStrangerThread, duskBack, duskNear, fence, lerpP,
  seg, segr, swingAfter, twos, type CamKey, type Pt, type StrangerState,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s03';

const AW = anchors10({ id: 'why' });
const A4 = anchors10({ id: '4' });
/** hand scale for both hands (insert-sized) */
const HS = 0.5;
const LEN = 118 * HS;
/** the word on the tag's face: its baseline centre, and the width the pencil writes across */
const WORD_AT = { x: AW.eye.x - 1, y: AW.eye.y + TAG.h * 0.56 };
const WORD_W = 38;
const WORD_FS = 16;
/** the foot of the slack thread (sets/tagLine drawTags: a bezier ending 38 px under the tag, 4 px right) */
const FOOT = { x: AW.bottom.x + 4, y: AW.bottom.y + 38 };

interface Beats {
  D: number;
  ask: number;
  why: number;
  keep: number;
}

function camKeys(b: Beats): CamKey[] {
  return [
    { t: 0, cam: camK(900, 326, 1.68) },
    { t: b.why - 0.5, cam: camK(960, 330, 1.78) },
    { t: b.why + 1.1, cam: camK(1086, 404, 2.55) },
    { t: b.keep - 0.75, cam: camK(1090, 408, 2.62) },
    { t: b.D, cam: camK(820, 300, 1.46) },
  ];
}

/** the pencil's write: u 0 → 1 over WRITE_D, the stroke runs over u .3 → .75 */
const WRITE_D = 2.6;
const writeU = (tq: number, b: Beats) => (tq - (b.why + 0.25)) / WRITE_D;

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, ask: T.beat('askCard'), why: T.beat('why'), keep: T.beat('keep') };
    const others = tagsAt(ID, 'start').map((st, i) => ({ ...st, swing: 0.022, phase: i * 1.37 }));
    return { tl, b, others, keys: camKeys(b) };
  },
  paint(f, _s, sc) {
    const { b, others, keys } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAlong(keys, t);
    f.camera(cam);

    const docked = (id: 'hn1' | 'hn2' | 'hn3'): StrangerState => ({ id, ride: 1, tail: 1, dockedAt: -20 });
    const hn4: StrangerState = { id: 'hn4', ride: segr(tq, b.ask + 0.15, b.ask + 1.75), tail: seg(tq, b.ask + 1.75, b.ask + 2.1), dockedAt: b.ask + 1.75 };
    const lit4 = seg(t, b.ask - 0.2, b.ask + 0.2) * (1 - 0.45 * seg(t, b.ask + 2.5, b.ask + 4.5));
    duskBack(f, { key: ID, lit: { hn4: lit4 } });

    // ---- the narrator's hand: take the corner, turn the face to the light, hold while the pencil writes, smooth once
    const nh = narratorHand(tq, b, cam);
    const wu = writeU(tq, b);
    const pp = wu > 0 && wu < 1 ? hands.pencil('write', wu, WORD_AT, { entry: hands.entry(cam, 'L4').pencil, scale: HS, writeW: WORD_W }) : null;
    const stroke = wu <= 0.3 ? 0 : wu >= 0.75 ? 1 : (wu - 0.3) / 0.45;
    const footQ = seg(tq, b.why + 0.25 + WRITE_D * 0.72, b.why + 0.25 + WRITE_D * 0.8);
    const held = nh.held;
    const turned = 0.1 * held;
    const swingW = held > 0.5 ? 0.0 : swingAfter(tq, b.why + 0.25 + WRITE_D * 0.9, 0.06, 0.4) * seg(tq, b.why, b.why + 0.3) + (tq < b.why ? 0.022 * Math.sin(tq * 1.7 + 2) : 0);
    const tags: TagState[] = others.map((st) => (st.id === 'why' ? { ...st, flip: turned, swing: swingW, phase: Math.PI / 2 - tq * 1.7, glow: 0.35 * held + 0.15 * nh.smooth, subject: true } : st));
    const stW = tags.find((s) => s.id === 'why')!;
    tags.splice(tags.indexOf(stW), 1);
    tags.push(stW);

    f.layer('L4', (c, env) => {
      fence(c, env);
      for (const id of ['hn2', 'hn1', 'hn3'] as const) drawStrangerThread(c, env, docked(id), cam);
      drawStrangerThread(c, env, hn4, cam);
      const g1 = cardGeom(docked('hn1'), cam, t);
      copperThread(c, env, { x: A4.eye.x + 2, y: A4.eye.y + TAG.h * 0.52 }, lerpP(g1.bl, g1.br, 0.12), 1, 0.3);
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'stake', glow: 0.55 });
      drawRule(c, env, { labels: 0 });
      drawTags(c, env, tags, { tq, pencil: 'none' });
      c.restore();
      whyWord(c, env, stW, tq, stroke, cam);
      footMark(c, env, footQ);
      for (const id of ['hn2', 'hn1', 'hn3'] as const) drawStrangerCard(c, env, docked(id), cam, t);
      drawStrangerCard(c, env, hn4, cam, t);
      if (nh.pose) hands.draw(c, nh.pose, env);
      if (pp) hands.draw(c, pp, env);
    });
    f.rim({ x: 0, y: -1 });
    duskNear(f, { key: ID, stake: false });
  },
});

/**
 * The narrator's working hand (frame LOWER LEFT), built from the rig's reach so it can do this shot's own small
 * gestures: approach (open) → pinch the tag's lower left corner and hold (the face turned a little to the light) →
 * let go and lay the flat hand on the tag's top → smooth it once, top to bottom, on 'end' → withdraw.
 */
function narratorHand(tq: number, b: Beats, cam: Camera3): { pose: HandsPose | null; held: number; smooth: number } {
  const E = hands.entry(cam, 'L4').R;
  const corner: Pt = { x: AW.eye.x - TAG.w * 0.42, y: AW.eye.y + TAG.h * 0.86 };
  const top: Pt = { x: AW.eye.x - 4, y: AW.eye.y + TAG.h * 0.22 };
  const foot: Pt = { x: AW.eye.x - 4, y: AW.eye.y + TAG.h * 0.8 };
  const off = (p: Pt, k: number) => lerpP(E, p, k);
  const a0 = b.why - 0.35, a1 = b.why + 0.3; // reach in, take the corner
  const r0 = b.why + 0.25 + WRITE_D * 0.86; // let go (the pencil has gone)
  const s0 = b.keep - 0.55, s1 = b.keep + 0.15; // smooth
  const w1 = b.keep + 1.1; // gone
  if (tq < a0 || tq > w1) return { pose: null, held: 0, smooth: 0 };
  let at: Pt;
  let shape: 'open' | 'pinch' | 'flat' | 'rest' = 'open';
  let held = 0;
  let smooth = 0;
  let presence = 1;
  if (tq < a1) {
    at = lerpP(off(corner, 0.25), corner, segr(tq, a0, a1));
    shape = tq > a1 - 0.12 ? 'pinch' : 'open';
    presence = seg(tq, a0, a0 + 0.25);
  } else if (tq < r0) {
    at = corner;
    shape = 'pinch';
    held = seg(tq, a1, a1 + 0.3) * (1 - seg(tq, r0 - 0.25, r0));
  } else if (tq < s0) {
    at = lerpP(corner, top, segr(tq, r0, s0));
    shape = 'flat';
  } else if (tq < s1) {
    smooth = Math.sin(Math.PI * clamp01((tq - s0) / (s1 - s0)));
    at = lerpP(top, foot, segr(tq, s0, s1));
    shape = 'flat';
  } else {
    at = lerpP(foot, off(foot, 0.1), segr(tq, s1, w1));
    shape = 'rest';
    presence = 1 - seg(tq, w1 - 0.3, w1);
  }
  const arm = hands.reach(E, at, shape, LEN, { sleeve: 'linen', bend: shape === 'flat' ? 0.25 : 0.05 });
  return { pose: { right: arm, scale: HS, presence }, held, smooth };
}

/** why? in red pencil on the tag's face, revealed left to right with the pencil's stroke (upright, in the tag frame) */
function whyWord(c: C2, env: PaintEnv, st: TagState, tq: number, stroke: number, cam: Camera3) {
  if (stroke <= 0) return;
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp01(st.flip ?? 0))));
  const swing = (st.swing ?? 0) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  c.save();
  c.translate(AW.eye.x, AW.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  const x0 = WORD_AT.x - AW.eye.x - WORD_W / 2;
  c.beginPath();
  c.rect(x0 - 4, 10, (WORD_W + 8) * clamp01(stroke), TAG.h);
  c.clip();
  // read as the subject while the camera is in close; as the hung tag's texture once it is small among the others
  textRole(c, actionScale(cam) >= 1.9 ? 'subject' : 'texture', () => {
    c.font = `italic ${WORD_FS}px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText('why?', WORD_AT.x - AW.eye.x, WORD_AT.y - AW.eye.y);
  });
  textProbe(c, `${ID}-why`, x0, WORD_AT.y - AW.eye.y - WORD_FS, WORD_W, WORD_FS * 1.2, clamp01(stroke));
  c.restore();
}

/** the small pencilled question mark at the foot of the slack thread (Device 1: nobody has tested it yet) */
function footMark(c: C2, env: PaintEnv, u: number) {
  if (u <= 0) return;
  c.save();
  c.globalAlpha *= u;
  textRole(c, 'texture', () => {
    c.font = `italic 11px ${FONT.fell}`;
    c.fillStyle = pencilRed(env, 0.9);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('?', FOOT.x + 1, FOOT.y + 1);
  });
  c.restore();
}
