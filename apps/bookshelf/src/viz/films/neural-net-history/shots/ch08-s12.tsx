/**
 * ch08-s12 — THE RESULT PLATE: a row of lanterns at nearly one height, and one that drops far lower; a cliff
 * measured by a bracket (dawnGold; 13.0 s; plain cut from the hall).
 *
 * The leaderboard of lanterns now hangs in the Florence hall's dark (sets/ch08-s12-lanterns): paper lanterns on
 * strings from a batten, each lantern's HEIGHT on the ruled pole is a team's ILSVRC-2012 top-5 test error
 * (lower is better). The other entries hang at nearly one height (the script's "about 26 to 34 %"), swaying
 * gently, each with a faint dashed leader to the pole; the lantern that will fall hangs among them at ~29 %.
 *   'twenty-six'  the runner-up's lantern glows; a dashed level runs from it to the pole, whose 26.2 tick lights
 *   'Net'         a small paper tag turns into the light on the furled lantern: SuperVision · Toronto
 *   'fifteen'     its string pays out and it DROPS, past every other lantern, to 15.3 % (a jerk and a bob as the
 *                 string comes taut); the camera follows; the hall's heads (sharp near plane) lean forward on twos;
 *                 the ruled bracket draws itself down from 26.2 to 15.3 and reads 10.9 points; the label sets in
 *   hold          the camera holds still until 'cliff'
 *   'cliff'       the camera tilts down the drop as if down a cliff face
 *   hold          the silence holds on the fallen lantern (the caveat is the next shot's)
 * TEXT: the label "ILSVRC-2012 · top-5 error · 15.3% vs 26.2% (second place)" and the bracket's "10.9 points";
 * the tag and the pole's numbers are props.
 */
import { Timeline } from '../../../core';
import type { Camera3, ShotScene } from '../../../film';
import type { PaintEnv } from '../../../film';
import { LAYERS, defineShot, mixLab, overscan, toScreen, withAlpha } from '../../../film';
import { FONT, legibleSize, softPlate, textColor } from '../../../film/silhouette/type';
import { LB, audienceBusts, batten, bracketRule, hallDark, hungLantern, lanternTag, rulerPole, yOf } from '../sets/ch08-s12-lanterns';
import { camKeys } from '../sets/ch03-s06-kit';
import { clamp01, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch08-s12';
const Y_RUN = yOf(LB.runnerErr);
const Y_ALEX = yOf(LB.alexErr);
/** the lantern that falls hangs among the others first, at nearly one height */
const Y_START = yOf(LB.alexStartErr);

interface B {
  D: number;
  runner: number;
  name: number;
  drop: number;
  land: number;
  cliff: number;
  tilt1: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  /** the smallest L4 scale the camera reaches (props' lettering is sized for it, so it never shrinks below the floor) */
  kMin: number;
}
/** the far rank of lanterns (L3, smaller, hazed): the hall is full of entries beyond the board */
const FAR = [
  { x: 240, y: 150 }, { x: 330, y: 214 }, { x: 452, y: 168 }, { x: 560, y: 236 }, { x: 676, y: 182 }, { x: 798, y: 128 },
  { x: 1010, y: 204 }, { x: 1120, y: 152 }, { x: 1236, y: 226 }, { x: 1350, y: 170 }, { x: 1462, y: 214 },
];
const kL4 = (c: Camera3) => 1000 / (1000 - c.z);

/** the falling lantern's centre y (on twos: paper) */
function alexY(tq: number, b: B): number {
  if (tq < b.drop) return Y_START;
  if (tq < b.land) {
    const u = (tq - b.drop) / (b.land - b.drop);
    return Y_START + (Y_ALEX - Y_START) * u * u;
  }
  // the string comes taut: a jerk past the mark, a damped bob back
  const s = tq - b.land;
  return Y_ALEX + 16 * Math.exp(-3.2 * s) * Math.sin(8.5 * s);
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const drop = T.beat('drop');
    const b: B = {
      D,
      runner: T.beat('runnerup'),
      name: T.beat('name'),
      drop,
      land: drop + 0.62,
      cliff: T.beat('cliff'),
      tilt1: Math.min(D - 1.2, T.beat('cliff') + 1.9),
    };
    // tight on the ruler and the row; follow the fall part way down; HOLD still until 'cliff'; then tilt down the
    // drop (easing back a little) so the runner-up's level sits on the top third and the fallen lantern on the lower
    // third: the bracket spans the frame
    const cam = camKeys([
      [0, 690, 256, 200],
      [b.runner + 0.2, 700, 258, 220],
      [b.name, 742, 262, 226],
      [b.drop - 0.1, 750, 266, 226],
      [b.land + 0.5, 770, 400, 62],
      [b.cliff - 0.1, 771, 404, 62],
      [b.tilt1, 772, 468, 92],
      [D, 776, 474, 104],
    ]);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) CAMS.push(cam((D * i) / 24));
    const kMin = Math.min(...CAMS.map(kL4));
    tl.hold(0, D);
    return { tl, b, cam, CAMS, kMin };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    hallDark(f, { key: ID, cams: sc.CAMS, glow: 1 - 0.25 * win(t, b.drop, b.drop + 2), windows: true });
    // the far rank: smaller lanterns on a far batten, hazed (a third plane between the windows and the board)
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, sc.CAMS, 40);
      batten(c, env, r.x, r.x + r.w);
      FAR.forEach((o, i) => hungLantern(c, env, { x: o.x, y: o.y, r: LB.r * 0.8, act: 0.2 + 0.06 * Math.sin(i * 1.7), seed: 40 + i, tq, alpha: 0.75 }));
    });

    const runGlow = win(t, b.runner - 0.15, b.runner + 0.35);
    const fallen = tq >= b.land;
    const ay = alexY(tq, b);
    const fallA = clamp01((t - b.drop) / 0.5);
    f.layer('L4', (c, env) => {
      const m = env.mood;
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      // lettering on the props is sized to the floor at the widest framing of the shot (constant through the shot)
      const kNow = kL4(cam);
      const sizeFor = (font: string, px: number, text: string) => Math.ceil(legibleSize(c, font, px, text) * (kNow / sc.kMin));
      const rulerPx = sizeFor(`500 19px ${FONT.mono}`, 19, '30%');
      const tagPx = sizeFor(`500 16px ${FONT.mono}`, 16, 'SuperVision');
      batten(c, env, r.x, r.x + r.w);
      // dashed levels from the two named lanterns to the pole (the reading)
      const lev = (y: number, x0: number, a: number) => {
        if (a <= 0.003) return;
        c.save();
        c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55 * a);
        c.lineWidth = 1.2;
        c.setLineDash([5, 5]);
        c.beginPath();
        c.moveTo(x0, y);
        c.lineTo(LB.rulerX, y);
        c.stroke();
        c.restore();
      };
      // every lantern's faint leader to the pole: the row reads as a leaderboard
      LB.others.forEach((o) => {
        c.save();
        c.strokeStyle = withAlpha(mixLab(m.rim, m.haze, 0.3), 0.26);
        c.lineWidth = 1;
        c.setLineDash([3, 6]);
        c.beginPath();
        c.moveTo(o.x + LB.r * 0.8, yOf(o.err));
        c.lineTo(LB.rulerX - 6, yOf(o.err));
        c.stroke();
        c.restore();
      });
      lev(Y_RUN, LB.runnerX + LB.r * 0.8, runGlow);
      rulerPole(c, env, {
        fontPx: rulerPx,
        marks: [
          { err: LB.runnerErr, a: runGlow },
          { err: LB.alexErr, a: win(t, b.land, b.land + 0.4) },
        ],
      });
      lev(Y_ALEX, LB.alexX - LB.r * 0.8, win(t, b.land + 0.1, b.land + 0.6));
      // the others: nearly one height, swaying gently, dimly lit
      LB.others.forEach((o, i) => hungLantern(c, env, { x: o.x, y: yOf(o.err), act: 0.3 + 0.05 * Math.sin(i * 2.1) - 0.08 * runGlow, seed: i + 3, tq }));
      // the runner-up
      hungLantern(c, env, { x: LB.runnerX, y: Y_RUN, act: 0.3 + 0.62 * runGlow - 0.16 * win(t, b.land, b.land + 1), flare: 0.7 * runGlow * (1 - win(t, b.runner + 0.5, b.runner + 1.5)), seed: 11, tq });
      // the bracket: drawn down the drop with the tilt
      bracketRule(c, env, {
        x: LB.rulerX - 46,
        y0: Y_RUN,
        y1: Y_ALEX,
        draw: win(t, b.land + 0.2, b.land + 0.85),
        text: '−10.9',
        textA: win(t, b.land + 0.55, b.land + 0.95),
        side: 'left',
        fontPx: rulerPx,
      });
      // the fall leaves a fading streak of its own light down the string (read the drop in a still)
      const streak = tq >= b.drop ? 1 - win(t, b.land + 0.1, b.land + 1.4) : 0;
      if (streak > 0.01) {
        const yTop = Y_START + 10;
        const g = c.createLinearGradient(0, yTop, 0, ay);
        g.addColorStop(0, withAlpha(m.halo, 0));
        g.addColorStop(0.7, withAlpha(m.halo, 0.16 * streak));
        g.addColorStop(1, withAlpha(m.core, 0.4 * streak));
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = g;
        c.fillRect(LB.alexX - 14, yTop, 28, ay - yTop);
        c.restore();
      }
      // the lantern that falls: furled under the batten, then its string pays out
      const act = fallen ? 1 : 0.3 + 0.45 * fallA;
      const p = hungLantern(c, env, {
        x: LB.alexX,
        y: ay,
        act,
        flare: fallen ? 0.6 * (1 - win(t, b.land + 0.2, b.land + 2.2)) : 0.2 * fallA,
        seed: 17,
        tq,
        sway: tq < b.drop ? 2 : fallen ? 2.2 + 6 * Math.exp(-2 * (tq - b.land)) : 0.6,
      });
      // the tag turns into the light on 'Net' beside the lantern (clear of the heads) and rides down with it
      c.font = `500 ${tagPx}px ${FONT.mono}`;
      const tagW = c.measureText('SuperVision ·').width + tagPx * 1.3;
      lanternTag(c, env, { x: p.x + LB.r + 14 + tagW / 2, y: p.y - LB.r * 0.9, text: 'SuperVision ·\nToronto', turn: win(t, b.name - 0.05, b.name + 0.35), size: tagPx, len: 8, rot: 0.03 * Math.sin(tq * 1.9) });
    });
    f.rim({ x: 0, y: -1 });

    // the hall's audience: busts in two staggered ranks (a sharp dark near plane, L5 parallax, unblurred) along the
    // bottom edge; on the drop they lean 6-8° toward the falling lantern, each one or two drawings late, on twos
    {
      const c = f.c;
      const m = f.mood;
      const o = toScreen(LAYERS.L5, cam, 0, 0);
      const target = toScreen(LAYERS.L4, cam, LB.alexX, 0).x;
      const leanAt = (late: number) => win(tq - late / 12, b.drop + 0.1, b.drop + 0.6);
      const px = (o.x % 120) - 120;
      audienceBusts(c, { x0: px + 60, x1: 1400, y: 676, scale: 0.64, pitch: 104, lean: leanAt, targetX: target, seed: 813, tq, ink: mixLab(m.ink, m.set, 0.18), deg: 6 });
      audienceBusts(c, { x0: px, x1: 1400, y: 700, scale: 0.8, pitch: 132, lean: (l) => leanAt(l + 1), targetX: target, seed: 812, tq, ink: mixLab(m.ink, '#000000', 0.2), deg: 8 });
    }

    // the label: two short lines at upper right on a soft plate
    const la = win(t, b.land + 0.25, b.land + 0.85);
    if (la > 0.003) {
      const c = f.c;
      const m = f.mood;
      c.save();
      c.globalAlpha = la;
      const fs = legibleSize(c, `500 25px ${FONT.mono}`, 25);
      // upper right: the wall the tilt leaves empty, clear of the board, the bracket and the audience
      softPlate(c, 1000, 108, 700, 150, m.ink, 0.62);
      c.fillStyle = textColor(m);
      c.textAlign = 'right';
      c.textBaseline = 'alphabetic';
      c.font = `500 ${fs}px ${FONT.mono}`;
      c.fillText('ILSVRC-2012 · top-5 error', 1232, 92);
      c.fillStyle = mixLab(textColor(m), m.core, 0.35);
      c.fillText('15.3% vs 26.2% (second place)', 1232, 92 + fs * 1.5);
      c.restore();
    }
    void sm;
  },
});
