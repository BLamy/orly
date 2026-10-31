/**
 * ch06-s06 — A COUNT (scene, the clock room re-lit labGreen; lampChange in from tag 7; 13.25 s).
 *   L0616 "A count. Which row is under the pointer? A loop stops at the first match. Here every row answers, and we
 *          count the yeses: three."
 *
 * The lamp changes to labGreen as the camera follows the COUNT arm out from the clockwork (off frame right, its brass
 * bar running in high along the top) to the COUNTING RAIL hanging from the arm's clamp: a tall paper rail with a value
 * scale, five brass pegs set at their row bottoms 40, 80, 80, 140, 180 (each cut with its number on a plate at the
 * rail's left: part of the object; the two 80 rows are a pair of pegs at one height), a paper flag pivoted on each
 * peg's end, and a horizontal POINTER BAR that slides down the rail to 90 (its handle plate cut 90).
 *
 * TEACHES, word by word (PT08, PT09):
 *   rail (0.30)        lamp change; the rail and its pegs; the pointer bar slides down and settles at 90 on 'pointer'
 *   loop (3.85)        a ghost paper bead runs down the rail's groove the JavaScript way, ticking past 40, 80, 80 and
 *                      STOPPING on the fourth peg, 140 ('stops'), the first row past the pointer; no caption
 *   every (7.10)       the ghost fades; ALL FIVE pegs answer at once, in one layer: the three flags of the pegs above
 *                      the pointer drop together and show 1, the two below stay up and show 0; the equation inks under
 *                      the rail: bits 1 1 1 0 0 → count 3 = findIndex, if the test flips once (the caveat clause)
 *   three (10.33)      the tally drum under the rail clicks to 3: the same index the loop found. Hold.
 */
import { Timeline } from '../../../core';
import type { Frame, PaintEnv } from '../../../film';
import { FONT, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { brassBead, brassOf, cardPaper, clamp01, clockNear, clockRoom, inkCol, lw, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { camAt, camK, counterDrum, tubeFixture, type CamKey } from '../sets/ch06-s06-kit';
import { ch06Near, windowVeil } from '../sets/ch06-s06-near';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s06';

/** the rail (L4 rest px) and its value scale: y(v) for a row bottom v (0..200) */
const RAIL = { x: 520, y0: 110, y1: 430, w: 40 };
const vy = (v: number) => RAIL.y0 + 10 + v * 1.48;
/**
 * review r1: the two 80 rows are spread 22 px apart (each with its own plate and flag beside its own row), and the
 * second carries its flag on a longer arm, so the five flags never stack in one column
 */
const PEGS = [
  { v: 40, dy: 0, arm: 0 },
  { v: 80, dy: -26, arm: 0 },
  { v: 80, dy: -4, arm: 42 },
  { v: 140, dy: 0, arm: 0 },
  { v: 180, dy: 0, arm: 0 },
];
const POINTER = 90;
const BITS = PEGS.map((p) => (p.v <= POINTER ? 1 : 0));
const COUNT = BITS.reduce<number>((a, b) => a + b, 0);
/** the first row past the pointer: where the ghost bead stops */
const FIRST = BITS.indexOf(0);
const PEG_L = 58;
const DRUM = { x: RAIL.x, y: 476 };
const EQ = { x: 786, y: 452 };
/** a flag: its stem from the hinge, its length along the stem and its width across (L4 px) */
const FLAG = { stem: 7, l: 28, w: 21 };
/** a dropped flag falls this far past upright (rad): ~100 deg, down past its own arm */
const DROP_ANG = (100 * Math.PI) / 180;
/** the reference camera for the near plane (mid-shot) */
const NEAR_CAM = camK(628, 322, 1.42);

interface Beats {
  D: number;
  rail: number;
  pointer: number;
  loop: number;
  stops: number;
  every: number;
  yeses: number;
  three: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      rail: T.beat('rail'),
      pointer: T.word('L0616', 'pointer'),
      loop: T.beat('loop'),
      stops: T.word('L0616', 'stops'),
      every: T.beat('every'),
      yeses: T.word('L0616', 'yeses'),
      three: T.beat('three'),
    };
    const keys: CamKey[] = [
      // following the arm in from the clockwork (right) to the rail
      { t: 0, cam: camK(900, 292, 1.16) },
      { t: 3.4, cam: camK(630, 318, 1.38) },
      { t: b.every - 0.3, cam: camK(628, 322, 1.42) },
      // all five answer: a small push onto the rail
      { t: b.yeses, cam: camK(634, 328, 1.46) },
      { t: b.D + 0.5, cam: camK(632, 330, 1.49) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    clockRoom(f, { key: ID, oculus: { x: 1010, y: 270, r: 300 }, lightGap: 520, sunX: 1010, sunY: 290 });
    // the tube over the rail (behind the action plane: its light before L4); review r1: the window hazed ~25 % darker
    // behind the rail and the right of frame, so the rail and its flags are the brightest values
    f.layer('L3', (c, env) => {
      windowVeil(c, env, { x: 820, y: 300, rx: 620, ry: 380, alpha: 0.3 });
      tubeFixture(c, env, 560, 70, 280);
    });
    f.practical({ x: 560, y: 74, kind: 'tube', seed: 61, intensity: 0.75, radius: 150, layer: 'L3' });
    f.layer('L4', (c, env) => {
      countArm(f, c, env, 0.3 * seg(t, 0.4, 1.4));
      rail(f, c, env);
      pointerBar(c, env, t, b);
      ghostBead(c, env, t, tq, b);
      flags(c, env, t, tq, b);
      drum(c, env, t, b);
      equation(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // review r1: a carved near plane at the lower right (the clockwork's bracket and a quarter gear) under the push
    ch06Near(f, { key: ID, side: 'right', cam: NEAR_CAM, kind: 'bracket', size: 0.9 });
    clockNear(f, { key: ID, lip: 690, post: 1500, postL: -240 });
  },
});

/** the rail, its scale, plates and pegs: static, baked */
function rail(f: Frame, c: C2, env: PaintEnv) {
  const x0 = RAIL.x - 150, y0 = RAIL.y0 - 40, w = 300, h = RAIL.y1 - RAIL.y0 + 80;
  f.cached(`${ID}/rail/${env.mood.id}`, w, h, (cc) => {
    cc.translate(-x0, -y0);
    const { x, y0: ry0, y1: ry1, w: rw } = RAIL;
    // the clamp at the top and the hanger
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(x - 4, ry0 - 36, 8, 40);
    cc.fillRect(x - rw / 2 - 6, ry0 - 6, rw + 12, 10);
    // a dark wooden channel behind the paper (it separates the rail from the window light)
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(x - rw / 2 - 6, ry0 - 2, rw + 12, ry1 - ry0 + 6);
    // the paper rail with a groove down its middle
    cc.fillStyle = withAlpha(shadowCol, 0.4);
    cc.fillRect(x - rw / 2 + 3, ry0 + 4, rw, ry1 - ry0);
    const g = cc.createLinearGradient(x - rw / 2, 0, x + rw / 2, 0);
    g.addColorStop(0, mixLab(cardPaper(env), env.mood.set, 0.25));
    g.addColorStop(0.5, cardPaper(env));
    g.addColorStop(1, mixLab(cardPaper(env), env.mood.set, 0.3));
    cc.fillStyle = g;
    cc.fillRect(x - rw / 2, ry0, rw, ry1 - ry0);
    cc.fillStyle = withAlpha(inkCol(env), 0.28);
    cc.fillRect(x - 2, ry0 + 6, 4, ry1 - ry0 - 12);
    // the value scale: a tick every 10, longer every 50
    cc.strokeStyle = withAlpha(inkCol(env), 0.45);
    for (let v = 0; v <= 200; v += 10) {
      const yy = vy(v);
      const L = v % 50 === 0 ? 9 : 5;
      cc.lineWidth = v % 50 === 0 ? 1.4 : 0.9;
      cc.beginPath();
      cc.moveTo(x - rw / 2, yy);
      cc.lineTo(x - rw / 2 + L, yy);
      cc.stroke();
    }
    // the foot
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(x - rw / 2 - 4, ry1, rw + 8, 8);
    // the pegs: brass pins through the rail, sticking out to the right; their number plates at the left
    PEGS.forEach((p) => {
      const yy = vy(p.v) + p.dy;
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.fillRect(x + rw / 2 - 2, yy - 3.2, PEG_L, 6.4);
      cc.fillStyle = brassOf(env, 0.4);
      cc.fillRect(x + rw / 2 - 2, yy - 3.2, PEG_L, 2);
      cc.beginPath();
      cc.arc(x + rw / 2 + PEG_L, yy, 4.6, 0, Math.PI * 2);
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.fill();
      cc.strokeStyle = withAlpha(brassOf(env, 0.6), 0.9);
      cc.lineWidth = 1.4;
      cc.beginPath();
      cc.arc(x + rw / 2 + PEG_L, yy, 3.4, Math.PI * 1.05, Math.PI * 1.95);
      cc.stroke();
      // a short pin out to the left, to the plate
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.fillRect(x - rw / 2 - 16, yy - 2, 16, 4);
    });
  })(c, x0, y0);
  // the number plates, one per peg at its own row (live text so the legibility floor holds under the push)
  const pairs = PEGS.map((p) => ({ v: p.v, y: vy(p.v) + p.dy }));
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 17px ${FONT.mono}`, 17, '180');
    c.font = `600 ${size}px ${FONT.mono}`;
    const pw = c.measureText('180').width + size * 0.9;
    pairs.forEach((q, qi) => {
      const label = String(q.v);
      const ph = Math.min(size * 1.3, 21);
      const px = RAIL.x - RAIL.w / 2 - 16 - pw, py = q.y - ph / 2;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.fillRect(px + 2, py + 3, pw, ph);
      c.fillStyle = cardPaper(env);
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = withAlpha(brassOf(env, 0.3), 0.8);
      c.lineWidth = lw(c, 1.4);
      c.strokeRect(px, py, pw, ph);
      c.fillStyle = inkCol(env);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, px + pw / 2, q.y + size * 0.04);
      textProbe(c, `${ID}-peg-${qi}`, px, py, pw, ph, 1);
    });
  });
}

/** the pointer bar: slides down the rail and settles at 90 on 'pointer' */
function pointerBar(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.rail + 0.3, b.pointer + 0.1);
  const settle = t > b.pointer + 0.1 ? 1.5 * Math.exp(-(t - b.pointer - 0.1) * 5) * Math.sin((t - b.pointer - 0.1) * 18) : 0;
  const y = vy(-12 + (POINTER + 12) * u) + settle;
  const x0 = RAIL.x - RAIL.w / 2 - 26, x1 = RAIL.x + 250;
  c.save();
  // the bar: a thin dark rod with a brass top edge, lying across the rail, in front of the pegs
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(x0 + 2, y + 2, x1 - x0, 5);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x0, y - 2.5, x1 - x0, 5);
  c.fillStyle = withAlpha(brassOf(env, 0.7), 0.95);
  c.fillRect(x0, y - 2.5, x1 - x0, 1.6);
  // the handle plate at its right end, cut 90
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 18px ${FONT.mono}`, 18, '90');
    const pw = size * 2.2, ph = size * 1.4;
    const px = x1, py = y - ph / 2;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.roundRect(px - 2, py - 3, pw + 6, ph + 6, 4);
    c.fill();
    c.fillStyle = brassOf(env, 0.55);
    c.fillRect(px + 1, py, pw, ph);
    c.font = `600 ${size}px ${FONT.mono}`;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(POINTER), px + 1 + pw / 2, y + size * 0.04);
    textProbe(c, `${ID}-pointer`, px, py, pw, ph, 1);
  });
  c.restore();
}

/** the JavaScript way: a ghost bead runs down the groove, ticks past each peg, and stops at the first past the pointer */
function ghostBead(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  if (tq < b.loop - 0.1) return;
  const fade = 1 - seg(t, b.every - 0.7, b.every - 0.1);
  if (fade <= 0.01) return;
  const yStop = vy(PEGS[FIRST].v) - 8;
  // the run: from the top of the rail to the stop, landing as 'stops' is said
  const u = seg(tq, b.loop - 0.05, b.stops + 0.02);
  const y = RAIL.y0 + 10 + (yStop - RAIL.y0 - 10) * (u * u * 0.4 + u * 0.6);
  const ghost = mixLab(cardPaper(env), env.mood.haze, 0.25);
  c.save();
  c.globalAlpha = 0.85 * fade;
  // the trail: faint dashes behind it
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.setLineDash([lw(c, 3), lw(c, 4)]);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(RAIL.x, RAIL.y0 + 10);
  c.lineTo(RAIL.x, y);
  c.stroke();
  c.setLineDash([]);
  // the bead: a dark see-through bead with a pale dashed ring (a ghost: the JavaScript way, not the machine's)
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
  c.beginPath();
  c.arc(RAIL.x, y, 12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.35), 0.95);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(RAIL.x, y, 12, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.setLineDash([lw(c, 4), lw(c, 3)]);
  c.lineWidth = lw(c, 1.8);
  c.beginPath();
  c.arc(RAIL.x, y, 19, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  // each peg it ticks past glints once; the stop peg holds a soft mark
  PEGS.forEach((p, i) => {
    if (i > FIRST) return;
    const py = vy(p.v) + p.dy;
    const passed = y >= py - 8;
    if (!passed) return;
    const hit = i === FIRST;
    const k = hit ? 0.9 : Math.exp(-Math.max(0, (y - py) / 30));
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.15), 0.7 * k);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.arc(RAIL.x + RAIL.w / 2 + PEG_L, py, 12, 0, Math.PI * 2);
    c.stroke();
  });
  c.restore();
}

/** the flags: one per peg; at 'every' the three above the pointer drop together (1), the two below stay up (0) */
function flags(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const drop = seg(tq, b.every, b.every + 0.22);
  const bounce = tq > b.every + 0.22 ? 0.12 * Math.exp(-(tq - b.every - 0.22) * 6) * Math.sin((tq - b.every - 0.22) * 16) : 0;
  const answer = seg(t, b.every - 0.02, b.every + 0.1);
  PEGS.forEach((p, i) => {
    const yy = vy(p.v) + p.dy;
    const px = RAIL.x + RAIL.w / 2 + PEG_L;
    const one = BITS[i] === 1;
    // angle: up = -90° (pointing up); dropped = +90° (hanging down)
    const a = one ? -Math.PI / 2 + (Math.PI + bounce) * drop : -Math.PI / 2;
    const fw = 30, fh = 34;
    const off = i === 2 ? PAIR_OFF : 0;
    c.save();
    c.translate(px + off, yy);
    if (i === 2) {
      // the second 80 peg's flag stands on a short extension (the pair reads as two pegs)
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.fillRect(-off, -2.4, off, 4.8);
      c.beginPath();
      c.arc(0, 0, 4.2, 0, Math.PI * 2);
      c.fill();
    }
    c.rotate(a + Math.PI / 2);
    // the flag: a small paper square on a wire stem from the pivot
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -12);
    c.stroke();
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(-fw / 2 + 2, -12 - fh + 2, fw, fh);
    c.fillStyle = mixLab(cardPaper(env), env.mood.core, one ? 0.25 * drop : 0);
    c.fillRect(-fw / 2, -12 - fh, fw, fh);
    c.strokeStyle = withAlpha(inkCol(env), 0.35);
    c.lineWidth = lw(c, 1);
    c.strokeRect(-fw / 2, -12 - fh, fw, fh);
    // the bit, upright whichever way the flag points
    if (answer > 0.01) {
      textRole(c, 'subject', () => {
        c.save();
        c.translate(0, -12 - fh / 2);
        c.rotate(-(a + Math.PI / 2));
        const size = legibleSize(c, `600 20px ${FONT.mono}`, 20, '1');
        c.font = `600 ${size}px ${FONT.mono}`;
        c.globalAlpha = answer;
        c.fillStyle = one ? mixLab('#7a3812', inkCol(env), 0.2) : inkCol(env);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(String(BITS[i]), 0, size * 0.04);
        textProbe(c, `${ID}-bit-${i}`, -size * 0.35, -size * 0.5, size * 0.7, size, answer);
        c.restore();
      });
    }
    c.restore();
  });
  // the one clack: a single warm flare on the three dropped flags together
  const fl = tq > b.every + 0.2 ? Math.exp(-(tq - b.every - 0.2) * 4) : 0;
  if (fl > 0.02) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    PEGS.forEach((p, i) => {
      if (!BITS[i]) return;
      const x = RAIL.x + RAIL.w / 2 + PEG_L + (i === 2 ? PAIR_OFF : 0), y = vy(p.v) + p.dy + 29;
      const g = c.createRadialGradient(x, y, 0, x, y, 34);
      g.addColorStop(0, withAlpha(env.mood.core, 0.35 * fl));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x - 34, y - 34, 68, 68);
    });
    c.restore();
  }
}

/** the tally drum under the rail: 0, then one detent click to 3 on 'three' */
function drum(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.every - 0.3, b.every + 0.3);
  if (a <= 0.01) return;
  const u = seg(t, b.three - 0.04, b.three + 0.22);
  const flash = t > b.three + 0.18 ? Math.exp(-(t - b.three - 0.18) * 3) : 0;
  // a hanger from the rail's foot
  c.save();
  c.globalAlpha = a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(RAIL.x - 3, RAIL.y1 + 6, 6, DRUM.y - RAIL.y1 - 30);
  c.restore();
  counterDrum(c, env, { x: DRUM.x, y: DRUM.y, value: COUNT * u, digits: 1, cell: 36, alpha: a, flash, id: `${ID}-drum` });
  if (flash > 0.02) brassBead(c, env, DRUM.x + 40, DRUM.y - 18, 3.2, flash);
}

/** the one equation under the rail, set across a paper slip: the bits at 'every', the rest by 'three' */
function equation(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.every + 0.35;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.01) return;
  const parts = [
    { text: 'bits 1 1 1 0 0', at: inkAt, style: 'mono' as const, row: 0 },
    { text: '→ count 3', at: b.three - 0.1, style: 'mono' as const, row: 0 },
    { text: '= findIndex,', at: b.three + 0.25, style: 'mono' as const, row: 0 },
    { text: 'if the test flips once', at: b.three + 0.55, style: 'italic' as const, row: 1 },
  ];
  textRole(c, 'subject', () => {
    const base = 19;
    const sm = legibleSize(c, `500 ${base}px ${FONT.mono}`, base, 'bits');
    const si = legibleSize(c, `italic 500 ${base + 3}px ${FONT.text}`, base + 3, 'if the test');
    const fnt = (s: 'mono' | 'italic') => (s === 'mono' ? `500 ${sm}px ${FONT.mono}` : `italic 500 ${si}px ${FONT.text}`);
    const widths = parts.map((p) => {
      c.font = fnt(p.style);
      return c.measureText(p.text).width;
    });
    c.font = fnt('mono');
    const sp = c.measureText(' ').width * 1.15;
    const W = parts.reduce((a, p, i) => a + (p.row === 0 ? widths[i] + (i ? sp : 0) : 0), 0);
    const lh = sm * 1.55;
    const h = sm * 1.2 + lh * 2;
    const x0 = EQ.x - W / 2 - sm * 0.8, y0 = EQ.y - h / 2;
    c.save();
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.4);
    c.fillRect(x0 + 3, y0 + 4, W + sm * 1.6, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x0, y0, W + sm * 1.6, h);
    c.strokeStyle = withAlpha(inkCol(env), 0.3);
    c.lineWidth = lw(c, 1.1);
    c.strokeRect(x0, y0, W + sm * 1.6, h);
    const firstInk = seg(t, inkAt, inkAt + 0.12);
    cardProbe(c, `${ID}-eq-card`, x0, y0, W + sm * 1.6, h, paper, firstInk);
    let x = EQ.x - W / 2;
    parts.forEach((p, i) => {
      const a = seg(t, p.at, p.at + 0.25);
      const yy = y0 + sm * 0.6 + lh * (p.row + 0.5);
      const xx = p.row === 0 ? x : EQ.x - W / 2;
      if (a > 0.01) {
        c.font = fnt(p.style);
        c.globalAlpha = paper * a;
        c.fillStyle = i === 1 ? mixLab('#7a3812', inkCol(env), 0.15) : inkCol(env);
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(p.text, xx, yy);
      }
      if (p.row === 0) x += widths[i] + sp;
    });
    c.restore();
  });
}

