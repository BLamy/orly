/**
 * ch07-s10 — THE REJECTED SHORTCUT (scene, duskRose; crossfade in; 10.88 s on the locked clock).
 *   L0719 "An early fix snapped the sketch to a grid, in ordinary code. Cheng turned it down: “the spirit of the
 *          gallery is to learn something.”"
 *
 * The light cools to dusk. A plain desk under an anglepoise lamp, an evening window behind; the gallery stage in
 * miniature stands on the desk beside a logo-less laptop, where Cheng's hands (cast author-hands, framed at the wrists,
 * seen from behind the keyboard) type. The miniature carries a hand-drawn version of the Story sketch: every edge a
 * hair off its line (an illustration, kept inside the penalty's reach), the photos fitted to it.
 *
 * TEACHES, word by word:
 *   fix (1.11)       a notched brass ruler slides in by itself along a paper groove under the stage, from frame right,
 *                    engraved 'snap to grid · ordinary code' (no hand holds it; the first answer's author is not shown)
 *   snapped (1.68)   it presses up against the sketch: guide lines flash from its notches and the ten cut-paper
 *                    rectangles (the sketch, not the photos) clack onto them, a perfect grid in one stroke
 *   Cheng (4.47)     his right hand lifts from the keys and rests flat on the ruler
 *   spirit (6.05)    the hand lifts away, the ruler slides back out along its groove, and the sketch loosens back to
 *                    where the hand drew it; his lamplit name card sets (attribution only: his words are spoken)
 *   slider (9.28)    a small paper slider, 'Misalignment penalty', rises beside the stage, set to 4 %; the photos drift
 *                    into line on their own, slowly (no code moves them: each line rests at the mean of where its
 *                    rectangles are drawn, as the gallery's README says; DG13). The camera eases in toward the slider.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  anglepoiseLamp,
  bookshelfWall,
  cam3Interp,
  defineShot,
  legibleSize,
  mixLab,
  nameCard,
  overscan,
  textProbe,
  textRole,
  withAlpha,
} from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
import {
  GAL,
  PHOTO_BAKE,
  brassOf,
  galleryBooth,
  photoArt,
  photoCard,
  px,
  seg,
  sketchFrame,
  stageRect,
  twos,
  type Booth,
  type GRect,
} from '../sets/ch07-s06-gallery';

type C2 = CanvasRenderingContext2D;
const ID = 'ch07-s10';

// ------------------------------------------------------------------ staging (L4 rest px)
const DESK_Y = 622;
const LAPTOP = { x: 336, y: DESK_Y, w: 300 };
const B10: Booth = { x: 614, y: 200, w: 380, ground: DESK_Y };
const GROOVE_Y = B10.y + B10.w * 0.8 + 2; // the screen's sill
const RULER = { len: 490, h: 24, restX: 540 };
const LAMP = { x: 96, y: DESK_Y, s: 4.6 };
const SLIDER = { x: 1062, y: 540, w: 128 };
const CAM_A: Camera3 = { x: 682, y: 398, z: 128, lens: 1 };
const CAM_B: Camera3 = { x: 800, y: 410, z: 226, lens: 1 };
const sine = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));

// ------------------------------------------------------------------ the hand-drawn sketch and where the photos settle
/** each edge of each rectangle a hair off its line (±0.01 of the stage: two edges of a line at most one reach apart at 4 %) */
const AMP = 0.01;
const DRAWN: GRect[] = GAL.targets.map((r, i) => {
  const l = r[0] + hash1(i, 11) * AMP, tp = r[1] + hash1(i, 13) * AMP * 1.25;
  const rr = r[0] + r[2] + hash1(i, 17) * AMP, bt = r[1] + r[3] + hash1(i, 19) * AMP * 1.25;
  return [l, tp, rr - l, bt - tp];
});
/** the photos after the penalty: every line of edges of one kind rests at the mean of where its rectangles are drawn */
const ALIGNED: GRect[] = (() => {
  const edges = (r: GRect) => [r[0], r[1], r[0] + r[2], r[1] + r[3]];
  const P = GAL.targets.map(edges);
  const D = DRAWN.map(edges);
  const out = D.map((e) => e.slice());
  for (let kind = 0; kind < 4; kind++) {
    const groups = new Map<string, number[]>();
    P.forEach((e, i) => {
      const key = e[kind].toFixed(4);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    for (const ids of groups.values()) {
      const m = ids.reduce((a, i) => a + D[i][kind], 0) / ids.length;
      for (const i of ids) out[i][kind] = m;
    }
  }
  return out.map((e) => [e[0], e[1], e[2] - e[0], e[3] - e[1]] as GRect);
})();
const lerpR = (a: GRect, b: GRect, u: number): GRect => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
/** the ruler's notches: the preset's column edges (the grid the snap forces) */
const NOTCH_X = Array.from(new Set(GAL.targets.flatMap((r) => [r[0], r[0] + r[2]]).map((v) => +v.toFixed(4)))).sort((a, b) => a - b);

interface Beats {
  ruler: number;
  snap: number;
  decline: number;
  card: number;
  slider: number;
  D: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = { ruler: T.beat('ruler'), snap: T.beat('snap'), decline: T.beat('decline'), card: T.beat('card'), slider: T.beat('slider'), D: T.duration };
    const cam = tl.channel<Camera3>('cam', CAM_A, cam3Interp);
    tl.tween(cam, CAM_B, { at: b.slider - 0.6, dur: T.duration - (b.slider - 0.6), ease: sine });
    tl.hold(0, T.duration);
    return { tl, cam, b };
  },
  paint(f, s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(s.get(sc.cam));
    f.backlight({ sunX: 300, sunY: 420, sunRadius: 260, intensity: 0.9 });
    room(f);
    // the lamp and the screen sit behind the hands: light them before the action plane
    f.layer('L4', (c, env) => {
      desk(f, c, env);
      anglepoiseLamp(c, { x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: 0.7, aim: 0.15, seed: 4 }, env);
      hands.deskHands(c, { ...LAPTOP, tq, author: 'off', agent: 'off', screen: 0.45 }, env);
      f.cached(`${ID}/booth/${env.mood.id}`, 620, 620, (cc) => {
        cc.translate(-(B10.x - 90), -(B10.y - 120));
        galleryBooth(cc, env, B10, 'back');
      })(c, B10.x - 90, B10.y - 120);
      miniature(f, c, env, t, b);
      f.cached(`${ID}/curtains/${env.mood.id}`, 470, 380, (cc) => {
        cc.translate(-(B10.x - 20), -(B10.y - 10));
        galleryBooth(cc, env, B10, 'front');
      })(c, B10.x - 20, B10.y - 10);
      groove(c, env);
      ruler(c, env, t, tq, b);
      slider(c, env, t, b);
      authorHands(c, env, t, tq, b);
    });
    f.rim({ x: -0.45, y: -1 });
    const bulb = anglepoiseLamp.anchors({ x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: 0.7, aim: 0.15 }).bulb;
    f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 101, intensity: 0.85, radius: 80 });
    near(f);
    nameCard(f.c, { name: 'Cheng Lou', role: "in the lab's gallery notes", at: b.card + 0.1, dur: 3.3, fade: 0.45 }, { t, mood: f.mood, seed: 710 });
  },
});

// ------------------------------------------------------------------ the room: an evening window, panelling, a shelf
const OS2 = overscan(LAYERS.L2, [CAM_A, CAM_B], 40);
const OS3 = overscan(LAYERS.L3, [CAM_A, CAM_B], 40);
function room(f: Frame) {
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, OS2.w, OS2.h, (cc) => {
      cc.translate(-OS2.x, -OS2.y);
      const p = new Path2D();
      p.rect(OS2.x, OS2.y, OS2.w, OS2.h);
      // a tall sash window (a hole: the dusk shows through), four panes over four
      const W = { x: 120, y: 70, w: 330, h: 430 };
      const bar = 9;
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 2; k++) {
          const pw = (W.w - bar * 3) / 2, ph = (W.h - bar * 5) / 4;
          p.rect(W.x + bar + k * (pw + bar), W.y + bar + r * (ph + bar), pw, ph);
        }
      cc.fillStyle = env.fill('set');
      cc.fill(p, 'evenodd');
      // panelling to the right of the window
      cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
      cc.lineWidth = 2;
      for (let i = 0; i < 4; i++) cc.strokeRect(560 + i * 230, 110, 190, 300);
    })(c, OS2.x, OS2.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, 420, 560, (cc) => {
      cc.translate(-1080, -60);
      bookshelfWall(cc, { x: 1080, y: 60, w: 380, h: 520, bays: 2, shelves: 5, seed: 7, backTone: 0.3 }, env);
    })(c, 1080, 60);
  });
  f.fog('B');
}
const OS4 = overscan(LAYERS.L4, [CAM_A, CAM_B], 30);
function desk(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/desk/${env.mood.id}`, OS4.w, OS4.y + OS4.h - DESK_Y + 10, (cc) => {
    cc.translate(-OS4.x, -(DESK_Y - 10));
    cc.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.4);
    cc.fillRect(OS4.x, DESK_Y, OS4.w, OS4.y + OS4.h - DESK_Y);
    // the desk's lit top edge and its moulded lip
    cc.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.4), 0.55);
    cc.fillRect(OS4.x, DESK_Y, OS4.w, 2.5);
    cc.fillStyle = mixLab(env.fill('ink'), '#000000', 0.2);
    cc.fillRect(OS4.x, DESK_Y + 26, OS4.w, 8);
  })(c, OS4.x, DESK_Y - 10);
}

// ------------------------------------------------------------------ the miniature gallery
function miniature(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  // the photos: fitted to the hand-drawn sketch; after the slider they drift into line
  const drift = seg(t, b.slider + 0.35, b.D + 0.4);
  GAL.targets
    .map((_, i) => i)
    .sort((p, q) => GAL.targets[q][2] * GAL.targets[q][3] - GAL.targets[p][2] * GAL.targets[p][3])
    .forEach((i) => {
      const o = GAL.pairEnd[i];
      const art = f.cached(`ch07-s06/photo${o}/${env.mood.id}`, PHOTO_BAKE.w, PHOTO_BAKE.h, (cc) => photoArt(cc, env, o, PHOTO_BAKE.w, PHOTO_BAKE.h));
      photoCard(c, env, art, stageRect(B10, lerpR(DRAWN[i], ALIGNED[i], drift)), { shadow: 0.2 });
    });
  // the sketch: hand-drawn; clacked onto the grid by the ruler; loosened back when it withdraws
  const snap = seg(twos(t), b.snap + 0.04, b.snap + 0.16) * (1 - seg(t, b.card + 0.15, b.card + 0.65));
  const slam = Math.max(0, 1 - Math.abs(twos(t) - (b.snap + 0.04)) / 0.1);
  GAL.targets.forEach((r, i) => sketchFrame(c, env, stageRect(B10, lerpR(DRAWN[i], r, snap)), { seed: 30 + i, lift: 1 + slam * 5, weight: 1.15 }));
}

// ------------------------------------------------------------------ the groove and the ruler
function groove(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('set'), env.mood.halo, 0.25);
  c.fillRect(RULER.restX - 30, GROOVE_Y, 1400, RULER.h + 8);
  c.strokeStyle = withAlpha(env.mood.ink, 0.6);
  c.lineWidth = px(c, 1.2);
  c.beginPath();
  c.moveTo(RULER.restX - 30, GROOVE_Y + RULER.h + 6);
  c.lineTo(RULER.restX + 1400, GROOVE_Y + RULER.h + 6);
  c.stroke();
}
function rulerX(t: number, b: Beats) {
  const tq = twos(t);
  const inU = seg(tq, b.ruler - 0.05, b.snap - 0.04);
  const outU = seg(tq, b.card + 0.1, b.card + 0.85);
  return RULER.restX + (1 - inU) * 760 + outU * 760;
}
function ruler(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const x = rulerX(t, b);
  if (x > 1500) return;
  // it presses up into the sketch on 'snapped' (a short lift and drop)
  const press = Math.max(0, 1 - Math.abs(tq - (b.snap + 0.08)) / 0.12);
  const y = GROOVE_Y + 3 - press * 5;
  const g = c.createLinearGradient(0, y, 0, y + RULER.h);
  g.addColorStop(0, brassOf(env, 0.75));
  g.addColorStop(0.5, brassOf(env, 0.2));
  g.addColorStop(1, mixLab(brassOf(env, 0), '#2a1d14', 0.5));
  c.fillStyle = g;
  // the body with its notched top edge: a tooth at every column edge of the grid
  const p = new Path2D();
  p.moveTo(x, y + RULER.h);
  p.lineTo(x, y);
  const nx = NOTCH_X.map((fx) => B10.x + fx * B10.w);
  for (const n of nx) {
    p.lineTo(n - 4, y);
    p.lineTo(n, y - 9);
    p.lineTo(n + 4, y);
  }
  p.lineTo(x + RULER.len, y);
  p.lineTo(x + RULER.len, y + RULER.h);
  p.closePath();
  c.save();
  c.translate(x - RULER.restX, 0);
  c.fill(p);
  c.strokeStyle = withAlpha('#2a1d14', 0.6);
  c.lineWidth = px(c, 1);
  c.stroke(p);
  c.restore();
  // fine graduations and the engraving
  c.strokeStyle = withAlpha('#2a1d14', 0.5);
  c.lineWidth = px(c, 1);
  for (let i = 0; i < 46; i++) {
    const gx = x + 8 + i * 10;
    c.beginPath();
    c.moveTo(gx, y + RULER.h - 1);
    c.lineTo(gx, y + RULER.h - (i % 5 === 0 ? 8 : 4));
    c.stroke();
  }
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 600 17px ${FONT.text}`, 17);
    c.font = `italic 600 ${size}px ${FONT.text}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab('#2a1d14', brassOf(env, 0), 0.15);
    const tx = x + 128, ty = y + RULER.h - 6;
    c.fillText('snap to grid · ordinary code', tx, ty);
    const w = c.measureText('snap to grid · ordinary code').width;
    textProbe(c, `${ID}-ruler`, tx, ty - size, w, size * 1.2, 1);
  });
  // on the press: guide lines flash up the screen from each notch, and a hard white clack
  const flash = Math.max(0, 1 - Math.abs(tq - (b.snap + 0.12)) / 0.3);
  if (flash > 0 && x < RULER.restX + 2) {
    c.save();
    c.strokeStyle = withAlpha(mixLab(brassOf(env, 1), '#fff6e0', 0.4), 0.7 * flash);
    c.lineWidth = px(c, 1.4);
    for (const fx of NOTCH_X) {
      const gx = B10.x + fx * B10.w;
      c.beginPath();
      c.moveTo(gx, y - 9);
      c.lineTo(gx, B10.y);
      c.stroke();
    }
    c.restore();
  }
}

// ------------------------------------------------------------------ the slider (Misalignment penalty, 4 %)
function slider(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(twos(t), b.slider - 0.05, b.slider + 0.5);
  if (u <= 0) return;
  const y = SLIDER.y + (1 - u) * 130;
  c.save();
  c.beginPath();
  c.rect(SLIDER.x - 40, 0, SLIDER.w + 120, DESK_Y);
  c.clip();
  // a paper card on a stand
  const card = { x: SLIDER.x - 18, y: y - 52, w: SLIDER.w + 70, h: 92 };
  c.fillStyle = withAlpha('#2a1d14', 0.3);
  c.fillRect(card.x + 4, card.y + 5, card.w, card.h);
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.halo, 0.25), env.mood.core, 0.15);
  c.fillRect(card.x, card.y, card.w, card.h);
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.3);
  c.fillRect(card.x + card.w / 2 - 5, card.y + card.h, 10, DESK_Y - (card.y + card.h));
  // track from off to 8 %, the knob at 4 % (the middle)
  const tx0 = SLIDER.x, tx1 = SLIDER.x + SLIDER.w, ty = y + 14;
  c.strokeStyle = mixLab('#2a1d14', env.mood.ink, 0.3);
  c.lineWidth = px(c, 2.4);
  c.beginPath();
  c.moveTo(tx0, ty);
  c.lineTo(tx1, ty);
  c.stroke();
  const kx = tx0 + SLIDER.w * 0.5;
  c.fillStyle = brassOf(env, 0.5);
  c.beginPath();
  c.arc(kx, ty, 8, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha('#2a1d14', 0.7);
  c.lineWidth = px(c, 1.2);
  c.stroke();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 20px ${FONT.text}`, 20);
    c.font = `italic 500 ${size}px ${FONT.text}`;
    c.fillStyle = mixLab('#2a1d14', env.mood.ink, 0.3);
    c.textAlign = 'center';
    c.fillText('Misalignment penalty', card.x + card.w / 2, card.y + size + 6);
    const w = c.measureText('Misalignment penalty').width;
    textProbe(c, `${ID}-slider`, card.x + card.w / 2 - w / 2, card.y + 6, w, size * 1.2, u);
    c.fillText('4%', kx, ty + size + 8);
  });
  c.restore();
}

// ------------------------------------------------------------------ Cheng's hands (author-hands), at the keyboard
function authorHands(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const w = LAPTOP.w, k = w / 300;
  const len = HAND_LEN * 0.9 * k;
  const tipsY = LAPTOP.y - w * 0.13;
  const bottom = LAPTOP.y + w * 1.1;
  const step = Math.floor(tq * 6);
  const dip = (salt: number) => {
    const h = Math.sin(step * 12.9898 + salt * 78.233) * 43758.5453;
    return h - Math.floor(h) > 0.45 ? 1 : 0;
  };
  // typing pauses while the ruler acts (from 'fix' to 'Cheng') and after the decline (still, listening)
  const typing = (t > 0.2 && t < b.ruler - 0.1) || (t > b.card + 1.1 && t < b.slider - 0.3);
  const one = (tip: { x: number; y: number }, entry: { x: number; y: number }, shape: 'rest' | 'flat') => {
    const arm = hands.reach(entry, tip, shape, len, { sleeve: 'bare', noArmRim: true });
    hands.draw(c, { right: arm, scale: len / HAND_LEN }, env);
  };
  const dL = typing ? dip(1) : 0;
  one({ x: LAPTOP.x - w * 0.2, y: tipsY + dL * 4 * k }, { x: LAPTOP.x - w * 0.45, y: bottom }, dL ? 'flat' : 'rest');
  // the right hand: types, lifts on 'Cheng' and comes to rest flat on the ruler's free end, lifts away on 'spirit'
  const onU = seg(tq, b.decline - 0.05, b.decline + 0.55);
  const offU = seg(tq, b.card - 0.05, b.card + 0.6);
  const u = onU * (1 - offU);
  const dR = typing ? dip(2) : 0;
  const keys = { x: LAPTOP.x + w * 0.04, y: tipsY + dR * 4 * k };
  const onRuler = { x: RULER.restX + 30, y: GROOVE_Y + 4 };
  const lift = Math.sin(Math.PI * u) * 46;
  const tip = { x: keys.x + (onRuler.x - keys.x) * u, y: keys.y + (onRuler.y - keys.y) * u - lift };
  one(tip, { x: LAPTOP.x + w * 0.12 + u * 90, y: bottom }, u > 0.85 || dR ? 'flat' : 'rest');
}

// ------------------------------------------------------------------ near plane (L5): the desk's near corner and a mug
const OS5 = overscan(LAYERS.L5, [CAM_A, CAM_B], 20);
function near(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/L5/${env.mood.id}`, 420, 360, (cc) => {
      cc.translate(-(OS5.x), -(OS5.y + OS5.h - 360));
      cc.fillStyle = env.fill('fg');
      const x0 = OS5.x, y1 = OS5.y + OS5.h;
      // the desk's near edge, a soft dark lip along the bottom of frame
      cc.beginPath();
      cc.moveTo(x0 - 20, y1 - 26);
      cc.quadraticCurveTo(x0 + 200, y1 - 34, x0 + 440, y1 - 30);
      cc.lineTo(x0 + 440, y1 + 20);
      cc.lineTo(x0 - 20, y1 + 20);
      cc.closePath();
      cc.fill();
    })(c, OS5.x, OS5.y + OS5.h - 360);
  });
}
