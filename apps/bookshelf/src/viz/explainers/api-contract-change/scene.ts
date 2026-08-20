import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * API contract change — one response document evolves through additive,
 * breaking, and bridged states while two client generations stay visible.
 * The compatibility matrix and traffic split are derived from sampled state.
 */

export const RESPONSE_FIELDS = [
  { key: 'id', value: '"usr_42"', required: true },
  { key: 'name', value: '"Ada"', required: true },
  { key: 'email', value: '"ada@example.dev"', required: true },
];

export const CAM_CONTRACT: CameraState = { x: 740, y: 330, k: 1.18 };
export const CAM_MATRIX: CameraState = { x: 640, y: 342, k: 1.06 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const baseU = tl.channel('baseU', 0);
  const requestU = tl.channel('requestU', 0);
  const additiveU = tl.channel('additiveU', 0);
  const breakingU = tl.channel('breakingU', 0);
  const adapterU = tl.channel('adapterU', 0);
  const trafficU = tl.channel('trafficU', 0);
  const testU = tl.channel('testU', 0);
  const dimU = tl.channel('dimU', 0);
  const summaryU = tl.channel('summaryU', 0);

  // Beat 1 — the response is a promise shared with code you do not deploy.
  tl.caption({
    at: 0.4,
    dur: 4.8,
    text: 'An application programming interface is a promise to clients that may update long after the server does.',
  });
  tl.tween(baseU, 1, { at: 0.5, dur: 1.3, ease: ease.enter });
  tl.tween(requestU, 1, { at: 1.4, dur: 1.8, ease: ease.linear });
  tl.hold(5.2, 0.7);

  // Beat 2 — additive optional data preserves old readers.
  tl.caption({
    at: 5.9,
    dur: 4.8,
    text: 'Adding an optional field is usually compatible: new clients can use it, while old clients safely ignore what they do not know.',
  });
  tl.tween(cam, CAM_CONTRACT, { at: 6.0, dur: 1.3, ease: ease.move });
  tl.tween(additiveU, 1, { at: 6.7, dur: 0.7, ease: ease.enter });
  tl.hold(10.8, 0.7);

  // Beat 3 — a direct rename breaks the wire contract.
  tl.caption({
    at: 11.5,
    dur: 5.0,
    text: 'A rename is different. If the server replaces name with display name, the old client still asks for a field that vanished.',
  });
  tl.tween(breakingU, 1, { at: 12.0, dur: 1.2, ease: ease.move });
  tl.hold(16.6, 0.7);

  // Beat 4 — bridge the versions instead of coordinating a flag day.
  tl.caption({
    at: 17.3,
    dur: 5.2,
    text: 'A version adapter removes the flag day. Version two speaks the new shape; version one receives a translated response.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 17.4, dur: 1.2, ease: ease.move });
  tl.tween(adapterU, 1, { at: 18.0, dur: 1.0, ease: ease.enter });
  tl.tween(requestU, 2, { at: 18.7, dur: 2.6, ease: ease.linear });
  tl.hold(22.6, 0.7);

  // Beat 5 — move traffic while both contracts are observed.
  tl.caption({
    at: 23.3,
    dur: 5.0,
    text: 'Now shift traffic gradually. Error rate, unknown fields, and version usage tell you whether the contract works outside the happy path.',
  });
  tl.tween(trafficU, 1, { at: 23.8, dur: 3.4, ease: ease.linear });
  tl.hold(28.4, 0.7);

  // Beat 6 — compatibility tests make the supported matrix explicit.
  tl.caption({
    at: 29.1,
    dur: 5.0,
    text: 'Contract tests pin the compatibility matrix: every supported client version against every response shape you still serve.',
  });
  tl.tween(cam, CAM_MATRIX, { at: 29.2, dur: 1.2, ease: ease.move });
  tl.tween(testU, 1, { at: 29.8, dur: 1.6, ease: ease.enter });
  tl.hold(34.2, 0.7);

  // Beat 7 — close on the decision framework.
  tl.caption({
    at: 34.9,
    dur: 5.2,
    text: 'Classify the change, bridge incompatible shapes, observe real usage, and retire an old version only when its traffic reaches zero.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 35.0, dur: 1.2, ease: ease.move });
  tl.tween(dimU, 1, { at: 35.5, dur: 1.0, ease: ease.move });
  tl.tween(summaryU, 1, { at: 36.5, dur: 0.7, ease: ease.enter });
  tl.hold(40.3, 1.2);

  return {
    tl,
    cam,
    baseU,
    requestU,
    additiveU,
    breakingU,
    adapterU,
    trafficU,
    testU,
    dimU,
    summaryU,
  };
}
