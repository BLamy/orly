// ch05-s01 — "Some bugs only exist in time." The turn: the film's one dark register.
// Blur dissolve out of ch04's paper into the brand haze. The stack of '▶ recording' chips that ch04-s03 popped out of
// the run rows holds where ch04-s03 left it through the dissolve, still stacked, and on the first beat flattens sideways into a FRAME RIBBON (each
// chip becomes a run of white ticks on a 1100 px hairline track at 62 % height). A red-pink playhead with a rewind
// handle enters at the right end on 'Some' and runs BACKWARDS, ticks smearing as it passes and settling sharp behind
// it, reaching the left end exactly on 'time'. Above, 'Some bugs only exist' arrives word by word; on 'only' an empty
// '{   }' opens after the line with wide corner dots; 'in time' lands inside on 'in'/'time' with a red-pink sweep.
// Nothing product here.
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, blurText, easeInOut, easeOut, haze, hexA, icon, kinetic, measure } from '../../../film/promo';
import { braceBox, driftLines, recordingChip } from '../sets/brand';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** absolute film start (keeps the haze drift and hairlines continuous through ch05) */
const START = 35.7917;

// ---- the ribbon
const RX0 = 90, RX1 = 1190, RY = 446;
const TICK = 10;
const NT = Math.round((RX1 - RX0) / TICK); // 110 gaps, 111 ticks
const NCHIPS = 9;
const SEG = (RX1 - RX0) / NCHIPS;
// ---- the stack, exactly where ch04-s03 leaves it (its tightened right-hand column: x 950 + w/2, rows 388 + (i − 4) × 33;
// the top chip carries the green ✓, the ninth is red-pink), so the blur dissolve holds it in place while the world turns
// plum; then it flattens into the ribbon
const CHIP_K = 1.15;
const STACK_LEFT = 950, STACK_MID = 388, STACK_STEP = 33;
// ---- type
const SIZE = 64, TY = 310; // baseline; the line's optical centre sits at 40 % (≈ 288)

type Sc = {
  tl: Timeline;
  chips: number;
  rewind: number;
  arrive: number;
  words: { text: string; at: number }[];
  braces: number;
  inAt: number;
  timeAt: number;
  dur: number;
};

/** playhead x at t: enters at the right end on 'rewind', runs back, brakes into the left end exactly on 'time' */
function playhead(t: number, sc: Sc) {
  const u = clamp((t - sc.rewind - 0.08) / (sc.arrive - sc.rewind - 0.08));
  // accelerate, then brake into the stop
  const p = easeInOut(u);
  return { x: lerp(RX1, RX0, p), v: Math.abs(dEase(u)) * (RX1 - RX0) / (sc.arrive - sc.rewind - 0.08), u };
}
function dEase(u: number) {
  // derivative of easeInOut (cubic)
  return u < 0.5 ? 12 * u * u : 3 * Math.pow(-2 * u + 2, 2);
}

export default defineShot({
  id: 'ch05-s01',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const L = 'L0501';
    const sc: Sc = {
      tl,
      chips: T.beat('chips'),
      rewind: T.beat('rewind'),
      arrive: T.word(L, 'time'),
      words: [
        { text: 'Some', at: T.word(L, 'Some') - 0.1 },
        { text: 'bugs', at: T.word(L, 'bugs') - 0.1 },
        { text: 'only', at: T.word(L, 'only') - 0.1 },
        { text: 'exist', at: T.word(L, 'exist') - 0.1 },
      ],
      braces: T.beat('braces'),
      inAt: T.word(L, 'in') - 0.08,
      timeAt: T.word(L, 'time') - 0.05,
      dur: T.duration,
    };
    return sc;
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = '#24102b';
    c.fillRect(0, 0, 1280, 720);
    haze(c, { t: t + START, preset: 'brand', u: 1 });
    driftLines(c, t + START, { n: 5, alpha: 0.12, speed: 0.8, seed: 5, y0: 40, y1: 690 });

    // ------------------------------------------------ the ribbon (track + ticks), built as the chips flatten
    const ph = playhead(t, sc);
    const phOn = clamp((t - sc.rewind) / 0.18);
    const segLand = (i: number) => clamp((t - sc.chips - 0.03 * i - 0.18) / 0.32);
    // track: grows out from the stack as the chips deal out
    const trackU = easeOut(clamp((t - sc.chips) / 0.5));
    if (trackU > 0) {
      c.save();
      c.fillStyle = 'rgba(255,255,255,.30)';
      c.fillRect(RX0, RY - 0.5, (RX1 - RX0) * trackU, 1);
      // the rewound stretch behind the playhead, faintly red-pink
      if (phOn > 0 && ph.x < RX1) {
        c.fillStyle = hexA(PROMO.brand, 0.75 * phOn);
        c.fillRect(ph.x, RY - 1, RX1 - ph.x, 2);
      }
      c.restore();
    }
    // ticks: each chip's segment rises into ticks as the chip lands; ticks smear just behind the moving playhead
    const smear = Math.max(0, ph.v * 0.07);
    for (let k = 0; k <= NT; k++) {
      const x = RX0 + k * TICK;
      const seg = Math.min(NCHIPS - 1, Math.floor((x - RX0) / SEG));
      const lu = easeOut(segLand(seg));
      if (lu <= 0) continue;
      const major = k % 5 === 0;
      const h = (major ? 22 : 13) * lu;
      let w = 1.3;
      let a = (major ? 0.85 : 0.55) * lu;
      let dx = 0;
      if (phOn > 0 && ph.u > 0 && ph.u < 1 && smear > 1) {
        const d = x - ph.x; // > 0: already passed (the playhead moves left)
        if (d > -6 && d < smear) {
          const q = 1 - clamp(d / smear);
          w = 1.3 + q * Math.min(26, smear * 0.35);
          a *= 0.45 + 0.25 * (1 - q);
          dx = -q * 4;
        }
      }
      c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      c.fillRect(x - 0.65 + dx, RY - h / 2, w, h);
    }

    // ------------------------------------------------ the chip stack: holds through the dissolve, then flattens
    const chipW = (measure(c, '▶ recording', 12, 600, true) + 22) * CHIP_K;
    for (let i = 0; i < NCHIPS; i++) {
      const sx = STACK_LEFT + chipW / 2;
      const sy = STACK_MID + (i - 4) * STACK_STEP;
      const fu = clamp((t - sc.chips - 0.03 * i) / 0.42);
      const fe = easeInOut(fu);
      const tx = RX0 + (i + 0.5) * SEG;
      const x = lerp(sx, tx, fe);
      const y = lerp(sy, RY, fe) - Math.sin(Math.PI * fe) * 18;
      if (fu < 0.62) {
        // still a chip: squashing flat as it flies (width toward its segment, height toward a hairline)
        const sq = clamp(fu / 0.62);
        c.save();
        c.translate(x, y);
        c.scale(lerp(1, 1.25, sq), lerp(1, 0.25, sq * sq));
        recordingChip(c, { x: 0, y: 0, scale: CHIP_K, dark: true, tint: i === NCHIPS - 1 ? 1 : 0, check: i === 0 ? 1 - sq : 0, u: 1, blur: sq * 3 });
        c.restore();
      } else {
        // a bright hairline segment that hands over to the ticks
        const hu = clamp((fu - 0.62) / 0.38);
        const w = lerp(118, SEG * 0.96, hu);
        c.save();
        c.globalAlpha = (1 - hu) * 0.9;
        c.fillStyle = i === NCHIPS - 1 ? PROMO.brand : '#ffffff';
        c.fillRect(x - w / 2, y - lerp(4, 1, hu), w, lerp(8, 2, hu));
        c.restore();
      }
    }

    // ------------------------------------------------ the playhead (the rewind scrubber)
    if (phOn > 0) {
      const x = ph.x + (1 - easeOut(phOn)) * 40;
      c.save();
      c.globalAlpha = easeOut(phOn);
      // soft glow
      const g = c.createRadialGradient(x, RY, 0, x, RY, 70);
      g.addColorStop(0, hexA(PROMO.brand, 0.35));
      g.addColorStop(1, hexA(PROMO.brand, 0));
      c.fillStyle = g;
      c.fillRect(x - 70, RY - 70, 140, 140);
      c.fillStyle = PROMO.brand;
      c.fillRect(x - 1, RY - 34, 2, 68);
      // handle with the rewind glyph
      c.beginPath();
      c.roundRect(x - 17, RY - 60, 34, 24, 7);
      c.fill();
      icon(c, 'rewind', x, RY - 48, 22, '#ffffff', false);
      c.restore();
    }

    // ------------------------------------------------ type: 'Some bugs only exist { in time }'
    const W1 = measure(c, 'Some bugs only exist', SIZE, 300);
    const sp = measure(c, ' ', SIZE, 300);
    const Wi = measure(c, 'in time', SIZE, 300);
    const brW = measure(c, '{', SIZE, 300);
    const pad = SIZE * 0.3;
    const total = W1 + sp * 1.4 + brW + pad + Wi + pad + brW;
    const x0 = 640 - total / 2;
    kinetic(c, { words: sc.words, t, x: x0, y: TY, size: SIZE, weight: 300, color: '#ffffff' });
    const ix0 = x0 + W1 + sp * 1.4 + brW + pad;
    const ix1 = ix0 + Wi;
    braceBox(c, { x0: ix0, x1: ix1, y: TY - SIZE * 0.34, size: SIZE, u: clamp((t - sc.braces) / 0.5), color: '#ffffff', pad, dots: true });
    // 'in time' inside the braces, the red-pink sweep running across it on 'time'
    const k = easeInOut(clamp((t - sc.timeAt) / 0.45));
    const grad = c.createLinearGradient(ix0, 0, ix1, 0);
    const a0 = clamp(1 - 1.25 * k);
    grad.addColorStop(0, k > 0.8 ? '#ff9db3' : '#ffffff');
    grad.addColorStop(a0, '#ffffff');
    grad.addColorStop(clamp(a0 + 0.3), '#ff9db3');
    grad.addColorStop(1, k > 0 ? PROMO.brand : '#ffffff');
    const inW = measure(c, 'in ', SIZE, 300);
    blurText(c, 'in', ix0, TY, { size: SIZE, weight: 300, u: clamp((t - sc.inAt) / 0.36), color: k > 0 ? grad : '#ffffff' });
    blurText(c, 'time', ix0 + inW, TY, { size: SIZE, weight: 300, u: clamp((t - sc.timeAt) / 0.36), color: k > 0 ? grad : '#ffffff' });
  },
});
