/**
 * neural-net-history — helpers shared by the ch09 study shots (ch09-s03a, ch09-s03's closing hold, ch09-s04,
 * ch09-s05): camera framing on a world point, the Coulom slip in W5 (its DUE 2024 glint), the Go candle on the
 * shelf (lit 2014, snuffed 2016), the lamp's pool on the Wall, and the paper-grain push.
 *
 *   frameOn(p, s, k)            a camera at L4 scale k that puts world point p at screen point s
 *   kOf(cam) / kz(k)            L4 scale ↔ camera z
 *   W5C / W5S                   the Coulom slip's centre (L4 world) and size
 *   coulomSlip(c, env, o)       the W5 slip (shared painter) plus its due-date glint
 *   GO / goView(state)          the Go candle: shelf x, base y, flame point; its view lit / snuffed (tag 2014–2016)
 *   wallPool(f, cam, p, r, k)   the lamp's warm pool on the Wall, the rest a stop darker (screen space)
 *   paperGrain(f, u, seed)      the slip's paper fibres filling the frame as the camera pushes into it
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { STUDY, candleX } from './study';
import { WALL_SLOTS, drawSlip, slotLight } from './wallOfForecasts';
import { shelfStateAt, wallStateAt, type CandleView } from './studyState';
import { candleFlame } from './beliefCandle';

export type Pt = { x: number; y: number };
export const kz = (k: number) => 1000 - 1000 / k;
export const kOf = (c: Camera3) => 1000 / (1000 - c.z);
export const frameOn = (p: Pt, s: Pt, k: number): Camera3 => ({ x: p.x + (640 - s.x) / k, y: p.y + (360 - s.y) / k, z: kz(k), lens: 1 });
/** log-scale interpolation between two framings */
export function mixFrame(a: Camera3, b: Camera3, u: number): Camera3 {
  const ka = kOf(a), kb = kOf(b);
  const k = Math.exp(Math.log(ka) + (Math.log(kb) - Math.log(ka)) * u);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: kz(k), lens: 1 };
}

// ------------------------------------------------------------------------------------------------ the W5 slip
const WK = STUDY.wall.k;
const W5 = WALL_SLOTS.W5;
export const W5C: Pt = { x: STUDY.wall.x + W5.x * WK, y: STUDY.wall.y + W5.y * WK };
export const W5S = { w: W5.w * WK, h: W5.h * WK };
const W5V = wallStateAt('ch09-s03a', 'end').find((s) => s.slot === 'W5')!;
/** the slip's DUE line (world), lower right */
export const W5DUE: Pt = { x: W5C.x + W5S.w / 2 - 26 * WK, y: W5C.y + W5S.h / 2 - 9 * WK };
/** a blank patch of the slip's paper (lower left), where the push goes into the grain */
export const W5GRAIN: Pt = { x: W5C.x - W5S.w * 0.3, y: W5C.y + W5S.h * 0.3 };

export interface CoulomOpts {
  light?: number;
  /** the pin glints (0..1) */
  pinGlint?: number;
  /** the typed DUE 2024 catches the lamp (0..1) */
  dueGlint?: number;
  /** a warm specular sweep across the typed DUE 2024: the band's position 0..1 (outside = no sweep) */
  dueSweep?: number;
}
export function coulomSlip(c: CanvasRenderingContext2D, env: PaintEnv, o: CoulomOpts = {}) {
  const light = o.light ?? slotLight('W5');
  drawSlip(c, W5V, { x: W5C.x, y: W5C.y, k: WK, light, glint: o.pinGlint ?? 0 }, env);
  const g = o.dueGlint ?? 0;
  if (g > 0.01) {
    const seedRot = hash1(4, 23) * 0.04;
    c.save();
    c.translate(W5C.x, W5C.y);
    c.rotate(seedRot);
    c.translate(-W5C.x, -W5C.y);
    c.globalCompositeOperation = 'lighter';
    const R = 40;
    const gr = c.createRadialGradient(W5DUE.x, W5DUE.y - 3, 0, W5DUE.x, W5DUE.y - 3, R);
    gr.addColorStop(0, withAlpha(env.mood.halo, 0.32 * g));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(W5DUE.x - R, W5DUE.y - R, 2 * R, 2 * R);
    c.globalCompositeOperation = 'source-over';
    // the typed digits themselves pick up the light (struck again in the lamp's colour)
    c.font = `400 ${8 * WK}px ${FONT.typewriter}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle'; // exactly as drawSlip types it, so the lit glyphs sit on the printed ones
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.7 * g);
    const tx = W5C.x + W5S.w / 2 - 7 * WK, ty = W5C.y + W5S.h / 2 - 8 * WK;
    c.fillText('DUE 2024', tx, ty);
    // the specular sweep: a bright warm band travels across the glyphs (they flare ≈ +40%, then settle)
    const sw = o.dueSweep ?? -1;
    if (sw > -0.2 && sw < 1.2) {
      const tw = c.measureText('DUE 2024').width;
      const x0 = tx - tw, bx = x0 - 10 * WK + (tw + 20 * WK) * sw;
      const band = c.createLinearGradient(bx - 9 * WK, 0, bx + 9 * WK, 0);
      band.addColorStop(0, withAlpha(env.mood.core, 0));
      band.addColorStop(0.5, withAlpha(mixLab(env.mood.core, '#fff6dc', 0.5), 0.95));
      band.addColorStop(1, withAlpha(env.mood.core, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = band;
      c.fillText('DUE 2024', tx, ty);
      c.fillText('DUE 2024', tx, ty);
      const hg = c.createRadialGradient(bx, ty - 3 * WK, 0, bx, ty - 3 * WK, 14 * WK);
      hg.addColorStop(0, withAlpha(env.mood.halo, 0.35));
      hg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = hg;
      c.fillRect(bx - 14 * WK, ty - 17 * WK, 28 * WK, 28 * WK);
    }
    c.restore();
  }
}

// ------------------------------------------------------------------------------------------------ the Go candle
const VIEWS = shelfStateAt('ch09-s03a', 'end');
const GO_LIT = VIEWS.find((v) => v.id === 'go')!;
export const GO = (() => {
  const x = candleX(VIEWS, 'go');
  const y = STUDY.shelf.y;
  return { x, y, flame: candleFlame({ x, y, view: GO_LIT, s: STUDY.shelf.s }) };
})();
/** the Go candle's view: 'lit' (2014, flame on the top ring), 'out' (snuffed 2016: sleeve two rings, tag 2014–2016) */
export function goView(state: 'lit' | 'out'): CandleView {
  if (state === 'lit') return { ...GO_LIT, state: 'live', rings: 0, smoke: false };
  return { ...GO_LIT, state: 'out', rings: 2, smoke: true, tag: '2014–2016' };
}

// ------------------------------------------------------------------------------------------------ light + grain
/** the lamp's pool centred on world point p (radius r screen px), the rest of the Wall about a stop darker */
export function wallPool(f: Frame, cam: Camera3, p: Pt, r = 380, k = 1, dark = 1) {
  const s = toScreen(LAYERS.L4, cam, p.x, p.y);
  const c = f.c;
  const m = f.mood;
  c.save();
  const g = c.createRadialGradient(s.x, s.y, r * 0.6, s.x, s.y, r * 2.4);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.45, withAlpha(m.fg, 0.36 * dark));
  g.addColorStop(1, withAlpha(m.fg, 0.64 * dark));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  c.globalCompositeOperation = 'lighter';
  const w = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
  w.addColorStop(0, withAlpha(m.halo, 0.13 * k));
  w.addColorStop(0.6, withAlpha(m.halo, 0.06 * k));
  w.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = w;
  c.fillRect(s.x - r, s.y - r, 2 * r, 2 * r);
  c.restore();
}

/** paper fibres in screen space, growing with the push (u 0..1): the frame becomes the slip's grain */
export function paperGrain(f: Frame, u: number, paper: string, seed = 7) {
  if (u <= 0.002) return;
  const c = f.c;
  const m = f.mood;
  c.save();
  c.globalAlpha = Math.min(1, u * 1.2);
  // a warm paper field, lit from the lamp side (left)
  const g = c.createLinearGradient(0, 0, 1280, 720);
  g.addColorStop(0, mixLab(paper, m.core, 0.12));
  g.addColorStop(1, mixLab(paper, m.set, 0.18));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // the fibres: long soft strokes, a few darker flecks
  c.lineCap = 'round';
  for (let i = 0; i < 140; i++) {
    const x = hash1(i, seed) * 0.5 + 0.5;
    const y = hash1(i, seed + 1) * 0.5 + 0.5;
    const a = (hash1(i, seed + 2) - 0.5) * 0.9;
    const L = 40 + 160 * (hash1(i, seed + 3) * 0.5 + 0.5);
    c.strokeStyle = withAlpha(i % 5 === 0 ? mixLab(paper, m.set, 0.5) : mixLab(paper, m.core, 0.35), 0.18 + 0.12 * (hash1(i, seed + 4) * 0.5 + 0.5));
    c.lineWidth = 0.8 + 1.6 * (hash1(i, seed + 5) * 0.5 + 0.5);
    c.beginPath();
    const X = x * 1400 - 60, Y = y * 820 - 50;
    c.moveTo(X, Y);
    c.quadraticCurveTo(X + Math.cos(a) * L * 0.5, Y + Math.sin(a) * L * 0.5 + 6, X + Math.cos(a) * L, Y + Math.sin(a) * L);
    c.stroke();
  }
  c.restore();
}
