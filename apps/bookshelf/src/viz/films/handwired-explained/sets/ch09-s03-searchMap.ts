/**
 * handwired-explained — THE JSON SEARCH MAP (ch09-s03, and the back plane of ch09-s03b / ch09-s04).
 *
 * 100,000 generated JSON documents, one CELL each, in the documents' order, row after row (the demo page's map). Each
 * cell is one document's strip of 512 code-point slots plus one length slot, folded into 27 x 19 = 513 slots
 * (reading order), and each cell carries its own GPU thread: a copper BEAD that steps one slot at a time through a
 * fixed cut-brass PLATE (the step: the same cut pattern at every slot), all beads in unison.
 *
 * REAL DATA (sets/data/ch09-s03-search.json, from the repo's own generator, src/json-search/documents.ts,
 * documentAt(20261013, i)): the hero cell is document 1 (a user record), printed slot by slot as its real code points
 * (123 '{', 34 '"', ...), -1 past the text's end, and its length (353) in the last slot; the copper match marks are
 * the documents whose text contains 'error' (one bit per document, computed, never placed by eye).
 *
 *   import { MAP, mapView, drawSearchMap, kiln, KILN_L3, patternField } from '../sets/ch09-s03-searchMap';
 *   const v = mapView(Z, fu, fv, { x: 640, y: 360 });     // map units -> L4 world px (Z px per unit, focal fu,fv)
 *   drawSearchMap(f, c, env, v, { slot, beadGlow, matches, sweepX });
 *
 * Map units: a cell is CW x CH (1.42 x 1) including its gap; the map is COLS x ROWS = 400 x 250 cells.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { windowWall } from '../../../film/silhouette/architecture';
import data from './data/ch09-s03-search.json';

export const MAP = { cols: 400, rows: 250, cw: 1.42, ch: 1, gap: 0.12, sc: 27, sr: 19 } as const;
export const DOCS = MAP.cols * MAP.rows;
/** one slot's size in map units */
export const SLOT_W = (MAP.cw - MAP.gap) / MAP.sc;
export const SLOT_H = (MAP.ch - MAP.gap) / MAP.sr;
/** the hero document (document 1: column 1, row 0) */
export const HERO = { index: data.docIndex, col: data.docIndex % MAP.cols, row: Math.floor(data.docIndex / MAP.cols) };
/** the hero's 513 slots: 512 code points (-1 past the end) and the length */
export const HERO_SLOTS: number[] = [...(data.slots as number[]), data.length as number];
export const HERO_LENGTH = data.length as number;
const MATCH_BYTES = (() => {
  const s = atob(data.matchBits as string);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
})();
export const isMatch = (i: number) => ((MATCH_BYTES[i >> 3] >> (i & 7)) & 1) === 1;

/** map units -> L4 world px: X = o.x + (u - fu) * Z */
export interface MapView {
  Z: number;
  fu: number;
  fv: number;
  o: { x: number; y: number };
}
export const mapView = (Z: number, fu: number, fv: number, o = { x: 640, y: 360 }): MapView => ({ Z, fu, fv, o });
export const toW = (v: MapView, u: number, w: number) => ({ x: v.o.x + (u - v.fu) * v.Z, y: v.o.y + (w - v.fv) * v.Z });
/** the top-left of a cell's slot area (map units) */
export const cellOrigin = (col: number, row: number) => ({ u: col * MAP.cw + MAP.gap / 2, v: row * MAP.ch + MAP.gap / 2 });
/** the centre of slot j of a cell (map units) */
export function slotCentre(col: number, row: number, j: number) {
  const o = cellOrigin(col, row);
  return { u: o.u + ((j % MAP.sc) + 0.5) * SLOT_W, v: o.v + (Math.floor(j / MAP.sc) + 0.5) * SLOT_H };
}
/** the zoom (px per map unit) at which the hero's slots are `px` world px wide */
export const zoomForSlot = (px: number) => px / SLOT_W;

// ---------------------------------------------------------------- colours
const sheetCol = (env: PaintEnv) => mixLab(env.mood.set, env.mood.haze, 0.35);
const cellCol = (env: PaintEnv) => mixLab(env.mood.setHaze, env.mood.rim, 0.22);
/** the hero's paper (lighter: its numbers are read) */
const heroPaper = (env: PaintEnv) => mixLab(mixLab('#dfe9e4', env.mood.rim, 0.45), env.mood.haze, 0.2);
/** the thread's light at the far zoom: a pale cyan point */
const grainCol = (env: PaintEnv) => mixLab(env.mood.core, '#ffffff', 0.25);
const slotInk = (env: PaintEnv) => mixLab('#18211f', env.mood.ink, 0.3);
export const copper = (env: PaintEnv, k = 0) => mixLab(mixLab('#c27a43', env.mood.halo, 0.12), '#ffd9a8', 0.5 * k);
const brass = (env: PaintEnv, k = 0) => mixLab(mixLab('#b08d4a', env.mood.halo, 0.25), '#f3dfae', k);

// ---------------------------------------------------------------- tiles (module scope, deterministic, reused)
const tileCache = new Map<string, HTMLCanvasElement>();
function tile(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let cv = tileCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = Math.max(1, w);
    cv.height = Math.max(1, h);
    draw(cv.getContext('2d')!);
    tileCache.set(key, cv);
    if (tileCache.size > 400) tileCache.delete(tileCache.keys().next().value as string);
  }
  return cv;
}
/** the generic cell (any document): a pale paper sheet with its slot grid as texture (drawn into tw x th px) */
function baseTile(env: PaintEnv, tw: number, th: number) {
  return tile(`base/${env.mood.id}/${tw}x${th}`, tw, th, (c) => {
    const gx = (MAP.gap / 2 / MAP.cw) * tw, gy = (MAP.gap / 2 / MAP.ch) * th;
    const w = tw - 2 * gx, h = th - 2 * gy;
    // far away the cells sink toward the sheet so the beads' lattice carries the grain
    const far = Math.min(1, Math.max(0, (16 - tw) / 10));
    c.fillStyle = mixLab(cellCol(env), env.mood.set, 0.7 * far);
    c.globalAlpha = 0.85;
    c.fillRect(gx, gy, w, h);
    c.globalAlpha = 1;
    if (tw >= 40) {
      // the folded strip: faint row seams, and a tick per slot (its number, as texture)
      c.fillStyle = withAlpha(slotInk(env), 0.18);
      for (let r = 1; r < MAP.sr; r++) c.fillRect(gx, gy + (r * h) / MAP.sr - 0.5, w, Math.max(0.6, h / MAP.sr / 14));
      if (tw >= 110) {
        c.fillStyle = withAlpha(slotInk(env), 0.3);
        const sw = w / MAP.sc, sh = h / MAP.sr;
        for (let r = 0; r < MAP.sr; r++)
          for (let k = 0; k < MAP.sc; k++) {
            const len = 0.42;
            c.fillRect(gx + k * sw + sw * (0.5 - len / 2), gy + r * sh + sh * 0.42, sw * len, Math.max(0.7, sh * 0.16));
          }
      }
    }
  });
}
/** the bead (and the brass plate around it) at slot j of a cell, everything else transparent */
function beadTile(env: PaintEnv, tw: number, th: number, j: number, glow: number) {
  const g = Math.round(glow * 4) / 4;
  return tile(`bead/${env.mood.id}/${tw}x${th}/${j}/${g}`, tw, th, (c) => {
    const gx = (MAP.gap / 2 / MAP.cw) * tw, gy = (MAP.gap / 2 / MAP.ch) * th;
    const sw = (tw - 2 * gx) / MAP.sc, sh = (th - 2 * gy) / MAP.sr;
    const cx = gx + ((j % MAP.sc) + 0.5) * sw, cy = gy + (Math.floor(j / MAP.sc) + 0.5) * sh;
    if (tw >= 60) {
      // the plate: a brass frame round the slot, pierced
      c.strokeStyle = brass(env, 0.2);
      c.lineWidth = Math.max(1, sw * 0.18);
      c.strokeRect(cx - sw * 0.62, cy - sh * 0.62, sw * 1.24, sh * 1.24);
    }
    const r = tw < 16 ? Math.max(0.62, tw * 0.12) : Math.max(0.6, Math.min(sw, sh) * (tw >= 60 ? 0.3 : 0.75));
    const far = Math.min(1, Math.max(0, (24 - tw) / 16));
    c.fillStyle = mixLab(copper(env, 0.4 + 0.6 * g), mixLab(grainCol(env), env.mood.halo, 0.3), far);
    // far away every bead flashes a little as it steps (all at once: the unison is the grain's shimmer)
    c.globalAlpha = far > 0 ? 0.6 + 0.35 * g : 0.95;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();
  });
}

// ---------------------------------------------------------------- the map painter
export interface SearchMapOpts {
  /** the slot every bead stands on (all in unison) */
  slot: number;
  /** 0..1 the hero bead's brightening (named) */
  beadGlow?: number;
  /** 0..1 the beads' step flash (far away, where the slide is sub-pixel) */
  pulse?: number;
  /** 0..1 the step's tween between slot and slot+1 (the bead slides on twos) */
  stepU?: number;
  /** x (L4 world) the one-pass sweep has reached; matches show left of it; undefined = none */
  sweepX?: number;
  /** 0..1 how strongly the matches show (copper) */
  matches?: number;
  /** cache key salt (the shot id) */
  key: string;
  /** 0..1 the whole map's presence */
  alpha?: number;
  /** 0..1 the hero's numbers (fade them out on a far map) */
  heroNumbers?: number;
  /** 0..1 the hero cross-dissolves INTO its own map cell (a generic cell, like its neighbours); default 0 */
  heroDissolve?: number;
  /**
   * the lockstep at map scale: every cell carries a 1-device-px copper tick at the SAME x-offset (phase, in device
   * px; the shot advances it one px per twos tick), so a moiré of identical motion ripples across the whole map
   */
  lockstep?: { phase: number; alpha: number };
}

/** the lockstep tick tile: one 1-px copper tick at x = phase (mod the tile's width) */
function tickTile(env: PaintEnv, tw: number, th: number, phase: number) {
  const x = ((Math.floor(phase) % tw) + tw) % tw;
  return tile(`tick/${env.mood.id}/${tw}x${th}/${x}`, tw, th, (c) => {
    const gy = Math.max(0, Math.floor((MAP.gap / 2 / MAP.ch) * th));
    c.fillStyle = copper(env, 1);
    c.fillRect(x, gy, 1, Math.max(1, th - 2 * gy));
  });
}

/**
 * The map at any zoom: the backlit sheet, every cell (pattern), the hero cell (real numbers), every bead and plate
 * (pattern, or one by one up close), and the copper matches behind the sweep. Draw inside f.layer('L4').
 */
export function drawSearchMap(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, v: MapView, o: SearchMapOpts) {
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const m = c.getTransform();
  const dev = Math.hypot(m.a, m.b) || 1; // device px per world px
  const tl = toW(v, 0, 0);
  const W = MAP.cols * MAP.cw * v.Z, H = MAP.rows * MAP.ch * v.Z;
  const cellPx = MAP.cw * v.Z * dev; // device px per cell
  c.save();
  c.globalAlpha *= A;
  // the backlit sheet behind the cells (a soft margin)
  c.fillStyle = sheetCol(env);
  const pad = Math.max(6, Math.min(40, 0.8 * v.Z));
  c.fillRect(tl.x - pad, tl.y - pad, W + 2 * pad, H + 2 * pad);
  // visible part of the map (world px)
  const inv = m.inverse();
  const p0 = inv.transformPoint(new DOMPoint(0, 0));
  const p1 = inv.transformPoint(new DOMPoint(c.canvas.width, c.canvas.height));
  const vx0 = Math.max(tl.x, p0.x), vy0 = Math.max(tl.y, p0.y);
  const vx1 = Math.min(tl.x + W, p1.x), vy1 = Math.min(tl.y + H, p1.y);
  if (vx1 > vx0 && vy1 > vy0) {
    if (cellPx <= 360) {
      // every cell by pattern (base, then the beads in unison)
      const tw = Math.max(2, Math.round(cellPx)), th = Math.max(2, Math.round((cellPx * MAP.ch) / MAP.cw));
      const sx = (MAP.cw * v.Z) / tw, sy = (MAP.ch * v.Z) / th;
      for (const cv of [baseTile(env, tw, th), beadTile(env, tw, th, o.slot, o.pulse ?? 0)]) {
        const pat = c.createPattern(cv, 'repeat');
        if (!pat) continue;
        pat.setTransform(new DOMMatrix([sx, 0, 0, sy, tl.x, tl.y]));
        c.fillStyle = pat;
        c.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
      }
      if (o.lockstep && o.lockstep.alpha > 0.003 && tw <= 60) {
        const pat = c.createPattern(tickTile(env, tw, th, o.lockstep.phase), 'repeat');
        if (pat) {
          pat.setTransform(new DOMMatrix([sx, 0, 0, sy, tl.x, tl.y]));
          c.save();
          c.globalAlpha *= o.lockstep.alpha;
          c.globalCompositeOperation = 'lighter';
          c.fillStyle = pat;
          c.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
          c.restore();
        }
      }
    } else {
      // up close: the few visible cells one by one (the hero is drawn below)
      const c0 = Math.max(0, Math.floor((vx0 - tl.x) / (MAP.cw * v.Z))), c1 = Math.min(MAP.cols - 1, Math.floor((vx1 - tl.x) / (MAP.cw * v.Z)));
      const r0 = Math.max(0, Math.floor((vy0 - tl.y) / (MAP.ch * v.Z))), r1 = Math.min(MAP.rows - 1, Math.floor((vy1 - tl.y) / (MAP.ch * v.Z)));
      for (let r = r0; r <= r1; r++)
        for (let k = c0; k <= c1; k++) {
          if (k === HERO.col && r === HERO.row && (o.heroDissolve ?? 0) <= 0) continue;
          genericCellDetailed(f, c, env, v, k, r, o.slot);
        }
    }
    // the hero cell, printed with its real numbers (it is always drawn when it is bigger than a few px)
    if (cellPx > 10) heroCell(f, c, env, v, o, o.key);
    // far away the sheet reads as one backlit object: a soft light from behind its centre and a thin brass frame
    const far = Math.min(1, Math.max(0, (40 - cellPx) / 30));
    if (far > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const cx = tl.x + W / 2, cy = tl.y + H / 2;
      c.translate(cx, cy);
      c.scale(W / H, 1);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, H * 0.75);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.16 * far));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-H, -H, 2 * H, 2 * H);
      c.restore();
      c.strokeStyle = withAlpha(brass(env, 0.35), 0.75 * far);
      c.lineWidth = 1.6;
      c.strokeRect(tl.x - 3, tl.y - 3, W + 6, H + 6);
    }
    // the matches, behind the sweep
    if ((o.matches ?? 0) > 0 && o.sweepX !== undefined) matchesLayer(f, c, env, v, o.sweepX, o.matches ?? 0, o.key);
  }
  c.restore();
}

/** one generic cell drawn in detail (up close only): its slot grid baked once at the hero's scale, ticks for numbers */
function genericCellDetailed(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, v: MapView, col: number, row: number, slot: number) {
  const zr = zoomForSlot(HERO_REF);
  const bw = MAP.sc * HERO_REF, bh = MAP.sr * SLOT_H * zr;
  const draw = f.cached(`hw-ch09-cell/${env.mood.id}`, Math.ceil(bw), Math.ceil(bh), (cc) => {
    const sw = HERO_REF, sh = SLOT_H * zr;
    cc.fillStyle = cellCol(env);
    cc.fillRect(0, 0, bw, bh);
    cc.strokeStyle = withAlpha(slotInk(env), 0.22);
    cc.lineWidth = 1;
    cc.fillStyle = withAlpha(slotInk(env), 0.3);
    for (let j = 0; j < 513; j++) {
      const x = (j % MAP.sc) * sw, y = Math.floor(j / MAP.sc) * sh;
      cc.strokeRect(x + 0.5, y + 0.5, sw - 1, sh - 1);
      cc.fillRect(x + sw * 0.29, y + sh * 0.44, sw * 0.42, sh * 0.13);
    }
  });
  const o = cellOrigin(col, row);
  const p = toW(v, o.u, o.v);
  const s = v.Z / zr;
  c.save();
  c.translate(p.x, p.y);
  c.scale(s, s);
  draw(c, 0, 0);
  c.restore();
  const sc = slotCentre(col, row, slot);
  const b = toW(v, sc.u, sc.v);
  const sw = SLOT_W * v.Z;
  c.strokeStyle = withAlpha(brass(env, 0.2), 0.85);
  c.lineWidth = Math.max(1, sw * 0.05);
  c.strokeRect(b.x - sw * 0.67, b.y - SLOT_H * v.Z * 0.75, sw * 1.34, SLOT_H * v.Z * 1.5);
  c.fillStyle = copper(env, 0.4);
  c.beginPath();
  c.arc(b.x, b.y + SLOT_H * v.Z * 0.6, Math.max(1.5, sw * 0.17), 0, Math.PI * 2);
  c.fill();
}

/** the hero cell: document 1's 513 slots with their real numbers (baked once), its bead and plate */
const HERO_REF = 52; // world px per slot in the baked bitmap
function heroCell(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, v: MapView, o: SearchMapOpts, key: string) {
  const zr = zoomForSlot(HERO_REF);
  const s = v.Z / zr;
  const org = cellOrigin(HERO.col, HERO.row);
  const p = toW(v, org.u, org.v);
  const bw = MAP.sc * HERO_REF, bh = MAP.sr * SLOT_H * zr;
  const draw = f.cached(`hw-ch09-hero/${key}/${env.mood.id}`, Math.ceil(bw), Math.ceil(bh), (cc) => {
    const sw = HERO_REF, sh = SLOT_H * zr;
    cc.fillStyle = heroPaper(env);
    cc.fillRect(0, 0, bw, bh);
    textRole(cc, 'subject', () => {
      cc.font = `500 24px ${FONT.mono}`;
      cc.textAlign = 'center';
      cc.textBaseline = 'middle';
      for (let j = 0; j < HERO_SLOTS.length; j++) {
        const x = (j % MAP.sc) * sw, y = Math.floor(j / MAP.sc) * sh;
        // the slot: a paper cell with a hairline border; the length slot (the last) in brass
        cc.strokeStyle = withAlpha(slotInk(env), 0.28);
        cc.lineWidth = 1;
        cc.strokeRect(x + 0.5, y + 0.5, sw - 1, sh - 1);
        if (j === HERO_SLOTS.length - 1) {
          cc.fillStyle = withAlpha(brass(env, 0.3), 0.5);
          cc.fillRect(x + 1, y + 1, sw - 2, sh - 2);
        }
        const n = HERO_SLOTS[j];
        cc.fillStyle = n < 0 ? withAlpha(slotInk(env), 0.38) : slotInk(env);
        cc.fillText(String(n), x + sw / 2, y + sh / 2 + 1);
      }
    });
  });
  const keep = 1 - Math.min(1, Math.max(0, o.heroDissolve ?? 0));
  c.save();
  c.globalAlpha *= keep;
  c.translate(p.x, p.y);
  c.scale(s, s);
  if (keep > 0.003) draw(c, 0, 0);
  c.restore();
  // the numbers are legible text when the slots are big (a baked layer the legibility recorder cannot see)
  const numA = keep * (o.heroNumbers ?? 1) * Math.min(1, Math.max(0, (s - 0.55) / 0.3));
  if (numA > 0.05) textProbe(c, `${key}-hero-row0`, p.x, p.y, MAP.sc * HERO_REF * s, SLOT_H * zr * s, numA);
  // the hero's paper always carries its printed numbers (baked with it)
  if (keep > 0.003) cardProbe(c, `${key}-hero`, p.x, p.y, bw * s, bh * s, keep, keep);
  // the bead and its plate (the hero's own, drawn crisply at any size above a few px)
  const sc = slotCentre(HERO.col, HERO.row, o.slot);
  const nx = slotCentre(HERO.col, HERO.row, Math.min(o.slot + 1, 512));
  const u = o.stepU ?? 0;
  const b0 = toW(v, sc.u, sc.v), b1 = toW(v, nx.u, nx.v);
  const sameRow = Math.floor(o.slot / MAP.sc) === Math.floor((o.slot + 1) / MAP.sc);
  const b = sameRow ? { x: b0.x + (b1.x - b0.x) * u, y: b0.y } : b0;
  const sw = SLOT_W * v.Z, sh = SLOT_H * v.Z;
  const glow = Math.max(0, o.beadGlow ?? 0);
  const g1 = Math.min(1, glow);
  // THE PLATE: a fixed cut-brass stencil standing ABOVE the strip, 1.5 slots wide: a hanging tab, a perforated
  // head, and a cut window over the slot it reads (the number shows through it); the bead rides through the cut's
  // lower lip. Its own warm lantern glow behind it. The same cut every time (the step).
  const pw = sw * 1.5, ph = sh * 2.25;
  const px = b.x - pw / 2, pTop = b.y + sh * 0.62 - ph; // the plate's foot sits just under the slot
  const plateA = Math.max(0.25, keep);
  c.save();
  c.globalAlpha *= plateA;
  if (sw > 6) {
    c.globalCompositeOperation = 'lighter';
    const gx = b.x, gy = pTop + ph * 0.42;
    const gr = pw * 1.25;
    const lg = c.createRadialGradient(gx, gy, 0, gx, gy, gr);
    lg.addColorStop(0, withAlpha(mixLab(brass(env, 0.6), env.mood.halo, 0.3), 0.32));
    lg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = lg;
    c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    c.globalCompositeOperation = 'source-over';
  }
  const plate = new Path2D();
  // the tab it hangs by, and the plate
  plate.rect(b.x - sw * 0.16, pTop - sh * 0.36, sw * 0.32, sh * 0.42);
  plate.roundRect(px, pTop, pw, ph, Math.min(sw, sh) * 0.08);
  // the cut: a window over the slot (rounded corners)
  const cw = sw * 0.98, ch = sh * 0.98;
  plate.roundRect(b.x - cw / 2, b.y - ch / 2, cw, ch, Math.min(sw, sh) * 0.12);
  // perforations: a row of four round holes across the head, and the tab's eye
  for (let i = 0; i < 4; i++) {
    const hx = px + pw * (0.2 + i * 0.2), hy = pTop + sh * 0.3;
    plate.moveTo(hx + sw * 0.055, hy);
    plate.arc(hx, hy, sw * 0.055, 0, Math.PI * 2);
  }
  plate.moveTo(b.x + sw * 0.06, pTop - sh * 0.17);
  plate.arc(b.x, pTop - sh * 0.17, sw * 0.06, 0, Math.PI * 2);
  c.fillStyle = withAlpha(brass(env, 0.12), 0.95);
  c.fill(plate, 'evenodd');
  // the brass catches the light on its top edge and round the cut (a bevel)
  c.strokeStyle = withAlpha(brass(env, 0.75), 0.85);
  c.lineWidth = Math.max(0.6, sw * 0.03);
  c.beginPath();
  c.moveTo(px, pTop);
  c.lineTo(px + pw, pTop);
  c.stroke();
  c.strokeStyle = withAlpha(brass(env, 0.55), 0.8);
  c.beginPath();
  c.roundRect(b.x - cw / 2, b.y - ch / 2, cw, ch, Math.min(sw, sh) * 0.12);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(brass(env, 0), PUPPET_NEAR_BLACK, 0.5), 0.6);
  c.beginPath();
  c.moveTo(px, pTop + ph);
  c.lineTo(px + pw, pTop + ph);
  c.stroke();
  c.restore();
  // the bead rides through the cut, on its lower lip, under the number it reads
  const br = Math.max(1.5, sw * 0.15);
  const by = b.y + ch / 2 - br * 0.2;
  c.save();
  if (glow > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const R = br * (5 + 2.4 * glow);
    const g = c.createRadialGradient(b.x, by, 0, b.x, by, R);
    g.addColorStop(0, withAlpha(copper(env, 1), Math.min(0.95, 0.4 * glow)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(b.x - R, by - R, R * 2, R * 2);
    c.globalCompositeOperation = 'source-over';
  }
  c.fillStyle = copper(env, 0.35 + 0.65 * g1);
  c.beginPath();
  c.arc(b.x, by, br * (1 + 0.15 * Math.min(2.5, glow)), 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the copper match marks (baked at the map's resting zoom), revealed left of the sweep */
function matchesLayer(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, v: MapView, sweepX: number, a: number, key: string) {
  const tl = toW(v, 0, 0);
  const W = MAP.cols * MAP.cw * v.Z, H = MAP.rows * MAP.ch * v.Z;
  const Zk = Math.round(v.Z * 100) / 100;
  const draw = f.cached(`hw-ch09-matches/${key}/${env.mood.id}/${Zk}`, Math.ceil(W) + 8, Math.ceil(H) + 8, (cc) => {
    const r = Math.max(1.15, MAP.ch * Zk * 0.72); // larger than its cell (as the real page draws them)
    cc.fillStyle = copper(env, 0.8);
    cc.beginPath();
    for (let i = 0; i < DOCS; i++) {
      if (!isMatch(i)) continue;
      const col = i % MAP.cols, row = Math.floor(i / MAP.cols);
      const x = 4 + (col + 0.5) * MAP.cw * Zk, y = 4 + (row + 0.5) * MAP.ch * Zk;
      cc.moveTo(x + r, y);
      cc.arc(x, y, r, 0, Math.PI * 2);
    }
    cc.fill();
  });
  c.save();
  c.beginPath();
  c.rect(tl.x - 8, tl.y - 8, Math.max(0, sweepX - tl.x + 8), H + 16);
  c.clip();
  c.globalAlpha *= a;
  draw(c, tl.x - 4, tl.y - 4);
  c.restore();
}

// ---------------------------------------------------------------- the furnace (from ch05-s06), relit
/** the kiln's placement in L3 (rest px): base centre and scale */
export const KILN_L3 = { x: 150, y: 668, s: 0.78 };
/** the mouth centre (L3 rest px) */
export const kilnMouth = (k = KILN_L3) => ({ x: k.x, y: k.y - 68 * k.s });
/**
 * The cold furnace from ch05-s06 (a squat domed brick kiln on a plinth, an arched mouth, a chimney at its right
 * shoulder), drawn at L3. heat 0..1 lights its grate serverCyan from inside.
 */
export function kiln(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, heat: number, t: number, k = KILN_L3) {
  const s = k.s;
  const X = (x: number) => k.x + x * s, Y = (y: number) => k.y + y * s;
  // geometry relative to the base centre (ch05-s06's proportions)
  const x0 = -135, x1 = 135, crown = -222, shoulder = -155, base = 0;
  const mhw = 62, spring = -100, rise = 50, sill = -38;
  // the inside: dark, then the cool grate light (only shows through the mouth and vents)
  c.save();
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.3);
  c.fillRect(X(-mhw), Y(spring - rise), mhw * 2 * s, (sill - spring + rise) * s);
  if (heat > 0.005) {
    const g = c.createRadialGradient(X(0), Y(sill - 8), 0, X(0), Y(sill - 8), 120 * s);
    g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.25), 0.95 * heat));
    g.addColorStop(0.45, withAlpha(env.mood.halo, 0.7 * heat));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(X(-mhw), Y(spring - rise), mhw * 2 * s, (sill - spring + rise) * s);
    // the grate bars catching the light
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9);
    for (let i = -2; i <= 2; i++) c.fillRect(X(i * 22 - 3), Y(sill - 34), 6 * s, 34 * s);
  }
  c.restore();
  f.cached(`hw-ch09-kiln/${env.mood.id}/${s}`, Math.ceil(330 * s), Math.ceil(560 * s), (cc) => {
    cc.translate(165 * s, 520 * s);
    cc.scale(s, s);
    const ink = mixLab(PUPPET_NEAR_BLACK, env.fill('ink'), 0.5);
    const p = new Path2D();
    p.moveTo(x0, base);
    p.lineTo(x0, shoulder);
    p.bezierCurveTo(x0, -198, -52, crown, 0, crown);
    p.bezierCurveTo(52, crown, x1, -198, x1, shoulder);
    p.lineTo(x1, base);
    p.closePath();
    // the mouth (a hole)
    p.moveTo(-mhw, sill);
    p.lineTo(-mhw, spring);
    p.ellipse(0, spring, mhw, rise, 0, Math.PI, 0);
    p.lineTo(mhw, sill);
    p.closePath();
    // crown vents
    for (const vx of [-70, -35, 0, 35, 70]) {
      const vy = -194 + Math.abs(vx) * 0.22;
      p.moveTo(vx + 4.5, vy);
      p.arc(vx, vy, 4.5, 0, Math.PI * 2);
    }
    cc.fillStyle = ink;
    cc.fill(p, 'evenodd');
    cc.beginPath();
    cc.rect(-155, 0, 310, 40);
    cc.rect(-161, -6, 322, 8);
    cc.rect(140, -520, 40, 420);
    cc.rect(133, -196, 54, 14);
    cc.rect(136, -360, 48, 8);
    cc.fill();
    // brick courses, faint; the crown's rim
    cc.save();
    cc.clip(p, 'evenodd');
    cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
    cc.lineWidth = 1;
    cc.beginPath();
    for (let y = -176, r = 0; y < 0; y += 19, r++) {
      cc.moveTo(x0, y);
      cc.lineTo(x1, y);
      for (let x = x0 + (r % 2 ? 18 : 0); x < x1; x += 36) {
        cc.moveTo(x, y);
        cc.lineTo(x, y + 19);
      }
    }
    cc.stroke();
    cc.restore();
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.5);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(x0, shoulder);
    cc.bezierCurveTo(x0, -198, -52, crown, 0, crown);
    cc.bezierCurveTo(52, crown, x1, -198, x1, shoulder);
    cc.stroke();
  })(c, k.x - 165 * s, k.y - 520 * s);
  void t;
}

// ---------------------------------------------------------------- the pattern field
/**
 * A small paper input field (the search page's pattern box) with typed text; `shown` characters of `text` typed so
 * far, a caret blinking on twos while typing. Draw in L4 (world px; centre x, y).
 */
export function patternField(c: CanvasRenderingContext2D, env: PaintEnv, o: { x: number; y: number; w: number; text: string; shown: number; alpha: number; size: number; t: number; key: string; caret?: boolean }) {
  if (o.alpha <= 0.003) return;
  const h = o.size * 1.9;
  c.save();
  c.globalAlpha *= o.alpha;
  c.fillStyle = withAlpha(env.mood.ink, 0.5);
  c.fillRect(o.x - o.w / 2 + 3, o.y - h / 2 + 4, o.w, h);
  c.fillStyle = mixLab('#edf2ee', env.mood.core, 0.2);
  c.fillRect(o.x - o.w / 2, o.y - h / 2, o.w, h);
  c.strokeStyle = withAlpha(brass(env, 0.3), 0.9);
  c.lineWidth = 1.5;
  c.strokeRect(o.x - o.w / 2, o.y - h / 2, o.w, h);
  const s = o.text.slice(0, Math.max(0, Math.floor(o.shown)));
  textRole(c, 'subject', () => {
    c.font = `500 ${o.size}px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillStyle = slotInk(env);
    const x = o.x - o.w / 2 + o.size * 0.7;
    c.fillText(s, x, o.y + 1);
    if (o.caret !== false && Math.floor(o.t * 2.4) % 2 === 0) {
      const cw = c.measureText(s).width;
      c.fillRect(x + cw + 2, o.y - o.size * 0.55, 2, o.size * 1.1);
    }
    textProbe(c, `${o.key}-field`, o.x - o.w / 2, o.y - h / 2, o.w, h, o.alpha);
  });
  c.restore();
}

// ---------------------------------------------------------------- the search hall (shared back wall)
/** L2: the search hall's tall window wall (flat-headed panes the cyan backlight shows through), rest px of L2 */
export function searchHallWall(c: CanvasRenderingContext2D, env: PaintEnv) {
  windowWall(c, {
    x: -260, y: -100, w: 1800, h: 900, centers: [-120, 200, 520, 840, 1160, 1480], winW: 200, apex: 30, sill: 560,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 8 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 50, wainscot: 0, glass: 0.4, seed: 93,
  }, env);
  c.fillStyle = env.fill('set');
  c.fillRect(-260, 690, 1800, 210);
}
