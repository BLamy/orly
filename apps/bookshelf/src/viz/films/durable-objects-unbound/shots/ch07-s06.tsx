/**
 * ch07-s06 — A COMPLETE TAIL: celld recovery's hard rule (labGreen, paper-fold back from the recovery gate).
 *
 * Close on celld's town (sets/ch07-s06-windows.ts): House B's upper window at the left (copyist-1 at its desk),
 * House C's dormer at the right (copyist-2), both notebooks wax-sealed from the gate; below, at C's door, the
 * successor (House C's keeper) with a lantern and an open scroll case; C's main window holds the Room Lantern, dark,
 * its door latched. Far down at the left edge the wellhead (L3) with its small gate and badge 'celld 0.6.3' (art).
 * Each notebook's spine band shows its retained range: full and sharp = complete; a missing segment = incomplete;
 * blurred and water-stained = damaged. Two made-up cases.
 *
 *   rule      4.56  'complete': both copyists hold their sealed notebooks up to the window
 *   case1    10.23  'water-damaged': copyist-1's band (B) blurs and stains
 *   other    11.63  copyist-2's band (C) is full and sharp; its pages ride down to the keeper's case
 *   proceeds 13.74  the gate at the wellhead opens; the keeper's lantern brightens
 *   case2    16.44  (ink-bleed rewind on 'Now') 'incomplete': copyist-1's band now has a gap
 *   damaged  18.00  copyist-2's band blurs; the keeper waits; nothing rides down
 *   shut     22.49  label 'No complete tail: the door stays shut'; the gate stays closed, the lantern door latched
 *   error    25.09  C's window answers with a crossed slip instead of its notebook; the keeper does NOT strike it off:
 *                   a small hourglass appears beside it and the keeper asks again; label 'celld: an error is not proof
 *                   of absence'
 *   promise  31.91  a slow push in on the Room Lantern's closed door
 * Bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, addPose, defineShot, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { seaAndShore } from '../sets/harbourTown';
import { badge, camAt, clamp01, glowDot, label, lerp, paper, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { copyistDesk } from '../sets/neighbours';
import { roomLantern } from '../sets/roomLantern';
import { letter } from '../sets/heldLetter';
import { wellBase } from '../sets/wellAndPlate';
import { hourglass } from '../sets/ch05-s03-sill';
import { WIN, facades, gate, roomBack, scrollCase, spineBand } from '../sets/ch07-s06-windows';

const ID = 'ch07-s06';
const TWO: Camera3 = { x: 640, y: 336, z: 40, lens: 1 };
const DOOR: Camera3 = { x: 1130, y: 500, z: 450, lens: 1 };
/** case one: the camera leans left so the wellhead and its gate (beyond B's corner) are in frame as the gate opens */
const GATE: Camera3 = { x: 470, y: 352, z: 30, lens: 1 };
const CTINT = '#cfd9a8';
/** the raised notebooks, held up to each window */
const NB = { B: { x: WIN.B.x + 30, y: WIN.B.y + 66, s: 2.5 }, C: { x: WIN.C.x + 26, y: WIN.C.y + 58, s: 2.15 } };
/** the riser from C's dormer sill down to the keeper's case, and from B's sill */
const RISE = {
  C: { a: { x: WIN.C.x - WIN.C.w / 2 + 14, y: WIN.C.y + WIN.C.h / 2 + 4 }, b: { x: WIN.case.x + 6, y: WIN.case.y - 30 } },
  B: { a: { x: WIN.B.x + WIN.B.w / 2 + 8, y: WIN.B.y + WIN.B.h / 2 + 4 }, b: { x: WIN.case.x - 6, y: WIN.case.y - 30 } },
};
const along = (r: { a: { x: number; y: number }; b: { x: number; y: number } }, u: number) => ({
  x: lerp(r.a.x, r.b.x, u),
  y: lerp(r.a.y, r.b.y, u) + Math.sin(Math.PI * u) * 26,
});

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      rule: T.beat('rule'),
      case1: T.beat('case1'),
      other: T.beat('other'),
      proceeds: T.beat('proceeds'),
      now: T.line('L0732').start,
      case2: T.beat('case2'),
      damaged: T.beat('damaged'),
      shut: T.beat('shut'),
      error: T.beat('error'),
      absent: T.word('L0733', 'absent'),
      promise: T.beat('promise'),
      l734: T.line('L0734').start,
    };
    const cams: CamKey[] = [
      { t: 0, cam: { ...TWO, x: TWO.x + 12, z: TWO.z - 20 } },
      { t: b.rule, cam: TWO },
      { t: b.other - 0.2, cam: { ...TWO, x: TWO.x - 6 } },
      { t: b.proceeds + 0.1, cam: GATE },
      { t: b.now + 0.1, cam: GATE },
      { t: b.case2 + 0.9, cam: TWO },
      { t: b.l734 - 0.4, cam: { ...TWO, x: TWO.x + 20, z: TWO.z + 20 } },
      { t: b.D, cam: DOOR },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    // ------------------------------------------------ state
    const case2 = t >= b.now - 0.1;
    const raise = seg(t, b.rule - 0.3, b.rule + 0.6);
    // B (copyist-1): complete → damaged (case 1) → incomplete (case 2)
    const bBand = !case2
      ? { from: 'complete' as const, to: 'damaged' as const, u: seg(t, b.case1 - 0.1, b.case1 + 0.7) }
      : { from: 'damaged' as const, to: 'incomplete' as const, u: seg(t, b.case2 - 0.1, b.case2 + 0.6) };
    // C (copyist-2): complete (case 1, glinting) → damaged (case 2)
    const cBand = !case2 ? { from: 'complete' as const, to: 'complete' as const, u: 0 } : { from: 'complete' as const, to: 'damaged' as const, u: seg(t, b.damaged - 0.1, b.damaged + 0.6) };
    const cGlint = !case2 ? pulse(t, b.other, 0.2, 0.6, 0.8) : 0;
    // case 1: C's pages ride down; the gate opens; the keeper's lantern brightens
    const ride = !case2 ? seg(t, b.other + 0.3, b.proceeds - 0.1) : 0;
    const gateOpen = !case2 ? seg(t, b.proceeds - 0.1, b.proceeds + 0.6) : 1 - seg(t, b.now - 0.1, b.now + 0.5);
    const lantern = 0.55 + 0.45 * (!case2 ? seg(t, b.proceeds, b.proceeds + 0.6) : 1 - seg(t, b.now - 0.1, b.now + 0.6)) + 0.25 * pulse(t, b.error + 1.2, 0.2, 0.3, 0.8);
    const rewindPulse = pulse(t, b.now - 0.25, 0.15, 0.1, 0.45);
    // the error variation: C's window answers with a crossed slip; an hourglass appears; the keeper asks again
    const err = seg(t, b.error - 0.25, b.error + 0.25);
    const cRaise = raise * (1 - err * 0.8);
    const slipU = seg(t, b.error + 0.1, b.error + 1.6);
    const glassA = seg(t, b.error + 1.1, b.error + 1.6);
    const asking = seg(t, b.error + 1.0, b.error + 1.5) * (1 - seg(t, b.absent + 1.5, b.absent + 2.2));
    // ------------------------------------------------ L0–L3: sky, the sea between the houses, the ridge, the wellhead
    f.backlight({ sunX: 170, sunY: 300, intensity: 0.85 });
    f.layer('L1', (c, env) => {
      seaAndShore(f, c, env, { x: -400, y: 80, w: 2100, h: 760 }, { lamps: 0.5, moon: 1, key: ID });
    });
    f.layer('L2', (c, env) => {
      const r = { x: -300, y: 200, w: 1900, h: 700 };
      f.cached(`dou/${ID}/ridge/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        const col = mixLab(env.fill('set'), env.fill('ink'), 0.35);
        cc.fillStyle = col;
        cc.beginPath();
        cc.moveTo(r.x, r.y + r.h);
        for (let x = r.x; x <= r.x + r.w; x += 8) cc.lineTo(x, 470 - 0.12 * (x + 300) - 10 * Math.sin(x * 0.012));
        cc.lineTo(r.x + r.w, r.y + r.h);
        cc.closePath();
        cc.fill();
        for (let x = -200; x < 1500; x += 54) {
          const top = 470 - 0.12 * (x + 300) + 10;
          cc.fillStyle = mixLab(col, env.fill('ink'), 0.35);
          cc.beginPath();
          cc.moveTo(x - 16, top + 26);
          cc.lineTo(x, top + 10);
          cc.lineTo(x + 16, top + 26);
          cc.closePath();
          cc.fill();
        }
      })(c, r.x, r.y);
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      // far down at the left edge: the wellhead, its small gate and celld's badge (art, unnamed here)
      const r = { x: -160, y: 330, w: 340, h: 350 };
      f.cached(`dou/${ID}/well/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        wellBase(cc, env, { x: 34, y: 566, s: 0.7 });
      })(c, r.x, r.y);
      badge(c, env, { x: 34 - 62 * 0.7 + 4, y: 566 - 128 * 0.7, text: 'celld 0.6.3', s: 0.6, legible: false, swing: 0.03 * Math.sin(tq * 1.3) });
      gate(c, env, { x: 36, y: 600, s: 2.0, open: gateOpen, glow: !case2 ? pulse(t, b.proceeds + 0.2, 0.2, 0.4, 0.9) : 0 });
    });
    f.fog('B');
    // ------------------------------------------------ L4: the rooms, the copyists, the facades, the keeper
    f.layer('L4', (c, env) => {
      roomBack(c, env, WIN.B, 1, CTINT);
      roomBack(c, env, WIN.C, 1, CTINT);
      roomBack(c, env, WIN.M, 0.12, CTINT);
      // the copyists at their desks (clipped to their windows), the notebooks held up to the glass
      const inWin = (w: { x: number; y: number; w: number; h: number }, fn: () => void) => {
        c.save();
        c.beginPath();
        c.rect(w.x - w.w / 2, w.y - w.h / 2, w.w, w.h);
        c.clip();
        fn();
        c.restore();
      };
      inWin(WIN.B, () => {
        const pose = addPose(POSES.sit, { shoulderF: 78 * raise, elbowF: -24 * raise, shoulderB: 60 * raise, elbowB: -10 * raise });
        copyistDesk(c, env, { x: WIN.B.x + 46, y: WIN.B.y + WIN.B.h / 2 + 52 + 64 * raise, s: 1.15, notebook: { band: 'complete', lines: 5, sealed: 1, alpha: 1 - raise }, press: { turn: 1, locked: 1 }, lamp: 0.4 });
        cast['copyist-1'].draw(c, { x: WIN.B.x - 64, y: WIN.B.y + WIN.B.h / 2 + 58, facing: 'right', pose, scale: 0.62, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.6, y: -0.8, px: 2.4, alpha: 0.85, warm: 0.3 } }, env);
        spineBand(c, env, { ...NB.B, ...bBand, alpha: raise });
      });
      inWin(WIN.C, () => {
        const pose = addPose(POSES.sit, { shoulderF: 78 * cRaise, elbowF: -24 * cRaise, shoulderB: 60 * cRaise, elbowB: -10 * cRaise });
        copyistDesk(c, env, { x: WIN.C.x + 40, y: WIN.C.y + WIN.C.h / 2 + 46 + 56 * cRaise, s: 1.0, notebook: { band: 'complete', lines: 5, sealed: 1, alpha: 1 - cRaise }, press: { turn: 1, locked: 1 }, lamp: 0.4 });
        cast['copyist-2'].draw(c, { x: WIN.C.x - 52, y: WIN.C.y + WIN.C.h / 2 + 50, facing: 'right', pose, scale: 0.55, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -0.6, y: -0.8, px: 2.4, alpha: 0.85, warm: 0.3 } }, env);
        spineBand(c, env, { ...NB.C, ...cBand, alpha: cRaise, glint: cGlint });
      });
      // the Room Lantern in C's main window: dark, its door latched
      inWin(WIN.M, () => {
        roomLantern(c, env, { x: WIN.M.x, y: WIN.M.y + WIN.M.h / 2 - 4, s: 1.05, lit: 0.04, members: 0, door: 0, colour: 'green', hook: false });
      });
      f.cached(`dou/${ID}/facades/${env.mood.id}`, 1600, 1000, (cc) => {
        cc.translate(100, 100);
        facades(cc, env);
      })(c, -100, -100);
      // the latch on the lantern door catches a glint on 'shut' and on 'promise'
      glowDot(c, WIN.M.x - 2, WIN.M.y + WIN.M.h / 2 - 22, 12, tone(env, '#f2dca0', 0.1), 0.55 * (pulse(t, b.shut, 0.2, 0.4, 0.8) + pulse(t, b.promise, 0.3, 0.6, 1.2)));
      // the risers (thin cords) from the windows down to the keeper's case
      c.save();
      c.strokeStyle = withAlpha(mixLab(env.fill('ink'), env.mood.halo, 0.3), 0.85);
      c.lineWidth = 1;
      for (const r of [RISE.B, RISE.C]) {
        c.beginPath();
        for (let i = 0; i <= 20; i++) {
          const p = along(r, i / 20);
          if (i === 0) c.moveTo(p.x, p.y);
          else c.lineTo(p.x, p.y);
        }
        c.stroke();
      }
      c.restore();
      // case 1: C's pages ride down to the case
      for (let i = 0; i < 3; i++) {
        const u = clamp01(ride * 1.6 - i * 0.3);
        if (u <= 0 || u >= 1) continue;
        const p = along(RISE.C, sm(u));
        pageSlip(c, p.x, p.y, 0.9 * (1 - seg(u, 0.9, 1)), paper(env, 0.05));
      }
      // the error: a crossed slip comes down from C's window instead of its notebook
      if (slipU > 0 && slipU < 1) {
        const p = along(RISE.C, sm(slipU) * 0.72);
        letter(c, env, { x: p.x, y: p.y, s: 0.75, error: 1, rot: -0.2 });
      } else if (slipU >= 1) {
        const p = along(RISE.C, 0.72);
        letter(c, env, { x: p.x, y: p.y, s: 0.75, error: 1, rot: -0.2, alpha: 1 - seg(t, b.promise - 1.5, b.promise) * 0.6 });
      }
      // an hourglass beside C's window: the keeper does not strike it off, it keeps asking
      if (glassA > 0.01) hourglass(c, env, { x: WIN.C.x + WIN.C.w / 2 + 30, y: WIN.C.y + WIN.C.h / 2, s: 1.0, u: clamp01((t - b.error - 1.2) / 7), alpha: glassA });
      // the keeper at C's door: lantern in hand, the scroll case open on the step
      scrollCase(c, env, { x: WIN.case.x, y: WIN.case.y, s: 1.1, pages: !case2 ? 3 * seg(t, b.other + 0.8, b.proceeds) : 0 });
      const kp = addPose(POSES.present, { shoulderF: 40 * asking + 10 * raise, neck: -6, head: -10 });
      const ko = { x: WIN.keeper.x, y: WIN.keeper.y, facing: 'right' as const, pose: kp, scale: 0.62, ink: PUPPET_NEAR_BLACK, light: { x: -0.6, y: -0.7, floor: 0.15 }, edgeRim: { x: -0.7, y: -0.6, px: 2.5, alpha: 0.85, warm: 0.45 } };
      cast['keeper-c'].draw(c, ko, env);
      const hand = cast['keeper-c'].anchor(ko, 'handF');
      handLantern(c, hand.x + 2, hand.y + 4, env.fill('ink'));
      glowDot(c, hand.x + 2, hand.y + 18, 26, tone(env, '#ffc46e', 0.05), 0.75 * lantern);
    });
    f.rim({ x: 0, y: -1 });
    {
      const ko = { x: WIN.keeper.x, y: WIN.keeper.y, facing: 'right' as const, pose: addPose(POSES.present, { shoulderF: 40 * asking + 10 * raise, neck: -6, head: -10 }), scale: 0.62 };
      const hand = cast['keeper-c'].anchor(ko, 'handF');
      f.practical({ x: hand.x + 2, y: hand.y + 18, kind: 'candle', seed: 31, intensity: 0.6 * lantern, radius: 34, layer: 'L4' });
    }
    // ------------------------------------------------ L5: a hanging vine at the top-left corner (near, soft)
    f.layer('L5', (c, env) => {
      const r = { x: -200, y: -120, w: 360, h: 360 };
      f.cached(`dou/${ID}/vine/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(-200, -120, 360, 40);
        for (let i = 0; i < 9; i++) {
          const x = -150 + i * 34, len = 40 + ((i * 37) % 60);
          cc.beginPath();
          cc.moveTo(x, -82);
          cc.quadraticCurveTo(x + 8, -82 + len * 0.5, x + 2, -82 + len);
          cc.lineTo(x - 4, -82 + len);
          cc.quadraticCurveTo(x + 2, -82 + len * 0.5, x - 6, -82);
          cc.closePath();
          cc.fill();
          cc.beginPath();
          cc.ellipse(x + 1, -82 + len, 7, 4, 0.4, 0, Math.PI * 2);
          cc.fill();
        }
      })(c, r.x, r.y);
    });
    // the ink-bleed rewind between the cases
    if (rewindPulse > 0.01) {
      f.c.save();
      f.c.fillStyle = withAlpha(mixLab(f.mood.fg, '#000000', 0.3), 0.5 * rewindPulse);
      f.c.fillRect(0, 0, 1280, 720);
      f.c.restore();
    }
    // ------------------------------------------------ labels
    // both labels clear before the push, so the final image rests on the latched, unlit door alone
    const out = 1 - seg(t, b.l734 - 0.9, b.l734 - 0.3);
    const sA = seg(t, b.shut - 0.15, b.shut + 0.3) * out;
    label(f.c, f.mood, { id: `${ID}-shut`, text: 'No complete tail: the door stays shut', x: 64, y: 64, alpha: sA });
    const eA = seg(t, b.error - 0.15, b.error + 0.3) * out;
    label(f.c, f.mood, { id: `${ID}-error`, text: 'celld: an error is not proof of absence', x: 1216, y: 64, align: 'right', alpha: eA });
    void toLayer;
    void toScreen;
    void LAYERS;
  },
});

function pageSlip(c: C2, x: number, y: number, a: number, col: string): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = col;
  c.fillRect(x - 6, y - 8, 12, 15);
  c.restore();
}
function handLantern(c: C2, x: number, y: number, ink: string): void {
  c.save();
  c.fillStyle = ink;
  c.fillRect(x - 1, y, 2, 6);
  c.beginPath();
  c.moveTo(x - 7, y + 6);
  c.lineTo(x + 7, y + 6);
  c.lineTo(x + 6, y + 28);
  c.lineTo(x - 6, y + 28);
  c.closePath();
  c.moveTo(x - 4, y + 9);
  c.lineTo(x - 4, y + 25);
  c.lineTo(x + 4, y + 25);
  c.lineTo(x + 4, y + 9);
  c.closePath();
  c.fill('evenodd');
  c.restore();
}
