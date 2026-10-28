/**
 * ch06-s01 — THE THESIS, HEARD SLOWLY (plate in the clock room, candleAmber; inkBleed in; 13.21 s).
 *   L0601 "In the docs' words: "The program runs every operation on every frame and can't stop early, so a loop
 *          becomes a count, a tree, a table, or the same work on every item.""
 *
 * An upright parchment plate stands in the clock room in front of the HOST CLOCKWORK (sets/hostClockwork, in
 * silhouette at L3), whose great round window glows behind it. The quotation is HEARD, not set: nothing of it is
 * inked on the plate. The camera starts close on the plate and pulls slowly back to the clockwork around it.
 *
 * TEACHES, word by word:
 *   title (0.30)    DEEP DIVE II · THE CLOCKWORK THAT CANNOT STOP inks on the plate's head, and stays
 *   program (2.53)  a straight ONE-WAY strip of paper track draws itself left to right with twelve stations; three
 *                   vacant dashed sockets sit under it (where a jump, a break and a repeat would go: an exit ramp, a
 *                   set of points, a loop back, all absent); 'no jump · no break · no repeat' inks under them; a brass
 *                   bead sets off from the left at an even pace and lights every station it passes, skipping none
 *   count (8.00)    the COUNT arm (a peg rail) swings out from the clockwork's hub, past the plate's edge
 *   tree (8.80)     the TREE arm (a forked thread)
 *   table (9.60)    the TABLE arm (a card drawer)
 *   same (10.74)    the SAME-WORK arm (a row of identical tiles)
 *   every (12.69)   the bead reaches the end of the track and drops off the plate into the clockwork's tray; the
 *                   escapement gives one tick; a new bead sets off from the left. The program runs once, straight
 *                   through; the repetition belongs to the host.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, drawTracked, legibleSize, measureTracked, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hostClockwork } from '../sets/hostClockwork';
import { brassBead, brassOf, clockArms, clockNear, clockRoom, clamp01, ease5, inkCol, lerp, lin, lw, plateSheet, seg, shadowCol, sm, twos } from '../sets/ch06-s01-clockroom';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s01';

/** the plate (L4 rest px) and the track on it */
const PLATE = { x: 280, y: 280, w: 720, h: 336 };
const TRACK = { x0: 352, x1: 984, y: 452, stations: 12 };
/** the clockwork behind the plate (L3 rest px): its wheel rises above the plate against the round window; the four
 *  arms fan out sideways so their tips stand in the margins left and right of the plate */
const CLK = { x: 640, y: 318, r: 236, reach: 1.22 };
const ARM_ANGLES = [-Math.PI * 0.88, -Math.PI * 0.12, Math.PI * 0.12, Math.PI * 0.88];
/** the tray the bead drops into (L4, hung off the clockwork below the plate's right corner) */
const TRAY = { x: 1064, y: 640 };
/** the hanging lamp over the plate's upper left */
const LAMP = { x: 330, y: 236 };

interface Beats {
  D: number;
  title: number;
  quote: number;
  arm: [number, number, number, number];
  every: number;
  /** the bead's run: sets off, reaches the plate's edge */
  b0: number;
  b1: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const every = T.beat('every');
    const b: Beats = {
      D: T.duration,
      title: T.beat('title'),
      quote: T.beat('quote'),
      arm: [T.beat('count'), T.beat('tree'), T.beat('table'), T.beat('same')],
      every,
      b0: T.beat('quote') + 0.7,
      b1: every - 0.3,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 318, r: 380 }, lightGap: 60, sunX: 640, sunY: 318 });
    // the clockwork, in silhouette behind the plate: four arms, the wheel, the escapement (one tick on 'every')
    f.layer('L3', (c, env) => {
      const arms = b.arm.map((a) => armSwing(t, a)) as [number, number, number, number];
      const lit = b.arm.map((a) => seg(t, a + 0.3, a + 0.45) * (1 - seg(t, a + 0.6, a + 1.6))) as [number, number, number, number];
      clockArms(c, env, { x: CLK.x, y: CLK.y, r: CLK.r, arms, lit, silhouette: true, reach: CLK.reach, angles: ARM_ANGLES, brass: true });
      // the case's two posts and the tray's bracket, down behind the plate
      c.fillStyle = env.fill('ink');
      c.fillRect(CLK.x - CLK.r * 0.62, CLK.y, 20, 420);
      c.fillRect(CLK.x + CLK.r * 0.6, CLK.y, 20, 420);
      hostClockwork(c, env, { x: CLK.x, y: CLK.y, r: CLK.r, tick: tickAt(t, b), steps: 0, silhouette: true });
      escapementFlare(c, env, t, b);
    });
    f.layer('L4', (c, env) => {
      f.cached(`${ID}/plate/${env.mood.id}`, PLATE.w + 60, PLATE.h + 60, (cc) => {
        cc.translate(-PLATE.x + 30, -PLATE.y + 30);
        plateSheet(cc, env, PLATE, { x: PLATE.x + 140, y: PLATE.y + 40 });
      })(c, PLATE.x - 30, PLATE.y - 30);
      title(c, env, t, b);
      track(c, env, t, tq, b);
      beads(c, env, t, b);
      tray(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // the lamp over the plate's upper left (its shade hangs in L4), the warm pool on the paper
    f.practical({ x: LAMP.x, y: LAMP.y + 6, kind: 'lamp', seed: 61, intensity: 0.8, radius: 110 });
    clockNear(f, { key: ID, lip: 708, post: 1420 });
  },
});

/** close on the plate, then a slow pull back (z 180 → −130) from the track's drawing to the last arm, a hair of truck */
function cam(t: number, b: Beats): Camera3 {
  const u = ease5((t - (b.quote - 0.6)) / (b.arm[0] + 0.2 - (b.quote - 0.6)));
  const z = lerp(180, -100, u) - 30 * sm(lin(t, b.arm[0] + 0.2, b.D));
  return { x: 640 + 8 * u, y: lerp(446, 384, u), z, lens: 1 };
}

/** the escapement's pivot catches the light on its one tick */
function escapementFlare(c: C2, env: PaintEnv, t: number, b: Beats) {
  const k = seg(t, b.every - 0.04, b.every + 0.06) * (1 - seg(t, b.every + 0.2, b.every + 0.8));
  if (k <= 0) return;
  const ex = CLK.x - CLK.r * 0.9, ey = CLK.y - CLK.r * 0.95;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(ex, ey, 0, ex, ey, 60);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(ex - 60, ey - 60, 120, 120);
  c.restore();
}

/** an arm's swing from straight up to its angle: 0.55 s with a small mechanical overshoot */
function armSwing(t: number, at: number) {
  const u = clamp01((t - (at - 0.12)) / 0.55);
  if (u <= 0) return 0;
  const s = 1.70158;
  const v = u - 1;
  return 1 + v * v * ((s + 1) * v + s);
}

/** the escapement: rests at 0, gives one tick as the bead lands */
function tickAt(t: number, b: Beats) {
  return lin(t, b.every - 0.02, b.every + 0.36);
}

function title(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.title, b.title + 0.7);
  if (a <= 0) return;
  const ink = inkCol(env);
  textRole(c, 'subject', () => {
    c.save();
    c.fillStyle = ink;
    // DEEP DIVE II, small caps, tracked; then the chapter's name; a short rule between two fleurons' worth of dots
    const s1 = legibleSize(c, `600 24px ${FONT.sc}`, 24);
    c.globalAlpha = a * 0.85;
    const o1 = { font: `600 ${s1}px ${FONT.sc}`, size: s1, tracking: 0.28, align: 'center' as const };
    drawTracked(c, 'DEEP DIVE II', 640, 330, o1);
    const w1 = measureTracked(c, 'DEEP DIVE II', o1);
    textProbe(c, `${ID}-dd`, 640 - w1 / 2, 330 - s1, w1, s1 * 1.2, a);
    const a2 = seg(t, b.title + 0.25, b.title + 0.95);
    c.globalAlpha = a2;
    const s2 = legibleSize(c, `600 31px ${FONT.sc}`, 31);
    const o2 = { font: `600 ${s2}px ${FONT.sc}`, size: s2, tracking: 0.04, align: 'center' as const };
    drawTracked(c, 'THE CLOCKWORK THAT CANNOT STOP', 640, 372, o2);
    const w2 = measureTracked(c, 'THE CLOCKWORK THAT CANNOT STOP', o2);
    textProbe(c, `${ID}-title`, 640 - w2 / 2, 372 - s2, w2, s2 * 1.2, a2);
    c.globalAlpha = a2 * 0.6;
    c.strokeStyle = ink;
    c.lineWidth = lw(c, 1.4);
    c.beginPath();
    c.moveTo(640 - w2 * 0.3, 390);
    c.lineTo(640 + w2 * 0.3, 390);
    c.stroke();
    c.restore();
  });
}

const stationX = (k: number) => TRACK.x0 + 30 + ((TRACK.x1 - TRACK.x0 - 60) * k) / (TRACK.stations - 1);
/** where the bead is on the strip at t (constant speed from b0 to b1) */
const beadX = (t: number, b: Beats) => lerp(TRACK.x0 + 10, TRACK.x1 - 4, lin(t, b.b0, b.b1));

/**
 * The straight, one-way strip: a paper band with a centre groove, twelve stations (each lights as the bead passes),
 * a chevron at the far end (one way), and under it three VACANT sockets drawn dashed: an exit ramp, a set of points,
 * a loop back. Their legend 'no jump · no break · no repeat' inks underneath, each phrase under its socket.
 */
function track(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const draw = seg(t, b.quote - 0.05, b.quote + 0.75);
  if (draw <= 0) return;
  const ink = inkCol(env);
  const xEnd = lerp(TRACK.x0, TRACK.x1, draw);
  const y = TRACK.y;
  c.save();
  // the paper strip (a slightly lighter band with a shadow), drawn as far as the pen has gone
  c.fillStyle = withAlpha(shadowCol, 0.18);
  c.fillRect(TRACK.x0 + 2, y - 9, xEnd - TRACK.x0, 22);
  c.fillStyle = mixLab('#f4e8cb', env.mood.core, 0.25);
  c.fillRect(TRACK.x0, y - 11, xEnd - TRACK.x0, 20);
  c.strokeStyle = withAlpha(ink, 0.75);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(TRACK.x0, y - 11);
  c.lineTo(xEnd, y - 11);
  c.moveTo(TRACK.x0, y + 9);
  c.lineTo(xEnd, y + 9);
  c.stroke();
  c.strokeStyle = withAlpha(ink, 0.3);
  c.setLineDash([6, 5]);
  c.beginPath();
  c.moveTo(TRACK.x0 + 4, y - 1);
  c.lineTo(xEnd, y - 1);
  c.stroke();
  c.setLineDash([]);
  // stations: small ink posts with a lamp-dot; each warms as the bead passes it, then cools to a kept glow
  const bx = beadX(t, b);
  for (let k = 0; k < TRACK.stations; k++) {
    const sx = stationX(k);
    if (sx > xEnd) break;
    c.fillStyle = ink;
    c.fillRect(sx - 2, y - 30, 4, 19);
    c.fillRect(sx - 7, y - 33, 14, 4);
    const passAt = lerp(b.b0, b.b1, (sx - (TRACK.x0 + 10)) / (TRACK.x1 - 4 - (TRACK.x0 + 10)));
    const hot = t >= b.b0 ? seg(tq, passAt - 0.08, passAt + 0.04) * (1 - 0.65 * seg(tq, passAt + 0.15, passAt + 0.7)) : 0;
    const pass = t >= b.b0 && bx >= sx - 1;
    c.fillStyle = pass ? mixLab(brassOf(env, hot), '#fff3d0', 0.3 * hot) : withAlpha(ink, 0.55);
    c.beginPath();
    c.arc(sx, y - 39, 4.5, 0, Math.PI * 2);
    c.fill();
    if (hot > 0.05) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(sx, y - 39, 0, sx, y - 39, 26);
      g.addColorStop(0, withAlpha(env.mood.core, 0.5 * hot));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(sx - 26, y - 65, 52, 52);
      c.restore();
    }
  }
  // the one-way chevrons printed along the strip, and the end chevron
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  for (let k = 0; k < TRACK.stations - 1; k++) {
    const cx = (stationX(k) + stationX(k + 1)) / 2;
    if (cx > xEnd) break;
    c.moveTo(cx - 3, y - 6);
    c.lineTo(cx + 2, y - 1);
    c.lineTo(cx - 3, y + 4);
  }
  c.stroke();
  if (draw > 0.98) {
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(TRACK.x1 + 2, y - 15);
    c.lineTo(TRACK.x1 + 16, y - 1);
    c.lineTo(TRACK.x1 + 2, y + 13);
    c.closePath();
    c.fill();
  }
  c.restore();
  vacant(c, env, t, b);
}

/** the three vacant sockets (dashed: nothing is there) and their legend, each phrase under its own socket */
function vacant(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.quote + 0.45, b.quote + 1.05);
  if (a <= 0) return;
  const ink = inkCol(env);
  const y = TRACK.y;
  const parts = ['no jump', 'no break', 'no repeat'];
  const sep = '  ·  ';
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `italic 500 28px ${FONT.text}`, 28);
    c.font = `italic 500 ${size}px ${FONT.text}`;
    const wSep = c.measureText(sep).width;
    const ws = parts.map((p) => c.measureText(p).width);
    const total = ws.reduce((s, w) => s + w, 0) + 2 * wSep;
    const la = seg(t, b.quote + 0.8, b.quote + 1.4);
    let x = 640 - total / 2;
    const centres: number[] = [];
    const ly = 590;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    parts.forEach((p, i) => {
      centres.push(x + ws[i] / 2);
      c.globalAlpha = la;
      c.fillStyle = ink;
      c.fillText(p, x, ly);
      x += ws[i];
      if (i < 2) {
        c.globalAlpha = la * 0.6;
        c.fillText(sep, x, ly);
        x += wSep;
      }
    });
    textProbe(c, `${ID}-vacant`, 640 - total / 2, ly - size, total, size * 1.25, la);
    // the sockets: a notch in the strip's lower edge, a dashed ghost of what is not there, a little 'empty' hatch
    c.globalAlpha = a;
    c.strokeStyle = withAlpha(ink, 0.7);
    c.lineWidth = lw(c, 1.8);
    centres.forEach((cx, i) => {
      // the socket cut-out: a small bracket under the strip
      c.setLineDash([]);
      c.beginPath();
      c.moveTo(cx - 22, y + 14);
      c.lineTo(cx - 22, y + 30);
      c.lineTo(cx + 22, y + 30);
      c.lineTo(cx + 22, y + 14);
      c.stroke();
      // the ghost of the missing part, dashed and faint
      c.save();
      c.setLineDash([5, 5]);
      c.strokeStyle = withAlpha(ink, 0.5);
      c.lineWidth = lw(c, 1.7);
      c.beginPath();
      if (i === 0) {
        // an exit ramp peeling off downward
        c.moveTo(cx - 14, y + 30);
        c.quadraticCurveTo(cx + 10, y + 46, cx + 30, y + 92);
        c.moveTo(cx + 6, y + 30);
        c.quadraticCurveTo(cx + 26, y + 44, cx + 48, y + 88);
      } else if (i === 1) {
        // a set of points: a blade that could throw the bead aside
        c.moveTo(cx - 18, y + 22);
        c.lineTo(cx + 22, y + 52);
        c.moveTo(cx + 22, y + 52);
        c.lineTo(cx + 46, y + 52);
      } else {
        // a loop back, to the left
        c.moveTo(cx + 16, y + 30);
        c.bezierCurveTo(cx + 18, y + 86, cx - 70, y + 86, cx - 80, y + 26);
        c.moveTo(cx - 86, y + 36);
        c.lineTo(cx - 80, y + 26);
        c.lineTo(cx - 72, y + 35);
      }
      c.stroke();
      c.restore();
    });
    c.restore();
  });
}

/** the bead(s): one runs the strip at an even pace; it drops off the end into the tray; a new one sets off */
function beads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const y = TRACK.y - 1;
  const r = 10;
  if (t >= b.b0 - 0.4 && t < b.b1 + 0.34) {
    let x: number, yy: number;
    const a = seg(t, b.b0 - 0.4, b.b0 - 0.05);
    if (t <= b.b1) {
      x = beadX(t, b);
      yy = y - r + 1 + (1 - a) * -16;
    } else {
      // off the end: a short ballistic arc into the tray, landing on 'every'
      const u = clamp01((t - b.b1) / (b.every - b.b1));
      x = lerp(TRACK.x1 - 4, TRAY.x, u);
      yy = lerp(y - r + 1, TRAY.y - 8, u * u) - 26 * Math.sin(Math.PI * u) * (1 - u);
    }
    c.save();
    c.globalAlpha = a;
    brassBead(c, env, x, yy, r, 0.4);
    c.restore();
  }
  // after the landing: the bead rests in the tray; a NEW bead sets off from the left
  if (t >= b.every) {
    brassBead(c, env, TRAY.x - 6, TRAY.y - 8, r, 0.2);
    const a = seg(t, b.every + 0.12, b.every + 0.4);
    const x = TRACK.x0 + 10 + Math.max(0, t - (b.every + 0.35)) * ((TRACK.x1 - TRACK.x0 - 14) / (b.b1 - b.b0));
    c.save();
    c.globalAlpha = a;
    brassBead(c, env, x, y - r + 1 - (1 - a) * 14, r, 0.4);
    c.restore();
  }
}

/** the clockwork's tray, hung below the plate's right corner (it belongs to the host, not the plate) */
function tray(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ink = env.fill('ink');
  c.save();
  c.fillStyle = ink;
  // bracket up behind the plate
  c.fillRect(TRAY.x + 30, PLATE.y + PLATE.h - 10, 8, TRAY.y - (PLATE.y + PLATE.h) + 14);
  // a shallow brass-lipped tray
  c.beginPath();
  c.moveTo(TRAY.x - 44, TRAY.y - 14);
  c.lineTo(TRAY.x - 36, TRAY.y + 8);
  c.lineTo(TRAY.x + 40, TRAY.y + 8);
  c.lineTo(TRAY.x + 48, TRAY.y - 14);
  c.lineTo(TRAY.x + 42, TRAY.y - 14);
  c.lineTo(TRAY.x + 36, TRAY.y + 2);
  c.lineTo(TRAY.x - 30, TRAY.y + 2);
  c.lineTo(TRAY.x - 38, TRAY.y - 14);
  c.closePath();
  c.fill();
  c.fillRect(TRAY.x - 36, TRAY.y - 4, 72, 12);
  const k = seg(t, b.every - 0.02, b.every + 0.1) * (1 - seg(t, b.every + 0.25, b.every + 0.9));
  c.strokeStyle = withAlpha(brassOf(env, k), 0.8);
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  c.moveTo(TRAY.x - 44, TRAY.y - 14);
  c.lineTo(TRAY.x - 38, TRAY.y - 14);
  c.moveTo(TRAY.x + 42, TRAY.y - 14);
  c.lineTo(TRAY.x + 48, TRAY.y - 14);
  c.moveTo(TRAY.x - 36, TRAY.y - 4);
  c.lineTo(TRAY.x + 36, TRAY.y - 4);
  c.stroke();
  // the hanging lamp's shade over the plate's upper left
  c.fillStyle = ink;
  c.fillRect(LAMP.x - 1, -400, 2, LAMP.y + 400 - 30);
  c.beginPath();
  c.moveTo(LAMP.x - 26, LAMP.y + 4);
  c.quadraticCurveTo(LAMP.x, LAMP.y - 38, LAMP.x + 26, LAMP.y + 4);
  c.closePath();
  c.fill();
  c.restore();
}
