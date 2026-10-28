/**
 * ch06-s10 — THE RANK BOARD: sorting without sorting (scene, the clock room, labGreen; cut in; 8.17 s).
 *   L0621 "To sort, do the same work on every item: each card counts who comes before it. Nothing swaps."
 *
 * Front-on at the RANK BOARD, an open dark rack hung from the clockwork's fourth arm (SAME WORK ON EVERY ITEM, its tip
 * the row of identical tiles) against the clock room's round window. Four paper key cards on the left (30, 10, 30, 20),
 * a 4×4 grid of paper FLIP TILES between them and the row-sum pips, and on the right four lanes ending in four slots
 * (0..3) on a shelf.
 *
 * TEACHES, word by word:
 *   cards (0.3)      the board: cards, tiles face down, slots empty
 *   each (3.89)      every card's row thread lights at once (the same work, on every item)
 *   counts (4.55)    all sixteen tiles flip together: tile (i, j) shows 1 when card j comes before card i (a smaller
 *                    key, or the same key and an earlier position), else 0; each row's sum inks at its end: 2 0 3 1;
 *                    the equation card: keys 30 10 30 20 → ranks 2 0 3 1
 *   Nothing (6.08)   each card slides straight across its OWN row to its rank's lane, then straight down that lane
 *                    into its slot: four rows, four lanes, no two paths ever cross and no card trades places; the shelf
 *                    reads 10 20 30 30, the first 30 ahead of the second (the tie broken by position)
 * The ranks are COMPUTED below from the keys, never typed.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, ease5, inkCol, lerp, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s10';

// ------------------------------------------------------------------ the data (script ch06-s10, PT16)
const KEYS = [30, 10, 30, 20];
const N = KEYS.length;
/** tile (i, j): does card j come before card i? (a smaller key, or the same key and an earlier position) */
const BEFORE = KEYS.map((ki, i) => KEYS.map((kj, j) => (kj < ki || (kj === ki && j < i) ? 1 : 0)));
const RANK = BEFORE.map((row) => row.reduce((a, b) => a + b, 0));

// ------------------------------------------------------------------ layout (L4 rest px)
const ROW_Y = [222, 304, 386, 468];
const CARD = { x: 196, w: 100, h: 66 };
const TILE = { x0: 336, pitch: 78, s: 60 };
const colX = (j: number) => TILE.x0 + j * TILE.pitch;
const SUM_X = 690;
const LANE_X = [818, 910, 1002, 1094];
const SHELF_Y = 556;
const BOARD = { x: 112, y: 150, w: 1060, h: 470 };

interface Beats {
  D: number;
  each: number;
  flip: number;
  slide: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, each: T.word('L0621', 'each'), flip: T.beat('flip'), slide: T.beat('slide') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 300, r: 300 }, sunX: 640, sunY: 330, intensity: 0.95 });
    // a tube over the board, on the back wall (behind the action plane, so its halo never washes the board)
    f.practical({ x: 640, y: 118, kind: 'tube', seed: 61, intensity: 0.55, radius: 220, layer: 'L3' });
    f.layer('L4', (c, env) => {
      armAndRack(f, c, env);
      rowThreads(c, env, t, b);
      tiles(c, env, tq, b);
      sums(c, env, t, b);
      slots(c, env, t, b);
      cards(c, env, tq, b);
      // the equation card, pinned to the rack's top rail as the tiles land
      paperSlip(c, env, { lines: ['keys 30 10 30 20 → ranks 2 0 3 1'], x: 640, y: 92, t, inkAt: b.flip + 0.3, font: 'mono', size: 24, id: `${ID}-eq`, pin: true, tint: 'card' });
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 684 });
  },
});

// ------------------------------------------------------------------ camera: front-on, a slow settle in
function cam(t: number, b: Beats): Camera3 {
  const u = ease5(clamp01(t / b.D));
  return { x: lerp(640, 652, u), y: lerp(356, 372, u), z: lerp(-30, 70, u), lens: 1 };
}

// ------------------------------------------------------------------ the rack (open, dark) and the clockwork's arm
function armAndRack(f: Parameters<Parameters<typeof defineShot>[0]['paint']>[0], c: C2, env: PaintEnv) {
  f.cached(`${ID}/rack/${env.mood.id}`, 1500, 760, (cc) => {
    cc.translate(60, 40);
    const ink = PUPPET_NEAR_BLACK;
    const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
    const { x, y, w, h } = BOARD;
    cc.fillStyle = ink;
    // the clockwork's fourth arm, in from the left above the frame, ending in its tip: four identical tiles
    cc.save();
    cc.strokeStyle = mixLab(brassOf(env, 0.1), ink, 0.45);
    cc.lineWidth = 9;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(-80, 40);
    cc.quadraticCurveTo(40, 70, x + 40, y - 14);
    cc.stroke();
    cc.fillStyle = mixLab(brassOf(env, 0.1), ink, 0.35);
    for (let p = 0; p < 4; p++) cc.fillRect(x + 6 + p * 20, y - 46, 15, 15);
    cc.restore();
    // two hanging rods to the top rail
    cc.fillStyle = ink;
    for (const rx of [x + 220, x + w - 160]) cc.fillRect(rx - 3, -40, 6, y + 4 + 40);
    // top rail, shelf, end posts
    cc.fillRect(x, y - 6, w, 14);
    cc.fillRect(x - 6, y - 6, 16, h);
    cc.fillRect(x + w - 10, y - 6, 16, h);
    cc.fillRect(x - 10, SHELF_Y + 40, w + 20, 18);
    // row grooves: one thin rail under each row, from the card to the lanes
    for (const ry of ROW_Y) cc.fillRect(x + 20, ry + 36, LANE_X[3] + 40 - (x + 20), 4);
    // lane grooves: four uprights down to the shelf
    for (const lx of LANE_X) cc.fillRect(lx - 2, y + 8, 4, SHELF_Y + 40 - (y + 8));
    // a cross-brace between the sum column and the lanes
    cc.fillRect(SUM_X + 46, y + 8, 8, SHELF_Y + 40 - (y + 8));
    // rim tops only
    cc.strokeStyle = rim;
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.moveTo(x, y - 6);
    cc.lineTo(x + w, y - 6);
    cc.moveTo(x - 10, SHELF_Y + 40);
    cc.lineTo(x + w + 10, SHELF_Y + 40);
    cc.stroke();
    // the four slots on the shelf: open paper-lined trays
    LANE_X.forEach((lx, k) => {
      cc.fillStyle = ink;
      cc.fillRect(lx - CARD.w / 2 - 8, SHELF_Y - CARD.h / 2 - 6, CARD.w + 16, CARD.h + 46);
      cc.fillStyle = withAlpha(mixLab(env.mood.haze, env.mood.halo, 0.3), 0.32);
      cc.fillRect(lx - CARD.w / 2 - 2, SHELF_Y - CARD.h / 2, CARD.w + 4, CARD.h + 4);
      cc.strokeStyle = rim;
      cc.lineWidth = 1.2;
      cc.strokeRect(lx - CARD.w / 2 - 2, SHELF_Y - CARD.h / 2, CARD.w + 4, CARD.h + 4);
      void k;
    });
  })(c, -60, -40);
  // the slot numbers (reading text, under each tray)
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 22px ${FONT.mono}`, 22, '0');
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(env.mood.rim, env.mood.core, 0.4);
    LANE_X.forEach((lx, k) => {
      c.fillText(String(k), lx, SHELF_Y + 34 + size * 0.75);
      textProbe(c, `${ID}-slot${k}`, lx - size * 0.4, SHELF_Y + 34, size * 0.8, size, 1);
    });
  });
}

// ------------------------------------------------------------------ 'each': every row thread lights at once
function rowThreads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.each - 0.1, b.each + 0.35);
  const out = 1 - seg(t, b.slide - 0.2, b.slide + 0.2);
  if (u * out <= 0.01) return;
  c.save();
  c.strokeStyle = withAlpha(mixLab(brassOf(env, 0.8), env.mood.core, 0.3), 0.75 * out);
  c.lineWidth = lw(c, 2.2);
  c.lineCap = 'round';
  for (const ry of ROW_Y) {
    const x0 = CARD.x + CARD.w / 2 + 4;
    const x1 = lerp(x0, SUM_X - 26, u);
    c.beginPath();
    c.moveTo(x0, ry + 38);
    c.lineTo(x1, ry + 38);
    c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the sixteen flip tiles
function tiles(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const t0 = b.flip - 0.06;
  const dur = 0.34;
  const u = clamp01((tq - t0) / dur);
  const sy = Math.abs(Math.cos(u * Math.PI));
  const front = u >= 0.5;
  const paper = cardPaper(env);
  const ink = inkCol(env);
  const size = legibleSize(c, `600 30px ${FONT.mono}`, 30, '0');
  // the column heads: which card each column asks about (its key), small, on the top rail's paper strip
  textRole(c, 'subject', () => {
    const hs = legibleSize(c, `500 20px ${FONT.mono}`, 20, '0');
    c.font = `500 ${hs}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.fillStyle = mixLab(env.mood.rim, env.mood.core, 0.35);
    KEYS.forEach((k, j) => {
      c.fillText(String(k), colX(j), ROW_Y[0] - TILE.s / 2 - 12);
      textProbe(c, `${ID}-head${j}`, colX(j) - hs, ROW_Y[0] - TILE.s / 2 - 12 - hs * 0.75, hs * 2, hs, 1);
    });
  });
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = colX(j), y = ROW_Y[i];
      const v = BEFORE[i][j];
      const h = TILE.s * Math.max(0.04, sy);
      c.save();
      // the pin it hangs from
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.fillRect(x - 2, y - TILE.s / 2 - 8, 4, 8);
      c.fillStyle = withAlpha(shadowCol, 0.35);
      c.fillRect(x - TILE.s / 2 + 3, y - h / 2 + 4, TILE.s, h);
      if (!front) {
        // the back: dark card with a cut-line diagonal
        c.fillStyle = mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.45);
        c.fillRect(x - TILE.s / 2, y - h / 2, TILE.s, h);
        c.strokeStyle = withAlpha(env.mood.rim, 0.22);
        c.lineWidth = lw(c, 1.2);
        c.strokeRect(x - TILE.s / 2 + 4, y - h / 2 + 4 * sy, TILE.s - 8, Math.max(0, h - 8 * sy));
      } else {
        c.fillStyle = v ? paper : mixLab(paper, env.mood.haze, 0.35);
        c.fillRect(x - TILE.s / 2, y - h / 2, TILE.s, h);
        if (v) {
          c.strokeStyle = withAlpha(brassOf(env, 0.6), 0.9);
          c.lineWidth = lw(c, 2);
          c.strokeRect(x - TILE.s / 2 + 1, y - h / 2 + 1, TILE.s - 2, h - 2);
        }
        cardProbe(c, `${ID}-t${i}${j}`, x - TILE.s / 2, y - h / 2, TILE.s, h, 1, sy > 0.3 ? 1 : 0);
        if (sy > 0.2) {
          c.translate(x, y);
          c.scale(1, sy);
          textRole(c, 'subject', () => {
            c.font = `600 ${size}px ${FONT.mono}`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillStyle = v ? ink : withAlpha(ink, 0.55);
            c.fillText(String(v), 0, 2);
          });
        }
      }
      c.restore();
    }
  }
}

// ------------------------------------------------------------------ the row sums (2 0 3 1)
function sums(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.flip + 0.42;
  const u = clamp01((t - inkAt + 0.12) / 0.2);
  if (u <= 0) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `700 34px ${FONT.mono}`, 34, '0');
    for (let i = 0; i < N; i++) {
      const y = ROW_Y[i];
      c.save();
      c.globalAlpha = u;
      c.fillStyle = withAlpha(shadowCol, 0.35);
      c.beginPath();
      c.arc(SUM_X + 3, y + 4, 27, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = mixLab(cardPaper(env), brassOf(env, 0.7), 0.25);
      c.beginPath();
      c.arc(SUM_X, y, 27, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = brassOf(env, 0.5);
      c.lineWidth = lw(c, 2);
      c.stroke();
      cardProbe(c, `${ID}-sum${i}`, SUM_X - 27, y - 27, 54, 54, u, u);
      c.font = `700 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = inkCol(env);
      c.fillText(String(RANK[i]), SUM_X, y + 2);
      // the '=' tick between the last tile and the sum
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.8);
      c.fillRect(colX(N - 1) + TILE.s / 2 + 10, y - 5, 16, 3);
      c.fillRect(colX(N - 1) + TILE.s / 2 + 10, y + 3, 16, 3);
      c.restore();
    }
  });
}

// ------------------------------------------------------------------ the slots warm as each card lands
function slots(c: C2, env: PaintEnv, t: number, b: Beats) {
  for (let i = 0; i < N; i++) {
    const land = b.slide - 0.1 + 0.8 + 0.62;
    const g = seg(t, land - 0.05, land + 0.15) * (1 - 0.6 * seg(t, land + 0.3, land + 1.2));
    if (g <= 0.01) continue;
    const lx = LANE_X[RANK[i]];
    c.save();
    c.globalCompositeOperation = 'lighter';
    const rg = c.createRadialGradient(lx, SHELF_Y, 10, lx, SHELF_Y, 90);
    rg.addColorStop(0, withAlpha(brassOf(env, 1), 0.28 * g));
    rg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
    c.fillStyle = rg;
    c.fillRect(lx - 90, SHELF_Y - 90, 180, 180);
    c.restore();
  }
}

// ------------------------------------------------------------------ the four key cards and their slide
function cardPos(i: number, tq: number, b: Beats) {
  const t0 = b.slide - 0.1;
  const h = ease5(clamp01((tq - t0) / 0.8));
  const v = ease5(clamp01((tq - t0 - 0.8) / 0.62));
  const lx = LANE_X[RANK[i]];
  return { x: lerp(CARD.x, lx, h), y: lerp(ROW_Y[i], SHELF_Y, v), moving: (h > 0 && h < 1) || (v > 0 && v < 1) };
}
function cards(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const paper = cardPaper(env);
  const ink = inkCol(env);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 40px ${FONT.display}`, 40, '0');
    for (let i = 0; i < N; i++) {
      const p = cardPos(i, tq, b);
      c.save();
      c.translate(p.x, p.y);
      // a moving card lifts a hair off the rack (its shadow drops away)
      const lift = p.moving ? 1 : 0;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.fillRect(-CARD.w / 2 + 4 + 3 * lift, -CARD.h / 2 + 5 + 4 * lift, CARD.w, CARD.h);
      c.fillStyle = paper;
      c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
      c.strokeStyle = withAlpha(ink, 0.35);
      c.lineWidth = lw(c, 1.2);
      c.strokeRect(-CARD.w / 2 + 0.5, -CARD.h / 2 + 0.5, CARD.w - 1, CARD.h - 1);
      cardProbe(c, `${ID}-card${i}`, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 1, 1);
      // its position in the deck: a row of small punched holes along the top edge (1 to 4), so the two 30s read apart
      c.fillStyle = withAlpha(ink, 0.55);
      for (let k = 0; k <= i; k++) {
        c.beginPath();
        c.arc(-CARD.w / 2 + 10 + k * 9, -CARD.h / 2 + 9, 2.4, 0, Math.PI * 2);
        c.fill();
      }
      c.font = `600 ${size}px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = ink;
      c.fillText(String(KEYS[i]), 0, 5);
      c.restore();
    }
  });
}
