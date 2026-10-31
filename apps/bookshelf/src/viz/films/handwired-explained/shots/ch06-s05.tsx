/**
 * ch06-s05 — TWO DESKS, ONE BIT (scene, the clock room, candleAmber; paperWipe in; 24.04 s).
 *   L0613 "Replay one session at two frame rates, and the familiar loop drifts up to three hundred and fifty-nine pixels
 *          apart."
 *   L0614 "Handwired saves only at events and fixed checkpoints. Other frames replay from the last save, are drawn, and
 *          thrown away. In its tests, every frame rate then matches exactly."
 *
 * Wide, split-screen held throughout: two small paper HandwiredOS desks side by side in the clock room, one window
 * each, the same recorded drag replaying on both from one paper TAPE that runs under them (a playhead between the
 * desks; copper event marks, ink checkpoint marks evenly spaced). Each desk's brass plaque (above its top-left corner)
 * is cut with its rate: 10 and 120. Each desk carries its HandwiredOS dressing (menu bar, a dim closed window, the dock
 * and its copper wire, paper grain) under its own hanging lamp's warm pool. The left desk's window and ghost move in
 * tenth-of-a-second jumps (two faint strobe outlines of its last steps, a faint shutter dip on each step); the right
 * one smoothly (a soft smear).
 *
 * Numbers (HL18, HL11, HL10, HL14): the familiar order (input, then animation; in a float64 copy) drifts up to 359 px
 * between 10 and 120 fps at shared timestamps; Handwired writes back only at events and settle checks, every other
 * frame is a preview from the last commit, thrown away; in the repo's spring-matrix tests, with events in order and no
 * snap, every frame rate matches in every bit.
 *
 * TEACHES, word by word:
 *   desks (0.40)      the two desks replay the same session, 10 (stepped) and 120 (smooth)
 *   familiar (3.58)   a GHOST of each window follows the familiar loop (input, then the animation stepped by the
 *                     frame's time); the ghosts drift apart; the first label inks; the DRIFT GAUGE between the desks
 *                     swings, reaching 359 on 'pixels' (its reading on a paper tag under it); both ghosts are projected
 *                     onto the shared tape as two copper ticks with a bracket that widens with the gauge
 *   saves (8.91)      heavier COMMITTED CARDS are laid on each desk, only as an event mark or a checkpoint mark passes
 *                     the playhead (both desks at the same marks)
 *   replay (13.43)    each desk's displayed frame is drawn on a sheet of CARBON PAPER worked out from its last committed
 *                     card (a thread from the card); 'drawn' (15.93) it lights; 'thrown' (16.91) it slides off into the
 *                     CARBON-COPY TRAY between the desks and is gone; the committed cards stay
 *   tests (18.71)     the ghosts fade; the two real windows lock into the same place (a copper hairline joins them);
 *                     32-cell BIT-STRIPS under the desks light cell for cell in brass, identical, and one scan runs
 *                     across both together (lock+0.6); the gauge falls to 0; the
 *                     second label replaces the first and stays. Hold on the two locked desks.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, ease5, inkCol, lerp, lin, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s05';
const INK = '#0b0d0b';

/** the desks (L4 px): 16:10 paper desktops in thin black card frames */
const DW = 470, DH = DW * 0.625;
const DESKS = [
  { x: 92, y: 100, fps: 10, plaque: '10' },
  { x: 718, y: 100, fps: 120, plaque: '120' },
];
const WINW = 116, WINH = 84;
/** the desk is a 1280 px page drawn 470 wide */
const PAGE_K = DW / 1280;
const GAUGE = { x: 640, y: 222, r: 50 };
/** bit-strips just under the desk frames (raised), the table top, the tape and the label pulled up */
const STRIPS_Y = 420;
const TABLE_Y = 446;
const TAPE = { y: 456, h: 30, x0: 40, x1: 1240, head: 640, speed: 46 };
const TRAY = { x: 640, y: 422 };
const LABEL_Y = 528;
/** a hanging lamp over each desk (L4 px): the shade's mouth */
const LAMPS = [
  { x: 327, y: 40, seed: 81 },
  { x: 953, y: 40, seed: 83 },
];

interface Beats {
  D: number;
  desks: number;
  ghost: number;
  pixels: number;
  save: number;
  rehearsal: number;
  drawn: number;
  thrown: number;
  lock: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      desks: T.beat('desks'),
      ghost: T.beat('ghost'),
      pixels: T.word('L0613', 'pixels'),
      save: T.beat('save'),
      rehearsal: T.beat('rehearsal'),
      drawn: T.word('L0614', 'drawn'),
      thrown: T.beat('thrown'),
      lock: T.beat('lock'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 290, r: 360 }, lightGap: 120, sunX: 640, sunY: 300 });
    f.layer('L4', (c, env) => {
      // a long dark table under both desks (its top raised: the dark band is shallower)
      c.fillStyle = INK;
      c.fillRect(-300, TABLE_Y, 1880, 500);
      // the lamps' warm sheen on the table top, falling off toward the camera, and a little grain
      f.cached(`${ID}/table/${env.mood.id}`, 1880, 260, (cc) => {
        const g = cc.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.16));
        g.addColorStop(0.5, withAlpha(env.mood.halo, 0.05));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        cc.fillStyle = g;
        cc.fillRect(0, 0, 1880, 260);
        cc.strokeStyle = withAlpha(env.mood.halo, 0.05);
        cc.lineWidth = 1.2;
        for (let k = 0; k < 14; k++) {
          const y = 8 + k * 17 + Math.sin(k * 1.9) * 4;
          cc.beginPath();
          cc.moveTo(0, y);
          cc.bezierCurveTo(600, y + 5 * Math.sin(k), 1200, y - 6 * Math.cos(k * 1.3), 1880, y + 2);
          cc.stroke();
        }
      })(c, -300, TABLE_Y);
      c.strokeStyle = withAlpha(brassOf(env, 0.2), 0.5);
      c.lineWidth = lw(c, 1.4);
      c.beginPath();
      c.moveTo(-300, TABLE_Y + 0.5);
      c.lineTo(1580, TABLE_Y + 0.5);
      c.stroke();
      lampShades(c, env);
      tape(c, env, t, b);
      driftRuler(c, env, t, b);
      DESKS.forEach((d, i) => desk(f, c, env, t, tq, b, i));
      gauge(c, env, t, b);
      tray(c, env, t, b);
      strips(c, env, t, b);
      labels(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // a lamp over each desk: a soft warm pool on each paper desktop
    for (const L of LAMPS) f.practical({ x: L.x, y: L.y + 8, kind: 'lamp', seed: L.seed, intensity: 0.7, radius: 100 });
    clockNear(f, { key: ID, lip: 700, post: -170, postL: 1450 });
  },
});

/** wide and held; the slightest push over the shot */
function cam(t: number, b: Beats): Camera3 {
  const u = ease5(t / b.D);
  return { x: 640, y: 332 + 4 * u, z: -16 + 40 * u, lens: 1 };
}

// ------------------------------------------------------------------ the recorded session
/** session time on the tape (s) at shot time t */
const sess = (t: number, b: Beats) => Math.max(0, t - b.desks);
/** the committed window's x on the page (px of 1280): a drag back and forth that settles on springs */
function pageX(tau: number) {
  return 600 + 300 * Math.sin(0.75 * tau) + 60 * Math.sin(1.9 * tau + 1.1) * Math.exp(-0.04 * tau);
}
/** what a desk at `fps` shows at shot time t: the committed state sampled at its own frame times */
function shown(t: number, b: Beats, fps: number) {
  const tau = sess(t, b);
  return pageX(Math.floor(tau * fps + 1e-6) / fps);
}
/** the familiar loop's drift (px of the page) between the 10 and 120 fps ghosts: grows to 359 on 'pixels' */
function drift(t: number, b: Beats) {
  const up = ease5((t - (b.ghost + 0.1)) / (b.pixels - b.ghost - 0.05));
  const after = t > b.pixels ? 0.12 * Math.sin((t - b.pixels) * 1.3) - 0.06 : 0;
  return 359 * clamp01(up + after * up);
}

// ------------------------------------------------------------------ the desks
function desk(f: Frame, c: C2, env: PaintEnv, t: number, tq: number, b: Beats, i: number) {
  const d = DESKS[i];
  c.save();
  // the desk (baked): frame, paper with grain and dot grid, the lamp's warm pool, the menu bar, a second dim window
  // (closed, behind), the three-tile dock and the copper wire under it
  f.cached(`${ID}/desk${i}/${env.mood.id}`, DW + 40, DH + 40, (cc) => {
    cc.translate(-d.x + 20, -d.y + 20);
    deskArt(cc, env, d.x, d.y, i);
  })(c, d.x - 20, d.y - 20);
  // the 10 fps desk: a faint shutter flicker on each of its steps (the 120 fps desk is steady)
  if (d.fps === 10 && t > b.desks) {
    const ph = ((t - b.desks) * 10) % 1;
    if (ph < 0.42) {
      c.fillStyle = withAlpha(shadowCol, 0.08);
      c.fillRect(d.x, d.y, DW, DH);
    }
  }
  // the brass plaque, cut with its rate (above the desk's top-left corner)
  const px = d.x + 44, py = d.y - 46;
  c.fillStyle = brassOf(env, 0.25);
  c.fillRect(px - 34, py - 4, 68, 30);
  c.strokeStyle = mixLab(brassOf(env, 0), '#2a1d14', 0.5);
  c.lineWidth = lw(c, 1.2);
  c.strokeRect(px - 31, py - 1, 62, 24);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.fillStyle = mixLab('#3a2614', '#1d140d', 0.5);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(d.plaque, px, py + 11);
    textProbe(c, `${ID}-plaque${i}`, px - 31, py - 1, 62, 24, 1);
  });
  c.restore();

  // the committed cards (from 'saves'): a stack at the desk's lower-left corner, one more per mark passed
  const n = commitsAt(t, b);
  for (let k = 0; k < Math.min(n, 7); k++) {
    const fresh = k === Math.min(n, 7) - 1 ? clamp01((t - lastCommitT(t, b)) / 0.18) : 1;
    const cx = d.x + 22 + k * 3, cy = d.y + DH - 74 - k * 4 - (1 - fresh) * 18;
    c.save();
    c.globalAlpha = fresh;
    c.fillStyle = withAlpha(shadowCol, 0.4);
    c.fillRect(cx + 3, cy + 4, 56, 40);
    c.fillStyle = mixLab(cardPaper(env), '#c9b48a', 0.35);
    c.fillRect(cx, cy, 56, 40);
    c.strokeStyle = INK;
    c.lineWidth = lw(c, 2);
    c.strokeRect(cx, cy, 56, 40);
    c.fillStyle = withAlpha(INK, 0.55);
    c.fillRect(cx + 8, cy + 10, 40, 3);
    c.fillRect(cx + 8, cy + 18, 30, 3);
    c.fillRect(cx + 8, cy + 26, 36, 3);
    c.restore();
  }

  // the real window (committed state as this desk draws it); dimmed while the ghosts are the subject
  const ghostOn = seg(t, b.ghost - 0.1, b.ghost + 0.4) * (1 - seg(t, b.lock - 0.05, b.lock + 0.5));
  const realA = 1 - 0.55 * ghostOn;
  const wx = d.x + shown(t, b, d.fps) * PAGE_K - WINW / 2;
  const wy = d.y + 100;
  // how each desk moves, readable in a still: the 10 fps desk leaves three strobe outlines (its last three steps);
  // the 120 fps desk a soft continuous smear
  motionCue(c, env, t, b, i, wy, realA);
  win(c, env, wx, wy, realA, seg(t, b.lock, b.lock + 0.2) * (1 - seg(t, b.lock + 0.8, b.lock + 2.4)));

  // the ghost: the familiar loop (the 10 fps one drifts; the 120 fps one stays near), translucent; the 10 fps
  // ghost jumps in the same tenth-of-a-second steps as its desk
  if (ghostOn > 0.01) {
    const gx = ghostX(t, b, i);
    ghostWin(c, env, gx, wy + 34, ghostOn);
  }

  // the carbon sheet: worked from the last committed card, drawn, then thrown into the tray
  carbon(c, env, t, tq, b, i, wx, wy);
}
/** a desk's sampling clock: the 10 fps desk sees time in tenth-of-a-second steps */
const deskT = (t: number, b: Beats, i: number) => (DESKS[i].fps === 10 && t > b.desks ? b.desks + Math.floor((t - b.desks) * 10 + 1e-6) / 10 : t);
/** the ghost's page-px offset from the committed window (10 fps drifts far, 120 fps a little the other way) */
const ghostOff = (t: number, b: Beats, i: number) => (i === 0 ? drift(deskT(t, b, 0), b) * 0.8 : -drift(t, b) * 0.2);
/** the ghost's x (L4 px) on its desk */
function ghostX(t: number, b: Beats, i: number) {
  const d = DESKS[i];
  const wx = d.x + shown(t, b, d.fps) * PAGE_K - WINW / 2;
  return Math.max(d.x + 4, Math.min(d.x + DW - WINW - 4, wx + ghostOff(t, b, i) * PAGE_K));
}
function motionCue(c: C2, env: PaintEnv, t: number, b: Beats, i: number, wy: number, a: number) {
  const d = DESKS[i];
  if (t <= b.desks + 0.2) return;
  const ink = inkCol(env);
  c.save();
  if (d.fps === 10) {
    for (const [k, al] of [
      [1, 0.42],
      [2, 0.26],
      [3, 0.13],
    ] as const) {
      const x = d.x + shown(t - k * 0.1, b, 10) * PAGE_K - WINW / 2;
      c.globalAlpha = al * a;
      c.strokeStyle = ink;
      c.lineWidth = lw(c, 1.4);
      c.strokeRect(x, wy, WINW, WINH);
      c.fillStyle = withAlpha(ink, 0.5);
      c.fillRect(x, wy, WINW, 6);
    }
  } else {
    const x0 = d.x + shown(t - 0.3, b, 120) * PAGE_K - WINW / 2;
    const x1 = d.x + shown(t, b, 120) * PAGE_K - WINW / 2;
    if (Math.abs(x1 - x0) > 2) {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, withAlpha(ink, 0));
      g.addColorStop(1, withAlpha(ink, 0.16 * a));
      c.fillStyle = g;
      c.fillRect(Math.min(x0, x1), wy + 2, Math.abs(x1 - x0) + WINW * 0.3, WINH - 4);
    }
  }
  c.restore();
}
/** the static desk: paper, grain, a warm lamp pool, menu bar, a dim closed window, dock and copper wire */
function deskArt(c: C2, env: PaintEnv, x: number, y: number, i: number) {
  const ink = inkCol(env);
  c.fillStyle = withAlpha(shadowCol, 0.45);
  c.fillRect(x + 6, y + 9, DW, DH);
  c.fillStyle = INK;
  c.fillRect(x - 9, y - 9, DW + 18, DH + 18);
  c.fillStyle = mixLab('#dcd2c1', env.mood.halo, 0.22);
  c.fillRect(x, y, DW, DH);
  // paper grain: short seeded fibres
  for (let k = 0; k < 420; k++) {
    const gx = x + (hash1(k, 11 + i) * 0.5 + 0.5) * DW, gy = y + (hash1(k, 23 + i) * 0.5 + 0.5) * DH;
    c.fillStyle = withAlpha(k % 3 ? ink : '#ffffff', 0.05 + 0.04 * (hash1(k, 5) * 0.5 + 0.5));
    c.fillRect(gx, gy, 1 + 3 * (hash1(k, 7) * 0.5 + 0.5), 1);
  }
  // the lamp's pool: warm at the top middle, falling off to the corners
  const g = c.createRadialGradient(x + DW / 2, y + DH * 0.18, 20, x + DW / 2, y + DH * 0.3, DW * 0.75);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.22));
  g.addColorStop(0.5, withAlpha(env.mood.halo, 0.06));
  g.addColorStop(1, withAlpha(shadowCol, 0.22));
  c.fillStyle = g;
  c.fillRect(x, y, DW, DH);
  c.fillStyle = withAlpha(ink, 0.1);
  for (let gx = x + 12; gx < x + DW; gx += 22) for (let gy = y + 30; gy < y + DH; gy += 22) c.fillRect(gx, gy, 1.6, 1.6);
  // the menu bar
  const bh = DH * 0.055;
  c.fillStyle = mixLab('#efe6d4', env.mood.halo, 0.2);
  c.fillRect(x, y, DW, bh);
  c.fillStyle = withAlpha(ink, 0.55);
  c.fillRect(x, y + bh - 1, DW, 1.2);
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha(ink, 0.6);
    for (const [bx, bw] of [
      [12, 30],
      [52, 22],
      [84, 26],
      [DW - 52, 40],
    ]) c.fillRect(x + bx, y + bh * 0.4, bw, bh * 0.22);
  });
  // a second window, closed and dim, behind at the upper right
  const sx = x + DW * 0.64, sy = y + DH * 0.12, sw = DW * 0.28, sh = DH * 0.3;
  c.fillStyle = withAlpha(cardPaper(env), 0.5);
  c.fillRect(sx, sy, sw, sh);
  c.fillStyle = withAlpha(ink, 0.3);
  c.fillRect(sx, sy, sw, 9);
  c.strokeStyle = withAlpha(ink, 0.25);
  c.lineWidth = 1;
  c.strokeRect(sx, sy, sw, sh);
  for (let k = 0; k < 3; k++) c.fillRect(sx + 8, sy + 18 + k * 10, sw - 20 - k * 12, 3);
  // the dock: three tiles, and the one copper wire under it with a ring at each end
  const tw = DW * 0.045, dy = y + DH - DH * 0.13;
  for (const k of [-1, 0, 1]) {
    c.fillStyle = withAlpha(ink, 0.55);
    c.fillRect(x + DW / 2 + k * tw * 1.35 - tw / 2, dy, tw, tw);
  }
  const wy = y + DH - DH * 0.035, w0 = x + DW / 2 - DW * 0.12, w1 = x + DW / 2 + DW * 0.12;
  c.strokeStyle = withAlpha(mixLab('#b0683a', env.mood.core, 0.2), 0.8);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(w0, wy);
  c.lineTo(w1, wy);
  c.stroke();
  for (const wx of [w0, w1]) {
    c.beginPath();
    c.arc(wx, wy, 2.6, 0, Math.PI * 2);
    c.stroke();
  }
}
/** two hanging lamp shades over the desks, cords running up out of frame */
function lampShades(c: C2, env: PaintEnv) {
  c.save();
  c.fillStyle = INK;
  for (const L of LAMPS) {
    c.fillRect(L.x - 1.2, -600, 2.4, L.y + 600 - 22);
    c.beginPath();
    c.moveTo(L.x - 38, L.y + 6);
    c.quadraticCurveTo(L.x - 26, L.y - 34, L.x - 8, L.y - 40);
    c.lineTo(L.x + 8, L.y - 40);
    c.quadraticCurveTo(L.x + 26, L.y - 34, L.x + 38, L.y + 6);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.8);
    c.lineWidth = lw(c, 1.6);
    c.beginPath();
    c.moveTo(L.x - 38, L.y + 6);
    c.lineTo(L.x + 38, L.y + 6);
    c.stroke();
  }
  c.restore();
}

/** the drift, projected onto the shared tape: each ghost's page position dropped onto one shared scale as a copper
 *  tick above the tape, a bracket between them that widens with the gauge (359 page px = 359 px here) */
function driftRuler(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ghostOn = seg(t, b.ghost - 0.1, b.ghost + 0.4) * (1 - seg(t, b.lock - 0.05, b.lock + 0.6));
  if (ghostOn <= 0.01) return;
  const p0 = shown(t, b, 10) + ghostOff(t, b, 0);
  const p1 = shown(t, b, 120) + ghostOff(t, b, 1);
  const mid = (p0 + p1) / 2;
  const xa = TAPE.head + (p0 - mid), xb = TAPE.head + (p1 - mid);
  // on the dark table just under the tape: copper reads against the black
  const y = TAPE.y + TAPE.h + 4;
  const cu = copperOf(env, 0.85);
  c.save();
  c.globalAlpha = ghostOn;
  // the two ticks (where each ghost lands on the shared scale), pointing up at the tape
  c.fillStyle = cu;
  for (const x of [xa, xb]) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 7, y + 11);
    c.lineTo(x - 7, y + 11);
    c.closePath();
    c.fill();
  }
  // the bracket between them, with end serifs
  const lo = Math.min(xa, xb), hi = Math.max(xa, xb);
  if (hi - lo > 6) {
    c.strokeStyle = cu;
    c.lineWidth = lw(c, 3);
    c.beginPath();
    c.moveTo(lo, y + 11);
    c.lineTo(lo, y + 17);
    c.lineTo(hi, y + 17);
    c.lineTo(hi, y + 11);
    c.stroke();
  }
  c.restore();
}

function win(c: C2, env: PaintEnv, x: number, y: number, a: number, glow: number) {
  const ink = inkCol(env);
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(x + 4, y + 5, WINW, WINH);
  c.fillStyle = cardPaper(env);
  c.fillRect(x, y, WINW, WINH);
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(x, y, WINW, 12);
  c.strokeStyle = glow > 0 ? withAlpha(copperOf(env, 0.8), 0.6 + 0.4 * glow) : withAlpha(ink, 0.6);
  c.lineWidth = lw(c, glow > 0 ? 2.6 : 1.1);
  c.strokeRect(x, y, WINW, WINH);
  c.fillStyle = withAlpha(ink, 0.22);
  for (let k = 0; k < 4; k++) c.fillRect(x + 10, y + 24 + k * 13, WINW - 24 - (k % 2) * 22, 5);
  c.restore();
}
function ghostWin(c: C2, env: PaintEnv, x: number, y: number, a: number) {
  c.save();
  c.globalAlpha = a * 0.85;
  c.setLineDash([6, 4]);
  c.strokeStyle = mixLab(copperOf(env, 0.3), '#5a2d12', 0.3);
  c.lineWidth = lw(c, 2);
  c.strokeRect(x, y, WINW, WINH);
  c.fillStyle = withAlpha(copperOf(env, 0.2), 0.12);
  c.fillRect(x, y, WINW, WINH);
  c.setLineDash([]);
  c.fillStyle = withAlpha(copperOf(env, 0.2), 0.45);
  c.fillRect(x, y, WINW, 10);
  c.restore();
}

// ------------------------------------------------------------------ the tape: one recorded session under both desks
/** event marks (session seconds) and checkpoint marks (evenly spaced) */
const EVENTS = [1.2, 2.1, 4.6, 7.4, 9.0, 11.3, 14.4, 15.1, 18.2, 21.0];
const CHECK = 2.5;
const tapeX = (tauMark: number, tauNow: number) => TAPE.head + (tauMark - tauNow) * TAPE.speed;
function tape(c: C2, env: PaintEnv, t: number, b: Beats) {
  const tau = sess(t, b);
  const ink = inkCol(env);
  c.save();
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(TAPE.x0 + 3, TAPE.y + 4, TAPE.x1 - TAPE.x0, TAPE.h);
  c.fillStyle = mixLab(cardPaper(env), '#d8c49a', 0.3);
  c.fillRect(TAPE.x0, TAPE.y, TAPE.x1 - TAPE.x0, TAPE.h);
  // sprocket holes rolling with the tape
  c.fillStyle = withAlpha(INK, 0.55);
  const off = (tau * TAPE.speed) % 18;
  for (let x = TAPE.x0 + 6 - off; x < TAPE.x1 - 4; x += 18) if (x > TAPE.x0 + 2) c.fillRect(x, TAPE.y + 3, 6, 4);
  const saveA = seg(t, b.save - 0.1, b.save + 0.4);
  // checkpoint marks (ink, evenly spaced) and event marks (copper with a dot)
  for (let k = 0; k * CHECK < tau + 20; k++) {
    const x = tapeX(k * CHECK, tau);
    if (x < TAPE.x0 + 4 || x > TAPE.x1 - 4) continue;
    c.fillStyle = withAlpha(ink, 0.55 + 0.4 * saveA);
    c.fillRect(x - 1.2, TAPE.y + 9, 2.4, TAPE.h - 12);
  }
  for (const e of EVENTS) {
    const x = tapeX(e, tau);
    if (x < TAPE.x0 + 4 || x > TAPE.x1 - 4) continue;
    c.fillStyle = copperOf(env, 0.3 + 0.4 * saveA);
    c.fillRect(x - 1.6, TAPE.y + 6, 3.2, TAPE.h - 8);
    c.beginPath();
    c.arc(x, TAPE.y + 6, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the playhead between the desks: a brass needle over the tape
  c.save();
  c.fillStyle = INK;
  c.fillRect(TAPE.head - 2, TAPE.y - 10, 4, 10);
  c.beginPath();
  c.moveTo(TAPE.head - 8, TAPE.y - 4);
  c.lineTo(TAPE.head + 8, TAPE.y - 4);
  c.lineTo(TAPE.head, TAPE.y + 8);
  c.closePath();
  c.fill();
  const hot = markFlash(t, b);
  c.fillStyle = brassOf(env, hot);
  c.beginPath();
  c.arc(TAPE.head, TAPE.y - 10, 4 + 2 * hot, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** all marks, sorted, in session seconds */
const MARKS = (() => {
  const m = [...EVENTS];
  for (let k = 1; k * CHECK < 30; k++) m.push(k * CHECK);
  return m.sort((a, z) => a - z);
})();
/** committed cards laid so far: one per mark passed after 'saves' (both desks alike) */
function commitsAt(t: number, b: Beats) {
  if (t < b.save) return 0;
  const tau = sess(t, b), tau0 = sess(b.save, b) - 0.6;
  return 1 + MARKS.filter((m) => m > tau0 && m <= tau).length;
}
function lastCommitT(t: number, b: Beats) {
  const tau = sess(t, b), tau0 = sess(b.save, b) - 0.6;
  const passed = MARKS.filter((m) => m > tau0 && m <= tau);
  return passed.length ? passed[passed.length - 1] + b.desks : b.save;
}
const markFlash = (t: number, b: Beats) => (t < b.save ? 0 : 1 - clamp01((t - lastCommitT(t, b)) / 0.4));

// ------------------------------------------------------------------ the carbon sheet and the tray
function carbon(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, i: number, wx: number, wy: number) {
  const d = DESKS[i];
  const inU = ease5((tq - (b.rehearsal - 0.1)) / 0.5);
  if (inU <= 0) return;
  const out = ease5((tq - (b.thrown - 0.05)) / 0.7);
  if (out >= 1) return;
  // the thread from the last committed card to the sheet: worked from the last save
  const top = d.y + DH - 74 - Math.min(commitsAt(t, b), 7) * 4;
  const thr = seg(t, b.rehearsal, b.rehearsal + 0.5) * (1 - seg(t, b.thrown - 0.1, b.thrown + 0.2));
  if (thr > 0) {
    c.save();
    c.strokeStyle = withAlpha(copperOf(env, 0.6), thr);
    c.lineWidth = lw(c, 2);
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(d.x + 52, top);
    c.quadraticCurveTo(d.x + 60, wy - 6, wx + 10, wy + WINH / 2);
    c.stroke();
    c.restore();
  }
  // the sheet: a slightly larger grey-blue carbon over the window; on 'drawn' the window's lines glow on it
  const lit = seg(t, b.drawn - 0.05, b.drawn + 0.25);
  const sx0 = wx - 14, sy0 = wy - 12;
  const tx = lerp(sx0, TRAY.x - (WINW + 28) / 2, out), ty = lerp(sy0, TRAY.y - 20, out) - 60 * Math.sin(Math.PI * out);
  const x = lerp(d.x + (i === 0 ? -160 : DW + 40), tx, inU), y = lerp(sy0 - 30, ty, inU);
  const sc = 1 - 0.55 * out;
  c.save();
  c.globalAlpha = clamp01(inU * 2) * (1 - seg(out, 0.85, 1));
  c.translate(x, y);
  c.scale(sc, sc);
  c.rotate((i === 0 ? 1 : -1) * 0.12 * out);
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(4, 6, WINW + 28, WINH + 24);
  c.fillStyle = withAlpha(mixLab('#2b2e33', env.mood.ink, 0.4), 0.82);
  c.fillRect(0, 0, WINW + 28, WINH + 24);
  // the drawn window, on carbon: pale lines that light on 'drawn'
  const lc = mixLab('#a9b3bd', env.mood.core, 0.5 * lit);
  c.strokeStyle = withAlpha(lc, 0.5 + 0.5 * lit);
  c.lineWidth = lw(c, 1.6);
  c.strokeRect(14, 12, WINW, WINH);
  c.fillStyle = withAlpha(lc, 0.4 + 0.5 * lit);
  c.fillRect(14, 12, WINW, 12);
  for (let k = 0; k < 4; k++) c.fillRect(24, 36 + k * 13, WINW - 24 - (k % 2) * 22, 3);
  if (lit > 0) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(env.mood.halo, 0.18 * lit * (1 - out));
    c.fillRect(0, 0, WINW + 28, WINH + 24);
  }
  c.restore();
}
/** the carbon-copy tray between the desks */
function tray(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.rehearsal - 0.5, b.rehearsal);
  c.save();
  c.globalAlpha = 0.35 + 0.65 * a;
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(TRAY.x - 62, TRAY.y - 20);
  c.lineTo(TRAY.x - 54, TRAY.y + 14);
  c.lineTo(TRAY.x + 54, TRAY.y + 14);
  c.lineTo(TRAY.x + 62, TRAY.y - 20);
  c.lineTo(TRAY.x + 56, TRAY.y - 20);
  c.lineTo(TRAY.x + 49, TRAY.y + 8);
  c.lineTo(TRAY.x - 49, TRAY.y + 8);
  c.lineTo(TRAY.x - 56, TRAY.y - 20);
  c.closePath();
  c.fill();
  c.fillRect(TRAY.x - 4, TRAY.y + 14, 8, Math.max(0, TABLE_Y - TRAY.y - 14));
  c.strokeStyle = brassOf(env, 0.2);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(TRAY.x - 62, TRAY.y - 20);
  c.lineTo(TRAY.x - 56, TRAY.y - 20);
  c.moveTo(TRAY.x + 56, TRAY.y - 20);
  c.lineTo(TRAY.x + 62, TRAY.y - 20);
  c.stroke();
  // what has been thrown away: a dark carbon edge showing in the tray
  if (t > b.thrown + 0.6) {
    c.fillStyle = withAlpha(mixLab('#2b2e33', env.mood.ink, 0.4), 0.9);
    c.fillRect(TRAY.x - 46, TRAY.y - 4, 92, 10);
  }
  c.restore();
}

// ------------------------------------------------------------------ the drift gauge
function gauge(c: C2, env: PaintEnv, t: number, b: Beats) {
  const ink = inkCol(env);
  const fall = ease5((t - (b.lock + 0.1)) / 0.9);
  const v = drift(t, b) * (1 - fall);
  const G = GAUGE;
  c.save();
  // post and case
  c.fillStyle = INK;
  c.fillRect(G.x - 4, G.y + G.r, 8, Math.max(0, TRAY.y - 20 - (G.y + G.r)));
  c.beginPath();
  c.arc(G.x, G.y, G.r + 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = cardPaper(env);
  c.beginPath();
  c.arc(G.x, G.y, G.r, 0, Math.PI * 2);
  c.fill();
  // scale: 0 at the left, 400 at the right, a copper tick at 359
  const ang = (px: number) => Math.PI * (0.8 + 1.4 * (px / 400));
  c.strokeStyle = ink;
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  for (let p = 0; p <= 400; p += 25) {
    const a = ang(p);
    const r0 = p % 100 === 0 ? G.r - 12 : G.r - 7;
    c.moveTo(G.x + Math.cos(a) * r0, G.y + Math.sin(a) * r0);
    c.lineTo(G.x + Math.cos(a) * (G.r - 2), G.y + Math.sin(a) * (G.r - 2));
  }
  c.stroke();
  c.strokeStyle = copperOf(env, 0.6);
  c.lineWidth = lw(c, 2.6);
  c.beginPath();
  const a359 = ang(359);
  c.moveTo(G.x + Math.cos(a359) * (G.r - 14), G.y + Math.sin(a359) * (G.r - 14));
  c.lineTo(G.x + Math.cos(a359) * (G.r - 1), G.y + Math.sin(a359) * (G.r - 1));
  c.stroke();
  // the needle
  const na = ang(v);
  c.strokeStyle = INK;
  c.lineWidth = lw(c, 3);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(G.x, G.y);
  c.lineTo(G.x + Math.cos(na) * G.r * 0.75, G.y + Math.sin(na) * G.r * 0.75);
  c.stroke();
  c.fillStyle = brassOf(env, 0.4);
  c.beginPath();
  c.arc(G.x, G.y, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the reading, in whole px, on a paper tag hung under the gauge (clear of the needle's sweep)
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 20px ${FONT.mono}`, 20);
    c.save();
    c.font = `600 ${size}px ${FONT.mono}`;
    const tw = c.measureText('359 px').width + 18, th = size * 1.45;
    const ty = G.y + G.r + 16;
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(G.x - tw / 2 + 3, ty + 4, tw, th);
    c.fillStyle = cardPaper(env);
    c.fillRect(G.x - tw / 2, ty, tw, th);
    c.strokeStyle = withAlpha(ink, 0.45);
    c.lineWidth = lw(c, 1);
    c.strokeRect(G.x - tw / 2, ty, tw, th);
    c.fillStyle = brassOf(env, 0.4);
    c.beginPath();
    c.arc(G.x, ty + 3, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const s = `${Math.round(v)} px`;
    c.fillText(s, G.x, ty + th / 2 + 1);
    textProbe(c, `${ID}-gauge`, G.x - tw / 2, ty, tw, th, 1);
    c.restore();
  });
}

// ------------------------------------------------------------------ the bit-strips (on 'tests')
function strips(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.lock - 0.05, b.lock + 0.3);
  if (a <= 0) return;
  const ink = inkCol(env);
  const n = 32, cw = 12.5, gap = 1.5;
  const W = n * (cw + gap);
  DESKS.forEach((d, i) => {
    const x0 = d.x + (DW - W) / 2;
    c.save();
    c.globalAlpha = a;
    c.fillStyle = withAlpha(shadowCol, 0.5);
    c.fillRect(x0 - 3, STRIPS_Y - 3, W + 6, 26);
    // the scan: one highlight runs left to right across both strips together, cell for cell (lock+0.6 .. +1.8)
    const scanU = lin(t, b.lock + 0.6, b.lock + 1.8);
    const scanK = scanU > 0 && scanU < 1 ? scanU * n : -9;
    for (let k = 0; k < n; k++) {
      // the same bits on both desks; each cell lights in turn, the pair together; lit 1-bits take the brass accent
      const bit = hash1(k * 7 + 3, 19) > 0 ? 1 : 0;
      const on = seg(t, b.lock + 0.15 + k * 0.045, b.lock + 0.3 + k * 0.045);
      c.fillStyle = bit ? mixLab(mixLab(INK, '#3a2e22', 0.3), brassOf(env, 0.85), on) : cardPaper(env);
      c.fillRect(x0 + k * (cw + gap), STRIPS_Y, cw, 20);
      if (on > 0 && on < 1) {
        c.fillStyle = withAlpha(env.mood.core, 0.5 * (1 - Math.abs(on - 0.5) * 2));
        c.fillRect(x0 + k * (cw + gap), STRIPS_Y, cw, 20);
      }
      const sc = Math.max(0, 1 - Math.abs(k + 0.5 - scanK) / 1.6);
      if (sc > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = withAlpha(env.mood.core, 0.55 * sc);
        c.fillRect(x0 + k * (cw + gap) - 1, STRIPS_Y - 3, cw + 2, 26);
        c.restore();
      }
    }
    c.strokeStyle = withAlpha(ink, 0.6);
    c.lineWidth = lw(c, 1);
    c.strokeRect(x0, STRIPS_Y, W, 20);
    c.restore();
    void i;
  });
  // a copper hairline joining the two locked windows' left edges (same place on both pages)
  const hl = seg(t, b.lock + 0.1, b.lock + 0.5) * (1 - seg(t, b.lock + 2.6, b.lock + 3.6));
  if (hl > 0) {
    const y = DESKS[0].y + 100 - 16;
    const xa = DESKS[0].x + shown(t, b, 10) * PAGE_K - WINW / 2;
    const xb = DESKS[1].x + shown(t, b, 120) * PAGE_K - WINW / 2;
    c.save();
    c.strokeStyle = withAlpha(copperOf(env, 0.8), hl);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(xa, y);
    c.lineTo(xa, y - 10);
    c.lineTo(xb, y - 10);
    c.lineTo(xb, y);
    c.stroke();
    c.restore();
  }
}

// ------------------------------------------------------------------ labels
function labels(c: C2, env: PaintEnv, t: number, b: Beats) {
  // the swap: the first label is gone before the second inks (no ghost text)
  const out = 1 - seg(t, b.lock + 0.02, b.lock + 0.32);
  paperSlip(c, env, { lines: ['input, then animation (float64 copy): up to 359 px'], x: 640, y: LABEL_Y, t, inkAt: b.ghost + 0.25, out, id: `${ID}-l1`, size: 25 });
  paperSlip(c, env, { lines: ['in the tests: events in order, no snap'], x: 640, y: LABEL_Y, t, inkAt: b.lock + 0.4, id: `${ID}-l2`, size: 25 });
}
