/**
 * durable-objects-unbound — THE WELL CUTAWAY and THE EPOCH SHELVES (staging.buildList.wellCutaway).
 *
 * The cutaway is the style bible's 'cutaway' register, serverCyan glints ONLY here: a vertical section below the
 * wellhead (the film's picture of S3's internals as Werner Vogels described them, 2021: caches that agree, a
 * per-object order, a witness that any cache can ask "is my copy stale?"). It is a METAPHOR (metaphor figure:
 * cast 'witness'), never a claim about S3's real layout.
 *
 *   shaftWalls(c, env, o)     the stone shaft section (static: bake it): x = centre, y0..y1, w; ledges at LEDGES
 *   cistern(c, env, o)        a stone cistern with a small lamp (o.lamp 0..1) and a faint mark reflected (o.mark 0..1),
 *                             o.stale 0..1 its old copy dimming; x, y = the cistern's base centre
 *   orderLedger(c, env, o)    a narrow paper ledger on a ledge advancing one line per change (o.lines fractional)
 *   proofSheets(c, env, o)    a sheaf of parchment proof sheets pinned along the wall (o.n shown, fractional)
 *   witnessBell(c, env, o)    the witness's hand-bell and its flag (o.ring 0..1, o.flag 0..1 raised)
 *   epochShelf(c, env, o)     a stone shelf in the Well's side (ch06-s03, ch06-s05, ch07-s04): an engraved epoch
 *                             label ('epoch 7' / '7'), items laid on it (scrolls, a Book at the start), o.empty
 *   LEDGES                    the ledge heights (relative to the shaft top) used by the crane
 */
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { SEA_CYAN, brass, clamp01, glowDot, paper, tone, type C2 } from './common';
import { engraved } from './neighbours';
import { book, scroll } from './walRibbon';

export const LEDGES = [220, 470, 720, 960];
export interface ShaftOpts {
  x: number;
  y0: number;
  y1: number;
  w: number;
}
export function shaftWalls(c: C2, env: PaintEnv, o: ShaftOpts): void {
  const set = env.fill('set');
  // the cut stone faces either side of the open section
  c.fillStyle = set;
  c.fillRect(o.x - o.w / 2 - 400, o.y0, 400, o.y1 - o.y0);
  c.fillRect(o.x + o.w / 2, o.y0, 400, o.y1 - o.y0);
  // the section's back wall: darker, with block courses
  // the section's back wall is LIT (cyan glints from the cisterns), so the dark machinery reads against it
  c.fillStyle = mixLab(set, env.mood.haze, 0.3);
  c.fillRect(o.x - o.w / 2, o.y0, o.w, o.y1 - o.y0);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.08);
  c.lineWidth = 1;
  for (let y = o.y0; y < o.y1; y += 34) {
    c.beginPath();
    c.moveTo(o.x - o.w / 2, y);
    c.lineTo(o.x + o.w / 2, y);
    c.stroke();
    for (let x = o.x - o.w / 2 + ((y / 34) % 2) * 40; x < o.x + o.w / 2; x += 80) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 34);
      c.stroke();
    }
  }
  // the cut edge of the section (where the wall 'dissolves'): a rough lit edge
  c.strokeStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.35);
  c.lineWidth = 1.5;
  for (const sx of [-1, 1]) {
    c.beginPath();
    for (let y = o.y0; y <= o.y1; y += 12) {
      const x = o.x + sx * (o.w / 2) + Math.sin(y * 0.13) * 3;
      if (y === o.y0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // ledges
  c.fillStyle = set;
  for (const ly of LEDGES) {
    if (o.y0 + ly > o.y1) continue;
    c.fillRect(o.x - o.w / 2, o.y0 + ly, o.w * 0.42, 12);
    c.fillRect(o.x + o.w * 0.08, o.y0 + ly + 120, o.w * 0.42, 12);
  }
}
export interface CisternOpts {
  x: number;
  y: number;
  s?: number;
  lamp: number;
  mark?: number;
  stale?: number;
  alpha?: number;
}
export function cistern(c: C2, env: PaintEnv, o: CisternOpts): void {
  const s = o.s ?? 1;
  const A = o.alpha ?? 1;
  c.save();
  c.globalAlpha *= A;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(o.x - 46 * s, o.y);
  c.lineTo(o.x - 40 * s, o.y - 58 * s);
  c.lineTo(o.x + 40 * s, o.y - 58 * s);
  c.lineTo(o.x + 46 * s, o.y);
  c.closePath();
  c.fill();
  // water surface inside (cyan glint)
  const cy = tone(env, SEA_CYAN, 0.25);
  c.fillStyle = mixLab(ink, cy, 0.25 + 0.4 * o.lamp);
  c.fillRect(o.x - 38 * s, o.y - 56 * s, 76 * s, 4 * s);
  // the reflected mark (the same faint mark in each cache)
  const mk = clamp01(o.mark ?? 0);
  if (mk > 0.01) {
    c.fillStyle = withAlpha(mixLab(cy, '#ffffff', 0.4), 0.8 * mk);
    c.fillRect(o.x - 8 * s, o.y - 55 * s, 16 * s, 2 * s);
  }
  // the old copy (a dim scroll) that dims when the witness's flag is seen
  const st = clamp01(o.stale ?? 0);
  if (st > 0.01) scroll(c, env, { x: o.x + 22 * s, y: o.y - 66 * s, s: 0.6 * s, rot: -0.3, alpha: st, tint: 'ghost' });
  // the cistern lamp on its rim
  c.fillStyle = ink;
  c.fillRect(o.x - 32 * s, o.y - 70 * s, 6 * s, 12 * s);
  c.restore();
  if (o.lamp > 0.01) glowDot(c, o.x - 29 * s, o.y - 70 * s, 22 * s, cy, 0.6 * o.lamp * A);
}
export function orderLedger(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; lines: number; alpha?: number }): void {
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.fillStyle = paper(env, 0.2);
  c.fillRect(o.x - 16 * s, o.y - 70 * s, 32 * s, 70 * s);
  c.strokeStyle = withAlpha('#20303a', 0.75);
  c.lineWidth = 1;
  const n = Math.max(0, o.lines);
  for (let i = 0; i < Math.min(12, Math.ceil(n)); i++) {
    const u = i < Math.floor(n) ? 1 : n - Math.floor(n);
    const yy = o.y - 64 * s + i * 5 * s;
    c.beginPath();
    c.moveTo(o.x - 12 * s, yy);
    c.lineTo(o.x - 12 * s + 22 * s * u, yy);
    c.stroke();
    // sequence ticks at the margin
    c.fillStyle = withAlpha(tone(env, SEA_CYAN, 0.3), 0.6 * u);
    c.fillRect(o.x + 11 * s, yy - 1, 2 * s, 2);
  }
  c.restore();
}
export function proofSheets(c: C2, env: PaintEnv, o: { x: number; y: number; n: number; s?: number; alpha?: number }): void {
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  for (let i = 0; i < Math.ceil(o.n); i++) {
    const u = clamp01(o.n - i);
    c.globalAlpha = (o.alpha ?? 1) * u;
    const x = o.x + ((i * 37) % 120) * s - 60 * s, y = o.y + i * 38 * s;
    c.save();
    c.translate(x, y);
    c.rotate(((i * 13) % 7) * 0.02 - 0.06);
    c.fillStyle = mixLab(paper(env, 0.1), '#d8c79c', 0.3);
    c.fillRect(-20 * s, -26 * s, 40 * s, 52 * s);
    c.strokeStyle = withAlpha('#2a2016', 0.4);
    c.lineWidth = 0.7;
    for (let r = 0; r < 7; r++) {
      c.beginPath();
      c.moveTo(-15 * s, -19 * s + r * 6 * s);
      c.lineTo((8 - ((r * 5) % 9)) * s, -19 * s + r * 6 * s);
      c.stroke();
    }
    // a pin at the top
    c.fillStyle = brass(env, 0.5);
    c.beginPath();
    c.arc(0, -24 * s, 1.6 * s, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.restore();
}
export function witnessBell(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; ring: number; flag: number }): void {
  const s = o.s ?? 1;
  c.save();
  // the bell in the witness's hand
  c.fillStyle = brass(env, 0.4 + 0.5 * o.ring);
  c.beginPath();
  c.moveTo(o.x - 5 * s, o.y);
  c.quadraticCurveTo(o.x - 6 * s, o.y - 9 * s, o.x, o.y - 10 * s);
  c.quadraticCurveTo(o.x + 6 * s, o.y - 9 * s, o.x + 5 * s, o.y);
  c.closePath();
  c.fill();
  // flag on a little mast beside the ledge
  const f = clamp01(o.flag);
  c.fillStyle = env.fill('ink');
  c.fillRect(o.x + 24 * s, o.y - 40 * s, 2 * s, 40 * s);
  c.fillStyle = tone(env, SEA_CYAN, 0.2);
  c.fillRect(o.x + 26 * s, o.y - (14 + 24 * f) * s, 12 * s, 7 * s);
  c.restore();
  if (o.ring > 0.01) glowDot(c, o.x, o.y - 5 * s, 22 * s, tone(env, SEA_CYAN, 0.3), 0.5 * o.ring);
}
export interface ShelfItem {
  kind: 'scroll' | 'book';
  alpha?: number;
  frayed?: number;
  ghost?: boolean;
  tag?: number;
}
export interface EpochShelfOpts {
  x: number;
  y: number;
  w: number;
  s?: number;
  label: string;
  labelLegible?: boolean;
  items: ShelfItem[];
  alpha?: number;
  /** a lamp / dim state for the whole shelf */
  lit?: number;
  id?: string;
}
/** a stone shelf cut into the Well's side, an engraved epoch label at its left end, items laid left → right */
export function epochShelf(c: C2, env: PaintEnv, o: EpochShelfOpts): void {
  const s = o.s ?? 1;
  const A = o.alpha ?? 1;
  c.save();
  c.globalAlpha *= A;
  const set = env.fill('ink');
  // the recess
  c.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
  c.fillRect(o.x, o.y - 46 * s, o.w, 46 * s);
  // the shelf slab
  c.fillStyle = set;
  c.fillRect(o.x - 6 * s, o.y, o.w + 12 * s, 9 * s);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.4);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(o.x - 6 * s, o.y);
  c.lineTo(o.x + o.w + 6 * s, o.y);
  c.stroke();
  // engraved label plate at the left end, sized to its label
  textRole(c, o.labelLegible ? 'subject' : 'texture', () => {
    let sz = 12 * s;
    if (o.labelLegible) sz = legibleSize(c, `600 ${sz}px ${FONT.sc}`, sz, o.label);
    c.font = `600 ${sz}px ${FONT.sc}`;
    const tw = c.measureText(o.label).width;
    c.fillStyle = brass(env, 0.25);
    c.fillRect(o.x + 4 * s, o.y + 11 * s, tw + sz * 0.9, sz * 1.45);
    engraved(c, env, o.label, o.x + 4 * s + (tw + sz * 0.9) / 2, o.y + 11 * s + sz * 1.08, sz, { legible: false, color: '#24180a' });
    if (o.labelLegible && o.id) textProbe(c, `${o.id}-label`, o.x + 4 * s, o.y + 11 * s, tw + sz * 0.9, sz * 1.45, A);
  });
  // items
  let x = o.x + 22 * s;
  for (const it of o.items) {
    const a = it.alpha ?? 1;
    if (it.kind === 'book') {
      book(c, env, { x: x + 4 * s, y: o.y, s: s * 0.9, alpha: a });
      x += 40 * s;
    } else {
      scroll(c, env, { x: x + 18 * s, y: o.y - 7 * s, s: s * 0.85, alpha: a, frayed: it.frayed, tint: it.ghost ? 'ghost' : 'none', tag: it.tag });
      x += 40 * s;
    }
  }
  c.restore();
}
