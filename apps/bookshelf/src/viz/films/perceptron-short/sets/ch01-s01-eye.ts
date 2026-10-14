/**
 * perceptron-short — ch01-s01 / ch01-s02: the Mark I's EYE, drawn identically in both shots so the
 * s01 → s02 crossfade is a match-dissolve.
 *
 * A CAMERA BOX, grounded: the 20 × 20 photocell plate is the face of a deep housing turned a little
 * toward the stimulus card at the left (so the face is gently foreshortened, its far left edge a touch
 * shorter, and the box's right side panel recedes into the room). A short lens hood frames the face, a
 * carry handle sits on top, a pan-tilt head carries it on a studio pedestal (a column with a crank
 * collar on a weighted, castored base), and a fat cable leaves the back of the box, drops to the floor
 * and runs right to the plugboard. At the left, a stimulus card stands on its own post, faced toward
 * the camera, with a small reflector lamp on a gooseneck: `card` 0..1 lights it (pale card, a dark
 * horizontal bar printed on it), so the shot can show WHAT the eye is looking at.
 *
 *   markIEye(c, { x, y, s, cells?, light?, card? }, env)   x, y = pedestal foot on the floor (L4 world)
 *   eyeCell(o, i) -> world pt of cell i (row-major)        eyeBox(o) -> world rect of the housing face
 *   cardLamp(o)   -> world pt of the card lamp's mouth      cardFace(o) -> world centre of the card
 */
import type { PaintEnv } from '../../../film/contracts';
import { CM, cut, inkLift, lamp, px } from '../../../film/silhouette/props/_kit';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

const F = 40; // face (cm)
const HEAD = -150; // face centre height (cm above the floor)
const PITCH = 1.78;
const CELL_R = 1.55 / 2;
const HB = F / 2 + 2.6; // housing half-width
/** horizontal foreshortening of the face (turned toward the card) and the far (left) edge's height */
const SX = 0.9;
const FAR = 0.95;
/** projected depth of the box's right side panel and its back edge's height */
const DEPTH = 19;
const BACK = 0.86;
/** the stimulus card: centre x (cm, left of the pedestal), half size, foreshortening */
const CARD = { x: -104, y: -150, h: 15, sx: 0.55 };

export interface EyeOpts {
  x: number;
  y: number;
  s?: number;
  /** 400 intensities 0..1, row-major */
  cells?: ArrayLike<number>;
  /** 0..1 a raking light from the upper right falling ONTO the face */
  light?: number;
  /** 0..1 the stimulus card's lamp (0 = the card is dark ink) */
  card?: number;
}

const k = (o: EyeOpts) => CM * (o.s ?? 1);
/** face-local (x across −HB..HB before foreshortening) → projected local point */
function proj(x: number, y: number) {
  const u = (x + HB) / (2 * HB); // 0 at the far (left) edge, 1 at the near (right) edge
  const sy = FAR + (1 - FAR) * u;
  return { x: x * SX, y: HEAD + (y - HEAD) * sy };
}
function cellLocal(i: number) {
  const r = Math.floor(i / 20);
  const c = i % 20;
  const off = (19 * PITCH) / 2;
  return proj(-off + c * PITCH, HEAD - off + r * PITCH);
}
export function eyeCell(o: EyeOpts, i: number) {
  const p = cellLocal(i);
  return { x: o.x + p.x * k(o), y: o.y + p.y * k(o) };
}
export function eyeBox(o: EyeOpts) {
  const s = k(o);
  return { x: o.x - HB * SX * s, y: o.y + (HEAD - HB) * s, w: 2 * HB * SX * s, h: 2 * HB * s };
}
const LAMP_AT = { x: CARD.x + 20, y: CARD.y - 24 };
export function cardLamp(o: EyeOpts) {
  return { x: o.x + LAMP_AT.x * k(o), y: o.y + LAMP_AT.y * k(o) };
}
export function cardFace(o: EyeOpts) {
  return { x: o.x + CARD.x * k(o), y: o.y + CARD.y * k(o) };
}

type P = Path2D;
let PATHS: {
  body: P; hood: P; side: P; plate: P; bezel: P; bezelLit: P; screws: P; cl: P; ribs: P; slits: P; handleEdge: P; nearEdge: P; topEdge: P;
  cable: P; card: P; cardFace: P; cardBar: P; cardEdge: P; lampHead: P; lampMouth: P; baseRim: P; gn: P;
} | null = null;

function quad(p: P, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) {
  p.moveTo(a.x, a.y);
  p.lineTo(b.x, b.y);
  p.lineTo(c.x, c.y);
  p.lineTo(d.x, d.y);
  p.closePath();
}
function bar(p: P, x0: number, y0: number, x1: number, y1: number, w: number) {
  const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
  const dx = (Math.cos(a) * w) / 2;
  const dy = (Math.sin(a) * w) / 2;
  p.moveTo(x0 + dx, y0 + dy);
  p.lineTo(x1 + dx, y1 + dy);
  p.lineTo(x1 - dx, y1 - dy);
  p.lineTo(x0 - dx, y0 - dy);
  p.closePath();
}

function paths() {
  if (PATHS) return PATHS;
  const body = new Path2D();
  // the face frame (foreshortened), its corners
  const TL = proj(-HB, HEAD - HB);
  const TR = proj(HB, HEAD - HB);
  const BR = proj(HB, HEAD + HB);
  const BL = proj(-HB, HEAD + HB);
  quad(body, TL, TR, BR, BL);
  // the right side panel receding into the room
  const side = new Path2D();
  const sTR = { x: TR.x + DEPTH, y: HEAD + (TR.y - HEAD) * BACK };
  const sBR = { x: BR.x + DEPTH, y: HEAD + (BR.y - HEAD) * BACK };
  quad(side, TR, sTR, sBR, BR);
  body.addPath(side);
  // lens hood: a shallow shroud standing proud of the face toward the card (left and top/bottom lips)
  const hood = new Path2D();
  const hk = 1.07;
  const hTL = { x: TL.x - 4.2, y: HEAD + (TL.y - HEAD) * hk * 0.97 };
  const hBL = { x: BL.x - 4.2, y: HEAD + (BL.y - HEAD) * hk * 0.97 };
  const hTR = { x: TR.x - 1.2, y: HEAD + (TR.y - HEAD) * hk };
  const hBR = { x: BR.x - 1.2, y: HEAD + (BR.y - HEAD) * hk };
  quad(hood, hTL, hTR, hBR, hBL);
  // carry handle across the top of the box (face + side), and its rim edge
  const hx0 = TL.x + 12;
  const hx1 = TR.x + DEPTH * 0.6;
  const ht = Math.min(TL.y, TR.y) - 1.2;
  body.moveTo(hx0, ht + 1.5);
  body.lineTo(hx0, ht - 4);
  body.quadraticCurveTo((hx0 + hx1) / 2, ht - 8, hx1, ht - 3.2);
  body.lineTo(hx1, ht + 2);
  body.lineTo(hx1 - 1.6, ht + 2);
  body.lineTo(hx1 - 1.6, ht - 2.4);
  body.quadraticCurveTo((hx0 + hx1) / 2, ht - 6, hx0 + 1.6, ht - 2.9);
  body.lineTo(hx0 + 1.6, ht + 1.5);
  body.closePath();
  const handleEdge = new Path2D();
  handleEdge.moveTo(hx0, ht - 4);
  handleEdge.quadraticCurveTo((hx0 + hx1) / 2, ht - 8, hx1, ht - 3.2);
  // pan-tilt head: a cradle under the box, a tilt knob, the column, crank collar, weighted base, casters
  const cx = 2;
  const cb = Math.max(BL.y, BR.y);
  body.roundRect(cx - 9, cb - 0.5, 18, 4, 1);
  body.roundRect(cx - 3.2, cb + 3, 6.4, 6, 1);
  body.moveTo(cx + 9.5 + 2.4, cb + 1.5);
  body.arc(cx + 9.5, cb + 1.5, 2.4, 0, Math.PI * 2);
  body.rect(cx - 2.6, cb + 8, 5.2, -cb - 8 - 18); // column
  body.rect(cx - 3.4, cb + 22, 6.8, -cb - 22 - 24); // telescoping sleeve
  body.roundRect(cx - 5, cb + 34, 10, 5, 1.4); // crank collar
  bar(body, cx + 5, cb + 36.5, cx + 11, cb + 33.5, 1.4); // crank handle
  body.moveTo(cx + 12.2, cb + 33);
  body.arc(cx + 11.2, cb + 33.3, 1.2, 0, Math.PI * 2);
  // weighted base: a low trapezoid plinth, three castors
  body.moveTo(cx - 24, -4.2);
  body.lineTo(cx - 17, -11);
  body.lineTo(cx + 17, -11);
  body.lineTo(cx + 24, -4.2);
  body.closePath();
  for (const fx of [-19, 0, 19]) {
    body.rect(cx + fx - 1.4, -4.6, 2.8, 2.2);
    body.moveTo(cx + fx + 2.3, -2.3);
    body.arc(cx + fx, -2.3, 2.3, 0, Math.PI * 2);
  }
  const baseRim = new Path2D();
  baseRim.moveTo(cx - 17, -10.6);
  baseRim.lineTo(cx + 17, -10.6);
  // the hand-cut detail: a clipboard (the run log) hung on a wire hook off the column, tilted a little
  // as it swings back; its clip and the top edge of the sheet catch the window
  const clip = new Path2D();
  const hookX = cx + 3.4;
  const hookY = -84;
  clip.rect(hookX - 0.3, hookY - 0.6, 3.2, 0.9); // wire hook arm
  const tilt = 0.09;
  const cb2 = (u: number, v: number) => ({ x: hookX + 2.4 + u * Math.cos(tilt) - v * Math.sin(tilt), y: hookY + 1.2 + u * Math.sin(tilt) + v * Math.cos(tilt) });
  const cbW = 13;
  const cbH = 18;
  const q0 = cb2(-cbW / 2 + 3, 0);
  const q1 = cb2(cbW / 2 + 3, 0);
  const q2 = cb2(cbW / 2 + 3, cbH);
  const q3 = cb2(-cbW / 2 + 3, cbH);
  quad(clip, q0, q1, q2, q3); // the board
  const k0 = cb2(0.2, -1.4);
  const k1 = cb2(5.8, -1.4);
  const k2 = cb2(5.8, 1.6);
  const k3 = cb2(0.2, 1.6);
  quad(clip, k0, k1, k2, k3); // the spring clip
  body.addPath(clip);
  const clipLit = new Path2D();
  clipLit.moveTo(k0.x, k0.y);
  clipLit.lineTo(k1.x, k1.y);
  const sheet0 = cb2(-cbW / 2 + 4.2, 1.9);
  const sheet1 = cb2(cbW / 2 + 1.8, 1.9);
  clipLit.moveTo(sheet0.x, sheet0.y);
  clipLit.lineTo(sheet1.x, sheet1.y);
  baseRim.addPath(clipLit);
  // cable out of the back of the box: drops to the floor and runs right to the plugboard
  const cable = new Path2D();
  const bx = sTR.x - 2;
  const by = HEAD + 6;
  cable.moveTo(bx, by);
  cable.bezierCurveTo(bx + 14, by + 4, bx + 18, -40, bx + 14, -6);
  cable.bezierCurveTo(bx + 12, -1.5, bx + 30, -1.6, 68, -2);
  // side panel: two ribs and a louvre block (punched through)
  const ribs = new Path2D();
  for (const u of [0.34, 0.68]) {
    const a = { x: TR.x + DEPTH * u, y: HEAD + (TR.y - HEAD) * (1 - (1 - BACK) * u) + 1 };
    const b = { x: BR.x + DEPTH * u, y: HEAD + (BR.y - HEAD) * (1 - (1 - BACK) * u) - 1 };
    ribs.moveTo(a.x, a.y);
    ribs.lineTo(b.x, b.y);
  }
  const slits = new Path2D();
  for (let i = 0; i < 5; i++) {
    const y = HEAD - 10 + i * 2.4;
    slits.rect(TR.x + DEPTH * 0.42, y, DEPTH * 0.18, 0.8);
  }
  // face: plate, bezel, screws, the bottom cut line
  const off = HB - 1.6;
  const plate = new Path2D();
  quad(plate, proj(-F / 2 + 1.6, HEAD - F / 2 + 1.6), proj(F / 2 - 1.6, HEAD - F / 2 + 1.6), proj(F / 2 - 1.6, HEAD + F / 2 - 1.6), proj(-F / 2 + 1.6, HEAD + F / 2 - 1.6));
  const bezel = new Path2D();
  quad(bezel, proj(-F / 2 - 0.4, HEAD - F / 2 - 0.4), proj(F / 2 + 0.4, HEAD - F / 2 - 0.4), proj(F / 2 + 0.4, HEAD + F / 2 + 0.4), proj(-F / 2 - 0.4, HEAD + F / 2 + 0.4));
  // only the bezel's window-facing edges (top, near/right) catch the light; the far and bottom edges stay dark brass
  const bezelLit = new Path2D();
  const bz = (x: number, y: number) => proj(x, y);
  bezelLit.moveTo(bz(-F / 2 - 0.4, HEAD - F / 2 - 0.4).x, bz(-F / 2 - 0.4, HEAD - F / 2 - 0.4).y);
  bezelLit.lineTo(bz(F / 2 + 0.4, HEAD - F / 2 - 0.4).x, bz(F / 2 + 0.4, HEAD - F / 2 - 0.4).y);
  bezelLit.lineTo(bz(F / 2 + 0.4, HEAD + F / 2 + 0.4).x, bz(F / 2 + 0.4, HEAD + F / 2 + 0.4).y);
  const screws = new Path2D();
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      const q = proj(sx * (off + 0.3), HEAD + sy * (off + 0.3));
      screws.moveTo(q.x + 0.6, q.y);
      screws.arc(q.x, q.y, 0.6, 0, Math.PI * 2);
    }
  // (the face's bottom cut line was dropped in review round 2: it faced the floor, not the window)
  const cl = new Path2D();
  // edges that face the window (upper right): the near face edge and the top of the box
  const nearEdge = new Path2D();
  nearEdge.moveTo(sTR.x, sTR.y);
  nearEdge.lineTo(sBR.x, sBR.y - 1);
  const topEdge = new Path2D();
  topEdge.moveTo(hTL.x + 1, hTL.y);
  topEdge.lineTo(TR.x, TR.y);
  topEdge.lineTo(sTR.x, sTR.y);

  // ---------------------------------------------------------------- the stimulus card on its post
  const card = new Path2D();
  const cw = CARD.h * CARD.sx;
  // card face turned toward the camera box: its near (left) edge a touch taller
  const cTL = { x: CARD.x - cw, y: CARD.y - CARD.h };
  const cTR = { x: CARD.x + cw, y: CARD.y - CARD.h * 0.93 };
  const cBR = { x: CARD.x + cw, y: CARD.y + CARD.h * 0.93 };
  const cBL = { x: CARD.x - cw, y: CARD.y + CARD.h };
  // a frame a little larger than the card
  quad(card, { x: cTL.x - 1.6, y: cTL.y - 1.8 }, { x: cTR.x + 1.6, y: cTR.y - 1.6 }, { x: cBR.x + 1.6, y: cBR.y + 1.6 }, { x: cBL.x - 1.6, y: cBL.y + 1.8 });
  card.rect(CARD.x - 1.6, cBL.y + 1, 3.2, -cBL.y - 1 - 8); // post
  card.roundRect(CARD.x - 4, cBL.y + 18, 8, 3.4, 1); // height clamp
  card.moveTo(CARD.x - 16, 0);
  card.lineTo(CARD.x - 12, -4.4);
  card.lineTo(CARD.x + 12, -4.4);
  card.lineTo(CARD.x + 16, 0);
  card.closePath();
  card.rect(CARD.x - 3, -8.4, 6, 4.2);
  // gooseneck from the post top to the reflector, which points down-left at the card face
  bar(card, CARD.x + 1, cTL.y - 0.6, CARD.x + 2, cTL.y - 5, 1.1);
  const gn = new Path2D();
  gn.moveTo(CARD.x + 2, cTL.y - 5);
  gn.quadraticCurveTo(CARD.x + 8, cTL.y - 14, LAMP_AT.x + 2, LAMP_AT.y - 3);
  const lampHead = new Path2D();
  // a small conical reflector, mouth toward the card (down-left)
  lampHead.moveTo(LAMP_AT.x + 4.5, LAMP_AT.y - 5.5);
  lampHead.lineTo(LAMP_AT.x - 2.2, LAMP_AT.y - 2.4);
  lampHead.lineTo(LAMP_AT.x + 2.4, LAMP_AT.y + 3.4);
  lampHead.closePath();
  lampHead.moveTo(LAMP_AT.x + 6.6, LAMP_AT.y - 4);
  lampHead.arc(LAMP_AT.x + 5.2, LAMP_AT.y - 3.8, 1.4, 0, Math.PI * 2);
  const lampMouth = new Path2D();
  lampMouth.moveTo(LAMP_AT.x - 2.2, LAMP_AT.y - 2.4);
  lampMouth.lineTo(LAMP_AT.x + 2.4, LAMP_AT.y + 3.4);
  const cardFaceP = new Path2D();
  quad(cardFaceP, cTL, cTR, cBR, cBL);
  // the printed shape: a horizontal bar across the middle (the shape s02's retina then shows)
  const cardBar = new Path2D();
  const bw = cw * 0.72;
  quad(cardBar, { x: CARD.x - bw, y: CARD.y - 2.6 }, { x: CARD.x + bw, y: CARD.y - 2.4 }, { x: CARD.x + bw, y: CARD.y + 2.4 }, { x: CARD.x - bw, y: CARD.y + 2.6 });
  const cardEdge = new Path2D();
  cardEdge.moveTo(cTL.x - 1.6, cTL.y - 1.8);
  cardEdge.lineTo(cTR.x + 1.6, cTR.y - 1.6); // the top edge alone faces the window
  PATHS = { body, hood, side, plate, bezel, bezelLit, screws, cl, ribs, slits, handleEdge, nearEdge, topEdge, cable, card, cardFace: cardFaceP, cardBar, cardEdge, lampHead, lampMouth, baseRim, gn };
  return PATHS;
}

export function markIEye(c: CanvasRenderingContext2D, o: EyeOpts, env: PaintEnv): void {
  const P = paths();
  const m = env.mood;
  const ink = env.fill('ink');
  const L = Math.max(0, Math.min(1, o.light ?? 0));
  const K = Math.max(0, Math.min(1, o.card ?? 0));
  c.save();
  c.translate(o.x, o.y);
  const s = k(o);
  c.scale(s, s);
  // cable first (it runs behind the pedestal base), then the card on its post, then the camera
  c.lineCap = 'round';
  c.strokeStyle = ink;
  c.lineWidth = 2.6;
  c.stroke(P.cable);
  c.lineWidth = 1.1;
  c.stroke(P.gn);
  c.fillStyle = ink;
  c.fill(P.card);
  c.fill(P.lampHead);
  // the card face: dark until its lamp is on, then pale paper with the printed bar
  c.fillStyle = K > 0.002 ? mixLab(inkLift(env, 0.25), mixLab(m.halo, m.core, 0.55), K) : inkLift(env, 0.18);
  c.fill(P.cardFace);
  if (K > 0.002) {
    c.fillStyle = withAlpha(ink, K * 0.92);
    c.fill(P.cardBar);
    // the lamp's pool spilling onto the card (lighter, clipped to the face)
    c.save();
    c.clip(P.cardFace);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(CARD.x + 6, CARD.y - 10, 1, CARD.x + 2, CARD.y - 4, 22);
    g.addColorStop(0, withAlpha(m.core, 0.32 * K));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(CARD.x - 20, CARD.y - 20, 40, 40);
    c.restore();
    c.strokeStyle = withAlpha(m.core, 0.9 * K);
    c.lineWidth = Math.max(px(c, 1.6), 0.5);
    c.stroke(P.lampMouth);
  }
  cut(c, env, P.cardEdge, 0.32, 1.1);

  c.fillStyle = ink;
  c.fill(P.hood);
  c.fill(P.body);
  // side panel a shade lifted (it turns toward the room light), ribs, louvres punched through
  c.fillStyle = inkLift(env, 0.12);
  c.fill(P.side);
  cut(c, env, P.ribs, 0.22, 1);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fill(P.slits);
  c.restore();
  // plate: a slightly lifted dark field so the grid reads
  c.fillStyle = inkLift(env, 0.3);
  c.fill(P.plate);
  litCells(c, o.cells, env, true);
  // brass bezel and screws (the same rim the s03 retina carries)
  const brass = mixLab(m.rim, m.core, 0.25);
  c.lineWidth = Math.max(px(c, 1.4), 0.55);
  c.strokeStyle = withAlpha(mixLab(env.fill('ink'), brass, 0.28), 0.9);
  c.stroke(P.bezel);
  c.strokeStyle = withAlpha(brass, 0.5 + 0.35 * L);
  c.stroke(P.bezelLit);
  c.fillStyle = withAlpha(brass, 0.5 + 0.3 * L);
  c.fill(P.screws);
  cut(c, env, P.cl, 0.3, 1.1);
  cut(c, env, P.baseRim, 0.3, 1.1);
  if (L > 0.002) {
    rakingLight(c, P, L, env);
    // edges facing the light catch a rim
    c.strokeStyle = withAlpha(m.rim, 0.75 * L);
    c.lineWidth = Math.max(px(c, 1.6), 0.5);
    c.stroke(P.nearEdge);
    c.stroke(P.topEdge);
    c.stroke(P.handleEdge);
  }
  c.restore();
}

/** the lit photocells (one fill per intensity bucket); `dark` also fills the unlit cells with ink */
function litCells(c: CanvasRenderingContext2D, cells: ArrayLike<number> | undefined, env: PaintEnv, dark: boolean) {
  const m = env.mood;
  const buckets: Path2D[] = [];
  const unlit = new Path2D();
  for (let i = 0; i < 400; i++) {
    const v = cells ? Math.max(0, Math.min(1, cells[i] ?? 0)) : 0;
    if (v < 0.04 && !dark) continue;
    const p = cellLocal(i);
    const path = v < 0.04 ? unlit : (buckets[Math.min(5, Math.floor(v * 6))] ??= new Path2D());
    path.moveTo(p.x + CELL_R * SX, p.y);
    path.ellipse(p.x, p.y, CELL_R * SX, CELL_R, 0, 0, Math.PI * 2);
  }
  if (dark) {
    c.fillStyle = env.fill('ink');
    c.fill(unlit);
  }
  buckets.forEach((b, i) => {
    if (!b) return;
    const u = (i + 0.5) / 6;
    c.fillStyle = lamp(env, 0.2 + 0.8 * u, 0.35 + 0.65 * u);
    c.fill(b);
  });
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(m.halo, 0.14);
  buckets.forEach((b, i) => {
    if (b && i >= 3) c.fill(b);
  });
  c.restore();
}

/** the raking window light falling from the upper right ACROSS the face (it receives light, never emits it) */
function rakingLight(c: CanvasRenderingContext2D, P: ReturnType<typeof paths>, L: number, env: PaintEnv) {
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.clip(P.plate);
  const g = c.createLinearGradient(F / 2, HEAD - F / 2, -F / 2, HEAD + F / 2);
  g.addColorStop(0, withAlpha(m.halo, 0.34 * L));
  g.addColorStop(0.55, withAlpha(m.halo, 0.12 * L));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(-F / 2, HEAD - F / 2, F, F);
  c.restore();
}

/**
 * ch01-s01's single glint (review round 4: the machine is a rumour in the dark): ONLY the lit cells and the
 * raking light on the face, painted over a machine that has been pushed toward black, so nothing else of
 * the housing reads. Same geometry as markIEye.
 */
export function markIEyeGlint(c: CanvasRenderingContext2D, o: EyeOpts, env: PaintEnv): void {
  const L = Math.max(0, Math.min(1, o.light ?? 0));
  c.save();
  c.translate(o.x, o.y);
  const s = k(o);
  c.scale(s, s);
  litCells(c, o.cells, env, false);
  if (L > 0.002) rakingLight(c, paths(), L, env);
  c.restore();
}
