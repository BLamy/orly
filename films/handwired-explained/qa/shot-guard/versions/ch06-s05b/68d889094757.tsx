/**
 * ch06-s05b — TAG 7 TIED AND STRUCK (scene, the clock room, candleAmber; cut in from the two desks; 7.54 s).
 *   L0615 "One run per frame? That held until mid-September. Now a busy drag frame runs about seventeen."
 *
 * The camera has tilted down from the two desks (a soft silhouette above, in L3) to the copper line strung in front
 * of them (sets/tagLine, canonical geometry and every tag tied so far, in continuity via tagsAt); behind the line the
 * clock room's round window, and below it the host clockwork's ratchet turning slowly in haze (the chapter's
 * tagLine variant: the line high over the clockwork, tags hanging above the ratchet).
 *
 * TEACHES, word by word:
 *   tag (0.50 'One')     cut into the tie: the narrator's hands (lower left) carry tag 7 up and loop its plain thread
 *                        over the wire; the knot pulls on 'One'; the front inks One evaluation per frame while 'run per
 *                        frame' is said; its knot card (HandwiredOS's own design) threads into the eyelet
 *   strike (2.29 'held') the hands flip the tag (the paper snap on 'held'); the red pencil (frame right) draws on the
 *                        back a row of little event marks, each on its own tick of time (a drawing, no words); the hands
 *                        turn it front again and the pencil strikes it once, as a tight insert (by 'Now', 4.11); the
 *                        thread drops to the Lifespan Rule at its measured lifespan (99 days, about three months) and
 *                        ends there in a plain cut end, where a small date tag inks: UNTIL 15 SEPT 2026
 *   events (5.88)        seventeen small paper tokens run along the line in a close row; sixteen event tokens peel off
 *                        one by one, each stopping on its own timestamp mark, and the larger frame token stops last at
 *                        the frame's mark (no caption: the voice says it). Hold on the struck tag.
 * Numbers (HL17, HL03): one evaluation per frame until 15 September 2026; since then a drag frame with 16 coalesced
 * moves runs about 17 evaluations (one per distinct event timestamp, then one for the frame).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, LAYERS, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toLayer, withAlpha } from '../../../film';
import { hands } from '../cast';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf, drawPencil, pencilRed } from '../sets/narratorHands';
import { RULE, TAG, TAGS, drawLine, drawRule, drawTag, drawTags, lifeX, lineYAt, tagAnchors, tagStrike, tagsAt, type TagState } from '../sets/tagLine';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, clockworkX, inkCol, lw, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { camAt, camK, type CamKey } from '../sets/ch06-s06-kit';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s05b';

const T7: TagState = { id: '7' };
const AN = tagAnchors(T7);
/** hand scale: an insert-sized hand under the push */
const HS = 0.55;
const LEN = 118 * HS;
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - LEN * 0.25 };
/** tag 7's measured lifespan: 8 June to 15 September 2026 = 99 days (sets/tagLine registry) */
const LIFE_X = lifeX(99);
/** the token span on the line: sixteen timestamp marks and the frame's mark, left of the blank why tag */
const SPAN = { x0: 758, x1: 1068 };
const N_EV = 16;
/** the events' own timestamps inside one drag frame (uneven, seeded once): marks along the span */
const MARKS: number[] = (() => {
  const gaps = Array.from({ length: N_EV }, (_, i) => 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(i * 2.399 + 0.7)));
  const tot = gaps.reduce((a, b) => a + b, 0);
  const span = SPAN.x1 - 22 - SPAN.x0;
  let acc = 0;
  return gaps.map((g) => {
    const x = SPAN.x0 + (acc / tot) * span;
    acc += g;
    return x;
  });
})();
/** compressed row pitch of the running tokens (review r1: tokens ~1.6x, countable at the end framing) */
const PITCH = 17;
/** event token radius and the frame token's size (L4 px) */
const TOK_R = 6.6;
const FRAME_TOK = { w: 19, h: 23 };

interface Beats {
  D: number;
  tag: number;
  strike: number;
  events: number;
  /** the tie: u(t) = u0 + t / TIE_D, the knot pulled (u .55) on 'One' */
  tieD: number;
  tieU0: number;
  inkA: number;
  inkB: number;
  flip0: number;
  draw0: number;
  draw1: number;
  unflip0: number;
  ins0: number;
  stroke: number;
  drop0: number;
  drop1: number;
  date: number;
  run0: number;
  catch0: number;
  catch1: number;
}
const FLIP_D = 0.8;
const UNFLIP_D = 0.7;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const tag = T.beat('tag');
    const strike = T.beat('strike');
    const events = T.beat('events');
    const tieD = 1.5;
    const flip0 = strike - 0.5 * FLIP_D;
    const draw0 = flip0 + 0.62 * FLIP_D + 0.04;
    const draw1 = draw0 + 0.55;
    const unflip0 = draw1 + 0.12;
    const stroke = unflip0 + 0.62 * UNFLIP_D + 0.08;
    const b: Beats = {
      D: T.duration,
      tag,
      strike,
      events,
      tieD,
      tieU0: 0.55 - tag / tieD,
      inkA: tag + 0.12,
      inkB: T.wordEnd('L0615', 'frame') + 0.1,
      flip0,
      draw0,
      draw1,
      unflip0,
      ins0: stroke - 0.42,
      stroke,
      // review r1: the strike lands by ~3.6 and the date tag inks by ~4.3 ('Now'), clear of 'seventeen'
      drop0: stroke + 0.22,
      drop1: stroke + 0.7,
      date: stroke + 0.66,
      run0: events - 0.45,
      catch0: events + 0.02,
      catch1: events + 0.92,
    };
    const tagC = { x: AN.eye.x, y: AN.eye.y + TAG.h * 0.5 };
    const keys: CamKey[] = [
      // tilting down from the desks onto the line as the tie lands
      { t: 0, cam: camK(AN.eye.x + 14, AN.eye.y - 44, 2.25) },
      { t: 1.15, cam: camK(AN.eye.x + 8, AN.eye.y + 36, 2.62) },
      { t: b.ins0, cam: camK(AN.eye.x + 6, AN.eye.y + 40, 2.7) },
      // the strike: a 12 % push onto the tag, held through the stroke
      { t: b.stroke - 0.05, cam: camK(tagC.x, tagC.y, 2.7 * 1.12) },
      { t: b.stroke + 0.32, cam: camK(tagC.x, tagC.y + 1, 2.7 * 1.13) },
      // pull back (review r1: never wider than 2.0): the struck tag at frame-left third, the date tag on the rule
      // below it, the token run on the line to the right; then a slow push holding on the struck tag
      { t: b.events - 0.25, cam: camK(AN.eye.x + 166, AN.eye.y + 46, 2.04) },
      { t: b.D + 0.4, cam: camK(AN.eye.x + 160, AN.eye.y + 46, 2.14) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    const E = entries(cam);

    // ---- tag 7, on twos
    const tieU = b.tieU0 + tq / b.tieD;
    const tiePose = tieU < 1 ? hands.act('tie', tieU, AN.knot, { held: 'tag', scale: HS, entry: { R: E.R } }) : null;
    const tied = tieU >= 0.55;
    const flipU = clamp01((tq - b.flip0) / FLIP_D);
    const unflipU = clamp01((tq - b.unflip0) / UNFLIP_D);
    const flipped = (u: number) => (u <= 0.38 ? 0 : u >= 0.62 ? 1 : (u - 0.38) / 0.24);
    const flip = unflipU > 0 ? 1 - flipped(unflipU) : flipped(flipU);
    const writeU =
      tq < b.draw0 ? 0.3 * seg(tq, b.draw0 - 0.45, b.draw0) : tq < b.draw1 ? 0.3 + 0.45 * ((tq - b.draw0) / (b.draw1 - b.draw0)) : 0.75 + 0.25 * seg(tq, b.draw1, b.draw1 + 0.4);
    const pp = writeU > 0 && writeU < 1 ? hands.pencil('write', writeU, { x: AN.eye.x, y: AN.eye.y + TAG.h * 0.6 }, { scale: HS, entry: E.pencil, writeW: TAG.w * 0.66 }) : null;
    const marks = writeU >= 1 ? 1 : pp?.stroke ?? 0;
    const strike = clamp01((t - b.stroke) / 0.32);
    const drop = seg(t, b.drop0, b.drop1);
    const kick = (t0: number, k = 0.09) => (t > t0 ? k * Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 9) : 0);
    const swing = 0.02 + kick(b.tag + 0.05) + kick(b.strike, 0.05) + kick(b.stroke, 0.06);
    const ink = seg(t, b.inkA, b.inkB);
    const t7: TagState = {
      id: '7',
      ink,
      knot: [],
      flip,
      back: [],
      backInk: 0,
      strike,
      drop,
      swing,
      phase: 0,
      glow: 0.18 + 0.2 * seg(t, b.tag, b.tag + 0.4) - 0.1 * seg(t, b.stroke, b.stroke + 0.6),
      subject: true,
    };
    const tags = tagsAt(ID, 'start');
    if (tied) tags.push(t7);
    tags.sort((a, c) => (a.id === '7' ? 1 : 0) - (c.id === '7' ? 1 : 0));

    // ---- the room: the round window behind the line; the desks above and the clockwork below, in haze
    clockRoom(f, { key: ID, oculus: { x: 720, y: 330, r: 330 }, lightGap: 150, sunX: 720, sunY: 340 });
    f.layer('L3', (c, env) => {
      desksAbove(f, c, env);
      clockworkX(c, env, { x: 820, y: 664, r: 196, silhouette: true, esc: t * 1.4, crank: t * 0.08, steps: 40 + t * 3, lit: 0.25, frame: true, pawl: true });
    });
    f.fog({ yCenter: 640, height: 220, alpha: 0.16, drift: 6 });
    f.practical({ x: 720, y: 108, kind: 'lamp', seed: 57, intensity: 0.45, radius: 130, layer: 'L3' });

    f.layer('L4', (c, env) => {
      drawLine(c, env, {});
      timestampMarks(c, env, t, b);
      drawRule(c, env, {});
      drawTags(c, env, tags, { tq });
      if (tied) knotCard7(c, env, seg(t, b.inkB - 0.1, b.inkB + 0.4));
      if (flip > 0.5 && marks > 0) eventMarks(c, env, flip, swing * Math.sin(tq * 1.7), marks);
      dropGlow(c, env, t, b, tags);
      if (t >= b.date) dateTag(c, env, t, b);
      tokens(c, env, t, b);
      if (tiePose) {
        hands.draw(c, tiePose, env, {
          heldDraw: (cc, at, held, e) => {
            if (held !== 'tag' || tied) return;
            drawTag(cc, e, { id: '7', ink: 0, knotIn: 0, swing: 0.05, phase: tq * 2 }, { at: { x: at.x, y: at.y - 4 }, knotAt: { x: at.x, y: at.y - 4 } });
          },
        });
      }
      if (flipU > 0 && flipU < 0.92) hands.draw(c, hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
      if (unflipU > 0 && unflipU < 0.92) hands.draw(c, hands.act('flip', unflipU, FLIP_AT, { scale: HS, entry: { R: E.R } }), env);
      if (pp) hands.draw(c, pp, env);
      if (t > b.ins0 && t < b.stroke + 1.0) insertPencil(c, env, tq, b, tagStrike(T7), cam);
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 708, post: 1520, postL: -260 });
  },
});

function entries(cam: Camera3) {
  const at = (sx: number, sy: number) => toLayer(LAYERS.L4, cam, sx, sy);
  return { R: at(-140, 780), pencil: at(1150, 900) };
}

/** the two paper desks of ch06-s05 seen from below, soft in the haze over the line (L3) */
function desksAbove(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/desks/${env.mood.id}`, 1500, 360, (cc) => {
    cc.translate(110, 40);
    for (const x0 of [60, 700]) {
      cc.fillStyle = env.fill('ink');
      cc.fillRect(x0 - 10, 70, 520, 230);
      cc.fillStyle = withAlpha(mixLab(mixLab('#e8dcc4', env.mood.halo, 0.4), env.mood.haze, 0.45), 0.55);
      cc.fillRect(x0, 80, 500, 200);
      // the desk's dock row and a window, faint
      cc.fillStyle = withAlpha(env.mood.set, 0.35);
      cc.fillRect(x0 + 200, 250, 80, 12);
      cc.fillRect(x0 + 150, 130, 130, 80);
      // a hanging lamp shade above each
      cc.fillStyle = env.fill('ink');
      cc.fillRect(x0 + 248, -40, 3, 70);
      cc.beginPath();
      cc.moveTo(x0 + 220, 50);
      cc.lineTo(x0 + 280, 50);
      cc.lineTo(x0 + 262, 30);
      cc.lineTo(x0 + 238, 30);
      cc.closePath();
      cc.fill();
    }
    // the long table under both
    cc.fillStyle = env.fill('ink');
    cc.fillRect(0, 300, 1500, 24);
  })(c, -110, -40);
}

/** tag 7's knot card, HandwiredOS's own design: threaded through the string and lying to its RIGHT (clear of tag 6's) */
function knotCard7(c: C2, env: PaintEnv, u: number) {
  if (u <= 0.01) return;
  const label = "HandwiredOS's own design";
  textRole(c, 'texture', () => {
    const fs = 6.8;
    c.save();
    c.globalAlpha *= u;
    c.font = `600 ${fs}px ${FONT.sc}`;
    const tw = c.measureText(label).width;
    const cw = tw + 8, ch = fs + 6;
    const kx = AN.eye.x + 3 + (1 - u) * 10;
    const ky = AN.knot.y + 9;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
    c.fillRect(kx + 1.5, ky + 2, cw, ch);
    c.fillStyle = mixLab('#efe6d2', env.mood.halo, 0.2);
    c.fillRect(kx, ky, cw, ch);
    c.strokeStyle = withAlpha('#2a1d14', 0.35);
    c.lineWidth = 0.6;
    c.strokeRect(kx, ky, cw, ch);
    c.fillStyle = mixLab('#2a1d14', env.mood.ink, 0.2);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(label, kx + 4, ky + ch * 0.55);
    c.restore();
  });
}

/** tag 7's back: the pencil's drawing, no words: a time axis with little event marks, each on its own tick */
function eventMarks(c: C2, env: PaintEnv, flip: number, swing: number, u: number) {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const w = TAG.w, h = TAG.h;
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  c.strokeStyle = pencilRed(env, 0.95);
  c.fillStyle = pencilRed(env, 0.95);
  c.lineCap = 'round';
  c.lineWidth = 1.5;
  const x0 = -w * 0.36, x1 = w * 0.36, ay = h * 0.66;
  const xe = x0 + (x1 - x0) * clamp01(u * 1.08);
  c.beginPath();
  c.moveTo(x0, ay);
  c.lineTo(xe, ay);
  c.stroke();
  // six events at uneven times: a short tick on the axis and a little ring above it
  const ev = [0.06, 0.22, 0.31, 0.52, 0.7, 0.86];
  c.lineWidth = 1.2;
  ev.forEach((k, i) => {
    const x = x0 + (x1 - x0) * k;
    if (x > xe) return;
    c.beginPath();
    c.moveTo(x, ay + 3.5);
    c.lineTo(x, ay - 6 - (i % 2) * 2.5);
    c.stroke();
    c.beginPath();
    c.arc(x, ay - 10 - (i % 2) * 2.5, 2.2, 0, Math.PI * 2);
    c.stroke();
  });
  // the frame's own tick at the far end, taller
  if (xe >= x1 - 0.5) {
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x1, ay + 5);
    c.lineTo(x1, ay - 18);
    c.stroke();
  }
  c.restore();
}

/** the insert's pencil: point, lacquer and two fingertips from frame right; one firm stroke through the front */
function insertPencil(c: C2, env: PaintEnv, tq: number, b: Beats, sk: ReturnType<typeof tagStrike>, cam: Camera3) {
  const dir = { x: Math.cos(sk.angle), y: Math.sin(sk.angle) };
  const start = { x: sk.centre.x - (dir.x * sk.w) / 2, y: sk.centre.y - (dir.y * sk.w) / 2 };
  const end = { x: sk.centre.x + (dir.x * sk.w) / 2, y: sk.centre.y + (dir.y * sk.w) / 2 };
  const away = toLayer(LAYERS.L4, cam, 1420, 640);
  let tip: { x: number; y: number };
  if (tq < b.stroke) {
    const u = seg(tq, b.ins0, b.stroke - 0.02);
    tip = { x: away.x + (start.x - away.x) * u, y: away.y + (start.y - away.y) * u };
  } else if (tq < b.stroke + 0.32) {
    const u = (tq - b.stroke) / 0.32;
    tip = { x: start.x + (end.x - start.x) * u, y: start.y + (end.y - start.y) * u };
  } else {
    const u = seg(tq, b.stroke + 0.36, b.stroke + 0.8);
    if (u >= 1) return;
    tip = { x: end.x + (away.x - end.x) * u, y: end.y - 4 * Math.sin(Math.PI * Math.min(1, u * 2)) + (away.y - end.y) * u };
  }
  const ang = Math.PI + 0.42;
  const len = 150;
  drawPencil(c, tip, ang, len, env);
  const back = { x: -Math.cos(ang), y: -Math.sin(ang) };
  const grip = { x: tip.x + back.x * len * 0.62, y: tip.y + back.y * len * 0.62 };
  c.save();
  c.translate(grip.x, grip.y);
  c.rotate(Math.atan2(back.y, back.x));
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(4, -6.2, 11, 4.4, -0.12, 0, Math.PI * 2);
  c.ellipse(9, 6.4, 12, 4.6, 0.1, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.6);
  c.lineWidth = 0.5;
  c.beginPath();
  c.ellipse(4, -6.2, 11, 4.4, -0.12, Math.PI * 1.1, Math.PI * 1.7);
  c.stroke();
  c.restore();
}

/**
 * review r1: for ~1 s after the thread reaches the rule, brighten tag 7's drop thread and its plain cut end
 * (glow 0.35 -> 0.6) so its position on the rule, about three months, registers
 */
function dropGlow(c: C2, env: PaintEnv, t: number, b: Beats, tags: TagState[]) {
  const g = 0.6 * seg(t, b.drop1 - 0.25, b.drop1) * (1 - seg(t, b.drop1 + 0.9, b.drop1 + 1.5)) + 0.35 * seg(t, b.drop1 + 0.9, b.drop1 + 1.5);
  if (g <= 0.01 || t < b.drop0) return;
  // the thread's lane on the rule's face, counted as drawTags counts it
  let lane = 0;
  for (const st of tags) {
    if (st.id === '7') break;
    const d = TAGS[st.id];
    if (d.slack || d.kind === 'question' || d.kind === 'card' || !d.strands || st.drop === undefined) continue;
    lane += d.strands.length;
  }
  const bot = { x: AN.eye.x, y: AN.eye.y + TAG.h };
  const ry = RULE.y + 5 + lane * 2.6;
  const yEnd = bot.y + (ry - bot.y) * clamp01((t - b.drop0) / Math.max(1e-3, b.drop1 - b.drop0));
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.3), 0.5 * g);
  c.lineWidth = Math.max(lw(c, 2.6), 1.6);
  c.beginPath();
  c.moveTo(bot.x, bot.y + 4);
  c.lineTo(bot.x, yEnd - (t >= b.drop1 ? 10 : 0));
  if (t >= b.drop1) c.quadraticCurveTo(bot.x, ry, bot.x + 10, ry), c.lineTo(LIFE_X, ry);
  c.stroke();
  if (t >= b.drop1 - 0.05) {
    const r = 20;
    const gr = c.createRadialGradient(LIFE_X, ry, 0, LIFE_X, ry, r);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.8 * g));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(LIFE_X - r, ry - r, 2 * r, 2 * r);
  }
  c.restore();
  // the plain cut end itself, re-inked dark over the glow so it stays a cut (not an open tip)
  if (t >= b.drop1) {
    c.save();
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9);
    c.lineWidth = Math.max(lw(c, 2.4), 1.4);
    c.beginPath();
    c.moveTo(LIFE_X - 4.5, ry - 1.2);
    c.lineTo(LIFE_X + 4.5, ry + 1.2);
    c.stroke();
    c.restore();
  }
}

/** the small date tag tied to the thread's plain cut end on the rule: UNTIL 15 SEPT 2026 (paper and ink together) */
function dateTag(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.date, b.date + 0.3);
  if (a <= 0.01) return;
  const end = { x: LIFE_X, y: RULE.y + 5 };
  const text = 'UNTIL 15 SEPT 2026';
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 9px ${FONT.mono}`, 9, text);
    c.font = `600 ${size}px ${FONT.mono}`;
    const tw = c.measureText(text).width;
    const w = tw + size * 1.6, h = size * 1.9;
    const x = end.x + 26, y = end.y - 30 - h;
    // its string from the cut end
    c.globalAlpha = a;
    c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85);
    c.lineWidth = Math.max(lw(c, 1.2), 0.8);
    c.beginPath();
    c.moveTo(end.x, end.y);
    c.quadraticCurveTo(end.x + 8, end.y - 22, x + size * 0.6, y + h * 0.5);
    c.stroke();
    // the tag: a notched manila slip with an eyelet at its left end
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(x + 2, y + 3, w, h);
    c.fillStyle = mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.core, 0.12);
    c.beginPath();
    c.moveTo(x + h * 0.4, y);
    c.lineTo(x + w, y);
    c.lineTo(x + w, y + h);
    c.lineTo(x + h * 0.4, y + h);
    c.lineTo(x, y + h * 0.5);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.8);
    c.beginPath();
    c.arc(x + size * 0.6, y + h * 0.5, size * 0.16, 0, Math.PI * 2);
    c.fill();
    cardProbe(c, `${ID}-date-card`, x, y, w, h, a, a);
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(text, x + size * 1.15, y + h * 0.53);
    textProbe(c, `${ID}-date`, x + size * 1.15, y + h * 0.5 - size * 0.5, tw, size, a);
  });
  c.restore();
}

/** the sixteen timestamp marks hanging on the line (each event's own time) and the frame's taller mark */
function timestampMarks(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.run0 - 0.6, b.run0);
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = a;
  c.lineCap = 'round';
  // review r1: sixteen short DARK ticks hanging under the line (each event's own time), clear of the token above
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.88);
  MARKS.forEach((x) => {
    const y = lineYAt(x);
    c.lineWidth = Math.max(lw(c, 2.2), 1.6);
    c.beginPath();
    c.moveTo(x, y + TOK_R + 2.5);
    c.lineTo(x, y + TOK_R + 13);
    c.stroke();
  });
  c.strokeStyle = withAlpha(brassOf(env, 0.35), 0.9);
  // the frame's mark: a taller brass post with a cap
  const fx = SPAN.x1, fy = lineYAt(fx);
  c.lineWidth = lw(c, 2.6);
  c.beginPath();
  c.moveTo(fx, fy - FRAME_TOK.h / 2 - 8);
  c.lineTo(fx, fy + FRAME_TOK.h / 2 + 14);
  c.stroke();
  c.fillStyle = brassOf(env, 0.4);
  c.beginPath();
  c.arc(fx, fy - FRAME_TOK.h / 2 - 9, 3.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/**
 * seventeen tokens in a close row run along the wire from the left; each event token peels off at its own timestamp
 * mark as the row passes (the earliest first), and the frame token, at the head, stops last on the frame's mark
 */
function tokens(c: C2, env: PaintEnv, t: number, b: Beats) {
  if (t < b.run0) return;
  // the head's x: a quick run in, then an even crawl while the tokens drop off one per click
  const headCatch0 = MARKS[0] + N_EV * PITCH;
  const X0 = 360;
  const X = t < b.catch0 ? X0 + (headCatch0 - X0) * (1 - Math.pow(1 - clamp01((t - b.run0) / (b.catch0 - b.run0)), 1.6)) : headCatch0 + (SPAN.x1 - headCatch0) * clamp01((t - b.catch0) / (b.catch1 - b.catch0));
  const paper = mixLab(cardPaper(env), env.mood.core, 0.1);
  c.save();
  for (let k = 0; k <= N_EV; k++) {
    const isFrame = k === N_EV;
    const final = isFrame ? SPAN.x1 : MARKS[k];
    const x = Math.min(final, X - (N_EV - k) * PITCH);
    const landed = x >= final - 0.01;
    const y = lineYAt(x);
    // the click: a short warm flare as it lands
    const landT = isFrame ? b.catch1 : b.catch0 + ((final + (N_EV - k) * PITCH - headCatch0) / (SPAN.x1 - headCatch0)) * (b.catch1 - b.catch0);
    const fl = landed ? Math.exp(-Math.max(0, t - landT) * 6) : 0;
    if (isFrame) {
      // the frame token: a larger square with a WARM rim (review r1), so 'sixteen events + one frame' reads
      const { w, h } = FRAME_TOK;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.fillRect(x - w / 2 + 2, y - h / 2 + 2.5, w, h);
      c.fillStyle = mixLab(paper, env.mood.core, 0.25 + 0.3 * fl);
      c.fillRect(x - w / 2, y - h / 2, w, h);
      c.strokeStyle = withAlpha(mixLab(copperOf(env, 0.9), env.mood.core, 0.25 + 0.4 * fl), 1);
      c.lineWidth = Math.max(lw(c, 2.6), 1.8);
      c.strokeRect(x - w / 2, y - h / 2, w, h);
      c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
      c.lineWidth = Math.max(lw(c, 1), 0.7);
      c.strokeRect(x - w / 2 + 3.5, y - h / 2 + 3.5, w - 7, h - 7);
    } else {
      c.fillStyle = withAlpha(shadowCol, 0.38);
      c.beginPath();
      c.arc(x + 1.6, y + 2, TOK_R, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = mixLab(paper, env.mood.core, 0.35 * fl);
      c.beginPath();
      c.arc(x, y, TOK_R, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.6);
      c.lineWidth = Math.max(lw(c, 1.1), 0.7);
      c.stroke();
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.75);
      c.beginPath();
      c.arc(x, y, 1.6, 0, Math.PI * 2);
      c.fill();
    }
    if (fl > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(x, y, 0, x, y, 22);
      g.addColorStop(0, withAlpha(env.mood.core, 0.45 * fl));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x - 22, y - 22, 44, 44);
      c.restore();
    }
  }
  c.restore();
}
