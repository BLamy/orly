/**
 * ch05-s04 — PULL THE PIN: the self-fence (emberRed, lamp change in; the grade returns toward winterBlue at the end).
 *
 * Canonical HARBOUR TOWN, two-shot: House A screen-left (its keeper asleep at the window, the candle on A's sill
 * with a brass self-check latch held by the red-tagged pin), House B screen-right, the Plate between and below
 * reading A · 7 · 7, crown lit (illustrative). workerd's lease (badge 'workerd · 28 Oct' on the wellhead).
 *
 *   sleep      1.70  A's head drops onto folded arms (a paused process)
 *   pull       4.29  push in on A's sill; the demonstrator's hand (lower RIGHT) draws the pin; the latch hangs open
 *   burn       9.45  time-lapse: the candle burns down through its red band and past it; the flame goes out
 *   claimB    12.94  pull back: B's keeper slides a card into the Tooth — click — B · 8 · 7, crown DARK; then B
 *                    opens (the from tile turns to 8 and the crown lights) and B's window lights its own lantern
 *   wakeBad   14.48  A lifts its head; with no latch to check, A's lantern brightens and slips drift in
 *   tworooms  16.36  both lanterns glow in one frame; label 'no self-check: two rooms'
 *   reseat    17.91  the hand reseats the pin; rewind to the moment of waking (A asleep again)
 *   check     20.33  waking, A looks at its candle first: past the band
 *   shutters  25.66  A closes its own shutters from inside; on 'out' its lamp goes out
 *   early     28.86  'cannot': a cooler vignette: a fresh candle whose renewals keep failing (small fizzles); the
 *                    keeper closes its shutters exactly as the flame reaches the 12,000 ms notch, four seconds above
 *                    the band; only after the flame passes the expiry does B's card click (B · 8 · 7, crown dark)
 *   fence     36.12  term tag 'fencing' (reel; top-left kept clear)
 *   knew      38.72  the camera drifts to B's keeper, who sees only A's dark window
 *   foreshadow 47.02 'second look': the camera tilts to the Plate, where a small lamp hook hangs unused
 * Grade returns toward winterBlue across L0523. Text upper right; bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, addPose, defineShot, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { TOWN, l3ToL4, paintTown } from '../sets/harbourTown';
import { BRASS_HI, brass, camAt, clamp01, glowDot, label, lerp, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { leaseCandle, msToY } from '../sets/leaseCandle';
import { handReach } from '../sets/demonstratorHand';
import { handFromRight } from '../sets/ch05-s03-sill';
import { swapCard, wellPt, WELL } from '../sets/wellAndPlate';

const ID = 'ch05-s04';
const W = TOWN.well;
const CAND = { x: TOWN.A.sill.x + 40, y: TOWN.A.sill.y + 1, s: 0.6 };
const SLOT = wellPt({ x: W.x, y: W.y }, 'slot');
const KB = { x: 552, y: W.y, scale: 0.6 };
const TWO: Camera3 = { x: 480, y: 440, z: 300, lens: 1 };
const WIDE: Camera3 = { x: 520, y: 432, z: 210, lens: 1 };
const ONA: Camera3 = { x: 276, y: 432, z: 640, lens: 1 };
/** B's keeper close: A's dark window at left, the Plate (B · 8 · 7, dark) above, the keeper looking up at them */
const KNEW: Camera3 = { x: 552, y: 500, z: 420, lens: 1 };
const KNEW2: Camera3 = { x: 520, y: 478, z: 450, lens: 1 };
/** close on A's candle for the fencing vignette: its notch and band large, A's window beside it */
const CANDLEC: Camera3 = { x: 136, y: 392, z: 760, lens: 1 };
const PLATE: Camera3 = { x: 470, y: 420, z: 430, lens: 1 };
/** vignette: lease ms per screen second */
const VMS = 1000 / 0.36;

/** the pin's point on the candle's latch (L3), out 0..1 along its pull path (leaseCandle's own geometry) */
function pinL3(out: number): { x: number; y: number } {
  const s = CAND.s;
  const base = CAND.y - 16 * s;
  return { x: CAND.x + 17 * s + out * 40 * s, y: base + 2 * s + out * 26 * s };
}

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      sleep: T.beat('sleep'),
      pull: T.beat('pull'),
      burnsW: T.word('L0518', 'burns'),
      burn: T.beat('burn'),
      sees: T.word('L0518', 'sees'),
      claimB: T.beat('claimB'),
      wakeBad: T.beat('wakeBad'),
      tworooms: T.beat('tworooms'),
      reseat: T.beat('reseat'),
      waking: T.word('L0520', 'Waking'),
      check: T.beat('check'),
      past: T.word('L0520', 'Past'),
      closes: T.word('L0520', 'closes'),
      shutters: T.beat('shutters'),
      out: T.word('L0520', 'out'),
      early: T.beat('early'),
      fence: T.beat('fence'),
      knew: T.beat('knew'),
      l523: T.line('L0523').start,
      l523end: T.line('L0523').end,
      foreshadow: T.beat('foreshadow'),
    };
    const v = { t0: b.early + 0.1 };
    const vNotch = v.t0 + 12000 / VMS;
    const vExpiry = v.t0 + 20000 / VMS;
    const cams: CamKey[] = [
      { t: 0, cam: TWO },
      { t: b.pull - 0.6, cam: TWO },
      { t: b.pull + 1.0, cam: ONA },
      { t: b.burn + 0.4, cam: ONA },
      { t: b.claimB - 0.6, cam: TWO },
      { t: b.tworooms - 0.4, cam: TWO },
      { t: b.tworooms + 1.2, cam: WIDE },
      { t: b.waking - 0.6, cam: WIDE },
      { t: b.check + 0.4, cam: ONA },
      { t: b.out + 0.4, cam: ONA },
      { t: b.early - 0.1, cam: { ...ONA, x: ONA.x + 10, z: ONA.z - 30 } },
      { t: b.early + 1.3, cam: CANDLEC },
      { t: vNotch + 1.1, cam: { ...CANDLEC, z: CANDLEC.z + 20 } },
      { t: vExpiry - 0.15, cam: TWO },
      { t: b.knew - 0.6, cam: TWO },
      { t: b.knew + 1.4, cam: KNEW },
      { t: b.foreshadow - 1.4, cam: KNEW2 },
      { t: b.foreshadow + 0.8, cam: PLATE },
      { t: b.D, cam: { ...PLATE, z: PLATE.z + 14 } },
    ];
    return { tl, b, v: { ...v, vNotch, vExpiry }, cams };
  },
  paint(f, _s, sc) {
    const { b, v, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ------------------------------------------------ the grade: emberRed; the vignette cooler; winterBlue at the end
    const cool = seg(t, b.early - 0.1, b.early + 0.6) * (1 - 0.4 * seg(t, b.knew - 0.5, b.knew + 1)) + 0;
    const home = seg(t, b.l523, b.l523end);
    const blend = clamp01(Math.max(cool * 0.45, home));
    if (blend > 0.005) f.setMood('winterBlue', { from: 'emberRed', u: blend });
    // ------------------------------------------------ phases
    const P1 = t < b.reseat - 0.2; // the pin pulled: two rooms
    const P2 = !P1 && t < b.early - 0.1; // pin back: A fences itself on waking
    const P3 = t >= b.early - 0.1; // the cooler vignette: fencing early
    // A's candle
    let nowMs = 9000;
    let flame = 1;
    if (P1) {
      nowMs = lerp(9000, 21000, seg(t, b.burnsW - 0.1, b.burn + 0.9));
      flame = 1 - seg(t, b.burn + 0.5, b.burn + 0.75);
    } else if (P2) {
      nowMs = 21000;
      flame = 0;
    } else {
      nowMs = Math.min(21000, Math.max(0, (t - v.t0) * VMS));
      flame = 1 - seg(t, v.vExpiry - 0.1, v.vExpiry + 0.15);
    }
    // the pin: pulled in P1, reseated on 'reseat'
    const pullOut = seg(t, b.pull + 0.55, b.pull + 1.1);
    const reseatIn = seg(t, b.reseat + 0.15, b.reseat + 0.6);
    const pinSeated = P1 ? pullOut < 0.02 : P2 ? reseatIn > 0.98 : true;
    const pinInHand = (P1 && pullOut >= 0.02) || (P2 && reseatIn <= 0.98 && t < b.reseat + 0.8);
    const handOut = P1 ? pullOut : 1 - reseatIn;
    const reachP = handReach(t, b.pull - 0.5, b.pull + 1.6, 0.7) + handReach(t, b.reseat - 0.45, b.reseat + 0.85, 0.6);
    // A's keeper: asleep / awake; in P2 asleep until 'Waking', then checks the candle
    const asleepK = P1 ? seg(t, b.sleep - 0.1, b.sleep + 0.4) * (1 - seg(t, b.wakeBad - 0.1, b.wakeBad + 0.4)) : P2 ? 1 - seg(t, b.waking - 0.1, b.waking + 0.5) : 0;
    const lookCandle = P2 ? seg(t, b.check - 0.1, b.check + 0.4) : P3 ? 0.6 : 0;
    // A's shutters and lamp
    const shut = P2 ? seg(t, b.closes - 0.1, b.shutters + 0.5) : P3 ? seg(t, v.vNotch - 0.35, v.vNotch + 0.2) : 0;
    const aLamp = P1 ? lerp(0.55, 1, seg(t, b.wakeBad - 0.1, b.wakeBad + 0.5)) : P2 ? 0.55 * (1 - seg(t, b.out - 0.15, b.out + 0.25)) : 0.75 * (1 - seg(t, v.vNotch - 0.1, v.vNotch + 0.3));
    // the Plate and B
    const clickAt = P3 ? v.vExpiry + 0.15 : b.claimB;
    const clicked = (P1 && t >= b.claimB) || P2 || (P3 && t >= clickAt);
    const flipU = P1 ? seg(t, b.claimB, b.claimB + 0.45) : P3 ? seg(t, clickAt, clickAt + 0.45) : 1;
    const bOpen = P1 ? seg(t, b.claimB + 0.7, b.claimB + 1.2) : P2 ? 1 : 0;
    const plate = !clicked
      ? { house: 'A' as const, epoch: 7, from: 7, crown: 1 }
      : bOpen > 0.5
        ? { house: 'B' as const, epoch: 8, from: 8, crown: sm((bOpen - 0.5) * 2), flip: [1, 1, P1 ? clamp01((bOpen - 0.5) * 2) : 1] as [number, number, number] }
        : { house: 'B' as const, epoch: 8, from: 7, crown: 0, flip: [flipU, flipU, 1] as [number, number, number] };
    const bLantern = P1 ? seg(t, b.claimB + 0.9, b.claimB + 1.5) : P2 ? 1 : 0;
    const insert = P1 ? seg(t, b.claimB - 0.35, b.claimB) : P3 ? seg(t, clickAt - 0.35, clickAt) : 0;
    const kbIn = P1 ? seg(t, b.sees - 0.6, b.sees) : 1;
    const slipsK = P1 ? seg(t, b.wakeBad + 0.2, b.wakeBad + 1.6) : 0;
    const hookGlint = seg(t, b.foreshadow - 0.2, b.foreshadow + 0.6) * 1.6;
    const tint = P3 ? { A: '#c8d8e8' } : undefined;
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: aLamp, B: 0.25 + 0.75 * bLantern, C: 0.1 },
        lampTint: tint,
        lanterns: [
          { house: 'A', lit: aLamp * (P1 ? 1 : 0.8), members: 3, tq, door: 0, s: 0.5, slips: slipsK > 0 ? [{ x: -0.5, y: 0.2 + 0.5 * slipsK, alpha: slipsK }, { x: 0.4, y: 0.1 + 0.45 * clamp01(slipsK * 1.4 - 0.4), alpha: clamp01(slipsK * 2 - 0.6) }] : undefined },
          { house: 'B', lit: bLantern, members: 3, tq, door: 0, s: 0.5, alpha: bLantern },
        ],
        plate: { ...plate, glint: [0.2, 0.2, 0.25] },
        plateLegible: true,
        tooth: { shutter: 1, pin: 1, showPin: false, flash: pulse(t, clickAt, 0.08, 0.1, 0.5), flashKind: 'click' },
        well: { bucket: 0.35, glint: 0.3 },
        badge: { text: 'workerd · 28 Oct', legible: false, glint: 0.25 },
        lampPostLit: 0.3,
      },
      {
        L3back: (c, env) => {
          // A's keeper at the window: asleep on folded arms, waking, looking to the candle
          const wn = TOWN.A.main;
          // seated at the sill: head down on folded arms when asleep; lifted toward the candle when checking
          const k = asleepK;
          const pose = addPose(POSES.type, { torso: 16 * k - 4 * lookCandle, neck: 30 * k - 6 * lookCandle, head: 20 * k - 8 * lookCandle, shoulderF: -8 * k, shoulderB: -8 * k });
          c.save();
          c.beginPath();
          c.rect(wn.x - wn.w / 2, wn.y - wn.h / 2, wn.w, wn.h);
          c.clip();
          cast['keeper-a'].draw(c, { x: wn.x - 10, y: wn.y + wn.h / 2 + 30, facing: 'right', pose, scale: 0.3, ink: PUPPET_NEAR_BLACK, light: { x: 0.6, y: -0.6, floor: 0.2 }, edgeRim: { x: 0.7, y: -0.6, px: 2.25, alpha: 0.85, warm: 0.65 } }, env);
          c.restore();
        },
        L3: (c, env) => {
          // A's shutters close from inside: two leaves swing across the window
          if (shut > 0.01) {
            const wn = TOWN.A.main;
            c.fillStyle = env.fill('ink');
            const k = sm(shut);
            for (const sx of [-1, 1]) {
              const x0 = wn.x + sx * (wn.w / 2);
              const w = (wn.w / 2) * k;
              c.fillRect(sx < 0 ? x0 : x0 - w, wn.y - wn.h / 2, w, wn.h);
            }
          }
          // A's candle: workerd's band and notch; the latch and its pin
          leaseCandle(c, env, { x: CAND.x, y: CAND.y, s: CAND.s, nowMs, band: 1, notch: 1, flame, seed: 3, latch: pinSeated ? { pin: 1, open: 0 } : undefined });
          if (P3) {
            // the 12,000 ms renewal notch, ringed in brass across the wax: the shutters close exactly here
            const yN = msToY({ x: CAND.x, y: CAND.y, s: CAND.s }, 12000);
            c.save();
            c.strokeStyle = withAlpha(tone(env, BRASS_HI, 0.15), 0.95);
            c.lineWidth = 1.6;
            c.beginPath();
            c.moveTo(CAND.x - 12 * CAND.s, yN);
            c.lineTo(CAND.x + 12 * CAND.s, yN);
            c.stroke();
            c.restore();
            glowDot(c, CAND.x, yN, 16, tone(env, BRASS_HI, 0.1), 0.8 * pulse(t, v.vNotch - 0.1, 0.12, 0.4, 0.8));
          }
          if (!pinSeated) {
            // the latch hangs open (no pin)
            const s = CAND.s;
            c.save();
            c.translate(CAND.x + 16 * s, CAND.y - 16 * s + 2 * s);
            c.rotate(-1.15);
            c.fillStyle = brass(env, 0.4);
            c.fillRect(0, -1.5 * s, 18 * s, 3 * s);
            c.restore();
          }
          // P3: failed renewals fizzle at 3,000, 6,000, 9,000 ms (small brass sparks that die without a relight)
          if (P3) {
            for (const ms of [3000, 6000, 9000]) {
              const at = v.t0 + ms / VMS;
              const k = pulse(t, at, 0.06, 0.08, 0.35);
              if (k > 0.01) glowDot(c, CAND.x + 10, CAND.y - 16 * CAND.s - 120 * CAND.s * (1 - ms / 20000) - 6, 10, tone(env, BRASS_HI, 0.1), 0.6 * k);
            }
          }
        },
        L4: (c, env) => {
          // B's keeper at the Tooth with a card; inserts on the claim; later, sees only A's dark window
          if (kbIn > 0.01) {
            const lookUp = seg(t, b.knew - 0.2, b.knew + 0.5) * (1 - seg(t, b.foreshadow - 1, b.foreshadow));
            const pose = insert > 0.01 && insert < 1 ? POSES.present : lookUp > 0.5 ? POSES.listen : POSES.stand;
            const o = { x: KB.x, y: KB.y, facing: 'left' as const, pose, scale: KB.scale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM };
            c.save();
            c.globalAlpha *= kbIn;
            cast['keeper-b'].draw(c, o, env);
            const hand = cast['keeper-b'].anchor(o, 'handF');
            const done = (P1 && t > b.claimB + 0.05) || P2 || (P3 && t > clickAt + 0.05);
            if (!done) {
              const p = { x: lerp(hand.x - 4, SLOT.x + 8, insert), y: lerp(hand.y - 6, SLOT.y, insert) };
              swapCard(c, env, { x: p.x, y: p.y, s: 0.75, house: 'B', notch: 12, rot: lerp(-0.3, 0, insert) });
            }
            c.restore();
          }
          // the unused lamp hook on the Plate's frame (foreshadowing the second look)
          if (hookGlint > 0.01) {
            const hk = { x: W.x + WELL.hookR.x + 7, y: W.y + WELL.hookR.y - 2 };
            glowDot(c, hk.x, hk.y, 34, tone(env, BRASS_HI, 0.1), 0.7 * hookGlint * (0.7 + 0.3 * Math.sin(t * 2.4)));
          }
          // the demonstrator's hand, from the lower right, at the pin
          if (reachP > 0.01) {
            const tip = l3ToL4(cam, pinL3(handOut));
            handFromRight(c, env, { tip, reach: reachP, shape: 'pinch', s: 0.55, holding: pinInHand ? 'pin' : 'none' });
          }
        },
      },
    );
    // ------------------------------------------------ type
    const lA = seg(t, b.tworooms - 0.15, b.tworooms + 0.3) * (1 - seg(t, b.reseat - 0.5, b.reseat));
    label(f.c, f.mood, { id: `${ID}-two`, text: 'no self-check: two rooms', x: 1216, y: 86, align: 'right', alpha: lA });
  },
});
