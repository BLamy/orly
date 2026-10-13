/**
 * neural-net-history — SHARED FOREGROUND OCCLUDERS and cut-paper FILIGREE (review round 1, art: "add a shared
 * foreground occluder layer (drapery, chair backs, fretwork, mullions) and cut-paper filigree to the recurring
 * sets (study, Case Board, candle shelf, jetty)"; "at least 3 depth planes with parallax on every camera move").
 * Paper-cut shapes in env.fill('fg') / 'ink', pierced with holes (evenodd), drawn on a NEAR plane (L5 or L6) so
 * they slide across the frame faster than the action plane when the camera moves.
 *
 *   drapery(c, { x, top, bottom, w, side, folds?, tieback?, seed? }, env)   a heavy curtain edge with a tie-back
 *        and a tasselled hem; side: 'left' | 'right' = which frame edge it hangs at (the fall bellies inward)
 *   chairBack(c, { x, y, s?, kind? }, env)     a wing-chair / spindle chair back seen from behind (y = seat rail)
 *   fretwork(c, { x, y, w, h, pitch? }, env)   a pierced lattice panel (top-left x,y)
 *   mullions(c, { x, y, w, h, cols?, rows?, bar? }, env)   a near window frame: bars only (the panes are holes)
 *   valance(c, { x0, x1, y, depth? }, env)     a scalloped pelmet with fringe across the top of frame
 *   filigreeCorner(c, { x, y, size, rot }, env)   a pierced cut-paper corner (scroll + rosette), for frames
 *   railing(c, { x0, x1, y, h, pitch? }, env)   a pierced fretwork rail (jetties, landings): base y, up is -y
 *   nearOccluders(f, { key, cams, kit }, …)    the study's standard near plane: left drape + valance + chair back
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { withAlpha, mixLab } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { addCircle, addFoil, at, memoPath, rosette, scallopEdge, scroll, tasselFringe } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;

export function drapery(c: C, o: { x: number; top: number; bottom: number; w: number; side: 'left' | 'right'; folds?: number; tieback?: number; seed?: number }, env: PaintEnv): void {
  const dir = o.side === 'left' ? 1 : -1; // inward
  const n = o.folds ?? 5;
  const seed = o.seed ?? 7;
  const tb = o.tieback ?? o.top + (o.bottom - o.top) * 0.58;
  const p = new Path2D();
  // outer edge at x (the frame edge), inner edge scalloped: falls straight, gathered at the tie-back, then flares
  const inner = (y: number) => {
    const u = (y - o.top) / (o.bottom - o.top);
    const pinch = Math.exp(-(((y - tb) / ((o.bottom - o.top) * 0.08)) ** 2));
    const flare = y > tb ? Math.min(1, (y - tb) / ((o.bottom - tb) * 0.8)) * 0.55 : 0;
    return o.w * (0.9 + 0.12 * Math.sin(u * 9 + seed) - 0.55 * pinch + flare);
  };
  p.moveTo(o.x - dir * 40, o.top);
  for (let y = o.top; y <= o.bottom; y += 6) p.lineTo(o.x + dir * inner(y), y);
  p.lineTo(o.x - dir * 40, o.bottom);
  p.closePath();
  c.fillStyle = env.fill('fg');
  c.fill(p);
  // fold cut-lines: rim-catching creases that follow the gather
  c.save();
  c.clip(p);
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.4;
  for (let i = 1; i < n; i++) {
    c.beginPath();
    for (let y = o.top; y <= o.bottom; y += 8) {
      const xx = o.x + dir * inner(y) * (i / n) * (0.85 + 0.1 * Math.sin(y * 0.01 + i * 1.7 + hash1(i, seed) * 3));
      if (y === o.top) c.moveTo(xx, y);
      else c.lineTo(xx, y);
    }
    c.stroke();
  }
  c.restore();
  // the tie-back: a cord and a tassel
  const tx = o.x + dir * inner(tb) * 0.92;
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.ellipse(tx, tb, 9, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(tx - 3, tb + 10, 6, 18);
  const tas = memoPath('drape-tassel', () => tasselFringe({ w: 26, pitch: 4, len: 30, band: 5 }));
  c.save();
  c.translate(tx - 13, tb + 26);
  c.fill(tas);
  c.restore();
  // hem fringe along the bottom of the fall
  const hem = memoPath(`drape-hem-${Math.round(o.w)}`, () => tasselFringe({ w: o.w * 1.3, pitch: 7, len: 16, band: 4 }));
  c.save();
  c.translate(o.side === 'left' ? o.x - 40 : o.x - o.w * 1.3 + 40, o.bottom - 4);
  c.fill(hem);
  c.restore();
}

export function chairBack(c: C, o: { x: number; y: number; s?: number; kind?: 'wing' | 'spindle' }, env: PaintEnv): void {
  const s = o.s ?? 1;
  const p = new Path2D();
  if ((o.kind ?? 'wing') === 'wing') {
    // a wing chair seen from behind: rounded crest, flared wings, a pierced button-tufted back is a solid here
    p.moveTo(o.x - 92 * s, o.y);
    p.lineTo(o.x - 98 * s, o.y - 120 * s);
    p.quadraticCurveTo(o.x - 110 * s, o.y - 190 * s, o.x - 70 * s, o.y - 214 * s);
    p.quadraticCurveTo(o.x, o.y - 246 * s, o.x + 70 * s, o.y - 214 * s);
    p.quadraticCurveTo(o.x + 110 * s, o.y - 190 * s, o.x + 98 * s, o.y - 120 * s);
    p.lineTo(o.x + 92 * s, o.y);
    p.closePath();
  } else {
    // spindle back: two stiles, a crest rail and pierced spindles (holes)
    p.rect(o.x - 70 * s, o.y - 200 * s, 14 * s, 200 * s);
    p.rect(o.x + 56 * s, o.y - 200 * s, 14 * s, 200 * s);
    p.rect(o.x - 70 * s, o.y - 214 * s, 140 * s, 22 * s);
    for (let i = 0; i < 5; i++) p.rect(o.x - 46 * s + i * 22 * s, o.y - 192 * s, 6 * s, 150 * s);
    p.rect(o.x - 70 * s, o.y - 44 * s, 140 * s, 12 * s);
  }
  c.fillStyle = env.fill('fg');
  c.fill(p);
  // rim on the crest (the lamp behind)
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(o.x - 70 * s, o.y - 214 * s);
  c.quadraticCurveTo(o.x, o.y - 246 * s, o.x + 70 * s, o.y - 214 * s);
  c.stroke();
}

export function fretwork(c: C, o: { x: number; y: number; w: number; h: number; pitch?: number }, env: PaintEnv): void {
  const pitch = o.pitch ?? 26;
  const key = `fret-${Math.round(o.w)}x${Math.round(o.h)}-${pitch}`;
  const p = memoPath(key, () => {
    const q = new Path2D();
    q.rect(0, 0, o.w, o.h);
    // pierced quatrefoils on a square lattice (holes, counter-wound)
    for (let yy = pitch / 2 + 4; yy < o.h - 4; yy += pitch)
      for (let xx = pitch / 2 + 4; xx < o.w - 4; xx += pitch) addFoil(q, xx, yy, pitch * 0.36, 4, { rot: Math.PI / 4, ccw: true });
    return q;
  });
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = env.fill('fg');
  c.fill(p, 'evenodd');
  c.restore();
}

export function mullions(c: C, o: { x: number; y: number; w: number; h: number; cols?: number; rows?: number; bar?: number }, env: PaintEnv): void {
  const cols = o.cols ?? 3;
  const rows = o.rows ?? 4;
  const bar = o.bar ?? 10;
  const p = new Path2D();
  p.rect(o.x, o.y, o.w, o.h);
  const pw = (o.w - bar * (cols + 1)) / cols;
  const ph = (o.h - bar * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const x = o.x + bar + k * (pw + bar);
      const y = o.y + bar + r * (ph + bar);
      p.moveTo(x, y);
      p.lineTo(x, y + ph);
      p.lineTo(x + pw, y + ph);
      p.lineTo(x + pw, y);
      p.closePath();
    }
  c.fillStyle = env.fill('fg');
  c.fill(p, 'evenodd');
}

export function valance(c: C, o: { x0: number; x1: number; y: number; depth?: number }, env: PaintEnv): void {
  const d = o.depth ?? 26;
  const w = o.x1 - o.x0;
  const band = memoPath(`valance-${Math.round(w)}-${d}`, () => scallopEdge({ w, h: d, pitch: 46, depth: d * 0.55, eyelets: true }));
  c.save();
  c.translate(o.x0, o.y);
  c.fillStyle = env.fill('fg');
  c.fillRect(0, -400, w, 400);
  c.fill(band, 'evenodd');
  const fr = memoPath(`valance-fringe-${Math.round(w)}`, () => tasselFringe({ w, pitch: 9, len: 12, band: 3 }));
  c.translate(0, d - 2);
  c.globalAlpha *= 0.9;
  c.fill(fr);
  c.restore();
}

export function filigreeCorner(c: C, o: { x: number; y: number; size: number; rot: number }, env: PaintEnv, role: 'ink' | 'fg' = 'ink'): void {
  const p = memoPath('filigree-corner', () => {
    const q = new Path2D();
    at(q, scroll({ w: 80, h: 26, kind: 'S', thick: 4 }), 6, 10);
    at(q, scroll({ w: 80, h: 26, kind: 'S', thick: 4 }), 10, 6, 1, 1, Math.PI / 2);
    at(q, rosette(13, 8), 14, 14);
    addCircle(q, 14, 14, 3.5, true);
    return q;
  });
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot);
  c.scale(o.size / 90, o.size / 90);
  c.fillStyle = env.fill(role);
  c.fill(p, 'evenodd');
  c.restore();
}

export function railing(c: C, o: { x0: number; x1: number; y: number; h: number; pitch?: number }, env: PaintEnv): void {
  const w = o.x1 - o.x0;
  const pitch = o.pitch ?? 34;
  const p = memoPath(`rail-${Math.round(w)}x${Math.round(o.h)}-${pitch}`, () => {
    const q = new Path2D();
    q.rect(0, -o.h, w, 8); // top rail
    q.rect(0, -10, w, 10); // bottom rail
    for (let x = 0; x <= w; x += pitch * 4) q.rect(x, -o.h - 10, 10, o.h + 10); // posts
    // pierced diamond fret between the rails
    for (let x = pitch / 2; x < w; x += pitch) {
      const cy = -o.h / 2 - 1;
      q.moveTo(x, cy - o.h * 0.36);
      q.lineTo(x + pitch * 0.45, cy);
      q.lineTo(x, cy + o.h * 0.36);
      q.lineTo(x - pitch * 0.45, cy);
      q.closePath();
    }
    return q;
  });
  c.save();
  c.translate(o.x0, o.y);
  c.fillStyle = env.fill('fg');
  c.fill(p);
  c.strokeStyle = withAlpha(env.mood.rim, 0.28);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, -o.h);
  c.lineTo(w, -o.h);
  c.stroke();
  c.restore();
}

/**
 * The study's standard near plane (L6, strong parallax, soft): the heavy drape at the far left of the room, the
 * pelmet along the top of the board wall, and the back of the detective's wing chair on the lamp side. Placed
 * at the room's edges so no study camera loses the board, the shelf or the Wall behind them; on any camera move
 * they slide faster than the board (a third plane in front of L4 and the room).
 */
export function studyNearOccluders(f: Frame, o: { key: string; cams: Camera3[]; chair?: boolean; drape?: boolean; valance?: boolean }): void {
  f.layer('L6', (c, env) => {
    const r = overscan(LAYERS.L6, o.cams, 60);
    const key = `${o.key}/study/L6occ/${env.mood.id}/${o.chair !== false ? 1 : 0}${o.drape !== false ? 1 : 0}${o.valance !== false ? 1 : 0}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
    f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      if (o.drape !== false) drapery(cc, { x: -60, top: r.y - 20, bottom: 1240, w: 150, side: 'left', folds: 6, seed: 3 }, env);
      if (o.valance !== false) valance(cc, { x0: r.x - 20, x1: r.x + r.w + 20, y: -20, depth: 30 }, env);
      if (o.chair !== false) chairBack(cc, { x: 2280, y: 1330, s: 1.35, kind: 'wing' }, env);
    })(c, r.x, r.y);
  });
}

/** a softened copy of an ink colour for distant filigree (keeps the value hierarchy: filigree never darker than figures) */
export const filigreeInk = (env: PaintEnv) => mixLab(env.fill('ink'), env.mood.set, 0.15);
