/**
 * handwired-explained — ch04-s12 / ch04-s13 / ch04-s14: the lamp-lit parchment plate of Deep Dive I's arithmetic
 * (the detent, what exact means, why not doubles). One plate, so the three shots cut on motion:
 *
 *   plateRoom(f, { key, push? })   backlight · L2 the wall behind the bench, a step darker than the plate, a tall paned
 *                                  window cut into each side (holes) · fog A · L3 the plate itself, pinned, its lamp
 *                                  pool and drafting grid · (the shot's ink, in PLATE_INK) · L5 the near bench edge
 *   PLATE_INK                      a SHARP layer at the plate's depth: draw the plate's ink and the paper objects on it
 *                                  here, so a push-in moves them with the sheet while the wall and the bench edge slide
 *   coldWash(f, u)                 the blue light of ch04-s07 still on the paper, fading as it warms (u: 1 = cold)
 *   inkText(c, text, x, y, o)      plate lettering (mono or serif), probed for the ghost-text audit
 *   PLATE                          the sheet's rect (rest px)
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { nearEdge } from './ch04-s06-bench';

type C = CanvasRenderingContext2D;

export const PLATE = { cx: 640, cy: 372, w: 1060, h: 800 } as const;
export const PLATE_INK: LayerSpec = { id: 'L3ink', z: LAYERS.L3.z, haze: 0.02, blur: 0 };
export const INK = '#21170f';
export const COPPER_INK = '#8a4421';

export function plateRoom(f: Frame, o: { key: string }) {
  f.backlight({ sunX: 640, sunY: 220, intensity: 1 });
  f.layer('L2', (c, env) => {
    f.cached(`ch04plate/L2/${env.mood.id}`, 1700, 1000, (cc) => {
      cc.translate(210, 140);
      wall(cc, env);
    })(c, -210, -140);
  });
  f.fog({ yCenter: 420, height: 300, alpha: 0.1, drift: 6 });
  f.layer('L3', (c, env) => {
    f.cached(`ch04plate/L3/${env.mood.id}`, PLATE.w + 40, PLATE.h + 40, (cc) => {
      cc.translate(-(PLATE.cx - PLATE.w / 2 - 20), -(PLATE.cy - PLATE.h / 2 - 20));
      sheet(cc, env);
    })(c, PLATE.cx - PLATE.w / 2 - 20, PLATE.cy - PLATE.h / 2 - 20);
  });
  // the lamp over the plate (its pool is on the paper; a practical behind the ink)
  f.practical({ x: 640, y: 10, kind: 'lamp', seed: 63, intensity: 0.22, radius: 260, layer: 'L3' });
  void o;
}

/** the near bench edge (L5): call after the plate's ink */
export function plateNear(f: Frame, key: string) {
  nearEdge(f, `plate-${key}`, { key: 'plate', to: 'parchment', u: 1 }, -360, 1700);
}

/** ch04-s07's cold light still on the paper as the shot opens, warming back to paper (u = 1 cold) */
export function coldWash(f: Frame, u: number) {
  if (u <= 0.001) return;
  const c = f.c;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha('#7f93a6', 0.85 * u);
  c.fillRect(-20, -20, 1320, 760);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha('#2a3a4a', 0.25 * u);
  c.fillRect(-20, -20, 1320, 760);
  c.restore();
}

/** the wall behind the bench: a step darker than the plate, a tall paned window cut into each side */
function wall(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(mixLab(env.fill('set'), '#4a3826', 0.42), PUPPET_NEAR_BLACK, 0.35);
  c.beginPath();
  c.rect(-210, -140, 1700, 1000);
  for (const [wx, ww] of [[-150, 240], [1190, 240]] as const) {
    const cols = 2, rows = 8, mull = 9, top = 0, bot = 720;
    const pw = (ww - mull * (cols + 1)) / cols, ph = (bot - top - mull * (rows + 1)) / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) c.rect(wx + mull + i * (pw + mull), top + mull + j * (ph + mull), pw, ph);
    }
  }
  c.fill('evenodd');
}

/** the plate: a deckled parchment sheet, a hair off square, lamp pool, fibres, drafting grid, brass pins */
function sheet(c: C, env: PaintEnv) {
  c.save();
  c.translate(PLATE.cx, PLATE.cy);
  c.rotate(-0.005);
  const W = PLATE.w, H = PLATE.h;
  const edge = (n: number, seed: number) => 2.2 * hash1(n, seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) pts.push([-W / 2 + (W * i) / 60, -H / 2 + edge(i, 3)]);
  for (let i = 0; i <= 40; i++) pts.push([W / 2 + edge(i, 5), -H / 2 + (H * i) / 40]);
  for (let i = 60; i >= 0; i--) pts.push([-W / 2 + (W * i) / 60, H / 2 + edge(i, 7)]);
  for (let i = 40; i >= 0; i--) pts.push([-W / 2 + edge(i, 9), -H / 2 + (H * i) / 40]);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.save();
  c.translate(5, 7);
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), 0.35);
  c.fill();
  c.restore();
  const g = c.createRadialGradient(0, -260, 30, 0, -140, 840);
  g.addColorStop(0, mixLab('#f8f0df', env.mood.core, 0.3));
  g.addColorStop(0.45, mixLab('#ecdfc3', env.mood.sky[1], 0.15));
  g.addColorStop(0.8, mixLab('#d2bb92', env.mood.set, 0.3));
  g.addColorStop(1, mixLab('#b39a72', env.mood.set, 0.5));
  c.fillStyle = g;
  c.fill();
  c.clip();
  const pool = c.createRadialGradient(0, -240, 40, 0, -200, 780);
  pool.addColorStop(0, withAlpha('#fff3d6', 0.2));
  pool.addColorStop(0.3, withAlpha('#fff3d6', 0));
  pool.addColorStop(0.55, withAlpha('#3a2614', 0.1));
  pool.addColorStop(0.85, withAlpha('#3a2614', 0.32));
  pool.addColorStop(1, withAlpha('#3a2614', 0.45));
  c.fillStyle = pool;
  c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
  for (let i = 0; i < 460; i++) {
    const x = hash1(i, 11) * 0.5 * W;
    const y = hash1(i, 13) * 0.5 * H;
    const a = hash1(i, 17) * Math.PI;
    const l = 4 + (hash1(i, 19) + 1) * 7;
    c.strokeStyle = withAlpha(hash1(i, 23) > 0 ? '#8f7650' : '#fffaf0', 0.08 + 0.04 * (hash1(i, 29) + 1));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  c.strokeStyle = withAlpha('#9c8460', 0.06);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let x = -W / 2 + 40; x < W / 2; x += 40) {
    c.moveTo(x, -H / 2 + 40);
    c.lineTo(x, H / 2);
  }
  for (let y = -H / 2 + 40; y < H / 2; y += 40) {
    c.moveTo(-W / 2 + 30, y);
    c.lineTo(W / 2 - 30, y);
  }
  c.stroke();
  c.restore();
  for (const [x, y] of [[PLATE.cx - W / 2 + 34, PLATE.cy - H / 2 + 26], [PLATE.cx + W / 2 - 34, PLATE.cy - H / 2 + 22]] as const) {
    c.fillStyle = mixLab('#a07a3c', env.mood.halo, 0.25);
    c.beginPath();
    c.arc(x, y, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#fff6e0', 0.6);
    c.beginPath();
    c.arc(x - 1.4, y - 1.4, 1.6, 0, Math.PI * 2);
    c.fill();
  }
}

export interface InkOpts {
  size?: number;
  font?: 'mono' | 'serif' | 'italic';
  alpha?: number;
  color?: string;
  align?: CanvasTextAlign;
  role?: 'subject' | 'texture';
  /** probe id for the ghost-text audit (omit for texture) */
  id?: string;
  weight?: number;
}
const fontOf = (o: InkOpts) => {
  const size = o.size ?? 24;
  if (o.font === 'serif') return `${o.weight ?? 500} ${size}px ${FONT.text}`;
  if (o.font === 'italic') return `italic ${o.weight ?? 400} ${size}px ${FONT.text}`;
  return `${o.weight ?? 500} ${size}px ${FONT.mono}`;
};
/** plate lettering; returns its width */
export function inkText(c: C, text: string, x: number, y: number, o: InkOpts = {}): number {
  const a = o.alpha ?? 1;
  c.save();
  c.font = fontOf(o);
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  const w = c.measureText(text).width;
  if (a > 0.001) {
    textRole(c, o.role ?? 'subject', () => {
      c.fillStyle = withAlpha(o.color ?? INK, a);
      c.fillText(text, x, y);
    });
  }
  if (o.id) {
    const x0 = c.textAlign === 'center' ? x - w / 2 : c.textAlign === 'right' ? x - w : x;
    textProbe(c, o.id, x0, y - (o.size ?? 24) * 0.8, w, o.size ?? 24, a);
  }
  c.restore();
  return w;
}
/** width of text in a plate font */
export function inkWidth(c: C, text: string, o: InkOpts = {}): number {
  c.save();
  c.font = fontOf(o);
  const w = c.measureText(text).width;
  c.restore();
  return w;
}
/** a line inked term by term: segments laid end to end from x (align left), each with its own alpha */
export function inkSegments(c: C, segs: { text: string; a: number; color?: string }[], x: number, y: number, o: InkOpts = {}) {
  let cx = x;
  const total = segs.reduce((s, g) => s + inkWidth(c, g.text, o), 0);
  if (o.align === 'center') cx = x - total / 2;
  for (const g of segs) {
    cx += inkText(c, g.text, cx, y, { ...o, align: 'left', alpha: g.a, color: g.color ?? o.color, id: undefined });
  }
  if (o.id) {
    const any = Math.max(...segs.map((g) => g.a));
    textProbe(c, o.id, o.align === 'center' ? x - total / 2 : x, y - (o.size ?? 24) * 0.8, total, o.size ?? 24, any);
  }
  return total;
}
