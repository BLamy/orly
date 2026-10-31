/**
 * neural-net-history — THE PAPER GLOBE OF LIT WINDOWS (kitWork props/paperGlobe; ch07-s03, ch07-s04's wipe,
 * ch15-s07). A dark paper sphere turning slowly, its surface a scatter of tiny paper windows that light one by
 * one and then by the hundred (a seeded order), rim-lit by the era's backlight.
 *
 *   paperGlobe(c, { x, y, R, rot, lit, seed?, rim?, office? }, env)
 *     rot     longitude turn (radians)        lit   0..1 fraction of windows lit (litFraction)
 *     office  0..1: the one big office window (Princeton) drawn lit at its fixed place
 *   globeWindows(o)        → visible windows' { x, y, z, lit, i } (for leader lines and sparks)
 *   OFFICE_WINDOW          the office window's sphere coords; officeWindowAt(o) → { x, y, z }
 *   marketAwning(c, x, y, s, env)   a small striped market-stall awning cut-out (pictogram, no lettering)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { softSprite } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
const N = 760;
/** windows on a Fibonacci sphere (uniform), each with its own light order */
const WIN = (() => {
  const out: { lat: number; lon: number; rank: number; w: number }[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) * (2 / N);
    const lat = Math.asin(y);
    const lon = i * ga + 0.35 * hash1(i, 91);
    out.push({ lat, lon, rank: 0, w: 0.75 + 0.5 * (0.5 + 0.5 * hash1(i, 93)) });
  }
  // light order: a few early "one by one", the rest roughly random
  const keys = out.map((_, i) => ({ i, k: 0.5 + 0.5 * hash1(i, 97) }));
  keys.sort((a, b) => a.k - b.k);
  keys.forEach((q, r) => (out[q.i].rank = r / N));
  return out;
})();
export const OFFICE_WINDOW = { lat: 0.42, lon: -0.18 };
/** the office window's size on the globe, in units of R/260 (landscape: the office frame is 16:9) */
export const OFFICE_W = 22;

/** rough continent outlines (lon, lat degrees), cut from slightly lighter paper; placed so Princeton (−74.6°,
 *  40.3°) sits under the office window (a paper globe's tilt: latitudes shift by −16°) */
const CONT: [number, number][][] = [
  // North America
  [[-165, 64], [-140, 70], [-95, 72], [-78, 64], [-62, 52], [-70, 43], [-76, 36], [-81, 30], [-81, 25], [-90, 29], [-97, 26], [-105, 19], [-92, 15], [-83, 9], [-79, 9], [-88, 16], [-106, 23], [-117, 32], [-124, 40], [-125, 50], [-140, 59], [-158, 57], [-166, 61]],
  // Greenland
  [[-55, 60], [-43, 60], [-22, 70], [-20, 80], [-45, 83], [-68, 79], [-58, 70]],
  // South America
  [[-79, 9], [-61, 10], [-50, 1], [-35, -6], [-40, -22], [-57, -37], [-66, -55], [-74, -48], [-71, -20], [-81, -5]],
  // Europe and Asia
  [[-10, 37], [-9, 44], [-4, 48], [-5, 58], [8, 63], [24, 71], [60, 70], [100, 77], [140, 72], [175, 66], [160, 58], [141, 52], [130, 42], [121, 31], [108, 21], [104, 9], [98, 16], [92, 22], [80, 8], [73, 20], [57, 25], [49, 30], [36, 36], [27, 40], [12, 38]],
  // Africa
  [[-17, 15], [-10, 30], [10, 37], [32, 31], [43, 12], [51, 12], [40, -10], [35, -25], [20, -35], [12, -17], [9, 4], [-8, 5]],
  // Australia
  [[114, -22], [130, -12], [142, -11], [153, -28], [146, -39], [135, -35], [115, -34]],
].map((poly) => poly.map(([lo, la]) => [((lo + 74.6) * Math.PI) / 180 + OFFICE_WINDOW.lon, (Math.max(-80, Math.min(80, la - 16)) * Math.PI) / 180] as [number, number]));
/** paper continents: front-facing vertices project; back-facing ones are pushed onto the limb */
function continents(c: C, o: GlobeDraw, fill: string) {
  c.fillStyle = fill;
  for (const poly of CONT) {
    let front = 0;
    c.beginPath();
    poly.forEach(([lon, lat], i) => {
      const p = project(o, lat, lon);
      let x = p.x, y = p.y;
      if (p.z < 0) {
        const dx = x - o.x, dy = y - o.y, d = Math.hypot(dx, dy) || 1;
        x = o.x + (dx / d) * o.R;
        y = o.y + (dy / d) * o.R;
      } else front++;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    });
    c.closePath();
    if (front > 0) c.fill();
  }
}

export interface GlobeDraw {
  x: number;
  y: number;
  R: number;
  rot: number;
  lit: number;
  seed?: number;
  /** rim light strength 0..1 (the backlight behind the globe, upper left) */
  rim?: number;
  office?: number;
  alpha?: number;
}

function project(o: GlobeDraw, lat: number, lon: number) {
  const L = lon + o.rot;
  const z = Math.cos(lat) * Math.cos(L);
  return { x: o.x + o.R * Math.cos(lat) * Math.sin(L), y: o.y - o.R * Math.sin(lat), z, sx: Math.cos(L) };
}
export function officeWindowAt(o: GlobeDraw) {
  return project(o, OFFICE_WINDOW.lat, OFFICE_WINDOW.lon);
}
export function globeWindows(o: GlobeDraw) {
  const out: { x: number; y: number; z: number; lit: boolean; i: number }[] = [];
  for (let i = 0; i < N; i++) {
    const w = WIN[i];
    const p = project(o, w.lat, w.lon);
    if (p.z <= 0.05) continue;
    out.push({ x: p.x, y: p.y, z: p.z, lit: w.rank < o.lit, i });
  }
  return out;
}

const sprites = new Map<string, HTMLCanvasElement>();
const sprite = (col: string) => {
  let s = sprites.get(col);
  if (!s) {
    s = softSprite(col, 0.2);
    sprites.set(col, s);
    if (sprites.size > 16) sprites.delete(sprites.keys().next().value as string);
  }
  return s;
};

export function paperGlobe(c: C, o: GlobeDraw, env: PaintEnv) {
  const m = env.mood;
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const ink = env.fill('ink');
  const R = o.R;
  c.save();
  c.globalAlpha *= A;
  // the body: a dark paper sphere, a faint terminator toward the rim light
  c.fillStyle = ink;
  c.beginPath();
  c.arc(o.x, o.y, R, 0, Math.PI * 2);
  c.fill();
  const body = c.createRadialGradient(o.x - R * 0.45, o.y - R * 0.4, R * 0.1, o.x, o.y, R);
  body.addColorStop(0, withAlpha(mixLab(m.set, m.halo, 0.15), 0.55));
  body.addColorStop(0.7, withAlpha(m.set, 0.18));
  body.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = body;
  c.beginPath();
  c.arc(o.x, o.y, R, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.arc(o.x, o.y, R, 0, Math.PI * 2);
  c.clip();
  // paper-cut graticule: parallels and turning meridians (rim cut-lines, faint)
  c.strokeStyle = withAlpha(m.rim, 0.1);
  c.lineWidth = 0.9;
  for (let k = -2; k <= 2; k++) {
    const lat = (k * Math.PI) / 7;
    c.beginPath();
    c.ellipse(o.x, o.y - R * Math.sin(lat), R * Math.cos(lat), R * Math.cos(lat) * 0.06, 0, 0, Math.PI);
    c.stroke();
  }
  for (let k = 0; k < 8; k++) {
    const L = ((k * Math.PI) / 4 + o.rot) % (Math.PI * 2);
    const sx = Math.sin(L);
    if (Math.cos(L) < 0) continue;
    c.beginPath();
    c.ellipse(o.x, o.y, Math.abs(sx) * R, R, 0, -Math.PI / 2, Math.PI / 2, sx < 0);
    c.stroke();
  }
  // the continents, cut from slightly lighter paper, their dawn-side edges catching the rim
  continents(c, o, mixLab(ink, mixLab(m.set, m.setHaze, 0.5), 0.42));
  // the NIGHT SIDE: a second, darker sheet of cut paper laid over the lower right, its deckled edge the
  // terminator (the dawn is behind the upper-left limb)
  c.fillStyle = withAlpha(ink, 0.5);
  c.beginPath();
  c.arc(o.x, o.y, R + 2, 0, Math.PI * 2);
  const tx = o.x - R * 0.42, ty = o.y - R * 0.36, tr = R * 1.1;
  for (let k = 0; k <= 72; k++) {
    const a = -(k / 72) * Math.PI * 2;
    const j = 1 + 0.012 * Math.sin(k * 2.7) + 0.008 * Math.sin(k * 7.1 + 1);
    const px = tx + Math.cos(a) * tr * j, py = ty + Math.sin(a) * tr * j;
    if (k === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill('evenodd');
  // windows: unlit = faint cut outlines, lit = paper glowing from within (+ a soft halo sprite)
  const lit: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < N; i++) {
    const w = WIN[i];
    const p = project(o, w.lat, w.lon);
    if (p.z <= 0.05) continue;
    const s = (R / 260) * w.w;
    const ww = 4.2 * s * Math.max(0.2, Math.abs(p.sx)), hh = 5.2 * s * Math.max(0.35, Math.cos(w.lat) * 0.4 + 0.6);
    const on = w.rank < o.lit;
    if (on) {
      c.fillStyle = mixLab(m.core, m.halo, 0.25 + 0.4 * (1 - p.z));
      c.fillRect(p.x - ww / 2, p.y - hh / 2, ww, hh);
      lit.push({ x: p.x, y: p.y, s: s * (0.55 + 0.45 * p.z) });
    } else {
      // an unlit window: a dark cut in the paper, its top edge just catching the rim light
      c.fillStyle = withAlpha(mixLab(ink, '#000000', 0.3), 0.55);
      c.fillRect(p.x - ww / 2, p.y - hh / 2, ww, hh);
      c.fillStyle = withAlpha(m.rim, 0.1 + 0.08 * p.z);
      c.fillRect(p.x - ww / 2, p.y - hh / 2, ww, Math.max(0.6, hh * 0.08));
      if (ww > 9) {
        // close up (the pull-back), each reads as a dark window: a cross of glazing bars
        c.fillStyle = withAlpha(m.rim, 0.12);
        c.fillRect(p.x - ww * 0.04, p.y - hh / 2, ww * 0.08, hh);
        c.fillRect(p.x - ww / 2, p.y - hh * 0.06, ww, hh * 0.08);
      }
    }
  }
  // the office window (a little larger: where the camera came from)
  const ow = officeWindowAt(o);
  if ((o.office ?? 0) > 0 && ow.z > 0) {
    const s = R / 260;
    const ww = OFFICE_W * s, hh = (ww * 9) / 16;
    c.fillStyle = withAlpha(m.core, o.office ?? 1);
    c.fillRect(ow.x - ww / 2, ow.y - hh / 2, ww, hh);
    c.fillStyle = withAlpha(ink, 0.9 * (o.office ?? 1));
    c.fillRect(ow.x - 0.6 * s, ow.y - hh / 2, 1.2 * s, hh);
    lit.push({ x: ow.x, y: ow.y, s: s * 3.4 * (o.office ?? 1) });
  }
  c.restore();
  // halos (additive, outside the clip so the glow spills a hair over the limb)
  if (lit.length) {
    const sp = sprite(m.halo);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= 0.32;
    for (const q of lit) {
      const r = 9 * q.s;
      c.drawImage(sp, q.x - r, q.y - r, 2 * r, 2 * r);
    }
    c.restore();
  }
  // the rim: a crescent of backlight on the upper-left limb (the sun behind the globe)
  const rk = o.rim ?? 1;
  if (rk > 0) {
    c.save();
    c.beginPath();
    c.arc(o.x, o.y, R + 1.2, 0, Math.PI * 2);
    c.arc(o.x + R * 0.035, o.y + R * 0.03, R, 0, Math.PI * 2, true);
    c.fillStyle = withAlpha(m.rim, 0.75 * rk);
    c.fill('evenodd');
    c.restore();
  }
  c.restore();
}

/** a small market-stall awning cut-out (scalloped, striped; no lettering), standing at (x, y) */
export function marketAwning(c: C, x: number, y: number, s: number, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // posts and counter
  c.fillStyle = ink;
  c.fillRect(-22, -30, 2.5, 30);
  c.fillRect(19.5, -30, 2.5, 30);
  c.fillRect(-24, -12, 48, 4);
  c.fillRect(-20, -8, 40, 8);
  // the awning: slanted roof with scalloped hem, stripes as rim cut-lines
  c.beginPath();
  c.moveTo(-26, -30);
  c.lineTo(-20, -42);
  c.lineTo(20, -42);
  c.lineTo(26, -30);
  for (let i = 0; i < 6; i++) {
    const x0 = 26 - i * (52 / 6);
    c.quadraticCurveTo(x0 - 52 / 12, -24, x0 - 52 / 6, -30);
  }
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const xb = -26 + i * (52 / 6);
    c.beginPath();
    c.moveTo(xb * 0.77, -42);
    c.lineTo(xb, -30);
    c.stroke();
  }
  c.restore();
}
