/**
 * ch15-s07 — for Widrow: the small Dartmouth paper lantern, still lit, alone on a snowy window sill at night
 * (winterBlue; 13.63 s; in: fadeBlack from the holdouts' tableau; out: lampChange into the study, ch15-s08).
 *
 * A paned sash window in paper cut-out, the room dark around it: beyond the glass a winter night (a low moon in
 * the cloud, a far ridge of bare trees under snow, one near branch), light snow drifting past in two depths, a
 * little drift banked on the outer ledge, frost in the corners of the panes. On the inner sill, on a thin iron
 * crook, hangs the small paper lantern he watched swing at Dartmouth (ch02-s07): lit and steady, its warm light
 * the only warm thing in the frame, caught faintly in the glass behind it. A heavy curtain edge, near and soft,
 * frames the left. The camera pushes in on the lantern over the whole shot; its flame does not drop.
 *
 *   L1511 'Widrow'  (b1) the date stamp types bottom left (date only); his name card, lower right
 *   'He'            (b2) his 1956 words, on a small card, drift once down past the glass and settle on the sill,
 *                   propped against the pane beside the lantern; they hold through the music (≈ 4.5 s)
 *   hold            the steady lantern, the settled card, the snow
 * TEXT DISCIPLINE: the date stamp (date only), the name card, and the quote (spoken in part, so ear and eye agree).
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import {
  FONT,
  LAYERS,
  MOODS,
  defineShot,
  drawTracked,
  forestBand,
  hash1,
  mixLab,
  nameCard,
  PUPPET_NEAR_BLACK,
  ridgeline,
  snow,
  softPlate,
  stars,
  textColor,
  tree,
  vnoise2,
  withAlpha,
  wrapLines,
} from '../../../film';
import { overscan, toLayer } from '../../../film/core/multiplane';
import { frameOn, mixFrame } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch13-s01-kit';

const ID = 'ch15-s07';
type C = CanvasRenderingContext2D;
const W = MOODS.winterBlue;
const A = MOODS.candleAmber;

// ------------------------------------------------------------------------------------------------ geometry
/** the window hole in the room wall (wall-layer world px) */
const WIN = { x: 300, y: 34, w: 760, h: 504 };
/** the inner sill's top surface (L4) */
const SILL_Y = 540;
/** the lantern: the iron crook stands on the sill; the lantern hangs from its tip */
const STAND_X = 500;
const CROOK = { x: 568, y: 318 };
const LANTERN = { x: 568, y: 436, rx: 40, ry: 52 };
/** the quote card at rest: propped on the sill against the lower pane, right of the lantern */
const CARD = { w: 270, h: 112, x: 800, rot: -0.035 };
const CARD_REST = { x: CARD.x, y: SILL_Y - CARD.h / 2 - 1 };
const QUOTE = '…I never got over it.';
const ATTR = 'Bernard Widrow, 2005, recalling Dartmouth, 1956';

/** the wall plane sits a hair behind the sill (almost no parallax against L4) */
const WALL_L: LayerSpec = { id: 'ch15s07wall', z: 1035, haze: 0.04, blur: 0.4 };
/** outside, just beyond the glass: the near branch and the near snow */
const OUT_NEAR: LayerSpec = { id: 'ch15s07out', z: 1500, haze: 0.22, blur: 1.2 };

const CAM0 = frameOn({ x: 680, y: 320 }, { x: 640, y: 360 }, 0.94);
const CAM1 = frameOn({ x: 716, y: 432 }, { x: 640, y: 370 }, 1.48);
const CAMS: Camera3[] = [CAM0, mixFrame(CAM0, CAM1, 0.5), CAM1];
/** the right curtain's tieback (L5, near and soft): placed so it holds the lower-right corner at the end of the push */
const TIE = toLayer(LAYERS.L5, CAM1, 1150, 450);

interface Scene extends ShotScene {
  D: number;
  b1: number;
  b2: number;
  land: number;
  end: number;
}

// ------------------------------------------------------------------------------------------------ painters
/** the warm light of the lantern (amber, additive): the shot's one accent, motivated by the flame */
function warmGlow(c: C, x: number, y: number, R: number, k: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [r, col, a] of [[R, A.halo, 0.14], [R * 0.3, A.halo, 0.26], [R * 0.11, A.core, 0.45]] as const) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, withAlpha(col, a * k));
    g.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the panes: two sashes, three by two lights each, the meeting rail at mid height */
const RAIL_Y = WIN.y + WIN.h * 0.47;
function glazing(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  const fr = 22, bar = 10;
  // outer frame
  c.fillRect(WIN.x - fr, WIN.y - fr, WIN.w + 2 * fr, fr);
  c.fillRect(WIN.x - fr, WIN.y, fr, WIN.h);
  c.fillRect(WIN.x + WIN.w, WIN.y, fr, WIN.h);
  // the meeting rail (heavier), bars
  c.fillRect(WIN.x, RAIL_Y - 9, WIN.w, 18);
  for (let i = 1; i < 3; i++) c.fillRect(WIN.x + (WIN.w * i) / 3 - bar / 2, WIN.y, bar, WIN.h);
  for (const [y0, y1] of [[WIN.y, RAIL_Y], [RAIL_Y, WIN.y + WIN.h]]) {
    const ym = (y0 + y1) / 2;
    c.fillRect(WIN.x, ym - bar / 2, WIN.w, bar);
  }
  // the sash lift on the meeting rail
  c.fillRect(WIN.x + WIN.w / 2 - 10, RAIL_Y - 12, 20, 6);
  // rim on the bars' top edges (the sky is the key)
  c.fillStyle = withAlpha(env.mood.rim, 0.16);
  c.fillRect(WIN.x, RAIL_Y - 7, WIN.w, 1.2);
  c.fillRect(WIN.x - fr, WIN.y - fr, WIN.w + 2 * fr, 1.2);
}

/** frost feathering into the corners of each pane (on the glass, behind the bars) */
function frost(c: C, env: PaintEnv) {
  const cols = 3;
  const rows: [number, number][] = [];
  for (const [y0, y1] of [[WIN.y, RAIL_Y], [RAIL_Y, WIN.y + WIN.h]]) {
    const ym = (y0 + y1) / 2;
    rows.push([y0, ym], [ym, y1]);
  }
  const ice = mixLab(env.mood.rim, env.mood.core, 0.4);
  let k = 0;
  for (const [y0, y1] of rows) {
    for (let i = 0; i < cols; i++) {
      const x0 = WIN.x + (WIN.w * i) / cols, x1 = WIN.x + (WIN.w * (i + 1)) / cols;
      for (const [cx, cy, sx, sy] of [[x0, y1, 1, -1], [x1, y1, -1, -1], [x0, y0, 1, 1], [x1, y0, -1, 1]] as const) {
        k++;
        const lower = cy === y1;
        if (!lower) continue;
        const R = 30 + 26 * (hash1(k, 61) * 0.5 + 0.5);
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
        g.addColorStop(0, withAlpha(ice, 0.13));
        g.addColorStop(1, withAlpha(ice, 0));
        c.fillStyle = g;
        c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
        // a few crystalline feathers
        c.strokeStyle = withAlpha(ice, 0.16);
        c.lineWidth = 0.6;
        for (let j = 0; j < 7; j++) {
          const a = (hash1(k * 9 + j, 62) * 0.5 + 0.5) * (Math.PI / 2);
          const L = R * (0.4 + 0.5 * (hash1(k * 9 + j, 63) * 0.5 + 0.5));
          const ex = cx + sx * Math.cos(a) * L, ey = cy + sy * Math.sin(a) * L;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(ex, ey);
          for (let q = 1; q < 4; q++) {
            const px = cx + (ex - cx) * (q / 4), py = cy + (ey - cy) * (q / 4);
            const bl = L * 0.18 * (1 - q / 5);
            c.moveTo(px, py);
            c.lineTo(px + sx * Math.cos(a + 0.7) * bl, py + sy * Math.sin(a + 0.7) * bl);
            c.moveTo(px, py);
            c.lineTo(px + sx * Math.cos(a - 0.7) * bl, py + sy * Math.sin(a - 0.7) * bl);
          }
          c.stroke();
        }
      }
    }
  }
}

/** the night beyond the glass (L1): sky ramp with a low moon in the cloud, a far ridge, bare trees under snow */
function farNight(c: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const sky = c.createLinearGradient(0, r.y, 0, r.y + r.h);
  sky.addColorStop(0, mixLab(W.sky[0], W.fg, 0.35));
  sky.addColorStop(0.45, W.sky[1]);
  sky.addColorStop(0.7, W.sky[2]);
  sky.addColorStop(1, mixLab(W.sky[2], W.set, 0.3));
  c.fillStyle = sky;
  c.fillRect(r.x, r.y, r.w, r.h);
  stars(c, { x: r.x, y: r.y, w: r.w, h: r.h * 0.35, count: 70, seed: 25, twinkle: 0 }, env);
  // the moon, low and veiled: a soft disc in a wide halo
  const mx = 860, my = 150;
  const g = c.createRadialGradient(mx, my, 0, mx, my, 360);
  g.addColorStop(0, withAlpha(W.core, 0.42));
  g.addColorStop(0.08, withAlpha(W.core, 0.3));
  g.addColorStop(0.3, withAlpha(W.rim, 0.12));
  g.addColorStop(1, withAlpha(W.rim, 0));
  c.fillStyle = g;
  c.fillRect(mx - 360, my - 360, 720, 720);
  c.fillStyle = withAlpha(W.core, 0.55);
  c.beginPath();
  c.arc(mx, my, 17, 0, Math.PI * 2);
  c.fill();
  // two soft cloud wisps across the moon (blurred, faint: veils, not stripes)
  c.save();
  c.filter = 'blur(7px)';
  for (const [dx, dy, rx, ry] of [[-30, -6, 210, 9], [50, 22, 170, 7]] as const) {
    c.fillStyle = withAlpha(mixLab(W.sky[1], W.set, 0.4), 0.15);
    c.beginPath();
    c.ellipse(mx + dx, my + dy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the far ridge and a band of bare trees under snow, low in the window
  ridgeline(c, { x0: r.x, x1: r.x + r.w, y: 470, amp: 70, seed: 41, scale: 380, ground: 400, role: 'set' }, env);
  forestBand(c, { x0: r.x, x1: r.x + r.w, y: 492, h: 70, kind: 'bare', density: 5, seed: 17, snow: 0.6, ground: 300 }, env);
  // snow on the near field (pale, under the moon)
  const field = c.createLinearGradient(0, 488, 0, r.y + r.h);
  field.addColorStop(0, mixLab(W.haze, W.rim, 0.35));
  field.addColorStop(1, mixLab(W.set, W.haze, 0.6));
  c.fillStyle = field;
  c.fillRect(r.x, 496, r.w, r.y + r.h - 496);
}

/** the paper lantern (ch02-s07's, scaled): ribbed paper glowing from within, ink cap and base, on its cord */
function lantern(c: C, env: PaintEnv, t: number) {
  const L = LANTERN;
  // the iron crook: a thin pole on a small foot, a curled arm, the hook
  const iron = env.fill('ink');
  c.fillStyle = iron;
  c.strokeStyle = iron;
  c.fillRect(STAND_X - 22, SILL_Y - 5, 44, 5);
  c.beginPath();
  c.moveTo(STAND_X - 14, SILL_Y - 5);
  c.quadraticCurveTo(STAND_X, SILL_Y - 16, STAND_X + 14, SILL_Y - 5);
  c.fill();
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(STAND_X, SILL_Y - 8);
  c.lineTo(STAND_X, CROOK.y + 26);
  c.bezierCurveTo(STAND_X, CROOK.y - 14, CROOK.x + 6, CROOK.y - 22, CROOK.x + 2, CROOK.y);
  c.stroke();
  c.lineWidth = 2;
  c.beginPath();
  c.arc(STAND_X + 9, CROOK.y + 12, 8, Math.PI * 0.2, Math.PI * 1.3);
  c.stroke();
  // the cord (still: the lantern is steady); a breath of sway in the haze, under a pixel
  const sway = 0.004 * Math.sin(tq12(t) * 0.9);
  c.save();
  c.translate(CROOK.x, CROOK.y + 2);
  c.rotate(sway);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, L.y - CROOK.y - L.ry - 12);
  c.stroke();
  c.translate(0, L.y - CROOK.y - 2);
  // paper body: lit from within, warm at the heart, ink ribs
  const g = c.createRadialGradient(0, 6, 3, 0, 0, L.ry);
  g.addColorStop(0, mixLab(A.core, '#fff3d6', 0.3));
  g.addColorStop(0.55, mixLab(A.core, A.halo, 0.45));
  g.addColorStop(1, mixLab(A.halo, A.set, 0.42));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, L.rx, L.ry, 0, 0, Math.PI * 2);
  c.fill();
  // the wick's small flame seen through the paper
  const fk = 1 + 0.05 * vnoise2(t * 7.5, 3.3);
  const fg2 = c.createRadialGradient(0, 12, 0, 0, 10, 16 * fk);
  fg2.addColorStop(0, withAlpha('#fff6dc', 0.9));
  fg2.addColorStop(1, withAlpha(A.core, 0));
  c.fillStyle = fg2;
  c.fillRect(-18, -8, 36, 40);
  c.strokeStyle = withAlpha(env.mood.ink, 0.5);
  c.lineWidth = 1.6;
  for (const rx of [L.rx * 0.36, L.rx * 0.72]) {
    c.beginPath();
    c.ellipse(0, 0, rx, L.ry - 1, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.strokeStyle = withAlpha(env.mood.ink, 0.3);
  c.lineWidth = 1;
  for (const yy of [-0.62, -0.25, 0.25, 0.62]) {
    const hw = L.rx * Math.sqrt(1 - yy * yy);
    c.beginPath();
    c.moveTo(-hw, yy * L.ry);
    c.quadraticCurveTo(0, yy * L.ry + 2.5, hw, yy * L.ry);
    c.stroke();
  }
  c.fillStyle = iron;
  c.fillRect(-15, -L.ry - 8, 30, 10);
  c.fillRect(-13, L.ry - 3, 26, 9);
  c.fillRect(-2.5, -L.ry - 13, 5, 6);
  c.restore();
}

/** the inner sill: a thick moulded board right across the frame, its top lit by the lantern near it */
function sill(c: C, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(-300, SILL_Y, 1900, 14);
  c.fillRect(-300, SILL_Y + 14, 1900, 6);
  c.fillRect(-300, SILL_Y + 20, 1900, 360);
  // the moulding's shadow line and the apron below
  c.fillStyle = withAlpha(env.mood.fg, 0.8);
  c.fillRect(-300, SILL_Y + 14, 1900, 2.5);
  c.fillRect(-300, SILL_Y + 46, 1900, 2);
  // the top edge: cool from the window, warm near the lantern
  c.fillStyle = withAlpha(env.mood.rim, 0.3);
  c.fillRect(-300, SILL_Y - 0.6, 1900, 1.3);
  const g = c.createLinearGradient(LANTERN.x - 300, 0, LANTERN.x + 300, 0);
  g.addColorStop(0, withAlpha(A.rim, 0));
  g.addColorStop(0.5, withAlpha(A.rim, 0.55));
  g.addColorStop(1, withAlpha(A.rim, 0));
  c.fillStyle = g;
  c.fillRect(LANTERN.x - 300, SILL_Y - 0.6, 600, 1.6);
  // the lantern's pool on the sill top (a sliver: the board seen almost edge-on)
  const pg = c.createRadialGradient(LANTERN.x, SILL_Y + 3, 0, LANTERN.x, SILL_Y + 3, 170);
  pg.addColorStop(0, withAlpha(A.halo, 0.32));
  pg.addColorStop(1, withAlpha(A.halo, 0));
  c.fillStyle = pg;
  c.fillRect(LANTERN.x - 170, SILL_Y, 340, 14);
}

/** the card with his words (EB Garamond on lamp-warmed paper); drawn at its centre, upright */
function quoteCardPaper(c: C, env: PaintEnv, light: number) {
  const w = CARD.w, h = CARD.h;
  // paper: cool in the moonlight, warmed on the lantern side
  const paper = mixLab(mixLab(W.rim, W.core, 0.45), A.core, 0.18 + 0.2 * light);
  c.fillStyle = withAlpha(env.mood.fg, 0.45);
  c.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  const sh = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  sh.addColorStop(0, withAlpha(A.halo, 0.2 * light));
  sh.addColorStop(1, withAlpha(W.set, 0.16));
  c.fillStyle = sh;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = withAlpha(env.mood.rim, 0.4);
  c.fillRect(-w / 2, -h / 2, w, 1.2);
  const ink = mixLab(env.mood.ink, paper, 0.1);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `italic 400 28px ${FONT.text}`;
  c.fillText(QUOTE, 0, -10);
  c.globalAlpha *= 0.78;
  c.fillRect(-16, 8, 32, 0.9);
  c.font = `400 15px ${FONT.text}`;
  const lines = wrapLines(c, ATTR, `400 15px ${FONT.text}`, w - 30, 60);
  lines.forEach((ln, i) => c.fillText(ln, 0, 28 + i * 18));
}

/** the card's path: it drifts down past the glass like a leaf (on the twos), slows, and settles on the sill */
function cardPose(t: number, b2: number, land: number) {
  const t0 = b2 - 0.12;
  const u = clamp01((tq12(t) - t0) / (land - t0));
  if (t < t0) return null;
  const e = 1 - Math.pow(1 - u, 2.2);
  const y = lerp(-180, CARD_REST.y, e);
  const sway = (1 - e) * (1 - e);
  const x = CARD_REST.x + 70 * sway * Math.sin(u * Math.PI * 2.4 + 0.4) + 24 * (1 - e);
  const rot = CARD.rot + 0.42 * sway * Math.sin(u * Math.PI * 2.4 + 1.6);
  return { x, y, rot, settled: u >= 1 };
}

// ------------------------------------------------------------------------------------------------ the shot
export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    tl.hold(0, D);
    const b2 = T.beat('b2');
    return { tl, D, b1: T.beat('b1'), b2, land: T.word('L1511', 'over') + 0.05, end: T.line('L1511').end };
  },
  paint(f, _s, sc) {
    const t = f.t;
    // the push: one slow ease over the whole shot (the lantern's flame never drops)
    const u = sm(t / sc.D) * 0.35 + 0.65 * (1 - Math.pow(1 - clamp01(t / sc.D), 1.6));
    const cam = mixFrame(CAM0, CAM1, u);
    f.camera(cam);
    f.setMood('winterBlue');
    f.backlight({ sunX: 860, sunY: 160, sunRadius: 380, intensity: 0.7 });

    f.layer('L1', (c, env) => {
      const r = overscan(LAYERS.L1, CAMS, 60);
      f.cached(`${ID}/L1/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        farNight(cc, env, r);
      })(c, r.x, r.y);
      // far snow (small, slow)
      snow(c, { area: { x: r.x, y: r.y, w: r.w, h: r.h }, count: 160, salt: 11, wind: 9, fall: 26, depthRange: [0, 0.45], color: W.core }, env);
    });
    // outside the glass: one near bare branch crossing the upper panes, and the nearer snow
    f.layer(OUT_NEAR, (c, env) => {
      f.cached(`${ID}/branch/${env.mood.id}`, 900, 600, (cc) => {
        cc.translate(-500, 50);
        tree(cc, { x: 1240, y: 760, h: 760, kind: 'oak', seed: 7, snow: 0.55, lean: -0.5, detail: 0.85, role: 'set' }, env);
      })(c, 500, -50);
      snow(c, { area: { x: 120, y: -120, w: 1100, h: 820 }, count: 70, salt: 23, wind: 12, fall: 34, depthRange: [0.45, 0.85], color: W.core, size: 0.9 }, env);
    });
    f.fog({ yCenter: 0.62 * 720, height: 0.32 * 720, alpha: 0.12, drift: 5 });

    // the room wall with the window hole, the snow banked on the outer ledge, frost, the bars, the lantern's
    // reflection in the glass
    f.layer(WALL_L, (c, env) => {
      f.cached(`${ID}/wall/${env.mood.id}`, 2400, 1600, (cc) => {
        cc.translate(600, 500);
        // the drift on the outer ledge, seen through the lower panes (pale under the moon)
        const bank = new Path2D();
        bank.moveTo(WIN.x - 4, WIN.y + WIN.h + 2);
        for (let x = WIN.x - 4; x <= WIN.x + WIN.w + 4; x += 8) {
          const h = 18 + 7 * Math.sin(x * 0.013 + 1) + 4 * Math.sin(x * 0.041) + 9 * Math.exp(-(((x - WIN.x - 40) / 70) ** 2));
          bank.lineTo(x, WIN.y + WIN.h - h);
        }
        bank.lineTo(WIN.x + WIN.w + 4, WIN.y + WIN.h + 2);
        bank.closePath();
        cc.fillStyle = mixLab(W.haze, W.rim, 0.5);
        cc.fill(bank);
        cc.save();
        cc.clip(bank);
        const bg = cc.createLinearGradient(0, WIN.y + WIN.h - 34, 0, WIN.y + WIN.h);
        bg.addColorStop(0, withAlpha(W.core, 0.35));
        bg.addColorStop(1, withAlpha(W.set, 0.4));
        cc.fillStyle = bg;
        cc.fillRect(WIN.x - 10, WIN.y + WIN.h - 40, WIN.w + 20, 44);
        cc.restore();
        frost(cc, env);
        // the wall: dark plaster with the window HOLE (evenodd), a faint cool spill around the reveal
        const wall = mixLab(mixLab(env.fill('set'), env.mood.fg, 0.72), PUPPET_NEAR_BLACK, 0.42);
        cc.fillStyle = wall;
        cc.beginPath();
        cc.rect(-600, -500, 2400, 1600);
        cc.rect(WIN.x, WIN.y, WIN.w, WIN.h);
        cc.fill('evenodd');
        const spill = cc.createRadialGradient(WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.45, WIN.w * 0.4, WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.45, WIN.w * 0.95);
        spill.addColorStop(0, withAlpha(W.setHaze, 0.3));
        spill.addColorStop(1, withAlpha(W.setHaze, 0));
        cc.save();
        cc.beginPath();
        cc.rect(-600, -500, 2400, 1600);
        cc.rect(WIN.x, WIN.y, WIN.w, WIN.h);
        cc.clip('evenodd');
        cc.fillStyle = spill;
        cc.fillRect(-600, -500, 2400, 1600);
        // the lantern's warmth on the plaster beside the reveal
        const wg = cc.createRadialGradient(LANTERN.x, LANTERN.y + 20, 10, LANTERN.x, LANTERN.y + 20, 420);
        wg.addColorStop(0, withAlpha(A.halo, 0.14));
        wg.addColorStop(1, withAlpha(A.halo, 0));
        cc.fillStyle = wg;
        cc.fillRect(LANTERN.x - 420, LANTERN.y - 400, 840, 820);
        cc.restore();
        // the reveal: the jambs' inner faces and the head, a stop lighter where the moonlight grazes them
        const rv = 26;
        cc.fillStyle = mixLab(wall, W.setHaze, 0.35);
        cc.beginPath();
        cc.moveTo(WIN.x - 22, WIN.y - 22);
        cc.lineTo(WIN.x - 22 - rv, WIN.y - 22 - rv);
        cc.lineTo(WIN.x - 22 - rv, WIN.y + WIN.h + 6);
        cc.lineTo(WIN.x - 22, WIN.y + WIN.h);
        cc.closePath();
        cc.fill();
        cc.fillStyle = mixLab(wall, W.setHaze, 0.12);
        cc.beginPath();
        cc.moveTo(WIN.x + WIN.w + 22, WIN.y - 22);
        cc.lineTo(WIN.x + WIN.w + 22 + rv, WIN.y - 22 - rv);
        cc.lineTo(WIN.x + WIN.w + 22 + rv, WIN.y + WIN.h + 6);
        cc.lineTo(WIN.x + WIN.w + 22, WIN.y + WIN.h);
        cc.closePath();
        cc.fill();
        cc.fillStyle = mixLab(wall, W.setHaze, 0.22);
        cc.beginPath();
        cc.moveTo(WIN.x - 22, WIN.y - 22);
        cc.lineTo(WIN.x - 22 - rv, WIN.y - 22 - rv);
        cc.lineTo(WIN.x + WIN.w + 22 + rv, WIN.y - 22 - rv);
        cc.lineTo(WIN.x + WIN.w + 22, WIN.y - 22);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(W.rim, 0.12);
        cc.lineWidth = 1.2;
        cc.strokeRect(WIN.x - 22 - rv, WIN.y - 22 - rv, WIN.w + 44 + 2 * rv, WIN.h + 28 + rv);
        glazing(cc, env);
      })(c, -600, -500);
      // the lantern caught in the old glass behind it: a dim warm ghost, trembling a little
      c.save();
      c.beginPath();
      c.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      c.clip();
      const jx = 2.2 * vnoise2(t * 1.4, 2.1), jy = 1.5 * vnoise2(t * 1.1, 5.3);
      const rx = LANTERN.x + 38 + jx, ry = LANTERN.y - 8 + jy;
      warmGlow(c, rx, ry, 72, 0.42);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(A.halo, 0.12);
      c.beginPath();
      c.ellipse(rx, ry, LANTERN.rx * 0.9, LANTERN.ry * 0.9, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
    f.fog('B');

    // the action plane: the sill, the lantern on its crook, the card
    const cp = cardPose(t, sc.b2, sc.land);
    f.layer('L4', (c, env) => {
      sill(c, env);
      lantern(c, env, t);
      if (cp) {
        c.save();
        c.translate(cp.x, cp.y);
        c.rotate(cp.rot);
        const light = clamp01(1 - Math.abs(cp.x - LANTERN.x) / 520);
        quoteCardPaper(c, env, light);
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });
    // the lantern's own light (amber, additive) after the rim, so its halo wraps the card's near edge
    f.layer('L4', (c) => {
      const k = 1 + 0.035 * vnoise2(t * 6, 1.3);
      warmGlow(c, LANTERN.x, LANTERN.y + 8, 240 * k, 1);
    });
    // a heavy curtain edge at frame left, near and soft
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/curtain/${env.mood.id}`, 360, 1300, (cc) => {
        cc.translate(260, 300);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(-260, -300);
        cc.lineTo(40, -300);
        for (let y = -300; y <= 1000; y += 20) cc.lineTo(40 + 16 * Math.sin(y * 0.011) + 9 * Math.sin(y * 0.031 + 2), y);
        cc.lineTo(-260, 1000);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
        cc.lineWidth = 2;
        for (const fx of [-40, -120, -190]) {
          cc.beginPath();
          cc.moveTo(fx, -300);
          for (let y = -300; y <= 1000; y += 20) cc.lineTo(fx + 10 * Math.sin(y * 0.012 + fx), y);
          cc.stroke();
        }
      })(c, -100, -300);
      // the right curtain, gathered at its tieback in the lower-right corner: it stays all shot (multiplane read)
      f.cached(`${ID}/tieback/${env.mood.id}`, 900, 1500, (cc) => {
        cc.translate(260, 900);
        cc.fillStyle = env.fill('fg');
        const edge = new Path2D();
        edge.moveTo(300, -900);
        edge.bezierCurveTo(150, -640, -40, -260, 0, -4);
        edge.bezierCurveTo(-70, 50, -190, 240, -210, 600);
        const body = new Path2D(edge);
        body.lineTo(640, 600);
        body.lineTo(640, -900);
        body.closePath();
        cc.fill(body);
        // the moonlight grazing the fabric on the window side: a soft sheen just inside the contour, and the lit edge
        cc.save();
        cc.clip(body);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.09);
        cc.lineWidth = 46;
        cc.stroke(edge);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
        cc.lineWidth = 16;
        cc.stroke(edge);
        cc.restore();
        cc.strokeStyle = withAlpha(env.mood.rim, 0.26);
        cc.lineWidth = 2;
        cc.stroke(edge);
        // folds: a few long soft lines converging on the tie
        cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
        cc.lineWidth = 2.2;
        for (const fx of [60, 130, 220]) {
          cc.beginPath();
          cc.moveTo(260 + fx, -900);
          cc.quadraticCurveTo(80 + fx * 0.6, -200, 20 + fx * 0.15, -2);
          cc.quadraticCurveTo(fx * 0.4 - 50, 260, fx - 110, 600);
          cc.stroke();
        }
        // the tieback cord around the gather, its tassel hanging on the window side
        cc.fillStyle = mixLab(env.fill('fg'), PUPPET_NEAR_BLACK, 0.6);
        cc.beginPath();
        cc.ellipse(60, 0, 74, 9, -0.08, 0, Math.PI * 2);
        cc.fill();
        cc.beginPath();
        cc.moveTo(-4, 2);
        cc.quadraticCurveTo(-14, 30, -10, 54);
        cc.lineTo(-24, 98);
        cc.lineTo(6, 98);
        cc.lineTo(-4, 54);
        cc.quadraticCurveTo(-2, 30, 6, 4);
        cc.closePath();
        cc.fill();
        // the faintest warm catch on the gather's lantern-facing edge
        cc.strokeStyle = withAlpha(A.rim, 0.12);
        cc.lineWidth = 1.6;
        cc.beginPath();
        cc.moveTo(-6, -40);
        cc.quadraticCurveTo(-4, -12, 0, -4);
        cc.stroke();
      })(c, TIE.x - 260, TIE.y - 900);
    });

    // ---- type: the date stamp (date only, the 1990s-on mono face) and his name card, both on 'Widrow'
    const tenv = { t, mood: f.mood, seed: 1511 };
    dateStamp(f.c, '30 SEPTEMBER 2025', t, sc.b1 - 0.1, sc.D);
    nameCard(f.c, { name: 'Bernard Widrow', role: 'died 30 September 2025, aged 95', at: sc.b1 + 0.3, dur: Math.min(4.2, sc.b2 - sc.b1 - 0.5), align: 'right', x: 1228, y: 612 }, tenv);
  },
});

/** a date-only stamp in the modern mono face (bottom left, a tick and an index rule, as the kit's placeStamp) */
function dateStamp(c: C, text: string, t: number, at: number, D: number) {
  const A0 = win(t, at, at + 0.6) * (1 - win(t, D - 0.6, D - 0.1));
  if (A0 <= 0.003) return;
  const m = MOODS.winterBlue;
  const x = 48, y = 672, size = 18.5;
  c.save();
  c.globalAlpha = A0;
  softPlate(c, x + 120, y - 6, 420, 90, m.ink, 0.5);
  c.fillStyle = textColor(m);
  const k = win(t, at, at + 0.6);
  const w = drawTracked(c, text, x - (1 - k) * 10, y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: 'left' });
  c.globalAlpha = A0 * 0.6;
  c.fillRect(x, y - size - 10, w * win(t, at + 0.2, at + 0.9), 0.8);
  c.fillRect(x, y - size - 14, 0.8, 8);
  c.restore();
}
