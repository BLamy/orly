/**
 * ch03-s01 — the Well's first lesson, freshness (winterBlue, iris in). The canonical square (sets/harbourTown.ts):
 * the Well at the left third, the Plate on its iron frame (blank, dim), House A's lit window up on the terrace, the
 * L6 lamp-post at the right. Badge 'Amazon S3' on the wellhead hook from the first frame (the store's own behaviour).
 *
 *   (iris)    open on the Room Lantern's warm reflection in the Well's water; pull up and out to the square, then a
 *             slow truck left with a slight dolly in toward the wellhead
 *   stale     keeper A drops a sheet with a FRESH stroke into the Well, winds the bucket straight back up: the
 *             sheet in it carries the PREVIOUS, faded stroke
 *   paths     the camera cranes down the shaft: a narrow sliver cutaway (serverCyan glints): the fresh sheet goes down
 *             the left channel past one cache while the bucket rises up the right channel past another holding the
 *             old copy; the sliver closes and the camera rises
 *   date      '1 December 2020'
 *   fresh     the same again: down goes a fresh stroke, up comes that same fresh stroke; the brass ring on the bucket's
 *             handle catches the moon; label 'read after write: always the latest'
 *   newest    the camera settles on the full bucket at the lip; the water steadies
 * Nothing below y 634 (the shaft is seen only with the camera craned down).
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { BRASS_HI, SEA_CYAN, badge, camAt, clamp01, glowDot, label, lerp, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { TOWN, paintTown } from '../sets/harbourTown';
import { WELL } from '../sets/wellAndPlate';
import { dateStamp } from '../sets/ch02-s01-kit';
import { keeper, keeperHand, markedSheet, type KeeperOpts, type Mark } from '../sets/ch03-s01-square';

const ID = 'ch03-s01';
const W = TOWN.well;
const MOUTH = { x: W.x, y: W.y - WELL.ringH - 2 };
/** the bucket at the lip (wellLive: bucket 0 = up) */
const BUCKET_UP = { x: W.x, y: W.y + WELL.winchY + 44 - 14 };
const KX = 338;
const KS = 0.56;
const SLIVER = { x: W.x + 4, w: 124, top: W.y + 4, bottom: W.y + 236 };

const OPEN: Camera3 = { x: 432, y: 556, z: 600, lens: 1 };
const OUT: Camera3 = { x: 604, y: 392, z: 110, lens: 1 };
const TRUCK: Camera3 = { x: 530, y: 420, z: 290, lens: 1 };
const NEAR: Camera3 = { x: 470, y: 468, z: 430, lens: 1 };
const DOWN: Camera3 = { x: 452, y: 712, z: 530, lens: 1 };
const BACK: Camera3 = { x: 478, y: 456, z: 400, lens: 1 };
const LIP: Camera3 = { x: 446, y: 494, z: 520, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      stale: T.beat('stale'),
      paths: T.beat('paths'),
      date: T.beat('date'),
      fresh: T.beat('fresh'),
      newest: T.beat('newest'),
      s3: T.word('L0301', 'S3'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: OPEN },
      { t: 6.6, cam: OUT },
      { t: 12.4, cam: TRUCK },
      { t: b.stale - 0.6, cam: NEAR },
      { t: b.paths - 1.0, cam: { ...NEAR, x: NEAR.x - 4 } },
      { t: b.paths + 0.2, cam: DOWN },
      { t: b.paths + 2.0, cam: { ...DOWN, y: DOWN.y + 6 } },
      { t: b.date - 0.2, cam: BACK },
      { t: b.fresh - 0.8, cam: { ...BACK, x: BACK.x - 8 } },
      { t: b.newest + 0.2, cam: LIP },
      { t: b.D, cam: { ...LIP, z: LIP.z + 14 } },
    ];
    // the two runs: hold up, drop, bucket down, bucket up, take and hold up
    const run = (show: number, held: number) => ({ show, drop: show + 1.2, down0: show + 1.5, down1: show + 2.6, up1: held - 0.9, take: held - 0.5, held });
    const r1 = run(b.stale - 5.4, b.stale);
    const r2 = run(b.fresh - 4.6, b.fresh);
    return { tl, b, cams, r1, r2 };
  },
  paint(f, _s, sc) {
    const { b, cams, r1, r2 } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const r = t < (r1.held + r2.show) / 2 ? r1 : r2;
    const second = r === r2;
    // bucket depth (0 up .. 1 down): down after the drop, back up for the take
    const bucket = t < r.down0 ? 0.08 : t < r.down1 ? lerp(0.08, 1, sm((t - r.down0) / (r.down1 - r.down0))) : t < r.up1 - 1.6 ? 1 : lerp(1, 0.02, sm((t - (r.up1 - 1.6)) / 1.6));
    const loaded = t > r.down1 && t < r.take + 0.15;
    const waterSteady = seg(t, b.newest - 0.3, b.newest + 1.2);
    const ring = Math.sin(Math.PI * seg(t, b.fresh - 0.2, b.fresh + 0.9));
    // the keeper's gestures: hold up (present), lean to drop / take, hold up again
    const present = Math.max(seg(t, r.show - 0.4, r.show + 0.2) * (1 - seg(t, r.drop - 0.3, r.drop)), seg(t, r.take + 0.1, r.held + 0.2) * (1 - seg(t, r.held + 2.2, r.held + 2.8)));
    const lean = Math.max(seg(t, r.drop - 0.4, r.drop) * (1 - seg(t, r.drop + 0.3, r.drop + 0.8)), seg(t, r.take - 0.4, r.take) * (1 - seg(t, r.take + 0.1, r.take + 0.5)));
    const K: KeeperOpts = { id: 'keeper-a', x: KX, y: W.y, facing: 'right', scale: KS, tq, present, lean };
    const sliver = seg(t, b.paths - 0.5, b.paths + 0.3) * (1 - seg(t, b.date - 0.9, b.date - 0.3));
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 1, B: 0.1, C: 0 },
        lanterns: [{ house: 'A', lit: 1, members: 3, tq }],
        plate: { house: '', epoch: '', from: '', crown: 0, dim: 0.55 },
        tooth: null,
        well: { bucket, load: 'none', glint: 0.3 + 0.4 * waterSteady, reflect: 1 - 0.6 * seg(t, 3, 7) + 0.3 * waterSteady },
        badge: null,
        lampPostLit: 0.4,
      },
      {
        L4: (c, env) => {
          // the store's tag on the wellhead's right hook (art: never read at this distance)
          badge(c, env, { x: W.x + WELL.hookR.x + 6, y: W.y + WELL.hookR.y - 2, text: 'Amazon S3', legible: false, glint: 0.3 + 0.6 * Math.sin(Math.PI * seg(t, b.s3 - 0.2, b.s3 + 0.8)), swing: 0.03 * Math.sin(tq * 1.3) });
          // the ground in section below the square (seen only when the camera cranes down): stone strata
          if (cam.y > 520) strata(c, env, seg(cam.y, 520, 640));
          if (sliver > 0.01) shaftSliver(c, env, t, tq, sliver, b.paths);
          keeper(c, env, K);
          const hand = keeperHand(K);
          // the sheet: held up fresh, dropped into the mouth; later taken from the bucket and held up
          const markDown: Mark = second ? 'fresh2' : 'fresh';
          const markUp: Mark = second ? 'fresh2' : 'old';
          if (t < r.drop + 0.6) {
            const fall = clamp01((t - r.drop) / 0.55);
            const x = lerp(hand.x + 6, MOUTH.x, sm(fall)), y = lerp(hand.y - 12, MOUTH.y + 6, fall * fall);
            markedSheet(c, env, { x, y, w: 34, mark: markDown, rot: -0.15 + fall * 1.2, wet: 1, alpha: seg(t, r.show - 0.6, r.show - 0.3) * (1 - seg(fall, 0.75, 1)) });
          }
          if (loaded) {
            // riding up in the bucket (only above the ring mouth), then taken into the hand
            const by = lerp(W.y + WELL.winchY + 44, W.y - WELL.ringH + 30, bucket) - 14;
            const tk = clamp01((t - r.take) / 0.5);
            const x = lerp(W.x + 4, hand.x + 6, sm(tk)), y = lerp(by - 6, hand.y - 12, sm(tk));
            if (y < MOUTH.y + 2 || tk > 0) markedSheet(c, env, { x, y, w: lerp(14, 34, sm(tk)), mark: markUp, rot: lerp(-0.6, -0.1, tk) });
          }
          if (t >= r.take + 0.15) markedSheet(c, env, { x: hand.x + 6, y: hand.y - 12, w: 34, mark: markUp, rot: -0.1, wet: second ? 0.6 : 0 });
          // the brass ring on the bucket's handle catches the moon on 'latest'
          if (ring > 0.01) {
            const by = lerp(W.y + WELL.winchY + 44, W.y - WELL.ringH + 30, bucket);
            glowDot(c, BUCKET_UP.x - 9, by - 22, 14, tone(env, BRASS_HI, 0.1), 0.85 * ring);
          }
        },
      },
    );
    // ---------------------------------------------------------------- type
    dateStamp(f.c, f.mood, { id: `${ID}-date`, text: '1 December 2020', x: 1222, y: 66, alpha: seg(t, b.date - 0.1, b.date + 0.4) });
    label(f.c, f.mood, { id: `${ID}-latest`, text: 'read after write: always the latest', x: 64, y: 96, alpha: seg(t, b.fresh - 0.15, b.fresh + 0.35) });
  },
});

/** faint stone courses and the shaft's lining under the square */
function strata(c: C2, env: PaintEnv, a: number): void {
  c.save();
  c.globalAlpha = a;
  c.strokeStyle = withAlpha(env.fill('rim'), 0.1);
  c.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const y = W.y + 30 + i * 26;
    c.beginPath();
    for (let x = W.x - 700; x <= W.x + 900; x += 40) c.lineTo(x, y + Math.sin(x * 0.013 + i) * 4);
    c.stroke();
  }
  // the shaft's stone lining either side of the sliver
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.25);
  c.fillRect(SLIVER.x - SLIVER.w / 2 - 34, W.y, 24, SLIVER.bottom - W.y + 20);
  c.fillRect(SLIVER.x + SLIVER.w / 2 + 10, W.y, 24, SLIVER.bottom - W.y + 20);
  c.restore();
}

/** the sliver cutaway down the shaft: two channels, a cache in each; the write descends left, the read rises right */
function shaftSliver(c: C2, env: PaintEnv, t: number, tq: number, open: number, paths: number): void {
  const S = SLIVER;
  const h = (S.bottom - S.top) * sm(open);
  const x0 = S.x - S.w / 2;
  const ink = env.fill('ink');
  const cy = tone(env, SEA_CYAN, 0.2);
  c.save();
  // the cut: a dark section with cyan-lit stone edges
  c.fillStyle = mixLab(ink, '#000000', 0.3);
  c.fillRect(x0 - 10, S.top, S.w + 20, h);
  c.beginPath();
  c.rect(x0, S.top, S.w, h);
  c.clip();
  c.fillStyle = mixLab(env.fill('set'), cy, 0.18);
  c.fillRect(x0, S.top, S.w, h);
  // the divider between the channels
  c.fillStyle = ink;
  c.fillRect(S.x - 3, S.top, 6, h);
  c.strokeStyle = withAlpha(cy, 0.4);
  c.lineWidth = 1;
  for (let y = S.top + 18; y < S.top + h; y += 22) {
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(x0 + 6, y);
    c.moveTo(x0 + S.w - 6, y);
    c.lineTo(x0 + S.w, y);
    c.stroke();
  }
  // two caches (cyan glints at different depths): the left one takes the new copy, the right one holds the old
  const cL = { x: S.x - S.w / 4, y: S.top + 160 }, cR = { x: S.x + S.w / 4, y: S.top + 110 };
  for (const cc of [cL, cR]) {
    c.fillStyle = ink;
    c.fillRect(cc.x - 22, cc.y, 44, 12);
  }
  const u = clamp01((tq - (paths - 0.2)) / 2.0);
  // the fresh sheet goes down the left channel and settles in its cache
  markedSheet(c, env, { x: cL.x, y: lerp(S.top + 14, cL.y - 12, sm(u)), w: 30, mark: 'fresh' });
  // the bucket rises up the right channel from the right-hand cache, carrying the old copy
  const by = lerp(cR.y + 4, S.top + 4, sm(clamp01((tq - (paths + 0.3)) / 1.8)));
  markedSheet(c, env, { x: cR.x, y: by - 18, w: 28, mark: 'old' });
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(cR.x - 15, by - 6);
  c.lineTo(cR.x + 15, by - 6);
  c.lineTo(cR.x + 11, by + 12);
  c.lineTo(cR.x - 11, by + 12);
  c.closePath();
  c.fill();
  c.restore();
  glowDot(c, cL.x, cL.y + 2, 24, cy, 0.7 * open);
  glowDot(c, cR.x, cR.y + 2, 24, cy, 0.7 * open);
  // the sliver's cut edges
  c.strokeStyle = withAlpha(cy, 0.6 * open);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x0, S.top);
  c.lineTo(x0, S.top + h);
  c.moveTo(x0 + S.w, S.top);
  c.lineTo(x0 + S.w, S.top + h);
  c.stroke();
  void t;
}
