/**
 * ch04-s01 — THE QUESTION OF DEEP DIVE I (plate, parchment; inkBleed in from the X-ray desk; 7.96 s on the clock).
 * L0401 "Back to four and a half. In JavaScript, only the chosen side runs."
 * L0402 "A network has no if."
 *
 * A lamp-lit parchment plate, camera locked. TEACHES, word by word:
 *   0.2          (beat title) the deep-dive title tab drops in at top-left and holds: Deep Dive I · Two Ramps and a Lever
 *   (from 0)     a paper road (a cut strip of card) runs in from the left and forks at a border marker cut along a
 *                dotted line and labelled with the comparison a > 4; the upper arm leads to a 10 tile, the lower to 12
 *   'JavaScript' (beat code) the README's ternary inks across the upper third in monospace, left to right
 *   'chosen'     (beat fork) a paper marble rolls up the road; at the fork only the upper arm lights in copper ink
 *                behind it (a = 4.5 > 4: the 10 side), the lower arm stays plain paper, untouched
 *   end of L0401 (beat unlit) the untaken arm fades to a dotted outline: in JavaScript it is never travelled
 *   'no'         (beat noif) the whole road turns to ink and peels a short way off the plate (a capped lift with one
 *                crisp offset shadow, still drifting up into the cut: ch04-s02 cuts on that motion) and the marker
 *                splits along its dotted line, each half carrying its torn perforation. Hold on the split marker.
 * Text on screen: the title tab, the code line, the marker's a > 4, the 10 and 12 tiles. Nothing else.
 */
import { Timeline } from '../../../core';
import type { PaintEnv } from '../../../film';
import { FONT, defineShot, hash1, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from '../sets/narratorHands';
import { tile } from '../sets/rampBench';

const ID = 'ch04-s01';
type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const TITLE = 'Deep Dive I · Two Ramps and a Lever';
const CODE = 'const result = (a > 4) ? 10 : 12';
const CODE_Y = 196;

// ---------------------------------------------------------------- the road (plate px)
const ROAD_W = 46;
// review r1: the road group sits ~52 px lower (fork at y 500) so the ternary and the road share the frame's
// optical centre and the lift at 'no' has room below the code line; arms spread +/-112 so the 12 tile stays
// inside the bottom safe band.
const FORK: Pt = { x: 520, y: 500 };
/** cubic arms from the fork to their tiles */
const ARM_UP = { p0: FORK, c1: { x: 640, y: 500 }, c2: { x: 760, y: 388 }, p3: { x: 936, y: 388 } };
const ARM_DN = { p0: FORK, c1: { x: 640, y: 500 }, c2: { x: 760, y: 612 }, p3: { x: 936, y: 612 } };
const TILE_UP: Pt = { x: 990, y: 406 };
const TILE_DN: Pt = { x: 990, y: 630 };
const MARKER = { x: 806, y: 502, w: 112, h: 76 };
/** the perforation across the marker (the split line), marker-local y offset */
const CUT_DY = 6;
/** the road's lift at 'no': capped (review r1) so the raised road never crosses the code line */
const LIFT_PX = 42;
const SHADOW_PX = 15;
type Cubic = typeof ARM_UP;
function bez(b: Cubic, u: number): Pt {
  const v = 1 - u;
  return {
    x: v * v * v * b.p0.x + 3 * v * v * u * b.c1.x + 3 * v * u * u * b.c2.x + u * u * u * b.p3.x,
    y: v * v * v * b.p0.y + 3 * v * v * u * b.c1.y + 3 * v * u * u * b.c2.y + u * u * u * b.p3.y,
  };
}
const TRUNK0: Pt = { x: -60, y: 500 };

interface Beats {
  title: number;
  code: number;
  roll: [number, number, number];
  unlit: number;
  noif: number;
  lift: [number, number];
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const fork = T.beat('fork');
    const noif = T.beat('noif');
    const b: Beats = {
      title: T.beat('title'),
      code: T.beat('code'),
      // the marble: in from the left edge, at the fork on 'chosen', at the 10 tile by 'side'/'runs'
      roll: [fork - 0.75, fork + 0.12, T.word('L0401', 'runs') + 0.05],
      unlit: T.beat('unlit'),
      noif,
      lift: [noif - 0.12, Math.min(D - 0.3, noif + 0.95)],
    };
    tl.hold(0, D);
    return { tl, b, D };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    f.camera({ x: 640, y: 360, z: 0, lens: 1 });
    f.backlight({ sunX: 640, intensity: 1 });
    // the plate (cached)
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/plate/${env.mood.id}`, 1400, 820, (cc) => {
        cc.translate(60, 50);
        plate(cc, env);
      })(c, -60, -50);
    });
    f.fog({ yCenter: 560, height: 300, alpha: 0.08, drift: 5 });
    f.layer('L4', (c, env) => {
      codeLine(c, env, t, b);
      marker(c, env, t, b);
      road(c, env, t, tq, b);
    });
    f.layer('L5', (c, env) => {
      // the lamp's warm fall-off and a soft near shadow of the lamp arm across the lower right corner
      f.cached(`${ID}/near/${env.mood.id}`, 1600, 900, (cc) => {
        cc.translate(160, 90);
        const g = cc.createRadialGradient(1260, 760, 60, 1260, 760, 420);
        g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.55));
        g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
        cc.fillStyle = g;
        cc.fillRect(700, 300, 900, 600);
      })(c, -160, -90);
    });
    titleTab(f.c, f.mood, t, b.title);
  },
});

// ---------------------------------------------------------------- the plate
function plate(c: C, env: PaintEnv) {
  const W = 1400, H = 820;
  const g = c.createRadialGradient(640, 250, 40, 640, 330, 860);
  g.addColorStop(0, mixLab('#f6ecd6', env.mood.core, 0.3));
  g.addColorStop(0.5, mixLab('#e8d9b9', env.mood.sky[1], 0.15));
  g.addColorStop(1, mixLab('#bfa47a', env.mood.set, 0.45));
  c.fillStyle = g;
  c.fillRect(-60, -50, W, H);
  // fibres
  for (let i = 0; i < 520; i++) {
    const x = -60 + hash1(i, 11) * W;
    const y = -50 + hash1(i, 13) * H;
    const a = hash1(i, 17) * Math.PI;
    const l = 4 + hash1(i, 19) * 14;
    c.strokeStyle = withAlpha(hash1(i, 23) > 0.5 ? '#8f7650' : '#fffaf0', 0.07 + 0.08 * hash1(i, 29));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  // a faint drafting grid below the code margin
  c.strokeStyle = withAlpha('#9c8460', 0.06);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let x = 40; x < 1280; x += 40) {
    c.moveTo(x, 250);
    c.lineTo(x, 720);
  }
  for (let y = 250; y < 720; y += 40) {
    c.moveTo(0, y);
    c.lineTo(1280, y);
  }
  c.stroke();
  c.strokeStyle = withAlpha('#7d6343', 0.22);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(80, 236);
  c.lineTo(1200, 236);
  c.stroke();
  // the darker vignette at the corners (the lamp's pool)
  const v = c.createRadialGradient(640, 300, 200, 640, 360, 900);
  v.addColorStop(0, withAlpha('#3a2614', 0));
  v.addColorStop(1, withAlpha('#3a2614', 0.42));
  c.fillStyle = v;
  c.fillRect(-60, -50, W, H);
}

// ---------------------------------------------------------------- the title tab (screen-locked, top-left)
function titleTab(c: C, mood: PaintEnv['mood'], t: number, at: number) {
  const u = win(t, at, at + 0.4);
  if (u <= 0) return;
  c.save();
  const base = `600 30px ${FONT.sc}`;
  const size = legibleSize(c, base, 30, TITLE);
  c.font = `600 ${size}px ${FONT.sc}`;
  const tw = c.measureText(TITLE).width;
  const x = 40;
  const h = 52;
  // drops from above the frame, a small settle
  const drop = (1 - u) * -90 + Math.sin(win(t, at + 0.4, at + 0.6) * Math.PI) * 3;
  const y = 30 + drop;
  const w = tw + 52;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.beginPath();
  c.roundRect(x + 4, y + 5, w, h, [4, 14, 4, 4]);
  c.fill();
  c.fillStyle = mixLab(mixLab('#d9bd84', mood.halo, 0.25), mood.core, 0.1);
  c.beginPath();
  c.roundRect(x, y, w, h, [4, 14, 4, 4]);
  c.fill();
  c.strokeStyle = withAlpha('#6b4f2c', 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(x + 5, y + 5, w - 10, h - 10, [2, 10, 2, 2]);
  c.stroke();
  // a copper eyelet at the tab's left
  c.fillStyle = copperOf({ mood, layer: { haze: 0 } } as unknown as PaintEnv, 0.4);
  c.beginPath();
  c.arc(x + 15, y + h / 2, 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab('#d9bd84', mood.halo, 0.25);
  c.beginPath();
  c.arc(x + 15, y + h / 2, 2.2, 0, Math.PI * 2);
  c.fill();
  textRole(c, 'subject', () => {
    c.fillStyle = mixLab('#2a1d12', mood.ink, 0.2);
    c.textBaseline = 'middle';
    c.fillText(TITLE, x + 32, y + h / 2 + 1);
  });
  textProbe(c, `${ID}-title`, x, y, w, h, 1);
  c.restore();
}

// ---------------------------------------------------------------- the code line
function codeLine(c: C, env: PaintEnv, t: number, b: Beats) {
  const u = win(t, b.code - 0.08, b.code + 0.75);
  if (u <= 0) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 40px ${FONT.mono}`, 40);
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    const w = c.measureText(CODE).width;
    const x0 = 640 - w / 2;
    const ink = mixLab(env.mood.ink, '#3a2a1c', 0.25);
    const edge = x0 - 40 + (w + 80) * u;
    const g = c.createLinearGradient(edge - 50, 0, edge, 0);
    g.addColorStop(0, ink);
    g.addColorStop(1, withAlpha(ink, 0));
    c.fillStyle = u >= 1 ? ink : g;
    c.fillText(CODE, x0, CODE_Y);
  });
}

// ---------------------------------------------------------------- the marker at the fork
function marker(c: C, env: PaintEnv, t: number, b: Beats) {
  const split = win(t, b.noif - 0.05, b.noif + 0.45);
  const M = MARKER;
  const ink = mixLab('#2a1d12', env.mood.ink, 0.2);
  const paper = mixLab(mixLab('#e3cfa2', env.mood.halo, 0.2), env.mood.set, 0.12);
  const half = (top: boolean) => {
    c.save();
    // each half drifts away from the perforation and tilts a little
    const dy = (top ? -1 : 1) * split * 16;
    const rot = (top ? -1 : 1) * split * 0.09;
    c.translate(M.x, M.y + dy);
    c.rotate(rot);
    c.translate(-M.x, -M.y);
    const cutY = M.y + CUT_DY;
    c.beginPath();
    if (top) c.rect(M.x - M.w / 2 - 4, M.y - M.h / 2 - 4, M.w + 8, cutY - (M.y - M.h / 2 - 4));
    else c.rect(M.x - M.w / 2 - 4, cutY, M.w + 8, M.y + M.h / 2 + 8 - cutY);
    c.clip();
    // the stone-like marker: a squared card with a rounded head, its shadow on the plate
    const shape = (dx: number, dy2: number) => {
      c.beginPath();
      c.moveTo(M.x - M.w / 2 + dx, M.y + M.h / 2 + dy2);
      c.lineTo(M.x - M.w / 2 + dx, M.y - M.h / 2 + 14 + dy2);
      c.quadraticCurveTo(M.x - M.w / 2 + dx, M.y - M.h / 2 + dy2, M.x - M.w / 2 + 14 + dx, M.y - M.h / 2 + dy2);
      c.lineTo(M.x + M.w / 2 - 14 + dx, M.y - M.h / 2 + dy2);
      c.quadraticCurveTo(M.x + M.w / 2 + dx, M.y - M.h / 2 + dy2, M.x + M.w / 2 + dx, M.y - M.h / 2 + 14 + dy2);
      c.lineTo(M.x + M.w / 2 + dx, M.y + M.h / 2 + dy2);
      c.closePath();
    };
    shape(4, 5);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
    c.fill();
    shape(0, 0);
    c.fillStyle = paper;
    c.fill();
    c.strokeStyle = withAlpha(ink, 0.7);
    c.lineWidth = 1.6;
    c.stroke();
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `600 26px ${FONT.mono}`, 26);
      c.font = `600 ${size}px ${FONT.mono}`;
      c.fillStyle = ink;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText('a > 4', M.x, M.y - 6);
      c.textAlign = 'left';
    });
    // review r1: each half carries its own half of the perforation, so the split reads as ONE card torn
    // along its dotted line (the lower half is no longer a blank grey slab): a dotted ink edge, the
    // torn fibres just inside it, and a faint ink wash along the tear.
    const edgeY = cutY + (top ? -1.2 : 1.2);
    c.strokeStyle = withAlpha(ink, 0.85);
    c.lineWidth = 1.7;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(M.x - M.w / 2 + 1, edgeY);
    c.lineTo(M.x + M.w / 2 - 1, edgeY);
    c.stroke();
    c.setLineDash([]);
    if (split > 0) {
      const tg = c.createLinearGradient(0, cutY, 0, cutY + (top ? -12 : 12));
      tg.addColorStop(0, withAlpha(ink, 0.22 * split));
      tg.addColorStop(1, withAlpha(ink, 0));
      c.fillStyle = tg;
      c.fillRect(M.x - M.w / 2, top ? cutY - 12 : cutY, M.w, 12);
      c.strokeStyle = withAlpha(ink, 0.5 * split);
      c.lineWidth = 1;
      c.beginPath();
      for (let k = 0; k < 14; k++) {
        const x = M.x - M.w / 2 + 5 + k * ((M.w - 10) / 13);
        const l = 2 + hash1(k, top ? 41 : 43) * 4;
        c.moveTo(x, edgeY);
        c.lineTo(x + (hash1(k, 47) - 0.5) * 2, edgeY + (top ? -l : l));
      }
      c.stroke();
    }
    c.restore();
  };
  half(true);
  half(false);
  textProbe(c, `${ID}-marker`, M.x - M.w / 2, M.y - M.h / 2, M.w, M.h, 1);
}

// ---------------------------------------------------------------- the road, its tiles and the marble
function strokeArm(c: C, b: Cubic, w: number, u0 = 0, u1 = 1) {
  c.beginPath();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const u = lerp(u0, u1, i / n);
    const p = bez(b, u);
    if (i === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.lineWidth = w;
  c.stroke();
}
function road(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const lift = win(tq, b.lift[0], b.lift[1]);
  const inkU = win(t, b.noif - 0.25, b.noif + 0.15);
  const paper = mixLab(mixLab('#d6bd8c', env.mood.halo, 0.2), env.mood.set, 0.2);
  const silhouette = PUPPET_NEAR_BLACK;
  const fill = mixLab(paper, silhouette, inkU);
  const ink = mixLab('#2a1d12', env.mood.ink, 0.2);
  // review r1: the untaken arm fades from just before the line ends and is a dotted outline by the
  // first word of L0402, so the 'never travelled' read lands inside the 0.6 s pause
  const unlit = win(t, b.unlit - 0.2, b.unlit + 0.4);
  c.save();
  // the lift (review r1): the road peels a short way off the plate toward the lens (capped at LIFT_PX,
  // a 2 % swell about the fork) and leaves ONE crisp offset shadow of its own shape at ~18 % ink on the
  // paper, so it reads as raised card, not a smear; it keeps drifting up a few px into the cut.
  const e = 1 - (1 - lift) * (1 - lift);
  const drift = Math.max(0, tq - b.lift[1]) * 6;
  const rise = LIFT_PX * e + drift;
  const s = 1 + 0.02 * e;
  const ox = FORK.x, oy = FORK.y;
  if (lift > 0) {
    c.save();
    c.translate(SHADOW_PX * 0.45 * e, SHADOW_PX * e);
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18 * e);
    c.lineCap = 'butt';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(TRUNK0.x, TRUNK0.y);
    c.lineTo(FORK.x + 2, FORK.y);
    c.lineWidth = ROAD_W;
    c.stroke();
    strokeArm(c, ARM_UP, ROAD_W);
    c.restore();
    c.translate(ox, oy - rise);
    c.scale(s, s);
    c.translate(-ox, -oy);
  }
  c.lineCap = 'butt';
  c.lineJoin = 'round';
  // the cut-paper strip: a shadow edge, then the paper
  for (const pass of [0, 1]) {
    c.save();
    if (pass === 0) {
      c.translate(3, 4);
      c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.28 * (1 - inkU));
    } else c.strokeStyle = fill;
    c.beginPath();
    c.moveTo(TRUNK0.x, TRUNK0.y);
    c.lineTo(FORK.x + 2, FORK.y);
    c.lineWidth = ROAD_W;
    c.stroke();
    strokeArm(c, ARM_UP, ROAD_W);
    // the untaken arm thins to a dotted outline after 'unlit'
    c.globalAlpha *= 1 - unlit * 0.92;
    strokeArm(c, ARM_DN, ROAD_W);
    c.restore();
  }
  if (unlit > 0) {
    c.save();
    c.strokeStyle = withAlpha(inkU > 0.5 ? silhouette : ink, 0.75 * unlit);
    c.setLineDash([5, 6]);
    c.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      c.beginPath();
      for (let i = 0; i <= 40; i++) {
        const u = 0.06 + (i / 40) * 0.94;
        const p = bez(ARM_DN, u);
        const q = bez(ARM_DN, Math.min(1, u + 0.01));
        const nx = -(q.y - p.y), ny = q.x - p.x;
        const nl = Math.hypot(nx, ny) || 1;
        const x = p.x + (nx / nl) * side * ROAD_W * 0.5;
        const y = p.y + (ny / nl) * side * ROAD_W * 0.5;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    c.restore();
  }
  // the road's centre dashes (ink) on the trunk and both arms
  c.save();
  c.strokeStyle = withAlpha(ink, 0.35 * (1 - inkU));
  c.setLineDash([10, 9]);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(TRUNK0.x, TRUNK0.y);
  c.lineTo(FORK.x, FORK.y);
  c.stroke();
  strokeArm(c, ARM_UP, 1.4);
  c.globalAlpha *= 1 - unlit;
  strokeArm(c, ARM_DN, 1.4);
  c.restore();
  // the copper ink behind the marble on the taken side only
  const m = marbleAt(tq, b);
  if (m.trail > 0) {
    c.save();
    c.strokeStyle = withAlpha(mixLab(copperOf(env, 0.2), '#8a3f17', 0.35), 0.95 * (1 - inkU));
    c.lineCap = 'round';
    c.lineWidth = 12;
    c.beginPath();
    const tx = Math.min(FORK.x, m.trunkX);
    c.moveTo(TRUNK0.x + 60, FORK.y);
    c.lineTo(tx, FORK.y);
    c.stroke();
    if (m.armU > 0) strokeArm(c, ARM_UP, 12, 0, m.armU);
    // a soft copper wash on the lit arm
    c.globalAlpha *= 0.3 * win(m.armU, 0.1, 1);
    strokeArm(c, ARM_UP, ROAD_W - 8, 0, m.armU);
    c.restore();
  }
  // the tiles at the arms' ends
  c.save();
  if (inkU > 0) c.globalAlpha *= 1 - inkU * 0.6;
  tile(c, env, TILE_UP.x, TILE_UP.y, '10', { s: 1.7, subject: true, glow: m.arrived * 0.6 });
  c.globalAlpha *= 1 - unlit * 0.55;
  tile(c, env, TILE_DN.x, TILE_DN.y, '12', { s: 1.7, subject: true });
  c.restore();
  // the paper marble
  if (m.on) {
    const r = 11;
    c.fillStyle = mixLab('#f1e4c6', env.mood.core, 0.25 * (1 - inkU));
    c.strokeStyle = withAlpha(ink, 0.85);
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(m.p.x, m.p.y, r, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(m.p.x, m.p.y, r * 0.55, m.roll, m.roll + 2.2);
    c.stroke();
  }
  c.restore();
}

function marbleAt(tq: number, b: Beats): { on: boolean; p: Pt; roll: number; trail: number; trunkX: number; armU: number; arrived: number } {
  const [a, f2, z] = b.roll;
  const start: Pt = { x: 60, y: FORK.y };
  if (tq < a) return { on: false, p: start, roll: 0, trail: 0, trunkX: start.x, armU: 0, arrived: 0 };
  if (tq < f2) {
    const u = sm((tq - a) / (f2 - a)) * 0.6 + ((tq - a) / (f2 - a)) * 0.4;
    const x = lerp(start.x, FORK.x, u);
    return { on: true, p: { x, y: FORK.y }, roll: x / 11, trail: 1, trunkX: x, armU: 0, arrived: 0 };
  }
  const u = clamp01((tq - f2) / (z - f2));
  const au = 1 - (1 - u) * (1 - u) * 0.6 - (1 - u) * 0.4;
  const p = bez(ARM_UP, Math.min(0.94, au));
  return { on: true, p, roll: (FORK.x + au * 420) / 11, trail: 1, trunkX: FORK.x, armU: Math.min(0.94, au), arrived: win(tq, z - 0.1, z + 0.3) };
}
