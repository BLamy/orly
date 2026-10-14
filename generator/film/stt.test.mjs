// Unit tests: STT term matching (lib/stt.mjs) and per-line level offsets (lib/levels.mjs). Pure, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normText, matchTerms, sttTargets, wordErrorRate, castNames, soundKey, recordState, recordPass } from './lib/stt.mjs';
import { levelOffsets, median } from './lib/levels.mjs';
import { compileLexicon } from './lib/text.mjs';

test('normText folds number words and years to digits', () => {
  assert.deepEqual(normText('In nineteen sixty-nine, Minsky'), ['in', '1969', 'minsky']);
  assert.deepEqual(normText('the Mark One'), ['the', 'mark', '1']);
  assert.deepEqual(normText('twenty by twenty'), ['20', 'by', '20']);
});

test('matchTerms accepts written or spoken forms, as whole words', () => {
  const terms = [{ term: 'Mark I', accept: ['Mark I', 'Mark One'] }, { term: 'Rosenblatt', accept: ['Rosenblatt'] }];
  assert.deepEqual(matchTerms('It was the Mark 1 Perceptron ... Frank Rosenblatt', terms).map((x) => x.found), [true, true]);
  assert.deepEqual(matchTerms('the Mark Perceptron, Frank Rosenblat', terms).map((x) => x.found), [false, false]);
});

test('sttTargets: lines where a lexicon entry fires, plus qa.stt required', () => {
  const lex = compileLexicon({ Papert: 'Pappert', 1969: 'nineteen sixty-nine' });
  const script = { chapters: [{ shots: [{ id: 's1', lines: [
    { id: 'A', text: 'In 1969, Minsky and Papert.' },
    { id: 'B', text: 'Frank Rosenblatt.', qa: { stt: 'required', expect: ['Rosenblatt'] } },
    { id: 'C', text: 'Nothing to check.' },
  ] }] }] };
  const t = sttTargets(script, lex);
  assert.deepEqual(t.map((x) => x.lineId), ['A', 'B']);
  assert.deepEqual(t[0].terms.map((x) => x.term).sort(), ['1969', 'Papert']);
});

test('sttTargets: explicit spoken lines and every line naming a cast member; names match leniently', () => {
  const lex = compileLexicon({ AlphaGo: 'Alpha Go' });
  const script = { cast: [{ name: 'Sepp Hochreiter' }, { name: 'Geoffrey Hinton (2000s–2020s)' }, { name: 'Newspaper boy' }], chapters: [{ shots: [{ id: 's1', lines: [
    { id: 'A', text: 'Seoul. AlphaGo played.', spoken: 'Seoul. AlphaGo played.' },
    { id: 'B', text: "Hochreiter's pipe carried it.", spoken: 'In 1997, Hochreiter carried it.' },
    { id: 'C', text: 'A newspaper boy.' },
  ] }] }] };
  const t = sttTargets(script, lex);
  assert.deepEqual(t.map((x) => x.lineId), ['A', 'B']);
  const hb = t[1].terms;
  assert.equal(hb[0].term, 'Hochreiter');
  // review round 3: a near spelling is reported (near) but never passes; the literal form does
  assert.deepEqual(matchTerms('In 1997, Hockreiter carried it.', hb).map((x) => [x.found, !!x.near]), [[false, true]]);
  assert.deepEqual(matchTerms('In 1997, Hochreiter carried it.', hb).map((x) => x.found), [true]);
  assert.deepEqual(matchTerms('In 1997, the writer carried it.', hb).map((x) => [x.found, !!x.near]), [[false, false]]);
  // sound keys: an RP reading heard by the transcriber with another spelling
  assert.equal(soundKey('LeCun'), soundKey('La Kun'));
  assert.equal(soundKey('Amodei'), soundKey('Ahmadai'));
  assert.equal(soundKey('Lenat'), soundKey('Lennart'));
  assert.notEqual(soundKey('Hinton'), soundKey('Benton'));
  assert.deepEqual(matchTerms("Hochreiter and Schmidhuber's pipe", [{ term: 'Schmidhuber', accept: ['Schmidhuber'] }]).map((x) => x.found), [true]);
});

test('wordErrorRate', () => {
  assert.equal(wordErrorRate('a b c d', 'a b c d'), 0);
  assert.equal(wordErrorRate('a b c d', 'a x c d'), 0.25);
});

test('levelOffsets: offset from the median of the OTHER lines', () => {
  const lv = levelOffsets({ L1: -19.5, L2: -14.5, L3: -14.5, L4: -16, L5: -14.5, L6: -14.5 }, { L1: -5, L4: -1.5 });
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(lv.L1.offsetDb, -5);
  assert.equal(lv.L1.errorDb, 0);
  assert.equal(lv.L4.offsetDb, -1.5);
  assert.equal(lv.L2.errorDb, 0);
});

test('literal accept forms: Ahmoudai fails for Amodei; a human-judged heard form (sttHeard) passes', () => {
  const lex = compileLexicon({ Amodei: 'Ah-moh-day', LeCun: 'Le Cun' });
  const script = { chapters: [{ shots: [{ id: 's1', lines: [{ id: 'A', text: 'Dario Amodei.' }, { id: 'B', text: 'LeCun spoke.' }] }] }] };
  const [a, b] = sttTargets(script, lex, { heard: { LeCun: ['Le Kun'] } });
  assert.deepEqual(matchTerms('Dario Ahmoudai.', a.terms).map((x) => x.found), [false]);
  assert.deepEqual(matchTerms('Dario Amodei.', a.terms).map((x) => x.found), [true]);
  assert.deepEqual(matchTerms('Jan Le Kun spoke.', b.terms).map((x) => x.found), [true]);
});

test('recordState: a record of an older take is stale even when the clip file sig matches nothing', () => {
  const P = { dir: '/nonexistent' };
  assert.equal(recordState(P, null, { sig: 'x' }), 'missing');
  assert.equal(recordState(P, { lineSig: 'old', sig: 'a' }, { sig: 'new' }), 'stale-take');
  assert.equal(recordPass('', [], 0), false);
  assert.equal(recordPass('the right words', [], 0.1), true);
  assert.equal(recordPass('other words entirely', [], 0.9), false);
});
