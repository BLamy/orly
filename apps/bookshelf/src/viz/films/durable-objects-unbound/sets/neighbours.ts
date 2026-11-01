/**
 * durable-objects-unbound — THE NEIGHBOURS (celld only; staging.buildList.neighbours).
 *
 * In celld's town (badge 'celld 0.6.3') the houses are celld nodes; two neighbouring COPYISTS (followers) sit at
 * window desks, each with a NOTEBOOK and a small iron BOOK PRESS. The press turning = fsync (the page pressed onto
 * its own disk); its brass tab locks when pressed. The notebook's SPINE BAND shows its retained range:
 * 'complete' (a full sharp ink band), 'incomplete' (a band with a missing segment), 'damaged' (blurred, stained).
 * A WAX SEAL stamped across a notebook = the successor sealing the predecessor's node-log session (wax is used
 * ONLY here; the write-ahead log's commit marks are red INK stamps, walRibbon.ts).
 *
 *   copyistDesk(c, env, o)   x, y = desk front-centre on the floor; s = 1 a 120 px desk at the action plane
 *       o.notebook { band: 'complete'|'incomplete'|'damaged', lines 0..n (pressed lines), newest 0..1 (the newest
 *                    line being copied), sealed 0..1, raised 0..1 (held up to the window) }
 *       o.press    { turn 0..1 (screw turning), locked 0..1 }
 *   notebook(c, env, o)      the notebook alone (x, y = its bottom centre), same state
 *   waxSeal(c, env, o)       a red wax seal (x, y centre, r), o.u 0..1 pressing in
 *   recordTile(c, env, o)    celld's node-log record at the wellhead: a small brass tile; state 'absent' | 'open' |
 *                            'sealed'; o.created 0..1 (forms with its shutter falling after it: conditional create)
 *   copyistPt(o, key)        'notebook' | 'press' | 'seat' (where the copyist sits, feet) | 'lamp'
 */
import { FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { WAX, brass, clamp01, glowDot, paper, sm, tone, type C2 } from './common';

export type Retained = 'complete' | 'incomplete' | 'damaged';
export interface NotebookState {
  band: Retained;
  lines?: number;
  newest?: number;
  sealed?: number;
  raised?: number;
  /** 0..1 cross-fade to another band (ink-bleed rewinds between cases) */
  alpha?: number;
}
export interface PressState {
  turn: number;
  locked: number;
}
export interface CopyistDeskOpts {
  x: number;
  y: number;
  s?: number;
  notebook: NotebookState;
  press: PressState;
  lamp?: number;
}
export function copyistPt(o: Pick<CopyistDeskOpts, 'x' | 'y' | 's'>, key: 'notebook' | 'press' | 'seat' | 'lamp'): { x: number; y: number } {
  const s = o.s ?? 1;
  switch (key) {
    case 'notebook': return { x: o.x - 14 * s, y: o.y - 62 * s };
    case 'press': return { x: o.x + 34 * s, y: o.y - 62 * s };
    case 'lamp': return { x: o.x - 50 * s, y: o.y - 100 * s };
    default: return { x: o.x - 92 * s, y: o.y };
  }
}
export function copyistDesk(c: C2, env: PaintEnv, o: CopyistDeskOpts): void {
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  c.save();
  // desk: top and two legs
  c.fillStyle = ink;
  c.fillRect(o.x - 64 * s, o.y - 62 * s, 128 * s, 6 * s);
  c.fillRect(o.x - 58 * s, o.y - 56 * s, 6 * s, 56 * s);
  c.fillRect(o.x + 52 * s, o.y - 56 * s, 6 * s, 56 * s);
  c.fillRect(o.x - 58 * s, o.y - 30 * s, 116 * s, 3 * s);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(o.x - 64 * s, o.y - 62 * s);
  c.lineTo(o.x + 64 * s, o.y - 62 * s);
  c.stroke();
  // a small desk lamp (oil) at the left: the copyist's practical
  const lp = copyistPt(o, 'lamp');
  c.fillStyle = ink;
  c.fillRect(lp.x - 4 * s, o.y - 62 * s - 12 * s, 8 * s, 12 * s);
  c.beginPath();
  c.ellipse(lp.x, lp.y + 12 * s, 7 * s, 10 * s, 0, 0, Math.PI * 2);
  c.fill();
  if ((o.lamp ?? 1) > 0.01) glowDot(c, lp.x, lp.y + 10 * s, 30 * s, tone(env, '#ffcc78', 0.1), 0.5 * (o.lamp ?? 1));
  // notebook
  const nb = copyistPt(o, 'notebook');
  notebook(c, env, { x: nb.x, y: nb.y - (o.notebook.raised ?? 0) * 70 * s, s, ...o.notebook });
  // the book press: iron frame, a screw with a cross handle, a platen that lowers as it turns
  const pp = copyistPt(o, 'press');
  const turn = clamp01(o.press.turn);
  c.fillStyle = ink;
  c.fillRect(pp.x - 18 * s, pp.y - 4 * s, 36 * s, 4 * s);
  c.fillRect(pp.x - 18 * s, pp.y - 40 * s, 4 * s, 36 * s);
  c.fillRect(pp.x + 14 * s, pp.y - 40 * s, 4 * s, 36 * s);
  c.fillRect(pp.x - 18 * s, pp.y - 42 * s, 36 * s, 5 * s);
  const platY = pp.y - 30 * s + turn * 18 * s;
  c.fillRect(pp.x - 2 * s, pp.y - 52 * s, 4 * s, platY - (pp.y - 52 * s));
  c.fillRect(pp.x - 13 * s, platY, 26 * s, 4 * s);
  // cross handle (rotation shown by its foreshortening)
  const ang = turn * Math.PI * 2;
  c.save();
  c.translate(pp.x, pp.y - 52 * s);
  c.scale(Math.cos(ang) * 0.9 + 0.1 * Math.sign(Math.cos(ang) || 1), 1);
  c.fillRect(-16 * s, -2 * s, 32 * s, 4 * s);
  c.restore();
  c.beginPath();
  c.arc(pp.x, pp.y - 52 * s, 3.5 * s, 0, Math.PI * 2);
  c.fill();
  // pages under the platen
  c.fillStyle = paper(env, 0.2);
  c.fillRect(pp.x - 11 * s, pp.y - 8 * s, 22 * s, 4 * s);
  // the brass lock tab: swings down and glows when pressed
  const lk = clamp01(o.press.locked);
  c.save();
  c.translate(pp.x + 18 * s, platY + 2 * s);
  c.rotate(-0.9 + 0.9 * sm(lk));
  c.fillStyle = brass(env, 0.4 + 0.5 * lk);
  c.fillRect(0, -2 * s, 10 * s, 4 * s);
  c.restore();
  if (lk > 0.01) glowDot(c, pp.x + 22 * s, platY + 2 * s, 14 * s, tone(env, '#f0d48a', 0.1), 0.5 * lk);
  c.restore();
}
export interface NotebookOpts extends NotebookState {
  x: number;
  y: number;
  s?: number;
}
export function notebook(c: C2, env: PaintEnv, o: NotebookOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.scale(s, s);
  const W = 46, H = 30;
  // open pages
  c.fillStyle = paper(env, 0.08);
  c.beginPath();
  c.moveTo(-W / 2, -2);
  c.lineTo(-W / 2 + 2, -H);
  c.quadraticCurveTo(-W / 4, -H - 3, 0, -H + 1);
  c.quadraticCurveTo(W / 4, -H - 3, W / 2 - 2, -H);
  c.lineTo(W / 2, -2);
  c.quadraticCurveTo(W / 4, -5, 0, -1);
  c.quadraticCurveTo(-W / 4, -5, -W / 2, -2);
  c.closePath();
  c.fill();
  // copied lines (pressed = darker)
  const n = Math.max(0, o.lines ?? 4);
  c.strokeStyle = withAlpha('#2a2016', 0.55);
  c.lineWidth = 0.9;
  for (let i = 0; i < Math.min(7, Math.ceil(n)); i++) {
    const u = i < Math.floor(n) ? 1 : n - Math.floor(n);
    const yy = -H + 6 + i * 3.4;
    c.beginPath();
    c.moveTo(-W / 2 + 4, yy);
    c.lineTo(-W / 2 + 4 + (W / 2 - 8) * u, yy);
    c.stroke();
  }
  const nw = clamp01(o.newest ?? 0);
  if (nw > 0.01) {
    c.strokeStyle = withAlpha(tone(env, '#2a2016', 0.05), 0.85);
    c.lineWidth = 1.3;
    const yy = -H + 8;
    c.beginPath();
    c.moveTo(4, yy);
    c.lineTo(4 + (W / 2 - 8) * nw, yy);
    c.stroke();
  }
  // the spine band (retained range)
  const bandY = 2, bw = W - 6;
  c.fillStyle = mixLab(tone(env, '#3c2a1a', 0.1), env.mood.fg, 0.2);
  c.fillRect(-W / 2, -2, W, 7);
  const band = mixLab(tone(env, '#e9dcc0', 0.15), env.mood.core, 0.15);
  if (o.band === 'complete') {
    c.fillStyle = band;
    c.fillRect(-bw / 2, bandY - 1, bw, 3);
  } else if (o.band === 'incomplete') {
    c.fillStyle = band;
    c.fillRect(-bw / 2, bandY - 1, bw * 0.42, 3);
    c.fillRect(-bw / 2 + bw * 0.62, bandY - 1, bw * 0.38, 3);
  } else {
    // damaged: a blurred, water-stained band
    for (let k = 0; k < 4; k++) {
      c.fillStyle = withAlpha(band, 0.25);
      c.fillRect(-bw / 2 + k * 1.5 - 2, bandY - 2 + (k % 2), bw - k * 2, 4);
    }
    c.fillStyle = withAlpha(mixLab('#6a7a7a', env.mood.fg, 0.3), 0.55);
    c.beginPath();
    c.ellipse(4, -H * 0.45, 12, 8, 0.3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  const se = clamp01(o.sealed ?? 0);
  if (se > 0.01) waxSeal(c, env, { x: o.x, y: o.y - 15 * s, r: 9 * s, u: se, alpha: A });
}
export function waxSeal(c: C2, env: PaintEnv, o: { x: number; y: number; r: number; u: number; alpha?: number }): void {
  const u = clamp01(o.u);
  if (u <= 0.01) return;
  c.save();
  c.globalAlpha *= (o.alpha ?? 1) * sm(Math.min(1, u * 2));
  const k = 0.75 + 0.25 * sm(u);
  c.translate(o.x, o.y);
  c.scale(k, k);
  const col = tone(env, WAX, 0.12);
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = o.r * (1 + 0.12 * Math.sin(i * 2.7));
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(WAX, '#ffffff', 0.25), 0.6);
  c.lineWidth = Math.max(0.6, o.r * 0.08);
  c.beginPath();
  c.arc(0, 0, o.r * 0.62, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

export interface RecordTileOpts {
  x: number;
  y: number;
  s?: number;
  state: 'absent' | 'open' | 'sealed';
  created?: number;
  /** shutter falling after the create (0..1) */
  shutter?: number;
  lifted?: number;
  alpha?: number;
  legible?: boolean;
  id?: string;
}
/** celld's node-log record: a small brass tile on a hook at the wellhead (an open eye = open; a wax seal = sealed) */
export function recordTile(c: C2, env: PaintEnv, o: RecordTileOpts): void {
  const A = (o.alpha ?? 1) * (o.state === 'absent' ? 0 : 1) * clamp01(o.created ?? 1);
  const s = o.s ?? 1;
  c.save();
  // the empty hook is always there
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.6 * s;
  c.beginPath();
  c.arc(o.x, o.y - 4 * s, 3.5 * s, Math.PI, 0);
  c.stroke();
  if (A > 0.01) {
    c.globalAlpha *= A;
    const ly = o.y - (o.lifted ?? 0) * 24 * s;
    c.fillStyle = brass(env, 0.45);
    c.fillRect(o.x - 13 * s, ly, 26 * s, 18 * s);
    c.strokeStyle = withAlpha(mixLab('#3a2a12', env.mood.fg, 0.2), 0.9);
    c.lineWidth = 0.8 * s;
    c.strokeRect(o.x - 13 * s, ly, 26 * s, 18 * s);
    if (o.state === 'open') {
      // an open eye
      c.strokeStyle = '#2a1d0e';
      c.lineWidth = 1.2 * s;
      c.beginPath();
      c.moveTo(o.x - 8 * s, ly + 9 * s);
      c.quadraticCurveTo(o.x, ly + 2 * s, o.x + 8 * s, ly + 9 * s);
      c.quadraticCurveTo(o.x, ly + 16 * s, o.x - 8 * s, ly + 9 * s);
      c.stroke();
      c.fillStyle = '#2a1d0e';
      c.beginPath();
      c.arc(o.x, ly + 9 * s, 2.2 * s, 0, Math.PI * 2);
      c.fill();
    } else if (o.state === 'sealed') {
      waxSeal(c, env, { x: o.x, y: ly + 9 * s, r: 7 * s, u: 1 });
    }
    // the shutter falling after the create (the same conditional-create shutter as the Tooth)
    const sh = clamp01(o.shutter ?? 0);
    if (sh > 0.01) {
      c.fillStyle = brass(env, 0.25);
      c.fillRect(o.x - 14 * s, ly - 6 * s, 28 * s, 5 * s * sh);
    }
  }
  c.restore();
}

/** small engraved numeral label used on epoch shelves and stations (legible when the camera is in) */
export function engraved(c: C2, env: PaintEnv, text: string, x: number, y: number, size: number, o: { legible?: boolean; id?: string; alpha?: number; color?: string } = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  textRole(c, o.legible ? 'subject' : 'texture', () => {
    c.save();
    let sz = size;
    if (o.legible) sz = legibleSize(c, `600 ${sz}px ${FONT.sc}`, sz, text);
    c.font = `600 ${sz}px ${FONT.sc}`;
    c.textAlign = 'center';
    c.globalAlpha = a;
    c.fillStyle = o.color ?? brass(env, 0.7);
    c.fillText(text, x, y);
    if (o.legible && o.id) {
      const w = c.measureText(text).width;
      textProbe(c, o.id, x - w / 2, y - sz, w, sz * 1.2, a);
    }
    c.restore();
  });
}
