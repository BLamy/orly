/**
 * handwired-explained — THE HANDWIREDOS DESK as a paper toy theatre (Device 3, the X-ray desk), shared by
 * ch01-s02, ch01-s03, ch03-s07, ch04-s16, ch05-s07, ch06-s13, ch07-s12, ch12-s05, ch12-s06 and the workshop's L3.
 *
 * What it is (OS01, OS02, OS12, OS14, OS18; the real stylesheet assets/site.css + handwired-os.css): a paper-beige
 * desk (#dcd2c1) with a faint dot grid, the wallpaper of 9,909 arcs (one per stored weight, copper adds over indigo
 * subtracts, shown at 36 %), three paper windows (Monitor, Notes, Photos) as sheets of card with serif title
 * strips, a three-tile dock, and ONE copper wire under the dock with a small ring at each end. Built as a toy theatre:
 * a black card proscenium, the windows hung on fine threads from its top.
 *
 *   import { handwiredDesk, DESK } from '../sets/handwiredDesk';
 *   f.layer('L3', (c, env) => handwiredDesk(f, c, env, { x: 260, y: 120, w: 760, xray: { table: u } }));
 *   const g = deskGeom({ x, y, w });   // window rects, dock tiles, the wire's ends (world) for practicals / pushes
 *
 * X-RAY (one more real component lit each time; only components HandwiredOS really has; never an index drawer):
 *   translucency 0..1   the desk and windows thin like paper held to a lamp (ch03 .2, ch04 .3, ch05 .4, ch06 .5, ch07 .6)
 *   xray.table   0..1   the source table: 234 pigeonholes lighting left to right (OS02)                       ch03-s07
 *   xray.gates   0..1   2,776 ReGLU ramps and 59 boolean detents (OS02, EX08)                               ch04-s16
 *   xray.loom    0..1   the loom: 130 thin frames, each as tall as its layer's operation count (CM01)        ch05-s07
 *   xray.clockwork 0..1 the host clockwork's ratchet (300 teeth, HL08)                                      ch06-s13
 *   xray.valve   0..1   a single ReGLU valve drawn DARK: nothing is trained (Q085, PJ20)                     ch07-s12
 * Every count drawn is the real count (234 holes, 130 frames, 300 teeth, 59 detents); the 2,776 ramps are drawn
 * one glyph per gate.
 *
 * Text drawn on the desk is texture unless a shot pushes in on it (ch01-s03 makes Monitor's sidebar the subject:
 * pass monitorSubject: true and push in until legibleSize is met).
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { CIRCUIT, OS_COLORS, TOTALS, drawWallpaper } from './circuit';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type WinId = 'monitor' | 'notes' | 'photos';

export interface DeskOpts {
  /** the desktop's top-left and width (stage px in the layer); height = w × 0.625 (16:10) */
  x: number;
  y: number;
  w: number;
  /** 0..1: how thin the paper is (X-ray); default 0 */
  translucency?: number;
  /** 0..1: the lamp on the desk (overall light); default 1 */
  lamp?: number;
  /** per-window offsets (stage px), rim kick 0..1 and thread swing (radians) */
  windows?: Partial<Record<WinId, { dx?: number; dy?: number; rim?: number; swing?: number; alpha?: number }>>;
  /** which window carries the faint copper focus wash; default 'photos' */
  focused?: WinId | 'none';
  /** dock tiles lift (0..1) */
  dockLift?: number;
  /** the copper wire's glow (0..1): the last light in frame in ch12 */
  wire?: number;
  /** Photos' twelve cells catching light in reading order: 0..12 */
  photosLit?: number;
  /** Monitor: the list's live numbers tick on twos when given (pass env.tq) */
  rowsTick?: number;
  /** Monitor: sidebar figures warm kick 0..1 */
  sidebarKick?: number;
  /** text role for Monitor's sidebar (true when a shot pushes in to read it) */
  monitorSubject?: boolean;
  /** Notes: the last to-do line ('Wire one more neuron by hand', OS18) 0 = soft/illegible, 1 = sharp */
  notesLast?: number;
  xray?: { table?: number; gates?: number; loom?: number; clockwork?: number; valve?: number };
  /** draw the black card proscenium and the hanging threads; default true */
  proscenium?: boolean;
  /** wallpaper visibility (0..1), default 1 */
  wallpaper?: number;
  /** cache key salt (shot id) */
  key?: string;
}

/** fixed window layout, as fractions of the desktop (the toy theatre's arrangement, ch01-s02) */
const WIN: Record<WinId, { fx: number; fy: number; fw: number; fh: number; title: string }> = {
  monitor: { fx: 0.05, fy: 0.12, fw: 0.42, fh: 0.6, title: 'Monitor' },
  notes: { fx: 0.5, fy: 0.1, fw: 0.27, fh: 0.42, title: 'Notes' },
  photos: { fx: 0.6, fy: 0.38, fw: 0.34, fh: 0.42, title: 'Photos' },
};

export function deskGeom(o: Pick<DeskOpts, 'x' | 'y' | 'w' | 'windows'>) {
  const h = o.w * 0.625;
  const win = {} as Record<WinId, Rect>;
  (Object.keys(WIN) as WinId[]).forEach((id) => {
    const s = WIN[id];
    const off = o.windows?.[id];
    win[id] = { x: o.x + s.fx * o.w + (off?.dx ?? 0), y: o.y + s.fy * h + (off?.dy ?? 0), w: s.fw * o.w, h: s.fh * h };
  });
  const tileW = o.w * 0.045;
  const dockY = o.y + h - h * 0.13;
  const tiles: Rect[] = [-1, 0, 1].map((i) => ({ x: o.x + o.w / 2 + i * tileW * 1.35 - tileW / 2, y: dockY, w: tileW, h: tileW }));
  const wireY = o.y + h - h * 0.035;
  const wire = { x0: o.x + o.w / 2 - o.w * 0.12, x1: o.x + o.w / 2 + o.w * 0.12, y: wireY };
  return { desk: { x: o.x, y: o.y, w: o.w, h }, win, tiles, wire, bar: { x: o.x, y: o.y, w: o.w, h: h * 0.045 } };
}
export const DESK = { WIN, deskGeom };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

/** the desk flat: paper colour, dot grid, wallpaper arcs, system bar (cached) */
function deskFlat(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, o: DeskOpts, g: ReturnType<typeof deskGeom>) {
  const R = g.desk;
  const key = `hw-desk/${o.key ?? ''}/${env.mood.id}/${env.layer.id}/${R.w.toFixed(0)}/${(o.wallpaper ?? 1).toFixed(2)}`;
  f.cached(key, R.w, R.h, (cc) => {
    const paper = mixLab(mixLab(OS_COLORS.desk, env.mood.halo, 0.35), env.mood.haze, env.layer.haze * 0.6);
    const gr = cc.createLinearGradient(0, 0, 0, R.h);
    gr.addColorStop(0, mixLab(paper, env.mood.sky[0], 0.18));
    gr.addColorStop(1, mixLab(paper, env.mood.set, 0.14));
    cc.fillStyle = gr;
    cc.fillRect(0, 0, R.w, R.h);
    // the real desk's dot grid (24 css px pitch on a ~1232 px desk), 8 % ink
    const pitch = R.w / 52;
    cc.fillStyle = withAlpha(OS_COLORS.ink, 0.08);
    for (let y = pitch * 0.5; y < R.h; y += pitch) for (let x = pitch * 0.5; x < R.w; x += pitch) cc.fillRect(x, y, Math.max(0.6, R.w / 1400), Math.max(0.6, R.w / 1400));
    // the wallpaper (24 css px in from the sides, from under the system bar to the wire's row)
    const wp = o.wallpaper ?? 1;
    if (wp > 0) {
      cc.globalAlpha = wp;
      drawWallpaper(cc, { x: R.w * 0.02, y: R.h * 0.07, w: R.w * 0.96, h: R.h * 0.895 }, env, { alpha: Math.min(1, 2600 / TOTALS.storedWeights) * 0.5 });
      cc.globalAlpha = 1;
      // the dock clearing (the stylesheet masks the arcs round the dock)
      const cl = cc.createRadialGradient(R.w / 2, R.h * 0.93, 0, R.w / 2, R.h * 0.93, R.w * 0.17);
      cl.addColorStop(0, withAlpha(paper, 0.95));
      cl.addColorStop(0.7, withAlpha(paper, 0.6));
      cl.addColorStop(1, withAlpha(paper, 0));
      cc.fillStyle = cl;
      cc.fillRect(0, R.h * 0.6, R.w, R.h * 0.4);
    }
    // system bar
    cc.fillStyle = mixLab(paper, OS_COLORS.paper, 0.5);
    cc.fillRect(0, 0, R.w, g.bar.h);
    cc.fillStyle = withAlpha(OS_COLORS.ink, 0.16);
    cc.fillRect(0, g.bar.h, R.w, Math.max(0.6, R.w / 1200));
    cc.fillStyle = withAlpha(OS_COLORS.ink, 0.35);
    for (let i = 0; i < 3; i++) cc.fillRect(R.w * (0.02 + i * 0.045), g.bar.h * 0.38, R.w * 0.032, g.bar.h * 0.24);
  })(c, R.x, R.y);
}

function windowCard(c: CanvasRenderingContext2D, env: PaintEnv, id: WinId, r: Rect, o: DeskOpts, tr: number) {
  const s = WIN[id];
  const st = o.windows?.[id];
  const a = (st?.alpha ?? 1) * (1 - tr * 0.85);
  if (a <= 0.01) return;
  const focused = (o.focused ?? 'photos') === id;
  const sheet = mixLab(mixLab(OS_COLORS.sheet, env.mood.halo, 0.28), env.mood.haze, env.layer.haze * 0.6);
  const ink = mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
  const sw = st?.swing ?? 0;
  c.save();
  c.globalAlpha = a;
  // hang from the top centre so a swing rotates about the threads
  c.translate(r.x + r.w / 2, r.y);
  c.rotate(sw);
  c.translate(-r.w / 2, 0);
  // soft drop shadow (paper on paper)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.16);
  c.fillRect(r.w * 0.012, r.h * 0.02, r.w, r.h);
  c.fillStyle = sheet;
  c.beginPath();
  c.roundRect(0, 0, r.w, r.h, r.w * 0.02);
  c.fill();
  if (focused) {
    c.fillStyle = withAlpha(OS_COLORS.copper, 0.07);
    c.fill();
  }
  c.strokeStyle = withAlpha(OS_COLORS.ink, 0.18);
  c.lineWidth = lw(c, 1);
  c.stroke();
  // title strip
  const th = Math.max(10, r.h * 0.085);
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.25);
  c.fillRect(0, 0, r.w, th);
  c.fillStyle = withAlpha(ink, 0.85);
  textRole(c, 'texture', () => {
    c.font = `600 ${(th * 0.62).toFixed(1)}px ${FONT.display}`;
    c.textBaseline = 'middle';
    c.fillText(s.title, r.w * 0.04, th * 0.55);
  });
  // window controls (three small rings at the right of the title strip)
  c.strokeStyle = withAlpha(ink, 0.45);
  c.lineWidth = lw(c, 1);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(r.w - th * (0.55 + i * 0.75), th * 0.5, th * 0.17, 0, Math.PI * 2);
    c.stroke();
  }
  const body = { x: 0, y: th, w: r.w, h: r.h - th };
  if (id === 'monitor') monitorBody(c, env, body, o, ink, sheet);
  else if (id === 'notes') notesBody(c, env, body, o, ink);
  else photosBody(c, env, body, o, ink);
  // the rim kick: the backlight catches the sheet's top edge
  const rk = st?.rim ?? 0;
  if (rk > 0) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85 * rk);
    c.lineWidth = lw(c, 2.5);
    c.beginPath();
    c.moveTo(r.w * 0.02, 0);
    c.lineTo(r.w * 0.98, 0);
    c.stroke();
  }
  c.restore();
}

/** Monitor: sidebar THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493; the list of rows; the footer */
function monitorBody(c: CanvasRenderingContext2D, env: PaintEnv, b: Rect, o: DeskOpts, ink: string, sheet: string) {
  const sideW = b.w * 0.44;
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.12);
  c.fillRect(b.x, b.y, sideW, b.h);
  const fs = Math.min(b.h * 0.07, sideW * 0.115);
  const kick = clamp01(o.sidebarKick ?? 0);
  const fig = mixLab(ink, OS_COLORS.copper, kick * 0.8);
  textRole(c, o.monitorSubject ? 'subject' : 'texture', () => {
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(ink, 0.6);
    c.font = `600 ${(fs * 0.8).toFixed(1)}px ${FONT.sc}`;
    c.fillText('THIS PROGRAM', b.x + sideW * 0.1, b.y + fs * 1.6);
    const rows: [string, string][] = [
      ['State', '234'],
      ['Operations', '4,646'],
      ['Outputs', '493'],
    ];
    rows.forEach(([k, v], i) => {
      const y = b.y + fs * (3.1 + i * 1.55);
      c.fillStyle = withAlpha(ink, 0.75);
      c.font = `${(fs * 0.85).toFixed(1)}px ${FONT.text}`;
      c.fillText(k, b.x + sideW * 0.1, y);
      c.fillStyle = fig;
      c.font = `600 ${(fs * 0.95).toFixed(1)}px ${FONT.text}`;
      c.textAlign = 'right';
      c.fillText(v, b.x + sideW * 0.92, y);
      c.textAlign = 'left';
    });
  });
  // list rows: a name stub (texture bars) and a live number
  const footH = b.h * 0.1;
  const rowH = b.h * 0.062;
  const n = Math.floor((b.h - footH) / rowH) - 1;
  textRole(c, 'texture', () => {
    c.font = `${(rowH * 0.62).toFixed(1)}px ${FONT.mono}`;
    c.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const y = b.y + rowH * (i + 0.9);
      if (i % 2 === 0) {
        c.fillStyle = withAlpha(OS_COLORS.desk, 0.35);
        c.fillRect(b.x + sideW, y - rowH / 2, b.w - sideW, rowH);
      }
      c.fillStyle = withAlpha(ink, 0.3);
      c.fillRect(b.x + sideW + b.w * 0.04, y - rowH * 0.12, b.w * (0.12 + ((i * 37) % 9) * 0.015), rowH * 0.24);
      // live values: deterministic, ticking on twos when rowsTick is given (illustrative digits, never read)
      const tick = o.rowsTick !== undefined ? Math.floor(o.rowsTick * 6) : 0;
      const changes = o.rowsTick !== undefined && (i * 7 + tick) % 5 === 0;
      const v = ((i * 7919 + (changes ? tick * 131 : 0)) % 1000) / 8;
      c.fillStyle = withAlpha(changes ? mixLab(ink, OS_COLORS.copper, 0.7) : ink, 0.7);
      c.textAlign = 'right';
      c.fillText(v.toFixed(3), b.x + b.w * 0.95, y);
      c.textAlign = 'left';
    }
  });
  // footer: 130 layers · 9,909 weights (only these two figures)
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.2);
  c.fillRect(b.x, b.y + b.h - footH, b.w, footH);
  textRole(c, o.monitorSubject ? 'subject' : 'texture', () => {
    c.fillStyle = withAlpha(ink, 0.75);
    c.font = `${(footH * 0.5).toFixed(1)}px ${FONT.text}`;
    c.textBaseline = 'middle';
    c.fillText(`${TOTALS.layers} layers · ${TOTALS.storedWeights.toLocaleString('en-US')} weights`, b.x + b.w * 0.04, b.y + b.h - footH / 2);
  });
}

/** Notes: a short to-do list in a pen-like hand, its last line soft until ch12 (OS18) */
function notesBody(c: CanvasRenderingContext2D, env: PaintEnv, b: Rect, o: DeskOpts, ink: string) {
  const lh = b.h * 0.14;
  for (let i = 0; i < 5; i++) {
    const y = b.y + lh * (i + 1);
    c.strokeStyle = withAlpha(OS_COLORS.ink, 0.08);
    c.lineWidth = lw(c, 1);
    c.beginPath();
    c.moveTo(b.x + b.w * 0.06, y + lh * 0.3);
    c.lineTo(b.x + b.w * 0.94, y + lh * 0.3);
    c.stroke();
    if (i === 4) continue;
    // illegible pen scribble lines (texture): not text, so nothing in them can be read
    c.strokeStyle = withAlpha(ink, 0.55);
    c.lineWidth = lw(c, 1.3);
    c.beginPath();
    const len = b.w * (0.5 + ((i * 29) % 7) * 0.05);
    for (let k = 0; k <= 40; k++) {
      const x = b.x + b.w * 0.08 + (len * k) / 40;
      const yy = y + Math.sin(k * 1.9 + i) * lh * 0.12 - Math.abs(Math.sin(k * 0.7 + i * 3)) * lh * 0.12;
      if (k === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
  // the last line: 'Wire one more neuron by hand' (OS18); soft (blurred) until notesLast rises
  const s = clamp01(o.notesLast ?? 0);
  const y = b.y + lh * 5;
  c.save();
  if (s < 0.98) c.filter = `blur(${((1 - s) * 2.6).toFixed(2)}px)`;
  c.fillStyle = withAlpha(ink, 0.35 + 0.5 * s);
  textRole(c, s > 0.5 ? 'subject' : 'texture', () => {
    c.font = `italic ${(lh * 0.62).toFixed(1)}px ${FONT.fell}`;
    c.textBaseline = 'alphabetic';
    c.fillText('Wire one more neuron by hand', b.x + b.w * 0.08, y);
  });
  c.restore();
}

/** Photos: a 4 × 3 grid of twelve tiny landscape cut-outs (hills, a lake, a tree line) */
function photosBody(c: CanvasRenderingContext2D, env: PaintEnv, b: Rect, o: DeskOpts, ink: string) {
  const lit = o.photosLit ?? 12;
  const cols = 4, rows = 3;
  const pad = b.w * 0.04;
  const cw = (b.w - pad * (cols + 1)) / cols;
  const ch = (b.h - pad * (rows + 1)) / rows;
  for (let i = 0; i < 12; i++) {
    const cx = b.x + pad + (i % cols) * (cw + pad);
    const cy = b.y + pad + Math.floor(i / cols) * (ch + pad);
    const on = clamp01(lit - i);
    const sky = mixLab(mixLab(env.mood.sky[2], env.mood.halo, 0.3), env.mood.core, 0.25 * on);
    c.fillStyle = sky;
    c.fillRect(cx, cy, cw, ch);
    c.fillStyle = mixLab(env.mood.set, ink, 0.4);
    c.beginPath();
    const kind = i % 3;
    c.moveTo(cx, cy + ch);
    for (let k = 0; k <= 8; k++) {
      const x = cx + (cw * k) / 8;
      const h = kind === 0 ? 0.45 + 0.2 * Math.sin(k * 0.9 + i) : kind === 1 ? 0.3 + 0.05 * Math.sin(k * 2 + i) : 0.38 + 0.18 * Math.abs(Math.sin(k * 1.7 + i));
      c.lineTo(x, cy + ch * (1 - h));
    }
    c.lineTo(cx + cw, cy + ch);
    c.closePath();
    c.fill();
    if (kind === 1) {
      c.fillStyle = withAlpha(env.mood.rim, 0.45);
      c.fillRect(cx + cw * 0.15, cy + ch * 0.78, cw * 0.6, ch * 0.06);
    }
  }
}

/** the X-ray components, lit inside the thinned desk */
function xrayLayer(c: CanvasRenderingContext2D, env: PaintEnv, R: Rect, o: DeskOpts) {
  const x = o.xray ?? {};
  const warm = mixLab(env.mood.core, '#fff3d6', 0.15);
  // the source table: 234 pigeonholes, three rows of 78, lighting left to right (column by column)
  if ((x.table ?? 0) > 0) {
    const n = TOTALS.sourceCells;
    const u = clamp01(x.table ?? 0);
    const per = Math.ceil(n / 3);
    const x0 = R.x + R.w * 0.06, w = R.w * 0.88;
    const cw = w / per;
    const y0 = R.y + R.h * 0.5;
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / 3), row = i % 3;
      const on = clamp01(u * n - i);
      const cx = x0 + col * cw, cy = y0 + row * cw * 1.3;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
      c.fillRect(cx, cy, cw * 0.86, cw * 1.1);
      if (on > 0) {
        c.fillStyle = withAlpha(warm, 0.85 * on);
        c.fillRect(cx + cw * 0.12, cy + cw * 0.12, cw * 0.62, cw * 0.86);
      }
    }
  }
  // gates: 2,776 ReGLU ramps (tiny ramp glyphs) and 59 boolean detents (small square shutters)
  if ((x.gates ?? 0) > 0) {
    const u = clamp01(x.gates ?? 0);
    const N = TOTALS.reglu;
    const cols = 104;
    const gw = (R.w * 0.86) / cols;
    const x0 = R.x + R.w * 0.07, y0 = R.y + R.h * 0.18;
    c.strokeStyle = withAlpha(warm, 0.75);
    c.lineWidth = Math.max(lw(c, 0.8), gw * 0.18);
    c.beginPath();
    const lit = Math.floor(u * N);
    for (let i = 0; i < lit; i++) {
      const cx = x0 + (i % cols) * gw, cy = y0 + Math.floor(i / cols) * gw * 1.15;
      c.moveTo(cx, cy + gw * 0.7);
      c.lineTo(cx + gw * 0.3, cy + gw * 0.7);
      c.lineTo(cx + gw * 0.62, cy + gw * 0.1);
      c.lineTo(cx + gw * 0.85, cy + gw * 0.1);
    }
    c.stroke();
    const nb = TOTALS.boolean;
    const by = y0 + Math.ceil(N / cols) * gw * 1.15 + gw;
    for (let i = 0; i < nb; i++) {
      const on = clamp01(u * nb - i);
      const cx = x0 + (i % 59) * gw * 1.6 * (104 / 96);
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
      c.fillRect(cx, by, gw * 1.1, gw * 1.1);
      if (on > 0) {
        c.fillStyle = withAlpha(warm, 0.9 * on);
        c.fillRect(cx + gw * 0.2, by + gw * 0.2, gw * 0.7, gw * 0.7 * ((i * 5) % 2 ? 1 : 0.35));
      }
    }
  }
  // the loom: 130 thin frames across the desk, each as tall as its layer's operation count (log)
  if ((x.loom ?? 0) > 0) {
    const u = clamp01(x.loom ?? 0);
    const L = CIRCUIT.layers;
    const maxOps = Math.max(...L.map((l) => l.operations));
    const x0 = R.x + R.w * 0.06, w = R.w * 0.88;
    const base = R.y + R.h * 0.84;
    L.forEach((l, i) => {
      const on = clamp01(u * L.length - i);
      if (on <= 0) return;
      const fx = x0 + (w * (i + 0.5)) / L.length;
      const h = R.h * (0.12 + 0.55 * (Math.log(1 + l.operations) / Math.log(1 + maxOps)));
      c.strokeStyle = withAlpha(warm, 0.75 * on);
      c.lineWidth = Math.max(lw(c, 0.9), w / L.length * 0.32);
      c.beginPath();
      c.moveTo(fx, base);
      c.lineTo(fx, base - h);
      c.stroke();
    });
  }
  // the host clockwork's ratchet: 300 teeth and a release pawl
  if ((x.clockwork ?? 0) > 0) {
    const u = clamp01(x.clockwork ?? 0);
    const cx = R.x + R.w * 0.5, cy = R.y + R.h * 0.5, r = R.h * 0.3;
    c.strokeStyle = withAlpha(warm, 0.85 * u);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    for (let i = 0; i <= 300; i++) {
      const a = (i / 300) * Math.PI * 2;
      const rr = i % 1 === 0 ? r : r;
      const a2 = a + (Math.PI * 2) / 300 * 0.8;
      if (i === 0) c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      c.lineTo(cx + Math.cos(a) * (r * 0.96), cy + Math.sin(a) * (r * 0.96));
      c.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    }
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    c.moveTo(cx + r * 0.12, cy);
    c.arc(cx, cy, r * 0.12, 0, Math.PI * 2);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      c.moveTo(cx + Math.cos(a) * r * 0.12, cy + Math.sin(a) * r * 0.12);
      c.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
    }
    // the pawl
    c.moveTo(cx + r * 1.25, cy - r * 0.55);
    c.lineTo(cx + r * 0.98, cy - r * 0.18);
    c.stroke();
  }
}

/** a single valve drawn DARK (nothing is trained), against a soft lit pane so its silhouette reads */
function darkValve(c: CanvasRenderingContext2D, env: PaintEnv, R: Rect, u: number) {
  const cx = R.x + R.w * 0.5, cy = R.y + R.h * 0.5, s = R.h * 0.2;
  c.save();
  c.globalAlpha = u;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * 2.6);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.3), 0.75));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - s * 2.6, cy - s * 2.6, s * 5.2, s * 5.2);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(cx - s * 1.5, cy - s * 0.13, s * 3, s * 0.26); // the channel
  c.moveTo(cx + s * 0.42, cy);
  c.arc(cx, cy, s * 0.42, 0, Math.PI * 2); // the body
  c.rect(cx - s * 0.06, cy - s * 1.05, s * 0.12, s * 0.66); // the sluice stem
  c.rect(cx - s * 0.36, cy - s * 1.1, s * 0.72, s * 0.11); // its gate head
  c.fill();
  c.restore();
}

/**
 * Paint the desk inside a layer (call from f.layer(...)). Static art (paper, dot grid, wallpaper, system bar) is
 * baked with f.cached; windows, dock, wire and X-ray are drawn live (cheap) so pushes stay sharp.
 */
export function handwiredDesk(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, o: DeskOpts) {
  const g = deskGeom(o);
  const R = g.desk;
  const tr = clamp01(o.translucency ?? 0);
  const lamp = o.lamp ?? 1;
  // proscenium: a black card frame round the desk (toy theatre), and its top beam the threads hang from
  if (o.proscenium !== false) {
    const ink = env.fill('ink');
    const m = R.w * 0.05;
    c.fillStyle = ink;
    c.beginPath();
    c.rect(R.x - m, R.y - m * 1.6, R.w + 2 * m, R.h + m * 2.4);
    c.rect(R.x, R.y, R.w, R.h);
    c.fill('evenodd');
    // a scalloped valance along the top beam
    c.beginPath();
    const n = 14;
    for (let i = 0; i < n; i++) {
      const x0 = R.x + (R.w * i) / n;
      c.moveTo(x0, R.y);
      c.quadraticCurveTo(x0 + R.w / n / 2, R.y + m * 0.5, x0 + R.w / n, R.y);
    }
    c.fill();
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
    c.lineWidth = lw(c, 1.8);
    c.beginPath();
    c.moveTo(R.x - m, R.y - m * 1.6);
    c.lineTo(R.x + R.w + m, R.y - m * 1.6);
    c.stroke();
  }
  c.save();
  c.beginPath();
  c.rect(R.x, R.y, R.w, R.h);
  c.clip();
  c.globalAlpha = 1 - tr * 0.45;
  deskFlat(f, c, env, o, g);
  c.globalAlpha = 1;
  // the X-ray: the paper thins toward the lamp behind it, and the lit component shows through
  if (tr > 0) {
    const gl = c.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, 0, R.x + R.w / 2, R.y + R.h / 2, R.w * 0.6);
    gl.addColorStop(0, withAlpha(env.mood.core, 0.22 * tr));
    gl.addColorStop(1, withAlpha(env.mood.halo, 0.05 * tr));
    c.fillStyle = gl;
    c.fillRect(R.x, R.y, R.w, R.h);
  }
  // dock and wire
  const lift = clamp01(o.dockLift ?? 0);
  g.tiles.forEach((t, i) => {
    const y = t.y - lift * t.h * 0.12 * (1 - Math.abs(i - 1) * 0.3);
    c.fillStyle = withAlpha(mixLab(OS_COLORS.sheet, env.mood.halo, 0.3), 1 - tr * 0.5);
    c.beginPath();
    c.roundRect(t.x, y, t.w, t.h, t.w * 0.2);
    c.fill();
    c.strokeStyle = withAlpha(OS_COLORS.ink, 0.25);
    c.lineWidth = lw(c, 1);
    c.stroke();
  });
  const wg = clamp01(o.wire ?? 0.3);
  const cop = mixLab(OS_COLORS.copper, env.mood.core, wg * 0.5);
  c.strokeStyle = cop;
  c.lineWidth = Math.max(lw(c, 1.5), R.w / 900);
  c.beginPath();
  c.moveTo(g.wire.x0, g.wire.y);
  c.lineTo(g.wire.x1, g.wire.y);
  c.stroke();
  for (const ex of [g.wire.x0 - R.w * 0.003, g.wire.x1 + R.w * 0.003]) {
    c.beginPath();
    c.arc(ex, g.wire.y, R.w * 0.0035, 0, Math.PI * 2);
    c.stroke();
  }
  if (wg > 0.3) {
    const gw = c.createRadialGradient(R.x + R.w / 2, g.wire.y, 0, R.x + R.w / 2, g.wire.y, R.w * 0.16);
    gw.addColorStop(0, withAlpha(env.mood.core, 0.35 * (wg - 0.3)));
    gw.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = gw;
    c.fillRect(R.x + R.w * 0.3, g.wire.y - R.w * 0.08, R.w * 0.4, R.w * 0.16);
    c.restore();
  }
  c.restore();
  // threads from the proscenium beam to each window's top corners, then the windows
  (['monitor', 'notes', 'photos'] as WinId[]).forEach((id) => {
    const r = g.win[id];
    if (o.proscenium !== false) {
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, OS_COLORS.ink, 0.4), 0.45 * (1 - tr * 0.5));
      c.lineWidth = lw(c, 0.9);
      c.beginPath();
      for (const fx of [0.15, 0.85]) {
        c.moveTo(r.x + r.w * fx, R.y - R.w * 0.04);
        c.lineTo(r.x + r.w * fx, r.y);
      }
      c.stroke();
    }
    windowCard(c, env, id, r, o, tr);
  });
  // the X-ray component, lit INSIDE the thinned desk: drawn over the thinned windows, clipped to the desk
  if (tr > 0) {
    c.save();
    c.beginPath();
    c.rect(R.x, R.y, R.w, R.h);
    c.clip();
    // the plate darkens like film held to the lamp: the paper and windows become ghosts, the inside shows
    c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.62 * tr);
    c.fillRect(R.x, R.y, R.w, R.h);
    if (o.xray) {
      c.globalCompositeOperation = 'lighter';
      xrayLayer(c, env, R, o);
      c.globalCompositeOperation = 'source-over';
      if ((o.xray.valve ?? 0) > 0) darkValve(c, env, R, clamp01(o.xray.valve ?? 0));
    }
    c.restore();
  }
  // the lamp dims everything a touch when low (no grey veil: darken toward the set ink)
  if (lamp < 1) {
    c.fillStyle = withAlpha(env.mood.ink, (1 - lamp) * 0.6);
    c.fillRect(R.x, R.y, R.w, R.h);
  }
}
