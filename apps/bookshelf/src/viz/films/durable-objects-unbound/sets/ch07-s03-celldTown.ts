/**
 * durable-objects-unbound — CELLD'S TOWN dressing for ch07-s03 / s03b / s04 (shot-owned helper, author:ch06-ch07).
 *
 * The shared harbourTown variant 'celld' draws the neighbour cords A→B, A→C (sill to sill) and the badge; this module
 * adds what lives INSIDE the houses, in L3 coordinates (draw in paintTown's L3back hook so the wall frames it, or in L3
 * after the wall for the facade fixtures):
 *
 *   copyistWindow(c, env, house, o)   the copyist at a small desk inside B's / C's UPPER window (copyist-1 in B,
 *                                      copyist-2 in C): notebook, book press (fsync), lock tab. Clipped to the window.
 *   riser(c, env, house, u)            the short thread from a house's sill up to its upper window (the page's last hop)
 *   riserAt(house, u)                  a point on that thread (L3)
 *   A_BELL                             House A's bell bracket on its right wall (L3); draw with heldLetter.houseBell
 *   ownerNotebook(c, env, o)           the owner's own notebook on A's main sill + an EMPTY ink ring (never a vote)
 *   sillPage(c, env, o)                a small standing page silhouette (a copy) on a sill
 *   sealStamp(c, env, o)               the neighbours' wax-seal stamp hanging by B's sill with its red-tagged pin (ch07-s04)
 *   SEAL_HOOK                          where it hangs (L3)
 *   nearRail(f, cams, key)             a short L5 stone railing strip (bounded height: safe for a crane down)
 *   CELLD_TINT                         the copyists' window lamps (pale, cool: the owner's lantern stays the warm practical)
 *
 * Bindings: the press turning = fsync; the brass tab locks when pressed; the newest notebook line = the page copied.
 * Wax is used only for celld's node-log sealing (the stamp here and neighbours.waxSeal). Houses are illustrative.
 */
import { LAYERS, POSES, PUPPET_NEAR_BLACK, addPose, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { cast } from '../cast';
import { BRASS_HI, brass, clamp01, glowDot, lerp, paper, sm, tone, type C2 } from './common';
import { TOWN } from './harbourTown';
import { copyistDesk, waxSeal, type NotebookState, type PressState } from './neighbours';
import { pinShape } from './wellAndPlate';

export const CELLD_TINT = '#cfd9a8';
/** House A's bell: bracket from A's right wall, bell hanging just clear of it (L3) */
export const A_BELL = { x: 312, y: 372, s: 0.5 };
/** the wax-seal stamp's hook on B's facade, left of B's main window (L3) */
export const SEAL_HOOK = { x: 676, y: 404 };

export interface CopyistWindowOpts {
  notebook: NotebookState;
  press: PressState;
  /** 0..1 the copyist present (lit room) */
  present?: number;
  /** 0..1 copying the newest line (write arm) */
  writing?: number;
  /** 0..1 hand on the press handle (press arm) */
  pressing?: number;
  /** the copyist holds the notebook up to the window (s06 continuity) */
  tq: number;
  lamp?: number;
}
/** the copyist and desk inside a house's upper window (L3 world). B: copyist-1, C: copyist-2. */
export function copyistWindow(c: C2, env: PaintEnv, house: 'B' | 'C', o: CopyistWindowOpts): void {
  const wn = TOWN[house].upper;
  const pres = clamp01(o.present ?? 1);
  if (pres <= 0.01) return;
  const sd = wn.w / 118;
  c.save();
  c.beginPath();
  c.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
  c.clip();
  c.globalAlpha *= pres;
  // the copyist: seated at the left of the desk, facing right toward the press
  const who = house === 'B' ? cast['copyist-1'] : cast['copyist-2'];
  const scale = (wn.h / 42) * 0.26;
  const tq = o.tq;
  const wr = clamp01(o.writing ?? 0), pr = clamp01(o.pressing ?? 0);
  let pose = POSES.sit;
  if (wr > 0.01) pose = addPose(pose, { shoulderF: 46 * wr, elbowF: 18 * wr + 6 * Math.sin(tq * 9) * wr, neck: 6 * wr, head: 6 * wr });
  if (pr > 0.01) pose = addPose(pose, { shoulderF: 92 * pr + 10 * Math.sin(tq * 6) * pr, elbowF: -30 * pr, torso: 6 * pr });
  const feet = { x: wn.x - wn.w * 0.3, y: wn.y + wn.h / 2 + wn.h * 0.42 };
  who.draw(c, { x: feet.x, y: feet.y, facing: 'right', pose, scale, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.6, y: -0.8, px: 2.25, alpha: 0.85, warm: 0.3 } }, env);
  // the desk in front of the copyist (front-centre on the floor, below the sill)
  copyistDesk(c, env, { x: wn.x + wn.w * 0.12, y: wn.y + wn.h / 2 + 62 * sd - wn.h * 0.24, s: sd, notebook: o.notebook, press: o.press, lamp: o.lamp ?? 0.35 });
  c.restore();
}

/** the sill → upper-window thread (the page's last hop up to the copyist) */
export function riserAt(house: 'B' | 'C', u: number): { x: number; y: number } {
  const h = TOWN[house];
  const a = { x: h.sill.x + h.main.w / 2 - 4, y: h.sill.y - 2 };
  const b = { x: h.upper.x - h.upper.w / 2 + 4, y: h.upper.y + h.upper.h / 2 - 2 };
  const k = clamp01(u);
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) };
}
export function riser(c: C2, env: PaintEnv, house: 'B' | 'C', u = 1): void {
  if (u <= 0.01) return;
  const a = riserAt(house, 0), b = riserAt(house, u);
  c.save();
  c.strokeStyle = withAlpha(mixLab(env.fill('ink'), env.mood.halo, 0.25), 0.85);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.stroke();
  c.restore();
}

/** a small standing page (a copy) — x, y = its foot, h tall */
export function sillPage(c: C2, env: PaintEnv, o: { x: number; y: number; h?: number; alpha?: number; glow?: number; ghost?: boolean }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  const h = o.h ?? 12, w = h * 0.72;
  c.save();
  c.globalAlpha *= a * (o.ghost ? 0.45 : 1);
  c.fillStyle = paper(env, 0.05);
  c.beginPath();
  c.moveTo(o.x - w / 2, o.y);
  c.lineTo(o.x - w / 2, o.y - h);
  c.lineTo(o.x + w / 2 - h * 0.2, o.y - h);
  c.lineTo(o.x + w / 2, o.y - h * 0.8);
  c.lineTo(o.x + w / 2, o.y);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha('#2a2016', 0.5);
  c.lineWidth = Math.max(0.5, h * 0.06);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(o.x - w * 0.32, o.y - h * (0.72 - i * 0.2));
    c.lineTo(o.x + w * (0.25 - i * 0.12), o.y - h * (0.72 - i * 0.2));
    c.stroke();
  }
  c.restore();
  if ((o.glow ?? 0) > 0.01) glowDot(c, o.x, o.y - h / 2, h * 1.6, tone(env, '#f2e2a8', 0.1), 0.45 * (o.glow ?? 0) * a);
}

/** the owner's own notebook lying on A's main sill, and the empty ink ring around it (ring 0..1 drawn) */
export function ownerNotebook(c: C2, env: PaintEnv, o: { ring: number; alpha?: number; lines?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  const s = TOWN.A.sill;
  const x = s.x - 12, y = s.y - 1;
  c.save();
  c.globalAlpha *= a;
  // an open notebook seen edge-on on the sill
  c.fillStyle = paper(env, 0.08);
  c.beginPath();
  c.moveTo(x - 9, y);
  c.quadraticCurveTo(x - 4, y - 5, x, y - 3);
  c.quadraticCurveTo(x + 4, y - 5, x + 9, y);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(tone(env, '#3c2a1a', 0.1), env.mood.fg, 0.2);
  c.fillRect(x - 9, y - 0.5, 18, 1.6);
  const r = clamp01(o.ring);
  if (r > 0.01) {
    c.strokeStyle = withAlpha(mixLab('#1a1410', env.mood.ink, 0.3), 0.9);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.ellipse(x, y - 3, 19, 13, -0.08, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sm(r));
    c.stroke();
    // a pale inner wash so the ring reads as EMPTY (no tally inside)
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.1 * r);
    c.beginPath();
    c.ellipse(x, y - 3, 17, 11, -0.08, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

export interface SealStampOpts {
  /** 1 seated, 0 pulled */
  pin: number;
  /** 0..1 how far out the pin travels with the hand */
  pinOut?: number;
  /** stamp hangs slack (tilted) when the pin is out */
  slack?: number;
  s?: number;
  alpha?: number;
  /** draw the pin here (false while the demonstrator's hand carries it) */
  pinShown?: boolean;
}
/** where the stamp's pin head sits at travel `out` (0 seated .. 1 drawn out), L3 */
export function sealPinAt(out: number, s = 1): { x: number; y: number } {
  return { x: SEAL_HOOK.x + 3 * s + clamp01(out) * 34 * s, y: SEAL_HOOK.y - 4 * s + clamp01(out) * 26 * s };
}
/** the neighbours' wax-seal stamp: a turned handle and a round die, hanging on a hook by B's sill; its pin through
 *  the hook's latch (pulled: the stamp swings slack: the seal will not be pressed) */
export function sealStamp(c: C2, env: PaintEnv, o: SealStampOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.01) return;
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  const H = SEAL_HOOK;
  c.save();
  c.globalAlpha *= a;
  // the hook bracket off the wall
  c.strokeStyle = ink;
  c.lineWidth = 2 * s;
  c.beginPath();
  c.moveTo(H.x + 10 * s, H.y - 6 * s);
  c.lineTo(H.x, H.y - 6 * s);
  c.arc(H.x, H.y - 2 * s, 4 * s, -Math.PI / 2, Math.PI / 2, true);
  c.stroke();
  // the stamp (handle + die), swinging slack when the pin is out
  c.save();
  c.translate(H.x, H.y + 2 * s);
  c.rotate(0.55 * clamp01(o.slack ?? 1 - o.pin));
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(0, 7 * s, 3 * s, 6 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-1.5 * s, 12 * s, 3 * s, 6 * s);
  // the die: a wax-red face (the seal it presses)
  c.fillRect(-6 * s, 18 * s, 12 * s, 3 * s);
  c.fillStyle = tone(env, '#a8281e', 0.12);
  c.beginPath();
  c.ellipse(0, 22 * s, 5.5 * s, 1.8 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the pin through the latch (pulled along the hand's path: down and right)
  const out = clamp01(o.pinOut ?? 1 - o.pin);
  const pp = sealPinAt(out, s);
  if (o.pinShown !== false) pinShape(c, env, pp.x, pp.y, 0.5 + out * 0.5, 0.75 * s, 1);
  c.restore();
  if (o.pin > 0.5 && o.pinShown !== false) glowDot(c, H.x + 3 * s, H.y - 4 * s, 7 * s, tone(env, BRASS_HI, 0.1), 0.25 * a);
}

/** a short near railing strip on L5 (bounded height so a crane down never fills the frame with it) */
export function nearRail(f: Frame, cams: Camera3[], key: string, extra?: (c: C2, env: PaintEnv) => void): void {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 80);
    const rr = { x: r.x, y: 640, w: r.w, h: 110 };
    f.cached(`dou/${key}/rail/${Math.round(rr.x)},${Math.round(rr.w)}/${env.mood.id}`, Math.ceil(rr.w), Math.ceil(rr.h), (cc) => {
      cc.translate(-rr.x, -rr.y);
      const fg = env.fill('fg');
      cc.fillStyle = fg;
      cc.fillRect(rr.x, 652, rr.w, 14);
      for (let x = rr.x + 10; x < rr.x + rr.w; x += 34) {
        cc.beginPath();
        cc.moveTo(x - 6, 666);
        cc.quadraticCurveTo(x - 10, 690, x - 5, 708);
        cc.lineTo(x + 5, 708);
        cc.quadraticCurveTo(x + 10, 690, x + 6, 666);
        cc.closePath();
        cc.fill();
      }
      cc.fillRect(rr.x, 706, rr.w, 44);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.18);
      cc.lineWidth = 1.5;
      cc.beginPath();
      cc.moveTo(rr.x, 652);
      cc.lineTo(rr.x + rr.w, 652);
      cc.stroke();
    })(c, rr.x, rr.y);
    extra?.(c, env);
  });
}

/** a small brass catch-light for a lock tab (used when the window is too small for the tab to read) */
export function tabGlint(c: C2, env: PaintEnv, house: 'B' | 'C', a: number): void {
  if (a <= 0.01) return;
  const wn = TOWN[house].upper;
  glowDot(c, wn.x + wn.w * 0.36, wn.y + wn.h * 0.18, wn.w * 0.5, tone(env, '#f0d48a', 0.1), 0.6 * a);
}
export { brass, waxSeal };
