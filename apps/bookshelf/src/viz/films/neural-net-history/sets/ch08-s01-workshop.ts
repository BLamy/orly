/**
 * ch08-s01 — the craftsman's workshop (2010–2011): hand-cut tin stencils (the hand-designed features of the
 * age, stylised as gradient arrows, corner marks and edge combs), a judge's lectern and a LEADERBOARD OF
 * LANTERNS (each lantern's height on a ruled scale = that year's winning top-5 error; lower is better).
 *
 * GEOGRAPHY (L4 world = rest-screen px at CAMERA3_HOME; floor y 610):
 *   back wall (L2)      plaster with two tall arched window HOLES (x 150–420, x 640–860) and a tool rail
 *   bench (L4)          x 420–640, top y 468; a hanging lamp above it at (530, 318)
 *   lectern (L4)        x 800, top y 420; an upright pin-board on it (the thumbnail + five guess slips)
 *   leaderboard (L3)    a ruled vertical scale (slat x 1052, ticks 19–31 %, labelled 20 / 25 / 30 % in Plex Mono)
 *                       and the two lanterns hung against it at their real heights (x 944 / 1006)
 *   thumbnail ring (L3) 25 small framed pictures round (1236, 300), r 92
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { legibleSize } from '../../../film/silhouette/type';
import { paperLantern, glow } from '../../../film/silhouette/metaphors/kit';
import { forestBand, tree } from '../../../film/silhouette/nature';
import { hash1 } from '../../../film/core/frame';
import type { Camera3 } from '../../../film/contracts';
import { huskyCanvas } from './ch08-s01-kit';

type C = CanvasRenderingContext2D;
export const WS = {
  floor: 610,
  bench: { x0: 420, x1: 640, top: 468 },
  lamp: { x: 530, y: 318 },
  lectern: { x: 800, top: 420 },
  board: { x: 800, y: 300, w: 132, h: 150 },
  /** the leaderboard's ruled scale (L3): a slat at x, 20 % at y20, perPct px per percentage point (30 % at the top) */
  scale: { x: 1052, y20: 470, perPct: 28, lo: 19, hi: 31 },
  lanterns: [
    { year: '2010', err: 28.2, x: 944 },
    { year: '2011', err: 25.8, x: 1006 },
  ],
  ring: { x: 1236, y: 300, r: 92, n: 25, dark: 7 },
  windows: [
    { x: 150, w: 270 },
    { x: 640, w: 220 },
  ],
} as const;

const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
function bake(f: Frame, c: C, key: string, r: Rect, paint: (g: C) => void, blur?: number) {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (g) => {
    g.translate(-r.x, -r.y);
    paint(g);
  }, blur ? { blur } : undefined)(c, r.x, r.y);
}

/** an arched window hole (added to a Path2D) with glazing bars drawn separately */
function archHole(p: Path2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  p.moveTo(x, y + h);
  p.lineTo(x, y + r);
  p.arc(x + r, y + r, r, Math.PI, 0);
  p.lineTo(x + w, y + h);
  p.closePath();
}

// ------------------------------------------------------------------------------------------------ the stencil motifs
export type Motif = 'arrows' | 'corner' | 'comb' | 'ring' | 'diag';
const MOTIFS: Motif[] = ['arrows', 'corner', 'comb', 'diag', 'ring', 'arrows', 'comb', 'corner'];
/** a small tin plate (w × w) with its pierced pattern: holes cut evenodd so light shows through */
export function tinPlate(c: C, env: PaintEnv, x: number, y: number, w: number, motif: Motif, o: { lit?: number; ink?: string } = {}) {
  const p = new Path2D();
  p.rect(x - w / 2, y - w / 2, w, w);
  const h = new Path2D();
  const s = w / 10;
  if (motif === 'arrows') {
    // a little bank of gradient arrows: short slits with heads
    for (let k = 0; k < 3; k++) {
      const yy = y - 3 * s + k * 3 * s;
      h.rect(x - 3 * s, yy - 0.4 * s, 4.4 * s, 0.8 * s);
      h.moveTo(x + 1.4 * s, yy - 1.3 * s);
      h.lineTo(x + 3.4 * s, yy);
      h.lineTo(x + 1.4 * s, yy + 1.3 * s);
      h.closePath();
    }
  } else if (motif === 'corner') {
    h.rect(x - 3 * s, y - 3 * s, 5.5 * s, 1.1 * s);
    h.rect(x - 3 * s, y - 3 * s, 1.1 * s, 5.5 * s);
    h.rect(x + 0.5 * s, y + 0.5 * s, 2.5 * s, 2.5 * s);
  } else if (motif === 'comb') {
    for (let k = 0; k < 5; k++) h.rect(x - 3.5 * s + k * 1.6 * s, y - 3.2 * s, 0.7 * s, 6.4 * s);
  } else if (motif === 'diag') {
    for (let k = -2; k <= 2; k++) {
      h.moveTo(x - 3.5 * s + k * 1.8 * s, y + 3.5 * s);
      h.lineTo(x - 2.7 * s + k * 1.8 * s, y + 3.5 * s);
      h.lineTo(x + 3.5 * s + k * 1.8 * s, y - 3.5 * s);
      h.lineTo(x + 2.7 * s + k * 1.8 * s, y - 3.5 * s);
      h.closePath();
    }
  } else {
    h.moveTo(x + 3 * s, y);
    h.arc(x, y, 3 * s, 0, Math.PI * 2);
    h.moveTo(x + 1.6 * s, y);
    h.arc(x, y, 1.6 * s, 0, Math.PI * 2, true);
  }
  const plate = new Path2D();
  plate.addPath(p);
  plate.addPath(h);
  c.fillStyle = o.ink ?? env.fill('ink');
  c.fill(plate, 'evenodd');
  if ((o.lit ?? 0) > 0) {
    c.fillStyle = withAlpha(env.mood.core, 0.55 * (o.lit ?? 0));
    c.fill(h, 'evenodd');
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.35);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(x - w / 2, y - w / 2);
  c.lineTo(x + w / 2, y - w / 2);
  c.stroke();
}

// ------------------------------------------------------------------------------------------------ L1 + L2 back wall
export function workshopBack(f: Frame, key: string, cams: Camera3[]) {
  // the view through the windows: a far yard of bare trees and rooftops in the evening haze
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, cams, 80);
    bake(f, c, `${key}/ws/L1/${env.mood.id}/${rk(r)}`, r, (g) => {
      g.fillStyle = env.fill('set');
      const roofs = new Path2D();
      roofs.moveTo(r.x, 560);
      let x = r.x;
      let k = 0;
      while (x < r.x + r.w) {
        const w = 70 + 90 * hash1(k, 11);
        const h = 40 + 70 * hash1(k, 12);
        roofs.lineTo(x, 520 - h);
        roofs.lineTo(x + w * 0.5, 490 - h - 30 * hash1(k, 13));
        roofs.lineTo(x + w, 520 - h);
        if (hash1(k, 14) > 0.6) {
          roofs.lineTo(x + w * 0.8, 520 - h);
          roofs.lineTo(x + w * 0.8, 470 - h);
          roofs.lineTo(x + w * 0.88, 470 - h);
          roofs.lineTo(x + w * 0.88, 520 - h);
        }
        x += w;
        k++;
      }
      roofs.lineTo(r.x + r.w, 560);
      roofs.lineTo(r.x + r.w, r.y + r.h);
      roofs.lineTo(r.x, r.y + r.h);
      roofs.closePath();
      g.fill(roofs);
      forestBand(g, { x0: r.x, x1: r.x + r.w, y: 500, h: 150, kind: 'bare', density: 2.5, seed: 808 }, env);
      for (const [tx, th] of [[300, 330], [720, 300], [1060, 360]] as const) tree(g, { x: tx, y: 520, h: th, kind: 'elm', seed: tx, detail: 0.7 }, env);
    });
  });
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    bake(f, c, `${key}/ws/L2/${env.mood.id}/${rk(r)}`, r, (g) => {
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.2);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      for (const w of WS.windows) archHole(p, w.x, 70, w.w, 430);
      g.fillStyle = wall;
      g.fill(p, 'evenodd');
      // the lamp's warmth on the plaster, low and to the left
      const pool = g.createRadialGradient(660, 380, 30, 660, 380, 900);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.25), 0.7));
      pool.addColorStop(1, withAlpha(wall, 0));
      g.save();
      g.clip(p, 'evenodd');
      g.fillStyle = pool;
      g.fillRect(r.x, r.y, r.w, r.h);
      // plaster joints and a dado rail
      g.strokeStyle = withAlpha(env.mood.rim, 0.08);
      g.lineWidth = 1.2;
      for (let y = 40; y < 700; y += 64) {
        g.beginPath();
        g.moveTo(r.x, y + hash1(y, 3) * 4);
        g.lineTo(r.x + r.w, y + hash1(y, 4) * 4);
        g.stroke();
      }
      g.fillStyle = withAlpha(env.mood.fg, 0.55);
      g.fillRect(r.x, 520, r.w, 10);
      g.restore();
      // glazing bars and sills (ink)
      g.fillStyle = env.fill('ink');
      for (const w of WS.windows) {
        const bars = 3;
        for (let k = 1; k < bars; k++) g.fillRect(w.x + (w.w * k) / bars - 3, 70, 6, 430);
        for (let j = 1; j < 6; j++) g.fillRect(w.x, 70 + w.w / 2 + j * ((430 - w.w / 2) / 6) - 3, w.w, 6);
        g.fillRect(w.x - 14, 498, w.w + 28, 14);
        // the arch's tracery: a quatrefoil roundel
        g.beginPath();
        g.arc(w.x + w.w / 2, 70 + w.w * 0.42, w.w * 0.13, 0, Math.PI * 2);
        g.lineWidth = 6;
        g.strokeStyle = env.fill('ink');
        g.stroke();
      }
      // the tool rail between the windows: finished stencils hang on hooks like tools
      const railY = 170;
      for (const [x0, x1] of [[-80, 130], [445, 615]] as const) {
        g.fillStyle = env.fill('ink');
        g.fillRect(x0, railY - 6, x1 - x0, 7);
        let k = 0;
        for (let x = x0 + 22; x < x1 - 14; x += 42) {
          g.fillRect(x - 0.8, railY, 1.6, 10);
          tinPlate(g, env, x, railY + 30 + (k % 2) * 6, 30, MOTIFS[(k + Math.round(x)) % MOTIFS.length], { ink: mixLab(env.fill('ink'), env.fill('set'), 0.25) });
          k++;
        }
      }
    });
  });
}

// ------------------------------------------------------------------------------------------------ L3 leaderboard + ring
export interface BoardState {
  /** 0..1 each lantern glows (2010, 2011) */
  glow: [number, number];
  /** 0..1 the arc of the ring that goes dark */
  dark: number;
  /** 0..1 the leaderboard fades in */
  show: number;
}
export function leaderboard(c: C, env: PaintEnv, st: BoardState) {
  const S = WS.scale;
  const yOf = (p: number) => S.y20 - (p - 20) * S.perPct;
  c.save();
  c.globalAlpha *= st.show;
  const ink = env.fill('ink');
  const xL = WS.lanterns[0].x - 46;
  // the beam the lanterns hang from, and the ruled slat (a tall measuring stick: higher = more error)
  c.fillStyle = ink;
  c.fillRect(xL - 10, yOf(S.hi) - 46, S.x - xL + 26, 8);
  c.fillRect(S.x - 3, yOf(S.hi) - 40, 7, yOf(S.lo) - yOf(S.hi) + 52);
  for (let p = S.lo; p <= S.hi; p++) {
    const y = yOf(p);
    const major = p % 5 === 0;
    c.fillRect(S.x + 4, y - (major ? 1.4 : 0.8), major ? 18 : 9, major ? 2.8 : 1.6);
  }
  // faint dashed rules across the lanterns at 20 / 25 / 30 %, so each lantern's height is read against the scale
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 1;
  c.setLineDash([4, 5]);
  for (const p of [20, 25, 30]) {
    c.beginPath();
    c.moveTo(xL, yOf(p));
    c.lineTo(S.x - 4, yOf(p));
    c.stroke();
  }
  c.setLineDash([]);
  // the tick labels (Plex Mono, ≥ 26 px at 1080p): part of the instrument, lit by the lamp
  c.font = `500 22px "IBM Plex Mono"`;
  c.textAlign = 'left';
  // alphabetic baseline, centred on the tick by hand (a 'middle' baseline halves cap-height measurements)
  c.textBaseline = 'alphabetic';
  c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.45);
  for (const p of [20, 25, 30]) c.fillText(`${p}%`, S.x + 28, yOf(p) + 8.7);
  WS.lanterns.forEach((L, i) => {
    const y = yOf(L.err);
    const g = st.glow[i];
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(L.x, yOf(S.hi) - 40);
    c.lineTo(L.x, y - 27);
    c.stroke();
    // a fine level line from the lantern's middle to the scale: where it reads
    if (g > 0.01) {
      c.strokeStyle = withAlpha(env.mood.core, 0.55 * g);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(L.x + 22, y);
      c.lineTo(S.x + 4, y);
      c.stroke();
      c.fillStyle = withAlpha(env.mood.core, 0.85 * g);
      c.fillRect(S.x + 4, y - 1.5, 13, 3);
    }
    paperLantern(c, { x: L.x, y, r: 21, act: 0.08 + 0.9 * g, flare: 0.2 * g, tassel: true }, env);
    // the year tag hanging from the lantern: read on 'best', so it meets the 22 px floor (sized under the current
    // camera; the tag grows with its type)
    const fs = legibleSize(c, `600 16px "IBM Plex Mono"`, 16, L.year);
    c.font = `600 ${fs}px "IBM Plex Mono"`;
    const tw = c.measureText(L.year).width + 12;
    const th = fs * 1.3;
    c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.4);
    c.globalAlpha = st.show * (0.55 + 0.45 * g);
    c.fillRect(L.x - tw / 2, y + 34, tw, th);
    c.fillStyle = env.mood.fg;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(L.year, L.x, y + 34 + th / 2 + fs * 0.35);
    c.globalAlpha = st.show;
  });
  c.restore();
}

/** the ring of 25 thumbnails beside the board; `dark` 0..1 sweeps the dark arc (7 of 25 = 28 %) */
export function thumbRing(c: C, env: PaintEnv, st: BoardState) {
  const R = WS.ring;
  c.save();
  c.globalAlpha *= st.show;
  // a wreath hoop
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 5;
  c.beginPath();
  c.arc(R.x, R.y, R.r, 0, Math.PI * 2);
  c.stroke();
  for (let k = 0; k < R.n; k++) {
    const a = -Math.PI / 2 + (k / R.n) * Math.PI * 2;
    const x = R.x + Math.cos(a) * R.r;
    const y = R.y + Math.sin(a) * R.r;
    const w = 21;
    const h = 17;
    // dark: the first 7 frames clockwise from the top, one after another
    const d = Math.max(0, Math.min(1, st.dark * R.n - k)) * (k < R.dark ? 1 : 0);
    c.fillStyle = env.fill('ink');
    c.fillRect(x - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5);
    // the picture: a lit little photograph (seeded tones and a dark subject)
    const hu = hash1(k, 71);
    const bg = mixLab(mixLab(env.mood.halo, env.mood.rim, hu), env.mood.setHaze, 0.25 + 0.3 * hash1(k, 72));
    c.fillStyle = mixLab(bg, env.mood.fg, 0.92 * d);
    c.fillRect(x - w / 2, y - h / 2, w, h);
    if (d < 0.95) {
      c.globalAlpha = st.show * (1 - d);
      c.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.4);
      c.beginPath();
      c.ellipse(x + (hash1(k, 73) - 0.5) * 6, y + 2, 4 + 4 * hash1(k, 74), 3 + 3 * hash1(k, 75), 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = st.show;
    }
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ L4 bench, lamp, lectern
export function benchAndLamp(c: C, env: PaintEnv, ink: string) {
  const B = WS.bench;
  c.fillStyle = ink;
  // bench top, apron, two trestle legs, a vice
  c.fillRect(B.x0, B.top, B.x1 - B.x0, 12);
  c.fillRect(B.x0 + 8, B.top + 12, B.x1 - B.x0 - 16, 16);
  for (const lx of [B.x0 + 22, B.x1 - 40]) {
    c.beginPath();
    c.moveTo(lx, B.top + 28);
    c.lineTo(lx + 18, B.top + 28);
    c.lineTo(lx + 26, WS.floor);
    c.lineTo(lx - 8, WS.floor);
    c.closePath();
    c.fill();
  }
  c.fillRect(B.x0 + 20, WS.floor - 70, B.x1 - B.x0 - 40, 6);
  c.fillRect(B.x1 - 34, B.top - 22, 22, 22);
  c.fillRect(B.x1 - 40, B.top - 26, 34, 6);
  // the hanging lamp: cord from the ceiling, a conical shade
  const L = WS.lamp;
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(L.x, -200);
  c.lineTo(L.x, L.y - 22);
  c.stroke();
  c.beginPath();
  c.moveTo(L.x - 6, L.y - 24);
  c.lineTo(L.x + 6, L.y - 24);
  c.lineTo(L.x + 34, L.y);
  c.lineTo(L.x - 34, L.y);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.9);
  c.beginPath();
  c.ellipse(L.x, L.y + 1, 26, 3.5, 0, 0, Math.PI * 2);
  c.fill();
}

/** the bench's tin offcuts and the plate being cut (a little brighter where the lamp catches it) */
export function benchWork(c: C, env: PaintEnv, ink: string, cut: number) {
  const B = WS.bench;
  c.fillStyle = mixLab(ink, env.mood.set, 0.3);
  for (let k = 0; k < 5; k++) {
    const x = B.x0 + 30 + k * 26 + hash1(k, 81) * 8;
    c.fillRect(x, B.top - 3, 10 + hash1(k, 82) * 10, 3);
  }
  // the plate on the bench, edge-on, with curls of tin rising as it is cut
  c.fillStyle = ink;
  c.fillRect(B.x0 + 60, B.top - 4, 56, 4);
  for (let k = 0; k < Math.floor(cut * 5); k++) {
    c.strokeStyle = withAlpha(env.mood.rim, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    const x = B.x0 + 72 + k * 8;
    c.arc(x, B.top - 7, 3 + (k % 2), Math.PI * 0.2, Math.PI * 1.6);
    c.stroke();
  }
}

export function lectern(c: C, env: PaintEnv, ink: string) {
  const x = WS.lectern.x;
  const top = WS.lectern.top;
  // a tall judge's lectern: plinth, column with mouldings, a slanted desk top
  c.fillStyle = ink;
  c.fillRect(x - 46, WS.floor - 14, 92, 14);
  c.fillRect(x - 36, WS.floor - 24, 72, 10);
  c.fillRect(x - 15, top + 30, 30, WS.floor - 24 - top - 30);
  for (const y of [top + 60, WS.floor - 60]) c.fillRect(x - 22, y, 44, 8);
  c.beginPath();
  c.moveTo(x - 58, top + 34);
  c.lineTo(x + 58, top + 14);
  c.lineTo(x + 62, top + 22);
  c.lineTo(x + 44, top + 40);
  c.lineTo(x - 44, top + 40);
  c.closePath();
  c.fill();
  // the pin-board rising from the desk: two posts and a frame
  const Bd = WS.board;
  const bBot = Bd.y + Bd.h / 2;
  c.fillRect(x - 50, bBot, 5, top + 30 - bBot);
  c.fillRect(x + 45, bBot, 5, top + 18 - bBot);
  c.fillRect(Bd.x - Bd.w / 2 - 6, Bd.y - Bd.h / 2 - 6, Bd.w + 12, Bd.h + 12);
  c.fillStyle = mixLab(env.mood.set, env.mood.setHaze, 0.5);
  c.fillRect(Bd.x - Bd.w / 2, Bd.y - Bd.h / 2, Bd.w, Bd.h);
}

/** the husky thumbnail pinned on the board, and five guess slips fanned beneath it (one is the right answer) */
export function guesses(c: C, env: PaintEnv, u: number, right: number) {
  if (u <= 0) return;
  const Bd = WS.board;
  const px = Bd.x, py = Bd.y - 26;
  const pw = 64;
  const drop = (1 - Math.min(1, u * 2)) * -16;
  c.save();
  c.globalAlpha *= Math.min(1, u * 3);
  // the photograph, pinned
  c.fillStyle = mixLab(env.mood.rim, '#ffffff', 0.4);
  c.fillRect(px - pw / 2 - 3, py - pw / 2 - 3 + drop, pw + 6, pw + 6);
  c.imageSmoothingEnabled = true;
  c.drawImage(huskyCanvas(64), px - pw / 2, py - pw / 2 + drop, pw, pw);
  c.fillStyle = withAlpha(env.mood.fg, 0.25);
  c.fillRect(px - pw / 2, py - pw / 2 + drop, pw, pw);
  c.fillStyle = env.mood.fg;
  c.beginPath();
  c.arc(px, py - pw / 2 - 1 + drop, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // five slips fanned beneath it
  const fan = Math.max(0, Math.min(1, (u - 0.3) / 0.7));
  for (let k = 0; k < 5; k++) {
    const a = (k - 2) * 0.24 * fan;
    const sx = px + (k - 2) * 15 * fan;
    const sy = py + pw / 2 + 30;
    c.save();
    c.globalAlpha *= Math.min(1, fan * 2);
    c.translate(sx, sy + 14);
    c.rotate(a);
    const isRight = k === 3;
    c.fillStyle = mixLab(env.mood.halo, env.mood.rim, isRight ? 0.4 + 0.5 * right : 0.35);
    c.fillRect(-9, -30, 18, 30);
    // scribbled guesses: ink strokes, not words
    c.strokeStyle = withAlpha(env.mood.fg, 0.55);
    c.lineWidth = 0.9;
    c.beginPath();
    for (let l = 0; l < 3; l++) {
      c.moveTo(-6, -24 + l * 6);
      c.lineTo(-6 + 6 + 6 * hash1(k * 3 + l, 91), -24 + l * 6);
    }
    c.stroke();
    if (isRight && right > 0) {
      // the tick: one of the five is the right name, so the picture counts
      c.strokeStyle = withAlpha(env.mood.fg, 0.95 * right);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-5, -6);
      c.lineTo(-1, -2);
      c.lineTo(6, -11);
      c.stroke();
    }
    c.restore();
  }
  if (right > 0) glow(c, px + 15 * fan, py + pw / 2 + 30, 26, env.mood.halo, 0.25 * right);
}
