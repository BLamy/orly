/**
 * ch06-s04 — the holdouts at the rim of the quiet-years candle: small props for the candle stage.
 *
 *   GEN6                         generic, unnamed 1990s–2000s figures for the pool (conference-goers, reviewers)
 *   handLamp(c, x, y, s, k, env) a small tin hand-lantern hanging from a grip point (x, y): bail, cap, four glass
 *                                panes lit from within (k = 0..1 light), base. Draws its own small glow.
 *   torontoWindow(c, o, env)     a free-standing window flat on the stage floor: a winter night beyond the panes
 *                                (winterBlue, low chroma), a low far skyline with one needle tower, slow snow
 *   bowlBoard(c, o, env)         a whiteboard on an easel with the clean bowl drawn on it; a dot rolls to its floor
 *   hangTag(c, o, env)           a paper place tag lowered from the flies on a string (a place stamp, in the world)
 *   LIFT_LOW / LIFT_UP / SIT_LOW / SIT_UP   lantern-holding poses (standing / seated), near hand gripping the bail
 */
import type { PaintEnv, Pose } from '../../../film/contracts';
import { createPuppet } from '../../../film/silhouette/puppet';
import { pose } from '../../../film/silhouette/puppet/poses';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, drawTracked, measureTracked } from '../../../film/silhouette/type';
import { h01 } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;

/** the pool's crowd: generic and varied (never likenesses) */
export const GEN6 = {
  reviewerA: createPuppet({ id: 'gen6-rev-a', height: 318, build: 'average', era: '1990s', wardrobe: 'blazer', hair: 'sidePart', facialHair: 'none', glasses: 'rectangular', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 }, prop: 'papers', details: [] }),
  reviewerB: createPuppet({ id: 'gen6-rev-b', height: 300, build: 'slight', era: '1990s', wardrobe: 'trouserSuit', hair: 'bob', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.44, brow: 0.44, chin: 0.48, jaw: 0.4 }, prop: 'papers', details: [] }),
  goerA: createPuppet({ id: 'gen6-goer-a', height: 326, build: 'tall', era: '1990s', wardrobe: 'suit', hair: 'receding', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.52, chin: 0.52, jaw: 0.5 }, prop: 'none', details: ['lapel'] }),
  goerB: createPuppet({ id: 'gen6-goer-b', height: 312, build: 'average', era: '1990s', wardrobe: 'polo', hair: 'crewCut', facialHair: 'moustache', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.55 }, prop: 'none', details: [] }),
  goerC: createPuppet({ id: 'gen6-goer-c', height: 304, build: 'average', era: '2000s', wardrobe: 'fleeceF', hair: 'ponytail', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.44, brow: 0.42, chin: 0.46, jaw: 0.4 }, prop: 'none', details: [] }),
  goerD: createPuppet({ id: 'gen6-goer-d', height: 316, build: 'stocky', era: '1990s', wardrobe: 'sweaterVest', hair: 'messy', facialHair: 'beard', glasses: 'heavy', hat: 'none', profile: { nose: 0.5, brow: 0.52, chin: 0.5, jaw: 0.55 }, prop: 'none', details: [] }),
  /** the fainter holdouts at the rim (unnamed) */
  faintA: createPuppet({ id: 'gen6-faint-a', height: 314, build: 'average', era: '1990s', wardrobe: 'cardigan', hair: 'sidePart', facialHair: 'none', glasses: 'rectangular', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 }, prop: 'none', details: [] }),
  faintB: createPuppet({ id: 'gen6-faint-b', height: 306, build: 'slight', era: '1990s', wardrobe: 'polo', hair: 'shaggy', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.48, brow: 0.46, chin: 0.48, jaw: 0.44 }, prop: 'none', details: [] }),
  faintC: createPuppet({ id: 'gen6-faint-c', height: 320, build: 'tall', era: '2000s', wardrobe: 'fleece', hair: 'receding', facialHair: 'beard', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.5, chin: 0.5, jaw: 0.52 }, prop: 'none', details: [] }),
  faintD: createPuppet({ id: 'gen6-faint-d', height: 300, build: 'average', era: '2000s', wardrobe: 'blazer', hair: 'long', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.44, brow: 0.44, chin: 0.48, jaw: 0.4 }, prop: 'none', details: [] }),
};

// ------------------------------------------------------------------------------------------------ poses
/** standing, the lantern hanging low at the near hand (arm slack, a little forward) */
export const LIFT_LOW: Pose = pose({ hipF: 3, kneeF: -3, hipB: -4, kneeB: 0, torso: -1, neck: 4, head: -3, shoulderF: 10, elbowF: 12, wristF: -6, shoulderB: -8, elbowB: 14, wristB: 4 }, { handF: 'grip' });
/** standing, the lantern lifted out into the dark at arm's length, a little above the shoulder */
export const LIFT_UP: Pose = pose({ hipF: 4, kneeF: -4, hipB: -5, kneeB: 0, torso: -3, neck: 6, head: -7, shoulderF: 92, elbowF: 22, wristF: -30, shoulderB: -10, elbowB: 18, wristB: 4 }, { handF: 'grip' });
/** seated, the lantern resting by the knee */
export const SIT_LOW: Pose = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 4, neck: 4, head: 2, shoulderF: 22, elbowF: 40, wristF: -10, shoulderB: 12, elbowB: 58 }, { handF: 'grip' });
/** seated, the lantern raised out over the desk */
export const SIT_UP: Pose = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: -2, neck: 6, head: -6, shoulderF: 96, elbowF: 18, wristF: -30, shoulderB: 12, elbowB: 58 }, { handF: 'grip' });

// ------------------------------------------------------------------------------------------------ the hand-lantern
/**
 * A small tin hand-lantern hanging from the grip point (x, y) (gravity keeps it upright): a wire bail, a pierced
 * conical cap, four glass panes lit from within, a base. s = scale (1 ≈ 30 px tall); k = light 0..1.
 */
export function handLamp(c: C, x: number, y: number, s: number, k: number, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const w = 15 * s, top = y + 9 * s, gh = 17 * s;
  c.save();
  // the bail (a wire loop from the grip down to the cap)
  c.strokeStyle = ink;
  c.lineWidth = Math.max(1, 1.3 * s);
  c.beginPath();
  c.moveTo(x - w * 0.42, top + 2 * s);
  c.quadraticCurveTo(x - w * 0.42, y - 1 * s, x, y - 1 * s);
  c.quadraticCurveTo(x + w * 0.42, y - 1 * s, x + w * 0.42, top + 2 * s);
  c.stroke();
  // cap: a little cone with a ring
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - w * 0.62, top + 4 * s);
  c.lineTo(x - w * 0.18, top - 1 * s);
  c.lineTo(x + w * 0.18, top - 1 * s);
  c.lineTo(x + w * 0.62, top + 4 * s);
  c.closePath();
  c.fill();
  // the glass: lit from within (halo → core at the flame), with two frame posts
  const g0 = top + 4 * s, g1 = g0 + gh;
  const glass = mixLab(mixLab(m.set, m.halo, 0.35 + 0.45 * k), m.core, 0.55 * k);
  c.fillStyle = glass;
  c.fillRect(x - w / 2, g0, w, gh);
  if (k > 0.02) {
    // the tiny flame inside
    c.fillStyle = withAlpha(m.core, Math.min(1, 0.4 + 0.6 * k));
    c.beginPath();
    c.ellipse(x, g0 + gh * 0.55, 2.2 * s, 4.2 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = ink;
  c.fillRect(x - w / 2 - 0.8 * s, g0, 1.8 * s, gh);
  c.fillRect(x + w / 2 - 1 * s, g0, 1.8 * s, gh);
  c.fillRect(x - 0.6 * s, g0, 1.2 * s, gh);
  // base
  c.beginPath();
  c.roundRect(x - w * 0.64, g1 - 0.5 * s, w * 1.28, 4 * s, 1.2 * s);
  c.fill();
  // the lantern's own small glow (additive)
  if (k > 0.01) {
    const R = 46 * s;
    const gg = c.createRadialGradient(x, g0 + gh / 2, 1, x, g0 + gh / 2, R);
    gg.addColorStop(0, withAlpha(m.core, 0.35 * k));
    gg.addColorStop(0.3, withAlpha(m.halo, 0.18 * k));
    gg.addColorStop(1, withAlpha(m.halo, 0));
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = gg;
    c.fillRect(x - R, g0 + gh / 2 - R, 2 * R, 2 * R);
  }
  c.restore();
}
/** where the lantern's light sits for a grip point (for f.practical) */
export const handLampLight = (x: number, y: number, s: number) => ({ x, y: y + (13 + 8.5) * s });

// ------------------------------------------------------------------------------------------------ the Toronto window
export interface TorontoWindowDraw {
  /** centre x, sill y (layer px), floor y */
  x: number;
  sill: number;
  floorY: number;
  w: number;
  h: number;
  t: number;
}
/**
 * A free-standing window flat at the rim of the stage: the panes are HOLES onto a winter night (winterBlue,
 * low chroma), a far skyline with one needle tower along the bottom of the glass, snow falling slowly.
 * The frame is cut-paper ink with two feet on the floor.
 */
export function torontoWindow(c: C, o: TorontoWindowDraw, env: PaintEnv) {
  const W = MOODS.winterBlue;
  const m = env.mood;
  const x0 = o.x - o.w / 2, y0 = o.sill - o.h;
  c.save();
  // the night beyond (panes area), a little warmed by the room's haze so it is not a neon cutout
  const sky = c.createLinearGradient(0, y0, 0, o.sill);
  sky.addColorStop(0, mixLab(W.sky[0], m.set, 0.45));
  sky.addColorStop(0.62, mixLab(W.sky[2], m.setHaze, 0.42));
  sky.addColorStop(1, mixLab(W.sky[3], m.halo, 0.38));
  c.fillStyle = sky;
  c.fillRect(x0, y0, o.w, o.h);
  // the far city: a low skyline and one needle tower (L1-like, hazed)
  c.fillStyle = mixLab(W.set, W.setHaze, 0.5);
  c.beginPath();
  c.moveTo(x0, o.sill);
  let xx = x0;
  let i = 0;
  while (xx < x0 + o.w) {
    const bw = 7 + 12 * h01(i, 401);
    const bh = 10 + 30 * h01(i, 402);
    c.lineTo(xx, o.sill - bh);
    c.lineTo(xx + bw, o.sill - bh);
    xx += bw;
    i++;
  }
  c.lineTo(x0 + o.w, o.sill);
  c.closePath();
  c.fill();
  const tx = x0 + o.w * 0.66;
  c.fillRect(tx - 1.2, o.sill - o.h * 0.62, 2.4, o.h * 0.62);
  c.beginPath();
  c.ellipse(tx, o.sill - o.h * 0.44, 5.5, 3.2, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(tx - 5, o.sill - 30);
  c.lineTo(tx - 1, o.sill - o.h * 0.42);
  c.lineTo(tx + 1, o.sill - o.h * 0.42);
  c.lineTo(tx + 5, o.sill - 30);
  c.closePath();
  c.fill();
  // a few lit windows in the far city (tiny, cool-warm)
  c.fillStyle = withAlpha(mixLab(W.core, m.halo, 0.4), 0.5);
  for (let k = 0; k < 9; k++) c.fillRect(x0 + 8 + h01(k, 405) * (o.w - 16), o.sill - 6 - h01(k, 406) * 18, 1.6, 1.6);
  // snow, slow, inside the panes only
  c.save();
  c.beginPath();
  c.rect(x0, y0, o.w, o.h);
  c.clip();
  c.fillStyle = withAlpha(mixLab(W.rim, W.core, 0.4), 0.7);
  for (let k = 0; k < 26; k++) {
    const sp = 14 + 10 * h01(k, 411);
    const yy = y0 + ((h01(k, 412) * o.h + o.t * sp) % o.h);
    const xxs = x0 + h01(k, 413) * o.w + 4 * Math.sin(o.t * 0.7 + k);
    const r = 0.7 + 0.9 * h01(k, 414);
    c.beginPath();
    c.arc(xxs, yy, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // the frame: outer casing with mullions (evenodd holes = the panes)
  const fr = new Path2D();
  const b = 9;
  fr.rect(x0 - b, y0 - b - 6, o.w + 2 * b, o.h + 2 * b + 6);
  const cols = 2, rows = 3, mu = 6;
  const pw = (o.w - (cols - 1) * mu) / cols, ph = (o.h - (rows - 1) * mu) / rows;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) fr.rect(x0 + q * (pw + mu), y0 + r * (ph + mu), pw, ph);
  c.fillStyle = env.fill('ink');
  c.fill(fr, 'evenodd');
  // the sill and the two feet of the flat (a stage brace down to the floor)
  c.fillRect(x0 - b - 8, o.sill + b - 2, o.w + 2 * b + 16, 7);
  c.fillRect(x0 + 6, o.sill + b, 6, o.floorY - o.sill - b);
  c.fillRect(x0 + o.w - 12, o.sill + b, 6, o.floorY - o.sill - b);
  // a cool cut-line where the glass light catches the inner edges
  c.strokeStyle = withAlpha(mixLab(W.rim, m.rim, 0.5), 0.35);
  c.lineWidth = 1;
  c.strokeRect(x0 + 0.5, y0 + 0.5, o.w - 1, o.h - 1);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the whiteboard bowl
export interface BowlBoardDraw {
  /** board centre x, board top y, floor y (layer px) */
  x: number;
  y: number;
  floorY: number;
  w: number;
  h: number;
  /** board brightness (the candle's light on it) */
  light: number;
  /** 0..1 the dot's roll from the left rim to the floor of the bowl */
  roll: number;
}
/** a whiteboard on an easel, the clean bowl drawn on it in marker; a dot rolls to its single bottom */
export function bowlBoard(c: C, o: BowlBoardDraw, env: PaintEnv) {
  const m = env.mood;
  const x0 = o.x - o.w / 2;
  c.save();
  // easel legs
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(x0 + 12, o.y + o.h - 4);
  c.lineTo(x0 - 4, o.floorY);
  c.moveTo(x0 + o.w - 12, o.y + o.h - 4);
  c.lineTo(x0 + o.w + 4, o.floorY);
  c.moveTo(o.x, o.y + o.h);
  c.lineTo(o.x + 8, o.floorY);
  c.stroke();
  // the board
  const paper = mixLab(mixLab(m.set, m.setHaze, 0.5), mixLab(m.halo, m.rim, 0.5), 0.25 + 0.6 * o.light);
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 5, o.y - 5, o.w + 10, o.h + 10);
  c.fillStyle = paper;
  c.fillRect(x0, o.y, o.w, o.h);
  // marker tray
  c.fillStyle = env.fill('ink');
  c.fillRect(x0 - 2, o.y + o.h + 4, o.w + 4, 5);
  // the clean bowl (a parabola), drawn in dark marker
  const bx0 = x0 + o.w * 0.14, bx1 = x0 + o.w * 0.86, by0 = o.y + o.h * 0.2, by1 = o.y + o.h * 0.8;
  const bowl = (u: number) => ({ x: bx0 + (bx1 - bx0) * u, y: by0 + (by1 - by0) * (1 - Math.pow(2 * u - 1, 2)) });
  c.strokeStyle = withAlpha(m.ink, 0.82);
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const p = bowl(i / 40);
    if (i === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  // the dot: from the left rim (u .06) to the floor (u .5), slowing as it settles
  const u = 0.06 + 0.44 * (1 - Math.pow(1 - Math.max(0, Math.min(1, o.roll)), 2.2));
  const p = bowl(u);
  c.fillStyle = withAlpha(m.ink, 0.9);
  c.beginPath();
  c.arc(p.x, p.y - 4.5, 4.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the place tag
export interface HangTagDraw {
  /** where it hangs (the tag's centre x and its top y once lowered), layer px */
  x: number;
  y: number;
  text: string;
  /** 0..1 lowered from the flies (0 = off the top) */
  drop: number;
  /** sway (radians) */
  sway: number;
  /** type size in layer px (pass ~19 / layer scale for a screen-constant size) */
  size: number;
  alpha?: number;
}
/** a paper place tag on a string from the flies: the stamp's place in IBM Plex Mono (the era face) */
export function hangTag(c: C, o: HangTagDraw, env: PaintEnv) {
  if (o.drop <= 0.001) return;
  const m = env.mood;
  const font = `500 ${o.size}px ${FONT.mono}`;
  const tw = measureTracked(c, o.text, { font, size: o.size, tracking: 0.1 });
  const w = tw + o.size * 1.4, h = o.size * 1.9;
  const y = o.y - (1 - o.drop) * 420;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, y);
  c.rotate(o.sway);
  // the string up into the flies
  c.strokeStyle = withAlpha(mixLab(m.set, m.rim, 0.3), 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -700);
  c.stroke();
  // the tag: card stock lit faintly by the lanterns, a punched hole
  c.fillStyle = mixLab(mixLab(m.set, m.setHaze, 0.5), mixLab(m.halo, m.rim, 0.6), 0.55);
  c.beginPath();
  c.roundRect(-w / 2, 0, w, h, 2);
  c.fill();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(0, 4.5, 1.8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(m.ink, m.set, 0.15);
  drawTracked(c, o.text, 0, h * 0.72, { font, size: o.size, tracking: 0.1, align: 'center' });
  c.restore();
}
