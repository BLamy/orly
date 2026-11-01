/**
 * durable-objects-unbound — THE WELL, THE PLATE and THE TOOTH (staging.buildList.wellAndPlate).
 *
 * The Well is the bucket; the Plate (three brass tiles house · epoch · from, with an "opened" crown lamp) is the
 * ownership record; the Tooth (a brass slot with a shutter and a pawl) is the bucket's conditional write.
 * Everything is drawn about the WELLHEAD BASE CENTRE (x, y) at scale s (s = 1: the canonical square, the wellhead
 * 150 px wide), so the same machine serves wides (s = 1 inside harbourTown at TOWN.well) and close-ups (s = 2..4).
 *
 *   wellBase(c, env, { x, y, s })                         stone ring, posts, winch, iron Plate frame (STATIC: bake it)
 *   wellLive(c, env, { x, y, s, bucket, rope, glint, water })   rope + bucket + water glint (per frame)
 *   plate(c, env, { x, y, s, plate: PlateState, ... })     the Plate on its frame (per frame)
 *   tooth(c, env, { x, y, s, tooth: ToothState })          the brass slot, shutter, pawl and pin (per frame)
 *   swapCard(c, env, { x, y, s, house, notch, punched, rot }) a brass swap card notched with the version it read
 *   notchPath(seed, w, h)                                  the sawtooth profile that stands for a version (opaque)
 *   WELL                                                   anchor offsets (unit scale) for hooks, plate, slot, bucket
 *   wellPt(o, key)                                         an anchor in layer coords for a placement {x, y, s}
 *
 * Bindings (style bible §6): plate.house/epoch/from are own.json's node/epoch/from; crown lit only when
 * from === epoch (callers pass crown explicitly; plateCrown(p) gives the rule); the notch is an opaque version
 * pattern, NOT a checksum; the shutter falls after the first create; the pawl + pin is the condition check.
 * Numbers and houses are illustrative (the narration says so).
 */
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS, BRASS_HI, EMBER, brass, clamp01, glowDot, lerp, tone, type C2 } from './common';

/** anchor offsets at unit scale, relative to the wellhead base centre */
export const WELL = {
  ringW: 150,
  ringH: 50,
  postX: 62,
  winchY: -142,
  /** the Plate's centre */
  plate: { x: 0, y: -212 },
  plateW: 156,
  plateH: 50,
  /** crown lamp */
  crown: { x: 0, y: -252 },
  /** the Tooth slot on the ring's front lip */
  slot: { x: 34, y: -40 },
  /** badge hook (left iron post) */
  hook: { x: -62, y: -128 },
  /** second hook on the right post (keeper's lamp hook / alarm bracket) */
  hookR: { x: 62, y: -128 },
  /** the rope's pulley at the winch, where the houses' pulley lines arrive */
  pulley: { x: 0, y: -146 },
  /** the water surface (inside the ring) */
  water: { x: 0, y: -46 },
};
export type WellKey = 'plate' | 'crown' | 'slot' | 'hook' | 'hookR' | 'pulley' | 'water';
export function wellPt(o: { x: number; y: number; s?: number }, key: WellKey): { x: number; y: number } {
  const s = o.s ?? 1;
  const p = WELL[key];
  return { x: o.x + p.x * s, y: o.y + p.y * s };
}

export type House = 'A' | 'B' | 'C' | '';
export interface PlateState {
  house: House;
  epoch: number | '';
  from: number | '';
  /** 0..1 the opened lamp at the crown */
  crown: number;
  /** tile flips in progress: index 0..2 -> u (0..1 the tile turning; value already the NEW value) */
  flip?: [number, number, number];
  /** the notched version edge under the tiles: seed (null = no notch shown) */
  notch?: number | null;
  /** 0..1 the notch being re-cut from `notchPrev` to `notch` */
  recut?: number;
  notchPrev?: number;
  /** 0..1 engraved captions 'house · epoch · from' above the tiles */
  captions?: number;
  /** 0..1 the face swung forward like a watch case (opens the engraving) */
  open?: number;
  /** per-tile catch-light 0..1 */
  glint?: [number, number, number];
  /** the whole Plate's alpha (ghost plates) */
  alpha?: number;
  /** 0..1 dims the brass (a distant, unlit Plate that must not outshine the shot's warm practical) */
  dim?: number;
}
/** the film's rule: the crown lights only when the from tile equals the epoch (opened) */
export const plateCrown = (p: { epoch: number | ''; from: number | '' }) => (p.epoch !== '' && p.epoch === p.from ? 1 : 0);

export interface ToothState {
  /** 0 open .. 1 closed: the create shutter */
  shutter: number;
  /** pin seated 1, pulled 0 (the pawl hangs slack when the pin is out) */
  pin: number;
  /** pin travel when pulled (0..1 out along the hand's path) */
  pinOut?: number;
  /** 0..1 the pawl's bite (snaps tight when the pin is seated) */
  pawl?: number;
  /** a click / thunk flash 0..1 */
  flash?: number;
  flashKind?: 'click' | 'thunk';
  /** show the pin at all (the pin device belongs to ch03-s02; later shots may hide it) */
  showPin?: boolean;
}

// ------------------------------------------------------------------ the notch (version pattern)
const notchCache = new Map<string, number[]>();
function notchHeights(seed: number, n: number): number[] {
  const key = `${seed}|${n}`;
  let r = notchCache.get(key);
  if (!r) {
    r = [];
    let x = (seed * 2654435761) >>> 0;
    for (let i = 0; i < n; i++) {
      x ^= x << 13; x >>>= 0;
      x ^= x >>> 17;
      x ^= x << 5; x >>>= 0;
      r.push(0.25 + ((x % 1000) / 1000) * 0.75);
    }
    notchCache.set(key, r);
  }
  return r;
}
/** a sawtooth profile across width w, teeth up to h tall (local origin at the left baseline, teeth point -y) */
export function notchPath(seed: number, w: number, h: number, teeth = 9): Path2D {
  const hs = notchHeights(seed, teeth);
  const p = new Path2D();
  const step = w / teeth;
  p.moveTo(0, 0);
  for (let i = 0; i < teeth; i++) {
    p.lineTo(i * step + step * 0.15, -hs[i] * h);
    p.lineTo(i * step + step * 0.55, -hs[i] * h);
    p.lineTo((i + 1) * step, 0);
  }
  p.lineTo(w, h * 0.35);
  p.lineTo(0, h * 0.35);
  p.closePath();
  return p;
}

// ------------------------------------------------------------------ the well (static base)
export interface WellOpts {
  x: number;
  y: number;
  s?: number;
  /** draw the iron frame that carries the Plate (default true) */
  frame?: boolean;
}
/** stone ring, two posts, winch and the iron Plate frame. Static: bake it. Ink, rim-cut on the tops. */
export function wellBase(c: C2, env: PaintEnv, o: WellOpts): void {
  const s = o.s ?? 1;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  const ink = env.fill('ink');
  const rimCol = env.fill('rim');
  const W = WELL.ringW, H = WELL.ringH;
  // stone ring (front elevation with a slightly elliptical cap)
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-W / 2, 0);
  c.lineTo(-W / 2 + 3, -H);
  c.ellipse(0, -H, W / 2 + 4, 9, 0, Math.PI, 0);
  c.lineTo(W / 2, 0);
  c.closePath();
  c.fill();
  // stone courses: pierced mortar hairlines (rim tone, faint)
  c.strokeStyle = withAlpha(rimCol, 0.16);
  c.lineWidth = 0.9;
  for (let r = 1; r < 4; r++) {
    const yy = -H + r * (H / 4);
    c.beginPath();
    c.moveTo(-W / 2 + 2, yy);
    c.lineTo(W / 2 - 2, yy);
    c.stroke();
    for (let k = 0; k < 6; k++) {
      const xx = -W / 2 + ((k + (r % 2) * 0.5) * W) / 6;
      c.beginPath();
      c.moveTo(xx, yy);
      c.lineTo(xx, yy - H / 4);
      c.stroke();
    }
  }
  // the cap's lit top edge (the moon side)
  c.strokeStyle = withAlpha(rimCol, 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.ellipse(0, -H, W / 2 + 4, 9, 0, Math.PI, Math.PI * 1.75);
  c.stroke();
  // the dark mouth (inside the ring)
  c.fillStyle = mixLab(ink, '#000000', 0.5);
  c.beginPath();
  c.ellipse(0, -H, W / 2 - 6, 5.5, 0, Math.PI, 0);
  c.fill();
  // posts
  c.fillStyle = ink;
  for (const sx of [-1, 1]) {
    c.fillRect(sx * WELL.postX - 5, WELL.winchY - 6, 10, -WELL.winchY - H + 8);
    // post foot
    c.fillRect(sx * WELL.postX - 8, -H - 4, 16, 6);
  }
  // winch drum and crank
  c.fillRect(-WELL.postX, WELL.winchY - 4, WELL.postX * 2, 8);
  c.beginPath();
  c.ellipse(0, WELL.winchY, 22, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(WELL.postX + 4, WELL.winchY - 2, 16, 4);
  c.fillRect(WELL.postX + 17, WELL.winchY - 2, 4, 16);
  // pent roof over the winch
  c.beginPath();
  c.moveTo(-WELL.postX - 16, WELL.winchY - 6);
  c.lineTo(0, WELL.winchY - 30);
  c.lineTo(WELL.postX + 16, WELL.winchY - 6);
  c.lineTo(WELL.postX + 10, WELL.winchY - 4);
  c.lineTo(0, WELL.winchY - 24);
  c.lineTo(-WELL.postX - 10, WELL.winchY - 4);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(rimCol, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-WELL.postX - 16, WELL.winchY - 6);
  c.lineTo(0, WELL.winchY - 30);
  c.lineTo(WELL.postX + 16, WELL.winchY - 6);
  c.stroke();
  if (o.frame !== false) {
    // the iron frame: two thin uprights from the pent roof to a scrolled arch carrying the Plate, like a town clock
    const top = WELL.crown.y - 14;
    c.strokeStyle = ink;
    c.lineWidth = 4;
    c.lineCap = 'round';
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.moveTo(sx * (WELL.postX - 6), WELL.winchY - 10);
      c.bezierCurveTo(sx * (WELL.postX + 4), WELL.winchY - 40, sx * (WELL.plateW / 2 + 12), WELL.plate.y + 30, sx * (WELL.plateW / 2 + 10), WELL.plate.y);
      c.bezierCurveTo(sx * (WELL.plateW / 2 + 8), WELL.plate.y - 30, sx * 30, top - 8, 0, top);
      c.stroke();
      // a scroll curl at each side
      c.lineWidth = 2.4;
      c.beginPath();
      c.arc(sx * (WELL.plateW / 2 + 22), WELL.plate.y + 18, 7, 0, Math.PI * 1.6);
      c.stroke();
      c.lineWidth = 4;
    }
    // finial at the top
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-4, top + 2);
    c.lineTo(0, top - 16);
    c.lineTo(4, top + 2);
    c.closePath();
    c.fill();
    // rim on the frame's upper curves
    c.strokeStyle = withAlpha(rimCol, 0.4);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-(WELL.plateW / 2 + 9), WELL.plate.y - 6);
    c.bezierCurveTo(-(WELL.plateW / 2 + 7), WELL.plate.y - 32, -30, top - 9, 0, top - 1);
    c.stroke();
    // hooks on the posts
    for (const h of [WELL.hook, WELL.hookR]) {
      c.strokeStyle = ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(h.x, h.y - 6);
      c.lineTo(h.x + Math.sign(h.x) * 7, h.y - 6);
      c.arc(h.x + Math.sign(h.x) * 7, h.y - 2, 4, -Math.PI / 2, Math.PI / 2, h.x > 0);
      c.stroke();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the well (live parts)
export interface WellLiveOpts extends WellOpts {
  /** 0 = bucket up at the lip, 1 = down out of sight */
  bucket?: number;
  /** what rides in the bucket: a scroll, a bound book, or nothing */
  load?: 'none' | 'scroll' | 'book' | 'staleScroll';
  /** 0..1 a cold glint on the water far down */
  glint?: number;
  /** 0..1 a warm reflection of a lantern in the water */
  reflect?: number;
  /** rope slack 0..1 (the Well gone quiet) */
  slack?: number;
}
export function wellLive(c: C2, env: PaintEnv, o: WellLiveOpts): void {
  const s = o.s ?? 1;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  const ink = env.fill('ink');
  const b = clamp01(o.bucket ?? 0.25);
  // water: a cold glint or a warm reflection, deep in the mouth
  if ((o.glint ?? 0) > 0) glowDot(c, 8, -WELL.ringH + 1, 26, tone(env, '#cfe3f2', 0.2), 0.35 * (o.glint ?? 0));
  if ((o.reflect ?? 0) > 0) glowDot(c, -6, -WELL.ringH + 1, 32, tone(env, '#f2b860', 0.1), 0.55 * (o.reflect ?? 0));
  // rope from the drum down to the bucket
  const bucketY = lerp(WELL.winchY + 44, -WELL.ringH + 30, b);
  const slack = clamp01(o.slack ?? 0);
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(0, WELL.winchY + 8);
  c.quadraticCurveTo(slack * 18, (WELL.winchY + bucketY) / 2, 0, bucketY - 12);
  c.stroke();
  if (b < 0.98) {
    // the bucket (clipped at the ring mouth when it is going down)
    c.save();
    if (bucketY > -WELL.ringH - 14) {
      c.beginPath();
      c.rect(-80, -400, 160, 400 - WELL.ringH + 2);
      c.clip();
    }
    // load
    if (o.load === 'scroll' || o.load === 'staleScroll') {
      c.fillStyle = mixLab(tone(env, '#e8dcc0', 0.3), env.mood.fg, o.load === 'staleScroll' ? 0.45 : 0.1);
      c.save();
      c.translate(4, bucketY - 13);
      c.rotate(-0.5);
      c.fillRect(-3.5, -12, 7, 16);
      c.restore();
    } else if (o.load === 'book') {
      c.fillStyle = mixLab(tone(env, '#7a5a3a', 0.2), env.mood.fg, 0.2);
      c.fillRect(-7, bucketY - 18, 14, 9);
    }
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-12, bucketY - 12);
    c.lineTo(12, bucketY - 12);
    c.lineTo(9, bucketY + 6);
    c.lineTo(-9, bucketY + 6);
    c.closePath();
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, bucketY - 12, 12, Math.PI, 0);
    c.stroke();
    c.strokeStyle = withAlpha(env.fill('rim'), 0.5);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-12, bucketY - 12);
    c.lineTo(12, bucketY - 12);
    c.stroke();
    c.restore();
  }
  c.restore();
}

// ------------------------------------------------------------------ the Plate
export interface PlateOpts {
  x: number;
  y: number;
  s?: number;
  plate: PlateState;
  /** the tiles' glyphs must be read (raised to the legibility floor: only when the camera is in on the Plate) */
  legible?: boolean;
  /** probe id prefix (legible mode) */
  id?: string;
  /** a small engraved 'workerd · 28 Oct' / 'celld 0.6.3' plate face style: 'brass' (default) or 'plain' (celld) */
  face?: 'brass' | 'plain';
}
const tileText = (v: string | number) => (v === '' ? '' : String(v));
/** the Plate, hung on its frame at the wellhead's plate anchor (x, y = the WELLHEAD base centre, as wellBase) */
export function plate(c: C2, env: PaintEnv, o: PlateOpts): void {
  const s = o.s ?? 1;
  const p = o.plate;
  const A = p.alpha ?? 1;
  if (A <= 0.002) return;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x + WELL.plate.x * s, o.y + WELL.plate.y * s);
  c.scale(s, s);
  const W = WELL.plateW, H = WELL.plateH;
  const open = clamp01(p.open ?? 1);
  // the case lid (swings forward and up when opened: drawn as a thin ellipse above when open)
  const ink = env.fill('ink');
  // backing plate
  c.fillStyle = ink;
  roundRect(c, -W / 2 - 6, -H / 2 - 6, W + 12, H + 12, 6);
  c.fill();
  const face = o.face ?? 'brass';
  const tileW = (W - 16) / 3, tileH = H - 12;
  for (let i = 0; i < 3; i++) {
    const tx = -W / 2 + 4 + i * (tileW + 4);
    const ty = -tileH / 2;
    const flipU = p.flip?.[i] ?? 1;
    const squash = Math.abs(Math.cos(Math.PI * clamp01(flipU)));
    const g = (p.glint?.[i] ?? 0);
    c.save();
    c.translate(tx + tileW / 2, 0);
    c.scale(1, flipU < 1 ? Math.max(0.06, squash) : 1);
    const grad = c.createLinearGradient(0, ty, 0, ty + tileH);
    const base0 = face === 'plain' ? mixLab(tone(env, '#9aa392', 0.3), env.mood.fg, 0.25) : brass(env, 0.3 + 0.5 * g);
    const base = mixLab(base0, env.mood.fg, 0.75 * clamp01(p.dim ?? 0));
    grad.addColorStop(0, mixLab(base, BRASS_HI, (face === 'plain' ? 0.1 : 0.35 * (0.4 + g)) * (1 - clamp01(p.dim ?? 0))));
    grad.addColorStop(1, mixLab(base, env.mood.fg, 0.35));
    c.fillStyle = grad;
    roundRect(c, -tileW / 2, ty, tileW, tileH, 3);
    c.fill();
    c.strokeStyle = withAlpha(mixLab(BRASS, env.mood.fg, 0.7), 0.9);
    c.lineWidth = 1;
    c.stroke();
    // engraved glyph (only when the case is open)
    const val = i === 0 ? p.house : i === 1 ? p.epoch : p.from;
    const txt = tileText(val);
    if (txt && open > 0.05) {
      const draw = () => {
        // lining figures (the display face's numerals are old-style and drop below the line)
        const fam = typeof val === 'number' ? FONT.mono : FONT.display;
        const wt = typeof val === 'number' ? 500 : 700;
        let size = tileH * (typeof val === 'number' ? 0.62 : 0.72);
        if (o.legible) size = Math.max(size, legibleSize(c, `${wt} ${size}px ${fam}`, size));
        size = Math.min(size, tileH * 0.9);
        c.font = `${wt} ${size}px ${fam}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.globalAlpha = A * open;
        c.fillStyle = mixLab('#24180a', env.mood.fg, 0.25);
        c.fillText(txt, 0, 2);
        c.fillStyle = withAlpha(BRASS_HI, 0.25 + 0.4 * g);
        c.fillText(txt, -0.6, 1.2);
        if (o.legible && o.id) textProbe(c, `${o.id}-t${i}`, -tileW / 2, ty, tileW, tileH, A * open);
      };
      textRole(c, o.legible ? 'subject' : 'texture', draw);
    }
    c.restore();
  }
  // engraved captions above the tiles: 'house · epoch · from'
  const cap = clamp01(p.captions ?? 0);
  if (cap > 0.01) {
    textRole(c, o.legible ? 'subject' : 'texture', () => {
      c.save();
      let size = 9.5;
      if (o.legible) size = legibleSize(c, `600 ${size}px ${FONT.sc}`, size, 'house');
      c.font = `600 ${size}px ${FONT.sc}`;
      c.textAlign = 'center';
      c.fillStyle = mixLab(BRASS_HI, env.mood.core, 0.3);
      c.globalAlpha = A * cap;
      const names = ['house', 'epoch', 'from'];
      for (let i = 0; i < 3; i++) {
        const cx = -W / 2 + 4 + i * (tileW + 4) + tileW / 2;
        const tw = c.measureText(names[i]).width;
        // an ink backing so the crown's stem never cuts through a caption
        c.fillStyle = withAlpha(env.fill('ink'), 0.92);
        c.fillRect(cx - tw / 2 - 3, -H / 2 - 9 - size * 0.85, tw + 6, size * 1.05);
        c.fillStyle = mixLab(BRASS_HI, env.mood.core, 0.3);
        c.fillText(names[i], cx, -H / 2 - 9);
      }
      if (o.legible && o.id) textProbe(c, `${o.id}-caps`, -W / 2, -H / 2 - 9 - size, W, size * 1.2, A * cap);
      c.restore();
    });
  }
  // the notched version edge below the tiles
  if (p.notch != null) {
    const u = clamp01(p.recut ?? 1);
    c.save();
    c.translate(-W / 2 + 6, H / 2 + 8);
    const prev = p.notchPrev ?? p.notch;
    // the old profile fades as the new one is cut in, left to right
    c.fillStyle = brass(env, 0.25);
    if (u < 1) {
      c.save();
      c.beginPath();
      c.rect(W * u, -10, W, 20);
      c.clip();
      c.fill(notchPath(prev, W - 12, 7));
      c.restore();
      c.save();
      c.beginPath();
      c.rect(-2, -10, (W - 12) * u + 2, 20);
      c.clip();
      c.fillStyle = brass(env, 0.6);
      c.fill(notchPath(p.notch, W - 12, 7));
      c.restore();
    } else c.fill(notchPath(p.notch, W - 12, 7));
    c.restore();
  }
  // the crown lamp: an iron cage above the plate, lit only when opened
  const cr = clamp01(p.crown);
  c.fillStyle = ink;
  // the crown's stem (hidden behind the captions' backing when they are engraved)
  if (cap <= 0.01) c.fillRect(-1.5, -H / 2 - 18, 3, 12);
  c.beginPath();
  c.moveTo(-7, -H / 2 - 18);
  c.lineTo(7, -H / 2 - 18);
  c.lineTo(5, -H / 2 - 34);
  c.lineTo(0, -H / 2 - 40);
  c.lineTo(-5, -H / 2 - 34);
  c.closePath();
  c.fill();
  // glass of the crown lamp
  const lampCol = tone(env, '#ffcf7a', 0.05);
  c.fillStyle = cr > 0.02 ? mixLab(mixLab(ink, '#3a2a14', 0.6), lampCol, cr) : mixLab(ink, '#2a2f36', 0.35);
  c.fillRect(-3.5, -H / 2 - 32, 7, 12);
  c.restore();
  if (cr > 0.02) {
    const cx = o.x + WELL.plate.x * s, cy = o.y + (WELL.plate.y - H / 2 - 26) * s;
    glowDot(c, cx, cy, 30 * s, lampCol, cr * A);
  }
}

/** a pip that shows where the crown lamp is (for practical lights): world point */
export function crownPt(o: { x: number; y: number; s?: number }): { x: number; y: number } {
  const s = o.s ?? 1;
  return { x: o.x + WELL.plate.x * s, y: o.y + (WELL.plate.y - WELL.plateH / 2 - 26) * s };
}
/** the centre of plate tile i (0 house, 1 epoch, 2 from), world */
export function tilePt(o: { x: number; y: number; s?: number }, i: number): { x: number; y: number } {
  const s = o.s ?? 1;
  const tileW = (WELL.plateW - 16) / 3;
  return { x: o.x + (WELL.plate.x - WELL.plateW / 2 + 4 + i * (tileW + 4) + tileW / 2) * s, y: o.y + WELL.plate.y * s };
}

// ------------------------------------------------------------------ the Tooth
export interface ToothOpts {
  x: number;
  y: number;
  s?: number;
  tooth: ToothState;
}
/** the brass slot on the wellhead lip, its hinged create-shutter, the pawl and its red-tagged pin */
export function tooth(c: C2, env: PaintEnv, o: ToothOpts): void {
  const s = o.s ?? 1;
  const T = o.tooth;
  c.save();
  c.translate(o.x + WELL.slot.x * s, o.y + WELL.slot.y * s);
  c.scale(s, s);
  const ink = env.fill('ink');
  // housing
  c.fillStyle = brass(env, 0.15);
  roundRect(c, -18, -8, 36, 16, 2.5);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(BRASS, env.mood.fg, 0.7), 0.9);
  c.lineWidth = 0.8;
  c.stroke();
  // the slot (a dark mouth)
  c.fillStyle = mixLab(ink, '#000', 0.5);
  c.fillRect(-12, -2.2, 24, 4.4);
  // the shutter: hinged above the slot, swinging down over it
  const sh = clamp01(T.shutter);
  c.save();
  c.translate(0, -8);
  c.rotate(-1.25 * (1 - sh));
  c.fillStyle = brass(env, 0.4);
  c.fillRect(-14, 0, 28, 9 * (0.35 + 0.65 * sh));
  c.restore();
  // the pawl: a small tooth at the right that bites into the slot when the pin is seated
  const bite = clamp01(T.pawl ?? T.pin);
  c.save();
  c.translate(16, -6);
  c.rotate(0.9 * (1 - bite));
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(5, 2);
  c.lineTo(-2, 9);
  c.closePath();
  c.fill();
  c.restore();
  // the pin with its red tag (seated through the pawl's pivot)
  if (T.showPin !== false) {
    const out = clamp01(T.pinOut ?? (1 - T.pin));
    pinShape(c, env, 18 + out * 40, -6 + out * 22, 0.4 + out * 0.6, 1);
  }
  c.restore();
  // click / thunk flash
  const fl = T.flash ?? 0;
  if (fl > 0.01) {
    const p = { x: o.x + WELL.slot.x * s, y: o.y + WELL.slot.y * s };
    glowDot(c, p.x, p.y, 26 * s, T.flashKind === 'thunk' ? tone(env, EMBER, 0.2) : tone(env, BRASS_HI, 0.1), fl * (T.flashKind === 'thunk' ? 0.5 : 0.8));
  }
}

/** a brass pin with a red paper tag (drawn about its head at (x, y), local scale) */
export function pinShape(c: C2, env: PaintEnv, x: number, y: number, rot: number, s: number, alpha = 1): void {
  if (alpha <= 0.002) return;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = brass(env, 0.6);
  c.fillRect(-1, 0, 2, 16);
  c.beginPath();
  c.arc(0, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  // tag on a short string
  c.strokeStyle = withAlpha(env.fill('ink'), 0.9);
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-6, -7);
  c.stroke();
  c.fillStyle = tone(env, '#c43a26', 0.12);
  c.save();
  c.translate(-6, -7);
  c.rotate(-0.5);
  c.beginPath();
  c.moveTo(-3, -1);
  c.lineTo(5, -1);
  c.lineTo(5, 7);
  c.lineTo(-3, 7);
  c.lineTo(-5, 3);
  c.closePath();
  c.fill();
  c.restore();
  c.restore();
}

// ------------------------------------------------------------------ swap cards
export interface SwapCardOpts {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  house?: House;
  /** the version pattern this card read (null = no notch: a plain create card) */
  notch?: number | null;
  /** 0..1 a punched hole (refused) */
  punched?: number;
  glint?: number;
  alpha?: number;
  /** a small engraved symbol instead of a house letter (the celld test rig): '+', '++', '~', '~!' */
  symbol?: string;
  legible?: boolean;
  id?: string;
}
/** a brass swap card (x, y = centre), 34 x 22 at s = 1, the notched read version along its top edge */
export function swapCard(c: C2, env: PaintEnv, o: SwapCardOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s, s);
  const W = 34, H = 22;
  const g = c.createLinearGradient(0, -H / 2, 0, H / 2);
  g.addColorStop(0, brass(env, 0.4 + 0.5 * (o.glint ?? 0)));
  g.addColorStop(1, mixLab(brass(env, 0.1), env.mood.fg, 0.3));
  c.fillStyle = g;
  c.fillRect(-W / 2, -H / 2, W, H);
  if (o.notch != null) {
    c.save();
    c.translate(-W / 2 + 2, -H / 2);
    c.fill(notchPath(o.notch, W - 4, 4.5));
    c.restore();
  }
  c.strokeStyle = withAlpha(mixLab(BRASS, env.mood.fg, 0.7), 0.9);
  c.lineWidth = 0.7;
  c.strokeRect(-W / 2, -H / 2, W, H);
  const glyph = o.symbol ?? o.house ?? '';
  if (glyph) {
    textRole(c, o.legible ? 'subject' : 'texture', () => {
      let size = 13;
      if (o.legible) size = legibleSize(c, `700 ${size}px ${FONT.display}`, size);
      c.font = `700 ${Math.min(size, 20)}px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = mixLab('#24180a', env.mood.fg, 0.25);
      c.fillText(glyph, -3, 2);
      if (o.legible && o.id) textProbe(c, o.id, -W / 2, -H / 2, W, H, a);
    });
  }
  const pu = clamp01(o.punched ?? 0);
  if (pu > 0.01) {
    c.fillStyle = mixLab(env.fill('ink'), '#000', 0.4);
    c.beginPath();
    c.arc(W * 0.3, 2, 3.6 * pu, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

export function roundRect(c: C2, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
