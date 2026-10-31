/**
 * handwired-explained — ch04-s06 / ch04-s07: the SHUTTER GATE (review r1: the old 28 px shutters were unreadable).
 *
 *   gateBack(c, env, o)    the two lit apertures (backlight through the frame's windows), painted BEFORE the tiles
 *   gateFront(c, env, o)   the black frame (one frame, two windows: the 10 belt through the top, the 12 below), the
 *                          paper panels hanging from each window's head covering (1 − open) of the gap, and
 *                          quarter / half / three-quarter notches on the right post, so 'half open' reads at a glance
 *   slabTile(c, env, …)    a tile PRESSED by the shutter: its height is open × the tile's (a half-open shutter passes a
 *                          half-height 5), re-inked with what came through; a label too tall for the slab sits just
 *                          above it in pale ink cut out with a dark edge (reads on the lit windows and on the dark wall)
 *   bigDimmer(c, env, o)   ONE large paper dimmer knob with a pointer and a 0..1 arc (s06 'dimmer')
 *
 * Geometry is rest-screen L4 px; the belts' top surfaces are y10 / y12 (sets/ch04-s06-bench M6).
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { PAPER, PAPER_INK } from './ch04-s06-bench';
import { copperOf } from './narratorHands';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** the gate: outer width, post width, window gap (a tile is 41.6 px tall at TILE_S 1.6), head bar */
export const GATE = { W: 96, POST: 9, GAP: 46, HEAD: 16, FOOT: 12 } as const;
const IW = GATE.W - 2 * GATE.POST;

export interface GateOpts {
  x: number;
  y10: number;
  y12: number;
  /** open fraction of each window: 1 = clear, 0 = shut; > 1 funnels the exit side wide (s07), < 0 inverts */
  open10: number;
  open12: number;
  /** horizontal squash 0..1 (the paper flip into the dimmer knob) */
  sx?: number;
  /** the lit aperture's strength (0..1), default 1 */
  lit?: number;
  /** window gap height (default GATE.GAP; s07's bigger tiles need more) */
  gap?: number;
}

/** the lit apertures behind the tiles */
export function gateBack(c: C, env: PaintEnv, o: GateOpts) {
  const sx = o.sx ?? 1;
  if (sx <= 0.01) return;
  const lit = o.lit ?? 1;
  c.save();
  c.translate(o.x, 0);
  c.scale(sx, 1);
  const GAP = o.gap ?? GATE.GAP;
  for (const y of [o.y10, o.y12]) {
    const top = y - GAP;
    const g = c.createLinearGradient(0, top, 0, y);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.55), 0.8 * lit));
    g.addColorStop(1, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.62 * lit));
    c.fillStyle = g;
    c.fillRect(-IW / 2, top, IW, GAP);
  }
  c.restore();
}

function panel(c: C, env: PaintEnv, top: number, open: number, gap: number) {
  const cover = clamp01(1 - open);
  if (cover <= 0.001) return;
  const h = gap * cover;
  const paper = mixLab(mixLab(PAPER, env.mood.set, 0.42), PUPPET_NEAR_BLACK, 0.18);
  c.fillStyle = paper;
  c.fillRect(-IW / 2, top, IW, h);
  // fibre cut-lines on the paper
  c.strokeStyle = withAlpha(PAPER_INK, 0.16);
  c.lineWidth = 0.9;
  for (let i = 1; i < 5; i++) {
    const yy = top + h * (i / 5);
    c.beginPath();
    c.moveTo(-IW / 2 + 5, yy);
    c.lineTo(IW / 2 - 5, yy);
    c.stroke();
  }
  // the panel's weighted bottom edge (a black bar with a lamp-lit lip): where the tile is pressed
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-IW / 2, top + h - 4, IW, 4);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.9);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-IW / 2, top + h - 4);
  c.lineTo(IW / 2, top + h - 4);
  c.stroke();
}

/** the frame and panels, in front of the tiles */
export function gateFront(c: C, env: PaintEnv, o: GateOpts) {
  const sx = o.sx ?? 1;
  if (sx <= 0.01) return;
  const { POST, HEAD, FOOT, W } = GATE;
  const GAP = o.gap ?? GATE.GAP;
  const top10 = o.y10 - GAP, top12 = o.y12 - GAP;
  c.save();
  c.translate(o.x, 0);
  c.scale(sx, 1);
  panel(c, env, top10, o.open10, GAP);
  panel(c, env, top12, o.open12, GAP);
  const ink = PUPPET_NEAR_BLACK;
  c.fillStyle = ink;
  // head bar, middle bar (between the windows, the 10 belt runs across its top), foot
  c.fillRect(-W / 2, top10 - HEAD, W, HEAD);
  c.fillRect(-W / 2, o.y10, W, top12 - o.y10);
  c.fillRect(-W / 2 - 4, o.y12, W + 8, FOOT);
  // posts: the exit post funnels outward when a window is forced past fully open (s07)
  c.fillRect(-W / 2, top10 - HEAD, POST, o.y12 + FOOT - (top10 - HEAD));
  for (const [top, open] of [[top10, o.open10], [top12, o.open12]] as const) {
    const flare = Math.max(0, open - 1);
    c.beginPath();
    c.moveTo(W / 2 - POST, top);
    c.lineTo(W / 2, top);
    c.lineTo(W / 2 + flare * 22, top - flare * 16);
    c.lineTo(W / 2 + flare * 22 + POST, top - flare * 16);
    c.lineTo(W / 2 + POST * (1 - Math.min(1, flare)), top + GAP);
    c.lineTo(W / 2 - POST, top + GAP);
    c.closePath();
    c.fill();
  }
  c.fillRect(W / 2 - POST, top10 - HEAD, POST, HEAD);
  c.fillRect(W / 2 - POST, o.y10, POST, top12 - o.y10);
  // quarter / half / three-quarter notches on the inner face of the right post (marks, no numbers)
  const notchC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.9);
  c.strokeStyle = notchC;
  for (const top of [top10, top12]) {
    for (const q of [0.25, 0.5, 0.75]) {
      const yy = top + GAP * q;
      const long = q === 0.5;
      c.lineWidth = long ? 2 : 1.3;
      c.beginPath();
      c.moveTo(W / 2 - POST - (long ? 9 : 5), yy);
      c.lineTo(W / 2 - POST + 2, yy);
      c.stroke();
    }
  }
  // the lamp-side rim on the bars' tops
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-W / 2, top10 - HEAD);
  c.lineTo(W / 2, top10 - HEAD);
  c.moveTo(-W / 2, o.y10 + 0.5);
  c.lineTo(W / 2, o.y10 + 0.5);
  c.moveTo(-W / 2 - 4, o.y12 + 0.5);
  c.lineTo(W / 2 + 4, o.y12 + 0.5);
  c.stroke();
  // the copper pivot where the lever's link rod drives both panels
  c.fillStyle = copperOf(env, 0.35);
  c.beginPath();
  c.arc(0, o.y12 + FOOT / 2, 3.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export interface SlabOpts {
  /** tile scale (1 = 34 × 26 px) */
  s?: number;
  tint?: 'copper' | 'indigo';
  glow?: number;
}
/** a tile pressed to `frac` of its height, bottom-centre at (x, y), re-inked with `text` */
export function slabTile(c: C, env: PaintEnv, x: number, y: number, text: string, frac: number, o: SlabOpts = {}) {
  const s = o.s ?? 1;
  const w = 34 * s;
  const full = 26 * s;
  const h = Math.max(4 * s, full * clamp01(Math.abs(frac)));
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x - w / 2 + 2 * s, y - h + 2 * s, w, h);
  let paper = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.3), env.mood.core, (o.glow ?? 0) * 0.4);
  if (o.tint === 'copper') paper = mixLab(paper, '#b9673a', 0.55);
  if (o.tint === 'indigo') paper = mixLab(paper, '#3a5296', 0.62);
  c.fillStyle = paper;
  c.fillRect(x - w / 2, y - h, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.4;
  c.strokeRect(x - w / 2, y - h, w, h);
  textRole(c, 'subject', () => {
    const fs = 15 * s;
    c.font = `${fs.toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const cap = fs * 0.7;
    if (h >= cap + 2.5) {
      c.fillStyle = o.tint === 'indigo' ? '#f1ead8' : PAPER_INK;
      c.fillText(text, x, y - h / 2 + cap / 2);
    } else {
      // too flat for its numeral: the numeral stands just above the slab, cut out with a dark edge
      const by = y - h - 4 * s;
      c.lineJoin = 'round';
      c.strokeStyle = PUPPET_NEAR_BLACK;
      c.lineWidth = 5;
      c.strokeText(text, x, by);
      c.fillStyle = mixLab(PAPER, env.mood.core, 0.25);
      c.fillText(text, x, by);
    }
    c.textAlign = 'left';
  });
}

/** ONE large paper dimmer knob, centre (x, y), radius r, pointer at `open` on a 0..1 arc (sx: the paper flip) */
export function bigDimmer(c: C, env: PaintEnv, o: { x: number; y: number; r?: number; open: number; sx?: number }) {
  const r = o.r ?? 44;
  const sx = o.sx ?? 1;
  if (sx <= 0.01) return;
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  const pa = a0 + (a1 - a0) * clamp01(o.open);
  c.save();
  c.translate(o.x, o.y);
  c.scale(sx, 1);
  // a black backing plate (the shutter frame, turned): the knob is mounted on it
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(0, 0, r + 20, 0, Math.PI * 2);
  c.fill();
  // the 0..1 scale: ticks round the dial, the lit arc up to the setting
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  for (let i = 0; i <= 8; i++) {
    const a = a0 + (a1 - a0) * (i / 8);
    const L = i % 4 === 0 ? 13 : 8;
    c.moveTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
    c.lineTo(Math.cos(a) * (r + 4 + L), Math.sin(a) * (r + 4 + L));
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.6), 0.95);
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, r + 8, a0, pa);
  c.stroke();
  c.lineCap = 'butt';
  // the paper knob: a cut disc with a knurled edge and a faint shading
  const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, mixLab(PAPER, env.mood.core, 0.25));
  g.addColorStop(1, mixLab(PAPER, env.mood.set, 0.38));
  c.fillStyle = g;
  c.beginPath();
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const rr = i % 2 ? r : r - 2.5;
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(PAPER_INK, 0.35);
  c.lineWidth = 1;
  c.stroke();
  // the pointer: a black blade from the hub to the rim
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(Math.cos(pa + Math.PI / 2) * 5, Math.sin(pa + Math.PI / 2) * 5);
  c.lineTo(Math.cos(pa) * r * 0.92, Math.sin(pa) * r * 0.92);
  c.lineTo(Math.cos(pa - Math.PI / 2) * 5, Math.sin(pa - Math.PI / 2) * 5);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, 0, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = copperOf(env, 0.35);
  c.beginPath();
  c.arc(0, 0, 2.8, 0, Math.PI * 2);
  c.fill();
  // the arc's ends: 0 (off) and 1 (fully on)
  textRole(c, 'subject', () => {
    const fs = 22;
    c.font = `500 ${fs.toFixed(1)}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = mixLab(PAPER, env.mood.core, 0.2);
    const lr = r + 28;
    c.fillText('0', Math.cos(a0) * lr - 4, Math.sin(a0) * lr + 2);
    c.fillText('1', Math.cos(a1) * lr + 4, Math.sin(a1) * lr + 2);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  });
  c.restore();
}
