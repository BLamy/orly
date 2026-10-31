/**
 * ch10-s05 — one word-slip turns into numbers and grows three cards on three knobs: a lantern (question), a mirror
 * (label) and a sealed note (message); the messenger tunes the knobs; every slip in the row carries the same three
 * (serverCyan; 16.7 s; cut in, close on the slip 'bank' in the hall).
 *
 *   'numbers'    the slip's lettering dissolves into a column of six inked numerals (illustrative values: a word
 *                is a list of numbers to the machine); the column then slides out from behind the slip on its own
 *                paper strip and STAYS, hung beside the word, while 'bank' re-inks (round-2 review)
 *   'question'   a thin thread runs from the number strip to the first knob of a small brass knob bank, a light runs
 *                down it, and the knob's card grows: a small paper lantern whose beam shines outward → QUESTION · Q
 *   'label'      the same numbers, a second thread, the second knob (set differently): a hand mirror  → LABEL · K
 *   'message'    the same numbers, a third thread, the third knob: a sealed paper note                 → MESSAGE · V
 *                (so each card visibly comes from the same numbers, turned by a different knob)
 *   'tuned'      (critic round 1) the three knobs (the 1958 knob, an adjustable weight) visibly TURN: all three
 *                pointers swing together through ~40° and settle at new settings over 0.5 s (on twos), with a 0.4 s
 *                glint at 0.8
 *   'messenger'  ch05's messenger bead (a ringed bead of light, twice the old size, with a soft trail) runs left →
 *                right across the three knobs in 1.1 s from 'by our', and each knob's pointer turns 20° as it passes
 *                (the cards are made from the word by learned weights, tuned by back-propagation)
 *   allCards     the pull back starts as the bead leaves the last knob and lands at ~15.6, so the whole row holds
 *                > 1 s on the wide: crossed · the · river · bank each carry lantern, mirror and note; bank's number
 *                strip slides back into its slip during the pull (it would squeeze into an unreadable stack)
 *   composition  bank's group sits ~8% right of the old framing, and a blurred near slip (another word, its own
 *                lantern glowing beneath it) crosses the right edge on L5: a third plane, and a preview that every
 *                slip carries the three cards
 */
import { Timeline } from '../../../core';
import { LAYERS, MOODS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { HALL, type HallCam, type SlipScreen, drawSlipAt, hallArch, hallSlip, slipAt, slipPaper } from '../sets/ch10-s01-hall';
import { CARD_DROP, brassKnob, keyMirror, messengerBead, queryLantern, valueNote } from '../sets/ch10-s05-cards';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s05';
const L = 'L1010';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const smq = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const tq12 = (t: number) => Math.floor(t * 12 + 1e-9) / 12;

// ------------------------------------------------------------------------------------------------ the row (L4 world)
const WORDS = ['crossed', 'the', 'river', 'bank'];
const ROW_X = [170, 510, 850, 1190];
const SLIP = { top: 140, w: 74, h: 140 };
const BEAM_Y = 112;
const KNOB_R = 15.5;
const OBJ_S = 1.12;
const BEAD_RUN = 1.1;
const BEAM_L = { id: 'beam10s05', z: 1000, haze: 0.06, blur: 1.6 };
/** illustrative knob settings (radians from 'up'), one per card per word */
const SETTING = [
  [-0.9, 0.5, 1.6],
  [0.3, -1.4, 0.9],
  [1.2, -0.2, -1.0],
  [-0.4, 1.1, 0.2],
];
/** the numerals the word 'bank' becomes (illustrative, not a real embedding) */
const NUMS = ['0.21', '−1.30', '0.84', '0.07', '−0.56', '1.12'];

/** bank's number strip (the word as numbers), hung beside the slip once it slides out */
const COL = { x: 1298, top: 146, w: 62, h: 116 };
/** the knob bank (a brass rail with three knobs) and the cards' hanging points beneath it */
const KB_Y = 297;
const CARD_Y = 305;
const KSP = 80;
const BANK_CX = (1190 + COL.x) / 2;
const knobX = (i: number, k: number) => (i === 3 ? BANK_CX : ROW_X[i]) + (k - 1) * KSP;
/** where a word's threads start: bank's from its number strip, the others' from the slip's foot */
let RETRACT = 0; // (set per frame: bank's strip slides back into the slip on the pull back; its threads follow)
const feedPt = (i: number) =>
  i === 3
    ? { x: lerp(COL.x, ROW_X[3], RETRACT), y: lerp(COL.top + COL.h + 3, SLIP.top + SLIP.h + 6, RETRACT) }
    : { x: ROW_X[i], y: SLIP.top + SLIP.h + 6 };
/** a point along thread k of word i: u 0..1 = feed → knob (a gentle sag), u 1..2 = knob → card */
function threadAt(i: number, k: number, u: number): { x: number; y: number } {
  const a = feedPt(i), kx = knobX(i, k);
  if (u <= 1) {
    const cx = (a.x + kx) / 2, cy = KB_Y + 4;
    const v = 1 - u;
    return { x: v * v * a.x + 2 * v * u * cx + u * u * kx, y: v * v * a.y + 2 * v * u * cy + u * u * KB_Y };
  }
  return { x: kx, y: lerp(KB_Y, CARD_Y, u - 1) };
}

const kz = (k: number) => 1000 - 1000 / k;
/** the pull back (sine in-out, so it neither whips off nor lands hard) */
const pullAt = (p: { pull0: number; pull1: number }, t: number) => {
  const u = clamp01((t - p.pull0) / (p.pull1 - p.pull0));
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};
const frameOn = (x: number, y: number, k: number): Camera3 => ({ x, y, z: kz(k), lens: 1 });
// (framed so 'bank' sits about a third down with the space beneath kept for its cards, and 'river' wholly out of
// frame at the left rather than cropped by the edge)
// (round-2 review: framed a little lower, so bank's knob bank and its three cards clear the caption band)
// (critic round 1: bank's group framed further right, so the near slip at the right edge balances it; 'river' then
// sits WHOLLY inside the left of frame, never cropped by the edge, through the push)
const CLOSE0 = frameOn(1150, 314, 1.68);
const CLOSE1 = frameOn(1146, 318, 1.76);
const WIDE = frameOn(680, 274, 0.86);

/** the background hall, seen from where this row hangs (baked, blurred, in L2) */
/** cameras sampled along the whole move (the pull interpolates x/y linearly and k in log: its middle frames see
 *  outside the end frames' union), so the baked hall covers every frame */
const PATH_CAMS: Camera3[] = (() => {
  const kOf = (cm: Camera3) => 1000 / (1000 - cm.z);
  const out: Camera3[] = [];
  for (let n = 0; n <= 16; n++) {
    const u = n / 16;
    for (const C0 of [CLOSE0, { ...CLOSE1, z: kz(1.9) }]) {
      const kk = Math.exp(lerp(Math.log(kOf(C0)), Math.log(kOf(WIDE)), u));
      out.push({ x: lerp(C0.x, WIDE.x, u), y: lerp(C0.y, WIDE.y, u), z: kz(kk), lens: 1 });
    }
  }
  return out;
})();
/** the near slip (L5 world): another word's slip close to the lens, crossing the close-up's right edge (screen
 *  x ≈ 1130 → 1220 over the push) and sliding out of frame on the pull back */
const NEAR = { x: 1618, y: 138, w: 76, h: 152, word: 'water' };
const NEAR_L = { id: 'near10s05', z: 650, haze: 0, blur: 12 };
/** the knobs' new settings after 'tuned' (radians added to SETTING; they swing through +0.7 ≈ 40° first) */
const TUNE_TO = [0.42, 0.24, 0.52];
const HCAM: HallCam = { x: HALL.beamX + 70 + 930, y: 178, z: slipAt(2).z - 40 - 940 };

interface Plan {
  numbers: number;
  q: number;
  k: number;
  v: number;
  tuned: number;
  mess: number;
  all: number;
  /** the bead's run along the knobs (0.6 s) */
  bead0: number;
  pull0: number;
  pull1: number;
  D: number;
}

function slipGeo(i: number): SlipScreen {
  return { x: ROW_X[i], y: SLIP.top, w: SLIP.w, h: SLIP.h, s: 1, vz: 500, wick: { x: ROW_X[i], y: SLIP.top + SLIP.h }, beam: { x: ROW_X[i], y: BEAM_Y } };
}
function knobPt(i: number, k: number) {
  return { x: knobX(i, k), y: KB_Y };
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const plan: Plan = {
      numbers: T.word(L, 'numbers'),
      q: T.word(L, 'question'),
      k: T.word(L, 'label'),
      v: T.word(L, 'message'),
      tuned: T.word(L, 'tuned'),
      mess: T.beat('messengerTunes'),
      all: T.beat('allCards'),
      // (critic round 1) the bead runs 1.1 s from 'by our', crossing the knobs through 'messenger'
      bead0: T.word(L, 'by') + 0.1,
      // the pull back starts as the bead leaves the last knob and lands ~1.07 s before the cut, so the wide holds
      pull0: Math.min(T.word(L, 'by') + 0.1 + BEAD_RUN * 0.78, T.duration - 2.6),
      pull1: T.duration - 1.07,
      D: T.duration,
    };
    return { tl, plan };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const p = scene.plan as Plan;

    // camera: a slow push on the slip while it grows its cards, then the pull back to the whole row
    const push = smq(t / p.pull0);
    const pull = pullAt(p, t);
    RETRACT = sm((pull - 0.05) / 0.5);
    const kc = lerp(1.68, 1.76, push);
    const C0: Camera3 = { x: lerp(CLOSE0.x, CLOSE1.x, push), y: lerp(CLOSE0.y, CLOSE1.y, push), z: kz(kc), lens: 1 };
    const kOf = (cm: Camera3) => 1000 / (1000 - cm.z);
    const kk = Math.exp(lerp(Math.log(kOf(C0)), Math.log(kOf(WIDE)), pull));
    const cam: Camera3 = { x: lerp(C0.x, WIDE.x, pull), y: lerp(C0.y, WIDE.y, pull), z: kz(kk), lens: 1 };
    f.camera(cam);
    f.backlight({ sunX: 900, intensity: 0.7 });

    // the hall behind, out of focus: arch + its far, softly lit slips
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, PATH_CAMS, 90);
      f.cached(`${ID}/hall/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        hallArch(cc, HCAM, env, {});
        for (let i = HALL.N - 1; i >= 0; i--) hallSlip(cc, HCAM, env, i, { own: 0.55, cup: false, text: 0.4 });
        cc.fillStyle = withAlpha(env.mood.fg, 0.3);
        cc.fillRect(r.x, r.y, r.w, r.h);
      }, { blur: 7 })(c, r.x, r.y);
    });
    // fog sheets that run off the bottom of the frame (the presets end in a visible edge across the floor)
    f.fog({ yCenter: 470, height: 520, alpha: 0.3, drift: 6 });
    f.fog({ yCenter: 600, height: 300, alpha: 0.12, drift: 10 });

    // the beam the row hangs from and its hangers: in the slips' plane but softened (a touch of depth blur and haze,
    // no hard rim line), so on the pull back it is a quiet band, never a hard rule across the top of frame
    f.layer(BEAM_L, (c, env) => {
      const m = env.mood;
      c.fillStyle = mixLab(mixLab(m.fg, m.set, 0.35), m.haze, 0.12);
      c.fillRect(-400, BEAM_Y - 12, 2200, 13);
      c.fillStyle = withAlpha(m.rim, 0.12);
      c.fillRect(-400, BEAM_Y - 12, 2200, 1);
      const hg = c.createLinearGradient(0, -300, 0, BEAM_Y);
      hg.addColorStop(0, withAlpha(mixLab(m.fg, m.set, 0.35), 0));
      hg.addColorStop(1, mixLab(mixLab(m.fg, m.set, 0.35), m.haze, 0.12));
      c.fillStyle = hg;
      for (const hx of [-120, 340, 680, 1020, 1360]) c.fillRect(hx - 2, -300, 4, BEAM_Y - 12 + 300);
    });

    f.layer('L4', (c, env) => {
      const m = env.mood;
      const ink = mixLab(m.ink, m.set, 0.12);
      const brass = mixLab(mixLab(m.rim, '#b8925a', 0.6), m.ink, 0.25);

      // ---- bank's numbers: on 'numbers' the lettering dissolves into six numerals; then the column slides out from
      // behind the slip on its own strip (on twos) and stays there, while 'bank' re-inks
      const nIn = sm((t - (p.numbers - 0.1)) / 0.35);
      const slideOut = sm((tq - (p.numbers + 0.6)) / 0.6);
      const onSlip = nIn * (1 - slideOut);
      // on the pull back the strip slides back into its slip (in the wide its numerals would be an unreadable stack)
      const retract = sm((pull - 0.05) / 0.5);
      const slide = slideOut * (1 - retract);
      const ns = Math.max(15, legibleSize(c, `500 10px ${FONT.mono}`, 1));
      const pitch = Math.min(20, (COL.h - 16) / NUMS.length);
      const numerals = (x: number, top: number, a: number, swing: number) => {
        if (a <= 0.01) return;
        c.save();
        c.translate(x, top);
        c.rotate(swing);
        c.font = `500 ${ns}px ${FONT.mono}`;
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        NUMS.forEach((n, r) => {
          const ra = clamp01(a * 1.6 - r * 0.12);
          c.fillStyle = withAlpha(ink, 0.92 * ra);
          c.fillText(n, 0, 9 + pitch * 0.5 + r * pitch + ns * 0.34);
        });
        c.restore();
      };
      if (slide > 0.001) {
        // the strip: drawn before the slip, so it emerges from behind it
        const sx = lerp(ROW_X[3], COL.x, slide);
        const sw = Math.sin(tq * 0.8 + 2.2) * 0.008;
        c.save();
        c.translate(sx, COL.top);
        c.rotate(sw);
        c.strokeStyle = ink;
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(-COL.w * 0.3, 0);
        c.lineTo(-COL.w * 0.27, BEAM_Y - COL.top);
        c.moveTo(COL.w * 0.3, 0);
        c.lineTo(COL.w * 0.27, BEAM_Y - COL.top);
        c.stroke();
        c.fillStyle = mixLab(slipPaper(m, 0, 0.42), '#ffffff', 0.12);
        c.beginPath();
        c.moveTo(-COL.w / 2, 0);
        c.lineTo(COL.w / 2, 0);
        c.lineTo(COL.w / 2 + 1, COL.h * 0.5);
        c.lineTo(COL.w / 2, COL.h);
        for (let k = 1; k < 6; k++) c.lineTo(COL.w / 2 - (COL.w * k) / 6, COL.h + (k % 2 ? 2 : -1.2));
        c.lineTo(-COL.w / 2, COL.h);
        c.closePath();
        c.fill();
        c.fillStyle = withAlpha(m.fg, 0.18);
        c.fillRect(-COL.w / 2, 0, COL.w, 3);
        c.restore();
        numerals(sx, COL.top, slide * (1 - retract), sw);
      }

      const othersGrow = (k: number) => sm((tq - (p.pull0 - 0.35 + k * 0.08)) / 0.4);
      for (let i = 0; i < 4; i++) {
        const isBank = i === 3;
        const S = slipGeo(i);
        // threads to the beam
        c.strokeStyle = ink;
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(S.x - S.w * 0.3, S.y);
        c.lineTo(S.x - S.w * 0.27, BEAM_Y);
        c.moveTo(S.x + S.w * 0.3, S.y);
        c.lineTo(S.x + S.w * 0.27, BEAM_Y);
        c.stroke();
        // the soft glow the slips kept from the web (ch10-s04)
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(S.x, S.y + S.h / 2, 0, S.x, S.y + S.h / 2, 120);
        g.addColorStop(0, withAlpha(m.core, 0.16));
        g.addColorStop(1, withAlpha(m.halo, 0));
        c.fillStyle = g;
        c.fillRect(S.x - 120, S.y + S.h / 2 - 120, 240, 240);
        c.globalCompositeOperation = op;

        const swing = Math.sin(tq * 0.8 + i * 1.3) * 0.008;
        const nk = isBank ? onSlip : 0;
        drawSlipAt(c, env, S, i + 1, { own: 0.45, word: WORDS[i], text: 1 - nk, cup: false, swing });
        if (isBank) numerals(S.x, S.y, onSlip, swing);

        // each card is made from the numbers through its own knob: thread feed → knob, then a short cord to the card
        // (bank: on its word; the others: as the camera pulls back)
        const at = isBank ? [p.q, p.k, p.v] : [0, 0, 0];
        const draw = isBank ? at.map((a) => sm((tq - (a - 0.75)) / 0.3)) : [othersGrow(i), othersGrow(i + 0.4), othersGrow(i + 0.8)];
        const knobG = isBank ? at.map((a) => sm((tq - (a - 0.5)) / 0.22)) : [othersGrow(i + 0.2), othersGrow(i + 0.6), othersGrow(i + 1)];
        const grow = isBank ? at.map((a) => sm((tq - (a - 0.42)) / 0.38)) : [othersGrow(i + 0.3), othersGrow(i + 0.7), othersGrow(i + 1.1)];
        // the knob bank's rail, as soon as its first knob arrives
        const railA = Math.max(...knobG);
        if (railA > 0.01) {
          const x0 = knobX(i, 0) - 22, x1 = knobX(i, 2) + 22;
          c.save();
          c.globalAlpha *= railA;
          c.fillStyle = mixLab(brass, m.fg, 0.35);
          c.fillRect(x0, KB_Y - 2.5, x1 - x0, 5);
          c.fillStyle = withAlpha(m.rim, 0.35);
          c.fillRect(x0, KB_Y - 2.5, x1 - x0, 1);
          c.restore();
        }
        for (let k = 0; k < 3; k++) {
          if (draw[k] <= 0.01) continue;
          // the thread (feed → knob), drawn as it runs out
          c.strokeStyle = ink;
          c.lineWidth = 1.15;
          c.beginPath();
          const n = 14;
          const a0 = threadAt(i, k, 0);
          c.moveTo(a0.x, a0.y);
          for (let q = 1; q <= n; q++) {
            const pt = threadAt(i, k, (q / n) * draw[k]);
            c.lineTo(pt.x, pt.y);
          }
          // and the short cord from the knob to its card
          if (grow[k] > 0.01) {
            const k1 = threadAt(i, k, 1), k2 = threadAt(i, k, 1 + grow[k]);
            c.moveTo(k1.x, k1.y);
            c.lineTo(k2.x, k2.y);
          }
          c.stroke();
          // bank: a bead of light runs down the thread from the numbers, through the knob, into the card
          if (isBank) {
            const u = (t - (at[k] - 0.75)) / 0.6;
            if (u > 0 && u < 1.25) {
              const pt = threadAt(i, k, Math.min(2, u * 2));
              const fade = 1 - sm((u - 0.95) / 0.3);
              const op2 = c.globalCompositeOperation;
              c.globalCompositeOperation = 'lighter';
              const lg = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 16);
              lg.addColorStop(0, withAlpha(m.core, 0.75 * fade));
              lg.addColorStop(1, withAlpha(m.halo, 0));
              c.fillStyle = lg;
              c.fillRect(pt.x - 16, pt.y - 16, 32, 32);
              c.globalCompositeOperation = op2;
            }
          }
          if (grow[k] < 0.6) continue;
          const gg = sm((grow[k] - 0.6) / 0.4);
          const H = { x: knobX(i, k), y: CARD_Y };
          // (the other words' lanterns burn at about 70%, so bank stays the subject in the wide)
          if (k === 0) queryLantern(c, env, H.x, H.y, OBJ_S, { grow: gg, lit: isBank ? 1 : 0.7, beam: isBank ? 1 : 0.45, beamAngle: -2.55 });
          if (k === 1) keyMirror(c, env, H.x, H.y, OBJ_S, { grow: gg, sheen: isBank ? sm((t - p.k) / 0.6) * (1 - 0.5 * sm((t - p.k - 1.2) / 0.8)) : 0.3 });
          if (k === 2) valueNote(c, env, H.x, H.y, OBJ_S, { grow: gg });
        }
        // the knobs, each at its own setting from the start; on 'tuned' all three glint together; the messenger
        // then turns each a hair as it passes
        for (let k = 0; k < 3; k++) {
          if (knobG[k] <= 0.01) continue;
          const K = knobPt(i, k);
          // the bead reaches knob k at bead0 + (k+1)/4 of its 0.6 s run; the pointer turns 20° (on twos)
          const passAt = p.bead0 + ((k + 1) / 4) * BEAD_RUN;
          const turned = isBank ? sm((tq - (passAt - 0.04)) / 0.12) : 1;
          // 'tuned': all three pointers swing together through ~40° and settle at new settings over 0.5 s, on twos
          const tu = (tq - (p.tuned - 0.05)) / 0.5;
          const tuneD = tu <= 0 ? 0 : tu < 0.45 ? 0.7 * sm(tu / 0.45) : lerp(0.7, TUNE_TO[k], sm((tu - 0.45) / 0.55));
          const ang = -Math.PI / 2 + SETTING[i][k] + (isBank ? tuneD : TUNE_TO[k]) + 0.35 * turned;
          const tunedGlint = isBank ? 0.8 * sm((t - (p.tuned - 0.05)) / 0.08) * (1 - sm((t - (p.tuned + 0.27)) / 0.1)) : 0;
          const glint = isBank ? Math.max(Math.exp(-Math.pow((t - passAt) / 0.18, 2)), tunedGlint) : 0;
          brassKnob(c, env, K.x, K.y, KNOB_R, ang, { grow: knobG[k], glint });
        }
      }

      // the messenger: from the left of the knob bank, along the three knobs, and away
      // (critic round 1: a 1.1 s run, the bead and its ring twice the size, and a soft trail)
      const mu = (t - p.bead0) / BEAD_RUN;
      if (mu > -0.25 && mu < 1.25) {
        const pts = [{ x: knobX(3, 0) - 90, y: KB_Y - 4 }, knobPt(3, 0), knobPt(3, 1), knobPt(3, 2), { x: knobX(3, 2) + 90, y: KB_Y - 6 }];
        const posAt = (u: number) => {
          const segU = clamp01(u) * (pts.length - 1);
          const si = Math.min(pts.length - 2, Math.floor(segU));
          const su = segU - si;
          const a = pts[si], b = pts[si + 1];
          return { x: lerp(a.x, b.x, su), y: lerp(a.y, b.y, su) - 20 - Math.sin(su * Math.PI) * 12 };
        };
        const { x, y } = posAt(mu);
        const k = sm((mu + 0.25) / 0.25) * (1 - sm((mu - 1) / 0.25));
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        // the trail: soft fading light along the path behind it
        for (let j = 1; j <= 9; j++) {
          const uj = mu - j * 0.03;
          if (uj < 0) break;
          const q = posAt(uj);
          const a = 0.32 * k * (1 - j / 10);
          const r = 22 * (1 - j / 14);
          const tg = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
          tg.addColorStop(0, withAlpha(env.mood.core, a));
          tg.addColorStop(1, withAlpha(env.mood.halo, 0));
          c.fillStyle = tg;
          c.fillRect(q.x - r, q.y - r, 2 * r, 2 * r);
        }
        // its ring of light, then the bead
        const rg = c.createRadialGradient(x, y, 5, x, y, 52);
        rg.addColorStop(0, withAlpha(env.mood.core, 0.6 * k));
        rg.addColorStop(0.5, withAlpha(env.mood.halo, 0.22 * k));
        rg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = rg;
        c.fillRect(x - 52, y - 52, 104, 104);
        c.globalCompositeOperation = op;
        messengerBead(c, env, x, y, 11, k);
      }
    });
    f.rim({ x: 0, y: -1 });

    // the near plane: another word's slip close to the lens, crossing the close-up's right edge, out of focus (a
    // softer blur than L5's default), its lettering legible as a shape, its own lantern glowing under it (every slip
    // carries the three cards). The push slides it outward; the pull back carries it out of frame long before the wide.
    f.layer(NEAR_L, (c, env) => {
      const m = env.mood;
      const nx = NEAR.x, ny = NEAR.y, w = NEAR.w, h = NEAR.h;
      const S: SlipScreen = { x: nx, y: ny, w, h, s: w / HALL.slipW, vz: 500, wick: { x: nx, y: ny + h }, beam: { x: nx, y: ny - 40 } };
      drawSlipAt(c, env, S, 9, { own: 0.04, dim: 0.35, word: NEAR.word, text: 0.6, cup: false, swing: Math.sin(tq * 0.8 + 4.1) * 0.01 });
      // threads up to its beam (out of frame)
      c.strokeStyle = mixLab(m.fg, m.set, 0.2);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(nx - w * 0.3, ny);
      c.lineTo(nx - w * 0.28, ny - 200);
      c.moveTo(nx + w * 0.3, ny);
      c.lineTo(nx + w * 0.28, ny - 200);
      c.stroke();
      // its lantern's glow beneath (just the light: the card itself is below the frame)
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      const gy = ny + h + 46;
      const g = c.createRadialGradient(nx - 10, gy, 0, nx - 10, gy, 40);
      g.addColorStop(0, withAlpha(m.core, 0.3));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(nx - 50, gy - 40, 80, 80);
      c.globalCompositeOperation = op;
    });

    // the caption: builds as each card is named; screen-locked beneath the cards
    const parts = [
      { w: 'question', l: 'Q', at: p.q },
      { w: 'label', l: 'K', at: p.k },
      { w: 'message', l: 'V', at: p.v },
    ];
    const c = f.c;
    c.save();
    // (baseline just above the bottom 12% band, clear of the mirror's foot in the lower close-up framing)
    const y = 626;
    const size = 32;
    const wordFont = `500 ${size}px ${FONT.sc}`;
    const letFont = `600 ${size - 2}px ${FONT.mono}`;
    c.font = wordFont;
    const segW = parts.map((pt) => {
      c.font = wordFont;
      const a = c.measureText(pt.w + ' · ').width;
      c.font = letFont;
      return a + c.measureText(pt.l).width;
    });
    const gap = 50;
    const total = segW.reduce((a, b) => a + b, 0) + gap * 2;
    // a soft plate for legibility
    const plateA = sm((t - p.q + 0.1) / 0.4);
    if (plateA > 0) {
      const g = c.createRadialGradient(640, y - 9, 10, 640, y - 9, total * 0.7);
      g.addColorStop(0, withAlpha(f.mood.ink, 0.45 * plateA));
      g.addColorStop(1, withAlpha(f.mood.ink, 0));
      c.save();
      c.translate(640, y - 9);
      c.scale(1, 0.16);
      c.translate(-640, -(y - 9));
      c.fillStyle = g;
      c.fillRect(640 - total, y - 9 - total, total * 2, total * 2);
      c.restore();
    }
    let x = 640 - total / 2;
    const txt = mixLab('#efe3cf', f.mood.core, 0.2);
    parts.forEach((pt, i) => {
      const a = sm((t - (pt.at - 0.05)) / 0.4);
      c.globalAlpha = a;
      c.fillStyle = txt;
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      c.font = wordFont;
      const ww = c.measureText(pt.w + ' · ').width;
      c.fillText(pt.w + ' · ', x, y + (1 - a) * 4);
      c.font = letFont;
      c.fillStyle = f.mood.core;
      c.fillText(pt.l, x + ww, y + (1 - a) * 4);
      x += segW[i] + gap;
    });
    c.restore();
    void MOODS;
    void CARD_DROP;
  },
});
