/**
 * handwired-explained — ch02 helpers (the period rooms of "The Oldest Tags"), shared by ch02-s01..s05.
 *
 * staging.tagLine.variants.ch02: PERIOD ROOMS. The same line passes through each era's room slung lower (50 % of
 * frame height) and older (a dull bronze wire), the posts replaced by what the room has. The canonical tagLine set
 * draws the line at 58 % (LINE.y = 418); `onPeriodLine` shifts its painters up so every tag, thread and the Lifespan
 * Rule keep the canonical geometry relative to the line:
 *
 *   onPeriodLine(c, () => { drawLine(c, env, { metal: 'bronze', posts: 'none', x0: -400, x1: 1700 }); drawTag(...) });
 *   PERIOD_Y (360) is the line's height in rest-screen px; periodToWorld(y) maps a canonical y to the room's.
 *
 *   camAt(keys, t)            piecewise camera path (cam3Interp between keys, smootherstep eased): pure in t
 *   sm, smr, clamp01, seg     easing helpers (seg(t, a, b) = smoothstep of t across [a, b])
 *   knotCards(c, env, eye, labels, kin, s)   a tag's typeset knot card(s) as PROP LETTERING (texture), for shots that
 *                             push in on a tag front (drawTag marks its knot cards as subject with the front)
 *   quoteSlip(c, o, env)      a screen-locked parchment slip: two large words + a small attribution (ch02-s01's
 *                             'propositional logic'), deckled, lamp-lit, with a probe for the cards audit
 */
import type { Camera3, PaintEnv } from '../../../film/contracts';
import { cam3Interp } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { LINE } from './tagLine';

export const PERIOD_Y = 360;
export const PERIOD_DY = PERIOD_Y - LINE.y;
export const periodToWorld = (y: number) => y + PERIOD_DY;

/** run canonical tagLine painters (drawLine, drawTag, drawTags, drawRule) with the line at the ch02 height */
export function onPeriodLine(c: CanvasRenderingContext2D, fn: () => void) {
  c.save();
  c.translate(0, PERIOD_DY);
  fn();
  c.restore();
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** smootherstep: gentler starts and stops for camera moves */
export const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

export interface CamKey {
  t: number;
  cam: Camera3;
}
/** the camera at t along a list of keys (held before the first and after the last) */
export function camAt(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

/** a damped release swing (radians) for a tag let go at t0: amplitude a0 decaying to the idle 0.025 */
export function releaseSwing(t: number, t0: number, a0 = 0.16) {
  const dt = Math.max(0, t - t0);
  return 0.025 + (a0 - 0.025) * Math.exp(-dt * 1.1);
}

export interface SlipOpts {
  /** centre and size (stage px, screen-locked) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** extra rotation (radians) */
  rot?: number;
  /** 0..1 the words' ink */
  ink: number;
  /** 0..1 the attribution's ink */
  attrib: number;
  /** 0..1 a warm kick on the words (beat) */
  kick?: number;
  /** 0..1 the page's own drawing (arrow-and-loop net diagrams) still showing */
  diagrams?: number;
  /** overall paper presence */
  alpha?: number;
  words: string;
  attribution: string;
  /** true once the slip is at full size (the legibility audit counts the words then) */
  subject?: boolean;
  id: string;
}

/** parchment paper resolved toward the lamp */
export const slipPaper = (env: Pick<PaintEnv, 'mood'>) => mixLab('#eadcbf', env.mood.core, 0.12);
export const slipInk = (env: Pick<PaintEnv, 'mood'>) => mixLab('#2a1d14', env.mood.ink, 0.2);

/** the page of arrow-and-loop net diagrams (McCulloch-Pitts style: small circles, arrows, closed loops), drawn in a
 *  w x h box centred on 0,0 in ink of alpha a */
export function netDiagrams(c: CanvasRenderingContext2D, w: number, h: number, ink: string, a: number) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = ink;
  c.fillStyle = ink;
  const u = Math.min(w, h * 1.6) / 100;
  c.lineWidth = Math.max(0.5, 0.9 * u);
  // three small nets in a row: inputs -> cell, a cell with a loop back onto itself, two cells chained
  const nets: [number, number][] = [[-w * 0.3, -h * 0.18], [w * 0.02, -h * 0.18], [w * 0.3, -h * 0.18], [-w * 0.18, h * 0.22], [w * 0.2, h * 0.22]];
  nets.forEach(([cx, cy], i) => {
    const r = 5.2 * u;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    // two incoming arrows from the left
    for (const dy of [-r * 1.6, r * 1.6]) {
      c.beginPath();
      c.moveTo(cx - r * 4, cy + dy);
      c.lineTo(cx - r * 1.05, cy + dy * 0.3);
      c.stroke();
      c.beginPath();
      c.arc(cx - r * 1.05, cy + dy * 0.3, 1.1 * u, 0, Math.PI * 2);
      c.fill();
    }
    // the output, and on alternating nets a closed loop back onto the cell
    c.beginPath();
    c.moveTo(cx + r, cy);
    c.lineTo(cx + r * 3.4, cy);
    c.stroke();
    if (i % 2 === 0) {
      c.beginPath();
      c.ellipse(cx + r * 0.2, cy - r * 1.9, r * 1.1, r * 0.9, 0, Math.PI * 0.75, Math.PI * 2.25);
      c.stroke();
    }
  });
  // ruled text lines under the figures
  c.globalAlpha *= 0.5;
  for (let i = 0; i < 3; i++) c.fillRect(-w * 0.38, h * 0.38 + i * 3.2 * u, w * (0.76 - (i % 2) * 0.2), 0.7 * u);
  c.restore();
}

/** a deckled parchment slip (screen-locked: call after the layers on f.c) */
export function quoteSlip(c: CanvasRenderingContext2D, o: SlipOpts, env: Pick<PaintEnv, 'mood'>) {
  const A = clamp01(o.alpha ?? 1);
  if (A <= 0.002) return;
  const paper = slipPaper(env);
  const ink = slipInk(env);
  c.save();
  c.translate(o.x, o.y);
  if (o.rot) c.rotate(o.rot);
  c.globalAlpha = A;
  // a soft cast shadow, then the paper with a slightly irregular (deckled) edge
  const deck = (dx: number, dy: number, grow: number) => {
    c.beginPath();
    const w = o.w / 2 + grow, h = o.h / 2 + grow;
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const x = -w + (2 * w * i) / N;
      const j = Math.sin(i * 2.7) * 0.9 + Math.sin(i * 7.3) * 0.5;
      if (i === 0) c.moveTo(x + dx, -h + j + dy);
      else c.lineTo(x + dx, -h + j + dy);
    }
    for (let i = 0; i <= N; i++) {
      const x = w - (2 * w * i) / N;
      const j = Math.sin(i * 3.1 + 1) * 0.9 + Math.sin(i * 6.1) * 0.5;
      c.lineTo(x + dx, h + j + dy);
    }
    c.closePath();
  };
  c.save();
  c.filter = `blur(${Math.max(2, o.w * 0.012).toFixed(1)}px)`;
  c.fillStyle = withAlpha(env.mood.fg, 0.55);
  deck(o.w * 0.015, o.h * 0.05, 2);
  c.fill();
  c.restore();
  const g = c.createLinearGradient(0, -o.h / 2, 0, o.h / 2);
  g.addColorStop(0, mixLab(paper, env.mood.core, 0.18));
  g.addColorStop(1, mixLab(paper, env.mood.halo, 0.22));
  c.fillStyle = g;
  deck(0, 0, 0);
  c.fill();
  // a lamp-warm wash from the upper left and a faint inner rule
  const lg = c.createRadialGradient(-o.w * 0.3, -o.h * 0.6, 0, -o.w * 0.3, -o.h * 0.6, o.w * 0.9);
  lg.addColorStop(0, withAlpha(env.mood.core, 0.16));
  lg.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = lg;
  c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
  c.strokeStyle = withAlpha(ink, 0.22);
  c.lineWidth = Math.max(0.5, o.w * 0.0016);
  c.strokeRect(-o.w / 2 + o.w * 0.035, -o.h / 2 + o.h * 0.09, o.w * 0.93, o.h * 0.82);
  // the page's own diagrams (fading out as the words ink in)
  netDiagrams(c, o.w * 0.86, o.h * 0.78, ink, clamp01(o.diagrams ?? 0));
  // the words
  const k = clamp01(o.kick ?? 0);
  const scale = o.w / 520;
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    // review r1 (ch02-s01): the two words dominate; the attribution is small (at the legibility floor, ~40 % of the
    // words' cap height)
    const base = 52 * scale;
    const size = o.subject ? Math.max(base, legibleSize(c, `italic 400 ${base}px ${FONT.text}`, base)) : base;
    c.font = `italic 400 ${size.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const wy = -o.h * 0.04;
    if (k > 0.01) {
      // the warm kick: a lamp-coloured bloom behind the words, then the ink warms toward copper
      c.save();
      c.globalCompositeOperation = 'lighter';
      const kg = c.createRadialGradient(0, wy - size * 0.3, 0, 0, wy - size * 0.3, o.w * 0.5);
      kg.addColorStop(0, withAlpha(env.mood.halo, 0.32 * k));
      kg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = kg;
      c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      c.restore();
    }
    const wi = clamp01(o.ink);
    if (wi > 0) {
      c.globalAlpha = A * wi;
      c.fillStyle = mixLab(ink, '#8a4a22', 0.55 * k);
      c.fillText(o.words, 0, wy);
      const tw = c.measureText(o.words).width;
      textProbe(c, `${o.id}-words`, -tw / 2, wy - size, tw, size * 1.2, A * wi);
    }
    const ai = clamp01(o.attrib);
    if (ai > 0) {
      const as = o.subject ? legibleSize(c, `600 ${12 * scale}px ${FONT.sc}`, 12 * scale, o.attribution.toLowerCase()) : 12 * scale;
      c.font = `600 ${as.toFixed(2)}px ${FONT.sc}`;
      c.globalAlpha = A * ai * 0.92;
      c.fillStyle = mixLab(ink, paper, 0.18);
      const txt = o.attribution.toLowerCase();
      c.letterSpacing = `${(as * 0.04).toFixed(2)}px`;
      c.fillText(txt, 0, o.h * 0.3);
      c.letterSpacing = '0px';
    }
  });
  c.globalAlpha = 1;
  cardProbe(c, o.id, -o.w / 2, -o.h / 2, o.w, o.h, A, Math.max(clamp01(o.ink), clamp01(o.diagrams ?? 0)));
  c.restore();
}

const threadTone = (env: PaintEnv) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);

/**
 * The holder cards threaded through a tag's eyelet, hanging to the left of its string (the same geometry as tagLine's
 * drawTag), drawn as texture: prop lettering already said aloud. `eye` is the eyelet (in the coordinates the tag was
 * drawn in), `kin` 0..1 threads them in (the newest card last: pass `newest` to thread only that one).
 */
export function knotCards(c: CanvasRenderingContext2D, env: PaintEnv, eye: { x: number; y: number }, labels: string[], kin: number, s: number, newest?: { kin: number }) {
  if (!labels.length || kin <= 0) return;
  c.save();
  labels.forEach((label, i) => {
    const k = newest && i === labels.length - 1 ? clamp01(newest.kin) : clamp01(kin);
    if (k <= 0) return;
    textRole(c, 'texture', () => {
      const fs = 6.6 * s;
      c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
      const tw = c.measureText(label).width;
      const cw = tw + 8 * s, ch = fs + 6 * s;
      const kx = eye.x - cw - 6 * s - i * 4 * s, ky = eye.y - ch * 0.4 + i * (ch + 2 * s) + (1 - k) * -8 * s;
      c.globalAlpha = k;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
      c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
      c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
      c.fillRect(kx, ky, cw, ch);
      c.strokeStyle = threadTone(env);
      c.lineWidth = 0.9 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
      c.beginPath();
      c.moveTo(kx + cw, ky + ch * 0.5);
      c.lineTo(eye.x, eye.y + 7 * s);
      c.stroke();
      c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.fillText(label, kx + 4 * s, ky + ch * 0.55);
      // the card and its lettering thread in together (one alpha): probe it for the cards audit
      cardProbe(c, `knot-${label}`, kx, ky, cw, ch, k, k);
    });
  });
  c.restore();
}
