/**
 * ch10-s05 — one word-slip turns into numbers and grows three cards on three knobs: a lantern (question), a mirror
 * (label) and a sealed note (message); the messenger tunes the knobs; every slip in the row carries the same three
 * (serverCyan; 16.7 s; cut in, close on the slip 'bank' in the hall).
 *
 *   'numbers'    the slip's lettering dissolves into a short column of inked numerals (illustrative values: a word
 *                is a list of numbers to the machine), then settles back
 *   'question'   the slip grows a small paper lantern whose beam shines outward, looking  → QUESTION · Q
 *   'label'      a hand mirror with a tag                                                  → LABEL · K
 *   'message'    a sealed paper note                                                       → MESSAGE · V
 *   'tuned'      a small brass knob (the 1958 knob, an adjustable weight) on each of the three cords, each turned
 *                to its own setting
 *   'messenger'  ch05's messenger bead (a ringed bead of light) runs left → right across the three knobs in 0.6 s
 *                and each knob's pointer turns 20° as it passes (the cards are made from the word by learned
 *                weights, tuned by back-propagation)
 *   allCards     the close-up holds until the bead has passed the last knob, then a 2 s pull back to the whole row:
 *                crossed · the · river · bank each carry lantern, mirror and note; a 0.3 s hold on the wide; the one caption has built up beneath them
 */
import { Timeline } from '../../../core';
import { LAYERS, MOODS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { HALL, type HallCam, type SlipScreen, drawSlipAt, hallArch, hallSlip, slipAt } from '../sets/ch10-s01-hall';
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
/** the three cords fan from the slip's foot to three hanging points; a knob sits on each cord */
const FAN = [-70, 0, 70];
const HANG_Y = 300;
const KNOB_U = 0.6; // knob position along the cord (slip foot → hanging point)
const KNOB_R = 16.8;
const OBJ_S = 1.12;
const BEAD_RUN = 0.6;
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

const kz = (k: number) => 1000 - 1000 / k;
/** the pull back (sine in-out, so it neither whips off nor lands hard) */
const pullAt = (p: { pull0: number; pull1: number }, t: number) => {
  const u = clamp01((t - p.pull0) / (p.pull1 - p.pull0));
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};
const frameOn = (x: number, y: number, k: number): Camera3 => ({ x, y, z: kz(k), lens: 1 });
// (framed so 'bank' sits about a third down with the space beneath kept for its cards, and 'river' wholly out of
// frame at the left rather than cropped by the edge)
const CLOSE0 = frameOn(1258, 294, 1.72);
const CLOSE1 = frameOn(1256, 296, 1.82);
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
/** the near slip (L5, rest coords): close enough to the lens to sit just outside the close-up's top-right corner */
const NEAR = { x: 1850, y: -60, w: 120, h: 236 };
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
function foot(i: number) {
  return { x: ROW_X[i], y: SLIP.top + SLIP.h + 6 };
}
function hangPt(i: number, k: number) {
  return { x: ROW_X[i] + FAN[k], y: HANG_Y };
}
function knobPt(i: number, k: number) {
  const a = foot(i), b = hangPt(i, k);
  return { x: lerp(a.x, b.x, KNOB_U), y: lerp(a.y, b.y, KNOB_U) };
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
      bead0: T.word(L, 'messenger') + 0.02,
      // the close-up holds until the bead has left the last knob (+0.2 s), so 'tuned by back-propagation' is seen;
      // then the pull back fills the rest, and the wide holds 0.3 s before the cut
      pull0: Math.min(T.word(L, 'messenger') + 0.02 + BEAD_RUN * 1.25 + 0.2, T.duration - 2.0),
      pull1: T.duration - 0.3,
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
    const kc = lerp(1.78, 1.9, push);
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

        // 'bank' becomes numbers on 'numbers', then settles back
        const nk = isBank ? sm((t - (p.numbers - 0.1)) / 0.35) * (1 - sm((t - (p.numbers + 1.75)) / 0.45)) : 0;
        const swing = Math.sin(tq * 0.8 + i * 1.3) * 0.008;
        drawSlipAt(c, env, S, i + 1, { own: 0.45, word: WORDS[i], text: 1 - nk, cup: false, swing });
        if (nk > 0.01) {
          c.save();
          c.translate(S.x, S.y);
          c.rotate(swing);
          // set at the legibility floor for the close-up it is seen in (6 rows fit the slip at the floor)
          const ns = Math.max(15, legibleSize(c, `500 10px ${FONT.mono}`, 1));
          c.font = `500 ${ns}px ${FONT.mono}`;
          c.textAlign = 'center';
          c.textBaseline = 'alphabetic';
          const pitch = Math.min(21, (SLIP.h - 18) / NUMS.length);
          NUMS.forEach((n, r) => {
            const a = clamp01(nk * 1.6 - r * 0.12);
            c.fillStyle = withAlpha(ink, 0.9 * a);
            c.fillText(n, 0, 17 + pitch * 0.5 + r * pitch + ns * 0.34);
          });
          c.restore();
        }

        // the three cords, knobs and cards
        const grow = isBank
          ? [sm((tq - (p.q - 0.32)) / 0.4), sm((tq - (p.k - 0.32)) / 0.4), sm((tq - (p.v - 0.32)) / 0.4)]
          : [othersGrow(i), othersGrow(i + 0.4), othersGrow(i + 0.8)];
        // (bank's knobs are fully grown ON 'tuned': in from 'tuned' − 0.25 over 0.25 s)
        const knobG = isBank ? sm((tq - (p.tuned - 0.25)) / 0.25) : othersGrow(i + 1);
        const F = foot(i);
        for (let k = 0; k < 3; k++) {
          if (grow[k] <= 0.01) continue;
          const H = hangPt(i, k);
          // the cord from the slip's foot to the hanging point (drawn as the card grows)
          c.strokeStyle = ink;
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(F.x, F.y);
          c.lineTo(lerp(F.x, H.x, grow[k]), lerp(F.y, H.y, grow[k]));
          c.stroke();
          if (grow[k] < 0.6) continue;
          const gg = sm((grow[k] - 0.6) / 0.4);
          // (the other words' lanterns burn at about 70%, so bank stays the subject in the wide)
          if (k === 0) queryLantern(c, env, H.x, H.y, OBJ_S, { grow: gg, lit: isBank ? 1 : 0.7, beam: isBank ? 1 : 0.45, beamAngle: -2.55 });
          if (k === 1) keyMirror(c, env, H.x, H.y, OBJ_S, { grow: gg, sheen: isBank ? sm((t - p.k) / 0.6) * (1 - 0.5 * sm((t - p.k - 1.2) / 0.8)) : 0.3 });
          if (k === 2) valueNote(c, env, H.x, H.y, OBJ_S, { grow: gg });
        }
        // the knobs, one per cord, each at its own setting; the messenger turns each a hair as it passes
        if (knobG > 0.01) {
          for (let k = 0; k < 3; k++) {
            const K = knobPt(i, k);
            // the bead reaches knob k at bead0 + (k+1)/4 of its 0.6 s run; the pointer turns 20° (on twos)
            const passAt = p.bead0 + ((k + 1) / 4) * BEAD_RUN;
            const turned = isBank ? sm((tq - (passAt - 0.04)) / 0.12) : 1;
            const ang = -Math.PI / 2 + SETTING[i][k] + 0.35 * turned;
            const glint = isBank ? Math.exp(-Math.pow((t - passAt) / 0.18, 2)) : 0;
            brassKnob(c, env, K.x, K.y, KNOB_R, ang, { grow: knobG, glint });
          }
        }
      }

      // the messenger: from the left of the slip's foot, along the three knobs, and away
      const mu = (t - p.bead0) / BEAD_RUN;
      if (mu > -0.25 && mu < 1.25) {
        const pts = [{ x: ROW_X[3] - 110, y: knobPt(3, 0).y - 4 }, knobPt(3, 0), knobPt(3, 1), knobPt(3, 2), { x: ROW_X[3] + 120, y: knobPt(3, 2).y - 6 }];
        const segU = clamp01(mu) * (pts.length - 1);
        const si = Math.min(pts.length - 2, Math.floor(segU));
        const su = segU - si;
        const a = pts[si], b = pts[si + 1];
        const x = lerp(a.x, b.x, su), y = lerp(a.y, b.y, su) - Math.sin(su * Math.PI) * 9;
        const k = sm((mu + 0.25) / 0.25) * (1 - sm((mu - 1) / 0.25));
        // its ring of light, then the bead
        const op = c.globalCompositeOperation;
        c.globalCompositeOperation = 'lighter';
        const rg = c.createRadialGradient(x, y, 3, x, y, 26);
        rg.addColorStop(0, withAlpha(env.mood.core, 0.55 * k));
        rg.addColorStop(0.5, withAlpha(env.mood.halo, 0.2 * k));
        rg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = rg;
        c.fillRect(x - 26, y - 26, 52, 52);
        c.globalCompositeOperation = op;
        messengerBead(c, env, x, y, 5.5, k);
      }
    });
    f.rim({ x: 0, y: -1 });

    // the near plane (L5): a slip of the next row hanging close to the lens at frame right, out of focus, its back
    // to us (no lettering), with its two threads up. In the close-up its corner is a dark soft edge in the top
    // right corner; the push slides it out past the frame edge far faster than the row (three planes: hall, row, this).
    f.layer('L5', (c, env) => {
      const m = env.mood;
      const nx = NEAR.x, ny = NEAR.y, w = NEAR.w, h = NEAR.h;
      c.fillStyle = mixLab(m.fg, m.set, 0.12);
      c.fillRect(nx - w * 0.3 - 1.5, -900, 3, ny + 900);
      c.fillRect(nx + w * 0.3 - 1.5, -900, 3, ny + 900);
      c.beginPath();
      c.moveTo(nx - w / 2, ny);
      c.lineTo(nx + w / 2, ny);
      c.lineTo(nx + w / 2 + 2, ny + h * 0.5);
      c.lineTo(nx + w / 2, ny + h);
      for (let k = 1; k < 6; k++) c.lineTo(nx + w / 2 - (w * k) / 6, ny + h + (k % 2 ? 2.5 : -1.5));
      c.lineTo(nx - w / 2, ny + h);
      c.closePath();
      c.fill();
      // the glow behind it catches its left edge (the lit slips of the row are to its left)
      c.fillStyle = withAlpha(m.rim, 0.35);
      c.fillRect(nx - w / 2, ny, 2.2, h);
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
