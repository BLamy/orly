/**
 * ch06-s05 — PULL THE PIN: the second look (emberRed lamp change in; back to winterBlue after the pin is reseated).
 *
 * The canonical town framed low (illustrative): the wellhead centre-left with the Plate above, House A up-left, House
 * B up-right, the sender's cottage at the right; under the wellhead the ground is cut away to show the Well's side:
 * epoch 8's shelf (left of the shaft) and epoch 7's shelf (right). The keeper of House A stands at the wellhead with
 * a lamp on a hinged pole; the red-tagged pin (the second look) is seated in the hinge. L5 (the railing) is skipped
 * for this low framing; L1–L4 slide against each other on every move.
 *
 *   pull      0.60  the demonstrator's hand (lower right) draws the pin; the hinge goes slack, the lamp droops
 *   (L0621)        A's scroll rides A's pulley line, its lease in order (A's candle above its band)
 *   stall     7.61  'freezes': A's whole house freezes (cold window, keeper held mid-gesture, scroll stopped halfway);
 *                  A's candle burns down past its band while it is frozen
 *   claim    10.31  B's keeper sets B's card in the Tooth: click; the Plate turns to B · 8 · 7 (crown dark); B's Book
 *                  takes the head of shelf 8
 *   lands    12.75  A wakes; its scroll goes down and lands at the end of shelf 7
 *   badtick  16.24  'anyway': A rings its bell without looking up (a sour bell); the letter flies; a ticked slip
 *                  appears at the sender's window; label 'no second look: a false tick'
 *   maybe    19.04  push in on the cut: shelf 7 holds the late scroll, shelf 8 does not
 *   reseat   20.53  the hand reseats the pin; the false tick unwinds (letter back, slip un-ticked)
 *   eight    23.64  the lamp rises to the Plate: B and 8 glint
 *   error    26.25  the waiting letter at A's window becomes a red-edged error slip
 *   clear    28.25  later: the late scroll is swept from shelf 7 (the grade returns to winterBlue)
 *   lost     32.18  cut to the sender's window: a reply blows away before it arrives; label
 *                  'celld: no ack is no proof of absence'
 *   absent   38.54  the un-ticked slip shows a faint question mark
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, textSwap, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { TOWN, l3ToL4, paintTown, pulleyAt } from '../sets/harbourTown';
import { WELL, pinShape, swapCard, tilePt } from '../sets/wellAndPlate';
import { bellSwing, houseBell, letter } from '../sets/heldLetter';
import { leaseCandle } from '../sets/leaseCandle';
import { demonstratorHand } from '../sets/demonstratorHand';
import { book, scroll } from '../sets/walRibbon';
import { epochShelf } from '../sets/wellCutaway';
import { bakeRect, camAt, clamp01, glowDot, label, lerp, pulse, seg, slip, sm, tone, twos, type CamKey } from '../sets/common';

const ID = 'ch06-s05';
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const W = TOWN.well;
const SLOT = { x: W.x + WELL.slot.x, y: W.y + WELL.slot.y };
const KA = { x: 326, y: W.y, scale: 0.64 };
const KB0 = { x: 790, y: W.y }, KB = { x: 566, y: W.y, scale: 0.6 };
const CUT = { x0: 214, x1: 706, y0: 640, y1: 800 };
const SHAFT = { x0: 404, x1: 460 };
const SH7 = { x: 478, y: 726, w: 210 };
const SH8 = { x: 236, y: 726, w: 150 };
const SENDER = { x: TOWN.sender.win.x, y: TOWN.sender.win.y };
const BELL_A = { x: 276, y: 368 };
const CANDLE_A = { x: 208, y: 425 };

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      pull: T.beat('pull'),
      sends: T.word('L0621', 'sends'),
      stall: T.beat('stall'),
      claim: T.beat('claim'),
      lands: T.beat('lands'),
      shelf: T.wordEnd('L0621', 'shelf'),
      rings: T.word('L0622', 'rings'),
      badtick: T.beat('badtick'),
      maybe: T.beat('maybe'),
      reseat: T.beat('reseat'),
      looks: T.word('L0623', 'looks'),
      eight: T.beat('eight'),
      error: T.beat('error'),
      clear: T.beat('clear'),
      honest: T.word('L0624', 'One'),
      lost: T.beat('lost'),
      sender: T.word('L0624', 'sender'),
      absent: T.beat('absent'),
    };
    const MAIN = C(560, 560, 60);
    const cams: CamKey[] = [
      { t: 0, cam: C(450, 500, 280) },
      { t: b.pull + 0.4, cam: C(440, 496, 300) },
      { t: b.sends + 0.6, cam: C(500, 528, 170) },
      { t: b.stall + 0.6, cam: MAIN },
      { t: b.lands - 0.4, cam: C(560, 570, 60) },
      { t: b.lands + 0.8, cam: C(520, 630, 150) },
      { t: b.badtick - 0.4, cam: C(640, 545, 30) },
      { t: b.maybe - 0.2, cam: C(620, 560, 50) },
      { t: b.maybe + 0.6, cam: C(470, 650, 220) },
      { t: b.reseat + 0.5, cam: C(450, 510, 250) },
      { t: b.eight + 0.3, cam: C(470, 500, 200) },
      { t: b.error - 0.3, cam: C(300, 452, 290) },
      { t: b.clear + 0.2, cam: C(480, 640, 180) },
      { t: b.honest - 0.25, cam: C(500, 640, 190) },
      // a cut to the sender's window for the coda
      { t: b.honest - 0.24, cam: C(980, 548, 560) },
      { t: b.D, cam: C(986, 552, 610) },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // the grade returns to winterBlue after the pin is back (quantised: bounded bakes)
    const toBlue = Math.round(seg(t, b.error + 0.6, b.clear + 1.2) * 25) / 25;
    if (toBlue > 0) f.setMood('winterBlue', { from: 'emberRed', u: toBlue });
    // ---------------------------------------------------------------- state
    const pinOut = t > b.pull + 0.25 && t < b.reseat + 0.15;
    const frozen = t > b.stall - 0.1 && t < b.lands - 0.9;
    const freezeK = seg(t, b.stall - 0.1, b.stall + 0.4) * (1 - seg(t, b.lands - 1.0, b.lands - 0.6));
    // A's scroll on its pulley line: halfway when the house freezes; resumes, lands on shelf 7
    const rideU = t < b.stall ? 0.55 * seg(t, b.sends - 0.2, b.stall) : t < b.lands - 0.9 ? 0.55 : lerp(0.55, 1, seg(t, b.lands - 0.9, b.lands - 0.4));
    const drop = seg(t, b.lands - 0.4, b.lands + 0.25);
    // the candle: lease in order, then burns past its band while A is frozen
    const nowMs = t < b.stall ? lerp(5200, 6400, seg(t, 0, b.stall)) : t < b.lands - 0.9 ? lerp(6400, 19200, seg(t, b.stall, b.claim - 0.2)) : 19300;
    const claimed = t >= b.claim - 0.05;
    const flipU = clamp01((t - (b.claim - 0.05)) / 0.35);
    const falseTick = t > b.badtick - 0.2 && t < b.reseat + 0.3;
    const bellAt = b.rings + 0.05;
    const letterFly = clamp01((t - (b.badtick + 0.1)) / 1.2) * (t < b.reseat + 0.3 ? 1 : 0);
    const raise = t < b.pull ? 1 : t < b.reseat + 0.6 ? 0 : seg(t, b.looks - 0.1, b.eight - 0.1);
    const droop = t < b.pull + 0.25 ? 0 : t < b.reseat + 0.5 ? seg(t, b.pull + 0.25, b.pull + 0.9) : 1 - seg(t, b.reseat + 0.5, b.looks);
    const err = seg(t, b.error - 0.15, b.error + 0.4);
    const swept = seg(t, b.clear - 0.1, b.clear + 1.0);
    // the coda
    const coda = t >= b.honest - 0.24;
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 1, B: claimed ? 0.85 : 0.35, C: 0 },
        lampTint: { A: frozen ? '#a9b9c8' : undefined },
        lanterns: [{ house: 'A', lit: frozen ? 0.35 : 1, members: 4, tq: frozen ? 0 : tq, door: 0, s: 0.62 }],
        plate: {
          house: claimed ? 'B' : 'A',
          epoch: claimed ? 8 : 7,
          from: 7,
          crown: claimed ? 0 : 1,
          flip: claimed && flipU < 1 ? [flipU, flipU, 1] : undefined,
          glint: [pulse(t, b.eight, 0.15, 0.5, 1) + 0.5 * raise * (claimed ? 1 : 0), pulse(t, b.eight + 0.3, 0.15, 0.5, 1) + 0.5 * raise * (claimed ? 1 : 0), 0],
        },
        plateLegible: true,
        tooth: { shutter: 0, pin: 1, showPin: false, flash: pulse(t, b.claim, 0.05, 0.12, 0.5), flashKind: 'click' },
        well: { bucket: lerp(0.2, 0.9, drop), glint: 0.4 },
        lampPostLit: 0.4,
        skip: { L5: true },
      },
      {
        L3: (c, env) => {
          // A's lease candle on its sill
          leaseCandle(c, env, { x: CANDLE_A.x, y: CANDLE_A.y, s: 0.34, nowMs, band: 1, notch: 1, flame: nowMs < 19900 ? 1 : 0 });
          // A's bell on its bracket
          houseBell(c, env, { x: BELL_A.x, y: BELL_A.y, s: 0.62, swing: falseTick ? bellSwing(t, bellAt, 0.55) : 0, ring: falseTick ? pulse(t, bellAt, 0.08, 0.4, 1.0) : 0, sour: true });
          // the held letter on A's sill (until the false bell sends it; an error after the honest look)
          if (letterFly <= 0) letter(c, env, { x: TOWN.A.main.x + 10, y: TOWN.A.sill.y - 14, s: 0.75, rot: -0.1, error: err });
        },
        L4back: (c, env) => {
          const o = { x: TOWN.sender.seat.x, y: TOWN.sender.seat.y, facing: 'left' as const, pose: POSES.sit, scale: TOWN.sender.seatScale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: { x: -0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } };
          cast.sender.draw(c, o, env);
        },
        L4: (c, env) => {
          const ink = env.fill('ink');
          // ------------------------------------------------ the cut into the Well's side (only when framed above the caption band)
          const cutA = clamp01((630 - toScreen(LAYERS.L4, cam, 0, SH7.y + 36).y) / 30);
          c.save();
          c.globalAlpha = cutA;
          bakeRect(f, c, env, `ch06s05/cut`, { x: CUT.x0 - 10, y: CUT.y0 - 10, w: CUT.x1 - CUT.x0 + 20, h: CUT.y1 - CUT.y0 + 30 }, (cc) => {
            cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
            cc.fillRect(CUT.x0, CUT.y0, CUT.x1 - CUT.x0, CUT.y1 - CUT.y0);
            cc.strokeStyle = withAlpha(env.fill('rim'), 0.14);
            cc.lineWidth = 1;
            for (let y = CUT.y0 + 20; y < CUT.y1; y += 26) {
              cc.beginPath();
              cc.moveTo(CUT.x0, y);
              cc.lineTo(CUT.x1, y);
              cc.stroke();
            }
            // the shaft continuing down under the wellhead
            cc.fillStyle = mixLab(env.fill('ink'), '#000000', 0.4);
            cc.fillRect(SHAFT.x0, CUT.y0, SHAFT.x1 - SHAFT.x0, CUT.y1 - CUT.y0);
            // the cut's rough edge
            cc.strokeStyle = withAlpha(env.fill('rim'), 0.45);
            cc.lineWidth = 1.6;
            cc.beginPath();
            cc.moveTo(CUT.x0, CUT.y0);
            for (let y = CUT.y0; y <= CUT.y1; y += 10) cc.lineTo(CUT.x0 + Math.sin(y * 0.2) * 3, y);
            cc.moveTo(CUT.x1, CUT.y0);
            for (let y = CUT.y0; y <= CUT.y1; y += 10) cc.lineTo(CUT.x1 + Math.sin(y * 0.17) * 3, y);
            cc.moveTo(CUT.x0, CUT.y0);
            cc.lineTo(CUT.x1, CUT.y0);
            cc.stroke();
          });
          const items7 = [{ kind: 'book' as const, alpha: cutA }, { kind: 'scroll' as const, tag: 1, alpha: cutA }, { kind: 'scroll' as const, tag: 1, alpha: cutA }];
          epochShelf(c, env, { x: SH7.x, y: SH7.y, w: SH7.w, s: 1.0, label: 'epoch 7', labelLegible: true, items: items7, id: `${ID}-sh7`, alpha: cutA });
          epochShelf(c, env, { x: SH8.x, y: SH8.y, w: SH8.w, s: 1.0, label: 'epoch 8', labelLegible: true, items: [], id: `${ID}-sh8`, alpha: cutA });
          // B's Book takes the head of shelf 8 once B claims
          const bb = seg(t, b.claim + 0.4, b.claim + 1.2);
          if (bb > 0.01) {
            glowDot(c, SH8.x + 30, SH8.y - 12, 26, tone(env, '#e8dcc0', 0.2), 0.3 * pulse(t, b.claim + 1.0, 0.2, 0.3, 0.7));
          }
          epochBook(c, env, SH8.x + 26, SH8.y, bb * cutA);
          // the late scroll: down the shaft, onto the end of shelf 7; swept later
          if (drop > 0.01) {
            const endX = SH7.x + 22 + 3 * 40 + 18;
            const u = sm(drop);
            const x = u < 0.5 ? (SHAFT.x0 + SHAFT.x1) / 2 : lerp((SHAFT.x0 + SHAFT.x1) / 2, endX, sm((u - 0.5) * 2));
            const y = u < 0.5 ? lerp(CUT.y0 - 10, SH7.y - 30, u * 2) : lerp(SH7.y - 30, SH7.y - 7, sm((u - 0.5) * 2));
            scroll(c, env, { x: x + swept * 60, y, s: 0.85, rot: u < 0.5 ? Math.PI / 2 : 0, tag: 1, alpha: (1 - sm(swept)) * cutA, glint: pulse(t, b.maybe + 0.6, 0.2, 0.6, 0.8) });
            if (swept > 0.01 && swept < 1) glowDot(c, endX + 40, SH7.y - 8, 26, tone(env, '#cfd6dc', 0.3), 0.3 * Math.sin(Math.PI * swept));
          }
          // a cold beat on 'never': shelf 8 is lit too, empty of the late scroll
          const look8 = pulse(t, b.maybe, 0.3, 1.0, 0.8);
          if (look8 > 0.01) {
            c.save();
            c.globalAlpha = 0.6 * look8 * cutA;
            c.strokeStyle = tone(env, '#cfd6dc', 0.3);
            c.setLineDash([5, 4]);
            c.lineWidth = 1.5;
            c.strokeRect(SH8.x + 60, SH8.y - 30, 80, 26);
            c.restore();
          }
          c.restore();
          // ------------------------------------------------ A's scroll on its pulley line (frozen halfway)
          if (drop <= 0.01 && t > b.sends - 0.25) {
            const p = rideU < 1 ? pulleyAt(cam, 'A', sm(rideU)) : { x: W.x, y: W.y - 146 };
            scroll(c, env, { x: p.x, y: p.y + 6, s: 0.9, rot: -0.3, tag: 1 });
          }
          // ------------------------------------------------ keeper B: walks in, sets B's card in the Tooth
          const walkU = seg(tq, b.claim - 1.9, b.claim - 0.6);
          if (t > b.claim - 2.0) {
            const kx = lerp(KB0.x, KB.x, walkU);
            const walking = walkU > 0 && walkU < 1;
            const kpB = walking ? (Math.floor(tq * 4) % 2 ? POSES.walkStand : POSES.stand) : blendPose(POSES.stand, POSES.present, pulse(t, b.claim - 0.3, 0.2, 0.3, 0.6));
            const koB = { x: kx, y: KB.y, facing: 'left' as const, pose: kpB, scale: KB.scale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM };
            cast['keeper-b'].draw(c, koB, env);
            const cardU = clamp01((t - (b.claim - 0.45)) / 0.4);
            if (cardU < 1 && t > b.claim - 0.6) {
              const hb = cast['keeper-b'].anchor(koB, 'handF');
              swapCard(c, env, { x: lerp(hb.x, SLOT.x, sm(cardU)), y: lerp(hb.y, SLOT.y, sm(cardU)), s: 0.8, house: 'B', notch: 12, rot: 0.2 * (1 - cardU) });
            }
          }
          // ------------------------------------------------ keeper A and the lamp on its hinged pole
          const still = frozen ? b.stall : t;
          const kpA = blendPose(POSES.stand, POSES.point, 0.45 * Math.floor(raise * 6) / 6 + (frozen ? 0.2 : 0));
          const koA = { x: KA.x, y: KA.y, facing: 'right' as const, pose: kpA, scale: KA.scale, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: frozen ? { x: -0.75, y: -0.65, px: 2.5, alpha: 0.95, warm: 0 } : MOON_RIM };
          void still;
          cast['keeper-a'].draw(c, koA, env);
          const hand = cast['keeper-a'].anchor(koA, 'handF');
          const hinge = { x: hand.x + 8, y: hand.y - 64 };
          // upper segment: upright (-62°), to the Plate (-28°), drooped (+64°)
          const plateTile = tilePt({ x: W.x, y: W.y }, 0);
          const toPlate = Math.atan2(plateTile.y + 10 - hinge.y, plateTile.x - 40 - hinge.x);
          let ang = lerp(-1.08, toPlate, raise * (t > b.reseat ? 1 : 0.2));
          ang = lerp(ang, 1.1, droop);
          const len = 88;
          const lamp = { x: hinge.x + Math.cos(ang) * len, y: hinge.y + Math.sin(ang) * len };
          c.strokeStyle = ink;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(hand.x, hand.y + 6);
          c.lineTo(hinge.x, hinge.y);
          c.lineTo(lamp.x, lamp.y);
          c.stroke();
          c.fillStyle = ink;
          c.beginPath();
          c.arc(hinge.x, hinge.y, 4, 0, Math.PI * 2);
          c.fill();
          c.fillRect(lamp.x - 7, lamp.y - 6, 14, 20);
          c.fillStyle = tone(env, '#ffd27a', 0.05);
          c.fillRect(lamp.x - 4, lamp.y - 2, 8, 12);
          lampAt.x = lamp.x;
          lampAt.y = lamp.y + 4;
          if (raise > 0.05 && t > b.reseat) glowDot(c, tilePt({ x: W.x, y: W.y }, 1).x, W.y + WELL.plate.y, 120, tone(env, '#ffcf7a', 0.05), 0.35 * raise);
          // the pin: seated in the hinge, or riding in the hand
          if (!pinOut) pinShape(c, env, hinge.x + 2, hinge.y - 2, 0.5, 1.3);
          const handIn = clamp01((t - (b.pull - 0.55)) / 0.5) * (1 - clamp01((t - (b.pull + 0.35)) / 0.8));
          const handBack = clamp01((t - (b.reseat - 0.6)) / 0.55) * (1 - clamp01((t - (b.reseat + 0.25)) / 0.8));
          if (handIn > 0.01) demonstratorHand(c, env, { tip: { x: hinge.x + 4, y: hinge.y }, reach: sm(handIn), shape: 'pinch', s: 0.3, holding: t > b.pull + 0.25 ? 'pin' : 'none' });
          if (handBack > 0.01) demonstratorHand(c, env, { tip: { x: hinge.x + 4, y: hinge.y }, reach: sm(handBack), shape: 'pinch', s: 0.3, holding: t < b.reseat + 0.15 ? 'pin' : 'none' });
          // ------------------------------------------------ the false tick: the letter flies to the sender's window
          if (letterFly > 0 && letterFly < 1) {
            const from = l3ToL4(cam, { x: TOWN.A.main.x + 10, y: TOWN.A.sill.y - 10 });
            const u = sm(letterFly);
            letter(c, env, { x: lerp(from.x, SENDER.x - 30, u), y: lerp(from.y, SENDER.y - 24, u) - Math.sin(Math.PI * u) * 110, s: lerp(0.45, 0.6, u), rot: u * 0.5 });
          }
          if (!coda) {
            const st = seg(t, b.badtick + 1.2, b.badtick + 1.6) * (falseTick ? 1 : 0);
            if (st > 0.01) slip(c, env, { x: SENDER.x - 26, y: SENDER.y - 16, w: 34, tick: clamp01((t - (b.badtick + 1.5)) / 0.5), alpha: st });
          } else {
            // the coda: a reply on its way home blows away; the sender's slip stays un-ticked
            const comeU = clamp01((t - (b.honest + 0.1)) / 1.8);
            const blow = seg(t, b.lost - 0.3, b.lost + 1.6);
            if (comeU > 0 && blow < 1) letter(c, env, { x: lerp(SENDER.x - 330, SENDER.x - 120, sm(comeU)), y: lerp(SENDER.y - 90, SENDER.y - 50, sm(comeU)) + Math.sin(tq * 6) * 3, s: 0.8, rot: Math.sin(tq * 4) * 0.1, blown: blow, alpha: 1 - seg(blow, 0.7, 1) });
            slip(c, env, { x: SENDER.x - 20, y: SENDER.y - 12, w: 46, rot: -0.06, tick: 0, question: seg(t, b.absent - 0.15, b.absent + 0.6) });
          }
        },
        afterRim: () => {
          f.practical({ x: lampAt.x, y: lampAt.y, kind: 'lamp', seed: 97, intensity: frozen ? 0.25 : 0.5, radius: 70, layer: 'L4' });
        },
      },
    );
    // ---------------------------------------------------------------- type (upper left)
    const sw = textSwap(t, b.lost - 0.1, 0.4);
    const a1 = seg(t, b.badtick - 0.1, b.badtick + 0.35) * (1 - seg(t, b.reseat - 0.3, b.reseat + 0.2)) * sw.out;
    label(f.c, f.mood, { id: `${ID}-false`, text: 'no second look: a false tick', x: 64, y: 92, alpha: a1, italic: true });
    const a2 = sw.in;
    label(f.c, f.mood, { id: `${ID}-lost`, text: 'celld: no ack is no proof of absence', x: 64, y: 92, alpha: a2, italic: true });
    void freezeK;
  },
});

const lampAt = { x: 0, y: 0 };
/** a Book at the head of an epoch shelf (fades in) */
function epochBook(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, a: number): void {
  if (a <= 0.01) return;
  book(c, env, { x, y: y - (1 - a) * 14, s: 0.9, alpha: a });
}
