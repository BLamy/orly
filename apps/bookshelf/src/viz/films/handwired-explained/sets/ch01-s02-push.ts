/**
 * handwired-explained — ch01-s02 → ch01-s03 → ch01-s04: ONE continuous push into Monitor, shared by the three shots so
 * every crossfade registers exactly (review r1: the s02→s03 and s03→s04 dissolves doubled the sidebar text because
 * each shot had its own camera).
 *
 *   pushCam(u)        the camera at u seconds from the ch01-s02 / ch01-s03 cut (u < 0 inside ch01-s02, 0..dur3 inside
 *                     ch01-s03, beyond dur3 inside ch01-s04, where only Monitor's gauze still rides it)
 *   PUSH.s02Offset    ch01-s02 local t → u = t - PUSH.s02Offset (its duration)
 *   PUSH.s04Offset    ch01-s04 local t → u = t + PUSH.s04Offset (ch01-s03's duration)
 *
 * Two eases summed: a push from the ch01-s02 wide (it starts as Photos glides) to Monitor at about z 400 (so the
 * sidebar reads from ch01-s03's 'sidebar' beat), peaking in speed AT the cut so the dissolve never stalls; and a long
 * slow creep (z +190) that is still moving at the ch01-s03 / ch01-s04 cut. Times come from the locked clock.
 */
import type { Camera3 } from '../../../film/contracts';
import { CAMERA3_HOME } from '../../../film/contracts';
import timeline from '../timeline.json';

type TlShot = { id: string; start: number; end: number; beats?: Record<string, number> };
const shots = (timeline as unknown as { shots: TlShot[] }).shots;
const S2 = shots.find((s) => s.id === 'ch01-s02')!;
const S3 = shots.find((s) => s.id === 'ch01-s03')!;
const dur2 = S2.end - S2.start;
const dur3 = S3.end - S3.start;
const glides = S2.beats?.glides ?? 7.1;

/** the push's two targets: Monitor's sidebar in reading size, then the slow creep toward the gauze */
const P1 = { x: 472, y: 336, z: 400 };
const D2 = { x: -6, y: -2, z: 190 };
const UA = glides - dur2; // the push starts as Photos glides
const UB = 1.0; // the fast push has landed by ch01-s03's 'sidebar' beat
const UC = dur3 + 3; // the creep is still moving through ch01-s04's gauze

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const inOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/** the film-continuous tick clock for Monitor's live rows: ch01-s02 local time + this (s03: dur2, s04: dur2 + dur3) */
export const PUSH = { s02Offset: dur2, s04Offset: dur3, start: UA, rowsS03: dur2, rowsS04: dur2 + dur3, s03Live: S3.beats?.live ?? 6.87 } as const;

export function pushCam(u: number): Camera3 {
  const e1 = inOut(clamp01((u - UA) / (UB - UA)));
  const e2 = inOut(clamp01((u - UA) / (UC - UA)));
  return {
    x: CAMERA3_HOME.x + (P1.x - CAMERA3_HOME.x) * e1 + D2.x * e2,
    y: CAMERA3_HOME.y + (P1.y - CAMERA3_HOME.y) * e1 + D2.y * e2,
    z: P1.z * e1 + D2.z * e2,
    lens: 1,
  };
}
