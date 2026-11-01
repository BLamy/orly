/**
 * durable-objects-unbound — THE RIBBON (SQLite's write-ahead log), SCROLLS and BOOKS (staging.buildList.walRibbon).
 *
 * Bindings (style bible §6; story ch06): a 32-byte LEADER card (the WAL header), then FRAMES: each a narrow TAB
 * (the 24-byte frame header) and a wider PAGE panel. A transaction's LAST frame carries a red INK STAMP whose number
 * is the database size in pages after that commit (the commit mark); other frames' tabs show an engraved 0.
 * Red ink stamps are never wax: wax seals belong only to celld's node-log sealing (neighbours.ts).
 *
 *   ribbon(c, env, o)        x, y = the left end of the ribbon's centre line; frames laid left → right
 *       o.frames   RibbonFrame[] ({ kind: 'leader' } | { kind: 'frame', stamp?: number, pasted?, page? })
 *       o.shown    how many cards are unspooled (fractional: the last one slides in)
 *       o.s        scale (1: tab 14 px, page 40 px, ribbon 46 px tall)
 *       o.labels   0..1 show '32 bytes' on the leader and '24' on each tab (legible when o.legible)
 *       o.glow     0..1 the commit stamps glow faintly
 *       o.cutAfter indices after which the ribbon has been cut (a scissor gap)
 *   ribbonLayout(o)          x positions of every card (for cameras, scissors, cut points)
 *   scroll(c, env, o)        a cut length rolled and tied: cord with a knot-tag (tally + length mark); frayed/short
 *   book(c, env, o)          a bound Book (snapshot) with an optional tag ('session 7' / 'epoch 7')
 *   ledger(c, env, o)        SQLite's main file as a bound ledger with `pages` page edges showing
 */
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { INK_RED, brass, clamp01, paper, sm, tone, type C2 } from './common';

export type RibbonFrame = { kind: 'leader' } | { kind: 'frame'; stamp?: number | null; pasted?: number; dim?: number };
export interface RibbonOpts {
  x: number;
  y: number;
  s?: number;
  frames: RibbonFrame[];
  shown?: number;
  labels?: number;
  legible?: boolean;
  glow?: number;
  cutAfter?: number[];
  /** gap (px at s = 1) opened at each cut */
  cutGap?: number;
  alpha?: number;
  id?: string;
  /** 0..1 how far a stamp has been pressed on each frame index (default 1 when stamp set) */
  stampU?: (i: number) => number;
}
const LEADER_W = 30, TAB_W = 14, PAGE_W = 40, RIB_H = 46, GAP = 3;
export function ribbonLayout(o: Pick<RibbonOpts, 'x' | 's' | 'frames' | 'cutAfter' | 'cutGap'>): { x0: number; x1: number }[] {
  const s = o.s ?? 1;
  let x = o.x;
  const out: { x0: number; x1: number }[] = [];
  o.frames.forEach((fr, i) => {
    const w = (fr.kind === 'leader' ? LEADER_W : TAB_W + PAGE_W) * s;
    out.push({ x0: x, x1: x + w });
    x += w + GAP * s;
    if (o.cutAfter?.includes(i)) x += (o.cutGap ?? 14) * s;
  });
  return out;
}
export function ribbon(c: C2, env: PaintEnv, o: RibbonOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const lay = ribbonLayout(o);
  const shown = o.shown ?? o.frames.length;
  const h = RIB_H * s;
  const y0 = o.y - h / 2;
  const pap = paper(env, 0.05);
  const inkC = mixLab('#2a2016', env.mood.fg, 0.15);
  const lab = clamp01(o.labels ?? 0);
  c.save();
  c.globalAlpha *= A;
  o.frames.forEach((fr, i) => {
    const vis = clamp01(shown - i);
    if (vis <= 0.001) return;
    const L = lay[i];
    const slide = (1 - sm(vis)) * 26 * s;
    c.save();
    c.globalAlpha = A * sm(vis);
    c.translate(-slide, 0);
    if (fr.kind === 'leader') {
      c.fillStyle = mixLab(pap, '#c9b48a', 0.25);
      c.fillRect(L.x0, y0, L.x1 - L.x0, h);
      c.strokeStyle = withAlpha(inkC, 0.7);
      c.lineWidth = 1;
      c.strokeRect(L.x0 + 2 * s, y0 + 2 * s, L.x1 - L.x0 - 4 * s, h - 4 * s);
      if (lab > 0.01) cardText(c, '32 bytes', L.x0, y0 - 8 * s, 10 * s, inkC, A * lab * sm(vis), o.legible, `${o.id ?? 'rib'}-leader`, true);
    } else {
      const dim = fr.dim ?? 0;
      // tab
      c.fillStyle = mixLab(mixLab(pap, '#cdb68c', 0.3), env.mood.fg, dim);
      c.fillRect(L.x0, y0, TAB_W * s, h);
      // page panel with faint ink rows
      c.fillStyle = mixLab(pap, env.mood.fg, dim);
      c.fillRect(L.x0 + TAB_W * s, y0, PAGE_W * s, h);
      c.strokeStyle = withAlpha(inkC, 0.28 * (1 - dim));
      c.lineWidth = 0.8;
      for (let r = 0; r < 5; r++) {
        const yy = y0 + (8 + r * 7.5) * s;
        c.beginPath();
        c.moveTo(L.x0 + (TAB_W + 5) * s, yy);
        c.lineTo(L.x0 + (TAB_W + PAGE_W - 5 - ((i * 7 + r * 3) % 9)) * s, yy);
        c.stroke();
      }
      c.strokeStyle = withAlpha(inkC, 0.5);
      c.beginPath();
      c.moveTo(L.x0 + TAB_W * s, y0);
      c.lineTo(L.x0 + TAB_W * s, y0 + h);
      c.stroke();
      // the '24' sits BELOW each tab (the leader's '32 bytes' sits above), so the two labels never collide
      if (lab > 0.01) cardText(c, '24', L.x0 + (TAB_W * s) / 2, y0 + h + 15 * s, 10 * s, inkC, A * lab * sm(vis), o.legible, `${o.id ?? 'rib'}-tab${i}`, true);
      // the commit field on the tab: a red stamp with the page count, else an engraved 0
      const tx = L.x0 + (TAB_W * s) / 2, ty = y0 + h * 0.62;
      if (fr.stamp != null) {
        const u = o.stampU ? clamp01(o.stampU(i)) : 1;
        if (u > 0.01) {
          const g = clamp01(o.glow ?? 0);
          c.save();
          c.translate(tx, ty);
          c.scale(0.6 + 0.4 * sm(u), 0.6 + 0.4 * sm(u));
          c.globalAlpha = A * sm(vis) * sm(u);
          c.fillStyle = tone(env, INK_RED, 0.12);
          c.beginPath();
          c.arc(0, 0, 9 * s, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = withAlpha(mixLab(INK_RED, '#ffffff', 0.2), 0.7);
          c.lineWidth = 0.8 * s;
          c.beginPath();
          c.arc(0, 0, 7 * s, 0, Math.PI * 2);
          c.stroke();
          if (g > 0.01) {
            c.globalCompositeOperation = 'lighter';
            c.fillStyle = withAlpha(tone(env, '#ff8a5a', 0.1), 0.25 * g);
            c.beginPath();
            c.arc(0, 0, 14 * s, 0, Math.PI * 2);
            c.fill();
            c.globalCompositeOperation = 'source-over';
          }
          cardText(c, String(fr.stamp), 0, 3.5 * s, 10 * s, mixLab('#fff4e6', INK_RED, 0.1), A * sm(vis) * sm(u), o.legible, `${o.id ?? 'rib'}-stamp${i}`, false);
          c.restore();
        }
      } else cardText(c, '0', tx, ty + 3.5 * s, 9 * s, withAlpha(inkC, 0.65), A * sm(vis) * 0.9, false, '', false);
      // pasted over (a rolled-back run hidden under the next transaction's frames)
      const pa = clamp01(fr.pasted ?? 0);
      if (pa > 0.01) {
        c.fillStyle = withAlpha(mixLab(pap, '#d8c69c', 0.4), pa);
        c.fillRect(L.x0 - 1, y0 - 2 * s * pa, L.x1 - L.x0 + 2, h + 4 * s * pa);
      }
    }
    c.restore();
  });
  c.restore();
}
function cardText(c: C2, text: string, x: number, y: number, size: number, col: string, a: number, legible: boolean | undefined, id: string, sc: boolean): void {
  if (a <= 0.01) return;
  textRole(c, legible ? 'subject' : 'texture', () => {
    c.save();
    const fam = sc ? FONT.sc : FONT.display;
    const w = sc ? 600 : 700;
    let sz = size;
    if (legible) sz = legibleSize(c, `${w} ${sz}px ${fam}`, sz, text);
    c.font = `${w} ${sz}px ${fam}`;
    c.textAlign = 'center';
    c.fillStyle = col;
    c.globalAlpha = a;
    c.fillText(text, x, y);
    if (legible && id) {
      const tw = c.measureText(text).width;
      textProbe(c, id, x - tw / 2, y - sz, tw, sz * 1.2, a);
    }
    c.restore();
  });
}

// ------------------------------------------------------------------ scrolls and books
export interface ScrollOpts {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  /** 0..1 the knot-tag visible (tally + length mark) */
  tag?: number;
  /** a damaged / short scroll: frayed end and a shorter body */
  frayed?: number;
  alpha?: number;
  /** a glint on the knot (checksum check) */
  glint?: number;
  /** stale (fenced/old owner's) tint */
  tint?: 'none' | 'ghost';
}
/** a rolled scroll (horizontal), 40 x 12 at s = 1, tied at the middle with a cord whose knot carries a tag */
export function scroll(c: C2, env: PaintEnv, o: ScrollOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const fr = clamp01(o.frayed ?? 0);
  c.save();
  c.globalAlpha *= A * (o.tint === 'ghost' ? 0.45 : 1);
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s, s);
  const L = 40 * (1 - 0.35 * fr);
  const pap = paper(env, 0.08);
  c.fillStyle = mixLab(pap, '#bfa77a', 0.25);
  c.fillRect(-L / 2, -6, L, 12);
  // end discs
  c.fillStyle = mixLab(pap, env.mood.fg, 0.3);
  c.beginPath();
  c.ellipse(-L / 2, 0, 2.5, 6, 0, 0, Math.PI * 2);
  c.fill();
  if (fr > 0.05) {
    // a frayed right end
    c.strokeStyle = withAlpha(pap, 0.8);
    c.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(L / 2, -5 + i * 2.5);
      c.lineTo(L / 2 + 3 + (i % 2) * 3, -6 + i * 2.8);
      c.stroke();
    }
  } else {
    c.beginPath();
    c.ellipse(L / 2, 0, 2.5, 6, 0, 0, Math.PI * 2);
    c.fill();
  }
  // shading
  c.fillStyle = withAlpha(env.mood.fg, 0.25);
  c.fillRect(-L / 2, 2, L, 4);
  // cord + knot
  c.fillStyle = mixLab('#4a3420', env.mood.fg, 0.2);
  c.fillRect(-1.6, -6.5, 3.2, 13);
  const tg = clamp01(o.tag ?? 0);
  if (tg > 0.01) {
    c.globalAlpha = A * tg;
    c.strokeStyle = mixLab('#4a3420', env.mood.fg, 0.2);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(3, 14);
    c.stroke();
    c.fillStyle = brass(env, 0.4 + 0.5 * (o.glint ?? 0));
    c.fillRect(-1, 14, 9, 6);
    // a tiny tally and a length mark (texture: never read as numbers)
    c.strokeStyle = withAlpha('#2a1d10', 0.8);
    c.lineWidth = 0.5;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      c.moveTo(0.5 + i * 1.6, 15.2);
      c.lineTo(0.5 + i * 1.6, 18.8);
    }
    c.moveTo(5.4, 17);
    c.lineTo(7.6, 17);
    c.stroke();
  }
  c.restore();
}
export interface BookOpts {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  alpha?: number;
  /** a small tag hanging from the spine: e.g. 'session 7' or 'epoch 7' (legible when the camera is in) */
  tag?: string;
  tagAlpha?: number;
  legible?: boolean;
  id?: string;
  /** 0..1 opened */
  open?: number;
}
/** a bound Book (a snapshot), 34 x 26 at s = 1, seen from the side (spine toward camera) */
export function book(c: C2, env: PaintEnv, o: BookOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s, s);
  const op = clamp01(o.open ?? 0);
  const cover = mixLab(tone(env, '#6b4a2c', 0.2), env.mood.fg, 0.25);
  if (op > 0.01) {
    // open: two page fans
    c.fillStyle = paper(env, 0.05);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-10, -4 - 4 * op, -24 * op - 2, -2);
    c.lineTo(-24 * op - 2, -20);
    c.quadraticCurveTo(-10, -24 - 4 * op, 0, -22);
    c.quadraticCurveTo(10, -24 - 4 * op, 24 * op + 2, -20);
    c.lineTo(24 * op + 2, -2);
    c.quadraticCurveTo(10, -4 - 4 * op, 0, 0);
    c.closePath();
    c.fill();
  }
  c.fillStyle = cover;
  c.fillRect(-17, -26, 34, 26);
  c.fillStyle = mixLab(cover, '#000', 0.25);
  c.fillRect(-17, -26, 5, 26);
  c.fillStyle = paper(env, 0.1);
  c.fillRect(-12, -24, 28, 2);
  c.strokeStyle = withAlpha(brass(env, 0.6), 0.8);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-17, -20);
  c.lineTo(-12, -20);
  c.moveTo(-17, -6);
  c.lineTo(-12, -6);
  c.stroke();
  if (o.tag && (o.tagAlpha ?? 1) > 0.01) {
    const ta = A * (o.tagAlpha ?? 1);
    c.strokeStyle = mixLab('#4a3420', env.mood.fg, 0.2);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-14, 0);
    c.lineTo(-14, 7);
    c.stroke();
    textRole(c, o.legible ? 'subject' : 'texture', () => {
      let sz = 8;
      if (o.legible) sz = legibleSize(c, `600 ${sz}px ${FONT.sc}`, sz, o.tag!);
      c.font = `600 ${sz}px ${FONT.sc}`;
      const tw = c.measureText(o.tag!).width;
      c.globalAlpha = ta;
      c.fillStyle = brass(env, 0.45);
      c.fillRect(-14 - tw / 2 - sz * 0.4, 7, tw + sz * 0.8, sz * 1.35);
      c.fillStyle = '#24180a';
      c.textAlign = 'center';
      c.fillText(o.tag!, -14, 7 + sz * 1.05);
      if (o.legible && o.id) textProbe(c, o.id, -14 - tw / 2, 7, tw, sz * 1.35, ta);
    });
  }
  c.restore();
}
export interface LedgerOpts {
  x: number;
  y: number;
  s?: number;
  /** page edges visible (the database's page count) */
  pages: number;
  /** 0..1 a newly added page sliding in */
  adding?: number;
  alpha?: number;
}
/** SQLite's main database file as a closed bound ledger, page edges counted along its fore-edge */
export function ledger(c: C2, env: PaintEnv, o: LedgerOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.scale(s, s);
  const n = o.pages + clamp01(o.adding ?? 0);
  const th = 4 + n * 3.2;
  const cover = mixLab(tone(env, '#5a3d24', 0.15), env.mood.fg, 0.2);
  c.fillStyle = cover;
  c.fillRect(-46, -th - 6, 92, 4);
  c.fillRect(-46, -2, 92, 4);
  for (let i = 0; i < Math.ceil(n); i++) {
    const a = i < Math.floor(n) ? 1 : n - Math.floor(n);
    c.globalAlpha = A * a;
    c.fillStyle = mixLab(paper(env, 0.05), '#c9b48a', (i % 2) * 0.2);
    c.fillRect(-44 + (1 - a) * 30, -6 - (i + 1) * 3.2, 88, 2.6);
  }
  c.globalAlpha = A;
  c.fillStyle = mixLab(cover, '#000', 0.2);
  c.fillRect(-50, -th - 6, 6, th + 8);
  c.restore();
}
