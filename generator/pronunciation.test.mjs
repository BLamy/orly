import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeSpoken } from './tts.mjs';
import { speechify } from '../apps/bookshelf/src/viz/engine/narrator/index.ts';

test('recorded and browser voices pronounce rrweb without changing the caption', () => {
  const caption = 'An rrweb recording describes the page.';
  for (const normalize of [sanitizeSpoken, speechify]) {
    assert.equal(normalize(caption), 'An r r web recording describes the page.');
    assert.equal(normalize('RRWEB and rrwebbed'), 'r r web and rrwebbed');
    assert.equal(normalize('Replay recordings remain separate.'), 'Replay recordings remain separate.');
  }
  assert.equal(caption, 'An rrweb recording describes the page.');
});
