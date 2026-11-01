/**
 * ch07-s05 — parchment plate: celld's RECOVERY GATE (the guarantees of 21 October 2026), six engraved stations in ink
 * pictograms (numerals only), a closed gate and a bound Book at the far right (paperWipe in, from the labGreen
 * terrace). The plate is pinned to a dark board (L1); brass tacks on L5 hold its corners; a very slow push.
 *
 *   title    0.30  'The recovery gate' engraves at top-left; badge 'celld 0.6.3' engraved at the top-right corner
 *   read     2.92  the successor's keeper's ink hand (from the left: not the demonstrator's) lifts station 1's tile
 *   absent   5.43  only the empty hook: a short path arcs straight to the Book, the gate opens (never ticked ahead)
 *   sealed   9.76  a sealed tile: the short path again; both short paths fade back, the gate closes
 *   open    12.50  the tile shows an open eye; label 'celld: seal the old session, then restore' (upper right); the
 *                  long path inks station by station, each pictogram firming from pencil to ink on its word:
 *   fence   14.88  2 the swap card drops into the Tooth: click, the notch is re-cut (compare and swap)
 *   seal    17.89  3 red wax across both notebooks (every neighbour it can reach)
 *   collect 19.95  4 their pages roll together into one scroll
 *   upload  21.47  5 the scroll drops into the Well
 *   mark    22.69  6 a wax seal lands on the record tile
 *   restore 25.32  the gate swings and the Book opens
 * Two text items (title, label); the badge is art. Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { BRASS_HI, badge, bakeRect, brass, camAt, clamp01, glowDot, label, lerp, pulse, seg, sm, tone, twos, type C2, type CamKey } from '../sets/common';
import { engraved, notebook, recordTile, waxSeal } from '../sets/neighbours';
import { notchPath, swapCard, tooth } from '../sets/wellAndPlate';
import { book, scroll } from '../sets/walRibbon';
import { sillPage } from '../sets/ch07-s03-celldTown';

const ID = 'ch07-s05';
const START: Camera3 = { x: 640, y: 366, z: 8, lens: 1 };
const END: Camera3 = { x: 643, y: 368, z: 44, lens: 1 };
const ROW = 380;
const ST = [175, 330, 490, 650, 805, 960];
const GATE = { x: 1120, y: ROW };
const PLATE = { x0: 62, y0: 44, x1: 1218, y1: 618 };

function board(c: C2, env: PaintEnv): void {
  // a dark board behind the plate (the plate is pinned to it)
  const g = c.createLinearGradient(0, -200, 0, 900);
  g.addColorStop(0, mixLab(env.fill('set'), env.mood.fg, 0.55));
  g.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.75));
  c.fillStyle = g;
  c.fillRect(-400, -300, 2100, 1300);
  c.strokeStyle = withAlpha(env.mood.fg, 0.25);
  c.lineWidth = 2;
  for (let y = -280; y < 1000; y += 46) {
    c.beginPath();
    c.moveTo(-400, y);
    for (let x = -400; x <= 1700; x += 60) c.lineTo(x, y + Math.sin(x * 0.004 + y) * 6);
    c.stroke();
  }
}
function plateArt(c: C2, env: PaintEnv): void {
  // the parchment sheet with a deckled edge and a soft shadow on the board
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(PLATE.x0 + 8, PLATE.y0 + 10, PLATE.x1 - PLATE.x0, PLATE.y1 - PLATE.y0);
  c.fillStyle = mixLab(env.mood.haze, env.mood.core, 0.25);
  c.beginPath();
  const n = 80;
  const { x0, y0, x1, y1 } = PLATE;
  const j = (i: number) => Math.sin(i * 12.9898) * 1.6;
  c.moveTo(x0, y0);
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x0, x1, i / n), y0 + j(i));
  for (let i = 0; i <= n; i++) c.lineTo(x1 + j(i + 7), lerp(y0, y1, i / n));
  for (let i = 0; i <= n; i++) c.lineTo(lerp(x1, x0, i / n), y1 + j(i + 3));
  for (let i = 0; i <= n; i++) c.lineTo(x0 + j(i + 11), lerp(y1, y0, i / n));
  c.closePath();
  c.fill();
  // foxing and a ruled border
  c.strokeStyle = withAlpha(env.mood.ink, 0.35);
  c.lineWidth = 1;
  c.strokeRect(x0 + 18, y0 + 18, x1 - x0 - 36, y1 - y0 - 36);
  c.strokeRect(x0 + 23, y0 + 23, x1 - x0 - 46, y1 - y0 - 46);
  for (let i = 0; i < 18; i++) {
    const fx = x0 + 60 + ((i * 263) % (x1 - x0 - 120)), fy = y0 + 50 + ((i * 151) % (y1 - y0 - 100));
    c.fillStyle = withAlpha('#b08a50', 0.06);
    c.beginPath();
    c.arc(fx, fy, 10 + (i % 4) * 6, 0, Math.PI * 2);
    c.fill();
  }
}
/** the ink arrow along a quadratic path (u 0..1 drawn) */
function inkPath(c: C2, env: PaintEnv, a: { x: number; y: number }, m: { x: number; y: number }, b: { x: number; y: number }, u: number, alpha: number, lw = 2.2): void {
  if (u <= 0.005 || alpha <= 0.01) return;
  const N = 40;
  const P = (k: number) => ({ x: (1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * m.x + k * k * b.x, y: (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * m.y + k * k * b.y });
  c.save();
  c.globalAlpha *= alpha;
  c.strokeStyle = env.mood.ink;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(a.x, a.y);
  for (let i = 1; i <= Math.ceil(N * u); i++) {
    const p = P(Math.min(u, i / N));
    c.lineTo(p.x, p.y);
  }
  c.stroke();
  if (u > 0.96) {
    const p1 = P(1), p0 = P(0.95);
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    c.fillStyle = env.mood.ink;
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(p1.x - Math.cos(ang - 0.45) * 11, p1.y - Math.sin(ang - 0.45) * 11);
    c.lineTo(p1.x - Math.cos(ang + 0.45) * 11, p1.y - Math.sin(ang + 0.45) * 11);
    c.closePath();
    c.fill();
  }
  c.restore();
}
/** the successor's keeper's hand, an ink cut-out reaching in from the LEFT edge, pinching at (x, y) */
function keeperHand(c: C2, env: PaintEnv, x: number, y: number, reach: number): void {
  if (reach <= 0.01) return;
  const hx = lerp(-60, x, sm(reach)), hy = y;
  c.save();
  c.fillStyle = mixLab(env.mood.ink, '#000', 0.2);
  // sleeve and cuff
  c.beginPath();
  c.moveTo(hx - 30, hy - 9);
  c.lineTo(hx - 420, hy - 22);
  c.lineTo(hx - 420, hy + 22);
  c.lineTo(hx - 30, hy + 10);
  c.closePath();
  c.fill();
  c.fillRect(hx - 64, hy - 14, 18, 28);
  // hand: palm and pinching finger + thumb
  c.beginPath();
  c.ellipse(hx - 14, hy, 17, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(hx + 2, hy - 6, 10, 4, -0.3, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(hx - 2, hy + 6, 9, 4, 0.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(hx - 400, hy - 21);
  c.lineTo(hx - 30, hy - 9);
  c.stroke();
  c.restore();
}
/** a plain brass tile (face unknown: lifted, not yet read) */
function blankTile(c: C2, env: PaintEnv, x: number, y: number, s: number, a: number): void {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = brass(env, 0.35);
  c.fillRect(x - 13 * s, y, 26 * s, 18 * s);
  c.strokeStyle = withAlpha('#3a2a12', 0.8);
  c.lineWidth = 0.8 * s;
  c.strokeRect(x - 13 * s, y, 26 * s, 18 * s);
  c.restore();
}

/** the Well as ink line-art (outline ring with courses, posts, pent roof, rope and bucket), base centre (x, y) */
function wellLineArt(c: C2, env: PaintEnv, x: number, y: number, bucket: number): void {
  const ink = env.mood.ink;
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 2.2;
  c.lineJoin = 'round';
  const W = 92, H = 32;
  // the stone ring (front elevation) and its mouth
  c.beginPath();
  c.moveTo(x - W / 2, y);
  c.lineTo(x - W / 2 + 2, y - H);
  c.lineTo(x + W / 2 - 2, y - H);
  c.lineTo(x + W / 2, y);
  c.closePath();
  c.stroke();
  c.beginPath();
  c.ellipse(x, y - H, W / 2, 6, 0, Math.PI, 0);
  c.stroke();
  c.lineWidth = 1;
  for (let r = 1; r < 3; r++) {
    const yy = y - (H * r) / 3;
    c.beginPath();
    c.moveTo(x - W / 2 + 1, yy);
    c.lineTo(x + W / 2 - 1, yy);
    c.stroke();
    for (let k = 0; k < 4; k++) {
      const xx = x - W / 2 + ((k + (r % 2) * 0.5) * W) / 4 + 6;
      c.beginPath();
      c.moveTo(xx, yy);
      c.lineTo(xx, yy + H / 3);
      c.stroke();
    }
  }
  // posts, winch and pent roof
  c.lineWidth = 2.2;
  const top = y - H - 60;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + sx * 38, y - H);
    c.lineTo(x + sx * 38, top);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(x - 38, top + 6);
  c.lineTo(x + 38, top + 6);
  c.stroke();
  c.beginPath();
  c.moveTo(x - 50, top + 2);
  c.lineTo(x, top - 18);
  c.lineTo(x + 50, top + 2);
  c.stroke();
  // rope and bucket (bucket 0 = up at the winch .. 1 = down in the mouth)
  const by = lerp(top + 26, y - H + 10, clamp01(bucket));
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x, top + 6);
  c.lineTo(x, by - 10);
  c.stroke();
  c.save();
  c.beginPath();
  c.rect(x - 60, top - 30, 120, y - H - (top - 30));
  c.clip();
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(x - 9, by - 10);
  c.lineTo(x + 9, by - 10);
  c.lineTo(x + 7, by + 4);
  c.lineTo(x - 7, by + 4);
  c.closePath();
  c.stroke();
  c.restore();
  c.restore();
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      title: T.beat('title'),
      read: T.beat('read'),
      absent: T.beat('absent'),
      sealed: T.beat('sealed'),
      open: T.beat('open'),
      fence: T.beat('fence'),
      seal: T.beat('seal'),
      every: T.word('L0728', 'every'),
      collect: T.beat('collect'),
      upload: T.beat('upload'),
      mark: T.beat('mark'),
      restore: T.beat('restore'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: START },
      { t: b.D, cam: END },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    f.backlight({ sunX: 300, sunY: 120, intensity: 0.5 });
    f.layer('L1', (c, env) => bakeRect(f, c, env, `${ID}/board`, { x: -400, y: -300, w: 2100, h: 1300 }, (cc) => board(cc, env)));
    // ---- states
    const reach = seg(tq, b.read - 0.9, b.read - 0.1) * (1 - seg(tq, b.read + 1.4, b.absent - 0.3));
    const lifted = seg(tq, b.read, b.read + 0.5) * (1 - seg(tq, b.read + 1.2, b.read + 1.7));
    // tile face: blank → absent (5.43) → sealed (9.76) → open (12.5) — each swap a short crossfade
    const toAbsent = seg(t, b.absent - 0.2, b.absent + 0.2);
    const toSealed = seg(t, b.sealed - 0.2, b.sealed + 0.2);
    const toOpen = seg(t, b.open - 0.2, b.open + 0.2);
    const short1 = seg(t, b.absent + 0.2, b.absent + 1.3) * (1 - seg(t, b.absent + 3.0, b.absent + 3.8));
    const short2 = seg(t, b.sealed + 0.2, b.sealed + 1.3) * (1 - seg(t, b.sealed + 1.9, b.open - 0.1));
    const gateShort = Math.max(seg(t, b.absent + 1.1, b.absent + 1.7) * (1 - seg(t, b.absent + 3.0, b.absent + 3.8)), seg(t, b.sealed + 1.1, b.sealed + 1.7) * (1 - seg(t, b.sealed + 1.9, b.open - 0.1)));
    const gateLong = seg(t, b.restore - 0.05, b.restore + 0.7);
    const gate = Math.max(gateShort * 0.85, gateLong);
    const bookOpen = seg(t, b.restore + 0.5, b.restore + 1.4);
    // the long path's station times
    const at = [b.open, b.fence, b.seal, b.collect, b.upload, b.mark, b.restore];
    const inked = (k: number) => seg(t, at[k] - 0.25, at[k] + 0.25);
    const seg_ = (k: number) => seg(t, at[k + 1] - 0.7, at[k + 1] - 0.1); // connector k → k+1
    const pencil = 0.22;
    const st = (k: number) => (k === 0 ? 1 : pencil + (1 - pencil) * inked(k));
    // station 2: the card drops into the Tooth, click, notch re-cut
    const cardIn = seg(tq, b.fence - 0.3, b.fence + 0.1);
    const click = pulse(t, b.fence + 0.1, 0.08, 0.15, 0.5);
    const recut = seg(t, b.fence + 0.3, b.fence + 1.2);
    // station 3: two wax seals
    const seal1 = seg(t, b.seal - 0.05, b.seal + 0.35), seal2 = seg(t, b.every - 0.05, b.every + 0.35);
    // station 4: pages roll into one scroll
    const gather = seg(t, b.collect - 0.3, b.collect + 0.6);
    const rolled = seg(t, b.collect + 0.5, b.collect + 0.9);
    // station 5: the scroll drops into the Well
    const drop = seg(tq, b.upload - 0.2, b.upload + 0.6);
    // station 6: the seal lands on the record tile
    const mark = seg(t, b.mark - 0.05, b.mark + 0.35);

    // two rows of stations (1–3 above, 4–6 below) at K x their drawn size; the gate + Book at the right between them
    const K = 1.5;
    const POS = [{ x: 214, y: 270 }, { x: 488, y: 270 }, { x: 768, y: 270 }, { x: 214, y: 494 }, { x: 488, y: 494 }, { x: 768, y: 494 }];
    const GPOS = { x: 1052, y: 384 };
    const map = (k: number, x: number, y: number) => ({ x: POS[k].x + (x - ST[k]) * K, y: POS[k].y + (y - ROW) * K });
    const inSt = (c: C2, k: number, fn: () => void) => {
      c.save();
      c.translate(POS[k].x, POS[k].y);
      c.scale(K, K);
      c.translate(-ST[k], -ROW);
      fn();
      c.restore();
    };
    // the long road's connectors (screen-plate coords): within a row, then the wrap from 3 down to 4, then 6 → gate
    const CONN: { a: { x: number; y: number }; m: { x: number; y: number }; e: { x: number; y: number } }[] = [
      { a: { x: POS[0].x + 70, y: POS[0].y + 8 }, m: { x: (POS[0].x + POS[1].x) / 2, y: POS[0].y + 26 }, e: { x: POS[1].x - 74, y: POS[1].y + 8 } },
      { a: { x: POS[1].x + 74, y: POS[1].y + 8 }, m: { x: (POS[1].x + POS[2].x) / 2, y: POS[1].y + 26 }, e: { x: POS[2].x - 100, y: POS[2].y + 8 } },
      { a: { x: POS[2].x - 20, y: POS[2].y + 74 }, m: { x: 488, y: 392 }, e: { x: POS[3].x + 30, y: POS[3].y - 84 } },
      { a: { x: POS[3].x + 70, y: POS[3].y + 8 }, m: { x: (POS[3].x + POS[4].x) / 2, y: POS[3].y + 26 }, e: { x: POS[4].x - 74, y: POS[4].y + 8 } },
      { a: { x: POS[4].x + 74, y: POS[4].y + 8 }, m: { x: (POS[4].x + POS[5].x) / 2, y: POS[4].y + 26 }, e: { x: POS[5].x - 70, y: POS[5].y + 8 } },
      { a: { x: POS[5].x + 70, y: POS[5].y - 10 }, m: { x: 900, y: 470 }, e: { x: GPOS.x - 92, y: GPOS.y + 30 } },
    ];
    const quad = (q: (typeof CONN)[number], u: number) => ({
      x: (1 - u) * (1 - u) * q.a.x + 2 * (1 - u) * u * q.m.x + u * u * q.e.x,
      y: (1 - u) * (1 - u) * q.a.y + 2 * (1 - u) * u * q.m.y + u * u * q.e.y,
    });

    f.layer('L4', (c, env) => {
      bakeRect(f, c, env, `${ID}/plate`, { x: PLATE.x0 - 10, y: PLATE.y0 - 10, w: PLATE.x1 - PLATE.x0 + 30, h: PLATE.y1 - PLATE.y0 + 30 }, (cc) => plateArt(cc, env));
      const ink = env.mood.ink;
      // numerals (engraved, numerals only) at each station's upper left
      for (let k = 0; k < 6; k++)
        inSt(c, k, () => engraved(c, env, String(k + 1), ST[k] - 58, ROW - 40, 22, { color: withAlpha(ink, 0.35 + 0.65 * (k === 0 ? 1 : t > b.open ? st(k) : pencil)), alpha: 1 }));
      // ---- 1: the record tile on its hook (lifted, then its face: absent / sealed / open)
      const tS = 2.2, tY = ROW - 34;
      const lift = lifted * 24 * tS;
      inSt(c, 0, () => {
        recordTile(c, env, { x: ST[0], y: tY, s: tS, state: 'absent' });
        blankTile(c, env, ST[0], tY - lift, tS, 1 - toAbsent);
        recordTile(c, env, { x: ST[0], y: tY, s: tS, state: 'sealed', alpha: toSealed * (1 - toOpen) });
        recordTile(c, env, { x: ST[0], y: tY, s: tS, state: 'open', alpha: toOpen });
        keeperHand(c, env, ST[0] - 30, tY + 9 * tS - lift, reach);
      });
      // ---- 2: the Tooth and its swap card; the notch re-cut below
      inSt(c, 1, () => {
        c.globalAlpha *= t > b.open - 0.2 ? st(1) : pencil;
        const tS2 = 1.9;
        tooth(c, env, { x: ST[1] - 34 * tS2, y: ROW + 40 * tS2, s: tS2, tooth: { shutter: 0, pin: 1, showPin: false, flash: click, flashKind: 'click' } });
        swapCard(c, env, { x: ST[1], y: lerp(ROW - 46, ROW - 6, cardIn), s: 1.5, notch: 23, house: '', alpha: 1 });
        c.translate(ST[1] - 36, ROW + 36);
        c.fillStyle = withAlpha(ink, 0.8);
        c.save();
        c.beginPath();
        c.rect(72 * recut, -12, 80, 24);
        c.clip();
        c.fill(notchPath(17, 72, 8));
        c.restore();
        c.save();
        c.beginPath();
        c.rect(-2, -12, 72 * recut + 2, 24);
        c.clip();
        c.fillStyle = brass(env, 0.4);
        c.fill(notchPath(23, 72, 8));
        c.restore();
      });
      if (click > 0.01) glowDot(c, POS[1].x, POS[1].y, 44, tone(env, BRASS_HI, 0.1), 0.5 * click);
      // ---- 3: two notebooks, wax sealed
      inSt(c, 2, () => {
        c.globalAlpha *= t > b.open - 0.2 ? st(2) : pencil;
        notebook(c, env, { x: ST[2] - 30, y: ROW + 22, s: 1.15, band: 'complete', lines: 5, sealed: seal1 });
        notebook(c, env, { x: ST[2] + 30, y: ROW + 22, s: 1.15, band: 'complete', lines: 5, sealed: seal2 });
      });
      // ---- 4: the pages travel the wrap from 3 down to 4 and roll into one scroll
      inSt(c, 3, () => {
        c.globalAlpha *= t > b.open - 0.2 ? st(3) : pencil;
        if (drop < 0.02) scroll(c, env, { x: ST[3], y: ROW + 6, s: 1.6, tag: 1, alpha: t > b.open - 0.2 ? rolled : 1 });
        else scroll(c, env, { x: ST[3], y: ROW + 6, s: 1.6, tag: 0, alpha: 0.28 * seg(drop, 0.3, 1) });
      });
      if (t > b.collect - 0.3 && rolled < 1) {
        for (let i = 0; i < 3; i++) {
          const u = clamp01(gather * 1.15 - i * 0.07);
          const p = quad(CONN[2], u);
          sillPage(c, env, { x: p.x + (i - 1) * 10 * (1 - u), y: p.y + 10, h: 22 * K, alpha: 1 - rolled });
        }
      }
      // ---- 5: the Well (ink line-art), the scroll dropping into it
      inSt(c, 4, () => {
        c.globalAlpha *= t > b.open - 0.2 ? st(4) : pencil;
        wellLineArt(c, env, ST[4], ROW + 52, 0.2 + 0.7 * drop);
      });
      if (drop > 0.02 && drop < 0.98) {
        const p0 = map(3, ST[3], ROW + 6), p1 = map(4, ST[4], ROW + 18);
        const sx = lerp(p0.x, p1.x, sm(Math.min(1, drop * 1.6)));
        const sy = drop < 0.62 ? p0.y - Math.sin((Math.PI * drop) / 0.62) * 70 : lerp(p0.y, p1.y + 20, (drop - 0.62) / 0.38);
        scroll(c, env, { x: sx, y: sy, s: 1.3 * K, tag: 1, alpha: 1 - seg(drop, 0.8, 0.98) });
      }
      // ---- 6: the record tile, marked sealed
      inSt(c, 5, () => {
        c.save();
        c.globalAlpha *= t > b.open - 0.2 ? st(5) : pencil;
        recordTile(c, env, { x: ST[5], y: tY, s: tS, state: 'open' });
        c.restore();
        if (mark > 0.01) waxSeal(c, env, { x: ST[5], y: tY + 9 * tS, r: 7 * tS, u: mark });
      });
      // ---- the gate and the Book behind it
      c.save();
      c.translate(GPOS.x, GPOS.y);
      c.scale(K, K);
      c.translate(-GATE.x, -ROW);
      book(c, env, { x: GATE.x + 6, y: ROW + 40, s: 2.2, open: bookOpen });
      if (bookOpen > 0.3) glowDot(c, GATE.x + 6, ROW - 10, 70, tone(env, '#ffd890', 0.1), 0.35 * bookOpen);
      c.fillStyle = mixLab(ink, '#000', 0.1);
      for (const side of [-1, 1]) {
        const hx = GATE.x + side * 52;
        c.fillRect(hx - 3, ROW - 70, 6, 136);
        // the leaf: bars, foreshortened as it swings open
        const w = 50 * Math.cos(gate * 1.35);
        c.save();
        c.translate(hx, 0);
        c.scale(-side, 1);
        for (let i = 0; i <= 4; i++) c.fillRect((w * i) / 4 - 1.4, ROW - 56, 2.8, 116);
        c.fillRect(0, ROW - 58, w, 4);
        c.fillRect(0, ROW + 54, w, 4);
        c.restore();
      }
      c.restore();
      // ---- the paths: two short arcs (straight to the Book), then the long road station by station
      const s1 = map(0, ST[0], tY - 16);
      const gTop = { x: GPOS.x - 40, y: GPOS.y - 112 };
      inkPath(c, env, s1, { x: 640, y: 120 }, gTop, short1, 1 - seg(t, b.absent + 3.0, b.absent + 3.8), 2.8);
      inkPath(c, env, s1, { x: 640, y: 120 }, gTop, short2, 1 - seg(t, b.sealed + 1.9, b.open - 0.1), 2.8);
      for (let k = 0; k < 6; k++) {
        const q = CONN[k];
        inkPath(c, env, q.a, q.m, q.e, t > b.open ? (k === 0 ? seg(t, b.open + 0.3, b.fence - 0.2) : seg_(k)) : 0, 1, 2.6);
      }
      // the badge: engraved at the plate's top-right corner (art)
      badge(c, env, { x: 1140, y: 60, text: 'celld 0.6.3', engraved: true, legible: false, s: 1.15 });
    });
    // ---- L5: brass tacks holding the plate's corners (near, soft)
    f.layer('L5', (c, env) => {
      for (const [x, y] of [[PLATE.x0 + 6, PLATE.y0 + 6], [PLATE.x1 - 6, PLATE.y0 + 6], [PLATE.x0 + 6, PLATE.y1 - 8], [PLATE.x1 - 6, PLATE.y1 - 8]]) {
        c.fillStyle = brass(env, 0.5);
        c.beginPath();
        c.arc(x, y, 9, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = withAlpha(BRASS_HI, 0.5);
        c.beginPath();
        c.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
        c.fill();
      }
    });
    // ---- type: the title (top-left) and the label (upper right, from 'open')
    label(f.c, f.mood, { id: `${ID}-title`, text: 'The recovery gate', x: 116, y: 118, alpha: seg(t, b.title, b.title + 0.6), size: 32 });
    label(f.c, f.mood, { id: `${ID}-label`, text: 'celld: seal the old session, then restore', x: 1040, y: 122, align: 'right', alpha: seg(t, b.open - 0.1, b.open + 0.4), italic: true });
  },
});
