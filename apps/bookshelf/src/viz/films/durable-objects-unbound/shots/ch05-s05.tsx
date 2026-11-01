/**
 * ch05-s05 — borrowed clocks (winterBlue; a celld terrace in labGreen on the right half at the end).
 *
 * Occluder wipe: the camera trucks left past the L6 lamp-post onto the canonical terrace (workerd's, badge
 * 'workerd · 28 Oct' on the wellhead). Each house's sill carries a small brass clock-face beside its candle; the
 * Well's own clock is set into the wellhead.
 *
 *   measure  2.55  'measures': fine threads run from each sill clock down to the Well's clock; each nudges to agree
 *   zero     6.21  one thread (B's) snaps in the wind; that clock shows a small engraved '0': an assumed zero
 *   drift    7.58  the camera drifts off the snapped thread toward the Plate (the real referee: the second look)
 *   celld   12.27  a lamp change on the RIGHT HALF only: celld's terrace in labGreen (same geography, its own
 *                  wellhead with badge 'celld 0.6.3', a plain plate, shorter ten-second candles with a renewal mark
 *                  a third of the way down); label 'celld: reads the record, not a clock'. The two never merge:
 *                  a hard seam divides them and workerd's numbers never sit beside celld's badge
 *   (17.08)        'Well proves a write': a scroll rides down into celld's Well; the water answers (a bucket proof)
 *   record  20.55  celld's keeper looks up at its plate — not at any clock — and only then rings its bell
 * Bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, POSES, PUPPET_NEAR_BLACK, addPose, defineShot, legibleSize, mixLab, textRole, toScreen, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { cast, MOON_LIGHT, MOON_RIM } from '../cast';
import { TOWN, l3ToL4, paintTown, type HouseId } from '../sets/harbourTown';
import { BRASS_HI, brass, camAt, clamp01, glowDot, label, lerp, pulse, seg, tone, twos, type C2, type CamKey } from '../sets/common';
import { leaseCandle } from '../sets/leaseCandle';
import { houseBell } from '../sets/heldLetter';
import { WELL } from '../sets/wellAndPlate';

const ID = 'ch05-s05';
const W = TOWN.well;
const SPLIT = 652;
const WIPE: Camera3 = { x: 792, y: 404, z: 140, lens: 1 };
const TERR: Camera3 = { x: 560, y: 410, z: 140, lens: 1 };
const REF: Camera3 = { x: 600, y: 432, z: 260, lens: 1 };
const GREEN: Camera3 = { x: 236, y: 432, z: 250, lens: 1 };
/** close on celld's Well: the scroll goes down, the bucket comes back, the keeper looks up at the plate */
const GCLOSE: Camera3 = { x: 300, y: 470, z: 470, lens: 1 };
/** close on B's sill clock (its thread snaps; an engraved 0) */
const ZCAM: Camera3 = { x: 640 + 1.3 * (756 - 640), y: 360 + 1.3 * (452 - 360), z: 900, lens: 1 };
/** the Well's own clock, set into the wellhead's ring (L4) */
const WCLOCK = { x: W.x - 36, y: W.y - 24 };
const HOUSES: HouseId[] = ['A', 'B', 'C'];
/** a sill clock's spot beside each house's candle (L3) */
/** final review r1: B's clock is hung up and right of the pulley lines' crossing, so no line ever cuts its zero */
const sillClock = (h: HouseId) => (h === 'B' ? { x: TOWN.B.sill.x + 54, y: TOWN.B.sill.y - 44 } : { x: TOWN[h].sill.x + (h === 'A' ? 64 : 48), y: TOWN[h].sill.y - 14 });
const sillCandle = (h: HouseId) => ({ x: TOWN[h].sill.x + (h === 'A' ? 40 : 26), y: TOWN[h].sill.y + 1 });

function clockFace(c: C2, env: PaintEnv, x: number, y: number, r: number, ang: number, zero = 0): void {
  c.save();
  c.fillStyle = brass(env, 0.4);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(tone(env, '#efe3c8', 0.25), env.mood.fg, 0.15);
  c.beginPath();
  c.arc(x, y, r * 0.78, 0, Math.PI * 2);
  c.fill();
  // the hand leaves the face as the zero inks, so nothing lies across the digit
  if (zero < 0.45) {
    c.save();
    c.globalAlpha *= 1 - Math.min(1, zero * 2.2);
    c.strokeStyle = env.fill('ink');
    c.lineWidth = Math.max(0.8, r * 0.14);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.sin(ang) * r * 0.55, y - Math.cos(ang) * r * 0.55);
    c.stroke();
    c.restore();
  }
  if (zero > 0.01) {
    textRole(c, 'texture', () => {
      c.globalAlpha *= zero;
      c.fillStyle = mixLab('#54401a', env.mood.fg, 0.12); // dark brass (red is reserved)
      c.font = `700 ${r * 0.9}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('0', x, y + r * 0.04);
    });
  }
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      measure: T.beat('measure'),
      cannot: T.word('L0524', 'cannot'),
      zero: T.beat('zero'),
      drift: T.beat('drift'),
      celld: T.beat('celld'),
      proves: T.word('L0526', 'proves'),
      record: T.beat('record'),
      clock: T.word('L0526', 'clock'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: WIPE },
      { t: 3.0, cam: TERR },
      { t: b.cannot - 1.5, cam: { ...TERR, x: TERR.x + 10 } },
      { t: b.cannot + 0.3, cam: ZCAM },
      { t: b.zero + 0.9, cam: { ...ZCAM, z: ZCAM.z + 20 } },
      { t: b.celld - 0.6, cam: REF },
      { t: b.D, cam: { ...REF, x: REF.x - 8, z: REF.z + 16 } },
    ];
    const green: CamKey[] = [
      { t: 0, cam: GREEN },
      { t: b.proves - 1.3, cam: { ...GREEN, x: GREEN.x + 8, z: GREEN.z + 16 } },
      { t: b.proves - 0.1, cam: GCLOSE },
      { t: b.D, cam: { ...GCLOSE, z: GCLOSE.z + 18 } },
    ];
    return { tl, b, cams, green };
  },
  paint(f, _s, sc) {
    const { b, cams, green } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // ------------------------------------------------ workerd's terrace (the whole frame until 'celld')
    const thread = seg(t, b.measure - 0.1, b.measure + 1.2);
    const agree = seg(t, b.measure + 0.8, b.measure + 1.8);
    const snap = seg(t, b.cannot - 0.05, b.cannot + 0.35);
    const zeroK = seg(t, b.zero - 0.2, b.zero + 0.4);
    const offs: Record<HouseId, number> = { A: 0.9, B: -1.1, C: 0.6 };
    paintTown(
      f,
      {
        cam,
        cams: [...cams.map((k) => k.cam)],
        lamps: { A: 1, B: 0.7, C: 0.6 },
        lanterns: [{ house: 'A', lit: 0.9, members: 3, tq, door: 0, s: 0.5 }],
        plate: { house: 'A', epoch: 7, from: 7, crown: 1, glint: [0.2, 0.2, 0.2 + 0.5 * seg(t, b.drift, b.drift + 1.5)] },
        plateLegible: true,
        tooth: { shutter: 1, pin: 1, showPin: false },
        well: { bucket: 0.35, glint: 0.3 },
        badge: { text: 'workerd · 28 Oct', legible: false, glint: 0.25 },
        lampPostLit: 0.45,
      },
      {
        L3: (c, env) => {
          for (const h of HOUSES) {
            const cp = sillCandle(h);
            leaseCandle(c, env, { x: cp.x, y: cp.y, s: 0.34, nowMs: h === 'A' ? 4000 : h === 'B' ? 7000 : 2500, band: 1, notch: 1, seed: h.charCodeAt(0) });
            const k = sillClock(h);
            // each sill clock nudges to agree with the Well's (B's, after its thread snaps, reads an assumed zero)
            const wob = h === 'B' ? lerp(offs.B, 0, agree) * (1 - snap) + snap * -0.4 : lerp(offs[h], 0, agree);
            clockFace(c, env, k.x, k.y, 15, wob + Math.sin(tq * 0.8) * 0.02, h === 'B' ? zeroK : 0);
          }
        },
        L4: (c, env) => {
          // workerd's lease candle on its wellhead (twenty seconds: its band and renewal notch), for the comparison
          leaseCandle(c, env, { x: W.x + 52, y: W.y - 50, s: 0.7, nowMs: 3000, band: 1, notch: 1, seed: 40 });
          // the Well's own clock, set into the wellhead
          clockFace(c, env, WCLOCK.x, WCLOCK.y, 11, 0.1);
          // the threads from each sill clock down to the Well's clock
          if (thread > 0.01) {
            const k4 = toScreen(LAYERS.L4, cam, 0, 0).k;
            for (const h of HOUSES) {
              const sk = sillClock(h);
              const a = l3ToL4(cam, { x: sk.x + 6, y: sk.y + 9 });
              const col = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.75);
              c.save();
              c.strokeStyle = col;
              c.lineWidth = Math.max(0.35, 1.5 / k4);
              c.beginPath();
              if (h === 'B' && snap > 0) {
                // snapped in the wind: two loose ends curl and fall
                // the near end dangles from the sill clock (L3), curling in the wind; the far end lies by the Well
                const k = sillClock('B');
                const tip = l3ToL4(cam, { x: k.x + 14 + 4 * Math.sin(tq * 5) * snap, y: k.y + 9 + 30 * snap });
                const ctl = l3ToL4(cam, { x: k.x - 10, y: k.y + 14 * snap });
                const pre = l3ToL4(cam, { x: lerp(k.x, k.x - 60, 1 - snap), y: lerp(k.y, k.y + 30, 1 - snap) });
                c.moveTo(a.x, a.y);
                c.quadraticCurveTo(lerp(ctl.x, pre.x, 1 - snap), lerp(ctl.y, pre.y, 1 - snap), tip.x, tip.y);
                c.moveTo(WCLOCK.x, WCLOCK.y);
                c.quadraticCurveTo(WCLOCK.x + 30, WCLOCK.y + 10, WCLOCK.x + 60, WCLOCK.y + 14 * snap);
              } else {
                const u = thread;
                c.moveTo(a.x, a.y);
                c.quadraticCurveTo((a.x + WCLOCK.x) / 2, (a.y + WCLOCK.y) / 2 + 20, lerp(a.x, WCLOCK.x, u), lerp(a.y, WCLOCK.y, u));
              }
              c.stroke();
              c.restore();
            }
          }
          if (snap > 0.01 && snap < 1) glowDot(c, lerp(l3ToL4(cam, sillClock('B')).x, WCLOCK.x, 0.5), lerp(l3ToL4(cam, sillClock('B')).y, WCLOCK.y, 0.5), 14, tone(env, BRASS_HI, 0.1), 0.5 * (1 - snap));
        },
      },
    );
    // ------------------------------------------------ celld's terrace on the right half (a lamp change there only)
    const dim = seg(t, b.celld - 0.5, b.celld - 0.05);
    const rise = seg(t, b.celld - 0.05, b.celld + 0.9);
    if (dim > 0.001) {
      f.c.save();
      f.c.fillStyle = withAlpha(mixLab(f.mood.fg, '#000000', 0.3), 0.92 * dim);
      f.c.fillRect(SPLIT, 0, 1280 - SPLIT, 720);
      f.c.restore();
    }
    if (rise > 0.001) {
      const cam2 = camAt(green, t);
      const down = seg(t, b.proves - 0.7, b.proves + 0.2);
      const up = seg(t, b.proves + 0.7, b.proves + 1.9);
      const proven = pulse(t, b.proves + 0.3, 0.15, 0.3, 0.9);
      const look = seg(t, b.record - 0.7, b.record - 0.1);
      const ringAt = b.clock + 0.35;
      const ring = pulse(t, ringAt, 0.1, 0.2, 0.8);
      f.c.save();
      f.c.beginPath();
      f.c.rect(SPLIT, 0, 1280 - SPLIT, 720);
      f.c.clip();
      f.setMood('labGreen');
      paintTown(
        f,
        {
          cam: cam2,
          cams: green.map((k) => k.cam),
          variant: 'celld',
          lamps: { A: 1, B: 0.8, C: 0.7, Bup: 0.6, Cup: 0.6 },
          lanterns: [{ house: 'A', lit: 0.85, members: 3, tq, door: 0, s: 0.5, colour: 'green' }],
          plate: { house: 'A', epoch: '', from: '', crown: 0.4, glint: [0.3 * look, 0.3 * look, 0.3 * look] },
          tooth: null,
          well: { bucket: lerp(0.3, 1, down) - 0.7 * up, load: up > 0 ? 'none' : 'scroll', glint: 0.3 + 0.9 * proven },
          badge: { text: 'celld 0.6.3', legible: true, glint: 0.3 },
          neighbourCords: 0.6,
          lampPostLit: 0.3,
          skip: { L6: true },
        },
        {
          L3: (c, env) => {
            // celld's candles: ten-second leases, half as tall, a renewal mark a third of the way down; no band
            for (const h of HOUSES) {
              const cp = sillCandle(h);
              leaseCandle(c, env, { x: cp.x, y: cp.y, s: 0.34, nowMs: h === 'B' ? 3000 : 1500, variant: 'celld', notch: 1, seed: h.charCodeAt(0) + 3 });
            }
          },
          L4: (c, env) => {
            // celld's keeper at its own Well: watches the scroll go down, then looks up at the plate, then rings
            const pose = addPose(POSES.listen, { neck: -14 * look + 8 * down * (1 - look), head: -16 * look + 10 * down * (1 - look) });
            const o = { x: 548, y: W.y, facing: 'left' as const, pose, scale: 0.6, ink: PUPPET_NEAR_BLACK, light: MOON_LIGHT, edgeRim: MOON_RIM };
            cast['keeper-a'].draw(c, o, env);
            const hk = { x: W.x + WELL.hookR.x + 8, y: W.y + WELL.hookR.y };
            houseBell(c, env, { x: hk.x, y: hk.y, s: 0.9, swing: 0.5 * ring * Math.sin(tq * 18), ring });
            // celld's lease candle on the wellhead: ten seconds, half as tall, a renewal mark a third of the way down
            leaseCandle(c, env, { x: W.x + 52, y: W.y - 50, s: 0.7, nowMs: 1500, variant: 'celld', notch: 1, seed: 41 });
            // the plate answers the look (the record read after the bucket proof)
            glowDot(c, W.x, W.y - 212, 70, tone(env, '#e8f0c0', 0.1), 0.35 * pulse(t, b.record - 0.1, 0.2, 0.6, 1.0));
          },
        },
      );
      // the lamp change: the right half rises from dark into labGreen lamplight
      f.c.fillStyle = withAlpha('#000000', 0.85 * (1 - rise));
      f.c.fillRect(SPLIT, 0, 1280 - SPLIT, 720);
      f.c.restore();
      f.setMood('winterBlue');
      // the seam: the two terraces never merge
      f.c.save();
      f.c.fillStyle = '#05080b';
      f.c.fillRect(SPLIT - 3, 0, 6, 720);
      f.c.fillStyle = withAlpha('#a5b9c4', 0.35 * rise);
      f.c.fillRect(SPLIT - 4, 0, 1, 720);
      f.c.fillStyle = withAlpha('#afba96', 0.45 * rise);
      f.c.fillRect(SPLIT + 3, 0, 1, 720);
      f.c.restore();
    }
    // ------------------------------------------------ type
    const lA = seg(t, b.celld + 0.2, b.celld + 0.7) * (1 - seg(t, b.D - 0.8, b.D - 0.2) * 0.85);
    label(f.c, f.mood, { id: `${ID}-celld`, text: 'celld: reads the record, not a clock', x: 1222, y: 86, align: 'right', alpha: lA });
    void legibleSize;
    void toScreen;
    void LAYERS;
    void clamp01;
  },
});
