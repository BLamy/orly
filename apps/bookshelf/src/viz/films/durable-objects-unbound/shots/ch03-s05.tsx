/**
 * ch03-s05 — 'compatible' is not a guarantee (labGreen, cut). The square (sets/harbourTown.ts) now holds TWO wells,
 * identical in stone, rope and bucket: the canonical Well at the left third, a look-alike at the right with a
 * bright, unworn Tooth; a labGreen work-lamp hangs over the look-alike. Between them, celld's small TEST RIG (four
 * brass cards on a rack, engraved symbols only) carries the badge 'celld 0.6.3' (the rig, not a well).
 *
 *   (wipe)    the L6 lamp-post sweeps across the lens as the camera trucks left onto the two wells
 *   doc       quote card: '…ignores the condition fails late and silently' — celld guarantees, v0.6.3
 *   two       the race replays at the look-alike in miniature: both cards accepted; A's and B's windows both light
 *   silent    close: the look-alike's shutter swings shut as if refusing, and the second card slides in under it,
 *             without a sound (no flash)
 *   four      the rig feeds its four cards one at a time into the LEFT well on their words: create (accept),
 *             create again (REFUSED, spat back), update (accept), stale update (REFUSED); label
 *             'create · refuse · update · refuse stale'
 *   twofail   two small green check lamps light over the two refusals
 *   range     a brass measuring rod goes down the left well and draws up exactly the marked span of a sheet
 *   lock      the rig's lid shuts and a padlock drops on it
 *   earn      the camera settles on the left well; the look-alike darkens and recedes into fog
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, quoteCard, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { BRASS_HI, EMBER, badge, brass, camAt, clamp01, glowDot, label, lerp, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, paintTown } from '../sets/harbourTown';
import { WELL, plate, swapCard, tooth, wellBase, wellLive } from '../sets/wellAndPlate';
import { scroll } from '../sets/walRibbon';
import { bakeRes } from '../sets/ch02-s01-kit';
import { keeper, keeperHand, type KeeperOpts } from '../sets/ch03-s01-square';

const ID = 'ch03-s05';
const LW = TOWN.well;
const RW = { x: 760, y: 612 };
const LSLOT = { x: LW.x + WELL.slot.x, y: LW.y + WELL.slot.y };
const RSLOT = { x: RW.x + WELL.slot.x, y: RW.y + WELL.slot.y };
const RIG = { x: 596, y: 612, w: 96, top: 548 };
const RACK = [0, 1, 2, 3].map((i) => ({ x: RIG.x - 39 + i * 26, y: RIG.top - 14 }));
const SYMBOLS = ['+', '++', '~', '~!'];
const LAMP = { x: RW.x + 6, y: 380 };

const WIPE0: Camera3 = { x: 900, y: 440, z: 180, lens: 1 };
const WIDE: Camera3 = { x: 600, y: 432, z: 210, lens: 1 };
const SILENT: Camera3 = { x: 774, y: 520, z: 520, lens: 1 };
const RIGCAM: Camera3 = { x: 528, y: 530, z: 540, lens: 1 };
const RANGE: Camera3 = { x: 480, y: 512, z: 440, lens: 1 };
const EARN: Camera3 = { x: 500, y: 456, z: 300, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      doc: T.beat('doc'),
      two: T.beat('two'),
      silent: T.beat('silent'),
      four: T.beat('four'),
      twofail: T.beat('twofail'),
      range: T.beat('range'),
      lock: T.beat('lock'),
      earn: T.beat('earn'),
      feeds: [T.word('L0327', 'create'), T.word('L0327', 'create#2'), T.word('L0327', 'update'), T.word('L0327', 'update#2')],
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIPE0 },
      { t: 2.6, cam: WIDE },
      { t: b.silent - 1.4, cam: { ...WIDE, x: WIDE.x + 30, z: WIDE.z + 20 } },
      { t: b.silent - 0.2, cam: SILENT },
      { t: b.four - 0.9, cam: { ...SILENT, x: SILENT.x - 6 } },
      { t: b.four + 0.6, cam: RIGCAM },
      { t: b.range - 0.9, cam: { ...RIGCAM, x: RIGCAM.x - 8 } },
      { t: b.range + 0.4, cam: RANGE },
      { t: b.lock - 0.6, cam: { ...RANGE, x: RANGE.x + 40 } },
      { t: b.earn + 0.8, cam: EARN },
      { t: b.D, cam: { ...EARN, z: EARN.z + 16 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const recede = seg(t, b.earn - 0.3, b.earn + 1.6);
    // the race at the look-alike: two cards, both accepted; both windows light
    const raceA = clamp01((tq - (b.two - 1.0)) / 0.7), raceB = clamp01((tq - (b.two - 0.6)) / 0.7);
    const both = seg(t, b.two - 0.1, b.two + 0.5) * (1 - seg(t, b.earn - 0.5, b.earn + 1.0));
    // silent: the look-alike's shutter swings shut, and a card slides under it anyway
    const rShutter = seg(t, b.silent - 0.6, b.silent - 0.35) * (1 - seg(t, b.four, b.four + 0.4));
    const sneak = clamp01((tq - (b.silent - 0.2)) / 0.9);
    // the four test writes into the LEFT well
    const feed = b.feeds.map((at, i) => {
      const go = clamp01((tq - (at - 0.75)) / 0.65);
      const res = clamp01((tq - (at - 0.1)) / 0.5);
      return { at, go, res, refused: i % 2 === 1 };
    });
    const lShutter = seg(t, b.feeds[0] - 0.05, b.feeds[0] + 0.15) * (1 - seg(t, b.feeds[2] - 0.9, b.feeds[2] - 0.6));
    const flash = Math.max(...feed.map((q) => Math.sin(Math.PI * seg(t, q.at - 0.12, q.at + 0.3))));
    const thunk = feed.some((q) => q.refused && t > q.at - 0.12 && t < q.at + 0.3);
    const checks = [seg(t, b.twofail - 0.15, b.twofail + 0.2), seg(t, b.twofail + 0.05, b.twofail + 0.4)];
    const lid = seg(t, b.lock - 0.35, b.lock);
    const KA: KeeperOpts = { id: 'keeper-a', x: RW.x - 104, y: RW.y, facing: 'right', scale: 0.5, tq, present: seg(t, b.two - 1.3, b.two - 1.0) * (1 - seg(t, b.two + 0.3, b.two + 0.8)) };
    const KB: KeeperOpts = { id: 'keeper-b', x: RW.x + 96, y: RW.y, facing: 'left', scale: 0.5, tq, present: seg(t, b.two - 0.9, b.two - 0.6) * (1 - seg(t, b.silent + 0.6, b.silent + 1.1)) };
    const keepersA = seg(t, 4.5, 5.5) * (1 - seg(t, b.four - 1.0, b.four - 0.2));
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: both, B: both, C: 0 },
        lanterns: both > 0.02 ? [
          { house: 'A', lit: both, members: 3, tq, alpha: both },
          { house: 'B', lit: both, members: 3, tq, alpha: both },
        ] : [],
        plate: { house: '', epoch: '', from: '', crown: 0, dim: 0.35 },
        tooth: { shutter: lShutter, pin: 1, showPin: false, flash, flashKind: thunk ? 'thunk' : 'click' },
        well: { bucket: 0.3, glint: 0.3 },
        badge: null,
        sender: false,
        lampPostLit: 0.25,
      },
      {
        L4: (c, env) => {
          // ---- the look-alike well (identical stone, rope, bucket; a bright unworn Tooth)
          c.save();
          c.globalAlpha = 1 - recede * 0.7;
          bakeRes(f, c, env, `${ID}-rwell`, { x: RW.x - 130, y: RW.y - 300, w: 260, h: 312 }, (cc) => wellBase(cc, env, { x: RW.x, y: RW.y }));
          wellLive(c, env, { x: RW.x, y: RW.y, bucket: 0.3, glint: 0.3 });
          plate(c, env, { x: RW.x, y: RW.y, plate: { house: t < b.two - 0.2 ? '' : t < b.two + 0.25 ? 'A' : 'B', epoch: '', from: '', crown: 0, dim: 0.35, flip: [t < b.two + 0.25 ? seg(t, b.two - 0.2, b.two) : seg(t, b.two + 0.25, b.two + 0.45), 1, 1] } });
          tooth(c, env, { x: RW.x, y: RW.y, tooth: { shutter: rShutter, pin: 1, showPin: false, flash: Math.max(Math.sin(Math.PI * seg(t, b.two - 0.35, b.two)), Math.sin(Math.PI * seg(t, b.two + 0.05, b.two + 0.4))), flashKind: 'click' } });
          glowDot(c, RSLOT.x - 6, RSLOT.y - 4, 10, tone(env, BRASS_HI, 0.05), 0.55);
          // the work-lamp over it, on a bracket from the right post
          c.fillStyle = env.fill('ink');
          c.fillRect(RW.x + 62, LAMP.y - 30, 3, 120);
          c.fillRect(LAMP.x, LAMP.y - 30, RW.x + 64 - LAMP.x, 3);
          c.beginPath();
          c.moveTo(LAMP.x - 12, LAMP.y + 10);
          c.lineTo(LAMP.x + 12, LAMP.y + 10);
          c.lineTo(LAMP.x + 5, LAMP.y - 2);
          c.lineTo(LAMP.x - 5, LAMP.y - 2);
          c.closePath();
          c.fill();
          c.fillRect(LAMP.x - 1, LAMP.y - 30, 2, 28);
          c.restore();
          // ---- the keepers' race in miniature, then the silent slide
          if (keepersA > 0.01) {
            c.save();
            c.globalAlpha = keepersA;
            keeper(c, env, KA);
            keeper(c, env, KB);
            c.restore();
            for (const [K, u, h] of [[KA, raceA, 'A'], [KB, raceB, 'B']] as const) {
              if (u <= 0 || u >= 1) continue;
              const hand = keeperHand(K);
              swapCard(c, env, { x: lerp(hand.x, RSLOT.x, sm(u)), y: lerp(hand.y, RSLOT.y, sm(u)), s: 0.55, house: h, alpha: 1 - seg(u, 0.85, 1) });
            }
            if (sneak > 0 && sneak < 1) {
              // B's second card: under the closed shutter, in, no flash
              const hand = keeperHand(KB);
              const e = sm(sneak);
              swapCard(c, env, { x: lerp(hand.x, RSLOT.x, e), y: lerp(hand.y, RSLOT.y + 5, e), s: 0.55 * (1 - 0.3 * seg(sneak, 0.7, 1)), house: 'B', alpha: 1 - seg(sneak, 0.85, 1) });
            }
          }
          // ---- the test rig (celld's startup check), its badge, its four cards, its check lamps and lid
          rig(c, env, t, tq, feed, checks, lid, b);
          // ---- the ranged read: a measuring rod down the left well, drawing up exactly the marked span
          rangedRead(c, env, t, tq, b.range);
        },
      },
    );
    f.practical({ x: LAMP.x, y: LAMP.y + 6, kind: 'lamp', seed: 47, intensity: 0.5 * (1 - recede * 0.85), radius: 60, layer: 'L4' });
    // the look-alike recedes into fog
    if (recede > 0.01) f.fog({ yCenter: 470, height: 340, alpha: 0.22 * recede, drift: 6 });
    // ---------------------------------------------------------------- type
    quoteCard(f.c, { quote: '…ignores the condition fails late and silently', speaker: 'celld guarantees, v0.6.3', x: 60, y: 140, width: 420, align: 'left', at: b.doc - 0.1, dur: b.two - 0.8 - b.doc, fade: 0.45 }, { t, mood: f.mood });
    label(f.c, f.mood, { id: `${ID}-four`, text: 'create · refuse · update · refuse stale', x: 64, y: 92, alpha: seg(t, b.four - 0.1, b.four + 0.35) * (1 - seg(t, b.earn - 0.6, b.earn)) });
  },
});

interface Feed {
  at: number;
  go: number;
  res: number;
  refused: boolean;
}
function rig(c: C2, env: PaintEnv, t: number, tq: number, feed: Feed[], checks: number[], lid: number, b: { four: number; earn: number }): void {
  const ink = env.fill('ink');
  // the rig: a small cabinet with a slotted rack on top
  c.fillStyle = ink;
  c.fillRect(RIG.x - RIG.w / 2, RIG.top, RIG.w, RIG.y - RIG.top);
  c.fillRect(RIG.x - RIG.w / 2 - 4, RIG.top - 4, RIG.w + 8, 6);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.45);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(RIG.x - RIG.w / 2 - 4, RIG.top - 4);
  c.lineTo(RIG.x + RIG.w / 2 + 4, RIG.top - 4);
  c.stroke();
  // the badge hangs from its front corner (the rig carries it, not a well)
  badge(c, env, { x: RIG.x + RIG.w / 2 - 6, y: RIG.top + 8, text: 'celld 0.6.3', s: 0.8, legible: false, glint: 0.35, swing: 0.03 * Math.sin(tq * 1.1) });
  // the four cards: standing in the rack until fed; each to the left well's slot; refusals spat back, punched
  feed.forEach((q, i) => {
    const home = RACK[i];
    const showAt = b.four - 0.4 + i * 0.1;
    const a = seg(t, showAt, showAt + 0.3);
    if (a <= 0.01) return;
    let x = home.x, y = home.y, alpha = a, punched = 0, rot = 0;
    if (q.go > 0) {
      const e = sm(q.go);
      x = lerp(home.x, LSLOT.x, e);
      y = lerp(home.y, LSLOT.y, e) - Math.sin(Math.PI * e) * 40;
      rot = -0.4 * Math.sin(Math.PI * e);
    }
    if (q.go >= 1) {
      if (!q.refused) alpha *= 1 - seg(q.res, 0.1, 0.5);
      else {
        const back = sm(clamp01((tq - (q.at + 0.15)) / 0.6));
        x = lerp(LSLOT.x, home.x, back);
        y = lerp(LSLOT.y, home.y, back) - Math.sin(Math.PI * back) * 30;
        punched = seg(t, q.at + 0.05, q.at + 0.3);
      }
    }
    if (lid > 0.5 && q.go <= 0) alpha *= 1 - seg(lid, 0.5, 1);
    swapCard(c, env, { x, y, s: 0.72, symbol: SYMBOLS[i], punched, rot, alpha, legible: false });
  });
  // the two check lamps over the refused slots
  for (const [k, i] of [[0, 1], [1, 3]] as const) {
    const p = RACK[i];
    c.fillStyle = mixLab(ink, '#a8d878', 0.25 + 0.5 * checks[k]);
    c.beginPath();
    c.arc(p.x, RIG.top - 30, 3.2, 0, Math.PI * 2);
    c.fill();
    if (checks[k] > 0.01) glowDot(c, p.x, RIG.top - 30, 16, tone(env, '#b8f08a', 0.15), 0.8 * checks[k]);
  }
  // the lid swings shut; the padlock drops onto it
  if (lid > 0.01) {
    c.save();
    c.translate(RIG.x - RIG.w / 2 - 4, RIG.top - 4);
    c.rotate(-1.4 * (1 - lid));
    c.fillStyle = ink;
    c.fillRect(0, -6, RIG.w + 8, 6);
    c.fillRect(0, -6, 4, 26 * lid);
    c.restore();
    const lk = seg(lid, 0.85, 1);
    if (lk > 0) {
      const ly = RIG.top - 14 + (1 - sm(lk)) * -18;
      c.fillStyle = brass(env, 0.4);
      c.fillRect(RIG.x - 7, ly, 14, 11);
      c.strokeStyle = brass(env, 0.6);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(RIG.x, ly, 5, Math.PI, 0);
      c.stroke();
    }
  }
  void EMBER;
}
function rangedRead(c: C2, env: PaintEnv, t: number, tq: number, at: number): void {
  const down = sm(clamp01((tq - (at - 0.4)) / 0.7));
  const up = sm(clamp01((tq - (at + 0.6)) / 0.9));
  const gone = 1 - seg(t, at + 3.2, at + 3.8);
  if (down <= 0 || gone <= 0.01) return;
  const mouthY = LW.y - WELL.ringH;
  const tipY = lerp(mouthY - 70, mouthY + 10, down) - up * 80;
  const x = LW.x - 12;
  c.save();
  c.globalAlpha = gone;
  // the rod, with two engraved marks a span apart
  c.save();
  c.beginPath();
  c.rect(x - 40, -400, 80, mouthY + 400);
  c.clip();
  c.strokeStyle = brass(env, 0.6);
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(x, tipY - 120);
  c.lineTo(x, tipY);
  c.stroke();
  c.strokeStyle = mixLab(BRASS_HI, '#ffffff', 0.3);
  c.lineWidth = 1.4;
  for (const dy of [12, 46]) {
    c.beginPath();
    c.moveTo(x - 6, tipY - dy);
    c.lineTo(x + 6, tipY - dy);
    c.stroke();
  }
  // the span it draws up: exactly the marked length of a sheet, riding between the marks
  if (up > 0) scroll(c, env, { x: x + 9, y: tipY - 29, s: 0.42, rot: Math.PI / 2, alpha: seg(up, 0, 0.2) });
  c.restore();
  c.restore();
}
