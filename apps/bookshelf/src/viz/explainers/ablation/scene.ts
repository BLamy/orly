import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';
import { FULL, NO_IND, NO_PREV, runCircuit } from '../induction-head/scene';

/**
 * Ablation — proof by removal.
 *
 * The same induction circuit as the previous chapter, with real knockouts
 * computed at module scope via the shared model code: the full circuit
 * copies the repeat 9 of 9; zeroing the previous-token head's output drops
 * it to 0 of 9 (composition severed — the induction head's keys go blank);
 * zeroing the induction head's output also gives 0 of 9. Meanwhile head 1's
 * own attention pattern is IDENTICAL under the induction knockout (its
 * weights don't depend on head 2) — the untouched behavior survives.
 */

export { FULL, NO_IND, NO_PREV, runCircuit };
export const SCORES = [
  { label: 'full circuit', ok: FULL.ok, tot: FULL.tot },
  { label: 'knock out head 1 (previous token)', ok: NO_PREV.ok, tot: NO_PREV.tot },
  { label: 'knock out head 2 (induction)', ok: NO_IND.ok, tot: NO_IND.tot },
];

// head 1's pattern is unchanged under head-2 ablation — verify at module scope
export const H1_UNCHANGED: boolean = (() => {
  for (let i = 1; i < FULL.A1.length; i++)
    for (let j = 0; j < FULL.A1[i].length; j++)
      if (Math.abs(FULL.A1[i][j] - NO_IND.A1[i][j]) > 1e-12) return false;
  return true;
})();

// layout: three mini circuit cards + score bars
export const CARDS = [
  { x: 90, y: 120, w: 340, h: 250 },
  { x: 470, y: 120, w: 340, h: 250 },
  { x: 850, y: 120, w: 340, h: 250 },
];
export const BARS = { x: 250, y: 460, w: 560, rowH: 52, scale: 60 };

export const CAM_CARDS: CameraState = { x: 400, y: 300, k: 1.15 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  card0U: ChannelRef<number>;
  card1U: ChannelRef<number>;
  card2U: ChannelRef<number>;
  barsProg: ChannelRef<number>; // 0..3 score bars
  surviveU: ChannelRef<number>; // "head 1 pattern identical" chip
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const card0U = tl.channel('card0U', 0);
  const card1U = tl.channel('card1U', 0);
  const card2U = tl.channel('card2U', 0);
  const barsProg = tl.channel('barsProg', 0);
  const surviveU = tl.channel('surviveU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the epistemics ———————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Last chapter we read an algorithm off two attention heads, and it looked convincing. Be suspicious of that feeling. Attention patterns are cheap to admire; the claim that the circuit truly causes the behavior is expensive.',
  });
  tl.tween(card0U, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_CARDS, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 6.5,
    dur: 4.8,
    text: 'The standard of proof in interpretability is intervention: reach in, delete the part, and watch whether exactly the predicted behavior dies, and nothing else. So let us break our own story, twice.',
  });
  tl.hold(11.5, 0.5);

  // — Beat 2 · ablate head 1 ————————————————————————————————————————————————
  tl.caption({
    at: 12.0,
    dur: 5.8,
    text: 'Knockout one: zero the output of the previous token head, the humble one. The induction head is untouched, but its keys have gone blank; there are no notes left to match. Copying collapses from nine of nine to zero.',
  });
  tl.tween(card1U, 1, { at: 12.8, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 18.0,
    dur: 4.6,
    text: 'That is the composition claim, proven. Head two does not merely sit above head one; it is downstream of it, and severing the wire kills the behavior end to end.',
  });
  tl.hold(22.8, 0.5);

  // — Beat 3 · ablate head 2 ————————————————————————————————————————————————
  tl.caption({
    at: 23.3,
    dur: 5.4,
    text: 'Knockout two: restore head one and instead zero the induction head. Head one still writes its notes faithfully, its attention pattern is bit for bit identical, but nobody reads them. Zero of nine again.',
  });
  tl.tween(card2U, 1, { at: 24.1, dur: 1.2, ease: ease.enter });
  tl.tween(surviveU, 1, { at: 27.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 28.9,
    dur: 4.8,
    text: 'And the survival matters as much as the death. The knockout was surgical: it destroyed the copying and left the upstream behavior standing. Broad damage would prove nothing.',
  });
  tl.hold(33.9, 0.5);

  // — Beat 4 · the scoreboard ———————————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 34.4, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 34.6,
    dur: 5.4,
    text: 'The scoreboard, all computed: nine of nine with the circuit whole, zero with either head gone. Necessity of both parts, direction of the wiring, specificity of the damage. That is what proof looks like here.',
  });
  tl.tween(barsProg, 3, { at: 35.2, dur: 2.8, ease: ease.move });
  tl.caption({
    at: 40.2,
    dur: 5.6,
    text: 'Hold this standard everywhere in this book. It should take little evidence to suspect a circuit story is wrong, and this much evidence, removal, collapse, survival, before you believe it is right.',
  });
  tl.hold(46.0, 0.5);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 46.5, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 47.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 47.7,
    dur: 6.0,
    text: 'That closes the tour: features are directions, superposition crowds them, sparse autoencoders unmix them, circuits compose them into algorithms, and ablation is how any of it earns the word proof.',
  });
  tl.hold(53.9, 1.2);

  return { tl, cam, card0U, card1U, card2U, barsProg, surviveU, dimU, endU };
}
