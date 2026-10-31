/**
 * handwired-explained — ch08-s04 / ch08-s05: the reassessment's plates, in COLD GREY LIGHT (winterBlue).
 * A deckled parchment sheet pinned in a tall-windowed room before dawn: the windows behind it a pale cold grey, no lamp,
 * the sheet lit by the grey window light (its warm parchment pulled toward the mood's cool core). The ink sits on its
 * own sharp layer at the sheet's depth (PLATE_INK); a soft bench edge crosses the foot of frame (L5).
 *
 *   plateRoom(f, { key })          backlight, L2 window wall, fog, L3 sheet (cached), cool window pool
 *   plateNear(f, key)              L5 bench edge (soft)
 *   pInk(c, text, x, y, o)         plate lettering, legible (legibleSize) and probed for the ghost-text audit
 *   PLATE_CAM                      the plate's rest framing: the sheet fills the frame, the bench edge low
 *
 * Plate coordinates are the sheet layer's rest-screen px (at PLATE_CAM the sheet spans ~ x 130-1150, y 30-680).
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

export const SHEET = { cx: 640, cy: 352, w: 1040, h: 660 } as const;
/** sharp ink at the sheet's depth */
export const PLATE_INK: LayerSpec = { id: 'ch08plateInk', z: LAYERS.L3.z, haze: 0.02, blur: 0 };
/** the plate's rest framing */
export const PLATE_CAM: Camera3 = { x: 640, y: 366, z: -60, lens: 1 };
export const P_INK = '#1f1a17';
export const P_COPPER = '#8a4421';
export const P_BRASS = '#a8823e';

export function plateRoom(f: Frame, o: { key: string; paper?: number }) {
  f.backlight({ sunX: 640, sunY: 280, intensity: 0.95 });
  f.layer('L2', (c, env) => {
    f.cached(`ch08plate/L2/${env.mood.id}`, 2900, 1500, (cc) => {
      cc.translate(800, 380);
      wall(cc, env);
    })(c, -800, -380);
  });
  f.fog({ yCenter: 440, height: 320, alpha: 0.14, drift: 5 });
  const p = clamp01(o.paper ?? 1);
  if (p > 0.001) {
    f.layer('L3', (c, env) => {
      const draw = f.cached(`ch08plate/L3/${env.mood.id}`, SHEET.w + 40, SHEET.h + 40, (cc) => {
        cc.translate(-(SHEET.cx - SHEET.w / 2 - 20), -(SHEET.cy - SHEET.h / 2 - 20));
        sheet(cc, env);
      });
      c.save();
      c.globalAlpha = p;
      draw(c, SHEET.cx - SHEET.w / 2 - 20, SHEET.cy - SHEET.h / 2 - 20);
      c.restore();
    });
  }
}

/** the wall: tall flat-headed windows either side of the sheet (cold grey glass), the wall below in shadow */
function wall(c: C, env: PaintEnv) {
  windowWall(c, {
    x: -800, y: -380, w: 2900, h: 1500, centers: [-760, -60, 640, 1340, 2040], winW: 380, apex: -40, sill: 640,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 9 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
    cornice: 40, wainscot: 0, glass: 0.4, seed: 848,
  }, env);
  // pale grey dawn in the glass (behind the sheet's edges): a cool wash, frost at the sills
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(-800, 640, 2900, 480);
}

/** the plate: a deckled parchment sheet in cool light, fibres, a faint drafting grid, two brass pins */
function sheet(c: C, env: PaintEnv) {
  c.save();
  c.translate(SHEET.cx, SHEET.cy);
  c.rotate(0.003);
  const W = SHEET.w, H = SHEET.h;
  const edge = (n: number, seed: number) => 2.2 * hash1(n, seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) pts.push([-W / 2 + (W * i) / 60, -H / 2 + edge(i, 131)]);
  for (let i = 0; i <= 40; i++) pts.push([W / 2 + edge(i, 135), -H / 2 + (H * i) / 40]);
  for (let i = 60; i >= 0; i--) pts.push([-W / 2 + (W * i) / 60, H / 2 + edge(i, 137)]);
  for (let i = 40; i >= 0; i--) pts.push([-W / 2 + edge(i, 139), -H / 2 + (H * i) / 40]);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.save();
  c.translate(5, 7);
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), 0.4);
  c.fill();
  c.restore();
  // the lower right corner curls off the wall: a deeper shadow under it
  // (kept inside the cached margin: it may reach at most 20 px past the sheet's edge)
  const cs = c.createRadialGradient(W / 2 - 14, H / 2 - 12, 2, W / 2 - 14, H / 2 - 12, 30);
  cs.addColorStop(0, withAlpha(mixLab(env.mood.set, env.mood.ink, 0.6), 0.4));
  cs.addColorStop(1, withAlpha(mixLab(env.mood.set, env.mood.ink, 0.6), 0));
  c.fillStyle = cs;
  c.fillRect(W / 2 - 46, H / 2 - 44, 64, 64);
  // cold grey light: the parchment's warmth pulled toward the mood's pale core
  const g = c.createRadialGradient(0, -200, 30, 0, -100, 820);
  g.addColorStop(0, mixLab('#f3ecdd', env.mood.core, 0.42));
  g.addColorStop(0.45, mixLab('#e4dac4', env.mood.sky[2], 0.22));
  g.addColorStop(0.8, mixLab('#cbbd9e', env.mood.set, 0.32));
  g.addColorStop(1, mixLab('#a9997c', env.mood.set, 0.5));
  c.fillStyle = g;
  c.fill();
  c.clip();
  const pool = c.createRadialGradient(0, -160, 40, 0, -120, 760);
  pool.addColorStop(0, withAlpha('#f4f7f8', 0.16));
  pool.addColorStop(0.3, withAlpha('#f4f7f8', 0));
  pool.addColorStop(0.6, withAlpha('#2e3238', 0.1));
  pool.addColorStop(0.9, withAlpha('#2e3238', 0.3));
  pool.addColorStop(1, withAlpha('#2e3238', 0.42));
  c.fillStyle = pool;
  c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
  for (let i = 0; i < 420; i++) {
    const x = hash1(i, 141) * 0.5 * W;
    const y = hash1(i, 143) * 0.5 * H;
    const a = hash1(i, 147) * Math.PI;
    const l = 4 + (hash1(i, 153) + 1) * 7;
    c.strokeStyle = withAlpha(hash1(i, 159) > 0 ? '#86786a' : '#fbfaf6', 0.07 + 0.04 * (hash1(i, 161) + 1));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  c.strokeStyle = withAlpha('#8d8676', 0.05);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let x = -W / 2 + 40; x < W / 2; x += 40) {
    c.moveTo(x, -H / 2 + 30);
    c.lineTo(x, H / 2);
  }
  for (let y = -H / 2 + 30; y < H / 2; y += 40) {
    c.moveTo(-W / 2 + 30, y);
    c.lineTo(W / 2 - 30, y);
  }
  c.stroke();
  // paper tooth: a fine speckle of light and dark grain over the whole sheet
  for (let i = 0; i < 5200; i++) {
    const x = hash1(i, 171) * 0.5 * W, y = hash1(i, 173) * 0.5 * H;
    c.fillStyle = withAlpha(hash1(i, 177) > 0 ? '#fffdf6' : '#5e554a', 0.05 + 0.04 * (hash1(i, 179) + 1));
    c.fillRect(x, y, 0.9, 0.9);
  }
  // cold window light raking across from the upper left, and the soft shadow of the window's mullions on it
  const rake = c.createLinearGradient(-W / 2, -H / 2, W / 2, H / 2);
  rake.addColorStop(0, withAlpha('#f2f6f8', 0.2));
  rake.addColorStop(0.45, withAlpha('#f2f6f8', 0.04));
  rake.addColorStop(1, withAlpha('#262a30', 0.2));
  c.fillStyle = rake;
  c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
  const bar = (x0: number, y0: number, x1: number, y1: number, wd: number, a: number) => {
    // a soft band from (x0,y0) to (x1,y1): a gradient across its width
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    c.save();
    c.translate(x0, y0);
    c.rotate(ang);
    const g = c.createLinearGradient(0, -wd, 0, wd);
    g.addColorStop(0, withAlpha('#262a30', 0));
    g.addColorStop(0.5, withAlpha('#262a30', a));
    g.addColorStop(1, withAlpha('#262a30', 0));
    c.fillStyle = g;
    c.fillRect(0, -wd, len, 2 * wd);
    c.restore();
  };
  // two mullions and a transom, thrown long and slanting by the low light
  bar(-W * 0.18, -H / 2 - 20, -W * 0.02, H / 2 + 20, 16, 0.075);
  bar(W * 0.2, -H / 2 - 20, W * 0.36, H / 2 + 20, 16, 0.07);
  bar(-W / 2 - 20, -H * 0.12, W / 2 + 20, -H * 0.02, 14, 0.06);
  // the curl: the lower right corner lifts toward the light, a pale crease across it
  const cg = c.createLinearGradient(W / 2 - 70, H / 2, W / 2, H / 2 - 70);
  cg.addColorStop(0, withAlpha('#ffffff', 0));
  cg.addColorStop(0.55, withAlpha('#ffffff', 0));
  cg.addColorStop(0.62, withAlpha('#fbf8f0', 0.26));
  cg.addColorStop(0.75, withAlpha('#2e3238', 0.12));
  cg.addColorStop(1, withAlpha('#2e3238', 0.2));
  c.fillStyle = cg;
  c.fillRect(W / 2 - 80, H / 2 - 80, 82, 82);
  c.restore();
  for (const [x, y] of [[SHEET.cx - W / 2 + 30, SHEET.cy - H / 2 + 26], [SHEET.cx + W / 2 - 30, SHEET.cy - H / 2 + 24]] as const) {
    c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#f6f6f0', 0.6);
    c.beginPath();
    c.arc(x - 1.4, y - 1.4, 1.6, 0, Math.PI * 2);
    c.fill();
  }
}

/** L5: the near bench edge, soft (cached); dy moves it with the camera so it never covers lettering */
export function plateNear(f: Frame, key: string, dy = 0) {
  f.layer('L5', (c, env) => {
    c.save();
    c.translate(0, dy);
    f.cached(`ch08plate/L5/${key}/${env.mood.id}`, 4400, 420, (cc) => {
      cc.translate(1560, -650);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
      cc.beginPath();
      cc.moveTo(-1560, 700);
      cc.lineTo(2840, 690);
      cc.lineTo(2840, 1070);
      cc.lineTo(-1560, 1070);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.45);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(-1560, 700);
      cc.lineTo(2840, 690);
      cc.stroke();
    })(c, -1560, 650);
    c.restore();
  });
}

export interface PInkO {
  size?: number;
  font?: 'serif' | 'italic' | 'mono' | 'sc' | 'monoBold';
  alpha?: number;
  color?: string;
  align?: CanvasTextAlign;
  id?: string;
  weight?: number;
  /** subject text (legibility floor) — default true; false = texture */
  legible?: boolean;
}
export function pFont(c: C, o: PInkO, text: string): string {
  const fam = o.font === 'mono' || o.font === 'monoBold' ? FONT.mono : o.font === 'sc' ? FONT.sc : FONT.text;
  const style = o.font === 'italic' ? 'italic ' : '';
  const weight = o.weight ?? (o.font === 'monoBold' ? 600 : 500);
  const base = `${style}${weight} {S}px ${fam}`;
  let size = o.size ?? 24;
  if (o.legible !== false) size = legibleSize(c, base.replace('{S}', String(size)), size, text);
  return base.replace('{S}', size.toFixed(2));
}
/** plate lettering; returns its width */
export function pInk(c: C, text: string, x: number, y: number, o: PInkO = {}): number {
  const a = clamp01(o.alpha ?? 1);
  c.save();
  c.font = pFont(c, o, text);
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  const w = c.measureText(text).width;
  const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(c.font) ?? [])[1] ?? '') || (o.size ?? 24);
  if (a > 0.003) {
    textRole(c, o.legible === false ? 'texture' : 'subject', () => {
      c.fillStyle = withAlpha(o.color ?? P_INK, a);
      c.fillText(text, x, y);
    });
  }
  if (o.id) {
    const x0 = c.textAlign === 'center' ? x - w / 2 : c.textAlign === 'right' ? x - w : x;
    textProbe(c, o.id, x0, y - px * 0.8, w, px, a);
  }
  c.restore();
  return w;
}
