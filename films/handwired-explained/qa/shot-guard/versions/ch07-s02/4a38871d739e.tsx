/**
 * ch07-s02 — ONE VALVE, BY HAND (plate, dawnGold; crossfade in from the unfrozen knob; 41.9 s). Deep Dive III's first
 * machine: one ReGLU unit, y = 3w · max(0, g + b), worked forward then backward, every number computed in FP32 from
 * w 0.5, g 0.25, b −0.1 (derived from the runtime's backward rule; labelled so). Shares sets/ch07-s02-valve with s03.
 *   L0703 "Take one gated product: a valve. Along its channel flows an input, three, times a weight, w. The opening is
 *          g plus b, never below nought."
 *   L0704 "With w a half, g a quarter, b minus a tenth: it opens nought point one five, and out comes nought point two
 *          two five."
 *   L0704a "Learning needs each number's slope, or gradient: nudge it, and how far does the output move?"
 *   L0705 "Backwards, w's slope is three times the opening: nought point four five. g's is the channel itself: one and
 *          a half."
 *
 * TEACHES, word by word:
 *   0–3        the valve stands as a black silhouette against the dawn window (the room still warm from s01)
 *   'valve'    the parchment fades in behind it and it inks onto the plate; y = 3w · max(0, g + b) inks top left
 *   'flows'    light pours from the inlet past the w collar and runs along the trough, 3w deep, to the shut gate
 *   'three'    the inlet's tag reads 3; 'w' the collar's mark × w
 *   'opening'  the cam slides: the wheel climbs the hinge and the paper gate lifts (the ruler's pointer reads g + b);
 *   'never below nought'  the cam slides back past the corner: the pointer drops below zero, the gate stays shut
 *   'half' · 'quarter' · 'tenth'  one detent click per dial; each tag reads its value; g lifts the gate, b lowers it
 *   'opens'    the gate stops at 0.15 on its ruler (read off it)
 *   'comes'    the outflow runs to the tray and fills it to 0.225; '1.5 × 0.15 = 0.225' inks beneath
 *   'nudge'    the w dial twitches a hair: the light deepens and the tray's level twitches with it, then both settle
 *   'Backwards' a lantern glow runs back from the tray, under the open gate; 'three' it reaches the w dial: 0.45;
 *   'channel'  a second branch runs down the rod and the cam to g: 1.5; b's dial glows with the same 1.5
 *   the bottom line inks term by term with the narration: ∂y/∂w = 3 × 0.15 = 0.45 · ∂y/∂g = 3w = 1.5 (derived)
 * Camera: a slight pull back as the plate inks, still through the arithmetic, a gentle push (about 6 %) through the
 * backward pass; s03 opens on exactly this framing.
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { cam3Interp, defineShot } from '../../../film';
import {
  V_COPPER, VALVE_CAM_END, VALVE_INK, VG, drawValve, valveBackward, valveForward, valveNear, valveRoom, vfmt, vInk, vInkSegs,
} from '../sets/ch07-s02-valve';

const ID = 'ch07-s02';
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lin = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
/** a detent click: a quick snap to the new value with a tiny overshoot, on twos */
const detent = (t: number, at: number, from: number, to: number, dur = 0.25) => {
  const u = clamp01((q2(t) - at) / dur);
  const e = u < 1 ? 1 - Math.pow(1 - u, 3) * Math.cos(u * 5) : 1;
  return from + (to - from) * e;
};
const kickAt = (t: number, at: number) => (t >= at ? Math.exp(-(t - at) * 7) * Math.sin((t - at) * 26) : 0);

/** the end framing (shared with ch07-s03's opening) */
const S02_END: Camera3 = { ...VALVE_CAM_END };
const START: Camera3 = { x: 640, y: 376, z: 46, lens: 1 };
const REST: Camera3 = { x: 640, y: 366, z: 0, lens: 1 };

// the worked example's values (FP32)
const W0 = 0.5, G0 = 0.25, B0 = -0.1, WN = 0.52;
const FWD = valveForward(W0, G0, B0);
const BWD = valveBackward(W0, G0, B0);

interface Beats {
  D: number;
  valve: number;
  flow: number;
  three: number;
  w: number;
  opening: number;
  never: number;
  half: number;
  quarter: number;
  tenth: number;
  open: number;
  out: number;
  noughtOut: number;
  nudge: number;
  back: number;
  ws: number;
  slopeW: number;
  nought45: number;
  gs: number;
  slopeG: number;
  one: number;
  halfEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      valve: T.beat('valve'),
      flow: T.beat('flow'),
      three: T.word('L0703', 'three'),
      w: T.word('L0703', 'w'),
      opening: T.beat('opening'),
      never: T.word('L0703', 'never'),
      half: T.beat('dials'),
      quarter: T.word('L0704', 'quarter'),
      tenth: T.word('L0704', 'tenth'),
      open: T.beat('open'),
      out: T.beat('out'),
      noughtOut: T.word('L0704', 'nought#2'),
      nudge: T.beat('nudge'),
      back: T.beat('back'),
      ws: T.word('L0705', "w's"),
      slopeW: T.beat('slopeW'),
      nought45: T.word('L0705', 'nought'),
      gs: T.word('L0705', "g's"),
      slopeG: T.beat('slopeG'),
      one: T.word('L0705', 'one'),
      halfEnd: T.word('L0705', -1),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);

    // ---- camera: a slight pull back as the plate inks, still, then a gentle push through the backward pass
    let cam: Camera3;
    if (t < b.back - 0.4) cam = cam3Interp(START, REST)(win(t, 0, b.valve + 2.2));
    else cam = cam3Interp(REST, S02_END)(win(t, b.back - 0.4, b.D + 0.2));
    f.camera(cam);

    // ---- state
    const paper = win(t, b.valve - 0.25, b.valve + 1.15);
    // the cam's slide: rest at 0; on 'opening' it climbs to 0.3; on 'never below nought' it slides past the corner to
    // −0.2 (the pointer drops below zero, the gate stays shut); back to 0; then the dials set g and b
    let s = 0;
    s += 0.3 * win(tq, b.opening - 0.1, b.opening + 1.3);
    s -= 0.5 * win(tq, b.never - 0.15, b.never + 1.0);
    s += 0.2 * win(tq, b.never + 1.35, b.never + 1.9);
    const g = detent(t, b.quarter - 0.05, 0, G0, 0.3);
    // b turns from the 'tenth' click and the gate settles exactly on 'opens'
    const bv = B0 * win(tq, b.tenth - 0.05, b.open);
    const sv = s + g + bv;
    // the nudge: w twitches a hair (0.5 → 0.52) and settles
    const wv = W0 + (WN - W0) * (win(tq, b.nudge - 0.05, b.nudge + 0.4) - win(tq, b.nudge + 1.2, b.nudge + 1.8));
    const wKick = kickAt(t, b.half - 0.05) * 0.35;
    const up = win(t, b.flow - 0.1, b.flow + 1.7);
    const down = lin(t, b.open + 0.05, b.open + 1.4);
    const fill = win(t, b.open + 1.2, b.out + 0.1);
    // backward: the glow runs tray → gate, then the two branches
    const back = lin(t, b.back - 0.05, b.ws + 0.35);
    const armW = lin(t, b.ws + 0.35, b.slopeW);
    const armG = lin(t, b.gs - 0.1, b.slopeG);
    const bGlow = win(t, b.slopeG + 0.1, b.slopeG + 0.6);

    valveRoom(f, { key: ID, paper });

    f.layer(VALVE_INK, (c, env) => {
      drawValve(c, env, {
        paper,
        w: wv,
        g,
        b: bv,
        s: sv,
        up,
        down,
        fill,
        tags: { w: win(t, b.half - 0.05, b.half + 0.25), g: win(t, b.quarter - 0.05, b.quarter + 0.25), b: win(t, b.tenth - 0.05, b.tenth + 0.25) },
        tagVals: { w: wv > 0.512 ? WN : W0, g: G0, b: B0 },
        kick: { w: wKick, g: kickAt(t, b.quarter) * 0.3, b: kickAt(t, b.open) * 0.3 },
        inTag: win(t, b.three - 0.2, b.three + 0.15),
        collarTag: win(t, b.w - 0.2, b.w + 0.15),
        read: win(t, b.open, b.open + 0.3),
        back,
        armW,
        armG,
        bGlow,
        slopes: {
          w: win(t, b.slopeW + 0.05, b.slopeW + 0.35),
          g: win(t, b.slopeG + 0.1, b.slopeG + 0.4),
          b: win(t, b.slopeG + 0.6, b.slopeG + 1.0) * 0.85,
          vals: BWD,
        },
        tq,
        id: ID,
      });

      // ---- lettering on the plate
      const P = paper;
      // the unit's formula, top left, on 'valve'
      vInk(c, 'y = 3w · max(0, g + b)', 176, 170, { size: 34, font: 'italic', weight: 500, alpha: P * win(t, b.valve + 0.2, b.valve + 0.7), id: `${ID}-eq1` });
      // the product under the tray, on 'comes' … 'two two five'
      const p1 = win(t, b.out - 0.1, b.out + 0.2);
      const p2 = win(t, b.noughtOut - 0.05, b.noughtOut + 0.25);
      vInkSegs(c, [
        { text: `${vfmt(FWD.channel)} × ${vfmt(FWD.opening)}`, a: p1 },
        { text: ` = ${vfmt(FWD.y)}`, a: p2, color: V_COPPER },
      ], VG.tray.x, VG.tray.bot + 42, { size: 26, font: 'serif', weight: 600, align: 'center', id: `${ID}-prod` });
      // the nudged level, while the tray twitches (the slope, measured)
      const nu = win(t, b.nudge + 0.3, b.nudge + 0.55) * (1 - win(t, b.nudge + 1.3, b.nudge + 1.7));
      if (nu > 0.003) {
        const yN = valveForward(wv, G0, B0).y;
        vInk(c, `→ ${vfmt(yN)}`, VG.tray.x + 44, VG.tray.bot - yN * VG.lift + 8, { size: 22, font: 'mono', alpha: nu * 0.9, color: V_COPPER, id: `${ID}-nudge` });
      }
      // the backward line, term by term with the narration, along the bottom of the plate
      vInkSegs(c, [
        { text: '∂y/∂w = ', a: win(t, b.ws - 0.1, b.ws + 0.2) },
        { text: `3 × ${vfmt(FWD.opening)}`, a: win(t, b.slopeW - 0.05, b.slopeW + 0.25) },
        { text: ` = ${vfmt(BWD.dw)}`, a: win(t, b.nought45 - 0.05, b.nought45 + 0.25), color: V_COPPER },
        { text: '   ·   ∂y/∂g = ', a: win(t, b.gs - 0.1, b.gs + 0.2) },
        { text: '3w', a: win(t, b.slopeG - 0.05, b.slopeG + 0.25) },
        { text: ` = ${vfmt(BWD.dg)}`, a: win(t, b.one - 0.05, b.one + 0.25), color: V_COPPER },
        { text: '  (derived)', a: 0.75 * win(t, b.halfEnd, b.halfEnd + 0.35) },
      ], 640, 628, { size: 25, font: 'mono', weight: 500, align: 'center', id: `${ID}-eq2` });
    });

    valveNear(f, ID);
  },
});
