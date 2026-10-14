// node --test generator/film/split.test.mjs — cutting lines out of a multi-line take (lib/split.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { envelope, cutLine, edgePeaks, boundary, isCutEdge, EDGE_DB } from './lib/split.mjs';

const SR = 8000;
/** a synthetic take: [ [from, to, amp] … ] tones on a -80 dBFS floor */
function take(dur, segs) {
  const pcm = new Float32Array(Math.round(dur * SR));
  for (let i = 0; i < pcm.length; i++) pcm[i] = 1e-4 * Math.sin(i * 1.7);
  for (const [a, b, amp] of segs) for (let i = Math.round(a * SR); i < Math.round(b * SR); i++) pcm[i] = amp * Math.sin((2 * Math.PI * 220 * i) / SR);
  return pcm;
}

test('the boundary is the first silence after line A; a breath before line B goes with B', () => {
  // A speaks to 1.00 (aligned end 1.03: the alignment runs late), silence, a breath 1.20-1.40, silence, B from 1.50
  const pcm = take(3, [[0.1, 1.0, 0.5], [1.2, 1.4, 0.03], [1.5, 2.8, 0.5]]);
  const env = envelope(pcm, SR);
  const r = boundary(env, 1.03, 1.52);
  assert.ok(r.a >= 0.99 && r.b <= 1.21, `boundary ${JSON.stringify(r)}`);
  const al = [{ matched: true, start: 0.1, end: 1.03 }, { matched: true, start: 1.52, end: 2.8 }];
  const A = cutLine(env, 3, al, 0);
  const B = cutLine(env, 3, al, 1);
  assert.equal(A.tailHow, 'gap');
  assert.ok(A.ce < 1.2, 'A ends before the breath');
  assert.ok(B.cs <= 1.2 && B.cs > 1.0, 'B starts inside the same silence, keeping its breath');
  const edges = edgePeaks(pcm.slice(Math.round(A.cs * SR), Math.round(A.ce * SR)), SR);
  assert.ok(edges.tail < EDGE_DB, `A's tail edge ${edges.tail}`);
  assert.ok(isCutEdge(A.tailHow) && !isCutEdge('take-start'));
});

test('no silence between two lines: min-energy cut, flagged dirty', () => {
  const pcm = take(2, [[0.1, 1.0, 0.5], [1.0, 1.9, 0.4]]);
  const env = envelope(pcm, SR);
  const al = [{ matched: true, start: 0.1, end: 0.98 }, { matched: true, start: 1.02, end: 1.9 }];
  const A = cutLine(env, 2, al, 0);
  assert.equal(A.tailHow, 'min-energy');
  assert.equal(A.tailDirty, true);
});

test('take boundaries: pre-roll pad when the speech starts at sample 0; stray sound before the aligned start is dirty', () => {
  const env0 = envelope(take(2, [[0, 1.5, 0.5]]), SR);
  const a = cutLine(env0, 2, [{ matched: true, start: 0.0, end: 1.5 }], 0);
  assert.equal(a.headHow, 'take-start');
  assert.equal(a.headDirty, false);
  assert.ok(Math.abs(a.pad - 0.12) < 1e-9);
  const env1 = envelope(take(2, [[0, 0.3, 0.3], [0.3, 1.5, 0.5]]), SR);
  const b = cutLine(env1, 2, [{ matched: true, start: 0.3, end: 1.5 }], 0);
  assert.equal(b.headDirty, true);
});
