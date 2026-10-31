/**
 * ch10-s02 — TAG 6 TURNED OVER: ITS BACK WAS NEVER BLANK (card, duskRose; cut in; 15.54 s).
 *   L1003 "Nine days after launch, a stranger tried four and a half: “you get 11.”"
 *   L1004 "Turn our whole-number tag over: the landing page's hidden comment already said so. A promise that states
 *          its limits is kept."
 *
 * The same valley as ch10-s01 (sets/ch10-s01-dusk): the line at 48 % between fence stakes, the hill town beyond, the
 * two strangers' cards from s01 still on their threads, the copper thread from tag 4's back to the first commenter.
 *
 * TEACHES, word by word:
 *   0 → 2.4          along the line to TAG 6, the README's example: its front For an integer a, its small print the
 *                    ternary (a > 4) ? 10 : 12, its knot card the README.
 *   2.69 card        a third window high on the right hill brightens; a plain white card rides its thread down and
 *                    docks above the line, the thread knotting on beside tag 6: 'a Hacker News commenter · 23 Oct 2026'
 *                    (the words are spoken, so no quoted text).
 *   4.91 eleven      the ch01 image returns in miniature on the card's corner: a marble rolls halfway up a paper ramp
 *                    and a tile turns up reading 11.
 *   5.4 → 7.1        the camera pushes in on tag 6; the narrator's hand (lower left) takes its corner.
 *   7.22 flip        on 'over' the tag turns with a paper snap: its back is NOT blank. A slip in grey ink from launch
 *                    day, the landing page's hidden comment, in the film's words (no quotation marks):
 *                    a = 4.5 gives 11 · a = 16,777,222 gives 8. No red pencil: there is nothing for it to write.
 *   ~11.9            the hand turns the tag front again; the camera eases back to take in the rule.
 *   14.11 rivet      on 'kept' the hand punches a copper rivet through the tag's corner (a dry clack); its thread drops
 *                    to the Lifespan Rule at its age as of 27 October 2026, thirteen days (between the week and month
 *                    ticks), and ends in a glowing open tip with a short copper arrow pointing right: still held.
 *   hold             the riveted tag swinging gently, the stranger's card on its thread from the town beside it.
 */
import { Timeline } from '../../../core';
import type { PaintEnv } from '../../../film';
import { FONT, defineShot, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import { drawPencil, type HandsPose } from '../sets/narratorHands';
import { TAG, drawLine, drawRule, drawTags, tagsAt, type TagState } from '../sets/tagLine';
import {
  LINE_DY, anchors10, camAlong, camK, cardGeom, cardInk, clamp01, copperThread, drawStrangerCard, drawStrangerThread, duskBack, duskNear, fence,
  lerpP, seg, segr, swingAfter, twos, type CamKey, type StrangerState,
} from '../sets/ch10-s01-dusk';

type C2 = CanvasRenderingContext2D;
const ID = 'ch10-s02';

const A6 = anchors10({ id: '6' });
const A4 = anchors10({ id: '4' });
/** the narrator's hand scale (an insert hand under the push) */
const HS = 0.5;
const LEN = 118 * HS;
/** the flip's target: the pinch lands on the tag's lower corner */
const FLIP_AT = { x: A6.eye.x + 4, y: A6.eye.y + TAG.h * 0.78 - LEN * 0.25 };
/** the rivet goes through the tag's upper left corner (sets/tagLine drawTag) */
const RIVET_AT = { x: A6.eye.x - TAG.w * 0.3, y: A6.eye.y + 16 };
/** the hidden comment, as a slip on tag 6's back (the film's words, no quotation marks) */
const SLIP_HEAD = ['the landing', "page's hidden", 'comment:'];
const SLIP_BODY = ['a = 4.5', 'gives 11', 'a = 16,777,222', 'gives 8'];

interface Beats {
  D: number;
  card: number;
  eleven: number;
  flip: number;
  rivet: number;
}

function camKeys(b: Beats): CamKey[] {
  return [
    { t: 0, cam: camK(610, 300, 1.6) },
    { t: 2.5, cam: camK(790, 292, 1.64) },
    { t: b.eleven + 0.5, cam: camK(838, 300, 1.78) },
    { t: b.flip - 0.1, cam: camK(652, 420, 3.45) },
    { t: b.flip + 3.5, cam: camK(654, 422, 3.56) },
    { t: b.rivet - 0.8, cam: camK(756, 396, 1.78) },
    { t: b.D, cam: camK(752, 398, 1.84) },
  ];
}

/** the two flips (the hand's own timing): turn over on 'over', turn back before the rivet */
const FLIP_D = 2.2;
const flip1U = (tq: number, b: Beats) => (tq - (b.flip - FLIP_D / 2)) / FLIP_D;
const flip2At = (b: Beats) => b.flip + 4.6;
const flip2U = (tq: number, b: Beats) => (tq - (flip2At(b) - FLIP_D / 2)) / FLIP_D;
const RIVET_D = 2.0;
const rivetU = (tq: number, b: Beats) => (tq - (b.rivet - 0.49 * RIVET_D)) / RIVET_D;

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, card: T.beat('card'), eleven: T.beat('eleven'), flip: T.beat('flip'), rivet: T.beat('rivet') };
    const others = tagsAt(ID, 'start').map((st, i) => ({ ...st, swing: 0.022, phase: i * 1.37 }));
    return { tl, b, others, keys: camKeys(b) };
  },
  paint(f, _s, sc) {
    const { b, others, keys } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAlong(keys, t);
    f.camera(cam);

    // the strangers: s01's two (docked), and the third riding down on 'stranger'
    const hn1: StrangerState = { id: 'hn1', ride: 1, tail: 1, dockedAt: -20 };
    const hn2: StrangerState = { id: 'hn2', ride: 1, tail: 1, dockedAt: -20 };
    const ride3 = segr(tq, b.card + 0.15, b.card + 1.75);
    const mini = (c: C2, w: number, h: number, env: PaintEnv) => miniRamp(c, w, h, env, t, b);
    const hn3: StrangerState = { id: 'hn3', ride: ride3, tail: seg(tq, b.card + 1.75, b.card + 2.1), dockedAt: b.card + 1.75, extra: mini };
    const lit3 = seg(t, b.card - 0.2, b.card + 0.2) * (1 - 0.45 * seg(t, b.card + 2.5, b.card + 4.5));

    duskBack(f, { key: ID, lit: { hn3: lit3 } });

    // ---- tag 6: turned over by the hand on 'over', back again, riveted on 'kept', its thread drops to the rule
    const p1 = flip1U(tq, b), p2 = flip2U(tq, b), pr = rivetU(tq, b);
    const pose1 = p1 > 0 && p1 < 1 ? hands.act('flip', p1, FLIP_AT, { scale: HS, entry: hands.entry(cam, 'L4') }) : null;
    const pose2 = p2 > 0 && p2 < 1 ? hands.act('flip', p2, FLIP_AT, { scale: HS, entry: hands.entry(cam, 'L4') }) : null;
    const poseR = pr > 0 && pr < 1 ? hands.act('rivet', pr, RIVET_AT, { scale: HS, entry: hands.entry(cam, 'L4') }) : null;
    const f1 = p1 <= 0 ? 0 : p1 >= 1 ? 1 : pose1!.flip ?? 0;
    const f2 = p2 <= 0 ? 0 : p2 >= 1 ? 1 : pose2!.flip ?? 0;
    const flip = clamp01(f1 - f2);
    const rv = seg(tq, b.rivet - 0.02, b.rivet + 0.16);
    const drop = seg(tq, b.rivet + 0.2, b.rivet + 1.15);
    // tag 6's own swing (radians): settling after each turn and after the punch
    const swing6 =
      tq < b.flip ? 0.022 * Math.sin(tq * 1.7 + 0.8)
      : tq < flip2At(b) ? swingAfter(tq, b.flip + 0.3, 0.05, 0.3)
      : tq < b.rivet ? swingAfter(tq, flip2At(b) + 0.3, 0.05, 1.1)
      : swingAfter(tq, b.rivet + 0.1, 0.09, 0.6);
    const inInsert = cam.lens > 1.8;
    // drawTag swings by st.swing·sin(tq·1.7 + phase): phase-lock it so tag 6 hangs at exactly swing6
    const tags: TagState[] = others.map((st) =>
      st.id === '6' ? { ...st, flip, back: [], rivet: rv, drop, swing: swing6, phase: Math.PI / 2 - tq * 1.7, subject: inInsert } : st,
    );
    const st6 = tags.find((s) => s.id === '6')!;

    f.layer('L4', (c, env) => {
      fence(c, env);
      drawStrangerThread(c, env, hn2, cam);
      drawStrangerThread(c, env, hn1, cam);
      drawStrangerThread(c, env, hn3, cam);
      const g1 = cardGeom(hn1, cam, t);
      copperThread(c, env, { x: A4.eye.x + 2, y: A4.eye.y + TAG.h * 0.52 }, lerpP(g1.bl, g1.br, 0.12), 1, 0.3);
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { posts: 'stake', glow: 0.55 });
      drawRule(c, env, { labels: 0 });
      drawTags(c, env, tags, { tq, pencil: 'none' });
      c.restore();
      // s01's red pencil still lies beside tag 4, unused
      drawPencil(c, { x: A4.eye.x + TAG.w * 0.62, y: A4.bottom.y - 6 }, Math.PI * 0.5 + 0.28, 62, env);
      slip(c, env, st6, tq, flip);
      drawStrangerCard(c, env, hn2, cam, t);
      drawStrangerCard(c, env, hn1, cam, t);
      drawStrangerCard(c, env, hn3, cam, t);
      // the narrator's hand (lower left) at the tag: flip, flip back, rivet
      for (const p of [pose1, pose2, poseR] as (HandsPose | null)[]) if (p) hands.draw(c, p, env);
      rivetFlash(c, env, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    duskNear(f, { key: ID });
  },
});

/**
 * The slip on tag 6's back: the landing page's hidden comment, in grey ink from launch day, set upright in the tag's
 * own (swung, narrowed) frame. It is there the moment the back shows: it was never blank.
 */
function slip(c: C2, env: PaintEnv, st: TagState, tq: number, flip: number) {
  const sxs = Math.cos(Math.PI * clamp01(flip));
  if (sxs >= 0) return;
  const sx = Math.max(0.04, -sxs);
  const swing = (st.swing ?? 0) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  c.save();
  c.translate(A6.eye.x, A6.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  // the pasted slip: paler paper, a hair askew, a soft edge
  const x0 = -TAG.w * 0.42, y0 = 14, w = TAG.w * 0.84, h = TAG.h - 19;
  c.save();
  c.rotate(-0.015);
  c.fillStyle = withAlpha('#000000', 0.08);
  c.fillRect(x0 + 0.8, y0 + 1, w, h);
  c.fillStyle = mixLab(mixLab('#ece4d2', env.mood.halo, 0.18), env.mood.core, 0.08);
  c.fillRect(x0, y0, w, h);
  c.restore();
  const grey = mixLab('#4a4642', env.mood.ink, 0.25);
  textRole(c, 'subject', () => {
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const fs = 6.6;
    c.fillStyle = withAlpha(grey, 0.82);
    c.font = `italic ${fs}px ${FONT.text}`;
    let y = y0 + fs * 1.15;
    SLIP_HEAD.forEach((l) => {
      c.fillText(l, 0, y);
      y += fs * 1.08;
    });
    y += fs * 0.35;
    c.fillStyle = withAlpha(grey, 0.95);
    c.font = `500 ${fs}px ${FONT.text}`;
    SLIP_BODY.forEach((l, i) => {
      c.fillText(l, 0, y);
      y += fs * (i % 2 === 1 ? 1.32 : 1.08);
    });
    textProbe(c, `${ID}-slip`, x0, y0, w, h, sx > 0.3 ? 1 : 0);
  });
  c.restore();
}

/** the rivet's dry clack: a brief copper flash at the corner */
function rivetFlash(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const u = (tq - b.rivet) / 0.4;
  if (u < 0 || u > 1) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 16;
  const g = c.createRadialGradient(RIVET_AT.x, RIVET_AT.y, 0, RIVET_AT.x, RIVET_AT.y, r);
  g.addColorStop(0, withAlpha(env.mood.core, 0.65 * (1 - u)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(RIVET_AT.x - r, RIVET_AT.y - r, 2 * r, 2 * r);
  c.restore();
}

/**
 * ch01's image in miniature on the card's right end (card-local px, the card's top at y = 7): a paper ramp, a marble
 * rolled halfway up it, and a tile turned up reading 11. It sets in on 'eleven'.
 */
function miniRamp(c: C2, w: number, h: number, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.eleven - 0.25, b.eleven + 0.15);
  if (u <= 0) return;
  const x0 = w / 2 - 38, x1 = w / 2 - 6;
  const yb = 7 + h - 7, yt = 7 + h - 25;
  const ink = cardInk(env);
  c.save();
  c.globalAlpha *= u;
  // the ramp: a paper wedge
  c.fillStyle = withAlpha(mixLab('#cfb07a', env.mood.halo, 0.3), 0.9);
  c.beginPath();
  c.moveTo(x0, yb);
  c.lineTo(x1, yt);
  c.lineTo(x1, yb);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.55);
  c.lineWidth = 0.7;
  c.stroke();
  // the marble rolls up to halfway
  const k = 0.5 * segr(t, b.eleven - 0.15, b.eleven + 0.45);
  const mx = x0 + (x1 - x0) * k, my = yb + (yt - yb) * k - 3.4;
  c.fillStyle = mixLab('#3a3430', env.mood.ink, 0.3);
  c.beginPath();
  c.arc(mx, my, 3.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.7);
  c.beginPath();
  c.arc(mx - 1, my - 1.1, 0.9, 0, Math.PI * 2);
  c.fill();
  // the tile: turns up reading 11
  const tu = seg(t, b.eleven - 0.05, b.eleven + 0.3);
  const tx = (x0 + x1) / 2 + 2, ty = 7 + 4;
  c.save();
  c.translate(tx, ty + 8);
  c.scale(1, Math.max(0.05, tu));
  c.fillStyle = mixLab('#efe6d2', env.mood.core, 0.12);
  c.fillRect(-11, -8, 22, 16);
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = 0.7;
  c.strokeRect(-11, -8, 22, 16);
  textRole(c, 'subject', () => {
    c.fillStyle = withAlpha(ink, 0.95);
    c.font = `600 13px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('11', 0, 1);
  });
  c.restore();
  c.restore();
}

