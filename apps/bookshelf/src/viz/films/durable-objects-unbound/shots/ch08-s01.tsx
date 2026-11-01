/**
 * ch08-s01 — THE PIN MONTAGE (winterBlue, iris in).
 *
 * A dark board hangs from an iron lamp-post at the harbour's edge, left of the square (the sea open behind it, the
 * night town soft at L2–L3). Four red-tagged pins hang on hooks in the order they were pulled, each with its badge
 * beneath (art, unnamed): the Tooth ('Amazon S3'), the candle band ('workerd · 28 Oct'), the second look
 * ('workerd · 28 Oct'), the neighbours' seal ('celld 0.6.3'). One continuous lateral pan runs from the first pin to
 * the Well (≈ 5 % of frame width per second at the action plane).
 *   iris        title 'What Travels' upper left
 *   tooth       pin one glints; below it the Tooth takes a swap card: click
 *   candle      pin two; A's candle with its painted band
 *   look        pin three; the keeper's lamp lifts on its pole to a small Plate
 *   seal        pin four; red wax across a notebook
 *   broke       all four vignettes flash once in emberRed (the four failures) and return
 *   well        the pan ends on the Well (the contract, played on the town's own machines):
 *   refusals    the Tooth thunks a stale card (one key)
 *   reads       the bucket comes up full
 *   supervisor  after a pause, a lamplighter's pole relights House B's dark window (a house that fenced itself)
 *   cuts        the Scissors cut a Ribbon just after its red ink stamp
 *   replays     pages fall into the Room Lantern's book in House C's window
 * Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, titleCard, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { TOWN, paintTown } from '../sets/harbourTown';
import { EMBER, brass, camAt, clamp01, glowDot, paper, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { leaseCandle } from '../sets/leaseCandle';
import { notebook } from '../sets/neighbours';
import { pinBoard } from '../sets/demonstratorHand';
import { WELL, plate, swapCard, tooth } from '../sets/wellAndPlate';
import { ribbon } from '../sets/walRibbon';

const ID = 'ch08-s01';
const BOARD = { x: -140, y: 240, w: 520 };
const PIN_X = [0, 1, 2, 3].map((i) => BOARD.x - BOARD.w / 2 + (BOARD.w * (i + 0.5)) / 4);
const VIG_Y = 470;
const POST_X = BOARD.x - BOARD.w / 2 - 40;

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      iris: T.beat('iris'),
      tooth: T.beat('tooth'),
      candle: T.beat('candle'),
      look: T.beat('look'),
      seal: T.beat('seal'),
      broke: T.beat('broke'),
      well: T.beat('well'),
      refusals: T.beat('refusals'),
      reads: T.beat('reads'),
      supervisor: T.beat('supervisor'),
      cuts: T.beat('cuts'),
      replays: T.beat('replays'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: { x: -330, y: 380, z: 300, lens: 1 } },
      { t: b.seal + 1.0, cam: { x: 0, y: 384, z: 300, lens: 1 } },
      { t: b.well + 1.5, cam: { x: 470, y: 410, z: 120, lens: 1 } },
      { t: b.cuts - 1.0, cam: { x: 560, y: 404, z: 120, lens: 1 } },
      { t: b.D, cam: { x: 650, y: 396, z: 96, lens: 1 } },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam: Camera3 = camAt(cams, t);
    const named = [b.tooth, b.candle, b.look, b.seal].map((at) => seg(t, at - 0.2, at + 0.5));
    const broke = pulse(t, b.broke - 0.1, 0.25, 0.5, 0.9);
    const thunk = pulse(t, b.refusals, 0.12, 0.25, 0.6);
    const bucket = 1 - seg(t, b.reads - 1.4, b.reads + 0.1);
    // B: dark (fenced), a pause, then the lamplighter's pole relights it
    const pole = seg(t, b.supervisor - 0.2, b.supervisor + 1.2) * (1 - seg(t, b.supervisor + 3.0, b.supervisor + 3.8));
    const bLit = seg(t, b.supervisor + 1.3, b.supervisor + 1.8);
    const cut = seg(t, b.cuts + 0.15, b.cuts + 0.4);
    const pages = clamp01((t - (b.replays - 1.2)) / 2.2);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        lamps: { A: 0, B: bLit, C: 1, Cup: 0.7 },
        lanterns: [{ house: 'C', lit: 1, members: 4, tq, door: 0, s: 0.6 }],
        plate: { house: 'C', epoch: 9, from: 9, crown: 1, dim: 0.3 },
        tooth: { shutter: 0, pin: 1, showPin: false, flash: thunk, flashKind: 'thunk' },
        well: { bucket, load: bucket < 0.9 ? 'scroll' : 'none', glint: 0.4 },
        badge: { text: 'workerd · 28 Oct', legible: false },
        lampPostLit: 0.45,
      },
      {
        L3back: (c, env) => {
          // pages fall into the lantern's book in C's window (replay: pages laid, no code run)
          if (pages > 0 && pages < 1.2) {
            const w = TOWN.C.main;
            for (let i = 0; i < 4; i++) {
              const u = clamp01(pages * 1.6 - i * 0.2);
              if (u <= 0 || u >= 1) continue;
              c.fillStyle = withAlpha(paper(env, 0.1), 0.9 * Math.sin(Math.PI * u));
              c.fillRect(w.x - 8 + i * 4, w.y - w.h / 2 + 4 + u * (w.h - 14), 7, 4);
            }
          }
        },
        L3: (c, env) => {
          // the lamplighter's pole reaching up to B's window
          if (pole > 0.01) {
            const w = TOWN.B.main;
            c.save();
            c.strokeStyle = env.fill('ink');
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(w.x - 46, TOWN.B.base + 8);
            c.lineTo(w.x - 46 + 30 * pole, TOWN.B.base + 8 - (TOWN.B.base + 8 - w.y) * pole);
            c.stroke();
            c.restore();
            glowDot(c, w.x - 46 + 30 * pole, TOWN.B.base + 8 - (TOWN.B.base + 8 - w.y) * pole, 9, tone(env, '#ffc46e', 0.05), pole);
          }
        },
        L4: (c, env) => {
          board(c, env, t, named, broke);
          // the stale card spat back from the Tooth on 'refusals'
          const sp = seg(t, b.refusals - 0.6, b.refusals) * (1 - seg(t, b.refusals + 0.1, b.refusals + 1.4));
          if (t > b.refusals - 0.6 && t < b.refusals + 1.6) {
            const slot = { x: TOWN.well.x + WELL.slot.x, y: TOWN.well.y + WELL.slot.y };
            const back = seg(t, b.refusals + 0.1, b.refusals + 1.2);
            swapCard(c, env, { x: slot.x + 30 - 22 * sp + 30 * back, y: slot.y - 4 - 8 * back, s: 0.9, house: 'B', notch: 3, punched: back, rot: 0.3 * back, alpha: 1 - seg(t, b.refusals + 1.1, b.refusals + 1.6) });
          }
          // the Scissors cut a Ribbon just after its red ink stamp (beside the wellhead, left)
          const rx = TOWN.well.x - 190, ry = TOWN.well.y - 150;
          const ra = seg(t, b.cuts - 1.2, b.cuts - 0.6) * (1 - seg(t, b.replays - 1.6, b.replays - 0.8));
          if (ra > 0.01) {
            c.save();
            c.globalAlpha = ra;
            ribbon(c, env, { x: rx - 70, y: ry, s: 0.72, frames: [{ kind: 'frame' }, { kind: 'frame', stamp: 7 }, { kind: 'frame' }], cutAfter: cut > 0.5 ? [1] : [], cutGap: 16 * cut });
            c.save();
            c.translate(rx + 32, ry - 22);
            c.scale(1.7, 1.7);
            scissors(c, env, 0, 0, 1 - cut);
            c.restore();
            c.restore();
          }
        },
      },
    );
    titleCard(f.c, { title: 'What Travels', at: b.iris, dur: 6.5, fade: 0.8, x: 300, y: 96, size: 46 }, { t, mood: f.mood, seed: 8 });

    /** the board on its post, the four pins and, below each, the machine it came from */
    function board(c: C2, env: PaintEnv, tt: number, nm: number[], br: number): void {
      // the iron post (the harbour-edge lamp-post the board hangs on) and its bracket
      c.save();
      c.fillStyle = env.fill('ink');
      c.fillRect(POST_X - 6, 90, 12, 520);
      c.fillRect(POST_X - 12, 82, 24, 10);
      c.beginPath();
      c.moveTo(POST_X - 18, 82);
      c.lineTo(POST_X - 22, 52);
      c.lineTo(POST_X + 22, 52);
      c.lineTo(POST_X + 18, 82);
      c.closePath();
      c.fill();
      c.fillRect(POST_X, BOARD.y - 70, 46, 5);
      c.restore();
      glowDot(c, POST_X, 66, 30, tone(env, '#ffcf8a', 0.1), 0.6);
      pinBoard(c, env, { x: BOARD.x, y: BOARD.y, w: BOARD.w, pins: nm.map((k, i) => ({ alpha: 1, glint: k * (1 - seg(tt, [b.tooth, b.candle, b.look, b.seal][i] + 1.2, [b.tooth, b.candle, b.look, b.seal][i] + 2.2)), swing: 0.05 * Math.sin(tq * 1.3 + i) })) });
      // vignettes: each machine resolves (from a hazed ghost to sharp) as its pin is named
      for (let i = 0; i < 4; i++) {
        const px = PIN_X[i];
        const k = (0.25 + 0.75 * nm[i]) * (1 - seg(tt, b.well - 0.5, b.well + 1.0));
        if (k <= 0.005) continue;
        c.save();
        c.globalAlpha = k;
        if (i === 0) {
          const click = pulse(tt, b.tooth + 0.4, 0.1, 0.2, 0.5);
          tooth(c, env, { x: px - 34 * 2.6, y: VIG_Y + 40 * 2.6, s: 2.6, tooth: { shutter: 0, pin: 1, showPin: false, flash: click, flashKind: 'click' } });
          const inU = sm(seg(tt, b.tooth - 0.1, b.tooth + 0.4));
          swapCard(c, env, { x: px + 70 - 64 * inU, y: VIG_Y - 6, s: 1.6, house: 'A', notch: 5, alpha: 1 - seg(tt, b.tooth + 0.5, b.tooth + 0.8) });
        } else if (i === 1) {
          leaseCandle(c, env, { x: px, y: VIG_Y + 70, s: 1.15, nowMs: 14500 + 2500 * nm[1], band: 1, notch: 0, seed: 3 });
        } else if (i === 2) {
          const up = sm(seg(tt, b.look - 0.1, b.look + 0.9));
          plate(c, env, { x: px - 8, y: VIG_Y - 40 + 212 * 0.72, s: 0.72, plate: { house: 'A', epoch: 7, from: 7, crown: 1, dim: 0.2 } });
          const lx = px + 40, ly = VIG_Y + 80 - 92 * up;
          c.strokeStyle = env.fill('ink');
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(px + 48, VIG_Y + 100);
          c.lineTo(lx, ly);
          c.stroke();
          c.fillStyle = env.fill('ink');
          c.fillRect(lx - 4, ly - 8, 8, 8);
          glowDot(c, lx, ly - 4, 22, tone(env, '#ffcf7a', 0.05), 0.7 * nm[2]);
        } else {
          notebook(c, env, { x: px, y: VIG_Y + 50, s: 2.3, band: 'complete', lines: 4, sealed: seg(tt, b.seal - 0.1, b.seal + 0.5) });
        }
        c.restore();
        // the failure flash: each vignette lights once in emberRed and returns
        if (br > 0.01) glowDot(c, px, VIG_Y + 20, 70, tone(env, EMBER, 0.1), 0.55 * br);
      }
      void brass;
      void mixLab;
    }
  },
});

/** brass scissors, blades open by `open` 0..1, pivot at (x, y) */
function scissors(c: C2, env: PaintEnv, x: number, y: number, open: number): void {
  c.save();
  c.translate(x, y);
  const a = 0.08 + 0.42 * clamp01(open);
  c.fillStyle = brass(env, 0.5);
  for (const sgn of [-1, 1]) {
    c.save();
    c.rotate(Math.PI / 2 + sgn * a);
    c.beginPath();
    c.moveTo(0, -1.5);
    c.lineTo(22, -0.5);
    c.lineTo(22, 0.5);
    c.lineTo(0, 1.5);
    c.closePath();
    c.fill();
    c.beginPath();
    c.ellipse(-8, 0, 5, 3.5, 0, 0, Math.PI * 2);
    c.ellipse(-8, 0, 3, 2, 0, 0, Math.PI * 2, true);
    c.fill('evenodd');
    c.restore();
  }
  c.restore();
}
