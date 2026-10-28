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
 * Review r1: the opening starts close on the desk's wallpaper (its arcs fill the frame, as ch01-s04 ends) and pulls
 * back; the hand moves from tag 4 to tag 5 below the row (under tag 4's front) before rising to the knot; the line sits
 * at ~57 % in the wides; the why tie is an insert (z 560 on the far-right slot, the hand from that framing's lower-left
 * corner, in frame by 'blank' + 0.2 s), then the camera eases back out on 'way' to end on the four tags. The L6 near
 * post is not painted in this shot: it stands just past the why slot, so the push to that slot would sweep it across
 * the lens (it is off frame in every framing here).
 * Text discipline: the three tag fronts are the only reading items (each inks on its own beat while spoken); the
 * knot card is a name card; the suspect stamps are prop marks.
 */
import { Timeline, ease } from '../../../core';
import { FONT, PUPPET_NEAR_BLACK, cam3Interp, defineShot, legibleSize, mixLab, textRole, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { hands } from '../cast';
import type { HandsPose, Pt } from '../sets/narratorHands';
import { HAND_LEN } from '../sets/narratorHands';
import { SLOT_X, TAG, drawTag, lineYAt, tagLineScene, type TagId, type TagState } from '../sets/tagLine';
import { OS_COLORS, drawWallpaperBanded } from '../sets/circuit';

/** close on the bench desk's wallpaper (L3 desk at (470, 400) w 300): its arcs fill the frame, as ch01-s04 ends */
const C0: Camera3 = { x: 614, y: 534, z: 900, lens: 1 };
const C1: Camera3 = { x: 492, y: 466, z: 600, lens: 1 };
const C1b: Camera3 = { x: 494, y: 466, z: 625, lens: 1 };
/** the wide: the line at ~57 % of frame height (ch01 canonical 58 %) */
const C2: Camera3 = { x: 640, y: 372, z: 90, lens: 1 };
/** the why tie: an insert on the far-right slot (SLOT_X.why - 120), at the first ties' scale; line at ~57 % */
const C3: Camera3 = { x: SLOT_X.why - 120, y: 401, z: 560, lens: 1 };
/** 'way': back out to the row of four tags (3, 4, 5 and the blank why tag), line at ~57 % */
const C4: Camera3 = { x: 760, y: 386, z: 330, lens: 1 };
/** the bench desk's rect in the workshop (sets/tagLine: handwiredDesk at (470, 400), w 300, 16:10) */
const BENCH_DESK = { x: 470, y: 400, w: 300, h: 187.5 };
const HS = 0.7; // hand scale (an insert on the line)
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
  /** the hand drops below the row of tags between ties, so the fronts read while they ink */
  const under = (id: TagId): Pt => ({ x: SLOT_X[id] - 18, y: lineYAt(SLOT_X[id]) + TAG.string + TAG.h + 46 });
  const glide = (t: number, t0: number, t1: number, a: Pt, b: Pt, shape: 'open' | 'rest' | 'pinch', bow = 0): HandsPose => {
    const u = smooth((t - t0) / (t1 - t0));
    const at = lerpP(a, b, u);
    at.x -= Math.sin(u * Math.PI) * LEN * bow;
    return { right: hands.reach(entryR, at, shape, LEN, { sleeve: 'linen', bend: -0.1 }), scale: HS };
  };
  const c3 = sc.click['3'], c4 = sc.click['4'], c5 = sc.click['5'], cw = sc.click.why;
  const approach0 = tieStart(c3) - 0.85;
  if (tq < approach0) return null;
  // first visit: tags 3, 4, 5
  if (tq < tieStart(c3)) return act((0.3 * (tq - approach0)) / 0.85, '3');
  if (tq < tieStart(c3) + TIE) return act(tieU(tq, c3), '3');
  if (tq < tieStart(c4)) return moveBetween(tq, tieStart(c3) + TIE, tieStart(c4), '3', '4');
  if (tq < tieStart(c4) + TIE) return act(tieU(tq, c4), '4');
  // down below the row while tag 4's front inks, then up to tag 5's knot
  const e4 = tieStart(c4) + TIE;
  const leave4 = tieStart(c5) - 0.5;
  if (tq < e4 + 0.4) return glide(tq, e4, e4 + 0.4, sock(act(0.6, '4')), under('4'), 'rest', 0.1);
  if (tq < leave4) {
    const p = under('4');
    return { right: hands.reach(entryR, { x: p.x, y: p.y + Math.sin((tq - e4) * 2.1) * 1.5 }, 'rest', LEN, { sleeve: 'linen', bend: -0.1 }), scale: HS };
  }
  // to tag 5 BELOW the row (under tag 4's front, not across it), then straight up into the knot
  const mid5 = leave4 + 0.6 * (tieStart(c5) - leave4);
  if (tq < mid5) return glide(tq, leave4, mid5, under('4'), under('5'), 'rest', 0);
  if (tq < tieStart(c5)) return glide(tq, mid5, tieStart(c5), under('5'), sock(act(0.3, '5')), tq < tieStart(c5) - 0.1 ? 'open' : 'pinch', 0);
  if (tq < tieStart(c5) + TIE) return act(tieU(tq, c5), '5');
  // down below the row again while tag 5 inks; at 'hang' the hands withdraw lower left
  const e5 = tieStart(c5) + TIE;
  if (tq < e5 + 0.4) return glide(tq, e5, e5 + 0.4, sock(act(0.6, '5')), under('5'), 'rest', 0.1);
  if (tq < sc.hang) return { right: hands.reach(entryR, under('5'), 'rest', LEN, { sleeve: 'linen', bend: -0.1 }), scale: HS };
  if (tq < sc.hang + 0.9) {
    const u = smooth((tq - sc.hang) / 0.9);
    return { right: hands.reach(entryR, lerpP(under('5'), lerpP(under('5'), entryR, 0.85), u), 'rest', LEN, { sleeve: 'linen', bend: -0.1 }), scale: HS };
  }
  // second visit: the blank why tag
  // in frame by 'blank' + 0.2 s: the approach starts 0.75 s early and already a little way in from the corner
  const wIn = sc.whyIn - 0.75;
  const wStart = tieStart(cw);
  if (tq < wIn) return null;
  if (tq < wStart) return act(0.06 + (0.24 * (tq - wIn)) / (wStart - wIn), 'why', 'tag');
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

/** the opening: the desk's wallpaper fills the lens (as ch01-s04's arcs do) and sinks back into the desk as the camera
 *  pulls out, letting its windows through (the same real arcs, baked sharp for the close-up) */
const VEIL: LayerSpec = { id: 'ch01-s05-veil', z: 1300, haze: 0.25, blur: 0 };
function wallpaperVeil(f: Frame, t: number) {
  const ov = 1 - smooth((t - 0.15) / 1.5);
  if (ov <= 0.005) return;
  f.layer(VEIL, (c, env) => {
    const R = BENCH_DESK;
    const opts: { blur?: number; res?: number } = { res: 3.4 };
    const wall = f.cached(`ch01-s05/wallpaper/${env.mood.id}`, R.w, R.h, (cc) => {
      const paper = mixLab(mixLab(OS_COLORS.desk, env.mood.halo, 0.35), env.mood.haze, 0.25 * 0.6);
      const g = cc.createLinearGradient(0, 0, 0, R.h);
      g.addColorStop(0, mixLab(paper, env.mood.sky[0], 0.18));
      g.addColorStop(1, mixLab(paper, env.mood.set, 0.14));
      cc.fillStyle = g;
      cc.fillRect(0, 0, R.w, R.h);
      drawWallpaperBanded(cc, { x: R.w * 0.02, y: R.h * 0.07, w: R.w * 0.96, h: R.h * 0.895 }, env, {
        adds: mixLab(OS_COLORS.copper, env.mood.core, 0.2),
        alpha: 0.32,
        lineWidth: 0.32,
      });
    }, opts);
    c.save();
    c.globalAlpha = ov;
    wall(c, R.x, R.y);
    c.restore();
  });
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
    const whyIn = T.beat('whyIn');
    tl.tween(cam, C3, { at: slack + 0.35, dur: whyIn - 0.1 - (slack + 0.35), ease: ease.move });
    // back out once the hand has let go, through 'way', landing on the four tags before the ink-bleed out
    const backAt = T.beat('whyTie') + 0.45;
    tl.tween(cam, C4, { at: backAt, dur: T.duration - 0.6 - backAt, ease: ease.move });
    tl.hold(0, T.duration);
    const sc: Sc = {
      tagsIn: T.beat('tagsIn'),
      click: { '3': tag3, '4': T.beat('tag4'), '5': T.beat('tag5'), why: T.beat('whyTie') },
      ink: {
        // each front inks while its guess is said, starting as the knot pulls (the hand is then clear of it)
        '3': [T.word('L0106', 'trained') + 0.1, T.wordEnd('L0106', 'it') + 0.3],
        '4': [T.word('L0106', 'tool') + 0.15, T.wordEnd('L0106', 'code')],
        '5': [T.word('L0106', 'network') + 0.15, T.wordEnd('L0106', 'network') + 0.75],
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

    // the near post (L6) is left out of this shot (see the header); right after the room's L3 the opening's
    // wallpaper veil paints on a sharp plane at L3's depth (a blurred layer would put the cached veil UNDER the
    // desk's live windows)
    const fScene: Frame = Object.create(f);
    fScene.layer = (spec, draw) => {
      if (spec === 'L6') return;
      f.layer(spec, draw);
      if (spec === 'L3') wallpaperVeil(f, t);
    };
    tagLineScene(fScene, {
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
