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
 *   every (2.53)     all four cards lift together; the arm's tip (four identical tiles) warms
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
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, PUPPET_NEAR_BLACK, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { brassOf, cardPaper, clamp01, clockNear, clockRoom, ease5, inkCol, lerp, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s10';

// ------------------------------------------------------------------ the data (script ch06-s10, PT16)
const KEYS = [30, 10, 30, 20];
const N = KEYS.length;
/** tile (i, j): does card j come before card i? (a smaller key, or the same key and an earlier position) */
const BEFORE = KEYS.map((ki, i) => KEYS.map((kj, j) => (kj < ki || (kj === ki && j < i) ? 1 : 0)));
const RANK = BEFORE.map((row) => row.reduce<number>((a, b) => a + b, 0));

// ------------------------------------------------------------------ layout (L4 rest px)
const ROW_Y = [222, 304, 386, 468];
const CARD = { x: 196, w: 88, h: 62 };
const TILE = { x0: 336, pitch: 78, s: 60 };
const colX = (j: number) => TILE.x0 + j * TILE.pitch;
const SUM_X = 690;
const LANE_X = [800, 906, 1012, 1118];
const SHELF_Y = 556;
const BOARD = { x: 112, y: 150, w: 1080, h: 470 };

/** the slide's two legs: across the card's own row, then down its rank's lane */
const SLIDE_H = 0.7;
const SLIDE_V = 0.5;

interface Beats {
  D: number;
  /** 'every' (item): all four cards lift together, the arm's tip warms */
  every: number;
  each: number;
  flip: number;
  /** 'before': the end of the relation's sweep down the columns */
  before: number;
  slide: number;
}

/** the slide's dimming of the 0/1 tiles (the sums stay lit): the cards ride a front sub-plane over them */
const tileDim = (t: number, b: Beats) => 1 - 0.62 * seg(t, b.slide - 0.3, b.slide);
/** the moment the cards leave their rows, and land */
const slideStart = (b: Beats) => b.slide - 0.1;
const landAt = (b: Beats) => slideStart(b) + SLIDE_H + SLIDE_V;

/** the position dots (1..4) every card and column head carries, so the two 30s read apart (review r1: doubled) */
function posDots(c: C2, x0: number, y: number, n: number, r: number, gap: number) {
  for (let k = 0; k < n; k++) {
    c.beginPath();
    c.arc(x0 + k * gap, y, r, 0, Math.PI * 2);
    c.fill();
  }
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      every: T.word('L0621', 'every'),
      each: T.word('L0621', 'each'),
      flip: T.beat('flip'),
      before: T.word('L0621', 'before'),
      slide: T.beat('slide'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 300, r: 300 }, sunX: 640, sunY: 330, intensity: 0.95 });
    // review r1: a soft dark plate behind the board pulls the round window down (~30 %), so the tiles, not the window's
    // spokes, are the brightest read; a haze band settles over the plate's lower edge
    f.layer('L3', (c, env) => backPlate(f, c, env));
    f.fog({ yCenter: 600, height: 150, alpha: 0.12, drift: 8 });
    // a tube over the board, on the back wall (behind the action plane, so its halo never washes the board): it keys
    // the board
    f.practical({ x: 640, y: 118, kind: 'tube', seed: 61, intensity: 0.8, radius: 240, layer: 'L3' });
    f.layer('L4', (c, env) => {
      armAndRack(f, c, env);
      armTip(c, env, t, b);
      rowThreads(c, env, t, b);
      tiles(c, env, t, tq, b);
      columnSweep(c, env, t, b);
      sums(c, env, t, b);
      guides(c, env, t, b);
      slots(c, env, t, b);
      cards(c, env, t, tq, b);
      // the equation card, pinned to the rack's top rail as the tiles land
      paperSlip(c, env, { lines: ['keys 30 10 30 20 → ranks 2 0 3 1'], x: 640, y: 92, t, inkAt: b.flip + 0.3, font: 'mono', size: 24, id: `${ID}-eq`, pin: true, tint: 'card' });
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 684 });
    // review r1: a near plane, the bench's corner, dark and soft at the lower left (it slides against the board)
    f.layer('L5', (c, env) => nearCorner(f, c, env));
  },
});

// ------------------------------------------------------------------ camera: front-on, a slow settle in and across
function cam(t: number, b: Beats): Camera3 {
  const u = ease5(clamp01(t / b.D));
  return { x: lerp(596, 690, u), y: lerp(352, 374, u), z: lerp(-80, 80, u), lens: 1 };
}

// ------------------------------------------------------------------ the dark plate behind the board (L3, baked soft)
function backPlate(f: Frame, c: C2, env: PaintEnv) {
  const pad = 120;
  const { x, y, w, h } = BOARD;
  f.cached(`${ID}/plate/${env.mood.id}`, w + 2 * pad, h + 2 * pad, (cc) => {
    cc.translate(-x + pad, -y + pad);
    cc.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.55), 0.5);
    cc.beginPath();
    cc.roundRect(x - 20, y - 30, w + 40, h + 40, 40);
    cc.fill();
  }, { blur: 26 })(c, x - pad, y - pad);
}

// ------------------------------------------------------------------ the near plane: the bench's corner (L5, blurred)
function nearCorner(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/corner/${env.mood.id}`, 520, 260, (cc) => {
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.beginPath();
    cc.moveTo(0, 96);
    cc.lineTo(330, 120);
    cc.quadraticCurveTo(354, 122, 362, 142);
    cc.lineTo(400, 260);
    cc.lineTo(0, 260);
    cc.closePath();
    cc.fill();
    // a vice's jaw standing on the corner
    cc.fillRect(170, 58, 46, 50);
    cc.fillRect(150, 50, 86, 12);
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.38);
    cc.lineWidth = 2.5;
    cc.beginPath();
    cc.moveTo(0, 96);
    cc.lineTo(330, 120);
    cc.quadraticCurveTo(354, 122, 362, 142);
    cc.moveTo(150, 50);
    cc.lineTo(236, 50);
    cc.stroke();
  }, { blur: 7 })(c, -180, 540);
}

// ------------------------------------------------------------------ the rack (open, dark) and the clockwork's arm
function armAndRack(f: Frame, c: C2, env: PaintEnv) {
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

/** the clockwork arm's tip (four identical tiles) warms on 'every item' */
function armTip(c: C2, env: PaintEnv, t: number, b: Beats) {
  const g = seg(t, b.every - 0.15, b.every + 0.15) * (1 - seg(t, b.every + 0.6, b.every + 1.6));
  if (g <= 0.01) return;
  c.save();
  c.fillStyle = withAlpha(brassOf(env, 1), 0.85 * g);
  for (let p = 0; p < 4; p++) c.fillRect(BOARD.x + 6 + p * 20, BOARD.y - 46, 15, 15);
  c.globalCompositeOperation = 'lighter';
  const cx = BOARD.x + 44, cy = BOARD.y - 38;
  const rg = c.createRadialGradient(cx, cy, 0, cx, cy, 70);
  rg.addColorStop(0, withAlpha(brassOf(env, 1), 0.3 * g));
  rg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
  c.fillStyle = rg;
  c.fillRect(cx - 70, cy - 70, 140, 140);
  c.restore();
}

// ------------------------------------------------------------------ 'each': every row thread lights at once
function rowThreads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.each - 0.1, b.each + 0.4);
  const out = 1 - seg(t, b.slide - 0.25, b.slide + 0.1);
  if (u * out <= 0.01) return;
  const col = mixLab(brassOf(env, 1), env.mood.core, 0.35);
  c.save();
  c.lineCap = 'round';
  for (const ry of ROW_Y) {
    const x0 = CARD.x + CARD.w / 2 + 2;
    const x1 = lerp(x0, SUM_X - 30, u);
    // the strand runs from the card along its row, behind the tiles' mid-height, all four at once
    c.strokeStyle = withAlpha(col, 0.9 * out);
    c.lineWidth = lw(c, 3);
    c.beginPath();
    c.moveTo(x0, ry);
    c.lineTo(x1, ry);
    c.stroke();
    // its bright head
    c.globalCompositeOperation = 'lighter';
    const hg = c.createRadialGradient(x1, ry, 0, x1, ry, 22);
    hg.addColorStop(0, withAlpha(col, 0.55 * out * (1 - seg(t, b.each + 0.4, b.each + 0.8))));
    hg.addColorStop(1, withAlpha(col, 0));
    c.fillStyle = hg;
    c.fillRect(x1 - 22, ry - 22, 44, 44);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

// ------------------------------------------------------------------ the sixteen flip tiles
function tiles(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const t0 = b.flip - 0.06;
  const dur = 0.34;
  const u = clamp01((tq - t0) / dur);
  const sy = Math.abs(Math.cos(u * Math.PI));
  const front = u >= 0.5;
  const paper = cardPaper(env);
  const ink = inkCol(env);
  const size = legibleSize(c, `600 30px ${FONT.mono}`, 30, '0');
  const dim = tileDim(t, b);
  // the column heads: which card each column asks about (its key and its position dots, the same dots the card
  // carries), on the top rail's paper strip
  textRole(c, 'subject', () => {
    const hs = legibleSize(c, `500 20px ${FONT.mono}`, 20, '0');
    c.font = `500 ${hs}px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const hy = ROW_Y[0] - TILE.s / 2 - 12;
    KEYS.forEach((k, j) => {
      const s = String(k);
      const tw = c.measureText(s).width;
      const dr = 3.6, dg = 9;
      const total = tw + 6 + (j * dg) + 2 * dr;
      const x0 = colX(j) - total / 2;
      c.fillStyle = mixLab(env.mood.rim, env.mood.core, 0.35);
      c.fillText(s, x0, hy);
      textProbe(c, `${ID}-head${j}`, x0, hy - hs * 0.75, tw, hs, 1);
      c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), 0.9);
      posDots(c, x0 + tw + 6 + dr, hy - hs * 0.36, j + 1, dr, dg);
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
          c.setTransform(c.getTransform().scale(1, 1 / sy).translate(-x, -y));
        }
      }
      // the slide: the tiles step down into the board's shade (the sums stay lit)
      if (dim < 0.999) {
        c.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.5), 1 - dim);
        c.fillRect(x - TILE.s / 2 - 1, y - h / 2 - 1, TILE.s + 2, h + 2);
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

// ------------------------------------------------------------------ 'counts' .. 'before': the relation, down the columns
/**
 * One simultaneous warm pass down every column head into its tiles (all at once, the same work): column j asks
 * "does card j come before this row's card?", and the tiles it lights on the way down are the 1s of that column.
 */
function columnSweep(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a0 = b.flip - 0.05, a1 = b.before + 0.25;
  const u = ease5(clamp01((t - a0) / (a1 - a0)));
  const fade = 1 - seg(t, b.before + 0.35, b.before + 1.1);
  if (u <= 0 || fade <= 0.01) return;
  const warm = mixLab(brassOf(env, 1), env.mood.core, 0.3);
  const yTop = ROW_Y[0] - TILE.s / 2 - 26;
  const yBot = ROW_Y[N - 1] + TILE.s / 2 + 6;
  const head = lerp(yTop, yBot, u);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let j = 0; j < N; j++) {
    const x = colX(j);
    // the sweep's trail: a faint warm wash down the column, brightest at its head
    const g = c.createLinearGradient(0, yTop, 0, head + 6);
    g.addColorStop(0, withAlpha(warm, 0));
    g.addColorStop(0.8, withAlpha(warm, 0.1 * fade));
    g.addColorStop(1, withAlpha(warm, 0.26 * fade));
    c.fillStyle = g;
    c.fillRect(x - TILE.s / 2 - 4, yTop, TILE.s + 8, head - yTop + 6);
    // the 1s it has reached warm
    for (let i = 0; i < N; i++) {
      if (!BEFORE[i][j]) continue;
      const k = seg(head, ROW_Y[i] - TILE.s / 2, ROW_Y[i]) * fade;
      if (k <= 0.01) continue;
      const rg = c.createRadialGradient(x, ROW_Y[i], 6, x, ROW_Y[i], TILE.s * 0.85);
      rg.addColorStop(0, withAlpha(warm, 0.32 * k));
      rg.addColorStop(1, withAlpha(warm, 0));
      c.fillStyle = rg;
      c.fillRect(x - TILE.s, ROW_Y[i] - TILE.s, TILE.s * 2, TILE.s * 2);
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the guides: each sum names its lane and its slot
/**
 * Just before the cards move, a thin pale guide runs from each row's sum bubble across to the lane of that rank and
 * straight down it to the slot's index: the destination comes from the count. They hold through the slide and fade
 * as the cards land.
 */
function guides(c: C2, env: PaintEnv, t: number, b: Beats) {
  const g0 = slideStart(b) - 0.42;
  const grow = seg(t, g0, slideStart(b) + 0.02);
  const out = 1 - seg(t, landAt(b) + 0.15, landAt(b) + 0.7);
  if (grow <= 0.01 || out <= 0.01) return;
  const col = mixLab(env.mood.rim, env.mood.core, 0.55);
  c.save();
  c.lineCap = 'round';
  c.setLineDash([lw(c, 5), lw(c, 4)]);
  for (let i = 0; i < N; i++) {
    const lx = LANE_X[RANK[i]];
    const y0 = ROW_Y[i];
    const x0 = SUM_X + 29;
    const yEnd = SHELF_Y + 30;
    const legH = lx - x0, legV = yEnd - y0;
    const len = (legH + legV) * grow;
    c.strokeStyle = withAlpha(col, 0.75 * out);
    c.lineWidth = lw(c, 1.8);
    c.beginPath();
    c.moveTo(x0, y0);
    if (len <= legH) c.lineTo(x0 + len, y0);
    else {
      c.lineTo(lx, y0);
      c.lineTo(lx, y0 + (len - legH));
    }
    c.stroke();
    // a small arrowhead at the slot's index once the guide arrives
    const arr = seg(grow, 0.85, 1);
    if (arr > 0.01) {
      c.setLineDash([]);
      c.fillStyle = withAlpha(col, 0.85 * out * arr);
      c.beginPath();
      c.moveTo(lx - 6, yEnd - 8);
      c.lineTo(lx + 6, yEnd - 8);
      c.lineTo(lx, yEnd);
      c.closePath();
      c.fill();
      c.setLineDash([lw(c, 5), lw(c, 4)]);
    }
  }
  c.restore();
}

// ------------------------------------------------------------------ the slots warm as each card lands
function slots(c: C2, env: PaintEnv, t: number, b: Beats) {
  for (let i = 0; i < N; i++) {
    const land = landAt(b);
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
  const t0 = slideStart(b);
  const h = ease5(clamp01((tq - t0) / SLIDE_H));
  const v = ease5(clamp01((tq - t0 - SLIDE_H) / SLIDE_V));
  const lx = LANE_X[RANK[i]];
  // 'every item': the same small lift on every card at once (the same work, on every item)
  const bump = Math.sin(Math.PI * clamp01((tq - b.every + 0.08) / 0.5));
  // review r1: from the slide's start the cards ride a front sub-plane (larger, a deeper shadow) over the dimmed
  // tiles, and settle back into the slot as they land
  const front = clamp01((tq - t0 + 0.12) / 0.12) * (1 - clamp01((tq - landAt(b)) / 0.3));
  return { x: lerp(CARD.x, lx, h), y: lerp(ROW_Y[i], SHELF_Y, v) - 7 * bump, front, bump };
}
function cards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const paper = cardPaper(env);
  const ink = inkCol(env);
  void t;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 34px ${FONT.mono}`, 34, '0');
    for (let i = 0; i < N; i++) {
      const p = cardPos(i, tq, b);
      const sc = 1 + 0.06 * p.front;
      const sh = 5 + 6 * Math.max(p.front, 0.4 * p.bump);
      c.save();
      c.translate(p.x, p.y);
      c.scale(sc, sc);
      c.fillStyle = withAlpha(shadowCol, 0.4 + 0.12 * p.front);
      c.fillRect(-CARD.w / 2 + sh * 0.7, -CARD.h / 2 + sh, CARD.w, CARD.h);
      c.fillStyle = paper;
      c.fillRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
      c.strokeStyle = withAlpha(ink, 0.35);
      c.lineWidth = lw(c, 1.2);
      c.strokeRect(-CARD.w / 2 + 0.5, -CARD.h / 2 + 0.5, CARD.w - 1, CARD.h - 1);
      cardProbe(c, `${ID}-card${i}`, -CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 1, 1);
      // its position in the deck: a row of punched holes along the top edge (1 to 4), so the two 30s read apart
      c.fillStyle = withAlpha(ink, 0.62);
      posDots(c, -CARD.w / 2 + 12, -CARD.h / 2 + 11, i + 1, 4.8, 13);
      c.font = `600 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = ink;
      c.fillText(String(KEYS[i]), 0, 7);
      c.restore();
    }
  });
}
