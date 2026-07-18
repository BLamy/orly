import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Distillation — learning from soft targets.
 *
 * Real computation at module scope: a teacher's logits over six classes for
 * one image ("dog" 5.0, "wolf" 3.2, "coyote" 2.8, "cat" 0.5, "car" −1,
 * "toaster" −2) pushed through a temperature softmax at T = 1, 2, 4. At T = 1
 * the distribution is nearly one-hot (dog 0.78); at T = 4 the similarity
 * structure — the dark knowledge — is visible (dog 0.34, wolf 0.22, coyote
 * 0.20). A student's logits are ACTUALLY trained here by 400 steps of
 * gradient descent on the soft-target cross entropy; the recorded trajectory
 * is replayed in the scene, converging to match the teacher to three decimal
 * places. The hard-label student converges to one-hot and keeps none of it.
 */

export const CLASSES = ['dog', 'wolf', 'coyote', 'cat', 'car', 'toaster'] as const;
export const K = CLASSES.length;
export const TEACHER_LOGITS = [5.0, 3.2, 2.8, 0.5, -1.0, -2.0];

export const softmax = (z: number[], T: number): number[] => {
  const e = z.map((x) => Math.exp(x / T));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};

export const P_T1 = softmax(TEACHER_LOGITS, 1);
export const P_T2 = softmax(TEACHER_LOGITS, 2);
export const P_T4 = softmax(TEACHER_LOGITS, 4);
export const HARD: number[] = [1, 0, 0, 0, 0, 0];

/** Student gradient descent on soft-target cross entropy, T = 4 — recorded. */
export const SOFT_TRAJ: number[][] = (() => {
  let st = new Array<number>(K).fill(0);
  const snaps: number[][] = [softmax(st, 4)];
  for (let step = 1; step <= 400; step++) {
    const p = softmax(st, 4);
    st = st.map((z, i) => z - 2.0 * (p[i] - P_T4[i]));
    if (step % 8 === 0) snaps.push(softmax(st, 4));
  }
  return snaps; // 51 snapshots
})();

/** Same student trained on the hard one-hot label — recorded. */
export const HARD_TRAJ: number[][] = (() => {
  let st = new Array<number>(K).fill(0);
  const snaps: number[][] = [softmax(st, 1)];
  for (let step = 1; step <= 400; step++) {
    const p = softmax(st, 1);
    st = st.map((z, i) => z - 2.0 * (p[i] - HARD[i]));
    if (step % 8 === 0) snaps.push(softmax(st, 1));
  }
  return snaps;
})();

export const SOFT_FINAL = SOFT_TRAJ[SOFT_TRAJ.length - 1];
export const HARD_FINAL = HARD_TRAJ[HARD_TRAJ.length - 1];

/** Interpolate a recorded trajectory at fractional snapshot index. */
export function trajAt(traj: number[][], u: number): number[] {
  const f = Math.max(0, Math.min(traj.length - 1, u));
  const i = Math.floor(f);
  const t = f - i;
  const a = traj[i];
  const b = traj[Math.min(traj.length - 1, i + 1)];
  return a.map((v, k) => v + (b[k] - v) * t);
}

// ---------------------------------------------------------------------------
// Stage layout — teacher bars left, student bars right.
// ---------------------------------------------------------------------------

export const T_X0 = 150;
export const S_X0 = 720;
export const BARS_Y = 470; // baseline
export const BAR_W = 62;
export const BAR_GAP = 14;
export const BAR_MAX = 300;
export const barX = (x0: number, i: number): number => x0 + i * (BAR_W + BAR_GAP);

export const CAM_TEACHER: CameraState = { x: 420, y: 330, k: 1.2 };
export const CAM_BOTH: CameraState = { x: 640, y: 340, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  teachU: ChannelRef<number>; // teacher bars appear
  tempU: ChannelRef<number>; // 0→1 lerps teacher dist from T=1 to T=4 (via T=2)
  darkU: ChannelRef<number>; // highlight wolf/coyote
  studU: ChannelRef<number>; // student panel appears
  softProg: ChannelRef<number>; // soft-target training progress (snapshot idx)
  hardProg: ChannelRef<number>; // hard-label training progress
  showHard: ChannelRef<number>; // 0 soft view · 1 hard view
  mathU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const teachU = tl.channel('teachU', 0);
  const tempU = tl.channel('tempU', 0);
  const darkU = tl.channel('darkU', 0);
  const studU = tl.channel('studU', 0);
  const softProg = tl.channel('softProg', 0);
  const hardProg = tl.channel('hardProg', 0);
  const showHard = tl.channel('showHard', 0);
  const mathU = tl.channel('mathU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the teacher's answer ————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A big model looks at a photo of a dog and answers with a distribution. At normal temperature the answer looks like certainty: dog, seventy eight percent, everything else crumbs.',
  });
  tl.tween(teachU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_TEACHER, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.2, 0.5);

  // — Beat 2 · turn up the temperature ——————————————————————————————————
  tl.caption({
    at: 6.7,
    dur: 5.8,
    text: 'Now divide the logits by a temperature of four before the softmax, and the crumbs become legible. Wolf, twenty two percent. Coyote, twenty. Toaster, six. Watch the distribution soften.',
    tex: 'p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}',
  });
  tl.tween(mathU, 1, { at: 7.2, dur: 0.7, ease: ease.enter });
  tl.tween(tempU, 1, { at: 7.6, dur: 2.4, ease: ease.move });
  tl.caption({
    at: 12.7,
    dur: 5.4,
    text: 'This is the dark knowledge. The teacher is not just saying dog. It is saying how much this dog resembles a wolf, and how certain it is that nothing here resembles a toaster.',
  });
  tl.tween(darkU, 1, { at: 13.2, dur: 0.8, ease: ease.enter });
  tl.hold(18.3, 0.6);

  // — Beat 3 · train the student on soft targets ————————————————————————
  tl.tween(cam, CAM_BOTH, { at: 18.9, dur: 1.4, ease: ease.move });
  tl.tween(darkU, 0.3, { at: 18.9, dur: 0.8, ease: ease.move });
  tl.caption({
    at: 19.3,
    dur: 5.6,
    text: 'Distillation trains a small student to match those soft probabilities. Here is a real student, four hundred steps of gradient descent, actually run: its distribution walks onto the teacher and locks.',
  });
  tl.tween(studU, 1, { at: 19.7, dur: 0.8, ease: ease.enter });
  tl.tween(softProg, SOFT_TRAJ.length - 1, { at: 20.5, dur: 5.5, ease: ease.linear });
  tl.caption({
    at: 25.3,
    dur: 4.6,
    text: 'By the end the student matches the teacher to three decimal places on every class — including the classes the photo is not. It inherited the whole similarity map.',
  });
  tl.hold(30.1, 0.6);

  // — Beat 4 · the hard-label control ————————————————————————————————————
  tl.caption({
    at: 30.7,
    dur: 5.6,
    text: 'Compare the control: the same student trained on the bare label, dog, one hundred percent. It converges too — to a spike. Wolf and toaster end up equally wrong, which is to say equally invisible.',
  });
  tl.tween(showHard, 1, { at: 31.2, dur: 0.8, ease: ease.move });
  tl.tween(hardProg, HARD_TRAJ.length - 1, { at: 31.6, dur: 4.5, ease: ease.linear });
  tl.caption({
    at: 36.5,
    dur: 5.2,
    text: 'One number per example versus a full distribution per example. That is why a distilled student generalizes better than one trained on labels alone: the teacher hands over its mistakes and near misses, not just its verdicts.',
  });
  tl.hold(41.9, 0.6);

  // — Beat 5 · close ———————————————————————————————————————————————————
  tl.tween(cam, CAMERA_HOME, { at: 42.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 43.1, dur: 1.1, ease: ease.move });
  tl.tween(mathU, 0, { at: 43.1, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 44.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 44.3,
    dur: 5.8,
    text: 'Distillation compresses a model by teaching, not copying: raise the temperature until the teacher thinks out loud, then train the student on the thinking. The verdict comes along for free.',
  });
  tl.hold(50.3, 1.2);

  return { tl, cam, teachU, tempU, darkU, studU, softProg, hardProg, showHard, mathU, dimU, endU };
}
