/**
 * ch12-s08 — the night façade of windows (the stampede, Dec 2022 – Mar 2023): geometry and painters.
 *
 * One tall dark façade (L4, the action plane) between lower hazed blocks (L2) and a far skyline (L1).
 * At its foot ChatGPT's door: an open doorway full of cool light with the film's chat-box glyph as its
 * fanlight. Hundreds of tiny windows (the users) cover the façade around FOUR large windows, set as a 2×2
 * block and read in order (Z): 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right (a DOUBLE window:
 * two neighbouring panes split by a pier, one lantern in each).
 *
 *   facadeWall(f, c, env, cams)            the cached wall: holes for the four windows and the door, piers,
 *                                          string courses, cornice and rooftop (tank, mast)
 *   tinyWindows(c, env, t, onAt, copies)   every tiny window: dark glass → flicker on at `onAt` → settle dim;
 *                                          `copies` (window index → landing time) light brighter (the copies)
 *   glass / corridor / ledger / handover / twinLanterns   the four large windows' interiors (window-local)
 *   doorLight(c, env, k, t) · street(c, env) · runners(c, env, t)   the doorway, the pavement, the stampede
 *   cityL2(f, c, env, cams, t, onAt) · skylineL1(f, c, env, cams) · lampPost(f, c, env, cams)
 *
 * World units are L4 rest-screen px. Colours come from env (serverCyan) except the corridor's low-chroma
 * ember (emberRed mixed 60% into serverCyan; never full red).
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, drawTracked } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { skyline } from '../../../film/silhouette/architecture';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import { createPuppet, PUPPET_NEAR_BLACK, pose, withLife } from '../../../film/silhouette/puppet';
import type { Pose } from '../../../film/contracts';

type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const h01 = (i: number, s: number) => hash1(i, s) * 0.5 + 0.5;

// ================================================================================================ geometry
export const FAC = { x0: 130, x1: 1150, roof: 64, street: 690 } as const;
export interface Win {
  id: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  w: number;
  h: number;
}
export const WINS: Win[] = [
  { id: 1, x: 285, y: 150, w: 330, h: 170 },
  { id: 2, x: 665, y: 150, w: 330, h: 170 },
  { id: 3, x: 285, y: 392, w: 330, h: 170 },
  { id: 4, x: 665, y: 392, w: 330, h: 170 },
];
/** window 4 is two neighbouring panes (window-local x, width) split by a 22 px pier */
export const W4_HALVES = [
  { x: 0, w: 154 },
  { x: 176, w: 154 },
] as const;
export const DOOR = { x: 616, y: 618, w: 48, h: 72 } as const;
/** where each window's date stamp sits (world): centred under the window */
export const stampAt = (w: Win) => ({ x: w.x + w.w / 2, y: w.y + w.h + 34 });

export interface Tiny {
  x: number;
  y: number;
  w: number;
  h: number;
  /** onset jitter (s) and the settled level */
  on: number;
  lvl: number;
}
export const TINY: Tiny[] = (() => {
  const out: Tiny[] = [];
  let i = 0;
  const add = (x: number, y: number, w = 10, h = 13) => {
    out.push({ x, y, w, h, on: h01(i, 71) * 0.32 + (h01(i, 72) < 0.1 ? 0.25 : 0), lvl: 0.2 + 0.32 * h01(i, 73) });
    i++;
  };
  for (let j = 0; j < 19; j++) {
    const y = 100 + j * 26.5;
    for (let k = 0; k < 5; k++) add(150 + k * 25, y);
    for (let k = 0; k < 5; k++) add(1020 + k * 25, y);
    add(635, y);
  }
  // the band under the cornice, above the large windows
  for (const y of [98, 112]) for (let k = 0; k < 28; k++) {
    const x = 292 + k * 25;
    if (x > 612 && x < 660) continue;
    // the lower band row leaves room for the keystones over windows 1 and 2
    if (y === 112 && WINS.slice(0, 2).some((w) => Math.abs(x + 5 - (w.x + w.w / 2)) < 22)) continue;
    add(x, y, 10, 10);
  }
  // the ground floor either side of the door (shop-level panes)
  for (let k = 0; k < 9; k++) add(300 + k * 32, 632, 14, 30);
  for (let k = 0; k < 9; k++) add(706 + k * 32, 632, 14, 30);
  return out;
})();

// ================================================================================================ cache helper
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
function bake(f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void, res = 1) {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, { res } as { blur?: number })(c, r.x, r.y);
}

// ================================================================================================ the façade wall
export function facadeWall(f: Frame, c: C, env: PaintEnv, key: string) {
  const r: Rect = { x: FAC.x0 - 30, y: FAC.roof - 140, w: FAC.x1 - FAC.x0 + 60, h: FAC.street - FAC.roof + 150 };
  bake(f, c, `${key}/facade/${env.mood.id}/${rk(r)}`, r, (cc) => {
    const m = env.mood;
    const wall = mixLab(env.fill('set'), m.fg, 0.42);
    const deep = mixLab(env.fill('set'), m.fg, 0.7);
    const cut = (a: number) => withAlpha(m.rim, a);
    // the wall with its holes (the four large windows; window 4 as two panes; the door)
    cc.beginPath();
    cc.rect(FAC.x0, FAC.roof, FAC.x1 - FAC.x0, FAC.street - FAC.roof);
    for (const w of WINS) {
      if (w.id === 4) for (const hf of W4_HALVES) cc.rect(w.x + hf.x, w.y, hf.w, w.h);
      else cc.rect(w.x, w.y, w.w, w.h);
    }
    cc.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h);
    cc.fillStyle = wall;
    cc.fill('evenodd');
    // a faint sky-lit gradient down the wall (the upper storeys catch the night sky)
    const g = cc.createLinearGradient(0, FAC.roof, 0, FAC.street);
    g.addColorStop(0, withAlpha(m.setHaze, 0.16));
    g.addColorStop(0.5, withAlpha(m.setHaze, 0.04));
    g.addColorStop(1, withAlpha(m.fg, 0.2));
    cc.save();
    cc.clip('evenodd');
    cc.fillStyle = g;
    cc.fillRect(FAC.x0, FAC.roof, FAC.x1 - FAC.x0, FAC.street - FAC.roof);
    // stone courses as faint cut-lines (every other course), piers as darker strips
    cc.fillStyle = cut(0.045);
    for (let y = FAC.roof + 40; y < FAC.street - 90; y += 26.5) cc.fillRect(FAC.x0, y, FAC.x1 - FAC.x0, 1);
    cc.fillStyle = withAlpha(m.fg, 0.35);
    for (const x of [FAC.x0, 272, 615, 995, FAC.x1 - 14]) cc.fillRect(x, FAC.roof + 30, x === 615 ? 0 : 14, FAC.street - FAC.roof - 30);
    cc.restore();
    // the window reveals: a deep inner border and a projecting sill catching the sky on its top edge
    for (const w of WINS) {
      const panes = w.id === 4 ? W4_HALVES.map((hf) => ({ x: w.x + hf.x, w: hf.w })) : [{ x: w.x, w: w.w }];
      for (const p of panes) {
        cc.fillStyle = deep;
        cc.fillRect(p.x - 8, w.y - 8, p.w + 16, 8);
        cc.fillRect(p.x - 8, w.y, 8, w.h);
        cc.fillRect(p.x + p.w, w.y, 8, w.h);
      }
      // lintel and sill run the whole window
      cc.fillStyle = mixLab(wall, m.fg, 0.2);
      cc.fillRect(w.x - 16, w.y - 18, w.w + 32, 10);
      cc.fillRect(w.x - 18, w.y + w.h, w.w + 36, 9);
      cc.fillStyle = cut(0.32);
      cc.fillRect(w.x - 18, w.y + w.h, w.w + 36, 1.2);
      cc.fillStyle = cut(0.16);
      cc.fillRect(w.x - 16, w.y - 18, w.w + 32, 1);
    }
    // the ground floor: rusticated base with deep joints, the door's surround
    cc.fillStyle = withAlpha(m.fg, 0.4);
    for (let y = 604; y < FAC.street; y += 17) cc.fillRect(FAC.x0, y, FAC.x1 - FAC.x0, 2);
    cc.fillStyle = mixLab(wall, m.fg, 0.35);
    cc.fillRect(FAC.x0, 596, FAC.x1 - FAC.x0, 8);
    cc.fillStyle = cut(0.22);
    cc.fillRect(FAC.x0, 596, FAC.x1 - FAC.x0, 1);
    cc.fillStyle = deep;
    cc.fillRect(DOOR.x - 10, DOOR.y - 30, 10, DOOR.h + 30);
    cc.fillRect(DOOR.x + DOOR.w, DOOR.y - 30, 10, DOOR.h + 30);
    cc.fillRect(DOOR.x - 10, DOOR.y - 30, DOOR.w + 20, 6);
    // the cornice: a projecting band with a dentil row, its top edge catching the sky
    cc.fillStyle = mixLab(wall, m.fg, 0.25);
    cc.fillRect(FAC.x0 - 22, FAC.roof - 6, FAC.x1 - FAC.x0 + 44, 18);
    cc.fillRect(FAC.x0 - 12, FAC.roof + 12, FAC.x1 - FAC.x0 + 24, 8);
    cc.fillStyle = withAlpha(m.fg, 0.55);
    for (let x = FAC.x0 - 6; x < FAC.x1 + 6; x += 14) cc.fillRect(x, FAC.roof + 20, 7, 7);
    cc.fillStyle = cut(0.35);
    cc.fillRect(FAC.x0 - 22, FAC.roof - 6, FAC.x1 - FAC.x0 + 44, 1.4);
    // ---- cut-paper ornament: keystones and lintel caps, sill corbels, pier capitals, a scalloped cornice,
    //      urns and balustrades on the outer bays (the centre of the roofline stays low: the sky label sits there)
    const orn = mixLab(wall, m.fg, 0.3);
    const ornDeep = mixLab(wall, m.fg, 0.6);
    for (const w of WINS) {
      const cx = w.x + w.w / 2;
      const top = w.id <= 2;
      // a lintel cap the width of the window, stepped (two thin bands), its top edge cut by the sky
      cc.fillStyle = orn;
      cc.fillRect(w.x - 22, w.y - 23, w.w + 44, 5);
      cc.fillRect(w.x - 19, w.y - 26, w.w + 38, 3);
      cc.fillStyle = cut(0.26);
      cc.fillRect(w.x - 19, w.y - 26, w.w + 38, 1);
      // small rosettes at the cap's ends
      for (const ex of [w.x - 30, w.x + w.w + 30]) {
        cc.fillStyle = orn;
        cc.beginPath();
        cc.arc(ex, w.y - 16, 7, 0, Math.PI * 2);
        cc.fill();
        cc.fillStyle = ornDeep;
        for (let q = 0; q < 6; q++) {
          const a = (q / 6) * Math.PI * 2;
          cc.beginPath();
          cc.arc(ex + Math.cos(a) * 3.6, w.y - 16 + Math.sin(a) * 3.6, 1.5, 0, Math.PI * 2);
          cc.fill();
        }
        cc.fillStyle = cut(0.22);
        cc.fillRect(ex - 5, w.y - 23, 10, 1);
      }
      // the keystone (a tapered block breaking the cap)
      const kh = top ? 32 : 26;
      cc.fillStyle = orn;
      cc.beginPath();
      cc.moveTo(cx - 14, w.y - kh);
      cc.lineTo(cx + 14, w.y - kh);
      cc.lineTo(cx + 9, w.y + 2);
      cc.lineTo(cx - 9, w.y + 2);
      cc.closePath();
      cc.fill();
      cc.fillStyle = ornDeep;
      cc.fillRect(cx - 1, w.y - kh + 6, 2, kh - 10);
      cc.fillStyle = cut(0.34);
      cc.fillRect(cx - 14, w.y - kh, 28, 1.2);
      // sill corbels: two scrolled consoles under the sill
      for (const sx of [w.x + 26, w.x + w.w - 26, ...(w.id === 4 ? [w.x + w.w / 2] : [])]) {
        cc.fillStyle = orn;
        cc.beginPath();
        cc.moveTo(sx - 8, w.y + w.h + 9);
        cc.lineTo(sx + 8, w.y + w.h + 9);
        cc.lineTo(sx + 5, w.y + w.h + 15);
        cc.quadraticCurveTo(sx + 1, w.y + w.h + 22, sx, w.y + w.h + 22);
        cc.quadraticCurveTo(sx - 1, w.y + w.h + 22, sx - 5, w.y + w.h + 15);
        cc.closePath();
        cc.fill();
        cc.fillStyle = ornDeep;
        cc.beginPath();
        cc.arc(sx, w.y + w.h + 15, 2, 0, Math.PI * 2);
        cc.fill();
      }
    }
    // pier capitals under the cornice and pier bases on the rusticated floor
    for (const x of [FAC.x0, 272, 995, FAC.x1 - 14]) {
      cc.fillStyle = orn;
      cc.fillRect(x - 5, FAC.roof + 30, 24, 6);
      cc.fillRect(x - 3, FAC.roof + 36, 20, 4);
      cc.fillStyle = cut(0.24);
      cc.fillRect(x - 5, FAC.roof + 30, 24, 1);
      cc.fillStyle = orn;
      cc.fillRect(x - 4, 586, 22, 10);
    }
    // a scalloped valance under the dentils (cut paper)
    cc.fillStyle = mixLab(wall, m.fg, 0.45);
    for (let x = FAC.x0 - 6; x < FAC.x1 + 6; x += 12) {
      cc.beginPath();
      cc.arc(x + 6, FAC.roof + 27, 5, 0, Math.PI);
      cc.fill();
    }
    // modillion brackets along the cornice's soffit, every third dentil
    cc.fillStyle = mixLab(wall, m.fg, 0.2);
    for (let x = FAC.x0 - 10; x < FAC.x1 + 10; x += 42) {
      cc.beginPath();
      cc.moveTo(x, FAC.roof + 12);
      cc.lineTo(x + 12, FAC.roof + 12);
      cc.lineTo(x + 12, FAC.roof + 18);
      cc.quadraticCurveTo(x + 6, FAC.roof + 26, x + 2, FAC.roof + 18);
      cc.closePath();
      cc.fill();
    }
    // the door: a segmental pediment over its surround
    {
      const dx = DOOR.x + DOOR.w / 2, py = DOOR.y - 32;
      cc.fillStyle = orn;
      cc.beginPath();
      cc.moveTo(dx - 44, py);
      cc.quadraticCurveTo(dx, py - 34, dx + 44, py);
      cc.lineTo(dx + 44, py + 5);
      cc.lineTo(dx - 44, py + 5);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = cut(0.3);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.moveTo(dx - 44, py);
      cc.quadraticCurveTo(dx, py - 34, dx + 44, py);
      cc.stroke();
    }
    // the outer bays' roofline: a balustrade and urns on the piers (cut out against the sky)
    {
      const ink = mixLab(env.fill('ink'), m.fg, 0.3);
      cc.fillStyle = ink;
      for (const [a, z] of [[FAC.x0 - 18, 286], [995, FAC.x1 + 18]] as [number, number][]) {
        cc.fillRect(a, FAC.roof - 44, z - a, 5);
        for (let x = a + 8; x < z - 6; x += 11) {
          cc.beginPath();
          cc.moveTo(x - 2, FAC.roof - 39);
          cc.lineTo(x + 2, FAC.roof - 39);
          cc.quadraticCurveTo(x + 5, FAC.roof - 27, x + 2, FAC.roof - 20);
          cc.lineTo(x - 2, FAC.roof - 20);
          cc.quadraticCurveTo(x - 5, FAC.roof - 27, x - 2, FAC.roof - 39);
          cc.fill();
        }
      }
      for (const x of [FAC.x0 - 4, 279, 1002, FAC.x1 + 4]) {
        cc.fillRect(x - 9, FAC.roof - 52, 18, 8);
        cc.beginPath();
        cc.moveTo(x - 4, FAC.roof - 52);
        cc.quadraticCurveTo(x - 13, FAC.roof - 64, x - 5, FAC.roof - 74);
        cc.lineTo(x + 5, FAC.roof - 74);
        cc.quadraticCurveTo(x + 13, FAC.roof - 64, x + 4, FAC.roof - 52);
        cc.closePath();
        cc.fill();
        cc.fillRect(x - 1.5, FAC.roof - 84, 3, 10);
        cc.beginPath();
        cc.arc(x, FAC.roof - 86, 3, 0, Math.PI * 2);
        cc.fill();
      }
      cc.fillStyle = cut(0.2);
      for (const [a, z] of [[FAC.x0 - 18, 286], [995, FAC.x1 + 18]] as [number, number][]) cc.fillRect(a, FAC.roof - 44, z - a, 1);
    }
    // the rooftop against the sky: a water tank on legs (left), a slim mast with a cross-arm (right), a parapet
    cc.fillStyle = mixLab(env.fill('ink'), m.fg, 0.3);
    cc.fillRect(FAC.x0 - 22, FAC.roof - 20, FAC.x1 - FAC.x0 + 44, 14);
    const tx = 222, ty = FAC.roof - 20;
    for (const dx of [-20, -7, 7, 20]) cc.fillRect(tx + dx - 1.5, ty - 30, 3, 30);
    cc.fillRect(tx - 24, ty - 16, 48, 2);
    cc.fillRect(tx - 26, ty - 70, 52, 42);
    cc.beginPath();
    cc.moveTo(tx - 28, ty - 70);
    cc.lineTo(tx, ty - 90);
    cc.lineTo(tx + 28, ty - 70);
    cc.closePath();
    cc.fill();
    cc.fillStyle = withAlpha(m.rim, 0.12);
    for (let k = 0; k < 4; k++) cc.fillRect(tx - 26, ty - 62 + k * 10, 52, 1);
    const mx = 1076;
    cc.fillStyle = mixLab(env.fill('ink'), m.fg, 0.3);
    cc.fillRect(mx - 2, ty - 118, 4, 118);
    cc.fillRect(mx - 22, ty - 96, 44, 3);
    cc.fillRect(mx - 14, ty - 74, 28, 2.5);
    cc.fillRect(mx - 30, ty - 12, 60, 12);
  }, 2);
}

// ================================================================================================ tiny windows
/** the users: every tiny window flickers on at once at `onAt`, then settles dim. copies[i] = landing time
 *  of a copied light on tiny window i (brighter, steadier, with a small halo). */
export function tinyWindows(c: C, env: PaintEnv, t: number, onAt: number, copies: Map<number, number>) {
  const m = env.mood;
  const dark = mixLab(env.fill('set'), m.fg, 0.72);
  const lit = mixLab(m.core, m.halo, 0.45);
  const copyLit = mixLab(m.core, m.halo, 0.12);
  const sill = withAlpha(m.rim, 0.1);
  for (let i = 0; i < TINY.length; i++) {
    const w = TINY[i];
    c.fillStyle = dark;
    c.fillRect(w.x, w.y, w.w, w.h);
    c.fillStyle = sill;
    c.fillRect(w.x - 1, w.y + w.h, w.w + 2, 1);
    const u = t - onAt - w.on;
    let a = 0;
    if (u > 0) {
      // a fast flicker on (two dips on ones), a bright peak, then a slow settle to the window's own level
      const fl = u < 0.16 ? (Math.floor(u * 24 + hash1(i, 74) * 2) % 2 === 0 ? 0.85 : 0.25) : 1;
      const peak = u < 0.16 ? fl : lerp(1, w.lvl, sm((u - 0.3) / 1.5));
      a = peak;
    }
    const ct = copies.get(i);
    const cp = ct !== undefined ? copyLevel(t - ct) : 0;
    if (a > 0.01 && cp <= 0) {
      c.fillStyle = withAlpha(lit, Math.min(1, a * 0.9));
      c.fillRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      // a glazing bar across each pane keeps them windows, not dots
      c.fillStyle = withAlpha(dark, 0.7);
      c.fillRect(w.x, w.y + w.h * 0.45, w.w, 1);
    }
    if (cp > 0) {
      // a copied light: one clear step brighter and whiter than the users' dim windows, and it stays
      c.fillStyle = mixLab(copyLit, '#ffffff', 0.25 * Math.max(0, cp - 1));
      c.fillRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      c.fillStyle = withAlpha(dark, 0.55);
      c.fillRect(w.x, w.y + w.h * 0.45, w.w, 1);
    }
  }
  // the copied lights carry a halo of their own (additive): a 0.3 s pop as the spark lands, then a steady glow
  for (const [i, ct] of copies) {
    if (t < ct) continue;
    const w = TINY[i];
    const cp = copyLevel(t - ct);
    glow(c, w.x + w.w / 2, w.y + w.h / 2, 22 + 26 * Math.max(0, cp - 1), m.halo, 0.3 + 0.5 * Math.max(0, cp - 1));
  }
}
/** a copy's light after landing: a 0.3 s flare (up to 2) settling to 1 (one step above the users' level) */
export function copyLevel(u: number): number {
  if (u < 0) return 0;
  if (u < 0.05) return 1 + u / 0.05;
  return 1 + (1 - sm((u - 0.05) / 0.3));
}

// ================================================================================================ window interiors
/** dark glass before a window lights: a faint diagonal sky reflection */
export function glass(c: C, env: PaintEnv, w: number, h: number) {
  const m = env.mood;
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.78);
  c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w * 0.6, h);
  g.addColorStop(0, withAlpha(m.rim, 0.07));
  g.addColorStop(0.45, withAlpha(m.rim, 0.015));
  g.addColorStop(1, withAlpha(m.rim, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

/** the low-chroma ember: emberRed mixed about 60% into serverCyan (60% ember, 40% cyan; never full red) */
export const EMBER = {
  halo: mixLab(MOODS.emberRed.halo, MOODS.serverCyan.halo, 0.4),
  core: mixLab(MOODS.emberRed.core, MOODS.serverCyan.core, 0.4),
  rim: mixLab(MOODS.emberRed.rim, MOODS.serverCyan.rim, 0.4),
};

/** (1) 21 DEC 2022: a lamp comes on at the end of a long generic corridor, under a CODE RED sign + 'reported' tag */
export function corridor(c: C, env: PaintEnv, W: Win, k: number, t: number) {
  const w = W.w, h = W.h;
  const m = env.mood;
  glass(c, env, w, h);
  if (k <= 0.002) return;
  c.save();
  c.globalAlpha *= clamp01(k * 1.4);
  // (round 1) a deeper corridor: a smaller far end, moved right and down, clear of the CODE RED sign and its tag, so
  // the lamp at its end is seen at a glance
  const vp = { x: 252, y: 112 };
  const E = { x0: 238, x1: 266, y0: 95, y1: 130 };
  const dark = mixLab(env.fill('set'), m.fg, 0.6);
  const lift = (a: number) => mixLab(dark, EMBER.halo, a * k);
  // ceiling, floor, walls: dark at the window, warming toward the lamp at the far end
  const quad = (pts: [number, number][], from: [number, number], amt: number) => {
    const g = c.createLinearGradient(from[0], from[1], vp.x, vp.y);
    g.addColorStop(0, dark);
    g.addColorStop(0.75, lift(amt * 0.55));
    g.addColorStop(1, lift(amt));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
    c.closePath();
    c.fill();
  };
  quad([[0, 0], [w, 0], [E.x1, E.y0], [E.x0, E.y0]], [w / 2, 0], 0.35);
  quad([[0, h], [w, h], [E.x1, E.y1], [E.x0, E.y1]], [w / 2, h], 0.55);
  quad([[0, 0], [E.x0, E.y0], [E.x0, E.y1], [0, h]], [0, h / 2], 0.42);
  quad([[w, 0], [E.x1, E.y0], [E.x1, E.y1], [w, h]], [w, h / 2], 0.42);
  // the end wall, lit
  const eg = c.createRadialGradient(vp.x, E.y0 + 10, 2, vp.x, vp.y, 44);
  eg.addColorStop(0, mixLab(EMBER.core, EMBER.halo, 0.6));
  eg.addColorStop(1, mixLab(EMBER.halo, dark, 0.5));
  c.fillStyle = eg;
  c.fillRect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0);
  // door recesses along both walls, receding (dark trapezoids)
  c.fillStyle = withAlpha(m.fg, 0.75);
  for (const d of [0.12, 0.38, 0.6, 0.76]) {
    const d2 = d + 0.07 * (1 - d);
    const lx = (u: number) => lerp(0, E.x0, u), ly0 = (u: number) => lerp(0, E.y0, u), ly1 = (u: number) => lerp(h, E.y1, u);
    c.beginPath();
    c.moveTo(lx(d), lerp(ly0(d), ly1(d), 0.3));
    c.lineTo(lx(d2), lerp(ly0(d2), ly1(d2), 0.3));
    c.lineTo(lx(d2), ly1(d2));
    c.lineTo(lx(d), ly1(d));
    c.closePath();
    c.fill();
    const rx = (u: number) => lerp(w, E.x1, u);
    c.beginPath();
    c.moveTo(rx(d), lerp(ly0(d), ly1(d), 0.3));
    c.lineTo(rx(d2), lerp(ly0(d2), ly1(d2), 0.3));
    c.lineTo(rx(d2), ly1(d2));
    c.lineTo(rx(d), ly1(d));
    c.closePath();
    c.fill();
  }
  // (round 1) the perspective made legible: floor boards and ceiling battens running to the far end, transverse
  // joints spaced by depth, and the wall/floor and wall/ceiling edges catching a hair of the far lamp
  c.save();
  c.lineWidth = 0.9;
  c.strokeStyle = withAlpha(m.fg, 0.55);
  for (let i = 1; i < 8; i++) {
    const u = i / 8;
    c.beginPath();
    c.moveTo(w * u, h);
    c.lineTo(lerp(E.x0, E.x1, u), E.y1);
    c.moveTo(w * u, 0);
    c.lineTo(lerp(E.x0, E.x1, u), E.y0);
    c.stroke();
  }
  for (const d of [0.3, 0.52, 0.67, 0.78, 0.86, 0.91]) {
    const yF = lerp(h, E.y1, d), yC = lerp(0, E.y0, d), xl = lerp(0, E.x0, d), xr = lerp(w, E.x1, d);
    c.beginPath();
    c.moveTo(xl, yF);
    c.lineTo(xr, yF);
    c.moveTo(xl, yC);
    c.lineTo(xr, yC);
    c.stroke();
  }
  c.strokeStyle = withAlpha(EMBER.rim, 0.42 * k);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(0, h);
  c.lineTo(E.x0, E.y1);
  c.moveTo(w, h);
  c.lineTo(E.x1, E.y1);
  c.moveTo(0, 0);
  c.lineTo(E.x0, E.y0);
  c.moveTo(w, 0);
  c.lineTo(E.x1, E.y0);
  c.stroke();
  c.restore();
  // unlit ceiling fittings down the centre line
  c.fillStyle = withAlpha(m.fg, 0.8);
  for (const d of [0.2, 0.45, 0.65, 0.8]) {
    const y = lerp(0, E.y0, d) + 3 * (1 - d);
    const hw = lerp(30, 4, d);
    c.fillRect(lerp(w / 2, vp.x, d) - hw, y, hw * 2, Math.max(1.2, 5 * (1 - d)));
  }
  // the lamp at the end: a small pendant shade and its warm light, a long reflection down the floor
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(vp.x - 0.6, E.y0, 1.2, 12);
  c.beginPath();
  c.moveTo(vp.x - 3, E.y0 + 12);
  c.lineTo(vp.x + 3, E.y0 + 12);
  c.lineTo(vp.x + 8, E.y0 + 19);
  c.lineTo(vp.x - 8, E.y0 + 19);
  c.closePath();
  c.fill();
  const fl = 1 + 0.03 * Math.sin(t * 37.1) * Math.sin(t * 11.3);
  glow(c, vp.x, E.y0 + 22, 150, EMBER.halo, 0.32 * k * fl);
  glow(c, vp.x, E.y0 + 21, 22, mixLab(EMBER.core, EMBER.halo, 0.4), 0.6 * k * fl);
  c.save();
  c.translate(vp.x, E.y1 + 22);
  c.scale(0.35, 1);
  glow(c, 0, 0, 52, EMBER.halo, 0.22 * k);
  c.restore();
  // the sign: a plain plate hanging from the ceiling, its letters cut through so the lamp shows in them
  // (round 1: CODE RED and its tag are read, so they are set at the 22 px cap-height floor for the pushed-in frame)
  const sx = 12, sy = 22, sw = 200, sh = 46;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(sx + 18, 0, 1.6, sy);
  c.fillRect(sx + sw - 20, 0, 1.6, sy);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.15);
  c.fillRect(sx, sy, sw, sh);
  c.fillStyle = withAlpha(EMBER.rim, 0.5);
  c.fillRect(sx, sy, sw, 1);
  c.fillStyle = mixLab(EMBER.core, EMBER.rim, 0.35);
  drawTracked(c, 'CODE RED', sx + sw / 2, sy + 34, { font: `600 31px ${FONT.mono}`, size: 31, tracking: 0.08, align: 'center' });
  // the small typed tag pinned beneath it: 'reported'
  const tgx = sx + sw / 2, tgy = sy + sh + 6;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(tgx - 0.6, sy + sh, 1.2, 8);
  c.save();
  c.translate(tgx, tgy + 2);
  c.rotate(-0.035);
  c.fillStyle = mixLab(mixLab('#ddd6c4', m.rim, 0.35), EMBER.halo, 0.2);
  c.fillRect(-62, 0, 124, 31);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-62, 30, 124, 1.5);
  c.fillStyle = mixLab(m.ink, '#2a2420', 0.3);
  c.font = `400 22px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText('reported', 0, 23);
  c.restore();
  c.restore();
}

/** (2) 23 JAN 2023: one plain ledger page under a desk lamp; the entry types itself in Plex Mono */
export function ledger(c: C, env: PaintEnv, W: Win, k: number, shown: number) {
  const w = W.w, h = W.h;
  const m = env.mood;
  glass(c, env, w, h);
  if (k <= 0.002) return;
  c.save();
  c.globalAlpha *= clamp01(k * 1.3);
  // the room, faintly lit by the lamp
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.55);
  c.fillRect(0, 0, w, h);
  glow(c, 120, 40, 240, m.halo, 0.12 * k);
  // the ledger standing open on a sloped desk: dark boards, one page facing us
  const P = { x: 10, y: 34, w: 310, h: 120 };
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(P.x - 7, P.y - 6, P.w + 14, P.h + 12);
  c.fillRect(0, P.y + P.h + 6, w, h - (P.y + P.h + 6));
  const paper = mixLab(mixLab('#cfc9b8', m.rim, 0.3), m.set, 0.12);
  const pg = c.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
  pg.addColorStop(0, paper);
  pg.addColorStop(1, mixLab(paper, m.set, 0.32));
  c.fillStyle = pg;
  c.fillRect(P.x, P.y, P.w, P.h);
  // page edges stacked beneath, ruled lines, the oxblood margin rule (the same plain ledger every lab gets)
  c.fillStyle = withAlpha(mixLab(paper, m.set, 0.4), 0.9);
  for (let i = 1; i <= 3; i++) c.fillRect(P.x + 2, P.y + P.h + i * 1.6, P.w - 4, 0.8);
  c.fillStyle = withAlpha(mixLab(m.ink, paper, 0.6), 0.35);
  for (let y = P.y + 24; y < P.y + P.h - 6; y += 22) c.fillRect(P.x + 10, y, P.w - 20, 1);
  c.fillStyle = withAlpha(mixLab('#6a2a26', paper, 0.4), 0.5);
  c.fillRect(P.x + 18, P.y + 8, 1.2, P.h - 16);
  // older entries above: illegible ink, texture only
  c.fillStyle = withAlpha(mixLab(m.ink, paper, 0.5), 0.32);
  for (let i = 0; i < 3; i++) c.fillRect(P.x + 26, P.y + 16 + i * 22, P.w * (0.4 + 0.35 * h01(i, 81)), 2);
  // the new entry on the fourth line
  const line = 'MICROSOFT · MULTIBILLION';
  const s = line.slice(0, Math.max(0, Math.min(line.length, Math.floor(shown))));
  if (s) {
    c.fillStyle = mixLab(m.ink, '#1d2326', 0.3);
    drawTracked(c, s, P.x + 26, P.y + 16 + 3 * 22 + 3, { font: `500 19px ${FONT.mono}`, size: 19, tracking: 0 });
  }
  // the lamp: an angled arm and shade at the top right, its light falling on the page
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.save();
  c.translate(w - 34, 0);
  c.fillRect(-1.5, -4, 3, 14);
  c.translate(0, 12);
  c.rotate(0.55);
  c.beginPath();
  c.moveTo(-5, 0);
  c.lineTo(5, 0);
  c.lineTo(13, 18);
  c.lineTo(-13, 18);
  c.closePath();
  c.fill();
  c.restore();
  glow(c, w - 46, 30, 80, m.core, 0.12 * k);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ researchers
const RESEARCHERS = [
  createPuppet({ id: 'ch12s08-r1', height: 300, build: 'average', era: '2020s', wardrobe: 'quarterZip', hair: 'messy', facialHair: 'stubble', glasses: 'rectangular', hat: 'none', profile: { nose: 0.45, brow: 0.4, chin: 0.45, jaw: 0.45 }, prop: 'none', details: [] }),
  createPuppet({ id: 'ch12s08-r2', height: 292, build: 'slight', era: '2020s', wardrobe: 'hoodie:f', hair: 'bun', facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.4, brow: 0.3, chin: 0.42, jaw: 0.35 }, prop: 'none', details: [] }),
  createPuppet({ id: 'ch12s08-r3', height: 310, build: 'tall', era: '2020s', wardrobe: 'tshirt', hair: 'curly', facialHair: 'none', glasses: 'round', hat: 'none', profile: { nose: 0.5, brow: 0.45, chin: 0.5, jaw: 0.5 }, prop: 'none', details: [] }),
];
const STAND: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: 1, neck: 5, head: -2, shoulderF: 4, elbowF: 14, wristF: 4, shoulderB: -6, elbowB: 12 });
const REACH: Pose = pose({ hipF: 8, kneeF: -4, hipB: -6, kneeB: -2, torso: 6, neck: 4, head: -6, shoulderF: 72, elbowF: 18, wristF: -10, shoulderB: -6, elbowB: 14 }, { handF: 'pinch' });
const HOLD: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: 2, neck: 8, head: 4, shoulderF: 46, elbowF: 40, wristF: -20, shoulderB: -6, elbowB: 12 }, { handF: 'pinch' });
const blend = (a: Pose, b: Pose, u: number): Pose => {
  const angles: Pose['angles'] = {};
  const keys = new Set([...Object.keys(a.angles), ...Object.keys(b.angles)]) as Set<keyof Pose['angles']>;
  for (const kk of keys) angles[kk] = lerp(a.angles[kk] ?? 0, b.angles[kk] ?? 0, u);
  return { angles, handF: u < 0.5 ? a.handF : b.handF, handB: u < 0.5 ? a.handB : b.handB };
};

export interface HandoverTimes {
  /** the lantern comes through the hatch */
  in0: number;
  in1: number;
  /** the researcher takes it */
  take: number;
  /** the arm withdraws */
  out1: number;
}
/** the lantern's centre (window-local) at time t, for sparks and the room light */
export function handoverLantern(tm: HandoverTimes, tq: number): { x: number; y: number; held: 'arm' | 'researcher' } {
  const R = 15;
  if (tq < tm.take) {
    const hx = lerp(112, 168, sm((tq - tm.in0) / (tm.in1 - tm.in0)));
    return { x: hx + 2, y: 94 + 16 + R, held: 'arm' };
  }
  const a = researcherHand(tm, tq);
  return { x: a.x, y: a.y + 16 + R, held: 'researcher' };
}
const R1 = { x: 214, y: 166, s: 0.36 };
function r1Pose(tm: HandoverTimes, tq: number): Pose {
  const u = sm((tq - (tm.in1 - 0.25)) / 0.4);
  const v = sm((tq - (tm.take + 0.1)) / 0.45);
  return v > 0 ? blend(REACH, HOLD, v) : blend(STAND, REACH, u);
}
function researcherHand(tm: HandoverTimes, tq: number) {
  return RESEARCHERS[0].anchor({ x: R1.x, y: R1.y, facing: 'left', pose: r1Pose(tm, tq), scale: R1.s }, 'handF');
}

/** (3) 24 FEB → 3 MAR 2023: a lantern tagged META handed through a hatch to a few researchers on request */
export function handover(c: C, env: PaintEnv, W: Win, k: number, tm: HandoverTimes, tq: number) {
  const w = W.w, h = W.h;
  const m = env.mood;
  glass(c, env, w, h);
  if (k <= 0.002) return;
  const L = handoverLantern(tm, tq);
  c.save();
  c.globalAlpha *= clamp01(k * 1.3);
  // the room: a back wall lit by the lantern alone
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.6);
  c.fillRect(0, 0, w, h);
  const rg = c.createRadialGradient(L.x, L.y, 4, L.x, L.y, 220);
  rg.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.55), 0.95 * k));
  rg.addColorStop(0.5, withAlpha(mixLab(m.set, m.halo, 0.25), 0.55 * k));
  rg.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = rg;
  c.fillRect(0, 0, w, h);
  // floor
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.75);
  c.fillRect(0, 166, w, h - 166);
  c.fillStyle = withAlpha(m.rim, 0.2 * k);
  c.fillRect(0, 166, w, 1);
  // the hatch in the back wall (a small window with a sill), the next room dark beyond it
  const Hh = { x: 46, y: 52, w: 66, h: 60 };
  c.fillStyle = mixLab(m.fg, m.set, 0.15);
  c.fillRect(Hh.x, Hh.y, Hh.w, Hh.h);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(Hh.x - 6, Hh.y + Hh.h, Hh.w + 12, 5);
  c.fillRect(Hh.x - 4, Hh.y - 4, Hh.w + 8, 4);
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.fillRect(Hh.x - 6, Hh.y + Hh.h, Hh.w + 12, 1);
  // the arm through the hatch: a sleeve from inside the hatch, the hand pinching the cord
  const armOut = tq < tm.take ? lerp(112, 168, sm((tq - tm.in0) / (tm.in1 - tm.in0))) : lerp(168, 98, sm((tq - tm.take - 0.1) / (tm.out1 - tm.take - 0.1)));
  if (armOut > 100) {
    c.save();
    c.beginPath();
    c.rect(Hh.x, -20, w, h + 40);
    c.clip();
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.moveTo(Hh.x + 8, 86);
    c.lineTo(armOut - 6, 89);
    c.lineTo(armOut - 6, 99);
    c.lineTo(Hh.x + 8, 104);
    c.closePath();
    c.fill();
    // cuff and hand
    c.fillRect(armOut - 12, 87, 3, 14);
    c.beginPath();
    c.ellipse(armOut, 95, 7, 5, 0.2, 0, Math.PI * 2);
    c.fill();
    c.fillRect(armOut + 2, 93, 7, 3);
    c.restore();
  }
  // the researchers (to the right, facing the hatch), the front one reaching in and taking the lantern
  const ink = PUPPET_NEAR_BLACK;
  const lightDir = { x: -1, y: -0.3, floor: 0.15 };
  RESEARCHERS[2].draw(c, { x: 296, y: 166, facing: 'left', pose: withLife(STAND, tq, 1203, 0.8), scale: 0.35, ink: mixLab(ink, m.set, 0.2), light: lightDir }, env);
  RESEARCHERS[1].draw(c, { x: 256, y: 166, facing: 'left', pose: withLife(STAND, tq, 1202, 0.8), scale: 0.34, ink: mixLab(ink, m.set, 0.1), light: lightDir }, env);
  RESEARCHERS[0].draw(c, { x: R1.x, y: R1.y, facing: 'left', pose: r1Pose(tm, tq), scale: R1.s, ink, light: lightDir, edgeRim: { x: -1, y: -0.2, px: 1.2, alpha: 0.5 } }, env);
  // the lantern on its cord, its paper tag reading META
  const hand = L.held === 'arm' ? { x: armOut + 2, y: 94 } : researcherHand(tm, tq);
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(hand.x, hand.y);
  c.lineTo(L.x, L.y - 18);
  c.stroke();
  paperLantern(c, { x: L.x, y: L.y, r: 15, act: k, hang: 0, tassel: false, halo: 0.9 }, env);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(L.x - 0.5, L.y + 15, 1, 6);
  c.save();
  c.translate(L.x, L.y + 21);
  c.rotate(0.05 * Math.sin(tq * 2.1));
  c.fillStyle = mixLab(mixLab('#ddd6c4', m.rim, 0.3), m.halo, 0.2);
  c.fillRect(-36, 0, 72, 30);
  c.fillStyle = mixLab(m.ink, '#2a2420', 0.3);
  c.font = `400 22px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText('META', 0, 23);
  c.restore();
  c.restore();
}

/** (4) 14 MAR 2023: two equal lanterns, one in each of two neighbouring panes, lit at the same instant */
export function twinLanterns(c: C, env: PaintEnv, W: Win, k: number, flare: number, tq: number) {
  const m = env.mood;
  for (const hf of W4_HALVES) {
    c.save();
    c.translate(hf.x, 0);
    c.beginPath();
    c.rect(0, 0, hf.w, W.h);
    c.clip();
    glass(c, env, hf.w, W.h);
    if (k > 0.002) {
      c.globalAlpha *= clamp01(k * 1.2);
      c.fillStyle = mixLab(env.fill('set'), m.fg, 0.6);
      c.fillRect(0, 0, hf.w, W.h);
      const cx = hf.w / 2, cy = 84;
      const rg = c.createRadialGradient(cx, cy, 4, cx, cy, 170);
      rg.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.6), 0.95 * k));
      rg.addColorStop(0.55, withAlpha(mixLab(m.set, m.halo, 0.25), 0.5 * k));
      rg.addColorStop(1, withAlpha(m.set, 0));
      c.fillStyle = rg;
      c.fillRect(0, 0, hf.w, W.h);
      c.fillStyle = mixLab(env.fill('set'), m.fg, 0.75);
      c.fillRect(0, 150, hf.w, W.h - 150);
      c.fillStyle = withAlpha(m.rim, 0.22 * k);
      c.fillRect(0, 150, hf.w, 1);
    }
    c.restore();
    // the lantern itself (unlit paper before; identical in both panes, so identical in light)
    c.save();
    c.translate(hf.x, 0);
    c.beginPath();
    c.rect(0, 0, hf.w, W.h);
    c.clip();
    const sway = 0.6 * Math.sin(tq * 1.3);
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3 + 0.7 * k);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(hf.w / 2, 0);
    c.lineTo(hf.w / 2 + sway, 54);
    c.stroke();
    paperLantern(c, { x: hf.w / 2 + sway, y: 84, r: 26, act: k, flare, hang: 0, tassel: true, halo: 0.75, alpha: 0.2 + 0.8 * k }, env);
    c.restore();
  }
}

// ================================================================================================ the doorway, street, stampede
/** ChatGPT's door: the doorway full of cool light, a light-spill on the pavement, the chat-box fanlight */
export function doorLight(c: C, env: PaintEnv, k: number, t: number) {
  const m = env.mood;
  const D = DOOR;
  const g = c.createLinearGradient(0, D.y, 0, D.y + D.h);
  g.addColorStop(0, mixLab(m.halo, m.core, 0.5 * k));
  g.addColorStop(1, mixLab(m.core, '#ffffff', 0.12 * k));
  c.fillStyle = g;
  c.fillRect(D.x, D.y, D.w, D.h);
  // the open door leaf, swung in (a dark sliver at the left jamb)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
  c.beginPath();
  c.moveTo(D.x, D.y);
  c.lineTo(D.x + 9, D.y + 5);
  c.lineTo(D.x + 9, D.y + D.h - 3);
  c.lineTo(D.x, D.y + D.h);
  c.closePath();
  c.fill();
  // the spill on the pavement and the road
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sg = c.createLinearGradient(0, D.y + D.h, 0, D.y + D.h + 110);
  sg.addColorStop(0, withAlpha(m.halo, 0.46 * k));
  sg.addColorStop(0.5, withAlpha(m.halo, 0.16 * k));
  sg.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = sg;
  c.beginPath();
  c.moveTo(D.x, D.y + D.h);
  c.lineTo(D.x + D.w, D.y + D.h);
  c.lineTo(D.x + D.w + 150, D.y + D.h + 110);
  c.lineTo(D.x - 150, D.y + D.h + 110);
  c.closePath();
  c.fill();
  // a wide low wash along the pavement either side, so the runners' shadows have light to fall across
  c.save();
  c.translate(D.x + D.w / 2, D.y + D.h + 12);
  c.scale(1, 0.12);
  glow(c, 0, 0, 320, m.halo, 0.2 * k);
  c.restore();
  c.restore();
  // the fanlight: the film's chat box as a small lit glyph above the door (lines of text, a blinking cursor)
  const fx = D.x + D.w / 2, fy = D.y - 20;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(fx - 24, fy - 10, 48, 20);
  c.fillStyle = mixLab(m.halo, m.core, 0.6 * k);
  c.fillRect(fx - 21, fy - 7, 42, 14);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.fillRect(fx - 17, fy - 4, 26, 1.6);
  c.fillRect(fx - 17, fy + 0.5, 18, 1.6);
  if (Math.floor(t * 2) % 2 === 0) c.fillRect(fx + 3, fy - 0.5, 3, 4);
}

export function street(c: C, env: PaintEnv) {
  const m = env.mood;
  c.fillStyle = mixLab(env.fill('set'), m.haze, 0.08);
  c.fillRect(-600, FAC.street, 2500, 22);
  c.fillStyle = withAlpha(m.rim, 0.18);
  c.fillRect(-600, FAC.street + 22, 2500, 1.2);
  c.fillStyle = mixLab(env.fill('set'), m.fg, 0.55);
  c.fillRect(-600, FAC.street + 23, 2500, 300);
  // the façade's foot meets the pavement in shadow
  c.fillStyle = withAlpha(m.fg, 0.5);
  c.fillRect(FAC.x0, FAC.street, FAC.x1 - FAC.x0, 3);
}

interface Runner {
  side: 1 | -1;
  t0: number;
  v: number;
  dist: number;
  lane: number;
  s: number;
  ph: number;
}
/** the stampede: each runner crosses into the low street frame (330 px from the door) at `tIn`; a dense first wave
 *  is already streaming in from both sides by 'stampede' (3.3 s), the rest keep coming through the pull-back */
const STREAM_IN = 330;
export const RUNNERS: Runner[] = Array.from({ length: 74 }, (_, i) => {
  const u = h01(i, 91);
  const v = 150 + 70 * h01(i, 93);
  const dist = 380 + 420 * h01(i, 94);
  const tIn = 1.95 + 5.8 * Math.pow(u, 1.5);
  const lane = FAC.street + 6 + 58 * Math.pow(h01(i, 95), 1.2);
  return {
    side: h01(i, 92) < 0.5 ? 1 : -1,
    t0: tIn - (dist - STREAM_IN) / v,
    v,
    dist,
    lane,
    // nearer the camera (lower on the pavement) a little larger
    s: (0.92 + 0.22 * h01(i, 96)) * (1 + (lane - FAC.street - 6) / 170),
    ph: h01(i, 97),
  } as Runner;
}).sort((a, b) => a.lane - b.lane);

/** a cut-paper runner (texture-size crowd figure): rigid limbs on twos */
function runner(c: C, x: number, y: number, H: number, f: 1 | -1, phase: number) {
  const phi = phase * Math.PI * 2;
  const bob = -0.03 * H * Math.abs(Math.sin(phi));
  const hip = { x, y: y - 0.5 * H + bob };
  const lean = 0.26;
  const neck = { x: hip.x + f * Math.sin(lean) * 0.31 * H, y: hip.y - Math.cos(lean) * 0.31 * H };
  c.lineCap = 'round';
  const limb = (a: { x: number; y: number }, b: { x: number; y: number }, w: number) => {
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  };
  for (const off of [Math.PI, 0]) {
    const s = Math.sin(phi + off);
    const a = 0.62 * s;
    const bend = 0.25 + 0.9 * Math.max(0, -Math.sin(phi + off + 0.7));
    const knee = { x: hip.x + f * Math.sin(a) * 0.25 * H, y: hip.y + Math.cos(a) * 0.25 * H };
    const a2 = a - bend * 1.25;
    const ank = { x: knee.x + f * Math.sin(a2) * 0.25 * H, y: knee.y + Math.cos(a2) * 0.25 * H };
    limb(hip, knee, 0.085 * H);
    limb(knee, ank, 0.07 * H);
    limb(ank, { x: ank.x + f * 0.07 * H, y: ank.y + 0.01 * H }, 0.05 * H);
  }
  limb(hip, neck, 0.16 * H);
  const sh = { x: neck.x - f * 0.02 * H, y: neck.y + 0.04 * H };
  for (const off of [0, Math.PI]) {
    const s = Math.sin(phi + off);
    const a = -0.85 * s;
    const el = { x: sh.x + f * Math.sin(a) * 0.17 * H, y: sh.y + Math.cos(a) * 0.17 * H };
    const a2 = a + 1.5;
    limb(sh, el, 0.06 * H);
    limb(el, { x: el.x + f * Math.sin(a2) * 0.15 * H, y: el.y + Math.cos(a2) * 0.15 * H }, 0.05 * H);
  }
  c.beginPath();
  c.arc(neck.x + f * 0.05 * H, neck.y - 0.09 * H, 0.08 * H, 0, Math.PI * 2);
  c.fill();
}

/** the stampede: figures streaming in from both sides into the door's light (cut-paper texture on twos). Near the
 *  door each runner is rimmed on its door side and throws a short shadow away from the light across the pavement. */
export function runners(c: C, env: PaintEnv, tq: number, doorK = 1) {
  const m = env.mood;
  const cx = DOOR.x + DOOR.w / 2;
  const rimCol = mixLab(m.core, m.halo, 0.35);
  for (const r of RUNNERS) {
    const dt = tq - r.t0;
    if (dt < 0) continue;
    const left = r.dist - r.v * dt;
    if (left < -2) continue;
    const x = cx - r.side * left;
    // the last stretch: up the step into the doorway, melting into the light
    const ramp = 60 + (r.lane - FAC.street) * 2.4;
    const near = clamp01(1 - left / ramp);
    const y = lerp(r.lane, FAC.street - 1, sm(near));
    const a = clamp01((left - 2) / 22);
    if (a <= 0) continue;
    const H = 36 * r.s * lerp(1, 0.86, near);
    const ph = r.ph + dt * 2.3;
    // how much of the door's light reaches this runner
    const lit = doorK * clamp01(1 - Math.abs(x - cx) / 300) * clamp01(1 - (y - FAC.street) / 120);
    c.globalAlpha = a;
    if (lit > 0.02) {
      // the short shadow on the pavement, thrown away from the doorway
      const len = H * (0.35 + 0.9 * (1 - clamp01(Math.abs(x - cx) / 300)));
      c.fillStyle = withAlpha(m.fg, 0.55 * lit);
      c.beginPath();
      c.ellipse(x - r.side * len * 0.5, y + 1, len * 0.55 + H * 0.12, H * 0.05, 0, 0, Math.PI * 2);
      c.fill();
      // the rim: the figure once in the door's light, offset toward the door, then the black cut-out over it
      c.fillStyle = withAlpha(rimCol, 0.9 * lit);
      c.strokeStyle = withAlpha(rimCol, 0.9 * lit);
      runner(c, x + r.side * 1.3, y - 0.5, H, r.side, ph);
    }
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.strokeStyle = PUPPET_NEAR_BLACK;
    runner(c, x, y, H, r.side, ph);
  }
  c.globalAlpha = 1;
}

/** a lit window's light falling down the wall below it: a soft fan under the sill, the sill edge catching it */
export function sillLight(c: C, w: Win, k: number, col: string) {
  if (k <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const y0 = w.y + w.h + 9;
  const H = 120;
  const g = c.createLinearGradient(0, y0, 0, y0 + H);
  g.addColorStop(0, withAlpha(col, 0.26 * k));
  g.addColorStop(0.35, withAlpha(col, 0.1 * k));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(w.x - 6, y0);
  c.lineTo(w.x + w.w + 6, y0);
  c.lineTo(w.x + w.w + 46, y0 + H);
  c.lineTo(w.x - 46, y0 + H);
  c.closePath();
  c.fill();
  // the reveals and the sill's top edge catch the room's light
  c.fillStyle = withAlpha(col, 0.5 * k);
  c.fillRect(w.x - 18, w.y + w.h, w.w + 36, 1.6);
  c.fillStyle = withAlpha(col, 0.18 * k);
  c.fillRect(w.x - 8, w.y - 8, 8, w.h + 8);
  c.fillRect(w.x + w.w, w.y - 8, 8, w.h + 8);
  c.restore();
}

// ================================================================================================ the city (L1, L2) and the near lamp post (L5)
export function skylineL1(f: Frame, c: C, env: PaintEnv, key: string, cams: Camera3[]) {
  const r = overscan(LAYERS.L1, cams, 60);
  bake(f, c, `${key}/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
    skyline(cc, { style: 'megacity', x0: r.x, x1: r.x + r.w, y: 560, height: 230, seed: 1208, lit: 0.1, ground: 400, role: 'set' }, env);
  });
}

interface Block {
  x: number;
  w: number;
  top: number;
}
const BLOCKS: Block[] = [
  { x: -420, w: 210, top: 250 },
  { x: -200, w: 300, top: 190 },
  { x: 90, w: 120, top: 330 },
  { x: 1080, w: 140, top: 300 },
  { x: 1210, w: 260, top: 170 },
  { x: 1470, w: 260, top: 240 },
];
interface L2Win {
  x: number;
  y: number;
  on0: boolean;
  on: number;
}
export const L2WINS: L2Win[] = (() => {
  const out: L2Win[] = [];
  let i = 0;
  for (const b of BLOCKS) {
    for (let y = b.top + 18; y < 640; y += 20) for (let x = b.x + 10; x < b.x + b.w - 12; x += 16) {
      out.push({ x, y, on0: h01(i, 61) < 0.08, on: h01(i, 62) < 0.5 ? h01(i, 63) * 0.4 : -1 });
      i++;
    }
  }
  return out;
})();
export function cityL2(f: Frame, c: C, env: PaintEnv, key: string, cams: Camera3[], t: number, onAt: number, copiesL2: Map<number, number>) {
  const r = overscan(LAYERS.L2, cams, 40);
  bake(f, c, `${key}/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
    cc.fillStyle = env.fill('set');
    for (const b of BLOCKS) {
      cc.fillRect(b.x, b.top, b.w, 900);
      cc.fillRect(b.x - 6, b.top - 8, b.w + 12, 8);
    }
    // a few rooftop things: tanks and a stepped crown
    cc.fillRect(-120, 150, 40, 40);
    cc.fillRect(1290, 130, 60, 40);
    cc.fillRect(1310, 100, 20, 30);
    cc.fillStyle = withAlpha(env.mood.rim, 0.08);
    for (const b of BLOCKS) cc.fillRect(b.x - 6, b.top - 8, b.w + 12, 1);
  });
  const lit = mixLab(env.mood.core, env.mood.halo, 0.5);
  for (let i = 0; i < L2WINS.length; i++) {
    const w = L2WINS[i];
    let a = w.on0 ? 0.35 : 0;
    if (w.on >= 0 && t > onAt + w.on) {
      const u = t - onAt - w.on;
      a = Math.max(a, u < 0.12 ? 0.8 : lerp(0.85, 0.28, sm((u - 0.3) / 1.6)));
    }
    const ct = copiesL2.get(i);
    const cp = ct !== undefined ? copyLevel(t - ct) : 0;
    if (cp > 0) {
      c.fillStyle = mixLab(mixLab(env.mood.core, env.mood.halo, 0.15), '#ffffff', 0.25 * Math.max(0, cp - 1));
      c.fillRect(w.x - 0.5, w.y - 0.5, 8, 10);
      continue;
    }
    if (a <= 0.01) continue;
    c.fillStyle = withAlpha(lit, a);
    c.fillRect(w.x, w.y, 7, 9);
  }
  for (const [i, ct] of copiesL2) {
    if (t < ct) continue;
    const w = L2WINS[i];
    const cp = copyLevel(t - ct);
    glow(c, w.x + 3.5, w.y + 4.5, 18 + 22 * Math.max(0, cp - 1), env.mood.halo, 0.3 + 0.45 * Math.max(0, cp - 1));
  }
}

export function lampPost(f: Frame, c: C, env: PaintEnv, key: string, layer: LayerSpec) {
  const r: Rect = { x: 1120, y: 60, w: 260, h: 1100 };
  bake(f, c, `${key}/post/${env.mood.id}/${layer.id}`, r, (cc) => {
    cc.fillStyle = env.fill('fg');
    const x = 1262;
    cc.fillRect(x - 7, 150, 14, 1000);
    cc.fillRect(x - 13, 820, 26, 340);
    // a swan-neck arm to a hooded lamp head (unlit)
    cc.strokeStyle = env.fill('fg');
    cc.lineWidth = 7;
    cc.beginPath();
    cc.moveTo(x, 170);
    cc.quadraticCurveTo(x - 10, 110, x - 70, 118);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(x - 96, 118);
    cc.lineTo(x - 50, 118);
    cc.lineTo(x - 58, 140);
    cc.lineTo(x - 88, 140);
    cc.closePath();
    cc.fill();
    cc.fillStyle = withAlpha(env.mood.rim, 0.14);
    cc.fillRect(x - 7, 150, 2, 1000);
  });
}

// ================================================================================================ the mid plane (L3) and the near kerb (L5)
/** L3: the neighbouring buildings either side of the façade, nearer than the hazed blocks: cut-paper cornices on
 *  brackets, rooftop water tanks on legs, chimney stacks, a few lit windows. Mostly hidden behind the façade; they
 *  fill the frame's edges once the camera pulls back. */
export function midL3(f: Frame, c: C, env: PaintEnv, key: string, cams: Camera3[]) {
  const r = overscan(LAYERS.L3, cams, 40);
  bake(f, c, `${key}/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
    const m = env.mood;
    const wall = env.fill('set');
    const ink = mixLab(wall, m.fg, 0.35);
    const fronts = [
      { x0: r.x - 20, x1: 270, top: 236, tank: 40, stacks: [150, 196] },
      { x0: 1010, x1: r.x + r.w + 20, top: 206, tank: 1268, stacks: [1150, 1384] },
    ];
    for (const b of fronts) {
      cc.fillStyle = wall;
      cc.fillRect(b.x0, b.top, b.x1 - b.x0, 1200);
      // a faint vertical sky-gradient on the front
      const g = cc.createLinearGradient(0, b.top, 0, b.top + 500);
      g.addColorStop(0, withAlpha(m.setHaze, 0.14));
      g.addColorStop(1, withAlpha(m.setHaze, 0));
      cc.fillStyle = g;
      cc.fillRect(b.x0, b.top, b.x1 - b.x0, 500);
      // the cornice: a projecting slab on brackets with a cut top edge
      cc.fillStyle = ink;
      cc.fillRect(b.x0 - 10, b.top - 12, b.x1 - b.x0 + 20, 12);
      cc.fillRect(b.x0 - 4, b.top, b.x1 - b.x0 + 8, 5);
      for (let x = b.x0 + 4; x < b.x1 - 4; x += 30) {
        cc.beginPath();
        cc.moveTo(x, b.top + 5);
        cc.lineTo(x + 9, b.top + 5);
        cc.quadraticCurveTo(x + 8, b.top + 17, x + 2, b.top + 15);
        cc.closePath();
        cc.fill();
      }
      cc.fillStyle = withAlpha(m.rim, 0.22);
      cc.fillRect(b.x0 - 10, b.top - 12, b.x1 - b.x0 + 20, 1.2);
      // chimney stacks
      cc.fillStyle = ink;
      for (const sx of b.stacks) {
        cc.fillRect(sx - 9, b.top - 46, 18, 34);
        cc.fillRect(sx - 12, b.top - 50, 24, 5);
        cc.fillRect(sx - 5, b.top - 58, 4, 8);
        cc.fillRect(sx + 2, b.top - 56, 4, 6);
      }
      // the water tank on legs: barrel, conical cap, cross-bracing
      const tx = b.tank, ty = b.top - 12;
      for (const dx of [-17, -6, 6, 17]) cc.fillRect(tx + dx - 1.5, ty - 30, 3, 30);
      cc.fillRect(tx - 20, ty - 18, 40, 2);
      cc.strokeStyle = ink;
      cc.lineWidth = 1.2;
      cc.beginPath();
      cc.moveTo(tx - 17, ty - 30);
      cc.lineTo(tx + 17, ty - 4);
      cc.moveTo(tx + 17, ty - 30);
      cc.lineTo(tx - 17, ty - 4);
      cc.stroke();
      cc.fillRect(tx - 22, ty - 66, 44, 36);
      cc.beginPath();
      cc.moveTo(tx - 24, ty - 66);
      cc.lineTo(tx, ty - 84);
      cc.lineTo(tx + 24, ty - 66);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(m.rim, 0.14);
      for (let k = 0; k < 3; k++) cc.fillRect(tx - 22, ty - 58 + k * 10, 44, 1);
      // windows: a dark grid with a few lit
      let i = 0;
      for (let y = b.top + 34; y < 690; y += 38) {
        for (let x = b.x0 + 18; x < b.x1 - 24; x += 34) {
          const on = h01(i++, 141) < 0.09;
          cc.fillStyle = on ? withAlpha(mixLab(m.core, m.halo, 0.55), 0.55) : mixLab(wall, m.fg, 0.55);
          cc.fillRect(x, y, 14, 20);
          cc.fillStyle = withAlpha(m.rim, 0.1);
          cc.fillRect(x - 2, y + 20, 18, 1);
        }
      }
    }
  });
}

/** L5: a cast-iron kerb railing along the bottom edge (blurred by its depth), open in front of the door */
export function railL5(f: Frame, c: C, env: PaintEnv, key: string, cams: Camera3[], y: number, gap: { x0: number; x1: number }) {
  const r = overscan(LAYERS.L5, cams, 40);
  const R: Rect = { x: r.x, y: y - 40, w: r.w, h: 260 };
  bake(f, c, `${key}/rail/${env.mood.id}/${rk(R)}/${Math.round(gap.x0)}`, R, (cc) => {
    const m = env.mood;
    cc.fillStyle = env.fill('fg');
    const seg = (a: number, z: number) => {
      if (z <= a) return;
      cc.fillRect(a, y, z - a, 7);
      cc.fillRect(a, y + 46, z - a, 5);
      for (let x = a + 4; x < z - 2; x += 13) cc.fillRect(x, y + 7, 3, 60);
    };
    seg(R.x, gap.x0);
    seg(gap.x1, R.x + R.w);
    // the posts with ball finials, and the gap's two gate posts
    for (let x = Math.ceil(R.x / 120) * 120; x < R.x + R.w; x += 120) {
      if (x > gap.x0 - 10 && x < gap.x1 + 10) continue;
      cc.fillRect(x - 5, y - 6, 10, 200);
      cc.beginPath();
      cc.arc(x, y - 11, 7, 0, Math.PI * 2);
      cc.fill();
    }
    for (const x of [gap.x0, gap.x1]) {
      cc.fillRect(x - 8, y - 16, 16, 210);
      cc.beginPath();
      cc.arc(x, y - 24, 10, 0, Math.PI * 2);
      cc.fill();
    }
    // the kerb stone under the railing
    cc.fillRect(R.x, y + 66, R.w, 200);
    cc.fillStyle = withAlpha(m.rim, 0.16);
    cc.fillRect(R.x, y, R.w, 1.2);
    cc.fillRect(R.x, y + 66, R.w, 1.2);
  });
}
