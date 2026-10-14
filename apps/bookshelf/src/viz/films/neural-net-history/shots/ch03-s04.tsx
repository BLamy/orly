/**
 * ch03-s04 — Buffalo, 1958–60, night: the Mark I, the film's first great machine image (labGreen, cut).
 *
 * PART A — the hardware. A dolly left → right along the installation (three parallax planes: the lab's back
 * wall with dark windows and hanging tubes (L2), a fog sheet, the rows of association racks (L3), the Mark I
 * on the action plane (L4), the card easel and a cable in front (L5)), naming each part as the camera reaches it:
 *   'Buffalo' (stamp)    BUFFALO · 1958–60 types on, bottom left; Rosenblatt at the eye, setting a card
 *   'eye' (eye)          the photocell eye: 20 × 20 cells light from inside with the card it sees (no label)
 *   'wires' (wires)      the MARK I cabinet, doors open: its lit panel swells behind the harp of random cords
 *   'knobs' (knobs)      the PERCEPTRON rack of motor-driven knobs; the camera settles and the machine is handed
 *                        to the teaching machine (perceptronRetina reveal 0 → 1): the physical rack dissolves into
 *                        its knob grid in place (same x), the eye into the retina, the response unit into the dial.
 *
 * PART B — the teaching machine (perceptronRetina, its REAL training record: horizontal vs vertical bars, the
 * perceptron rule applied only on mistakes).
 *   'Each knob'          the camera eases close on ONE knob and its single loom string to the response dial; the
 *                        rest of the machine falls into shadow
 *   'strongly'           that knob turns a notch: its string thickens (it counts more)
 *   'counts'             it turns back: the string thins
 *   'weight' (weight)    the label sets beside it: knob = weight: how strongly one wire counts
 *   'wrong' (wrong)      presentation 2 (a vertical bar) lands; the lit cells fire their A-units; the dial swings
 *                        the WRONG way (Σ = +3: "horizontal"); the camera pulls back to the whole machine
 *   'turned' (turn)      ONLY the lit knobs rotate, each by its real Δw; their strings re-tension (warm +, cool −);
 *                        the caption 'illustration: the perceptron rule, run for real' sets; then training runs at
 *                        speed (presentations 3 → 94, the tally readout counting, mistakes thinning to 0);
 *                        Rosenblatt settles in at the frame's left edge (L5, near the lens) during the run
 *   'hear' (hear)        the picture holds on presentation 95 (a rare late mistake) and only the motors move: its lit
 *                        knobs turn slowly, each with a faint spinning whirr (the score's whirr); the readouts recede
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, PERCEPTRON_RUN, PUPPET_NEAR_BLACK, toLayer, legibleSize, POSES, blendPose, defineShot, labWall, makeCanvas, mixLab, overscan, perceptronRetina, pose, softPlate, thread, weightColor, withAlpha, withLife } from '../../../film';
import type { Camera3, PaintEnv, Pose } from '../../../film';
import { cast } from '../cast';
import { caseStamp } from '../sets/ch01-s06-stamp';
import { EYE, MARK, eyeCell, loomRun, markEye, markPatch, markRack, markResponse } from '../sets/ch03-s04-markI';
import { bake, clamp01, lerp, linear, mixCam, monotone, sm, tq12, win, h01 } from '../sets/ch03-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch03-s04';
const FLOOR = MARK.floor;
const RUN = PERCEPTRON_RUN;
const N_A = 64;
const W_MAX = (() => {
  let m = 1;
  for (const s of RUN.steps) for (let i = 0; i < N_A; i++) m = Math.max(m, Math.abs(s.wAfter[i]));
  return m;
})();

// ------------------------------------------------------------------------------------- the teaching machine
/** perceptronRetina's box in L4 world: at the SETTLE camera it fills the frame (its knob grid sits where the
 *  physical rack stood) */
const SETTLE: Camera3 = { x: 860, y: 352, z: 0, lens: 1 };
const BOX = { x: SETTLE.x - 640, y: -16, w: 1280, h: 636 };
const PR_FLOOR = 566;
// the kit's geometry (perceptronRetina.geo at s = 1)
const KNOB = (i: number) => ({ x: BOX.x + 528 + (i % 8) * 41, y: BOX.y + 196 + Math.floor(i / 8) * 41 });
const KR = 14.5;
const DIAL = { x: BOX.x + 1062, y: BOX.y + 372, r: 158 };
/** the response lantern hanging from the dial's bracket (perceptronRetina: dial.x + 0.78 R, dial.y + 0.95 R) */
const LANTERN = { x: DIAL.x + DIAL.r * 0.78, y: DIAL.y + DIAL.r * 0.95 };
const STRING_END = { x: DIAL.x - DIAL.r * 0.92, y: DIAL.y - DIAL.r * 0.15 };
/** the one knob the camera visits (row 3, column 3: a knob whose A-unit fires on the first card) */
const DEMO = 27;
const DK = KNOB(DEMO);
const CLOSE_S = 1.55;
// round 1: the push centres on the knob itself (its screen x drifts ~90 px over the 1.7 s push), so the move from
// the wide to the close is one continuous, slow push, the action plane well under 6% of frame width per second
const CLOSE: Camera3 = { x: 924, y: 330, z: 1000 - 1000 / CLOSE_S, lens: 1 };

// ------------------------------------------------------------------------------------- the hardware
/** a step nearer the eye than the first cut, and the truck starts further left, so the date stamp (bottom left)
 *  never sits over him */
const ROS_X = 244;
const ROS_SET: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: 4, neck: 8, head: -2, shoulderF: 58, elbowF: 40, wristF: -12, shoulderB: -6, elbowB: 18 }, { handF: 'pinch' });
const ROS_BACK: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 8, head: -4, shoulderF: 8, elbowF: 22, wristF: 6, shoulderB: -9, elbowB: 12 });
/** 'You could hear it learn': Rosenblatt at the left edge, near the lens, head tilted to listen */
const ROS_LISTEN: Pose = pose({ hipF: 4, kneeF: -3, hipB: -4, kneeB: -1, torso: 5, neck: 10, head: 14, shoulderF: -4, elbowF: 26, wristF: 4, shoulderB: -10, elbowB: 18 });
/** the presentation held for 'hear it learn': the first mistake after a clean run (index 94, presentation 95) */
const HOLD = (() => {
  for (let i = 80; i < RUN.steps.length; i++) if (RUN.steps[i].error && RUN.steps[i].recentErrors <= 1) return i;
  return 16;
})();
/** the match-dissolve: each part of the teaching machine starts ON its hardware (centre, scale) and grows to its
 *  place in the diagram. Regions are x bands of the diagram (L4 world). */
const PARTS = [
  { x0: -1e4, x1: BOX.x + 451, dg: { x: BOX.x + 64 + 155, y: BOX.y + 180 + 155 }, hw: { x: MARK.eye, y: EYE.headY }, s: (EYE.cell * 20) / 310 },
  { x0: BOX.x + 451, x1: BOX.x + 860, dg: { x: BOX.x + 528 + 143.5, y: BOX.y + 196 + 143.5 }, hw: { x: MARK.rack, y: MARK.floor - MARK.cabH + 74 + 108 }, s: (MARK.rackW - 68) / 287 },
  { x0: BOX.x + 860, x1: 1e4, dg: { x: BOX.x + 1062, y: BOX.y + 372 }, hw: { x: MARK.resp, y: MARK.floor - 250 - 30 }, s: 56 / 158 },
];
/** the kit's own label rows (L4 world y): headers above the parts, the verdict below the stands */
const LABEL_TOP = 146;
const LABEL_BOT = 590;
/** the card the eye sees during part A: a horizontal bar (the training task's first class) */
const SEEN = RUN.steps[0].img.px;

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b = {
      D,
      stamp: T.beat('stamp'),
      eye: T.beat('eye'),
      wires: T.beat('wires'),
      knobs: T.beat('knobs'),
      each: T.word('L0307', 'Each'),
      strongly: T.word('L0307', 'strongly'),
      counts: T.word('L0307', 'counts'),
      weight: T.beat('weight'),
      wrong: T.beat('wrong'),
      turn: T.beat('turn'),
      hear: T.beat('hear'),
      ros: T.word('L0307', 'Rosenblatt'),
    };
    // ---- camera: part A as one continuous truck (monotone through the named parts), then settle / close / back
    // round 1: the truck favours each part as it is named: the eye at frame centre by 'eye', the MARK I harp
    // centred on 'wires', the knob rack on 'knobs'
    const ax = monotone([
      [0, 236],
      [b.eye - 0.1, MARK.eye],
      [b.wires, MARK.patch - 14],
      [b.knobs, 836],
      [b.knobs + 0.9, SETTLE.x],
    ]);
    const az = monotone([
      [0, 70],
      [b.eye, 118],
      [b.wires, 104],
      [b.knobs, 86],
      [b.knobs + 1.05, 0],
    ]);
    // close on one knob for 'strongly' / 'counts'; pulled all the way back BEFORE 'wrong', so retina, bar and
    // dial are all in frame when the needle swings the wrong way
    // one continuous push from the settle into the knob (~1.7 s), no hold between them
    const closeAt = b.knobs + 1.05;
    const closeIn = closeAt + 1.7;
    const backAt = b.wrong - 0.85;
    const backIn = b.wrong - 0.12;
    const cam = (t: number): Camera3 => {
      if (t < closeAt) return { x: ax(t), y: t < b.knobs ? 346 : lerp(346, SETTLE.y, win(t, b.knobs, b.knobs + 1.05)), z: az(t), lens: 1 };
      if (t < backAt) return mixCam(SETTLE, CLOSE, sm((t - closeAt) / (closeIn - closeAt)));
      // pull back to the whole machine, then a very slow push through the training and the hold
      const S2: Camera3 = { ...SETTLE, z: lerp(0, 34, win(t, backIn, D)) };
      return mixCam(CLOSE, S2, sm((t - backAt) / (backIn - backAt)));
    };
    // ---- the training record: presentation index (fractional = phase within a presentation; see perceptronRetina)
    const s0 = 1; // presentation 2 (index 1): a vertical bar, Σ = +3, called "horizontal": wrong
    // after the lesson, the REAL record runs at speed (dozens of presentations a second) and slows as it
    // learns: through the stretch where the last-20 count falls to 0 (presentations 89-94) at a readable pace,
    // into presentation 95, a rare late mistake, held for 'hear it learn' while only its lit knobs turn
    const step = linear([
      [b.wrong - 0.95, s0 + 0.0],
      [b.wrong + 0.1, s0 + 0.62],
      [b.turn - 0.2, s0 + 0.665],
      [b.turn + 0.45, s0 + 0.97],
      [b.turn + 0.5, s0 + 1.0],
      [b.turn + 1.45, 42],
      [b.hear - 1.05, 88],
      [b.hear - 0.2, HOLD + 0.62],
      [b.hear + 0.3, HOLD + 0.665],
      [b.hear + 2.0, HOLD + 0.94],
    ]);
    tl.hold(0, D);
    return { tl, b, cam, step, closeAt, closeIn, backAt, backIn };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b;
    const cam = scene.cam(t);
    f.camera(cam);
    // hardware → teaching machine: the hardware fades quickly while the teaching machine assembles in place
    // (perceptronRetina's staged reveal: stands and plate, wires, knobs, strings, dial)
    // on 'knobs' the rack lifts (+0.4 for ~0.8 s); then the hardware dissolves while each part of the teaching
    // machine assembles ON its hardware and grows into the diagram (a match-dissolve)
    const hl = win(t, b.knobs - 0.2, b.knobs + 0.1) * (1 - win(t, b.knobs + 0.55, b.knobs + 0.95));
    const hand = win(t, b.knobs + 0.15, b.knobs + 1.0);
    const phys = 1 - win(t, b.knobs + 0.25, b.knobs + 0.95);
    const mig = win(t, b.knobs + 0.45, b.knobs + 1.25);
    const close0 = t < scene.backAt ? win(t, scene.closeAt, scene.closeIn) : 1 - win(t, scene.backAt, scene.backIn);
    const labelA = win(t, b.knobs + 1.25, b.knobs + 1.6) * (1 - close0);
    const close = t < scene.backAt ? win(t, scene.closeAt, scene.closeIn) : 1 - win(t, scene.backAt, scene.backIn);
    f.backlight({ sunX: 700, sunY: 330, sunRadius: 720, intensity: 0.52 - 0.12 * hand });
    const CAMS: Camera3[] = [
      { x: 200, y: 346, z: 70, lens: 1 },
      { x: 470, y: 346, z: 118, lens: 1 },
      { x: 836, y: 346, z: 86, lens: 1 },
      SETTLE,
      CLOSE,
    ];

    // ------------------------------------------------------------------ L2: the lab at night (window holes, tubes)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 80);
      bake(f, c, `${ID}/L2/${env.mood.id}`, r, (cc) => {
        labWall(cc, { x: r.x, y: r.y, w: r.w, h: r.h, windows: [80, 420, 760, 1100, 1440, 1780], winW: 230, winTop: 120, winH: 300, blinds: 0.55, tileTop: 470, tubes: [250, 590, 930, 1270, 1610], tubeY: 36 }, env);
      });
    });
    f.fog({ yCenter: 0.6 * 720, height: 0.42 * 720, alpha: 0.28 + 0.06 * hand, drift: 6 });

    // ------------------------------------------------------------------ L3: rows of association racks (no knobs)
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, CAMS, 60);
      bake(f, c, `${ID}/L3/${env.mood.id}`, r, (cc) => {
        const ink = env.fill('ink');
        for (let x = Math.floor(r.x / 150) * 150; x < r.x + r.w; x += 150) {
          if (h01(x, 3) < 0.18) continue; // an aisle here and there
          const h = 300 + 20 * h01(x, 5);
          cc.fillStyle = ink;
          cc.fillRect(x, 596 - h, 128, h);
          // cords draped between rack tops, and a vent band (cut-lines)
          cc.strokeStyle = ink;
          cc.lineWidth = 1.6;
          cc.beginPath();
          cc.moveTo(x + 120, 596 - h + 6);
          cc.quadraticCurveTo(x + 140, 596 - h + 40, x + 158, 596 - h + 8);
          cc.stroke();
          cc.strokeStyle = withAlpha(env.mood.rim, 0.1);
          cc.lineWidth = 1;
          for (let k = 0; k < 5; k++) {
            cc.beginPath();
            cc.moveTo(x + 12, 596 - h + 20 + k * 6);
            cc.lineTo(x + 116, 596 - h + 20 + k * 6);
            cc.stroke();
          }
        }
      });
    });
    f.fog({ yCenter: 0.7 * 720, height: 0.26 * 720, alpha: 0.12 + 0.16 * hand, drift: 9 });

    // ------------------------------------------------------------------ L4: the Mark I → the teaching machine
    const st = scene.step(t);
    const k = Math.max(0, Math.min(RUN.steps.length - 1, Math.floor(st)));
    const u = st - k;
    const S = RUN.steps[k];
    const turnU = S.error ? sm(clamp01((u - 0.68) / 0.24)) : 0;
    const eyeLit = win(t, b.eye - 0.25, b.eye + 0.25);
    // round 1: distinct beats on 'eye' and 'wires': a backlight lift (a rise, then it settles part way back)
    const eyeLift = win(t, b.eye - 0.2, b.eye + 0.15) * (1 - 0.5 * win(t, b.eye + 0.7, b.eye + 1.3));
    const swell = Math.min(1, win(t, b.wires - 0.2, b.wires + 0.15) * (1 - 0.45 * win(t, b.wires + 0.7, b.wires + 1.3)) * 1.25) * (1 - 0.6 * win(t, b.knobs - 0.3, b.knobs + 0.5));
    const ros = withLife(blendPose(ROS_SET, ROS_BACK, win(tq, b.ros + 0.8, b.ros + 1.4)), tq, 1928, 0.9);
    f.layer('L4', (c, env) => {
      const P = env.mood;
      // the floor
      const fr = overscan(LAYERS.L4, CAMS, 40);
      c.fillStyle = mixLab(P.fg, P.set, 0.3);
      c.fillRect(fr.x, FLOOR - 4, fr.w, fr.y + fr.h - FLOOR + 4);
      if (phys > 0.005) {
        c.save();
        c.globalAlpha *= phys;
        const rOpts = { x: ROS_X, y: FLOOR, facing: 'right' as const, pose: ros, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 0.3, y: -0.9, floor: 0 }, edgeRim: { x: 0.4, y: -0.9, px: 1.5 } };
        cast.rosenblatt.draw(c, rOpts, env);
        heldCard(c, env, cast.rosenblatt.anchor(rOpts, 'handF'), 1 - win(tq, b.ros + 0.8, b.ros + 1.2));
        markEye(c, { x: MARK.eye, y: FLOOR, cells: SEEN, lit: eyeLit }, env);
        markPatch(f, c, { x: MARK.patch, y: FLOOR, key: ID, swell }, env);
        markRack(c, { x: MARK.rack, y: FLOOR, weights: RUN.steps[1].wBefore, wMax: W_MAX, turn: hl > 0.01 ? new Float32Array(64).fill(0.8 * hl) : undefined }, env);
        loomRun(c, { x0: MARK.rack + MARK.rackW / 2 - 8, x1: MARK.resp - MARK.respW / 2 + 10, y: FLOOR - MARK.cabH + 40 }, env);
        markResponse(c, { x: MARK.resp, y: FLOOR, needle: 0.12 * Math.sin(t * 0.7) }, env);
        c.restore();
      }
      if (hand > 0.005) {
        // the stands of the teaching machine stand on the same floor; its parts build in place
        const opts = { x: BOX.x, y: BOX.y, w: BOX.w, h: BOX.h, step: st, reveal: hand, tally: false, floorY: PR_FLOOR };
        // the kit's label rows (headers above, verdict below) are kept out of the dissolve and out of the close-up:
        // they fade in once every part has reached its place, and fade out while the camera is close
        const coreClip = () => {
          c.beginPath();
          c.rect(-1e4, LABEL_TOP, 2e4, LABEL_BOT - LABEL_TOP);
          c.clip();
        };
        if (mig < 0.999) {
          // the match-dissolve: each part drawn in its own band, from its hardware's place and size to the diagram's
          for (const pt of PARTS) {
            c.save();
            const sc = lerp(pt.s, 1, mig);
            c.translate(lerp(pt.hw.x, pt.dg.x, mig), lerp(pt.hw.y, pt.dg.y, mig));
            c.scale(sc, sc);
            c.translate(-pt.dg.x, -pt.dg.y);
            c.beginPath();
            c.rect(pt.x0, LABEL_TOP, pt.x1 - pt.x0, LABEL_BOT - LABEL_TOP);
            c.clip();
            drawPR(c, opts, env);
            c.restore();
          }
        } else {
          // the core at full strength; the verdict row below at labelA; the spaced-caps HEADERS above at labelA,
          // dropping to 0.6 once they have been read (~2 s), so the paper-theatre machine leads, not its captions
          const hdr = labelA * (1 - 0.4 * win(t, b.knobs + 3.6, b.knobs + 4.3));
          c.save();
          c.beginPath();
          c.rect(-1e4, LABEL_TOP, 2e4, (labelA >= 0.999 ? 1e4 : LABEL_BOT - LABEL_TOP));
          c.clip();
          drawPR(c, opts, env);
          c.restore();
          if (labelA < 0.999 && labelA > 0.001) {
            c.save();
            c.globalAlpha *= labelA;
            c.beginPath();
            c.rect(-1e4, LABEL_BOT, 2e4, 1e4);
            c.clip();
            drawPR(c, opts, env);
            c.restore();
          }
          if (hdr > 0.001) {
            c.save();
            c.globalAlpha *= hdr;
            c.beginPath();
            c.rect(-1e4, -1e4, 2e4, 1e4 + LABEL_TOP);
            c.clip();
            drawPR(c, opts, env);
            c.restore();
          }
        }
        void coreClip;
        if (mig >= 0.999) tensionStrings(c, env, st, hand);
        // 'You could hear it learn': in the hold, each turning knob carries a faint whirr (two short arcs that spin
        // with its motor and fade as it stops), the picture's only motion besides the pointers
        if (k === HOLD && t > b.hear - 0.3) whirr(c, env, st);
        // the visited knob: its own pointer and its single string to the dial, turned by hand for the lesson
        const demo = win(t, b.each - 0.2, b.each + 0.6) * (1 - win(t, scene.backAt, scene.backAt + 0.6));
        if (demo > 0.01) demoKnob(c, env, t, demo, b);
      }
    });
    f.rim({ x: 0.2, y: -1 });
    // the response lantern on the dial's bracket: one warm practical that pulses each time the knobs turn
    if (hand > 0.3) {
      const pulse = S.error ? Math.sin(Math.PI * turnU) : 0;
      f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1960, intensity: (0.18 + 0.55 * pulse) * sm((hand - 0.3) / 0.7) * (1 - close), radius: 60 + 40 * pulse });
    }
    // practicals: the patch panel's lamp (part A), the eye's inner light
    if (phys > 0.02) {
      f.practical({ x: MARK.patch, y: FLOOR - MARK.cabH / 2, kind: 'tube', seed: 58, intensity: (0.35 + 0.55 * swell) * phys, radius: 120 + 60 * swell });
      if (hl > 0.01) f.practical({ x: MARK.rack, y: FLOOR - MARK.cabH / 2 + 20, kind: 'lamp', seed: 892, intensity: 0.4 * hl * phys, radius: 150 });
      if (eyeLit > 0.02) f.practical({ x: MARK.eye, y: EYE.headY, kind: 'screen', seed: 400, intensity: (0.5 * eyeLit + 0.35 * eyeLift) * phys, radius: 70 + 40 * eyeLift });
    }

    // ------------------------------------------------------------------ L5: the card easel before the eye, a cable
    if (phys > 0.01) {
      f.layer('L5', (c, env) => {
        const r = overscan(LAYERS.L5, CAMS.slice(0, 3), 40);
        bake(f, c, `${ID}/L5/${env.mood.id}`, r, (cc) => {
          const fg = env.fill('fg');
          // a lab stool at the far left, out of focus
          cc.fillStyle = fg;
          cc.fillRect(-40, 560, 120, 14);
          cc.fillRect(-30, 574, 9, 200);
          cc.fillRect(60, 574, 9, 200);
          // a fat cable across the floor
          cc.strokeStyle = fg;
          cc.lineWidth = 15;
          cc.lineCap = 'round';
          cc.beginPath();
          cc.moveTo(r.x, 716);
          cc.bezierCurveTo(500, 690, 900, 724, r.x + r.w, 700);
          cc.stroke();
        });
      });
    }

    // L5 for the teaching machine: a band of haze across the stands' feet and the near floor's edge (blurred), and
    // in the hear-hold Rosenblatt at the left edge, near the lens, head tilted to listen
    // he settles in at the frame's edge during the at-speed run (well before 'hear'), so the hold itself is still:
    // only the motors move in it
    const listenIn = win(tq, b.turn + 1.3, b.turn + 2.3);
    if (hand > 0.01) {
      f.layer('L5', (c, env) => {
        const P = env.mood;
        c.save();
        c.globalAlpha *= hand;
        const hz = c.createLinearGradient(0, 470, 0, 640);
        hz.addColorStop(0, withAlpha(P.setHaze, 0));
        hz.addColorStop(0.55, withAlpha(P.setHaze, 0.22 * (1 - close)));
        hz.addColorStop(1, withAlpha(P.setHaze, 0.08));
        c.fillStyle = hz;
        c.fillRect(-400, 470, 2400, 170);
        const r = overscan(LAYERS.L5, [SETTLE, { ...SETTLE, z: 34 }], 40);
        c.fillStyle = env.fill('fg');
        c.fillRect(r.x, 668, r.w, r.y + r.h - 668);
        c.fillStyle = withAlpha(P.rim, 0.22);
        c.fillRect(r.x, 668, r.w, 1.6);
        c.restore();
        if (listenIn > 0.001) {
          const lp = withLife(ROS_LISTEN, tq, 1928, 0.6);
          // placed in SCREEN terms (the L5 plane slides with the camera), feet below the frame's bottom edge
          const at = toLayer(LAYERS.L5, cam, lerp(-120, 34, listenIn), 748);
          cast.rosenblatt.draw(c, { x: at.x, y: at.y, facing: 'right', pose: lp, scale: 1.3, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.6, floor: 0.2 }, edgeRim: { x: 1, y: -0.5, px: 1.8 } }, env);
        }
      });
    }

    // ------------------------------------------------------------------ the close-up's shadow, labels (screen-locked)
    if (close > 0.01) spotlight(f, cam, close);
    const tenv = { t, mood: f.mood };
    const stampA = win(t, b.stamp - 0.05, b.stamp + 0.15) * (1 - win(t, b.knobs - 1.2, b.knobs - 0.6));
    caseStamp(f.c, 'BUFFALO · 1958–60', { t, at: b.stamp, A: stampA, mood: f.mood, seed: 1960 });
    const lab = win(t, b.weight - 0.5, b.weight + 0.2) * (1 - win(t, b.wrong - 0.55, b.wrong - 0.2));
    if (lab > 0.01) weightLabel(f, cam, lab);
    // the readout: presentation n, and the mistakes in the last 20 only once 20 presentations exist
    // the hear-hold resolves on the moving knobs: the late mistake's verdict and the counter recede to 0.35
    // round 1 (the ending): the readout freezes as the hold begins (it last read 0 in the clean run before it) and
    // fades out before the held presentation's mistake can tick it back up; the hold carries no verdict, so on
    // 'hear it learn' / 'I love that' only the motors move
    const recede = 1 - win(t, b.hear - 0.75, b.hear - 0.25);
    const tallyA = labelA * recede;
    if (tallyA > 0.01) readout(f, Math.min(st, HOLD + 0.6), tallyA);
    const cap = win(t, b.turn - 0.2, b.turn + 0.2);
    if (cap > 0.01) {
      const c = f.c;
      c.save();
      c.globalAlpha = cap * 0.92;
      // bottom left, under the retina's easel (clear of the tubes and the kit's own labels)
      // under the tally, centred a little left (clear of the verdict line at the right)
      softPlate(c, 600, 622, 640, 60, f.mood.ink, 0.6);
      c.font = `italic 400 24px ${FONT.text}`;
      c.fillStyle = mixLab(f.mood.rim, '#efe3cf', 0.35);
      c.textAlign = 'center';
      c.fillText('illustration: the perceptron rule, run for real', 600, 630);
      c.restore();
    }
    // the verdict under the dial (the kit's own line is clipped out in drawPR): two lines, legible, in the safe area
    // the lesson's verdict lands WITH the word 'wrong' (the needle swings on it); later ones follow the record
    if (labelA > 0.01 && Math.floor(st) < HOLD) verdict(f, cam, st, labelA * recede, Math.floor(st) === 1 ? win(t, b.wrong - 0.1, b.wrong + 0.15) : undefined);
    void tenv;
  },
});

/** "said “horizontal”" / "wrong: the knobs turn" (or "correct"), centred under the dial, as the kit times it */
function verdict(f: { c: C; mood: PaintEnv['mood'] }, cam: Camera3, stp: number, a: number, at?: number) {
  const N = RUN.steps.length;
  const sc = Math.max(0, Math.min(N - 1e-6, stp));
  const k = Math.floor(sc);
  const u = stp >= N ? 1 : sc - k;
  const S = RUN.steps[k];
  const vu = at ?? sm(clamp01((u - 0.6) / 0.1));
  if (vu * a < 0.01) return;
  const said = S.out === 1 ? 'horizontal' : 'vertical';
  const c = f.c;
  const X = Math.min(1150, toScr(cam, DIAL.x, DIAL.y).x);
  c.save();
  c.globalAlpha = vu * a;
  softPlate(c, X, 600, 300, 76, f.mood.ink, 0.5);
  const size = legibleSize(c, `italic 400 24px ${FONT.text}`, 24, 'said');
  c.font = `italic 400 ${size}px ${FONT.text}`;
  c.textAlign = 'center';
  c.fillStyle = S.error ? f.mood.rim : f.mood.core;
  c.fillText(`said “${said}”`, X, 590);
  c.fillText(S.error ? 'wrong: the knobs turn' : 'correct', X, 618);
  c.restore();
}

/** the card Rosenblatt holds up for the eye: a pale card with a dark horizontal bar */
function heldCard(c: C, env: PaintEnv, at: { x: number; y: number }, a: number) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(at.x + 6, at.y - 18);
  c.rotate(-0.08);
  c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.35);
  c.fillRect(-4, -26, 44, 34);
  c.fillStyle = env.mood.ink;
  c.fillRect(2, -12, 32, 6);
  c.restore();
}

/** screen point of an L4 world point under a camera */
function toScr(cam: Camera3, x: number, y: number) {
  const s = (1000 * cam.lens) / (1000 - cam.z);
  return { x: 640 + (x - cam.x) * s, y: 360 + (y - cam.y) * s, s };
}

/** the visited knob: drawn over the kit's knob, with its own pointer and loom string to the dial */
function demoKnob(c: C, env: PaintEnv, t: number, a: number, b: { strongly: number; counts: number }) {
  const P = env.mood;
  const tq = tq12(t);
  // one notch up on 'strongly', back down on 'counts' (on twos, a motor's quick turn)
  const up = sm((tq - (b.strongly - 0.05)) / 0.34) * (1 - sm((tq - (b.counts - 0.05)) / 0.34));
  const w0 = 1.2;
  const w = lerp(w0, 3.4, up);
  const turning = Math.max(sm((tq - (b.strongly - 0.05)) / 0.34) * (1 - sm((tq - (b.strongly + 0.4)) / 0.2)), sm((tq - (b.counts - 0.05)) / 0.34) * (1 - sm((tq - (b.counts + 0.4)) / 0.2)));
  c.save();
  c.globalAlpha *= a;
  thread(c, { x0: DK.x + KR, y0: DK.y, x1: STRING_END.x, y1: STRING_END.y, sag: 14 / (1 + w * 0.3), w: 0.6 + 1.6 * w, color: weightColor(P, w), alpha: 0.55 + 0.4 * up }, env);
  // a soft glow under the knob while its motor turns
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(DK.x, DK.y, 2, DK.x, DK.y, KR * 3.2);
  g.addColorStop(0, withAlpha(P.halo, 0.3 + 0.35 * turning));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.fillRect(DK.x - KR * 3.2, DK.y - KR * 3.2, KR * 6.4, KR * 6.4);
  c.globalCompositeOperation = 'source-over';
  // a small standing halo (~0.25) so the hero knob separates from its 63 neighbours
  c.globalCompositeOperation = 'lighter';
  const hg = c.createRadialGradient(DK.x, DK.y, KR, DK.x, DK.y, KR * 2.6);
  hg.addColorStop(0, withAlpha(P.halo, 0.25));
  hg.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = hg;
  c.fillRect(DK.x - KR * 2.6, DK.y - KR * 2.6, KR * 5.2, KR * 5.2);
  c.globalCompositeOperation = 'source-over';
  // the knob itself (covers the kit's), ticks, pointer
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(DK.x, DK.y, KR + 1, 0, Math.PI * 2);
  c.fill();
  // a 1.5 px rim on its lamp side (upper left)
  c.strokeStyle = withAlpha(P.rim, 0.9);
  c.lineWidth = 1.5 / 1.55;
  c.beginPath();
  c.arc(DK.x, DK.y, KR + 0.6, Math.PI * 0.95, Math.PI * 1.75);
  c.stroke();
  c.strokeStyle = withAlpha(P.rim, 0.45 + 0.45 * turning);
  c.lineWidth = 0.9;
  c.beginPath();
  for (let k = -4; k <= 4; k++) {
    const an = -Math.PI / 2 + (k / 4) * Math.PI * 0.8;
    c.moveTo(DK.x + Math.cos(an) * KR * 1.05, DK.y + Math.sin(an) * KR * 1.05);
    c.lineTo(DK.x + Math.cos(an) * KR * 1.32, DK.y + Math.sin(an) * KR * 1.32);
  }
  c.stroke();
  const ang = -Math.PI / 2 + lerp(0.12, 0.42, up) * Math.PI * 0.8;
  c.strokeStyle = weightColor(P, 1);
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(DK.x + Math.cos(ang) * KR * 0.3, DK.y + Math.sin(ang) * KR * 0.3);
  c.lineTo(DK.x + Math.cos(ang) * KR * 0.95, DK.y + Math.sin(ang) * KR * 0.95);
  c.stroke();
  c.restore();
}

/** the close-up: everything but the visited knob, its string and the dial falls into shadow */
let spotCv: HTMLCanvasElement | null = null;
function spotlight(f: { c: C; pxScale: number; mood: PaintEnv['mood'] }, cam: Camera3, a: number) {
  const A = toScr(cam, DK.x, DK.y);
  const B = toScr(cam, STRING_END.x, STRING_END.y);
  const Dd = toScr(cam, DIAL.x, DIAL.y - DIAL.r * 0.35);
  const W = Math.round(1280 * f.pxScale), H = Math.round(720 * f.pxScale);
  if (!spotCv || spotCv.width !== W || spotCv.height !== H) spotCv = makeCanvas(W, H);
  const g = spotCv.getContext('2d')!;
  g.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, 1280, 720);
  g.fillStyle = withAlpha(f.mood.fg, 0.62);
  g.fillRect(0, 0, 1280, 720);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x: number, y: number, r: number, k = 1) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${k})`);
    gr.addColorStop(0.55, `rgba(0,0,0,${k * 0.85})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  };
  hole(A.x, A.y, 120 * A.s * 0.7);
  for (let i = 1; i <= 4; i++) hole(lerp(A.x, B.x, i / 5), lerp(A.y, B.y, i / 5) + 10, 80 * A.s * 0.7, 0.9);
  hole(Dd.x, Dd.y, 230 * A.s * 0.7, 0.85);
  f.c.save();
  f.c.setTransform(1, 0, 0, 1, 0, 0);
  f.c.globalAlpha = a;
  f.c.drawImage(spotCv, 0, 0);
  f.c.restore();
}

/** LEGIBILITY (round 1): the kit sizes its readouts (the Σ w·a sum, the "said … — wrong: the knobs turn" verdict)
 *  at 17-19 × max(1, s), so at a full-frame machine they sit near 19 px cap height. Draw the machine at
 *  w / LK inside an LK× scale: its geometry lands exactly where it did, and every kit label grows LK× (they never
 *  shrink below their base size), past the 22 px floor. */
const LK = 1.18;
function drawPR(c: C, o: { x: number; y: number; w: number; h: number; step: number; reveal: number; tally: boolean; floorY: number }, env: PaintEnv) {
  c.save();
  // the kit's one-line verdict under the dial would run past the right edge at this size: it is clipped out here
  // and set as two lines, centred under the dial, by verdict() (screen-locked, after the layers)
  c.beginPath();
  c.rect(-1e4, -1e4, 2e4, 2e4);
  c.rect(DIAL.x - 300, o.floorY + 14, 1e4, 1e4);
  c.clip('evenodd');
  c.translate(o.x, o.y);
  c.scale(LK, LK);
  perceptronRetina(c, { ...o, x: 0, y: 0, w: o.w / LK, h: o.h / LK, floorY: (o.floorY - o.y) / LK }, env);
  c.restore();
}

/** knob = weight: how strongly one wire counts — set right BESIDE the hero knob, just under its string (~40 px
 *  right and ~30 px below the knob), on a soft plate, so the label names the thing it defines */
function weightLabel(f: { c: C; mood: PaintEnv['mood'] }, cam: Camera3, a: number) {
  const c = f.c;
  const K = toScr(cam, DK.x, DK.y);
  const x = K.x + 48, y = K.y + 92;
  c.save();
  c.globalAlpha = a;
  c.font = `italic 400 28px ${FONT.text}`;
  const w = c.measureText('how strongly one wire counts').width;
  // round 1: a solid dark card under the label (it no longer sits on the busy knob grid), feathered at its edge
  softPlate(c, x + w / 2, y + 10, w + 120, 130, f.mood.ink, 0.7);
  c.fillStyle = withAlpha(mixLab(f.mood.ink, f.mood.fg, 0.3), 0.92);
  c.beginPath();
  c.roundRect(x - 18, y - 38, w + 36, 92, 6);
  c.fill();
  c.strokeStyle = withAlpha(f.mood.rim, 0.28);
  c.lineWidth = 1;
  c.stroke();
  // a short tick from the knob's rim down to the label's first line
  c.strokeStyle = withAlpha(f.mood.rim, 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(K.x + KR * K.s * 0.75, K.y + KR * K.s * 0.75);
  c.lineTo(x - 6, y - 12);
  c.stroke();
  c.textAlign = 'left';
  c.fillStyle = mixLab(f.mood.core, '#efe3cf', 0.4);
  c.font = `600 33px ${FONT.sc}`;
  c.letterSpacing = '1.5px';
  c.fillText('knob = weight', x, y);
  c.letterSpacing = '0px';
  c.font = `italic 400 28px ${FONT.text}`;
  c.fillStyle = withAlpha(mixLab(f.mood.rim, '#efe3cf', 0.5), 0.95);
  c.fillText('how strongly one wire counts', x, y + 36);
  c.restore();
}

/** the readout, screen-locked under the machine (inside the safe area) */
function readout(f: { c: C; mood: PaintEnv['mood'] }, st: number, a: number) {
  const N = RUN.steps.length;
  const sc = Math.max(0, Math.min(N - 1e-6, st));
  const k = Math.floor(sc);
  const u = sc - k;
  const n = Math.min(N, k + (u > 0.65 ? 1 : 0));
  const errs = n === 0 ? 0 : RUN.steps[n - 1].recentErrors;
  const txt = n >= 20 ? `presentation ${k + 1}   ·   mistakes in the last 20: ${errs}` : `presentation ${k + 1}`;
  const c = f.c;
  c.save();
  c.globalAlpha = a;
  softPlate(c, 600, 588, 620, 52, f.mood.ink, 0.5);
  c.font = `italic 400 24px ${FONT.text}`;
  c.textAlign = 'center';
  c.fillStyle = mixLab(f.mood.rim, '#efe3cf', 0.25);
  c.fillText(txt, 600, 596);
  c.restore();
}

/** the hold's motors: two short arcs around each knob that turns (only the lit ones: Δw ≠ 0), spinning with the
 *  turn and fading out as it ends */
function whirr(c: C, env: PaintEnv, step: number) {
  const k = Math.floor(step);
  const S = RUN.steps[k];
  if (!S || !S.error) return;
  const turnU = sm(clamp01((step - k - 0.68) / 0.24));
  const a = Math.sin(Math.PI * turnU);
  if (a < 0.02) return;
  c.save();
  c.strokeStyle = withAlpha(env.mood.halo, 0.75 * a);
  c.lineWidth = 1.3;
  c.lineCap = 'round';
  for (let i = 0; i < N_A; i++) {
    if (!S.a[i] || S.wAfter[i] === S.wBefore[i]) continue;
    const p = KNOB(i);
    const dir = S.wAfter[i] > S.wBefore[i] ? 1 : -1;
    const base = dir * turnU * Math.PI * 1.6 + i;
    for (let j = 0; j < 2; j++) {
      const a0 = base + j * Math.PI;
      c.beginPath();
      c.arc(p.x, p.y, KR * 1.45, a0, a0 + 0.7);
      c.stroke();
    }
  }
  c.restore();
}

/** the strings to the response dial, re-tinted so + (warm) and − (cool) read apart in a still (same geometry and
 *  alpha as the kit's strings, drawn over them) */
function tensionStrings(c: C, env: PaintEnv, step: number, reveal: number) {
  const strA = sm((reveal - 0.5) / 0.3);
  if (strA <= 0.01) return;
  const N = RUN.steps.length;
  const sc = Math.max(0, Math.min(N - 1e-6, step));
  const k = Math.floor(sc);
  const u = sc - k;
  const S = RUN.steps[k];
  const aU = sm((u - 0.2) / 0.22);
  const turnU = S.error ? sm((u - 0.68) / 0.24) : 0;
  const P = env.mood;
  // round 1: + strings carry a clear warm (amber) tint; − strings stay a cool neutral (one accent only)
  const warm = mixLab(P.rim, '#e6a55a', 0.82);
  const cool = mixLab(P.rim, mixLab(P.setHaze, '#9fb2c8', 0.4), 0.5);
  for (let i = 0; i < N_A; i++) {
    const on = S.a[i] ? aU : 0;
    if (on <= 0.01) continue;
    const wi = S.wBefore[i] + (S.wAfter[i] - S.wBefore[i]) * turnU;
    if (wi === 0) continue;
    const p = KNOB(i);
    thread(c, {
      x0: p.x + KR,
      y0: p.y,
      x1: STRING_END.x,
      y1: STRING_END.y,
      sag: 14 / (1 + Math.abs(wi) * 0.3),
      w: (0.55 + 3.45 * Math.min(1, Math.abs(wi) / W_MAX)) * (0.4 + 0.6 * on),
      color: wi > 0 ? warm : cool,
      alpha: strA * 0.78 * on * Math.min(1, Math.abs(wi) / 1.5 + 0.35),
    }, env);
  }
}
void eyeCell;
