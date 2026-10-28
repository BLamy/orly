/**
 * ch12-s02 — THE RE-HANG BY DEPENDENCY DEPTH (scene, dawnGold; cut from ch12-s01's wide; 13.0 s).
 *   L1202 "Now re-hang them the way the loom does: each belief one layer after those it needs."
 *   L1203 "The film's teaching order, not history."
 *
 * The compiler's layering rule (Q039, CM01: "Independent instructions at the same dependency depth share a layer"),
 * applied to the film's teaching order. The layout is COMPUTED (sets/ch12-s01-valley FRAME_OF / DEPS / STACKS, the
 * outline's finaleDepthMap), never placed by eye: six copper warps drop from the washing line; the narrator's hands
 * lift tags 1 and 4 (they need nothing) onto frame 0; then the rest cascade on their own, one frame per beat, each tag
 * leaving the line and dropping onto its warp, and faint copper threads draw back from each frame to the tags it needs
 * (every thread left to right, none backward; a thread that skips a frame is routed between the rows, never behind an
 * unrelated tag: sets/ch12-s01-valley depVia). As each tag leaves the line its lifespan thread lets go; the tip stays
 * on the Lifespan Rule, and once the line is empty the tips and the rule sink (glow .25, rule at 60 % value). On 'history' the warps and the dependency threads tension together: the washing line has
 * become a loom, its frames the six columns. The camera pulls back slowly until all six frames fit.
 *
 * TEACHES, word by word:
 *   lift (1.14)    're-hang': the hands lift tag 1, then tag 4, off the line and hang them on frame 0; they withdraw
 *   rule (2.27)    'loom': the docs' fragment sets in at the top of frame; frame 1 drops (2, 5, 8, why)
 *   'after' (4.47) frame 2 drops (3, 6)      deep (5.70) 'needs': frame 3 drops (7, 10)
 *   order (7.25)   'teaching': frame 4 drops (9, 11); on 'order' frame 5's empty hook appears (flat, then up)
 *   loom (9.01)    after 'history': warps and dependency threads tension into a loom; the pull back settles wide
 */
import { Timeline } from '../../../core';
import type { Camera3, Palette } from '../../../film';
import { FONT, defineShot, drawTracked, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import {
  DEPS,
  FRAME_OF,
  HOOK,
  SLOT12,
  STRANDS,
  bisonLoop,
  camK,
  clamp01,
  depThread,
  depVia,
  drawHook,
  hookPoints,
  drawLine12,
  drawRule12,
  drawWarp,
  eyeOf,
  lerp,
  lifeX12,
  lineY12,
  loomKnot,
  nanoUnder,
  pencilBeside,
  shadeRule12,
  sideOf,
  slackLoop,
  sm,
  spline,
  states12,
  tag12,
  tagH,
  thread12,
  tip12,
  twos,
  valleyBack,
  valleyNear,
  whyFace,
  win,
  type Key,
  type Pt,
} from '../sets/ch12-s01-valley';
import { TAGS, type TagId, type TagState } from '../sets/tagLine';
import timeline from '../timeline.json';

const ID = 'ch12-s02';
const SHOT = (timeline as { shots: { id: string; start: number; end: number }[] }).shots.find((s) => s.id === ID)!;
const D = SHOT.end - SHOT.start;

// ---------------------------------------------------------------- the camera
// close on the left of the line for the hands, then one slow pull back (from the first cascade) to the whole loom
const KX: Key[] = [[0, 70], [2.3, 110], [9.8, 640], [D, 652]];
const KY: Key[] = [[0, 560], [2.3, 574], [9.8, 668], [D, 670]];
const KK: Key[] = [[0, 1.25], [2.3, 1.22], [9.8, 0.9], [D, 0.885]];
const KZ: Key[] = [[0, 150], [2.3, 140], [9.8, -110], [D, -125]];
const camAt = (t: number): Camera3 => camK(spline(KX, t), spline(KY, t), spline(KK, t), spline(KZ, t));
const CAMS: Camera3[] = Array.from({ length: 40 }, (_, i) => camAt((i / 39) * D));

const STATES = states12();
/** the empty hook's size; its dependency threads arrive at the start of its flat run */
const HOOK_S = 1.5;
const hookIn = (): Pt => hookPoints(HOOK.x, HOOK.y, HOOK_S)[2];
const ST = new Map<TagId, TagState>(STATES.map((s) => [s.id, s]));
/** the quote fragment (Q039, verbatim tail) and its attribution */
const Q_TEXT = '“…same dependency depth share a layer.”';
const Q_BY = '— the docs';

interface Beats {
  lift: number;
  rule: number;
  after: number;
  deep: number;
  order: number;
  orderWord: number;
  loom: number;
}
interface Move {
  /** when the tag leaves the line, when it lands on its warp */
  t0: number;
  t1: number;
  /** carried by a hand (frame 0) */
  hand?: 'R' | 'L';
}

/** the line eyelet (washing line) and the loom eyelet of a tag */
const lineEye = (id: TagId): Pt => {
  const x = SLOT12[id];
  return { x, y: lineY12(x) + 24 * (ST.get(id)?.scale ?? 1) };
};
const loomEye = (id: TagId): Pt => eyeOf(id, loomKnot(id));

/** hand lifts (frame 0): u spans [start, start + LIFT_DUR]; the rig picks up at u .36 and lets go at .62 */
const LIFT_DUR = 1.5;
const LIFTS: { id: TagId; start: number; hand: 'R' | 'L' }[] = [
  { id: '1', start: 0.68, hand: 'R' },
  { id: '4', start: 0.92, hand: 'L' },
];

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      lift: T.beat('lift'),
      rule: T.beat('rule'),
      after: T.word('L1202', 'after'),
      deep: T.beat('deep'),
      order: T.beat('order'),
      orderWord: T.word('L1203', 'order'),
      loom: T.beat('loom'),
    };
    // one drop per frame, on the words: frame 1 'loom', 2 'after', 3 'needs', 4 'teaching'
    const dropAt = [0, b.rule + 0.02, b.after - 0.05, b.deep - 0.05, b.order - 0.05];
    const moves = new Map<TagId, Move>();
    for (const L of LIFTS) moves.set(L.id, { t0: L.start + 0.36 * LIFT_DUR, t1: L.start + 0.62 * LIFT_DUR, hand: L.hand });
    for (const st of STATES) {
      const col = FRAME_OF[st.id];
      if (col === undefined || col === 0) continue;
      const peers = STATES.filter((s) => FRAME_OF[s.id] === col).map((s) => s.id);
      const k = peers.indexOf(st.id);
      const a = lineEye(st.id), z = loomEye(st.id);
      const dist = Math.hypot(z.x - a.x, z.y - a.y);
      const t0 = dropAt[col] + k * 0.1;
      moves.set(st.id, { t0, t1: t0 + 0.7 + dist / 2600 });
    }
    // when each frame has landed (its last tag down), and when the hook appears
    const landed = [0, 1, 2, 3, 4].map((col) => Math.max(...[...moves.entries()].filter(([id]) => FRAME_OF[id] === col).map(([, m]) => m.t1)));
    const hookAt = b.orderWord - 0.1;
    return { tl, b, moves, landed, hookAt };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const moves = sc.moves as Map<TagId, Move>;
    const landed = sc.landed as number[];
    const hookAt = sc.hookAt as number;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t);
    f.camera(cam);

    valleyBack(f, { key: ID, cams: CAMS, sunX: 700, dawn: 1 });

    // the tension on 'history' (after the last word): 1 = slack, 0 = taut, with one small overshoot
    const tu = clamp01((t - b.loom + 0.15) / 0.9);
    const slack = t < b.loom - 0.15 ? 1 : (1 - sm(tu)) - 0.18 * Math.sin(Math.PI * tu) * (1 - tu);
    const creak = win(t, b.loom - 0.1, b.loom + 0.25) * (1 - win(t, b.loom + 0.6, b.loom + 2.2));
    const warpsIn = (col: number) => win(t, 0.45 + col * 0.07, 1.05 + col * 0.07);

    // the hands' poses (twos), and where each carried tag is
    const entry = hands.entry(cam, 'L4');
    const poses = LIFTS.map((L) => {
      const u = clamp01((tq - L.start) / LIFT_DUR);
      const from = lineEye(L.id), to = loomEye(L.id);
      const pose = hands.act('lift', u, from, { held: 'none', dropAt: to, entry: { R: L.hand === 'R' ? entry.R : entry.L }, scale: 1.08 });
      return { L, u, pose, sock: hands.socket(pose) };
    });

    /** a tag's eyelet and knot at time tq (on the line, carried, in flight, or on its warp) */
    const placeOf = (id: TagId): { eye: Pt; knot: Pt; moving: number } => {
      const m = moves.get(id);
      const a = lineEye(id);
      if (!m || tq < m.t0) return { eye: a, knot: { x: a.x, y: lineY12(a.x) }, moving: 0 };
      const z = loomEye(id);
      const zk = loomKnot(id);
      if (tq >= m.t1) return { eye: z, knot: zk, moving: 0 };
      if (m.hand) {
        const p = poses.find((q) => q.L.id === id)!;
        const s = p.sock ?? a;
        return { eye: s, knot: { x: s.x - 2, y: s.y - 12 }, moving: 1 };
      }
      // in flight: lifts off the line, arcs over, drops onto its warp (on twos)
      const u = sm((tq - m.t0) / (m.t1 - m.t0));
      const arc = Math.sin(Math.PI * u) * (60 + Math.abs(z.x - a.x) * 0.08);
      const eye = { x: lerp(a.x, z.x, u), y: lerp(a.y, z.y, u) - arc };
      return { eye, knot: { x: eye.x, y: eye.y - 24 * (ST.get(id)?.scale ?? 1) }, moving: 1 };
    };

    // once the tags have left the line (their strands let go), the tips' glow and the rule sink behind the loom's
    // foot, so the cascade stays the brightest thing in frame
    const sink = win(t, landed[1], landed[4] + 0.4);
    f.layer('L4', (c, env) => {
      drawLine12(c, env, 0.55 + 0.35 * creak);
      drawRule12(c, env, 0);
      shadeRule12(c, env, 0.4 * sink);
      // the six warps drop from the line, slack until the loom tensions
      for (let col = 0; col < 6; col++) drawWarp(c, env, col, { u: warpsIn(col), slack, glow: 0.25 * creak, tq });
      // frame 5's empty hook, in the hinge profile (flat, then up)
      const hookA = win(t, hookAt, hookAt + 0.35);
      drawHook(c, env, HOOK.x, HOOK.y + 4 * Math.sin(Math.max(0, tq - hookAt) * 5) * Math.exp(-Math.max(0, t - hookAt) * 2.5), 0.22 + 0.25 * creak, HOOK_S, hookA);
      // dependency threads draw back from each frame as it lands, all together, left to right
      for (const [a, z] of DEPS) {
        const colZ = z === 'hook' ? 5 : FRAME_OF[z]!;
        const land = z === 'hook' ? hookAt + 0.25 : landed[colZ];
        const u = win(t, land + 0.12, land + 0.85);
        if (u <= 0) continue;
        const pa = sideOf(a, loomEye(a), 'R');
        const pz = z === 'hook' ? hookIn() : sideOf(z, loomEye(z), 'L');
        // a skip thread (more than one frame) is routed between the rows, never behind an unrelated tag
        depThread(c, env, pa, pz, { u, sag: slack, alpha: 1, lit: 0.35 * creak, via: depVia(a, z) });
      }
      // lifespan threads let go as their tag leaves the line; the tips stay on the rule
      for (const s of STRANDS) {
        const m = moves.get(s.id);
        const go = m ? win(t, m.t0 - 0.05, m.t0 + 0.35) : 0;
        if (go < 1) {
          const eye = lineEye(s.id);
          thread12(c, env, { x: eye.x + s.dx, y: eye.y + tagH(s.id) }, lifeX12(s.days), s.lane, 1, 1 - go);
        }
        tip12(c, env, lifeX12(s.days), s.lane, s.tip, { glow: 0.6 - 0.35 * sink, s: 1.35 });
      }
      // the tags: those on the line or the warps first, the flying / carried ones on top
      const order = [...STATES].filter((s) => s.id !== 'nano').sort((p, q) => placeOf(p.id).moving - placeOf(q.id).moving);
      for (const st of order) {
        const { eye, knot, moving } = placeOf(st.id);
        const bottom = { x: eye.x, y: eye.y + tagH(st.id) };
        if (!moving) {
          if (TAGS[st.id].slack) slackLoop(c, env, bottom, st.scale ?? 1);
          if (st.id === '11') bisonLoop(c, env, { x: eye.x + 2, y: bottom.y }, tq);
        }
        tag12(c, env, moving ? { ...st, swing: 0.06, phase: 1.3 } : st, eye, knot, tq);
        if (st.id === '10') {
          const nano = ST.get('nano');
          if (nano) nanoUnder(c, env, nano, eye, tq);
        }
        if (st.pencilRest && !moving) pencilBeside(c, env, eye, st.id);
        // the why tag's face carries the stranger's faint pencil '?' (never a blank tag: that one is ch12-s06's)
        if (st.id === 'why') whyFace(c, env, moving ? { ...st, swing: 0.06, phase: 1.3 } : st, eye, tq);
      }
      // the hands (they touch the line and the warp: drawn on the action plane)
      for (const p of poses) if (p.u > 0 && p.u < 1) hands.draw(c, p.pose, env);
    });
    f.rim({ x: 0, y: -1 });
    valleyNear(f, ID, win(t, 6, 9.5));

    // ---- the docs' fragment (Q039) at the top of frame, from 'loom' to the end
    const qa = win(t, b.rule - 0.05, b.rule + 0.45);
    if (qa > 0) quoteTop(f.c, f.mood, qa);
  },
});

/** the short verbatim fragment, centred at the top of frame on a soft ink plate, the attribution after it */
function quoteTop(c: CanvasRenderingContext2D, m: Palette, a: number) {
  c.save();
  const base = `italic 400 27px ${FONT.text}`;
  const size = legibleSize(c, base, 27, Q_TEXT);
  const font = `italic 400 ${size.toFixed(1)}px ${FONT.text}`;
  c.font = font;
  const qw = c.measureText(Q_TEXT).width;
  const bySize = legibleSize(c, `500 19px ${FONT.sc}`, 19, Q_BY);
  c.font = `500 ${bySize.toFixed(1)}px ${FONT.sc}`;
  const bw = c.measureText(Q_BY).width + Q_BY.length * bySize * 0.12;
  const gap = 18;
  const total = qw + gap + bw;
  const x0 = 640 - total / 2;
  const y = 62;
  c.globalAlpha = a;
  softPlate(c, 640, y - size * 0.32, total + 260, size + 64, m.ink, 0.5);
  textRole(c, 'subject', () => {
    c.font = font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
    c.fillText(Q_TEXT, x0, y);
    c.fillStyle = withAlpha(m.core, 0.9);
    drawTracked(c, Q_BY, x0 + qw + gap, y, { font: `500 ${bySize.toFixed(1)}px ${FONT.sc}`, size: bySize, tracking: 0.12, align: 'left' });
  });
  textProbe(c, 'ch12-s02-q039', x0, y - size, total, size * 1.3, a);
  c.restore();
}
