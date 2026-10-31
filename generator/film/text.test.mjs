// node --test generator/film/text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSpoken, displayWords, compileLexicon, speak, planChunks, alignChunk, draftWords, normWord } from './lib/text.mjs';

/** Fake ElevenLabs alignment: every character lasts 50 ms. */
function fakeAlignment(text, dt = 0.05) {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => +(i * dt).toFixed(3)),
    character_end_times_seconds: characters.map((_, i) => +((i + 1) * dt).toFixed(3)),
  };
}

test('sanitizeSpoken turns dashes into commas and tidies quotes', () => {
  assert.equal(sanitizeSpoken('It was — at last — “alive”…'), 'It was, at last, "alive"...');
  assert.equal(sanitizeSpoken('a -- b'), 'a, b');
});

test('displayWords splits on whitespace and dashes, strips outer punctuation', () => {
  assert.deepEqual(displayWords('In 1958, a “machine”—that could learn.'), ['In', '1958', 'a', 'machine', 'that', 'could', 'learn']);
  assert.deepEqual(displayWords("LeCun's fifty-eight [sighs] nets"), ["LeCun's", 'fifty-eight', 'nets']);
  assert.equal(normWord("LeCun's"), 'lecuns');
});

test('lexicon: single, possessive, multi-word and case-insensitive entries', () => {
  const lex = compileLexicon({ AlexNet: 'Alex Net', LeCun: 'luh-Kun', 'Frank Rosenblatt': 'Frank Rozen blatt', GPU: 'G P U' });
  const r = speak({ text: "AlexNet ran on a gpu; LeCun's nets, said Frank Rosenblatt." }, lex);
  assert.equal(r.spoken, "Alex Net ran on a G P U; luh-Kun's nets, said Frank Rozen blatt.");
  assert.deepEqual(
    r.words.map((w) => [w.w, w.n]),
    [['AlexNet', 2], ['ran', 1], ['on', 1], ['a', 1], ['gpu', 3], ["LeCun's", 1], ['nets', 1], ['said', 1], ['Frank', 3], ['Rosenblatt', 0]],
  );
  // array and {entries} forms
  assert.equal(compileLexicon([{ text: 'ReLU', spoken: 'ray-loo' }]).get('ReLU'), 'ray-loo');
  assert.equal(compileLexicon({ entries: { CUDA: 'koo-da' } }).get('CUDA'), 'koo-da');
});

test('explicit spoken text wins; word map only when counts agree', () => {
  const lex = compileLexicon({ AlexNet: 'Alex Net' });
  const same = speak({ text: 'Meet AlexNet', spoken: 'Meet Alexnet' }, lex);
  assert.equal(same.spoken, 'Meet Alexnet');
  assert.deepEqual(same.words.map((w) => w.n), [1, 1]);
  assert.equal(speak({ text: 'Meet AlexNet', spoken: 'Meet Alex Net' }, lex).words, null);
});

test('the lexicon also applies inside explicit spoken text (exact case), keeping the word map', () => {
  const lex = compileLexicon({ AlphaGo: 'Alpha Go', DeepSeek: 'Deep Seek' });
  const r = speak({ text: 'Seoul, 2016. AlphaGo played.', spoken: 'Seoul, twenty-sixteen. AlphaGo played.' }, lex);
  assert.equal(r.spoken, 'Seoul, twenty-sixteen. Alpha Go played.');
  assert.deepEqual(r.words.map((w) => [w.w, w.n]), [['Seoul', 1], ['2016', 1], ['AlphaGo', 2], ['played', 1]]);
  // an explicit re-cased or already respelled token is left alone
  assert.equal(speak({ text: 'DeepSeek', spoken: 'Deepseek' }, lex).spoken, 'Deepseek');
  assert.equal(speak({ text: 'DeepSeek', spoken: 'Deep Seek' }, lex).spoken, 'Deep Seek');
});

test('planChunks packs lines under the limit without splitting a line', () => {
  const lines = ['a'.repeat(500), 'b'.repeat(500), 'c'.repeat(300), 'd'.repeat(1500)].map((s, i) => ({ id: `L${i}`, spoken: s }));
  const ch = planChunks(lines, 1200);
  assert.deepEqual(ch.map((c) => c.lines.map((l) => l.id)), [['L0', 'L1'], ['L2'], ['L3']]);
  assert.equal(ch[0].text, `${'a'.repeat(500)}\n\n${'b'.repeat(500)}`);
  assert.ok(ch.slice(0, 2).every((c) => c.text.length <= 1200));
});

test('alignChunk: line spans and display-word spans from the character alignment', () => {
  const lex = compileLexicon({ AlexNet: 'Alex Net' });
  const lines = [
    { id: 'L1', text: 'In 1958, it learned.' },
    { id: 'L2', text: 'Then AlexNet won — easily.' },
  ].map((l) => ({ id: l.id, ...speak(l, lex) }));
  const chunk = planChunks(lines, 1200)[0];
  const al = fakeAlignment(chunk.text);
  const [a, b] = alignChunk(chunk.lines, al);
  assert.ok(a.matched && b.matched);
  // "In" = chars 0..1
  assert.deepEqual([a.start, a.end], [0, 0.95]);
  assert.deepEqual(a.words.map((w) => w.w), ['In', '1958', 'it', 'learned']);
  const off = chunk.text.indexOf('Then');
  assert.equal(b.start, +(off * 0.05).toFixed(3));
  const alex = b.words.find((w) => w.w === 'AlexNet');
  const i0 = chunk.text.indexOf('Alex Net');
  assert.equal(alex.start, +(i0 * 0.05).toFixed(3));
  assert.equal(alex.end, +((i0 + 'Alex Net'.length) * 0.05).toFixed(3));
  assert.deepEqual(b.words.map((w) => w.w), ['Then', 'AlexNet', 'won', 'easily']);
});

test('alignChunk reports unmatched lines instead of guessing', () => {
  const lines = [{ id: 'L1', spoken: 'hello there', words: null }];
  const [r] = alignChunk(lines, fakeAlignment('something else entirely'));
  assert.equal(r.matched, false);
});

test('draftWords paces words evenly at the requested rate', () => {
  const d = draftWords('one two three four five six', 120);
  assert.equal(d.words.length, 6);
  assert.equal(d.duration, 3);
  assert.ok(d.words.every((w, i) => i === 0 || w.start >= d.words[i - 1].end));
});
