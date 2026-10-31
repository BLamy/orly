/**
 * handwired-explained — ch11-s03 / ch11-s04: THE VERDICT PLATE. One deckled parchment sheet pinned in the workshop's
 * window bay at first light: warmed by the first dawnGold in ch11-s03 (JSON), drained back to winterBlue in ch11-s04
 * (TOML). The sheet takes its light from the mood (a pool from the upper-left window), so the same plate turns from
 * gold to blue with a lamp change. Tag 11 hangs at its right from a short stub of copper line.
 *
 *   plateRoom11(f, o?)             backlight (+ o.amberTop: the dawn sky's top pulled from violet to warm amber-grey),
 *                                  L2 window wall, fog, L3 the sheet (cached per mood)
 *   bigRivet(c, env, p, o)         the kept belief's copper rivet at plate scale: ~32 px, lit rim, impact flash
 *   plateNear11(f)                 L5 the near bench edge (soft)
 *   PLATE_INK                      a sharp layer at the sheet's depth for lettering, the tag, hands and pencil
 *   PLATE_CAM / plateCam(u)        the plate's framing (a breath of drift)
 *   pInk(c, text, x, y, o)         plate lettering, legible (legibleSize) and probed for the ghost-text audit
 *   STUB, TAG11_PLATE              the stub of copper line and tag 11's eyelet / scale on the plate
 *
 * Plate coordinates are the sheet layer's rest-screen px (at PLATE_CAM the sheet spans ~ x 95-1185, y 25-690).
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

export const SHEET = { cx: 640, cy: 356, w: 1110, h: 676 } as const;
/** sharp ink at the sheet's depth */
export const PLATE_INK: LayerSpec = { id: 'ch11plateInk', z: LAYERS.L3.z, haze: 0.02, blur: 0 };
export const PLATE_CAM: Camera3 = { x: 640, y: 360, z: -40, lens: 1 };
export const P_INK = '#1f1a17';
export const P_COPPER = '#8a4421';
export const P_BRASS = '#a8823e';
/** the stub of copper line tag 11 hangs from, and its eyelet / scale (plate px) */
export const STUB = { x0: 812, x1: 1060, y: 206, sag: 3 } as const;
export const TAG11_PLATE = { x: 930, eyeY: 232, scale: 3 } as const;

export function plateRoom11(f: Frame, o: { amberTop?: number } = {}) {
  f.backlight({ sunX: 420, sunY: 250, intensity: 0.95 });
  // review r1: dawnGold's sky top reads violet through the upper panes; pull it toward warm amber-grey (screen-locked,
  // over the backlight only, so it shows through the panes)
  const am = clamp01(o.amberTop ?? 0);
  if (am > 0.001) {
    const c = f.c;
    c.save();
    const g = c.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, withAlpha('#a58c66', 0.62 * am));
    g.addColorStop(0.55, withAlpha('#b8955e', 0.32 * am));
    g.addColorStop(1, withAlpha('#c49a5a', 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 420);
    c.restore();
  }
  f.layer('L2', (c, env) => {
    f.cached(`ch11plate/L2/${env.mood.id}`, 2900, 1500, (cc) => {
      cc.translate(800, 380);
      windowWall(cc, {
        x: -800, y: -380, w: 2900, h: 1500, centers: [-760, -60, 640, 1340, 2040], winW: 380, apex: -40, sill: 640,
        shape: 'flat', lights: 3, panes: { cols: 1, rows: 9 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
        cornice: 40, wainscot: 0, glass: 0.5, seed: 1103,
      }, env);
      cc.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.35);
      cc.fillRect(-800, 640, 2900, 480);
    })(c, -800, -380);
  });
  f.fog({ yCenter: 440, height: 320, alpha: 0.14, drift: 5 });
  f.layer('L3', (c, env) => {
    f.cached(`ch11plate/L3/${env.mood.id}`, SHEET.w + 40, SHEET.h + 40, (cc) => {
      cc.translate(-(SHEET.cx - SHEET.w / 2 - 20), -(SHEET.cy - SHEET.h / 2 - 20));
      sheet(cc, env);
    })(c, SHEET.cx - SHEET.w / 2 - 20, SHEET.cy - SHEET.h / 2 - 20);
  });
}

/** the kept belief's copper rivet, plate scale (~32 px across), with a lit rim on the light side and a dark
 *  shadow ring; `pop` swells it on impact; `flash` (0..1) is the 3-frame impact flash; `glint` lifts its rim light */
export function bigRivet(c: C, env: PaintEnv, p: { x: number; y: number }, o: { pop?: number; flash?: number; glint?: number } = {}) {
  const r = 16 * (o.pop ?? 1);
  const copper = mixLab('#a85a2c', env.mood.core, 0.12);
  c.save();
  // the punched hole's shadow ring
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.beginPath();
  c.arc(p.x + 1.6, p.y + 2.2, r + 1.4, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
  g.addColorStop(0, mixLab(copper, '#f4c890', 0.55));
  g.addColorStop(0.55, copper);
  g.addColorStop(1, mixLab(copper, '#3a1a0c', 0.55));
  c.fillStyle = g;
  c.beginPath();
  c.arc(p.x, p.y, r, 0, Math.PI * 2);
  c.fill();
  // the lit rim (upper left, toward the window) and the punched dimple
  const gl = clamp01(o.glint ?? 0);
  c.strokeStyle = withAlpha(mixLab('#ffe2b4', env.mood.core, 0.3), 0.8 + 0.2 * gl);
  c.lineWidth = 2.2 + 1.2 * gl;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(p.x, p.y, r - 1.2, Math.PI * 0.95, Math.PI * 1.75);
  c.stroke();
  c.strokeStyle = withAlpha('#3a1a0c', 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(p.x, p.y, r * 0.42, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  const fl = clamp01(o.flash ?? 0) + 0.6 * gl;
  if (fl > 0.001) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const fg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
    fg.addColorStop(0, withAlpha(mixLab('#fff1d6', env.mood.core, 0.3), 0.85 * Math.min(1, fl)));
    fg.addColorStop(0.4, withAlpha(env.mood.halo, 0.35 * Math.min(1, fl)));
    fg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = fg;
    c.fillRect(p.x - r * 2.6, p.y - r * 2.6, r * 5.2, r * 5.2);
    c.restore();
  }
}

/** the plate: deckled parchment, fibres, a faint drafting grid, two brass pins, lit by the mood's window light */
function sheet(c: C, env: PaintEnv) {
  c.save();
  c.translate(SHEET.cx, SHEET.cy);
  c.rotate(-0.002);
  const W = SHEET.w, H = SHEET.h;
  const edge = (n: number, seed: number) => 2.2 * hash1(n, seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) pts.push([-W / 2 + (W * i) / 60, -H / 2 + edge(i, 231)]);
  for (let i = 0; i <= 40; i++) pts.push([W / 2 + edge(i, 235), -H / 2 + (H * i) / 40]);
  for (let i = 60; i >= 0; i--) pts.push([-W / 2 + (W * i) / 60, H / 2 + edge(i, 237)]);
  for (let i = 40; i >= 0; i--) pts.push([-W / 2 + edge(i, 239), -H / 2 + (H * i) / 40]);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.save();
  c.translate(5, 7);
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), 0.4);
  c.fill();
  c.restore();
  // the paper, its warmth tinted by the window light (gold at dawn, blue in the cold)
  const g = c.createRadialGradient(-260, -220, 30, -120, -100, 900);
  g.addColorStop(0, mixLab('#f4ecda', env.mood.core, 0.3));
  g.addColorStop(0.45, mixLab('#e6d9bd', env.mood.sky[3], 0.18));
  g.addColorStop(0.8, mixLab('#cfbe9a', env.mood.set, 0.28));
  g.addColorStop(1, mixLab('#ab9a78', env.mood.set, 0.48));
  c.fillStyle = g;
  c.fill();
  c.clip();
  // the window's pool of light from the upper left, and a soft fall-off into the lower right corner
  const pool = c.createRadialGradient(-300, -240, 40, -260, -200, 820);
  pool.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.2));
  pool.addColorStop(0.35, withAlpha(env.mood.core, 0));
  pool.addColorStop(0.7, withAlpha(mixLab(env.mood.set, '#2b2620', 0.5), 0.12));
  pool.addColorStop(1, withAlpha(mixLab(env.mood.set, '#2b2620', 0.5), 0.36));
  c.fillStyle = pool;
  c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
  for (let i = 0; i < 420; i++) {
    const x = hash1(i, 241) * 0.5 * W;
    const y = hash1(i, 243) * 0.5 * H;
    const a = hash1(i, 247) * Math.PI;
    const l = 4 + (hash1(i, 253) + 1) * 7;
    c.strokeStyle = withAlpha(hash1(i, 259) > 0 ? '#86786a' : '#fbfaf6', 0.07 + 0.04 * (hash1(i, 261) + 1));
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
  for (let i = 0; i < 5200; i++) {
    const x = hash1(i, 271) * 0.5 * W, y = hash1(i, 273) * 0.5 * H;
    c.fillStyle = withAlpha(hash1(i, 277) > 0 ? '#fffdf6' : '#5e554a', 0.05 + 0.04 * (hash1(i, 279) + 1));
    c.fillRect(x, y, 0.9, 0.9);
  }
  // the window's mullion shadows thrown long across the sheet
  const bar = (x0: number, y0: number, x1: number, y1: number, wd: number, a: number) => {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    c.save();
    c.translate(x0, y0);
    c.rotate(ang);
    const gg = c.createLinearGradient(0, -wd, 0, wd);
    gg.addColorStop(0, withAlpha('#2a2620', 0));
    gg.addColorStop(0.5, withAlpha('#2a2620', a));
    gg.addColorStop(1, withAlpha('#2a2620', 0));
    c.fillStyle = gg;
    c.fillRect(0, -wd, len, 2 * wd);
    c.restore();
  };
  bar(-W * 0.05, -H / 2 - 20, W * 0.12, H / 2 + 20, 16, 0.06);
  bar(W * 0.3, -H / 2 - 20, W * 0.47, H / 2 + 20, 16, 0.055);
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

/** L5: the near bench edge, soft, across the foot of frame */
export function plateNear11(f: Frame) {
  f.layer('L5', (c, env) => {
    f.cached(`ch11plate/L5/${env.mood.id}`, 4400, 420, (cc) => {
      cc.translate(1560, -650);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
      cc.beginPath();
      cc.moveTo(-1560, 712);
      cc.lineTo(2840, 704);
      cc.lineTo(2840, 1070);
      cc.lineTo(-1560, 1070);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.45);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(-1560, 712);
      cc.lineTo(2840, 704);
      cc.stroke();
    })(c, -1560, 650);
  });
}

export interface PInkO {
  size?: number;
  font?: 'serif' | 'italic' | 'display' | 'displayItalic' | 'sc';
  alpha?: number;
  color?: string;
  align?: CanvasTextAlign;
  id?: string;
  weight?: number;
  /** subject text (legibility floor), default true; false = texture */
  legible?: boolean;
}
export function pFont(c: C, o: PInkO, text: string): string {
  const fam = o.font === 'display' || o.font === 'displayItalic' ? FONT.display : o.font === 'sc' ? FONT.sc : FONT.text;
  const style = o.font === 'italic' || o.font === 'displayItalic' ? 'italic ' : '';
  const weight = o.weight ?? 500;
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

/** the stub of copper line, cut at both ends (a short length of the film's wire), in the plate's own ink layer */
export function drawStub(c: C, env: PaintEnv, copper: string) {
  const { x0, x1, y, sag } = STUB;
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x0 + 3, y + 5);
  c.quadraticCurveTo((x0 + x1) / 2 + 3, y + sag * 2 + 5, x1 + 3, y + 5);
  c.stroke();
  c.strokeStyle = copper;
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x0, y);
  c.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.55);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 + 4, y - 1);
  c.quadraticCurveTo((x0 + x1) / 2, y + sag * 2 - 1, x1 - 4, y - 1);
  c.stroke();
  // two small brass tacks holding the stub to the sheet
  for (const x of [x0 + 6, x1 - 6]) {
    c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
    c.beginPath();
    c.arc(x, y, 4, 0, Math.PI * 2);
    c.fill();
  }
}
/** the stub's y at x (for the tag's knot) */
export function stubY(x: number) {
  const u = clamp01((x - STUB.x0) / (STUB.x1 - STUB.x0));
  return STUB.y + STUB.sag * 4 * u * (1 - u);
}
