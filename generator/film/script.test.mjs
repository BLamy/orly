import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, readSec } from './script.mjs';

const shot = (over = {}) => ({
  id: 'ch01-s01', kind: 'scene', mood: 'duskRose', setting: 'a lab', visual: 'A long enough visual direction for the validator to accept it.',
  lines: [{ id: 'L1', text: 'one two three four five six seven' }], beats: [], claims: ['c1'], ...over,
});
const film = (shots, meta = {}) => ({ title: 'T', logline: 'L', cast: [], chapters: [{ id: 'ch01', number: 1, title: 'C', shots }], ...meta });

test('readSec follows the chars/12 + 1.5 house rule', () => {
  assert.equal(readSec('x'.repeat(24)), 3.5);
});

test('text cued at the last word of a short shot is unreadable', () => {
  const s = shot({ beats: [{ id: 'b1', at: { line: 'L1', word: 'seven' }, what: 'label' }], onScreenText: [{ kind: 'label', text: 'x'.repeat(100), beat: 'b1' }] });
  const { errors } = validate(film([s]), { wpm: 140 });
  assert.ok(errors.some((e) => e.includes('unreadable')), errors.join('\n'));
});

test('short text with a long hold passes', () => {
  const s = shot({ holdAfter: 6, onScreenText: [{ kind: 'date', text: '1958' }] });
  const { errors, warnings } = validate(film([s]), { wpm: 140 });
  assert.deepEqual(errors, []);
  assert.ok(!warnings.some((w) => w.includes('reading time')));
});

test("text carried out of frame early is measured to its 'until' beat", () => {
  const beats = [{ id: 'in', at: { shotTime: 0.2 }, what: 'label in' }, { id: 'pan', at: { shotTime: 1.0 }, what: 'pan away' }];
  const long = shot({ holdAfter: 10, beats, onScreenText: [{ kind: 'label', text: 'x'.repeat(60), beat: 'in' }] });
  assert.deepEqual(validate(film([long]), { wpm: 140 }).errors, []);
  const carried = shot({ holdAfter: 10, beats, onScreenText: [{ kind: 'label', text: 'x'.repeat(60), beat: 'in', until: 'pan' }] });
  assert.ok(validate(film([carried]), { wpm: 140 }).errors.some((e) => e.includes('unreadable') && e.includes('until')));
  const missing = shot({ beats, onScreenText: [{ kind: 'label', text: 'x', beat: 'in', until: 'nope' }] });
  assert.ok(validate(film([missing]), { wpm: 140 }).errors.some((e) => e.includes("'until' beat \"nope\"")));
});

test('runtime over target warns, over the ceiling fails', () => {
  const s = shot({ minDuration: 100 });
  assert.ok(validate(film([s], { runtimeTargetSec: 95 }), { wpm: 140 }).warnings.some((w) => w.startsWith('runtime')));
  assert.ok(validate(film([s], { runtimeTargetSec: 60 }), { wpm: 140 }).errors.some((e) => e.startsWith('runtime')));
  assert.ok(!validate(film([s], { runtimeTargetSec: 120 }), { wpm: 140 }).warnings.some((w) => w.startsWith('runtime')));
});

test("edge 'end' on a word resolves to the word's end, and a beat past the shot's end is an error", () => {
  // 7 words at 140 wpm = 3.0 s of speech; leadIn 0.6; word 'seven' (index 6) ends at 3.6 s
  const late = shot({ holdAfter: 0.5, beats: [{ id: 'b', at: { line: 'L1', word: 'seven', edge: 'end', offset: 0.6 }, what: 'x' }] });
  assert.ok(validate(film([late]), { wpm: 140 }).errors.some((e) => e.includes('beat b: resolves at 4.20s, after the shot ends (4.10s)')));
  const ok = shot({ holdAfter: 1.0, beats: [{ id: 'b', at: { line: 'L1', word: 'seven', edge: 'end', offset: 0.3 }, what: 'x' }] });
  assert.ok(!validate(film([ok]), { wpm: 140 }).errors.some((e) => e.includes('beat b')));
});

test('quote integrity: a re-spelled quote, a drifted quotes.json and dropped quotation marks all fail', async () => {
  const { checkQuotes } = await import('./script.mjs');
  const quotes = [{ id: 'q-lecun-checks', text: 'It is deployed commercially and reads several million checks per day.' }];
  const lock = { 'q-lecun-checks': quotes[0].text };
  const line = (text, spoken) => ({ chapters: [{ shots: [{ id: 's', lines: [{ id: 'L1', text, ...(spoken ? { spoken } : {}) }] }] }] });
  assert.deepEqual(checkQuotes(line('A descendant “reads several million checks per day.”', 'By nineteen ninety-eight, a descendant “reads several million checks per day.”'), { quotes, quotesLock: lock }), []);
  assert.equal(checkQuotes(line('A descendant “reads several million cheques per day.”'), { quotes, quotesLock: lock }).length, 1);
  assert.equal(checkQuotes(line('x'), { quotes: [{ ...quotes[0], text: quotes[0].text.replace('checks', 'cheques') }], quotesLock: lock }).length, 1);
  assert.match(checkQuotes(line('A descendant “reads several million checks per day.”', 'A descendant reads several million checks per day.'), { quotes, quotesLock: lock })[0], /drops quotation marks/);
  assert.match(checkQuotes(line('A descendant “reads several million checks per day.”', 'A descendant “reads several million cheques per day.”'), { quotes, quotesLock: lock })[0], /changes quoted words \(checks\)/);
});
