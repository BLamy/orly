/**
 * neural-net-history — ch01-s04 / ch01-s05: the study's near plane and its left bookcase, ch01 cut.
 *
 * ONE study geography for both shots, matching sets/study.ts: the left bookcase flanks the Case Board, the
 * Wall of Forecasts hangs to the board's right with the study window beyond it, and the green-shaded
 * banker's lamp stands on the desk in front of the board, UNDER ITS OWN POOL (the pool on the board is
 * centred at x ≈ 610; the lamp stands at L5 x 770, which lands just right of the pool in every camera).
 * In ch01-s04's opening wide only its shade rises into the bottom of frame; in ch01-s05's full wide the
 * whole lamp stands on the desk with the manila file beside it.
 *
 * The shade is the study's one saturated accent: low-chroma bottle green, the light glowing through the
 * glass toward its lower lip when lit.
 *
 *   study01Near(f, { key, cams, lamp, file?, alpha? })    L5: the desk (lit top, dark apron), the file, the lamp
 *                                                           (+ the lamp practical); returns { bulb }
 *   study01Shelves(f, { key, cams, lamp })                  the left bookcase (books as ink against an amber backlight)
 *   study01Chair(f, { key, cams, alpha })                   L6: a chair back at the lower right (the full wide's near frame)
 *   bankerLamp01(c, x, y, k, env, lit)                      the lamp, front-on
 *   shadeGreen(env, lit)                                    the shade's colours
 *   LAMP01, DESK01, BULB01                                  geometry (L5 world)
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
/** the lamp (L5 world): base centre at (x, y); k = px per lamp unit (the lamp is ~38 units tall) */
export const LAMP01 = { x: 770, y: 1246, k: 8 } as const;
/** the desk (L5 world): its back edge, front edge, extent */
export const DESK01 = { back: 1226, front: 1262, x0: -160, x1: 2200 } as const;
/** the bulb under the shade */
export const BULB01 = { x: LAMP01.x, y: LAMP01.y - 31 * LAMP01.k };

const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/** the shade's glass: deep bottle green, lighter toward the lip when lit */
export function shadeGreen(env: PaintEnv, lit: number) {
  const dark = mixLab('#1b3326', env.fill('ink'), 0.35);
  const glow = mixLab('#46755a', env.mood.halo, 0.12);
  return { dark, lip: mixLab(dark, glow, 0.25 + 0.75 * lit) };
}

/** a banker's lamp, front-on: a long half-cylinder green shade, brass stem with a knop, a stepped base */
export function bankerLamp01(c: C, x: number, y: number, k: number, env: PaintEnv, lit: number) {
  const ink = env.fill('ink');
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  c.fillStyle = ink;
  // stepped rectangular base
  c.beginPath();
  c.roundRect(-13, -2.4, 26, 2.4, 0.8);
  c.roundRect(-10, -4, 20, 1.8, 0.6);
  c.fill();
  // stem with a knop
  c.fillRect(-0.7, -29.5, 1.4, 26);
  c.beginPath();
  c.ellipse(0, -14, 1.6, 1.1, 0, 0, Math.PI * 2);
  c.fill();
  // the yoke under the shade
  c.fillRect(-9, -30.6, 18, 1.2);
  // the shade: a long, low half-cylinder (straight top, rolled ends), green glass lit from inside
  const shade = new Path2D();
  shade.moveTo(-16.5, -29.6);
  shade.lineTo(-16.2, -32.2);
  shade.quadraticCurveTo(-16, -37.6, -11.5, -38);
  shade.lineTo(11.5, -38);
  shade.quadraticCurveTo(16, -37.6, 16.2, -32.2);
  shade.lineTo(16.5, -29.6);
  shade.closePath();
  const G = shadeGreen(env, lit);
  const g = c.createLinearGradient(0, -38, 0, -29.6);
  g.addColorStop(0, G.dark);
  g.addColorStop(0.45, mixLab(G.dark, G.lip, 0.4));
  g.addColorStop(1, G.lip);
  c.fillStyle = g;
  c.fill(shade);
  // pull chain and bead
  c.strokeStyle = ink;
  c.lineWidth = 0.22;
  c.beginPath();
  c.moveTo(7.5, -29.6);
  c.lineTo(7.5, -24);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(7.5, -23.6, 0.55, 0, Math.PI * 2);
  c.fill();
  // rim: the shade's top edge and the stem catching the room; the lip glowing when lit
  c.fillStyle = withAlpha(env.mood.rim, 0.32);
  c.fillRect(-11.5, -38, 23, 0.25);
  c.fillRect(0.5, -29, 0.2, 24);
  if (lit > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.6), 0.9 * lit);
    c.fillRect(-16.2, -29.9, 32.4, 0.55);
  }
  c.restore();
}

export function study01Near(f: Frame, o: { key: string; cams: Camera3[]; lamp: number; file?: boolean; alpha?: number }) {
  const L = LAMP01;
  const A = o.alpha ?? 1;
  if (A <= 0.01) return { bulb: BULB01 };
  if (o.lamp > 0.12) f.practical({ x: BULB01.x, y: BULB01.y + 6, kind: 'lamp', seed: 41, intensity: 0.85 * o.lamp * A, radius: 80, layer: 'L5' });
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, o.cams, 40);
    c.save();
    c.globalAlpha *= A;
    f.cached(`${o.key}/near01c/${env.mood.id}/${o.file ? 1 : 0}/${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const ink = mixLab(env.fill('ink'), env.mood.fg, 0.4);
      const D = DESK01;
      // the top surface seen at a low angle (lit by the lamp), then the dark apron
      const top = new Path2D();
      top.moveTo(D.x0 + 30, D.back);
      top.lineTo(D.x1 - 30, D.back);
      top.lineTo(D.x1, D.front);
      top.lineTo(D.x0, D.front);
      top.closePath();
      cc.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.4);
      cc.fill(top);
      const pool = cc.createRadialGradient(L.x + 120, D.front - 14, 10, L.x + 120, D.front - 14, 760);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.3), 0.75));
      pool.addColorStop(0.45, withAlpha(env.mood.halo, 0.26));
      pool.addColorStop(1, withAlpha(env.mood.halo, 0));
      cc.save();
      cc.clip(top);
      cc.fillStyle = pool;
      cc.fillRect(L.x - 660, D.back - 10, 1560, D.front - D.back + 20);
      cc.restore();
      cc.fillStyle = ink;
      cc.fillRect(D.x0, D.front, D.x1 - D.x0, r.y + r.h - D.front + 20);
      cc.fillStyle = withAlpha(env.mood.rim, 0.45);
      cc.fillRect(D.x0, D.front, D.x1 - D.x0, 1.6);
      // a stack of books at the desk's far end and (from ch01-s04 on) the manila file lying flat
      cc.fillStyle = ink;
      let y = D.front - 8;
      for (let i = 0; i < 4; i++) {
        const w = 150 + hash1(i, 12) * 50, h = 18 + hash1(i, 13) * 8;
        const bx = 1960 + (hash1(i, 14) - 0.5) * 20;
        cc.fillRect(bx, y - h, w, h);
        cc.fillStyle = withAlpha(env.mood.rim, 0.18);
        cc.fillRect(bx, y - h, w, 1);
        cc.fillStyle = ink;
        y -= h + 1;
      }
      if (o.file) {
        // the manila file from ch01-s04, lying flat beside the book stack: its lamp-lit top seen at a low
        // angle (manila, a step under the lamp's pool), the dark front edge of its thickness, the tab at the back
        // (round 1: as large on the desk as ch01-s04's top-down plate implies, to the lamp's right and inside its
        // pool, so it reads in the full wide)
        // the s04 manila (its front-flap value) brightened a step by the lamp's pool, the tab standing at the back
        // edge, a darker band for the folder's thickness and a pale sliver of the slip's edge inside it
        const manila = mixLab(mixLab(env.mood.halo, '#b08a52', 0.35), env.mood.set, 0.3);
        const fx = 1330, fw = 340;
        const topY = D.back + 3, frontY = D.front - 12;
        cc.fillStyle = mixLab(manila, env.mood.fg, 0.12);
        cc.beginPath();
        cc.moveTo(fx + 30, topY + 1);
        cc.lineTo(fx + 34, topY - 13);
        cc.lineTo(fx + 104, topY - 13);
        cc.lineTo(fx + 108, topY + 1);
        cc.closePath();
        cc.fill(); // the tab
        cc.fillStyle = manila;
        cc.beginPath();
        cc.moveTo(fx + 12, topY);
        cc.lineTo(fx + fw + 8, topY);
        cc.lineTo(fx + fw, frontY);
        cc.lineTo(fx, frontY);
        cc.closePath();
        cc.fill();
        cc.fillStyle = mixLab(manila, env.mood.fg, 0.6);
        cc.fillRect(fx, frontY, fw, 8); // the file's thickness
        cc.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.65);
        cc.fillRect(fx + 12, topY, fw - 4, 1.6);
        cc.fillRect(fx + 34, topY - 13, 70, 1.4);
        cc.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.3), 0.7);
        cc.fillRect(fx + 40, frontY - 3, fw - 90, 2); // the slip's edge inside
      }
    })(c, r.x, r.y);
    bankerLamp01(c, L.x, L.y, L.k, env, o.lamp);
    c.restore();
  });
  return { bulb: BULB01 };
}

/** the left bookcase flanking the board: books as ink against an amber backlight (just in front of the study wall) */
export const SHELF_PLANE: LayerSpec = { id: 'study01Shelves', z: 1045, haze: 0.12, blur: 0.6 };
export function study01Shelves(f: Frame, o: { key: string; cams: Camera3[]; lamp?: number; glow?: number }) {
  const lamp = o.lamp ?? 1;
  const glow = o.glow ?? 0;
  f.layer(SHELF_PLANE, (c, env) => {
    const r = overscan(SHELF_PLANE, o.cams, 40);
    f.cached(`${o.key}/shelves01b/${env.mood.id}/${glow.toFixed(2)}/${rk(r)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      bookcase(cc, -170, -80, 270, 1120, 3, env, glow);
    })(c, r.x, r.y);
    if (lamp < 0.999) {
      c.fillStyle = withAlpha(env.mood.fg, 0.9 * (1 - lamp));
      c.fillRect(r.x, r.y, r.w, r.h);
    }
  });
}

/** a chair back at the lower right, the full wide's near frame (L6: the most blurred, darkest plane) */
export function study01Chair(f: Frame, o: { key: string; cams: Camera3[]; alpha?: number }) {
  const A = o.alpha ?? 1;
  if (A <= 0.01) return;
  f.layer('L6', (c, env) => {
    c.save();
    c.globalAlpha *= A;
    c.fillStyle = env.fill('fg');
    // a high-backed chair seen from behind: two posts with finials, a curved top rail, a pierced splat
    // placed for the full wide (STUDY_CAMS.full): its top rail in the lower right corner (L6 world is
    // rest-screen px, so far from home it sits well off to the right and is drawn 3x)
    const x = 0, y = 0;
    c.translate(3150, 1300);
    c.scale(3, 3);
    const p = new Path2D();
    p.moveTo(x, y + 420);
    p.lineTo(x + 6, y + 40);
    p.quadraticCurveTo(x + 4, y + 8, x + 18, y - 6);
    p.quadraticCurveTo(x + 130, y - 46, x + 250, y - 6);
    p.quadraticCurveTo(x + 266, y + 8, x + 262, y + 40);
    p.lineTo(x + 270, y + 420);
    p.lineTo(x + 236, y + 420);
    p.lineTo(x + 230, y + 46);
    p.quadraticCurveTo(x + 134, y + 18, x + 38, y + 46);
    p.lineTo(x + 34, y + 420);
    p.closePath();
    // the splat: a vase shape down the middle with a pierced hole (the backlight shows through)
    p.moveTo(x + 112, y + 40);
    p.quadraticCurveTo(x + 92, y + 120, x + 116, y + 200);
    p.lineTo(x + 104, y + 420);
    p.lineTo(x + 164, y + 420);
    p.lineTo(x + 152, y + 200);
    p.quadraticCurveTo(x + 176, y + 120, x + 156, y + 40);
    p.closePath();
    p.ellipse(x + 134, y + 110, 9, 22, 0, 0, Math.PI * 2);
    c.fill(p, 'evenodd');
    c.beginPath();
    c.arc(x + 14, y - 14, 14, 0, Math.PI * 2);
    c.arc(x + 256, y - 14, 14, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });
}

function bookcase(c: C, x: number, y: number, w: number, h: number, seed: number, env: PaintEnv, glow = 0) {
  const m = env.mood;
  const ink = env.fill('ink');
  const rows = 6;
  const rh = h / rows;
  // the amber backlight between the books (brightest mid-height of each bay, toward the lamp side); `glow`
  // raises the band just above the book tops so the ragged tops cut against it (ch01-s04's establishing medium)
  for (let i = 0; i < rows; i++) {
    const by = y + i * rh;
    const g = c.createLinearGradient(0, by, 0, by + rh);
    g.addColorStop(0, mixLab(m.set, m.halo, 0.2 + 0.2 * glow));
    if (glow > 0) g.addColorStop(0.32, mixLab(m.setHaze, m.halo, 0.45 + 0.4 * glow));
    g.addColorStop(0.6, mixLab(m.setHaze, m.halo, 0.45 + 0.25 * glow));
    g.addColorStop(1, mixLab(m.set, m.halo, 0.25 + 0.1 * glow));
    c.fillStyle = g;
    c.fillRect(x, by, w, rh);
  }
  c.fillStyle = ink;
  // carcass: sides, shelves
  c.fillRect(x - 10, y, 12, h);
  c.fillRect(x + w - 2, y, 12, h);
  for (let i = 0; i <= rows; i++) c.fillRect(x - 10, y + i * rh - 6, w + 20, 10);
  // books: runs of spines of varied height, a leaning one, a few gaps
  for (let i = 0; i < rows; i++) {
    const floor = y + (i + 1) * rh - 6;
    let bx = x + 4;
    let k = 0;
    while (bx < x + w - 8) {
      const r = hash1(seed * 97 + i * 31 + k, 5);
      const bw = 7 + hash1(seed * 97 + i * 31 + k, 6) * 9;
      const bh = rh * (0.55 + 0.35 * hash1(seed * 97 + i * 31 + k, 7));
      if (r < 0.08) {
        bx += 18;
      } else if (r < 0.13 && bx + bh < x + w) {
        c.save();
        c.translate(bx, floor);
        c.rotate(0.38);
        c.fillRect(0, -bh, bw, bh);
        c.restore();
        bx += bh * 0.45 + bw;
      } else {
        c.fillRect(bx, floor - bh, Math.min(bw, x + w - 4 - bx), bh);
        bx += bw + 1.2;
      }
      k++;
    }
  }
  c.fillStyle = withAlpha(m.rim, 0.14);
  for (let i = 0; i <= rows; i++) c.fillRect(x - 10, y + i * rh - 6, w + 20, 1);
}
