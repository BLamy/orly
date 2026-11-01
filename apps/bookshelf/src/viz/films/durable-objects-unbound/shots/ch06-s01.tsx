/**
 * ch06-s01 — the Ribbon: SQLite's write-ahead log, laid out exactly (parchment plate inside the Room Lantern).
 *
 * Iris in on the Room Lantern's flame; the lantern's paper unfolds from its crease into a pinned parchment plate.
 * Depth: L2 the lantern's glowing paper wall seen from inside, L3 its bamboo ribs, L4 the plate (action plane),
 * L5 an out-of-focus rib crossing the lower left. Every camera move slides L2/L3/L5 against the plate.
 *
 *   (L0601 'file')   SQLite's main file inks in as a closed bound LEDGER holding 6 pages; a quill hovers over it
 *                    and withdraws on 'not write changes there first'
 *   ribbon   8.94    'second file': the quill unspools a blank ribbon beside the ledger, left → right
 *   term    11.14    (reel) 'write-ahead log — the Ribbon' top-left: kept clear
 *   leader  15.56    the leader card is ruled off: '32 bytes'
 *   frames  18.51    five frames slide in, each a narrow tab marked '24' and a wider page panel; the camera trucks
 *   seal    24.20    'last': the third frame's tab takes a red ink stamp '6' (txn 1: the ledger's 6 pages glint one
 *                    by one on 'how many pages'); on 'after the commit' the fifth frame's stamp '7' (txn 2 adds a
 *                    page: a dotted 7th page waits on the ledger for the next checkpoint)
 *   zeros   30.97    the camera eases along the ribbon; each engraved 0 is ringed as it passes
 *   mark    36.02    'red stamp' / 'commit mark': both stamps glow, ink braces group frames 1–3 and 4–5
 * Red here = WAL commit INK stamps only (never wax). Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { camAt, clamp01, glowDot, lerp, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { ledger, ribbon, ribbonLayout, type RibbonFrame } from '../sets/walRibbon';
import { roomLantern, lanternPt } from '../sets/roomLantern';
import { foldDraw, lanternRibs, lanternWall, nearRibs, parchmentSheet, quill } from '../sets/ch06-s01-lanternRoom';

const ID = 'ch06-s01';
const SHEET = { x: 120, y: 70, w: 1040, h: 530 };
const LEDGER = { x: 288, y: 456, s: 3.0 };
const RIB = { x: 436, y: 336, s: 2.2 };
const FRAMES: RibbonFrame[] = [
  { kind: 'leader' },
  { kind: 'frame' },
  { kind: 'frame' },
  { kind: 'frame', stamp: 6 },
  { kind: 'frame' },
  { kind: 'frame', stamp: 7 },
];
const LAY = ribbonLayout({ x: RIB.x, s: RIB.s, frames: FRAMES });
const RIB_H = 46 * RIB.s;
const RIB_END = LAY[LAY.length - 1].x1;
const LANT = { x: 640, y: 536, s: 3.3 };
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      file: T.word('L0601', 'file'),
      notWrite: T.word('L0601', 'not'),
      first: T.wordEnd('L0601', 'first'),
      ribbon: T.beat('ribbon'),
      leader: T.beat('leader'),
      thirty: T.word('L0603', 'thirty-two'),
      frames: T.beat('frames'),
      tfb: T.word('L0603', 'twenty-four-byte'),
      page: T.wordEnd('L0603', 'page'),
      seal: T.beat('seal'),
      howMany: T.word('L0604', 'how'),
      after: T.word('L0604', 'after'),
      commit: T.word('L0604', 'commit'),
      other: T.word('L0604', 'Other'),
      zeros: T.beat('zeros'),
      there: T.wordEnd('L0604', 'there'),
      red: T.word('L0605', 'red'),
      mark: T.beat('mark'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: C(640, 380, 300) },
      { t: 1.4, cam: C(640, 372, 270) },
      { t: b.file + 1.6, cam: C(560, 400, 150) },
      { t: b.ribbon - 0.3, cam: C(570, 392, 150) },
      { t: b.ribbon + 2.4, cam: C(660, 380, 110) },
      { t: b.leader - 0.4, cam: C(650, 376, 120) },
      { t: b.leader + 1.6, cam: C(560, 366, 250) },
      { t: b.frames + 0.2, cam: C(570, 366, 245) },
      { t: b.page + 0.2, cam: C(800, 372, 215) },
      { t: b.seal + 0.9, cam: C(650, 384, 110) },
      { t: b.other, cam: C(645, 384, 115) },
      { t: b.other + 0.9, cam: C(570, 370, 240) },
      { t: b.there + 1.6, cam: C(770, 370, 240) },
      { t: b.mark + 0.4, cam: C(648, 388, 100) },
      { t: b.D, cam: C(645, 390, 88) },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    f.backlight({ sunX: 640, sunY: 120, intensity: 0.9 });
    // ---------------------------------------------------------------- the lantern, seen from inside
    f.layer('L2', (c, env) => lanternWall(f, c, env, { x: -420, y: -260, w: 2120, h: 1300 }, { key: 'ch06s01', glowX: 640, glowY: 160 }));
    f.fog('A');
    f.layer('L3', (c, env) => lanternRibs(f, c, env, { x: -320, y: -200, w: 1920, h: 1160 }, { key: 'ch06s01', step: 330 }));
    // the lantern's candle above the plate: the warm practical that lights everything
    f.practical({ x: 640, y: 26, kind: 'candle', seed: 61, intensity: 0.55, radius: 120, layer: 'L3' });
    // ---------------------------------------------------------------- the plate
    const fold = seg(t, 1.6, 4.4);
    const lanternA = 1 - seg(t, 2.6, 4.6);
    const ledgerA = seg(t, b.file - 0.2, b.file + 0.6);
    const band = seg(t, b.ribbon - 0.1, b.ribbon + 2.3);
    // cards: leader on 'leader'; five frames slide in from 'frames' to the end of 'page'
    const fStart = b.frames - 0.1, fEnd = b.page - 0.2;
    const shown = (t < b.leader - 0.2 ? 0 : clamp01((t - (b.leader - 0.2)) / 0.6)) + (t < fStart ? 0 : Math.min(5, ((t - fStart) / (fEnd - fStart)) * 5));
    const stamp6 = seg(t, b.seal - 0.05, b.seal + 0.35);
    const stamp7 = seg(t, b.commit - 0.15, b.commit + 0.25);
    const glow = Math.max(pulse(t, b.red - 0.1, 0.3, 0.4, 0.9) * 0.8, seg(t, b.mark - 0.25, b.mark + 0.4));
    f.layer('L4', (c, env) => {
      // the lantern resolving at the iris, then folding open into the plate
      if (lanternA > 0.01) {
        roomLantern(c, env, { x: LANT.x, y: LANT.y, s: LANT.s * lerp(1, 1.2, fold), lit: 1, members: 4, tq, alpha: lanternA, hook: true });
      }
      foldDraw(c, 640, lerp(0.16, 1, sm(fold)) * (fold > 0 ? 1 : 0), SHEET.y, SHEET.y + SHEET.h, () => {
        parchmentSheet(f, c, env, SHEET, 'ch06s01');
      }, env.mood.fg);
      if (fold < 0.98) return;
      const inkC = mixLab('#2a2016', env.mood.fg, 0.1);
      // the main file: a ledger holding six pages
      if (ledgerA > 0.01) {
        ledger(c, env, { x: LEDGER.x, y: LEDGER.y + (1 - ledgerA) * 10, s: LEDGER.s, pages: 6, alpha: ledgerA });
        // page edges glint one by one on 'how many pages' (the count the first stamp carries)
        for (let i = 0; i < 6; i++) {
          const g = pulse(t, b.howMany + i * 0.26, 0.15, 0.5 + (5 - i) * 0.26, 1.2) * (1 - seg(t, b.commit + 1.4, b.commit + 2.2));
          if (g <= 0.01) continue;
          const yy = LEDGER.y - (6 + (i + 1) * 3.2) * LEDGER.s;
          c.fillStyle = withAlpha(tone(env, '#e9c46a', 0.15), 0.85 * g);
          c.fillRect(LEDGER.x - 44 * LEDGER.s, yy, 88 * LEDGER.s, 2.6 * LEDGER.s);
        }
        // txn 2 adds a page: a dotted 7th page waits beside the ledger for the next checkpoint
        const g7 = seg(t, b.commit + 0.1, b.commit + 0.7);
        if (g7 > 0.01) {
          c.save();
          c.globalAlpha = g7 * 0.85;
          c.setLineDash([5, 4]);
          c.strokeStyle = inkC;
          c.lineWidth = 1.4;
          const top = LEDGER.y - (6 + 6 * 3.2 + 6) * LEDGER.s;
          c.strokeRect(LEDGER.x - 40 * LEDGER.s, top - 10 - 3 * LEDGER.s, 84 * LEDGER.s, 3 * LEDGER.s);
          c.restore();
        }
      }
      // the blank ribbon unspooling from beside the ledger
      if (band > 0.01) {
        const x1 = lerp(RIB.x, RIB_END, band);
        c.fillStyle = withAlpha(mixLab('#e8d8b4', env.mood.fg, 0.08), 0.75);
        c.fillRect(RIB.x, RIB.y - RIB_H / 2 + 3, x1 - RIB.x, RIB_H - 6);
        c.strokeStyle = withAlpha(inkC, 0.25);
        c.lineWidth = 1;
        c.strokeRect(RIB.x, RIB.y - RIB_H / 2 + 3, x1 - RIB.x, RIB_H - 6);
        // the spool at the growing end (shrinks as it unwinds)
        const sp = 1 - 0.45 * band;
        if (band < 0.999) {
          c.fillStyle = mixLab('#d9c49a', env.mood.fg, 0.15);
          c.beginPath();
          c.ellipse(x1, RIB.y, 9 * sp, RIB_H / 2, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = withAlpha(inkC, 0.5);
          c.stroke();
        }
      }
      // the cards
      if (shown > 0.001) {
        ribbon(c, env, {
          x: RIB.x, y: RIB.y, s: RIB.s, frames: FRAMES, shown,
          labels: 1, legible: true, glow, id: ID,
          stampU: (i) => (i === 3 ? stamp6 : i === 5 ? stamp7 : 0),
        });
      }
      // the zeros: an ink ring around each engraved 0 as the camera passes
      const zeroAt = [b.other + 0.7, b.zeros + 0.15, b.there + 0.6];
      [1, 2, 4].forEach((fi, k) => {
        const z = pulse(t, zeroAt[k], 0.25, 0.9, 0.9);
        if (z <= 0.01) return;
        const L = LAY[fi];
        const tx = L.x0 + (14 * RIB.s) / 2, ty = RIB.y - RIB_H / 2 + RIB_H * 0.62;
        c.save();
        c.globalAlpha = z;
        c.strokeStyle = inkC;
        c.lineWidth = 1.6;
        c.beginPath();
        c.ellipse(tx, ty, 13, 15, -0.2, -0.3, Math.PI * 2 * sm(z) - 0.3);
        c.stroke();
        c.restore();
      });
      // two transactions: ink braces under frames 1–3 and 4–5
      const br = seg(t, b.mark - 0.3, b.mark + 0.6);
      if (br > 0.01) {
        const brace = (x0: number, x1: number) => {
          const y = RIB.y + RIB_H / 2 + 62;
          c.beginPath();
          c.moveTo(x0, y - 8);
          c.quadraticCurveTo(x0, y, x0 + 12, y);
          c.lineTo((x0 + x1) / 2 - 10, y);
          c.quadraticCurveTo((x0 + x1) / 2, y, (x0 + x1) / 2, y + 9);
          c.quadraticCurveTo((x0 + x1) / 2, y, (x0 + x1) / 2 + 10, y);
          c.lineTo(x1 - 12, y);
          c.quadraticCurveTo(x1, y, x1, y - 8);
          c.stroke();
        };
        c.save();
        c.globalAlpha = br;
        c.strokeStyle = inkC;
        c.lineWidth = 2.6;
        brace(LAY[1].x0, LAY[1].x0 + (LAY[3].x1 - LAY[1].x0) * sm(br));
        brace(LAY[4].x0, LAY[4].x0 + (LAY[5].x1 - LAY[4].x0) * sm(br));
        c.restore();
      }
      // the quill: hovers over the ledger, withdraws, then writes the ribbon as it unspools and fills
      const qa = seg(t, b.file - 0.3, b.file + 0.4) * (1 - seg(t, b.page + 0.6, b.page + 1.6));
      if (qa > 0.01) {
        let qx: number, qy: number, rot = 0;
        const wob = Math.sin(tq * 9) * 2.5;
        if (t < b.ribbon - 0.4) {
          // over the ledger; on 'not write … there first' it lifts away, hesitating
          const lift = seg(t, b.notWrite, b.first);
          qx = LEDGER.x + 40 + lift * 50;
          qy = LEDGER.y - 112 - lift * 80 + wob * (1 - lift);
          rot = -0.15 * lift;
        } else if (t < b.leader - 0.3) {
          // gliding to the ribbon start, then riding the unspooling end
          const go = seg(t, b.ribbon - 0.4, b.ribbon + 0.2);
          const endX = lerp(RIB.x, RIB_END, band);
          qx = lerp(LEDGER.x + 70, endX - 6, go);
          qy = lerp(LEDGER.y - 162, RIB.y - 8, go) + wob * 0.6;
        } else {
          // writing at the newest card
          const k = Math.max(0, Math.min(LAY.length - 1, Math.ceil(shown) - 1));
          const L = LAY[k];
          qx = lerp(L.x0 + 10, L.x1 - 8, 0.5 + 0.4 * Math.sin(tq * 5));
          qy = RIB.y - 4 + wob;
        }
        quill(c, env, { x: qx, y: qy, s: 1.5, rot, alpha: qa });
      }
      // the stamps' faint glow on 'red stamp' / 'mark'
      if (glow > 0.01) {
        for (const i of [3, 5]) {
          const L = LAY[i];
          glowDot(c, L.x0 + (14 * RIB.s) / 2, RIB.y - RIB_H / 2 + RIB_H * 0.62, 46, tone(env, '#ff9a6a', 0.1), 0.35 * glow);
        }
      }
    });
    f.rim({ x: 0, y: -1 });
    // the lantern's flame at the iris
    if (lanternA > 0.01) {
      const fp = lanternPt({ x: LANT.x, y: LANT.y, s: LANT.s }, 'flame');
      f.practical({ x: fp.x, y: fp.y, kind: 'candle', seed: 62, intensity: 0.8 * lanternA, radius: 140, layer: 'L4' });
    }
    f.layer('L5', (c, env) => nearRibs(c, env, { side: 'left', x: -36 }));
  },
});
