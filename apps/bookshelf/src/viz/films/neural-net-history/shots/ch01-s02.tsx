/**
 * ch01-s02 — close on the little lit box: the question drops in as type, and the answer is set back one
 * sort per spoken word (serverCyan, 9.5 s, cut in).
 *
 * Over the person's shoulder, CLOSE on the same laptop as ch01-s01: a thin bezel with a deeper chin and the
 * hinge seam along its bottom edge, the keyboard deck a blurred lip below, the person a blurred L5 head-back
 * and shoulder locked at frame left (~9% of the width; no face, so no half-profile is ever cropped), a sliver
 * of the night window past the lid at right. ch01-s01's push continues as one slow, decelerating dolly.
 * Inside, a typesetter's bench with depth (sets/ch01-s02-bench): a dark crown and a band of haze behind the
 * sticks, the field falling toward the bezel corners, a dark type-case silhouette along the lower band, dust
 * drifting in the screen's light. Both composing sticks are on the bench, empty, from the first frame, their
 * waiting slots glowing faintly from within. Illustrative only:
 *  - from "question" the question's sorts drop into the first stick across the rest of L0102, deliberately
 *    soft (blurred, ~66%) so we feel the act; in the pause the stick is "sent" a little way up;
 *  - on L0103 one cut-metal sort (square shoulders, a top rim, a nick) rises out of the case per word and
 *    lands on "writes", "back", "word", "by", "word" with a 3 px bounce and a puff of dust.
 * Caption "illustration" (IBM Plex Mono, 27 px) inside the safe area, lower right, on a soft plate.
 * The final state hands on to ch01-s03 (BENCH_FINAL).
 */
import { Timeline, ease } from '../../../core';
import { FONT, defineShot, mixLab, softPlate, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { BENCH_CAMS, bench, benchTimes } from '../sets/ch01-s02-bench';

const S02_START: Camera3 = BENCH_CAMS.start;
const S02_END: Camera3 = BENCH_CAMS.end;
const CAMS = [S02_START, S02_END];

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);

export default defineShot({
  id: 'ch01-s02',
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const B = benchTimes(T);
    const q = tl.channel('q', 0);
    tl.tween(q, 1, { at: B.qAt, dur: B.qEnd - B.qAt, ease: ease.linear });
    const sent = tl.channel('sent', 0);
    tl.tween(sent, 1, { at: B.qEnd + 0.1, dur: 0.95, ease: ease.move });
    // both composing sticks stand on the bench, empty, from the first frame (their slots already waiting)
    const aStick = tl.channel('aStick', 1);
    const qSoft = tl.channel('qSoft', 0);
    tl.tween(qSoft, 1, { at: B.answerAt, dur: 0.5, ease: ease.move });
    tl.hold(0, D);
    return { tl, q, sent, aStick, qSoft, B, labelAt: T.beat('question'), D };
  },
  paint(f, s, scene) {
    const t = f.t;
    // one slow dolly in over the whole shot, decelerating gently (it carries on ch01-s01's push)
    const u = clamp01(t / scene.D);
    const e = 1 - Math.pow(1 - u, 2.0);
    const cam: Camera3 = {
      x: S02_START.x + (S02_END.x - S02_START.x) * e,
      y: S02_START.y + (S02_END.y - S02_START.y) * e,
      z: S02_START.z + (S02_END.z - S02_START.z) * e,
      lens: 1,
    };
    f.camera(cam);
    const uS = clamp01((t - 0.5) / (scene.D - 0.5));
    const eS = 1 - Math.pow(1 - uS, 2.0);
    // the shoulder edge is locked at frame left (about 9% of the width), drifting out only a little as the
    // push carries on, and growing slightly, as a near plane should
    bench(f, {
      // held dead still for the first 0.5 s (the cut-in reads off this edge), then easing out with the push
      shoulderDrift: { x: -14 * eS, s: 1 + 0.06 * eS },
      key: 'ch01-s02',
      cams: CAMS,
      typing: t < scene.B.qEnd + 0.1,
      state: {
        qU: s.get(scene.q),
        sent: s.get(scene.sent),
        aStick: s.get(scene.aStick),
        lands: scene.B.lands,
        t,
        qSoft: s.get(scene.qSoft),
        field: 1 - sm((t - scene.B.qAt) / 0.45),
      },
    });
    // a soft ink vignette at the frame edges: the screen's rim reads as a glowing frame against the dark
    {
      const c = f.c;
      const k = 0.55 + 0.25 * e;
      const v = c.createRadialGradient(640, 360, 300, 640, 360, 820);
      v.addColorStop(0, withAlpha(f.mood.fg, 0));
      v.addColorStop(0.6, withAlpha(f.mood.fg, 0.22 * k));
      v.addColorStop(1, withAlpha(f.mood.fg, 0.85 * k));
      c.save();
      c.fillStyle = v;
      c.fillRect(-20, -20, 1320, 760);
      c.restore();
    }
    // the caption: inside the safe area, top right, over the field's dark crown (clear of the tray and the sticks)
    const lA = sm((t - scene.labelAt) / 0.5);
    if (lA > 0) {
      const c = f.c;
      c.save();
      c.globalAlpha = lA;
      softPlate(c, 1100, 104, 300, 76, f.mood.ink, 0.5);
      c.font = `400 27px ${FONT.mono}`;
      c.textAlign = 'right';
      c.textBaseline = 'alphabetic';
      c.fillStyle = mixLab(f.mood.rim, f.mood.core, 0.4);
      c.fillText('illustration', 1176, 114);
      c.restore();
    }
  },
});
