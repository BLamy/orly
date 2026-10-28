/**
 * handwired-explained — ch07-s02 / ch07-s03: ONE ReGLU VALVE, WORKED BY HAND, on a lamp-lit parchment plate
 * (owned by the ch07-s01..s05 author). One plate and one valve, so s02's open valve visibly becomes s03's shut one.
 *
 *   valveRoom(f, { key, paper })    backlight · L2 the wall (a tall paned dawn window at centre, one each side) · fog A ·
 *                                   L3 the parchment sheet, fading in with `paper` (0 = the valve is a black silhouette
 *                                   against the window, 1 = it has been inked onto the plate)
 *   VALVE_INK                       a SHARP layer at the sheet's depth: draw the valve and the plate's lettering here
 *   drawValve(c, env, st)           the machine, in one state (below)
 *   valveNear(f, key)               L5: the near bench edge
 *   VG                              the geometry (rest px), for placing text and arrows
 *
 * THE MACHINE (y = 3w · max(0, g + b); every number COMPUTED here in FP32, never typed):
 *   an inlet pipe carrying the input, 3, into a copper COLLAR worked by the w dial (× w): past the collar the light in
 *   the trough stands 3w deep (40 px per unit); a paper SLUICE GATE crosses the trough, lifted from below by a brass rod
 *   whose wheel rides a sliding CAM cut in the shape of Deep Dive I's copper hinge (flat, then a 45° climb), so the lift
 *   is max(0, g + b) (200 px per unit), read on a RULER beside the gate whose pointer shows g + b itself (it can sit
 *   below the zero mark while the gate stays shut); past the gate a thin outflow stands y deep and pours into a glass
 *   TRAY whose level is y (200 px per unit). Three brass dials below: w (to the collar), g and b (to the cam's slide).
 *   Backward, a lantern glow runs back from the tray through the open gate and splits: along the trough to the w dial
 *   (∂y/∂w = 3 · opening) and down the rod and the cam to the g dial (∂y/∂g = 3w), the b dial glowing with the same.
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { windowWall } from '../../../film/silhouette/architecture';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const f32 = Math.fround;

// ---------------------------------------------------------------- the maths (FP32, the runtime's precision)
export function valveForward(w: number, g: number, b: number) {
  const channel = f32(3 * f32(w));
  const pre = f32(f32(g) + f32(b));
  const opening = Math.max(0, pre);
  return { channel, pre, opening, y: f32(channel * opening) };
}
export function valveBackward(w: number, g: number, b: number) {
  const { channel, opening } = valveForward(w, g, b);
  const open = opening > 0;
  return { dw: open ? f32(3 * opening) : 0, dg: open ? channel : 0, db: open ? channel : 0 };
}
/** print a computed FP32 value the way the plate inks it (no trailing zeros; a true minus sign) */
export const vfmt = (v: number) => String(Number(v.toPrecision(6))).replace('-', '−');

// ---------------------------------------------------------------- geometry (rest px at the sheet's depth)
export const VG = {
  /** the trough: inlet end, collar, gate, outlet; floor y and wall height */
  x0: 236,
  collar: 296,
  gate: 640,
  x1: 990,
  floor: 330,
  wallH: 82,
  /** px per unit: light depth in the trough, gate lift / ruler, tray level */
  depth: 40,
  lift: 200,
  /** the ruler beside the gate */
  rulerX: 678,
  /** the cam's flat top at the wheel, the wheel radius */
  camY: 436,
  wheelR: 9,
  /** the tray (glass), its centre x, top and bottom */
  tray: { x: 1046, top: 346, bot: 440, w: 64 },
  /** the dials */
  dialY: 510,
  dialR: 25,
  dial: { w: 296, g: 528, b: 752 },
  /** the inlet pipe's mouth */
  inlet: 168,
} as const;

/** the sheet: deckled parchment (rest px) */
export const VPLATE = { cx: 640, cy: 372, w: 1068, h: 812 } as const;
export const VALVE_INK: LayerSpec = { id: 'L3ink', z: LAYERS.L3.z, haze: 0.02, blur: 0 };
export const V_INK = '#21170f';
/** s02's last framing = s03's first (the push through the backward pass) */
export const VALVE_CAM_END = { x: 652, y: 420, z: -43, lens: 1 } as const;
/** the plate's working framing (s02 after the ink): pulled back ~8 % so the sheet's bottom edge and the dark floor show */
export const VALVE_CAM_REST = { x: 640, y: 430, z: -110, lens: 1 } as const;
/** valveNear's dy that keeps the near bench edge at screen y ≈ 704 for a camera (it never covers the plate's lettering) */
export const valveNearDy = (cam: { y: number; z: number }) => cam.y + (704 - 360) * (650 - cam.z) / 650 - 678;
/** a sharp layer at the wall's depth for a full-strength composite over the backlit windows (desaturation) */
const WALL_TINT: LayerSpec = { id: 'L2tint', z: LAYERS.L2.z, haze: 0, blur: 0 };
export const V_COPPER = '#8a4421';
const BRASS = '#a8823e';

// ---------------------------------------------------------------- the room
export function valveRoom(f: Frame, o: { key: string; paper: number; sunX?: number }) {
  f.backlight({ sunX: o.sunX ?? 640, sunY: 300, intensity: 1 });
  f.layer('L2', (c, env) => {
    f.cached(`ch07valve/L2/${env.mood.id}`, 2900, 1500, (cc) => {
      cc.translate(800, 380);
      wall(cc, env);
    })(c, -800, -380);
  });
  // the side windows' purple and gold competed with the plate: desaturate the window wall ~40 % (review r1)
  f.layer(WALL_TINT, (c) => {
    c.save();
    c.globalCompositeOperation = 'saturation';
    c.fillStyle = 'rgba(128,128,128,0.4)';
    c.fillRect(-900, -480, 3100, 1700);
    c.restore();
  });
  f.fog({ yCenter: 430, height: 320, alpha: 0.16, drift: 6 });
  const p = clamp01(o.paper);
  if (p > 0.001) {
    f.layer('L3', (c, env) => {
      const draw = f.cached(`ch07valve/L3/${env.mood.id}`, VPLATE.w + 40, VPLATE.h + 40, (cc) => {
        cc.translate(-(VPLATE.cx - VPLATE.w / 2 - 20), -(VPLATE.cy - VPLATE.h / 2 - 20));
        sheet(cc, env);
      });
      c.save();
      c.globalAlpha = p;
      draw(c, VPLATE.cx - VPLATE.w / 2 - 20, VPLATE.cy - VPLATE.h / 2 - 20);
      c.restore();
    });
    // the lamp over the plate: a practical behind the ink
    f.practical({ x: 640, y: 6, kind: 'lamp', seed: 77, intensity: 0.24 * p, radius: 260, layer: 'L3' });
  }
}

/** the wall: a step darker than the plate, a tall paned dawn window at centre (behind the valve before the plate
 *  inks), one at each side, pierced (holes) so the backlight shows through */
function wall(c: C, env: PaintEnv) {
  windowWall(c, {
    x: -800, y: -380, w: 2900, h: 1500, centers: [-860, -110, 640, 1390, 2140], winW: 360, apex: 60, sill: 600,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 8 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
    cornice: 40, wainscot: 0, glass: 0.5, seed: 707,
  }, env);
  // the wall below the sill, in shadow
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(-800, 600, 2900, 520);
}

/** the plate: a deckled parchment sheet, a hair off square, lamp pool, fibres, faint drafting grid, two brass pins */
function sheet(c: C, env: PaintEnv) {
  c.save();
  c.translate(VPLATE.cx, VPLATE.cy);
  c.rotate(-0.004);
  const W = VPLATE.w, H = VPLATE.h;
  const edge = (n: number, seed: number) => 2.2 * hash1(n, seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) pts.push([-W / 2 + (W * i) / 60, -H / 2 + edge(i, 31)]);
  for (let i = 0; i <= 40; i++) pts.push([W / 2 + edge(i, 35), -H / 2 + (H * i) / 40]);
  for (let i = 60; i >= 0; i--) pts.push([-W / 2 + (W * i) / 60, H / 2 + edge(i, 37)]);
  for (let i = 40; i >= 0; i--) pts.push([-W / 2 + edge(i, 39), -H / 2 + (H * i) / 40]);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.save();
  c.translate(5, 7);
  c.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.ink, 0.45), 0.35);
  c.fill();
  c.restore();
  const g = c.createRadialGradient(0, -240, 30, 0, -120, 860);
  g.addColorStop(0, mixLab('#f8f0df', env.mood.core, 0.32));
  g.addColorStop(0.45, mixLab('#ecdfc3', env.mood.sky[1], 0.14));
  g.addColorStop(0.8, mixLab('#d2bb92', env.mood.set, 0.3));
  g.addColorStop(1, mixLab('#b39a72', env.mood.set, 0.5));
  c.fillStyle = g;
  c.fill();
  c.clip();
  const pool = c.createRadialGradient(0, -220, 40, 0, -180, 800);
  pool.addColorStop(0, withAlpha('#fff3d6', 0.2));
  pool.addColorStop(0.3, withAlpha('#fff3d6', 0));
  pool.addColorStop(0.55, withAlpha('#3a2614', 0.1));
  pool.addColorStop(0.85, withAlpha('#3a2614', 0.3));
  pool.addColorStop(1, withAlpha('#3a2614', 0.45));
  c.fillStyle = pool;
  c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
  for (let i = 0; i < 460; i++) {
    const x = hash1(i, 41) * 0.5 * W;
    const y = hash1(i, 43) * 0.5 * H;
    const a = hash1(i, 47) * Math.PI;
    const l = 4 + (hash1(i, 53) + 1) * 7;
    c.strokeStyle = withAlpha(hash1(i, 59) > 0 ? '#8f7650' : '#fffaf0', 0.08 + 0.04 * (hash1(i, 61) + 1));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  c.strokeStyle = withAlpha('#9c8460', 0.05);
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
  for (const [x, y] of [[VPLATE.cx - W / 2 + 34, VPLATE.cy - H / 2 + 60], [VPLATE.cx + W / 2 - 34, VPLATE.cy - H / 2 + 56]] as const) {
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

/** L5: the near bench edge, soft (cached) */
export function valveNear(f: Frame, key: string, dy = 0) {
  f.layer('L5', (c, env) => {
    c.save();
    c.translate(0, dy);
    f.cached(`ch07valve/L5/${key}/${env.mood.id}`, 4400, 420, (cc) => {
      cc.translate(1560, -630);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
      cc.beginPath();
      cc.moveTo(-1560, 678);
      cc.lineTo(2840, 666);
      cc.lineTo(2840, 1050);
      cc.lineTo(-1560, 1050);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.5);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(-1560, 678);
      cc.lineTo(2840, 666);
      cc.stroke();
    })(c, -1560, 630);
    c.restore();
  });
}

// ---------------------------------------------------------------- lettering
export interface InkO {
  size?: number;
  font?: 'serif' | 'italic' | 'mono' | 'sc';
  alpha?: number;
  color?: string;
  align?: CanvasTextAlign;
  id?: string;
  weight?: number;
  /** enforce the legibility floor (default true) */
  legible?: boolean;
}
function fontOf(c: C, o: InkO, text: string): string {
  const fam = o.font === 'mono' ? FONT.mono : o.font === 'sc' ? FONT.sc : FONT.text;
  const style = o.font === 'italic' ? 'italic ' : '';
  const base = `${style}${o.weight ?? 500} {S}px ${fam}`;
  let size = o.size ?? 24;
  if (o.legible !== false) size = legibleSize(c, base.replace('{S}', String(size)), size, text);
  return base.replace('{S}', size.toFixed(2));
}
/** plate lettering (probed for the ghost-text audit when id is given); returns its width */
export function vInk(c: C, text: string, x: number, y: number, o: InkO = {}): number {
  const a = clamp01(o.alpha ?? 1);
  c.save();
  c.font = fontOf(c, o, text);
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  const w = c.measureText(text).width;
  const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(c.font) ?? [])[1] ?? '') || (o.size ?? 24);
  if (a > 0.003) {
    textRole(c, 'subject', () => {
      c.fillStyle = withAlpha(o.color ?? V_INK, a);
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
/** a line inked segment by segment (each with its own alpha), laid end to end; align left or center */
export function vInkSegs(c: C, segs: { text: string; a: number; color?: string }[], x: number, y: number, o: InkO = {}) {
  c.save();
  const full = segs.map((s) => s.text).join('');
  c.font = fontOf(c, o, full);
  const widths = segs.map((s) => c.measureText(s.text).width);
  const total = widths.reduce((p, q) => p + q, 0);
  let cx = o.align === 'center' ? x - total / 2 : x;
  const px = parseFloat((/(\d+(?:\.\d+)?)px/.exec(c.font) ?? [])[1] ?? '') || (o.size ?? 24);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  textRole(c, 'subject', () => {
    segs.forEach((s, i) => {
      if (s.a > 0.003) {
        c.fillStyle = withAlpha(s.color ?? o.color ?? V_INK, clamp01(s.a));
        c.fillText(s.text, cx, y);
      }
      cx += widths[i];
    });
  });
  if (o.id) textProbe(c, o.id, o.align === 'center' ? x - total / 2 : x, y - px * 0.8, total, px, Math.max(...segs.map((s) => s.a)));
  c.restore();
  return total;
}

// ---------------------------------------------------------------- the machine
export interface ValveState {
  /** 0 = black silhouette against the window, 1 = inked on the plate */
  paper: number;
  w: number;
  g: number;
  b: number;
  /** the cam's slide (default g + b; s02 sweeps it on 'opening' to show max(0, ·)) */
  s?: number;
  /** 0..1 the forward light: upstream front (inlet → gate) */
  up: number;
  /** 0..1 the outflow front (gate → tray) */
  down: number;
  /** 0..1 how far the tray has filled toward its level */
  fill: number;
  /** dial tags shown (0..1 each) and their values as printed (null = blank tag) */
  tags: { w: number; g: number; b: number };
  /** the values the tags print (default the dials' current values): a tag reads the detent it clicks to */
  tagVals?: { w?: number; g?: number; b?: number };
  /** a detent kick per dial (0..1 decaying), drawn as a tiny overshoot */
  kick?: { w?: number; g?: number; b?: number };
  /** the input's tag ('3') and the collar's '× w' mark */
  inTag: number;
  collarTag: number;
  /** the ruler's reading label at the pointer (0..1) */
  read: number;
  /** backward: the lantern glow's run (tray → gate) 0..1, then the two branches 0..1, b's glow 0..1 */
  back?: number;
  armW?: number;
  armG?: number;
  bGlow?: number;
  /** 0..1 per backward segment's darkness (s03 'dark': they fade right to left): tray-gate, gate-w, gate-g, b */
  dark?: [number, number, number, number];
  /** the slopes inked beside the dials: alphas, the values printed (the shot computes them with valveBackward on
   *  the open valve), and `zero` 0..1 (s03: once shut, each is replaced by its 0) */
  slopes?: { w: number; g: number; b: number; zero?: number; vals: { dw: number; dg: number; db: number } };
  /** 0..1 the warm rim on the channel (s03 'can') */
  warm?: number;
  /** the clack of the gate shutting: 0..1 decaying (a tiny jolt of the blade) */
  jolt?: number;
  tq: number;
  /** probe prefix for text ids */
  id: string;
}

/** colours: the silhouette ink and the plate's ink converge as the valve inks onto the paper */
function cols(env: PaintEnv, paper: number) {
  const ink = mixLab(PUPPET_NEAR_BLACK, '#1a120c', paper);
  const paperC = mixLab(mixLab('#e8d6ac', env.mood.halo, 0.25), PUPPET_NEAR_BLACK, 0.85 * (1 - paper));
  const brass = mixLab(mixLab(BRASS, env.mood.halo, 0.3), PUPPET_NEAR_BLACK, 0.75 * (1 - paper));
  const copper = mixLab(mixLab('#b0683a', env.mood.halo, 0.2), PUPPET_NEAR_BLACK, 0.6 * (1 - paper));
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.85 * (1 - paper * 0.55));
  return { ink, paperC, brass, copper, rim };
}

function lw(c: C, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

export function drawValve(c: C, env: PaintEnv, st: ValveState) {
  const K = cols(env, st.paper);
  const F = valveForward(st.w, st.g, st.b);
  const s = st.s ?? F.pre;
  const open = Math.max(0, s);
  const chan = F.channel;
  const yOut = f32(chan * open);
  const dark = st.dark ?? [0, 0, 0, 0];
  const core = env.mood.core;
  const halo = env.mood.halo;

  // ================= the cam (Deep Dive I's hinge: flat, then a 45° climb), sliding with s
  const xc = VG.gate - VG.lift * s; // the profile's corner
  const camTop = (x: number) => VG.camY - Math.max(0, x - xc);
  c.fillStyle = K.ink;
  c.beginPath();
  const cx0 = xc - 250, cx1 = xc + 104;
  c.moveTo(cx0, VG.camY + 14);
  c.lineTo(cx0, VG.camY);
  c.lineTo(xc, VG.camY);
  c.lineTo(cx1, camTop(cx1));
  c.lineTo(cx1 + 8, camTop(cx1) + 6);
  c.lineTo(cx1 + 8, VG.camY + 14);
  c.closePath();
  c.fill();
  // its rim (top edge), the copper hinge pin at the corner
  c.strokeStyle = K.rim;
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  c.moveTo(cx0, VG.camY);
  c.lineTo(xc, VG.camY);
  c.lineTo(cx1, camTop(cx1));
  c.stroke();
  c.fillStyle = K.copper;
  c.beginPath();
  c.arc(xc, VG.camY + 3, 4.4, 0, Math.PI * 2);
  c.fill();
  // the cam's guide rail (fixed) and the slide's runners
  c.fillStyle = K.ink;
  c.fillRect(VG.gate - 300, VG.camY + 18, 600, 5);
  for (let x = cx0 + 20; x < cx1; x += 70) c.fillRect(x, VG.camY + 14, 6, 6);

  // ================= dials (w, g, b), with linkages
  const kick = st.kick ?? {};
  const dial = (name: 'w' | 'g' | 'b', x: number, v: number, k: number) => {
    const y = VG.dialY, r = VG.dialR;
    c.fillStyle = K.ink;
    c.beginPath();
    c.arc(x, y, r + 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = K.brass;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    // detent teeth round the rim
    c.strokeStyle = withAlpha(K.ink, 0.75);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      c.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.stroke();
    // the pointer: straight up = 0, +1 = a full 3/4 turn right
    const a = -Math.PI / 2 + (v + 0.06 * k) * Math.PI * 1.5;
    c.strokeStyle = K.ink;
    c.lineWidth = lw(c, 4);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
    c.stroke();
    c.lineCap = 'butt';
    c.fillStyle = K.copper;
    c.beginPath();
    c.arc(x, y, 3.2, 0, Math.PI * 2);
    c.fill();
    void name;
  };
  // w: a rod up to the collar
  c.fillStyle = K.ink;
  c.fillRect(VG.dial.w - 2.5, VG.floor + 8, 5, VG.dialY - VG.dialR - VG.floor - 8);
  // g and b: cords up to the cam's slide (a yoke under the guide rail)
  c.strokeStyle = withAlpha(K.ink, 0.9);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  const yoke = { x: xc - 60, y: VG.camY + 34 };
  c.moveTo(VG.dial.g, VG.dialY - VG.dialR - 3);
  c.lineTo(yoke.x, yoke.y);
  c.lineTo(VG.dial.b, VG.dialY - VG.dialR - 3);
  c.moveTo(yoke.x, yoke.y);
  c.lineTo(yoke.x, VG.camY + 14);
  c.stroke();
  c.fillStyle = K.brass;
  c.beginPath();
  c.arc(yoke.x, yoke.y, 4.5, 0, Math.PI * 2);
  c.fill();
  dial('w', VG.dial.w, st.w, kick.w ?? 0);
  dial('g', VG.dial.g, st.g, kick.g ?? 0);
  dial('b', VG.dial.b, st.b, kick.b ?? 0);

  // ================= the inlet pipe and the trough
  const tTop = VG.floor - VG.wallH;
  c.fillStyle = K.ink;
  // the inlet pipe (enters from the left edge, closed: the input travels inside it)
  c.fillRect(VG.inlet - 30, VG.floor - 66, VG.x0 - VG.inlet + 34, 48);
  c.beginPath();
  c.ellipse(VG.inlet - 30, VG.floor - 42, 8, 26, 0, 0, Math.PI * 2);
  c.fill();
  // trough walls and floor (a U channel), and its dark interior
  c.fillRect(VG.x0, tTop - 6, VG.x1 - VG.x0 + 6, 6);
  c.fillRect(VG.x0, VG.floor, VG.x1 - VG.x0 + 6, 10);
  c.fillStyle = mixLab(K.ink, env.mood.set, 0.22 * st.paper);
  c.fillRect(VG.x0, tTop, VG.x1 - VG.x0, VG.wallH);
  // the trough's rim (top edge catches the light)
  c.strokeStyle = K.rim;
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  c.moveTo(VG.x0, tTop - 6);
  c.lineTo(VG.x1 + 6, tTop - 6);
  c.stroke();

  // ================= the light: upstream depth 3w, outflow depth y
  const upD = chan * VG.depth;
  const upFront = VG.collar + (VG.gate - VG.collar) * clamp01(st.up);
  if (st.up > 0) {
    c.save();
    const gr = c.createLinearGradient(0, VG.floor - upD, 0, VG.floor);
    gr.addColorStop(0, mixLab(core, '#ffffff', 0.25));
    gr.addColorStop(0.35, core);
    gr.addColorStop(1, mixLab(halo, core, 0.3));
    c.fillStyle = gr;
    // the inlet's last stretch and the collar's mouth light too (the input pouring in)
    c.fillRect(VG.x0, VG.floor - upD, upFront - VG.x0, upD);
    // a rounded leading edge
    c.beginPath();
    c.ellipse(upFront, VG.floor - upD / 2, 6, upD / 2, 0, -Math.PI / 2, Math.PI / 2);
    c.fill();
    // surface glint
    c.strokeStyle = withAlpha('#fff8e4', 0.75);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    for (let x = VG.x0; x < upFront; x += 6) {
      const yy = VG.floor - upD + 1.2 * Math.sin(x * 0.09 + st.tq * 9);
      if (x === VG.x0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
    c.restore();
  }
  const outD = Math.max(open > 0 ? 1.6 : 0, yOut * VG.depth);
  const downX = VG.gate + (VG.x1 - VG.gate) * clamp01(st.down);
  if (st.down > 0 && open > 0) {
    c.fillStyle = mixLab(core, '#ffffff', 0.2);
    c.fillRect(VG.gate, VG.floor - outD, downX - VG.gate, outD);
    if (st.down >= 1) {
      // the pour into the tray
      c.fillRect(VG.x1 + 2, VG.floor - outD, VG.tray.x - VG.x1 - 2, outD);
      c.fillRect(VG.tray.x - 2, VG.floor - outD, 3.2, VG.tray.bot - (VG.floor - outD) - 2);
    }
  }
  // the warm rim along the channel (s03 'can')
  if ((st.warm ?? 0) > 0.002) {
    c.save();
    const wa = st.warm ?? 0;
    // a warm glow along the channel's top edge and the light inside it (the rim light catching it again)
    const gl = c.createLinearGradient(0, tTop - 34, 0, tTop + 10);
    gl.addColorStop(0, withAlpha(env.mood.halo, 0));
    gl.addColorStop(0.75, withAlpha(mixLab(env.mood.halo, '#e8a050', 0.3), 0.45 * wa));
    gl.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gl;
    c.fillRect(VG.x0, tTop - 34, VG.gate - VG.x0, 44);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, core, 0.7), 0.95 * wa);
    c.lineWidth = lw(c, 4.5);
    c.beginPath();
    c.moveTo(VG.x0, tTop - 6);
    c.lineTo(VG.x1 + 6, tTop - 6);
    c.stroke();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(core, 0.22 * wa);
    c.fillRect(VG.x0, VG.floor - chan * VG.depth, VG.gate - VG.x0, chan * VG.depth);
    c.restore();
  }

  // ================= the collar (× w), on the trough at the w rod
  c.fillStyle = K.copper;
  c.fillRect(VG.collar - 9, tTop - 14, 18, VG.wallH + 26);
  c.fillStyle = K.ink;
  c.fillRect(VG.collar - 3, tTop - 14, 6, VG.wallH + 26);

  // ================= the gate: posts, the paper blade (lifted by `open`), the rod to the wheel on the cam
  const liftPx = open * VG.lift;
  const jolt = (st.jolt ?? 0) * 3 * Math.sin(st.tq * 40);
  const bladeBot = VG.floor - liftPx + jolt;
  const bladeTop = bladeBot - 150;
  c.fillStyle = K.ink;
  c.fillRect(VG.gate - 18, tTop - 120, 6, 132 + VG.wallH);
  c.fillRect(VG.gate + 12, tTop - 120, 6, 132 + VG.wallH);
  c.fillRect(VG.gate - 24, tTop - 126, 48, 8);
  c.fillStyle = K.paperC;
  c.fillRect(VG.gate - 11, bladeTop, 22, bladeBot - bladeTop);
  c.strokeStyle = withAlpha(K.ink, 0.6);
  c.lineWidth = lw(c, 1);
  c.strokeRect(VG.gate - 11, bladeTop, 22, bladeBot - bladeTop);
  // the blade's grain (two cut lines)
  c.beginPath();
  c.moveTo(VG.gate - 5, bladeTop + 10);
  c.lineTo(VG.gate - 5, bladeBot - 10);
  c.moveTo(VG.gate + 5, bladeTop + 16);
  c.lineTo(VG.gate + 5, bladeBot - 16);
  c.stroke();
  // the rod through a slot in the trough floor, down to the follower wheel on the cam
  const wheelY = VG.camY - liftPx - VG.wheelR + jolt * 0.3;
  c.fillStyle = K.brass;
  c.fillRect(VG.gate - 2, bladeBot, 4, wheelY - bladeBot);
  c.fillStyle = K.ink;
  c.beginPath();
  c.arc(VG.gate, wheelY, VG.wheelR, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = K.brass;
  c.beginPath();
  c.arc(VG.gate, wheelY, 3.2, 0, Math.PI * 2);
  c.fill();

  // ================= the ruler beside the gate: zero at the floor, ticks every 0.05 from −0.2 to 0.4
  {
    const rx = VG.rulerX;
    const yOf = (v: number) => VG.floor - v * VG.lift;
    c.fillStyle = K.paperC;
    c.fillRect(rx - 2, yOf(0.42), 18, yOf(-0.22) - yOf(0.42));
    c.strokeStyle = withAlpha(K.ink, 0.85);
    c.lineWidth = lw(c, 1.1);
    c.strokeRect(rx - 2, yOf(0.42), 18, yOf(-0.22) - yOf(0.42));
    c.beginPath();
    for (let k = -4; k <= 8; k++) {
      const yy = yOf(k * 0.05);
      c.moveTo(rx - 2, yy);
      c.lineTo(rx + (k % 2 === 0 ? 9 : 5), yy);
    }
    c.stroke();
    // the zero mark, heavier
    c.lineWidth = lw(c, 2.4);
    c.beginPath();
    c.moveTo(rx - 2, yOf(0));
    c.lineTo(rx + 16, yOf(0));
    c.stroke();
    // the pointer: reads g + b (the cam's slide), even below zero
    const py = yOf(Math.max(-0.21, Math.min(0.41, s)));
    c.fillStyle = s < 0 ? mixLab(V_COPPER, K.ink, 0.35) : K.copper;
    c.beginPath();
    c.moveTo(rx + 17, py);
    c.lineTo(rx + 29, py - 6);
    c.lineTo(rx + 29, py + 6);
    c.closePath();
    c.fill();
    if (st.paper > 0.3) {
      vInk(c, '0', rx + 34, yOf(0) + 7, { size: 17, font: 'mono', alpha: st.paper * 0.75, legible: false });
      if (st.read > 0.002) {
        // the reading on a small paper slip, so it reads against the dark trough
        const txt = vfmt(s);
        c.save();
        c.font = fontOf(c, { size: 22, font: 'mono', weight: 600 }, txt);
        const sw = c.measureText(txt).width + 14;
        c.globalAlpha = st.read;
        c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
        c.fillRect(rx + 33, py - 13, sw, 28);
        c.fillStyle = mixLab('#f2e6c8', env.mood.core, 0.15);
        c.fillRect(rx + 31, py - 15, sw, 28);
        c.restore();
        vInk(c, txt, rx + 31 + sw / 2, py + 8, { size: 22, font: 'mono', weight: 600, align: 'center', alpha: st.read, color: s < 0 ? V_INK : V_COPPER, id: `${st.id}-read` });
      }
    }
  }

  // ================= the tray (glass), its scale and its level
  {
    const T = VG.tray;
    const lv = yOut * VG.lift * clamp01(st.fill);
    c.fillStyle = withAlpha(mixLab(K.paperC, env.mood.haze, 0.3), 0.35 + 0.25 * st.paper);
    c.fillRect(T.x - T.w / 2, T.top, T.w, T.bot - T.top);
    if (lv > 0.2) {
      const gr = c.createLinearGradient(0, T.bot - lv, 0, T.bot);
      gr.addColorStop(0, mixLab(core, '#ffffff', 0.3));
      gr.addColorStop(1, mixLab(halo, core, 0.4));
      c.fillStyle = gr;
      c.fillRect(T.x - T.w / 2, T.bot - lv, T.w, lv);
      c.strokeStyle = withAlpha('#fffaf0', 0.8);
      c.lineWidth = lw(c, 1.2);
      c.beginPath();
      c.moveTo(T.x - T.w / 2, T.bot - lv);
      c.lineTo(T.x + T.w / 2, T.bot - lv);
      c.stroke();
    }
    c.fillStyle = K.ink;
    c.fillRect(T.x - T.w / 2 - 5, T.top - 4, 5, T.bot - T.top + 9);
    c.fillRect(T.x + T.w / 2, T.top - 4, 5, T.bot - T.top + 9);
    c.fillRect(T.x - T.w / 2 - 5, T.bot, T.w + 10, 5);
    // scale on its side (0.05 apart), heavier every 0.1
    c.strokeStyle = withAlpha(K.ink, 0.8);
    c.lineWidth = lw(c, 1);
    c.beginPath();
    for (let k = 1; k <= 8; k++) {
      const yy = T.bot - k * 0.05 * VG.lift;
      if (yy < T.top + 2) break;
      c.moveTo(T.x + T.w / 2 - (k % 2 === 0 ? 12 : 7), yy);
      c.lineTo(T.x + T.w / 2, yy);
    }
    c.stroke();
  }

  // ================= backward: the lantern glow, its two branches, b's glow
  const back = clamp01(st.back ?? 0);
  if (back > 0 || (st.armW ?? 0) > 0 || (st.armG ?? 0) > 0) {
    const arrowCol = mixLab(V_COPPER, '#6a2a10', 0.35);
    const seg = (pts: [number, number][], u: number, a: number, head: boolean) => {
      if (u <= 0 || a <= 0.003) return;
      // total length
      const L: number[] = [0];
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const target = L[L.length - 1] * clamp01(u);
      c.save();
      c.strokeStyle = withAlpha(arrowCol, a);
      c.lineWidth = lw(c, 4.2);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.setLineDash([lw(c, 10), lw(c, 6)]);
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      let end = pts[0], dir: [number, number] = [1, 0];
      for (let i = 1; i < pts.length; i++) {
        if (L[i] <= target) {
          c.lineTo(pts[i][0], pts[i][1]);
          end = pts[i];
          dir = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
        } else {
          const k = (target - L[i - 1]) / (L[i] - L[i - 1]);
          end = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
          dir = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
          c.lineTo(end[0], end[1]);
          break;
        }
      }
      c.stroke();
      c.setLineDash([]);
      // the lantern at the head while it travels; an arrowhead once it has arrived
      const dl = Math.hypot(dir[0], dir[1]) || 1;
      const ux = dir[0] / dl, uy = dir[1] / dl;
      if (head || u >= 1) {
        c.fillStyle = withAlpha(arrowCol, a);
        c.beginPath();
        c.moveTo(end[0] + ux * 8, end[1] + uy * 8);
        c.lineTo(end[0] - ux * 6 - uy * 7, end[1] - uy * 6 + ux * 7);
        c.lineTo(end[0] - ux * 6 + uy * 7, end[1] - uy * 6 - ux * 7);
        c.closePath();
        c.fill();
      }
      if (u < 1) lantern(c, env, end[0], end[1], a);
      c.restore();
    };
    const yb = VG.floor - 18; // the backward path rides just above the outflow, inside the trough
    const pTray: [number, number][] = [[VG.tray.x, VG.tray.bot - 30], [VG.tray.x, yb], [VG.gate + 16, yb]];
    const pW: [number, number][] = [[VG.gate - 16, yb], [VG.collar + 14, yb], [VG.collar + 14, VG.dialY - VG.dialR - 12]];
    const pG: [number, number][] = [[VG.gate + 14, VG.floor + 24], [VG.gate + 14, VG.camY - 30], [xc - 40, VG.camY + 40], [VG.dial.g + 14, VG.dialY - VG.dialR - 10]];
    const aT = 1 - clamp01(dark[0]), aW = 1 - clamp01(dark[1]), aG = 1 - clamp01(dark[2]);
    seg(pTray, back, aT, back >= 1);
    seg(pW, st.armW ?? 0, aW, true);
    seg(pG, st.armG ?? 0, aG, true);
    const bg = clamp01(st.bGlow ?? 0) * (1 - clamp01(dark[3]));
    if (bg > 0.003) lantern(c, env, VG.dial.b, VG.dialY, bg * 0.9, 1.4);
  }
  // the slopes, inked beside the dials (or, once the gate has shut, their zeros)
  const sl = st.slopes;
  if (sl) {
    const V = sl.vals;
    const zero = clamp01(sl.zero ?? 0);
    const one = (v: number, a: number, x: number, id: string, align: CanvasTextAlign, size: number) => {
      if (a <= 0.003) return;
      const live = a * (1 - zero);
      vInk(c, vfmt(v), x, VG.dialY + 8, { size, font: 'mono', weight: 600, color: V_COPPER, align, alpha: live, id: `${st.id}-${id}` });
    };
    one(V.dw, sl.w, VG.dial.w - VG.dialR - 14, 'dw', 'right', 26);
    one(V.dg, sl.g, VG.dial.g - VG.dialR - 14, 'dg', 'right', 26);
    one(V.db, sl.b, VG.dial.b + VG.dialR + 14, 'db', 'left', 20);
    if (zero > 0.003) {
      const za = zero * Math.max(sl.w, sl.g);
      vInk(c, '0', VG.dial.w - VG.dialR - 14, VG.dialY + 8, { size: 26, font: 'mono', weight: 600, color: V_INK, align: 'right', alpha: za * 0.8, id: `${st.id}-zw` });
      vInk(c, '0', VG.dial.g - VG.dialR - 14, VG.dialY + 8, { size: 26, font: 'mono', weight: 600, color: V_INK, align: 'right', alpha: za * 0.8, id: `${st.id}-zg` });
      if (sl.b > 0.003) vInk(c, '0', VG.dial.b + VG.dialR + 14, VG.dialY + 8, { size: 20, font: 'mono', weight: 600, color: V_INK, align: 'left', alpha: zero * sl.b * 0.8, id: `${st.id}-zb` });
    }
  }

  // ================= labels: the input's tag, the collar's mark, the dial tags
  if (st.paper > 0.2) {
    const tagCard = (x: number, y: number, text: string, a: number, id: string, size = 22) => {
      if (a <= 0.003) return;
      c.save();
      c.font = `500 ${size}px ${FONT.mono}`;
      const tw = vInkWidth(c, text, size);
      const w = tw + 18, h = size + 12;
      // the string from above
      c.strokeStyle = withAlpha(K.ink, 0.7 * a);
      c.lineWidth = lw(c, 1);
      c.beginPath();
      c.moveTo(x, y - 12);
      c.lineTo(x, y);
      c.stroke();
      c.globalAlpha = a;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
      c.fillRect(x - w / 2 + 2, y + 3, w, h);
      c.fillStyle = mixLab('#f2e6c8', env.mood.core, 0.15);
      c.fillRect(x - w / 2, y, w, h);
      c.strokeStyle = withAlpha(V_INK, 0.45);
      c.strokeRect(x - w / 2, y, w, h);
      c.globalAlpha = 1;
      c.restore();
      vInk(c, text, x, y + h / 2 + size * 0.36, { size, font: 'mono', align: 'center', alpha: a, id, weight: 500 });
    };
    const P = st.paper;
    tagCard(VG.inlet + 12, VG.floor + 4, '3', st.inTag * P, `${st.id}-in`);
    if (st.collarTag > 0.003) vInk(c, '× w', VG.collar, VG.floor - VG.wallH - 26, { size: 22, font: 'italic', align: 'center', alpha: st.collarTag * P, id: `${st.id}-collar` });
    const tg = st.tags;
    const tv = st.tagVals ?? {};
    tagCard(VG.dial.w, VG.dialY + VG.dialR + 18, `w ${vfmt(tv.w ?? st.w)}`, tg.w * P, `${st.id}-tw`);
    tagCard(VG.dial.g, VG.dialY + VG.dialR + 18, `g ${vfmt(tv.g ?? st.g)}`, tg.g * P, `${st.id}-tg`);
    tagCard(VG.dial.b, VG.dialY + VG.dialR + 18, `b ${vfmt(tv.b ?? st.b)}`, tg.b * P, `${st.id}-tb`);
  }
}

function vInkWidth(c: C, text: string, size: number) {
  c.save();
  c.font = `500 ${legibleSize(c, `500 ${size}px ${FONT.mono}`, size, text)}px ${FONT.mono}`;
  const w = c.measureText(text).width;
  c.restore();
  return w;
}

/** the lantern glow (on paper: a warm wash, then a hot core) */
export function lantern(c: C, env: PaintEnv, x: number, y: number, a: number, s = 1) {
  c.save();
  const r = 52 * s;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.35), 0.95 * a));
  g.addColorStop(0.22, withAlpha(mixLab(env.mood.core, '#e08a3a', 0.25), 0.75 * a));
  g.addColorStop(0.55, withAlpha(env.mood.halo, 0.3 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.globalCompositeOperation = 'lighter';
  const g2 = c.createRadialGradient(x, y, 0, x, y, r * 0.45);
  g2.addColorStop(0, withAlpha('#fff6d8', 0.7 * a));
  g2.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g2;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
