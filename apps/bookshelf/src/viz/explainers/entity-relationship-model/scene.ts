import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * Entity-relationship model — a generic teaching scene for turning repeated
 * records into entities, keys, cardinalities, and a concrete join path.
 * The example domain is intentionally familiar and self-contained: customers,
 * orders, and products. Every token position is precomputed at module scope.
 */

export type EntityKind = 'customer' | 'order' | 'product';

export interface FieldToken {
  id: string;
  kind: EntityKind;
  value: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  duplicate?: boolean;
}

const ROW_Y = [178, 256, 334, 412];

export const TOKENS: FieldToken[] = [
  { id: 'c-101-a', kind: 'customer', value: 'Ada · C101', source: { x: 300, y: ROW_Y[0] }, target: { x: 268, y: 246 } },
  { id: 'o-501', kind: 'order', value: 'O501 · C101', source: { x: 620, y: ROW_Y[0] }, target: { x: 626, y: 222 } },
  { id: 'p-9-a', kind: 'product', value: 'P9 · Keyboard', source: { x: 944, y: ROW_Y[0] }, target: { x: 988, y: 230 } },
  { id: 'c-101-b', kind: 'customer', value: 'Ada · C101', source: { x: 300, y: ROW_Y[1] }, target: { x: 268, y: 246 }, duplicate: true },
  { id: 'o-502', kind: 'order', value: 'O502 · C101', source: { x: 620, y: ROW_Y[1] }, target: { x: 626, y: 278 } },
  { id: 'p-4-a', kind: 'product', value: 'P4 · Mouse', source: { x: 944, y: ROW_Y[1] }, target: { x: 988, y: 286 } },
  { id: 'c-204', kind: 'customer', value: 'Lin · C204', source: { x: 300, y: ROW_Y[2] }, target: { x: 268, y: 302 } },
  { id: 'o-503', kind: 'order', value: 'O503 · C204', source: { x: 620, y: ROW_Y[2] }, target: { x: 626, y: 334 } },
  { id: 'p-9-b', kind: 'product', value: 'P9 · Keyboard', source: { x: 944, y: ROW_Y[2] }, target: { x: 988, y: 230 }, duplicate: true },
  { id: 'c-101-c', kind: 'customer', value: 'Ada · C101', source: { x: 300, y: ROW_Y[3] }, target: { x: 268, y: 246 }, duplicate: true },
  { id: 'o-504', kind: 'order', value: 'O504 · C101', source: { x: 620, y: ROW_Y[3] }, target: { x: 626, y: 390 } },
  { id: 'p-7', kind: 'product', value: 'P7 · Webcam', source: { x: 944, y: ROW_Y[3] }, target: { x: 988, y: 342 } },
];

export const TABLES = {
  customer: { x: 118, y: 156, w: 300, h: 238, title: 'customers', key: 'PK customer_id' },
  order: { x: 474, y: 132, w: 304, h: 326, title: 'orders', key: 'PK order_id · FK customer_id' },
  product: { x: 842, y: 156, w: 292, h: 238, title: 'products', key: 'PK product_id' },
} as const;

export const CAM_CUSTOMER_ORDER: CameraState = { x: 450, y: 310, k: 1.32 };
export const CAM_JOIN: CameraState = { x: 640, y: 322, k: 1.1 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const recordsU = tl.channel('recordsU', 0);
  const tableU = tl.channel('tableU', 0);
  const normalizeU = tl.channel('normalizeU', 0);
  const dedupeU = tl.channel('dedupeU', 0);
  const relationU = tl.channel('relationU', 0);
  const customerFocus = tl.channel('customerFocus', 0);
  const joinU = tl.channel('joinU', 0);
  const dimU = tl.channel('dimU', 0);
  const summaryU = tl.channel('summaryU', 0);

  // Beat 1 — repeated facts masquerade as a model.
  tl.caption({
    at: 0.4,
    dur: 4.6,
    text: 'A flat record looks convenient until the same customer and product are copied into every order.',
  });
  tl.tween(recordsU, 1, { at: 0.5, dur: 1.4, ease: ease.enter });
  tl.hold(5.0, 0.7);

  // Beat 2 — the records separate into stable entities.
  tl.caption({
    at: 5.7,
    dur: 5.0,
    text: 'An entity relationship model asks which facts have their own identity, then lets each fact live once.',
  });
  tl.tween(tableU, 1, { at: 6.0, dur: 1.0, ease: ease.draw });
  tl.tween(normalizeU, 1, { at: 6.8, dur: 2.2, ease: ease.move });
  tl.tween(dedupeU, 1, { at: 8.7, dur: 0.8, ease: ease.enter });
  tl.hold(10.8, 0.7);

  // Beat 3 — keys make relationships executable.
  tl.caption({
    at: 11.5,
    dur: 5.2,
    text: 'Primary keys name the entities. Foreign keys turn the lines between them into constraints the database can enforce.',
  });
  tl.tween(relationU, 1, { at: 12.0, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_CUSTOMER_ORDER, { at: 12.6, dur: 1.3, ease: ease.move });
  tl.tween(customerFocus, 1, { at: 13.8, dur: 0.6, ease: ease.enter });
  tl.hold(16.8, 0.7);

  // Beat 4 — cardinality is a promise about how many matches are legal.
  tl.caption({
    at: 17.5,
    dur: 4.8,
    text: 'One customer can own many orders, while each order points back to exactly one customer.',
  });
  tl.tween(customerFocus, 0, { at: 20.5, dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_JOIN, { at: 20.7, dur: 1.3, ease: ease.move });
  tl.hold(22.4, 0.6);

  // Beat 5 — follow a real join through the model.
  tl.caption({
    at: 23.0,
    dur: 5.2,
    text: 'A query now follows identifiers instead of trusting copied text: customer to order, then order to product.',
  });
  tl.tween(joinU, 1, { at: 23.4, dur: 3.8, ease: ease.linear });
  tl.hold(28.2, 0.7);

  // Beat 6 — close on the reusable review questions.
  tl.caption({
    at: 28.9,
    dur: 5.0,
    text: 'A useful model review checks four things: identity, ownership, cardinality, and the path each important query must travel.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 29.0, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 29.8, dur: 1.0, ease: ease.move });
  tl.tween(summaryU, 1, { at: 30.8, dur: 0.7, ease: ease.enter });
  tl.hold(34.0, 1.2);

  return {
    tl,
    cam,
    recordsU,
    tableU,
    normalizeU,
    dedupeU,
    relationU,
    customerFocus,
    joinU,
    dimU,
    summaryU,
  };
}
