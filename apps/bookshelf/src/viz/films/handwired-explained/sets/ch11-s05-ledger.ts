/**
 * handwired-explained — ch11-s05: THE LAB'S LEDGER (a tall paper cabinet of four labelled drawers).
 *
 * Script ch11-s05: "the lab's ledger, a tall paper cabinet of labelled drawers (Known issues · Open decisions ·
 * Still open · Parked and deferred) standing in the morning haze beneath the window bay. On 'question' the drawer
 * marked Still open slides out with a wooden detent click and STAYS OPEN." ch12-s01 opens on the same drawer, still
 * open: import this module there (ledgerCabinet with open = 1) so the cabinet never drifts between authors.
 *
 *   import { CAB, ledgerCabinet, frontRect, slotRect } from '../sets/ch11-s05-ledger';
 *   f.layer('L4', (c, env) => ledgerCabinet(f, c, env, { key: 'ch11-s05', open: 1, labelSize: 17, inside: (c, fr) => ... }));
 *
 * GEOGRAPHY (L4 rest px): the cabinet stands on the floor line y = 712, x 580 .. 960; the cornice at 282; four
 * drawers 90 tall, 7 apart, from y 312; drawer index 2 is Still open. Opening drops its front by OPEN_DROP and grows
 * it by OPEN_SCALE (it comes toward the lens, seen a little from above), showing the dark inside of the box between
 * the slot's top edge and the front's; whatever stands in the drawer (inside hook) is drawn there, so the front
 * hides its lower part. Silhouette rules: the carcass is set ink (one step lighter than near-black), the drawer
 * fronts one more step up, top edges carry a fine rim cut-line, brass label holders with pale paper inserts.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

type C = CanvasRenderingContext2D;
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CAB = { x: 580, y: 282, w: 380, h: 430, floor: 712 } as const;
export const DRAWER_LABELS = ['Known issues', 'Open decisions', 'Still open', 'Parked and deferred'] as const;
export const STILL_OPEN = 2;
const DX0 = CAB.x + 16;
const DW = CAB.w - 32;
const DY0 = 312;
const DH = 90;
const DGAP = 7;
export const OPEN_DROP = 14;
export const OPEN_SCALE = 0.065;
/** a drawer's slot in the carcass */
export const slotRect = (i: number): Rect => ({ x: DX0, y: DY0 + i * (DH + DGAP), w: DW, h: DH });
/** the Still open drawer's front for open u (0 shut .. 1 fully out; > 1 during the detent's overshoot) */
export function frontRect(u: number): Rect {
  const r = slotRect(STILL_OPEN);
  const s = 1 + OPEN_SCALE * u;
  const cx = r.x + r.w / 2;
  return { x: cx - (r.w * s) / 2, y: r.y + OPEN_DROP * u, w: r.w * s, h: r.h * s };
}

const brass = (env: PaintEnv, lift = 0) => mixLab(mixLab('#b08d4a', env.mood.halo, 0.3), env.mood.core, lift * 0.4);
const bodyCol = (env: PaintEnv) => mixLab(env.fill('ink'), env.fill('set'), 0.25);
const frontCol = (env: PaintEnv) => mixLab(bodyCol(env), env.fill('set'), 0.4);
const cut = (env: PaintEnv, a: number) => withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), a);
export const paperCol = (env: PaintEnv, lift = 0) => mixLab(mixLab(mixLab('#e6d6b0', env.mood.halo, 0.3), env.mood.core, lift * 0.3), env.mood.haze, env.layer.haze * 0.6);
export const inkCol = (env: PaintEnv, a = 1) => withAlpha(mixLab('#241a12', env.mood.ink, 0.2), a);

/** the carcass, cornice, plinth, feet, the dark slot of the Still open drawer, and the three shut fronts (static) */
function carcass(c: C, env: PaintEnv) {
  const body = bodyCol(env);
  const { x, y, w } = CAB;
  // contact shadow on the floor
  const sh = c.createRadialGradient(x + w / 2, CAB.floor, 10, x + w / 2, CAB.floor, w * 0.75);
  sh.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.45));
  sh.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = sh;
  c.fillRect(x - w * 0.3, CAB.floor - 10, w * 1.6, 30);
  c.fillStyle = body;
  // the crest: a segmental pediment pierced with a sunburst fret (a fan of slots round a small hub) so the dawn
  // shows through it (evenodd: the slots are holes, the backlight and window glass behind read through them)
  const pcx = x + w / 2, pcy = y - 3;
  c.beginPath();
  c.moveTo(x + w * 0.3, y - 2);
  c.quadraticCurveTo(pcx, y - 54, x + w * 0.7, y - 2);
  c.closePath();
  const N = 11;
  for (let i = 0; i < N; i++) {
    const th = Math.PI + 0.3 + ((Math.PI - 0.6) * (i + 0.5)) / N;
    const hw = ((Math.PI - 0.6) / N) * 0.3;
    const ri = { x: 15, y: 8 }, ro = { x: 60, y: 19 };
    const P = (a: number, e: { x: number; y: number }) => [pcx + Math.cos(a) * e.x, pcy + Math.sin(a) * e.y] as const;
    const [ax, ay] = P(th - hw * 0.6, ri), [bx, by] = P(th - hw, ro), [cx2, cy2] = P(th + hw, ro), [dx, dy] = P(th + hw * 0.6, ri);
    c.moveTo(ax, ay);
    c.lineTo(dx, dy);
    c.lineTo(cx2, cy2);
    c.lineTo(bx, by);
    c.closePath();
  }
  // a small round oculus in the hub
  c.moveTo(pcx + 3.5, pcy - 2);
  c.arc(pcx, pcy - 2, 3.5, 0, Math.PI * 2, true);
  for (const d of [-1, 1]) {
    // a small pierced scroll-eye at each end of the pediment
    c.moveTo(pcx + d * 66 + 2, y - 5);
    c.ellipse(pcx + d * 66, y - 5, 2, 1.6, 0, 0, Math.PI * 2, true);
  }
  c.fill('evenodd');
  for (const d of [-1, 1]) {
    const sx = x + w / 2 + d * (w * 0.2 + 6);
    c.beginPath();
    c.arc(sx, y - 6, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
    c.beginPath();
    c.arc(sx, y - 6, 2.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = body;
  }
  // finials at the cornice corners
  for (const fx of [x - 4, x + w + 4]) {
    c.beginPath();
    c.ellipse(fx, y - 12, 5, 7, 0, 0, Math.PI * 2);
    c.rect(fx - 2, y - 6, 4, 6);
    c.fill();
  }
  // cornice (stepped), carcass, plinth, bracket feet
  c.fillRect(x - 12, y, w + 24, 10);
  c.fillRect(x - 7, y + 10, w + 14, 8);
  c.fillRect(x, y + 18, w, CAB.floor - 22 - (y + 18));
  c.fillRect(x - 6, CAB.floor - 26, w + 12, 12);
  // corbels under the cornice at each corner
  for (const [cx, d] of [[x, -1], [x + w, 1]] as const) {
    c.beginPath();
    c.moveTo(cx, y + 18);
    c.lineTo(cx + d * 7, y + 18);
    c.quadraticCurveTo(cx + d * 7, y + 30, cx + d * 1, y + 38);
    c.lineTo(cx, y + 38);
    c.closePath();
    c.fill();
  }
  // the apron between the feet: a shallow scalloped cut (the floor shows through)
  c.beginPath();
  c.moveTo(x - 6, CAB.floor - 14);
  c.lineTo(x + w + 6, CAB.floor - 14);
  c.lineTo(x + w + 6, CAB.floor - 8);
  c.quadraticCurveTo(x + w / 2, CAB.floor - 2, x - 6, CAB.floor - 8);
  c.closePath();
  c.fill();
  c.beginPath();
  for (const [fx, d] of [[x - 6, 1], [x + w + 6, -1]] as const) {
    c.moveTo(fx, CAB.floor - 14);
    c.lineTo(fx + d * 34, CAB.floor - 14);
    c.quadraticCurveTo(fx + d * 18, CAB.floor - 10, fx + d * 14, CAB.floor);
    c.lineTo(fx, CAB.floor);
    c.closePath();
  }
  c.fill();
  // cut-lines: cornice tops, side stiles, plinth top (thin, lit from above only)
  c.strokeStyle = cut(env, 0.55);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - 12, y + 0.6);
  c.lineTo(x + w + 12, y + 0.6);
  c.moveTo(x - 7, y + 10.6);
  c.lineTo(x + w + 7, y + 10.6);
  c.moveTo(x - 6, CAB.floor - 25.4);
  c.lineTo(x + w + 6, CAB.floor - 25.4);
  c.stroke();
  // fluted side stiles (fine cut-lines)
  c.strokeStyle = cut(env, 0.14);
  c.beginPath();
  for (const fx of [x + 5, x + 9.5, x + w - 5, x + w - 9.5]) {
    c.moveTo(fx, y + 44);
    c.lineTo(fx, CAB.floor - 32);
  }
  c.stroke();
  // the crest's rim
  c.strokeStyle = cut(env, 0.5);
  c.beginPath();
  c.moveTo(x + w * 0.3, y - 2);
  c.quadraticCurveTo(x + w / 2, y - 54, x + w * 0.7, y - 2);
  c.stroke();
  // a 2 px warm rim on the carcass's top-left edges, toward the window bay
  // (it fades out across the top toward the right, so it never ends in a visible step)
  const warm = mixLab(env.mood.rim, env.mood.core, 0.55);
  const rg = c.createLinearGradient(x - 12, 0, x + w * 0.62, 0);
  rg.addColorStop(0, withAlpha(warm, 0.55));
  rg.addColorStop(0.55, withAlpha(warm, 0.4));
  rg.addColorStop(1, withAlpha(warm, 0));
  c.strokeStyle = rg;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + w * 0.3, y - 2);
  c.quadraticCurveTo(x + w / 2, y - 54, x + w * 0.7, y - 2);
  c.moveTo(x - 12 + 1, y + 10);
  c.lineTo(x - 12 + 1, y + 1);
  c.lineTo(x + w * 0.7, y + 1);
  c.moveTo(x + 1, y + 18);
  c.lineTo(x + 1, CAB.floor - 26);
  c.stroke();
  // the Still open drawer's slot: a dark recess (the drawer front covers it while it is shut)
  const s = slotRect(STILL_OPEN);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, body, 0.2);
  c.fillRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4);
  // the three shut fronts
  for (let i = 0; i < 4; i++) if (i !== STILL_OPEN) front(c, env, slotRect(i));
}

/** one drawer front (panel, raised field, label holder frame, cup pull); the label text is drawn live */
function front(c: C, env: PaintEnv, r: Rect) {
  const k = r.w / DW;
  c.fillStyle = frontCol(env);
  c.fillRect(r.x, r.y, r.w, r.h);
  // the raised field
  c.fillStyle = mixLab(frontCol(env), env.fill('set'), 0.18);
  c.fillRect(r.x + 7 * k, r.y + 6 * k, r.w - 14 * k, r.h - 12 * k);
  c.strokeStyle = cut(env, 0.5);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(r.x, r.y + 0.6);
  c.lineTo(r.x + r.w, r.y + 0.6);
  c.stroke();
  c.strokeStyle = cut(env, 0.18);
  c.beginPath();
  c.moveTo(r.x + 7 * k, r.y + 6.6 * k);
  c.lineTo(r.x + r.w - 7 * k, r.y + 6.6 * k);
  c.stroke();
  // the brass label holder (frame) and the cup pull below it
  const h = holderRect(r);
  // a soft 2 px brass frame (review r1: the heavier gold outline read as a UI button)
  c.strokeStyle = withAlpha(brass(env), 0.7);
  c.lineWidth = 2 * k;
  c.strokeRect(h.x - 1 * k, h.y - 1 * k, h.w + 2 * k, h.h + 2 * k);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  c.beginPath();
  c.arc(h.x - 1 * k, h.y + h.h / 2, 1.3 * k, 0, Math.PI * 2);
  c.arc(h.x + h.w + 1 * k, h.y + h.h / 2, 1.3 * k, 0, Math.PI * 2);
  c.fill();
  const px = r.x + r.w * 0.79, py = r.y + r.h * 0.34;
  c.fillStyle = brass(env);
  c.beginPath();
  c.ellipse(px, py, 24 * k, 9 * k, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
  c.beginPath();
  c.ellipse(px, py + 1 * k, 19 * k, 5.5 * k, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.55);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px - 23 * k, py + 0.5);
  c.lineTo(px + 23 * k, py + 0.5);
  c.stroke();
}
/** the label holder's paper window on a front */
export function holderRect(r: Rect): Rect {
  const k = r.w / DW;
  const w = 166 * k, h = 32 * k;
  return { x: r.x + 18 * k, y: r.y + 15 * k, w, h };
}

/** the label paper and its words, in a holder (live, so the legibility audit sees it) */
function label(c: C, env: PaintEnv, r: Rect, text: string, size: number, lift: number, light: number, id: string, cover = 0) {
  const h = holderRect(r);
  // the paper insert: in shadow until the first light reaches the cabinet (light 0 → 1)
  c.fillStyle = mixLab(paperCol(env, lift), frontCol(env), 0.55 * (1 - light) + 0.2);
  c.fillRect(h.x, h.y, h.w, h.h);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(h.x, h.y, h.w, 2);
  textRole(c, light >= 0.6 ? 'subject' : 'texture', () => {
    c.font = `500 ${size}px ${FONT.text}`;
    c.fillStyle = inkCol(env, 0.5 + 0.42 * light);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(text, h.x + 10 * (r.w / DW), h.y + h.h / 2 + size * 0.34);
  });
  // a label hidden behind something nearer (the open drawer's papers) reports what still shows
  textProbe(c, id, h.x, h.y, h.w, h.h, (0.4 + 0.6 * light) * (1 - cover));
}

export interface LedgerOpts {
  /** cache key salt (shot id) */
  key: string;
  /** the Still open drawer: 0 shut .. 1 out (overshoot allowed) */
  open: number;
  /** drawer label font size (L4 px); size it with the type kit's legibility floor for the shot's camera */
  labelSize: number;
  /** 0..1 the Still open label (and the inside of its drawer) catching the dawn light */
  lit?: number;
  /** 0..1 the first light reaching the cabinet's face (label inserts out of shadow); default 1 */
  light?: number;
  /** 0..1 per drawer: how much of its label is hidden behind what stands in the open drawer (for the text audit) */
  cover?: number[];
  /** whatever stands in the open drawer, drawn after its dark inside and before its front */
  inside?: (c: C, front: Rect, slot: Rect) => void;
  /** supersampling for push-ins (default 2.2) */
  res?: number;
}
/** the whole ledger cabinet (draw inside f.layer('L4', ...)) */
export function ledgerCabinet(f: Frame, c: C, env: PaintEnv, o: LedgerOpts) {
  const pad = 46;
  const bx = CAB.x - pad, by = CAB.y - 50, bw = CAB.w + 2 * pad, bh = CAB.floor + 24 - by;
  const opts: { blur?: number; res?: number } = { res: o.res ?? 2.2 };
  f.cached(`hw/ch11-s05-ledger/${o.key}/${env.mood.id}`, bw, bh, (cc) => {
    cc.translate(-bx, -by);
    carcass(cc, env);
  }, opts)(c, bx, by);
  const lit = o.lit ?? 0;
  const light = o.light ?? 1;
  for (let i = 0; i < 4; i++) if (i !== STILL_OPEN) label(c, env, slotRect(i), DRAWER_LABELS[i], o.labelSize, 0, light, `${o.key}-drawer${i}`, o.cover?.[i] ?? 0);
  // the Still open drawer
  const u = Math.max(0, o.open);
  const s = slotRect(STILL_OPEN);
  const fr = frontRect(u);
  if (u > 0.002) {
    // the inside of the box, seen from a little above: dark, its back edge catching a hair of light
    c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.fill('set'), 0.18);
    c.beginPath();
    c.moveTo(s.x, s.y);
    c.lineTo(s.x + s.w, s.y);
    c.lineTo(fr.x + fr.w, fr.y + 1);
    c.lineTo(fr.x, fr.y + 1);
    c.closePath();
    c.fill();
    c.strokeStyle = cut(env, 0.25 + 0.3 * lit);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(s.x + 3, s.y + 0.6);
    c.lineTo(s.x + s.w - 3, s.y + 0.6);
    c.stroke();
    // the drawer's side boards (thin wedges where the front, nearer the lens, overhangs the slot)
    c.fillStyle = mixLab(frontCol(env), PUPPET_NEAR_BLACK, 0.3);
    c.beginPath();
    c.moveTo(s.x, s.y);
    c.lineTo(fr.x, fr.y);
    c.lineTo(fr.x + 5, fr.y + fr.h);
    c.lineTo(s.x + 5, s.y + s.h);
    c.closePath();
    c.moveTo(s.x + s.w, s.y);
    c.lineTo(fr.x + fr.w, fr.y);
    c.lineTo(fr.x + fr.w - 5, fr.y + fr.h);
    c.lineTo(s.x + s.w - 5, s.y + s.h);
    c.closePath();
    c.fill();
    // the side boards' top edges catch the light from above: they read as the box coming toward the lens
    c.strokeStyle = cut(env, 0.55 + 0.3 * lit);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(s.x + 1, s.y + 0.5);
    c.lineTo(fr.x + 1, fr.y + 0.5);
    c.moveTo(s.x + s.w - 1, s.y + 0.5);
    c.lineTo(fr.x + fr.w - 1, fr.y + 0.5);
    c.stroke();
    if (o.inside) {
      // what stands in the drawer never shows below its front (the front is drawn over the rest)
      c.save();
      c.beginPath();
      c.rect(fr.x + 2, s.y - 400, fr.w - 4, fr.y + fr.h * 0.6 - (s.y - 400));
      c.clip();
      o.inside(c, fr, s);
      c.restore();
    }
    // the front's shadow on the drawer below
    const g = c.createLinearGradient(0, fr.y + fr.h, 0, fr.y + fr.h + 12);
    g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.5 * Math.min(1, u)));
    g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
    c.fillStyle = g;
    c.fillRect(fr.x - 4, fr.y + fr.h, fr.w + 8, 12);
  }
  front(c, env, fr);
  label(c, env, fr, DRAWER_LABELS[STILL_OPEN], o.labelSize * (fr.w / DW), 0.35 * lit, light, `${o.key}-drawer${STILL_OPEN}`);
}
