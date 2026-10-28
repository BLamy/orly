/**
 * handwired-explained — ch01-s02 / ch01-s03 / ch01-s04: the HandwiredOS desk staged as a TOY THEATRE in depth.
 *
 * The shared desk set (sets/handwiredDesk.ts) paints the desk flat (paper, dot grid, 9,909-arc wallpaper, dock and
 * the one copper wire) at L3. These painters add the theatre in front of it, so a push reads in depth:
 *   paperWindow(c, env, id, rect, st, o)  one hanging paper window (Monitor · Notes · Photos) for L4, with its
 *                                         rim kick, thread swing, Monitor's sidebar / live rows / footer, Photos'
 *                                         twelve landscape cells; o.subject makes Monitor's figures reading text
 *   windowThreads(c, env, rect, topY, a)  the two fine threads from the header beam to a window's top corners
 *   proscenium(c, env, o)                 the black card frame, scalloped valance and the marquee board that
 *                                         carries the title and the label (draw in PROSCENIUM, a sharp plane
 *                                         just in front of L4)
 *   cursorArrow(c, env, x, y, press)      the small paper cursor (no hand: the hands first appear in ch01-s05)
 *
 * Geometry (rest-screen stage px): THEATRE.desk is the desk flat; WIN the window rects (deskGeom fractions, so
 * they match every other appearance of the desk); every figure printed is TOTALS from the real circuit export.
 * Monitor's sidebar figures are sized so that, at the action-plane scale ch01-s03 opens on (>= 1.7), their cap
 * height clears the 22 px @1080p floor; at the ch01-s02 wide they are texture.
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { windowWall } from '../../../film/silhouette/architecture/walls';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { OS_COLORS, TOTALS } from './circuit';
import { deskGeom, type Rect, type WinId } from './handwiredDesk';

/** the desk flat (L3) and the theatre around it, rest-screen px */
export const THEATRE = { desk: { x: 260, y: 132, w: 760 } } as const;
export const DESK_G = deskGeom(THEATRE.desk);
export const WIN: Record<WinId, Rect> = DESK_G.win;
/** the proscenium plane: a hair in front of the hanging windows, sharp (it carries the marquee) */
export const PROSCENIUM: LayerSpec = { id: 'proscenium', z: 940, haze: 0.02, blur: 0 };
/** proscenium card geometry */
export const PRO = { side: 40, headTop: 30, headBottom: 132, apron: 30, openBottom: 702 } as const;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

export interface WinState {
  dx?: number;
  dy?: number;
  /** rim kick 0..1: the backlight catches the sheet's top edge */
  rim?: number;
  /** rotation about the top centre (radians): the threads' swing */
  swing?: number;
  alpha?: number;
}
export interface PaperWinOpts {
  /** the faint copper wash of the focused window */
  focused?: boolean;
  /** Monitor's sidebar + footer are the subject (reading text) */
  subject?: boolean;
  /** Monitor: the sidebar figures' warm kick 0..1 */
  sidebarKick?: number;
  /** Monitor: live rows tick (pass a time on twos); undefined = still */
  rowsTick?: number;
  /** Monitor: the live values pulse together 0..1 */
  livePulse?: number;
  /** Monitor: the footer strip slid into view 0..1 (default 1) */
  footer?: number;
  /** Photos: 0..12 cells caught by the light in reading order */
  photosLit?: number;
  /** Photos: seconds since the first cell caught the light, and cells per second (review r1: each tick reads at the
   *  wide: the cell lifts toward the halo with a warm top rim and a 0.12 s pop, and stays lit). Overrides photosLit. */
  photosClock?: number;
  photosRate?: number;
  /** 0..1: the window's printed ink (title, body, figures) apart from its paper (ch01-s04's gauze: ink goes first) */
  ink?: number;
  /** the paper thinning to a gauze (ch01-s04): 0..1 */
  gauze?: number;
}

const sheetCol = (env: PaintEnv) => mixLab(mixLab(OS_COLORS.sheet, env.mood.halo, 0.26), env.mood.haze, env.layer.haze * 0.6);
const inkCol = (env: PaintEnv) => mixLab(OS_COLORS.ink, env.mood.ink, 0.3);
const copperInk = (env: PaintEnv) => mixLab(OS_COLORS.copper, env.mood.ink, 0.12);

/** the two fine threads from the header beam (topY) down to the window's top corners */
export function windowThreads(c: CanvasRenderingContext2D, env: PaintEnv, r: Rect, st: WinState, topY: number, a = 1) {
  const x = r.x + (st.dx ?? 0), y = r.y + (st.dy ?? 0);
  const sw = st.swing ?? 0;
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, OS_COLORS.ink, 0.45), 0.55 * a);
  c.lineWidth = lw(c, 1);
  c.beginPath();
  for (const fx of [0.15, 0.85]) {
    // the corner after the swing (rotation about the top centre)
    const ox = (fx - 0.5) * r.w;
    const px = x + r.w / 2 + ox * Math.cos(sw);
    const py = y + ox * Math.sin(sw);
    c.moveTo(px - (py - topY) * Math.sin(sw) * 0.3, topY);
    c.lineTo(px, py);
  }
  c.stroke();
}

/** one hanging paper window (draw in L4 or a gauze plane) */
export function paperWindow(c: CanvasRenderingContext2D, env: PaintEnv, id: WinId, r: Rect, st: WinState = {}, o: PaperWinOpts = {}) {
  const a = clamp01(st.alpha ?? 1);
  if (a <= 0.005) return;
  const sheet = sheetCol(env);
  const ink = inkCol(env);
  const gz = clamp01(o.gauze ?? 0);
  const rk = clamp01(st.rim ?? 0);
  c.save();
  c.globalAlpha = a;
  // the rim kick lifts the sheet a hair toward the lamp (its shadow drops away behind it)
  c.translate(r.x + (st.dx ?? 0) + r.w / 2, r.y + (st.dy ?? 0) - 4 * rk);
  c.rotate(st.swing ?? 0);
  c.translate(-r.w / 2, 0);
  // paper on paper: a soft offset shadow on the desk behind
  if (gz < 0.5) {
    const so = 1 + 2.2 * rk;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, (0.18 + 0.14 * rk) * (1 - gz * 2));
    c.beginPath();
    c.roundRect(r.w * 0.014 * so, r.h * 0.022 * so + 4 * rk, r.w, r.h, r.w * 0.02);
    c.fill();
  }
  c.fillStyle = sheet;
  c.beginPath();
  c.roundRect(0, 0, r.w, r.h, r.w * 0.02);
  c.fill();
  if (o.focused) {
    c.fillStyle = withAlpha(OS_COLORS.copper, 0.07);
    c.fill();
  }
  c.strokeStyle = withAlpha(OS_COLORS.ink, 0.2);
  c.lineWidth = lw(c, 1);
  c.stroke();
  // the rim kick's paper lift: the sheet brightens a few per cent toward the lamp while its edge catches
  if (rk > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#fffaf0', 0.3), 0.3 * rk);
    c.beginPath();
    c.roundRect(0, 0, r.w, r.h, r.w * 0.02);
    c.fill();
  }
  // title strip
  const th = Math.max(12, r.h * 0.085);
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.3);
  c.fillRect(0, 0, r.w, th);
  const inkA = clamp01(o.ink ?? 1);
  c.globalAlpha = a * inkA;
  if (inkA > 0.005) {
    c.fillStyle = withAlpha(ink, 0.85);
    textRole(c, 'texture', () => {
      c.font = `600 ${(th * 0.62).toFixed(1)}px ${FONT.display}`;
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.fillText(id === 'monitor' ? 'Monitor' : id === 'notes' ? 'Notes' : 'Photos', r.w * 0.04, th * 0.55);
    });
    c.strokeStyle = withAlpha(ink, 0.45);
    c.lineWidth = lw(c, 1);
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(r.w - th * (0.55 + i * 0.75), th * 0.5, th * 0.17, 0, Math.PI * 2);
      c.stroke();
    }
    const body: Rect = { x: 0, y: th, w: r.w, h: r.h - th };
    if (id === 'monitor') monitorBody(c, env, body, o, ink, sheet);
    else if (id === 'notes') notesBody(c, body, ink);
    else photosBody(c, env, body, o, ink);
  }
  c.globalAlpha = a;
  // the rim kick: the top edge and the side facing the light (frame centre) catch it in a warm 3 px cut, the title
  // strip warms
  if (rk > 0) {
    const litRight = r.x + r.w / 2 < 640;
    c.strokeStyle = withAlpha(mixLab(mixLab(OS_COLORS.copper, env.mood.core, 0.45), env.mood.rim, 0.2), 0.95 * rk);
    c.lineWidth = lw(c, 3);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    if (litRight) {
      c.moveTo(r.w * 0.02, 0.8);
      c.lineTo(r.w - 0.8, 0.8);
      c.lineTo(r.w - 0.8, r.h * 0.98);
    } else {
      c.moveTo(0.8, r.h * 0.98);
      c.lineTo(0.8, 0.8);
      c.lineTo(r.w * 0.98, 0.8);
    }
    c.stroke();
    c.fillStyle = withAlpha(mixLab(env.mood.halo, OS_COLORS.copper, 0.25), 0.22 * rk);
    c.fillRect(0, 0, r.w, th);
  }
  // the gauze: the paper thins toward the light behind it
  if (gz > 0) {
    c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.55 * gz);
    c.beginPath();
    c.roundRect(0, 0, r.w, r.h, r.w * 0.02);
    c.fill();
  }
  c.restore();
}

/** Monitor's real sidebar: THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493; live rows; the footer */
function monitorBody(c: CanvasRenderingContext2D, env: PaintEnv, b: Rect, o: PaperWinOpts, ink: string, sheet: string) {
  const k = b.w / 319; // sizes are authored for the 319 px Monitor of the theatre
  const sideW = b.w * 0.52;
  c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.14);
  c.fillRect(b.x, b.y, sideW, b.h);
  c.fillStyle = withAlpha(OS_COLORS.ink, 0.12);
  c.fillRect(b.x + sideW, b.y, Math.max(lw(c, 1), 0.6 * k), b.h);
  const role = o.subject ? 'subject' : 'texture';
  const kick = clamp01(o.sidebarKick ?? 0);
  const fig = mixLab(ink, copperInk(env), 0.25 + kick * 0.75);
  const padX = sideW * 0.08;
  textRole(c, role, () => {
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(ink, 0.7);
    c.font = `600 ${(15 * k).toFixed(2)}px ${FONT.sc}`;
    c.fillText('THIS PROGRAM', b.x + padX, b.y + 30 * k);
    const rows: [string, string][] = [
      ['State', TOTALS.sourceCells.toLocaleString('en-US')],
      ['Operations', TOTALS.liveOperations.toLocaleString('en-US')],
      ['Outputs', '493'],
    ];
    rows.forEach(([lab, v], i) => {
      const y = b.y + (62 + i * 30) * k;
      c.fillStyle = withAlpha(ink, 0.8);
      c.font = `500 ${(15 * k).toFixed(2)}px ${FONT.text}`;
      c.textAlign = 'left';
      c.fillText(lab, b.x + padX, y);
      c.fillStyle = fig;
      c.font = `600 ${(16.5 * k).toFixed(2)}px ${FONT.text}`;
      c.textAlign = 'right';
      c.fillText(v, b.x + sideW - padX, y);
    });
    c.textAlign = 'left';
  });
  // a hairline rule under the heading, and the warm kick as a glow behind the figures
  c.fillStyle = withAlpha(ink, 0.25);
  c.fillRect(b.x + padX, b.y + 38 * k, sideW - 2 * padX, Math.max(lw(c, 1), 0.5 * k));
  if (kick > 0) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = withAlpha(mixLab(env.mood.halo, OS_COLORS.copper, 0.3), 0.25 * kick);
    c.fillRect(b.x + sideW * 0.55, b.y + 44 * k, sideW * 0.42, 96 * k);
    c.restore();
  }
  // the live rows: the program's own cells and operations (a name stub and a ticking value; texture)
  const footH = 30 * k;
  const rowH = 17 * k;
  const listX = b.x + sideW;
  const listW = b.w - sideW;
  const n = Math.floor((b.h - footH - 6 * k) / rowH);
  const tick = o.rowsTick !== undefined ? Math.floor(o.rowsTick * 6) : 0;
  const pulse = clamp01(o.livePulse ?? 0);
  textRole(c, 'texture', () => {
    c.font = `${(9.5 * k).toFixed(2)}px ${FONT.mono}`;
    c.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const y = b.y + 4 * k + rowH * (i + 0.5);
      if (i % 2 === 0) {
        c.fillStyle = withAlpha(OS_COLORS.desk, 0.4);
        c.fillRect(listX, y - rowH / 2, listW, rowH);
      }
      c.fillStyle = withAlpha(ink, 0.32);
      c.fillRect(listX + listW * 0.07, y - rowH * 0.1, listW * (0.22 + ((i * 37) % 9) * 0.03), rowH * 0.2);
      const changes = o.rowsTick !== undefined && (i * 7 + tick) % 4 === 0;
      const v = ((i * 7919 + tick * (changes ? 131 : 0) + (changes ? 0 : 0)) % 1000) / 8;
      const hot = changes ? 0.75 : 0;
      c.fillStyle = withAlpha(mixLab(ink, copperInk(env), Math.max(hot, pulse * 0.9)), 0.72 + 0.2 * pulse);
      c.textAlign = 'right';
      c.fillText(v.toFixed(3), listX + listW * 0.93, y);
    }
    c.textAlign = 'left';
  });
  if (pulse > 0) {
    // 'live': one warm value lift over the ticking column (+20 %), decaying with the pulse
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(mixLab(env.mood.halo, OS_COLORS.copper, 0.35), 0.2 * pulse);
    c.fillRect(listX + listW * 0.45, b.y, listW * 0.55, b.h - footH);
    c.restore();
  }
  // the footer strip: 130 layers · 9,909 weights (only these two figures), sliding up into view
  const fu = clamp01(o.footer ?? 1);
  if (fu > 0) {
    c.save();
    c.beginPath();
    c.rect(b.x, b.y + b.h - footH, b.w, footH);
    c.clip();
    const yOff = (1 - fu) * footH;
    c.fillStyle = mixLab(sheet, OS_COLORS.desk, 0.26);
    c.fillRect(b.x, b.y + b.h - footH + yOff, b.w, footH);
    c.fillStyle = withAlpha(OS_COLORS.ink, 0.18);
    c.fillRect(b.x, b.y + b.h - footH + yOff, b.w, Math.max(lw(c, 1), 0.5 * k));
    textRole(c, o.subject ? 'subject' : 'texture', () => {
      c.fillStyle = withAlpha(ink, 0.85 * fu);
      c.font = `500 ${(15 * k).toFixed(2)}px ${FONT.text}`;
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.fillText(`${TOTALS.layers} layers · ${TOTALS.storedWeights.toLocaleString('en-US')} weights`, b.x + padX, b.y + b.h - footH / 2 + yOff + k);
    });
    c.restore();
  }
}

/** Notes: a short to-do list in a pen-like hand; illegible scribble only (its last line is ch12's plant) */
function notesBody(c: CanvasRenderingContext2D, b: Rect, ink: string) {
  const lh = b.h * 0.15;
  for (let i = 0; i < 5; i++) {
    const y = b.y + lh * (i + 1);
    c.strokeStyle = withAlpha(OS_COLORS.ink, 0.08);
    c.lineWidth = lw(c, 1);
    c.beginPath();
    c.moveTo(b.x + b.w * 0.06, y + lh * 0.3);
    c.lineTo(b.x + b.w * 0.94, y + lh * 0.3);
    c.stroke();
    // a small tick box
    c.strokeStyle = withAlpha(ink, 0.4);
    c.strokeRect(b.x + b.w * 0.07, y - lh * 0.22, lh * 0.32, lh * 0.32);
    c.strokeStyle = withAlpha(ink, i === 4 ? 0.22 : 0.55);
    c.lineWidth = lw(c, i === 4 ? 2.2 : 1.3);
    c.beginPath();
    const len = b.w * (0.46 + ((i * 29) % 7) * 0.05);
    for (let k = 0; k <= 40; k++) {
      const x = b.x + b.w * 0.16 + (len * k) / 40;
      const yy = y - lh * 0.05 + Math.sin(k * 1.9 + i) * lh * 0.1 - Math.abs(Math.sin(k * 0.7 + i * 3)) * lh * 0.12;
      if (k === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
}

/** Photos: a 4 x 3 grid of twelve tiny landscape cut-outs (hills, a lake, a tree line) */
function photosBody(c: CanvasRenderingContext2D, env: PaintEnv, b: Rect, o: PaperWinOpts, ink: string) {
  const lit = o.photosLit ?? 0;
  const clock = o.photosClock;
  const rate = o.photosRate ?? 12;
  const cols = 4, rows = 3;
  const pad = b.w * 0.04;
  const cw = (b.w - pad * (cols + 1)) / cols;
  const ch = (b.h - pad * (rows + 1)) / rows;
  for (let i = 0; i < 12; i++) {
    const cx0 = b.x + pad + (i % cols) * (cw + pad);
    const cy0 = b.y + pad + Math.floor(i / cols) * (ch + pad);
    // the clocked tick: lit at i / rate, a 0.12 s pop (scale 1.04) about the cell's centre, then held lit
    const age = clock === undefined ? -1 : clock - i / rate;
    const on = clock === undefined ? clamp01(lit - i) : age >= 0 ? 1 : 0;
    const popK = age >= 0 && age < 0.12 ? Math.sin((age / 0.12) * Math.PI) : 0;
    c.save();
    if (popK > 0) {
      c.translate(cx0 + cw / 2, cy0 + ch / 2);
      c.scale(1 + 0.04 * popK, 1 + 0.04 * popK);
      c.translate(-(cx0 + cw / 2), -(cy0 + ch / 2));
    }
    const cx = cx0, cy = cy0;
    const base = mixLab(env.mood.sky[2], env.mood.halo, 0.35);
    c.fillStyle = clock === undefined ? mixLab(base, env.mood.core, 0.45 * on) : mixLab(base, mixLab(env.mood.halo, env.mood.core, 0.6), 0.55 * on);
    c.fillRect(cx, cy, cw, ch);
    c.fillStyle = mixLab(mixLab(env.mood.set, ink, 0.45), env.mood.haze, 0.08);
    c.beginPath();
    const kind = i % 3;
    c.moveTo(cx, cy + ch);
    for (let k = 0; k <= 10; k++) {
      const x = cx + (cw * k) / 10;
      const h = kind === 0 ? 0.45 + 0.2 * Math.sin(k * 0.8 + i) : kind === 1 ? 0.3 + 0.05 * Math.sin(k * 2 + i) : 0.36 + 0.2 * Math.abs(Math.sin(k * 1.7 + i));
      c.lineTo(x, cy + ch * (1 - h));
    }
    c.lineTo(cx + cw, cy + ch);
    c.closePath();
    c.fill();
    if (kind === 1) {
      c.fillStyle = withAlpha(env.mood.rim, 0.5 + 0.3 * on);
      c.fillRect(cx + cw * 0.15, cy + ch * 0.78, cw * 0.6, ch * 0.06);
    }
    if (kind === 2) {
      // a tree line: three small cut firs
      c.fillStyle = mixLab(env.mood.set, ink, 0.6);
      for (let t = 0; t < 3; t++) {
        const tx = cx + cw * (0.2 + t * 0.28), ty = cy + ch * 0.62;
        c.beginPath();
        c.moveTo(tx, ty - ch * 0.3);
        c.lineTo(tx + cw * 0.07, ty);
        c.lineTo(tx - cw * 0.07, ty);
        c.closePath();
        c.fill();
      }
    }
    if (on > 0 && on < 1) {
      c.fillStyle = withAlpha(env.mood.core, 0.4 * on);
      c.fillRect(cx, cy, cw, ch);
    }
    if (clock !== undefined && on > 0) {
      // lit: the hills lift toward the light too (+25-30 % value), a warm 1.5 px rim along the cell's top, a flash on the pop
      c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.28 + 0.3 * popK);
      c.fillRect(cx, cy, cw, ch);
      c.fillStyle = withAlpha(mixLab(OS_COLORS.copper, env.mood.core, 0.4), 0.95);
      c.fillRect(cx, cy, cw, lw(c, 1.5));
    }
    c.restore();
  }
}

export interface ProsceniumOpts {
  title?: string;
  titleA?: number;
  label?: string;
  labelA?: number;
  /** extra width beyond the frame the card must cover (camera moves) */
  pad?: number;
}
/**
 * The toy theatre's black card frame round the desk: wide side wings, a deep header with a marquee board (the title
 * in lamp-lit core, the label in italic under it), a scalloped valance along the opening's top, a shallow apron.
 * A finite card (the room and its backlight show round it): an arched crest with a fan of pierced slots, a column
 * of round piercings down each wing, two legs to the table.
 */
export function proscenium(c: CanvasRenderingContext2D, env: PaintEnv, o: ProsceniumOpts = {}) {
  const D = DESK_G.desk;
  const ink = PUPPET_NEAR_BLACK;
  const cardInk = mixLab(env.fill('ink'), ink, 0.4);
  const X0 = D.x - PRO.side - 30, X1 = D.x + D.w + PRO.side + 30;
  // the opening runs below the desk to a stage floor (stageFloor, painted on the desk's plane): a near apron any
  // higher would rise over the dock when the camera is close (true depth: nearer and higher than the dock)
  const OB = PRO.openBottom;
  const Y0 = PRO.headTop, Y1 = OB + PRO.apron + 10;
  c.fillStyle = cardInk;
  c.beginPath();
  // the card's outline: wings, the header, a raised arched crest in the middle (the hero profile)
  c.moveTo(X0, Y1);
  c.lineTo(X0, Y0 + 14);
  c.lineTo(X0 + 22, Y0);
  c.lineTo(520, Y0);
  c.quadraticCurveTo(540, Y0 - 4, 548, Y0 - 14);
  c.arc(640, Y0 + 6, 96, Math.PI * 1.05, Math.PI * 1.95);
  c.quadraticCurveTo(740, Y0 - 4, 760, Y0);
  c.lineTo(X1 - 22, Y0);
  c.lineTo(X1, Y0 + 14);
  c.lineTo(X1, Y1);
  c.closePath();
  // the opening
  c.rect(D.x, D.y, D.w, OB - D.y);
  // pierced detail: a fan of slots in the crest, quatrefoil piercings down each wing (the backlight shows through)
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.12 + (i * 0.76) / 8);
    const r0 = 34, r1 = 70;
    const ca = Math.cos(a), sa = Math.sin(a);
    const w = 0.07;
    c.moveTo(640 + ca * r0, Y0 + 6 + sa * r0);
    c.lineTo(640 + Math.cos(a - w) * r1, Y0 + 6 + Math.sin(a - w) * r1);
    c.lineTo(640 + Math.cos(a + w) * r1, Y0 + 6 + Math.sin(a + w) * r1);
    c.closePath();
  }
  for (const wx of [D.x - PRO.side / 2 - 15, D.x + D.w + PRO.side / 2 + 15]) {
    for (let y = D.y + 40; y < OB - 30; y += 74) {
      c.moveTo(wx + 8, y);
      c.arc(wx, y, 8, 0, Math.PI * 2);
      c.moveTo(wx + 2.5, y + 22);
      c.arc(wx, y + 22, 2.5, 0, Math.PI * 2);
    }
  }
  c.fill('evenodd');
  // the scalloped valance
  c.beginPath();
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x0 = D.x + (D.w * i) / n;
    c.moveTo(x0, D.y - 1);
    c.quadraticCurveTo(x0 + D.w / n / 2, D.y + 15, x0 + D.w / n, D.y - 1);
  }
  c.fill();
  // fine rim cut-lines: the opening's top and the marquee board's edges catch the lamp
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.strokeStyle = rim;
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(D.x - 1.5, D.y - 2);
  c.lineTo(D.x - 1.5, OB);
  c.moveTo(D.x + D.w + 1.5, D.y - 2);
  c.lineTo(D.x + D.w + 1.5, OB);
  c.stroke();
  // the marquee board (a recessed panel in the header)
  const mb = { x: 410, y: 38, w: 460, h: 84 };
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.4);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.roundRect(mb.x, mb.y, mb.w, mb.h, 6);
  c.stroke();
  // finials over the wings
  c.fillStyle = cardInk;
  for (const fx of [X0 + 12, X1 - 12]) {
    c.beginPath();
    c.arc(fx, Y0 - 6, 8, 0, Math.PI * 2);
    c.fill();
  }
  // the apron edge: a fine rule
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.35);
  c.lineWidth = lw(c, 1.2);
  c.beginPath();
  c.moveTo(D.x - PRO.side, OB + 10);
  c.lineTo(D.x + D.w + PRO.side, OB + 10);
  c.stroke();
  // the title and the label, lettered on the board in the lamp's light
  const ta = clamp01(o.titleA ?? 0), la = clamp01(o.labelA ?? 0);
  if (o.title && ta > 0) {
    textRole(c, 'subject', () => {
      c.save();
      c.globalAlpha = ta;
      c.fillStyle = mixLab(env.mood.core, '#fff8e8', 0.2);
      c.font = `600 34px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.letterSpacing = '1.5px';
      c.fillText(o.title!, mb.x + mb.w / 2, mb.y + 40);
      c.letterSpacing = '0px';
      c.restore();
    });
  }
  if (o.label && la > 0) {
    textRole(c, 'subject', () => {
      c.save();
      c.globalAlpha = la;
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 1);
      c.font = `italic 500 24px ${FONT.text}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(o.label!, mb.x + mb.w / 2, mb.y + 71);
      c.restore();
    });
  }
}

/** the paper cursor arrow: a white card arrow with an ink edge; press 0..1 dips it into the title bar */
export function cursorArrow(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, press = 0, a = 1) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha = a;
  c.translate(x, y + press * 1.5);
  c.rotate(-0.08 + press * 0.05);
  const s = 1 - press * 0.06;
  c.scale(s, s);
  const p = new Path2D();
  p.moveTo(0, 0);
  p.lineTo(0, 22);
  p.lineTo(5.5, 17);
  p.lineTo(9.5, 26);
  p.lineTo(13, 24.4);
  p.lineTo(9.2, 15.6);
  p.lineTo(16, 15.6);
  p.closePath();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25 * (1 - press * 0.6));
  c.save();
  c.translate(2.5 - press * 1.5, 3 - press * 2);
  c.fill(p);
  c.restore();
  c.fillStyle = mixLab('#fffdf8', env.mood.halo, 0.15);
  c.fill(p);
  c.strokeStyle = withAlpha(OS_COLORS.ink, 0.85);
  c.lineWidth = lw(c, 1.4);
  c.lineJoin = 'round';
  c.stroke(p);
  c.restore();
}

/** ch01-s03 (and ch01-s04's gauze, which must match it): the pool of lamp light settling on Monitor's sidebar */
export function sidebarPool(c: CanvasRenderingContext2D, env: PaintEnv, M: Rect, pool: number) {
  if (pool <= 0.005) return;
  const px = M.x + M.w * 0.27, py = M.y + M.h * 0.38;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(px, py);
  c.scale(1, 1.25);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, M.w * 0.42);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), pool));
  g.addColorStop(0.6, withAlpha(env.mood.halo, pool * 0.45));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-M.w * 0.42, -M.w * 0.42, M.w * 0.84, M.w * 0.84);
  c.restore();
}

/**
 * The workshop's tall paned window wall far behind the theatre (L2), shared by ch01-s02 and ch01-s03 so the dissolve
 * matches. Review r1: the wall and its glass sit at about 62 % of the kit's value with warmer, darker mullions, so the
 * lit theatre is the brightest thing in frame.
 */
export function theatreWall(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  const PAD = 320;
  f.cached(`ch01-s02/theatreWall/${env.mood.id}`, 1280 + 2 * PAD, 720 + PAD, (cc) => {
    cc.translate(PAD, PAD / 2);
    // the glass: a warm dusk over the backlight seen through the panes (it reads at ~62 % of the open sky)
    cc.fillStyle = withAlpha(mixLab('#3a2412', env.mood.ink, 0.25), 0.44);
    cc.fillRect(-PAD, -60, 1280 + 2 * PAD, 760);
    windowWall(cc, {
      x: -PAD, y: -60, w: 1280 + 2 * PAD, h: 760, centers: [-80, 250, 640, 1030, 1360], winW: 230, apex: 40, sill: 560,
      shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: 0.6, seed: 23,
    }, env);
    // the whole wall (glass included) down to ~62 % value, warmed: a dark umber laid over its own pixels only
    cc.globalCompositeOperation = 'source-atop';
    cc.fillStyle = withAlpha(mixLab('#2a1a0e', env.mood.ink, 0.3), 0.48);
    cc.fillRect(-PAD, -PAD, 1280 + 4 * PAD, 720 + 2 * PAD);
    cc.globalCompositeOperation = 'source-over';
  })(c, -PAD, -PAD / 2);
}

/**
 * The toy theatre's stage floor under the desk flat: worn boards running back to the desk's foot, the front edge
 * catching the lamp. Paint it in the DESK's layer (L3), before the desk, so it never rises over the dock.
 */
export function stageFloor(c: CanvasRenderingContext2D, env: PaintEnv) {
  const D = DESK_G.desk;
  const y0 = D.y + D.h - 2, y1 = PRO.openBottom + 40;
  const x0 = D.x - 60, x1 = D.x + D.w + 60;
  const wood = mixLab(env.fill('set'), env.fill('ink'), 0.55);
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, mixLab(wood, env.mood.halo, 0.12));
  g.addColorStop(1, mixLab(wood, env.fill('ink'), 0.4));
  c.fillStyle = g;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
  // boards: seams converging toward a vanishing point above the desk's centre
  const vx = D.x + D.w / 2, vy = D.y - 400;
  c.strokeStyle = withAlpha(env.fill('ink'), 0.35);
  c.lineWidth = lw(c, 1);
  c.beginPath();
  for (let i = -12; i <= 12; i++) {
    const bx = vx + i * 46;
    const tx = vx + (bx - vx) * ((y0 - vy) / (y1 - vy));
    c.moveTo(tx, y0);
    c.lineTo(bx, y1);
  }
  c.stroke();
  // the desk's foot casts a soft shadow on the boards, and the lamp warms the floor's middle
  const sh = c.createLinearGradient(0, y0, 0, y0 + 26);
  sh.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.45));
  sh.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = sh;
  c.fillRect(x0, y0, x1 - x0, 26);
  const warm = c.createRadialGradient(vx, y0 + 30, 0, vx, y0 + 30, 340);
  warm.addColorStop(0, withAlpha(env.mood.halo, 0.18));
  warm.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = warm;
  c.fillRect(x0, y0, x1 - x0, y1 - y0);
}
