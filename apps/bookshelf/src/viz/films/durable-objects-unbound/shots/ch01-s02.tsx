/**
 * ch01-s02 — the failure, then the mystery (emberRed → winterBlue; lampChange in).
 *
 * The canonical town pulled back wide: A at left, the Well and Plate at the left third, B and C on the terrace,
 * the L6 lamp-post at the right edge.
 *   gutter    A's window lamp gutters on ones (two flickers, out) and the Room Lantern inside dies with it
 *   dark      hold the dark window through L0105; only wind
 *   (plant)   after L0105, House B's window flickers on for about a second and gutters out, silent and unremarked:
 *             B claimed the room and died before opening it (paid off aloud in ch05-s06)
 *   (grade)   the grade lamp-changes back toward winterBlue over 1.5 s
 *   clights   House C's window (and dormer) light: the warm practical
 *   bundle    keeper C hauls at C's pulley line: the Well's bucket comes up and a bound bundle climbs the line to C;
 *             the camera trucks right with a gentle rise, following it (≈ 90 px, well under 6 % width/s)
 *   relit     the Room Lantern glows again, now in C's window, members back inside
 *   slip      a gentle push to C's window: #42's slip inside, its two-stroke tick intact
 *   true      hold
 * A small badge 'workerd · 28 Oct' hangs on C's pulley block (art, never named here). Nothing below y 634.
 */
import { Timeline } from '../../../core';
import { POSES, PUPPET_NEAR_BLACK, defineShot, pose } from '../../../film';
import type { Camera3, Pose } from '../../../film';
import { cast } from '../cast';
import { TOWN, gutter, paintTown, pulleyAt } from '../sets/harbourTown';
import { badge, camAt, clamp01, seg, slip, twos, type CamKey } from '../sets/common';
import { book } from '../sets/walRibbon';

const ID = 'ch01-s02';
const WIDE: Camera3 = { x: 640, y: 372, z: -30, lens: 1 };
const FOLLOW: Camera3 = { x: 732, y: 344, z: 40, lens: 1 };
/** review r1: close enough on C's window that #42's slip and its tick read */
const ON_C: Camera3 = { x: 1207, y: 375, z: 560, lens: 1.5 };
/** keeper C stands under C's pulley block, hauling the line (L3, small: the terrace is far) */
const KC = { x: 1022, y: TOWN.C.base, s: 0.3 };
const haul = (k: number): Pose =>
  pose({ hipF: 8, kneeF: -6, hipB: -10, kneeB: -2, torso: -6 + 4 * k, neck: 4, head: -8, shoulderF: 120 - 40 * k, elbowF: 18 + 30 * k, wristF: -10, shoulderB: 108 - 40 * k, elbowB: 26 + 30 * k }, { handF: 'grip', handB: 'grip' });

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      gutter: T.beat('gutter'),
      dark: T.beat('dark'),
      clights: T.beat('clights'),
      bundle: T.beat('bundle'),
      relit: T.beat('relit'),
      slip: T.beat('slip'),
      tru: T.beat('true'),
      l105end: T.line('L0105').end,
    };
    // B's silent flicker sits in the hold after L0105, before the grade turns
    const bFlick = b.l105end + 0.5;
    const grade = { at: bFlick + 1.6, dur: 1.5 };
    const cams: CamKey[] = [
      { t: 0, cam: WIDE },
      { t: b.clights - 0.6, cam: { ...WIDE, x: 648 } },
      { t: b.relit + 1.2, cam: FOLLOW },
      { t: b.slip - 0.3, cam: { ...FOLLOW, x: 760, z: 70 } },
      { t: b.tru - 0.4, cam: ON_C },
      { t: b.D, cam: { ...ON_C, z: ON_C.z + 10 } },
    ];
    return { tl, b, bFlick, grade, cams };
  },
  paint(f, _s, sc) {
    const { b, bFlick, grade, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    // A gutters on ones (two flickers, out); B flickers once and dies; C lights on 'lights'
    const gA = gutter(clamp01((t - b.gutter) / 2.6), t);
    const bOn = seg(t, bFlick, bFlick + 0.15) * (1 - seg(t, bFlick + 0.9, bFlick + 1.2));
    const bLamp = bOn * (Math.sin(t * 37) > -0.3 ? 1 : 0.4);
    const cLamp = seg(t, b.clights - 0.15, b.clights + 0.5);
    const relit = seg(t, b.relit - 0.2, b.relit + 1.0);
    // the bucket comes up first, then the bundle climbs C's line (wellhead u = 1 → house u = 0)
    const bucket = 1 - seg(t, b.bundle - 1.4, b.bundle);
    const climb = clamp01((t - (b.bundle + 0.2)) / Math.max(0.8, b.relit - 0.4 - (b.bundle + 0.2)));
    const hauling = seg(t, b.bundle - 1.6, b.bundle - 1.0) * (1 - seg(t, b.relit - 0.2, b.relit + 0.4));
    const u = clamp01((t - grade.at) / grade.dur);
    paintTown(
      f,
      {
        cam,
        cams: cams.map((k) => k.cam),
        mood: { from: 'emberRed', to: 'winterBlue', u },
        lamps: { A: gA, B: bLamp, C: cLamp, Cup: cLamp * 0.8 },
        lanterns: [
          { house: 'A', lit: gA, members: 4 * gA, tq, door: 0, s: 0.6, alpha: Math.max(0.25, gA) },
          { house: 'C', lit: relit, members: 4 * relit, tq, door: 0, s: 0.6, alpha: relit },
        ],
        plate: { house: '', epoch: '', from: '', crown: 0.3, dim: 0.65 },
        tooth: null,
        well: { bucket, load: bucket < 0.95 && climb <= 0 ? 'book' : 'none', glint: 0.3 },
        lampPostLit: 0.45,
      },
      {
        L3back: (c, env) => {
          // #42's slip pinned beside the lantern in C's window, its tick intact
          if (relit > 0.01) {
            const w = TOWN.C.main;
            slip(c, env, { x: w.x + 10, y: w.y + 2, w: 22, rot: -0.12, tick: 1, alpha: relit * seg(t, b.relit, b.relit + 0.8) });
          }
        },
        L3: (c, env) => {
          // keeper C hauling at the line under C's pulley block
          if (cLamp > 0.01) {
            const k = hauling > 0 ? 0.5 + 0.5 * Math.sin(tq * 6.2) : 0;
            const p = hauling > 0.01 ? haul(k) : POSES.stand;
            cast['keeper-c'].draw(c, { x: KC.x, y: KC.y, facing: 'left', pose: p, scale: KC.s, ink: PUPPET_NEAR_BLACK, light: { x: 0.6, y: -0.8, floor: 0.2 }, edgeRim: { x: 0.7, y: -0.7, px: 2.5, alpha: 0.85, warm: 0.65 } }, env);
          }
          badge(c, env, { x: TOWN.C.pulley.x + 3, y: TOWN.C.pulley.y + 4, text: 'workerd · 28 Oct', s: 0.5, legible: false, alpha: cLamp, swing: 0.04 * Math.sin(tq * 1.4) });
        },
        L4: (c, env) => {
          if (climb > 0 && climb < 1) {
            const p = pulleyAt(cam, 'C', 1 - climb);
            book(c, env, { x: p.x, y: p.y + 14, s: 0.55, rot: 0.1 * Math.sin(tq * 4) });
            // the cord the bundle hangs from
            c.save();
            c.strokeStyle = env.fill('ink');
            c.lineWidth = 0.8;
            c.beginPath();
            c.moveTo(p.x, p.y);
            c.lineTo(p.x, p.y + 4);
            c.stroke();
            c.restore();
          }
        },
      },
    );
  },
});
