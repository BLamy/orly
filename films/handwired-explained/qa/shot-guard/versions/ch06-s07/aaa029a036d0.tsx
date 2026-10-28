/**
 * ch06-s07 — A TREE: the prefix loom; the signature grommets paid (scene, the clock room, labGreen; cut; 14.79 s).
 *   L0617 "A tree. Running totals in a row: each waits for the last, seven steps deep. In pairs, then pairs of pairs:
 *          three or four."
 *
 * Front-on at a small PREFIX LOOM hanging off the clockwork's TREE arm (its brass bar comes in high from the left): a
 * dark frame against the clock room's wall; eight paper tabs along the top beam read 3 1 4 1 5 9 2 6; eight blank
 * total tabs sit on the bottom beam; a dark warp thread runs down from each tab to its total. A LEVEL RULER at the
 * loom's left counts levels down the frame. Beside the loom, on a sheet of vellum against the round window, a GHOST
 * overlay of Sklansky's pattern in dark see-through thread.
 *
 * TEACHES, word by word (PT15, PT05, PT26, PT28):
 *   tabs (0.30)        the tabs 3 1 4 1 5 9 2 6 and the empty totals row (the one equation, ink and paper together)
 *   row (2.84)         a GHOST CHAIN: one pale thread hops tab to tab, each join waiting for the last, seven knots
 *                      stacked seven levels deep down the frame; the ruler's slider counts 1..7, the 7th on 'deep'
 *   pairs (7.35)       the ghost chain fades; copper threads join neighbours in pairs (level 1), then on the second
 *                      'pairs' pairs of pairs (level 2), on 'of pairs' the top join (level 3), then back down (level 4):
 *                      Brent-Kung, 11 joins in 4 levels, each join a small knot of light; each column's total inks
 *                      along the bottom as its last join lands: 3 4 8 9 14 23 25 31. Beside it, level by level with it,
 *                      Sklansky's ghost: 12 joins in 3 levels, its third level one partial (0..3) fanning into four
 *                      threads at once (the fan lit a little brighter)
 *   names (10.00)      'three': the ruler stops at 3 (the ghost's depth) and on 'four' at 4 (the loom's); the camera
 *                      pushes in on the two patterns' threads
 *   sk (10.30)         a PAPER NAME TAG lights on Sklansky's fan, in the film's tag style: SKLANSKY 1960 with the
 *                      runtime's function name sklanskyPrefix in monospace, and under it a small card, a prefix network
 *                      only in a later reading; a STAMPED brass grommet at its lower corner
 *   bk (10.39 'four')  the second tag lights on the loom: BRENT · KUNG 1982, brentKungPrefix, its stamped grommet.
 *                      No figures for Sklansky, Brent or Kung; the names are not spoken: the tags, grommets and function
 *                      names carry them in the hold.
 */
import { Timeline } from '../../../core';
import type { Frame, PaintEnv } from '../../../film';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { brassBead, brassOf, cardPaper, clamp01, clockNear, clockRoom, inkCol, lw, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { armBar, camAt, camK, copperThread, knotLight, paperTab, tubeFixture, type CamKey } from '../sets/ch06-s06-kit';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s07';

const VALUES = [3, 1, 4, 1, 5, 9, 2, 6];
const TOTALS = VALUES.reduce<number[]>((a, v) => (a.push((a[a.length - 1] ?? 0) + v), a), []);
/** the loom (L4 rest px): columns, the tab row, the levels, the totals row */
const COLX = VALUES.map((_, i) => 196 + i * 70);
const TAB = { y: 120, w: 50, h: 44 };
const TAB_BOT = TAB.y + TAB.h;
const LEV_Y = (l: number) => (l === 0 ? TAB_BOT : TAB_BOT + 4 + l * 45);
const TOT = { y: 516, w: 54, h: 44 };
const RULER_X = 122;
const FRAME = { x0: 150, x1: 736, y0: 98, y1: 572 };
/** Sklansky's ghost overlay, beside the loom on a vellum sheet */
const SKX = VALUES.map((_, i) => 822 + i * 46);
const SK_TAB = { y: 128, w: 34, h: 30 };
const SK_SHEET = { x0: 790, x1: 1180, y0: 96, y1: 340 };

type Join = { s: number; d: number; l: number };
/** Brent-Kung for 8 items, as the repo counts it: 11 joins over 4 levels */
const BK: Join[] = [
  { s: 0, d: 1, l: 1 }, { s: 2, d: 3, l: 1 }, { s: 4, d: 5, l: 1 }, { s: 6, d: 7, l: 1 },
  { s: 1, d: 3, l: 2 }, { s: 5, d: 7, l: 2 },
  { s: 3, d: 7, l: 3 }, { s: 3, d: 5, l: 3 },
  { s: 1, d: 2, l: 4 }, { s: 3, d: 4, l: 4 }, { s: 5, d: 6, l: 4 },
];
/** Sklansky: 12 joins over 3 levels; level 3 is the one partial (0..3) fanning into four */
const SK: Join[] = [
  { s: 0, d: 1, l: 1 }, { s: 2, d: 3, l: 1 }, { s: 4, d: 5, l: 1 }, { s: 6, d: 7, l: 1 },
  { s: 1, d: 2, l: 2 }, { s: 1, d: 3, l: 2 }, { s: 5, d: 6, l: 2 }, { s: 5, d: 7, l: 2 },
  { s: 3, d: 4, l: 3 }, { s: 3, d: 5, l: 3 }, { s: 3, d: 6, l: 3 }, { s: 3, d: 7, l: 3 },
];
/** the serial chain: 7 joins, 7 levels */
const CHAIN: Join[] = Array.from({ length: 7 }, (_, k) => ({ s: k, d: k + 1, l: k + 1 }));

/** for a join list: where each join's source value sits (the source column's last level before this one) */
function withSources(js: Join[]) {
  const last = VALUES.map(() => 0);
  const sorted = [...js].sort((a, b) => a.l - b.l);
  const out = sorted.map((j) => ({ ...j, sl: 0 }));
  let i = 0;
  while (i < out.length) {
    const L = out[i].l;
    const lvl = out.filter((j) => j.l === L);
    lvl.forEach((j) => (j.sl = last[j.s]));
    lvl.forEach((j) => (last[j.d] = L));
    i += lvl.length;
  }
  return { joins: out, last };
}
const BKS = withSources(BK);
const SKS = withSources(SK);
const CHS = withSources(CHAIN);
const BK_DEPTH = 4, SK_DEPTH = 3;

/** the two name tags (L4 rest px): eyelet points, hung from a thread of each pattern */
const TAG_BK = { eye: { x: 452, y: 392 }, hang: { x: COLX[4], y: LEV_Y(4) }, w: 196, h: 92, tilt: -0.025 };
const TAG_SK = { eye: { x: 986, y: 372 }, hang: { x: SKX[4] + 0, y: LEV_Y(3) }, w: 196, h: 92, tilt: 0.03 };

interface Beats {
  D: number;
  tabs: number;
  row: number;
  deep: number;
  pairs: number;
  pairs2: number;
  pairs3: number;
  lvl4: number;
  names: number;
  sk: number;
  bk: number;
  four: number;
  lineEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const pairs3 = T.word('L0617', 'pairs#3');
    const names = T.beat('names');
    const b: Beats = {
      D: T.duration,
      tabs: T.beat('tabs'),
      row: T.beat('row'),
      deep: T.word('L0617', 'deep'),
      pairs: T.beat('pairs'),
      pairs2: T.word('L0617', 'pairs#2'),
      pairs3,
      lvl4: pairs3 + 0.5 * (names - pairs3),
      names,
      sk: T.beat('sk'),
      bk: T.beat('bk'),
      four: T.word('L0617', 'four'),
      lineEnd: T.line('L0617').end,
    };
    const keys: CamKey[] = [
      { t: 0, cam: camK(630, 330, 1.1) },
      // following the chain down the levels
      { t: b.row - 0.2, cam: camK(626, 332, 1.11) },
      { t: b.deep + 0.3, cam: camK(560, 344, 1.17) },
      // back out to see both patterns grow, level by level
      { t: b.pairs + 0.6, cam: camK(626, 330, 1.12) },
      { t: b.names - 0.05, cam: camK(640, 326, 1.13) },
      // the push in on the two threads (the tags light)
      { t: b.names + 1.7, cam: camK(724, 356, 1.47) },
      { t: b.D + 0.4, cam: camK(730, 358, 1.52) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    clockRoom(f, { key: ID, oculus: { x: 1010, y: 250, r: 330 }, lightGap: 700, sunX: 1000, sunY: 260 });
    f.layer('L3', (c, env) => tubeFixture(c, env, 440, 52, 300));
    f.practical({ x: 440, y: 56, kind: 'tube', seed: 71, intensity: 0.7, radius: 150, layer: 'L3' });
    f.layer('L4', (c, env) => {
      armBar(c, env, [{ x: -420, y: 30 }, { x: -60, y: 70 }, { x: FRAME.x0 + 6, y: FRAME.y0 + 4 }], { w: 10, lit: 0.25 });
      loomFrame(f, c, env);
      skSheet(f, c, env, t, b);
      warps(c, env, t, b);
      ghostChain(c, env, t, tq, b);
      bkThreads(c, env, t, tq, b);
      skThreads(c, env, t, tq, b);
      tabs(c, env, t, b);
      totals(c, env, t, b);
      ruler(c, env, t, tq, b);
      depthStops(c, env, t, b);
      nameTag(c, env, t, tq, b, 'sk');
      nameTag(c, env, t, tq, b, 'bk');
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 700, post: 1560, postL: -300 });
  },
});

// ------------------------------------------------------------------ timing per join
/** when a BK / SK level lands (its knots light) */
function levelAt(b: Beats, l: number) {
  return l === 1 ? b.pairs + 0.25 : l === 2 ? b.pairs2 + 0.2 : l === 3 ? b.pairs3 + 0.2 : b.lvl4 + 0.2;
}
/** when the chain's k-th knot (1..7) lands: the 7th on 'deep' */
function chainAt(b: Beats, k: number) {
  return b.row + 0.3 + ((k - 1) / 6) * (b.deep + 0.05 - b.row - 0.3);
}
/** the ghost chain fades as the pairs begin */
const chainFade = (t: number, b: Beats) => 1 - seg(t, b.pairs - 0.5, b.pairs + 0.15);
/** when a column's total is final in the loom */
function totalAt(b: Beats, col: number) {
  const L = BKS.last[col];
  return L === 0 ? b.pairs + 0.45 : levelAt(b, L) + 0.25;
}

// ------------------------------------------------------------------ the loom
function loomFrame(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/frame/${env.mood.id}`, 700, 560, (cc) => {
    cc.translate(-(FRAME.x0 - 40), -(FRAME.y0 - 30));
    const { x0, x1, y0, y1 } = FRAME;
    // the backboard: dark felt stretched inside the frame, lit a little from the tube above
    const bg = cc.createLinearGradient(0, y0, 0, y1);
    bg.addColorStop(0, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.45));
    bg.addColorStop(0.35, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.7));
    bg.addColorStop(1, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.82));
    cc.fillStyle = bg;
    cc.fillRect(x0, y0, x1 - x0, y1 - y0);
    // felt grain
    cc.strokeStyle = withAlpha(env.mood.rim, 0.035);
    cc.lineWidth = 1;
    for (let k = 0; k < 60; k++) {
      const yy = y0 + ((k * 37) % (y1 - y0));
      cc.beginPath();
      cc.moveTo(x0, yy);
      cc.lineTo(x1, yy + Math.sin(k) * 3);
      cc.stroke();
    }
    cc.fillStyle = PUPPET_NEAR_BLACK;
    // two uprights, the top beam with a cap moulding, the bottom beam
    cc.fillRect(x0 - 8, y0 - 6, 14, y1 - y0 + 30);
    cc.fillRect(x1 - 6, y0 - 6, 14, y1 - y0 + 30);
    cc.fillRect(x0 - 18, y0 - 10, x1 - x0 + 36, 12);
    cc.fillRect(x0 - 12, y0 + 2, x1 - x0 + 24, 5);
    cc.fillRect(x0 - 18, y1 - 6, x1 - x0 + 36, 12);
    // feet
    cc.fillRect(x0 - 26, y1 + 18, 44, 8);
    cc.fillRect(x1 - 18, y1 + 18, 44, 8);
    // the brass edges catching the tube above
    cc.strokeStyle = withAlpha(brassOf(env, 0.45), 0.85);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(x0 - 18, y0 - 10);
    cc.lineTo(x1 + 18, y0 - 10);
    cc.moveTo(x0 - 18, y1 - 6);
    cc.lineTo(x1 + 18, y1 - 6);
    cc.stroke();
    // turned finials on the uprights
    for (const x of [x0 - 1, x1 + 1]) {
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.beginPath();
      cc.ellipse(x, y0 - 20, 7, 9, 0, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(brassOf(env, 0.5), 0.8);
      cc.beginPath();
      cc.arc(x, y0 - 20, 6, Math.PI * 1.1, Math.PI * 1.9);
      cc.stroke();
    }
  })(c, FRAME.x0 - 40, FRAME.y0 - 30);
}

/** the dark warp per column, tab to total; glowing copper below its last join once its total is final */
function warps(c: C2, env: PaintEnv, t: number, b: Beats) {
  c.save();
  c.lineCap = 'round';
  COLX.forEach((x, i) => {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.22);
    c.lineWidth = lw(c, 1.4);
    c.beginPath();
    c.moveTo(x, TAB_BOT);
    c.lineTo(x, TOT.y);
    c.stroke();
    const done = seg(t, totalAt(b, i) - 0.3, totalAt(b, i));
    if (done > 0) {
      const yA = LEV_Y(BKS.last[i]);
      copperThread(c, env, { x, y: yA }, { x, y: TOT.y }, done, { sag: 0, glow: 0.35, w: 2 });
    }
  });
  c.restore();
}

/** the eight paper tabs on the top beam: 3 1 4 1 5 9 2 6 (subject: the equation's left side) */
function tabs(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = Math.max(0.05, b.tabs - 0.2);
  const paper = cardPaperAlpha(t, inkAt);
  const ink = cardInkAlpha(t, inkAt);
  VALUES.forEach((v, i) => {
    const x = COLX[i];
    // its string from the beam
    c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.8 * paper);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    c.moveTo(x, FRAME.y0 + 4);
    c.lineTo(x, TAB.y);
    c.stroke();
    const lit = i === 0 ? 0 : seg(t, levelAt(b, 1) - 0.2, levelAt(b, 1)) * (1 - seg(t, levelAt(b, 1) + 0.2, levelAt(b, 1) + 1));
    paperTab(c, env, { x, y: TAB.y, w: TAB.w, h: TAB.h, text: String(v), paper, ink, size: 26, lift: lit * 0.4, id: i === 0 ? `${ID}-tabs` : undefined });
  });
  if (paper > 0.01) {
    const w = COLX[7] - COLX[0] + TAB.w;
    cardProbe(c, `${ID}-tabs-row`, COLX[0] - TAB.w / 2, TAB.y, w, TAB.h, paper, ink);
  }
}

/** the totals row on the bottom beam: blank tabs; each total inks as its column's last join lands */
function totals(c: C2, env: PaintEnv, t: number, b: Beats) {
  TOTALS.forEach((v, i) => {
    const x = COLX[i];
    // the empty slot in the bottom beam (a dark recess with a brass lip: no paper until there is a total)
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9);
    c.fillRect(x - TOT.w / 2 - 3, TOT.y - 3, TOT.w + 6, TOT.h + 6);
    c.strokeStyle = withAlpha(brassOf(env, 0.35), 0.75);
    c.lineWidth = lw(c, 1.2);
    c.strokeRect(x - TOT.w / 2 - 3, TOT.y - 3, TOT.w + 6, TOT.h + 6);
    // the total's tab drops into its slot as its column's last join lands: paper and ink together
    const at = totalAt(b, i);
    const paper = cardPaperAlpha(t, at);
    if (paper <= 0.01) return;
    const ink = cardInkAlpha(t, at);
    const flash = t > at ? Math.exp(-(t - at) * 3) : 0;
    const drop = (1 - seg(t, at - 0.3, at + 0.05)) * -14;
    paperTab(c, env, { x, y: TOT.y + drop, w: TOT.w, h: TOT.h, text: String(v), paper, ink, size: 24, lift: 0.25 + 0.4 * flash, inkColor: mixLab('#6e3410', inkCol(env), 0.25), id: `${ID}-tot-${i}` });
  });
}

// ------------------------------------------------------------------ the ghost chain (the JavaScript way)
function ghostChain(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const fade = chainFade(t, b);
  if (fade <= 0.01 || t < b.row - 0.4) return;
  c.save();
  c.globalAlpha = fade;
  CHS.joins.forEach((j) => {
    const k = j.l;
    const at = chainAt(b, k);
    const u = seg(tq, at - 0.4, at);
    if (u <= 0) return;
    const a = { x: COLX[j.s], y: LEV_Y(j.sl) }, d = { x: COLX[j.d], y: LEV_Y(j.l) };
    copperThread(c, env, a, d, u, { ghost: 1, sag: 3 });
    // the destination warp from its tab down to the knot, ghosted
    copperThread(c, env, { x: d.x, y: TAB_BOT }, d, u, { ghost: 0.6, sag: 0 });
    if (u >= 1) knotLight(c, env, d.x, d.y, 1, 7, { ghost: true });
  });
  c.restore();
}

// ------------------------------------------------------------------ Brent-Kung on the loom
function bkThreads(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const push = seg(t, b.names, b.names + 0.8);
  BKS.joins.forEach((j) => {
    const at = levelAt(b, j.l);
    const u = seg(tq, at - 0.38, at);
    if (u <= 0) return;
    const a = { x: COLX[j.s], y: LEV_Y(j.sl) }, d = { x: COLX[j.d], y: LEV_Y(j.l) };
    // the thread the BK tag hangs from glows a little on the push
    const hl = j.s === 3 && j.d === 4 ? push : 0;
    copperThread(c, env, a, d, u, { glow: 0.45 + 0.4 * hl, sag: 5 });
    // the destination's warp lights down to this level
    copperThread(c, env, { x: d.x, y: LEV_Y(j.l - 1 >= 0 ? prevLevelOf(BKS.joins, j) : 0) }, d, u, { glow: 0.3, sag: 0, w: 1.8 });
    const land = t > at ? Math.exp(-(t - at) * 2.5) : 0;
    knotLight(c, env, d.x, d.y, u >= 1 ? 0.55 + 0.45 * land + 0.3 * hl : 0, 7.5);
  });
}
/** the destination column's previous level (or its tab) for a join */
function prevLevelOf(js: (Join & { sl: number })[], j: Join) {
  let p = 0;
  js.forEach((k) => {
    if (k.d === j.d && k.l < j.l) p = Math.max(p, k.l);
  });
  return p;
}

// ------------------------------------------------------------------ Sklansky's ghost, beside
function skSheet(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.pairs - 0.4, b.pairs + 0.2);
  if (a <= 0.01) return;
  const { x0, x1, y0, y1 } = SK_SHEET;
  const sheet = f.cached(`${ID}/vellum/${env.mood.id}`, x1 - x0 + 40, y1 - y0 + 40, (cc) => {
    cc.translate(20, 20);
    cc.fillStyle = withAlpha(mixLab('#f1ead8', env.mood.core, 0.25), 0.2);
    cc.fillRect(0, 0, x1 - x0, y1 - y0);
    cc.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
    cc.lineWidth = 1.2;
    cc.strokeRect(0.5, 0.5, x1 - x0 - 1, y1 - y0 - 1);
    // two clips at the top
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(40, -10, 14, 18);
    cc.fillRect(x1 - x0 - 54, -10, 14, 18);
  });
  c.save();
  c.globalAlpha = a;
  sheet(c, x0 - 20, y0 - 20);
  // its small ghost tabs (texture: the same eight numbers)
  VALUES.forEach((v, i) => paperTab(c, env, { x: SKX[i], y: SK_TAB.y, w: SK_TAB.w, h: SK_TAB.h, text: String(v), size: 17, subject: false, paper: 0.7 }));
  c.restore();
}
function skThreads(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const a = seg(t, b.pairs - 0.4, b.pairs + 0.2);
  if (a <= 0.01) return;
  const skY = (l: number) => (l === 0 ? SK_TAB.y + SK_TAB.h : LEV_Y(l));
  const push = seg(t, b.names, b.names + 0.8);
  c.save();
  c.globalAlpha = a;
  c.lineCap = 'round';
  // warps: dark see-through thread down to the third level
  SKX.forEach((x) => {
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
    c.lineWidth = lw(c, 1.3);
    c.beginPath();
    c.moveTo(x, skY(0));
    c.lineTo(x, LEV_Y(SK_DEPTH) + 18);
    c.stroke();
  });
  SKS.joins.forEach((j) => {
    const at = levelAt(b, j.l);
    const u = seg(tq, at - 0.38, at);
    if (u <= 0) return;
    const fan = j.l === 3;
    const A = { x: SKX[j.s], y: skY(j.sl) }, D = { x: SKX[j.d], y: skY(j.l) };
    const N = 14;
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, fan ? 0.72 : 0.5);
    c.lineWidth = lw(c, fan ? 2.4 + 0.8 * push : 1.8);
    c.beginPath();
    for (let n = 0; n <= N; n++) {
      const k = (n / N) * u;
      const x = A.x + (D.x - A.x) * k, y = A.y + (D.y - A.y) * k + 3 * 4 * k * (1 - k);
      if (n === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    if (u >= 1) {
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.75);
      c.beginPath();
      c.arc(D.x, D.y, 4.2, 0, Math.PI * 2);
      c.fill();
    }
  });
  // the one partial (0..3) whose four threads fan out at once: a pale ring on its node as the fan lands
  const fanAt = levelAt(b, 3);
  const ring = seg(t, fanAt - 0.3, fanAt) * (1 - 0.5 * seg(t, fanAt + 0.6, fanAt + 1.5));
  if (ring > 0.01) {
    const p = { x: SKX[3], y: skY(2) };
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.85 * ring);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.arc(p.x, p.y, 9, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
    c.beginPath();
    c.arc(p.x, p.y, 5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------------ the level ruler and the depth stops
function ruler(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const x = RULER_X;
  // the ruler: a narrow dark strip with seven brass ticks, numbered
  c.save();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 5, LEV_Y(0) + 6, 10, LEV_Y(7) - LEV_Y(0) + 14);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 15px ${FONT.mono}`, 15, '7');
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (let l = 1; l <= 7; l++) {
      const y = LEV_Y(l);
      const reached = levelReached(t, b) >= l;
      c.strokeStyle = withAlpha(brassOf(env, reached ? 0.7 : 0.2), 0.95);
      c.lineWidth = lw(c, 2);
      c.beginPath();
      c.moveTo(x - 5, y);
      c.lineTo(x + 9, y);
      c.stroke();
      c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.4), reached ? 0.95 : 0.45);
      c.fillText(String(l), x - 12, y + size * 0.04);
      textProbe(c, `${ID}-ruler-${l}`, x - 12 - size * 0.62, y - size * 0.5, size * 0.62, size, reached ? 0.95 : 0.45);
    }
  });
  // the slider: follows the chain's knots 1..7, then the loom's levels 1..4
  const lv = sliderLevel(t, b);
  if (lv > 0) {
    const y = LEV_Y(0) + (LEV_Y(1) - LEV_Y(0)) * 0 + (lv <= 1 ? (LEV_Y(1) - LEV_Y(0)) * lv : LEV_Y(1) - LEV_Y(0) + (lv - 1) * 45);
    c.fillStyle = brassOf(env, 0.6);
    c.beginPath();
    c.moveTo(x + 9, y);
    c.lineTo(x + 21, y - 7);
    c.lineTo(x + 21, y + 7);
    c.closePath();
    c.fill();
  }
  c.restore();
}
/** the deepest level shown on the ruler so far (chain, then the loom) */
function levelReached(t: number, b: Beats) {
  let n = 0;
  for (let k = 1; k <= 7; k++) if (t >= chainAt(b, k)) n = k;
  return n;
}
/** the slider's level (continuous): rides the chain's knots, eases back up at 'pairs', then rides the loom's levels */
function sliderLevel(t: number, b: Beats) {
  if (t < b.row) return 0;
  if (t < b.pairs - 0.2) {
    let lv = 0;
    for (let k = 1; k <= 7; k++) lv += seg(t, chainAt(b, k) - 0.25, chainAt(b, k));
    return lv;
  }
  if (t < levelAt(b, 1) - 0.3) return 7 - 6 * seg(t, b.pairs - 0.2, levelAt(b, 1) - 0.3);
  let lv = 1;
  for (let l = 2; l <= BK_DEPTH; l++) lv += seg(t, levelAt(b, l) - 0.3, levelAt(b, l));
  return lv;
}

/** 'three or four': a stop marked 3 at the ghost's deepest level and one marked 4 at the loom's, with guide lines */
function depthStops(c: C2, env: PaintEnv, t: number, b: Beats) {
  const s3 = seg(t, b.names - 0.05, b.names + 0.2);
  const s4 = seg(t, b.four - 0.05, b.four + 0.2);
  const stop = (l: number, u: number, x0: number, x1: number, label: string, copper: boolean, side: 1 | -1 = 1) => {
    if (u <= 0.01) return;
    const y = LEV_Y(l);
    c.save();
    // the guide: a fine dotted line from the ruler across to the pattern's deepest knots
    c.setLineDash([lw(c, 3), lw(c, 5)]);
    c.strokeStyle = withAlpha(copper ? brassOf(env, 0.8) : mixLab(env.mood.rim, '#ffffff', 0.35), 0.8 * u);
    c.lineWidth = lw(c, 1.8);
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(x0 + (x1 - x0) * u, y);
    c.stroke();
    c.setLineDash([]);
    // the stop on the ruler: a brass collar with its number
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(RULER_X - 9, y - 5, 18, 10);
    c.fillStyle = copper ? brassOf(env, 0.8) : mixLab(env.mood.rim, '#ffffff', 0.15);
    c.fillRect(RULER_X - 9, y - 1.6, 18, 3.2);
    // the marker at the pattern's side
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `600 20px ${FONT.mono}`, 20, label);
      c.font = `600 ${size}px ${FONT.mono}`;
      const pw = size * 1.4, ph = size * 1.35;
      const px = side > 0 ? x1 + 8 : x1 - 8 - pw, py = y - ph / 2;
      c.globalAlpha = u;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.fillRect(px + 2, py + 3, pw, ph);
      c.fillStyle = copper ? brassOf(env, 0.5) : cardPaper(env);
      c.fillRect(px, py, pw, ph);
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, px + pw / 2, y + size * 0.04);
      textProbe(c, `${ID}-depth-${label}`, px, py, pw, ph, u);
    });
    c.restore();
  };
  stop(SK_DEPTH, s3, RULER_X + 12, SKX[0] - 8, '3', false, -1);
  stop(BK_DEPTH, s4, RULER_X + 12, FRAME.x1 + 6, '4', true);
}

// ------------------------------------------------------------------ the two name tags
function nameTag(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, which: 'sk' | 'bk') {
  const T = which === 'sk' ? TAG_SK : TAG_BK;
  const at = which === 'sk' ? b.sk : b.bk;
  const paper = cardPaperAlpha(t, at + 0.05, 0.3);
  if (paper <= 0.01) return;
  const ink = cardInkAlpha(t, at + 0.05);
  const name = which === 'sk' ? 'SKLANSKY 1960' : 'BRENT · KUNG 1982';
  const fn = which === 'sk' ? 'sklanskyPrefix' : 'brentKungPrefix';
  const swing = T.tilt + 0.02 * Math.sin(tq * 1.5 + (which === 'sk' ? 0 : 1.7)) * Math.exp(-Math.max(0, t - at) * 0.4) + (t > at ? 0.05 * Math.exp(-(t - at) * 2.4) * Math.sin((t - at) * 8) : 0);
  // the punch: the grommet is stamped as the tag lights (a dry clack)
  const punch = t > at + 0.18 ? Math.exp(-(t - at - 0.18) * 4) : 0;
  const lit = seg(t, at, at + 0.4);
  c.save();
  // its string from the thread
  c.globalAlpha = paper;
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9);
  c.lineWidth = lw(c, 1.3);
  c.beginPath();
  c.moveTo(T.hang.x - 3, T.hang.y);
  c.lineTo(T.eye.x, T.eye.y);
  c.lineTo(T.hang.x + 3, T.hang.y);
  c.stroke();
  c.translate(T.eye.x, T.eye.y);
  c.rotate(swing);
  const { w, h } = T;
  // the tag body: notched top corners, an eyelet at the top centre
  const body = new Path2D();
  const n = 16;
  body.moveTo(-w / 2 + n, 0);
  body.lineTo(w / 2 - n, 0);
  body.lineTo(w / 2, n);
  body.lineTo(w / 2, h);
  body.lineTo(-w / 2, h);
  body.lineTo(-w / 2, n);
  body.closePath();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.28);
  c.save();
  c.translate(3, 4);
  c.fill(body);
  c.restore();
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mixLab(mixLab('#d8bd88', env.mood.core, 0.25 + 0.25 * lit), '#ffffff', 0.08));
  g.addColorStop(1, mixLab('#cdb07a', env.mood.set, 0.15));
  c.fillStyle = g;
  c.fill(body);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.7);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(-w / 2 + n, 0);
  c.lineTo(w / 2 - n, 0);
  c.stroke();
  // the reinforced eyelet
  c.fillStyle = mixLab('#cdb07a', env.mood.set, 0.4);
  c.beginPath();
  c.arc(0, 10, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
  c.beginPath();
  c.arc(0, 10, 3, 0, Math.PI * 2);
  c.fill();
  cardProbe(c, `${ID}-tag-${which}`, -w / 2, 0, w, h, paper, ink);
  // the name (small caps) and the function name (monospace)
  textRole(c, 'subject', () => {
    const s1 = legibleSize(c, `600 21px ${FONT.sc}`, 21, name);
    c.font = `600 ${s1}px ${FONT.sc}`;
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.globalAlpha = paper * ink;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const y1 = 22 + s1 * 0.95;
    c.fillText(name, 0, y1);
    const w1 = c.measureText(name).width;
    textProbe(c, `${ID}-tag-${which}-name`, -w1 / 2, y1 - s1 * 0.75, w1, s1 * 0.85, paper * ink);
    const s2 = legibleSize(c, `500 15px ${FONT.mono}`, 15, fn);
    c.font = `500 ${s2}px ${FONT.mono}`;
    c.fillStyle = mixLab('#5a2c10', env.mood.ink, 0.2);
    const y2 = y1 + s2 * 1.55;
    c.fillText(fn, 0, y2);
    const w2 = c.measureText(fn).width;
    textProbe(c, `${ID}-tag-${which}-fn`, -w2 / 2, y2 - s2 * 0.75, w2, s2 * 0.9, paper * ink);
  });
  // the STAMPED brass grommet at the lower corner: a ring with its centre punched through
  const gx = w / 2 - 19, gy = h - 18;
  const brass = mixLab(mixLab('#b08d4a', '#8a5a1e', 0.25), env.mood.core, 0.15 + 0.4 * punch);
  c.globalAlpha = paper;
  // the ring pressed into the paper (a dark seat), the brass ring, and its stamped face
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.beginPath();
  c.arc(gx + 1, gy + 1.4, 10.5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = brass;
  c.lineWidth = Math.max(lw(c, 2), 4);
  c.beginPath();
  c.arc(gx, gy, 8.5, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = mixLab(brass, '#fff3d0', 0.12 + 0.3 * punch);
  c.beginPath();
  c.arc(gx, gy, 5.6, 0, Math.PI * 2);
  c.fill();
  // the stamp's mark on its face: a struck ring and a pip
  c.strokeStyle = withAlpha(mixLab('#3a2210', brass, 0.3), 0.85);
  c.lineWidth = Math.max(lw(c, 1), 1.1);
  c.beginPath();
  c.arc(gx, gy, 3.4, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = withAlpha(mixLab('#3a2210', brass, 0.3), 0.9);
  c.beginPath();
  c.arc(gx, gy, 1.3, 0, Math.PI * 2);
  c.fill();
  // a highlight toward the tube above
  c.strokeStyle = withAlpha(mixLab(brass, '#ffffff', 0.5), 0.8);
  c.lineWidth = Math.max(lw(c, 1), 1.2);
  c.beginPath();
  c.arc(gx, gy, 8.5, Math.PI * 1.15, Math.PI * 1.6);
  c.stroke();
  c.restore();
  if (punch > 0.02) {
    // the punch's flash at the grommet (world)
    const cs = Math.cos(swing), sn = Math.sin(swing);
    const wx = T.eye.x + gx * cs - gy * sn, wy = T.eye.y + gx * sn + gy * cs;
    brassBead(c, env, wx, wy, 0.1, punch);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(wx, wy, 0, wx, wy, 26);
    gg.addColorStop(0, withAlpha(env.mood.core, 0.5 * punch));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(wx - 26, wy - 26, 52, 52);
    c.restore();
  }
  // the later-reading caption under Sklansky's tag
  if (which === 'sk') caption(c, env, t, b, T);
}

function caption(c: C2, env: PaintEnv, t: number, b: Beats, T: typeof TAG_SK) {
  const inkAt = b.sk + 0.45;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.01) return;
  const ink = cardInkAlpha(t, inkAt);
  const text = 'a prefix network only in a later reading';
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 16px ${FONT.text}`, 16, text);
    c.save();
    c.font = `italic 500 ${size}px ${FONT.text}`;
    const tw = c.measureText(text).width;
    const w = tw + size * 1.2, h = size * 1.7;
    const x = T.eye.x - w / 2 + 4, y = T.eye.y + T.h + 14;
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(x + 2, y + 3, w, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x, y, w, h);
    c.strokeStyle = withAlpha(inkCol(env), 0.3);
    c.lineWidth = lw(c, 1);
    c.strokeRect(x, y, w, h);
    cardProbe(c, `${ID}-caption-card`, x, y, w, h, paper, ink);
    c.globalAlpha = paper * ink;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x + w / 2, y + h * 0.52);
    textProbe(c, `${ID}-caption`, x + w / 2 - tw / 2, y + h * 0.52 - size * 0.5, tw, size, paper * ink);
    c.restore();
  });
}

