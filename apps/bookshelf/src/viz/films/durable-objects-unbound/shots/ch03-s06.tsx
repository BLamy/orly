/**
 * ch03-s06 — the scope of the referee (winterBlue, cut). The square from above the terrace (sets/harbourTown.ts):
 * the iron frame over the Well now carries TWO plates: the harbour room's Plate and, on a bracket, a smaller plate
 * for an illustrative second room whose lantern glows in House B. Each plate has its own slot in the Tooth.
 *
 *   keys      a thin brass line ties each plate to its own slot; the camera eases in;
 *             label 'one key at a time · no cross-room commit'
 *   apart     both rooms change at once: a slip enters each lantern; each room's card runs down its own pulley
 *             line; one clicks while the other is still in flight; nothing ties the two plates together
 *   quiet     the Well goes quiet: its water darkens, the rope goes slack, and each house's next card hangs
 *             unanswered at its slot; the plates stay frozen
 *   (end)     hold, then drift onto the harbour room's lantern in A's window (the chapter's iris closes there)
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { BRASS_HI, badge, brass, camAt, clamp01, glowDot, label, lerp, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, paintTown, pulleyAt } from '../sets/harbourTown';
import { WELL, plate, swapCard, tooth } from '../sets/wellAndPlate';

const ID = 'ch03-s06';
const W = TOWN.well;
const S2 = 0.62;
/** the second plate hangs on a bracket to the right of the frame */
const P2 = { x: W.x + 150, y: W.y + WELL.plate.y + 8 - WELL.plate.y * S2 };
const P2C = { x: P2.x, y: P2.y + WELL.plate.y * S2 };
const SLOT1 = { x: W.x + WELL.slot.x, y: W.y + WELL.slot.y };
const T2 = { s: 0.72, x: W.x + 64 - WELL.slot.x * 0.72, y: W.y - 46 - WELL.slot.y * 0.72 };
const SLOT2 = { x: T2.x + WELL.slot.x * T2.s, y: T2.y + WELL.slot.y * T2.s };

const HIGH: Camera3 = { x: 560, y: 360, z: 110, lens: 1 };
const IN: Camera3 = { x: 482, y: 468, z: 420, lens: 1 };
const HOLD: Camera3 = { x: 470, y: 458, z: 400, lens: 1 };
const LANT: Camera3 = { x: 150, y: 404, z: 250, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = { D: T.duration, keys: T.beat('keys'), apart: T.beat('apart'), quiet: T.beat('quiet') };
    const cams: CamKey[] = [
      { t: 0, cam: HIGH },
      { t: b.keys - 0.4, cam: { ...HIGH, x: HIGH.x - 10, z: HIGH.z + 30 } },
      { t: b.apart - 0.6, cam: IN },
      { t: b.quiet + 1.6, cam: HOLD },
      { t: b.D - 0.2, cam: LANT },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const quiet = seg(t, b.quiet - 0.2, b.quiet + 0.8);
    const ties = seg(t, b.keys - 0.1, b.keys + 1.0);
    // each room's card runs down its own pulley line: A's clicks, B's is still in flight then clicks later
    const run1 = clamp01((tq - (b.apart - 0.9)) / 1.1);
    const run2 = clamp01((tq - (b.apart - 0.5)) / 2.4);
    const click1 = Math.sin(Math.PI * seg(t, b.apart + 0.15, b.apart + 0.55));
    const click2 = Math.sin(Math.PI * seg(t, b.apart + 1.85, b.apart + 2.25));
    // the next cards arrive as the Well goes quiet and hang there, unanswered
    const hang1 = clamp01((tq - (b.quiet - 1.0)) / 0.9), hang2 = clamp01((tq - (b.quiet - 0.8)) / 0.9);
    const slipsIn = (k: number) => [{ x: 0, y: clamp01((tq - (b.apart - 1.4 + k * 0.2)) / 1.2), alpha: seg(t, b.apart - 1.4, b.apart - 1.1) * (1 - seg(t, b.apart + 0.6, b.apart + 1.2)) }];
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 1, B: 1, C: 0 },
        lanterns: [
          { house: 'A', lit: 1, members: 3, tq, slips: slipsIn(0) },
          { house: 'B', lit: 1, members: 2, tq, slips: slipsIn(1), s: 0.42 },
        ],
        plate: { house: 'A', epoch: '', from: '', crown: 0, flip: [seg(t, b.apart + 0.15, b.apart + 0.4), 1, 1], glint: [0.6 * click1, 0, 0], dim: 0.3 * quiet },
        tooth: { shutter: 0, pin: 1, showPin: false, flash: click1, flashKind: 'click' },
        well: { bucket: 0.3, glint: 0.4 * (1 - quiet), reflect: 0.25 * (1 - quiet), slack: quiet },
        badge: null,
        lampPostLit: 0.35,
      },
      {
        L4: (c, env) => {
          badge(c, env, { x: W.x + WELL.hook.x + 7, y: W.y + WELL.hook.y - 2, text: 'Amazon S3', s: 0.8, legible: false, glint: 0.3, swing: 0.03 * Math.sin(tq * 1.3) });
          // the bracket and the second room's plate
          c.strokeStyle = env.fill('ink');
          c.lineWidth = 3;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(W.x + WELL.plateW / 2 + 12, W.y + WELL.plate.y - 4);
          c.quadraticCurveTo(P2C.x - 30, W.y + WELL.plate.y - 50, P2C.x, P2C.y - WELL.plateH * S2 * 0.5 - 32 * S2);
          c.stroke();
          plate(c, env, { x: P2.x, y: P2.y, s: S2, plate: { house: 'B', epoch: '', from: '', crown: 0, flip: [seg(t, b.apart + 1.85, b.apart + 2.1), 1, 1], glint: [0.6 * click2, 0, 0], dim: 0.3 * quiet } });
          // its own slot on the wellhead lip
          tooth(c, env, { x: T2.x, y: T2.y, s: T2.s, tooth: { shutter: 0, pin: 1, showPin: false, flash: click2, flashKind: 'click' } });
          // the brass ties: each plate to its own slot (and nothing between the plates)
          if (ties > 0.01) {
            tie(c, env, { x: W.x - 30, y: W.y + WELL.plate.y + WELL.plateH / 2 + 6 }, SLOT1, ties, quiet);
            tie(c, env, { x: P2C.x, y: P2C.y + (WELL.plateH / 2) * S2 + 4 }, SLOT2, ties, quiet);
          }
          // cards down the pulley lines
          card(c, env, cam, 'A', run1, SLOT1, 'A');
          card(c, env, cam, 'B', run2, SLOT2, 'B');
          // the quiet: the next cards hang at the slots, unanswered
          for (const [h, u, slot] of [['A', hang1, SLOT1], ['B', hang2, SLOT2]] as const) {
            if (u <= 0) continue;
            const start = pulleyAt(cam, h, 0.82);
            const e = sm(u);
            swapCard(c, env, { x: lerp(start.x, slot.x + (h === 'A' ? -22 : 20), e), y: lerp(start.y, slot.y - 16, e) + Math.sin(tq * 1.2) * 0.6 * e, s: 0.6, house: h, alpha: seg(u, 0, 0.2) * (1 - 0.25 * quiet), rot: h === 'A' ? 0.1 : -0.1 });
          }
        },
      },
    );
    label(f.c, f.mood, { id: `${ID}-keys`, text: 'one key at a time · no cross-room commit', x: 64, y: 92, alpha: seg(t, b.keys - 0.1, b.keys + 0.35) * (1 - seg(t, b.D - 2.4, b.D - 1.6)) });
  },
});

/** a thin brass line from a plate down to its slot, drawn on, dulled when the Well goes quiet */
function tie(c: C2, env: PaintEnv, a: { x: number; y: number }, b: { x: number; y: number }, u: number, quiet: number): void {
  c.save();
  c.strokeStyle = withAlpha(mixLab(brass(env, 0.6), env.mood.fg, 0.5 * quiet), 0.9);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(lerp(a.x, b.x, u), lerp(a.y, b.y - 8, u));
  c.stroke();
  c.restore();
  if (u > 0.98 && quiet < 0.5) glowDot(c, b.x, b.y - 8, 8, tone(env, BRASS_HI, 0.1), 0.4 * (1 - quiet));
}
/** a room's card running down its house's pulley line to its slot, then gone into it */
function card(c: C2, env: PaintEnv, cam: Camera3, h: 'A' | 'B', u: number, slot: { x: number; y: number }, glyph: 'A' | 'B'): void {
  if (u <= 0 || u >= 1) return;
  const along = Math.min(1, u / 0.8);
  const p = along < 1 ? pulleyAt(cam, h, along * 0.82) : null;
  const end = pulleyAt(cam, h, 0.82);
  const k = clamp01((u - 0.8) / 0.2);
  const x = p ? p.x : lerp(end.x, slot.x, sm(k)), y = p ? p.y + 8 : lerp(end.y + 8, slot.y, sm(k));
  swapCard(c, env, { x, y, s: 0.55, house: glyph, alpha: 1 - seg(u, 0.92, 1), rot: Math.sin(u * 20) * 0.08 });
}
