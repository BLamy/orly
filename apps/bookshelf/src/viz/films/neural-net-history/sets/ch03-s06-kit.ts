/**
 * neural-net-history — small helpers shared by ch03-s06, ch03-s08 and ch03-s09 (one animator's group).
 *
 *   clamp01 / sm / lerp / win / tq12 / monotone / ordered / smearX   (re-exported from ch02-s05b-util)
 *   smearY(f, px)                       vertical motion smear of the whole frame (a whip tilt's blur)
 *   W2_VIEW, W3_VIEW                    the Wall slips this group pins (W2 chess, W3 Rosenblatt 1961)
 *   drawChessSlip(c, o, env, sway?)     W2 as it hangs from ch03-s06 on: the typed slip (no redundant header,
 *                                       so it reads at a WALL insert) and a small manila due-date tag (1968)
 *                                       hanging from its pin on a short thread
 *   pinSway(dt)                         the settle swing of a freshly pinned card/slip (on the twos)
 *   camKeys(keys)                       monotone camera from [t, x, y, z] keys
 *   dateStamp(c, mood, t, at, until, s) a date-only typewriter stamp, bottom-left
 *   lampSpill(f, k)                     the lamp's warm spill from the lower right + motes (study inserts)
 *   stageLip(f, cams, key, lipY?)       the candle stage's near apron edge + footlight hoods (L5, blurred)
 *   ROSE_STAGE                          Rosenblatt as he stands on the candle stage in s06 and s09: the cast
 *                                       spec in his interview jacket (hem flare, soft notch collar, narrow tie)
 *                                       with a fuller head of hair (hairScale 1.15) as his silhouette signature
 */
import type { Camera3, Frame, PaintEnv, Palette } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, softPlate, textColor } from '../../../film/silhouette/type';
import { dustMotes, makeCanvas } from '../../../film/silhouette/atmosphere';
import { drawSlip, WALL_SLOTS } from './wallOfForecasts';
import { paperTone } from './caseBoard';
import { monotone, ordered } from './ch02-s05b-util';
import { createPuppet } from '../../../film/silhouette/puppet';
import { SPECS } from '../cast';

/** Rosenblatt on the candle stage (s06, s09): jacket and tie for the magazine, fuller hair as his signature */
export const ROSE_STAGE = createPuppet({
  ...SPECS.rosenblatt,
  id: 'rosenblatt-stage',
  wardrobe: 'blazer',
  details: ['lapel', 'buttons', 'pocketFlap', 'crease'],
  signature: { ...SPECS.rosenblatt.signature, hairScale: 1.15 },
});

export { clamp01, sm, lerp, win, tq12, monotone, ordered, smearX, blurRect } from './ch02-s05b-util';

/** W2 as typed on the slip in ch03-s06 (the script's label, word for word); the due date is its tag */
export const W2_VIEW = { slot: 'W2' as const, who: '', text: 'SIMON & NEWELL · CHESS CHAMPION BY 1968' };
/** the W2 slip typed as three lines (the script's label, word for word, broken by sense) */
export const W2_LINES = ['SIMON & NEWELL', 'CHESS CHAMPION', 'BY 1968'] as const;
/** W3: Rosenblatt's 1961 sentence (pinned ch03-s08) */
export const W3_VIEW = { slot: 'W3' as const, who: 'ROSENBLATT · 1961', text: 'Linguistic capability, related to perceptual experience, is of the essence…' };

/** the settle swing of a freshly pinned card (radians), dt = seconds since the press */
export const pinSway = (dt: number) => (dt > 0 ? 0.04 * Math.exp(-dt * 2.6) * Math.sin(dt * 9) : 0);

export interface ChessSlipDraw {
  /** slip centre (layer px) */
  x: number;
  y: number;
  k: number;
  light: number;
  /** rotation about the pin (a settle swing) */
  rot?: number;
  pin?: boolean;
  /** the due tag's own little swing (radians) */
  tagSway?: number;
  alpha?: number;
}

/** W2: the chess slip with its due-date tag hanging from the pin */
export function drawChessSlip(c: CanvasRenderingContext2D, o: ChessSlipDraw, env: PaintEnv) {
  const sz = WALL_SLOTS.W2;
  const pinY = o.y - (sz.h / 2 - 6) * o.k;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  if (o.rot) {
    c.translate(o.x, pinY);
    c.rotate(o.rot);
    c.translate(-o.x, -pinY);
  }
  // the slip itself (blank), then its three typed lines set by hand so no word is orphaned:
  // 'SIMON & NEWELL' / 'CHESS CHAMPION' / 'BY 1968'
  drawSlip(c, { ...W2_VIEW, text: '' }, { x: o.x, y: o.y, k: o.k, light: o.light, pin: o.pin }, env);
  {
    const paper = paperTone(env, o.light);
    const ink = mixLab(env.mood.ink, paper, 0.1);
    const seedRot = hash1(1, 23) * 0.04; // drawSlip's own seeded tilt for W2 (ORDER index 1)
    c.save();
    c.translate(o.x, o.y);
    c.rotate(seedRot);
    const maxW = sz.w * o.k * 0.86;
    let size = 10.5 * o.k;
    c.font = `400 ${size}px ${FONT.typewriter}`;
    const widest = Math.max(...W2_LINES.map((l) => c.measureText(l).width));
    if (widest > maxW) {
      size *= maxW / widest;
      c.font = `400 ${size}px ${FONT.typewriter}`;
    }
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const lh = size * 1.22;
    W2_LINES.forEach((l, i) => c.fillText(l, 0, 3 * o.k + (i - 1) * lh));
    c.restore();
  }
  // the due-date tag: a small manila tag on a thread from the pin; the thread rests along the slip's top
  // edge to its right shoulder and the tag hangs just past the slip's edge (never over the typing)
  const k = o.k;
  const px = o.x, py = pinY;
  const sx = o.x + (sz.w / 2 + 1) * k, sy = o.y - sz.h / 2 * k + 1 * k;
  const a = o.tagSway ?? 0;
  const L = 16 * k;
  const tx = sx + 4 * k + Math.sin(a) * L, ty = sy + Math.cos(a) * L;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.set, 0.3), 0.8);
  c.lineWidth = 0.8 * k;
  c.beginPath();
  c.moveTo(px, py);
  c.quadraticCurveTo((px + sx) / 2, sy - 1.5 * k, sx, sy);
  c.quadraticCurveTo(sx + 4 * k, sy + L * 0.4, tx, ty);
  c.stroke();
  c.save();
  c.translate(tx, ty);
  c.rotate(-a * 0.6);
  const tw = 36 * k, th = 17 * k;
  const manila = mixLab(paperTone(env, o.light * 0.9), mixLab(env.mood.halo, '#9a7a3c', 0.5), 0.45);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-tw * 0.1 + 1.5 * k, 2.5 * k, tw, th);
  c.fillStyle = manila;
  c.beginPath();
  // a tag with clipped top corners and a reinforced eyelet
  c.moveTo(-tw * 0.1 + 4 * k, 0);
  c.lineTo(-tw * 0.1 + tw - 4 * k, 0);
  c.lineTo(-tw * 0.1 + tw, 4 * k);
  c.lineTo(-tw * 0.1 + tw, th);
  c.lineTo(-tw * 0.1, th);
  c.lineTo(-tw * 0.1, 4 * k);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.beginPath();
  c.arc(0, 3.2 * k, 1.4 * k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, manila, 0.12);
  c.font = `400 ${10.5 * k}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('1968', -tw * 0.1 + tw / 2 + 1 * k, th * 0.6);
  c.restore();
  c.restore();
}

/** a monotone camera through [t, x, y, z] keys (lens 1) */
export function camKeys(keys: [number, number, number, number][], gap = 0.3): (t: number) => Camera3 {
  const ts = ordered(keys.map((k) => [k[0], 0] as [number, number]), gap).map(([t]) => t);
  const fx = monotone(keys.map((k, i) => [ts[i], k[1]])), fy = monotone(keys.map((k, i) => [ts[i], k[2]])), fz = monotone(keys.map((k, i) => [ts[i], k[3]]));
  return (t) => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
}

// ------------------------------------------------------------------ vertical smear (a whip tilt)
let fyCanvas: HTMLCanvasElement | null = null;
export function smearY(f: Frame, px: number) {
  if (px < 0.75) return;
  const W = f.c.canvas.width, H = f.c.canvas.height;
  if (!fyCanvas || fyCanvas.width !== W || fyCanvas.height !== H) fyCanvas = makeCanvas(W, H);
  const g = fyCanvas.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'copy';
  g.filter = 'none';
  g.drawImage(f.c.canvas, 0, 0);
  const c = f.c;
  const d = px * f.pxScale;
  const n = Math.max(3, Math.min(9, Math.ceil(px / 2)));
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - 0.5) * d;
    c.globalAlpha = 1 / (i + 1);
    c.drawImage(fyCanvas, 0, o);
  }
  c.restore();
}

// ------------------------------------------------------------------ a typewriter date stamp (date only, bottom-left)
/** a date-only stamp, typed on on the twos (Special Elite before 1970), bottom-left on a soft plate */
export function dateStamp(c: CanvasRenderingContext2D, m: Palette, t: number, at: number, until: number, text: string) {
  const A = Math.max(0, Math.min(1, (t - at) / 0.15)) * (1 - Math.max(0, Math.min(1, (t - (until - 0.5)) / 0.5)));
  if (A <= 0) return;
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * 14 + 1e-6) + 1));
  c.save();
  c.globalAlpha = A;
  softPlate(c, 48 + 40, 664, 260, 90, m.ink, 0.5);
  c.font = `400 26px ${FONT.typewriter}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const adv = c.measureText('M').width * 1.02;
  for (let i = 0; i < shown; i++) {
    c.globalAlpha = A * (0.8 + 0.2 * (hash1(i, 61) * 0.5 + 0.5));
    c.fillStyle = textColor(m);
    c.fillText(text[i], 48 + i * adv, 672 + hash1(i, 62) * 0.6);
  }
  c.restore();
}

/** the green-shaded lamp's warm spill from the lower right (the lamp side), screen-space, additive; with a
 *  few motes turning in it. Use in study inserts where the near-plane lamp itself would be out of frame. */
export function lampSpill(f: Frame, k = 1, motes = true) {
  if (k <= 0) return;
  const c = f.c;
  const m = f.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(1230, 820, 30, 1230, 820, 760);
  g.addColorStop(0, withAlpha(m.halo, 0.16 * k));
  g.addColorStop(0.5, withAlpha(m.halo, 0.05 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.restore();
  if (motes) {
    const env = { mood: m, t: f.t, seed: f.seed } as unknown as PaintEnv;
    dustMotes(c, { area: { x: 380, y: 60, w: 900, h: 640 }, count: 30, salt: 77, size: 1.1, brightness: 0.45 * k, drift: { x: -5, y: -2.5 }, color: m.halo }, env);
  }
}

// ------------------------------------------------------------------ the candle stage's near lip (L5)
/** L5: the stage's near lip (the apron edge) with three dark footlight hoods, out of focus */
export function stageLip(f: Frame, cams: Camera3[], key: string, LIP_Y = 594) {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 60);
    f.cached(`${key}/stage/L5/lip/${LIP_Y}/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 340, (cc) => {
      cc.translate(-r.x, -540);
      const fg = env.fill('fg');
      // the apron: a long, slightly bowed board edge across the bottom of frame
      cc.fillStyle = fg;
      cc.beginPath();
      cc.moveTo(r.x, LIP_Y);
      cc.quadraticCurveTo(r.x + r.w / 2, LIP_Y - 14, r.x + r.w, LIP_Y + 2);
      cc.lineTo(r.x + r.w, 860);
      cc.lineTo(r.x, 860);
      cc.closePath();
      cc.fill();
      // footlight hoods: low domes on the lip, their tops catching a little of the candle
      for (const hx of [260, 640, 1020, 1400]) {
        cc.fillStyle = fg;
        cc.beginPath();
        cc.ellipse(hx, LIP_Y - 6, 46, 22, 0, Math.PI, 0);
        cc.fill();
        cc.fillRect(hx - 50, LIP_Y - 10, 100, 12);
      }
      // the lip's top edge: a thin rim where the candle light grazes it
      cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(r.x, LIP_Y);
      cc.quadraticCurveTo(r.x + r.w / 2, LIP_Y - 14, r.x + r.w, LIP_Y + 2);
      cc.stroke();
    })(c, r.x, 540);
  });
}

