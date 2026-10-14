// node --test apps/bookshelf/src/viz/film/silhouette/metaphors/xorRule.test.mjs
// The XOR plate in perceptron-short ch01-s03 animates a failure; it must be a REAL one (claim limit-linear).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trainXor, XOR_CASES } from './xorRule.ts';

test('a single threshold unit trained with the perceptron rule never answers all four XOR cases', () => {
  for (const eta of [1, 0.5, 0.25]) {
    const run = trainXor(4000, eta); // 1000 epochs: far more than any shot shows (ch01-s03 shows < 40 tries)
    assert.equal(run.steps.length, 4000);
    for (const s of run.steps) assert.ok(s.score < 4, `eta ${eta}: converged at a try (score ${s.score})`);
    // and it keeps making mistakes in every epoch (it never settles)
    for (let e = 0; e < 1000; e++) assert.ok(run.steps.slice(e * 4, e * 4 + 4).some((s) => s.error), `eta ${eta}: epoch ${e} had no mistake`);
  }
});

test('the rule itself is Rosenblatt\'s: weights move only on mistakes, by eta x target x input', () => {
  const run = trainXor(40, 1);
  for (const s of run.steps) {
    if (!s.error) assert.deepEqual(s.wAfter, s.wBefore);
    else {
      const [a, b] = s.x;
      assert.deepEqual(s.wAfter, [s.wBefore[0] + s.target * a, s.wBefore[1] + s.target * b, s.wBefore[2] + s.target]);
    }
    const [a, b] = s.x;
    assert.equal(XOR_CASES.some(([p, q, t]) => p === a && q === b && t === s.target), true);
  }
});
