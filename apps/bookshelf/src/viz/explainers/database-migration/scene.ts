import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * Database migration — the expand / migrate / contract pattern rendered as
 * one persistent table. Schema width, row coverage, and client traffic are
 * all pure functions of timeline channels, so every migration state scrubs.
 */

export const ROWS = [
  { id: 'U101', full: 'Ada Lovelace', first: 'Ada', last: 'Lovelace' },
  { id: 'U102', full: 'Grace Hopper', first: 'Grace', last: 'Hopper' },
  { id: 'U103', full: 'Edsger Dijkstra', first: 'Edsger', last: 'Dijkstra' },
  { id: 'U104', full: 'Margaret Hamilton', first: 'Margaret', last: 'Hamilton' },
  { id: 'U105', full: 'Barbara Liskov', first: 'Barbara', last: 'Liskov' },
];

export const TABLE = { x: 146, y: 148, w: 988, rowH: 62, headerH: 64 };
export const CAM_EXPAND: CameraState = { x: 720, y: 320, k: 1.18 };
export const CAM_TRAFFIC: CameraState = { x: 640, y: 330, k: 1.08 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('tableU', 0);
  const schemaU = tl.channel('schemaU', 0);
  const dualWriteU = tl.channel('dualWriteU', 0);
  const backfillU = tl.channel('backfillU', 0);
  const readShiftU = tl.channel('readShiftU', 0);
  const contractU = tl.channel('contractU', 0);
  const phaseU = tl.channel('phaseU', 0);
  const dimU = tl.channel('dimU', 0);
  const summaryU = tl.channel('summaryU', 0);

  // Beat 1 — start with a live schema, not an empty diagram.
  tl.caption({
    at: 0.4,
    dur: 4.6,
    text: 'A migration is not a file change. It is a period when old code, new code, and live rows must all remain valid.',
  });
  tl.tween(tableU, 1, { at: 0.5, dur: 1.4, ease: ease.enter });
  tl.hold(5.0, 0.7);

  // Beat 2 — expand without breaking old readers.
  tl.caption({
    at: 5.7,
    dur: 4.8,
    text: 'First, expand: add the new columns while the old column keeps serving every existing reader.',
  });
  tl.tween(cam, CAM_EXPAND, { at: 5.9, dur: 1.3, ease: ease.move });
  tl.tween(schemaU, 1, { at: 6.4, dur: 1.5, ease: ease.move });
  tl.tween(phaseU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.hold(10.6, 0.7);

  // Beat 3 — dual write closes the gap for new traffic.
  tl.caption({
    at: 11.3,
    dur: 4.8,
    text: 'Then deploy dual writes. New requests fill both representations, so the migration stops creating fresh debt.',
  });
  tl.tween(dualWriteU, 1, { at: 11.8, dur: 2.0, ease: ease.linear });
  tl.tween(phaseU, 2, { at: 12.4, dur: 0.8, ease: ease.enter });
  tl.hold(16.2, 0.7);

  // Beat 4 — backfill is measured row coverage.
  tl.caption({
    at: 16.9,
    dur: 5.2,
    text: 'Backfill the old rows in bounded batches. The useful number is coverage, not whether the job process is still running.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 17.0, dur: 1.2, ease: ease.move });
  tl.tween(backfillU, 1, { at: 17.7, dur: 4.2, ease: ease.linear });
  tl.tween(phaseU, 3, { at: 18.4, dur: 0.8, ease: ease.enter });
  tl.hold(22.4, 0.7);

  // Beat 5 — move reads only after the invariant is true.
  tl.caption({
    at: 23.1,
    dur: 5.0,
    text: 'Once coverage and consistency checks pass, shift reads to the new columns while old application versions drain away.',
  });
  tl.tween(cam, CAM_TRAFFIC, { at: 23.2, dur: 1.2, ease: ease.move });
  tl.tween(readShiftU, 1, { at: 23.8, dur: 3.2, ease: ease.linear });
  tl.tween(phaseU, 4, { at: 24.5, dur: 0.8, ease: ease.enter });
  tl.hold(28.2, 0.7);

  // Beat 6 — contract is last because it is the irreversible edge.
  tl.caption({
    at: 28.9,
    dur: 4.8,
    text: 'Contract comes last: remove the old column only when no deployed reader depends on it and rollback no longer needs it.',
  });
  tl.tween(contractU, 1, { at: 29.5, dur: 1.5, ease: ease.move });
  tl.tween(phaseU, 5, { at: 30.0, dur: 0.8, ease: ease.enter });
  tl.hold(33.8, 0.7);

  // Beat 7 — close on the operational invariant.
  tl.caption({
    at: 34.5,
    dur: 5.0,
    text: 'The safe sequence is asymmetric on purpose: additive steps first, verified movement in the middle, destructive cleanup at the end.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 34.6, dur: 1.2, ease: ease.move });
  tl.tween(dimU, 1, { at: 35.0, dur: 1.0, ease: ease.move });
  tl.tween(summaryU, 1, { at: 36.0, dur: 0.7, ease: ease.enter });
  tl.hold(39.6, 1.2);

  return {
    tl,
    cam,
    tableU,
    schemaU,
    dualWriteU,
    backfillU,
    readShiftU,
    contractU,
    phaseU,
    dimU,
    summaryU,
  };
}
