/**
 * ch06-s02 — the Scissors: workerd's keeper cuts the ribbon only after a stamp (candleAmber, paper-wipe in).
 *
 * Inside the Room Lantern in House A (illustrative), candlelit. L2 the lantern's paper wall, L3 its ribs, the candle
 * on its stand (the warm practical) and the lamp hook with the badge 'workerd · 28 Oct'; L4 the workbench: the
 * main-file ledger and the basket at the left, the keeper of House A seated at the right with brass scissors, the
 * ribbon written at the right edge by an unseen quill and sliding left along the bench; L5 a blurred rib (right).
 *
 *   hears    2.17  each new frame emerging from the quill tugs a thread tied to the keeper's finger
 *   hold     4.46  the frames since the last cut lie on the bench (a growing run)
 *   cut      7.21  a stamped frame arrives; the scissors close just after it; the length rolls into the basket;
 *                  label 'cut only after a stamp' (upper left)
 *   whole   11.57  a second run: two unstamped frames, scissors open and waiting; the stamp; then the cut
 *   rollback 16.89 a run of two frames with no stamp dims (rolled back); on 'writes straight over them' the next
 *                  transaction's frames are pasted over them, its stamp follows, then the cut
 *   fresh   26.70  checkpoint: page copies slide from the cut lengths into the ledger (6 → 7 pages); a fresh leader
 *                  card emerges at the quill; the keeper ties a fresh thread to it
 * Stamps are red INK (the WAL commit mark), never wax. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, pose, textSwap, withAlpha, mixLab } from '../../../film';
import type { Camera3 } from '../../../film';
import { cast } from '../cast';
import { badge, camAt, clamp01, cord, label, lerp, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { ledger, ribbon, scroll, type RibbonFrame } from '../sets/walRibbon';
import { basket, bench, lanternRibs, lanternWall, nearRibs, quill, scissors } from '../sets/ch06-s01-lanternRoom';

const ID = 'ch06-s02';
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });
const RS = 1.25;
const PITCH = (14 + 40 + 3) * RS;
const Q = 1016; // the quill's mouth: new frames emerge to its left
const RIB_Y = 470;
const BENCH = { x0: 250, x1: 1250, y: 500, floorY: 800 };
const BASKET = { x: 340, y: 500, s: 1.15 };
const LEDGER = { x: 548, y: 498, s: 2.1 };
const KEEPER = { x: 1196, y: 704, scale: 1.34 };
const CANDLE = { x: 700, y: 236 };
const RIM = { x: -0.8, y: -0.6, px: 2.5, alpha: 0.85, warm: 0.7 };
const SIT_HOLD = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 6, neck: 4, head: 6, shoulderF: 48, elbowF: 48, wristF: 0, shoulderB: 34, elbowB: 60, wristB: 6 }, { handF: 'grip', handB: 'relaxed' });
const SIT_REACH = pose({ hipF: 88, kneeF: -86, hipB: 84, kneeB: -80, torso: 12, neck: 2, head: 8, shoulderF: 70, elbowF: 18, wristF: -4, shoulderB: 34, elbowB: 60, wristB: 6 }, { handF: 'grip', handB: 'relaxed' });

interface Run {
  arrive: number[];
  /** index of the stamped frame (its last), or -1 */
  stampAt: number;
  stampVal?: number;
  cut: number;
  /** frames pasted over (rollback) at these times, by index */
  paste?: { i: number; at: number }[];
  dimAt?: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      workerd: T.word('L0606', "workerd's"),
      hears: T.beat('hears'),
      hold: T.beat('hold'),
      stamp: T.word('L0606', 'stamp'),
      cut: T.beat('cut'),
      whole: T.beat('whole'),
      rollback: T.beat('rollback'),
      noStamp: T.word('L0608', 'no'),
      next: T.word('L0608', 'next'),
      them: T.wordEnd('L0608', 'them'),
      copies: T.word('L0609', 'copies'),
      file: T.wordEnd('L0609', 'file'),
      fresh: T.beat('fresh'),
      keeper2: T.word('L0609', 'keeper'),
    };
    const runs: Run[] = [
      { arrive: [b.hears + 0.1, b.hears + 1.15, b.hold + 0.1, b.stamp - 0.05], stampAt: 3, stampVal: 7, cut: b.cut + 0.05 },
      { arrive: [b.cut + 2.1, b.cut + 3.0, b.whole - 0.45], stampAt: 2, stampVal: 7, cut: b.whole + 0.35 },
      {
        arrive: [b.rollback - 0.95, b.rollback + 0.05, b.next + 0.95], stampAt: 2, stampVal: 8, cut: b.them + 0.7,
        paste: [{ i: 0, at: b.next + 0.05 }, { i: 1, at: b.next + 0.5 }], dimAt: b.noStamp - 0.2,
      },
    ];
    const cams: CamKey[] = [
      { t: 0, cam: C(640, 372, 30) },
      { t: b.hears + 0.4, cam: C(700, 380, 70) },
      { t: b.cut - 0.4, cam: C(900, 396, 250) },
      { t: b.cut + 1.6, cam: C(840, 394, 220) },
      { t: b.whole + 1.2, cam: C(920, 396, 260) },
      { t: b.rollback - 1.4, cam: C(910, 396, 250) },
      { t: b.them + 1.2, cam: C(930, 398, 270) },
      { t: b.copies, cam: C(740, 388, 130) },
      { t: b.file + 0.4, cam: C(580, 384, 130) },
      { t: b.keeper2, cam: C(880, 388, 170) },
      { t: b.D, cam: C(900, 390, 190) },
    ];
    return { tl, b, runs, cams };
  },
  paint(f, _s, sc) {
    const { b, runs, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    f.backlight({ sunX: CANDLE.x, sunY: CANDLE.y, intensity: 0.8 });
    f.layer('L2', (c, env) => lanternWall(f, c, env, { x: -480, y: -300, w: 2240, h: 1400 }, { key: 'ch06s02', glowX: CANDLE.x, glowY: CANDLE.y + 40 }));
    f.fog('A');
    f.layer('L3', (c, env) => {
      lanternRibs(f, c, env, { x: -380, y: -240, w: 2040, h: 1240 }, { key: 'ch06s02', step: 360 });
      // the candle on its iron stand (the lantern's flame)
      const ink = env.fill('ink');
      c.fillStyle = ink;
      c.fillRect(CANDLE.x - 3, CANDLE.y + 30, 6, 330);
      c.fillRect(CANDLE.x - 26, CANDLE.y + 24, 52, 7);
      c.fillStyle = mixLab(tone(env, '#efe0c0', 0.2), env.mood.fg, 0.15);
      c.fillRect(CANDLE.x - 8, CANDLE.y + 2, 16, 23);
      // the lamp hook and its badge (named on "workerd's")
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(1010, -200);
      c.lineTo(1010, 150);
      c.arc(1004, 150, 6, 0, Math.PI);
      c.stroke();
      const named = seg(t, b.workerd - 0.2, b.workerd + 0.4);
      badge(c, env, { x: 1004, y: 154, text: 'workerd · 28 Oct', s: 1.15, legible: true, glint: pulse(t, b.workerd, 0.3, 0.3, 1.0), swing: 0.04 * Math.sin(tq * 1.4), alpha: 0.6 + 0.4 * named, id: `${ID}-badge` });
    });
    f.practical({ x: CANDLE.x, y: CANDLE.y - 4, kind: 'candle', seed: 71, intensity: 0.85, radius: 150, layer: 'L3' });
    f.fog('B');
    // ---------------------------------------------------------------- the bench
    const cutting = (r: Run) => seg(t, r.cut - 0.35, r.cut - 0.05);
    let reach = 0;
    let open = 0.15;
    for (const r of runs) {
      const ready = r.arrive[0];
      // the hand goes out with open blades once a run starts, waits; it closes on the cut and comes back
      const out = seg(t, ready + 0.2, ready + 0.8) * (1 - seg(t, r.cut + 0.3, r.cut + 1.0));
      reach = Math.max(reach, out * 0.6 + 0.4 * seg(t, r.cut - 0.9, r.cut - 0.4) * (1 - seg(t, r.cut + 0.3, r.cut + 1.0)));
      if (t > ready && t < r.cut + 1.0) open = Math.max(open, 0.9 * (1 - cutting(r)));
    }
    let baskN = 0;
    f.layer('L4', (c, env) => {
      const ink = env.fill('ink');
      // the keeper (behind the bench), scissors in the near hand
      const kp = blendPose(SIT_HOLD, SIT_REACH, sm(Math.floor(reach * 6) / 6));
      const ko = { x: KEEPER.x, y: KEEPER.y, facing: 'left' as const, pose: kp, scale: KEEPER.scale, ink: PUPPET_NEAR_BLACK, light: { x: -0.8, y: -0.6, floor: 0.2 }, edgeRim: RIM };
      cast['keeper-a'].draw(c, ko, env);
      const hand = cast['keeper-a'].anchor(ko, 'handF');
      const finger = cast['keeper-a'].anchor(ko, 'handB');
      bench(c, env, BENCH);
      // the main file
      const add = seg(t, b.file + 0.1, b.fresh - 0.2);
      ledger(c, env, { x: LEDGER.x, y: LEDGER.y, s: LEDGER.s, pages: 6, adding: add });
      // the basket and its rolled lengths
      for (const r of runs) baskN += seg(t, r.cut + 0.9, r.cut + 1.2);
      basket(c, env, { x: BASKET.x, y: BASKET.y, s: BASKET.s, lengths: baskN });
      // the runs on the bench (clipped at the quill's mouth)
      c.save();
      c.beginPath();
      c.rect(BENCH.x0, RIB_Y - 120, Q - BENCH.x0, 200);
      c.clip();
      let newest: { x: number; y: number } | null = null;
      for (const r of runs) {
        const n = r.arrive.filter((a) => t >= a).length;
        if (n === 0 || t > r.cut + 1.05) continue;
        const fr = sm(clamp01((t - r.arrive[n - 1]) / 0.4));
        // pasted frames don't advance the ribbon: they overwrite the rolled-back slots
        const pastedBefore = r.paste ? r.paste.length : 0;
        const slots = n;
        const frames: RibbonFrame[] = [];
        for (let i = 0; i < n; i++) {
          const pz = r.paste?.find((p) => p.i === i);
          frames.push({ kind: 'frame', stamp: i === r.stampAt ? r.stampVal : null, pasted: pz ? seg(t, pz.at, pz.at + 0.3) : 0, dim: r.dimAt != null ? 0.35 * seg(t, r.dimAt, r.dimAt + 0.5) * (1 - (pz ? seg(t, pz.at, pz.at + 0.3) : 0)) : 0 });
        }
        void pastedBefore;
        const x0 = Q - (slots - 1 + fr) * PITCH;
        const fly = clamp01((t - r.cut) / 1.0);
        if (fly <= 0) {
          ribbon(c, env, { x: x0, y: RIB_Y, s: RS, frames, shown: n, labels: 0, legible: false, id: `${ID}-r`, glow: 0.4 * pulse(t, r.arrive[r.stampAt] ?? -9, 0.2, 0.3, 0.8) });
          // the cut line: a fine ink nick at the quill's mouth as the blades close
          const cl = pulse(t, r.cut - 0.05, 0.08, 0.3, 0.4);
          if (cl > 0.01) {
            c.strokeStyle = withAlpha(ink, cl);
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(Q - 3, RIB_Y - 36);
            c.lineTo(Q - 3, RIB_Y + 36);
            c.stroke();
          }
          if (t < r.cut) newest = { x: Q - 6, y: RIB_Y - 30 };
        } else {
          // the cut length rolls up and drops into the basket
          const u = sm(fly);
          const fromX = x0 + (slots * PITCH) / 2;
          const x = lerp(fromX, BASKET.x, u);
          const y = lerp(RIB_Y, BASKET.y - 58, u) - Math.sin(Math.PI * u) * 90;
          if (u < 0.25) {
            c.save();
            c.translate(x0 + (slots * PITCH) * (u / 0.25) * 0.5, 0);
            c.scale(1 - u / 0.25 * 0.85, 1);
            c.translate(-x0, 0);
            ribbon(c, env, { x: x0, y: RIB_Y, s: RS, frames, shown: n, labels: 0, legible: false });
            c.restore();
          } else scroll(c, env, { x, y, s: 1.5, rot: u * 4, alpha: 1 - seg(fly, 0.85, 1) });
        }
      }
      c.restore();
      // the fresh leader after the checkpoint
      const lead = seg(t, b.fresh - 0.4, b.fresh + 0.5);
      if (lead > 0.01) {
        ribbon(c, env, { x: Q - lead * 30 * RS, y: RIB_Y, s: RS, frames: [{ kind: 'leader' }], shown: 1, labels: 0, legible: false });
        newest = { x: Q - 6, y: RIB_Y - 28 };
      }
      // checkpoint: page copies slide out of the basket's lengths into the ledger
      for (let k = 0; k < 4; k++) {
        const u = clamp01((t - (b.copies + k * 0.35)) / 0.9);
        if (u <= 0 || u >= 1) continue;
        const e = sm(u);
        const x = lerp(BASKET.x + 10, LEDGER.x, e), y = lerp(BASKET.y - 70, LEDGER.y - 40, e) - Math.sin(Math.PI * e) * 70;
        c.save();
        c.globalAlpha = Math.sin(Math.PI * u);
        c.translate(x, y);
        c.rotate((1 - e) * -0.4);
        c.fillStyle = mixLab(tone(env, '#e9dcc0', 0.25), env.mood.fg, 0.1);
        c.fillRect(-20, -13, 40, 26);
        c.strokeStyle = withAlpha('#2a2016', 0.4);
        c.lineWidth = 0.8;
        for (let rr = 0; rr < 4; rr++) {
          c.beginPath();
          c.moveTo(-15, -7 + rr * 5);
          c.lineTo(10 - rr * 3, -7 + rr * 5);
          c.stroke();
        }
        c.restore();
      }
      // the thread from the keeper's finger to the newest frame (tugs on each arrival); re-tied after the checkpoint
      let tug = 0;
      for (const r of runs) for (const a of r.arrive) tug = Math.max(tug, pulse(t, a, 0.06, 0.08, 0.45));
      const retie = seg(t, b.keeper2 - 0.1, b.keeper2 + 0.9);
      const threadOn = t < b.copies - 0.5 || t > b.keeper2 - 0.1;
      if (threadOn && newest) {
        const tgt = newest as { x: number; y: number };
        const sag = 26 - 22 * tug + 3 * Math.sin(tq * 23) * tug;
        cord(c, finger.x + 4, finger.y - 2, tgt.x, tgt.y, sag, withAlpha(mixLab('#f0dcb0', env.mood.core, 0.3), 0.85), 1.1, t > b.keeper2 - 0.1 ? retie : 1);
      }
      // the unseen quill writing at the right edge
      const writing = runs.some((r) => r.arrive.some((a) => t > a - 0.5 && t < a + 0.3)) || pulse(t, b.fresh - 0.4, 0.2, 0.4, 0.3) > 0.2;
      quill(c, env, { x: Q + 6, y: RIB_Y - 22 + (writing ? Math.sin(tq * 14) * 4 : 0), s: 1.25, rot: -1.25 + (writing ? 0.08 * Math.sin(tq * 9) : 0) });
      // the scissors in the keeper's hand
      scissors(c, env, { x: hand.x - 4, y: hand.y + 2, s: 1.5, rot: Math.PI - 0.15, open, glint: runs.reduce((g, r) => Math.max(g, pulse(t, r.cut, 0.08, 0.2, 0.6)), 0) });
    });
    f.rim({ x: 0, y: -1 });
    f.layer('L5', (c, env) => nearRibs(c, env, { side: 'left', x: -70 }));
    // ---------------------------------------------------------------- type (upper left)
    const la = seg(t, b.cut - 0.1, b.cut + 0.35) * (1 - seg(t, b.copies - 0.6, b.copies));
    void textSwap;
    label(f.c, f.mood, { id: `${ID}-cut`, text: 'cut only after a stamp', x: 64, y: 92, alpha: la, italic: true });
  },
});
